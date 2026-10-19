import { NextRequest, NextResponse } from "next/server";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { auth } from "@/auth";
import { executeD1Query } from "@/lib/d1-client";

const INIT_TARGETS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS target_alerts (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  link_id TEXT,
  title TEXT,
  metric_type TEXT NOT NULL DEFAULT 'clicks',
  limit_value REAL NOT NULL,
  target_value REAL,
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
    const isDevPreview = process.env.NODE_ENV === "development" && (reqUrl.searchParams.get("playwright_preview") === "1" || queryUserId === "mock_playwright_user");

    if (!isInternal && !sessionUserId && !sessionEmail && !isDevPreview) {
      return NextResponse.json(
        { success: false, error: "Authentication required to view targets." },
        { status: 401 }
      );
    }

    const userId = isInternal || isDevPreview ? (queryUserId || sessionUserId) : (sessionUserId || queryUserId);
    const userEmail = sessionEmail;
    const effectiveId = userId || userEmail;

    // 1. Direct Cloudflare D1 Query (Primary & Authoritative)
    try {
      await executeD1Query(INIT_TARGETS_TABLE_SQL).catch(() => null);

      const userIds = isInternal || isDevPreview
        ? Array.from(new Set([queryUserId, sessionUserId, sessionEmail, effectiveId])).filter(Boolean)
        : Array.from(new Set([sessionUserId, sessionEmail])).filter(Boolean);

      if (userIds.length === 0) {
        return NextResponse.json({ success: true, data: [] });
      }
      const placeholders = userIds.map(() => "?").join(", ");

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
         ORDER BY t.created_at DESC`,
        userIds
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
      const workerUrl = `${WORKER_URL}/api/v1/targets?userId=${encodeURIComponent(effectiveId)}`;
      const res = await fetch(workerUrl, {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET || "",
          Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
          "X-User-Id": effectiveId,
        },
        cache: "no-store",
      }).catch(() => null);

      if (res && res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.data)) {
          return NextResponse.json(data);
        }
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

    const body = await req.json().catch(() => ({}));
    const reqUrl = new URL(req.url);
    const isDevPreview = process.env.NODE_ENV === "development" && (
      reqUrl.searchParams.get("playwright_preview") === "1" ||
      body.userId === "mock_playwright_user" ||
      req.headers.get("x-playwright-preview") === "1"
    );

    if (!isInternal && !sessionUserId && !sessionEmail && !isDevPreview) {
      return NextResponse.json(
        { success: false, error: "Authentication required to create targets." },
        { status: 401 }
      );
    }

    const userId = isInternal || isDevPreview ? (body.userId || sessionUserId || sessionEmail) : (sessionUserId || body.userId || sessionEmail);
    const userEmail = sessionEmail || (userId.includes("@") ? userId : "");
    const effectiveId = userId || userEmail;

    const sessionPlan = ((session?.user as any)?.plan || "").toUpperCase();
    const userPlan = (isInternal || isDevPreview)
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
          const existingGlobal = await executeD1Query<any>(
            `SELECT id FROM target_alerts WHERE (user_id = ? OR user_id = ?) AND link_id IS NULL AND metric_type = ? LIMIT 1`,
            [effectiveId, userEmail || effectiveId, metricType]
          );

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
                newId, effectiveId, `Objectif Global (${metricType === 'revenue' ? 'Revenus' : 'Clics'})`, metricType,
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
              newId, effectiveId, linkId, targetItem.title || 'Alerte Lien Court', metricType,
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
              createdOrUpdated = workerData.data;
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
