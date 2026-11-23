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

export const lerp = (start: number, end: number, factor: number): number =>
  start + (end - start) * factor;

const EXPO_OUT_EASING = (t: number) =>
  Math.min(1, 1.001 - Math.pow(2, -10 * t));

let activeLenisInstance: Lenis | null = null;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Shared smooth-scroll helper backed by the active Lenis instance.
 * Automatically respects CSS `scroll-margin-top` (e.g. Tailwind `scroll-mt-20`).
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
 * Hand-rolled rAF + lerp parallax closure (React 19 StrictMode-safe teardown).
 * - `.parallax-image`: exact tuning constants (depth 0.2, lerp 0.1, scale 1.25 -> 1.5).
 * - `[data-parallax="float"]`: viewport-centered soft parallax lag (lerp 0.1, scale 1)
 *   for UI frames, videos, code terminals, and the 3D globe without clipping text.
 */
function initParallaxElement(el: HTMLElement, lenis: Lenis): () => void {
  const mode = el.dataset.parallax || (el.classList.contains("parallax-image") ? "image" : "float");
  const isImageMode = mode === "image";

  const depth = Number.parseFloat(
    el.dataset.parallaxDepth || (isImageMode ? "0.2" : "0.08"),
  );
  const smoothing = Number.parseFloat(el.dataset.parallaxSmoothing || "0.1");
  const initialScale = Number.parseFloat(
    el.dataset.parallaxInitialScale || (isImageMode ? "1.25" : "1"),
  );
  const activeScale = Number.parseFloat(
    el.dataset.parallaxScale || (isImageMode ? "1.5" : "1"),
  );
  const maxDrift = Number.parseFloat(
    el.dataset.parallaxMax || (isImageMode ? "220" : "40"),
  );

  let bounds: { top: number; bottom: number; centerY: number } | null = null;
  let currentTranslateY = 0;
  let targetTranslateY = 0;
  let hasScrolled = false;
  const initialScrollY = window.scrollY;
  let frameId: number | null = null;

  const prevWillChange = el.style.willChange;
  const prevTransform = el.style.transform;

  el.style.willChange = "transform";
  if (isImageMode) {
    el.style.transform = `translate3d(0, 0px, 0) scale(${initialScale})`;
  } else {
    el.style.transform = "translate3d(0, 0px, 0)";
  }

  const updateBounds = () => {
    const rect = el.getBoundingClientRect();
    // Compensate for our own current translateY so resize measurements stay accurate
    const top = rect.top + window.scrollY - currentTranslateY;
    const bottom = rect.bottom + window.scrollY - currentTranslateY;
    bounds = {
      top,
      bottom,
      centerY: top + (bottom - top) / 2,
    };
  };

  updateBounds();

  const onScroll = ({ scroll }: { scroll: number }) => {
    if (!bounds) return;
    if (!hasScrolled && Math.abs(scroll - initialScrollY) < 0.5) return;
    hasScrolled = true;

    if (isImageMode) {
      const relativeScroll = scroll - bounds.top;
      const rawTarget = relativeScroll * depth;
      targetTranslateY = Math.max(-maxDrift, Math.min(maxDrift, rawTarget));
    } else {
      const viewportCenter = scroll + window.innerHeight * 0.5;
      const relativeScroll = viewportCenter - bounds.centerY;
      const rawTarget = relativeScroll * depth;
      targetTranslateY = Math.max(-maxDrift, Math.min(maxDrift, rawTarget));
    }
  };

  lenis.on("scroll", onScroll);
  window.addEventListener("resize", updateBounds, { passive: true });

  const animate = () => {
    currentTranslateY = lerp(currentTranslateY, targetTranslateY, smoothing);
    if (hasScrolled && Math.abs(currentTranslateY - targetTranslateY) > 0.01) {
      if (isImageMode) {
        el.style.transform = `translate3d(0, ${currentTranslateY.toFixed(2)}px, 0) scale(${activeScale})`;
      } else {
        el.style.transform = `translate3d(0, ${currentTranslateY.toFixed(2)}px, 0)`;
      }
    }
    frameId = requestAnimationFrame(animate);
  };

  frameId = requestAnimationFrame(animate);

  return () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }
    lenis.off("scroll", onScroll);
    window.removeEventListener("resize", updateBounds);
    el.style.willChange = prevWillChange;
    el.style.transform = prevTransform;
  };
}

