import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── Get user by session ID ────────────────────────────────────────────────────
export const getCurrentUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();
  },
});

// ─── Get user by email (used for credentials sign-in) ─────────────────────────
export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();
  },
});

// ─── Create or update user (called after OAuth sign-in) ───────────────────────
export const storeUser = mutation({
  args: {
    userId: v.string(),
    name: v.string(),
    email: v.string(),
    avatarUrl: v.optional(v.string()),
    provider: v.optional(v.string()),
    plan: v.optional(v.union(v.literal("FREEMIUM"), v.literal("PRO"), v.literal("BUSINESS"))),
  },
  handler: async (ctx, args) => {
    const cleanEmail = args.email.toLowerCase().trim();
    let existing = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!existing) {
      existing = await ctx.db
        .query("users")
        .withIndex("by_email", (q) => q.eq("email", cleanEmail))
        .first();
    }

    const now = new Date().toISOString();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name || existing.name,
        email: cleanEmail,
        avatarUrl: args.avatarUrl || existing.avatarUrl,
        provider: args.provider || existing.provider,
        updatedAt: now,
      });
      return { id: existing._id, userId: existing.userId, isNew: false };
    }

    const id = await ctx.db.insert("users", {
      userId: args.userId,
      name: args.name,
      email: cleanEmail,
      avatarUrl: args.avatarUrl,
      provider: args.provider,
      plan: args.plan || "FREEMIUM",
      hasCompletedOnboarding: false,
      createdAt: now,
      updatedAt: now,
    });

    return { id, isNew: true };
  },
});

// ─── Register with email + password (hashed by bcryptjs on the client action) ─
export const registerWithEmail = mutation({
  args: {
    name: v.string(),
    email: v.string(),
    passwordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email.toLowerCase()))
      .first();

    if (existing) {
      throw new Error("EMAIL_ALREADY_EXISTS");
    }

    const now = new Date().toISOString();
    const userId = `usr_${Date.now().toString(36)}`;

    const id = await ctx.db.insert("users", {
      userId,
      name: args.name,
      email: args.email.toLowerCase(),
      passwordHash: args.passwordHash,
      provider: "credentials",
      plan: "FREEMIUM",
      hasCompletedOnboarding: false,
      createdAt: now,
      updatedAt: now,
    });

    return { id, userId, isNew: true };
  },
});

// ─── Complete onboarding wizard ────────────────────────────────────────────────
export const completeOnboarding = mutation({
  args: {
    userId: v.string(),
    role: v.string(),
    goal: v.string(),
    source: v.string(),
    workspaceName: v.optional(v.string()),
    monthlyClicksEstimate: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    const now = new Date().toISOString();

    if (user) {
      await ctx.db.patch(user._id, {
        hasCompletedOnboarding: true,
        onboarding: {
          role: args.role,
          goal: args.goal,
          source: args.source,
          workspaceName: args.workspaceName,
          monthlyClicksEstimate: args.monthlyClicksEstimate,
          completedAt: now,
        },
        updatedAt: now,
      });

      await ctx.db.insert("onboarding", {
        userId: args.userId,
        email: user.email,
        role: args.role,
        goal: args.goal,
        source: args.source,
        workspaceName: args.workspaceName || "Mon Workspace",
        monthlyClicksEstimate: args.monthlyClicksEstimate,
        submittedAt: now,
      });
    }

    return { success: true };
  },
});

