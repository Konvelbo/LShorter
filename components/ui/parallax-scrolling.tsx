'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

export interface ParallaxComponentProps {
  title?: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  layer1Src?: string;
  layer2Src?: string;
  layer4Src?: string;
  enableSmoothScroll?: boolean;
}

export function ParallaxComponent({
  title = "Parallax",
  subtitle = "Ultra-Fast Edge Architecture",
  children,
  className = "",
  layer1Src = "/images/parallax/layer-1-sky.webp",
  layer2Src = "/images/parallax/layer-2-mountains.webp",
  layer4Src = "/images/parallax/layer-4-foreground.webp",
  enableSmoothScroll = true,
}: ParallaxComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current || !headerRef.current) return;

    // Respect reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    gsap.registerPlugin(ScrollTrigger);

    let lenisInstance: Lenis | null = null;
    let tickerHandler: ((time: number) => void) | null = null;

    // Scope GSAP tweens and ScrollTriggers strictly to this container
    const ctx = gsap.context(() => {
      const headerEl = headerRef.current;
      if (!headerEl) return;

      const tl = gsap.timeline({
        scrollTrigger: {
          id: 'parallax-track',
          trigger: headerEl,
          start: 'top top',
          end: 'bottom bottom',
          scrub: 0,
        },
      });

      const layers = [
        { layer: '1', yPercent: 25 }, // Subtle background sky drift with top overscan
        { layer: '2', yPercent: 45 }, // Midground mountains
        { layer: '3', yPercent: 35 }, // Title typography
        { layer: '4', yPercent: 12 }, // Foreground rocks & trees
      ];

      layers.forEach((layerObj, idx) => {
        const elements = headerEl.querySelectorAll(`[data-parallax-layer="${layerObj.layer}"]`);
        if (elements.length > 0) {
          tl.to(
            elements,
            {
              yPercent: layerObj.yPercent,
              ease: 'none',
              force3D: true,
            },
            idx === 0 ? undefined : '<'
          );
        }
      });
    }, containerRef);

    // Optional Lenis smooth inertial scrolling (tuned for instantaneous responsiveness)
    if (enableSmoothScroll) {
      try {
        lenisInstance = new Lenis({
          duration: 0.65,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: 'vertical',
          gestureOrientation: 'vertical',
          smoothWheel: true,
          wheelMultiplier: 1.25,
          touchMultiplier: 1.8,
        });

        lenisInstance.on('scroll', ScrollTrigger.update);

        tickerHandler = (time: number) => {
          lenisInstance?.raf(time * 1000);
        };

        gsap.ticker.add(tickerHandler);
        gsap.ticker.lagSmoothing(0);
        ScrollTrigger.refresh();
      } catch (e) {
        console.warn('Smooth scroll initialization fallback:', e);
      }
    }

    return () => {
      // Revert GSAP animations & kill only this component's triggers
      ctx.revert();
      if (tickerHandler) {
        gsap.ticker.remove(tickerHandler);
      }
      gsap.ticker.lagSmoothing(500, 33);
      if (lenisInstance) {
        lenisInstance.destroy();
      }
    };
  }, [enableSmoothScroll]);

  return (
    <div
      ref={containerRef}
      className={`parallax relative w-full overflow-hidden bg-[#FFFFFF] dark:bg-[#09090B] transition-colors duration-300 ${className}`}
    >
      {/* ── Scroll Track (135vh of scroll room for crisp, fluid scrubbing) ── */}
      <section ref={headerRef} className="parallax__header relative w-full h-[135dvh]">
        {/* ── Sticky Viewport (Pinned at top: 0, 100vh height) ── */}
        <div className="parallax__visuals sticky top-0 left-0 w-full h-[100dvh] overflow-hidden bg-neutral-950">
          <div className="parallax__black-line-overflow absolute -top-[1px] left-0 right-0 h-[2px] bg-transparent z-10" />

          {/* ── Multi-Layer Parallax Elements ── */}
          <div data-parallax-layers className="parallax__layers relative w-full h-full flex items-center justify-center">
            {/* Layer 1: Background Sky / Distant Peaks with 20% vertical overscan to prevent void */}
            <img
              src={layer1Src}
              loading="lazy"
              decoding="async"
              width="1920"
              height="1080"
              data-parallax-layer="1"
              alt="Parallax Background Sky"
              className="parallax__layer-img absolute -top-[20%] left-0 w-full h-[140%] object-cover pointer-events-none transform-gpu will-change-transform"
            />

            {/* Layer 2: Midground Mountain Ridge */}
            <img
              src={layer2Src}
              loading="lazy"
              decoding="async"
              width="1920"
              height="1080"
              data-parallax-layer="2"
              alt="Parallax Midground Mountains"
              className="parallax__layer-img absolute inset-0 w-full h-full object-cover pointer-events-none transform-gpu will-change-transform"
            />

            {/* Layer 3: Dynamic Parallax Title */}
            <div
              data-parallax-layer="3"
              className="parallax__layer-title absolute z-[3] flex flex-col items-center justify-center text-center pointer-events-none transform-gpu will-change-transform w-full px-4"
            >
              <span className="text-xs md:text-sm font-mono uppercase tracking-[0.35em] text-cyan-300/90 mb-3 drop-shadow-md">
                {subtitle}
              </span>
              <h2 className="parallax__title text-[clamp(2.75rem,10vw,9rem)] font-black tracking-[-0.04em] uppercase leading-[0.95] text-transparent bg-clip-text bg-gradient-to-b from-white via-white/95 to-white/70 drop-shadow-[0_10px_40px_rgba(0,0,0,0.6)]">
                {title}
              </h2>
            </div>

            {/* Layer 4: Foreground Ridge & Trees */}
            <img
              src={layer4Src}
              loading="lazy"
              decoding="async"
              width="1920"
              height="1080"
              data-parallax-layer="4"
              alt="Parallax Foreground Terrain"
              className="parallax__layer-img absolute inset-0 w-full h-full object-cover pointer-events-none transform-gpu will-change-transform z-[4]"
            />
          </div>

          {/* Smooth Fade Transition into adjacent content */}
          <div className="parallax__fade absolute bottom-0 left-0 w-full h-[280px] pointer-events-none z-[5] bg-gradient-to-t from-[#FFFFFF] dark:from-[#09090B] via-[#FFFFFF]/80 dark:via-[#09090B]/80 to-transparent" />
        </div>
      </section>

      {/* ── Content Section Underneath ── */}
      <section className="parallax__content relative z-[6] w-full flex flex-col items-center justify-center py-16 px-6 bg-[#FFFFFF] dark:bg-[#09090B] text-foreground transition-colors duration-300">
        {children ? (
          children
        ) : (
          <div className="flex flex-col items-center text-center max-w-2xl mx-auto space-y-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 160 160"
              fill="none"
              className="osmo-icon-svg w-12 h-12 text-purple-600 dark:text-purple-400"
            >
              <path
                d="M94.8284 53.8578C92.3086 56.3776 88 54.593 88 51.0294V0H72V59.9999C72 66.6273 66.6274 71.9999 60 71.9999H0V87.9999H51.0294C54.5931 87.9999 56.3777 92.3085 53.8579 94.8283L18.3431 130.343L29.6569 141.657L65.1717 106.142C67.684 103.63 71.9745 105.396 72 108.939V160L88.0001 160L88 99.9999C88 93.3725 93.3726 87.9999 100 87.9999H160V71.9999H108.939C105.407 71.9745 103.64 67.7091 106.12 65.1938L106.142 65.1716L141.657 29.6568L130.343 18.3432L94.8284 53.8578Z"
                fill="currentColor"
              />
            </svg>
            <p className="text-sm text-muted-foreground font-mono">
              Osmo Parallax Scroll Engine • Sub-millisecond scrubbing with GSAP 3 &amp; Lenis
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default ParallaxComponent;
