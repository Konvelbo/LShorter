"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Sparkles,
  Check,
  Zap,
  ShieldCheck,
  Crown,
  Globe2,
  Lock,
  QrCode,
  Layers,
  ArrowRight,
  RefreshCw
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PlanType } from "@/types";
import { showToast } from "@/components/ui/toast-provider";
import { syncUserToCloudflare } from "@/app/actions/sync-user";
import { sendPlanPurchaseConfirmationAction } from "@/app/actions/plan-purchase";
import { PRICING_PLANS } from "@/src/config/pricing";
import confetti from "canvas-confetti";

export function PlanUpgradeModal() {
  const { data: session, update: updateSession } = useSession();
  const userId = session?.user?.id || "";
  const currentPlan = (session?.user as any)?.plan || "FREE";

  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<"PRO" | "BUSINESS" | "ENTERPRISE" | null>(null);

  const updatePlanMutation = useMutation(api.users.updatePlan);

  useEffect(() => {
    const handleUpgradeRequest = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason?: string }>;
      setReason(customEvent.detail?.reason || "Upgrade to the Pro or Business plan to unlock this advanced feature.");
      setIsOpen(true);
    };

    window.addEventListener("lshorter_plan_upgrade_requested", handleUpgradeRequest);
    return () => {
      window.removeEventListener("lshorter_plan_upgrade_requested", handleUpgradeRequest);
    };
  }, []);

  if (!isOpen) return null;

  const handleUpgrade = async (targetPlan: "PRO" | "BUSINESS" | "ENTERPRISE") => {
    setLoadingPlan(targetPlan);
    try {
      if (userId) {
        // 1. Update in Convex database
        await updatePlanMutation({
          userId,
          plan: targetPlan,
        });

        // 2. Synchronize plan directly into Cloudflare Worker D1 database
        await syncUserToCloudflare({
          id: userId,
          email: session?.user?.email || `${userId}@lshorter.local`,
          name: session?.user?.name || "User",
          plan: targetPlan,
        });
      }

      if (typeof window !== "undefined") {
        // 3. Persist plan in localStorage
        localStorage.setItem("lshorter_user_plan", targetPlan);
        // 4. Notify all components
        window.dispatchEvent(new CustomEvent("lshorter_plan_updated", { detail: { plan: targetPlan } }));
      }

      // 5. Force NextAuth session refresh
      try { await updateSession({ plan: targetPlan }); } catch {}

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      showToast.success(`Congratulations! You are now subscribed to the ${targetPlan} plan.`);
      setIsOpen(false);

      // Dispatch plan purchase confirmation email with expiration date
      if (userId) {
        sendPlanPurchaseConfirmationAction({
          userId,
          userEmail: session?.user?.email || undefined,
          userName: session?.user?.name || undefined,
          plan: targetPlan,
          cycle: "MONTHLY",
        }).catch((err) => console.error("Error sending plan confirmation email:", err));
      }
    } catch (err: any) {
      showToast.error("Unable to upgrade subscription plan.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div
      onClick={() => setIsOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/85 backdrop-blur-md animate-in fade-in select-none cursor-pointer"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-brand-subtle p-6 sm:p-8 shadow-xl text-zinc-900 dark:text-white max-h-[92vh] overflow-y-auto cursor-default"
      >
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="absolute right-4 top-4 text-zinc-400 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[10px] bg-brand flex items-center justify-center text-white shadow-xs font-bold">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-wide">Upgrade Your Performance</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-subtle text-brand text-[10px] font-bold uppercase tracking-wider border border-brand-subtle">
                PRO &amp; BUSINESS
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
              {reason || "Unlock the full suite of edge optimization tools with zero restrictions."}
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-5">
          {[
            { icon: Zap, text: "500k to 5M Edge Clicks with Zero-Downtime" },
            { icon: Globe2, text: "Smart Routing (195+ Countries & Devices)" },
            { icon: Lock, text: "Password Protection & Link Cloaking" },
            { icon: QrCode, text: "Vector SVG & PDF QR Code Studio" },
            { icon: Layers, text: "Up to 50 Branded Custom Domains" },
            { icon: ShieldCheck, text: "Webhooks, Pixels & PDF Billing" },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2 p-2.5 rounded-[10px] bg-zinc-100 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-800 dark:text-neutral-200"
              >
                <Icon className="w-4 h-4 text-brand shrink-0" />
                <span className="text-[11px] font-medium leading-tight">{f.text}</span>
              </div>
            );
          })}
        </div>

        {/* Plans Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
          {/* Plan PRO */}
          <div className="relative p-5 rounded-[14px] bg-brand/[0.03] dark:bg-[#1a1a1e] border-2 border-brand flex flex-col justify-between shadow-xs group">
            <div className="absolute -top-3.5 right-4 px-3 py-1 rounded-full bg-brand text-white text-[10.5px] font-black tracking-wide uppercase shadow-md shadow-brand/30 flex items-center gap-1">
              <span>🔥 Deal: -75%</span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Pro Plan</span>
                <span className="text-[11px] text-brand font-bold">500,000 clicks</span>
              </div>
              <div className="flex items-baseline flex-wrap gap-2 my-2.5">
                <span className="text-xs text-zinc-400 line-through font-mono">$15</span>
                <span className="text-3xl font-black text-zinc-900 dark:text-white">$3.75</span>
                <span className="text-xs text-zinc-500 dark:text-neutral-400">/ 1st month</span>
                <span className="ml-auto px-2 py-0.5 rounded-md text-xs font-black font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                  -75%
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-md w-fit mb-2">
                <span>💰 You save $11.25</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs text-zinc-700 dark:text-neutral-300 mt-2">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>3 domains</strong> &amp; 1,000 active links</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Advanced Routing (Country + OS/Device)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Password PIN gates &amp; link cloaking</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>5 Webhooks &amp; 5 Retargeting Pixels</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade("PRO")}
              disabled={loadingPlan !== null}
              className="mt-5 w-full py-2.5 rounded-[10px] bg-brand hover:bg-brand-hover text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loadingPlan === "PRO" ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Activating...</span>
                </span>
              ) : (
                <>
                  <span>Upgrade to Pro ($3.75)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Plan BUSINESS */}
          <div className="relative p-5 rounded-[14px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-neutral-500 flex flex-col justify-between transition-colors shadow-xs">
            <div className="absolute -top-3.5 right-4 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10.5px] font-black tracking-wide uppercase shadow-md shadow-emerald-500/20 flex items-center gap-1">
              <span>🔥 Deal: -60%</span>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Business Plan</span>
                <span className="text-[11px] text-emerald-500 font-bold">2M clicks</span>
              </div>
              <div className="flex items-baseline flex-wrap gap-2 my-2.5">
                <span className="text-xs text-zinc-400 line-through font-mono">$49</span>
                <span className="text-3xl font-black text-zinc-900 dark:text-white">$19.60</span>
                <span className="text-xs text-zinc-500 dark:text-neutral-400">/ 1st month</span>
                <span className="ml-auto px-2 py-0.5 rounded-md text-xs font-black font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                  -60%
                </span>
              </div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-md w-fit mb-2">
                <span>💰 You save $29.40</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs text-zinc-700 dark:text-neutral-300 mt-2">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>15 domains</strong> &amp; Unlimited links</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Custom multi-condition rule engine</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Unlimited Webhooks &amp; Pixels</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>5 team seats &amp; Certified PDF invoices</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade("BUSINESS")}
              disabled={loadingPlan !== null}
              className="mt-5 w-full py-2.5 rounded-[10px] bg-zinc-900 dark:bg-white/10 hover:bg-zinc-800 dark:hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-zinc-900 dark:border-white/20 shadow-xs cursor-pointer disabled:opacity-50"
            >
              {loadingPlan === "BUSINESS" ? (
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Activating...</span>
                </span>
              ) : (
                <>
                  <span>Upgrade to Business ($19.60)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-500 dark:text-neutral-500 mt-5">
          Cancel anytime. Change or cancel your subscription in 1 click at any time from your settings.
        </p>
      </div>
    </div>
  );
}
