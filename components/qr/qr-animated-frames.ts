// ============================================================================
// LShorter Dynamic QR Studio — Ultra-Realistic Animated Frames Engine
// High-fidelity canvas shaders, seamless 2.4s loops, and pristine QR isolation.
// ============================================================================

import {
  FontFamilyType,
  FontWeightType,
  TextTransformType,
  formatFrameText,
  getCanvasFont,
} from "./qr-render-engine";

// ─── Mathematical Looping Helpers (Seamless 2.4s GIF Period) ────────────────

export function loopNorm(timeSec: number, duration: number = 2.4): number {
  const t = ((timeSec % duration) + duration) % duration;
  return t / duration;
}

export function loopSin(
  timeSec: number,
  freqMultiplier: number = 1,
  phase: number = 0,
  duration: number = 2.4
): number {
  return Math.sin((timeSec / duration) * Math.PI * 2 * freqMultiplier + phase);
}

export function loopCos(
  timeSec: number,
  freqMultiplier: number = 1,
  phase: number = 0,
  duration: number = 2.4
): number {
  return Math.cos((timeSec / duration) * Math.PI * 2 * freqMultiplier + phase);
}

// ─── Elevated Inner Quiet Zone Card (Guarantees Scannability) ────────────────

export function drawInnerQuietCard(
  ctx: CanvasRenderingContext2D,
  totalWidth: number,
  totalHeight: number,
  bgColor: string = "#ffffff",
  borderColor: string = "rgba(0, 0, 0, 0.08)",
  borderWidth: number = 1,
  radius: number = 12
) {
  const cardX = 18;
  const cardY = 18;
  const cardW = totalWidth - 36;
  const cardH = totalHeight - 72;

  ctx.save();
  ctx.shadowColor = "rgba(0, 0, 0, 0.06)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = bgColor;
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, radius);
  ctx.fill();

  if (borderColor && borderWidth > 0) {
    ctx.shadowColor = "transparent";
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = borderWidth;
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Sleek Modern CTA Badge (No blurry emojis, crisp typography) ─────────────

export function drawSleekBadge(
  ctx: CanvasRenderingContext2D,
  totalWidth: number,
  totalHeight: number,
  options: {
    bg: string | CanvasGradient;
    borderColor?: string | CanvasGradient;
    borderWidth?: number;
    textColor: string;
    text: string;
    font: string;
    radius?: number;
    accent?: "brackets" | "chevrons" | "diamonds" | "stars" | "lightning" | "terminal" | "none";
    glowColor?: string;
    glowBlur?: number;
  }
) {
  const bX = totalWidth * 0.1;
  const bY = totalHeight - 50;
  const bW = totalWidth * 0.8;
  const bH = 36;
  const radius = options.radius ?? 12;

  ctx.save();
  if (options.glowColor) {
    ctx.shadowColor = options.glowColor;
    ctx.shadowBlur = options.glowBlur ?? 10;
  }

  ctx.fillStyle = options.bg;
  ctx.beginPath();
  ctx.roundRect(bX, bY, bW, bH, radius);
  ctx.fill();

  if (options.borderColor) {
    ctx.strokeStyle = options.borderColor;
    ctx.lineWidth = options.borderWidth ?? 1.5;
    ctx.stroke();
  }
  ctx.shadowBlur = 0;

  ctx.fillStyle = options.textColor;
  ctx.font = options.font;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  let formatted = options.text;
  if (options.accent === "brackets") formatted = `[  ${options.text}  ]`;
  else if (options.accent === "chevrons") formatted = `//  ${options.text}  //`;
  else if (options.accent === "diamonds") formatted = `◆  ${options.text}  ◆`;
  else if (options.accent === "stars") formatted = `✦  ${options.text}  ✦`;
  else if (options.accent === "lightning") formatted = `⚡  ${options.text}  ⚡`;
  else if (options.accent === "terminal") formatted = `>  ${options.text}`;

  ctx.fillText(formatted, totalWidth / 2, bY + bH / 2);
  ctx.restore();
}

// ─── Main Animated QR Frames Dispatcher ──────────────────────────────────────

export function drawAnimatedQRFrame(
  ctx: CanvasRenderingContext2D,
  frame: string,
  totalWidth: number,
  totalHeight: number,
  frameColor: string,
  frameText: string,
  isProPlan: boolean,
  timeSec: number = 0,
  fontFamily: FontFamilyType | string = "inter",
  fontSize: number = 12,
  fontWeight: FontWeightType = "bold",
  textTransform: TextTransformType = "uppercase"
): boolean {
  const txt = formatFrameText(frameText, textTransform);
  const baseFont = getCanvasFont(fontSize, fontFamily, fontWeight);
  const fontSmall = getCanvasFont(Math.max(8, fontSize - 2), fontFamily, fontWeight);
  const fontMono = getCanvasFont(fontSize, fontFamily === "inter" ? "jetbrains" : fontFamily, fontWeight);
  const fontSerif = getCanvasFont(fontSize, fontFamily === "inter" ? "cinzel" : fontFamily, fontWeight);

  switch (frame) {
    // 1. HOLIDAY & SEASONS
    case "anim_christmas": {
      ctx.save();
      // Outer Festive Crimson Chassis
      ctx.strokeStyle = "#831843";
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Gold Filigree Border
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(13, 13, totalWidth - 26, totalHeight - 26, 16);
      ctx.stroke();

      // Garland Light Bulbs along perimeter (outside card)
      const lightCount = 18;
      const bulbColors = ["#ef4444", "#fbbf24", "#10b981", "#38bdf8", "#ec4899"];
      const w = totalWidth - 24;
      const h = totalHeight - 24;
      const perim = 2 * (w + h);

      for (let i = 0; i < lightCount; i++) {
        const frac = (loopNorm(timeSec) + i / lightCount) % 1;
        const dist = frac * perim;
        let lx = 0, ly = 0;
        if (dist < w) { lx = 12 + dist; ly = 12; }
        else if (dist < w + h) { lx = totalWidth - 12; ly = 12 + (dist - w); }
        else if (dist < 2 * w + h) { lx = totalWidth - 12 - (dist - (w + h)); ly = totalHeight - 12; }
        else { lx = 12; ly = totalHeight - 12 - (dist - (2 * w + h)); }

        const pulse = 0.5 + 0.5 * loopSin(timeSec, 3, i * 1.2);
        const col = bulbColors[i % bulbColors.length];
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 8 * pulse;
        ctx.beginPath();
        ctx.arc(lx, ly, 3 + 1.2 * pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(245, 158, 11, 0.2)");

      // Festive Gold/Crimson Ribbon CTA
      const goldGrad = ctx.createLinearGradient(0, totalHeight - 50, totalWidth, totalHeight - 14);
      goldGrad.addColorStop(0, "#b45309");
      goldGrad.addColorStop(0.5, "#fbbf24");
      goldGrad.addColorStop(1, "#b45309");

      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#831843",
        borderColor: goldGrad,
        borderWidth: 2,
        textColor: "#fef08a",
        text: txt,
        font: fontSerif,
        accent: "stars",
        glowColor: "#f59e0b",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_halloween": {
      ctx.save();
      // Gothic Dark Violet Outer Rim
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#9333ea";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Flying Bat Silhouettes in top margin
      ctx.fillStyle = "#1e1035";
      for (let b = 0; b < 3; b++) {
        const rawBx = 20 + ((loopNorm(timeSec, 2.4) + b * 0.33) % 1) * (totalWidth - 40);
        const by = 13 + loopSin(timeSec, 2, b * 2) * 4;
        const wingFlap = loopSin(timeSec, 8, b);
        ctx.beginPath();
        ctx.ellipse(rawBx, by, 4, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(rawBx - 2, by);
        ctx.lineTo(rawBx - 7, by - 4 * wingFlap);
        ctx.lineTo(rawBx - 2, by + 1.5);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(rawBx + 2, by);
        ctx.lineTo(rawBx + 7, by - 4 * wingFlap);
        ctx.lineTo(rawBx + 2, by + 1.5);
        ctx.fill();
      }

      // Ethereal Mist Wisps in bottom margin
      for (let g = 0; g < 6; g++) {
        const gx = 18 + ((g * 50) % (totalWidth - 36));
        const gy = totalHeight - 56 + loopSin(timeSec, 2, g) * 4;
        const alpha = 0.2 + 0.15 * loopSin(timeSec, 1, g);
        ctx.fillStyle = `rgba(168, 85, 247, ${Math.max(0, alpha)})`;
        ctx.beginPath();
        ctx.arc(gx, gy, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(234, 88, 12, 0.2)");

      // Halloween Spooky CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#270a38",
        borderColor: "#f97316",
        borderWidth: 2,
        textColor: "#fdba74",
        text: txt,
        font: baseFont,
        accent: "stars",
        glowColor: "#f97316",
        glowBlur: 8,
      });
      ctx.restore();
      return true;
    }

    case "anim_sport": {
      ctx.save();
      // Carbon Track Chassis
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 22);
      ctx.stroke();

      const accentCol = frameColor || "#0284c7";
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = 2;
      ctx.stroke();

      // High-Speed Comet Beam around track
      const w = totalWidth - 16;
      const h = totalHeight - 16;
      const perim = 2 * (w + h);
      const frac = loopNorm(timeSec, 1.2);
      const beamDist = frac * perim;
      let bx = 0, by = 0;
      if (beamDist < w) { bx = 8 + beamDist; by = 8; }
      else if (beamDist < w + h) { bx = totalWidth - 8; by = 8 + (beamDist - w); }
      else if (beamDist < 2 * w + h) { bx = totalWidth - 8 - (beamDist - (w + h)); by = totalHeight - 8; }
      else { bx = 8; by = totalHeight - 8 - (beamDist - (2 * w + h)); }

      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Corner Energy Brackets
      const corners = [[16, 16], [totalWidth - 16, 16], [16, totalHeight - 16], [totalWidth - 16, totalHeight - 16]];
      corners.forEach(([cx, cy], idx) => {
        const pulse = 0.5 + 0.5 * loopSin(timeSec, 4, idx * 1.5);
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 1.5 + pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, 6 + pulse * 2, 0, Math.PI * 2);
        ctx.stroke();
      });

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(56, 189, 248, 0.2)");

      // Athletic Impact CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#0f172a",
        borderColor: "#38bdf8",
        borderWidth: 2,
        textColor: "#ffffff",
        text: txt,
        font: fontMono,
        accent: "lightning",
        glowColor: "#38bdf8",
        glowBlur: 8,
      });
      ctx.restore();
      return true;
    }

    case "anim_manga": {
      ctx.save();
      // Japanese Ink Frame
      ctx.strokeStyle = "#18181b";
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, totalWidth - 16, totalHeight - 16);

      // Screentone Action Bursts in corners
      ctx.strokeStyle = "rgba(236, 72, 153, 0.45)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 4; i++) {
        const offset = loopSin(timeSec, 4, i) * 4;
        ctx.beginPath();
        ctx.moveTo(8, 16 + i * 8 + offset);
        ctx.lineTo(24 + offset, 16 + i * 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(totalWidth - 8, 16 + i * 8 + offset);
        ctx.lineTo(totalWidth - 24 - offset, 16 + i * 8);
        ctx.stroke();
      }

      // Sakura Petals in Gutters
      for (let p = 0; p < 8; p++) {
        const isLeft = p % 2 === 0;
        const px = isLeft ? 12 + loopSin(timeSec, 1, p) * 3 : totalWidth - 12 + loopSin(timeSec, 1, p) * 3;
        const py = 20 + ((loopNorm(timeSec, 2.4) + p * 0.125) % 1) * (totalHeight - 80);
        const rot = loopSin(timeSec, 2, p);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rot);
        ctx.fillStyle = "#f472b6";
        ctx.shadowColor = "#fbcfe8";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 5, 2.8, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(24, 24, 27, 0.15)");

      // Manga Action CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#be185d",
        borderColor: "#fbcfe8",
        borderWidth: 2,
        textColor: "#ffffff",
        text: txt,
        font: baseFont,
        accent: "chevrons",
        radius: 8,
      });
      ctx.restore();
      return true;
    }

    case "anim_rain": {
      ctx.save();
      // Oceanic Frosted Glass Rim
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // Rain Streaks strictly in side gutters
      ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
      ctx.lineWidth = 1.5;
      for (let r = 0; r < 14; r++) {
        const isLeft = r % 2 === 0;
        const rx = isLeft ? 11 + (r % 3) * 2 : totalWidth - 15 + (r % 3) * 2;
        const ry = 14 + ((loopNorm(timeSec, 1.2) + r * 0.14) % 1) * (totalHeight - 75);
        ctx.beginPath();
        ctx.moveTo(rx, ry);
        ctx.lineTo(rx - 2, ry + 10);
        ctx.stroke();
      }

      // Water Ripples on bottom ledge
      for (let i = 0; i < 3; i++) {
        const phase = (loopNorm(timeSec, 1.2) + i * 0.33) % 1;
        const rX = 25 + i * (totalWidth / 3.2);
        const rY = totalHeight - 14;
        ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, 1 - phase)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(rX, rY, Math.max(0.1, phase * 16), Math.max(0.1, phase * 5), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(2, 132, 199, 0.2)");

      // Frosted Rain CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#0c4a6e",
        borderColor: "#38bdf8",
        borderWidth: 1.5,
        textColor: "#e0f2fe",
        text: txt,
        font: baseFont,
        accent: "diamonds",
        glowColor: "#38bdf8",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_snow": {
      ctx.save();
      // Frost Rim
      ctx.strokeStyle = "#67e8f9";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#a5f3fc";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Snowflakes in Gutters
      for (let s = 0; s < 16; s++) {
        const isLeft = s % 2 === 0;
        const sx = isLeft ? 11 + loopSin(timeSec, 1, s) * 3 : totalWidth - 15 + loopSin(timeSec, 1, s) * 3;
        const sy = 14 + ((loopNorm(timeSec, 2.4) + s * 0.0625) % 1) * (totalHeight - 75);
        const alpha = 0.5 + 0.5 * loopSin(timeSec, 2, s);
        ctx.fillStyle = `rgba(224, 242, 254, ${Math.max(0.2, alpha)})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4-Point Ice Sparkle Crystals in corners
      const sparkleCorners = [[16, 16], [totalWidth - 16, 16], [16, totalHeight - 16], [totalWidth - 16, totalHeight - 16]];
      sparkleCorners.forEach(([cx, cy], i) => {
        const pulse = 0.4 + 0.6 * loopSin(timeSec, 2, i * 1.5);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 5 * pulse, cy);
        ctx.lineTo(cx + 5 * pulse, cy);
        ctx.moveTo(cx, cy - 5 * pulse);
        ctx.lineTo(cx, cy + 5 * pulse);
        ctx.stroke();
      });

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(103, 232, 249, 0.2)");

      // Snow CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#164e63",
        borderColor: "#67e8f9",
        borderWidth: 1.5,
        textColor: "#ecfeff",
        text: txt,
        font: baseFont,
        accent: "stars",
        glowColor: "#67e8f9",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_cloud": {
      ctx.save();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Floating Cloud Puffs in top margin
      for (let c = 0; c < 2; c++) {
        const cx = 30 + ((loopNorm(timeSec, 2.4) + c * 0.5) % 1) * (totalWidth - 60);
        const cy = 14;
        ctx.fillStyle = "rgba(224, 242, 254, 0.85)";
        ctx.beginPath();
        ctx.arc(cx, cy, 7, 0, Math.PI * 2);
        ctx.arc(cx + 6, cy - 2, 9, 0, Math.PI * 2);
        ctx.arc(cx + 12, cy, 6, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(56, 189, 248, 0.2)");

      // Cloud CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#0284c7",
        borderColor: "#e0f2fe",
        borderWidth: 1.5,
        textColor: "#ffffff",
        text: txt,
        font: baseFont,
        accent: "stars",
        radius: 18,
      });
      ctx.restore();
      return true;
    }

    case "anim_storm": {
      ctx.save();
      const flash = loopSin(timeSec, 4) > 0.85;
      ctx.strokeStyle = flash ? "#c084fc" : "#475569";
      ctx.lineWidth = flash ? 4.5 : 3.5;
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = flash ? 16 : 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Branching Lightning along outer edge when flash active
      if (flash) {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(totalWidth * 0.2, 8);
        ctx.lineTo(totalWidth * 0.35, 18);
        ctx.lineTo(totalWidth * 0.3, 22);
        ctx.lineTo(totalWidth * 0.45, 12);
        ctx.stroke();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(168, 85, 247, 0.2)");

      // Storm CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#0f172a",
        borderColor: flash ? "#facc15" : "#a855f7",
        borderWidth: 2,
        textColor: flash ? "#fef08a" : "#ffffff",
        text: txt,
        font: fontMono,
        accent: "lightning",
        glowColor: "#a855f7",
        glowBlur: 8,
      });
      ctx.restore();
      return true;
    }

    // 2. TECH, CYBER & LUXURY
    case "anim_cyberpunk": {
      ctx.save();
      // Cyber Obsidian Border with Dual Glow
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 14);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Precision Corner Reticles
      const cLen = 14;
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(8, 8 + cLen); ctx.lineTo(8, 8); ctx.lineTo(8 + cLen, 8);
      ctx.moveTo(totalWidth - 8 - cLen, 8); ctx.lineTo(totalWidth - 8, 8); ctx.lineTo(totalWidth - 8, 8 + cLen);
      ctx.stroke();

      // Top Status Telemetry
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "#10b981";
      ctx.textAlign = "left";
      ctx.fillText("SYS.LINK // 100Gbps", 18, 16);

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(16, 185, 129, 0.25)");

      // Sweeping Scanning Laser Line across inner card
      const scanPhase = (loopSin(timeSec, 1) + 1) / 2;
      const scanY = 22 + scanPhase * (totalHeight - 98);
      ctx.strokeStyle = "rgba(6, 182, 212, 0.85)";
      ctx.lineWidth = 1.8;
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(20, scanY);
      ctx.lineTo(totalWidth - 20, scanY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Cyber HUD CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#022c22",
        borderColor: "#10b981",
        borderWidth: 1.5,
        textColor: "#6ee7b7",
        text: txt,
        font: fontMono,
        accent: "chevrons",
        radius: 6,
        glowColor: "#10b981",
        glowBlur: 8,
      });
      ctx.restore();
      return true;
    }

    case "anim_galaxy": {
      ctx.save();
      // Cosmic Swirling Nebula Gradient Frame
      const galaxyGrad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      galaxyGrad.addColorStop(0, "#8b5cf6");
      galaxyGrad.addColorStop(0.5, "#ec4899");
      galaxyGrad.addColorStop(1, "#3b82f6");

      ctx.strokeStyle = galaxyGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 22);
      ctx.stroke();

      // Orbiting Cosmic Satellites strictly along perimeter
      const w = totalWidth - 16;
      const h = totalHeight - 16;
      const perim = 2 * (w + h);
      for (let p = 0; p < 8; p++) {
        const frac = (loopNorm(timeSec, 2.4) + p * 0.125) % 1;
        const dist = frac * perim;
        let px = 0, py = 0;
        if (dist < w) { px = 8 + dist; py = 8; }
        else if (dist < w + h) { px = totalWidth - 8; py = 8 + (dist - w); }
        else if (dist < 2 * w + h) { px = totalWidth - 8 - (dist - (w + h)); py = totalHeight - 8; }
        else { px = 8; py = totalHeight - 8 - (dist - (2 * w + h)); }

        ctx.fillStyle = p % 2 === 0 ? "#f472b6" : "#60a5fa";
        ctx.shadowColor = ctx.fillStyle;
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(139, 92, 246, 0.2)");

      // Galaxy CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#1e1b4b",
        borderColor: galaxyGrad,
        borderWidth: 2,
        textColor: "#ffffff",
        text: txt,
        font: baseFont,
        accent: "stars",
        radius: 18,
        glowColor: "#ec4899",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_fire": {
      ctx.save();
      // Volcanic Ember Rim
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#f97316";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Rising Flame Tongues along bottom border
      for (let f = 0; f < 12; f++) {
        const fx = 18 + (f * (totalWidth - 36)) / 11;
        const flameHeight = Math.max(2, 6 + loopSin(timeSec, 4, f * 0.8) * 4);
        const gradFlame = ctx.createLinearGradient(fx, totalHeight - 12, fx, totalHeight - 12 - flameHeight);
        gradFlame.addColorStop(0, "rgba(234, 88, 12, 0.85)");
        gradFlame.addColorStop(1, "rgba(254, 240, 138, 0)");
        ctx.fillStyle = gradFlame;
        ctx.beginPath();
        ctx.moveTo(fx - 4, totalHeight - 12);
        ctx.quadraticCurveTo(fx, totalHeight - 12 - flameHeight, fx + 4, totalHeight - 12);
        ctx.fill();
      }

      // Embers in Side Gutters
      for (let e = 0; e < 8; e++) {
        const isLeft = e % 2 === 0;
        const ex = isLeft ? 11 + loopSin(timeSec, 2, e) * 2 : totalWidth - 13 + loopSin(timeSec, 2, e) * 2;
        const ey = totalHeight - 60 - ((loopNorm(timeSec, 2.4) + e * 0.125) % 1) * (totalHeight - 80);
        ctx.fillStyle = "rgba(253, 224, 71, 0.85)";
        ctx.beginPath();
        ctx.arc(ex, ey, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(234, 88, 12, 0.2)");

      // Fire CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#431407",
        borderColor: "#f97316",
        borderWidth: 2,
        textColor: "#ffedd5",
        text: txt,
        font: baseFont,
        accent: "lightning",
        glowColor: "#f97316",
        glowBlur: 8,
      });
      ctx.restore();
      return true;
    }

    case "anim_luxury_gold": {
      ctx.save();
      // Royal 24K Liquid Gold Beveled Double Border
      const goldGrad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      goldGrad.addColorStop(0, "#92400e");
      goldGrad.addColorStop(0.25, "#fef08a");
      goldGrad.addColorStop(0.5, "#f59e0b");
      goldGrad.addColorStop(0.75, "#78350f");
      goldGrad.addColorStop(1, "#fef9c3");

      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 4.5;
      ctx.strokeRect(8, 8, totalWidth - 16, totalHeight - 16);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(14, 14, totalWidth - 28, totalHeight - 28);

      // Specular Light Shimmer Sweep
      const beamX = loopNorm(timeSec, 2.4) * (totalWidth * 2) - totalWidth * 0.5;
      const shimmerGrad = ctx.createLinearGradient(beamX - 40, 0, beamX + 40, totalHeight);
      shimmerGrad.addColorStop(0, "rgba(254, 240, 138, 0)");
      shimmerGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.85)");
      shimmerGrad.addColorStop(1, "rgba(254, 240, 138, 0)");

      ctx.strokeStyle = shimmerGrad;
      ctx.lineWidth = 5;
      ctx.strokeRect(8, 8, totalWidth - 16, totalHeight - 16);

      // Sparkling Diamond Star Flares in 4 Corners
      const starCorners = [[11, 11], [totalWidth - 11, 11], [11, totalHeight - 11], [totalWidth - 11, totalHeight - 11]];
      starCorners.forEach(([sx, sy], idx) => {
        const pulse = 0.4 + 0.6 * loopSin(timeSec, 2, idx * 1.5);
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx - 6 * pulse, sy); ctx.lineTo(sx + 6 * pulse, sy);
        ctx.moveTo(sx, sy - 6 * pulse); ctx.lineTo(sx, sy + 6 * pulse);
        ctx.stroke();
      });

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(217, 119, 6, 0.25)");

      // Prestige Gold Ribbon CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: goldGrad,
        borderColor: "#78350f",
        borderWidth: 1.5,
        textColor: "#000000",
        text: txt,
        font: fontSerif,
        accent: "diamonds",
        radius: 6,
        glowColor: "#f59e0b",
        glowBlur: 8,
      });
      ctx.restore();
      return true;
    }

    case "anim_hearts": {
      ctx.save();
      ctx.strokeStyle = "#f43f5e";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#fda4af";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Floating Hearts in Gutters
      for (let h = 0; h < 6; h++) {
        const isLeft = h % 2 === 0;
        const hx = isLeft ? 12 : totalWidth - 12;
        const hy = totalHeight - 60 - ((loopNorm(timeSec, 2.4) + h * 0.166) % 1) * (totalHeight - 80);
        ctx.save();
        ctx.translate(hx, hy);
        ctx.scale(0.8, 0.8);
        ctx.fillStyle = h % 2 === 0 ? "#fb7185" : "#f43f5e";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-3, -4, -6, 0, 0, 6);
        ctx.bezierCurveTo(6, 0, 3, -4, 0, 0);
        ctx.fill();
        ctx.restore();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(244, 63, 94, 0.2)");

      // Hearts CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#881337",
        borderColor: "#fb7185",
        borderWidth: 2,
        textColor: "#ffe4e6",
        text: txt,
        font: baseFont,
        accent: "diamonds",
        glowColor: "#fb7185",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_waves": {
      ctx.save();
      ctx.strokeStyle = "#0d9488";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Undulating Sine Waves along bottom border
      const waveBase = totalHeight - 14;
      ctx.fillStyle = "rgba(45, 212, 191, 0.5)";
      ctx.beginPath();
      ctx.moveTo(8, waveBase);
      for (let x = 8; x <= totalWidth - 8; x += 4) {
        const wy = waveBase - 5 + loopSin(timeSec, 2, x * 0.05) * 4;
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(totalWidth - 8, totalHeight - 8);
      ctx.lineTo(8, totalHeight - 8);
      ctx.closePath();
      ctx.fill();

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(13, 148, 136, 0.2)");

      // Ocean CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#134e4a",
        borderColor: "#2dd4bf",
        borderWidth: 1.5,
        textColor: "#f0fdfa",
        text: txt,
        font: baseFont,
        accent: "diamonds",
        glowColor: "#2dd4bf",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_diamond": {
      ctx.save();
      // Crystal Diamond Beveled Frame
      const diamGrad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      diamGrad.addColorStop(0, "#06b6d4");
      diamGrad.addColorStop(0.5, "#e0e7ff");
      diamGrad.addColorStop(1, "#8b5cf6");

      ctx.strokeStyle = diamGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 16);
      ctx.stroke();

      // Prismatic Rainbow Light Beam
      const prismeX = loopNorm(timeSec, 2.4) * (totalWidth * 1.8) - totalWidth * 0.4;
      const rainbow = ctx.createLinearGradient(prismeX - 30, 0, prismeX + 30, totalHeight);
      rainbow.addColorStop(0, "rgba(6, 182, 212, 0)");
      rainbow.addColorStop(0.3, "rgba(168, 85, 247, 0.6)");
      rainbow.addColorStop(0.7, "rgba(244, 114, 182, 0.6)");
      rainbow.addColorStop(1, "rgba(6, 182, 212, 0)");

      ctx.strokeStyle = rainbow;
      ctx.lineWidth = 4;
      ctx.stroke();

      // Diamond Sparkle Flares
      const diamCorners = [[16, 16], [totalWidth - 16, 16], [16, totalHeight - 16], [totalWidth - 16, totalHeight - 16]];
      diamCorners.forEach(([cx, cy], i) => {
        const pulse = 0.4 + 0.6 * loopSin(timeSec, 2, i * 1.5);
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 8 * pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, 2.5 * pulse, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(6, 182, 212, 0.2)");

      // Diamond CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#1e1b4b",
        borderColor: diamGrad,
        borderWidth: 2,
        textColor: "#e0e7ff",
        text: txt,
        font: fontSerif,
        accent: "diamonds",
        radius: 14,
        glowColor: "#06b6d4",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_music": {
      ctx.save();
      // Soundstage Frame
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // Animated Frequency Bars along bottom ledge
      const barCount = 18;
      const barW = (totalWidth - 40) / barCount;
      for (let b = 0; b < barCount; b++) {
        const bh = Math.max(2, 4 + Math.abs(loopSin(timeSec, 4, b * 0.5)) * 12);
        const bx = 20 + b * barW;
        const by = totalHeight - 12 - bh;
        const grad = ctx.createLinearGradient(bx, by, bx, totalHeight - 12);
        grad.addColorStop(0, "#ec4899");
        grad.addColorStop(1, "#8b5cf6");
        ctx.fillStyle = grad;
        ctx.fillRect(bx, by, Math.max(1, barW - 2), bh);
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(139, 92, 246, 0.2)");

      // Music CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#3b0764",
        borderColor: "#ec4899",
        borderWidth: 1.5,
        textColor: "#ffffff",
        text: txt,
        font: baseFont,
        accent: "chevrons",
        radius: 16,
        glowColor: "#ec4899",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_arcade": {
      ctx.save();
      // 80s Synthwave Magenta & Cyan Frame
      const synthGrad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      synthGrad.addColorStop(0, "#ec4899");
      synthGrad.addColorStop(1, "#06b6d4");

      ctx.strokeStyle = synthGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 12);
      ctx.stroke();

      // Perspective Grid Lines at Bottom
      ctx.strokeStyle = "rgba(236, 72, 153, 0.4)";
      ctx.lineWidth = 1;
      for (let g = 0; g < 4; g++) {
        const gy = totalHeight - 18 + g * 3;
        ctx.beginPath();
        ctx.moveTo(12, gy);
        ctx.lineTo(totalWidth - 12, gy);
        ctx.stroke();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(236, 72, 153, 0.2)");

      // Retro CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#18022e",
        borderColor: synthGrad,
        borderWidth: 2,
        textColor: "#f472b6",
        text: txt,
        font: fontMono,
        accent: "brackets",
        radius: 6,
        glowColor: "#ec4899",
        glowBlur: 8,
      });
      ctx.restore();
      return true;
    }

    case "anim_nature": {
      ctx.save();
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Glowing Firefly Wisps in Gutters
      for (let f = 0; f < 6; f++) {
        const isLeft = f % 2 === 0;
        const fx = isLeft ? 12 : totalWidth - 12;
        const fy = 20 + ((loopNorm(timeSec, 2.4) + f * 0.166) % 1) * (totalHeight - 80);
        const pulse = 0.5 + 0.5 * loopSin(timeSec, 2, f);
        ctx.fillStyle = `rgba(163, 230, 53, ${pulse})`;
        ctx.shadowColor = "#a3e635";
        ctx.shadowBlur = 6 * pulse;
        ctx.beginPath();
        ctx.arc(fx, fy, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(5, 150, 105, 0.2)");

      // Nature CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#064e3b",
        borderColor: "#34d399",
        borderWidth: 2,
        textColor: "#d1fae5",
        text: txt,
        font: baseFont,
        accent: "stars",
        radius: 18,
        glowColor: "#34d399",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_coffee": {
      ctx.save();
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // Curling Steam Vapor Lines at Top
      ctx.strokeStyle = "rgba(254, 215, 170, 0.6)";
      ctx.lineWidth = 1.8;
      for (let s = 0; s < 3; s++) {
        const sx = totalWidth * 0.38 + s * 16;
        const sy = 16;
        const wave = loopSin(timeSec, 2, s) * 4;
        ctx.beginPath();
        ctx.moveTo(sx, sy + 6);
        ctx.quadraticCurveTo(sx + wave, sy + 2, sx, sy - 4);
        ctx.stroke();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(120, 53, 15, 0.2)");

      // Coffee CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#451a03",
        borderColor: "#d97706",
        borderWidth: 1.5,
        textColor: "#fef3c7",
        text: txt,
        font: baseFont,
        accent: "diamonds",
        radius: 12,
        glowColor: "#d97706",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_fireworks": {
      ctx.save();
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Particle Fireworks at 2 centers in top margin
      const centers = [[totalWidth * 0.3, 18], [totalWidth * 0.7, 18]];
      const fColors = ["#facc15", "#f43f5e", "#38bdf8", "#34d399"];

      centers.forEach(([cx, cy], cIdx) => {
        const cycle = (loopNorm(timeSec, 1.2) + cIdx * 0.5) % 1;
        const radius = Math.max(0.1, cycle * 18);
        const pAlpha = Math.max(0, 1 - cycle);

        for (let p = 0; p < 8; p++) {
          const angle = (p * Math.PI * 2) / 8;
          const px = cx + Math.cos(angle) * radius;
          const py = cy + Math.sin(angle) * radius;
          ctx.fillStyle = fColors[(p + cIdx) % fColors.length];
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.1, 1.8 * pAlpha), 0, Math.PI * 2);
          ctx.fill();
        }
      });
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(99, 102, 241, 0.2)");

      // Celebration CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#1e1b4b",
        borderColor: "#facc15",
        borderWidth: 2,
        textColor: "#fef08a",
        text: txt,
        font: baseFont,
        accent: "stars",
        radius: 16,
        glowColor: "#facc15",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_f1_racing": {
      ctx.save();
      // Asphalt Rim
      ctx.strokeStyle = "#18181b";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // Red & White Grand Prix Kerb Stripes at Top & Bottom
      const kerbCount = 16;
      const kerbW = (totalWidth - 24) / kerbCount;
      for (let k = 0; k < kerbCount; k++) {
        const kCol = (k + Math.floor(loopNorm(timeSec, 0.6) * kerbCount)) % 2 === 0 ? "#dc2626" : "#ffffff";
        ctx.fillStyle = kCol;
        ctx.fillRect(12 + k * kerbW, 5, kerbW, 3);
        ctx.fillRect(12 + k * kerbW, totalHeight - 8, kerbW, 3);
      }

      // Velocity Comet
      const w = totalWidth - 16;
      const h = totalHeight - 16;
      const perim = 2 * (w + h);
      const frac = loopNorm(timeSec, 1.2);
      const dist = frac * perim;
      let bx = 0, by = 0;
      if (dist < w) { bx = 8 + dist; by = 8; }
      else if (dist < w + h) { bx = totalWidth - 8; by = 8 + (dist - w); }
      else if (dist < 2 * w + h) { bx = totalWidth - 8 - (dist - (w + h)); by = totalHeight - 8; }
      else { bx = 8; by = totalHeight - 8 - (dist - (2 * w + h)); }

      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#f87171";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(bx, by, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(220, 38, 38, 0.2)");

      // Racing CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#09090b",
        borderColor: "#dc2626",
        borderWidth: 2,
        textColor: "#ffffff",
        text: txt,
        font: fontMono,
        accent: "chevrons",
        radius: 10,
        glowColor: "#dc2626",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_basketball": {
      ctx.save();
      ctx.strokeStyle = "#c2410c";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Bouncing Basketball in top margin
      const bx = 20 + loopNorm(timeSec, 2.4) * (totalWidth - 40);
      const by = 16 - Math.abs(loopSin(timeSec, 4)) * 6;
      ctx.fillStyle = "#ea580c";
      ctx.shadowColor = "#fb923c";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(194, 65, 12, 0.2)");

      // Basketball CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#431407",
        borderColor: "#f97316",
        borderWidth: 2,
        textColor: "#ffedd5",
        text: txt,
        font: baseFont,
        accent: "lightning",
        radius: 18,
        glowColor: "#f97316",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_football": {
      ctx.save();
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Champions League Pulsing Stars in Corners
      const corners = [[16, 16], [totalWidth - 16, 16], [16, totalHeight - 16], [totalWidth - 16, totalHeight - 16]];
      corners.forEach(([sx, sy], idx) => {
        const pulse = 0.5 + 0.5 * loopSin(timeSec, 2, idx * 1.5);
        ctx.fillStyle = "#facc15";
        ctx.shadowColor = "#fef08a";
        ctx.shadowBlur = 6 * pulse;
        ctx.beginPath();
        ctx.arc(sx, sy, 2.8 * pulse, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(21, 128, 61, 0.2)");

      // Champions CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#052e16",
        borderColor: "#4ade80",
        borderWidth: 1.5,
        textColor: "#f0fdf4",
        text: txt,
        font: baseFont,
        accent: "stars",
        radius: 12,
        glowColor: "#4ade80",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_tennis": {
      ctx.save();
      ctx.strokeStyle = "#166534";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // Tennis ball along top margin
      const tX = 20 + loopNorm(timeSec, 2.4) * (totalWidth - 40);
      const tY = 14 + loopSin(timeSec, 4) * 3;
      ctx.fillStyle = "#ccff00";
      ctx.shadowColor = "#bef264";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(tX, tY, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(22, 101, 52, 0.2)");

      // Tennis CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#14532d",
        borderColor: "#ccff00",
        borderWidth: 1.5,
        textColor: "#ffffff",
        text: txt,
        font: baseFont,
        accent: "diamonds",
        radius: 18,
        glowColor: "#ccff00",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_boxing": {
      ctx.save();
      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 14);
      ctx.stroke();

      ctx.strokeStyle = "#2563eb";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(14, 14, totalWidth - 28, totalHeight - 28, 10);
      ctx.stroke();

      // Impact flash in top corners
      const flash = loopSin(timeSec, 4) > 0.75;
      if (flash) {
        ctx.fillStyle = "#facc15";
        ctx.shadowColor = "#fef08a";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(14, 14, 4, 0, Math.PI * 2);
        ctx.arc(totalWidth - 14, 14, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(220, 38, 38, 0.2)");

      // Fight CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#450a0a",
        borderColor: "#ef4444",
        borderWidth: 2,
        textColor: "#fee2e2",
        text: txt,
        font: baseFont,
        accent: "chevrons",
        radius: 8,
        glowColor: "#ef4444",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_terminal_code": {
      ctx.save();
      // Hacker Terminal Frame
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 10);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // macOS Traffic Lights
      ctx.fillStyle = "#ef4444"; ctx.beginPath(); ctx.arc(18, 16, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#eab308"; ctx.beginPath(); ctx.arc(28, 16, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#22c55e"; ctx.beginPath(); ctx.arc(38, 16, 3, 0, Math.PI * 2); ctx.fill();

      // Prompt & Cursor
      const blink = loopSin(timeSec, 2) > 0;
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "#86efac";
      ctx.textAlign = "left";
      ctx.fillText(`>_ root@dev:~# ${blink ? "█" : ""}`, 48, 18);

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(34, 197, 94, 0.2)");

      // Terminal CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#052e16",
        borderColor: "#22c55e",
        borderWidth: 1.5,
        textColor: "#bbf7d0",
        text: txt,
        font: fontMono,
        accent: "terminal",
        radius: 6,
        glowColor: "#22c55e",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_rocket_launch": {
      ctx.save();
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Shooting Star in top margin
      const starFrac = loopNorm(timeSec, 2.4);
      const ssX = 14 + starFrac * (totalWidth - 40);
      const ssY = 14 + starFrac * 6;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ssX, ssY);
      ctx.lineTo(ssX + 14, ssY - 4);
      ctx.stroke();

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(59, 130, 246, 0.2)");

      // Space CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#1e1b4b",
        borderColor: "#60a5fa",
        borderWidth: 1.5,
        textColor: "#dbeafe",
        text: txt,
        font: baseFont,
        accent: "chevrons",
        radius: 16,
        glowColor: "#60a5fa",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_aurora": {
      ctx.save();
      const aurGrad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      aurGrad.addColorStop(0, "#10b981");
      aurGrad.addColorStop(0.5, "#06b6d4");
      aurGrad.addColorStop(1, "#8b5cf6");

      ctx.strokeStyle = aurGrad;
      ctx.lineWidth = 4;
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Aurora Veil in top margin
      ctx.fillStyle = "rgba(52, 211, 153, 0.35)";
      ctx.beginPath();
      ctx.moveTo(8, 18);
      for (let x = 8; x <= totalWidth - 8; x += 6) {
        const ay = 16 + loopSin(timeSec, 2, x * 0.05) * 4;
        ctx.lineTo(x, ay);
      }
      ctx.lineTo(totalWidth - 8, 8);
      ctx.lineTo(8, 8);
      ctx.closePath();
      ctx.fill();

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(16, 185, 129, 0.2)");

      // Aurora CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#022c22",
        borderColor: aurGrad,
        borderWidth: 2,
        textColor: "#d1fae5",
        text: txt,
        font: baseFont,
        accent: "stars",
        radius: 18,
        glowColor: "#34d399",
        glowBlur: 8,
      });
      ctx.restore();
      return true;
    }

    case "anim_dna_biotech": {
      ctx.save();
      ctx.strokeStyle = "#0d9488";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // DNA Base Pairs in Gutters
      for (let d = 0; d < 6; d++) {
        const dY = 24 + d * ((totalHeight - 80) / 5);
        const wave = loopSin(timeSec, 2, d * 0.8);
        const lX1 = 12 + wave * 3;
        const lX2 = 12 - wave * 3;

        ctx.fillStyle = "#2dd4bf"; ctx.beginPath(); ctx.arc(lX1, dY, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#38bdf8"; ctx.beginPath(); ctx.arc(lX2, dY, 2, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = "rgba(45, 212, 191, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(lX1, dY); ctx.lineTo(lX2, dY); ctx.stroke();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(13, 148, 136, 0.2)");

      // Biotech CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#134e4a",
        borderColor: "#2dd4bf",
        borderWidth: 1.5,
        textColor: "#ccfbf1",
        text: txt,
        font: fontMono,
        accent: "brackets",
        radius: 14,
        glowColor: "#2dd4bf",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_glitch": {
      ctx.save();
      const glitchActive = loopSin(timeSec, 6) > 0.85;
      const gOffset = glitchActive ? (loopSin(timeSec, 12) > 0 ? 2.5 : -2.5) : 0;

      // Cyan Ghost
      ctx.strokeStyle = "rgba(6, 182, 212, 0.75)";
      ctx.lineWidth = 3;
      ctx.strokeRect(8 + gOffset, 8, totalWidth - 16, totalHeight - 16);

      // Magenta Ghost
      ctx.strokeStyle = "rgba(236, 72, 153, 0.75)";
      ctx.lineWidth = 3;
      ctx.strokeRect(8 - gOffset, 8, totalWidth - 16, totalHeight - 16);

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(6, 182, 212, 0.2)");

      // Glitch CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#09090b",
        borderColor: glitchActive ? "#ec4899" : "#06b6d4",
        borderWidth: 2,
        textColor: "#ffffff",
        text: txt,
        font: fontMono,
        accent: "chevrons",
        radius: 6,
        glowColor: "#06b6d4",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_sunset_vibes": {
      ctx.save();
      const sunGrad = ctx.createLinearGradient(0, 0, 0, totalHeight);
      sunGrad.addColorStop(0, "#f43f5e");
      sunGrad.addColorStop(0.5, "#fb923c");
      sunGrad.addColorStop(1, "#fbbf24");

      ctx.strokeStyle = sunGrad;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Sinking Sun Disk in Top Margin
      const sunY = 18 + loopSin(timeSec, 1) * 3;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(totalWidth / 2, sunY, 9, 0, Math.PI * 2);
      ctx.fill();

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(244, 63, 94, 0.2)");

      // Sunset CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#881337",
        borderColor: "#fb923c",
        borderWidth: 2,
        textColor: "#fff1f2",
        text: txt,
        font: baseFont,
        accent: "diamonds",
        radius: 18,
        glowColor: "#fb923c",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_matrix_rain": {
      ctx.save();
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 12);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Matrix Rain strictly in Left & Right Gutters (NEVER touches QR)
      ctx.font = "bold 7px monospace";
      const binChars = "01101001";
      for (let c = 0; c < 2; c++) {
        const isLeft = c === 0;
        const cx = isLeft ? 11 : totalWidth - 15;
        for (let r = 0; r < 7; r++) {
          const ry = 18 + ((loopNorm(timeSec, 1.2) + r * 0.14) % 1) * (totalHeight - 75);
          const char = binChars[(c + r) % binChars.length];
          const isLeader = r === 0;
          ctx.fillStyle = isLeader ? "#ffffff" : "rgba(74, 222, 128, 0.75)";
          ctx.fillText(char, cx, ry);
        }
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(34, 197, 94, 0.25)");

      // Matrix CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#022c22",
        borderColor: "#22c55e",
        borderWidth: 1.5,
        textColor: "#86efac",
        text: txt,
        font: fontMono,
        accent: "terminal",
        radius: 6,
        glowColor: "#22c55e",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_circuit_board": {
      ctx.save();
      ctx.strokeStyle = "#047857";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 10);
      ctx.stroke();

      // Corner PCB Solder Pads
      const cornerPads = [[16, 16], [totalWidth - 16, 16], [16, totalHeight - 16], [totalWidth - 16, totalHeight - 16]];
      cornerPads.forEach(([px, py]) => {
        ctx.fillStyle = "#ca8a04"; ctx.beginPath(); ctx.arc(px, py, 3, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#022c22"; ctx.beginPath(); ctx.arc(px, py, 1.2, 0, Math.PI * 2); ctx.fill();
      });

      // Traveling Electric Pulses along perimeter
      const pulsePhase = loopNorm(timeSec, 1.2);
      ctx.fillStyle = "#fef08a";
      ctx.shadowColor = "#eab308";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(16 + pulsePhase * (totalWidth - 32), 8, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(4, 120, 87, 0.2)");

      // PCB CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#022c22",
        borderColor: "#10b981",
        borderWidth: 1.8,
        textColor: "#a7f3d0",
        text: txt,
        font: fontMono,
        accent: "lightning",
        radius: 8,
        glowColor: "#10b981",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_quantum_grid": {
      ctx.save();
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 14);
      ctx.stroke();

      // Qubit Nodes along outer border
      const qubitNodes = [
        { x: totalWidth * 0.3, y: 8 },
        { x: totalWidth * 0.7, y: 8 },
        { x: totalWidth - 8, y: totalHeight * 0.4 },
        { x: totalWidth * 0.7, y: totalHeight - 8 },
        { x: totalWidth * 0.3, y: totalHeight - 8 },
        { x: 8, y: totalHeight * 0.4 },
      ];

      qubitNodes.forEach((node, idx) => {
        const pulse = 2 + loopSin(timeSec, 2, idx * 1.2) * 1.2;
        ctx.fillStyle = idx % 2 === 0 ? "#a855f7" : "#38bdf8";
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulse, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(99, 102, 241, 0.2)");

      // Quantum CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#1e1b4b",
        borderColor: "#818cf8",
        borderWidth: 2,
        textColor: "#e0e7ff",
        text: txt,
        font: fontMono,
        accent: "brackets",
        radius: 12,
        glowColor: "#818cf8",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_ai_neural": {
      ctx.save();
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 16);
      ctx.stroke();

      // Synapse Nodes in side margins
      for (let i = 0; i < 4; i++) {
        const y = 26 + i * ((totalHeight - 80) / 3);
        const pulse = 0.5 + 0.5 * loopSin(timeSec, 2, i);
        const r = 1.8 + pulse * 1.2;
        ctx.fillStyle = "#60a5fa";
        ctx.beginPath(); ctx.arc(12, y, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#f472b6";
        ctx.beginPath(); ctx.arc(totalWidth - 12, y, r, 0, Math.PI * 2); ctx.fill();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(59, 130, 246, 0.2)");

      // AI Neural CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#0f172a",
        borderColor: "#818cf8",
        borderWidth: 1.8,
        textColor: "#93c5fd",
        text: txt,
        font: fontMono,
        accent: "stars",
        radius: 10,
        glowColor: "#818cf8",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_hologram_hud": {
      ctx.save();
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2.5;
      const cornerLen = 18;

      // 4 Precision Brackets
      ctx.beginPath();
      ctx.moveTo(8, 8 + cornerLen); ctx.lineTo(8, 8); ctx.lineTo(8 + cornerLen, 8);
      ctx.moveTo(totalWidth - 8 - cornerLen, 8); ctx.lineTo(totalWidth - 8, 8); ctx.lineTo(totalWidth - 8, 8 + cornerLen);
      ctx.moveTo(8, totalHeight - 14 - cornerLen); ctx.lineTo(8, totalHeight - 14); ctx.lineTo(8 + cornerLen, totalHeight - 14);
      ctx.moveTo(totalWidth - 8 - cornerLen, totalHeight - 14); ctx.lineTo(totalWidth - 8, totalHeight - 14); ctx.lineTo(totalWidth - 8, totalHeight - 14 - cornerLen);
      ctx.stroke();

      // Telemetry
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "#22d3ee";
      ctx.textAlign = "left";
      ctx.fillText("SYS.LOCK // 99.8%", 18, 16);

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(6, 182, 212, 0.2)");

      // Volumetric Laser Line
      const scanPhase = (loopSin(timeSec, 1) + 1) / 2;
      const scanY = 22 + scanPhase * (totalHeight - 96);
      ctx.strokeStyle = "rgba(34, 211, 238, 0.85)";
      ctx.lineWidth = 1.8;
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(18, scanY);
      ctx.lineTo(totalWidth - 18, scanY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // HUD CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#083344",
        borderColor: "#22d3ee",
        borderWidth: 1.8,
        textColor: "#67e8f9",
        text: txt,
        font: fontMono,
        accent: "diamonds",
        radius: 6,
        glowColor: "#22d3ee",
        glowBlur: 8,
      });
      ctx.restore();
      return true;
    }

    case "anim_fiber_optic": {
      ctx.save();
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 14);
      ctx.stroke();

      // Photon bursts streaming along frame
      const perim = 2 * (totalWidth - 20) + 2 * (totalHeight - 20);
      const burstColors = ["#38bdf8", "#ec4899", "#fbbf24", "#34d399"];
      for (let b = 0; b < 4; b++) {
        const frac = (loopNorm(timeSec, 1.2) + b * 0.25) % 1;
        const dist = frac * perim;
        let bx = 0, by = 0;
        const topW = totalWidth - 20;
        const rightH = totalHeight - 20;

        if (dist < topW) { bx = 10 + dist; by = 10; }
        else if (dist < topW + rightH) { bx = totalWidth - 10; by = 10 + (dist - topW); }
        else if (dist < 2 * topW + rightH) { bx = totalWidth - 10 - (dist - (topW + rightH)); by = totalHeight - 10; }
        else { bx = 10; by = totalHeight - 10 - (dist - (2 * topW + rightH)); }

        ctx.fillStyle = burstColors[b];
        ctx.shadowColor = burstColors[b];
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(bx, by, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(2, 132, 199, 0.2)");

      // Fiber CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#0c4a6e",
        borderColor: "#38bdf8",
        borderWidth: 1.8,
        textColor: "#bae6fd",
        text: txt,
        font: fontMono,
        accent: "lightning",
        radius: 12,
        glowColor: "#38bdf8",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_blockchain": {
      ctx.save();
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 12);
      ctx.stroke();

      // Cryptographic Blocks along top border
      const bCount = 4;
      const activeB = Math.floor(loopNorm(timeSec, 1.2) * bCount);
      for (let b = 0; b < bCount; b++) {
        const bx = 26 + b * ((totalWidth - 68) / (bCount - 1));
        const by = 8;
        const isMined = activeB === b;
        ctx.fillStyle = isMined ? "#fbbf24" : "#78350f";
        ctx.beginPath();
        ctx.roundRect(bx - 5, by - 3, 10, 6, 2);
        ctx.fill();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(217, 119, 6, 0.2)");

      // Blockchain CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#451a03",
        borderColor: "#f59e0b",
        borderWidth: 2,
        textColor: "#fef3c7",
        text: txt,
        font: fontMono,
        accent: "diamonds",
        radius: 8,
        glowColor: "#f59e0b",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_radar_scan": {
      ctx.save();
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 16);
      ctx.stroke();

      // Radar Concentric Range Rings in Top Center
      const rcX = totalWidth / 2;
      const rcY = 16;
      const maxR = 10;
      ctx.strokeStyle = "rgba(74, 222, 128, 0.35)";
      ctx.lineWidth = 1;
      for (let r = 1; r <= 2; r++) {
        ctx.beginPath();
        ctx.arc(rcX, rcY, (r / 2) * maxR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Radar Sweep Line
      const sweepAngle = loopNorm(timeSec, 1.2) * Math.PI * 2;
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 1.5;
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(rcX, rcY);
      ctx.lineTo(rcX + Math.cos(sweepAngle) * maxR, rcY + Math.sin(sweepAngle) * maxR);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(21, 128, 61, 0.2)");

      // Radar CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#052e16",
        borderColor: "#22c55e",
        borderWidth: 1.8,
        textColor: "#86efac",
        text: txt,
        font: fontMono,
        accent: "brackets",
        radius: 10,
        glowColor: "#22c55e",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    case "anim_cloud_cluster": {
      ctx.save();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 10);
      ctx.stroke();

      // Server Blade LEDs in side gutters
      const bladeCount = 5;
      for (let i = 0; i < bladeCount; i++) {
        const by = 26 + i * ((totalHeight - 85) / (bladeCount - 1));
        const ledPhase = (Math.floor(loopNorm(timeSec, 0.6) * 3) + i) % 3;
        const ledColor = ledPhase === 0 ? "#22c55e" : ledPhase === 1 ? "#38bdf8" : "#f59e0b";
        ctx.fillStyle = ledColor;
        ctx.beginPath(); ctx.arc(12, by, 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(totalWidth - 12, by, 1.8, 0, Math.PI * 2); ctx.fill();
      }

      // Inner Clean Card
      drawInnerQuietCard(ctx, totalWidth, totalHeight, "#ffffff", "rgba(71, 85, 105, 0.2)");

      // Cloud CTA
      drawSleekBadge(ctx, totalWidth, totalHeight, {
        bg: "#0f172a",
        borderColor: "#38bdf8",
        borderWidth: 1.8,
        textColor: "#bae6fd",
        text: txt,
        font: fontMono,
        accent: "chevrons",
        radius: 8,
        glowColor: "#38bdf8",
        glowBlur: 6,
      });
      ctx.restore();
      return true;
    }

    default:
      return false;
  }
}
