import fs from "node:fs";
import path from "node:path";

export interface LinkExtrasRecord {
  id?: string;
  slug?: string;
  abVariations?: unknown[];
  ab_variations?: unknown[];
  mainWeight?: number;
  main_weight?: number;
  redirectType?: string;
  redirect_type?: string;
  passParams?: boolean;
  pass_params?: boolean | number;
  pixels?: unknown[];
  pixel_ids?: unknown[];
  routingRules?: unknown[];
  routing_rules?: unknown[];
  geoTargeting?: Record<string, string>;
  geo_targeting?: Record<string, string>;
  deviceTargeting?: Record<string, string>;
  device_targeting?: Record<string, string>;
  expiresAt?: string | null;
  expires_at?: string | null;
  maxClicks?: number | null;
  max_clicks?: number | null;
  fallbackUrl?: string | null;
  fallback_url?: string | null;
  bannerStyle?: string;
  banner_style?: string;
  twitterCard?: string;
  twitter_card?: string;
  password?: string | null;
  has_password?: boolean;
  is_password_protected?: boolean;
  pathLockMode?: string;
  path_lock_mode?: string;
  pathLockPrefix?: string;
  path_lock_prefix?: string;
  pathLockMessage?: string;
  path_lock_message?: string;
  pathLockPassword?: string;
  path_lock_password?: string;
  updatedAt?: number;
}

const MAX_STORE_ENTRIES = 500;
const STORE_KEY = "__lshorterLinkExtrasStore";

function getCacheFilePath(): string {
  return path.join(process.cwd(), ".next", "cache", "lshorter-link-extras.json");
}

function getMemoryStore(): Map<string, LinkExtrasRecord> {
  const g = globalThis as Record<string, unknown>;
  if (!(g[STORE_KEY] instanceof Map)) {
    const initial = new Map<string, LinkExtrasRecord>();
    try {
      const filePath = getCacheFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (parsed && typeof parsed === "object") {
          for (const [k, v] of Object.entries(parsed)) {
            if (v && typeof v === "object") {
              initial.set(k, v as LinkExtrasRecord);
            }
          }
        }
      }
    } catch {}
    g[STORE_KEY] = initial;
  }
  return g[STORE_KEY] as Map<string, LinkExtrasRecord>;
}

function flushStoreToDisk(store: Map<string, LinkExtrasRecord>): void {
  try {
    const filePath = getCacheFilePath();
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const obj: Record<string, LinkExtrasRecord> = {};
    for (const [k, v] of store.entries()) {
      obj[k] = v;
    }
    fs.writeFileSync(filePath, JSON.stringify(obj), "utf8");
  } catch {}
}

function pruneIfNeeded(store: Map<string, LinkExtrasRecord>): void {
  if (store.size <= MAX_STORE_ENTRIES) return;
  const entries = Array.from(store.entries()).sort(
    (a, b) => (a[1].updatedAt || 0) - (b[1].updatedAt || 0)
  );
  const toDelete = store.size - MAX_STORE_ENTRIES;
  for (let i = 0; i < toDelete; i++) {
    store.delete(entries[i][0]);
  }
}

