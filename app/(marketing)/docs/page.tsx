"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { getAllDocFeatures } from "@/lib/docs-data";
import { CofounderResourceCard } from "@/components/marketing/cofounder-resource-card";
import { CardContainer, CardBody, CardItem } from "@/components/ui/3d-card";

const CARD_META: Record<string, { tag: string; color: string; date: string }> = {
  "sdk-quickstart": { tag: "SDK & API", color: "bg-emerald-500", date: "v1.2" },
  "geo-routing": { tag: "Edge Routing", color: "bg-[#0080ff] sm:bg-[#ff6600]", date: "09/12" },
  "ab-testing-routing": { tag: "A/B Testing", color: "bg-orange-500", date: "09/10" },
  "pin-protection": { tag: "Security", color: "bg-amber-500", date: "09/08" },
  "realtime-analytics": { tag: "Analytics", color: "bg-purple-500", date: "09/04" },
  "conversion-tracking-amount-count": { tag: "Conversions & EPC", color: "bg-emerald-600", date: "09/01" },
  "click-limits-and-expiration": { tag: "Limits", color: "bg-rose-500", date: "08/28" },
  "url-masking": { tag: "Privacy & Cloaking", color: "bg-sky-500", date: "08/20" },
  "dynamic-qr-codes": { tag: "QR Codes", color: "bg-indigo-500", date: "08/14" },
  "social-sharing-opengraph": { tag: "Open Graph", color: "bg-pink-500", date: "08/08" },
  "webhooks-and-events": { tag: "Webhooks", color: "bg-emerald-400", date: "08/02" },
};

const ECOSYSTEM_STACK = [
  { name: "Next.js", icon: "▲" },
  { name: "Cloudflare", icon: "⚡" },
  { name: "TypeScript", icon: "TS" },
  { name: "Node.js", icon: "⬢" },
  { name: "Bun", icon: "🥟" },
  { name: "REST API", icon: "⇄" },
  { name: "Rust", icon: "⚙" },
  { name: "Docker", icon: "🐳" },
  { name: "Python", icon: "🐍" },
  { name: "Go", icon: "🔷" },
];

export default function DocsPage() {
  const features = getAllDocFeatures();
  const pageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    // 1. Entrance animation for the Top Hero Section
    const heroEl = document.querySelector(".docs-hero-section");
    if (heroEl) {
      gsap.fromTo(
        heroEl,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power2.out",
          scrollTrigger: {
            trigger: heroEl,
            start: "top 90%",
            end: "bottom 10%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    }

    // 2. Entrance animation for the Social Proof Ticker
    const tickerEl = document.querySelector(".docs-social-proof");
    if (tickerEl) {
      gsap.fromTo(
        tickerEl,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: tickerEl,
            start: "top 90%",
            end: "bottom 10%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    }

    // 3. Staggered Entrance and Exit for the 3-Column Resource Cards Grid
    const cardsGrid = document.querySelector(".docs-cards-grid");
    const cardItems = document.querySelectorAll(".cofounder-card-item");
    if (cardsGrid && cardItems.length > 0) {
      gsap.fromTo(
        cardItems,
        { opacity: 0, y: 35, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardsGrid,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => st.kill());
    };
  }, []);

  return (
    <div ref={pageContainerRef} className="w-full min-h-screen pt-24 pb-16 px-4 sm:px-6 md:px-8 bg-[#FAF7F2] dark:bg-[#09090b] transition-colors duration-300">
      
      {/* 1. TOP HERO: Exact Cofounder Layout (Clean image on left + typography on right directly on page) */}
      <section className="docs-hero-section max-w-6xl mx-auto pt-6 pb-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column: 3D Interactive Card strictly around the Image */}
          <div className="lg:col-span-7 flex items-center justify-center">
            <CardContainer containerClassName="w-full py-0" className="w-full">
              <CardBody className="w-full h-auto">
                <CardItem translateZ="50" className="w-full">
                  <div className="relative w-full aspect-[16/10] sm:aspect-[16/9] rounded-2xl overflow-hidden border border-[#E7DFD5] dark:border-white/10 shadow-2xl bg-neutral-900 group">
                    <Image
                      src="/marketing-FCI/cosmos_big_card.jpeg"
                      alt="LShorter global edge architecture and infrastructure"
                      fill
                      priority
                      className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      sizes="(max-width: 1024px) 100vw, 680px"
                    />
                  </div>
                </CardItem>
              </CardBody>
            </CardContainer>
          </div>

          {/* Right Column: Editorial Typography & Action */}
          <div className="lg:col-span-5 flex flex-col justify-center space-y-4 text-left">
            <div className="flex items-center gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-400">
              <span className="w-2 h-2 rounded-full bg-[#0080ff] sm:bg-[#ff6600]" />
              <span>Announcement &amp; Architecture</span>
              <span className="text-neutral-600 dark:text-neutral-400 ml-auto font-mono">09/12</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#2B2520] dark:text-white leading-[1.18]">
              Ultra-fast edge redirection infrastructure for developers
            </h1>

            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Deploy contextual routing rules, protect links with PIN codes, and measure every click with millisecond precision across a global distributed edge network.
            </p>

            <div className="pt-2">
              <Link
                href="/docs/sdk-quickstart"
                className="inline-flex items-center gap-2 text-xs sm:text-sm font-mono font-semibold text-[#0080ff] sm:text-[#ff6600] hover:underline cursor-pointer group/link"
              >
                <span>Explore Quickstart Guide</span>
                <ArrowRight className="w-4 h-4 group-hover/link:translate-x-1.5 transition-transform duration-200" />
              </Link>
            </div>
          </div>

        </div>
      </section>

      {/* 2. SOCIAL PROOF / ECOSYSTEM BAR (Infinite Marquee Movement) */}
      <section className="docs-social-proof max-w-6xl mx-auto py-8 sm:py-10 border-b border-[#E7DFD5] dark:border-white/10">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <p className="text-xs sm:text-sm font-medium text-neutral-600 dark:text-neutral-400 shrink-0 text-center lg:text-left">
            Over <strong className="text-[#2B2520] dark:text-white font-semibold">100,000+ Edge redirections</strong> processed daily with 99.99% uptime.
          </p>

          {/* Infinite Marquee Container with subtle edge fade masks */}
          <div className="w-full lg:max-w-xl overflow-hidden relative [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
            <div className="animate-marquee flex gap-3 w-max select-none">
              {/* Duplicated items to create a seamless infinite marquee */}
              {[...ECOSYSTEM_STACK, ...ECOSYSTEM_STACK].map((item, idx) => (
                <span
                  key={idx}
                  className="px-3.5 py-1.5 rounded-xl bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-white/10 text-xs font-mono text-neutral-700 dark:text-neutral-300 shadow-xs shrink-0 cursor-default transition-all hover:border-[#0080ff] sm:hover:border-[#ff6600] hover:scale-105"
                >
                  {item.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. THE 3-COLUMN RESOURCES GRID (Exact Cofounder Grid with GSAP Pop-up Card Animation) */}
      <section className="docs-cards-grid max-w-6xl mx-auto pt-12 sm:pt-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {features.map((feature, idx) => {
            const meta = CARD_META[feature.slug] || {
              tag: "Guide",
              color: "bg-neutral-400",
              date: "09/12",
            };

            return (
              <CofounderResourceCard
                key={feature.slug}
                feature={feature}
                tagLabel={meta.tag}
                tagColor={meta.color}
                dateLabel={meta.date}
                index={idx}
              />
            );
          })}
        </div>
      </section>

    </div>
  );
}
