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
      setReason(customEvent.detail?.reason || "Passez au forfait Pro ou supérieur pour déverrouiller cette fonctionnalité.");
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
      showToast.success(`Félicitations ! Vous êtes maintenant sur le forfait ${targetPlan}.`);
      setIsOpen(false);
    } catch (err: any) {
      showToast.error("Impossible de mettre à niveau le forfait.");
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
              <h3 className="text-xl font-bold text-zinc-900 dark:text-white tracking-wide">Passez à la Vitesse Supérieure</h3>
              <span className="px-2.5 py-0.5 rounded-full bg-brand-subtle text-brand text-[10px] font-bold uppercase tracking-wider border border-brand-subtle">
                PRO & BUSINESS
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
              {reason || "Profitez de la suite complète d'optimisation Edge sans restriction."}
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-5">
          {[
            { icon: Zap, text: "500k à 5M de Clics Edge avec Zéro Coupure" },
            { icon: Globe2, text: "Routage Intelligent (195+ Pays & Appareils)" },
            { icon: Lock, text: "Protection par Mot de Passe & Cloaking" },
            { icon: QrCode, text: "Studio QR Code Vectoriel SVG" },
            { icon: Layers, text: "Jusqu'à 50 Domaines Personnalisés" },
            { icon: ShieldCheck, text: "Webhooks, Pixels & Facturation PDF" },
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
          <div className="relative p-5 rounded-[12px] bg-brand/[0.03] dark:bg-[#1a1a1e] border-2 border-brand flex flex-col justify-between shadow-xs group">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-brand text-white text-[10px] font-bold tracking-wide uppercase shadow-xs">
              Offre : 3,75 € le 1er mois
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Forfait Pro</span>
                <span className="text-[11px] text-brand font-bold">500 000 clics</span>
              </div>
              <div className="flex items-baseline gap-2 my-2">
                <span className="text-xs text-zinc-400 line-through">15 €</span>
                <span className="text-3xl font-black text-zinc-900 dark:text-white">3,75 €</span>
                <span className="text-xs text-zinc-500 dark:text-neutral-400">/ 1er mois (puis 15 €)</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs text-zinc-700 dark:text-neutral-300 mt-3">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>3 domaines</strong> & 1 000 liens actifs</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Routage Avancé (Pays + Appareils)</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Protection par mot de passe & Cloaking</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>5 Webhooks & 5 Pixels de Retargeting</span>
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
                  <span>Activation...</span>
                </span>
              ) : (
                <>
                  <span>Passer à Pro (3,75 €)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Plan BUSINESS */}
          <div className="relative p-5 rounded-[12px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-neutral-500 flex flex-col justify-between transition-colors shadow-xs">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-bold tracking-wide uppercase shadow-xs">
              Offre : 19,60 € le 1er mois (-60%)
            </div>
            <div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">Forfait Business</span>
                <span className="text-[11px] text-emerald-500 font-bold">2M de clics</span>
              </div>
              <div className="flex items-baseline gap-2 my-2">
                <span className="text-xs text-zinc-400 line-through">49 €</span>
                <span className="text-3xl font-black text-zinc-900 dark:text-white">19,60 €</span>
                <span className="text-xs text-zinc-500 dark:text-neutral-400">/ 1er mois (puis 49 €)</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs text-zinc-700 dark:text-neutral-300 mt-3">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span><strong>15 domaines</strong> &amp; Liens illimités</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Routage Custom multi-conditions</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Webhooks &amp; Pixels de Retargeting illimités</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>5 sièges d'équipe &amp; Facturation PDF certifiée</span>
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
                  <span>Activation...</span>
                </span>
              ) : (
                <>
                  <span>Passer à Business (19,60 €)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-zinc-500 dark:text-neutral-500 mt-5">
          Sans engagement. Résiliation ou changement de formule en 1 clic à tout moment depuis vos paramètres.
        </p>
      </div>
    </div>
  );
}
