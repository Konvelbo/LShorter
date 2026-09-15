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
  KeyRound
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserProfile, PlanType } from "@/types";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast-provider";
import { syncUserToCloudflare } from "@/app/actions/sync-user";
import { PricingPageSkeleton } from "@/components/ui/skeleton";
import confetti from "canvas-confetti";

export default function PricingPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");
  const currentPlan = convexUser?.plan || (session?.user as any)?.plan || "FREEMIUM";
  const [isAnnual, setIsAnnual] = useState(false);
  const cardsContainerRef = useRef<HTMLDivElement>(null);
  const updatePlanMutation = useMutation(api.users.updatePlan);

  useEffect(() => {
    if (cardsContainerRef.current) {
      gsap.fromTo(
        cardsContainerRef.current.children,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.12,
          ease: "power2.out",
        }
      );
    }
  }, []);

  if (status === "loading") {
    return <PricingPageSkeleton />;
  }

  const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>, isPopular: boolean) => {
    gsap.to(e.currentTarget, {
      scale: 1.035,
      y: -8,
      duration: 0.35,
      ease: "power2.out",
      zIndex: 10,
      boxShadow: isPopular
        ? "0 20px 35px -10px rgba(255, 102, 0, 0.35), 0 0 25px 2px rgba(255, 102, 0, 0.2)"
        : "0 20px 30px -10px rgba(0, 0, 0, 0.4), 0 0 15px 1px rgba(255, 255, 255, 0.05)",
    });
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>, isPopular: boolean) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      y: 0,
      duration: 0.35,
      ease: "power2.out",
      zIndex: 1,
      boxShadow: isPopular
        ? "0 10px 25px -5px rgba(255, 102, 0, 0.15)"
        : "0 1px 3px 0 rgba(0, 0, 0, 0.05)",
    });
  };

  const handleButtonMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1.04,
      duration: 0.2,
      ease: "power1.out",
    });
  };

  const handleButtonMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      duration: 0.2,
      ease: "power1.out",
    });
  };

  const handleSelectPlan = async (plan: PlanType) => {
    if (currentPlan === plan) {
      showToast.info(`You are already on the ${plan} plan.`);
      return;
    }

    try {
      if (userId && (plan === "FREEMIUM" || plan === "PRO" || plan === "BUSINESS")) {
        // 1. Update in Convex
        await updatePlanMutation({
          userId,
          plan: plan as "FREEMIUM" | "PRO" | "BUSINESS",
        });

        // 2. Synchronize directly in Cloudflare D1
        await syncUserToCloudflare({
          id: userId,
          email: session?.user?.email || `${userId}@lshorter.local`,
          name: session?.user?.name || "User",
          plan: plan as "FREEMIUM" | "PRO" | "BUSINESS",
        });
      }
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      showToast.success(`Plan updated successfully: ${plan}!`);
    } catch (err: any) {
      showToast.error("Error updating plan.");
    }
  };

  const plans = [
    {
      id: "FREEMIUM" as PlanType,
      name: "Freemium Plan",
      tagline: "To get started and test the power of Edge routing without spending a penny.",
      priceMonthly: 0,
      priceAnnual: 0,
      badge: "Free forever",
      popular: false,
      features: [
        "60,000 clicks / month included",
        "Up to 3 custom domains",
        "1,000 short links",
        "Basic routing (1 country rule)",
        "QR Code Studio (5 free items, basic styles)",
        "30-day Analytics retention",
        "Developer API Keys (1,000 req/min)",
        "Community Support",
      ],
      limitations: [
        "Multi-Condition & Device routing not included",
        "URL Cloaking & Password Protection not included",
        "Webhooks & Retargeting Pixels not included",
      ],
    },
    {
      id: "PRO" as PlanType,
      name: "Pro Plan",
      tagline: "For creators, affiliate marketers, and e-merchants looking to maximize their ROI.",
      priceMonthly: 12,
      priceAnnual: 115,
      monthlyEquivalent: "€9.58",
      badge: "Most popular",
      popular: true,
      features: [
        "UNLIMITED click volume (-1)",
        "Up to 15 custom domains",
        "Unlimited short links (-1)",
        "Full Multi-Condition routing (All countries + devices + carriers)",
        "URL Cloaking & Password Protection",
        "Full QR Code Studio (All styles, gradients, logos, frames)",
        "Webhooks & Pixels included (5 webhooks / 5 pixels)",
        "UNLIMITED Analytics retention",
        "Developer API Keys (UNLIMITED throughput)",
        "Priority support via email & chat",
      ],
      limitations: [],
    },
    {
      id: "BUSINESS" as PlanType,
      name: "Business Plan",
      tagline: "For agencies and high-volume enterprises demanding unrestricted scale.",
      priceMonthly: 39,
      priceAnnual: 374,
      monthlyEquivalent: "€31.16",
      badge: "Unlimited Power",
      popular: false,
      features: [
        "UNLIMITED click volume (-1)",
        "UNLIMITED custom domains (-1)",
        "Unlimited short links (-1)",
        "Full Multi-Condition routing + Advanced priority weighting",
        "URL Cloaking & Password Protection included",
        "Unlocked QR Code Studio + Unlimited SVG vector export",
        "UNLIMITED Webhooks & Retargeting Pixels",
        "UNLIMITED Analytics retention / Raw data & Export",
        "Developer API Keys (UNLIMITED throughput)",
        "Dedicated IP, 99.99% SLA & 24/7 Support",
      ],
      limitations: [],
    },
  ];

  const comparisonTable = [
    {
      feature: "Monthly Click Quota",
      free: "60,000",
      pro: "Unlimited (-1)",
      business: "Unlimited (-1)",
    },
    {
      feature: "Custom Domains",
      free: "Up to 3 domains",
      pro: "Up to 15 domains",
      business: "Unlimited (-1)",
    },
    {
      feature: "Number of Links",
      free: "1,000 links",
      pro: "Unlimited (-1)",
      business: "Unlimited (-1)",
    },
    {
      feature: "Multi-Condition Routing",
      free: "Basic (1 country rule max)",
      pro: "Full (All countries + devices + carriers)",
      business: "Full + Advanced priority",
    },
    {
      feature: "Cloaking & Password Protection",
      free: false,
      pro: true,
      business: true,
    },
    {
      feature: "QR Code Studio",
      free: "5 free items (basic styles)",
      pro: "All styles, gradients, logos, frames",
      business: "Unlocked + Unlimited SVG export",
    },
    {
      feature: "Webhooks & Pixels",
      free: false,
      pro: "✅ Included (5 webhooks / 5 pixels)",
      business: "✅ Unlimited",
    },
    {
      feature: "Analytics Retention",
      free: "30 days",
      pro: "Unlimited",
      business: "Unlimited / Raw data & Export",
    },
    {
      feature: "API Keys & Rate Limit",
      free: "1,000 req/min",
      pro: "Unlimited",
      business: "Unlimited",
    },
  ];

  return (
    <div className="flex flex-col gap-10 animate-in fade-in pb-16">
      {/* Header & Subtitle */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
        <span className="px-3 py-1 rounded-full bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30 text-xs font-bold uppercase tracking-wider">
          Competitive Pricing Grid
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Plans built to <span className="text-[#ff6600]">dominate the market</span>
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
          Thanks to Cloudflare Edge technology, enjoy advanced targeting (Geo &amp; Device) right from the free tier, where competitors charge $48/month.
        </p>

        {/* Annual / Monthly Toggle */}
        <div className="flex items-center gap-3 mt-4 p-1.5 rounded-full bg-neutral-200/80 dark:bg-[#141416] border border-neutral-300 dark:border-[#27272a]">
          <button
            onClick={() => setIsAnnual(false)}
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors cursor-pointer will-change-transform ${
              !isAnnual ? "bg-[#ff6600] text-white shadow-md shadow-[#ff6600]/25" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            Monthly Billing
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            onMouseEnter={handleButtonMouseEnter}
            onMouseLeave={handleButtonMouseLeave}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors flex items-center gap-1.5 cursor-pointer will-change-transform ${
              isAnnual ? "bg-[#ff6600] text-white shadow-md shadow-[#ff6600]/25" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            <span>Annual Billing</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold uppercase">
              2 months free
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div
        ref={cardsContainerRef}
        className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch"
      >
        {plans.map((p) => {
          const isCurrent = currentPlan === p.id;
          const displayPrice = isAnnual ? p.priceAnnual : p.priceMonthly;

          return (
            <div
              key={p.id}
              onMouseEnter={(e) => handleCardMouseEnter(e, p.popular)}
              onMouseLeave={(e) => handleCardMouseLeave(e, p.popular)}
              className={`relative flex flex-col justify-between p-6 sm:p-7 rounded-[10px] bg-white dark:bg-[#141416] border transition-colors duration-200 cursor-pointer will-change-transform ${
                p.popular
                  ? "border-[#ff6600] shadow-xl shadow-[#ff6600]/10 dark:shadow-2xl dark:shadow-[#ff6600]/15 ring-1 ring-[#ff6600]"
                  : "border-neutral-200 dark:border-[#27272a] hover:border-neutral-400 dark:hover:border-neutral-500 shadow-sm"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#ff6600] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
                  {p.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-wide">{p.name}</h3>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                      Current Plan
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 min-h-[36px]">{p.tagline}</p>

                {/* Price display */}
                <div className="my-5 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-neutral-900 dark:text-white">{displayPrice}€</span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-400">
                    {p.priceMonthly === 0 ? "forever" : isAnnual ? "/ yr" : "/ mo"}
                  </span>
                  {isAnnual && p.monthlyEquivalent && (
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400 ml-1">
                      (that&apos;s {p.monthlyEquivalent}/mo)
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

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(p.id)}
                disabled={isCurrent}
                onMouseEnter={!isCurrent ? handleButtonMouseEnter : undefined}
                onMouseLeave={!isCurrent ? handleButtonMouseLeave : undefined}
                className={`mt-7 w-full py-3 rounded-[10px] font-bold text-xs flex items-center justify-center gap-2 transition-colors will-change-transform ${
                  isCurrent
                    ? "bg-neutral-100 dark:bg-white/5 text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-[#27272a] cursor-default"
                    : p.popular
                    ? "bg-[#ff6600] hover:bg-[#ff771a] text-white shadow-lg shadow-[#ff6600]/30 cursor-pointer"
                    : "bg-neutral-100 hover:bg-neutral-200 dark:bg-white/10 dark:hover:bg-white/20 text-neutral-900 dark:text-white border border-neutral-300 dark:border-white/20 cursor-pointer"
                }`}
              >
                {isCurrent ? (
                  <span>Active Plan</span>
                ) : (
                  <>
                    <span>Choose this plan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Feature Comparison Matrix */}
      <div className="mt-8 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-wide">Detailed Feature Comparison</h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            All technical specifications and quotas compared side-by-side.
          </p>
        </div>

        <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] overflow-hidden shadow-sm dark:shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-[#27272a] bg-neutral-50 dark:bg-[#1a1a1e]/80 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="p-4 sm:p-5">Feature</th>
                  <th className="p-4 sm:p-5 text-neutral-700 dark:text-neutral-300">FREEMIUM Plan (€0)</th>
                  <th className="p-4 sm:p-5 text-[#ff6600]">PRO Plan (€12/mo or €115/yr)</th>
                  <th className="p-4 sm:p-5 text-neutral-900 dark:text-white">BUSINESS Plan (€39/mo or €374/yr)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-[#222225] text-neutral-700 dark:text-neutral-200">
                {comparisonTable.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 sm:p-5 font-semibold text-white">{row.feature}</td>
                    <td className="p-4 sm:p-5">
                      {typeof row.free === "boolean" ? (
                        row.free ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <span className="text-neutral-500 font-medium">❌ Not included</span>
                        )
                      ) : (
                        <span className="font-mono text-neutral-300">{row.free}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <span className="text-emerald-400 font-semibold">✅ Included</span>
                        ) : (
                          <span className="text-neutral-500">❌ Not included</span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-[#ff6600]">{row.pro}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.business === "boolean" ? (
                        row.business ? (
                          <span className="text-emerald-400 font-semibold">✅ Included</span>
                        ) : (
                          <span className="text-neutral-500">❌ Not included</span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-white">{row.business}</span>
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

