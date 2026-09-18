// ============================================================================
// Billing Provider Abstraction Interface (Adapter Pattern)
// ============================================================================

export interface CreateCheckoutSessionParams {
  orgId: string;
  planId: 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  cycle: 'MONTHLY' | 'YEARLY';
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  companyName?: string;
}

export interface BillingProvider {
  /**
   * Creates a self-service checkout session for the chosen plan and billing cycle.
   */
  createCheckoutSession(params: CreateCheckoutSessionParams): Promise<{ checkoutUrl: string; sessionId?: string }>;

  /**
   * Cancels an active subscription at the end of the current billing cycle.
   */
  cancelSubscription(subscriptionId: string): Promise<boolean>;

  /**
   * Reports metered click overage to the payment provider.
   */
  reportOverage(subscriptionId: string, overageUnits: number, costPerUnit: number): Promise<void>;

  /**
   * Verifies and processes incoming webhooks from the payment gateway.
   */
  handleWebhook(payload: unknown, signature: string): Promise<{ event: string; orgId: string; planId?: string }>;
}
