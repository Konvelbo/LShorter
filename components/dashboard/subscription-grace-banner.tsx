"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Clock, ArrowRight } from "lucide-react";

export function SubscriptionGraceBanner() {
  const { data: session, status } = useSession();
  const [subData, setSubData] = useState<{
    plan?: string;
    currentPeriodEnd?: number;
    lifecycleStatus?: string;
    gracePeriodEndsAt?: number;
    lastLifecycleAlert?: string;
  } | null>(null);
  const [now, setNow] = useState<number>(0);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    fetch("/api/billing/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && data?.subscription) {
          setNow(Date.now());
          setSubData(data.subscription);
        }
      })
      .catch(() => null);
  }, [status, session?.user?.id]);

  if (!subData || !now) return null;

  const plan = subData.plan || "PRO";
  if (plan === "FREE" || plan === "FREEMIUM") return null;

  const periodEnd = subData.currentPeriodEnd || 0;
  const graceEndsAt =
    subData.gracePeriodEndsAt || (periodEnd ? periodEnd + 24 * 60 * 60 * 1000 : 0);

  if (!graceEndsAt || subData.lifecycleStatus === "DOWNGRADED") return null;

  const isExplicitGrace = subData.lifecycleStatus === "GRACE_PERIOD" && now < graceEndsAt;
  const isPeriodGrace = Boolean(periodEnd) && now >= periodEnd && now < graceEndsAt;
  const isGrace = isExplicitGrace || isPeriodGrace;

  // Only show banner when subscription is in its 24h failure / grace period before Freemium downgrade
  if (!isGrace) return null;

  const hoursLeft = Math.max(1, Math.min(24, Math.ceil((graceEndsAt - now) / (1000 * 60 * 60))));

  return (
    <div
      data-testid="subscription-grace-banner"
      className="w-full bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all"
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="p-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
          <Clock className="w-4 h-4 animate-pulse" />
        </span>
        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
          <span className="font-bold text-amber-800 dark:text-amber-100">
            Période de grâce — 1 jour ({hoursLeft}h restantes) :
          </span>
          <span>
            Le renouvellement de votre forfait {plan} a échoué. Il vous reste {hoursLeft}h pour renouveler avant le passage au plan Freemium.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <Link
          href="/dashboard/pricing"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors"
        >
          <span>Renouveler maintenant</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
