import crypto from "crypto";
import { executeD1Query } from "@/lib/d1-client";
import { FRONTEND_SECRET, WORKER_URL } from "@/lib/backend-config";
import { RESERVED_SLUGS } from "@/lib/security-utils";
import { invalidateServerLinksCache } from "@/lib/server-links-cache";
import {
  invalidateWorkerLinkCache,
  invalidateBotResponseCache,
} from "@/lib/redirect-engine";

export const GUEST_COOKIE_NAME = "lsh_guest";
export const GUEST_MAX_LINKS = 1;
export const GUEST_LINK_TTL_HOURS = 24;
export const GUEST_LINK_TTL_DAYS = 1;
export const GUEST_LINK_TTL_MS = GUEST_LINK_TTL_HOURS * 60 * 60 * 1000; // 24 hours
export const GUEST_COOKIE_MAX_AGE_SEC = 30 * 24 * 60 * 60; // 30 days

export interface GuestLinkRecord {
  linkId: string;
  slug: string;
  shortUrl: string;
  targetUrl: string;
  clicksCount: number;
  expiresAt: string;
  createdAt: string;
  isGuest: true;
}

interface RawGuestLinkRow {
  link_id: string;
  slug: string;
  target_url: string;
  short_url: string;
  guest_id: string;
  ip_hash: string;
  expires_at: string;
  created_at: string;
  claimed_by: string | null;
  claimed_at: string | null;
  live_clicks?: number | null;
}

const INIT_GUEST_LINKS_SQL = `
CREATE TABLE IF NOT EXISTS guest_links (
  link_id TEXT PRIMARY KEY,
  slug TEXT NOT NULL,
  target_url TEXT NOT NULL,
  short_url TEXT NOT NULL,
  guest_id TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  claimed_by TEXT,
  claimed_at TEXT
);
`;

const INIT_GUEST_LINKS_IDX1 = `CREATE INDEX IF NOT EXISTS idx_guest_links_guest_id ON guest_links(guest_id);`;
const INIT_GUEST_LINKS_IDX2 = `CREATE INDEX IF NOT EXISTS idx_guest_links_ip_hash ON guest_links(ip_hash);`;

let ensureTablePromise: Promise<void> | null = null;

function getSigningKey(): string {
  return (
    process.env.AUTH_SECRET || FRONTEND_SECRET || "lsh_guest_signing_fallback"
  );
}

export function createGuestId(): string {
  return `guest_${crypto.randomBytes(8).toString("hex")}`;
}

export function signGuestToken(guestId: string): string {
  const sig = crypto
    .createHmac("sha256", getSigningKey())
    .update(guestId)
    .digest("hex")
    .slice(0, 32);
  return `${guestId}.${sig}`;
}

export function verifyGuestToken(
  token: string | undefined | null
): string | null {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [guestId, sig] = parts;
  if (!/^guest_[a-f0-9]{16}$/.test(guestId) || !/^[a-f0-9]{32}$/.test(sig)) {
    return null;
  }
  const expected = crypto
    .createHmac("sha256", getSigningKey())
    .update(guestId)
    .digest("hex")
    .slice(0, 32);
  try {
    const a = Buffer.from(sig, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) return null;
    return crypto.timingSafeEqual(a, b) ? guestId : null;
  } catch {
    return null;
  }
}

export function getClientIpHash(req: Request): string {
  const cfIp = req.headers.get("cf-connecting-ip");
  const xff = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = req.headers.get("x-real-ip")?.trim();
  const rawIp = cfIp || xff || realIp || "127.0.0.1";
  return crypto
    .createHmac("sha256", getSigningKey())
    .update(`ip:${rawIp}`)
    .digest("hex");
}

export function generateGuestSlug(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  for (let attempt = 0; attempt < 10; attempt++) {
    const bytes = crypto.randomBytes(6);
    let slug = "";
    for (let i = 0; i < 6; i++) {
      slug += alphabet[bytes[i] % alphabet.length];
    }
    if (!RESERVED_SLUGS.has(slug)) {
      return slug;
    }
  }
  return `l${crypto.randomBytes(4).toString("hex")}`;
}

