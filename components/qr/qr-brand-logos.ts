import type { LogoType } from "./qr-render-engine";

export interface BrandGradientSpec {
  id: string;
  from: string;
  via?: string;
  to: string;
  direction?: "diagonal-tl-br" | "diagonal-bl-tr" | "vertical" | "horizontal";
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
}

export interface BrandTransform {
  translateX?: number;
  translateY?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  rotateDeg?: number;
  pivotX?: number;
  pivotY?: number;
}

export type BrandPrimitive =
  | {
      kind: "path";
      d: string;
      fill?: string;
      fillGradient?: BrandGradientSpec;
      fillRule?: "nonzero" | "evenodd";
      stroke?: string;
      strokeWidth?: number;
      strokeLinecap?: "butt" | "round" | "square";
      strokeLinejoin?: "miter" | "round" | "bevel";
      opacity?: number;
      transform?: BrandTransform;
      clipToCircle?: { cx: number; cy: number; r: number };
    }
  | {
      kind: "circle";
      cx: number;
      cy: number;
      r: number;
      fill?: string;
      fillGradient?: BrandGradientSpec;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      clipToCircle?: { cx: number; cy: number; r: number };
    }
  | {
      kind: "ellipse";
      cx: number;
      cy: number;
      rx: number;
      ry: number;
      rotateDeg?: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      clipToCircle?: { cx: number; cy: number; r: number };
    }
  | {
      kind: "rect";
      x: number;
      y: number;
      width: number;
      height: number;
      rx?: number;
      rotateDeg?: number;
      pivotX?: number;
      pivotY?: number;
      fill?: string;
      fillGradient?: BrandGradientSpec;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      clipToCircle?: { cx: number; cy: number; r: number };
    }
  | {
      kind: "text";
      text: string;
      x: number;
      y: number;
      fill: string;
      fontSize: number;
      fontWeight?: number | string;
      fontStyle?: "normal" | "italic";
      fontFamily?: "sans" | "serif" | "mono";
      rotateDeg?: number;
      pivotX?: number;
      pivotY?: number;
    };

export interface BrandLogoContainer {
  shape: "rounded" | "circle";
  fill?: string;
  gradient?: BrandGradientSpec;
  stroke?: string;
  darkRim?: boolean;
}

export interface BrandLogoSpec {
  container?: BrandLogoContainer;
  layers: BrandPrimitive[];
}

export type BrandLogoId = Exclude<LogoType, "none" | "custom" | "text">;

// ─── GEOMETRY HELPERS (24x24 NORMALIZED SPACE) ───────────────────────────────

function regularPolygonPath(
  sides: number,
  cx: number,
  cy: number,
  r: number,
  startDeg = -90
): string {
  const pts: string[] = [];
  for (let i = 0; i < sides; i++) {
    const a = ((startDeg + (360 / sides) * i) * Math.PI) / 180;
    const x = +(cx + r * Math.cos(a)).toFixed(2);
    const y = +(cy + r * Math.sin(a)).toFixed(2);
    pts.push(`${i === 0 ? "M" : "L"}${x} ${y}`);
  }
  return `${pts.join(" ")}Z`;
}

function starPolygonPath(
  points: number,
  cx: number,
  cy: number,
  outerR: number,
  innerR: number,
  startDeg = -90
): string {
  const pts: string[] = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const a = ((startDeg + (180 / points) * i) * Math.PI) / 180;
    const x = +(cx + r * Math.cos(a)).toFixed(2);
    const y = +(cy + r * Math.sin(a)).toFixed(2);
    pts.push(`${i === 0 ? "M" : "L"}${x} ${y}`);
  }
  return `${pts.join(" ")}Z`;
}

function darkTile(shape: "rounded" | "circle" = "rounded", fill = "#09090B"): BrandLogoContainer {
  return { shape, fill, darkRim: true };
}

function whiteTile(shape: "rounded" | "circle" = "rounded", stroke = "#D4D4D8"): BrandLogoContainer {
  return { shape, fill: "#FFFFFF", stroke };
}

function solidTile(fill: string, shape: "rounded" | "circle" = "rounded"): BrandLogoContainer {
  return { shape, fill };
}

function gradientTile(
  id: string,
  from: string,
  to: string,
  direction: BrandGradientSpec["direction"] = "diagonal-tl-br",
  via?: string,
  shape: "rounded" | "circle" = "rounded"
): BrandLogoContainer {
  return { shape, gradient: { id, from, via, to, direction } };
}

// ─── CANONICAL 24x24 VECTOR SPECS FOR ALL 114 LOGOS ──────────────────────────

