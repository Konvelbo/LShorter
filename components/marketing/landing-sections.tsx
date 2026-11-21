"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useTransform } from "motion/react";
import {
  Zap,
  ShieldCheck,
  Globe2,
  GitBranch,
  Timer,
  BarChart3,
  QrCode,
  Globe,
  Lock,
  Check,
  X as XIcon,
  ArrowRight,
  ExternalLink,
  Smartphone,
  CreditCard,
  Terminal,
  Copy,
  HelpCircle,
  Sparkles,
  Layers,
  Users,
  Code2,
  Megaphone,
  Building2,
  Link2,
  BookOpen,
} from "lucide-react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import { PRICING_PLANS } from "@/src/config/pricing";

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

const NAMECHEAP_AFFILIATE_URL =
  process.env.NEXT_PUBLIC_NAMECHEAP_AFFILIATE_LINK ||
  "https://namecheap.pxf.io/c/7999167/386170/5618";

function scrollToHeroShortener(e?: React.MouseEvent) {
  if (e) e.preventDefault();
  const el = document.getElementById("hero-shortener");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  window.dispatchEvent(new CustomEvent("lshorter_focus_shortener"));
}

// ─── ACCESSIBLE JARGON TOOLTIP (rounded-[8px]) ───
function JargonTooltip({
  term,
  explanation,
}: {
  term: string;
  explanation: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex items-center gap-0.5 align-baseline"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center gap-0.5 border-b border-dashed border-[#0066FF]/60 text-[#101828] dark:text-white font-medium hover:text-[#0066FF] dark:hover:text-[#5294FF] transition-colors cursor-help"
      >
        <span>{term}</span>
        <HelpCircle className="w-3 h-3 text-[#0066FF] dark:text-[#5294FF] shrink-0" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-2.5 rounded-[8px] bg-[#101828] dark:bg-[#1A1B20] text-white text-[12px] font-normal leading-snug shadow-xl border border-white/12 text-left"
          >
            {explanation}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

// ─── CURSOR SPOTLIGHT BENTO CARD (strictly rounded-[10px]) ───
function SpotlightCard({
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
      className={`group relative rounded-[10px] bg-white dark:bg-[#111216] border border-[#E4E7EC] dark:border-white/10 overflow-hidden transition-colors duration-300 hover:border-[#0066FF]/45 ${className}`}
    >
      {/* Subtle Cursor Spotlight Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
        style={{
          opacity: pos.visible ? 1 : 0,
          background: `radial-gradient(360px circle at ${pos.x}px ${pos.y}px, rgba(0, 102, 255, 0.10), transparent 65%)`,
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
// 1. TRUST STRIP SECTION (Verifiable Facts Only)
// ============================================================================
export function TrustStripSection() {
  return (
    <section className="w-full border-y border-[#E4E7EC] dark:border-white/[0.08] bg-[#F8F9FA] dark:bg-[#0D0E12] py-5 px-4 sm:px-6 transition-colors duration-300">
      <div className="max-w-[1200px] mx-auto flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-[13px] font-medium text-[#475467] dark:text-zinc-400">
        <div className="inline-flex items-center gap-2">
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
            (&lt; 12ms)
          </span>
        </div>

        <span className="hidden sm:inline w-px h-4 bg-[#D0D5DD] dark:bg-white/15" aria-hidden="true" />

        <div className="inline-flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF]" />
          <span>
            Billing secured by{" "}
            <strong className="text-[#101828] dark:text-white font-semibold">
              Dodo Payments
            </strong>
          </span>
        </div>

        <span className="hidden sm:inline w-px h-4 bg-[#D0D5DD] dark:bg-white/15" aria-hidden="true" />

        <div className="inline-flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>
            <strong className="text-[#101828] dark:text-white font-semibold">
              GDPR-friendly
            </strong>{" "}
            · No third-party tracking cookies
          </span>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// 2. HOW IT WORKS (3 Steps with Scroll-Drawn #0066FF Flow Line)
// ============================================================================
const STEPS = [
  {
    num: "01",
    title: "Paste & shorten",
    desc: "Drop any long URL to get an instant lsho.cc link or publish directly on your own custom branded domain.",
    icon: Link2,
  },
  {
    num: "02",
    title: "Customize & lock",
    desc: "Add country or device routing, lock visitor navigation with PathLock™, cap total clicks, or set a PIN gate.",
    icon: Lock,
  },
  {
    num: "03",
    title: "Track clicks & sales",
    desc: "Watch live clicks, cities, devices, referrers, and Stripe checkout attribution stream in real time.",
    icon: BarChart3,
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
      className="w-full py-20 sm:py-26 px-4 sm:px-6 bg-[#FFFFFF] dark:bg-[#09090B] transition-colors duration-300"
    >
      <div className="max-w-[1200px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="text-center max-w-[620px] mx-auto mb-14"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#0066FF]/[0.08] dark:bg-[#0066FF]/[0.16] border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] text-[12px] font-semibold uppercase tracking-wide mb-4">
            How It Works
          </span>
          <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.035em] leading-[1.1] text-[#101828] dark:text-white">
            From raw URL to controlled link{" "}
            <span className="text-[#667085] dark:text-zinc-400 font-medium">
              in three steps.
            </span>
          </h2>
        </motion.div>

        <div className="relative">
          {/* Desktop Scroll-Drawn Blue Flow Line */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute top-11 left-[16%] right-[16%] h-[2px] bg-[#E4E7EC] dark:bg-white/10 z-0 overflow-hidden rounded-full"
          >
            <motion.div
              style={{ scaleX: lineScaleX }}
              className="h-full w-full origin-left bg-gradient-to-r from-[#0066FF] via-[#5294FF] to-[#0066FF]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 relative z-10">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 18 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{
                    duration: 0.45,
                    delay: idx * 0.08,
                    ease: EASE_OUT_EXPO,
                  }}
                  className="rounded-[10px] p-6 bg-white dark:bg-[#111216] border border-[#E4E7EC] dark:border-white/10 hover:border-[#0066FF]/45 transition-colors shadow-2xs flex flex-col"
                >
                  <div className="flex items-center justify-between mb-5">
                    <span className="w-10 h-10 rounded-[10px] bg-[#0066FF]/10 dark:bg-[#0066FF]/18 border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </span>
                    <span className="text-[12px] font-bold tracking-widest text-[#98A2B3] dark:text-zinc-500">
                      STEP {step.num}
                    </span>
                  </div>
                  <h3 className="text-[19px] font-bold tracking-[-0.02em] text-[#101828] dark:text-white mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[14px] text-[#475467] dark:text-zinc-400 leading-[1.65]">
                    {step.desc}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// 3. BENTO GRID OF 6 CORE FEATURES (#features — Zero Repetition + Live Diagrams + Namecheap)
// ============================================================================
export function FeaturesBentoSection() {
  return (
    <section
      id="features"
      className="w-full py-20 sm:py-28 px-4 sm:px-6 bg-[#F8F9FA] dark:bg-[#0C0D10] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24"
    >
      <div className="max-w-[1220px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="max-w-[680px] mb-12 sm:mb-14"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#0066FF]/[0.08] dark:bg-[#0066FF]/[0.16] border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] text-[12px] font-semibold uppercase tracking-wide mb-4">
            Core Platform
          </span>
          <h2 className="text-[28px] sm:text-[42px] font-bold tracking-[-0.035em] leading-[1.08] text-[#101828] dark:text-white">
            Everything you need to route, brand, and measure{" "}
            <span className="text-[#667085] dark:text-zinc-400 font-medium">
              every click.
            </span>
          </h2>
          <p className="mt-4 text-[15px] sm:text-[16.5px] text-[#475467] dark:text-zinc-400 leading-[1.6]">
            Built on{" "}
            <JargonTooltip
              term="Edge routing"
              explanation="Your short links resolve on Cloudflare servers physically closest to each visitor (310+ global PoPs), cutting redirect time to under 12ms."
            />
            , programmable{" "}
            <JargonTooltip
              term="Click Caps"
              explanation="Automatically close a short link or redirect to a fallback URL once an exact number of clicks is reached."
            />
            , and first-party{" "}
            <JargonTooltip
              term="Attribution"
              explanation="Connects each click directly to signups and Stripe checkouts using a first-party qk_cid token — no third-party cookies."
            />
            .
          </p>
        </motion.div>

        {/* 6 Asymmetric Bento Cards (12-col grid, strictly rounded-[10px]) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* CARD 1 (7 cols): SMART EDGE ROUTING + VISUAL 3-BRANCH DIAGRAM */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="lg:col-span-7"
          >
            <SpotlightCard className="h-full p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="w-10 h-10 rounded-[10px] bg-[#0066FF]/10 dark:bg-[#0066FF]/18 border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] flex items-center justify-center">
                  <GitBranch className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-1 rounded-[6px] bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF] text-[11.5px] font-semibold">
                  &lt; 12ms · 310+ PoPs
                </span>
              </div>
              <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#101828] dark:text-white">
                Smart Edge Routing &amp; A/B Split
              </h3>
              <p className="mt-1.5 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed max-w-[540px]">
                One short link sends every visitor to the right destination based
                on ISO country, continent, OS, device, browser, or weighted A/B
                percentages.
              </p>

              {/* Visual Routing Diagram: 1 link -> 3 dynamic destinations */}
              <div className="mt-6 rounded-[10px] p-4 bg-[#F8F9FA] dark:bg-[#0C0D10] border border-[#E4E7EC] dark:border-white/[0.08]">
                <div className="grid grid-cols-1 sm:grid-cols-[auto_1fr] gap-4 items-center">
                  <div className="px-3.5 py-2.5 rounded-[8px] bg-[#0066FF] text-white font-semibold text-[13px] shadow-[0_6px_18px_rgba(0,102,255,0.32)] flex items-center gap-2 justify-center sm:justify-start">
                    <Link2 className="w-4 h-4 shrink-0" />
                    <span>lsho.cc/app</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      {
                        cond: "iPhone (iOS)",
                        dest: "apps.apple.com/your-app",
                        tag: "Device",
                      },
                      {
                        cond: "Android",
                        dest: "play.google.com/your-app",
                        tag: "OS",
                      },
                      {
                        cond: "France (FR)",
                        dest: "fr.yoursite.com/offer",
                        tag: "Country",
                      },
                    ].map((branch) => (
                      <div
                        key={branch.cond}
                        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-[8px] bg-white dark:bg-[#14151A] border border-[#E4E7EC] dark:border-white/[0.08] text-[12.5px]"
                      >
                        <span className="inline-flex items-center gap-1.5 font-semibold text-[#101828] dark:text-white">
                          <span className="px-1.5 py-0.5 rounded-[4px] bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF] text-[10.5px] font-semibold">
                            {branch.tag}
                          </span>
                          <span>{branch.cond}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[#475467] dark:text-zinc-400 truncate">
                          <ArrowRight className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                          <span className="truncate font-medium text-[#101828] dark:text-zinc-200">
                            {branch.dest}
                          </span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* CARD 2 (5 cols): CLICK CAPS & AUTO-EXPIRY */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: 0.06, ease: EASE_OUT_EXPO }}
            className="lg:col-span-5"
          >
            <SpotlightCard className="h-full p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="w-10 h-10 rounded-[10px] bg-[#0066FF]/10 dark:bg-[#0066FF]/18 border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] flex items-center justify-center">
                  <Timer className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-1 rounded-[6px] bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[11.5px] font-semibold">
                  Auto-Deactivate
                </span>
              </div>
              <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#101828] dark:text-white">
                Click Caps &amp; Scheduled Expiry
              </h3>
              <p className="mt-1.5 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed">
                Close a link automatically after an exact number of clicks or at
                a scheduled date — with an optional fallback URL once full.
              </p>

              {/* Visual Click Cap Meter */}
              <div className="mt-auto pt-6">
                <div className="rounded-[10px] p-4 bg-[#F8F9FA] dark:bg-[#0C0D10] border border-[#E4E7EC] dark:border-white/[0.08]">
                  <div className="flex items-center justify-between text-[12.5px] mb-2">
                    <span className="font-semibold text-[#101828] dark:text-white">
                      lsho.cc/private-beta
                    </span>
                    <span className="font-bold text-[#0066FF] dark:text-[#5294FF] tabular-nums">
                      24 / 25 clicks
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#E4E7EC] dark:bg-white/10 overflow-hidden">
                    <div className="h-full w-[96%] rounded-full bg-[#0066FF]" />
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11.5px] text-[#667085] dark:text-zinc-400">
                    <span>Click #26 ➔ fallback URL</span>
                    <span className="px-2 py-0.5 rounded-[5px] bg-white dark:bg-white/[0.06] border border-[#E4E7EC] dark:border-white/10 text-[#344054] dark:text-zinc-300 font-medium">
                      /waitlist
                    </span>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* CARD 3 (7 cols): REAL-TIME TELEMETRY & REVENUE ATTRIBUTION (Example Data) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="lg:col-span-7"
          >
            <SpotlightCard className="h-full p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="w-10 h-10 rounded-[10px] bg-[#0066FF]/10 dark:bg-[#0066FF]/18 border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] flex items-center justify-center">
                  <BarChart3 className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-1 rounded-[6px] bg-zinc-100 dark:bg-white/[0.08] border border-[#E4E7EC] dark:border-white/10 text-[#475467] dark:text-zinc-300 text-[11px] font-semibold">
                  Example data
                </span>
              </div>
              <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#101828] dark:text-white">
                Real-Time Telemetry &amp; Stripe Revenue Attribution
              </h3>
              <p className="mt-1.5 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed">
                See city-level clicks, devices, UTM sources, and connect{" "}
                <strong className="text-[#101828] dark:text-white">
                  Stripe checkouts
                </strong>{" "}
                in 2 minutes via our first-party <code className="px-1.5 py-0.5 rounded-[5px] bg-[#F2F4F7] dark:bg-white/10 text-[12px]">qk_cid</code> token or webhook — plus fire Meta, Google, and TikTok retargeting pixels on click.
              </p>

              {/* Visual Attribution Pipeline */}
              <div className="mt-6 rounded-[10px] p-4 bg-[#F8F9FA] dark:bg-[#0C0D10] border border-[#E4E7EC] dark:border-white/[0.08]">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                  <div className="p-3 rounded-[8px] bg-white dark:bg-[#14151A] border border-[#E4E7EC] dark:border-white/[0.08]">
                    <div className="text-[11px] font-semibold text-[#667085] dark:text-zinc-400 uppercase">
                      1. Click Captured
                    </div>
                    <div className="mt-1 text-[13.5px] font-bold text-[#0066FF] dark:text-[#5294FF]">
                      lsho.cc/launch
                    </div>
                    <div className="text-[11.5px] text-[#667085] dark:text-zinc-400 mt-0.5">
                      Paris · iOS · UTM: x-post
                    </div>
                  </div>

                  <div className="p-3 rounded-[8px] bg-white dark:bg-[#14151A] border border-[#E4E7EC] dark:border-white/[0.08]">
                    <div className="text-[11px] font-semibold text-[#667085] dark:text-zinc-400 uppercase">
                      2. Stripe Checkout
                    </div>
                    <div className="mt-1 text-[13.5px] font-bold text-[#101828] dark:text-white">
                      Pro Yearly Plan
                    </div>
                    <div className="text-[11.5px] text-[#667085] dark:text-zinc-400 mt-0.5">
                      Matched via qk_cid
                    </div>
                  </div>

                  <div className="p-3 rounded-[8px] bg-emerald-500/[0.08] dark:bg-emerald-500/[0.14] border border-emerald-500/30">
                    <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 uppercase">
                      3. Attributed Revenue
                    </div>
                    <div className="mt-1 text-[17px] font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                      $240 earned
                    </div>
                    <div className="text-[11.5px] text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                      Linked directly to slug
                    </div>
                  </div>
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* CARD 4 (5 cols): DYNAMIC VECTOR QR STUDIO */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: 0.1, ease: EASE_OUT_EXPO }}
            className="lg:col-span-5"
          >
            <SpotlightCard className="h-full p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="w-10 h-10 rounded-[10px] bg-[#0066FF]/10 dark:bg-[#0066FF]/18 border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] flex items-center justify-center">
                  <QrCode className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-1 rounded-[6px] bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF] text-[11.5px] font-semibold">
                  SVG · PNG · GIF
                </span>
              </div>
              <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#101828] dark:text-white">
                Dynamic Vector QR Studio
              </h3>
              <p className="mt-1.5 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed">
                15 pixel patterns, 15 corner shapes, custom brand gradients, and
                destination URLs that stay editable even after you print.
              </p>

              <div className="mt-auto pt-5">
                <div className="relative w-full aspect-[16/9] rounded-[8px] overflow-hidden border border-[#E4E7EC] dark:border-white/10 bg-[#F8F9FA] dark:bg-[#0C0D10]">
                  <Image
                    src="/screenshots/light/qr_studio/qr_studio_normal_4k.webp"
                    alt="LShorter Dynamic QR Code Studio"
                    fill
                    sizes="(max-width: 1024px) 100vw, 460px"
                    className="object-cover object-top block dark:hidden"
                  />
                  <Image
                    src="/screenshots/dark/qr_studio/qr_studio_normal_4k.webp"
                    alt="LShorter Dynamic QR Code Studio"
                    fill
                    sizes="(max-width: 1024px) 100vw, 460px"
                    className="object-cover object-top hidden dark:block"
                  />
                </div>
              </div>
            </SpotlightCard>
          </motion.div>

          {/* CARD 5 (7 cols): CUSTOM BRANDED SHORT LINKS & DOMAINS + NAMECHEAP AFFILIATE BLOCK */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: 0.12, ease: EASE_OUT_EXPO }}
            className="lg:col-span-7"
          >
            <SpotlightCard className="h-full p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="w-10 h-10 rounded-[10px] bg-[#0066FF]/10 dark:bg-[#0066FF]/18 border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] flex items-center justify-center">
                  <Globe className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-1 rounded-[6px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11.5px] font-semibold">
                  Automated DNS &amp; SSL
                </span>
              </div>
              <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#101828] dark:text-white">
                Custom Branded Short Links &amp; Domains
              </h3>
              <p className="mt-1.5 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed">
                Replace generic links with your own brand domain (up to 3 custom
                domains included even on the Free Starter plan) with automatic
                CNAME verification and edge SSL certificates.
              </p>

              {/* Branded Transformation Visual */}
              <div className="mt-4 flex flex-wrap items-center gap-2 text-[12.5px]">
                <span className="px-2.5 py-1 rounded-[6px] bg-[#F2F4F7] dark:bg-white/[0.06] text-[#667085] dark:text-zinc-400 line-through">
                  long-campaign-url.com/ref=491...
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-[#0066FF]" />
                <span className="px-2.5 py-1 rounded-[6px] bg-[#0066FF]/10 border border-[#0066FF]/30 text-[#0066FF] dark:text-[#5294FF] font-bold">
                  go.yourbrand.io/deal
                </span>
              </div>

              {/* Embedded Namecheap Partner Card (Impact-compliant: Recommended Registrar · Partner Link) */}
              <div className="mt-5 rounded-[10px] p-4 bg-[#F8F9FA] dark:bg-[#0C0D10] border border-[#E4E7EC] dark:border-white/10 hover:border-[#FF5C35]/45 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="w-10 h-10 rounded-[8px] bg-white dark:bg-[#17181E] border border-[#E4E7EC] dark:border-white/10 flex items-center justify-center shrink-0 shadow-2xs">
                    <NamecheapLogo className="w-5 h-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-bold text-[#101828] dark:text-white">
                        Need a short custom domain?
                      </span>
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-[#FF5C35]/10 text-[#DE3723] dark:text-[#FF7857] text-[10px] font-bold uppercase tracking-wider">
                        Recommended Registrar · Partner Link
                      </span>
                    </div>
                    <p className="mt-0.5 text-[12.5px] text-[#475467] dark:text-zinc-400 leading-snug">
                      Grab a clean <strong className="text-[#101828] dark:text-zinc-200">.io</strong>,{" "}
                      <strong className="text-[#101828] dark:text-zinc-200">.co</strong>, or{" "}
                      <strong className="text-[#101828] dark:text-zinc-200">.link</strong> domain on Namecheap and connect it to LShorter in 60 seconds.
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
            </SpotlightCard>
          </motion.div>

          {/* CARD 6 (5 cols): PASSWORD GATE & WHITE-LABEL MASKING */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.45, delay: 0.14, ease: EASE_OUT_EXPO }}
            className="lg:col-span-5"
          >
            <SpotlightCard className="h-full p-6 sm:p-7">
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="w-10 h-10 rounded-[10px] bg-[#0066FF]/10 dark:bg-[#0066FF]/18 border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] flex items-center justify-center">
                  <Lock className="w-5 h-5" />
                </span>
                <span className="px-2.5 py-1 rounded-[6px] bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF] text-[11.5px] font-semibold">
                  White-Label
                </span>
              </div>
              <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#101828] dark:text-white">
                PIN Gate &amp; Destination Masking
              </h3>
              <p className="mt-1.5 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed">
                Protect private resources with a PIN or password challenge,
                customize social OpenGraph preview cards, and keep raw target
                URLs hidden behind your brand.
              </p>

              <div className="mt-auto pt-5 space-y-2">
                {[
                  "PIN / password screen before destination is revealed",
                  "Custom OpenGraph title, image & Twitter card per link",
                  "Zero-referrer masking for sensitive partner URLs",
                ].map((pt) => (
                  <div
                    key={pt}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] bg-[#F8F9FA] dark:bg-[#0C0D10] border border-[#E4E7EC] dark:border-white/[0.08] text-[12.5px] text-[#344054] dark:text-zinc-300"
                  >
                    <Check className="w-3.5 h-3.5 text-[#0066FF] shrink-0" />
                    <span>{pt}</span>
                  </div>
                ))}
              </div>
            </SpotlightCard>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// 4. SIGNATURE FOCUS: PATHLOCK™ (#pathlock — SaaS Scenario + 4K Screenshot)
// ============================================================================
export function PathLockFocusSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const imageY = useTransform(scrollYProgress, [0, 1], [14, -14]);

  return (
    <section
      ref={sectionRef}
      id="pathlock"
      className="w-full py-20 sm:py-28 px-4 sm:px-6 bg-[#FFFFFF] dark:bg-[#09090B] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24 overflow-hidden"
    >
      <div className="max-w-[1220px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="relative rounded-[10px] p-6 sm:p-10 lg:p-12 bg-[#0B0C10] text-white border border-[#1E2230] shadow-[0_24px_70px_rgba(0,0,0,0.35)] overflow-hidden"
        >
          {/* Ambient Blue Spotlight inside PathLock Showcase */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-24 -right-24 w-[460px] h-[460px] rounded-full bg-[#0066FF]/20 blur-[130px]"
          />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-5 flex flex-col">
              <span className="inline-flex items-center gap-2 self-start px-3 py-1 rounded-[8px] bg-[#0066FF]/20 border border-[#5294FF]/35 text-[#8DB0FF] text-[11.5px] font-bold uppercase tracking-wider mb-5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Exclusive to LShorter · PathLock™</span>
              </span>

              <h2 className="text-[28px] sm:text-[38px] font-bold tracking-[-0.035em] leading-[1.08] text-white">
                Share one page of your SaaS.{" "}
                <span className="text-[#8DB0FF]">Keep the rest locked.</span>
              </h2>

              <p className="mt-4 text-[14.5px] sm:text-[15.5px] text-zinc-300 leading-[1.65]">
                Building a SaaS or web app in private? Share a demo link to{" "}
                <code className="px-1.5 py-0.5 rounded-[5px] bg-white/10 text-[#8DB0FF] text-[13px] font-semibold">
                  /app/dashboard/*
                </code>{" "}
                without letting testers wander into unfinished billing, admin,
                or settings routes.
              </p>

              <ul className="mt-6 space-y-3 text-[13.5px] text-zinc-300">
                {[
                  "Strict URL prefix enforcement — any navigation outside the authorized path is intercepted and blocked.",
                  "Optional developer / team unlock password built right into the lock screen.",
                  "Works alongside click caps so private beta links self-destruct after N visits.",
                ].map((line) => (
                  <li key={line} className="flex items-start gap-2.5">
                    <span className="mt-0.5 w-5 h-5 rounded-[6px] bg-[#0066FF]/25 border border-[#5294FF]/40 text-[#8DB0FF] flex items-center justify-center shrink-0">
                      <Check className="w-3 h-3" />
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8 flex flex-wrap items-center gap-3">
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
                  className="text-[13.5px] font-semibold text-zinc-300 hover:text-white transition-colors px-2 py-2"
                >
                  Read PathLock docs →
                </Link>
              </div>
            </div>

            {/* Right 4K PathLock Blocking Screenshot with Subtle Scroll Parallax */}
            <div className="lg:col-span-7">
              <motion.div
                style={{ y: imageY }}
                className="relative rounded-[10px] overflow-hidden border border-white/15 shadow-[0_24px_64px_rgba(0,0,0,0.65)] bg-[#09090B]"
              >
                <div className="relative w-full aspect-[16/9]">
                  <Image
                    src="/screenshots/pathlock/pathlock_blocked_with_top_4k.png"
                    alt="PathLock perimeter lock screen intercepting unauthorized navigation outside /app/dashboard/*"
                    fill
                    sizes="(max-width: 1024px) 100vw, 680px"
                    className="object-cover"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// 5. THE LSHORTER DIFFERENCE (#difference — What LShorter Does That Others Don't)
// ============================================================================
const COMPARISON_ROWS = [
  {
    feature: "Post-click perimeter control (PathLock™)",
    others: "Stops working after the redirect — visitors can explore your entire site",
    lshorter: "Locks visitors strictly inside your authorized URL prefix (e.g. /app/dashboard/*)",
  },
  {
    feature: "Self-destructing click caps + fallback",
    others: "Not included or locked behind expensive custom enterprise contracts",
    lshorter: "Deactivate at an exact click count (e.g. 25 beta spots) or redirect to a fallback URL",
  },
  {
    feature: "Multi-condition Edge routing (< 12ms)",
    others: "1 static URL per link, centralized redirects (80–150ms)",
    lshorter: "Route 1 link by country, OS, device, browser, or weighted A/B split on 310+ PoPs",
  },
  {
    feature: "White-label masking & PIN gate",
    others: "Exposes the raw destination URL immediately in the address bar",
    lshorter: "Masked viewer with your brand title, custom OpenGraph cards, and PIN challenge",
  },
  {
    feature: "Editable Vector QR Studio (15 styles)",
    others: "Basic black-and-white bitmap QR or paid $35+/mo add-on",
    lshorter: "15 pixel & eye styles, brand gradients, SVG/PNG/GIF export — editable after print",
  },
  {
    feature: "Cookie-free Stripe revenue attribution",
    others: "Raw click counts only — no visibility into which link produced sales",
    lshorter: "Attributes signups and Stripe checkouts directly back to each short slug",
  },
  {
    feature: "Free Starter plan (verified limits)",
    others: "Bitly Free: 5 links/month, 0 custom domains, basic stats",
    lshorter: "50 permanent links, 10,000 clicks/month, 3 custom domains, real-time analytics",
  },
];

export function DifferenceSection() {
  return (
    <section
      id="difference"
      className="w-full py-20 sm:py-28 px-4 sm:px-6 bg-[#F8F9FA] dark:bg-[#0C0D10] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24"
    >
      <div className="max-w-[1220px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="text-center max-w-[720px] mx-auto mb-12"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#0066FF]/[0.08] dark:bg-[#0066FF]/[0.16] border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] text-[12px] font-semibold uppercase tracking-wide mb-4">
            The LShorter Difference
          </span>
          <h2 className="text-[28px] sm:text-[42px] font-bold tracking-[-0.035em] leading-[1.08] text-[#101828] dark:text-white">
            What LShorter does that{" "}
            <span className="text-[#0066FF] dark:text-[#5294FF]">
              traditional shorteners don&apos;t.
            </span>
          </h2>
          <p className="mt-4 text-[15px] sm:text-[16.5px] text-[#475467] dark:text-zinc-400 leading-[1.6]">
            Legacy tools like Bitly or TinyURL stop helping the millisecond a
            redirect happens. LShorter keeps routing, protecting, and
            attributing every visit.
          </p>
        </motion.div>

        {/* Responsive Comparison Matrix (strictly rounded-[10px]) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="rounded-[10px] border border-[#E4E7EC] dark:border-white/12 bg-white dark:bg-[#111216] overflow-hidden shadow-[0_14px_40px_rgba(16,24,40,0.06)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.45)]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-[#E4E7EC] dark:border-white/10 bg-[#F8F9FA] dark:bg-white/[0.03]">
                  <th className="py-4 px-5 text-[12px] font-bold uppercase tracking-wider text-[#667085] dark:text-zinc-400 w-[26%]">
                    Capability
                  </th>
                  <th className="py-4 px-5 text-[12px] font-bold uppercase tracking-wider text-[#667085] dark:text-zinc-400 w-[34%]">
                    Traditional Shorteners (Bitly, TinyURL…)
                  </th>
                  <th className="py-4 px-5 text-[12px] font-bold uppercase tracking-wider text-[#0066FF] dark:text-[#5294FF] bg-[#0066FF]/[0.05] dark:bg-[#0066FF]/[0.10] border-l border-[#0066FF]/20 w-[40%]">
                    LShorter
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-white/[0.08] text-[13.5px]">
                {COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.feature}
                    className="hover:bg-[#F8F9FA]/70 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-5 font-semibold text-[#101828] dark:text-white align-top">
                      {row.feature}
                    </td>
                    <td className="py-4 px-5 text-[#667085] dark:text-zinc-400 align-top">
                      <div className="flex items-start gap-2">
                        <XIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0 mt-0.5" />
                        <span>{row.others}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 bg-[#0066FF]/[0.03] dark:bg-[#0066FF]/[0.06] border-l border-[#0066FF]/15 text-[#101828] dark:text-zinc-100 font-medium align-top">
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 w-4.5 h-4.5 rounded-[5px] bg-[#0066FF] text-white flex items-center justify-center shrink-0">
                          <Check className="w-3 h-3 stroke-[2.75]" />
                        </span>
                        <span>{row.lshorter}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="mt-8 flex justify-center">
          <WaveRevealButton
            href="/#hero-shortener"
            onClick={scrollToHeroShortener}
            variant="primary"
            size="md"
            icon={<Link2 className="w-4 h-4" />}
          >
            Test the difference — shorten a link now
          </WaveRevealButton>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// 6. USE CASES BY ROLE (4 Tabs with Concrete 1-Sentence Scenarios + Sliding Pill)
// ============================================================================
const USE_CASES = [
  {
    id: "founders",
    label: "SaaS Founders & Devs",
    icon: Code2,
    scenario:
      "You share a staging demo of your SaaS: one link locks testers strictly inside /app/dashboard/* and automatically closes after 25 clicks.",
    bullets: [
      "Prevent beta testers from exploring unfinished routes with PathLock™",
      "Cap private invite batches with exact click limits + waitlist fallback",
      "Automate link provisioning directly from CI/CD via REST API",
    ],
    sampleLink: "go.acmesaas.io/beta-v2",
    sampleRule: "PathLock: /app/dashboard/* · Cap: 25 clicks",
  },
  {
    id: "marketers",
    label: "Affiliates & Marketers",
    icon: Megaphone,
    scenario:
      "You run paid ads across regions: one short link routes French visitors to your FR checkout, fires Meta & TikTok pixels, and shows which post drove the sale.",
    bullets: [
      "Split-test two landing pages with weighted A/B routing on 1 link",
      "Fire Meta Ads, Google Ads & TikTok retargeting pixels automatically",
      "Connect Stripe checkouts to see exact revenue per short link",
    ],
    sampleLink: "deals.brand.co/spring",
    sampleRule: "FR ➔ /fr-offer · A/B 50/50 · Meta Pixel ON",
  },
  {
    id: "creators",
    label: "Creators",
    icon: Users,
    scenario:
      "You share a product link on Instagram and YouTube: iPhone followers go straight to the App Store, Android to Google Play, and you track every click live.",
    bullets: [
      "Smart OS detection routes iOS, Android, and desktop visitors automatically",
      "Custom OpenGraph cards so links look sharp on X, LinkedIn, and Discord",
      "Branded vector QR codes for merch, slides, and live events",
    ],
    sampleLink: "lsho.cc/creator-kit",
    sampleRule: "iOS ➔ App Store · Android ➔ Play Store",
  },
  {
    id: "agencies",
    label: "Agencies",
    icon: Building2,
    scenario:
      "You manage campaigns for multiple clients: give every client their own verified short domain, live geo reports, and password-protected preview links.",
    bullets: [
      "Connect up to 15 custom client domains with automated DNS & SSL",
      "Export clean CSV/Excel reports for every client campaign in 1 click",
      "Protect confidential pitch decks and client previews behind a PIN gate",
    ],
    sampleLink: "go.clientbrand.com/q4",
    sampleRule: "Custom SSL · PIN Gate · CSV Telemetry Export",
  },
];

export function UseCasesSection() {
  const [activeId, setActiveId] = useState(USE_CASES[0].id);
  const current = USE_CASES.find((u) => u.id === activeId) || USE_CASES[0];

  return (
    <section className="w-full py-20 sm:py-26 px-4 sm:px-6 bg-[#FFFFFF] dark:bg-[#09090B] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300">
      <div className="max-w-[1120px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="text-center max-w-[640px] mx-auto mb-10"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#0066FF]/[0.08] dark:bg-[#0066FF]/[0.16] border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] text-[12px] font-semibold uppercase tracking-wide mb-4">
            Built For Real Workflows
          </span>
          <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.035em] leading-[1.1] text-[#101828] dark:text-white">
            One platform, tailored to{" "}
            <span className="text-[#667085] dark:text-zinc-400 font-medium">
              how you ship.
            </span>
          </h2>
        </motion.div>

        {/* Tab Bar with Physically Sliding #0066FF Pill */}
        <div className="flex flex-wrap justify-center gap-1.5 p-1.5 rounded-[10px] bg-[#F2F4F7] dark:bg-[#14151A] border border-[#E4E7EC] dark:border-white/10 max-w-fit mx-auto mb-8">
          {USE_CASES.map((tab) => {
            const Icon = tab.icon;
            const isSelected = tab.id === activeId;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveId(tab.id)}
                className={`relative px-4 py-2 rounded-[8px] text-[13.5px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-2 ${
                  isSelected
                    ? "text-white"
                    : "text-[#475467] dark:text-zinc-400 hover:text-[#101828] dark:hover:text-white"
                }`}
              >
                {isSelected && (
                  <motion.span
                    layoutId="use-case-pill"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-[8px] bg-[#0066FF] shadow-[0_4px_14px_rgba(0,102,255,0.35)] z-0"
                  />
                )}
                <Icon className="w-4 h-4 relative z-10 shrink-0" />
                <span className="relative z-10">{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Animated Content Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
            className="rounded-[10px] p-6 sm:p-8 bg-[#F8F9FA] dark:bg-[#111216] border border-[#E4E7EC] dark:border-white/10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center"
          >
            <div className="lg:col-span-7">
              <p className="text-[18px] sm:text-[21px] font-semibold tracking-[-0.02em] leading-[1.4] text-[#101828] dark:text-white">
                &ldquo;{current.scenario}&rdquo;
              </p>
              <ul className="mt-5 space-y-2.5">
                {current.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-[14px] text-[#475467] dark:text-zinc-300"
                  >
                    <Check className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5">
              <div className="rounded-[10px] p-5 bg-white dark:bg-[#0B0C10] border border-[#E4E7EC] dark:border-white/12 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-zinc-500 mb-2">
                  Configured Link Example
                </div>
                <div className="text-[16px] font-bold text-[#0066FF] dark:text-[#5294FF] break-all">
                  {current.sampleLink}
                </div>
                <div className="mt-3 px-3 py-2 rounded-[8px] bg-[#F8F9FA] dark:bg-white/[0.04] border border-[#E4E7EC] dark:border-white/[0.08] text-[12.5px] font-medium text-[#344054] dark:text-zinc-300">
                  {current.sampleRule}
                </div>
                <div className="mt-4">
                  <WaveRevealButton
                    href="/#hero-shortener"
                    onClick={scrollToHeroShortener}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Try this workflow — no signup
                  </WaveRevealButton>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

// ============================================================================
// 7. DEVELOPER-FIRST REST API & WEBHOOKS (#api — Terminal + Button to /docs)
// ============================================================================
const API_SNIPPETS: Record<
  "curl" | "ts" | "python" | "webhook",
  { label: string; code: string }
> = {
  curl: {
    label: "cURL",
    code: `curl -X POST https://lsho.cc/api/v1/links \\
  -H "Authorization: Bearer lsh_live_9f8a2c..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetUrl": "https://app.acmesaas.io/app/dashboard",
    "slug": "beta-demo",
    "maxClicks": 50,
    "pathLockMode": "strict",
    "pathLockPrefix": "/app/dashboard",
    "geoTargeting": { "FR": "https://fr.acmesaas.io/demo" }
  }'`,
  },
  ts: {
    label: "TypeScript",
    code: `const res = await fetch("https://lsho.cc/api/v1/links", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.LSHORTER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    targetUrl: "https://app.acmesaas.io/app/dashboard",
    slug: "beta-demo",
    maxClicks: 50,
    pathLockMode: "strict",
    pathLockPrefix: "/app/dashboard",
  }),
});

const { data } = await res.json();
console.log(data.short_url); // https://lsho.cc/beta-demo`,
  },
  python: {
    label: "Python",
    code: `import os, requests

response = requests.post(
    "https://lsho.cc/api/v1/links",
    headers={"Authorization": f"Bearer {os.environ['LSHORTER_API_KEY']}"},
    json={
        "targetUrl": "https://app.acmesaas.io/app/dashboard",
        "slug": "beta-demo",
        "maxClicks": 50,
        "pathLockMode": "strict",
        "pathLockPrefix": "/app/dashboard",
    },
)
print(response.json()["data"]["short_url"])`,
  },
  webhook: {
    label: "Webhook Payload",
    code: `{
  "event": "link.clicked",
  "slug": "beta-demo",
  "shortUrl": "https://lsho.cc/beta-demo",
  "country": "FR",
  "city": "Paris",
  "device": "mobile",
  "os": "iOS",
  "clickId": "qk_cid_89a1f02b",
  "timestamp": "2026-11-21T04:12:08.412Z"
}`,
  },
};

export function DeveloperApiSection() {
  const [lang, setLang] = useState<"curl" | "ts" | "python" | "webhook">("curl");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(API_SNIPPETS[lang].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <section
      id="api"
      className="w-full py-20 sm:py-28 px-4 sm:px-6 bg-[#F8F9FA] dark:bg-[#0C0D10] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24"
    >
      <div className="max-w-[1220px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        {/* Left Column: Description & Primary Button to /docs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="lg:col-span-5"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#0066FF]/[0.08] dark:bg-[#0066FF]/[0.16] border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] text-[12px] font-semibold uppercase tracking-wide mb-4">
            <Terminal className="w-3.5 h-3.5" />
            <span>Developer-First REST API</span>
          </span>

          <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.035em] leading-[1.08] text-[#101828] dark:text-white">
            Automate links, PathLock &amp; webhooks{" "}
            <span className="text-[#667085] dark:text-zinc-400 font-medium">
              from your code.
            </span>
          </h2>

          <p className="mt-4 text-[15px] text-[#475467] dark:text-zinc-400 leading-[1.65]">
            Provision short links programmatically, attach PathLock™ prefixes,
            set click caps, and receive real-time webhook payloads on every
            click or conversion.
          </p>

          <ul className="mt-6 space-y-3 text-[13.5px] text-[#344054] dark:text-zinc-300">
            {[
              {
                title: "SHA-256 Scoped API Keys",
                desc: "Granular read and read_write Bearer tokens with configurable rate limits.",
              },
              {
                title: "Instant Global Edge KV Sync",
                desc: "Every POST or PATCH propagates across 310+ edge PoPs immediately.",
              },
              {
                title: "Signed Real-Time Webhooks",
                desc: "Stream click geo, device metadata, and conversion events directly to your backend.",
              },
            ].map((item) => (
              <li key={item.title} className="flex items-start gap-2.5">
                <span className="mt-0.5 w-5 h-5 rounded-[6px] bg-[#0066FF]/12 border border-[#0066FF]/30 text-[#0066FF] dark:text-[#5294FF] flex items-center justify-center shrink-0">
                  <Check className="w-3 h-3" />
                </span>
                <span>
                  <strong className="text-[#101828] dark:text-white font-semibold">
                    {item.title}:
                  </strong>{" "}
                  {item.desc}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <WaveRevealButton
              href="/docs"
              variant="primary"
              size="md"
              icon={<BookOpen className="w-4 h-4" />}
            >
              Explore API documentation
            </WaveRevealButton>
            <WaveRevealButton
              href="/docs/sdk-quickstart"
              variant="outline"
              size="md"
              icon={<Terminal className="w-4 h-4" />}
            >
              Quickstart guide
            </WaveRevealButton>
          </div>
        </motion.div>

        {/* Right Column: Interactive Code Terminal (strictly rounded-[10px]) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.08, ease: EASE_OUT_EXPO }}
          className="lg:col-span-7"
        >
          <div className="rounded-[10px] bg-[#0B0C10] border border-[#222531] shadow-[0_22px_60px_rgba(0,0,0,0.35)] overflow-hidden">
            {/* Terminal Top Bar */}
            <div className="px-4 py-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 bg-[#111319]">
              <div className="flex items-center gap-1.5 flex-wrap">
                {(Object.keys(API_SNIPPETS) as Array<keyof typeof API_SNIPPETS>).map(
                  (key) => {
                    const isSelected = lang === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setLang(key)}
                        className={`relative px-3 py-1.5 rounded-[7px] text-[12px] font-semibold transition-colors cursor-pointer ${
                          isSelected
                            ? "text-white"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="api-code-tab"
                            transition={{ type: "spring", stiffness: 450, damping: 35 }}
                            className="absolute inset-0 rounded-[7px] bg-[#0066FF] z-0"
                          />
                        )}
                        <span className="relative z-10">
                          {API_SNIPPETS[key].label}
                        </span>
                      </button>
                    );
                  }
                )}
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="h-8 px-2.5 rounded-[7px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-200 text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy code</span>
                  </>
                )}
              </button>
            </div>

            {/* Code Body */}
            <div className="p-5 overflow-x-auto">
              <pre className="text-[12.5px] sm:text-[13px] leading-[1.65] text-zinc-200">
                <code className="code-syntax">{API_SNIPPETS[lang].code}</code>
              </pre>
            </div>

            {/* Live Edge Response Footer */}
            <div className="px-4 py-2.5 border-t border-white/[0.08] bg-[#111319] flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
              <span className="inline-flex items-center gap-2 text-emerald-400 font-semibold">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>201 Created · Edge KV synced</span>
              </span>
              <span className="text-zinc-400">
                POST /api/v1/links · Bearer SHA-256 Auth
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}

// ============================================================================
// 8. CONDENSED PRICING PREVIEW (Exact Authoritative Plans from src/config/pricing.ts)
// ============================================================================
export function PricingPreviewSection() {
  const [yearly, setYearly] = useState(true);

  const plans = [
    {
      def: PRICING_PLANS.FREE,
      badge: "Start Free Forever",
      highlight: false,
      cta: "Shorten free — no card",
      ctaHref: "/register",
      features: [
        "50 permanent active links",
        "10,000 tracked clicks / month",
        "3 custom branded domains + SSL",
        "PathLock™ & PIN protection",
        "Dynamic QR Code Studio",
        "30-day real-time analytics",
      ],
    },
    {
      def: PRICING_PLANS.PRO,
      badge: "Most Popular",
      highlight: true,
      cta: "Upgrade to Pro",
      ctaHref: "/pricing",
      features: [
        "1,000 active links",
        "150,000 clicks / month (+ auto-overage)",
        "6 custom branded domains",
        "Smart Geo, OS, Device & A/B Routing",
        "5 retargeting pixels (Meta, Google, TikTok)",
        "1-year analytics & Stripe attribution",
      ],
    },
    {
      def: PRICING_PLANS.BUSINESS,
      badge: "Teams & Agencies",
      highlight: false,
      cta: "Explore Business",
      ctaHref: "/pricing",
      features: [
        "Unlimited active links",
        "500,000 clicks / month (+ auto-overage)",
        "15 custom branded domains",
        "5 team seats included",
        "Unlimited retargeting pixels & webhooks",
        "Unlimited analytics retention + 600 req/min API",
      ],
    },
  ];

  return (
    <section
      id="pricing-preview"
      className="w-full py-20 sm:py-28 px-4 sm:px-6 bg-[#FFFFFF] dark:bg-[#09090B] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24"
    >
      <div className="max-w-[1160px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="text-center max-w-[660px] mx-auto mb-10"
        >
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-[#0066FF]/[0.08] dark:bg-[#0066FF]/[0.16] border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] text-[12px] font-semibold uppercase tracking-wide mb-4">
            Transparent Pricing
          </span>
          <h2 className="text-[28px] sm:text-[42px] font-bold tracking-[-0.035em] leading-[1.08] text-[#101828] dark:text-white">
            Start free forever.{" "}
            <span className="text-[#667085] dark:text-zinc-400 font-medium">
              Scale when traffic grows.
            </span>
          </h2>
          <p className="mt-3 text-[15px] text-[#475467] dark:text-zinc-400">
            No credit card required to get started. Upgrade or cancel anytime.
          </p>

          {/* Monthly / Yearly Toggle */}
          <div className="mt-6 inline-flex items-center gap-1 p-1 rounded-[10px] bg-[#F2F4F7] dark:bg-[#14151A] border border-[#E4E7EC] dark:border-white/10">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer ${
                !yearly
                  ? "bg-white dark:bg-[#0066FF] text-[#101828] dark:text-white shadow-2xs"
                  : "text-[#667085] dark:text-zinc-400"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                yearly
                  ? "bg-[#0066FF] text-white shadow-2xs"
                  : "text-[#667085] dark:text-zinc-400"
              }`}
            >
              <span>Yearly</span>
              <span
                className={`px-1.5 py-0.5 rounded-[4px] text-[10.5px] font-bold ${
                  yearly
                    ? "bg-white/20 text-white"
                    : "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                }`}
              >
                Save up to 50%
              </span>
            </button>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {plans.map((p, idx) => {
            const displayPrice =
              p.def.monthlyPrice === 0
                ? "$0"
                : yearly
                  ? `$${p.def.promoYearly.equivalentMonthlyPrice.toFixed(2).replace(/\.00$/, "")}`
                  : `$${p.def.monthlyPrice}`;

            return (
              <motion.div
                key={p.def.id}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{
                  duration: 0.45,
                  delay: idx * 0.07,
                  ease: EASE_OUT_EXPO,
                }}
                className={`relative rounded-[10px] p-6 sm:p-7 flex flex-col border transition-all ${
                  p.highlight
                    ? "bg-white dark:bg-[#111216] border-[#0066FF] shadow-[0_18px_48px_rgba(0,102,255,0.14)] dark:shadow-[0_20px_54px_rgba(0,102,255,0.22)]"
                    : "bg-[#F8F9FA] dark:bg-[#111216] border-[#E4E7EC] dark:border-white/10"
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <h3 className="text-[19px] font-bold text-[#101828] dark:text-white">
                    {p.def.name}
                  </h3>
                  <span
                    className={`px-2.5 py-1 rounded-[6px] text-[11px] font-bold ${
                      p.highlight
                        ? "bg-[#0066FF] text-white"
                        : "bg-white dark:bg-white/[0.06] border border-[#E4E7EC] dark:border-white/10 text-[#475467] dark:text-zinc-300"
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-[38px] font-bold tracking-[-0.04em] text-[#101828] dark:text-white tabular-nums">
                    {displayPrice}
                  </span>
                  <span className="text-[13.5px] text-[#667085] dark:text-zinc-400">
                    / month
                  </span>
                </div>
                <p className="text-[12px] text-[#667085] dark:text-zinc-400 mb-6 min-h-[18px]">
                  {p.def.monthlyPrice === 0
                    ? "Free forever · No credit card required"
                    : yearly
                      ? `Billed $${p.def.yearlyPrice}/year (${p.def.promoYearly.discountPercent}% off)`
                      : `Launch offer: $${p.def.promoMonthly.firstMonthPrice.toFixed(2)}/mo for first 2 months`}
                </p>

                <ul className="space-y-2.5 text-[13.5px] text-[#344054] dark:text-zinc-300 mb-7 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <WaveRevealButton
                  href={p.ctaHref}
                  variant={p.highlight ? "primary" : "outline"}
                  size="md"
                  className="w-full"
                >
                  {p.cta}
                </WaveRevealButton>
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0066FF] dark:text-[#5294FF] hover:underline"
          >
            <span>Compare all plans &amp; Enterprise limits</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
