"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { COBEOptions } from "cobe";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/providers/theme-provider";
import { useI18n } from "@/components/providers/i18n-provider";
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
  const { tr } = useI18n();
  const [isDark, setIsDark] = useState(theme === "dark");
  const [shouldInit, setShouldInit] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const dragOffsetRef = useRef<number>(0);
  const phiRef = useRef<number>(0.6);

  // Defer importing cobe & compiling WebGL shaders until the Globe section nears the viewport
  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldInit) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldInit(true);
          io.disconnect();
        }
      },
      { rootMargin: "400px 0px", threshold: 0.01 },
    );
    io.observe(container);
    return () => io.disconnect();
  }, [shouldInit]);

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
    if (!shouldInit) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    let cancelled = false;
    let width = canvas.offsetWidth || 560;
    let rafId = 0;
    let isVisible = false;
    let fadeTimer = 0;
    let globe: { update: (opts: Partial<COBEOptions>) => void; destroy: () => void } | null = null;
    let observer: IntersectionObserver | null = null;
    let onResize: (() => void) | null = null;

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

    import("cobe").then(({ default: createGlobe }) => {
      if (cancelled || !canvasRef.current || !containerRef.current) return;
      globe = createGlobe(canvasRef.current, baseOpts);

      onResize = () => {
        if (!canvasRef.current || !globe) return;
        width = canvasRef.current.offsetWidth || 560;
        globe.update({ width: width * dpr, height: width * dpr });
      };

      const tick = () => {
        if (!isVisible || !globe) return;
        if (pointerInteracting.current === null) {
          phiRef.current += 0.004;
        }
        globe.update({
          phi: phiRef.current + dragOffsetRef.current,
        });
        rafId = requestAnimationFrame(tick);
      };

      observer = new IntersectionObserver(
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

      observer.observe(containerRef.current);
      window.addEventListener("resize", onResize, { passive: true });
      fadeTimer = window.setTimeout(() => {
        if (canvasRef.current) canvasRef.current.style.opacity = "1";
      }, 40);
    });

    return () => {
      cancelled = true;
      window.clearTimeout(fadeTimer);
      cancelAnimationFrame(rafId);
      observer?.disconnect();
      if (onResize) window.removeEventListener("resize", onResize);
      globe?.destroy();
    };
  }, [shouldInit, isDark, config]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative aspect-square w-full max-w-[760px]",
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        aria-label={tr(
          "Interactive global edge routing globe",
          "Globe interactif du routage edge mondial"
        )}
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
  const { tr } = useI18n();

  return (
    <section
      id="global-control"
      className="relative w-full overflow-hidden bg-[#FFFFFF] dark:bg-[#09090B] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300"
    >
      <div className="relative mx-auto w-full max-w-[1520px] px-6 sm:px-10 xl:px-14 py-20 sm:py-28 lg:py-32">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center gap-12 lg:gap-8">
          <div className="relative z-10 lg:col-span-6 max-w-[620px] text-left">
            <h2 className="text-[30px] sm:text-[38px] lg:text-[44px] font-medium leading-[1.16] tracking-[-0.025em] text-[#09090B] dark:text-white text-balance">
              {tr("Track without limits with", "Suivez sans limites avec")}{" "}
              <span className="text-[#0066FF] dark:text-[#60A5FA] font-semibold">
                LShorter
              </span>
              .{" "}
              <span className="font-normal text-[#52525B] dark:text-zinc-400">
                {tr(
                  "Keep full control over every link, click, and redirect — everywhere your audience connects across 310+ global edge PoPs.",
                  "Gardez le contrôle total sur chaque lien, clic et redirection — partout où votre audience se connecte sur plus de 310 PoP edge mondiaux."
                )}
              </span>
            </h2>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                asChild
                className="inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#09090B] hover:bg-[#0066FF] dark:bg-white dark:hover:bg-[#0066FF] px-6 text-[14.5px] font-semibold text-white dark:text-[#09090B] dark:hover:text-white shadow-none transition-[background-color,border-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow"
              >
                <Link href="/register">
                  <span>{tr("Start tracking free", "Commencer gratuitement")}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>

          <div
            data-parallax="float"
            data-parallax-depth="0.14"
            data-parallax-max="54"
            className="relative lg:col-span-6 h-[320px] sm:h-[380px] lg:h-[380px] w-full"
          >
            <Globe className="absolute left-1/2 -translate-x-1/2 -top-8 w-[480px] sm:w-[620px] lg:left-auto lg:translate-x-0 lg:-right-16 xl:-right-8 lg:-top-16 lg:w-[760px]" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default GlobeFeatureSection;
