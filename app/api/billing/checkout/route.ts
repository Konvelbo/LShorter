import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBillingProvider } from "@/lib/billing";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { isDodoLiveMode } from "@/lib/dodo/dodo-server";
import { parseBody, billingCheckoutBodySchema } from "@/lib/api-schemas";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const { data: body, error: bodyError } = await parseBody(request, billingCheckoutBodySchema);
    if (bodyError) return bodyError;

    const { orgId, planId, cycle: normalizedCycle, successUrl, cancelUrl, companyName, discountId } = body;

    // Security hardening: Only trust session.user.id for authenticated requests.
    // Unauthenticated callers cannot spoof existing registered user IDs.
    const userId = session?.user?.id || (typeof body.userId === "string" && body.userId.startsWith("guest_") ? body.userId : `guest_${Date.now()}`);
    const customerEmail = session?.user?.email || (session?.user ? undefined : body.customerEmail);

    // Check existing subscription to prevent duplicate checkout for the exact same active plan/cycle
    // and attach previousSubscriptionId when upgrading/switching plans so the old subscription is auto-cancelled.
    let previousSubscriptionId: string | undefined;
    let previousPlan: string | undefined;

    if (userId && !userId.startsWith("guest_")) {
      try {
        const existingSub = await convex.query(api.subscriptions.getSubscription, {
          orgId: userId,
        });

        if (existingSub?.providerSubscriptionId) {
          const existingPlan = String(existingSub.plan || "").toUpperCase();
          const existingCycle = String(existingSub.cycle || "MONTHLY").toUpperCase();
          const isCurrentlyActive =
            existingSub.lifecycleStatus !== "DOWNGRADED" &&
            !existingSub.cancelAtPeriodEnd &&
            typeof existingSub.currentPeriodEnd === "number" &&
            existingSub.currentPeriodEnd > Date.now();

          const isLiveMode = isDodoLiveMode();

          if (isLiveMode && !body.force && isCurrentlyActive && existingPlan === planId && existingCycle === normalizedCycle) {
            return NextResponse.json(
              {
                success: false,
                error: `You already have an active ${planId} (${normalizedCycle.toLowerCase()}) subscription.`,
              },
              { status: 400 }
            );
          }

          if (existingPlan && existingPlan !== "FREE" && existingPlan !== "FREEMIUM") {
            previousSubscriptionId = existingSub.providerSubscriptionId;
            previousPlan = existingPlan;
          }
        }
      } catch (subLookupErr) {
        console.warn("[Billing Checkout] Subscription lookup warning:", subLookupErr);
      }
    }

    const host = request.headers.get("host") || "localhost:3000";
    const protocol = request.headers.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
    const origin = `${protocol}://${host}`;

    const resolvedSuccessUrl = successUrl
      ? (successUrl.startsWith("http") ? successUrl : `${origin}${successUrl.startsWith("/") ? "" : "/"}${successUrl}`)
      : `${origin}/dashboard/settings?tab=billing`;

    const resolvedCancelUrl = cancelUrl
      ? (cancelUrl.startsWith("http") ? cancelUrl : `${origin}${cancelUrl.startsWith("/") ? "" : "/"}${cancelUrl}`)
      : `${origin}/dashboard/pricing`;

    const provider = getBillingProvider();
    const result = await provider.createCheckoutSession({
      orgId: orgId || "default",
      planId,
      cycle: normalizedCycle,
      successUrl: resolvedSuccessUrl,
      cancelUrl: resolvedCancelUrl,
      customerEmail,
      companyName,
      userId,
      discountId,
      previousSubscriptionId,
      previousPlan,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
      transactionId: result.transactionId,
    });
  } catch (error: any) {
    console.error("[Billing Checkout Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la création de la session de paiement." },
      { status: 500 }
    );
  }
}
