"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUp, Sparkles } from "lucide-react";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();
  const [isVisible, setIsVisible] = useState(false);
  const footerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.15 }
    );

    if (footerRef.current) {
      observer.observe(footerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <footer
      ref={footerRef}
      className={`relative w-full border-t border-[#E7DFD5] dark:border-white/10 bg-[#FAF7F2] dark:bg-[#09090b] text-neutral-600 dark:text-neutral-400 py-10 px-4 sm:px-6 transition-all duration-700 select-none overflow-hidden ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
    >
      {/* Top subtle ambient glow highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-brand/40 to-transparent pointer-events-none" />

      <div className="max-w-4xl mx-auto flex flex-col items-center justify-between gap-6 relative z-10">
        {/* Brand & Creator Credit & Social */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left justify-between w-full">
          {/* Brand Logo with interactive 3D Lift & Spin */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-105 cursor-pointer"
          >
            <div className="relative">
              <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center font-bebas text-lg text-white font-bold shadow-md shadow-brand/25 transition-all duration-300 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-brand/40 group-hover:ring-2 group-hover:ring-brand/30">
                LS
              </div>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#FAF7F2] dark:ring-[#09090b]" />
            </div>
            <span className="font-bebas text-xl text-neutral-900 dark:text-white tracking-wider transition-colors duration-200 group-hover:text-brand">
              L<span className="text-brand">SHORTER</span>
            </span>
          </Link>

          {/* Author Badge with interactive shimmer */}
          <div className="group flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 px-3 py-1 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 transition-all duration-300 hover:border-brand/30 hover:bg-brand/5">
            <span>Designed &amp; built by</span>
            <span className="font-bold text-neutral-900 dark:text-white group-hover:text-brand transition-colors duration-200 flex items-center gap-1">
              KONVELBO Samuel
              <Sparkles className="w-3 h-3 text-brand opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </span>
          </div>

          {/* Social Links (LinkedIn, Twitter/X, and Back-to-Top) */}
          <div className="flex items-center gap-2.5">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/konvelbo-samuel-0b513225a"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="KONVELBO Samuel LinkedIn profile"
              className="w-8 h-8 rounded-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-[#0077b5] dark:hover:text-[#0077b5] hover:border-[#0077b5]/50 hover:bg-[#0077b5]/10 hover:shadow-lg hover:shadow-[#0077b5]/20 hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63-.73-1.63-1.63Z" />
              </svg>
            </a>

            {/* Twitter / X */}
            <a
              href="https://x.com/LUCKYMAN892688"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="KONVELBO Samuel X / Twitter profile"
              className="w-8 h-8 rounded-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-400 dark:hover:border-white/40 hover:bg-neutral-900/5 dark:hover:bg-white/10 hover:shadow-lg hover:shadow-neutral-500/20 hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Scroll to Top Button */}
            <button
              type="button"
              onClick={scrollToTop}
              title="Retour en haut"
              aria-label="Scroll to top"
              className="w-8 h-8 rounded-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-brand dark:hover:text-brand hover:border-brand/40 hover:bg-brand/10 hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer"
            >
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Navigation Quick Links with interactive hover pills */}
        <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs text-neutral-500 dark:text-neutral-400 pt-1">
          <Link
            href="/pricing"
            className="px-2.5 py-1 rounded-[8px] hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand dark:hover:text-brand hover:-translate-y-0.5 transition-all duration-200 font-medium"
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            className="px-2.5 py-1 rounded-[8px] hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand dark:hover:text-brand hover:-translate-y-0.5 transition-all duration-200 font-medium"
          >
            API &amp; Docs
          </Link>
          <a
            href="#features"
            className="px-2.5 py-1 rounded-[8px] hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand dark:hover:text-brand hover:-translate-y-0.5 transition-all duration-200 font-medium"
          >
            Features
          </a>
          <a
            href="#faq"
            className="px-2.5 py-1 rounded-[8px] hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand dark:hover:text-brand hover:-translate-y-0.5 transition-all duration-200 font-medium"
          >
            FAQ
          </a>
        </div>

        {/* Centered Copyright Text */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-center text-[11px] text-neutral-500 dark:text-neutral-500 pt-4 border-t border-neutral-200/80 dark:border-white/5 w-full">
          <span>© {currentYear} LShorter. All rights reserved.</span>
          <span className="flex items-center gap-1 text-[10.5px]">
            Crafted with precision &amp; high performance
          </span>
        </div>
      </div>
    </footer>
  );
}
