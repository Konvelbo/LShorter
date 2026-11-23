import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { parseBody, parseQuery, pixelCreateBodySchema, pixelDeleteQuerySchema } from "@/lib/api-schemas";

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

function normalizePixelRecord(px: Record<string, unknown>) {
  const platform = px?.platform || px?.type || "meta";
  return {
    ...px,
    platform,
    type: px?.type || platform,
    isActive: px?.isActive !== false && px?.is_active !== false,
    eventsTrackedCount: Number(px?.eventsTrackedCount ?? px?.events_tracked_count ?? 0),
  };
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const url = new URL(`${WORKER_URL}/api/v1/pixels`);
    url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
      },
      cache: "no-store",
    });

    const rawData = await res.json().catch(() => ({ success: true, data: { pixels: [] } }));
    const rawList = Array.isArray(rawData?.data?.pixels)
      ? rawData.data.pixels
      : Array.isArray(rawData?.data)
        ? rawData.data
        : [];
    return NextResponse.json(
      { ...rawData, success: rawData?.success ?? true, data: { pixels: rawList.map(normalizePixelRecord) } },
      { status: res.status }
    );
  } catch (error) {
    console.warn("[Pixels Proxy GET] Error:", error);
    return NextResponse.json({ success: true, data: { pixels: [] } }, { status: 200 });
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
        error: "Retargeting pixels require a PRO, BUSINESS, or ENTERPRISE subscription.",
      },
      { status: 403 }
    );
  }

  try {
    const { data: body, error: bodyError } = await parseBody(req, pixelCreateBodySchema);
    if (bodyError) return bodyError;

    const platform = body.platform || body.type || "meta";
    body.userId = userId;
    body.platform = platform;
    body.type = platform;
    body.isActive = body.isActive !== false;

    const url = new URL(`${WORKER_URL}/api/v1/pixels`);
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
    const rawPixel = rawData?.data?.pixel || rawData?.data || rawData;
    const pixel = rawPixel && typeof rawPixel === "object"
      ? normalizePixelRecord({ ...body, ...rawPixel })
      : rawPixel;
    return NextResponse.json(
      { ...rawData, success: rawData?.success ?? res.ok, data: { pixel } },
      { status: res.status }
    );
  } catch (error) {
    console.warn("[Pixels Proxy POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create pixel" },
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
    const checkRes = await fetch(`${WORKER_URL}/api/v1/pixels/${encodeURIComponent(id)}`, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
      },
      cache: "no-store",
    });
    if (checkRes.status === 404) {
      return NextResponse.json({ success: false, error: "Pixel not found" }, { status: 404 });
    }
    if (checkRes.status === 403) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }
    if (checkRes.ok) {
      const checkJson = await checkRes.json().catch(() => null);
      const px = checkJson?.data?.pixel || checkJson?.pixel || checkJson?.data;
      const ownerId = px?.userId || px?.user_id;
      if (ownerId && ownerId !== userId) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
    }

    const url = new URL(`${WORKER_URL}/api/v1/pixels/${encodeURIComponent(id)}`);
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
    console.warn("[Pixels Proxy DELETE] Error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete pixel" }, { status: 500 });
  }
}
