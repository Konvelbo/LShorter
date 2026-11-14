import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBillingProvider } from "@/lib/billing";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { orgId, planId, cycle, successUrl, cancelUrl, companyName, discountId } = body;

    const userId = session?.user?.id || body.userId || `guest_${Date.now()}`;
    const customerEmail = session?.user?.email || body.customerEmail || undefined;

    if (!planId || (planId !== "PRO" && planId !== "BUSINESS" && planId !== "ENTERPRISE")) {
      return NextResponse.json(
        { success: false, error: "Invalid paid plan (PRO, BUSINESS, or ENTERPRISE required)." },
        { status: 400 }
      );
    }

    const normalizedCycle: "MONTHLY" | "YEARLY" = cycle === "YEARLY" ? "YEARLY" : "MONTHLY";

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

          if (isCurrentlyActive && existingPlan === planId && existingCycle === normalizedCycle) {
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
