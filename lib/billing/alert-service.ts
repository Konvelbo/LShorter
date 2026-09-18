// ============================================================================
// Multi-Channel Alert & Notification Dispatcher (Email + In-App Notification Center)
// ============================================================================

import { PlanType } from "@/types";
import { getPlanDefinition, calculateOverage } from "@/src/config/pricing";
import { sendQuotaAlertEmail, sendInvoiceReadyEmail } from "@/lib/resend";

export interface QuotaNotificationPayload {
  userId: string;
  orgId?: string;
  userEmail: string;
  userName?: string;
  plan: PlanType;
  clicksThisMonth: number;
}

/**
 * Evaluates current consumption and triggers in-app + email alerts if thresholds (80%, 100%, overage) are met.
 */
export async function checkAndDispatchQuotaAlerts(
  payload: QuotaNotificationPayload,
  createInAppNotification?: (notif: {
    orgId: string;
    title: string;
    message: string;
    type: "INFO" | "WARNING" | "ALERT" | "SUCCESS";
    linkUrl?: string;
  }) => Promise<any>
) {
  const { userId, orgId = userId, userEmail, userName, plan, clicksThisMonth } = payload;
  const planDef = getPlanDefinition(plan);
  const limit = planDef.limits.monthlyClicks;

  // Unlimited plans (no alerts needed)
  if (limit === -1) return { triggered: false };

  const percent = (clicksThisMonth / limit) * 100;

  // 1. Overage Case (Paid plan exceeded limit)
  if (clicksThisMonth > limit && (plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE")) {
    const overageClicks = clicksThisMonth - limit;
    const costPerBatch = plan === "ENTERPRISE" ? 0.5 : plan === "BUSINESS" ? 0.8 : 1.0;
    const overage = calculateOverage(overageClicks, 10000, costPerBatch);

    if (createInAppNotification) {
      await createInAppNotification({
        orgId,
        title: "⚡ Garantie Zéro Coupure : Overage Actif",
        message: `Votre trafic dépasse le quota mensuel (${clicksThisMonth.toLocaleString()} / ${limit.toLocaleString()} clics). Redirections 100% opérationnelles sans interruption (+${overageClicks.toLocaleString()} clics d'overage).`,
        type: "WARNING",
        linkUrl: "/dashboard/settings?tab=billing",
      });
    }

    if (userEmail) {
      await sendQuotaAlertEmail({
        to: userEmail,
        name: userName,
        plan: planDef.name,
        currentClicks: clicksThisMonth,
        limitClicks: limit,
        threshold: "OVERAGE",
        overageAmount: overage.cost,
      });
    }

    return { triggered: true, threshold: "OVERAGE", overage, overageClicks };
  }

  // 2. 100% Quota Reached Case
  if (percent >= 100) {
    if (createInAppNotification) {
      await createInAppNotification({
        orgId,
        title: "🚨 Quota Mensuel Atteint (100%)",
        message: `Vous avez consommé 100% de vos clics mensuels (${clicksThisMonth.toLocaleString()} / ${limit.toLocaleString()}). Passez au forfait supérieur pour étendre vos capacités.`,
        type: "ALERT",
        linkUrl: "/dashboard/pricing",
      });
    }

    if (userEmail) {
      await sendQuotaAlertEmail({
        to: userEmail,
        name: userName,
        plan: planDef.name,
        currentClicks: clicksThisMonth,
        limitClicks: limit,
        threshold: "100%",
      });
    }

    return { triggered: true, threshold: "100%" };
  }

  // 3. 80% Quota Warning Case
  if (percent >= 80) {
    if (createInAppNotification) {
      await createInAppNotification({
        orgId,
        title: "⚠️ Seuil d'Alerte Quota (80%)",
        message: `Vous avez consommé ${Math.round(percent)}% de vos clics mensuels (${clicksThisMonth.toLocaleString()} / ${limit.toLocaleString()}).`,
        type: "WARNING",
        linkUrl: "/dashboard/settings?tab=billing",
      });
    }

    if (userEmail) {
      await sendQuotaAlertEmail({
        to: userEmail,
        name: userName,
        plan: planDef.name,
        currentClicks: clicksThisMonth,
        limitClicks: limit,
        threshold: "80%",
      });
    }

    return { triggered: true, threshold: "80%" };
  }

  return { triggered: false };
}

/**
 * Dispatches an alert when a certified PDF invoice is generated.
 */
export async function dispatchInvoiceAvailableAlert({
  userId,
  orgId = userId,
  userEmail,
  userName,
  invoiceNumber,
  amountPaid,
  planId,
  createInAppNotification,
}: {
  userId: string;
  orgId?: string;
  userEmail: string;
  userName?: string;
  invoiceNumber: string;
  amountPaid: number;
  planId: string;
  createInAppNotification?: (notif: any) => Promise<any>;
}) {
  if (createInAppNotification) {
    await createInAppNotification({
      orgId,
      title: "📄 Nouvelle Facture Conforme Disponible",
      message: `Votre facture officielle ${invoiceNumber} d'un montant de ${amountPaid.toFixed(2)} € TTC (Forfait ${planId}) est prête au téléchargement.`,
      type: "SUCCESS",
      linkUrl: `/api/billing/invoices/${invoiceNumber}/download`,
    });
  }

  if (userEmail) {
    await sendInvoiceReadyEmail({
      to: userEmail,
      name: userName,
      invoiceNumber,
      amountPaid,
      currency: "EUR",
      downloadUrl: `${process.env.NEXTAUTH_URL || "https://lsho.cc"}/api/billing/invoices/${invoiceNumber}/download`,
    });
  }
}
