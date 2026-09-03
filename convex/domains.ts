import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listUserDomains = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const domains = await ctx.db
      .query("domains")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .collect();
    return domains;
  },
});

export const addDomain = mutation({
  args: {
    userId: v.string(),
    domain: v.string(),
  },
  handler: async (ctx, args) => {
    const cleanDomain = args.domain.trim().toLowerCase().replace(/^https?:\/\//, "");

    const existing = await ctx.db
      .query("domains")
      .withIndex("by_domain", (q) => q.eq("domain", cleanDomain))
      .first();

    if (existing) {
      throw new Error(`Le domaine '${cleanDomain}' est déjà enregistré.`);
    }

    const now = new Date().toISOString();

    const domainId = await ctx.db.insert("domains", {
      userId: args.userId,
      domain: cleanDomain,
      isCustom: true,
      status: "pending",
      isDefault: false,
      sslStatus: "pending",
      dnsTarget: "cname.lshorter.io",
      createdAt: now,
    });

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        domainsCount: (user.domainsCount || 0) + 1,
        updatedAt: now,
      });
    }

    return { id: domainId, domain: cleanDomain };
  },
});

export const deleteDomain = mutation({
  args: { id: v.id("domains"), userId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (user && (user.domainsCount || 0) > 0) {
      await ctx.db.patch(user._id, {
        domainsCount: Math.max(0, (user.domainsCount || 0) - 1),
        updatedAt: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});
