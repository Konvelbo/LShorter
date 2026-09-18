// ============================================================================
// Mock Billing Provider Implementation (Self-Service Local & Staging Simulation)
// ============================================================================

import { BillingProvider, CreateCheckoutSessionParams } from "./types";
import { PRICING_PLANS } from "@/src/config/pricing";

export class MockBillingProvider implements BillingProvider {
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ checkoutUrl: string; sessionId: string }> {
    const plan = PRICING_PLANS[params.planId];
    if (!plan) {
      throw new Error(`Plan definition not found for plan ID: ${params.planId}`);
    }

    const sessionId = `cs_mock_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Determine initial price (launch promotions apply to 1st month in monthly cycle, and promo yearly prices)
    let initialPrice = params.cycle === 'YEARLY' ? plan.yearlyPrice : plan.monthlyPrice;
    if (params.cycle === 'MONTHLY') {
      if (plan.promoMonthly && plan.promoMonthly.firstMonthPrice > 0) {
        initialPrice = plan.promoMonthly.firstMonthPrice;
      }
    } else if (params.cycle === 'YEARLY') {
      if (plan.promoYearly && plan.promoYearly.yearlyPrice > 0) {
        initialPrice = plan.promoYearly.yearlyPrice;
      }
    }

    // Build self-service callback URL with session parameters
    const redirectUrl = new URL(params.successUrl, "http://localhost:3000");
    redirectUrl.searchParams.set("session_id", sessionId);
    redirectUrl.searchParams.set("plan", params.planId);
    redirectUrl.searchParams.set("cycle", params.cycle);
    redirectUrl.searchParams.set("amount", initialPrice.toString());
    redirectUrl.searchParams.set("orgId", params.orgId);

    return {
      checkoutUrl: redirectUrl.toString(),
      sessionId,
    };
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    console.info(`[MockBillingProvider] Subscription ${subscriptionId} marked for cancellation at period end.`);
    return true;
  }

  async reportOverage(subscriptionId: string, overageUnits: number, costPerUnit: number): Promise<void> {
    const totalCost = (overageUnits * costPerUnit).toFixed(2);
    console.info(
      `[MockBillingProvider] Reported overage for sub ${subscriptionId}: ${overageUnits} units @ €${costPerUnit} = €${totalCost}`
    );
  }

  async handleWebhook(payload: any, signature: string): Promise<{ event: string; orgId: string; planId?: string }> {
    const event = payload?.event || "checkout.completed";
    const orgId = payload?.data?.orgId || payload?.orgId || "default";
    const planId = payload?.data?.planId || payload?.planId;
    return { event, orgId, planId };
  }
}

export const mockBillingProvider = new MockBillingProvider();
