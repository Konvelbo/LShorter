import { NextResponse } from "next/server";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    const url = new URL(`${WORKER_URL}/api/v1/webhooks`);
    if (userId) url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
      },
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({ success: true, data: [] }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.warn("[Webhooks Proxy GET] Error:", error);
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const qUserId = searchParams.get("userId");

  try {
    const body = await req.json().catch(() => ({}));
    const userId = qUserId || body.userId;

    const url = new URL(`${WORKER_URL}/api/v1/webhooks`);
    if (userId) url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.warn("[Webhooks Proxy POST] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create webhook" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const userId = searchParams.get("userId");

  if (!id) {
    return NextResponse.json({ success: false, error: "Webhook ID is required" }, { status: 400 });
  }

  try {
    const url = new URL(`${WORKER_URL}/api/v1/webhooks/${id}`);
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
    console.warn("[Webhooks Proxy DELETE] Error:", error);
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
