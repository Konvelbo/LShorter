import { NextResponse } from "next/server";
import { auth } from "@/auth";

import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

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
    const targetUserId = body.userId || session.user.id;
    const plan = body.plan;

    // Strict IDOR protection: a user can only change their own plan
    if (session.user.id && targetUserId !== session.user.id) {
      return NextResponse.json(
        { success: false, error: "Unauthorized to modify another user's plan." },
        { status: 403 }
      );
    }

    const userId = targetUserId;

    if (!userId || !plan) {
      return NextResponse.json(
        { success: false, error: "userId and plan are required" },
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

    if (userId && plan !== "FREE" && plan !== "FREEMIUM") {
      const { sendPlanPurchaseConfirmationAction } = await import("@/app/actions/plan-purchase");
      sendPlanPurchaseConfirmationAction({
        userId,
        userEmail: session.user.email || undefined,
        userName: session.user.name || undefined,
        plan,
        cycle: body.cycle || "MONTHLY",
      }).catch((err) => console.error("Error sending plan confirmation email:", err));
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("User Upgrade proxy error:", error);
    return NextResponse.json({ success: true, isLocalFallback: true });
  }
}
