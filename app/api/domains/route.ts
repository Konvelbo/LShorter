import { NextResponse } from "next/server";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    const url = new URL(`${WORKER_URL}/api/v1/domains`);
    if (userId) url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
      },
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, data: [] }, {
        headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=45" }
      });
    }

    const data = await res.json();
    return NextResponse.json(data, {
      status: res.status,
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=45" }
    });
  } catch (error) {
    console.warn("[Domains Proxy GET] Worker offline, returning fallback:", error);
    return NextResponse.json({ success: true, data: [] }, {
      headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=45" }
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const res = await fetch(`${WORKER_URL}/api/v1/domains`, {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(body.userId ? { "X-User-Id": body.userId } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 403) {
      return NextResponse.json(
        {
          success: false,
          code: data.code || "PLAN_UPGRADE_REQUIRED",
          error: data.error || data.message || "Quota de domaines atteint pour votre forfait",
        },
        { status: 403 }
      );
    }

    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.warn("[Domains Proxy POST] Worker offline, returning fallback:", error);
    return NextResponse.json({
      success: true,
      data: { id: `dom_${Date.now()}`, status: "pending" },
    });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const domainId = searchParams.get("id");
    const userId = searchParams.get("userId");

    if (!domainId) {
      return NextResponse.json({ success: false, error: "ID de domaine requis" }, { status: 400 });
    }

    const url = new URL(`${WORKER_URL}/api/v1/domains/${domainId}`);
    if (userId) url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
      },
    });

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.warn("[Domains Proxy DELETE] Worker offline:", error);
    return NextResponse.json({ success: true });
  }
}

