import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { executeD1Query } from "@/lib/d1-client";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { invalidateServerLinksCache } from "@/lib/server-links-cache";
import { invalidateWorkerLinkCache, invalidateBotResponseCache } from "@/lib/redirect-engine";
import {
  GUEST_COOKIE_NAME,
  verifyGuestToken,
  ensureGuestLinksTable,
} from "@/lib/guest-links";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

/**
 * POST /api/public/claim
 * Transfers any unclaimed guest links belonging to the caller's lsh_guest cookie
 * into their authenticated LShorter account, removes the 3-day expiration (making them permanent),
 * preserves all click_events, updates Cloudflare KV, and removes the temporary guest user record.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth().catch(() => null);
    if (!session?.user || (session.user as { userNotFound?: boolean }).userNotFound) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const token = req.cookies.get(GUEST_COOKIE_NAME)?.value;
    const guestId = verifyGuestToken(token);
    if (!guestId) {
      return NextResponse.json(
        { success: true, claimedCount: 0, claimedSlugs: [] },
        { headers: NO_STORE_HEADERS }
      );
    }

    const userEmail = (session.user.email || "").toLowerCase().trim();
    let userId = session.user.id || "";
    let userPlan = ((session.user as { plan?: string }).plan || "FREE").toUpperCase();
    const userName = session.user.name || "User";

    if ((!userId || userId === "usr_anonymous" || userId.includes("@") || !userId.startsWith("usr_")) && userEmail) {
      try {
        const cu = await convex.query(api.users.getUserByEmail, { email: userEmail });
        if (cu?.userId) userId = cu.userId;
        if (cu?.plan) userPlan = String(cu.plan).toUpperCase();
      } catch (e) {
        console.warn("[POST /api/public/claim] Convex lookup warning:", e);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unable to resolve user account." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    await ensureGuestLinksTable();

    const unclaimed = await executeD1Query<{
      link_id: string;
      slug: string;
      target_url: string;
    }>(
      `SELECT link_id, slug, target_url FROM guest_links
       WHERE guest_id = ? AND claimed_by IS NULL`,
      [guestId]
    ).catch(() => []);

    if (!unclaimed.length) {
      const res = NextResponse.json(
        { success: true, claimedCount: 0, claimedSlugs: [] },
        { headers: NO_STORE_HEADERS }
      );
      res.cookies.delete(GUEST_COOKIE_NAME);
      return res;
    }

    // 1. Ensure authoritative user row exists in D1 to satisfy foreign keys
    await executeD1Query(
      `INSERT OR IGNORE INTO users (id, email, name, plan, created_at)
       VALUES (?, ?, ?, ?, datetime('now'))`,
      [userId, userEmail || `${userId}@user.lsho.cc`, userName, userPlan || "FREE"]
    ).catch(() => {});

    const nowIso = new Date().toISOString();
    const claimedSlugs: string[] = [];

    // 2. Reassign each link & its historical click_events in D1, and remove 3-day expiry (make permanent)
    for (const row of unclaimed) {
      try {
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

        // Sync Worker KV so edge redirects immediately reflect permanent status & new owner
        await fetch(`${WORKER_URL}/api/v1/links/${encodeURIComponent(row.slug)}`, {
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
        }).catch(() => {});

        try {
          invalidateWorkerLinkCache(row.slug);
          invalidateBotResponseCache(row.slug);
        } catch {}

        claimedSlugs.push(row.slug);
      } catch (linkErr) {
        console.warn(`[POST /api/public/claim] Failed to claim ${row.slug}:`, linkErr);
      }
    }

    // 3. Remove temporary guest user record from D1 users table
    await executeD1Query(`DELETE FROM users WHERE id = ?`, [guestId]).catch(() => {});

    // 4. Bust server links cache for the claiming user
    invalidateServerLinksCache(userId, userEmail);

    const response = NextResponse.json(
      {
        success: true,
        claimedCount: claimedSlugs.length,
        claimedSlugs,
      },
      { headers: NO_STORE_HEADERS }
    );
    response.cookies.delete(GUEST_COOKIE_NAME);
    return response;
  } catch (err) {
    console.error("[POST /api/public/claim] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to claim guest links." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
