"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X, Code2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function MarketingHeader() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { label: "Accueil", href: "/" },
    { label: "Tarifs", href: "/pricing" },
    {
      label: "API & SDK",
      href: "/docs",
      badge: "Docs",
    },
  ];

  return (
    <div className="sticky top-0 z-50 w-full px-3 pt-3 sm:px-6 sm:pt-4 pointer-events-none transition-all">
      {/* =========================================================================
          DESKTOP NAVBAR: Sleek Glass Effect, Minimalist Frame & Hover Animations
          ========================================================================= */}
      <header className="hidden md:flex max-w-5xl mx-auto bg-[#0a0a0f]/60 hover:bg-[#0a0a0f]/80 backdrop-blur-xl border border-white/[0.08] hover:border-white/[0.18] shadow-[0_8px_32px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)] hover:shadow-[0_12px_40px_rgba(255,102,0,0.1),inset_0_1px_0_rgba(255,255,255,0.12)] rounded-full px-5 py-2.5 items-center justify-between pointer-events-auto transition-all duration-300">
        
        {/* Brand Logo with LS Badge & Smooth Hover Scale/Glow */}
        <Link href="/" className="flex items-center gap-3 group select-none cursor-pointer">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#ff6600] to-[#ffa347] flex items-center justify-center shadow-lg shadow-[#ff6600]/30 font-bebas text-2xl text-white font-bold tracking-wider group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(255,102,0,0.6)] group-hover:rotate-3 transition-all duration-300">
            LS
          </div>
          <span className="font-bebas text-3xl text-white tracking-wider flex items-center gap-1 group-hover:tracking-widest transition-all duration-300">
            L<span className="text-[#ff6600] group-hover:drop-shadow-[0_0_12px_rgba(255,102,0,0.8)] transition-all duration-300">SHORTER</span>
          </span>
        </Link>

        {/* Center Desktop Links with Simple CSS Hover to #ffffff */}
        <nav className="flex items-center gap-1.5">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link-item ${isActive ? "active" : ""} relative px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide flex items-center gap-1.5 cursor-pointer`}
              >
                <span>{item.label}</span>
                {item.badge && (
                  <span className="px-1.5 py-0.5 rounded-[10px] bg-white/10 text-neutral-400 text-[10px] font-mono transition-colors duration-200">
                    {item.badge}
                  </span>
                )}
                {/* Active route glowing dot */}
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff6600] shadow-[0_0_8px_#ff6600]" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right CTA Actions with Simple CSS Hover to #ffffff */}
        <div className="flex items-center gap-2.5">
          <Link
            href="/login"
            className="nav-link-item text-xs font-semibold px-4 py-2 cursor-pointer"
          >
            Se connecter
          </Link>
          <Link
            href="/login"
            className="group relative overflow-hidden px-5 py-2 rounded-full bg-[#ff6600] hover:bg-[#ff771a] text-white font-bold text-xs shadow-lg shadow-[#ff6600]/30 hover:shadow-[0_0_25px_rgba(255,102,0,0.6)] hover:scale-105 active:scale-95 transition-all duration-300 flex items-center gap-1.5 cursor-pointer"
          >
            {/* Shimmer light sweep */}
            <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />
            <span>Commencer gratuitement</span>
            <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
          </Link>
        </div>
      </header>

      {/* =========================================================================
          MOBILE NAVBAR: Preserved exactly for mobile devices
          ========================================================================= */}
      <header className="flex md:hidden max-w-6xl mx-auto bg-[#0d0d12]/85 backdrop-blur-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.65),0_0_20px_rgba(0,102,255,0.12)] rounded-[10px] px-3.5 py-2 items-center justify-between pointer-events-auto transition-all duration-300">
        {/* Brand Logo with LS Badge */}
        <Link href="/" className="flex items-center gap-2.5 group select-none">
          <div className="w-8 h-8 rounded-[10px] bg-gradient-to-tr from-[#0066FF] to-[#38bdf8] flex items-center justify-center shadow-lg shadow-[#0066FF]/30 font-bebas text-xl text-white font-bold tracking-wider">
            LS
          </div>
          <span className="font-bebas text-2xl text-white tracking-wider flex items-center gap-0.5">
            L<span className="text-[#0066FF]">SHORTER</span>
          </span>
        </Link>

        {/* Right Actions (Mobile Menu Toggle Button) */}
        <div className="flex items-center">
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
        <div className="md:hidden max-w-6xl mx-auto mt-2 rounded-[10px] bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/10 shadow-2xl p-4 flex flex-col gap-2.5 animate-in slide-in-from-top-2 duration-200 pointer-events-auto">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="nav-link-item flex items-center justify-between p-2.5 rounded-[10px] text-sm font-medium"
          >
            <span>Accueil</span>
            <span className="text-xs text-neutral-500">→</span>
          </Link>
          <Link
            href="/pricing"
            onClick={() => setIsMobileMenuOpen(false)}
            className="nav-link-item flex items-center justify-between p-2.5 rounded-[10px] text-sm font-medium"
          >
            <span>Tarifs &amp; Abonnements</span>
            <span className="text-xs text-neutral-500">→</span>
          </Link>
          <Link
            href="/docs"
            onClick={() => setIsMobileMenuOpen(false)}
            className="nav-link-item flex items-center justify-between p-2.5 rounded-[10px] text-sm font-medium"
          >
            <span className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-[#0066FF]" />
              <span>Documentation API &amp; SDK</span>
            </span>
            <span className="px-1.5 py-0.5 rounded-[10px] bg-white/10 text-neutral-400 text-[10px] font-mono">
              v1
            </span>
          </Link>

          <div className="pt-3 border-t border-white/10 flex flex-col gap-2 mt-1">
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" className="w-full text-xs h-9 justify-center cursor-pointer border-[#27272a] text-white rounded-[10px] hover:text-[#ff6600] hover:border-[#ff6600]/30 hover:bg-[#ff6600]/10">
                Se connecter
              </Button>
            </Link>
            <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="glow" className="w-full text-xs h-9 justify-center font-bold cursor-pointer bg-[#0066FF] md:bg-[#ff6600] hover:bg-[#0052cc] md:hover:bg-[#ff771a] text-white border-none rounded-[10px]">
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
