import type {
  BrandGradientSpec,
  BrandLogoSpec,
  BrandPrimitive,
} from "./qr-brand-logos";

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

function resolveCanvasPaint(
  ctx: CanvasRenderingContext2D,
  fill?: string,
  gradSpec?: BrandGradientSpec
): string | CanvasGradient | null {
  if (gradSpec) {
    let x1 = gradSpec.x1 ?? 0;
    let y1 = gradSpec.y1 ?? 0;
    let x2 = gradSpec.x2 ?? 24;
    let y2 = gradSpec.y2 ?? 24;
    if (
      gradSpec.x1 === undefined ||
      gradSpec.y1 === undefined ||
      gradSpec.x2 === undefined ||
      gradSpec.y2 === undefined
    ) {
      if (gradSpec.direction === "diagonal-bl-tr") {
        x1 = 0;
        y1 = 24;
        x2 = 24;
        y2 = 0;
      } else if (gradSpec.direction === "vertical") {
        x1 = 0;
        y1 = 0;
        x2 = 0;
        y2 = 24;
      } else if (gradSpec.direction === "horizontal") {
        x1 = 0;
        y1 = 0;
        x2 = 24;
        y2 = 0;
      }
    }
    const grad = ctx.createLinearGradient(x1, y1, x2, y2);
    grad.addColorStop(0, gradSpec.from);
    if (gradSpec.via) {
      grad.addColorStop(0.5, gradSpec.via);
    }
    grad.addColorStop(1, gradSpec.to);
    return grad;
  }
  if (fill && fill !== "none") {
    return fill;
  }
  return null;
}

function getFontFamilyStack(family?: "sans" | "serif" | "mono"): string {
  switch (family) {
    case "serif":
      return "Georgia, 'Times New Roman', serif";
    case "mono":
      return "'JetBrains Mono', ui-monospace, SFMono-Regular, monospace";
    case "sans":
    default:
      return "Inter, system-ui, -apple-system, sans-serif";
  }
}

function traceIsotropicEllipse(
  ctx: CanvasRenderingContext2D,
  rx: number,
  ry: number
) {
  const k = 0.5522847498;
  ctx.beginPath();
  ctx.moveTo(0, -ry);
  ctx.bezierCurveTo(rx * k, -ry, rx, -ry * k, rx, 0);
  ctx.bezierCurveTo(rx, ry * k, rx * k, ry, 0, ry);
  ctx.bezierCurveTo(-rx * k, ry, -rx, ry * k, -rx, 0);
  ctx.bezierCurveTo(-rx, -ry * k, -rx * k, -ry, 0, -ry);
  ctx.closePath();
}

