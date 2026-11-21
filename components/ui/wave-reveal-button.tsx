"use client";

import React, { forwardRef } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface WaveRevealButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "white" | "dark" | "contrast" | "default";
  size?: "sm" | "md" | "lg";
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
 * Liquid Sine-Wave Hover Button (strictly capped at rounded-[10px]).
 * On hover/focus, a crisp SVG sine-wave crest rises smoothly from the bottom edge
 * while sliding horizontally, synchronized with a dual-arrow slide and tactile press.
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
        base: "bg-[#0066FF] text-white border border-[#0066FF]/70 shadow-[0_4px_16px_rgba(0,102,255,0.28)] hover:shadow-[0_8px_26px_rgba(0,102,255,0.44)] hover:border-[#5294FF]/70",
        textHover: "group-hover:text-white group-focus-visible:text-white",
        arrowDefault: "text-white",
        arrowHover: "text-white",
        waveFill: waveColor || "#0044CC",
        crestFill: "rgba(82, 148, 255, 0.45)",
      },
      default: {
        base: "bg-[#0066FF] text-white border border-[#0066FF]/70 shadow-[0_4px_16px_rgba(0,102,255,0.28)] hover:shadow-[0_8px_26px_rgba(0,102,255,0.44)] hover:border-[#5294FF]/70",
        textHover: "group-hover:text-white group-focus-visible:text-white",
        arrowDefault: "text-white",
        arrowHover: "text-white",
        waveFill: waveColor || "#0044CC",
        crestFill: "rgba(82, 148, 255, 0.45)",
      },
      white: {
        base: "bg-white text-zinc-950 border border-zinc-200 shadow-2xs hover:border-[#0066FF] hover:shadow-[0_6px_20px_rgba(0,102,255,0.24)]",
        textHover: "group-hover:text-white group-focus-visible:text-white",
        arrowDefault: "text-zinc-950",
        arrowHover: "text-white",
        waveFill: waveColor || "#0066FF",
        crestFill: "rgba(82, 148, 255, 0.35)",
      },
      dark: {
        base: "bg-[#101828] dark:bg-[#141418] text-white border border-zinc-800 dark:border-white/15 shadow-2xs hover:border-[#0066FF] hover:shadow-[0_6px_22px_rgba(0,102,255,0.32)]",
        textHover: "group-hover:text-white group-focus-visible:text-white",
        arrowDefault: "text-white",
        arrowHover: "text-white",
        waveFill: waveColor || "#0066FF",
        crestFill: "rgba(82, 148, 255, 0.40)",
      },
      outline: {
        base: "bg-white/95 dark:bg-white/[0.04] backdrop-blur-md text-zinc-900 dark:text-white border border-[#D0D5DD] dark:border-white/15 shadow-2xs hover:border-[#0066FF] hover:shadow-[0_6px_20px_rgba(0,102,255,0.24)]",
        textHover: "group-hover:text-white group-focus-visible:text-white",
        arrowDefault: "text-zinc-700 dark:text-zinc-200",
        arrowHover: "text-white",
        waveFill: waveColor || "#0066FF",
        crestFill: "rgba(82, 148, 255, 0.35)",
      },
      secondary: {
        base: "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 hover:border-[#0066FF] hover:shadow-[0_6px_20px_rgba(0,102,255,0.22)]",
        textHover: "group-hover:text-white group-focus-visible:text-white",
        arrowDefault: "text-zinc-700 dark:text-zinc-200",
        arrowHover: "text-white",
        waveFill: waveColor || "#0066FF",
        crestFill: "rgba(82, 148, 255, 0.35)",
      },
      contrast: {
        base: "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border border-zinc-800 dark:border-white/20 shadow-2xs hover:border-[#0066FF] hover:shadow-[0_6px_22px_rgba(0,102,255,0.28)]",
        textHover: "group-hover:text-white group-focus-visible:text-white",
        arrowDefault: "text-white dark:text-zinc-950",
        arrowHover: "text-white",
        waveFill: waveColor || "#0066FF",
        crestFill: "rgba(82, 148, 255, 0.35)",
      },
    }[variant];

    const sizeStyles = {
      sm: "h-9 px-3.5 text-[13px] gap-2 rounded-[10px]",
      md: "h-11 px-5 text-[14px] gap-2.5 rounded-[10px]",
      lg: "h-12 px-6 text-[15px] gap-2.5 rounded-[10px]",
    }[size];

    const content = (
      <>
        {/* ── Liquid Sine-Wave Hover Layer (strictly clipped to rounded-[10px]) ── */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[10px]"
        >
          {/* Back translucent highlight crest (slightly delayed for real wave depth) */}
          <span
            className="absolute -left-[22%] top-[-22%] w-[150%] h-[165%] transform-gpu translate-y-[118%] translate-x-0 transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-[-8%] group-hover:translate-x-[8%] group-focus-visible:translate-y-[-8%] group-focus-visible:translate-x-[8%] motion-reduce:transition-none"
          >
            <svg
              viewBox="0 0 360 120"
              preserveAspectRatio="none"
              className="w-full h-full block"
            >
              <path
                d="M0,26 C48,6 96,44 144,24 C192,4 240,42 288,22 C318,10 342,16 360,24 L360,120 L0,120 Z"
                fill={variantStyles.crestFill}
              />
            </svg>
          </span>

          {/* Front primary liquid wave */}
          <span
            className="absolute -left-[12%] top-[-16%] w-[150%] h-[165%] transform-gpu translate-y-[115%] translate-x-0 transition-transform duration-[380ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-[-14%] group-hover:-translate-x-[10%] group-focus-visible:translate-y-[-14%] group-focus-visible:-translate-x-[10%] motion-reduce:transition-none"
          >
            <svg
              viewBox="0 0 360 120"
              preserveAspectRatio="none"
              className="w-full h-full block"
            >
              <path
                d="M0,24 C55,44 105,4 165,24 C225,44 285,4 360,22 L360,120 L0,120 Z"
                fill={variantStyles.waveFill}
              />
            </svg>
          </span>
        </span>

        {/* Optional Leading Icon */}
        {icon && (
          <span
            className={cn(
              "relative z-10 shrink-0 flex items-center justify-center transition-colors duration-300",
              variantStyles.textHover
            )}
          >
            {icon}
          </span>
        )}

        {/* Text Label */}
        <span
          className={cn(
            "relative z-10 font-semibold tracking-[-0.01em] transition-colors duration-300 select-none whitespace-nowrap",
            variantStyles.textHover
          )}
        >
          {children}
        </span>

        {/* Sliding Dual Arrow Viewport */}
        {showArrow && (
          <span className="relative z-10 w-[14px] h-[13px] overflow-hidden shrink-0 block select-none">
            <span className="absolute left-0 top-0 flex items-center gap-2 w-[36px] h-[13px] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] -translate-x-[22px] group-hover:translate-x-0 group-focus-visible:translate-x-0">
              <FramerArrow className={variantStyles.arrowHover} />
              <FramerArrow className={variantStyles.arrowDefault} />
            </span>
          </span>
        )}
      </>
    );

    const commonClasses = cn(
      "group relative isolate inline-flex items-center justify-center cursor-pointer select-none overflow-hidden transition-[border-color,box-shadow,transform,color] duration-300",
      "rounded-[10px]",
      "outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#09090B]",
      "active:scale-[0.98]",
      sizeStyles,
      variantStyles.base,
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
