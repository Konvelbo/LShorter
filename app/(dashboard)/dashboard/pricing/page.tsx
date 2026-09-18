"use client";

import React, { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import {
  Check,
  X,
  Zap,
  Crown,
  Sparkles,
  ShieldCheck,
  Layers,
  ArrowRight,
  Globe2,
  Lock,
  QrCode,
  Radio,
  KeyRound,
  Shield,
  CreditCard,
  RefreshCw,
  FileCheck
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PlanType } from "@/types";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast-provider";
import { syncUserToCloudflare } from "@/app/actions/sync-user";
import { sendPlanPurchaseConfirmationAction } from "@/app/actions/plan-purchase";
import { PricingPageSkeleton } from "@/components/ui/skeleton";
import { PRICING_PLANS, PRICING_COPY } from "@/src/config/pricing";
import confetti from "canvas-confetti";

export default function PricingPage() {
  const { data: session, status, update: updateSession } = useSession();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");
  const rawPlan = (convexUser?.plan || (session?.user as any)?.plan || "FREE").toUpperCase();
  const currentPlan = rawPlan === "FREEMIUM" ? "FREE" : rawPlan;

  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const updatePlanMutation = useMutation(api.users.updatePlan);

  useEffect(() => {
    if (cardsContainerRef.current) {
      gsap.fromTo(
        cardsContainerRef.current.children,
        { opacity: 0, y: 25, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.5,
          stagger: 0.08,
          ease: "power2.out",
        }
      );
    }
  }, [isAnnual]);

  if (status === "loading") {
    return <PricingPageSkeleton />;
  }

  const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>, isPopular: boolean) => {
    gsap.to(e.currentTarget, {
      scale: 1.025,
      y: -6,
      duration: 0.3,
      ease: "power2.out",
      zIndex: 10,
    });
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>, isPopular: boolean) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      y: 0,
      duration: 0.3,
      ease: "power2.out",
      zIndex: 1,
    });
  };

  const handleSelectPlan = async (planKey: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE') => {
    if (currentPlan === planKey) {
      showToast.info(`You are already subscribed to the ${planKey} plan.`);
      return;
    }

    setLoadingPlan(planKey);
    try {
      if (userId) {
        // 1. Update in Convex database
        await updatePlanMutation({
          userId,
          plan: planKey as any,
        });

        // 2. Synchronize directly in Cloudflare D1
        await syncUserToCloudflare({
          id: userId,
          email: session?.user?.email || `${userId}@lshorter.local`,
          name: session?.user?.name || "User",
          plan: planKey as any,
        });
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("lshorter_user_plan", planKey);
        window.dispatchEvent(new CustomEvent("lshorter_plan_updated", { detail: { plan: planKey } }));
      }

      try {
        await updateSession({ plan: planKey });
      } catch {}

      confetti({ particleCount: 75, spread: 80, origin: { y: 0.6 } });
      showToast.success(`Plan successfully updated to ${planKey}!`);

      // 3. Dispatch Plan Purchase thank-you & expiration date confirmation email
      if (userId && planKey !== "FREE") {
        sendPlanPurchaseConfirmationAction({
          userId,
          userEmail: session?.user?.email || undefined,
          userName: session?.user?.name || undefined,
          plan: planKey,
          cycle: isAnnual ? "YEARLY" : "MONTHLY",
        }).catch((err) => console.error("Error sending plan purchase confirmation email:", err));
      }
    } catch (err: any) {
      showToast.error("Error updating subscription plan.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const plansList = [
    {
      id: "FREE" as const,
      name: PRICING_PLANS.FREE.name,
      tagline: PRICING_COPY.planExplanations.free,
      displayPrice: "$0",
      originalPrice: null,
      subPriceNote: null,
      discountPercent: 0,
      savingsAmount: null,
      unit: "forever",
      badge: "Free",
      popular: false,
      features: [
        "10,000 clicks / month included",
        "50 active short links",
        "Basic routing (1 country rule)",
        "QR Code Studio (Basic styles)",
        "Analytics retention: 30 days",
        "Developer API keys (60 req/min)",
        "Community support",
      ],
      limitations: [
        "Custom domains not included",
        "Advanced & device routing not included",
        "Password protection & cloaking not included",
        "Webhooks & Pixels not included",
      ],
    },
    {
      id: "PRO" as const,
      name: PRICING_PLANS.PRO.name,
      tagline: PRICING_COPY.planExplanations.pro,
      displayPrice: isAnnual ? "$90" : "$3.75",
      originalPrice: isAnnual ? "$180" : "$15",
      subPriceNote: isAnnual ? "equivalent to $7.50/mo" : "then $15/mo after month 1",
      discountPercent: isAnnual ? 50 : 75,
      savingsAmount: isAnnual ? "$90.00 / yr" : "$11.25 (1st month)",
      unit: isAnnual ? "/ year" : "/ month",
      badge: isAnnual ? "⚡ -50% Annual" : "🔥 Special Deal: -75%",
      popular: true,
      features: [
        "500,000 clicks / month included",
        "Zero-Downtime Guarantee (+$1 / 10k extra)",
        "Up to 3 custom branded domains",
        "1,000 active short links",
        "Advanced Routing (Country + OS/Device)",
        "Password PIN gates & link cloaking",
        "5 Webhooks & 5 Retargeting Pixels",
        "Analytics retention: 365 days",
        "Developer API keys (1,000 req/min)",
        "Priority email support",
      ],
      limitations: [],
    },
    {
      id: "BUSINESS" as const,
      name: PRICING_PLANS.BUSINESS.name,
      tagline: PRICING_COPY.planExplanations.business,
      displayPrice: isAnnual ? "$350" : "$19.60",
      originalPrice: isAnnual ? "$588" : "$49",
      subPriceNote: isAnnual ? "equivalent to $29.16/mo" : "then $49/mo after month 1",
      discountPercent: isAnnual ? 40 : 60,
      savingsAmount: isAnnual ? "$238.00 / yr" : "$29.40 (1st month)",
      unit: isAnnual ? "/ year" : "/ month",
      badge: isAnnual ? "⚡ -40% Annual" : "🔥 Special Deal: -60%",
      popular: false,
      features: [
        "2,000,000 clicks / month included",
        "Zero-Downtime Guarantee (+$0.80 / 10k extra)",
        "Up to 15 custom branded domains",
        "Unlimited active short links",
        "Custom multi-condition rule builder",
        "Advanced protection, cloaking & expiration",
        "Vector QR Code Studio (SVG / PDF export)",
        "Unlimited Webhooks & Retargeting Pixels",
        "Unlimited Analytics retention",
        "5 team seats included",
        "Developer API keys (5,000 req/min)",
        "24/7 dedicated support",
      ],
      limitations: [],
    },
    {
      id: "ENTERPRISE" as const,
      name: PRICING_PLANS.ENTERPRISE.name,
      tagline: PRICING_COPY.planExplanations.enterprise,
      displayPrice: isAnnual ? "$1,670" : "$99.50",
      originalPrice: isAnnual ? "$2,388" : "$199",
      subPriceNote: isAnnual ? "equivalent to $139.16/mo" : "then $199/mo after month 1",
      discountPercent: isAnnual ? 30 : 50,
      savingsAmount: isAnnual ? "$718.00 / yr" : "$99.50 (1st month)",
      unit: isAnnual ? "/ year" : "/ month",
      badge: isAnnual ? "⚡ -30% Annual" : "🔥 Special Deal: -50%",
      popular: false,
      features: [
        "10,000,000 clicks / month included",
        "Zero-Downtime Guarantee (+$0.50 / 10k extra)",
        "Up to 50 custom branded domains",
        "Unlimited active short links",
        "Hyper-targeted Routing (ISP / ASN / City)",
        "15 team seats included",
        "Unlimited Webhooks & Retargeting Pixels",
        "Unlimited Analytics retention & raw CSV export",
        "Developer API keys (15,000 req/min)",
        "99.99% Edge SLA & direct VIP support",
      ],
      limitations: [],
    },
  ];

  const comparisonTable = [
    {
      feature: "Monthly Click Volume",
      free: "10,000",
      pro: "500,000",
      business: "2,000,000",
      enterprise: "10,000,000",
    },
    {
      feature: "Zero-Downtime Guarantee (Overage)",
      free: "No (redirect continues raw)",
      pro: "$1.00 / 10k clicks",
      business: "$0.80 / 10k clicks",
      enterprise: "$0.50 / 10k clicks",
    },
    {
      feature: "Custom Branded Domains",
      free: "0 domains",
      pro: "3 domains",
      business: "15 domains",
      enterprise: "50 domains",
    },
    {
      feature: "Active Short Links",
      free: "50 links",
      pro: "1,000 links",
      business: "Unlimited",
      enterprise: "Unlimited",
    },
    {
      feature: "Smart Routing & Targeting",
      free: "Basic (1 country rule)",
      pro: "Advanced (Country + OS)",
      business: "Custom (Multi-condition)",
      enterprise: "Custom (Network + ISP + City)",
    },
    {
      feature: "Protection, PIN Password & Cloaking",
      free: false,
      pro: true,
      business: true,
      enterprise: true,
    },
    {
      feature: "Webhooks & Retargeting Pixels",
      free: false,
      pro: "5 webhooks / 5 pixels",
      business: "Unlimited",
      enterprise: "Unlimited",
    },
    {
      feature: "Analytics Retention",
      free: "30 days",
      pro: "365 days",
      business: "Unlimited",
      enterprise: "Unlimited + Raw export",
    },
    {
      feature: "Developer API Rate Limit",
      free: "60 req / min",
      pro: "1,000 req / min",
      business: "5,000 req / min",
      enterprise: "15,000 req / min",
    },
    {
      feature: "Team Seats Included",
      free: "1 seat",
      pro: "2 seats",
      business: "5 seats",
      enterprise: "15 seats",
    },
    {
      feature: "Billing & Official PDF Invoices",
      free: "Standard receipts",
      pro: "Automated PDF invoices",
      business: "Automated PDF invoices",
      enterprise: "Automated PDF invoices",
    },
  ];

  return (
    <div className="flex flex-col gap-12 animate-in fade-in pb-16">
      {/* Header & Subtitle */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
        <span className="px-3.5 py-1 rounded-full bg-brand-subtle text-brand border border-brand-subtle text-xs font-bold uppercase tracking-wider">
          Promotional Pricing Plans
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Simple pricing, <span className="text-brand">Zero-Downtime Guarantee</span>
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
          Deployed across Cloudflare&apos;s global Edge network. Your links always stay fast and reliable, and certified PDF invoices are generated instantly in 1 click.
        </p>

        {/* Annual / Monthly Toggle with Promo Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4 p-1.5 rounded-full bg-neutral-200/80 dark:bg-[#141416] border border-neutral-300 dark:border-[#27272a] shadow-xs">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              !isAnnual
                ? "bg-brand text-white shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            <span>Monthly Billing</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono tracking-tight ${
                !isAnnual
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              }`}
            >
              -75% 1st month
            </span>
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              isAnnual
                ? "bg-brand text-white shadow-xs"
                : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            <span>Annual Billing</span>
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black font-mono tracking-tight ${
                isAnnual
                  ? "bg-white/20 text-white"
                  : "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
              }`}
            >
              Up to -50%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid (4 Columns) */}
      <div
        ref={cardsContainerRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch"
      >
        {plansList.map((p) => {
          const isCurrent = currentPlan === p.id;

          return (
            <div
              key={p.id}
              onMouseEnter={(e) => handleCardMouseEnter(e, p.popular)}
              onMouseLeave={(e) => handleCardMouseLeave(e, p.popular)}
              className={`relative flex flex-col justify-between p-6 rounded-[14px] bg-white dark:bg-[#141416] border transition-all duration-200 will-change-transform ${
                p.popular
                  ? "border-brand ring-2 ring-brand/50 shadow-md shadow-brand/10"
                  : "border-neutral-200 dark:border-[#27272a] hover:border-neutral-400 dark:hover:border-neutral-500 shadow-xs"
              }`}
            >
              {p.badge && (
                <div
                  className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10.5px] font-black uppercase tracking-wider shadow-md whitespace-nowrap flex items-center gap-1 z-10 ${
                    p.popular
                      ? "bg-brand text-white shadow-brand/40 ring-2 ring-brand/30"
                      : "bg-emerald-600 dark:bg-emerald-500 text-white shadow-emerald-500/20"
                  }`}
                >
                  <span>{p.badge}</span>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-wide">{p.name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 min-h-[38px] leading-relaxed">
                  {p.tagline}
                </p>

                {/* Price display with High-Visibility Percentage Discount Badge */}
                <div className="my-5 flex flex-col gap-2">
                  <div className="flex items-baseline flex-wrap gap-2">
                    {p.originalPrice && (
                      <span className="text-sm sm:text-base font-semibold line-through text-neutral-400 dark:text-neutral-500 font-mono">
                        {p.originalPrice}
                      </span>
                    )}
                    <span className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
                      {p.displayPrice}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      {p.unit}
                    </span>
                    {p.discountPercent > 0 && (
                      <span className="ml-auto px-2.5 py-1 rounded-md text-xs font-black font-mono bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/40 shadow-xs flex items-center gap-1">
                        <Zap className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                        -{p.discountPercent}%
                      </span>
                    )}
                  </div>

                  {p.savingsAmount && (
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 px-2 py-0.5 rounded-md w-fit">
                      <span>💰 Save {p.savingsAmount}</span>
                    </div>
                  )}

                  {p.subPriceNote && (
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400">
                      {p.subPriceNote}
                    </span>
                  )}
                </div>

                {/* Features list */}
                <div className="flex flex-col gap-2.5 text-xs text-neutral-700 dark:text-neutral-300 pt-4 border-t border-neutral-200 dark:border-[#222225]">
                  {p.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}

                  {p.limitations.map((lim, i) => (
                    <div key={i} className="flex items-start gap-2 text-neutral-400 dark:text-neutral-500">
                      <X className="w-4 h-4 text-neutral-400 dark:text-neutral-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{lim}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Action Button */}
              <button
                onClick={() => handleSelectPlan(p.id)}
                disabled={isCurrent || loadingPlan !== null}
                className={`mt-7 w-full py-3 rounded-[10px] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer disabled:cursor-default ${
                  isCurrent
                    ? "bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-[#27272a]"
                    : p.popular
                    ? "bg-brand hover:bg-brand-hover text-white shadow-sm"
                    : "bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/20"
                }`}
              >
                {loadingPlan === p.id ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Activating...</span>
                  </span>
                ) : isCurrent ? (
                  <span>Current Plan</span>
                ) : p.id === "FREE" ? (
                  <span>Get Started Free</span>
                ) : (
                  <>
                    <span>Choose {p.name}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Reassurance Guarantee Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-4">
        {PRICING_COPY.guarantees.map((g, idx) => {
          const icons = [ShieldCheck, CreditCard, RefreshCw];
          const Icon = icons[idx] || ShieldCheck;
          return (
            <div
              key={idx}
              className="p-5 rounded-[12px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] shadow-xs flex flex-col gap-2.5"
            >
              <div className="w-9 h-9 rounded-[8px] bg-brand-subtle text-brand flex items-center justify-center font-bold">
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-bold text-neutral-900 dark:text-white">{g.title}</h4>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                {g.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Feature Comparison Matrix */}
      <div className="mt-8 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-wide">
            Feature Comparison Matrix
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            All detailed technical specifications, quotas, and capabilities side by side.
          </p>
        </div>

        <div className="rounded-[12px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-[#27272a] bg-neutral-50 dark:bg-[#1a1a1e]/80 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="p-4 sm:p-5">Feature</th>
                  <th className="p-4 sm:p-5 text-neutral-700 dark:text-neutral-300">STARTER ($0)</th>
                  <th className="p-4 sm:p-5 text-brand">PRO ($15/mo)</th>
                  <th className="p-4 sm:p-5 text-neutral-900 dark:text-white">BUSINESS ($49/mo)</th>
                  <th className="p-4 sm:p-5 text-neutral-900 dark:text-white">ENTERPRISE ($199/mo)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-[#222225] text-neutral-700 dark:text-neutral-200">
                {comparisonTable.map((row, idx) => (
                  <tr key={idx} className="hover:bg-neutral-50/50 dark:hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 sm:p-5 font-semibold text-neutral-900 dark:text-white">{row.feature}</td>
                    <td className="p-4 sm:p-5">
                      {typeof row.free === "boolean" ? (
                        row.free ? (
                          <Check className="w-4 h-4 text-emerald-500" />
                        ) : (
                          <span className="text-neutral-400">Not included</span>
                        )
                      ) : (
                        <span className="font-mono text-neutral-600 dark:text-neutral-300">{row.free}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Included
                          </span>
                        ) : (
                          <span className="text-neutral-400">Not included</span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-brand">{row.pro}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.business === "boolean" ? (
                        row.business ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Included
                          </span>
                        ) : (
                          <span className="text-neutral-400">Not included</span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">{row.business}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Included
                          </span>
                        ) : (
                          <span className="text-neutral-400">Not included</span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">{row.enterprise}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
