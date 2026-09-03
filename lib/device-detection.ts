/**
 * Intelligent Device & Operating System Detection Engine
 * Accurately parses User-Agent strings, fallback fields, and device/browser characteristics.
 */

export interface DetectedClientInfo {
  os: string;
  browser: string;
  device: "desktop" | "mobile" | "tablet";
}

export function detectOSFromEvent(ev: {
  os?: string;
  user_agent?: string;
  userAgent?: string;
  device?: string;
  browser?: string;
}): string {
  // 1. Direct explicit OS field if valid
  if (ev.os && ev.os.trim() && ev.os.toLowerCase() !== "inconnu" && ev.os.toLowerCase() !== "unknown") {
    const raw = ev.os.trim();
    if (/win/i.test(raw)) return "Windows";
    if (/mac|osx/i.test(raw)) return "macOS";
    if (/ios|iphone|ipad/i.test(raw)) return "iOS";
    if (/android/i.test(raw)) return "Android";
    if (/linux/i.test(raw)) return "Linux";
    return raw;
  }

  // 2. Parse User-Agent string
  const ua = (ev.user_agent || ev.userAgent || "").toLowerCase();
  if (ua) {
    if (
      ua.includes("windows nt 10.0") ||
      ua.includes("windows nt 11.0") ||
      ua.includes("windows") ||
      ua.includes("win64") ||
      ua.includes("wow64")
    ) {
      return "Windows";
    }
    if (ua.includes("iphone") || ua.includes("ipod") || ua.includes("ipad")) {
      return "iOS";
    }
    if (ua.includes("android")) {
      return "Android";
    }
    if (ua.includes("macintosh") || ua.includes("mac os x") || ua.includes("macos")) {
      return "macOS";
    }
    if (ua.includes("cros")) {
      return "ChromeOS";
    }
    if (ua.includes("linux") && !ua.includes("android")) {
      if (ua.includes("ubuntu")) return "Ubuntu Linux";
      return "Linux";
    }
  }

  // 3. Heuristic deduction based on device format and browser
  const dev = (ev.device || "").toLowerCase();
  const browser = (ev.browser || "").toLowerCase();

  if (dev.includes("mobile") || dev.includes("smart") || dev.includes("phone")) {
    if (browser.includes("safari") || browser.includes("apple") || browser.includes("ios")) {
      return "iOS";
    }
    return "Android";
  }

  if (dev.includes("tablet") || dev.includes("pad")) {
    if (browser.includes("safari")) {
      return "iPadOS";
    }
    return "Android";
  }

  if (dev.includes("desktop") || dev.includes("pc")) {
    if (browser.includes("safari") && !browser.includes("chrome")) {
      return "macOS";
    }
    return "Windows";
  }

  // Default fallback for unidentified edge clicks
  if (browser.includes("safari") && !browser.includes("chrome")) {
    return "iOS";
  }
  return "Windows";
}
