"use client";

import React from "react";
import dynamic from "next/dynamic";
import { HeroTransitionSection } from "@/components/marketing/hero-transition-section";
import { FeaturesSection } from "@/components/marketing/features-section";

const WobbleCardSection = dynamic(
  () => import("@/components/marketing/wobble-card-section").then((mod) => mod.WobbleCardSection),
  { ssr: true }
);

const AnalyticsSection = dynamic(
  () => import("@/components/marketing/analytics-section").then((mod) => mod.AnalyticsSection),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-96 flex items-center justify-center bg-transparent">
        <div className="w-8 h-8 rounded-full border-2 border-brand border-t-transparent animate-spin" />
      </div>
    ),
  }
);

const WhyUsSection = dynamic(
  () => import("@/components/marketing/why-us-section").then((mod) => mod.WhyUsSection),
  { ssr: true }
);

const FaqSection = dynamic(
  () => import("@/components/marketing/faq-section").then((mod) => mod.FaqSection),
  { ssr: true }
);

export default function LandingPage() {
  return (
    <main className="flex flex-col w-full max-w-full overflow-x-clip">
      {/* Section 1 & Section 2: Seamless Hero -> 2nd Section Parallax Scale Transition */}
      <HeroTransitionSection />

      {/* Section 3: Alternating Features bounded by center line & 70px gap */}
      <FeaturesSection />

      {/* Section 4: Modern Bento Wobble Card Grid */}
      <WobbleCardSection />

      {/* Section 5: Analytics with Interactive Map and 3D Cobe Globe */}
      <AnalyticsSection />

      {/* Section 6: Why Choose Us (4 GSAP Hover-Scale Cards) */}
      <WhyUsSection />

      {/* Section 7: FAQ Accordion with Over-Limit Billing Answer */}
      <FaqSection />
    </main>
  );
}

