import React from "react";
import Link from "next/link";
import { Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa] flex flex-col justify-between">
      {/* Public Topbar */}
      <header className="h-20 px-6 lg:px-12 border-b border-[#222225] bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-[10px] bg-[#ff6600] flex items-center justify-center shadow-lg shadow-[#ff6600]/30 font-bebas text-2xl text-white font-bold tracking-wider">
            QL
          </div>
          <span className="font-bebas text-2xl text-white tracking-wider flex items-center gap-1">
            L<span className="text-[#ff6600]">SHORTER</span>
          </span>
        </Link>

        {/* Center Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-neutral-300">
          <Link href="/" className="hover:text-[#ff6600] transition-colors">
            Accueil
          </Link>
          <Link href="/pricing" className="hover:text-[#ff6600] transition-colors">
            Tarifs
          </Link>
          <Link href="/docs" className="hover:text-[#ff6600] transition-colors flex items-center gap-1.5">
            <span>API & SDK</span>
            <span className="px-1.5 py-0.2 rounded bg-white/10 text-neutral-400 text-[10px]">
              Docs
            </span>
          </Link>
        </nav>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs">
              Se connecter
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="glow" size="sm" className="text-xs gap-1.5 font-bold">
              <span>Commencer gratuitement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer */}
      <footer className="border-t border-[#222225] bg-[#0c0c0e] py-12 px-6 lg:px-12 text-xs text-neutral-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-[8px] bg-[#ff6600] flex items-center justify-center font-bebas text-lg text-white font-bold">
              QL
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
            <Link href="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
          </div>

          <p>© 2026 LShorter Inc. Propulsé par Cloudflare Edge Workers & D1.</p>
        </div>
      </footer>
    </div>
  );
}
