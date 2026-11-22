/**
 * ============================================================
 *  LShorter — Schémas Zod centralisés pour toutes les API routes
 * ============================================================
 *
 * SOURCE UNIQUE DE VÉRITÉ.
 * Toute donnée entrant dans une route API (body, query params, params de route)
 * et sortant (réponses) doit passer par ces schémas.
 *
 * Règle : le client valide pour l'UX, le serveur valide pour la sécurité.
 * Ne jamais faire confiance à une validation faite côté navigateur.
 */

import { z } from "zod";

// ─── Helpers de base ────────────────────────────────────────────────────────

/** URL HTTP ou HTTPS sûre — bloque javascript:, data:, file:, etc. */
export const safeHttpUrlSchema = z
  .string()
  .trim()
  .max(4096, "URL is too long")
  .refine(
    (u) => {
      if (!u) return false;
      if (/[\x00-\x1F\x7F]/.test(u)) return false;
      if (
        /^(javascript|data|vbscript|file|blob|about|chrome|intent|ms-windows-store|ftp|gopher):/i.test(u)
      )
        return false;
      try {
        const candidate =
          u.startsWith("http://") || u.startsWith("https://") ? u : `https://${u}`;
        const parsed = new URL(candidate);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    "Only HTTP and HTTPS URLs are permitted"
  );

/** Optionnellement une URL sûre (vide = ok) */
export const optionalSafeUrlSchema = safeHttpUrlSchema.optional().or(z.literal("")).transform(v => v || undefined);

/** URL de redirection sûre (relative commençant par / ou HTTP/HTTPS) */
export const redirectUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (u) => {
      if (!u) return false;
      if (/[\x00-\x1F\x7F]/.test(u)) return false;
      if (/^(javascript|data|vbscript|file|blob):/i.test(u)) return false;
      if (u.startsWith("/")) return true;
      try {
        const parsed = new URL(u);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
      } catch {
        return false;
      }
    },
    "Must be a relative path (/...) or HTTP(S) URL"
  );

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, "Email is too long")
  .email("Invalid email address");

export const optionalEmailSchema = emailSchema.optional().or(z.literal("")).transform(v => v || undefined);

export const nameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(80, "Name is too long")
  .regex(/^[^<>]*$/, "Name contains invalid characters");

/** Nom complet / pseudo (création de compte) : 2 à 50 caractères */
export const usernameSchema = z
  .string()
  .trim()
  .min(2, "Name must be at least 2 characters long")
  .max(50, "Name cannot exceed 50 characters")
  .regex(/^[^<>]*$/, "Name contains invalid characters");

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters long")
  .max(128, "Password cannot exceed 128 characters")
  .refine(
    (p) => p.trim().length >= 8,
    "Password cannot consist solely of whitespace"
  );

export const bcryptHashSchema = z
  .string()
  .regex(/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/, "Invalid bcrypt password hash");

export const pinSchema = z.string().regex(/^\d{6}$/, "PIN must be 6 digits");

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Slug is required")
  .max(100, "Slug is too long")
  .regex(/^[a-zA-Z0-9_-]+$/, "Slug may only contain letters, numbers, hyphens and underscores");

export const idSchema = z.string().trim().min(1, "ID is required").max(254);

export const userIdSchema = z
  .string()
  .trim()
  .min(1, "User ID is required")
  .max(254, "User ID is too long");

export const planSchema = z.enum(["FREE", "FREEMIUM", "STARTER", "PRO", "BUSINESS", "ENTERPRISE"]);

export const billingCycleSchema = z.enum(["MONTHLY", "YEARLY"]);

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => Math.max(1, parseInt(v ?? "1", 10) || 1)),
  limit: z
    .string()
    .optional()
    .transform((v) => Math.min(1000, Math.max(1, parseInt(v ?? "50", 10) || 50))),
});

export const periodSchema = z
  .enum(["day", "week", "month", "year", "24h", "7d", "30d", "90d", "365d"])
  .optional()
  .default("month");

export const tagSchema = z.string().trim().max(50).regex(/^[^<>;]*$/, "Invalid tag");

