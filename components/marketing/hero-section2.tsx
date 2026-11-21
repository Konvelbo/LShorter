"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Play } from "lucide-react";
import { HeroShortener } from "@/components/marketing/hero-shortener";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
} from "@/components/marketing/swiss-frame";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full overflow-x-clip bg-[#FFFFFF] dark:bg-[#09090B] pt-24 sm:pt-28 transition-colors duration-300"
    >
      <SectionRailFrame className="min-h-[calc(100svh-96px)] sm:min-h-[calc(100svh-112px)] flex flex-col justify-center">
        {/* Main Centered Hero Focus */}
        <div className="py-12 sm:py-20 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0.92, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="text-[clamp(40px,5.6vw,68px)] font-semibold tracking-[-0.035em] leading-[1.04] text-[#09090B] dark:text-white max-w-[780px] text-balance"
          >
            Short links you actually control.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0.92, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04, ease: EASE_OUT_EXPO }}
            className="mt-5 text-[16.5px] sm:text-[18.5px] leading-[1.55] text-[#52525B] dark:text-zinc-400 max-w-[560px] text-pretty"
          >
            Route visitors by country or device in under 12ms, lock private
            demos with PathLock™, and attribute Stripe revenue live.
          </motion.p>

          {/* Clean Live Guest Shortener */}
          <motion.div
            initial={{ opacity: 0.95, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-9 sm:mt-10 w-full"
          >
            <HeroShortener />
          </motion.div>

          <div className="mt-6">
            <Link
              href="/#demo-video"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-[#52525B] dark:text-zinc-400 hover:text-[#0066FF] dark:hover:text-[#5294FF] transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#0066FF] dark:text-[#5294FF]" />
              <span>Watch the 6-minute walkthrough</span>
            </Link>
          </div>
        </div>
      </SectionRailFrame>
    </section>
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
