"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ChevronDown,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { FaXTwitter, FaLinkedin, FaYoutube } from "react-icons/fa6";
import { useTheme } from "@/components/providers/theme-provider";
import { lerp, useLenis } from "@/components/providers/smooth-scroll-provider";
import { scrollToHeroShortener } from "@/components/marketing/swiss-frame";

export type MegaColumn = {
  eyebrow: string;
  links: { label: string; href: string; active?: boolean; badge?: string }[];
};

export type MegaMenu = {
  columns: MegaColumn[];
  footerLinks?: { label: string; href: string }[];
  showSocials?: boolean;
  image: { src: string; alt: string; href: string };
  imageCaption?: string;
};

const DOCS_API_MENU: MegaMenu = {
  columns: [
    {
      eyebrow: "Documentation",
      links: [
        { label: "Documentation Hub", href: "/docs", active: true },
        { label: "REST API Quickstart", href: "/docs/sdk-quickstart", badge: "v1" },
        { label: "PathLock™ Guide", href: "/docs/path-lock" },
        { label: "Webhooks & Events", href: "/docs/webhooks-and-events" },
      ],
    },
    {
      eyebrow: "Capabilities & Guides",
      links: [
        { label: "Smart Geo & OS Routing", href: "/docs/geo-routing" },
        { label: "Click Caps & Expiry", href: "/docs/click-limits-and-expiration" },
        { label: "Dynamic QR Studio", href: "/docs/dynamic-qr-codes" },
        { label: "Real-Time Analytics", href: "/docs/realtime-analytics" },
      ],
    },
  ],
  footerLinks: [
    { label: "Interactive API Terminal", href: "/#api" },
    { label: "Revenue Attribution", href: "/docs/conversion-tracking-amount-count" },
  ],
  showSocials: true,
  image: {
    src: "/doc/apiimage.webp",
    alt: "LShorter REST API & developer documentation",
    href: "/docs",
  },
  imageCaption: "REST API v1, PathLock™ & live edge telemetry across 310+ PoPs",
};

/**
 * Navigation items ordered strictly to match the top-to-bottom landing page flow:
 * Demo Video -> Features -> PathLock -> Difference -> Docs & API (#api) -> Pricing (#pricing-preview)
 */
const NAV_ITEMS = [
  { label: "Demo Video", hasMenu: false, href: "/#demo-video" },
  { label: "Features", hasMenu: false, href: "/#features" },
  { label: "PathLock", hasMenu: false, href: "/#pathlock" },
  { label: "Difference", hasMenu: false, href: "/#difference" },
  { label: "Docs & API", hasMenu: true },
  { label: "Pricing", hasMenu: false, href: "/pricing" },
] as const;

const SOCIALS = [
  { href: "https://x.com", label: "X", icon: FaXTwitter },
  { href: "https://linkedin.com", label: "LinkedIn", icon: FaLinkedin },
  { href: "https://youtube.com", label: "YouTube", icon: FaYoutube },
];

