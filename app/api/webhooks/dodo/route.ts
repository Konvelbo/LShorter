import { NextRequest, NextResponse } from "next/server";
import { verifyDodoWebhook } from "@/lib/dodo/dodo-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { syncUserToCloudflare } from "@/app/actions/sync-user";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();

    const webhookId = request.headers.get("webhook-id") || "";
    const webhookSignature = request.headers.get("webhook-signature") || "";
    const webhookTimestamp = request.headers.get("webhook-timestamp") || "";

    if (!webhookSignature) {
      return NextResponse.json(
        { success: false, error: "Missing webhook-signature header" },
        { status: 400 }
      );
    }

    let event: any;
    try {
      event = await verifyDodoWebhook(rawBody, {
        "webhook-id": webhookId,
        "webhook-signature": webhookSignature,
        "webhook-timestamp": webhookTimestamp,
      });
    } catch (err: any) {
      console.error("[Dodo Webhook] Signature verification failed:", err?.message);
      return NextResponse.json(
        { success: false, error: err?.message || "Invalid signature" },
        { status: 401 }
      );
    }

    const eventType = event.type;
    const eventData = event.data || {};
    console.info(`[Dodo Webhook] Received event: ${eventType}`);

    switch (eventType) {
      case "payment.succeeded": {
        const customData = eventData.metadata || {};
        const userId = customData.userId || "";
        const orgId = customData.orgId || (userId ? `org_${userId}` : "default");
        const rawPlanId = (customData.planId || "PRO").toUpperCase();
        const planId = (
          ["PRO", "BUSINESS", "ENTERPRISE"].includes(rawPlanId) ? rawPlanId : "PRO"
        ) as "PRO" | "BUSINESS" | "ENTERPRISE";
        const cycle = ((customData.cycle || "MONTHLY") as string).toUpperCase() === "YEARLY"
          ? "YEARLY"
          : "MONTHLY";

        const customerEmail = eventData.customer?.email || customData.customerEmail || `${userId}@lshorter.local`;
        const customerName = eventData.customer?.name || "Customer";
        const paymentId = eventData.payment_id || eventData.id || `pay_${Date.now()}`;

        console.info(`[Dodo Webhook] Processing Payment Succeeded: user=${userId}, plan=${planId}, cycle=${cycle}, payment=${paymentId}`);

        // 1. Upgrade user in Convex
        if (userId) {
          try {
            await convex.mutation(api.users.updatePlan, {
              userId,
              plan: planId,
            });
          } catch (userErr) {
            console.error("[Dodo Webhook] Error updating user plan:", userErr);
          }

          // 2. Sync to Cloudflare D1 Edge database
          try {
            await syncUserToCloudflare({
              id: userId,
              email: customerEmail,
              name: customerName,
              plan: planId,
            });
          } catch (cfErr) {
            console.error("[Dodo Webhook] Error syncing to Cloudflare:", cfErr);
          }
        }

        // 3. Update organization in Convex
        try {
          await convex.mutation(api.organizations.getOrCreateUserOrganization, {
            userId: userId || orgId,
            name: orgId,
            email: customerEmail,
            plan: planId,
          });
        } catch (orgErr) {
          console.error("[Dodo Webhook] Error updating org plan:", orgErr);
        }

        // 4. Create certified invoice in Convex
        try {
          const totalAmount = typeof eventData.total_amount === "number"
            ? eventData.total_amount / 100
            : typeof eventData.amount === "number"
              ? eventData.amount / 100
              : 0;

          const invoiceNumber = `INV-DODO-${paymentId.replace(/^pay_/, "").toUpperCase()}`;
          const now = Date.now();
          const periodEnd = cycle === "YEARLY" ? now + 365 * 86400000 : now + 30 * 86400000;

          await convex.mutation(api.invoices.createInvoice, {
            orgId,
            invoiceNumber,
            planId,
            amountPaid: totalAmount,
            periodStart: now,
            periodEnd,
            currency: (eventData.currency || "USD").toUpperCase(),
            status: "PAID",
          });
        } catch (invErr) {
          console.error("[Dodo Webhook] Error creating invoice:", invErr);
        }

        // 5. Push in-app notification in Convex
        try {
          await convex.mutation(api.notifications.createNotification, {
            orgId,
            title: "Plan activé avec succès",
            message: `Votre abonnement ${planId} (${cycle === "YEARLY" ? "Annuel" : "Mensuel"}) a été activé avec succès via Dodo Payments.`,
            type: "SUCCESS",
            linkUrl: "/dashboard",
          });
        } catch (notifErr) {
          console.warn("[Dodo Webhook] Error sending notification:", notifErr);
        }

        break;
      }

      case "subscription.active":
      case "subscription.renewed": {
        const subId = eventData.subscription_id || eventData.id;
        const customData = eventData.metadata || {};
        const orgId = customData.orgId || (customData.userId ? `org_${customData.userId}` : "default");

        const periodStart = eventData.previous_billing_date
          ? new Date(eventData.previous_billing_date).getTime()
          : Date.now();
        const periodEnd = eventData.next_billing_date
          ? new Date(eventData.next_billing_date).getTime()
          : Date.now() + 30 * 86400000;

        try {
          await convex.mutation(api.subscriptions.upsertSubscription, {
            orgId,
            provider: "dodo",
            providerSubscriptionId: subId,
            currentPeriodStart: periodStart,
            currentPeriodEnd: periodEnd,
            cancelAtPeriodEnd: eventData.status === "cancelled",
            plan: customData.planId,
            cycle: customData.cycle,
          });
        } catch (subErr) {
          console.error("[Dodo Webhook] Error recording subscription:", subErr);
        }
        break;
      }

      case "subscription.cancelled":
      case "subscription.failed":
      case "subscription.expired": {
        const subId = eventData.subscription_id || eventData.id;
        try {
          await convex.mutation(api.subscriptions.markSubscriptionCanceled, {
            providerSubscriptionId: subId,
          });
        } catch (cancelErr) {
          console.error("[Dodo Webhook] Error marking subscription canceled:", cancelErr);
        }
        break;
      }

      default:
        console.info(`[Dodo Webhook] Unhandled event type ignored: ${eventType}`);
        break;
    }

    return NextResponse.json({ success: true, event: eventType });
  } catch (error: any) {
    console.error("[Dodo Webhook Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
