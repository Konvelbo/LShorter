"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  X as XIcon,
  Terminal,
  Users,
  Code2,
  Megaphone,
  Building2,
  Link2,
  ArrowRight,
  Globe,
  ShieldCheck,
  Lock,
  Download,
  Gauge,
  Activity,
  DollarSign,
  Smartphone,
  QrCode,
  Share2,
} from "lucide-react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import {
  SplitDeveloperHero,
  type CodeTab,
} from "@/components/ui/split-developer-hero-with-interactive-code-terminal";
import {
  Pricing,
  type PricingPlan,
  type EnterpriseBannerPlan,
  type PaidPlanId,
  type BillingCycle,
} from "@/components/ui/pricing";
import { showToast } from "@/components/ui/toast-provider";
import { PRICING_PLANS } from "@/src/config/pricing";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
  scrollToHeroShortener,
} from "@/components/marketing/swiss-frame";

// ============================================================================
// 5. THE LSHORTER DIFFERENCE (#difference — Clean Borderless Editorial Table)
// ============================================================================
const COMPARISON_ROWS = [
  {
    feature: "Post-click perimeter control (PathLock™)",
    others:
      "Stops working after the redirect — visitors can explore your entire site",
    lshorter:
      "Locks visitors strictly inside your authorized URL prefix (e.g. /app/dashboard/*)",
  },
  {
    feature: "Self-destructing click caps + fallback",
    others:
      "Not included or locked behind custom enterprise contracts",
    lshorter:
      "Deactivate at an exact click count or redirect to a fallback URL",
  },
  {
    feature: "Multi-condition Edge routing (< 12ms)",
    others: "1 static URL per link, centralized redirects (80–150ms)",
    lshorter:
      "Route 1 link by country, OS, device, browser, or weighted A/B split on 310+ PoPs",
  },
  {
    feature: "White-label masking & password protection",
    others: "Exposes the raw destination URL immediately in the address bar",
    lshorter:
      "Masked viewer with custom OpenGraph cards and password challenge",
  },
  {
    feature: "Editable Vector QR Studio (15 styles)",
    others: "Basic bitmap QR or paid $35+/mo add-on",
    lshorter:
      "15 pixel styles, brand gradients, SVG/PNG/GIF export — editable after print",
  },
  {
    feature: "Cookie-free revenue attribution",
    others: "Raw click counts only — no visibility into which link produced sales",
    lshorter:
      "Attributes signups and revenue conversions directly back to each short slug",
  },
  {
    feature: "Free Starter plan (verified limits)",
    others: "Bitly Free: 5 links/month, 0 custom domains, basic stats",
    lshorter:
      "50 permanent links, 10,000 clicks/month, 3 custom domains, real-time analytics",
  },
];

