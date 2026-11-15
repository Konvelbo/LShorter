import { Encoder, type DitherMethod } from "modern-gif";
import type {
  GifWorkerRequest,
  GifWorkerResponse,
} from "./gif-encoder.worker";

export interface ExportGifOptions {
  width: number;
  height: number;
  scale?: number;
  totalFrames: number;
  delayMs: number;
  durationSec: number;
  maxColors?: number;
  dither?: DitherMethod;
  orderedDither?: boolean;
  tintRgb?: [number, number, number];
  cleanCornerAlpha?: boolean;
  renderFrame: (ctx: CanvasRenderingContext2D, timeSec: number) => void;
  onProgress?: (percent: number) => void;
}

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never;
export type GifWorkerCommand = DistributiveOmit<GifWorkerRequest, "id">;

interface PendingRpc {
  resolve: (buffer?: ArrayBuffer) => void;
  reject: (err: Error) => void;
}

class ManagedGifWorker {
  private worker: Worker;
  private nextId = 1;
  private pending = new Map<number, PendingRpc>();

  constructor() {
    this.worker = new Worker(new URL("./gif-encoder.worker.ts", import.meta.url), {
      type: "module",
    });

    this.worker.onmessage = (event: MessageEvent<GifWorkerResponse>) => {
      const msg = event.data;
      const entry = this.pending.get(msg.id);
      if (!entry) return;
      this.pending.delete(msg.id);
      if (msg.ok) {
        entry.resolve(msg.buffer);
      } else {
        entry.reject(new Error(msg.error));
      }
    };

    this.worker.onerror = (event) => {
      const error = new Error(event.message || "GIF Web Worker crashed");
      this.pending.forEach((entry) => entry.reject(error));
      this.pending.clear();
    };
  }

  request(
    msg: GifWorkerCommand,
    transfer: Transferable[] = [],
    timeoutMs: number = 45000
  ): Promise<ArrayBuffer | undefined> {
    const id = this.nextId++;
    const fullMsg = { ...msg, id } as GifWorkerRequest;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.delete(id)) {
          reject(new Error(`GIF worker request "${msg.type}" timed out`));
        }
      }, timeoutMs);

      this.pending.set(id, {
        resolve: (buf) => {
          clearTimeout(timer);
          resolve(buf);
        },
        reject: (err) => {
          clearTimeout(timer);
          reject(err);
        },
      });
      this.worker.postMessage(fullMsg, transfer);
    });
  }

  terminate(): void {
    this.pending.forEach((entry) =>
      entry.reject(new Error("GIF worker terminated before completion"))
    );
    this.pending.clear();
    this.worker.terminate();
  }
}

async function waitForFontsSafe(): Promise<void> {
  if (typeof document === "undefined" || !document.fonts?.ready) return;
  try {
    await Promise.race([
      document.fonts.ready.then(() => undefined),
      new Promise<void>((resolve) => setTimeout(resolve, 1500)),
    ]);
  } catch {
    // Proceed even if a remote stylesheet font failed to load
  }
}

const BAYER_4X4 = [
  -7, 1, -5, 3,
  5, -3, 7, -1,
  -4, 4, -6, 2,
  8, 0, 6, -2,
];

/**
 * Applies lightweight 4x4 ordered Bayer dithering in-place (O(1) per pixel)
 * while leaving solid black/white pixels crisp so QR code contrast stays untouched.
 */
export function applyOrderedBayerDither(
  data: Uint8ClampedArray,
  width: number,
  height: number
): void {
  for (let y = 0; y < height; y++) {
    const rowOff = (y & 3) * 4;
    const yIdx = y * width;
    for (let x = 0; x < width; x++) {
      const p = (yIdx + x) * 4;
      if (data[p + 3] < 250) continue;

      const r = data[p];
      const g = data[p + 1];
      const b = data[p + 2];
      // Preserve crisp flat card/foreground black & white QR tones without grain
      if ((r > 246 && g > 246 && b > 246) || (r < 10 && g < 10 && b < 10)) {
        continue;
      }

      const delta = BAYER_4X4[rowOff + (x & 3)];
      data[p] = r + delta;
      data[p + 1] = g + delta;
      data[p + 2] = b + delta;
    }
  }
}

function cleanEdgeAlphaFringe(data: Uint8ClampedArray): void {
  // Snap near-transparent anti-aliased outer corner pixels so GIF 1-bit transparency stays crisp
  for (let i = 3; i < data.length; i += 4) {
    if (data[i] < 96) {
      data[i] = 0;
    }
  }
}