/** Tags : array, string CSV/JSON, ou null (sans default pour éviter d'écraser les tags lors d'un PATCH partiel) */
export const tagsSchema = z
  .union([
    z.array(tagSchema).max(20),
    z.string().transform((s) => {
      try {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed)) return parsed.map(String).map((t) => t.trim()).filter(Boolean);
      } catch {
        // not JSON, treat as CSV
      }
      return s.split(",").map((t) => t.trim()).filter(Boolean);
    }),
    z.null(),
  ])
  .optional();

// ─── Auth ───────────────────────────────────────────────────────────────────

/** Credentials login schema */
export const loginCredentialsSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, "Password is required")
    .max(128, "Password cannot exceed 128 characters"),
  twoFactorCode: z.string().trim().max(32).optional(),
});

/** POST /api/auth/register */
export const registerBodySchema = z.object({
  name: usernameSchema,
  email: emailSchema,
  password: passwordSchema.optional(),
  passwordHash: bcryptHashSchema.optional(),
}).refine(
  (d) => d.password || d.passwordHash,
  "Either password or passwordHash is required"
);

/** POST /api/auth/signup-pin — action: send */
export const signupPinSendSchema = z.object({
  action: z.literal("send"),
  name: usernameSchema,
  email: emailSchema,
  password: passwordSchema,
});

/** POST /api/auth/signup-pin — action: verify */
export const signupPinVerifySchema = z.object({
  action: z.literal("verify"),
  email: emailSchema,
  pin: pinSchema,
  token: z.string().min(1).max(4096).optional(),
});

/** POST /api/auth/signup-pin — action: complete */
export const signupPinCompleteSchema = z.object({
  action: z.literal("complete"),
  email: emailSchema,
  pin: pinSchema,
  token: z.string().min(1, "Missing token").max(4096).optional(),
});

export const signupPinBodySchema = z.discriminatedUnion("action", [
  signupPinSendSchema,
  signupPinVerifySchema,
  signupPinCompleteSchema,
]);

/** POST /api/auth/2fa/verify — action: generate */
export const twoFaGenerateSchema = z.object({
  action: z.literal("generate"),
  email: emailSchema.optional(),
  name: z.string().trim().max(80).optional(),
});

/** POST /api/auth/2fa/verify — action: verify */
export const twoFaVerifySchema = z.object({
  action: z.literal("verify"),
  secret: z.string().min(16).max(256),
  code: z.string().regex(/^\d{6}$/, "TOTP code must be 6 digits"),
});

export const twoFaBodySchema = z.discriminatedUnion("action", [
  twoFaGenerateSchema,
  twoFaVerifySchema,
]);

// ─── Links ──────────────────────────────────────────────────────────────────

/** URL HTTP ou HTTPS sûre optionnelle ("" ou null autorisé pour effacer un champ) */
export const optionalNullableSafeUrlSchema = z
  .union([
    safeHttpUrlSchema,
    z.literal("").transform(() => null),
    z.null(),
  ])
  .optional();

/** Entier strictement positif optionnel ("" ou null autorisé pour désactiver une limite) */
const optionalNullablePositiveIntSchema = z
  .union([
    z.number().int().positive(),
    z
      .string()
      .trim()
      .regex(/^\d+$/, "Must be a positive integer")
      .transform(Number)
      .pipe(z.number().int().positive()),
    z.literal("").transform(() => null),
    z.null(),
  ])
  .optional();

/** Poids / pourcentage (0..100) optionnel/nullable ("" ou null -> undefined pour ne pas forcer Number(null) === 0) */
const optionalNullableWeightSchema = z
  .union([
    z.number().min(0).max(100),
    z
      .string()
      .trim()
      .regex(/^\d+(\.\d+)?$/, "Weight must be between 0 and 100")
      .transform(Number)
      .pipe(z.number().min(0).max(100)),
    z.literal("").transform(() => undefined),
    z.null().transform(() => undefined),
  ])
  .optional();

