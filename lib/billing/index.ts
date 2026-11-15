// ============================================================================
// Billing Module Entry & Factory
// ============================================================================

import { BillingProvider } from "./types";
import { mockBillingProvider } from "./mock-provider";
import { dodoBillingProvider } from "./dodo-provider";

export * from "./types";
export * from "./mock-provider";
export * from "./dodo-provider";
export * from "./pdf-invoice";
export * from "./cancel-replaced-subscription";

export function getBillingProvider(): BillingProvider {
  // Only use Mock provider if explicitly forced in non-production local development
  if (
    process.env.BILLING_PROVIDER === "mock" &&
    process.env.NODE_ENV !== "production"
  ) {
    return mockBillingProvider;
  }

  // LShorter officially runs on Dodo Payments
  return dodoBillingProvider;
}
