"use client";

import React, { useState } from "react";
import {
  Sparkles,
  LayoutGrid,
  Check,
  Upload,
  Image as ImageIcon,
  Trash2,
  RefreshCw,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SectionSocialProps {
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
}

export function SectionSocial({
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
}: SectionSocialProps) {
  const hasCustomImage = Boolean(previewImage || ogImage);
  const [isDragging, setIsDragging] = useState(false);

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
    <div className="flex flex-col gap-4 animate-in fade-in duration-200">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={bannerInputRef}
        accept="image/png, image/jpeg, image/webp"
        onChange={handleBannerUpload}
        className="hidden"
      />

      {/* ── 1. OpenGraph Title & Description Inputs (First Position) ── */}
      <div className="flex flex-col gap-3 p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] shadow-xs">
        {/* OpenGraph Title */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-800 dark:text-neutral-300">
              Custom OpenGraph Title
            </label>
            <span className="text-[10px] text-zinc-500 dark:text-neutral-500 font-mono">
              {ogTitle.length}/70
            </span>
          </div>
          <Input
            placeholder="Catchy social title..."
            value={ogTitle}
            onChange={(e) => setOgTitle(e.target.value)}
            className="bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] focus:border-brand text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-9 rounded-[8px]"
          />
        </div>

        {/* OpenGraph Description */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-zinc-800 dark:text-neutral-300">
              OpenGraph Description
            </label>
            <span className="text-[10px] text-zinc-500 dark:text-neutral-500 font-mono">
              {ogDescription.length}/160
            </span>
          </div>
          <textarea
            rows={2}
            placeholder="Concise description displayed when shared on social networks..."
            value={ogDescription}
            onChange={(e) => setOgDescription(e.target.value)}
            className="w-full bg-white dark:bg-[#101012] border border-zinc-200 dark:border-[#27272a] focus:border-brand rounded-[8px] p-2.5 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 outline-none resize-none"
          />
        </div>
      </div>

      {/* ── 2. Format Switcher (Large Banner vs Default Standard) ── */}
      <div className="flex flex-col gap-2 p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              Social Banner Format
            </span>
            <span className="text-[11px] text-zinc-500 dark:text-neutral-400">
              Choose the layout format for your link preview card.
            </span>
          </div>
          {twitterCard === "summary_large_image" ? (
            <span className="text-[9.5px] font-bold text-brand uppercase px-2 py-0.5 rounded bg-brand/10 border border-brand/30 self-start sm:self-auto shrink-0">
              Large Card 1200×630
            </span>
          ) : (
            <span className="text-[9.5px] font-bold text-zinc-600 dark:text-neutral-400 uppercase px-2 py-0.5 rounded bg-zinc-200/80 dark:bg-white/5 border border-zinc-300 dark:border-white/10 self-start sm:self-auto shrink-0">
              Standard Format
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          {/* Option 1: Large Banner (1200x630) */}
          <button
            type="button"
            onClick={() => setTwitterCard("summary_large_image")}
            className={cn(
              "p-3 rounded-[8px] border flex flex-col items-start gap-1.5 transition-all cursor-pointer text-left relative",
              twitterCard === "summary_large_image"
                ? "bg-brand/10 border-brand text-zinc-900 dark:text-white shadow-sm ring-1 ring-brand/50"
                : "bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] text-zinc-600 dark:text-neutral-400 hover:border-zinc-300 dark:hover:border-neutral-600 hover:text-zinc-900 dark:hover:text-neutral-200",
            )}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Sparkles
                  className={cn(
                    "w-4 h-4",
                    twitterCard === "summary_large_image"
                      ? "text-brand"
                      : "text-zinc-400 dark:text-neutral-500",
                  )}
                />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  Large Banner
                </span>
              </div>
              {twitterCard === "summary_large_image" && (
                <Check className="w-3.5 h-3.5 text-brand" />
              )}
            </div>
            <span className="text-[10.5px] text-zinc-500 dark:text-neutral-400 leading-tight">
              Full-width 1200×630 (Custom image or auto-generated banner).
            </span>
          </button>

          {/* Option 2: Default Compact Banner */}
          <button
            type="button"
            onClick={() => setTwitterCard("summary")}
            className={cn(
              "p-3 rounded-[8px] border flex flex-col items-start gap-1.5 transition-all cursor-pointer text-left relative",
              twitterCard === "summary"
                ? "bg-brand/10 border-brand text-zinc-900 dark:text-white shadow-sm ring-1 ring-brand/50"
                : "bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] text-zinc-600 dark:text-neutral-400 hover:border-zinc-300 dark:hover:border-neutral-600 hover:text-zinc-900 dark:hover:text-neutral-200",
            )}
          >
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <LayoutGrid
                  className={cn(
                    "w-4 h-4",
                    twitterCard === "summary"
                      ? "text-brand"
                      : "text-zinc-400 dark:text-neutral-500",
                  )}
                />
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  Default Banner
                </span>
              </div>
              {twitterCard === "summary" && (
                <Check className="w-3.5 h-3.5 text-brand" />
              )}
            </div>
            <span className="text-[10.5px] text-zinc-500 dark:text-neutral-400 leading-tight">
              Compact side thumbnail format. No image upload required.
            </span>
          </button>
        </div>
      </div>

      {/* ── 3. Interactive Social Card Preview & Image Dropzone ── */}
      <div className="flex flex-col gap-2 p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] shadow-xs">
        {/* Header with platform pills */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-xs font-bold text-zinc-900 dark:text-white">
            Interactive Social Preview
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {(["x", "facebook", "whatsapp"] as const).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setSocialPlatformPreview(p)}
                className={cn(
                  "px-2.5 py-1 rounded-[5px] text-[10.5px] font-bold uppercase transition-colors cursor-pointer shrink-0",
                  socialPlatformPreview === p
                    ? "bg-brand text-white shadow-xs"
                    : "bg-zinc-200/70 dark:bg-white/5 text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white",
                )}
              >
                {p === "x" ? "X / Twitter" : p}
              </button>
            ))}
          </div>
        </div>

        {/* ── Card Box: Integrated Image Selector + Social Card ── */}
        {twitterCard === "summary_large_image" ? (
          /* Grand Format 1200x630 */
          <div className="rounded-[10px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] overflow-hidden flex flex-col transition-all shadow-xs">
            {/* Interactive Banner Area (Uploader & Preview combined) */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => bannerInputRef.current?.click()}
              className={cn(
                "w-full h-44 sm:h-52 bg-zinc-100 dark:bg-[#101012] relative flex items-center justify-center border-b border-zinc-200 dark:border-[#27272a] overflow-hidden cursor-pointer group transition-all",
                isDragging && "ring-2 ring-brand border-brand bg-brand/5",
              )}
            >
              {hasCustomImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewImage || ogImage}
                    alt="Social preview banner"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                  />
                  {/* Hover Actions Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-2.5 transition-opacity backdrop-blur-[2px]">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        bannerInputRef.current?.click();
                      }}
                      className="px-3 py-1.5 rounded-[7px] bg-brand text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:brightness-110 transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Replace image</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setOgImage("");
                        setPreviewImage("");
                      }}
                      className="px-3 py-1.5 rounded-[7px] bg-red-500/80 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                </>
              ) : (
                /* Dynamic Generative Banner with Upload Action Overlay */
                <div className="w-full h-full relative flex flex-col items-center justify-center bg-gradient-to-br from-zinc-100 via-zinc-50 to-zinc-200 dark:from-[#131316] dark:via-[#1a1a24] dark:to-[#0d0d12] p-4 text-center select-none">
                  <div className="absolute inset-0 bg-[radial-gradient(#ff6600_1px,transparent_1px)] [background-size:16px_16px] opacity-25 dark:opacity-20 pointer-events-none" />
                  
                  {/* Branded Default Elements */}
                  <div className="flex items-center gap-1.5 mb-2 px-3 py-0.5 rounded-full bg-brand/10 border border-brand/30 z-10">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                    <span className="text-[10px] font-bold text-brand uppercase tracking-wider">
                      {domainName || "lsho.cc"}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-zinc-900 dark:text-white line-clamp-1 max-w-[85%] z-10">
                    {ogTitle || "Auto-generated social banner preview"}
                  </span>
                  <span className="text-[10.5px] text-zinc-500 dark:text-neutral-400 mt-0.5 z-10">
                    High-definition 1200 × 630 pixels
                  </span>

                  {/* Upload Prompt Action Button */}
                  <div className="mt-3 z-10 flex items-center gap-1.5 px-3 py-1.5 rounded-[7px] bg-white dark:bg-white/10 hover:bg-zinc-50 dark:hover:bg-white/15 border border-zinc-200 dark:border-white/15 text-xs font-semibold text-zinc-700 dark:text-neutral-200 group-hover:border-brand/50 group-hover:text-brand dark:group-hover:text-white transition-all shadow-xs">
                    <Upload className="w-3.5 h-3.5 text-brand" />
                    <span>Click or drag image to upload banner</span>
                  </div>
                </div>
              )}
            </div>

            {/* Meta text */}
            <div className="p-3.5 flex flex-col gap-1 bg-white dark:bg-[#18181c]">
              <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-neutral-500 tracking-wider">
                {domainName || "lsho.cc"}
              </span>
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                {ogTitle || "Title of your shared link"}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-neutral-400 line-clamp-2">
                {ogDescription ||
                  "Open Graph description will appear here when shared on social networks."}
              </span>
            </div>
          </div>
        ) : (
          /* Format Standard Compact */
          <div className="rounded-[10px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] overflow-hidden flex items-stretch transition-all shadow-xs">
            <div className="p-3.5 flex-1 flex flex-col justify-center gap-1 bg-white dark:bg-[#18181c] min-w-0">
              <span className="text-[10px] uppercase font-bold text-zinc-400 dark:text-neutral-500 tracking-wider">
                {domainName || "lsho.cc"}
              </span>
              <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                {ogTitle || "Title of your shared link"}
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-neutral-400 line-clamp-2">
                {ogDescription ||
                  "Standard compact social preview with title and description."}
              </span>
            </div>

            {/* Interactive Thumbnail Area */}
            <div
              onClick={() => bannerInputRef.current?.click()}
              className="w-28 bg-zinc-100 dark:bg-[#101012] border-l border-zinc-200 dark:border-[#27272a] flex flex-col items-center justify-center p-2.5 shrink-0 cursor-pointer group hover:bg-zinc-200/70 dark:hover:bg-[#151518] transition-colors relative"
            >
              {hasCustomImage ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewImage || ogImage}
                    alt="Thumbnail"
                    className="w-14 h-14 rounded-[8px] object-cover border border-zinc-200 dark:border-[#27272a] group-hover:opacity-75 transition-opacity"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-r-[10px]">
                    <Upload className="w-4 h-4 text-white" />
                  </div>
                </>
              ) : (
                <div className="w-14 h-14 rounded-[8px] bg-brand/10 border border-brand/30 flex flex-col items-center justify-center group-hover:border-brand/60 transition-colors">
                  <span className="text-sm font-black text-brand tracking-tighter">
                    LS
                  </span>
                  <span className="text-[8px] font-mono text-zinc-400 dark:text-neutral-400 mt-0.5">
                    + Image
                  </span>
                </div>
              )}
              <span className="text-[9px] font-mono text-zinc-500 dark:text-neutral-500 mt-1.5">
                {hasCustomImage ? "Thumbnail" : "Default"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

