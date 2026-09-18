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
            start: "top 88%",
            end: "bottom 12%",
            toggleActions: "play reverse play reverse",
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
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play reverse play reverse",
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
    <section id="faq" className="relative py-14 sm:py-20 px-4 sm:px-6 overflow-hidden">
      <div className="max-w-2xl mx-auto">
        {/* Section Header */}
        <div ref={headerRef} className="text-center mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-[24px] font-medium tracking-tight text-neutral-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="mt-1.5 text-xs sm:text-[13.5px] text-neutral-600 dark:text-neutral-400">
            Everything you need to know about getting the most out of LShorter.
          </p>
        </div>

        {/* Interactive Accordion */}
        <div ref={cardRef} className="rounded-2xl bg-[#FFFDF9] dark:bg-[#121216] border border-[#E7DFD5] dark:border-white/10 shadow-xl p-4 sm:p-6">
          <Accordion type="single" defaultValue="item-1">
            {faqs.map((faq) => (
              <AccordionItem key={faq.id} value={faq.id}>
                <AccordionTrigger className="text-xs sm:text-sm">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-[11.5px] sm:text-[12.5px] leading-relaxed text-neutral-600 dark:text-neutral-400">{faq.answer}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
