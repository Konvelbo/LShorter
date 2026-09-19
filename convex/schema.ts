import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── 1. Users (Identity & Core Account — Clicks/Links/Domains live in Cloudflare) ─
  users: defineTable({
    userId: v.string(),           // NextAuth session token sub / OAuth provider ID
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    passwordHash: v.optional(v.string()),  // bcrypt hash — only set for email/password accounts
    provider: v.optional(v.string()),      // "google" | "github" | "credentials"
    plan: v.union(v.literal("FREE"), v.literal("FREEMIUM"), v.literal("STARTER"), v.literal("PRO"), v.literal("BUSINESS"), v.literal("ENTERPRISE")),
    hasCompletedOnboarding: v.boolean(),
    twoFactorEnabled: v.optional(v.boolean()),
    twoFactorSecret: v.optional(v.string()),
    twoFactorRecoveryCodes: v.optional(v.array(v.string())),
    twoFactorVerifiedAt: v.optional(v.string()),
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

  // ─── 2. Scheduled Welcome Emails (Sent 2h after registration via Resend) ────────
  scheduledWelcomeEmails: defineTable({
    userId: v.string(),
    email: v.string(),
    name: v.string(),
    scheduledAt: v.number(),
    status: v.union(v.literal("PENDING"), v.literal("SENT"), v.literal("FAILED")),
    sentAt: v.optional(v.number()),
    createdAt: v.string(),
  })
    .index("by_status_scheduledAt", ["status", "scheduledAt"])
    .index("by_email", ["email"]),

  // ─── 3. User Feedbacks & NPS ──────────────────────────────────────────────────
  feedbacks: defineTable({
    email: v.string(),
    category: v.string(),
    message: v.string(),
    pageContext: v.optional(v.string()),
    rating: v.optional(v.number()),
    createdAt: v.string(),
  }).index("by_email", ["email"]),

  // ─── 4. Onboarding Questionnaire Responses ────────────────────────────────────
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

  // ─── 5. Organizations / Workspaces (Control Plane) ───────────────────────────
  organizations: defineTable({
    name: v.string(),
    slug: v.string(),
    plan: v.union(
      v.literal("FREE"),
      v.literal("FREEMIUM"),
      v.literal("PRO"),
      v.literal("BUSINESS"),
      v.literal("ENTERPRISE")
    ),
    billingCycle: v.union(v.literal("MONTHLY"), v.literal("YEARLY")),
    trialEndsAt: v.optional(v.number()),
    taxId: v.optional(v.string()),
    billingAddress: v.optional(v.string()),
    companyName: v.optional(v.string()),
    billingEmail: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  }).index("by_slug", ["slug"]),

  // ─── 6. Subscriptions (Control Plane) ────────────────────────────────────────
  subscriptions: defineTable({
    orgId: v.string(),
    provider: v.string(), // "mock", "lemonsqueezy", "stripe", "paystack"
    providerSubscriptionId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    plan: v.optional(v.string()),
    cycle: v.optional(v.string()),
    createdAt: v.optional(v.string()),
    updatedAt: v.optional(v.string()),
  }).index("by_orgId", ["orgId"]),

  // ─── 7. In-App Notifications Center ──────────────────────────────────────────
  notifications: defineTable({
    orgId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("INFO"),
      v.literal("WARNING"),
      v.literal("ALERT"),
      v.literal("SUCCESS")
    ),
    isRead: v.boolean(),
    linkUrl: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_orgId", ["orgId"])
    .index("by_orgId_and_read", ["orgId", "isRead"]),

  // ─── 8. Certified Paid Invoices ─────────────────────────────────────────────
  invoices: defineTable({
    orgId: v.string(),
    invoiceNumber: v.string(), // ex: "INV-2026-001"
    planId: v.union(
      v.literal("PRO"),
      v.literal("BUSINESS"),
      v.literal("ENTERPRISE")
    ),
    amountPaid: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
    createdAt: v.number(),
    currency: v.optional(v.string()),
    status: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    overageAmount: v.optional(v.number()),
    batchesOverage: v.optional(v.number()),
  })
    .index("by_orgId", ["orgId"])
    .index("by_invoiceNumber", ["invoiceNumber"]),
});
