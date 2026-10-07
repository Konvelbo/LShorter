import { NextRequest, NextResponse } from "next/server";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { auth } from "@/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    const body = await req.json();

    const workerUrl = `${WORKER_URL}/api/v1/targets/${encodeURIComponent(id)}`;
    const res = await fetch(workerUrl, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "X-Frontend-Secret": FRONTEND_SECRET || "",
        Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
        ...(session?.user?.id ? { "X-User-Id": session.user.id } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to update target alert" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();

    const workerUrl = `${WORKER_URL}/api/v1/targets/${encodeURIComponent(id)}`;
    const res = await fetch(workerUrl, {
      method: "DELETE",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET || "",
        Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
        ...(session?.user?.id ? { "X-User-Id": session.user.id } : {}),
      },
    });

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || "Failed to delete target alert" },
      { status: 500 }
    );
  }
}
