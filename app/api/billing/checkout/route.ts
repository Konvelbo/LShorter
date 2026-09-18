import { NextRequest, NextResponse } from "next/server";
import { getBillingProvider } from "@/lib/billing";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orgId, planId, cycle, successUrl, cancelUrl, customerEmail, companyName } = body;

    if (!planId || (planId !== "PRO" && planId !== "BUSINESS" && planId !== "ENTERPRISE")) {
      return NextResponse.json(
        { success: false, error: "Plan payant invalide (PRO, BUSINESS ou ENTERPRISE requis)." },
        { status: 400 }
      );
    }

    const provider = getBillingProvider();
    const result = await provider.createCheckoutSession({
      orgId: orgId || "default",
      planId,
      cycle: cycle === "YEARLY" ? "YEARLY" : "MONTHLY",
      successUrl: successUrl || "/dashboard/pricing?checkout_success=true",
      cancelUrl: cancelUrl || "/dashboard/pricing",
      customerEmail,
      companyName,
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: result.checkoutUrl,
      sessionId: result.sessionId,
    });
  } catch (error: any) {
    console.error("[Billing Checkout Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur lors de la création de la session de paiement." },
      { status: 500 }
    );
  }
}
