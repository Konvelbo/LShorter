import { LinkMetadata, VisitorGeo } from "./types";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

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
): Promise<void> {
  const referer = req.headers.get("referer") || "";
  const userAgent = req.headers.get("user-agent") || "";
  const linkId = meta?.id || slug;
  const country = geo?.countryCode || "XX";
  const city = geo?.city || "";

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
}
