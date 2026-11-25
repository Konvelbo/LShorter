import { LinkMetadata } from "./types";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { mergeLinkWithExtras } from "./link-extras-store";
import { dispatchUserWebhooks } from "./webhooks";

const MAX_CACHE_ENTRIES = 2000;
const FRESH_TTL_MS = 60_000;
const STALE_TTL_MS = 300_000;

interface WorkerLinkCacheEntry {
  link: LinkMetadata | null;
  freshUntil: number;
  expiresAt: number;
}

const globalWorkerStore = globalThis as unknown as {
  __lshorterWorkerLinkCache?: Map<string, WorkerLinkCacheEntry>;
  __lshorterWorkerLinkInFlight?: Map<string, Promise<LinkMetadata | null>>;
};

const workerLinkCache =
  globalWorkerStore.__lshorterWorkerLinkCache ??
  (globalWorkerStore.__lshorterWorkerLinkCache = new Map<string, WorkerLinkCacheEntry>());

const workerLinkInFlight =
  globalWorkerStore.__lshorterWorkerLinkInFlight ??
  (globalWorkerStore.__lshorterWorkerLinkInFlight = new Map<string, Promise<LinkMetadata | null>>());

function setWorkerLinkCache(key: string, link: LinkMetadata | null, ttlMs: number): void {
  if (workerLinkCache.size >= MAX_CACHE_ENTRIES) {
    const oldestKey = workerLinkCache.keys().next().value;
    if (oldestKey !== undefined) workerLinkCache.delete(oldestKey);
  }
  const now = Date.now();
  workerLinkCache.set(key, {
    link,
    freshUntil: now + ttlMs,
    expiresAt: now + (link ? Math.max(ttlMs, STALE_TTL_MS) : ttlMs),
  });
}

export function invalidateWorkerLinkCache(slugOrId?: string): void {
  if (slugOrId) {
    const key = slugOrId.toLowerCase();
    workerLinkCache.delete(key);
    workerLinkInFlight.delete(key);
  } else {
    workerLinkCache.clear();
    workerLinkInFlight.clear();
  }
}

export function incrementWorkerLinkClicks(slugOrId: string): void {
  if (!slugOrId) return;
  const key = slugOrId.toLowerCase();
  const entry = workerLinkCache.get(key);
  if (entry && entry.link) {
    const cur = Number(entry.link.clicks_count || entry.link.clicks || 0);
    const updated = cur + 1;
    entry.link.clicks_count = updated;
    entry.link.clicks = updated;

    if (entry.link.slug && entry.link.slug.toLowerCase() !== key) {
      const slugEntry = workerLinkCache.get(entry.link.slug.toLowerCase());
      if (slugEntry && slugEntry.link) {
        slugEntry.link.clicks_count = updated;
        slugEntry.link.clicks = updated;
      }
    }
    if (entry.link.id && entry.link.id.toLowerCase() !== key) {
      const idEntry = workerLinkCache.get(entry.link.id.toLowerCase());
      if (idEntry && idEntry.link) {
        idEntry.link.clicks_count = updated;
        idEntry.link.clicks = updated;
      }
    }
  }
}

async function fetchWorkerLinkFromNetwork(
  slug: string,
  cacheKey: string,
  bypassCache: boolean,
): Promise<LinkMetadata | null> {
  try {
    const singleUrl = bypassCache
      ? `${WORKER_URL}/api/v1/links/${encodeURIComponent(slug)}?forceRefresh=true&_t=${Date.now()}`
      : `${WORKER_URL}/api/v1/links/${encodeURIComponent(slug)}`;
    const singleRes = await fetch(singleUrl, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    if (singleRes && singleRes.ok) {
      const singleJson = await singleRes.json().catch(() => null);
      const found = singleJson?.data || singleJson;
      if (found && (found.target_url || found.targetUrl)) {
        const merged = mergeLinkWithExtras(found);
        if (cacheKey) {
          setWorkerLinkCache(cacheKey, merged, FRESH_TTL_MS);
        }
        return merged;
      }
    }

    const listRes = await fetch(`${WORKER_URL}/api/v1/links?limit=100`, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    }).catch(() => null);

    if (listRes && listRes.ok) {
      const data = await listRes.json().catch(() => null);
      const list = Array.isArray(data?.data) ? data.data : [];
      const matched =
        list.find(
          (l: any) =>
            l.slug?.toLowerCase() === slug.toLowerCase() || l.id === slug,
        ) || null;
      const merged = matched ? mergeLinkWithExtras(matched) : null;
      if (cacheKey) {
        setWorkerLinkCache(cacheKey, merged, merged ? FRESH_TTL_MS : 3000);
      }
      return merged;
    }
  } catch (err) {
    console.warn("[Worker Link Lookup error]:", err);
  }

  if (cacheKey && !workerLinkCache.has(cacheKey)) {
    setWorkerLinkCache(cacheKey, null, 3000);
  }
  return workerLinkCache.get(cacheKey)?.link ?? null;
}

