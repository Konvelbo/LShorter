import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDodoPaymentsClient } from "@/lib/dodo/dodo-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { cancelReplacedSubscriptions } from "@/lib/billing/cancel-replaced-subscription";

export const dynamic = "force-dynamic";

/**
 * GET /api/billing/subscription
 * Retrieves the current user's subscription and auto-renewal status.
 * Combines data from Convex and Dodo Payments SDK.
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
    let userPlan = ((session.user as any)?.plan || "FREE").toUpperCase();

    // 1. Fetch live user & subscription from Convex
    let convexSub: any = null;
    if (userId) {
      try {
        const [liveUser, subDoc] = await Promise.all([
          convex.query(api.users.getCurrentUser, { userId }).catch(() => null),
          convex.query(api.subscriptions.getSubscription, { orgId: userId }).catch(() => null),
        ]);
        if (liveUser?.plan) {
          userPlan = String(liveUser.plan).toUpperCase();
        }
        convexSub = subDoc;
      } catch (err) {
        console.warn("[Subscription API] Convex query failed:", err);
      }
    }

    let providerSubscriptionId = convexSub?.providerSubscriptionId || null;
    const provider = "dodo";
    let cancelAtPeriodEnd = Boolean(convexSub?.cancelAtPeriodEnd);
    let currentPeriodStart = convexSub?.currentPeriodStart || null;
    let currentPeriodEnd = convexSub?.currentPeriodEnd || null;
    let plan =
      userPlan !== "FREE" && userPlan !== "FREEMIUM" && userPlan !== "STARTER"
        ? userPlan
        : convexSub?.plan || userPlan;
    let cycle = convexSub?.cycle || "MONTHLY";
    let status = convexSub?.lifecycleStatus === "DOWNGRADED"
      ? "canceled"
      : convexSub?.lifecycleStatus === "GRACE_PERIOD"
        ? "past_due"
        : "active";

    // 2. Sync live state from Dodo Payments
    const dodoClient = providerSubscriptionId ? getDodoPaymentsClient() : null;
    if (dodoClient && providerSubscriptionId) {
      try {
        let dodoSub: any = await dodoClient.subscriptions.retrieve(providerSubscriptionId);

        // If the stored subscription was cancelled or does not match the newer upgraded plan,
        // check if the user has a newer active subscription on Dodo Payments
        if (
          dodoSub &&
          (dodoSub.status === "cancelled" ||
            (dodoSub.metadata?.planId &&
              String(dodoSub.metadata.planId).toUpperCase() !== plan))
        ) {
          const custId = dodoSub.customer?.customer_id;
          if (custId) {
            const candidates: any[] = [];
            for await (const s of dodoClient.subscriptions.list({
              customer_id: custId,
              status: "active",
              page_size: 10,
            })) {
              candidates.push(s);
            }
            if (candidates.length > 0) {
              candidates.sort((a, b) => {
                const tA = a?.created_at ? new Date(a.created_at).getTime() : 0;
                const tB = b?.created_at ? new Date(b.created_at).getTime() : 0;
                return tB - tA;
              });
              const newest = candidates[0];
              if (newest?.subscription_id && newest.subscription_id !== providerSubscriptionId) {
                const oldSubId = providerSubscriptionId;
                dodoSub = newest;
                providerSubscriptionId = newest.subscription_id;
                await cancelReplacedSubscriptions({
                  userId,
                  orgId: userId,
                  customerEmail: email,
                  dodoCustomerId: String(custId),
                  newSubscriptionId: newest.subscription_id,
                  newProvider: "dodo",
                  newPlan: String(newest.metadata?.planId || plan).toUpperCase(),
                  previousSubscriptionId: oldSubId,
                  previousProvider: "dodo",
                }).catch(() => {});
              }
            }
          }
        }

        if (dodoSub) {
          status = dodoSub.status || status;
          cancelAtPeriodEnd = Boolean(dodoSub.cancel_at_next_billing_date);
          if (dodoSub.metadata?.planId) {
            const metaPlan = String(dodoSub.metadata.planId).toUpperCase();
            if (["PRO", "BUSINESS", "ENTERPRISE"].includes(metaPlan)) {
              plan = metaPlan;
            }
          }
          if (dodoSub.metadata?.cycle) {
            const metaCycle = String(dodoSub.metadata.cycle).toUpperCase();
            if (metaCycle === "YEARLY" || metaCycle === "MONTHLY") {
              cycle = metaCycle;
            }
          }
          const nextMs = dodoSub.next_billing_date ? new Date(dodoSub.next_billing_date).getTime() : NaN;
          const prevMs = dodoSub.previous_billing_date ? new Date(dodoSub.previous_billing_date).getTime() : NaN;
          if (!Number.isNaN(nextMs)) {
            currentPeriodEnd = nextMs;
          }
          if (!Number.isNaN(prevMs)) {
            currentPeriodStart = prevMs;
          }
          if (
            dodoSub.status === "active" &&
            userId &&
            (providerSubscriptionId !== convexSub?.providerSubscriptionId ||
              plan !== convexSub?.plan ||
              (currentPeriodEnd && currentPeriodEnd > (convexSub?.currentPeriodEnd || 0)))
          ) {
            await convex.mutation(api.subscriptions.upsertSubscription, {
              orgId: userId,
              provider: "dodo",
              providerSubscriptionId,
              currentPeriodStart: currentPeriodStart || Date.now(),
              currentPeriodEnd: currentPeriodEnd || Date.now() + 30 * 86400000,
              cancelAtPeriodEnd,
              plan,
              cycle,
            }).catch((e) => console.warn("[Subscription API] Dodo sync to Convex failed:", e));
          }
        }
      } catch (dodoErr) {
        console.warn("[Subscription API] Dodo lookup warning:", dodoErr);
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
        provider,
        providerSubscriptionId,
        plan,
        cycle,
        status,
        cancelAtPeriodEnd,
        currentPeriodStart,
        currentPeriodEnd,
        formattedPeriodEnd,
        lifecycleStatus: convexSub?.lifecycleStatus || null,
        gracePeriodEndsAt: convexSub?.gracePeriodEndsAt || null,
        lastLifecycleAlert: convexSub?.lastLifecycleAlert || null,
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
