import { NextRequest, NextResponse } from "next/server";
import { getPaddleInstance } from "@/lib/paddle/paddle-server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { syncUserToCloudflare } from "@/app/actions/sync-user";


import { auth } from "@/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401 }
      );
    }

    const { transactionId, userId: requestedUserId } = await request.json();

    if (!transactionId) {
      return NextResponse.json(
        { success: false, error: "Missing transactionId" },
        { status: 400 }
      );
    }

    const paddle = getPaddleInstance();
    if (!paddle) {
      return NextResponse.json(
        { success: false, error: "Paddle SDK not configured" },
        { status: 500 }
      );
    }

    // 1. Fetch transaction directly from Paddle API
    const transaction = await paddle.transactions.get(transactionId);
    console.info(
      `[Verify Transaction] Retrieved ${transaction.id}: status=${transaction.status}`
    );

    if (transaction.status !== "completed" && transaction.status !== "paid") {
      return NextResponse.json({
        success: false,
        status: transaction.status,
        message: "Transaction is not completed yet",
      });
    }

    // 2. Extract metadata and enforce authorization check
    const customData = (transaction.customData as any) || {};
    const sessionUserId = session.user.id || "";
    const sessionEmail = (session.user.email || "").toLowerCase().trim();

    // IDOR Protection: ensure transaction belongs to the calling user
    const txUserId = customData.userId || "";
    const txEmail = (transaction.customer?.email || "").toLowerCase().trim();

    if (txUserId && txUserId !== sessionUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Transaction does not belong to the active user." },
        { status: 403 }
      );
    }
    if (txEmail && sessionEmail && txEmail !== sessionEmail && !txUserId) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Customer email mismatch." },
        { status: 403 }
      );
    }

    const resolvedUserId = txUserId || sessionUserId;
    const rawPlanId = (customData.planId || "PRO").toUpperCase();
    const planId = (
      ["PRO", "BUSINESS", "ENTERPRISE"].includes(rawPlanId) ? rawPlanId : "PRO"
    ) as "PRO" | "BUSINESS" | "ENTERPRISE";
    const cycle = ((customData.cycle || "MONTHLY") as string).toUpperCase() === "YEARLY"
      ? "YEARLY"
      : "MONTHLY";
    const orgId = customData.orgId || (resolvedUserId ? `org_${resolvedUserId}` : "default");

    let customerEmail = transaction.customer?.email || "";
    let customerName = transaction.customer?.name || "";

    if (!customerEmail && transaction.customerId) {
      try {
        const c = await paddle.customers.get(transaction.customerId);
        if (c?.email) customerEmail = c.email;
        if (c?.name) customerName = c.name;
      } catch {}
    }

    if (resolvedUserId && !customerEmail) {
      try {
        const u = await convex.query(api.users.getCurrentUser, { userId: resolvedUserId });
        if (u?.email) customerEmail = u.email;
        if (u?.name) customerName = u.name;
      } catch {}
    }

    // 3. Update Convex database
    if (resolvedUserId) {
      try {
        await convex.mutation(api.users.updatePlan, {
          userId: resolvedUserId,
          plan: planId,
        });
      } catch (convexErr) {
        console.error("[Verify Transaction] Error updating Convex plan:", convexErr);
      }

      // 4. Update Cloudflare D1
      try {
        await syncUserToCloudflare({
          id: resolvedUserId,
          email: customerEmail || `${resolvedUserId}@lshorter.local`,
          name: customerName || "Customer",
          plan: planId,
        });

        if (customerEmail && customerEmail !== resolvedUserId) {
          await syncUserToCloudflare({
            id: customerEmail,
            email: customerEmail,
            name: customerName || "Customer",
            plan: planId,
          });
        }
      } catch (cfErr) {
        console.error("[Verify Transaction] Error syncing Cloudflare:", cfErr);
      }
    }

    // 5. Fetch official Paddle Invoice PDF URL
    let invoicePdfUrl: string | null = null;
    try {
      const invoicePdf = await paddle.transactions.getInvoicePDF(transaction.id);
      invoicePdfUrl = invoicePdf?.url || null;
    } catch (pdfErr) {
      console.warn("[Verify Transaction] Non-fatal invoice PDF fetch warning:", pdfErr);
    }

    // 6. Create certified invoice in Convex
    try {
      const totalAmount = transaction.details?.totals?.total
        ? parseFloat(transaction.details.totals.total) / 100
        : 0;
      const invoiceNumber = transaction.invoiceNumber || `INV-${transaction.id.replace(/^txn_/, "").toUpperCase()}`;
      const now = Date.now();
      const periodEnd = cycle === "YEARLY" ? now + 365 * 86400000 : now + 30 * 86400000;

      await convex.mutation(api.invoices.createInvoice, {
        orgId: resolvedUserId || orgId,
        invoiceNumber,
        planId,
        amountPaid: totalAmount,
        periodStart: now,
        periodEnd,
        currency: transaction.currencyCode || "USD",
        status: "PAID",
        pdfUrl: invoicePdfUrl || `/api/billing/invoices/${transaction.id}/download`,
      });
    } catch (invErr) {
      console.error("[Verify Transaction] Error creating invoice in Convex:", invErr);
    }

    // 7. Paddle handles official customer email and certified PDF receipt delivery natively

    // 8. Create in-app notification for the Topbar Bell
    if (resolvedUserId) {
      try {
        await convex.mutation(api.notifications.createNotification, {
          orgId: resolvedUserId,
          title: `Abonnement ${planId} confirmé`,
          message: `Félicitations ! Votre abonnement ${planId} (${cycle === "YEARLY" ? "Annuel" : "Mensuel"}) est actif. Votre facture certifiée Paddle est disponible.`,
          type: "SUCCESS",
          linkUrl: "/dashboard/settings?tab=billing",
        });
      } catch (notifErr) {
        console.error("[Verify Transaction] Error creating notification:", notifErr);
      }
    }

    return NextResponse.json({
      success: true,
      transactionId: transaction.id,
      plan: planId,
      cycle,
      status: transaction.status,
      invoicePdfUrl,
    });
  } catch (error: any) {
    console.error("[Verify Transaction Error]:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to verify transaction" },
      { status: 500 }
    );
  }
}