export function DifferenceSection() {
  return (
    <section
      id="difference"
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] py-24 sm:py-32 border-t border-[#E4E7EC] dark:border-white/[0.08] scroll-mt-20 overflow-x-clip transition-colors duration-300"
    >
      <SectionRailFrame>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
          <div className="lg:col-span-7">
            <h2 className="text-[30px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-[1.08] text-[#09090B] dark:text-white text-balance">
              Why teams move off legacy redirectors
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[15.5px] text-[#52525B] dark:text-zinc-400 leading-[1.6] text-pretty">
              Traditional shorteners stop helping the millisecond a 302 fires.
              LShorter keeps routing, isolating perimeters, and attributing
              revenue end to end.
            </p>
          </div>
        </div>

        {/* Full-Width Horizontal-Rule Table (zero outer card border) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-[#D4D4D8] dark:border-white/15 text-[13px] font-medium">
                <th className="py-3.5 pr-6 text-[#71717A] dark:text-zinc-400 w-[28%]">
                  Capability
                </th>
                <th className="py-3.5 px-6 text-[#71717A] dark:text-zinc-400 w-[34%]">
                  Traditional shorteners (Bitly, TinyURL)
                </th>
                <th className="py-3.5 pl-6 text-[#0066FF] dark:text-[#6CA8FF] w-[38%]">
                  LShorter
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] dark:divide-white/[0.08] text-[14px]">
              {COMPARISON_ROWS.map((row) => (
                <tr
                  key={row.feature}
                  className="hover:bg-[#F8F9FB] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 pr-6 font-medium text-[#09090B] dark:text-white align-top">
                    {row.feature}
                  </td>
                  <td className="py-4 px-6 text-[#71717A] dark:text-zinc-400 align-top">
                    <div className="flex items-start gap-2.5">
                      <XIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0 mt-0.5" />
                      <span>{row.others}</span>
                    </div>
                  </td>
                  <td className="py-4 pl-6 text-[#09090B] dark:text-zinc-100 font-medium align-top">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#0066FF] dark:text-[#6CA8FF] shrink-0 mt-0.5 stroke-[2.25]" />
                      <span>{row.lshorter}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E4E7EC] dark:border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-[14px] text-[#71717A] dark:text-zinc-400">
            50 permanent links and 3 custom domains free forever.
          </span>
          <WaveRevealButton
            href="/#hero-shortener"
            onClick={scrollToHeroShortener}
            variant="outline"
            size="md"
            icon={<Link2 className="w-4 h-4" />}
          >
            Shorten a link now
          </WaveRevealButton>
        </div>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 6. USE CASES BY PROFILE (Segmented Tab Bar + Split Interactive Governance Card)
// ============================================================================
interface UseCaseRuleRow {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  verifiedDot?: boolean;
}

interface UseCaseBarRow {
  label: string;
  percent: number;
  count: string;
}

interface UseCaseItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  headline: string;
  bullets: string[];
  shortUrl: string;
  destination: string;
  status: string;
  rules: UseCaseRuleRow[];
  chartTitle: string;
  chartSub: string;
  actionLabel: string;
  actionDoneLabel: string;
  bars: UseCaseBarRow[];
}

const USE_CASES: UseCaseItem[] = [
  {
    id: "founders",
    label: "SaaS founders & devs",
    icon: Code2,
    eyebrow: "For SaaS teams shipping staging demos & private betas",
    headline:
      "Lock beta testers inside /app/dashboard/* and auto-close invites after 25 clicks",
    bullets: [
      "Prevent beta testers from exploring unfinished routes with PathLock™",
      "Cap private invite batches with exact click limits and waitlist fallback",
      "Automate link provisioning directly from CI/CD via REST API",
    ],
    shortUrl: "go.acmesaas.io/beta-v2",
    destination: "staging.acmesaas.io/app/dashboard/overview",
    status: "Live",
    rules: [
      {
        icon: ShieldCheck,
        label: "PathLock™ prefix",
        value: "/app/dashboard/*",
        verifiedDot: true,
      },
      { icon: Gauge, label: "Click cap", value: "19 / 25 clicks" },
      { icon: Terminal, label: "Provisioning", value: "REST API · CI/CD" },
    ],
    chartTitle: "Route activity",
    chartSub: "Last 7 days",
    actionLabel: "Export CSV",
    actionDoneLabel: "Exported",
    bars: [
      { label: "/dashboard", percent: 100, count: "142" },
      { label: "/metrics", percent: 64, count: "91" },
      { label: "/admin", percent: 18, count: "26" },
      { label: "/billing", percent: 11, count: "15" },
    ],
  },
  {
    id: "marketers",
    label: "Affiliates & marketers",
    icon: Megaphone,
    eyebrow: "For growth teams running paid campaigns across regions",
    headline:
      "Route every region to its local offer, fire ad pixels and track attributed revenue",
    bullets: [
      "Split-test two landing pages with weighted A/B routing on one link",
      "Fire Meta Ads, Google Ads, and TikTok retargeting pixels automatically",
      "Connect conversion webhooks to see exact revenue per short link",
    ],
    shortUrl: "deals.brand.co/spring",
    destination: "brand.co/offers/spring-campaign",
    status: "Live",
    rules: [
      {
        icon: Globe,
        label: "Geo & A/B split",
        value: "FR → /fr · 50/50",
        verifiedDot: true,
      },
      { icon: Activity, label: "Retargeting pixels", value: "Meta · TikTok" },
      { icon: DollarSign, label: "Attributed revenue", value: "$4,820" },
    ],
    chartTitle: "Clicks by country",
    chartSub: "Last 7 days",
    actionLabel: "Export CSV",
    actionDoneLabel: "Exported",
    bars: [
      { label: "France", percent: 100, count: "2,140" },
      { label: "United States", percent: 72, count: "1,538" },
      { label: "United Kingdom", percent: 44, count: "942" },
      { label: "Canada", percent: 29, count: "618" },
    ],
  },
  {
    id: "creators",
    label: "Creators",
    icon: Users,
    eyebrow: "For creators sharing drops across Instagram, YouTube & TikTok",
    headline:
      "Send iOS followers to the App Store, Android to Google Play and track live clicks",
    bullets: [
      "Smart OS detection routes iOS, Android, and desktop visitors automatically",
      "Custom OpenGraph cards so links look sharp on X, LinkedIn, and Discord",
      "Branded vector QR codes for merch, slides, and live events",
    ],
    shortUrl: "lsho.cc/creator-kit",
    destination: "apps.apple.com/app/creator-kit",
    status: "Live",
    rules: [
      {
        icon: Smartphone,
        label: "Smart OS routing",
        value: "iOS · Android · Web",
        verifiedDot: true,
      },
      { icon: QrCode, label: "Dynamic QR code", value: "SVG · Branded" },
      { icon: Share2, label: "OpenGraph card", value: "Custom preview" },
    ],
    chartTitle: "Clicks by device",
    chartSub: "Last 7 days",
    actionLabel: "Export CSV",
    actionDoneLabel: "Exported",
    bars: [
      { label: "iOS", percent: 100, count: "3,412" },
      { label: "Android", percent: 58, count: "1,978" },
      { label: "Desktop", percent: 27, count: "924" },
      { label: "QR Scans", percent: 19, count: "648" },
    ],
  },
  {
    id: "agencies",
    label: "Agencies",
    icon: Building2,
    eyebrow: "For agencies running campaigns for multiple clients",
    headline:
      "Give every client a verified short domain, live geo reports and password-protected previews",
    bullets: [
      "Connect up to 15 custom client domains with automated DNS and SSL",
      "Export clean CSV/Excel reports for every client campaign in one click",
      "Protect confidential pitch decks and client previews behind a password",
    ],
    shortUrl: "go.clientbrand.com/q4",
    destination: "clientbrand.com/campaigns/q4-launch",
    status: "Live",
    rules: [
      {
        icon: Globe,
        label: "Custom domain",
        value: "Verified",
        verifiedDot: true,
      },
      { icon: ShieldCheck, label: "SSL certificate", value: "Active" },
      { icon: Lock, label: "Password", value: "Required" },
    ],
    chartTitle: "Clicks by country",
    chartSub: "Last 7 days",
    actionLabel: "Export CSV",
    actionDoneLabel: "Exported",
    bars: [
      { label: "United States", percent: 100, count: "1,284" },
      { label: "Germany", percent: 50, count: "642" },
      { label: "France", percent: 33, count: "418" },
      { label: "Brazil", percent: 23, count: "291" },
    ],
  },
];

export function UseCasesSection() {
  const [activeId, setActiveId] = useState("agencies");
  const [exportedId, setExportedId] = useState<string | null>(null);
  const current = USE_CASES.find((u) => u.id === activeId) || USE_CASES[3];

  const handlePreviewExport = (id: string) => {
    setExportedId(id);
    window.setTimeout(() => {
      setExportedId((prev) => (prev === id ? null : prev));
    }, 1600);
  };

  return (
    <section className="w-full bg-[#f7f8fa] dark:bg-[#0D0E12] py-20 sm:py-24 border-t border-[#0f1217]/[0.08] dark:border-white/[0.08] overflow-x-clip transition-colors duration-300">
      <SectionRailFrame>
        <div className="flex flex-col gap-8">
          <h2 className="m-0 text-[32px] sm:text-[44px] leading-[1.16] font-semibold tracking-[-0.03em] text-[#0f1217] dark:text-white text-balance">
            Tailored to how your team ships
          </h2>

          {/* Segmented Tab Bar */}
          <div
            role="tablist"
            aria-label="Audience"
            className="self-start inline-flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 bg-white dark:bg-[#14151B] border border-[#0f1217]/[0.09] dark:border-white/[0.10] rounded-[10px] max-w-full"
          >
            {USE_CASES.map((tab) => {
              const Icon = tab.icon;
              const isSelected = tab.id === activeId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveId(tab.id)}
                  className={`relative h-9 px-3.5 inline-flex items-center gap-2 rounded-[6px] text-[14px] font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1f5fe0] focus-visible:outline-offset-2 ${
                    isSelected
                      ? "text-[#0f1217] dark:text-white"
                      : "text-[#5b6270] dark:text-zinc-400 hover:text-[#0f1217] dark:hover:text-white"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="use-case-pill"
                      transition={{ type: "spring", stiffness: 460, damping: 38 }}
                      className="absolute inset-0 rounded-[6px] bg-[#eef0f4] dark:bg-white/[0.11] border border-[#0f1217]/[0.10] dark:border-white/[0.14] z-0"
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10 shrink-0 stroke-[1.6]" />
                  <span className="relative z-10 whitespace-nowrap">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Split Panel Card */}
          <div className="bg-white dark:bg-[#121319] border border-[#0f1217]/[0.09] dark:border-white/[0.09] rounded-[10px] overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                role="tabpanel"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]"
              >
                {/* Left Column: Narrative + Bullets + Primary CTA */}
                <div className="p-7 sm:p-10 flex flex-col justify-between gap-8">
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                      <span className="text-[14px] leading-5 font-medium text-[#5b6270] dark:text-zinc-400">
                        {current.eyebrow}
                      </span>
                      <h3 className="m-0 text-[24px] sm:text-[30px] leading-[1.33] font-semibold tracking-[-0.02em] text-[#0f1217] dark:text-white text-balance">
                        {current.headline}
                      </h3>
                    </div>

                    <ul className="flex flex-col gap-3">
                      {current.bullets.map((b) => (
                        <li
                          key={b}
                          className="flex items-start gap-3 text-[15px] leading-6 text-[#4a5160] dark:text-zinc-300"
                        >
                          <Check className="w-4 h-4 shrink-0 mt-1 stroke-[1.6] text-[#4a5160] dark:text-zinc-400" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href="/#hero-shortener"
                    onClick={scrollToHeroShortener}
                    className="self-start h-11 px-5 inline-flex items-center gap-2.5 bg-[#1f5fe0] hover:bg-[#1a52c4] text-white rounded-[8px] text-[15px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#1f5fe0] focus-visible:outline-offset-2"
                  >
                    <span>Try this workflow without signup</span>
                    <ArrowRight className="w-4 h-4 stroke-[1.75]" />
                  </a>
                </div>

                {/* Right Column: Elevated Live Link Governance Card */}
                <div className="p-6 sm:p-8 bg-[#f1f3f6] dark:bg-[#0A0B0F] border-t lg:border-t-0 lg:border-l border-[#0f1217]/[0.09] dark:border-white/[0.08] flex flex-col justify-center">
                  <div className="bg-white dark:bg-[#15171F] border border-[#0f1217]/[0.10] dark:border-white/[0.10] rounded-[8px] shadow-[0_1px_2px_rgba(15,18,23,0.06),0_8px_24px_rgba(15,18,23,0.06)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden">
                    {/* Link Header */}
                    <div className="px-5 pt-5 pb-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[17px] sm:text-[18px] leading-7 font-medium text-[#1f5fe0] dark:text-[#60A5FA] truncate">
                          {current.shortUrl}
                        </span>
                        <span className="inline-flex items-center gap-2 text-[13px] text-[#4a5160] dark:text-zinc-300 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-[#2f8f5b] dark:bg-emerald-400" />
                          {current.status}
                        </span>
                      </div>
                      <span className="font-mono text-[13px] leading-5 text-[#5b6270] dark:text-zinc-400 truncate">
                        {current.destination}
                      </span>
                    </div>

                    {/* Structured Governance Rows */}
                    <div className="border-t border-[#0f1217]/[0.08] dark:border-white/[0.08]">
                      {current.rules.map((rule, idx) => {
                        const RuleIcon = rule.icon;
                        return (
                          <div
                            key={rule.label}
                            className={`h-11 px-5 flex items-center gap-3 text-[14px] ${
                              idx > 0
                                ? "border-t border-[#0f1217]/[0.08] dark:border-white/[0.08]"
                                : ""
                            }`}
                          >
                            <RuleIcon className="w-4 h-4 shrink-0 text-[#4a5160] dark:text-zinc-400 stroke-[1.6]" />
                            <span className="flex-1 text-[#4a5160] dark:text-zinc-400 truncate">
                              {rule.label}
                            </span>
                            <span className="inline-flex items-center gap-2 text-[#0f1217] dark:text-white font-normal shrink-0">
                              {rule.verifiedDot && (
                                <span className="w-2 h-2 rounded-full bg-[#2f8f5b] dark:bg-emerald-400" />
                              )}
                              {rule.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Country / Activity Breakdown + Ghost Export Button */}
                    <div className="border-t border-[#0f1217]/[0.08] dark:border-white/[0.08] px-5 pt-4 pb-5 flex flex-col gap-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[14px] leading-5 font-medium text-[#0f1217] dark:text-white">
                            {current.chartTitle}
                          </span>
                          <span className="text-[13px] leading-4 text-[#5b6270] dark:text-zinc-400">
                            {current.chartSub}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePreviewExport(current.id)}
                          className="h-8 px-3 inline-flex items-center gap-2 bg-white dark:bg-white/[0.04] hover:bg-[#f1f3f6] dark:hover:bg-white/[0.09] border border-[#0f1217]/[0.14] dark:border-white/[0.14] rounded-[6px] text-[#0f1217] dark:text-zinc-200 text-[13px] font-medium transition-colors cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[#1f5fe0] focus-visible:outline-offset-2"
                        >
                          {exportedId === current.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#2f8f5b] dark:text-emerald-400" />
                              <span>{current.actionDoneLabel}</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 stroke-[1.6]" />
                              <span>{current.actionLabel}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 text-[13px] text-[#4a5160] dark:text-zinc-400">
                        {current.bars.map((bar, idx) => (
                          <div
                            key={bar.label}
                            className="grid grid-cols-[112px_1fr_48px] items-center gap-3"
                          >
                            <span className="truncate">{bar.label}</span>
                            <span className="h-1 rounded-[2px] bg-[#e6e9ee] dark:bg-white/[0.08] overflow-hidden">
                              <motion.span
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: bar.percent / 100 }}
                                transition={{
                                  duration: 0.45,
                                  delay: 0.05 + idx * 0.05,
                                  ease: EASE_OUT_EXPO,
                                }}
                                style={{ transformOrigin: "left" }}
                                className={`block w-full h-1 rounded-[2px] ${
                                  idx === 0
                                    ? "bg-[#1f5fe0] dark:bg-[#3B82F6]"
                                    : "bg-[#aeb5c1] dark:bg-zinc-600"
                                }`}
                              />
                            </span>
                            <span className="text-right font-mono tabular-nums text-[#0f1217] dark:text-zinc-200">
                              {bar.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 7. DEVELOPER-FIRST REST API & WEBHOOKS (#api)
// ============================================================================
const DEVELOPER_API_TABS: CodeTab[] = [
  {
    label: "cURL",
    language: "bash",
    code: `curl -X POST https://lsho.cc/api/v1/links \\
  -H "Authorization: Bearer lsh_live_9f8a2c..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetUrl": "https://app.acmesaas.io/app/dashboard",
    "slug": "beta-demo",
    "maxClicks": 50,
    "pathLockMode": "strict",
    "pathLockPrefix": "/app/dashboard",
    "geoTargeting": { "FR": "https://fr.acmesaas.io/demo" }
  }'`,
  },
  {
    label: "TypeScript",
    language: "typescript",
    code: `const res = await fetch("https://lsho.cc/api/v1/links", {
  method: "POST",
  headers: {
    Authorization: \`Bearer \${process.env.LSHORTER_API_KEY}\`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    targetUrl: "https://app.acmesaas.io/app/dashboard",
    slug: "beta-demo",
    maxClicks: 50,
    pathLockMode: "strict",
    pathLockPrefix: "/app/dashboard",
  }),
});

const { data } = await res.json();
console.log(data.short_url); // https://lsho.cc/beta-demo`,
  },
  {
    label: "Python",
    language: "python",
    code: `import os, requests

response = requests.post(
    "https://lsho.cc/api/v1/links",
    headers={"Authorization": f"Bearer {os.environ['LSHORTER_API_KEY']}"},
    json={
        "targetUrl": "https://app.acmesaas.io/app/dashboard",
        "slug": "beta-demo",
        "maxClicks": 50,
        "pathLockMode": "strict",
        "pathLockPrefix": "/app/dashboard",
    },
)
print(response.json()["data"]["short_url"])`,
  },
  {
    label: "Webhook",
    language: "json",
    code: `{
  "event": "link.clicked",
  "slug": "beta-demo",
  "shortUrl": "https://lsho.cc/beta-demo",
  "country": "FR",
  "city": "Paris",
  "device": "mobile",
  "os": "iOS",
  "clickId": "qk_cid_89a1f02b",
  "timestamp": "2026-11-21T04:12:08.412Z"
}`,
  },
];

const DEVELOPER_API_HIGHLIGHTS = [
  {
    title: "Scoped SHA-256 API keys",
    desc: "Granular read and read_write Bearer tokens with rate limits.",
  },
  {
    title: "Global edge KV sync",
    desc: "Every POST or PATCH propagates across 310+ PoPs right away.",
  },
  {
    title: "Signed webhooks",
    desc: "Stream click geo, device metadata, and live revenue events.",
  },
];

export function DeveloperApiSection() {
  return (
    <SplitDeveloperHero
      id="api"
      badge="REST API v1 · Edge KV synced"
      title="Provision links and rules from your codebase"
      description="Create links programmatically, enforce PathLock™ prefixes, set click caps, and receive signed conversion webhooks in real time."
      highlights={DEVELOPER_API_HIGHLIGHTS}
      primaryAction={{ label: "Explore API documentation", href: "/docs" }}
      secondaryAction={{
        label: "Quickstart guide",
        href: "/docs/sdk-quickstart",
      }}
      codeTabs={DEVELOPER_API_TABS}
      terminalFooter={{
        status: "201 Created — Edge KV synced",
        endpoint: "POST /api/v1/links",
      }}
    />
  );
}

// ============================================================================
// 8. REAL PRICING SECTION (#pricing-preview — Animated NumberFlow + Switch + Confetti)
// ============================================================================
const LSHORTER_PRICING_PLANS: PricingPlan[] = [
  {
    planId: "FREE",
    name: PRICING_PLANS.FREE.name,
    price: PRICING_PLANS.FREE.monthlyPrice,
    yearlyPrice: PRICING_PLANS.FREE.yearlyPrice,
    period: "forever",
    yearlyPeriod: "forever",
    monthlyBillingNote: "Free forever, no credit card",
    yearlyBillingNote: "Free forever, no credit card",
    badgeMonthly: "Free",
    badgeYearly: "Free",
    features: [
      "10,000 clicks / month",
      "3 domains and 50 active links",
      "Global Workspace Target (clicks & revenue)",
      "QR Code Studio (basic styles)",
      "30-day analytics · API 60 req/min",
      "Community support",
    ],
    notIncludedNote:
      "Not included: Smart Routing, password protection, individual link alerts, webhooks, and pixels.",
    description: "To explore our Edge infrastructure, no credit card required.",
    buttonText: "Get Started Free",
    href: "/register",
    yearlyHref: "/register",
    isPopular: false,
  },
  {
    planId: "PRO",
    name: PRICING_PLANS.PRO.name,
    price: PRICING_PLANS.PRO.promoMonthly.firstMonthPrice,
    yearlyPrice: PRICING_PLANS.PRO.yearlyPrice,
    monthlyOriginalPrice: PRICING_PLANS.PRO.monthlyPrice,
    yearlyOriginalPrice: PRICING_PLANS.PRO.promoYearly.fullPriceBeforeDiscount,
    period: "2 mo",
    yearlyPeriod: "yr",
    monthlySavings: "Save $22.50 over 2 months",
    yearlySavings: "Save $90 / yr",
    monthlyBillingNote: `then $${PRICING_PLANS.PRO.monthlyPrice} / month`,
    yearlyBillingNote: `or $${PRICING_PLANS.PRO.promoYearly.equivalentMonthlyPrice.toFixed(2)} / month`,
    badgeMonthly: "-75% promo",
    badgeYearly: "-50% annual",
    features: [
      "150,000 clicks / month (+$3 / 50k)",
      "6 domains and 1,000 active links",
      "Individual link alerts (clicks, revenue, expiry)",
      "Dynamic Smart Routing (country + OS/device)",
      "Password protection and destination masking",
      "5 webhooks and 5 retargeting pixels",
      "365-day analytics · API 200 req/min",
      "Priority email support",
    ],
    description: "Grow your brand and maximize your conversion rates.",
    buttonText: "Choose Pro",
    href: "/pricing",
    yearlyHref: "/pricing",
    isPopular: true,
  },
  {
    planId: "BUSINESS",
    name: PRICING_PLANS.BUSINESS.name,
    price: PRICING_PLANS.BUSINESS.promoMonthly.firstMonthPrice,
    yearlyPrice: PRICING_PLANS.BUSINESS.yearlyPrice,
    monthlyOriginalPrice: PRICING_PLANS.BUSINESS.monthlyPrice,
    yearlyOriginalPrice:
      PRICING_PLANS.BUSINESS.promoYearly.fullPriceBeforeDiscount,
    period: "2 mo",
    yearlyPeriod: "yr",
    monthlySavings: "Save $58.80 over 2 months",
    yearlySavings: "Save $238 / yr",
    monthlyBillingNote: `then $${PRICING_PLANS.BUSINESS.monthlyPrice} / month`,
    yearlyBillingNote: `or $${PRICING_PLANS.BUSINESS.promoYearly.equivalentMonthlyPrice.toFixed(2)} / month`,
    badgeMonthly: "-60% promo",
    badgeYearly: "-40% annual",
    features: [
      "500,000 clicks / month (+$8 / 125k)",
      "15 domains and unlimited active links",
      "Unlimited individual link alerts",
      "Multi-condition rule engine",
      "Advanced protection and destination masking",
      "Vector QR Code Studio (SVG / PDF)",
      "Unlimited webhooks and pixels",
      "Unlimited analytics · API 600 req/min",
      "5 team seats · 24/7 support",
    ],
    description: "For multi-channel campaigns and growing teams.",
    buttonText: "Choose Business",
    href: "/pricing",
    yearlyHref: "/pricing",
    isPopular: false,
  },
];

const LSHORTER_ENTERPRISE_PLAN: EnterpriseBannerPlan = {
  planId: "ENTERPRISE",
  name: PRICING_PLANS.ENTERPRISE.name,
  monthlyPrice: PRICING_PLANS.ENTERPRISE.promoMonthly.firstMonthPrice,
  yearlyPrice: PRICING_PLANS.ENTERPRISE.yearlyPrice,
  monthlyOriginalPrice: PRICING_PLANS.ENTERPRISE.monthlyPrice,
  yearlyOriginalPrice:
    PRICING_PLANS.ENTERPRISE.promoYearly.fullPriceBeforeDiscount,
  monthlyBillingNote: `then $${PRICING_PLANS.ENTERPRISE.monthlyPrice} / month`,
  yearlyBillingNote: `or $${PRICING_PLANS.ENTERPRISE.promoYearly.equivalentMonthlyPrice.toFixed(2)} / month`,
  description: "Unlimited clicks and dedicated high-throughput Edge SLA.",
  features: [
    "Unlimited clicks, domains, and links",
    "Hyper-targeted routing (ISP / ASN / city)",
    "Unlimited analytics & raw CSV export",
    "API 1,400 req/min · 15 team seats",
    "99.99% Edge SLA & direct VIP support",
    "Global alerts with VIP routing",
  ],
  buttonText: "Choose Enterprise",
  monthlyHref: "/pricing",
  yearlyHref: "/pricing",
};

export function PricingPreviewSection() {
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const handleDirectCheckout = async (
    planId: PaidPlanId,
    cycle: BillingCycle
  ) => {
    setLoadingPlan(planId);
    try {
      const userId = (session?.user as { id?: string } | undefined)?.id;
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          cycle,
          userId: userId || undefined,
          customerEmail: session?.user?.email || undefined,
          successUrl: `${window.location.origin}/dashboard/settings?tab=billing&checkout_success=true&plan=${planId}`,
          cancelUrl: `${window.location.origin}/#pricing-preview`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      showToast.error(
        data.error || "Unable to initiate Dodo Payments checkout session."
      );
    } catch {
      showToast.error(
        "Unable to reach Dodo Payments checkout. Please try again."
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section
      id="pricing-preview"
      className="w-full bg-[#F8F9FB] dark:bg-[#0D0E12] border-t border-[#E4E7EC] dark:border-white/[0.08] scroll-mt-20 overflow-x-clip transition-colors duration-300"
    >
      <Pricing
        plans={LSHORTER_PRICING_PLANS}
        enterprise={LSHORTER_ENTERPRISE_PLAN}
        title="Simple, transparent pricing"
        description={"Zero downtime guaranteed across 310+ Cloudflare Edge PoPs.\nCertified PDF invoices generated instantly in one click."}
        annualSaveLabel="Save up to 50%"
        onSelectPlan={handleDirectCheckout}
        loadingPlan={loadingPlan}
      />

      <div className="pb-16 flex justify-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0066FF] dark:text-[#6CA8FF] hover:underline"
        >
          <span>View full feature comparison matrix</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
