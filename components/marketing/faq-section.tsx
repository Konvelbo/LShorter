"use client";

import React, { useState } from "react";
import { Plus, Minus } from "lucide-react";
import { SectionRailFrame } from "@/components/marketing/swiss-frame";

const FAQS = [
  {
    q: "Is LShorter really free? Do I need a credit card?",
    a: "Yes. Our Starter plan is free forever with no credit card required. It includes 50 permanent active links, 10,000 tracked clicks per month, 3 custom branded domains with automatic SSL, basic QR Code Studio styles, and 30-day real-time analytics. Smart Routing, PIN protection, webhooks, and retargeting pixels unlock starting on Pro.",
  },
  {
    q: "What happens to links I shorten without creating an account?",
    a: "You can shorten up to 2 links immediately from the homepage with live click tracking. Unclaimed guest links stay active for 3 days. As soon as you create a free account or sign in, those links and their existing clicks automatically transfer to your dashboard and become permanent.",
  },
  {
    q: "What is PathLock™ and how is it different from a normal password?",
    a: "A standard link password only checks access once before redirecting. PathLock™ locks visitors strictly inside the URL prefix you authorize (such as /app/dashboard/*). If someone tries to navigate into unfinished or private routes, access is intercepted unless they enter a team unlock password.",
  },
  {
    q: "What happens if my links exceed my monthly click quota?",
    a: "On the free Starter plan, links pause once you hit 10,000 clicks in a billing month. On Pro (150,000 clicks/month) and Business (500,000 clicks/month), redirects never pause — excess traffic is handled via transparent metered overage.",
  },
  {
    q: "Can I use my own custom domain and how long does DNS setup take?",
    a: "Yes. Even the free Starter plan includes 3 custom domains. Add your domain (such as go.yourbrand.io) from the dashboard, point a single CNAME record at your registrar, and LShorter verifies DNS and provisions edge SSL within minutes.",
  },
  {
    q: "How does LShorter handle privacy, GDPR, and revenue attribution?",
    a: "LShorter does not drop third-party ad tracking cookies on your visitors. Redirect telemetry runs on Cloudflare's global edge network (under 12ms across 310+ PoPs) with masked IP handling, and Stripe revenue attribution works via a first-party click token (qk_cid) or server-side webhooks.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] py-24 sm:py-32 border-t border-[#E4E7EC] dark:border-white/[0.08] scroll-mt-20 overflow-x-clip transition-colors duration-300"
    >
      <SectionRailFrame>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-start">
          {/* Sticky Left Heading */}
          <div className="lg:col-span-5 lg:sticky lg:top-28">
            <h2 className="text-[30px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-[1.08] text-[#09090B] dark:text-white text-balance">
              Questions teams ask before switching
            </h2>
            <p className="mt-4 text-[15px] text-[#52525B] dark:text-zinc-400 leading-[1.6] max-w-[380px]">
              Clear answers on free limits, guest links, PathLock™ boundaries,
              custom domains, and privacy.
            </p>
          </div>

          {/* Right Borderless Hairline Accordion (60fps CSS Grid 0fr -> 1fr transition) */}
          <div className="lg:col-span-7 border-t border-[#E4E7EC] dark:border-white/[0.09] divide-y divide-[#E4E7EC] dark:divide-white/[0.09]">
            {FAQS.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div key={item.q}>
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full py-5 flex items-center justify-between gap-4 text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-2 rounded-[6px]"
                  >
                    <span className="text-[15.5px] sm:text-[16.5px] font-medium text-[#09090B] dark:text-white leading-[1.4] group-hover:text-[#0066FF] dark:group-hover:text-[#6CA8FF] transition-colors">
                      {item.q}
                    </span>
                    <span className="w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 text-[#52525B] dark:text-zinc-400 group-hover:text-[#0066FF] dark:group-hover:text-[#6CA8FF] transition-colors">
                      {isOpen ? (
                        <Minus className="w-4 h-4" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )}
                    </span>
                  </button>

                  {/* 60fps CSS Grid height animation (no JS layout measurement, no height: auto jank) */}
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-250 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                      isOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden min-h-0">
                      <p className="pb-5 pr-8 text-[14.5px] text-[#52525B] dark:text-zinc-400 leading-[1.7] text-pretty">
                        {item.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </SectionRailFrame>
    </section>
  );
}

export default FaqSection;