export async function ensureGuestLinksTable(): Promise<void> {
  if (!ensureTablePromise) {
    ensureTablePromise = (async () => {
      await executeD1Query(INIT_GUEST_LINKS_SQL);
      await executeD1Query(INIT_GUEST_LINKS_IDX1).catch(() => {});
      await executeD1Query(INIT_GUEST_LINKS_IDX2).catch(() => {});
    })().catch((err) => {
      ensureTablePromise = null;
      throw err;
    });
  }
  return ensureTablePromise;
}

/**
 * Deletes an expired or zero-countdown guest link from D1 (`links`, `click_events`, `guest_links`)
 * and removes it from the Cloudflare Edge Worker.
 */
async function hardDeleteUnclaimedGuestRow(row: {
  link_id: string;
  slug: string;
  guest_id?: string;
}): Promise<void> {
  await executeD1Query(
    `DELETE FROM links WHERE id = ? OR LOWER(slug) = LOWER(?)`,
    [row.link_id, row.slug]
  ).catch(() => {});

  await executeD1Query(
    `DELETE FROM click_events WHERE link_id = ? OR LOWER(slug) = LOWER(?)`,
    [row.link_id, row.slug]
  ).catch(() => {});

  await executeD1Query(`DELETE FROM guest_links WHERE link_id = ?`, [
    row.link_id,
  ]).catch(() => {});

  await fetch(`${WORKER_URL}/api/v1/links/${encodeURIComponent(row.slug)}`, {
    method: "DELETE",
    headers: {
      "X-Frontend-Secret": FRONTEND_SECRET || "",
      Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
      ...(row.guest_id ? { "X-User-Id": row.guest_id } : {}),
    },
    cache: "no-store",
  }).catch(() => {});

  try {
    invalidateWorkerLinkCache(row.slug);
    invalidateBotResponseCache(row.slug);
  } catch {}
}

/**
 * Automatically purges all unclaimed guest links whose 24-hour timer has expired (`expires_at <= now`).
 */
export async function purgeExpiredGuestLinks(): Promise<number> {
  await ensureGuestLinksTable();
  const nowIso = new Date().toISOString();

  const expiredRows = await executeD1Query<{
    link_id: string;
    slug: string;
    guest_id: string;
  }>(
    `SELECT link_id, slug, guest_id FROM guest_links
     WHERE claimed_by IS NULL AND expires_at <= ?
     LIMIT 25`,
    [nowIso]
  ).catch(() => []);

  if (!expiredRows.length) return 0;

  for (const row of expiredRows) {
    await hardDeleteUnclaimedGuestRow(row);
  }

  return expiredRows.length;
}

/**
 * Deletes a specific unclaimed guest link by slug when its 24h countdown reaches zero on the client.
 */
export async function deleteGuestLinkBySlug(params: {
  slug: string;
  guestId: string | null;
  ipHash: string;
}): Promise<boolean> {
  await ensureGuestLinksTable();
  const cleanSlug = params.slug.trim();
  if (!cleanSlug) return false;

  const rows = await executeD1Query<{
    link_id: string;
    slug: string;
    guest_id: string;
    ip_hash: string;
  }>(
    `SELECT link_id, slug, guest_id, ip_hash FROM guest_links
     WHERE LOWER(slug) = LOWER(?) AND claimed_by IS NULL`,
    [cleanSlug]
  ).catch(() => []);

  if (!rows.length) return false;

  const target = rows.find(
    (r) =>
      (params.guestId && r.guest_id === params.guestId) ||
      r.ip_hash === params.ipHash
  );
  if (!target) return false;

  await hardDeleteUnclaimedGuestRow(target);
  return true;
}

