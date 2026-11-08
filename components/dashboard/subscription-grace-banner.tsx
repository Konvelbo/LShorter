"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { Clock, AlertTriangle, ArrowRight, X } from "lucide-react";

export function SubscriptionGraceBanner() {
  const { data: session, status } = useSession();
  const [subData, setSubData] = useState<{
    plan?: string;
    currentPeriodEnd?: number;
    lifecycleStatus?: string;
    gracePeriodEndsAt?: number;
    lastLifecycleAlert?: string;
  } | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    if (status !== "authenticated" || !session?.user?.id) return;

    fetch("/api/billing/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && data?.subscription) {
          setSubData(data.subscription);
        }
      })
      .catch(() => null);
  }, [status, session?.user?.id]);

  if (isDismissed || !subData) return null;

  const plan = subData.plan || "PRO";
  if (plan === "FREE" || plan === "FREEMIUM") return null;

  const now = Date.now();
  const periodEnd = subData.currentPeriodEnd || 0;
  if (!periodEnd) return null;

  const graceEndsAt = subData.gracePeriodEndsAt || (periodEnd + 24 * 60 * 60 * 1000);
  const isGrace = now >= periodEnd && now < graceEndsAt;

  const msRemaining = periodEnd - now;
  const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
  const isExpiringSoon = !isGrace && daysRemaining <= 5 && daysRemaining > 0;

  if (!isGrace && !isExpiringSoon) return null;

  if (isGrace) {
    const hoursLeft = Math.max(1, Math.ceil((graceEndsAt - now) / (1000 * 60 * 60)));

    return (
      <div className="w-full bg-amber-500/10 dark:bg-amber-500/15 border-b border-amber-500/30 px-4 py-2.5 text-xs text-amber-900 dark:text-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="p-1 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
            <Clock className="w-4 h-4 animate-pulse" />
          </span>
          <div className="flex flex-wrap items-center gap-1.5 leading-snug">
            <span className="font-bold text-amber-800 dark:text-amber-100">
              Période de grâce ({hoursLeft}h restantes) :
            </span>
            <span>
              On vous a accordé 1 jour pour vous remettre à jour avant le passage au plan gratuit.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <Link
            href="/dashboard/pricing"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <span>Régulariser mon compte</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-blue-500/10 dark:bg-blue-500/15 border-b border-blue-500/20 px-4 py-2.5 text-xs text-blue-950 dark:text-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="p-1 rounded bg-blue-500/20 text-blue-600 dark:text-blue-400 shrink-0">
          <AlertTriangle className="w-4 h-4" />
        </span>
        <div className="flex flex-wrap items-center gap-1.5 leading-snug">
          <span className="font-bold text-blue-900 dark:text-blue-100">
            Forfait {plan} :
          </span>
          <span>
            Votre abonnement expire dans {daysRemaining} jour{daysRemaining > 1 ? "s" : ""}. Renouvelez dès maintenant pour conserver vos quotas et domaines.
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
        <Link
          href="/dashboard/pricing"
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-[#0066FF] hover:bg-[#0052cc] text-white font-semibold text-xs transition-colors"
        >
          <span>Renouveler</span>
          <ArrowRight className="w-3 h-3" />
        </Link>
        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          aria-label="Fermer l'alerte"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
