"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { WobbleCard } from "@/components/ui/wobble-card";
import { ArrowRight, ShieldCheck, Zap, QrCode } from "lucide-react";
import { Counter } from "@/components/ui/counter";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function WobbleCardSection() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const header = document.querySelector(".wobble-section-header");
    if (header) {
      gsap.fromTo(
        header,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: header,
            start: "top 88%",
            end: "bottom 12%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (
          st.trigger &&
          (st.trigger as HTMLElement).classList?.contains(
            "wobble-section-header"
          )
        ) {
          st.kill();
        }
      });
    };
  }, []);

  return (
    <section
      id="overview"
      className="relative z-10 py-16 sm:py-24 overflow-hidden bg-[#FAF7F2] dark:bg-[#09090b] transition-colors"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="wobble-section-header text-center max-w-2xl mx-auto mb-10 sm:mb-14 flex flex-col items-center justify-center">
          <span className="text-[11px] font-mono text-brand uppercase tracking-widest font-semibold block mb-2">
            04. Modern SaaS Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-neutral-900 dark:text-white leading-tight text-center">
            Built for Extreme Speed, Engineered for High Conversion
          </h2>
          <p className="mt-2 text-xs sm:text-sm md:text-base text-neutral-600 dark:text-neutral-400 font-normal max-w-xl mx-auto text-center">
            Experience the full depth of LShorter: Edge geolocation, multi-variant
            A/B testing, vector QR codes, and zero-leakage security.
          </p>
        </div>

        {/* ══ Aceternity Wobble Card Bento Grid (Demo layout) ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full">
          {/* Card 1: Top-Left (col-span-2) */}
          <WobbleCard
            containerClassName="col-span-1 lg:col-span-2 h-full bg-pink-800 dark:bg-[#6b163e] min-h-[320px] sm:min-h-[440px] lg:min-h-[300px] group cursor-pointer"
            className="flex flex-col justify-between"
          >
            <Link
              href="/docs/sdk-quickstart"
              className="block w-full h-full relative"
            >
              <div className="max-w-xs sm:max-w-sm md:max-w-md z-10 relative flex flex-col items-center sm:items-start text-center sm:text-left mx-auto sm:mx-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono font-medium mb-3">
                  <Zap className="w-3 h-3 text-amber-300" />
                  <span>Cloudflare Global Edge</span>
                </div>
                <h2 className="text-balance text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-[-0.015em] text-white leading-tight">
                  LShorter Edge powers sub-<Counter value={15} suffix="ms" /> redirects across the entire globe
                </h2>
                <p className="mt-3 text-xs sm:text-sm md:text-[14px] text-pink-100/90 leading-relaxed font-normal">
                  With over <Counter value={120000} suffix="+" /> monthly active redirects, smart country-based
                  failover, and zero-latency memory caching, LShorter is the modern
                  infrastructure for conversion.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-white group-hover:translate-x-1 transition-transform">
                  <span>Explore Edge Architecture</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Real SaaS Visual Mockup */}
              <div className="hidden sm:block absolute -right-10 sm:-right-4 lg:-right-[25%] -bottom-10 w-[280px] sm:w-[380px] lg:w-[460px] h-[220px] sm:h-[280px] lg:h-[320px] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                <Image
                  src="/marketing-FCI/cosmos_big_card.jpeg"
                  alt="LShorter Real-Time Dashboard"
                  fill
                  sizes="(max-width: 768px) 100vw, 500px"
                  className="object-cover object-left-top transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            </Link>
          </WobbleCard>

          {/* Card 2: Top-Right (col-span-1) */}
          <WobbleCard
            containerClassName="col-span-1 min-h-[280px] sm:min-h-[300px] bg-indigo-900 dark:bg-[#1e1b4b] group cursor-pointer"
            className=""
          >
            <Link
              href="/docs/pin-protection"
              className="block w-full h-full relative"
            >
              <div className="relative z-10 flex flex-col items-center sm:items-start text-center sm:text-left mx-auto sm:mx-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono font-medium mb-3">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Zero-Leakage Privacy</span>
                </div>
                <h2 className="max-w-80 text-balance text-lg sm:text-xl md:text-2xl font-bold tracking-[-0.015em] text-white leading-tight">
                  No tracking leak. Total PIN &amp; Masking control.
                </h2>
                <p className="mt-3 max-w-[26rem] text-xs sm:text-sm text-indigo-100/90 leading-relaxed font-normal">
                  Conceal affiliate parameters to protect campaigns from scrapers,
                  and gate high-value links with granular access PIN codes.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <div className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[11px] font-mono text-emerald-300">
                    AES-<Counter value={256} /> GCM
                  </div>
                  <div className="px-2.5 py-1 rounded-md bg-white/10 border border-white/15 text-[11px] font-mono text-indigo-200">
                    PIN Verified
                  </div>
                </div>

                <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-white group-hover:translate-x-1 transition-transform">
                  <span>Learn Security Specs</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </Link>
          </WobbleCard>

          {/* Card 3: Bottom Full-Width (col-span-3) */}
          <WobbleCard
            containerClassName="col-span-1 lg:col-span-3 bg-blue-900 dark:bg-[#0e2554] min-h-[320px] sm:min-h-[440px] lg:min-h-[320px] group cursor-pointer"
            className="flex flex-col justify-between"
          >
            <Link
              href="/docs/dynamic-qr-codes"
              className="block w-full h-full relative"
            >
              <div className="max-w-sm sm:max-w-md md:max-w-lg z-10 relative flex flex-col items-center sm:items-start text-center sm:text-left mx-auto sm:mx-0">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-mono font-medium mb-3">
                  <QrCode className="w-3 h-3 text-cyan-300" />
                  <span>Vector Engine &amp; Automation</span>
                </div>
                <h2 className="text-balance text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold tracking-[-0.015em] text-white leading-tight">
                  Dynamic Vector QR Codes, Multi-Variant A/B Matrix &amp; Instant Webhooks
                </h2>
                <p className="mt-3 text-xs sm:text-sm md:text-[14px] text-blue-100/90 leading-relaxed font-normal">
                  Generate print-ready vector QR codes for physical media, split
                  clicks between multiple landing pages by custom percentage, and
                  stream webhook payloads straight to Discord, Slack, or your API.
                </p>
                <div className="mt-5 inline-flex items-center gap-2 text-xs font-semibold text-white group-hover:translate-x-1 transition-transform">
                  <span>Explore QR &amp; Matrix Tools</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Real SaaS Visual Mockup */}
              <div className="hidden sm:block absolute -right-8 sm:-right-4 lg:-right-[10%] -bottom-10 w-[300px] sm:w-[420px] lg:w-[520px] h-[220px] sm:h-[280px] lg:h-[340px] rounded-2xl overflow-hidden shadow-2xl border border-white/20">
                <Image
                  src="/marketing-FCI/cosmos_302657415.jpeg"
                  alt="LShorter Dynamic QR Codes and Matrix"
                  fill
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="object-cover object-center transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = "none";
                  }}
                />
              </div>
            </Link>
          </WobbleCard>
        </div>
      </div>
    </section>
  );
}
