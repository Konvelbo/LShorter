"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, ShieldCheck, KeyRound, Gauge } from "lucide-react";
import {
  SectionRailFrame,
  JargonTooltip,
  scrollToHeroShortener,
} from "@/components/marketing/swiss-frame";
import { PathLockCartoonPanel } from "@/components/marketing/pathlock-cartoon-panel";
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
    <section className="w-full bg-[#FFFFFF] dark:bg-[#09090B] py-20 sm:py-24 transition-colors duration-300 overflow-x-clip">
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
                className="relative w-full h-[1.5px] bg-[#0066FF]/20 dark:bg-white/[0.12] overflow-hidden"
              >
                <span className="how-step-bar-fill block h-full w-full bg-[#0066FF] dark:bg-[#3B82F6]" />
              </div>

              <div className="pt-6 flex flex-col">
                <span className="how-step-vivid-color font-mono text-[13px] font-semibold text-[#0066FF]/70 dark:text-[#60A5FA]/75 group-hover:text-[#0066FF] dark:group-hover:text-[#3B82F6] tabular-nums">
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
        <div className="max-w-[680px] mx-auto text-center pb-10 sm:pb-16 mb-16 sm:mb-24">
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
                  className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-[8px] bg-[#09090B] hover:bg-[#0066FF] dark:bg-white dark:hover:bg-[#0066FF] text-white dark:text-[#09090B] dark:hover:text-white text-[12px] font-semibold transition-[background-color,border-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow whitespace-nowrap shrink-0"
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
const PATHLOCK_FEATURES = [
  {
    icon: ShieldCheck,
    title: "Strict URL prefix enforcement",
    desc: "Blocks out-of-scope routes immediately at the edge before internal pages load.",
  },
  {
    icon: KeyRound,
    title: "Optional team unlock password",
    desc: "Built directly into the gate so authorized reviewers can bypass restrictions.",
  },
  {
    icon: Gauge,
    title: "Click Caps & scheduled expiry",
    desc: "Automatically close private beta links or route visitors to a waitlist after N visits.",
  },
];

export function PathLockFocusSection() {
  return (
    <section
      id="pathlock"
      className="relative w-full min-h-[100svh] flex items-center bg-[#FFFFFF] dark:bg-[#09090B] text-[#101828] dark:text-[#FAFAFA] py-20 sm:py-24 border-t border-[#E4E7EC] dark:border-[#222225] scroll-mt-16 overflow-x-clip transition-colors duration-300"
    >
      <div className="mx-auto w-full max-w-[1520px] px-6 sm:px-10 xl:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,8.2fr)] gap-10 xl:gap-14 items-stretch">
          {/* Left Column — Wider Editorial Hairline Feature Architecture */}
          <div className="min-w-0 flex flex-col justify-between">
            <div>
              <h2 className="m-0 font-medium text-[clamp(28px,3.1vw,38px)] leading-[1.12] tracking-[-0.025em] text-[#101828] dark:text-[#FAFAFA] text-balance">
                Expose{" "}
                <code className="font-mono text-[#0066FF] dark:text-[#529DFF] font-medium">
                  /app/dashboard/*
                </code>
                . Lock the rest of your app.
              </h2>

              <p className="mt-3.5 text-[15.5px] leading-[1.6] text-[#344054] dark:text-[#D4D4D8] text-pretty">
                Sharing a staging SaaS or investor preview?{" "}
                <JargonTooltip
                  term="PathLock™"
                  explanation="Unlike basic link passwords that stop working after the redirect, PathLock enforces an authorized URL prefix boundary while visitors browse your preview."
                />{" "}
                enforces a strict URL perimeter so visitors cannot wander into
                unfinished billing, admin, or settings pages.
              </p>

              <ul className="mt-5 list-none p-0 border-t border-[#E4E7EC] dark:border-[#222225]">
                {PATHLOCK_FEATURES.map((feat) => {
                  const Icon = feat.icon;
                  return (
                    <li
                      key={feat.title}
                      className="grid grid-cols-[20px_1fr] gap-3 py-3 border-b border-[#E4E7EC] dark:border-[#222225]"
                    >
                      <Icon className="w-5 h-5 mt-0.5 text-[#667085] dark:text-[#A1A1AA] stroke-[1.5]" />
                      <div>
                        <b className="block font-medium text-[14.5px] text-[#101828] dark:text-[#FAFAFA]">
                          {feat.title}
                        </b>
                        <span className="block text-[14px] leading-[1.5] text-[#344054] dark:text-[#D4D4D8] mt-0.5">
                          {feat.desc}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/#hero-shortener"
                onClick={scrollToHeroShortener}
                className="inline-flex items-center h-[44px] px-[18px] rounded-[10px] bg-[#0066FF] hover:bg-[#0055D4] text-white text-[15px] font-medium leading-none transition-[background-color,border-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-2"
              >
                Protect a demo link
              </a>

              <Link
                href="/docs/path-lock"
                className="inline-flex items-center h-[44px] px-[18px] rounded-[10px] border border-[#D0D5DD] dark:border-[#2E2E33] text-[#101828] dark:text-[#FAFAFA] hover:bg-[#101828]/[0.05] dark:hover:bg-[#FAFAFA]/[0.06] text-[15px] font-medium leading-none transition-[background-color,border-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-2"
              >
                Read PathLock docs
              </Link>
            </div>
          </div>

          {/* Right Column — Full-Height & Full-Width Pure Video Frame */}
          <PathLockCartoonPanel />
        </div>
      </div>
    </section>
  );
}
