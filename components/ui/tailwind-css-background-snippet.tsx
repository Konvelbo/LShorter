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
