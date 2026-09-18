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
    accentClass: "text-brand",
  },
  {
    icon: Layers,
    title: "All-in-One Suite",
    desc: "Shortening, intelligent traffic routing, PIN protection, custom QR Codes, and real-time analytics in a single unified workspace.",
    accentClass: "text-brand",
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

import { Counter } from "@/components/ui/counter";

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
    <section className="relative py-14 sm:py-20 bg-[#F2ECE4]/60 dark:bg-[#0c0c10] border-y border-[#E7DFD5] dark:border-white/5 overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="why-us-header text-center max-w-2xl mx-auto mb-8 sm:mb-10 flex flex-col items-center justify-center">
          <h2 className="text-xl sm:text-[24px] font-medium tracking-tight text-neutral-900 dark:text-white text-center">
            Why Choose LShorter?
          </h2>
          <p className="mt-1.5 text-xs sm:text-[13.5px] text-neutral-600 dark:text-neutral-400 text-center max-w-lg">
            A modern edge-native architecture built for speed, simplicity, and scale.
          </p>
        </div>

        {/* 4 Cards Grid with GSAP Scale & Hover Effects */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 max-w-md sm:max-w-none mx-auto w-full">
          {reasons.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className="why-us-card group w-full"
              >
                <Card className="p-5 h-full flex flex-col items-center text-center sm:items-start sm:text-left justify-between rounded-2xl bg-[#FFFDF9] dark:bg-[#141418] border-[#E7DFD5] dark:border-white/10 hover:border-[#DDD1C4] dark:hover:border-white/20 shadow-sm transition-shadow duration-300">
                  <div className="space-y-3 flex flex-col items-center sm:items-start w-full">
                    <div
                      className={`w-9 h-9 rounded-xl bg-[#F2ECE4] dark:bg-white/5 flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${item.accentClass}`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <h3 className="text-sm sm:text-[14.5px] font-semibold text-neutral-900 dark:text-white text-center sm:text-left">
                      {item.title}
                    </h3>
                    <p className="text-[11.5px] sm:text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal text-center sm:text-left">
                      {idx === 0 ? (
                        <>
                          Sub-millisecond redirects on the global Cloudflare network with a{" "}
                          <Counter value={99.99} decimals={2} suffix="%" className="font-semibold text-neutral-800 dark:text-neutral-200" />{" "}
                          guaranteed uptime SLA.
                        </>
                      ) : (
                        item.desc
                      )}
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
