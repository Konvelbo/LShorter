"use client";

import React, { useRef, useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  Menu,
  X,
  LayoutDashboard,
  Sun,
  Moon,
  Terminal,
  Globe,
  Lock,
  BarChart3,
  Play,
  Link2,
  ArrowUpRight,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "@/components/providers/theme-provider";
import { useMobileMenu } from "@/components/providers/use-mobile-menu";
import { useSession } from "next-auth/react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import { scrollToHeroShortener } from "@/components/marketing/swiss-frame";

// ─── DESKTOP NAV LINK WITH VERTICAL TEXT-ROLL HOVER ───
function NavLinkItem({
  item,
  isActive,
  onClick,
}: {
  item: { label: string; href: string; sectionId?: string };
  isActive: boolean;
  onClick?: (e: React.MouseEvent) => void;
}) {
  const primaryTextRef = useRef<HTMLSpanElement>(null);
  const cloneTextRef = useRef<HTMLSpanElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const primary = primaryTextRef.current;
      const clone = cloneTextRef.current;
      if (!primary || !clone) return;

      gsap.set(primary, { yPercent: 0 });
      gsap.set(clone, { yPercent: -100 });

      tlRef.current = gsap
        .timeline({ paused: true })
        .to(primary, { yPercent: 100, duration: 0.18, ease: "power2.out" }, 0)
        .to(clone, { yPercent: 0, duration: 0.18, ease: "power2.out" }, 0);
    },
    { scope: linkRef }
  );

  return (
    <Link
      ref={linkRef}
      href={item.href}
      onClick={onClick}
      onMouseEnter={() => tlRef.current?.play()}
      onMouseLeave={() => tlRef.current?.reverse()}
      className={`relative shrink-0 px-2.5 xl:px-3 py-1.5 rounded-[8px] text-[13px] xl:text-[13.5px] tracking-[-0.01em] transition-colors cursor-pointer overflow-hidden whitespace-nowrap select-none ${
        isActive
          ? "bg-[#0066FF]/10 dark:bg-[#0066FF]/18 text-[#0066FF] dark:text-[#5294FF] font-semibold"
          : "text-[#344054] dark:text-zinc-300 hover:text-[#101828] dark:hover:text-white font-medium"
      }`}
    >
      <span className="relative block overflow-hidden leading-tight">
        <span
          ref={primaryTextRef}
          className="block select-none pointer-events-none will-change-transform"
        >
          {item.label}
        </span>
        <span
          ref={cloneTextRef}
          aria-hidden="true"
          className={`absolute inset-0 block select-none pointer-events-none font-semibold will-change-transform ${
            isActive
              ? "text-[#0066FF] dark:text-[#5294FF]"
              : "text-[#0066FF] dark:text-white"
          }`}
        >
          {item.label}
        </span>
      </span>
    </Link>
  );
}

