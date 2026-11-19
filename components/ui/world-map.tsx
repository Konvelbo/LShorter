"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { useTheme } from "@/components/providers/theme-provider";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
}

export function WorldMap({
  dots = [],
  lineColor = "#0066FF",
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setIsInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { rootMargin: "300px", threshold: 0 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const isDark = mounted ? theme === "dark" : false;
  const mapSrc = isDark ? "/images/world-map-dark.svg" : "/images/world-map-light.svg";

  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  return (
    <div
      ref={containerRef}
      className="w-full aspect-[2/1] bg-white dark:bg-[#09090b] rounded-xl relative font-sans overflow-hidden select-none border border-black/[0.04] dark:border-white/[0.06] shadow-xs [contain:layout_paint]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={mapSrc}
        className="h-full w-full pointer-events-none select-none object-cover"
        alt="world map"
        height="495"
        width="1056"
        draggable={false}
        loading="lazy"
        decoding="async"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-gradient-to-b from-white dark:from-[#09090b] to-transparent z-[1]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-white dark:from-[#09090b] to-transparent z-[1]"
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="w-full h-full absolute inset-0 pointer-events-none select-none"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={lineColor} stopOpacity="0" />
            <stop offset="8%" stopColor={lineColor} stopOpacity="0.85" />
            <stop offset="50%" stopColor="#38bdf8" stopOpacity="1" />
            <stop offset="92%" stopColor={lineColor} stopOpacity="0.85" />
            <stop offset="100%" stopColor={lineColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Animated Curved Link Paths — paused when off-screen */}
        {isInView &&
          dots.map((dot, i) => {
            const startPoint = projectPoint(dot.start.lat, dot.start.lng);
            const endPoint = projectPoint(dot.end.lat, dot.end.lng);
            return (
              <g key={`path-group-${i}`}>
                <motion.path
                  d={createCurvedPath(startPoint, endPoint)}
                  fill="none"
                  stroke="url(#path-gradient)"
                  strokeWidth="1.5"
                  initial={{
                    pathLength: 0,
                  }}
                  animate={{
                    pathLength: 1,
                  }}
                  transition={{
                    duration: 1.4,
                    delay: 0.3 * i,
                    ease: "easeOut",
                    repeat: Infinity,
                    repeatType: "loop",
                    repeatDelay: 2.2,
                  }}
                  key={`start-upper-${i}`}
                />
              </g>
            );
          })}

        {/* Pulse Pin Hubs */}
        {dots.map((dot, i) => {
          const startPt = projectPoint(dot.start.lat, dot.start.lng);
          const endPt = projectPoint(dot.end.lat, dot.end.lng);
          return (
            <g key={`points-group-${i}`}>
              {/* Start node */}
              <g key={`start-${i}`}>
                <circle
                  cx={startPt.x}
                  cy={startPt.y}
                  r="3"
                  fill={lineColor}
                />
                {isInView && (
                  <circle
                    cx={startPt.x}
                    cy={startPt.y}
                    r="3"
                    fill={lineColor}
                    opacity="0.6"
                  >
                    <animate
                      attributeName="r"
                      from="3"
                      to="10"
                      dur="1.8s"
                      begin={`${0.2 * i}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.6"
                      to="0"
                      dur="1.8s"
                      begin={`${0.2 * i}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>

              {/* End node */}
              <g key={`end-${i}`}>
                <circle
                  cx={endPt.x}
                  cy={endPt.y}
                  r="3"
                  fill={lineColor}
                />
                {isInView && (
                  <circle
                    cx={endPt.x}
                    cy={endPt.y}
                    r="3"
                    fill={lineColor}
                    opacity="0.6"
                  >
                    <animate
                      attributeName="r"
                      from="3"
                      to="10"
                      dur="1.8s"
                      begin={`${0.2 * i + 0.3}s`}
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      from="0.6"
                      to="0"
                      dur="1.8s"
                      begin={`${0.2 * i + 0.3}s`}
                      repeatCount="indefinite"
                    />
                  </circle>
                )}
              </g>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default WorldMap;
