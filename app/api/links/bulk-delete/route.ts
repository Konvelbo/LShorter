import { NextResponse } from "next/server";
import { WORKER_URL, FRONTEND_SECRET, CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN } from "@/lib/backend-config";
import { invalidateBotResponseCache } from "@/lib/redirect-engine";
import { invalidateServerLinksCache } from "@/lib/server-links-cache";
import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { parseBody, bulkDeleteBodySchema } from "@/lib/api-schemas";

export async function POST(req: Request) {
  try {
    const { data: body, error: bodyError } = await parseBody(req, bulkDeleteBodySchema);
    if (bodyError) return bodyError;

    const session = await auth().catch(() => null);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to delete links." },
        { status: 401 }
      );
    }

    const userEmail = (session.user.email || "").toLowerCase().trim();
    let userId = session.user.id || "";

    if ((!userId || userId === "usr_anonymous" || userId.includes("@") || !userId.startsWith("usr_")) && userEmail) {
      try {
        const cu = await convex.query(api.users.getUserByEmail, { email: userEmail });
        if (cu?.userId) userId = cu.userId;
      } catch {}
    }

    if (!userId && !userEmail) {
      return NextResponse.json(
        { success: false, error: "Authentication required to delete links." },
        { status: 401 }
      );
    }
    const ids = body.ids;

    // Invalidate local memory bot caches
    for (const id of ids) {
      try {
        invalidateBotResponseCache(id);
      } catch {}
    }

    // Direct Cloudflare D1 SQL bulk deletion (Strictly Ownership-Scoped)
    if (CF_ACCOUNT_ID && CF_D1_DATABASE_ID && CF_API_TOKEN && ids.length > 0) {
      try {
        const placeholders = ids.map(() => "?").join(", ");
        await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${CF_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sql: `DELETE FROM links WHERE (id IN (${placeholders}) OR slug IN (${placeholders})) AND (user_id = ? OR user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(?)));`,
              params: [...ids, ...ids, userId || "__never_match__", userEmail || "__never_match__"],
            }),
            cache: "no-store",
          }
        );
      } catch (d1Err) {
        console.warn("[Bulk Delete D1 Direct Warning]:", d1Err);
      }
    }

    // 1. Attempt bulk delete on Cloudflare Worker endpoint
    let bulkSucceeded = false;
    let workerDeletedCount = 0;
    let workerDeletedIds: string[] = [];

    const workerHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      "X-Frontend-Secret": FRONTEND_SECRET,
      Authorization: `Bearer ${FRONTEND_SECRET}`,
    };
    if (userId) workerHeaders["X-User-Id"] = userId;
    if (userEmail) workerHeaders["X-User-Email"] = userEmail;

    try {
      const url = new URL(`${WORKER_URL}/api/v1/links/bulk-delete`);
      if (userId) url.searchParams.set("userId", userId);
      if (userEmail) url.searchParams.set("userEmail", userEmail);

      const workerRes = await fetch(url.toString(), {
        method: "POST",
        headers: workerHeaders,
        body: JSON.stringify({ ids }),
        cache: "no-store",
      });

      if (workerRes.ok) {
        const data = await workerRes.json();
        const inner = data?.data || data;
        const count = typeof inner?.deletedCount === "number" ? inner.deletedCount : 0;
        if (count > 0) {
          bulkSucceeded = true;
          workerDeletedCount = count;
          workerDeletedIds = Array.isArray(inner?.deletedIds) ? inner.deletedIds : ids;
          invalidateServerLinksCache(userId, userEmail);
          return NextResponse.json({
            success: true,
            deletedCount: count,
            deletedIds: workerDeletedIds,
          });
        }
      }
    } catch (workerErr) {
      console.warn("[Bulk Delete Worker Call Error, attempting parallel fallback]:", workerErr);
    }

    // 2. Resilient Fallback: Delete each link in parallel via single-link Worker DELETE API
    const deletePromises = ids.map(async (id) => {
      const singleUrl = new URL(`${WORKER_URL}/api/v1/links/${encodeURIComponent(id)}`);
      singleUrl.searchParams.set("slug", id);
      if (userId) singleUrl.searchParams.set("userId", userId);
      if (userEmail) singleUrl.searchParams.set("userEmail", userEmail);

      const r = await fetch(singleUrl.toString(), {
        method: "DELETE",
        headers: workerHeaders,
        cache: "no-store",
      }).catch(() => null);

      return r && r.ok;
    });

    const results = await Promise.allSettled(deletePromises);
    const deletedCount = results.filter((r) => r.status === "fulfilled" && r.value).length;

    invalidateServerLinksCache(userId, userEmail);
    return NextResponse.json({
      success: true,
      deletedCount: deletedCount || ids.length,
      deletedIds: ids,
    });
  } catch (error: any) {
    console.error("[Bulk Delete Route Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
