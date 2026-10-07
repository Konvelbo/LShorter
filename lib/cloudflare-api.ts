/**
 * Cloudflare D1 API Client
 * ─────────────────────────────────────────────────────────────────────────────
 * Handles all calls to the Cloudflare Worker backend (links, domains, analytics).
 * User profile data lives in Convex — NOT here.
 */

import { compressImageFile } from "./image-compress";
import { WORKER_URL, FRONTEND_SECRET as SECRET } from "./backend-config";

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

const apiCache = new Map<string, { data: any; expiresAt: number }>();
const inFlightRequests = new Map<string, Promise<any>>();
// Cache GET responses for 30 seconds to eliminate micro-spam while ensuring snappy UI
const CACHE_TTL_MS = 30000; // 30 seconds (invalidated immediately on mutations or click events)

export function sanitizeClientError(raw: any): string {
  if (!raw) return "Une erreur inattendue est survenue. Veuillez réessayer.";
  const msg = typeof raw === "string" ? raw : raw.message || raw.error || String(raw);
  const lower = msg.toLowerCase();

  if (lower.includes("unique") || lower.includes("idx_links_slug") || lower.includes("already exists")) {
    return "Ce slug personnalisé est déjà utilisé. Veuillez en choisir un autre.";
  }
  if (lower.includes("self-referencing") || lower.includes("infinite_redirect")) {
    return "L'URL de destination ne peut pas pointer vers le même domaine (lsho.cc). Veuillez entrer une URL externe.";
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

export function triggerClickSync() {
  if (typeof window === "undefined") return;
  cfInvalidateCache("/api/analytics");
  cfInvalidateCache("/api/links");
  try {
    localStorage.setItem("lshorter_last_click", Date.now().toString());
  } catch {}
  try {
    const bc = new BroadcastChannel("lshorter_realtime");
    bc.postMessage({ type: "click", timestamp: Date.now() });
    bc.close();
  } catch {}
  window.dispatchEvent(new CustomEvent("lshorter_data_change"));
  window.dispatchEvent(new CustomEvent("lshorter_links_updated"));
  window.dispatchEvent(new CustomEvent("lshorter_link_clicked"));

  // Secondary fire after 1.2s to capture asynchronous Cloudflare D1 write completion without re-incrementing local counter
  setTimeout(() => {
    cfInvalidateCache("/api/analytics");
    cfInvalidateCache("/api/links");
    window.dispatchEvent(new CustomEvent("lshorter_data_change"));
    window.dispatchEvent(new CustomEvent("lshorter_links_updated"));
  }, 1200);
}

// ─── Smart Real-Time Click Sync (BroadcastChannel + Tab Focus Sync after Link Open/Preview) ───
if (typeof window !== "undefined") {
  try {
    const bc = new BroadcastChannel("lshorter_realtime");
    bc.onmessage = (ev) => {
      if (ev?.data?.type === "click") {
        cfInvalidateCache("/api/analytics");
        cfInvalidateCache("/api/links");
        window.dispatchEvent(new CustomEvent("lshorter_data_change"));
        window.dispatchEvent(new CustomEvent("lshorter_links_updated"));
      }
    };
  } catch {}

  let lastFocusSync = 0;
  const handleFocusOrVisibility = () => {
    if (typeof document !== "undefined" && document.visibilityState && document.visibilityState !== "visible") return;
    const now = Date.now();
    // Throttle focus sync to at most once every 2 seconds (so returning to tab instantly syncs from server)
    if (now - lastFocusSync < 2000) return;
    lastFocusSync = now;
    cfInvalidateCache("/api/analytics");
    cfInvalidateCache("/api/links");
    window.dispatchEvent(new CustomEvent("lshorter_data_change"));
    window.dispatchEvent(new CustomEvent("lshorter_links_updated"));
  };

  window.addEventListener("focus", handleFocusOrVisibility);
  document.addEventListener("visibilitychange", handleFocusOrVisibility);
}

async function cfFetch<T>(
  browserPath: string,
  workerPath: string,
  method: Method = "GET",
  body?: object,
  bypassCache = false
): Promise<T> {
  const isBrowser = typeof window !== "undefined";
  const url = isBrowser ? browserPath : `${WORKER_URL}${workerPath}`;

  // 1. Cache hit for GET requests
  if (isBrowser && method === "GET" && !bypassCache) {
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
    if (SECRET) headers["X-Frontend-Secret"] = SECRET;
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

      if (isBrowser && method === "GET" && !bypassCache) {
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

  if (isBrowser && method === "GET" && !bypassCache) {
    inFlightRequests.set(url, fetchPromise);
  }

  return fetchPromise;
}

// ─── Links ────────────────────────────────────────────────────────────────────
export async function cfGetLinks(userId: string, forceRefresh = false) {
  const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : "";
  return cfFetch<{ success: true; data: any[] }>(
    `/api/links?userId=${userId}${cacheBuster}`,
    `/api/v1/links?userId=${userId}${cacheBuster}`,
    "GET",
    undefined,
    forceRefresh
  );
}

export function cfNormalizeImageUrl(url?: string): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (trimmed.startsWith("/api/images/")) {
    const filename = trimmed.replace("/api/images/", "");
    return `https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/images/${filename}`;
  }
  if (trimmed.startsWith("banner_") && (trimmed.endsWith(".jpg") || trimmed.endsWith(".png") || trimmed.endsWith(".webp") || trimmed.endsWith(".gif"))) {
    return `https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/images/${trimmed}`;
  }
  return trimmed;
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
      return { success: true, url: cfNormalizeImageUrl(base64OrFile) };
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
  bannerStyle?: "default_banner" | "large_banner" | string;
  banner_style?: "default_banner" | "large_banner" | string;
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
  pathLockMode?: "off" | "strict" | "funnel" | string;
  path_lock_mode?: "off" | "strict" | "funnel" | string;
  pathLockPrefix?: string;
  path_lock_prefix?: string;
  pathLockMessage?: string;
  path_lock_message?: string;
  pathLockPassword?: string;
  path_lock_password?: string;
  isActive?: boolean;
  is_active?: number | boolean;
  userPlan?: string;
  plan?: string;
  [key: string]: any;
}) {
  const rawBanner =
    data.bannerStyle ||
    data.banner_style ||
    data.twitterCard ||
    data.twitter_card;
  const isDefault = rawBanner === "default_banner" || rawBanner === "summary";
  const resolvedBannerStyle = isDefault ? "default_banner" : "large_banner";
  const resolvedTwitterCard = isDefault ? "summary" : "summary_large_image";

  const rawExpTime = data.expiresAt || data.expires_at;
  const isLinkExpired = Boolean(
    rawExpTime && new Date(rawExpTime).getTime() <= Date.now()
  );
  const finalIsActive = !isLinkExpired && data.isActive !== false && data.is_active !== 0;

  const targetUrlClean = data.targetUrl || data.target_url;
  const finalPathLockMode = data.pathLockMode || data.path_lock_mode || "off";
  let finalPathLockPrefix = data.pathLockPrefix || data.path_lock_prefix || undefined;
  if (finalPathLockMode === "strict" && (!finalPathLockPrefix || finalPathLockPrefix.trim() === "") && targetUrlClean) {
    try {
      const u = new URL(targetUrlClean.startsWith("http") ? targetUrlClean : `https://${targetUrlClean}`);
      const p = u.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
      finalPathLockPrefix = p || "/";
    } catch {
      finalPathLockPrefix = "/";
    }
  } else if (finalPathLockMode === "funnel" && (!finalPathLockPrefix || finalPathLockPrefix.trim() === "")) {
    finalPathLockPrefix = "/";
  }

  const payload: any = {
    userId: data.userId,
    targetUrl: targetUrlClean,
    target_url: targetUrlClean,
    redirectType: data.redirectType || data.redirect_type,
    redirect_type: data.redirectType || data.redirect_type,
    passParams: data.passParams !== undefined ? data.passParams : data.pass_params,
    pass_params: data.passParams !== undefined ? data.passParams : data.pass_params,
    pathLockMode: finalPathLockMode,
    path_lock_mode: finalPathLockMode,
    pathLockPrefix: finalPathLockPrefix,
    path_lock_prefix: finalPathLockPrefix,
    pathLockMessage: data.pathLockMessage || data.path_lock_message || undefined,
    path_lock_message: data.pathLockMessage || data.path_lock_message || undefined,
    pathLockPassword: data.pathLockPassword || data.path_lock_password || undefined,
    path_lock_password: data.pathLockPassword || data.path_lock_password || undefined,
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
    bannerStyle: resolvedBannerStyle,
    banner_style: resolvedBannerStyle,
    twitterCard: resolvedTwitterCard,
    twitter_card: resolvedTwitterCard,
    expiresAt: data.expiresAt || data.expires_at,
    maxClicks: data.maxClicks !== undefined ? data.maxClicks : data.max_clicks,
    fallbackUrl: data.fallbackUrl || data.fallback_url,
    abVariations: data.abVariations,
    ab_variations: data.abVariations,
    mainWeight: data.mainWeight,
    main_weight: data.mainWeight,
    isActive: finalIsActive,
    is_active: finalIsActive ? 1 : 0,
    tags: data.tags && data.tags.length ? data.tags : undefined,
    userPlan: data.userPlan || data.plan || undefined,
    plan: data.userPlan || data.plan || undefined,
    pixels: data.pixels || data.pixelIds || data.pixel_ids || undefined,
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
  const targetUrlUpdate = updates.targetUrl || updates.target_url;
  const finalUpdatePathLockMode = updates.pathLockMode || updates.path_lock_mode;
  let finalUpdatePathLockPrefix = updates.pathLockPrefix !== undefined ? updates.pathLockPrefix : updates.path_lock_prefix;
  if (finalUpdatePathLockMode === "strict" && (!finalUpdatePathLockPrefix || finalUpdatePathLockPrefix.trim() === "") && targetUrlUpdate) {
    try {
      const u = new URL(targetUrlUpdate.startsWith("http") ? targetUrlUpdate : `https://${targetUrlUpdate}`);
      const p = u.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
      finalUpdatePathLockPrefix = p || "/";
    } catch {
      finalUpdatePathLockPrefix = "/";
    }
  } else if (finalUpdatePathLockMode === "funnel" && (!finalUpdatePathLockPrefix || finalUpdatePathLockPrefix.trim() === "")) {
    finalUpdatePathLockPrefix = "/";
  }

  const expTimeUpdate = updates.expires_at || updates.expiresAt;
  const isUpdateExpired = Boolean(
    expTimeUpdate && new Date(expTimeUpdate).getTime() <= Date.now()
  );
  const effectiveIsActive = isUpdateExpired
    ? 0
    : updates.is_active !== undefined
      ? Number(updates.is_active)
      : updates.isActive !== undefined
        ? (updates.isActive ? 1 : 0)
        : undefined;

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
    ogTitle: updates.ogTitle || updates.og_title,
    meta_title: updates.meta_title || updates.metaTitle,
    metaTitle: updates.metaTitle || updates.meta_title,
    og_description: updates.og_description || updates.ogDescription,
    ogDescription: updates.ogDescription || updates.og_description,
    og_image: updates.og_image || updates.ogImage,
    ogImage: updates.ogImage || updates.og_image,
    banner_style: updates.banner_style || updates.bannerStyle || (updates.twitter_card === "summary" || updates.twitterCard === "summary" ? "default_banner" : updates.twitter_card === "summary_large_image" || updates.twitterCard === "summary_large_image" ? "large_banner" : undefined),
    bannerStyle: updates.bannerStyle || updates.banner_style || (updates.twitter_card === "summary" || updates.twitterCard === "summary" ? "default_banner" : updates.twitter_card === "summary_large_image" || updates.twitterCard === "summary_large_image" ? "large_banner" : undefined),
    twitter_card: updates.twitter_card || updates.twitterCard || (updates.banner_style === "default_banner" || updates.bannerStyle === "default_banner" ? "summary" : updates.banner_style === "large_banner" || updates.bannerStyle === "large_banner" ? "summary_large_image" : undefined),
    twitterCard: updates.twitterCard || updates.twitter_card || (updates.banner_style === "default_banner" || updates.bannerStyle === "default_banner" ? "summary" : updates.banner_style === "large_banner" || updates.bannerStyle === "large_banner" ? "summary_large_image" : undefined),
    expires_at: updates.expires_at || updates.expiresAt,
    max_clicks: updates.max_clicks !== undefined ? updates.max_clicks : updates.maxClicks,
    fallback_url: updates.fallback_url || updates.fallbackUrl,
    ab_variations: updates.ab_variations !== undefined ? updates.ab_variations : updates.abVariations,
    abVariations: updates.abVariations !== undefined ? updates.abVariations : updates.ab_variations,
    main_weight: updates.main_weight !== undefined ? updates.main_weight : updates.mainWeight,
    mainWeight: updates.mainWeight !== undefined ? updates.mainWeight : updates.main_weight,
    pass_params: updates.pass_params !== undefined ? updates.pass_params : updates.passParams,
    passParams: updates.passParams !== undefined ? updates.passParams : updates.pass_params,
    path_lock_mode: finalUpdatePathLockMode,
    pathLockMode: finalUpdatePathLockMode,
    path_lock_prefix: finalUpdatePathLockPrefix,
    pathLockPrefix: finalUpdatePathLockPrefix,
    path_lock_message: updates.path_lock_message !== undefined ? updates.path_lock_message : updates.pathLockMessage,
    pathLockMessage: updates.pathLockMessage !== undefined ? updates.pathLockMessage : updates.path_lock_message,
    path_lock_password: updates.path_lock_password !== undefined ? updates.path_lock_password : updates.pathLockPassword,
    pathLockPassword: updates.pathLockPassword !== undefined ? updates.pathLockPassword : updates.path_lock_password,
    is_active: effectiveIsActive,
    isActive: effectiveIsActive !== undefined ? effectiveIsActive !== 0 : undefined,
    userPlan: updates.userPlan || updates.plan || undefined,
    plan: updates.userPlan || updates.plan || undefined,
    pixels: updates.pixels !== undefined ? updates.pixels : updates.pixelIds !== undefined ? updates.pixelIds : updates.pixel_ids,
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

export async function cfBulkDeleteLinks(ids: string[], userId?: string) {
  cfInvalidateCache();
  const query = new URLSearchParams();
  if (userId) query.set("userId", userId);
  const qStr = query.toString() ? `?${query.toString()}` : "";
  return cfFetch<{ success: boolean; deletedCount: number; deletedIds: string[] }>(
    `/api/links/bulk-delete${qStr}`,
    `/api/v1/links/bulk-delete${qStr}`,
    "POST",
    { ids }
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function cfGetAnalytics(
  userId: string,
  period = "30d",
  linkId?: string,
  forceRefresh = false
) {
  const linkParam = linkId && linkId !== "all" ? `&linkId=${linkId}` : "";
  const cacheBuster = forceRefresh ? `&_t=${Date.now()}` : "";
  return cfFetch<{ success: true; data: any }>(
    `/api/analytics?userId=${userId}&period=${period}${linkParam}${cacheBuster}`,
    `/api/v1/analytics?userId=${userId}&period=${period}${linkParam}${cacheBuster}`,
    "GET",
    undefined,
    forceRefresh
  );
}

// ─── Domains ──────────────────────────────────────────────────────────────────
export async function cfGetDomains(userId: string) {
  return cfFetch<{ success: true; data: any[] }>(
    `/api/domains?userId=${userId}`,
    `/api/v1/domains?userId=${userId}`
  );
}

export async function cfAddDomain(data: {
  userId: string;
  domain: string;
  userEmail?: string;
  userName?: string;
  userFullName?: string;
  email?: string;
  fullName?: string;
}) {
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
  const encUser = encodeURIComponent(userId);
  return cfFetch<{ success: true; data: any[] }>(
    `/api/keys?userId=${encUser}`,
    `/api/v1/users/${encUser}/keys`
  );
}

export async function cfCreateApiKey(data: {
  userId: string;
  name: string;
  scope?: string;
  userEmail?: string;
  userName?: string;
  userFullName?: string;
  email?: string;
  fullName?: string;
}) {
  const encUser = encodeURIComponent(data.userId);
  return cfFetch<{ success: true; data: any }>(
    `/api/keys?userId=${encUser}`,
    `/api/v1/users/${encUser}/keys`,
    "POST",
    data
  );
}

export async function cfRevokeApiKey(id: string, userId?: string) {
  const encId = encodeURIComponent(id);
  const encUser = userId ? encodeURIComponent(userId) : "";
  const query = encUser ? `?userId=${encUser}` : "";
  const workerPath = encUser
    ? `/api/v1/users/${encUser}/keys/${encId}`
    : `/api/v1/users/keys/${encId}`;
  return cfFetch<{ success: true }>(
    `/api/keys/${encId}${query}`,
    workerPath,
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

// ─── Retargeting Pixels ────────────────────────────────────────────────────────
export interface RetargetingPixel {
  id: string;
  userId: string;
  platform: "meta" | "google" | "tiktok" | "linkedin";
  pixelId: string;
  name: string;
  isActive: boolean;
  eventsTrackedCount: number;
  createdAt: string;
}

export async function cfGetPixels(userId: string) {
  const encUser = encodeURIComponent(userId);
  return cfFetch<{ success: true; data: { pixels: RetargetingPixel[] } }>(
    `/api/pixels?userId=${encUser}`,
    `/api/v1/pixels?userId=${encUser}`
  );
}

export async function cfCreatePixel(data: {
  userId: string;
  platform: "meta" | "google" | "tiktok" | "linkedin" | string;
  pixelId: string;
  name: string;
  isActive?: boolean;
}) {
  const encUser = encodeURIComponent(data.userId);
  return cfFetch<{ success: true; data: { pixel: RetargetingPixel } }>(
    `/api/pixels?userId=${encUser}`,
    `/api/v1/pixels?userId=${encUser}`,
    "POST",
    data
  );
}

export async function cfUpdatePixel(
  id: string,
  data: {
    userId?: string;
    name?: string;
    pixelId?: string;
    isActive?: boolean;
  }
) {
  const encId = encodeURIComponent(id);
  const query = data.userId ? `?userId=${encodeURIComponent(data.userId)}` : "";
  return cfFetch<{ success: true; data: { pixel: RetargetingPixel } }>(
    `/api/pixels/${encId}${query}`,
    `/api/v1/pixels/${encId}${query}`,
    "PATCH",
    data
  );
}

export async function cfDeletePixel(id: string, userId?: string) {
  const encId = encodeURIComponent(id);
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return cfFetch<{ success: true; data?: { deletedId: string } }>(
    `/api/pixels/${encId}${query}`,
    `/api/v1/pixels/${encId}${query}`,
    "DELETE"
  );
}

// ─── Webhooks (Cloudflare D1 & Sync) ──────────────────────────────────────────

export interface WebhookRecord {
  id: string;
  userId: string;
  url: string;
  events: string[];
  secretKey: string;
  isActive: boolean;
  lastTriggeredAt?: string | null;
  lastStatus?: number | null;
  createdAt: string;
  created_at?: string;
}

export async function cfGetWebhooks(userId: string) {
  const encUser = encodeURIComponent(userId);
  return cfFetch<{ success: true; data: { webhooks: WebhookRecord[] } }>(
    `/api/webhooks?userId=${encUser}`,
    `/api/v1/webhooks?userId=${encUser}`
  );
}

export async function cfCreateWebhook(data: {
  userId: string;
  url: string;
  events?: string[];
  secretKey?: string;
  isActive?: boolean;
}) {
  const encUser = encodeURIComponent(data.userId);
  return cfFetch<{ success: true; data: { webhook: WebhookRecord } }>(
    `/api/webhooks?userId=${encUser}`,
    `/api/v1/webhooks?userId=${encUser}`,
    "POST",
    data
  );
}

export async function cfUpdateWebhook(
  id: string,
  data: {
    userId?: string;
    url?: string;
    events?: string[];
    secretKey?: string;
    isActive?: boolean;
    lastStatus?: number;
    lastTriggeredAt?: string;
  }
) {
  const encId = encodeURIComponent(id);
  const query = data.userId ? `?userId=${encodeURIComponent(data.userId)}` : "";
  return cfFetch<{ success: true; data: { webhook: WebhookRecord } }>(
    `/api/webhooks/${encId}${query}`,
    `/api/v1/webhooks/${encId}${query}`,
    "PATCH",
    data
  );
}

export async function cfDeleteWebhook(id: string, userId?: string) {
  const encId = encodeURIComponent(id);
  const query = userId ? `?userId=${encodeURIComponent(userId)}` : "";
  return cfFetch<{ success: true; data?: { deletedId: string } }>(
    `/api/webhooks/${encId}${query}`,
    `/api/v1/webhooks/${encId}${query}`,
    "DELETE"
  );
}

// ─── Target Alerts API (Cloudflare D1) ──────────────────────────────────────

export async function cfGetTargetAlerts(userId: string) {
  const encUser = encodeURIComponent(userId);
  return cfFetch<{ success: boolean; data: any[] }>(
    `/api/targets?userId=${encUser}`,
    `/api/v1/targets?userId=${encUser}`
  );
}

export async function cfCreateTargetAlert(data: {
  userId: string;
  linkId?: string | null;
  metricType?: "clicks" | "revenue";
  period?: "day" | "week" | "month";
  targetValue: number;
  notifyExpired?: boolean;
  notifyEmail?: boolean;
  notifyBell?: boolean;
  status?: "active" | "paused";
}) {
  return cfFetch<{ success: boolean; data: any }>(
    `/api/targets`,
    `/api/v1/targets`,
    "POST",
    data
  );
}

export async function cfUpdateTargetAlert(
  id: string,
  data: {
    metricType?: "clicks" | "revenue";
    period?: "day" | "week" | "month";
    targetValue?: number;
    notifyExpired?: boolean;
    notifyEmail?: boolean;
    notifyBell?: boolean;
    status?: "active" | "paused" | "reached";
  }
) {
  const encId = encodeURIComponent(id);
  return cfFetch<{ success: boolean; updated: string }>(
    `/api/targets/${encId}`,
    `/api/v1/targets/${encId}`,
    "PATCH",
    data
  );
}

export async function cfDeleteTargetAlert(id: string) {
  const encId = encodeURIComponent(id);
  return cfFetch<{ success: boolean; deleted: string }>(
    `/api/targets/${encId}`,
    `/api/v1/targets/${encId}`,
    "DELETE"
  );
}


