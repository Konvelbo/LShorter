"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export interface SmoothScrollToOptions {
  offset?: number;
  duration?: number;
  immediate?: boolean;
}

interface SmoothScrollContextType {
  lenis: Lenis | null;
  scrollTo: (
    target: string | number | HTMLElement,
    options?: SmoothScrollToOptions,
  ) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollTo: () => {},
});

export const useLenis = () => useContext(SmoothScrollContext);

const EXPO_OUT_EASING = (t: number) =>
  Math.min(1, 1.001 - Math.pow(2, -10 * t));

let activeLenisInstance: Lenis | null = null;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Shared smooth-scroll helper backed by the active Lenis instance.
 * Falls back cleanly to native scroll when reduced motion is active or Lenis is unmounted.
 */
export function smoothScrollTo(
  target: string | number | HTMLElement,
  options?: SmoothScrollToOptions,
) {
  if (typeof window === "undefined") return;

  const reduced = prefersReducedMotion();
  const resolvedEl =
    typeof target === "number"
      ? null
      : typeof target === "string"
        ? document.querySelector<HTMLElement>(target)
        : target;

  if (typeof target !== "number" && !resolvedEl) return;

  // Lenis v1.3 automatically honors CSS scroll-margin-top (e.g. Tailwind scroll-mt-20).
  // Only apply the default -80 navbar clearance when the target has no scroll-margin-top.
  const cssScrollMarginTop = resolvedEl
    ? Number.parseFloat(window.getComputedStyle(resolvedEl).scrollMarginTop) || 0
    : 0;
  const lenisOffset =
    options?.offset !== undefined
      ? options.offset
      : cssScrollMarginTop > 0
        ? 0
        : -80;

  if (activeLenisInstance && !reduced) {
    activeLenisInstance.scrollTo(resolvedEl ?? target, {
      offset: lenisOffset,
      duration: options?.immediate ? 0 : (options?.duration ?? 1.15),
      easing: EXPO_OUT_EASING,
      immediate: options?.immediate ?? false,
    });
    return;
  }

  let top = 0;
  if (typeof target === "number") {
    top = Math.max(0, target + (options?.offset ?? 0));
  } else if (resolvedEl) {
    const nativeOffset =
      options?.offset !== undefined
        ? options.offset
        : -(cssScrollMarginTop || 80);
    top = Math.max(
      0,
      resolvedEl.getBoundingClientRect().top + window.scrollY + nativeOffset,
    );
  }

  window.scrollTo({
    top,
    behavior: reduced || options?.immediate ? "auto" : "smooth",
  });
}

/**
 * Smooth Scroll Provider (Lenis + GSAP ScrollTrigger Single-Loop Architecture)
 * - Silky, frame-rate-independent inertial wheel scrolling across the entire landing page.
 * - Driven exclusively by gsap.ticker (no competing rAF loop, zero ScrollTrigger jitter).
 * - Honors OS prefers-reduced-motion (including live preference toggles).
 * - Preserves native touch physics on mobile and allows nested scrollable panels.
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let instance: Lenis | null = null;
    let tickerFn: ((time: number) => void) | null = null;
    let resizeTimer: number | null = null;

    const teardown = () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
        resizeTimer = null;
      }
      if (tickerFn) {
        gsap.ticker.remove(tickerFn);
        tickerFn = null;
      }
      if (instance) {
        instance.off("scroll", ScrollTrigger.update);
        instance.destroy();
        instance = null;
      }
      activeLenisInstance = null;
      setLenis(null);
    };

    const setup = () => {
      teardown();
      if (mq.matches) return;

      instance = new Lenis({
        lerp: 0.085,
        smoothWheel: true,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.4,
        syncTouch: false,
        autoResize: true,
        allowNestedScroll: true,
        autoRaf: false,
      });

      activeLenisInstance = instance;
      setLenis(instance);

      // Single unified loop: GSAP ticker drives Lenis (seconds -> ms) & updates ScrollTrigger
      instance.on("scroll", ScrollTrigger.update);
      tickerFn = (time: number) => {
        instance?.raf(time * 1000);
      };
      gsap.ticker.add(tickerFn);
      gsap.ticker.lagSmoothing(0);

      // Refresh measurements once web fonts & late media settle
      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          instance?.resize();
          ScrollTrigger.refresh();
        });
      }
      resizeTimer = window.setTimeout(() => {
        instance?.resize();
        ScrollTrigger.refresh();
      }, 400);
    };

    setup();

    const handleReducedMotionChange = () => {
      setup();
    };

    const handleFullscreenChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isFullscreen: boolean }>;
      if (customEvent.detail?.isFullscreen) {
        instance?.stop();
      } else {
        instance?.start();
      }
    };

    const handleAnchorClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (href.startsWith("#") && href.length > 1) {
        const targetEl = document.querySelector<HTMLElement>(href);
        if (targetEl) {
          e.preventDefault();
          smoothScrollTo(targetEl, { duration: 1.15 });
        }
      } else if (
        href.startsWith("/#") &&
        href.length > 2 &&
        (window.location.pathname === "/" || window.location.pathname === "")
      ) {
        const targetId = href.substring(1);
        const targetEl = document.querySelector<HTMLElement>(targetId);
        if (targetEl) {
          e.preventDefault();
          smoothScrollTo(targetEl, { duration: 1.15 });
        }
      }
    };

    mq.addEventListener("change", handleReducedMotionChange);
    window.addEventListener("product-fullscreen-change", handleFullscreenChange);
    document.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      mq.removeEventListener("change", handleReducedMotionChange);
      window.removeEventListener("product-fullscreen-change", handleFullscreenChange);
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      teardown();
    };
  }, []);

  // Re-measure document height on route changes & honor incoming #hash targets
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = window.setTimeout(() => {
      activeLenisInstance?.resize();
      ScrollTrigger.refresh();

      if (window.location.hash && window.location.hash.length > 1) {
        const targetEl = document.querySelector<HTMLElement>(window.location.hash);
        if (targetEl) {
          smoothScrollTo(targetEl, { duration: 1.0 });
        }
      }
    }, 120);

    return () => window.clearTimeout(timer);
  }, [pathname]);

  const scrollTo = useCallback(
    (target: string | number | HTMLElement, options?: SmoothScrollToOptions) => {
      smoothScrollTo(target, options);
    },
    [],
  );

  const contextValue = useMemo<SmoothScrollContextType>(
    () => ({ lenis, scrollTo }),
    [lenis, scrollTo],
  );

  return (
    <SmoothScrollContext.Provider value={contextValue}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

export default SmoothScrollProvider;
