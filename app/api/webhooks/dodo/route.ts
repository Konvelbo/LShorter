import { NextRequest, NextResponse } from "next/server";
import { verifyDodoWebhook } from "@/lib/dodo/dodo-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { syncUserToCloudflare } from "@/app/actions/sync-user";
import { cancelReplacedSubscriptions } from "@/lib/billing/cancel-replaced-subscription";
import { normalizeGatewayAmount, formatCurrencyDisplay } from "@/lib/billing/currency";
import {
  sendGracePeriodAlertEmail,
  sendPlanPurchaseEmail,
} from "@/lib/resend";
import {
  getUserClickUsage,
  evaluateSubscriptionOverage,
  chargeSubscriptionOverage,
} from "@/lib/billing/overage-service";

const GRACE_PERIOD_MS = 24 * 60 * 60 * 1000;

function getAppUrl(): string {
  return (process.env.NEXT_PUBLIC_APP_URL || "https://lsho.cc").replace(/\/+$/, "");
}

function formatAmountFromCents(rawEventData: any): {
  amountPaid: number;
  currency: string;
} {
  // If Dodo Payments generated an official invoice with settlement currency/amount (e.g. USD 19.60),
  // prefer settlement values so stored invoices in Convex match the official Dodo invoice PDF exactly
  const hasSettlement =
    typeof rawEventData.settlement_amount === "number" &&
    rawEventData.settlement_amount > 0 &&
    Boolean(rawEventData.settlement_currency);

  const raw = hasSettlement
    ? rawEventData.settlement_amount
    : typeof rawEventData.amount_paid === "number"
      ? rawEventData.amount_paid
      : typeof rawEventData.total_amount === "number"
        ? rawEventData.total_amount
        : typeof rawEventData.amount_due === "number"
          ? rawEventData.amount_due
          : typeof rawEventData.amount === "number"
            ? rawEventData.amount
            : 0;

  const currency = String(
    (hasSettlement ? rawEventData.settlement_currency : rawEventData.currency) || "USD"
  ).toUpperCase();

  return {
    amountPaid: normalizeGatewayAmount(raw, currency),
    currency,
  };
}

async function resolveDodoContext(eventData: any) {
  const customData = eventData.metadata || {};
  const customerEmail =
    eventData.customer?.email || customData.customerEmail || "";
  const customerName = eventData.customer?.name || "Customer";

  let userId = customData.userId ? String(customData.userId) : "";
  if (!userId && customerEmail && !customerEmail.endsWith("@lshorter.local")) {
    try {
      const userDoc = await convex.query(api.users.getUserByEmail, {
        email: customerEmail.toLowerCase(),
      });
      if (userDoc?.userId) {
        userId = userDoc.userId;
      }
    } catch {
      // Safe fallback to metadata/orgId
    }
  }

  const orgId = customData.orgId
    ? String(customData.orgId)
    : userId
      ? `org_${userId}`
      : "default";

  let rawPlanId = customData.planId
    ? String(customData.planId).toUpperCase()
    : "";

  if (!rawPlanId && (userId || orgId !== "default")) {
    try {
      const existingSub = await convex.query(api.subscriptions.getSubscription, {
        orgId: userId || orgId,
      });
      if (
        existingSub?.plan &&
        existingSub.plan !== "FREE" &&
        existingSub.plan !== "FREEMIUM"
      ) {
        rawPlanId = String(existingSub.plan).toUpperCase();
      }
    } catch {
      // Ignore fallback lookup errors
    }
  }

  const planId = (
    ["PRO", "BUSINESS", "ENTERPRISE"].includes(rawPlanId) ? rawPlanId : "PRO"
  ) as "PRO" | "BUSINESS" | "ENTERPRISE";

  const cycle =
    String(customData.cycle || "MONTHLY").toUpperCase() === "YEARLY"
      ? "YEARLY"
      : "MONTHLY";

  return {
    customData,
    userId,
    orgId,
    planId,
    cycle,
    customerEmail: customerEmail || `${userId || "customer"}@lshorter.local`,
    customerName,
  };
}

