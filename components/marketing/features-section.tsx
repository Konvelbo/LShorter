"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface FeatureItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  side: "left" | "right";
  docSlug: string;
}

const features: FeatureItem[] = [
  {
    id: 1,
    title: "Link Shortening",
    subtitle: "Instant Edge Speed",
    description:
      "Create clean, ultra-fast, and shareable short links in seconds. Your redirects execute in under 15ms across our global Edge network.",
    image: "/marketing-FCI/cosmos_1739739224.jpeg",
    side: "left",
    docSlug: "sdk-quickstart",
  },
  {
    id: 2,
    title: "Percentage-Based Routing — A/B Testing",
    subtitle: "Conversion Optimization",
    description:
      "Distribute clicks between multiple destination URLs by custom percentages. Ideal for landing page comparison and marketing experiments.",
    image: "/marketing-FCI/cosmos_1746304416.jpeg",
    side: "right",
    docSlug: "ab-testing-routing",
  },
  {
    id: 3,
    title: "Access Code & PIN Protection",
    subtitle: "Security & Privacy",
    description:
      "Secure your links with an access PIN code before redirecting. Ensure only authorized visitors access sensitive or exclusive content.",
    image: "/marketing-FCI/cosmos_1796978290.jpeg",
    side: "left",
    docSlug: "pin-protection",
  },
  {
    id: 4,
    title: "Click Limits + Forward URL",
    subtitle: "Automated Volume Control",
    description:
      "Set a maximum click threshold and automatically redirect visitors to a fallback URL once reached. Never lose a visitor again.",
    image: "/marketing-FCI/cosmos_2136974997.jpeg",
    side: "right",
    docSlug: "click-limits-and-expiration",
  },
  {
    id: 5,
    title: "URL Masking",
    subtitle: "Discretion & Brand Shield",
    description:
      "Conceal the actual destination URL to protect sensitive affiliate parameters and keep campaign integrity against scrapers.",
    image: "/marketing-FCI/cosmos_227768569.jpeg",
    side: "left",
    docSlug: "url-masking",
  },
  {
    id: 6,
    title: "Dynamic QR Codes",
    subtitle: "Vector Generation & Customization",
    description:
      "Instantly generate and customize QR codes for every short link. Download in crisp high resolution ready for print and packaging.",
    image: "/marketing-FCI/cosmos_302657415.jpeg",
    side: "right",
    docSlug: "dynamic-qr-codes",
  },
  {
    id: 7,
    title: "Social Sharing & Open Graph",
    subtitle: "Automated Rich Previews",
    description:
      "Share links on LinkedIn, WhatsApp, X (Twitter), Discord, and Telegram with customized Open Graph cards that render immediately.",
    image: "/marketing-FCI/cosmos_549824580.jpeg",
    side: "left",
    docSlug: "social-sharing-opengraph",
  },
  {
    id: 8,
    title: "Developer API & SDK",
    subtitle: "Native Automation",
    description:
      "Integrate every capability directly into your workflows and applications using our documented, high-throughput REST API.",
    image: "/marketing-FCI/cosmos_938538719.jpeg",
    side: "right",
    docSlug: "webhooks-and-events",
  },
];

