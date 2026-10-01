"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  ArrowRight,
  Menu,
  X,
  LayoutDashboard,
  Sun,
  Moon,
  Sparkles,
} from "lucide-react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useTheme } from "@/components/providers/theme-provider";
import { useMobileMenu } from "@/components/providers/use-mobile-menu";
import { useSession } from "next-auth/react";

// ─── LIEN DESKTOP AVEC EFFET TEXT ROLL ───
function NavLinkItem({
  item,
  isActive,
  isLightSurface,
  onClick,
}: {
  item: { label: string; href: string; isHome?: boolean };
  isActive: boolean;
  isLightSurface?: boolean;
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
        .to(primary, { yPercent: 100, duration: 0.28, ease: "power2.inOut" }, 0)
        .to(clone, { yPercent: 0, duration: 0.28, ease: "power2.inOut" }, 0);
    },
    { scope: linkRef },
  );

  return (
    <Link
      ref={linkRef}
      href={item.href}
      onClick={onClick}
      onMouseEnter={() => tlRef.current?.play()}
      onMouseLeave={() => tlRef.current?.reverse()}
      className={`relative px-[clamp(0.45rem,0.75vw,0.85rem)] py-1.5 rounded-[10px] text-[clamp(0.75rem,0.88vw,0.85rem)] font-normal tracking-[-0.01em] transition-colors cursor-pointer overflow-hidden whitespace-nowrap select-none bg-transparent hover:bg-transparent ${
        isLightSurface
          ? isActive
            ? "bg-black/5 text-black font-medium"
            : "text-[#111111] hover:text-black"
          : isActive
            ? "bg-white/15 text-white font-medium"
            : "text-neutral-300 hover:text-white"
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
          className={`absolute inset-0 block select-none pointer-events-none font-medium will-change-transform ${
            isLightSurface ? "text-black" : "text-white"
          }`}
        >
          {item.label}
        </span>
      </span>
    </Link>
  );
}

// ─── COMPOSANT PRINCIPAL NAVBAR ───
export function LandingNavbar() {
  const { isOpen, toggle } = useMobileMenu();
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated =
    status === "authenticated" &&
    Boolean(session?.user) &&
    !(session?.user as any)?.userNotFound;

  const [isScrolled, setIsScrolled] = useState(false);
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);

  // Synchronisation avec le mode plein écran pour masquer la navbar
  useEffect(() => {
    const checkFullscreenState = () => {
      const isFs =
        document.documentElement.getAttribute("data-iframe-fullscreen") ===
          "true" ||
        document.body.getAttribute("data-iframe-fullscreen") === "true";
      setIsIframeFullscreen(isFs);
    };

    const handleFullscreenChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isFullscreen: boolean }>;
      setIsIframeFullscreen(Boolean(customEvent.detail?.isFullscreen));
    };

    checkFullscreenState();
    window.addEventListener(
      "product-fullscreen-change",
      handleFullscreenChange,
    );
    window.addEventListener("resize", checkFullscreenState);

    return () => {
      window.removeEventListener(
        "product-fullscreen-change",
        handleFullscreenChange,
      );
      window.removeEventListener("resize", checkFullscreenState);
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (isIframeFullscreen) {
    return null;
  }

  // --- ANIMATIONS HOVER 100% GSAP SUR LE BOUTON DASHBOARD ---
  const handleCtaEnter = (e: React.MouseEvent<HTMLElement>) => {
    const button = e.currentTarget;
    const arrow = button.querySelector(".cta-arrow-icon");
    const dashIcon = button.querySelector(".cta-dash-icon");

    gsap.to(button, {
      scale: 1.045,
      y: -2,
      backgroundColor: "#3641F5",
      boxShadow: "0 8px 24px rgba(70, 95, 255, 0.45)",
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });

    if (dashIcon) {
      gsap.to(dashIcon, {
        rotate: 12,
        scale: 1.15,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (arrow) {
      gsap.to(arrow, {
        x: 3.5,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleCtaLeave = (e: React.MouseEvent<HTMLElement>) => {
    const button = e.currentTarget;
    const arrow = button.querySelector(".cta-arrow-icon");
    const dashIcon = button.querySelector(".cta-dash-icon");

    gsap.to(button, {
      scale: 1,
      y: 0,
      backgroundColor: "#465FFF",
      boxShadow: "0 2px 8px rgba(70, 95, 255, 0.25)",
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });

    if (dashIcon) {
      gsap.to(dashIcon, {
        rotate: 0,
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    }

    if (arrow) {
      gsap.to(arrow, {
        x: 0,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleCtaPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, {
      scale: 0.95,
      duration: 0.12,
      ease: "power1.out",
      overwrite: "auto",
    });
  };

  const handleCtaPointerUp = (e: React.PointerEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, {
      scale: 1.045,
      duration: 0.16,
      ease: "power1.out",
      overwrite: "auto",
    });
  };

  const handleToggleTheme = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.fromTo(
      e.currentTarget,
      { scale: 0.78, rotate: -30 },
      { scale: 1, rotate: 0, duration: 0.35, ease: "back.out(2)" },
    );
    toggleTheme();
  };

  const handleBurgerClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    gsap.fromTo(
      e.currentTarget,
      { scale: 0.8 },
      { scale: 1, duration: 0.28, ease: "back.out(2.5)" },
    );
    toggle();
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.location.reload();
    }
  };

  const navLinks = [
    { label: "Hi", href: "/", isHome: true },
    { label: "Platform", href: "/#product" },
    { label: "Features", href: "/#features" },
    { label: "Security", href: "/#security" },
    { label: "Difference", href: "/#why-us" },
    { label: "Limits", href: "/#analytics" },
    { label: "FAQ", href: "/#faq" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
  ];

  const glassStyle: React.CSSProperties = isScrolled
    ? {
        backgroundColor: isLight
          ? "rgba(255, 255, 255, 0.94)"
          : "rgba(9, 9, 11, 0.90)",
        backdropFilter: "blur(16px) saturate(180%)",
        WebkitBackdropFilter: "blur(16px) saturate(180%)",
        border: isLight
          ? "1px solid rgba(228, 231, 236, 0.95)"
          : "1px solid rgba(255, 255, 255, 0.14)",
        boxShadow: isLight
          ? "0 12px 34px rgba(0, 0, 0, 0.08)"
          : "0 14px 38px rgba(0, 0, 0, 0.58)",
      }
    : {
        backgroundColor: isLight ? "rgba(255, 255, 255, 0.96)" : "#09090b",
        backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        borderBottom: isLight
          ? "1px solid rgba(228, 231, 236, 0.8)"
          : "1px solid rgba(255, 255, 255, 0.08)",
      };

  return (
    <div
      style={{ display: isIframeFullscreen ? "none" : undefined }}
      className={`w-full flex justify-center pointer-events-none transition-all duration-200 ${
        isIframeFullscreen
          ? "hidden !opacity-0 !pointer-events-none !-z-50"
          : ""
      }`}
    >
      {/* ─── 1. NAVBAR DESKTOP (>= 768px) ─── */}
      <header
        style={glassStyle}
        className={`hidden md:flex items-center justify-between gap-2 pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,max-width,width,padding,border-radius,background-color] ${
          isScrolled
            ? "translate-y-3 sm:translate-y-4 w-[min(1280px,96vw)] max-w-[1280px] rounded-[14px] px-[clamp(0.75rem,1.8vw,2rem)] py-3"
            : "translate-y-0 w-full max-w-full rounded-none px-[clamp(1rem,2.5vw,3.5rem)] py-4"
        }`}
      >
        {/* Logo LShorter (Maillon Duo) */}
        <Link
          href="/"
          onClick={handleHomeClick}
          className="flex items-center gap-2.5 select-none cursor-pointer group shrink-0"
        >
          <div className="w-8 h-8 rounded-[9px] overflow-hidden shrink-0 shadow-xs group-hover:scale-105 transition-transform">
            <Image
              src="/logo.svg"
              alt="LShorter Logo"
              width={32}
              height={32}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <span
            className={`text-[clamp(0.95rem,1.1vw,1.125rem)] font-bold tracking-[-0.025em] ${
              isLight ? "text-[#101828]" : "text-white"
            }`}
          >
            LShorter
          </span>
        </Link>

        {/* Liens Desktop */}
        <nav className="flex items-center gap-[clamp(0.1rem,0.35vw,0.5rem)] min-w-0">
          {navLinks.map((item) => (
            <NavLinkItem
              key={item.label}
              item={item}
              isActive={
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href) && !item.href.includes("#")
              }
              isLightSurface={isLight}
            />
          ))}
        </nav>

        {/* Actions Desktop */}
        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <button
            type="button"
            onClick={handleToggleTheme}
            className={`w-8 h-8 lg:w-9 lg:h-9 rounded-full flex items-center justify-center border transition-colors cursor-pointer shrink-0 ${
              isLight
                ? "border-[#E4E7EC] text-[#344054] hover:text-black hover:bg-[#F9FAFB]"
                : "border-white/15 text-neutral-200 hover:text-white hover:bg-white/10"
            }`}
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {isLight ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-300" />
            )}
          </button>

          {/* Bouton Dashboard : forme pilule sans boîte rectangulaire externe */}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              onMouseEnter={handleCtaEnter}
              onMouseLeave={handleCtaLeave}
              onPointerDown={handleCtaPointerDown}
              onPointerUp={handleCtaPointerUp}
              style={{ backgroundColor: "#465FFF", color: "#FFFFFF" }}
              className="inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-[13px] font-semibold whitespace-nowrap !text-white !bg-[#465FFF] border-0 outline-none shadow-sm cursor-pointer will-change-transform shrink-0"
            >
              <LayoutDashboard className="cta-dash-icon w-3.5 h-3.5 shrink-0 !text-white will-change-transform" />
              <span className="!text-white font-medium">Dashboard</span>
              <ArrowRight className="cta-arrow-icon w-3.5 h-3.5 shrink-0 !text-white will-change-transform" />
            </Link>
          ) : (
            <Link
              href="/register"
              onMouseEnter={handleCtaEnter}
              onMouseLeave={handleCtaLeave}
              onPointerDown={handleCtaPointerDown}
              onPointerUp={handleCtaPointerUp}
              style={{ backgroundColor: "#465FFF", color: "#FFFFFF" }}
              className="inline-flex items-center gap-2 rounded-full px-4.5 py-2 text-[13px] font-semibold whitespace-nowrap !text-white !bg-[#465FFF] border-0 outline-none shadow-sm cursor-pointer will-change-transform shrink-0"
            >
              <Sparkles className="cta-dash-icon w-3.5 h-3.5 shrink-0 !text-white will-change-transform" />
              <span className="!text-white font-medium">Get started</span>
              <ArrowRight className="cta-arrow-icon w-3.5 h-3.5 shrink-0 !text-white will-change-transform" />
            </Link>
          )}
        </div>
      </header>

      {/* ─── 2. NAVBAR MOBILE (< 768px) ─── */}
      <header
        style={glassStyle}
        className={`flex md:hidden items-center justify-between pointer-events-auto transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,max-width,width,padding,border-radius,background-color] ${
          isScrolled
            ? "translate-y-2.5 w-[calc(100%-1.5rem)] max-w-lg rounded-xl px-3.5 py-2.5"
            : "translate-y-0 w-full max-w-full rounded-none px-4 py-3"
        }`}
      >
        <Link href="/" className="flex items-center gap-2 select-none">
          <div className="w-7 h-7 rounded-[8px] overflow-hidden shrink-0 shadow-2xs">
            <Image
              src="/logo.svg"
              alt="LShorter Logo"
              width={28}
              height={28}
              className="w-full h-full object-contain"
            />
          </div>
          <span
            className={`text-[16px] font-bold tracking-[-0.025em] ${
              isLight ? "text-[#09090B]" : "text-white"
            }`}
          >
            LShorter
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleToggleTheme}
            className={`w-8 h-8 rounded-[10px] flex items-center justify-center border transition-colors ${
              isLight
                ? "bg-black/[0.03] border-black/[0.08] text-[#52525B]"
                : "bg-white/[0.06] border-white/10 text-neutral-300"
            }`}
            aria-label="Basculer le thème"
          >
            {isLight ? (
              <Moon className="w-4 h-4" />
            ) : (
              <Sun className="w-4 h-4 text-amber-300" />
            )}
          </button>

          <button
            type="button"
            onClick={() => toggle()}
            className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-colors ${
              isOpen
                ? "bg-[#3B82F6] text-white"
                : isLight
                  ? "bg-black/[0.03] text-[#09090B] border border-black/[0.08]"
                  : "bg-white/[0.06] text-white border border-white/10"
            }`}
            aria-label="Menu"
          >
            {isOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>
    </div>
  );
}

export default LandingNavbar;
