import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { dodoBillingProvider } from "@/lib/billing/dodo-provider";
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

    const subId = convexSub?.providerSubscriptionId || null;
    if (
      !convexSub ||
      !subId ||
      !convexSub.plan ||
      ["FREE", "FREEMIUM", "STARTER"].includes(String(convexSub.plan).toUpperCase())
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Aucun abonnement payant à réactiver sur votre compte.",
        },
        { status: 404 }
      );
    }
    const plan = String(convexSub.plan).toUpperCase();

    // 2. Resume on Dodo Payments
    const resumed = await dodoBillingProvider.resumeSubscription(subId);
    if (!resumed) {
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de confirmer la réactivation auprès de Dodo Payments.",
        },
        { status: 400 }
      );
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
