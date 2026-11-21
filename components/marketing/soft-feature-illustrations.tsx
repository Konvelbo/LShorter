"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  Lock,
  Unlock,
  ShieldCheck,
  Sparkles,
  Globe,
  Plus,
  QrCode,
  ArrowUpRight,
} from "lucide-react";

/**
 * Viewport visibility hook so auto-animated illustrations only tick while visible
 * on screen (0% CPU when the visitor is in the Hero or Footer sections).
 */
function useInViewport(ref: React.RefObject<HTMLElement | null>): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin: "120px 0px", threshold: 0.05 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref]);

  return inView;
}

// ============================================================================
// 1. SMART GEO, DEVICE & A/B ROUTING — Soft Segmented Bar & Live Route Illustration
// ============================================================================
const ROUTE_ROWS = [
  {
    id: "ios",
    label: "iOS · France",
    target: "apps.apple.com/fr",
    count: "6,420",
    dot: "bg-[#6366F1]",
    bar: "bg-[#6366F1]",
    pct: 44,
  },
  {
    id: "android",
    label: "Android · Global",
    target: "play.google.com",
    count: "4,190",
    dot: "bg-[#8B5CF6]",
    bar: "bg-[#8B5CF6]",
    pct: 28,
  },
  {
    id: "ab",
    label: "A/B Split · 50/50",
    target: "/pricing-v2",
    count: "2,810",
    dot: "bg-[#0EA5E9]",
    bar: "bg-[#0EA5E9]",
    pct: 18,
  },
  {
    id: "fallback",
    label: "Desktop Fallback",
    target: "/web-launch",
    count: "1,400",
    dot: "bg-[#F59E0B]",
    bar: "bg-[#F59E0B]",
    pct: 10,
  },
];

