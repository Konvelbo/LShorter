import { LinkMetadata, VisitorGeo } from "./types";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { detectVisitorGeoAsync } from "./geo";
import { parseUserAgent } from "./device";
import { dispatchUserWebhooks } from "./webhooks";
import { incrementWorkerLinkClicks } from "./worker-client";

// In-memory sliding-window click deduplication cache (per-IP + per-slug, 1200ms)
const clickDedupCache = new Map<string, number>();

export function shouldTrackClick(
  clientIp: string,
  slug: string,
  isPrefetch: boolean = false,
): boolean {
  if (isPrefetch) return false;
  const key = `${clientIp}:${slug.toLowerCase()}`;
  const now = Date.now();
  const lastClick = clickDedupCache.get(key) || 0;

  if (now - lastClick < 1200) {
    return false;
  }
  clickDedupCache.set(key, now);

  if (clickDedupCache.size > 2000) {
    const expiredCutoff = now - 10000;
    clickDedupCache.forEach((timestamp, k) => {
      if (timestamp < expiredCutoff) clickDedupCache.delete(k);
    });
  }
  return true;
}

export async function trackClickAsync(
  req: Request,
  slug: string,
  meta: LinkMetadata,
  geo?: VisitorGeo,
  resolvedDestination?: string,
): Promise<void> {
  const referer = req.headers.get("referer") || "";
  const userAgent = req.headers.get("user-agent") || "";
  const linkId = meta?.id || slug;
  const userId = String(meta?.userId || meta?.user_id || "");

  // Detect true referrer when in-app mobile browsers (Instagram, Facebook, TikTok, etc.) strip the Referer header
  let resolvedReferrer = referer;
  const uaLower = userAgent.toLowerCase();
  if (!resolvedReferrer || resolvedReferrer.toLowerCase() === "direct") {
    try {
      const reqUrl = new URL(req.url);
      const utmSource = (reqUrl.searchParams.get("utm_source") || "").toLowerCase();
      if (reqUrl.searchParams.has("igshid") || utmSource === "instagram" || uaLower.includes("instagram")) {
        resolvedReferrer = "Instagram";
      } else if (reqUrl.searchParams.has("fbclid") || utmSource === "facebook" || uaLower.includes("fban") || uaLower.includes("fbav") || uaLower.includes("fb_iab")) {
        resolvedReferrer = "Facebook";
      } else if (reqUrl.searchParams.has("ttclid") || utmSource === "tiktok" || uaLower.includes("tiktok") || uaLower.includes("musical_ly") || uaLower.includes("bytedance")) {
        resolvedReferrer = "TikTok";
      } else if (reqUrl.searchParams.has("twclid") || utmSource === "twitter" || utmSource === "x" || uaLower.includes("twitter") || uaLower.includes("tweetie")) {
        resolvedReferrer = "Twitter / X";
      } else if (utmSource === "threads" || uaLower.includes("threads")) {
        resolvedReferrer = "Threads";
      } else if (utmSource === "linkedin" || uaLower.includes("linkedin")) {
        resolvedReferrer = "LinkedIn";
      } else if (utmSource === "youtube" || uaLower.includes("youtube")) {
        resolvedReferrer = "YouTube";
      } else if (utmSource === "whatsapp" || uaLower.includes("whatsapp")) {
        resolvedReferrer = "WhatsApp";
      } else if (utmSource === "telegram" || uaLower.includes("telegram")) {
        resolvedReferrer = "Telegram";
      } else if (utmSource === "pinterest" || uaLower.includes("pinterest")) {
        resolvedReferrer = "Pinterest";
      } else if (utmSource === "snapchat" || uaLower.includes("snapchat")) {
        resolvedReferrer = "Snapchat";
      } else if (utmSource === "reddit" || uaLower.includes("reddit")) {
        resolvedReferrer = "Reddit";
      } else if (utmSource === "discord" || uaLower.includes("discord")) {
        resolvedReferrer = "Discord";
      } else if (utmSource === "bluesky" || uaLower.includes("bluesky")) {
        resolvedReferrer = "Bluesky";
      } else if (utmSource === "spotify" || uaLower.includes("spotify")) {
        resolvedReferrer = "Spotify";
      } else if (utmSource === "wechat" || uaLower.includes("micromessenger")) {
        resolvedReferrer = "WeChat";
      } else if (utmSource === "line" || uaLower.includes("line/")) {
        resolvedReferrer = "Line";
      } else if (reqUrl.searchParams.has("gclid") || utmSource === "google") {
        resolvedReferrer = "Google";
      } else if (reqUrl.searchParams.has("msclkid") || utmSource === "bing") {
        resolvedReferrer = "Bing";
      }
    } catch {
      if (uaLower.includes("instagram")) resolvedReferrer = "Instagram";
      else if (uaLower.includes("fban") || uaLower.includes("fbav") || uaLower.includes("fb_iab")) resolvedReferrer = "Facebook";
      else if (uaLower.includes("tiktok") || uaLower.includes("musical_ly")) resolvedReferrer = "TikTok";
      else if (uaLower.includes("twitter") || uaLower.includes("tweetie")) resolvedReferrer = "Twitter / X";
      else if (uaLower.includes("threads")) resolvedReferrer = "Threads";
    }
  }

  if (!resolvedReferrer) {
    resolvedReferrer = "Direct";
  }

  // Update in-memory click count immediately so rapid subsequent requests honor max_clicks
  if (slug) incrementWorkerLinkClicks(slug);
  if (meta?.id && meta.id !== slug) incrementWorkerLinkClicks(meta.id);

  let resolvedGeo = geo;
  if (!resolvedGeo || !resolvedGeo.countryCode || resolvedGeo.countryCode === "XX") {
    try {
      resolvedGeo = await detectVisitorGeoAsync(req);
    } catch {}
  }

  const country = (resolvedGeo?.countryCode && resolvedGeo.countryCode !== "XX") ? resolvedGeo.countryCode.toUpperCase() : "XX";
  const city = resolvedGeo?.city || "";
  const ua = parseUserAgent(userAgent);

  fetch(`${WORKER_URL}/api/v1/links/${encodeURIComponent(linkId)}/click`, {
    method: "POST",
    headers: {
      "X-Frontend-Secret": FRONTEND_SECRET,
      Authorization: `Bearer ${FRONTEND_SECRET}`,
      "Content-Type": "application/json",
      "User-Agent": userAgent,
      "CF-IPCountry": country,
      "X-Country": country,
      "X-City": city,
      "X-Referrer": resolvedReferrer,
      Referer: referer || resolvedReferrer,
    },
    body: JSON.stringify({
      slug,
      country,
      city,
      referer: referer || resolvedReferrer,
      referrer: resolvedReferrer,
      userAgent,
      timestamp: Date.now(),
    }),
  }).catch((err) => {
    console.warn("[Background Click Tracking Warning]:", err);
  });

  if (userId) {
    const baseEventData = {
      clickId: `clk_${Date.now().toString(36)}`,
      linkId,
      slug,
      destination: resolvedDestination || meta?.target_url || meta?.targetUrl || "",
      geo: { country, city: city || "Unknown" },
      device: ua.device,
      browser: ua.browser,
      os: ua.os,
    };
    dispatchUserWebhooks(userId, "click.created", baseEventData).catch(() => {});

    try {
      const reqUrl = new URL(req.url);
      const isQrScan =
        reqUrl.searchParams.get("qr") === "1" ||
        reqUrl.searchParams.get("source")?.toLowerCase() === "qr" ||
        reqUrl.searchParams.get("utm_medium")?.toLowerCase() === "qr";
      if (isQrScan) {
        dispatchUserWebhooks(userId, "qr.scanned", baseEventData).catch(() => {});
      }
    } catch {}

    const maxClicks = Number(meta?.maxClicks ?? meta?.max_clicks ?? 0);
    const nextClicks = Number(meta?.clicks_count ?? meta?.clicks ?? 0) + 1;
    if (maxClicks > 0 && nextClicks >= maxClicks) {
      dispatchUserWebhooks(userId, "link.limit_reached", {
        ...baseEventData,
        clicksCount: nextClicks,
        maxClicks,
      }).catch(() => {});
    }
  }
}
