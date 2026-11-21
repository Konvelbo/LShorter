"use client";

import React from "react";
import Link from "next/link";
import { Check, ExternalLink, Lock } from "lucide-react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import {
  SectionRailFrame,
  JargonTooltip,
  scrollToHeroShortener,
} from "@/components/marketing/swiss-frame";
import {
  PathLockInteractiveSimulator,
} from "@/components/marketing/interactive-simulators";
import {
  FeatureUIRow,
  ChecklistVisual,
  TimelineVisual,
  VideoTutorialVisual,
} from "@/components/ui/feature-ui-row";

export {
  DifferenceSection,
  UseCasesSection,
  DeveloperApiSection,
  PricingPreviewSection,
} from "@/components/marketing/landing-sections-bottom";

const NAMECHEAP_AFFILIATE_URL =
  process.env.NEXT_PUBLIC_NAMECHEAP_AFFILIATE_LINK ||
  "https://namecheap.pxf.io/c/7999167/386170/5618";

function NamecheapLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Namecheap"
    >
      <path
        d="M11.1 10.6c-.9-1.5-2.9-1.9-4.4-1-.4.2-.8.6-1 1L2.2 16.5c-.6 1-.6 2.3 0 3.3l1.7 2.8c.5.9 1.7 1.2 2.6.6.3-.2.5-.4.6-.7l4-6.9 4.2 7.1c.9 1.5 2.9 1.9 4.4 1 .4-.2.8-.6 1-1l3.5-5.9c.6-1 .6-2.3 0-3.3l-1.7-2.8c-.5-.9-1.7-1.2-2.6-.6-.3.2-.5.4-.6.7l-4 6.9-4.2-7.1Z"
        fill="#DE3723"
      />
      <path
        d="M25.3 10.2c-.9-.5-2.1-.2-2.6.7l-3.9 6.8 2.4 4.1c.9 1.5 2.9 1.9 4.4 1 .4-.2.8-.6 1-1l3.2-5.4c.6-1 .6-2.3 0-3.3l-1.6-2.7c-.6-.9-1.9-1-2.9-.2Z"
        fill="#FF5C35"
      />
    </svg>
  );
}

// ============================================================================
// 1. TRUST STRIP (Docked inside HeroSection — kept as empty export for page.tsx)
// ============================================================================
export function TrustStripSection() {
  return null;
}

