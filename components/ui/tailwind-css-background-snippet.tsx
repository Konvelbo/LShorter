import React from "react";
import { cn } from "@/lib/utils";

export interface HeroBackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Radial gradient background layer from `tailwind-css-background-snippet`.
 * Preserves the exact dark-mode radial gradient (`#000 40% -> #63e 100%`)
 * and pairs it with a light-mode radial gradient (`#fff 40% -> #63e 100%`).
 */
export const HeroBackground = ({ className }: { className?: string }) => {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <div className="parallax-image absolute inset-0 h-full w-full">
        {/* Dark mode (exact snippet class) */}
        <div className="hidden dark:block absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]" />
        {/* Light mode counterpart */}
        <div className="block dark:hidden absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)]" />
      </div>
    </div>
  );
};

export const Hero = ({ className, children }: HeroBackgroundProps) => {
  return (
    <div className={cn("w-full relative h-screen isolate", className)}>
      {/* Background Pattern */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>
      </div>
      {children}
    </div>
  );
};

export default Hero;
