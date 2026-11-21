"use client";

import React from "react";
import { motion } from "motion/react";
import { HeroShortener } from "@/components/marketing/hero-shortener";
import { HeroBackground } from "@/components/ui/tailwind-css-background-snippet";
import { LogoLoop, type LogoItem } from "@/components/ui/LogoLoop";
import {
  BRAND_LOGOS,
  type BrandLogoId,
} from "@/components/qr/qr-brand-logos";
import { BrandLogoSvg } from "@/components/qr/qr-icons";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
} from "@/components/marketing/swiss-frame";

/**
 * Official verified brand logos directly from the QR Studio registry (`components/qr/qr-brand-logos.ts`
 * — Simple Icons & @iconify-json/logos), excluding WhatsApp per user request.
 */
const HERO_LOOP_BRANDS: Array<{
  id: BrandLogoId;
  label: string;
  overrideColor?: string;
}> = [
  { id: "google_ads", label: "Google Ads", overrideColor: "#4285F4" },
  { id: "meta_ads", label: "Meta Ads", overrideColor: "#0467DF" },
  { id: "instagram", label: "Instagram", overrideColor: "#FF0069" },
  { id: "tiktok", label: "TikTok Ads" },
  { id: "linkedin", label: "LinkedIn Ads", overrideColor: "#0A66C2" },
  { id: "youtube", label: "YouTube", overrideColor: "#FF0000" },
  { id: "twitter", label: "X (Twitter)" },
  { id: "facebook", label: "Facebook Pixel", overrideColor: "#0866FF" },
  { id: "google_analytics", label: "Google Analytics", overrideColor: "#F9AB00" },
  { id: "snapchat", label: "Snapchat Ads", overrideColor: "#FFFC00" },
  { id: "reddit", label: "Reddit Ads", overrideColor: "#FF4500" },
  { id: "threads", label: "Threads" },
  { id: "telegram", label: "Telegram", overrideColor: "#26A5E4" },
  { id: "discord", label: "Discord", overrideColor: "#5865F2" },
  { id: "twitch", label: "Twitch", overrideColor: "#9146FF" },
  { id: "hubspot", label: "HubSpot", overrideColor: "#FF7A59" },
];

const COLORED_SOCIAL_AND_ADS_LOGOS: LogoItem[] = HERO_LOOP_BRANDS.map(
  ({ id, label, overrideColor }) => {
    const baseSpec = BRAND_LOGOS[id];
    const spec =
      overrideColor && id === "linkedin"
        ? {
            ...baseSpec,
            brandColor: overrideColor,
            body: baseSpec.body.replace('fill="#000000"', `fill="${overrideColor}"`),
          }
        : baseSpec;

    return {
      title: label,
      hoverColor: overrideColor || baseSpec.brandColor,
      node: <BrandLogoSvg spec={spec} className="w-7 h-7 shrink-0" />,
    };
  }
);

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative isolate w-full overflow-x-clip pt-20 sm:pt-24 transition-colors duration-300"
    >
      {/* Background Pattern from tailwind-css-background-snippet */}
      <HeroBackground />

      <SectionRailFrame className="relative z-10 min-h-[calc(100svh-80px)] sm:min-h-[calc(100svh-96px)] flex flex-col justify-between">
        {/* Centered Hero Stage */}
        <div className="my-auto pt-8 sm:pt-12 pb-6 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0.92, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="text-[clamp(48px,7.2vw,88px)] font-bold tracking-[-0.04em] leading-[0.98] text-[#09090B] dark:text-white max-w-[980px] text-balance"
          >
            Short links you actually control.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0.92, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04, ease: EASE_OUT_EXPO }}
            className="mt-5 sm:mt-6 text-[16.5px] sm:text-[19px] leading-[1.55] text-[#3F3F46] dark:text-zinc-300 max-w-[660px] text-pretty"
          >
            Turn every click into a smart destination — route visitors by
            country or device in under 12ms, lock private links with PathLock™,
            and track real-time revenue attribution.
          </motion.p>

          {/* Primary Interactive Guest Shortener Command Bar + Cascading Two-Bar Link Rows */}
          <motion.div
            initial={{ opacity: 0.95, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-8 sm:mt-10 w-full"
          >
            <HeroShortener />
          </motion.div>
        </div>

        {/* Bottom Auto-Scrolling React Bits <LogoLoop /> using official QR Studio BrandLogos */}
        <div className="w-full pt-8 pb-5 sm:pb-6 mt-auto text-[#09090B] dark:text-white">
          <LogoLoop
            logos={COLORED_SOCIAL_AND_ADS_LOGOS}
            speed={38}
            direction="left"
            logoHeight={28}
            gap={48}
            hoverSpeed={10}
            scaleOnHover
            fadeOut
            fadeOutWidth={0.12}
            labels="inline"
            ariaLabel="Social networks and ad pixel platforms tracked by LShorter"
          />
        </div>
      </SectionRailFrame>
    </section>
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
