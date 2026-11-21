"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "motion/react";
import {
  ShieldCheck,
  Check,
  ArrowRight,
  ExternalLink,
  CreditCard,
  Lock,
} from "lucide-react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
  SwissSectionIndex,
  JargonTooltip,
  scrollToHeroShortener,
} from "@/components/marketing/swiss-frame";
import {
  SmartRoutingSwitchboard,
  ClickCapSimulator,
  DynamicQrStudioCard,
  PinGateMaskingCard,
  PathLockInteractiveSimulator,
} from "@/components/marketing/interactive-simulators";

export {
  DifferenceSection,
  UseCasesSection,
  DeveloperApiSection,
  PricingPreviewSection,
} from "@/components/marketing/landing-sections-bottom";

const NAMECHEAP_AFFILIATE_URL =
  process.env.NEXT_PUBLIC_NAMECHEAP_AFFILIATE_LINK ||
  "https://namecheap.pxf.io/c/7999167/386170/5618";

// ─── CURSOR SPOTLIGHT ARCHITECTURAL PANEL (strictly rounded-[10px]) ───
function InstrumentPanel({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 0, y: 0, visible: false });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect();
    if (!rect) return;
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      visible: true,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setPos((p) => ({ ...p, visible: false }))}
      className={`group relative rounded-[10px] bg-white dark:bg-[#0E0F13] border border-[#E4E7EC] dark:border-white/[0.10] overflow-hidden transition-colors duration-300 hover:border-[#0066FF]/45 ${className}`}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
        style={{
          opacity: pos.visible ? 1 : 0,
          background: `radial-gradient(360px circle at ${pos.x}px ${pos.y}px, rgba(0, 102, 255, 0.08), transparent 65%)`,
        }}
      />
      <div className="relative z-10 h-full flex flex-col">{children}</div>
    </div>
  );
}

// ─── OFFICIAL NAMECHEAP SVG MARK ───
function NamecheapLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Namecheap"
    >
      <path
        d="M11.1 10.6c-.9-1.5-2.9-1.9-4.4-1-.4.2-.8.6-1 1L2.2 16.5c-.6 1-.6 2.3 0 3.3l1.7 2.8c.5.9 1.7 1.2 2.6.6.3-.2.5-.4.6-.7l4-6.9 4.2 7.1c.9 1.5 2.9 1.9 4.4 1 .4-.2.8-.6 1-1l3.5-5.9c.6-1 .6-2.3 0-3.3l-1.7-2.8c-.5-.9-1.7-1.2-2.6-.6-.3.2-.5.4-.6.7l-4 6.9-4.2-7.1Z"
        fill="#DE3723"
      />
      <path
        d="M25.3 10.2c-.9-.5-2.1-.2-2.6.7l-3.9 6.8 2.4 4.1c.9 1.5 2.9 1.9 4.4 1 .4-.2.8-.6 1-1l3.2-5.4c.6-1 .6-2.3 0-3.3l-1.6-2.7c-.6-.9-1.9-1-2.9-.2Z"
        fill="#FF5C35"
      />
    </svg>
  );
}

