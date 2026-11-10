import React from "react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { HeroSection } from "@/components/marketing/hero-section2";
import { FaqStructuredData } from "@/components/seo/json-ld";

export const metadata: Metadata = {
  title: "Enterprise Edge URL Shortener, Smart Routing & QR Code Studio",
  description:
    "Infrastructure de gestion de liens et routage edge haute performance (<15ms). Routage géographique dynamique, protection PathLock™ (verrouillage de chemin par code PIN), domaines personnalisés et attribution de conversion en temps réel.",
  keywords: [
    "raccourccisseur de lien",
    "raccourcisseur de lien",
    "link shorter",
    "link shortener",
    "path lock",
    "pathlock",
    "verrouillage de chemin",
    "verrouillage de lien",
    "lien protégé par mot de passe",
    "lien sécurisé",
    "protection de lien",
    "password protected link",
    "URL shortener",
    "URL shorter",
    "réducteur de lien",
    "raccourcisseur d'url",
    "smart routing",
    "edge redirect",
    "dynamic QR codes",
    "bitly alternative",
    "alternative bitly",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "LShorter — Enterprise Edge URL Shortener & Smart Routing",
    description:
      "Raccourcisseur de lien edge sous 15ms, routage dynamique par pays/appareil, protection PathLock™ (verrouillage de chemin) et analytics de conversion.",
    url: "/",
    images: ["/api/og?title=LShorter&desc=Edge+URL+Shortener+%26+Smart+Routing"],
  },
};

const ProductSection = dynamic(
  () => import("@/components/marketing/product-section").then((m) => m.ProductSection),
  { ssr: true }
);
const TimelineFeatures = dynamic(
  () => import("@/components/ui/timeline-features").then((m) => m.TimelineFeatures),
  { ssr: true }
);
const SecuritySection = dynamic(
  () => import("@/components/marketing/security-section").then((m) => m.SecuritySection),
  { ssr: true }
);
const WhyUsSection = dynamic(
  () => import("@/components/marketing/why-us-section").then((m) => m.WhyUsSection),
  { ssr: true }
);
const AnalyticsSection = dynamic(
  () => import("@/components/marketing/analytics-section").then((m) => m.AnalyticsSection),
  { ssr: true }
);
const FaqSection = dynamic(
  () => import("@/components/marketing/faq-section").then((m) => m.FaqSection),
  { ssr: true }
);

export default function LandingPage() {
  return (
    <main className="flex flex-col w-full max-w-full bg-[#FFFFFF] dark:bg-[#09090B] transition-colors duration-300">
      <FaqStructuredData />
      {/* 1. Hero Section (Ecosystem Overview + Replaceable Dashboard Showcase Image) */}
      <HeroSection />

      {/* 2. Product Section (#product — Interactive Desktop SaaS Iframe + GSAP Collapsible Link Drawer) */}
      <ProductSection />

      {/* 3. Features Section (#features — Core Platform Capabilities routing to /docs/[slug]) */}
      <TimelineFeatures />

      {/* 4. Security & Speed Section (#security — SOC 2, PathLock™ PIN Gate & <12ms API Latency) */}
      <SecuritySection />

      {/* 5. Why Us & Integrations (#why-us — Differentiation Matrix + Aceternity CanvasRevealEffect Cards) */}
      <WhyUsSection />

      {/* 6. Geographic Intelligence Map (#analytics — 2D World Localization & City/ISP Drilldown) */}
      <AnalyticsSection />

      {/* 7. FAQ Accordion (#faq — GSAP Animated, followed by Footer in layout.tsx) */}
      <FaqSection />
    </main>
  );
}