export function Navbar2() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const { lenis } = useLenis();
  const { data: session, status } = useSession();

  const sessionUser = session?.user as
    | { userNotFound?: boolean; hasCompletedOnboarding?: boolean }
    | undefined;
  const isAuthenticated =
    status === "authenticated" &&
    Boolean(sessionUser) &&
    !sessionUser?.userNotFound;
  const dashboardHref =
    sessionUser?.hasCompletedOnboarding === false ? "/onboarding" : "/dashboard";

  const [docsOpen, setDocsOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileDocsOpen, setMobileDocsOpen] = useState(false);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const innerWrapRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const docsOpenRef = useRef(false);
  const mobileOpenRef = useRef(false);
  const isHoveringRef = useRef(false);
  const forceShowRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    docsOpenRef.current = docsOpen;
    if (docsOpen) forceShowRef.current?.();
  }, [docsOpen]);

  useEffect(() => {
    mobileOpenRef.current = mobileOpen;
    if (mobileOpen) {
      forceShowRef.current?.();
      lenis?.stop();
    } else {
      lenis?.start();
    }
    return () => {
      lenis?.start();
    };
  }, [mobileOpen, lenis]);

  // Close menus on route change
  useEffect(() => {
    setDocsOpen(false);
    setMobileOpen(false);
    setMobileDocsOpen(false);
  }, [pathname]);

  // Close open mega-menu / mobile panel on outside click or Escape
  useEffect(() => {
    if (!docsOpen && !mobileOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setDocsOpen(false);
        setMobileOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDocsOpen(false);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [docsOpen, mobileOpen]);

  // Sync iframe/video fullscreen mode
  useEffect(() => {
    const checkFullscreen = () => {
      const isFs =
        document.documentElement.getAttribute("data-iframe-fullscreen") ===
          "true" ||
        document.body.getAttribute("data-iframe-fullscreen") === "true";
      setIsIframeFullscreen(isFs);
    };
    const handleFsEvent = (e: Event) => {
      const customEvent = e as CustomEvent<{ isFullscreen: boolean }>;
      setIsIframeFullscreen(Boolean(customEvent.detail?.isFullscreen));
    };

    checkFullscreen();
    window.addEventListener("product-fullscreen-change", handleFsEvent);
    window.addEventListener("resize", checkFullscreen);
    return () => {
      window.removeEventListener("product-fullscreen-change", handleFsEvent);
      window.removeEventListener("resize", checkFullscreen);
    };
  }, []);

  // Ultra-smooth zero-rerender Lenis + lerp rAF headroom glide
  useEffect(() => {
    const HIDE_AFTER_Y = 140;
    const DOWN_THRESHOLD_PX = 18;
    const UP_THRESHOLD_PX = 6;
    const NAV_LERP = 0.12;

    let lastY = Math.max(0, window.scrollY);
    let targetHidden = 0;
    let currentHidden = 0;
    let downAccum = 0;
    let upAccum = 0;
    let frameId: number | null = null;
    let isPointerBlocked = false;

    const applyTransform = (progress: number) => {
      const header = headerRef.current;
      if (!header) return;
      const clamped = Math.max(0, Math.min(1, progress));
      const translateY = -clamped * 108;
      const opacity = 1 - clamped;
      header.style.transform = `translate3d(0, ${translateY.toFixed(2)}px, 0)`;
      header.style.opacity = opacity.toFixed(3);

      const shouldBlock = opacity < 0.08;
      if (shouldBlock !== isPointerBlocked && innerWrapRef.current) {
        isPointerBlocked = shouldBlock;
        innerWrapRef.current.style.pointerEvents = shouldBlock ? "none" : "auto";
      }
    };

    const updateProgress = (scrollY: number) => {
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const pct =
        docHeight > 0 ? Math.min(1, Math.max(0, scrollY / docHeight)) : 0;
      if (progressBarRef.current) {
        progressBarRef.current.style.transform = `scaleX(${pct})`;
      }
    };

    const onScrollPosition = (rawY: number) => {
      const y = Math.max(0, rawY);
      const delta = y - lastY;
      lastY = y;

      const keepVisible =
        y <= HIDE_AFTER_Y ||
        docsOpenRef.current ||
        mobileOpenRef.current ||
        isHoveringRef.current;

      if (keepVisible) {
        downAccum = 0;
        upAccum = 0;
        targetHidden = 0;
      } else if (delta > 0.25) {
        upAccum = 0;
        downAccum += delta;
        if (downAccum >= DOWN_THRESHOLD_PX) {
          targetHidden = 1;
          downAccum = 0;
        }
      } else if (delta < -0.25) {
        downAccum = 0;
        upAccum += -delta;
        if (upAccum >= UP_THRESHOLD_PX) {
          targetHidden = 0;
          upAccum = 0;
        }
      }

      updateProgress(y);
    };

    forceShowRef.current = () => {
      targetHidden = 0;
      downAccum = 0;
      upAccum = 0;
    };

    applyTransform(0);
    updateProgress(lastY);

    const animate = () => {
      const diff = Math.abs(currentHidden - targetHidden);
      if (diff > 0.001) {
        currentHidden = lerp(currentHidden, targetHidden, NAV_LERP);
        if (Math.abs(currentHidden - targetHidden) <= 0.001) {
          currentHidden = targetHidden;
        }
        applyTransform(currentHidden);
      }
      frameId = requestAnimationFrame(animate);
    };
    frameId = requestAnimationFrame(animate);

    const handleLenisScroll = ({ scroll }: { scroll: number }) => {
      onScrollPosition(scroll);
    };
    const handleNativeScroll = () => {
      onScrollPosition(window.scrollY);
    };
    const handleResize = () => {
      updateProgress(window.scrollY);
    };

    if (lenis) {
      lenis.on("scroll", handleLenisScroll);
    } else {
      window.addEventListener("scroll", handleNativeScroll, { passive: true });
    }
    window.addEventListener("resize", handleResize, { passive: true });

    return () => {
      forceShowRef.current = null;
      if (frameId !== null) cancelAnimationFrame(frameId);
      if (lenis) {
        lenis.off("scroll", handleLenisScroll);
      } else {
        window.removeEventListener("scroll", handleNativeScroll);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, [lenis, pathname]);

  const closeAll = useCallback(() => {
    setDocsOpen(false);
    setMobileOpen(false);
    setMobileDocsOpen(false);
  }, []);

  const handleGetStartedClick = useCallback(
    (e: React.MouseEvent) => {
      closeAll();
      if (isAuthenticated) return;
      if (pathname === "/") {
        scrollToHeroShortener(e);
      } else {
        e.preventDefault();
        router.push("/#hero-shortener");
      }
    },
    [closeAll, isAuthenticated, pathname, router],
  );

  if (isIframeFullscreen) return null;

  const isAnyPanelOpen = docsOpen || mobileOpen;

  return (
    <header
      ref={headerRef}
      style={{
        transform: "translate3d(0, 0px, 0)",
        opacity: 1,
      }}
      onMouseEnter={() => {
        isHoveringRef.current = true;
        forceShowRef.current?.();
      }}
      onMouseLeave={() => {
        isHoveringRef.current = false;
      }}
      className="pointer-events-none relative flex justify-center px-3 sm:px-5 pt-3 sm:pt-4 will-change-[transform,opacity]"
    >
      <div
        ref={innerWrapRef}
        className="pointer-events-auto relative w-full max-w-7xl"
      >
        {/* Fixed-height Top Bar (never reflows or re-blurs when dropdown opens/closes) */}
        <div
          className={`relative z-20 overflow-hidden border border-zinc-200/80 dark:border-white/[0.11] bg-white/[0.97] dark:bg-[#0D0E12]/[0.97] backdrop-blur-md transition-[border-radius,border-color] duration-200 ${
            isAnyPanelOpen
              ? "rounded-t-[10px] rounded-b-none border-b-zinc-200/70 dark:border-b-white/[0.08] shadow-none"
              : "rounded-[10px] shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.10)] dark:shadow-[0_14px_38px_-8px_rgba(0,0,0,0.68)]"
          }`}
        >
          {/* Subtle 2px GPU-composited reading progress indicator */}
          <div
            ref={progressBarRef}
            aria-hidden="true"
            style={{ transform: "scaleX(0)", transformOrigin: "left" }}
            className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-[#0066FF] dark:bg-[#5294FF] opacity-80"
          />

          {/* Top row */}
          <div className="flex items-center justify-between gap-4 px-5 py-3 sm:px-7 sm:py-3.5">
            {/* Logo */}
            <Link
              href="/"
              onClick={closeAll}
              className="flex shrink-0 items-center gap-2.5 select-none"
            >
              <div className="w-7 h-7 rounded-[7px] overflow-hidden shrink-0">
                <Image
                  src="/logo.svg"
                  alt="LShorter Logo"
                  width={28}
                  height={28}
                  priority
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[1.2rem] font-semibold tracking-tight text-zinc-900 dark:text-white">
                LShorter
              </span>
            </Link>

            {/* Desktop nav (ordered strictly top-to-bottom with landing page) */}
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-0.5 xl:gap-1 lg:flex"
            >
              {NAV_ITEMS.map((item) => {
                if (!item.hasMenu) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href ?? "#"}
                      onClick={() => setDocsOpen(false)}
                      className="rounded-full px-3 xl:px-3.5 py-2 text-[14px] font-medium whitespace-nowrap text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-100/80 dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-white cursor-pointer"
                    >
                      {item.label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setDocsOpen((prev) => !prev)}
                    aria-expanded={docsOpen}
                    aria-controls="navbar-docs-megamenu"
                    className={`flex items-center gap-1 rounded-full px-3 xl:px-3.5 py-2 text-[14px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      docsOpen
                        ? "bg-zinc-100 dark:bg-white/[0.10] text-zinc-900 dark:text-white"
                        : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        docsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 dark:border-white/12 bg-zinc-50/80 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.10] hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>

              {isAuthenticated ? (
                <Link
                  href={dashboardHref}
                  onClick={closeAll}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-900 dark:bg-white px-5 py-2 text-sm font-semibold text-white dark:text-zinc-950 transition-colors hover:bg-[#0066FF] dark:hover:bg-[#0066FF] dark:hover:text-white"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeAll}
                    className="rounded-full border border-zinc-200 dark:border-white/14 bg-zinc-50 dark:bg-white/[0.05] px-5 py-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.10]"
                  >
                    Sign in
                  </Link>

                  <Link
                    href="/#hero-shortener"
                    onClick={handleGetStartedClick}
                    className="rounded-full bg-zinc-900 dark:bg-white px-5 py-2 text-sm font-semibold text-white dark:text-zinc-950 transition-colors hover:bg-[#0066FF] dark:hover:bg-[#0066FF] dark:hover:text-white"
                  >
                    Shorten a link
                  </Link>
                </>
              )}
            </div>

            {/* Mobile actions */}
            <div className="flex items-center gap-1.5 lg:hidden">
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={
                  theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                {theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                {mobileOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Docs & API Mega-Dropdown — 100% GPU-Composited Curtain (zero height reflow, zero backdrop-blur resize jank, pre-decoded image) */}
        <div
          id="navbar-docs-megamenu"
          aria-hidden={!docsOpen}
          inert={!docsOpen ? true : undefined}
          style={{
            clipPath: docsOpen
              ? "inset(0px -48px -64px -48px)"
              : "inset(0px -48px 100% -48px)",
            opacity: docsOpen ? 1 : 0,
            transform: docsOpen
              ? "translate3d(0, 0px, 0)"
              : "translate3d(0, -10px, 0)",
            transition:
              "clip-path 260ms cubic-bezier(0.22, 1, 0.36, 1), transform 260ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out",
          }}
          className={`hidden lg:block absolute left-0 right-0 top-full -mt-px z-10 rounded-b-[10px] border border-t-0 border-zinc-200/80 dark:border-white/[0.11] bg-white dark:bg-[#0D0E12] shadow-[0_22px_48px_-14px_rgba(0,0,0,0.16)] dark:shadow-[0_26px_56px_-14px_rgba(0,0,0,0.82)] will-change-[clip-path,transform,opacity] ${
            docsOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <div className="grid grid-cols-[1fr_1fr_auto] gap-10 px-8 pb-7 pt-6">
            {DOCS_API_MENU.columns.map((col, colIdx) => (
              <div key={col.eyebrow} className="flex flex-col gap-5">
                <span className="w-fit rounded-full border border-zinc-200 dark:border-white/12 px-3.5 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  {col.eyebrow}
                </span>
                <ul className="flex flex-col gap-3.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        onClick={closeAll}
                        className={`group flex items-center gap-2 text-[19px] font-semibold text-zinc-900 dark:text-white hover:text-[#0066FF] dark:hover:text-[#60A5FA] transition-colors ${
                          link.active
                            ? "underline decoration-zinc-300 dark:decoration-white/30 underline-offset-4"
                            : ""
                        }`}
                      >
                        <span>{link.label}</span>
                        {link.badge && (
                          <span className="rounded-full bg-zinc-900 dark:bg-[#0066FF] px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-white group-hover:bg-[#0066FF] transition-colors">
                            {link.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>

                {colIdx === DOCS_API_MENU.columns.length - 1 &&
                  DOCS_API_MENU.footerLinks && (
                    <div className="mt-auto flex flex-col gap-1.5 pt-10">
                      {DOCS_API_MENU.footerLinks.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={closeAll}
                          className="text-sm text-zinc-400 dark:text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
              </div>
            ))}

            {/* Pre-decoded API Preview Card */}
            <Link
              href={DOCS_API_MENU.image.href}
              onClick={closeAll}
              className="group relative hidden h-64 w-72 flex-col justify-end overflow-hidden rounded-[10px] border border-zinc-200/80 dark:border-white/12 bg-white dark:bg-zinc-900 md:flex"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={DOCS_API_MENU.image.src}
                alt={DOCS_API_MENU.image.alt}
                loading="eager"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
              />
              {DOCS_API_MENU.imageCaption && (
                <div className="relative z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                  <p className="text-sm font-medium leading-snug text-white">
                    {DOCS_API_MENU.imageCaption}
                  </p>
                </div>
              )}
            </Link>
          </div>

          {/* Kept Socials Only: X, LinkedIn, YouTube */}
          {DOCS_API_MENU.showSocials && (
            <div className="flex items-center gap-4 px-8 pb-7">
              {SOCIALS.map(({ href, label, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Integrated Mobile Panel — 100% GPU-Composited Curtain (zero layout jank) */}
        <div
          data-lenis-prevent
          aria-hidden={!mobileOpen}
          inert={!mobileOpen ? true : undefined}
          style={{
            clipPath: mobileOpen
              ? "inset(0px -32px -48px -32px)"
              : "inset(0px -32px 100% -32px)",
            opacity: mobileOpen ? 1 : 0,
            transform: mobileOpen
              ? "translate3d(0, 0px, 0)"
              : "translate3d(0, -10px, 0)",
            transition:
              "clip-path 240ms cubic-bezier(0.22, 1, 0.36, 1), transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out",
          }}
          className={`lg:hidden absolute left-0 right-0 top-full -mt-px z-10 rounded-b-[10px] border border-t-0 border-zinc-200/80 dark:border-white/[0.11] bg-white dark:bg-[#0D0E12] shadow-[0_22px_48px_-14px_rgba(0,0,0,0.18)] dark:shadow-[0_26px_56px_-14px_rgba(0,0,0,0.85)] will-change-[clip-path,transform,opacity] ${
            mobileOpen ? "pointer-events-auto" : "pointer-events-none"
          }`}
        >
          <div className="flex max-h-[calc(100svh-96px)] flex-col gap-1 overflow-y-auto px-5 pb-5 pt-3">
            {NAV_ITEMS.map((item) =>
              item.hasMenu ? (
                <div key={item.label} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setMobileDocsOpen((v) => !v)}
                    aria-expanded={mobileDocsOpen}
                    className="flex items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[15px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-white/[0.06] cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        mobileDocsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Smooth CSS grid 0fr -> 1fr accordion for mobile Docs sublinks */}
                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                      mobileDocsOpen
                        ? "grid-rows-[1fr] opacity-100"
                        : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden min-h-0">
                      <div className="ml-3 mb-2 flex flex-col gap-2.5 border-l border-zinc-200 dark:border-white/10 pl-4 pt-2">
                        {DOCS_API_MENU.columns.flatMap((c) =>
                          c.links.map((link) => (
                            <Link
                              key={link.label}
                              href={link.href}
                              onClick={closeAll}
                              className="flex items-center gap-2 py-0.5 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-[#0066FF] dark:hover:text-[#60A5FA]"
                            >
                              <span>{link.label}</span>
                              {link.badge && (
                                <span className="rounded-full bg-zinc-900 dark:bg-[#0066FF] px-1.5 py-0.5 text-[10px] font-semibold uppercase text-white">
                                  {link.badge}
                                </span>
                              )}
                            </Link>
                          )),
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  key={item.label}
                  href={item.href ?? "#"}
                  onClick={closeAll}
                  className="flex items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[15px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-white/[0.06]"
                >
                  {item.label}
                </Link>
              ),
            )}

            <div className="mt-3 flex flex-col gap-2.5 border-t border-zinc-200/70 dark:border-white/[0.08] pt-4">
              {isAuthenticated ? (
                <Link
                  href={dashboardHref}
                  onClick={closeAll}
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-zinc-900 dark:bg-white px-5 py-2.5 text-center text-sm font-semibold text-white dark:text-zinc-950"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  <span>Open Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeAll}
                    className="rounded-full border border-zinc-200 dark:border-white/15 bg-zinc-50 dark:bg-white/[0.05] px-5 py-2.5 text-center text-sm font-semibold text-zinc-900 dark:text-white"
                  >
                    Sign in
                  </Link>
                  <Link
                    href="/#hero-shortener"
                    onClick={handleGetStartedClick}
                    className="rounded-full bg-zinc-900 dark:bg-white px-5 py-2.5 text-center text-sm font-semibold text-white dark:text-zinc-950"
                  >
                    Shorten a link
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar2;
