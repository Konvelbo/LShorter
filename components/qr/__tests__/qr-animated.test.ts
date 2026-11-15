import {
  ReadableStream as NodeReadableStream,
  TransformStream as NodeTransformStream,
  WritableStream as NodeWritableStream,
} from "node:stream/web";
import {
  ANIMATED_THEMES,
  ANIMATED_THEME_CATEGORIES,
  getAnimatedTheme,
  type ShaderArchetype,
} from "../qr-animated-themes";
import {
  ANIMATED_LOOP_DURATION_SEC,
  drawAnimatedQRFrame,
  getAnimatedFramePaddings,
  loopCos,
  loopNorm,
  loopSin,
} from "../qr-animated-frames";
import { drawCenterLogo, drawQRFrame, isAnimatedFrame, type FrameType } from "../qr-render-engine";
import { normalizeHexColor } from "../live-color-control";
import {
  getRelativeLuminance,
  hexToRgbTuple,
  mixHex,
  resolveThemePalette,
} from "../qr-webgl-shaders";
import { applyOrderedBayerDither, exportFramesToGif } from "@/lib/qr/gif-export";

const EXPECTED_40_ANIMATED_IDS: FrameType[] = [
  "anim_christmas",
  "anim_halloween",
  "anim_sport",
  "anim_manga",
  "anim_rain",
  "anim_snow",
  "anim_cloud",
  "anim_storm",
  "anim_cyberpunk",
  "anim_galaxy",
  "anim_fire",
  "anim_luxury_gold",
  "anim_hearts",
  "anim_waves",
  "anim_diamond",
  "anim_music",
  "anim_arcade",
  "anim_nature",
  "anim_coffee",
  "anim_fireworks",
  "anim_f1_racing",
  "anim_basketball",
  "anim_football",
  "anim_tennis",
  "anim_boxing",
  "anim_terminal_code",
  "anim_rocket_launch",
  "anim_aurora",
  "anim_dna_biotech",
  "anim_glitch",
  "anim_sunset_vibes",
  "anim_matrix_rain",
  "anim_circuit_board",
  "anim_quantum_grid",
  "anim_ai_neural",
  "anim_hologram_hud",
  "anim_fiber_optic",
  "anim_blockchain",
  "anim_radar_scan",
  "anim_cloud_cluster",
];

function createMock2dContext(width: number, height: number): CanvasRenderingContext2D {
  const noop = () => undefined;
  const gradientStub = { addColorStop: noop };
  const ctx: Record<string, unknown> = {
    canvas: { width, height },
    fillStyle: "#000000",
    strokeStyle: "#000000",
    lineWidth: 1,
    lineCap: "butt",
    font: "12px Inter",
    textAlign: "left",
    textBaseline: "alphabetic",
    shadowColor: "transparent",
    shadowBlur: 0,
    shadowOffsetY: 0,
    save: noop,
    restore: noop,
    scale: noop,
    translate: noop,
    rotate: noop,
    clip: noop,
    beginPath: noop,
    closePath: noop,
    moveTo: noop,
    lineTo: noop,
    bezierCurveTo: noop,
    arc: noop,
    arcTo: noop,
    setLineDash: noop,
    roundRect: noop,
    fill: noop,
    stroke: noop,
    fillRect: noop,
    clearRect: noop,
    fillText: noop,
    drawImage: noop,
    measureText: (text: string) => ({ width: text.length * 7 }),
    createLinearGradient: () => gradientStub,
    createRadialGradient: () => gradientStub,
    getTransform: () => ({ a: 1, d: 1 }),
    getImageData: (_x: number, _y: number, w: number, h: number) => {
      const data = new Uint8ClampedArray(w * h * 4);
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 16;
        data[i + 1] = 32;
        data[i + 2] = 64;
        data[i + 3] = 255;
      }
      return { data, width: w, height: h };
    },
  };
  return ctx as unknown as CanvasRenderingContext2D;
}