/** Code de redirection HTTP (chaîne ou entier 301/302/307/308, ou null/"") */
const optionalNullableRedirectTypeSchema = z
  .union([
    z.enum(["301", "302", "307", "308"]),
    z
      .union([z.literal(301), z.literal(302), z.literal(307), z.literal(308)])
      .transform((n) => String(n) as "301" | "302" | "307" | "308"),
    z.literal("").transform(() => undefined),
    z.null(),
  ])
  .optional();

/** Pixel attaché à un lien : ID string ou objet pixel structuré du PixelSelectorModal */
export const linkPixelItemSchema = z.union([
  z.string().max(200),
  z
    .object({
      id: z.string().max(200).optional().nullable(),
      platform: z.string().max(100).optional().nullable(),
      pixelId: z.string().max(200).optional().nullable(),
      pixel_id: z.string().max(200).optional().nullable(),
      name: z.string().max(200).optional().nullable(),
    })
    .passthrough(),
]);

export const routingRuleSchema = z
  .object({
    condition: z.string().trim().max(500).optional().nullable(),
    targetUrl: optionalNullableSafeUrlSchema,
    target_url: optionalNullableSafeUrlSchema,
    destinationUrl: optionalNullableSafeUrlSchema,
    destination_url: optionalNullableSafeUrlSchema,
    weight: optionalNullableWeightSchema,
  })
  .passthrough();

const routingRulesFieldSchema = z
  .union([
    z.array(routingRuleSchema).max(50),
    z.string().max(50_000).transform((s, ctx) => {
      if (!s.trim()) return [];
      try {
        const parsed = JSON.parse(s);
        const check = z.array(routingRuleSchema).max(50).safeParse(parsed);
        if (!check.success) {
          ctx.addIssue({ code: "custom", message: "Invalid routing rules format" });
          return z.NEVER;
        }
        return check.data;
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid routing rules JSON" });
        return z.NEVER;
      }
    }),
    z.null(),
  ])
  .optional();

export const abVariationSchema = z
  .object({
    url: safeHttpUrlSchema,
    weight: z.union([
      z.number().min(0).max(100),
      z
        .string()
        .trim()
        .regex(/^\d+(\.\d+)?$/, "Weight must be between 0 and 100")
        .transform(Number)
        .pipe(z.number().min(0).max(100)),
    ]),
    name: z.string().trim().max(100).optional().nullable(),
  })
  .passthrough();

const abVariationsFieldSchema = z
  .union([
    z.array(abVariationSchema).max(20),
    z.string().max(20_000).transform((s, ctx) => {
      if (!s.trim()) return [];
      try {
        const parsed = JSON.parse(s);
        const check = z.array(abVariationSchema).max(20).safeParse(parsed);
        if (!check.success) {
          ctx.addIssue({ code: "custom", message: "Invalid A/B variations format" });
          return z.NEVER;
        }
        return check.data;
      } catch {
        ctx.addIssue({ code: "custom", message: "Invalid A/B variations JSON" });
        return z.NEVER;
      }
    }),
    z.null(),
  ])
  .optional();

