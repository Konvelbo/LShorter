"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Plus, Minus } from "lucide-react";

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

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section
      id="faq"
      className="w-full bg-[#F8F9FA] dark:bg-[#0C0D10] py-20 sm:py-28 border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24"
    >
      <div className="w-full max-w-[1200px] mx-auto px-4 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start"
        >
          {/* Left Header */}
          <div className="lg:col-span-5 flex flex-col justify-start">
            <span className="inline-flex items-center self-start px-3 py-1 rounded-[8px] bg-[#0066FF]/[0.08] dark:bg-[#0066FF]/[0.16] border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] text-[12px] font-semibold uppercase tracking-wide mb-4">
              FAQ
            </span>
            <h2 className="text-[28px] sm:text-[40px] font-bold tracking-[-0.035em] leading-[1.08] mb-3.5 text-[#101828] dark:text-white">
              Practical questions,{" "}
              <span className="text-[#667085] dark:text-zinc-400 font-medium block mt-1">
                answered clearly.
              </span>
            </h2>
            <p className="text-[14.5px] text-[#475467] dark:text-zinc-400 leading-[1.65] max-w-[400px]">
              Everything founders, marketers, and developers ask before moving
              their links to LShorter.
            </p>
          </div>

          {/* Right Accordion (strictly rounded-[10px] items) */}
          <div className="lg:col-span-7 space-y-2.5">
            {FAQS.map((item, idx) => {
              const isOpen = openIndex === idx;
              return (
                <div
                  key={item.q}
                  className={`rounded-[10px] border transition-colors duration-200 overflow-hidden ${
                    isOpen
                      ? "bg-white dark:bg-[#111216] border-[#0066FF]/40 shadow-2xs"
                      : "bg-white/80 dark:bg-[#111216]/70 border-[#E4E7EC] dark:border-white/10 hover:border-[#D0D5DD] dark:hover:border-white/20"
                  }`}
                >
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full px-5 py-4 flex items-center justify-between gap-4 text-left group cursor-pointer"
                  >
                    <span className="text-[15px] sm:text-[16px] font-semibold text-[#101828] dark:text-white tracking-[-0.015em] leading-[1.35] group-hover:text-[#0066FF] dark:group-hover:text-[#5294FF] transition-colors">
                      {item.q}
                    </span>
                    <span
                      className={`w-7 h-7 rounded-[8px] flex items-center justify-center shrink-0 transition-colors duration-200 ${
                        isOpen
                          ? "bg-[#0066FF] text-white"
                          : "bg-[#F2F4F7] dark:bg-white/[0.08] text-[#475467] dark:text-zinc-300 group-hover:text-[#0066FF]"
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
                        <div className="px-5 pb-5 pr-8 text-[14px] text-[#475467] dark:text-zinc-300 leading-[1.7]">
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
      </div>
    </section>
  );
}

export default FaqSection;
