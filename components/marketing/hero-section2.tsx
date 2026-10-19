"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import gsap from "gsap";
import { useSession } from "next-auth/react";
import {
  ArrowUpRight,
  Check,
  Copy,
  Terminal,
  Link2,
  QrCode,
  ShieldCheck,
  Split,
  LayoutDashboard,
  Sparkles,
} from "lucide-react";

const TREND_ITEMS = [
  {
    href: "/docs/geo-routing",
    label: "Smart Short Links & Geo Routing",
    icon: Link2,
    badgeClass:
      "bg-[#ECF3FF] dark:bg-[#465FFF]/20 border-[#465FFF]/25 text-[#465FFF] dark:text-[#7592FF]",
  },
  {
    href: "/docs/ab-testing-routing",
    label: "Weighted A/B Testing",
    icon: Split,
    badgeClass:
      "bg-[#F2F4F7] dark:bg-white/5 border-[#E4E7EC] dark:border-white/10 text-[#344054] dark:text-zinc-300",
  },
  {
    href: "/docs/pin-protection",
    label: "PathLock™ PIN & Cloaking",
    icon: ShieldCheck,
    badgeClass:
      "bg-[#F2F4F7] dark:bg-white/5 border-[#E4E7EC] dark:border-white/10 text-[#344054] dark:text-zinc-300",
  },
  {
    href: "/docs/dynamic-qr-codes",
    label: "Bio Links & Dynamic QR",
    icon: QrCode,
    badgeClass:
      "bg-[#F2F4F7] dark:bg-white/5 border-[#E4E7EC] dark:border-white/10 text-[#344054] dark:text-zinc-300",
  },
  {
    href: "/docs/sdk-quickstart",
    label: "Developer SDK & Webhooks",
    icon: Terminal,
    badgeClass:
      "bg-[#F2F4F7] dark:bg-white/5 border-[#E4E7EC] dark:border-white/10 text-[#344054] dark:text-zinc-300",
  },
];

