"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useMobileMenu } from "@/components/providers/use-mobile-menu";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { useSession } from "next-auth/react";
import { useTheme } from "@/components/providers/theme-provider";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, setIsOpen } = useMobileMenu();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isFullscreen: boolean }>;
      setIsIframeFullscreen(Boolean(customEvent.detail?.isFullscreen));
    };

    window.addEventListener("product-fullscreen-change", handleFullscreenChange);
    return () => {
      window.removeEventListener("product-fullscreen-change", handleFullscreenChange);
    };
  }, []);

  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const ghostFrameRef = useRef<HTMLDivElement>(null);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const navbarWrapperRef = useRef<HTMLDivElement>(null);
  const linksRef = useRef<HTMLDivElement[]>([]);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  const isAuthenticated =
    status === "authenticated" &&
    Boolean(session?.user) &&
    !(session?.user as any)?.userNotFound;
  const hasCompletedOnboarding =
    (session?.user as any)?.hasCompletedOnboarding === true;

  const handleCloseMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.to(e.currentTarget, {
      rotate: "+=90",
      scale: 0.85,
      duration: 0.2,
      onComplete: () => setIsOpen(false),
    });
  };

  const navLinks = [
    { label: "Hi", href: "/", isHome: true },
    { label: "Product", href: "/#product" },
    { label: "Features", href: "/#features" },
    { label: "Security", href: "/#security" },
    { label: "Difference", href: "/#why-us" },
    { label: "Limits", href: "/#analytics" },
    { label: "FAQ", href: "/#faq" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
  ];

  useGSAP(
    () => {
      const mainCard = mainCardRef.current;
      const ghostFrame = ghostFrameRef.current;
      const menu = menuContainerRef.current;
      const container = containerRef.current;
      const navbarWrapper = navbarWrapperRef.current;

      if (!mainCard || !ghostFrame || !menu || !container || !navbarWrapper)
        return;

      const activeBorder = isLight
        ? "1px solid rgba(9, 9, 11, 0.1)"
        : "1px solid rgba(255, 255, 255, 0.12)";

      const cardShadow = isLight
        ? "-24px 0 60px rgba(0, 0, 0, 0.10)"
        : "-24px 0 60px rgba(0, 0, 0, 0.75)";

      mainCard.removeAttribute("style");
      container.removeAttribute("style");

      const tl = gsap.timeline({
        paused: true,
        defaults: { ease: "power3.inOut", duration: 0.42 },
        onStart: () => {
          gsap.set(container, { perspective: 1300, overflow: "hidden" });
          gsap.set([mainCard, ghostFrame], {
            transformOrigin: "left center",
            transformStyle: "preserve-3d",
            force3D: true,
          });
          gsap.set(mainCard, { height: "100dvh", overflow: "hidden" });
          document.body.style.overflow = "hidden";
        },
        onReverseComplete: () => {
          mainCard.removeAttribute("style");
          ghostFrame.removeAttribute("style");
          container.removeAttribute("style");
          navbarWrapper.removeAttribute("style");
          document.body.style.overflow = "";
        },
      });

      tl.to(
        mainCard,
        {
          scale: 0.81,
          xPercent: -42,
          rotateY: 30,
          borderRadius: 32,
          border: activeBorder,
          boxShadow: cardShadow,
        },
        0
      )
        .to(
          ghostFrame,
          {
            scale: 0.81,
            xPercent: -36,
            rotateY: 30,
            autoAlpha: 1,
            borderRadius: 32,
            border: activeBorder,
          },
          0
        )
        .to(navbarWrapper, { autoAlpha: 0, duration: 0.2 }, 0)
        .to(menu, { autoAlpha: 1, duration: 0.2 }, 0)
        .fromTo(
          linksRef.current.filter(Boolean),
          { autoAlpha: 0, y: 10 },
          { autoAlpha: 1, y: 0, stagger: 0.025, duration: 0.22 },
          0.08
        );

      timelineRef.current = tl;
    },
    { scope: containerRef, dependencies: [isLight] }
  );

  useEffect(() => {
    if (timelineRef.current) {
      if (isOpen) {
        timelineRef.current.play();
      } else {
        timelineRef.current.reverse();
      }
    }
  }, [isOpen]);

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full bg-[#F4F4F5] dark:bg-[#0A0A0A] text-[#09090B] dark:text-[#FAFAFA] select-none font-sans transition-colors duration-300"
    >
      <div
        ref={menuContainerRef}
        className="fixed inset-y-0 right-0 w-full flex justify-end z-0 pointer-events-none opacity-0 invisible"
      >
        <div className="w-[58%] max-w-[300px] h-full flex flex-col justify-between py-8 px-5 sm:px-7 pointer-events-auto">
          <div className="flex items-center justify-end pt-1 w-full">
            <button
              type="button"
              onClick={handleCloseMenu}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white transition-colors"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5 stroke-[1.75]" />
            </button>
          </div>

          <nav className="flex flex-col justify-center items-center text-center gap-2.5 my-auto w-full">
            {navLinks.map((item, idx) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href) && !item.href.includes("#");

              return (
                <div
                  key={item.label}
                  ref={(el) => {
                    if (el) linksRef.current[idx] = el;
                  }}
                  className="w-full flex justify-center"
                >
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-[10px] text-[16px] tracking-[-0.01em] outline-none transition-colors text-center ${
                      isActive
                        ? "bg-black/[0.05] dark:bg-white/[0.08] text-[#09090B] dark:text-white font-medium"
                        : "text-[#52525B] dark:text-[#A1A1AA] font-normal hover:text-[#09090B] dark:hover:text-white"
                    }`}
                  >
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />}
                    <span>{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-black/[0.08] dark:border-white/[0.08] w-full">
            <Link
              href={
                isAuthenticated && hasCompletedOnboarding
                  ? "/dashboard"
                  : isAuthenticated
                  ? "/onboarding"
                  : "/register"
              }
              onClick={() => setIsOpen(false)}
              className="w-full h-11 rounded-[12px] bg-[#3B82F6] hover:bg-[#2563EB] text-white font-medium text-xs sm:text-sm border border-black/[0.06] dark:border-white/[0.1] shadow-xs flex items-center justify-center gap-2 transition-colors"
            >
              {isAuthenticated ? (
                <>
                  <LayoutDashboard className="w-4 h-4 text-white" />
                  <span className="text-white">Go in the dashboard</span>
                </>
              ) : (
                <span className="text-white">Get started free</span>
              )}
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </div>
      </div>

      <div
        ref={ghostFrameRef}
        className="fixed inset-0 z-10 pointer-events-none bg-black/[0.03] dark:bg-white/[0.04] shadow-xl opacity-0 invisible"
      />

      <div
        ref={mainCardRef}
        className="relative z-20 w-full min-h-screen bg-[#FAFAFA] dark:bg-[#09090b] text-[#09090B] dark:text-[#fafafa]"
      >
        {isOpen && (
          <div
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 z-[999] cursor-pointer bg-black/15"
          />
        )}

        <div className="w-full relative flex flex-col">
          <main className="w-full flex flex-col">{children}</main>
          <LandingFooter />
        </div>
      </div>

      {/* Wrapper de la Navbar masqué sans latence lors du plein écran */}
      <div
        ref={navbarWrapperRef}
        style={{ display: isIframeFullscreen ? "none" : undefined }}
        className={`fixed top-0 inset-x-0 z-[9999] pointer-events-none transition-opacity duration-200 ${
          isIframeFullscreen ? "opacity-0 invisible pointer-events-none -z-50" : ""
        }`}
      >
        <LandingNavbar />
      </div>
    </div>
  );
}
