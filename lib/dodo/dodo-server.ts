// ============================================================================
// Dodo Payments Server SDK & Webhook Verification
// ============================================================================

import { DodoPayments } from "dodopayments";

/**
 * Determines whether Dodo Payments is running in live_mode or test_mode.
 * Auto-detects directly from the key prefix if available, ensuring zero mismatch.
 */
export function isDodoLiveMode(): boolean {
  const bearerToken = (
    process.env.DODO_PAYMENTS_API_KEY ||
    process.env.NEXT_PUBLIC_DODO_PAYMENTS_API_KEY ||
    ""
  ).trim();

  if (bearerToken.startsWith("dodo_live_")) {
    return true;
  }
  if (bearerToken.startsWith("dodo_test_")) {
    return false;
  }

  return (
    process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ||
    process.env.DODO_PAYMENTS_ENVIRONMENT === "live" ||
    process.env.NEXT_PUBLIC_DODO_PAYMENTS_ENVIRONMENT === "live" ||
    process.env.NEXT_PUBLIC_DODO_PAYMENTS_ENVIRONMENT === "live_mode"
  );
}

/**
 * Returns a configured Dodo Payments client instance.
 * Automatically checks for test_mode vs live_mode based on environment variables or key prefix.
 */
export function getDodoPaymentsClient(): DodoPayments | null {
  const bearerToken = (
    process.env.DODO_PAYMENTS_API_KEY ||
    process.env.NEXT_PUBLIC_DODO_PAYMENTS_API_KEY ||
    ""
  ).trim();

  if (!bearerToken) {
    return null;
  }

  const environment = isDodoLiveMode() ? "live_mode" : "test_mode";

  const webhookKey =
    process.env.DODO_PAYMENTS_WEBHOOK_KEY ||
    process.env.DODO_PAYMENTS_WEBHOOK_SECRET ||
    process.env.NEXT_PUBLIC_DODO_PAYMENTS_WEBHOOK_KEY;

  return new DodoPayments({
    bearerToken,
    environment,
    webhookKey,
  });
}

/**
 * Verifies an incoming Dodo Payments webhook payload using Standard Webhooks specification.
 */
export async function verifyDodoWebhook(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>
): Promise<any> {
  const webhookKey =
    process.env.DODO_PAYMENTS_WEBHOOK_KEY ||
    process.env.DODO_PAYMENTS_WEBHOOK_SECRET;

  if (!webhookKey) {
    throw new Error(
      "DODO_PAYMENTS_WEBHOOK_KEY or DODO_PAYMENTS_WEBHOOK_SECRET must be configured."
    );
  }

  // Normalize header map for Standard Webhooks
  const normalizedHeaders: Record<string, string> = {
    "webhook-id": String(headers["webhook-id"] || ""),
    "webhook-signature": String(headers["webhook-signature"] || ""),
    "webhook-timestamp": String(headers["webhook-timestamp"] || ""),
  };

  const client = getDodoPaymentsClient();
  if (client) {
    return client.webhooks.unwrap(rawBody, {
      headers: normalizedHeaders,
      key: webhookKey,
    });
  }

  // Fallback client instantiation if only webhookKey is configured
  const tempClient = new DodoPayments({
    bearerToken: "dummy_key",
    environment: "test_mode",
    webhookKey,
  });

  return tempClient.webhooks.unwrap(rawBody, {
    headers: normalizedHeaders,
    key: webhookKey,
  });
}
