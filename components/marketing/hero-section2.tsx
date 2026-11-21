"use client";

import React from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Play, CreditCard, ShieldCheck } from "lucide-react";
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
      <SectionRailFrame className="min-h-[calc(100svh-96px)] sm:min-h-[calc(100svh-112px)] flex flex-col justify-between">
        {/* Main Centered Hero Focus */}
        <div className="my-auto py-10 sm:py-16 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="text-[clamp(40px,5.6vw,68px)] font-semibold tracking-[-0.035em] leading-[1.04] text-[#09090B] dark:text-white max-w-[780px] text-balance"
          >
            Short links you actually control.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-5 text-[16.5px] sm:text-[18.5px] leading-[1.55] text-[#52525B] dark:text-zinc-400 max-w-[560px] text-pretty"
          >
            Route visitors by country or device in under 12ms, lock private
            demos with PathLock™, and attribute Stripe revenue live.
          </motion.p>

          {/* Clean Live Guest Shortener */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.48, delay: 0.14, ease: EASE_OUT_EXPO }}
            className="mt-9 sm:mt-10 w-full"
          >
            <HeroShortener />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.22 }}
            className="mt-6"
          >
            <Link
              href="/#demo-video"
              className="inline-flex items-center gap-2 text-[14px] font-medium text-[#52525B] dark:text-zinc-400 hover:text-[#0066FF] dark:hover:text-[#5294FF] transition-colors"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#0066FF] dark:text-[#5294FF]" />
              <span>Watch the 6-minute walkthrough</span>
            </Link>
          </motion.div>
        </div>

        {/* Docked Verifiable Trust Footer (aligned to the exact 1200px grid edges) */}
        <div className="py-6 border-t border-[#E4E7EC] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-x-8 gap-y-3 text-[13px] text-[#52525B] dark:text-zinc-400">
          <div className="inline-flex items-center gap-2.5">
            <svg
              className="w-5 h-3.5 shrink-0"
              viewBox="0 0 64 42"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M46.6 33.8H16.2C10.9 33.8 6.6 29.6 6.6 24.3C6.6 19.5 10.1 15.5 14.8 14.9C16.2 8.2 22.1 3.2 29.2 3.2C36.9 3.2 43.3 9.1 43.9 16.6C44.8 16.3 45.7 16.2 46.6 16.2C51.5 16.2 55.4 20.1 55.4 25C55.4 29.9 51.5 33.8 46.6 33.8Z"
                fill="#F38020"
              />
              <path
                d="M52.2 18.8C51.6 18.8 51 18.9 50.5 19.1C49.6 14.8 45.8 11.6 41.2 11.6C39.6 11.6 38.1 12 36.8 12.7C39.7 15.1 41.6 18.7 41.8 22.8H42.5C45.9 22.8 48.6 25.5 48.6 28.9C48.6 30.8 47.7 32.5 46.4 33.6H52.2C56.3 33.6 59.6 30.3 59.6 26.2C59.6 22.1 56.3 18.8 52.2 18.8Z"
                fill="#FAAE40"
              />
            </svg>
            <span>
              <strong className="font-medium text-[#09090B] dark:text-zinc-200">
                310+ Cloudflare edge PoPs
              </strong>{" "}
              (redirects under 12ms)
            </span>
          </div>

          <div className="inline-flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0" />
            <span>
              Billing by{" "}
              <strong className="font-medium text-[#09090B] dark:text-zinc-200">
                Dodo Payments
              </strong>
            </span>
          </div>

          <div className="inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>
              <strong className="font-medium text-[#09090B] dark:text-zinc-200">
                GDPR-friendly
              </strong>
              , zero third-party tracking cookies
            </span>
          </div>
        </div>
      </SectionRailFrame>
    </section>
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
