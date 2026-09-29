"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Check,
  X,
  Database,
  CreditCard,
  Cloud,
  Activity,
  Sparkles,
  Globe,
  Split,
  BarChart3,
  Zap,
  Link2,
  KeyRound,
  Webhook,
  ShieldCheck,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { CanvasRevealCard } from "@/components/ui/canvas-reveal-effect";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const COMPARISON_ROWS = [
  {
    feature: "Global Redirect Resolution P99",
    lshorter: "4.2 ms Edge Redirect",
    bitly: "65–110 ms Centralized",
    linktree: "240+ ms SSR Page",
  },
  {
    feature: "ISO Country, Device/OS & Weighted A/B Routing",
    lshorter: true,
    bitly: "Enterprise Tier Only",
    linktree: false,
  },
  {
    feature: "PathLock™ PIN Gate, Expiration & Iframe Cloaking",
    lshorter: true,
    bitly: false,
    linktree: false,
  },
  {
    feature: "Continent, Country & City Click Telemetry + CSV Export",
    lshorter: true,
    bitly: "Paid Add-on",
    linktree: false,
  },
  {
    feature: "Cookie-Free Revenue & Conversion Attribution (qk_cid)",
    lshorter: true,
    bitly: false,
    linktree: false,
  },
  {
    feature: "Idempotent REST API (/api/v1/links) & Signed Webhooks",
    lshorter: true,
    bitly: "Rate-Limited",
    linktree: false,
  },
];

// ─── OFFICIAL VECTOR LOGOS FOR SUMMATION CARDS ──────────────────────────────
function AppleLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.96 6.32c.67-.81 1.12-1.94 1-3.07-.96.04-2.13.64-2.82 1.45-.61.7-.15 1.85-.99 2.97 1.07.08 2.14-.54 2.81-1.35" />
    </svg>
  );
}

function AndroidLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0001.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 00-.1521-.5676.416.416 0 00-.5676.1521l-2.0223 3.503C15.5902 8.2439 13.8533 7.8508 12 7.8508s-3.5902.3931-5.1367 1.0989L4.841 5.4467a.4161.4161 0 00-.5677-.1521.4157.4157 0 00-.1521.5676l1.9973 3.4592C2.6889 11.1867.3432 14.6589 0 18.761h24c-.3435-4.1021-2.6892-7.5743-6.1185-9.4396" />
    </svg>
  );
}

function CloudflareLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 64 42" fill="none">
      <path
        d="M46.6 33.8H16.2C10.9 33.8 6.6 29.6 6.6 24.3C6.6 19.5 10.1 15.5 14.8 14.9C16.2 8.2 22.1 3.2 29.2 3.2C36.9 3.2 43.3 9.1 43.9 16.6C44.8 16.3 45.7 16.2 46.6 16.2C51.5 16.2 55.4 20.1 55.4 25C55.4 29.9 51.5 33.8 46.6 33.8Z"
        fill="#F38020"
      />
      <path
        d="M52.2 18.8C51.6 18.8 51 18.9 50.5 19.1C49.6 14.8 45.8 11.6 41.2 11.6C39.6 11.6 38.1 12 36.8 12.7C39.7 15.1 41.6 18.7 41.8 22.8H42.5C45.9 22.8 48.6 25.5 48.6 28.9C48.6 30.8 47.7 32.5 46.4 33.6H52.2C56.3 33.6 59.6 30.3 59.6 26.2C59.6 22.1 56.3 18.8 52.2 18.8Z"
        fill="#FAAE40"
      />
    </svg>
  );
}

function StripeLogo({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z" />
    </svg>
  );
}

