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
  children: React.ReactNode;
  className?: string;
  target?: string;
  rel?: string;
}

/* ── Arrow SVG from Framer Wave Reveal Button component ── */
function FramerArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 15 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-[15px] h-[14px] shrink-0 block", className)}
    >
      <path
        d="M 14.817 7.496 L 9.192 13.796 C 8.948 14.069 8.552 14.069 8.308 13.796 C 8.064 13.522 8.064 13.079 8.308 12.805 L 12.866 7.7 L 0.625 7.7 C 0.28 7.7 0 7.387 0 7 C 0 6.614 0.28 6.3 0.625 6.3 L 12.866 6.3 L 8.308 1.196 C 8.064 0.922 8.064 0.479 8.308 0.205 C 8.552 -0.068 8.948 -0.068 9.192 0.205 L 14.817 6.505 C 14.935 6.636 15 6.815 15 7 C 15 7.186 14.935 7.364 14.817 7.496 Z"
        fill="currentColor"
      />
    </svg>
  );
}

/* ── Organic Wave Blob SVG from Framer Wave Reveal Button component ── */
function FramerWaveBlob({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={cn(
        "absolute pointer-events-none select-none transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform",
        className
      )}
    >
      <svg
        viewBox="0 0 15 14"
        fill="currentColor"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full block"
      >
        <path d="M 5 3.523 C 5.078 3.523 5.155 3.525 5.233 3.528 C 5.873 1.483 7.765 0 10 0 C 12.761 0 15 2.264 15 5.057 C 15 7.85 12.761 10.114 10 10.114 C 9.922 10.114 9.845 10.112 9.767 10.108 C 9.127 12.154 7.235 13.636 5 13.636 C 2.239 13.636 0 11.372 0 8.58 C 0 5.787 2.239 3.523 5 3.523 Z" />
      </svg>
    </div>
  );
}

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
      children,
      className,
      target,
      rel,
      onClick,
      disabled,
      ...rest
    },
    ref
  ) => {
    // Style configurations per variant
    const variantStyles = {
      primary: {
        base: "bg-[#0066FF] text-white border border-[#0066FF]/50 shadow-[0_4px_16px_rgba(0,102,255,0.28)] hover:shadow-[0_8px_24px_rgba(0,102,255,0.42)]",
        wave: waveColor || "text-[#0048c2]",
        textHover: "group-hover:text-white",
        arrowDefault: "text-white",
        arrowHover: "text-white",
      },
      white: {
        base: "bg-white text-zinc-950 border border-zinc-200 shadow-2xs hover:border-[#0066FF]/40 hover:shadow-[0_6px_20px_rgba(0,102,255,0.22)]",
        wave: waveColor || "text-[#0066FF]",
        textHover: "group-hover:text-white",
        arrowDefault: "text-zinc-950",
        arrowHover: "text-white",
      },
      dark: {
        base: "bg-[#101828] dark:bg-[#121217] text-white border border-zinc-800 dark:border-white/15 shadow-2xs hover:border-[#0066FF]/60 hover:shadow-[0_6px_22px_rgba(0,102,255,0.3)]",
        wave: waveColor || "text-[#0066FF]",
        textHover: "group-hover:text-white",
        arrowDefault: "text-white",
        arrowHover: "text-white",
      },
      outline: {
        base: "bg-white/90 dark:bg-white/5 backdrop-blur-md text-zinc-900 dark:text-white border border-zinc-300 dark:border-white/15 shadow-2xs hover:border-[#0066FF]/50",
        wave: waveColor || "text-[#0066FF]",
        textHover: "group-hover:text-white",
        arrowDefault: "text-zinc-800 dark:text-zinc-200",
        arrowHover: "text-white",
      },
      secondary: {
        base: "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 hover:border-[#0066FF]/50",
        wave: waveColor || "text-[#0066FF]",
        textHover: "group-hover:text-white",
        arrowDefault: "text-zinc-800 dark:text-zinc-200",
        arrowHover: "text-white",
      },
      contrast: {
        base: "bg-zinc-900 text-white dark:bg-white dark:text-zinc-950 border border-zinc-800 dark:border-white/20 shadow-2xs hover:border-[#0066FF]/60 hover:shadow-[0_6px_22px_rgba(0,102,255,0.3)]",
        wave: waveColor || "text-[#0066FF]",
        textHover: "group-hover:text-white dark:group-hover:text-white",
        arrowDefault: "text-white dark:text-zinc-950",
        arrowHover: "text-white",
      },
      default: {
        base: "bg-[#0066FF] text-white border border-[#0066FF]/50 shadow-[0_4px_16px_rgba(0,102,255,0.28)] hover:shadow-[0_8px_24px_rgba(0,102,255,0.42)]",
        wave: waveColor || "text-[#0048c2]",
        textHover: "group-hover:text-white",
        arrowDefault: "text-white",
        arrowHover: "text-white",
      },
    }[variant];

    // Strictly rounded-[10px], never exceeding 10px per user instruction
    const sizeStyles = {
      sm: "h-9 px-3.5 text-[13px] gap-2 rounded-[10px]",
      md: "h-11 px-5 text-[14px] gap-2.5 rounded-[10px]",
      lg: "h-12 px-6 text-[15px] gap-3 rounded-[10px]",
    }[size];

    const content = (
      <>
        {/* Wave Fill Background Layer (Organic Framer blob surging across on hover) */}
        <FramerWaveBlob
          className={cn(
            "w-[140px] h-[130px] -left-20 -top-24 opacity-0 scale-50",
            "group-hover:opacity-100 group-hover:scale-[3.6] group-hover:translate-x-14 group-hover:translate-y-12",
            "group-focus-visible:opacity-100 group-focus-visible:scale-[3.6] group-focus-visible:translate-x-14 group-focus-visible:translate-y-12",
            variantStyles.wave
          )}
        />

        {/* Optional Leading Icon */}
        {icon && (
          <span className="relative z-10 shrink-0 flex items-center justify-center transition-colors duration-300">
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

        {/* Sliding Dual Arrow Viewport (Exact Framer Wave Reveal: 15x14px window, 38px inner track, -23px offset) */}
        <span className="relative z-10 w-[15px] h-[14px] overflow-hidden shrink-0 block select-none">
          <span className="absolute left-0 top-0 flex items-center gap-2 w-[38px] h-[14px] transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] -translate-x-[23px] group-hover:translate-x-0 group-focus-visible:translate-x-0 will-change-transform">
            {/* Arrow 1: Slides in from the left on hover */}
            <FramerArrow className={variantStyles.arrowHover} />
            {/* Arrow 2: Visible at rest, slides out to the right on hover */}
            <FramerArrow className={variantStyles.arrowDefault} />
          </span>
        </span>
      </>
    );

    const commonClasses = cn(
      "group relative inline-flex items-center justify-center cursor-pointer select-none overflow-hidden transition-all duration-300",
      "rounded-[10px]", // Strictly 10px rounded corners
      "outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-2",
      "active:scale-[0.98] will-change-transform",
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
          target={target || "_blank"}
          rel={rel || "noopener noreferrer"}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={ref}
        type="button"
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