function renderCanvasPrimitive(
  ctx: CanvasRenderingContext2D,
  layer: BrandPrimitive
) {
  ctx.save();

  if ("clipToCircle" in layer && layer.clipToCircle) {
    ctx.beginPath();
    ctx.arc(
      layer.clipToCircle.cx,
      layer.clipToCircle.cy,
      layer.clipToCircle.r,
      0,
      Math.PI * 2
    );
    ctx.clip();
  }

  if ("opacity" in layer && layer.opacity !== undefined) {
    ctx.globalAlpha = layer.opacity;
  }

  if (layer.kind === "path") {
    const pathObj = createPath2D(layer.d);
    if (!pathObj) {
      ctx.restore();
      return;
    }

    if (layer.transform) {
      const t = layer.transform;
      if (t.translateX || t.translateY) {
        ctx.translate(t.translateX ?? 0, t.translateY ?? 0);
      }
      if (t.rotateDeg) {
        const px = t.pivotX ?? 12;
        const py = t.pivotY ?? 12;
        ctx.translate(px, py);
        ctx.rotate((t.rotateDeg * Math.PI) / 180);
        ctx.translate(-px, -py);
      }
      if (
        t.scale !== undefined ||
        t.scaleX !== undefined ||
        t.scaleY !== undefined
      ) {
        ctx.scale(t.scaleX ?? t.scale ?? 1, t.scaleY ?? t.scale ?? 1);
      }
    }

    const paint = resolveCanvasPaint(ctx, layer.fill, layer.fillGradient);
    if (paint) {
      ctx.fillStyle = paint;
      ctx.fill(pathObj, layer.fillRule ?? "nonzero");
    }

    if (layer.stroke) {
      ctx.strokeStyle = layer.stroke;
      ctx.lineWidth = layer.strokeWidth ?? 1;
      ctx.lineCap = layer.strokeLinecap ?? "butt";
      ctx.lineJoin = layer.strokeLinejoin ?? "miter";
      ctx.stroke(pathObj);
    }

    ctx.restore();
    return;
  }

  if (layer.kind === "circle") {
    ctx.beginPath();
    ctx.arc(layer.cx, layer.cy, layer.r, 0, Math.PI * 2);
    const paint = resolveCanvasPaint(ctx, layer.fill, layer.fillGradient);
    if (paint) {
      ctx.fillStyle = paint;
      ctx.fill();
    }
    if (layer.stroke) {
      ctx.strokeStyle = layer.stroke;
      ctx.lineWidth = layer.strokeWidth ?? 1;
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (layer.kind === "ellipse") {
    ctx.translate(layer.cx, layer.cy);
    if (layer.rotateDeg) {
      ctx.rotate((layer.rotateDeg * Math.PI) / 180);
    }
    traceIsotropicEllipse(ctx, layer.rx, layer.ry);
    if (layer.fill && layer.fill !== "none") {
      ctx.fillStyle = layer.fill;
      ctx.fill();
    }
    if (layer.stroke) {
      ctx.strokeStyle = layer.stroke;
      ctx.lineWidth = layer.strokeWidth ?? 1;
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (layer.kind === "rect") {
    if (layer.rotateDeg) {
      const px = layer.pivotX ?? layer.x + layer.width / 2;
      const py = layer.pivotY ?? layer.y + layer.height / 2;
      ctx.translate(px, py);
      ctx.rotate((layer.rotateDeg * Math.PI) / 180);
      ctx.translate(-px, -py);
    }
    ctx.beginPath();
    ctx.roundRect(layer.x, layer.y, layer.width, layer.height, layer.rx ?? 0);
    const paint = resolveCanvasPaint(ctx, layer.fill, layer.fillGradient);
    if (paint) {
      ctx.fillStyle = paint;
      ctx.fill();
    }
    if (layer.stroke) {
      ctx.strokeStyle = layer.stroke;
      ctx.lineWidth = layer.strokeWidth ?? 1;
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (layer.kind === "text") {
    ctx.translate(layer.x, layer.y);
    if (layer.rotateDeg) {
      const dx = (layer.pivotX ?? layer.x) - layer.x;
      const dy = (layer.pivotY ?? layer.y) - layer.y;
      ctx.translate(dx, dy);
      ctx.rotate((layer.rotateDeg * Math.PI) / 180);
      ctx.translate(-dx, -dy);
    }
    // Scale 10x before drawing so browsers skip minimum-font-size clamping on small 24x24 coordinates
    ctx.scale(0.1, 0.1);
    ctx.fillStyle = layer.fill;
    ctx.font = `${layer.fontStyle ?? "normal"} ${layer.fontWeight ?? 800} ${layer.fontSize * 10}px ${getFontFamilyStack(layer.fontFamily)}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(layer.text, 0, 0);
    ctx.restore();
  }
}

/**
 * Draws a normalized 24x24 BrandLogoSpec centered inside the QR center badge box.
 */
export function drawBrandLogoSpec(
  ctx: CanvasRenderingContext2D,
  centerBoxX: number,
  centerBoxY: number,
  centerBoxSize: number,
  spec: BrandLogoSpec,
  resolvedBgColor: string
) {
  const pad = centerBoxSize * 0.08;
  const renderSize = centerBoxSize - pad * 2;
  const isDarkBg = isDarkHexColor(resolvedBgColor);

  ctx.save();
  ctx.translate(centerBoxX + pad, centerBoxY + pad);
  ctx.scale(renderSize / 24, renderSize / 24);

  if (spec.container) {
    ctx.beginPath();
    if (spec.container.shape === "circle") {
      ctx.arc(12, 12, 10.4, 0, Math.PI * 2);
    } else {
      ctx.roundRect(1.6, 1.6, 20.8, 20.8, 5.2);
    }

    const paint = resolveCanvasPaint(
      ctx,
      spec.container.fill,
      spec.container.gradient
    );
    if (paint) {
      ctx.fillStyle = paint;
      ctx.fill();
    }

    const strokeColor =
      spec.container.stroke ??
      (spec.container.darkRim && isDarkBg ? "rgba(255,255,255,0.28)" : undefined);
    if (strokeColor) {
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 0.65;
      ctx.stroke();
    }
  }

  for (const layer of spec.layers) {
    renderCanvasPrimitive(ctx, layer);
  }

  ctx.restore();
}
