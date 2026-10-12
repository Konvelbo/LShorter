"use client";

import { RefObject, useEffect, useId, useState } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export interface AnimatedBeamProps {
  className?: string;
  containerRef: RefObject<HTMLElement | null>;
  fromRef: RefObject<HTMLElement | null>;
  toRef: RefObject<HTMLElement | null>;
  curvature?: number;
  reverse?: boolean;
  pathColor?: string;
  pathWidth?: number;
  pathOpacity?: number;
  gradientStartColor?: string;
  gradientStopColor?: string;
  delay?: number;
  duration?: number;
  startXOffset?: number;
  startYOffset?: number;
  endXOffset?: number;
  endYOffset?: number;
}

export const AnimatedBeam: React.FC<AnimatedBeamProps> = ({
  className,
  containerRef,
  fromRef,
  toRef,
  curvature = 0,
  reverse = false,
  duration = Math.random() * 3 + 4,
  delay = 0,
  pathColor = "rgba(255, 255, 255, 0.15)",
  pathWidth = 2,
  pathOpacity = 0.25,
  gradientStartColor = "#0066FF",
  gradientStopColor = "#38bdf8",
  startXOffset = 0,
  startYOffset = 0,
  endXOffset = 0,
  endYOffset = 0,
}) => {
  const id = useId();
  const [pathD, setPathD] = useState("");
  const [svgDimensions, setSvgDimensions] = useState({ width: 0, height: 0 });

  const [coordinates, setCoordinates] = useState({
    startX: 0,
    startY: 0,
    endX: 0,
    endY: 0,
  });

  useEffect(() => {
    const updatePath = () => {
      if (containerRef.current && fromRef.current && toRef.current) {
        const containerRect = containerRef.current.getBoundingClientRect();
        const rectA = fromRef.current.getBoundingClientRect();
        const rectB = toRef.current.getBoundingClientRect();

        const svgWidth = containerRect.width;
        const svgHeight = containerRect.height;
        setSvgDimensions({ width: svgWidth, height: svgHeight });

        const startX =
          rectA.left - containerRect.left + rectA.width / 2 + startXOffset;
        const startY =
          rectA.top - containerRect.top + rectA.height / 2 + startYOffset;
        const endX =
          rectB.left - containerRect.left + rectB.width / 2 + endXOffset;
        const endY =
          rectB.top - containerRect.top + rectB.height / 2 + endYOffset;

        setCoordinates({ startX, startY, endX, endY });

        const controlY = startY - curvature;
        const d = `M ${startX},${startY} Q ${(startX + endX) / 2},${controlY} ${endX},${endY}`;
        setPathD(d);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updatePath();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    updatePath();

    return () => {
      resizeObserver.disconnect();
    };
  }, [
    containerRef,
    fromRef,
    toRef,
    curvature,
    startXOffset,
    startYOffset,
    endXOffset,
    endYOffset,
  ]);

  return (
    <svg
      fill="none"
      width={svgDimensions.width}
      height={svgDimensions.height}
      xmlns="http://www.w3.org/2000/svg"
      className={cn(
        "pointer-events-none absolute left-0 top-0 transform-gpu stroke-2",
        className,
      )}
      viewBox={`0 0 ${svgDimensions.width || 100} ${svgDimensions.height || 100}`}
    >
      {/* ── 1. Static base path track ── */}
      <path
        d={pathD}
        stroke={pathColor}
        strokeWidth={pathWidth}
        strokeOpacity={pathOpacity}
        strokeLinecap="round"
      />

      {/* ── 2. Laser beam glow layer ── */}
      <motion.path
        d={pathD}
        stroke={`url(#${id})`}
        strokeWidth={pathWidth + 2.5}
        strokeLinecap="round"
        style={{ filter: "blur(2px)" }}
        initial={{
          pathLength: 0.28,
          pathOffset: reverse ? 1 : -0.28,
          opacity: 0,
        }}
        animate={{
          pathOffset: reverse ? [-0.28, 1] : [1, -0.28],
          opacity: [0, 0.75, 0.75, 0],
        }}
        transition={{
          delay,
          duration,
          ease: [0.16, 1, 0.3, 1],
          repeat: Infinity,
          repeatDelay: 0,
        }}
      />

      {/* ── 3. Sharp bright core beam ── */}
      <motion.path
        d={pathD}
        stroke={`url(#${id})`}
        strokeWidth={pathWidth}
        strokeLinecap="round"
        initial={{
          pathLength: 0.24,
          pathOffset: reverse ? 1 : -0.24,
          opacity: 0,
        }}
        animate={{
          pathOffset: reverse ? [-0.24, 1] : [1, -0.24],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          delay,
          duration,
          ease: [0.16, 1, 0.3, 1],
          repeat: Infinity,
          repeatDelay: 0,
        }}
      />

      {/* ── 4. Gradient aligned with node vector ── */}
      <defs>
        <linearGradient
          id={id}
          gradientUnits="userSpaceOnUse"
          x1={reverse ? coordinates.endX : coordinates.startX}
          y1={reverse ? coordinates.endY : coordinates.startY}
          x2={reverse ? coordinates.startX : coordinates.endX}
          y2={reverse ? coordinates.startY : coordinates.endY}
        >
          <stop offset="0%" stopColor={gradientStartColor} stopOpacity="0.2" />
          <stop offset="50%" stopColor={gradientStartColor} stopOpacity="1" />
          <stop offset="100%" stopColor={gradientStopColor} stopOpacity="1" />
        </linearGradient>
      </defs>
    </svg>
  );
};