export async function fetchWorkerLink(
  slug: string,
  bypassCache: boolean = false,
): Promise<LinkMetadata | null> {
  const cacheKey = (slug || "").trim().toLowerCase();
  const now = Date.now();

  if (cacheKey && !bypassCache) {
    const cached = workerLinkCache.get(cacheKey);
    if (cached && now < cached.freshUntil) {
      return cached.link;
    }
    // Stale-while-revalidate: serve immediately in 0ms while refreshing once in background
    if (cached && cached.link && now < cached.expiresAt) {
      if (!workerLinkInFlight.has(cacheKey)) {
        const bgPromise = fetchWorkerLinkFromNetwork(slug, cacheKey, false).finally(() => {
          workerLinkInFlight.delete(cacheKey);
        });
        workerLinkInFlight.set(cacheKey, bgPromise);
      }
      return cached.link;
    }
    // Coalesce concurrent cold lookups for the same slug (prevents thundering herd on parallel assets)
    const inFlight = workerLinkInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }
  }

  const networkPromise = fetchWorkerLinkFromNetwork(slug, cacheKey, bypassCache).finally(() => {
    if (cacheKey) workerLinkInFlight.delete(cacheKey);
  });

  if (cacheKey && !bypassCache) {
    workerLinkInFlight.set(cacheKey, networkPromise);
  }

  return networkPromise;
}

export async function markLinkExpiredAsync(linkIdOrSlug: string, linkMeta?: any): Promise<void> {
  invalidateWorkerLinkCache(linkIdOrSlug);
  if (linkMeta?.slug) {
    invalidateWorkerLinkCache(linkMeta.slug);
  }
  if (linkMeta?.id) {
    invalidateWorkerLinkCache(linkMeta.id);
  }

  try {
    const ownerUserId = String(linkMeta?.userId || linkMeta?.user_id || "");
    if (ownerUserId) {
      dispatchUserWebhooks(ownerUserId, "link.expired", {
        linkId: linkMeta?.id || linkIdOrSlug,
        slug: linkMeta?.slug || linkIdOrSlug,
        expiresAt: linkMeta?.expires_at || linkMeta?.expiresAt || null,
      }).catch(() => {});
    }

    fetch(`${WORKER_URL}/api/v1/links/${encodeURIComponent(linkIdOrSlug)}`, {
      method: "PATCH",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_active: 0, isActive: false }),
    }).catch(() => {});

    // Check Cloudflare D1 target alerts configured for expiration on this link
    try {
      const { executeD1Query } = await import("@/lib/d1-client");
      const alerts = await executeD1Query<any>(
        `SELECT id, user_id, title, channel, notify_email, notify_bell
         FROM target_alerts
         WHERE (link_id = ? OR link_id IN (SELECT id FROM links WHERE slug = ?))
           AND (notify_expired = 1 OR notify_expiration = 1)
           AND (last_notified_at IS NULL OR last_notified_at = '')
         LIMIT 5`,
        [linkIdOrSlug, linkIdOrSlug]
      );

      if (alerts && alerts.length > 0) {
        for (const alert of alerts) {
          await executeD1Query(
            `UPDATE target_alerts SET status = 'expired', last_notified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
            [alert.id]
          ).catch(() => {});

          if (alert.user_id) {
            try {
              const { fetchMutation } = await import("convex/nextjs");
              const { api } = await import("@/convex/_generated/api");
              const linkTitle = linkMeta?.meta_title || linkMeta?.og_title || linkMeta?.title || linkIdOrSlug;
              await fetchMutation(api.notifications.createNotification, {
                orgId: alert.user_id,
                title: `Lien expiré : ${linkTitle}`,
                message: `Votre lien court "${linkTitle}" est arrivé à expiration à cet instant précis. Le trafic est désormais redirigé vers la page d'expiration.`,
                type: "WARNING",
                linkUrl: "/dashboard/links",
              }).catch(() => {});
            } catch {}
          }
        }
      }
    } catch {}
  } catch {}
}
