import { NextResponse } from "next/server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import {
  sendSubscriptionExpiringAlertEmail,
  sendGracePeriodAlertEmail,
  sendSubscriptionDowngradedEmail,
} from "@/lib/resend";
import { FRONTEND_SECRET } from "@/lib/backend-config";

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * Subscription Lifecycle & Grace Period Automation Cron
 * ─────────────────────────────────────────────────────────────────────────────
 * Execution: Daily at 00:00 UTC (or triggered on demand via POST/GET)
 *
 * Rules:
 * 1. J-5 (5 days remaining): In-App Warning Notification + Email reminder
 * 2. J-3 (3 days remaining): In-App Warning Notification + Email reminder
 * 3. Grace Period (0 to 24h past expiration):
 *    - Message: "On vous a accordé 1 jour pour vous remettre à jour"
 *    - In-App Alert Notification + Email
 *    - Subscription and active features remain operational for 24h
 * 4. Downgrade (+24h past expiration without renewal):
 *    - Downgrade plan to FREE in Convex (subscriptions + users)
 *    - In-App Info Notification + Email
 *    - Existing short links continue redirecting normally
 * ─────────────────────────────────────────────────────────────────────────────
 */

export async function GET(req: Request) {
  return handleLifecycleProcess(req);
}

export async function POST(req: Request) {
  return handleLifecycleProcess(req);
}

