"use client";

import React, { useRef } from "react";
import { motion } from "motion/react";
import { HeroShortener } from "@/components/marketing/hero-shortener";
import { HeroBackground } from "@/components/ui/tailwind-css-background-snippet";
import { FlipWords } from "@/components/ui/flip-words";
import { VariableProximity } from "@/components/ui/VariableProximity";
import { BrandScroller } from "@/components/ui/brand-scoller";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
} from "@/components/marketing/swiss-frame";

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
        <div className="my-auto py-5 sm:py-14 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0.92, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="text-[clamp(52px,13.8vw,64px)] sm:text-[clamp(56px,7.2vw,88px)] font-bold tracking-[-0.04em] leading-[1.03] sm:leading-[1.02] text-[#09090B] dark:text-white max-w-[1020px] text-balance"
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
            className="mt-5 sm:mt-6 relative max-w-[660px] mx-auto text-[18.5px] sm:text-[18.5px] leading-[1.58] sm:leading-[1.6] text-[#3F3F46] dark:text-zinc-300 text-pretty cursor-default"
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
            className="mt-7 sm:mt-10 w-full"
          >
            <HeroShortener />
          </motion.div>
        </div>
      </SectionRailFrame>

      {/* Below-the-Fold Two-Bar Logo Band powered by BrandScroller (react-icons, 32px, zero hover clipping) */}
      <div
        role="region"
        aria-label="Social networks and ad pixel platforms tracked by LShorter"
        className="relative z-10 w-full mt-12 sm:mt-16 pt-7 pb-5 sm:pt-8 sm:pb-6 border-t border-b border-[#6366F1]/25 dark:border-white/[0.12] bg-white/45 dark:bg-[#0B0A16]/70 flex flex-col justify-center gap-12 sm:gap-16"
      >
        <p className="text-center font-sans text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.22em] text-[#312E81]/65 dark:text-[#C7D2FE]/65 select-none px-4">
          Track your links everywhere — whether in paid ads or your daily social posts
        </p>

        <BrandScroller iconSize={32} duration="64s" />
      </div>
    </section>
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
