"use client";

import React from "react";
import Link from "next/link";

export function LandingFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className="w-full border-t border-[#E7DFD5] dark:border-white/10 bg-[#FAF7F2] dark:bg-[#09090b] text-neutral-600 dark:text-neutral-400 py-12 px-4 sm:px-6 transition-colors select-none"
    >
      <div className="max-w-5xl mx-auto flex flex-col items-center justify-between gap-6">
        {/* Brand & Creator Credit */}
        <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left justify-between w-full">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0080ff] to-[#38bdf8] sm:from-[#ff6600] sm:to-[#ffa347] flex items-center justify-center font-bebas text-lg text-white font-bold shadow-md shadow-[#ff6600]/20">
              LS
            </div>
            <span className="font-bebas text-xl text-neutral-900 dark:text-white tracking-wider">
              L<span className="text-[#0080ff] sm:text-[#ff6600]">SHORTER</span>
            </span>
          </div>

          {/* Author Badge */}
          <div className="text-xs text-neutral-600 dark:text-neutral-400">
            Designed &amp; built by{" "}
            <span className="font-semibold text-neutral-900 dark:text-white">
              KONVELBO Samuel
            </span>
          </div>

          {/* Social Links (LinkedIn, Twitter/X) */}
          <div className="flex items-center gap-4">
            {/* LinkedIn */}
            <a
              href="https://www.linkedin.com/in/konvelbo-samuel-0b513225a"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="KONVELBO Samuel LinkedIn profile"
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-[#0077b5] dark:hover:text-[#0077b5] hover:border-[#0077b5]/30 transition-all cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.25c-.9 0-1.63.73-1.63 1.63s.73 1.63 1.63 1.63 1.63-.73 1.63-1.63-.73-1.63-1.63-1.63Z" />
              </svg>
            </a>

            {/* Twitter / X */}
            <a
              href="https://x.com/LUCKYMAN892688"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="KONVELBO Samuel X / Twitter profile"
              className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:border-neutral-400 dark:hover:border-white/30 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
          </div>
        </div>

        {/* Navigation Quick Links */}
        <div className="flex flex-wrap justify-center gap-6 text-xs text-neutral-500 pt-2">
          <Link
            href="/pricing"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            API &amp; Docs
          </Link>
          <a
            href="#features"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            Features
          </a>
          <a
            href="#faq"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors"
          >
            FAQ
          </a>
        </div>

        {/* Centered Copyright Text */}
        <div className="text-center text-xs text-neutral-500 pt-4 border-t border-neutral-200/60 dark:border-white/5 w-full">
          © {currentYear} LShorter. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
