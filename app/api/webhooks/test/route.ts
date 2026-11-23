import crypto from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { isSafeHttpUrl, isSelfLoopWebhookUrl, checkRateLimit } from "@/lib/security-utils";
import { parseBody, webhookTestBodySchema } from "@/lib/api-schemas";

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

    const { url, secretKey } = body;
    if (!isSafeHttpUrl(url) || isSelfLoopWebhookUrl(url)) {
      return NextResponse.json(
        { success: false, error: "Invalid or forbidden webhook URL." },
        { status: 400 }
      );
    }

    const testPayload = {
      event: "click.test",
      timestamp: new Date().toISOString(),
      platform: "LShorter Edge Platform",
      data: {
        clickId: `clk_test_${Date.now().toString(36)}`,
        slug: "demo-link",
        destination: "https://lsho.cc",
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
      typeof secretKey === "string" && secretKey.trim()
        ? secretKey.trim()
        : `whsec_${crypto.randomBytes(16).toString("hex")}`;
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
