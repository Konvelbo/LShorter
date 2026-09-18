"use client";

import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";

const faqs = [
  {
    id: "item-1",
    question: "How do I create my first short link?",
    answer:
      "Simply paste your target URL into the input field, choose a custom slug if desired (e.g., lshorter.com/r/my-link), and click Generate. Your link is instantly deployed to our global Edge network and ready to share.",
  },
  {
    id: "item-2",
    question: "How does percentage-based traffic routing work?",
    answer:
      "Percentage-based routing allows you to configure multiple destination URLs for a single short link and set the traffic weight for each variant (e.g., 70% to Page A and 30% to Page B). Splitting occurs at Cloudflare Edge locations with zero latency and no visible bounce.",
  },
  {
    id: "item-3",
    question: "Can I protect links with a password or PIN code?",
    answer:
      "Yes. You can assign a secret passcode or PIN code to any link. When visitors click, a secure validation screen prompts for the code before executing the redirect. Ideal for confidential company files, courses, or VIP releases.",
  },
  {
    id: "item-4",
    question: "Are analytics available in real time?",
    answer:
      "Yes. Every visit instantly records privacy-friendly redirect telemetry (country of origin, device category, OS, and browser). Your dashboard metrics, live stream, and 3D globe update continuously with 100% GDPR compliance and zero third-party cookies.",
  },
  {
    id: "item-5",
    question: "Does LShorter offer a developer API & SDK?",
    answer:
      "Absolutely. LShorter provides a comprehensive, documented REST API. You can generate API keys in your settings to create, edit, list links, and fetch analytics directly from your own apps, automation scripts, and webhooks.",
  },
  {
    id: "item-6",
    question: "What happens if my link reaches its click limit?",
    answer:
      "If you configured a fallback URL (Forward URL), visitors are automatically rerouted there as soon as the threshold is reached. For your account, additional traffic beyond your plan limit is billed at $0.50 per 100,000 clicks, ensuring uninterrupted campaigns even during viral spikes.",
  },
];

export function FaqSection() {
  const headerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    if (headerRef.current) {
      gsap.fromTo(
        headerRef.current,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: headerRef.current,
            start: "top 90%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }

    if (cardRef.current) {
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 35, scale: 0.98 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.75,
          ease: "power2.out",
          scrollTrigger: {
            trigger: cardRef.current,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        }
      );
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === headerRef.current || st.trigger === cardRef.current) {
          st.kill();
        }
      });
    };
  }, []);

  return (
    <section id="faq" className="relative py-16 sm:py-24 lg:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden bg-[#FAF7F2] dark:bg-[#09090b] transition-colors">
      {/* Background subtle radial ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-brand/5 dark:bg-brand/10 blur-[140px] rounded-full pointer-events-none" />

      <div className="max-w-4xl lg:max-w-5xl mx-auto relative z-10">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-10 sm:mb-14 flex flex-col items-center justify-center">
          <span className="text-[11px] font-mono text-brand uppercase tracking-widest font-semibold block mb-2 select-none">
            07. Frequently Asked Questions
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[40px] font-bold tracking-tight text-neutral-900 dark:text-white leading-tight">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-xs sm:text-sm md:text-base text-neutral-600 dark:text-neutral-400 max-w-lg leading-relaxed">
            Everything you need to know about getting the most out of LShorter.
          </p>
        </div>

        {/* Interactive Accordion Card */}
        <div
          ref={cardRef}
          className="relative rounded-[22px] sm:rounded-[28px] lg:rounded-[32px] bg-[#FFFDF9] dark:bg-[#141418] border border-[#E7DFD5] dark:border-white/10 shadow-[0_20px_50px_-12px_rgba(43,37,32,0.12)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] p-6 sm:p-8 md:p-10 lg:p-12 overflow-hidden transition-all duration-300 hover:border-[#DDD1C4] dark:hover:border-white/20"
        >
          {/* Top subtle brand accent gradient highlight */}
          <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-brand/40 to-transparent pointer-events-none" />

          <Accordion type="single" defaultValue="item-1" className="divide-y divide-[#E7DFD5]/80 dark:divide-white/5">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id} className="py-2 sm:py-2.5">
                <AccordionTrigger className="text-sm sm:text-base md:text-lg font-semibold py-3.5 sm:py-4.5 hover:no-underline text-neutral-900 dark:text-neutral-100">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-xs sm:text-sm md:text-[15px] leading-relaxed text-neutral-600 dark:text-neutral-300 pb-3 sm:pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
