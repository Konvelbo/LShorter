"use client";

import React from "react";
import { HeroTransitionSection } from "@/components/marketing/hero-transition-section";
import { FeaturesSection } from "@/components/marketing/features-section";
import { AnalyticsSection } from "@/components/marketing/analytics-section";
import { WhyUsSection } from "@/components/marketing/why-us-section";
import { FaqSection } from "@/components/marketing/faq-section";

export default function LandingPage() {
  return (
    <main className="flex flex-col">
      {/* Section 1 & Section 2: Seamless Hero -> 2nd Section Parallax Scale Transition */}
      <HeroTransitionSection />

      {/* Section 3: Alternating Features bounded by center line & 70px gap */}
      <FeaturesSection />

      {/* Section 4: Analytics with Interactive Map and 3D Cobe Globe */}
      <AnalyticsSection />

      {/* Section 5: Why Choose Us (4 GSAP Hover-Scale Cards) */}
      <WhyUsSection />

      {/* Section 6: FAQ Accordion with Over-Limit Billing Answer */}
      <FaqSection />
    </main>
  );
}
