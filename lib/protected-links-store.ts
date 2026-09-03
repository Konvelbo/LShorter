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
  userId?: string;
  updatedAt: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "protected-links.json");

// In-memory cache
const memoryStore = new Map<string, ProtectedLinkMeta>();

// Load from disk on init
function initStore() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, "utf-8");
      const list: ProtectedLinkMeta[] = JSON.parse(raw);
      list.forEach((item) => memoryStore.set(item.slug.toLowerCase(), item));
    }
  } catch (err) {
    console.warn("[ProtectedLinksStore] Init error:", err);
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
  } catch (err) {
    console.warn("[ProtectedLinksStore] Persist error:", err);
  }
}

export function saveProtectedLink(meta: {
  slug: string;
  password?: string;
  isCloaked?: boolean;
  metaTitle?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  targetUrl?: string;
  routingRules?: any[];
  geoTargeting?: Record<string, string>;
  deviceTargeting?: Record<string, string>;
  maxClicks?: number;
  fallbackUrl?: string;
  abVariations?: AbVariation[];
  mainWeight?: number;
  passParams?: boolean;
  userId?: string;
}) {
  if (!meta.slug) return;
  const key = meta.slug.toLowerCase();
  const existing: Partial<ProtectedLinkMeta> = memoryStore.get(key) || {};

  const updated: ProtectedLinkMeta = {
    ...existing,
    slug: meta.slug,
    password: meta.password !== undefined ? meta.password : existing.password,
    isCloaked: meta.isCloaked !== undefined ? meta.isCloaked : existing.isCloaked,
    metaTitle: meta.metaTitle !== undefined ? meta.metaTitle : existing.metaTitle,
    ogTitle: meta.ogTitle !== undefined ? meta.ogTitle : existing.ogTitle,
    ogDescription: meta.ogDescription !== undefined ? meta.ogDescription : existing.ogDescription,
    ogImage: meta.ogImage !== undefined ? meta.ogImage : existing.ogImage,
    targetUrl: meta.targetUrl || existing.targetUrl,
    routingRules: meta.routingRules !== undefined ? meta.routingRules : existing.routingRules,
    geoTargeting: meta.geoTargeting !== undefined ? meta.geoTargeting : existing.geoTargeting,
    deviceTargeting: meta.deviceTargeting !== undefined ? meta.deviceTargeting : existing.deviceTargeting,
    maxClicks: meta.maxClicks !== undefined ? meta.maxClicks : existing.maxClicks,
    fallbackUrl: meta.fallbackUrl !== undefined ? meta.fallbackUrl : existing.fallbackUrl,
    abVariations: meta.abVariations !== undefined ? meta.abVariations : existing.abVariations,
    mainWeight: meta.mainWeight !== undefined ? meta.mainWeight : existing.mainWeight,
    passParams: meta.passParams !== undefined ? meta.passParams : (existing.passParams !== undefined ? existing.passParams : true),
    clicksCount: existing.clicksCount || 0,
    userId: meta.userId || existing.userId,
    updatedAt: new Date().toISOString(),
  };

  memoryStore.set(key, updated);
  persistStore();
  return updated;
}

export function getProtectedLink(slug: string): ProtectedLinkMeta | null {
  if (!slug) return null;
  return memoryStore.get(slug.toLowerCase()) || null;
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

export function recordLinkClick(slug: string): { isAllowed: boolean; fallbackUrl?: string } {
  if (!slug) return { isAllowed: true };
  const key = slug.toLowerCase();
  const link = memoryStore.get(key);

  if (!link) return { isAllowed: true };

  const currentClicks = link.clicksCount || 0;

  // Check if click limit applies
  if (link.maxClicks && link.maxClicks > 0) {
    if (currentClicks >= link.maxClicks) {
      return { isAllowed: false, fallbackUrl: link.fallbackUrl };
    }
  }

  // Increment clicks
  link.clicksCount = currentClicks + 1;
  memoryStore.set(key, link);
  persistStore();

  return { isAllowed: true };
}

export function deleteProtectedLink(slug: string) {
  if (!slug) return;
  memoryStore.delete(slug.toLowerCase());
  persistStore();
}
