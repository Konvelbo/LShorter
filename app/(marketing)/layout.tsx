import React from "react";
import Link from "next/link";
import { MarketingHeader } from "@/components/marketing/marketing-header";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col justify-between">
      {/* Public Topbar with Dedicated Mobile Frame */}
      <MarketingHeader />

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer */}
      <footer className="border-t border-[#222225] bg-[#0c0c0e] py-12 px-6 lg:px-12 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-[10px] bg-[#ff6600] flex items-center justify-center font-bebas text-lg text-white font-bold">
              LS
            </div>
            <span className="font-bebas text-xl text-white tracking-wider">
              L<span className="text-[#ff6600]">SHORTER</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-neutral-400">
            <Link href="/" className="hover:text-white transition-colors">
              Accueil
            </Link>
            <Link href="/pricing" className="hover:text-white transition-colors">
              Tarifs
            </Link>
            <Link href="/docs" className="hover:text-white transition-colors">
              Documentation
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 text-center md:text-right text-neutral-500">
            <p>© 2026 LShorter Inc.</p>
            <span className="hidden sm:inline">•</span>
            <p>
              Créé par{" "}
              <span className="text-neutral-300 font-semibold">KONVELBO W B Samuel B</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
