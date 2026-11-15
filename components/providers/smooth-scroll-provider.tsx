"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useMobileMenu } from "@/components/providers/use-mobile-menu";

interface SmoothScrollContextType {
  lenis: Lenis | null;
  scrollTo: (target: string | HTMLElement, options?: any) => void;
}

const SmoothScrollContext = createContext<SmoothScrollContextType>({
  lenis: null,
  scrollTo: () => {},
});

export const useLenis = () => useContext(SmoothScrollContext);

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [lenisInstance, setLenisInstance] = useState<Lenis | null>(null);
  const lenisRef = useRef<Lenis | null>(null);
  const { isOpen } = useMobileMenu();

  // Pause smooth scroll when mobile navigation menu is open
  useEffect(() => {
    if (!lenisRef.current) return;
    if (isOpen) {
      lenisRef.current.stop();
    } else {
      lenisRef.current.start();
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Register GSAP ScrollTrigger
    gsap.registerPlugin(ScrollTrigger);

    // Keep GSAP lag smoothing active to prevent thread locking during page load
    gsap.ticker.lagSmoothing(500, 33);

    // Initialize Lenis: Fast, lightweight, zero-latency responsive scroll with silky anti-jank easing
    const lenis = new Lenis({
      lerp: 0.1, // Fast responsive initial pickup (no rubber-band latency) + silky deceleration
      wheelMultiplier: 1.0, // 1:1 natural wheel response
      touchMultiplier: 1.2,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: true, // Native browser compositor VSync loop for 0ms overhead
      orientation: "vertical",
      gestureOrientation: "vertical",
      respectReducedMotion: false,
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);
    (window as any).__lenis = lenis;
    (window as any).lenisInstance = lenis;

    // Synchronize Lenis scroll position with GSAP ScrollTrigger
    const onScroll = () => {
      ScrollTrigger.update();
    };
    lenis.on("scroll", onScroll);

    // Smooth anchor navigation handling (e.g. #features, #security, #why-us, #product, #faq)
    const handleAnchorClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Local hash link e.g. #features
      if (href.startsWith("#") && href.length > 1) {
        const targetEl = document.querySelector(href);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl as HTMLElement, {
            offset: -80,
            duration: 1.0,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        }
      }
      // Path + hash link e.g. /#features on the landing page
      else if (
        href.startsWith("/#") &&
        href.length > 2 &&
        (window.location.pathname === "/" || window.location.pathname === "")
      ) {
        const targetId = href.substring(1);
        const targetEl = document.querySelector(targetId);
        if (targetEl) {
          e.preventDefault();
          lenis.scrollTo(targetEl as HTMLElement, {
            offset: -80,
            duration: 1.0,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      lenis.off("scroll", onScroll);
      lenis.destroy();
      lenisRef.current = null;
      setLenisInstance(null);
    };
  }, []);

  const scrollTo = (target: string | HTMLElement, options?: any) => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(target, options);
    } else if (typeof target === "string") {
      const el = document.querySelector(target);
      el?.scrollIntoView({ behavior: "smooth" });
    } else if (target instanceof HTMLElement) {
      target.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <SmoothScrollContext.Provider value={{ lenis: lenisInstance, scrollTo }}>
      {children}
    </SmoothScrollContext.Provider>
  );
}

export default SmoothScrollProvider;
