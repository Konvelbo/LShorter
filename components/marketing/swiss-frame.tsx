"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { HelpCircle } from "lucide-react";

export const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function scrollToHeroShortener(e?: React.MouseEvent) {
  if (e) e.preventDefault();
  const el = document.getElementById("hero-shortener");
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
  } else {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  window.dispatchEvent(new CustomEvent("lshorter_focus_shortener"));
}

/**
 * Architectural `+` intersection crosshair rendered at Swiss rail junctions.
 */
export function CrosshairNode({
  className = "",
  darkSurface = false,
}: {
  className?: string;
  darkSurface?: boolean;
}) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none select-none inline-flex items-center justify-center w-3 h-3 font-mono text-[12px] leading-none ${
        darkSurface
          ? "text-zinc-500"
          : "text-[#98A2B3] dark:text-zinc-600"
      } ${className}`}
    >
      +
    </span>
  );
}

/**
 * Persistent Swiss 1240px architectural 1px vertical rail container with corner crosshairs.
 */
export function SectionRailFrame({
  children,
  className = "",
  darkSurface = false,
  showBottomCrosshairs = false,
}: {
  children: React.ReactNode;
  className?: string;
  darkSurface?: boolean;
  showBottomCrosshairs?: boolean;
}) {
  const railBorder = darkSurface
    ? "xl:border-x xl:border-white/[0.09]"
    : "xl:border-x xl:border-[#E4E7EC] xl:dark:border-white/[0.08]";

  return (
    <div className={`relative w-full max-w-[1240px] mx-auto ${railBorder} ${className}`}>
      <CrosshairNode
        darkSurface={darkSurface}
        className="hidden xl:inline-flex absolute -top-[6px] -left-[6.5px] z-20"
      />
      <CrosshairNode
        darkSurface={darkSurface}
        className="hidden xl:inline-flex absolute -top-[6px] -right-[6.5px] z-20"
      />
      {showBottomCrosshairs && (
        <>
          <CrosshairNode
            darkSurface={darkSurface}
            className="hidden xl:inline-flex absolute -bottom-[6px] -left-[6.5px] z-20"
          />
          <CrosshairNode
            darkSurface={darkSurface}
            className="hidden xl:inline-flex absolute -bottom-[6px] -right-[6.5px] z-20"
          />
        </>
      )}
      {children}
    </div>
  );
}

/**
 * Quiet Swiss editorial index marker (`01 / WORKFLOW`) replacing generic uppercase pill badges.
 */
export function SwissSectionIndex({
  index,
  label,
  meta,
  darkSurface = false,
}: {
  index: string;
  label: string;
  meta?: string;
  darkSurface?: boolean;
}) {
  return (
    <div
      className={`inline-flex items-center gap-2.5 font-mono text-[11px] uppercase tracking-[0.14em] ${
        darkSurface
          ? "text-zinc-400"
          : "text-[#667085] dark:text-zinc-400"
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-[2px] bg-[#0066FF] shrink-0" aria-hidden="true" />
      <span
        className={
          darkSurface
            ? "text-[#5294FF] font-semibold"
            : "text-[#0066FF] dark:text-[#5294FF] font-semibold"
        }
      >
        {index}
      </span>
      <span className={darkSurface ? "text-zinc-600" : "text-[#D0D5DD] dark:text-zinc-700"}>
        /
      </span>
      <span className={darkSurface ? "text-zinc-300" : "text-[#344054] dark:text-zinc-300"}>
        {label}
      </span>
      {meta && (
        <>
          <span
            className={`hidden sm:inline ${
              darkSurface ? "text-zinc-700" : "text-[#D0D5DD] dark:text-zinc-700"
            }`}
          >
            ·
          </span>
          <span className="hidden sm:inline opacity-75">{meta}</span>
        </>
      )}
    </div>
  );
}

/**
 * Accessible inline definition tooltip for technical terms (strictly rounded-[8px]).
 */
export function JargonTooltip({
  term,
  explanation,
}: {
  term: string;
  explanation: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <span
      className="relative inline-flex items-center gap-0.5 align-baseline"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        className="inline-flex items-center gap-1 border-b border-dashed border-[#0066FF]/60 text-[#101828] dark:text-white font-medium hover:text-[#0066FF] dark:hover:text-[#5294FF] transition-colors cursor-help"
      >
        <span>{term}</span>
        <HelpCircle className="w-3 h-3 text-[#0066FF] dark:text-[#5294FF] shrink-0" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.span
            role="tooltip"
            initial={{ opacity: 0, y: 6, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.96 }}
            transition={{ duration: 0.16 }}
            className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-64 p-2.5 rounded-[8px] bg-[#09090B] text-white text-[12px] font-normal leading-snug shadow-xl border border-white/15 text-left"
          >
            {explanation}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