export const baseLinkBodySchema = z
  .object({
    targetUrl: safeHttpUrlSchema.optional(),
    target_url: safeHttpUrlSchema.optional(),
    slug: z
      .union([
        slugSchema,
        z.literal("").transform(() => undefined),
        z.null().transform(() => undefined),
      ])
      .optional(),
    userId: z
      .union([
        userIdSchema,
        z.literal("").transform(() => undefined),
        z.null().transform(() => undefined),
      ])
      .optional(),
    userEmail: z
      .union([
        emailSchema,
        z.literal("").transform(() => undefined),
        z.null().transform(() => undefined),
      ])
      .optional(),
    title: z.string().trim().max(200).optional().nullable(),
    description: z.string().trim().max(500).optional().nullable(),
    metaTitle: z.string().trim().max(200).optional().nullable(),
    meta_title: z.string().trim().max(200).optional().nullable(),
    ogTitle: z.string().trim().max(200).optional().nullable(),
    og_title: z.string().trim().max(200).optional().nullable(),
    ogDescription: z.string().trim().max(500).optional().nullable(),
    og_description: z.string().trim().max(500).optional().nullable(),
    ogImage: z.string().max(7_500_000).optional().nullable(),
    og_image: z.string().max(7_500_000).optional().nullable(),
    bannerStyle: z
      .union([
        z.enum(["large_banner", "default_banner", "summary", "summary_large_image"]),
        z.literal("").transform(() => undefined),
        z.null(),
      ])
      .optional(),
    banner_style: z
      .union([
        z.enum(["large_banner", "default_banner", "summary", "summary_large_image"]),
        z.literal("").transform(() => undefined),
        z.null(),
      ])
      .optional(),
    twitterCard: z
      .union([
        z.enum(["summary_large_image", "summary"]),
        z.literal("").transform(() => undefined),
        z.null(),
      ])
      .optional(),
    twitter_card: z
      .union([
        z.enum(["summary_large_image", "summary"]),
        z.literal("").transform(() => undefined),
        z.null(),
      ])
      .optional(),
    tags: tagsSchema,
    // Routing & Targeting
    routingRules: routingRulesFieldSchema,
    routing_rules: routingRulesFieldSchema,
    geoTargeting: z.any().optional().nullable(),
    geo_targeting: z.any().optional().nullable(),
    deviceTargeting: z.any().optional().nullable(),
    device_targeting: z.any().optional().nullable(),
    abVariations: abVariationsFieldSchema,
    ab_variations: abVariationsFieldSchema,
    mainWeight: optionalNullableWeightSchema,
    main_weight: optionalNullableWeightSchema,
    redirectType: optionalNullableRedirectTypeSchema,
    redirect_type: optionalNullableRedirectTypeSchema,
    passParams: z.union([z.boolean(), z.literal(0), z.literal(1), z.null()]).optional(),
    pass_params: z.union([z.boolean(), z.literal(0), z.literal(1), z.null()]).optional(),
    // Protection
    isPasswordProtected: z.boolean().optional().nullable(),
    password: z.string().max(128).optional().nullable(),
    link_password: z.string().max(128).optional().nullable(),
    destinationMasked: z.boolean().optional().nullable(),
    // Expiry & Limits
    maxClicks: optionalNullablePositiveIntSchema,
    max_clicks: optionalNullablePositiveIntSchema,
    expiresAt: z.string().optional().nullable(),
    expires_at: z.string().optional().nullable(),
    fallbackUrl: optionalNullableSafeUrlSchema,
    fallback_url: optionalNullableSafeUrlSchema,
    // UTM
    utmSource: z.string().trim().max(100).optional().nullable(),
    utmMedium: z.string().trim().max(100).optional().nullable(),
    utmCampaign: z.string().trim().max(200).optional().nullable(),
    utmTerm: z.string().trim().max(200).optional().nullable(),
    utmContent: z.string().trim().max(200).optional().nullable(),
    // Pixels & extras
    pixels: z.array(linkPixelItemSchema).max(20).optional().nullable(),
    pixel_ids: z.array(linkPixelItemSchema).max(20).optional().nullable(),
    // Path lock
    pathLockMode: z
      .union([
        z.enum(["off", "strict", "funnel", "prefix", "suffix", "exact"]),
        z.literal("").transform(() => undefined),
        z.null(),
      ])
      .optional(),
    path_lock_mode: z
      .union([
        z.enum(["off", "strict", "funnel", "prefix", "suffix", "exact"]),
        z.literal("").transform(() => undefined),
        z.null(),
      ])
      .optional(),
    pathLockPrefix: z.string().trim().max(500).optional().nullable(),
    path_lock_prefix: z.string().trim().max(500).optional().nullable(),
    pathLockMessage: z.string().trim().max(500).optional().nullable(),
    path_lock_message: z.string().trim().max(500).optional().nullable(),
    pathLockPassword: z.string().max(128).optional().nullable(),
    path_lock_password: z.string().max(128).optional().nullable(),
    // Domain
    domainId: z.string().trim().max(100).optional().nullable(),
    customDomain: z.string().trim().max(255).optional().nullable(),
    domainName: z.string().trim().max(255).optional().nullable(),
    domain: z.string().trim().max(255).optional().nullable(),
  })
  .passthrough();