async function activateGracePeriodFromDodoEvent(opts: {
  eventType: string;
  subId?: string;
  orgIdHint?: string;
  customerEmail?: string;
  customerName?: string;
}) {
  const subscriptionsApi = api.subscriptions as any;
  const appUrl = getAppUrl();

  const graceRes = await convex.mutation(
    subscriptionsApi.markSubscriptionGracePeriod,
    {
      providerSubscriptionId: opts.subId || undefined,
      orgId: opts.orgIdHint || undefined,
      gracePeriodEndsAt: Date.now() + GRACE_PERIOD_MS,
    }
  );

  if (!graceRes?.success || graceRes.alreadyInGrace) {
    return;
  }

  const planName = String(graceRes.plan || "PRO").toUpperCase();

  try {
    await convex.mutation(api.notifications.createNotification, {
      orgId: graceRes.orgId,
      title: "⚠️ Échec de renouvellement — 24h restantes",
      message: `Le renouvellement de votre abonnement ${planName} a échoué (${opts.eventType}). Il vous reste 24h pour le renouveler avant le passage au plan Freemium.`,
      type: "ALERT",
      linkUrl: "/dashboard/pricing",
    });
  } catch (notifErr) {
    console.warn("[Dodo Webhook] Grace notification error:", notifErr);
  }

  const recipientEmail =
    graceRes.userEmail ||
    (opts.customerEmail && !opts.customerEmail.endsWith("@lshorter.local")
      ? opts.customerEmail
      : "");

  if (recipientEmail) {
    await sendGracePeriodAlertEmail({
      to: recipientEmail,
      name: graceRes.userName || opts.customerName,
      plan: planName,
      renewUrl: `${appUrl}/dashboard/pricing`,
      isPaymentFailure: true,
    }).catch((mailErr) =>
      console.warn("[Dodo Webhook] Grace failure email error:", mailErr)
    );
  }
}

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
        const ctx = await resolveDodoContext(eventData);
        const { userId, orgId, planId, cycle, customerEmail, customerName } = ctx;
        const paymentId = String(eventData.payment_id || eventData.id || `pay_${Date.now()}`);

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

          // 2. Sync to Cloudflare D1 Edge database (both userId and email keys)
          try {
            await syncUserToCloudflare({
              id: userId,
              email: customerEmail,
              name: customerName,
              plan: planId,
            });
            if (
              customerEmail &&
              !customerEmail.endsWith("@lshorter.local") &&
              customerEmail !== userId
            ) {
              await syncUserToCloudflare({
                id: customerEmail,
                email: customerEmail,
                name: customerName,
                plan: planId,
              });
            }
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

        const now = Date.now();
        const periodEnd = cycle === "YEARLY" ? now + 365 * 86400000 : now + 30 * 86400000;
        const newSubId = eventData.subscription_id
          ? String(eventData.subscription_id)
          : undefined;
        let previousSubId: string | undefined = ctx.customData?.previousSubscriptionId
          ? String(ctx.customData.previousSubscriptionId)
          : undefined;
        let previousProvider: string | undefined;
        let previousPlan: string | undefined = ctx.customData?.previousPlan
          ? String(ctx.customData.previousPlan)
          : undefined;

        // 3b. Ensure active subscription period is synced when payment belongs to a subscription
        if (newSubId) {
          try {
            const upsertRes: any = await convex.mutation(
              api.subscriptions.upsertSubscription,
              {
                orgId: userId || orgId,
                provider: "dodo",
                providerSubscriptionId: newSubId,
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                cancelAtPeriodEnd: false,
                plan: planId,
                cycle,
              }
            );
            if (upsertRes?.previousSubscriptionId) {
              previousSubId = upsertRes.previousSubscriptionId;
              previousProvider = upsertRes.previousProvider;
            }
            if (upsertRes?.previousPlan) {
              previousPlan = upsertRes.previousPlan;
            }
          } catch (subSyncErr) {
            console.error("[Dodo Webhook] Error syncing subscription on payment.succeeded:", subSyncErr);
          }
        }

        // 3c. Anti-Double-Billing: Cancel any previous active subscription (e.g. PRO -> BUSINESS switch)
        if (newSubId || previousSubId) {
          try {
            await cancelReplacedSubscriptions({
              userId: userId || undefined,
              orgId: userId || orgId,
              customerEmail,
              dodoCustomerId: eventData.customer?.customer_id
                ? String(eventData.customer.customer_id)
                : undefined,
              newSubscriptionId: newSubId,
              newProvider: "dodo",
              newPlan: planId,
              previousSubscriptionId: previousSubId,
              previousProvider,
            });
          } catch (cancelPrevErr) {
            console.warn("[Dodo Webhook] Warning cancelling replaced subscription:", cancelPrevErr);
          }
        }

        const appUrl = getAppUrl();
        const { amountPaid, currency } = formatAmountFromCents(eventData);
        const invoiceNumber = eventData.invoice_id
          ? String(eventData.invoice_id)
          : `INV-DODO-${paymentId.replace(/^pay_/, "").toUpperCase()}`;
        const invoiceDownloadPath = `/api/billing/invoices/dodo_${encodeURIComponent(paymentId)}/download`;
        const invoiceFullUrl = `${appUrl}${invoiceDownloadPath}`;

        const isRenewal = eventData.charge_type === "renewal";
        let overageCharged = false;
        let overageAmount = 0;
        let overageBatches = 0;
        let overageClicksCount = 0;

        // 3d. Overage Reconciliation & Automated Dodo Payments Charge on Renewal
        if (isRenewal && newSubId) {
          try {
            const clicks = await getUserClickUsage(userId || orgId, customerEmail);
            const evalRes = evaluateSubscriptionOverage(planId, clicks);

            if (evalRes.cost > 0 && evalRes.batches > 0) {
              const chargeRes = await chargeSubscriptionOverage({
                subscriptionId: newSubId,
                orgId: userId || orgId,
                userId: userId || undefined,
                planId,
                clicksThisMonth: clicks,
                currency,
                periodStart: now,
              });

              if (chargeRes.charged) {
                overageCharged = true;
                overageAmount = chargeRes.amount;
                overageBatches = chargeRes.batches;
                overageClicksCount = chargeRes.overageClicks;
              }
            }
          } catch (overageErr) {
            console.warn("[Dodo Webhook] Warning evaluating renewal overage:", overageErr);
          }
        }

        const totalCharged = amountPaid + overageAmount;

        // 4. Create certified invoice in Convex
        try {
          await convex.mutation(api.invoices.createInvoice, {
            orgId: userId || orgId,
            invoiceNumber,
            planId,
            amountPaid: totalCharged,
            periodStart: now,
            periodEnd,
            currency,
            status: "PAID",
            pdfUrl: invoiceDownloadPath,
            overageAmount: overageCharged ? overageAmount : undefined,
            batchesOverage: overageCharged ? overageBatches : undefined,
          });
        } catch (invErr) {
          console.error("[Dodo Webhook] Error creating invoice:", invErr);
        }

        // 5. Push in-app notification in Convex (Informing user of renewal + overage fees)
        try {
          if (isRenewal && overageCharged) {
            await convex.mutation(api.notifications.createNotification, {
              orgId: userId || orgId,
              title: "Abonnement renouvelé avec succès (Overage inclus)",
              message: `Votre abonnement ${planId} a été renouvelé avec succès. Des frais d'overage de $${overageAmount.toFixed(2)} ont été prélevés pour ${overageBatches} lot(s) (+${overageClicksCount.toLocaleString()} clics excédentaires). Redirections 100% actives sans coupure. Facture ${invoiceNumber} disponible.`,
              type: "SUCCESS",
              linkUrl: "/dashboard/settings?tab=billing",
            });
          } else {
            await convex.mutation(api.notifications.createNotification, {
              orgId: userId || orgId,
              title: isRenewal ? "Abonnement renouvelé avec succès" : "Plan activé avec succès",
              message: isRenewal
                ? `Votre abonnement ${planId} (${cycle === "YEARLY" ? "Annuel" : "Mensuel"}) a été renouvelé avec succès via Dodo Payments. Facture ${invoiceNumber} disponible.`
                : `Votre abonnement ${planId} (${cycle === "YEARLY" ? "Annuel" : "Mensuel"}) a été activé avec succès via Dodo Payments. Facture ${invoiceNumber} disponible.`,
              type: "SUCCESS",
              linkUrl: "/dashboard/settings?tab=billing",
            });
          }
        } catch (notifErr) {
          console.warn("[Dodo Webhook] Error sending notification:", notifErr);
        }

        // 6. Send branded activation & official invoice email via Resend
        if (customerEmail && !customerEmail.endsWith("@lshorter.local")) {
          try {
            const startDateStr = new Date(now).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });
            const endDateStr = new Date(periodEnd).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            });

            await sendPlanPurchaseEmail({
              to: customerEmail,
              name: customerName,
              planName: planId,
              startDate: startDateStr,
              endDate: endDateStr,
              cycle: cycle === "YEARLY" ? "Annuel" : "Mensuel",
              invoiceNumber,
              invoiceUrl: invoiceFullUrl,
              amountPaidLabel: totalCharged > 0 ? formatCurrencyDisplay(totalCharged, currency) : undefined,
              isRenewal,
              overageDetails: overageCharged
                ? {
                    overageClicks: overageClicksCount,
                    batches: overageBatches,
                    cost: overageAmount,
                    baseAmount: amountPaid,
                    totalAmount: totalCharged,
                  }
                : undefined,
            });
            console.info(`[Dodo Webhook] Plan purchase email sent successfully to ${customerEmail}`);
          } catch (emailErr) {
            console.warn("[Dodo Webhook] Error sending purchase email:", emailErr);
          }
        }

        break;
      }

      case "invoice.finalized":
      case "invoice.paid": {
        const ctx = await resolveDodoContext(eventData);
        const paymentId = eventData.payment_id ? String(eventData.payment_id) : "";
        const rawInvId =
          eventData.invoice_id || eventData.invoice_number || eventData.id || "";
        const invoiceNumber = rawInvId
          ? String(rawInvId)
          : paymentId
            ? `INV-DODO-${paymentId.replace(/^pay_/, "").toUpperCase()}`
            : `INV-DODO-${Date.now()}`;
        const { amountPaid, currency } = formatAmountFromCents(eventData);
        const now = Date.now();
        const periodEnd =
          ctx.cycle === "YEARLY" ? now + 365 * 86400000 : now + 30 * 86400000;
        const pdfPath = paymentId
          ? `/api/billing/invoices/dodo_${encodeURIComponent(paymentId)}/download`
          : typeof eventData.invoice_url === "string" && eventData.invoice_url
            ? eventData.invoice_url
            : typeof eventData.pdf_url === "string" && eventData.pdf_url
              ? eventData.pdf_url
              : undefined;

        if (ctx.userId || ctx.orgId !== "default") {
          try {
            await convex.mutation(api.invoices.createInvoice, {
              orgId: ctx.userId || ctx.orgId,
              invoiceNumber,
              planId: ctx.planId,
              amountPaid,
              periodStart: now,
              periodEnd,
              currency,
              status: eventType === "invoice.paid" ? "PAID" : "OPEN",
              pdfUrl: pdfPath,
            });
          } catch (invErr) {
            console.error(`[Dodo Webhook] Error syncing ${eventType}:`, invErr);
          }
        }
        break;
      }

      case "subscription.active":
      case "subscription.renewed": {
        const subId = eventData.subscription_id || eventData.id;
        const customData = eventData.metadata || {};
        const userId = customData.userId || "";
        const orgId = userId || customData.orgId || "default";

        const parsedStart = eventData.previous_billing_date
          ? new Date(eventData.previous_billing_date).getTime()
          : NaN;
        const parsedEnd = eventData.next_billing_date
          ? new Date(eventData.next_billing_date).getTime()
          : NaN;
        const periodStart = Number.isNaN(parsedStart) ? Date.now() : parsedStart;
        const periodEnd = Number.isNaN(parsedEnd)
          ? Date.now() + 30 * 86400000
          : parsedEnd;

        let resolvedPlan = customData.planId
          ? String(customData.planId).toUpperCase()
          : undefined;
        let resolvedCycle = customData.cycle
          ? String(customData.cycle).toUpperCase()
          : undefined;

        try {
          const existingSub =
            orgId !== "default"
              ? await convex
                  .query(api.subscriptions.getSubscription, { orgId })
                  .catch(() => null)
              : null;

          // Guard against a stale renewal or delayed active event from an older replaced subscription
          const isStaleEventForDifferentSub =
            existingSub?.providerSubscriptionId &&
            existingSub.providerSubscriptionId !== subId &&
            !existingSub.providerSubscriptionId.startsWith("sub_manual_") &&
            customData.previousSubscriptionId !== existingSub.providerSubscriptionId &&
            (eventType === "subscription.renewed" ||
              Boolean(eventData.cancel_at_next_billing_date) ||
              eventData.status === "cancelled");

          if (isStaleEventForDifferentSub) {
            console.warn(
              `[Dodo Webhook] Ignoring & cancelling stale ${eventType} from replaced subscription ${subId} (active is ${existingSub.providerSubscriptionId})`
            );
            await cancelReplacedSubscriptions({
              userId: userId || undefined,
              orgId,
              newSubscriptionId: existingSub.providerSubscriptionId,
              newProvider: "dodo",
              newPlan: existingSub.plan || "BUSINESS",
              previousSubscriptionId: String(subId),
              previousProvider: "dodo",
            });
            break;
          }

          if (!resolvedPlan && existingSub) {
            if (existingSub?.plan && existingSub.plan !== "FREE" && existingSub.plan !== "FREEMIUM") {
              resolvedPlan = String(existingSub.plan).toUpperCase();
            }
            if (!resolvedCycle && existingSub?.cycle) {
              resolvedCycle = String(existingSub.cycle).toUpperCase();
            }
          }

          const activePlan = (
            ["PRO", "BUSINESS", "ENTERPRISE"].includes(resolvedPlan || "")
              ? resolvedPlan
              : "PRO"
          ) as "PRO" | "BUSINESS" | "ENTERPRISE";

          const upsertRes: any = await convex.mutation(
            api.subscriptions.upsertSubscription,
            {
              orgId,
              provider: "dodo",
              providerSubscriptionId: subId,
              currentPeriodStart: periodStart,
              currentPeriodEnd: periodEnd,
              cancelAtPeriodEnd:
                Boolean(eventData.cancel_at_next_billing_date) ||
                eventData.status === "cancelled",
              plan: activePlan,
              cycle: resolvedCycle || "MONTHLY",
            }
          );

          // Anti-Double-Billing: Cancel any previous subscription replaced by this active subscription
          if (eventType === "subscription.active" && subId) {
            const prevSubId =
              upsertRes?.previousSubscriptionId ||
              (customData.previousSubscriptionId
                ? String(customData.previousSubscriptionId)
                : undefined);
            await cancelReplacedSubscriptions({
              userId: userId || undefined,
              orgId,
              customerEmail:
                eventData.customer?.email || customData.customerEmail || undefined,
              dodoCustomerId: eventData.customer?.customer_id
                ? String(eventData.customer.customer_id)
                : undefined,
              newSubscriptionId: String(subId),
              newProvider: "dodo",
              newPlan: activePlan,
              previousSubscriptionId: prevSubId,
              previousProvider: upsertRes?.previousProvider,
            }).catch((err) =>
              console.warn("[Dodo Webhook] Warning cancelling replaced subscription on active:", err)
            );
          }

          if (userId) {
            await convex
              .mutation(api.users.updatePlan, { userId, plan: activePlan })
              .catch(() => {});
            const customerEmail =
              eventData.customer?.email ||
              customData.customerEmail ||
              `${userId}@lshorter.local`;
            const customerName = eventData.customer?.name || "Customer";
            await syncUserToCloudflare({
              id: userId,
              email: customerEmail,
              name: customerName,
              plan: activePlan,
            }).catch(() => {});
          }

          if (eventType === "subscription.renewed" && orgId !== "default") {
            await convex
              .mutation(api.notifications.createNotification, {
                orgId,
                title: "Abonnement renouvelé avec succès",
                message: `Votre forfait ${activePlan} a été automatiquement renouvelé via Dodo Payments.`,
                type: "SUCCESS",
                linkUrl: "/dashboard/settings?tab=billing",
              })
              .catch(() => {});
          }
        } catch (subErr) {
          console.error("[Dodo Webhook] Error recording subscription:", subErr);
        }
        break;
      }

      case "subscription.cancelled": {
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

      case "payment.failed": {
        const subId = eventData.subscription_id
          ? String(eventData.subscription_id)
          : "";
        if (!subId) {
          // One-time abandoned checkout without an active subscription: do not trigger grace period
          break;
        }
        const ctx = await resolveDodoContext(eventData);
        await activateGracePeriodFromDodoEvent({
          eventType,
          subId,
          orgIdHint: ctx.userId || (ctx.orgId !== "default" ? ctx.orgId : undefined),
          customerEmail: ctx.customerEmail,
          customerName: ctx.customerName,
        });
        break;
      }

      case "subscription.failed":
      case "subscription.on_hold":
      case "subscription.past_due":
      case "subscription.expired":
      case "dunning.started":
      case "invoice.payment_failed":
      case "invoice.past_due":
      case "invoice.marked_uncollectible": {
        const subId =
          eventType.startsWith("subscription.")
            ? String(eventData.subscription_id || eventData.id || "")
            : String(eventData.subscription_id || "");
        if (!subId) {
          break;
        }
        const ctx = await resolveDodoContext(eventData);
        await activateGracePeriodFromDodoEvent({
          eventType,
          subId,
          orgIdHint: ctx.userId || (ctx.orgId !== "default" ? ctx.orgId : undefined),
          customerEmail: ctx.customerEmail,
          customerName: ctx.customerName,
        });
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
