import {
  drawAnimatedQRFrame,
  type AnimatedFrameRenderOptions,
} from "./qr-animated-frames";
import { BRAND_LOGOS, type BrandLogoId } from "./qr-brand-logos";
import { drawBrandLogoSpec } from "./qr-logo-canvas";

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
  | "corner_brackets"
  | "minimal_box"
  | "floating_card"
  | "double_border"
  | "clean_badge"
  | "notched_corners"
  | "stamp_border"
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
  // Sans-Serif (20)
  | "inter"
  | "roboto"
  | "montserrat"
  | "poppins"
  | "plus_jakarta"
  | "outfit"
  | "raleway"
  | "lato"
  | "open_sans"
  | "dm_sans"
  | "manrope"
  | "work_sans"
  | "sora"
  | "space_grotesk"
  | "lexend"
  | "rubik"
  | "nunito"
  | "urbanist"
  | "jost"
  | "albert_sans"
  // Serif (14)
  | "playfair"
  | "cinzel"
  | "lora"
  | "merriweather"
  | "cormorant"
  | "bodoni_moda"
  | "dm_serif"
  | "prata"
  | "eb_garamond"
  | "libre_baskerville"
  | "abril_fatface"
  | "crimson_pro"
  | "bitter"
  | "castoro"
  // Display & Headlines (16)
  | "bebas"
  | "anton"
  | "righteous"
  | "syne"
  | "oswald"
  | "russo_one"
  | "archivo_black"
  | "bangers"
  | "monoton"
  | "permanent_marker"
  | "fredoka"
  | "press_start"
  | "shrikhand"
  | "luckiest_guy"
  | "black_ops_one"
  | "bungee"
  // Monospace & Code (9)
  | "jetbrains"
  | "fira_code"
  | "space_mono"
  | "source_code_pro"
  | "ibm_plex_mono"
  | "roboto_mono"
  | "dm_mono"
  | "inconsolata"
  | "courier_prime"
  // Cursive & Handwritten (11)
  | "caveat"
  | "pacifico"
  | "dancing_script"
  | "great_vibes"
  | "satisfy"
  | "alex_brush"
  | "sacramento"
  | "kaushan_script"
  | "parisienne"
  | "yellowtail"
  | "shadows_into_light"
  // Futuristic & Cyber (10)
  | "orbitron"
  | "audiowide"
  | "chakra_petch"
  | "rajdhani"
  | "michroma"
  | "bruno_ace"
  | "electrolize"
  | "nova_square"
  | "syne_mono"
  | "teko";

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
    // Sans-Serif
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
    case "dm_sans":
      return "'DM Sans', sans-serif";
    case "manrope":
      return "'Manrope', sans-serif";
    case "work_sans":
      return "'Work Sans', sans-serif";
    case "sora":
      return "'Sora', sans-serif";
    case "space_grotesk":
      return "'Space Grotesk', sans-serif";
    case "lexend":
      return "'Lexend', sans-serif";
    case "rubik":
      return "'Rubik', sans-serif";
    case "nunito":
      return "'Nunito', sans-serif";
    case "urbanist":
      return "'Urbanist', sans-serif";
    case "jost":
      return "'Jost', sans-serif";
    case "albert_sans":
      return "'Albert Sans', sans-serif";

    // Serif
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
    case "bodoni_moda":
      return "'Bodoni Moda', Georgia, serif";
    case "dm_serif":
      return "'DM Serif Display', Georgia, serif";
    case "prata":
      return "'Prata', Georgia, serif";
    case "eb_garamond":
      return "'EB Garamond', Georgia, serif";
    case "libre_baskerville":
      return "'Libre Baskerville', Georgia, serif";
    case "abril_fatface":
      return "'Abril Fatface', Georgia, serif";
    case "crimson_pro":
      return "'Crimson Pro', Georgia, serif";
    case "bitter":
      return "'Bitter', Georgia, serif";
    case "castoro":
      return "'Castoro', Georgia, serif";

    // Display
    case "bebas":
      return "'Bebas Neue', Impact, sans-serif";
    case "anton":
      return "'Anton', Impact, sans-serif";
    case "righteous":
      return "'Righteous', cursive, sans-serif";
    case "syne":
      return "'Syne', sans-serif";
    case "oswald":
      return "'Oswald', sans-serif";
    case "russo_one":
      return "'Russo One', sans-serif";
    case "archivo_black":
      return "'Archivo Black', sans-serif";
    case "bangers":
      return "'Bangers', cursive, sans-serif";
    case "monoton":
      return "'Monoton', cursive, sans-serif";
    case "permanent_marker":
      return "'Permanent Marker', cursive, sans-serif";
    case "fredoka":
      return "'Fredoka', sans-serif";
    case "press_start":
      return "'Press Start 2P', monospace, sans-serif";
    case "shrikhand":
      return "'Shrikhand', cursive, serif";
    case "luckiest_guy":
      return "'Luckiest Guy', cursive, sans-serif";
    case "black_ops_one":
      return "'Black Ops One', cursive, sans-serif";
    case "bungee":
      return "'Bungee', cursive, sans-serif";

    // Monospace
    case "jetbrains":
      return "'JetBrains Mono', monospace";
    case "fira_code":
      return "'Fira Code', monospace";
    case "space_mono":
      return "'Space Mono', monospace";
    case "source_code_pro":
      return "'Source Code Pro', monospace";
    case "ibm_plex_mono":
      return "'IBM Plex Mono', monospace";
    case "roboto_mono":
      return "'Roboto Mono', monospace";
    case "dm_mono":
      return "'DM Mono', monospace";
    case "inconsolata":
      return "'Inconsolata', monospace";
    case "courier_prime":
      return "'Courier Prime', monospace";

    // Cursive
    case "caveat":
      return "'Caveat', cursive";
    case "pacifico":
      return "'Pacifico', cursive";
    case "dancing_script":
      return "'Dancing Script', cursive";
    case "great_vibes":
      return "'Great Vibes', cursive";
    case "satisfy":
      return "'Satisfy', cursive";
    case "alex_brush":
      return "'Alex Brush', cursive";
    case "sacramento":
      return "'Sacramento', cursive";
    case "kaushan_script":
      return "'Kaushan Script', cursive";
    case "parisienne":
      return "'Parisienne', cursive";
    case "yellowtail":
      return "'Yellowtail', cursive";
    case "shadows_into_light":
      return "'Shadows Into Light', cursive";

    // Futuristic
    case "orbitron":
      return "'Orbitron', sans-serif";
    case "audiowide":
      return "'Audiowide', cursive, sans-serif";
    case "chakra_petch":
      return "'Chakra Petch', sans-serif";
    case "rajdhani":
      return "'Rajdhani', sans-serif";
    case "michroma":
      return "'Michroma', sans-serif";
    case "bruno_ace":
      return "'Bruno Ace', cursive, sans-serif";
    case "electrolize":
      return "'Electrolize', sans-serif";
    case "nova_square":
      return "'Nova Square', cursive, sans-serif";
    case "syne_mono":
      return "'Syne Mono', monospace, sans-serif";
    case "teko":
      return "'Teko', sans-serif";

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
  // 1. Social & Communication (16)
  | "facebook"
  | "instagram"
  | "twitter"
  | "whatsapp"
  | "tiktok"
  | "youtube"
  | "linkedin"
  | "spotify"
  | "telegram"
  | "discord"
  | "snapchat"
  | "github"
  | "reddit"
  | "threads"
  | "twitch"
  | "gmail"
  // 2. Commerce, Payments & Travel (10)
  | "paypal"
  | "apple"
  | "google"
  | "stripe"
  | "shopify"
  | "amazon"
  | "visa"
  | "mastercard"
  | "airbnb"
  | "uber"
  // 3. Productivity, Marketing & Business (13)
  | "slack"
  | "notion"
  | "hubspot"
  | "mailchimp"
  | "meta_ads"
  | "google_ads"
  | "salesforce"
  | "semrush"
  | "zapier"
  | "make"
  | "webflow"
  | "wordpress"
  | "google_analytics"
  // 4. AI & Machine Learning (7)
  | "openai"
  | "anthropic"
  | "gemini"
  | "midjourney"
  | "huggingface"
  | "mistral"
  | "deepseek"
  // 5. Sports & Culture Brands (7)
  | "nike"
  | "adidas"
  | "puma"
  | "jordan"
  | "nba"
  | "formula1"
  | "redbull"
  // 6. Tech, Frameworks, Cloud & Languages (43)
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
  | "crypto_btc";

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