describe("Animated QR Themes Registry & Shader System", () => {
  test("covers all 40 existing anim_* frame IDs with valid theme configs", () => {
    const validShaders: ShaderArchetype[] = [
      "aurora",
      "liquid_metal",
      "cyber_grid",
      "matrix_digital",
      "plasma_nebula",
      "ocean_caustics",
      "festive_bokeh",
      "arena_energy",
    ];
    const validCategories = new Set(
      ANIMATED_THEME_CATEGORIES.filter((c) => c.id !== "all").map((c) => c.id)
    );

    expect(Object.keys(ANIMATED_THEMES)).toHaveLength(40);

    for (const id of EXPECTED_40_ANIMATED_IDS) {
      expect(isAnimatedFrame(id)).toBe(true);
      const theme = ANIMATED_THEMES[id as keyof typeof ANIMATED_THEMES];
      expect(theme).toBeDefined();
      expect(validShaders).toContain(theme.shader);
      expect(validCategories.has(theme.category)).toBe(true);
      expect(theme.baseBg).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.primary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.secondary).toMatch(/^#[0-9a-fA-F]{6}$/);
      expect(theme.accent).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });

  test("falls back gracefully for unknown theme IDs", () => {
    expect(getAnimatedTheme("anim_nonexistent")).toEqual(ANIMATED_THEMES.anim_aurora);
  });

  test("loop helpers wrap cleanly across 2.4s loop boundaries", () => {
    expect(loopNorm(0)).toBeCloseTo(0, 6);
    expect(loopNorm(ANIMATED_LOOP_DURATION_SEC)).toBeCloseTo(0, 6);
    expect(loopSin(0)).toBeCloseTo(loopSin(ANIMATED_LOOP_DURATION_SEC), 6);
    expect(loopCos(0)).toBeCloseTo(loopCos(ANIMATED_LOOP_DURATION_SEC), 6);
  });

  test("frame paddings reserve clean non-clipping margins for QR card and badges", () => {
    const qrDrawSize = 320;
    const cardPad = 12;

    for (const quietZone of [true, false]) {
      const paddings = getAnimatedFramePaddings(quietZone);
      const totalWidth = qrDrawSize + paddings.side * 2;
      const totalHeight = qrDrawSize + paddings.top + paddings.bottom;

      const cardX = paddings.side - cardPad;
      const cardY = paddings.top - cardPad;
      const cardBottom = cardY + qrDrawSize + cardPad * 2;
      const cardRight = cardX + qrDrawSize + cardPad * 2;

      expect(cardX).toBeGreaterThanOrEqual(16);
      expect(totalWidth - cardRight).toBeGreaterThanOrEqual(16);
      expect(cardY).toBeGreaterThanOrEqual(24);
      expect(totalHeight - cardBottom).toBeGreaterThanOrEqual(64);
    }
  });

  test("color utilities parse, mix, and resolve custom tint palettes accurately", () => {
    expect(hexToRgbTuple("#ff6600")).toEqual([255, 102, 0]);
    expect(hexToRgbTuple("#0f0")).toEqual([0, 255, 0]);
    expect(mixHex("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(getRelativeLuminance("#ffffff")).toBeCloseTo(1, 3);
    expect(getRelativeLuminance("#000000")).toBeCloseTo(0, 3);

    const aurora = ANIMATED_THEMES.anim_aurora;
    const untinted = resolveThemePalette(aurora);
    expect(untinted.primary).toBe(aurora.primary);

    const tinted = resolveThemePalette(aurora, "#ff6600");
    expect(tinted.primary).not.toBe(aurora.primary);
    expect(tinted.primary).toMatch(/^#[0-9a-f]{6}$/);
  });

  test("renders animated themes cleanly with Canvas 2D fallback when WebGL is unavailable", () => {
    const getContextSpy = jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);

    try {
      const paddings = getAnimatedFramePaddings(true);
      const totalWidth = 320 + paddings.side * 2;
      const totalHeight = 320 + paddings.top + paddings.bottom;
      const ctx = createMock2dContext(totalWidth, totalHeight);

      const samples: FrameType[] = [
        "anim_cyberpunk",
        "anim_luxury_gold",
        "anim_aurora",
        "anim_f1_racing",
        "anim_christmas",
        "anim_terminal_code",
      ];

      for (const frame of samples) {
        expect(() =>
          drawAnimatedQRFrame(
            ctx,
            frame,
            totalWidth,
            totalHeight,
            "#ff6600",
            "SCAN ME",
            true,
            1.2,
            "inter",
            12,
            "bold",
            "uppercase",
            {
              paddings,
              qrDrawSize: 320,
              bgMode: "transparent",
              pixelColor: "#ffffff",
              tintWithFrameColor: false,
            }
          )
        ).not.toThrow();
      }
    } finally {
      getContextSpy.mockRestore();
    }
  });

  test("applyOrderedBayerDither leaves flat QR black/white pure and dithers gradients", () => {
    const rgba = new Uint8ClampedArray([
      255, 255, 255, 255, // pure white QR card pixel
      0, 0, 0, 255,       // pure black QR module pixel
      120, 80, 200, 255,  // midtone shader gradient pixel
      50, 50, 50, 120,    // transparent edge pixel (skipped)
    ]);
    applyOrderedBayerDither(rgba, 2, 2);
    expect(Array.from(rgba.slice(0, 4))).toEqual([255, 255, 255, 255]);
    expect(Array.from(rgba.slice(4, 8))).toEqual([0, 0, 0, 255]);
    expect(rgba[8]).not.toBe(120);
    expect(Array.from(rgba.slice(12, 16))).toEqual([50, 50, 50, 120]);
  });

  test("exportFramesToGif encodes multi-frame GIF89a binary with global palette fallback", async () => {
    const width = 48;
    const height = 48;
    const mockCtx = createMock2dContext(width, height);
    const fakeCanvas = {
      width: 0,
      height: 0,
      getContext: () => mockCtx,
    } as unknown as HTMLCanvasElement;

    const createElementSpy = jest
      .spyOn(document, "createElement")
      .mockImplementation((tag: string) => {
        if (tag === "canvas") return fakeCanvas;
        return document.createElementNS("http://www.w3.org/1999/xhtml", tag);
      });

    const originalWorker = globalThis.Worker;
    const originalReadableStream = globalThis.ReadableStream;
    const originalWritableStream = globalThis.WritableStream;
    const originalTransformStream = globalThis.TransformStream;
    Object.defineProperty(globalThis, "Worker", {
      value: undefined,
      configurable: true,
    });
    if (!globalThis.ReadableStream) {
      Object.defineProperty(globalThis, "ReadableStream", {
        value: NodeReadableStream,
        configurable: true,
      });
    }
    if (!globalThis.WritableStream) {
      Object.defineProperty(globalThis, "WritableStream", {
        value: NodeWritableStream,
        configurable: true,
      });
    }
    if (!globalThis.TransformStream) {
      Object.defineProperty(globalThis, "TransformStream", {
        value: NodeTransformStream,
        configurable: true,
      });
    }

    try {
      const progressEvents: number[] = [];
      const blob = await exportFramesToGif({
        width,
        height,
        scale: 1,
        totalFrames: 4,
        delayMs: 50,
        durationSec: 2.4,
        maxColors: 64,
        dither: "atkinson",
        tintRgb: [16, 32, 64],
        cleanCornerAlpha: true,
        renderFrame: (ctx) => {
          ctx.fillStyle = "#102040";
          ctx.fillRect(0, 0, width, height);
        },
        onProgress: (p) => progressEvents.push(p),
      });

      expect(blob.type).toBe("image/gif");
      const arrayBuf = await new Promise<ArrayBuffer>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
      });
      const bytes = new Uint8Array(arrayBuf);
      const header = String.fromCharCode(...bytes.slice(0, 6));
      expect(header).toBe("GIF89a");
      expect(bytes.length).toBeGreaterThan(100);
      expect(progressEvents[progressEvents.length - 1]).toBe(100);
    } finally {
      createElementSpy.mockRestore();
      Object.defineProperty(globalThis, "Worker", {
        value: originalWorker,
        configurable: true,
      });
      Object.defineProperty(globalThis, "ReadableStream", {
        value: originalReadableStream,
        configurable: true,
      });
      Object.defineProperty(globalThis, "WritableStream", {
        value: originalWritableStream,
        configurable: true,
      });
      Object.defineProperty(globalThis, "TransformStream", {
        value: originalTransformStream,
        configurable: true,
      });
    }
  });

  test("normalizeHexColor validates 3-digit and 6-digit hex codes and ignores partial edits", () => {
    expect(normalizeHexColor("#F60")).toBe("#ff6600");
    expect(normalizeHexColor(" #00AAff ")).toBe("#00aaff");
    expect(normalizeHexColor("#ff")).toBeNull();
    expect(normalizeHexColor("ff6600")).toBeNull();
    expect(normalizeHexColor("#zzzzzz")).toBeNull();
  });

  test("transparent card mode uses translucent veil instead of opaque white box", () => {
    const fills: unknown[] = [];
    const ctx = createMock2dContext(408, 464);
    let activeFill: unknown = "";
    Object.defineProperty(ctx, "fillStyle", {
      get: () => activeFill,
      set: (v) => {
        activeFill = v;
      },
      configurable: true,
    });
    const origFill = ctx.fill;
    ctx.fill = jest.fn((...args: unknown[]) => {
      fills.push(activeFill);
      return (origFill as (...a: unknown[]) => unknown)(...args);
    });

    const getContextSpy = jest
      .spyOn(HTMLCanvasElement.prototype, "getContext")
      .mockReturnValue(null);

    try {
      drawAnimatedQRFrame(
        ctx,
        "anim_radar_scan",
        408,
        464,
        "#ff6600",
        "SCAN ME",
        true,
        0.5,
        "inter",
        12,
        "bold",
        "uppercase",
        {
          paddings: getAnimatedFramePaddings(true),
          qrDrawSize: 320,
          bgMode: "transparent",
          bgColor: "#ffffff",
          pixelColor: "#ff6600",
          tintWithFrameColor: false,
        }
      );

      expect(fills).toContain("rgba(8, 12, 22, 0.14)");
      expect(fills).not.toContain("#ffffff");
    } finally {
      getContextSpy.mockRestore();
    }
  });

  test("drawCenterLogo omits outer white square when bgColor is transparent for branded badge", () => {
    const fills: unknown[] = [];
    const ctx = createMock2dContext(200, 200);
    let activeFill: unknown = "";
    Object.defineProperty(ctx, "fillStyle", {
      get: () => activeFill,
      set: (v) => {
        activeFill = v;
      },
      configurable: true,
    });
    ctx.fill = jest.fn(() => {
      fills.push(activeFill);
    });

    drawCenterLogo(ctx, 70, 70, 60, "ql", null, "SCAN", "#ff6600", "transparent");

    expect(fills).not.toContain("#ffffff");
    expect(fills).not.toContain("#0f172a");
  });

  test("drawQRFrame correctly renders all new simple frame styles", () => {
    const newSimpleFrames: FrameType[] = [
      "corner_brackets",
      "minimal_box",
      "floating_card",
      "double_border",
      "clean_badge",
      "notched_corners",
      "stamp_border",
    ];

    for (const frame of newSimpleFrames) {
      const ctx = createMock2dContext(380, 420);
      expect(() => {
        drawQRFrame(
          ctx,
          frame,
          380,
          420,
          "#ff6600",
          "SCAN ME",
          true,
          0,
          "inter",
          12,
          "bold",
          "uppercase"
        );
      }).not.toThrow();
    }
  });
});
