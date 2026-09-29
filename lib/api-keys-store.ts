import fs from "fs";
import path from "path";
import crypto from "crypto";

export interface StoredApiKey {
  id: string;
  userId: string;
  name: string;
  prefix: string;
  keyPrefix: string;
  keyHash: string;
  rawKey?: string;
  scope: string;
  rateLimit: number;
  rate_limit: number;
  createdAt: string;
  created_at: string;
  lastUsedAt?: string;
  userEmail?: string;
  userName?: string;
  userFullName?: string;
  email?: string;
  fullName?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const STORE_PATH = path.join(DATA_DIR, "api-keys.json");

let memoryKeys: StoredApiKey[] = [];
let isLoaded = false;

function ensureLoaded() {
  if (isLoaded) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(STORE_PATH)) {
      const content = fs.readFileSync(STORE_PATH, "utf-8");
      memoryKeys = JSON.parse(content || "[]");
    } else {
      memoryKeys = [];
      fs.writeFileSync(STORE_PATH, JSON.stringify(memoryKeys, null, 2));
    }
  } catch (err) {
    console.warn("[API Keys Store] Error reading keys file, using memory:", err);
  }
  isLoaded = true;
}

function persist() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(memoryKeys, null, 2));
  } catch (err) {
    console.warn("[API Keys Store] Error saving keys file:", err);
  }
}

export function getApiKeysForUser(userId: string): StoredApiKey[] {
  ensureLoaded();
  if (!userId) return memoryKeys;
  return memoryKeys.filter((k) => k.userId === userId);
}

export function createApiKeyForUser(data: {
  id?: string;
  rawKey?: string;
  userId: string;
  name: string;
  scope?: string;
  rateLimit?: number;
  userEmail?: string;
  userName?: string;
  userFullName?: string;
  email?: string;
  fullName?: string;
}): { key: StoredApiKey; rawKey: string } {
  ensureLoaded();

  const id = data.id || `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const rawKey = data.rawKey || `lsh_live_${randomBytes}`;
  const cleanBody = rawKey.replace(/^lsh_live_/, "");
  const prefix = `lsh_live_${cleanBody.substring(0, 4)}...${cleanBody.slice(-4)}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const now = new Date().toISOString();

  const userEmail = data.userEmail || data.email || "";
  const userFullName = data.userFullName || data.fullName || data.userName || "";

  const newKey: StoredApiKey = {
    id,
    userId: data.userId,
    name: data.name || "Nouvelle Clé API",
    prefix,
    keyPrefix: prefix,
    keyHash,
    rawKey,
    scope: data.scope || "read_write",
    rateLimit: data.rateLimit || 600,
    rate_limit: data.rateLimit || 600,
    createdAt: now,
    created_at: now,
    userEmail: userEmail || undefined,
    userName: userFullName || undefined,
    userFullName: userFullName || undefined,
    email: userEmail || undefined,
    fullName: userFullName || undefined,
  };

  memoryKeys = memoryKeys.filter((k) => k.id !== id);
  memoryKeys.unshift(newKey);
  persist();

  return { key: newKey, rawKey };
}

export function mergeCloudflareKeysForUser(
  userId: string,
  cfKeys: any[]
): StoredApiKey[] {
  ensureLoaded();
  if (!Array.isArray(cfKeys)) return getApiKeysForUser(userId);

  let changed = false;
  for (const ck of cfKeys) {
    if (!ck || !ck.id) continue;
    const existing = memoryKeys.find((k) => k.id === ck.id);
    if (!existing) {
      const raw = ck.raw_key || ck.rawKey || ck.key || undefined;
      const prefix =
        ck.prefix ||
        ck.key_prefix ||
        (raw ? `lsh_live_${raw.replace(/^lsh_live_/, "").substring(0, 4)}...${raw.slice(-4)}` : "lsh_live_••••••••");
      memoryKeys.push({
        id: ck.id,
        userId: ck.user_id || userId,
        name: ck.name || "API Key",
        prefix,
        keyPrefix: prefix,
        keyHash: ck.key_hash || "",
        rawKey: raw,
        scope: ck.scope || "read_write",
        rateLimit: Number(ck.rate_limit || 600),
        rate_limit: Number(ck.rate_limit || 600),
        createdAt: ck.created_at || new Date().toISOString(),
        created_at: ck.created_at || new Date().toISOString(),
        lastUsedAt: ck.last_used_at || undefined,
      });
      changed = true;
    } else if (ck.last_used_at && existing.lastUsedAt !== ck.last_used_at) {
      existing.lastUsedAt = ck.last_used_at;
      changed = true;
    }
  }

  if (changed) {
    persist();
  }
  return getApiKeysForUser(userId);
}

export function revokeApiKey(id: string, userId?: string): boolean {
  ensureLoaded();
  const initialLen = memoryKeys.length;
  memoryKeys = memoryKeys.filter((k) => {
    if (k.id === id) {
      if (userId && k.userId !== userId) return true;
      return false;
    }
    return true;
  });

  if (memoryKeys.length !== initialLen) {
    persist();
    return true;
  }
  return false;
}

export function validateApiKey(rawKey: string): StoredApiKey | null {
  ensureLoaded();
  if (!rawKey) return null;
  const hash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const found = memoryKeys.find((k) => k.keyHash === hash);
  if (found) {
    found.lastUsedAt = new Date().toISOString();
    persist();
    return found;
  }
  return null;
}
