// ============================================================================
// Anti-Double-Billing: Automatic Cancellation of Replaced Subscriptions
// ============================================================================

import { getDodoPaymentsClient } from "@/lib/dodo/dodo-server";

export interface CancelReplacedSubscriptionsInput {
  userId?: string;
  orgId?: string;
  customerEmail?: string;
  dodoCustomerId?: string;
  newSubscriptionId?: string;
  newProvider?: string;
  newPlan: string;
  previousSubscriptionId?: string | null;
  previousProvider?: string | null;
}

/**
 * Ensures that when a user upgrades or switches plans (e.g. PRO -> BUSINESS,
 * or MONTHLY -> YEARLY), any previous active subscription on Dodo Payments
 * is immediately cancelled so the customer is never double-billed.
 */
export async function cancelReplacedSubscriptions(
  input: CancelReplacedSubscriptionsInput
): Promise<{ cancelledSubscriptionIds: string[] }> {
  const cancelledIds = new Set<string>();
  const newSubId = input.newSubscriptionId ? String(input.newSubscriptionId).trim() : "";
  const prevSubId = input.previousSubscriptionId ? String(input.previousSubscriptionId).trim() : "";
  const cleanEmail = (input.customerEmail || "").toLowerCase().trim();
  const isValidRealEmail = Boolean(cleanEmail && !cleanEmail.endsWith("@lshorter.local"));
  const reasonComment = `Automatically cancelled upon plan switch/upgrade to ${input.newPlan}${
    newSubId ? ` (replaced by ${newSubId})` : ""
  }`;

  const dodoClient = getDodoPaymentsClient();

  const cancelDodoSub = async (subId: string): Promise<boolean> => {
    const cleanId = subId.trim();
    if (
      !cleanId ||
      cleanId === newSubId ||
      cleanId.startsWith("sub_manual_") ||
      cancelledIds.has(cleanId) ||
      !dodoClient
    ) {
      return false;
    }

    try {
      await dodoClient.subscriptions.update(cleanId, {
        status: "cancelled",
        cancel_reason: "cancelled_by_merchant",
        cancellation_comment: reasonComment,
      });
      cancelledIds.add(cleanId);
      console.info(
        `[Anti-Double-Billing] Immediately cancelled previous Dodo subscription ${cleanId} (${reasonComment})`
      );
      return true;
    } catch (immediateErr: any) {
      try {
        await dodoClient.subscriptions.update(cleanId, {
          cancel_at_next_billing_date: true,
          cancellation_comment: reasonComment,
        });
        cancelledIds.add(cleanId);
        console.info(
          `[Anti-Double-Billing] Scheduled cancel_at_next_billing_date for previous Dodo subscription ${cleanId}`
        );
        return true;
      } catch (fallbackErr: any) {
        console.warn(
          `[Anti-Double-Billing] Dodo cancellation skipped/failed for ${cleanId}:`,
          fallbackErr?.message || immediateErr?.message
        );
        return false;
      }
    }
  };

  // 1. Cancel explicit previousSubscriptionId recorded in Convex or checkout metadata
  if (prevSubId && prevSubId !== newSubId && !prevSubId.startsWith("sub_manual_")) {
    await cancelDodoSub(prevSubId);
  }

  // 2. Scan Dodo Payments for any other concurrent active subscriptions for this customer/user
  //    (Only run full scan when newSubId is known so we never cancel the newly created subscription)
  if (dodoClient && newSubId) {
    try {
      const dodoCustomerIds = new Set<string>();
      if (input.dodoCustomerId) {
        dodoCustomerIds.add(input.dodoCustomerId);
      }

      if (isValidRealEmail) {
        try {
          for await (const cust of dodoClient.customers.list({
            email: cleanEmail,
            page_size: 10,
          })) {
            if (cust.customer_id) {
              dodoCustomerIds.add(cust.customer_id);
            }
          }
        } catch {
          // Safe fallback if customer list fails
        }
      }

      for (const custId of dodoCustomerIds) {
        for await (const sub of dodoClient.subscriptions.list({
          customer_id: custId,
          page_size: 25,
        })) {
          if (
            sub.subscription_id &&
            sub.subscription_id !== newSubId &&
            (sub.status === "active" ||
              sub.status === "on_hold" ||
              sub.status === "past_due") &&
            !sub.cancel_at_next_billing_date
          ) {
            await cancelDodoSub(sub.subscription_id);
          }
        }
      }

      // Also check active subscriptions matching userId or customerEmail
      if (input.userId || isValidRealEmail) {
        const activePage = await dodoClient.subscriptions.list({
          status: "active",
          page_size: 50,
        });
        const items = (activePage as any)?.items || [];
        for (const sub of items) {
          if (!sub?.subscription_id || sub.subscription_id === newSubId) continue;
          const subUserId = sub.metadata?.userId ? String(sub.metadata.userId).trim() : "";
          const subEmail = sub.customer?.email
            ? String(sub.customer.email).toLowerCase().trim()
            : "";

          const matchesUser = Boolean(input.userId && subUserId && subUserId === input.userId);
          const matchesEmail = Boolean(isValidRealEmail && subEmail && subEmail === cleanEmail);

          if (matchesUser || matchesEmail) {
            await cancelDodoSub(sub.subscription_id);
          }
        }
      }
    } catch (dodoScanErr: any) {
      console.warn(
        "[Anti-Double-Billing] Dodo active subscriptions scan warning:",
        dodoScanErr?.message
      );
    }
  }

  return {
    cancelledSubscriptionIds: Array.from(cancelledIds),
  };
}
