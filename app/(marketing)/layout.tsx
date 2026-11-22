"use client";

import React, { useEffect, useState } from "react";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isFullscreen: boolean }>;
      setIsIframeFullscreen(Boolean(customEvent.detail?.isFullscreen));
    };

    window.addEventListener("product-fullscreen-change", handleFullscreenChange);
    return () => {
      window.removeEventListener(
        "product-fullscreen-change",
        handleFullscreenChange,
      );
    };
  }, []);

  return (
    <SmoothScrollProvider>
      <div className="relative min-h-screen w-full bg-[#FFFFFF] dark:bg-[#09090B] text-[#09090B] dark:text-[#FAFAFA] font-sans">
        <div className="w-full relative flex flex-col">
          <main className="w-full flex flex-col">{children}</main>
          <LandingFooter />
        </div>

        {/* Fixed Marketing Navbar (hidden instantaneously in fullscreen video mode) */}
        <div
          style={{ display: isIframeFullscreen ? "none" : undefined }}
          className={`fixed top-0 inset-x-0 z-[9999] pointer-events-none transition-opacity duration-200 ${
            isIframeFullscreen
              ? "opacity-0 invisible pointer-events-none -z-50"
              : ""
          }`}
        >
          <LandingNavbar />
        </div>
      </div>
    </SmoothScrollProvider>
  );
}
