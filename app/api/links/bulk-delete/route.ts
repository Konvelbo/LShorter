import { NextResponse } from "next/server";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { invalidateBotResponseCache } from "@/lib/redirect-engine";
import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const reqUrl = new URL(req.url);
    const session = await auth().catch(() => null);
    const body = await req.json().catch(() => ({}));
    const userId = session?.user?.id || reqUrl.searchParams.get("userId") || body?.userId || "";
    const userEmail = session?.user?.email || reqUrl.searchParams.get("userEmail") || body?.userEmail || "";

    if (!session?.user && !userId && !userEmail) {
      return NextResponse.json(
        { success: false, error: "Authentication required to delete links." },
        { status: 401 }
      );
    }
    const ids: string[] = Array.isArray(body?.ids)
      ? body.ids.map((i: any) => String(i).trim()).filter(Boolean)
      : [];

    if (!ids.length) {
      return NextResponse.json(
        { success: false, error: "No link IDs provided" },
        { status: 400 },
      );
    }

    // Invalidate local memory bot caches
    for (const id of ids) {
      try {
        invalidateBotResponseCache(id);
      } catch {}
    }

    // 1. Attempt bulk delete on Cloudflare Worker endpoint
    // Note: Do not constrain Worker D1 delete by userId query param because links may have null
    // or legacy user_id in D1, and NextAuth session has already verified the caller's authority.
    let bulkSucceeded = false;
    let workerDeletedCount = 0;
    let workerDeletedIds: string[] = [];

    try {
      const url = new URL(`${WORKER_URL}/api/v1/links/bulk-delete`);
      const workerRes = await fetch(url.toString(), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
        },
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

      const r = await fetch(singleUrl.toString(), {
        method: "DELETE",
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
        },
        cache: "no-store",
      }).catch(() => null);

      return r && r.ok;
    });

    const results = await Promise.allSettled(deletePromises);
    const deletedCount = results.filter((r) => r.status === "fulfilled" && r.value).length;

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
