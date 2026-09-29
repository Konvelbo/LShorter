// ============================================================================
// LShorter Pricing & Plan Specifications (v4 - Enterprise Promotional Grade)
// ============================================================================

export interface PlanDefinition {
  id: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  promoMonthly: {
    discountPercent: number;       // e.g. 75 for -75%
    firstMonthPrice: number;       // Price billed for first month
  };
  promoYearly: {
    discountPercent: number;       // e.g. 50 for -50%
    fullPriceBeforeDiscount: number;// Standard price (monthlyPrice * 12)
    yearlyPrice: number;           // Total billed for 1 year
    equivalentMonthlyPrice: number;// Equivalent monthly price displayed
  };
  limits: {
    monthlyClicks: number;
    customDomains: number;
    activeLinks: number;           // -1 = unlimited
    analyticsRetentionDays: number;// -1 = unlimited
    teamSeats: number;
    smartRoutingLevel: 'BASIC' | 'ADVANCED' | 'CUSTOM';
    retargetingPixels: number;     // -1 = unlimited
    apiRateLimitPerMinute: number; // Max requests per minute
  };
  overage: {
    allowed: boolean;
    unlimited?: boolean;           // true for ENTERPRISE (no overage charges)
    batchSize: number;             // e.g. 50,000 for PRO, 125,000 for BUSINESS
    costPerBatch: number;          // e.g. $3 for PRO, $8 for BUSINESS, $0 for ENTERPRISE
    label?: string;                // Human-readable overage rule
  };
}

export const PRICING_PLANS: Record<string, PlanDefinition> = {
  FREE: {
    id: 'FREE',
    name: 'Starter',
    monthlyPrice: 0,
    yearlyPrice: 0,
    promoMonthly: { discountPercent: 0, firstMonthPrice: 0 },
    promoYearly: { discountPercent: 0, fullPriceBeforeDiscount: 0, yearlyPrice: 0, equivalentMonthlyPrice: 0 },
    limits: {
      monthlyClicks: 10000,
      customDomains: 0,
      activeLinks: 50,
      analyticsRetentionDays: 30,
      teamSeats: 1,
      smartRoutingLevel: 'BASIC',
      retargetingPixels: 0,
      apiRateLimitPerMinute: 60,
    },
    overage: {
      allowed: false,
      unlimited: false,
      batchSize: 0,
      costPerBatch: 0,
      label: 'Hard limit at 10,000 clicks/mo',
    },
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    monthlyPrice: 15,
    yearlyPrice: 90,
    promoMonthly: {
      discountPercent: 75,
      firstMonthPrice: 3.75, // $15 - 75%
    },
    promoYearly: {
      discountPercent: 50,
      fullPriceBeforeDiscount: 180, // $15 * 12
      yearlyPrice: 90,
      equivalentMonthlyPrice: 7.50,
    },
    limits: {
      monthlyClicks: 150000,
      customDomains: 3,
      activeLinks: 1000,
      analyticsRetentionDays: 365,
      teamSeats: 2,
      smartRoutingLevel: 'ADVANCED',
      retargetingPixels: 5,
      apiRateLimitPerMinute: 1000,
    },
    overage: {
      allowed: true,
      unlimited: false,
      batchSize: 50000,
      costPerBatch: 3.0,
      label: '$3 per additional 50,000 clicks/mo',
    },
  },
  BUSINESS: {
    id: 'BUSINESS',
    name: 'Business',
    monthlyPrice: 49,
    yearlyPrice: 350,
    promoMonthly: {
      discountPercent: 60,
      firstMonthPrice: 19.60, // $49 - 60%
    },
    promoYearly: {
      discountPercent: 40,
      fullPriceBeforeDiscount: 588, // $49 * 12
      yearlyPrice: 350,
      equivalentMonthlyPrice: 29.16,
    },
    limits: {
      monthlyClicks: 500000,
      customDomains: 15,
      activeLinks: -1,
      analyticsRetentionDays: -1,
      teamSeats: 5,
      smartRoutingLevel: 'CUSTOM',
      retargetingPixels: -1,
      apiRateLimitPerMinute: 5000,
    },
    overage: {
      allowed: true,
      unlimited: false,
      batchSize: 125000,
      costPerBatch: 8.0,
      label: '$8 per additional 125,000 clicks/mo',
    },
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPrice: 199,
    yearlyPrice: 1670,
    promoMonthly: {
      discountPercent: 50,
      firstMonthPrice: 99.50, // $199 - 50%
    },
    promoYearly: {
      discountPercent: 30,
      fullPriceBeforeDiscount: 2388, // $199 * 12
      yearlyPrice: 1670,
      equivalentMonthlyPrice: 139.16,
    },
    limits: {
      monthlyClicks: 2000000,
      customDomains: 50,
      activeLinks: -1,
      analyticsRetentionDays: -1,
      teamSeats: 15,
      smartRoutingLevel: 'CUSTOM',
      retargetingPixels: -1,
      apiRateLimitPerMinute: 15000,
    },
    overage: {
      allowed: true,
      unlimited: true,
      batchSize: 0,
      costPerBatch: 0,
      label: 'Unlimited overage included ($0 extra)',
    },
  },
};

