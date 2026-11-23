import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { isSafeHttpUrl, isSelfLoopWebhookUrl, checkRateLimit } from "@/lib/security-utils";
import { parseBody, webhookTestBodySchema } from "@/lib/api-schemas";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

const PAID_PLANS = new Set(["PRO", "BUSINESS", "ENTERPRISE"]);

export async function POST(req: NextRequest) {
  try {
    const session = await auth().catch(() => null);
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required to test webhooks." },
        { status: 401 }
      );
    }

    const rl = checkRateLimit(`webhook_test:${session.user.id}`, 10, 60_000);
    if (!rl.allowed) {
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded for webhook testing." },
        { status: 429 }
      );
    }

    let plan = String((session.user as any)?.plan || "").toUpperCase();
    const email = (session.user.email || "").toLowerCase().trim();
    try {
      let cu: any = null;
      if (email) {
        cu = await convex.query(api.users.getUserByEmail, { email });
      }
      if (!cu && session.user.id) {
        cu = await convex.query(api.users.getCurrentUser, {
          userId: session.user.id,
          email: email || undefined,
        });
      }
      if (cu?.plan) plan = String(cu.plan).toUpperCase();
    } catch {}

    if (!PAID_PLANS.has(plan)) {
      return NextResponse.json(
        {
          success: false,
          code: "PLAN_UPGRADE_REQUIRED",
          error: "Webhooks require a PRO, BUSINESS, or ENTERPRISE subscription.",
        },
        { status: 403 }
      );
    }

    const { data: body, error: bodyError } = await parseBody(req, webhookTestBodySchema);
    if (bodyError) return bodyError;

    const { url, secretKey, webhookId, name } = body;
    if (!isSafeHttpUrl(url) || isSelfLoopWebhookUrl(url)) {
      return NextResponse.json(
        { success: false, error: "Invalid or forbidden webhook URL." },
        { status: 400 }
      );
    }

    // If webhookId is provided, verify ownership and load authoritative HMAC secret from Worker D1
    let resolvedSecret = typeof secretKey === "string" ? secretKey.trim() : "";
    let resolvedName = typeof name === "string" ? name.trim() : "";
    if (webhookId && WORKER_URL && FRONTEND_SECRET) {
      try {
        const whRes = await fetch(
          `${WORKER_URL}/api/v1/webhooks/${encodeURIComponent(webhookId)}?userId=${encodeURIComponent(session.user.id)}`,
          {
            headers: {
              "X-Frontend-Secret": FRONTEND_SECRET,
              Authorization: `Bearer ${FRONTEND_SECRET}`,
              "X-User-Id": session.user.id,
            },
            cache: "no-store",
            signal: AbortSignal.timeout(3000),
          }
        );
        if (whRes.status === 403 || whRes.status === 404) {
          return NextResponse.json(
            { success: false, error: whRes.status === 404 ? "Webhook not found" : "Forbidden" },
            { status: whRes.status }
          );
        }
        if (whRes.ok) {
          const whJson = await whRes.json().catch(() => null);
          const stored = whJson?.data?.webhook || whJson?.webhook;
          if (stored?.secretKey) resolvedSecret = String(stored.secretKey).trim();
          if (stored?.name && !resolvedName) resolvedName = String(stored.name).trim();
        }
      } catch {}
    }

    const appBaseUrl = (process.env.NEXT_PUBLIC_APP_URL || "https://lsho.cc").replace(/\/+$/, "");
    const testPayload = {
      event: "click.test",
      timestamp: new Date().toISOString(),
      platform: "LShorter Edge Platform",
      ...(resolvedName ? { webhookName: resolvedName } : {}),
      data: {
        clickId: `clk_test_${Date.now().toString(36)}`,
        slug: "test-link",
        destination: appBaseUrl,
        geo: {
          country: req.headers.get("cf-ipcountry") || req.headers.get("x-vercel-ip-country") || "XX",
          city: req.headers.get("cf-ipcity") || req.headers.get("x-vercel-ip-city") || "Unknown",
        },
        device: "Desktop",
        browser: "Chrome",
      },
    };

    const rawPayload = JSON.stringify(testPayload);
    const signingSecret =
      resolvedSecret || `whsec_${crypto.randomBytes(16).toString("hex")}`;
    const hmacSignature = `sha256=${crypto
      .createHmac("sha256", signingSecret)
      .update(rawPayload)
      .digest("hex")}`;

    const startTime = Date.now();
    let status = 200;
    let responseBody = "";

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-LShorter-Signature": hmacSignature,
          "X-LShorter-Event": "click.test",
          ...(webhookId ? { "X-LShorter-Webhook-Id": webhookId } : {}),
          "User-Agent": "LShorter-Webhook-Delivery/1.0",
        },
        body: rawPayload,
        redirect: "manual",
        signal: AbortSignal.timeout(5000),
      });
      status = res.status;
      responseBody = await res.text().catch(() => "");
    } catch (fetchErr: any) {
      status = 502;
      responseBody = fetchErr?.message || "Upstream endpoint unreachable";
    }

    const durationMs = Date.now() - startTime;

    if (webhookId && WORKER_URL && FRONTEND_SECRET) {
      fetch(
        `${WORKER_URL}/api/v1/webhooks/${encodeURIComponent(webhookId)}?userId=${encodeURIComponent(session.user.id)}`,
        {
          method: "PATCH",
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
            Authorization: `Bearer ${FRONTEND_SECRET}`,
            "X-User-Id": session.user.id,
            "X-User-Plan": plan,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            lastStatus: status,
            lastTriggeredAt: new Date().toISOString(),
          }),
          signal: AbortSignal.timeout(3000),
        }
      ).catch(() => {});
    }

    return NextResponse.json({
      success: true,
      status,
      durationMs,
      signature: hmacSignature,
      signatureAlgorithm: "HMAC-SHA256",
      payloadSent: testPayload,
      endpointResponse: responseBody.slice(0, 500) || "OK",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Erreur test webhook" },
      { status: 500 }
    );
  }
}
