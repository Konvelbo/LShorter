// ============================================================================
// Overage Service — Usage Retrieval & Dodo Payments Subscription Charges
// ============================================================================

import { getDodoPaymentsClient } from "@/lib/dodo/dodo-server";
import { WORKER_URL, FRONTEND_SECRET, CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN } from "@/lib/backend-config";
import { evaluateClickQuotaAndOverage, getPlanDefinition, calculateOverage } from "@/src/config/pricing";

export interface OverageEvaluation {
  planId: string;
  planName: string;
  monthlyLimit: number;
  clicksThisMonth: number;
  isOverQuota: boolean;
  isBlocked: boolean;
  overageClicks: number;
  batches: number;
  cost: number;
  batchSize: number;
  costPerBatch: number;
  unlimitedOverage: boolean;
}

/**
 * Fetch current click usage for a given user from Cloudflare D1 Edge Worker.
 */
export async function getUserClickUsage(
  userId: string,
  userEmail?: string
): Promise<number> {
  const targetId = userId ? userId.replace(/^org_/, "") : "";
  if (!targetId && !userEmail) return 0;

  try {
    const workerHeaders: Record<string, string> = {
      "X-Frontend-Secret": FRONTEND_SECRET,
      Authorization: `Bearer ${FRONTEND_SECRET}`,
    };
    if (targetId) workerHeaders["X-User-Id"] = targetId;
    if (userEmail) workerHeaders["X-User-Email"] = userEmail;

    const res = await fetch(`${WORKER_URL}/api/v1/users/me`, {
      headers: workerHeaders,
      cache: "no-store",
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.data) {
        return Number(json.data.clicksThisMonth || 0);
      }
    }
  } catch (err: any) {
    console.warn(`[OverageService] Worker fetch failed for user ${targetId}:`, err?.message);
  }

  // Fallback: Direct Cloudflare D1 REST API query if credentials are set
  if (CF_ACCOUNT_ID && CF_D1_DATABASE_ID && CF_API_TOKEN && targetId) {
    try {
      const d1Url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`;
      const queryRes = await fetch(d1Url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CF_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: "SELECT COALESCE(SUM(clicks_count), 0) as totalClicks FROM links WHERE user_id = ?",
          params: [targetId],
        }),
      });

      if (queryRes.ok) {
        const queryJson = await queryRes.json();
        const results = queryJson.result?.[0]?.results;
        if (results && results.length > 0) {
          return Number(results[0].totalClicks || 0);
        }
      }
    } catch (d1Err: any) {
      console.warn(`[OverageService] Direct D1 fallback failed for ${targetId}:`, d1Err?.message);
    }
  }

  return 0;
}

/**
 * Evaluates overage status and computes batches and cost for any plan.
 */
export function evaluateSubscriptionOverage(
  planId: string | undefined,
  clicksThisMonth: number
): OverageEvaluation {
  const status = evaluateClickQuotaAndOverage(planId, clicksThisMonth);
  return {
    planId: status.planId,
    planName: status.planName,
    monthlyLimit: status.monthlyClicksLimit,
    clicksThisMonth,
    isOverQuota: status.isOverQuota,
    isBlocked: status.isBlocked,
    overageClicks: status.overage.overageClicks,
    batches: status.overage.batches,
    cost: status.overage.estimatedCost,
    batchSize: status.overage.batchSize,
    costPerBatch: status.overage.costPerBatch,
    unlimitedOverage: Boolean(status.overage.unlimited),
  };
}

/**
 * Charges the accumulated overage fees on an active Dodo Payments subscription.
 * Only applies to plans with overage allowed and non-zero cost (Pro, Business).
 * Enterprise is unlimited free overage ($0 extra).
 */
export async function chargeSubscriptionOverage(params: {
  subscriptionId: string;
  orgId: string;
  userId?: string;
  planId: string;
  clicksThisMonth: number;
  currency?: string;
  periodStart?: number;
}): Promise<{
  success: boolean;
  charged: boolean;
  amount: number;
  batches: number;
  overageClicks: number;
  paymentId?: string;
  error?: string;
}> {
  const normPlan = (params.planId || "PRO").toUpperCase();

  // Enterprise has unlimited free overage (0$ extra)
  if (normPlan === "ENTERPRISE") {
    return {
      success: true,
      charged: false,
      amount: 0,
      batches: 0,
      overageClicks: 0,
    };
  }

  // Free / Starter has no overage allowed (traffic blocked at 10k clicks)
  if (normPlan === "FREE" || normPlan === "FREEMIUM" || normPlan === "STARTER") {
    return {
      success: true,
      charged: false,
      amount: 0,
      batches: 0,
      overageClicks: 0,
    };
  }

  const evaluation = evaluateSubscriptionOverage(normPlan, params.clicksThisMonth);

  if (evaluation.cost <= 0 || evaluation.batches <= 0) {
    return {
      success: true,
      charged: false,
      amount: 0,
      batches: 0,
      overageClicks: evaluation.overageClicks,
    };
  }

  const client = getDodoPaymentsClient();
  if (!client) {
    console.warn("[OverageService] Dodo Payments client unavailable for overage charge.");
    return {
      success: false,
      charged: false,
      amount: evaluation.cost,
      batches: evaluation.batches,
      overageClicks: evaluation.overageClicks,
      error: "DODO_PAYMENTS_API_KEY non configurée",
    };
  }

  try {
    const costCents = Math.round(evaluation.cost * 100);
    const currency = (params.currency || "USD").toUpperCase();

    console.info(
      `[OverageService] Charging overage on sub ${params.subscriptionId}: ${evaluation.batches} batch(es), ${evaluation.overageClicks} extra clicks, total $${evaluation.cost}`
    );

    const chargeResponse = await client.subscriptions.charge(params.subscriptionId, {
      product_price: costCents,
      product_currency: currency as any,
      product_description: `LShorter Overage: ${evaluation.batches} lot(s) (${evaluation.overageClicks.toLocaleString("en-US")} clics supp. sur forfait ${evaluation.planName})`,
      metadata: {
        orgId: params.orgId,
        userId: params.userId || "",
        planId: normPlan,
        type: "overage_charge",
        batches: String(evaluation.batches),
        overageClicks: String(evaluation.overageClicks),
        periodStart: String(params.periodStart || Date.now()),
      },
    });

    const paymentId = (chargeResponse as any)?.payment_id || (chargeResponse as any)?.id;

    console.info(
      `[OverageService] Successfully charged overage of $${evaluation.cost} (payment_id: ${paymentId}) on subscription ${params.subscriptionId}`
    );

    return {
      success: true,
      charged: true,
      amount: evaluation.cost,
      batches: evaluation.batches,
      overageClicks: evaluation.overageClicks,
      paymentId,
    };
  } catch (error: any) {
    console.error(
      `[OverageService] Failed to charge overage on subscription ${params.subscriptionId}:`,
      error
    );
    return {
      success: false,
      charged: false,
      amount: evaluation.cost,
      batches: evaluation.batches,
      overageClicks: evaluation.overageClicks,
      error: error?.message || "Erreur de prélèvement Dodo Payments",
    };
  }
}