// ============================================================================
// 1. TRUST STRIP SECTION (Architectural Telemetry Bar)
// ============================================================================
export function TrustStripSection() {
  return (
    <section className="w-full border-y border-[#E4E7EC] dark:border-white/[0.08] bg-[#F7F8FA] dark:bg-[#0B0C10] transition-colors duration-300 overflow-x-clip">
      <SectionRailFrame className="px-4 sm:px-8 py-4">
        <div className="flex flex-wrap items-center justify-center sm:justify-between gap-x-8 gap-y-3 text-[12.5px] font-medium text-[#475467] dark:text-zinc-400">
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
              Built on{" "}
              <strong className="text-[#101828] dark:text-white font-semibold">
                Cloudflare&apos;s 310+ edge PoPs
              </strong>{" "}
              <span className="font-mono text-[11.5px] text-[#0066FF] dark:text-[#5294FF]">
                (&lt; 12ms)
              </span>
            </span>
          </div>

          <div className="inline-flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF]" />
            <span>
              Billing secured by{" "}
              <strong className="text-[#101828] dark:text-white font-semibold">
                Dodo Payments
              </strong>
            </span>
          </div>

          <div className="inline-flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>
              <strong className="text-[#101828] dark:text-white font-semibold">
                GDPR-friendly
              </strong>{" "}
              · Zero third-party tracking cookies
            </span>
          </div>
        </div>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 2. HOW IT WORKS (01 / WORKFLOW — Horizontal Architectural Blueprint Strip)
// ============================================================================
const STEPS = [
  {
    num: "01",
    tag: "SHORTEN",
    title: "Paste & provision",
    desc: "Drop any long URL to generate a root lsho.cc/<slug> link or publish directly onto your verified custom branded domain.",
  },
  {
    num: "02",
    tag: "GOVERN",
    title: "Attach routing & perimeters",
    desc: "Configure country or device destinations, restrict visitor navigation with PathLock™, enforce click caps, or gate behind a PIN.",
  },
  {
    num: "03",
    tag: "ATTRIBUTE",
    title: "Measure clicks & revenue",
    desc: "Inspect real-time cities, referrers, device breakdowns, and Stripe checkout revenue tied directly to each short slug.",
  },
];

export function HowItWorksSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 80%", "center 45%"],
  });
  const lineScaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section
      ref={containerRef}
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] transition-colors duration-300 overflow-x-clip"
    >
      <SectionRailFrame className="px-4 sm:px-8 py-20 sm:py-24">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 sm:mb-12"
        >
          <div>
            <SwissSectionIndex
              index="01"
              label="WORKFLOW"
              meta="3-STAGE PIPELINE"
            />
            <h2 className="mt-4 text-[28px] sm:text-[38px] font-bold tracking-[-0.04em] leading-[1.08] text-[#09090B] dark:text-white">
              Three stages from raw URL to governed traffic
            </h2>
          </div>
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#667085] dark:text-zinc-500 shrink-0">
            NO SDK REQUIRED TO START
          </span>
        </motion.div>

        {/* Architectural Horizontal Blueprint Strip (Zero generic 40x40 icon cards) */}
        <div className="relative rounded-[10px] border border-[#D0D5DD] dark:border-white/14 bg-[#F7F8FA] dark:bg-[#0D0E12] overflow-hidden">
          {/* Scroll-drawn #0066FF structural progress rail along top edge */}
          <div
            aria-hidden="true"
            className="w-full h-[3px] bg-[#E4E7EC] dark:bg-white/[0.08] overflow-hidden"
          >
            <motion.div
              style={{ scaleX: lineScaleX }}
              className="h-full w-full origin-left bg-[#0066FF]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E4E7EC] dark:divide-white/[0.08]">
            {STEPS.map((step, idx) => (
              <motion.div
                key={step.num}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.42,
                  delay: idx * 0.08,
                  ease: EASE_OUT_EXPO,
                }}
                className="p-6 sm:p-8 flex flex-col justify-between bg-white dark:bg-[#0E0F13]"
              >
                <div className="flex items-center justify-between gap-2 pb-5 mb-5 border-b border-[#E4E7EC] dark:border-white/[0.08]">
                  <span className="font-mono text-[28px] font-bold tracking-[-0.04em] text-[#0066FF] dark:text-[#5294FF] tabular-nums leading-none">
                    {step.num}
                  </span>
                  <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085] dark:text-zinc-400">
                    STAGE // {step.tag}
                  </span>
                </div>

                <div>
                  <h3 className="text-[19px] font-bold tracking-[-0.02em] text-[#09090B] dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-[#475467] dark:text-zinc-400 leading-[1.65]">
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 3. CORE PLATFORM (#features — Bespoke Interactive Instruments + Namecheap)
// ============================================================================
export function FeaturesBentoSection() {
  return (
    <section
      id="features"
      className="w-full bg-[#F7F8FA] dark:bg-[#0B0C10] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24 overflow-x-clip"
    >
      <SectionRailFrame className="px-4 sm:px-8 py-20 sm:py-28">
        {/* Asymmetric Editorial Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12 sm:mb-14"
        >
          <div className="lg:col-span-7">
            <SwissSectionIndex
              index="03"
              label="PLATFORM"
              meta="6 CORE INSTRUMENTS"
            />
            <h2 className="mt-4 text-[30px] sm:text-[42px] md:text-[46px] font-bold tracking-[-0.04em] leading-[1.05] text-[#09090B] dark:text-white">
              Programmable edge routing, click limits, and first-party revenue plumbing.
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[14.5px] sm:text-[15.5px] text-[#475467] dark:text-zinc-400 leading-[1.65]">
              Engineered around deterministic{" "}
              <JargonTooltip
                term="Edge routing"
                explanation="Your short links resolve on Cloudflare servers physically closest to each visitor (310+ global PoPs), cutting redirect time to under 12ms."
              />
              , programmable{" "}
              <JargonTooltip
                term="Click Caps"
                explanation="Automatically deactivate a short link or redirect to a fallback URL once an exact number of clicks is reached."
              />
              , and cookieless{" "}
              <JargonTooltip
                term="Attribution"
                explanation="Connects each click directly to signups and Stripe checkouts using a first-party qk_cid token — zero third-party cookies."
              />
              . Click any instrument below to test it live.
            </p>
          </div>
        </motion.div>

        {/* 6 Asymmetric Bespoke Instrument Panels (12-col grid, strictly rounded-[10px]) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* PANEL 03.1 (7 cols): INTERACTIVE SMART EDGE ROUTING SWITCHBOARD */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="lg:col-span-7"
          >
            <InstrumentPanel className="h-full p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-[#E4E7EC] dark:border-white/[0.08] font-mono text-[11px]">
                <span className="font-bold uppercase tracking-[0.12em] text-[#0066FF] dark:text-[#5294FF]">
                  03.1 // SMART EDGE ROUTING
                </span>
                <span className="text-[#475467] dark:text-zinc-400 tabular-nums">
                  &lt; 12MS · 310+ POPS
                </span>
              </div>

              <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#09090B] dark:text-white">
                Route one link by country, device, or weighted A/B split
              </h3>
              <p className="mt-1.5 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed max-w-[540px]">
                Evaluate ISO geography, OS, browser, or traffic split weights at
                the nearest edge PoP with zero redirect hop penalty.
              </p>

              <SmartRoutingSwitchboard />
            </InstrumentPanel>
          </motion.div>

          {/* PANEL 03.2 (5 cols): INTERACTIVE CLICK CAPS & EXPIRY */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: 0.06, ease: EASE_OUT_EXPO }}
            className="lg:col-span-5"
          >
            <InstrumentPanel className="h-full p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-[#E4E7EC] dark:border-white/[0.08] font-mono text-[11px]">
                <span className="font-bold uppercase tracking-[0.12em] text-[#0066FF] dark:text-[#5294FF]">
                  03.2 // CLICK CAPS
                </span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  AUTO-DEACTIVATE
                </span>
              </div>

              <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#09090B] dark:text-white">
                Click Caps &amp; Scheduled Expiry
              </h3>
              <p className="mt-1.5 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed">
                Close a link automatically after an exact click quota or
                timestamp — and reroute overflow visits to a fallback URL.
              </p>

              <ClickCapSimulator />
            </InstrumentPanel>
          </motion.div>

          {/* PANEL 03.3 (7 cols): TELEMETRY & STRIPE ATTRIBUTION LEDGER */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="lg:col-span-7"
          >
            <InstrumentPanel className="h-full p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-[#E4E7EC] dark:border-white/[0.08] font-mono text-[11px]">
                <span className="font-bold uppercase tracking-[0.12em] text-[#0066FF] dark:text-[#5294FF]">
                  03.3 // TELEMETRY &amp; ATTRIBUTION
                </span>
                <span className="px-2 py-0.5 rounded-[4px] bg-[#F7F8FA] dark:bg-white/[0.06] border border-[#E4E7EC] dark:border-white/10 text-[#475467] dark:text-zinc-300 font-semibold">
                  Example data
                </span>
              </div>

              <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#09090B] dark:text-white">
                Real-Time Telemetry &amp; Stripe Revenue Attribution
              </h3>
              <p className="mt-1.5 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed">
                Capture city-level clicks, devices, and UTM parameters, match{" "}
                <strong className="text-[#101828] dark:text-white">
                  Stripe checkouts
                </strong>{" "}
                via first-party{" "}
                <code className="px-1.5 py-0.5 rounded-[5px] bg-[#F2F4F7] dark:bg-white/10 font-mono text-[12px]">
                  qk_cid
                </code>{" "}
                tokens, and trigger Meta, Google, and TikTok retargeting pixels
                on redirect.
              </p>

              {/* Architectural Horizontal Attribution Ledger */}
              <div className="mt-6 rounded-[10px] border border-[#E4E7EC] dark:border-white/[0.09] bg-[#F7F8FA] dark:bg-[#09090B] grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-[#E4E7EC] dark:divide-white/[0.08] overflow-hidden">
                <div className="p-4 bg-white dark:bg-[#111217]">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-zinc-400">
                    01 · Click Captured
                  </div>
                  <div className="mt-1.5 font-mono text-[13.5px] font-bold text-[#0066FF] dark:text-[#5294FF]">
                    lsho.cc/launch
                  </div>
                  <div className="font-mono text-[11px] text-[#667085] dark:text-zinc-400 mt-1">
                    Paris · iOS · qk_cid_89a1
                  </div>
                </div>

                <div className="p-4 bg-white dark:bg-[#111217]">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#667085] dark:text-zinc-400">
                    02 · Stripe Checkout
                  </div>
                  <div className="mt-1.5 text-[13.5px] font-bold text-[#101828] dark:text-white">
                    Pro Yearly Plan
                  </div>
                  <div className="font-mono text-[11px] text-[#667085] dark:text-zinc-400 mt-1">
                    Webhook matched
                  </div>
                </div>

                <div className="p-4 bg-emerald-500/[0.07] dark:bg-emerald-500/[0.12]">
                  <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                    03 · Attributed Sale
                  </div>
                  <div className="mt-1.5 text-[18px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                    +$240.00
                  </div>
                  <div className="font-mono text-[11px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                    Linked directly to slug
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px] text-[#667085] dark:text-zinc-400">
                <span>Retargeting pixels fired on edge hop:</span>
                <div className="flex items-center gap-1.5">
                  {["Meta CAPI", "Google Ads", "TikTok Pixel"].map((px) => (
                    <span
                      key={px}
                      className="px-2 py-0.5 rounded-[4px] bg-[#F7F8FA] dark:bg-white/[0.05] border border-[#E4E7EC] dark:border-white/10 text-[#344054] dark:text-zinc-300"
                    >
                      {px}
                    </span>
                  ))}
                </div>
              </div>
            </InstrumentPanel>
          </motion.div>

          {/* PANEL 03.4 (5 cols): INTERACTIVE DYNAMIC VECTOR QR STUDIO */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: 0.1, ease: EASE_OUT_EXPO }}
            className="lg:col-span-5"
          >
            <InstrumentPanel className="h-full p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-[#E4E7EC] dark:border-white/[0.08] font-mono text-[11px]">
                <span className="font-bold uppercase tracking-[0.12em] text-[#0066FF] dark:text-[#5294FF]">
                  03.4 // VECTOR QR STUDIO
                </span>
                <span className="text-[#475467] dark:text-zinc-400">
                  SVG · PNG · GIF
                </span>
              </div>

              <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#09090B] dark:text-white">
                Dynamic Vector QR Studio
              </h3>
              <p className="mt-1.5 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed">
                15 pixel patterns, 15 corner shapes, custom brand gradients, and
                destination targets editable even after print.
              </p>

              <DynamicQrStudioCard />
            </InstrumentPanel>
          </motion.div>

          {/* PANEL 03.5 (7 cols): CUSTOM BRANDED DOMAINS + NAMECHEAP PARTNER BLOCK */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: 0.12, ease: EASE_OUT_EXPO }}
            className="lg:col-span-7"
          >
            <InstrumentPanel className="h-full p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-[#E4E7EC] dark:border-white/[0.08] font-mono text-[11px]">
                <span className="font-bold uppercase tracking-[0.12em] text-[#0066FF] dark:text-[#5294FF]">
                  03.5 // BRANDED DOMAINS &amp; DNS
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                  CNAME · TLS 1.3 ACTIVE
                </span>
              </div>

              <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#09090B] dark:text-white">
                Custom Branded Short Links &amp; Domains
              </h3>
              <p className="mt-1.5 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed">
                Publish links on your own brand domain (up to 3 custom domains
                included even on the Free Starter plan) with automatic CNAME
                verification and edge SSL certificates.
              </p>

              {/* Branded DNS Transformation Ledger */}
              <div className="mt-4 rounded-[8px] p-3 bg-[#F7F8FA] dark:bg-[#09090B] border border-[#E4E7EC] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2 font-mono text-[12px]">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className="text-[#667085] dark:text-zinc-500 line-through truncate">
                    long-campaign-url.com/ref=491...
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                  <span className="text-[#0066FF] dark:text-[#5294FF] font-bold">
                    go.yourbrand.io/deal
                  </span>
                </div>
                <span className="text-[10.5px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-semibold">
                  DNS Verified ✓
                </span>
              </div>

              {/* Embedded Namecheap Partner Block (Impact-compliant: Recommended Registrar · Partner Link) */}
              <div className="mt-5 rounded-[10px] p-4 bg-[#F7F8FA] dark:bg-[#09090B] border border-[#E4E7EC] dark:border-white/10 hover:border-[#FF5C35]/45 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-[8px] bg-white dark:bg-[#17181E] border border-[#E4E7EC] dark:border-white/10 flex items-center justify-center shrink-0 shadow-2xs">
                    <NamecheapLogo className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-bold text-[#101828] dark:text-white">
                        Need a short custom domain?
                      </span>
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-[#FF5C35]/10 text-[#DE3723] dark:text-[#FF7857] font-mono text-[10px] font-bold uppercase tracking-wider">
                        Recommended Registrar · Partner Link
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-[#475467] dark:text-zinc-400 leading-snug">
                      Grab a clean{" "}
                      <strong className="text-[#101828] dark:text-zinc-200">
                        .io
                      </strong>
                      ,{" "}
                      <strong className="text-[#101828] dark:text-zinc-200">
                        .co
                      </strong>
                      , or{" "}
                      <strong className="text-[#101828] dark:text-zinc-200">
                        .link
                      </strong>{" "}
                      domain on Namecheap and connect it to LShorter in 60 seconds.
                    </p>
                  </div>
                </div>

                <a
                  href={NAMECHEAP_AFFILIATE_URL}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="shrink-0 h-9 px-3.5 rounded-[8px] bg-white dark:bg-[#181920] hover:bg-[#FF5C35] text-[#101828] dark:text-white hover:text-white border border-[#D0D5DD] dark:border-white/15 hover:border-[#FF5C35] text-[12.5px] font-semibold inline-flex items-center justify-center gap-1.5 transition-all duration-200 whitespace-nowrap"
                >
                  <span>Get a domain on Namecheap</span>
                  <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                </a>
              </div>
            </InstrumentPanel>
          </motion.div>

          {/* PANEL 03.6 (5 cols): INTERACTIVE PIN GATE & WHITE-LABEL MASKING */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: 0.14, ease: EASE_OUT_EXPO }}
            className="lg:col-span-5"
          >
            <InstrumentPanel className="h-full p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 pb-3.5 mb-4 border-b border-[#E4E7EC] dark:border-white/[0.08] font-mono text-[11px]">
                <span className="font-bold uppercase tracking-[0.12em] text-[#0066FF] dark:text-[#5294FF]">
                  03.6 // ACCESS &amp; MASKING
                </span>
                <span className="text-[#475467] dark:text-zinc-400">
                  WHITE-LABEL
                </span>
              </div>

              <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#09090B] dark:text-white">
                PIN Gate &amp; Destination Masking
              </h3>
              <p className="mt-1.5 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed">
                Gate private resources behind a PIN screen, customize social
                OpenGraph preview cards, and keep raw target URLs hidden behind
                your brand.
              </p>

              <PinGateMaskingCard />
            </InstrumentPanel>
          </motion.div>
        </div>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 4. SIGNATURE FOCUS: PATHLOCK™ (#pathlock — Full-Bleed Stark Obsidian Band)
// ============================================================================
export function PathLockFocusSection() {
  return (
    <section
      id="pathlock"
      className="relative w-full bg-[#09090B] text-white border-y border-white/[0.10] scroll-mt-24 overflow-x-clip"
    >
      <SectionRailFrame darkSurface className="px-4 sm:px-8 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Editorial Column */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="lg:col-span-5 flex flex-col"
          >
            <SwissSectionIndex
              darkSurface
              index="04"
              label="PERIMETER"
              meta="EXCLUSIVE TO LSHORTER"
            />

            <h2 className="mt-4 text-[30px] sm:text-[40px] font-bold tracking-[-0.04em] leading-[1.06] text-white">
              Expose{" "}
              <code className="font-mono text-[#5294FF] text-[0.9em]">
                /app/dashboard/*
              </code>
              . Lock the rest of your app.
            </h2>

            <p className="mt-4 text-[14.5px] sm:text-[15.5px] text-zinc-400 leading-[1.65]">
              Sharing a staging SaaS or investor preview? PathLock™ enforces a
              strict URL perimeter around your authorized routes so visitors
              cannot browse into unfinished billing, admin, or settings pages.
            </p>

            <div className="mt-6 border-y border-white/[0.10] divide-y divide-white/[0.08] text-[13.5px] text-zinc-300">
              {[
                "Strict URL prefix enforcement — navigation outside the allowed path is intercepted immediately.",
                "Optional team / developer unlock key built straight into the perimeter lock gate.",
                "Combines with Click Caps so private beta links self-destruct after N visits.",
              ].map((line) => (
                <div key={line} className="py-3 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#5294FF] shrink-0 mt-0.5" />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <WaveRevealButton
                href="/#hero-shortener"
                onClick={scrollToHeroShortener}
                variant="primary"
                size="md"
                icon={<Lock className="w-4 h-4" />}
              >
                Lock a demo link with PathLock
              </WaveRevealButton>
              <Link
                href="/docs/pin-protection"
                className="text-[13.5px] font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                Read PathLock docs →
              </Link>
            </div>
          </motion.div>

          {/* Right: 100% English Live Interactive PathLock™ Browser Simulator */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="lg:col-span-7"
          >
            <PathLockInteractiveSimulator />
          </motion.div>
        </div>
      </SectionRailFrame>
    </section>
  );
}
