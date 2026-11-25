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
  if (
    ev.os &&
    ev.os.trim() &&
    ev.os.toLowerCase() !== "inconnu" &&
    ev.os.toLowerCase() !== "unknown" &&
    ev.os.toLowerCase() !== "other"
  ) {
    const raw = ev.os.trim();
    if (/win/i.test(raw)) return "Windows";
    if (/mac|osx/i.test(raw)) return "macOS";
    if (/ios|iphone|ipad/i.test(raw)) return "iOS";
    if (/android/i.test(raw)) return "Android";
    if (/linux/i.test(raw)) return "Linux";
    return raw;
  }

  // 2. Parse User-Agent string if available
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

  // No hardcoded OS guessing when OS and User-Agent are unknown
  return "Unknown";
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
 * On Localhost / Dev: queries ip-api.com / country.is to discover the machine's true public IP and country.
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
      city: edgeCity || "",
      rawIp,
    };
  }

  // 2. Dev / Localhost or missing edge headers: resolve authentic IP via ip-api or country.is
  if (isLocalOrPrivateIp(rawIp)) {
    if (devGeoCache && Date.now() < devGeoCache.expiresAt) {
      return {
        countryCode: devGeoCache.countryCode,
        city: devGeoCache.city,
        rawIp: devGeoCache.ip,
      };
    }

    try {
      const res = await fetch("http://ip-api.com/json", { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === "success" && data.countryCode) {
          devGeoCache = {
            countryCode: data.countryCode.toUpperCase(),
            city: data.city || data.regionName || "",
            ip: data.query || rawIp,
            expiresAt: Date.now() + 15 * 60 * 1000,
          };
          return {
            countryCode: devGeoCache.countryCode,
            city: devGeoCache.city,
            rawIp: devGeoCache.ip,
          };
        }
      }
    } catch {}

    try {
      const resFallback = await fetch("https://api.country.is/", { signal: AbortSignal.timeout(1500) });
      if (resFallback.ok) {
        const fData = await resFallback.json();
        if (fData?.country) {
          devGeoCache = {
            countryCode: fData.country.toUpperCase(),
            city: fData.city || "",
            ip: fData.ip || rawIp,
            expiresAt: Date.now() + 15 * 60 * 1000,
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
      const res = await fetch(`http://ip-api.com/json/${encodeURIComponent(rawIp)}`, { signal: AbortSignal.timeout(2000) });
      if (res.ok) {
        const data = await res.json();
        if (data && data.status === "success" && data.countryCode) {
          return {
            countryCode: data.countryCode.toUpperCase(),
            city: data.city || data.regionName || "",
            rawIp: data.query || rawIp,
          };
        }
      }
    } catch {}
  }

  // 3. No hardcoded country/city if unreachable
  return {
    countryCode: "XX",
    city: "",
    rawIp,
  };
}

export function parseVisitorDetails(
  req: Request,
  geoOverride?: { countryCode?: string; city?: string; rawIp?: string }
): VisitorDetails {
  const userAgent = req.headers.get("user-agent") || "";
  const ua = userAgent.toLowerCase();

  // Device
  let device: "desktop" | "mobile" | "tablet" = "desktop";
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) {
    device = "tablet";
  } else if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(ua)) {
    device = "mobile";
  }

  // OS
  const os = detectOSFromEvent({ user_agent: userAgent, device });

  // Browser
  let browser = "Other";
  if (ua.includes("edg/") || ua.includes("edge/")) browser = "Edge";
  else if (ua.includes("opr/") || ua.includes("opera/")) browser = "Opera";
  else if (ua.includes("samsungbrowser")) browser = "Samsung";
  else if (ua.includes("brave")) browser = "Brave";
  else if (ua.includes("vivaldi")) browser = "Vivaldi";
  else if (ua.includes("arc/")) browser = "Arc";
  else if (ua.includes("duckduckgo") || ua.includes("ddg/")) browser = "DuckDuckGo";
  else if (ua.includes("yabrowser")) browser = "Yandex";
  else if (ua.includes("firefox/") || ua.includes("fxios/")) browser = "Firefox";
  else if (ua.includes("chrome/") || ua.includes("chromium/") || ua.includes("crios/")) browser = "Chrome";
  else if (ua.includes("safari/")) browser = "Safari";
  else if (ua.includes("curl/")) browser = "Curl";
  else if (ua.includes("postman")) browser = "Postman";

  // Country from Edge headers, geoOverride or dev cache
  const rawCountry = (
    geoOverride?.countryCode ||
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country") ||
    ""
  ).toUpperCase().trim();

  let rawCity = (
    geoOverride?.city ||
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

  const countryCode = rawCountry && rawCountry !== "XX" && rawCountry !== "UNKNOWN"
    ? rawCountry
    : (devGeoCache?.countryCode || "XX");

  const city = rawCity
    ? rawCity
    : (devGeoCache?.city || "");

  // Referrer
  const rawReferrer = req.headers.get("referer") || "Direct";
  let referrer = "Direct";
  if (rawReferrer && rawReferrer !== "Direct") {
    try {
      const u = new URL(rawReferrer);
      const host = u.hostname.replace(/^www\./, "");
      if (host.includes("google")) referrer = "Google";
      else if (host.includes("twitter") || host.includes("x.com") || host.includes("t.co")) referrer = "Twitter / X";
      else if (host.includes("linkedin") || host.includes("lnkd.in")) referrer = "LinkedIn";
      else if (host.includes("facebook") || host.includes("fb.com") || host.includes("fb.me")) referrer = "Facebook";
      else if (host.includes("instagram") || host.includes("instagr.am")) referrer = "Instagram";
      else if (host.includes("youtube") || host.includes("youtu.be")) referrer = "YouTube";
      else if (host.includes("whatsapp") || host.includes("wa.me")) referrer = "WhatsApp";
      else if (host.includes("tiktok")) referrer = "TikTok";
      else if (host.includes("reddit") || host.includes("redd.it")) referrer = "Reddit";
      else if (host.includes("discord")) referrer = "Discord";
      else if (host.includes("telegram") || host.includes("t.me")) referrer = "Telegram";
      else if (host.includes("pinterest") || host.includes("pin.it")) referrer = "Pinterest";
      else if (host.includes("threads.net")) referrer = "Threads";
      else if (host.includes("github")) referrer = "GitHub";
      else if (host.includes("bsky.app") || host.includes("bluesky")) referrer = "Bluesky";
      else if (host.includes("spotify")) referrer = "Spotify";
      else if (host.includes("twitch.tv")) referrer = "Twitch";
      else if (host.includes("snapchat")) referrer = "Snapchat";
      else if (host.includes("slack.com")) referrer = "Slack";
      else if (host.includes("medium.com")) referrer = "Medium";
      else if (host.includes("substack.com")) referrer = "Substack";
      else if (host.includes("quora.com")) referrer = "Quora";
      else if (host.includes("tumblr.com")) referrer = "Tumblr";
      else if (host.includes("wechat") || host.includes("weixin")) referrer = "WeChat";
      else if (host.includes("line.me")) referrer = "Line";
      else if (host.includes("duckduckgo")) referrer = "DuckDuckGo";
      else if (host.includes("bing")) referrer = "Bing";
      else referrer = host;
    } catch {
      referrer = rawReferrer;
    }
  }

  // Fallback to User-Agent & query params when in-app mobile browsers strip the Referer header
  if (referrer === "Direct" || !referrer) {
    try {
      const reqUrl = new URL(req.url);
      const utmSource = (reqUrl.searchParams.get("utm_source") || "").toLowerCase();
      if (reqUrl.searchParams.has("igshid") || utmSource === "instagram" || ua.includes("instagram")) {
        referrer = "Instagram";
      } else if (reqUrl.searchParams.has("fbclid") || utmSource === "facebook" || ua.includes("fban") || ua.includes("fbav") || ua.includes("fb_iab")) {
        referrer = "Facebook";
      } else if (reqUrl.searchParams.has("ttclid") || utmSource === "tiktok" || ua.includes("tiktok") || ua.includes("musical_ly") || ua.includes("bytedance")) {
        referrer = "TikTok";
      } else if (reqUrl.searchParams.has("twclid") || utmSource === "twitter" || utmSource === "x" || ua.includes("twitter") || ua.includes("tweetie")) {
        referrer = "Twitter / X";
      } else if (utmSource === "threads" || ua.includes("threads")) {
        referrer = "Threads";
      } else if (utmSource === "linkedin" || ua.includes("linkedin")) {
        referrer = "LinkedIn";
      } else if (utmSource === "youtube" || ua.includes("youtube")) {
        referrer = "YouTube";
      } else if (utmSource === "whatsapp" || ua.includes("whatsapp")) {
        referrer = "WhatsApp";
      } else if (utmSource === "telegram" || ua.includes("telegram")) {
        referrer = "Telegram";
      } else if (utmSource === "pinterest" || ua.includes("pinterest")) {
        referrer = "Pinterest";
      } else if (utmSource === "snapchat" || ua.includes("snapchat")) {
        referrer = "Snapchat";
      } else if (utmSource === "reddit" || ua.includes("reddit")) {
        referrer = "Reddit";
      } else if (utmSource === "discord" || ua.includes("discord")) {
        referrer = "Discord";
      } else if (utmSource === "bluesky" || ua.includes("bluesky")) {
        referrer = "Bluesky";
      } else if (utmSource === "spotify" || ua.includes("spotify")) {
        referrer = "Spotify";
      } else if (utmSource === "wechat" || ua.includes("micromessenger")) {
        referrer = "WeChat";
      } else if (utmSource === "line" || ua.includes("line/")) {
        referrer = "Line";
      } else if (reqUrl.searchParams.has("gclid") || utmSource === "google") {
        referrer = "Google";
      } else if (reqUrl.searchParams.has("msclkid") || utmSource === "bing") {
        referrer = "Bing";
      }
    } catch {
      if (ua.includes("instagram")) referrer = "Instagram";
      else if (ua.includes("fban") || ua.includes("fbav") || ua.includes("fb_iab")) referrer = "Facebook";
      else if (ua.includes("tiktok") || ua.includes("musical_ly")) referrer = "TikTok";
      else if (ua.includes("twitter") || ua.includes("tweetie")) referrer = "Twitter / X";
      else if (ua.includes("threads")) referrer = "Threads";
    }
  }

  const rawIp =
    geoOverride?.rawIp ||
    req.headers.get("cf-connecting-ip") ||
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    (devGeoCache?.ip || "127.0.0.1");
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