export function SoftSmartRoutingIllustration() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInViewport(containerRef);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % ROUTE_ROWS.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [inView]);

  return (
    <div
      ref={containerRef}
      className="mt-6 rounded-[10px] bg-white dark:bg-[#0D0E14] border border-black/[0.04] dark:border-white/[0.07] shadow-[0_8px_28px_-8px_rgba(16,24,40,0.08)] dark:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.55)] p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium text-[#71717A] dark:text-zinc-400">
            Edge Decisions (24h)
          </div>
          <div className="mt-0.5 text-[22px] font-bold tracking-[-0.03em] text-[#09090B] dark:text-white tabular-nums">
            14,820 Routes
          </div>
        </div>
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border border-[#E4E7EC] dark:border-white/10 bg-[#F9FAFB] dark:bg-white/[0.04] text-[11px] font-medium text-[#344054] dark:text-zinc-300">
          <Globe className="w-3 h-3 text-[#6366F1]" />
          <span>11.2 ms</span>
        </span>
      </div>

      {/* Auto-cycling Route List */}
      <div className="mt-4 space-y-2">
        {ROUTE_ROWS.map((row, i) => {
          const isActive = i === activeIdx;
          return (
            <div
              key={row.id}
              className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-[7px] transition-colors duration-300 ${
                isActive
                  ? "bg-[#EEF2FF] dark:bg-[#6366F1]/[0.16]"
                  : "bg-transparent"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 transition-transform duration-300 ${row.dot} ${
                    isActive ? "scale-125" : "scale-100 opacity-75"
                  }`}
                />
                <span
                  className={`text-[12.5px] truncate transition-colors duration-300 ${
                    isActive
                      ? "font-semibold text-[#1E1B4B] dark:text-white"
                      : "font-medium text-[#475467] dark:text-zinc-400"
                  }`}
                >
                  {row.label}
                </span>
              </div>
              <span className="font-mono text-[11.5px] text-[#667085] dark:text-zinc-400 tabular-nums shrink-0">
                {row.count} clicks
              </span>
            </div>
          );
        })}
      </div>

      {/* Soft Segmented Pill Bar (inspired by reference card 1) */}
      <div className="mt-4 flex items-center gap-1.5 h-3 w-full">
        {ROUTE_ROWS.map((row, i) => {
          const isActive = i === activeIdx;
          return (
            <div
              key={row.id}
              style={{ width: `${row.pct}%` }}
              className={`h-full rounded-full transition-all duration-500 ${row.bar} ${
                isActive ? "opacity-100 scale-y-110" : "opacity-55"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 2. CLICK CAPS & SCHEDULED EXPIRY — Soft Stacked Rule Card ("Assignments" style)
// ============================================================================
const CAP_STATES = [
  { count: 22, max: 25, status: "Active", badgeCls: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300", fallback: false },
  { count: 24, max: 25, status: "Almost Full", badgeCls: "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300", fallback: false },
  { count: 25, max: 25, status: "Cap Reached", badgeCls: "bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300", fallback: true },
];

export function SoftClickCapIllustration() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInViewport(containerRef);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % CAP_STATES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [inView]);

  const current = CAP_STATES[step];
  const pct = Math.round((current.count / current.max) * 100);

  return (
    <div
      ref={containerRef}
      className="mt-6 rounded-[10px] bg-white dark:bg-[#0D0E14] border border-black/[0.04] dark:border-white/[0.07] shadow-[0_8px_28px_-8px_rgba(16,24,40,0.08)] dark:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.55)] p-5 flex flex-col gap-3.5"
    >
      <div className="flex items-center justify-between">
        <span className="text-[13.5px] font-semibold text-[#09090B] dark:text-white">
          Access Limits
        </span>
        <span className="text-[11.5px] font-mono text-[#6366F1] dark:text-[#A5B4FC]">
          Edge Guard
        </span>
      </div>

      {/* Inner Floating Rule Card */}
      <div className="rounded-[9px] bg-[#F8F9FC] dark:bg-[#141620] border border-[#E8EAF2] dark:border-white/[0.08] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-mono text-[#71717A] dark:text-zinc-400">
            lsho.cc/vip-invite
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold transition-colors duration-300 ${current.badgeCls}`}
          >
            {current.status}
          </span>
        </div>

        <div className="mt-2 text-[13.5px] font-semibold text-[#09090B] dark:text-white leading-snug">
          Beta Launch Access · 25 Clicks Max
        </div>

        {/* Animated Progress Meter */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
            <span className="text-[#667085] dark:text-zinc-400">Quota used</span>
            <span className="font-semibold text-[#09090B] dark:text-white tabular-nums">
              {current.count} / {current.max}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#E4E7EC] dark:bg-white/10 overflow-hidden">
            <div
              style={{ width: `${pct}%` }}
              className={`h-full rounded-full transition-all duration-700 ease-out ${
                current.fallback ? "bg-rose-500" : "bg-[#6366F1]"
              }`}
            />
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between">
          <span className="px-2 py-0.5 rounded-[6px] bg-[#6366F1] text-white text-[10.5px] font-medium">
            Auto-Expiry
          </span>
          <span className="text-[11px] text-[#667085] dark:text-zinc-400">
            {current.fallback ? "Redirect -> /waitlist" : "Expires in 24h"}
          </span>
        </div>
      </div>

      {/* Soft Dashed Action Pill (inspired by "+ Add new assignment") */}
      <div
        className={`rounded-[9px] border border-dashed px-3.5 py-2.5 flex items-center justify-center gap-2 text-[12px] font-medium transition-colors duration-500 ${
          current.fallback
            ? "border-[#6366F1]/60 bg-[#EEF2FF] dark:bg-[#6366F1]/15 text-[#4338CA] dark:text-[#C7D2FE]"
            : "border-[#C7D2FE] dark:border-white/15 bg-[#F5F7FF]/70 dark:bg-white/[0.03] text-[#4F46E5] dark:text-[#A5B4FC]"
        }`}
      >
        <span className="w-4 h-4 rounded-[5px] bg-[#6366F1] text-white flex items-center justify-center shrink-0">
          {current.fallback ? (
            <Check className="w-2.5 h-2.5" />
          ) : (
            <Plus className="w-2.5 h-2.5" />
          )}
        </span>
        <span>
          {current.fallback
            ? "Fallback routed to /waitlist"
            : "Auto-redirect to waitlist when full"}
        </span>
      </div>
    </div>
  );
}

// ============================================================================
// 3. LIVE ATTRIBUTION & PIXEL FEED — Tall Stacked Card ("New Messages" style)
// ============================================================================
const ATTRIBUTION_EVENTS = [
  {
    id: "ev1",
    badge: "S",
    badgeBg: "bg-[#635BFF]",
    title: "Revenue Attributed",
    subtitle: "lsho.cc/launch · +$240.00 Pro Yearly",
    time: "Just now",
    pill: "+$240",
    pillTone: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  {
    id: "ev2",
    badge: "M",
    badgeBg: "bg-[#0866FF]",
    title: "Meta CAPI Pixel",
    subtitle: "Purchase event synced · 0 cookies",
    time: "2s ago",
    pill: "200 OK",
    pillTone: "bg-[#EEF2FF] text-[#4338CA] dark:bg-[#6366F1]/20 dark:text-[#C7D2FE]",
  },
  {
    id: "ev3",
    badge: "G",
    badgeBg: "bg-[#4285F4]",
    title: "Google Ads GCLID",
    subtitle: "First-party click token matched",
    time: "8s ago",
    pill: "9 ms",
    pillTone: "bg-[#EEF2FF] text-[#4338CA] dark:bg-[#6366F1]/20 dark:text-[#C7D2FE]",
  },
  {
    id: "ev4",
    badge: "T",
    badgeBg: "bg-[#11131A] dark:bg-zinc-700",
    title: "TikTok Events API",
    subtitle: "lsho.cc/creator · Paris, iOS 18",
    time: "14s ago",
    pill: "Fired",
    pillTone: "bg-purple-500/15 text-purple-700 dark:text-purple-300",
  },
  {
    id: "ev5",
    badge: "L",
    badgeBg: "bg-[#0A66C2]",
    title: "LinkedIn Insight",
    subtitle: "lsho.cc/b2b-demo · Enterprise lead",
    time: "26s ago",
    pill: "Tracked",
    pillTone: "bg-sky-500/15 text-sky-700 dark:text-sky-300",
  },
];

export function SoftLiveAttributionIllustration() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInViewport(containerRef);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setOffset((prev) => (prev + 1) % ATTRIBUTION_EVENTS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, [inView]);

  const ordered = [
    ...ATTRIBUTION_EVENTS.slice(offset),
    ...ATTRIBUTION_EVENTS.slice(0, offset),
  ];

  return (
    <div ref={containerRef} className="mt-6 flex-1 flex flex-col justify-end">
      {/* Subtle Stacked Paper Layers Behind Top Edge (just like reference card 3) */}
      <div
        aria-hidden="true"
        className="w-[84%] h-2.5 mx-auto rounded-t-[8px] bg-white/55 dark:bg-white/[0.04] border-t border-x border-black/[0.03] dark:border-white/[0.05]"
      />
      <div
        aria-hidden="true"
        className="w-[92%] h-2.5 mx-auto rounded-t-[8px] bg-white/80 dark:bg-white/[0.06] border-t border-x border-black/[0.04] dark:border-white/[0.06]"
      />

      {/* Main White Floating Stream Card */}
      <div className="rounded-[10px] bg-white dark:bg-[#0D0E14] border border-black/[0.04] dark:border-white/[0.07] shadow-[0_12px_32px_-8px_rgba(16,24,40,0.09)] dark:shadow-[0_14px_36px_-8px_rgba(0,0,0,0.6)] p-5 flex-1 flex flex-col">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#F1F2F6] dark:border-white/[0.07]">
          <div className="flex items-center gap-2">
            <span className="text-[14px] font-semibold text-[#09090B] dark:text-white">
              Live Attribution
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#6366F1] text-white text-[10.5px] font-semibold tabular-nums">
              {ATTRIBUTION_EVENTS.length}
            </span>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Streaming</span>
          </span>
        </div>

        {/* Auto-Shuffling Live Event Rows */}
        <div className="mt-3 space-y-2.5 flex-1">
          <AnimatePresence initial={false} mode="popLayout">
            {ordered.map((ev, idx) => (
              <motion.div
                key={ev.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: idx === 0 ? 1 : 0.86, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className={`flex items-center justify-between gap-2.5 p-2.5 rounded-[9px] border transition-colors ${
                  idx === 0
                    ? "bg-[#F5F7FF] dark:bg-[#6366F1]/[0.12] border-[#C7D2FE]/70 dark:border-[#6366F1]/30"
                    : "bg-transparent border-transparent"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-full ${ev.badgeBg} text-white font-mono text-[12px] font-bold flex items-center justify-center shrink-0 shadow-xs`}
                  >
                    {ev.badge}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[12.5px] font-semibold text-[#09090B] dark:text-white truncate">
                      {ev.title}
                    </div>
                    <div className="text-[11px] text-[#667085] dark:text-zinc-400 truncate">
                      {ev.subtitle}
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span
                    className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-semibold ${ev.pillTone}`}
                  >
                    {ev.pill}
                  </span>
                  <span className="text-[10px] text-[#98A2B3] dark:text-zinc-500">
                    {ev.time}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 4. DYNAMIC VECTOR QR STUDIO — Wide Horizontal Split Card ("Project Overview" style)
// ============================================================================
const QR_THEMES = [
  { name: "Indigo Edge", fg: "#4F46E5", chip: "bg-[#4F46E5]", format: "SVG Vector" },
  { name: "Obsidian Ink", fg: "#09090B", chip: "bg-[#09090B]", format: "4K PNG" },
  { name: "Electric Blue", fg: "#0066FF", chip: "bg-[#0066FF]", format: "Animated GIF" },
  { name: "Emerald Pulse", fg: "#059669", chip: "bg-[#059669]", format: "Dynamic Print" },
];

// Clean 7x7 decorative vector QR matrix cells
const QR_CELLS = [
  [1, 1, 1, 0, 1, 0, 1],
  [1, 0, 1, 1, 0, 1, 0],
  [1, 1, 1, 0, 1, 1, 1],
  [0, 1, 0, 1, 0, 0, 1],
  [1, 0, 1, 0, 1, 1, 0],
  [1, 1, 0, 1, 0, 1, 1],
  [1, 0, 1, 1, 1, 0, 1],
];

export function SoftQrStudioIllustration() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInViewport(containerRef);
  const [themeIdx, setThemeIdx] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setThemeIdx((prev) => (prev + 1) % QR_THEMES.length);
    }, 2400);
    return () => clearInterval(timer);
  }, [inView]);

  const active = QR_THEMES[themeIdx];

  return (
    <div
      ref={containerRef}
      className="rounded-[10px] bg-white dark:bg-[#0D0E14] border border-black/[0.04] dark:border-white/[0.07] shadow-[0_8px_28px_-8px_rgba(16,24,40,0.08)] dark:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.55)] p-5 w-full"
    >
      <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#F1F2F6] dark:border-white/[0.07]">
        <div className="flex items-center gap-2">
          <QrCode className="w-4 h-4 text-[#6366F1]" />
          <span className="text-[13px] font-semibold text-[#09090B] dark:text-white">
            QR Studio Live
          </span>
        </div>
        <span className="px-2 py-0.5 rounded-full bg-[#EEF2FF] dark:bg-[#6366F1]/20 text-[10.5px] font-mono font-semibold text-[#4338CA] dark:text-[#C7D2FE]">
          {active.format}
        </span>
      </div>

      <div className="mt-4 flex items-center gap-5">
        {/* Auto-color-cycling Crisp Vector QR Preview */}
        <div className="relative w-[104px] h-[104px] shrink-0 rounded-[9px] bg-[#F8F9FC] dark:bg-white p-2.5 border border-[#E8EAF2] flex items-center justify-center overflow-hidden">
          <svg
            viewBox="0 0 70 70"
            className="w-full h-full transition-colors duration-500"
            style={{ color: active.fg }}
            aria-hidden="true"
          >
            {QR_CELLS.map((row, r) =>
              row.map((cell, c) =>
                cell ? (
                  <rect
                    key={`${r}-${c}`}
                    x={c * 10 + 1}
                    y={r * 10 + 1}
                    width={8}
                    height={8}
                    rx={2.2}
                    fill="currentColor"
                  />
                ) : null
              )
            )}
          </svg>
          {/* Subtle animated sweep line */}
          <motion.div
            animate={inView ? { y: [-48, 48] } : { y: 0 }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
            className="pointer-events-none absolute inset-x-1.5 h-[2px] rounded-full bg-[#6366F1]/75 shadow-[0_0_8px_rgba(99,102,241,0.65)]"
          />
        </div>

        {/* Auto-cycling Style Swatches & Metadata */}
        <div className="flex-1 min-w-0 space-y-3">
          <div>
            <div className="text-[11px] text-[#71717A] dark:text-zinc-400">
              Active preset
            </div>
            <div className="text-[14px] font-semibold text-[#09090B] dark:text-white transition-all">
              {active.name}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {QR_THEMES.map((t, i) => (
              <span
                key={t.name}
                className={`w-6 h-6 rounded-full ${t.chip} transition-transform duration-300 ${
                  i === themeIdx
                    ? "ring-2 ring-[#6366F1] ring-offset-2 ring-offset-white dark:ring-offset-[#0D0E14] scale-110"
                    : "opacity-55 scale-95"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1.5 text-[11px] font-mono text-[#667085] dark:text-zinc-400">
            <Sparkles className="w-3 h-3 text-[#6366F1]" />
            <span>Editable target post-print</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// 5. CUSTOM BRANDED DOMAINS & AUTO SSL — Auto-Provisioning DNS/SSL Illustration
// ============================================================================
const SSL_STEPS = [
  { domain: "go.yourbrand.io/launch", badge: "CNAME Verified", tone: "text-[#4F46E5] bg-[#EEF2FF] dark:bg-[#6366F1]/20 dark:text-[#C7D2FE]" },
  { domain: "go.yourbrand.io/launch", badge: "TLS 1.3 Issued", tone: "text-amber-700 bg-amber-50 dark:bg-amber-500/15 dark:text-amber-300" },
  { domain: "go.yourbrand.io/launch", badge: "Edge SSL Active", tone: "text-emerald-700 bg-emerald-50 dark:bg-emerald-500/15 dark:text-emerald-300" },
];

export function SoftBrandedDomainIllustration() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInViewport(containerRef);
  const [step, setStep] = useState(2);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setStep((prev) => (prev + 1) % SSL_STEPS.length);
    }, 2600);
    return () => clearInterval(timer);
  }, [inView]);

  const active = SSL_STEPS[step];

  return (
    <div
      ref={containerRef}
      className="mt-5 rounded-[10px] bg-white dark:bg-[#0D0E14] border border-black/[0.04] dark:border-white/[0.07] shadow-[0_8px_24px_-8px_rgba(16,24,40,0.07)] dark:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.5)] p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
          <span className="font-mono text-[13px] font-semibold text-[#09090B] dark:text-white truncate">
            {active.domain}
          </span>
        </div>
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-colors duration-300 ${active.tone}`}
        >
          {active.badge}
        </span>
      </div>

      {/* 3-Step Auto-Advancing Progress Pills */}
      <div className="mt-3.5 grid grid-cols-3 gap-2">
        {["1. CNAME", "2. TLS 1.3", "3. 310+ PoPs"].map((label, idx) => {
          const done = idx <= step;
          return (
            <div
              key={label}
              className={`px-2.5 py-1.5 rounded-[7px] text-center font-mono text-[11px] font-medium transition-colors duration-300 ${
                done
                  ? "bg-[#EEF2FF] dark:bg-[#6366F1]/20 text-[#312E81] dark:text-[#E0E7FF]"
                  : "bg-[#F8F9FB] dark:bg-white/[0.03] text-[#98A2B3] dark:text-zinc-500"
              }`}
            >
              {label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// 6. PIN GATE & BRANDED MASKING — Auto-Typing Soft PIN Unlock Illustration
// ============================================================================
export function SoftPinGateIllustration() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inView = useInViewport(containerRef);
  const [filledCount, setFilledCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = setInterval(() => {
      setFilledCount((prev) => (prev >= 5 ? 0 : prev + 1));
    }, 650);
    return () => clearInterval(timer);
  }, [inView]);

  const unlocked = filledCount >= 4;

  return (
    <div
      ref={containerRef}
      className="mt-6 rounded-[10px] bg-white dark:bg-[#0D0E14] border border-black/[0.04] dark:border-white/[0.07] shadow-[0_8px_28px_-8px_rgba(16,24,40,0.08)] dark:shadow-[0_10px_28px_-8px_rgba(0,0,0,0.55)] p-5 flex flex-col justify-between flex-1"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span
            className={`w-7 h-7 rounded-[8px] flex items-center justify-center transition-colors duration-300 ${
              unlocked
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                : "bg-[#EEF2FF] dark:bg-[#6366F1]/20 text-[#4F46E5] dark:text-[#A5B4FC]"
            }`}
          >
            {unlocked ? (
              <Unlock className="w-3.5 h-3.5" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
          </span>
          <span className="font-mono text-[12px] font-semibold text-[#09090B] dark:text-white">
            lsho.cc/deck-q4
          </span>
        </div>
        <span
          className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold transition-colors duration-300 ${
            unlocked
              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
              : "bg-[#F4F5FA] text-[#475467] dark:bg-white/[0.06] dark:text-zinc-300"
          }`}
        >
          {unlocked ? "Unlocked" : "PIN Protected"}
        </span>
      </div>

      {/* 4 Soft PIN Slots */}
      <div className="my-5 flex items-center justify-center gap-3">
        {[0, 1, 2, 3].map((slot) => {
          const isFilled = slot < Math.min(filledCount, 4);
          return (
            <div
              key={slot}
              className={`w-11 h-12 rounded-[9px] border flex items-center justify-center transition-all duration-200 ${
                unlocked
                  ? "border-emerald-400/70 bg-emerald-50/60 dark:bg-emerald-500/10"
                  : isFilled
                    ? "border-[#6366F1] bg-[#EEF2FF]/80 dark:bg-[#6366F1]/15 scale-105"
                    : "border-[#E4E7EC] dark:border-white/10 bg-[#F8F9FB] dark:bg-white/[0.03]"
              }`}
            >
              <span
                className={`w-2.5 h-2.5 rounded-full transition-all duration-200 ${
                  unlocked
                    ? "bg-emerald-500 scale-100"
                    : isFilled
                      ? "bg-[#4F46E5] dark:bg-[#A5B4FC] scale-100"
                      : "bg-transparent scale-0"
                }`}
              />
            </div>
          );
        })}
      </div>

      {/* Masked Meta Row */}
      <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#F1F2F6] dark:border-white/[0.07] text-[11.5px] text-[#667085] dark:text-zinc-400">
        <span>Referrer stripped · OG masked</span>
        <span className="inline-flex items-center gap-0.5 font-medium text-[#4F46E5] dark:text-[#A5B4FC]">
          <span>Verified</span>
          <ArrowUpRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
