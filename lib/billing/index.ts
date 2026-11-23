// ============================================================================
// Billing Module Entry & Factory
// ============================================================================

import { BillingProvider } from "./types";
import { dodoBillingProvider } from "./dodo-provider";

export * from "./types";
export * from "./dodo-provider";
export * from "./pdf-invoice";
export * from "./cancel-replaced-subscription";
export * from "./currency";

export function getBillingProvider(): BillingProvider {
  // LShorter officially runs on Dodo Payments
  return dodoBillingProvider;
}
