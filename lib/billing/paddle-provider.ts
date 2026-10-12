// ============================================================================
// Paddle Billing Provider Implementation (Official Node SDK)
// ============================================================================

import { BillingProvider, CreateCheckoutSessionParams } from "./types";
import { getPaddleInstance, verifyPaddleWebhook } from "@/lib/paddle/paddle-server";
import { getPaddlePriceId, PRICING_PLANS } from "@/src/config/pricing";

export class PaddleBillingProvider implements BillingProvider {
  /**
   * Creates a checkout transaction using the Paddle Node SDK.
   */
  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<{ checkoutUrl: string; sessionId?: string; transactionId?: string }> {
    const paddle = getPaddleInstance();
    const priceId = getPaddlePriceId(params.planId, params.cycle);

    // If Paddle is not configured with an API key, fallback gracefully
    if (!paddle || !priceId) {
      console.warn(
        `[PaddleBillingProvider] Paddle SDK or Price ID not configured. Falling back to local redirect.`
      );
      const sessionId = `txn_paddle_dev_${Date.now()}`;
      const redirectUrl = new URL(params.successUrl, "http://localhost:3000");
      redirectUrl.searchParams.set("session_id", sessionId);
      redirectUrl.searchParams.set("plan", params.planId);
      redirectUrl.searchParams.set("cycle", params.cycle);
      redirectUrl.searchParams.set("orgId", params.orgId);
      return {
        checkoutUrl: redirectUrl.toString(),
        sessionId,
        transactionId: sessionId,
      };
    }

    // Helper to attempt transaction creation with retry on network connect timeout
    const createTxn = async (attempt = 1): Promise<any> => {
      try {
        const createPayload: any = {
          items: [
            {
              priceId,
              quantity: 1,
            },
          ],
          customData: {
            userId: params.userId || "",
            orgId: params.orgId || "default",
            planId: params.planId,
            cycle: params.cycle,
            customerEmail: params.customerEmail || "",
          },
        };

        // Attach discount if configured (e.g. promo discount for first 2 months)
        const discountId =
          params.discountId ||
          process.env[`NEXT_PUBLIC_PADDLE_DISCOUNT_${params.planId}_${params.cycle}`] ||
          process.env[`PADDLE_DISCOUNT_${params.planId}_${params.cycle}`];

        if (discountId && discountId.startsWith("dsc_")) {
          createPayload.discountId = discountId;
        }

        return await paddle.transactions.create(createPayload);
      } catch (err: any) {
        const isNetworkError =
          err?.message?.includes("fetch failed") ||
          err?.code === "UND_ERR_CONNECT_TIMEOUT" ||
          err?.cause?.code === "UND_ERR_CONNECT_TIMEOUT" ||
          err?.cause?.message?.includes("Connect Timeout Error");

        if (attempt < 3 && isNetworkError) {
          console.warn(`[PaddleBillingProvider] Network timeout on attempt ${attempt}, retrying in ${attempt * 1000}ms...`);
          await new Promise((r) => setTimeout(r, attempt * 1000));
          return await createTxn(attempt + 1);
        }
        throw err;
      }
    };

    try {
      const transaction = await createTxn();

      let checkoutUrl =
        transaction.checkout?.url ||
        `${params.successUrl}?_ptxn=${transaction.id}`;

      // In sandbox, if Paddle default URL is https://localhost:3000, normalize to http:
      if (checkoutUrl.startsWith("https://localhost")) {
        checkoutUrl = checkoutUrl.replace("https://localhost", "http://localhost");
      }

      return {
        checkoutUrl,
        sessionId: transaction.id,
        transactionId: transaction.id,
      };
    } catch (error: any) {
      console.error("[PaddleBillingProvider] Error creating transaction:", error);
      throw new Error(`Paddle Transaction Creation Failed: ${error?.message || "Unknown error"}`);
    }
  }

  /**
   * Schedules subscription cancellation at the end of the current billing cycle.
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    const paddle = getPaddleInstance();
    if (!paddle) {
      console.warn("[PaddleBillingProvider] Paddle SDK not configured. Cannot cancel subscription.");
      return true;
    }

    try {
      await paddle.subscriptions.cancel(subscriptionId, {
        effectiveFrom: "next_billing_period",
      });
      return true;
    } catch (error) {
      console.error("[PaddleBillingProvider] Error canceling subscription:", error);
      return false;
    }
  }

  /**
   * Reports metered click overage.
   */
  async reportOverage(
    subscriptionId: string,
    overageUnits: number,
    costPerUnit: number
  ): Promise<void> {
    console.info(
      `[PaddleBillingProvider] Metered overage report for subscription ${subscriptionId}: ${overageUnits} units @ $${costPerUnit}`
    );
  }

  /**
   * Verifies and parses incoming webhooks from Paddle.
   */
  async handleWebhook(
    payload: unknown,
    signature: string
  ): Promise<{ event: string; orgId: string; planId?: string }> {
    let rawBody = "";
    if (typeof payload === "string") {
      rawBody = payload;
    } else {
      rawBody = JSON.stringify(payload);
    }

    const event = await verifyPaddleWebhook(rawBody, signature);
    const customData = (event.data as any)?.customData || {};

    return {
      event: event.eventType,
      orgId: customData.orgId || "default",
      planId: customData.planId,
    };
  }
}

export const paddleBillingProvider = new PaddleBillingProvider();
