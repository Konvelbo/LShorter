import { NextRequest, NextResponse } from "next/server";
import { getDodoPaymentsClient } from "@/lib/dodo/dodo-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { syncUserToCloudflare } from "@/lib/sync-user-server";
import { cancelReplacedSubscriptions } from "@/lib/billing/cancel-replaced-subscription";
import { resolvePlanFromDodoProductId } from "@/src/config/pricing";
import { auth } from "@/auth";
import { parseBody, verifyTransactionBodySchema } from "@/lib/api-schemas";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { data: body, error: bodyError } = await parseBody(request, verifyTransactionBodySchema);
    if (bodyError) return bodyError;

    const {
      subscriptionId: requestedSubscriptionId,
      plan: requestedPlan,
    } = body;

    const sessionUserId = session.user.id || "";
    const sessionEmail = (session.user.email || "").toLowerCase().trim();
    const sessionName = session.user.name || "Customer";

    // Dodo Payments Reconciliation (when returning from Dodo Checkout)
    const dodoClient = getDodoPaymentsClient();
    if (dodoClient) {
      let targetSub: any = null;

      if (requestedSubscriptionId) {
        try {
          const retrieved = await dodoClient.subscriptions.retrieve(
            String(requestedSubscriptionId)
          );
          const subUserId = retrieved?.metadata?.userId
            ? String(retrieved.metadata.userId).trim()
            : "";
          const subEmail = retrieved?.customer?.email
            ? String(retrieved.customer.email).toLowerCase().trim()
            : "";
          const subStatus = String(retrieved?.status || "").toLowerCase().trim();
          // Security: Strictly require status === "active" so pending/failed/cancelled checkouts can NEVER upgrade a plan
          if (
            retrieved &&
            subStatus === "active" &&
            ((subUserId && subUserId === sessionUserId) ||
              (sessionEmail && subEmail && subEmail === sessionEmail))
          ) {
            targetSub = retrieved;
          }
        } catch (err) {
          console.warn("[Verify Transaction] Dodo retrieve subscription warning:", err);
        }
      }

      if (!targetSub) {
        try {
          const activePage = await dodoClient.subscriptions.list({
            status: "active",
            page_size: 50,
          });
          const items: any[] = (activePage as any)?.items || [];
          const matching = items.filter((sub) => {
            const subUserId = sub?.metadata?.userId
              ? String(sub.metadata.userId).trim()
              : "";
            const subEmail = sub?.customer?.email
              ? String(sub.customer.email).toLowerCase().trim()
              : "";
            return (
              (sessionUserId && subUserId && subUserId === sessionUserId) ||
              (sessionEmail && subEmail && subEmail === sessionEmail)
            );
          });

          if (matching.length > 0) {
            // Sort newest first so an upgraded subscription (e.g. BUSINESS) always wins over an older PRO one
            matching.sort((a, b) => {
              const tA = a?.created_at ? new Date(a.created_at).getTime() : 0;
              const tB = b?.created_at ? new Date(b.created_at).getTime() : 0;
              return tB - tA;
            });
            targetSub = matching[0];
          }
        } catch (listErr) {
          console.warn("[Verify Transaction] Dodo list active subscriptions warning:", listErr);
        }
      }

      if (targetSub && targetSub.subscription_id && String(targetSub.status || "").toLowerCase() === "active") {
        const subId = String(targetSub.subscription_id);
        const meta = targetSub.metadata || {};
        const productId = String(targetSub.product_id || "").trim();

        const productResolved = resolvePlanFromDodoProductId(productId);
        const productDerivedPlan = productResolved?.planId || "";

        // Security: Never trust client-supplied `requestedPlan` to elevate plan tier
        const rawPlan = String(
          productDerivedPlan || meta.planId || "PRO"
        ).toUpperCase();
        const planId = (
          ["PRO", "BUSINESS", "ENTERPRISE"].includes(rawPlan) ? rawPlan : "PRO"
        ) as "PRO" | "BUSINESS" | "ENTERPRISE";
        const cycle =
          productResolved?.cycle ||
          (String(meta.cycle || "").toUpperCase() === "YEARLY" ||
          targetSub.subscription_period_interval === "Year"
            ? "YEARLY"
            : "MONTHLY");
        const customerEmail = targetSub.customer?.email || sessionEmail || "";
        const customerName = targetSub.customer?.name || sessionName;

        const parsedStart = targetSub.previous_billing_date
          ? new Date(targetSub.previous_billing_date).getTime()
          : NaN;
        const parsedEnd = targetSub.next_billing_date
          ? new Date(targetSub.next_billing_date).getTime()
          : NaN;
        const periodStart = Number.isNaN(parsedStart) ? Date.now() : parsedStart;
        const periodEnd = Number.isNaN(parsedEnd)
          ? Date.now() + (cycle === "YEARLY" ? 365 : 30) * 86400000
          : parsedEnd;

        if (sessionUserId) {
          await convex
            .mutation(api.users.updatePlan, {
              userId: sessionUserId,
              plan: planId,
            })
            .catch((e) => console.warn("[Verify Transaction] Convex updatePlan warning:", e));

          await convex
            .mutation(api.organizations.getOrCreateUserOrganization, {
              userId: sessionUserId,
              name: `org_${sessionUserId}`,
              email: customerEmail,
              plan: planId,
            })
            .catch(() => {});

          await syncUserToCloudflare({
            id: sessionUserId,
            email: customerEmail,
            name: customerName,
            plan: planId,
          }).catch(() => {});

          if (sessionEmail && sessionEmail !== sessionUserId) {
            await syncUserToCloudflare({
              id: sessionEmail,
              email: sessionEmail,
              name: customerName,
              plan: planId,
            }).catch(() => {});
          }

          const upsertRes: any = await convex
            .mutation(api.subscriptions.upsertSubscription, {
              orgId: sessionUserId,
              provider: "dodo",
              providerSubscriptionId: subId,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd: Boolean(targetSub.cancel_at_next_billing_date),
              plan: planId,
              cycle,
            })
            .catch(() => null);

          const prevSubId =
            upsertRes?.previousSubscriptionId ||
            (meta.previousSubscriptionId
              ? String(meta.previousSubscriptionId)
              : undefined);

          await cancelReplacedSubscriptions({
            userId: sessionUserId,
            orgId: sessionUserId,
            customerEmail: sessionEmail || customerEmail,
            dodoCustomerId: targetSub.customer?.customer_id
              ? String(targetSub.customer.customer_id)
              : undefined,
            newSubscriptionId: subId,
            newProvider: "dodo",
            newPlan: planId,
            previousSubscriptionId: prevSubId,
            previousProvider: upsertRes?.previousProvider,
          }).catch((e) =>
            console.warn("[Verify Transaction] Cancel replaced Dodo sub warning:", e)
          );
        }

        return NextResponse.json({
          success: true,
          provider: "dodo",
          subscriptionId: subId,
          plan: planId,
          cycle,
          status: targetSub.status || "active",
        });
      }
    }

    // Fallback: check Convex only if webhook has already processed and confirmed the upgrade
    const convexUser = sessionUserId
      ? await convex
          .query(api.users.getCurrentUser, { userId: sessionUserId })
          .catch(() => null)
      : null;
    const dbPlan = String(convexUser?.plan || "FREE").toUpperCase();
    if (dbPlan === "PRO" || dbPlan === "BUSINESS" || dbPlan === "ENTERPRISE") {
      return NextResponse.json({
        success: true,
        provider: "dodo",
        plan: dbPlan,
        status: "active",
      });
    }

    return NextResponse.json(
      { success: false, error: "Aucune transaction confirmée trouvée sur Dodo Payments." },
      { status: 404 }
    );
  } catch (error: any) {
    console.error("[Verify Transaction Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify transaction" },
      { status: 500 }
    );
  }
}