// ============================================================================
// 2. HOW IT WORKS (Clean 3-Column Hairline Sequence)
// ============================================================================
export function HowItWorksSection() {
  const steps = [
    {
      num: "1",
      title: "Paste any destination URL",
      desc: "Drop in a landing page, app link, or staging URL and get a clean lsho.cc slug or custom branded link instantly.",
    },
    {
      num: "2",
      title: "Add routing and access rules",
      desc: "Target visitors by country, device, or weighted A/B split, cap total clicks, or lock private demos inside PathLock™.",
    },
    {
      num: "3",
      title: "Measure clicks and live revenue",
      desc: "Watch live redirects across 310+ Cloudflare PoPs and trace signups and attributed revenue back to each short link.",
    },
  ];

  return (
    <section className="w-full bg-[linear-gradient(180deg,rgba(99,51,238,0.13)_0%,rgba(245,243,255,0.65)_42%,#FFFFFF_100%)] dark:bg-[linear-gradient(180deg,rgba(99,51,238,0.20)_0%,#0B0C12_45%,#09090B_100%)] py-20 sm:py-24 transition-colors duration-300 overflow-x-clip">
      <SectionRailFrame>
        <div className="max-w-[620px] mb-12">
          <h2 className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.03em] leading-[1.1] text-[#09090B] dark:text-white text-balance">
            From raw URL to governed link in three steps
          </h2>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {steps.map((step) => (
            <li
              key={step.num}
              className="group relative flex flex-col cursor-default"
            >
              {/* Fine horizontal bar with 1.2s left-to-right blue fill on hover */}
              <div
                aria-hidden="true"
                className="relative w-full h-[1.5px] bg-[#6366F1]/25 dark:bg-white/[0.12] overflow-hidden"
              >
                <span className="how-step-bar-fill block h-full w-full bg-[#0066FF] dark:bg-[#3B82F6]" />
              </div>

              <div className="pt-6 flex flex-col">
                <span className="how-step-vivid-color font-mono text-[13px] font-semibold text-[#4F46E5]/65 dark:text-[#A5B4FC]/65 group-hover:text-[#0066FF] dark:group-hover:text-[#3B82F6] tabular-nums">
                  0{step.num}
                </span>
                <h3 className="how-step-vivid-color mt-3 text-[18px] font-semibold tracking-[-0.02em] text-[#09090B]/80 dark:text-white/80 group-hover:text-[#0047FF] dark:group-hover:text-[#60A5FA]">
                  {step.title}
                </h3>
                <p className="how-step-vivid-color mt-2.5 text-[14.5px] leading-[1.6] text-[#52525B]/80 dark:text-zinc-400/80 group-hover:text-[#09090B] dark:group-hover:text-white text-pretty">
                  {step.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 3. CORE PLATFORM FEATURES (#features — Alternating FeatureUIRow Showcase)
// ============================================================================
export function FeaturesBentoSection() {
  return (
    <section
      id="features"
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] py-24 sm:py-32 border-t border-[#F1F2F6] dark:border-white/[0.06] scroll-mt-20 overflow-x-clip transition-colors duration-300"
    >
      <SectionRailFrame>
        {/* Centered Header */}
        <div className="max-w-[680px] mx-auto text-center mb-16 sm:mb-24">
          <h2 className="text-[32px] sm:text-[44px] font-bold tracking-[-0.035em] leading-[1.08] text-[#09090B] dark:text-white text-balance">
            Everything a link needs before and after the click.
          </h2>
          <p className="mt-4 text-[15.5px] sm:text-[16.5px] text-[#52525B] dark:text-zinc-400 leading-[1.6] max-w-[540px] mx-auto text-pretty">
            Built on Cloudflare&apos;s{" "}
            <JargonTooltip
              term="edge network"
              explanation="Your redirect executes on whichever of 310+ global Cloudflare servers is physically closest to the visitor, keeping response time under 12ms."
            />{" "}
            so routing, access control, and analytics run without slowing the
            redirect down.
          </p>
        </div>

        {/* 6 Alternating FeatureUIRow Blocks — Exact 6 Core Capabilities */}
        <div className="flex flex-col gap-20 sm:gap-28">
          {/* 1. Smart Geo, Device & A/B Routing */}
          <FeatureUIRow
            tone="royal"
            eyebrow="01 · Smart Routing"
            title="Smart Geo, Device & A/B Routing"
            body="Send one short link to different destinations based on country, mobile OS, browser, or a weighted split test."
            cta={{ label: "Explore routing rules", href: "/docs/geo-routing" }}
            visual={
              <VideoTutorialVisual
                src="/videos/tutorials/05-Analytics-Geography.mp4"
                poster="/videos/tutorials/05-Analytics-Geography-poster.jpg"
                label="Geography & Device Telemetry"
                ariaLabel="LShorter Geography and Device Analytics tutorial clip"
              />
            }
          />

          {/* 2. Click Caps & Scheduled Expiry */}
          <FeatureUIRow
            reverse
            tone="night"
            eyebrow="02 · Link Lifecycle"
            title="Click Caps & Scheduled Expiry"
            body="Automatically deactivate invite links or route visitors to a waitlist once a click limit or expiration date is reached."
            cta={{
              label: "See expiry & caps docs",
              href: "/docs/click-limits-and-expiration",
            }}
            visual={
              <TimelineVisual
                title="Private beta link lifecycle"
                total={500}
                totalLabel="500 clicks cap"
                stages={[
                  { label: "Open invites (320)", value: 320 },
                  { label: "Final cap (180)", value: 180 },
                ]}
                ticks={["0", "100", "200", "300", "400", "500"]}
                badgeLabel="Then"
                note="Auto-deactivate or redirect visitors to your waitlist"
              />
            }
          />

          {/* 3. Live Revenue & Pixel Attribution */}
          <FeatureUIRow
            tone="royal"
            eyebrow="03 · Revenue Attribution"
            title="Live Revenue & Pixel Attribution"
            body={
              <>
                Connect{" "}
                <JargonTooltip
                  term="first-party attribution"
                  explanation="LShorter passes a first-party click token (qk_cid) through to your checkout webhook without dropping third-party ad cookies."
                />{" "}
                to track real-time revenue and fire Meta, Google, or TikTok
                pixels on redirect.
              </>
            }
            cta={{
              label: "Explore revenue tracking",
              href: "/docs/conversion-tracking-amount-count",
            }}
            visual={
              <VideoTutorialVisual
                src="/videos/tutorials/06-Analytics-Revenue.mp4"
                poster="/videos/tutorials/06-Analytics-Revenue-poster.jpg"
                label="Live Revenue Attribution"
                ariaLabel="LShorter Live Revenue Attribution tutorial clip"
              />
            }
          />

          {/* 4. Dynamic Vector QR Studio */}
          <FeatureUIRow
            reverse
            tone="night"
            eyebrow="04 · Dynamic QR Studio"
            title="Dynamic Vector QR Studio"
            body="15 pixel styles, custom brand gradients, SVG, PNG & animated GIF exports, and editable destinations even after printing."
            cta={{
              label: "Explore QR Studio docs",
              href: "/docs/dynamic-qr-codes",
            }}
            visual={
              <VideoTutorialVisual
                src="/videos/tutorials/10-QR-Studio.mp4"
                poster="/videos/tutorials/10-QR-Studio-poster.jpg"
                label="QR Studio · Logos & Frames"
                ariaLabel="LShorter Dynamic Vector QR Studio tutorial clip"
              />
            }
          />

          {/* 5. Custom Branded Domains & Auto SSL */}
          <FeatureUIRow
            tone="royal"
            eyebrow="05 · Branded Domains · 3 free included"
            title="Custom Branded Domains & Auto SSL"
            body={
              <>
                Replace generic domains with{" "}
                <code className="font-mono text-[13px] px-1.5 py-0.5 rounded-[6px] bg-[#F4F5F8] dark:bg-white/[0.07] text-[#09090B] dark:text-zinc-200 border border-black/[0.06] dark:border-white/[0.08]">
                  go.yourbrand.io
                </code>
                . Point a single CNAME record and LShorter provisions edge SSL
                automatically.
              </>
            }
            cta={{ label: "Connect a custom domain", href: "/register" }}
            extraContent={
              <div className="rounded-[10px] bg-[#F8F9FC] dark:bg-[#111218] border border-[#E7E9F2] dark:border-white/[0.08] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-[8px] bg-white dark:bg-white/[0.06] border border-[#E7E9F2] dark:border-white/[0.10] flex items-center justify-center shrink-0">
                    <NamecheapLogo className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[12.5px] font-semibold text-[#09090B] dark:text-white">
                      Need a short branded domain?
                    </div>
                    <p className="text-[11.5px] text-[#71717A] dark:text-zinc-400 mt-0.5">
                      Partner registrar —{" "}
                      <span className="font-mono text-[#09090B] dark:text-zinc-200">
                        .co
                      </span>
                      ,{" "}
                      <span className="font-mono text-[#09090B] dark:text-zinc-200">
                        .io
                      </span>{" "}
                      &amp;{" "}
                      <span className="font-mono text-[#09090B] dark:text-zinc-200">
                        .cc
                      </span>{" "}
                      with free DNS.
                    </p>
                  </div>
                </div>

                <a
                  href={NAMECHEAP_AFFILIATE_URL}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-[8px] bg-[#09090B] hover:bg-[#0066FF] dark:bg-white dark:hover:bg-[#0066FF] text-white dark:text-[#09090B] dark:hover:text-white text-[12px] font-semibold transition-colors whitespace-nowrap shrink-0"
                >
                  <span>Namecheap</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            }
            visual={
              <VideoTutorialVisual
                src="/videos/tutorials/11-Custom-Domains.mp4"
                poster="/videos/tutorials/11-Custom-Domains-poster.jpg"
                label="Custom Domains & Edge SSL"
                ariaLabel="LShorter Custom Branded Domains tutorial clip"
              />
            }
          />

          {/* 6. Password Protection & Branded Masking */}
          <FeatureUIRow
            reverse
            tone="night"
            eyebrow="06 · Access & Masking"
            title="Password Protection & Branded Masking"
            body="Protect confidential decks behind a password challenge, strip referrer headers, and customize OpenGraph social previews."
            cta={{ label: "Explore access & masking", href: "/docs/url-masking" }}
            visual={
              <ChecklistVisual
                title="Protected link · lsho.cc/q4-deck"
                rows={[
                  { label: "Password verification", value: "SHA-256" },
                  { label: "Referrer header", value: "Stripped" },
                  { label: "Destination URL", value: "Masked" },
                  { label: "OpenGraph card", value: "Custom preview" },
                ]}
                stat={{
                  value: 100,
                  suffix: "%",
                  label: "Edge-enforced link privacy",
                }}
              />
            }
          />
        </div>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 4. SIGNATURE FOCUS: PATHLOCK™ PERIMETER SECURITY (#pathlock)
// ============================================================================
export function PathLockFocusSection() {
  return (
    <section
      id="pathlock"
      className="relative w-full bg-[#09090B] text-white py-24 sm:py-32 border-t border-white/[0.08] scroll-mt-20 overflow-x-clip"
    >
      <SectionRailFrame>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-5">
            <h2 className="text-[32px] sm:text-[42px] font-semibold tracking-[-0.03em] leading-[1.06] text-white text-balance">
              Expose{" "}
              <code className="font-mono text-[#6CA8FF] font-semibold">
                /app/dashboard/*
              </code>
              . Lock the rest of your app.
            </h2>

            <p className="mt-5 text-[15.5px] text-zinc-400 leading-[1.65] text-pretty">
              Sharing a staging SaaS or investor preview?{" "}
              <JargonTooltip
                term="PathLock™"
                darkSurface
                explanation="Unlike basic link passwords that stop working after the redirect, PathLock enforces an authorized URL prefix boundary while visitors browse your preview."
              />{" "}
              enforces a strict URL perimeter so visitors cannot wander into
              unfinished billing, admin, or settings pages.
            </p>

            <ul className="mt-7 space-y-3 text-[14.5px] text-zinc-300">
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#6CA8FF] shrink-0 mt-1" />
                <span>
                  Strict URL prefix enforcement blocks out-of-scope routes
                  immediately.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#6CA8FF] shrink-0 mt-1" />
                <span>
                  Optional team unlock password built directly into the gate.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="w-4 h-4 text-[#6CA8FF] shrink-0 mt-1" />
                <span>
                  Combines with Click Caps so private beta links close after N
                  visits.
                </span>
              </li>
            </ul>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <WaveRevealButton
                href="/#hero-shortener"
                onClick={scrollToHeroShortener}
                variant="primary"
                size="md"
                icon={<Lock className="w-4 h-4" />}
              >
                Protect a demo link
              </WaveRevealButton>

              <Link
                href="/docs/pin-protection"
                className="text-[14px] font-medium text-zinc-300 hover:text-white transition-colors"
              >
                Read PathLock docs
              </Link>
            </div>
          </div>

          <div className="lg:col-span-7">
            <PathLockInteractiveSimulator />
          </div>
        </div>
      </SectionRailFrame>
    </section>
  );
}
