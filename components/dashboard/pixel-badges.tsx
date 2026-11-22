"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type CanonicalPixelPlatform =
  | "meta"
  | "instagram"
  | "google"
  | "youtube"
  | "tiktok"
  | "linkedin"
  | "pinterest"
  | "snapchat"
  | "x";

export type PixelPlatform =
  | CanonicalPixelPlatform
  | "facebook"
  | "google_tag"
  | "twitter";

export interface PixelRecordLike {
  id?: string | null;
  platform?: string | null;
  type?: string | null;
  pixelId?: string | null;
  pixel_id?: string | null;
  name?: string | null;
}

export type PixelInput = string | PixelRecordLike | null | undefined;

interface IconProps {
  className?: string;
  decorative?: boolean;
}

function normalizePlatformString(
  raw: string,
  allowLocalStorageLookup: boolean,
  visited?: Set<string>
): CanonicalPixelPlatform {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();

  // Check exact localStorage record match BEFORE prefix heuristics (e.g. YouTube AW-... IDs)
  if (allowLocalStorageLookup && trimmed && typeof window !== "undefined") {
    const seen = visited ?? new Set<string>();
    if (!seen.has(lower)) {
      seen.add(lower);
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("lshorter_pixels_")) {
            const saved: unknown = JSON.parse(localStorage.getItem(key) || "[]");
            if (Array.isArray(saved)) {
              const found = saved.find((item): item is PixelRecordLike => {
                if (!item || typeof item !== "object") return false;
                const rec = item as PixelRecordLike;
                return rec.id === trimmed || rec.pixelId === trimmed || rec.pixel_id === trimmed;
              });
              const foundPlatform = found?.platform || found?.type;
              if (foundPlatform && foundPlatform.trim().toLowerCase() !== lower) {
                return normalizePlatformString(foundPlatform, false, seen);
              }
            }
          }
        }
      } catch {}
    }
  }

  // Check specific networks first so none shadow another
  if (
    lower.includes("instagram") ||
    lower === "ig" ||
    lower.startsWith("ig_") ||
    lower.startsWith("px_ig") ||
    lower.startsWith("px_instagram")
  ) {
    return "instagram";
  }
  if (
    lower.includes("pinterest") ||
    lower === "pin" ||
    lower.startsWith("pin_") ||
    lower.startsWith("px_pin") ||
    lower.startsWith("px_pinterest")
  ) {
    return "pinterest";
  }
  if (
    lower.includes("snapchat") ||
    lower === "snap" ||
    lower.startsWith("snap_") ||
    lower.startsWith("px_snap")
  ) {
    return "snapchat";
  }
  if (
    lower.includes("youtube") ||
    lower === "yt" ||
    lower.startsWith("yt_") ||
    lower.startsWith("px_yt") ||
    lower.startsWith("px_youtube")
  ) {
    return "youtube";
  }
  if (
    lower === "x" ||
    lower === "x_ads" ||
    lower === "x-ads" ||
    lower === "x ads" ||
    lower.includes("twitter") ||
    lower.startsWith("tw_") ||
    lower.startsWith("px_x") ||
    lower.startsWith("px_tw")
  ) {
    return "x";
  }
  if (
    lower.includes("meta") ||
    lower.includes("facebook") ||
    lower === "fb" ||
    lower.startsWith("fb_") ||
    lower.startsWith("px_meta") ||
    lower.startsWith("px_fb")
  ) {
    return "meta";
  }
  if (
    lower.includes("google") ||
    lower.includes("ga4") ||
    lower.startsWith("g-") ||
    lower.startsWith("aw-") ||
    lower.startsWith("gtag") ||
    lower.startsWith("px_google") ||
    lower.includes("analytics")
  ) {
    return "google";
  }
  if (
    lower.includes("tiktok") ||
    lower === "tt" ||
    lower.startsWith("tt_") ||
    lower.startsWith("px_tiktok")
  ) {
    return "tiktok";
  }
  if (
    lower.includes("linkedin") ||
    lower === "li" ||
    lower.startsWith("li_") ||
    lower.startsWith("px_linkedin")
  ) {
    return "linkedin";
  }

  return "meta";
}

