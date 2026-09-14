// =============================================================================
// LShorter QR Studio — High-Precision 2D Canvas Vector Rendering Engine
// Supports 14 Premium Frames, 24 Authentic Vector Logos, 15 Pixel Patterns,
// 15 Distinct Corner Eyes, and High-DPI Scaling.
// =============================================================================

export type PixelStyleType =
  | "square"
  | "rounded"
  | "dots"
  | "diamond"
  | "classy"
  | "stars"
  | "lines"
  | "fluid"
  | "cross"
  | "hexagon_dots"
  | "heart"
  | "cyber_tiles"
  | "sparkle"
  | "vertical_bars"
  | "pill";

export type EyeStyleType =
  | "square"
  | "rounded"
  | "circle"
  | "leaf"
  | "hexagon"
  | "star"
  | "cyber"
  | "diamond_eye"
  | "shield"
  | "target"
  | "petal"
  | "double_circle"
  | "bracket"
  | "heart_eye"
  | "gear";

export type FrameType =
  | "none"
  | "simple"
  | "bottom_pill"
  | "top_header"
  | "hand_arrow"
  | "modern_badge"
  | "neon"
  | "phone"
  | "tag_ticket"
  | "polaroid"
  | "luxury_gold"
  | "circular_badge"
  | "chat_bubble"
  | "gradient_border"
  // 32 Ultra-Premium Animated Themes
  | "anim_christmas"
  | "anim_halloween"
  | "anim_sport"
  | "anim_manga"
  | "anim_rain"
  | "anim_snow"
  | "anim_cloud"
  | "anim_storm"
  | "anim_cyberpunk"
  | "anim_galaxy"
  | "anim_fire"
  | "anim_luxury_gold"
  | "anim_hearts"
  | "anim_waves"
  | "anim_diamond"
  | "anim_music"
  | "anim_arcade"
  | "anim_nature"
  | "anim_coffee"
  | "anim_fireworks"
  | "anim_f1_racing"
  | "anim_basketball"
  | "anim_football"
  | "anim_tennis"
  | "anim_boxing"
  | "anim_terminal_code"
  | "anim_rocket_launch"
  | "anim_aurora"
  | "anim_dna_biotech"
  | "anim_glitch"
  | "anim_sunset_vibes"
  | "anim_matrix_rain"
  // Advanced Tech Logic Frames
  | "anim_circuit_board"
  | "anim_quantum_grid"
  | "anim_ai_neural"
  | "anim_hologram_hud"
  | "anim_fiber_optic"
  | "anim_blockchain"
  | "anim_radar_scan"
  | "anim_cloud_cluster";

export function isAnimatedFrame(frame: FrameType): boolean {
  return typeof frame === "string" && frame.startsWith("anim_");
}

export type FontFamilyType =
  // Sans-Serif
  | "inter"
  | "roboto"
  | "montserrat"
  | "poppins"
  | "plus_jakarta"
  | "outfit"
  | "raleway"
  | "lato"
  | "open_sans"
  // Serif
  | "playfair"
  | "cinzel"
  | "lora"
  | "merriweather"
  | "cormorant"
  // Display & Headlines
  | "bebas"
  | "anton"
  | "righteous"
  | "syne"
  | "oswald"
  | "russo_one"
  // Monospace & Code
  | "jetbrains"
  | "fira_code"
  | "space_mono"
  // Cursive & Manuscrit
  | "caveat"
  | "pacifico"
  | "dancing_script"
  | "great_vibes"
  // Futuriste & Cyber
  | "orbitron"
  | "audiowide"
  | "chakra_petch";

export type FontWeightType = "normal" | "bold" | "900" | "italic";

export type TextTransformType = "uppercase" | "none" | "lowercase";

export function formatFrameText(text: string, transform: TextTransformType = "uppercase"): string {
  if (!text) return "";
  if (transform === "uppercase") return text.toUpperCase();
  if (transform === "lowercase") return text.toLowerCase();
  return text;
}

export function getFontFamilyCss(fontFamily: FontFamilyType | string = "inter"): string {
  switch (fontFamily) {
    case "roboto":
      return "'Roboto', sans-serif";
    case "montserrat":
      return "'Montserrat', sans-serif";
    case "poppins":
      return "'Poppins', sans-serif";
    case "plus_jakarta":
      return "'Plus Jakarta Sans', sans-serif";
    case "outfit":
      return "'Outfit', sans-serif";
    case "raleway":
      return "'Raleway', sans-serif";
    case "lato":
      return "'Lato', sans-serif";
    case "open_sans":
      return "'Open Sans', sans-serif";
    case "playfair":
      return "'Playfair Display', Georgia, serif";
    case "cinzel":
      return "'Cinzel', Georgia, serif";
    case "lora":
      return "'Lora', Georgia, serif";
    case "merriweather":
      return "'Merriweather', Georgia, serif";
    case "cormorant":
      return "'Cormorant Garamond', Georgia, serif";
    case "bebas":
      return "'Bebas Neue', Impact, sans-serif";
    case "anton":
      return "'Anton', Impact, sans-serif";
    case "righteous":
      return "'Righteous', sans-serif";
    case "syne":
      return "'Syne', sans-serif";
    case "oswald":
      return "'Oswald', sans-serif";
    case "russo_one":
      return "'Russo One', sans-serif";
    case "jetbrains":
      return "'JetBrains Mono', monospace";
    case "fira_code":
      return "'Fira Code', monospace";
    case "space_mono":
      return "'Space Mono', monospace";
    case "caveat":
      return "'Caveat', cursive";
    case "pacifico":
      return "'Pacifico', cursive";
    case "dancing_script":
      return "'Dancing Script', cursive";
    case "great_vibes":
      return "'Great Vibes', cursive";
    case "orbitron":
      return "'Orbitron', sans-serif";
    case "audiowide":
      return "'Audiowide', cursive, sans-serif";
    case "chakra_petch":
      return "'Chakra Petch', sans-serif";
    case "inter":
    default:
      return "'Inter', -apple-system, sans-serif";
  }
}

export function getCanvasFont(
  baseSize: number = 12,
  fontFamily: FontFamilyType | string = "inter",
  fontWeight: FontWeightType = "bold",
  sizeOffset: number = 0
): string {
  const finalSize = Math.max(7, Math.min(28, baseSize + sizeOffset));
  const fontCss = getFontFamilyCss(fontFamily);
  if (fontWeight === "italic") {
    return `italic bold ${finalSize}px ${fontCss}`;
  }
  if (fontWeight === "900") {
    return `900 ${finalSize}px ${fontCss}`;
  }
  if (fontWeight === "normal") {
    return `500 ${finalSize}px ${fontCss}`;
  }
  return `bold ${finalSize}px ${fontCss}`;
}

export type LogoType =
  | "none"
  | "custom"
  | "text"
  | "ql"
  | "gmail"
  | "facebook"
  | "instagram"
  | "twitter"
  | "whatsapp"
  | "whatsapp_call"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "spotify"
  | "telegram"
  | "discord"
  | "snapchat"
  | "github"
  | "paypal"
  | "apple"
  | "google"
  | "stripe"
  | "shopify"
  | "amazon"
  | "visa"
  | "mastercard"
  | "twitch"
  | "reddit"
  | "threads"
  | "slack"
  | "notion"
  | "airbnb"
  | "uber"
  | "nextjs"
  | "react"
  | "vue"
  | "angular"
  | "svelte"
  | "tanstack"
  | "prisma"
  | "mongodb"
  | "postgres"
  | "supabase"
  | "tailwind"
  | "nodejs"
  | "typescript"
  | "python"
  | "docker"
  | "cloudflare"
  | "vercel"
  | "openai"
  | "anthropic"
  | "gemini"
  | "midjourney"
  | "huggingface"
  | "mistral"
  | "deepseek"
  // Sports Brands
  | "nike"
  | "adidas"
  | "puma"
  | "jordan"
  | "nba"
  | "formula1"
  | "football_ball"
  | "gym_fitness"
  | "tennis_ball"
  | "redbull"
  // Tech Frameworks, Dev & Cloud
  | "rust"
  | "golang"
  | "cplusplus"
  | "java"
  | "git"
  | "gitlab"
  | "kubernetes"
  | "linux"
  | "redis"
  | "graphql"
  | "figma"
  | "linear"
  | "aws"
  | "vite"
  | "bun"
  | "astro"
  | "nestjs"
  | "fastapi"
  | "django"
  | "laravel"
  | "flutter"
  | "postman"
  | "clerk"
  | "neon_db"
  | "resend"
  // Marketing, Ads & Growth
  | "hubspot"
  | "mailchimp"
  | "meta_ads"
  | "google_ads"
  | "salesforce"
  | "semrush"
  | "ahrefs"
  | "klaviyo"
  | "zapier"
  | "make"
  | "webflow"
  | "wordpress"
  | "google_analytics"
  // WiFi & Communication Hotspots
  | "wifi_classic"
  | "wifi_free"
  | "wifi_secure"
  | "wifi_5g"
  // Phone & Calls
  | "phone_call"
  | "phone_support"
  | "phone_sos"
  // Badges
  | "cart"
  | "crypto_btc"
  | "wifi_icon"
  | "shield_icon"
  | "star_icon";

// ─── 1. DRAW PIXEL PATTERNS ──────────────────────────────────────────────────
export function drawPixelModule(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cellSize: number,
  style: PixelStyleType,
  fillStyle: string | CanvasGradient
) {
  ctx.fillStyle = fillStyle;
  const half = cellSize / 2;
  const cx = x + half;
  const cy = y + half;

  switch (style) {
    case "square":
      ctx.fillRect(x, y, cellSize, cellSize);
      break;

    case "rounded":
      ctx.beginPath();
      ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, cellSize * 0.35);
      ctx.fill();
      break;

    case "dots":
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize * 0.44, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "diamond":
      ctx.beginPath();
      ctx.moveTo(cx, y);
      ctx.lineTo(x + cellSize, cy);
      ctx.lineTo(cx, y + cellSize);
      ctx.lineTo(x, cy);
      ctx.closePath();
      ctx.fill();
      break;

    case "classy":
      ctx.beginPath();
      ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, [
        cellSize * 0.5,
        0,
        cellSize * 0.5,
        0,
      ]);
      ctx.fill();
      break;

    case "stars":
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize * 0.32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(x + cellSize * 0.35, y, cellSize * 0.3, cellSize);
      ctx.fillRect(x, y + cellSize * 0.35, cellSize, cellSize * 0.3);
      break;

    case "lines":
      ctx.beginPath();
      ctx.roundRect(x + 0.5, y + cellSize * 0.15, cellSize - 1, cellSize * 0.7, cellSize * 0.35);
      ctx.fill();
      break;

    case "vertical_bars":
      ctx.beginPath();
      ctx.roundRect(x + cellSize * 0.15, y + 0.5, cellSize * 0.7, cellSize - 1, cellSize * 0.35);
      ctx.fill();
      break;

    case "cross": {
      const arm = cellSize * 0.28;
      ctx.fillRect(cx - arm / 2, y, arm, cellSize);
      ctx.fillRect(x, cy - arm / 2, cellSize, arm);
      break;
    }

    case "hexagon_dots": {
      const r = cellSize * 0.48;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = (i * Math.PI) / 3 - Math.PI / 6;
        const hx = cx + r * Math.cos(a);
        const hy = cy + r * Math.sin(a);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "heart": {
      const s = cellSize * 0.8;
      ctx.save();
      ctx.translate(cx, cy - s * 0.1);
      ctx.beginPath();
      ctx.moveTo(0, s * 0.35);
      ctx.bezierCurveTo(-s * 0.5, -s * 0.2, -s * 0.5, -s * 0.5, 0, -s * 0.25);
      ctx.bezierCurveTo(s * 0.5, -s * 0.5, s * 0.5, -s * 0.2, 0, s * 0.35);
      ctx.fill();
      ctx.restore();
      break;
    }

    case "cyber_tiles":
      ctx.beginPath();
      const cut = cellSize * 0.3;
      ctx.moveTo(x + cut, y);
      ctx.lineTo(x + cellSize, y);
      ctx.lineTo(x + cellSize, y + cellSize - cut);
      ctx.lineTo(x + cellSize - cut, y + cellSize);
      ctx.lineTo(x, y + cellSize);
      ctx.lineTo(x, y + cut);
      ctx.closePath();
      ctx.fill();
      break;

    case "sparkle": {
      ctx.beginPath();
      const outerR = cellSize * 0.48;
      const innerR = cellSize * 0.15;
      for (let i = 0; i < 8; i++) {
        const a = (i * Math.PI) / 4;
        const radius = i % 2 === 0 ? outerR : innerR;
        const sx = cx + radius * Math.cos(a);
        const sy = cy + radius * Math.sin(a);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "pill":
      ctx.beginPath();
      ctx.roundRect(x + 1, y + 1, cellSize - 2, cellSize - 2, cellSize * 0.45);
      ctx.fill();
      break;

    case "fluid":
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize * 0.42, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, cy, cellSize * 0.25, 0, Math.PI * 2);
      ctx.fill();
      break;

    default:
      ctx.fillRect(x, y, cellSize, cellSize);
      break;
  }
}

// ─── 2. DRAW FINDER EYES (ANGLES / COINS) ────────────────────────────────────
export function drawFinderEye(
  ctx: CanvasRenderingContext2D,
  originR: number,
  originC: number,
  cellSize: number,
  startX: number,
  startY: number,
  eyeStyle: EyeStyleType,
  eyeFill: string
) {
  const eyeX = startX + originC * cellSize;
  const eyeY = startY + originR * cellSize;
  const eyeSize = 7 * cellSize;
  const centerEyeX = eyeX + eyeSize / 2;
  const centerEyeY = eyeY + eyeSize / 2;

  ctx.fillStyle = eyeFill;
  ctx.strokeStyle = eyeFill;

  switch (eyeStyle) {
    case "square":
      ctx.lineWidth = cellSize;
      ctx.strokeRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize);
      ctx.fillRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize);
      break;

    case "rounded":
      ctx.lineWidth = cellSize;
      ctx.beginPath();
      ctx.roundRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize, cellSize * 1.6);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize, cellSize * 0.9);
      ctx.fill();
      break;

    case "circle":
      ctx.lineWidth = cellSize;
      ctx.beginPath();
      ctx.arc(centerEyeX, centerEyeY, (eyeSize - cellSize) / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerEyeX, centerEyeY, 1.5 * cellSize, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "leaf":
      ctx.lineWidth = cellSize;
      ctx.beginPath();
      ctx.roundRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize, [
        cellSize * 2.8,
        0,
        cellSize * 2.8,
        0,
      ]);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize, [
        cellSize * 1.6,
        0,
        cellSize * 1.6,
        0,
      ]);
      ctx.fill();
      break;

    case "hexagon": {
      const hexRadius = (eyeSize - cellSize) / 2;
      ctx.lineWidth = cellSize;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const hx = centerEyeX + hexRadius * Math.cos(angle);
        const hy = centerEyeY + hexRadius * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.stroke();

      const innerHexRadius = 1.6 * cellSize;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 - Math.PI / 6;
        const hx = centerEyeX + innerHexRadius * Math.cos(angle);
        const hy = centerEyeY + innerHexRadius * Math.sin(angle);
        if (i === 0) ctx.moveTo(hx, hy);
        else ctx.lineTo(hx, hy);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "star": {
      ctx.lineWidth = cellSize * 0.9;
      ctx.beginPath();
      const outerR = (eyeSize - cellSize) / 2;
      const innerR = outerR * 0.65;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? outerR : innerR;
        const sx = centerEyeX + r * Math.cos(angle);
        const sy = centerEyeY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.stroke();

      ctx.beginPath();
      const starCoreOuter = 1.7 * cellSize;
      const starCoreInner = 0.7 * cellSize;
      for (let i = 0; i < 8; i++) {
        const angle = (i * Math.PI) / 4;
        const r = i % 2 === 0 ? starCoreOuter : starCoreInner;
        const sx = centerEyeX + r * Math.cos(angle);
        const sy = centerEyeY + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(sx, sy);
        else ctx.lineTo(sx, sy);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "cyber":
      ctx.lineWidth = cellSize;
      ctx.beginPath();
      ctx.roundRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize, [
        0,
        cellSize * 2.2,
        0,
        cellSize * 2.2,
      ]);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize, [
        0,
        cellSize * 1.2,
        0,
        cellSize * 1.2,
      ]);
      ctx.fill();
      break;

    case "diamond_eye": {
      const halfSize = (eyeSize - cellSize) / 2;
      ctx.lineWidth = cellSize;
      ctx.beginPath();
      ctx.moveTo(centerEyeX, centerEyeY - halfSize);
      ctx.lineTo(centerEyeX + halfSize, centerEyeY);
      ctx.lineTo(centerEyeX, centerEyeY + halfSize);
      ctx.lineTo(centerEyeX - halfSize, centerEyeY);
      ctx.closePath();
      ctx.stroke();

      const innerHalf = 1.6 * cellSize;
      ctx.beginPath();
      ctx.moveTo(centerEyeX, centerEyeY - innerHalf);
      ctx.lineTo(centerEyeX + innerHalf, centerEyeY);
      ctx.lineTo(centerEyeX, centerEyeY + innerHalf);
      ctx.lineTo(centerEyeX - innerHalf, centerEyeY);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "shield": {
      const w = eyeSize - cellSize;
      const h = eyeSize - cellSize;
      const topX = eyeX + cellSize / 2;
      const topY = eyeY + cellSize / 2;
      ctx.lineWidth = cellSize;
      ctx.beginPath();
      ctx.moveTo(topX, topY);
      ctx.lineTo(topX + w, topY);
      ctx.lineTo(topX + w, topY + h * 0.6);
      ctx.quadraticCurveTo(topX + w * 0.5, topY + h * 1.1, centerEyeX, topY + h);
      ctx.quadraticCurveTo(topX, topY + h * 0.6, topX, topY + h * 0.6);
      ctx.closePath();
      ctx.stroke();

      const iw = 2.8 * cellSize;
      const ih = 2.8 * cellSize;
      const ix = centerEyeX - iw / 2;
      const iy = centerEyeY - ih / 2;
      ctx.beginPath();
      ctx.moveTo(ix, iy);
      ctx.lineTo(ix + iw, iy);
      ctx.lineTo(ix + iw, iy + ih * 0.6);
      ctx.quadraticCurveTo(centerEyeX, iy + ih * 1.1, centerEyeX, iy + ih);
      ctx.quadraticCurveTo(ix, iy + ih * 0.6, ix, iy + ih * 0.6);
      ctx.closePath();
      ctx.fill();
      break;
    }

    case "target":
      ctx.lineWidth = cellSize * 0.8;
      ctx.beginPath();
      ctx.arc(centerEyeX, centerEyeY, (eyeSize - cellSize) / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerEyeX, centerEyeY, 2.2 * cellSize, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerEyeX, centerEyeY, 1.2 * cellSize, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "petal":
      ctx.lineWidth = cellSize;
      ctx.beginPath();
      ctx.roundRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize, [
        cellSize * 2.5,
        cellSize * 0.8,
        cellSize * 2.5,
        cellSize * 0.8,
      ]);
      ctx.stroke();
      ctx.beginPath();
      ctx.roundRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize, [
        cellSize * 1.5,
        cellSize * 0.4,
        cellSize * 1.5,
        cellSize * 0.4,
      ]);
      ctx.fill();
      break;

    case "double_circle":
      ctx.lineWidth = cellSize * 0.7;
      ctx.beginPath();
      ctx.arc(centerEyeX, centerEyeY, (eyeSize - cellSize) / 2, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerEyeX, centerEyeY, (eyeSize - cellSize) / 2 - cellSize * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerEyeX, centerEyeY, 1.3 * cellSize, 0, Math.PI * 2);
      ctx.fill();
      break;

    case "bracket": {
      const len = 2.2 * cellSize;
      const t = cellSize * 1.1;
      ctx.lineWidth = t;
      // Top-Left corner
      ctx.beginPath();
      ctx.moveTo(eyeX + len, eyeY + t / 2);
      ctx.lineTo(eyeX + t / 2, eyeY + t / 2);
      ctx.lineTo(eyeX + t / 2, eyeY + len);
      ctx.stroke();
      // Top-Right corner
      ctx.beginPath();
      ctx.moveTo(eyeX + eyeSize - len, eyeY + t / 2);
      ctx.lineTo(eyeX + eyeSize - t / 2, eyeY + t / 2);
      ctx.lineTo(eyeX + eyeSize - t / 2, eyeY + len);
      ctx.stroke();
      // Bottom-Left corner
      ctx.beginPath();
      ctx.moveTo(eyeX + t / 2, eyeY + eyeSize - len);
      ctx.lineTo(eyeX + t / 2, eyeY + eyeSize - t / 2);
      ctx.lineTo(eyeX + len, eyeY + eyeSize - t / 2);
      ctx.stroke();
      // Bottom-Right corner
      ctx.beginPath();
      ctx.moveTo(eyeX + eyeSize - len, eyeY + eyeSize - t / 2);
      ctx.lineTo(eyeX + eyeSize - t / 2, eyeY + eyeSize - t / 2);
      ctx.lineTo(eyeX + eyeSize - t / 2, eyeY + eyeSize - len);
      ctx.stroke();
      // Center box
      ctx.fillRect(eyeX + 2.2 * cellSize, eyeY + 2.2 * cellSize, 2.6 * cellSize, 2.6 * cellSize);
      break;
    }

    case "heart_eye": {
      const s = eyeSize * 0.44;
      ctx.save();
      ctx.translate(centerEyeX, centerEyeY - s * 0.15);
      ctx.lineWidth = cellSize * 0.9;
      ctx.beginPath();
      ctx.moveTo(0, s * 0.9);
      ctx.bezierCurveTo(-s * 1.3, -s * 0.3, -s * 1.2, -s * 1.2, 0, -s * 0.5);
      ctx.bezierCurveTo(s * 1.2, -s * 1.2, s * 1.3, -s * 0.3, 0, s * 0.9);
      ctx.stroke();

      const innerS = s * 0.5;
      ctx.beginPath();
      ctx.moveTo(0, innerS * 0.9);
      ctx.bezierCurveTo(-innerS * 1.3, -innerS * 0.3, -innerS * 1.2, -innerS * 1.2, 0, -innerS * 0.5);
      ctx.bezierCurveTo(innerS * 1.2, -innerS * 1.2, innerS * 1.3, -innerS * 0.3, 0, innerS * 0.9);
      ctx.fill();
      ctx.restore();
      break;
    }

    case "gear": {
      ctx.lineWidth = cellSize * 0.8;
      ctx.beginPath();
      const numTeeth = 10;
      const outR = (eyeSize - cellSize) / 2;
      const inR = outR * 0.8;
      for (let i = 0; i < numTeeth * 2; i++) {
        const a = (i * Math.PI) / numTeeth;
        const rad = i % 2 === 0 ? outR : inR;
        const gx = centerEyeX + rad * Math.cos(a);
        const gy = centerEyeY + rad * Math.sin(a);
        if (i === 0) ctx.moveTo(gx, gy);
        else ctx.lineTo(gx, gy);
      }
      ctx.closePath();
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(centerEyeX, centerEyeY, 1.4 * cellSize, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    default:
      ctx.lineWidth = cellSize;
      ctx.strokeRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize);
      ctx.fillRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize);
      break;
  }
}

