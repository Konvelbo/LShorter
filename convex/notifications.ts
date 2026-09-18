import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── List notifications for an organization or user ─────────────────────────
export const listNotifications = query({
  args: { orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.orgId) return [];
    try {
      const notifs = await ctx.db
        .query("notifications")
        .filter((q) => q.eq(q.field("orgId"), args.orgId))
        .collect();

      return notifs
        .sort((a, b) => ((b.createdAt || b._creationTime || 0) - (a.createdAt || a._creationTime || 0)))
        .slice(0, 50);
    } catch (err) {
      console.warn("[notifications:listNotifications] Fallback catch:", err);
      return [];
    }
  },
});

// ─── Get count of unread notifications ──────────────────────────────────────
export const getUnreadCount = query({
  args: { orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.orgId) return 0;
    try {
      const unread = await ctx.db
        .query("notifications")
        .filter((q) =>
          q.and(
            q.eq(q.field("orgId"), args.orgId),
            q.eq(q.field("isRead"), false)
          )
        )
        .collect();
      return unread.length;
    } catch (err) {
      console.warn("[notifications:getUnreadCount] Fallback catch:", err);
      return 0;
    }
  },
});

// ─── Create a notification ──────────────────────────────────────────────────
export const createNotification = mutation({
  args: {
    orgId: v.string(),
    title: v.string(),
    message: v.string(),
    type: v.union(
      v.literal("INFO"),
      v.literal("WARNING"),
      v.literal("ALERT"),
      v.literal("SUCCESS")
    ),
    linkUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      const id = await ctx.db.insert("notifications", {
        orgId: args.orgId,
        title: args.title,
        message: args.message,
        type: args.type,
        linkUrl: args.linkUrl,
        isRead: false,
        createdAt: Date.now(),
      });
      return { id, success: true };
    } catch (err: any) {
      console.error("[notifications:createNotification] Error:", err);
      return { success: false, error: err?.message };
    }
  },
});

// ─── Mark a single notification as read ─────────────────────────────────────
export const markAsRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    try {
      await ctx.db.patch(args.notificationId, { isRead: true });
      return { success: true };
    } catch (err: any) {
      console.error("[notifications:markAsRead] Error:", err);
      return { success: false, error: err?.message };
    }
  },
});

// ─── Mark all notifications as read for an org ──────────────────────────────
export const markAllAsRead = mutation({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    try {
      const unread = await ctx.db
        .query("notifications")
        .filter((q) =>
          q.and(
            q.eq(q.field("orgId"), args.orgId),
            q.eq(q.field("isRead"), false)
          )
        )
        .collect();

      for (const notif of unread) {
        await ctx.db.patch(notif._id, { isRead: true });
      }
      return { success: true, count: unread.length };
    } catch (err: any) {
      console.error("[notifications:markAllAsRead] Error:", err);
      return { success: false, error: err?.message };
    }
  },
});

// ─── Delete a single notification ───────────────────────────────────────────
export const deleteNotification = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, args) => {
    try {
      await ctx.db.delete(args.notificationId);
      return { success: true };
    } catch (err: any) {
      console.error("[notifications:deleteNotification] Error:", err);
      return { success: false, error: err?.message };
    }
  },
});

// ─── Delete all notifications for an org/user ──────────────────────────────
export const clearAllNotifications = mutation({
  args: { orgId: v.string() },
  handler: async (ctx, args) => {
    try {
      const notifs = await ctx.db
        .query("notifications")
        .filter((q) => q.eq(q.field("orgId"), args.orgId))
        .collect();

      for (const notif of notifs) {
        await ctx.db.delete(notif._id);
      }
      return { success: true, count: notifs.length };
    } catch (err: any) {
      console.error("[notifications:clearAllNotifications] Error:", err);
      return { success: false, error: err?.message };
    }
  },
});

