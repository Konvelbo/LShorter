"use client";

import React, { useState, useRef, useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Plus, Minus } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const FAQS = [
  {
    q: "How does LShorter's geographic routing and telemetry work?",
    a: "LShorter evaluates ISO 3166-1 alpha-2 country routing rules (geoTargeting), device/OS rules (ios, android, desktop), and weighted A/B variations directly at redirect time. Simultaneously, our asynchronous telemetry engine logs the visitor's Continent, Country, City, Device, Browser, and Referrer with zero redirect delay.",
  },
  {
    q: "Can we connect our own custom branded domains and verify DNS?",
    a: "Yes. Add your custom domain (e.g., go.yourbrand.com) in the Custom Domains dashboard, configure the CNAME / TXT record, and click Verify DNS. Once verified, any short link can be published on your branded domain with automatic TLS.",
  },
  {
    q: "How does revenue attribution connect short link clicks to customer purchases?",
    a: "When a visitor clicks an LShorter link, a first-party click identifier (qk_cid) is generated. Your checkout or backend calls POST /api/v1/conversions (or lshorter.track.conversion) with the clickId, amount, customerEmail, and customerAvatar—attributing exact revenue and EPC back to the originating slug.",
  },
  {
    q: "How do PathLock™ PIN protection, click limits, and destination masking work?",
    a: "Every link supports an optional PIN/password challenge, an expiration timestamp (expiresAt) or maximum click cap (maxClicks), and zero-referrer iframe destination masking with custom page title and favicon.",
  },
  {
    q: "Can we export all click telemetry, geographic data, and revenue logs?",
    a: "Yes. Every dashboard view—Analytics Overview, Geo Analytics, Customers & Revenue, Live Click Stream, and Short Links—includes one-click CSV Export alongside full JSON access via /api/v1/analytics/overview and /api/v1/analytics/geo.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!sectionRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".faq-scroll-reveal",
        { opacity: 0, y: 24 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          stagger: 0.06,
          ease: "power3.out",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 85%",
            end: "bottom 10%",
            toggleActions: "play reverse play reverse",
          },
        }
      );
    }, sectionRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="faq"
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] py-14 sm:py-20 lg:py-24 border-t border-[#E4E7EC] dark:border-white/10 transition-colors duration-300"
    >
      <div className="w-full max-w-[1340px] mx-auto px-4 sm:px-8">
        <div className="faq-scroll-reveal grid grid-cols-1 lg:grid-cols-12 gap-10 sm:gap-14 lg:gap-16 items-start">
          {/* Left Header */}
          <div className="lg:col-span-5 flex flex-col justify-start pt-2">
            <h2 className="text-[28px] xs:text-[32px] sm:text-[40px] md:text-[46px] font-normal tracking-[-0.035em] leading-[1.1] mb-3 sm:mb-4">
              <span className="text-[#101828] dark:text-white block">
                Questions,
              </span>
              <span className="text-[#667085] dark:text-zinc-400 block mt-1">
                answered clearly.
              </span>
            </h2>
            <p className="text-[14px] sm:text-[15.5px] text-[#667085] dark:text-zinc-400 leading-[1.6] max-w-[420px]">
              Everything engineering, growth, and security teams ask before migrating their link infrastructure to LShorter.
            </p>
          </div>

          {/* Right Accordion with Balanced Sizing and Elegant Spacing */}
          <div className="lg:col-span-7 border-t border-[#E4E7EC] dark:border-white/15">
            {FAQS.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={idx}
                  className="border-b border-[#E4E7EC] dark:border-white/15"
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full py-4.5 sm:py-5 md:py-5.5 flex items-center justify-between gap-4 text-left group cursor-pointer"
                  >
                    <span className="text-[15.5px] sm:text-[17px] md:text-[18px] font-medium text-[#101828] dark:text-white tracking-[-0.015em] leading-[1.35] group-hover:text-[#0066FF] dark:group-hover:text-[#5294FF] transition-colors">
                      {item.q}
                    </span>
                    <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#F2F4F7] dark:bg-white/10 flex items-center justify-center shrink-0 text-[#101828] dark:text-white transition-all duration-200 group-hover:scale-105 group-hover:bg-[#0066FF]/10 dark:group-hover:bg-[#0066FF]/20 group-hover:text-[#0066FF] dark:group-hover:text-[#5294FF]">
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pb-5 sm:pb-6 pr-4 sm:pr-8 text-[13.5px] sm:text-[14.5px] text-[#475467] dark:text-zinc-300 leading-[1.7] animate-in fade-in duration-200">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

export default FaqSection;
