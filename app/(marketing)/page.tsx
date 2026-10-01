"use client";

import React from "react";
import { HeroSection } from "@/components/marketing/hero-section2";
import { ProductSection } from "@/components/marketing/product-section";
import { TimelineFeatures } from "@/components/ui/timeline-features";
import { SecuritySection } from "@/components/marketing/security-section";
import { WhyUsSection } from "@/components/marketing/why-us-section";
import { AnalyticsSection } from "@/components/marketing/analytics-section";
import { FaqSection } from "@/components/marketing/faq-section";

export default function LandingPage() {
  return (
    <main className="flex flex-col w-full max-w-full bg-[#FFFFFF] dark:bg-[#09090B] transition-colors duration-300">
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
