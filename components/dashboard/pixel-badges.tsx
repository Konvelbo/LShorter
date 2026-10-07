"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type PixelPlatform = "meta" | "facebook" | "google" | "google_tag" | "tiktok" | "linkedin";

export function normalizePixelPlatform(raw: any): "meta" | "google" | "tiktok" | "linkedin" {
  if (typeof raw === "object" && raw !== null) {
    if (raw.platform) return normalizePixelPlatform(raw.platform);
    if (raw.pixelId) return normalizePixelPlatform(raw.pixelId);
    if (raw.id) return normalizePixelPlatform(raw.id);
  }
  const lower = String(raw || "").toLowerCase();
  if (lower.includes("meta") || lower.includes("facebook") || lower.startsWith("fb_") || lower.startsWith("px_meta")) return "meta";
  if (lower.includes("google") || lower.includes("ga4") || lower.startsWith("g-") || lower.startsWith("gtag") || lower.startsWith("px_google") || lower.includes("analytics")) return "google";
  if (lower.includes("tiktok") || lower.startsWith("tt_") || lower.startsWith("px_tiktok")) return "tiktok";
  if (lower.includes("linkedin") || lower.startsWith("li_") || lower.startsWith("px_linkedin")) return "linkedin";

  // Check if pixel ID exists in localStorage cached pixels
  if (typeof window !== "undefined") {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith("lshorter_pixels_")) {
          const saved = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(saved)) {
            const found = saved.find((p: any) => p.id === raw || p.pixelId === raw);
            if (found && found.platform) {
              return normalizePixelPlatform(found.platform);
            }
          }
        }
      }
    } catch {}
  }

  return "meta";
}

export function PixelBrandLogo({
  platform,
  className = "w-4.5 h-4.5",
}: {
  platform: string;
  className?: string;
}) {
  const normalized = normalizePixelPlatform(platform);

  switch (normalized) {
    case "meta":
      return (
        <svg
          className={cn("shrink-0 text-[#1877F2]", className)}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-label="Meta Facebook Pixel"
        >
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case "google":
      return (
        <svg
          className={cn("shrink-0", className)}
          viewBox="0 0 2196 2431"
          fill="none"
          aria-label="Google Analytics (GA4)"
        >
          {/* Tall right bar */}
          <path
            fill="#F9AB00"
            d="M2195.9 2126.7c0.9 166.9-133.7 302.8-300.5 303.7-12.4 0.1-24.9-0.6-37.2-2.1-154.8-22.9-268.2-157.6-264.4-314V316.1c-3.7-156.6 110-291.3 264.9-314 165.7-19.4 315.8 99.2 335.2 264.9 1.4 12.2 2.1 24.4 2 36.7L2195.9 2126.7z"
          />
          {/* Orange circle dot on left & middle bar */}
          <path
            fill="#E37400"
            d="M301.1 1828.7c166.3 0 301.1 134.8 301.1 301.1 0 166.3-134.8 301.1-301.1 301.1C134.8 2430.9 0 2296.1 0 2129.8c0-166.3 134.8-301.1 301.1-301.1z M1093.3 916.2c-167.1 9.2-296.7 149.3-292.8 316.6v808.7c0 219.5 96.6 352.7 238.1 381.1c163.3 33.1 322.4-72.4 355.5-235.7c4.1-20 6.1-40.3 6-60.7v-907.4c0.3-166.9-134.7-302.4-301.6-302.7-1.7 0-3.5 0-5.2.1z"
          />
        </svg>
      );
    case "tiktok":
      return (
        <svg
          className={cn("shrink-0 text-zinc-900 dark:text-white", className)}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-label="TikTok Ads Pixel"
        >
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.98-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.24 1.07-.14 1.61.24 1.17 1.15 2.12 2.31 2.36.92.23 1.98.08 2.76-.5.71-.5 1.14-1.31 1.19-2.19.03-3.67.01-7.34.02-11.01.01-.58-.01-1.16-.01-1.74-.01-1.9-.01-3.8-.01-5.7z" />
        </svg>
      );
    case "linkedin":
      return (
        <svg
          className={cn("shrink-0 text-[#0A66C2]", className)}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-label="LinkedIn Insight Tag"
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3m1.37 9.74v-8.37H5.1v8.37h2.73z" />
        </svg>
      );
    default:
      return null;
  }
}

export function PinnedPixelBadge({
  className,
  label = "Épinglé",
}: {
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold bg-[#0066FF]/10 border border-[#0066FF]/20 text-[#0066FF] shadow-2xs select-none",
        className
      )}
      title="Lien épinglé en tête grâce au suivi Retargeting Pixel actif"
    >
      <svg
        className="w-2.5 h-2.5 fill-current"
        viewBox="0 0 24 24"
      >
        <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
      </svg>
      <span>{label}</span>
    </span>
  );
}

export function PixelBadgesList({
  pixels,
  className,
}: {
  pixels?: any[] | string[];
  className?: string;
}) {
  if (!pixels || !Array.isArray(pixels) || pixels.length === 0) return null;

  // Extract unique platforms
  const platforms = Array.from(
    new Set(
      pixels.map((p) => {
        if (typeof p === "string") return normalizePixelPlatform(p);
        if (typeof p === "object" && p !== null) {
          return normalizePixelPlatform(p.platform || p.id || "");
        }
        return "meta";
      })
    )
  );

  if (platforms.length === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-xs shadow-2xs",
        className
      )}
      title={`Retargeting actif : ${platforms.join(", ")}`}
    >
      {platforms.map((platform, idx) => (
        <React.Fragment key={platform}>
          {idx > 0 && (
            <span className="w-[1px] h-2.5 bg-zinc-300 dark:bg-zinc-700" />
          )}
          <PixelBrandLogo platform={platform} className="w-3.5 h-3.5" />
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * PixelLogosOnlyList
 * Renders purely the platform logos with zero background container, zero border, and hover tooltips.
 * Specifically designed for the links table/data grid as requested ("sans le background juste le logo").
 */
export function PixelLogosOnlyList({
  pixels,
  className,
}: {
  pixels?: any[] | string[];
  className?: string;
}) {
  if (!pixels || !Array.isArray(pixels) || pixels.length === 0) return null;

  const platformMap = new Map<
    string,
    { label: string; platform: "meta" | "google" | "tiktok" | "linkedin" }
  >();

  pixels.forEach((p) => {
    const platform = normalizePixelPlatform(p);
    const label =
      platform === "meta"
        ? "Meta Pixel (Facebook)"
        : platform === "google"
        ? "Google Analytics (GA4)"
        : platform === "tiktok"
        ? "TikTok Ads Pixel"
        : "LinkedIn Insight Tag";
    platformMap.set(platform, { label, platform });
  });

  const list = Array.from(platformMap.values());
  if (list.length === 0) return null;

  return (
    <div className={cn("inline-flex items-center gap-2", className)}>
      {list.map((item) => (
        <span
          key={item.platform}
          title={item.label}
          className="inline-flex items-center justify-center transition-transform hover:scale-110 cursor-help"
        >
          <PixelBrandLogo platform={item.platform} className="w-4.5 h-4.5 shrink-0" />
        </span>
      ))}
    </div>
  );
}
