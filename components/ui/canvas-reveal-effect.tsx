"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface CanvasRevealEffectProps {
  animationSpeed?: number;
  opacities?: number[];
  colors?: number[][];
  containerClassName?: string;
  dotSize?: number;
  showGradient?: boolean;
}

export function CanvasRevealEffect({
  animationSpeed = 3,
  colors = [[70, 95, 255]],
  containerClassName,
  dotSize = 3,
  showGradient = true,
}: CanvasRevealEffectProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let startTime = performance.now();

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();
    window.addEventListener("resize", resize);

    const render = (now: number) => {
      const elapsed = ((now - startTime) / 1000) * animationSpeed;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      ctx.clearRect(0, 0, width, height);

      const gap = dotSize * 3.5;
      const cols = Math.ceil(width / gap);
      const rows = Math.ceil(height / gap);
      const centerX = cols / 2;
      const centerY = rows / 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const dist = Math.hypot(c - centerX, r - centerY) * 0.12;
          if (elapsed < dist) continue;

          // Deterministic pseudo-random shimmer per dot
          const seed = Math.sin(c * 12.9898 + r * 78.233 + Math.floor(elapsed * 2.5)) * 43758.5453;
          const rand = seed - Math.floor(seed);
          const alpha = Math.min(0.9, Math.max(0.12, rand * 0.85));

          const color = colors[(c + r) % colors.length] || [70, 95, 255];
          ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
          ctx.fillRect(c * gap, r * gap, dotSize, dotSize);
        }
      }

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, [animationSpeed, colors, dotSize]);

  return (
    <div className={cn("h-full relative w-full overflow-hidden", containerClassName)}>
      <canvas ref={canvasRef} className="w-full h-full block" />
      {showGradient && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
      )}
    </div>
  );
}

export function AceternityCornerIcon({ className, ...rest }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth="1.5"
      stroke="currentColor"
      className={className}
      {...rest}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
    </svg>
  );
}

export function CanvasRevealCard({
  title,
  subtitle,
  badge,
  description,
  icon,
  colors,
  containerClassName,
}: {
  title: string;
  subtitle: string;
  badge: string;
  description: string;
  icon: React.ReactNode;
  colors: number[][];
  containerClassName?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="border border-[#E4E7EC] dark:border-white/15 group/canvas-card flex items-center justify-center max-w-full w-full mx-auto p-6 relative h-[240px] bg-white dark:bg-[#0E0E12] transition-colors cursor-pointer overflow-hidden"
    >
      {/* 4 Aceternity Corner '+' Icons */}
      <AceternityCornerIcon className="absolute h-5 w-5 -top-2.5 -left-2.5 text-[#101828] dark:text-white/70 z-30 pointer-events-none" />
      <AceternityCornerIcon className="absolute h-5 w-5 -bottom-2.5 -left-2.5 text-[#101828] dark:text-white/70 z-30 pointer-events-none" />
      <AceternityCornerIcon className="absolute h-5 w-5 -top-2.5 -right-2.5 text-[#101828] dark:text-white/70 z-30 pointer-events-none" />
      <AceternityCornerIcon className="absolute h-5 w-5 -bottom-2.5 -right-2.5 text-[#101828] dark:text-white/70 z-30 pointer-events-none" />

      {/* Animated Canvas Dot Matrix Reveal on Hover */}
      {hovered && (
        <div className="h-full w-full absolute inset-0 z-10 animate-in fade-in duration-300">
          <CanvasRevealEffect
            animationSpeed={4}
            containerClassName={containerClassName || "bg-[#09090B]"}
            colors={colors}
            dotSize={3}
          />
        </div>
      )}

      {/* Card Foreground Content: Clean Icon + Title + Simple Description Underneath */}
      <div className="relative z-20 w-full h-full flex flex-col justify-between">
        <div className="flex items-center justify-end">
          {badge && (
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider transition-colors duration-300 ${
                hovered ? "text-emerald-300" : "text-[#027A48] dark:text-emerald-400"
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
              {badge}
            </span>
          )}
        </div>

        <div className="mt-auto flex flex-col items-start transition-transform duration-300 group-hover/canvas-card:-translate-y-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-colors duration-300 ${
              hovered
                ? "bg-white text-black"
                : "bg-[#F2F4F7] dark:bg-white/10 text-[#101828] dark:text-white"
            }`}
          >
            {icon}
          </div>
          <h4
            className={`text-[19px] font-semibold tracking-[-0.02em] mb-2 transition-colors duration-300 ${
              hovered ? "text-white" : "text-[#101828] dark:text-white"
            }`}
          >
            {title}
          </h4>
          <p
            className={`text-[13.5px] leading-[1.55] transition-colors duration-300 ${
              hovered ? "text-white/85" : "text-[#667085] dark:text-zinc-400"
            }`}
          >
            {description || subtitle}
          </p>
        </div>
      </div>
    </div>
  );
}
