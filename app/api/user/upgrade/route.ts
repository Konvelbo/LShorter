import { NextResponse } from "next/server";
import { auth } from "@/auth";

const WORKER_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.QUICKLINK_API_URL || "https://click_tracker.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET = process.env.FRONTEND_API_SECRET || process.env.QUICKLINK_MASTER_KEY || "lsh_secret_live_prod_2026";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentification requise." },
        { status: 401 }
      );
    }

    const body = await req.json();
    const targetUserId = body.userId || session.user.id;
    const plan = body.plan;

    // Strict IDOR protection: a user can only change their own plan
    if (session.user.id && targetUserId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Non autorisé à modifier le forfait d'un autre utilisateur." },
        { status: 403 }
      );
    }

    const userId = targetUserId;

    if (!userId || !plan) {
      return NextResponse.json(
        { success: false, error: "userId et plan sont requis" },
        { status: 400 }
      );
    }

    const res = await fetch(`${WORKER_URL}/api/v1/users/${userId}/upgrade`, {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ plan }),
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, plan, isLocalFallback: true });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("User Upgrade proxy error:", error);
    return NextResponse.json({ success: true, isLocalFallback: true });
  }
}