export function normalizePixelPlatform(raw: PixelInput): CanonicalPixelPlatform {
  if (typeof raw === "object" && raw !== null) {
    if (raw.platform) return normalizePlatformString(String(raw.platform), false);
    if (raw.type) return normalizePlatformString(String(raw.type), false);
    if (raw.pixelId) return normalizePlatformString(String(raw.pixelId), true);
    if (raw.pixel_id) return normalizePlatformString(String(raw.pixel_id), true);
    if (raw.id) return normalizePlatformString(String(raw.id), true);
    if (raw.name) return normalizePlatformString(String(raw.name), false);
    return "meta";
  }
  return normalizePlatformString(String(raw || ""), true);
}

export function getPixelPlatformLabel(platform: PixelInput): string {
  const norm = normalizePixelPlatform(platform);
  switch (norm) {
    case "meta":
      return "Facebook Ads (Meta)";
    case "instagram":
      return "Instagram Ads";
    case "google":
      return "Google Analytics (GA4)";
    case "youtube":
      return "YouTube Ads";
    case "tiktok":
      return "TikTok Ads";
    case "linkedin":
      return "LinkedIn Insight Tag";
    case "pinterest":
      return "Pinterest Ads";
    case "snapchat":
      return "Snapchat Ads";
    case "x":
      return "X Ads";
  }
}

export function getPixelPlatformShortLabel(platform: PixelInput): string {
  const norm = normalizePixelPlatform(platform);
  switch (norm) {
    case "meta":
      return "Facebook";
    case "instagram":
      return "Instagram";
    case "google":
      return "GA4";
    case "youtube":
      return "YouTube";
    case "tiktok":
      return "TikTok";
    case "linkedin":
      return "LinkedIn";
    case "pinterest":
      return "Pinterest";
    case "snapchat":
      return "Snapchat";
    case "x":
      return "X Ads";
  }
}

function iconA11yProps(label: string, decorative?: boolean) {
  return decorative
    ? { "aria-hidden": true as const }
    : { role: "img" as const, "aria-label": label };
}

/** Official Facebook brand roundel (#0866FF) with crisp white "f" */
export function FacebookColorIcon({ className = "w-5 h-5", decorative }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} {...iconA11yProps("Facebook Ads", decorative)}>
      <circle cx="12" cy="12" r="11.9" fill="#FFFFFF" />
      <path
        fill="#0866FF"
        d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978.401 0 .955.042 1.468.103a8.68 8.68 0 0 1 1.141.195v3.325a8.623 8.623 0 0 0-.653-.036 26.805 26.805 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.686 1.686 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647Z"
      />
    </svg>
  );
}

/** Backward-compatible alias pointing to the crisp official Facebook Ads color logo */
export function MetaColorIcon({ className = "w-5 h-5", decorative }: IconProps) {
  return <FacebookColorIcon className={className} decorative={decorative} />;
}

