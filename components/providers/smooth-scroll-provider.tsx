"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo } from "react";

interface SmoothScrollContextType {
  lenis: null;
  scrollTo: (target: string | HTMLElement, options?: { offset?: number }) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollTo: () => {},
});

export const useLenis = () => useContext(SmoothScrollContext);

let pendingAdjustCleanup: (() => void) | null = null;

function scrollToTarget(target: string | HTMLElement, offset = -80) {
  if (typeof window === "undefined") return;
  const el =
    typeof target === "string" ? document.querySelector<HTMLElement>(target) : target;
  if (!el) return;

  if (pendingAdjustCleanup) {
    pendingAdjustCleanup();
    pendingAdjustCleanup = null;
  }

  const computeTop = () =>
    Math.max(0, el.getBoundingClientRect().top + window.scrollY + offset);

  window.scrollTo({ top: computeTop(), behavior: "smooth" });

  // Re-align once if offscreen content-visibility sections expanded during scroll
  let settled = false;
  const settle = () => {
    if (settled) return;
    settled = true;
    cleanup();
    const desired = computeTop();
    if (Math.abs(window.scrollY - desired) > 24) {
      window.scrollTo({ top: desired, behavior: "smooth" });
    }
  };

  const timer = window.setTimeout(settle, 650);
  const onUserInterrupt = () => cleanup();
  const cleanup = () => {
    window.clearTimeout(timer);
    window.removeEventListener("scrollend", settle);
    window.removeEventListener("wheel", onUserInterrupt);
    window.removeEventListener("touchstart", onUserInterrupt);
    if (pendingAdjustCleanup === cleanup) {
      pendingAdjustCleanup = null;
    }
  };

  pendingAdjustCleanup = cleanup;
  window.addEventListener("scrollend", settle, { once: true });
  window.addEventListener("wheel", onUserInterrupt, { once: true, passive: true });
  window.addEventListener("touchstart", onUserInterrupt, { once: true, passive: true });
}

/**
 * Native Hardware-Composited Scroll Provider
 * Uses the browser's zero-latency compositor thread for wheel & touch scrolling
 * (no JS wheel hijacking or continuous 60fps ticker), while still providing
 * smooth offset-adjusted anchor scrolling for in-page section links.
 */
export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement | null)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      if (href.startsWith("#") && href.length > 1) {
        const targetEl = document.querySelector<HTMLElement>(href);
        if (targetEl) {
          e.preventDefault();
          scrollToTarget(targetEl, -80);
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
          scrollToTarget(targetEl, -80);
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      if (pendingAdjustCleanup) {
        pendingAdjustCleanup();
        pendingAdjustCleanup = null;
      }
    };
  }, []);

  const scrollTo = useCallback(
    (target: string | HTMLElement, options?: { offset?: number }) => {
      scrollToTarget(target, options?.offset ?? -80);
    },
    [],
  );

  const contextValue = useMemo<SmoothScrollContextType>(
    () => ({ lenis: null, scrollTo }),
    [scrollTo],
  );

  return (
    <SmoothScrollContext.Provider value={contextValue}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

export default SmoothScrollProvider;
