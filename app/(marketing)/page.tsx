import React from "react";
import type { Metadata } from "next";
import { HeroSection } from "@/components/marketing/hero-section2";
import { DemoVideoSection } from "@/components/marketing/demo-video-section";
import {
  TrustStripSection,
  HowItWorksSection,
  FeaturesBentoSection,
  PathLockFocusSection,
  DifferenceSection,
  UseCasesSection,
  DeveloperApiSection,
  PricingPreviewSection,
} from "@/components/marketing/landing-sections";
import { FaqSection } from "@/components/marketing/faq-section";
import { FaqStructuredData } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Short Links You Actually Control | Smart Routing & PathLock™",
  description:
    "Sub-12ms edge URL shortener across 310+ Cloudflare PoPs. Route visitors by country or device, lock private SaaS demos with PathLock™, cap link clicks, and attribute Stripe revenue in real time.",
  keywords: [
    "URL shortener",
    "link shortener",
    "smart link routing",
    "PathLock",
    "password protected link",
    "click limit link",
    "dynamic QR code studio",
    "custom branded short domains",
    "Stripe revenue attribution",
    "Bitly alternative",
    "edge redirect",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LShorter — Short Links You Actually Control",
    description:
      "Send every visitor to the right page in under 12ms, lock private demos with PathLock™, cap total clicks, and track conversions without third-party cookies.",
    url: "/",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "LShorter — Edge URL Shortener, Smart Routing & PathLock",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LShorter — Short Links You Actually Control",
    description:
      "Sub-12ms edge redirects, PathLock™ perimeter locking, click caps, dynamic QR studio, and real-time analytics.",
    images: ["/og-image.png"],
  },
};

export default function LandingPage() {
  return (
    <main className="flex flex-col w-full max-w-full bg-[#FFFFFF] dark:bg-[#09090B] transition-colors duration-300">
      <FaqStructuredData />

      {/* 1. Uncluttered Hero + Live Guest Link Shortener Console */}
      <HeroSection />

      {/* 2. Verifiable Trust Strip */}
      <TrustStripSection />

      {/* 3. How It Works (3 Steps with Scroll-Drawn Flow Line) */}
      <HowItWorksSection />

      {/* 4. Dedicated 6-Minute Walkthrough Video (#demo-video) */}
      <DemoVideoSection />

      {/* 5. Core Features Bento Grid (#features — Routing, Click Caps, Attribution, QR Studio, Branded Domains + Namecheap, PIN Gate) */}
      <FeaturesBentoSection />

      {/* 6. Signature Focus: PathLock™ Perimeter Security (#pathlock) */}
      <PathLockFocusSection />

      {/* 7. The LShorter Difference (#difference — Direct Comparison vs Traditional Shorteners) */}
      <DifferenceSection />

      {/* 8. Use Cases by Profile (4 Role Tabs with Concrete 1-Sentence Scenarios) */}
      <UseCasesSection />

      {/* 9. Developer-First REST API & Webhooks (#api — Interactive Code Terminal + Docs CTA) */}
      <DeveloperApiSection />

      {/* 10. Condensed Pricing Preview (Real Starter / Pro / Business Plans) */}
      <PricingPreviewSection />

      {/* 11. Practical FAQ Accordion (#faq — followed by Final CTA & Footer in layout.tsx) */}
      <FaqSection />
    </main>
  );
}
