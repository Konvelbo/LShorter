import { NextResponse } from "next/server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { sendWelcomeEmail } from "@/lib/resend";

/**
 * Cron / Webhook endpoint to dispatch scheduled welcome emails (due after 2 hours)
 */
export async function GET() {
  return handleProcess();
}

export async function POST() {
  return handleProcess();
}

async function handleProcess() {
  try {
    // 1. Fetch pending emails whose scheduledAt timestamp has elapsed
    const usersApi = (api.users as any);
    const dueEmails = await convex.query(usersApi.getDueWelcomeEmails, {});

    if (!dueEmails || dueEmails.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No pending welcome emails to send at this time.",
        processed: 0,
      });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const item of dueEmails) {
      try {
        const emailRes = await sendWelcomeEmail({
          to: item.email,
          name: item.name,
        });

        if (emailRes.success) {
          await convex.mutation(usersApi.markWelcomeEmailSent, { id: item._id });
          sentCount++;
        } else {
          console.error(`[ProcessWelcomeEmails] Failed to send to ${item.email}:`, emailRes.error);
          await convex.mutation(usersApi.markWelcomeEmailFailed, { id: item._id });
          failedCount++;
        }
      } catch (sendErr) {
        console.error(`[ProcessWelcomeEmails] Unexpected error sending to ${item.email}:`, sendErr);
        await convex.mutation(usersApi.markWelcomeEmailFailed, { id: item._id });
        failedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      processed: dueEmails.length,
      sent: sentCount,
      failed: failedCount,
    });
  } catch (error: any) {
    console.error("[ProcessWelcomeEmails] Global processing error:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Internal server error" },
      { status: 500 }
    );
  }
}
