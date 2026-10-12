// ============================================================================
// Billing Module Entry & Factory
// ============================================================================

import { BillingProvider } from "./types";
import { mockBillingProvider } from "./mock-provider";
import { paddleBillingProvider } from "./paddle-provider";

export * from "./types";
export * from "./mock-provider";
export * from "./paddle-provider";
export * from "./pdf-invoice";

export function getBillingProvider(): BillingProvider {
  // Use official Paddle provider if PADDLE_API_KEY is defined
  if (process.env.PADDLE_API_KEY) {
    return paddleBillingProvider;
  }
  // Defaults to MockBillingProvider for offline / local sandbox simulation
  return mockBillingProvider;
}

