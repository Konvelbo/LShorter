"use client";

import React, { useState, useEffect } from "react";
import gsap from "gsap";
import {
  X,
  Check,
  Crown,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { showToast } from "@/components/ui/toast-provider";
import { syncUserToCloudflare } from "@/app/actions/sync-user";
import confetti from "canvas-confetti";

export function PlanUpgradeModal() {
  const { data: session, update: updateSession } = useSession();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");
  const rawPlan = (convexUser?.plan || (session?.user as any)?.plan || "FREE").toUpperCase();
  const currentPlan = rawPlan === "FREEMIUM" || rawPlan === "STARTER" ? "FREE" : rawPlan;

  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<"PRO" | "BUSINESS" | "ENTERPRISE" | null>(null);

  const updatePlanMutation = useMutation(api.users.updatePlan);

  useEffect(() => {
    const handleUpgradeRequest = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason?: string }>;
      const rawReason = customEvent.detail?.reason;
      // Ensure English fallback/message if default French string is passed
      const isFrenchReason =
        rawReason &&
        (rawReason.includes("forfait") ||
          rawReason.includes("Passez") ||
          rawReason.includes("fonctionnalité") ||
          rawReason.includes("réservé"));
      setReason(
        !rawReason || isFrenchReason
          ? "Upgrade to the Pro plan to configure click, revenue, and expiration alerts on your individual links."
          : rawReason
      );
      setIsOpen(true);
    };

    window.addEventListener("lshorter_plan_upgrade_requested", handleUpgradeRequest);
    return () => {
      window.removeEventListener("lshorter_plan_upgrade_requested", handleUpgradeRequest);
    };
  }, []);

  if (!isOpen) return null;

  const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1.02,
      y: -5,
      duration: 0.18,
      ease: "power2.out",
      zIndex: 10,
    });
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      y: 0,
      duration: 0.18,
      ease: "power2.out",
      zIndex: 1,
    });
  };

  const handleUpgrade = async (targetPlan: "PRO" | "BUSINESS" | "ENTERPRISE") => {
    if (currentPlan === targetPlan) {
      showToast.info(`You are already subscribed to the ${targetPlan} plan.`);
      return;
    }

    if (!session?.user) {
      window.location.href = `/checkout?plan=${targetPlan}&cycle=MONTHLY`;
      return;
    }

    setLoadingPlan(targetPlan);
    try {
      try {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: targetPlan,
            cycle: "MONTHLY",
            userId,
            customerEmail: session?.user?.email || undefined,
            successUrl: `${window.location.origin}/dashboard/settings?tab=billing&checkout_success=true&plan=${targetPlan}`,
            cancelUrl: window.location.href,
          }),
        });

        const data = await res.json();
        if (data.success && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }

        if (data.error) {
          console.warn("[UpgradeModal] Direct checkout API notice, falling back to /checkout:", data.error);
          window.location.href = `/checkout?plan=${targetPlan}&cycle=MONTHLY`;
          return;
        }
      } catch (apiErr) {
        console.warn("[UpgradeModal] Direct checkout error, redirecting to /checkout:", apiErr);
        window.location.href = `/checkout?plan=${targetPlan}&cycle=MONTHLY`;
        return;
      }
    } catch {
      showToast.error("Unable to initiate checkout session.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div
      onClick={() => setIsOpen(false)}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-in fade-in select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[680px] rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] p-6 sm:p-8 shadow-2xl text-zinc-900 dark:text-white max-h-[92vh] overflow-y-auto cursor-default"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsOpen(false)}
          aria-label="Close modal"
          className="absolute right-4 top-4 text-zinc-400 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white p-1.5 rounded-[8px] hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-start gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-[10px] bg-[#1D4ED8] flex items-center justify-center text-white shadow-xs shrink-0 mt-0.5">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xl sm:text-[22px] font-bold text-zinc-900 dark:text-white tracking-tight leading-snug">
              Upgrade Your Performance
            </h3>
            <p className="text-xs sm:text-[13px] text-zinc-500 dark:text-neutral-400 mt-1 leading-relaxed">
              {reason ||
                "Upgrade to the Pro plan to configure click, revenue, and expiration alerts on your individual links."}
            </p>
          </div>
        </div>

        {/* Plans Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 mt-7">
          {/* Plan PRO */}
          <div
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            className="relative p-5 sm:p-6 rounded-[10px] bg-[#F8FAFF] dark:bg-[#181920] border-[1.5px] border-[#1D4ED8] dark:border-[#3B82F6] flex flex-col justify-between shadow-xs will-change-transform"
          >
            <div className="absolute -top-3 left-5 px-2.5 py-0.5 rounded-[6px] bg-[#1D4ED8] text-white text-[11px] font-bold tracking-wide">
              Offer -75%
            </div>

            <div>
              <div className="text-xs font-bold text-[#1D4ED8] dark:text-[#60A5FA] uppercase tracking-wider mt-1">
                PRO
              </div>

              <div className="flex items-baseline justify-between gap-2 mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-[36px] font-extrabold text-zinc-900 dark:text-white tracking-tight leading-none">
                    $3.75
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-neutral-400 font-medium">
                    / 2 months
                  </span>
                </div>
                <span className="text-sm text-zinc-400 dark:text-neutral-500 line-through font-medium">
                  $15
                </span>
              </div>

              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                You save $22.50 over 2 months
              </p>

              <div className="my-4 py-2.5 border-y border-zinc-200/80 dark:border-[#27272a] text-xs text-zinc-500 dark:text-neutral-400">
                <strong className="font-bold text-zinc-900 dark:text-white">
                  150,000 clicks
                </strong>{" "}
                · +$3 / 50k
              </div>

              <ul className="flex flex-col gap-2.5 text-xs text-zinc-700 dark:text-neutral-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold text-zinc-900 dark:text-white">
                      6 domains
                    </strong>{" "}
                    and 1,000 active links
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Dynamic Smart Routing (country + OS/device)</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>PIN codes and destination masking</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>5 webhooks and 5 retargeting pixels</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleUpgrade("PRO")}
              disabled={loadingPlan !== null || currentPlan === "PRO"}
              className={`mt-6 w-full py-2.5 rounded-[8px] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:cursor-default ${
                currentPlan === "PRO"
                  ? "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-neutral-400"
                  : "bg-[#1D4ED8] hover:bg-[#1E40AF] text-white disabled:opacity-50"
              }`}
            >
              {loadingPlan === "PRO" ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Activating...</span>
                </span>
              ) : currentPlan === "PRO" ? (
                <span>Current plan</span>
              ) : (
                <>
                  <span>
                    {currentPlan === "BUSINESS" || currentPlan === "ENTERPRISE"
                      ? "Switch to Pro · $3.75"
                      : "Upgrade to Pro · $3.75"}
                  </span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Plan BUSINESS */}
          <div
            onMouseEnter={handleCardMouseEnter}
            onMouseLeave={handleCardMouseLeave}
            className="relative p-5 sm:p-6 rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-neutral-600 flex flex-col justify-between transition-colors shadow-xs will-change-transform"
          >
            <div className="absolute -top-3 left-5 px-2.5 py-0.5 rounded-[6px] bg-[#047857] text-white text-[11px] font-bold tracking-wide">
              Offer -60%
            </div>

            <div>
              <div className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider mt-1">
                BUSINESS
              </div>

              <div className="flex items-baseline justify-between gap-2 mt-2">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-3xl sm:text-[36px] font-extrabold text-zinc-900 dark:text-white tracking-tight leading-none">
                    $19.60
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-neutral-400 font-medium">
                    / 2 months
                  </span>
                </div>
                <span className="text-sm text-zinc-400 dark:text-neutral-500 line-through font-medium">
                  $49
                </span>
              </div>

              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2">
                You save $58.80 over 2 months
              </p>

              <div className="my-4 py-2.5 border-y border-zinc-200/80 dark:border-[#27272a] text-xs text-zinc-500 dark:text-neutral-400">
                <strong className="font-bold text-zinc-900 dark:text-white">
                  500,000 clicks
                </strong>{" "}
                · +$8 / 125k
              </div>

              <ul className="flex flex-col gap-2.5 text-xs text-zinc-700 dark:text-neutral-300">
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>
                    <strong className="font-semibold text-zinc-900 dark:text-white">
                      15 domains
                    </strong>{" "}
                    and unlimited links
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Multi-condition rule engine</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>Unlimited webhooks and pixels</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>5 team seats and certified PDF invoices</span>
                </li>
              </ul>
            </div>

            <button
              type="button"
              onClick={() => handleUpgrade("BUSINESS")}
              disabled={loadingPlan !== null || currentPlan === "BUSINESS"}
              className={`mt-6 w-full py-2.5 rounded-[8px] font-semibold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:cursor-default ${
                currentPlan === "BUSINESS"
                  ? "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-neutral-400"
                  : "bg-[#0F172A] hover:bg-[#1E293B] dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 disabled:opacity-50"
              }`}
            >
              {loadingPlan === "BUSINESS" ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Activating...</span>
                </span>
              ) : currentPlan === "BUSINESS" ? (
                <span>Current plan</span>
              ) : (
                <>
                  <span>Upgrade to Business · $19.60</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-zinc-400 dark:text-neutral-500 mt-6">
          Instant activation: switch or upgrade your plan in 1 click from your settings.
        </p>
      </div>
    </div>
  );
}
