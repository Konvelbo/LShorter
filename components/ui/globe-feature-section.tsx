"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import createGlobe, { type COBEOptions } from "cobe";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import { cn } from "@/lib/utils";

const GLOBAL_EDGE_MARKERS: COBEOptions["markers"] = [
  { location: [40.7128, -74.006], size: 0.08 }, // New York
  { location: [37.7749, -122.4194], size: 0.06 }, // San Francisco
  { location: [48.8566, 2.3522], size: 0.09 }, // Paris
  { location: [51.5072, -0.1276], size: 0.07 }, // London
  { location: [50.1109, 8.6821], size: 0.06 }, // Frankfurt
  { location: [12.3714, -1.5197], size: 0.06 }, // Ouagadougou
  { location: [6.5244, 3.3792], size: 0.06 }, // Lagos
  { location: [-23.5505, -46.6333], size: 0.08 }, // Sao Paulo
  { location: [19.4326, -99.1332], size: 0.06 }, // Mexico City
  { location: [35.6762, 139.6503], size: 0.07 }, // Tokyo
  { location: [1.3521, 103.8198], size: 0.06 }, // Singapore
  { location: [19.076, 72.8777], size: 0.07 }, // Mumbai
  { location: [-33.8688, 151.2093], size: 0.05 }, // Sydney
];

const GLOBAL_EDGE_ARCS: COBEOptions["arcs"] = [
  { from: [40.7128, -74.006], to: [48.8566, 2.3522] },
  { from: [48.8566, 2.3522], to: [12.3714, -1.5197] },
  { from: [51.5072, -0.1276], to: [1.3521, 103.8198] },
  { from: [37.7749, -122.4194], to: [35.6762, 139.6503] },
  { from: [40.7128, -74.006], to: [-23.5505, -46.6333] },
  { from: [50.1109, 8.6821], to: [19.076, 72.8777] },
];

export function Globe({
  className,
  config,
}: {
  className?: string;
  config?: Partial<COBEOptions>;
}) {
  const { theme } = useTheme();
  const [isDark, setIsDark] = useState(theme === "dark");
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const dragOffsetRef = useRef<number>(0);
  const phiRef = useRef<number>(0.6);

  useEffect(() => {
    const root = document.documentElement;
    const sync = () => setIsDark(root.classList.contains("dark"));
    sync();
    const mo = new MutationObserver(sync);
    mo.observe(root, { attributes: true, attributeFilter: ["class"] });
    return () => mo.disconnect();
  }, [theme]);

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value;
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value !== null ? "grabbing" : "grab";
    }
  };

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteracting.current = clientX;
      dragOffsetRef.current += delta / 180;
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let width = canvas.offsetWidth || 560;
    let rafId = 0;
    let isVisible = false;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const baseOpts: COBEOptions = {
      width: width * dpr,
      height: width * dpr,
      devicePixelRatio: dpr,
      phi: phiRef.current,
      theta: 0.28,
      dark: isDark ? 1 : 0,
      diffuse: isDark ? 1.2 : 0.45,
      mapSamples: 14000,
      mapBrightness: isDark ? 5.2 : 1.4,
      baseColor: isDark ? [0.16, 0.21, 0.34] : [0.97, 0.98, 1],
      markerColor: isDark ? [0.25, 0.58, 1] : [0, 102 / 255, 1],
      glowColor: isDark ? [0.06, 0.15, 0.35] : [0.92, 0.95, 1],
      arcColor: isDark ? [0.28, 0.62, 1] : [0, 102 / 255, 1],
      arcWidth: 0.55,
      arcHeight: 0.28,
      markers: GLOBAL_EDGE_MARKERS,
      arcs: GLOBAL_EDGE_ARCS,
      ...config,
    };

    const globe = createGlobe(canvas, baseOpts);

    const onResize = () => {
      if (!canvas) return;
      width = canvas.offsetWidth || 560;
      globe.update({ width: width * dpr, height: width * dpr });
    };

    const tick = () => {
      if (!isVisible) return;
      if (pointerInteracting.current === null) {
        phiRef.current += 0.004;
      }
      globe.update({
        phi: phiRef.current + dragOffsetRef.current,
      });
      rafId = requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const nextVisible = Boolean(entries[0]?.isIntersecting);
        if (nextVisible && !isVisible) {
          isVisible = true;
          rafId = requestAnimationFrame(tick);
        } else if (!nextVisible && isVisible) {
          isVisible = false;
          cancelAnimationFrame(rafId);
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 },
    );

    observer.observe(container);
    window.addEventListener("resize", onResize, { passive: true });
    const fadeTimer = window.setTimeout(() => {
      if (canvasRef.current) canvasRef.current.style.opacity = "1";
    }, 40);

    return () => {
      window.clearTimeout(fadeTimer);
      cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
      globe.destroy();
    };
  }, [isDark, config]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "absolute inset-0 mx-auto aspect-square w-full max-w-[600px]",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        aria-label="Interactive global edge routing globe"
        className="size-full cursor-grab opacity-0 transition-opacity duration-500 [contain:layout_paint_size]"
        onPointerDown={(e) => updatePointerInteraction(e.clientX)}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onPointerMove={(e) => updateMovement(e.clientX)}
      />
    </div>
  );
}

export function GlobeFeatureSection() {
  return (
    <section
      id="global-control"
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] py-16 sm:py-24 px-5 sm:px-8 border-t border-[#E4E7EC] dark:border-white/[0.08] overflow-x-clip transition-colors duration-300"
    >
      <div className="relative mx-auto w-full max-w-[1280px] overflow-hidden rounded-[10px] bg-[#F7F8FA] dark:bg-[#111216] border border-[#E4E7EC] dark:border-white/[0.09] shadow-[0_12px_36px_-18px_rgba(16,24,40,0.08)] dark:shadow-[0_18px_48px_-18px_rgba(0,0,0,0.6)] px-6 py-14 sm:px-12 sm:py-20 md:px-16 md:py-24">
        <div className="flex flex-col-reverse items-center justify-between gap-10 md:flex-row">
          <div className="z-10 max-w-xl text-left">
            <h2 className="text-[28px] sm:text-[34px] lg:text-[38px] font-medium leading-[1.2] tracking-[-0.025em] text-[#09090B] dark:text-white text-balance">
              Track without limits with{" "}
              <span className="text-[#0066FF] dark:text-[#60A5FA] font-semibold">
                LShorter
              </span>
              .{" "}
              <span className="font-normal text-[#52525B] dark:text-zinc-400">
                Keep full control over every link, click, and redirect — everywhere your audience connects across 310+ global edge PoPs.
              </span>
            </h2>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#09090B] hover:bg-[#0066FF] dark:bg-white dark:hover:bg-[#0066FF] px-6 text-[14px] font-semibold text-white dark:text-[#09090B] dark:hover:text-white shadow-none transition-colors"
              >
                <Link href="/register">
                  <span>Start tracking free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div className="relative h-[220px] sm:h-[240px] w-full max-w-[520px] shrink-0">
            <Globe className="absolute -bottom-24 sm:-bottom-28 md:-right-28 lg:-right-36 scale-125 sm:scale-150" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default GlobeFeatureSection;
