import {
  formatFrameText,
  getCanvasFont,
  type FontFamilyType,
  type FontWeightType,
  type FrameType,
  type TextTransformType,
} from "./qr-render-engine";
import { getAnimatedTheme, type AnimatedThemeConfig } from "./qr-animated-themes";
import {
  getRelativeLuminance,
  hexWithAlpha,
  mixHex,
  renderShaderBackdrop,
  resolveThemePalette,
  type ResolvedPalette,
} from "./qr-webgl-shaders";

export const ANIMATED_LOOP_DURATION_SEC = 2.4;

export interface FramePaddings {
  top: number;
  bottom: number;
  side: number;
}

export interface AnimatedFrameRenderOptions {
  paddings?: FramePaddings;
  qrDrawSize?: number;
  bgMode?: "monochrome" | "transparent" | "gradient";
  bgColor?: string;
  bgColor2?: string;
  pixelColor?: string;
  tintWithFrameColor?: boolean;
}

export function loopNorm(timeSec: number, duration: number = ANIMATED_LOOP_DURATION_SEC): number {
  const mod = ((timeSec % duration) + duration) % duration;
  return mod / duration;
}

export function loopSin(
  timeSec: number,
  duration: number = ANIMATED_LOOP_DURATION_SEC,
  phaseOffset: number = 0
): number {
  return Math.sin(loopNorm(timeSec, duration) * Math.PI * 2 + phaseOffset);
}

export function loopCos(
  timeSec: number,
  duration: number = ANIMATED_LOOP_DURATION_SEC,
  phaseOffset: number = 0
): number {
  return Math.cos(loopNorm(timeSec, duration) * Math.PI * 2 + phaseOffset);
}

/**
 * Returns generous stage paddings for animated shader frames so the top telemetry bar,
 * floating glass QR card, and bottom CTA pill never collide or clip.
 */
export function getAnimatedFramePaddings(quietZone: boolean): FramePaddings {
  const basePad = quietZone ? 28 : 16;
  return {
    top: basePad + 22,
    bottom: 84,
    side: basePad + 16,
  };
}

function drawPolygonChamfer(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  cut: number
): void {
  const c = Math.min(cut, w * 0.25, h * 0.45);
  ctx.beginPath();
  ctx.moveTo(x + c, y);
  ctx.lineTo(x + w - c, y);
  ctx.lineTo(x + w, y + c);
  ctx.lineTo(x + w, y + h - c);
  ctx.lineTo(x + w - c, y + h);
  ctx.lineTo(x + c, y + h);
  ctx.lineTo(x, y + h - c);
  ctx.lineTo(x, y + c);
  ctx.closePath();
}