export const PRICING_COPY = {
  planExplanations: {
    free: "10,000 clicks/month to experience our lightning-fast edge infrastructure without entering a credit card.",
    pro: "150,000 clicks/month (+ $3 per 50,000 extra clicks) and 3 custom domains to elevate your brand presence and conversion rates.",
    business: "500,000 clicks/month (+ $8 per 125,000 extra clicks) and 15 custom domains to scale multi-channel campaigns with your team.",
    enterprise: "2,000,000+ clicks/month with unlimited free overage and 50 custom domains backed by a dedicated high-throughput edge SLA.",
  },
  guarantees: [
    {
      title: "Zero-Downtime Guarantee",
      description: "Your campaigns never stop. On Pro ($3 / 50k extra clicks), Business ($8 / 125k extra clicks), and Enterprise (Unlimited free overage), redirects keep running seamlessly during traffic surges.",
    },
    {
      title: "Secure Payments & Instant Invoices",
      description: "Bank-grade encrypted transactions. Certified PDF invoices are available for download immediately in your billing settings.",
    },
    {
      title: "Cancel Anytime",
      description: "No lock-in contracts. Upgrade, downgrade, or cancel your subscription in one click directly from your dashboard.",
    },
  ],
};

/**
 * Helper to normalize plan ID and return plan definition.
 */
export function getPlanDefinition(planId?: string): PlanDefinition {
  const normalized = (planId || 'FREE').toUpperCase();
  if (normalized === 'FREEMIUM' || normalized === 'STARTER' || normalized === 'FREE') {
    return PRICING_PLANS.FREE;
  }
  return PRICING_PLANS[normalized] || PRICING_PLANS.FREE;
}

/**
 * Helper to compute overage cost and initiated batch count.
 */
export function calculateOverage(
  clicksOverage: number,
  batchSize: number = 50000,
  costPerBatch: number = 3.0
): { batches: number; cost: number } {
  if (clicksOverage <= 0 || batchSize <= 0 || costPerBatch <= 0) {
    return { batches: 0, cost: 0 };
  }
  const batches = Math.ceil(clicksOverage / batchSize);
  const cost = Number((batches * costPerBatch).toFixed(2));
  return { batches, cost };
}

/**
 * Centralized API & Edge quota + overage evaluator for any user plan and monthly click count.
 */
export function evaluateClickQuotaAndOverage(
  planId: string | undefined,
  clicksThisMonth: number
) {
  const planDef = getPlanDefinition(planId);
  const limit = planDef.limits.monthlyClicks;
  const isUnlimitedOverage = Boolean(planDef.overage.unlimited);
  const overageClicks = Math.max(0, clicksThisMonth - limit);
  const isOverQuota = clicksThisMonth > limit;
  const isBlocked = clicksThisMonth >= limit && !planDef.overage.allowed;

  const { batches, cost } = isUnlimitedOverage
    ? { batches: 0, cost: 0 }
    : calculateOverage(
        overageClicks,
        planDef.overage.batchSize,
        planDef.overage.costPerBatch
      );

  return {
    planId: planDef.id,
    planName: planDef.name,
    monthlyClicksLimit: limit,
    clicksThisMonth,
    remainingIncludedClicks: Math.max(0, limit - clicksThisMonth),
    usagePercent: limit > 0 ? Math.min(100, Math.round((clicksThisMonth / limit) * 100)) : 0,
    isOverQuota,
    isBlocked,
    overage: {
      allowed: planDef.overage.allowed,
      unlimited: isUnlimitedOverage,
      batchSize: planDef.overage.batchSize,
      costPerBatch: planDef.overage.costPerBatch,
      label: planDef.overage.label || "",
      overageClicks,
      batches,
      estimatedCost: cost,
    },
  };
}

/**
 * Format click limits to user-friendly label (e.g. 10k, 150k, 500k, 2M, Unlimited).
 */
export function formatClickLimit(limit: number): string {
  if (limit === -1) return "Unlimited";
  if (limit >= 1_000_000) return `${(limit / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
  if (limit >= 1_000) return `${(limit / 1_000).toLocaleString('en-US')}k`;
  return limit.toLocaleString('en-US');
}