export function WhyUsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Active cyclic indices for Summation Card 2 (Decision Loop) & Card 3 (Stacked Bars)
  const [activePillIdx, setActivePillIdx] = useState(2);
  const [activeStackIdx, setActiveStackIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActivePillIdx((prev) => (prev + 1) % 6);
      setActiveStackIdx((prev) => (prev + 1) % 3);
    }, 1350);
    return () => clearInterval(interval);
  }, []);

  // Infinite Auto-Scroll + Manual Mouse Cursor Drag-to-Scroll Engine
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let offset = 0;
    let isDragging = false;
    let startX = 0;
    let dragStartOffset = 0;
    let velocity = 0;
    let lastClientX = 0;
    let rafId: number;
    const autoSpeed = 0.48;

    const getHalfWidth = () => track.scrollWidth / 2;

    const normalize = (val: number) => {
      const half = getHalfWidth();
      if (!half) return 0;
      let n = val % half;
      if (n > 0) n -= half;
      return n;
    };

    const step = () => {
      if (!isDragging) {
        if (Math.abs(velocity) > 0.1) {
          offset = normalize(offset + velocity);
          velocity *= 0.94;
        } else {
          offset = normalize(offset - autoSpeed);
        }
        track.style.transform = `translate3d(${offset}px, 0, 0)`;
      }
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      startX = e.clientX;
      lastClientX = e.clientX;
      dragStartOffset = offset;
      velocity = 0;
      track.classList.add("cursor-grabbing");
      track.classList.remove("cursor-grab");
      track.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      velocity = (e.clientX - lastClientX) * 0.65;
      lastClientX = e.clientX;
      offset = normalize(dragStartOffset + delta);
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    const onPointerUp = () => {
      isDragging = false;
      track.classList.remove("cursor-grabbing");
      track.classList.add("cursor-grab");
    };

    track.addEventListener("pointerdown", onPointerDown);
    track.addEventListener("pointermove", onPointerMove);
    track.addEventListener("pointerup", onPointerUp);
    track.addEventListener("pointercancel", onPointerUp);

    return () => {
      cancelAnimationFrame(rafId);
      track.removeEventListener("pointerdown", onPointerDown);
      track.removeEventListener("pointermove", onPointerMove);
      track.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".why-us-scroll-reveal",
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.12,
          ease: "expo.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 82%",
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  // ─── SUMMATION.COM 4 LIVE ANIMATED CARDS DATA ──────────────────────────────
  const summationCards = [
    {
      id: "geo-routing",
      title: "See and route every click across regions",
      desc: "Direct visitors by ISO Country, Device OS, or weighted 50/50 A/B split rules at the edge. Every destination decision is instant and verifiable.",
      renderDiagram: () => (
        <div className="relative w-full h-[255px] flex items-center justify-center overflow-hidden">
          {/* 8 Radial Dotted Spokes SVG */}
          <svg viewBox="0 0 280 240" className="w-[265px] h-[230px]">
            <g
              stroke="currentColor"
              className="text-[#101828]/20 dark:text-white/20"
              strokeWidth="1.25"
              strokeDasharray="3.5 5"
            >
              <line x1="140" y1="120" x2="140" y2="30" />
              <line x1="140" y1="120" x2="206" y2="54" />
              <line x1="140" y1="120" x2="232" y2="120" />
              <line x1="140" y1="120" x2="206" y2="186" />
              <line x1="140" y1="120" x2="140" y2="210" />
              <line x1="140" y1="120" x2="74" y2="186" />
              <line x1="140" y1="120" x2="48" y2="120" />
              <line x1="140" y1="120" x2="74" y2="54" />
            </g>
          </svg>

          {/* Center Hub Node */}
          <div className="absolute w-14 h-14 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-[0_12px_32px_rgba(70,95,255,0.22)] flex items-center justify-center text-[#465FFF] animate-pulse">
            <Sparkles className="w-6 h-6" />
          </div>

          {/* 8 Outer Floating Logo / SVG Nodes */}
          <div className="absolute top-[14px] w-10 h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-center text-[#101828] dark:text-zinc-200 transition-transform duration-500 group-hover:scale-110">
            <Globe className="w-4 h-4 text-[#465FFF]" />
          </div>
          <div className="absolute top-[34px] right-[58px] w-10 h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-center text-[#101828] dark:text-zinc-200 transition-transform duration-500 group-hover:scale-110">
            <AppleLogo className="w-4 h-4" />
          </div>
          <div className="absolute right-[34px] w-10 h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-center text-[#101828] dark:text-zinc-200 transition-transform duration-500 group-hover:scale-110">
            <Split className="w-4 h-4 text-[#465FFF]" />
          </div>
          <div className="absolute bottom-[34px] right-[58px] w-10 h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-center text-[#101828] dark:text-zinc-200 transition-transform duration-500 group-hover:scale-110">
            <AndroidLogo className="w-4 h-4 text-[#12B76A]" />
          </div>
          <div className="absolute bottom-[14px] w-10 h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-center text-[#101828] dark:text-zinc-200 transition-transform duration-500 group-hover:scale-110">
            <CloudflareLogo className="w-5 h-3.5" />
          </div>
          <div className="absolute bottom-[34px] left-[58px] w-10 h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-center text-[#101828] dark:text-zinc-200 transition-transform duration-500 group-hover:scale-110">
            <BarChart3 className="w-4 h-4 text-[#465FFF]" />
          </div>
          <div className="absolute left-[34px] w-10 h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-center text-[#101828] dark:text-zinc-200 transition-transform duration-500 group-hover:scale-110">
            <Zap className="w-4 h-4 text-[#F79009]" />
          </div>
          <div className="absolute top-[34px] left-[58px] w-10 h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-sm flex items-center justify-center text-[#101828] dark:text-zinc-200 transition-transform duration-500 group-hover:scale-110">
            <Link2 className="w-4 h-4 text-[#101828] dark:text-white" />
          </div>
        </div>
      ),
    },
    {
      id: "sdk-loop",
      title: "Decide and automate via REST & SDK",
      desc: "Provision branded short links, custom slugs, and signed webhooks programmatically with scoped Bearer keys and sub-5ms KV propagation.",
      renderDiagram: () => {
        const pills = [
          { label: "Create Link", pos: "top-[18px]", icon: Link2 },
          { label: "Edge KV Sync", pos: "top-[68px] right-[14px]", icon: Cloud },
          { label: "Route 4.2ms", pos: "bottom-[68px] right-[14px]", icon: Zap },
          { label: "Verify Key", pos: "bottom-[18px]", icon: KeyRound },
          { label: "Track Click", pos: "bottom-[68px] left-[14px]", icon: Activity },
          { label: "Fire Webhook", pos: "top-[68px] left-[14px]", icon: Webhook },
        ];
        return (
          <div className="relative w-full h-[255px] flex items-center justify-center overflow-hidden">
            <svg viewBox="0 0 280 240" className="w-[265px] h-[230px]">
              <circle
                cx="140"
                cy="120"
                r="78"
                fill="none"
                stroke="currentColor"
                className="text-[#101828]/15 dark:text-white/15"
                strokeWidth="1.4"
                strokeDasharray="3.5 5"
              />
            </svg>
            {pills.map((p, idx) => {
              const Icon = p.icon;
              const isActive = activePillIdx === idx;
              return (
                <div
                  key={p.label}
                  className={`absolute ${p.pos} px-3.5 py-1.5 rounded-full border text-[11.5px] font-medium flex items-center gap-1.5 transition-all duration-500 ${
                    isActive
                      ? "bg-[#FFF4ED] dark:bg-[#465FFF]/20 border-[#F97316]/40 dark:border-[#465FFF] text-[#EA580C] dark:text-[#93ADFF] scale-105 shadow-md"
                      : "bg-white dark:bg-[#1E1E24] border-black/5 dark:border-white/10 text-[#344054] dark:text-zinc-300 shadow-2xs"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{p.label}</span>
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      id: "revenue-stack",
      title: "Don't just count clicks. Attribute revenue.",
      desc: "Connect every short link click ID (qk_cid) directly to customer signups and Stripe checkouts with deterministic EPC and conversion tracking.",
      renderDiagram: () => {
        const bars = [
          {
            label: "Capture Click ID (qk_cid)",
            rightBadge: (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#465FFF] text-white text-[10.5px] font-semibold">
                <Link2 className="w-3 h-3" /> Linked
              </span>
            ),
          },
          {
            label: "Attribute Stripe Checkout",
            rightBadge: (
              <span className="inline-flex items-center gap-1.5 text-[11.5px] font-mono font-semibold text-[#635BFF] dark:text-[#818CF8]">
                <StripeLogo className="w-3.5 h-3.5" /> +$240.00
              </span>
            ),
          },
          {
            label: "Verify Real-Time EPC",
            rightBadge: (
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                <Check className="w-3.5 h-3.5" />
              </span>
            ),
          },
        ];
        return (
          <div className="relative w-full h-[255px] flex flex-col items-center justify-center px-4 gap-3 overflow-hidden">
            {bars.map((b, idx) => {
              const isFocused = activeStackIdx === idx;
              return (
                <div
                  key={b.label}
                  className={`w-full max-w-[270px] rounded-[15px] bg-white dark:bg-[#1E1E24] border px-4 py-3.5 flex items-center justify-between transition-all duration-600 ${
                    isFocused
                      ? "border-[#465FFF]/50 shadow-lg scale-100 opacity-100"
                      : "border-black/5 dark:border-white/10 shadow-xs scale-95 opacity-55"
                  }`}
                >
                  <span className="text-[12.5px] font-medium text-[#101828] dark:text-white">
                    {b.label}
                  </span>
                  {b.rightBadge}
                </div>
              );
            })}
          </div>
        );
      },
    },
    {
      id: "pathlock-rings",
      title: "Protect sensitive links with PathLock™",
      desc: "Enforce 4-digit SHA-256 PIN gates, zero-referrer iframe cloaking, click caps, and automatic UTC expiration within the controls you set.",
      renderDiagram: () => (
        <div className="relative w-full h-[255px] flex items-center justify-center overflow-hidden">
          <svg viewBox="0 0 280 240" className="w-[265px] h-[230px]">
            <circle
              cx="140"
              cy="120"
              r="42"
              fill="none"
              stroke="currentColor"
              className="text-[#101828]/18 dark:text-white/18"
              strokeDasharray="3.5 4.5"
            />
            <circle
              cx="140"
              cy="120"
              r="68"
              fill="none"
              stroke="currentColor"
              className="text-[#101828]/14 dark:text-white/14"
              strokeDasharray="3.5 4.5"
            />
            <circle
              cx="140"
              cy="120"
              r="94"
              fill="none"
              stroke="currentColor"
              className="text-[#101828]/10 dark:text-white/10"
              strokeDasharray="3.5 4.5"
            />
          </svg>

          <div className="absolute w-14 h-14 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-[0_12px_32px_rgba(70,95,255,0.22)] flex items-center justify-center text-[#465FFF]">
            <Lock className="w-6 h-6" />
          </div>

          <div className="absolute top-[28px] left-[22px] px-3 py-1.5 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-xs text-[11px] font-medium text-[#101828] dark:text-zinc-200 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#465FFF]" />
            <span>PIN Gate</span>
          </div>
          <div className="absolute top-[40px] right-[20px] px-3 py-1.5 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-xs text-[11px] font-medium text-[#101828] dark:text-zinc-200 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
            <span>SHA-256</span>
          </div>
          <div className="absolute bottom-[38px] left-[26px] px-3 py-1.5 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-xs text-[11px] font-medium text-[#101828] dark:text-zinc-200 flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-[#465FFF]" />
            <span>URL Cloak</span>
          </div>
          <div className="absolute bottom-[28px] right-[26px] px-3 py-1.5 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-xs text-[11px] font-medium text-[#101828] dark:text-zinc-200 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-[#F79009]" />
            <span>Click Cap</span>
          </div>
        </div>
      ),
    },
  ];

  // Duplicate cards for seamless infinite horizontal drag + marquee
  const infiniteCards = [...summationCards, ...summationCards];

  return (
    <section
      ref={sectionRef}
      id="why-us"
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] py-14 md:py-20 border-t border-[#E4E7EC] dark:border-white/10 transition-colors duration-300 overflow-hidden"
    >
      <div className="max-w-[1320px] mx-auto px-4 sm:px-8 space-y-16">
        {/* PART 1: What LShorter Does That Others Don't (Competitive Differentiation Matrix) */}
        <div className="why-us-scroll-reveal">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-8">
            <div>
              <span className="inline-flex items-center gap-2 text-[11.5px] font-mono uppercase tracking-[0.15em] text-[#465FFF] mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                05 • WHY LSHORTER WINS
              </span>
              <h2 className="text-[28px] sm:text-[38px] font-normal tracking-[-0.03em] leading-[1.06] text-[#101828] dark:text-white">
                What we do that{" "}
                <span className="text-[#667085] dark:text-zinc-400">
                  legacy shorteners don&apos;t.
                </span>
              </h2>
            </div>
            <p className="text-[14px] text-[#475467] dark:text-zinc-400 max-w-[440px] leading-[1.6]">
              Most URL shorteners stop at counting raw clicks. LShorter is an edge-native routing, security, and revenue attribution engine.
            </p>
          </div>

          <div className="rounded-[20px] border border-[#E4E7EC] dark:border-white/10 bg-[#F9FAFB] dark:bg-[#111113] overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b border-[#E4E7EC] dark:border-white/10 text-[12px] font-mono uppercase tracking-wider text-[#667085] dark:text-zinc-400">
                  <th className="py-4 px-6">Capability</th>
                  <th className="py-4 px-6 text-[#465FFF] font-bold">LShorter Edge</th>
                  <th className="py-4 px-6">Legacy Enterprise Shortener</th>
                  <th className="py-4 px-6">Standard Bio-Link Tool</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-white/10 text-[14px]">
                {COMPARISON_ROWS.map((row) => (
                  <tr
                    key={row.feature}
                    className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-6 font-medium text-[#101828] dark:text-white">
                      {row.feature}
                    </td>
                    <td className="py-4 px-6">
                      {typeof row.lshorter === "boolean" ? (
                        <span className="inline-flex items-center gap-1.5 text-[#027A48] dark:text-[#32D583] font-semibold">
                          <Check className="w-4 h-4" /> Included Native
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#ECF3FF] dark:bg-[#465FFF]/20 text-[#465FFF] dark:text-[#7592FF] font-semibold text-[12.5px]">
                          {row.lshorter}
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-[#667085] dark:text-zinc-400">
                      {typeof row.bitly === "boolean" ? (
                        row.bitly ? (
                          <Check className="w-4 h-4 text-[#12B76A]" />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#98A2B3]">
                            <X className="w-4 h-4" /> Unavailable
                          </span>
                        )
                      ) : (
                        row.bitly
                      )}
                    </td>
                    <td className="py-4 px-6 text-[#667085] dark:text-zinc-400">
                      {typeof row.linktree === "boolean" ? (
                        row.linktree ? (
                          <Check className="w-4 h-4 text-[#12B76A]" />
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#98A2B3]">
                            <X className="w-4 h-4" /> Unavailable
                          </span>
                        )
                      ) : (
                        row.linktree
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PART 2: SUMMATION.COM EXACT DESIGN — 4 LIVE ANIMATED CARDS + INFINITE MOUSE DRAG */}
        <div className="why-us-scroll-reveal space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div className="space-y-4">
              <Link
                href="/#product"
                onMouseEnter={(e) =>
                  gsap.to(e.currentTarget, { scale: 1.04, duration: 0.3, ease: "expo.out" })
                }
                onMouseLeave={(e) =>
                  gsap.to(e.currentTarget, { scale: 1, duration: 0.3, ease: "expo.out" })
                }
                className="inline-flex items-center gap-2 rounded-full bg-[#101828] dark:bg-white text-white dark:text-[#101828] px-5 py-2.5 text-[13.5px] font-medium hover:bg-[#465FFF] dark:hover:bg-[#465FFF] dark:hover:text-white transition-colors"
              >
                <span>Explore the product</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
              <h3 className="text-[24px] sm:text-[34px] font-normal tracking-[-0.03em] leading-[1.08] text-[#101828] dark:text-white">
                Built for every team{" "}
                <span className="text-[#667085] dark:text-zinc-400">
                  that runs on links.
                </span>
              </h3>
            </div>

            <span className="text-[12.5px] font-mono text-[#667085] dark:text-zinc-400 select-none">
              ↔ Drag cards with cursor • Infinite Scroll
            </span>
          </div>

          {/* Infinite Horizontal Drag-to-Scroll Viewport with Lateral Blur & Fade Edges */}
          <div className="relative w-full overflow-hidden -mx-4 px-4 sm:mx-0 sm:px-0">
            {/* Left Lateral Blur + Fade Gradient */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 left-0 w-16 sm:w-28 md:w-36 z-20 bg-gradient-to-r from-[#FFFFFF] via-[#FFFFFF]/85 to-transparent dark:from-[#09090B] dark:via-[#09090B]/85 backdrop-blur-[3px]"
            />
            {/* Right Lateral Blur + Fade Gradient */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 right-0 w-16 sm:w-28 md:w-36 z-20 bg-gradient-to-l from-[#FFFFFF] via-[#FFFFFF]/85 to-transparent dark:from-[#09090B] dark:via-[#09090B]/85 backdrop-blur-[3px]"
            />

            <div
              ref={trackRef}
              className="cursor-grab flex items-stretch gap-6 w-max py-2 select-none"
            >
              {infiniteCards.map((card, idx) => (
                <div
                  key={`${card.id}-${idx}`}
                  className="group w-[280px] sm:w-[340px] shrink-0 rounded-[20px] bg-[#F4F4F6] dark:bg-[#131316] border border-black/[0.04] dark:border-white/[0.06] p-5 sm:p-6 flex flex-col justify-between transition-transform duration-500 hover:-translate-y-1.5"
                >
                  {/* Upper Live Animated Diagram (Summation Style) */}
                  {card.renderDiagram()}

                  {/* Bottom Title & Description (Summation Style) */}
                  <div className="pt-3">
                    <h4 className="text-[17px] sm:text-[19px] font-medium tracking-[-0.02em] leading-[1.24] text-[#101828] dark:text-white mb-2">
                      {card.title}
                    </h4>
                    <p className="text-[13px] text-[#667085] dark:text-zinc-400 leading-[1.58]">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PART 3: Aceternity CanvasRevealEffect Infrastructure Pillars */}
        <div className="why-us-scroll-reveal">
          <div className="mb-8">
            <span className="text-[11.5px] font-mono uppercase tracking-[0.15em] text-[#465FFF]">
              CORE STACK &amp; TELEMETRY
            </span>
            <h3 className="text-[26px] sm:text-[34px] font-normal tracking-[-0.025em] text-[#101828] dark:text-white mt-1">
              Hover to inspect our live edge stack
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <CanvasRevealCard
              title="Cloudflare Edge Workers"
              subtitle=""
              description="Sub-5ms global redirect execution across 310+ PoPs."
              badge="EDGE RUNTIME"
              icon={<Cloud className="w-5 h-5 text-[#465FFF]" />}
              colors={[[70, 95, 255]]}
            />
            <CanvasRevealCard
              title="Convex Real-Time DB"
              subtitle=""
              description="Instant reactive synchronization for live click streams."
              badge="REACTIVE STATE"
              icon={<Database className="w-5 h-5 text-[#12B76A]" />}
              colors={[[18, 183, 106]]}
            />
            <CanvasRevealCard
              title="Stripe Revenue Engine"
              subtitle=""
              description="Deterministic checkout attribution via qk_cid click tokens."
              badge="ATTRIBUTION"
              icon={<CreditCard className="w-5 h-5 text-[#F79009]" />}
              colors={[[247, 144, 9]]}
            />
            <CanvasRevealCard
              title="Signed Webhook Stream"
              subtitle=""
              description="Real-time JSON event delivery on every link & conversion."
              badge="WEBHOOKS"
              icon={<Activity className="w-5 h-5 text-[#7A5AF8]" />}
              colors={[[122, 90, 248]]}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default WhyUsSection;
