import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPaddleInstance } from "@/lib/paddle/paddle-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/subscription/resume
 * Resumes auto-renewal of a subscription previously marked for cancellation at period end.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Non autorisé" },
        { status: 401 }
      );
    }

    const userId = session.user.id || "";
    const email = session.user.email || "";

    // 1. Fetch current subscription in Convex
    let convexSub: any = null;
    if (userId) {
      try {
        convexSub = await convex.query(api.subscriptions.getSubscription, {
          orgId: userId,
        });
      } catch (err) {
        console.warn("[Resume Subscription] Convex query warning:", err);
      }
    }

    let subId = convexSub?.providerSubscriptionId || null;
    let plan = convexSub?.plan || ((session.user as any)?.plan || "PRO").toUpperCase();

    const paddle = getPaddleInstance();

    // 2. If subId not recorded in Convex, search customer on Paddle by exact email
    if (!subId && paddle && email) {
      try {
        const cleanEmail = email.toLowerCase().trim();
        for await (const customer of paddle.customers.list({ email: [cleanEmail] })) {
          if (!customer.id || customer.email?.toLowerCase().trim() !== cleanEmail) continue;
          for await (const s of paddle.subscriptions.list({
            customerId: [customer.id],
            perPage: 5,
          })) {
            if (s.status === "active" || s.status === "trialing") {
              subId = s.id;
              break;
            }
          }
          if (subId) break;
        }
      } catch (paddleErr) {
        console.warn("[Resume Subscription] Paddle customer lookup error:", paddleErr);
      }
    }

    // 3. If subId exists on Paddle, clear the scheduledChange
    if (paddle && subId && subId.startsWith("sub_")) {
      try {
        console.info(`[Resume Subscription] Resuming subscription ${subId} on Paddle...`);
        await paddle.subscriptions.update(subId, {
          scheduledChange: null,
        });
      } catch (paddleErr: any) {
        console.error("[Resume Subscription] Paddle SDK resume error:", paddleErr?.message);
        if (
          !paddleErr?.message?.includes("not found") &&
          !paddleErr?.message?.includes("scheduled_change")
        ) {
          return NextResponse.json(
            {
              success: false,
              error: `Erreur Paddle lors de la réactivation: ${paddleErr?.message || "Échec de l'opération"}`,
            },
            { status: 500 }
          );
        }
      }
    }

    // 3. Update Convex
    if (userId) {
      try {
        await convex.mutation(api.subscriptions.setCancelAtPeriodEnd, {
          orgId: userId,
          cancelAtPeriodEnd: false,
          plan,
        });
      } catch (convexErr) {
        console.error("[Resume Subscription] Error updating Convex subscription:", convexErr);
      }

      // 4. In-app notification
      try {
        await convex.mutation(api.notifications.createNotification, {
          orgId: userId,
          title: "Renouvellement automatique réactivé",
          message: `Le renouvellement automatique de votre formule ${plan} est de nouveau actif. Votre compte sera automatiquement renouvelé au terme de la période.`,
          type: "SUCCESS",
          linkUrl: "/dashboard/settings?tab=billing",
        });
      } catch (notifErr) {
        console.warn("[Resume Subscription] Error creating notification:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Le renouvellement automatique a été réactivé avec succès.",
      cancelAtPeriodEnd: false,
    });
  } catch (error: any) {
    console.error("[Resume Subscription] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