function drawVectorSparkle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  rotationRad: number = 0
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationRad);
  ctx.fillStyle = color;
  ctx.beginPath();
  const inner = radius * 0.28;
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? radius : inner;
    const ang = (i * Math.PI) / 4;
    const px = Math.cos(ang) * r;
    const py = Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawVectorSnowflake(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  rotationRad: number
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(rotationRad);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.4;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI) / 3;
    const dx = Math.cos(a) * radius;
    const dy = Math.sin(a) * radius;
    ctx.beginPath();
    ctx.moveTo(-dx, -dy);
    ctx.lineTo(dx, dy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawVectorHeart(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  color: string
): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, size * 0.35);
  ctx.bezierCurveTo(-size, -size * 0.35, -size * 0.55, -size, 0, -size * 0.42);
  ctx.bezierCurveTo(size * 0.55, -size, size, -size * 0.35, 0, size * 0.35);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawCornerBrackets(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  len: number,
  color: string,
  lineWidth: number = 2
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = "square";

  const corners: Array<[number, number, number, number]> = [
    [x, y, 1, 1],
    [x + w, y, -1, 1],
    [x, y + h, 1, -1],
    [x + w, y + h, -1, -1],
  ];

  for (const [cx, cy, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(cx, cy + sy * len);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + sx * len, cy);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTopStageHeader(
  ctx: CanvasRenderingContext2D,
  totalWidth: number,
  cardX: number,
  cardY: number,
  cardW: number,
  theme: AnimatedThemeConfig,
  palette: ResolvedPalette,
  phase: number
): void {
  if (cardY < 18) return;

  const centerY = cardY * 0.52;
  const centerX = totalWidth / 2;
  const pulse = 0.5 + 0.5 * Math.sin(phase * 2);

  if (theme.motif === "terminal_code") {
    const dotsX = Math.max(18, cardX + 6);
    const dotColors = ["#ef4444", "#f59e0b", "#22c55e"];
    dotColors.forEach((dotCol, idx) => {
      ctx.fillStyle = hexWithAlpha(dotCol, 0.9);
      ctx.beginPath();
      ctx.arc(dotsX + idx * 10, centerY, 2.7, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (theme.motif === "f1_racing") {
    // Crisp checkered sprint marker flanking top tag
    const sqSize = 3.5;
    const leftX = Math.max(16, cardX + 4);
    const rightX = Math.min(totalWidth - 16 - sqSize * 4, cardX + cardW - sqSize * 4 - 4);
    for (const bx of [leftX, rightX]) {
      for (let col = 0; col < 4; col++) {
        for (let row = 0; row < 2; row++) {
          ctx.fillStyle = (col + row) % 2 === 0 ? "#ffffff" : hexWithAlpha(palette.primary, 0.9);
          ctx.fillRect(bx + col * sqSize, centerY - sqSize + row * sqSize, sqSize, sqSize);
        }
      }
    }
  }

  ctx.save();
  ctx.font =
    theme.badgeStyle === "terminal_prompt" || theme.category === "cyber_tech"
      ? '600 9.5px "JetBrains Mono", "Fira Code", monospace'
      : '700 9.5px "Inter", system-ui, sans-serif';
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";

  const labelText = theme.topTag;
  const labelW = ctx.measureText(labelText).width;
  const chipPadX = 10;
  const chipW = Math.min(cardW - 24, labelW + chipPadX * 2 + 12);
  const chipH = 18;
  const chipX = centerX - chipW / 2;
  const chipY = centerY - chipH / 2;

  ctx.fillStyle = hexWithAlpha(palette.baseBg, 0.55);
  ctx.beginPath();
  ctx.roundRect(chipX, chipY, chipW, chipH, 9);
  ctx.fill();

  ctx.strokeStyle = hexWithAlpha(palette.primary, 0.4 + 0.3 * pulse);
  ctx.lineWidth = 1;
  ctx.stroke();

  // Left indicator dot or vector glyph
  const dotX = chipX + 10;
  if (theme.category === "luxury_minimal") {
    drawVectorSparkle(ctx, dotX, centerY, 4, palette.accent, phase * 0.5);
  } else {
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(dotX, centerY, 2.3 + 0.7 * pulse, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = hexWithAlpha("#f8fafc", 0.92);
  ctx.fillText(labelText, centerX + 5, centerY + 0.5, chipW - 18);
  ctx.restore();
}

function drawPerimeterMotifs(
  ctx: CanvasRenderingContext2D,
  totalWidth: number,
  totalHeight: number,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  theme: AnimatedThemeConfig,
  palette: ResolvedPalette,
  norm: number,
  phase: number
): void {
  const marginLeft = cardX;
  const marginRight = totalWidth - (cardX + cardW);
  const bottomTop = cardY + cardH;

  // 1. Cyber & Tech reticle/trace accents
  if (theme.category === "cyber_tech") {
    drawCornerBrackets(
      ctx,
      cardX - 6,
      cardY - 6,
      cardW + 12,
      cardH + 12,
      14,
      hexWithAlpha(palette.primary, 0.88),
      2
    );

    // Traveling luminous tracer along card perimeter
    const perimeter = 2 * (cardW + 12 + cardH + 12);
    const segLen = 54;
    const dist = norm * perimeter;
    const topEnd = cardW + 12;
    const rightEnd = topEnd + cardH + 12;
    const bottomEnd = rightEnd + cardW + 12;

    const pointOnPerimeter = (d: number): [number, number] => {
      const m = ((d % perimeter) + perimeter) % perimeter;
      const sx = cardX - 6;
      const sy = cardY - 6;
      const sw = cardW + 12;
      const sh = cardH + 12;
      if (m < topEnd) return [sx + m, sy];
      if (m < rightEnd) return [sx + sw, sy + (m - topEnd)];
      if (m < bottomEnd) return [sx + sw - (m - rightEnd), sy + sh];
      return [sx, sy + sh - (m - bottomEnd)];
    };

    ctx.save();
    const grad = ctx.createLinearGradient(
      ...pointOnPerimeter(dist - segLen),
      ...pointOnPerimeter(dist)
    );
    grad.addColorStop(0, hexWithAlpha(palette.secondary, 0));
    grad.addColorStop(0.5, hexWithAlpha(palette.primary, 0.7));
    grad.addColorStop(1, hexWithAlpha(palette.accent, 0.98));
    ctx.strokeStyle = grad;
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.beginPath();
    const steps = 10;
    for (let s = 0; s <= steps; s++) {
      const [px, py] = pointOnPerimeter(dist - segLen + (segLen * s) / steps);
      if (s === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const [headX, headY] = pointOnPerimeter(dist);
    ctx.fillStyle = palette.accent;
    ctx.beginPath();
    ctx.arc(headX, headY, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Motif-specific geometric micro accents strictly inside stage margins
  switch (theme.motif) {
    case "music": {
      // Crisp symmetric studio equalizer bars along left & right outer borders
      const barCount = 10;
      const barSpan = cardH * 0.72;
      const startBarY = cardY + (cardH - barSpan) / 2;
      const stepY = barSpan / barCount;
      for (let i = 0; i < barCount; i++) {
        const amp = 0.28 + 0.72 * (0.5 + 0.5 * Math.sin(phase * 2 + i * 0.7));
        const len = Math.max(4, Math.min(marginLeft - 10, 14) * amp);
        const by = startBarY + i * stepY;
        ctx.fillStyle = hexWithAlpha(i % 2 === 0 ? palette.primary : palette.secondary, 0.85);
        ctx.beginPath();
        ctx.roundRect(cardX - 7 - len, by, len, 3.2, 1.6);
        ctx.roundRect(cardX + cardW + 7, by, len, 3.2, 1.6);
        ctx.fill();
      }
      break;
    }

    case "dna_biotech": {
      // Clean twin sinusoid strands running along vertical margins
      const strandPts = 18;
      for (const side of [-1, 1]) {
        const baseX = side < 0 ? Math.max(10, marginLeft * 0.45) : totalWidth - Math.max(10, marginRight * 0.45);
        for (let i = 0; i < strandPts; i++) {
          const t = i / (strandPts - 1);
          const py = cardY + 14 + t * (cardH - 28);
          const offset = Math.sin(t * Math.PI * 4 + phase) * Math.min(7, marginLeft * 0.25);
          ctx.fillStyle = hexWithAlpha(palette.accent, 0.75);
          ctx.beginPath();
          ctx.arc(baseX + offset, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = hexWithAlpha(palette.primary, 0.75);
          ctx.beginPath();
          ctx.arc(baseX - offset, py, 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      break;
    }

    case "f1_racing":
    case "sport":
    case "boxing": {
      // Precision diagonal track speed ticks flanking bottom stage corners
      ctx.save();
      ctx.lineWidth = 2.4;
      ctx.lineCap = "round";
      for (let i = 0; i < 4; i++) {
        const shift = ((norm * 2 + i * 0.25) % 1) * 14;
        const alpha = 0.25 + 0.65 * Math.sin(((norm * 2 + i * 0.25) % 1) * Math.PI);
        ctx.strokeStyle = hexWithAlpha(i % 2 === 0 ? palette.primary : palette.accent, alpha);
        const yPos = bottomTop + 14 + shift;
        ctx.beginPath();
        ctx.moveTo(14 + i * 9, yPos);
        ctx.lineTo(22 + i * 9, yPos - 8);
        ctx.moveTo(totalWidth - 14 - i * 9, yPos);
        ctx.lineTo(totalWidth - 22 - i * 9, yPos - 8);
        ctx.stroke();
      }
      ctx.restore();
      break;
    }

    case "christmas":
    case "snow": {
      // Delicate rotating geometric snowflakes placed cleanly in margin corners
      const spots: Array<[number, number, number]> = [
        [Math.max(16, cardX * 0.48), Math.max(18, cardY * 0.55), 6.5],
        [totalWidth - Math.max(16, marginRight * 0.48), Math.max(18, cardY * 0.55), 6],
        [Math.max(18, cardX * 0.5), bottomTop + 26, 7],
        [totalWidth - Math.max(18, marginRight * 0.5), bottomTop + 26, 6.5],
      ];
      spots.forEach(([sx, sy, rad], idx) => {
        const driftY = Math.sin(phase + idx * 1.4) * 3;
        drawVectorSnowflake(
          ctx,
          sx,
          sy + driftY,
          rad,
          hexWithAlpha("#ffffff", 0.78),
          phase * (idx % 2 === 0 ? 0.5 : -0.5)
        );
      });
      break;
    }

    case "hearts": {
      const heartSpots: Array<[number, number, number]> = [
        [Math.max(16, cardX * 0.48), cardY + 26, 5.5],
        [totalWidth - Math.max(16, marginRight * 0.48), cardY + cardH - 26, 5.5],
        [Math.max(22, cardX * 0.6), bottomTop + 26, 6],
        [totalWidth - Math.max(22, marginRight * 0.6), bottomTop + 26, 6],
      ];
      heartSpots.forEach(([hx, hy, hs], idx) => {
        const bob = Math.sin(phase + idx * 1.3) * 2.5;
        const scale = 0.88 + 0.14 * Math.sin(phase * 2 + idx);
        drawVectorHeart(ctx, hx, hy + bob, hs * scale, hexWithAlpha(palette.accent, 0.88));
      });
      break;
    }

    case "luxury_gold":
    case "diamond":
    case "fireworks":
    case "galaxy": {
      // Corner star-diamond sparkles synced smoothly
      const stars: Array<[number, number, number]> = [
        [cardX - 10, cardY + 18, 5.5],
        [cardX + cardW + 10, cardY + cardH - 18, 5.5],
        [20, bottomTop + 22, 6],
        [totalWidth - 20, bottomTop + 22, 6],
      ];
      stars.forEach(([sx, sy, sr], idx) => {
        const scale = 0.7 + 0.4 * (0.5 + 0.5 * Math.sin(phase * 2 + idx * 1.5));
        drawVectorSparkle(ctx, sx, sy, sr * scale, hexWithAlpha(palette.accent, 0.9), phase * 0.5);
      });
      break;
    }

    default:
      break;
  }
}

function drawAdaptiveQrCard(
  ctx: CanvasRenderingContext2D,
  cardX: number,
  cardY: number,
  cardW: number,
  cardH: number,
  theme: AnimatedThemeConfig,
  palette: ResolvedPalette,
  options: AnimatedFrameRenderOptions,
  phase: number
): void {
  const cardRadius = 16;
  const pixelLum = getRelativeLuminance(options.pixelColor ?? "#000000");
  const isLightPixels = pixelLum > 0.58;
  const isTransparent = options.bgMode === "transparent";

  ctx.save();
  if (!isTransparent) {
    // Ambient elevation shadow lifting opaque cards above GPU shader layer
    ctx.shadowColor = hexWithAlpha("#000000", 0.45);
    ctx.shadowBlur = 18;
    ctx.shadowOffsetY = 6;
  }

  let hasFill = true;
  if (isTransparent) {
    const shaderLum = getRelativeLuminance(palette.baseBg);
    if (pixelLum < 0.14 && shaderLum < 0.18) {
      // Frosted translucent glass wash so very dark pixels remain scannable on dark shaders
      ctx.fillStyle = "rgba(255, 255, 255, 0.54)";
    } else if (shaderLum > 0.42 && pixelLum > 0.45) {
      ctx.fillStyle = "rgba(10, 14, 24, 0.22)";
    } else {
      // Ultra-clear glass veil: shader flows directly behind QR modules
      ctx.fillStyle = "rgba(8, 12, 22, 0.14)";
    }
  } else if (options.bgMode === "gradient" && options.bgColor && options.bgColor2) {
    const bgGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    bgGrad.addColorStop(0, options.bgColor);
    bgGrad.addColorStop(1, options.bgColor2);
    ctx.fillStyle = bgGrad;
  } else if (options.bgMode === "monochrome" && options.bgColor) {
    ctx.fillStyle = options.bgColor;
  } else if (theme.cardStyle === "obsidian_gold" || (theme.cardStyle === "glass_dark" && isLightPixels)) {
    ctx.fillStyle = isLightPixels ? "#0d0f17" : "#ffffff";
  } else if (isLightPixels) {
    ctx.fillStyle = "#0b0f19";
  } else {
    hasFill = false;
  }

  if (hasFill) {
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
    ctx.fill();
  }
  ctx.restore();

  // Crisp metallic/neon specular bezel around the QR card (never occludes QR modules)
  ctx.save();
  const sweep = 0.5 + 0.5 * Math.sin(phase);
  const borderGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
  const bezelAlpha = isTransparent ? 0.55 : 0.85;
  borderGrad.addColorStop(0, hexWithAlpha(palette.primary, bezelAlpha));
  borderGrad.addColorStop(0.5 + (sweep - 0.5) * 0.4, hexWithAlpha(palette.accent, isTransparent ? 0.72 : 0.95));
  borderGrad.addColorStop(1, hexWithAlpha(palette.secondary, bezelAlpha));

  ctx.strokeStyle = borderGrad;
  ctx.lineWidth = theme.cardStyle === "obsidian_gold" || theme.cardStyle === "neon_bezel" ? 2.0 : 1.35;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, cardRadius);
  ctx.stroke();
  ctx.restore();
}

function drawAnimatedCtaPill(
  ctx: CanvasRenderingContext2D,
  totalWidth: number,
  totalHeight: number,
  cardY: number,
  cardH: number,
  theme: AnimatedThemeConfig,
  palette: ResolvedPalette,
  frameText: string,
  fontFamily: FontFamilyType | string,
  fontSize: number,
  fontWeight: FontWeightType,
  textTransform: TextTransformType,
  phase: number
): void {
  const text = formatFrameText(frameText || "SCAN ME", textTransform);
  const bottomSpaceTop = cardY + cardH;
  const centerY = bottomSpaceTop + (totalHeight - bottomSpaceTop) / 2;
  const maxAllowedW = totalWidth - 40;

  let activeFontSize = Math.max(10, Math.min(22, fontSize));
  ctx.save();
  ctx.font = getCanvasFont(activeFontSize, fontFamily, fontWeight);
  while (ctx.measureText(text).width > maxAllowedW - 38 && activeFontSize > 8) {
    activeFontSize -= 1;
    ctx.font = getCanvasFont(activeFontSize, fontFamily, fontWeight);
  }

  const textWidth = ctx.measureText(text).width;
  const pillW = Math.min(maxAllowedW, Math.max(132, textWidth + 46));
  const pillH = Math.max(32, Math.min(44, activeFontSize * 2.2 + 8));
  const pillX = (totalWidth - pillW) / 2;
  const pillY = centerY - pillH / 2;

  const isChamfer = theme.badgeStyle === "cyber_chamfer";
  const pillGrad = ctx.createLinearGradient(pillX, pillY, pillX + pillW, pillY + pillH);

  let fillTextColor = "#ffffff";
  if (theme.badgeStyle === "gold_plaque") {
    pillGrad.addColorStop(0, mixHex(palette.primary, "#fef08a", 0.35));
    pillGrad.addColorStop(0.5 + 0.15 * Math.sin(phase), "#fde68a");
    pillGrad.addColorStop(1, palette.primary);
    fillTextColor = "#140e05";
  } else if (theme.badgeStyle === "terminal_prompt") {
    pillGrad.addColorStop(0, hexWithAlpha(palette.baseBg, 0.94));
    pillGrad.addColorStop(1, hexWithAlpha(mixHex(palette.baseBg, palette.primary, 0.25), 0.94));
    fillTextColor = palette.accent;
  } else if (theme.badgeStyle === "glass_pill") {
    pillGrad.addColorStop(0, hexWithAlpha(palette.primary, 0.28));
    pillGrad.addColorStop(1, hexWithAlpha(palette.secondary, 0.28));
    fillTextColor = "#ffffff";
  } else {
    pillGrad.addColorStop(0, palette.primary);
    pillGrad.addColorStop(1, palette.secondary);
    const avgLum =
      (getRelativeLuminance(palette.primary) + getRelativeLuminance(palette.secondary)) / 2;
    fillTextColor = avgLum > 0.56 ? "#09090b" : "#ffffff";
  }

  ctx.shadowColor = hexWithAlpha(palette.primary, 0.36);
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = pillGrad;

  if (isChamfer) {
    drawPolygonChamfer(ctx, pillX, pillY, pillW, pillH, 9);
  } else {
    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, pillH / 2);
  }
  ctx.fill();

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Specular pill border
  const borderPulse = 0.55 + 0.4 * Math.sin(phase * 2);
  ctx.strokeStyle =
    theme.badgeStyle === "gold_plaque"
      ? hexWithAlpha("#fffbeb", borderPulse)
      : hexWithAlpha(palette.accent, borderPulse);
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Render centered CTA text with clean contrast
  ctx.fillStyle = fillTextColor;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, totalWidth / 2, centerY + 0.5, pillW - 22);
  ctx.restore();
}

/**
 * Renders an animated shader-driven QR code frame onto a 2D canvas context.
 * Combines a GPU OGL fragment shader backdrop, elevated adaptive QR card,
 * synchronized corner/stage motifs, and an auto-fitted CTA badge.
 */
export function drawAnimatedQRFrame(
  ctx: CanvasRenderingContext2D,
  frame: FrameType,
  totalWidth: number,
  totalHeight: number,
  frameColor: string,
  frameText: string,
  isProPlan: boolean,
  timeSec: number = 0,
  fontFamily: FontFamilyType | string = "inter",
  fontSize: number = 12,
  fontWeight: FontWeightType = "bold",
  textTransform: TextTransformType = "uppercase",
  options: AnimatedFrameRenderOptions = {}
): void {
  const theme = getAnimatedTheme(frame);
  const customTint = options.tintWithFrameColor ? frameColor : undefined;
  const palette = resolveThemePalette(theme, customTint);

  const norm = loopNorm(timeSec, ANIMATED_LOOP_DURATION_SEC);
  const phase = norm * Math.PI * 2;

  const fallbackSide = Math.round(totalWidth * 0.11);
  const fallbackTop = Math.round(totalHeight * 0.11);
  const fallbackBottom = Math.round(totalHeight * 0.185);
  const paddings = options.paddings ?? {
    side: fallbackSide,
    top: fallbackTop,
    bottom: fallbackBottom,
  };
  const qrDrawSize =
    options.qrDrawSize ?? Math.max(64, totalWidth - paddings.side * 2);

  const cardPad = 12;
  const cardX = paddings.side - cardPad;
  const cardY = paddings.top - cardPad;
  const cardW = qrDrawSize + cardPad * 2;
  const cardH = qrDrawSize + cardPad * 2;

  const outerRadius = 20;

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(0, 0, totalWidth, totalHeight, outerRadius);
  ctx.clip();

  // 1. Seamless looping GPU WebGL shader backdrop (with Canvas2D gradient fallback)
  renderShaderBackdrop(ctx, totalWidth, totalHeight, theme, timeSec, customTint);

  // 2. Subtle inner radial vignette framing the center card
  const vignette = ctx.createRadialGradient(
    totalWidth / 2,
    cardY + cardH / 2,
    qrDrawSize * 0.35,
    totalWidth / 2,
    totalHeight / 2,
    Math.max(totalWidth, totalHeight) * 0.72
  );
  vignette.addColorStop(0, "rgba(0, 0, 0, 0)");
  vignette.addColorStop(1, "rgba(0, 0, 0, 0.32)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, totalWidth, totalHeight);

  // 3. Top telemetry chip & perimeter vector motifs (never overlapping QR card)
  drawTopStageHeader(ctx, totalWidth, cardX, cardY, cardW, theme, palette, phase);
  drawPerimeterMotifs(
    ctx,
    totalWidth,
    totalHeight,
    cardX,
    cardY,
    cardW,
    cardH,
    theme,
    palette,
    norm,
    phase
  );

  // 4. Adaptive elevated QR card protecting Quiet Zone & pixel contrast
  drawAdaptiveQrCard(ctx, cardX, cardY, cardW, cardH, theme, palette, options, phase);

  // 5. Crisp bottom CTA pill
  drawAnimatedCtaPill(
    ctx,
    totalWidth,
    totalHeight,
    cardY,
    cardH,
    theme,
    palette,
    frameText,
    fontFamily,
    fontSize,
    fontWeight,
    textTransform,
    phase
  );

  // 6. Outer metallic/glass shell hairline rim
  ctx.strokeStyle = hexWithAlpha(palette.accent, 0.28);
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(0.75, 0.75, totalWidth - 1.5, totalHeight - 1.5, outerRadius - 0.75);
  ctx.stroke();

  ctx.restore();

  // Unused param retained cleanly for signature stability across static/animated callers
  void isProPlan;
}
