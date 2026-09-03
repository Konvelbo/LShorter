/**
 * Cloudflare D1 API Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all calls to the Cloudflare Worker backend (links, domains, analytics).
 * User profile data lives in Convex — NOT here.
 */

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";

const SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const apiCache = new Map<string, { data: any; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<any>>();
const CACHE_TTL_MS = 30000; // 30 seconds cache for identical GET queries

export function cfInvalidateCache(pattern?: string) {
  if (!pattern) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  }
}

async function cfFetch<T>(
  browserPath: string,
  workerPath: string,
  method: Method = "GET",
  body?: object
): Promise<T> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser ? browserPath : `${WORKER_URL}${workerPath}`;

  // 1. Cache hit for GET requests
  if (isBrowser && method === "GET") {
    const cached = apiCache.get(url);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data as T;
    }
    // In-flight deduplication (avoids firing multiple identical fetches simultaneously)
    if (inFlightRequests.has(url)) {
      return inFlightRequests.get(url) as Promise<T>;
    }
  }

  // 2. Invalidate cache on mutations
  if (isBrowser && method !== "GET") {
    cfInvalidateCache();
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Only attach secret when on server side
  if (!isBrowser) {
    headers["X-Frontend-Secret"] = SECRET;
  }

  const fetchPromise = (async () => {
    try {
      const res = await fetch(url, {
        method,
        headers,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error((err as any).error || (err as any).message || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as T;

      if (isBrowser && method === "GET") {
        apiCache.set(url, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      }

      if (isBrowser && method !== "GET") {
        window.dispatchEvent(new CustomEvent("lshorter_data_change"));
      }

      return data;
    } catch (err: any) {
      console.warn(`[Cloudflare API Client] ${method} ${url}:`, err?.message || err);
      if (method === "GET") {
        return { success: true, data: [] } as unknown as T;
      }
      throw err;
    } finally {
      if (isBrowser && method === "GET") {
        inFlightRequests.delete(url);
      }
    }
  })();

  if (isBrowser && method === "GET") {
    inFlightRequests.set(url, fetchPromise);
  }

  return fetchPromise;
}

// ─── Links ────────────────────────────────────────────────────────────────────
export async function cfGetLinks(userId: string) {
  return cfFetch<{ success: true; data: any[] }>(
    `/api/links?userId=${userId}`,
    `/api/v1/links?userId=${userId}`
  );
}

export async function cfUploadImage(base64OrFile: string | File): Promise<{ success: boolean; url: string }> {
  try {
    if (typeof base64OrFile === "string" && base64OrFile.startsWith("data:")) {
      const res = await fetch("https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/upload-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: base64OrFile, image: base64OrFile, base64: base64OrFile }),
      });
      return await res.json();
    } else {
      const formData = new FormData();
      formData.append("file", base64OrFile);
      formData.append("data", base64OrFile);
      const res = await fetch("https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/upload-image", {
        method: "POST",
        body: formData,
      });
      return await res.json();
    }
  } catch (err) {
    console.error("Image upload failed:", err);
    return { success: false, url: "" };
  }
}

export async function cfCreateLink(data: {
  userId: string;
  userEmail?: string;
  userName?: string;
  domainName?: string;
  slug?: string;
  targetUrl: string;
  target_url?: string;
  domainId?: string;
  geoTargeting?: any;
  geo_targeting?: any;
  deviceTargeting?: any;
  device_targeting?: any;
  routingRules?: any[];
  routing_rules?: any[];
  password?: string;
  isCloaked?: boolean;
  is_cloaked?: boolean | number;
  hideReferrer?: boolean;
  hide_referrer?: boolean | number;
  metaTitle?: string;
  meta_title?: string;
  ogTitle?: string;
  og_title?: string;
  ogDescription?: string;
  og_description?: string;
  ogImage?: string;
  og_image?: string;
  tags?: string[];
  expiresAt?: string;
  expires_at?: string;
  maxClicks?: number;
  max_clicks?: number;
  fallbackUrl?: string;
  fallback_url?: string;
  abVariations?: any[];
  mainWeight?: number;
  isActive?: boolean;
  is_active?: number;
  userPlan?: string;
  plan?: string;
}) {
  const payload: any = {
    userId: data.userId,
    targetUrl: data.targetUrl || data.target_url,
    target_url: data.targetUrl || data.target_url,
    domain: data.domainName || undefined,
    domainName: data.domainName || undefined,
    slug: data.slug ? data.slug.trim() : undefined,
    geoTargeting: data.geoTargeting || data.geo_targeting || undefined,
    deviceTargeting: data.deviceTargeting || data.device_targeting || undefined,
    routingRules: data.routingRules || data.routing_rules || undefined,
    hideReferrer: Boolean(data.hideReferrer || data.hide_referrer),
    metaTitle: data.metaTitle || data.meta_title || data.ogTitle,
    ogTitle: data.ogTitle || data.og_title,
    ogDescription: data.ogDescription || data.og_description,
    ogImage: data.ogImage || data.og_image,
    expiresAt: data.expiresAt || data.expires_at,
    maxClicks: data.maxClicks !== undefined ? data.maxClicks : data.max_clicks,
    fallbackUrl: data.fallbackUrl || data.fallback_url,
    isActive: data.isActive !== false && data.is_active !== 0,
    tags: data.tags && data.tags.length ? data.tags : undefined,
    userPlan: data.userPlan || data.plan || "PRO",
    plan: data.userPlan || data.plan || "PRO",
  };

  if (data.isCloaked || data.is_cloaked === 1 || data.is_cloaked === true) {
    payload.isCloaked = true;
    payload.is_cloaked = 1;
  } else {
    payload.isCloaked = false;
  }

  if (data.password && data.password.trim()) {
    payload.password = data.password.trim();
  }

  return cfFetch<{ success: true; data: any }>(
    "/api/links",
    "/api/v1/links",
    "POST",
    payload
  );
}

export async function cfUpdateLink(id: string, updates: any) {
  const payload: any = {
    ...updates,
    target_url: updates.target_url || updates.targetUrl,
    geo_targeting: updates.geo_targeting !== undefined ? updates.geo_targeting : updates.geoTargeting,
    device_targeting: updates.device_targeting !== undefined ? updates.device_targeting : updates.deviceTargeting,
    routing_rules: updates.routing_rules !== undefined ? updates.routing_rules : updates.routingRules,
    hide_referrer: updates.hide_referrer !== undefined ? updates.hide_referrer : updates.hideReferrer !== undefined ? (updates.hideReferrer ? 1 : 0) : undefined,
    og_title: updates.og_title || updates.ogTitle,
    meta_title: updates.meta_title || updates.metaTitle,
    og_description: updates.og_description || updates.ogDescription,
    og_image: updates.og_image || updates.ogImage,
    expires_at: updates.expires_at || updates.expiresAt,
    max_clicks: updates.max_clicks !== undefined ? updates.max_clicks : updates.maxClicks,
    fallback_url: updates.fallback_url || updates.fallbackUrl,
    is_active: updates.is_active !== undefined ? updates.is_active : updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : undefined,
    userPlan: updates.userPlan || updates.plan || "PRO",
    plan: updates.userPlan || updates.plan || "PRO",
  };

  if (updates.isCloaked !== undefined || updates.is_cloaked !== undefined) {
    if (updates.isCloaked || updates.is_cloaked) {
      payload.is_cloaked = 1;
    } else {
      payload.is_cloaked = 0;
    }
  }

  if (updates.password && updates.password.trim()) {
    payload.password = updates.password.trim();
  } else if (updates.password === "" || updates.password === null) {
    delete payload.password;
  }

  return cfFetch<{ success: true; data: any }>(
    `/api/links/${id}`,
    `/api/v1/links/${id}`,
    "PATCH",
    payload
  );
}

export async function cfDeleteLink(id: string, userId?: string) {
  const query = userId ? `?userId=${userId}` : "";
  return cfFetch<{ success: true }>(
    `/api/links/${id}${query}`,
    `/api/v1/links/${id}${query}`,
    "DELETE"
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function cfGetAnalytics(userId: string, period = "30d", linkId?: string) {
  const linkParam = linkId && linkId !== "all" ? `&linkId=${linkId}` : "";
  return cfFetch<{ success: true; data: any }>(
    `/api/analytics?userId=${userId}&period=${period}${linkParam}`,
    `/api/v1/analytics?userId=${userId}&period=${period}${linkParam}`
  );
}

// ─── Domains ──────────────────────────────────────────────────────────────────
export async function cfGetDomains(userId: string) {
  return cfFetch<{ success: true; data: any[] }>(
    `/api/domains?userId=${userId}`,
    `/api/v1/domains?userId=${userId}`
  );
}

export async function cfAddDomain(data: { userId: string; domain: string }) {
  return cfFetch<{ success: true; data: any }>(
    "/api/domains",
    "/api/v1/domains",
    "POST",
    data
  );
}

export async function cfDeleteDomain(id: string, userId?: string) {
  const query = userId ? `?userId=${userId}` : "";
  return cfFetch<{ success: true }>(
    `/api/domains?id=${id}${userId ? `&userId=${userId}` : ""}`,
    `/api/v1/domains/${id}${query}`,
    "DELETE"
  );
}

// ─── API Keys ─────────────────────────────────────────────────────────────────
export async function cfGetApiKeys(userId: string) {
  return cfFetch<{ success: true; data: any[] }>(
    `/api/keys?userId=${userId}`,
    `/api/v1/api-keys?userId=${userId}`
  );
}

export async function cfCreateApiKey(data: { userId: string; name: string; scope?: string }) {
  return cfFetch<{ success: true; data: any }>(
    `/api/keys?userId=${data.userId}`,
    "/api/v1/api-keys",
    "POST",
    data
  );
}

export async function cfRevokeApiKey(id: string) {
  return cfFetch<{ success: true }>(
    `/api/keys/${id}`,
    `/api/v1/api-keys/${id}`,
    "DELETE"
  );
}

// ─── User sync (called once on first login) ───────────────────────────────────
export async function cfSyncUser(data: {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider?: string;
}) {
  return cfFetch<{ success: true; data: any }>(
    "/api/user/sync",
    "/api/v1/users/sync",
    "POST",
    data
  );
}


export const EMPTY_ANALYTICS = {
  totalClicks: 0,
  clicksGrowth: 0,
  uniqueClicks: 0,
  uniqueClicksGrowth: 0,
  trackedRevenue: 0,
  revenueGrowth: 0,
  avgCtr: 0,
  ctrGrowth: 0,
  bounceRate: 0,
  epc: 0,
  avgEngagementTime: "0s",
  clicksByDay: [],
  topCountries: [],
  topCities: [],
  topDevices: [],
  topBrowsers: [],
  topReferrers: [],
  liveClickEvents: [],
  recentConversions: [],
};
