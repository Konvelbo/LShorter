"use client";

import React, { forwardRef, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface WaveRevealButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "white"
    | "dark"
    | "contrast"
    | "default";
  size?: "sm" | "md" | "lg";
  /**
   * Enable the Framer Motion liquid Wave Reveal effect on hover/focus.
   * Keep `false` (default) for secondary/standard buttons; set `true` on primary CTAs.
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

const FRAMER_WAVE_ENTER_TRANSITION = {
  duration: 0.6,
  ease: [0.22, 1, 0.36, 1] as const,
};

const FRAMER_WAVE_EXIT_TRANSITION = {
  duration: 0.48,
  ease: [0.32, 0.08, 0.24, 1] as const,
};

const FRAMER_ARROW_PATH =
  "M 14.817 7.496 L 9.192 13.796 C 8.948 14.069 8.552 14.069 8.308 13.796 C 8.064 13.522 8.064 13.079 8.308 12.805 L 12.866 7.7 L 0.625 7.7 C 0.28 7.7 0 7.387 0 7 C 0 6.614 0.28 6.3 0.625 6.3 L 12.866 6.3 L 8.308 1.196 C 8.064 0.922 8.064 0.479 8.308 0.205 C 8.552 -0.068 8.948 -0.068 9.192 0.205 L 14.817 6.505 C 14.935 6.636 15 6.815 15 7 C 15 7.186 14.935 7.364 14.817 7.496 Z";

/**
 * Lush convex liquid-wave crest (`viewBox="0 0 72 100"`), matching the organic curved
 * profile of Framer's Wave Reveal Button.
 *
 * Translated at a fixed 1:1 scale via Framer Motion (`x: "-102%" -> "0%"`) alongside a
 * seamless `flex-1` solid backing instead of non-uniform `scaleX`/`scaleY` scaling on an
 * oversized SVG — eliminating Chromium's 256px GPU tile tearing / vertical-stripe stutter
 * while preserving the exact liquid wave sweep and instant mid-flight reversal.
 */
const LIQUID_WAVE_EDGE_PATH = "M 0 0 L 72 0 C 68 38, 42 78, 0 100 Z";

function StaticArrow({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 15 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("w-[15px] h-[14px] shrink-0 block", className)}
    >
      <path d={FRAMER_ARROW_PATH} fill="currentColor" />
    </svg>
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
      onPointerEnter,
      onPointerLeave,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onFocus,
      onBlur,
      ...rest
    },
    forwardedRef
  ) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const setRefs = (node: HTMLElement | null) => {
      if (typeof forwardedRef === "function") {
        forwardedRef(node as HTMLButtonElement & HTMLAnchorElement);
      } else if (forwardedRef) {
        (
          forwardedRef as React.MutableRefObject<
            (HTMLButtonElement & HTMLAnchorElement) | null
          >
        ).current = node as HTMLButtonElement & HTMLAnchorElement;
      }
    };

    const isWaveActive = wave && (isHovered || isPressed);
    const activeTransition = isWaveActive
      ? FRAMER_WAVE_ENTER_TRANSITION
      : FRAMER_WAVE_EXIT_TRANSITION;

    const variantStyles = {
      primary: {
        base: "bg-[#0066FF] text-white border border-[#0066FF] shadow-[0_4px_14px_rgba(0,102,255,0.24)] hover:shadow-[0_8px_24px_rgba(0,66,195,0.40)]",
        staticHover: "hover:bg-[#0052CC] hover:border-[#0052CC]",
        textActive: "text-white",
        arrowDefaultText: "text-white",
        arrowHoverText: "text-white",
        arrowHoverStatic: "text-white",
        waveFill: waveColor || "#002E99",
      },
      default: {
        base: "bg-[#0066FF] text-white border border-[#0066FF] shadow-[0_4px_14px_rgba(0,102,255,0.24)] hover:shadow-[0_8px_24px_rgba(0,66,195,0.40)]",
        staticHover: "hover:bg-[#0052CC] hover:border-[#0052CC]",
        textActive: "text-white",
        arrowDefaultText: "text-white",
        arrowHoverText: "text-white",
        arrowHoverStatic: "text-white",
        waveFill: waveColor || "#002E99",
      },
      white: {
        base: "bg-white text-black border border-zinc-200 shadow-2xs",
        staticHover: "hover:bg-zinc-50 hover:border-zinc-300",
        textActive: "text-white",
        arrowDefaultText: "text-black",
        arrowHoverText: "text-white",
        arrowHoverStatic: "text-[#0066FF]",
        waveFill: waveColor || "#0066FF",
      },
      dark: {
        base: "bg-[#101828] dark:bg-[#141418] text-white border border-zinc-800 dark:border-white/15 shadow-2xs",
        staticHover:
          "hover:bg-[#182235] dark:hover:bg-[#1D1E25] hover:border-zinc-700",
        textActive: "text-white",
        arrowDefaultText: "text-white",
        arrowHoverText: "text-white",
        arrowHoverStatic: "text-[#5294FF]",
        waveFill: waveColor || "#0066FF",
      },
      outline: {
        base: "bg-white/95 dark:bg-white/[0.04] backdrop-blur-md text-zinc-900 dark:text-white border border-[#D0D5DD] dark:border-white/15 shadow-2xs",
        staticHover:
          "hover:bg-zinc-100/90 dark:hover:bg-white/[0.09] hover:border-zinc-400 dark:hover:border-white/25",
        textActive: "text-white",
        arrowDefaultText: "text-zinc-700 dark:text-zinc-200",
        arrowHoverText: "text-white",
        arrowHoverStatic: "text-[#0066FF] dark:text-[#5294FF]",
        waveFill: waveColor || "#0066FF",
      },
      secondary: {
        base: "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700",
        staticHover: "hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80",
        textActive: "text-white",
        arrowDefaultText: "text-zinc-700 dark:text-zinc-200",
        arrowHoverText: "text-white",
        arrowHoverStatic: "text-[#0066FF] dark:text-[#5294FF]",
        waveFill: waveColor || "#0066FF",
      },
      contrast: {
        base: "bg-[#09090B] text-white dark:bg-white dark:text-black border border-[#09090B] dark:border-white/20 shadow-[0_4px_14px_rgba(0,0,0,0.14)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.40)]",
        staticHover: "hover:bg-zinc-800 dark:hover:bg-zinc-100",
        textActive: "text-white dark:text-white",
        arrowDefaultText: "text-white dark:text-black",
        arrowHoverText: "text-white",
        arrowHoverStatic: "text-white dark:text-black",
        waveFill: waveColor || "#0066FF",
      },
    }[variant];

    const sizeStyles = {
      sm: "h-9 px-3.5 text-[13px] gap-2 rounded-[10px]",
      md: "h-11 px-5 text-[14px] gap-2.5 rounded-[10px]",
      lg: "h-12 px-6 text-[15px] gap-3 rounded-[10px]",
    }[size];

    const interactionHandlers = wave
      ? {
          onPointerEnter: (e: React.PointerEvent<any>) => {
            if (e.pointerType !== "touch") setIsHovered(true);
            onPointerEnter?.(e);
          },
          onPointerLeave: (e: React.PointerEvent<any>) => {
            setIsHovered(false);
            setIsPressed(false);
            onPointerLeave?.(e);
          },
          onPointerDown: (e: React.PointerEvent<any>) => {
            setIsPressed(true);
            onPointerDown?.(e);
          },
          onPointerUp: (e: React.PointerEvent<any>) => {
            setIsPressed(false);
            onPointerUp?.(e);
          },
          onPointerCancel: (e: React.PointerEvent<any>) => {
            setIsPressed(false);
            onPointerCancel?.(e);
          },
          onFocus: (e: React.FocusEvent<any>) => {
            if (e.currentTarget.matches(":focus-visible")) setIsHovered(true);
            onFocus?.(e);
          },
          onBlur: (e: React.FocusEvent<any>) => {
            setIsHovered(false);
            setIsPressed(false);
            onBlur?.(e);
          },
        }
      : {
          onPointerEnter,
          onPointerLeave,
          onPointerDown,
          onPointerUp,
          onPointerCancel,
          onFocus,
          onBlur,
        };

    const content = (
      <>
        {/* ── Framer Motion 1:1 GPU Liquid Wave Sweep (zero scaleX tile tearing) ── */}
        {wave && (
          <motion.span
            aria-hidden="true"
            initial={false}
            animate={{ x: isWaveActive ? "0%" : "-102%" }}
            transition={activeTransition}
            style={{
              willChange: "transform",
              backfaceVisibility: "hidden",
            }}
            className="pointer-events-none absolute -top-[2px] -bottom-[2px] -left-[2px] z-[1] flex w-[calc(100%+76px)]"
          >
            <span
              style={{ backgroundColor: variantStyles.waveFill }}
              className="block h-full flex-1"
            />
            <svg
              viewBox="0 0 72 100"
              preserveAspectRatio="none"
              xmlns="http://www.w3.org/2000/svg"
              className="block h-full w-[72px] shrink-0 -ml-[2px]"
            >
              <path d={LIQUID_WAVE_EDGE_PATH} fill={variantStyles.waveFill} />
            </svg>
          </motion.span>
        )}

        {/* Optional Leading Icon */}
        {icon &&
          (wave ? (
            <motion.span
              initial={false}
              animate={{ scale: isPressed ? 0.95 : 1 }}
              transition={activeTransition}
              className={cn(
                "relative z-[2] shrink-0 flex items-center justify-center transition-colors duration-300",
                isWaveActive && variantStyles.textActive
              )}
            >
              {icon}
            </motion.span>
          ) : (
            <span className="relative z-[2] shrink-0 flex items-center justify-center transition-colors duration-200">
              {icon}
            </span>
          ))}

        {/* Label */}
        {wave ? (
          <motion.span
            initial={false}
            animate={{ scale: isPressed ? 0.95 : 1 }}
            transition={activeTransition}
            className={cn(
              "relative z-[2] font-semibold tracking-[-0.02em] select-none whitespace-nowrap transition-colors duration-300",
              isWaveActive && variantStyles.textActive
            )}
          >
            {children}
          </motion.span>
        ) : (
          <span className="relative z-[2] font-semibold tracking-[-0.01em] select-none whitespace-nowrap transition-colors duration-200">
            {children}
          </span>
        )}

        {/* Arrow Viewport (15x14px window with dual arrows sliding 23px in lockstep) */}
        {showArrow &&
          (wave ? (
            <motion.span
              initial={false}
              animate={{ scale: isPressed ? 0.95 : 1 }}
              transition={activeTransition}
              className="relative z-[2] w-[15px] h-[14px] overflow-hidden shrink-0 block select-none"
            >
              <motion.span
                initial={false}
                animate={{ x: isWaveActive ? 0 : -23 }}
                transition={activeTransition}
                className="absolute left-0 top-0 flex items-center gap-[8px] w-[38px] h-[14px] will-change-transform"
              >
                <StaticArrow className={variantStyles.arrowHoverText} />
                <StaticArrow className={variantStyles.arrowDefaultText} />
              </motion.span>
            </motion.span>
          ) : (
            <span className="relative z-[2] w-[15px] h-[14px] overflow-hidden shrink-0 block select-none">
              <span className="absolute left-0 top-0 flex items-center gap-[8px] w-[38px] h-[14px] transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] -translate-x-[23px] group-hover:translate-x-0 group-focus-visible:translate-x-0">
                <StaticArrow className={variantStyles.arrowHoverStatic} />
                <StaticArrow className={variantStyles.arrowDefaultText} />
              </span>
            </span>
          ))}
      </>
    );

    const commonClasses = cn(
      "group relative isolate inline-flex items-center justify-center cursor-pointer select-none overflow-hidden transform-gpu transition-[background-color,border-color,box-shadow,color] duration-300",
      "rounded-[10px]",
      "outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#09090B]",
      !wave && "active:scale-[0.98]",
      sizeStyles,
      variantStyles.base,
      wave
        ? isWaveActive
          ? variant === "primary" || variant === "default"
            ? "border-[#002E99] dark:border-[#002E99] shadow-[0_8px_24px_rgba(0,46,153,0.42)]"
            : "border-[#0066FF] dark:border-[#0066FF] shadow-[0_8px_24px_rgba(0,102,255,0.36)]"
          : ""
        : variantStyles.staticHover,
      disabled && "opacity-50 cursor-not-allowed pointer-events-none",
      className
    );

    const anchorHandlers =
      interactionHandlers as React.HTMLAttributes<HTMLAnchorElement>;

    if (href) {
      const isInternal = href.startsWith("/") || href.startsWith("#");
      if (isInternal) {
        return (
          <Link
            ref={setRefs as any}
            href={href}
            onClick={onClick as any}
            className={commonClasses}
            target={target}
            rel={rel}
            {...anchorHandlers}
          >
            {content}
          </Link>
        );
      }
      return (
        <a
          ref={setRefs as any}
          href={href}
          onClick={onClick as any}
          className={commonClasses}
          target={target}
          rel={rel}
          {...anchorHandlers}
        >
          {content}
        </a>
      );
    }

    return (
      <button
        ref={setRefs as any}
        type={type}
        onClick={onClick}
        disabled={disabled}
        className={commonClasses}
        {...interactionHandlers}
        {...rest}
      >
        {content}
      </button>
    );
  }
);

WaveRevealButton.displayName = "WaveRevealButton";
export default WaveRevealButton;