export async function recordGuestLink(entry: {
  linkId: string;
  slug: string;
  targetUrl: string;
  shortUrl: string;
  guestId: string;
  ipHash: string;
  expiresAt: string;
}): Promise<void> {
  await ensureGuestLinksTable();
  const now = new Date().toISOString();
  await executeD1Query(
    `INSERT OR REPLACE INTO guest_links (link_id, slug, target_url, short_url, guest_id, ip_hash, expires_at, created_at, claimed_by, claimed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
    [
      entry.linkId,
      entry.slug,
      entry.targetUrl,
      entry.shortUrl,
      entry.guestId,
      entry.ipHash,
      entry.expiresAt,
      now,
    ]
  );
}

export async function countGuestLinksUsage(
  guestId: string | null,
  ipHash: string
): Promise<{
  cookieCount: number;
  ipCount: number;
  effectiveCount: number;
  remaining: number;
  limitReached: boolean;
}> {
  await ensureGuestLinksTable();
  await purgeExpiredGuestLinks().catch(() => {});

  const nowIso = new Date().toISOString();
  const cutoffIso = new Date(Date.now() - GUEST_LINK_TTL_MS).toISOString();

  let cookieCount = 0;
  if (guestId) {
    const rows = await executeD1Query<{ cnt: number }>(
      `SELECT COUNT(*) AS cnt FROM guest_links
       WHERE guest_id = ? AND claimed_by IS NULL AND expires_at > ?`,
      [guestId, nowIso]
    ).catch(() => []);
    cookieCount = Number(rows[0]?.cnt || 0);
  }

  const ipRows = await executeD1Query<{ cnt: number }>(
    `SELECT COUNT(*) AS cnt FROM guest_links
     WHERE ip_hash = ? AND claimed_by IS NULL AND created_at > ? AND expires_at > ?`,
    [ipHash, cutoffIso, nowIso]
  ).catch(() => []);
  const ipCount = Number(ipRows[0]?.cnt || 0);

  const effectiveCount = Math.max(cookieCount, ipCount);
  const remaining = Math.max(0, GUEST_MAX_LINKS - effectiveCount);

  return {
    cookieCount,
    ipCount,
    effectiveCount,
    remaining,
    limitReached: effectiveCount >= GUEST_MAX_LINKS,
  };
}

export async function getGuestLinksWithLiveClicks(
  guestId: string | null,
  ipHash?: string
): Promise<GuestLinkRecord[]> {
  await ensureGuestLinksTable();
  await purgeExpiredGuestLinks().catch(() => {});

  if (!guestId && !ipHash) return [];
  const nowIso = new Date().toISOString();

  const rows = await executeD1Query<RawGuestLinkRow>(
    guestId && ipHash
      ? `SELECT
           g.link_id,
           g.slug,
           g.target_url,
           g.short_url,
           g.guest_id,
           g.ip_hash,
           g.expires_at,
           g.created_at,
           g.claimed_by,
           g.claimed_at,
           COALESCE(l.clicks_count, 0) AS live_clicks
         FROM guest_links g
         LEFT JOIN links l ON l.id = g.link_id OR LOWER(l.slug) = LOWER(g.slug)
         WHERE (g.guest_id = ? OR g.ip_hash = ?) AND g.claimed_by IS NULL AND g.expires_at > ?
         ORDER BY g.created_at DESC
         LIMIT 1`
      : guestId
        ? `SELECT
             g.link_id,
             g.slug,
             g.target_url,
             g.short_url,
             g.guest_id,
             g.ip_hash,
             g.expires_at,
             g.created_at,
             g.claimed_by,
             g.claimed_at,
             COALESCE(l.clicks_count, 0) AS live_clicks
           FROM guest_links g
           LEFT JOIN links l ON l.id = g.link_id OR LOWER(l.slug) = LOWER(g.slug)
           WHERE g.guest_id = ? AND g.claimed_by IS NULL AND g.expires_at > ?
           ORDER BY g.created_at DESC
           LIMIT 1`
        : `SELECT
             g.link_id,
             g.slug,
             g.target_url,
             g.short_url,
             g.guest_id,
             g.ip_hash,
             g.expires_at,
             g.created_at,
             g.claimed_by,
             g.claimed_at,
             COALESCE(l.clicks_count, 0) AS live_clicks
           FROM guest_links g
           LEFT JOIN links l ON l.id = g.link_id OR LOWER(l.slug) = LOWER(g.slug)
           WHERE g.ip_hash = ? AND g.claimed_by IS NULL AND g.expires_at > ?
           ORDER BY g.created_at DESC
           LIMIT 1`,
    guestId && ipHash
      ? [guestId, ipHash, nowIso]
      : [guestId || ipHash!, nowIso]
  ).catch(() => []);

  return rows.map((row) => ({
    linkId: row.link_id,
    slug: row.slug,
    shortUrl: (row.short_url || `https://lsho.cc/${row.slug}`).replace(
      /\/r\/([^/?#]+)$/,
      "/$1"
    ),
    targetUrl: row.target_url,
    clicksCount: Number(row.live_clicks ?? 0),
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    isGuest: true as const,
  }));
}

/**
 * Claims any active unclaimed guest link (matching `guestId` cookie OR `ipHash`)
 * into the user's permanent dashboard account (`expires_at = NULL`).
 */
