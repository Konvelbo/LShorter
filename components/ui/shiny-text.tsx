"use client";

import React from "react";

interface ShinyTextProps {
  text?: string;
  disabled?: boolean;
  speed?: number;
  className?: string;
  children?: React.ReactNode;
}

export function ShinyText({
  text,
  disabled = false,
  speed = 4,
  className = "",
  children,
}: ShinyTextProps) {
  const content = text || children;

  return (
    <span
      className={`shiny-text inline bg-clip-text ${
        disabled ? "" : "animate-shine"
      } ${className}`}
      style={{
        animationDuration: `${speed}s`,
      }}
    >
      {content}
    </span>
  );
}
