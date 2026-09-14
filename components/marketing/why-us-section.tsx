"use client";

import React, { useEffect } from "react";
import { Zap, Layers, Sparkles, Terminal } from "lucide-react";
import { Card } from "@/components/ui/card";
import gsap from "gsap";

const reasons = [
  {
    icon: Zap,
    title: "Fast & Reliable",
    desc: "Sub-millisecond redirects on the global Cloudflare network with a 99.99% guaranteed uptime SLA.",
    accentClass: "text-[#0080ff] sm:text-[#ff6600]",
  },
  {
    icon: Layers,
    title: "All-in-One Suite",
    desc: "Shortening, intelligent traffic routing, PIN protection, custom QR Codes, and real-time analytics in a single unified workspace.",
    accentClass: "text-[#0080ff] sm:text-[#ff8800]",
  },
  {
    icon: Sparkles,
    title: "Modern Interface",
    desc: "Native Light & Dark Mode, frictionless UX, zero-latency interactions, and mobile-first design.",
    accentClass: "text-[#10b981]",
  },
  {
    icon: Terminal,
    title: "Built for Developers",
    desc: "High-throughput REST API, granular A/B testing, webhooks, and flexible export formats to integrate with any stack.",
    accentClass: "text-[#8b5cf6]",
  },
];

import { ScrollTrigger } from "gsap/ScrollTrigger";

export function WhyUsSection() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const header = document.querySelector(".why-us-header");
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

    const cards = document.querySelectorAll(".why-us-card");
    cards.forEach((card, i) => {
      gsap.fromTo(
        card,
        { opacity: 0, y: 30, scale: 0.95 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          delay: i * 0.08,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 88%",
            end: "bottom 12%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (
          st.trigger &&
          ((st.trigger as HTMLElement).classList?.contains("why-us-card") ||
            (st.trigger as HTMLElement).classList?.contains("why-us-header"))
        ) {
          st.kill();
        }
      });
    };
  }, []);

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { scale: 1.03, duration: 0.25, ease: "power2.out" });
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    gsap.to(e.currentTarget, { scale: 1, duration: 0.25, ease: "power2.out" });
  };

  return (
    <section className="relative py-20 sm:py-28 bg-[#F2ECE4]/60 dark:bg-[#0c0c10] border-y border-[#E7DFD5] dark:border-white/5 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="why-us-header text-center max-w-2xl mx-auto mb-14">
          <h2 className="text-[26px] sm:text-[30px] font-medium tracking-tight text-neutral-900 dark:text-white">
            Why Choose LShorter?
          </h2>
          <p className="mt-2 text-sm sm:text-base text-neutral-600 dark:text-neutral-400">
            A modern edge-native architecture built for speed, simplicity, and scale.
          </p>
        </div>

        {/* 4 Cards Grid with GSAP Scale & Hover Effects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {reasons.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="why-us-card group"
              >
                <Card className="p-6 h-full flex flex-col justify-between rounded-2xl bg-[#FFFDF9] dark:bg-[#141418] border-[#E7DFD5] dark:border-white/10 hover:border-[#DDD1C4] dark:hover:border-white/20 shadow-sm transition-shadow duration-300">
                  <div className="space-y-4">
                    <div
                      className={`w-10 h-10 rounded-xl bg-[#F2ECE4] dark:bg-white/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${item.accentClass}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <h3 className="text-base font-semibold text-neutral-900 dark:text-white">
                      {item.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal">
                      {item.desc}
                    </p>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
