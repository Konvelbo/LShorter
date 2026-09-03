"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  User,
  Target,
  Share2,
  Compass,
  Building2,
  Code2,
  ShoppingBag,
  Video,
  Megaphone,
  Search,
  Users,
  Globe,
  Sliders,
  ShieldCheck,
  QrCode,
  Zap,
  BarChart3
} from "lucide-react";
import confetti from "canvas-confetti";
import { useSession } from "next-auth/react";
import { showToast } from "@/components/ui/toast-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// Custom Brand SVGs
const TwitterIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-4 h-4"} viewBox="0 0 24 24" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const YoutubeIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-4 h-4"} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
  </svg>
);

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className || "w-4 h-4"} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.45 1.45 0 0 0 1.45-1.45 1.45 1.45 0 0 0-1.45-1.45 1.46 1.46 0 0 0-1.46 1.45c0 .8.65 1.45 1.46 1.45m1.39 9.74v-8.37H5.07v8.37z" />
  </svg>
);
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface OnboardingData {
  role: string;
  goal: string;
  source: string;
  workspaceName: string;
  monthlyClicksEstimate: string;
}

export function OnboardingWizard() {
  const router = useRouter();
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const userName = session?.user?.name || "Mon";

  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const completeOnboardingMutation = useMutation(api.users.completeOnboarding);

  const [formData, setFormData] = useState<OnboardingData>({
    role: "creator",
    goal: "routing",
    source: "google",
    workspaceName: `${userName} Workspace`,
    monthlyClicksEstimate: "10k-100k",
  });

  const totalSteps = 4;
  const progressPercent = Math.round((currentStep / totalSteps) * 100);

  // Step 1 Options: Qui êtes-vous ?
  const roles = [
    {
      id: "creator",
      title: "Créateur de contenu / Influenceur",
      desc: "YouTube, TikTok, Instagram, Podcasts, Bio links",
      icon: Video,
    },
    {
      id: "marketer",
      title: "Marketeur / Média-buyer",
      desc: "Affiliation, Meta Ads, Google Ads, Acquisition",
      icon: Megaphone,
    },
    {
      id: "ecommerce",
      title: "E-commerçant / Boutique en ligne",
      desc: "Shopify, Amazon, WooCommerce, Ventes directes",
      icon: ShoppingBag,
    },
    {
      id: "developer",
      title: "Développeur / CTO / Produit",
      desc: "Intégration API REST, Webhooks, SaaS, Automatisation",
      icon: Code2,
    },
    {
      id: "agency",
      title: "Entreprise / Agence Marketing",
      desc: "Gestion multi-marques, domaines personnalisés, clients",
      icon: Building2,
    },
    {
      id: "other",
      title: "Autre / Projet personnel",
      desc: "Usage polyvalent ou exploration de la plateforme",
      icon: User,
    },
  ];

  // Step 2 Options: Objectif principal
  const goals = [
    {
      id: "routing",
      title: "Smart Routing Géo & Appareils",
      desc: "Rediriger les visiteurs selon leur pays, OS et type d'appareil",
      icon: Target,
    },
    {
      id: "cloaking",
      title: "Cloaking & Protection des liens",
      desc: "Masquer les URLs cibles et protéger les accès par mot de passe",
      icon: ShieldCheck,
    },
    {
      id: "qr",
      title: "QR Codes personnalisés & Studio",
      desc: "Créer des QR codes dynamiques avec logo, cadres et exports SVG",
      icon: QrCode,
    },
    {
      id: "api",
      title: "API REST & Intégration Edge",
      desc: "Automatiser la création de liens avec une latence < 15ms",
      icon: Zap,
    },
    {
      id: "analytics",
      title: "Analytics & Tracking de conversions",
      desc: "Globe 3D interactif, retargeting pixels et suivi du ROI",
      icon: BarChart3,
    },
  ];

  // Step 3 Options: D'où venez-vous ?
  const sources = [
    { id: "google", title: "Recherche Google / Moteur de recherche", icon: Search },
    { id: "twitter", title: "Twitter / X", icon: TwitterIcon },
    { id: "youtube", title: "YouTube / Vidéo tutoriel", icon: YoutubeIcon },
    { id: "linkedin", title: "LinkedIn / Réseau Pro", icon: LinkedinIcon },
    { id: "recommendation", title: "Recommandation d'un ami ou collègue", icon: Users },
    { id: "other", title: "Autre plateforme ou média", icon: Globe },
  ];

  // Step 4 Options: Volume de clics
  const volumes = [
    { id: "under-10k", label: "< 10 000 clics / mois", desc: "Idéal pour débuter et tester vos premiers liens" },
    { id: "10k-100k", label: "10 000 - 100 000 clics / mois", desc: "Créateurs réguliers, blogs et petites boutiques" },
    { id: "100k-1m", label: "100 000 - 1 000 000 clics / mois", desc: "Agences, campagnes médias et scale-ups" },
    { id: "over-1m", label: "> 1 000 000 clics / mois", desc: "Grands comptes et infrastructure haute fréquence" },
  ];

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    } else {
      handleComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);

    try {
      if (userId) {
        await completeOnboardingMutation({
          userId,
          role: formData.role,
          goal: formData.goal,
          source: formData.source,
          workspaceName: formData.workspaceName,
          monthlyClicksEstimate: formData.monthlyClicksEstimate,
        });
      }

      confetti({
        particleCount: 90,
        spread: 80,
        origin: { y: 0.5 },
      });

      showToast.success("Votre espace de travail est prêt !");

      setTimeout(() => {
        router.push("/dashboard");
      }, 600);
    } catch (error) {
      console.error("Onboarding error:", error);
      showToast.error("Une erreur est survenue lors de l'enregistrement.");
      setIsSubmitting(false);
    }
  };

  const handleSkip = async () => {
    try {
      if (userId) {
        await completeOnboardingMutation({
          userId,
          role: "creator",
          goal: "routing",
          source: "direct",
          workspaceName: `${userName} Workspace`,
          monthlyClicksEstimate: "10k-100k",
        });
      }
    } catch (e) {
      // ignore
    }
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
      {/* Subtle background ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-[#ff6600]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-[10px] bg-[#ff6600] flex items-center justify-center font-bebas text-xl text-white font-bold tracking-wider shadow-lg shadow-[#ff6600]/30">
            QL
          </div>
          <span className="font-bebas text-2xl text-white tracking-wider">
            L<span className="text-[#ff6600]">SHORTER</span>
          </span>
        </div>

        <button
          onClick={handleSkip}
          className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer px-3 py-1.5 rounded-[8px] hover:bg-white/5"
        >
          Passer pour le moment →
        </button>
      </div>

      {/* Main Wizard Card */}
      <div className="max-w-3xl w-full mx-auto my-8 bg-[#0d0d10] border border-[#222225] rounded-[18px] p-6 sm:p-10 shadow-2xl z-10 flex flex-col justify-between">
        {/* Progress Bar & Step Badge */}
        <div className="flex flex-col gap-3 mb-8">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#ff6600] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Étape {currentStep} sur {totalSteps}
            </span>
            <span className="text-neutral-400 font-mono">{progressPercent}%</span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-[#222225] overflow-hidden">
            <div
              className="h-full bg-[#ff6600] rounded-full transition-all duration-400 ease-out"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div className="flex-1 flex flex-col">
          {/* STEP 1: Qui êtes-vous ? */}
          {currentStep === 1 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div>
                <h2 className="font-bebas text-3xl sm:text-4xl text-white tracking-wide">
                  QUI ÊTES-VOUS ? 👋
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Sélectionnez le profil qui correspond le mieux à votre activité pour personnaliser vos outils.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {roles.map((item) => {
                  const Icon = item.icon;
                  const isSelected = formData.role === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setFormData({ ...formData, role: item.id })}
                      className={`p-4 rounded-[12px] border transition-all cursor-pointer flex items-start gap-3.5 ${
                        isSelected
                          ? "bg-[#ff6600]/10 border-[#ff6600] shadow-md shadow-[#ff6600]/10"
                          : "bg-[#141416] border-[#222225] hover:border-[#ff6600]/40 hover:bg-white/[0.02]"
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-[#ff6600] text-white"
                            : "bg-white/5 text-neutral-400 border border-[#27272a]"
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                            {item.title}
                          </h3>
                          {isSelected && <Check className="w-4 h-4 text-[#ff6600]" />}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-0.5 leading-relaxed">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Objectif principal */}
          {currentStep === 2 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div>
                <h2 className="font-bebas text-3xl sm:text-4xl text-white tracking-wide">
                  VOTRE OBJECTIF PRINCIPAL 🎯
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Quelle fonctionnalité souhaitez-vous exploiter en priorité sur LShorter ?
                </p>
              </div>

              <div className="flex flex-col gap-3">
                {goals.map((item) => {
                  const Icon = item.icon;
                  const isSelected = formData.goal === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setFormData({ ...formData, goal: item.id })}
                      className={`p-4 rounded-[12px] border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                        isSelected
                          ? "bg-[#ff6600]/10 border-[#ff6600] shadow-md shadow-[#ff6600]/10"
                          : "bg-[#141416] border-[#222225] hover:border-[#ff6600]/40 hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-[#ff6600] text-white"
                              : "bg-white/5 text-neutral-400 border border-[#27272a]"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-xs sm:text-sm font-bold text-white">
                            {item.title}
                          </h3>
                          <p className="text-[11px] text-neutral-400 mt-0.5">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#ff6600] flex items-center justify-center text-white shrink-0">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: D'où venez-vous ? */}
          {currentStep === 3 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div>
                <h2 className="font-bebas text-3xl sm:text-4xl text-white tracking-wide">
                  COMMENT NOUS AVEZ-VOUS CONNU ? 🌐
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Cela nous aide à concentrer nos efforts sur les canaux les plus utiles pour la communauté.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {sources.map((item) => {
                  const Icon = item.icon;
                  const isSelected = formData.source === item.id;
                  return (
                    <div
                      key={item.id}
                      onClick={() => setFormData({ ...formData, source: item.id })}
                      className={`p-4 rounded-[12px] border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? "bg-[#ff6600]/10 border-[#ff6600] shadow-md shadow-[#ff6600]/10"
                          : "bg-[#141416] border-[#222225] hover:border-[#ff6600]/40 hover:bg-white/[0.02]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-[8px] flex items-center justify-center shrink-0 ${
                            isSelected
                              ? "bg-[#ff6600] text-white"
                              : "bg-white/5 text-neutral-400"
                          }`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-xs sm:text-sm font-semibold text-white">
                          {item.title}
                        </span>
                      </div>

                      {isSelected && <Check className="w-4 h-4 text-[#ff6600]" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Workspace & Volume */}
          {currentStep === 4 && (
            <div className="flex flex-col gap-6 animate-in fade-in duration-300">
              <div>
                <h2 className="font-bebas text-3xl sm:text-4xl text-white tracking-wide">
                  FINALISATION DE VOTRE ESPACE 🚀
                </h2>
                <p className="text-xs sm:text-sm text-neutral-400 mt-1">
                  Configurez le nom de votre espace et estimez votre volume mensuel.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Nom de votre Workspace / Projet
                  </label>
                  <Input
                    value={formData.workspaceName}
                    onChange={(e) => setFormData({ ...formData, workspaceName: e.target.value })}
                    placeholder="Ex: Mon Agence, Studio 2026, Growth Lab"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-2">
                    Volume mensuel de clics estimé
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {volumes.map((vol) => {
                      const isSelected = formData.monthlyClicksEstimate === vol.id;
                      return (
                        <div
                          key={vol.id}
                          onClick={() => setFormData({ ...formData, monthlyClicksEstimate: vol.id })}
                          className={`p-3.5 rounded-[10px] border transition-all cursor-pointer ${
                            isSelected
                              ? "bg-[#ff6600]/10 border-[#ff6600]"
                              : "bg-[#141416] border-[#222225] hover:border-[#ff6600]/40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-white">{vol.label}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-[#ff6600]" />}
                          </div>
                          <p className="text-[10px] text-neutral-400 mt-0.5">{vol.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions Bar */}
        <div className="pt-8 border-t border-[#222225] mt-8 flex items-center justify-between gap-4">
          {currentStep > 1 ? (
            <Button
              type="button"
              onClick={handleBack}
              variant="outline"
              className="gap-2 text-xs cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Précédent</span>
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            onClick={handleNext}
            variant="glow"
            disabled={isSubmitting}
            className="gap-2 text-sm font-semibold tracking-wide font-bebas px-6 h-11 cursor-pointer"
          >
            <span>{currentStep === totalSteps ? "ACCÉDER AU DASHBOARD" : "CONTINUER"}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Footer Info */}
      <div className="text-center text-[11px] text-neutral-500 z-10">
        Infrastructure Edge Cloudflare &amp; Convex Database • 100% Sécurisé
      </div>
    </div>
  );
}
