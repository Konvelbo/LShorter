"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Menu, X, Code2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-6 sm:pt-4 pointer-events-none transition-all">
      {/* Floating Glassmorphic Frame (Island Topbar) */}
      <header className="max-w-6xl mx-auto bg-[#0d0d12]/85 backdrop-blur-2xl border border-white/10 hover:border-white/20 shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_20px_rgba(0,102,255,0.12)] rounded-2xl sm:rounded-full px-3.5 py-2 sm:px-6 sm:py-2.5 flex items-center justify-between pointer-events-auto transition-all duration-300">
        
        {/* Brand Logo with LS Badge */}
        <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group select-none">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-full bg-gradient-to-tr from-[#0066FF] to-[#38bdf8] md:from-[#ff6600] md:to-[#ff9933] flex items-center justify-center shadow-lg shadow-[#0066FF]/30 md:shadow-[#ff6600]/30 font-bebas text-xl sm:text-2xl text-white font-bold tracking-wider group-hover:scale-105 transition-transform">
            LS
          </div>
          <span className="font-bebas text-2xl sm:text-3xl text-white tracking-wider flex items-center gap-0.5 sm:gap-1">
            L<span className="text-[#0066FF] md:text-[#ff6600]">SHORTER</span>
          </span>
        </Link>

        {/* Center Desktop Links (Capsule Pills) */}
        <nav className="hidden md:flex items-center gap-1 text-xs font-semibold text-neutral-300 bg-white/[0.03] border border-white/5 rounded-full px-3 py-1">
          <Link href="/" className="px-3 py-1 rounded-full hover:bg-white/10 hover:text-white transition-all">
            Accueil
          </Link>
          <Link href="/pricing" className="px-3 py-1 rounded-full hover:bg-white/10 hover:text-white transition-all">
            Tarifs
          </Link>
          <Link href="/docs" className="px-3 py-1 rounded-full hover:bg-white/10 hover:text-white transition-all flex items-center gap-1.5">
            <span>API &amp; SDK</span>
            <span className="px-1.5 py-0.2 rounded bg-white/10 text-neutral-400 text-[10px] font-mono">
              Docs
            </span>
          </Link>
        </nav>

        {/* Right CTA (Desktop) */}
        <div className="hidden md:flex items-center gap-2.5">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="text-xs text-neutral-300 hover:text-white rounded-full cursor-pointer">
              Se connecter
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="glow" size="sm" className="text-xs gap-1.5 font-bold rounded-full px-4 shadow-lg shadow-[#ff6600]/30 cursor-pointer">
              <span>Commencer gratuitement</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>

        {/* Right Actions (Mobile: Ultra-Clean Minimal Menu Button) */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-neutral-300 hover:text-white active:scale-95 transition-all cursor-pointer shadow-sm"
            aria-label="Ouvrir le menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Animated Floating Dropdown Frame */}
      {isMobileMenuOpen && (
        <div className="md:hidden max-w-6xl mx-auto mt-2 rounded-2xl bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-4 flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-200 pointer-events-auto">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-sm font-medium text-neutral-200 hover:text-white transition-colors"
          >
            <span>Accueil</span>
            <span className="text-xs text-neutral-500">→</span>
          </Link>
          <Link
            href="/pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-sm font-medium text-neutral-200 hover:text-white transition-colors"
          >
            <span>Tarifs &amp; Abonnements</span>
            <span className="text-xs text-neutral-500">→</span>
          </Link>
          <Link
            href="/docs"
            onClick={() => setIsMobileMenuOpen(false)}
            className="flex items-center justify-between p-2.5 rounded-xl hover:bg-white/5 text-sm font-medium text-neutral-200 hover:text-white transition-colors"
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
              <Button variant="outline" className="w-full text-xs h-9 justify-center cursor-pointer border-[#27272a] text-white rounded-xl">
                Se connecter
              </Button>
            </Link>
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="glow" className="w-full text-xs h-9 justify-center font-bold cursor-pointer bg-[#0066FF] hover:bg-[#0052cc] text-white border-none rounded-xl">
                <span>Créer un compte gratuit</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
