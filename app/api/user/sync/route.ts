import { NextResponse } from "next/server";

import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

import { auth } from "@/auth";
import { parseBody, userSyncBodySchema } from "@/lib/api-schemas";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { data: body, error: bodyError } = await parseBody(req, userSyncBodySchema);
    if (bodyError) return bodyError;

    // Security: Strictly use authenticated session identity and authoritative Convex plan.
    // Never allow client body to spoof `id`, `email`, or `plan`.
    const id = session.user.id;
    const email = (session.user.email || "").toLowerCase().trim();
    const name = body.name || session.user.name;
    const avatarUrl = body.avatarUrl || session.user.image;
    const provider = body.provider || "credentials";

    let authoritativePlan = ((session.user as any)?.plan || "FREEMIUM").toUpperCase();
    try {
      const cu = await convex.query(api.users.getCurrentUser, {
        userId: id,
        email: email || undefined,
      });
      if (cu?.plan) {
        authoritativePlan = String(cu.plan).toUpperCase();
      }
    } catch {}

    const plan = ["FREEMIUM", "PRO", "BUSINESS", "STARTER", "ENTERPRISE"].includes(authoritativePlan)
      ? authoritativePlan
      : "FREEMIUM";

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
