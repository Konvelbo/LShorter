import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listWebhooks = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("webhooks")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const addWebhook = mutation({
  args: {
    userId: v.string(),
    url: v.string(),
    events: v.array(v.string()),
    secretKey: v.string(),
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("webhooks", {
      userId: args.userId,
      url: args.url.trim(),
      events: args.events,
      isActive: true,
      secretKey: args.secretKey,
      lastStatus: 200,
      createdAt: new Date().toISOString(),
    });
    return { id, success: true };
  },
});

export const deleteWebhook = mutation({
  args: { id: v.id("webhooks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const toggleWebhook = mutation({
  args: { id: v.id("webhooks"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: args.isActive,
    });
    return { success: true };
  },
});
