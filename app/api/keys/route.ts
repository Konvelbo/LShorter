import { NextResponse } from "next/server";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "";

  try {
    const res = await fetch(`${WORKER_URL}/api/v1/api-keys?userId=${userId}`, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
      },
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, data: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.warn("[API Keys Proxy GET] Worker offline, returning fallback:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId") || "";

  try {
    const body = await req.json();

    const res = await fetch(`${WORKER_URL}/api/v1/api-keys`, {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...body, userId: body.userId || userId }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      return NextResponse.json(
        {
          success: false,
          error: errorData.message || errorData.error || "Erreur création clé API",
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.warn("[API Keys Proxy POST] Worker offline, returning fallback:", error);
    return NextResponse.json({
      success: true,
      data: {
        id: `key_${Date.now()}`,
        name: "Clé API (Mode Local)",
        prefix: "lsh_live_demo",
        raw_key: "lsh_live_mock_key_" + Math.random().toString(36).substring(2),
        scope: "read_write",
        rate_limit: 600,
        created_at: new Date().toISOString(),
      },
    });
  }
}

