"use client";

import React, { useState, useEffect } from "react";
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
import confetti from "canvas-confetti";

export default function PricingPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");
  const currentPlan = convexUser?.plan || (session?.user as any)?.plan || "FREEMIUM";
  const [isAnnual, setIsAnnual] = useState(false);

  const updatePlanMutation = useMutation(api.users.updatePlan);

  const handleSelectPlan = async (plan: PlanType) => {
    if (currentPlan === plan) {
      showToast.info(`Vous êtes déjà sur le forfait ${plan}.`);
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
          name: session?.user?.name || "Utilisateur",
          plan: plan as "FREEMIUM" | "PRO" | "BUSINESS",
        });
      }
      confetti({ particleCount: 70, spread: 80, origin: { y: 0.6 } });
      showToast.success(`Forfait mis à jour avec succès : ${plan} !`);
    } catch (err: any) {
      showToast.error("Erreur lors de la mise à niveau.");
    }
  };

  const plans = [
    {
      id: "FREEMIUM" as PlanType,
      name: "Plan Freemium",
      tagline: "Pour démarrer et tester la puissance du routage Edge sans débourser un centime.",
      priceMonthly: 0,
      priceAnnual: 0,
      badge: "Gratuit à vie",
      popular: false,
      features: [
        "60 000 clics / mois inclus",
        "Jusqu'à 3 domaines personnalisés",
        "1 000 liens courts",
        "Routage basique (1 seule règle pays)",
        "Studio QR Code (5 items gratuits, styles de base)",
        "Rétention Analytics 30 jours",
        "Clés API Développeur (1 000 req/min)",
        "Support Communautaire",
      ],
      limitations: [
        "Routage Multi-Conditions & Appareils non inclus",
        "Cloaking & Protection Mot de passe non inclus",
        "Webhooks & Pixels de retargeting non inclus",
      ],
    },
    {
      id: "PRO" as PlanType,
      name: "Plan Pro",
      tagline: "Pour les créateurs, marketeurs d'affiliation et e-commerçants voulant maximiser leur ROI.",
      priceMonthly: 12,
      priceAnnual: 115,
      monthlyEquivalent: "9,58€",
      badge: "Le plus populaire",
      popular: true,
      features: [
        "Volume de clics ILLIMITÉ (-1)",
        "Jusqu'à 15 domaines personnalisés",
        "Liens courts illimités (-1)",
        "Routage Multi-Conditions complet (Tous pays + devices + opérateurs)",
        "Cloaking d'URL & Protection par Mot de passe",
        "Studio QR Code complet (Tous styles, gradients, logos, cadres)",
        "Webhooks & Pixels inclus (5 webhooks / 5 pixels)",
        "Rétention Analytics ILLIMITÉE",
        "Clés API Développeur (Débit ILLIMITÉ)",
        "Support prioritaire par email & chat",
      ],
      limitations: [],
    },
    {
      id: "BUSINESS" as PlanType,
      name: "Plan Business",
      tagline: "Pour les agences et entreprises à très fort volume exigeant une puissance illimitée.",
      priceMonthly: 39,
      priceAnnual: 374,
      monthlyEquivalent: "31,16€",
      badge: "Puissance Illimitée",
      popular: false,
      features: [
        "Volume de clics ILLIMITÉ (-1)",
        "Domaines personnalisés ILLIMITÉS (-1)",
        "Liens courts illimités (-1)",
        "Routage Multi-Conditions complet + Priorités avancées",
        "Cloaking d'URL & Protection par Mot de passe inclus",
        "Studio QR Code déverrouillé + Export SVG vectoriel illimité",
        "Webhooks & Pixels de Retargeting ILLIMITÉS",
        "Rétention Analytics ILLIMITÉE / Données brutes & Export",
        "Clés API Développeur (Débit ILLIMITÉ)",
        "IP Dédiée, SLA 99.99% & Support 24/7",
      ],
      limitations: [],
    },
  ];

  const comparisonTable = [
    {
      feature: "Quota de Clics / mois",
      free: "60 000",
      pro: "Illimité (-1)",
      business: "Illimité (-1)",
    },
    {
      feature: "Domaines Personnalisés",
      free: "Jusqu'à 3 domaines",
      pro: "Jusqu'à 15 domaines",
      business: "Illimité (-1)",
    },
    {
      feature: "Nombre de Liens",
      free: "1 000 liens",
      pro: "Illimité (-1)",
      business: "Illimité (-1)",
    },
    {
      feature: "Routage Multi-Conditions",
      free: "Basique (1 règle pays max)",
      pro: "Complet (Tous pays + devices + opérateurs)",
      business: "Complet + Priorités avancées",
    },
    {
      feature: "Cloaking & Protection Mot de passe",
      free: false,
      pro: true,
      business: true,
    },
    {
      feature: "Studio QR Code",
      free: "5 items gratuits (styles de base)",
      pro: "Tous les styles, gradients, logos, cadres",
      business: "Déverrouillé + Export SVG illimité",
    },
    {
      feature: "Webhooks & Pixels",
      free: false,
      pro: "✅ Inclus (5 webhooks / 5 pixels)",
      business: "✅ Illimités",
    },
    {
      feature: "Rétention Analytics",
      free: "30 jours",
      pro: "Illimitée",
      business: "Illimitée / Données brutes & Export",
    },
    {
      feature: "Clés API & Rate Limit",
      free: "1 000 req/min",
      pro: "Illimité",
      business: "Illimité",
    },
  ];

  return (
    <div className="flex flex-col gap-10 animate-in fade-in pb-16">
      {/* Header & Subtitle */}
      <div className="text-center max-w-3xl mx-auto flex flex-col items-center gap-3">
        <span className="px-3 py-1 rounded-full bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30 text-xs font-bold uppercase tracking-wider">
          Grille Tarifaire Compétitive
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          Des forfaits conçus pour <span className="text-[#ff6600]">dominer le marché</span>
        </h1>
        <p className="text-sm text-neutral-400 leading-relaxed">
          Grâce à l&apos;avantage technologique de Cloudflare Edge, profitez du ciblage avancé (Géo &amp; Appareil) dès le plan gratuit, là où la concurrence facture 48$/mois.
        </p>

        {/* Annual / Monthly Toggle */}
        <div className="flex items-center gap-3 mt-4 p-1.5 rounded-full bg-[#141416] border border-[#27272a]">
          <button
            onClick={() => setIsAnnual(false)}
            className={`btn-hover-scale px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
              !isAnnual ? "bg-[#ff6600] text-white shadow-md shadow-[#ff6600]/25" : "text-neutral-400 hover:text-white"
            }`}
          >
            Facturation Mensuelle
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`btn-hover-scale px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              isAnnual ? "bg-[#ff6600] text-white shadow-md shadow-[#ff6600]/25" : "text-neutral-400 hover:text-white"
            }`}
          >
            <span>Facturation Annuelle</span>
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-extrabold uppercase">
              2 mois offerts
            </span>
          </button>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
        {plans.map((p) => {
          const isCurrent = currentPlan === p.id;
          const displayPrice = isAnnual ? p.priceAnnual : p.priceMonthly;

          return (
            <div
              key={p.id}
              className={`relative flex flex-col justify-between p-6 sm:p-7 rounded-[10px] bg-[#141416] border transition-all duration-300 ${
                p.popular
                  ? "border-[#ff6600] shadow-2xl shadow-[#ff6600]/15 ring-1 ring-[#ff6600]"
                  : "border-[#27272a] hover:border-neutral-500"
              }`}
            >
              {p.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-[#ff6600] text-white text-[10px] font-bold uppercase tracking-wider shadow-lg">
                  {p.badge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white tracking-wide">{p.name}</h3>
                  {isCurrent && (
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold uppercase">
                      Forfait Actuel
                    </span>
                  )}
                </div>
                <p className="text-xs text-neutral-400 mt-2 min-h-[36px]">{p.tagline}</p>

                {/* Price display */}
                <div className="my-5 flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-white">{displayPrice}€</span>
                  <span className="text-xs text-neutral-400">
                    {p.priceMonthly === 0 ? "à vie" : isAnnual ? "/ an" : "/ mois"}
                  </span>
                  {isAnnual && p.monthlyEquivalent && (
                    <span className="text-[11px] text-neutral-400 ml-1">
                      (soit {p.monthlyEquivalent}/mois)
                    </span>
                  )}
                </div>

                {/* Features list */}
                <div className="flex flex-col gap-2.5 text-xs text-neutral-300 pt-4 border-t border-[#222225]">
                  {p.features.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}

                  {p.limitations.map((lim, i) => (
                    <div key={i} className="flex items-start gap-2 text-neutral-500">
                      <X className="w-4 h-4 text-neutral-500 shrink-0 mt-0.5" />
                      <span className="leading-snug">{lim}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={() => handleSelectPlan(p.id)}
                disabled={isCurrent}
                className={`btn-hover-scale mt-7 w-full py-3 rounded-[10px] font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isCurrent
                    ? "bg-white/5 text-neutral-400 border border-[#27272a] cursor-default"
                    : p.popular
                    ? "bg-[#ff6600] hover:bg-[#ff771a] text-white shadow-lg shadow-[#ff6600]/30"
                    : "bg-white/10 hover:bg-white/20 text-white border border-white/20"
                }`}
              >
                {isCurrent ? (
                  <span>Forfait Actif</span>
                ) : (
                  <>
                    <span>Choisir ce forfait</span>
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
          <h2 className="text-xl font-bold text-white tracking-wide">Tableau Comparatif Détaillé</h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Toutes les caractéristiques techniques et quotas comparés au millimètre près.
          </p>
        </div>

        <div className="rounded-[10px] bg-[#141416] border border-[#27272a] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-[#27272a] bg-[#1a1a1e]/80 text-neutral-400 uppercase tracking-wider font-bold text-[10px]">
                  <th className="p-4 sm:p-5">Fonctionnalité</th>
                  <th className="p-4 sm:p-5 text-neutral-300">Plan FREEMIUM (0€)</th>
                  <th className="p-4 sm:p-5 text-[#ff6600]">Plan PRO (12€/m ou 115€/an)</th>
                  <th className="p-4 sm:p-5 text-white">Plan BUSINESS (39€/m ou 374€/an)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222225] text-neutral-200">
                {comparisonTable.map((row, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 sm:p-5 font-semibold text-white">{row.feature}</td>
                    <td className="p-4 sm:p-5">
                      {typeof row.free === "boolean" ? (
                        row.free ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <span className="text-neutral-500 font-medium">❌ Non inclus</span>
                        )
                      ) : (
                        <span className="font-mono text-neutral-300">{row.free}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.pro === "boolean" ? (
                        row.pro ? (
                          <span className="text-emerald-400 font-semibold">✅ Inclus</span>
                        ) : (
                          <span className="text-neutral-500">❌ Non inclus</span>
                        )
                      ) : (
                        <span className="font-mono font-bold text-[#ff6600]">{row.pro}</span>
                      )}
                    </td>
                    <td className="p-4 sm:p-5">
                      {typeof row.business === "boolean" ? (
                        row.business ? (
                          <span className="text-emerald-400 font-semibold">✅ Inclus</span>
                        ) : (
                          <span className="text-neutral-500">❌ Non inclus</span>
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
