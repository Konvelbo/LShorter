"use client";

import React, { forwardRef, useId, useState } from "react";
import Link from "next/link";
import { LayoutGroup, motion } from "motion/react";
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
   * Enable the exact Framer Wave Reveal Button effect (from Wave-Reveal-Button-S1VRPa.js).
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

/**
 * Exact spring physics from Framer Wave Reveal Button (`XyPxxbn4B.js`):
 * `const transition1 = { bounce: 0, delay: 0, duration: 1, type: "spring" };`
 */
const FRAMER_WAVE_SPRING = {
  type: "spring" as const,
  bounce: 0,
  delay: 0,
  duration: 1,
};

/**
 * Exact CSS mask SVGs extracted verbatim from the Framer sub-modules:
 * - Arrow (`dK6JXX8w_.js`)
 * - WaveFill (`mzBpRU2t3.js`)
 */
const FRAMER_ARROW_MASK = `url('data:image/svg+xml,<svg display="block" role="presentation" viewBox="0 0 15 14" xmlns="http://www.w3.org/2000/svg"><path d="M 14.817 7.496 L 9.192 13.796 C 8.948 14.069 8.552 14.069 8.308 13.796 C 8.064 13.522 8.064 13.079 8.308 12.805 L 12.866 7.7 L 0.625 7.7 C 0.28 7.7 0 7.387 0 7 C 0 6.614 0.28 6.3 0.625 6.3 L 12.866 6.3 L 8.308 1.196 C 8.064 0.922 8.064 0.479 8.308 0.205 C 8.552 -0.068 8.948 -0.068 9.192 0.205 L 14.817 6.505 C 14.935 6.636 15 6.815 15 7 C 15 7.186 14.935 7.364 14.817 7.496 Z" fill="black"/></svg>')`;

const FRAMER_WAVE_FILL_MASK = `url('data:image/svg+xml,<svg display="block" role="presentation" viewBox="0 0 15 14" xmlns="http://www.w3.org/2000/svg"><path d="M 5 3.523 C 5.078 3.523 5.155 3.525 5.233 3.528 C 5.873 1.483 7.765 0 10 0 C 12.761 0 15 2.264 15 5.057 C 15 7.85 12.761 10.114 10 10.114 C 9.922 10.114 9.845 10.112 9.767 10.108 C 9.127 12.154 7.235 13.636 5 13.636 C 2.239 13.636 0 11.372 0 8.58 C 0 5.787 2.239 3.523 5 3.523 Z" fill="black" transform="translate(0 0.18)"/></svg>')`;

