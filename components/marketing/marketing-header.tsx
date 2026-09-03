"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-[#222225]/80 bg-[#09090b]/85 backdrop-blur-xl transition-all">
      <div className="max-w-7xl mx-auto h-16 sm:h-20 px-4 sm:px-6 lg:px-12 flex items-center justify-between">
        {/* Brand Logo with LS Badge */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group select-none">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-[9px] sm:rounded-[10px] bg-[#0066FF] md:bg-[#ff6600] flex items-center justify-center shadow-lg shadow-[#0066FF]/25 md:shadow-[#ff6600]/30 font-bebas text-xl sm:text-2xl text-white font-bold tracking-wider group-hover:scale-105 transition-transform">
            LS
          </div>
          <span className="font-bebas text-2xl sm:text-3xl text-white tracking-wider flex items-center gap-0.5 sm:gap-1">
            L<span className="text-[#0066FF] md:text-[#ff6600]">SHORTER</span>
          </span>
        </Link>

        {/* Center Desktop Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-neutral-300">
          <Link href="/" className="hover:text-[#ff6600] transition-colors">
            Accueil
          </Link>
          <Link href="/pricing" className="hover:text-[#ff6600] transition-colors">
            Tarifs
          </Link>
          <Link href="/docs" className="hover:text-[#ff6600] transition-colors flex items-center gap-1.5">
            <span>API &amp; SDK</span>
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-400 text-[10px] font-mono">
              Docs
            </span>
          </Link>
        </nav>

        {/* Right CTA (Desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs text-neutral-300 hover:text-white cursor-pointer">
              Se connecter
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="glow" size="sm" className="text-xs gap-1.5 font-bold cursor-pointer">
              <span>Commencer gratuitement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Right Actions (Mobile: Compact, Clean & Balanced) */}
        <div className="flex md:hidden items-center gap-2">
          <Link href="/login">
            <span className="px-2 py-1 text-xs font-semibold text-neutral-300 hover:text-white transition-colors">
              Connexion
            </span>
          </Link>
          <Link href="/login">
            <button className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#0066FF] to-[#0052cc] text-white text-xs font-bold shadow-md shadow-[#0066FF]/30 active:scale-95 transition-all flex items-center gap-1 cursor-pointer">
              <span>Commencer</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </Link>
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white active:scale-95 transition-all ml-0.5 cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Animated Dropdown Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-[#222225] bg-[#0c0c10]/95 backdrop-blur-2xl px-5 py-4 flex flex-col gap-3 animate-in slide-in-from-top-2 duration-200 shadow-2xl">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-sm font-medium text-neutral-200 hover:text-white transition-colors"
          >
            <span>Accueil</span>
            <span className="text-xs text-neutral-500">→</span>
          </Link>
          <Link
            href="/pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-sm font-medium text-neutral-200 hover:text-white transition-colors"
          >
            <span>Tarifs &amp; Abonnements</span>
            <span className="text-xs text-neutral-500">→</span>
          </Link>
          <Link
            href="/docs"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-white/5 text-sm font-medium text-neutral-200 hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#0066FF]" />
              <span>Documentation API &amp; SDK</span>
            </span>
            <span className="px-1.5 py-0.5 rounded bg-white/10 text-neutral-400 text-[10px] font-mono">
              v1
            </span>
          </Link>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2 mt-1">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full text-xs h-9 justify-center cursor-pointer border-[#27272a] text-white">
                Se connecter
              </Button>
            </Link>
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="glow" className="w-full text-xs h-9 justify-center font-bold cursor-pointer bg-[#0066FF] hover:bg-[#0052cc] text-white border-none">
                <span>Créer un compte gratuit</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
