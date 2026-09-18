import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Get organization by slug or user ID ─────────────────────────────────────
export const getOrganization = query({
  args: { slug: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

// ─── Get or create default organization for a user ───────────────────────────
export const getOrCreateUserOrganization = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    plan: v.optional(v.union(v.literal("FREE"), v.literal("FREEMIUM"), v.literal("PRO"), v.literal("BUSINESS"), v.literal("ENTERPRISE"))),
  },
  handler: async (ctx, args) => {
    const slug = `org_${args.userId}`;
    let existing = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", slug))
      .first();

    const planNormalized = (args.plan === "FREEMIUM" ? "FREE" : args.plan) || "FREE";

    if (existing) {
      if (args.plan && existing.plan !== planNormalized) {
        await ctx.db.patch(existing._id, {
          plan: planNormalized as any,
          updatedAt: new Date().toISOString(),
        });
      }
      return existing;
    }

    const now = new Date().toISOString();
    const orgId = await ctx.db.insert("organizations", {
      name: args.name || "Default Organization",
      slug,
      plan: planNormalized as any,
      billingCycle: "MONTHLY",
      billingEmail: args.email,
      companyName: args.name,
      createdAt: now,
      updatedAt: now,
    });

    return await ctx.db.get(orgId);
  },
});

// ─── Update legal billing details ───────────────────────────────────────────
export const updateBillingDetails = mutation({
  args: {
    orgId: v.string(),
    companyName: v.string(),
    taxId: v.optional(v.string()),
    billingAddress: v.string(),
    billingEmail: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let org = await ctx.db
      .query("organizations")
      .withIndex("by_slug", (q) => q.eq("slug", args.orgId))
      .first();

    if (!org) {
      const allOrgs = await ctx.db.query("organizations").collect();
      org = allOrgs.find((o) => (o._id as string) === args.orgId || o.slug === args.orgId) || null;
    }

    const now = new Date().toISOString();

    if (org) {
      await ctx.db.patch(org._id, {
        companyName: args.companyName,
        taxId: args.taxId,
        billingAddress: args.billingAddress,
        billingEmail: args.billingEmail,
        updatedAt: now,
      });
      return { success: true };
    }

    // Otherwise create organization entry with slug = orgId
    await ctx.db.insert("organizations", {
      name: args.companyName || "Organization",
      slug: args.orgId,
      plan: "FREE",
      billingCycle: "MONTHLY",
      companyName: args.companyName,
      taxId: args.taxId,
      billingAddress: args.billingAddress,
      billingEmail: args.billingEmail,
      createdAt: now,
      updatedAt: now,
    });

    return { success: true };
  },
});
