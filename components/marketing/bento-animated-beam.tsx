"use client";

import React, { forwardRef, useRef } from "react";
import { Link2, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AnimatedBeam } from "@/components/magicui/animated-beam";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      style={{ borderRadius: "9999px" }}
      className={cn(
        "z-10 flex items-center justify-center rounded-full border bg-white dark:bg-[#16161a] border-neutral-200 dark:border-white/10 shadow-sm shadow-black/5 dark:shadow-black/40 transition-all duration-300 hover:scale-110",
        className
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export function BentoAnimatedBeamCard({
  className,
}: {
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const divMetaRef = useRef<HTMLDivElement>(null);
  const divGoogleRef = useRef<HTMLDivElement>(null);
  const divTikTokRef = useRef<HTMLDivElement>(null);
  const divLinkedInRef = useRef<HTMLDivElement>(null);
  const divXRef = useRef<HTMLDivElement>(null);
  const divHubRef = useRef<HTMLDivElement>(null);
  const divVisitorRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative flex h-[220px] sm:h-[235px] w-full max-w-[440px] mx-auto items-center justify-center overflow-hidden px-2 sm:px-4 py-2 select-none",
        className
      )}
    >
      <div className="flex size-full max-w-sm flex-row items-center justify-between gap-4 sm:gap-6 z-10">
        
        {/* ── Left Node: Visitor click ── */}
        <div className="flex flex-col justify-center items-center">
          <Circle
            ref={divVisitorRef}
            className="size-9 sm:size-9.5 p-2 bg-neutral-100/90 dark:bg-[#1a1a20] border-neutral-300 dark:border-white/20 shadow-md hover:border-neutral-400 dark:hover:border-white/40"
          >
            <User className="w-4 h-4 text-neutral-700 dark:text-neutral-200" />
          </Circle>
        </div>

        {/* ── Center Node: Link Retargeting Node (Base clean color, Link2 icon) ── */}
        <div className="flex flex-col justify-center items-center">
          <Circle
            ref={divHubRef}
            className="size-9 sm:size-9.5 p-2 bg-white dark:bg-[#16161a] border border-neutral-300 dark:border-white/20 shadow-md hover:border-neutral-400 dark:hover:border-white/40"
          >
            <Link2 className="w-4.5 h-4.5 text-neutral-800 dark:text-neutral-100" />
          </Circle>
        </div>

        {/* ── Right Nodes: 5 Authentic Pixel Targeting Platforms (compact rounded-full, no labels) ── */}
        <div className="flex flex-col justify-center items-center gap-2 sm:gap-2.5">
          <Circle
            ref={divMetaRef}
            className="size-8 sm:size-8.5 p-1.5 hover:border-[#1877F2]/60 hover:shadow-[#1877F2]/20"
          >
            <PixelIcons.meta />
          </Circle>

          <Circle
            ref={divGoogleRef}
            className="size-8 sm:size-8.5 p-1.5 hover:border-[#4285F4]/60 hover:shadow-[#4285F4]/20"
          >
            <PixelIcons.google />
          </Circle>

          <Circle
            ref={divTikTokRef}
            className="size-8 sm:size-8.5 p-1.5 hover:border-[#FE2C55]/60 hover:shadow-[#FE2C55]/20"
          >
            <PixelIcons.tiktok />
          </Circle>

          <Circle
            ref={divLinkedInRef}
            className="size-8 sm:size-8.5 p-1.5 hover:border-[#0A66C2]/60 hover:shadow-[#0A66C2]/20"
          >
            <PixelIcons.linkedin />
          </Circle>

          <Circle
            ref={divXRef}
            className="size-8 sm:size-8.5 p-1.5 hover:border-neutral-400 dark:hover:border-white/40"
          >
            <PixelIcons.x />
          </Circle>
        </div>

      </div>

      {/* ── Beams: Visitor -> LShorter Hub ── */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={divVisitorRef}
        toRef={divHubRef}
        duration={2.4}
        pathColor="currentColor"
        className="text-neutral-300 dark:text-neutral-700/80"
        gradientStartColor="#0066FF"
        gradientStopColor="#38bdf8"
      />

      {/* ── Beams: LShorter Hub -> 5 Retargeting Pixels ── */}
      <AnimatedBeam
        containerRef={containerRef}
        fromRef={divHubRef}
        toRef={divMetaRef}
        duration={2.2}
        delay={0.25}
        curvature={-24}
        pathColor="currentColor"
        className="text-neutral-300 dark:text-neutral-700/80"
        gradientStartColor="#0066FF"
        gradientStopColor="#1877F2"
      />

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={divHubRef}
        toRef={divGoogleRef}
        duration={2.2}
        delay={0.4}
        curvature={-11}
        pathColor="currentColor"
        className="text-neutral-300 dark:text-neutral-700/80"
        gradientStartColor="#0066FF"
        gradientStopColor="#4285F4"
      />

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={divHubRef}
        toRef={divTikTokRef}
        duration={2.2}
        delay={0.55}
        curvature={0}
        pathColor="currentColor"
        className="text-neutral-300 dark:text-neutral-700/80"
        gradientStartColor="#0066FF"
        gradientStopColor="#FE2C55"
      />

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={divHubRef}
        toRef={divLinkedInRef}
        duration={2.2}
        delay={0.7}
        curvature={11}
        pathColor="currentColor"
        className="text-neutral-300 dark:text-neutral-700/80"
        gradientStartColor="#0066FF"
        gradientStopColor="#0A66C2"
      />

      <AnimatedBeam
        containerRef={containerRef}
        fromRef={divHubRef}
        toRef={divXRef}
        duration={2.2}
        delay={0.85}
        curvature={24}
        pathColor="currentColor"
        className="text-neutral-300 dark:text-neutral-700/80"
        gradientStartColor="#0066FF"
        gradientStopColor="#38bdf8"
      />
    </div>
  );
}

const PixelIcons = {
  meta: () => (
    <svg
      className="w-full h-full text-[#1877F2]"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="Meta Facebook Pixel"
    >
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  google: () => (
    <svg
      className="w-full h-full"
      viewBox="0 0 24 24"
      aria-label="Google Tag / Analytics"
    >
      <path
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
        fill="#4285F4"
      />
      <path
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.35 24 12 24z"
        fill="#34A853"
      />
      <path
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
        fill="#FBBC05"
      />
      <path
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
        fill="#EA4335"
      />
    </svg>
  ),
  tiktok: () => (
    <svg
      className="w-full h-full text-zinc-950 dark:text-white"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="TikTok Ads Pixel"
    >
      <path d="M19.589 6.686a4.793 4.793 0 0 1-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 0 1-5.201 1.743l-.064-.093a2.895 2.895 0 0 1 2.37-4.547c.307 0 .604.05.882.143V9.37a6.34 6.34 0 0 0-.882-.062 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.718a8.214 8.214 0 0 0 4.77 1.522V6.795a4.78 4.78 0 0 1-1.001-.109z" />
    </svg>
  ),
  linkedin: () => (
    <svg
      className="w-full h-full text-[#0A66C2]"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="LinkedIn Insight Tag"
    >
      <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v7.6h2.79v-7.6H6.46M7.86 6.3a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
    </svg>
  ),
  x: () => (
    <svg
      className="w-full h-full text-zinc-950 dark:text-white"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-label="X Ads Pixel"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
};
