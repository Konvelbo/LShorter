"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus } from "lucide-react";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
  SwissSectionIndex,
} from "@/components/marketing/swiss-frame";

const FAQS = [
  {
    q: "Is LShorter really free? Do I need a credit card?",
    a: "Yes. Our Starter plan is free forever with no credit card required. It includes 50 permanent active links, 10,000 tracked clicks per month, up to 3 custom branded domains with automatic SSL, PathLock™ PIN protection, and our Dynamic QR Code Studio.",
  },
  {
    q: "What happens to links I shorten without creating an account?",
    a: "You can shorten up to 2 links immediately from the homepage with live click tracking. Unclaimed guest links stay active for 3 days. As soon as you create a free account (or sign in), those links and all clicks they already received are automatically transferred to your dashboard and become permanent.",
  },
  {
    q: "What is PathLock™ and how is it different from a normal password?",
    a: "A standard link password only checks access once before redirecting. PathLock™ goes further: it locks visitors strictly inside the URL prefix you authorize (for example /app/dashboard/*). If a beta tester or client tries to navigate into unfinished or private routes of your SaaS, access is intercepted and blocked unless they enter a team unlock password.",
  },
  {
    q: "What happens if my links exceed my monthly click quota?",
    a: "On the free Starter plan, links pause once you hit 10,000 clicks in a billing month. On Pro (150,000 included clicks/mo) and Business (500,000 included clicks/mo), your redirects are never interrupted — excess traffic is seamlessly handled via transparent metered overage.",
  },
  {
    q: "Can I use my own custom domain and how long does DNS setup take?",
    a: "Yes. Even the free Starter plan includes 3 custom domains. Add your domain (such as go.yourbrand.io) from the dashboard, point a single CNAME record at your registrar (Namecheap, Cloudflare, GoDaddy, etc.), and LShorter automatically verifies DNS and provisions edge SSL certificates within minutes.",
  },
  {
    q: "How does LShorter handle privacy, GDPR, and revenue attribution?",
    a: "LShorter does not drop third-party ad tracking cookies on your visitors. Redirect telemetry runs on Cloudflare's global edge network (< 12ms across 310+ PoPs) with masked IP handling, and Stripe revenue attribution works via a first-party click token (qk_cid) or server-side webhooks.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="w-full bg-[#F7F8FA] dark:bg-[#0B0C10] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24 overflow-x-clip"
    >
      <SectionRailFrame className="px-4 sm:px-8 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start"
        >
          {/* Sticky Left Architectural Rail */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 flex flex-col justify-start">
            <SwissSectionIndex index="09" label="FAQ" meta="DIRECT ANSWERS" />
            <h2 className="mt-4 text-[30px] sm:text-[40px] font-bold tracking-[-0.04em] leading-[1.06] text-[#09090B] dark:text-white">
              Questions teams ask before migrating
            </h2>
            <p className="mt-4 text-[14.5px] text-[#475467] dark:text-zinc-400 leading-[1.65] max-w-[400px]">
              Everything founders, marketers, and developers check before moving
              production links onto LShorter.
            </p>
          </div>

          {/* Right Hairline Accordion (strictly rounded-[10px] container) */}
          <div className="lg:col-span-7 rounded-[10px] border border-[#D0D5DD] dark:border-white/14 bg-white dark:bg-[#0E0F13] divide-y divide-[#E4E7EC] dark:divide-white/[0.08] overflow-hidden">
            {FAQS.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={item.q}
                  className={`transition-colors duration-200 ${
                    isOpen ? "bg-[#0066FF]/[0.02] dark:bg-[#0066FF]/[0.05]" : ""
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full px-5 sm:px-6 py-4.5 flex items-center justify-between gap-4 text-left group cursor-pointer"
                  >
                    <span className="flex items-baseline gap-3 min-w-0">
                      <span className="font-mono text-[11px] font-bold text-[#0066FF] dark:text-[#5294FF] tabular-nums shrink-0">
                        0{idx + 1}
                      </span>
                      <span className="text-[15px] sm:text-[16px] font-semibold text-[#09090B] dark:text-white tracking-[-0.015em] leading-[1.35] group-hover:text-[#0066FF] dark:group-hover:text-[#5294FF] transition-colors">
                        {item.q}
                      </span>
                    </span>
                    <span
                      className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 border transition-colors duration-200 ${
                        isOpen
                          ? "bg-[#0066FF] border-[#0066FF] text-white"
                          : "bg-[#F7F8FA] dark:bg-white/[0.05] border-[#E4E7EC] dark:border-white/10 text-[#475467] dark:text-zinc-300 group-hover:border-[#0066FF]/50 group-hover:text-[#0066FF]"
                      }`}
                    >
                      {isOpen ? (
                        <Minus className="w-3.5 h-3.5" />
                      ) : (
                        <Plus className="w-3.5 h-3.5" />
                      )}
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 sm:px-6 pl-12 pb-5 pr-8 text-[14px] text-[#475467] dark:text-zinc-300 leading-[1.7]">
                          {item.a}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </motion.div>
      </SectionRailFrame>
    </section>
  );
}

export default FaqSection;