export const BRAND_LOGOS: Record<BrandLogoId, BrandLogoSpec> = {
  // ── 1-28: BRANDS, SOCIAL & WORK ────────────────────────────────────────────
  ql: {
    container: gradientTile("grad-ql", "#3B82F6", "#1D4ED8"),
    layers: [
      {
        kind: "text",
        text: "LS",
        x: 12,
        y: 12.2,
        fill: "#FFFFFF",
        fontSize: 10.4,
        fontWeight: 900,
        fontFamily: "sans",
      },
    ],
  },

  facebook: {
    container: solidTile("#1877F2", "circle"),
    layers: [
      {
        kind: "path",
        d: "M13.55 22.8V14.75h2.65l.4-3.08h-3.05V9.7c0-.89.25-1.5 1.53-1.5h1.63V5.45c-.28-.04-1.25-.12-2.38-.12-2.36 0-3.97 1.44-3.97 4.08v2.26H7.7v3.08h2.66v8.05h3.19z",
        fill: "#FFFFFF",
        clipToCircle: { cx: 12, cy: 12, r: 10.4 },
      },
    ],
  },

  instagram: {
    container: gradientTile("grad-ig", "#F58529", "#515BD4", "diagonal-bl-tr", "#DD2A7B"),
    layers: [
      {
        kind: "rect",
        x: 5.4,
        y: 5.4,
        width: 13.2,
        height: 13.2,
        rx: 3.9,
        stroke: "#FFFFFF",
        strokeWidth: 1.65,
      },
      {
        kind: "circle",
        cx: 12,
        cy: 12,
        r: 3.2,
        stroke: "#FFFFFF",
        strokeWidth: 1.65,
      },
      {
        kind: "circle",
        cx: 15.85,
        cy: 8.15,
        r: 0.95,
        fill: "#FFFFFF",
      },
    ],
  },

  twitter: {
    container: darkTile("rounded", "#09090B"),
    layers: [
      {
        kind: "path",
        d: "M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z",
        fill: "#FFFFFF",
        fillRule: "evenodd",
        transform: { translateX: 5.4, translateY: 5.4, scale: 0.55 },
      },
    ],
  },

  whatsapp: {
    container: solidTile("#25D366", "circle"),
    layers: [
      {
        kind: "path",
        d: "M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01C17.18 3.03 14.69 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31c-.82-1.31-1.26-2.83-1.26-4.38 0-4.54 3.7-8.24 8.24-8.24 2.2 0 4.27.86 5.82 2.42 1.56 1.56 2.41 3.63 2.41 5.83.02 4.54-3.68 8.23-8.22 8.23zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.44.06-.66.31-.23.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.57.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.05-.11-.22-.18-.47-.3z",
        fill: "#FFFFFF",
        fillRule: "evenodd",
        transform: { translateX: 4.56, translateY: 4.56, scale: 0.62 },
      },
    ],
  },

  tiktok: {
    container: darkTile("rounded", "#09090B"),
    layers: [
      {
        kind: "path",
        d: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z",
        fill: "#25F4EE",
        transform: { translateX: 4.7, translateY: 4.65, scale: 0.56 },
      },
      {
        kind: "path",
        d: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z",
        fill: "#FE2C55",
        transform: { translateX: 5.85, translateY: 5.75, scale: 0.56 },
      },
      {
        kind: "path",
        d: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z",
        fill: "#FFFFFF",
        transform: { translateX: 5.28, translateY: 5.2, scale: 0.56 },
      },
    ],
  },

  youtube: {
    layers: [
      {
        kind: "rect",
        x: 1.8,
        y: 4.8,
        width: 20.4,
        height: 14.4,
        rx: 4.4,
        fill: "#FF0000",
      },
      {
        kind: "path",
        d: "M10.1 8.8l5.6 3.2-5.6 3.2V8.8z",
        fill: "#FFFFFF",
      },
    ],
  },

  linkedin: {
    container: solidTile("#0A66C2"),
    layers: [
      { kind: "circle", cx: 7.45, cy: 7.45, r: 1.15, fill: "#FFFFFF" },
      { kind: "rect", x: 6.4, y: 9.75, width: 2.1, height: 7.85, rx: 0.25, fill: "#FFFFFF" },
      {
        kind: "path",
        d: "M10.3 9.75h2v1.08h.03c.28-.52.96-1.26 2.18-1.26 2.33 0 2.79 1.53 2.79 3.53v4.5h-2.1v-4.05c0-.97-.02-2.21-1.35-2.21-1.35 0-1.56 1.05-1.56 2.14v4.12H10.3V9.75z",
        fill: "#FFFFFF",
      },
    ],
  },

  spotify: {
    container: solidTile("#1DB954", "circle"),
    layers: [
      {
        kind: "path",
        d: "M6.5 9.1c3.7-1.1 8.5-.7 11.4 1.1",
        stroke: "#FFFFFF",
        strokeWidth: 1.9,
        strokeLinecap: "round",
      },
      {
        kind: "path",
        d: "M7.4 12.5c3.0-.9 6.8-.5 9.3 1.0",
        stroke: "#FFFFFF",
        strokeWidth: 1.6,
        strokeLinecap: "round",
      },
      {
        kind: "path",
        d: "M8.3 15.7c2.3-.7 5.1-.4 7.0.7",
        stroke: "#FFFFFF",
        strokeWidth: 1.35,
        strokeLinecap: "round",
      },
    ],
  },

  telegram: {
    container: gradientTile("grad-tg", "#38BDF8", "#0284C7", "vertical", undefined, "circle"),
    layers: [
      {
        kind: "path",
        d: "M16.95 7.4L5.65 11.75c-.77.3-.76.74-.14.93l2.9.9 6.72-4.24c.32-.2.6-.09.37.12l-5.44 4.91-.2 3.04c.29 0 .42-.13.59-.29l1.42-1.38 2.96 2.18c.55.3.94.15 1.08-.5l1.95-9.2c.2-.8-.31-1.15-.91-.92z",
        fill: "#FFFFFF",
      },
      {
        kind: "path",
        d: "M10.06 14.37l-.2 3.04c.29 0 .42-.13.59-.29l1.42-1.38-1.81-1.37z",
        fill: "#BAE6FD",
      },
    ],
  },

  discord: {
    container: solidTile("#5865F2"),
    layers: [
      {
        kind: "path",
        d: "M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.35-.76-.54-1.09-.01-.02-.04-.03-.07-.03-1.5.26-2.93.71-4.27 1.33-.01 0-.02.01-.03.02-2.72 4.07-3.47 8.03-3.1 11.95 0 .02.01.04.03.05 1.8 1.32 3.53 2.12 5.24 2.65.03.01.06 0 .07-.02.4-.55.76-1.13 1.07-1.74.02-.04 0-.08-.04-.09-.57-.22-1.11-.48-1.64-.78-.04-.02-.04-.08-.01-.11.11-.08.22-.17.33-.25.02-.02.05-.02.07-.01 3.44 1.57 7.15 1.57 10.55 0 .02-.01.05-.01.07.01.11.09.22.17.33.26.04.03.04.09-.01.11-.52.31-1.07.56-1.64.78-.04.01-.05.06-.04.09.32.61.68 1.19 1.07 1.74.03.01.06.02.09.01 1.72-.53 3.45-1.33 5.25-2.65.02-.01.03-.03.03-.05.44-4.53-.73-8.46-3.1-11.95-.01-.01-.02-.02-.04-.02z",
        fill: "#FFFFFF",
        transform: { translateX: 4.56, translateY: 4.8, scale: 0.62 },
      },
      { kind: "ellipse", cx: 9.85, cy: 12.6, rx: 1.05, ry: 1.25, fill: "#5865F2" },
      { kind: "ellipse", cx: 14.15, cy: 12.6, rx: 1.05, ry: 1.25, fill: "#5865F2" },
    ],
  },

  snapchat: {
    container: { shape: "rounded", fill: "#FFFC00", stroke: "#E4E4E7" },
    layers: [
      {
        kind: "path",
        d: "M12.2 4.6c1.9 0 3.3 1.3 3.5 3.1.08.85-.02 1.7-.08 2.25.35-.08.7-.2.9-.2.32 0 .6.2.6.48 0 .28-.26.5-.72.66-.42.14-.62.3-.56.58.26.95 1.15 1.95 2.45 2.45.28.11.42.3.35.53-.08.25-.45.45-1.1.6-.22.05-.3.18-.35.42-.05.24-.16.45-.48.45-.42 0-.9-.14-1.52-.14-.6 0-1.15.32-1.7.72-.52.38-1.08.66-1.5.66-.42 0-.98-.28-1.5-.66-.55-.4-1.1-.72-1.7-.72-.62 0-1.1.14-1.52.14-.32 0-.43-.21-.48-.45-.05-.24-.13-.37-.35-.42-.65-.15-1.02-.35-1.1-.6-.07-.23.07-.42.35-.53 1.3-.5 2.19-1.5 2.45-2.45.06-.28-.14-.44-.56-.58-.46-.16-.72-.38-.72-.66 0-.28.28-.48.6-.48.2 0 .55.12.9.2-.06-.55-.16-1.4-.08-2.25.2-1.8 1.6-3.1 3.5-3.1z",
        fill: "#FFFFFF",
        stroke: "#09090B",
        strokeWidth: 1.0,
        strokeLinejoin: "round",
      },
    ],
  },

  github: {
    container: whiteTile("circle", "#D4D4D8"),
    layers: [
      {
        kind: "path",
        d: "M12 1.8C6.37 1.8 1.8 6.37 1.8 12c0 4.51 2.92 8.33 6.97 9.68.51.09.7-.22.7-.49 0-.24-.01-1.04-.01-1.89-2.56.47-3.22-.63-3.43-1.2-.12-.3-.61-1.2-.99-1.44-.34-.18-.82-.63-.01-.65.77-.01 1.32.71 1.5 1 .88 1.48 2.28 1.06 2.84.81.09-.64.34-1.06.62-1.31-2.26-.26-4.63-1.13-4.63-5.02 0-1.11.39-2.02 1.04-2.73-.1-.26-.45-1.29.1-2.69 0 0 .85-.27 2.8 1.04.81-.23 1.68-.34 2.55-.34.86 0 1.74.11 2.55.34 1.95-1.32 2.8-1.04 2.8-1.04.55 1.4.2 2.43.1 2.69.65.71 1.04 1.61 1.04 2.73 0 3.9-2.38 4.76-4.65 5.01.36.31.68.91.68 1.85 0 1.34-.01 2.41-.01 2.75 0 .27.19.59.71.49C19.28 20.33 22.2 16.51 22.2 12c0-5.63-4.57-10.2-10.2-10.2z",
        fill: "#18181B",
        transform: { translateX: 0.6, translateY: 0.6, scale: 0.95 },
      },
    ],
  },

  apple: {
    container: darkTile("rounded", "#18181B"),
    layers: [
      {
        kind: "path",
        d: "M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701",
        fill: "#FFFFFF",
        transform: { translateX: 5.2, translateY: 5.0, scale: 0.57 },
      },
    ],
  },

  paypal: {
    container: whiteTile("rounded"),
    layers: [
      {
        kind: "path",
        d: "M7.2 18.6H4.9a.55.55 0 0 1-.54-.64l1.75-11.2a.75.75 0 0 1 .74-.63h4.35c2.2 0 3.65 1.08 3.28 3.35-.44 2.72-2.42 4.18-5.05 4.18H7.9l-.7 4.94z",
        fill: "#003087",
      },
      {
        kind: "path",
        d: "M10.55 19.6H8.3a.5.5 0 0 1-.5-.58l1.6-10.1a.7.7 0 0 1 .7-.58h4.1c2.1 0 3.48 1.02 3.12 3.16-.42 2.55-2.28 3.92-4.78 3.92h-1.4l-.59 4.18z",
        fill: "#009CDE",
        opacity: 0.92,
      },
    ],
  },

  google: {
    container: whiteTile("circle"),
    layers: [
      {
        kind: "path",
        d: "M18.96 12.16c0-.49-.04-.96-.13-1.42H12v2.69h3.9a3.34 3.34 0 0 1-1.44 2.19v1.81h2.34c1.37-1.26 2.16-3.12 2.16-5.27z",
        fill: "#4285F4",
      },
      {
        kind: "path",
        d: "M12 19.2c1.96 0 3.6-.65 4.8-1.77l-2.34-1.81c-.65.44-1.48.7-2.46.7-1.89 0-3.49-1.28-4.06-2.99H5.53v1.87A7.2 7.2 0 0 0 12 19.2z",
        fill: "#34A853",
      },
      {
        kind: "path",
        d: "M7.94 13.33a4.35 4.35 0 0 1 0-2.66V8.8H5.53a7.2 7.2 0 0 0 0 6.4l2.41-1.87z",
        fill: "#FBBC05",
      },
      {
        kind: "path",
        d: "M12 7.68c1.07 0 2.02.37 2.78 1.09l2.08-2.08A6.92 6.92 0 0 0 12 4.8a7.2 7.2 0 0 0-6.47 4l2.41 1.87c.57-1.71 2.17-2.99 4.06-2.99z",
        fill: "#EA4335",
      },
    ],
  },

  stripe: {
    container: solidTile("#635BFF"),
    layers: [
      {
        kind: "path",
        d: "M11.35 9.85c0-.66.54-.91 1.44-.91 1.29 0 2.91.39 4.2 1.09V6.05c-1.41-.56-2.8-.78-4.2-.78-3.44 0-5.72 1.8-5.72 4.8 0 4.68 6.44 3.93 6.44 5.95 0 .78-.68 1.03-1.63 1.03-1.41 0-3.21-.58-4.63-1.36v4.03c1.58.68 3.17.97 4.63.97 3.53 0 5.95-1.74 5.95-4.78-.02-5.05-6.48-4.15-6.48-6.06z",
        fill: "#FFFFFF",
        transform: { translateX: 4.5, translateY: 4.2, scale: 0.62 },
      },
    ],
  },

  shopify: {
    layers: [
      {
        kind: "path",
        d: "M10.4 7.7V6.0a2.1 2.1 0 0 1 4.2 0v1.7",
        stroke: "#3D6B29",
        strokeWidth: 1.35,
        strokeLinecap: "round",
      },
      {
        kind: "path",
        d: "M9.1 7.8V5.6a2.3 2.3 0 0 1 4.6 0v2.2",
        stroke: "#5E8E3E",
        strokeWidth: 1.45,
        strokeLinecap: "round",
      },
      {
        kind: "path",
        d: "M15.4 6.6l2.1.85 1.85 13.0-3.35.95-1.6-14.3 1.0-.5z",
        fill: "#5E8E3E",
      },
      {
        kind: "path",
        d: "M5.3 7.7L15.4 6.6l1.65 14.35-11.2.6-.55-13.85z",
        fill: "#95BF47",
      },
      {
        kind: "path",
        d: "M13.5 11.45c-.4-.18-.95-.32-1.55-.27-.95.08-1.45.62-1.4 1.25.07.78.95 1.08 1.75 1.42 1.05.45 1.62 1.05 1.72 2.02.18 1.5-.85 2.68-2.55 2.85-.98.1-1.85-.15-2.45-.52l.35-1.55c.55.34 1.25.55 1.92.48.72-.07 1.12-.48 1.05-1.05-.06-.6-.65-.88-1.58-1.28-1.12-.48-1.78-1.12-1.88-2.08-.14-1.38.82-2.48 2.52-2.65.88-.08 1.62.12 2.1.36l-.16 1.02z",
        fill: "#FFFFFF",
        transform: { translateX: -0.45, translateY: -0.2 },
      },
    ],
  },

  amazon: {
    container: darkTile("rounded", "#131921"),
    layers: [
      {
        kind: "path",
        d: "M13.5 13.85c0 .72.02 1.32.38 1.95.15.27-.02.45-.28.59-.48.27-1.15.65-1.15.65-.15.08-.31.02-.44-.1-.3-.36-.43-.52-.63-.83-.6.62-1.03.81-1.82.81-.93 0-1.65-.58-1.65-1.73 0-.9.49-1.51 1.18-1.81.61-.26 1.45-.31 2.1-.39v-.14c0-.26.02-.57-.13-.79-.14-.2-.39-.28-.61-.28-.41 0-.78.21-.87.64-.02.1-.09.2-.19.2l-1.05-.11c-.09-.02-.19-.09-.16-.23.25-1.3 1.42-1.69 2.47-1.69.54 0 1.24.14 1.66.55.54.5.49 1.17.49 1.9v1.74zm-1.6-.21c-.62.03-1.29.09-1.62.26-.33.17-.45.46-.45.8 0 .46.3.73.73.73.3 0 .67-.15.98-.45.31-.29.36-.65.36-1.12v-.22z",
        fill: "#FFFFFF",
        transform: { translateX: 0.7, translateY: -2.0, scale: 1.02 },
      },
      {
        kind: "path",
        d: "M6.5 15.8c2.45 1.85 5.95 2.4 9.05 1.45.48-.15.92-.34 1.32-.58",
        stroke: "#FF9900",
        strokeWidth: 1.4,
        strokeLinecap: "round",
      },
      {
        kind: "path",
        d: "M15.8 16.05c1.1-.16 2.02-.06 2.28.25.22.26-.04 1.05-.65 1.82",
        stroke: "#FF9900",
        strokeWidth: 1.25,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
    ],
  },

  visa: {
    container: solidTile("#1A1F71"),
    layers: [
      {
        kind: "text",
        text: "VISA",
        x: 12.1,
        y: 12.4,
        fill: "#FFFFFF",
        fontSize: 6.8,
        fontWeight: 900,
        fontStyle: "italic",
      },
      {
        kind: "path",
        d: "M4.8 9.2l2.5.05-.8 1.5z",
        fill: "#F7B600",
      },
    ],
  },

  mastercard: {
    layers: [
      { kind: "circle", cx: 9.2, cy: 12, r: 5.5, fill: "#EB001B" },
      { kind: "circle", cx: 14.8, cy: 12, r: 5.5, fill: "#F79E1B" },
      {
        kind: "path",
        d: "M12 7.27a5.49 5.49 0 0 1 0 9.46 5.49 5.49 0 0 1 0-9.46z",
        fill: "#FF5F00",
      },
    ],
  },

  twitch: {
    container: solidTile("#9146FF"),
    layers: [
      {
        kind: "path",
        d: "M6.8 5.2L5.2 7.8v9.8h3.3V19l1.9-1.4h2.8l4.4-4.2V5.2H6.8z",
        fill: "#FFFFFF",
      },
      { kind: "rect", x: 10.6, y: 8.2, width: 1.35, height: 3.4, rx: 0.3, fill: "#9146FF" },
      { kind: "rect", x: 13.7, y: 8.2, width: 1.35, height: 3.4, rx: 0.3, fill: "#9146FF" },
    ],
  },

  reddit: {
    container: solidTile("#FF4500", "circle"),
    layers: [
      { kind: "circle", cx: 6.8, cy: 11.4, r: 1.35, fill: "#FFFFFF" },
      { kind: "circle", cx: 17.2, cy: 11.4, r: 1.35, fill: "#FFFFFF" },
      { kind: "ellipse", cx: 12, cy: 13.6, rx: 5.4, ry: 3.9, fill: "#FFFFFF" },
      {
        kind: "path",
        d: "M12 9.7l1.2-3.4 2.75.65",
        stroke: "#FFFFFF",
        strokeWidth: 1.15,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
      { kind: "circle", cx: 16.4, cy: 7.05, r: 1.1, fill: "#FFFFFF" },
      { kind: "circle", cx: 10.0, cy: 13.1, r: 0.9, fill: "#FF4500" },
      { kind: "circle", cx: 14.0, cy: 13.1, r: 0.9, fill: "#FF4500" },
      {
        kind: "path",
        d: "M10.05 15.25c1.1.85 2.8.85 3.9 0",
        stroke: "#FF4500",
        strokeWidth: 1.05,
        strokeLinecap: "round",
      },
    ],
  },

  threads: {
    container: darkTile("rounded", "#09090B"),
    layers: [
      {
        kind: "path",
        d: "M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32l-1.757-1.18c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.321.142 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Zm1.003-11.69c-.242 0-.487.007-.739.021-1.836.103-2.98.946-2.916 2.143.067 1.256 1.452 1.839 2.784 1.767 1.224-.065 2.818-.543 3.086-3.71a10.5 10.5 0 0 0-2.215-.221Z",
        fill: "#FFFFFF",
        fillRule: "evenodd",
        transform: { translateX: 5.04, translateY: 5.04, scale: 0.58 },
      },
    ],
  },

  slack: {
    container: whiteTile("rounded"),
    layers: [
      { kind: "rect", x: 5.5, y: 9.8, width: 4.5, height: 1.9, rx: 0.95, fill: "#E01E5A" },
      {
        kind: "path",
        d: "M8.1 7.15a.95.95 0 0 1 1.9 0v1.7H9.05a.95.95 0 0 1-.95-.95z",
        fill: "#E01E5A",
      },
      { kind: "rect", x: 12.1, y: 5.5, width: 1.9, height: 4.5, rx: 0.95, fill: "#36C5F0" },
      {
        kind: "path",
        d: "M15.85 8.1a.95.95 0 0 1 0 1.9h-1.7V9.05a.95.95 0 0 1 .95-.95z",
        fill: "#36C5F0",
      },
      { kind: "rect", x: 14.0, y: 12.3, width: 4.5, height: 1.9, rx: 0.95, fill: "#2EB67D" },
      {
        kind: "path",
        d: "M14.95 15.9a.95.95 0 0 1-.95-.95v-1.7h.95a.95.95 0 0 1 0 1.9z",
        fill: "#2EB67D",
      },
      { kind: "rect", x: 10.0, y: 14.0, width: 1.9, height: 4.5, rx: 0.95, fill: "#ECB22E" },
      {
        kind: "path",
        d: "M7.2 14.95a.95.95 0 0 1 0-1.9h1.7v.95a.95.95 0 0 1-.95.95z",
        fill: "#ECB22E",
      },
    ],
  },

  notion: {
    container: whiteTile("rounded", "#CBD5E1"),
    layers: [
      {
        kind: "path",
        d: "M6.4 6.2l9.2-.7 2.4 1.7-8.9.7-2.7-1.7z",
        fill: "#FFFFFF",
        stroke: "#111115",
        strokeWidth: 1.15,
        strokeLinejoin: "round",
      },
      {
        kind: "path",
        d: "M9.1 7.9l8.9-.7v10.2l-8.9.8V7.9z",
        fill: "#FFFFFF",
        stroke: "#111115",
        strokeWidth: 1.15,
        strokeLinejoin: "round",
      },
      {
        kind: "path",
        d: "M6.4 6.2l2.7 1.7v10.3l-2.7-2.1V6.2z",
        fill: "#E4E4E7",
        stroke: "#111115",
        strokeWidth: 1.15,
        strokeLinejoin: "round",
      },
      {
        kind: "path",
        d: "M11.35 15.6v-5.2h1.2l2.15 3.35V10.4h1.15v5.2h-1.15l-2.2-3.4v3.4h-1.15z",
        fill: "#111115",
      },
    ],
  },

  airbnb: {
    container: solidTile("#FF5A5F"),
    layers: [
      {
        kind: "path",
        d: "M12 5.6c-1.35 0-4.7 6.0-5.15 7.95-.4 1.75.75 3.45 2.7 3.45 1.15 0 1.95-.55 2.45-1.3.5.75 1.3 1.3 2.45 1.3 1.95 0 3.1-1.7 2.7-3.45-.45-1.95-3.8-7.95-5.15-7.95z",
        stroke: "#FFFFFF",
        strokeWidth: 1.5,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
      {
        kind: "path",
        d: "M12 15.7c1.05-1.15 1.55-2.3 1.55-3.25a1.55 1.55 0 1 0-3.1 0c0 .95.5 2.1 1.55 3.25z",
        stroke: "#FFFFFF",
        strokeWidth: 1.4,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
    ],
  },

  uber: {
    container: darkTile("rounded", "#09090B"),
    layers: [
      {
        kind: "text",
        text: "Uber",
        x: 12,
        y: 12.2,
        fill: "#FFFFFF",
        fontSize: 7.4,
        fontWeight: 700,
      },
    ],
  },

  // ── 29-38: SPORTS & LIFESTYLE ──────────────────────────────────────────────
  nike: {
    container: darkTile("rounded", "#09090B"),
    layers: [
      {
        kind: "path",
        d: "M19.5 8.1L8.9 12.25c-1.3.5-2.25.3-2.5-.35-.18-.48.05-1.25.72-2.05-.9.75-2.05 2.0-2.25 3.3-.22 1.35.68 2.45 2.25 2.2.92-.15 2.0-.58 2.98-.98L19.5 8.1z",
        fill: "#FFFFFF",
      },
    ],
  },

  adidas: {
    container: darkTile("rounded", "#09090B"),
    layers: [
      { kind: "path", d: "M4.8 16.8l2.1-3.4 2.15 3.4H4.8z", fill: "#FFFFFF" },
      { kind: "path", d: "M9.6 16.8l-1.9-3.1 2.05-1.2 2.65 4.3H9.6z", fill: "#FFFFFF" },
      { kind: "path", d: "M14.3 16.8L10.35 10.35l2.1-1.25 4.7 7.7H14.3z", fill: "#FFFFFF" },
    ],
  },

  puma: {
    container: darkTile("rounded", "#09090B"),
    layers: [
      {
        kind: "path",
        d: "M18.6 7.8c-.45-.28-.98-.22-1.35.06l-.4-.48c-.25.32-.32.68-.22.98-.88.58-1.78 1.38-2.62 2.36-1.02.15-2.15.45-3.2 1.0-1.15.58-2.55.55-3.7.02-.52-.24-.95-.72-1.1-1.32-.12-.45-.68-.32-.6.18.2 1.15.95 2.02 2.08 2.42.82.28 1.68.25 2.48.02l-1.65 2.35c-.22.32.02.75.4.75.3 0 .56-.15.72-.42l1.82-2.65c.85-.08 1.65-.42 2.3-.95l.88 2.35c.14.38.55.52.88.32.28-.16.4-.52.28-.85l-.95-2.68c.8-.72 1.58-1.45 2.25-1.95.48.05.92-.12 1.2-.5.42-.5.38-1.3-.1-1.85z",
        fill: "#FFFFFF",
      },
    ],
  },

  jordan: {
    container: gradientTile("grad-jordan", "#E11D48", "#BE123C"),
    layers: [
      { kind: "circle", cx: 12.1, cy: 6.45, r: 0.9, fill: "#FFFFFF" },
      { kind: "circle", cx: 7.75, cy: 6.1, r: 1.0, fill: "#FFFFFF" },
      {
        kind: "path",
        d: "M8.3 6.75l2.85 1.85 1.4 3.4-2.8 4.45c-.25.38.12.88.55.72.25-.08.45-.25.6-.48l2.25-3.45 2.45 3.1c.28.34.82.22.92-.2.05-.22 0-.45-.15-.62l-2.35-3.15-.55-2.45 2.55-1.1c.35-.15.52-.55.38-.88-.14-.32-.5-.46-.84-.32l-2.85 1.25-2.75-1.9c-.35-.24-.82.06-.6.45z",
        fill: "#FFFFFF",
      },
    ],
  },

  nba: {
    layers: [
      {
        kind: "path",
        d: "M5 3.8h7v16.4H5a2.2 2.2 0 0 1-2.2-2.2V6A2.2 2.2 0 0 1 5 3.8z",
        fill: "#1D428A",
      },
      {
        kind: "path",
        d: "M12 3.8h7A2.2 2.2 0 0 1 21.2 6v12a2.2 2.2 0 0 1-2.2 2.2h-7V3.8z",
        fill: "#C8102E",
      },
      { kind: "circle", cx: 11.8, cy: 6.5, r: 0.95, fill: "#FFFFFF" },
      {
        kind: "path",
        d: "M12.2 7.7c-1.0 0-1.85.55-2.35 1.4l-1.55 2.65c-.22.38.12.82.54.72l1.65-.45-.85 2.95 2.0 3.75h1.25l-.65-3.3 1.7-2.65-.95-2.1 1.9.75c.35.14.72-.12.7-.5-.02-.25-.18-.48-.42-.58l-2.0-1.0c-.3-.95-.65-1.64-.97-1.64z",
        fill: "#FFFFFF",
      },
      { kind: "circle", cx: 8.65, cy: 13.8, r: 0.85, fill: "#FFFFFF" },
      {
        kind: "rect",
        x: 2.8,
        y: 3.8,
        width: 18.4,
        height: 16.4,
        rx: 2.4,
        stroke: "#FFFFFF",
        strokeWidth: 0.75,
      },
    ],
  },

  formula1: {
    container: solidTile("#E10600"),
    layers: [
      {
        kind: "path",
        d: "M4.1 14.8l3.5-4.35c.8-1.0 2.0-1.55 3.3-1.55h7.6l-1.3 1.72h-5.9c-.65 0-1.25.3-1.65.8l-2.25 3.38H4.1z",
        fill: "#FFFFFF",
      },
      {
        kind: "path",
        d: "M8.3 14.8l1.6-2.05c.35-.45.9-.7 1.45-.7h4.4l-1.25 1.62h-2.55c-.25 0-.5.12-.65.32l-.6.81H8.3z",
        fill: "#FFFFFF",
      },
      {
        kind: "path",
        d: "M16.95 8.9h2.55l-4.5 5.9h-2.55l4.5-5.9z",
        fill: "#FFFFFF",
      },
    ],
  },

  football_ball: {
    container: whiteTile("circle", "#18181B"),
    layers: [
      {
        kind: "path",
        d: regularPolygonPath(5, 12, 12, 3.25),
        fill: "#18181B",
      },
      { kind: "path", d: "M12 8.75V3.5M15.1 11L20.5 9.2M13.9 14.6L17.2 19.5M10.1 14.6L6.8 19.5M8.9 11L3.5 9.2", stroke: "#18181B", strokeWidth: 0.95, clipToCircle: { cx: 12, cy: 12, r: 9.8 } },
      { kind: "path", d: "M10.2 3.2L12 4.5l1.8-1.3z", fill: "#18181B", clipToCircle: { cx: 12, cy: 12, r: 10.2 } },
      { kind: "path", d: "M21.0 7.6L19.6 9.6l1.8 1.6z", fill: "#18181B", clipToCircle: { cx: 12, cy: 12, r: 10.2 } },
      { kind: "path", d: "M3.0 7.6L4.4 9.6l-1.8 1.6z", fill: "#18181B", clipToCircle: { cx: 12, cy: 12, r: 10.2 } },
      { kind: "path", d: "M18.6 19.8l-1.8-1.0-1.0 2.0z", fill: "#18181B", clipToCircle: { cx: 12, cy: 12, r: 10.2 } },
      { kind: "path", d: "M5.4 19.8l1.8-1.0 1.0 2.0z", fill: "#18181B", clipToCircle: { cx: 12, cy: 12, r: 10.2 } },
    ],
  },

  gym_fitness: {
    container: gradientTile("grad-gym", "#FB923C", "#EA580C"),
    layers: [
      { kind: "rect", x: 5.0, y: 8.6, width: 2.0, height: 6.8, rx: 0.8, fill: "#FFFFFF" },
      { kind: "rect", x: 7.4, y: 9.6, width: 1.5, height: 4.8, rx: 0.6, fill: "#FFFFFF" },
      { kind: "rect", x: 8.9, y: 11.2, width: 6.2, height: 1.6, rx: 0.4, fill: "#FFFFFF" },
      { kind: "rect", x: 15.1, y: 9.6, width: 1.5, height: 4.8, rx: 0.6, fill: "#FFFFFF" },
      { kind: "rect", x: 17.0, y: 8.6, width: 2.0, height: 6.8, rx: 0.8, fill: "#FFFFFF" },
    ],
  },

  tennis_ball: {
    container: { shape: "circle", fill: "#A3E635", stroke: "#4D7C0F" },
    layers: [
      {
        kind: "path",
        d: "M7.2 2.4c3.6 3.5 3.6 15.7 0 19.2",
        stroke: "#FFFFFF",
        strokeWidth: 1.55,
        strokeLinecap: "round",
        clipToCircle: { cx: 12, cy: 12, r: 10.2 },
      },
      {
        kind: "path",
        d: "M16.8 2.4c-3.6 3.5-3.6 15.7 0 19.2",
        stroke: "#FFFFFF",
        strokeWidth: 1.55,
        strokeLinecap: "round",
        clipToCircle: { cx: 12, cy: 12, r: 10.2 },
      },
    ],
  },

  redbull: {
    container: solidTile("#0C1F4A"),
    layers: [
      { kind: "circle", cx: 12, cy: 12, r: 4.8, fill: "#FACC15" },
      {
        kind: "path",
        d: "M4.0 13.8c1.1-1.35 2.8-1.95 4.4-1.85.85.05 1.75.42 2.45 1.0l.75-.45c-.6-.88-1.45-1.38-2.35-1.52-.5-.95-1.05-1.25-1.75-1.2l.4 1.15c-1.3.12-2.6.82-3.5 2.05l-.4.82z",
        fill: "#EF4444",
      },
      {
        kind: "path",
        d: "M20.0 13.8c-1.1-1.35-2.8-1.95-4.4-1.85-.85.05-1.75.42-2.45 1.0l-.75-.45c.6-.88 1.45-1.38 2.35-1.52.5-.95 1.05-1.25 1.75-1.2l-.4 1.15c1.3.12 2.6.82 3.5 2.05l.4.82z",
        fill: "#EF4444",
      },
      {
        kind: "path",
        d: "M5.2 14.8l4.4-1.45-1.35 2.15H5.2zM18.8 14.8l-4.4-1.45 1.35 2.15h3.05z",
        fill: "#EF4444",
      },
    ],
  },

  // ── 39-80: DEV STACKS, LANGUAGES, FRAMEWORKS, CLOUD ────────────────────────
  nextjs: {
    container: darkTile("circle", "#09090B"),
    layers: [
      { kind: "rect", x: 7.7, y: 7.7, width: 1.5, height: 8.6, rx: 0.3, fill: "#FFFFFF" },
      {
        kind: "rect",
        x: 14.8,
        y: 7.7,
        width: 1.5,
        height: 6.2,
        rx: 0.3,
        fillGradient: { id: "grad-next-stem", from: "#FFFFFF", via: "#A1A1AA", to: "#09090B", x1: 15.5, y1: 8.0, x2: 15.5, y2: 13.8 },
      },
      {
        kind: "path",
        d: "M7.8 7.7h1.8l7.3 9.7c-.45.4-.95.7-1.45.95L7.8 7.7z",
        fillGradient: { id: "grad-next-diag", from: "#FFFFFF", via: "#D4D4D8", to: "#09090B", x1: 9.0, y1: 8.4, x2: 15.8, y2: 16.5 },
        clipToCircle: { cx: 12, cy: 12, r: 9.6 },
      },
    ],
  },

  react: {
    container: darkTile("rounded", "#0F172A"),
    layers: [
      { kind: "circle", cx: 12, cy: 12, r: 1.45, fill: "#61DAFB" },
      { kind: "ellipse", cx: 12, cy: 12, rx: 7.4, ry: 2.8, rotateDeg: 0, stroke: "#61DAFB", strokeWidth: 1.0 },
      { kind: "ellipse", cx: 12, cy: 12, rx: 7.4, ry: 2.8, rotateDeg: 60, stroke: "#61DAFB", strokeWidth: 1.0 },
      { kind: "ellipse", cx: 12, cy: 12, rx: 7.4, ry: 2.8, rotateDeg: 120, stroke: "#61DAFB", strokeWidth: 1.0 },
    ],
  },

  vue: {
    container: whiteTile("rounded"),
    layers: [
      {
        kind: "path",
        d: "M4.6 6.2L12 19.0 19.4 6.2h-3.0L12 13.8 7.6 6.2H4.6z",
        fill: "#41B883",
      },
      {
        kind: "path",
        d: "M7.6 6.2L12 13.8 16.4 6.2h-2.6L12 9.4 10.2 6.2H7.6z",
        fill: "#34495E",
      },
    ],
  },

  angular: {
    layers: [
      { kind: "path", d: "M12 2.4L3.6 5.4l1.3 11.2L12 20.8l7.1-4.2 1.3-11.2L12 2.4z", fill: "#DD0031" },
      { kind: "path", d: "M12 2.4v18.4l7.1-4.2 1.3-11.2L12 2.4z", fill: "#C3002F" },
      {
        kind: "path",
        d: "M12 5.4L7.1 16.4h1.85l1.0-2.5h4.1l1.0 2.5H16.9L12 5.4zm-1.45 7.0L12 8.7l1.45 3.7h-2.9z",
        fill: "#FFFFFF",
      },
    ],
  },

  svelte: {
    container: whiteTile("rounded"),
    layers: [
      {
        kind: "path",
        d: "M10.354 21.12a6.453 6.453 0 0 1-5.155-1.99 5.565 5.565 0 0 1-.827-6.115.657.657 0 0 1 .27-.28.606.606 0 0 1 .38-.07.586.586 0 0 1 .265.11.618.618 0 0 1 .188.248l.195.44a3.32 3.32 0 0 0-.143.997c0 .756.298 1.48.832 2.016a3.374 3.374 0 0 0 2.138.943c.768.06 1.53-.13 2.16-.541l4.467-2.852a2.416 2.416 0 0 0 .938-1.158 2.458 2.458 0 0 0-.094-1.787 2.426 2.426 0 0 0-.968-1.111 2.38 2.38 0 0 0-1.466-.359 2.387 2.387 0 0 0-1.132.35l-1.7.997a5.598 5.598 0 0 1-4.88.532 5.42 5.42 0 0 1-3.175-3.443 5.588 5.588 0 0 1 .486-4.703 5.45 5.45 0 0 1 2.008-1.994L11.425.998a6.382 6.382 0 0 1 5.158.027 5.475 5.475 0 0 1 3.173 3.748 5.567 5.567 0 0 1-1.356 4.716.652.652 0 0 1-.27.277.606.606 0 0 1-.38.07.586.586 0 0 1-.264-.11.617.617 0 0 1-.189-.247l-.195-.44c.095-.324.143-.66.143-.997a2.84 2.84 0 0 0-.831-2.016 3.373 3.373 0 0 0-2.138-.944 3.33 3.33 0 0 0-2.161.542l-4.467 2.852a2.42 2.42 0 0 0-.937 1.158 2.46 2.46 0 0 0 .093 1.788c.225.47.575.87 1.011 1.151a2.38 2.38 0 0 0 1.423.318c.4-.02.787-.14 1.132-.35l1.7-.997a5.596 5.596 0 0 1 4.88-.532 5.42 5.42 0 0 1 3.175 3.443 5.588 5.588 0 0 1-.486 4.703 5.451 5.451 0 0 1-2.008 1.994l-4.442 2.848a6.453 6.453 0 0 1-1.258.558Z",
        fill: "#FF3E00",
        fillRule: "nonzero",
        transform: { translateX: 4.92, translateY: 5.04, scale: 0.59 },
      },
    ],
  },

  tanstack: {
    container: gradientTile("grad-tanstack", "#F97316", "#EA580C", "vertical", undefined, "circle"),
    layers: [
      { kind: "circle", cx: 12, cy: 11.2, r: 5.5, fill: "#FEF08A", opacity: 0.9 },
      {
        kind: "path",
        d: "M12.1 16.5c-.1-2.7.5-5.3 1.4-7.2-.95-.65-2.5-.55-3.4.35.95-.2 2.05.05 2.65.45-1.35.15-2.55.85-3.1 1.95.95-.55 2.05-.75 2.85-.6-1.05.65-1.65 1.65-1.75 2.85.65-.8 1.45-1.3 2.15-1.45-.1 1.15-.2 2.35-.2 3.65h-.6z",
        fill: "#064E3B",
      },
      {
        kind: "path",
        d: "M13.5 9.3c1.05-.7 2.55-.6 3.45.25-.95-.2-2.0.05-2.65.45 1.3.15 2.45.85 3.0 1.95-.95-.55-2.0-.75-2.8-.6.9.55 1.45 1.4 1.6 2.45-.6-.65-1.3-1.05-2.0-1.25l-.6-3.25z",
        fill: "#064E3B",
      },
      {
        kind: "path",
        d: "M5.5 16.6c2.0-1.15 11.0-1.15 13.0 0",
        stroke: "#0284C7",
        strokeWidth: 1.5,
        strokeLinecap: "round",
      },
    ],
  },

  prisma: {
    container: solidTile("#0C344B"),
    layers: [
      {
        kind: "path",
        d: "M17.85 15.85l-4.55-9.8c-.28-.6-.95-.72-1.4-.2L6.2 13.7c-.28.38-.25.92.08 1.25l2.75 2.9c.38.4.95.52 1.48.35l6.75-2.18c.65-.2.9-.8.59-1.17z",
        fill: "#FFFFFF",
      },
      {
        kind: "path",
        d: "M12.55 7.45l-3.3 8.95 6.45-2.05-3.15-6.9z",
        fill: "#38BDF8",
        opacity: 0.35,
      },
    ],
  },

  mongodb: {
    container: darkTile("rounded", "#001E2B"),
    layers: [
      {
        kind: "path",
        d: "M12 4.1c-2.3 2.85-3.85 5.4-3.85 8.35 0 2.55 1.4 4.7 3.45 5.7l.4 2.1.4-2.1c2.05-1.0 3.45-3.15 3.45-5.7 0-2.95-1.55-5.5-3.85-8.35z",
        fill: "#00ED64",
      },
      {
        kind: "path",
        d: "M12 4.1v14.05c2.05-1.0 3.45-3.15 3.45-5.7 0-2.95-1.55-5.5-3.45-8.35z",
        fill: "#00C853",
      },
      {
        kind: "path",
        d: "M12 5.2v13.8",
        stroke: "#001E2B",
        strokeWidth: 0.9,
        strokeLinecap: "round",
      },
    ],
  },

  postgres: {
    container: solidTile("#336791"),
    layers: [
      {
        kind: "path",
        d: "M12 5.4c-2.6 0-5.5 1.3-5.9 4.1-.3 2.1.65 4.2 2.25 4.8.45.18.85-.15.95-.7.1-.5.05-1.1.05-1.1.4.25 1.0.45 1.7.45v3.3c0 .95.75 1.65 1.7 1.65.85 0 1.55-.65 1.6-1.5l-.05-.65c-.02-.25-.25-.38-.45-.25-.35.2-.75.02-.8-.35v-2.2c.65-.1 1.25-.4 1.7-.8.45 1.3.5 2.3.98 2.3.58 0 .82-.95.92-1.7.9-.85 1.6-2.25 1.35-4.1C17.5 6.7 14.6 5.4 12 5.4z",
        fill: "#FFFFFF",
      },
      { kind: "path", d: "M9.0 7.6c-1.2 1.1-1.35 3.2-.55 5.1", stroke: "#336791", strokeWidth: 0.75, strokeLinecap: "round" },
      { kind: "path", d: "M15.0 7.6c1.2 1.1 1.35 3.2.55 5.1", stroke: "#336791", strokeWidth: 0.75, strokeLinecap: "round" },
      { kind: "circle", cx: 10.6, cy: 9.0, r: 0.55, fill: "#336791" },
      { kind: "circle", cx: 13.4, cy: 9.0, r: 0.55, fill: "#336791" },
    ],
  },

  supabase: {
    container: darkTile("rounded", "#18181B"),
    layers: [
      {
        kind: "path",
        d: "M13.15 18.85c-.38.48-1.15.22-1.16-.4l-.13-8.05h6.1c1.1 0 1.72 1.28 1.03 2.15l-5.84 6.3z",
        fill: "#3ECF8E",
      },
      {
        kind: "path",
        d: "M10.85 5.15c.38-.48 1.15-.22 1.16.4l.06 8.05H6.04c-1.1 0-1.72-1.28-1.03-2.15l5.84-6.3z",
        fill: "#24B47E",
      },
    ],
  },

  tailwind: {
    container: darkTile("rounded", "#0F172A"),
    layers: [
      {
        kind: "path",
        d: "M12 6.8c-2.2 0-3.58 1.1-4.13 3.3.82-1.1 1.79-1.51 2.89-1.24.63.16 1.08.61 1.57 1.12.81.82 1.74 1.77 3.79 1.77 2.2 0 3.58-1.1 4.13-3.3-.82 1.1-1.79 1.51-2.89 1.24-.63-.16-1.08-.61-1.57-1.12-.81-.82-1.74-1.77-3.79-1.77zM7.88 11.75c-2.2 0-3.58 1.1-4.13 3.3.82-1.1 1.79-1.51 2.89-1.24.63.16 1.08.61 1.57 1.12.81.82 1.74 1.77 3.79 1.77 2.2 0 3.58-1.1 4.13-3.3-.82 1.1-1.79 1.51-2.89 1.24-.63-.16-1.08-.61-1.57-1.12-.81-.82-1.74-1.77-3.79-1.77z",
        fill: "#38BDF8",
      },
    ],
  },

  nodejs: {
    layers: [
      {
        kind: "path",
        d: regularPolygonPath(6, 12, 12, 10.2),
        fill: "#5FA04E",
      },
      {
        kind: "path",
        d: regularPolygonPath(6, 12, 12, 6.2),
        fill: "#3C873A",
      },
      {
        kind: "text",
        text: "JS",
        x: 12,
        y: 12.2,
        fill: "#FFFFFF",
        fontSize: 6.4,
        fontWeight: 900,
      },
    ],
  },

  typescript: {
    container: solidTile("#3178C6"),
    layers: [
      {
        kind: "text",
        text: "TS",
        x: 15.1,
        y: 15.7,
        fill: "#FFFFFF",
        fontSize: 8.6,
        fontWeight: 900,
      },
    ],
  },

  python: {
    container: whiteTile("rounded"),
    layers: [
      {
        kind: "path",
        d: "M11.914 0C5.82 0 6.2 2.656 6.2 2.656l.007 2.752h5.814v.826H3.9S0 5.792 0 11.964s3.404 5.953 3.404 5.953h2.03v-2.864s-.109-3.404 3.35-3.404h5.766s3.24.052 3.24-3.131V3.186S18.28 0 11.914 0zm-3.2 1.84a1.044 1.044 0 1 1 0 2.088 1.044 1.044 0 0 1 0-2.088z",
        fill: "#3776AB",
        fillRule: "evenodd",
        transform: { translateX: 5.28, translateY: 5.28, scale: 0.56 },
      },
      {
        kind: "path",
        d: "M12.086 24c6.094 0 5.714-2.656 5.714-2.656l-.007-2.752h-5.814v-.826H20.1S24 18.208 24 12.036s-3.404-5.953-3.404-5.953h-2.03v2.864s.109 3.404-3.35 3.404H9.45s-3.24-.052-3.24 3.131v5.332S5.72 24 12.086 24zm3.2-1.84a1.044 1.044 0 1 1 0-2.088 1.044 1.044 0 0 1 0 2.088z",
        fill: "#FFD43B",
        fillRule: "evenodd",
        transform: { translateX: 5.28, translateY: 5.28, scale: 0.56 },
      },
    ],
  },

  docker: {
    container: solidTile("#1D63ED"),
    layers: [
      { kind: "rect", x: 7.4, y: 9.2, width: 2.0, height: 1.75, rx: 0.2, fill: "#FFFFFF" },
      { kind: "rect", x: 9.8, y: 9.2, width: 2.0, height: 1.75, rx: 0.2, fill: "#FFFFFF" },
      { kind: "rect", x: 12.2, y: 9.2, width: 2.0, height: 1.75, rx: 0.2, fill: "#FFFFFF" },
      { kind: "rect", x: 9.8, y: 7.0, width: 2.0, height: 1.75, rx: 0.2, fill: "#FFFFFF" },
      { kind: "rect", x: 12.2, y: 7.0, width: 2.0, height: 1.75, rx: 0.2, fill: "#FFFFFF" },
      {
        kind: "path",
        d: "M18.9 10.9c-.45-.3-.9-.4-1.3-.3-.1-.75-.5-1.45-1.15-1.85-.35.5-.45 1.25-.25 1.85-.35.2-.85.3-1.4.3H5.2c-.25 2.4.85 5.45 4.4 6.2 3.15.65 6.45-.5 7.95-3.45.75-.05 1.45-.55 1.8-1.3-.15-.65-.15-1.1-.45-1.45z",
        fill: "#FFFFFF",
      },
    ],
  },

  cloudflare: {
    container: whiteTile("rounded"),
    layers: [
      {
        kind: "path",
        d: "M15.45 15.75c.14-.46.08-.88-.14-1.2-.22-.3-.57-.47-1.02-.48l-7.25-.1c-.07 0-.13-.04-.16-.1-.03-.06-.03-.14.01-.2.05-.08.13-.13.23-.14l7.3-.1c.8-.04 1.67-.7 1.98-1.52l.42-1.12a.28.28 0 0 0 .01-.16A4.48 4.48 0 0 0 8.5 9.1c-.4-.3-.92-.43-1.45-.36-.95.12-1.7.9-1.78 1.85-.03.28 0 .56.08.82A2.95 2.95 0 0 0 3.0 14.32c0 .22.02.43.07.64.02.1.11.17.21.17h11.88c.13 0 .25-.08.29-.2v.82z",
        fill: "#F38020",
      },
      {
        kind: "path",
        d: "M17.55 11.45c-.12 0-.23.01-.34.03-.08.01-.14.07-.17.15l-.3 1.04c-.14.46-.08.88.14 1.2.22.3.57.47 1.02.48l1.62.1c.08 0 .14.05.17.11.03.07.03.15-.01.21-.05.08-.13.13-.23.14l-1.7.1c-.83.04-1.7.72-2 1.56l-.13.36h5.1c.1 0 .18-.07.2-.17.1-.38.15-.78.15-1.18 0-2.28-1.85-4.13-4.13-4.13h.5z",
        fill: "#FAAE40",
      },
      {
        kind: "path",
        d: "M15.85 11.2a2.9 2.9 0 0 0-3.45-2.05",
        stroke: "#F38020",
        strokeWidth: 0.9,
        strokeLinecap: "round",
      },
    ],
  },

  vercel: {
    container: darkTile("rounded", "#09090B"),
    layers: [
      { kind: "path", d: "M12 6.8l6.3 10.6H5.7L12 6.8z", fill: "#FFFFFF" },
    ],
  },

  openai: {
    container: solidTile("#10A37F"),
    layers: [
      {
        kind: "path",
        d: "M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.965A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.5 4.5 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.023l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 9.23V6.897a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.135l-2.02-1.164a.08.08 0 0 1-.038-.057V6.075a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5Z",
        fill: "#FFFFFF",
        transform: { translateX: 5.04, translateY: 5.04, scale: 0.58 },
      },
    ],
  },

  anthropic: {
    container: solidTile("#D97757"),
    layers: [
      { kind: "path", d: "M12 5.3v13.4", stroke: "#FFFFFF", strokeWidth: 1.45, strokeLinecap: "round" },
      { kind: "path", d: "M5.3 12h13.4", stroke: "#FFFFFF", strokeWidth: 1.45, strokeLinecap: "round" },
      { kind: "path", d: "M7.2 7.2l9.6 9.6", stroke: "#FFFFFF", strokeWidth: 1.45, strokeLinecap: "round" },
      { kind: "path", d: "M16.8 7.2l-9.6 9.6", stroke: "#FFFFFF", strokeWidth: 1.45, strokeLinecap: "round" },
      { kind: "path", d: "M9.4 5.9l5.2 12.2", stroke: "#FFFFFF", strokeWidth: 1.1, strokeLinecap: "round" },
      { kind: "path", d: "M5.9 14.6l12.2-5.2", stroke: "#FFFFFF", strokeWidth: 1.1, strokeLinecap: "round" },
    ],
  },

  gemini: {
    container: whiteTile("rounded"),
    layers: [
      {
        kind: "path",
        d: "M12 4.4c.6 4.2 3.4 7.0 7.6 7.6-4.2.6-7.0 3.4-7.6 7.6-.6-4.2-3.4-7.0-7.6-7.6 4.2-.6 7.0-3.4 7.6-7.6z",
        fillGradient: { id: "grad-gemini", from: "#4285F4", via: "#9B72CB", to: "#D96570", direction: "diagonal-tl-br" },
      },
    ],
  },

  midjourney: {
    container: darkTile("circle", "#0F172A"),
    layers: [
      {
        kind: "path",
        d: "M7.4 14.9c2.5-1.7 3.3-4.6 3.0-7.7 2.8 2.1 3.7 4.9 3.3 7.7H7.4z",
        fill: "#FFFFFF",
        opacity: 0.92,
      },
      {
        kind: "path",
        d: "M13.9 14.9c1.5-1.4 2.0-3.3 1.7-5.2 1.5 1.5 2.2 3.4 1.9 5.2h-3.6z",
        fill: "#CBD5E1",
      },
      {
        kind: "path",
        d: "M5.8 16.5c2.2 1.15 10.2 1.15 12.4 0M7.4 18.4c2.4.75 6.8.75 9.2 0",
        stroke: "#38BDF8",
        strokeWidth: 1.3,
        strokeLinecap: "round",
      },
    ],
  },

  huggingface: {
    layers: [
      { kind: "circle", cx: 12, cy: 11.4, r: 7.4, fill: "#FFD21E", stroke: "#EAB308", strokeWidth: 0.7 },
      { kind: "path", d: "M8.8 10.4c.45-.85 1.45-.85 1.9 0", stroke: "#18181B", strokeWidth: 1.05, strokeLinecap: "round" },
      { kind: "path", d: "M13.3 10.4c.45-.85 1.45-.85 1.9 0", stroke: "#18181B", strokeWidth: 1.05, strokeLinecap: "round" },
      { kind: "circle", cx: 7.8, cy: 11.9, r: 0.9, fill: "#FB923C", opacity: 0.85 },
      { kind: "circle", cx: 16.2, cy: 11.9, r: 0.9, fill: "#FB923C", opacity: 0.85 },
      { kind: "path", d: "M9.4 12.3h5.2a2.6 2.6 0 0 1-5.2 0z", fill: "#18181B" },
      { kind: "path", d: "M10.7 14.2c.65-.45 1.95-.45 2.6 0a2.1 2.1 0 0 1-2.6 0z", fill: "#EF4444" },
      {
        kind: "path",
        d: "M4.5 14.8c0-1.1.9-1.5 1.7-.7l1.3 1.2c.6.6.4 1.7-.4 2.1-.9.4-2.1-.1-2.5-1.1l-.1-1.5z",
        fill: "#FDE047",
        stroke: "#18181B",
        strokeWidth: 0.8,
        strokeLinejoin: "round",
      },
      {
        kind: "path",
        d: "M19.5 14.8c0-1.1-.9-1.5-1.7-.7l-1.3 1.2c-.6.6-.4 1.7.4 2.1.9.4 2.1-.1 2.5-1.1l.1-1.5z",
        fill: "#FDE047",
        stroke: "#18181B",
        strokeWidth: 0.8,
        strokeLinejoin: "round",
      },
    ],
  },

  mistral: {
    container: whiteTile("rounded"),
    layers: [
      { kind: "rect", x: 5.0, y: 6.0, width: 2.8, height: 2.2, fill: "#FFD800" },
      { kind: "rect", x: 16.2, y: 6.0, width: 2.8, height: 2.2, fill: "#FFD800" },
      { kind: "rect", x: 5.0, y: 8.2, width: 5.6, height: 2.2, fill: "#FFAF00" },
      { kind: "rect", x: 13.4, y: 8.2, width: 5.6, height: 2.2, fill: "#FFAF00" },
      { kind: "rect", x: 5.0, y: 10.4, width: 14.0, height: 2.2, fill: "#FF8205" },
      { kind: "rect", x: 5.0, y: 12.6, width: 2.8, height: 2.2, fill: "#FA500F" },
      { kind: "rect", x: 10.6, y: 12.6, width: 2.8, height: 2.2, fill: "#FA500F" },
      { kind: "rect", x: 16.2, y: 12.6, width: 2.8, height: 2.2, fill: "#FA500F" },
      { kind: "rect", x: 5.0, y: 14.8, width: 2.8, height: 2.2, fill: "#E10500" },
      { kind: "rect", x: 16.2, y: 14.8, width: 2.8, height: 2.2, fill: "#E10500" },
    ],
  },

  deepseek: {
    container: whiteTile("rounded"),
    layers: [
      {
        kind: "path",
        d: "M19.4 8.5c-1.05.2-1.85.9-2.25 1.8-.45-.9-1.05-1.6-1.8-2.0.15 1.0-.1 1.9-.65 2.55-1.25-1.5-3.35-2.15-5.45-1.55-2.65.75-4.35 3.15-3.9 5.55.45 2.4 3.0 3.75 6.0 3.45 2.85-.3 4.85-2.0 5.3-4.55.9-.55 1.75-.75 2.65-.65-.45-.75-.25-1.85.6-2.8-.1-.7-.25-1.35-.5-1.8z",
        fill: "#4D6BFE",
      },
      { kind: "circle", cx: 8.9, cy: 12.1, r: 0.78, fill: "#FFFFFF" },
      { kind: "path", d: "M7.6 14.7c1.25.65 2.9.55 3.9-.2", stroke: "#FFFFFF", strokeWidth: 0.95, strokeLinecap: "round" },
    ],
  },

  crypto_btc: {
    container: solidTile("#F7931A", "circle"),
    layers: [
      {
        kind: "path",
        d: "M14.7 10.6c.2-1.35-.82-2.08-2.22-2.56l.45-1.82-1.1-.28-.44 1.77c-.29-.07-.59-.14-.88-.2l.44-1.78-1.1-.27-.45 1.81c-.24-.05-.48-.11-.71-.17l-1.52-.38-.29 1.18s.82.19.8.2c.45.11.53.41.51.64l-.51 2.06c.03.01.07.02.12.04l-.12-.03-.72 2.88c-.05.14-.19.34-.5.26.01.02-.8-.2-.8-.2l-.55 1.26 1.44.36c.27.07.53.14.79.2l-.46 1.84 1.1.27.45-1.82c.3.08.59.16.88.23l-.45 1.81 1.1.28.46-1.84c1.88.36 3.3.21 3.89-1.49.48-1.37-.02-2.16-1.02-2.67.73-.17 1.28-.65 1.42-1.64zm-2.55 3.57c-.34 1.37-2.64.63-3.39.44l.61-2.43c.75.19 3.14.56 2.78 1.99zm.34-3.59c-.31 1.24-2.23.61-2.85.46l.55-2.2c.62.16 2.62.45 2.3 1.74z",
        fill: "#FFFFFF",
      },
    ],
  },

  cart: {
    container: gradientTile("grad-cart", "#3B82F6", "#1D4ED8"),
    layers: [
      {
        kind: "path",
        d: "M5.5 7.2h2.1l1.7 7.1h7.6l1.4-4.9H8.8",
        stroke: "#FFFFFF",
        strokeWidth: 1.55,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
      { kind: "circle", cx: 10.2, cy: 17.2, r: 1.2, fill: "#FFFFFF" },
      { kind: "circle", cx: 15.8, cy: 17.2, r: 1.2, fill: "#FFFFFF" },
    ],
  },

  wifi_icon: {
    container: solidTile("#0EA5E9"),
    layers: [
      { kind: "path", d: "M6.1 10.4a8.4 8.4 0 0 1 11.8 0", stroke: "#FFFFFF", strokeWidth: 1.65, strokeLinecap: "round" },
      { kind: "path", d: "M8.4 13.0a5.1 5.1 0 0 1 7.2 0", stroke: "#FFFFFF", strokeWidth: 1.65, strokeLinecap: "round" },
      { kind: "circle", cx: 12, cy: 16.0, r: 1.2, fill: "#FFFFFF" },
    ],
  },

  shield_icon: {
    container: solidTile("#10B981"),
    layers: [
      {
        kind: "path",
        d: "M12 5.4l5.6 2.1v4.4c0 3.45-2.4 6.55-5.6 7.45-3.2-.9-5.6-4.0-5.6-7.45V7.5L12 5.4z",
        stroke: "#FFFFFF",
        strokeWidth: 1.5,
        strokeLinejoin: "round",
      },
      {
        kind: "path",
        d: "M9.5 12.1l1.7 1.7 3.5-3.6",
        stroke: "#FFFFFF",
        strokeWidth: 1.55,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
    ],
  },

  star_icon: {
    container: solidTile("#F59E0B"),
    layers: [
      {
        kind: "path",
        d: starPolygonPath(5, 12, 12.3, 6.4, 2.75),
        fill: "#FFFFFF",
      },
    ],
  },

  rust: {
    container: darkTile("circle", "#18181B"),
    layers: [
      { kind: "path", d: starPolygonPath(14, 12, 12, 8.7, 7.2), stroke: "#FFFFFF", strokeWidth: 1.15, strokeLinejoin: "round" },
      { kind: "circle", cx: 12, cy: 12, r: 5.5, fill: "#18181B", stroke: "#FFFFFF", strokeWidth: 1.0 },
      { kind: "circle", cx: 12, cy: 7.2, r: 0.65, fill: "#FFFFFF" },
      { kind: "circle", cx: 7.5, cy: 14.3, r: 0.65, fill: "#FFFFFF" },
      { kind: "circle", cx: 16.5, cy: 14.3, r: 0.65, fill: "#FFFFFF" },
      { kind: "text", text: "R", x: 12, y: 12.4, fill: "#FFFFFF", fontSize: 9.0, fontWeight: 900, fontFamily: "serif" },
    ],
  },

  golang: {
    container: solidTile("#00ADD8"),
    layers: [
      { kind: "path", d: "M4.0 10.6h2.8M4.6 12.4h2.0M3.8 14.2h2.4", stroke: "#FFFFFF", strokeWidth: 0.95, strokeLinecap: "round" },
      {
        kind: "text",
        text: "GO",
        x: 13.6,
        y: 12.4,
        fill: "#FFFFFF",
        fontSize: 8.6,
        fontWeight: 900,
        fontStyle: "italic",
      },
    ],
  },

  cplusplus: {
    layers: [
      { kind: "path", d: regularPolygonPath(6, 12, 12, 10.2), fill: "#00599C" },
      { kind: "path", d: "M12 12l8.8-5.1V17.1L12 12z", fill: "#004482" },
      { kind: "path", d: "M12 12l8.8 5.1L12 22.2 3.2 17.1 12 12z", fill: "#004482", opacity: 0.55 },
      {
        kind: "path",
        d: "M11.6 15.1a3.6 3.6 0 1 1 0-6.2l-1.3 1.25a1.95 1.95 0 1 0 0 3.7l1.3 1.25z",
        fill: "#FFFFFF",
        transform: { translateX: -0.9, translateY: 0 },
      },
      { kind: "path", d: "M12.3 12h2.2M13.4 10.9v2.2M15.6 12h2.2M16.7 10.9v2.2", stroke: "#FFFFFF", strokeWidth: 0.95, strokeLinecap: "round" },
    ],
  },

  java: {
    container: whiteTile("rounded"),
    layers: [
      { kind: "path", d: "M11.6 4.4c-1.2 1.2-.2 2.2.8 3.2s-.2 1.7-.9 2.2", stroke: "#EA2D2E", strokeWidth: 1.05, strokeLinecap: "round" },
      { kind: "path", d: "M14.2 5.2c-.9.9-.1 1.7.7 2.4s-.1 1.3-.7 1.7", stroke: "#EA2D2E", strokeWidth: 1.05, strokeLinecap: "round" },
      { kind: "path", d: "M8.0 11.4h7.5v3.0a3.4 3.4 0 0 1-3.4 3.4h-.7a3.4 3.4 0 0 1-3.4-3.4v-3.0z", fill: "#5382A1" },
      { kind: "path", d: "M15.5 12.1h1.3c.75 0 1.3.55 1.3 1.25s-.55 1.25-1.3 1.25h-1.3", stroke: "#5382A1", strokeWidth: 1.05 },
      { kind: "path", d: "M6.5 19.0c2.6.9 8.4.9 11.0 0", stroke: "#5382A1", strokeWidth: 1.2, strokeLinecap: "round" },
    ],
  },

  git: {
    layers: [
      { kind: "rect", x: 5.0, y: 5.0, width: 14.0, height: 14.0, rx: 2.2, rotateDeg: 45, pivotX: 12, pivotY: 12, fill: "#F05032" },
      { kind: "path", d: "M9.6 5.6l5.6 5.6M11.6 7.6v6.8", stroke: "#FFFFFF", strokeWidth: 1.3, strokeLinecap: "round" },
      { kind: "circle", cx: 11.6, cy: 7.8, r: 1.2, fill: "#FFFFFF" },
      { kind: "circle", cx: 11.6, cy: 14.6, r: 1.2, fill: "#FFFFFF" },
      { kind: "circle", cx: 15.2, cy: 11.2, r: 1.2, fill: "#FFFFFF" },
    ],
  },

  gitlab: {
    layers: [
      { kind: "path", d: "M12 20.6l3.3-10.1H8.7L12 20.6z", fill: "#E24329" },
      { kind: "path", d: "M12 20.6L8.7 10.5H3.9L12 20.6z", fill: "#FC6D26" },
      { kind: "path", d: "M3.9 10.5L2.9 13.7c-.1.3.01.62.26.8L12 20.6 3.9 10.5z", fill: "#FCA326" },
      { kind: "path", d: "M3.9 10.5h4.8L6.65 4.2c-.1-.33-.58-.33-.68 0L3.9 10.5z", fill: "#E24329" },
      { kind: "path", d: "M12 20.6l3.3-10.1h4.8L12 20.6z", fill: "#FC6D26" },
      { kind: "path", d: "M20.1 10.5l1.0 3.2c.1.3-.01.62-.26.8L12 20.6l8.1-10.1z", fill: "#FCA326" },
      { kind: "path", d: "M20.1 10.5h-4.8l2.05-6.3c.1-.33.58-.33.68 0l2.07 6.3z", fill: "#E24329" },
    ],
  },

  kubernetes: {
    layers: [
      { kind: "path", d: regularPolygonPath(7, 12, 12, 10.2), fill: "#326CE5" },
      { kind: "circle", cx: 12, cy: 12, r: 4.5, stroke: "#FFFFFF", strokeWidth: 1.25 },
      { kind: "circle", cx: 12, cy: 12, r: 1.4, stroke: "#FFFFFF", strokeWidth: 1.1 },
      {
        kind: "path",
        d: Array.from({ length: 7 }, (_, i) => {
          const a = ((-90 + (360 / 7) * i) * Math.PI) / 180;
          const x1 = +(12 + 1.4 * Math.cos(a)).toFixed(2);
          const y1 = +(12 + 1.4 * Math.sin(a)).toFixed(2);
          const x2 = +(12 + 6.4 * Math.cos(a)).toFixed(2);
          const y2 = +(12 + 6.4 * Math.sin(a)).toFixed(2);
          return `M${x1} ${y1}L${x2} ${y2}`;
        }).join(""),
        stroke: "#FFFFFF",
        strokeWidth: 1.15,
        strokeLinecap: "round",
      },
    ],
  },

  linux: {
    container: { shape: "circle", fill: "#F1F5F9", stroke: "#CBD5E1" },
    layers: [
      { kind: "ellipse", cx: 12, cy: 13.0, rx: 4.8, ry: 5.5, fill: "#18181B" },
      { kind: "circle", cx: 12, cy: 7.8, r: 3.1, fill: "#18181B" },
      { kind: "ellipse", cx: 12, cy: 13.8, rx: 3.2, ry: 4.1, fill: "#FFFFFF" },
      { kind: "ellipse", cx: 10.9, cy: 7.4, rx: 0.75, ry: 0.95, fill: "#FFFFFF" },
      { kind: "ellipse", cx: 13.1, cy: 7.4, rx: 0.75, ry: 0.95, fill: "#FFFFFF" },
      { kind: "circle", cx: 11.0, cy: 7.5, r: 0.38, fill: "#18181B" },
      { kind: "circle", cx: 13.0, cy: 7.5, r: 0.38, fill: "#18181B" },
      { kind: "path", d: "M10.4 8.7l1.6-.6 1.6.6-1.6 1.3-1.6-1.3z", fill: "#F59E0B" },
      { kind: "ellipse", cx: 9.2, cy: 18.2, rx: 1.75, ry: 0.9, fill: "#F59E0B" },
      { kind: "ellipse", cx: 14.8, cy: 18.2, rx: 1.75, ry: 0.9, fill: "#F59E0B" },
    ],
  },

  redis: {
    container: whiteTile("rounded"),
    layers: [
      { kind: "path", d: "M12 14.0l-6.6 2.5L12 19.0l6.6-2.5L12 14.0z", fill: "#A41E11" },
      { kind: "path", d: "M12 11.6l-6.6 2.5L12 16.6l6.6-2.5L12 11.6z", fill: "#C92A1E" },
      { kind: "path", d: "M12 6.8L5.4 9.3 12 11.8l6.6-2.5L12 6.8z", fill: "#DC382D" },
      { kind: "path", d: starPolygonPath(5, 9.8, 9.2, 1.35, 0.55), fill: "#FFFFFF" },
      { kind: "circle", cx: 13.9, cy: 8.8, r: 1.0, fill: "#FFFFFF" },
      { kind: "rect", x: 11.4, y: 10.1, width: 1.4, height: 1.2, fill: "#FFFFFF" },
    ],
  },

  graphql: {
    container: whiteTile("rounded"),
    layers: [
      { kind: "path", d: regularPolygonPath(6, 12, 12, 7.6), stroke: "#E10098", strokeWidth: 1.15 },
      { kind: "path", d: regularPolygonPath(3, 12, 12, 7.6), stroke: "#E10098", strokeWidth: 1.1 },
      ...[0, 1, 2, 3, 4, 5].map((i): BrandPrimitive => {
        const a = ((-90 + 60 * i) * Math.PI) / 180;
        return {
          kind: "circle",
          cx: +(12 + 7.6 * Math.cos(a)).toFixed(2),
          cy: +(12 + 7.6 * Math.sin(a)).toFixed(2),
          r: 1.45,
          fill: "#E10098",
        };
      }),
    ],
  },

  figma: {
    container: darkTile("rounded", "#1E1E24"),
    layers: [
      { kind: "path", d: "M9.8 5.2h2.2v4.4H9.8a2.2 2.2 0 1 1 0-4.4z", fill: "#F24E1E" },
      { kind: "path", d: "M12 5.2h2.2a2.2 2.2 0 1 1 0 4.4H12V5.2z", fill: "#FF7262" },
      { kind: "path", d: "M9.8 9.6h2.2V14H9.8a2.2 2.2 0 1 1 0-4.4z", fill: "#A259FF" },
      { kind: "circle", cx: 14.2, cy: 11.8, r: 2.2, fill: "#1ABCFE" },
      { kind: "path", d: "M9.8 14H12v2.2a2.2 2.2 0 1 1-4.4 0A2.2 2.2 0 0 1 9.8 14z", fill: "#0ACF83" },
    ],
  },

  linear: {
    container: gradientTile("grad-linear", "#5E6AD2", "#4338CA", "diagonal-tl-br", undefined, "circle"),
    layers: [
      { kind: "path", d: "M5.5 14.3l4.2 4.2M5.2 12.0l6.8 6.8M6.3 10.1l7.6 7.6", stroke: "#FFFFFF", strokeWidth: 1.2, strokeLinecap: "round", clipToCircle: { cx: 12, cy: 12, r: 9.8 } },
      { kind: "path", d: "M8.6 6.1a6.6 6.6 0 0 1 9.3 9.3", stroke: "#FFFFFF", strokeWidth: 1.65, strokeLinecap: "round" },
    ],
  },

  aws: {
    container: darkTile("rounded", "#232F3E"),
    layers: [
      { kind: "text", text: "aws", x: 12, y: 10.0, fill: "#FFFFFF", fontSize: 7.4, fontWeight: 900 },
      { kind: "path", d: "M6.8 14.4c3.0 1.9 7.4 1.9 10.4 0", stroke: "#FF9900", strokeWidth: 1.45, strokeLinecap: "round" },
      { kind: "path", d: "M15.6 14.0l1.9.45-.45 1.85", stroke: "#FF9900", strokeWidth: 1.25, strokeLinecap: "round", strokeLinejoin: "round" },
    ],
  },

  vite: {
    container: whiteTile("rounded"),
    layers: [
      {
        kind: "path",
        d: "M18.8 5.8l-6.3 11.9c-.2.38-.75.38-.95 0L5.2 5.8c-.22-.4.12-.88.58-.8l6.22 1.15c.1.02.2.02.3 0L18.22 5.0c.46-.08.8.4.58.8z",
        fillGradient: { id: "grad-vite-bg", from: "#41D1FF", to: "#BD34FE", direction: "diagonal-tl-br" },
      },
      {
        kind: "path",
        d: "M14.7 4.4l-4.9 1.0-.45 5.4 2.25-.55-.7 3.5 4.4-5.45-2.3.55L14.7 4.4z",
        fillGradient: { id: "grad-vite-bolt", from: "#FFEA83", to: "#FFA800", direction: "vertical" },
      },
    ],
  },

  bun: {
    container: darkTile("rounded", "#181523"),
    layers: [
      {
        kind: "path",
        d: "M5.4 13.6c0-3.8 2.9-6.6 6.6-6.6s6.6 2.8 6.6 6.6c0 2.5-2.4 3.6-6.6 3.6s-6.6-1.1-6.6-3.6z",
        fill: "#FBF0DF",
        stroke: "#F59E0B",
        strokeWidth: 0.7,
      },
      { kind: "ellipse", cx: 12, cy: 8.6, rx: 3.1, ry: 0.9, fill: "#FDE68A" },
      { kind: "circle", cx: 9.6, cy: 12.2, r: 0.75, fill: "#18181B" },
      { kind: "circle", cx: 14.4, cy: 12.2, r: 0.75, fill: "#18181B" },
      { kind: "circle", cx: 8.0, cy: 13.5, r: 0.8, fill: "#FB7185", opacity: 0.85 },
      { kind: "circle", cx: 16.0, cy: 13.5, r: 0.8, fill: "#FB7185", opacity: 0.85 },
      { kind: "path", d: "M10.7 13.4c.4.6.9.6 1.3 0 .4.6.9.6 1.3 0", stroke: "#18181B", strokeWidth: 0.85, strokeLinecap: "round" },
    ],
  },

  astro: {
    container: darkTile("rounded", "#0D0E14"),
    layers: [
      {
        kind: "path",
        d: "M9.2 14.7l2.0-8.1c.15-.55.45-.85.8-.85s.65.3.8.85l2.0 8.1c-.95-.55-1.9-.8-2.8-.8s-1.85.25-2.8.8z",
        fill: "#FFFFFF",
      },
      { kind: "path", d: "M10.2 13.9c-.4 1.35.3 2.7 1.8 4.4 1.3-1.45 1.85-2.95 1.35-4.4-.9-.3-2.25-.3-3.15 0z", fillGradient: { id: "grad-astro", from: "#FF5D01", to: "#FFC837", direction: "vertical" } },
    ],
  },

  nestjs: {
    container: solidTile("#E0234E", "circle"),
    layers: [
      {
        kind: "path",
        d: "M7.2 8.2l2.6 1.6 2.2-2.4 2.2 2.4 2.6-1.6-.6 4.8-1.9 3.6-2.3 1.4-2.3-1.4-1.9-3.6-.6-4.8z",
        fill: "#FFFFFF",
      },
      { kind: "path", d: "M9.6 11.4l1.5.7-1.1.8zM14.4 11.4l-1.5.7 1.1.8z", fill: "#E0234E" },
      { kind: "path", d: "M10.4 14.6h3.2l-1.6 1.6-1.6-1.6z", fill: "#E0234E" },
    ],
  },

  fastapi: {
    container: solidTile("#009688", "circle"),
    layers: [
      { kind: "path", d: "M13.3 5.8L7.4 13.0h4.2l-.9 5.2L16.6 11h-4.2l.9-5.2z", fill: "#FFFFFF" },
    ],
  },

  django: {
    container: solidTile("#092E20"),
    layers: [
      {
        kind: "text",
        text: "dj",
        x: 12,
        y: 12.2,
        fill: "#FFFFFF",
        fontSize: 10.6,
        fontWeight: 900,
      },
    ],
  },

  laravel: {
    container: whiteTile("rounded"),
    layers: [
      {
        kind: "path",
        d: "M6.0 8.5l2.5-1.3 2.5 1.3v4.8l3.5-1.9 2.5 1.3v2.7l-6.0 3.3-5.0-2.8V8.5z",
        stroke: "#FF2D20",
        strokeWidth: 1.15,
        strokeLinejoin: "round",
      },
      { kind: "path", d: "M6.0 8.5l2.5 1.3 2.5-1.3M8.5 9.8v4.8l6.0-3.3M11.0 13.3l2.5 1.3v3.0M14.5 11.4l2.5 1.3-6.0 3.2-5.0-2.7", stroke: "#FF2D20", strokeWidth: 1.0, strokeLinejoin: "round" },
    ],
  },

  flutter: {
    container: whiteTile("rounded"),
    layers: [
      { kind: "path", d: "M13.5 5.2L6.6 12.1l2.1 2.1L17.7 5.2h-4.2z", fill: "#45D1FD" },
      { kind: "path", d: "M13.5 11.6L9.8 15.3l2.1 2.1 5.8-5.8h-4.2z", fill: "#45D1FD" },
      { kind: "path", d: "M11.9 17.4l1.6 1.6h4.2l-3.7-3.7-2.1 2.1z", fill: "#02569B" },
      { kind: "path", d: "M9.8 15.3l2.1 2.1 2.1-2.1-2.1-2.1-2.1 2.1z", fill: "#0175C2" },
    ],
  },

  postman: {
    container: solidTile("#FF6C37", "circle"),
    layers: [
      { kind: "path", d: "M6.3 17.3l3.6-5.2 2.5 2.5-6.1 2.7z", fill: "#FFFFFF", opacity: 0.9 },
      { kind: "circle", cx: 12.2, cy: 11.7, r: 3.1, fill: "#FFFFFF" },
      { kind: "ellipse", cx: 12.7, cy: 11.4, rx: 1.55, ry: 1.05, rotateDeg: -35, fill: "#FF6C37" },
      { kind: "path", d: "M13.9 10.1l2.9-2.9", stroke: "#FFFFFF", strokeWidth: 1.95, strokeLinecap: "round" },
      { kind: "circle", cx: 17.1, cy: 6.9, r: 0.95, fill: "#FFFFFF" },
    ],
  },

  clerk: {
    container: gradientTile("grad-clerk", "#6C47FF", "#4F46E5"),
    layers: [
      {
        kind: "path",
        d: "M16.2 7.8a5.9 5.9 0 1 0 0 8.4",
        stroke: "#FFFFFF",
        strokeWidth: 2.1,
        strokeLinecap: "round",
      },
      { kind: "circle", cx: 12.2, cy: 12, r: 1.9, fill: "#FFFFFF" },
      {
        kind: "path",
        d: "M14.3 9.9a3.0 3.0 0 0 0-4.2 4.2",
        stroke: "#C4B5FD",
        strokeWidth: 1.25,
        strokeLinecap: "round",
      },
    ],
  },

  neon_db: {
    container: darkTile("rounded", "#090E14"),
    layers: [
      {
        kind: "path",
        d: "M7.2 5.6h9.6c.9 0 1.6.7 1.6 1.6v9.4c0 .85-.98 1.3-1.6.75l-3.6-3.25v4.3c0 .45-.35.8-.8.8H7.2c-.9 0-1.6-.7-1.6-1.6V7.2c0-.9.7-1.6 1.6-1.6z",
        fill: "#00E599",
      },
      {
        kind: "path",
        d: "M8.3 8.2v7.8h2.5v-4.2l4.7 4.2V8.2H13.0v4.1L8.3 8.2z",
        fill: "#090E14",
      },
    ],
  },

  resend: {
    container: darkTile("rounded", "#09090B"),
    layers: [
      {
        kind: "path",
        d: "M7.6 17.6V6.4h4.9c2.15 0 3.55 1.25 3.55 3.15 0 1.6-1.05 2.75-2.75 3.05l3.15 5.0h-2.35l-2.85-4.75H9.65v4.75H7.6zm2.05-6.45h2.65c1.1 0 1.75-.6 1.75-1.6 0-1.0-.65-1.55-1.75-1.55H9.65v3.15z",
        fill: "#FFFFFF",
      },
    ],
  },

  // ── 81-114: MARKETING, AI, GMAIL, WIFI, CALLS ──────────────────────────────
  hubspot: {
    container: whiteTile("rounded"),
    layers: [
      { kind: "circle", cx: 11.4, cy: 13.0, r: 3.1, stroke: "#FF7A59", strokeWidth: 1.65 },
      { kind: "circle", cx: 11.4, cy: 13.0, r: 1.1, fill: "#FF7A59" },
      { kind: "path", d: "M13.6 10.8l2.5-2.5M14.5 13.0h2.8M11.4 9.9V7.2", stroke: "#FF7A59", strokeWidth: 1.3, strokeLinecap: "round" },
      { kind: "circle", cx: 11.4, cy: 6.3, r: 1.35, fill: "#FF7A59" },
      { kind: "circle", cx: 17.2, cy: 7.4, r: 1.45, fill: "#FF7A59" },
      { kind: "circle", cx: 17.6, cy: 13.0, r: 1.35, fill: "#FF7A59" },
    ],
  },

  mailchimp: {
    container: { shape: "circle", fill: "#FFE01B", stroke: "#EAB308" },
    layers: [
      { kind: "path", d: "M7.1 9.6c1.1-2.5 7.4-3.1 9.4-1.2l-1.5 1.8c-2.2-.8-5.1-.6-7.9-.6z", fill: "#241C15" },
      { kind: "path", d: "M7.2 9.4c3.0-.5 6.4-.4 9.5.4", stroke: "#241C15", strokeWidth: 1.2, strokeLinecap: "round" },
      { kind: "circle", cx: 9.7, cy: 12.2, r: 0.9, fill: "#241C15" },
      { kind: "path", d: "M13.2 12.2c.5-.6 1.4-.6 1.9 0", stroke: "#241C15", strokeWidth: 1.1, strokeLinecap: "round" },
      { kind: "path", d: "M9.3 14.9c1.6 1.3 4.0 1.2 5.4-.2", stroke: "#241C15", strokeWidth: 1.2, strokeLinecap: "round" },
    ],
  },

  meta_ads: {
    container: whiteTile("rounded"),
    layers: [
      {
        kind: "path",
        d: "M12 12C13.7 9.3 15.1 7.8 16.7 7.8C18.4 7.8 19.5 9.4 19.5 11.6C19.5 14.0 18.3 16.2 16.3 16.2C14.6 16.2 13.4 14.2 12 12C10.6 9.8 9.4 7.8 7.7 7.8C5.7 7.8 4.5 10.0 4.5 12.4C4.5 14.6 5.6 16.2 7.3 16.2C8.9 16.2 10.3 14.7 12 12Z",
        stroke: "#0081FB",
        strokeWidth: 2.05,
        strokeLinecap: "round",
        strokeLinejoin: "round",
      },
      {
        kind: "path",
        d: "M12 12C13.7 9.3 15.1 7.8 16.7 7.8C18.4 7.8 19.5 9.4 19.5 11.6C19.5 14.0 18.3 16.2 16.3 16.2",
        stroke: "#0064E0",
        strokeWidth: 2.05,
        strokeLinecap: "round",
      },
    ],
  },

  google_ads: {
    container: whiteTile("rounded"),
    layers: [
      {
        kind: "path",
        d: "M13.7 6.3L7.1 17.7",
        stroke: "#FBBC04",
        strokeWidth: 3.1,
        strokeLinecap: "round",
      },
      {
        kind: "path",
        d: "M10.3 6.3l6.6 11.4",
        stroke: "#4285F4",
        strokeWidth: 3.1,
        strokeLinecap: "round",
      },
      { kind: "circle", cx: 7.1, cy: 17.7, r: 1.9, fill: "#34A853" },
    ],
  },

  salesforce: {
    container: whiteTile("rounded"),
    layers: [
      {
        kind: "path",
        d: "M7.2 17.5a3.0 3.0 0 0 1-.4-5.97 3.75 3.75 0 0 1 6.75-2.05 3.3 3.3 0 0 1 4.55 2.45 2.8 2.8 0 0 1-.55 5.57H7.2z",
        fill: "#00A1E0",
      },
      {
        kind: "path",
        d: "M10.2 14.5c.8.55 2.8.55 3.6 0",
        stroke: "#FFFFFF",
        strokeWidth: 0.9,
        strokeLinecap: "round",
        opacity: 0.8,
      },
    ],
  },

  semrush: {
    container: solidTile("#FF642D", "circle"),
    layers: [
      { kind: "circle", cx: 14.2, cy: 12.0, r: 4.1, fill: "#FFFFFF" },
      {
        kind: "path",
        d: "M5.4 9.7h4.9M4.5 12.0h5.4M5.7 14.3h4.5",
        stroke: "#FFFFFF",
        strokeWidth: 1.3,
        strokeLinecap: "round",
      },
      { kind: "circle", cx: 14.9, cy: 11.2, r: 1.45, fill: "#FF642D" },
      { kind: "circle", cx: 15.4, cy: 10.8, r: 0.55, fill: "#FFFFFF" },
    ],
  },

  ahrefs: {
    container: solidTile("#1A5AE8"),
    layers: [
      {
        kind: "path",
        d: "M8.3 9.1c.75-.7 1.85-1.15 3.15-1.15 2.25 0 3.65 1.3 3.65 3.55v5.65h-2.1v-.95c-.62.78-1.55 1.18-2.65 1.18-1.78 0-2.95-1.08-2.95-2.62 0-1.62 1.32-2.62 3.55-2.62h2.05v-.68c0-.98-.68-1.6-1.85-1.6-.92 0-1.65.32-2.2.82L8.3 9.1zm4.65 4.85h-1.82c-1.12 0-1.75.42-1.75 1.12 0 .68.58 1.08 1.42 1.08 1.25 0 2.15-.7 2.15-1.72v-.48z",
        fill: "#FFFFFF",
      },
      { kind: "circle", cx: 16.7, cy: 7.4, r: 1.2, fill: "#FF8800" },
    ],
  },

  klaviyo: {
    container: darkTile("rounded", "#18181B"),
    layers: [
      { kind: "path", d: "M6.0 7.6h12.0l-3.3 4.4 3.3 4.4H6.0V7.6z", fill: "#FFFFFF" },
    ],
  },

  zapier: {
    container: solidTile("#FF4F00"),
    layers: [
      { kind: "path", d: "M12 5.4v13.2M5.4 12.0h13.2M7.3 7.3l9.4 9.4M16.7 7.3l-9.4 9.4", stroke: "#FFFFFF", strokeWidth: 2.05, strokeLinecap: "round" },
    ],
  },

  make: {
    container: gradientTile("grad-make", "#6D28D9", "#C026D3"),
    layers: [
      { kind: "path", d: "M5.3 16.8L8.0 7.2h2.3l-2.7 9.6H5.3z", fill: "#FFFFFF" },
      { kind: "path", d: "M10.4 16.8l2.7-9.6h2.3l-2.7 9.6h-2.3z", fill: "#FFFFFF", opacity: 0.88 },
      { kind: "rect", x: 15.6, y: 7.2, width: 2.3, height: 9.6, rx: 0.4, fill: "#FFFFFF", opacity: 0.72 },
    ],
  },

  webflow: {
    container: solidTile("#146EF5"),
    layers: [
      {
        kind: "path",
        d: "M18.6 8.2l-3.1 7.6h-2.6l1.3-3.6h-.05c-.95 2.0-2.1 3.2-3.45 3.6H8.3l-.9-4.1c-.45 1.35-1.15 2.75-2.0 4.1V8.2h2.4l.15 3.9h.05l1.6-3.9h2.2l.15 3.9h.05L14.2 8.2h4.4z",
        fill: "#FFFFFF",
      },
    ],
  },

  wordpress: {
    container: whiteTile("circle", "#21759B"),
    layers: [
      { kind: "circle", cx: 12, cy: 12, r: 8.6, stroke: "#21759B", strokeWidth: 1.4 },
      {
        kind: "path",
        d: "M5.3 12c0 2.5 1.35 4.7 3.4 5.9l-2.85-7.8A6.7 6.7 0 0 0 5.3 12zm11.2-.35c0-.85-.3-1.45-.55-1.9-.35-.55-.65-1.02-.65-1.58 0-.62.47-1.2 1.14-1.2h.1A6.7 6.7 0 0 0 6.5 8.15h.5c.8 0 2.05-.1 2.05-.1.42-.02.47.59.05.64 0 0-.42.05-.88.07l2.8 8.32 1.68-5.05-1.2-3.27c-.42-.02-.81-.07-.81-.07-.42-.02-.37-.66.05-.64 0 0 1.28.1 2.04.1.8 0 2.05-.1 2.05-.1.42-.02.47.59.05.64 0 0-.42.05-.88.07l2.77 8.25.77-2.57c.33-1.08.57-1.85.57-2.44zm-4.4 1.2l-2.3 6.68a6.73 6.73 0 0 0 4.18-.1l-1.88-6.58zm5.8-4.1c.04.3.06.64.06 1.0 0 .98-.18 2.08-.73 3.46l-2.55 7.36A6.72 6.72 0 0 0 17.9 8.75z",
        fill: "#21759B",
      },
    ],
  },

  google_analytics: {
    container: whiteTile("rounded"),
    layers: [
      { kind: "circle", cx: 6.8, cy: 17.0, r: 1.7, fill: "#F9AB00" },
      { kind: "rect", x: 10.3, y: 10.6, width: 3.4, height: 8.1, rx: 1.7, fill: "#F9AB00" },
      { kind: "rect", x: 15.5, y: 5.3, width: 3.4, height: 13.4, rx: 1.7, fill: "#E37400" },
    ],
  },

  gmail: {
    container: whiteTile("rounded"),
    layers: [
      { kind: "path", d: "M4.8 17.2h2.6v-6.1L4.2 8.7v7.5c0 .55.45 1.0 1.0 1.0h-.4z", fill: "#4285F4" },
      { kind: "path", d: "M16.6 17.2h2.6c.55 0 1.0-.45 1.0-1.0V8.7l-3.2 2.4v6.1h-.4z", fill: "#34A853" },
      { kind: "path", d: "M16.6 7.1v4.0l3.2-2.4V7.5c0-1.15-1.32-1.82-2.25-1.12L16.6 7.1z", fill: "#FBBC04" },
      { kind: "path", d: "M7.4 11.1V7.1l4.6 3.45 4.6-3.45v4.0L12 14.55 7.4 11.1z", fill: "#EA4335" },
      { kind: "path", d: "M4.2 7.5v1.2l3.2 2.4V7.1l-.95-.72C5.52 5.68 4.2 6.35 4.2 7.5z", fill: "#C5221F" },
    ],
  },

  wifi_classic: {
    container: gradientTile("grad-wifi", "#3B82F6", "#1D4ED8"),
    layers: [
      { kind: "path", d: "M5.8 10.2a8.8 8.8 0 0 1 12.4 0", stroke: "#FFFFFF", strokeWidth: 1.7, strokeLinecap: "round" },
      { kind: "path", d: "M8.3 12.9a5.2 5.2 0 0 1 7.4 0", stroke: "#FFFFFF", strokeWidth: 1.7, strokeLinecap: "round" },
      { kind: "circle", cx: 12, cy: 16.2, r: 1.25, fill: "#FFFFFF" },
    ],
  },

  wifi_free: {
    container: gradientTile("grad-wififree", "#10B981", "#059669"),
    layers: [
      { kind: "path", d: "M6.8 8.2a7.4 7.4 0 0 1 10.4 0", stroke: "#FFFFFF", strokeWidth: 1.5, strokeLinecap: "round" },
      { kind: "path", d: "M9.0 10.5a4.2 4.2 0 0 1 6.0 0", stroke: "#FFFFFF", strokeWidth: 1.5, strokeLinecap: "round" },
      { kind: "circle", cx: 12, cy: 13.0, r: 1.0, fill: "#FFFFFF" },
      { kind: "rect", x: 5.0, y: 15.2, width: 14.0, height: 4.5, rx: 1.6, fill: "#FFFFFF" },
      { kind: "text", text: "FREE", x: 12, y: 17.55, fill: "#059669", fontSize: 3.9, fontWeight: 900 },
    ],
  },

  wifi_secure: {
    container: gradientTile("grad-wifisecure", "#0D9488", "#0F766E"),
    layers: [
      { kind: "path", d: "M5.4 9.7a8.4 8.4 0 0 1 11.4-.4", stroke: "#FFFFFF", strokeWidth: 1.55, strokeLinecap: "round" },
      { kind: "path", d: "M7.6 12.2a5.0 5.0 0 0 1 6.8-.2", stroke: "#FFFFFF", strokeWidth: 1.55, strokeLinecap: "round" },
      { kind: "circle", cx: 10.8, cy: 14.9, r: 1.1, fill: "#FFFFFF" },
      { kind: "rect", x: 13.4, y: 13.5, width: 5.8, height: 4.8, rx: 1.1, fill: "#FBBF24" },
      { kind: "path", d: "M14.7 13.5v-1.2a1.6 1.6 0 0 1 3.2 0v1.2", stroke: "#FBBF24", strokeWidth: 1.25, strokeLinecap: "round" },
      { kind: "circle", cx: 16.3, cy: 15.9, r: 0.7, fill: "#0F766E" },
    ],
  },

  wifi_5g: {
    container: gradientTile("grad-wifi5g", "#7C3AED", "#4338CA"),
    layers: [
      { kind: "path", d: "M6.8 8.0a7.4 7.4 0 0 1 10.4 0", stroke: "#FFFFFF", strokeWidth: 1.5, strokeLinecap: "round" },
      { kind: "path", d: "M9.0 10.3a4.2 4.2 0 0 1 6.0 0", stroke: "#FFFFFF", strokeWidth: 1.5, strokeLinecap: "round" },
      { kind: "circle", cx: 12, cy: 12.8, r: 1.0, fill: "#FFFFFF" },
      { kind: "rect", x: 5.8, y: 15.1, width: 12.4, height: 4.6, rx: 1.6, fill: "#FFFFFF" },
      { kind: "text", text: "5G", x: 12, y: 17.5, fill: "#4338CA", fontSize: 4.4, fontWeight: 900 },
    ],
  },

  phone_call: {
    container: gradientTile("grad-phone", "#22C55E", "#15803D"),
    layers: [
      {
        kind: "path",
        d: "M16.9 14.3l-2.0-.9a1.2 1.2 0 0 0-1.3.3l-.9 1.0a7.8 7.8 0 0 1-3.4-3.4l1.0-.9a1.2 1.2 0 0 0 .3-1.3l-.9-2.0a1.2 1.2 0 0 0-1.4-.6l-1.5.4a1.2 1.2 0 0 0-.9 1.2c.1 5.4 4.5 9.8 9.9 9.9a1.2 1.2 0 0 0 1.2-.9l.4-1.5a1.2 1.2 0 0 0-.5-1.4z",
        fill: "#FFFFFF",
      },
    ],
  },

  phone_support: {
    container: gradientTile("grad-support", "#0284C7", "#0369A1"),
    layers: [
      { kind: "path", d: "M6.5 13.0V11.5a5.5 5.5 0 0 1 11.0 0v1.5", stroke: "#FFFFFF", strokeWidth: 1.5, strokeLinecap: "round" },
      { kind: "rect", x: 5.3, y: 11.7, width: 2.3, height: 4.1, rx: 1.0, fill: "#FFFFFF" },
      { kind: "rect", x: 16.4, y: 11.7, width: 2.3, height: 4.1, rx: 1.0, fill: "#FFFFFF" },
      { kind: "path", d: "M17.5 15.8c0 1.5-1.5 2.4-4.2 2.4", stroke: "#FFFFFF", strokeWidth: 1.25, strokeLinecap: "round" },
    ],
  },

  phone_sos: {
    container: gradientTile("grad-sos", "#EF4444", "#B91C1C"),
    layers: [
      {
        kind: "path",
        d: "M15.4 10.6l-1.3-.55a.8.8 0 0 0-.85.2l-.6.65a5.2 5.2 0 0 1-2.25-2.25l.65-.6a.8.8 0 0 0 .2-.85l-.55-1.3a.8.8 0 0 0-.9-.4l-1.0.25a.8.8 0 0 0-.6.8c.05 3.6 2.95 6.5 6.55 6.55a.8.8 0 0 0 .8-.6l.25-1.0a.8.8 0 0 0-.35-.9z",
        fill: "#FFFFFF",
      },
      { kind: "rect", x: 5.2, y: 15.0, width: 13.6, height: 4.7, rx: 1.6, fill: "#FFFFFF" },
      { kind: "text", text: "SOS", x: 12, y: 17.45, fill: "#B91C1C", fontSize: 4.2, fontWeight: 900 },
    ],
  },

  whatsapp_call: {
    container: solidTile("#25D366", "circle"),
    layers: [
      {
        kind: "path",
        d: "M16.1 14.3l-1.8-.8a1.1 1.1 0 0 0-1.2.3l-.8.9a7.1 7.1 0 0 1-3.1-3.1l.9-.8a1.1 1.1 0 0 0 .3-1.2l-.8-1.8a1.1 1.1 0 0 0-1.3-.6l-1.4.35a1.1 1.1 0 0 0-.8 1.1c.1 4.9 4.1 8.9 9.0 9.0a1.1 1.1 0 0 0 1.1-.8l.35-1.4a1.1 1.1 0 0 0-.45-1.15z",
        fill: "#FFFFFF",
      },
      { kind: "path", d: "M13.5 7.4a3.2 3.2 0 0 1 3.1 3.1", stroke: "#FFFFFF", strokeWidth: 1.25, strokeLinecap: "round" },
      { kind: "path", d: "M13.8 5.2a5.2 5.2 0 0 1 5.0 5.0", stroke: "#FFFFFF", strokeWidth: 1.25, strokeLinecap: "round" },
    ],
  },
};
