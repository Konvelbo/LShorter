import { NextRequest, NextResponse } from "next/server";
import { getPaddleInstance } from "@/lib/paddle/paddle-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
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

    const seenTxnIds = new Set<string>();

    const paddle = getPaddleInstance();
    if (paddle && email) {
      try {
        // 1. Search customer by email
        for await (const customer of paddle.customers.list({ search: email })) {
          if (!customer.id) continue;

          // 2. Fetch completed transactions for this customer
          for await (const t of paddle.transactions.list({
            customerId: [customer.id],
            status: ["completed", "paid"],
            perPage: 20,
          })) {
            if (seenTxnIds.has(t.id)) continue;
            seenTxnIds.add(t.id);

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

    // 3. Complement with Convex invoices if available
    if (userId) {
      try {
        const convexInvoices = await convex.query(api.invoices.listInvoices, {
          orgId: userId,
        });

        if (Array.isArray(convexInvoices)) {
          for (const ci of convexInvoices) {
            const txnMatch = ci.invoiceNumber?.match(/txn_[a-zA-Z0-9]+/i);
            const txnId = txnMatch ? txnMatch[0] : null;

            if (txnId && seenTxnIds.has(txnId)) continue;
            if (seenTxnIds.has(ci.invoiceNumber)) continue;
            seenTxnIds.add(ci.invoiceNumber);

            const dateObj = new Date(ci.createdAt || ci.periodStart);
            invoices.push({
              id: txnId || ci.invoiceNumber,
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
              downloadUrl: ci.pdfUrl || `/api/billing/invoices/${ci.invoiceNumber}/download`,
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