async function handleLifecycleProcess(req: Request) {
  // 1. Authorization check via CRON_SECRET or FRONTEND_SECRET
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice(7).trim()
    : "";
  const secretHeader =
    req.headers.get("x-cron-secret") || req.headers.get("x-frontend-secret") || "";

  const isAuthorized = Boolean(
    !cronSecret && !FRONTEND_SECRET // Local development fallback
      ? true
      : (cronSecret && (token === cronSecret || secretHeader === cronSecret)) ||
        (FRONTEND_SECRET && (token === FRONTEND_SECRET || secretHeader === FRONTEND_SECRET))
  );

  if (!isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        error: "Unauthorized access to subscription lifecycle endpoint.",
      },
      { status: 401 }
    );
  }

  try {
    const subscriptionsApi = api.subscriptions as any;
    const notificationsApi = api.notifications as any;
    const usersApi = api.users as any;

    // 2. Fetch all non-free subscriptions from Convex
    const activeSubs = await convex.query(
      subscriptionsApi.getAllSubscriptionsForLifecycle,
      {}
    );

    if (!activeSubs || activeSubs.length === 0) {
      return NextResponse.json({
        success: true,
        message: "No active paid subscriptions to evaluate at this time.",
        processed: 0,
      });
    }

    const now = Date.now();
    const results = {
      evaluated: activeSubs.length,
      notified5Days: 0,
      notified3Days: 0,
      enteredGracePeriod: 0,
      downgradedToFree: 0,
    };

    for (const sub of activeSubs) {
      const cleanUserId = sub.orgId ? sub.orgId.replace(/^org_/, "") : "";
      const planName = sub.plan || "PRO";

      // Fetch user profile for name and email dispatch
      let user: any = null;
      if (cleanUserId) {
        try {
          user = await convex.query(usersApi.getCurrentUser, {
            userId: cleanUserId,
          });
        } catch (uErr) {
          console.warn("[Lifecycle] Error fetching user:", uErr);
        }
      }

      const userEmail = user?.email;
      const userName = user?.name || cleanUserId;
      const currentPeriodEnd = Number(sub.currentPeriodEnd || 0);

      // Skip invalid timestamps
      if (!currentPeriodEnd) continue;

      const msRemaining = currentPeriodEnd - now;
      const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
      const lastAlert = sub.lastLifecycleAlert || "";

      // ───────────────────────────────────────────────────────────────────────
      // CASE 4: Grace Period Expired (+24h without renewal) -> Downgrade to FREE
      // ───────────────────────────────────────────────────────────────────────
      const graceEndTimestamp =
        sub.gracePeriodEndsAt || currentPeriodEnd + 24 * 60 * 60 * 1000;

      if (now >= graceEndTimestamp && sub.lifecycleStatus === "GRACE_PERIOD") {
        // Execute downgrade in Convex (subscription + users table)
        await convex.mutation(subscriptionsApi.downgradeSubscriptionToFree, {
          subscriptionId: sub._id,
        });

        // In-App Notification
        try {
          await convex.mutation(notificationsApi.createNotification, {
            orgId: sub.orgId,
            title: "ℹ️ Votre compte est repassé en plan Gratuit",
            message: `La période de grâce de 1 jour accordée pour votre forfait ${planName} est expirée. Vos liens continuent de fonctionner sans interruption.`,
            type: "INFO",
            linkUrl: "/dashboard/pricing",
          });
        } catch (notifErr) {
          console.warn("[Lifecycle] In-app notification error:", notifErr);
        }

        // Email Notification
        if (userEmail) {
          try {
            await sendSubscriptionDowngradedEmail({
              to: userEmail,
              name: userName,
              previousPlan: planName,
              upgradeUrl: "https://lsho.cc/dashboard/pricing",
            });
          } catch (mailErr) {
            console.error("[Lifecycle] Email downgrade error:", mailErr);
          }
        }

        results.downgradedToFree++;
        continue;
      }

      // ───────────────────────────────────────────────────────────────────────
      // CASE 3: Subscription Period Reached 0 -> Activate 1-Day Grace Period
      // ───────────────────────────────────────────────────────────────────────
      if (now >= currentPeriodEnd && now < graceEndTimestamp) {
        if (lastAlert !== "GRACE_PERIOD" && lastAlert !== "DOWNGRADED") {
          // Record Grace Period in Convex
          await convex.mutation(subscriptionsApi.recordLifecycleAlert, {
            subscriptionId: sub._id,
            stage: "GRACE_PERIOD",
            lifecycleStatus: "GRACE_PERIOD",
            gracePeriodEndsAt: graceEndTimestamp,
          });

          // In-App Notification with exact required message
          try {
            await convex.mutation(notificationsApi.createNotification, {
              orgId: sub.orgId,
              title: "⏳ Période de grâce active (24h)",
              message: `Votre abonnement est arrivé à échéance. On vous a accordé 1 jour pour vous remettre à jour avant le passage au plan gratuit.`,
              type: "ALERT",
              linkUrl: "/dashboard/pricing",
            });
          } catch (notifErr) {
            console.warn("[Lifecycle] In-app grace notification error:", notifErr);
          }

          // Email Notification
          if (userEmail) {
            try {
              await sendGracePeriodAlertEmail({
                to: userEmail,
                name: userName,
                plan: planName,
                renewUrl: "https://lsho.cc/dashboard/pricing",
              });
            } catch (mailErr) {
              console.error("[Lifecycle] Email grace error:", mailErr);
            }
          }

          results.enteredGracePeriod++;
        }
        continue;
      }

      // ───────────────────────────────────────────────────────────────────────
      // CASE 2: J-3 Alert (<= 3 days remaining and > 0)
      // ───────────────────────────────────────────────────────────────────────
      if (daysRemaining <= 3 && daysRemaining > 0) {
        if (
          lastAlert !== "3_DAYS" &&
          lastAlert !== "GRACE_PERIOD" &&
          lastAlert !== "DOWNGRADED"
        ) {
          await convex.mutation(subscriptionsApi.recordLifecycleAlert, {
            subscriptionId: sub._id,
            stage: "3_DAYS",
            lifecycleStatus: "EXPIRING",
          });

          // In-App Notification
          try {
            await convex.mutation(notificationsApi.createNotification, {
              orgId: sub.orgId,
              title: "⚠️ Plus que 3 jours restants",
              message: `Votre abonnement ${planName} se termine dans 3 jours. Renouvelez dès maintenant pour conserver vos quotas et domaines personnalisés.`,
              type: "WARNING",
              linkUrl: "/dashboard/pricing",
            });
          } catch (notifErr) {
            console.warn("[Lifecycle] In-app 3-day notification error:", notifErr);
          }

          // Email Notification
          if (userEmail) {
            try {
              await sendSubscriptionExpiringAlertEmail({
                to: userEmail,
                name: userName,
                plan: planName,
                daysRemaining: 3,
                renewUrl: "https://lsho.cc/dashboard/pricing",
              });
            } catch (mailErr) {
              console.error("[Lifecycle] Email 3-day error:", mailErr);
            }
          }

          results.notified3Days++;
        }
        continue;
      }

      // ───────────────────────────────────────────────────────────────────────
      // CASE 1: J-5 Alert (<= 5 days remaining and > 3)
      // ───────────────────────────────────────────────────────────────────────
      if (daysRemaining <= 5 && daysRemaining > 3) {
        if (
          lastAlert !== "5_DAYS" &&
          lastAlert !== "3_DAYS" &&
          lastAlert !== "GRACE_PERIOD" &&
          lastAlert !== "DOWNGRADED"
        ) {
          await convex.mutation(subscriptionsApi.recordLifecycleAlert, {
            subscriptionId: sub._id,
            stage: "5_DAYS",
            lifecycleStatus: "EXPIRING",
          });

          // In-App Notification
          try {
            await convex.mutation(notificationsApi.createNotification, {
              orgId: sub.orgId,
              title: "⚠️ Votre abonnement expire dans 5 jours",
              message: `Il vous reste 5 jours d'accès complet à votre forfait ${planName}. Pensez à renouveler pour conserver vos quotas et fonctionnalités avancées.`,
              type: "WARNING",
              linkUrl: "/dashboard/pricing",
            });
          } catch (notifErr) {
            console.warn("[Lifecycle] In-app 5-day notification error:", notifErr);
          }

          // Email Notification
          if (userEmail) {
            try {
              await sendSubscriptionExpiringAlertEmail({
                to: userEmail,
                name: userName,
                plan: planName,
                daysRemaining: 5,
                renewUrl: "https://lsho.cc/dashboard/pricing",
              });
            } catch (mailErr) {
              console.error("[Lifecycle] Email 5-day error:", mailErr);
            }
          }

          results.notified5Days++;
        }
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      results,
    });
  } catch (error: any) {
    console.error("[Subscription Lifecycle Cron] Fatal error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error during lifecycle cron.",
      },
      { status: 500 }
    );
  }
}
