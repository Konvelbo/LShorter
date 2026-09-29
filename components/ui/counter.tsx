"use client";

import React, { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

interface CounterProps {
  value: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  className?: string;
}

/**
 * Compteur numérique animé avec GSAP et incrémentation / décrémentation bidirectionnelle au scroll.
 */
export function Counter({
  value,
  duration = 1.2,
  prefix = "",
  suffix = "",
  decimals = 0,
  className = "",
}: CounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const countObj = { val: 0 };

    const tween = gsap.to(countObj, {
      val: value,
      duration,
      ease: "power3.out",
      paused: true,
      onUpdate: () => {
        setDisplayValue(countObj.val);
      },
    });

    // Équivalent à la marge 100px de l'ancien useInView
    const trigger = ScrollTrigger.create({
      trigger: el,
      start: "top bottom+=100px",
      end: "bottom top-=100px",
      onEnter: () => tween.play(),
      onEnterBack: () => tween.play(),
      onLeave: () => tween.reverse(),
      onLeaveBack: () => tween.reverse(),
    });

    return () => {
      trigger.kill();
      tween.kill();
    };
  }, [value, duration]);

  const safeVal = isNaN(displayValue) ? 0 : displayValue;
  const formatted =
    decimals > 0
      ? safeVal.toFixed(decimals)
      : Math.round(safeVal).toLocaleString();

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}
