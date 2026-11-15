import { BRAND_LOGOS, type OfficialBrandLogoSpec } from "./qr-brand-logos";

// =============================================================================
// LShorter QR Studio — High-Precision Canvas2D Renderer for Official Brand Logos
// Sourced strictly from Simple Icons, SVG Logos (@iconify-json/logos) & Devicon
// =============================================================================

const svgImageCache = new Map<string, HTMLImageElement>();
let isPrewarmed = false;

export function prewarmLogoImages() {
  if (isPrewarmed || typeof window === "undefined") return;
  isPrewarmed = true;
  for (const [id, spec] of Object.entries(BRAND_LOGOS)) {
    if (!spec.pathOnly) {
      const parts = spec.viewBox.split(" ").map(Number);
      const w = parts[2] || 256;
      const h = parts[3] || 256;
      const modes: Array<"light" | "dark"> = spec.body.includes('fill="currentColor"')
        ? ["light", "dark"]
        : ["light"];
      for (const mode of modes) {
        let svgBody = spec.body;
        if (svgBody.includes('fill="currentColor"')) {
          const fillColor =
            mode === "dark" && spec.isDarkBadge
              ? "#ffffff"
              : spec.brandColor || "#000000";
          svgBody = svgBody.replace(/fill="currentColor"/g, `fill="${fillColor}"`);
        }
        const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${spec.viewBox}" width="${w}" height="${h}">${svgBody}</svg>`;
        const img = new window.Image();
        img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgFull)}`;
        svgImageCache.set(`${id}_${mode}`, img);
      }
    }
  }
}

function createPath2D(d: string): Path2D | null {
  if (typeof Path2D !== "undefined") {
    return new Path2D(d);
  }
  return null;
}

function isDarkHexColor(hex: string): boolean {
  const clean = hex.trim().replace(/^#/, "");
  if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16) / 255;
    const g = parseInt(clean[1] + clean[1], 16) / 255;
    const b = parseInt(clean[2] + clean[2], 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.25;
  }
  if (clean.length >= 6) {
    const r = parseInt(clean.slice(0, 2), 16) / 255;
    const g = parseInt(clean.slice(2, 4), 16) / 255;
    const b = parseInt(clean.slice(4, 6), 16) / 255;
    return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.25;
  }
  return false;
}

export function drawBrandLogoSpec(
  ctx: CanvasRenderingContext2D,
  centerBoxX: number,
  centerBoxY: number,
  centerBoxSize: number,
  spec: OfficialBrandLogoSpec,
  resolvedBgColor: string,
  onRedrawNeeded?: () => void
) {
  const isDarkBg = isDarkHexColor(resolvedBgColor);
  const iconPadding = centerBoxSize * 0.16;
  const renderSize = centerBoxSize - iconPadding * 2;
  const targetX = centerBoxX + iconPadding;
  const targetY = centerBoxY + iconPadding;

  // 1. Direct synchronous Path2D rendering for Simple Icons (instant 60 FPS, zero latency, Node/Jest safe)
  if (spec.pathOnly) {
    ctx.save();
    ctx.translate(targetX, targetY);
    ctx.scale(renderSize / 24, renderSize / 24);
    if (isDarkBg && (spec.brandColor === "#000000" || spec.brandColor === "#181717" || spec.isDarkBadge)) {
      ctx.fillStyle = "#ffffff";
    } else if (!isDarkBg && spec.isDarkBadge && (spec.brandColor === "#000000" || spec.brandColor === "#181717")) {
      ctx.fillStyle = "#000000";
    } else {
      ctx.fillStyle = spec.brandColor || "#000000";
    }
    const p = createPath2D(spec.pathOnly);
    if (p) {
      ctx.fill(p);
    }
    ctx.restore();
    return;
  }

  // 2. High-DPI cached SVG image rendering for authentic multi-color library logos
  const ImageCtor =
    typeof window !== "undefined"
      ? window.Image
      : typeof Image !== "undefined"
        ? Image
        : null;

  if (ImageCtor) {
    const cacheKey = spec.body.includes('fill="currentColor"')
      ? `${spec.id}_${isDarkBg ? "dark" : "light"}`
      : `${spec.id}_light`;
    let img = svgImageCache.get(cacheKey);
    if (!img) {
      img = new ImageCtor();
      let svgBody = spec.body;
      if (svgBody.includes('fill="currentColor"')) {
        const fillColor =
          isDarkBg && spec.isDarkBadge
            ? "#ffffff"
            : spec.brandColor || "#000000";
        svgBody = svgBody.replace(/fill="currentColor"/g, `fill="${fillColor}"`);
      }
      const parts = spec.viewBox.split(" ").map(Number);
      const w = parts[2] || 256;
      const h = parts[3] || 256;
      const svgFull = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${spec.viewBox}" width="${w}" height="${h}">${svgBody}</svg>`;
      img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgFull)}`;
      svgImageCache.set(cacheKey, img);
    }

    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, targetX, targetY, renderSize, renderSize);
    } else {
      img.onload = () => {
        if (onRedrawNeeded) {
          onRedrawNeeded();
        }
      };
      img.onerror = () => {
        svgImageCache.delete(cacheKey);
      };
    }
  }
}
