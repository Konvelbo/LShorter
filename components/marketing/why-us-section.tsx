"use client";

import React, { useRef, useEffect, useState, memo } from "react";
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

// ─── DONNÉES DU COMPARATIF ÉPURÉ (STYLE EXACT DE LA CAPTURE) ───────────────
const TABLE_COMPARISON_ROWS = [
  {
    feature: "Vitesse de redirection",
    traditional: "Délai 60 à 150 ms",
    lshorter: "Sous 12 ms (Edge)",
  },
  {
    feature: "Ciblage pays, iOS & Android",
    traditional: "Plan Entreprise",
    lshorter: "Natif & inclus",
  },
  {
    feature: "Protection par code PIN",
    traditional: "Indisponible",
    lshorter: "PathLock™ PIN",
  },
  {
    feature: "Attribution des revenus ",
    traditional: "Dernier clic seul",
    lshorter: "Multi-touch",
  },
  {
    feature: "Expiration & limites de clics",
    traditional: "Manuel",
    lshorter: "inclu",
  },
  {
    feature: "Accès API & Webhooks signés",
    traditional: "Limité ou payant",
    lshorter: "Natif (SHA-256)",
  },
];

// ─── LOGOS VECTORIELS ────────────────────────────────────────────────────────
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

// ─── DIAGRAMMES INTERACTIFS ──────────────────────────────────────────────────
const GeoRoutingDiagram = memo(function GeoRoutingDiagram() {
  return (
    <div className="relative w-full h-[230px] sm:h-[250px] flex items-center justify-center overflow-hidden">
      <svg viewBox="0 0 280 240" className="w-[250px] sm:w-[265px] h-[220px]">
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
      <div className="absolute w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-md flex items-center justify-center text-[#465FFF]">
        <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div className="absolute top-[14px] w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-center text-[#101828] dark:text-zinc-200">
        <Globe className="w-4 h-4 text-[#465FFF]" />
      </div>
      <div className="absolute top-[34px] right-[58px] w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-center text-[#101828] dark:text-zinc-200">
        <AppleLogo className="w-4 h-4" />
      </div>
      <div className="absolute right-[34px] w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-center text-[#101828] dark:text-zinc-200">
        <Split className="w-4 h-4 text-[#465FFF]" />
      </div>
      <div className="absolute bottom-[34px] right-[58px] w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-center text-[#101828] dark:text-zinc-200">
        <AndroidLogo className="w-4 h-4 text-[#12B76A]" />
      </div>
      <div className="absolute bottom-[14px] w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-center text-[#101828] dark:text-zinc-200">
        <CloudflareLogo className="w-5 h-3.5" />
      </div>
      <div className="absolute bottom-[34px] left-[58px] w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-center text-[#101828] dark:text-zinc-200">
        <BarChart3 className="w-4 h-4 text-[#465FFF]" />
      </div>
      <div className="absolute left-[34px] w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-center text-[#101828] dark:text-zinc-200">
        <Zap className="w-4 h-4 text-[#F79009]" />
      </div>
      <div className="absolute top-[34px] left-[58px] w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-xs flex items-center justify-center text-[#101828] dark:text-zinc-200">
        <Link2 className="w-4 h-4 text-[#101828] dark:text-white" />
      </div>
    </div>
  );
});

const SdkLoopDiagram = memo(function SdkLoopDiagram() {
  const [activePillIdx, setActivePillIdx] = useState(2);

  useEffect(() => {
    const timer = setInterval(() => {
      setActivePillIdx((prev) => (prev + 1) % 6);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const pills = [
    { label: "Create Link", pos: "top-[18px]", icon: Link2 },
    { label: "Edge KV Sync", pos: "top-[64px] right-[10px]", icon: Cloud },
    { label: "Route 11ms", pos: "bottom-[64px] right-[10px]", icon: Zap },
    { label: "Verify Key", pos: "bottom-[18px]", icon: KeyRound },
    { label: "Track Click", pos: "bottom-[64px] left-[10px]", icon: Activity },
    { label: "Fire Webhook", pos: "top-[64px] left-[10px]", icon: Webhook },
  ];

  return (
    <div className="relative w-full h-[230px] sm:h-[250px] flex items-center justify-center overflow-hidden">
      <svg viewBox="0 0 280 240" className="w-[250px] sm:w-[265px] h-[220px]">
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
            className={`absolute ${p.pos} px-3 py-1.5 rounded-full border text-[11px] sm:text-[11.5px] font-medium flex items-center gap-1.5 transition-all duration-300 ${
              isActive
                ? "bg-[#ECF3FF] dark:bg-[#465FFF]/20 border-[#465FFF]/50 text-[#465FFF] dark:text-[#93ADFF] scale-105 shadow-sm"
                : "bg-white dark:bg-[#1E1E24] border-black/5 dark:border-white/10 text-[#344054] dark:text-zinc-300"
            }`}
          >
            <Icon className="w-3.5 h-3.5 shrink-0" />
            <span>{p.label}</span>
          </div>
        );
      })}
    </div>
  );
});

