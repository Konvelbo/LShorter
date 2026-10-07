"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { motion } from "motion/react";
import { Timeline, TimelineEntry } from "@/components/ui/timeline";

interface HighlightRow {
  key: string;
  value: string;
}

interface FeatureCardProps {
  title: string;
  lead: string;
  rows: HighlightRow[];
  screenshot?: string;
  screenshotTable?: string[];
  screenshotAlt: string;
  docHref: string;
  docLabel: string;
}

/* ── Shared animation variants ── */
const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const fadeLeft = {
  hidden: { opacity: 0, x: -14 },
  visible: { opacity: 1, x: 0 },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1 },
};

const viewport = { once: false, margin: "-60px" };

function FeatureCard({
  title,
  lead,
  rows,
  screenshot,
  screenshotAlt,
  screenshotTable,
  docHref,
  docLabel,
}: FeatureCardProps) {
  const isMultiScreenshots =
    Array.isArray(screenshotTable) && screenshotTable.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Title ── */}
      <motion.h3
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="text-[20px] sm:text-[23px] font-medium leading-[1.22] tracking-[-0.025em] text-[#111216] dark:text-[#f2f3f5] max-w-[30ch]"
      >
        {title}
      </motion.h3>

      {/* ── Lead ── */}
      <motion.p
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
        className="text-[14px] text-[#6b6f7a] dark:text-[#9a9ea8] leading-[1.65] max-w-[52ch]"
      >
        {lead}
      </motion.p>

      {/* ── Screenshots (Simple ou Double côte à côte) ── */}
      {isMultiScreenshots ? (
        <motion.div
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={viewport}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 w-full"
        >
          {screenshotTable.map((imgSrc, idx) => (
            <div
              key={idx}
              className="relative w-full overflow-hidden rounded-[10px] border border-[#c9cbd2] dark:border-[#3a3d45] bg-neutral-100 dark:bg-neutral-900 flex items-center justify-center shadow-xs"
            >
              <Image
                src={imgSrc}
                alt={`${screenshotAlt} - aperçu ${idx + 1}`}
                width={720}
                height={450}
                unoptimized
                className="w-full h-auto max-h-[340px] sm:max-h-none object-cover object-top transition-transform duration-500 ease-out hover:scale-[1.015]"
                priority={false}
              />
            </div>
          ))}
        </motion.div>
      ) : (
        screenshot && (
          <motion.div
            variants={scaleIn}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
            className="relative w-full overflow-hidden rounded-[10px] border border-[#c9cbd2] dark:border-[#3a3d45] bg-neutral-100 dark:bg-neutral-900 shadow-xs"
          >
            <Image
              src={screenshot}
              alt={screenshotAlt}
              width={960}
              height={540}
              unoptimized
              className="w-full h-auto object-cover object-top transition-transform duration-500 ease-out hover:scale-[1.012]"
              priority={false}
            />
          </motion.div>
        )
      )}

      {/* ── Spec rows ── */}
      <div>
        <div className="border-t border-[#e4e5e9] dark:border-[#26282e]" />
        {rows.map((row, idx) => (
          <motion.div
            key={idx}
            variants={fadeLeft}
            initial="hidden"
            whileInView="visible"
            viewport={viewport}
            transition={{
              duration: 0.38,
              ease: [0.22, 1, 0.36, 1],
              delay: 0.08 + idx * 0.07,
            }}
            className="grid grid-cols-[120px_minmax(0,1fr)] gap-3 py-3 border-b border-[#e4e5e9] dark:border-[#26282e]"
          >
            <dt className="text-[13.5px] font-medium text-[#111216] dark:text-[#f2f3f5]">
              {row.key}
            </dt>
            <dd className="text-[13.5px] text-[#6b6f7a] dark:text-[#9a9ea8] m-0 leading-[1.55]">
              {row.value}
            </dd>
          </motion.div>
        ))}
      </div>

      {/* ── Doc link ── */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.28 }}
      >
        <Link
          href={docHref}
          className="inline-flex items-center gap-1 text-[13.5px] text-[#111216] dark:text-[#f2f3f5] underline underline-offset-4 decoration-[#c9cbd2] dark:decoration-[#3a3d45] hover:text-blue-600 dark:hover:text-blue-400 hover:decoration-blue-600 dark:hover:decoration-blue-400 transition-all duration-200"
        >
          {docLabel}
        </Link>
      </motion.div>
    </div>
  );
}

