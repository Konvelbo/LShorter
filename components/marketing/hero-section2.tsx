"use client";

import React from "react";
import { motion } from "motion/react";
import { HeroShortener } from "@/components/marketing/hero-shortener";
import { HeroBackground } from "@/components/ui/tailwind-css-background-snippet";
import { FlipWords } from "@/components/ui/flip-words";
import { TechText } from "@/components/ui/TechText";
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
      className="relative isolate w-full overflow-x-clip pt-20 sm:pt-24 min-h-svh flex flex-col justify-between transition-colors duration-300"
    >
      {/* Background Pattern from tailwind-css-background-snippet */}
      <HeroBackground />

      <SectionRailFrame className="relative z-30 flex-1 flex flex-col justify-center">
        {/* Centered Hero Stage */}
        <div className="my-auto pt-8 sm:pt-12 pb-8 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0.92, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="text-[clamp(48px,7.2vw,88px)] font-bold tracking-[-0.04em] leading-[1.02] text-[#09090B] dark:text-white max-w-[1020px] text-balance"
          >
            Short links you actually{" "}
            <FlipWords
              words={["control.", "manage.", "protect.", "monetize."]}
              className="text-[#4F46E5] dark:text-[#A5B4FC]"
            />
          </motion.h1>

          {/* React Bits <TechText /> Interactive Subtitle below Big Title */}
          <motion.div
            initial={{ opacity: 0.92, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04, ease: EASE_OUT_EXPO }}
            className="mt-5 sm:mt-6 w-full max-w-[780px] mx-auto flex flex-col items-center text-[#27272A] dark:text-zinc-200"
          >
            <div className="w-full h-[42px] sm:h-[48px] relative">
              <TechText
                text="Route visitors by country or device in under 12ms,"
                fontWeight={500}
                fontSize={22}
                letterSpacing={-0.02}
                reveal="letter"
                dashLength={3}
                dashGap={2}
                specks={12}
                accentColor="#6366F1"
                intro="none"
                clickKick
                guides={false}
              />
            </div>
            <div className="w-full h-[42px] sm:h-[48px] relative -mt-2">
              <TechText
                text="lock private links with PathLock™ & track live revenue."
                fontWeight={500}
                fontSize={22}
                letterSpacing={-0.02}
                reveal="letter"
                dashLength={3}
                dashGap={2}
                specks={12}
                accentColor="#6366F1"
                intro="none"
                clickKick
                guides={false}
                speed={0.85}
              />
            </div>
          </motion.div>

          {/* Primary Interactive Guest Shortener Command Bar + Cascading Two-Bar Link Row */}
          <motion.div
            initial={{ opacity: 0.95, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-7 sm:mt-9 w-full"
          >
            <HeroShortener />
          </motion.div>
        </div>
      </SectionRailFrame>

      {/* Bottom Tracking Caption (with subtle blur) + 90px Two-Bar Auto-Scrolling <LogoLoop /> */}
      <div className="relative z-10 w-full mt-auto pt-4">
        <div className="mb-3.5 flex justify-center px-4">
          <span className="inline-flex items-center px-4 py-1.5 rounded-[8px] bg-white/40 dark:bg-[#11131A]/50 backdrop-blur-md border border-[#6366F1]/25 dark:border-white/[0.10] text-[12.5px] sm:text-[13.5px] font-medium text-[#312E81]/95 dark:text-[#E0E7FF]/90 text-center shadow-[0_4px_16px_rgba(99,102,241,0.08)]">
            Track your links everywhere — whether in paid ads or your daily social posts
          </span>
        </div>

        <div className="w-full h-[90px] flex items-center border-t-2 border-b-2 border-[#6366F1]/35 dark:border-[#A5B4FC]/25 bg-white/30 dark:bg-[#09090B]/45 backdrop-blur-md text-[#09090B] dark:text-white">
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
      </div>
    </section>
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