export const linkCreateBodySchema = baseLinkBodySchema.refine(
  (d) => d.targetUrl || d.target_url,
  "Target URL is required"
);

export const linkUpdateBodySchema = baseLinkBodySchema.partial();

export const linkIdParamsSchema = z.object({
  id: idSchema,
});

export const slugParamsSchema = z.object({
  slug: slugSchema,
});

export const linkUnlockBodySchema = z.object({
  password: z.string().max(128).optional().default(""),
});

export const bulkDeleteBodySchema = z
  .object({
    ids: z.array(z.string().trim().min(1).max(254)).min(1, "At least one ID is required").max(500),
    userId: userIdSchema.optional(),
    userEmail: emailSchema.optional(),
  })
  .passthrough();

export const linksQuerySchema = z.object({
  userId: userIdSchema.optional(),
  userEmail: emailSchema.optional(),
  limit: z.string().optional().transform((v) => v ?? "500"),
  page: z.string().optional().transform((v) => v ?? "1"),
  forceRefresh: z.string().optional(),
  _t: z.string().optional(),
});

// ─── Analytics ──────────────────────────────────────────────────────────────

export const analyticsQuerySchema = z.object({
  userId: userIdSchema.optional(),
  userEmail: emailSchema.optional(),
  linkId: z.string().trim().max(254).optional().transform((v) => v || undefined),
  period: z.string().max(20).optional().default("30d"),
  range: z.string().max(20).optional(),
  forceRefresh: z.string().optional(),
  _t: z.string().optional(),
});

export const analyticsExportQuerySchema = z.object({
  userId: userIdSchema.optional(),
  userEmail: emailSchema.optional(),
  format: z.enum(["csv", "excel", "json", "zip"]).optional().default("excel"),
  period: z.string().max(20).optional(),
  range: z.string().max(20).optional(),
  linkId: z.string().trim().max(254).optional().transform((v) => v || undefined),
});

// ─── Domains ────────────────────────────────────────────────────────────────

export const domainNameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(253, "Domain name is too long")
  .transform((v) =>
    v
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .replace(/:\d+$/, "")
      .replace(/\.$/, "")
  )
  .pipe(
    z
      .string()
      .regex(
        /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/,
        "Invalid domain name format"
      )
  );

export const domainCreateBodySchema = z.object({
  domain: domainNameSchema.optional(),
  domain_name: domainNameSchema.optional(),
}).refine((d) => d.domain || d.domain_name, "Domain name is required");

export const domainVerifyBodySchema = z.object({
  id: z.string().trim().max(254).optional(),
  domainId: z.string().trim().max(254).optional(),
  domain: domainNameSchema.optional(),
  domain_name: domainNameSchema.optional(),
}).refine((d) => d.domain || d.domain_name, "Domain name is required to verify DNS records.");

export const domainDeleteQuerySchema = z.object({
  id: idSchema,
});

// ─── Pixels ─────────────────────────────────────────────────────────────────

export const pixelPlatformSchema = z.enum([
  "meta",
  "facebook",
  "instagram",
  "google",
  "google_tag",
  "youtube",
  "tiktok",
  "linkedin",
  "twitter",
  "x",
  "snapchat",
  "pinterest",
  "reddit",
  "quora",
  "bing",
  "taboola",
  "outbrain",
  "custom",
]);

const pixelIdValueSchema = z
  .string()
  .trim()
  .regex(/^[A-Za-z0-9_-]{2,64}$/, "Invalid Pixel ID (letters, numbers, hyphens, underscores; 2-64 chars)");

