import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { isSafeHttpUrl } from "@/lib/security-utils";

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

    const data = await res.json().catch(() => ({ success: true, data: [] }));
    return NextResponse.json(data, { status: res.status });
  } catch (error) {
    console.warn("[Webhooks Proxy GET] Error:", error);
    return NextResponse.json({ success: true, data: [] }, { status: 200 });
  }
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body = await req.json().catch(() => ({}));
    if (!body?.url || !isSafeHttpUrl(body.url)) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook URL scheme. Only public HTTP and HTTPS URLs are permitted." },
        { status: 400 }
      );
    }
    body.userId = userId;

    const url = new URL(`${WORKER_URL}/api/v1/webhooks`);
    url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
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
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ success: false, error: "Webhook ID is required" }, { status: 400 });
  }

  try {
    const url = new URL(`${WORKER_URL}/api/v1/webhooks/${id}`);
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
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
