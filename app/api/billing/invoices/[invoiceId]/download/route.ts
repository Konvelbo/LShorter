import { NextRequest, NextResponse } from "next/server";
import { generateInvoicePdf, InvoicePdfData } from "@/lib/billing/pdf-invoice";
import { PRICING_PLANS } from "@/src/config/pricing";
import { getPaddleInstance } from "@/lib/paddle/paddle-server";
import { getDodoPaymentsClient } from "@/lib/dodo/dodo-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";

import { auth } from "@/auth";

function formatFrShortDate(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id || "";
    const userEmail = (session.user.email || "").toLowerCase().trim();
    const { invoiceId } = await params;
    const decodedId = decodeURIComponent(invoiceId);

    // Look up matching Convex invoice for ownership check + real metadata fallback
    let convexInvoice: {
      orgId?: string;
      pdfUrl?: string;
      planId?: string;
      amountPaid?: number;
      createdAt?: number;
      periodStart?: number;
      periodEnd?: number;
      currency?: string;
      invoiceNumber?: string;
      overageAmount?: number;
      batchesOverage?: number;
    } | null = null;
    try {
      convexInvoice = await convex.query(api.invoices.getInvoiceByNumber, {
        invoiceNumber: decodedId,
      });
    } catch {
      convexInvoice = null;
    }

    // If URL used `dodo_pay_...` or raw `pay_...`, match against user's Convex invoices
    if (!convexInvoice && userId && (decodedId.startsWith("dodo_") || /^pay_[a-zA-Z0-9_]+$/i.test(decodedId))) {
      try {
        const payIdHint = decodedId.startsWith("dodo_")
          ? decodedId.slice("dodo_".length)
          : decodedId;
        const userInvoices = await convex.query(api.invoices.listInvoices, {
          orgId: userId,
        });
        if (Array.isArray(userInvoices)) {
          convexInvoice =
            userInvoices.find(
              (ci) =>
                ci.pdfUrl?.includes(payIdHint) ||
                ci.invoiceNumber === `INV-DODO-${payIdHint.replace(/^pay_/, "").toUpperCase()}`
            ) || null;
        }
      } catch {
        convexInvoice = null;
      }
    }

    if (
      convexInvoice &&
      (!userId ||
        (convexInvoice.orgId !== userId && convexInvoice.orgId !== `org_${userId}`))
    ) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    // 1. Official Dodo Payments Invoice / PDF
    let dodoPaymentId: string | null = null;
    if (decodedId.startsWith("dodo_")) {
      dodoPaymentId = decodedId.slice("dodo_".length);
    } else if (/^pay_[a-zA-Z0-9]+$/i.test(decodedId)) {
      dodoPaymentId = decodedId;
    } else if (convexInvoice?.pdfUrl) {
      const match = String(convexInvoice.pdfUrl).match(/dodo_(pay_[a-zA-Z0-9_]+)/i);
      if (match) {
        dodoPaymentId = decodeURIComponent(match[1]);
      }
    }

    let dodoPaymentMeta: {
      metadata?: Record<string, unknown>;
      total_amount?: number;
      created_at?: string;
      customer?: { name?: string | null; email?: string | null };
      currency?: string;
      invoice_id?: string | null;
    } | null = null;
    const dodo = getDodoPaymentsClient();
    if (dodoPaymentId && dodo) {
      try {
        const payment = await dodo.payments.retrieve(dodoPaymentId);
        const ownerEmail = payment.customer?.email?.toLowerCase().trim() || "";
        const metaUserId = String(payment.metadata?.userId || "");
        const ownsViaConvex = Boolean(
          convexInvoice &&
            userId &&
            (convexInvoice.orgId === userId || convexInvoice.orgId === `org_${userId}`)
        );
        const isOwner =
          ownsViaConvex ||
          (userEmail && ownerEmail === userEmail) ||
          (userId && metaUserId === userId);

        if (!isOwner) {
          return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        dodoPaymentMeta = payment;

        const pdfResponse = await dodo.invoices.payments.retrieve(dodoPaymentId);
        if (pdfResponse.ok) {
          const pdfBuffer = await pdfResponse.arrayBuffer();
          if (pdfBuffer.byteLength > 0) {
            const filenameSlug = (payment.invoice_id || dodoPaymentId).replace(/[^a-zA-Z0-9_-]/g, "_");
            return new Response(pdfBuffer, {
              status: 200,
              headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="facture-${filenameSlug}.pdf"`,
                "Content-Length": String(pdfBuffer.byteLength),
                "Cache-Control": "private, max-age=3600",
              },
            });
          }
        }
      } catch (dodoErr) {
        console.warn("[Invoice Download] Dodo official invoice PDF fallback:", dodoErr);
      }
    }

    // 2. Check if invoice corresponds to a Paddle transaction (e.g. INV-TXN_... or txn_...)
    const paddle = getPaddleInstance();
    let txnId: string | null = null;
    if (decodedId.toLowerCase().includes("txn_")) {
      const match = decodedId.match(/txn_[a-zA-Z0-9]+/i);
      if (match) {
        txnId = match[0].toLowerCase();
      }
    }

    let ownsPaddleMeta = false;
    if (txnId && paddle) {
      try {
        const txn = await paddle.transactions.get(txnId);
        let ownsPaddleTxn = Boolean(convexInvoice);
        if (!ownsPaddleTxn && txn?.customerId && userEmail) {
          const cust = await paddle.customers.get(txn.customerId).catch(() => null);
          ownsPaddleTxn = cust?.email?.toLowerCase().trim() === userEmail;
        }
        if (
          !ownsPaddleTxn &&
          userId &&
          (txn?.customData as Record<string, unknown> | null)?.userId === userId
        ) {
          ownsPaddleTxn = true;
        }
        if (!ownsPaddleTxn) {
          return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
        }

        ownsPaddleMeta = true;
        const paddleInvoice = await paddle.transactions.getInvoicePDF(txnId);
        if (paddleInvoice?.url) {
          return NextResponse.redirect(paddleInvoice.url);
        }
      } catch (paddleErr) {
        console.warn("[Invoice Download] Paddle official invoice fetch fallback:", paddleErr);
      }
    }

    if (!convexInvoice && !dodoPaymentMeta && !ownsPaddleMeta) {
      return NextResponse.json({ success: false, error: "Invoice not found" }, { status: 404 });
    }

    const searchParams = request.nextUrl.searchParams;
    // Verified provider/database fields strictly take precedence over query parameters
    const rawPlan =
      (dodoPaymentMeta?.metadata?.planId ? String(dodoPaymentMeta.metadata.planId) : "") ||
      convexInvoice?.planId ||
      searchParams.get("plan") ||
      "PRO";
    const planId = (["PRO", "BUSINESS", "ENTERPRISE"].includes(rawPlan.toUpperCase())
      ? rawPlan.toUpperCase()
      : "PRO") as "PRO" | "BUSINESS" | "ENTERPRISE";
    const plan = PRICING_PLANS[planId] || PRICING_PLANS.PRO;

    const rawAmount = searchParams.get("amount");
    const parsedQueryAmount = rawAmount ? parseFloat(rawAmount) : NaN;
    const amountPaid =
      typeof dodoPaymentMeta?.total_amount === "number"
        ? dodoPaymentMeta.total_amount / 100
        : typeof convexInvoice?.amountPaid === "number"
          ? convexInvoice.amountPaid
          : !Number.isNaN(parsedQueryAmount)
            ? parsedQueryAmount
            : planId === "BUSINESS"
              ? 49
              : planId === "ENTERPRISE"
                ? 199
                : 15;

    const nowMs = dodoPaymentMeta?.created_at
      ? new Date(dodoPaymentMeta.created_at).getTime()
      : convexInvoice?.createdAt || Date.now();
    const now = new Date(nowMs);
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const currentMonth = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();

    const companyName =
      dodoPaymentMeta?.customer?.name ||
      session.user.name ||
      searchParams.get("companyName") ||
      searchParams.get("name") ||
      "Compte Pro";
    const customerEmail =
      dodoPaymentMeta?.customer?.email ||
      session.user.email ||
      searchParams.get("email") ||
      "contact@client.com";
    const taxId = searchParams.get("taxId") || undefined;
    const billingAddress = searchParams.get("address") || undefined;

    const overageClicks = parseInt(searchParams.get("overageClicks") || "0", 10);
    const overageAmount = parseFloat(
      searchParams.get("overageAmount") || String(convexInvoice?.overageAmount || 0)
    );
    const batchesOverage = parseInt(
      searchParams.get("batchesOverage") || String(convexInvoice?.batchesOverage || 0),
      10
    );

    const periodStartMs = convexInvoice?.periodStart || nowMs;
    const periodEndMs = convexInvoice?.periodEnd || nowMs + 30 * 86400000;
    const resolvedCurrency = String(
      dodoPaymentMeta?.currency || convexInvoice?.currency || "USD"
    ).toUpperCase();

    const resolvedNumber = dodoPaymentMeta?.invoice_id
      ? String(dodoPaymentMeta.invoice_id)
      : convexInvoice?.invoiceNumber
        ? String(convexInvoice.invoiceNumber)
        : decodedId.startsWith("INV-")
          ? decodedId
          : decodedId.startsWith("dodo_")
            ? `INV-DODO-${decodedId.slice("dodo_".length).replace(/^pay_/, "").toUpperCase()}`
            : `INV-${currentYear}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${decodedId.substring(0, 6).toUpperCase()}`;

    const invoiceData: InvoicePdfData = {
      invoiceNumber: resolvedNumber,
      date: `${String(now.getDate()).padStart(2, "0")} ${currentMonth} ${currentYear}`,
      planId,
      planName: plan.name,
      amountPaid,
      periodStart: formatFrShortDate(periodStartMs),
      periodEnd: formatFrShortDate(periodEndMs),
      currency: resolvedCurrency,
      status: "PAID",
      companyName,
      customerName: companyName,
      customerEmail,
      taxId,
      billingAddress,
      overageClicks: overageClicks > 0 ? overageClicks : undefined,
      overageAmount: overageAmount > 0 ? overageAmount : undefined,
      batchesOverage: batchesOverage > 0 ? batchesOverage : undefined,
    };

    const pdfBuffer = generateInvoicePdf(invoiceData);

    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture-${invoiceData.invoiceNumber}.pdf"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error: unknown) {
    console.error("[Invoice Download API Error]", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la génération de la facture PDF." },
      { status: 500 }
    );
  }
}
