import fs from "fs";
import path from "path";

export interface AbVariation {
  url: string;
  weight: number;
}

export interface ProtectedLinkMeta {
  slug: string;
  password?: string;
  isCloaked?: boolean;
  metaTitle?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: "summary_large_image" | "summary";
  twitter_card?: string;
  targetUrl?: string;
  routingRules?: any[];
  geoTargeting?: Record<string, string>;
  deviceTargeting?: Record<string, string>;
  maxClicks?: number;
  fallbackUrl?: string;
  clicksCount?: number;
  abVariations?: AbVariation[];
  mainWeight?: number;
  passParams?: boolean;
  redirectType?: "301" | "302" | "307";
  userId?: string;
  userEmail?: string;
  userName?: string;
  userFullName?: string;
  email?: string;
  fullName?: string;
  isActive?: boolean;
  expiresAt?: string;
  updatedAt: string;
}

const IS_VERCEL = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME);
const DATA_DIR = IS_VERCEL
  ? path.join("/tmp", "lshorter-data")
  : path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "protected-links.json");

// In-memory cache
const memoryStore = new Map<string, ProtectedLinkMeta>();

// Load from disk on init
function initStore() {
  try {
    // Check cwd first if exists (for pre-baked data)
    const localFile = path.join(process.cwd(), "data", "protected-links.json");
    if (fs.existsSync(localFile)) {
      try {
        const raw = fs.readFileSync(localFile, "utf-8");
        const list: ProtectedLinkMeta[] = JSON.parse(raw);
        list.forEach((item) => memoryStore.set(item.slug.toLowerCase(), item));
      } catch {}
    }

    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const list: ProtectedLinkMeta[] = JSON.parse(raw);
      list.forEach((item) => memoryStore.set(item.slug.toLowerCase(), item));
    }
  } catch (err: any) {
    // Silent fail in serverless
  }
}

initStore();

function persistStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const list = Array.from(memoryStore.values());
    fs.writeFileSync(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
  } catch (err: any) {
    // In serverless environments, file persistence is best-effort (memoryStore always preserves the link in memory)
    if (err?.code !== "EROFS") {
      // ignore EROFS silently
    }
  }
}

export function saveProtectedLink(meta: {
  id?: string;
  slug: string;
  password?: string;
  isCloaked?: boolean;
  metaTitle?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterCard?: "summary_large_image" | "summary";
  twitter_card?: string;
  targetUrl?: string;
  routingRules?: any[];
  geoTargeting?: Record<string, string>;
  deviceTargeting?: Record<string, string>;
  maxClicks?: number;
  fallbackUrl?: string;
  abVariations?: AbVariation[];
  mainWeight?: number;
  passParams?: boolean;
  redirectType?: "301" | "302" | "307";
  userId?: string;
  isActive?: boolean;
  expiresAt?: string;
}) {
  if (!meta.slug && !meta.id) return;
  const slugKey = (meta.slug || "").toLowerCase();
  const idKey = (meta.id || "").toLowerCase();

  const existing: Partial<ProtectedLinkMeta> =
    (slugKey ? memoryStore.get(slugKey) : null) ||
    (idKey ? memoryStore.get(idKey) : null) ||
    {};

  const finalSlug = meta.slug || existing.slug || meta.id || "";
  const finalId = meta.id || (existing as any).id || finalSlug;

  const resolvedCard: "summary_large_image" | "summary" =
    meta.twitterCard ||
    (meta.twitter_card as "summary_large_image" | "summary") ||
    existing.twitterCard ||
    (existing.twitter_card as "summary_large_image" | "summary") ||
    "summary_large_image";

  const updated: ProtectedLinkMeta = {
    ...existing,
    slug: finalSlug,
    password: meta.password !== undefined ? meta.password : existing.password,
    isCloaked: meta.isCloaked !== undefined ? meta.isCloaked : existing.isCloaked,
    metaTitle: meta.metaTitle !== undefined ? meta.metaTitle : existing.metaTitle,
    ogTitle: meta.ogTitle !== undefined ? meta.ogTitle : existing.ogTitle,
    ogDescription: meta.ogDescription !== undefined ? meta.ogDescription : existing.ogDescription,
    ogImage: meta.ogImage !== undefined ? meta.ogImage : existing.ogImage,
    twitterCard: resolvedCard,
    twitter_card: resolvedCard,
    targetUrl: meta.targetUrl !== undefined ? meta.targetUrl : existing.targetUrl,
    routingRules: meta.routingRules !== undefined ? meta.routingRules : existing.routingRules,
    geoTargeting: meta.geoTargeting !== undefined ? meta.geoTargeting : existing.geoTargeting,
    deviceTargeting: meta.deviceTargeting !== undefined ? meta.deviceTargeting : existing.deviceTargeting,
    maxClicks: meta.maxClicks !== undefined ? meta.maxClicks : existing.maxClicks,
    fallbackUrl: meta.fallbackUrl !== undefined ? meta.fallbackUrl : existing.fallbackUrl,
    abVariations: meta.abVariations !== undefined ? meta.abVariations : existing.abVariations,
    mainWeight: meta.mainWeight !== undefined ? meta.mainWeight : existing.mainWeight,
    passParams: meta.passParams !== undefined ? meta.passParams : (existing.passParams !== undefined ? existing.passParams : true),
    redirectType: meta.redirectType !== undefined ? meta.redirectType : existing.redirectType,
    isActive: meta.isActive !== undefined ? meta.isActive : (existing.isActive !== undefined ? existing.isActive : true),
    expiresAt: meta.expiresAt !== undefined ? meta.expiresAt : existing.expiresAt,
    clicksCount: existing.clicksCount || 0,
    userId: meta.userId || existing.userId,
    updatedAt: new Date().toISOString(),
  };
  (updated as any).id = finalId;

  if (slugKey) memoryStore.set(slugKey, updated);
  if (idKey) memoryStore.set(idKey, updated);
  if (finalSlug) memoryStore.set(finalSlug.toLowerCase(), updated);

  persistStore();
  return updated;
}

