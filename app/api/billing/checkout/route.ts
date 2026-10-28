import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBillingProvider } from "@/lib/billing";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();
    const { orgId, planId, cycle, successUrl, cancelUrl, companyName, discountId } = body;

    const userId = session?.user?.id || body.userId || `guest_${Date.now()}`;
    const customerEmail = session?.user?.email || body.customerEmail || undefined;

    if (!planId || (planId !== "PRO" && planId !== "BUSINESS" && planId !== "ENTERPRISE")) {
      return NextResponse.json(
        { success: false, error: "Plan payant invalide (PRO, BUSINESS ou ENTERPRISE requis)." },
        { status: 400 }
      );
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
      cycle: cycle === "YEARLY" ? "YEARLY" : "MONTHLY",
      successUrl: resolvedSuccessUrl,
      cancelUrl: resolvedCancelUrl,
      customerEmail,
      companyName,
      userId,
      discountId,
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
