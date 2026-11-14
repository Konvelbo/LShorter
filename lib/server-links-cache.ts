interface CachedLinksEntry {
  data: any;
  expires: number;
  staleUntil: number;
}

const serverLinksCache = new Map<string, CachedLinksEntry>();
const LINKS_CACHE_TTL_MS = 15_000;
const LINKS_STALE_TTL_MS = 10 * 60 * 1000; // 10 minutes stale fallback on Worker hiccup

export function getCachedLinksPayload(cacheKey: string): any | null {
  const entry = serverLinksCache.get(cacheKey);
  if (entry && entry.expires > Date.now()) {
    return entry.data;
  }
  if (entry && entry.staleUntil <= Date.now()) {
    serverLinksCache.delete(cacheKey);
  }
  return null;
}

export function getStaleCachedLinksPayload(cacheKey: string): any | null {
  const entry = serverLinksCache.get(cacheKey);
  if (entry && entry.staleUntil > Date.now()) {
    return entry.data;
  }
  return null;
}

export function setCachedLinksPayload(cacheKey: string, data: any): void {
  if (serverLinksCache.size > 500) {
    serverLinksCache.clear();
  }
  const now = Date.now();
  serverLinksCache.set(cacheKey, {
    data,
    expires: now + LINKS_CACHE_TTL_MS,
    staleUntil: now + LINKS_STALE_TTL_MS,
  });
}

export function invalidateServerLinksCache(userId?: string | null, userEmail?: string | null): void {
  const idToken = userId ? String(userId).trim() : "";
  const emailToken = userEmail ? String(userEmail).toLowerCase().trim() : "";
  if (!idToken && !emailToken) {
    serverLinksCache.clear();
    return;
  }
  for (const key of serverLinksCache.keys()) {
    if ((idToken && key.includes(idToken)) || (emailToken && key.includes(emailToken))) {
      serverLinksCache.delete(key);
    }
  }
}
