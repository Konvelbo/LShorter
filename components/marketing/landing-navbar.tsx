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
  ChevronDown,
  BookOpen,
  Code2,
  Terminal,
  Webhook,
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

// ─── DROPDOWN MÉGA-MENU DOCS & API (MAX ROUNDED: 10px STRICT) ───
function DocsApiDropdown({
  isActive,
  isLightSurface,
}: {
  isActive: boolean;
  isLightSurface?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 170);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const docItems = [
    {
      title: "Guides & Architecture",
      desc: "Edge routing concepts, smart geo & PathLock™",
      href: "/docs",
      icon: BookOpen,
      iconColor: "text-[#465FFF]",
    },
    {
      title: "REST API Reference",
      desc: "Endpoints, bearer tokens, headers & rate limits",
      href: "/docs/sdk-quickstart",
      icon: Code2,
      iconColor: "text-[#12B76A]",
    },
    {
      title: "SDKs & Integration",
      desc: "Official TypeScript, Node.js & cURL quickstart",
      href: "/docs/sdk-quickstart#sdk-quickstart",
      icon: Terminal,
      iconColor: "text-[#F79009]",
    },
    {
      title: "Webhooks & Events",
      desc: "Real-time delivery with HMAC SHA-256 signatures",
      href: "/docs/webhooks-and-events",
      icon: Webhook,
      iconColor: "text-[#7A5AF8]",
    },
  ];

  return (
    <div
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href="/docs"
        className={`relative px-[clamp(0.45rem,0.75vw,0.85rem)] py-1.5 rounded-[10px] text-[clamp(0.75rem,0.88vw,0.85rem)] font-normal tracking-[-0.01em] transition-colors cursor-pointer select-none inline-flex items-center gap-1 ${
          isLightSurface
            ? isActive || isOpen
              ? "bg-black/5 text-black font-medium"
              : "text-[#111111] hover:text-black"
            : isActive || isOpen
              ? "bg-white/15 text-white font-medium"
              : "text-neutral-300 hover:text-white"
        }`}
      >
        <span>Doc &amp; Api</span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ease-out ${
            isOpen ? "rotate-180 text-[#465FFF]" : "opacity-60"
          }`}
        />
      </Link>

      {/* DROPDOWN MEGA MENU CONTAINER (MAX ROUNDED: 10px STRICT) */}
      <div
        className={`absolute top-full mt-2.5 right-0 sm:right-[-40px] md:right-[-70px] lg:right-[-90px] w-[min(670px,calc(100vw-32px))] z-50 transform-gpu transition-all duration-200 ease-[cubic-bezier(0.16,1,0.3,1)] before:content-[''] before:absolute before:-top-3 before:left-0 before:right-0 before:h-3.5 ${
          isOpen
            ? "opacity-100 translate-y-0 scale-100 pointer-events-auto visible"
            : "opacity-0 -translate-y-2 scale-[0.98] pointer-events-none invisible"
        }`}
      >
        <div
          className={`rounded-[10px] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.14)] dark:shadow-[0_25px_60px_rgba(0,0,0,0.75)] border backdrop-blur-2xl transition-colors ${
            isLightSurface
              ? "bg-white/98 border-[#E4E7EC]"
              : "bg-[#0E0E12]/98 border-white/10"
          }`}
        >
          <div className="grid grid-cols-1 md:grid-cols-[1.55fr_1.1fr] gap-5 items-stretch">
            {/* Colonne Gauche : Grille 2x2 des ressources */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {docItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.title}
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="group rounded-[8px] p-3 flex items-start gap-3 transition-colors duration-150 hover:bg-[#F4F5F7] dark:hover:bg-white/[0.06] border border-transparent hover:border-black/[0.04] dark:hover:border-white/[0.05]"
                  >
                    <div className="w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 bg-[#F2F4F7] dark:bg-white/10 text-[#465FFF] group-hover:bg-[#465FFF] group-hover:text-white transition-colors duration-200 mt-0.5">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-[13px] font-semibold text-[#101828] dark:text-white leading-tight group-hover:text-[#465FFF] dark:group-hover:text-[#465FFF] transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11.5px] text-[#667085] dark:text-zinc-400 leading-snug mt-1 line-clamp-2">
                        {item.desc}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Colonne Droite : Carte Ressource En Vedette (Style Identique à l'Image) */}
            <div className="flex flex-col">
              <span className="text-[10.5px] font-mono uppercase tracking-[0.12em] text-[#667085] dark:text-zinc-400 font-semibold mb-2">
                RESSOURCES
              </span>
              <Link
                href="/docs"
                onClick={() => setIsOpen(false)}
                className="group relative flex-1 rounded-[10px] overflow-hidden p-5 flex flex-col justify-between border border-black/10 dark:border-white/10 transition-transform duration-200 hover:scale-[1.01] bg-gradient-to-br from-[#0c0d14] via-[#141522] to-[#1c1d30] text-white shadow-inner"
              >
                {/* Texture subtile & lueur dorée/bleue en arrière-plan */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(70,95,255,0.22),transparent_70%)] pointer-events-none" />
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

                {/* Badge supérieur */}
                <div className="relative z-10 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] text-[10.5px] font-mono uppercase tracking-wider bg-white/10 text-white/90 border border-white/15 backdrop-blur-md">
                    <Sparkles className="w-3 h-3 text-amber-400" />
                    Hub Officiel
                  </span>
                  <ArrowRight className="w-4 h-4 text-white/60 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>

                {/* Illustration centrale livre ouvert / code */}
                <div className="relative z-10 my-3 flex items-center justify-center py-2">
                  <div className="w-12 h-12 rounded-[10px] bg-gradient-to-br from-amber-400/20 to-[#465FFF]/20 border border-white/15 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-6 h-6 text-amber-300" />
                  </div>
                </div>

                {/* Texte bas de carte */}
                <div className="relative z-10">
                  <h5 className="text-[15px] font-bold tracking-tight text-white group-hover:text-amber-200 transition-colors">
                    Documentation
                  </h5>
                  <p className="text-[11.5px] text-white/70 leading-snug mt-1">
                    Guide complet de l'infrastructure Edge, clés API &amp; SDKs.
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
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
    { label: "Product", href: "/#product" },
    { label: "Features", href: "/#features" },
    { label: "Security", href: "/#security" },
    { label: "Difference", href: "/#why-us" },
    { label: "Limits", href: "/#analytics" },
    { label: "FAQ", href: "/#faq" },
    { label: "Pricing", href: "/pricing" },
    { label: "Doc & Api", href: "/docs" },
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
          {navLinks.map((item) => {
            if (item.label === "Doc & Api") {
              return (
                <DocsApiDropdown
                  key={item.label}
                  isActive={pathname.startsWith("/docs")}
                  isLightSurface={isLight}
                />
              );
            }
            return (
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
            );
          })}
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

          {/* Bouton Dashboard / Get started */}
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              onMouseEnter={handleCtaEnter}
              onMouseLeave={handleCtaLeave}
              onPointerDown={handleCtaPointerDown}
              onPointerUp={handleCtaPointerUp}
              style={{ backgroundColor: "#465FFF", color: "#FFFFFF" }}
              className="inline-flex items-center gap-2 rounded-[12px] px-4.5 py-2 text-[13px] font-semibold whitespace-nowrap !text-white !bg-[#465FFF] border-0 outline-none shadow-sm cursor-pointer will-change-transform shrink-0"
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
              className="inline-flex items-center gap-2 rounded-[12px] px-4.5 py-2 text-[13px] font-semibold whitespace-nowrap !text-white !bg-[#465FFF] border-0 outline-none shadow-sm cursor-pointer will-change-transform shrink-0"
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
            className={`w-8 h-8 rounded-[10px] flex items-center justify-center transition-all active:scale-90 cursor-pointer ${
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