const pixelBaseBodySchema = z.object({
  platform: pixelPlatformSchema.optional(),
  type: pixelPlatformSchema.optional(),
  pixelId: pixelIdValueSchema.optional(),
  pixel_id: pixelIdValueSchema.optional(),
  name: z.string().trim().max(100).optional(),
  isActive: z.boolean().optional().default(true),
  events: z.array(z.string().trim().max(100)).max(50).optional(),
  apiToken: z.string().max(500).optional(),
  conversionApiToken: z.string().max(500).optional(),
  testEventCode: z.string().max(100).optional(),
  trackAllPages: z.boolean().optional(),
}).passthrough();

export const pixelCreateBodySchema = pixelBaseBodySchema.refine(
  (d) => Boolean(d.pixelId || d.pixel_id),
  { message: "pixelId is required", path: ["pixelId"] }
);

export const pixelUpdateBodySchema = pixelBaseBodySchema.partial();

export const pixelDeleteQuerySchema = z.object({
  id: idSchema,
});

export const pixelIdParamsSchema = z.object({
  id: idSchema,
});

// ─── Webhooks ───────────────────────────────────────────────────────────────

export const webhookEventSchema = z.enum([
  "click.created",
  "click.unique",
  "conversion.created",
  "link.created",
  "link.updated",
  "link.deleted",
  "link.expired",
  "qr.scanned",
  "target.reached",
  "subscription.activated",
  "subscription.cancelled",
  "subscription.renewed",
]);

export const webhookCreateBodySchema = z.object({
  url: safeHttpUrlSchema,
  events: z.array(webhookEventSchema).min(1).max(20).optional().default(["click.created"]),
  isActive: z.boolean().optional().default(true),
  name: z.string().trim().max(100).optional(),
  secret: z.string().trim().max(256).optional(),
  secretKey: z.string().trim().max(256).optional(),
  linkId: z.string().trim().max(254).optional(),
  description: z.string().trim().max(500).optional(),
}).passthrough();

export const webhookUpdateBodySchema = webhookCreateBodySchema.partial().extend({
  url: safeHttpUrlSchema.optional(),
  events: z.array(webhookEventSchema).min(1).max(20).optional(),
});

export const webhookTestBodySchema = z.object({
  url: safeHttpUrlSchema,
  secretKey: z.string().trim().max(256).optional(),
});

export const webhookIdParamsSchema = z.object({ id: idSchema });

// ─── API Keys ────────────────────────────────────────────────────────────────

export const apiKeyCreateBodySchema = z.object({
  name: z.string().trim().min(1, "Key name is required").max(100).optional().default("Clé API"),
  scope: z.enum(["read", "read_write"]).optional().default("read_write"),
  scopes: z.array(z.string().trim().max(100)).max(50).optional(),
  userId: userIdSchema.optional(),
  userEmail: emailSchema.optional(),
  expiresAt: z.string().datetime({ offset: true }).optional().nullable(),
  rateLimit: z.number().int().positive().max(10000).optional(),
}).passthrough();

export const apiKeyIdParamsSchema = z.object({ keyId: idSchema });

// ─── Targets (Alerts) ────────────────────────────────────────────────────────

export const targetMetricTypeSchema = z.enum(["clicks", "revenue", "conversions", "unique_clicks", "both"]);
export const targetPeriodSchema = z.enum(["day", "week", "month", "year"]);
export const targetStatusSchema = z.enum(["active", "paused", "completed"]);

export const targetCreateBodySchema = z
  .object({
    targetValue: z.number().positive("Target value must be positive").optional(),
    clicksTargetValue: z.number().positive().optional(),
    revenueTargetValue: z.number().positive().optional(),
    metricType: targetMetricTypeSchema.optional().default("clicks"),
    period: targetPeriodSchema.optional().default("month"),
    linkId: z.string().trim().max(254).optional().nullable(),
    title: z.string().trim().max(200).optional(),
    notifyExpired: z.boolean().optional(),
    notify_expired: z.boolean().optional(),
    notifyEmail: z.boolean().optional(),
    notify_email: z.boolean().optional(),
    notifyBell: z.boolean().optional(),
    notify_bell: z.boolean().optional(),
    status: targetStatusSchema.optional().default("active"),
    schedule: z.enum(["instantly", "daily", "weekly"]).optional().default("instantly"),
    userId: z.string().trim().max(254).optional(),
  })
  .passthrough();

