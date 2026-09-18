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
    | "protection_expiry"
    | "qr_custom_logo"
    | "qr_gradient"
    | "qr_premium_frames"
    | "webhooks"
    | "retargeting_pixels"
    | "unlimited_links"
    | "unlimited_domains"
): boolean {
  if (plan === "ENTERPRISE" || plan === "BUSINESS") return true;

  if (plan === "PRO") {
    if (feature === "unlimited_domains") return false; // Pro has 3 domains
    return true; // Pro has access to all feature types
  }

  // Free / Freemium limitations
  switch (feature) {
    case "custom_domain":
    case "routing_rules":
    case "multi_condition_routing":
    case "device_routing":
    case "cloaking":
    case "password_protection":
    case "protection_expiry":
    case "qr_custom_logo":
    case "qr_gradient":
    case "qr_premium_frames":
    case "webhooks":
    case "retargeting_pixels":
    case "unlimited_links":
    case "unlimited_domains":
      return false;
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
  if (plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE") {
    return { allowed: true };
  }

  // Free tier is forbidden from using routing rules
  return {
    allowed: false,
    reason: "Le système de routage dynamique intelligent est réservé aux forfaits Pro, Business et Enterprise.",
  };
}

// Plan Limits Definition
export function getPlanLimits(plan: PlanType) {
  switch (plan) {
    case "ENTERPRISE":
      return {
        clicksLimit: 10_000_000,
        domainsLimit: 50,
        linksLimit: -1, // Unlimited
        rateLimitReqPerMin: 15_000,
        analyticsRetentionDays: -1, // Unlimited
        maxGeoRules: -1,
        canUseRoutingRules: true,
        canUseDeviceRouting: true,
        canUseCloaking: true,
        canUsePassword: true,
      };
    case "BUSINESS":
      return {
        clicksLimit: 2_000_000,
        domainsLimit: 15,
        linksLimit: -1, // Unlimited
        rateLimitReqPerMin: 5_000,
        analyticsRetentionDays: -1, // Unlimited
        maxGeoRules: -1,
        canUseRoutingRules: true,
        canUseDeviceRouting: true,
        canUseCloaking: true,
        canUsePassword: true,
      };
    case "PRO":
      return {
        clicksLimit: 500_000,
        domainsLimit: 3,
        linksLimit: 1_000,
        rateLimitReqPerMin: 1_000,
        analyticsRetentionDays: 365,
        maxGeoRules: -1,
        canUseRoutingRules: true,
        canUseDeviceRouting: true,
        canUseCloaking: true,
        canUsePassword: true,
      };
    case "FREE":
    case "FREEMIUM":
    default:
      return {
        clicksLimit: 10_000,
        domainsLimit: 0,
        linksLimit: 50,
        rateLimitReqPerMin: 60,
        analyticsRetentionDays: 30,
        maxGeoRules: 0,
        canUseRoutingRules: false,
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