// ─── 3. DRAW AUTHENTIC BRAND LOGOS (UNIFIED VECTOR ENGINE) ──────────────────
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
  textTransform: TextTransformType = "uppercase",
  onRedrawNeeded?: () => void
) {
  if (selectedLogo === "none") return;

  const isTransparentBg = bgColor === "transparent";
  const resolvedBgColor = isTransparentBg ? "#0f172a" : bgColor;
  const spec =
    selectedLogo !== "custom" && selectedLogo !== "text"
      ? BRAND_LOGOS[selectedLogo as BrandLogoId]
      : undefined;

  if (!isTransparentBg) {
    // Background badge container
    ctx.save();
    ctx.fillStyle = resolvedBgColor;
    ctx.shadowColor = "rgba(0,0,0,0.18)";
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.roundRect(centerBoxX, centerBoxY, centerBoxSize, centerBoxSize, 8);
    ctx.fill();
    ctx.restore();
  } else if (selectedLogo === "text" || spec) {
    const clean = pixelColor.replace("#", "").trim();
    const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
    let isDarkText = false;
    if (/^[0-9a-fA-F]{6}$/.test(full)) {
      const r = parseInt(full.slice(0, 2), 16) / 255;
      const g = parseInt(full.slice(2, 4), 16) / 255;
      const b = parseInt(full.slice(4, 6), 16) / 255;
      isDarkText = 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.25;
    }
    ctx.save();
    ctx.fillStyle = isDarkText ? "rgba(255,255,255,0.68)" : "rgba(15,23,42,0.28)";
    ctx.beginPath();
    ctx.roundRect(centerBoxX, centerBoxY, centerBoxSize, centerBoxSize, 8);
    ctx.fill();
    ctx.restore();
  }

  if (selectedLogo === "custom" && uploadedLogo) {
    const ImageCtor =
      typeof window !== "undefined"
        ? window.Image
        : typeof Image !== "undefined"
          ? Image
          : null;
    if (!ImageCtor) return;
    const img = new ImageCtor();
    img.crossOrigin = "anonymous";
    img.src = uploadedLogo;
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(
        img,
        centerBoxX + 4,
        centerBoxY + 4,
        centerBoxSize - 8,
        centerBoxSize - 8
      );
    } else {
      img.onload = () => {
        if (onRedrawNeeded) {
          onRedrawNeeded();
        }
      };
    }
    return;
  }

  if (selectedLogo === "text") {
    ctx.fillStyle = pixelColor;
    ctx.font = getCanvasFont(fontSize, fontFamily, fontWeight);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      formatFrameText(centerText, textTransform),
      centerBoxX + centerBoxSize / 2,
      centerBoxY + centerBoxSize / 2
    );
    return;
  }

  if (spec) {
    drawBrandLogoSpec(
      ctx,
      centerBoxX,
      centerBoxY,
      centerBoxSize,
      spec,
      resolvedBgColor,
      onRedrawNeeded
    );
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
  textTransform: TextTransformType = "uppercase",
  options?: AnimatedFrameRenderOptions
) {
  const txt = formatFrameText(frameText || "SCAN ME", textTransform);
  const clampedFontSize = Math.min(22, Math.max(8, fontSize));
  const baseFont = getCanvasFont(clampedFontSize, fontFamily, fontWeight);
  const fontSmall = getCanvasFont(Math.max(8, clampedFontSize - 2), fontFamily, fontWeight);
  const fontCursive = getCanvasFont(
    Math.min(22, clampedFontSize + 2),
    fontFamily === "inter" ? "caveat" : fontFamily,
    fontWeight === "bold" ? "italic" : fontWeight
  );

  if (frame.startsWith("anim_")) {
    drawAnimatedQRFrame(
      ctx,
      frame,
      totalWidth,
      totalHeight,
      frameColor,
      frameText,
      isProPlan,
      timeSec,
      fontFamily,
      clampedFontSize,
      fontWeight,
      textTransform,
      options
    );
    return;
  }

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

      // Gold ribbon CTA with pure txt (defaults to "SCAN ME", auto-fits, max 22px)
      const ribbonText = txt || "SCAN ME";
      ctx.save();
      const goldFont = fontFamily === "inter" ? "cinzel" : fontFamily;
      let activeSize = clampedFontSize;
      ctx.font = getCanvasFont(activeSize, goldFont, fontWeight);
      const maxTextWidth = totalWidth - 64;
      while (ctx.measureText(ribbonText).width > maxTextWidth && activeSize > 8) {
        activeSize -= 1;
        ctx.font = getCanvasFont(activeSize, goldFont, fontWeight);
      }

      const textMetrics = ctx.measureText(ribbonText);
      const ribbonW = Math.min(totalWidth - 36, Math.max(totalWidth * 0.52, textMetrics.width + 36));
      const ribbonH = Math.max(26, Math.min(36, activeSize * 1.8 + 6));
      const ribbonX = (totalWidth - ribbonW) / 2;
      const ribbonY = totalHeight - 32 - ribbonH / 2;

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(ribbonX, ribbonY, ribbonW, ribbonH, 6);
      ctx.fill();

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(ribbonText, totalWidth / 2, ribbonY + ribbonH / 2);
      ctx.restore();
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

    case "corner_brackets": {
      const pad = 12;
      const len = 34;
      const r = 10;
      const x1 = pad;
      const y1 = pad;
      const x2 = totalWidth - pad;
      const y2 = totalHeight - 16;

      ctx.save();
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Top-Left corner
      ctx.beginPath();
      ctx.moveTo(x1 + len, y1);
      ctx.arcTo(x1, y1, x1, y1 + len, r);
      ctx.lineTo(x1, y1 + len);
      ctx.stroke();

      // Top-Right corner
      ctx.beginPath();
      ctx.moveTo(x2 - len, y1);
      ctx.arcTo(x2, y1, x2, y1 + len, r);
      ctx.lineTo(x2, y1 + len);
      ctx.stroke();

      // Bottom-Left corner
      ctx.beginPath();
      ctx.moveTo(x1, y2 - len);
      ctx.arcTo(x1, y2, x1 + len, y2, r);
      ctx.lineTo(x1 + len, y2);
      ctx.stroke();

      // Bottom-Right corner
      ctx.beginPath();
      ctx.moveTo(x2, y2 - len);
      ctx.arcTo(x2, y2, x2 - len, y2, r);
      ctx.lineTo(x2 - len, y2);
      ctx.stroke();

      // Bottom CTA Pill
      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.14, totalHeight - 48, totalWidth * 0.72, 34, 17);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, totalWidth / 2, totalHeight - 31);
      ctx.restore();
      break;
    }

    case "minimal_box": {
      // Ultra-clean thin frame with text embedded directly in the bottom line
      const pad = 10;
      const w = totalWidth - pad * 2;
      const radius = 16;
      ctx.save();
      ctx.font = fontSmall;
      const textW = ctx.measureText(txt).width;
      const gapW = Math.min(w * 0.85, textW + 28);
      const gapX = totalWidth / 2 - gapW / 2;

      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 2.5;

      // Draw rounded rect with cutout on bottom
      ctx.beginPath();
      ctx.moveTo(gapX, totalHeight - pad);
      ctx.lineTo(pad + radius, totalHeight - pad);
      ctx.arcTo(pad, totalHeight - pad, pad, totalHeight - pad - radius, radius);
      ctx.lineTo(pad, pad + radius);
      ctx.arcTo(pad, pad, pad + radius, pad, radius);
      ctx.lineTo(totalWidth - pad - radius, pad);
      ctx.arcTo(totalWidth - pad, pad, totalWidth - pad, pad + radius, radius);
      ctx.lineTo(totalWidth - pad, totalHeight - pad - radius);
      ctx.arcTo(totalWidth - pad, totalHeight - pad, totalWidth - pad - radius, totalHeight - pad, radius);
      ctx.lineTo(gapX + gapW, totalHeight - pad);
      ctx.stroke();

      // Draw embedded text in the cutout gap
      ctx.fillStyle = frameColor;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, totalWidth / 2, totalHeight - pad);
      ctx.restore();
      break;
    }

    case "floating_card": {
      // Minimalist card with subtle divider rule
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 16);
      ctx.stroke();

      // Subtle divider rule
      ctx.save();
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.moveTo(24, totalHeight - 44);
      ctx.lineTo(totalWidth - 24, totalHeight - 44);
      ctx.stroke();
      ctx.restore();

      // Clean typography
      ctx.fillStyle = frameColor;
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`• ${txt} •`, totalWidth / 2, totalHeight - 24);
      break;
    }

    case "double_border": {
      // Outer border
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 16);
      ctx.stroke();

      // Inner border
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(14, 14, totalWidth - 28, totalHeight - 28, 12);
      ctx.stroke();

      // Bottom CTA Pill
      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.14, totalHeight - 46, totalWidth * 0.72, 32, 12);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, totalWidth / 2, totalHeight - 30);
      break;
    }

    case "clean_badge": {
      // Frame with top mini-badge and bottom CTA pill
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 18);
      ctx.stroke();

      // Top badge
      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.28, 14, totalWidth * 0.44, 20, 10);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = fontSmall;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SCAN ME", totalWidth / 2, 24);

      // Bottom CTA pill
      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.12, totalHeight - 46, totalWidth * 0.76, 32, 12);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, totalWidth / 2, totalHeight - 30);
      break;
    }

    case "notched_corners": {
      // Modern chamfered 45° cut corners
      const pad = 8;
      const x = pad;
      const y = pad;
      const w = totalWidth - pad * 2;
      const h = totalHeight - pad * 2;
      const c = 20;

      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 3;
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
      ctx.stroke();

      // Bottom chamfered badge
      const bw = totalWidth * 0.74;
      const bx = (totalWidth - bw) / 2;
      const by = totalHeight - 46;
      const bh = 32;
      const bc = 8;
      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.moveTo(bx + bc, by);
      ctx.lineTo(bx + bw - bc, by);
      ctx.lineTo(bx + bw, by + bc);
      ctx.lineTo(bx + bw, by + bh - bc);
      ctx.lineTo(bx + bw - bc, by + bh);
      ctx.lineTo(bx + bc, by + bh);
      ctx.lineTo(bx, by + bh - bc);
      ctx.lineTo(bx, by + bc);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, totalWidth / 2, totalHeight - 30);
      break;
    }

    case "stamp_border": {
      // Dashed postal border
      ctx.save();
      ctx.setLineDash([8, 6]);
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 14);
      ctx.stroke();
      ctx.restore();

      // Bottom CTA pill
      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.14, totalHeight - 46, totalWidth * 0.72, 32, 10);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = baseFont;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(txt, totalWidth / 2, totalHeight - 30);
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

    // Note: All anim_* frames are intercepted and rendered above via drawAnimatedQRFrame.
    default:
      break;
  }
}

