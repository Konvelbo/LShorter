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
      showToast.info(`Vous êtes déjà sur le forfait ${planKey}.`);
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
      showToast.success(`Forfait mis à jour avec succès : ${planKey} !`);
    } catch (err: any) {
      showToast.error("Erreur lors de la mise à jour du forfait.");
    } finally {
      setLoadingPlan(null);
    }
  };

  const plansList = [
    {
      id: "FREE" as const,
      name: PRICING_PLANS.FREE.name,
      tagline: PRICING_COPY.planExplanations.free,
      displayPrice: "0 €",
      originalPrice: null,
      subPriceNote: null,
      unit: "à vie",
      badge: "Gratuit",
      popular: false,
      features: [
        "10 000 clics / mois inclus",
        "50 liens courts actifs",
        "Routage basique (1 règle pays)",
        "Studio QR Code (Styles basiques)",
        "Rétention Analytics : 30 jours",
        "Clés API Développeur (60 req/min)",
        "Support communautaire",
      ],
      limitations: [
        "Domaines personnalisés non inclus",
        "Routage avancé & par appareil non inclus",
        "Protection par mot de passe & cloaking non inclus",
        "Webhooks & Pixels non inclus",
      ],
    },
    {
      id: "PRO" as const,
      name: PRICING_PLANS.PRO.name,
      tagline: PRICING_COPY.planExplanations.pro,
      displayPrice: isAnnual ? "90 €" : "3,75 €",
      originalPrice: isAnnual ? "180 €" : "15 €",
      subPriceNote: isAnnual ? "soit 7,50 €/mois" : "puis 15 €/mois dès le 2ᵉ mois",
      unit: isAnnual ? "/ an" : "/ mois",
      badge: isAnnual ? "Économisez 50%" : "Offre de lancement : -75%",
      popular: true,
      features: [
        "500 000 clics / mois inclus",
        "Garantie Zéro Coupure (+1 € / 10k sup)",
        "Jusqu'à 3 domaines personnalisés",
        "1 000 liens courts actifs",
        "Routage Avancé (Pays + Appareils)",
        "Protection par mot de passe & Cloaking",
        "5 Webhooks & 5 Pixels de Retargeting",
        "Rétention Analytics : 365 jours",
        "Clés API Développeur (1 000 req/min)",
        "Support prioritaire par email",
      ],
      limitations: [],
    },
    {
      id: "BUSINESS" as const,
      name: PRICING_PLANS.BUSINESS.name,
      tagline: PRICING_COPY.planExplanations.business,
      displayPrice: isAnnual ? "350 €" : "19,60 €",
      originalPrice: isAnnual ? "588 €" : "49 €",
      subPriceNote: isAnnual ? "soit 29,16 €/mois" : "puis 49 €/mois dès le 2ᵉ mois",
      unit: isAnnual ? "/ an" : "/ mois",
      badge: isAnnual ? "Économisez 40%" : "Offre de lancement : -60%",
      popular: false,
      features: [
        "2 000 000 clics / mois inclus",
        "Garantie Zéro Coupure (+0,80 € / 10k sup)",
        "Jusqu'à 15 domaines personnalisés",
        "Liens courts illimités",
        "Routage Custom multi-conditions",
        "Protection avancée, Cloaking & Expiration",
        "Studio QR Code débloqué + Export Vectoriel SVG",
        "Webhooks & Pixels de Retargeting illimités",
        "Rétention Analytics illimitée",
        "5 sièges d'équipe inclus",
        "Clés API Développeur (5 000 req/min)",
        "Support dédié 24/7",
      ],
      limitations: [],
    },
    {
      id: "ENTERPRISE" as const,
      name: PRICING_PLANS.ENTERPRISE.name,
      tagline: PRICING_COPY.planExplanations.enterprise,
      displayPrice: isAnnual ? "1 670 €" : "99,50 €",
      originalPrice: isAnnual ? "2 388 €" : "199 €",
      subPriceNote: isAnnual ? "soit 139,16 €/mois" : "puis 199 €/mois dès le 2ᵉ mois",
      unit: isAnnual ? "/ an" : "/ mois",
      badge: isAnnual ? "Économisez 30%" : "Offre de lancement : -50%",
      popular: false,
      features: [
        "10 000 000 clics / mois inclus",
        "Garantie Zéro Coupure (+0,50 € / 10k sup)",
        "Jusqu'à 50 domaines personnalisés",
        "Liens courts illimités",
        "Routage Custom ultra-précis (Réseau / FAI / Ville)",
        "15 sièges d'équipe inclus",
        "Webhooks & Pixels de Retargeting illimités",
        "Rétention Analytics illimitée & Export brut",
        "Clés API Développeur (15 000 req/min)",
        "SLA 99.99% garanti & Support dédié direct",
      ],
      limitations: [],
    },
  ];

  const comparisonTable = [
    {
      feature: "Volume de clics mensuel",
      free: "10 000",
      pro: "500 000",
      business: "2 000 000",
      enterprise: "10 000 000",
    },
    {
      feature: "Garantie Zéro Coupure (Overage)",
      free: "Non (Redirection brute maintenue)",
      pro: "1,00 € / 10 000 clics",
      business: "0,80 € / 10 000 clics",
      enterprise: "0,50 € / 10 000 clics",
    },
    {
      feature: "Domaines personnalisés",
      free: "0 domaine",
      pro: "3 domaines",
      business: "15 domaines",
      enterprise: "50 domaines",
    },
    {
      feature: "Nombre de liens actifs",
      free: "50 liens",
      pro: "1 000 liens",
      business: "Illimité",
      enterprise: "Illimité",
    },
    {
      feature: "Smart Routing & Ciblage",
      free: "Basique (1 règle pays)",
      pro: "Avancé (Pays + Appareils)",
      business: "Custom (Multi-conditions)",
      enterprise: "Custom (Réseau + FAI + Villes)",
    },
    {
      feature: "Protection, Mot de passe & Cloaking",
      free: false,
      pro: true,
      business: true,
      enterprise: true,
    },
    {
      feature: "Webhooks & Pixels de Retargeting",
      free: false,
      pro: "5 webhooks / 5 pixels",
      business: "Illimité",
      enterprise: "Illimité",
    },
    {
      feature: "Rétention Analytics",
      free: "30 jours",
      pro: "365 jours",
      business: "Illimitée",
      enterprise: "Illimitée + Export brut",
    },
    {
      feature: "Débit API Développeur",
      free: "60 req / min",
      pro: "1 000 req / min",
      business: "5 000 req / min",
      enterprise: "15 000 req / min",
    },
    {
      feature: "Sièges d'équipe inclus",
      free: "1 siège",
      pro: "2 sièges",
      business: "5 sièges",
      enterprise: "15 sièges",
    },
    {
      feature: "Facturation & Factures PDF",
      free: "Reçus standard",
      pro: "Factures automatisées PDF",
      business: "Factures automatisées PDF",
      enterprise: "Factures automatisées PDF",
    },
  ];

  return (
    <div className="flex flex-col gap-12 animate-in fade-in pb-16">
      {/* Header & Subtitle */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
        <span className="px-3.5 py-1 rounded-full bg-brand-subtle text-brand border border-brand-subtle text-xs font-bold uppercase tracking-wider">
          Grille Tarifaire Promotionnelle
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
          Tarification claire, <span className="text-brand">Garantie Zéro Coupure</span>
        </h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-2xl">
          Déployé sur le réseau mondial Edge de Cloudflare. Vos liens sont toujours actifs, vos redirections instantanées et vos factures générées automatiquement en 1 clic.
        </p>

        {/* Annual / Monthly Toggle */}
        <div className="flex items-center gap-2 mt-4 p-1.5 rounded-full bg-neutral-200/80 dark:bg-[#141416] border border-neutral-300 dark:border-[#27272a]">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              !isAnnual ? "bg-brand text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            Facturation Mensuelle
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              isAnnual ? "bg-brand text-white shadow-xs" : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
            }`}
          >
            Facturation Annuelle
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
              className={`relative flex flex-col justify-between p-6 rounded-[12px] bg-white dark:bg-[#141416] border transition-all duration-200 will-change-transform ${
                p.popular
                  ? "border-brand ring-1 ring-brand shadow-sm"
                  : "border-neutral-200 dark:border-[#27272a] hover:border-neutral-400 dark:hover:border-neutral-500 shadow-xs"
              }`}
            >
              {p.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-brand text-white text-[10px] font-bold uppercase tracking-wider shadow-xs whitespace-nowrap">
                  {p.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-neutral-900 dark:text-white tracking-wide">{p.name}</h3>
                  {isCurrent && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                      Actif
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 min-h-[38px] leading-relaxed">
                  {p.tagline}
                </p>

                {/* Price display with Strikethrough for promos */}
                <div className="my-5 flex flex-col gap-1">
                  <div className="flex items-baseline gap-2">
                    {p.originalPrice && (
                      <span className="text-sm font-semibold line-through text-neutral-400 dark:text-neutral-500">
                        {p.originalPrice}
                      </span>
                    )}
                    <span className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white">
                      {p.displayPrice}
                    </span>
                    <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
                      {p.unit}
                    </span>
                  </div>
                  {p.subPriceNote && (
                    <span className="text-[11px] font-medium text-brand dark:text-brand-hover">
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
                    <span>Activation...</span>
                  </span>
                ) : isCurrent ? (
                  <span>Forfait Actuel</span>
                ) : p.id === "FREE" ? (
                  <span>Commencer Gratuitement</span>
                ) : (
                  <>
                    <span>Choisir {p.name}</span>
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
            Matrice Comparative des Fonctionnalités
          </h2>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
            Toutes les spécifications techniques et quotas détaillés côte à côte.
          </p>
        </div>

        <div className="rounded-[12px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 dark:border-[#27272a] bg-neutral-50 dark:bg-[#1a1a1e]/80 text-neutral-600 dark:text-neutral-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="p-4 sm:p-5">Fonctionnalité</th>
                  <th className="p-4 sm:p-5 text-neutral-700 dark:text-neutral-300">STARTER (0 €)</th>
                  <th className="p-4 sm:p-5 text-brand">PRO (15 €/m)</th>
                  <th className="p-4 sm:p-5 text-neutral-900 dark:text-white">BUSINESS (49 €/m)</th>
                  <th className="p-4 sm:p-5 text-neutral-900 dark:text-white">ENTERPRISE (199 €/m)</th>
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
                          <span className="text-neutral-400">Non inclus</span>
                        )
                      ) : (
                        <span className="font-mono text-neutral-600 dark:text-neutral-300">{row.free}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Inclus
                          </span>
                        ) : (
                          <span className="text-neutral-400">Non inclus</span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-brand">{row.pro}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.business === "boolean" ? (
                        row.business ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Inclus
                          </span>
                        ) : (
                          <span className="text-neutral-400">Non inclus</span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-neutral-900 dark:text-white">{row.business}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.enterprise === "boolean" ? (
                        row.enterprise ? (
                          <span className="text-emerald-500 font-semibold flex items-center gap-1">
                            <Check className="w-4 h-4" /> Inclus
                          </span>
                        ) : (
                          <span className="text-neutral-400">Non inclus</span>
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
