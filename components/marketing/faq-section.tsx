"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { SectionRailFrame } from "@/components/marketing/swiss-frame";

const FAQ_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const FAQS = [
  {
    q: "Is LShorter really free? Do I need a credit card?",
    a: "Yes. Our Starter plan is free forever with no credit card required. It includes 50 permanent active links, 10,000 tracked clicks per month, 3 custom branded domains with automatic SSL, basic QR Code Studio styles, and 30-day real-time analytics. Smart Routing, password protection, webhooks, and retargeting pixels unlock starting on Pro.",
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
    a: "LShorter does not drop third-party ad tracking cookies on your visitors. Redirect telemetry runs on Cloudflare's global edge network (under 12ms across 310+ PoPs) with masked IP handling, and live revenue attribution works via a first-party click token (qk_cid) or server-side webhooks.",
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

          {/* Right Borderless Hairline Accordion (Silky Framer Motion Open/Close) */}
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
                    <span
                      className={`text-[15.5px] sm:text-[16.5px] font-medium leading-[1.4] transition-colors duration-300 ${
                        isOpen
                          ? "text-[#0066FF] dark:text-[#6CA8FF]"
                          : "text-[#09090B] dark:text-white group-hover:text-[#0066FF] dark:group-hover:text-[#6CA8FF]"
                      }`}
                    >
                      {item.q}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`relative w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 transition-colors duration-300 ${
                        isOpen
                          ? "text-[#0066FF] dark:text-[#6CA8FF]"
                          : "text-[#52525B] dark:text-zinc-400 group-hover:text-[#0066FF] dark:group-hover:text-[#6CA8FF]"
                      }`}
                    >
                      <span className="block w-3.5 h-[1.5px] rounded-full bg-current" />
                      <motion.span
                        initial={false}
                        animate={{
                          rotate: isOpen ? 90 : 0,
                          opacity: isOpen ? 0 : 1,
                          scaleY: isOpen ? 0.2 : 1,
                        }}
                        transition={{ duration: 0.42, ease: FAQ_EASE }}
                        className="absolute block w-[1.5px] h-3.5 rounded-full bg-current"
                      />
                    </span>
                  </button>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="faq-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: {
                            height: { duration: 0.48, ease: FAQ_EASE },
                            opacity: { duration: 0.36, delay: 0.06, ease: FAQ_EASE },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.42, ease: FAQ_EASE },
                            opacity: { duration: 0.26, ease: FAQ_EASE },
                          },
                        }}
                        className="overflow-hidden will-change-[height,opacity]"
                      >
                        <motion.p
                          initial={{ y: -6 }}
                          animate={{
                            y: 0,
                            transition: { duration: 0.44, ease: FAQ_EASE },
                          }}
                          exit={{
                            y: -6,
                            transition: { duration: 0.34, ease: FAQ_EASE },
                          }}
                          className="pb-5 pr-8 text-[14.5px] text-[#52525B] dark:text-zinc-400 leading-[1.7] text-pretty"
                        >
                          {item.a}
                        </motion.p>
                      </motion.div>
                    )}
                  </AnimatePresence>
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