// ─── DOCS & API MEGA-MENU (100% ENGLISH, ARCHITECTURAL SCHEMA CARD) ───
function DocsApiDropdown({
  isActive,
  onOpenChange,
}: {
  isActive: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const primaryTextRef = useRef<HTMLSpanElement>(null);
  const cloneTextRef = useRef<HTMLSpanElement>(null);
  const linkRef = useRef<HTMLAnchorElement>(null);
  const tlRef = useRef<gsap.core.Timeline | null>(null);

  useGSAP(
    () => {
      const primary = primaryTextRef.current;
      const clone = cloneTextRef.current;
      if (!primary || !clone) return;

      gsap.set(primary, { yPercent: 0 });
      gsap.set(clone, { yPercent: -100 });

      tlRef.current = gsap
        .timeline({ paused: true })
        .to(primary, { yPercent: 100, duration: 0.18, ease: "power2.out" }, 0)
        .to(clone, { yPercent: 0, duration: 0.18, ease: "power2.out" }, 0);
    },
    { scope: linkRef }
  );

  const setOpenState = useCallback(
    (next: boolean) => {
      setIsOpen(next);
      onOpenChange?.(next);
    },
    [onOpenChange]
  );

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    tlRef.current?.play();
    setOpenState(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      tlRef.current?.reverse();
      setOpenState(false);
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      onOpenChange?.(false);
    };
  }, [onOpenChange]);

  const items = [
    {
      title: "REST API & SDK Quickstart",
      desc: "Endpoints, SHA-256 Bearer keys, and TypeScript / Python examples",
      href: "/docs/sdk-quickstart",
      icon: Terminal,
    },
    {
      title: "Smart Geo & Device Routing",
      desc: "ISO country, OS, browser rules, and weighted A/B traffic splits",
      href: "/docs/geo-routing",
      icon: Globe,
    },
    {
      title: "PathLock™ & Password Security",
      desc: "URL perimeter locking, click caps, and white-label masking",
      href: "/docs/pin-protection",
      icon: Lock,
    },
    {
      title: "Real-Time Telemetry & Webhooks",
      desc: "Live click streams, revenue attribution, and signed events",
      href: "/docs/realtime-analytics",
      icon: BarChart3,
    },
  ];

  return (
    <div
      className="relative inline-block shrink-0"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        ref={linkRef}
        href="/docs"
        className={`relative shrink-0 px-2.5 xl:px-3 py-1.5 rounded-[8px] text-[13px] xl:text-[13.5px] tracking-[-0.01em] transition-colors cursor-pointer select-none inline-flex items-center gap-1.5 overflow-hidden whitespace-nowrap ${
          isActive || isOpen
            ? "bg-[#0066FF]/10 dark:bg-[#0066FF]/18 text-[#0066FF] dark:text-[#5294FF] font-semibold"
            : "text-[#344054] dark:text-zinc-300 hover:text-[#101828] dark:hover:text-white font-medium"
        }`}
      >
        <span className="relative block overflow-hidden leading-tight">
          <span
            ref={primaryTextRef}
            className="block select-none pointer-events-none will-change-transform"
          >
            Docs &amp; API
          </span>
          <span
            ref={cloneTextRef}
            aria-hidden="true"
            className="absolute inset-0 block select-none pointer-events-none font-semibold will-change-transform text-[#0066FF] dark:text-white"
          >
            Docs &amp; API
          </span>
        </span>
        <svg
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          className={`w-3.5 h-3.5 transition-transform duration-300 shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="2"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </Link>

      {/* Mega Menu strictly rounded-[10px], cleanly anchored */}
      <div
        className={`absolute top-full mt-2.5 right-[-180px] xl:right-[-240px] w-[min(780px,calc(100vw-48px))] z-50 transform-gpu transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3.5 ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto visible"
            : "opacity-0 -translate-y-2 scale-[0.98] pointer-events-none invisible"
        }`}
      >
        <div className="rounded-[10px] p-5 shadow-[0_20px_56px_rgba(16,24,40,0.12)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.78)] border backdrop-blur-xl bg-white dark:bg-[#0D0E12] border-[#E4E7EC] dark:border-white/12">
          <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1fr] gap-5 items-stretch">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setOpenState(false)}
                    className="flex items-start gap-3 p-3.5 rounded-[8px] bg-[#F7F8FA] dark:bg-[#14151B] hover:bg-[#0066FF]/[0.06] dark:hover:bg-[#0066FF]/[0.14] border border-[#E4E7EC] dark:border-white/[0.07] hover:border-[#0066FF]/40 transition-all duration-150 group"
                  >
                    <span className="mt-0.5 shrink-0 text-[#475467] dark:text-zinc-400 group-hover:text-[#0066FF] dark:group-hover:text-[#5294FF] transition-colors">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#101828] dark:text-white group-hover:text-[#0066FF] dark:group-hover:text-[#5294FF] transition-colors">
                        {item.title}
                      </div>
                      <div className="text-[11.5px] text-[#667085] dark:text-zinc-400 mt-1 leading-snug">
                        {item.desc}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between text-[10.5px] font-mono uppercase tracking-[0.14em] text-[#667085] dark:text-zinc-500">
                <span>API Reference</span>
                <span className="text-[#0066FF] dark:text-[#5294FF]">v1 · REST</span>
              </div>

              {/* Bespoke Dark Architectural API Schema Card (replaces legacy cartoon image) */}
              <Link
                href="/docs"
                onClick={() => setOpenState(false)}
                className="group relative flex-1 rounded-[8px] p-4 flex flex-col justify-between bg-[#09090B] text-white border border-white/12 hover:border-[#0066FF]/60 transition-colors overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-white/[0.08]">
                  <span className="inline-flex items-center gap-1.5 font-mono text-[11px] font-semibold text-white">
                    <span className="px-1.5 py-0.5 rounded-[4px] bg-[#0066FF] text-white text-[10px]">
                      POST
                    </span>
                    <span className="text-zinc-300">/api/v1/links</span>
                  </span>
                  <span className="font-mono text-[10.5px] text-emerald-400">
                    201 · 11.4ms
                  </span>
                </div>

                <div className="my-3 font-mono text-[11px] leading-[1.6] text-zinc-400">
                  <div>
                    <span className="text-[#5294FF]">&quot;slug&quot;</span>:{" "}
                    <span className="text-emerald-400">&quot;beta-demo&quot;</span>,
                  </div>
                  <div>
                    <span className="text-[#5294FF]">&quot;pathLockPrefix&quot;</span>:{" "}
                    <span className="text-amber-300">&quot;/app/dashboard/*&quot;</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-white/[0.08]">
                  <div>
                    <div className="text-[13.5px] font-bold text-white tracking-tight">
                      Full Documentation Hub
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Guides, OpenAPI schema &amp; webhooks
                    </div>
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-zinc-400 group-hover:text-[#5294FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </div>
              </Link>

              <Link
                href="/#demo-video"
                onClick={() => setOpenState(false)}
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-[8px] bg-[#0066FF]/[0.08] hover:bg-[#0066FF]/[0.14] border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] text-[12.5px] font-semibold transition-colors"
              >
                <Play className="w-3.5 h-3.5 fill-current shrink-0" />
                <span>Watch 6-min Product Walkthrough</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN LANDING NAVBAR ───
export const LandingNavbar = React.memo(function LandingNavbar() {
  const { isOpen, toggle } = useMobileMenu();
  const { toggleTheme } = useTheme();
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const isAuthenticated =
    status === "authenticated" &&
    Boolean(session?.user) &&
    !(session?.user as { userNotFound?: boolean } | undefined)?.userNotFound;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [viewportWidth, setViewportWidth] = useState<number | null>(null);
  const [activeSection, setActiveSection] = useState<string>("");
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);
  const isDocsMenuOpenRef = useRef(false);
  const isMobileOpenRef = useRef(isOpen);
  const shellRef = useRef<HTMLDivElement>(null);
  const progressBarDesktopRef = useRef<HTMLDivElement>(null);
  const progressBarMobileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    isMobileOpenRef.current = isOpen;
    if (isOpen) {
      setIsHidden(false);
    }
  }, [isOpen]);

  const handleDocsOpenChange = useCallback((open: boolean) => {
    isDocsMenuOpenRef.current = open;
    if (open) {
      setIsHidden(false);
    }
  }, []);

  // Track exact inner layout width (excluding scrollbar) so docked -> floating maxWidth interpolates smoothly px-to-px
  useEffect(() => {
    const syncViewportWidth = () => {
      setViewportWidth(document.documentElement.clientWidth);
    };
    syncViewportWidth();
    window.addEventListener("resize", syncViewportWidth, { passive: true });
    return () => window.removeEventListener("resize", syncViewportWidth);
  }, []);

  useEffect(() => {
    const checkFullscreenState = () => {
      const isFs =
        document.documentElement.getAttribute("data-iframe-fullscreen") === "true" ||
        document.body.getAttribute("data-iframe-fullscreen") === "true";
      setIsIframeFullscreen(isFs);
    };

    const handleFullscreenChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isFullscreen: boolean }>;
      setIsIframeFullscreen(Boolean(customEvent.detail?.isFullscreen));
    };

    checkFullscreenState();
    window.addEventListener("product-fullscreen-change", handleFullscreenChange);
    window.addEventListener("resize", checkFullscreenState);
    return () => {
      window.removeEventListener("product-fullscreen-change", handleFullscreenChange);
      window.removeEventListener("resize", checkFullscreenState);
    };
  }, []);

  // Smart Headroom Scroll state (docked <-> floating morph + hide on scroll down / reveal on slight scroll up) + 2px GPU reading progress bar
  useEffect(() => {
    const FLOAT_ENTER_Y = 24;
    const FLOAT_EXIT_Y = 12;
    const HIDE_AFTER_Y = 140;
    const DOWN_THRESHOLD_PX = 10;
    const UP_THRESHOLD_PX = 6;

    let lastY = Math.max(0, window.scrollY);
    let isScrolledLocal = lastY > FLOAT_ENTER_Y;
    let isHiddenLocal = false;
    let downAccum = 0;
    let upAccum = 0;

    setIsScrolled(isScrolledLocal);
    setIsHidden(false);
    let ticking = false;

    const updateProgress = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct =
        docHeight > 0
          ? Math.min(1, Math.max(0, window.scrollY / docHeight))
          : 0;
      const transformVal = `scaleX(${pct})`;
      if (progressBarDesktopRef.current) {
        progressBarDesktopRef.current.style.transform = transformVal;
      }
      if (progressBarMobileRef.current) {
        progressBarMobileRef.current.style.transform = transformVal;
      }
    };

    updateProgress();

    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(() => {
          const y = Math.max(0, window.scrollY);
          const delta = y - lastY;
          lastY = y;

          // 1. Smooth docked <-> floating morph with hysteresis
          if (!isScrolledLocal && y > FLOAT_ENTER_Y) {
            isScrolledLocal = true;
            setIsScrolled(true);
          } else if (isScrolledLocal && y <= FLOAT_EXIT_Y) {
            isScrolledLocal = false;
            setIsScrolled(false);
          }

          // 2. Smart headroom: hide floating bar on downward scroll, reveal on tiny upward scroll
          const activeEl = document.activeElement as HTMLElement | null;
          const hasKeyboardFocus = Boolean(
            activeEl &&
              shellRef.current?.contains(activeEl) &&
              activeEl.matches?.(":focus-visible")
          );
          const keepVisible =
            y <= HIDE_AFTER_Y ||
            isDocsMenuOpenRef.current ||
            isMobileOpenRef.current ||
            hasKeyboardFocus;

          if (keepVisible) {
            downAccum = 0;
            upAccum = 0;
            if (isHiddenLocal) {
              isHiddenLocal = false;
              setIsHidden(false);
            }
          } else if (delta > 0.5) {
            upAccum = 0;
            downAccum += delta;
            if (!isHiddenLocal && downAccum >= DOWN_THRESHOLD_PX) {
              isHiddenLocal = true;
              setIsHidden(true);
              downAccum = 0;
            }
          } else if (delta < -0.5) {
            downAccum = 0;
            upAccum += -delta;
            if (isHiddenLocal && upAccum >= UP_THRESHOLD_PX) {
              isHiddenLocal = false;
              setIsHidden(false);
              upAccum = 0;
            }
          }

          if (y < 260) {
            setActiveSection("");
          }
          updateProgress();
          ticking = false;
        });
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", updateProgress);
    };
  }, [pathname]);

  // Scroll-spy for home landing sections (includes pricing-preview & faq clearance)
  useEffect(() => {
    if (pathname !== "/") {
      setActiveSection("");
      return;
    }
    const sectionIds = [
      "demo-video",
      "features",
      "pathlock",
      "difference",
      "api",
      "pricing-preview",
      "faq",
    ];
    const elements = sectionIds
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => Boolean(el));
    const footerEl = document.querySelector("footer");
    if (footerEl) elements.push(footerEl);

    if (!elements.length || typeof IntersectionObserver === "undefined") return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target) {
          const target = visible[0].target as HTMLElement;
          const id = target.id;
          setActiveSection(
            !id || id === "faq" || target.tagName === "FOOTER" ? "" : id
          );
        }
      },
      { rootMargin: "-22% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] }
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [pathname]);

  const handleToggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.fromTo(
      e.currentTarget,
      { scale: 0.78, rotate: -30 },
      { scale: 1, rotate: 0, duration: 0.35, ease: "back.out(2)" }
    );
    toggleTheme();
  };

  const handleFocusShortener = useCallback(
    (e: React.MouseEvent) => {
      if (isAuthenticated) return;
      if (pathname === "/") {
        scrollToHeroShortener(e);
      } else {
        e.preventDefault();
        router.push("/#hero-shortener");
      }
    },
    [isAuthenticated, pathname, router]
  );

  if (isIframeFullscreen) return null;

  const navLinks = [
    { label: "Features", href: "/#features", sectionId: "features" },
    { label: "PathLock", href: "/#pathlock", sectionId: "pathlock" },
    { label: "Difference", href: "/#difference", sectionId: "difference" },
    { label: "Demo Video", href: "/#demo-video", sectionId: "demo-video" },
    { label: "Pricing", href: "/pricing", sectionId: "pricing-preview" },
    { label: "Docs & API", href: "/docs" },
  ];

  const desktopMaxWidth =
    viewportWidth !== null
      ? `${isScrolled ? Math.min(1200, Math.max(960, viewportWidth - 48)) : viewportWidth}px`
      : isScrolled
        ? "min(1200px, calc(100% - 3rem))"
        : "100%";

  const mobileMaxWidth =
    viewportWidth !== null
      ? `${isScrolled ? Math.min(672, Math.max(300, viewportWidth - 24)) : viewportWidth}px`
      : isScrolled
        ? "min(672px, calc(100% - 1.5rem))"
        : "100%";

  return (
    <div
      ref={shellRef}
      data-hidden={isHidden ? "true" : "false"}
      data-floating={isScrolled ? "true" : "false"}
      onFocusCapture={(e) => {
        if ((e.target as HTMLElement)?.matches?.(":focus-visible")) {
          setIsHidden(false);
        }
      }}
      style={{
        transform: isHidden
          ? "translate3d(0, calc(-100% - 24px), 0)"
          : "translate3d(0, 0, 0)",
        opacity: isHidden ? 0 : 1,
      }}
      className="navbar-headroom-shell w-full flex justify-center pointer-events-none"
    >
      {/* ─── 1. DESKTOP NAVBAR (>= 1024px / lg) ─── */}
      <header
        style={{
          maxWidth: desktopMaxWidth,
          transform: isScrolled ? "translate3d(0, 12px, 0)" : "translate3d(0, 0px, 0)",
        }}
        className={`navbar-morph-surface relative hidden lg:flex w-full items-center justify-between gap-2 xl:gap-3 border overflow-visible ${
          isHidden ? "pointer-events-none" : "pointer-events-auto"
        } ${
          isScrolled
            ? "h-[56px] rounded-[10px] px-4 xl:px-5 bg-white/[0.97] dark:bg-[#0B0C0F]/[0.97] border-[#E4E7EC] dark:border-white/12 shadow-[0_10px_28px_-4px_rgba(16,24,40,0.08)] dark:shadow-[0_14px_36px_-4px_rgba(0,0,0,0.55)]"
            : "h-[64px] rounded-none px-6 xl:px-10 bg-white/[0.98] dark:bg-[#09090B]/[0.98] border-transparent border-b-[#E4E7EC] dark:border-b-white/[0.08] shadow-[0_0_0_0_rgba(16,24,40,0)] dark:shadow-[0_0_0_0_rgba(0,0,0,0)]"
        }`}
      >
        {/* Reading Progress Bar (2px #0066FF along bottom edge) */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden transition-[border-radius] duration-[440ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isScrolled ? "rounded-b-[10px]" : "rounded-b-none"
          }`}
        >
          <div
            ref={progressBarDesktopRef}
            style={{ transform: "scaleX(0)" }}
            className="h-full w-full origin-left bg-[#0066FF] will-change-transform"
          />
        </div>

        {/* Left: LShorter Brand */}
        <Link
          href="/"
          className="flex items-center gap-2.5 select-none cursor-pointer group shrink-0"
        >
          <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-[8px] overflow-hidden shrink-0 shadow-xs group-hover:scale-105 transition-transform duration-200">
            <Image
              src="/logo.svg"
              alt="LShorter Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              priority
              loading="eager"
            />
          </div>
          <span className="text-[16px] xl:text-[17px] font-bold tracking-[-0.03em] text-[#101828] dark:text-white">
            LShorter
          </span>
        </Link>

        {/* Center: Clean 100% English Navigation Links (never sliced) */}
        <nav
          aria-label="Primary navigation"
          className="flex items-center gap-0.5 xl:gap-1 shrink-0"
        >
          {navLinks.map((item) => {
            if (item.label === "Docs & API") {
              return (
                <DocsApiDropdown
                  key={item.label}
                  isActive={pathname.startsWith("/docs") || activeSection === "api"}
                  onOpenChange={handleDocsOpenChange}
                />
              );
            }
            const isItemActive =
              item.sectionId === "pricing-preview"
                ? pathname.startsWith("/pricing") ||
                  (pathname === "/" && activeSection === "pricing-preview")
                : item.sectionId
                  ? pathname === "/" && activeSection === item.sectionId
                  : pathname.startsWith(item.href);
            return (
              <NavLinkItem
                key={item.label}
                item={item}
                isActive={isItemActive}
              />
            );
          })}
        </nav>

        {/* Right: Theme Toggle + Subtle Sign In + Wave Action CTA */}
        <div className="flex items-center gap-1.5 xl:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleTheme}
            className="w-9 h-9 rounded-[10px] flex items-center justify-center border transition-colors cursor-pointer shrink-0 border-[#E4E7EC] dark:border-white/12 bg-white dark:bg-white/[0.04] text-[#344054] dark:text-zinc-300 hover:border-[#0066FF]/50 hover:text-[#0066FF] dark:hover:text-white"
            title="Toggle color theme"
            aria-label="Toggle color theme"
          >
            <Moon className="w-4 h-4 dark:hidden" />
            <Sun className="w-4 h-4 hidden dark:block text-amber-300" />
          </button>

          {!isAuthenticated && (
            <Link
              href="/login"
              className="inline-flex items-center px-2.5 xl:px-3 h-9 rounded-[10px] text-[13px] xl:text-[13.5px] font-medium text-[#475467] dark:text-zinc-300 hover:text-[#101828] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors whitespace-nowrap shrink-0"
            >
              Sign in
            </Link>
          )}

          <WaveRevealButton
            href={isAuthenticated ? "/dashboard" : "/#hero-shortener"}
            onClick={isAuthenticated ? undefined : handleFocusShortener}
            variant="primary"
            size="sm"
            wave
            className="shrink-0"
            icon={
              isAuthenticated ? (
                <LayoutDashboard className="w-3.5 h-3.5" />
              ) : (
                <Link2 className="w-3.5 h-3.5" />
              )
            }
          >
            {isAuthenticated ? "Dashboard" : "Shorten a link"}
          </WaveRevealButton>
        </div>
      </header>

      {/* ─── 2. MOBILE & TABLET NAVBAR (< 1024px / lg:hidden) ─── */}
      <header
        style={{
          maxWidth: mobileMaxWidth,
          transform: isScrolled ? "translate3d(0, 10px, 0)" : "translate3d(0, 0px, 0)",
        }}
        className={`navbar-morph-surface relative flex lg:hidden w-full items-center justify-between border overflow-hidden ${
          isHidden ? "pointer-events-none" : "pointer-events-auto"
        } ${
          isScrolled
            ? "h-[52px] rounded-[10px] px-4 bg-white/[0.97] dark:bg-[#0C0C0F]/[0.97] border-[#E4E7EC] dark:border-white/12 shadow-[0_10px_28px_-4px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.58)]"
            : "h-[56px] rounded-none px-4 sm:px-6 bg-white/[0.98] dark:bg-[#09090B]/[0.98] border-transparent border-b-[#E4E7EC] dark:border-b-white/10 shadow-[0_0_0_0_rgba(0,0,0,0)]"
        }`}
      >
        {/* Mobile Reading Progress Bar */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden"
        >
          <div
            ref={progressBarMobileRef}
            style={{ transform: "scaleX(0)" }}
            className="h-full w-full origin-left bg-[#0066FF] will-change-transform"
          />
        </div>

        <Link href="/" className="flex items-center gap-2 select-none shrink-0">
          <div className="w-7 h-7 rounded-[8px] overflow-hidden shrink-0 shadow-2xs">
            <Image
              src="/logo.svg"
              alt="LShorter Logo"
              width={28}
              height={28}
              className="w-full h-full object-contain"
              loading="eager"
            />
          </div>
          <span className="text-[16px] font-bold tracking-[-0.025em] text-[#101828] dark:text-white">
            LShorter
          </span>
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleTheme}
            className="w-8 h-8 rounded-[10px] flex items-center justify-center border transition-colors bg-black/[0.03] dark:bg-white/[0.06] border-black/[0.08] dark:border-white/10 text-[#52525B] dark:text-zinc-300"
            aria-label="Toggle color theme"
          >
            <Moon className="w-4 h-4 dark:hidden" />
            <Sun className="w-4 h-4 hidden dark:block text-amber-300" />
          </button>

          <button
            type="button"
            onClick={() => toggle()}
            className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
              isOpen
                ? "bg-[#0066FF] text-white"
                : "bg-black/[0.03] dark:bg-white/[0.06] text-[#101828] dark:text-white border border-black/[0.08] dark:border-white/10"
            }`}
            aria-label="Toggle navigation menu"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>
    </div>
  );
});

export default LandingNavbar;
