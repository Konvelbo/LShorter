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
import { useTheme } from "@/components/providers/theme-provider";
import { useI18n } from "@/components/providers/i18n-provider";
import { lerp, useLenis } from "@/components/providers/smooth-scroll-provider";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";

type IconProps = { className?: string };

function FaXTwitter({ className }: IconProps) {
  return (
    <svg viewBox="0 0 512 512" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M389.2 48h70.6L305.6 224.2 487 464H345L233.7 318.6 106.5 464H35.8L200.7 275.5 26.8 48H172.4L272.9 180.9 389.2 48zM364.4 421.8h39.1L151.1 88h-42L364.4 421.8z" />
    </svg>
  );
}

function FaGithub({ className }: IconProps) {
  return (
    <svg viewBox="0 0 496 512" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
    </svg>
  );
}

function FaLinkedin({ className }: IconProps) {
  return (
    <svg viewBox="0 0 448 512" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M416 32H31.9C14.3 32 0 46.5 0 64.3v383.4C0 465.5 14.3 480 31.9 480H416c17.6 0 32-14.5 32-32.3V64.3c0-17.8-14.4-32.3-32-32.3zM135.4 416H69V202.2h66.5V416zm-33.2-243c-21.3 0-38.5-17.3-38.5-38.5S80.9 96 102.2 96c21.2 0 38.5 17.3 38.5 38.5 0 21.3-17.2 38.5-38.5 38.5zm282.1 243h-66.4V312c0-24.8-.5-56.7-34.5-56.7-34.6 0-39.9 27-39.9 54.9V416h-66.4V202.2h63.7v29.2h.9c8.9-16.8 30.6-34.5 62.9-34.5 67.2 0 79.7 44.3 79.7 101.9V416z" />
    </svg>
  );
}

function FaYoutube({ className }: IconProps) {
  return (
    <svg viewBox="0 0 576 512" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M549.655 124.083c-6.281-23.65-24.787-42.276-48.284-48.597C458.781 64 288 64 288 64S117.22 64 74.629 75.486c-23.497 6.322-42.003 24.947-48.284 48.597-11.412 42.867-11.412 132.305-11.412 132.305s0 89.438 11.412 132.305c6.281 23.65 24.787 41.5 48.284 47.821C117.22 448 288 448 288 448s170.78 0 213.371-11.486c23.497-6.321 42.003-24.171 48.284-47.821 11.412-42.867 11.412-132.305 11.412-132.305s0-89.438-11.412-132.305zm-317.51 213.508V175.185l142.739 81.205-142.739 81.201z" />
    </svg>
  );
}

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
  {
    href: process.env.NEXT_PUBLIC_TWITTER_URL || "https://x.com/lshorter",
    label: "X",
    icon: FaXTwitter,
  },
  {
    href: process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/lshorter",
    label: "GitHub",
    icon: FaGithub,
  },
  {
    href:
      process.env.NEXT_PUBLIC_LINKEDIN_URL ||
      "https://linkedin.com/company/lshorter",
    label: "LinkedIn",
    icon: FaLinkedin,
  },
  {
    href: process.env.NEXT_PUBLIC_YOUTUBE_URL || "https://youtube.com",
    label: "YouTube",
    icon: FaYoutube,
  },
];