// Helper to create Path2D safely across browser and test environments
function createPath(d: string): any {
  if (typeof Path2D !== "undefined") {
    return new Path2D(d);
  }
  return d;
}

// ─── 3. DRAW AUTHENTIC BRAND LOGOS (VECTOR PATHS) ───────────────────────────
export function drawCenterLogo(
  ctx: CanvasRenderingContext2D,
  centerBoxX: number,
  centerBoxY: number,
  centerBoxSize: number,
  selectedLogo: LogoType | string,
  uploadedLogo: string | null,
  centerText: string,
  pixelColor: string,
  bgColor: string,
  fontFamily: FontFamilyType | string = "inter",
  fontSize: number = 13,
  fontWeight: FontWeightType = "bold",
  textTransform: TextTransformType = "uppercase"
) {
  if (selectedLogo === "none") return;

  // Background badge container
  ctx.save();
  ctx.fillStyle = bgColor === "transparent" ? "#ffffff" : bgColor;
  ctx.shadowColor = "rgba(0,0,0,0.18)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.roundRect(centerBoxX, centerBoxY, centerBoxSize, centerBoxSize, 8);
  ctx.fill();
  ctx.restore();

  const iconPadding = centerBoxSize * 0.18;
  const iconSize = centerBoxSize - iconPadding * 2;
  const ix = centerBoxX + iconPadding;
  const iy = centerBoxY + iconPadding;

  // Render authentic brand logos using exact vector Path2D
  if (selectedLogo === "custom" && uploadedLogo) {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.src = uploadedLogo;
    img.onload = () => {
      ctx.drawImage(
        img,
        centerBoxX + 4,
        centerBoxY + 4,
        centerBoxSize - 8,
        centerBoxSize - 8
      );
    };
  } else if (selectedLogo === "text") {
    ctx.fillStyle = pixelColor;
    ctx.font = getCanvasFont(fontSize, fontFamily, fontWeight);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(formatFrameText(centerText, textTransform), centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "ql") {
    // Official LShorter Badge
    const grad = ctx.createLinearGradient(centerBoxX, centerBoxY, centerBoxX + centerBoxSize, centerBoxY + centerBoxSize);
    grad.addColorStop(0, "#ff6600");
    grad.addColorStop(1, "#ff3300");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 16px 'Bebas Neue', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LS", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2 + 1);
  } else if (selectedLogo === "facebook") {
    // Authentic Facebook
    ctx.fillStyle = "#1877F2";
    ctx.beginPath();
    ctx.arc(centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2, iconSize / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(ix + iconSize * 0.05, iy + iconSize * 0.05);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const fbPath = createPath("M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z");
    ctx.fill(fbPath);
    ctx.restore();
  } else if (selectedLogo === "instagram") {
    // Authentic Instagram Gradient & Camera
    const grad = ctx.createLinearGradient(centerBoxX, centerBoxY + centerBoxSize, centerBoxX + centerBoxSize, centerBoxY);
    grad.addColorStop(0, "#FCAF45");
    grad.addColorStop(0.35, "#F77737");
    grad.addColorStop(0.7, "#FD1D1D");
    grad.addColorStop(1, "#833AB4");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const igPath = createPath("M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z");
    ctx.fill(igPath);
    ctx.restore();
  } else if (selectedLogo === "twitter") {
    // Authentic X / Twitter
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const xPath = createPath("M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z");
    ctx.fill(xPath);
    ctx.restore();
  } else if (selectedLogo === "whatsapp") {
    // Authentic WhatsApp
    ctx.fillStyle = "#25D366";
    ctx.beginPath();
    ctx.arc(centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2, iconSize / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const waPath = createPath("M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.225-.652.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.151-.175.201-.301.301-.501.101-.2.05-.376-.025-.527-.075-.15-.677-1.633-.928-2.235-.244-.587-.492-.507-.677-.517-.175-.009-.376-.01-.577-.01-.2 0-.527.075-.802.376s-1.054 1.03-1.054 2.511c0 1.48 1.079 2.91 1.229 3.11.15.2 2.124 3.243 5.147 4.549.719.31 1.28.496 1.718.635.722.23 1.379.197 1.898.12.578-.087 1.78-.728 2.031-1.431.251-.703.251-1.305.176-1.431-.076-.126-.276-.201-.577-.351zm-5.467 7.618c-2.02 0-4-.543-5.733-1.572l-.411-.244-4.261 1.117 1.137-4.153-.267-.425c-1.13-1.8-1.727-3.896-1.727-6.043 0-6.25 5.086-11.336 11.337-11.336 3.029 0 5.877 1.18 8.019 3.323 2.143 2.143 3.323 4.991 3.323 8.02 0 6.251-5.086 11.338-11.337 11.338z");
    ctx.fill(waPath);
    ctx.restore();
  } else if (selectedLogo === "tiktok") {
    // Authentic TikTok 3D Note
    ctx.fillStyle = "#010101";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const ttPath = createPath("M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.064-.093a2.895 2.895 0 0 1 2.37-4.547c.307 0 .604.05.882.143V9.37a6.34 6.34 0 0 0-.882-.062 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.718a8.214 8.214 0 0 0 4.77 1.522V6.795a4.78 4.78 0 0 1-1.001-.109z");
    ctx.fill(ttPath);
    ctx.restore();
  } else if (selectedLogo === "youtube") {
    // Authentic YouTube
    ctx.fillStyle = "#FF0000";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const ytPath = createPath("M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z");
    ctx.fill(ytPath);
    ctx.restore();
  } else if (selectedLogo === "linkedin") {
    // Authentic LinkedIn
    ctx.fillStyle = "#0A66C2";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const inPath = createPath("M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.79v-7.6H6.46M7.86 6.3a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z");
    ctx.fill(inPath);
    ctx.restore();
  } else if (selectedLogo === "spotify") {
    // Authentic Spotify
    ctx.fillStyle = "#1DB954";
    ctx.beginPath();
    ctx.arc(centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2, iconSize / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const spPath = createPath("M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.5 17.3c-.2.4-.7.5-1.1.3-3-1.8-6.8-2.2-11.3-1.2-.5.1-.9-.2-1-.7-.1-.5.2-.9.7-1 4.9-1.1 9.1-.6 12.4 1.4.4.3.5.8.3 1.2zm1.5-3.3c-.3.4-.9.6-1.3.3-3.4-2.1-8.7-2.7-12.7-1.5-.5.1-1-.2-1.2-.7-.1-.5.2-1 .7-1.2 4.7-1.4 10.5-.8 14.3 1.6.4.3.5.9.2 1.5zm.1-3.4c-4.1-2.4-10.9-2.7-14.8-1.5-.6.2-1.3-.2-1.5-.8-.2-.6.2-1.3.8-1.5 4.6-1.4 12.1-1.1 16.8 1.7.5.3.7 1.1.4 1.6-.3.6-1.1.8-1.7.5z");
    ctx.fill(spPath);
    ctx.restore();
  } else if (selectedLogo === "telegram") {
    // Authentic Telegram
    ctx.fillStyle = "#24A1DE";
    ctx.beginPath();
    ctx.arc(centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2, iconSize / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const tgPath = createPath("M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.939z");
    ctx.fill(tgPath);
    ctx.restore();
  } else if (selectedLogo === "discord") {
    // Authentic Discord
    ctx.fillStyle = "#5865F2";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const dcPath = createPath("M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z");
    ctx.fill(dcPath);
    ctx.restore();
  } else if (selectedLogo === "snapchat") {
    // Authentic Snapchat
    ctx.fillStyle = "#FFFC00";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#000000";
    const scPath = createPath("M12.206.5c-4.455 0-7.393 3.195-7.393 6.945 0 1.488.58 2.871 1.042 3.632.147.241.188.423.077.625-.13.235-.494.618-1.227.915-.55.223-.92.428-1.107.614-.242.242-.258.54-.055.856.402.628 1.498 1.012 3.26 1.144.17.013.29.135.25.293-.16.634-.45 1.547-1.92 2.012-.41.13-.58.38-.49.7.13.46.73.68 1.77.68.85 0 1.63-.12 2.37-.36.21-.07.36.03.44.22.37.91 1.41 1.52 3.01 1.52 1.59 0 2.62-.61 3-1.52.08-.19.23-.29.44-.22.74.24 1.52.36 2.37.36 1.04 0 1.64-.22 1.77-.68.09-.32-.08-.57-.49-.7-1.47-.465-1.76-1.378-1.92-2.012-.04-.158.08-.28.25-.293 1.762-.132 2.858-.516 3.26-1.144.203-.316.187-.614-.055-.856-.187-.186-.557-.391-1.107-.614-.733-.297-1.097-.68-1.227-.915-.111-.202-.07-.384.077-.625.462-.761 1.042-2.144 1.042-3.632C19.599 3.695 16.661.5 12.206.5z");
    ctx.fill(scPath);
    ctx.restore();
  } else if (selectedLogo === "github") {
    // Authentic GitHub
    ctx.fillStyle = "#24292e";
    ctx.beginPath();
    ctx.arc(centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2, iconSize / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const ghPath = createPath("M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z");
    ctx.fill(ghPath);
    ctx.restore();
  } else if (selectedLogo === "apple") {
    // Authentic Apple
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const apPath = createPath("M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.3c.63-.78 1.06-1.87.94-2.96-.91.04-2.02.61-2.67 1.39-.56.67-.99 1.77-.86 2.83 1.01.08 2.05-.51 2.59-1.26z");
    ctx.fill(apPath);
    ctx.restore();
  } else if (selectedLogo === "paypal") {
    // Authentic PayPal
    ctx.fillStyle = "#003087";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#0079C1";
    const ppPath = createPath("M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944 2.45A.802.802 0 0 1 5.736 1.8h6.417c2.138 0 3.733.483 4.743 1.436.96.906 1.378 2.238 1.243 3.96-.285 3.64-2.576 5.643-6.079 5.643H9.282a.802.802 0 0 0-.792.677l-.986 6.242a.641.641 0 0 1-.428.579zm11.517-13.71c-.085-.275-.195-.536-.33-.781-.925-1.688-2.868-2.336-5.783-2.336H8.258a.802.802 0 0 0-.792.677L5.59 17.502a.641.641 0 0 0 .633.74h3.693l.732-4.636a.802.802 0 0 1 .792-.677h2.181c2.946 0 5.253-1.196 5.92-4.524.28-1.397.16-2.58-.948-3.418z");
    ctx.fill(ppPath);
    ctx.restore();
  } else if (selectedLogo === "google") {
    // Authentic Google 4-Color 'G'
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2, iconSize / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    // Blue bar
    ctx.fillStyle = "#4285F4";
    ctx.fill(createPath("M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"));
    // Green bottom
    ctx.fillStyle = "#34A853";
    ctx.fill(createPath("M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.35 24 12 24z"));
    // Yellow left
    ctx.fillStyle = "#FBBC05";
    ctx.fill(createPath("M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"));
    // Red top
    ctx.fillStyle = "#EA4335";
    ctx.fill(createPath("M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"));
    ctx.restore();
  } else if (selectedLogo === "stripe") {
    // Authentic Stripe (Deep Violet #635BFF with white S)
    ctx.fillStyle = "#635BFF";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const stripePath = createPath(
      "M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697.5 12.441.5 6.45.5 2.246 3.655 2.246 8.784c0 6.64 8.718 5.706 8.718 8.643 0 .978-.857 1.401-2.075 1.401-2.227 0-5.111-1.077-6.974-2.05l-.902 5.568c1.686.88 4.793 1.654 7.95 1.654 6.22 0 10.638-3.04 10.638-8.318 0-6.843-8.8-5.748-8.8-8.884z"
    );
    ctx.fill(stripePath);
    ctx.restore();
  } else if (selectedLogo === "shopify") {
    // Authentic Shopify (Emerald #95BF47 Bag)
    ctx.fillStyle = "#95BF47";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const shopifyPath = createPath(
      "M19.78 6.06a.82.82 0 0 0-.74-.16l-2.01.56c-.14-.42-.34-.88-.62-1.32-.98-1.58-2.45-2.42-4.15-2.42-.09 0-.18 0-.27.01-1.33.1-2.61.94-3.59 2.38-.69 1.01-1.16 2.25-1.38 3.51l-2.73.76a.82.82 0 0 0-.58.74c-.03.53-1.63 13.32-1.63 13.32a.5.5 0 0 0 .17.46.5.5 0 0 0 .46.19h16.16a.5.5 0 0 0 .46-.19.5.5 0 0 0 .17-.46L20.5 6.89a.82.82 0 0 0-.72-.83zm-7.67-1.55c1.17 0 2.19.67 2.87 1.83.48.8.73 1.76.81 2.77l-6.33 1.76c.32-2.09 1.35-4.22 2.65-6.36zm-1.5 6.8l3.63-1 2.16 11.46H7.83l2.78-10.46z"
    );
    ctx.fill(shopifyPath);
    ctx.restore();
  } else if (selectedLogo === "amazon") {
    // Authentic Amazon Dark Badge with Smile
    ctx.fillStyle = "#232F3E";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const aPath = createPath("M13.9 12.3c0-1.2-.6-1.8-1.7-1.8-.9 0-1.6.5-2 1.3v-1.1H8.5V17h1.7v-2.8c.4.6 1.1 1 1.9 1 1.4 0 2.1-.9 2.1-2.2v-.7zm-1.7 1.3c-.6 0-1-.4-1-1.1 0-.6.4-1.1 1-1.1.5 0 1 .4 1 1.1 0 .7-.4 1.1-1 1.1z");
    ctx.fill(aPath);
    ctx.fillStyle = "#FF9900";
    const smilePath = createPath("M3.5 17.5c4.2 2.7 9.8 2.7 14 0 .3-.2.6.1.4.4-4.5 3.3-10.8 3.3-15.3 0-.3-.2 0-.6.4-.4zm14.6-1.6c.3.5.8 1.4 1.7 1.8.2.1.2.3 0 .4-.7.4-1.8.4-2.7-.2-.2-.2-.2-.4 0-.5.5-.3.9-.9 1-1.5z");
    ctx.fill(smilePath);
    ctx.restore();
  } else if (selectedLogo === "visa") {
    // Authentic Visa (Deep Blue #1A1F71 with Gold Accent)
    ctx.fillStyle = "#1A1F71";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VISA", 12, 12);
    ctx.fillStyle = "#F7B600";
    ctx.beginPath();
    ctx.moveTo(3, 7.5);
    ctx.lineTo(6.5, 7.5);
    ctx.lineTo(5.5, 11);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  } else if (selectedLogo === "mastercard") {
    // Authentic Mastercard Interlocking Circles
    ctx.fillStyle = "#0A0A0C";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    const mMidX = centerBoxX + centerBoxSize / 2;
    const mMidY = centerBoxY + centerBoxSize / 2;
    const mR = iconSize * 0.34;

    ctx.fillStyle = "#EB001B";
    ctx.beginPath();
    ctx.arc(mMidX - mR * 0.55, mMidY, mR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#F79E1B";
    ctx.beginPath();
    ctx.arc(mMidX + mR * 0.55, mMidY, mR, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#FF5F00";
    ctx.save();
    ctx.beginPath();
    ctx.arc(mMidX + mR * 0.55, mMidY, mR, 0, Math.PI * 2);
    if (typeof ctx.clip === "function") ctx.clip();
    ctx.beginPath();
    ctx.arc(mMidX - mR * 0.55, mMidY, mR, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (selectedLogo === "twitch") {
    // Authentic Twitch Purple #9146FF
    ctx.fillStyle = "#9146FF";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const twitchPath = createPath(
      "M2.15 0L.54 4.12v16.48h5.37V24l3.76-3.4h4.3l7.52-7.52V0H2.15zm17.2 11.82l-3.76 3.76H11.3l-3.23 3.23v-3.23H4.84V2.15h14.51v9.67zM14.51 5.37h-2.15v5.38h2.15V5.37zm-5.37 0H6.99v5.38h2.15V5.37z"
    );
    ctx.fill(twitchPath);
    ctx.restore();
  } else if (selectedLogo === "reddit") {
    // Authentic Reddit Orangered #FF4500
    ctx.fillStyle = "#FF4500";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const redditPath = createPath(
      "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.56 12 8 12.56 8 13.25c0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm5.5 0c-.69 0-1.25.56-1.25 1.25 0 .69.56 1.25 1.25 1.25.69 0 1.25-.56 1.25-1.25 0-.69-.56-1.25-1.25-1.25zm-5.46 3.69c-.1.1-.1.28 0 .38.79.79 2.05 1.03 2.71 1.03.66 0 1.92-.24 2.71-1.03.1-.1.1-.28 0-.38-.1-.1-.28-.1-.38 0-.68.68-1.78.89-2.33.89-.55 0-1.65-.21-2.33-.89a.27.27 0 0 0-.38 0z"
    );
    ctx.fill(redditPath);
    ctx.restore();
  } else if (selectedLogo === "threads") {
    // Authentic Threads Black Badge
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const threadsPath = createPath(
      "M12.186 24h-.007C5.463 23.975.006 18.506 0 11.783 0 5.087 5.488-.354 12.213-.354c6.643 0 11.787 5.228 11.787 11.961 0 1.15-.157 2.302-.468 3.424a1.218 1.218 0 0 1-1.173.892 1.217 1.217 0 0 1-1.196-1.233c.272-.98.41-1.99.41-3.003 0-5.385-4.062-9.525-9.36-9.525-5.397 0-9.777 4.391-9.777 9.789 0 5.422 4.356 9.814 9.757 9.839 2.744.012 5.343-1.097 7.14-3.045a1.218 1.218 0 0 1 1.776 1.666C18.669 22.84 15.513 24 12.186 24zm2.84-14.88c-.37-.217-.82-.338-1.32-.338-1.896 0-3.328 1.488-3.328 3.456 0 1.942 1.406 3.456 3.328 3.456.974 0 1.792-.44 2.292-1.232v.944c0 1.728-1.077 2.736-2.71 2.736-1.033 0-1.815-.466-2.146-1.272a1.22 1.22 0 0 1 .632-1.593 1.216 1.216 0 0 1 1.594.632c.074.18.29.397.66.397.712 0 1.23-.497 1.23-1.498v-4.526a1.217 1.217 0 0 1 1.217-1.217 1.217 1.217 0 0 1 1.217 1.217v.754c.642.714 1.56 1.135 2.58 1.135 2.14 0 3.73-1.688 3.73-3.978 0-2.316-1.616-4.07-3.95-4.07-2.02 0-3.6 1.282-4.02 3.003-.09.37-.18.74-.23 1.12zm-1.81 4.542c-.792 0-1.353-.61-1.353-1.464 0-.853.56-1.464 1.353-1.464.792 0 1.353.61 1.353 1.464 0 .854-.56 1.464-1.353 1.464z"
    );
    ctx.fill(threadsPath);
    ctx.restore();
  } else if (selectedLogo === "slack") {
    // Authentic Slack 4-Color Grid
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#36C5F0";
    ctx.fill(createPath("M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"));
    ctx.fillStyle = "#2EB67D";
    ctx.fill(createPath("M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"));
    ctx.fillStyle = "#ECB22E";
    ctx.fill(createPath("M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"));
    ctx.fillStyle = "#E01E5A";
    ctx.fill(createPath("M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"));
    ctx.restore();
  } else if (selectedLogo === "notion") {
    // Authentic Notion Black Cube
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#000000";
    const notionPath = createPath(
      "M4.459 4.208c.746.606 1.026.56 2.428.466l11.004-.793c.373 0 .42.233.28.513l-2.006 3.126h-2.146l1.26 2.053-9.563.652c-.42.047-.7-.14-.7-.466 0-.14.047-.327.14-.467l1.026-1.586H4.272L2.593 18.58c-.14.653.187 1.026.933 1.073l13.715.793c1.027.047 1.587-.42 1.867-1.447l2.286-9.19c.14-.513-.093-.84-.606-.886L6.885 8.127l1.493-2.333-3.92.233z"
    );
    ctx.fill(notionPath);
    ctx.restore();
  } else if (selectedLogo === "airbnb") {
    // Authentic Airbnb Rausch Coral #FF5A5F
    ctx.fillStyle = "#FF5A5F";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const airbnbPath = createPath(
      "M12 0C7.58 0 4 3.58 4 8c0 4.2 4.48 9.39 7.42 12.39.32.33.84.33 1.16 0C15.52 17.39 20 12.2 20 8c0-4.42-3.58-8-8-8zm0 11.5c-1.93 0-3.5-1.57-3.5-3.5S10.07 4.5 12 4.5s3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"
    );
    ctx.fill(airbnbPath);
    ctx.restore();
  } else if (selectedLogo === "uber") {
    // Authentic Uber Sleek Black & White
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Uber", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "nextjs") {
    // Authentic Next.js (Black Badge with stylized N)
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const nextPath = createPath(
      "M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.82 17.585L10.75 8.167v-.002h-.833v7.668H8.5V6.167h1.417l7.583 10.083c-.55.45-1.11.89-1.68 1.335zM14.5 6.167h1.417v5.5H14.5v-5.5z"
    );
    ctx.fill(nextPath);
    ctx.restore();
  } else if (selectedLogo === "react") {
    // Authentic React Cyan Atom
    ctx.fillStyle = "#20232A";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    const rMidX = centerBoxX + centerBoxSize / 2;
    const rMidY = centerBoxY + centerBoxSize / 2;
    ctx.strokeStyle = "#61DAFB";
    ctx.lineWidth = 1.3;

    // 3 rotated orbital ellipses
    for (let a = 0; a < 3; a++) {
      ctx.save();
      ctx.translate(rMidX, rMidY);
      ctx.rotate((a * Math.PI) / 3);
      ctx.beginPath();
      ctx.ellipse(0, 0, iconSize * 0.44, iconSize * 0.17, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
    // Nucleus
    ctx.fillStyle = "#61DAFB";
    ctx.beginPath();
    ctx.arc(rMidX, rMidY, iconSize * 0.1, 0, Math.PI * 2);
    ctx.fill();
  } else if (selectedLogo === "vue") {
    // Authentic Vue.js Green & Navy 'V'
    ctx.fillStyle = "#1E1E24";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    // Outer green V
    ctx.fillStyle = "#42B883";
    ctx.fill(createPath("M2 3h4l6 10.5L18 3h4L12 21 2 3z"));
    // Inner navy V
    ctx.fillStyle = "#35495E";
    ctx.fill(createPath("M6.5 3h3.5l2 3.5 2-3.5h3.5L12 12.5 6.5 3z"));
    ctx.restore();
  } else if (selectedLogo === "angular") {
    // Authentic Angular Red Shield
    ctx.fillStyle = "#DD0031";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const angularPath = createPath(
      "M12 2.5L2.5 5.8l1.4 12.3L12 22.5l8.1-4.4 1.4-12.3L12 2.5zm0 3.3l4.3 9.6h-1.8l-.9-2.2H10.4l-.9 2.2H7.7L12 5.8zm1.1 5.8L12 8.9l-1.1 2.7h2.2z"
    );
    ctx.fill(angularPath);
    ctx.restore();
  } else if (selectedLogo === "svelte") {
    // Authentic Svelte Orange Flame
    ctx.fillStyle = "#FF3E00";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const sveltePath = createPath(
      "M20.6 8.3c-.6-1.5-1.7-2.6-3.2-3.3-1.6-.7-3.4-.8-5.3-.2l-4.1 1.4c-1.3.4-2.4 1.2-3.1 2.2-.7 1-.9 2.2-.7 3.3.2 1.3 1 2.4 2.1 3.2l.9.6-1.6 1.1c-1.4 1-2.3 2.5-2.5 4.2-.2 1.7.4 3.4 1.6 4.6 1.4 1.4 3.4 2.1 5.4 1.9 1.8-.2 3.5-1.1 4.7-2.5l4-4.8c1.1-1.3 1.6-2.9 1.5-4.5-.1-1.6-.9-3.1-2.2-4.1l-1.5-1.1 3-2zm-3.8 6.4l-4 4.8c-.8.9-1.9 1.5-3.1 1.6-1.3.1-2.6-.4-3.5-1.3-.8-.8-1.2-1.9-1.1-3 .1-1.1.7-2.1 1.6-2.7l3.6-2.5 3.3 2.2c1.4 1 2.4 1.1 3.2.9zm-4.3-5.8l-3.3-2.2c-.8-.5-1.3-1.2-1.4-2-.1-.7.1-1.4.5-2 .5-.7 1.2-1.2 2.1-1.5l4.1-1.4c1.2-.4 2.4-.3 3.4.1.9.4 1.7 1.2 2.1 2.1.4.9.4 2 0 3l-3.6 2.5-3.9-1.6z"
    );
    ctx.fill(sveltePath);
    ctx.restore();
  } else if (selectedLogo === "tanstack") {
    // Authentic TanStack Hexagonal Gradient
    const tsGrad = ctx.createLinearGradient(centerBoxX, centerBoxY, centerBoxX + centerBoxSize, centerBoxY + centerBoxSize);
    tsGrad.addColorStop(0, "#FF4154");
    tsGrad.addColorStop(1, "#FF8D3B");
    ctx.fillStyle = tsGrad;
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const tanstackPath = createPath(
      "M12 2L2 7.5v9L12 22l10-5.5v-9L12 2zm0 3.2l6.8 3.7L12 12.6 5.2 8.9 12 5.2zM4.5 10.7l6.5 3.6v7.3l-6.5-3.6v-7.3zm15 7.3l-6.5 3.6v-7.3l6.5-3.6v7.3z"
    );
    ctx.fill(tanstackPath);
    ctx.restore();
  } else if (selectedLogo === "prisma") {
    // Authentic Prisma Crystal Pyramid
    ctx.fillStyle = "#0C344B";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    // Base Teal
    ctx.fillStyle = "#2DD4BF";
    ctx.fill(createPath("M13.75 3.5L3.75 18.25a1.5 1.5 0 0 0 1.3 2.25h13.9a1.5 1.5 0 0 0 1.3-2.25L13.75 3.5z"));
    // Shaded Indigo Facet
    ctx.fillStyle = "#5A67D8";
    ctx.fill(createPath("M13.75 3.5L12 20.5h6.95a1.5 1.5 0 0 0 1.3-2.25L13.75 3.5z"));
    ctx.restore();
  } else if (selectedLogo === "mongodb") {
    // Authentic MongoDB Green Leaf
    ctx.fillStyle = "#001E2B";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#00ED64";
    const mongoPath = createPath(
      "M12 1.5c-4.5 7.5-3.8 12.2 0 21 3.8-8.8 4.5-13.5 0-21zm-.5 19.8c-2.8-5.8-3.2-9.8 0-16.5v16.5zm1 0V4.8c3.2 6.7 2.8 10.7 0 16.5z"
    );
    ctx.fill(mongoPath);
    ctx.restore();
  } else if (selectedLogo === "postgres") {
    // Authentic PostgreSQL Slonik Navy Badge
    ctx.fillStyle = "#336791";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const pgPath = createPath(
      "M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.5 13.5c-.8.8-2 .9-3 .5l-.5 2h-2l.8-3.2c-.6-.4-1.1-.9-1.5-1.5-.7-1.1-.9-2.5-.5-3.8.4-1.3 1.5-2.2 2.8-2.5 1.5-.3 3 .2 4 1.3 1.1 1.2 1.4 2.9.8 4.4-.3.9-.9 1.7-1.7 2.3z"
    );
    ctx.fill(pgPath);
    ctx.restore();
  } else if (selectedLogo === "supabase") {
    // Authentic Supabase Emerald Lightning
    ctx.fillStyle = "#1C1C1C";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#3ECF8E";
    const supaPath = createPath(
      "M13.2 1.5L3 13.8a.6.6 0 0 0 .5.9h7.3L9.5 22.5l11.5-12.3a.6.6 0 0 0-.5-.9H12.8l1.6-7.8a.6.6 0 0 0-1.2 0z"
    );
    ctx.fill(supaPath);
    ctx.restore();
  } else if (selectedLogo === "tailwind") {
    // Authentic Tailwind CSS Cyan Wave
    ctx.fillStyle = "#0F172A";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#38BDF8";
    const twPath = createPath(
      "M12.001 4.8c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C13.666 10.618 15.027 12 18.001 12c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C16.335 6.182 14.974 4.8 12.001 4.8zm-6 7.2c-3.2 0-5.2 1.6-6 4.8 1.2-1.6 2.6-2.2 4.2-1.8.913.228 1.565.89 2.288 1.624C7.666 17.818 9.027 19.2 12.001 19.2c3.2 0 5.2-1.6 6-4.8-1.2 1.6-2.6 2.2-4.2 1.8-.913-.228-1.565-.89-2.288-1.624C10.335 13.382 8.974 12 6.001 12z"
    );
    ctx.fill(twPath);
    ctx.restore();
  } else if (selectedLogo === "nodejs") {
    // Authentic Node.js Green Hexagon
    ctx.fillStyle = "#222222";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#5FA04E";
    const nodePath = createPath(
      "M12 2.5L3 7.7v10.4l9 5.2 9-5.2V7.7L12 2.5zm5.5 13.8c-.8.8-2 1.2-3.5 1.2h-2.5v-7h2.5c1.5 0 2.7.4 3.5 1.2.8.8 1.2 1.9 1.2 3.3s-.4 2.5-1.2 3.3z"
    );
    ctx.fill(nodePath);
    ctx.restore();
  } else if (selectedLogo === "typescript") {
    // Authentic TypeScript Deep Blue Square
    ctx.fillStyle = "#3178C6";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 11px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("TS", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "python") {
    // Authentic Python Dual Interlocking Snakes
    ctx.fillStyle = "#1E293B";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    // Blue snake (Top)
    ctx.fillStyle = "#3776AB";
    ctx.fill(createPath("M11.9 1.5c-3.1 0-2.9 1.3-2.9 1.3l.01 1.4h2.9v.4H6.2s-1.8.2-1.8 2.6 1.6 2.6 1.6 2.6h1v-1.2c0-1.4 1.2-1.4 1.2-1.4h3.1c1.2 0 1.2-.9 1.2-.9v-3.4c0-1.4-1.2-1.4-1.2-1.4zm-1.6 1c.3 0 .6.2.6.5s-.3.6-.6.6-.6-.3-.6-.6.3-.5.6-.5z"));
    // Yellow snake (Bottom)
    ctx.fillStyle = "#FFD438";
    ctx.fill(createPath("M12.1 22.5c3.1 0 2.9-1.3 2.9-1.3l-.01-1.4h-2.9v-.4h5.7s1.8-.2 1.8-2.6-1.6-2.6-1.6-2.6h-1v1.2c0 1.4-1.2 1.4-1.2 1.4H12.7c-1.2 0-1.2.9-1.2.9v3.4c0 1.4 1.2 1.4 1.2 1.4zm1.6-1c-.3 0-.6-.2-.6-.5s.3-.6.6-.6.6.3.6.6-.3.5-.6.5z"));
    ctx.restore();
  } else if (selectedLogo === "docker") {
    // Authentic Docker Marine Blue Whale
    ctx.fillStyle = "#2496ED";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const dockerPath = createPath(
      "M13.9 12.5h-1.6v-1.6h1.6v1.6zm-2.1 0h-1.6v-1.6h1.6v1.6zm-2.1 0H8.1v-1.6h1.6v1.6zm4.2-2.1h-1.6V8.8h1.6v1.6zm-2.1 0h-1.6V8.8h1.6v1.6zm-2.1 0H8.1V8.8h1.6v1.6zm6.3 2.1h-1.6v-1.6h1.6v1.6zm-2.1-4.2h-1.6V6.7h1.6v1.6zm7.8 4.2c-.3-.2-1.3-.3-2.1.3-.2-.8-.7-1.5-1.5-1.9l-.6-.3-.4.5c-.3.4-.6 1.1-.4 1.9-1.2.1-2.3.5-3.3 1.2H2.5c-.4 1.2.1 3.2 1.8 4.8 2.2 2 5.5 2.2 8.5 2.1 3.9-.2 7.1-2.5 8.2-5.4.7-.2 1.8-.7 2.1-1.6l-.1-.4-.6-.2z"
    );
    ctx.fill(dockerPath);
    ctx.restore();
  } else if (selectedLogo === "cloudflare") {
    // Authentic Cloudflare Orange Cloud
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    // Orange Cloud
    ctx.fillStyle = "#F38020";
    ctx.fill(createPath("M18.4 11.2c-.4-2.5-2.5-4.4-5.1-4.4-1.8 0-3.3.9-4.2 2.3-.3-.1-.7-.1-1-.1-2.1 0-3.8 1.6-4.1 3.6-1.7.5-2.9 2-2.9 3.8 0 2.2 1.8 4 4 4h13.1c2.1 0 3.8-1.7 3.8-3.8 0-2.1-1.6-3.8-3.6-4.4z"));
    ctx.restore();
  } else if (selectedLogo === "vercel") {
    // Authentic Vercel Black Triangle
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    ctx.fill(createPath("M12 2L22 20H2L12 2z"));
    ctx.restore();
  } else if (selectedLogo === "openai") {
    // Authentic OpenAI / ChatGPT Emerald Spiral
    ctx.fillStyle = "#10A37F";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const openAiPath = createPath(
      "M22.28 9.82a6 6 0 0 0-.52-4.91 6.05 6.05 0 0 0-6.51-2.9A6.07 6.07 0 0 0 4.98 4.18a6 6 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 6 6 0 0 0 .52 4.91 6.05 6.05 0 0 0 6.52 2.9A6 6 0 0 0 13.26 24a6.06 6.06 0 0 0 5.77-4.2 6 6 0 0 0 4-2.9 6.06 6.06 0 0 0-.75-7.08zM13.26 22.4a4.47 4.47 0 0 1-2.88-1.04l.14-.08 4.78-2.76a.8.8 0 0 0 .4-.7v-6.74l2.02 1.17v5.67a4.5 4.5 0 0 1-4.46 4.48zm-8.8-3.8a4.46 4.46 0 0 1-.54-3.02l.14.08 4.78 2.76a.8.8 0 0 0 .8 0l5.84-3.37v2.33l-4.9 2.84a4.5 4.5 0 0 1-6.12-1.62zM3.4 8.7a4.47 4.47 0 0 1 2.34-1.97v5.7l-2.02 1.16V8.7zm14.1 3.73l-5.84 3.37-5.84-3.37 5.84-3.37 5.84 3.37zm1.1-1.92l-4.78-2.76a.8.8 0 0 0-.8 0L7.18 11.1V8.77l4.9-2.83a4.5 4.5 0 0 1 6.12 1.62 4.45 4.45 0 0 1 .54 3.02l-.2-.07zm2.4 4.8a4.47 4.47 0 0 1-2.34 1.96v-5.7l2.02-1.16v4.9z"
    );
    ctx.fill(openAiPath);
    ctx.restore();
  } else if (selectedLogo === "anthropic") {
    // Authentic Anthropic Claude Coral 'A'
    ctx.fillStyle = "#D97757";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const claudePath = createPath(
      "M13.8 3.5h-3.6L4.5 20.5h3.4l1.6-4.4h5l1.6 4.4h3.4L13.8 3.5zm-3.3 9.8L12 8.6l1.5 4.7h-3z"
    );
    ctx.fill(claudePath);
    ctx.restore();
  } else if (selectedLogo === "gemini") {
    // Authentic Google Gemini Radiant 4-Point Star
    ctx.fillStyle = "#1A1B2F";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    const gMidX = centerBoxX + centerBoxSize / 2;
    const gMidY = centerBoxY + centerBoxSize / 2;
    const gGrad = ctx.createLinearGradient(centerBoxX, centerBoxY, centerBoxX + centerBoxSize, centerBoxY + centerBoxSize);
    gGrad.addColorStop(0, "#4E80EE");
    gGrad.addColorStop(0.5, "#9B72CF");
    gGrad.addColorStop(1, "#E879F9");
    ctx.fillStyle = gGrad;

    const gR = iconSize * 0.48;
    ctx.beginPath();
    ctx.moveTo(gMidX, gMidY - gR);
    ctx.quadraticCurveTo(gMidX, gMidY, gMidX + gR, gMidY);
    ctx.quadraticCurveTo(gMidX, gMidY, gMidX, gMidY + gR);
    ctx.quadraticCurveTo(gMidX, gMidY, gMidX - gR, gMidY);
    ctx.quadraticCurveTo(gMidX, gMidY, gMidX, gMidY - gR);
    ctx.closePath();
    ctx.fill();
  } else if (selectedLogo === "midjourney") {
    // Authentic Midjourney Origami Sailboat
    ctx.fillStyle = "#0A0A0C";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const mjPath = createPath(
      "M12 2.5L20.5 15H13L12 2.5zm-1 3.5L4.5 15h6.5V6zM3.5 17l2.5 3.5h12l2.5-3.5H3.5z"
    );
    ctx.fill(mjPath);
    ctx.restore();
  } else if (selectedLogo === "huggingface") {
    // Authentic Hugging Face Emoji
    ctx.fillStyle = "#FFD21E";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    const hMidX = centerBoxX + centerBoxSize / 2;
    const hMidY = centerBoxY + centerBoxSize / 2;
    ctx.fillStyle = "#4A3200";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🤗", hMidX, hMidY);
  } else if (selectedLogo === "mistral") {
    // Authentic Mistral AI Stepped Sunset Chevrons
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#FF5200";
    ctx.fillRect(4, 5, 4, 4);
    ctx.fillRect(16, 5, 4, 4);
    ctx.fillStyle = "#FFA800";
    ctx.fillRect(4, 10, 8, 4);
    ctx.fillRect(12, 10, 8, 4);
    ctx.fillStyle = "#FFD400";
    ctx.fillRect(4, 15, 16, 4);
    ctx.restore();
  } else if (selectedLogo === "deepseek") {
    // Authentic DeepSeek Blue Leaping Dolphin
    ctx.fillStyle = "#0066FF";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const dsPath = createPath(
      "M19.5 7.5C18 5 15.5 3.5 12 3.5c-4.5 0-8 3.5-8.5 7.5-.3 2.5.5 5 2.5 6.5l-2 3c3.5-1 6-2 8-3.5 3.5.5 7-1.5 8.5-4.5 1-2 .5-4.5-1-5zm-9 4c-.8 0-1.5-.7-1.5-1.5s.7-1.5 1.5-1.5 1.5.7 1.5 1.5-.7 1.5-1.5 1.5z"
    );
    ctx.fill(dsPath);
    ctx.restore();
  } else if (selectedLogo === "crypto_btc") {
    // Authentic Bitcoin ₿
    ctx.fillStyle = "#F7931A";
    ctx.beginPath();
    ctx.arc(centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2, iconSize / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("₿", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "cart") {
    // E-Commerce Shopping Cart
    ctx.fillStyle = "#ff6600";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const cartPath = createPath("M7 18c-1.1 0-1.99.9-1.99 2S5.9 22 7 22s2-.9 2-2-.9-2-2-2zM1 2v2h2l3.6 7.59-1.35 2.45c-.16.28-.25.61-.25.96 0 1.1.9 2 2 2h12v-2H7.42c-.14 0-.25-.11-.25-.25l.03-.12.9-1.63h7.45c.75 0 1.41-.41 1.75-1.03l3.58-6.49c.08-.14.12-.31.12-.48 0-.55-.45-1-1-1H5.21l-.94-2H1zm16 16c-1.1 0-1.99.9-1.99 2s.89 2 1.99 2 2-.9 2-2-.9-2-2-2z");
    ctx.fill(cartPath);
    ctx.restore();
  } else if (selectedLogo === "wifi_icon") {
    // Hotspot WiFi
    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const wifiPath = createPath("M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4zm0 6c2.76 0 5.26 1.12 7.07 2.93L12 20.01l-7.07-7.08A9.94 9.94 0 0 1 12 10z");
    ctx.fill(wifiPath);
    ctx.restore();
  } else if (selectedLogo === "shield_icon") {
    // Security Shield
    ctx.fillStyle = "#10b981";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const shieldPath = createPath("M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z");
    ctx.fill(shieldPath);
    ctx.restore();
  } else if (selectedLogo === "star_icon") {
    // Luxury Star
    ctx.fillStyle = "#f59e0b";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const starPath = createPath("M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z");
    ctx.fill(starPath);
    ctx.restore();
  } else if (selectedLogo === "nike") {
    // Nike Swoosh
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const nikePath = createPath("M21.71 5.48c-.41-.2-.91-.1-1.22.25L7.33 19.34c-1.62 1.48-3.9 1.34-5.11.41-.77-.59-1.12-1.46-.99-2.38.25-1.55 1.76-3.23 4.02-4.38l.65-.32c-.39-.19-.78-.4-1.15-.65-2.61-1.04-4.22-2.73-3.83-4.74.45-2.29 3.05-3.77 6.4-3.77 3.09 0 6.37 1.25 9.38 3.14l4.58-1.84c.3-.12.65-.05.89.17.24.23.31.59.18.9l-.63 1.39z");
    ctx.fill(nikePath);
    ctx.restore();
  } else if (selectedLogo === "adidas") {
    // Adidas 3 Stripes
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const adPath = createPath("M22.95 18.96L16.2 7.27c-.24-.42-.77-.56-1.19-.32-.42.24-.56.77-.32 1.19l6.75 11.69c.24.42.77.56 1.19.32.42-.24.56-.77.32-1.19zM15.45 18.96L10.2 9.87c-.24-.42-.77-.56-1.19-.32-.42.24-.56.77-.32 1.19l5.25 9.09c.24.42.77.56 1.19.32.42-.24.56-.77.32-1.19zM7.95 18.96L4.2 12.47c-.24-.42-.77-.56-1.19-.32-.42.24-.56.77-.32 1.19l3.75 6.49c.24.42.77.56 1.19.32.42-.24.56-.77.32-1.19z");
    ctx.fill(adPath);
    ctx.restore();
  } else if (selectedLogo === "puma") {
    // Puma Wildcat
    ctx.fillStyle = "#18181b";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const pumaPath = createPath("M21.5 6.5c-.8.8-1.9 1.2-3 1.1-.6 1.4-1.7 2.5-3.1 3.1.2.9.1 1.9-.3 2.8l3.4 3.5c.4.4.4 1 0 1.4-.4.4-1 .4-1.4 0l-3.2-3.3c-1.3.6-2.8.7-4.2.2l-2.2 2.2c-.4.4-1 .4-1.4 0-.4-.4-.4-1 0-1.4l2-2c-.9-1.6-.9-3.5 0-5.1.8-1.5 2.3-2.6 4-2.9 1.1-.2 2.2.1 3.1.8.8-.5 1.8-.7 2.8-.4.5-.7 1.3-1.2 2.2-1.3 1.1-.1 2.2.4 2.8 1.3.2.3.1.8-.2 1-.3.2-.8.1-1-.2-.4-.6-1.1-.9-1.8-.8-.6.1-1.1.4-1.4.9-.1.3-.4.5-.7.5z");
    ctx.fill(pumaPath);
    ctx.restore();
  } else if (selectedLogo === "jordan") {
    // Jordan Jumpman
    ctx.fillStyle = "#E11D48";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const jPath = createPath("M12 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm-1.5 4.5l-3 4-4.5-1.5 1 2 3.5 1 2 4.5-1.5 5 1.5 1 2-5 2-2 3.5 1.5 1-1.5-3.5-2.5-1-4.5-1.5-1.5z");
    ctx.fill(jPath);
    ctx.restore();
  } else if (selectedLogo === "nba") {
    // NBA
    ctx.fillStyle = "#1D428A";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 6);
    ctx.fill();

    ctx.fillStyle = "#C8102E";
    ctx.fillRect(centerBoxX + 2, centerBoxY + 2, (centerBoxSize - 4) * 0.35, centerBoxSize - 4);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("NBA", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "formula1") {
    // Formula 1
    ctx.fillStyle = "#E10600";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 6);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 900 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("F1", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "football_ball") {
    // Soccer Ball
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2, iconSize / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#000000";
    const ballPath = createPath("M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 3.2l2.6 1.9-1 3.1h-3.2l-1-3.1zm-4.7 2.1l1.1 3.4-2.8 2-2.3-2.6a8 8 0 0 1 4-2.8zm9.4 0a8 8 0 0 1 4 2.8l-2.3 2.6-2.8-2zm-9.2 7.7l2.8 2.1-1.1 3.4a8 8 0 0 1-4-2.7zm9 0l2.3 2.8a8 8 0 0 1-4 2.7l-1.1-3.4zm-4.5-1.7l1.9 1.4-1.9 1.4-1.9-1.4z");
    ctx.fill(ballPath);
    ctx.restore();
  } else if (selectedLogo === "gym_fitness") {
    // Gym / Fitness
    ctx.fillStyle = "#ea580c";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const gymPath = createPath("M5 9v6h2V9H5zm12 0v6h2V9h-2zm-8 2v2h6v-2H9zM2 10v4h2v-4H2zm18 0v4h2v-4h-2z");
    ctx.fill(gymPath);
    ctx.restore();
  } else if (selectedLogo === "tennis_ball") {
    // Tennis Ball
    ctx.fillStyle = "#CCFF00";
    ctx.beginPath();
    ctx.arc(centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2, iconSize / 2 + 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#047857";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(centerBoxX + centerBoxSize / 2 - 4, centerBoxY + centerBoxSize / 2, iconSize / 2.5, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(centerBoxX + centerBoxSize / 2 + 4, centerBoxY + centerBoxSize / 2, iconSize / 2.5, Math.PI / 2, (3 * Math.PI) / 2);
    ctx.stroke();
  } else if (selectedLogo === "redbull") {
    // Red Bull
    ctx.fillStyle = "#001D4A";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#FDB913";
    ctx.beginPath();
    ctx.arc(centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2, iconSize / 2.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#ED1C24";
    ctx.font = "900 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RB", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "rust") {
    // Rust 🦀
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#CE412B";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🦀", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "golang") {
    // Golang
    ctx.fillStyle = "#00ACD7";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 900 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("GO", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "cplusplus") {
    // C++
    ctx.fillStyle = "#00599C";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("C++", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "java") {
    // Java
    ctx.fillStyle = "#5382A1";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#E76F00";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("☕", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "git") {
    // Git
    ctx.fillStyle = "#F05032";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const gitPath = createPath("M21.6 10.9L13.1 2.4c-.6-.6-1.5-.6-2.1 0L8.6 4.8l2.8 2.8c.6-.2 1.3-.1 1.8.4.5.5.6 1.2.4 1.8l2.7 2.7c.6-.2 1.3-.1 1.8.4.8.8.8 2 0 2.8s-2 .8-2.8 0c-.6-.6-.7-1.4-.4-2.1L12.4 10v4.7c.3.2.6.4.7.7.8.8.8 2 0 2.8s-2 .8-2.8 0c-.8-.8-.8-2 0-2.8.3-.3.6-.5 1-.6V9.8c-.4-.1-.7-.3-1-.6-.6-.6-.7-1.4-.4-2.1L7.2 4.4 2.4 9.2c-.6.6-.6 1.5 0 2.1l8.5 8.5c.6.6 1.5.6 2.1 0l8.6-8.5c.6-.5.6-1.4 0-2z");
    ctx.fill(gitPath);
    ctx.restore();
  } else if (selectedLogo === "gitlab") {
    // GitLab
    ctx.fillStyle = "#FC6D26";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const glPath = createPath("M23.95 13.59L21.41 5.8a.96.96 0 0 0-1.82 0l-2.02 6.22H6.43L4.41 5.8a.96.96 0 0 0-1.82 0L.05 13.59a1.92 1.92 0 0 0 .7 2.15L12 23.98l11.25-8.24a1.92 1.92 0 0 0 .7-2.15z");
    ctx.fill(glPath);
    ctx.restore();
  } else if (selectedLogo === "kubernetes") {
    // Kubernetes
    ctx.fillStyle = "#326CE5";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const k8sPath = createPath("M12 2L3.5 7v10L12 22l8.5-5V7L12 2zm0 2.3l6.5 3.8v7.6L12 19.5 5.5 15.7V8.1L12 4.3z");
    ctx.fill(k8sPath);
    ctx.restore();
  } else if (selectedLogo === "linux") {
    // Linux 🐧
    ctx.fillStyle = "#FCC624";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐧", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "redis") {
    // Redis
    ctx.fillStyle = "#DC382D";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("RDS", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "graphql") {
    // GraphQL
    ctx.fillStyle = "#E10098";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const gqlPath = createPath("M12 2l8.66 5v10L12 22l-8.66-5V7L12 2zm0 2.3L5.34 8.16v7.68L12 19.7l6.66-3.86V8.16L12 4.3z");
    ctx.fill(gqlPath);
    ctx.restore();
  } else if (selectedLogo === "figma") {
    // Figma
    ctx.fillStyle = "#1E1E1E";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    const fMidX = centerBoxX + centerBoxSize / 2;
    const fMidY = centerBoxY + centerBoxSize / 2;
    ctx.fillStyle = "#F24E1E";
    ctx.fillRect(fMidX - 6, fMidY - 7, 6, 4.5);
    ctx.fillStyle = "#FF7262";
    ctx.fillRect(fMidX, fMidY - 7, 6, 4.5);
    ctx.fillStyle = "#A259FF";
    ctx.fillRect(fMidX - 6, fMidY - 2.5, 6, 4.5);
    ctx.fillStyle = "#1ABCFE";
    ctx.fillRect(fMidX, fMidY - 2.5, 6, 4.5);
    ctx.fillStyle = "#0ACF83";
    ctx.fillRect(fMidX - 6, fMidY + 2, 6, 4.5);
  } else if (selectedLogo === "linear") {
    // Linear
    ctx.fillStyle = "#5E6AD2";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("▲", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "aws") {
    // AWS
    ctx.fillStyle = "#232F3E";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#FF9900";
    ctx.font = "bold 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AWS", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "vite") {
    // Vite ⚡
    const viteGrad = ctx.createLinearGradient(centerBoxX, centerBoxY, centerBoxX + centerBoxSize, centerBoxY + centerBoxSize);
    viteGrad.addColorStop(0, "#41D1FF");
    viteGrad.addColorStop(1, "#BD34FE");
    ctx.fillStyle = viteGrad;
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#FFD62E";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "bun") {
    // Bun 🥟
    ctx.fillStyle = "#FBF0DF";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🥟", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "hubspot") {
    // HubSpot
    ctx.fillStyle = "#FF7A59";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const hsPath = createPath("M18.8 7.2V4.5c.8-.4 1.3-1.2 1.3-2.1C20.1 1.1 19 0 17.6 0c-1.3 0-2.4 1.1-2.4 2.4 0 .9.5 1.7 1.3 2.1v2.7c-1.1.4-2.1 1.1-2.8 2L7.9 4.8c.1-.3.2-.6.2-.9C8.1 2.3 6.8 1 5.2 1S2.3 2.3 2.3 3.9c0 1.6 1.3 2.9 2.9 2.9.7 0 1.4-.3 1.9-.7l5.7 4.3c-.5 1-.8 2.1-.8 3.3 0 1.2.3 2.3.8 3.3l-5.7 4.3c-.5-.4-1.2-.7-1.9-.7-1.6 0-2.9 1.3-2.9 2.9 0 1.6 1.3 2.9 2.9 2.9s2.9-1.3 2.9-2.9c0-.3-.1-.6-.2-.9l5.8-4.4c.7.9 1.7 1.6 2.8 2v2.7c-.8.4-1.3 1.2-1.3 2.1 0 1.3 1.1 2.4 2.4 2.4s2.4-1.1 2.4-2.4c0-.9-.5-1.7-1.3-2.1v-2.7c1.7-.7 3-2.2 3.4-4h2.7c.4.8 1.2 1.3 2.1 1.3 1.3 0 2.4-1.1 2.4-2.4s-1.1-2.4-2.4-2.4c-.9 0-1.7.5-2.1 1.3h-2.7c-.4-1.8-1.7-3.3-3.4-4zm-1.2 9.5c-1.8 0-3.3-1.5-3.3-3.3s1.5-3.3 3.3-3.3 3.3 1.5 3.3 3.3-1.5 3.3-3.3 3.3z");
    ctx.fill(hsPath);
    ctx.restore();
  } else if (selectedLogo === "mailchimp") {
    // Mailchimp
    ctx.fillStyle = "#FFE01B";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐵", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "meta_ads") {
    // Meta Ads
    ctx.fillStyle = "#0668E1";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const metaPath = createPath("M12 4.333c-3.14 0-5.77 1.83-7.53 4.2C2.7 10.9 1.5 13.5 1.5 16c0 3.3 2.2 5.67 5.2 5.67 2.3 0 4.1-1.3 5.3-3.3 1.2 2 3 3.3 5.3 3.3 3 0 5.2-2.37 5.2-5.67 0-2.5-1.2-5.1-2.97-7.47-1.76-2.37-4.39-4.2-7.53-4.2zm0 3.3c2.4 0 4.4 1.4 5.8 3.3 1.4 1.9 2.2 4 2.2 5.07 0 1.8-1.1 3-2.7 3-1.8 0-3.2-1.2-4.3-3.5-.4-.8-.7-1.7-1-2.6-.3.9-.6 1.8-1 2.6-1.1 2.3-2.5 3.5-4.3 3.5-1.6 0-2.7-1.2-2.7-3 0-1.07.8-3.17 2.2-5.07 1.4-1.9 3.4-3.3 5.8-3.3z");
    ctx.fill(metaPath);
    ctx.restore();
  } else if (selectedLogo === "google_ads") {
    // Google Ads
    ctx.fillStyle = "#3C4043";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#F4B400";
    const gads1 = createPath("M3.5 18.5l7-12c.6-1 1.9-1.3 2.9-.7l2.5 1.5c1 .6 1.3 1.9.7 2.9l-7 12c-.6 1-1.9 1.3-2.9.7l-2.5-1.5c-1-.6-1.3-1.9-.7-2.9z");
    ctx.fill(gads1);
    ctx.fillStyle = "#4285F4";
    const gads2 = createPath("M19.5 18.5l-7-12c-.6-1-1.9-1.3-2.9-.7L7.1 7.3c-1 .6-1.3 1.9-.7 2.9l7 12c.6 1 1.9 1.3 2.9.7l2.5-1.5c1-.6 1.3-1.9.7-2.9z");
    ctx.fill(gads2);
    ctx.fillStyle = "#34A853";
    ctx.beginPath();
    ctx.arc(5, 18.5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (selectedLogo === "salesforce") {
    // Salesforce
    ctx.fillStyle = "#00A1E0";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    const sfPath = createPath("M19.4 9.1c-.4-2.5-2.5-4.4-5.1-4.4-1.8 0-3.3.9-4.2 2.3-.3-.1-.7-.1-1-.1-2.1 0-3.8 1.6-4.1 3.6-1.7.5-2.9 2-2.9 3.8 0 2.2 1.8 4 4 4h13.1c2.1 0 3.8-1.7 3.8-3.8 0-2.1-1.6-3.8-3.6-4.4z");
    ctx.fill(sfPath);
    ctx.restore();
  } else if (selectedLogo === "semrush") {
    // Semrush
    ctx.fillStyle = "#FF642D";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 9px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SEM", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "ahrefs") {
    // Ahrefs
    ctx.fillStyle = "#0052CC";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#FF642D";
    ctx.font = "900 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("AH", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "klaviyo") {
    // Klaviyo
    ctx.fillStyle = "#121212";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#24B47E";
    ctx.font = "900 14px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("K", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "zapier") {
    // Zapier
    ctx.fillStyle = "#FF4A00";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 16px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("_", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "make") {
    // Make
    ctx.fillStyle = "#635BFF";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("M", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "webflow") {
    // Webflow
    ctx.fillStyle = "#146EF5";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 900 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("W", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "wordpress") {
    // WordPress
    ctx.fillStyle = "#21759B";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "serif font-black 12px serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("W", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "google_analytics") {
    // Google Analytics
    ctx.fillStyle = "#F9AB00";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    const gaMidX = centerBoxX + centerBoxSize / 2;
    const gaMidY = centerBoxY + centerBoxSize / 2 + 5;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(gaMidX - 6, gaMidY - 4, 3, 4);
    ctx.fillRect(gaMidX - 1.5, gaMidY - 7, 3, 7);
    ctx.fillRect(gaMidX + 3, gaMidY - 10, 3, 10);
  } else if (selectedLogo === "astro") {
    // Astro
    ctx.fillStyle = "#BC52EE";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🚀", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "nestjs") {
    // NestJS
    ctx.fillStyle = "#E0234E";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("🐱", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "fastapi") {
    // FastAPI
    ctx.fillStyle = "#05998B";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("⚡", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "django") {
    // Django
    ctx.fillStyle = "#092E20";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#44B78B";
    ctx.font = "bold 11px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("dj", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "laravel") {
    // Laravel
    ctx.fillStyle = "#FF2D20";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("L", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "flutter") {
    // Flutter
    ctx.fillStyle = "#02569B";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#54C5F8";
    ctx.font = "900 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("F", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "postman") {
    // Postman
    ctx.fillStyle = "#FF6C37";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 13px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👨‍🚀", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "clerk") {
    // Clerk
    ctx.fillStyle = "#6C47FF";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("CL", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "neon_db") {
    // Neon Serverless Postgres
    ctx.fillStyle = "#00E599";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#000000";
    ctx.font = "900 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("N", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "resend") {
    // Resend
    ctx.fillStyle = "#000000";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 12px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("R", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
  } else if (selectedLogo === "gmail") {
    // Official Google Mail / Gmail 4-Color M Logo
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    // Left Blue leg
    ctx.fillStyle = "#4285F4";
    ctx.fill(createPath("M1.5 5.5v13a1.5 1.5 0 0 0 1.5 1.5h3.5v-10l-5-4.5z"));
    // Right Green leg
    ctx.fillStyle = "#34A853";
    ctx.fill(createPath("M22.5 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-3.5v-10l5-4.5z"));
    // Yellow Corner Accents
    ctx.fillStyle = "#FBBC05";
    ctx.fill(createPath("M17.5 10v-4.5l-5.5 4.5v10h3.5a1.5 1.5 0 0 0 1.5-1.5v-8.5z"));
    // Red Center V & Roof
    ctx.fillStyle = "#EA4335";
    ctx.fill(createPath("M6.5 5.5l5.5 4.5 5.5-4.5L12 1.5 6.5 5.5z"));
    ctx.restore();
  } else if (selectedLogo === "wifi_classic") {
    // Clean WiFi Beacon Waves
    ctx.fillStyle = "#0284c7";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    ctx.fill(createPath("M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4zm0 6c-2.93 0-5.61 1.15-7.6 3.04L12 21l7.6-7.96C17.61 11.15 14.93 10 12 10zm0 5c-1.38 0-2.63.56-3.54 1.46L12 21l3.54-4.54C14.63 15.56 13.38 15 12 15z"));
    ctx.restore();
  } else if (selectedLogo === "wifi_free") {
    // Free WiFi Zone Badge
    ctx.fillStyle = "#059669";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy - 2);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    ctx.fill(createPath("M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4zm0 6c-2.93 0-5.61 1.15-7.6 3.04L12 21l7.6-7.96C17.61 11.15 14.93 10 12 10z"));
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 8px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("FREE", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize - 6);
  } else if (selectedLogo === "wifi_secure") {
    // Secure Encrypted WiFi Badge
    ctx.fillStyle = "#4f46e5";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    ctx.fill(createPath("M12 3C7.5 3 3.4 4.8.4 7.7l2.2 2.2C4.8 7.7 8.2 6.2 12 6.2s7.2 1.5 9.4 3.7l2.2-2.2C20.6 4.8 16.5 3 12 3zM12 8c-2.8 0-5.3 1.1-7.2 2.9l2.2 2.2c1.3-1.3 3.1-2.1 5-2.1s3.7.8 5 2.1l2.2-2.2C17.3 9.1 14.8 8 12 8z"));
    ctx.fill(createPath("M14 13h-4c-.55 0-1 .45-1 1v4c0 .55.45 1 1 1h4c.55 0 1-.45 1-1v-4c0-.55-.45-1-1-1zm-1 0v-1.5a1 1 0 0 0-2 0V13h2z"));
    ctx.restore();
  } else if (selectedLogo === "wifi_5g") {
    // Ultra-Fast 5G WiFi Badge
    ctx.fillStyle = "#7c3aed";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy - 2);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    ctx.fill(createPath("M12 4C7.31 4 3.07 5.9 0 8.98L12 21 24 8.98A16.88 16.88 0 0 0 12 4zm0 6c-2.93 0-5.61 1.15-7.6 3.04L12 21l7.6-7.96C17.61 11.15 14.93 10 12 10z"));
    ctx.restore();

    ctx.fillStyle = "#facc15";
    ctx.font = "900 8.5px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("5G", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize - 6);
  } else if (selectedLogo === "phone_call") {
    // Direct Phone Call Receiver
    ctx.fillStyle = "#16a34a";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    ctx.fill(createPath("M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z"));
    ctx.restore();
  } else if (selectedLogo === "phone_support") {
    // Customer Support Headset / Hotline
    ctx.fillStyle = "#2563eb";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    ctx.fill(createPath("M12 1a9 9 0 0 0-9 9v7a3 3 0 0 0 3 3h1a1 1 0 0 0 1-1v-6a1 1 0 0 0-1-1H5v-3a7 7 0 1 1 14 0v3h-2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h1a3 3 0 0 0 3-3v-7a9 9 0 0 0-9-9z"));
    ctx.restore();
  } else if (selectedLogo === "phone_sos") {
    // SOS Emergency Hotline
    ctx.fillStyle = "#dc2626";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy - 2);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    ctx.fill(createPath("M6.62 10.79a15.053 15.053 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.02-.24c1.12.37 2.33.57 3.57.57a1 1 0 0 1 1 1V20a1 1 0 0 1-1 1A17 17 0 0 1 3 4a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.25.2 2.45.57 3.57a1 1 0 0 1-.25 1.02l-2.2 2.2z"));
    ctx.restore();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 8.5px sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("SOS", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize - 6);
  } else if (selectedLogo === "whatsapp_call") {
    // WhatsApp Audio Call
    ctx.fillStyle = "#25D366";
    ctx.beginPath();
    ctx.roundRect(centerBoxX + 2, centerBoxY + 2, centerBoxSize - 4, centerBoxSize - 4, 8);
    ctx.fill();

    ctx.save();
    ctx.translate(ix, iy);
    ctx.scale(iconSize / 24, iconSize / 24);
    ctx.fillStyle = "#ffffff";
    ctx.fill(createPath("M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.225-.652.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.151-.175.201-.301.301-.501.101-.2.05-.376-.025-.527-.075-.15-.677-1.633-.928-2.235-.244-.587-.492-.507-.677-.517-.175-.009-.376-.01-.577-.01-.2 0-.527.075-.802.376s-1.054 1.03-1.054 2.511c0 1.48 1.079 2.91 1.229 3.11.15.2 2.124 3.243 5.147 4.549.719.31 1.28.496 1.718.635.722.23 1.379.197 1.898.12.578-.087 1.78-.728 2.031-1.431.251-.703.251-1.305.176-1.431-.076-.126-.276-.201-.577-.351zm-5.467 7.618c-2.02 0-4-.543-5.733-1.572l-.411-.244-4.261 1.117 1.137-4.153-.267-.425c-1.13-1.8-1.727-3.896-1.727-6.043 0-6.25 5.086-11.336 11.337-11.336 3.029 0 5.877 1.18 8.019 3.323 2.143 2.143 3.323 4.991 3.323 8.02 0 6.251-5.086 11.338-11.337 11.338z"));
    ctx.restore();
  }
}

// ─── 4. DRAW PREMIUM FRAMES & CTA DECOR ──────────────────────────────────────
export function drawQRFrame(
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
  textTransform: TextTransformType = "uppercase"
) {
  const txt = formatFrameText(frameText, textTransform);
  const baseFont = getCanvasFont(fontSize, fontFamily, fontWeight);
  const fontSmall = getCanvasFont(Math.max(8, fontSize - 2), fontFamily, fontWeight);
  const fontLarge = getCanvasFont(fontSize + 2, fontFamily, fontWeight);
  const fontCursive = getCanvasFont(fontSize + 2, fontFamily === "inter" ? "caveat" : fontFamily, fontWeight === "bold" ? "italic" : fontWeight);
  const fontMono = getCanvasFont(fontSize, fontFamily === "inter" ? "jetbrains" : fontFamily, fontWeight);

  switch (frame) {
    case "simple":
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 16);
      ctx.stroke();
      break;

    case "neon":
      ctx.save();
      ctx.shadowColor = frameColor;
      ctx.shadowBlur = 14;
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(10, 10, totalWidth - 20, totalHeight - 20, 18);
      ctx.stroke();

      // Glowing Neon Pill CTA
      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.15, totalHeight - 48, totalWidth * 0.7, 34, 12);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⚡ ${txt} ⚡`, totalWidth / 2, totalHeight - 31);
      ctx.restore();
      break;

    case "bottom_pill":
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.12, totalHeight - 48, totalWidth * 0.76, 36, 12);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, totalWidth / 2, totalHeight - 30);
      break;

    case "top_header":
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.12, 14, totalWidth * 0.76, 34, 10);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, totalWidth / 2, 31);
      break;

    case "hand_arrow":
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      ctx.fillStyle = frameColor;
      ctx.font = fontCursive;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⤹ ${formatFrameText(frameText, textTransform === "uppercase" ? "none" : textTransform)} ⤸`, totalWidth / 2, totalHeight - 26);
      break;

    case "modern_badge":
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(6, 6, totalWidth - 12, totalHeight - 12, 20);
      ctx.stroke();

      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.14, totalHeight - 48, totalWidth * 0.72, 34, 17);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`★ ${txt} ★`, totalWidth / 2, totalHeight - 31);
      break;

    case "phone":
      // Smartphone Mockup Frame
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 30);
      ctx.stroke();

      // Top Dynamic Island
      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.34, 14, totalWidth * 0.32, 14, 7);
      ctx.fill();

      // Bottom Subtitle CTA
      ctx.font = fontSmall;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, totalWidth / 2, totalHeight - 34);

      // Bottom Home Bar
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.34, totalHeight - 18, totalWidth * 0.32, 4, 2);
      ctx.fill();
      break;

    case "tag_ticket": {
      // Promo Coupon Ticket Frame
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 14);
      ctx.stroke();

      // Header Tag
      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, 14, totalWidth * 0.8, 28, 8);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🎟️ ${txt}`, totalWidth / 2, 28);

      // Perforated Dotted Line at bottom
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(16, totalHeight - 42);
      ctx.lineTo(totalWidth - 16, totalHeight - 42);
      ctx.stroke();
      ctx.restore();

      ctx.fillStyle = frameColor;
      ctx.font = fontSmall;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("VALABLE IMMÉDIATEMENT", totalWidth / 2, totalHeight - 24);
      break;
    }

    case "polaroid":
      // Vintage Polaroid Frame
      ctx.strokeStyle = "#d4d4d8";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(6, 6, totalWidth - 12, totalHeight - 12, 10);
      ctx.stroke();

      ctx.fillStyle = "#18181b";
      ctx.font = fontCursive;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(formatFrameText(frameText, textTransform === "uppercase" ? "none" : textTransform), totalWidth / 2, totalHeight - 34);
      break;

    case "luxury_gold": {
      // Luxury Gold Beveled Double Frame
      const grad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      grad.addColorStop(0, "#f59e0b");
      grad.addColorStop(0.5, "#fbbf24");
      grad.addColorStop(1, "#d97706");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, totalWidth - 16, totalHeight - 16);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(14, 14, totalWidth - 28, totalHeight - 28);

      // Bottom gold ribbon text
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.12, totalHeight - 46, totalWidth * 0.76, 30, 6);
      ctx.fill();

      ctx.fillStyle = "#000000";
      ctx.font = getCanvasFont(fontSize, fontFamily === "inter" ? "cinzel" : fontFamily, fontWeight);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`PRESTIGE • ${txt} • PRESTIGE`, totalWidth / 2, totalHeight - 31);
      break;
    }

    case "circular_badge":
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 22);
      ctx.stroke();

      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 18);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🛡️ VÉRIFIÉ • ${txt}`, totalWidth / 2, totalHeight - 32);
      break;

    case "chat_bubble": {
      // Speech / Chat Message Bubble
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 24, 20);
      ctx.stroke();

      // Tail of speech bubble (bottom left)
      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.moveTo(36, totalHeight - 24);
      ctx.lineTo(24, totalHeight - 8);
      ctx.lineTo(52, totalHeight - 24);
      ctx.closePath();
      ctx.fill();

      // CTA Pill inside bubble
      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.14, totalHeight - 58, totalWidth * 0.72, 30, 15);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`💬 ${txt}`, totalWidth / 2, totalHeight - 43);
      break;
    }

    case "gradient_border": {
      // Dynamic Multicolor Sunset / Cyber Glow Border
      const grad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      grad.addColorStop(0, "#ff007a");
      grad.addColorStop(0.5, "#ff6600");
      grad.addColorStop(1, "#7928ca");

      ctx.strokeStyle = grad;
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Bottom Gradient Badge
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.12, totalHeight - 48, totalWidth * 0.76, 34, 14);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`✨ ${txt} ✨`, totalWidth / 2, totalHeight - 31);
      break;
    }

    // ─── 20 ANIMATED ULTRA-PREMIUM FRAMES ────────────────────────────────────

    case "anim_christmas": {
      ctx.save();
      // 1. Festive Deep Crimson Border with Gold Trim
      ctx.strokeStyle = "#991b1b";
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(13, 13, totalWidth - 26, totalHeight - 26, 16);
      ctx.stroke();

      // 2. Animated Garland with Hanging Glowing Bulbs
      const lightCount = 18;
      const bulbColors = ["#ef4444", "#fbbf24", "#22c55e", "#38bdf8", "#ec4899"];
      const w = totalWidth - 24;
      const h = totalHeight - 24;
      const perim = 2 * (w + h);

      for (let i = 0; i < lightCount; i++) {
        const rawFrac = (i / lightCount + timeSec * 0.08) % 1;
        const frac = rawFrac < 0 ? rawFrac + 1 : rawFrac;
        const dist = frac * perim;
        let lx = 0, ly = 0;
        if (dist < w) { lx = 12 + dist; ly = 12; }
        else if (dist < w + h) { lx = totalWidth - 12; ly = 12 + (dist - w); }
        else if (dist < 2 * w + h) { lx = totalWidth - 12 - (dist - (w + h)); ly = totalHeight - 12; }
        else { lx = 12; ly = totalHeight - 12 - (dist - (2 * w + h)); }

        const pulse = Math.max(0, 0.5 + 0.5 * Math.sin(timeSec * 5 + i * 1.5));
        const col = bulbColors[i % bulbColors.length];
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = 8 * pulse;
        ctx.beginPath();
        ctx.arc(lx, ly, Math.max(0.5, 3 + 1.5 * pulse), 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Falling Gentle Snowflake Crystals
      ctx.shadowBlur = 0;
      for (let i = 0; i < 20; i++) {
        const seed = i * 97.3;
        const speed = 25 + (i % 4) * 10;
        const rawSy = (seed + timeSec * speed) % (totalHeight - 20);
        const sy = (rawSy < 0 ? rawSy + totalHeight - 20 : rawSy) + 10;
        const rawSx = (seed * 2.3 + Math.sin(timeSec * 1.5 + i) * 14) % (totalWidth - 24);
        const sx = (rawSx < 0 ? rawSx + totalWidth - 24 : rawSx) + 12;
        const size = Math.max(0.5, 1.5 + (i % 3) * 0.8);
        const alpha = 0.4 + 0.6 * Math.sin((sy / totalHeight) * Math.PI);
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Festive Gold Ribbon CTA
      const goldGrad = ctx.createLinearGradient(0, totalHeight - 50, totalWidth, totalHeight - 14);
      goldGrad.addColorStop(0, "#b45309");
      goldGrad.addColorStop(0.5, "#f59e0b");
      goldGrad.addColorStop(1, "#b45309");

      ctx.fillStyle = "#7f1d1d";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 12);
      ctx.fill();

      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fef08a";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🎄 ${txt} 🎁`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_halloween": {
      ctx.save();
      // 1. Gothic Obsidian & Spooky Pumpkin Rim
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#9333ea";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // 2. Animated Silhouette Bats Flying in Arc
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#1e1b4b";
      for (let b = 0; b < 4; b++) {
        const rawBx = (b * 65 + timeSec * 40) % (totalWidth - 28);
        const bx = (rawBx < 0 ? rawBx + totalWidth - 28 : rawBx) + 14;
        const by = 16 + Math.sin(timeSec * 2.5 + b * 2) * 6;
        const wingFlap = Math.sin(timeSec * 10 + b);
        ctx.beginPath();
        ctx.ellipse(bx, by, 5, 2.5, 0, 0, Math.PI * 2);
        ctx.fill();
        // Left & Right Wings
        ctx.beginPath();
        ctx.moveTo(bx - 2, by);
        ctx.lineTo(bx - 10, by - 5 * wingFlap);
        ctx.lineTo(bx - 3, by + 2);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(bx + 2, by);
        ctx.lineTo(bx + 10, by - 5 * wingFlap);
        ctx.lineTo(bx + 3, by + 2);
        ctx.fill();
      }

      // 3. Ethereal Violet Mist Wisps
      for (let g = 0; g < 8; g++) {
        const rawGx = (g * 42 + Math.cos(timeSec + g) * 12) % (totalWidth - 24);
        const gx = (rawGx < 0 ? rawGx + totalWidth - 24 : rawGx) + 12;
        const rawGyMod = (timeSec * 28 + g * 22) % (totalHeight * 0.4);
        const gyMod = rawGyMod < 0 ? rawGyMod + totalHeight * 0.4 : rawGyMod;
        const gy = totalHeight - 55 - gyMod;
        const alpha = Math.sin((gy / (totalHeight * 0.5)) * Math.PI) * 0.35;
        ctx.fillStyle = `rgba(168, 85, 247, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.beginPath();
        ctx.arc(gx, gy, Math.max(1, 4 + (g % 3)), 0, Math.PI * 2);
        ctx.fill();
      }

      // 4. Spooky CTA
      ctx.fillStyle = "#270a38";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 12);
      ctx.fill();

      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 2;
      ctx.stroke();

      const glowPulse = 0.8 + 0.2 * Math.sin(timeSec * 6);
      ctx.fillStyle = `rgba(251, 146, 60, ${glowPulse})`;
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🎃 ${txt} 🦇`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_sport": {
      ctx.save();
      // 1. High-Tech Carbon / Stadium Track Border
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 22);
      ctx.stroke();

      const accentCol = frameColor || "#0284c7";
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = 2;
      ctx.stroke();

      // 2. High-Speed Orbiting Laser Comet Beam
      const w = totalWidth - 16;
      const h = totalHeight - 16;
      const perim = 2 * (w + h);
      const rawT = (timeSec * 0.75) % 1;
      const tNorm = rawT < 0 ? rawT + 1 : rawT;
      const beamDist = tNorm * perim;
      let bx = 0, by = 0;
      if (beamDist < w) { bx = 8 + beamDist; by = 8; }
      else if (beamDist < w + h) { bx = totalWidth - 8; by = 8 + (beamDist - w); }
      else if (beamDist < 2 * w + h) { bx = totalWidth - 8 - (beamDist - (w + h)); by = totalHeight - 8; }
      else { bx = 8; by = totalHeight - 8 - (beamDist - (2 * w + h)); }

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#38bdf8";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.stroke();

      // 3. Corner HUD Energy Brackets
      const corners = [[16, 16], [totalWidth - 16, 16], [16, totalHeight - 16], [totalWidth - 16, totalHeight - 16]];
      corners.forEach(([cx, cy], idx) => {
        const pulse = Math.max(0, 0.5 + 0.5 * Math.sin(timeSec * 8 + idx * 1.5));
        ctx.strokeStyle = "#38bdf8";
        ctx.lineWidth = 2 + pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(1, 7 + pulse * 3), 0, Math.PI * 2);
        ctx.stroke();
      });

      // 4. Sport Impact CTA
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 18);
      ctx.fill();

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⚡ ${txt} ⚡`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_manga": {
      ctx.save();
      // 1. Japanese Manga Ink Frame
      ctx.strokeStyle = "#18181b";
      ctx.lineWidth = 4;
      ctx.strokeRect(8, 8, totalWidth - 16, totalHeight - 16);

      // 2. Screentone Speed Bursts in Corners
      ctx.strokeStyle = "rgba(236, 72, 153, 0.4)";
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 5; i++) {
        const offset = Math.sin(timeSec * 6 + i) * 5;
        ctx.beginPath();
        ctx.moveTo(8, 18 + i * 8 + offset);
        ctx.lineTo(26 + offset, 18 + i * 8);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(totalWidth - 8, 18 + i * 8 + offset);
        ctx.lineTo(totalWidth - 26 - offset, 18 + i * 8);
        ctx.stroke();
      }

      // 3. Floating Translucent Sakura Cherry Blossom Petals
      for (let p = 0; p < 16; p++) {
        const seed = p * 83.1;
        const rawPy = (seed + timeSec * 40) % (totalHeight - 16);
        const py = (rawPy < 0 ? rawPy + totalHeight - 16 : rawPy) + 8;
        const rawPx = (seed * 2.3 + Math.sin(timeSec * 2 + p) * 20) % (totalWidth - 24);
        const px = (rawPx < 0 ? rawPx + totalWidth - 24 : rawPx) + 12;
        const rot = timeSec * 1.8 + p;
        const scale = Math.max(0.1, 0.8 + (p % 3) * 0.3);

        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(rot);
        ctx.scale(scale, scale);
        ctx.fillStyle = "#f472b6";
        ctx.shadowColor = "#fbcfe8";
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.ellipse(0, 0, 6.5, 3.2, Math.PI / 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 4. Manga Action CTA
      ctx.fillStyle = "#be185d";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 8);
      ctx.fill();

      ctx.strokeStyle = "#fbcfe8";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🌸 ${txt} 🌸`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_rain": {
      ctx.save();
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // Falling Rain Streaks
      ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
      ctx.lineWidth = 1.5;
      for (let r = 0; r < 32; r++) {
        const seed = r * 47.9;
        const rawRy = (seed + timeSec * 260) % (totalHeight - 20);
        const ry = (rawRy < 0 ? rawRy + totalHeight - 20 : rawRy) + 8;
        const rawRx = (seed * 1.8 - (ry * 0.25)) % (totalWidth - 20);
        const rx = rawRx < 0 ? rawRx + totalWidth - 20 : rawRx;
        const finalRx = rx < 10 ? rx + totalWidth - 20 : rx;
        ctx.beginPath();
        ctx.moveTo(finalRx, ry);
        ctx.lineTo(finalRx - 3, ry + 11);
        ctx.stroke();
      }

      // Concentric Water Ripples at Bottom (Fixed with non-negative radius)
      for (let i = 0; i < 3; i++) {
        const rawPhase = (timeSec * 1.1 + i * 0.33) % 1;
        const phase = rawPhase < 0 ? rawPhase + 1 : rawPhase;
        const rX = 25 + i * (totalWidth / 3.5);
        const rY = totalHeight - 16;
        const eRadiusX = Math.max(0.1, phase * 16);
        const eRadiusY = Math.max(0.1, phase * 5);
        ctx.strokeStyle = `rgba(186, 230, 253, ${Math.max(0, 1 - phase)})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(rX, rY, eRadiusX, eRadiusY, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Frosted Rain CTA
      ctx.fillStyle = "#0c4a6e";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 12);
      ctx.fill();

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#e0f2fe";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🌧️ ${txt} 💧`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_snow": {
      ctx.save();
      ctx.strokeStyle = "#67e8f9";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#a5f3fc";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Multi-layer Snow Particles
      ctx.shadowBlur = 0;
      for (let s = 0; s < 36; s++) {
        const seed = s * 61.3;
        const speed = 25 + (s % 5) * 10;
        const rawSy = (seed + timeSec * speed) % (totalHeight - 16);
        const sy = (rawSy < 0 ? rawSy + totalHeight - 16 : rawSy) + 8;
        const rawSx = (seed * 2.7 + Math.cos(timeSec * 1.6 + s) * 16) % (totalWidth - 24);
        const sx = (rawSx < 0 ? rawSx + totalWidth - 24 : rawSx) + 12;
        const size = Math.max(0.5, 1.2 + (s % 4) * 0.8);
        const alpha = 0.4 + 0.6 * Math.sin((sy / totalHeight) * Math.PI);
        ctx.fillStyle = `rgba(240, 253, 250, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.beginPath();
        ctx.arc(sx, sy, size, 0, Math.PI * 2);
        ctx.fill();
      }

      // 4-Point Sparkle Ice Crystals at Corners
      const sparkleCorners = [[18, 18], [totalWidth - 18, 18], [18, totalHeight - 18], [totalWidth - 18, totalHeight - 18]];
      sparkleCorners.forEach(([cx, cy], i) => {
        const pulse = Math.max(0, 0.5 + 0.5 * Math.sin(timeSec * 5 + i * 2));
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(cx - 6 * pulse, cy);
        ctx.lineTo(cx + 6 * pulse, cy);
        ctx.moveTo(cx, cy - 6 * pulse);
        ctx.lineTo(cx, cy + 6 * pulse);
        ctx.stroke();
      });

      // Snow CTA
      ctx.fillStyle = "#164e63";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 12);
      ctx.fill();

      ctx.strokeStyle = "#67e8f9";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#ecfeff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`❄️ ${txt} ❄️`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_cloud": {
      ctx.save();
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Floating Cloud Puffs
      for (let c = 0; c < 3; c++) {
        const rawCx = (c * 110 + timeSec * 20) % (totalWidth + 80);
        const cx = (rawCx < 0 ? rawCx + totalWidth + 80 : rawCx) - 40;
        const cy = c === 1 ? 16 : totalHeight - 65;
        ctx.fillStyle = "rgba(224, 242, 254, 0.75)";
        ctx.beginPath();
        ctx.arc(cx, cy, 12, 0, Math.PI * 2);
        ctx.arc(cx + 10, cy - 4, 15, 0, Math.PI * 2);
        ctx.arc(cx + 20, cy, 11, 0, Math.PI * 2);
        ctx.fill();
      }

      // Golden Celestial Stars
      for (let st = 0; st < 10; st++) {
        const sx = ((st * 53) % (totalWidth - 28)) + 14;
        const sy = ((st * 71) % (totalHeight - 28)) + 14;
        const alpha = 0.3 + 0.7 * Math.sin(timeSec * 3.5 + st);
        ctx.fillStyle = `rgba(254, 240, 138, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.beginPath();
        ctx.arc(sx, sy, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Cloud CTA
      ctx.fillStyle = "#0284c7";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 18);
      ctx.fill();

      ctx.strokeStyle = "#e0f2fe";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`☁️ ${txt} ☁️`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_storm": {
      ctx.save();
      const flash = Math.sin(timeSec * 6) > 0.88;
      ctx.strokeStyle = flash ? "#a855f7" : "#334155";
      ctx.lineWidth = flash ? 5 : 3.5;
      ctx.shadowColor = "#c084fc";
      ctx.shadowBlur = flash ? 18 : 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Jagged Lightning Strike
      if (flash) {
        ctx.strokeStyle = "#facc15";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(totalWidth * 0.2, 8);
        ctx.lineTo(totalWidth * 0.35, 24);
        ctx.lineTo(totalWidth * 0.3, 28);
        ctx.lineTo(totalWidth * 0.5, 46);
        ctx.stroke();
      }

      // Electric Spark Particles
      const w = totalWidth - 20;
      const h = totalHeight - 20;
      const perim = 2 * (w + h);
      for (let p = 0; p < 12; p++) {
        const rawFrac = (p / 12 + timeSec * 0.35) % 1;
        const frac = rawFrac < 0 ? rawFrac + 1 : rawFrac;
        const dist = frac * perim;
        let px = 0, py = 0;
        if (dist < w) { px = 10 + dist; py = 10; }
        else if (dist < w + h) { px = totalWidth - 10; py = 10 + (dist - w); }
        else if (dist < 2 * w + h) { px = totalWidth - 10 - (dist - (w + h)); py = totalHeight - 10; }
        else { px = 10; py = totalHeight - 10 - (dist - (2 * w + h)); }

        ctx.fillStyle = p % 2 === 0 ? "#38bdf8" : "#facc15";
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(px, py, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Storm CTA
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 12);
      ctx.fill();

      ctx.strokeStyle = "#a855f7";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = flash ? "#fef08a" : "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⚡ ${txt} ⚡`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_cyberpunk": {
      ctx.save();
      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 14);
      ctx.stroke();

      // Matrix Code Streams
      ctx.shadowBlur = 0;
      ctx.font = "bold 8px monospace";
      const glyphs = "010110XF7A9B";
      for (let col = 0; col < 6; col++) {
        const cx = col < 3 ? 12 + col * 8 : totalWidth - 36 + (col - 3) * 8;
        for (let row = 0; row < 10; row++) {
          const rawCy = (row * 14 + timeSec * 45) % (totalHeight - 30);
          const cy = (rawCy < 0 ? rawCy + totalHeight - 30 : rawCy) + 15;
          const char = glyphs[(col + row) % glyphs.length];
          const alpha = 0.2 + 0.8 * (cy / totalHeight);
          ctx.fillStyle = `rgba(52, 211, 153, ${Math.max(0, Math.min(1, alpha))})`;
          ctx.fillText(char, cx, cy);
        }
      }

      // Sweeping Laser Scan Line
      const scanFrac = Math.max(0, Math.min(1, (Math.sin(timeSec * 2.5) + 1) / 2));
      const scanY = 16 + scanFrac * (totalHeight - 32);
      ctx.strokeStyle = "rgba(6, 182, 212, 0.75)";
      ctx.lineWidth = 2;
      ctx.shadowColor = "#06b6d4";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(12, scanY);
      ctx.lineTo(totalWidth - 12, scanY);
      ctx.stroke();

      // Cyber HUD CTA
      ctx.fillStyle = "#022c22";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 6);
      ctx.fill();

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#6ee7b7";
      ctx.font = fontMono;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`// ${txt} //`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_galaxy": {
      ctx.save();
      const galaxyGrad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      galaxyGrad.addColorStop(0, "#8b5cf6");
      galaxyGrad.addColorStop(0.5, "#ec4899");
      galaxyGrad.addColorStop(1, "#3b82f6");

      ctx.strokeStyle = galaxyGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 22);
      ctx.stroke();

      // Orbiting Planetary Particles
      const centerX = totalWidth / 2;
      const centerY = totalHeight / 2;
      for (let p = 0; p < 20; p++) {
        const angle = timeSec * (0.7 + (p % 3) * 0.3) + (p * Math.PI * 2) / 20;
        const rx = totalWidth * 0.44 + (p % 4) * 3;
        const ry = totalHeight * 0.44 + (p % 4) * 3;
        const px = centerX + Math.cos(angle) * rx;
        const py = centerY + Math.sin(angle) * ry;

        ctx.fillStyle = p % 2 === 0 ? "#f472b6" : "#60a5fa";
        ctx.shadowColor = "#f472b6";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Galaxy CTA
      ctx.fillStyle = "#1e1b4b";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 18);
      ctx.fill();

      ctx.strokeStyle = galaxyGrad;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🌌 ${txt} 🌌`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_fire": {
      ctx.save();
      ctx.strokeStyle = "#ea580c";
      ctx.lineWidth = 4;
      ctx.shadowColor = "#f97316";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // Rising Flame Tongues
      ctx.shadowBlur = 0;
      for (let f = 0; f < 16; f++) {
        const fx = 16 + (f * (totalWidth - 32)) / 15;
        const flameHeight = Math.max(2, 10 + Math.sin(timeSec * 7 + f * 1.5) * 6);
        const gradFlame = ctx.createLinearGradient(fx, totalHeight - 16, fx, totalHeight - 16 - flameHeight);
        gradFlame.addColorStop(0, "rgba(234, 88, 12, 0.8)");
        gradFlame.addColorStop(1, "rgba(254, 240, 138, 0)");
        ctx.fillStyle = gradFlame;
        ctx.beginPath();
        ctx.moveTo(fx - 5, totalHeight - 16);
        ctx.quadraticCurveTo(fx, totalHeight - 16 - flameHeight, fx + 5, totalHeight - 16);
        ctx.fill();
      }

      // Floating Embers
      for (let e = 0; e < 14; e++) {
        const rawEx = (e * 47 + Math.sin(timeSec * 2.5 + e) * 12) % (totalWidth - 32);
        const ex = (rawEx < 0 ? rawEx + totalWidth - 32 : rawEx) + 16;
        const rawEyMod = (timeSec * 45 + e * 18) % (totalHeight * 0.4);
        const eyMod = rawEyMod < 0 ? rawEyMod + totalHeight * 0.4 : rawEyMod;
        const ey = totalHeight - 20 - eyMod;
        const alpha = Math.sin((ey / totalHeight) * Math.PI);
        ctx.fillStyle = `rgba(253, 224, 71, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.beginPath();
        ctx.arc(ex, ey, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Fire CTA
      ctx.fillStyle = "#431407";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 12);
      ctx.fill();

      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffedd5";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🔥 ${txt} 🔥`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_luxury_gold": {
      ctx.save();
      // 1. Double Royal Gold Border with Clean Gradient Coordinates
      const goldGrad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      goldGrad.addColorStop(0, "#d97706");
      goldGrad.addColorStop(0.3, "#fef08a");
      goldGrad.addColorStop(0.7, "#f59e0b");
      goldGrad.addColorStop(1, "#b45309");

      ctx.strokeStyle = goldGrad;
      ctx.lineWidth = 4.5;
      ctx.strokeRect(8, 8, totalWidth - 16, totalHeight - 16);
      ctx.lineWidth = 1.5;
      ctx.strokeRect(14, 14, totalWidth - 28, totalHeight - 28);

      // 2. Safe Specular Shimmer Sweep
      const rawBeam = (timeSec * 0.4) % 1;
      const beamNorm = rawBeam < 0 ? rawBeam + 1 : rawBeam;
      const beamX = beamNorm * (totalWidth * 2) - totalWidth * 0.5;
      const shimmerGrad = ctx.createLinearGradient(beamX - 40, 0, beamX + 40, totalHeight);
      shimmerGrad.addColorStop(0, "rgba(254, 240, 138, 0)");
      shimmerGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.7)");
      shimmerGrad.addColorStop(1, "rgba(254, 240, 138, 0)");

      ctx.strokeStyle = shimmerGrad;
      ctx.lineWidth = 5;
      ctx.strokeRect(8, 8, totalWidth - 16, totalHeight - 16);

      // 3. Sparkling Diamond Star Flares
      const starCorners = [[11, 11], [totalWidth - 11, 11], [11, totalHeight - 11], [totalWidth - 11, totalHeight - 11]];
      starCorners.forEach(([sx, sy], idx) => {
        const pulse = Math.max(0, 0.4 + 0.6 * Math.sin(timeSec * 5 + idx * 1.5));
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(sx - 7 * pulse, sy);
        ctx.lineTo(sx + 7 * pulse, sy);
        ctx.moveTo(sx, sy - 7 * pulse);
        ctx.lineTo(sx, sy + 7 * pulse);
        ctx.stroke();
      });

      // 4. Gold Ribbon CTA
      ctx.fillStyle = goldGrad;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.08, totalHeight - 48, totalWidth * 0.84, 32, 6);
      ctx.fill();

      ctx.fillStyle = "#000000";
      ctx.font = getCanvasFont(fontSize, fontFamily === "inter" ? "cinzel" : fontFamily, fontWeight);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`👑 PRESTIGE • ${txt} 👑`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
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

      // Floating Hearts
      ctx.shadowBlur = 0;
      for (let h = 0; h < 12; h++) {
        const seed = h * 71.3;
        const rawHyMod = (seed + timeSec * 35) % (totalHeight - 24);
        const hyMod = rawHyMod < 0 ? rawHyMod + totalHeight - 24 : rawHyMod;
        const hy = totalHeight - 20 - hyMod;
        const rawHx = (seed * 2.1 + Math.sin(timeSec * 2 + h) * 14) % (totalWidth - 28);
        const hx = (rawHx < 0 ? rawHx + totalWidth - 28 : rawHx) + 14;
        const scale = Math.max(0.1, 0.6 + (h % 3) * 0.3);

        ctx.save();
        ctx.translate(hx, hy);
        ctx.scale(scale, scale);
        ctx.fillStyle = h % 2 === 0 ? "#fb7185" : "#f43f5e";
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(-4, -5, -8, 0, 0, 8);
        ctx.bezierCurveTo(8, 0, 4, -5, 0, 0);
        ctx.fill();
        ctx.restore();
      }

      // Hearts CTA
      ctx.fillStyle = "#881337";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 18);
      ctx.fill();

      ctx.strokeStyle = "#fb7185";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffe4e6";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`💖 ${txt} 💖`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_waves": {
      ctx.save();
      ctx.strokeStyle = "#0d9488";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Undulating Sine Waves
      const waveBase = totalHeight - 18;
      ctx.fillStyle = "rgba(20, 184, 166, 0.4)";
      ctx.beginPath();
      ctx.moveTo(8, waveBase);
      for (let x = 8; x <= totalWidth - 8; x += 4) {
        const wy = waveBase - 7 + Math.sin(x * 0.04 + timeSec * 3.5) * 5;
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(totalWidth - 8, totalHeight - 8);
      ctx.lineTo(8, totalHeight - 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "rgba(45, 212, 191, 0.6)";
      ctx.beginPath();
      ctx.moveTo(8, waveBase);
      for (let x = 8; x <= totalWidth - 8; x += 4) {
        const wy = waveBase - 5 + Math.sin(x * 0.04 + timeSec * 3.5 + Math.PI) * 4;
        ctx.lineTo(x, wy);
      }
      ctx.lineTo(totalWidth - 8, totalHeight - 8);
      ctx.lineTo(8, totalHeight - 8);
      ctx.closePath();
      ctx.fill();

      // Rising Sea Bubbles
      for (let b = 0; b < 10; b++) {
        const rawBx = (b * 49 + Math.cos(timeSec * 2 + b) * 10) % (totalWidth - 30);
        const bx = (rawBx < 0 ? rawBx + totalWidth - 30 : rawBx) + 15;
        const rawByMod = (timeSec * 30 + b * 20) % (totalHeight * 0.35);
        const byMod = rawByMod < 0 ? rawByMod + totalHeight * 0.35 : rawByMod;
        const by = totalHeight - 16 - byMod;
        ctx.strokeStyle = "rgba(204, 251, 241, 0.8)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bx, by, Math.max(0.5, 2 + (b % 3)), 0, Math.PI * 2);
        ctx.stroke();
      }

      // Ocean CTA
      ctx.fillStyle = "#134e4a";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 18);
      ctx.fill();

      ctx.strokeStyle = "#2dd4bf";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#f0fdfa";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🌊 ${txt} 🌊`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_diamond": {
      ctx.save();
      // 1. Crystal Diamond Beveled Frame
      const diamGrad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      diamGrad.addColorStop(0, "#06b6d4");
      diamGrad.addColorStop(0.5, "#e0e7ff");
      diamGrad.addColorStop(1, "#8b5cf6");

      ctx.strokeStyle = diamGrad;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 16);
      ctx.stroke();

      // 2. Traveling Prismatic Rainbow Light Beam
      const rawPrisme = (timeSec * 0.35) % 1;
      const prismeNorm = rawPrisme < 0 ? rawPrisme + 1 : rawPrisme;
      const prismeX = prismeNorm * (totalWidth * 1.8) - totalWidth * 0.4;
      const rainbow = ctx.createLinearGradient(prismeX - 30, 0, prismeX + 30, totalHeight);
      rainbow.addColorStop(0, "rgba(6, 182, 212, 0)");
      rainbow.addColorStop(0.3, "rgba(168, 85, 247, 0.6)");
      rainbow.addColorStop(0.7, "rgba(244, 114, 182, 0.6)");
      rainbow.addColorStop(1, "rgba(6, 182, 212, 0)");

      ctx.strokeStyle = rainbow;
      ctx.lineWidth = 4;
      ctx.stroke();

      // 3. Diamond Sparkle Flares
      const diamCorners = [[16, 16], [totalWidth - 16, 16], [16, totalHeight - 16], [totalWidth - 16, totalHeight - 16]];
      diamCorners.forEach(([cx, cy], i) => {
        const pulse = Math.max(0.1, 0.5 + 0.5 * Math.sin(timeSec * 6 + i * 1.8));
        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "#38bdf8";
        ctx.shadowBlur = 8 * pulse;
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(0.1, 3 * pulse), 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Diamond CTA
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#1e1b4b";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 14);
      ctx.fill();

      ctx.strokeStyle = diamGrad;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#e0e7ff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`💎 ${txt} 💎`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_music": {
      ctx.save();
      // Soundstage Frame
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // Animated Equalizer Frequency Bars
      const barCount = 18;
      const barW = (totalWidth - 40) / barCount;
      for (let b = 0; b < barCount; b++) {
        const bh = Math.max(2, 4 + Math.abs(Math.sin(timeSec * 8 + b * 0.8)) * 14);
        const bx = 20 + b * barW;
        const by = totalHeight - 18 - bh;
        const grad = ctx.createLinearGradient(bx, by, bx, totalHeight - 18);
        grad.addColorStop(0, "#ec4899");
        grad.addColorStop(1, "#8b5cf6");
        ctx.fillStyle = grad;
        ctx.fillRect(bx, by, Math.max(1, barW - 2), bh);
      }

      // Music CTA
      ctx.fillStyle = "#3b0764";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 54, totalWidth * 0.8, 32, 16);
      ctx.fill();

      ctx.strokeStyle = "#ec4899";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🎵 ${txt} 🎧`, totalWidth / 2, totalHeight - 38);
      ctx.restore();
      break;
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
      ctx.strokeStyle = "rgba(236, 72, 153, 0.45)";
      ctx.lineWidth = 1;
      for (let g = 0; g < 6; g++) {
        const gy = totalHeight - 48 + g * 6;
        ctx.beginPath();
        ctx.moveTo(12, gy);
        ctx.lineTo(totalWidth - 12, gy);
        ctx.stroke();
      }

      // Retro CTA
      ctx.fillStyle = "#18022e";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 6);
      ctx.fill();

      ctx.strokeStyle = synthGrad;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#f472b6";
      ctx.font = fontMono;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🕹️ ${txt} 🚀`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_nature": {
      ctx.save();
      // Botanical Emerald Frame
      ctx.strokeStyle = "#059669";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Glowing Firefly Wisps
      for (let f = 0; f < 14; f++) {
        const seed = f * 53.7;
        const rawFx = (seed + Math.sin(timeSec * 2 + f) * 16) % (totalWidth - 28);
        const fx = (rawFx < 0 ? rawFx + totalWidth - 28 : rawFx) + 14;
        const rawFy = (seed * 1.5 + Math.cos(timeSec * 1.8 + f) * 16) % (totalHeight - 28);
        const fy = (rawFy < 0 ? rawFy + totalHeight - 28 : rawFy) + 14;
        const pulse = Math.max(0.1, 0.4 + 0.6 * Math.sin(timeSec * 4 + f));

        ctx.fillStyle = `rgba(163, 230, 53, ${pulse})`;
        ctx.shadowColor = "#a3e635";
        ctx.shadowBlur = 8 * pulse;
        ctx.beginPath();
        ctx.arc(fx, fy, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }

      // Nature CTA
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#064e3b";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 18);
      ctx.fill();

      ctx.strokeStyle = "#34d399";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#d1fae5";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🌿 ${txt} ✨`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_coffee": {
      ctx.save();
      // Roasted Espresso & Caramel Frame
      ctx.strokeStyle = "#78350f";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // Curling Steam Vapor Lines at Top
      ctx.strokeStyle = "rgba(254, 215, 170, 0.5)";
      ctx.lineWidth = 2;
      for (let s = 0; s < 4; s++) {
        const sx = totalWidth * 0.35 + s * 14;
        const rawSyMod = (timeSec * 15 + s * 8) % 18;
        const syMod = rawSyMod < 0 ? rawSyMod + 18 : rawSyMod;
        const sy = 28 - syMod;
        const wave = Math.sin(timeSec * 3 + s) * 4;
        ctx.beginPath();
        ctx.moveTo(sx, sy + 10);
        ctx.quadraticCurveTo(sx + wave, sy + 5, sx, sy);
        ctx.stroke();
      }

      // Coffee CTA
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 12);
      ctx.fill();

      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#fef3c7";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`☕ ${txt} 🥐`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_fireworks": {
      ctx.save();
      // Midnight Celebration Frame
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // Exploding Particle Fireworks at 2 Centers
      const centers = [[totalWidth * 0.25, 28], [totalWidth * 0.75, 32]];
      const fColors = ["#facc15", "#f43f5e", "#38bdf8", "#34d399", "#ec4899"];

      centers.forEach(([cx, cy], cIdx) => {
        const rawCycle = (timeSec * 0.9 + cIdx * 0.5) % 1;
        const cycleTime = rawCycle < 0 ? rawCycle + 1 : rawCycle;
        const radius = Math.max(0.1, cycleTime * 28);
        const pAlpha = Math.max(0, 1 - cycleTime);

        for (let p = 0; p < 10; p++) {
          const angle = (p * Math.PI * 2) / 10;
          const px = cx + Math.cos(angle) * radius;
          const py = cy + Math.sin(angle) * radius + cycleTime * 6; // gravity
          ctx.fillStyle = fColors[(p + cIdx) % fColors.length];
          ctx.shadowColor = ctx.fillStyle;
          ctx.shadowBlur = 6;
          ctx.beginPath();
          ctx.arc(px, py, Math.max(0.1, 2 * pAlpha), 0, Math.PI * 2);
          ctx.fill();
        }
      });

      // Celebration CTA
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#1e1b4b";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 16);
      ctx.fill();

      ctx.strokeStyle = "#facc15";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fef08a";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🎆 ${txt} 🥂`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_f1_racing": {
      ctx.save();
      // 1. Asphalt Dark Rim
      ctx.strokeStyle = "#18181b";
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // 2. Alternating Red & White Grand Prix Kerb Stripes
      const kerbCount = 24;
      const kerbW = (totalWidth - 20) / (kerbCount / 2);
      for (let k = 0; k < kerbCount / 2; k++) {
        const kCol = (k + Math.floor(timeSec * 15)) % 2 === 0 ? "#dc2626" : "#ffffff";
        ctx.fillStyle = kCol;
        // Top and Bottom kerbs
        ctx.fillRect(10 + k * kerbW, 5, kerbW, 3);
        ctx.fillRect(10 + k * kerbW, totalHeight - 8, kerbW, 3);
      }

      // 3. Ultra-Fast Orbiting Neon Velocity Comet
      const w = totalWidth - 16;
      const h = totalHeight - 16;
      const perim = 2 * (w + h);
      const rawT = (timeSec * 1.4) % 1;
      const tNorm = rawT < 0 ? rawT + 1 : rawT;
      const beamDist = tNorm * perim;
      let bx = 0, by = 0;
      if (beamDist < w) { bx = 8 + beamDist; by = 8; }
      else if (beamDist < w + h) { bx = totalWidth - 8; by = 8 + (beamDist - w); }
      else if (beamDist < 2 * w + h) { bx = totalWidth - 8 - (beamDist - (w + h)); by = totalHeight - 8; }
      else { bx = 8; by = totalHeight - 8 - (beamDist - (2 * w + h)); }

      ctx.fillStyle = "#ef4444";
      ctx.shadowColor = "#f87171";
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(bx, by, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 4. Racing CTA
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 10);
      ctx.fill();

      ctx.strokeStyle = "#dc2626";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = fontMono;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🏎️ ${txt} 🏁`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_basketball": {
      ctx.save();
      // 1. Hardwood Court Orange/Amber Rim
      ctx.strokeStyle = "#c2410c";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // 2. Bouncing Basketball Orbiting with Trail
      const bCycle = (timeSec * 1.2) % 1;
      const bBounce = Math.abs(Math.sin(timeSec * 6)) * 14;
      const bx = 16 + (((timeSec * 60) % (totalWidth - 32)) + (totalWidth - 32)) % (totalWidth - 32);
      const by = 22 - bBounce;

      ctx.fillStyle = "#ea580c";
      ctx.shadowColor = "#fb923c";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(bx, by, 5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Basketball CTA
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#431407";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 18);
      ctx.fill();

      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffedd5";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🏀 ${txt} ⛹️`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_football": {
      ctx.save();
      // 1. Stadium Emerald Border
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // 2. Oscillating Stadium Floodlight Beams
      const angleSweep = Math.sin(timeSec * 2) * 0.4;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.moveTo(12, 12);
      ctx.lineTo(12 + Math.cos(Math.PI / 4 + angleSweep) * 50, 12 + Math.sin(Math.PI / 4 + angleSweep) * 50);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(totalWidth - 12, 12);
      ctx.lineTo(totalWidth - 12 - Math.cos(Math.PI / 4 - angleSweep) * 50, 12 + Math.sin(Math.PI / 4 - angleSweep) * 50);
      ctx.stroke();

      // 3. Golden Champions League Stars
      const starAngles = [0, 72, 144, 216, 288];
      starAngles.forEach((deg, idx) => {
        const rad = (deg * Math.PI) / 180 + timeSec * 0.8;
        const sx = totalWidth / 2 + Math.cos(rad) * (totalWidth * 0.42);
        const sy = totalHeight / 2 + Math.sin(rad) * (totalHeight * 0.42);
        const pulse = Math.max(0.1, 0.5 + 0.5 * Math.sin(timeSec * 4 + idx));
        ctx.fillStyle = "#facc15";
        ctx.shadowColor = "#fef08a";
        ctx.shadowBlur = 6 * pulse;
        ctx.beginPath();
        ctx.arc(sx, sy, Math.max(0.5, 2.5 * pulse), 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Champions CTA
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#052e16";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 12);
      ctx.fill();

      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#f0fdf4";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⚽ ${txt} 🏆`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_tennis": {
      ctx.save();
      // 1. Wimbledon Classic Navy & Lawn Green Frame
      ctx.strokeStyle = "#166534";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // 2. Orbiting Neon Yellow Tennis Ball with Curved Flight Path
      const tAngle = timeSec * 2.2;
      const tX = totalWidth / 2 + Math.cos(tAngle) * (totalWidth * 0.43);
      const tY = totalHeight / 2 + Math.sin(tAngle * 2) * (totalHeight * 0.38);

      ctx.fillStyle = "#ccff00";
      ctx.shadowColor = "#bef264";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(tX, tY, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 3. Tennis CTA
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#14532d";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 18);
      ctx.fill();

      ctx.strokeStyle = "#ccff00";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🎾 ${txt} 🎾`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_boxing": {
      ctx.save();
      // 1. Boxing Ring Double Ropes Frame
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

      // 2. Corner Impact Flash Sparks
      const flash = Math.sin(timeSec * 8) > 0.7;
      if (flash) {
        ctx.fillStyle = "#facc15";
        ctx.shadowColor = "#fef08a";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(14, 14, 5, 0, Math.PI * 2);
        ctx.arc(totalWidth - 14, 14, 5, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Fight CTA
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#450a0a";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 8);
      ctx.fill();

      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fee2e2";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🥊 ${txt} 🥊`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_terminal_code": {
      ctx.save();
      // 1. Hacker Dark Terminal Frame
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 10);
      ctx.stroke();

      // 2. Top Terminal Traffic Lights (Red, Yellow, Green)
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#ef4444";
      ctx.beginPath(); ctx.arc(18, 18, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#eab308";
      ctx.beginPath(); ctx.arc(28, 18, 3, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = "#22c55e";
      ctx.beginPath(); ctx.arc(38, 18, 3, 0, Math.PI * 2); ctx.fill();

      // 3. Blinking Prompt & Command String
      const blink = Math.sin(timeSec * 6) > 0;
      ctx.font = "bold 9px monospace";
      ctx.fillStyle = "#86efac";
      ctx.textAlign = "left";
      ctx.fillText(`>_ root@dev:~# ${blink ? "█" : ""}`, 48, 20);

      // 4. CLI CTA
      ctx.fillStyle = "#052e16";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 6);
      ctx.fill();

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#bbf7d0";
      ctx.font = fontMono;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`[ ${txt} ]`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_rocket_launch": {
      ctx.save();
      // 1. Space Blue Frame
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // 2. Rocket Thruster Plasma Jet at bottom center
      const jetPulse = Math.sin(timeSec * 14) * 4;
      const rGrad = ctx.createLinearGradient(totalWidth / 2, totalHeight - 16, totalWidth / 2, totalHeight - 4);
      rGrad.addColorStop(0, "#f97316");
      rGrad.addColorStop(0.5, "#facc15");
      rGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = rGrad;
      ctx.beginPath();
      ctx.moveTo(totalWidth / 2 - 12, totalHeight - 16);
      ctx.lineTo(totalWidth / 2, totalHeight - 4 + jetPulse);
      ctx.lineTo(totalWidth / 2 + 12, totalHeight - 16);
      ctx.closePath();
      ctx.fill();

      // 3. Shooting Star Streak across top
      const starFrac = (((timeSec * 0.8) % 1) + 1) % 1;
      const ssX = 14 + starFrac * (totalWidth - 40);
      const ssY = 16 + starFrac * 10;
      ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(ssX, ssY);
      ctx.lineTo(ssX + 16, ssY - 6);
      ctx.stroke();

      // 4. Space CTA
      ctx.fillStyle = "#1e1b4b";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 52, totalWidth * 0.8, 34, 16);
      ctx.fill();

      ctx.strokeStyle = "#60a5fa";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#dbeafe";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🚀 ${txt} 🌌`, totalWidth / 2, totalHeight - 35);
      ctx.restore();
      break;
    }

    case "anim_aurora": {
      ctx.save();
      // 1. Shimmering Aurora Wave Gradient
      const aurGrad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      aurGrad.addColorStop(0, "#10b981");
      aurGrad.addColorStop(0.5, "#06b6d4");
      aurGrad.addColorStop(1, "#8b5cf6");

      ctx.strokeStyle = aurGrad;
      ctx.lineWidth = 4;
      ctx.shadowColor = "#34d399";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // 2. Aurora Light Veil at Top
      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(52, 211, 153, 0.35)";
      ctx.beginPath();
      ctx.moveTo(8, 20);
      for (let x = 8; x <= totalWidth - 8; x += 6) {
        const ay = 18 + Math.sin(x * 0.05 + timeSec * 2.5) * 6;
        ctx.lineTo(x, ay);
      }
      ctx.lineTo(totalWidth - 8, 8);
      ctx.lineTo(8, 8);
      ctx.closePath();
      ctx.fill();

      // 3. Aurora CTA
      ctx.fillStyle = "#022c22";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 18);
      ctx.fill();

      ctx.strokeStyle = aurGrad;
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#d1fae5";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🌌 ${txt} ✨`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_dna_biotech": {
      ctx.save();
      // 1. Biotech Teal Frame
      ctx.strokeStyle = "#0d9488";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // 2. Double Helix Base Pairs on Left & Right Margins
      for (let d = 0; d < 8; d++) {
        const dY = 28 + d * ((totalHeight - 70) / 7);
        const wave = Math.sin(timeSec * 3 + d * 0.8);
        const lX1 = 12 + wave * 4;
        const lX2 = 12 - wave * 4;

        ctx.fillStyle = "#2dd4bf";
        ctx.beginPath(); ctx.arc(lX1, dY, 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#38bdf8";
        ctx.beginPath(); ctx.arc(lX2, dY, 2, 0, Math.PI * 2); ctx.fill();

        ctx.strokeStyle = "rgba(45, 212, 191, 0.4)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(lX1, dY);
        ctx.lineTo(lX2, dY);
        ctx.stroke();
      }

      // 3. DNA Biotech CTA
      ctx.fillStyle = "#134e4a";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 14);
      ctx.fill();

      ctx.strokeStyle = "#2dd4bf";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#ccfbf1";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🧬 ${txt} 🔬`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_glitch": {
      ctx.save();
      // 1. RGB Glitch Frame Offset
      const glitchActive = Math.sin(timeSec * 10) > 0.82;
      const gOffset = glitchActive ? (Math.sin(timeSec * 30) > 0 ? 3 : -3) : 0;

      // Cyan Ghost
      ctx.strokeStyle = "rgba(6, 182, 212, 0.75)";
      ctx.lineWidth = 3;
      ctx.strokeRect(8 + gOffset, 8, totalWidth - 16, totalHeight - 16);

      // Magenta Ghost
      ctx.strokeStyle = "rgba(236, 72, 153, 0.75)";
      ctx.lineWidth = 3;
      ctx.strokeRect(8 - gOffset, 8, totalWidth - 16, totalHeight - 16);

      // 2. Glitch CTA
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1 + gOffset, totalHeight - 50, totalWidth * 0.8, 36, 6);
      ctx.fill();

      ctx.strokeStyle = glitchActive ? "#ec4899" : "#06b6d4";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#ffffff";
      ctx.font = fontMono;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⚡ ${txt} ⚡`, totalWidth / 2 + gOffset, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_sunset_vibes": {
      ctx.save();
      // 1. California Sunset Gradient Rim
      const sunGrad = ctx.createLinearGradient(0, 0, 0, totalHeight);
      sunGrad.addColorStop(0, "#f43f5e");
      sunGrad.addColorStop(0.5, "#fb923c");
      sunGrad.addColorStop(1, "#fbbf24");

      ctx.strokeStyle = sunGrad;
      ctx.lineWidth = 4.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 20);
      ctx.stroke();

      // 2. Sinking Retro Sun Disk with Sliced Blinds
      const sunY = 24 + Math.sin(timeSec * 1.5) * 4;
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(totalWidth / 2, sunY, 12, 0, Math.PI * 2);
      ctx.fill();

      // 3. Sunset CTA
      ctx.fillStyle = "#881337";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 18);
      ctx.fill();

      ctx.strokeStyle = "#fb923c";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fff1f2";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🌅 ${txt} 🌴`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_matrix_rain": {
      ctx.save();
      // 1. Pure Obsidian & Matrix Phosphor Frame
      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 3.5;
      ctx.shadowColor = "#4ade80";
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 12);
      ctx.stroke();

      // 2. Matrix Digital Rain Columns
      ctx.shadowBlur = 0;
      ctx.font = "bold 7px monospace";
      const binChars = "01101001";
      for (let c = 0; c < 8; c++) {
        const cx = c < 4 ? 12 + c * 6 : totalWidth - 32 + (c - 4) * 6;
        for (let r = 0; r < 8; r++) {
          const rawRy = (r * 12 + timeSec * 35) % (totalHeight - 30);
          const ry = (rawRy < 0 ? rawRy + totalHeight - 30 : rawRy) + 14;
          const char = binChars[(c + r) % binChars.length];
          const alpha = 0.2 + 0.8 * (ry / totalHeight);
          ctx.fillStyle = `rgba(74, 222, 128, ${Math.max(0, Math.min(1, alpha))})`;
          ctx.fillText(char, cx, ry);
        }
      }

      // 3. Matrix CTA
      ctx.fillStyle = "#022c22";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 6);
      ctx.fill();

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = "#86efac";
      ctx.font = fontMono;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`[ ${txt} ]`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_circuit_board": {
      ctx.save();
      // 1. PCB Emerald Base Frame
      ctx.strokeStyle = "#047857";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 10);
      ctx.stroke();

      ctx.strokeStyle = "#064e3b";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(14, 14, totalWidth - 28, totalHeight - 28, 8);
      ctx.stroke();

      // 2. Copper PCB Traces & Solder Vias
      const traceCoords = [
        { x1: 8, y1: 45, x2: 24, y2: 45, x3: 34, y3: 20 },
        { x1: 45, y1: 8, x2: 45, y2: 24, x3: 20, y3: 34 },
        { x1: totalWidth - 8, y1: 45, x2: totalWidth - 24, y2: 45, x3: totalWidth - 34, y3: 20 },
        { x1: totalWidth - 45, y1: 8, x2: totalWidth - 45, y2: 24, x3: totalWidth - 20, y3: 34 },
        { x1: 8, y1: totalHeight - 65, x2: 24, y2: totalHeight - 65, x3: 34, y3: totalHeight - 50 },
        { x1: totalWidth - 8, y1: totalHeight - 65, x2: totalWidth - 24, y2: totalHeight - 65, x3: totalWidth - 34, y3: totalHeight - 50 },
      ];

      ctx.strokeStyle = "#ca8a04";
      ctx.lineWidth = 1.8;
      for (const t of traceCoords) {
        ctx.beginPath();
        ctx.moveTo(t.x1, t.y1);
        ctx.lineTo(t.x2, t.y2);
        ctx.lineTo(t.x3, t.y3);
        ctx.stroke();

        ctx.fillStyle = "#eab308";
        ctx.beginPath();
        ctx.arc(t.x3, t.y3, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#022c22";
        ctx.beginPath();
        ctx.arc(t.x3, t.y3, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      // Traveling Electric Pulses
      const pulsePhase = (timeSec * 2) % 1;
      ctx.fillStyle = "#fef08a";
      ctx.shadowColor = "#eab308";
      ctx.shadowBlur = 6;
      for (let i = 0; i < traceCoords.length; i++) {
        const t = traceCoords[i];
        const p = (pulsePhase + i * 0.16) % 1;
        let px: number, py: number;
        if (p < 0.5) {
          const segP = p * 2;
          px = t.x1 + (t.x2 - t.x1) * segP;
          py = t.y1 + (t.y2 - t.y1) * segP;
        } else {
          const segP = (p - 0.5) * 2;
          px = t.x2 + (t.x3 - t.x2) * segP;
          py = t.y2 + (t.y3 - t.y2) * segP;
        }
        ctx.beginPath();
        ctx.arc(px, py, 2.8, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // 3. PCB CTA Badge
      ctx.fillStyle = "#022c22";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 8);
      ctx.fill();

      ctx.strokeStyle = "#10b981";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = "#a7f3d0";
      ctx.font = fontMono;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⚡ PCB // ${txt} ⚡`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_quantum_grid": {
      ctx.save();
      // 1. Quantum Violet Grid Frame
      ctx.strokeStyle = "#6366f1";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 14);
      ctx.stroke();

      // 2. Quantum Lattice Qubit Nodes along perimeter
      const nodeCount = 12;
      const qubitNodes: Array<{ x: number; y: number }> = [];
      for (let i = 0; i < nodeCount; i++) {
        let qx = 0, qy = 0;
        if (i < 3) {
          qx = 20 + i * ((totalWidth - 40) / 2);
          qy = 10;
        } else if (i < 6) {
          qx = totalWidth - 10;
          qy = 20 + (i - 3) * ((totalHeight - 75) / 2);
        } else if (i < 9) {
          qx = totalWidth - 20 - (i - 6) * ((totalWidth - 40) / 2);
          qy = totalHeight - 55;
        } else {
          qx = 10;
          qy = totalHeight - 65 - (i - 9) * ((totalHeight - 75) / 2);
        }
        qubitNodes.push({ x: qx, y: qy });
      }

      // Draw entangled resonance lines between nodes
      for (let i = 0; i < qubitNodes.length; i++) {
        const next = qubitNodes[(i + 1) % qubitNodes.length];
        const alpha = 0.3 + 0.4 * Math.sin(timeSec * 4 + i * 0.8);
        ctx.strokeStyle = `rgba(168, 85, 247, ${Math.max(0, Math.min(1, alpha))})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(qubitNodes[i].x, qubitNodes[i].y);
        ctx.lineTo(next.x, next.y);
        ctx.stroke();
      }

      // Draw Qubit Pulsing Nodes
      for (let i = 0; i < qubitNodes.length; i++) {
        const pulse = Math.max(0.1, 2.5 + Math.sin(timeSec * 5 + i * 0.7) * 1.5);
        ctx.fillStyle = i % 2 === 0 ? "#a855f7" : "#38bdf8";
        ctx.shadowColor = "#c084fc";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(qubitNodes[i].x, qubitNodes[i].y, pulse, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // 3. Quantum CTA Badge
      ctx.fillStyle = "#1e1b4b";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 12);
      ctx.fill();

      ctx.strokeStyle = "#818cf8";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#e0e7ff";
      ctx.font = fontMono;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⚛️ QUANTUM // ${txt} ⚛️`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_ai_neural": {
      ctx.save();
      // 1. Synapse Neon Blue / Magenta Frame
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 16);
      ctx.stroke();

      // 2. Synaptic Nodes on Left and Right Margins
      const leftNodes: Array<{ x: number; y: number }> = [];
      const rightNodes: Array<{ x: number; y: number }> = [];
      const layerCount = 5;
      for (let i = 0; i < layerCount; i++) {
        const y = 30 + i * ((totalHeight - 90) / (layerCount - 1));
        leftNodes.push({ x: 14, y });
        rightNodes.push({ x: totalWidth - 14, y });
      }

      // Synapse Connections across layers
      ctx.lineWidth = 1;
      for (let l = 0; l < layerCount; l++) {
        for (let r = 0; r < layerCount; r++) {
          const wave = Math.sin(timeSec * 3 + l + r);
          if (wave > 0.3) {
            ctx.strokeStyle = `rgba(96, 165, 250, ${Math.max(0, Math.min(0.6, wave * 0.6))})`;
            ctx.beginPath();
            ctx.moveTo(leftNodes[l].x, leftNodes[l].y);
            ctx.bezierCurveTo(
              totalWidth * 0.3, leftNodes[l].y,
              totalWidth * 0.7, rightNodes[r].y,
              rightNodes[r].x, rightNodes[r].y
            );
            ctx.stroke();
          }
        }
      }

      // Action Potential Neural Signals firing along edges
      const signalProgress = (timeSec * 1.5) % 1;
      for (let i = 0; i < layerCount; i++) {
        const sy = 24 + ((signalProgress + i * 0.2) % 1) * (totalHeight - 78);
        ctx.fillStyle = "#ec4899";
        ctx.shadowColor = "#f43f5e";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(10, sy, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(totalWidth - 10, totalHeight - 54 - ((sy - 24)), 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Draw Neuron Nodes
      for (let i = 0; i < layerCount; i++) {
        ctx.fillStyle = "#60a5fa";
        ctx.beginPath();
        ctx.arc(leftNodes[i].x, leftNodes[i].y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#f472b6";
        ctx.beginPath();
        ctx.arc(rightNodes[i].x, rightNodes[i].y, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. AI Neural CTA Badge
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 10);
      ctx.fill();

      ctx.strokeStyle = "#818cf8";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = "#93c5fd";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`🧠 NEURAL AI // ${txt} ✦`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_hologram_hud": {
      ctx.save();
      // 1. Sci-Fi HUD Reticle Brackets
      ctx.strokeStyle = "#06b6d4";
      ctx.lineWidth = 2.5;
      const cornerLen = 22;

      // Top-Left bracket
      ctx.beginPath();
      ctx.moveTo(8, 8 + cornerLen);
      ctx.lineTo(8, 8);
      ctx.lineTo(8 + cornerLen, 8);
      ctx.stroke();

      // Top-Right bracket
      ctx.beginPath();
      ctx.moveTo(totalWidth - 8 - cornerLen, 8);
      ctx.lineTo(totalWidth - 8, 8);
      ctx.lineTo(totalWidth - 8, 8 + cornerLen);
      ctx.stroke();

      // Bottom-Left bracket
      ctx.beginPath();
      ctx.moveTo(8, totalHeight - 14 - cornerLen);
      ctx.lineTo(8, totalHeight - 14);
      ctx.lineTo(8 + cornerLen, totalHeight - 14);
      ctx.stroke();

      // Bottom-Right bracket
      ctx.beginPath();
      ctx.moveTo(totalWidth - 8 - cornerLen, totalHeight - 14);
      ctx.lineTo(totalWidth - 8, totalHeight - 14);
      ctx.lineTo(totalWidth - 8, totalHeight - 14 - cornerLen);
      ctx.stroke();

      // Outer dashed tech frame
      ctx.strokeStyle = "rgba(6, 182, 212, 0.45)";
      ctx.lineWidth = 1.2;
      ctx.setLineDash([5, 4]);
      ctx.strokeRect(14, 14, totalWidth - 28, totalHeight - 28);
      ctx.setLineDash([]);

      // 2. Holographic Volumetric Scan Laser Line
      const scanPhase = (Math.sin(timeSec * 2.5) + 1) / 2;
      const scanY = 18 + scanPhase * (totalHeight - 74);
      const scanGrad = ctx.createLinearGradient(16, scanY, totalWidth - 16, scanY);
      scanGrad.addColorStop(0, "rgba(6, 182, 212, 0.1)");
      scanGrad.addColorStop(0.5, "rgba(34, 211, 238, 0.9)");
      scanGrad.addColorStop(1, "rgba(6, 182, 212, 0.1)");

      ctx.strokeStyle = scanGrad;
      ctx.lineWidth = 2.2;
      ctx.shadowColor = "#22d3ee";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.moveTo(16, scanY);
      ctx.lineTo(totalWidth - 16, scanY);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // HUD Telemetry stamps
      ctx.font = "bold 8px monospace";
      ctx.fillStyle = "#22d3ee";
      ctx.fillText(`SYS.LOCK // 99.8%`, 18, 25);
      ctx.textAlign = "right";
      ctx.fillText(`[HUD.V3]`, totalWidth - 18, 25);

      // 3. HUD CTA Badge
      ctx.fillStyle = "#083344";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 6);
      ctx.fill();

      ctx.strokeStyle = "#22d3ee";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = "#67e8f9";
      ctx.font = fontMono;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`◈ HUD // ${txt} ◈`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_fiber_optic": {
      ctx.save();
      // 1. Sleek Glass Fiber Conduit Frame
      ctx.strokeStyle = "#0284c7";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 14);
      ctx.stroke();

      // Inner glow track
      ctx.strokeStyle = "rgba(56, 189, 248, 0.35)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(12, 12, totalWidth - 24, totalHeight - 24, 10);
      ctx.stroke();

      // 2. High-Speed Light Bursts Streaming Along Frame Perimeter
      const perimeter = 2 * (totalWidth - 20) + 2 * (totalHeight - 20);
      const burstColors = ["#38bdf8", "#ec4899", "#fbbf24", "#34d399"];
      const burstCount = 6;

      for (let b = 0; b < burstCount; b++) {
        const rawDist = (timeSec * 220 + b * (perimeter / burstCount)) % perimeter;
        const dist = rawDist < 0 ? rawDist + perimeter : rawDist;
        let bx = 0, by = 0;
        const topW = totalWidth - 20;
        const rightH = totalHeight - 20;

        if (dist < topW) {
          bx = 10 + dist;
          by = 10;
        } else if (dist < topW + rightH) {
          bx = totalWidth - 10;
          by = 10 + (dist - topW);
        } else if (dist < 2 * topW + rightH) {
          bx = totalWidth - 10 - (dist - (topW + rightH));
          by = totalHeight - 10;
        } else {
          bx = 10;
          by = totalHeight - 10 - (dist - (2 * topW + rightH));
        }

        ctx.fillStyle = burstColors[b % burstColors.length];
        ctx.shadowColor = burstColors[b % burstColors.length];
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(bx, by, 3.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // 3. Fiber Optic CTA Badge
      ctx.fillStyle = "#0c4a6e";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 12);
      ctx.fill();

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = "#bae6fd";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⚡ FIBER // ${txt} ⚡`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_blockchain": {
      ctx.save();
      // 1. Blockchain Ledger Base Frame
      ctx.strokeStyle = "#d97706";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 12);
      ctx.stroke();

      // 2. Chained Cryptographic Blocks along Top & Bottom
      const blockCount = 5;
      const activeBlock = Math.floor(timeSec * 3) % (blockCount * 2);

      // Top Chain
      for (let b = 0; b < blockCount; b++) {
        const bx = 22 + b * ((totalWidth - 64) / (blockCount - 1));
        const by = 8;
        const isMined = activeBlock === b;

        ctx.fillStyle = isMined ? "#fbbf24" : "#78350f";
        ctx.shadowColor = isMined ? "#f59e0b" : "transparent";
        ctx.shadowBlur = isMined ? 8 : 0;
        ctx.beginPath();
        ctx.roundRect(bx - 6, by - 4, 12, 8, 2);
        ctx.fill();

        // Chain link line to next block
        if (b < blockCount - 1) {
          const nextBx = 22 + (b + 1) * ((totalWidth - 64) / (blockCount - 1));
          ctx.strokeStyle = isMined ? "#fbbf24" : "#92400e";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(bx + 6, by);
          ctx.lineTo(nextBx - 6, by);
          ctx.stroke();
        }
      }

      // Bottom Margin Chain
      for (let b = 0; b < blockCount; b++) {
        const bx = 22 + b * ((totalWidth - 64) / (blockCount - 1));
        const by = totalHeight - 58;
        const isMined = activeBlock === (blockCount + b);

        ctx.fillStyle = isMined ? "#fbbf24" : "#78350f";
        ctx.shadowColor = isMined ? "#f59e0b" : "transparent";
        ctx.shadowBlur = isMined ? 8 : 0;
        ctx.beginPath();
        ctx.roundRect(bx - 6, by - 4, 12, 8, 2);
        ctx.fill();

        if (b < blockCount - 1) {
          const nextBx = 22 + (b + 1) * ((totalWidth - 64) / (blockCount - 1));
          ctx.strokeStyle = isMined ? "#fbbf24" : "#92400e";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(bx + 6, by);
          ctx.lineTo(nextBx - 6, by);
          ctx.stroke();
        }
      }
      ctx.shadowBlur = 0;

      // 3. Blockchain CTA Badge
      ctx.fillStyle = "#451a03";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 8);
      ctx.fill();

      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = "#fef3c7";
      ctx.font = fontMono;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`⛓️ BLOCKCHAIN // ${txt} 🔒`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_radar_scan": {
      ctx.save();
      // 1. Dark Phosphor Radar Frame
      ctx.strokeStyle = "#15803d";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 16);
      ctx.stroke();

      // Radar Concentric Range Rings in corner background
      const rcX = totalWidth / 2;
      const rcY = 28;
      const maxR = 20;

      ctx.strokeStyle = "rgba(74, 222, 128, 0.3)";
      ctx.lineWidth = 1;
      for (let r = 1; r <= 3; r++) {
        ctx.beginPath();
        ctx.arc(rcX, rcY, Math.max(0.1, (r / 3) * maxR), 0, Math.PI * 2);
        ctx.stroke();
      }

      // 360 Degree Sweeping Radar Cone Line
      const sweepAngle = timeSec * Math.PI * 1.6;
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 1.8;
      ctx.shadowColor = "#22c55e";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.moveTo(rcX, rcY);
      ctx.lineTo(rcX + Math.cos(sweepAngle) * maxR, rcY + Math.sin(sweepAngle) * maxR);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Radar Target Blips that flash when sweep hits them
      const blips = [
        { angle: 0.8, dist: 12 },
        { angle: 2.5, dist: 16 },
        { angle: 4.7, dist: 14 }
      ];

      for (const blip of blips) {
        const diff = ((sweepAngle - blip.angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
        const intensity = Math.max(0, 1 - diff / 1.8);
        if (intensity > 0.05) {
          const bx = rcX + Math.cos(blip.angle) * blip.dist;
          const by = rcY + Math.sin(blip.angle) * blip.dist;
          ctx.fillStyle = `rgba(74, 222, 128, ${intensity})`;
          ctx.beginPath();
          ctx.arc(bx, by, 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // 2. Radar CTA Badge
      ctx.fillStyle = "#052e16";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 10);
      ctx.fill();

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = "#86efac";
      ctx.font = fontMono;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`📡 RADAR // ${txt} 🛰️`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    case "anim_cloud_cluster": {
      ctx.save();
      // 1. Datacenter Server Rack Frame
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 3.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 10);
      ctx.stroke();

      // Server Blade Slots on Left & Right
      const bladeCount = 6;
      for (let i = 0; i < bladeCount; i++) {
        const by = 26 + i * ((totalHeight - 85) / (bladeCount - 1));
        
        // Left rack blade slot
        ctx.fillStyle = "#1e293b";
        ctx.fillRect(10, by - 3, 10, 6);
        // Right rack blade slot
        ctx.fillRect(totalWidth - 20, by - 3, 10, 6);

        // Blinking Status LEDs (Green, Blue, Orange)
        const ledPhase = (timeSec * 4 + i * 1.3) % 3;
        const ledColor = ledPhase < 1 ? "#22c55e" : ledPhase < 2 ? "#38bdf8" : "#f59e0b";
        ctx.fillStyle = ledColor;
        ctx.beginPath();
        ctx.arc(14, by, 1.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(totalWidth - 14, by, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }

      // Flowing Cloud Packets across top margin
      const packetX = 24 + ((timeSec * 80) % (totalWidth - 48));
      ctx.fillStyle = "#38bdf8";
      ctx.shadowColor = "#0ea5e9";
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(packetX, 10, 2.8, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 2. Cloud Cluster CTA Badge
      ctx.fillStyle = "#0f172a";
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.1, totalHeight - 50, totalWidth * 0.8, 36, 8);
      ctx.fill();

      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 1.8;
      ctx.stroke();

      ctx.fillStyle = "#bae6fd";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`☁️ CLOUD // ${txt} 🚀`, totalWidth / 2, totalHeight - 32);
      ctx.restore();
      break;
    }

    default:
      break;
  }
}

