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

export function MetaColorIcon({ className = "w-5 h-5" }: { className?: string }) {
  const id = React.useId();
  const gradientId = `meta-brand-gradient-${id.replace(/[:]/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} fill="none" role="img" aria-label="Meta">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="4" x2="24" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0064E0" />
          <stop offset="45%" stopColor="#0081FB" />
          <stop offset="85%" stopColor="#0064E0" />
          <stop offset="100%" stopColor="#0052CC" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${gradientId})`}
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16.96 4C14.71 4 12.83 5.3 12 7.02C11.17 5.3 9.29 4 7.04 4C3.16 4 0 7.21 0 11.17C0 15.65 3.52 19.5 7.68 19.5C9.72 19.5 11.4 18.47 12 17.26C12.6 18.47 14.28 19.5 16.32 19.5C20.48 19.5 24 15.65 24 11.17C24 7.21 20.84 4 16.96 4ZM7.44 16.92C4.78 16.92 2.58 14.36 2.58 11.17C2.58 8.52 4.54 6.58 7.04 6.58C8.94 6.58 10.5 7.9 10.95 9.86C10.74 10.42 10.4 11.05 10 11.66C8.83 13.43 7.82 15.35 7.44 16.92ZM16.56 16.92C16.18 15.35 15.17 13.43 14 11.66C13.6 11.05 13.26 10.42 13.05 9.86C13.5 7.9 15.06 6.58 16.96 6.58C19.46 6.58 21.42 8.52 21.42 11.17C21.42 14.36 19.22 16.92 16.56 16.92Z"
      />
    </svg>
  );
}

export function GoogleColorIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} role="img" aria-label="Google">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.94 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
      />
    </svg>
  );
}

export function TikTokColorIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} role="img" aria-label="TikTok">
      {/* Cyan layer */}
      <path
        fill="#25F4EE"
        d="M19.3 5.4c-1.4-.1-2.7-.8-3.5-1.8-.3-.4-.6-.8-.7-1.3-.2-.5-.3-1-.3-1.6h-2.8v13.2c0 1.9-1.5 3.4-3.4 3.4-1.9 0-3.4-1.5-3.4-3.4 0-1.9 1.5-3.4 3.4-3.4.4 0 .8.1 1.2.2V7.4c-.4 0-.8-.1-1.2-.1-3.6 0-6.6 2.9-6.6 6.6 0 3.6 2.9 6.6 6.6 6.6 3.6 0 6.6-2.9 6.6-6.6V8.3c1.5 1 3.2 1.6 5.1 1.6V6.1c-.4-.1-.7-.3-1-.7z"
      />
      {/* Neon Red/Magenta layer */}
      <path
        fill="#FE2C55"
        d="M20.2 6.3c-1.4-.1-2.7-.8-3.5-1.8-.3-.4-.6-.8-.7-1.3-.2-.5-.3-1-.3-1.6h-2.8v13.2c0 1.9-1.5 3.4-3.4 3.4-1.9 0-3.4-1.5-3.4-3.4 0-1.9 1.5-3.4 3.4-3.4.4 0 .8.1 1.2.2V8.3c-.4 0-.8-.1-1.2-.1-3.6 0-6.6 2.9-6.6 6.6 0 3.6 2.9 6.6 6.6 6.6 3.6 0 6.6-2.9 6.6-6.6V9.2c1.5 1 3.2 1.6 5.1 1.6V7c-.4-.1-.7-.3-1-.7z"
      />
      {/* Dark/White center note */}
      <path
        fill="#111113"
        className="dark:fill-white"
        d="M19.7 5.8c-1.4-.1-2.7-.8-3.5-1.8-.3-.4-.6-.8-.7-1.3-.2-.5-.3-1-.3-1.6h-2.8v13.2c0 1.9-1.5 3.4-3.4 3.4-1.9 0-3.4-1.5-3.4-3.4 0-1.9 1.5-3.4 3.4-3.4.4 0 .8.1 1.2.2V7.8c-.4 0-.8-.1-1.2-.1-3.6 0-6.6 2.9-6.6 6.6 0 3.6 2.9 6.6 6.6 6.6 3.6 0 6.6-2.9 6.6-6.6V8.7c1.5 1 3.2 1.6 5.1 1.6V6.5c-.4-.1-.7-.3-1-.7z"
      />
    </svg>
  );
}

export function LinkedInColorIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} role="img" aria-label="LinkedIn">
      <rect width="24" height="24" rx="4.5" fill="#0A66C2" />
      <path
        fill="#FFFFFF"
        d="M19.5 19.5h-3.1v-4.9c0-1.2 0-2.7-1.6-2.7-1.6 0-1.9 1.3-1.9 2.6v5H9.8V9.5h3v1.4h0c.4-.8 1.4-1.6 3-1.6 3.2 0 3.8 2.1 3.8 4.8v5.4zM6.5 8.1c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8 1.8.8 1.8 1.8-.8 1.8-1.8 1.8zm1.5 11.4H4.9V9.5H8v10z"
      />
    </svg>
  );
}

export function BrandColorLogo({
  platform,
  className = "w-5 h-5",
}: {
  platform: string;
  className?: string;
}) {
  const normalized = normalizePixelPlatform(platform);
  switch (normalized) {
    case "meta":
      return <MetaColorIcon className={className} />;
    case "google":
      return <GoogleColorIcon className={className} />;
    case "tiktok":
      return <TikTokColorIcon className={className} />;
    case "linkedin":
      return <LinkedInColorIcon className={className} />;
    default:
      return null;
  }
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
      return <MetaColorIcon className={className} />;
    case "google":
      return <GoogleColorIcon className={className} />;
    case "tiktok":
      return <TikTokColorIcon className={className} />;
    case "linkedin":
      return <LinkedInColorIcon className={className} />;
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
