import { LinkMetadata, VisitorGeo } from "./types";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { detectVisitorGeoAsync } from "./geo";
import { parseUserAgent } from "./device";
import { dispatchUserWebhooks } from "./webhooks";

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
      Referer: referer,
    },
    body: JSON.stringify({
      slug,
      country,
      city,
      referer,
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
