"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Play, ShieldCheck, Zap, Globe2 } from "lucide-react";
import { HeroShortener } from "@/components/marketing/hero-shortener";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
  CrosshairNode,
} from "@/components/marketing/swiss-frame";

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative w-full overflow-x-clip bg-[#FFFFFF] dark:bg-[#09090B] pt-16 sm:pt-20 transition-colors duration-300"
    >
      {/* Subtle Optical Dot-Matrix Telemetry Field (zero generic blur blobs or 44px square grids) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(16,24,40,0.09)_1px,transparent_1px)] dark:bg-[radial-gradient(rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px] [mask-image:radial-gradient(ellipse_78%_58%_at_50%_24%,#000_35%,transparent_100%)]"
      />

      <SectionRailFrame className="relative z-10 px-4 sm:px-8 pt-10 sm:pt-14 pb-16 sm:pb-24">
        {/* Top Swiss Telemetry Bar + Optical Ruler Ticks */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.42, delay: 0.04, ease: EASE_OUT_EXPO }}
          className="max-w-[920px] mx-auto mb-9 sm:mb-12"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#E4E7EC] dark:border-white/[0.08] font-mono text-[11px] uppercase tracking-[0.14em] text-[#667085] dark:text-zinc-400">
            <div className="inline-flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-[2px] bg-[#0066FF]" aria-hidden="true" />
              <span className="font-semibold text-[#101828] dark:text-zinc-200">
                00 / EDGE SWITCHBOARD
              </span>
              <span className="hidden sm:inline text-[#D0D5DD] dark:text-zinc-700">|</span>
              <span className="hidden sm:inline text-[#0066FF] dark:text-[#5294FF] font-semibold">
                SUB-12MS · 310+ POPS
              </span>
            </div>

            <Link
              href="/#demo-video"
              className="inline-flex items-center gap-1.5 font-semibold text-[#0066FF] dark:text-[#5294FF] hover:underline whitespace-nowrap shrink-0"
            >
              <Play className="w-3 h-3 fill-current shrink-0" />
              <span>Watch 6-min tour</span>
            </Link>
          </div>

          {/* Subtle Optical Scale Tick Marks */}
          <div
            aria-hidden="true"
            className="hidden sm:flex items-center justify-between px-1 pt-1.5 opacity-55"
          >
            {Array.from({ length: 17 }).map((_, i) => (
              <span
                key={i}
                className={`w-px bg-[#D0D5DD] dark:bg-white/20 ${
                  i % 4 === 0 ? "h-2.5 bg-[#0066FF]/60 dark:bg-[#5294FF]/50" : "h-1.5"
                }`}
              />
            ))}
          </div>
        </motion.div>

        {/* Monumental Swiss Display Hero Copy */}
        <div className="max-w-[920px] mx-auto flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.52, delay: 0.12, ease: EASE_OUT_EXPO }}
            className="text-[clamp(42px,6.2vw,76px)] font-bold tracking-[-0.045em] leading-[0.98] text-[#09090B] dark:text-white max-w-[880px]"
          >
            Short links you actually{" "}
            <span className="relative inline-block text-[#0066FF] dark:text-[#5294FF]">
              control.
              <span
                aria-hidden="true"
                className="hidden sm:block absolute -bottom-1.5 left-0 right-0 h-[2px] bg-[#0066FF]/35 dark:bg-[#5294FF]/40"
              />
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.48, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="mt-6 text-[16px] sm:text-[18.5px] leading-[1.6] text-[#475467] dark:text-zinc-400 max-w-[630px] font-normal"
          >
            Route every visitor by country or device in under 12ms, lock private
            SaaS demos inside PathLock™, and attribute Stripe revenue live.
          </motion.p>

          {/* Interactive Live Link Shortener Command Console */}
          <motion.div
            initial={{ opacity: 0, y: 16, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.52, delay: 0.28, ease: EASE_OUT_EXPO }}
            className="mt-9 w-full relative"
          >
            <HeroShortener />
          </motion.div>

          {/* Architectural 3-Column Bottom Telemetry Readout */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.36, ease: EASE_OUT_EXPO }}
            className="mt-12 w-full max-w-[820px] grid grid-cols-1 sm:grid-cols-3 border border-[#E4E7EC] dark:border-white/[0.08] rounded-[10px] divide-y sm:divide-y-0 sm:divide-x divide-[#E4E7EC] dark:divide-white/[0.08] bg-[#F7F8FA]/80 dark:bg-[#0D0E12]/90"
          >
            <div className="px-4 py-3 flex items-center justify-center sm:justify-start gap-2.5 text-left">
              <Zap className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0" />
              <div>
                <div className="font-mono text-[11px] font-bold text-[#101828] dark:text-white uppercase tracking-wider">
                  &lt; 12ms Edge Redirects
                </div>
                <div className="text-[11.5px] text-[#667085] dark:text-zinc-400">
                  310+ global Cloudflare PoPs
                </div>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center justify-center sm:justify-start gap-2.5 text-left">
              <ShieldCheck className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0" />
              <div>
                <div className="font-mono text-[11px] font-bold text-[#101828] dark:text-white uppercase tracking-wider">
                  PathLock™ &amp; Click Caps
                </div>
                <div className="text-[11.5px] text-[#667085] dark:text-zinc-400">
                  Prefix isolation + auto-expiry
                </div>
              </div>
            </div>

            <div className="px-4 py-3 flex items-center justify-center sm:justify-start gap-2.5 text-left">
              <Globe2 className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0" />
              <div>
                <div className="font-mono text-[11px] font-bold text-[#101828] dark:text-white uppercase tracking-wider">
                  Cookie-Free Attribution
                </div>
                <div className="text-[11.5px] text-[#667085] dark:text-zinc-400">
                  First-party qk_cid + Stripe
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <CrosshairNode className="hidden xl:inline-flex absolute bottom-3 left-3 opacity-60" />
        <CrosshairNode className="hidden xl:inline-flex absolute bottom-3 right-3 opacity-60" />
      </SectionRailFrame>
    </section>
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
