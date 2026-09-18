"use client";

import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface ScrollStackItemProps {
  children: ReactNode;
  index: number;
  total: number;
  topOffset?: number;
  stackGap?: number;
  className?: string;
}

export function ScrollStackItem({
  children,
  index,
  total,
  topOffset = 90,
  stackGap = 24,
  className,
}: ScrollStackItemProps) {
  // Compute sticky top position so each card stacks cleanly below previous card headers
  const stickyTop = topOffset + index * stackGap;

  return (
    <div
      style={{
        top: `${stickyTop}px`,
        zIndex: index + 1,
      }}
      className={cn(
        "sticky transition-transform duration-300 will-change-transform",
        className
      )}
    >
      {children}
    </div>
  );
}

export interface ScrollStackProps {
  children: ReactNode;
  className?: string;
}

export function ScrollStack({ children, className }: ScrollStackProps) {
  return (
    <div className={cn("relative w-full flex flex-col gap-6 sm:gap-8 pb-12", className)}>
      {children}
    </div>
  );
}
