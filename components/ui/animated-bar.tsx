"use client";

import React, { useRef, useEffect } from "react";
import gsap from "gsap";

interface AnimatedBarProps {
  value: number; // percentage (0 to 100)
  direction?: "horizontal" | "vertical";
  duration?: number;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Animated bar/column component powered 100% by GSAP that smoothly increases when entering viewport
 * and reverses back to 0 when scrolling away.
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

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prop = direction === "vertical" ? "height" : "width";
    gsap.set(el, { [prop]: "0%" });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            gsap.to(el, {
              [prop]: `${value}%`,
              duration,
              delay,
              ease: "expo.out",
              overwrite: "auto",
            });
          } else {
            gsap.to(el, {
              [prop]: "0%",
              duration: duration * 0.6,
              ease: "power2.out",
              overwrite: "auto",
            });
          }
        });
      },
      { rootMargin: "100px 0px 100px 0px" }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [value, direction, duration, delay]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        ...(direction === "vertical" ? { height: "0%" } : { width: "0%" }),
        ...style,
      }}
    />
  );
}

