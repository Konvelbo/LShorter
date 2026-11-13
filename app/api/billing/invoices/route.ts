import { NextResponse } from "next/server";
import { getPaddleInstance } from "@/lib/paddle/paddle-server";
import { getDodoPaymentsClient } from "@/lib/dodo/dodo-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    // Strictly enforce session identity to prevent IDOR
    const userId = session.user.id || "";
    const email = session.user.email || "";

    const invoices: Array<{
      id: string;
      number: string;
      date: string;
      netAmount: number;
      taxAmount: number;
      totalAmount: number;
      currency: string;
      status: string;
      planName: string;
      downloadUrl: string;
      billedAtTimestamp: number;
    }> = [];

    const seenIds = new Set<string>();
    const cleanEmail = email.toLowerCase().trim();

    // 1. Fetch official Dodo Payments invoices/payments
    const dodo = getDodoPaymentsClient();
    if (dodo && (cleanEmail || userId)) {
      try {
        const pushDodoPayment = (
          p: {
            payment_id?: string;
            status?: string | null;
            invoice_id?: string | null;
            created_at?: string;
            total_amount?: number;
            currency?: string;
            metadata?: Record<string, unknown>;
          },
          fallbackPlan?: string
        ) => {
          if (!p?.payment_id || p.status !== "succeeded") return;
          const dodoKey = `dodo_${p.payment_id}`;
          if (seenIds.has(dodoKey) || seenIds.has(p.payment_id)) return;
          if (p.invoice_id && seenIds.has(String(p.invoice_id))) return;

          seenIds.add(dodoKey);
          seenIds.add(p.payment_id);
          if (p.invoice_id) seenIds.add(String(p.invoice_id));

          const billedDate = p.created_at ? new Date(p.created_at) : new Date();
          const total =
            typeof p.total_amount === "number" ? p.total_amount / 100 : 0;
          const planKey = String(
            p.metadata?.planId || fallbackPlan || "PRO"
          ).toUpperCase();
          const invNumber = p.invoice_id
            ? String(p.invoice_id)
            : `INV-DODO-${String(p.payment_id).replace(/^pay_/, "").toUpperCase()}`;

          invoices.push({
            id: dodoKey,
            number: invNumber,
            date: billedDate.toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            }),
            netAmount: total,
            taxAmount: 0,
            totalAmount: total,
            currency: String(p.currency || "USD").toUpperCase(),
            status: "paid",
            planName: `LShorter ${planKey}`,
            downloadUrl: `/api/billing/invoices/${encodeURIComponent(dodoKey)}/download`,
            billedAtTimestamp: billedDate.getTime(),
          });
        };

        if (cleanEmail) {
          for await (const customer of dodo.customers.list({ email: cleanEmail })) {
            if (
              !customer.customer_id ||
              customer.email?.toLowerCase().trim() !== cleanEmail
            ) {
              continue;
            }
            for await (const p of dodo.payments.list({
              customer_id: customer.customer_id,
              status: "succeeded",
              page_size: 25,
            })) {
              pushDodoPayment(p);
            }
          }
        }

        if (userId) {
          const convexSub = await convex
            .query(api.subscriptions.getSubscription, { orgId: userId })
            .catch(() => null);
          if (
            convexSub?.provider === "dodo" &&
            convexSub?.providerSubscriptionId
          ) {
            for await (const p of dodo.payments.list({
              subscription_id: convexSub.providerSubscriptionId,
              status: "succeeded",
              page_size: 25,
            })) {
              const metaUserId = String(p.metadata?.userId || "");
              const payEmail = p.customer?.email?.toLowerCase().trim() || "";
              const belongsToUser =
                (userId && metaUserId === userId) ||
                (cleanEmail && payEmail === cleanEmail) ||
                (!metaUserId && !payEmail);
              if (belongsToUser) {
                pushDodoPayment(p, convexSub.plan);
              }
            }
          }
        }
      } catch (dodoErr) {
        console.warn("[Invoices API] Error fetching from Dodo:", dodoErr);
      }
    }

    // 2. Fetch official Paddle transactions/invoices
    const paddle = getPaddleInstance();
    if (paddle && cleanEmail) {
      try {
        for await (const customer of paddle.customers.list({ email: [cleanEmail] })) {
          if (
            !customer.id ||
            customer.email?.toLowerCase().trim() !== cleanEmail
          ) {
            continue;
          }

          for await (const t of paddle.transactions.list({
            customerId: [customer.id],
            status: ["completed", "paid"],
            perPage: 20,
          })) {
            if (seenIds.has(t.id)) continue;
            seenIds.add(t.id);

            const totals = t.details?.totals;
            const total = totals?.total ? parseFloat(totals.total) / 100 : 0;
            const subtotal = totals?.subtotal ? parseFloat(totals.subtotal) / 100 : total;
            const tax = totals?.tax ? parseFloat(totals.tax) / 100 : 0;
            const billedDate = t.billedAt ? new Date(t.billedAt) : new Date(t.createdAt);

            const customData = (t.customData as any) || {};
            const planKey = customData.planId || "PRO";

            const invNumber =
              t.invoiceNumber ||
              `INV-${t.id.replace(/^txn_/, "").slice(0, 8).toUpperCase()}`;

            invoices.push({
              id: t.id,
              number: invNumber,
              date: billedDate.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              netAmount: subtotal,
              taxAmount: tax,
              totalAmount: total,
              currency: t.currencyCode || "USD",
              status: "paid",
              planName: `LShorter ${planKey}`,
              downloadUrl: `/api/billing/invoices/${t.id}/download`,
              billedAtTimestamp: billedDate.getTime(),
            });
          }
        }
      } catch (paddleErr) {
        console.warn("[Invoices API] Error fetching from Paddle:", paddleErr);
      }
    }

    // 3. Complement with Convex invoices (supports both orgId & org_ prefix)
    if (userId) {
      try {
        const convexInvoices = await convex.query(api.invoices.listInvoices, {
          orgId: userId,
        });

        if (Array.isArray(convexInvoices)) {
          for (const ci of convexInvoices) {
            const txnMatch = ci.invoiceNumber?.match(/txn_[a-zA-Z0-9]+/i);
            const txnId = txnMatch ? txnMatch[0] : null;
            const dodoUrlMatch = ci.pdfUrl?.match(/dodo_(pay_[a-zA-Z0-9_]+)/i);
            const dodoPayId = dodoUrlMatch ? dodoUrlMatch[1] : null;

            if (txnId && seenIds.has(txnId)) continue;
            if (dodoPayId && (seenIds.has(dodoPayId) || seenIds.has(`dodo_${dodoPayId}`))) {
              continue;
            }
            if (seenIds.has(ci.invoiceNumber)) continue;
            seenIds.add(ci.invoiceNumber);

            const dateObj = new Date(ci.createdAt || ci.periodStart);
            invoices.push({
              id: txnId || (dodoPayId ? `dodo_${dodoPayId}` : ci.invoiceNumber),
              number: ci.invoiceNumber,
              date: dateObj.toLocaleDateString("fr-FR", {
                day: "2-digit",
                month: "short",
                year: "numeric",
              }),
              netAmount: ci.amountPaid,
              taxAmount: 0,
              totalAmount: ci.amountPaid,
              currency: ci.currency || "USD",
              status: ci.status?.toLowerCase() || "paid",
              planName: `LShorter ${ci.planId}`,
              downloadUrl:
                ci.pdfUrl ||
                `/api/billing/invoices/${encodeURIComponent(ci.invoiceNumber)}/download`,
              billedAtTimestamp: dateObj.getTime(),
            });
          }
        }
      } catch (convexErr) {
        console.warn("[Invoices API] Error fetching from Convex:", convexErr);
      }
    }

    // Sort by latest date first
    invoices.sort((a, b) => b.billedAtTimestamp - a.billedAtTimestamp);

    return NextResponse.json({
      success: true,
      invoices,
    });
  } catch (error: any) {
    console.error("[Invoices API Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to load invoices" },
      { status: 500 }
    );
  }
}
