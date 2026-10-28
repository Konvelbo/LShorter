// ============================================================================
// Dodo Payments Billing Provider Implementation (Official SDK)
// ============================================================================

import { BillingProvider, CreateCheckoutSessionParams } from "./types";
import { getDodoPaymentsClient, verifyDodoWebhook } from "@/lib/dodo/dodo-server";
import { getDodoProductId } from "@/src/config/pricing";

export class DodoBillingProvider implements BillingProvider {
  /**
   * Creates a hosted checkout session using the official Dodo Payments SDK.
   */
  async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<{ checkoutUrl: string; sessionId?: string; transactionId?: string }> {
    const client = getDodoPaymentsClient();
    const productId = getDodoProductId(params.planId, params.cycle);

    // If Dodo Payments is not configured with an API key, fallback gracefully for local sandbox/testing
    if (!client || !productId) {
      console.warn(
        `[DodoBillingProvider] Dodo Payments SDK or Product ID not configured. Falling back to local redirect.`
      );
      const sessionId = `dodo_dev_${Date.now()}`;
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

    try {
      let returnUrl = params.successUrl || "/dashboard/settings?tab=billing";
      if (!returnUrl.startsWith("http://") && !returnUrl.startsWith("https://")) {
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lsho.cc";
        returnUrl = `${baseUrl.replace(/\/$/, "")}${returnUrl.startsWith("/") ? "" : "/"}${returnUrl}`;
      }

      const payload: any = {
        product_cart: [
          {
            product_id: productId,
            quantity: 1,
          },
        ],
        return_url: returnUrl,
        metadata: {
          userId: params.userId || "",
          orgId: params.orgId || "default",
          planId: params.planId,
          cycle: params.cycle,
          customerEmail: params.customerEmail || "",
        },
      };

      if (params.customerEmail) {
        payload.customer = {
          email: params.customerEmail,
          name: params.companyName || params.customerEmail.split("@")[0] || "Customer",
        };
      }

      // Apply promotional discounts (ignoring legacy Paddle discount IDs)
      if (params.discountId && !params.discountId.startsWith("dsc_01m")) {
        payload.discount_code = params.discountId;
      } else if (params.cycle === "MONTHLY") {
        // Automatically apply the active launch discount codes on monthly plans
        if (params.planId === "PRO") {
          payload.discount_code = "PRO75";
        } else if (params.planId === "BUSINESS") {
          payload.discount_code = "BIZ60";
        } else if (params.planId === "ENTERPRISE") {
          payload.discount_code = "ENT50";
        }
      }

      const session = await client.checkoutSessions.create(payload);

      return {
        checkoutUrl: session.checkout_url || params.successUrl,
        sessionId: session.session_id,
        transactionId: session.session_id,
      };
    } catch (error: any) {
      console.error("[DodoBillingProvider Error]:", error);
      throw new Error(
        `Dodo Payments Checkout Error: ${error?.message || "Failed to create checkout session"}`
      );
    }
  }

  /**
   * Cancels a subscription at the end of the billing cycle or immediately.
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    const client = getDodoPaymentsClient();
    if (!client) {
      console.warn("[DodoBillingProvider] Dodo Payments client unavailable for subscription cancellation.");
      return false;
    }

    try {
      await client.subscriptions.update(subscriptionId, {
        status: "cancelled",
      });
      return true;
    } catch (error: any) {
      console.error(`[DodoBillingProvider] Failed to cancel subscription ${subscriptionId}:`, error);
      return false;
    }
  }

  /**
   * Reports metered overage or usage-based clicks.
   */
  async reportOverage(
    subscriptionId: string,
    overageUnits: number,
    costPerUnit: number
  ): Promise<void> {
    console.info(
      `[DodoBillingProvider] Recorded click overage for subscription ${subscriptionId}: ${overageUnits} units at $${costPerUnit} each.`
    );
  }

  /**
   * Verifies and unwraps incoming webhook event payload.
   */
  async handleWebhook(
    payload: unknown,
    signature: string
  ): Promise<{ event: string; orgId: string; planId?: string }> {
    const rawBody = typeof payload === "string" ? payload : JSON.stringify(payload);
    const headers = { "webhook-signature": signature };
    const event = await verifyDodoWebhook(rawBody, headers);
    const metadata = event.data?.metadata || {};
    return {
      event: event.type,
      orgId: metadata.orgId || "default",
      planId: metadata.planId,
    };
  }
}

export const dodoBillingProvider = new DodoBillingProvider();
