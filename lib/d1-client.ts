import { CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN } from "@/lib/backend-config";
import crypto from "crypto";

export interface D1ApiKey {
  id: string;
  user_id: string;
  name: string;
  key_prefix: string;
  key_hash: string;
  raw_key: string | null;
  scope: string;
  rate_limit: number;
  last_used_at: string | null;
  created_at: string;
}

export async function executeD1Query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  if (!CF_ACCOUNT_ID || !CF_D1_DATABASE_ID || !CF_API_TOKEN) {
    return [];
  }

  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sql,
        params,
      }),
      cache: "no-store",
    }
  );

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.warn("[D1 REST API] Query failed:", res.status, errText);
    throw new Error(`D1 query failed (${res.status}): ${errText}`);
  }

  const data = await res.json().catch(() => null);
  if (data && data.success === false && data.errors?.length) {
    const errMsg = data.errors.map((e: any) => e.message || e.code).join(", ");
    console.warn("[D1 REST API] D1 returned error:", errMsg);
    throw new Error(`D1 query error: ${errMsg}`);
  }

  const results = data?.result?.[0]?.results;
  return Array.isArray(results) ? results : [];
}

/**
 * Directly insert a new API key into Cloudflare D1 (bypassing any worker rate limiter).
 */
export async function createD1ApiKey(opts: {
  userId: string;
  name: string;
  scope?: string;
  rateLimit?: number;
}): Promise<{
  id: string;
  key: string;
  raw_key: string;
  prefix: string;
  scope: string;
  name: string;
  rate_limit: number;
  created_at: string;
} | null> {
  const bytes = crypto.randomBytes(20).toString("hex");
  const plainKey = `lsh_live_${bytes}`;
  const keyHash = crypto.createHash("sha256").update(plainKey).digest("hex");
  const keyId = `key_${Math.random().toString(36).substring(2, 10)}`;
  const keyPrefix = `${plainKey.slice(0, 13)}...${plainKey.slice(-4)}`;
  const scope = opts.scope || "read_write";
  const rateLimit = opts.rateLimit ?? 600;
  const now = new Date().toISOString();

  const insertRes = await executeD1Query(
    `INSERT INTO api_keys (id, user_id, name, key_prefix, key_hash, raw_key, scope, rate_limit, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [keyId, opts.userId, opts.name, keyPrefix, keyHash, plainKey, scope, rateLimit, now]
  );

  return {
    id: keyId,
    key: plainKey,
    raw_key: plainKey,
    prefix: keyPrefix,
    scope,
    name: opts.name,
    rate_limit: rateLimit,
    created_at: now,
  };
}

/**
 * Directly delete an API key from Cloudflare D1.
 */
export async function deleteD1ApiKey(keyId: string, userId: string): Promise<boolean> {
  await executeD1Query(
    `DELETE FROM api_keys WHERE id = ? AND (user_id = ? OR user_id IN (SELECT id FROM users WHERE email = ?))`,
    [keyId, userId, userId]
  );
  return true;
}
