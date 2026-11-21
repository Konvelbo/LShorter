"use client";

import React, { useRef } from "react";
import { motion } from "motion/react";
import { HeroShortener } from "@/components/marketing/hero-shortener";
import { HeroBackground } from "@/components/ui/tailwind-css-background-snippet";
import { FlipWords } from "@/components/ui/flip-words";
import { VariableProximity } from "@/components/ui/VariableProximity";
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
 * rendered in a uniform monochrome silhouette style (32px, without inline labels, excluding WhatsApp).
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

const MonochromeBrandIcon = React.memo(function MonochromeBrandIcon({
  id,
}: {
  id: BrandLogoId;
}) {
  const spec = BRAND_LOGOS[id];
  if (spec.pathOnly) {
    return (
      <svg
        viewBox="0 0 24 24"
        className="w-[32px] h-[32px] shrink-0 fill-current"
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
      className="w-[32px] h-[32px] shrink-0 fill-current"
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: monochromeBody }}
    />
  );
});

const LogoStripCopy = React.memo(function LogoStripCopy({
  copyKey,
  ariaHidden,
}: {
  copyKey: string;
  ariaHidden?: boolean;
}) {
  return (
    <ul
      aria-hidden={ariaHidden || undefined}
      className="flex items-center gap-16 sm:gap-20 pr-16 sm:pr-20 m-0 p-0 list-none shrink-0"
    >
      {HERO_LOOP_BRANDS.map(({ id, label }) => (
        <li key={`${copyKey}-${id}`} className="shrink-0">
          <span
            title={label}
            aria-label={ariaHidden ? undefined : label}
            className="inline-flex items-center justify-center text-[#312E81]/45 dark:text-[#C7D2FE]/45 hover:text-[#312E81]/90 dark:hover:text-white hover:scale-110 transition-all duration-200"
          >
            <MonochromeBrandIcon id={id} />
          </span>
        </li>
      ))}
    </ul>
  );
});

export function HeroSection() {
  const proximityContainerRef = useRef<HTMLDivElement | null>(null);

  return (
    <section
      id="hero"
      className="relative isolate w-full overflow-x-clip pt-20 sm:pt-24 flex flex-col transition-colors duration-300"
    >
      {/* Background Pattern from tailwind-css-background-snippet */}
      <HeroBackground />

      {/* Full-viewport Hero Stage so the logo strip stays below the initial Hero fold */}
      <SectionRailFrame className="relative z-30 min-h-[calc(100svh-80px)] sm:min-h-[calc(100svh-96px)] flex flex-col justify-center">
        <div className="my-auto py-10 sm:py-14 flex flex-col items-center text-center">
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

          {/* React Bits <VariableProximity /> Interactive Subtitle (zero-reflow GRAD axis + scoped pointer) */}
          <motion.div
            ref={proximityContainerRef}
            initial={{ opacity: 0.92, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04, ease: EASE_OUT_EXPO }}
            className="mt-5 sm:mt-6 relative max-w-[660px] mx-auto text-[16.5px] sm:text-[18.5px] leading-[1.6] text-[#3F3F46] dark:text-zinc-300 text-pretty cursor-default"
          >
            <VariableProximity
              label="Turn every click into a smart destination — route visitors by country or device in under 12ms, lock private links with PathLock™, and track real-time revenue attribution."
              fromFontVariationSettings="'wght' 450, 'GRAD' 0"
              toFontVariationSettings="'wght' 450, 'GRAD' 150"
              containerRef={proximityContainerRef}
              radius={90}
              falloff="gaussian"
              smoothing={0.16}
              scale={1.06}
              lift={0.04}
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

      {/* Below-the-Fold Tall Two-Bar Logo Band (pure GPU CSS marquee, 32px icons, slow 68s drift, zero JS lag) */}
      <div className="relative z-10 w-full mt-12 sm:mt-16 py-12 sm:py-16 min-h-[220px] sm:min-h-[250px] border-t border-b border-[#6366F1]/25 dark:border-white/[0.12] bg-white/45 dark:bg-[#0B0A16]/70 flex flex-col justify-center gap-12 sm:gap-14">
        <p className="text-center font-sans text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.22em] text-[#312E81]/65 dark:text-[#C7D2FE]/65 select-none px-4">
          Track your links everywhere — whether in paid ads or your daily social posts
        </p>

        <div
          role="region"
          aria-label="Social networks and ad pixel platforms tracked by LShorter"
          className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]"
        >
          <div className="hero-logo-marquee-track">
            <LogoStripCopy copyKey="copy-a" />
            <LogoStripCopy copyKey="copy-b" ariaHidden />
          </div>
        </div>
      </div>
    </section>
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
