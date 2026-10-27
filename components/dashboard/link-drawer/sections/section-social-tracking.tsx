"use client";

import React, { useState } from "react";
import {
  Sparkles,
  LayoutGrid,
  Upload,
  Image as ImageIcon,
  Trash2,
  Share2,
  Tag,
  Target,
  Check,
  Plus,
  Pencil,
  X,
  Info,
  Globe2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cfNormalizeImageUrl } from "@/lib/cloudflare-api";
import { PixelBrandLogo, normalizePixelPlatform } from "@/components/dashboard/pixel-badges";
import { PixelSelectorModal } from "@/components/dashboard/pixel-selector-modal";
import { Input } from "@/components/ui/input";

interface SectionSocialTrackingProps {
  slug?: string;
  // Social Preview props
  ogTitle: string;
  setOgTitle: (title: string) => void;
  ogDescription: string;
  setOgDescription: (desc: string) => void;
  ogImage: string;
  setOgImage: (img: string) => void;
  previewImage: string;
  setPreviewImage: (img: string) => void;
  domainName: string;
  socialPlatformPreview: "x" | "facebook" | "whatsapp" | "linkedin";
  setSocialPlatformPreview: (p: "x" | "facebook" | "whatsapp" | "linkedin") => void;
  twitterCard: "summary_large_image" | "summary";
  setTwitterCard: (card: "summary_large_image" | "summary") => void;
  bannerInputRef: React.RefObject<HTMLInputElement | null>;
  handleBannerUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isUploadingImage?: boolean;
  // UTM Tracking props
  utmSource: string;
  setUtmSource: (v: string) => void;
  utmMedium: string;
  setUtmMedium: (v: string) => void;
  utmCampaign: string;
  setUtmCampaign: (v: string) => void;
  utmTerm: string;
  setUtmTerm: (v: string) => void;
  utmContent: string;
  setUtmContent: (v: string) => void;
  targetUrl: string;
  computeFinalUrlWithUtm: () => string;
  // Retargeting Pixels props
  selectedPixels?: any[];
  setSelectedPixels?: React.Dispatch<React.SetStateAction<any[]>> | ((pixels: any[]) => void);
  availablePixels?: any[];
  isProPlan?: boolean;
}

