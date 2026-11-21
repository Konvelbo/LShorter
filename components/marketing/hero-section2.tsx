"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Play, ShieldCheck, Zap, Globe2 } from "lucide-react";
import { HeroShortener } from "@/components/marketing/hero-shortener";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full overflow-hidden bg-[#FFFFFF] dark:bg-[#09090B] pt-28 sm:pt-36 md:pt-40 pb-16 sm:pb-24 px-4 sm:px-6 transition-colors duration-300"
    >
      {/* Architectural Subtle Grid (fades smoothly to edges) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(16,24,40,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(16,24,40,0.045)_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_20%,#000_45%,transparent_100%)]"
      />

      {/* Calibrated Cyber Blue (#0066FF) Radial Ambient Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-28 left-1/2 -translate-x-1/2 w-[780px] h-[420px] rounded-full bg-[#0066FF]/[0.09] dark:bg-[#0066FF]/[0.15] blur-[110px]"
      />

      <div className="relative z-10 max-w-[980px] mx-auto flex flex-col items-center text-center">
        {/* 1. Entrance Badge (60ms) */}
        <motion.div
          initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.45, delay: 0.06, ease: EASE_OUT_EXPO }}
          className="mb-6"
        >
          <div className="inline-flex items-center flex-nowrap gap-2 sm:gap-2.5 px-3 sm:px-3.5 py-1.5 rounded-[10px] border border-[#E4E7EC] dark:border-white/12 bg-white/90 dark:bg-[#141418]/90 backdrop-blur-md shadow-2xs text-[11.5px] sm:text-[12.5px] max-w-full">
            <span className="inline-flex items-center gap-1.5 font-medium text-[#475467] dark:text-zinc-300 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF] shrink-0" />
              <span className="sm:hidden">Sub-12ms Edge Links</span>
              <span className="hidden sm:inline">Sub-12ms Edge Link Infrastructure</span>
            </span>
            <span className="w-px h-3.5 bg-[#E4E7EC] dark:bg-white/15 shrink-0" aria-hidden="true" />
            <Link
              href="/#demo-video"
              className="inline-flex items-center gap-1 font-semibold text-[#0066FF] dark:text-[#5294FF] hover:underline whitespace-nowrap shrink-0"
            >
              <Play className="w-3 h-3 fill-current shrink-0" />
              <span>Watch 6-min tour</span>
            </Link>
          </div>
        </motion.div>

        {/* 2. Headline H1 — Zero Jargon, Two-Tone Precision (135ms) */}
        <motion.h1
          initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.52, delay: 0.13, ease: EASE_OUT_EXPO }}
          className="text-[36px] xs:text-[42px] sm:text-[58px] md:text-[66px] font-bold tracking-[-0.04em] leading-[1.05] text-[#101828] dark:text-white max-w-[860px]"
        >
          Short links you actually{" "}
          <span className="text-[#0066FF] dark:text-[#5294FF]">control.</span>
        </motion.h1>

        {/* 3. Clear 1-Sentence Subtitle (210ms) */}
        <motion.p
          initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.5, delay: 0.21, ease: EASE_OUT_EXPO }}
          className="mt-5 text-[16px] sm:text-[18.5px] leading-[1.6] text-[#475467] dark:text-zinc-400 max-w-[650px] font-normal"
        >
          Send every visitor to the right page by country or device, lock private
          demos with PathLock™, and see who clicks in real time.
        </motion.p>

        {/* 4. Interactive Live Link Shortener Console (285ms) */}
        <motion.div
          initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ duration: 0.52, delay: 0.28, ease: EASE_OUT_EXPO }}
          className="mt-9 w-full"
        >
          <HeroShortener />
        </motion.div>

        {/* 5. Clean Architectural 3-Point Capability Strip (360ms) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.36, ease: EASE_OUT_EXPO }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5 text-[13px] font-medium text-[#475467] dark:text-zinc-400"
        >
          <span className="inline-flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#5294FF]" />
            <span>&lt; 12ms redirects across 310+ edge PoPs</span>
          </span>
          <span className="hidden sm:inline text-[#D0D5DD] dark:text-zinc-700" aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#5294FF]" />
            <span>PathLock™ perimeter &amp; click-cap security</span>
          </span>
          <span className="hidden sm:inline text-[#D0D5DD] dark:text-zinc-700" aria-hidden="true">•</span>
          <span className="inline-flex items-center gap-2">
            <Globe2 className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#5294FF]" />
            <span>Cookie-free analytics &amp; revenue attribution</span>
          </span>
        </motion.div>
      </div>
    </section>
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
