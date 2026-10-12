import { NextResponse } from "next/server";

import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

import { auth } from "@/auth";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const id = session.user.id || body.id;
    const email = session.user.email || body.email;
    const name = body.name || session.user.name;
    const avatarUrl = body.avatarUrl || session.user.image;
    const provider = body.provider || "credentials";
    const plan = (session.user as any)?.plan || "FREEMIUM";

    const headers: Record<string, string> = {
      "X-Frontend-Secret": FRONTEND_SECRET,
      Authorization: `Bearer ${FRONTEND_SECRET}`,
      "Content-Type": "application/json",
    };
    if (id) headers["X-User-Id"] = id;
    if (plan) headers["X-User-Plan"] = plan;

    const res = await fetch(`${WORKER_URL}/api/v1/users/sync`, {
      method: "POST",
      headers,
      body: JSON.stringify({ id, email, name, avatarUrl, provider, plan }),
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, isLocalFallback: true });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("User OAuth Sync proxy error:", error);
    return NextResponse.json({ success: true, isLocalFallback: true });
  }
}
