import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { getBillingProvider } from "@/lib/billing";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required to initiate checkout." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { orgId, planId, cycle, successUrl, cancelUrl, companyName, discountId } = body;

    if (!planId || (planId !== "PRO" && planId !== "BUSINESS" && planId !== "ENTERPRISE")) {
      return NextResponse.json(
        { success: false, error: "Plan payant invalide (PRO, BUSINESS ou ENTERPRISE requis)." },
        { status: 400 }
      );
    }

    const userId = session.user.id;
    const customerEmail = session.user.email || body.customerEmail;

    const provider = getBillingProvider();
    const result = await provider.createCheckoutSession({
      orgId: orgId || "default",
      planId,
      cycle: cycle === "YEARLY" ? "YEARLY" : "MONTHLY",
      successUrl: successUrl || "/dashboard/settings?tab=billing",
      cancelUrl: cancelUrl || "/dashboard/pricing",
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
