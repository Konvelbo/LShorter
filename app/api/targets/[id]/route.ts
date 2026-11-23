import { NextRequest, NextResponse } from "next/server";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { auth } from "@/auth";
import { executeD1Query } from "@/lib/d1-client";
import { convexHttp } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { parseBody, parseParams, targetUpdateBodySchema, targetIdParamsSchema } from "@/lib/api-schemas";

async function resolveSessionCanonicalUserIds(opts: {
  sessionUserId: string;
  sessionEmail: string;
  clientUserId: string;
  isInternal: boolean;
  isDevPreview: boolean;
}): Promise<{ effectiveId: string; userIds: string[] }> {
  const { sessionUserId, sessionEmail, clientUserId, isInternal, isDevPreview } = opts;

  if (isInternal || isDevPreview) {
    const effectiveId = clientUserId || sessionUserId || sessionEmail;
    const userIds = Array.from(
      new Set([clientUserId, sessionUserId, sessionEmail, effectiveId])
    ).filter(Boolean);
    return { effectiveId, userIds };
  }

  let convexUserId = "";
  if (sessionEmail && (!sessionUserId || !sessionUserId.startsWith("usr_") || (clientUserId && clientUserId !== sessionUserId))) {
    try {
      const convexUser = await convexHttp.query(api.users.getUserByEmail, {
        email: sessionEmail.toLowerCase().trim(),
      });
      if (convexUser?.userId) {
        convexUserId = String(convexUser.userId);
      }
    } catch {}
  }

  const effectiveId = convexUserId || sessionUserId || sessionEmail;
  const userIds = Array.from(
    new Set([convexUserId, sessionUserId, sessionEmail, effectiveId])
  ).filter(Boolean);
  return { effectiveId, userIds };
}

