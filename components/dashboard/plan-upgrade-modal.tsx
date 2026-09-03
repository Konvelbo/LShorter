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
  ArrowRight
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { UserProfile, PlanType } from "@/types";
import { showToast } from "@/components/ui/toast-provider";
import { syncUserToCloudflare } from "@/app/actions/sync-user";
import confetti from "canvas-confetti";

export function PlanUpgradeModal() {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const currentPlan = (session?.user as any)?.plan || "FREEMIUM";

  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<"PRO" | "BUSINESS" | null>(null);

  const updatePlanMutation = useMutation(api.users.updatePlan);

  useEffect(() => {
    const handleUpgradeRequest = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason?: string }>;
      setReason(customEvent.detail?.reason || "Passez au forfait Pro pour débloquer cette fonctionnalité.");
      setIsOpen(true);
    };

    window.addEventListener("lshorter_plan_upgrade_requested", handleUpgradeRequest);
    return () => {
      window.removeEventListener("lshorter_plan_upgrade_requested", handleUpgradeRequest);
    };
  }, []);

  if (!isOpen) return null;

  const handleUpgrade = async (targetPlan: "PRO" | "BUSINESS") => {
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
          name: session?.user?.name || "Utilisateur",
          plan: targetPlan,
        });
      }

      if (typeof window !== "undefined") {
        localStorage.setItem("lshorter_user_plan", targetPlan);
        window.dispatchEvent(new Event("lshorter_plan_updated"));
      }

      confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      showToast.success(`Félicitations ! Vous êtes désormais sur le forfait ${targetPlan}.`);
      setIsOpen(false);
    } catch (err: any) {
      showToast.error("Impossible de mettre à niveau le forfait.");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-2xl rounded-[16px] bg-[#141416] border border-[#ff6600]/40 p-6 sm:p-8 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => setIsOpen(false)}
          className="btn-hover-scale absolute right-4 top-4 text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-[10px] bg-[#ff6600] flex items-center justify-center text-white shadow-lg shadow-[#ff6600]/40 font-bold">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-white tracking-wide">Débloquez la Puissance LShorter</h3>
              <span className="px-2 py-0.5 rounded bg-[#ff6600]/20 text-[#ff6600] text-[10px] font-bold uppercase tracking-wider border border-[#ff6600]/30">
                PRO & BUSINESS
              </span>
            </div>
            <p className="text-xs text-neutral-400 mt-0.5">
              {reason || "Profitez de la suite complète d'optimisation Edge sans aucune restriction."}
            </p>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 my-6">
          {[
            { icon: Zap, text: "Clics Edge ILLIMITÉS (Dès Pro)" },
            { icon: Globe2, text: "Routage Géo & Device (195+ Pays)" },
            { icon: Lock, text: "Protection Mot de Passe & Cloaking" },
            { icon: QrCode, text: "QR Code Studio (Dégradés & Logos)" },
            { icon: Layers, text: "Domaines ILLIMITÉS (Business)" },
            { icon: ShieldCheck, text: "Analytics & API ILLIMITÉS" },
          ].map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="flex items-center gap-2 p-2.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] text-xs text-neutral-200"
              >
                <Icon className="w-4 h-4 text-[#ff6600] shrink-0" />
                <span className="text-[11px] font-medium leading-tight">{f.text}</span>
              </div>
            );
          })}
        </div>

        {/* Plans Selection Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Plan PRO */}
          <div className="relative p-5 rounded-[14px] bg-[#1a1a1e] border-2 border-[#ff6600] flex flex-col justify-between shadow-xl shadow-[#ff6600]/10 group">
            <div className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-[#ff6600] text-white text-[10px] font-bold tracking-wide uppercase shadow-md">
              Recommandé
            </div>
            <div>
              <span className="text-sm font-bold text-white uppercase tracking-wider">Plan Pro</span>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-3xl font-black text-white">12€</span>
                <span className="text-xs text-neutral-400">/ mois</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs text-neutral-300 mt-3">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Clics Illimités</strong> sans quota</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>15</strong> domaines & API illimitée</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Routage Multi-Conditions & Analytics illimités</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade("PRO")}
              disabled={loadingPlan !== null}
              className="btn-hover-scale mt-5 w-full py-2.5 rounded-[10px] bg-[#ff6600] hover:bg-[#ff771a] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#ff6600]/30 cursor-pointer disabled:opacity-50"
            >
              {loadingPlan === "PRO" ? (
                <span>Mise à niveau...</span>
              ) : (
                <>
                  <span>Passer à Pro (12€/m)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>

          {/* Plan BUSINESS */}
          <div className="p-5 rounded-[14px] bg-[#1a1a1e] border border-[#27272a] hover:border-neutral-500 flex flex-col justify-between transition-colors">
            <div>
              <span className="text-sm font-bold text-white uppercase tracking-wider">Plan Business</span>
              <div className="flex items-baseline gap-1 my-2">
                <span className="text-3xl font-black text-white">39€</span>
                <span className="text-xs text-neutral-400">/ mois</span>
              </div>
              <ul className="flex flex-col gap-1.5 text-xs text-neutral-300 mt-3">
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Domaines Personnalisés ILLIMITÉS</strong></span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span><strong>Clics & API Illimités</strong> sans restriction</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Rétention Données Brutes, SLA 99.99% & Support 24/7</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => handleUpgrade("BUSINESS")}
              disabled={loadingPlan !== null}
              className="btn-hover-scale mt-5 w-full py-2.5 rounded-[10px] bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center justify-center gap-2 border border-white/20 cursor-pointer disabled:opacity-50"
            >
              {loadingPlan === "BUSINESS" ? (
                <span>Mise à niveau...</span>
              ) : (
                <>
                  <span>Passer à Business (39€/m)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        <p className="text-center text-[11px] text-neutral-500 mt-4">
          Sans engagement. Vous pouvez annuler ou rétrograder votre forfait à tout moment en 1 clic.
        </p>
      </div>
    </div>
  );
}