/** Official Instagram full-color gradient camera squircle */
export function InstagramColorIcon({ className = "w-5 h-5", decorative }: IconProps) {
  const id = React.useId();
  const gradId = `ig-pixel-grad-${id.replace(/[:]/g, "")}`;
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} {...iconA11yProps("Instagram Ads", decorative)}>
      <defs>
        <radialGradient id={gradId} cx="30%" cy="107%" r="150%">
          <stop offset="0%" stopColor="#FDF497" />
          <stop offset="5%" stopColor="#FDF497" />
          <stop offset="45%" stopColor="#FD5949" />
          <stop offset="60%" stopColor="#D6249F" />
          <stop offset="90%" stopColor="#285AEB" />
        </radialGradient>
      </defs>
      <rect width="24" height="24" rx="5.5" fill={`url(#${gradId})`} />
      <path
        fill="#FFFFFF"
        d="M12 6.865a5.135 5.135 0 1 0 0 10.27 5.135 5.135 0 0 0 0-10.27zm0 8.468a3.333 3.333 0 1 1 0-6.666 3.333 3.333 0 0 1 0 6.666zm6.538-8.671a1.2 1.2 0 1 1-2.4 0 1.2 1.2 0 0 1 2.4 0zM16.95 3.6H7.05A3.454 3.454 0 0 0 3.6 7.05v9.9A3.454 3.454 0 0 0 7.05 20.4h9.9a3.454 3.454 0 0 0 3.45-3.45v-9.9A3.454 3.454 0 0 0 16.95 3.6zm1.65 13.35a1.652 1.652 0 0 1-1.65 1.65h-9.9a1.652 1.652 0 0 1-1.65-1.65v-9.9A1.652 1.652 0 0 1 7.05 5.4h9.9a1.652 1.652 0 0 1 1.65 1.65v9.9z"
      />
    </svg>
  );
}

export function GoogleColorIcon({ className = "w-5 h-5", decorative }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} {...iconA11yProps("Google", decorative)}>
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

/** Official YouTube brand red play badge */
export function YouTubeColorIcon({ className = "w-5 h-5", decorative }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} {...iconA11yProps("YouTube Ads", decorative)}>
      <path
        fill="#FF0000"
        d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
      />
      <polygon points="9.545,15.568 9.545,8.432 15.818,12" fill="#FFFFFF" />
    </svg>
  );
}

export function TikTokColorIcon({ className = "w-5 h-5", decorative }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} {...iconA11yProps("TikTok Ads", decorative)}>
      <path
        fill="#25F4EE"
        d="M19.3 5.4c-1.4-.1-2.7-.8-3.5-1.8-.3-.4-.6-.8-.7-1.3-.2-.5-.3-1-.3-1.6h-2.8v13.2c0 1.9-1.5 3.4-3.4 3.4-1.9 0-3.4-1.5-3.4-3.4 0-1.9 1.5-3.4 3.4-3.4.4 0 .8.1 1.2.2V7.4c-.4 0-.8-.1-1.2-.1-3.6 0-6.6 2.9-6.6 6.6 0 3.6 2.9 6.6 6.6 6.6 3.6 0 6.6-2.9 6.6-6.6V8.3c1.5 1 3.2 1.6 5.1 1.6V6.1c-.4-.1-.7-.3-1-.7z"
      />
      <path
        fill="#FE2C55"
        d="M20.2 6.3c-1.4-.1-2.7-.8-3.5-1.8-.3-.4-.6-.8-.7-1.3-.2-.5-.3-1-.3-1.6h-2.8v13.2c0 1.9-1.5 3.4-3.4 3.4-1.9 0-3.4-1.5-3.4-3.4 0-1.9 1.5-3.4 3.4-3.4.4 0 .8.1 1.2.2V8.3c-.4 0-.8-.1-1.2-.1-3.6 0-6.6 2.9-6.6 6.6 0 3.6 2.9 6.6 6.6 6.6 3.6 0 6.6-2.9 6.6-6.6V9.2c1.5 1 3.2 1.6 5.1 1.6V7c-.4-.1-.7-.3-1-.7z"
      />
      <path
        fill="#111113"
        className="dark:fill-white"
        d="M19.7 5.8c-1.4-.1-2.7-.8-3.5-1.8-.3-.4-.6-.8-.7-1.3-.2-.5-.3-1-.3-1.6h-2.8v13.2c0 1.9-1.5 3.4-3.4 3.4-1.9 0-3.4-1.5-3.4-3.4 0-1.9 1.5-3.4 3.4-3.4.4 0 .8.1 1.2.2V7.8c-.4 0-.8-.1-1.2-.1-3.6 0-6.6 2.9-6.6 6.6 0 3.6 2.9 6.6 6.6 6.6 3.6 0 6.6-2.9 6.6-6.6V8.7c1.5 1 3.2 1.6 5.1 1.6V6.5c-.4-.1-.7-.3-1-.7z"
      />
    </svg>
  );
}

