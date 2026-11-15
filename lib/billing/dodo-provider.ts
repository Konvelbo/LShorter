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

    if (!client) {
      throw new Error(
        "Clé d'API Dodo Payments non configurée (DODO_PAYMENTS_API_KEY). Veuillez renseigner votre clé API sur votre hébergeur (Vercel/Cloudflare)."
      );
    }

    if (!productId) {
      throw new Error(
        `Identifiant de produit Dodo Payments introuvable pour le plan ${params.planId} (${params.cycle}).`
      );
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
          ...(params.previousSubscriptionId
            ? { previousSubscriptionId: params.previousSubscriptionId }
            : {}),
          ...(params.previousPlan
            ? { previousPlan: params.previousPlan }
            : {}),
        },
      };

      if (params.customerEmail) {
        payload.customer = {
          email: params.customerEmail,
          name: params.companyName || params.customerEmail.split("@")[0] || "Customer",
        };
      }

      // Apply promotional discounts
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

      let session: any;
      try {
        session = await client.checkoutSessions.create(payload);
      } catch (err: any) {
        if (payload.discount_code) {
          console.warn("[DodoBillingProvider] Retrying checkout creation without discount_code:", err?.message);
          delete payload.discount_code;
          session = await client.checkoutSessions.create(payload);
        } else {
          throw err;
        }
      }

      if (!session || !session.checkout_url) {
        throw new Error(
          "Dodo Payments n'a pas retourné d'URL de redirection valide (checkout_url manquant)."
        );
      }

      return {
        checkoutUrl: session.checkout_url,
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
   * Schedules subscription cancellation at the end of the current billing period.
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    const client = getDodoPaymentsClient();
    if (!client) {
      console.warn("[DodoBillingProvider] Dodo Payments client unavailable for subscription cancellation.");
      return false;
    }

    try {
      await client.subscriptions.update(subscriptionId, {
        cancel_at_next_billing_date: true,
      });
      return true;
    } catch (error: any) {
      console.error(`[DodoBillingProvider] Failed to cancel subscription ${subscriptionId}:`, error);
      return false;
    }
  }

  /**
   * Re-enables auto-renewal on a Dodo subscription scheduled to cancel at period end.
   */
  async resumeSubscription(subscriptionId: string): Promise<boolean> {
    const client = getDodoPaymentsClient();
    if (!client) {
      console.warn("[DodoBillingProvider] Dodo Payments client unavailable for subscription resumption.");
      return false;
    }

    try {
      await client.subscriptions.update(subscriptionId, {
        cancel_at_next_billing_date: false,
      });
      return true;
    } catch (error: any) {
      console.error(`[DodoBillingProvider] Failed to resume subscription ${subscriptionId}:`, error);
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
