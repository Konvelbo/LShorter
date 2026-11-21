"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Globe2,
  Lock,
  Smartphone,
  Laptop,
  ShieldCheck,
  ArrowRight,
  CreditCard,
  Split,
  CheckCircle2,
} from "lucide-react";
import { HeroShortener } from "@/components/marketing/hero-shortener";
import { HeroBackground } from "@/components/ui/tailwind-css-background-snippet";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
} from "@/components/marketing/swiss-frame";

interface RoutingTraceScenario {
  id: string;
  visitorLabel: string;
  deviceSub: string;
  shortLink: string;
  popCode: string;
  latency: string;
  engineBadge: string;
  ruleTitle: string;
  ruleDetail: string;
  securityStatus: string;
  resolvedUrl: string;
  telemetryPrimary: string;
  telemetrySecondary: string;
  icon: "ios" | "pathlock" | "ab";
}

const ROUTING_SCENARIOS: RoutingTraceScenario[] = [
  {
    id: "geo-device",
    visitorLabel: "Paris, France",
    deviceSub: "iOS 18 · Safari Mobile",
    shortLink: "lsho.cc/app-launch",
    popCode: "CDG edge",
    latency: "10.8 ms",
    engineBadge: "Smart Geo + OS route",
    ruleTitle: "If Country is FR and OS is iOS",
    ruleDetail:
      "Routes directly to the French App Store listing instead of the desktop web landing page.",
    securityStatus: "HTTPS 302 redirect · zero cookies",
    resolvedUrl: "apps.apple.com/fr/app/acme-studio/id6479201",
    telemetryPrimary: "1,842 live clicks",
    telemetrySecondary: "$640.00 attributed revenue · $0.35 EPC",
    icon: "ios",
  },
  {
    id: "pathlock",
    visitorLabel: "Frankfurt, Germany",
    deviceSub: "macOS · Chrome 134",
    shortLink: "lsho.cc/private-demo",
    popCode: "FRA edge",
    latency: "11.4 ms",
    engineBadge: "PathLock™ perimeter",
    ruleTitle: "Lock session to /demo/workspace/*",
    ruleDetail:
      "Verifies 4-digit PIN at the edge and blocks any navigation to /admin, /settings, or /billing.",
    securityStatus: "Perimeter active · 18 of 25 click cap used",
    resolvedUrl: "staging.acme.dev/demo/workspace/analytics",
    telemetryPrimary: "18 authorized sessions",
    telemetrySecondary: "0 perimeter escapes · expires in 48h",
    icon: "pathlock",
  },
  {
    id: "revenue-ab",
    visitorLabel: "New York, United States",
    deviceSub: "Android 15 · Chrome",
    shortLink: "lsho.cc/pro-offer",
    popCode: "EWR edge",
    latency: "9.6 ms",
    engineBadge: "50/50 split + Stripe webhook",
    ruleTitle: "Variant B checkout with click ID",
    ruleDetail:
      "Assigns deterministic A/B bucket at the edge and forwards click attribution metadata to checkout.",
    securityStatus: "Signed conversion webhook verified",
    resolvedUrl: "acme.dev/checkout?plan=pro-annual&variant=b",
    telemetryPrimary: "$2,850.00 net revenue",
    telemetrySecondary: "31 conversions · 4.8% conversion rate",
    icon: "ab",
  },
];

