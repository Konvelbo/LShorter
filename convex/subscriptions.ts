import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Get subscription by organization ID ─────────────────────────────────────
export const getSubscription = query({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("subscriptions")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .first();
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
    const existing = await ctx.db
      .query("subscriptions")
      .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId))
      .first();

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
