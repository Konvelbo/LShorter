import { NextRequest, NextResponse } from "next/server";
import { generateInvoicePdf, InvoicePdfData } from "@/lib/billing/pdf-invoice";
import { PRICING_PLANS } from "@/src/config/pricing";
import { getPaddleInstance } from "@/lib/paddle/paddle-server";

import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { invoiceId } = await params;
    const paddle = getPaddleInstance();

    // 1. Check if invoice corresponds to a Paddle transaction (e.g. INV-TXN_... or txn_...)
    let txnId: string | null = null;
    if (invoiceId.toLowerCase().includes("txn_")) {
      const match = invoiceId.match(/txn_[a-zA-Z0-9]+/i);
      if (match) {
        txnId = match[0].toLowerCase();
      }
    }

    if (txnId && paddle) {
      try {
        const paddleInvoice = await paddle.transactions.getInvoicePDF(txnId);
        if (paddleInvoice?.url) {
          return NextResponse.redirect(paddleInvoice.url);
        }
      } catch (paddleErr) {
        console.warn("[Invoice Download] Paddle official invoice fetch fallback:", paddleErr);
      }
    }

    const searchParams = request.nextUrl.searchParams;

    const planId = (searchParams.get("plan") || "PRO").toUpperCase() as 'PRO' | 'BUSINESS' | 'ENTERPRISE';
    const plan = PRICING_PLANS[planId] || PRICING_PLANS.PRO;

    const rawAmount = searchParams.get("amount");
    const amountPaid = rawAmount ? parseFloat(rawAmount) : (planId === "BUSINESS" ? 49 : planId === "ENTERPRISE" ? 199 : 15);

    const now = new Date();
    const monthNames = [
      "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
      "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
    ];

    const currentMonth = monthNames[now.getMonth()];
    const currentYear = now.getFullYear();

    const companyName = searchParams.get("companyName") || searchParams.get("name") || "Compte Pro";
    const customerEmail = searchParams.get("email") || "contact@client.com";
    const taxId = searchParams.get("taxId") || undefined;
    const billingAddress = searchParams.get("address") || undefined;

    const overageClicks = parseInt(searchParams.get("overageClicks") || "0", 10);
    const overageAmount = parseFloat(searchParams.get("overageAmount") || "0");
    const batchesOverage = parseInt(searchParams.get("batchesOverage") || "0", 10);

    const invoiceData: InvoicePdfData = {
      invoiceNumber: invoiceId.startsWith("INV-") ? invoiceId : `INV-${currentYear}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${invoiceId.substring(0, 6).toUpperCase()}`,
      date: `01 ${currentMonth} ${currentYear}`,
      planId: planId,
      planName: plan.name,
      amountPaid: amountPaid,
      periodStart: `01/${(now.getMonth() + 1).toString().padStart(2, "0")}/${currentYear}`,
      periodEnd: `30/${(now.getMonth() + 1).toString().padStart(2, "0")}/${currentYear}`,
      currency: "EUR",
      status: "PAID",
      companyName: companyName,
      customerName: companyName,
      customerEmail: customerEmail,
      taxId: taxId,
      billingAddress: billingAddress,
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
  } catch (error: any) {
    console.error("[Invoice Download API Error]", error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la génération de la facture PDF." },
      { status: 500 }
    );
  }
}
