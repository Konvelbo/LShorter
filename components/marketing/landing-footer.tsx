"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { ArrowUp, Sparkles, Heart } from "lucide-react";
import { motion, useInView } from "framer-motion";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();
  const footerRef = useRef<HTMLElement>(null);
  const isInView = useInView(footerRef, { once: true, margin: "-80px" });

  const scrollToTop = () => {
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        ease: "easeOut" as const,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  };

  return (
    <footer
      ref={footerRef}
      className="relative w-full border-t border-[#E7DFD5] dark:border-white/10 bg-[#FAF7F2] dark:bg-[#09090b] text-neutral-600 dark:text-neutral-400 py-12 px-4 sm:px-6 select-none overflow-hidden transition-colors"
    >
      {/* Top subtle ambient glow highlight */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-brand/50 to-transparent pointer-events-none" />

      {/* Background ambient radial glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[200px] bg-brand/5 dark:bg-brand/10 blur-[100px] rounded-full pointer-events-none" />

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        className="max-w-4xl mx-auto flex flex-col items-center justify-between gap-8 relative z-10"
      >
        {/* Row 1: Brand & Creator Credit & Social Icons */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center gap-5 text-center sm:text-left justify-between w-full"
        >
          {/* Brand Logo with interactive 3D Lift & Spin */}
          <Link
            href="/"
            className="group flex items-center gap-2.5 transition-transform duration-300 hover:scale-105 cursor-pointer"
          >
            <div className="relative">
              <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center font-bebas text-lg text-white font-bold shadow-md shadow-brand/25 transition-all duration-300 group-hover:rotate-12 group-hover:shadow-lg group-hover:shadow-brand/40 group-hover:ring-2 group-hover:ring-brand/30">
                LS
              </div>
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#FAF7F2] dark:ring-[#09090b]" />
            </div>
            <span className="font-bebas text-2xl text-neutral-900 dark:text-white tracking-wider transition-colors duration-200 group-hover:text-brand">
              L<span className="text-brand">SHORTER</span>
            </span>
          </Link>

          {/* Author Badge with interactive shimmer */}
          <div className="group flex items-center gap-1.5 text-xs text-neutral-600 dark:text-neutral-400 px-3.5 py-1.5 rounded-full bg-black/[0.03] dark:bg-white/[0.04] border border-black/5 dark:border-white/5 transition-all duration-300 hover:border-brand/30 hover:bg-brand/5 shadow-2xs">
            <span>Designed &amp; built by</span>
            <span className="font-bold text-neutral-900 dark:text-white group-hover:text-brand transition-colors duration-200 flex items-center gap-1">
              KONVELBO Samuel
              <Sparkles className="w-3.5 h-3.5 text-brand opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
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
              className="w-8.5 h-8.5 rounded-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-[#0077b5] dark:hover:text-[#0077b5] hover:border-[#0077b5]/50 hover:bg-[#0077b5]/10 hover:shadow-lg hover:shadow-[#0077b5]/20 hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer shadow-2xs"
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
              className="w-8.5 h-8.5 rounded-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-400 dark:hover:border-white/40 hover:bg-neutral-900/5 dark:hover:bg-white/10 hover:shadow-lg hover:shadow-neutral-500/20 hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer shadow-2xs"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>

            {/* Scroll to Top Button */}
            <button
              type="button"
              onClick={scrollToTop}
              title="Scroll to top"
              aria-label="Scroll to top"
              className="w-8.5 h-8.5 rounded-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-brand dark:hover:text-brand hover:border-brand/40 hover:bg-brand/10 hover:shadow-lg hover:shadow-brand/20 hover:-translate-y-1 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer shadow-2xs"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </motion.div>

        {/* Row 2: Navigation Quick Links */}
        <motion.div
          variants={itemVariants}
          className="flex flex-wrap justify-center gap-2 sm:gap-4 text-xs text-neutral-500 dark:text-neutral-400 pt-1"
        >
          <Link
            href="/pricing"
            className="px-3 py-1.5 rounded-[8px] hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand dark:hover:text-brand hover:-translate-y-0.5 transition-all duration-200 font-medium"
          >
            Pricing &amp; Plans
          </Link>
          <Link
            href="/docs"
            className="px-3 py-1.5 rounded-[8px] hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand dark:hover:text-brand hover:-translate-y-0.5 transition-all duration-200 font-medium"
          >
            API &amp; Docs
          </Link>
          <a
            href="#features"
            className="px-3 py-1.5 rounded-[8px] hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand dark:hover:text-brand hover:-translate-y-0.5 transition-all duration-200 font-medium"
          >
            Features
          </a>
          <a
            href="#faq"
            className="px-3 py-1.5 rounded-[8px] hover:bg-black/5 dark:hover:bg-white/5 hover:text-brand dark:hover:text-brand hover:-translate-y-0.5 transition-all duration-200 font-medium"
          >
            FAQ
          </a>
        </motion.div>

        {/* Row 3: Centered Copyright & Performance Note */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center text-[11px] text-neutral-500 dark:text-neutral-500 pt-5 border-t border-neutral-200/80 dark:border-white/5 w-full"
        >
          <span>© {currentYear} LShorter. All rights reserved.</span>
          <span className="flex items-center gap-1.5 text-[10.5px]">
            <span>Crafted with</span>
            <Heart className="w-3 h-3 text-rose-500 fill-rose-500/20" />
            <span>&amp; powered by Cloudflare Anycast Edge</span>
          </span>
        </motion.div>
      </motion.div>
    </footer>
  );
}