export async function claimGuestLinksForUser(params: {
  guestId: string | null;
  ipHash: string | null;
  userId: string;
  userEmail: string;
  userName?: string;
  userPlan?: string;
}): Promise<{ claimedCount: number; claimedSlugs: string[] }> {
  const { guestId, ipHash, userId, userEmail } = params;
  const userName = params.userName || "User";
  const userPlan = params.userPlan || "FREE";

  if (!userId || (!guestId && !ipHash)) {
    return { claimedCount: 0, claimedSlugs: [] };
  }

  await ensureGuestLinksTable();
  await purgeExpiredGuestLinks().catch(() => {});

  const nowIso = new Date().toISOString();

  const unclaimed = await executeD1Query<{
    link_id: string;
    slug: string;
    target_url: string;
    guest_id: string;
  }>(
    guestId && ipHash
      ? `SELECT link_id, slug, target_url, guest_id FROM guest_links
         WHERE (guest_id = ? OR ip_hash = ?) AND claimed_by IS NULL AND expires_at > ?`
      : guestId
        ? `SELECT link_id, slug, target_url, guest_id FROM guest_links
           WHERE guest_id = ? AND claimed_by IS NULL AND expires_at > ?`
        : `SELECT link_id, slug, target_url, guest_id FROM guest_links
           WHERE ip_hash = ? AND claimed_by IS NULL AND expires_at > ?`,
    guestId && ipHash
      ? [guestId, ipHash, nowIso]
      : [guestId || ipHash!, nowIso]
  ).catch(() => []);

  if (!unclaimed.length) {
    return { claimedCount: 0, claimedSlugs: [] };
  }

  // 1. Ensure authoritative user row exists in D1
  await executeD1Query(
    `INSERT OR IGNORE INTO users (id, email, name, plan, created_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
    [userId, userEmail || `${userId}@user.lsho.cc`, userName, userPlan]
  ).catch(() => {});

  const claimedSlugs: string[] = [];
  const guestIdsToCleanup = new Set<string>();

  for (const row of unclaimed) {
    try {
      if (row.guest_id) guestIdsToCleanup.add(row.guest_id);

      await executeD1Query(
        `UPDATE links
         SET user_id = ?, expires_at = NULL, is_active = 1, updated_at = datetime('now')
         WHERE id = ? OR LOWER(slug) = LOWER(?)`,
        [userId, row.link_id, row.slug]
      );

      await executeD1Query(
        `UPDATE click_events
         SET user_id = ?
         WHERE link_id = ? OR LOWER(slug) = LOWER(?)`,
        [userId, row.link_id, row.slug]
      ).catch(() => {});

      await executeD1Query(
        `UPDATE guest_links
         SET claimed_by = ?, claimed_at = ?
         WHERE link_id = ?`,
        [userId, nowIso, row.link_id]
      );

      await fetch(
        `${WORKER_URL}/api/v1/links/${encodeURIComponent(row.slug)}`,
        {
          method: "PATCH",
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET || "",
            Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
            "X-User-Id": userId,
            "X-User-Email": userEmail,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            id: row.link_id,
            slug: row.slug,
            targetUrl: row.target_url,
            userId,
            user_id: userId,
            userEmail,
            expiresAt: null,
            expires_at: null,
            isActive: true,
            is_active: 1,
          }),
          cache: "no-store",
        }
      ).catch(() => {});

      try {
        invalidateWorkerLinkCache(row.slug);
        invalidateBotResponseCache(row.slug);
      } catch {}

      claimedSlugs.push(row.slug);
    } catch (err) {
      console.warn(`[claimGuestLinksForUser] Failed to claim ${row.slug}:`, err);
    }
  }

  for (const gid of guestIdsToCleanup) {
    await executeD1Query(`DELETE FROM users WHERE id = ?`, [gid]).catch(
      () => {}
    );
  }

  invalidateServerLinksCache(userId, userEmail);

  return {
    claimedCount: claimedSlugs.length,
    claimedSlugs,
  };
}

export function isDisallowedLoopHost(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    const host = parsed.hostname.toLowerCase();
    return (
      host === "lsho.cc" ||
      host.endsWith(".lsho.cc") ||
      host === "lshorter-api.fiatechnologiecam.workers.dev"
    );
  } catch {
    return true;
  }
}
