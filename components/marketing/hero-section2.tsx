"use client";

import React, { useRef } from "react";
import { motion } from "motion/react";
import { HeroShortener } from "@/components/marketing/hero-shortener";
import { HeroBackground } from "@/components/ui/tailwind-css-background-snippet";
import { FlipWords } from "@/components/ui/flip-words";
import { VariableProximity } from "@/components/ui/VariableProximity";
import { LogoLoop, type LogoItem } from "@/components/ui/LogoLoop";
import {
  BRAND_LOGOS,
  type BrandLogoId,
} from "@/components/qr/qr-brand-logos";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
} from "@/components/marketing/swiss-frame";

/**
 * Official verified brand logos from the QR Studio registry (`components/qr/qr-brand-logos.ts`),
 * rendered in a uniform monochrome silhouette style (without inline labels, excluding WhatsApp)
 * matching the reference strip design.
 */
const HERO_LOOP_BRANDS: Array<{
  id: BrandLogoId;
  label: string;
}> = [
  { id: "twitter", label: "X (Twitter)" },
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "youtube", label: "YouTube" },
  { id: "reddit", label: "Reddit" },
  { id: "twitch", label: "Twitch" },
  { id: "spotify", label: "Spotify" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "threads", label: "Threads" },
  { id: "telegram", label: "Telegram" },
  { id: "discord", label: "Discord" },
  { id: "snapchat", label: "Snapchat" },
  { id: "facebook", label: "Facebook" },
  { id: "meta_ads", label: "Meta Ads" },
  { id: "google_ads", label: "Google Ads" },
  { id: "google_analytics", label: "Google Analytics" },
  { id: "hubspot", label: "HubSpot" },
];

function MonochromeBrandIcon({ id }: { id: BrandLogoId }) {
  const spec = BRAND_LOGOS[id];
  if (spec.pathOnly) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="w-[22px] h-[22px] shrink-0 fill-current"
        aria-hidden="true"
      >
        <path d={spec.pathOnly} fill="currentColor" />
      </svg>
    );
  }
  const monochromeBody = spec.body.replace(
    /fill="#[0-9a-fA-F]{3,8}"/g,
    'fill="currentColor"'
  );
  return (
    <svg
      viewBox={spec.viewBox}
      className="w-[22px] h-[22px] shrink-0 fill-current"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: monochromeBody }}
    />
  );
}

const MONOCHROME_SOCIAL_AND_ADS_LOGOS: LogoItem[] = HERO_LOOP_BRANDS.map(
  ({ id, label }) => ({
    title: label,
    ariaLabel: label,
    node: (
      <span className="inline-flex items-center justify-center text-[#312E81]/45 dark:text-[#C7D2FE]/45 hover:text-[#312E81]/85 dark:hover:text-white transition-colors duration-200">
        <MonochromeBrandIcon id={id} />
      </span>
    ),
  })
);

export function HeroSection() {
  const proximityContainerRef = useRef<HTMLDivElement | null>(null);

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

          {/* React Bits <VariableProximity /> Interactive Subtitle below Big Title */}
          <motion.div
            ref={proximityContainerRef}
            initial={{ opacity: 0.92, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04, ease: EASE_OUT_EXPO }}
            className="mt-5 sm:mt-6 relative max-w-[660px] mx-auto text-[16.5px] sm:text-[18.5px] leading-[1.6] text-[#3F3F46] dark:text-zinc-300 text-pretty cursor-default"
          >
            <VariableProximity
              label="Turn every click into a smart destination — route visitors by country or device in under 12ms, lock private links with PathLock™, and track real-time revenue attribution."
              fromFontVariationSettings="'wght' 400, 'opsz' 12"
              toFontVariationSettings="'wght' 900, 'opsz' 40"
              containerRef={proximityContainerRef}
              radius={95}
              falloff="gaussian"
              smoothing={0.18}
              scale={1.04}
              lift={0.03}
              idleWave={false}
            />
          </motion.div>

          {/* Primary Interactive Guest Shortener Command Bar + Cascading Two-Bar Link Row */}
          <motion.div
            initial={{ opacity: 0.95, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-8 sm:mt-10 w-full"
          >
            <HeroShortener />
          </motion.div>
        </div>
      </SectionRailFrame>

      {/* Bottom 90px Two-Bar Band with Interior Tracking Caption & Monochrome <LogoLoop /> */}
      <div className="relative z-10 w-full mt-auto h-[90px] border-t border-b border-[#6366F1]/25 dark:border-white/[0.12] bg-white/30 dark:bg-[#09090B]/40 backdrop-blur-md flex flex-col justify-center gap-2.5">
        <p className="text-center font-sans text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.22em] text-[#312E81]/60 dark:text-[#C7D2FE]/60 select-none px-4">
          Track your links everywhere — whether in paid ads or your daily social posts
        </p>

        <div className="w-full flex items-center">
          <LogoLoop
            logos={MONOCHROME_SOCIAL_AND_ADS_LOGOS}
            speed={34}
            direction="left"
            logoHeight={22}
            gap={56}
            hoverSpeed={10}
            scaleOnHover
            fadeOut
            fadeOutWidth={0.14}
            labels="none"
            intro={false}
            draggable={false}
            ariaLabel="Social networks and ad pixel platforms tracked by LShorter"
          />
        </div>
      </div>
    </section>
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