function StaticArrow({ className }: { className?: string }) {
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

/**
 * Native Next.js / Motion port of Framer's `Wave-Reveal-Button-S1VRPa.js@fuWldc87dwJ27x3jDkBQ`.
 * - `wave = true` (high-priority CTAs only): exact Framer `WaveFill` dual-lobe organic shape
 *   and dual-arrow `justify-end -> justify-start` FLIP layout spring (`duration: 1, bounce: 0`).
 * - `wave = false` (default for secondary/standard buttons): clean, restrained hover state.
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
      onPointerEnter,
      onPointerLeave,
      onPointerDown,
      onPointerUp,
      onPointerCancel,
      onFocus,
      onBlur,
      ...rest
    },
    ref
  ) => {
    const groupId = useId();
    const [isHovered, setIsHovered] = useState(false);
    const [isPressed, setIsPressed] = useState(false);

    const isWaveActive = wave && (isHovered || isPressed);
    const layoutDep = `${isWaveActive}-${isPressed}`;

    const variantStyles = {
      primary: {
        base: "bg-[#0066FF] text-white border border-[#0066FF] shadow-[0_4px_14px_rgba(0,102,255,0.24)] hover:shadow-[0_8px_24px_rgba(0,66,195,0.40)]",
        staticHover: "hover:bg-[#0052CC] hover:border-[#0052CC]",
        textActive: "text-white",
        arrowDefaultBg: "bg-white",
        arrowHoverBg: "bg-white",
        arrowDefaultText: "text-white",
        arrowHoverStatic: "text-white",
        waveFill: waveColor || "#002E99",
      },
      default: {
        base: "bg-[#0066FF] text-white border border-[#0066FF] shadow-[0_4px_14px_rgba(0,102,255,0.24)] hover:shadow-[0_8px_24px_rgba(0,66,195,0.40)]",
        staticHover: "hover:bg-[#0052CC] hover:border-[#0052CC]",
        textActive: "text-white",
        arrowDefaultBg: "bg-white",
        arrowHoverBg: "bg-white",
        arrowDefaultText: "text-white",
        arrowHoverStatic: "text-white",
        waveFill: waveColor || "#002E99",
      },
      white: {
        base: "bg-white text-black border border-zinc-200 shadow-2xs",
        staticHover: "hover:bg-zinc-50 hover:border-zinc-300",
        textActive: "text-white",
        arrowDefaultBg: "bg-black",
        arrowHoverBg: "bg-white",
        arrowDefaultText: "text-black",
        arrowHoverStatic: "text-[#0066FF]",
        waveFill: waveColor || "#0066FF",
      },
      dark: {
        base: "bg-[#101828] dark:bg-[#141418] text-white border border-zinc-800 dark:border-white/15 shadow-2xs",
        staticHover:
          "hover:bg-[#182235] dark:hover:bg-[#1D1E25] hover:border-zinc-700",
        textActive: "text-white",
        arrowDefaultBg: "bg-white",
        arrowHoverBg: "bg-white",
        arrowDefaultText: "text-white",
        arrowHoverStatic: "text-[#5294FF]",
        waveFill: waveColor || "#0066FF",
      },
      outline: {
        base: "bg-white/95 dark:bg-white/[0.04] backdrop-blur-md text-zinc-900 dark:text-white border border-[#D0D5DD] dark:border-white/15 shadow-2xs",
        staticHover:
          "hover:bg-zinc-100/90 dark:hover:bg-white/[0.09] hover:border-zinc-400 dark:hover:border-white/25",
        textActive: "text-white",
        arrowDefaultBg: "bg-zinc-800 dark:bg-zinc-200",
        arrowHoverBg: "bg-white",
        arrowDefaultText: "text-zinc-700 dark:text-zinc-200",
        arrowHoverStatic: "text-[#0066FF] dark:text-[#5294FF]",
        waveFill: waveColor || "#0066FF",
      },
      secondary: {
        base: "bg-zinc-100 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700",
        staticHover: "hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80",
        textActive: "text-white",
        arrowDefaultBg: "bg-zinc-800 dark:bg-zinc-200",
        arrowHoverBg: "bg-white",
        arrowDefaultText: "text-zinc-700 dark:text-zinc-200",
        arrowHoverStatic: "text-[#0066FF] dark:text-[#5294FF]",
        waveFill: waveColor || "#0066FF",
      },
      contrast: {
        base: "bg-[#09090B] text-white dark:bg-white dark:text-black border border-[#09090B] dark:border-white/20 shadow-[0_4px_14px_rgba(0,0,0,0.14)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.40)]",
        staticHover: "hover:bg-zinc-800 dark:hover:bg-zinc-100",
        textActive: "text-white dark:text-white",
        arrowDefaultBg: "bg-white dark:bg-black",
        arrowHoverBg: "bg-white",
        arrowDefaultText: "text-white dark:text-black",
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
        {/* ── Exact Framer WaveFill Layer (`mzBpRU2t3.js` + `XyPxxbn4B.js` layout spring) ── */}
        {wave && (
          <motion.div
            aria-hidden="true"
            layout
            layoutDependency={layoutDep}
            transition={FRAMER_WAVE_SPRING}
            style={{
              backgroundColor: variantStyles.waveFill,
              WebkitMask: `${FRAMER_WAVE_FILL_MASK} alpha no-repeat center / contain`,
              mask: `${FRAMER_WAVE_FILL_MASK} alpha no-repeat center / contain`,
              position: "absolute",
              pointerEvents: "none",
              zIndex: 1,
              ...(isWaveActive
                ? {
                    left: -84,
                    right: -53,
                    bottom: -153,
                    top: "auto",
                    width: "calc(max(100%, 176px) + 137px)",
                    aspectRatio: "1.0474631751227497 / 1",
                  }
                : {
                    left: -84,
                    top: -100,
                    width: 132,
                    height: 123,
                    aspectRatio: "1.0731707317073171 / 1",
                  }),
            }}
          />
        )}

        {/* Optional Leading Icon */}
        {icon &&
          (wave ? (
            <motion.span
              animate={{ scale: isPressed ? 0.95 : 1 }}
              transition={FRAMER_WAVE_SPRING}
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

        {/* Label (`scale: 0.95` on pressed + smooth color flip to white on wave reveal) */}
        {wave ? (
          <motion.span
            animate={{ scale: isPressed ? 0.95 : 1 }}
            transition={FRAMER_WAVE_SPRING}
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

        {/* Arrow Viewport */}
        {showArrow &&
          (wave ? (
            /* Exact Framer Icon Wrapper (`width: 15px, gap: 8px, justify-end -> justify-start` with FLIP spring) */
            <motion.span
              animate={{ scale: isPressed ? 0.95 : 1 }}
              transition={FRAMER_WAVE_SPRING}
              className={cn(
                "relative z-[2] w-[15px] h-[14px] overflow-hidden shrink-0 flex flex-row flex-nowrap items-center gap-[8px] select-none",
                isWaveActive ? "justify-start" : "justify-end"
              )}
            >
              {/* Arrow Hover: slides in from the left */}
              <motion.span
                layout="position"
                layoutDependency={layoutDep}
                transition={FRAMER_WAVE_SPRING}
                style={{
                  WebkitMask: `${FRAMER_ARROW_MASK} alpha no-repeat center / contain`,
                  mask: `${FRAMER_ARROW_MASK} alpha no-repeat center / contain`,
                }}
                className={cn(
                  "block flex-none w-[15px] h-[14px]",
                  variantStyles.arrowHoverBg
                )}
              />
              {/* Arrow Default: visible at rest, slides out to the right */}
              <motion.span
                layout="position"
                layoutDependency={layoutDep}
                transition={FRAMER_WAVE_SPRING}
                style={{
                  WebkitMask: `${FRAMER_ARROW_MASK} alpha no-repeat center / contain`,
                  mask: `${FRAMER_ARROW_MASK} alpha no-repeat center / contain`,
                }}
                className={cn(
                  "block flex-none w-[15px] h-[14px]",
                  variantStyles.arrowDefaultBg
                )}
              />
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
      "group relative isolate inline-flex items-center justify-center cursor-pointer select-none overflow-hidden transition-[background-color,border-color,box-shadow,color] duration-300",
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

    const anchorHandlers = interactionHandlers as React.HTMLAttributes<HTMLAnchorElement>;

    const renderElement = () => {
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
              {...anchorHandlers}
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
            {...anchorHandlers}
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
          {...interactionHandlers}
          {...rest}
        >
          {content}
        </button>
      );
    };

    if (wave) {
      return <LayoutGroup id={groupId}>{renderElement()}</LayoutGroup>;
    }

    return renderElement();
  }
);

WaveRevealButton.displayName = "WaveRevealButton";
export default WaveRevealButton;
