// ============================================================================
// Billing Module Entry & Factory
// ============================================================================

import { BillingProvider } from "./types";
import { mockBillingProvider } from "./mock-provider";
import { paddleBillingProvider } from "./paddle-provider";
import { dodoBillingProvider } from "./dodo-provider";

export * from "./types";
export * from "./mock-provider";
export * from "./paddle-provider";
export * from "./dodo-provider";
export * from "./pdf-invoice";

export function getBillingProvider(): BillingProvider {
  const preferred = (process.env.BILLING_PROVIDER || "").toLowerCase().trim();

  // 1. Explicit preference via BILLING_PROVIDER="dodo"
  if (preferred === "dodo") {
    return dodoBillingProvider;
  }

  // 2. Explicit preference via BILLING_PROVIDER="paddle"
  if (preferred === "paddle") {
    return paddleBillingProvider;
  }

  // 3. Auto-detect Dodo Payments if API key is provided
  if (process.env.DODO_PAYMENTS_API_KEY) {
    return dodoBillingProvider;
  }

  // 4. Auto-detect Paddle if API key is provided
  if (process.env.PADDLE_API_KEY) {
    return paddleBillingProvider;
  }

  // 5. Defaults to MockBillingProvider for offline / local sandbox simulation
  return mockBillingProvider;
}
