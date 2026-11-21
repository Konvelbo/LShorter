"use client";

import React from "react";
import { motion } from "motion/react";
import { HeroShortener } from "@/components/marketing/hero-shortener";
import { HeroBackground } from "@/components/ui/tailwind-css-background-snippet";
import { LogoLoop, type LogoItem } from "@/components/ui/LogoLoop";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
} from "@/components/marketing/swiss-frame";

/**
 * Authentic full-color vector brand logos for Social Networks, Ad Platforms, and Tracking Pixels.
 */
const COLORED_SOCIAL_AND_ADS_LOGOS: LogoItem[] = [
  {
    title: "Google Ads",
    hoverColor: "#4285F4",
    node: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Yellow left bar */}
        <path
          d="M7.3 33.4L19.8 11.7C21.7 8.4 26 7.3 29.3 9.2C32.6 11.1 33.7 15.4 31.8 18.7L19.3 40.4C17.4 43.7 13.1 44.8 9.8 42.9C6.5 41 5.4 36.7 7.3 33.4Z"
          fill="#FBBC04"
        />
        {/* Blue right bar */}
        <path
          d="M40.7 33.4L28.2 11.7C26.3 8.4 22 7.3 18.7 9.2C15.4 11.1 14.3 15.4 16.2 18.7L28.7 40.4C30.6 43.7 34.9 44.8 38.2 42.9C41.5 41 42.6 36.7 40.7 33.4Z"
          fill="#4285F4"
        />
        {/* Green bottom-left circle */}
        <circle cx="13.3" cy="36.9" r="6.9" fill="#34A853" />
      </svg>
    ),
  },
  {
    title: "Meta Pixel",
    hoverColor: "#0081FB",
    node: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="11" fill="#0064E0" />
        <path
          d="M34.8 15C31.7 15 29.3 17.3 27.1 20.6L24.1 25.2L21.9 21.8C19.6 18.2 16.9 15 13.2 15C8.5 15 5 19.3 5 25.1C5 30.8 8.4 34 12.6 34C15.8 34 18.3 31.8 21.2 27.3L23.5 23.7L25.4 26.7C28.1 30.9 30.9 34 35.1 34C39.6 34 43 30.3 43 24.9C43 19.1 39.5 15 34.8 15ZM13.1 29.7C10.8 29.7 9.3 27.9 9.3 25C9.3 21.6 11 19.3 13.4 19.3C15.4 19.3 17.2 21.2 19.2 24.3L20.1 25.7C17.6 28.6 15.4 29.7 13.1 29.7ZM34.9 29.7C32.5 29.7 30.5 27.8 28.1 24.1L27.1 22.6C29.3 19.9 31.5 19.3 34.5 19.3C37.1 19.3 38.7 21.5 38.7 24.9C38.7 28 37.1 29.7 34.9 29.7Z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  },
  {
    title: "Instagram",
    hoverColor: "#E1306C",
    node: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient
            id="lsh-ig-grad"
            cx="30%"
            cy="107%"
            r="150%"
            fx="30%"
            fy="107%"
          >
            <stop offset="0%" stopColor="#FDF497" />
            <stop offset="5%" stopColor="#FDF497" />
            <stop offset="45%" stopColor="#FD5949" />
            <stop offset="60%" stopColor="#D6249F" />
            <stop offset="90%" stopColor="#285AEB" />
          </radialGradient>
        </defs>
        <rect width="48" height="48" rx="12" fill="url(#lsh-ig-grad)" />
        <rect
          x="10"
          y="10"
          width="28"
          height="28"
          rx="8"
          stroke="#FFFFFF"
          strokeWidth="3.2"
        />
        <circle
          cx="24"
          cy="24"
          r="6.5"
          stroke="#FFFFFF"
          strokeWidth="3.2"
        />
        <circle cx="32.2" cy="15.8" r="2" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    title: "TikTok Ads",
    hoverColor: "#FE2C55",
    node: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect
          width="48"
          height="48"
          rx="11"
          fill="#0B0B0E"
          stroke="#FFFFFF"
          strokeOpacity="0.16"
          strokeWidth="1.5"
        />
        {/* Cyan offset layer */}
        <path
          d="M32.4 15.8C30.4 14.5 29.2 12.3 29.1 9.8H24.2V28.6C24.2 31.1 22.1 33.1 19.6 33.1C17.1 33.1 15.1 31.1 15.1 28.6C15.1 26.1 17.1 24.1 19.6 24.1C20.1 24.1 20.6 24.2 21.1 24.3V19.3C20.6 19.2 20.1 19.2 19.6 19.2C14.4 19.2 10.2 23.4 10.2 28.6C10.2 33.8 14.4 38 19.6 38C24.8 38 29 33.8 29 28.6V19.9C31 21.3 33.5 22.1 36.1 22.1V17.2C34.8 17.2 33.5 16.7 32.4 15.8Z"
          fill="#25F4EE"
          transform="translate(-1.6 -1.4)"
        />
        {/* Magenta offset layer */}
        <path
          d="M32.4 15.8C30.4 14.5 29.2 12.3 29.1 9.8H24.2V28.6C24.2 31.1 22.1 33.1 19.6 33.1C17.1 33.1 15.1 31.1 15.1 28.6C15.1 26.1 17.1 24.1 19.6 24.1C20.1 24.1 20.6 24.2 21.1 24.3V19.3C20.6 19.2 20.1 19.2 19.6 19.2C14.4 19.2 10.2 23.4 10.2 28.6C10.2 33.8 14.4 38 19.6 38C24.8 38 29 33.8 29 28.6V19.9C31 21.3 33.5 22.1 36.1 22.1V17.2C34.8 17.2 33.5 16.7 32.4 15.8Z"
          fill="#FE2C55"
          transform="translate(1.6 1.4)"
        />
        {/* White core note */}
        <path
          d="M32.4 15.8C30.4 14.5 29.2 12.3 29.1 9.8H24.2V28.6C24.2 31.1 22.1 33.1 19.6 33.1C17.1 33.1 15.1 31.1 15.1 28.6C15.1 26.1 17.1 24.1 19.6 24.1C20.1 24.1 20.6 24.2 21.1 24.3V19.3C20.6 19.2 20.1 19.2 19.6 19.2C14.4 19.2 10.2 23.4 10.2 28.6C10.2 33.8 14.4 38 19.6 38C24.8 38 29 33.8 29 28.6V19.9C31 21.3 33.5 22.1 36.1 22.1V17.2C34.8 17.2 33.5 16.7 32.4 15.8Z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  },
  {
    title: "LinkedIn Ads",
    hoverColor: "#0A66C2",
    node: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="10" fill="#0A66C2" />
        <path
          d="M15.2 20.2H10.1V36.8H15.2V20.2ZM12.7 12C11 12 9.7 13.3 9.7 15C9.7 16.7 11 18 12.7 18C14.3 18 15.6 16.7 15.6 15C15.6 13.3 14.3 12 12.7 12ZM37.8 27.5C37.8 22.7 35.2 19.8 30.8 19.8C28.3 19.8 26.7 21.1 25.9 22.3V20.2H21V36.8H26.1V28C26.1 25.8 27.1 24.2 29.3 24.2C31.4 24.2 32.6 25.6 32.6 28V36.8H37.8V27.5Z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  },
  {
    title: "YouTube",
    hoverColor: "#FF0000",
    node: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M44.2 14.5C43.7 12.6 42.2 11.1 40.3 10.6C36.8 9.7 24 9.7 24 9.7C24 9.7 11.2 9.7 7.7 10.6C5.8 11.1 4.3 12.6 3.8 14.5C2.9 18 2.9 24 2.9 24C2.9 24 2.9 30 3.8 33.5C4.3 35.4 5.8 36.9 7.7 37.4C11.2 38.3 24 38.3 24 38.3C24 38.3 36.8 38.3 40.3 37.4C42.2 36.9 43.7 35.4 44.2 33.5C45.1 30 45.1 24 45.1 24C45.1 24 45.1 18 44.2 14.5Z"
          fill="#FF0000"
        />
        <path d="M19.8 30.2L30.8 24L19.8 17.8V30.2Z" fill="#FFFFFF" />
      </svg>
    ),
  },
  {
    title: "X (Twitter)",
    hoverColor: "#38BDF8",
    node: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect
          width="48"
          height="48"
          rx="11"
          fill="#0F1419"
          stroke="#FFFFFF"
          strokeOpacity="0.2"
          strokeWidth="1.5"
        />
        <path
          d="M27.3 21.8L37.6 10H35.1L26.2 20.2L19.1 10H10.8L21.6 25.5L10.8 38H13.3L22.7 27.1L30.2 38H38.5L27.3 21.8ZM23.9 25.7L22.8 24.1L14.2 11.9H18L25.1 21.9L26.2 23.5L35.1 36.2H31.3L23.9 25.7Z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  },
  {
    title: "Facebook Ads",
    hoverColor: "#1877F2",
    node: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="21" fill="#1877F2" />
        <path
          d="M31.9 30.5L32.8 24.4H27V20.4C27 18.7 27.8 17.1 30.5 17.1H33.2V11.9C33.2 11.9 30.7 11.5 28.4 11.5C23.5 11.5 20.3 14.5 20.3 19.8V24.4H14.8V30.5H20.3V44.7C21.5 44.9 22.7 45 24 45C25.3 45 26.5 44.9 27.7 44.7V30.5H31.9Z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  },
  {
    title: "Snapchat Ads",
    hoverColor: "#FACC15",
    node: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="11" fill="#FFFC00" />
        <path
          d="M24.2 10.5C28.3 10.5 31.3 13.5 31.5 17.6C31.6 19 31.4 20.5 31.3 21.5C31.2 22 31.5 22.5 32.1 22.7C32.7 22.9 33.6 23.1 34.1 23.7C34.5 24.3 34.4 25 33.8 25.4C33.1 25.9 32 26.2 31.2 26.5C30.6 26.7 30.3 27.2 30.5 27.8C31.3 30 33 31.8 35.2 32.6C35.8 32.8 36.1 33.5 35.7 34C35 35.1 33.5 35.7 32.1 36C31.4 36.1 31.1 36.6 30.9 37.3C30.6 38.3 29.8 38.7 28.7 38.5C27.5 38.3 26.4 38 25.2 38C23.7 38 22.4 38.7 21 39C20 39.3 18.8 39.3 17.7 39C16.3 38.6 15.1 38 13.6 38C12.4 38 11.2 38.3 10.1 38.5C9 38.7 8.2 38.3 7.9 37.3C7.7 36.6 7.3 36.1 6.7 36C5.2 35.7 3.8 35.1 3.1 34C2.7 33.5 2.9 32.8 3.6 32.6C5.8 31.8 7.5 30 8.3 27.8C8.5 27.2 8.2 26.7 7.6 26.5C6.8 26.2 5.7 25.9 5 25.4C4.4 25 4.3 24.3 4.7 23.7C5.2 23.1 6.1 22.9 6.7 22.7C7.3 22.5 7.5 22 7.5 21.5C7.4 20.5 7.2 19 7.3 17.6C7.5 13.5 10.5 10.5 14.6 10.5H24.2Z"
          transform="translate(4.6 0) scale(0.82)"
          fill="#FFFFFF"
          stroke="#09090B"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
      </svg>
    ),
  },
  {
    title: "Pinterest Ads",
    hoverColor: "#E60023",
    node: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="21" fill="#E60023" />
        <path
          d="M24.2 12C17.1 12 13.5 17.1 13.5 21.4C13.5 24 14.5 26.3 16.6 27.2C17 27.4 17.3 27.2 17.4 26.8C17.5 26.5 17.7 25.6 17.8 25.2C17.9 24.8 17.8 24.6 17.5 24.2C16.9 23.4 16.5 22.4 16.5 21.1C16.5 17.3 19.4 13.9 24 13.9C28.1 13.9 30.4 16.4 30.4 19.7C30.4 24.1 28.4 27.8 25.6 27.8C24 27.8 22.8 26.5 23.2 24.9C23.6 23 24.5 20.9 24.5 19.5C24.5 18.2 23.8 17.2 22.4 17.2C20.7 17.2 19.4 18.9 19.4 21.2C19.4 22.7 19.9 23.7 19.9 23.7L17.9 32.1C17.4 34.2 17.8 36.9 17.9 37.2C18.1 37.4 18.4 37.4 18.6 37.1C18.9 36.7 20.5 34.4 21.1 32.3L22 28.8C22.5 29.8 24.1 30.6 25.8 30.6C30.7 30.6 34.1 26.1 34.1 20.1C34.1 15.6 30.3 12 24.2 12Z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  },
  {
    title: "Reddit Ads",
    hoverColor: "#FF4500",
    node: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <circle cx="24" cy="24" r="21" fill="#FF4500" />
        <path
          d="M35.5 24.1C35.5 22.6 34.3 21.4 32.8 21.4C32.1 21.4 31.4 21.7 30.9 22.2C29.1 20.9 26.7 20.1 24 20L25.4 13.6L29.9 14.5C29.9 15.5 30.8 16.4 31.8 16.4C32.9 16.4 33.7 15.5 33.7 14.5C33.7 13.4 32.9 12.6 31.8 12.6C31.1 12.6 30.4 13 30.1 13.7L25 12.6C24.7 12.5 24.4 12.7 24.3 13L22.7 20.1C20 20.2 17.5 21 15.7 22.3C15.2 21.8 14.5 21.4 13.8 21.4C12.3 21.4 11.1 22.6 11.1 24.1C11.1 25.2 11.7 26.1 12.7 26.6C12.6 27 12.6 27.3 12.6 27.7C12.6 31.8 17.5 35.1 23.4 35.1C29.4 35.1 34.2 31.8 34.2 27.7C34.2 27.3 34.2 27 34.1 26.6C34.9 26.1 35.5 25.2 35.5 24.1Z"
          fill="#FFFFFF"
        />
        <circle cx="19.5" cy="26.3" r="2" fill="#FF4500" />
        <circle cx="27.5" cy="26.3" r="2" fill="#FF4500" />
        <path
          d="M19.5 31.2C20.7 32.2 22.2 32.6 23.5 32.6C24.8 32.6 26.3 32.2 27.5 31.2"
          stroke="#FF4500"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    title: "WhatsApp",
    hoverColor: "#25D366",
    node: (
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="48" height="48" rx="11" fill="#25D366" />
        <path
          d="M24 10C16.3 10 10 16.2 10 23.9C10 26.4 10.7 28.8 11.9 30.9L10 38L17.3 36.1C19.3 37.2 21.6 37.8 24 37.8C31.7 37.8 38 31.6 38 23.9C38 16.2 31.7 10 24 10ZM31.7 29.6C31.4 30.5 29.8 31.3 29 31.4C28.3 31.5 27.4 31.6 26.4 31.3C25.7 31.1 24.9 30.8 23.8 30.3C19.3 28.4 16.4 23.9 16.2 23.6C16 23.3 14.4 21.2 14.4 19C14.4 16.8 15.5 15.8 15.9 15.3C16.3 14.9 16.8 14.8 17.1 14.8H18C18.3 14.8 18.7 14.7 19 15.5C19.4 16.4 20.3 18.6 20.4 18.8C20.5 19 20.6 19.3 20.4 19.6C20.3 19.9 20.2 20.1 20 20.3C19.8 20.5 19.5 20.8 19.3 21C19.1 21.2 18.9 21.5 19.1 21.9C19.4 22.3 20.3 23.8 21.6 25C23.3 26.5 24.7 27 25.1 27.2C25.5 27.4 25.8 27.3 26 27.1C26.3 26.8 27.1 25.8 27.4 25.4C27.7 25 28 25.1 28.4 25.2C28.8 25.4 30.9 26.4 31.4 26.6C31.8 26.8 32.1 27 32.2 27.2C32.3 27.4 32.3 28.6 31.7 29.6Z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  },
];

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

        {/* Bottom Auto-Scrolling React Bits <LogoLoop /> with Real Colored Social & Ad Platform Logos */}
        <div className="w-full pt-8 pb-5 sm:pb-6 mt-auto text-[#09090B] dark:text-white">
          <LogoLoop
            logos={COLORED_SOCIAL_AND_ADS_LOGOS}
            speed={90}
            direction="left"
            logoHeight={32}
            gap={48}
            hoverSpeed={0}
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