/**
 * Smooth Scroll + Lerp Parallax Provider
 * - Single Lenis instance (`autoRaf: true`, buttery `lerp: 0.075`) across the entire landing page.
 * - Keeps GSAP ScrollTrigger synced via `lenis.on("scroll", ScrollTrigger.update)` with zero duplicate loop.
 * - Drives `.parallax-image` and `[data-parallax]` elements with hand-rolled rAF + `lerp(..., 0.1)`.
 * - Full React 19 StrictMode teardown and live `prefers-reduced-motion` support.
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  // 1. Single Lenis instance lifecycle
  useEffect(() => {
    if (typeof window === "undefined") return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    let instance: Lenis | null = null;
    let resizeTimer: number | null = null;
    let scrollTriggerMod: { update: () => void; refresh: () => void } | null = null;

    const syncScrollTriggerRefresh = () => {
      scrollTriggerMod?.refresh();
    };

    const teardown = () => {
      if (resizeTimer !== null) {
        window.clearTimeout(resizeTimer);
        resizeTimer = null;
      }
      if (instance) {
        if (scrollTriggerMod) {
          instance.off("scroll", scrollTriggerMod.update);
        }
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
        autoRaf: true,
        lerp: 0.075,
        smoothWheel: true,
        wheelMultiplier: 0.95,
        touchMultiplier: 1.4,
        syncTouch: false,
        autoResize: true,
        allowNestedScroll: true,
      });

      activeLenisInstance = instance;
      setLenis(instance);

      // Lazily wire GSAP ScrollTrigger only on /docs routes that actually register ScrollTriggers
      if (window.location.pathname.startsWith("/docs")) {
        import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
          scrollTriggerMod = ScrollTrigger;
          instance?.on("scroll", ScrollTrigger.update);
          ScrollTrigger.refresh();
        });
      }

      if (document.fonts?.ready) {
        document.fonts.ready.then(() => {
          instance?.resize();
          syncScrollTriggerRefresh();
        });
      }
      resizeTimer = window.setTimeout(() => {
        instance?.resize();
        syncScrollTriggerRefresh();
      }, 400);
    };

    setup();

    const handleReducedMotionChange = () => setup();

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

  // 2. Scoped rAF + lerp parallax bindings across <main> (StrictMode-safe teardown per route)
  useEffect(() => {
    if (typeof window === "undefined" || !lenis) return;

    let teardowns: Array<() => void> = [];

    const bindParallax = () => {
      teardowns.forEach((fn) => fn());
      teardowns = [];

      const root = document.querySelector("main") || document.body;
      const targets = root.querySelectorAll<HTMLElement>(
        ".parallax-image, [data-parallax]",
      );
      teardowns = Array.from(targets, (el) => initParallaxElement(el, lenis));
    };

    // Wait one paint after route render so layout bounds are settled
    const rafBind = requestAnimationFrame(() => {
      bindParallax();
      lenis.resize();
      if (pathname.startsWith("/docs")) {
        import("gsap/ScrollTrigger").then(({ ScrollTrigger }) => {
          ScrollTrigger.refresh();
        });
      }
    });

    const hashTimer = window.setTimeout(() => {
      lenis.resize();
      if (window.location.hash && window.location.hash.length > 1) {
        const targetEl = document.querySelector<HTMLElement>(window.location.hash);
        if (targetEl) {
          smoothScrollTo(targetEl, { duration: 1.0 });
        }
      }
    }, 150);

    return () => {
      cancelAnimationFrame(rafBind);
      window.clearTimeout(hashTimer);
      teardowns.forEach((fn) => fn());
      teardowns = [];
    };
  }, [lenis, pathname]);

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
