import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Users (Identity + Plan only — clicks/links/domains live in Cloudflare D1) ─
  users: defineTable({
    userId: v.string(),           // NextAuth session token sub / OAuth provider ID
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    passwordHash: v.optional(v.string()),  // bcrypt hash — only set for email/password accounts
    provider: v.optional(v.string()),      // "google" | "github" | "credentials"
    plan: v.union(v.literal("FREEMIUM"), v.literal("PRO"), v.literal("BUSINESS")),
    hasCompletedOnboarding: v.boolean(),
    twoFactorEnabled: v.optional(v.boolean()),
    twoFactorSecret: v.optional(v.string()),
    // ─── Legacy fields (tolerated as optional so existing documents validate) ─
    clicksThisMonth: v.optional(v.number()),
    clicksLimit: v.optional(v.number()),
    domainsCount: v.optional(v.number()),
    domainsLimit: v.optional(v.number()),
    linksCount: v.optional(v.number()),
    linksLimit: v.optional(v.number()),
    language: v.optional(v.string()),
    timezone: v.optional(v.string()),
    onboarding: v.optional(
      v.object({
        country: v.optional(v.string()),
        city: v.optional(v.string()),
        language: v.optional(v.string()),
        profession: v.optional(v.string()),
        professionOther: v.optional(v.string()),
        source: v.optional(v.string()),
        sourceOther: v.optional(v.string()),
        useCases: v.optional(v.array(v.string())),
        useCasesOther: v.optional(v.string()),
        role: v.optional(v.string()),
        goal: v.optional(v.string()),
        workspaceName: v.optional(v.string()),
        monthlyClicksEstimate: v.optional(v.string()),
        completedAt: v.string(),
      })
    ),
    createdAt: v.string(),
    updatedAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_email", ["email"]),

  // ─── Password Reset PIN Tokens (15 min validity via Resend) ───────────────────
  passwordResetTokens: defineTable({
    email: v.string(),
    pin: v.string(),
    expiresAt: v.number(),
    used: v.boolean(),
    createdAt: v.string(),
  })
    .index("by_email", ["email"])
    .index("by_email_pin", ["email", "pin"]),

  // ─── User Feedbacks ───────────────────────────────────────────────────────────
  feedbacks: defineTable({
    email: v.string(),
    category: v.string(),
    message: v.string(),
    pageContext: v.optional(v.string()),
    createdAt: v.string(),
  }).index("by_email", ["email"]),

  // ─── Onboarding questionnaire responses ───────────────────────────────────────
  onboarding: defineTable({
    userId: v.string(),
    email: v.string(),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    language: v.optional(v.string()),
    profession: v.optional(v.string()),
    professionOther: v.optional(v.string()),
    source: v.optional(v.string()),
    sourceOther: v.optional(v.string()),
    useCases: v.optional(v.array(v.string())),
    useCasesOther: v.optional(v.string()),
    role: v.optional(v.string()),
    goal: v.optional(v.string()),
    workspaceName: v.optional(v.string()),
    monthlyClicksEstimate: v.optional(v.string()),
    submittedAt: v.string(),
  }).index("by_userId", ["userId"]),

  // ─── API Keys (metadata only — actual key validation via Cloudflare) ──────────
  apiKeys: defineTable({
    userId: v.string(),
    name: v.string(),
    keyPrefix: v.string(),
    keyHash: v.string(),
    permissions: v.array(v.string()),
    rateLimit: v.number(),
    createdAt: v.string(),
    lastUsedAt: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  // ─── Webhooks ─────────────────────────────────────────────────────────────────
  webhooks: defineTable({
    userId: v.string(),
    url: v.string(),
    events: v.array(v.string()),
    isActive: v.boolean(),
    secretKey: v.string(),
    lastStatus: v.optional(v.number()),
    createdAt: v.string(),
  }).index("by_userId", ["userId"]),

  // ─── Retargeting Pixels ───────────────────────────────────────────────────────
  retargetingPixels: defineTable({
    userId: v.string(),
    platform: v.union(
      v.literal("facebook"),
      v.literal("google"),
      v.literal("tiktok"),
      v.literal("twitter"),
      v.literal("linkedin")
    ),
    pixelId: v.string(),
    name: v.string(),
    isActive: v.boolean(),
    eventsTrackedCount: v.number(),
    createdAt: v.string(),
  }).index("by_userId", ["userId"]),

  // ─── Links Table (Convex type fallback) ──────────────────────────────────────
  links: defineTable({
    userId: v.string(),
    slug: v.string(),
    targetUrl: v.string(),
    domainName: v.string(),
    shortUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    clicksCount: v.optional(v.number()),
    uniqueClicks: v.optional(v.number()),
    conversionsCount: v.optional(v.number()),
    isPasswordProtected: v.optional(v.boolean()),
    password: v.optional(v.string()),
    isCloaked: v.optional(v.boolean()),
    cloaking: v.optional(v.boolean()),
    maxClicks: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    routingRules: v.optional(v.any()),
    geoTargeting: v.optional(v.any()),
    deviceTargeting: v.optional(v.any()),
    isActive: v.optional(v.boolean()),
    expiresAt: v.optional(v.string()),
    createdAt: v.string(),
    updatedAt: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_slug", ["slug"])
    .index("by_domain_slug", ["domainName", "slug"]),

  // ─── Domains Table ────────────────────────────────────────────────────────────
  domains: defineTable({
    userId: v.string(),
    domain: v.string(),
    status: v.string(),
    sslStatus: v.optional(v.string()),
    dnsTarget: v.optional(v.string()),
    isCustom: v.optional(v.boolean()),
    isDefault: v.optional(v.boolean()),
    createdAt: v.string(),
  })
    .index("by_userId", ["userId"])
    .index("by_domain", ["domain"]),

  // ─── Clicks Table (Legacy Convex Analytics) ───────────────────────────────────
  clicks: defineTable({
    userId: v.string(),
    linkId: v.optional(v.string()),
    slug: v.optional(v.string()),
    isUnique: v.optional(v.boolean()),
    revenue: v.optional(v.number()),
    countryCode: v.optional(v.string()),
    device: v.optional(v.string()),
    browser: v.optional(v.string()),
    referrer: v.optional(v.string()),
    ip: v.optional(v.string()),
    timestamp: v.optional(v.union(v.number(), v.string())),
    createdAt: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  // ─── Analytics Events Table ───────────────────────────────────────────────────
  analytics_events: defineTable({
    userId: v.string(),
    linkId: v.optional(v.string()),
    slug: v.string(),
    country: v.optional(v.string()),
    city: v.optional(v.string()),
    device: v.optional(v.string()),
    os: v.optional(v.string()),
    browser: v.optional(v.string()),
    referrer: v.optional(v.string()),
    timestamp: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_slug", ["slug"]),
});
