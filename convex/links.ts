import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const listUserLinks = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const links = await ctx.db
      .query("links")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();
    return links;
  },
});

export const getLinkBySlug = query({
  args: { slug: v.string(), domainName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (args.domainName) {
      return await ctx.db
        .query("links")
        .withIndex("by_domain_slug", (q) =>
          q.eq("domainName", args.domainName!).eq("slug", args.slug)
        )
        .first();
    }
    return await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();
  },
});

export const createLink = mutation({
  args: {
    userId: v.string(),
    slug: v.string(),
    targetUrl: v.string(),
    domainName: v.string(),
    title: v.optional(v.string()),
    password: v.optional(v.string()),
    cloaking: v.optional(v.boolean()),
    expiresAt: v.optional(v.string()),
    maxClicks: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    routingRules: v.optional(
      v.array(
        v.object({
          id: v.string(),
          type: v.union(v.literal("country"), v.literal("device"), v.literal("language"), v.literal("os")),
          condition: v.string(),
          targetUrl: v.string(),
          priority: v.number(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    // Check if slug is already taken
    const existing = await ctx.db
      .query("links")
      .withIndex("by_domain_slug", (q) =>
        q.eq("domainName", args.domainName).eq("slug", args.slug)
      )
      .first();

    if (existing) {
      throw new Error(`Le slug '${args.slug}' est déjà utilisé sur le domaine ${args.domainName}.`);
    }

    const shortUrl = `https://${args.domainName}/${args.slug}`;
    const now = new Date().toISOString();

    const linkId = await ctx.db.insert("links", {
      userId: args.userId,
      slug: args.slug,
      targetUrl: args.targetUrl,
      domainName: args.domainName,
      shortUrl,
      title: args.title || args.slug,
      isActive: true,
      password: args.password,
      cloaking: args.cloaking || false,
      expiresAt: args.expiresAt,
      maxClicks: args.maxClicks,
      tags: args.tags || [],
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
      utmCampaign: args.utmCampaign,
      routingRules: args.routingRules || [],
      clicksCount: 0,
      conversionsCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Increment user link count
    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (user) {
      await ctx.db.patch(user._id, {
        linksCount: (user.linksCount || 0) + 1,
        updatedAt: now,
      });
    }

    return { id: linkId, shortUrl };
  },
});

export const updateLink = mutation({
  args: {
    id: v.id("links"),
    targetUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    isActive: v.optional(v.boolean()),
    password: v.optional(v.string()),
    cloaking: v.optional(v.boolean()),
    expiresAt: v.optional(v.string()),
    maxClicks: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, {
      ...fields,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  },
});

export const deleteLink = mutation({
  args: { id: v.id("links"), userId: v.string() },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);

    const user = await ctx.db
      .query("users")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .first();

    if (user && (user.linksCount || 0) > 0) {
      await ctx.db.patch(user._id, {
        linksCount: Math.max(0, (user.linksCount || 0) - 1),
        updatedAt: new Date().toISOString(),
      });
    }

    return { success: true };
  },
});

export const upsertLink = mutation({
  args: {
    userId: v.string(),
    slug: v.string(),
    targetUrl: v.string(),
    domainName: v.optional(v.string()),
    shortUrl: v.optional(v.string()),
    title: v.optional(v.string()),
    metaTitle: v.optional(v.string()),
    ogTitle: v.optional(v.string()),
    ogDescription: v.optional(v.string()),
    ogImage: v.optional(v.string()),
    password: v.optional(v.string()),
    isPasswordProtected: v.optional(v.boolean()),
    isCloaked: v.optional(v.boolean()),
    cloaking: v.optional(v.boolean()),
    hideReferrer: v.optional(v.boolean()),
    expiresAt: v.optional(v.string()),
    maxClicks: v.optional(v.number()),
    fallbackUrl: v.optional(v.string()),
    tags: v.optional(v.array(v.string())),
    utmSource: v.optional(v.string()),
    utmMedium: v.optional(v.string()),
    utmCampaign: v.optional(v.string()),
    utmTerm: v.optional(v.string()),
    utmContent: v.optional(v.string()),
    routingRules: v.optional(v.any()),
    geoTargeting: v.optional(v.any()),
    deviceTargeting: v.optional(v.any()),
    abVariations: v.optional(v.any()),
    mainWeight: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const domain = args.domainName || "lsho.cc";
    const existing = await ctx.db
      .query("links")
      .withIndex("by_slug", (q) => q.eq("slug", args.slug))
      .first();

    const now = new Date().toISOString();
    const shortUrl = args.shortUrl || `https://${domain}/${args.slug}`;

    if (existing) {
      await ctx.db.patch(existing._id, {
        targetUrl: args.targetUrl,
        domainName: domain,
        shortUrl,
        title: args.title || args.ogTitle || args.metaTitle || existing.title,
        metaTitle: args.metaTitle !== undefined ? args.metaTitle : existing.metaTitle,
        ogTitle: args.ogTitle !== undefined ? args.ogTitle : existing.ogTitle,
        ogDescription: args.ogDescription !== undefined ? args.ogDescription : existing.ogDescription,
        ogImage: args.ogImage !== undefined ? args.ogImage : existing.ogImage,
        password: args.password !== undefined ? args.password : existing.password,
        isPasswordProtected: Boolean(args.password || args.isPasswordProtected),
        isCloaked: args.isCloaked !== undefined ? args.isCloaked : existing.isCloaked,
        cloaking: args.cloaking !== undefined ? args.cloaking : existing.cloaking,
        hideReferrer: args.hideReferrer !== undefined ? args.hideReferrer : existing.hideReferrer,
        expiresAt: args.expiresAt !== undefined ? args.expiresAt : existing.expiresAt,
        maxClicks: args.maxClicks !== undefined ? args.maxClicks : existing.maxClicks,
        fallbackUrl: args.fallbackUrl !== undefined ? args.fallbackUrl : existing.fallbackUrl,
        tags: args.tags !== undefined ? args.tags : existing.tags,
        routingRules: args.routingRules !== undefined ? args.routingRules : existing.routingRules,
        geoTargeting: args.geoTargeting !== undefined ? args.geoTargeting : existing.geoTargeting,
        deviceTargeting: args.deviceTargeting !== undefined ? args.deviceTargeting : existing.deviceTargeting,
        abVariations: args.abVariations !== undefined ? args.abVariations : existing.abVariations,
        mainWeight: args.mainWeight !== undefined ? args.mainWeight : existing.mainWeight,
        isActive: args.isActive !== undefined ? args.isActive : existing.isActive,
        updatedAt: now,
      });
      return { id: existing._id, shortUrl, updated: true };
    }

    const linkId = await ctx.db.insert("links", {
      userId: args.userId,
      slug: args.slug,
      targetUrl: args.targetUrl,
      domainName: domain,
      shortUrl,
      title: args.title || args.ogTitle || args.metaTitle || args.slug,
      metaTitle: args.metaTitle,
      ogTitle: args.ogTitle,
      ogDescription: args.ogDescription,
      ogImage: args.ogImage,
      password: args.password,
      isPasswordProtected: Boolean(args.password),
      isCloaked: Boolean(args.isCloaked || args.cloaking),
      cloaking: Boolean(args.isCloaked || args.cloaking),
      hideReferrer: Boolean(args.hideReferrer),
      expiresAt: args.expiresAt,
      maxClicks: args.maxClicks,
      fallbackUrl: args.fallbackUrl,
      tags: args.tags || [],
      utmSource: args.utmSource,
      utmMedium: args.utmMedium,
      utmCampaign: args.utmCampaign,
      utmTerm: args.utmTerm,
      utmContent: args.utmContent,
      routingRules: args.routingRules || [],
      geoTargeting: args.geoTargeting || {},
      deviceTargeting: args.deviceTargeting || {},
      abVariations: args.abVariations || [],
      mainWeight: args.mainWeight || 50,
      clicksCount: 0,
      conversionsCount: 0,
      isActive: args.isActive !== false,
      createdAt: now,
      updatedAt: now,
    });

    return { id: linkId, shortUrl, created: true };
  },
});
