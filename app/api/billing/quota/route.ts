import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { PRICING_PLANS, evaluateClickQuotaAndOverage } from "@/src/config/pricing";

/**
 * GET /api/billing/quota
 * Returns the active user's monthly click quota & overage calculation,
 * as well as the full pricing & overage grid for Starter, Pro, Business, and Enterprise.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const session = await auth();

    const planParam =
      searchParams.get("plan") ||
      (session?.user as any)?.plan ||
      "FREE";

    const clicksParam = searchParams.get("clicks");
    const clicksThisMonth =
      clicksParam !== null && !Number.isNaN(Number(clicksParam))
        ? Math.max(0, Number(clicksParam))
        : Number((session?.user as any)?.clicksThisMonth || 0);

    const status = evaluateClickQuotaAndOverage(planParam, clicksThisMonth);

    return NextResponse.json({
      success: true,
      data: {
        ...status,
        plans: {
          FREE: {
            id: PRICING_PLANS.FREE.id,
            name: PRICING_PLANS.FREE.name,
            monthlyPrice: PRICING_PLANS.FREE.monthlyPrice,
            monthlyClicks: PRICING_PLANS.FREE.limits.monthlyClicks,
            overage: PRICING_PLANS.FREE.overage,
          },
          PRO: {
            id: PRICING_PLANS.PRO.id,
            name: PRICING_PLANS.PRO.name,
            monthlyPrice: PRICING_PLANS.PRO.monthlyPrice,
            monthlyClicks: PRICING_PLANS.PRO.limits.monthlyClicks,
            overage: PRICING_PLANS.PRO.overage,
          },
          BUSINESS: {
            id: PRICING_PLANS.BUSINESS.id,
            name: PRICING_PLANS.BUSINESS.name,
            monthlyPrice: PRICING_PLANS.BUSINESS.monthlyPrice,
            monthlyClicks: PRICING_PLANS.BUSINESS.limits.monthlyClicks,
            overage: PRICING_PLANS.BUSINESS.overage,
          },
          ENTERPRISE: {
            id: PRICING_PLANS.ENTERPRISE.id,
            name: PRICING_PLANS.ENTERPRISE.name,
            monthlyPrice: PRICING_PLANS.ENTERPRISE.monthlyPrice,
            monthlyClicks: PRICING_PLANS.ENTERPRISE.limits.monthlyClicks,
            overage: PRICING_PLANS.ENTERPRISE.overage,
          },
        },
      },
    });
  } catch (error: any) {
    console.error("[GET /api/billing/quota Error]:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Erreur lors du calcul du quota et de l'overage.",
      },
      { status: 500 }
    );
  }
}
