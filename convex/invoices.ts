import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// ─── List invoices for an organization ──────────────────────────────────────
export const listInvoices = query({
  args: { orgId: v.optional(v.string()) },
  handler: async (ctx, args) => {
    if (!args.orgId) return [];
    try {
      const items = await ctx.db
        .query("invoices")
        .filter((q) => q.eq(q.field("orgId"), args.orgId))
        .collect();

      return items.sort((a, b) => ((b.createdAt || b._creationTime || 0) - (a.createdAt || a._creationTime || 0)));
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
      const invoices = await ctx.db
        .query("invoices")
        .filter((q) => q.eq(q.field("invoiceNumber"), args.invoiceNumber))
        .collect();
      return invoices[0] || null;
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
        .filter((q) => q.eq(q.field("invoiceNumber"), args.invoiceNumber))
        .collect();

      if (existing.length > 0) {
        return { id: existing[0]._id, exists: true };
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
