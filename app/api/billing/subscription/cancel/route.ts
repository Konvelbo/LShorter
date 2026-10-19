import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPaddleInstance } from "@/lib/paddle/paddle-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/subscription/cancel
 * Cancels auto-renewal of the user's subscription at the end of the current billing cycle.
 * - Stops all future recurring charges.
 * - Retains full access until currentPeriodEnd (No Refund / All Sales Are Final policy).
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
        console.warn("[Cancel Subscription] Convex query warning:", err);
      }
    }

    let subId = convexSub?.providerSubscriptionId || null;
    let currentPeriodEnd = convexSub?.currentPeriodEnd || null;
    let plan = convexSub?.plan || ((session.user as any)?.plan || "PRO").toUpperCase();
    let cycle = convexSub?.cycle || "MONTHLY";

    const paddle = getPaddleInstance();

    // 2. If no subId recorded in Convex, attempt to find active subscription on Paddle
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
              if (s.currentBillingPeriod?.endsAt) {
                currentPeriodEnd = new Date(s.currentBillingPeriod.endsAt).getTime();
              }
              break;
            }
          }
          if (subId) break;
        }
      } catch (paddleErr) {
        console.warn("[Cancel Subscription] Paddle customer lookup error:", paddleErr);
      }
    }

    // 3. Perform cancellation on Paddle at period end
    if (paddle && subId && subId.startsWith("sub_")) {
      try {
        console.info(`[Cancel Subscription] Canceling subscription ${subId} at period end...`);
        const updatedPaddleSub = await paddle.subscriptions.cancel(subId, {
          effectiveFrom: "next_billing_period",
        });
        if (updatedPaddleSub.currentBillingPeriod?.endsAt) {
          currentPeriodEnd = new Date(updatedPaddleSub.currentBillingPeriod.endsAt).getTime();
        }
      } catch (paddleErr: any) {
        console.error("[Cancel Subscription] Paddle SDK cancellation error:", paddleErr?.message);
        // If it's already canceled at period end, continue
        if (!paddleErr?.message?.includes("already")) {
          return NextResponse.json(
            {
              success: false,
              error: `Erreur Paddle lors de l'annulation: ${paddleErr?.message || "Échec de l'opération"}`,
            },
            { status: 500 }
          );
        }
      }
    }

    // Default period end if not yet defined (30 days from now)
    if (!currentPeriodEnd) {
      currentPeriodEnd = Date.now() + 30 * 86400000;
    }

    // 4. Update Convex record
    if (userId) {
      try {
        await convex.mutation(api.subscriptions.setCancelAtPeriodEnd, {
          orgId: userId,
          cancelAtPeriodEnd: true,
          currentPeriodEnd,
          providerSubscriptionId: subId || undefined,
          plan,
          cycle,
        });
      } catch (convexErr) {
        console.error("[Cancel Subscription] Error updating Convex subscription:", convexErr);
      }

      // 5. Create in-app notification
      try {
        const endDateStr = new Date(currentPeriodEnd).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });

        await convex.mutation(api.notifications.createNotification, {
          orgId: userId,
          title: "Renouvellement automatique désactivé",
          message: `Le renouvellement automatique de votre formule ${plan} a été annulé. Vous conservez l'accès intégral à tous vos services et quotas jusqu'au ${endDateStr}. Aucun prélèvement futur ne sera effectué.`,
          type: "WARNING",
          linkUrl: "/dashboard/settings?tab=billing",
        });
      } catch (notifErr) {
        console.warn("[Cancel Subscription] Error creating notification:", notifErr);
      }
    }

    const formattedPeriodEnd = new Date(currentPeriodEnd).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    return NextResponse.json({
      success: true,
      message: "Le renouvellement automatique a été annulé avec succès.",
      cancelAtPeriodEnd: true,
      currentPeriodEnd,
      formattedPeriodEnd,
    });
  } catch (error: any) {
    console.error("[Cancel Subscription] Unexpected error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
