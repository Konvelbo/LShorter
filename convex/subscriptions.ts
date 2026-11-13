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
        lifecycleStatus: "ACTIVE",
        lastLifecycleAlert: undefined,
        gracePeriodEndsAt: undefined,
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
      lifecycleStatus: "ACTIVE",
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
      if (!args.cancelAtPeriodEnd) {
        patchData.lifecycleStatus = "ACTIVE";
      }
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

// ─── Query: Get active/expiring/grace subscriptions for lifecycle processing ──
export const getAllSubscriptionsForLifecycle = query({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("subscriptions").collect();
    // Exclude subscriptions that are already fully downgraded
    return all.filter((s) => s.lifecycleStatus !== "DOWNGRADED" && s.plan !== "FREE" && s.plan !== "FREEMIUM");
  },
});

// ─── Mutation: Record lifecycle alert stage (5_DAYS, 3_DAYS, GRACE_PERIOD) ────
export const recordLifecycleAlert = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
    stage: v.string(), // "5_DAYS" | "3_DAYS" | "GRACE_PERIOD" | "DOWNGRADED"
    lifecycleStatus: v.string(), // "EXPIRING" | "GRACE_PERIOD" | "DOWNGRADED"
    gracePeriodEndsAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub) return { success: false, error: "NOT_FOUND" };

    const patchData: any = {
      lastLifecycleAlert: args.stage,
      lifecycleStatus: args.lifecycleStatus,
      updatedAt: new Date().toISOString(),
    };
    if (typeof args.gracePeriodEndsAt === "number") {
      patchData.gracePeriodEndsAt = args.gracePeriodEndsAt;
    }

    await ctx.db.patch(sub._id, patchData);
    return { success: true };
  },
});

// ─── Mutation: Downgrade subscription and user to FREE plan ───────────────────
export const downgradeSubscriptionToFree = mutation({
  args: {
    subscriptionId: v.id("subscriptions"),
  },
  handler: async (ctx, args) => {
    const sub = await ctx.db.get(args.subscriptionId);
    if (!sub) return { success: false, error: "NOT_FOUND" };

    const now = new Date().toISOString();

    // 1. Mark subscription as DOWNGRADED
    await ctx.db.patch(sub._id, {
      lifecycleStatus: "DOWNGRADED",
      lastLifecycleAlert: "DOWNGRADED",
      plan: "FREE",
      updatedAt: now,
    });

    // 2. Locate and downgrade user in "users" table
    const cleanUserId = sub.orgId.replace(/^org_/, "");
    const user =
      (await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", cleanUserId))
        .first()) ||
      (await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", sub.orgId))
        .first());

    if (user) {
      await ctx.db.patch(user._id, {
        plan: "FREE",
        updatedAt: now,
      });
    }

    return {
      success: true,
      userId: user?.userId || cleanUserId,
      email: user?.email,
      name: user?.name,
    };
  },
});

// ─── Mutation: Activate 24h Grace Period when renewal/payment fails ──────────
export const markSubscriptionGracePeriod = mutation({
  args: {
    providerSubscriptionId: v.optional(v.string()),
    orgId: v.optional(v.string()),
    gracePeriodEndsAt: v.number(),
  },
  handler: async (ctx, args) => {
    let sub = null;
    if (args.orgId) {
      const altOrgId = args.orgId.startsWith("org_")
        ? args.orgId.replace(/^org_/, "")
        : `org_${args.orgId}`;
      sub =
        (await ctx.db
          .query("subscriptions")
          .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId!))
          .first()) ||
        (await ctx.db
          .query("subscriptions")
          .withIndex("by_orgId", (q) => q.eq("orgId", altOrgId))
          .first());
    }

    if (!sub && args.providerSubscriptionId) {
      const all = await ctx.db.query("subscriptions").collect();
      sub =
        all.find((s) => s.providerSubscriptionId === args.providerSubscriptionId) ||
        null;
    }

    if (!sub || sub.plan === "FREE" || sub.plan === "FREEMIUM") {
      return { success: false, notFound: true };
    }

    // Preserve original 24h deadline if already in grace so retries do not reset the clock
    const alreadyInGrace = sub.lifecycleStatus === "GRACE_PERIOD";
    const resolvedGraceEnd =
      alreadyInGrace && typeof sub.gracePeriodEndsAt === "number"
        ? sub.gracePeriodEndsAt
        : args.gracePeriodEndsAt;

    if (!alreadyInGrace) {
      await ctx.db.patch(sub._id, {
        lifecycleStatus: "GRACE_PERIOD",
        lastLifecycleAlert: "GRACE_PERIOD",
        gracePeriodEndsAt: resolvedGraceEnd,
        updatedAt: new Date().toISOString(),
      });
    }

    const cleanUserId = sub.orgId.replace(/^org_/, "");
    const user =
      (await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", cleanUserId))
        .first()) ||
      (await ctx.db
        .query("users")
        .withIndex("by_userId", (q) => q.eq("userId", sub.orgId))
        .first());

    return {
      success: true,
      alreadyInGrace,
      subscriptionId: sub._id,
      orgId: sub.orgId,
      cleanUserId,
      plan: sub.plan || "PRO",
      gracePeriodEndsAt: resolvedGraceEnd,
      userEmail: user?.email,
      userName: user?.name || cleanUserId,
    };
  },
});
