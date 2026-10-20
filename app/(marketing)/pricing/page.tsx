import React from "react";
import type { Metadata } from "next";
import PricingPageContent from "@/app/(dashboard)/dashboard/pricing/page";

export const metadata: Metadata = {
  title: "Pricing & Enterprise Plans",
  description:
    "Transparent pricing for high-scale teams. Starts free with 5,000 clicks/mo. Pro at $9/mo and Business at $29/mo with custom branded domains and edge routing.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "LShorter Pricing — Flexible Plans for Developers and Teams",
    description:
      "Choose the right plan for high-scale link infrastructure. Custom domains, geo-routing, and SLA available.",
    url: "/pricing",
    images: [
      "/api/og?title=Pricing+%26+Plans&desc=Transparent+plans+for+teams+scaling+edge+links",
    ],
  },
};

export default function PublicPricingPage() {
  return (
    <div className="pt-24 sm:pt-28 pb-16 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto w-full">
      <PricingPageContent />
    </div>
  );
}