const RevenueStackDiagram = memo(function RevenueStackDiagram() {
  const [activeStackIdx, setActiveStackIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStackIdx((prev) => (prev + 1) % 3);
    }, 1500);
    return () => clearInterval(timer);
  }, []);

  const bars = [
    {
      label: "Capture Click ID (qk_cid)",
      rightBadge: (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#465FFF] text-white text-[10px] sm:text-[10.5px] font-semibold">
          <Link2 className="w-3 h-3" /> Linked
        </span>
      ),
    },
    {
      label: "Attribute Stripe Checkout",
      rightBadge: (
        <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-[11.5px] font-mono font-semibold text-[#635BFF] dark:text-[#818CF8]">
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
    <div className="relative w-full h-[230px] sm:h-[250px] flex flex-col items-center justify-center px-2 sm:px-4 gap-3 overflow-hidden">
      {bars.map((b, idx) => {
        const isFocused = activeStackIdx === idx;
        return (
          <div
            key={b.label}
            className={`w-full max-w-[270px] rounded-[14px] bg-white dark:bg-[#1E1E24] border px-3.5 py-3 flex items-center justify-between transition-all duration-300 ${
              isFocused
                ? "border-[#465FFF]/50 shadow-md scale-100 opacity-100"
                : "border-black/5 dark:border-white/10 shadow-2xs scale-95 opacity-60"
            }`}
          >
            <span className="text-[12px] sm:text-[12.5px] font-medium text-[#101828] dark:text-white">
              {b.label}
            </span>
            {b.rightBadge}
          </div>
        );
      })}
    </div>
  );
});

const PathlockDiagram = memo(function PathlockDiagram() {
  return (
    <div className="relative w-full h-[230px] sm:h-[250px] flex items-center justify-center overflow-hidden">
      <svg viewBox="0 0 280 240" className="w-[250px] sm:w-[265px] h-[220px]">
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
      <div className="absolute w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-md flex items-center justify-center text-[#465FFF]">
        <Lock className="w-5 h-5 sm:w-6 sm:h-6" />
      </div>
      <div className="absolute top-[28px] left-[18px] px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-2xs text-[11px] font-medium text-[#101828] dark:text-zinc-200 flex items-center gap-1.5">
        <ShieldCheck className="w-3.5 h-3.5 text-[#465FFF]" />
        <span>PIN Gate</span>
      </div>
      <div className="absolute top-[38px] right-[16px] px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-2xs text-[11px] font-medium text-[#101828] dark:text-zinc-200 flex items-center gap-1.5">
        <KeyRound className="w-3.5 h-3.5 text-emerald-500" />
        <span>SHA-256</span>
      </div>
      <div className="absolute bottom-[36px] left-[20px] px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-2xs text-[11px] font-medium text-[#101828] dark:text-zinc-200 flex items-center gap-1.5">
        <Globe className="w-3.5 h-3.5 text-[#465FFF]" />
        <span>URL Cloak</span>
      </div>
      <div className="absolute bottom-[28px] right-[20px] px-2.5 py-1 rounded-full bg-white dark:bg-[#1E1E24] border border-black/5 dark:border-white/10 shadow-2xs text-[11px] font-medium text-[#101828] dark:text-zinc-200 flex items-center gap-1.5">
        <Zap className="w-3.5 h-3.5 text-[#F79009]" />
        <span>Click Cap</span>
      </div>
    </div>
  );
});

export function WhyUsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Défilement automatique fluide & infini
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    let offset = 0;
    let isDragging = false;
    let startX = 0;
    let dragStartOffset = 0;
    let velocity = 0;
    let lastClientX = 0;
    let isHovered = false;
    let rafId: number;

    const autoSpeed = 1.1;

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
        if (Math.abs(velocity) > 0.08) {
          offset = normalize(offset + velocity);
          velocity *= 0.94;
        } else if (!isHovered) {
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
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const delta = e.clientX - startX;
      velocity = (e.clientX - lastClientX) * 0.75;
      lastClientX = e.clientX;
      offset = normalize(dragStartOffset + delta);
      track.style.transform = `translate3d(${offset}px, 0, 0)`;
    };

    const onPointerUp = () => {
      if (!isDragging) return;
      isDragging = false;
      track.classList.remove("cursor-grabbing");
      track.classList.add("cursor-grab");
    };

    const onMouseEnter = () => {
      isHovered = true;
    };

    const onMouseLeave = () => {
      isHovered = false;
      onPointerUp();
    };

    track.addEventListener("pointerdown", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    track.addEventListener("mouseenter", onMouseEnter);
    track.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      track.removeEventListener("mouseenter", onMouseEnter);
      track.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".why-us-scroll-reveal",
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 82%",
          },
        },
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  const summationCards = [
    {
      id: "geo-routing",
      title: "See and route every click across regions",
      desc: "Direct visitors by ISO Country, Device OS, or weighted 50/50 A/B split rules at the edge. Every destination decision is instant and verifiable.",
      diagram: <GeoRoutingDiagram />,
    },
    {
      id: "sdk-loop",
      title: "Decide and automate via REST & SDK",
      desc: "Provision branded short links, custom slugs, and signed webhooks programmatically with scoped Bearer keys and sub-12ms KV propagation.",
      diagram: <SdkLoopDiagram />,
    },
    {
      id: "revenue-stack",
      title: "Don't just count clicks. Attribute revenue.",
      desc: "Connect every short link click ID (qk_cid) directly to customer signups and Stripe checkouts with deterministic EPC and conversion tracking.",
      diagram: <RevenueStackDiagram />,
    },
    {
      id: "pathlock-rings",
      title: "Protect sensitive links with PathLock™",
      desc: "Enforce 4-digit SHA-256 PIN gates, zero-referrer iframe cloaking, click caps, and automatic UTC expiration within the controls you set.",
      diagram: <PathlockDiagram />,
    },
  ];

  const infiniteCards = [
    ...summationCards,
    ...summationCards,
    ...summationCards,
  ];

  return (
    <section
      ref={sectionRef}
      id="why-us"
      className="w-full max-w-full overflow-hidden bg-[#FFFFFF] dark:bg-[#09090B] py-14 md:py-24 border-t border-[#E4E7EC] dark:border-white/10 transition-colors duration-300"
    >
      <div className="max-w-[1120px] mx-auto px-4 sm:px-8 space-y-20">
        {/* ─── PARTIE 1 : STYLE EXACT DE VOTRE CAPTURE (TABLEAU ÉPURÉ 3 COLONNES) ─── */}
        <div className="why-us-scroll-reveal w-full max-w-[940px] mx-auto">
          <div className="flex flex-col items-start gap-3 mb-10">
            <h2 className="text-[28px] sm:text-[38px] font-normal tracking-[-0.03em] leading-[1.08] text-[#101828] dark:text-white">
              Ce qui change tout par rapport aux{" "}
              <span className="text-[#667085] dark:text-zinc-400">
                solutions classiques.
              </span>
            </h2>
          </div>

          {/* TABLEAU ÉPURÉ STYLE CAPTURE : 3 COLONNES FLUIDES */}
          <div className="w-full select-none">
            {/* En-tête des colonnes */}
            <div className="grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr] items-center pb-3.5 border-b border-[#E4E7EC] dark:border-white/10 text-[11px] sm:text-[12px] font-mono uppercase tracking-wider text-[#667085] dark:text-zinc-400">
              <div>FONCTIONNALITÉ</div>
              <div className="text-center sm:text-left">TRADITIONNEL</div>
              <div className="text-right sm:text-left font-semibold text-[#101828] dark:text-white">
                LSHORTER
              </div>
            </div>

            {/* Lignes du comparatif */}
            <div className="divide-y divide-[#E4E7EC] dark:divide-white/10">
              {TABLE_COMPARISON_ROWS.map((row, idx) => (
                <div
                  key={idx}
                  className="grid grid-cols-[1.4fr_1fr_1fr] sm:grid-cols-[1.6fr_1fr_1fr] items-center py-4 sm:py-5 text-[12.5px] sm:text-[14px]"
                >
                  {/* Colonne 1 : Nom de la fonctionnalité */}
                  <div className="font-semibold text-[#101828] dark:text-white pr-2 sm:pr-4 leading-tight">
                    {row.feature}
                  </div>

                  {/* Colonne 2 : Traditionnel (Croix grise + Texte grisé) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[#667085] dark:text-zinc-400 justify-center sm:justify-start">
                    <span className="text-[#98A2B3] dark:text-zinc-500 text-[14px] sm:text-[16px] leading-none shrink-0 font-bold">
                      ✕
                    </span>
                    <span className="leading-snug">{row.traditional}</span>
                  </div>

                  {/* Colonne 3 : LShorter (Coche verte + Texte franc) */}
                  <div className="flex items-center gap-1.5 sm:gap-2 text-[#101828] dark:text-zinc-100 font-medium justify-end sm:justify-start">
                    <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#12B76A] shrink-0 stroke-[2.5]" />
                    <span className="leading-snug text-right sm:text-left">
                      {row.lshorter}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── PARTIE 2 : 4 CARTES ANIMÉES SANS OMBRE BLANCHE LATÉRALE ─── */}
        <div className="why-us-scroll-reveal space-y-6 pt-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="space-y-3">
              <Link
                href="/#product"
                className="inline-flex items-center gap-2 rounded-full bg-[#101828] dark:bg-white text-white dark:text-[#101828] px-5 py-2 text-[13px] font-medium hover:bg-[#465FFF] dark:hover:bg-[#465FFF] dark:hover:text-white transition-colors"
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

            <span className="text-[12px] font-mono text-[#667085] dark:text-zinc-400 select-none">
              ↔ Drag to explore • Infinite
            </span>
          </div>

          <div className="relative w-full overflow-hidden">
            <div
              ref={trackRef}
              style={{ touchAction: "pan-y" }}
              className="cursor-grab flex items-stretch gap-4 sm:gap-6 w-max py-2 select-none will-change-transform"
            >
              {infiniteCards.map((card, idx) => (
                <div
                  key={`${card.id}-${idx}`}
                  className="group w-[285px] sm:w-[340px] shrink-0 rounded-[18px] sm:rounded-[20px] bg-[#F4F4F6] dark:bg-[#131316] border border-black/[0.04] dark:border-white/[0.06] p-4 sm:p-6 flex flex-col justify-between transition-transform duration-200 hover:-translate-y-1"
                >
                  {card.diagram}

                  <div className="pt-2 sm:pt-3">
                    <h4 className="text-[16px] sm:text-[18px] font-medium tracking-[-0.02em] leading-[1.24] text-[#101828] dark:text-white mb-1.5">
                      {card.title}
                    </h4>
                    <p className="text-[12.5px] sm:text-[13px] text-[#667085] dark:text-zinc-400 leading-[1.55]">
                      {card.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ─── PARTIE 3 : INFRASTRUCTURE PILLARS ─── */}
        <div className="why-us-scroll-reveal pt-4">
          <div className="mb-8">
            <span className="text-[11.5px] font-mono uppercase tracking-[0.15em] text-[#465FFF]">
              CORE STACK &amp; TELEMETRY
            </span>
            <h3 className="text-[26px] sm:text-[34px] font-normal tracking-[-0.025em] text-[#101828] dark:text-white mt-1">
              Hover or tap to inspect our live edge stack
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <CanvasRevealCard
              title="Cloudflare Edge Workers"
              subtitle=""
              description="Sub-12ms global redirect execution across 310+ PoPs."
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
              title="Revenue Engine"
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
