import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── List invoices for an organization ──────────────────────────────────────
export const listInvoices = query({
  args: { orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.orgId) return [];
    try {
      const altOrgId = args.orgId.startsWith("org_")
        ? args.orgId.replace(/^org_/, "")
        : `org_${args.orgId}`;

      const [directItems, altItems] = await Promise.all([
        ctx.db
          .query("invoices")
          .withIndex("by_orgId", (q) => q.eq("orgId", args.orgId!))
          .collect(),
        altOrgId !== args.orgId
          ? ctx.db
              .query("invoices")
              .withIndex("by_orgId", (q) => q.eq("orgId", altOrgId))
              .collect()
          : Promise.resolve([]),
      ]);

      const merged = new Map<string, (typeof directItems)[number]>();
      for (const item of [...directItems, ...altItems]) {
        merged.set(String(item._id), item);
      }

      return Array.from(merged.values()).sort(
        (a, b) => (b.createdAt || b._creationTime || 0) - (a.createdAt || a._creationTime || 0)
      );
    } catch (err) {
      console.warn("[invoices:listInvoices] Fallback catch:", err);
      return [];
    }
  },
});

// ─── Get invoice by invoice number ──────────────────────────────────────────
export const getInvoiceByNumber = query({
  args: { invoiceNumber: v.string() },
  handler: async (ctx, args) => {
    try {
      return await ctx.db
        .query("invoices")
        .withIndex("by_invoiceNumber", (q) => q.eq("invoiceNumber", args.invoiceNumber))
        .first();
    } catch (err) {
      console.warn("[invoices:getInvoiceByNumber] Fallback catch:", err);
      return null;
    }
  },
});

// ─── Create a certified invoice row ─────────────────────────────────────────
export const createInvoice = mutation({
  args: {
    orgId: v.string(),
    invoiceNumber: v.string(),
    planId: v.union(v.literal("PRO"), v.literal("BUSINESS"), v.literal("ENTERPRISE")),
    amountPaid: v.number(),
    periodStart: v.number(),
    periodEnd: v.number(),
    currency: v.optional(v.string()),
    status: v.optional(v.string()),
    pdfUrl: v.optional(v.string()),
    overageAmount: v.optional(v.number()),
    batchesOverage: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    try {
      const existing = await ctx.db
        .query("invoices")
        .withIndex("by_invoiceNumber", (q) => q.eq("invoiceNumber", args.invoiceNumber))
        .first();

      if (existing) {
        const patchData: { status?: string; pdfUrl?: string; amountPaid?: number } = {};
        if (args.status && args.status !== existing.status && existing.status !== "PAID") {
          patchData.status = args.status;
        }
        if (args.pdfUrl && !existing.pdfUrl) {
          patchData.pdfUrl = args.pdfUrl;
        }
        if (args.amountPaid > 0 && !existing.amountPaid) {
          patchData.amountPaid = args.amountPaid;
        }
        if (Object.keys(patchData).length > 0) {
          await ctx.db.patch(existing._id, patchData);
        }
        return { id: existing._id, exists: true };
      }

      const id = await ctx.db.insert("invoices", {
        orgId: args.orgId,
        invoiceNumber: args.invoiceNumber,
        planId: args.planId,
        amountPaid: args.amountPaid,
        periodStart: args.periodStart,
        periodEnd: args.periodEnd,
        currency: args.currency || "EUR",
        status: args.status || "PAID",
        pdfUrl: args.pdfUrl,
        overageAmount: args.overageAmount,
        batchesOverage: args.batchesOverage,
        createdAt: Date.now(),
      });

      return { id, success: true };
    } catch (err: any) {
      console.error("[invoices:createInvoice] Error:", err);
      return { success: false, error: err?.message };
    }
  },
});
