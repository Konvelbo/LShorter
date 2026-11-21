"use client";

import React, { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface WaveRevealButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "white" | "dark" | "contrast" | "default";
  size?: "sm" | "md" | "lg";
  /**
   * Enable the signature bottom-left-to-top-right blue wave expansion effect.
   * Keep `false` (default) for secondary/standard buttons; set `true` ONLY on high-priority CTAs.
   */
  wave?: boolean;
  waveColor?: string;
  icon?: React.ReactNode;
  showArrow?: boolean;
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

/* ── Arrow SVG for synchronized dual-arrow slide ── */
function FramerArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 15 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-[14px] h-[13px] shrink-0 block", className)}
    >
      <path
        d="M 14.817 7.496 L 9.192 13.796 C 8.948 14.069 8.552 14.069 8.308 13.796 C 8.064 13.522 8.064 13.079 8.308 12.805 L 12.866 7.7 L 0.625 7.7 C 0.28 7.7 0 7.387 0 7 C 0 6.614 0.28 6.3 0.625 6.3 L 12.866 6.3 L 8.308 1.196 C 8.064 0.922 8.064 0.479 8.308 0.205 C 8.552 -0.068 8.948 -0.068 9.192 0.205 L 14.817 6.505 C 14.935 6.636 15 6.815 15 7 C 15 7.186 14.935 7.364 14.817 7.496 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Primary & Standard Marketing Button (strictly capped at rounded-[10px]).
 * - Default (`wave = false`): clean, restrained hover state for standard/secondary actions.
 * - High-priority CTA (`wave = true`): tactile blue wave expanding progressively from the
 *   bottom-left corner across the entire button with deliberate entrance delay and dual-layer crest.
 */
export const WaveRevealButton = forwardRef<
  HTMLButtonElement & HTMLAnchorElement,
  WaveRevealButtonProps
>(
  (
    {
      href,
      variant = "primary",
      size = "md",
      wave = false,
      waveColor,
      icon,
      showArrow = true,
      children,
      className,
      target,
      rel,
      onClick,
      disabled,
      type = "button",
      ...rest
    },
    ref
  ) => {
    const variantStyles = {
      primary: {
        base: "bg-[#0066FF] text-white border border-[#0066FF]/70 shadow-[0_4px_14px_rgba(0,102,255,0.24)] hover:shadow-[0_8px_24px_rgba(0,102,255,0.40)] hover:border-[#3B82F6]",
        staticHover: "hover:bg-[#0055D4]",
        textHoverWave: "group-hover:text-white group-focus-visible:text-white",
        textHoverStatic: "",
        arrowDefault: "text-white",
        arrowHoverWave: "text-white",
        arrowHoverStatic: "text-white",
        waveFill: waveColor || "#003EB8",
        crestFill: "rgba(96, 165, 250, 0.72)",
      },
      default: {
        base: "bg-[#0066FF] text-white border border-[#0066FF]/70 shadow-[0_4px_14px_rgba(0,102,255,0.24)] hover:shadow-[0_8px_24px_rgba(0,102,255,0.40)] hover:border-[#3B82F6]",
        staticHover: "hover:bg-[#0055D4]",
        textHoverWave: "group-hover:text-white group-focus-visible:text-white",
        textHoverStatic: "",
        arrowDefault: "text-white",
        arrowHoverWave: "text-white",
        arrowHoverStatic: "text-white",
        waveFill: waveColor || "#003EB8",
        crestFill: "rgba(96, 165, 250, 0.72)",
      },
      white: {
        base: "bg-white text-zinc-950 border border-zinc-200 shadow-2xs hover:border-[#0066FF]",
        staticHover: "hover:bg-zinc-50 hover:border-zinc-300",
        textHoverWave: "group-hover:text-white group-focus-visible:text-white",
        textHoverStatic: "",
        arrowDefault: "text-zinc-950",
        arrowHoverWave: "text-white",
        arrowHoverStatic: "text-[#0066FF]",
        waveFill: waveColor || "#0066FF",
        crestFill: "rgba(96, 165, 250, 0.55)",
      },
      dark: {
        base: "bg-[#101828] dark:bg-[#141418] text-white border border-zinc-800 dark:border-white/15 shadow-2xs hover:border-[#0066FF]",
        staticHover: "hover:bg-[#182235] dark:hover:bg-[#1D1E25] hover:border-zinc-700",
        textHoverWave: "group-hover:text-white group-focus-visible:text-white",
        textHoverStatic: "",
        arrowDefault: "text-white",
        arrowHoverWave: "text-white",
        arrowHoverStatic: "text-[#5294FF]",
        waveFill: waveColor || "#0066FF",
        crestFill: "rgba(96, 165, 250, 0.55)",
      },
      outline: {
        base: "bg-white/95 dark:bg-white/[0.04] backdrop-blur-md text-zinc-900 dark:text-white border border-[#D0D5DD] dark:border-white/15 shadow-2xs",
        staticHover:
          "hover:bg-zinc-100/90 dark:hover:bg-white/[0.09] hover:border-zinc-400 dark:hover:border-white/25",
        textHoverWave: "group-hover:text-white group-focus-visible:text-white",
        textHoverStatic: "",
        arrowDefault: "text-zinc-700 dark:text-zinc-200",
        arrowHoverWave: "text-white",
        arrowHoverStatic: "text-[#0066FF] dark:text-[#5294FF]",
        waveFill: waveColor || "#0066FF",
        crestFill: "rgba(96, 165, 250, 0.55)",
      },
      secondary: {
        base: "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700",
        staticHover: "hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80",
        textHoverWave: "group-hover:text-white group-focus-visible:text-white",
        textHoverStatic: "",
        arrowDefault: "text-zinc-700 dark:text-zinc-200",
        arrowHoverWave: "text-white",
        arrowHoverStatic: "text-[#0066FF] dark:text-[#5294FF]",
        waveFill: waveColor || "#0066FF",
        crestFill: "rgba(96, 165, 250, 0.55)",
      },
      contrast: {
        base: "bg-[#09090B] text-white dark:bg-white dark:text-[#09090B] border border-[#09090B] dark:border-white/20 shadow-[0_4px_14px_rgba(0,0,0,0.14)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.40)]",
        staticHover: "hover:bg-zinc-800 dark:hover:bg-zinc-100",
        textHoverWave: "group-hover:text-white group-focus-visible:text-white dark:group-hover:text-white dark:group-focus-visible:text-white",
        textHoverStatic: "",
        arrowDefault: "text-white dark:text-[#09090B]",
        arrowHoverWave: "text-white",
        arrowHoverStatic: "text-white dark:text-[#09090B]",
        waveFill: waveColor || "#0066FF",
        crestFill: "rgba(96, 165, 250, 0.65)",
      },
    }[variant];

    const sizeStyles = {
      sm: "h-9 px-3.5 text-[13px] gap-2 rounded-[10px]",
      md: "h-11 px-5 text-[14px] gap-2.5 rounded-[10px]",
      lg: "h-12 px-6 text-[15px] gap-2.5 rounded-[10px]",
    }[size];

    const textHoverClass = wave
      ? variantStyles.textHoverWave
      : variantStyles.textHoverStatic;
    const arrowHoverClass = wave
      ? variantStyles.arrowHoverWave
      : variantStyles.arrowHoverStatic;

    const content = (
      <>
        {/* ── Bottom-Left Expanding Blue Wave Layer (ONLY on high-importance CTAs with wave={true}) ── */}
        {wave && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[10px]"
          >
            {/* Leading luminous wave crest: leaves bottom-left corner first (80ms delay, 900ms fluid sweep) */}
            <span
              style={{ backgroundColor: variantStyles.crestFill }}
              className={cn(
                "absolute left-0 top-full w-[228%] aspect-square rounded-[46%_54%_52%_48%/52%_44%_56%_48%] transform-gpu",
                "-translate-x-1/2 -translate-y-1/2 scale-0 rotate-[-18deg]",
                "transition-transform duration-[540ms] delay-[70ms] ease-[cubic-bezier(0.4,0,0.2,1)]",
                "group-hover:scale-[1.04] group-hover:rotate-[10deg] group-hover:duration-[900ms] group-hover:delay-[80ms] group-hover:ease-[cubic-bezier(0.42,0,0.2,1)]",
                "group-focus-visible:scale-[1.04] group-focus-visible:rotate-[10deg] group-focus-visible:duration-[900ms] group-focus-visible:delay-[80ms]",
                "motion-reduce:transition-none"
              )}
            />

            {/* Primary deep blue wave body: follows right behind (180ms delay, 1020ms fluid sweep across full button) */}
            <span
              style={{ backgroundColor: variantStyles.waveFill }}
              className={cn(
                "absolute left-0 top-full w-[228%] aspect-square rounded-[52%_48%_45%_55%/46%_54%_46%_54%] transform-gpu",
                "-translate-x-1/2 -translate-y-1/2 scale-0 rotate-[12deg]",
                "transition-transform duration-[480ms] delay-0 ease-[cubic-bezier(0.4,0,0.2,1)]",
                "group-hover:scale-[1.04] group-hover:rotate-[-6deg] group-hover:duration-[1020ms] group-hover:delay-[180ms] group-hover:ease-[cubic-bezier(0.42,0,0.2,1)]",
                "group-focus-visible:scale-[1.04] group-focus-visible:rotate-[-6deg] group-focus-visible:duration-[1020ms] group-focus-visible:delay-[180ms]",
                "motion-reduce:transition-none"
              )}
            />
          </span>
        )}

        {/* Optional Leading Icon */}
        {icon && (
          <span
            className={cn(
              "relative z-10 shrink-0 flex items-center justify-center transition-colors duration-300",
              wave && "duration-[450ms] group-hover:delay-[200ms]",
              textHoverClass
            )}
          >
            {icon}
          </span>
        )}

        {/* Text Label */}
        <span
          className={cn(
            "relative z-10 font-semibold tracking-[-0.01em] transition-colors duration-300 select-none whitespace-nowrap",
            wave && "duration-[450ms] group-hover:delay-[240ms]",
            textHoverClass
          )}
        >
          {children}
        </span>

        {/* Sliding Dual Arrow Viewport */}
        {showArrow && (
          <span className="relative z-10 w-[14px] h-[13px] overflow-hidden shrink-0 block select-none">
            <span
              className={cn(
                "absolute left-0 top-0 flex items-center gap-2 w-[36px] h-[13px] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] -translate-x-[22px] group-hover:translate-x-0 group-focus-visible:translate-x-0",
                wave && "duration-[500ms] group-hover:delay-[260ms]"
              )}
            >
              <FramerArrow className={arrowHoverClass} />
              <FramerArrow className={variantStyles.arrowDefault} />
            </span>
          </span>
        )}
      </>
    );

    const commonClasses = cn(
      "group relative isolate inline-flex items-center justify-center cursor-pointer select-none overflow-hidden transition-[background-color,border-color,box-shadow,transform,color] duration-300",
      "rounded-[10px]",
      "outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#09090B]",
      "active:scale-[0.98]",
      sizeStyles,
      variantStyles.base,
      wave
        ? "hover:border-[#0066FF] hover:shadow-[0_8px_26px_rgba(0,102,255,0.38)]"
        : variantStyles.staticHover,
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className
    );

    if (href) {
      const isInternal = href.startsWith("/") || href.startsWith("#");
      if (isInternal) {
        return (
          <Link
            ref={ref as any}
            href={href}
            onClick={onClick as any}
            className={commonClasses}
            target={target}
            rel={rel}
          >
            {content}
          </Link>
        );
      }
      return (
        <a
          ref={ref as any}
          href={href}
          onClick={onClick as any}
          className={commonClasses}
          target={target}
          rel={rel}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref as any}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={commonClasses}
        {...rest}
      >
        {content}
      </button>
    );
  }
);

WaveRevealButton.displayName = "WaveRevealButton";
export default WaveRevealButton;
