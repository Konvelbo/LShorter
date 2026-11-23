import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { parseBody, parseQuery, webhookCreateBodySchema, pixelDeleteQuerySchema } from "@/lib/api-schemas";

const PAID_PLANS = new Set(["PRO", "BUSINESS", "ENTERPRISE"]);

async function resolveAuthoritativePlan(session: any): Promise<string> {
  let plan = String(session?.user?.plan || "").toUpperCase();
  const userId = session?.user?.id || "";
  const email = (session?.user?.email || "").toLowerCase().trim();
  try {
    let cu: any = null;
    if (email) {
      cu = await convex.query(api.users.getUserByEmail, { email });
    }
    if (!cu && userId) {
      cu = await convex.query(api.users.getCurrentUser, { userId, email: email || undefined });
    }
    if (cu?.plan) {
      plan = String(cu.plan).toUpperCase();
    }
  } catch {}
  return plan || "FREEMIUM";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const url = new URL(`${WORKER_URL}/api/v1/webhooks`);
    url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
      },
      cache: "no-store",
    });

    const rawData = await res.json().catch(() => ({ success: true, data: [] }));
    const rawList = Array.isArray(rawData?.data)
      ? rawData.data
      : Array.isArray(rawData?.data?.webhooks)
        ? rawData.data.webhooks
        : Array.isArray(rawData?.webhooks)
          ? rawData.webhooks
          : [];
    const normalizedWebhooks = rawList.map((wh: Record<string, unknown>) => ({
      ...wh,
      events: Array.isArray(wh?.events) && wh.events.length > 0 ? wh.events : ["click.created"],
      isActive: wh?.isActive !== false,
      secretKey: wh?.secretKey || wh?.secret_key || "",
    }));
    return NextResponse.json(
      { ...rawData, success: rawData?.success ?? true, data: { webhooks: normalizedWebhooks } },
      { status: res.status }
    );
  } catch (error) {
    console.warn("[Webhooks Proxy GET] Error:", error);
    return NextResponse.json({ success: true, data: { webhooks: [] } }, { status: 200 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const plan = await resolveAuthoritativePlan(session);
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

  try {
    const { data: body, error: bodyError } = await parseBody(req, webhookCreateBodySchema);
    if (bodyError) return bodyError;

    body.userId = userId;

    const url = new URL(`${WORKER_URL}/api/v1/webhooks`);
    url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
        "X-User-Plan": plan,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const rawData = await res.json().catch(() => ({}));
    const createdWebhook = rawData?.data?.webhook || rawData?.data || rawData;
    const normalizedWebhook =
      createdWebhook && typeof createdWebhook === "object"
        ? {
            ...createdWebhook,
            secretKey: createdWebhook.secretKey || body.secretKey || "",
            events: Array.isArray(createdWebhook.events) ? createdWebhook.events : body.events || ["click.created"],
            isActive: createdWebhook.isActive ?? body.isActive ?? true,
          }
        : createdWebhook;
    return NextResponse.json(
      { ...rawData, success: rawData?.success ?? res.ok, data: { webhook: normalizedWebhook } },
      { status: res.status }
    );
  } catch (error) {
    console.warn("[Webhooks Proxy POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { data: qp, error: qpError } = parseQuery(new URL(req.url).searchParams, pixelDeleteQuerySchema);
  if (qpError) return qpError;
  const id = qp.id;

  try {
    // Ownership check before deletion
    const checkRes = await fetch(`${WORKER_URL}/api/v1/webhooks/${encodeURIComponent(id)}`, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
      },
      cache: "no-store",
    });
    if (checkRes.status === 404) {
      return NextResponse.json({ success: false, error: "Webhook not found" }, { status: 404 });
    }
    if (checkRes.status === 403) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (checkRes.ok) {
      const checkJson = await checkRes.json().catch(() => null);
      const wh = checkJson?.data?.webhook || checkJson?.webhook || checkJson?.data;
      const ownerId = wh?.userId || wh?.user_id;
      if (ownerId && ownerId !== userId) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const url = new URL(`${WORKER_URL}/api/v1/webhooks/${encodeURIComponent(id)}`);
    url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
      },
    });

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.warn("[Webhooks Proxy DELETE] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete webhook" }, { status: 500 });
  }
}
