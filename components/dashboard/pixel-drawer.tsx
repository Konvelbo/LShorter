"use client";

import React, { useState, useEffect, useRef } from "react";
import { Target, X, Loader2, Info, Lock, Sparkles, Check } from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast-provider";
import { cfCreatePixel } from "@/lib/cloudflare-api";
import { BrandColorLogo, CanonicalPixelPlatform } from "@/components/dashboard/pixel-badges";

interface PixelDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void | Promise<void>;
  userId?: string;
  plan: string;
  onUpgrade: () => void;
}

interface PlatformInfo {
  id: CanonicalPixelPlatform;
  apiPlatform:
    | "facebook"
    | "instagram"
    | "google_tag"
    | "youtube"
    | "tiktok"
    | "linkedin"
    | "pinterest"
    | "snapchat"
    | "x";
  shortName: string;
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
    shortName: "Facebook Ads",
    name: "Facebook Ads Pixel (Meta)",
    badge: "Facebook",
    color: "#0866FF",
    placeholder: "ex: 123456789012345",
    helper: "Trouvez votre identifiant à 15-16 chiffres dans le Gestionnaire d'événements Meta.",
    example: "123456789012345",
  },
  {
    id: "instagram",
    apiPlatform: "instagram",
    shortName: "Instagram Ads",
    name: "Instagram Ads Pixel",
    badge: "Instagram",
    color: "#E1306C",
    placeholder: "ex: 123456789012345",
    helper: "Utilisez votre Meta Pixel ID lié à votre compte publicitaire Instagram dans Meta Events Manager.",
    example: "123456789012345",
  },
  {
    id: "google",
    apiPlatform: "google_tag",
    shortName: "Google / GA4",
    name: "Google Analytics 4 / Google Tag",
    badge: "Google",
    color: "#EA4335",
    placeholder: "ex: G-XXXXXXXXXX ou AW-XXXXXXXXX",
    helper: "ID de mesure GA4 (G-...) ou ID de conversion Google Ads (AW-...).",
    example: "G-AB12C3D4E5",
  },
  {
    id: "youtube",
    apiPlatform: "youtube",
    shortName: "YouTube Ads",
    name: "YouTube Ads Tag (Google Ads)",
    badge: "YouTube",
    color: "#FF0000",
    placeholder: "ex: AW-123456789",
    helper: "Trouvez votre identifiant AW-... dans Google Ads > Outils > Gestionnaire d'audiences (YouTube).",
    example: "AW-987654321",
  },
  {
    id: "tiktok",
    apiPlatform: "tiktok",
    shortName: "TikTok Ads",
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
    shortName: "LinkedIn Ads",
    name: "LinkedIn Insight Tag",
    badge: "LinkedIn",
    color: "#0A66C2",
    placeholder: "ex: 1234567",
    helper: "Votre Partner ID LinkedIn à 6-8 chiffres dans LinkedIn Campaign Manager.",
    example: "8765432",
  },
  {
    id: "pinterest",
    apiPlatform: "pinterest",
    shortName: "Pinterest Ads",
    name: "Pinterest Ads Tag",
    badge: "Pinterest",
    color: "#E60023",
    placeholder: "ex: 2612345678901",
    helper: "Trouvez votre Pinterest Tag ID (13 chiffres) dans Pinterest Ads Manager > Conversions.",
    example: "2612345678901",
  },
  {
    id: "snapchat",
    apiPlatform: "snapchat",
    shortName: "Snapchat Ads",
    name: "Snapchat Ads Pixel",
    badge: "Snapchat",
    color: "#E6B800",
    placeholder: "ex: a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    helper: "Trouvez votre Snap Pixel ID (UUID) dans Snapchat Ads Manager > Events Manager.",
    example: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  },
  {
    id: "x",
    apiPlatform: "x",
    shortName: "X Ads",
    name: "X Ads Pixel (Twitter)",
    badge: "X Ads",
    color: "#0F1419",
    placeholder: "ex: o1a2b",
    helper: "Trouvez votre X Pixel ID dans X Ads Manager > Outils > Events Manager.",
    example: "o1a2b",
  },
];

const PIXEL_ID_FORMAT = /^[A-Za-z0-9_-]{2,64}$/;

function isLockedPlan(plan: string) {
  const upper = String(plan || "").toUpperCase();
  return upper === "FREE" || upper === "FREEMIUM" || upper === "STARTER";
}

