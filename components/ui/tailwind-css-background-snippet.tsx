import React from "react";
import { cn } from "@/lib/utils";

export interface HeroBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Radial gradient background layer for the Hero section.
 * Uses pure LShorter brand blue in both dark mode (`#000 40% -> #0055FF 100%`)
 * and light mode (`#fff 40% -> #0066FF 100%`).
 */
export const HeroBackground = ({ className }: { className?: string }) => {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="parallax-image absolute inset-0 h-full w-full">
        {/* Dark mode: obsidian to deep electric blue */}
        <div className="hidden dark:block absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#0055FF_100%)]" />
        {/* Light mode: crisp white to vibrant LShorter blue */}
        <div className="block dark:hidden absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#0066FF_100%)]" />
      </div>

      {/* Seamless multi-stop bottom dissolve into the next section (zero abrupt horizontal cutoff) */}
      <div
        aria-hidden="true"
        className="block dark:hidden pointer-events-none absolute inset-x-0 bottom-0 h-[340px] sm:h-[420px] [background:linear-gradient(180deg,rgba(255,255,255,0)_0%,rgba(235,244,255,0.42)_38%,rgba(246,250,255,0.82)_72%,#FFFFFF_100%)]"
      />
      <div
        aria-hidden="true"
        className="hidden dark:block pointer-events-none absolute inset-x-0 bottom-0 h-[340px] sm:h-[420px] [background:linear-gradient(180deg,rgba(9,9,11,0)_0%,rgba(9,13,24,0.46)_38%,rgba(9,11,16,0.84)_72%,#09090B_100%)]"
      />
    </div>
  );
};

export const Hero = ({ className, children }: HeroBackgroundProps) => {
  return (
    <div className={cn("w-full relative h-screen isolate", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#0055FF_100%)]"></div>
      </div>
      {children}
    </div>
  );
};

export default Hero;