export const targetUpdateBodySchema = targetCreateBodySchema.partial();

export const targetNotifyBodySchema = z
  .object({
    metricType: z.enum(["revenue", "clicks", "conversions", "unique_clicks"]).optional().default("revenue"),
    achievedValue: z.number().optional(),
    targetValue: z.number().optional(),
    monthLabel: z.string().trim().max(100).optional(),
    linkTitle: z.string().trim().max(200).optional(),
    slug: z.string().trim().max(100).optional(),
    isExpirationWarning: z.boolean().optional().default(false),
    email: emailSchema.optional(),
    name: z.string().trim().max(100).optional(),
  })
  .passthrough();

export const targetIdParamsSchema = z.object({ id: idSchema });

// ─── Feedback ────────────────────────────────────────────────────────────────

export const feedbackBodySchema = z.object({
  email: emailSchema.optional().or(z.literal("")).transform((v) => v || undefined),
  category: z.string().trim().min(1, "Category is required").max(50),
  message: z.string().trim().min(1, "Message is required").max(5000),
  pageContext: z.string().trim().max(500).optional(),
  rating: z.union([
    z.number().int().min(1).max(5),
    z.number().int().min(0).max(10),
  ]).optional(),
});

// ─── Billing ─────────────────────────────────────────────────────────────────

export const billingCheckoutBodySchema = z.object({
  planId: z.enum(["PRO", "BUSINESS", "ENTERPRISE"]),
  cycle: z.string().transform((s) => s.toUpperCase()).pipe(billingCycleSchema),
  orgId: z.string().trim().max(254).optional(),
  successUrl: redirectUrlSchema.optional(),
  cancelUrl: redirectUrlSchema.optional(),
  companyName: z.string().trim().max(200).optional(),
  discountId: z.string().trim().max(100).optional(),
  force: z.boolean().optional().default(false),
  customerEmail: emailSchema.optional(),
  userId: z.string().trim().max(254).optional(),
});

export const verifyTransactionBodySchema = z.object({
  subscriptionId: z.string().trim().max(500).optional(),
  plan: z.enum(["PRO", "BUSINESS", "ENTERPRISE"]).optional(),
});

export const subscriptionCancelBodySchema = z.object({
  reason: z.string().trim().max(500).optional().default(""),
  feedback: z.string().trim().max(2000).optional().default(""),
  rating: z.number().int().min(1).max(5).optional(),
});

export const invoiceIdParamsSchema = z.object({
  invoiceId: idSchema,
});

export const imageIdParamsSchema = z.object({
  id: z.string().trim().min(1).max(254),
});

export const billingQuotaQuerySchema = z.object({
  plan: z.string().trim().max(50).optional(),
  clicks: z.string().optional().transform((v) => (v !== undefined ? Math.max(0, Number(v) || 0) : undefined)),
});

// ─── User ────────────────────────────────────────────────────────────────────

export const userSyncBodySchema = z.object({
  id: z.string().trim().max(254).optional(),
  name: z.string().trim().max(80).optional(),
  email: emailSchema.optional(),
  avatarUrl: z.string().trim().max(2048).optional().nullable(),
  provider: z.string().trim().max(50).optional(),
  plan: planSchema.optional(),
});

export const userPatchBodySchema = z.object({
  name: nameSchema.optional(),
  fullName: nameSchema.optional(),
  avatarUrl: z.union([z.literal(""), safeHttpUrlSchema, z.null()]).optional(),
  avatar_url: z.union([z.literal(""), safeHttpUrlSchema, z.null()]).optional(),
  language: z.string().trim().max(35).optional().nullable(),
  timezone: z.string().trim().max(64).optional().nullable(),
  plan: planSchema.optional(),
});

// ─── Upload ──────────────────────────────────────────────────────────────────

