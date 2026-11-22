"use client";

import React, { useState } from "react";
import { smoothScrollTo } from "@/components/providers/smooth-scroll-provider";

export const EASE_OUT_EXPO: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Unified 1200px alignment container shared by every landing section.
 * Equal left/right edges across desktop, tablet, and mobile without decorative chrome.
 */
export function SectionRailFrame({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
  showBottomCrosshairs?: boolean;
}) {
  return (
    <div className={`max-w-[1200px] mx-auto px-5 sm:px-8 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Kept as a lightweight no-op export for compatibility; sections now lead directly
 * with their heading (no eyebrow kickers or decorative section numbers).
 */
export function CrosshairNode({ className = "" }: { className?: string }) {
  return className ? null : null;
}

export function SwissSectionIndex(_props: {
  index: string;
  label: string;
  meta?: string;
  darkOnly?: boolean;
}) {
  return null;
}

/**
 * Accessible inline tooltip for technical terms (edge PoPs, PathLock, attribution).
 */
export function JargonTooltip({
  term,
  explanation,
  darkSurface = false,
}: {
  term: string;
  explanation: string;
  darkSurface?: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-block"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className={`inline underline decoration-dotted underline-offset-4 cursor-help font-medium transition-colors focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-2 rounded-[2px] ${
          darkSurface
            ? "decoration-white/40 text-white hover:decoration-[#5294FF]"
            : "decoration-[#98A2B3] dark:decoration-zinc-500 text-inherit hover:decoration-[#0066FF]"
        }`}
        aria-label={`${term}: ${explanation}`}
      >
        {term}
      </button>
      {open && (
        <span
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 w-64 p-3 rounded-[10px] bg-[#09090B] text-white text-[12.5px] leading-relaxed border border-white/15 shadow-[0_12px_30px_rgba(0,0,0,0.35)] z-50 text-left font-normal pointer-events-none"
        >
          <span className="block font-semibold text-[#5294FF] mb-0.5">
            {term}
          </span>
          <span className="text-zinc-300">{explanation}</span>
        </span>
      )}
    </span>
  );
}

/**
 * Scrolls smoothly to the Hero shortener console and focuses its URL input.
 */
export function scrollToHeroShortener(e?: React.MouseEvent) {
  if (e) e.preventDefault();
  const el = document.getElementById("hero-shortener");
  if (el) {
    const centeredOffset = Math.min(
      -80,
      -Math.round((window.innerHeight - el.offsetHeight) / 2),
    );
    smoothScrollTo(el, { offset: centeredOffset, duration: 1.05 });
  } else {
    smoothScrollTo(0, { offset: 0, duration: 1.0 });
  }
  window.dispatchEvent(new CustomEvent("lshorter_focus_shortener"));
}