function HeroLiveRoutingWorkbench() {
  const [activeId, setActiveId] = useState<string>(ROUTING_SCENARIOS[0].id);
  const current =
    ROUTING_SCENARIOS.find((s) => s.id === activeId) || ROUTING_SCENARIOS[0];

  return (
    <div className="w-full max-w-[1040px] mx-auto mt-10 sm:mt-12 text-left">
      <div className="rounded-[10px] border border-[#E4E7EC] dark:border-white/[0.11] bg-[#F8F9FB] dark:bg-[#0D0F14] shadow-[0_18px_48px_rgba(16,24,40,0.06)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.62)] overflow-hidden">
        {/* Top Bar: Workbench Title + Scenario Switcher Tabs */}
        <div className="px-4 py-3 sm:px-5 border-b border-[#E4E7EC] dark:border-white/[0.08] bg-white dark:bg-[#11131A] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[#0066FF] shrink-0" />
            <span className="text-[13.5px] font-semibold text-[#09090B] dark:text-white tracking-[-0.01em] whitespace-nowrap">
              Live edge routing inspector
            </span>
            <span className="hidden lg:inline-block text-[12.5px] text-[#71717A] dark:text-zinc-400 truncate">
              — select a short link to inspect its edge rule
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Inspect edge routing scenarios"
            className="flex items-center gap-1.5 shrink-0 overflow-x-auto pb-0.5 md:pb-0"
          >
            {ROUTING_SCENARIOS.map((item) => {
              const isSelected = item.id === current.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveId(item.id)}
                  className={`px-3 py-1.5 rounded-[8px] text-[12.5px] font-medium transition-colors whitespace-nowrap cursor-pointer ${
                    isSelected
                      ? "bg-[#0066FF] text-white shadow-[0_2px_10px_rgba(0,102,255,0.28)]"
                      : "bg-[#F4F4F5] dark:bg-white/[0.05] text-[#52525B] dark:text-zinc-300 hover:text-[#09090B] dark:hover:text-white hover:bg-[#E4E7EC]/60 dark:hover:bg-white/[0.09]"
                  }`}
                >
                  {item.shortLink}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3-Column Live Inspection Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0.75, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0.75, y: -4 }}
            transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
            className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E4E7EC] dark:divide-white/[0.08]"
          >
            {/* Column 1: Incoming Request Context */}
            <div className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between text-[12px] text-[#71717A] dark:text-zinc-400">
                  <span>1. Incoming request</span>
                  <span className="font-mono text-[11.5px] text-[#0066FF] dark:text-[#5294FF] tabular-nums">
                    {current.popCode} · {current.latency}
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-[8px] bg-white dark:bg-[#13161F] border border-[#E4E7EC] dark:border-white/[0.08]">
                  <div className="font-mono text-[14px] font-semibold text-[#0066FF] dark:text-[#5294FF] flex items-center justify-between">
                    <span>GET {current.shortLink}</span>
                    <ArrowRight className="w-3.5 h-3.5 shrink-0" />
                  </div>
                  <div className="mt-2.5 flex items-center gap-2 text-[13px] font-medium text-[#09090B] dark:text-white">
                    <Globe2 className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#5294FF] shrink-0" />
                    <span>{current.visitorLabel}</span>
                  </div>
                  <div className="mt-1 flex items-center gap-2 text-[12.5px] text-[#52525B] dark:text-zinc-400">
                    {current.icon === "pathlock" ? (
                      <Laptop className="w-3.5 h-3.5 text-[#71717A] dark:text-zinc-400 shrink-0" />
                    ) : (
                      <Smartphone className="w-3.5 h-3.5 text-[#71717A] dark:text-zinc-400 shrink-0" />
                    )}
                    <span>{current.deviceSub}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[12px] text-[#52525B] dark:text-zinc-400 pt-1">
                <span>Edge Worker evaluation</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                  Matched rule #1
                </span>
              </div>
            </div>

            {/* Column 2: Edge Policy & PathLock Evaluation */}
            <div className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between text-[12px] text-[#71717A] dark:text-zinc-400">
                  <span>2. Edge policy applied</span>
                  <span className="px-2 py-0.5 rounded-[6px] bg-[#0066FF]/10 dark:bg-[#0066FF]/20 text-[#0066FF] dark:text-[#6CA8FF] text-[11.5px] font-medium">
                    {current.engineBadge}
                  </span>
                </div>

                <div className="mt-3">
                  <div className="text-[14px] font-semibold text-[#09090B] dark:text-white flex items-center gap-2">
                    {current.icon === "pathlock" && (
                      <Lock className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0" />
                    )}
                    {current.icon === "ios" && (
                      <Globe2 className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0" />
                    )}
                    {current.icon === "ab" && (
                      <Split className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0" />
                    )}
                    <span>{current.ruleTitle}</span>
                  </div>
                  <p className="mt-1.5 text-[12.5px] leading-[1.55] text-[#52525B] dark:text-zinc-400">
                    {current.ruleDetail}
                  </p>
                </div>
              </div>

              <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#13161F] border border-[#E4E7EC] dark:border-white/[0.08] flex items-center gap-2 text-[12px] text-[#09090B] dark:text-zinc-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="truncate">{current.securityStatus}</span>
              </div>
            </div>

            {/* Column 3: Resolved Destination & Revenue Telemetry */}
            <div className="lg:col-span-4 p-4 sm:p-5 flex flex-col justify-between gap-4">
              <div>
                <div className="flex items-center justify-between text-[12px] text-[#71717A] dark:text-zinc-400">
                  <span>3. Resolved destination &amp; telemetry</span>
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium text-[11.5px]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Live</span>
                  </span>
                </div>

                <div className="mt-3 p-3 rounded-[8px] bg-white dark:bg-[#13161F] border border-[#E4E7EC] dark:border-white/[0.08]">
                  <div className="text-[11.5px] text-[#71717A] dark:text-zinc-400">
                    Redirects visitor to
                  </div>
                  <div className="mt-1 font-mono text-[12.5px] font-medium text-[#09090B] dark:text-white truncate">
                    https://{current.resolvedUrl}
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-[#0066FF]/[0.06] dark:bg-[#0066FF]/[0.12] border border-[#0066FF]/20 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[13.5px] font-semibold text-[#09090B] dark:text-white tabular-nums">
                    {current.telemetryPrimary}
                  </div>
                  <div className="text-[11.5px] text-[#52525B] dark:text-zinc-300 truncate mt-0.5">
                    {current.telemetrySecondary}
                  </div>
                </div>
                <CreditCard className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0" />
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section
      id="hero"
      className="relative isolate w-full overflow-x-clip pt-20 sm:pt-24 transition-colors duration-300"
    >
      {/* Background Pattern from tailwind-css-background-snippet */}
      <HeroBackground />

      <SectionRailFrame className="relative z-10 min-h-[calc(100svh-80px)] sm:min-h-[calc(100svh-96px)] flex flex-col justify-center">
        <div className="py-10 sm:py-14 flex flex-col items-center text-center">
          <motion.h1
            initial={{ opacity: 0.92, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: EASE_OUT_EXPO }}
            className="text-[clamp(38px,5.2vw,64px)] font-semibold tracking-[-0.035em] leading-[1.04] text-[#09090B] dark:text-white max-w-[780px] text-balance"
          >
            Short links you actually control.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0.92, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.04, ease: EASE_OUT_EXPO }}
            className="mt-4 text-[16px] sm:text-[18px] leading-[1.55] text-[#52525B] dark:text-zinc-400 max-w-[560px] text-pretty"
          >
            Route visitors by country or device in under 12ms, lock private
            demos with PathLock™, and attribute Stripe revenue live.
          </motion.p>

          {/* Primary Interactive Guest Shortener Command Bar */}
          <motion.div
            initial={{ opacity: 0.95, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="mt-7 sm:mt-8 w-full"
          >
            <HeroShortener />
          </motion.div>

          {/* Live Interactive Edge Routing & Telemetry Workbench (replaces empty void above the fold) */}
          <motion.div
            initial={{ opacity: 0.95, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.12, ease: EASE_OUT_EXPO }}
            className="w-full"
          >
            <HeroLiveRoutingWorkbench />
          </motion.div>
        </div>
      </SectionRailFrame>
    </section>
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
