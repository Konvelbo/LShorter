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
    batchSize: number;             // 10,000 clicks
    costPerBatch: number;          // Billed amount per batch in USD/EUR
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
    overage: { allowed: false, batchSize: 0, costPerBatch: 0 },
  },
  PRO: {
    id: 'PRO',
    name: 'Pro',
    monthlyPrice: 15,
    yearlyPrice: 90,
    promoMonthly: {
      discountPercent: 75,
      firstMonthPrice: 3.75, // 15 € - 75%
    },
    promoYearly: {
      discountPercent: 50,
      fullPriceBeforeDiscount: 180, // 15 € * 12
      yearlyPrice: 90,
      equivalentMonthlyPrice: 7.50,
    },
    limits: {
      monthlyClicks: 500000,
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
      batchSize: 10000, 
      costPerBatch: 1.0 
    },
  },
  BUSINESS: {
    id: 'BUSINESS',
    name: 'Business',
    monthlyPrice: 49,
    yearlyPrice: 350,
    promoMonthly: {
      discountPercent: 60,
      firstMonthPrice: 19.60, // 49 € - 60%
    },
    promoYearly: {
      discountPercent: 40,
      fullPriceBeforeDiscount: 588, // 49 € * 12
      yearlyPrice: 350,            // Réduction ~40%
      equivalentMonthlyPrice: 29.16,
    },
    limits: {
      monthlyClicks: 2000000,
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
      batchSize: 10000, 
      costPerBatch: 0.8 
    },
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise',
    monthlyPrice: 199,
    yearlyPrice: 1670,
    promoMonthly: {
      discountPercent: 50,
      firstMonthPrice: 99.50, // 199 € - 50%
    },
    promoYearly: {
      discountPercent: 30,
      fullPriceBeforeDiscount: 2388, // 199 € * 12
      yearlyPrice: 1670,            // Réduction ~30%
      equivalentMonthlyPrice: 139.16,
    },
    limits: {
      monthlyClicks: 10000000,
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
      batchSize: 10000, 
      costPerBatch: 0.5 
    },
  },
};

export const PRICING_COPY = {
  planExplanations: {
    free: "10,000 clicks to experience the lightning-fast edge infrastructure without entering a credit card.",
    pro: "500,000 clicks and 3 custom domains to elevate your brand presence and conversion rates.",
    business: "2M clicks and 15 custom domains to scale large multi-channel campaigns with your team.",
    enterprise: "10M clicks and 50 custom domains with dedicated high-throughput edge SLA for enterprises.",
  },
  guarantees: [
    {
      title: "Zero-Downtime Guarantee",
      description: "Your campaigns never stop. During unexpected traffic surges, redirects keep running seamlessly and automatic volume scaling handles the load.",
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
  batchSize: number = 10000,
  costPerBatch: number = 1.0
): { batches: number; cost: number } {
  if (clicksOverage <= 0 || batchSize <= 0) {
    return { batches: 0, cost: 0 };
  }
  const batches = Math.ceil(clicksOverage / batchSize);
  const cost = Number((batches * costPerBatch).toFixed(2));
  return { batches, cost };
}

/**
 * Format click limits to user-friendly label (e.g. 10k, 500k, 2M, 10M, Unlimited).
 */
export function formatClickLimit(limit: number): string {
  if (limit === -1) return "Unlimited";
  if (limit >= 1_000_000) return `${(limit / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })}M`;
  if (limit >= 1_000) return `${(limit / 1_000).toLocaleString('en-US')}k`;
  return limit.toLocaleString('en-US');
}
