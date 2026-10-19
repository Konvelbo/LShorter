"use client";

import React, { useEffect, useState, useRef, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function RouteProgressBarInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetBar = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    setIsVisible(false);
    setIsNavigating(false);
    setProgress(0);
  };

  // When pathname or searchParams change, navigation has successfully completed
  useEffect(() => {
    if (isNavigating) {
      setProgress(100);
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);

      hideTimerRef.current = setTimeout(() => {
        setIsVisible(false);
        setIsNavigating(false);
        setProgress(0);
      }, 250);
    }

    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      // Find closest anchor tag
      const target = (e.target as HTMLElement)?.closest("a");
      if (!target) return;

      const href = target.getAttribute("href");
      if (!href) return;

      // Ignore download links, external links, mailto/tel, hash, new tabs, modifier keys
      if (
        target.hasAttribute("download") ||
        href.startsWith("http://") ||
        href.startsWith("https://") ||
        href.startsWith("//") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#") ||
        target.target === "_blank" ||
        e.ctrlKey ||
        e.metaKey ||
        e.shiftKey ||
        e.altKey
      ) {
        return;
      }

      // Check if target href is the exact current URL (avoid animating when already on page)
      const currentUrl =
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : "";
      if (href === currentUrl) return;

      // Reset any active timers
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);

      setIsVisible(true);
      setIsNavigating(true);
      setProgress(25);

      // Smooth progress animation while page loads
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) {
            if (timerRef.current) clearInterval(timerRef.current);
            return 85;
          }
          return prev + (85 - prev) * 0.2;
        });
      }, 100);

      // Watchdog safety timeout: auto-hide after 6 seconds if navigation is aborted or cancelled
      watchdogTimerRef.current = setTimeout(() => {
        resetBar();
      }, 6000);
    };

    // Bubble phase listener so e.defaultPrevented is accurately checked after child handlers
    document.addEventListener("click", handleDocumentClick);

    return () => {
      document.removeEventListener("click", handleDocumentClick);
      if (timerRef.current) clearInterval(timerRef.current);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (watchdogTimerRef.current) clearTimeout(watchdogTimerRef.current);
    };
  }, []);

  if (!isVisible && progress === 0) return null;

  return (
    <div
      role="progressbar"
      aria-hidden={!isVisible}
      className="fixed top-0 left-0 right-0 z-[999999] h-[2.5px] pointer-events-none transition-opacity duration-200"
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      <div
        className="h-full bg-[#0066FF] shadow-[0_0_10px_#0066FF,0_0_4px_#5294FF] transition-all duration-200 ease-out"
        style={{
          width: `${progress}%`,
        }}
      />
    </div>
  );
}

export function RouteProgressBar() {
  return (
    <Suspense fallback={null}>
      <RouteProgressBarInner />
    </Suspense>
  );
}