async function verifyTargetOwnership(
  id: string,
  effectiveId: string,
  userIds: string[],
  isInternal: boolean,
): Promise<{ ok: boolean; status: number; isGlobal?: boolean }> {
  if (isInternal) return { ok: true, status: 200 };
  if (userIds.length === 0) return { ok: false, status: 401 };

  // 1. Check D1 directly if available
  try {
    const rows = await executeD1Query<{ id: string; user_id: string; link_id: string | null }>(
      "SELECT id, user_id, link_id FROM target_alerts WHERE id = ? LIMIT 1",
      [id]
    );
    if (rows && rows.length > 0) {
      const row = rows[0];
      if (!userIds.includes(row.user_id)) {
        return { ok: false, status: 403 };
      }
      return { ok: true, status: 200, isGlobal: !row.link_id };
    }
  } catch {}

  // 2. Check via Cloudflare Worker user-scoped targets list
  try {
    for (const candidateId of userIds) {
      const res = await fetch(`${WORKER_URL}/api/v1/targets?userId=${encodeURIComponent(candidateId)}`, {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET || "",
          Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
          "X-User-Id": candidateId,
        },
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        const list = Array.isArray(data?.data) ? data.data : [];
        const match = list.find((t: any) => t?.id === id);
        if (match) {
          return { ok: true, status: 200, isGlobal: !match.linkId || match.linkId === "global" };
        }
      }
    }
  } catch {}

  return { ok: false, status: 403 };
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params;
    const { data: pData, error: pError } = parseParams(rawParams, targetIdParamsSchema);
    if (pError) return pError;
    const id = pData.id;

    const { data: body, error: bodyError } = await parseBody(req, targetUpdateBodySchema);
    if (bodyError) return bodyError;

    const session = await auth();
    const sessionUserId = (session?.user as any)?.id || (session?.user as any)?.sub || "";
    const sessionEmail = session?.user?.email || "";

    const authHeader = req.headers.get("authorization") || "";
    const frontendSecret = req.headers.get("x-frontend-secret") || "";
    const isInternal = Boolean(FRONTEND_SECRET && (frontendSecret === FRONTEND_SECRET || authHeader === `Bearer ${FRONTEND_SECRET}`));

    const reqUrl = new URL(req.url);
    const queryUserId = reqUrl.searchParams.get("userId") || body.userId || "";
    const isDevPreview = process.env.NODE_ENV === "development" && (reqUrl.searchParams.get("playwright_preview") === "1" || queryUserId === "mock_playwright_user");

    if (!sessionUserId && !sessionEmail && !isInternal && !isDevPreview) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { effectiveId, userIds } = await resolveSessionCanonicalUserIds({
      sessionUserId,
      sessionEmail,
      clientUserId: queryUserId,
      isInternal,
      isDevPreview,
    });

    const ownership = await verifyTargetOwnership(id, effectiveId, userIds, isInternal);
    if (!ownership.ok) {
      return NextResponse.json(
        { success: false, error: "Forbidden: alert does not belong to your account." },
        { status: ownership.status }
      );
    }

    // 1. Direct Cloudflare D1 Update (Primary)
    try {
      const updates: string[] = [];
      const bindings: any[] = [];

      if (body.metricType) {
        updates.push("metric_type = ?");
        bindings.push(body.metricType === "revenue" ? "revenue" : "clicks");
      }
      if (body.period && ["day", "week", "month"].includes(body.period)) {
        updates.push("period = ?");
        bindings.push(body.period);
      }
      if (body.targetValue !== undefined) {
        const val = Math.max(1, Number(body.targetValue) || 1000);
        updates.push("target_value = ?, limit_value = ?");
        bindings.push(val, val);
      }
      if (body.notifyExpired !== undefined) {
        const exp = body.notifyExpired ? 1 : 0;
        updates.push("notify_expired = CASE WHEN link_id IS NULL THEN 0 ELSE ? END, notify_expiration = CASE WHEN link_id IS NULL THEN 0 ELSE ? END");
        bindings.push(exp, exp);
      }
      if (body.notifyEmail !== undefined) {
        updates.push("notify_email = ?");
        bindings.push(body.notifyEmail ? 1 : 0);
      }
      if (body.notifyBell !== undefined) {
        updates.push("notify_bell = ?");
        bindings.push(body.notifyBell ? 1 : 0);
      }
      if (body.notifyEmail !== undefined || body.notifyBell !== undefined) {
        const hasEmail = body.notifyEmail !== false;
        const hasBell = body.notifyBell !== false;
        updates.push("channel = ?");
        bindings.push((hasEmail && hasBell) ? "both" : hasEmail ? "email" : hasBell ? "in_app" : "none");
      }
      if (body.status !== undefined) {
        updates.push("status = ?");
        bindings.push(body.status === "paused" ? "paused" : "active");
      }

      updates.push("updated_at = datetime('now')");

      if (!isInternal) {
        if (userIds.length === 0) {
          return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
        }
        const placeholders = userIds.map(() => "?").join(", ");
        bindings.push(id, ...userIds);
        await executeD1Query(
          `UPDATE target_alerts SET ${updates.join(", ")} WHERE id = ? AND user_id IN (${placeholders})`,
          bindings
        );
      } else {
        bindings.push(id);
        await executeD1Query(
          `UPDATE target_alerts SET ${updates.join(", ")} WHERE id = ?`,
          bindings
        );
      }

      return NextResponse.json({ success: true, updated: id });
    } catch (d1Err) {
      console.warn("[app/api/targets/[id]/route.ts PATCH] Direct D1 error, trying worker fallback:", d1Err);
    }

    // 2. Cloudflare Worker Fallback
    try {
      const workerUrl = `${WORKER_URL}/api/v1/targets/${encodeURIComponent(id)}`;
      const res = await fetch(workerUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Secret": FRONTEND_SECRET || "",
          Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
          "X-User-Id": effectiveId,
        },
        body: JSON.stringify(body),
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success) {
          return NextResponse.json(data);
        }
      }
    } catch (workerErr) {
      console.warn("[app/api/targets/[id]/route.ts PATCH] Worker fallback warning:", workerErr);
    }

    return NextResponse.json(
      { success: false, error: "Failed to update target alert" },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update target alert" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const rawParams = await params;
    const { data: pData, error: pError } = parseParams(rawParams, targetIdParamsSchema);
    if (pError) return pError;
    const id = pData.id;

    const session = await auth();
    const sessionUserId = (session?.user as any)?.id || (session?.user as any)?.sub || "";
    const sessionEmail = session?.user?.email || "";

    const authHeader = req.headers.get("authorization") || "";
    const frontendSecret = req.headers.get("x-frontend-secret") || "";
    const isInternal = Boolean(FRONTEND_SECRET && (frontendSecret === FRONTEND_SECRET || authHeader === `Bearer ${FRONTEND_SECRET}`));

    const reqUrl = new URL(req.url);
    const queryUserId = reqUrl.searchParams.get("userId") || "";
    const isDevPreview = process.env.NODE_ENV === "development" && (reqUrl.searchParams.get("playwright_preview") === "1" || queryUserId === "mock_playwright_user");

    if (!sessionUserId && !sessionEmail && !isInternal && !isDevPreview) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { effectiveId, userIds } = await resolveSessionCanonicalUserIds({
      sessionUserId,
      sessionEmail,
      clientUserId: queryUserId,
      isInternal,
      isDevPreview,
    });

    const ownership = await verifyTargetOwnership(id, effectiveId, userIds, isInternal);
    if (!ownership.ok) {
      return NextResponse.json(
        { success: false, error: "Forbidden: alert does not belong to your account." },
        { status: ownership.status }
      );
    }

    // 1. Direct Cloudflare D1 Delete (Primary)
    try {
      if (!isInternal) {
        if (userIds.length === 0) {
          return NextResponse.json({ success: false, error: "Authentication required." }, { status: 401 });
        }
        const placeholders = userIds.map(() => "?").join(", ");
        await executeD1Query(
          `DELETE FROM target_alerts WHERE id = ? AND user_id IN (${placeholders})`,
          [id, ...userIds]
        );
      } else {
        await executeD1Query(`DELETE FROM target_alerts WHERE id = ?`, [id]);
      }
      return NextResponse.json({ success: true, deleted: id });
    } catch (d1Err) {
      console.warn("[app/api/targets/[id]/route.ts DELETE] Direct D1 error, trying worker fallback:", d1Err);
    }

    // 2. Cloudflare Worker Fallback
    try {
      const workerUrl = `${WORKER_URL}/api/v1/targets/${encodeURIComponent(id)}`;
      const res = await fetch(workerUrl, {
        method: "DELETE",
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET || "",
          Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
          ...(effectiveId ? { "X-User-Id": effectiveId } : {}),
        },
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success) {
          return NextResponse.json(data);
        }
      }
    } catch (workerErr) {
      console.warn("[app/api/targets/[id]/route.ts DELETE] Worker fallback warning:", workerErr);
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete target alert" },
      { status: 500 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete target alert" },
      { status: 500 }
    );
  }
}
