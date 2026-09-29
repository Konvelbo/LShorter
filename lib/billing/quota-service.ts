// ============================================================================
// Resource Quota Guard Service & Overage Computation
// ============================================================================

import { PlanType } from "@/types";
import { PRICING_PLANS, getPlanDefinition, evaluateClickQuotaAndOverage } from "@/src/config/pricing";

export interface QuotaGuardResult {
  allowed: boolean;
  reason?: string;
  code?: string;
  limit: number;
  current: number;
}

/**
 * Guard monthly click redirect against plan quota & overage rules.
 * - Starter (FREE): Hard limit at 10,000 clicks/month.
 * - Pro (PRO): 150,000 included clicks/month + $3 per 50,000 extra clicks (never blocked).
 * - Business (BUSINESS): 500,000 included clicks/month + $8 per 125,000 extra clicks (never blocked).
 * - Enterprise (ENTERPRISE): 2,000,000+ clicks/month with unlimited free overage (never blocked).
 */
export function guardClickRedirect(plan: PlanType | string, clicksThisMonth: number) {
  const status = evaluateClickQuotaAndOverage(plan, clicksThisMonth);
  if (status.isBlocked) {
    return {
      allowed: false,
      code: "MONTHLY_CLICK_QUOTA_EXCEEDED",
      reason: `Limite mensuelle de ${status.monthlyClicksLimit.toLocaleString()} clics atteinte sur le forfait ${status.planName}. Passez au plan Pro (150 000 clics + overage automatique à 3$/50k) pour ne jamais bloquer votre trafic.`,
      limit: status.monthlyClicksLimit,
      current: clicksThisMonth,
      overage: status.overage,
    };
  }

  return {
    allowed: true,
    limit: status.monthlyClicksLimit,
    current: clicksThisMonth,
    overage: status.overage,
  };
}

export function getQuotaAndOverageSummary(plan: PlanType | string, clicksThisMonth: number) {
  return evaluateClickQuotaAndOverage(plan, clicksThisMonth);
}

/**
 * Guard domain creation against plan limits.
 */
export function guardDomainCreation(plan: PlanType, currentCount: number): QuotaGuardResult {
  const planDef = getPlanDefinition(plan);
  const limit = planDef.limits.customDomains;

  if (limit === 0) {
    return {
      allowed: false,
      code: "QUOTA_EXCEEDED",
      reason: "Les domaines personnalisés requièrent un forfait payant (Pro, Business ou Enterprise).",
      limit: 0,
      current: currentCount,
    };
  }

  if (limit !== -1 && currentCount >= limit) {
    return {
      allowed: false,
      code: "QUOTA_EXCEEDED",
      reason: `Limite de domaines personnalisés atteinte (${currentCount}/${limit}) pour le forfait ${planDef.name}. Passez au forfait supérieur pour en ajouter davantage.`,
      limit,
      current: currentCount,
    };
  }

  return { allowed: true, limit, current: currentCount };
}

/**
 * Guard link creation against plan limits.
 */
export function guardLinkCreation(plan: PlanType, currentCount: number): QuotaGuardResult {
  const planDef = getPlanDefinition(plan);
  const limit = planDef.limits.activeLinks;

  if (limit !== -1 && currentCount >= limit) {
    return {
      allowed: false,
      code: "QUOTA_EXCEEDED",
      reason: `Limite de liens atteinte (${currentCount}/${limit}) pour le forfait ${planDef.name}. Passez au forfait supérieur pour créer des liens illimités.`,
      limit,
      current: currentCount,
    };
  }

  return { allowed: true, limit, current: currentCount };
}

/**
 * Guard retargeting pixel creation against plan limits.
 */
export function guardPixelCreation(plan: PlanType, currentCount: number): QuotaGuardResult {
  const planDef = getPlanDefinition(plan);
  const limit = planDef.limits.retargetingPixels;

  if (limit === 0) {
    return {
      allowed: false,
      code: "QUOTA_EXCEEDED",
      reason: "Les pixels de retargeting sont réservés aux forfaits Pro, Business et Enterprise.",
      limit: 0,
      current: currentCount,
    };
  }

  if (limit !== -1 && currentCount >= limit) {
    return {
      allowed: false,
      code: "QUOTA_EXCEEDED",
      reason: `Limite de pixels atteinte (${currentCount}/${limit}) pour le forfait ${planDef.name}.`,
      limit,
      current: currentCount,
    };
  }

  return { allowed: true, limit, current: currentCount };
}
