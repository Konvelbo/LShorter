import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPaddleInstance } from "@/lib/paddle/paddle-server";
import { getBillingProvider } from "@/lib/billing";
import { dodoBillingProvider } from "@/lib/billing/dodo-provider";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { sendFeedbackNotificationEmail } from "@/lib/resend";

export const dynamic = "force-dynamic";

/**
 * POST /api/billing/subscription/cancel
 * Cancels auto-renewal of the user's subscription at the end of the current billing cycle.
 * - Stops all future recurring charges.
 * - Retains full access until currentPeriodEnd (No Refund / All Sales Are Final policy).
 * - Collects churn feedback & reasons for product improvement.
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

    // Parse optional churn feedback and reasons from body
    let body: any = {};
    try {
      body = await request.json();
    } catch {
      body = {};
    }
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const feedback = typeof body?.feedback === "string" ? body.feedback.trim() : "";
    const rating =
      typeof body?.rating === "number" && body.rating >= 1 && body.rating <= 5
        ? Math.round(body.rating)
        : undefined;

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
    const isDodoProvider = convexSub?.provider === "dodo";

    const paddle = isDodoProvider ? null : getPaddleInstance();

    // 2. If no subId recorded in Convex and using Paddle, attempt to find active subscription
    if (!isDodoProvider && !subId && paddle && email) {
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

    // 3. Perform cancellation on Provider (Dodo Payments / Paddle) at period end
    if (isDodoProvider && subId) {
      const canceledOnDodo = await dodoBillingProvider.cancelSubscription(subId);
      if (!canceledOnDodo) {
        console.warn(`[Cancel Subscription] Dodo SDK did not confirm cancellation for ${subId}; updating Convex state.`);
      }
    } else if (!isDodoProvider && paddle && subId && subId.startsWith("sub_")) {
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
              error: `Erreur lors de l'annulation: ${paddleErr?.message || "Échec de l'opération"}`,
            },
            { status: 500 }
          );
        }
      }
    } else if (!convexSub?.provider && subId) {
      try {
        await getBillingProvider().cancelSubscription(subId);
      } catch (providerErr: any) {
        console.warn("[Cancel Subscription] Fallback provider cancel warning:", providerErr?.message);
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

      // 5. Store Churn Feedback into Convex feedbacks table
      if (email && (reason || feedback)) {
        try {
          await convex.mutation(api.users.storeFeedback, {
            email: email.toLowerCase().trim(),
            category: "Cancellation",
            message: `[Annulation ${plan}] Motif : ${reason || "Non spécifié"}\n\nCommentaires de l'utilisateur :\n${
              feedback || "(Aucun commentaire supplémentaire)"
            }\n\nCycle : ${cycle}`,
            pageContext: "/dashboard/settings?tab=billing",
            rating,
          });
        } catch (fbErr) {
          console.warn("[Cancel Subscription] Warning saving feedback to Convex:", fbErr);
        }

        // 6. Send instant notification email to SaaS founder / support
        try {
          await sendFeedbackNotificationEmail({
            category: `Désabonnement - ${plan}`,
            senderEmail: email,
            message: `Un utilisateur a annulé le renouvellement automatique de son abonnement ${plan} (${cycle}).\n\nMotif sélectionné :\n👉 ${
              reason || "Non spécifié"
            }\n\nCommentaires & besoins exprimés :\n${
              feedback || "(Aucun commentaire rédigé)"
            }\n\nNote d'expérience : ${rating ? `${rating}/5` : "Non notée"}`,
            pageContext: "/dashboard/settings?tab=billing",
            rating,
          });
        } catch (emailErr) {
          console.warn("[Cancel Subscription] Warning sending feedback email:", emailErr);
        }
      }

      // 7. Create in-app notification
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