function PixelDrawerForm({
  onClose,
  onCreated,
  userId,
  plan,
  onUpgrade,
}: Omit<PixelDrawerProps, "isOpen">) {
  const [platform, setPlatform] = useState<CanonicalPixelPlatform>("meta");
  const [pixelName, setPixelName] = useState("");
  const [pixelId, setPixelId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const radioRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const activePlatformInfo = PLATFORMS.find((p) => p.id === platform) || PLATFORMS[0];
  const locked = isLockedPlan(plan);

  const handleRadioKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, idx: number) => {
    const cols = typeof window !== "undefined" && window.innerWidth >= 640 ? 3 : 2;
    let nextIdx: number | null = null;

    if (e.key === "ArrowRight") nextIdx = (idx + 1) % PLATFORMS.length;
    else if (e.key === "ArrowLeft") nextIdx = (idx - 1 + PLATFORMS.length) % PLATFORMS.length;
    else if (e.key === "ArrowDown") nextIdx = (idx + cols) % PLATFORMS.length;
    else if (e.key === "ArrowUp") nextIdx = (idx - cols + PLATFORMS.length) % PLATFORMS.length;
    else if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setPlatform(PLATFORMS[idx].id);
      return;
    }

    if (nextIdx !== null) {
      e.preventDefault();
      setPlatform(PLATFORMS[nextIdx].id);
      radioRefs.current[nextIdx]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (locked) {
      onUpgrade();
      return;
    }

    const trimmedId = pixelId.trim();
    if (!trimmedId) {
      setErrorMsg("Veuillez renseigner l'identifiant du pixel.");
      return;
    }
    if (!PIXEL_ID_FORMAT.test(trimmedId)) {
      setErrorMsg("Identifiant invalide (lettres, chiffres, tirets ou underscores uniquement, 2 à 64 caractères).");
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
        pixelId: trimmedId,
        name: finalName,
        isActive: true,
      });

      showToast.success("Pixel de retargeting connecté avec succès !");
      await onCreated();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'enregistrement du pixel.";
      setErrorMsg(msg);
      showToast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
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
        {locked && (
          <div className="p-4 rounded-[8px] bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <Lock className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold text-amber-950 dark:text-amber-200">
                Fonctionnalité Pro &amp; Business
              </span>
              <p className="text-xs font-medium text-amber-900 dark:text-amber-300 leading-relaxed">
                L&apos;injection transparente de pixels publicitaires (Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat &amp; X) nécessite le forfait Pro.
              </p>
            </div>
          </div>
        )}

        {/* Compact Narrow Platform Selector Pills (Accessible radiogroup with roving tabIndex) */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span id="pixel-platform-label" className="text-xs font-bold text-zinc-950 dark:text-white shrink-0">
              Réseau publicitaire <span className="text-red-500">*</span>
            </span>
            <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
              {activePlatformInfo.name}
            </span>
          </div>

          <div
            role="radiogroup"
            aria-labelledby="pixel-platform-label"
            className="grid grid-cols-2 sm:grid-cols-3 gap-1.5"
          >
            {PLATFORMS.map((p, idx) => {
              const isSelected = platform === p.id;
              return (
                <button
                  key={p.id}
                  ref={(el) => {
                    radioRefs.current[idx] = el;
                  }}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  tabIndex={isSelected ? 0 : -1}
                  onClick={() => setPlatform(p.id)}
                  onKeyDown={(e) => handleRadioKeyDown(e, idx)}
                  className={`px-2.5 py-2 rounded-[8px] border text-left transition-all cursor-pointer flex items-center justify-between gap-1.5 select-none min-w-0 ${
                    isSelected
                      ? "bg-purple-500/10 border-purple-500/75 shadow-2xs ring-1 ring-purple-500/25"
                      : "bg-zinc-50/80 dark:bg-[#18181b]/60 border-zinc-200 dark:border-[#27272a] hover:border-zinc-400 dark:hover:border-zinc-600"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <BrandColorLogo platform={p.id} className="w-4.5 h-4.5 shrink-0" decorative />
                    <span className="text-[11.5px] font-semibold text-zinc-900 dark:text-white truncate">
                      {p.shortName}
                    </span>
                  </div>
                  {isSelected ? (
                    <div className="w-4 h-4 rounded-full bg-purple-600 text-white flex items-center justify-center shrink-0" aria-hidden="true">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </div>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-300 dark:border-zinc-600 shrink-0" aria-hidden="true" />
                  )}
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
    </>
  );
}

export function PixelDrawer({
  isOpen,
  onClose,
  onCreated,
  userId,
  plan,
  onUpgrade,
}: PixelDrawerProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const onChange = () => setIsMobile(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const drawerDirection = isMobile ? "bottom" : "right";

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && onClose()} direction={drawerDirection}>
      <DrawerContent
        direction={drawerDirection}
        widthClass="w-full sm:max-w-[620px] md:max-w-[680px]"
        className="h-auto max-h-[88vh] md:h-full md:max-h-full flex flex-col bg-white dark:bg-[#121215] border-zinc-200 dark:border-[#27272a] rounded-[10px] shadow-2xl overflow-hidden"
      >
        {isOpen && (
          <PixelDrawerForm
            onClose={onClose}
            onCreated={onCreated}
            userId={userId}
            plan={plan}
            onUpgrade={onUpgrade}
          />
        )}
      </DrawerContent>
    </Drawer>
  );
}