// Emojis 3D Fluent grand format pour l'arrière-plan de la Hero Section :
// - Light mode : Opacité 100% pleine et solide (zéro transparence, couleurs riches et saturées).
// - Dark mode : Opacité lumineuse équilibrée (dark:opacity-65 à 75).
const HERO_BACKGROUND_EMOJIS = [
  // ==================== CÔTÉ GAUCHE ====================
  // 1. Haut Gauche (Mobile & Desktop) : Link 🔗 (En haut à gauche hors du texte)
  {
    src: "/emojis/link.png",
    alt: "Smart Short Links",
    className: "top-[8%] left-[4%] sm:top-[9%] sm:left-[4%] lg:left-[5%] w-7 h-7 xs:w-8 xs:h-8 sm:w-11 sm:h-11 lg:w-14 lg:h-14 opacity-100 dark:opacity-70 lg:dark:opacity-75",
    animation: "animate-hero-float-1",
  },
  // 2. Haut-Milieu Gauche (Desktop uniquement) : Shield 🛡️
  {
    src: "/emojis/shield.png",
    alt: "PathLock™ Security Shield",
    className: "top-[23%] left-[8%] lg:left-[10%] w-11 h-11 lg:w-13 lg:h-13 hidden sm:flex opacity-100 dark:opacity-70 lg:dark:opacity-75",
    animation: "animate-hero-float-4",
  },
  // 3. Centre-Haut Gauche (Desktop uniquement) : Compass 🧭
  {
    src: "/emojis/compass.png",
    alt: "Smart Geo Routing Compass",
    className: "top-[38%] left-[3%] lg:left-[4%] w-11 h-11 lg:w-14 lg:h-14 hidden sm:flex opacity-100 dark:opacity-70 lg:dark:opacity-75",
    animation: "animate-hero-float-2",
  },
  // 4. Centre-Bas Gauche (Desktop uniquement) : Globe 🌐
  {
    src: "/emojis/globe.png",
    alt: "Global Edge Anycast Routing",
    className: "top-[52%] left-[8%] lg:left-[10%] w-11 h-11 lg:w-14 lg:h-14 hidden sm:flex opacity-100 dark:opacity-70 lg:dark:opacity-75",
    animation: "animate-hero-float-3",
  },
  // 5. Bas-Centre Gauche (Desktop uniquement) : Key 🔑
  {
    src: "/emojis/key.png",
    alt: "Secure API Keys & Tokens",
    className: "top-[67%] left-[3%] lg:left-[4%] w-11 h-11 lg:w-13 lg:h-13 hidden sm:flex opacity-100 dark:opacity-70 lg:dark:opacity-75",
    animation: "animate-hero-float-1",
  },
  // 6. Bas Gauche (Mobile & Desktop) : Check ✅ (En bas à gauche sous les boutons)
  {
    src: "/emojis/check.png",
    alt: "Verified Link Routing",
    className: "top-[88%] left-[4%] sm:top-[80%] sm:left-[8%] lg:left-[9%] w-7 h-7 xs:w-8 xs:h-8 sm:w-11 sm:h-11 lg:w-13 lg:h-13 opacity-100 dark:opacity-70 lg:dark:opacity-75",
    animation: "animate-hero-float-4",
  },

  // ==================== CÔTÉ DROIT ====================
  // 7. Haut Droit (Mobile & Desktop) : Lock 🔒 (En haut à droite hors du texte)
  {
    src: "/emojis/lock.png",
    alt: "PIN Cloaking & Encryption",
    className: "top-[8%] right-[4%] sm:top-[9%] sm:right-[4%] lg:right-[5%] w-7 h-7 xs:w-8 xs:h-8 sm:w-11 sm:h-11 lg:w-14 lg:h-14 opacity-100 dark:opacity-70 lg:dark:opacity-75",
    animation: "animate-hero-float-2",
  },
  // 8. Haut-Milieu Droit (Desktop uniquement) : Handshake 🤝
  {
    src: "/emojis/handshake.png",
    alt: "Verified SLAs & Partnership",
    className: "top-[23%] right-[8%] lg:right-[10%] w-11 h-11 lg:w-13 lg:h-13 hidden sm:flex opacity-100 dark:opacity-70 lg:dark:opacity-75",
    animation: "animate-hero-float-1",
  },
  // 9. Centre-Haut Droit (Desktop uniquement) : Zap ⚡
  {
    src: "/emojis/zap.png",
    alt: "Ultra-fast Edge Redirection",
    className: "top-[38%] right-[3%] lg:right-[4%] w-11 h-11 lg:w-14 lg:h-14 hidden sm:flex opacity-100 dark:opacity-70 lg:dark:opacity-75",
    animation: "animate-hero-float-3",
  },
  // 10. Centre-Bas Droit (Desktop uniquement) : Satellite 📡
  {
    src: "/emojis/satellite.png",
    alt: "Edge Cloud Satellite Infrastructure",
    className: "top-[52%] right-[8%] lg:right-[10%] w-11 h-11 lg:w-13 lg:h-13 hidden sm:flex opacity-100 dark:opacity-70 lg:dark:opacity-75",
    animation: "animate-hero-float-2",
  },
  // 11. Bas-Centre Droit (Mobile & Desktop) : Rocket 🚀 (En bas à droite sous les boutons)
  {
    src: "/emojis/rocket.png",
    alt: "High Performance Routing",
    className: "top-[88%] right-[4%] sm:top-[67%] sm:right-[3%] lg:right-[4%] w-7 h-7 xs:w-8 xs:h-8 sm:w-11 sm:h-11 lg:w-14 lg:h-14 opacity-100 dark:opacity-70 lg:dark:opacity-75",
    animation: "animate-hero-float-1",
  },
  // 12. Bas Droit (Desktop uniquement) : Locked Key 🔐
  {
    src: "/emojis/locked_key.png",
    alt: "Encrypted Destination Lock",
    className: "top-[80%] right-[8%] lg:right-[9%] w-11 h-11 lg:w-13 lg:h-13 hidden sm:flex opacity-100 dark:opacity-70 lg:dark:opacity-75",
    animation: "animate-hero-float-4",
  },
];

