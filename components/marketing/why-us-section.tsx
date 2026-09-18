"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Zap,
  Layers,
  Terminal,
  QrCode,
  ShieldCheck,
  Sparkles,
  ArrowUpRight,
  Globe2,
  Smartphone,
  CheckCircle2,
  BarChart3,
  Lock,
} from "lucide-react";
import { ScrollStack, ScrollStackItem } from "@/components/ui/scroll-stack";
import { Counter } from "@/components/ui/counter";
import Link from "next/link";

interface StatItem {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  sub: string;
}

interface StackCard {
  id: string;
  number: string;
  tag: string;
  title: string;
  description: string;
  icon: React.ElementType;
  accentColor: string;
  badgeBg: string;
  gradientBorder: string;
  stats: StatItem[];
  highlights: string[];
}

const stackCards: StackCard[] = [
  {
    id: "edge-performance",
    number: "01",
    tag: "INFRASTRUCTURE & SPEED",
    title: "Sub-Millisecond Global Edge Network",
    description:
      "Every link redirect executes in isolated V8 engines across 330+ Cloudflare edge locations worldwide. Zero cold starts, ultra-low latency, and guaranteed enterprise reliability.",
    icon: Zap,
    accentColor: "text-amber-500 dark:text-amber-400",
    badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    gradientBorder: "from-amber-500/30 via-brand/20 to-transparent",
    stats: [
      { label: "Global Edge SLA", value: 99.99, decimals: 2, suffix: "%", sub: "Enterprise uptime" },
      { label: "Average TTFB", value: 11, suffix: "ms", sub: "Global redirect speed" },
      { label: "Data Centers", value: 330, prefix: "+", sub: "Anycast edge nodes" },
    ],
    highlights: [
      "Anycast Cloudflare Worker architecture",
      "Automatic failover with Zero-Downtime Guarantee",
      "Instant cache purging in less than 50ms",
    ],
  },
  {
    id: "smart-routing",
    number: "02",
    tag: "SMART ROUTING & TARGETING",
    title: "Dynamic Country, Device & A/B Router",
    description:
      "Direct your visitors with surgical precision. Deliver tailored destinations based on country, device operating system, language, or split traffic for high-converting A/B tests.",
    icon: Layers,
    accentColor: "text-blue-500 dark:text-blue-400",
    badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    gradientBorder: "from-blue-500/30 via-indigo-500/20 to-transparent",
    stats: [
      { label: "Geo Detection", value: 195, prefix: "+", sub: "Countries supported" },
      { label: "Rule Evaluation", value: 2, suffix: "ms", sub: "Edge rule processing" },
      { label: "A/B Traffic Splits", value: 50, suffix: "%", sub: "Precise weighted logic" },
    ],
    highlights: [
      "Target iOS to App Store & Android to Google Play",
      "PIN password gates & link expiration scheduling",
      "Search-engine-safe cloaking & OpenGraph meta preview",
    ],
  },
  {
    id: "developer-api",
    number: "03",
    tag: "DEVELOPER ECOSYSTEM",
    title: "High-Throughput API & Real-time Webhooks",
    description:
      "Built for technical teams. Scale link generation, automate campaigns, receive signed HMAC-SHA256 click webhooks, and integrate with any backend in minutes.",
    icon: Terminal,
    accentColor: "text-emerald-500 dark:text-emerald-400",
    badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    gradientBorder: "from-emerald-500/30 via-teal-500/20 to-transparent",
    stats: [
      { label: "API Rate Limit", value: 15000, suffix: "/min", sub: "Burst request capacity" },
      { label: "Webhook Latency", value: 85, suffix: "ms", sub: "Instant delivery" },
      { label: "SDKs Available", value: 3, sub: "TypeScript, Python, cURL" },
    ],
    highlights: [
      "Granular developer API keys with rate-limit monitoring",
      "Webhook test payload generator & signature verifier",
      "Automated PDF invoicing downloadable on the fly",
    ],
  },
  {
    id: "analytics-studio",
    number: "04",
    tag: "ANALYTICS & VECTOR STUDIO",
    title: "Zero-Cookie Analytics & Vector QR Studio",
    description:
      "100% GDPR-compliant real-time traffic insights without intrusive tracking cookies. Paired with a precision vector QR Code generator supporting custom logos and SVG exports.",
    icon: Sparkles,
    accentColor: "text-brand",
    badgeBg: "bg-brand/10 text-brand border-brand/20",
    gradientBorder: "from-brand/30 via-amber-500/20 to-transparent",
    stats: [
      { label: "Cookie Tracking", value: 0, sub: "100% GDPR compliant" },
      { label: "Export Formats", value: 4, sub: "SVG, PNG, WebP, PDF" },
      { label: "Real-time Metrics", value: 100, suffix: "%", sub: "Instant aggregation" },
    ],
    highlights: [
      "Interactive 3D Globe & real-time country traffic breakdown",
      "Custom brand colors, center logos & error correction",
      "Instant CSV & RAW metrics export in one click",
    ],
  },
];

