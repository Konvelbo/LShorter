import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getDodoPaymentsClient } from "@/lib/dodo/dodo-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { cancelReplacedSubscriptions } from "@/lib/billing/cancel-replaced-subscription";
import { syncUserToCloudflare } from "@/lib/sync-user-server";
import { resolvePlanFromDodoProductId } from "@/src/config/pricing";

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
    let lifecycleStatus: string | null = convexSub?.lifecycleStatus || null;
    let gracePeriodEndsAt: number | null = convexSub?.gracePeriodEndsAt || null;
    let lastLifecycleAlert: string | null = convexSub?.lastLifecycleAlert || null;
    let plan =
      lifecycleStatus === "DOWNGRADED"
        ? "FREE"
        : userPlan !== "FREE" && userPlan !== "FREEMIUM" && userPlan !== "STARTER"
          ? userPlan
          : convexSub?.plan || userPlan;
    let cycle = convexSub?.cycle || "MONTHLY";
    let status = lifecycleStatus === "DOWNGRADED"
      ? "canceled"
      : lifecycleStatus === "GRACE_PERIOD"
        ? "past_due"
        : "active";

    // 2. Sync live state from Dodo Payments
    let confirmedActiveRenewal = false;
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
          const productResolved = resolvePlanFromDodoProductId(dodoSub.product_id);
          if (productResolved) {
            plan = productResolved.planId;
            cycle = productResolved.cycle;
          } else {
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
            currentPeriodEnd &&
            currentPeriodEnd > Date.now()
          ) {
            confirmedActiveRenewal = true;
            lifecycleStatus = "ACTIVE";
            gracePeriodEndsAt = null;
            if (
              providerSubscriptionId !== convexSub?.providerSubscriptionId ||
              plan !== convexSub?.plan ||
              convexSub?.lifecycleStatus !== "ACTIVE" ||
              currentPeriodEnd > (convexSub?.currentPeriodEnd || 0)
            ) {
              await convex.mutation(api.subscriptions.upsertSubscription, {
                orgId: userId,
                provider: "dodo",
                providerSubscriptionId,
                currentPeriodStart: currentPeriodStart || Date.now(),
                currentPeriodEnd,
                cancelAtPeriodEnd,
                plan,
                cycle,
              }).catch((e) => console.warn("[Subscription API] Dodo sync to Convex failed:", e));

              if (userPlan !== plan && ["PRO", "BUSINESS", "ENTERPRISE"].includes(plan)) {
                await convex.mutation(api.users.updatePlan, { userId, plan }).catch(() => {});
                await syncUserToCloudflare({
                  id: userId,
                  email,
                  name: session.user.name || userId,
                  plan: plan as "PRO" | "BUSINESS" | "ENTERPRISE",
                }).catch(() => {});
              }
            }
          }
        }
      } catch (dodoErr) {
        console.warn("[Subscription API] Dodo lookup warning:", dodoErr);
      }
    }

    // 3. Real-Time Lazy Lifecycle Enforcement (Grace Period & Freemium Downgrade)
    const now = Date.now();
    if (
      convexSub?._id &&
      !confirmedActiveRenewal &&
      lifecycleStatus !== "DOWNGRADED" &&
      currentPeriodEnd &&
      now >= currentPeriodEnd
    ) {
      if (
        lifecycleStatus === "GRACE_PERIOD" &&
        typeof gracePeriodEndsAt === "number" &&
        now >= gracePeriodEndsAt
      ) {
        // 24h Grace Period expired without renewal -> Downgrade to FREE immediately
        try {
          await convex.mutation(api.subscriptions.downgradeSubscriptionToFree, {
            subscriptionId: convexSub._id,
          });
          if (userId) {
            await syncUserToCloudflare({
              id: userId,
              email,
              name: session.user.name || userId,
              plan: "FREE",
            }).catch(() => {});
          }
          plan = "FREE";
          status = "canceled";
          lifecycleStatus = "DOWNGRADED";
          lastLifecycleAlert = "DOWNGRADED";
        } catch (downErr) {
          console.warn("[Subscription API] Lazy downgrade warning:", downErr);
        }
      } else if (lifecycleStatus !== "GRACE_PERIOD") {
        // Period ended without renewal -> Enter 24h Grace Period immediately
        try {
          const newGraceEnd = now + 24 * 60 * 60 * 1000;
          const graceRes = await convex.mutation(
            api.subscriptions.markSubscriptionGracePeriod,
            {
              providerSubscriptionId: providerSubscriptionId || undefined,
              orgId: userId,
              gracePeriodEndsAt: newGraceEnd,
            }
          );
          if (graceRes?.success) {
            lifecycleStatus = "GRACE_PERIOD";
            gracePeriodEndsAt = graceRes.gracePeriodEndsAt || newGraceEnd;
            lastLifecycleAlert = "GRACE_PERIOD";
            status = "past_due";
          }
        } catch (graceErr) {
          console.warn("[Subscription API] Lazy grace activation warning:", graceErr);
        }
      }
    }

    // Default period end if paid plan has no subscription document yet
    if (
      !currentPeriodEnd &&
      lifecycleStatus !== "DOWNGRADED" &&
      (plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE")
    ) {
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
        lifecycleStatus,
        gracePeriodEndsAt,
        lastLifecycleAlert,
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
