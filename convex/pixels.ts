import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listPixels = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("retargetingPixels")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
  },
});

export const addPixel = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const id = await ctx.db.insert("retargetingPixels", {
      userId: args.userId,
      platform: args.platform,
      pixelId: args.pixelId.trim(),
      name: args.name,
      isActive: true,
      eventsTrackedCount: 0,
      createdAt: new Date().toISOString(),
    });
    return { id, success: true };
  },
});

export const deletePixel = mutation({
  args: { id: v.id("retargetingPixels") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

export const togglePixel = mutation({
  args: { id: v.id("retargetingPixels"), isActive: v.boolean() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, {
      isActive: args.isActive,
    });
    return { success: true };
  },
});
