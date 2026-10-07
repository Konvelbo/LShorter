import { NextRequest, NextResponse } from "next/server";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId") || session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: true, data: [] });
    }

    const workerUrl = `${WORKER_URL}/api/v1/targets?userId=${encodeURIComponent(userId)}`;
    const res = await fetch(workerUrl, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET || "",
        Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
        "X-User-Id": userId,
      },
      cache: "no-store",
    }).catch(() => null);

    if (!res || !res.ok) {
      return NextResponse.json({ success: true, data: [] });
    }

    const data = await res.json();
    return NextResponse.json(data);
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
    const body = await req.json();
    const userId = body.userId || session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const workerUrl = `${WORKER_URL}/api/v1/targets`;
    const res = await fetch(workerUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Frontend-Secret": FRONTEND_SECRET || "",
        Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
        "X-User-Id": userId,
      },
      body: JSON.stringify({ ...body, userId }),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to create target alert" },
      { status: 500 }
    );
  }
}