export function saveLinkExtras(
  keys: { slug?: string; id?: string },
  payload: Record<string, unknown>
): void {
  const store = getMemoryStore();
  const existing = getLinkExtras(keys.slug, keys.id) || {};
  const next: LinkExtrasRecord = {
    ...existing,
    ...(keys.id ? { id: keys.id } : {}),
    ...(keys.slug ? { slug: keys.slug } : {}),
    updatedAt: Date.now(),
  };

  const assignIfDefined = (prop: keyof LinkExtrasRecord, ...candidates: unknown[]) => {
    const record = next as Record<string, unknown>;
    for (const val of candidates) {
      if (val !== undefined) {
        record[prop] = val;
        return;
      }
    }
  };

  assignIfDefined("abVariations", payload.abVariations, payload.ab_variations);
  assignIfDefined("ab_variations", payload.ab_variations, payload.abVariations);
  assignIfDefined("mainWeight", payload.mainWeight, payload.main_weight);
  assignIfDefined("main_weight", payload.main_weight, payload.mainWeight);
  assignIfDefined("redirectType", payload.redirectType, payload.redirect_type);
  assignIfDefined("redirect_type", payload.redirect_type, payload.redirectType);
  assignIfDefined("passParams", payload.passParams, payload.pass_params);
  assignIfDefined("pass_params", payload.pass_params, payload.passParams);
  assignIfDefined("pixels", payload.pixels, payload.pixel_ids, payload.pixelIds);
  assignIfDefined("pixel_ids", payload.pixel_ids, payload.pixels, payload.pixelIds);
  assignIfDefined("routingRules", payload.routingRules, payload.routing_rules);
  assignIfDefined("routing_rules", payload.routing_rules, payload.routingRules);
  assignIfDefined("geoTargeting", payload.geoTargeting, payload.geo_targeting);
  assignIfDefined("geo_targeting", payload.geo_targeting, payload.geoTargeting);
  assignIfDefined("deviceTargeting", payload.deviceTargeting, payload.device_targeting);
  assignIfDefined("device_targeting", payload.device_targeting, payload.deviceTargeting);
  assignIfDefined("expiresAt", payload.expiresAt, payload.expires_at);
  assignIfDefined("expires_at", payload.expires_at, payload.expiresAt);
  assignIfDefined("maxClicks", payload.maxClicks, payload.max_clicks);
  assignIfDefined("max_clicks", payload.max_clicks, payload.maxClicks);
  assignIfDefined("fallbackUrl", payload.fallbackUrl, payload.fallback_url);
  assignIfDefined("fallback_url", payload.fallback_url, payload.fallbackUrl);
  assignIfDefined("bannerStyle", payload.bannerStyle, payload.banner_style);
  assignIfDefined("banner_style", payload.banner_style, payload.bannerStyle);
  assignIfDefined("twitterCard", payload.twitterCard, payload.twitter_card);
  assignIfDefined("twitter_card", payload.twitter_card, payload.twitterCard);

  if (keys.slug) {
    store.set(`slug:${keys.slug.toLowerCase()}`, next);
  }
  if (keys.id) {
    store.set(`id:${keys.id}`, next);
  }
  pruneIfNeeded(store);
  flushStoreToDisk(store);
}

export function getLinkExtras(slug?: string, id?: string): LinkExtrasRecord | null {
  const store = getMemoryStore();
  if (slug) {
    const bySlug = store.get(`slug:${slug.toLowerCase()}`);
    if (bySlug) return bySlug;
  }
  if (id) {
    const byId = store.get(`id:${id}`);
    if (byId) return byId;
  }
  return null;
}

export function mergeLinkWithExtras<T extends Record<string, unknown>>(link: T): T {
  if (!link || typeof link !== "object") return link;
  const slug = typeof link.slug === "string" ? link.slug : undefined;
  const id = typeof link.id === "string" ? link.id : undefined;
  const extras = getLinkExtras(slug, id);
  if (!extras) return link;

  const isEmptyArray = (val: unknown) =>
    val === undefined || val === null || val === "" || val === "[]" || (Array.isArray(val) && val.length === 0);

  return {
    ...link,
    ...(isEmptyArray(link.abVariations) && isEmptyArray(link.ab_variations) && extras.abVariations !== undefined
      ? { abVariations: extras.abVariations, ab_variations: extras.ab_variations ?? extras.abVariations }
      : {}),
    ...(link.mainWeight === undefined && link.main_weight === undefined && extras.mainWeight !== undefined
      ? { mainWeight: extras.mainWeight, main_weight: extras.main_weight ?? extras.mainWeight }
      : {}),
    ...(link.redirectType === undefined && link.redirect_type === undefined && extras.redirectType !== undefined
      ? { redirectType: extras.redirectType, redirect_type: extras.redirect_type ?? extras.redirectType }
      : {}),
    ...(link.passParams === undefined && link.pass_params === undefined && extras.passParams !== undefined
      ? { passParams: Boolean(extras.passParams), pass_params: Boolean(extras.passParams) ? 1 : 0 }
      : {}),
    ...(isEmptyArray(link.pixels) && isEmptyArray(link.pixel_ids) && extras.pixels !== undefined
      ? { pixels: extras.pixels, pixel_ids: extras.pixel_ids ?? extras.pixels }
      : {}),
    ...(link.expiresAt === undefined && link.expires_at === undefined && extras.expiresAt !== undefined
      ? { expiresAt: extras.expiresAt, expires_at: extras.expires_at ?? extras.expiresAt }
      : {}),
    ...(link.maxClicks === undefined && link.max_clicks === undefined && extras.maxClicks !== undefined
      ? { maxClicks: extras.maxClicks, max_clicks: extras.max_clicks ?? extras.maxClicks }
      : {}),
    ...(link.fallbackUrl === undefined && link.fallback_url === undefined && extras.fallbackUrl !== undefined
      ? { fallbackUrl: extras.fallbackUrl, fallback_url: extras.fallback_url ?? extras.fallbackUrl }
      : {}),
  };
}
