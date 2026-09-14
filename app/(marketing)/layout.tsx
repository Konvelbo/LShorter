import React from "react";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { LandingFooter } from "@/components/marketing/landing-footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] dark:bg-[#09090b] text-neutral-900 dark:text-[#fafafa] selection:bg-[#0080ff]/20 selection:text-[#0080ff] sm:selection:bg-[#ff6600]/20 sm:selection:text-[#ff6600] transition-colors duration-300 font-sans">
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