const DROPDOWN_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Refresh-rate-independent imperative rAF + lerp curtain controller (matching the
 * navbar's own lerp physics). Animates strictly GPU-composited clip-path, transform,
 * and opacity — zero layout reflow, zero backdrop-blur resize repaint, seamless
 * mid-flight reversal, and uniform smoothness across 60Hz/120Hz/144Hz monitors.
 */
function useLerpPanelReveal(
  isOpen: boolean,
  panelRef: React.RefObject<HTMLDivElement | null>,
  contentRef: React.RefObject<HTMLDivElement | null>,
  shadowPadX: number,
  shadowPadBottom: number,
  onVisualOpenChange?: (visuallyOpen: boolean) => void,
) {
  const targetRef = useRef(isOpen ? 1 : 0);
  const currentRef = useRef(isOpen ? 1 : 0);
  const frameRef = useRef<number | null>(null);
  const visualOpenRef = useRef(isOpen);
  const onVisualOpenChangeRef = useRef(onVisualOpenChange);
  onVisualOpenChangeRef.current = onVisualOpenChange;

  useEffect(() => {
    targetRef.current = isOpen ? 1 : 0;

    const panel = panelRef.current;
    if (!panel) return;

    const emitVisualOpen = (next: boolean) => {
      if (visualOpenRef.current !== next) {
        visualOpenRef.current = next;
        onVisualOpenChangeRef.current?.(next);
      }
    };

    if (isOpen) {
      emitVisualOpen(true);
    }

    const applyState = (p: number) => {
      const clamped = Math.max(0, Math.min(1, p));
      const content = contentRef.current;

      if (clamped <= 0.002) {
        panel.style.clipPath = `inset(0px -${shadowPadX}px 100% -${shadowPadX}px)`;
        panel.style.opacity = "0";
        panel.style.transform = "translate3d(0, -10px, 0)";
        panel.style.visibility = "hidden";
        panel.style.pointerEvents = "none";
        if (content) {
          content.style.transform = "translate3d(0, -14px, 0)";
          content.style.opacity = "0";
        }
        emitVisualOpen(false);
        return;
      }

      panel.style.visibility = "visible";
      panel.style.pointerEvents = targetRef.current > 0.5 ? "auto" : "none";

      if (clamped >= 0.996) {
        panel.style.clipPath = `inset(0px -${shadowPadX}px -${shadowPadBottom}px -${shadowPadX}px)`;
        panel.style.opacity = "1";
        panel.style.transform = "translate3d(0, 0px, 0)";
        if (content) {
          content.style.transform = "translate3d(0, 0px, 0)";
          content.style.opacity = "1";
        }
        return;
      }

      const clipBottomPct = ((1 - clamped) * 100).toFixed(2);
      panel.style.clipPath = `inset(0px -${shadowPadX}px ${clipBottomPct}% -${shadowPadX}px round 0 0 10px 10px)`;
      panel.style.opacity = Math.min(1, clamped * 1.45).toFixed(3);
      panel.style.transform = `translate3d(0, ${(-(1 - clamped) * 10).toFixed(2)}px, 0)`;

      if (content) {
        const contentAlpha = Math.max(0, Math.min(1, (clamped - 0.1) / 0.9));
        content.style.transform = `translate3d(0, ${(-(1 - clamped) * 14).toFixed(2)}px, 0)`;
        content.style.opacity = contentAlpha.toFixed(3);
      }
    };

    let lastTime = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(64, Math.max(4, now - lastTime));
      lastTime = now;

      const target = targetRef.current;
      const diff = Math.abs(currentRef.current - target);

      if (diff <= 0.0015) {
        currentRef.current = target;
        applyState(currentRef.current);
        frameRef.current = null;
        return;
      }

      // Delta-time normalized lerp (0.11 per 60fps frame -> silky ~450ms glide on any refresh rate)
      const factor = 1 - Math.pow(1 - 0.11, dt / 16.667);
      currentRef.current = lerp(currentRef.current, target, factor);
      applyState(currentRef.current);
      frameRef.current = requestAnimationFrame(tick);
    };

    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
    }
    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [isOpen, panelRef, contentRef, shadowPadX, shadowPadBottom]);
}

