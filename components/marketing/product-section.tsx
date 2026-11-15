"use client";

import React from "react";
import { InkOrbitFeatures } from "@/components/ui/ink-orbit-features";

export function ProductSection() {
  return (
    <section
      id="product"
      className="relative w-full py-12 sm:py-20 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#09090B] transition-colors duration-300 overflow-hidden scroll-mt-14 sm:scroll-mt-20"
    >
      <InkOrbitFeatures
        brand="LShorter"
        tag="Short Links & Edge Architecture"
        title="High-performance *short links*\nengineered for conversion."
        collaboration={{
          title: "Global Anycast Edge Network",
          description:
            "Every short link resolves at the edge location closest to your visitor in <12ms across 300+ PoPs worldwide with zero DNS lag.",
        }}
        reports={{
          title: "Real-time edge telemetry",
          description:
            "Live click distribution, unique visitors, referral sources, and UTM analytics streamed as clicks happen across global nodes.",
        }}
        integrations={{
          title: "Retargeting Pixels & Webhooks",
          description:
            "Automatically fire Meta, Google Tag, TikTok, and X pixels on every click to build high-converting audiences across paid channels.",
          tools: ["Meta Ads", "Google Tag", "TikTok Ads", "Webhooks"],
        }}
        insights={{
          title: "Conversion Velocity & Forecaster",
          description:
            "Machine intelligence tracks traffic momentum and forecasts click surges so you can scale campaigns with real confidence.",
          values: [140, 185, 220, 290, 340, 420, 490, 580, 690, 820, 950, 1140],
          forecastFrom: 8,
        }}
      />
    </section>
  );
}

export default ProductSection;
