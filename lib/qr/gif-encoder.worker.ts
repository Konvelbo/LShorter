import { Encoder, type DitherMethod } from "modern-gif";

export interface GifWorkerInitPayload {
  width: number;
  height: number;
  maxColors?: number;
  dither?: DitherMethod;
  tint?: [number, number, number];
  looped?: boolean;
  loopCount?: number;
}

export interface GifWorkerEncodePayload {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  delay: number;
}

export type GifWorkerRequest =
  | { id: number; type: "init"; payload: GifWorkerInitPayload }
  | { id: number; type: "encode"; payload: GifWorkerEncodePayload }
  | { id: number; type: "flush" };

export type GifWorkerResponse =
  | { id: number; ok: true; buffer?: ArrayBuffer }
  | { id: number; ok: false; error: string };

interface MinimalWorkerScope {
  onmessage: ((event: MessageEvent<GifWorkerRequest>) => void) | null;
  postMessage: (message: GifWorkerResponse, transfer?: Transferable[]) => void;
}

const workerScope = self as unknown as MinimalWorkerScope;

let encoder: Encoder | null = null;

workerScope.onmessage = async (event: MessageEvent<GifWorkerRequest>) => {
  const msg = event.data;
  try {
    if (msg.type === "init") {
      encoder = new Encoder({
        width: msg.payload.width,
        height: msg.payload.height,
        maxColors: msg.payload.maxColors ?? 255,
        dither: msg.payload.dither ?? "atkinson",
        premultipliedAlpha: false,
        tint: msg.payload.tint ?? [255, 255, 255],
        looped: msg.payload.looped ?? true,
        loopCount: msg.payload.loopCount ?? 0,
      });
      workerScope.postMessage({ id: msg.id, ok: true });
      return;
    }

    if (msg.type === "encode") {
      if (!encoder) {
        throw new Error("GIF worker encoder is not initialized");
      }
      const rgba = new Uint8ClampedArray(msg.payload.buffer);
      await encoder.encode({
        data: rgba,
        width: msg.payload.width,
        height: msg.payload.height,
        delay: msg.payload.delay,
      });
      workerScope.postMessage({ id: msg.id, ok: true });
      return;
    }

    if (msg.type === "flush") {
      if (!encoder) {
        throw new Error("GIF worker encoder is not initialized");
      }
      const arrayBuffer = await encoder.flush("arrayBuffer");
      encoder = null;
      workerScope.postMessage({ id: msg.id, ok: true, buffer: arrayBuffer }, [arrayBuffer]);
      return;
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Unknown GIF worker error";
    workerScope.postMessage({ id: msg.id, ok: false, error: errorMessage });
  }
};
