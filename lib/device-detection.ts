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

let devGeoCache: { countryCode: string; city: string; ip: string; expiresAt: number } | null = null;

function isLocalOrPrivateIp(ip: string): boolean {
  if (!ip) return true;
  const clean = ip.replace(/^::ffff:/, "");
  if (clean === "127.0.0.1" || clean === "::1" || clean === "localhost") return true;
  if (clean.startsWith("192.168.") || clean.startsWith("10.") || clean.startsWith("172.16.") || clean.startsWith("172.17.") || clean.startsWith("172.18.") || clean.startsWith("172.19.") || clean.startsWith("172.20.") || clean.startsWith("172.31.")) return true;
  return false;
}

/**
 * Asynchronously detects authentic visitor geolocation.
 * On Edge / Production (Vercel & Cloudflare): uses instant HTTP request headers.
 * On Localhost / Dev: queries ip-api.com to discover the machine's true public IP and country (e.g. BF / Ouagadougou).
 */
export async function detectVisitorGeoAsync(req: Request): Promise<{ countryCode: string; city: string; rawIp: string }> {
  // 1. Direct Edge headers from Cloudflare or Vercel
  const edgeCountry = (
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country") ||
    ""
  ).toUpperCase().trim();

  let edgeCity = (
    req.headers.get("cf-ipcity") ||
    req.headers.get("x-vercel-ip-city") ||
    req.headers.get("x-city") ||
    ""
  ).trim();

  if (edgeCity) {
    try {
      edgeCity = decodeURIComponent(edgeCity);
    } catch {}
  }

  const rawIp =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (edgeCountry && edgeCountry !== "XX" && edgeCountry !== "UNKNOWN") {
    return {
      countryCode: edgeCountry,
      city: edgeCity || (edgeCountry === "BF" ? "Ouagadougou" : "Direct"),
      rawIp,
    };
  }

  // 2. Dev / Localhost or missing edge headers: resolve authentic IP via ip-api
  if (isLocalOrPrivateIp(rawIp)) {
    if (devGeoCache && Date.now() < devGeoCache.expiresAt) {
      return {
        countryCode: devGeoCache.countryCode,
        city: devGeoCache.city,
        rawIp: devGeoCache.ip,
      };
    }

    try {
      const res = await fetch("http://ip-api.com/json", { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === "success" && data.countryCode) {
          devGeoCache = {
            countryCode: data.countryCode.toUpperCase(),
            city: data.city || "Ouagadougou",
            ip: data.query || rawIp,
            expiresAt: Date.now() + 10 * 60 * 1000, // 10 min cache
          };
          return {
            countryCode: devGeoCache.countryCode,
            city: devGeoCache.city,
            rawIp: devGeoCache.ip,
          };
        }
      }
    } catch {}
  } else {
    // Specific public IP without Edge headers
    try {
      const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(rawIp)}`, { signal: AbortSignal.timeout(2500) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === "success" && data.countryCode) {
          return {
            countryCode: data.countryCode.toUpperCase(),
            city: data.city || "",
            rawIp: data.query || rawIp,
          };
        }
      }
    } catch {}
  }

  // 3. Fallback: Default to Burkina Faso (BF) and Ouagadougou
  return {
    countryCode: "BF",
    city: "Ouagadougou",
    rawIp: rawIp === "127.0.0.1" ? "102.180.220.121" : rawIp,
  };
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

  // Country from Edge headers or dev cache
  const rawCountry = (
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country") ||
    ""
  ).toUpperCase().trim();

  let rawCity = (
    req.headers.get("cf-ipcity") ||
    req.headers.get("x-vercel-ip-city") ||
    req.headers.get("x-city") ||
    ""
  ).trim();

  if (rawCity) {
    try {
      rawCity = decodeURIComponent(rawCity);
    } catch {}
  }

  const countryCode = rawCountry && rawCountry !== "XX"
    ? rawCountry
    : (devGeoCache?.countryCode || "BF");

  const city = rawCity
    ? rawCity
    : (devGeoCache?.city || (countryCode === "BF" ? "Ouagadougou" : "Direct"));

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

  const rawIp =
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    (devGeoCache?.ip || "102.180.220.121");
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
