import { NextResponse } from "next/server";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { getDodoPaymentsClient } from "@/lib/dodo/dodo-server";
import { getPaddleInstance } from "@/lib/paddle/paddle-server";
import { syncUserToCloudflare } from "@/app/actions/sync-user";
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
 * 1. Pre-renewal Email Reminders (J-3, J-2, J-1):
 *    - Send email reminder at 3 days, 2 days, and 1 day before renewal
 *    - Keep frontend grace banner hidden while subscription is active
 * 2. Renewal Failure / Grace Period (24h / 1 day):
 *    - Triggered immediately on failure webhook or at expiration without renewal
 *    - In-App Alert Notification + Email warning (24h left before Freemium)
 *    - Top grace banner becomes visible for 24h
 * 3. Downgrade to Freemium (after 24h without renewal):
 *    - Downgrade plan to FREE in Convex + Cloudflare D1
 *    - In-App Notification + Email ("Votre plan a été ramené en plan Freemium")
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
    const dodoClient = getDodoPaymentsClient();
    const paddleClient = getPaddleInstance();
    const results = {
      evaluated: activeSubs.length,
      renewedViaDodo: 0,
      renewedViaPaddle: 0,
      notified3Days: 0,
      notified2Days: 0,
      notified1Day: 0,
      enteredGracePeriod: 0,
      downgradedToFree: 0,
    };

    const syncConfirmedRenewal = async (opts: {
      sub: any;
      cleanUserId: string;
      userEmail?: string;
      userName: string;
      planName: string;
      provider: "dodo" | "paddle";
      providerLabel: string;
      prevBillingMs: number;
      nextBillingMs: number;
      cancelAtPeriodEnd: boolean;
    }) => {
      await convex.mutation(subscriptionsApi.upsertSubscription, {
        orgId: opts.sub.orgId,
        provider: opts.provider,
        providerSubscriptionId: opts.sub.providerSubscriptionId,
        currentPeriodStart: opts.prevBillingMs,
        currentPeriodEnd: opts.nextBillingMs,
        cancelAtPeriodEnd: opts.cancelAtPeriodEnd,
        plan: opts.planName,
        cycle: opts.sub.cycle || "MONTHLY",
      });

      if (opts.cleanUserId) {
        await convex
          .mutation(usersApi.updatePlan, {
            userId: opts.cleanUserId,
            plan: opts.planName,
          })
          .catch((uPlanErr) =>
            console.warn("[Lifecycle] Convex updatePlan warning:", uPlanErr)
          );
        if (opts.userEmail) {
          await syncUserToCloudflare({
            id: opts.cleanUserId,
            name: opts.userName || opts.cleanUserId,
            email: opts.userEmail,
            plan: opts.planName as "FREE" | "FREEMIUM" | "PRO" | "BUSINESS" | "ENTERPRISE",
          }).catch((e) =>
            console.warn("[Lifecycle] Cloudflare plan sync error:", e)
          );
        }
      }

      try {
        await convex.mutation(notificationsApi.createNotification, {
          orgId: opts.sub.orgId,
          title: "Abonnement renouvelé avec succès",
          message: `Votre abonnement ${opts.planName} a été renouvelé automatiquement via ${opts.providerLabel} jusqu'au ${new Date(opts.nextBillingMs).toLocaleDateString("fr-FR")}.`,
          type: "SUCCESS",
          linkUrl: "/dashboard/settings?tab=billing",
        });
      } catch (notifErr) {
        console.warn("[Lifecycle] In-app renewal notification error:", notifErr);
      }
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
      // CASE 0: Provider Auto-Renewal Reconciliation at Period End (Dodo & Paddle)
      // Verifies provider status before entering grace period or downgrading so
      // active recurring subscriptions never falsely lose access due to delayed webhooks.
      // ───────────────────────────────────────────────────────────────────────
      if (now >= currentPeriodEnd && sub.providerSubscriptionId) {
        let transientProviderError = false;
        if (sub.provider === "dodo" && dodoClient) {
          try {
            const dodoSub = await dodoClient.subscriptions.retrieve(sub.providerSubscriptionId);
            const nextBillingMs = dodoSub?.next_billing_date
              ? new Date(dodoSub.next_billing_date).getTime()
              : NaN;

            if (
              dodoSub?.status === "active" &&
              !Number.isNaN(nextBillingMs) &&
              nextBillingMs > now &&
              nextBillingMs > currentPeriodEnd
            ) {
              const prevBillingMs = dodoSub.previous_billing_date
                ? new Date(dodoSub.previous_billing_date).getTime()
                : currentPeriodEnd;
              await syncConfirmedRenewal({
                sub,
                cleanUserId,
                userEmail,
                userName,
                planName,
                provider: "dodo",
                providerLabel: "Dodo Payments",
                prevBillingMs: Number.isNaN(prevBillingMs) ? currentPeriodEnd : prevBillingMs,
                nextBillingMs,
                cancelAtPeriodEnd: Boolean(dodoSub.cancel_at_next_billing_date),
              });
              results.renewedViaDodo++;
              continue;
            }
          } catch (dodoErr: any) {
            const status = dodoErr?.status ?? dodoErr?.statusCode;
            if (status !== 404 && !sub.cancelAtPeriodEnd) {
              transientProviderError = true;
            }
            console.warn(`[Lifecycle] Failed to retrieve Dodo subscription ${sub.providerSubscriptionId}:`, dodoErr);
          }
        } else if (sub.provider !== "dodo" && paddleClient && sub.providerSubscriptionId.startsWith("sub_")) {
          try {
            const paddleSub = await paddleClient.subscriptions.get(sub.providerSubscriptionId);
            const nextBillingMs = paddleSub?.currentBillingPeriod?.endsAt
              ? new Date(paddleSub.currentBillingPeriod.endsAt).getTime()
              : NaN;
            if (
              paddleSub &&
              (paddleSub.status === "active" || paddleSub.status === "trialing") &&
              !Number.isNaN(nextBillingMs) &&
              nextBillingMs > now &&
              nextBillingMs > currentPeriodEnd
            ) {
              const prevBillingMs = paddleSub.currentBillingPeriod?.startsAt
                ? new Date(paddleSub.currentBillingPeriod.startsAt).getTime()
                : currentPeriodEnd;
              await syncConfirmedRenewal({
                sub,
                cleanUserId,
                userEmail,
                userName,
                planName,
                provider: "paddle",
                providerLabel: "Paddle",
                prevBillingMs: Number.isNaN(prevBillingMs) ? currentPeriodEnd : prevBillingMs,
                nextBillingMs,
                cancelAtPeriodEnd: paddleSub.scheduledChange?.action === "cancel",
              });
              results.renewedViaPaddle++;
              continue;
            }
          } catch (paddleErr: any) {
            const status = paddleErr?.status ?? paddleErr?.statusCode;
            if (status !== 404 && !sub.cancelAtPeriodEnd) {
              transientProviderError = true;
            }
            console.warn(`[Lifecycle] Failed to retrieve Paddle subscription ${sub.providerSubscriptionId}:`, paddleErr);
          }
        }

        if (transientProviderError) {
          continue;
        }
      }

      // ───────────────────────────────────────────────────────────────────────
      // CASE 4: Grace Period Expired (+24h without renewal) -> Downgrade to Freemium (FREE)
      // Must ONLY execute after subscription actually entered GRACE_PERIOD with a deadline.
      // ───────────────────────────────────────────────────────────────────────
      const inRecordedGrace =
        sub.lifecycleStatus === "GRACE_PERIOD" &&
        typeof sub.gracePeriodEndsAt === "number";

      if (inRecordedGrace && now >= sub.gracePeriodEndsAt) {
        // Execute downgrade in Convex (subscription + users table)
        await convex.mutation(subscriptionsApi.downgradeSubscriptionToFree, {
          subscriptionId: sub._id,
        });

        // Sync FREE plan limits to Cloudflare D1 Edge
        if (cleanUserId && userEmail) {
          await syncUserToCloudflare({
            id: cleanUserId,
            name: userName || cleanUserId,
            email: userEmail,
            plan: "FREE",
          }).catch((cfErr) =>
            console.warn("[Lifecycle] Cloudflare downgrade sync error:", cfErr)
          );
        }

        // In-App Notification
        try {
          await convex.mutation(notificationsApi.createNotification, {
            orgId: sub.orgId,
            title: "ℹ️ Plan ramené en plan Freemium",
            message: `Le délai de 24h pour renouveler votre abonnement ${planName} est arrivé à échéance sans renouvellement. Votre plan a été ramené en plan Freemium (FREE). Vos liens continuent de fonctionner.`,
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
      // CASE 3: Renewal Failure / Period Ended -> 24h (1-Day) Grace Period
      // ───────────────────────────────────────────────────────────────────────
      const activeGraceDeadline =
        typeof sub.gracePeriodEndsAt === "number" ? sub.gracePeriodEndsAt : 0;
      const needsGraceActivation =
        sub.lifecycleStatus !== "GRACE_PERIOD" && now >= currentPeriodEnd;
      const inGraceWindow =
        (sub.lifecycleStatus === "GRACE_PERIOD" &&
          (!activeGraceDeadline || now < activeGraceDeadline)) ||
        needsGraceActivation;

      if (inGraceWindow) {
        if (lastAlert !== "GRACE_PERIOD" && lastAlert !== "DOWNGRADED") {
          const full24hGraceEndsAt = now + 24 * 60 * 60 * 1000;
          // Record Grace Period in Convex with a full 24h window from notification dispatch
          await convex.mutation(subscriptionsApi.recordLifecycleAlert, {
            subscriptionId: sub._id,
            stage: "GRACE_PERIOD",
            lifecycleStatus: "GRACE_PERIOD",
            gracePeriodEndsAt: full24hGraceEndsAt,
          });

          // In-App Notification
          try {
            await convex.mutation(notificationsApi.createNotification, {
              orgId: sub.orgId,
              title: "⚠️ Échec de renouvellement — 24h restantes",
              message: `Le renouvellement de votre abonnement ${planName} a échoué. Il vous reste 24h pour renouveler votre abonnement avant que votre plan soit ramené en Freemium.`,
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
                isPaymentFailure: true,
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
      // CASE 1: Pre-Renewal Email Reminders (J-3, J-2, J-1 — UI Banner stays hidden)
      // ───────────────────────────────────────────────────────────────────────
      const reminderConfig: Record<
        number,
        {
          stage: "3_DAYS" | "2_DAYS" | "1_DAY";
          skippedIf: string[];
          counterKey: "notified3Days" | "notified2Days" | "notified1Day";
        }
      > = {
        3: {
          stage: "3_DAYS",
          skippedIf: ["3_DAYS", "2_DAYS", "1_DAY", "GRACE_PERIOD", "DOWNGRADED"],
          counterKey: "notified3Days",
        },
        2: {
          stage: "2_DAYS",
          skippedIf: ["2_DAYS", "1_DAY", "GRACE_PERIOD", "DOWNGRADED"],
          counterKey: "notified2Days",
        },
        1: {
          stage: "1_DAY",
          skippedIf: ["1_DAY", "GRACE_PERIOD", "DOWNGRADED"],
          counterKey: "notified1Day",
        },
      };

      const reminder =
        daysRemaining >= 1 && daysRemaining <= 3
          ? reminderConfig[daysRemaining]
          : undefined;

      if (reminder) {
        if (!reminder.skippedIf.includes(lastAlert)) {
          const isAutoRenew =
            Boolean(sub.providerSubscriptionId) && !sub.cancelAtPeriodEnd;

          await convex.mutation(subscriptionsApi.recordLifecycleAlert, {
            subscriptionId: sub._id,
            stage: reminder.stage,
            lifecycleStatus: isAutoRenew ? "ACTIVE" : "EXPIRING",
          });

          if (userEmail) {
            try {
              await sendSubscriptionExpiringAlertEmail({
                to: userEmail,
                name: userName,
                plan: planName,
                daysRemaining,
                isAutoRenew,
                renewUrl: isAutoRenew
                  ? "https://lsho.cc/dashboard/settings?tab=billing"
                  : "https://lsho.cc/dashboard/pricing",
              });
            } catch (mailErr) {
              console.error(`[Lifecycle] Email J-${daysRemaining} error:`, mailErr);
            }
          }

          results[reminder.counterKey]++;
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
