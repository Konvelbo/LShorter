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
function DocsApiDropdown({ isActive }: { isActive: boolean }) {
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

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    tlRef.current?.play();
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      tlRef.current?.reverse();
      setIsOpen(false);
    }, 180);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

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
      title: "PathLock™ & PIN Security",
      desc: "URL perimeter locking, click caps, and white-label masking",
      href: "/docs/pin-protection",
      icon: Lock,
    },
    {
      title: "Real-Time Telemetry & Webhooks",
      desc: "Live click streams, Stripe attribution, and signed events",
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
                    onClick={() => setIsOpen(false)}
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
                onClick={() => setIsOpen(false)}
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
                onClick={() => setIsOpen(false)}
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
  const [activeSection, setActiveSection] = useState<string>("");
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);
  const progressBarDesktopRef = useRef<HTMLDivElement>(null);
  const progressBarMobileRef = useRef<HTMLDivElement>(null);

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

  // Scroll state + 2px GPU-accelerated reading progress bar
  useEffect(() => {
    let isScrolledLocal = window.scrollY > 30;
    setIsScrolled(isScrolledLocal);
    let ticking = false;

    const updateProgress = () => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? Math.min(1, Math.max(0, window.scrollY / docHeight)) : 0;
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
          const y = window.scrollY;
          if (!isScrolledLocal && y > 35) {
            isScrolledLocal = true;
            setIsScrolled(true);
          } else if (isScrolledLocal && y < 15) {
            isScrolledLocal = false;
            setIsScrolled(false);
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
        e.preventDefault();
        const el = document.getElementById("hero-shortener");
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        } else {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        window.dispatchEvent(new CustomEvent("lshorter_focus_shortener"));
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

  return (
    <div className="w-full flex justify-center pointer-events-none transition-opacity duration-300">
      {/* ─── 1. DESKTOP NAVBAR (>= 1024px / lg) ─── */}
      <header
        className={`relative hidden lg:flex items-center justify-between gap-2 xl:gap-3 pointer-events-auto transform-gpu transition-[transform,width,background-color,border-color,box-shadow,border-radius] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-visible ${
          isScrolled
            ? "translate-y-3 w-[min(1200px,96vw)] rounded-[10px] px-4 xl:px-5 py-2.5 bg-white/[0.94] dark:bg-[#0B0C0F]/[0.92] backdrop-blur-xl border border-[#E4E7EC] dark:border-white/12 shadow-[0_10px_28px_rgba(16,24,40,0.07)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.55)]"
            : "translate-y-0 w-full rounded-none px-5 xl:px-[max(2rem,calc((100vw-1200px)/2+2rem))] py-3.5 bg-white/[0.96] dark:bg-[#09090B]/[0.96] backdrop-blur-md border-b border-[#E4E7EC] dark:border-white/[0.08]"
        }`}
      >
        {/* Reading Progress Bar (2px #0066FF along bottom edge) */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute bottom-0 left-0 right-0 h-[2px] overflow-hidden ${
            isScrolled ? "rounded-b-[10px]" : ""
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
        className={`relative flex lg:hidden items-center justify-between pointer-events-auto transform-gpu transition-[transform,width,background-color,border-color,box-shadow,border-radius] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] overflow-hidden ${
          isScrolled
            ? "translate-y-2.5 w-[calc(100%-1.5rem)] max-w-2xl rounded-[10px] px-4 py-2.5 bg-white/[0.94] dark:bg-[#0C0C0F]/[0.94] backdrop-blur-xl border border-[#E4E7EC] dark:border-white/12 shadow-[0_10px_28px_rgba(0,0,0,0.08)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.58)]"
            : "translate-y-0 w-full rounded-none px-4 sm:px-6 py-3 bg-white/[0.98] dark:bg-[#09090B]/[0.98] border-b border-[#E4E7EC] dark:border-white/10"
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