export const uploadJsonBodySchema = z
  .object({
    data: z
      .string()
      .trim()
      .regex(
        /^data:(image\/(jpeg|png|webp|gif|svg\+xml));base64,[A-Za-z0-9+/]+=*$/i,
        "Invalid image Data URI"
      )
      .optional(),
    image: z
      .string()
      .trim()
      .regex(
        /^data:(image\/(jpeg|png|webp|gif|svg\+xml));base64,[A-Za-z0-9+/]+=*$/i,
        "Invalid image Data URI"
      )
      .optional(),
  })
  .refine((d) => d.data || d.image, "Image data URI is required");

// ─── Cron Routes ─────────────────────────────────────────────────────────────

export const cronQuerySchema = z.object({
  secret: z.string().trim().max(256).optional(),
  force: z.string().optional().transform((v) => v === "true"),
});

// ─── Helper — parse & répondre avec erreur standardisée ──────────────────────

import { NextResponse } from "next/server";
import type { ZodSchema, ZodError } from "zod";

/**
 * Parse un body JSON de Request avec le schéma Zod fourni.
 * Retourne { data, error } — error est une NextResponse prête à renvoyer.
 */
export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ data: T; error: null } | { data: null; error: NextResponse }> {
  let raw: unknown;
  try {
    const text = await req.text();
    raw = text && text.trim() ? JSON.parse(text) : {};
  } catch {
    return {
      data: null,
      error: NextResponse.json(
        { success: false, error: "Invalid JSON body" },
        { status: 400 }
      ),
    };
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          success: false,
          error: "Validation error",
          details: formatZodErrors(result.error),
        },
        { status: 400 }
      ),
    };
  }
  return { data: result.data, error: null };
}

/**
 * Parse les searchParams d'une URL avec le schéma Zod fourni.
 * Retourne { data, error } — error est une NextResponse prête à renvoyer.
 */
export function parseQuery<T>(
  searchParams: URLSearchParams,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  const raw = Object.fromEntries(searchParams.entries());
  const result = schema.safeParse(raw);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          success: false,
          error: "Invalid query parameters",
          details: formatZodErrors(result.error),
        },
        { status: 400 }
      ),
    };
  }
  return { data: result.data, error: null };
}

/**
 * Parse les paramètres d'une route dynamique (ex: params: { id: string }) avec le schéma Zod.
 * Retourne { data, error } — error est une NextResponse prête à renvoyer.
 */
export function parseParams<T>(
  params: unknown,
  schema: ZodSchema<T>
): { data: T; error: null } | { data: null; error: NextResponse } {
  const result = schema.safeParse(params);
  if (!result.success) {
    return {
      data: null,
      error: NextResponse.json(
        {
          success: false,
          error: "Invalid route parameters",
          details: formatZodErrors(result.error),
        },
        { status: 400 }
      ),
    };
  }
  return { data: result.data, error: null };
}

/** Formate les erreurs Zod pour le client (messages lisibles, sans stack). */
export function formatZodErrors(zodError: ZodError): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const issue of zodError.issues) {
    const path = issue.path.join(".") || "_root";
    if (!out[path]) out[path] = [];
    out[path].push(issue.message);
  }
  return out;
}

// ─── Validation des Réponses Sortantes (Outgoing Data) ────────────────────────

export const apiSuccessResponseSchema = z
  .object({
    success: z.literal(true),
    message: z.string().optional(),
    data: z.any().optional(),
  })
  .passthrough();

export const apiErrorResponseSchema = z
  .object({
    success: z.literal(false),
    error: z.string(),
    code: z.string().optional(),
    details: z.record(z.string(), z.array(z.string())).optional(),
  })
  .passthrough();

/**
 * Construit et valide une réponse JSON sortante avec Zod.
 * Garantit que la structure envoyée au client respecte strictement le contrat API.
 */
export function jsonResponse<T>(
  data: unknown,
  schema?: ZodSchema<T>,
  init?: ResponseInit
): NextResponse {
  if (schema) {
    const parsed = schema.safeParse(data);
    if (parsed.success) {
      return NextResponse.json(parsed.data, init);
    } else {
      console.warn("[API Outgoing Schema Warning]:", formatZodErrors(parsed.error));
    }
  }
  return NextResponse.json(data, init);
}