export function WhyUsSection() {
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 30 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 88%",
            end: "bottom 12%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    }

    const cards = document.querySelectorAll(".why-us-stack-card");
    cards.forEach((card, idx) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 45, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          delay: idx * 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (
          st.trigger &&
          ((st.trigger as HTMLElement).classList?.contains("why-us-stack-card") ||
            st.trigger === headerRef.current)
        ) {
          st.kill();
        }
      });
    };
  }, []);

  return (
    <section className="relative py-20 sm:py-28 lg:py-32 bg-[#F2ECE4]/40 dark:bg-[#09090b] border-y border-[#E7DFD5] dark:border-white/5 overflow-visible">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[450px] bg-brand/5 dark:bg-brand/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div
          ref={headerRef}
          className="why-us-header text-center max-w-2xl mx-auto mb-14 sm:mb-20 flex flex-col items-center justify-center will-change-transform"
        >
          <span className="text-[11px] font-mono text-brand uppercase tracking-widest font-semibold block mb-2 select-none">
            06. Why Choose LShorter
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-neutral-900 dark:text-white text-center leading-tight">
            Why Choose <span className="text-brand">LShorter</span>?
          </h2>
          <p className="mt-3 text-xs sm:text-sm md:text-base text-neutral-600 dark:text-neutral-400 text-center max-w-lg leading-relaxed">
            Discover the four pillars that power lightning-fast redirects, advanced smart routing, and enterprise growth.
          </p>
        </div>

        {/* ScrollStack Stacking Cards Container */}
        <ScrollStack className="max-w-6xl mx-auto">
          {stackCards.map((card, idx) => {
            const Icon = card.icon;

            return (
              <ScrollStackItem
                key={card.id}
                index={idx}
                total={stackCards.length}
                topOffset={95}
                stackGap={32}
                className="w-full why-us-stack-card will-change-transform"
              >
                <div
                  className="relative rounded-[22px] sm:rounded-[28px] lg:rounded-[32px] bg-[#FFFDF9] dark:bg-[#141418] border border-[#E7DFD5] dark:border-white/10 p-6 sm:p-8 md:p-10 lg:p-12 min-h-[380px] sm:min-h-[440px] lg:min-h-[480px] shadow-[0_20px_50px_-12px_rgba(43,37,32,0.18)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] overflow-hidden transition-all duration-300 hover:border-[#DDD1C4] dark:hover:border-white/20 flex flex-col justify-between"
                >
                  {/* Top subtle gradient highlight border */}
                  <div
                    className={`absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r ${card.gradientBorder}`}
                  />

                  {/* Top Bar: Step Number + Tag Badge + Icon */}
                  <div className="flex items-center justify-between pb-5 sm:pb-6 border-b border-[#E7DFD5]/80 dark:border-white/5">
                    <div className="flex items-center gap-2.5 sm:gap-3">
                      <span className="font-mono text-xs sm:text-sm lg:text-base font-black text-neutral-400 dark:text-neutral-500">
                        {card.number}
                      </span>
                      <span className="text-neutral-300 dark:text-neutral-700">/</span>
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] sm:text-xs lg:text-[12px] font-bold tracking-wider font-mono border ${card.badgeBg}`}
                      >
                        {card.tag}
                      </span>
                    </div>

                    <div
                      className={`w-9 h-9 sm:w-11 sm:h-11 lg:w-12 lg:h-12 rounded-xl sm:rounded-2xl bg-[#F2ECE4] dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center ${card.accentColor} shadow-2xs`}
                    >
                      <Icon className="w-5 h-5 lg:w-6 lg:h-6" />
                    </div>
                  </div>

                  {/* Main Card Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 lg:gap-10 pt-6 sm:pt-8 flex-1 items-center">
                    {/* Left 7 Columns: Title & Description & Highlights */}
                    <div className="lg:col-span-7 flex flex-col justify-between space-y-4 sm:space-y-5 lg:space-y-6">
                      <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl lg:text-[28px] xl:text-[32px] font-bold text-neutral-900 dark:text-white tracking-tight leading-snug">
                          {card.title}
                        </h3>
                        <p className="mt-2.5 sm:mt-3 text-xs sm:text-sm lg:text-[15px] xl:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed font-normal">
                          {card.description}
                        </p>
                      </div>

                      {/* Feature Bullet Points */}
                      <div className="space-y-2.5 pt-2">
                        {card.highlights.map((h, i) => (
                          <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm lg:text-[14.5px] font-medium text-neutral-700 dark:text-neutral-300">
                            <CheckCircle2 className="w-4 h-4 lg:w-5 lg:h-5 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{h}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right 5 Columns: 3-Stat KPI Pill Grid */}
                    <div className="lg:col-span-5 flex flex-col justify-center gap-3 lg:gap-3.5 bg-[#F8F4EE] dark:bg-[#181820] p-4 sm:p-6 lg:p-7 rounded-[18px] lg:rounded-[24px] border border-[#E7DFD5] dark:border-white/5">
                      {card.stats.map((st, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-3 sm:p-4 lg:p-4.5 rounded-[12px] lg:rounded-[14px] bg-white dark:bg-[#121216] border border-[#E7DFD5]/70 dark:border-white/5 shadow-2xs"
                        >
                          <div>
                            <span className="text-[10px] sm:text-xs lg:text-[12px] font-bold text-neutral-500 dark:text-neutral-400 block uppercase tracking-wider">
                              {st.label}
                            </span>
                            <span className="text-[9.5px] sm:text-xs text-neutral-400 dark:text-neutral-500 mt-0.5 block">
                              {st.sub}
                            </span>
                          </div>
                          <span className={`font-bebas text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-black ${card.accentColor} leading-none tracking-wide`}>
                            <Counter
                              value={st.value}
                              decimals={st.decimals}
                              prefix={st.prefix}
                              suffix={st.suffix}
                            />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </ScrollStackItem>
            );
          })}
        </ScrollStack>
      </div>
    </section>
  );
}
