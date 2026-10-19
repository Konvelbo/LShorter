import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getPaddleInstance } from "@/lib/paddle/paddle-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/billing/subscription
 * Retrieves the current user's subscription and auto-renewal status.
 * Combines data from Convex and Paddle Node SDK.
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const userId = session.user.id || "";
    const email = session.user.email || "";
    const userPlan = ((session.user as any)?.plan || "FREE").toUpperCase();

    // 1. Fetch subscription from Convex
    let convexSub: any = null;
    if (userId) {
      try {
        convexSub = await convex.query(api.subscriptions.getSubscription, {
          orgId: userId,
        });
      } catch (err) {
        console.warn("[Subscription API] Convex getSubscription query failed:", err);
      }
    }

    let providerSubscriptionId = convexSub?.providerSubscriptionId || null;
    let cancelAtPeriodEnd = Boolean(convexSub?.cancelAtPeriodEnd);
    let currentPeriodStart = convexSub?.currentPeriodStart || null;
    let currentPeriodEnd = convexSub?.currentPeriodEnd || null;
    let plan = convexSub?.plan || userPlan;
    let cycle = convexSub?.cycle || "MONTHLY";
    let status = "active";

    // 2. If Paddle is available and we have an email or subscription ID, sync with Paddle
    const paddle = getPaddleInstance();
    if (paddle) {
      try {
        if (providerSubscriptionId && providerSubscriptionId.startsWith("sub_")) {
          const paddleSub = await paddle.subscriptions.get(providerSubscriptionId);
          if (paddleSub) {
            status = paddleSub.status;
            cancelAtPeriodEnd = paddleSub.scheduledChange?.action === "cancel";
            if (paddleSub.currentBillingPeriod?.endsAt) {
              currentPeriodEnd = new Date(paddleSub.currentBillingPeriod.endsAt).getTime();
            }
            if (paddleSub.currentBillingPeriod?.startsAt) {
              currentPeriodStart = new Date(paddleSub.currentBillingPeriod.startsAt).getTime();
            }
          }
        } else if (email) {
          // Look up active subscription for this customer on Paddle
          const cleanEmail = email.toLowerCase().trim();
          for await (const customer of paddle.customers.list({ email: [cleanEmail] })) {
            if (!customer.id || customer.email?.toLowerCase().trim() !== cleanEmail) continue;
            for await (const sub of paddle.subscriptions.list({
              customerId: [customer.id],
              perPage: 5,
            })) {
              if (sub.status === "active" || sub.status === "trialing" || sub.status === "past_due") {
                providerSubscriptionId = sub.id;
                status = sub.status;
                cancelAtPeriodEnd = sub.scheduledChange?.action === "cancel";
                if (sub.currentBillingPeriod?.endsAt) {
                  currentPeriodEnd = new Date(sub.currentBillingPeriod.endsAt).getTime();
                }
                if (sub.currentBillingPeriod?.startsAt) {
                  currentPeriodStart = new Date(sub.currentBillingPeriod.startsAt).getTime();
                }

                const customData = (sub.customData as any) || {};
                if (customData.planId) plan = customData.planId.toUpperCase();
                if (customData.cycle) cycle = customData.cycle.toUpperCase();

                // Sync back to Convex
                if (userId) {
                  try {
                    await convex.mutation(api.subscriptions.upsertSubscription, {
                      orgId: userId,
                      provider: "paddle",
                      providerSubscriptionId: sub.id,
                      currentPeriodStart: currentPeriodStart || Date.now(),
                      currentPeriodEnd: currentPeriodEnd || Date.now() + 30 * 86400000,
                      cancelAtPeriodEnd,
                      plan,
                      cycle,
                    });
                  } catch (e) {
                    console.warn("[Subscription API] Syncing to Convex failed:", e);
                  }
                }
                break;
              }
            }
            if (providerSubscriptionId) break;
          }
        }
      } catch (paddleErr) {
        console.warn("[Subscription API] Paddle lookup warning:", paddleErr);
      }
    }

    // Default period end if paid plan but no date recorded yet
    if (!currentPeriodEnd && (plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE")) {
      currentPeriodEnd = Date.now() + 30 * 86400000;
      currentPeriodStart = Date.now();
    }

    const formattedPeriodEnd = currentPeriodEnd
      ? new Date(currentPeriodEnd).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : null;

    return NextResponse.json({
      success: true,
      subscription: {
        id: providerSubscriptionId,
        provider: "paddle",
        providerSubscriptionId,
        plan,
        cycle,
        status,
        cancelAtPeriodEnd,
        currentPeriodStart,
        currentPeriodEnd,
        formattedPeriodEnd,
      },
    });
  } catch (error: any) {
    console.error("[Subscription API] Error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
