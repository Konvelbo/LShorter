"use client";

import React, { useRef, useEffect } from "react";
import Image from "next/image";
import { Sparkles } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EdgeRotatingGlobe } from "@/components/globe/cobe-globe";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ProductSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // ── 1. Header scroll animation WITH REVERSE ──
      gsap.fromTo(
        ".product-header-elem",
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play reverse play reverse",
            fastScrollEnd: true,
          },
        }
      );

      // ── 2. Bento cards scroll animation WITH REVERSE (composite-only, no scale, fastScrollEnd) ──
      gsap.fromTo(
        ".product-bento-card",
        { opacity: 0, y: 35 },
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardsRef.current || sectionRef.current,
            start: "top 82%",
            end: "bottom 15%",
            toggleActions: "play reverse play reverse",
            fastScrollEnd: true,
          },
        }
      );
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="product"
      className="relative w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#09090B] transition-colors duration-300 overflow-hidden"
    >
      <div className="relative max-w-6xl mx-auto">

        {/* ── SECTION HEADER (Animates in and reverses on scroll) ── */}
        <div className="flex flex-col items-start text-left mb-10 sm:mb-14">
          <div className="product-header-elem inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand/10 dark:bg-brand/20 text-brand border border-brand/20 mb-5 select-none">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Short Links & Edge Architecture</span>
          </div>

          <h2 className="product-header-elem text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.1] max-w-3xl">
            High-performance short links, engineered for conversion.
          </h2>

          <p className="product-header-elem mt-4 text-base sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Shorten, route, protect, and analyze every link through our ultra-fast Anycast edge infrastructure and real-time telemetry engine.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            BENTO GRID — 12-col system
            ROW 1:  Card 1 (col-span-7, WIDE ~58%)  |  Card 2 (col-span-5, ~42%)
            ROW 2:  Card 3 (col-span-5, ~42%)       |  Card 4 (col-span-7, WIDE ~58%)
           ══════════════════════════════════════════════════════════════════════ */}
        <div ref={cardsRef} className="grid grid-cols-1 md:grid-cols-12 gap-5">

          {/* ── CARD 1 — Wide (7/12) — One-click link creation ── */}
          <div
            className="product-bento-card md:col-span-7 rounded-3xl bg-[#111114] border border-white/[0.07] hover:border-white/[0.18] transition-colors duration-200 hover:shadow-2xl hover:shadow-black/60 p-5 sm:p-8 md:p-9 flex flex-col justify-between overflow-hidden min-h-[450px] sm:min-h-[480px]"
          >
            {/* TOP visual: 3 mini-cards arranged in a triangle with animated train circuit */}
            <div className="relative w-full max-w-[460px] mx-auto h-[250px] sm:h-[265px] pt-1">

              {/* ── SVG Animated Train Track Circuit (reversed loop, zero-cost layered strokes) ── */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none z-0"
                viewBox="0 0 400 240"
                preserveAspectRatio="none"
              >
                {/* Base rail track */}
                <path
                  d="M 200 44 L 105 174 L 295 174 Z"
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Outer soft blue aura beam (reversed, pure vector - no CPU filter) */}
                <path
                  d="M 200 44 L 105 174 L 295 174 Z"
                  fill="none"
                  stroke="#0066FF"
                  strokeWidth="6"
                  strokeOpacity="0.28"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: '75 437',
                    animation: 'bentoTrainLoop 3.2s linear infinite reverse',
                  }}
                />

                {/* Mid bright blue beam */}
                <path
                  d="M 200 44 L 105 174 L 295 174 Z"
                  fill="none"
                  stroke="#0066FF"
                  strokeWidth="3.5"
                  strokeOpacity="0.75"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: '75 437',
                    animation: 'bentoTrainLoop 3.2s linear infinite reverse',
                  }}
                />

                {/* Core electric cyan bullet head (reversed) */}
                <path
                  d="M 200 44 L 105 174 L 295 174 Z"
                  fill="none"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    strokeDasharray: '45 467',
                    animation: 'bentoTrainLoop 3.2s linear infinite reverse',
                  }}
                />
              </svg>

              {/* ── Mini Card 1: Short link (Top Center) ── */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 z-10 w-[190px] min-[380px]:w-[215px] sm:w-[235px] rounded-2xl bg-[#1a1a22] border border-white/[0.08] p-2 sm:p-3 flex items-center justify-center min-h-[78px] sm:min-h-[86px] shadow-xl shadow-black/50"
              >
                <div className="relative inline-block">
                  {/* Chip — bounces/presses on each click cycle */}
                  <div
                    className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-brand/15 border border-brand/25 select-none"
                    style={{
                      animation: 'bentoLinkPress 1.4s ease-in-out infinite',
                      transformOrigin: 'center center',
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full bg-brand shrink-0"
                      style={{ animation: 'pulse 1.4s ease-in-out infinite' }}
                    />
                    <span className="font-mono text-[9px] sm:text-[10px] text-brand font-medium leading-none">
                      lsho.cc/summer26
                    </span>
                  </div>

                  {/* Cursor — positioned directly ON the link chip */}
                  <div
                    className="absolute pointer-events-none z-20"
                    style={{
                      top: '36%',
                      left: '62%',
                      animation: 'bentoCursorClick 1.4s ease-in-out infinite',
                    }}
                  >
                    <svg width="15" height="19" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M1.5 1.5L1.5 14L4.8 10.7L6.8 16.2L8.6 15.4L6.6 9.9L11.2 9.9L1.5 1.5Z"
                        fill="white"
                        fillOpacity="0.95"
                        stroke="#38bdf8"
                        strokeWidth="1"
                        strokeLinejoin="round"
                      />
                    </svg>
                    {/* Ripple bursting from the cursor tip directly ON the link */}
                    <div
                      className="absolute top-[2px] left-[2px] w-4 h-4 rounded-full border border-sky-400 bg-sky-400/25 pointer-events-none"
                      style={{ animation: 'bentoClickRipple 1.4s ease-out infinite' }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Mini Card 2: LShorter API (Bottom Left) ── */}
              <div
                className="absolute bottom-0 left-0 sm:left-1 z-10 w-[138px] min-[380px]:w-[155px] sm:w-[195px] rounded-2xl bg-[#1a1a22] border border-white/[0.08] p-2.5 sm:p-3.5 flex flex-col justify-between min-h-[125px] sm:min-h-[132px] shadow-xl shadow-black/50"
              >
                {/* Header */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="w-[18px] h-[18px] rounded bg-brand/20 flex items-center justify-center font-mono text-[8px] font-bold text-brand select-none">
                    {'{}'}
                  </div>
                  <span className="text-[10px] font-bold text-white leading-none">LShorter API</span>
                </div>

                {/* Endpoint list */}
                <div className="mt-2 flex flex-col gap-1 sm:gap-[5px]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px] px-1 py-[2px] rounded font-mono font-bold text-emerald-400 bg-emerald-500/15 leading-tight">POST</span>
                    <span className="text-[8px] font-mono text-neutral-400 truncate">/shorten</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px] px-1 py-[2px] rounded font-mono font-bold text-sky-400 bg-sky-500/15 leading-tight">GET</span>
                    <span className="text-[8px] font-mono text-neutral-400 truncate">/analytics</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[7px] px-1 py-[2px] rounded font-mono font-bold text-red-400 bg-red-500/15 leading-tight">DEL</span>
                    <span className="text-[8px] font-mono text-neutral-400 truncate">/links/:id</span>
                  </div>
                </div>

                {/* Token preview */}
                <div className="mt-1 pt-1.5 border-t border-white/[0.05]">
                  <span className="text-[7.5px] font-mono text-neutral-500">lsh_live_9x82•••</span>
                </div>
              </div>

              {/* ── Mini Card 3: Features column (Bottom Right) ── */}
              <div
                className="absolute bottom-0 right-0 sm:right-1 z-10 w-[138px] min-[380px]:w-[155px] sm:w-[195px] rounded-2xl bg-[#1a1a22] border border-white/[0.08] p-2.5 sm:p-3.5 flex flex-col justify-between min-h-[125px] sm:min-h-[132px] shadow-xl shadow-black/50"
              >
                <div className="text-[8.5px] font-bold text-white/40 uppercase tracking-widest mb-1.5 shrink-0">
                  Features
                </div>
                <div className="flex flex-col gap-1 sm:gap-[5px]">
                  {['Analytics', 'Revenue', 'Routing', 'A/B Testing', 'PathLock™'].map((feat) => (
                    <div key={feat} className="flex items-center gap-1.5 sm:gap-2">
                      <div className="w-[5px] h-[5px] rounded-full bg-brand shrink-0" />
                      <span className="text-[8.5px] sm:text-[9px] text-neutral-300 leading-none">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* BOTTOM text */}
            <div className="mt-7">
              <h3 className="text-[17px] font-bold text-brand mb-1.5">
                One-click link creation
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Transform any URL into a branded, trackable short link with custom domains, dynamic QR codes, and password protection in milliseconds.
              </p>
            </div>
          </div>

          {/* ── CARD 2 — Compact (5/12) — Intuitive workflow ── */}
          <div
            className="product-bento-card md:col-span-5 rounded-3xl bg-[#111114] border border-white/[0.07] hover:border-white/[0.18] transition-colors duration-200 hover:shadow-2xl hover:shadow-black/60 p-7 sm:p-8 flex flex-col overflow-hidden min-h-[420px]"
          >
            {/* TOP text */}
            <div className="shrink-0">
              <h3 className="text-[17px] font-bold text-white mb-2">
                Intuitive workflow
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Manage links, campaigns, custom domains, and targets with zero friction through a streamlined control center.
              </p>
            </div>

            {/* BOTTOM screenshot — bleeds right & bottom */}
            <div className="flex-1 mt-6 relative -mr-8 -mb-8 sm:-mr-9 sm:-mb-9 min-h-[180px] rounded-tl-xl overflow-hidden border-t border-l border-white/[0.07]">
              <Image
                src="/marketing-FCI/real_dashboard_overview.png"
                alt="LShorter Dashboard"
                fill
                className="object-cover object-left-top transition-transform duration-700 ease-out hover:scale-[1.02]"
                priority
              />
            </div>
          </div>

          {/* ── CARD 3 — Compact (5/12) — Edge network + Globe ── */}
          <div
            className="product-bento-card md:col-span-5 rounded-3xl bg-[#111114] border border-white/[0.07] hover:border-white/[0.18] transition-colors duration-200 hover:shadow-2xl hover:shadow-black/60 p-7 sm:p-8 flex flex-col overflow-hidden min-h-[420px] relative"
          >
            {/* TOP text */}
            <div className="relative z-10 shrink-0">
              <h3 className="text-[17px] font-bold text-brand mb-2">
                Hosting over the edge
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed max-w-[300px]">
                With our global edge network across 300+ cities worldwide, your links resolve at the edge closest to your visitor in &lt;12ms.
              </p>
            </div>

            {/* GLOBE — sits directly on card dark background, NO wrapper background, bleeds bottom */}
            <div
              className="absolute bottom-0 left-0 right-0 pointer-events-none select-none"
              style={{ height: "68%" }}
            >
              <EdgeRotatingGlobe className="w-full h-full" />
            </div>
          </div>

          {/* ── CARD 4 — Wide (7/12) — Real-time analytics ── */}
          <div
            className="product-bento-card md:col-span-7 rounded-3xl bg-[#111114] border border-white/[0.07] hover:border-white/[0.18] transition-colors duration-200 hover:shadow-2xl hover:shadow-black/60 p-7 sm:p-8 flex flex-col overflow-hidden min-h-[420px]"
          >
            {/* TOP text */}
            <div className="shrink-0">
              <h3 className="text-[17px] font-bold text-white mb-2">
                Real-time edge telemetry
              </h3>
              <p className="text-sm text-neutral-400 leading-relaxed">
                Track unique visitors, click velocity, referral sources, and geographic distribution live as clicks happen across global PoPs.
              </p>
            </div>

            {/* BOTTOM screenshot — bleeds right & bottom */}
            <div className="flex-1 mt-6 relative -mr-8 -mb-8 sm:-mr-9 sm:-mb-9 min-h-[200px] rounded-tl-xl overflow-hidden border-t border-l border-white/[0.07]">
              <Image
                src="/marketing-FCI/real_analytics_overview.png"
                alt="LShorter Analytics"
                fill
                className="object-cover object-left-top transition-transform duration-700 ease-out hover:scale-[1.02]"
              />
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
