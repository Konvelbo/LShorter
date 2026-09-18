"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";

interface AnimatedBarProps {
  value: number; // percentage (0 to 100)
  direction?: "horizontal" | "vertical";
  duration?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Animated bar/column component that smoothly increases when entering viewport
 * and reverses back to 0 when scrolling away (scroll up and down).
 */
export function AnimatedBar({
  value,
  direction = "horizontal",
  duration = 1.2,
  delay = 0,
  className = "",
  style = {},
}: AnimatedBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { margin: "100px 0px 100px 0px" });

  if (direction === "vertical") {
    return (
      <motion.div
        ref={ref}
        initial={{ height: "0%" }}
        animate={{ height: isInView ? `${value}%` : "0%" }}
        transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
        className={className}
        style={style}
      />
    );
  }

  return (
    <motion.div
      ref={ref}
      initial={{ width: "0%" }}
      animate={{ width: isInView ? `${value}%` : "0%" }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
      style={style}
    />
  );
}
