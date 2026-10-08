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

  const titlePart1 = "Smart link infrastructure for modern marketers.";
  const titlePart2 = "Ultra-fast programmable APIs for developers.";

  // Rendu par mot préservant la compatibilité avec Google Traduction et évitant la coupure mobile
  const renderTypingText = (text: string) => {
    return text.split(" ").map((word, wordIdx) => (
      <span
        key={wordIdx}
        className="hero-word inline-block whitespace-nowrap mr-[0.26em] will-change-transform"
      >
        {word}
      </span>
    ));
  };

  // --- ANIMATION GSAP AU DÉMARRAGE DE LA PAGE ---
  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1. Masquage initial
      gsap.set(".hero-word", { opacity: 0, y: 14 });
      gsap.set(".hero-trend-marquee-wrap", { opacity: 0, y: -14, scale: 0.96 });
      gsap.set(".hero-fade-desc", { opacity: 0, y: 18 });
      gsap.set(".hero-action-pill", { opacity: 0, y: 18, scale: 0.96 });
      if (showcaseRef.current) {
        gsap.set(showcaseRef.current, { opacity: 0, y: 70, scale: 0.98 });
      }

      // 2. Révélation du titre mot par mot (fluide et compatible avec Chrome Translate)
      tl.to(".hero-word", {
        opacity: 1,
        y: 0,
        duration: 0.35,
        stagger: 0.035,
        ease: "power2.out",
      });

      tl.addLabel("revealElements", "-=0.55");

      // Apparition du ruban défilant
      tl.to(
        ".hero-trend-marquee-wrap",
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.7,
          ease: "power3.out",
          clearProps: "transform",
        },
        "revealElements",
      );

      // Apparition de la description
      tl.to(
        ".hero-fade-desc",
        {
          opacity: 1,
          y: 0,
          duration: 0.65,
          ease: "power3.out",
          clearProps: "transform",
        },
        "revealElements+=0.08",
      );

      // Apparition des boutons
      tl.to(
        ".hero-action-pill",
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.6,
          stagger: 0.08,
          ease: "back.out(1.4)",
          clearProps: "opacity,transform",
        },
        "revealElements+=0.14",
      );

      // 3. Montée de la vitrine (sur desktop uniquement)
      if (showcaseRef.current) {
        tl.to(
          showcaseRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1,
            ease: "power3.out",
            clearProps: "opacity,transform",
          },
          "+=0.08",
        );
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

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
      className="relative w-full min-h-[100dvh] sm:min-h-0 lg:min-h-screen flex flex-col justify-center items-center bg-[#FFFFFF] dark:bg-[#09090B] text-[#101828] dark:text-white pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-20 md:pb-28 overflow-hidden transition-colors duration-300"
    >
      <style
        dangerouslySetInnerHTML={{
          __html: `
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
          `,
        }}
      />

      <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-8 flex-1 flex flex-col justify-center items-center">
        {/* 1. Ruban Défilant Automatique des Trends */}
        <div className="hero-trend-marquee-wrap relative w-full max-w-[1040px] overflow-hidden mb-6 sm:mb-12">
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
        <div className="flex flex-col items-center text-center max-w-[980px] mx-auto my-auto sm:my-0 sm:mb-16 md:mb-20">
          <h1 className="text-[34px] xs:text-[38px] sm:text-[48px] lg:text-[62px] font-normal tracking-[-0.035em] leading-[1.1] sm:leading-[1.04] text-[#000000] dark:text-white">
            {renderTypingText(titlePart1)}{" "}
            <span className="text-[#667085] dark:text-zinc-400">
              {renderTypingText(titlePart2)}
            </span>
          </h1>

          <p className="hero-fade-desc mt-5 sm:mt-7 text-[16px] sm:text-[18px] text-[#475467] dark:text-zinc-400 max-w-[740px] mx-auto leading-[1.6] sm:leading-[1.65]">
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
          <div className="flex flex-col items-center gap-3.5 w-full mt-8 sm:mt-10">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3.5 w-full sm:w-auto">
              <div className="hero-action-pill will-change-transform w-full sm:w-auto flex justify-center">
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

              <div className="hero-action-pill will-change-transform w-full sm:w-auto flex justify-center">
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
            <div className="hidden sm:flex hero-action-pill will-change-transform w-full sm:w-auto justify-center">
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
          className="hidden sm:block w-full max-w-[1240px] mx-auto relative rounded-[22px] p-5 md:p-6 overflow-hidden border border-[#E4E7EC] dark:border-white/15 shadow-[0_20px_60px_rgba(16,24,40,0.12)] will-change-transform"
          style={{
            background:
              "linear-gradient(135deg, #1F2A38 0%, #344960 35%, #5C768D 68%, #263547 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.15) 0px, rgba(255,255,255,0.02) 10px, rgba(0,0,0,0.24) 20px)",
            }}
          />

          <div className="relative z-10 rounded-[16px] bg-[#FFFFFF] dark:bg-[#101828] border border-[#E4E7EC] dark:border-white/15 overflow-hidden shadow-xl">
            <div className="px-4 py-2.5 border-b border-[#E4E7EC] dark:border-white/10 bg-[#F9FAFB] dark:bg-[#1D2939] flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F04438]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#F79009]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#12B76A]" />
                <div className="ml-3 flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-white dark:bg-[#101828] border border-[#E4E7EC] dark:border-white/10 text-[11px] font-mono text-[#475467] dark:text-zinc-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A]" />
                  https://lshorter.cc
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
      </div>
    </section>
  );
}

export default HeroSection2;
