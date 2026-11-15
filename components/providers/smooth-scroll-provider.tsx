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

    // Initialize Lenis with signature butter-smooth continuous lerp momentum
    // (Noticeable floating glide, organic damping, and 120fps sync)
    const lenis = new Lenis({
      lerp: 0.055, // Super luxurious butter-smooth inertia (noticeable floating glide)
      wheelMultiplier: 1.25, // Generous travel per notch so momentum is instantly felt
      touchMultiplier: 1.6,
      smoothWheel: true,
      syncTouch: false,
      orientation: "vertical",
      gestureOrientation: "vertical",
      respectReducedMotion: false, // Ensure smooth scroll is never silently bypassed by OS settings
    });

    lenisRef.current = lenis;
    setLenisInstance(lenis);
    (window as any).__lenis = lenis;
    (window as any).lenisInstance = lenis;

    // Synchronize Lenis scroll position with GSAP ScrollTrigger
    lenis.on("scroll", ScrollTrigger.update);

    // Drive Lenis through GSAP's optimized 60/120fps ticker
    const tickerUpdate = (time: number) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(tickerUpdate);
    gsap.ticker.lagSmoothing(0);

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
            duration: 1.4,
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
            duration: 1.4,
            easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          });
        }
      }
    };

    document.addEventListener("click", handleAnchorClick, { capture: true });

    return () => {
      document.removeEventListener("click", handleAnchorClick, { capture: true });
      gsap.ticker.remove(tickerUpdate);
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
