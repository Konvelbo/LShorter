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
  userId: string;
  name: string;
  scope?: string;
  rateLimit?: number;
}): { key: StoredApiKey; rawKey: string } {
  ensureLoaded();

  const id = `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const randomBytes = crypto.randomBytes(24).toString("hex");
  const rawKey = `lsh_live_${randomBytes}`;
  const prefix = `lsh_live_${randomBytes.substring(0, 4)}...${randomBytes.slice(-4)}`;
  const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
  const now = new Date().toISOString();

  const newKey: StoredApiKey = {
    id,
    userId: data.userId,
    name: data.name || "Nouvelle Clé API",
    prefix,
    keyPrefix: prefix,
    keyHash,
    scope: data.scope || "read_write",
    rateLimit: data.rateLimit || 600,
    rate_limit: data.rateLimit || 600,
    createdAt: now,
    created_at: now,
  };

  memoryKeys.unshift(newKey);
  persist();

  return { key: newKey, rawKey };
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
