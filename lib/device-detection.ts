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

export interface VisitorDetails {
  device: "desktop" | "mobile" | "tablet";
  browser: string;
  os: string;
  countryCode: string;
  city: string;
  referrer: string;
  ipMasked: string;
}

export function parseVisitorDetails(req: Request): VisitorDetails {
  const userAgent = req.headers.get("user-agent") || "";
  const ua = userAgent.toLowerCase();

  // Device
  let device: "desktop" | "mobile" | "tablet" = "desktop";
  if (/ipad|tablet|(android(?!.*mobile))/i.test(ua)) {
    device = "tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    device = "mobile";
  }

  // OS
  const os = detectOSFromEvent({ user_agent: userAgent, device });

  // Browser
  let browser = "Chrome";
  if (ua.includes("edg/") || ua.includes("edge/")) browser = "Edge";
  else if (ua.includes("opr/") || ua.includes("opera/")) browser = "Opera";
  else if (ua.includes("firefox/") || ua.includes("fxios/")) browser = "Firefox";
  else if (ua.includes("safari/") && !ua.includes("chrome/")) browser = "Safari";
  else if (ua.includes("chrome/") || ua.includes("crios/")) browser = "Chrome";

  // Country
  const countryCode = (
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country") ||
    ""
  ).toUpperCase() || "FR";

  // City
  const city = (
    req.headers.get("cf-ipcity") ||
    req.headers.get("x-vercel-ip-city") ||
    req.headers.get("x-city") ||
    ""
  ) || "Paris";

  // Referrer
  const rawReferrer = req.headers.get("referer") || "Direct";
  let referrer = "Direct";
  if (rawReferrer && rawReferrer !== "Direct") {
    try {
      const u = new URL(rawReferrer);
      const host = u.hostname.replace(/^www\./, "");
      if (host.includes("google")) referrer = "Google";
      else if (host.includes("twitter") || host.includes("x.com") || host.includes("t.co")) referrer = "Twitter / X";
      else if (host.includes("linkedin")) referrer = "LinkedIn";
      else if (host.includes("facebook") || host.includes("fb.com")) referrer = "Facebook";
      else if (host.includes("discord")) referrer = "Discord";
      else if (host.includes("telegram") || host.includes("t.me")) referrer = "Telegram";
      else if (host.includes("instagram")) referrer = "Instagram";
      else if (host.includes("youtube")) referrer = "YouTube";
      else referrer = host;
    } catch {
      referrer = rawReferrer;
    }
  }

  const rawIp = req.headers.get("cf-connecting-ip") || req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "194.254.12.84";
  const ipMasked = rawIp.replace(/\.\d+\.\d+$/, ".•••.•••");

  return {
    device,
    browser,
    os,
    countryCode,
    city,
    referrer,
    ipMasked,
  };
}
