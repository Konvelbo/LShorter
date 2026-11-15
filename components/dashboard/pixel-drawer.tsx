"use client";

import React, { useState, useEffect } from "react";
import { Target, X, Loader2, Info, Lock, Sparkles, Check } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast-provider";
import { cfCreatePixel } from "@/lib/cloudflare-api";
import { BrandColorLogo } from "@/components/dashboard/pixel-badges";

interface PixelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  userId?: string;
  plan: string;
  onUpgrade: () => void;
}

type PixelPlatformKey = "meta" | "google" | "tiktok" | "linkedin";

interface PlatformInfo {
  id: PixelPlatformKey;
  apiPlatform: "facebook" | "google_tag" | "tiktok" | "linkedin";
  name: string;
  badge: string;
  color: string;
  placeholder: string;
  helper: string;
  example: string;
}

const PLATFORMS: PlatformInfo[] = [
  {
    id: "meta",
    apiPlatform: "facebook",
    name: "Meta Facebook Pixel",
    badge: "Meta",
    color: "#0081FB",
    placeholder: "ex: 123456789012345",
    helper: "Trouvez votre identifiant à 15-16 chiffres dans le Gestionnaire d'événements Meta.",
    example: "123456789012345",
  },
  {
    id: "google",
    apiPlatform: "google_tag",
    name: "Google Analytics 4 / Google Tag",
    badge: "Google",
    color: "#EA4335",
    placeholder: "ex: G-XXXXXXXXXX ou AW-XXXXXXXXX",
    helper: "ID de mesure GA4 (G-...) ou ID de conversion Google Ads (AW-...).",
    example: "G-AB12C3D4E5",
  },
  {
    id: "tiktok",
    apiPlatform: "tiktok",
    name: "TikTok Ads Pixel",
    badge: "TikTok",
    color: "#FE2C55",
    placeholder: "ex: C1234567890ABCDEF",
    helper: "Trouvez l'ID dans TikTok Ads Manager > Assets > Events.",
    example: "C7F8H9K2L3M4N5P6",
  },
  {
    id: "linkedin",
    apiPlatform: "linkedin",
    name: "LinkedIn Insight Tag",
    badge: "LinkedIn",
    color: "#0A66C2",
    placeholder: "ex: 1234567",
    helper: "Votre Partner ID LinkedIn à 6-8 chiffres dans LinkedIn Campaign Manager.",
    example: "8765432",
  },
];

