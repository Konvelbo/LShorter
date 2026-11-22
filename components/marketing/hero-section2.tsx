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
      className="relative isolate w-full overflow-x-clip pt-[74px] sm:pt-[86px] flex flex-col transition-colors duration-300"
    >
      {/* Background Pattern from tailwind-css-background-snippet */}
      <HeroBackground />

      {/* Fluid 2D-responsive Hero Stage — fits cleanly above the fold on every screen size (360x640 -> 2560x1440) */}
      <SectionRailFrame className="relative z-30 min-h-[calc(100svh-74px)] sm:min-h-[calc(100svh-86px)] flex flex-col justify-center">
        <div className="my-auto py-[clamp(12px,2.8svh,44px)] flex flex-col items-center text-center w-full">
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.05, ease: EASE_OUT_EXPO }}
            className="flex flex-col items-center text-center text-[clamp(30px,min(9.2vw,6.8svh),64px)] sm:text-[clamp(46px,min(7.2vw,8.6svh),86px)] font-bold tracking-[-0.04em] leading-[1.03] sm:leading-[1.02] text-[#09090B] dark:text-white will-change-[transform,opacity]"
          >
            <span className="block whitespace-nowrap">Short links you</span>
            <span className="inline-flex items-baseline justify-center whitespace-nowrap">
              <span>actually</span>
              <span aria-hidden="true">&nbsp;</span>
              <FlipWords
                words={["control.", "manage.", "protect.", "monetize."]}
                className="px-0 text-[#0066FF] dark:text-[#60A5FA]"
              />
            </span>
          </motion.h1>

          {/* React Bits <VariableProximity /> Interactive Subtitle (zero-reflow GRAD axis + scoped pointer) */}
          <motion.div
            ref={proximityContainerRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.22, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(12px,2.4svh,26px)] relative max-w-[660px] mx-auto text-[clamp(14.5px,min(4.6vw,2.2svh),18.5px)] sm:text-[clamp(16px,2.1svh,18.5px)] leading-[1.52] sm:leading-[1.6] text-[#3F3F46] dark:text-zinc-300 text-pretty cursor-default will-change-[transform,opacity]"
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
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.36, ease: EASE_OUT_EXPO }}
            className="mt-[clamp(16px,3.2svh,38px)] w-full will-change-[transform,opacity]"
          >
            <HeroShortener />
          </motion.div>
        </div>
      </SectionRailFrame>

      {/* Below-the-Fold Two-Bar Logo Band powered by BrandScroller (react-icons, 32px, zero hover clipping) */}
      <div
        role="region"
        aria-label="Social networks and ad pixel platforms tracked by LShorter"
        className="relative z-10 w-full mt-12 sm:mt-16 pt-7 pb-5 sm:pt-8 sm:pb-6 border-t border-b border-[#0066FF]/20 dark:border-white/[0.12] bg-white/50 dark:bg-[#070B14]/75 flex flex-col justify-center gap-12 sm:gap-16"
      >
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.48, ease: EASE_OUT_EXPO }}
          className="text-center font-sans text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.22em] text-[#0F2952]/70 dark:text-[#BFDBFE]/70 select-none px-4"
        >
          Track your links everywhere — whether in paid ads or your daily social posts
        </motion.p>

        <BrandScroller iconSize={32} duration="64s" />
      </div>
    </section>
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
