"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  X as XIcon,
  ArrowRight,
  Terminal,
  Copy,
  Users,
  Code2,
  Megaphone,
  Building2,
  Link2,
  BookOpen,
} from "lucide-react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import { PRICING_PLANS } from "@/src/config/pricing";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
  SwissSectionIndex,
  scrollToHeroShortener,
} from "@/components/marketing/swiss-frame";

// ============================================================================
// 5. THE LSHORTER DIFFERENCE (#difference — Swiss Hairline Ledger)
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
      "Not included or locked behind expensive custom enterprise contracts",
    lshorter:
      "Deactivate at an exact click count (e.g. 25 beta spots) or redirect to a fallback URL",
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
      "Masked viewer with your brand title, custom OpenGraph cards, and PIN challenge",
  },
  {
    feature: "Editable Vector QR Studio (15 styles)",
    others: "Basic black-and-white bitmap QR or paid $35+/mo add-on",
    lshorter:
      "15 pixel & eye styles, brand gradients, SVG/PNG/GIF export — editable after print",
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
      className="w-full bg-[#F7F8FA] dark:bg-[#0B0C10] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24 overflow-x-clip"
    >
      <SectionRailFrame className="px-4 sm:px-8 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12"
        >
          <div className="lg:col-span-7">
            <SwissSectionIndex
              index="05"
              label="COMPARISON"
              meta="ARCHITECTURE AUDIT"
            />
            <h2 className="mt-4 text-[30px] sm:text-[42px] font-bold tracking-[-0.04em] leading-[1.05] text-[#09090B] dark:text-white">
              Why teams move off legacy redirectors
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[14.5px] sm:text-[15.5px] text-[#475467] dark:text-zinc-400 leading-[1.6]">
              Traditional shorteners stop helping the millisecond a 302 fires.
              LShorter keeps routing, isolating perimeters, and attributing
              revenue end to end.
            </p>
          </div>
        </motion.div>

        {/* Swiss Architectural Hairline Ledger (Zero chunky rounded table container) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="border-y border-[#D0D5DD] dark:border-white/14 bg-white dark:bg-[#0E0F13]"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[720px]">
              <thead>
                <tr className="border-b border-[#D0D5DD] dark:border-white/12 bg-[#F7F8FA] dark:bg-white/[0.02]">
                  <th className="py-3.5 px-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#667085] dark:text-zinc-400 w-[26%]">
                    Capability
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#667085] dark:text-zinc-400 border-l border-[#E4E7EC] dark:border-white/[0.08] w-[34%]">
                    Traditional Shorteners (Bitly, TinyURL…)
                  </th>
                  <th className="py-3.5 px-5 font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[#0066FF] dark:text-[#5294FF] bg-[#0066FF]/[0.05] dark:bg-[#0066FF]/[0.10] border-l border-[#0066FF]/30 w-[40%]">
                    LShorter Edge Platform
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E7EC] dark:divide-white/[0.08] text-[13.5px]">
                {COMPARISON_ROWS.map((row, idx) => (
                  <tr
                    key={row.feature}
                    className="hover:bg-[#F7F8FA]/80 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-4 px-5 font-semibold text-[#101828] dark:text-white align-top">
                      <div className="flex items-baseline gap-2.5">
                        <span className="font-mono text-[10.5px] text-[#98A2B3] dark:text-zinc-500 shrink-0 tabular-nums">
                          0{idx + 1}
                        </span>
                        <span>{row.feature}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-[#667085] dark:text-zinc-400 border-l border-[#E4E7EC] dark:border-white/[0.08] align-top">
                      <div className="flex items-start gap-2.5">
                        <XIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0 mt-0.5" />
                        <span>{row.others}</span>
                      </div>
                    </td>
                    <td className="py-4 px-5 bg-[#0066FF]/[0.025] dark:bg-[#0066FF]/[0.06] border-l border-[#0066FF]/25 text-[#101828] dark:text-zinc-100 font-medium align-top">
                      <div className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0 mt-0.5 stroke-[2.5]" />
                        <span>{row.lshorter}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-mono text-[11px] uppercase tracking-wider text-[#667085] dark:text-zinc-400">
            50 permanent links &amp; 3 custom domains free forever
          </span>
          <WaveRevealButton
            href="/#hero-shortener"
            onClick={scrollToHeroShortener}
            variant="primary"
            size="md"
            icon={<Link2 className="w-4 h-4" />}
          >
            Test the difference — shorten a link now
          </WaveRevealButton>
        </div>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 6. USE CASES BY ROLE (4 Tabs with Concrete 1-Sentence Scenarios + Sliding Pill)
// ============================================================================
const USE_CASES = [
  {
    id: "founders",
    label: "SaaS Founders & Devs",
    code: "ROLE // 01",
    icon: Code2,
    scenario:
      "You share a staging demo of your SaaS: one link locks testers strictly inside /app/dashboard/* and automatically closes after 25 clicks.",
    bullets: [
      "Prevent beta testers from exploring unfinished routes with PathLock™",
      "Cap private invite batches with exact click limits + waitlist fallback",
      "Automate link provisioning directly from CI/CD via REST API",
    ],
    sampleLink: "go.acmesaas.io/beta-v2",
    sampleRule: "PathLock: /app/dashboard/* · Cap: 25 clicks",
  },
  {
    id: "marketers",
    label: "Affiliates & Marketers",
    code: "ROLE // 02",
    icon: Megaphone,
    scenario:
      "You run paid ads across regions: one short link routes French visitors to your FR checkout, fires Meta & TikTok pixels, and shows which post drove the sale.",
    bullets: [
      "Split-test two landing pages with weighted A/B routing on 1 link",
      "Fire Meta Ads, Google Ads & TikTok retargeting pixels automatically",
      "Connect Stripe checkouts to see exact revenue per short link",
    ],
    sampleLink: "deals.brand.co/spring",
    sampleRule: "FR → /fr-offer · A/B 50/50 · Meta Pixel ON",
  },
  {
    id: "creators",
    label: "Creators",
    code: "ROLE // 03",
    icon: Users,
    scenario:
      "You share a product link on Instagram and YouTube: iPhone followers go straight to the App Store, Android to Google Play, and you track every click live.",
    bullets: [
      "Smart OS detection routes iOS, Android, and desktop visitors automatically",
      "Custom OpenGraph cards so links look sharp on X, LinkedIn, and Discord",
      "Branded vector QR codes for merch, slides, and live events",
    ],
    sampleLink: "lsho.cc/creator-kit",
    sampleRule: "iOS → App Store · Android → Play Store",
  },
  {
    id: "agencies",
    label: "Agencies",
    code: "ROLE // 04",
    icon: Building2,
    scenario:
      "You manage campaigns for multiple clients: give every client their own verified short domain, live geo reports, and password-protected preview links.",
    bullets: [
      "Connect up to 15 custom client domains with automated DNS & SSL",
      "Export clean CSV/Excel reports for every client campaign in 1 click",
      "Protect confidential pitch decks and client previews behind a PIN gate",
    ],
    sampleLink: "go.clientbrand.com/q4",
    sampleRule: "Custom SSL · PIN Gate · CSV Telemetry Export",
  },
];

export function UseCasesSection() {
  const [activeId, setActiveId] = useState(USE_CASES[0].id);
  const current = USE_CASES.find((u) => u.id === activeId) || USE_CASES[0];

  return (
    <section className="w-full bg-[#FFFFFF] dark:bg-[#09090B] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 overflow-x-clip">
      <SectionRailFrame className="px-4 sm:px-8 py-20 sm:py-26">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="mb-8"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
            <div className="lg:col-span-7">
              <SwissSectionIndex index="06" label="WORKFLOWS" meta="4 ROLE PRESETS" />
              <h2 className="mt-4 text-[30px] sm:text-[40px] font-bold tracking-[-0.04em] leading-[1.06] text-[#09090B] dark:text-white">
                Tailored to how your team ships
              </h2>
            </div>
            <div className="lg:col-span-5 lg:text-right">
              <p className="text-[14px] text-[#475467] dark:text-zinc-400 leading-[1.55]">
                Select a workflow profile to inspect its live routing blueprint.
              </p>
            </div>
          </div>

          {/* Single-Row Tab Bar with Physically Sliding #0066FF Indicator */}
          <div className="mt-6 inline-flex flex-wrap lg:flex-nowrap gap-1 p-1 rounded-[10px] bg-[#F7F8FA] dark:bg-[#13141A] border border-[#E4E7EC] dark:border-white/10 max-w-full">
            {USE_CASES.map((tab) => {
              const Icon = tab.icon;
              const isSelected = tab.id === activeId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveId(tab.id)}
                  className={`relative px-3.5 py-2 rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-2 ${
                    isSelected
                      ? "text-white"
                      : "text-[#475467] dark:text-zinc-400 hover:text-[#101828] dark:hover:text-white"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="use-case-pill"
                      transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-[8px] bg-[#0066FF] shadow-[0_4px_14px_rgba(0,102,255,0.35)] z-0"
                    />
                  )}
                  <Icon className="w-3.5 h-3.5 relative z-10 shrink-0" />
                  <span className="relative z-10 whitespace-nowrap">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Animated Content Switchboard */}
        <AnimatePresence mode="wait">
          <motion.div
            key={current.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
            className="rounded-[10px] border border-[#E4E7EC] dark:border-white/12 bg-[#F7F8FA] dark:bg-[#0D0E12] grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-[#E4E7EC] dark:divide-white/[0.08] overflow-hidden"
          >
            <div className="lg:col-span-7 p-6 sm:p-8">
              <div className="font-mono text-[10.5px] uppercase tracking-[0.14em] text-[#0066FF] dark:text-[#5294FF] mb-3 font-bold">
                {current.code} · LIVE SCENARIO
              </div>
              <p className="text-[18px] sm:text-[21px] font-semibold tracking-[-0.02em] leading-[1.4] text-[#09090B] dark:text-white">
                &ldquo;{current.scenario}&rdquo;
              </p>
              <ul className="mt-6 space-y-2.5">
                {current.bullets.map((b) => (
                  <li
                    key={b}
                    className="flex items-start gap-2.5 text-[14px] text-[#475467] dark:text-zinc-300"
                  >
                    <Check className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0 mt-0.5" />
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-between bg-white dark:bg-[#111217]">
              <div>
                <div className="font-mono text-[10.5px] font-bold uppercase tracking-[0.14em] text-[#667085] dark:text-zinc-500 mb-2">
                  Configured Link Blueprint
                </div>
                <div className="font-mono text-[17px] font-bold text-[#0066FF] dark:text-[#5294FF] break-all">
                  {current.sampleLink}
                </div>
                <div className="mt-3 px-3.5 py-2.5 rounded-[8px] bg-[#F7F8FA] dark:bg-[#09090B] border border-[#E4E7EC] dark:border-white/[0.08] font-mono text-[12px] font-medium text-[#344054] dark:text-zinc-300">
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
                  Try this workflow — no signup
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
// 7. DEVELOPER-FIRST REST API & WEBHOOKS (#api — Real Syntax Highlighting)
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
    label: "Webhook Payload",
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
      className="w-full bg-[#F7F8FA] dark:bg-[#0B0C10] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24 overflow-x-clip"
    >
      <SectionRailFrame className="px-4 sm:px-8 py-20 sm:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Left Column: Description & Primary Button to /docs */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
            className="lg:col-span-5"
          >
            <SwissSectionIndex
              index="07"
              label="DEVELOPER API"
              meta="REST + WEBHOOKS"
            />

            <h2 className="mt-4 text-[30px] sm:text-[40px] font-bold tracking-[-0.04em] leading-[1.06] text-[#09090B] dark:text-white">
              Provision links &amp; perimeter rules directly from code
            </h2>

            <p className="mt-4 text-[15px] text-[#475467] dark:text-zinc-400 leading-[1.65]">
              Create links programmatically, enforce PathLock™ URL prefixes, set
              click caps, and stream signed conversion payloads to your backend.
            </p>

            <div className="mt-6 border-y border-[#E4E7EC] dark:border-white/[0.08] divide-y divide-[#E4E7EC] dark:divide-white/[0.08] text-[13.5px]">
              {[
                {
                  title: "SHA-256 Scoped API Keys",
                  desc: "Granular read and read_write Bearer tokens with per-minute rate limits.",
                },
                {
                  title: "Instant Global Edge KV Sync",
                  desc: "Every POST or PATCH propagates across 310+ edge PoPs immediately.",
                },
                {
                  title: "Signed Real-Time Webhooks",
                  desc: "Receive click geo, device metadata, and conversion events in real time.",
                },
              ].map((item) => (
                <div key={item.title} className="py-3 flex items-start gap-2.5">
                  <Check className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0 mt-0.5" />
                  <span className="text-[#344054] dark:text-zinc-300">
                    <strong className="text-[#101828] dark:text-white font-semibold">
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
          </motion.div>

          {/* Right Column: Syntax-Highlighted Workbench Terminal (strictly rounded-[10px]) */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.08, ease: EASE_OUT_EXPO }}
            className="lg:col-span-7"
          >
            <div className="rounded-[10px] bg-[#09090B] border border-[#222531] shadow-[0_24px_64px_rgba(0,0,0,0.35)] overflow-hidden">
              {/* Terminal Top Bar */}
              <div className="px-4 py-3 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-2 bg-[#111319]">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(Object.keys(API_SNIPPETS) as ApiLangKey[]).map((key) => {
                    const isSelected = lang === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setLang(key)}
                        className={`relative px-3 py-1.5 rounded-[7px] font-mono text-[11.5px] font-semibold transition-colors cursor-pointer ${
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
                  className="h-8 px-2.5 rounded-[7px] bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 text-zinc-200 font-mono text-[11.5px] font-medium inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy code</span>
                    </>
                  )}
                </button>
              </div>

              {/* Token-Highlighted Code Body with Line Numbers */}
              <div className="p-4 sm:p-5 overflow-x-auto bg-[#09090B]">
                <pre className="font-mono text-[12px] sm:text-[12.5px] leading-[1.7] text-zinc-200">
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

              {/* Live Edge Response Footer */}
              <div className="px-4 py-2.5 border-t border-white/[0.08] bg-[#111319] flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]">
                <span className="inline-flex items-center gap-2 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>201 Created · Edge KV synced</span>
                </span>
                <span className="text-zinc-400">
                  POST /api/v1/links · Bearer SHA-256 Auth
                </span>
              </div>
            </div>
          </motion.div>
        </div>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 8. CONDENSED PRICING PREVIEW (Swiss Architectural 3-Column Hairline Ledger)
// ============================================================================
export function PricingPreviewSection() {
  const [yearly, setYearly] = useState(true);

  const plans = [
    {
      def: PRICING_PLANS.FREE,
      badge: "Starter Free",
      highlight: false,
      cta: "Shorten free — no card",
      ctaHref: "/register",
      features: [
        "50 permanent active links",
        "10,000 tracked clicks / month",
        "3 custom branded domains + SSL",
        "PathLock™ & PIN protection",
        "Dynamic QR Code Studio",
        "30-day real-time analytics",
      ],
    },
    {
      def: PRICING_PLANS.PRO,
      badge: "Most Popular",
      highlight: true,
      cta: "Upgrade to Pro",
      ctaHref: "/pricing",
      features: [
        "1,000 active links",
        "150,000 clicks / month (+ auto-overage)",
        "6 custom branded domains",
        "Smart Geo, OS, Device & A/B Routing",
        "5 retargeting pixels (Meta, Google, TikTok)",
        "1-year analytics & Stripe attribution",
      ],
    },
    {
      def: PRICING_PLANS.BUSINESS,
      badge: "Teams & Agencies",
      highlight: false,
      cta: "Explore Business",
      ctaHref: "/pricing",
      features: [
        "Unlimited active links",
        "500,000 clicks / month (+ auto-overage)",
        "15 custom branded domains",
        "5 team seats included",
        "Unlimited retargeting pixels & webhooks",
        "Unlimited analytics retention + 600 req/min API",
      ],
    },
  ];

  return (
    <section
      id="pricing-preview"
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24 overflow-x-clip"
    >
      <SectionRailFrame className="px-4 sm:px-8 py-20 sm:py-28">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 sm:mb-12"
        >
          <div>
            <SwissSectionIndex
              index="08"
              label="PRICING"
              meta="NO CARD TO START"
            />
            <h2 className="mt-4 text-[30px] sm:text-[42px] font-bold tracking-[-0.04em] leading-[1.06] text-[#09090B] dark:text-white">
              Start free forever, scale as clicks compound
            </h2>
            <p className="mt-3 text-[15px] text-[#475467] dark:text-zinc-400">
              Transparent monthly limits backed by Cloudflare edge infrastructure.
              Upgrade or cancel anytime.
            </p>
          </div>

          {/* Monthly / Yearly Toggle */}
          <div className="inline-flex items-center gap-1 p-1 rounded-[10px] bg-[#F7F8FA] dark:bg-[#13141A] border border-[#E4E7EC] dark:border-white/10 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setYearly(false)}
              className={`px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer ${
                !yearly
                  ? "bg-white dark:bg-[#0066FF] text-[#101828] dark:text-white shadow-2xs"
                  : "text-[#667085] dark:text-zinc-400"
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setYearly(true)}
              className={`px-4 py-1.5 rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer inline-flex items-center gap-1.5 ${
                yearly
                  ? "bg-[#0066FF] text-white shadow-2xs"
                  : "text-[#667085] dark:text-zinc-400"
              }`}
            >
              <span>Yearly</span>
              <span
                className={`px-1.5 py-0.5 rounded-[4px] font-mono text-[10px] font-bold ${
                  yearly
                    ? "bg-white/20 text-white"
                    : "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                }`}
              >
                Save up to 50%
              </span>
            </button>
          </div>
        </motion.div>

        {/* Unified 3-Column Swiss Architectural Ledger (strictly rounded-[10px]) */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.48, ease: EASE_OUT_EXPO }}
          className="rounded-[10px] border border-[#D0D5DD] dark:border-white/14 bg-white dark:bg-[#0D0E12] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#E4E7EC] dark:divide-white/[0.08] overflow-hidden shadow-[0_14px_40px_rgba(16,24,40,0.05)] dark:shadow-[0_20px_54px_rgba(0,0,0,0.45)]"
        >
          {plans.map((p) => {
            const displayPrice =
              p.def.monthlyPrice === 0
                ? "$0"
                : yearly
                  ? `$${p.def.promoYearly.equivalentMonthlyPrice
                      .toFixed(2)
                      .replace(/\.00$/, "")}`
                  : `$${p.def.monthlyPrice}`;

            return (
              <div
                key={p.def.id}
                className={`relative p-6 sm:p-8 flex flex-col ${
                  p.highlight
                    ? "bg-[#0066FF]/[0.03] dark:bg-[#0066FF]/[0.07]"
                    : ""
                }`}
              >
                {p.highlight && (
                  <div
                    aria-hidden="true"
                    className="absolute top-0 inset-x-0 h-[3px] bg-[#0066FF]"
                  />
                )}

                <div className="flex items-center justify-between gap-2 mb-5">
                  <h3 className="text-[20px] font-bold tracking-[-0.02em] text-[#09090B] dark:text-white">
                    {p.def.name}
                  </h3>
                  <span
                    className={`px-2.5 py-0.5 rounded-[5px] font-mono text-[10.5px] font-bold uppercase tracking-wider ${
                      p.highlight
                        ? "bg-[#0066FF] text-white"
                        : "bg-[#F7F8FA] dark:bg-white/[0.06] border border-[#E4E7EC] dark:border-white/10 text-[#475467] dark:text-zinc-300"
                    }`}
                  >
                    {p.badge}
                  </span>
                </div>

                <div className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-[40px] font-bold tracking-[-0.045em] text-[#09090B] dark:text-white tabular-nums">
                    {displayPrice}
                  </span>
                  <span className="font-mono text-[12.5px] text-[#667085] dark:text-zinc-400">
                    / month
                  </span>
                </div>
                <p className="font-mono text-[11.5px] text-[#667085] dark:text-zinc-400 mb-6 min-h-[20px]">
                  {p.def.monthlyPrice === 0
                    ? "Free forever · No credit card required"
                    : yearly
                      ? `Billed $${p.def.yearlyPrice}/year (${p.def.promoYearly.discountPercent}% off)`
                      : `Launch offer: $${p.def.promoMonthly.firstMonthPrice.toFixed(2)}/mo for first 2 months`}
                </p>

                <ul className="space-y-2.5 text-[13.5px] text-[#344054] dark:text-zinc-300 mb-8 pt-5 border-t border-[#E4E7EC] dark:border-white/[0.08] flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <WaveRevealButton
                  href={p.ctaHref}
                  variant={p.highlight ? "primary" : "outline"}
                  size="md"
                  className="w-full"
                >
                  {p.cta}
                </WaveRevealButton>
              </div>
            );
          })}
        </motion.div>

        <div className="mt-8 text-center">
          <Link
            href="/pricing"
            className="inline-flex items-center gap-1.5 text-[14px] font-semibold text-[#0066FF] dark:text-[#5294FF] hover:underline"
          >
            <span>Compare all plans &amp; Enterprise limits</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </SectionRailFrame>
    </section>
  );
}
