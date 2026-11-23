import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { parseBody, parseParams, webhookUpdateBodySchema, webhookIdParamsSchema } from "@/lib/api-schemas";

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

async function verifyWebhookOwnership(id: string, userId: string): Promise<{ ok: boolean; status: number }> {
  const checkRes = await fetch(`${WORKER_URL}/api/v1/webhooks/${encodeURIComponent(id)}`, {
    headers: {
      "X-Frontend-Secret": FRONTEND_SECRET,
      Authorization: `Bearer ${FRONTEND_SECRET}`,
      "X-User-Id": userId,
    },
    cache: "no-store",
  });
  if (checkRes.status === 404) return { ok: false, status: 404 };
  if (checkRes.status === 403) return { ok: false, status: 403 };
  if (checkRes.ok) {
    const checkJson = await checkRes.json().catch(() => null);
    const wh = checkJson?.data?.webhook || checkJson?.webhook || checkJson?.data;
    const ownerId = wh?.userId || wh?.user_id;
    if (ownerId && ownerId !== userId) {
      return { ok: false, status: 403 };
    }
  }
  return { ok: true, status: 200 };
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const rawParams = await params;
  const { data: pData, error: pError } = parseParams(rawParams, webhookIdParamsSchema);
  if (pError) return pError;
  const id = pData.id;

  try {
    const { data: body, error: bodyError } = await parseBody(req, webhookUpdateBodySchema);
    if (bodyError) return bodyError;
    body.userId = userId;
    // Security: HMAC secret key is strictly read-only/immutable after webhook creation
    delete (body as Record<string, unknown>).secretKey;
    delete (body as Record<string, unknown>).secret_key;
    delete (body as Record<string, unknown>).secret;

    const ownership = await verifyWebhookOwnership(id, userId);
    if (!ownership.ok) {
      return NextResponse.json(
        { success: false, error: ownership.status === 404 ? "Webhook not found" : "Forbidden" },
        { status: ownership.status }
      );
    }

    const plan = await resolveAuthoritativePlan(session);
    if (
      !PAID_PLANS.has(plan) &&
      (body.isActive === true || body.name !== undefined || body.url !== undefined || body.events !== undefined)
    ) {
      return NextResponse.json(
        {
          success: false,
          code: "PLAN_UPGRADE_REQUIRED",
          error: "Webhooks require a PRO, BUSINESS, or ENTERPRISE subscription.",
        },
        { status: 403 }
      );
    }

    const url = new URL(`${WORKER_URL}/api/v1/webhooks/${encodeURIComponent(id)}`);
    url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      method: "PATCH",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
        "X-User-Plan": plan,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.warn("[Webhooks Proxy PATCH] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update webhook" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;
  const rawParams = await params;
  const { data: pData, error: pError } = parseParams(rawParams, webhookIdParamsSchema);
  if (pError) return pError;
  const id = pData.id;

  try {
    const ownership = await verifyWebhookOwnership(id, userId);
    if (!ownership.ok) {
      return NextResponse.json(
        { success: false, error: ownership.status === 404 ? "Webhook not found" : "Forbidden" },
        { status: ownership.status }
      );
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