export function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const header = document.querySelector(".features-header");
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
        },
      );
    }

    const cards = document.querySelectorAll(".feature-row-item");

    cards.forEach((card) => {
      const side = card.getAttribute("data-side");

      // Slide-in + subtle float on scroll with full reverse on scroll up
      gsap.fromTo(
        card,
        {
          opacity: 0,
          x: side === "left" ? -40 : 40,
          y: 20,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.75,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play reverse play reverse",
          },
        },
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (
          st.trigger &&
          ((st.trigger as HTMLElement).classList?.contains(
            "feature-row-item",
          ) ||
            (st.trigger as HTMLElement).classList?.contains("features-header"))
        ) {
          st.kill();
        }
      });
    };
  }, []);

  return (
    <section
      id="features"
      className="relative z-0 pt-32 sm:pt-44 pb-20 sm:pb-32 overflow-hidden bg-[#FAF7F2] dark:bg-[#09090b] transition-colors"
    >
      {/* Center dividing guide line for desktop - starts gracefully after a substantial gap */}
      <div className="hidden lg:block absolute left-1/2 top-36 bottom-0 w-px bg-gradient-to-b from-transparent via-[#E7DFD5] to-[#E7DFD5] dark:via-white/[0.08] dark:to-white/[0.08] -translate-x-1/2 pointer-events-none" />

      <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="features-header text-center max-w-2xl mx-auto mb-12 sm:mb-20">
          <h2 className="text-2xl sm:text-[30px] font-medium tracking-tight text-neutral-900 dark:text-white leading-snug">
            Comprehensive Features, Zero Compromise
          </h2>
          <p className="mt-2 text-xs sm:text-base text-neutral-600 dark:text-neutral-400 font-normal">
            Every tool is engineered with precision to empower modern creators,
            growth marketers, and engineering teams.
          </p>
        </div>

        {/* Alternating Features List with 70px gap on desktop, 40px on mobile */}
        <div className="flex flex-col">
          {features.map((feat, idx) => {
            const isLeft = feat.side === "left";
            const isLast = idx === features.length - 1;

            return (
              <div
                key={feat.id}
                data-side={feat.side}
                className={`feature-row-item w-full flex flex-col ${
                  isLeft ? "lg:items-start" : "lg:items-end"
                } ${!isLast ? "mb-10 sm:mb-[70px]" : ""}`}
              >
                {/*
                  Container bounded by the center line on desktop:
                  - Left items span from left up to the center line (max-w-[48%] on desktop)
                  - Right items span from center line to right edge (max-w-[48%] on desktop)
                */}
                <div className="w-full lg:max-w-[48%] rounded-2xl bg-[#FFFDF9] dark:bg-[#121216] border border-[#E7DFD5] dark:border-white/10 shadow-xl overflow-hidden p-4 sm:p-7 flex flex-col sm:flex-row gap-4 sm:gap-6 items-center justify-between transition-all hover:border-[#DDD1C4] dark:hover:border-white/20">
                  {/* Left-oriented layout */}
                  {isLeft ? (
                    <>
                      {/* Image Preview */}
                      <div className="w-full sm:w-[48%] h-44 sm:h-52 rounded-xl overflow-hidden bg-[#F2ECE4] dark:bg-black/40 relative shrink-0 border border-[#E7DFD5] dark:border-white/10">
                        <Image
                          src={feat.image}
                          alt={feat.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover transition-transform duration-500 hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>

                      {/* Text Content + Right Arrow */}
                      <div className="flex-1 flex flex-col justify-between h-full space-y-2.5 w-full">
                        <div>
                          <span className="text-[11px] font-mono text-[#0080ff] md:text-[#ff6600] font-semibold block mb-1">
                            0{feat.id}. {feat.subtitle}
                          </span>
                          <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-white leading-snug">
                            <Link
                              href={`/docs/${feat.docSlug}`}
                              className="hover:text-[#ff6600] transition-colors"
                            >
                              {feat.title}
                            </Link>
                          </h3>
                          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed font-normal">
                            {feat.description}
                          </p>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <Link
                            href={`/docs/${feat.docSlug}`}
                            className="w-8 h-8 rounded-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-[#0080ff] md:hover:border-[#ff6600] flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-[#0080ff] md:hover:text-[#ff6600] shadow-sm transition-all hover:scale-110 active:scale-95 cursor-pointer group/btn"
                            title={`Read documentation: ${feat.title}`}
                            aria-label={`Read documentation: ${feat.title}`}
                          >
                            <ArrowRight className="w-4 h-4 text-[#0080ff] md:text-[#ff6600] transition-transform group-hover/btn:translate-x-0.5" />
                          </Link>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Text Content + Left Arrow */}
                      <div className="order-2 sm:order-1 flex-1 flex flex-col justify-between h-full space-y-2.5 w-full">
                        <div>
                          <span className="text-[11px] font-mono text-[#0080ff] md:text-[#ff6600] font-semibold block mb-1">
                            0{feat.id}. {feat.subtitle}
                          </span>
                          <h3 className="text-base sm:text-lg font-medium text-neutral-900 dark:text-white leading-snug">
                            <Link
                              href={`/docs/${feat.docSlug}`}
                              className="hover:text-[#ff6600] transition-colors"
                            >
                              {feat.title}
                            </Link>
                          </h3>
                          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1.5 leading-relaxed font-normal">
                            {feat.description}
                          </p>
                        </div>

                        <div className="pt-2 flex justify-start">
                          <Link
                            href={`/docs/${feat.docSlug}`}
                            className="w-8 h-8 rounded-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 hover:border-[#0080ff] md:hover:border-[#ff6600] flex items-center justify-center text-neutral-700 dark:text-neutral-300 hover:text-[#0080ff] md:hover:text-[#ff6600] shadow-sm transition-all hover:scale-110 active:scale-95 cursor-pointer group/btn"
                            title={`Read documentation: ${feat.title}`}
                            aria-label={`Read documentation: ${feat.title}`}
                          >
                            <ArrowLeft className="w-4 h-4 text-[#0080ff] md:text-[#ff6600] transition-transform group-hover/btn:-translate-x-0.5" />
                          </Link>
                        </div>
                      </div>

                      {/* Image Preview */}
                      <div className="order-1 sm:order-2 w-full sm:w-[48%] h-44 sm:h-52 rounded-xl overflow-hidden bg-[#F2ECE4] dark:bg-black/40 relative shrink-0 border border-[#E7DFD5] dark:border-white/10">
                        <Image
                          src={feat.image}
                          alt={feat.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover transition-transform duration-500 hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
