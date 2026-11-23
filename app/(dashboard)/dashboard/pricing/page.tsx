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
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PlanType } from "@/types";
import { showToast } from "@/components/ui/toast-provider";
import { PricingPageSkeleton } from "@/components/ui/skeleton";
import { PRICING_PLANS } from "@/src/config/pricing";
import { useI18n } from "@/components/providers/i18n-provider";


export default function PricingPage() {
  const router = useRouter();
  const { tr } = useI18n();
  const { data: session, status } = useSession();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");
  const rawPlan = (convexUser?.plan || (session?.user as any)?.plan || "FREE").toUpperCase();
  const currentPlan = rawPlan === "FREEMIUM" ? "FREE" : rawPlan;

  const [isAnnual, setIsAnnual] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const cardsContainerRef = useRef<HTMLDivElement>(null);

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
      showToast.info(
        tr(
          `You are already subscribed to the ${planKey} (${isAnnual ? "Annual" : "Monthly"}) plan.`,
          `Vous êtes déjà abonné au forfait ${planKey} (${isAnnual ? "Annuel" : "Mensuel"}).`
        )
      );
      return;
    }

    // Guests selecting Starter go straight to free registration
    if (!session?.user && planKey === "FREE") {
      router.push("/register");
      return;
    }

    setLoadingPlan(planKey);
    try {
      // For paid plans, initiate direct Dodo Payments hosted checkout (authenticated or guest)
      if (planKey !== "FREE") {
        const res = await fetch("/api/billing/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            planId: planKey,
            cycle: isAnnual ? "YEARLY" : "MONTHLY",
            userId: userId || undefined,
            customerEmail: session?.user?.email || undefined,
            successUrl: `${window.location.origin}/dashboard/settings?tab=billing&checkout_success=true&plan=${planKey}`,
            cancelUrl: window.location.href,
          }),
        });

        const data = await res.json();
        if (res.ok && data.success && data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
          return;
        }

        showToast.error(
          data.error ||
            tr(
              "Unable to initiate Dodo Payments checkout session.",
              "Impossible de démarrer la session de paiement Dodo Payments."
            )
        );
        return;
      }

      // Authenticated users selecting FREE are directed to Billing Settings to manage/cancel active subscription
      router.push("/dashboard/settings?tab=billing");
    } catch {
      showToast.error(
        tr(
          "Error updating subscription plan.",
          "Erreur lors de la mise à jour du forfait."
        )
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  const plansList = [
    {
      id: "FREE" as const,
      name: PRICING_PLANS.FREE.name,
      tagline: tr(
        "To explore our Edge infrastructure, no credit card required.",
        "Pour découvrir notre infrastructure Edge, sans carte bancaire."
      ),
      displayPrice: "$0",
      originalPrice: null,
      subPriceNote: null,
      savingsText: null,
      unit: tr("forever", "à vie"),
      badge: tr("Free", "Gratuit"),
      popular: false,
      features: [
        tr("10,000 clicks / month", "10 000 clics / mois"),
        tr("3 domains and 50 active links", "3 domaines et 50 liens actifs"),
        tr(
          "Global Workspace Target (clicks and revenue)",
          "Objectif global de l'espace (clics et revenus)"
        ),
        tr("QR Code Studio (basic styles)", "Studio QR Code (styles de base)"),
        tr("30-day analytics · API 60 req/min", "Analytiques 30 jours · API 60 req/min"),
        tr("Community support", "Support communautaire"),
      ],
      notIncludedNote: tr(
        "Not included: Smart Routing, PIN protection, individual link alerts, webhooks, and pixels.",
        "Non inclus : Routage intelligent, protection par PIN, alertes par lien, webhooks et pixels."
      ),
    },
    {
      id: "PRO" as const,
      name: PRICING_PLANS.PRO.name,
      tagline: tr(
        "Grow your brand and maximize your conversion rates.",
        "Développez votre marque et maximisez vos taux de conversion."
      ),
      displayPrice: isAnnual ? "$90" : "$3.75",
      originalPrice: isAnnual ? "$180" : "$15",
      savingsText: isAnnual
        ? tr("Save $90 / yr", "Économisez $90 / an")
        : tr("Save $22.50 over 2 months", "Économisez $22.50 sur 2 mois"),
      subPriceNote: isAnnual
        ? tr("or $7.50 / month", "soit $7.50 / mois")
        : tr("then $15 / month", "puis $15 / mois"),
      unit: isAnnual ? tr("/ yr", "/ an") : tr("/ 2 mo", "/ 2 mois"),
      badge: isAnnual ? tr("-50% annual", "-50% annuel") : tr("-75% promo", "-75% promo"),
      popular: true,
      features: [
        tr("150,000 clicks / month (+$3 / 50k)", "150 000 clics / mois (+$3 / 50k)"),
        tr("6 domains and 1,000 active links", "6 domaines et 1 000 liens actifs"),
        tr(
          "Individual link alerts (clicks, revenue, expiration)",
          "Alertes par lien (clics, revenus, expiration)"
        ),
        tr(
          "Dynamic Smart Routing (country + OS/device)",
          "Routage intelligent dynamique (pays + OS/appareil)"
        ),
        tr(
          "PIN codes and destination masking",
          "Codes PIN et masquage de destination"
        ),
        tr("5 webhooks and 5 retargeting pixels", "5 webhooks et 5 pixels de reciblage"),
        tr("365-day analytics · API 200 req/min", "Analytiques 365 jours · API 200 req/min"),
        tr("Priority email support", "Support e-mail prioritaire"),
      ],
      notIncludedNote: null,
    },
    {
      id: "BUSINESS" as const,
      name: PRICING_PLANS.BUSINESS.name,
      tagline: tr(
        "For multi-channel campaigns and growing teams.",
        "Pour les campagnes multicanales et les équipes en croissance."
      ),
      displayPrice: isAnnual ? "$350" : "$19.60",
      originalPrice: isAnnual ? "$588" : "$49",
      savingsText: isAnnual
        ? tr("Save $238 / yr", "Économisez $238 / an")
        : tr("Save $58.80 over 2 months", "Économisez $58.80 sur 2 mois"),
      subPriceNote: isAnnual
        ? tr("or $29.16 / month", "soit $29.16 / mois")
        : tr("then $49 / month", "puis $49 / mois"),
      unit: isAnnual ? tr("/ yr", "/ an") : tr("/ 2 mo", "/ 2 mois"),
      badge: isAnnual ? tr("-40% annual", "-40% annuel") : tr("-60% promo", "-60% promo"),
      popular: false,
      features: [
        tr("500,000 clicks / month (+$8 / 125k)", "500 000 clics / mois (+$8 / 125k)"),
        tr("15 domains and unlimited active links", "15 domaines et liens actifs illimités"),
        tr("Unlimited individual link alerts", "Alertes individuelles illimitées"),
        tr("Multi-condition rule engine", "Moteur de règles multi-conditions"),
        tr(
          "Advanced protection and destination masking",
          "Protection avancée et masquage de destination"
        ),
        tr("Vector QR Code Studio (SVG / PDF)", "Studio QR Code vectoriel (SVG / PDF)"),
        tr("Unlimited webhooks and pixels", "Webhooks et pixels illimités"),
        tr("Unlimited analytics · API 600 req/min", "Analytiques illimitées · API 600 req/min"),
        tr("5 team seats · 24/7 support", "5 membres d'équipe · Support 24/7"),
      ],
      notIncludedNote: null,
    },
    {
      id: "ENTERPRISE" as const,
      name: PRICING_PLANS.ENTERPRISE.name,
      tagline: tr(
        "Unlimited clicks and dedicated high-throughput Edge SLA.",
        "Clics illimités et SLA Edge haute performance dédié."
      ),
      displayPrice: isAnnual ? "$1,670" : "$99.50",
      originalPrice: isAnnual ? "$2,388" : "$199",
      savingsText: isAnnual
        ? tr("Save $718 / yr", "Économisez $718 / an")
        : tr("Save $199 over 2 months", "Économisez $199 sur 2 mois"),
      subPriceNote: isAnnual
        ? tr("or $139.16 / month", "soit $139.16 / mois")
        : tr("then $199 / month", "puis $199 / mois"),
      unit: isAnnual ? tr("/ yr", "/ an") : tr("/ 2 mo", "/ 2 mois"),
      badge: isAnnual ? tr("-30% annual", "-30% annuel") : tr("-50% promo", "-50% promo"),
      popular: false,
      features: [
        tr(
          "Unlimited clicks, domains, and links",
          "Clics, domaines et liens illimités"
        ),
        tr("Global alerts with VIP routing", "Alertes globales avec routage VIP"),
        tr(
          "Hyper-targeted routing (ISP / ASN / city)",
          "Routage hyper-ciblé (FAI / ASN / ville)"
        ),
        tr("Unlimited webhooks and pixels", "Webhooks et pixels illimités"),
        tr(
          "Unlimited analytics and raw CSV export",
          "Analytiques illimitées et export CSV brut"
        ),
        tr("API 1,400 req/min", "API 1 400 req/min"),
        tr("15 team seats", "15 membres d'équipe"),
        tr(
          "99.99% Edge SLA and direct VIP support",
          "SLA Edge 99,99 % et support VIP direct"
        ),
      ],
      notIncludedNote: null,
    },
  ];

  const guaranteesList = [
    {
      title: tr("Zero-Downtime Guarantee", "Garantie zéro coupure"),
      description: tr(
        "Your campaigns never stop. On Pro ($3 / 50k extra clicks), Business ($8 / 125k extra clicks), and Enterprise (Unlimited clicks), redirects keep running seamlessly during traffic surges.",
        "Vos campagnes ne s'arrêtent jamais. En Pro ($3 / 50k clics sup.), Business ($8 / 125k clics sup.) et Enterprise (clics illimités), vos redirections restent fluides même lors des pics de trafic."
      ),
    },
    {
      title: tr(
        "Secure Payments & Instant Invoices",
        "Paiements sécurisés & factures instantanées"
      ),
      description: tr(
        "Bank-grade encrypted transactions. Certified PDF invoices are available for download immediately in your billing settings.",
        "Transactions chiffrées de niveau bancaire. Vos factures PDF certifiées sont téléchargeables immédiatement depuis vos paramètres de facturation."
      ),
    },
    {
      title: tr("Instant Plan Switching", "Changement de forfait instantané"),
      description: tr(
        "Flexible scaling as you grow. Switch or upgrade your plan in one click directly from your billing settings.",
        "Évoluez librement selon vos besoins. Changez ou améliorez votre forfait en un clic depuis vos paramètres de facturation."
      ),
    },
  ];

  const comparisonTable = [
    {
      feature: tr("Monthly Click Volume", "Volume mensuel de clics"),
      free: tr("10,000", "10 000"),
      pro: tr("150,000", "150 000"),
      business: tr("500,000", "500 000"),
      enterprise: tr("Unlimited", "Illimité"),
    },
    {
      feature: tr(
        "Zero-Downtime Guarantee (Overage)",
        "Garantie zéro coupure (dépassement)"
      ),
      free: tr("Hard limit at 10,000", "Limite stricte à 10 000"),
      pro: tr("$3 / 50,000 extra clicks", "$3 / 50 000 clics sup."),
      business: tr("$8 / 125,000 extra clicks", "$8 / 125 000 clics sup."),
      enterprise: tr("Unlimited ($0 extra)", "Illimité ($0 sup.)"),
    },
    {
      feature: tr("Custom Branded Domains", "Domaines personnalisés"),
      free: tr("3 domains", "3 domaines"),
      pro: tr("6 domains", "6 domaines"),
      business: tr("15 domains", "15 domaines"),
      enterprise: tr("Unlimited", "Illimité"),
    },
    {
      feature: tr("Active Short Links", "Liens courts actifs"),
      free: tr("50 links", "50 liens"),
      pro: tr("1,000 links", "1 000 liens"),
      business: tr("Unlimited", "Illimité"),
      enterprise: tr("Unlimited", "Illimité"),
    },
    {
      feature: tr("Smart Routing & Targeting", "Routage intelligent & ciblage"),
      free: tr("Not included (Paid only)", "Non inclus (forfaits payants)"),
      pro: tr("Advanced (Country + OS)", "Avancé (Pays + OS)"),
      business: tr("Custom (Multi-condition)", "Personnalisé (Multi-conditions)"),
      enterprise: tr(
        "Custom (Network + ISP + City)",
        "Personnalisé (Réseau + FAI + Ville)"
      ),
    },
    {
      feature: tr(
        "Protection, PIN Password & Destination Masking",
        "Protection, code PIN et masquage de destination"
      ),
      free: false,
      pro: true,
      business: true,
      enterprise: true,
    },
    {
      feature: tr(
        "Webhooks & Retargeting Pixels",
        "Webhooks & Pixels de reciblage"
      ),
      free: false,
      pro: tr("5 webhooks / 5 pixels", "5 webhooks / 5 pixels"),
      business: tr("Unlimited", "Illimité"),
      enterprise: tr("Unlimited", "Illimité"),
    },
    {
      feature: tr(
        "Target & Notification Alerts",
        "Objectifs & Alertes de notification"
      ),
      free: tr(
        "Global Workspace Target only",
        "Objectif global de l'espace uniquement"
      ),
      pro: tr(
        "Individual Link Alerts (Clicks, Revenue & Expiration)",
        "Alertes par lien (clics, revenus & expiration)"
      ),
      business: tr(
        "Unlimited Link Alerts & Instant Expiration",
        "Alertes par lien illimitées & expiration instantanée"
      ),
      enterprise: tr(
        "Unlimited Link & Workspace Alerts (VIP)",
        "Alertes liens & espace illimitées (VIP)"
      ),
    },
    {
      feature: tr("Analytics Retention", "Rétention des analytiques"),
      free: tr("30 days", "30 jours"),
      pro: tr("365 days", "365 jours"),
      business: tr("Unlimited", "Illimitée"),
      enterprise: tr("Unlimited + Raw export", "Illimitée + Export brut"),
    },
    {
      feature: tr("Developer API Rate Limit", "Limite d'appels API développeur"),
      free: tr("60 req / min", "60 req / min"),
      pro: tr("200 req / min", "200 req / min"),
      business: tr("600 req / min", "600 req / min"),
      enterprise: tr("1,400 req / min", "1 400 req / min"),
    },
    {
      feature: tr("Team Seats Included", "Membres d'équipe inclus"),
      free: tr("1 seat", "1 membre"),
      pro: tr("2 seats", "2 membres"),
      business: tr("5 seats", "5 membres"),
      enterprise: tr("15 seats", "15 membres"),
    },
    {
      feature: tr(
        "Billing & Official PDF Invoices",
        "Facturation & factures PDF officielles"
      ),
      free: tr("Standard receipts", "Reçus standards"),
      pro: tr("Automated PDF invoices", "Factures PDF automatiques"),
      business: tr("Automated PDF invoices", "Factures PDF automatiques"),
      enterprise: tr("Automated PDF invoices", "Factures PDF automatiques"),
    },
  ];

  return (
    <div className="flex flex-col gap-10 animate-in fade-in pb-16">
      {/* Header & Subtitle */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
        <span className="px-3 py-1 rounded-[6px] bg-[#EFF6FF] dark:bg-brand/15 text-[#1D4ED8] dark:text-[#60A5FA] text-[10px] font-bold uppercase tracking-widest">
          {tr("Promotional Offers", "Offres promotionnelles")}
        </span>
        <h1 className="text-3xl sm:text-[42px] font-extrabold text-zinc-900 dark:text-white tracking-tight leading-[1.15]">
          {tr("Simple pricing,", "Tarification simple,")}
          <br />
          <span className="text-[#1D4ED8] dark:text-[#3B82F6]">
            {tr("zero downtime guaranteed", "zéro coupure garantie")}
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 dark:text-neutral-400 leading-relaxed max-w-xl mt-1">
          {tr(
            "Deployed on Cloudflare's global Edge network, your links stay fast and reliable. Certified PDF invoices are generated instantly in 1 click.",
            "Déployés sur le réseau mondial Edge de Cloudflare, vos liens restent rapides et fiables. Les factures PDF certifiées sont générées en 1 clic."
          )}
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
            <span>{tr("Monthly", "Mensuel")}</span>
            <span
              className={`text-[11px] font-semibold ${
                !isAnnual
                  ? "text-white/90"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {tr("-75% first 2 months", "-75% les 2 premiers mois")}
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
            <span>{tr("Annual", "Annuel")}</span>
            <span
              className={`text-[11px] font-semibold ${
                isAnnual
                  ? "text-white/90"
                  : "text-emerald-600 dark:text-emerald-400"
              }`}
            >
              {tr("up to -50%", "jusqu'à -50%")}
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
                        {isCurrent
                          ? tr("Current plan", "Forfait actuel")
                          : tr("Free forever", "Gratuit à vie")}
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
                    <span>{tr("Activating...", "Activation...")}</span>
                  </span>
                ) : isCurrent ? (
                  <span>{tr("Current plan", "Forfait actuel")}</span>
                ) : p.id === "FREE" && currentPlan !== "FREE" ? (
                  <span>{tr("Included in your plan", "Inclus dans votre forfait")}</span>
                ) : p.id === "FREE" ? (
                  <span>{tr("Get Started Free", "Commencer gratuitement")}</span>
                ) : (
                  <>
                    <span>{tr(`Choose ${p.name}`, `Choisir ${p.name}`)}</span>
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
        {guaranteesList.map((g, idx) => {
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
            {tr("Feature Comparison Matrix", "Tableau comparatif des fonctionnalités")}
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            {tr(
              "All detailed technical specifications, quotas, and capabilities side by side.",
              "Toutes les caractéristiques techniques, quotas et fonctionnalités détaillées côte à côte."
            )}
          </p>
        </div>

        <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-[#27272a] bg-neutral-50 dark:bg-[#1a1a1e]/80 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="p-4 sm:p-5">{tr("Feature", "Fonctionnalité")}</th>
                  <th className="p-4 sm:p-5 text-neutral-700 dark:text-neutral-300">STARTER ($0)</th>
                  <th className="p-4 sm:p-5 text-brand">PRO ({tr("$15/mo", "$15/mois")})</th>
                  <th className="p-4 sm:p-5 text-neutral-900 dark:text-white">BUSINESS ({tr("$49/mo", "$49/mois")})</th>
                  <th className="p-4 sm:p-5 text-neutral-900 dark:text-white">ENTERPRISE ({tr("$199/mo", "$199/mois")})</th>
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
                          <span className="text-neutral-400">{tr("Not included", "Non inclus")}</span>
                        )
                      ) : (
                        <span className="font-mono text-neutral-600 dark:text-neutral-300">{row.free}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <Check className="w-4 h-4" /> {tr("Included", "Inclus")}
                          </span>
                        ) : (
                          <span className="text-neutral-400">{tr("Not included", "Non inclus")}</span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-brand">{row.pro}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.business === "boolean" ? (
                        row.business ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <Check className="w-4 h-4" /> {tr("Included", "Inclus")}
                          </span>
                        ) : (
                          <span className="text-neutral-400">{tr("Not included", "Non inclus")}</span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">{row.business}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <Check className="w-4 h-4" /> {tr("Included", "Inclus")}
                          </span>
                        ) : (
                          <span className="text-neutral-400">{tr("Not included", "Non inclus")}</span>
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