export function Navbar2() {
  const pathname = usePathname();
  const router = useRouter();
  const { toggleTheme } = useTheme();
  const { locale, toggleLocale, t, tr } = useI18n();
  const { lenis } = useLenis();
  const { data: session, status } = useSession();

  const navItems = [
    { id: "demo-video", label: t("nav.demoVideo"), hasMenu: false, href: "/#demo-video" },
    { id: "features", label: t("nav.features"), hasMenu: false, href: "/#features" },
    { id: "pathlock", label: t("nav.pathlock"), hasMenu: false, href: "/#pathlock" },
    { id: "difference", label: t("nav.difference"), hasMenu: false, href: "/#difference" },
    { id: "docs-api", label: t("nav.docsApi"), hasMenu: true },
    { id: "pricing", label: t("nav.pricing"), hasMenu: false, href: "/pricing" },
  ] as const;

  const docsApiMenu: MegaMenu = {
    columns: [
      {
        eyebrow: tr("Documentation", "Documentation"),
        links: [
          { label: tr("Documentation Hub", "Centre de documentation"), href: "/docs", active: true },
          { label: tr("REST API Quickstart", "Démarrage rapide API REST"), href: "/docs/sdk-quickstart", badge: "v1" },
          { label: tr("PathLock™ Guide", "Guide PathLock™"), href: "/docs/path-lock" },
          { label: tr("Webhooks & Events", "Webhooks & Événements"), href: "/docs/webhooks-and-events" },
        ],
      },
      {
        eyebrow: tr("Capabilities & Guides", "Fonctionnalités & Guides"),
        links: [
          { label: tr("Smart Geo & OS Routing", "Routage intelligent Géo & OS"), href: "/docs/geo-routing" },
          { label: tr("Click Caps & Expiry", "Limites de clics & Expiration"), href: "/docs/click-limits-and-expiration" },
          { label: tr("Dynamic QR Studio", "Studio QR Dynamique"), href: "/docs/dynamic-qr-codes" },
          { label: tr("Real-Time Analytics", "Statistiques en temps réel"), href: "/docs/realtime-analytics" },
        ],
      },
    ],
    footerLinks: [
      { label: tr("Interactive API Terminal", "Terminal API interactif"), href: "/#api" },
      { label: tr("Revenue Attribution", "Attribution des revenus"), href: "/docs/conversion-tracking-amount-count" },
    ],
    showSocials: true,
    image: DOCS_API_MENU.image,
    imageCaption: tr(
      "REST API v1, PathLock™ & live edge telemetry across 310+ PoPs",
      "API REST v1, PathLock™ & télémétrie edge sur plus de 310 PoPs"
    ),
  };

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
  const [docsVisuallyOpen, setDocsVisuallyOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileVisuallyOpen, setMobileVisuallyOpen] = useState(false);
  const [mobileDocsOpen, setMobileDocsOpen] = useState(false);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);

  const headerRef = useRef<HTMLElement>(null);
  const innerWrapRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const docsPanelRef = useRef<HTMLDivElement>(null);
  const docsContentRef = useRef<HTMLDivElement>(null);
  const mobilePanelRef = useRef<HTMLDivElement>(null);
  const mobileContentRef = useRef<HTMLDivElement>(null);

  const docsOpenRef = useRef(false);
  const mobileOpenRef = useRef(false);
  const isHoveringRef = useRef(false);
  const forceShowRef = useRef<(() => void) | null>(null);

  // Smooth refresh-rate-independent rAF + lerp reveal for both Desktop Docs & API dropdown and Mobile menu
  useLerpPanelReveal(
    docsOpen,
    docsPanelRef,
    docsContentRef,
    48,
    64,
    setDocsVisuallyOpen,
  );
  useLerpPanelReveal(
    mobileOpen,
    mobilePanelRef,
    mobileContentRef,
    32,
    48,
    setMobileVisuallyOpen,
  );

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

  if (isIframeFullscreen) return null;

  const isAnyPanelOpen =
    docsOpen || docsVisuallyOpen || mobileOpen || mobileVisuallyOpen;

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
        {/* Fixed-height Top Bar */}
        <div
          className={`relative z-20 overflow-hidden border border-zinc-200/80 dark:border-white/[0.11] bg-white/[0.97] dark:bg-[#0D0E12]/[0.97] backdrop-blur-md transition-[border-radius] duration-200 ${
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
              aria-label={tr("Main navigation", "Navigation principale")}
              className="hidden items-center gap-0.5 xl:gap-1 lg:flex"
            >
              {navItems.map((item) => {
                if (!item.hasMenu) {
                  return (
                    <Link
                      key={item.id}
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
                    key={item.id}
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
                    <motion.span
                      aria-hidden="true"
                      initial={false}
                      animate={{ rotate: docsOpen ? 180 : 0 }}
                      transition={{ duration: 0.42, ease: DROPDOWN_EASE }}
                      className="inline-flex items-center justify-center"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>
                );
              })}
            </nav>

            {/* Right actions */}
            <div className="hidden shrink-0 items-center gap-2 lg:flex">
              {/* Simple, sober compact EN/FR language toggle strictly to the left of the theme toggle */}
              <button
                type="button"
                data-testid="navbar-language-toggle"
                onClick={toggleLocale}
                aria-label={t("lang.switchToOther")}
                title={t("lang.switchToOther")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 dark:border-white/12 bg-zinc-50/80 dark:bg-white/[0.05] font-mono text-[11.5px] font-semibold tracking-wider text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.10] hover:text-zinc-900 dark:hover:text-white cursor-pointer select-none"
              >
                {locale.toUpperCase()}
              </button>

              <button
                type="button"
                data-testid="navbar-theme-toggle"
                onClick={toggleTheme}
                aria-label={t("nav.toggleTheme")}
                title={t("nav.toggleTheme")}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 dark:border-white/12 bg-zinc-50/80 dark:bg-white/[0.05] text-zinc-600 dark:text-zinc-300 transition-colors hover:bg-zinc-100 dark:hover:bg-white/[0.10] hover:text-zinc-900 dark:hover:text-white cursor-pointer"
              >
                <Sun className="hidden dark:block h-4 w-4" aria-hidden="true" />
                <Moon className="block dark:hidden h-4 w-4" aria-hidden="true" />
              </button>

              {status === "loading" ? (
                <div
                  aria-hidden="true"
                  className="h-9 w-[132px] rounded-full bg-zinc-100/80 dark:bg-white/[0.06] animate-pulse"
                />
              ) : isAuthenticated ? (
                <WaveRevealButton
                  href={dashboardHref}
                  onClick={closeAll}
                  variant="primary"
                  size="sm"
                  wave
                  icon={<LayoutDashboard className="h-3.5 w-3.5" />}
                  className="h-9 rounded-full px-4 text-[13.5px]"
                >
                  {t("nav.dashboard")}
                </WaveRevealButton>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeAll}
                    className="inline-flex h-9 items-center rounded-full border border-zinc-200 dark:border-white/14 bg-zinc-50 dark:bg-white/[0.05] px-5 text-sm font-semibold text-zinc-900 dark:text-zinc-100 transition-[background-color,border-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow hover:bg-zinc-100 dark:hover:bg-white/[0.10]"
                  >
                    {t("nav.signIn")}
                  </Link>

                  <WaveRevealButton
                    href="/register"
                    onClick={closeAll}
                    variant="primary"
                    size="sm"
                    wave
                    className="h-9 rounded-full px-4 text-[13.5px]"
                  >
                    {t("nav.shortenLink")}
                  </WaveRevealButton>
                </>
              )}
            </div>

            {/* Mobile actions */}
            <div className="flex items-center gap-1 lg:hidden">
              <button
                type="button"
                data-testid="navbar-language-toggle-mobile"
                onClick={toggleLocale}
                aria-label={t("lang.switchToOther")}
                title={t("lang.switchToOther")}
                className="flex h-9 w-9 items-center justify-center rounded-full font-mono text-[11.5px] font-semibold tracking-wider text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer select-none"
              >
                {locale.toUpperCase()}
              </button>
              <button
                type="button"
                data-testid="navbar-theme-toggle-mobile"
                onClick={toggleTheme}
                aria-label={t("nav.toggleTheme")}
                title={t("nav.toggleTheme")}
                className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <Sun className="hidden dark:block h-4 w-4" aria-hidden="true" />
                <Moon className="block dark:hidden h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setMobileOpen((v) => !v)}
                aria-expanded={mobileOpen}
                aria-label={mobileOpen ? t("nav.closeMenu") : t("nav.openMenu")}
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

        {/* Desktop Docs & API Mega-Dropdown — Silky rAF + lerp GPU Curtain (same physics as navbar) */}
        <div
          ref={docsPanelRef}
          id="navbar-docs-megamenu"
          aria-hidden={!docsOpen}
          inert={!docsOpen ? true : undefined}
          style={{
            clipPath: "inset(0px -48px 100% -48px)",
            opacity: 0,
            transform: "translate3d(0, -10px, 0)",
            visibility: "hidden",
            pointerEvents: "none",
          }}
          className="hidden lg:block absolute left-0 right-0 top-full -mt-px z-10 rounded-b-[10px] border border-t-0 border-zinc-200/80 dark:border-white/[0.11] bg-white dark:bg-[#0D0E12] shadow-[0_22px_48px_-14px_rgba(0,0,0,0.16)] dark:shadow-[0_26px_56px_-14px_rgba(0,0,0,0.82)] will-change-[clip-path,transform,opacity]"
        >
          <div
            ref={docsContentRef}
            style={{ transform: "translate3d(0, -14px, 0)", opacity: 0 }}
            className="will-change-[transform,opacity]"
          >
            <div className="grid grid-cols-[1fr_1fr_auto] gap-10 px-8 pb-7 pt-6">
              {docsApiMenu.columns.map((col, colIdx) => (
                <div key={col.eyebrow} className="flex flex-col gap-5">
                  <span className="w-fit rounded-full border border-zinc-200 dark:border-white/12 px-3.5 py-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                    {col.eyebrow}
                  </span>
                  <ul className="flex flex-col gap-3.5">
                    {col.links.map((link) => (
                      <li key={link.href}>
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

                  {colIdx === docsApiMenu.columns.length - 1 &&
                    docsApiMenu.footerLinks && (
                      <div className="mt-auto flex flex-col gap-1.5 pt-10">
                        {docsApiMenu.footerLinks.map((item) => (
                          <Link
                            key={item.href}
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
                href={docsApiMenu.image.href}
                onClick={closeAll}
                className="group relative hidden h-64 w-72 flex-col justify-end overflow-hidden rounded-[10px] border border-zinc-200/80 dark:border-white/12 bg-white dark:bg-zinc-900 md:flex"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={docsApiMenu.image.src}
                  alt={docsApiMenu.image.alt}
                  loading="lazy"
                  decoding="async"
                  className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-[1.03]"
                />
                {docsApiMenu.imageCaption && (
                  <div className="relative z-10 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 pt-12">
                    <p className="text-sm font-medium leading-snug text-white">
                      {docsApiMenu.imageCaption}
                    </p>
                  </div>
                )}
              </Link>
            </div>

            {/* Social Links from .env: X, GitHub, LinkedIn, YouTube */}
            {DOCS_API_MENU.showSocials && (
              <div className="flex items-center gap-4 px-8 pb-7">
                {SOCIALS.map(({ href, label, icon: Icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    title={label}
                    className="text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Integrated Mobile Panel — Silky rAF + lerp GPU Curtain */}
        <div
          ref={mobilePanelRef}
          data-lenis-prevent
          aria-hidden={!mobileOpen}
          inert={!mobileOpen ? true : undefined}
          style={{
            clipPath: "inset(0px -32px 100% -32px)",
            opacity: 0,
            transform: "translate3d(0, -10px, 0)",
            visibility: "hidden",
            pointerEvents: "none",
          }}
          className="lg:hidden absolute left-0 right-0 top-full -mt-px z-10 rounded-b-[10px] border border-t-0 border-zinc-200/80 dark:border-white/[0.11] bg-white dark:bg-[#0D0E12] shadow-[0_22px_48px_-14px_rgba(0,0,0,0.18)] dark:shadow-[0_26px_56px_-14px_rgba(0,0,0,0.85)] will-change-[clip-path,transform,opacity]"
        >
          <div
            ref={mobileContentRef}
            style={{ transform: "translate3d(0, -14px, 0)", opacity: 0 }}
            className="flex max-h-[calc(100svh-96px)] flex-col gap-1 overflow-y-auto px-5 pb-5 pt-3 will-change-[transform,opacity]"
          >
            {navItems.map((item) =>
              item.hasMenu ? (
                <div key={item.id} className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => setMobileDocsOpen((v) => !v)}
                    aria-expanded={mobileDocsOpen}
                    className="flex items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[15px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-white/[0.06] cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <motion.span
                      aria-hidden="true"
                      initial={false}
                      animate={{ rotate: mobileDocsOpen ? 180 : 0 }}
                      transition={{ duration: 0.4, ease: DROPDOWN_EASE }}
                      className="inline-flex items-center justify-center"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </motion.span>
                  </button>

                  <AnimatePresence initial={false}>
                    {mobileDocsOpen && (
                      <motion.div
                        key="mobile-docs-panel"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                          height: "auto",
                          opacity: 1,
                          transition: {
                            height: { duration: 0.42, ease: DROPDOWN_EASE },
                            opacity: { duration: 0.32, delay: 0.05, ease: DROPDOWN_EASE },
                          },
                        }}
                        exit={{
                          height: 0,
                          opacity: 0,
                          transition: {
                            height: { duration: 0.38, ease: DROPDOWN_EASE },
                            opacity: { duration: 0.22, ease: DROPDOWN_EASE },
                          },
                        }}
                        className="overflow-hidden will-change-[height,opacity]"
                      >
                        <div className="ml-3 mb-2 flex flex-col gap-2.5 border-l border-zinc-200 dark:border-white/10 pl-4 pt-2">
                          {docsApiMenu.columns.flatMap((c) =>
                            c.links.map((link) => (
                              <Link
                                key={link.href}
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
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link
                  key={item.id}
                  href={item.href ?? "#"}
                  onClick={closeAll}
                  className="flex items-center justify-between rounded-[8px] px-3 py-2.5 text-left text-[15px] font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100/80 dark:hover:bg-white/[0.06]"
                >
                  {item.label}
                </Link>
              ),
            )}

            <div className="mt-3 flex flex-col gap-2.5 border-t border-zinc-200/70 dark:border-white/[0.08] pt-4">
              {status === "loading" ? (
                <div
                  aria-hidden="true"
                  className="h-11 w-full rounded-full bg-zinc-100/80 dark:bg-white/[0.06] animate-pulse"
                />
              ) : isAuthenticated ? (
                <WaveRevealButton
                  href={dashboardHref}
                  onClick={closeAll}
                  variant="primary"
                  size="md"
                  wave
                  icon={<LayoutDashboard className="h-4 w-4" />}
                  className="w-full rounded-full"
                >
                  {tr("Open Dashboard", "Ouvrir le tableau de bord")}
                </WaveRevealButton>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={closeAll}
                    className="inline-flex h-11 items-center justify-center rounded-full border border-zinc-200 dark:border-white/15 bg-zinc-50 dark:bg-white/[0.05] px-5 text-center text-sm font-semibold text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-white/[0.10] transition-[background-color,border-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow"
                  >
                    {t("nav.signIn")}
                  </Link>
                  <WaveRevealButton
                    href="/register"
                    onClick={closeAll}
                    variant="primary"
                    size="md"
                    wave
                    className="w-full rounded-full"
                  >
                    {t("nav.shortenLink")}
                  </WaveRevealButton>
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