export function PixelDrawer({
  isOpen,
  onClose,
  onCreated,
  userId,
  plan,
  onUpgrade,
}: PixelDrawerProps) {
  const [platform, setPlatform] = useState<PixelPlatformKey>("meta");
  const [pixelName, setPixelName] = useState("");
  const [pixelId, setPixelId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPlatform("meta");
      setPixelName("");
      setPixelId("");
      setErrorMsg(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const activePlatformInfo = PLATFORMS.find((p) => p.id === platform) || PLATFORMS[0];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (plan === "FREEMIUM" || plan === "STARTER") {
      onUpgrade();
      return;
    }

    if (!pixelId.trim()) {
      setErrorMsg("Veuillez renseigner l'identifiant du pixel.");
      return;
    }

    if (!userId) {
      setErrorMsg("Session invalide. Veuillez rafraîchir la page.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const finalName = pixelName.trim() || activePlatformInfo.name;

      await cfCreatePixel({
        userId,
        platform: activePlatformInfo.apiPlatform,
        pixelId: pixelId.trim(),
        name: finalName,
        isActive: true,
      });

      showToast.success("Pixel de retargeting connecté avec succès !");
      await onCreated();
      onClose();
    } catch (err: any) {
      const msg = err.message || "Erreur lors de l'enregistrement du pixel.";
      setErrorMsg(msg);
      showToast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const drawerDirection = isMobile ? "bottom" : "right";

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction={drawerDirection}>
      <DrawerContent
        direction={drawerDirection}
        widthClass="w-full sm:max-w-[620px] md:max-w-[680px]"
        className="h-auto max-h-[88vh] md:h-full md:max-h-full flex flex-col bg-white dark:bg-[#121215] border-zinc-200 dark:border-[#27272a] rounded-[10px] shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-100 dark:border-[#202024] shrink-0 bg-white dark:bg-[#121215]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-600 dark:text-purple-400 shrink-0">
              <Target className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                Nouveau Pixel de Retargeting
              </h3>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 mt-0.5">
                Associez vos audiences publicitaires à vos redirections courtes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            disabled={isSubmitting}
            className="p-1.5 rounded-[8px] text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1f1f23] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-5 text-xs">
          {errorMsg && (
            <div className="px-4 py-3 rounded-[8px] bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-400 text-xs font-semibold animate-in fade-in">
              {errorMsg}
            </div>
          )}

          {/* Freemium Lock Banner */}
          {(plan === "FREEMIUM" || plan === "STARTER") && (
            <div className="p-4 rounded-[8px] bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
              <Lock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="flex flex-col gap-1">
                <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                  Fonctionnalité Pro &amp; Business
                </span>
                <p className="text-xs font-medium text-amber-900 dark:text-amber-300 leading-relaxed">
                  L&apos;injection transparente de pixels Meta, Google, TikTok et LinkedIn nécessite le forfait Pro.
                </p>
              </div>
            </div>
          )}

          {/* Platform Selector Cards (Accessible radiogroup) */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-zinc-950 dark:text-white">
              Réseau publicitaire <span className="text-red-500">*</span>
            </label>

            <div role="radiogroup" aria-label="Réseau publicitaire" className="grid grid-cols-2 gap-2.5">
              {PLATFORMS.map((p) => {
                const isSelected = platform === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setPlatform(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        setPlatform(p.id);
                      }
                    }}
                    className={`p-3.5 rounded-[10px] border text-left transition-all cursor-pointer flex flex-col gap-2.5 select-none ${
                      isSelected
                        ? "bg-purple-500/10 border-purple-500/70 shadow-xs ring-1 ring-purple-500/30"
                        : "bg-zinc-50/80 dark:bg-[#18181b]/60 border-zinc-200 dark:border-[#27272a] hover:border-zinc-400 dark:hover:border-zinc-600"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-[8px] bg-white dark:bg-[#151518] border border-zinc-200/90 dark:border-zinc-700/80 shadow-2xs flex items-center justify-center shrink-0 p-1">
                          <BrandColorLogo platform={p.id} className="w-5 h-5" />
                        </div>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                          style={{ backgroundColor: p.color }}
                        >
                          {p.badge}
                        </span>
                      </div>
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-zinc-300 dark:border-zinc-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-xs font-bold text-zinc-950 dark:text-white truncate">
                      {p.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Pixel Name Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="pixel-name-input" className="text-xs font-bold text-zinc-950 dark:text-white">
              Libellé du Tag / Campagne
            </label>
            <Input
              id="pixel-name-input"
              placeholder={`ex: Pixel Principal (${activePlatformInfo.badge})`}
              value={pixelName}
              onChange={(e) => setPixelName(e.target.value)}
              disabled={isSubmitting}
              className="h-10 rounded-[8px] bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-xs font-medium text-zinc-950 dark:text-white"
            />
            <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              Nom interne pour distinguer vos différents pixels dans le tableau de bord.
            </span>
          </div>

          {/* Pixel ID Field */}
          <div className="flex flex-col gap-2">
            <label htmlFor="pixel-id-input" className="text-xs font-bold text-zinc-950 dark:text-white">
              Identifiant du Pixel (Pixel ID) <span className="text-red-500">*</span>
            </label>
            <Input
              id="pixel-id-input"
              required
              placeholder={activePlatformInfo.placeholder}
              value={pixelId}
              onChange={(e) => setPixelId(e.target.value)}
              disabled={isSubmitting}
              className="h-10 rounded-[8px] bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-xs font-mono font-bold text-zinc-950 dark:text-white"
            />
            <div className="flex items-start gap-2 mt-0.5 text-zinc-700 dark:text-zinc-300 text-xs font-medium leading-relaxed">
              <Info className="w-3.5 h-3.5 text-brand shrink-0 mt-0.5" />
              <span>{activePlatformInfo.helper}</span>
            </div>
          </div>

          {/* Explanation Box */}
          <div className="p-4 rounded-[8px] bg-zinc-50 dark:bg-[#161619] border border-zinc-200/90 dark:border-[#222226] flex items-start gap-3">
            <Sparkles className="w-4.5 h-4.5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
            <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed">
              Une fois ce pixel enregistré, vous pourrez l&apos;activer en 1 clic dans le drawer de création de liens pour recibler automatiquement tous les visiteurs qui cliquent sur vos liens courts.
            </p>
          </div>

          {/* Footer Submit Button */}
          <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-[#202024] flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-9 px-4 text-xs font-bold border-zinc-300 dark:border-[#27272a] text-zinc-800 dark:text-zinc-200 hover:text-zinc-950 dark:hover:text-white cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="glow"
              disabled={isSubmitting || !pixelId.trim()}
              className="h-9 px-5 text-xs font-bold gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <Target className="w-3.5 h-3.5" />
                  <span>Connecter le Pixel</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DrawerContent>
    </Drawer>
  );
}
