// ============================================================================
// LShorter Pricing & Plan Specifications (v4 - Enterprise Promotional Grade)
// ============================================================================

export interface PlanDefinition {
  id: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE';
  name: string;
  monthlyPrice: number;
  yearlyPrice: number;
  promoMonthly: {
    discountPercent: number;       // Ex: 75 pour -75%
    firstMonthPrice: number;       // Prix facturé le premier mois
  };
  promoYearly: {
    discountPercent: number;       // Ex: 50 pour -50%
    fullPriceBeforeDiscount: number;// Prix standard (monthlyPrice * 12)
    yearlyPrice: number;           // Prix total facturé pour 1 an
    equivalentMonthlyPrice: number;// Prix mensuel équivalent affiché
  };
  limits: {
    monthlyClicks: number;
    customDomains: number;
    activeLinks: number;           // -1 = illimité
    analyticsRetentionDays: number;// -1 = illimité
    teamSeats: number;
    smartRoutingLevel: 'BASIC' | 'ADVANCED' | 'CUSTOM';
    retargetingPixels: number;     // -1 = illimité
    apiRateLimitPerMinute: number; // Requêtes max autorisées par minute
  };
  overage: {
    allowed: boolean;
    batchSize: number;             // 10 000 clics
    costPerBatch: number;          // Montant facturé en euros par tranche
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
    free: "10 000 clics pour tester la rapidité de l'infrastructure sans entrer de carte bancaire.",
    pro: "500 000 clics et 3 domaines personnalisés pour booster votre marque et vos conversions.",
    business: "2M de clics et 15 domaines pour piloter vos campagnes d'envergure avec des équipes élargies.",
    enterprise: "10M de clics et 50 domaines. Forfait fixe massif disponible en libre-service immédiat.",
  },
  guarantees: [
    {
      title: "Garantie Zéro Coupure",
      description: "Vos campagnes publicitaires ne s'arrêtent jamais. En cas de pic de trafic imprévu, les redirections fonctionnent sans discontinuer et l'ajustement s'effectue automatiquement au volume réel.",
    },
    {
      title: "Paiements Sécurisés & Factures Instantanées",
      description: "Transactions chiffrées selon les standards bancaires. Vos factures officielles sont disponibles immédiatement au téléchargement dans vos paramètres.",
    },
    {
      title: "Sans Engagement",
      description: "Résiliation ou changement de forfait en un clic depuis votre espace d'administration.",
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
 * Format click limits to user-friendly label (e.g. 10k, 500k, 2M, 10M, Illimité).
 */
export function formatClickLimit(limit: number): string {
  if (limit === -1) return "Illimité";
  if (limit >= 1_000_000) return `${(limit / 1_000_000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}M`;
  if (limit >= 1_000) return `${(limit / 1_000).toLocaleString('fr-FR')}k`;
  return limit.toLocaleString('fr-FR');
}
