import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Get subscription by organization ID ─────────────────────────────────────
export const getSubscription = query({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    if (!args.orgId) return null;
    try {
      // 1. Exact match on orgId
      const direct = await ctx.db
        .query("subscriptions")
        .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
        .first();
      if (direct) return direct;

      // 2. Try alternate orgId format (with or without "org_" prefix)
      const altOrgId = args.orgId.startsWith("org_")
        ? args.orgId.replace(/^org_/, "")
        : `org_${args.orgId}`;

      const alt = await ctx.db
        .query("subscriptions")
        .withIndex("by_orgId", (q) => q.eq("orgId", altOrgId))
        .first();
      if (alt) return alt;

      return null;
    } catch (err) {
      console.warn("[subscriptions:getSubscription] Safe catch:", err);
      return null;
    }
  },
});

// ─── Upsert subscription (created or updated from Paddle webhook) ───────────
export const upsertSubscription = mutation({
  args: {
    orgId: v.string(),
    provider: v.string(),
    providerSubscriptionId: v.string(),
    currentPeriodStart: v.number(),
    currentPeriodEnd: v.number(),
    cancelAtPeriodEnd: v.boolean(),
    plan: v.optional(v.string()),
    cycle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const altOrgId = args.orgId.startsWith("org_")
      ? args.orgId.replace(/^org_/, "")
      : `org_${args.orgId}`;

    const existing =
      (await ctx.db
        .query("subscriptions")
        .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
        .first()) ||
      (await ctx.db
        .query("subscriptions")
        .withIndex("by_orgId", (q) => q.eq("orgId", altOrgId))
        .first());

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        provider: args.provider,
        providerSubscriptionId: args.providerSubscriptionId,
        currentPeriodStart: args.currentPeriodStart,
        currentPeriodEnd: args.currentPeriodEnd,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        plan: args.plan,
        cycle: args.cycle,
        updatedAt: now,
      });
      return { id: existing._id, updated: true };
    }

    const id = await ctx.db.insert("subscriptions", {
      orgId: args.orgId,
      provider: args.provider,
      providerSubscriptionId: args.providerSubscriptionId,
      currentPeriodStart: args.currentPeriodStart,
      currentPeriodEnd: args.currentPeriodEnd,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      plan: args.plan,
      cycle: args.cycle,
      createdAt: now,
      updatedAt: now,
    });

    return { id, created: true };
  },
});

// ─── Set cancelAtPeriodEnd status (called by cancel/resume API) ──────────────
export const setCancelAtPeriodEnd = mutation({
  args: {
    orgId: v.string(),
    cancelAtPeriodEnd: v.boolean(),
    currentPeriodEnd: v.optional(v.number()),
    providerSubscriptionId: v.optional(v.string()),
    plan: v.optional(v.string()),
    cycle: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = new Date().toISOString();
    const altOrgId = args.orgId.startsWith("org_")
      ? args.orgId.replace(/^org_/, "")
      : `org_${args.orgId}`;

    const existing =
      (await ctx.db
        .query("subscriptions")
        .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
        .first()) ||
      (await ctx.db
        .query("subscriptions")
        .withIndex("by_orgId", (q) => q.eq("orgId", altOrgId))
        .first());

    if (existing) {
      const patchData: any = {
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        updatedAt: now,
      };
      if (typeof args.currentPeriodEnd === "number") {
        patchData.currentPeriodEnd = args.currentPeriodEnd;
      }
      if (args.providerSubscriptionId) {
        patchData.providerSubscriptionId = args.providerSubscriptionId;
      }
      if (args.plan) {
        patchData.plan = args.plan;
      }
      if (args.cycle) {
        patchData.cycle = args.cycle;
      }

      await ctx.db.patch(existing._id, patchData);
      return { success: true, updated: true };
    }

    // If no document exists yet, create one
    const id = await ctx.db.insert("subscriptions", {
      orgId: args.orgId,
      provider: "paddle",
      providerSubscriptionId: args.providerSubscriptionId || `sub_manual_${Date.now()}`,
      currentPeriodStart: Date.now(),
      currentPeriodEnd: args.currentPeriodEnd || Date.now() + 30 * 86400000,
      cancelAtPeriodEnd: args.cancelAtPeriodEnd,
      plan: args.plan || "PRO",
      cycle: args.cycle || "MONTHLY",
      createdAt: now,
      updatedAt: now,
    });

    return { success: true, created: true, id };
  },
});

// ─── Mark subscription canceled at period end ────────────────────────────────
export const markSubscriptionCanceled = mutation({
  args: {
    providerSubscriptionId: v.string(),
  },
  handler: async (ctx, args) => {
    const all = await ctx.db.query("subscriptions").collect();
    const sub = all.find((s) => s.providerSubscriptionId === args.providerSubscriptionId);

    if (sub) {
      await ctx.db.patch(sub._id, {
        cancelAtPeriodEnd: true,
        updatedAt: new Date().toISOString(),
      });
      return { success: true };
    }

    return { success: false, notFound: true };
  },
});