async function encodeViaMainThread(
  options: ExportGifOptions,
  outWidth: number,
  outHeight: number,
  scale: number,
  offCtx: CanvasRenderingContext2D
): Promise<ArrayBuffer> {
  const encoder = new Encoder({
    width: outWidth,
    height: outHeight,
    maxColors: options.maxColors ?? 255,
    dither: options.dither,
    premultipliedAlpha: false,
    tint: options.tintRgb ?? [255, 255, 255],
    looped: true,
    loopCount: 0,
  });

  for (let f = 0; f < options.totalFrames; f++) {
    const timeSec = (f / Math.max(1, options.totalFrames)) * options.durationSec;
    offCtx.save();
    offCtx.clearRect(0, 0, outWidth, outHeight);
    offCtx.scale(scale, scale);
    options.renderFrame(offCtx, timeSec);
    offCtx.restore();

    const imgData = offCtx.getImageData(0, 0, outWidth, outHeight);
    if (options.cleanCornerAlpha) {
      cleanEdgeAlphaFringe(imgData.data);
    }
    if (options.orderedDither) {
      applyOrderedBayerDither(imgData.data, outWidth, outHeight);
    }

    await encoder.encode({
      data: imgData.data,
      width: outWidth,
      height: outHeight,
      delay: options.delayMs,
    });

    options.onProgress?.(Math.round(((f + 1) / options.totalFrames) * 80));
    if (f % 3 === 0) {
      await new Promise((r) => setTimeout(r, 0));
    }
  }

  options.onProgress?.(92);
  const buffer = await encoder.flush("arrayBuffer");
  options.onProgress?.(100);
  return buffer;
}

/**
 * Renders an animated frame sequence at HiDPI scale and encodes it with a unified
 * global palette via modern-gif inside a dedicated Web Worker (with main-thread fallback).
 */
export async function exportFramesToGif(options: ExportGifOptions): Promise<Blob> {
  await waitForFontsSafe();

  const scale = Math.max(1, options.scale ?? 1.25);
  const outWidth = Math.max(1, Math.round(options.width * scale));
  const outHeight = Math.max(1, Math.round(options.height * scale));

  const offscreen = document.createElement("canvas");
  offscreen.width = outWidth;
  offscreen.height = outHeight;
  const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
  if (!offCtx) {
    throw new Error("Unable to initialize offscreen canvas context");
  }

  let gifBuffer: ArrayBuffer | undefined;

  if (typeof Worker !== "undefined") {
    let workerClient: ManagedGifWorker | null = null;
    try {
      workerClient = new ManagedGifWorker();
      await workerClient.request(
        {
          type: "init",
          payload: {
            width: outWidth,
            height: outHeight,
            maxColors: options.maxColors ?? 255,
            dither: options.dither,
            tint: options.tintRgb ?? [255, 255, 255],
            looped: true,
            loopCount: 0,
          },
        },
        [],
        3500
      );

      for (let f = 0; f < options.totalFrames; f++) {
        const timeSec = (f / Math.max(1, options.totalFrames)) * options.durationSec;
        offCtx.save();
        offCtx.clearRect(0, 0, outWidth, outHeight);
        offCtx.scale(scale, scale);
        options.renderFrame(offCtx, timeSec);
        offCtx.restore();

        const imgData = offCtx.getImageData(0, 0, outWidth, outHeight);
        if (options.cleanCornerAlpha) {
          cleanEdgeAlphaFringe(imgData.data);
        }
        if (options.orderedDither) {
          applyOrderedBayerDither(imgData.data, outWidth, outHeight);
        }

        // Copy pixel bytes so transfer detaches the buffer safely
        const transferable = new Uint8ClampedArray(imgData.data).buffer;
        await workerClient.request(
          {
            type: "encode",
            payload: {
              buffer: transferable,
              width: outWidth,
              height: outHeight,
              delay: options.delayMs,
            },
          },
          [transferable],
          10000
        );

        options.onProgress?.(Math.round(((f + 1) / options.totalFrames) * 80));
        if (f % 3 === 0) {
          await new Promise((r) => setTimeout(r, 0));
        }
      }

      options.onProgress?.(92);
      gifBuffer = await workerClient.request({ type: "flush" }, [], 45000);
      options.onProgress?.(100);
    } catch {
      gifBuffer = undefined;
    } finally {
      workerClient?.terminate();
    }
  }

  if (!gifBuffer) {
    gifBuffer = await encodeViaMainThread(options, outWidth, outHeight, scale, offCtx);
  }

  return new Blob([gifBuffer], { type: "image/gif" });
}
