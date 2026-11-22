"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "motion/react";
import {
  ChevronDown,
  LayoutDashboard,
  Menu,
  Moon,
  Sun,
  X,
} from "lucide-react";
import {
  FaXTwitter,
  FaInstagram,
  FaLinkedin,
  FaYoutube,
  FaThreads,
  FaWhatsapp,
} from "react-icons/fa6";
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

const MEGA_MENUS: Record<string, MegaMenu> = {
  "Docs & API": DOCS_API_MENU,
};

const NAV_ITEMS = [
  { label: "Features", hasMenu: false, href: "/#features" },
  { label: "PathLock", hasMenu: false, href: "/#pathlock" },
  { label: "Difference", hasMenu: false, href: "/#difference" },
  { label: "Demo Video", hasMenu: false, href: "/#demo-video" },
  { label: "Pricing", hasMenu: false, href: "/pricing" },
  { label: "Docs & API", hasMenu: true },
] as const;

const SOCIALS = [
  { href: "https://x.com", label: "X", icon: FaXTwitter },
  { href: "https://instagram.com", label: "Instagram", icon: FaInstagram },
  { href: "https://linkedin.com", label: "LinkedIn", icon: FaLinkedin },
  { href: "https://youtube.com", label: "YouTube", icon: FaYoutube },
  { href: "https://threads.net", label: "Threads", icon: FaThreads },
  { href: "https://whatsapp.com", label: "WhatsApp", icon: FaWhatsapp },
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

  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const innerWrapRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const openMenuRef = useRef<string | null>(null);
  const mobileOpenRef = useRef(false);
  const isHoveringRef = useRef(false);
  const forceShowRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    openMenuRef.current = openMenu;
    if (openMenu) forceShowRef.current?.();
  }, [openMenu]);

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
    setOpenMenu(null);
    setMobileOpen(false);
  }, [pathname]);

  // Close open mega-menu / mobile panel on outside click or Escape
  useEffect(() => {
    if (!openMenu && !mobileOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
        setMobileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [openMenu, mobileOpen]);

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

  // Ultra-smooth zero-rerender Lenis + lerp rAF headroom glide (eliminates CSS/React stutter)
  useEffect(() => {
    const HIDE_AFTER_Y = 140;
    const DOWN_THRESHOLD_PX = 18;
    const UP_THRESHOLD_PX = 6;
    const NAV_LERP = 0.12;

    let lastY = Math.max(0, window.scrollY);
    let targetHidden = 0; // 0 = fully visible, 1 = smoothly tucked above viewport
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
        Boolean(openMenuRef.current) ||
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

  const toggleMenu = (label: string, hasMenu: boolean) => {
    if (!hasMenu) {
      setOpenMenu(null);
      return;
    }
    setOpenMenu((current) => (current === label ? null : label));
  };

  const closeAll = useCallback(() => {
    setOpenMenu(null);
    setMobileOpen(false);
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

  const activeMenu = openMenu ? MEGA_MENUS[openMenu] : null;

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
        className="pointer-events-auto w-full max-w-7xl"
      >
        <div className="relative overflow-hidden rounded-[10px] border border-zinc-200/75 dark:border-white/[0.11] bg-white/95 dark:bg-[#0D0E12]/95 backdrop-blur-xl shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.10)] dark:shadow-[0_14px_38px_-8px_rgba(0,0,0,0.68)]">
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

            {/* Desktop nav */}
            <nav
              aria-label="Main navigation"
              className="hidden items-center gap-0.5 xl:gap-1 lg:flex"
            >
              {NAV_ITEMS.map((item) => {
                const isOpen = openMenu === item.label;
                if (!item.hasMenu) {
                  return (
                    <Link
                      key={item.label}
                      href={item.href ?? "#"}
                      onClick={() => toggleMenu(item.label, false)}
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
                    onClick={() => toggleMenu(item.label, item.hasMenu)}
                    aria-expanded={isOpen}
                    className={`flex items-center gap-1 rounded-full px-3 xl:px-3.5 py-2 text-[14px] font-medium whitespace-nowrap transition-colors cursor-pointer ${
                      isOpen
                        ? "bg-zinc-100 dark:bg-white/[0.10] text-zinc-900 dark:text-white"
                        : "text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100/80 dark:hover:bg-white/[0.06] hover:text-zinc-900 dark:hover:text-white"
                    }`}
                  >
                    {item.label}
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-300 ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="hidden shrink-0 items-center gap-2.5 lg:flex">
              {/* Theme toggle */}
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

          {/* Desktop mega dropdown — shared across Product / Pricing / Resources */}
          <AnimatePresence initial={false}>
            {activeMenu && (
              <motion.div
                key={openMenu}
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                className="hidden overflow-hidden border-t border-zinc-200/70 dark:border-white/[0.08] lg:block"
              >
                <div className="grid grid-cols-[1fr_1fr_auto] gap-10 px-8 pb-8 pt-6">
                  {activeMenu.columns.map((col, colIdx) => (
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

                      {/* Footer links sit under the last column */}
                      {colIdx === activeMenu.columns.length - 1 &&
                        activeMenu.footerLinks && (
                          <div className="mt-auto flex flex-col gap-1.5 pt-10">
                            {activeMenu.footerLinks.map((item) => (
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

                  {/* Preview Card */}
                  <Link
                    href={activeMenu.image.href}
                    onClick={closeAll}
                    className="group relative hidden h-64 w-72 flex-col justify-end overflow-hidden rounded-[10px] border border-zinc-200/80 dark:border-white/12 bg-white dark:bg-zinc-900 md:flex"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeMenu.image.src}
                      alt={activeMenu.image.alt}
                      className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    {activeMenu.imageCaption && (
                      <div className="relative z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                        <p className="text-sm font-medium leading-snug text-white">
                          {activeMenu.imageCaption}
                        </p>
                      </div>
                    )}
                  </Link>
                </div>

                {/* Socials — shown when the menu opts in */}
                {activeMenu.showSocials && (
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Integrated Mobile Panel */}
          <AnimatePresence initial={false}>
            {mobileOpen && (
              <motion.div
                key="mobile-panel"
                data-lenis-prevent
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden border-t border-zinc-200/70 dark:border-white/[0.08] lg:hidden"
              >
                <div className="flex max-h-[calc(100svh-96px)] flex-col gap-1 overflow-y-auto px-5 pb-5 pt-3">
                  {NAV_ITEMS.map((item) =>
                    item.hasMenu ? (
                      <div key={item.label} className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => toggleMenu(item.label, true)}
                          aria-expanded={openMenu === item.label}
                          className="flex items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[15px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-white/[0.06] cursor-pointer"
                        >
                          <span>{item.label}</span>
                          <ChevronDown
                            className={`h-4 w-4 transition-transform ${
                              openMenu === item.label ? "rotate-180" : ""
                            }`}
                          />
                        </button>

                        {openMenu === item.label && MEGA_MENUS[item.label] && (
                          <div className="ml-3 mb-2 flex flex-col gap-2.5 border-l border-zinc-200 dark:border-white/10 pl-4 pt-2">
                            {MEGA_MENUS[item.label].columns.flatMap((c) =>
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
                        )}
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default Navbar2;
