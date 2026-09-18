import React from "react";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { LandingFooter } from "@/components/marketing/landing-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] dark:bg-[#09090b] text-neutral-900 dark:text-[#fafafa] selection:bg-brand-light selection:text-brand transition-colors duration-300 font-sans">
      {/* Universal Floating Navbar across Accueil, Tarifs, API & Docs */}
      <LandingNavbar />
      <div className="flex-1 flex flex-col">
        {children}
      </div>
      {/* Universal Marketing Footer */}
      <LandingFooter />
    </div>
  );
}
