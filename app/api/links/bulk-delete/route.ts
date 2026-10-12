import { NextResponse } from "next/server";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth().catch(() => null);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to delete links." },
        { status: 401 }
      );
    }
    const userId = session.user.id;
    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body?.ids) ? body.ids : [];

    if (!ids.length) {
      return NextResponse.json(
        { success: false, error: "No link IDs provided" },
        { status: 400 },
      );
    }

    const url = new URL(`${WORKER_URL}/api/v1/links/bulk-delete`);
    if (userId) url.searchParams.set("userId", userId);

    const workerRes = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
      },
      body: JSON.stringify({ ids }),
      cache: "no-store",
    });

    if (workerRes.ok) {
      const data = await workerRes.json();
      return NextResponse.json(data);
    }

    const errText = await workerRes.text().catch(() => "Worker bulk delete failed");
    return NextResponse.json(
      { success: false, error: errText },
      { status: workerRes.status },
    );
  } catch (error: any) {
    console.error("[Bulk Delete Route Error]:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 },
    );
  }
}