export function HeroSection() {
  return <HeroSection2 />;
}

export function HeroSection2() {
  const { data: session, status } = useSession();
  const isAuthenticated =
    status === "authenticated" &&
    Boolean(session?.user) &&
    !(session?.user as any)?.userNotFound;

  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);

  const titlePart1 = "Stop wasting ad traffic.";
  const titlePart2 = "Route, convert, and attribute every click to real sales.";

  // Rendu par mot avec déclenchement CSS instantané au chargement (0ms de latence)
  const renderTypingText = (text: string, startIndex = 0) => {
    return text.split(" ").map((word, wordIdx) => (
      <span
        key={wordIdx}
        style={{
          animationDelay: `${(startIndex + wordIdx) * 0.035}s`,
        }}
        className="hero-word inline-block whitespace-nowrap mr-[0.26em] will-change-transform animate-hero-word-reveal"
      >
        {word}
      </span>
    ));
  };

  // --- HOVERS GSAP ---
  const handlePrimaryBtnEnter = (e: React.MouseEvent<HTMLElement>) => {
    const arrow = e.currentTarget.querySelector(".hero-cta-arrow");
    gsap.to(e.currentTarget, {
      y: -2.5,
      scale: 1.03,
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto",
    });
    if (arrow) {
      gsap.to(arrow, {
        x: 3,
        y: -3,
        scale: 1.15,
        duration: 0.22,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handlePrimaryBtnLeave = (e: React.MouseEvent<HTMLElement>) => {
    const arrow = e.currentTarget.querySelector(".hero-cta-arrow");
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto",
    });
    if (arrow) {
      gsap.to(arrow, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.22,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleSecondaryBtnEnter = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, {
      y: -2,
      scale: 1.025,
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleSecondaryBtnLeave = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleSdkBtnEnter = (e: React.MouseEvent<HTMLElement>) => {
    const icon = e.currentTarget.querySelector(".sdk-icon");
    gsap.to(e.currentTarget, {
      y: -2,
      scale: 1.02,
      duration: 0.2,
      ease: "power2.out",
      overwrite: "auto",
    });
    if (icon) {
      gsap.to(icon, {
        scale: 1.2,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleSdkBtnLeave = (e: React.MouseEvent<HTMLElement>) => {
    const icon = e.currentTarget.querySelector(".sdk-icon");
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      duration: 0.2,
      ease: "power2.out",
      overwrite: "auto",
    });
    if (icon) {
      gsap.to(icon, {
        scale: 1,
        duration: 0.2,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleCopySdk = () => {
    navigator.clipboard.writeText(
      `curl -X POST https://lsho.cc/api/v1/links -H "Authorization: Bearer lsh_live_9x82" -d '{"url":"https://stripe.com/enterprise","slug":"q4-launch"}'`,
    );
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleScrollToProduct = (e: React.MouseEvent) => {
    e.preventDefault();
    const productEl = document.getElementById("product");
    if (productEl) {
      productEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative w-full min-h-[100dvh] sm:min-h-0 lg:min-h-screen flex flex-col justify-center items-center bg-[#FFFFFF] dark:bg-[#09090B] text-[#101828] dark:text-white pt-16 sm:pt-20 md:pt-22 pb-10 sm:pb-14 md:pb-18 overflow-hidden transition-colors duration-300"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
            /* --- 1. ENTRÉE INSTANTANÉE (0ms) DÈS LE CHARGEMENT DE LA PAGE --- */
            @keyframes heroWordReveal {
              0% {
                opacity: 0;
                transform: translateY(14px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-hero-word-reveal {
              opacity: 0;
              animation: heroWordReveal 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
              will-change: opacity, transform;
            }

            @keyframes heroFadeInDown {
              0% {
                opacity: 0;
                transform: translateY(-14px) scale(0.96);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .animate-hero-marquee-reveal {
              opacity: 0;
              animation: heroFadeInDown 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.05s forwards;
              will-change: opacity, transform;
            }

            @keyframes heroFadeInUp {
              0% {
                opacity: 0;
                transform: translateY(18px);
              }
              100% {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .animate-hero-desc-reveal {
              opacity: 0;
              animation: heroFadeInUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) 0.18s forwards;
              will-change: opacity, transform;
            }

            @keyframes heroPillReveal {
              0% {
                opacity: 0;
                transform: translateY(18px) scale(0.96);
              }
              70% {
                transform: translateY(-2px) scale(1.02);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .animate-hero-pill-1 {
              opacity: 0;
              animation: heroPillReveal 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.28s forwards;
              will-change: opacity, transform;
            }
            .animate-hero-pill-2 {
              opacity: 0;
              animation: heroPillReveal 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.36s forwards;
              will-change: opacity, transform;
            }
            .animate-hero-pill-3 {
              opacity: 0;
              animation: heroPillReveal 0.55s cubic-bezier(0.16, 1, 0.3, 1) 0.44s forwards;
              will-change: opacity, transform;
            }

            @keyframes heroShowcaseReveal {
              0% {
                opacity: 0;
                transform: translateY(45px) scale(0.98);
              }
              100% {
                opacity: 1;
                transform: translateY(0) scale(1);
              }
            }
            .animate-hero-showcase-reveal {
              opacity: 0;
              animation: heroShowcaseReveal 0.85s cubic-bezier(0.16, 1, 0.3, 1) 0.50s forwards;
              will-change: opacity, transform;
            }

            @media (prefers-reduced-motion: reduce) {
              .animate-hero-word-reveal,
              .animate-hero-marquee-reveal,
              .animate-hero-desc-reveal,
              .animate-hero-pill-1,
              .animate-hero-pill-2,
              .animate-hero-pill-3,
              .animate-hero-showcase-reveal {
                animation: none !important;
                opacity: 1 !important;
                transform: none !important;
              }
            }

            /* --- 2. MARQUEE & EMOJIS FLOTTANTS --- */
            @keyframes heroMarqueeTrack {
              0% { transform: translateX(0%); }
              100% { transform: translateX(-50%); }
            }
            .animate-hero-marquee {
              animation: heroMarqueeTrack 32s linear infinite;
              will-change: transform;
            }
            .animate-hero-marquee:hover {
              animation-play-state: paused;
            }

            @keyframes heroEmojiFloat1 {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-7px); }
            }
            @keyframes heroEmojiFloat2 {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(7px); }
            }
            @keyframes heroEmojiFloat3 {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-8px); }
            }
            @keyframes heroEmojiFloat4 {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(8px); }
            }

            .animate-hero-float-1 {
              animation: heroEmojiFloat1 7s ease-in-out infinite;
              will-change: transform;
            }
            .animate-hero-float-2 {
              animation: heroEmojiFloat2 9s ease-in-out infinite;
              will-change: transform;
            }
            .animate-hero-float-3 {
              animation: heroEmojiFloat3 11s ease-in-out infinite;
              will-change: transform;
            }
            .animate-hero-float-4 {
              animation: heroEmojiFloat4 8.5s ease-in-out infinite;
              will-change: transform;
            }
          `,
        }}
      />

      {/* Arrière-plan Emojis 3D Fluent Haute Définition : Cadré dans le premier écran visible (sans coupure) */}
      <div
        className="pointer-events-none select-none absolute inset-0 w-full h-full overflow-hidden z-0"
        aria-hidden="true"
      >
        {HERO_BACKGROUND_EMOJIS.map((item, idx) => (
          <div
            key={idx}
            className={`absolute flex items-center justify-center ${item.className} ${item.animation}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={item.src}
              alt={item.alt}
              className="w-full h-full object-contain pointer-events-none select-none transition-opacity duration-300 drop-shadow-[0_10px_20px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_12px_24px_rgba(0,0,0,0.50)] saturate-110 contrast-105"
              loading="eager"
              draggable={false}
            />
          </div>
        ))}
      </div>

      <div className="relative z-10 max-w-[1360px] w-full mx-auto px-4 sm:px-8 flex flex-col justify-center items-center text-center my-auto min-h-[calc(100dvh-5.5rem)] sm:min-h-0">
        {/* 1. Ruban Défilant Automatique des Trends */}
        <div className="hero-trend-marquee-wrap animate-hero-marquee-reveal relative w-full max-w-[1040px] overflow-hidden mb-3 sm:mb-5 md:mb-6">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-10 sm:w-28 bg-gradient-to-r from-[#FFFFFF] dark:from-[#09090B] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-10 sm:w-28 bg-gradient-to-l from-[#FFFFFF] dark:from-[#09090B] to-transparent z-10" />

          <div className="flex w-max animate-hero-marquee">
            {[...TREND_ITEMS, ...TREND_ITEMS].map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="shrink-0 px-1.5 py-1">
                  <Link
                    href={item.href}
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 sm:px-3.5 py-1 sm:py-1.5 text-[11.5px] sm:text-[12.5px] font-medium transition-transform duration-200 hover:scale-105 shadow-xs ${item.badgeClass}`}
                  >
                    <Icon className="w-3.5 h-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </div>
              );
            })}
          </div>
        </div>

        {/* 2. Bloc Texte Principal Entièrement Centré */}
        <div className="flex flex-col items-center text-center max-w-[980px] mx-auto mt-0 mb-4 sm:mb-6 md:mb-7">
          <h1 className="text-[34px] xs:text-[38px] sm:text-[48px] lg:text-[62px] font-normal tracking-[-0.035em] leading-[1.1] sm:leading-[1.04] text-[#000000] dark:text-white">
            {renderTypingText(titlePart1, 0)}{" "}
            <span className="text-[#667085] dark:text-zinc-400">
              {renderTypingText(titlePart2, titlePart1.split(" ").length)}
            </span>
          </h1>

          <p className="hero-fade-desc animate-hero-desc-reveal mt-5 sm:mt-7 text-[16px] sm:text-[18px] text-[#475467] dark:text-zinc-400 max-w-[740px] mx-auto leading-[1.6] sm:leading-[1.65]">
            LShorter unifies branded link shortening, programmable ISO Country
            &amp; Device edge routing,{" "}
            <strong className="font-semibold text-[#101828] dark:text-white">
              weighted A/B testing
            </strong>
            ,{" "}
            <strong className="font-semibold text-[#101828] dark:text-white">
              PathLock™ PIN &amp; URL cloaking
            </strong>
            , high-converting bio micro-sites, and cookie-free revenue
            attribution inside one workspace.
          </p>

          {/* Boutons d'actions Centrés */}
          <div className="flex flex-col items-center gap-3.5 w-full mt-6 sm:mt-7">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3.5 w-full sm:w-auto">
              <div className="hero-action-pill animate-hero-pill-1 will-change-transform w-full sm:w-auto flex justify-center">
                {isAuthenticated ? (
                  <Link
                    href="/dashboard"
                    style={{ color: "#FFFFFF" }}
                    onMouseEnter={handlePrimaryBtnEnter}
                    onMouseLeave={handlePrimaryBtnLeave}
                    className="w-full max-w-[320px] sm:max-w-none sm:w-56 inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#465FFF] hover:bg-[#3641F5] !text-white px-6 py-3.5 text-[15px] sm:text-[14px] font-semibold shadow-md will-change-transform cursor-pointer transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 !text-white shrink-0" />
                    <span className="!text-white font-medium">Dashboard</span>
                    <ArrowUpRight className="hero-cta-arrow w-4 h-4 !text-white will-change-transform" />
                  </Link>
                ) : (
                  <Link
                    href="/register"
                    style={{ color: "#FFFFFF" }}
                    onMouseEnter={handlePrimaryBtnEnter}
                    onMouseLeave={handlePrimaryBtnLeave}
                    className="w-full max-w-[320px] sm:max-w-none sm:w-56 inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#465FFF] hover:bg-[#3641F5] !text-white px-6 py-3.5 text-[15px] sm:text-[14px] font-semibold shadow-md will-change-transform cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-4 h-4 !text-white shrink-0" />
                    <span className="!text-white font-medium">Get started</span>
                    <ArrowUpRight className="hero-cta-arrow w-4 h-4 !text-white will-change-transform" />
                  </Link>
                )}
              </div>

              <div className="hero-action-pill animate-hero-pill-2 will-change-transform w-full sm:w-auto flex justify-center">
                <Link
                  href="#product"
                  onClick={handleScrollToProduct}
                  onMouseEnter={handleSecondaryBtnEnter}
                  onMouseLeave={handleSecondaryBtnLeave}
                  className="w-full max-w-[320px] sm:max-w-none sm:w-56 inline-flex items-center justify-center gap-2 rounded-[12px] bg-[#F2F4F7] dark:bg-white/10 text-[#101828] dark:text-white border border-[#D0D5DD] dark:border-white/15 px-6 py-3.5 text-[15px] sm:text-[14px] font-medium shadow-xs will-change-transform cursor-pointer hover:bg-white dark:hover:bg-white/15 transition-colors text-center"
                >
                  <span>Open live dashboard</span>
                </Link>
              </div>
            </div>

            {/* Commande SDK masquée sur Mobile */}
            <div className="hidden sm:flex hero-action-pill animate-hero-pill-3 will-change-transform w-full sm:w-auto justify-center">
              <button
                type="button"
                onClick={handleCopySdk}
                onMouseEnter={handleSdkBtnEnter}
                onMouseLeave={handleSdkBtnLeave}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-[12px] bg-[#F9FAFB] dark:bg-white/5 border border-[#E4E7EC] dark:border-white/10 px-4.5 py-2.5 text-[12px] font-mono text-[#475467] dark:text-zinc-300 will-change-transform cursor-pointer hover:border-[#465FFF] transition-colors"
              >
                <Terminal className="sdk-icon w-3.5 h-3.5 text-[#465FFF] shrink-0 will-change-transform" />
                <span className="truncate">
                  POST /v1/links • 11ms Edge API
                </span>
                {copiedPrompt ? (
                  <Check className="w-3.5 h-3.5 text-[#12B76A] shrink-0" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#98A2B3] shrink-0" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 3. Vitrine du Dashboard : Masquée sur Mobile (< sm) */}
        <div
          ref={showcaseRef}
          className="hidden sm:block animate-hero-showcase-reveal w-full max-w-[1240px] mx-auto relative sm:mt-2 md:mt-4 lg:mt-6 rounded-[16px] bg-[#FFFFFF] dark:bg-[#101828] border border-[#E4E7EC] dark:border-white/15 overflow-hidden shadow-[0_25px_60px_-15px_rgba(16,24,40,0.18),0_10px_30px_-10px_rgba(16,24,40,0.1),0_0_0_1px_rgba(16,24,40,0.04)] dark:shadow-[0_30px_70px_-15px_rgba(0,0,0,0.75),0_10px_30px_-10px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.08)] will-change-transform"
        >
          <div className="px-4 py-2.5 border-b border-[#E4E7EC] dark:border-white/10 bg-[#F9FAFB] dark:bg-[#1D2939] flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F04438]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#F79009]" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#12B76A]" />
              <div className="ml-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-[#101828] border border-[#E4E7EC] dark:border-white/10 text-[11px] font-mono text-[#475467] dark:text-zinc-300">
                <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" />
                https://lsho.cc
              </div>
            </div>
          </div>

          <div className="relative w-full bg-[#F9FAFB] dark:bg-[#101828]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/screenshots/dashboard/dashboardwithsidbare.png"
              alt="LShorter SaaS Dashboard Preview"
              className="w-full h-auto block"
              style={{ display: "block", width: "100%", height: "auto" }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection2;
