/**
 * Cloudflare D1 API Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all calls to the Cloudflare Worker backend (links, domains, analytics).
 * User profile data lives in Convex — NOT here.
 */

import { compressImageFile } from "./image-compress";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";

const SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const apiCache = new Map<string, { data: any; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<any>>();
// Cache GET responses for 2 minutes to eliminate repeated queries and preserve Cloudflare quota limits
const CACHE_TTL_MS = 120000;

export function sanitizeClientError(raw: any): string {
  if (!raw) return "Une erreur inattendue est survenue. Veuillez réessayer.";
  const msg = typeof raw === "string" ? raw : raw.message || raw.error || String(raw);
  const lower = msg.toLowerCase();

  if (lower.includes("unique") || lower.includes("idx_links_slug") || lower.includes("already exists")) {
    return "Ce slug personnalisé est déjà utilisé. Veuillez en choisir un autre.";
  }
  if (lower.includes("403") || lower.includes("plan_upgrade") || lower.includes("forbidden") || lower.includes("quota")) {
    return "Cette fonctionnalité nécessite un forfait supérieur.";
  }
  if (lower.includes("foreign key") || lower.includes("constraint failed") || lower.includes("sqlite")) {
    return "Erreur temporaire de synchronisation du compte. Veuillez réessayer.";
  }
  if (lower.includes("d1_error") || lower.includes("prepare(") || lower.includes("bind(") || lower.includes("table ") || lower.includes("column ") || lower.includes("sqlite_")) {
    return "Une erreur technique est survenue. Veuillez réessayer.";
  }
  return msg;
}

export function cfInvalidateCache(pattern?: string) {
  if (!pattern) {
    apiCache.clear();
    inFlightRequests.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.includes(pattern)) {
      apiCache.delete(key);
    }
  }
  for (const key of inFlightRequests.keys()) {
    if (key.includes(pattern)) {
      inFlightRequests.delete(key);
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

  // 2. Invalidate cache on mutations before sending
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
        const rawMsg = (err as any).error || (err as any).message || `HTTP ${res.status}`;
        throw new Error(sanitizeClientError(rawMsg));
      }

      const data = (await res.json()) as T;

      if (isBrowser && method === "GET") {
        apiCache.set(url, { data, expiresAt: Date.now() + CACHE_TTL_MS });
      }

      if (isBrowser && method !== "GET") {
        cfInvalidateCache(); // clear again so no in-flight stale GET pollutes cache
        window.dispatchEvent(new CustomEvent("lshorter_data_change"));
      }

      return data;
    } catch (err: any) {
      console.warn(`[Cloudflare API Client] ${method} ${url}:`, err?.message || err);
      if (method === "GET") {
        return { success: true, data: [] } as unknown as T;
      }
      throw new Error(sanitizeClientError(err?.message || err));
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

export function cfNormalizeImageUrl(url?: string): string {
  if (!url) return "";
  if (url.startsWith("data:") || url.startsWith("blob:")) return url;
  if (url.includes("b-cdn.net")) return url;
  if (url.includes("workers.dev/api/v1/images/")) {
    const filename = url.split("workers.dev/api/v1/images/")[1];
    return `/api/images/${filename}`;
  }
  return url;
}

export async function cfUploadImage(
  base64OrFile: string | File,
  folder: string = "Banners"
): Promise<{ success: boolean; url: string; imageId?: string }> {
  try {
    let base64Data = "";
    let compressedFile: File | Blob | null = null;

    if (typeof base64OrFile === "string" && base64OrFile.startsWith("data:")) {
      const compressed = await compressImageFile(base64OrFile, 1200, 630, 0.82);
      base64Data = typeof compressed === "string" ? compressed : base64OrFile;
    } else if (typeof base64OrFile === "string" && (base64OrFile.startsWith("http://") || base64OrFile.startsWith("https://") || base64OrFile.startsWith("/api/images/"))) {
      return { success: true, url: base64OrFile };
    } else if (typeof base64OrFile !== "string") {
      const compressed = await compressImageFile(base64OrFile, 1200, 630, 0.82);
      if (typeof compressed === "string") {
        base64Data = compressed;
      } else {
        compressedFile = compressed as Blob;
        base64Data = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve((e.target?.result as string) || "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(compressed as Blob);
        });
      }
    }

    const isBrowser = typeof window !== "undefined";

    // Tier 1: Try Next.js local upload proxy (/api/upload) -> Bunny.net Storage / CDN / Local
    if (isBrowser) {
      try {
        let localRes: Response;
        if (base64Data) {
          localRes = await fetch("/api/upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: base64Data, folder }),
          });
        } else if (compressedFile) {
          const fd = new FormData();
          fd.append("file", compressedFile);
          fd.append("folder", folder);
          localRes = await fetch("/api/upload", {
            method: "POST",
            body: fd,
          });
        } else {
          localRes = new Response(null, { status: 400 });
        }

        if (localRes.ok) {
          const data = await localRes.json().catch(() => ({}));
          if (data?.url || data?.imageId) {
            return {
              success: true,
              url: cfNormalizeImageUrl(data.url || `/api/images/${data.imageId}`),
              imageId: data.imageId,
            };
          }
        }
      } catch (proxyErr) {
        console.warn("[cfUploadImage] Local /api/upload proxy failed:", proxyErr);
      }
    }

    // Tier 2: Base64 fallback (instant preview without sending anything to Cloudflare)
    if (base64Data) {
      return {
        success: true,
        url: base64Data,
      };
    }

    return { success: false, url: "" };
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
  twitterCard?: "summary_large_image" | "summary" | string;
  twitter_card?: string;
  tags?: string[];
  expiresAt?: string;
  expires_at?: string;
  maxClicks?: number;
  max_clicks?: number;
  fallbackUrl?: string;
  fallback_url?: string;
  abVariations?: any[];
  mainWeight?: number;
  redirectType?: "301" | "302" | "307" | string;
  redirect_type?: string;
  passParams?: boolean;
  pass_params?: boolean;
  isActive?: boolean;
  is_active?: number;
  userPlan?: string;
  plan?: string;
}) {
  const payload: any = {
    userId: data.userId,
    targetUrl: data.targetUrl || data.target_url,
    target_url: data.targetUrl || data.target_url,
    redirectType: data.redirectType || data.redirect_type,
    redirect_type: data.redirectType || data.redirect_type,
    passParams: data.passParams !== undefined ? data.passParams : data.pass_params,
    pass_params: data.passParams !== undefined ? data.passParams : data.pass_params,
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
    twitterCard: data.twitterCard || data.twitter_card || "summary_large_image",
    twitter_card: data.twitterCard || data.twitter_card || "summary_large_image",
    expiresAt: data.expiresAt || data.expires_at,
    maxClicks: data.maxClicks !== undefined ? data.maxClicks : data.max_clicks,
    fallbackUrl: data.fallbackUrl || data.fallback_url,
    abVariations: data.abVariations,
    ab_variations: data.abVariations,
    mainWeight: data.mainWeight,
    main_weight: data.mainWeight,
    isActive: data.isActive !== false && data.is_active !== 0,
    tags: data.tags && data.tags.length ? data.tags : undefined,
    userPlan: data.userPlan || data.plan || undefined,
    plan: data.userPlan || data.plan || undefined,
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
    targetUrl: updates.targetUrl || updates.target_url,
    target_url: updates.target_url || updates.targetUrl,
    geoTargeting: updates.geoTargeting !== undefined ? updates.geoTargeting : updates.geo_targeting,
    geo_targeting: updates.geo_targeting !== undefined ? updates.geo_targeting : updates.geoTargeting,
    deviceTargeting: updates.deviceTargeting !== undefined ? updates.deviceTargeting : updates.device_targeting,
    device_targeting: updates.device_targeting !== undefined ? updates.device_targeting : updates.deviceTargeting,
    routingRules: updates.routingRules !== undefined ? updates.routingRules : updates.routing_rules,
    routing_rules: updates.routing_rules !== undefined ? updates.routing_rules : updates.routingRules,
    hide_referrer: updates.hide_referrer !== undefined ? updates.hide_referrer : updates.hideReferrer !== undefined ? (updates.hideReferrer ? 1 : 0) : undefined,
    og_title: updates.og_title || updates.ogTitle,
    meta_title: updates.meta_title || updates.metaTitle,
    og_description: updates.og_description || updates.ogDescription,
    og_image: updates.og_image || updates.ogImage,
    twitter_card: updates.twitter_card || updates.twitterCard || (updates.og_image || updates.ogImage ? "summary_large_image" : undefined),
    twitterCard: updates.twitterCard || updates.twitter_card || (updates.og_image || updates.ogImage ? "summary_large_image" : undefined),
    expires_at: updates.expires_at || updates.expiresAt,
    max_clicks: updates.max_clicks !== undefined ? updates.max_clicks : updates.maxClicks,
    fallback_url: updates.fallback_url || updates.fallbackUrl,
    ab_variations: updates.ab_variations !== undefined ? updates.ab_variations : updates.abVariations,
    abVariations: updates.abVariations !== undefined ? updates.abVariations : updates.ab_variations,
    main_weight: updates.main_weight !== undefined ? updates.main_weight : updates.mainWeight,
    mainWeight: updates.mainWeight !== undefined ? updates.mainWeight : updates.main_weight,
    pass_params: updates.pass_params !== undefined ? updates.pass_params : updates.passParams,
    passParams: updates.passParams !== undefined ? updates.passParams : updates.pass_params,
    is_active: updates.is_active !== undefined ? updates.is_active : updates.isActive !== undefined ? (updates.isActive ? 1 : 0) : undefined,
    userPlan: updates.userPlan || updates.plan || undefined,
    plan: updates.userPlan || updates.plan || undefined,
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

export async function cfDeleteLink(id: string, userId?: string, slug?: string, ogImage?: string) {
  cfInvalidateCache();
  const query = new URLSearchParams();
  if (userId) query.set("userId", userId);
  if (slug) query.set("slug", slug);
  if (ogImage) query.set("image", ogImage);
  const qStr = query.toString() ? `?${query.toString()}` : "";
  return cfFetch<{ success: true }>(
    `/api/links/${id}${qStr}`,
    `/api/v1/links/${id}${qStr}`,
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
    `/api/keys?userId=${userId}`
  );
}

export async function cfCreateApiKey(data: { userId: string; name: string; scope?: string }) {
  return cfFetch<{ success: true; data: any }>(
    `/api/keys?userId=${data.userId}`,
    `/api/keys?userId=${data.userId}`,
    "POST",
    data
  );
}

export async function cfRevokeApiKey(id: string, userId?: string) {
  const query = userId ? `?userId=${userId}` : "";
  return cfFetch<{ success: true }>(
    `/api/keys/${id}${query}`,
    `/api/keys/${id}${query}`,
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