export function TimelineFeatures() {
  const timelineData: TimelineEntry[] = [
    {
      title: "Smart Edge Routing",
      content: (
        <FeatureCard
          title="One short link, the right destination for everyone — protected your way"
          lead="Route visitors dynamically by country, continent, device, OS, browser, or weighted A/B split across 310+ Cloudflare edge PoPs. Protect with PathLock™ PIN, password gate, expiration dates, or click caps — all rules update instantly on save."
          rows={[
            {
              key: "Country",
              value:
                "Send visitors to a local page, in any market (ISO 3166-1).",
            },
            {
              key: "Continent",
              value: "Broad region targeting — Europe, APAC, Americas, Africa…",
            },
            {
              key: "Device",
              value: "iPhone to the App Store, Android to Google Play.",
            },
            {
              key: "Platform / OS",
              value: "Windows, macOS, Linux, iOS, Android — per rule.",
            },
            {
              key: "Browser",
              value: "Chrome, Safari, Firefox, Edge — fine-grain targeting.",
            },
            {
              key: "A/B split",
              value: "Test several destinations and follow results live.",
            },
            {
              key: "PathLock™ PIN",
              value: "PIN check required before the destination is exposed.",
            },
            {
              key: "Password gate",
              value: "Full URL password protection with cloaked viewer.",
            },
            {
              key: "Expiration & caps",
              value: "Auto-deactivate by date, click count, or both.",
            },
          ]}
          screenshotTable={[
            "/screenshots/dashboard/dashboardwithsidbare.png",
            "/screenshots/geo2/geo1.png",
          ]}
          screenshotAlt="LShorter Smart Edge Routing Dashboard & Geo Analytics"
          docHref="/docs/geo-routing"
          docLabel="Read the routing docs"
        />
      ),
    },
    {
      title: "Dynamic QR Studio",
      content: (
        <FeatureCard
          title="Pixel-perfect QR codes that stay editable after print"
          lead="Generate production-ready vector QR codes with 15 pixel styles, custom eye shapes, brand gradient fills, and direct SVG, PNG, or animated GIF export."
          rows={[
            {
              key: "Pixel styles",
              value: "15 patterns — Squares, Rounded, Dots, Diamonds, Stars.",
            },
            {
              key: "Eye shapes",
              value: "15 corner designs with customizable brand gradients.",
            },
            {
              key: "Export",
              value: "Direct SVG / PNG / GIF export for any resolution.",
            },
          ]}
          screenshot="/screenshots/qr-code/page1.png"
          screenshotAlt="LShorter Dynamic QR Studio"
          docHref="/docs/dynamic-qr-codes"
          docLabel="Read the QR Studio docs"
        />
      ),
    },
    {
      title: "Links & Custom Domains",
      content: (
        <FeatureCard
          title="Your brand on every link, verified in minutes"
          lead="Provision custom branded domains with automated DNS & SSL verification, then manage campaign UTM parameters and routing rules from an interactive drawer."
          rows={[
            {
              key: "Domains",
              value:
                "Custom vanity domains with automated DNS & SSL validation.",
            },
            {
              key: "Campaigns",
              value: "Full UTM tracking, tagging, and status management.",
            },
            {
              key: "Cache",
              value: "Instant edge cache invalidation across all global nodes.",
            },
          ]}
          screenshotTable={[
            "/screenshots/link-page/page1.png",
            "/screenshots/domaine/niveau.png",
          ]}
          screenshotAlt="LShorter Links & Custom Domains"
          docHref="/docs/sdk-quickstart"
          docLabel="Read the links & domains docs"
        />
      ),
    },
    {
      title: "Revenue Attribution",
      content: (
        <FeatureCard
          title="Every click traced back to a customer and a revenue"
          lead="Turn every short link into a revenue signal. Attribute clicks to Stripe checkouts and signups, map conversions city-by-city, and drill into device, OS, and browser performance — no third-party tracking required."
          rows={[
            {
              key: "Attribution",
              value: "Stripe Checkout & signup attribution via qk_cid token.",
            },
            {
              key: "Geo",
              value:
                "Interactive 2D world map with city-level conversion logs.",
            },
            {
              key: "Drilldown",
              value: "Device, OS, Browser & ISP performance breakdown.",
            },
          ]}
          screenshotTable={[
            "/screenshots/geo/geowithsidbare.png",
            "/screenshots/revenue/page1.png",
          ]}
          screenshotAlt="LShorter Revenue & Geo Analytics"
          docHref="/docs/conversion-tracking-amount-count"
          docLabel="Read the attribution docs"
        />
      ),
    },
  ];

  return (
    <section id="features" className="w-full relative scroll-mt-20">
      <Timeline
        data={timelineData}
        badge={
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            Core Platform Capabilities
          </span>
        }
        title="Engineered for Ultra-Low Latency & High Conversion"
        description="Explore the end-to-end edge architecture powering modern marketing teams, mobile applications, and enterprise links."
      />
    </section>
  );
}

// Backwards compatibility export
export { Timeline } from "@/components/ui/timeline";
