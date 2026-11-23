import { NextRequest, NextResponse } from "next/server";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { auth } from "@/auth";
import { executeD1Query } from "@/lib/d1-client";
import { convexHttp } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { parseBody, targetCreateBodySchema } from "@/lib/api-schemas";

async function resolveSessionCanonicalUserIds(opts: {
  sessionUserId: string;
  sessionEmail: string;
  clientUserId: string;
  isInternal: boolean;
}): Promise<{ effectiveId: string; candidateUserIds: string[] }> {
  const { sessionUserId, sessionEmail, clientUserId, isInternal } = opts;

  if (isInternal) {
    const effectiveId = clientUserId || sessionUserId || sessionEmail;
    const candidateUserIds = Array.from(
      new Set([clientUserId, sessionUserId, sessionEmail, effectiveId])
    ).filter(Boolean);
    return { effectiveId, candidateUserIds };
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
  const candidateUserIds = Array.from(
    new Set([convexUserId, sessionUserId, sessionEmail, effectiveId])
  ).filter(Boolean);
  return { effectiveId, candidateUserIds };
}

const INIT_TARGETS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS target_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  link_id TEXT,
  title TEXT,
  metric_type TEXT NOT NULL DEFAULT 'clicks',
  limit_value REAL NOT NULL,
  target_value REAL,
  current_value REAL DEFAULT 0,
  period TEXT NOT NULL DEFAULT 'month',
  notify_expiration INTEGER DEFAULT 0,
  notify_expired INTEGER DEFAULT 0,
  channel TEXT DEFAULT 'both',
  notify_email INTEGER DEFAULT 1,
  notify_bell INTEGER DEFAULT 1,
  schedule TEXT DEFAULT 'instantly',
  status TEXT NOT NULL DEFAULT 'active',
  last_notified_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
`;

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id || (session?.user as any)?.sub || "";
    const sessionEmail = session?.user?.email || "";
    
    // Check if internal frontend request or query param
    const authHeader = req.headers.get("authorization") || "";
    const frontendSecret = req.headers.get("x-frontend-secret") || "";
    const isInternal = Boolean(FRONTEND_SECRET && (frontendSecret === FRONTEND_SECRET || authHeader === `Bearer ${FRONTEND_SECRET}`));

    const reqUrl = new URL(req.url);
    const queryUserId = reqUrl.searchParams.get("userId") || "";

    if (!isInternal && !sessionUserId && !sessionEmail) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view targets." },
        { status: 401 }
      );
    }

    const { effectiveId, candidateUserIds } = await resolveSessionCanonicalUserIds({
      sessionUserId,
      sessionEmail,
      clientUserId: queryUserId,
      isInternal,
    });

    // 1. Direct Cloudflare D1 Query (Primary & Authoritative)
    try {
      await executeD1Query(INIT_TARGETS_TABLE_SQL).catch(() => null);

      if (candidateUserIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      const placeholders = candidateUserIds.map(() => "?").join(", ");

      const d1Rows = await executeD1Query<any>(
        `SELECT t.*,
                COALESCE(t.target_value, t.limit_value) as target_value,
                COALESCE(t.notify_expired, t.notify_expiration) as notify_expired,
                COALESCE(t.notify_email, CASE WHEN t.channel IN ('both', 'email') THEN 1 ELSE 0 END) as notify_email,
                COALESCE(t.notify_bell, CASE WHEN t.channel IN ('both', 'bell', 'in_app') THEN 1 ELSE 0 END) as notify_bell,
                COALESCE(l.meta_title, l.og_title, l.slug) as link_title, l.slug as link_slug, l.target_url as link_target_url, l.clicks_count as link_clicks
         FROM target_alerts t
         LEFT JOIN links l ON t.link_id = l.id
         WHERE t.user_id IN (${placeholders})
         ORDER BY CASE WHEN t.link_id IS NULL AND t.metric_type = 'clicks' THEN 0 WHEN t.link_id IS NULL THEN 1 ELSE 2 END, t.updated_at DESC, t.created_at DESC`,
        candidateUserIds
      );

      const formatted = (d1Rows || []).map((r) => ({
        id: r.id,
        userId: r.user_id,
        linkId: r.link_id || null,
        linkTitle: r.title || r.link_title || (r.link_id ? "Custom Link" : "All Links Aggregated"),
        slug: r.link_slug || (r.link_id ? "" : "global"),
        targetUrl: r.link_target_url || "",
        metricType: r.metric_type || "clicks",
        period: r.period || "month",
        targetValue: Number(r.target_value ?? r.limit_value ?? 1000),
        currentValue: Number(r.link_clicks || 0),
        notifyExpired: Boolean(r.notify_expired || r.notify_expiration),
        notifyEmail: Boolean(r.notify_email !== 0 || r.channel === "both" || r.channel === "email"),
        notifyBell: Boolean(r.notify_bell !== 0 || r.channel === "both" || r.channel === "bell" || r.channel === "in_app"),
        status: r.status || "active",
        lastNotifiedAt: r.last_notified_at || null,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      }));

      return NextResponse.json({ success: true, data: formatted });
    } catch (d1Err) {
      console.warn("[app/api/targets/route.ts GET] Direct D1 query failed, trying worker fallback:", d1Err);
    }

    // 2. Cloudflare Worker Fallback
    try {
      const mergedById = new Map<string, any>();
      for (const candidateId of candidateUserIds) {
        const workerUrl = `${WORKER_URL}/api/v1/targets?userId=${encodeURIComponent(candidateId)}`;
        const res = await fetch(workerUrl, {
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET || "",
            Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
            "X-User-Id": candidateId,
          },
          cache: "no-store",
        }).catch(() => null);

        if (res && res.ok) {
          const data = await res.json().catch(() => null);
          if (data?.success && Array.isArray(data.data)) {
            for (const item of data.data) {
              if (item?.id && !mergedById.has(item.id)) {
                mergedById.set(item.id, item);
              }
            }
            if (mergedById.size > 0) break;
          }
        }
      }

      if (mergedById.size > 0) {
        return NextResponse.json({ success: true, data: Array.from(mergedById.values()) });
      }
    } catch (workerErr) {
      console.warn("[app/api/targets/route.ts GET] Worker fallback failed:", workerErr);
    }

    return NextResponse.json({ success: true, data: [] });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to load targets" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionUserId = (session?.user as any)?.id || (session?.user as any)?.sub || "";
    const sessionEmail = session?.user?.email || "";

    const authHeader = req.headers.get("authorization") || "";
    const frontendSecret = req.headers.get("x-frontend-secret") || "";
    const isInternal = Boolean(FRONTEND_SECRET && (frontendSecret === FRONTEND_SECRET || authHeader === `Bearer ${FRONTEND_SECRET}`));

    const { data: _bodyParsed, error: bodyError } = await parseBody(req, targetCreateBodySchema);
    if (bodyError) return bodyError;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const body = _bodyParsed as any; // Zod validation done above; cast needed for extra fields like `id`

    if (!isInternal && !sessionUserId && !sessionEmail) {
      return NextResponse.json(
        { success: false, error: "Authentication required to create targets." },
        { status: 401 }
      );
    }

    const { effectiveId, candidateUserIds } = await resolveSessionCanonicalUserIds({
      sessionUserId,
      sessionEmail,
      clientUserId: String(body.userId || ""),
      isInternal,
    });

    const sessionPlan = ((session?.user as any)?.plan || "").toUpperCase();
    const userPlan = isInternal
      ? ((sessionPlan || body.userPlan || body.plan || "").toUpperCase())
      : sessionPlan;

    const isPro =
      userPlan === "PRO" ||
      userPlan === "BUSINESS" ||
      userPlan === "ENTERPRISE" ||
      (isInternal && !userPlan);

    // Handle "both" metric type (clicks & revenue) by decomposing into two records
    const isBoth = body.metricType === "both";
    const targetsToProcess = isBoth
      ? [
          {
            ...body,
            metricType: "clicks",
            targetValue: Math.max(1, Number(body.clicksTargetValue || body.targetValue) || 1000),
          },
          {
            ...body,
            metricType: "revenue",
            targetValue: Math.max(1, Number(body.revenueTargetValue || body.targetValue) || 5000),
          },
        ]
      : [body];

    const results: any[] = [];

    for (const targetItem of targetsToProcess) {
      const linkId = targetItem.linkId === "global" || !targetItem.linkId ? null : targetItem.linkId;

      // Standard plan users have full access to global workspace targets, but individual link alerts require Pro/Business
      if (linkId && !isPro) {
        return NextResponse.json(
          {
            success: false,
            code: "PLAN_UPGRADE_REQUIRED",
            error: "Individual link alerts require a Pro or Business subscription. Standard plans include Global Workspace Targets.",
          },
          { status: 403 }
        );
      }

      // Security: Verify that the target linkId belongs to the authenticated user before creating/attaching an alert
      if (linkId && !isInternal) {
        let linkAuthorized = false;
        try {
          const linkRows = await executeD1Query<{ id: string; user_id: string }>(
            "SELECT id, user_id FROM links WHERE id = ? LIMIT 1",
            [linkId]
          );
          if (linkRows && linkRows.length > 0) {
            if (!candidateUserIds.includes(linkRows[0].user_id)) {
              return NextResponse.json(
                { success: false, error: "Forbidden: link does not belong to your account." },
                { status: 403 }
              );
            }
            linkAuthorized = true;
          }
        } catch {}

        if (!linkAuthorized) {
          const checkRes = await fetch(`${WORKER_URL}/api/v1/links/${encodeURIComponent(linkId)}`, {
            headers: {
              "X-Frontend-Secret": FRONTEND_SECRET || "",
              Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
              "X-User-Id": effectiveId,
            },
            cache: "no-store",
          }).catch(() => null);
          if (checkRes) {
            if (checkRes.status === 403) {
              return NextResponse.json(
                { success: false, error: "Forbidden: link does not belong to your account." },
                { status: 403 }
              );
            }
            if (checkRes.status === 404) {
              return NextResponse.json(
                { success: false, error: "Link not found." },
                { status: 404 }
              );
            }
            if (checkRes.ok) {
              const checkJson = await checkRes.json().catch(() => null);
              const linkObj = checkJson?.data || checkJson;
              const ownerId = String(linkObj?.user_id || linkObj?.userId || "");
              if (ownerId && !candidateUserIds.includes(ownerId)) {
                return NextResponse.json(
                  { success: false, error: "Forbidden: link does not belong to your account." },
                  { status: 403 }
                );
              }
            }
          }
        }
      }
      const metricType = targetItem.metricType === "revenue" ? "revenue" : "clicks";
      const period = ["day", "week", "month"].includes(targetItem.period) ? targetItem.period : "month";
      const targetValue = Math.max(1, Number(targetItem.targetValue) || 1000);
      const notifyExpired = !linkId ? 0 : (targetItem.notifyExpired ? 1 : 0);
      const notifyEmail = targetItem.notifyEmail !== false ? 1 : 0;
      const notifyBell = targetItem.notifyBell !== false ? 1 : 0;
      const status = targetItem.status === "paused" ? "paused" : "active";
      const channel = (notifyEmail && notifyBell) ? "both" : notifyEmail ? "email" : notifyBell ? "in_app" : "none";

      let createdOrUpdated: any = null;

      // 1. Direct Cloudflare D1 Upsert (Primary & Instant)
      try {
        await executeD1Query(INIT_TARGETS_TABLE_SQL).catch(() => null);

        if (!linkId) {
          // Global target upsert per user and metric type
          const placeholders = candidateUserIds.map(() => "?").join(", ");
          const existingGlobal = candidateUserIds.length > 0
            ? await executeD1Query<any>(
                `SELECT id FROM target_alerts WHERE user_id IN (${placeholders}) AND link_id IS NULL AND metric_type = ? LIMIT 1`,
                [...candidateUserIds, metricType]
              )
            : [];

          if (existingGlobal && existingGlobal.length > 0) {
            const targetId = existingGlobal[0].id;
            await executeD1Query(
              `UPDATE target_alerts
               SET limit_value = ?, target_value = ?,
                   notify_email = ?, notify_bell = ?,
                   channel = ?,
                   notify_expiration = ?, notify_expired = ?,
                   status = ?, updated_at = datetime('now')
               WHERE id = ?`,
              [
                targetValue, targetValue,
                notifyEmail, notifyBell,
                channel,
                notifyExpired, notifyExpired,
                status, targetId
              ]
            );
            createdOrUpdated = {
              id: targetId,
              userId: effectiveId,
              linkId: null,
              metricType,
              period: "month",
              targetValue,
              notifyExpired: Boolean(notifyExpired),
              notifyEmail: Boolean(notifyEmail),
              notifyBell: Boolean(notifyBell),
              status,
            };
          } else {
            const newId = `target_global_${effectiveId}_${metricType}`;
            await executeD1Query(
              `INSERT INTO target_alerts (
                id, user_id, link_id, title, metric_type,
                limit_value, target_value, period,
                notify_expiration, notify_expired,
                channel, notify_email, notify_bell, schedule, status,
                created_at, updated_at
              )
              VALUES (?, ?, NULL, ?, ?, ?, ?, 'month', ?, ?, ?, ?, ?, 'instantly', ?, datetime('now'), datetime('now'))`,
              [
                newId, effectiveId, `Global Target (${metricType === 'revenue' ? 'Revenue' : 'Clicks'})`, metricType,
                targetValue, targetValue,
                notifyExpired, notifyExpired,
                channel, notifyEmail, notifyBell, status
              ]
            );
            createdOrUpdated = {
              id: newId,
              userId: effectiveId,
              linkId: null,
              metricType,
              period: "month",
              targetValue,
              notifyExpired: Boolean(notifyExpired),
              notifyEmail: Boolean(notifyEmail),
              notifyBell: Boolean(notifyBell),
              status,
            };
          }
        } else {
          // Specific Link Target Alert
          const newId = targetItem.id || `target_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
          await executeD1Query(
            `INSERT INTO target_alerts (
              id, user_id, link_id, title, metric_type,
              limit_value, target_value, period,
              notify_expiration, notify_expired,
              channel, notify_email, notify_bell, schedule, status,
              created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'instantly', ?, datetime('now'), datetime('now'))`,
            [
              newId, effectiveId, linkId, targetItem.title || 'Short Link Alert', metricType,
              targetValue, targetValue, period,
              notifyExpired, notifyExpired,
              channel, notifyEmail, notifyBell, status
            ]
          );
          createdOrUpdated = {
            id: newId,
            userId: effectiveId,
            linkId,
            metricType,
            period,
            targetValue,
            notifyExpired: Boolean(notifyExpired),
            notifyEmail: Boolean(notifyEmail),
            notifyBell: Boolean(notifyBell),
            status,
          };
        }
      } catch (d1Err) {
        console.warn("[app/api/targets/route.ts POST] Direct D1 error, trying worker fallback:", d1Err);
      }

      // 2. Cloudflare Worker Fallback if D1 did not complete
      if (!createdOrUpdated) {
        try {
          if (!linkId) {
            // Check if a global target for this metricType already exists on the Worker and PATCH by id
            const listRes = await fetch(`${WORKER_URL}/api/v1/targets?userId=${encodeURIComponent(effectiveId)}`, {
              headers: {
                "X-Frontend-Secret": FRONTEND_SECRET || "",
                Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
                "X-User-Id": effectiveId,
              },
              cache: "no-store",
            }).catch(() => null);
            if (listRes && listRes.ok) {
              const listData = await listRes.json().catch(() => null);
              const existingMatch = Array.isArray(listData?.data)
                ? listData.data.find((t: any) => (!t.linkId || t.linkId === "global") && t.metricType === metricType)
                : null;
              if (existingMatch?.id) {
                const patchRes = await fetch(`${WORKER_URL}/api/v1/targets/${encodeURIComponent(existingMatch.id)}`, {
                  method: "PATCH",
                  headers: {
                    "Content-Type": "application/json",
                    "X-Frontend-Secret": FRONTEND_SECRET || "",
                    Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
                    "X-User-Id": effectiveId,
                  },
                  body: JSON.stringify({
                    metricType,
                    period: "month",
                    targetValue,
                    notifyExpired: false,
                    notifyEmail: Boolean(notifyEmail),
                    notifyBell: Boolean(notifyBell),
                    status,
                  }),
                }).catch(() => null);
                if (patchRes && patchRes.ok) {
                  createdOrUpdated = {
                    id: existingMatch.id,
                    userId: effectiveId,
                    linkId: null,
                    metricType,
                    period: "month",
                    targetValue,
                    notifyExpired: false,
                    notifyEmail: Boolean(notifyEmail),
                    notifyBell: Boolean(notifyBell),
                    status,
                  };
                }
              }
            }
          }

          if (!createdOrUpdated) {
            const workerUrl = `${WORKER_URL}/api/v1/targets`;
            const res = await fetch(workerUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "X-Frontend-Secret": FRONTEND_SECRET || "",
                Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
                "X-User-Id": effectiveId,
              },
              body: JSON.stringify({
                ...targetItem,
                userId: effectiveId,
                linkId,
                metricType,
                period,
                targetValue,
                notifyExpired: Boolean(notifyExpired),
                notifyEmail: Boolean(notifyEmail),
                notifyBell: Boolean(notifyBell),
                status,
              }),
            }).catch(() => null);

            if (res && res.ok) {
              const workerData = await res.json().catch(() => null);
              if (workerData?.success && workerData.data) {
                createdOrUpdated = {
                  id: workerData.data.id || `target_global_${effectiveId}_${metricType}`,
                  userId: effectiveId,
                  linkId,
                  metricType,
                  period,
                  targetValue,
                  notifyExpired: Boolean(notifyExpired),
                  notifyEmail: Boolean(notifyEmail),
                  notifyBell: Boolean(notifyBell),
                  status,
                };
              }
            }
          }
        } catch (workerErr) {
          console.warn("[app/api/targets/route.ts POST] Worker fallback error:", workerErr);
        }
      }

      if (createdOrUpdated) {
        results.push(createdOrUpdated);
      }
    }

    if (results.length === 0) {
      return NextResponse.json(
        { success: false, error: "Failed to persist target alert in storage" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: isBoth ? results : results[0] || null,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("[app/api/targets/route.ts POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create target alert" },
      { status: 500 }
    );
  }
}