export function LinkedInColorIcon({ className = "w-5 h-5", decorative }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} {...iconA11yProps("LinkedIn Ads", decorative)}>
      <rect width="24" height="24" rx="4.5" fill="#0A66C2" />
      <path
        fill="#FFFFFF"
        d="M19.5 19.5h-3.1v-4.9c0-1.2 0-2.7-1.6-2.7-1.6 0-1.9 1.3-1.9 2.6v5H9.8V9.5h3v1.4h0c.4-.8 1.4-1.6 3-1.6 3.2 0 3.8 2.1 3.8 4.8v5.4zM6.5 8.1c-1 0-1.8-.8-1.8-1.8s.8-1.8 1.8-1.8 1.8.8 1.8 1.8-.8 1.8-1.8 1.8zm1.5 11.4H4.9V9.5H8v10z"
      />
    </svg>
  );
}

/** Official Pinterest brand red roundel (#E60023) with crisp white "P" pin */
export function PinterestColorIcon({ className = "w-5 h-5", decorative }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} {...iconA11yProps("Pinterest Ads", decorative)}>
      <circle cx="12" cy="12" r="11.5" fill="#FFFFFF" />
      <path
        fill="#E60023"
        d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"
      />
    </svg>
  );
}

/** Official Snapchat yellow tile (#FFFC00) with subtle border for light-mode contrast + white ghost */
export function SnapchatColorIcon({ className = "w-5 h-5", decorative }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} {...iconA11yProps("Snapchat Ads", decorative)}>
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="23"
        rx="5"
        fill="#FFFC00"
        stroke="rgba(15,23,42,0.14)"
        strokeWidth="1"
      />
      <g transform="translate(3.2, 3.2) scale(0.733)">
        <path
          fill="#FFFFFF"
          stroke="#000000"
          strokeWidth="1.5"
          strokeLinejoin="round"
          d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.075.045.203.09.401.09.3-.016.659-.12 1.033-.301.165-.088.344-.104.464-.104.182 0 .359.029.509.09.45.149.734.479.734.838.015.449-.39.839-1.213 1.168-.089.029-.209.075-.344.119-.45.135-1.139.36-1.333.81-.09.224-.061.524.12.868l.015.015c.06.136 1.526 3.475 4.791 4.014.255.044.435.27.42.509 0 .075-.015.149-.045.225-.24.569-1.273.988-3.146 1.271-.059.091-.12.375-.164.57-.029.179-.074.36-.134.553-.076.271-.27.405-.555.405h-.03c-.135 0-.313-.031-.538-.074-.36-.075-.765-.135-1.273-.135-.3 0-.599.015-.913.074-.6.104-1.123.464-1.723.884-.853.599-1.826 1.288-3.294 1.288-.06 0-.119-.015-.18-.015h-.149c-1.468 0-2.427-.675-3.279-1.288-.599-.42-1.107-.779-1.707-.884-.314-.045-.629-.074-.928-.074-.54 0-.958.089-1.272.149-.211.043-.391.074-.54.074-.374 0-.523-.224-.583-.42-.061-.192-.09-.389-.135-.567-.046-.181-.105-.494-.166-.57-1.918-.222-2.95-.642-3.189-1.226-.031-.063-.052-.15-.055-.225-.015-.243.165-.465.42-.509 3.264-.54 4.73-3.879 4.791-4.02l.016-.029c.18-.345.224-.645.119-.869-.195-.434-.884-.658-1.332-.809-.121-.029-.24-.074-.346-.119-1.107-.435-1.257-.93-1.197-1.273.09-.479.674-.793 1.168-.793.146 0 .27.029.383.074.42.194.789.3 1.104.3.234 0 .384-.06.465-.105l-.046-.569c-.098-1.626-.225-3.651.307-4.837C7.392 1.077 10.739.807 11.727.807l.419-.015h.06z"
        />
      </g>
    </svg>
  );
}

