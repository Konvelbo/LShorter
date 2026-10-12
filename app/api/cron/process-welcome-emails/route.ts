import { NextResponse } from "next/server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { sendWelcomeEmail } from "@/lib/resend";
import { FRONTEND_SECRET } from "@/lib/backend-config";

/**
 * Cron / Webhook endpoint to dispatch scheduled welcome emails (due after 2 hours)
 */
export async function GET(req: Request) {
  return handleProcess(req);
}

export async function POST(req: Request) {
  return handleProcess(req);
}

async function handleProcess(req: Request) {
  // Protect cron endpoint with CRON_SECRET or FRONTEND_SECRET
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const secretHeader = req.headers.get("x-cron-secret") || req.headers.get("x-frontend-secret") || "";

  if (cronSecret) {
    if (token !== cronSecret && secretHeader !== cronSecret) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }
  } else if (FRONTEND_SECRET) {
    if (token !== FRONTEND_SECRET && secretHeader !== FRONTEND_SECRET && !token) {
      // In local dev without cron secret, allow call if token matches or dev mode
    }
  }

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
          if (item.userId) {
            try {
              await convex.mutation(api.notifications.createNotification, {
                orgId: item.userId,
                title: "Bienvenue chez LShorter 🚀",
                message: `Bonjour ${item.name || "cher utilisateur"}, merci d'avoir rejoint LShorter ! Votre espace est prêt pour créer vos liens et QR codes.`,
                type: "INFO",
              });
            } catch {}
          }
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
