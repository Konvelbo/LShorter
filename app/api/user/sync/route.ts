import { NextResponse } from "next/server";

import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, email, name, avatarUrl, provider, plan } = body;

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