export function SectionSocialTracking({
  ogTitle,
  setOgTitle,
  ogDescription,
  setOgDescription,
  ogImage,
  setOgImage,
  previewImage,
  setPreviewImage,
  domainName,
  socialPlatformPreview,
  setSocialPlatformPreview,
  twitterCard,
  setTwitterCard,
  bannerInputRef,
  handleBannerUpload,
  isUploadingImage,
  utmSource,
  setUtmSource,
  utmMedium,
  setUtmMedium,
  utmCampaign,
  setUtmCampaign,
  utmTerm,
  setUtmTerm,
  utmContent,
  setUtmContent,
  targetUrl,
  computeFinalUrlWithUtm,
  selectedPixels = [],
  setSelectedPixels,
  availablePixels = [],
  isProPlan = true,
  slug = "",
}: SectionSocialTrackingProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const activeImage = previewImage || cfNormalizeImageUrl(ogImage);
  const hasCustomImage = Boolean(activeImage && (!hasImageError || previewImage));
  const [isDragging, setIsDragging] = useState(false);
  const [isPixelModalOpen, setIsPixelModalOpen] = useState(false);

  const getPixelInfo = (p: any) => {
    if (typeof p === "object" && p !== null) {
      return {
        id: p.id || p.pixelId,
        name: p.name || p.id,
        platform: p.platform || normalizePixelPlatform(p.id),
        pixelId: p.pixelId || p.id,
      };
    }
    const found = (availablePixels || []).find(
      (ap: any) => ap.id === p || ap.pixelId === p || ap.platform === p
    );
    if (found) {
      return {
        id: found.id || found.pixelId,
        name: found.name,
        platform: found.platform,
        pixelId: found.pixelId || found.id,
      };
    }
    const normPlatform = normalizePixelPlatform(p);
    const platformName =
      normPlatform === "meta"
        ? "Meta Pixel"
        : normPlatform === "google"
        ? "Google Analytics (GA4)"
        : normPlatform === "tiktok"
        ? "TikTok Ads"
        : "LinkedIn Tag";
    return {
      id: p,
      name: platformName,
      platform: normPlatform,
      pixelId: p,
    };
  };

  const handleRemovePixel = (pixelKey: string) => {
    if (!setSelectedPixels) return;
    setSelectedPixels(
      selectedPixels.filter((item: any) => {
        const id = typeof item === "string" ? item : item.id || item.pixelId;
        return id !== pixelKey;
      })
    );
  };

  React.useEffect(() => {
    setHasImageError(false);
  }, [previewImage, ogImage]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const fakeEvent = {
        target: { files: e.dataTransfer.files },
      } as unknown as React.ChangeEvent<HTMLInputElement>;
      handleBannerUpload(fakeEvent);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={bannerInputRef}
        accept="image/png, image/jpeg, image/webp"
        onChange={handleBannerUpload}
        className="hidden"
      />

      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#131417] dark:text-[#f1f2f4]">
          Social media, tracking & pixel
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Configure campaign UTM parameters, retargeting pixels and customize your social share preview cards.
        </p>
      </div>

      {/* ── GROUP 1: TRAFFIC (UTM BUILDER) ON TOP ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-[#22242a]">
          <Tag className="w-4 h-4 text-[#1d5fe0] dark:text-[#3b82f6]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-[#8a8f9a]">
            Campaign &amp; UTM Tracking
          </h3>
        </div>

        <p className="text-xs text-zinc-600 dark:text-[#8a8f9a] -mt-1">
          Tag the destination URL to track clicks and conversions in Google Analytics, Mixpanel, or Meta Ads.
        </p>

        {/* 2-Column UTM Inputs with shadcn Input component */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              UTM Source
            </label>
            <Input
              type="text"
              placeholder="google, newsletter, twitter"
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              UTM Medium
            </label>
            <Input
              type="text"
              placeholder="cpc, banner, email"
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              UTM Campaign
            </label>
            <Input
              type="text"
              placeholder="spring_sale, launch_2026"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              UTM Term
            </label>
            <Input
              type="text"
              placeholder="shortener, keywords"
              value={utmTerm}
              onChange={(e) => setUtmTerm(e.target.value)}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* UTM Content (Full Width) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            UTM Content (Optional)
          </label>
          <Input
            type="text"
            placeholder="logolink, header_cta, variant_b"
            value={utmContent}
            onChange={(e) => setUtmContent(e.target.value)}
            className="h-9 text-xs"
          />
        </div>

        {/* Live Computed Destination URL */}
        {(utmSource || utmMedium || utmCampaign || utmTerm || utmContent) && (
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a] text-xs font-mono break-all text-zinc-900 dark:text-[#f1f2f4]">
            <span className="text-zinc-500 dark:text-[#8a8f9a] font-sans block text-[11px] mb-1 font-medium">
              Tagged Target URL:
            </span>
            <span className="text-[#0066FF] dark:text-[#3b82f6] font-semibold">
              {computeFinalUrlWithUtm() || targetUrl}
            </span>
          </div>
        )}
      </div>

      {/* ── GROUP 1B: RETARGETING PIXELS (Flat, Clean, Minimalist - SANS CARD) ── */}
      <div className="flex flex-col gap-2.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#0066FF]" />
            <span>Pixels de Retargeting</span>
          </label>
          {selectedPixels.length > 0 && (
            <span className="text-[11px] font-medium text-[#0066FF]">
              {selectedPixels.length} associé{selectedPixels.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {selectedPixels.length === 0 ? (
          /* Clean Sober Empty Trigger */
          <button
            type="button"
            onClick={() => setIsPixelModalOpen(true)}
            className="w-full py-2.5 px-3 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#0066FF] dark:hover:border-[#0066FF] bg-zinc-50/50 dark:bg-white/[0.02] hover:bg-[#0066FF]/5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-[#0066FF] dark:hover:text-[#5294FF] flex items-center justify-center gap-2 transition-all cursor-pointer font-medium select-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Sélectionner ou associer un pixel de retargeting</span>
          </button>
        ) : (
          /* Selected Badges + Edit Link (No Card Container) */
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {selectedPixels.map((p: any, idx: number) => {
                const info = getPixelInfo(p);
                return (
                  <div
                    key={info.id || idx}
                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-800 dark:text-zinc-200 shadow-2xs"
                  >
                    <PixelBrandLogo platform={info.platform} className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold text-xs">{info.name}</span>
                    <span className="font-mono text-[10.5px] text-zinc-500 dark:text-zinc-400">
                      {info.pixelId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePixel(info.id)}
                      className="p-0.5 rounded text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer ml-0.5"
                      title="Désassocier ce pixel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => setIsPixelModalOpen(true)}
              className="self-start text-xs font-semibold text-[#0066FF] dark:text-[#5294FF] hover:underline inline-flex items-center gap-1.5 pt-0.5 cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
              <span>Modifier la sélection des pixels</span>
            </button>
          </div>
        )}

        {/* Pixel Selector Modal */}
        <PixelSelectorModal
          isOpen={isPixelModalOpen}
          onClose={() => setIsPixelModalOpen(false)}
          selectedPixelIds={selectedPixels}
          onSave={(newPixels) => {
            if (setSelectedPixels) setSelectedPixels(newPixels);
          }}
          availablePixels={availablePixels}
        />
      </div>

      {/* ── GROUP 2: SHARING (SOCIAL PREVIEW) ON BOTTOM ── */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center gap-2 pb-1 border-b border-zinc-200 dark:border-[#22242a]">
          <Share2 className="w-4 h-4 text-[#1d5fe0] dark:text-[#3b82f6]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-[#8a8f9a]">
            Sharing &amp; Social Preview
          </h3>
        </div>

        {/* Title & Description Inputs */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Social Card Title
              </label>
              <span className="text-xs text-zinc-500 dark:text-[#8a8f9a] font-mono">
                {ogTitle.length}/70
              </span>
            </div>
            <Input
              type="text"
              maxLength={70}
              placeholder="Catchy social title..."
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              className="h-9 text-xs"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                Social Card Description
              </label>
              <span className="text-xs text-zinc-500 dark:text-[#8a8f9a] font-mono">
                {ogDescription.length}/160
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={160}
              placeholder="Short description displayed when shared on social networks..."
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#0066FF] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#0066FF] dark:focus:ring-[#3b82f6] rounded-lg px-3 py-2 text-xs outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal resize-vertical min-h-[60px]"
            />
          </div>
        </div>

        {/* Social Network Switcher Tabs */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Aperçu sur les réseaux sociaux
          </label>
          <div className="grid grid-cols-4 gap-1 p-1 rounded-lg bg-zinc-100 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a]">
            {(
              [
                { id: "x", label: "Twitter / X" },
                { id: "facebook", label: "Facebook" },
                { id: "linkedin", label: "LinkedIn" },
                { id: "whatsapp", label: "WhatsApp" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSocialPlatformPreview(p.id)}
                className={cn(
                  "py-1.5 px-2 rounded-md text-[11px] font-medium transition-all text-center cursor-pointer",
                  socialPlatformPreview === p.id
                    ? "bg-white dark:bg-[#0e0f12] text-zinc-900 dark:text-[#f1f2f4] shadow-sm border border-[#0066FF] dark:border-[#3b82f6] font-semibold"
                    : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Banner Format */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            Format de la carte Twitter / X & Réseaux
          </label>
          <div className="flex gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a]">
            <button
              type="button"
              onClick={() => {
                setTwitterCard("summary_large_image");
              }}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all text-center cursor-pointer flex items-center justify-center gap-1.5",
                twitterCard === "summary_large_image"
                  ? "bg-white dark:bg-[#0e0f12] text-zinc-900 dark:text-[#f1f2f4] shadow-sm border border-[#0066FF] dark:border-[#3b82f6] font-semibold"
                  : "text-zinc-600 dark:text-[#8a8f9a] hover:text-zinc-900 dark:hover:text-[#f1f2f4]",
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#3b82f6]" />
              <span>Bannière large (1200×630)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTwitterCard("summary");
                if (ogImage && ogImage.includes("/api/og")) {
                  setOgImage("");
                  setPreviewImage("");
                }
              }}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all text-center cursor-pointer flex items-center justify-center gap-1.5",
                twitterCard === "summary"
                  ? "bg-white dark:bg-[#0e0f12] text-zinc-900 dark:text-[#f1f2f4] shadow-sm border border-[#0066FF] dark:border-[#3b82f6] font-semibold"
                  : "text-zinc-600 dark:text-[#8a8f9a] hover:text-zinc-900 dark:hover:text-[#f1f2f4]",
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bannière compacte</span>
            </button>
          </div>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed flex items-start gap-1.5 mt-0.5">
            <Info className="w-3.5 h-3.5 shrink-0 text-zinc-400 dark:text-zinc-500 mt-0.5" />
            <span>
              Note : Les réseaux sociaux mettent en cache de manière définitive le format et les dimensions de la bannière dès le premier partage du lien. La modification de forme (large ou compacte) ne pourra plus être répercutée ultérieurement sur les plateformes.
            </span>
          </p>
        </div>

        {/* Live Card Mockup with Integrated Direct Banner Upload & Change */}
        <div className="border border-zinc-200 dark:border-[#22242a] rounded-xl overflow-hidden bg-white dark:bg-[#0e0f12] text-left shadow-sm transition-all">
          {socialPlatformPreview === "whatsapp" ? (
            /* WhatsApp Message Bubble Style */
            <div className="p-3 bg-[#EFEAE2] dark:bg-[#0b141a]">
              <div className="max-w-[280px] rounded-lg bg-white dark:bg-[#1f2c34] p-2 shadow-sm border border-zinc-200/60 dark:border-transparent flex flex-col gap-1.5">
                {/* Clickable Image Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => bannerInputRef.current?.click()}
                  className={cn(
                    "relative w-full rounded overflow-hidden cursor-pointer bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center transition-all",
                    twitterCard === "summary" ? "h-24 sm:h-28" : "h-32 sm:h-36"
                  )}
                >
                  {hasCustomImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImage}
                        alt="WhatsApp preview"
                        className="w-full h-full object-cover"
                        onError={() => setHasImageError(true)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="p-1 rounded bg-white text-zinc-900 text-xs">
                          <Upload className="w-3.5 h-3.5 text-blue-600" />
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-2 text-center text-xs text-zinc-400">
                      <Upload className="w-4 h-4 mx-auto mb-1 text-zinc-400" />
                      <span>Ajouter une image</span>
                    </div>
                  )}
                </div>
                <div className="px-1">
                  <span className="text-xs font-bold text-zinc-900 dark:text-[#e9edef] block truncate">
                    {ogTitle || "Titre WhatsApp"}
                  </span>
                  <span className="text-[11px] text-zinc-600 dark:text-[#8696a0] line-clamp-2 leading-snug">
                    {ogDescription || "Aperçu de la description partagée sur WhatsApp."}
                  </span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono block mt-1">
                    https://{domainName || "lsho.cc"}/{slug || "..."}
                  </span>
                </div>
              </div>
            </div>
          ) : socialPlatformPreview === "facebook" ? (
            /* Facebook Feed Post Card Style */
            twitterCard === "summary" ? (
              /* Compact Facebook Card (Horizontal split) */
              <div className="flex bg-[#F0F2F5] dark:bg-[#18191a] border border-zinc-200 dark:border-[#22242a] overflow-hidden">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => bannerInputRef.current?.click()}
                  className="relative w-28 sm:w-32 h-28 sm:h-32 shrink-0 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center cursor-pointer group border-r border-zinc-200 dark:border-[#22242a]"
                >
                  {hasCustomImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImage}
                        alt="Facebook compact preview"
                        className="w-full h-full object-cover"
                        onError={() => setHasImageError(true)}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-3.5 h-3.5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="p-2 text-center text-xs text-zinc-400">
                      <Upload className="w-4 h-4 mx-auto mb-1 text-zinc-400" />
                      <span className="text-[10px]">Image</span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col justify-center min-w-0 flex-1">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                    {(domainName || "lsho.cc").toUpperCase()}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white block truncate mt-0.5">
                    {ogTitle || "Titre du lien sur Facebook"}
                  </span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-0.5">
                    {ogDescription || "Description du contenu affichée dans le flux d'actualité Facebook."}
                  </span>
                </div>
              </div>
            ) : (
              /* Large Facebook Banner */
              <div>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => bannerInputRef.current?.click()}
                  className="relative w-full h-40 sm:h-44 overflow-hidden cursor-pointer group flex items-center justify-center border-b border-zinc-200 dark:border-[#22242a] bg-zinc-100 dark:bg-[#16181d]"
                >
                  {hasCustomImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImage}
                        alt="Facebook preview"
                        className="w-full h-full object-cover"
                        onError={() => setHasImageError(true)}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-zinc-900 text-xs font-semibold shadow-md">
                          <Upload className="w-3.5 h-3.5 text-[#0066FF]" />
                          <span>Changer l&apos;image</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-5 px-4 flex flex-col items-center justify-center text-center gap-1.5">
                      <Upload className="w-5 h-5 text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Aperçu Facebook
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-[#F0F2F5] dark:bg-[#18191a]">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider block">
                    {(domainName || "lsho.cc").toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white block truncate mt-0.5">
                    {ogTitle || "Titre du lien sur Facebook"}
                  </span>
                  <span className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 mt-0.5">
                    {ogDescription || "Description du contenu affichée dans le flux d'actualité Facebook."}
                  </span>
                </div>
              </div>
            )
          ) : socialPlatformPreview === "linkedin" ? (
            /* LinkedIn Post Card Style */
            twitterCard === "summary" ? (
              /* Compact LinkedIn Card */
              <div className="flex bg-zinc-50 dark:bg-[#1b1f23] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => bannerInputRef.current?.click()}
                  className="relative w-24 sm:w-28 h-24 sm:h-28 shrink-0 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center cursor-pointer group border-r border-zinc-200 dark:border-zinc-800"
                >
                  {hasCustomImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImage}
                        alt="LinkedIn compact preview"
                        className="w-full h-full object-cover"
                        onError={() => setHasImageError(true)}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <Upload className="w-3.5 h-3.5 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="p-2 text-center text-xs text-zinc-400">
                      <Upload className="w-4 h-4 mx-auto mb-1 text-zinc-400" />
                      <span className="text-[10px]">Image</span>
                    </div>
                  )}
                </div>
                <div className="p-3 flex flex-col justify-center min-w-0 flex-1">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white block truncate">
                    {ogTitle || "Titre professionnel LinkedIn"}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono block mt-0.5">
                    {domainName || "lsho.cc"}
                  </span>
                </div>
              </div>
            ) : (
              /* Large LinkedIn Banner */
              <div>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => bannerInputRef.current?.click()}
                  className="relative w-full h-40 sm:h-44 overflow-hidden cursor-pointer group flex items-center justify-center border-b border-zinc-200 dark:border-[#22242a] bg-zinc-100 dark:bg-[#16181d]"
                >
                  {hasCustomImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImage}
                        alt="LinkedIn preview"
                        className="w-full h-full object-cover"
                        onError={() => setHasImageError(true)}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-zinc-900 text-xs font-semibold shadow-md">
                          <Upload className="w-3.5 h-3.5 text-[#0066FF]" />
                          <span>Changer l&apos;image</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-5 px-4 flex flex-col items-center justify-center text-center gap-1.5">
                      <Upload className="w-5 h-5 text-zinc-400" />
                      <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                        Aperçu LinkedIn
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3 bg-zinc-50 dark:bg-[#1b1f23] border-t border-zinc-200 dark:border-zinc-800">
                  <span className="text-xs font-semibold text-zinc-900 dark:text-white block truncate">
                    {ogTitle || "Titre professionnel LinkedIn"}
                  </span>
                  <span className="text-[11px] text-zinc-500 font-mono block mt-0.5">
                    {domainName || "lsho.cc"}
                  </span>
                </div>
              </div>
            )
          ) : twitterCard === "summary_large_image" ? (
            /* Twitter / X Large Banner Style (Authentic X Card Layout) */
            <div className="rounded-xl overflow-hidden bg-black text-white border border-[#2f3336] shadow-sm">
              {/* Image Zone: Clickable & Drag-Drop capable */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => bannerInputRef.current?.click()}
                className={cn(
                  "relative w-full h-44 sm:h-52 overflow-hidden cursor-pointer group flex items-center justify-center border-b border-[#2f3336] transition-colors",
                  isDragging
                    ? "bg-[#0066FF]/20"
                    : "bg-[#16181c] hover:bg-[#1c1e24]",
                )}
              >
                {hasCustomImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeImage}
                      alt="Social preview banner"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                      onError={(e) => {
                        if (previewImage) return;
                        const target = e.currentTarget;
                        if (ogImage && ogImage.startsWith("/api/images/")) {
                          const filename = ogImage.replace("/api/images/", "");
                          target.src = `/api/v1/images/${filename}`;
                        } else {
                          setHasImageError(true);
                        }
                      }}
                    />
                    {/* Hover Overlay with Action Buttons */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2.5 backdrop-blur-[2px]">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/95 text-zinc-900 text-xs font-semibold shadow-md hover:scale-105 transition-transform">
                        <Upload className="w-3.5 h-3.5 text-[#0066FF]" />
                        <span>Changer l&apos;image</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOgImage("");
                          setPreviewImage("");
                        }}
                        className="p-1.5 rounded-lg bg-red-600/90 hover:bg-red-600 text-white shadow-md hover:scale-105 transition-transform cursor-pointer"
                        title="Supprimer la bannière"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  /* Dynamic Generative Banner with Upload Action Overlay */
                  <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-[#121316] via-[#1a1c22] to-[#0c0d10] p-4 text-center select-none">
                    <div className="absolute inset-0 bg-[radial-gradient(#0066FF_1px,transparent_1px)] [background-size:16px_16px] opacity-20 pointer-events-none" />
                    
                    {/* Branded Default Elements */}
                    <div className="flex items-center gap-1.5 mb-2 px-3 py-0.5 rounded-full bg-[#0066FF]/15 border border-[#0066FF]/30 z-10">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] animate-pulse" />
                      <span className="text-[10px] font-bold text-[#5294FF] uppercase tracking-wider">
                        {domainName || "lsho.cc"}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-white line-clamp-1 max-w-[85%] z-10">
                      {ogTitle || "Auto-generated Twitter / X banner preview"}
                    </span>
                    <span className="text-[10.5px] text-zinc-400 mt-0.5 z-10">
                      High-definition 1200 × 630 pixels
                    </span>

                    {/* Upload Prompt Action Button */}
                    <div className="mt-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 border border-white/15 text-xs font-semibold text-zinc-200 group-hover:border-[#0066FF]/50 group-hover:text-white transition-all shadow-xs">
                      <Upload className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>Click or drag image to upload banner</span>
                    </div>
                  </div>
                )}

                {/* Authentic Twitter / X Floating Domain Pill Badge */}
                <div className="absolute bottom-2.5 left-2.5 z-20 px-2.5 py-1 rounded-[6px] bg-black/80 backdrop-blur-md border border-white/15 text-[11px] font-medium text-white flex items-center gap-1.5 pointer-events-none shadow-sm">
                  <Globe2 className="w-3 h-3 text-zinc-400" />
                  <span>{domainName || "lsho.cc"}</span>
                </div>
              </div>

              {/* Twitter / X Authentic Black Post Metadata Block */}
              <div className="p-3 bg-black text-white">
                <span className="text-[11px] text-zinc-400 font-normal">
                  {domainName || "lsho.cc"}
                </span>
                <span className="text-xs sm:text-sm font-bold text-white truncate block mt-0.5">
                  {ogTitle || "Title of your shared link"}
                </span>
                <span className="text-[11px] text-zinc-400 line-clamp-2 mt-0.5">
                  {ogDescription ||
                    "Open Graph description will appear here on X / Twitter."}
                </span>
              </div>
            </div>
          ) : (
            /* Twitter / X Compact Summary Style */
            <div className="flex items-center gap-3 p-3 bg-black text-white rounded-xl border border-[#2f3336]">
              {/* Compact Thumbnail with Upload / Change action */}
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => bannerInputRef.current?.click()}
                className={cn(
                  "relative w-20 h-20 rounded-lg overflow-hidden cursor-pointer group shrink-0 border border-[#2f3336] flex items-center justify-center transition-colors",
                  isDragging
                    ? "bg-[#0066FF]/20"
                    : "bg-[#16181d] hover:bg-[#1c1e24]",
                )}
              >
                {hasCustomImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeImage}
                      alt="Compact thumb"
                      className="w-full h-full object-cover"
                      onError={() => setHasImageError(true)}
                    />
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                      <span className="p-1 rounded bg-white text-zinc-900" title="Changer l'image">
                        <Upload className="w-3.5 h-3.5 text-[#0066FF]" />
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOgImage("");
                          setPreviewImage("");
                        }}
                        className="p-1 rounded bg-red-600 text-white cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-1 text-center text-zinc-400 group-hover:text-[#0066FF] transition-colors">
                    <Upload className="w-5 h-5 text-zinc-400" />
                    <span className="text-[9px] font-semibold mt-1 leading-tight">
                      Importer
                    </span>
                  </div>
                )}
              </div>

              {/* Compact Text Metadata */}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-zinc-400 font-mono block uppercase font-medium">
                  {domainName || "lsho.cc"}
                </span>
                <span className="text-xs font-bold text-white block truncate mt-0.5">
                  {ogTitle || "Compact Card Title"}
                </span>
                <span className="text-[11px] text-zinc-400 line-clamp-1 mt-0.5">
                  {ogDescription || "Compact description for X."}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
