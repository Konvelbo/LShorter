"use client";

import React, { useState } from "react";
import { cn } from "@/lib/utils";
import { DRAWER_SECTIONS } from "./types";

interface DrawerStepperProps {
  activeStep: number;
  onStepClick: (sectionId: string, stepNumber: number) => void;
}

export function DrawerStepper({ activeStep, onStepClick }: DrawerStepperProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div className="hidden sm:flex flex-col items-center py-6 px-3.5 border-l border-[#222225] bg-[#101013] shrink-0 select-none z-10 w-16">
      <div className="relative flex flex-col items-center justify-between h-full max-h-[520px]">
        {/* Vertical connecting background line */}
        <div className="absolute top-3 bottom-3 left-1/2 -translate-x-1/2 w-[2px] bg-neutral-800 pointer-events-none" />

        {/* Stepper items */}
        {DRAWER_SECTIONS.map((sec) => {
          const isActive = activeStep === sec.number;
          const isHovered = hoveredStep === sec.number;

          return (
            <div
              key={sec.id}
              className="relative group flex items-center justify-center my-auto py-1"
              onMouseEnter={() => setHoveredStep(sec.number)}
              onMouseLeave={() => setHoveredStep(null)}
            >
              {/* Stepper Button Dot */}
              <button
                type="button"
                onClick={() => onStepClick(sec.id, sec.number)}
                className={cn(
                  "relative z-10 flex items-center justify-center rounded-full transition-all duration-200 cursor-pointer",
                  isActive
                    ? "w-7 h-7 bg-[#141416] border-2 border-brand shadow-[0_0_12px_var(--brand-primary-glow)] scale-110"
                    : "w-5 h-5 bg-[#141416] border border-neutral-700 hover:border-brand-subtle hover:scale-105",
                )}
                aria-label={sec.title}
              >
                {isActive ? (
                  <div className="w-2.5 h-2.5 rounded-full bg-brand shadow-[0_0_6px_var(--brand-primary-glow)]" />
                ) : (
                  <div className="w-1.5 h-1.5 rounded-full bg-neutral-600 group-hover:bg-neutral-300 transition-colors" />
                )}
              </button>

              {/* Floating Tooltip Label on Hover (smooth animated popover floating to the left) */}
              <div
                className={cn(
                  "absolute right-9 px-2.5 py-1.5 rounded-[8px] bg-[#1c1c22] border border-[#2e2e36] shadow-xl text-right pointer-events-none transition-all duration-200 z-50 whitespace-nowrap flex items-center gap-2",
                  isHovered
                    ? "opacity-100 translate-x-0 scale-100"
                    : "opacity-0 translate-x-2 scale-95 pointer-events-none",
                )}
              >
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-white tracking-wide">
                    {sec.title}
                  </span>
                  <span className="text-[9.5px] text-neutral-400">
                    {sec.subtitle}
                  </span>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-brand" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
