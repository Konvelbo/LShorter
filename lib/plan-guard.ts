import { PlanType } from "@/types";

export interface UpgradeTriggerEventDetail {
  reason?: string;
  featureName?: string;
  targetPlan?: "PRO" | "BUSINESS";
}

// Global Event Trigger
export function triggerPlanUpgrade(options?: UpgradeTriggerEventDetail) {
  if (typeof window === "undefined") return;
  const event = new CustomEvent("lshorter_plan_upgrade_requested", {
    detail: options || { reason: "Cette fonctionnalité requiert un forfait supérieur." },
  });
  window.dispatchEvent(event);
}

// Check if a specific feature is permitted under the current plan
export function checkPlanFeatureAccess(
  plan: PlanType,
  feature:
    | "custom_domain"
    | "routing_rules"
    | "multi_condition_routing"
    | "device_routing"
    | "cloaking"
    | "password_protection"
    | "qr_custom_logo"
    | "qr_gradient"
    | "qr_premium_frames"
    | "webhooks"
    | "retargeting_pixels"
    | "unlimited_links"
    | "unlimited_domains"
): boolean {
  if (plan === "BUSINESS") return true;

  if (plan === "PRO") {
    if (feature === "unlimited_domains") return false; // Pro has 15 domains
    return true; // Pro has access to all feature types
  }

  // FREEMIUM limitations
  switch (feature) {
    case "multi_condition_routing":
    case "device_routing":
    case "cloaking":
    case "password_protection":
    case "qr_custom_logo":
    case "qr_gradient":
    case "qr_premium_frames":
    case "webhooks":
    case "retargeting_pixels":
    case "unlimited_links":
    case "unlimited_domains":
      return false;
    case "routing_rules":
    case "custom_domain":
      return true; // Freemium has basic 1-country rule and up to 3 domains
    default:
      return true;
  }
}

// Validation for adding routing rules based on plan
export function canAddRoutingRule(
  plan: PlanType,
  currentRulesCount: number,
  ruleType?: string
): { allowed: boolean; reason?: string } {
  if (plan === "PRO" || plan === "BUSINESS") {
    return { allowed: true };
  }

  // Freemium Plan
  if (currentRulesCount >= 1) {
    return {
      allowed: false,
      reason: "Le forfait Freemium est limité à 1 seule règle de ciblage. Passez au forfait Pro pour des règles illimitées.",
    };
  }

  if (ruleType && ruleType !== "pays" && ruleType !== "country" && ruleType !== "geo") {
    return {
      allowed: false,
      reason: "Le ciblage par appareil (Android/iOS) et multi-conditions est réservé au forfait Pro.",
    };
  }

  return { allowed: true };
}

// Plan Limits Definition
export function getPlanLimits(plan: PlanType) {
  switch (plan) {
    case "BUSINESS":
      return {
        clicksLimit: -1, // Unlimited
        domainsLimit: -1, // Unlimited
        linksLimit: -1, // Unlimited
        rateLimitReqPerMin: -1, // Unlimited
        analyticsRetentionDays: -1, // Unlimited
        maxGeoRules: -1,
        canUseDeviceRouting: true,
        canUseCloaking: true,
        canUsePassword: true,
      };
    case "PRO":
      return {
        clicksLimit: -1, // Unlimited
        domainsLimit: 15,
        linksLimit: -1, // Unlimited
        rateLimitReqPerMin: -1, // Unlimited
        analyticsRetentionDays: -1, // Unlimited
        maxGeoRules: -1,
        canUseDeviceRouting: true,
        canUseCloaking: true,
        canUsePassword: true,
      };
    case "FREEMIUM":
    default:
      return {
        clicksLimit: 60_000,
        domainsLimit: 3,
        linksLimit: 1_000,
        rateLimitReqPerMin: 1_000,
        analyticsRetentionDays: 30,
        maxGeoRules: 1,
        canUseDeviceRouting: false,
        canUseCloaking: false,
        canUsePassword: false,
      };
  }
}

// Fetch Interceptor for 403 Forbidden & Plan Limits
export async function apiFetchInterceptor(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const response = await fetch(input, init);

  if (response.status === 403) {
    try {
      const clone = response.clone();
      const data = await clone.json();
      if (
        data.code === "PLAN_UPGRADE_REQUIRED" ||
        data.code === "PLAN_LIMIT_REACHED" ||
        data.error?.includes("plan") ||
        data.error?.includes("forfait")
      ) {
        triggerPlanUpgrade({
          reason: data.message || data.error || "Limite de votre forfait atteinte.",
          targetPlan: "PRO",
        });
      }
    } catch {
      triggerPlanUpgrade({
        reason: "Fonctionnalité réservée au forfait Pro.",
        targetPlan: "PRO",
      });
    }
  }

  return response;
}