/** Official X (Twitter) crisp monochrome tile with subtle border for dark-mode visibility */
export function XColorIcon({ className = "w-5 h-5", decorative }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={cn("shrink-0", className)} {...iconA11yProps("X Ads", decorative)}>
      <rect
        x="0.5"
        y="0.5"
        width="23"
        height="23"
        rx="5"
        fill="#000000"
        stroke="rgba(148,163,184,0.35)"
        strokeWidth="1"
      />
      <path
        fill="#FFFFFF"
        d="M16.97 5.2h2.25l-4.91 5.61L20.09 18.8h-4.53l-3.54-4.63-4.06 4.63H5.71l5.25-6.01L5.42 5.2h4.64l3.2 4.24L16.97 5.2zm-.79 12.22h1.25L9.38 6.51H8.04l8.14 10.91z"
      />
    </svg>
  );
}

export function BrandColorLogo({
  platform,
  className = "w-5 h-5",
  decorative,
}: {
  platform: PixelInput;
  className?: string;
  decorative?: boolean;
}) {
  const normalized = normalizePixelPlatform(platform);
  switch (normalized) {
    case "meta":
      return <FacebookColorIcon className={className} decorative={decorative} />;
    case "instagram":
      return <InstagramColorIcon className={className} decorative={decorative} />;
    case "google":
      return <GoogleColorIcon className={className} decorative={decorative} />;
    case "youtube":
      return <YouTubeColorIcon className={className} decorative={decorative} />;
    case "tiktok":
      return <TikTokColorIcon className={className} decorative={decorative} />;
    case "linkedin":
      return <LinkedInColorIcon className={className} decorative={decorative} />;
    case "pinterest":
      return <PinterestColorIcon className={className} decorative={decorative} />;
    case "snapchat":
      return <SnapchatColorIcon className={className} decorative={decorative} />;
    case "x":
      return <XColorIcon className={className} decorative={decorative} />;
    default:
      return null;
  }
}

export function PixelBrandLogo({
  platform,
  className = "w-4.5 h-4.5",
  decorative,
}: {
  platform: PixelInput;
  className?: string;
  decorative?: boolean;
}) {
  return <BrandColorLogo platform={platform} className={className} decorative={decorative} />;
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
      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
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
  pixels?: PixelInput[];
  className?: string;
}) {
  if (!pixels || !Array.isArray(pixels) || pixels.length === 0) return null;

  const platforms = Array.from(new Set(pixels.map((p) => normalizePixelPlatform(p))));

  if (platforms.length === 0) return null;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-white/[0.04] border border-zinc-200 dark:border-white/10 text-xs shadow-2xs",
        className
      )}
      title={`Retargeting actif : ${platforms.map(getPixelPlatformShortLabel).join(", ")}`}
    >
      {platforms.map((platform, idx) => (
        <React.Fragment key={platform}>
          {idx > 0 && <span className="w-[1px] h-2.5 bg-zinc-300 dark:bg-zinc-700" />}
          <PixelBrandLogo platform={platform} className="w-3.5 h-3.5" />
        </React.Fragment>
      ))}
    </div>
  );
}

/**
 * PixelLogosOnlyList
 * Renders purely the platform logos with zero background container, zero border, and hover tooltips.
 */
export function PixelLogosOnlyList({
  pixels,
  className,
}: {
  pixels?: PixelInput[];
  className?: string;
}) {
  if (!pixels || !Array.isArray(pixels) || pixels.length === 0) return null;

  const platformMap = new Map<
    CanonicalPixelPlatform,
    { label: string; platform: CanonicalPixelPlatform }
  >();

  pixels.forEach((p) => {
    const platform = normalizePixelPlatform(p);
    platformMap.set(platform, {
      label: getPixelPlatformLabel(platform),
      platform,
    });
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
