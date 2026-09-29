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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cfNormalizeImageUrl } from "@/lib/cloudflare-api";

interface SectionSocialTrackingProps {
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
  socialPlatformPreview: "x" | "facebook" | "whatsapp";
  setSocialPlatformPreview: (p: "x" | "facebook" | "whatsapp") => void;
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
}: SectionSocialTrackingProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const activeImage = previewImage || cfNormalizeImageUrl(ogImage);
  const hasCustomImage = Boolean(activeImage && (!hasImageError || previewImage));
  const [isDragging, setIsDragging] = useState(false);

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
          Social media & tracking
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Configure campaign UTM parameters and customize your social share preview cards.
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

        {/* 2-Column UTM Inputs with enhanced light mode contrast */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              UTM Source
            </label>
            <input
              type="text"
              placeholder="google, newsletter, twitter"
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3 py-2 text-xs outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              UTM Medium
            </label>
            <input
              type="text"
              placeholder="cpc, banner, email"
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3 py-2 text-xs outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              UTM Campaign
            </label>
            <input
              type="text"
              placeholder="spring_sale, launch_2026"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3 py-2 text-xs outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              UTM Term
            </label>
            <input
              type="text"
              placeholder="shortener, keywords"
              value={utmTerm}
              onChange={(e) => setUtmTerm(e.target.value)}
              className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3 py-2 text-xs outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
            />
          </div>
        </div>

        {/* UTM Content (Full Width) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            UTM Content (Optional)
          </label>
          <input
            type="text"
            placeholder="logolink, header_cta, variant_b"
            value={utmContent}
            onChange={(e) => setUtmContent(e.target.value)}
            className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3 py-2 text-xs outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
          />
        </div>

        {/* Live Computed Destination URL */}
        {(utmSource || utmMedium || utmCampaign || utmTerm || utmContent) && (
          <div className="p-3 rounded-lg bg-zinc-50 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a] text-xs font-mono break-all text-zinc-900 dark:text-[#f1f2f4]">
            <span className="text-zinc-500 dark:text-[#8a8f9a] font-sans block text-[11px] mb-1 font-medium">
              Tagged Target URL:
            </span>
            <span className="text-[#1d5fe0] dark:text-[#3b82f6] font-semibold">
              {computeFinalUrlWithUtm() || targetUrl}
            </span>
          </div>
        )}
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
            <input
              type="text"
              maxLength={70}
              placeholder="Catchy social title..."
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
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
              className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal resize-vertical min-h-[64px]"
            />
          </div>
        </div>

        {/* Banner Format (Segmented switch) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
            Banner Style
          </label>
          <div className="flex gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a]">
            <button
              type="button"
              onClick={() => setTwitterCard("summary_large_image")}
              className={cn(
                "flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all text-center cursor-pointer flex items-center justify-center gap-1.5",
                twitterCard === "summary_large_image"
                  ? "bg-white dark:bg-[#0e0f12] text-zinc-900 dark:text-[#f1f2f4] shadow-sm border border-[#1d5fe0] dark:border-[#3b82f6] font-semibold"
                  : "text-zinc-600 dark:text-[#8a8f9a] hover:text-zinc-900 dark:hover:text-[#f1f2f4]",
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#1d5fe0] dark:text-[#3b82f6]" />
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
                "flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all text-center cursor-pointer flex items-center justify-center gap-1.5",
                twitterCard === "summary"
                  ? "bg-white dark:bg-[#0e0f12] text-zinc-900 dark:text-[#f1f2f4] shadow-sm border border-[#1d5fe0] dark:border-[#3b82f6] font-semibold"
                  : "text-zinc-600 dark:text-[#8a8f9a] hover:text-zinc-900 dark:hover:text-[#f1f2f4]",
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bannière par défaut (Compacte)</span>
            </button>
          </div>
        </div>

        {/* Banner Upload Dropzone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => bannerInputRef.current?.click()}
          className={cn(
            "p-4 rounded-xl border border-dashed text-center cursor-pointer transition-colors flex flex-col items-center justify-center gap-2",
            isDragging
              ? "border-[#1d5fe0] bg-[#1d5fe0]/5 dark:border-[#3b82f6] dark:bg-[#3b82f6]/10"
              : "border-zinc-300 dark:border-[#22242a] bg-zinc-50/70 dark:bg-[#16181d]/50 hover:bg-zinc-100 dark:hover:bg-[#16181d]",
          )}
        >
          {hasCustomImage ? (
            <div className="relative w-full max-h-[160px] overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt="Banner preview"
                className="w-full h-full object-cover rounded-lg"
                onError={() => setHasImageError(true)}
              />
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setOgImage("");
                  setPreviewImage("");
                }}
                className="absolute top-2 right-2 p-1.5 rounded-md bg-black/70 hover:bg-red-600 text-white transition-colors cursor-pointer"
                title="Remove banner"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="py-2 flex flex-col items-center gap-1.5">
              <Upload className="w-5 h-5 text-zinc-500 dark:text-[#8a8f9a]" />
              <span className="text-xs font-semibold text-zinc-800 dark:text-[#f1f2f4]">
                {isUploadingImage
                  ? "Uploading image..."
                  : "Click or drag custom image here"}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-[#8a8f9a]">
                PNG, JPG or WebP up to 10MB
              </span>
            </div>
          )}
        </div>

        {/* Platform switcher pills for preview */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <span className="text-xs font-medium text-zinc-600 dark:text-[#8a8f9a]">
            Preview format:
          </span>
          <div className="flex gap-1">
            {(["x", "facebook", "whatsapp"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSocialPlatformPreview(p)}
                className={cn(
                  "px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer capitalize",
                  socialPlatformPreview === p
                    ? "bg-[#1d5fe0] text-white dark:bg-[#3b82f6]"
                    : "text-zinc-600 dark:text-[#8a8f9a] hover:bg-zinc-100 dark:hover:bg-[#16181d] hover:text-zinc-900 dark:hover:text-[#f1f2f4]",
                )}
              >
                {p === "x" ? "X / Twitter" : p}
              </button>
            ))}
          </div>
        </div>

        {/* Live Card Mockup */}
        <div className="border border-zinc-200 dark:border-[#22242a] rounded-xl overflow-hidden bg-white dark:bg-[#0e0f12] text-left shadow-sm">
          {twitterCard === "summary_large_image" ? (
            <div>
              {hasCustomImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeImage}
                  alt="Social preview"
                  className="w-full h-36 object-cover bg-zinc-100 dark:bg-zinc-800"
                />
              ) : (
                <div className="w-full h-28 bg-zinc-50 dark:bg-[#16181d] flex flex-col items-center justify-center text-zinc-400 dark:text-[#8a8f9a]">
                  <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                  <span className="text-[11px]">Large card banner preview</span>
                </div>
              )}
              <div className="p-3">
                <span className="text-[10px] text-zinc-500 dark:text-[#8a8f9a] font-mono block uppercase font-medium">
                  {domainName || "lsho.cc"}
                </span>
                <span className="text-xs font-bold text-zinc-900 dark:text-[#f1f2f4] block truncate mt-0.5">
                  {ogTitle || "Preview Title"}
                </span>
                <span className="text-[11px] text-zinc-600 dark:text-[#8a8f9a] line-clamp-2 mt-0.5 leading-snug">
                  {ogDescription || "Preview description displayed across social networks."}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3 p-3">
              {hasCustomImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeImage}
                  alt="Compact thumb"
                  className="w-16 h-16 rounded object-cover shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded bg-zinc-50 dark:bg-[#16181d] flex items-center justify-center text-zinc-400 dark:text-[#8a8f9a] shrink-0">
                  <ImageIcon className="w-5 h-5 opacity-40" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-zinc-500 dark:text-[#8a8f9a] font-mono block uppercase font-medium">
                  {domainName || "lsho.cc"}
                </span>
                <span className="text-xs font-bold text-zinc-900 dark:text-[#f1f2f4] block truncate">
                  {ogTitle || "Compact Card Title"}
                </span>
                <span className="text-[11px] text-zinc-600 dark:text-[#8a8f9a] line-clamp-1 mt-0.5">
                  {ogDescription || "Compact description."}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
