"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles, ArrowRight, Link2, LayoutDashboard, Globe, Activity } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { EdgeRotatingGlobe } from "@/components/globe/cobe-globe";
import { BentoAnimatedBeamCard } from "@/components/marketing/bento-animated-beam";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export function ProductSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState(0);

  const scrollToCard = useCallback((index: number) => {
    if (!cardsRef.current) return;
    const cardsEl = cardsRef.current;
    const cards = cardsEl.children;
    if (cards[index]) {
      const cardEl = cards[index] as HTMLElement;
      cardsEl.scrollTo({
        left: cardEl.offsetLeft - (cardsEl.clientWidth - cardEl.clientWidth) / 2,
        behavior: "smooth",
      });
      setActiveCard(index);
    }
  }, []);

  useEffect(() => {
    if (!sectionRef.current) return;
    const cardsEl = cardsRef.current;

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

      // ── 2. Bento cards scroll animation WITH REVERSE ──
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

    // ── 3. High-performance Mobile Carousel & Auto-Advance ──
    let isInteracting = false;
    let resumeTimeout: NodeJS.Timeout | null = null;

    const onScroll = () => {
      if (!cardsEl) return;
      const scrollCenter = cardsEl.scrollLeft + cardsEl.clientWidth / 2;
      const children = Array.from(cardsEl.children) as HTMLElement[];
      let closestIdx = 0;
      let minDistance = Infinity;
      children.forEach((child, i) => {
        const childCenter = child.offsetLeft + child.clientWidth / 2;
        const dist = Math.abs(scrollCenter - childCenter);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = i;
        }
      });
      setActiveCard(closestIdx);
    };

    const pauseInteraction = () => {
      isInteracting = true;
      if (resumeTimeout) clearTimeout(resumeTimeout);
    };

    const resumeInteraction = () => {
      if (resumeTimeout) clearTimeout(resumeTimeout);
      resumeTimeout = setTimeout(() => {
        isInteracting = false;
      }, 3000);
    };

    // Auto-advance every 4.5 seconds on mobile when not interacting
    const autoAdvanceInterval = setInterval(() => {
      if (typeof window === "undefined" || window.innerWidth >= 768 || isInteracting || !cardsEl) return;
      setActiveCard((prev) => {
        const next = (prev + 1) % 4;
        scrollToCard(next);
        return next;
      });
    }, 4500);

    if (cardsEl) {
      cardsEl.addEventListener("scroll", onScroll, { passive: true });
      cardsEl.addEventListener("touchstart", pauseInteraction, { passive: true });
      cardsEl.addEventListener("touchmove", pauseInteraction, { passive: true });
      cardsEl.addEventListener("touchend", resumeInteraction, { passive: true });
      cardsEl.addEventListener("mouseenter", pauseInteraction);
      cardsEl.addEventListener("mouseleave", resumeInteraction);
    }

    return () => {
      ctx.revert();
      clearInterval(autoAdvanceInterval);
      if (resumeTimeout) clearTimeout(resumeTimeout);
      if (cardsEl) {
        cardsEl.removeEventListener("scroll", onScroll);
        cardsEl.removeEventListener("touchstart", pauseInteraction);
        cardsEl.removeEventListener("touchmove", pauseInteraction);
        cardsEl.removeEventListener("touchend", resumeInteraction);
        cardsEl.removeEventListener("mouseenter", pauseInteraction);
        cardsEl.removeEventListener("mouseleave", resumeInteraction);
      }
    };
  }, [scrollToCard]);

  return (
    <section
      ref={sectionRef}
      id="product"
      className="relative w-full py-20 sm:py-28 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#09090B] transition-colors duration-300 overflow-hidden"
    >
      <div className="relative max-w-6xl mx-auto">

        {/* ── SECTION HEADER ── */}
        <div className="flex flex-col items-start text-left mb-10 sm:mb-14">
          <div className="product-header-elem inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-brand/10 dark:bg-brand/20 text-brand border border-brand/20 mb-5 select-none">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Short Links &amp; Edge Architecture</span>
          </div>

          <h2 className="product-header-elem text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-white leading-[1.1] max-w-3xl">
            High-performance short links, engineered for conversion.
          </h2>

          <p className="product-header-elem mt-4 text-base sm:text-lg text-neutral-500 dark:text-neutral-400 max-w-2xl leading-relaxed">
            Shorten, route, protect, and analyze every link through our ultra-fast Anycast edge infrastructure and real-time telemetry engine.
          </p>
        </div>

        {/* ══════════════════════════════════════════════════════════════════════
            MAGIC UI BENTO GRID — 12-col desktop layout + smooth snap-x mobile carousel
            ROW 1:  Card 1 (col-span-7, WIDE ~58%)  |  Card 2 (col-span-5, ~42%)
            ROW 2:  Card 3 (col-span-5, ~42%)       |  Card 4 (col-span-7, WIDE ~58%)
           ══════════════════════════════════════════════════════════════════════ */}
        <div
          ref={cardsRef}
          className="flex md:grid md:grid-cols-12 gap-4 sm:gap-5 overflow-x-auto md:overflow-visible pb-4 md:pb-0 snap-x snap-mandatory scroll-smooth scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden -mx-4 px-4 sm:mx-0 sm:px-0"
          style={{ WebkitOverflowScrolling: "touch" }}
        >

          {/* ── CARD 1 — Wide (7/12) — Retargeting Pixels ── */}
          <div className="product-bento-card w-[86vw] xs:w-[340px] sm:w-[380px] md:w-auto shrink-0 md:shrink md:col-span-7 h-full snap-center">
            <div className="bento-card-scale group relative h-full rounded-2xl bg-neutral-900/5 dark:bg-[#111114] border border-neutral-200/80 dark:border-white/[0.08] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] p-5 sm:p-8 md:p-9 flex flex-col justify-between overflow-hidden min-h-[460px] sm:min-h-[490px] cursor-pointer">
              {/* TOP visual: Magic UI Animated Beam connecting visitor to retargeting pixels via Link2 node */}
              <BentoAnimatedBeamCard />

              {/* BOTTOM text */}
              <div className="mt-5 sm:mt-6">
                <div className="flex items-center gap-2 mb-1.5">
                  <Link2 className="w-4 h-4 text-brand shrink-0" />
                  <h3 className="text-[17px] font-bold text-neutral-900 dark:text-white">
                    Retargeting pixels &amp; conversion tracking
                  </h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Automatically fire Meta, Google Tag, TikTok Ads, LinkedIn Insight, and X pixels on every click to build high-converting custom audiences across paid channels.
                </p>
                <Link
                  href="/docs"
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-brand hover:text-brand/80 hover:underline transition-all group-hover:translate-x-1 cursor-pointer"
                >
                  <span>Explore pixel retargeting documentation</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
              <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-neutral-500/[.02] group-hover:dark:bg-white/[.02]" />
            </div>
          </div>

          {/* ── CARD 2 — Compact (5/12) — Intuitive workflow ── */}
          <div className="product-bento-card w-[86vw] xs:w-[340px] sm:w-[380px] md:w-auto shrink-0 md:shrink md:col-span-5 h-full snap-center">
            <div className="bento-card-scale group relative h-full rounded-2xl bg-neutral-900/5 dark:bg-[#111114] border border-neutral-200/80 dark:border-white/[0.08] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] p-7 sm:p-8 flex flex-col overflow-hidden min-h-[460px] sm:min-h-[490px] cursor-pointer">
              {/* TOP text */}
              <div className="shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <LayoutDashboard className="w-4 h-4 text-brand shrink-0" />
                  <h3 className="text-[17px] font-bold text-neutral-900 dark:text-white">
                    Intuitive workflow
                  </h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Manage links, campaigns, custom domains, and targets with zero friction through a streamlined control center.
                </p>
              </div>

              {/* BOTTOM screenshot — bleeds right & bottom */}
              <div className="flex-1 mt-6 relative -mr-8 -mb-8 sm:-mr-9 sm:-mb-9 min-h-[200px] rounded-tl-xl overflow-hidden border-t border-l border-white/[0.07]">
                <Image
                  src="/screenshots/dashboard/dashboard1.png"
                  alt="LShorter Dashboard"
                  fill
                  className="object-cover object-left-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  priority
                />
              </div>
              <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-neutral-500/[.02] group-hover:dark:bg-white/[.02]" />
            </div>
          </div>

          {/* ── CARD 3 — Compact (5/12) — Edge network + Globe ── */}
          <div className="product-bento-card w-[86vw] xs:w-[340px] sm:w-[380px] md:w-auto shrink-0 md:shrink md:col-span-5 h-full snap-center">
            <div className="bento-card-scale group relative h-full rounded-2xl bg-neutral-900/5 dark:bg-[#111114] border border-neutral-200/80 dark:border-white/[0.08] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] p-7 sm:p-8 flex flex-col overflow-hidden min-h-[460px] sm:min-h-[490px] relative cursor-pointer">
              {/* TOP text */}
              <div className="relative z-10 shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Globe className="w-4 h-4 text-brand shrink-0" />
                  <h3 className="text-[17px] font-bold text-neutral-900 dark:text-white">
                    Hosting over the edge
                  </h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-[300px]">
                  With our global edge network across 300+ cities worldwide, your links resolve at the edge closest to your visitor in &lt;12ms.
                </p>
              </div>

              {/* GLOBE — sits directly on card dark background */}
              <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none select-none"
                style={{ height: "68%" }}
              >
                <EdgeRotatingGlobe className="w-full h-full" />
              </div>
              <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-neutral-500/[.02] group-hover:dark:bg-white/[.02]" />
            </div>
          </div>

          {/* ── CARD 4 — Wide (7/12) — Real-time analytics ── */}
          <div className="product-bento-card w-[86vw] xs:w-[340px] sm:w-[380px] md:w-auto shrink-0 md:shrink md:col-span-7 h-full snap-center">
            <div className="bento-card-scale group relative h-full rounded-2xl bg-neutral-900/5 dark:bg-[#111114] border border-neutral-200/80 dark:border-white/[0.08] dark:[box-shadow:0_-20px_80px_-20px_#ffffff1f_inset] p-7 sm:p-8 flex flex-col overflow-hidden min-h-[460px] sm:min-h-[490px] cursor-pointer">
              {/* TOP text */}
              <div className="shrink-0">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-brand shrink-0" />
                  <h3 className="text-[17px] font-bold text-neutral-900 dark:text-white">
                    Real-time edge telemetry
                  </h3>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  Track unique visitors, click velocity, referral sources, and geographic distribution live as clicks happen across global PoPs.
                </p>
              </div>

              {/* BOTTOM screenshot — bleeds right & bottom */}
              <div className="flex-1 mt-6 relative -mr-8 -mb-8 sm:-mr-9 sm:-mb-9 min-h-[220px] rounded-tl-xl overflow-hidden border-t border-l border-white/[0.07]">
                <Image
                  src="/screenshots/geo/geowithsidbare.png"
                  alt="LShorter Analytics"
                  fill
                  className="object-cover object-left-top transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                />
              </div>
              <div className="pointer-events-none absolute inset-0 transform-gpu transition-all duration-300 group-hover:bg-neutral-500/[.02] group-hover:dark:bg-white/[.02]" />
            </div>
          </div>

        </div>

        {/* ── Mobile Carousel Indicators & Swipe Assist ── */}
        <div className="flex md:hidden flex-col items-center justify-center gap-2 mt-6 select-none">
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => scrollToCard(idx)}
                aria-label={`Slide ${idx + 1}`}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeCard === idx
                    ? "w-7 bg-brand shadow-sm shadow-brand/40"
                    : "w-2 bg-neutral-300 dark:bg-white/20 hover:bg-neutral-400"
                }`}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-neutral-400 dark:text-neutral-500 tracking-wide">
            Swipe to explore • 4 key platform capabilities
          </span>
        </div>

      </div>
    </section>
  );
}
