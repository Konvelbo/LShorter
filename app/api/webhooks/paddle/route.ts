import { NextRequest, NextResponse } from "next/server";
import { EventName } from "@paddle/paddle-node-sdk";
import { verifyPaddleWebhook } from "@/lib/paddle/paddle-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { syncUserToCloudflare } from "@/app/actions/sync-user";


export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("paddle-signature") || "";

    if (!signature) {
      return NextResponse.json(
        { success: false, error: "Missing paddle-signature header" },
        { status: 400 }
      );
    }

    let event: any;
    try {
      event = await verifyPaddleWebhook(rawBody, signature);
    } catch (err: any) {
      console.error("[Paddle Webhook] Signature verification failed:", err?.message);
      return NextResponse.json(
        { success: false, error: "Invalid signature" },
        { status: 401 }
      );
    }

    const eventType = event.eventType;
    console.info(`[Paddle Webhook] Received event: ${eventType}`);

    switch (eventType) {
      case EventName.TransactionCompleted:
      case EventName.TransactionPaid: {
        const transaction = event.data;
        const customData = (transaction.customData as any) || {};
        const userId = customData.userId || "";
        const orgId = customData.orgId || (userId ? `org_${userId}` : "default");
        const rawPlanId = (customData.planId || "PRO").toUpperCase();
        const planId = (
          ["PRO", "BUSINESS", "ENTERPRISE"].includes(rawPlanId) ? rawPlanId : "PRO"
        ) as "PRO" | "BUSINESS" | "ENTERPRISE";
        const cycle = ((customData.cycle || "MONTHLY") as string).toUpperCase() === "YEARLY"
          ? "YEARLY"
          : "MONTHLY";

        console.info(`[Paddle Webhook] Processing Transaction Completed: user=${userId}, plan=${planId}, cycle=${cycle}`);

        // 1. Upgrade user in Convex
        if (userId) {
          try {
            await convex.mutation(api.users.updatePlan, {
              userId,
              plan: planId,
            });
          } catch (userErr) {
            console.error("[Paddle Webhook] Error updating user plan:", userErr);
          }

          // 2. Sync to Cloudflare D1
          try {
            await syncUserToCloudflare({
              id: userId,
              email: transaction.customer?.email || `${userId}@lshorter.local`,
              name: transaction.customer?.name || "Customer",
              plan: planId,
            });
          } catch (cfErr) {
            console.error("[Paddle Webhook] Error syncing to Cloudflare:", cfErr);
          }
        }

        // 3. Update organization in Convex
        try {
          await convex.mutation(api.organizations.getOrCreateUserOrganization, {
            userId: userId || orgId,
            name: orgId,
            email: transaction.customer?.email || "",
            plan: planId,
          });
        } catch (orgErr) {
          console.error("[Paddle Webhook] Error updating org plan:", orgErr);
        }

        // 4. Create certified invoice in Convex
        try {
          const totalAmount = transaction.details?.totals?.total
            ? parseFloat(transaction.details.totals.total) / 100
            : 0;
          const invoiceNumber = `INV-${transaction.id.replace(/^txn_/, "").toUpperCase()}`;
          const now = Date.now();
          const periodEnd = cycle === "YEARLY" ? now + 365 * 86400000 : now + 30 * 86400000;

          await convex.mutation(api.invoices.createInvoice, {
            orgId,
            invoiceNumber,
            planId,
            amountPaid: totalAmount,
            periodStart: now,
            periodEnd,
            currency: transaction.currencyCode || "USD",
            status: "PAID",
          });
        } catch (invErr) {
          console.error("[Paddle Webhook] Error creating invoice:", invErr);
        }

        // 5. Paddle handles customer receipt and certified PDF invoice delivery natively

        // 6. Push in-app notification
        try {
          await convex.mutation(api.notifications.createNotification, {
            orgId,
            title: "Plan activé avec succès",
            message: `Votre abonnement ${planId} (${cycle === "YEARLY" ? "Annuel" : "Mensuel"}) a été activé avec succès via Paddle.`,
            type: "SUCCESS",
            linkUrl: "/dashboard",
          });
        } catch (notifErr) {
          console.warn("[Paddle Webhook] Error sending notification:", notifErr);
        }

        break;
      }

      case EventName.SubscriptionCreated:
      case EventName.SubscriptionUpdated: {
        const sub = event.data;
        const customData = (sub.customData as any) || {};
        const orgId = customData.orgId || (customData.userId ? `org_${customData.userId}` : "default");

        try {
          await convex.mutation(api.subscriptions.upsertSubscription, {
            orgId,
            provider: "paddle",
            providerSubscriptionId: sub.id,
            currentPeriodStart: sub.currentBillingPeriod?.startsAt
              ? new Date(sub.currentBillingPeriod.startsAt).getTime()
              : Date.now(),
            currentPeriodEnd: sub.currentBillingPeriod?.endsAt
              ? new Date(sub.currentBillingPeriod.endsAt).getTime()
              : Date.now() + 30 * 86400000,
            cancelAtPeriodEnd: sub.scheduledChange?.action === "cancel",
            plan: customData.planId,
            cycle: customData.cycle,
          });
        } catch (subErr) {
          console.error("[Paddle Webhook] Error recording subscription:", subErr);
        }
        break;
      }

      case EventName.SubscriptionCanceled: {
        const sub = event.data;
        try {
          await convex.mutation(api.subscriptions.markSubscriptionCanceled, {
            providerSubscriptionId: sub.id,
          });
        } catch (cancelErr) {
          console.error("[Paddle Webhook] Error marking subscription canceled:", cancelErr);
        }
        break;
      }

      default:
        console.info(`[Paddle Webhook] Unhandled event type ignored: ${eventType}`);
        break;
    }

    return NextResponse.json({ success: true, event: eventType });
  } catch (error: any) {
    console.error("[Paddle Webhook Error]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Webhook processing error" },
      { status: 500 }
    );
  }
}
