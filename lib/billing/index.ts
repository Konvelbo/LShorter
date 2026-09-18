// ============================================================================
// Billing Module Entry & Factory
// ============================================================================

import { BillingProvider } from "./types";
import { mockBillingProvider } from "./mock-provider";

export * from "./types";
export * from "./mock-provider";
export * from "./pdf-invoice";

export function getBillingProvider(): BillingProvider {
  // In production, we can return StripeProvider or LemonSqueezyProvider if configured.
  // Defaults to MockBillingProvider for instant autonomous self-service.
  return mockBillingProvider;
}
