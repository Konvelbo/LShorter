"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import gsap from "gsap";
import {
  ArrowUpRight,
  Check,
  Copy,
  Terminal,
  Link2,
  QrCode,
  ShieldCheck,
  Split,
} from "lucide-react";

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

  const titlePart1 = "Every campaign, bio page, and API link.";
  const titlePart2 = "Engineered around ultra-fast short links.";

  // --- ANIMATION GSAP AU DÉMARRAGE DE LA PAGE (SANS SCROLL) ---
  useEffect(() => {
    if (!heroRef.current) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // 1. Positionnement initial : Titre masqué, description masquée, image masquée en bas
      gsap.set(".hero-char", { opacity: 0, y: 10 });
      gsap.set(".hero-fade-desc", { opacity: 0, y: 24 });
      gsap.set(".hero-action-pill", { opacity: 0, y: 20, scale: 0.96 });
      if (showcaseRef.current) {
        gsap.set(showcaseRef.current, { opacity: 0, y: 80, scale: 0.98 });
      }

      // 2. Positionnement initial des trends en "Stack" (empilés sur le premier à gauche)
      const pills = gsap.utils.toArray<HTMLElement>(".hero-trend-stack-item");
      if (pills.length > 0) {
        const firstLeft = pills[0].offsetLeft;
        pills.forEach((pill, idx) => {
          // Décalage en X vers la première pilule avec un léger décalage de pile
          const stackOffset = firstLeft - pill.offsetLeft + idx * 8;
          gsap.set(pill, { x: stackOffset, opacity: 0, scale: 0.94 });
        });
      }

      // 3. Animation d'écriture du gros titre (lettre par lettre)
      const charCount = titlePart1.length + titlePart2.length;
      const charStagger = 0.022;
      const typingDuration = charCount * charStagger + 0.2;

      tl.to(".hero-char", {
        opacity: 1,
        y: 0,
        duration: 0.2,
        stagger: charStagger,
        ease: "power1.out",
      });

      // 4. À 70% de la fin de l'écriture du titre : apparition synchronisée des éléments du haut
      // 70% du temps d'écriture
      const triggerTime = typingDuration * 0.7;

      // Déploiement en X des trends depuis leur stack vers leur position finale
      tl.to(
        pills,
        {
          x: 0,
          opacity: 1,
          scale: 1,
          duration: 0.85,
          stagger: 0.07,
          ease: "power3.out",
        },
        triggerTime,
      );

      // Apparition de la description
      tl.to(
        ".hero-fade-desc",
        {
          opacity: 1,
          y: 0,
          duration: 0.75,
          ease: "power3.out",
        },
        triggerTime + 0.1,
      );

      // Apparition des boutons d'actions et de la commande SDK
      tl.to(
        ".hero-action-pill",
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.65,
          stagger: 0.09,
          ease: "back.out(1.4)",
        },
        triggerTime + 0.15,
      );

      // 5. Après tout ça : l'image arrive depuis le bas avec transition en Y et opacité
      if (showcaseRef.current) {
        tl.to(
          showcaseRef.current,
          {
            opacity: 1,
            y: 0,
            scale: 1,
            duration: 1.1,
            ease: "power3.out",
          },
          "+=0.1",
        );
      }
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // --- ANIMATIONS HOVER FLUIDES VIA GSAP (ISOLÉES DE LA TIMELINE) ---
  const handleTrendEnter = (e: React.MouseEvent<HTMLElement>) => {
    const icon = e.currentTarget.querySelector(".trend-icon");
    gsap.to(e.currentTarget, {
      y: -3,
      scale: 1.04,
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });
    if (icon) {
      gsap.to(icon, {
        scale: 1.25,
        rotation: 8,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleTrendLeave = (e: React.MouseEvent<HTMLElement>) => {
    const icon = e.currentTarget.querySelector(".trend-icon");
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });
    if (icon) {
      gsap.to(icon, {
        scale: 1,
        rotation: 0,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handlePrimaryBtnEnter = (e: React.MouseEvent<HTMLElement>) => {
    const arrow = e.currentTarget.querySelector(".hero-cta-arrow");
    gsap.to(e.currentTarget, {
      y: -3,
      scale: 1.035,
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });
    if (arrow) {
      gsap.to(arrow, {
        x: 3,
        y: -3,
        scale: 1.15,
        duration: 0.25,
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
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });
    if (arrow) {
      gsap.to(arrow, {
        x: 0,
        y: 0,
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    }
  };

  const handleSecondaryBtnEnter = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, {
      y: -3,
      scale: 1.03,
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleSecondaryBtnLeave = (e: React.MouseEvent<HTMLElement>) => {
    gsap.to(e.currentTarget, {
      y: 0,
      scale: 1,
      duration: 0.25,
      ease: "power2.out",
      overwrite: "auto",
    });
  };

  const handleSdkBtnEnter = (e: React.MouseEvent<HTMLElement>) => {
    const icon = e.currentTarget.querySelector(".sdk-icon");
    gsap.to(e.currentTarget, {
      y: -2,
      scale: 1.025,
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto",
    });
    if (icon) {
      gsap.to(icon, {
        scale: 1.25,
        duration: 0.22,
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
      duration: 0.22,
      ease: "power2.out",
      overwrite: "auto",
    });
    if (icon) {
      gsap.to(icon, {
        scale: 1,
        duration: 0.22,
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
    const productEl = document.getElementById("product");
    if (productEl) {
      e.preventDefault();
      productEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      ref={heroRef}
      id="hero"
      className="relative w-full bg-[#FFFFFF] dark:bg-[#09090B] text-[#101828] dark:text-white pt-24 sm:pt-32 pb-16 md:pb-28 overflow-hidden transition-colors duration-300"
    >
      <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
        {/* 1. Trends Badges (Départ en Stack -> Déploiement en X) */}
        <div className="flex flex-wrap items-center gap-2.5 mb-10 sm:mb-14 min-h-[40px]">
          <div className="hero-trend-stack-item will-change-transform">
            <Link
              href="/docs/geo-routing"
              onMouseEnter={handleTrendEnter}
              onMouseLeave={handleTrendLeave}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#ECF3FF] dark:bg-[#465FFF]/20 border border-[#465FFF]/25 px-4 py-1.5 text-[12.5px] font-semibold text-[#465FFF] dark:text-[#7592FF] shadow-xs cursor-pointer will-change-transform"
            >
              <Link2 className="trend-icon w-3.5 h-3.5 will-change-transform" />
              <span>Smart Short Links &amp; Geo Routing</span>
            </Link>
          </div>

          <div className="hero-trend-stack-item will-change-transform">
            <Link
              href="/docs/ab-testing-routing"
              onMouseEnter={handleTrendEnter}
              onMouseLeave={handleTrendLeave}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F4F7] dark:bg-white/5 border border-[#E4E7EC] dark:border-white/10 px-3.5 py-1.5 text-[12.5px] font-medium text-[#344054] dark:text-zinc-300 shadow-xs cursor-pointer will-change-transform"
            >
              <Split className="trend-icon w-3.5 h-3.5 text-[#465FFF] will-change-transform" />
              <span>Weighted A/B Testing</span>
            </Link>
          </div>

          <div className="hero-trend-stack-item will-change-transform">
            <Link
              href="/docs/pin-protection"
              onMouseEnter={handleTrendEnter}
              onMouseLeave={handleTrendLeave}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F4F7] dark:bg-white/5 border border-[#E4E7EC] dark:border-white/10 px-3.5 py-1.5 text-[12.5px] font-medium text-[#344054] dark:text-zinc-300 shadow-xs cursor-pointer will-change-transform"
            >
              <ShieldCheck className="trend-icon w-3.5 h-3.5 text-[#12B76A] will-change-transform" />
              <span>PathLock™ PIN &amp; Cloaking</span>
            </Link>
          </div>

          <div className="hero-trend-stack-item will-change-transform">
            <Link
              href="/docs/dynamic-qr-codes"
              onMouseEnter={handleTrendEnter}
              onMouseLeave={handleTrendLeave}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F4F7] dark:bg-white/5 border border-[#E4E7EC] dark:border-white/10 px-3.5 py-1.5 text-[12.5px] font-medium text-[#344054] dark:text-zinc-300 shadow-xs cursor-pointer will-change-transform"
            >
              <QrCode className="trend-icon w-3.5 h-3.5 text-[#12B76A] will-change-transform" />
              <span>Bio Links &amp; Dynamic QR</span>
            </Link>
          </div>

          <div className="hero-trend-stack-item will-change-transform">
            <Link
              href="/docs/sdk-quickstart"
              onMouseEnter={handleTrendEnter}
              onMouseLeave={handleTrendLeave}
              className="inline-flex items-center gap-1.5 rounded-full bg-[#F2F4F7] dark:bg-white/5 border border-[#E4E7EC] dark:border-white/10 px-3.5 py-1.5 text-[12.5px] font-medium text-[#344054] dark:text-zinc-300 shadow-xs cursor-pointer will-change-transform"
            >
              <Terminal className="trend-icon w-3.5 h-3.5 text-[#F79009] will-change-transform" />
              <span>Developer SDK &amp; Webhooks</span>
            </Link>
          </div>
        </div>

        {/* 2. Bloc Contenu (Textes agrandis & Grand espacement avant l'image) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-end mb-16 sm:mb-24">
          <div className="lg:col-span-8">
            {/* Grand titre avec animation d'écriture lettre par lettre */}
            <h1 className="text-[36px] sm:text-[54px] lg:text-[64px] font-normal tracking-[-0.035em] leading-[1.05] text-[#000000] dark:text-white">
              {titlePart1.split("").map((char, index) => (
                <span
                  key={`p1-${index}`}
                  className="hero-char inline-block will-change-transform"
                >
                  {char === " " ? "\u00A0" : char}
                </span>
              ))}{" "}
              <span className="text-[#667085] dark:text-zinc-400">
                {titlePart2.split("").map((char, index) => (
                  <span
                    key={`p2-${index}`}
                    className="hero-char inline-block will-change-transform"
                  >
                    {char === " " ? "\u00A0" : char}
                  </span>
                ))}
              </span>
            </h1>

            {/* Description plus grande et aérée */}
            <p className="hero-fade-desc mt-6 sm:mt-9 text-[17px] sm:text-[19px] text-[#475467] dark:text-zinc-400 max-w-[760px] leading-[1.7]">
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
          </div>

          {/* Boutons d'actions et pilule SDK */}
          <div className="lg:col-span-4 flex flex-col lg:items-end justify-end gap-4 w-full">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto">
              <div className="hero-action-pill will-change-transform">
                <Link
                  href={isAuthenticated ? "/dashboard" : "/register"}
                  style={{ color: "#FFFFFF" }}
                  onMouseEnter={handlePrimaryBtnEnter}
                  onMouseLeave={handlePrimaryBtnLeave}
                  className="inline-flex items-center justify-between sm:justify-center sm:w-56 gap-2.5 rounded-full bg-[#465FFF] !text-white pl-6 pr-2.5 py-3.5 sm:py-3 text-[14.5px] font-semibold shadow-md will-change-transform cursor-pointer"
                >
                  <span className="!text-white">
                    {isAuthenticated
                      ? "Go in the dashboard"
                      : "Get started free"}
                  </span>
                  <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <ArrowUpRight className="hero-cta-arrow w-4 h-4 !text-white will-change-transform" />
                  </span>
                </Link>
              </div>

              <div className="hero-action-pill will-change-transform">
                <Link
                  href="#product"
                  onClick={handleScrollToProduct}
                  onMouseEnter={handleSecondaryBtnEnter}
                  onMouseLeave={handleSecondaryBtnLeave}
                  className="inline-flex items-center justify-center sm:w-56 gap-2 rounded-full bg-[#F2F4F7] dark:bg-white/10 text-[#101828] dark:text-white border border-[#D0D5DD] dark:border-white/15 px-5 py-3.5 sm:py-3 text-[14.5px] font-medium shadow-xs will-change-transform cursor-pointer"
                >
                  <span>Open live dashboard</span>
                </Link>
              </div>
            </div>

            <div className="hero-action-pill will-change-transform w-full sm:w-auto">
              <button
                type="button"
                onClick={handleCopySdk}
                onMouseEnter={handleSdkBtnEnter}
                onMouseLeave={handleSdkBtnLeave}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#F9FAFB] dark:bg-white/5 border border-[#E4E7EC] dark:border-white/10 px-4.5 py-3 sm:py-2.5 text-[12.5px] font-mono text-[#475467] dark:text-zinc-300 will-change-transform cursor-pointer"
              >
                <Terminal className="sdk-icon w-3.5 h-3.5 text-[#465FFF] shrink-0 will-change-transform" />
                <span className="truncate">
                  POST /v1/links • 4.2ms Edge API
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

        {/* 3. Image Frame : Apparaît en dernier en quittant le bas (Y + Opacité) */}
        <div
          ref={showcaseRef}
          className="relative rounded-[20px] sm:rounded-[24px] p-2.5 sm:p-6 md:p-7 overflow-hidden border border-[#E4E7EC] dark:border-white/15 shadow-[0_30px_90px_rgba(16,24,40,0.12)] will-change-transform"
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

          <div className="relative z-10 rounded-[14px] sm:rounded-[18px] bg-[#FFFFFF] dark:bg-[#101828] border border-[#E4E7EC] dark:border-white/15 overflow-hidden shadow-2xl">
            <div className="px-3.5 sm:px-4 py-2 sm:py-2.5 border-b border-[#E4E7EC] dark:border-white/10 bg-[#F9FAFB] dark:bg-[#1D2939] flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#F04438]" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#F79009]" />
                <span className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-[#12B76A]" />
                <div className="ml-2 sm:ml-3 flex items-center gap-2 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-md bg-white dark:bg-[#101828] border border-[#E4E7EC] dark:border-white/10 text-[11px] sm:text-[11.5px] font-mono text-[#475467] dark:text-zinc-300">
                  <span className="w-2 h-2 rounded-full bg-[#12B76A]" />
                  https://lshorter.cc
                </div>
              </div>
              <span className="sm:hidden text-[10px] font-mono text-zinc-400">
                ↔ Glisser
              </span>
            </div>

            {/* Dashboard affiché sur TOUTE sa hauteur naturelle */}
            <div className="relative w-full overflow-x-auto overscroll-x-contain no-scrollbar bg-[#F9FAFB] dark:bg-[#101828]">
              <div className="min-w-[650px] lg:min-w-0 w-full h-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/marketing-FCI/real_dashboard_overview.png"
                  alt="LShorter SaaS Dashboard Preview"
                  className="w-full h-auto block object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection2;