// ─── Update plan (called after payment confirmation) ──────────────────────────
export const updatePlan = mutation({
  args: {
    userId: v.string(),
    plan: v.union(v.literal("FREEMIUM"), v.literal("PRO"), v.literal("BUSINESS")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) throw new Error("USER_NOT_FOUND");

    await ctx.db.patch(user._id, {
      plan: args.plan,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// ─── One-shot migration: Strip legacy counter fields from existing users ───────
export const cleanLegacyFields = mutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").collect();
    let cleanedCount = 0;

    for (const user of users) {
      await ctx.db.replace(user._id, {
        userId: user.userId,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        passwordHash: user.passwordHash,
        provider: user.provider,
        plan: user.plan,
        hasCompletedOnboarding: user.hasCompletedOnboarding,
        onboarding: user.onboarding,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt || new Date().toISOString(),
      });
      cleanedCount++;
    }

    return { success: true, cleanedCount };
  },
});

// ─── Password Reset with PIN Token (Resend) ──────────────────────────────────
export const createPasswordResetToken = mutation({
  args: {
    email: v.string(),
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanEmail = args.email.toLowerCase().trim();
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .first();

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Invalidate existing unused tokens for this email
    const existingTokens = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .collect();

    for (const t of existingTokens) {
      if (!t.used) {
        await ctx.db.patch(t._id, { used: true });
      }
    }

    // Create new token valid for 15 minutes
    const expiresAt = Date.now() + 15 * 60 * 1000;
    const now = new Date().toISOString();

    const tokenId = await ctx.db.insert("passwordResetTokens", {
      email: cleanEmail,
      pin: args.pin,
      expiresAt,
      used: false,
      createdAt: now,
    });

    return { success: true, tokenId, expiresAt };
  },
});

export const verifyPasswordResetToken = query({
  args: {
    email: v.string(),
    pin: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanEmail = args.email.toLowerCase().trim();
    const token = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_email_pin", (q) => q.eq("email", cleanEmail).eq("pin", args.pin))
      .first();

    if (!token) {
      return { valid: false, reason: "INVALID_PIN" };
    }

    if (token.used) {
      return { valid: false, reason: "PIN_ALREADY_USED" };
    }

    if (Date.now() > token.expiresAt) {
      return { valid: false, reason: "PIN_EXPIRED" };
    }

    return { valid: true };
  },
});

export const resetPasswordWithToken = mutation({
  args: {
    email: v.string(),
    pin: v.string(),
    newPasswordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanEmail = args.email.toLowerCase().trim();
    const token = await ctx.db
      .query("passwordResetTokens")
      .withIndex("by_email_pin", (q) => q.eq("email", cleanEmail).eq("pin", args.pin))
      .first();

    if (!token || token.used || Date.now() > token.expiresAt) {
      throw new Error("INVALID_OR_EXPIRED_PIN");
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", cleanEmail))
      .first();

    if (!user) {
      throw new Error("USER_NOT_FOUND");
    }

    // Update password hash and mark token as used
    await ctx.db.patch(user._id, {
      passwordHash: args.newPasswordHash,
      updatedAt: new Date().toISOString(),
    });

    await ctx.db.patch(token._id, {
      used: true,
    });

    return { success: true };
  },
});

// ─── 2FA Settings (TOTP) ──────────────────────────────────────────────────────
export const update2FASettings = mutation({
  args: {
    userId: v.string(),
    enabled: v.boolean(),
    secret: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) throw new Error("USER_NOT_FOUND");

    await ctx.db.patch(user._id, {
      twoFactorEnabled: args.enabled,
      twoFactorSecret: args.enabled ? args.secret : undefined,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// ─── Change Password in Settings ──────────────────────────────────────────────
export const changePassword = mutation({
  args: {
    userId: v.string(),
    newPasswordHash: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (!user) throw new Error("USER_NOT_FOUND");

    await ctx.db.patch(user._id, {
      passwordHash: args.newPasswordHash,
      updatedAt: new Date().toISOString(),
    });

    return { success: true };
  },
});

// ─── Store User Feedback ──────────────────────────────────────────────────────
export const storeFeedback = mutation({
  args: {
    email: v.string(),
    category: v.string(),
    message: v.string(),
    pageContext: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("feedbacks", {
      email: args.email.toLowerCase().trim(),
      category: args.category,
      message: args.message,
      pageContext: args.pageContext,
      createdAt: new Date().toISOString(),
    });

    return { success: true, id };
  },
});