export function getProtectedLink(keyOrSlug: string): ProtectedLinkMeta | null {
  if (!keyOrSlug) return null;
  const k = keyOrSlug.toLowerCase();
  const direct = memoryStore.get(k);
  if (direct) return direct;
  for (const item of memoryStore.values()) {
    if (item.slug?.toLowerCase() === k || (item as any).id?.toLowerCase() === k) return item;
  }
  return null;
}

export function resolveAbTargetUrl(meta?: ProtectedLinkMeta | null, defaultUrl?: string): string {
  if (!meta) return defaultUrl || "";
  const base = meta.targetUrl || defaultUrl || "";
  if (!meta.abVariations || !meta.abVariations.length) {
    return base;
  }

  const validVariations = meta.abVariations.filter((v) => v.url && v.url.trim());
  if (!validVariations.length) {
    return base;
  }

  const mainWeight = meta.mainWeight !== undefined ? meta.mainWeight : 50;
  const totalVariationWeight = validVariations.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);
  const grandTotal = mainWeight + totalVariationWeight;

  if (grandTotal <= 0) return base;

  const rand = Math.random() * grandTotal;

  if (rand < mainWeight) {
    return base;
  }

  let running = mainWeight;
  for (const v of validVariations) {
    running += Number(v.weight) || 0;
    if (rand < running) {
      return v.url.trim();
    }
  }

  return base;
}

export function checkLinkQuota(slug: string): { isAllowed: boolean; fallbackUrl?: string } {
  if (!slug) return { isAllowed: true };
  const key = slug.toLowerCase();
  const link = memoryStore.get(key);
  if (!link) return { isAllowed: true };

  const currentClicks = link.clicksCount || 0;
  if (link.maxClicks && link.maxClicks > 0 && currentClicks >= link.maxClicks) {
    return { isAllowed: false, fallbackUrl: link.fallbackUrl };
  }
  return { isAllowed: true };
}

export function recordLinkClick(slug: string): { isAllowed: boolean; fallbackUrl?: string; newCount: number } {
  if (!slug) return { isAllowed: true, newCount: 0 };
  const key = slug.toLowerCase();
  const link = memoryStore.get(key);

  if (!link) return { isAllowed: true, newCount: 0 };

  const currentClicks = link.clicksCount || 0;

  // Check if click limit already reached: do NOT increment further!
  if (link.maxClicks && link.maxClicks > 0 && currentClicks >= link.maxClicks) {
    return { isAllowed: false, fallbackUrl: link.fallbackUrl, newCount: currentClicks };
  }

  // Increment clicks (strictly stops at maxClicks)
  const nextClicks = currentClicks + 1;
  link.clicksCount = nextClicks;
  memoryStore.set(key, link);
  persistStore();

  return { isAllowed: true, newCount: nextClicks };
}

export function deleteProtectedLink(slugOrId: string) {
  if (!slugOrId) return;
  const k = slugOrId.toLowerCase();
  memoryStore.delete(k);
  for (const [key, item] of Array.from(memoryStore.entries())) {
    if (key === k || item.slug?.toLowerCase() === k || (item as any).id?.toLowerCase() === k) {
      memoryStore.delete(key);
    }
  }
  persistStore();
}

export function getAllProtectedLinks(): ProtectedLinkMeta[] {
  return Array.from(memoryStore.values());
}
