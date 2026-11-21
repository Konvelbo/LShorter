"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  X as XIcon,
  Terminal,
  Copy,
  Users,
  Code2,
  Megaphone,
  Building2,
  Link2,
  BookOpen,
  Shield,
  CreditCard,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import { PRICING_PLANS, PRICING_COPY } from "@/src/config/pricing";
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
    feature: "White-label masking & PIN gate",
    others: "Exposes the raw destination URL immediately in the address bar",
    lshorter:
      "Masked viewer with custom OpenGraph cards and PIN challenge",
  },
  {
    feature: "Editable Vector QR Studio (15 styles)",
    others: "Basic bitmap QR or paid $35+/mo add-on",
    lshorter:
      "15 pixel styles, brand gradients, SVG/PNG/GIF export — editable after print",
  },
  {
    feature: "Cookie-free Stripe revenue attribution",
    others: "Raw click counts only — no visibility into which link produced sales",
    lshorter:
      "Attributes signups and Stripe checkouts directly back to each short slug",
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
// 6. USE CASES BY PROFILE (Single-Row Tab Bar + Split Blueprint)
// ============================================================================
const USE_CASES = [
  {
    id: "founders",
    label: "SaaS founders & devs",
    icon: Code2,
    scenario:
      "You share a staging demo of your SaaS: one link locks testers strictly inside /app/dashboard/* and automatically closes after 25 clicks.",
    bullets: [
      "Prevent beta testers from exploring unfinished routes with PathLock™",
      "Cap private invite batches with exact click limits and waitlist fallback",
      "Automate link provisioning directly from CI/CD via REST API",
    ],
    sampleLink: "go.acmesaas.io/beta-v2",
    sampleRule: "PathLock: /app/dashboard/*  |  Cap: 25 clicks",
  },
  {
    id: "marketers",
    label: "Affiliates & marketers",
    icon: Megaphone,
    scenario:
      "You run paid ads across regions: one short link routes French visitors to your FR checkout, fires Meta and TikTok pixels, and shows which post drove the sale.",
    bullets: [
      "Split-test two landing pages with weighted A/B routing on one link",
      "Fire Meta Ads, Google Ads, and TikTok retargeting pixels automatically",
      "Connect Stripe checkouts to see exact revenue per short link",
    ],
    sampleLink: "deals.brand.co/spring",
    sampleRule: "FR -> /fr-offer  |  A/B 50/50  |  Meta Pixel on",
  },
  {
    id: "creators",
    label: "Creators",
    icon: Users,
    scenario:
      "You share a product link on Instagram and YouTube: iPhone followers go straight to the App Store, Android to Google Play, and you track every click live.",
    bullets: [
      "Smart OS detection routes iOS, Android, and desktop visitors automatically",
      "Custom OpenGraph cards so links look sharp on X, LinkedIn, and Discord",
      "Branded vector QR codes for merch, slides, and live events",
    ],
    sampleLink: "lsho.cc/creator-kit",
    sampleRule: "iOS -> App Store  |  Android -> Play Store",
  },
  {
    id: "agencies",
    label: "Agencies",
    icon: Building2,
    scenario:
      "You manage campaigns for multiple clients: give every client their own verified short domain, live geo reports, and password-protected preview links.",
    bullets: [
      "Connect up to 15 custom client domains with automated DNS and SSL",
      "Export clean CSV/Excel reports for every client campaign in one click",
      "Protect confidential pitch decks and client previews behind a PIN gate",
    ],
    sampleLink: "go.clientbrand.com/q4",
    sampleRule: "Custom SSL  |  PIN Gate  |  CSV export",
  },
];

export function UseCasesSection() {
  const [activeId, setActiveId] = useState(USE_CASES[0].id);
  const current = USE_CASES.find((u) => u.id === activeId) || USE_CASES[0];

  return (
    <section className="w-full bg-[#F8F9FB] dark:bg-[#0D0E12] py-24 sm:py-32 border-t border-[#E4E7EC] dark:border-white/[0.08] overflow-x-clip transition-colors duration-300">
      <SectionRailFrame>
        <div className="mb-8">
          <h2 className="text-[30px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-[1.08] text-[#09090B] dark:text-white text-balance">
            Tailored to how your team ships
          </h2>

          {/* Single-Row Tab Bar */}
          <div className="mt-6 inline-flex flex-wrap lg:flex-nowrap gap-1 p-1 rounded-[10px] bg-white dark:bg-[#14151B] border border-[#E4E7EC] dark:border-white/[0.09] max-w-full">
            {USE_CASES.map((tab) => {
              const Icon = tab.icon;
              const isSelected = tab.id === activeId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveId(tab.id)}
                  className={`relative px-3.5 py-2 rounded-[8px] text-[13.5px] font-medium transition-colors cursor-pointer inline-flex items-center gap-2 ${
                    isSelected
                      ? "text-white"
                      : "text-[#52525B] dark:text-zinc-400 hover:text-[#09090B] dark:hover:text-white"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="use-case-pill"
                      transition={{ type: "spring", stiffness: 440, damping: 36 }}
                      className="absolute inset-0 rounded-[8px] bg-[#0066FF] z-0"
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" />
                  <span className="relative z-10 whitespace-nowrap">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2, ease: EASE_OUT_EXPO }}
            className="rounded-[10px] border border-[#E4E7EC] dark:border-white/[0.09] bg-white dark:bg-[#111216] grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E4E7EC] dark:divide-white/[0.08] overflow-hidden"
          >
            <div className="lg:col-span-7 p-6 sm:p-8">
              <p className="text-[18px] sm:text-[21px] font-medium tracking-[-0.02em] leading-[1.45] text-[#09090B] dark:text-white">
                &ldquo;{current.scenario}&rdquo;
              </p>
              <ul className="mt-6 space-y-2.5">
                {current.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-[14.5px] text-[#52525B] dark:text-zinc-300"
                  >
                    <Check className="w-4 h-4 text-[#0066FF] dark:text-[#6CA8FF] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-[#F8F9FB]/60 dark:bg-[#0D0E12]">
              <div>
                <div className="text-[12.5px] font-medium text-[#71717A] dark:text-zinc-400">
                  Configured link example
                </div>
                <div className="mt-2 font-mono text-[17px] font-semibold text-[#0066FF] dark:text-[#6CA8FF] break-all">
                  {current.sampleLink}
                </div>
                <div className="mt-3 px-3.5 py-2.5 rounded-[8px] bg-white dark:bg-[#111216] border border-[#E4E7EC] dark:border-white/[0.08] font-mono text-[12px] text-[#3F3F46] dark:text-zinc-300">
                  {current.sampleRule}
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-[#E4E7EC] dark:border-white/[0.08]">
                <WaveRevealButton
                  href="/#hero-shortener"
                  onClick={scrollToHeroShortener}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  Try this workflow without signup
                </WaveRevealButton>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 7. DEVELOPER-FIRST REST API & WEBHOOKS (#api)
// ============================================================================
type ApiLangKey = "curl" | "ts" | "python" | "webhook";

const API_SNIPPETS: Record<ApiLangKey, { label: string; code: string }> = {
  curl: {
    label: "cURL",
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
  ts: {
    label: "TypeScript",
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
  python: {
    label: "Python",
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
  webhook: {
    label: "Webhook",
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
};

const TOKEN_REGEX =
  /(\/\/.*$|#.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:const|await|import|from|export|return|true|false|null|curl|POST|GET|PATCH|DELETE)\b|\b(?:fetch|JSON|stringify|console|log|requests|post|print|os|environ|process|env)\b|\s-[A-Za-z]+\b|\b\d+(?:\.\d+)?\b)/g;

const KEYWORDS = new Set([
  "const",
  "await",
  "import",
  "from",
  "export",
  "return",
  "true",
  "false",
  "null",
  "curl",
  "POST",
  "GET",
  "PATCH",
  "DELETE",
]);

const BUILTINS = new Set([
  "fetch",
  "JSON",
  "stringify",
  "console",
  "log",
  "requests",
  "post",
  "print",
  "os",
  "environ",
  "process",
  "env",
]);

function renderHighlightedLine(line: string, lineIdx: number): React.ReactNode {
  if (!line) return " ";
  const parts: React.ReactNode[] = [];
  let lastIndex = 0;
  TOKEN_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_REGEX.exec(line)) !== null) {
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }
    const token = match[0];
    const trimmed = token.trim();
    const after = line.slice(match.index + token.length);
    const isJsonKey =
      (token.startsWith('"') || token.startsWith("'")) && /^\s*:/.test(after);

    let cls = "text-zinc-200";
    if (token.startsWith("//") || token.startsWith("#")) {
      cls = "text-zinc-500 italic";
    } else if (isJsonKey) {
      cls = "text-[#7AB3FF]";
    } else if (
      token.startsWith('"') ||
      token.startsWith("'") ||
      token.startsWith("`")
    ) {
      cls = "text-emerald-400";
    } else if (KEYWORDS.has(trimmed)) {
      cls = "text-[#5294FF] font-semibold";
    } else if (BUILTINS.has(trimmed)) {
      cls = "text-sky-300";
    } else if (/^-[A-Za-z]+$/.test(trimmed)) {
      cls = "text-amber-300";
    } else if (/^\d+(?:\.\d+)?$/.test(trimmed)) {
      cls = "text-amber-300";
    }

    parts.push(
      <span key={`${lineIdx}-${match.index}`} className={cls}>
        {token}
      </span>
    );
    lastIndex = match.index + token.length;
  }

  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts;
}

export function DeveloperApiSection() {
  const [lang, setLang] = useState<ApiLangKey>("curl");
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(API_SNIPPETS[lang].code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  const lines = API_SNIPPETS[lang].code.split("\n");

  return (
    <section
      id="api"
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] py-24 sm:py-32 border-t border-[#E4E7EC] dark:border-white/[0.08] scroll-mt-20 overflow-x-clip transition-colors duration-300"
    >
      <SectionRailFrame>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          <div className="lg:col-span-5">
            <h2 className="text-[30px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-[1.08] text-[#09090B] dark:text-white text-balance">
              Provision links and rules from your codebase
            </h2>

            <p className="mt-4 text-[15.5px] text-[#52525B] dark:text-zinc-400 leading-[1.6] text-pretty">
              Create links programmatically, enforce PathLock™ prefixes, set
              click caps, and receive signed conversion webhooks in real time.
            </p>

            <div className="mt-6 border-y border-[#E4E7EC] dark:border-white/[0.08] divide-y divide-[#E4E7EC] dark:divide-white/[0.08] text-[14px]">
              {[
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
                  desc: "Stream click geo, device metadata, and Stripe revenue events.",
                },
              ].map((item) => (
                <div key={item.title} className="py-3.5 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#0066FF] dark:text-[#6CA8FF] shrink-0 mt-0.5" />
                  <span className="text-[#52525B] dark:text-zinc-300">
                    <strong className="text-[#09090B] dark:text-white font-medium">
                      {item.title}:
                    </strong>{" "}
                    {item.desc}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <WaveRevealButton
                href="/docs"
                variant="primary"
                size="md"
                icon={<BookOpen className="w-4 h-4" />}
              >
                Explore API documentation
              </WaveRevealButton>
              <WaveRevealButton
                href="/docs/sdk-quickstart"
                variant="outline"
                size="md"
                icon={<Terminal className="w-4 h-4" />}
              >
                Quickstart guide
              </WaveRevealButton>
            </div>
          </div>

          <div className="lg:col-span-7">
            <div className="rounded-[10px] bg-[#0B0C10] border border-[#222531] overflow-hidden">
              <div className="px-4 py-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 bg-[#12141B]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(Object.keys(API_SNIPPETS) as ApiLangKey[]).map((key) => {
                    const isSelected = lang === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setLang(key)}
                        className={`relative px-3 py-1.5 rounded-[7px] text-[12px] font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? "text-white"
                            : "text-zinc-400 hover:text-zinc-200"
                        }`}
                      >
                        {isSelected && (
                          <motion.span
                            layoutId="api-code-tab"
                            transition={{
                              type: "spring",
                              stiffness: 450,
                              damping: 35,
                            }}
                            className="absolute inset-0 rounded-[7px] bg-[#0066FF] z-0"
                          />
                        )}
                        <span className="relative z-10">
                          {API_SNIPPETS[key].label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="h-8 px-2.5 rounded-[7px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-200 text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 sm:p-5 overflow-x-auto bg-[#0B0C10]">
                <pre className="font-mono text-[12.5px] leading-[1.7] text-zinc-200">
                  <code className="code-syntax block">
                    {lines.map((line, idx) => (
                      <div key={idx} className="table-row">
                        <span className="table-cell pr-4 select-none text-right text-zinc-600 tabular-nums w-8">
                          {idx + 1}
                        </span>
                        <span className="table-cell whitespace-pre">
                          {renderHighlightedLine(line, idx)}
                        </span>
                      </div>
                    ))}
                  </code>
                </pre>
              </div>

              <div className="px-4 py-2.5 border-t border-white/[0.08] bg-[#12141B] flex flex-wrap items-center justify-between gap-2 font-mono text-[11.5px]">
                <span className="text-emerald-400">
                  201 Created — Edge KV synced
                </span>
                <span className="text-zinc-400">POST /api/v1/links</span>
              </div>
            </div>
          </div>
        </div>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 8. REAL PRICING SECTION (#pricing-preview — Synced 1:1 with /pricing & PRICING_PLANS)
// ============================================================================
export function PricingPreviewSection() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plansList = [
    {
      id: "FREE" as const,
      name: PRICING_PLANS.FREE.name,
      tagline: "To explore our Edge infrastructure, no credit card required.",
      displayPrice: "$0",
      originalPrice: null as string | null,
      savingsText: null as string | null,
      subPriceNote: "Free forever",
      unit: "forever",
      badge: "Free",
      popular: false,
      cta: "Get Started Free",
      href: "/register",
      features: [
        "10,000 clicks / month",
        "3 domains and 50 active links",
        "Global Workspace Target (clicks and revenue)",
        "QR Code Studio (basic styles)",
        "30-day analytics · API 60 req/min",
        "Community support",
      ],
      notIncludedNote:
        "Not included: Smart Routing, PIN protection, individual link alerts, webhooks, and pixels.",
    },
    {
      id: "PRO" as const,
      name: PRICING_PLANS.PRO.name,
      tagline: "Grow your brand and maximize your conversion rates.",
      displayPrice: isAnnual
        ? `$${PRICING_PLANS.PRO.yearlyPrice}`
        : `$${PRICING_PLANS.PRO.promoMonthly.firstMonthPrice.toFixed(2)}`,
      originalPrice: isAnnual
        ? `$${PRICING_PLANS.PRO.promoYearly.fullPriceBeforeDiscount}`
        : `$${PRICING_PLANS.PRO.monthlyPrice}`,
      savingsText: isAnnual ? "Save $90 / yr" : "Save $22.50 over 2 months",
      subPriceNote: isAnnual
        ? `or $${PRICING_PLANS.PRO.promoYearly.equivalentMonthlyPrice.toFixed(2)} / month`
        : `then $${PRICING_PLANS.PRO.monthlyPrice} / month`,
      unit: isAnnual ? "/ yr" : "/ 2 mo",
      badge: isAnnual ? "-50% annual" : "-75% promo",
      popular: true,
      cta: "Choose Pro",
      href: `/checkout?plan=PRO&cycle=${isAnnual ? "YEARLY" : "MONTHLY"}`,
      features: [
        "150,000 clicks / month (+$3 / 50k)",
        "6 domains and 1,000 active links",
        "Individual link alerts (clicks, revenue, expiration)",
        "Dynamic Smart Routing (country + OS/device)",
        "PIN codes and destination masking",
        "5 webhooks and 5 retargeting pixels",
        "365-day analytics · API 200 req/min",
        "Priority email support",
      ],
      notIncludedNote: null as string | null,
    },
    {
      id: "BUSINESS" as const,
      name: PRICING_PLANS.BUSINESS.name,
      tagline: "For multi-channel campaigns and growing teams.",
      displayPrice: isAnnual
        ? `$${PRICING_PLANS.BUSINESS.yearlyPrice}`
        : `$${PRICING_PLANS.BUSINESS.promoMonthly.firstMonthPrice.toFixed(2)}`,
      originalPrice: isAnnual
        ? `$${PRICING_PLANS.BUSINESS.promoYearly.fullPriceBeforeDiscount}`
        : `$${PRICING_PLANS.BUSINESS.monthlyPrice}`,
      savingsText: isAnnual ? "Save $238 / yr" : "Save $58.80 over 2 months",
      subPriceNote: isAnnual
        ? `or $${PRICING_PLANS.BUSINESS.promoYearly.equivalentMonthlyPrice.toFixed(2)} / month`
        : `then $${PRICING_PLANS.BUSINESS.monthlyPrice} / month`,
      unit: isAnnual ? "/ yr" : "/ 2 mo",
      badge: isAnnual ? "-40% annual" : "-60% promo",
      popular: false,
      cta: "Choose Business",
      href: `/checkout?plan=BUSINESS&cycle=${isAnnual ? "YEARLY" : "MONTHLY"}`,
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
      notIncludedNote: null as string | null,
    },
    {
      id: "ENTERPRISE" as const,
      name: PRICING_PLANS.ENTERPRISE.name,
      tagline: "Unlimited clicks and dedicated high-throughput Edge SLA.",
      displayPrice: isAnnual
        ? `$${PRICING_PLANS.ENTERPRISE.yearlyPrice.toLocaleString("en-US")}`
        : `$${PRICING_PLANS.ENTERPRISE.promoMonthly.firstMonthPrice.toFixed(2)}`,
      originalPrice: isAnnual
        ? `$${PRICING_PLANS.ENTERPRISE.promoYearly.fullPriceBeforeDiscount.toLocaleString("en-US")}`
        : `$${PRICING_PLANS.ENTERPRISE.monthlyPrice}`,
      savingsText: isAnnual ? "Save $718 / yr" : "Save $199 over 2 months",
      subPriceNote: isAnnual
        ? `or $${PRICING_PLANS.ENTERPRISE.promoYearly.equivalentMonthlyPrice.toFixed(2)} / month`
        : `then $${PRICING_PLANS.ENTERPRISE.monthlyPrice} / month`,
      unit: isAnnual ? "/ yr" : "/ 2 mo",
      badge: isAnnual ? "-30% annual" : "-50% promo",
      popular: false,
      cta: "Choose Enterprise",
      href: `/checkout?plan=ENTERPRISE&cycle=${isAnnual ? "YEARLY" : "MONTHLY"}`,
      features: [
        "Unlimited clicks, domains, and links",
        "Global alerts with VIP routing",
        "Hyper-targeted routing (ISP / ASN / city)",
        "Unlimited webhooks and pixels",
        "Unlimited analytics and raw CSV export",
        "API 1,400 req/min",
        "15 team seats",
        "99.99% Edge SLA and direct VIP support",
      ],
      notIncludedNote: null as string | null,
    },
  ];

  const guaranteeIcons = [Shield, CreditCard, RefreshCw];

  return (
    <section
      id="pricing-preview"
      className="w-full bg-[#F8F9FB] dark:bg-[#0D0E12] py-24 sm:py-32 border-t border-[#E4E7EC] dark:border-white/[0.08] scroll-mt-20 overflow-x-clip transition-colors duration-300"
    >
      <SectionRailFrame>
        {/* Header + Real Monthly / Annual Promo Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 mb-12">
          <div>
            <h2 className="text-[30px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-[1.08] text-[#09090B] dark:text-white text-balance">
              Simple pricing, zero downtime guaranteed
            </h2>
            <p className="mt-3 text-[15.5px] text-[#52525B] dark:text-zinc-400 max-w-[580px]">
              Deployed on Cloudflare&apos;s global Edge network, your links stay
              fast and reliable. Certified PDF invoices are generated instantly
              in 1 click.
            </p>
          </div>

          <div className="inline-flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 rounded-[10px] bg-white dark:bg-[#14151B] border border-[#E4E7EC] dark:border-white/[0.09] self-start lg:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                !isAnnual
                  ? "bg-[#0066FF] text-white"
                  : "text-[#52525B] dark:text-zinc-300 hover:text-[#09090B] dark:hover:text-white"
              }`}
            >
              <span>Monthly</span>
              <span
                className={`text-[11.5px] font-medium ${
                  !isAnnual
                    ? "text-white/90"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                -75% first 2 months
              </span>
            </button>
            <button
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`px-3.5 py-2 rounded-[8px] text-[13px] font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                isAnnual
                  ? "bg-[#0066FF] text-white"
                  : "text-[#52525B] dark:text-zinc-300 hover:text-[#09090B] dark:hover:text-white"
              }`}
            >
              <span>Annual</span>
              <span
                className={`text-[11.5px] font-medium ${
                  isAnnual
                    ? "text-white/90"
                    : "text-emerald-600 dark:text-emerald-400"
                }`}
              >
                up to -50%
              </span>
            </button>
          </div>
        </div>

        {/* Real 4-Column Pricing Grid (strictly rounded-[10px]) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {plansList.map((p) => (
            <div
              key={p.id}
              className={`relative flex flex-col justify-between p-5 sm:p-6 rounded-[10px] border transition-colors ${
                p.popular
                  ? "bg-[#F8FAFF] dark:bg-[#131722] border-[#0066FF]"
                  : "bg-white dark:bg-[#111216] border-[#E4E7EC] dark:border-white/[0.09]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <h3
                    className={`text-[18px] font-semibold tracking-tight ${
                      p.popular
                        ? "text-[#0066FF] dark:text-[#6CA8FF]"
                        : "text-[#09090B] dark:text-white"
                    }`}
                  >
                    {p.name}
                  </h3>
                  {p.badge && (
                    <span
                      className={`px-2 py-0.5 rounded-[5px] text-[11px] font-medium whitespace-nowrap ${
                        p.popular
                          ? "bg-[#0066FF] text-white"
                          : p.id === "FREE"
                            ? "bg-[#F4F4F5] dark:bg-white/[0.08] text-[#52525B] dark:text-zinc-300"
                            : "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400"
                      }`}
                    >
                      {p.badge}
                    </span>
                  )}
                </div>

                <p className="mt-2 text-[12.5px] text-[#71717A] dark:text-zinc-400 leading-snug min-h-[36px]">
                  {p.tagline}
                </p>

                {/* Price Block */}
                <div className="mt-4 pb-4 border-b border-[#E4E7EC] dark:border-white/[0.08]">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-1">
                      <span className="text-[32px] font-semibold tracking-[-0.03em] leading-none text-[#09090B] dark:text-white tabular-nums">
                        {p.displayPrice}
                      </span>
                      <span className="text-[12.5px] text-[#71717A] dark:text-zinc-400">
                        {p.unit}
                      </span>
                    </div>
                    {p.originalPrice && (
                      <span className="text-[13px] line-through text-[#A1A1AA] dark:text-zinc-500 tabular-nums">
                        {p.originalPrice}
                      </span>
                    )}
                  </div>

                  <div className="mt-2 min-h-[34px] flex flex-col justify-center">
                    {p.savingsText && (
                      <span className="text-[12px] font-medium text-emerald-600 dark:text-emerald-400 leading-tight">
                        {p.savingsText}
                      </span>
                    )}
                    {p.subPriceNote && (
                      <span className="text-[12px] text-[#71717A] dark:text-zinc-400 leading-tight mt-0.5">
                        {p.subPriceNote}
                      </span>
                    )}
                  </div>
                </div>

                {/* Features List */}
                <ul className="mt-4 space-y-2.5 text-[12.5px] text-[#3F3F46] dark:text-zinc-300">
                  {p.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </li>
                  ))}
                </ul>

                {p.notIncludedNote && (
                  <p className="mt-4 pt-3 border-t border-[#E4E7EC] dark:border-white/[0.08] text-[11.5px] text-[#71717A] dark:text-zinc-500 leading-relaxed">
                    {p.notIncludedNote}
                  </p>
                )}
              </div>

              <div className="mt-6">
                <WaveRevealButton
                  href={p.href}
                  variant={
                    p.popular
                      ? "primary"
                      : p.id === "FREE"
                        ? "outline"
                        : "contrast"
                  }
                  size="sm"
                  className="w-full h-10"
                >
                  {p.cta}
                </WaveRevealButton>
              </div>
            </div>
          ))}
        </div>

        {/* 3 Real Guarantees from PRICING_COPY */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-5">
          {PRICING_COPY.guarantees.map((g, idx) => {
            const Icon = guaranteeIcons[idx] || Shield;
            return (
              <div
                key={g.title}
                className="p-5 rounded-[10px] bg-white dark:bg-[#111216] border border-[#E4E7EC] dark:border-white/[0.09] flex items-start gap-3.5"
              >
                <div className="w-9 h-9 rounded-[8px] bg-[#F8F9FB] dark:bg-white/[0.05] border border-[#E4E7EC] dark:border-white/[0.09] text-[#52525B] dark:text-zinc-300 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[13.5px] font-semibold text-[#09090B] dark:text-white leading-snug">
                    {g.title}
                  </h4>
                  <p className="text-[12.5px] text-[#71717A] dark:text-zinc-400 leading-relaxed mt-1">
                    {g.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0066FF] dark:text-[#6CA8FF] hover:underline"
          >
            <span>View full plan comparison matrix</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </SectionRailFrame>
    </section>
  );
}
