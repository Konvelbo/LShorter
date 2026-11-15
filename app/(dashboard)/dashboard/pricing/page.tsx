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
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PlanType } from "@/types";
import { showToast } from "@/components/ui/toast-provider";
import { syncUserToCloudflare } from "@/app/actions/sync-user";
import { PricingPageSkeleton } from "@/components/ui/skeleton";
import { PRICING_PLANS, PRICING_COPY } from "@/src/config/pricing";
import confetti from "canvas-confetti";


export default function PricingPage() {
  const router = useRouter();
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
        { opacity: 0, y: 15, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.22,
          stagger: 0.03,
          ease: "power3.out",
        }
      );
    }
  }, [isAnnual]);

  const isVerifyingRef = useRef(false);

  // Detect return from checkout redirect
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isSuccess = params.get("checkout_success") === "true";

      if (isSuccess && !isVerifyingRef.current) {
        isVerifyingRef.current = true;
        window.history.replaceState({}, "", window.location.pathname);
        router.push("/dashboard/settings?tab=billing&checkout_success=true");
        return;
      }
    }
  }, [router]);

  if (status === "loading") {
    return <PricingPageSkeleton />;
  }

  const handleCardMouseEnter = (e: React.MouseEvent<HTMLDivElement>, isPopular: boolean) => {
    gsap.to(e.currentTarget, {
      scale: 1.025,
      y: -6,
      duration: 0.18,
      ease: "power2.out",
      zIndex: 10,
    });
  };

  const handleCardMouseLeave = (e: React.MouseEvent<HTMLDivElement>, isPopular: boolean) => {
    gsap.to(e.currentTarget, {
      scale: 1,
      y: 0,
      duration: 0.18,
      ease: "power2.out",
      zIndex: 1,
    });
  };

  const handleSelectPlan = async (planKey: 'FREE' | 'PRO' | 'BUSINESS' | 'ENTERPRISE') => {
    const userCycle = String((convexUser as any)?.cycle || (session?.user as any)?.cycle || "MONTHLY").toUpperCase();
    const isSameCycle = (isAnnual && userCycle === "YEARLY") || (!isAnnual && userCycle === "MONTHLY");
    const isCurrentExact = currentPlan === planKey && (planKey === "FREE" || isSameCycle);

    if (isCurrentExact) {
      showToast.info(`You are already subscribed to the ${planKey} (${isAnnual ? "Annual" : "Monthly"}) plan.`);
      return;
    }

    // If user is not logged in, redirect directly to checkout where guest checkout is supported
    if (!session?.user) {
      window.location.href = `/checkout?plan=${planKey}&cycle=${isAnnual ? "YEARLY" : "MONTHLY"}`;
      return;
    }

    setLoadingPlan(planKey);
    try {
      // For paid plans, initiate checkout session
      if (planKey !== "FREE") {
        try {
          const res = await fetch("/api/billing/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              planId: planKey,
              cycle: isAnnual ? "YEARLY" : "MONTHLY",
              userId,
              customerEmail: session?.user?.email || undefined,
              successUrl: `${window.location.origin}/dashboard/settings?tab=billing&checkout_success=true&plan=${planKey}`,
              cancelUrl: `${window.location.origin}/dashboard/pricing`,
            }),
          });

          const data = await res.json();
          if (data.success && data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
            return;
          }

          if (data.error) {
            console.warn("[Pricing] Direct checkout API notice, falling back to /checkout:", data.error);
            window.location.href = `/checkout?plan=${planKey}&cycle=${isAnnual ? "YEARLY" : "MONTHLY"}`;
            return;
          }
        } catch (apiErr) {
          console.warn("[Pricing] Direct checkout error, redirecting to /checkout:", apiErr);
          window.location.href = `/checkout?plan=${planKey}&cycle=${isAnnual ? "YEARLY" : "MONTHLY"}`;
          return;
        }

        setLoadingPlan(null);
        return;
      }

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
      tagline: "To explore our Edge infrastructure, no credit card required.",
      displayPrice: "$0",
      originalPrice: null,
      subPriceNote: null,
      savingsText: null,
      unit: "forever",
      badge: "Free",
      popular: false,
      features: [
        "10,000 clicks / month",
        "3 domains and 50 active links",
        "Global Workspace Target (clicks and revenue)",
        "QR Code Studio (basic styles)",
        "30-day analytics · API 60 req/min",
        "Community support",
      ],
      notIncludedNote:
        "Not included: Smart Routing, PIN protection, individual link alerts, webhooks, and pixels.",
    },
    {
      id: "PRO" as const,
      name: PRICING_PLANS.PRO.name,
      tagline: "Grow your brand and maximize your conversion rates.",
      displayPrice: isAnnual ? "$90" : "$3.75",
      originalPrice: isAnnual ? "$180" : "$15",
      savingsText: isAnnual ? "Save $90 / yr" : "Save $22.50 over 2 months",
      subPriceNote: isAnnual ? "or $7.50 / month" : "then $15 / month",
      unit: isAnnual ? "/ yr" : "/ 2 mo",
      badge: isAnnual ? "-50% annual" : "-75% promo",
      popular: true,
      features: [
        "150,000 clicks / month (+$3 / 50k)",
        "6 domains and 1,000 active links",
        "Individual link alerts (clicks, revenue, expiration)",
        "Dynamic Smart Routing (country + OS/device)",
        "PIN codes and destination masking",
        "5 webhooks and 5 retargeting pixels",
        "365-day analytics · API 200 req/min",
        "Priority email support",
      ],
      notIncludedNote: null,
    },
    {
      id: "BUSINESS" as const,
      name: PRICING_PLANS.BUSINESS.name,
      tagline: "For multi-channel campaigns and growing teams.",
      displayPrice: isAnnual ? "$350" : "$19.60",
      originalPrice: isAnnual ? "$588" : "$49",
      savingsText: isAnnual ? "Save $238 / yr" : "Save $58.80 over 2 months",
      subPriceNote: isAnnual ? "or $29.16 / month" : "then $49 / month",
      unit: isAnnual ? "/ yr" : "/ 2 mo",
      badge: isAnnual ? "-40% annual" : "-60% promo",
      popular: false,
      features: [
        "500,000 clicks / month (+$8 / 125k)",
        "15 domains and unlimited active links",
        "Unlimited individual link alerts",
        "Multi-condition rule engine",
        "Advanced protection and destination masking",
        "Vector QR Code Studio (SVG / PDF)",
        "Unlimited webhooks and pixels",
        "Unlimited analytics · API 600 req/min",
        "5 team seats · 24/7 support",
      ],
      notIncludedNote: null,
    },
    {
      id: "ENTERPRISE" as const,
      name: PRICING_PLANS.ENTERPRISE.name,
      tagline: "Unlimited clicks and dedicated high-throughput Edge SLA.",
      displayPrice: isAnnual ? "$1,670" : "$99.50",
      originalPrice: isAnnual ? "$2,388" : "$199",
      savingsText: isAnnual ? "Save $718 / yr" : "Save $199 over 2 months",
      subPriceNote: isAnnual ? "or $139.16 / month" : "then $199 / month",
      unit: isAnnual ? "/ yr" : "/ 2 mo",
      badge: isAnnual ? "-30% annual" : "-50% promo",
      popular: false,
      features: [
        "Unlimited clicks, domains, and links",
        "Global alerts with VIP routing",
        "Hyper-targeted routing (ISP / ASN / city)",
        "Unlimited webhooks and pixels",
        "Unlimited analytics and raw CSV export",
        "API 1,400 req/min",
        "15 team seats",
        "99.99% Edge SLA and direct VIP support",
      ],
      notIncludedNote: null,
    },
  ];

  const comparisonTable = [
    {
      feature: "Monthly Click Volume",
      free: "10,000",
      pro: "150,000",
      business: "500,000",
      enterprise: "Unlimited",
    },
    {
      feature: "Zero-Downtime Guarantee (Overage)",
      free: "Hard limit at 10,000",
      pro: "$3 / 50,000 extra clicks",
      business: "$8 / 125,000 extra clicks",
      enterprise: "Unlimited ($0 extra)",
    },
    {
      feature: "Custom Branded Domains",
      free: "3 domains",
      pro: "6 domains",
      business: "15 domains",
      enterprise: "Unlimited",
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
      free: "Not included (Paid only)",
      pro: "Advanced (Country + OS)",
      business: "Custom (Multi-condition)",
      enterprise: "Custom (Network + ISP + City)",
    },
    {
      feature: "Protection, PIN Password & Destination Masking",
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
      feature: "Target & Notification Alerts",
      free: "Global Workspace Target only",
      pro: "Individual Link Alerts (Clicks, Revenue & Expiration)",
      business: "Unlimited Link Alerts & Instant Expiration",
      enterprise: "Unlimited Link & Workspace Alerts (VIP)",
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
      pro: "200 req / min",
      business: "600 req / min",
      enterprise: "1,400 req / min",
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
    <div className="flex flex-col gap-10 animate-in fade-in pb-16">
      {/* Header & Subtitle */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
        <span className="px-3 py-1 rounded-[6px] bg-[#EFF6FF] dark:bg-brand/15 text-[#1D4ED8] dark:text-[#60A5FA] text-[10px] font-bold uppercase tracking-widest">
          Promotional Offers
        </span>
        <h1 className="text-3xl sm:text-[42px] font-extrabold text-zinc-900 dark:text-white tracking-tight leading-[1.15]">
          Simple pricing,
          <br />
          <span className="text-[#1D4ED8] dark:text-[#3B82F6]">
            zero downtime guaranteed
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-neutral-400 leading-relaxed max-w-xl mt-1">
          Deployed on Cloudflare&apos;s global Edge network, your links stay fast and reliable. Certified PDF invoices are generated instantly in 1 click.
        </p>

        {/* Annual / Monthly Toggle with Promo Labels */}
        <div className="inline-flex items-center justify-center p-1 rounded-[10px] bg-zinc-100 dark:bg-[#141416] border border-zinc-200/80 dark:border-[#27272a] max-w-full mt-3">
          <button
            type="button"
            onClick={() => setIsAnnual(false)}
            className={`px-3.5 sm:px-4 py-2 rounded-[8px] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none whitespace-nowrap ${
              !isAnnual
                ? "bg-[#1D4ED8] text-white shadow-xs"
                : "text-zinc-700 hover:text-zinc-900 dark:text-neutral-300 dark:hover:text-white"
            }`}
          >
            <span>Monthly</span>
            <span
              className={`text-[11px] font-semibold ${
                !isAnnual
                  ? "text-white/90"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              -75% first 2 months
            </span>
          </button>
          <button
            type="button"
            onClick={() => setIsAnnual(true)}
            className={`px-3.5 sm:px-4 py-2 rounded-[8px] text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none whitespace-nowrap ${
              isAnnual
                ? "bg-[#1D4ED8] text-white shadow-xs"
                : "text-zinc-700 hover:text-zinc-900 dark:text-neutral-300 dark:hover:text-white"
            }`}
          >
            <span>Annual</span>
            <span
              className={`text-[11px] font-semibold ${
                isAnnual
                  ? "text-white/90"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              up to -50%
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid (4 Columns) */}
      <div
        ref={cardsContainerRef}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch pt-2"
      >
        {plansList.map((p) => {
          const userCycle = String((convexUser as any)?.cycle || (session?.user as any)?.cycle || "MONTHLY").toUpperCase();
          const isSameCycle = (isAnnual && userCycle === "YEARLY") || (!isAnnual && userCycle === "MONTHLY");
          const isCurrent = currentPlan === p.id && (p.id === "FREE" || isSameCycle);

          return (
            <div
              key={p.id}
              onMouseEnter={(e) => handleCardMouseEnter(e, p.popular)}
              onMouseLeave={(e) => handleCardMouseLeave(e, p.popular)}
              className={`relative flex flex-col justify-between p-5 sm:p-6 rounded-[10px] border transition-colors duration-200 will-change-transform ${
                p.popular
                  ? "bg-[#F8FAFF] dark:bg-[#161822] border-[1.5px] border-[#1D4ED8] dark:border-[#3B82F6] shadow-md shadow-blue-500/5"
                  : "bg-white dark:bg-[#141416] border-zinc-200/90 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-neutral-600 shadow-2xs"
              }`}
            >
              {p.badge && (
                <div
                  className={`absolute -top-3 left-5 px-2.5 py-0.5 rounded-[6px] text-[10.5px] font-bold tracking-wide text-white whitespace-nowrap z-10 ${
                    p.popular ? "bg-[#1D4ED8]" : "bg-[#047857]"
                  }`}
                >
                  {p.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mt-1">
                  <h3
                    className={`text-base font-bold tracking-tight ${
                      p.popular
                        ? "text-[#1D4ED8] dark:text-[#60A5FA]"
                        : "text-zinc-900 dark:text-white"
                    }`}
                  >
                    {p.name}
                  </h3>
                </div>
                <p className="text-[11.5px] text-zinc-500 dark:text-neutral-400 mt-1.5 min-h-[34px] leading-snug">
                  {p.tagline}
                </p>

                {/* Price display */}
                <div className="mt-4 pb-4 border-b border-zinc-200/80 dark:border-[#222225]">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-3xl sm:text-[34px] font-extrabold text-zinc-900 dark:text-white tracking-tight leading-none">
                        {p.displayPrice}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-neutral-400 font-medium">
                        {p.unit}
                      </span>
                    </div>
                    {p.originalPrice && (
                      <span className="text-xs sm:text-sm font-medium line-through text-zinc-400 dark:text-neutral-500">
                        {p.originalPrice}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 min-h-[32px] flex flex-col justify-center">
                    {p.id === "FREE" ? (
                      <span className="text-[11.5px] font-medium text-zinc-500 dark:text-neutral-400">
                        {isCurrent ? "Current plan" : "Free forever"}
                      </span>
                    ) : (
                      <>
                        {p.savingsText && (
                          <span className="text-[11.5px] font-semibold text-emerald-600 dark:text-emerald-400 leading-tight">
                            {p.savingsText}
                          </span>
                        )}
                        {p.subPriceNote && (
                          <span className="text-[11px] text-zinc-400 dark:text-neutral-500 leading-tight mt-0.5">
                            {p.subPriceNote}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Features list */}
                <div className="flex flex-col gap-2.5 text-[11.5px] text-zinc-700 dark:text-neutral-300 pt-4">
                  {p.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}

                  {p.notIncludedNote && (
                    <p className="text-[10.5px] text-zinc-400 dark:text-neutral-500 leading-relaxed pt-2 mt-1 border-t border-zinc-100 dark:border-[#222225]">
                      {p.notIncludedNote}
                    </p>
                  )}
                </div>
              </div>

              {/* Direct Action Button */}
              <button
                type="button"
                onClick={() => handleSelectPlan(p.id)}
                disabled={isCurrent || loadingPlan !== null || (p.id === "FREE" && currentPlan !== "FREE")}
                className={`mt-6 w-full py-2.5 rounded-[8px] font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:cursor-default ${
                  isCurrent || (p.id === "FREE" && currentPlan !== "FREE")
                    ? "bg-zinc-100 dark:bg-white/5 text-zinc-500 dark:text-neutral-400"
                    : p.popular
                      ? "bg-[#1D4ED8] hover:bg-[#1E40AF] text-white shadow-xs"
                      : p.id === "FREE"
                        ? "bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/15 text-zinc-800 dark:text-white"
                        : "bg-[#0F172A] hover:bg-[#1E293B] dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-zinc-900 shadow-xs"
                }`}
              >
                {loadingPlan === p.id ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Activating...</span>
                  </span>
                ) : isCurrent ? (
                  <span>Current plan</span>
                ) : p.id === "FREE" && currentPlan !== "FREE" ? (
                  <span>Included in your plan</span>
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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-2">
        {PRICING_COPY.guarantees.map((g, idx) => {
          const icons = [Shield, CreditCard, RefreshCw];
          const Icon = icons[idx] || Shield;
          return (
            <div
              key={idx}
              className="p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200/90 dark:border-[#27272a] shadow-2xs flex items-start gap-3.5"
            >
              <div className="w-9 h-9 rounded-[8px] bg-zinc-50 dark:bg-white/5 border border-zinc-200/80 dark:border-white/10 text-zinc-700 dark:text-neutral-300 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-zinc-900 dark:text-white leading-snug">
                  {g.title}
                </h4>
                <p className="text-[11.5px] text-zinc-500 dark:text-neutral-400 leading-relaxed mt-1">
                  {g.description}
                </p>
              </div>
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

        <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] overflow-hidden shadow-xs">
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
