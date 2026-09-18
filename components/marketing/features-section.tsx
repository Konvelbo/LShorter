"use client";

import React, { useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowLeft } from "lucide-react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

interface FeatureItem {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  side: "left" | "right";
  docSlug: string;
}

const features: FeatureItem[] = [
  {
    id: 1,
    title: "Link Shortening",
    subtitle: "Instant Edge Speed",
    description:
      "Create clean, ultra-fast, and shareable short links in seconds. Your redirects execute in under 15ms across our global Edge network.",
    image: "/marketing-FCI/cosmos_1739739224.jpeg",
    side: "left",
    docSlug: "sdk-quickstart",
  },
  {
    id: 2,
    title: "Percentage-Based Routing — A/B Testing",
    subtitle: "Conversion Optimization",
    description:
      "Distribute clicks between multiple destination URLs by custom percentages. Ideal for landing page comparison and marketing experiments.",
    image: "/marketing-FCI/cosmos_1746304416.jpeg",
    side: "right",
    docSlug: "ab-testing-routing",
  },
  {
    id: 3,
    title: "Access Code & PIN Protection",
    subtitle: "Security & Privacy",
    description:
      "Secure your links with an access PIN code before redirecting. Ensure only authorized visitors access sensitive or exclusive content.",
    image: "/marketing-FCI/cosmos_1796978290.jpeg",
    side: "left",
    docSlug: "pin-protection",
  },
  {
    id: 4,
    title: "Click Limits + Forward URL",
    subtitle: "Automated Volume Control",
    description:
      "Set a maximum click threshold and automatically redirect visitors to a fallback URL once reached. Never lose a visitor again.",
    image: "/marketing-FCI/cosmos_2136974997.jpeg",
    side: "right",
    docSlug: "click-limits-and-expiration",
  },
  {
    id: 5,
    title: "URL Masking",
    subtitle: "Discretion & Brand Shield",
    description:
      "Conceal the actual destination URL to protect sensitive affiliate parameters and keep campaign integrity against scrapers.",
    image: "/marketing-FCI/cosmos_227768569.jpeg",
    side: "left",
    docSlug: "url-masking",
  },
  {
    id: 6,
    title: "Dynamic QR Codes",
    subtitle: "Vector Generation & Customization",
    description:
      "Instantly generate and customize QR codes for every short link. Download in crisp high resolution ready for print and packaging.",
    image: "/marketing-FCI/cosmos_302657415.jpeg",
    side: "right",
    docSlug: "dynamic-qr-codes",
  },
  {
    id: 7,
    title: "Social Sharing & Open Graph",
    subtitle: "Automated Rich Previews",
    description:
      "Share links on LinkedIn, WhatsApp, X (Twitter), Discord, and Telegram with customized Open Graph cards that render immediately.",
    image: "/marketing-FCI/cosmos_549824580.jpeg",
    side: "left",
    docSlug: "social-sharing-opengraph",
  },
  {
    id: 8,
    title: "Developer API & SDK",
    subtitle: "Native Automation",
    description:
      "Integrate every capability directly into your workflows and applications using our documented, high-throughput REST API.",
    image: "/marketing-FCI/cosmos_938538719.jpeg",
    side: "right",
    docSlug: "webhooks-and-events",
  },
];

interface MobileCard {
  id: string;
  type: "orange" | "purple" | "white" | "blue" | "dark";
  category: string;
  title: string;
  definition: string;
  docSlug: string;
  image?: string;
  badge?: string;
}

const mobileRow1: MobileCard[] = [
  {
    id: "m-1",
    type: "orange",
    category: "01. REDIRECTION ULTRA-RAPIDE",
    title: "Sub-15ms Edge Speed",
    definition: "Exécutez vos redirections en moins de 15ms grâce aux 310+ serveurs Edge Cloudflare mondiaux.",
    docSlug: "sdk-quickstart",
  },
  {
    id: "m-2",
    type: "purple",
    category: "02. URL MASKING",
    title: "Brand Shield & Discrétion",
    definition: "Masquez l'URL de destination pour protéger vos commissions d'affiliation et vos paramètres UTM.",
    image: "/marketing-FCI/cosmos_227768569.jpeg",
    badge: "SHIELD / MASK",
    docSlug: "url-masking",
  },
  {
    id: "m-3",
    type: "white",
    category: "03. A/B TESTING DYNAMIQUE",
    title: "Répartition par %",
    definition: "Répartissez vos visiteurs entre plusieurs pages cibles selon des pourcentages pour optimiser vos ventes.",
    docSlug: "ab-testing-routing",
  },
  {
    id: "m-4",
    type: "blue",
    category: "04. QR CODES VECTORIELS",
    title: "Génération SVG HD",
    definition: "Générez des QR codes vectoriels haute définition personnalisés, téléchargeables instantanément pour packaging.",
    docSlug: "dynamic-qr-codes",
  },
];

const mobileRow2: MobileCard[] = [
  {
    id: "m-5",
    type: "white",
    category: "05. SÉCURITÉ & PROTECTION",
    title: "Code d'Accès & PIN",
    definition: "Verrouillez l'accès à vos liens confidentiels avec un code PIN avant toute redirection.",
    docSlug: "pin-protection",
  },
  {
    id: "m-6",
    type: "dark",
    category: "06. OPEN GRAPH",
    title: "Cartes Riches Auto",
    definition: "Personnalisez les vignettes de partage pour afficher de riches aperçus sur WhatsApp, LinkedIn, X et Discord.",
    image: "/marketing-FCI/cosmos_549824580.jpeg",
    badge: "RICH / PREVIEW",
    docSlug: "social-sharing-opengraph",
  },
  {
    id: "m-7",
    type: "orange",
    category: "07. CONTRÔLE DE FLUX",
    title: "Plafond & Fallback",
    definition: "Fixez un seuil maximal de clics et redirigez automatiquement vers une URL de secours dès qu'il est atteint.",
    docSlug: "click-limits-and-expiration",
  },
  {
    id: "m-8",
    type: "purple",
    category: "08. REST API & SDK",
    title: "Webhooks Haute Vitesse",
    definition: "Intégrez toutes les fonctionnalités à vos applications avec notre API REST haute cadence et SDK TypeScript.",
    image: "/marketing-FCI/cosmos_938538719.jpeg",
    badge: "API / DEV",
    docSlug: "webhooks-and-events",
  },
];

function MobileFeatureCard({ card }: { card: MobileCard }) {
  if (card.type === "orange" || card.type === "blue") {
    return (
      <Link
        href={`/docs/${card.docSlug}`}
        className="w-[270px] sm:w-[300px] h-[190px] sm:h-[200px] rounded-[24px] bg-brand text-white p-5 flex flex-col items-center justify-between text-center shadow-lg border border-brand-subtle shrink-0 transition-transform active:scale-95 group/mcard cursor-pointer select-none"
      >
        <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-white/90">
          {card.category}
        </span>
        <h4 className="text-lg sm:text-xl font-bold text-white leading-tight my-1 text-center">
          {card.title}
        </h4>
        <p className="text-[11.5px] sm:text-[12px] text-white/90 leading-relaxed font-normal text-center line-clamp-3">
          {card.definition}
        </p>
      </Link>
    );
  }

  if (card.type === "white") {
    return (
      <Link
        href={`/docs/${card.docSlug}`}
        className="w-[270px] sm:w-[300px] h-[190px] sm:h-[200px] rounded-[24px] bg-[#FFFDF9] dark:bg-[#131317] border border-[#E7DFD5] dark:border-white/10 p-5 flex flex-col items-center justify-between text-center shadow-lg shrink-0 transition-transform active:scale-95 group/mcard cursor-pointer select-none"
      >
        <span className="text-[9.5px] font-mono font-bold uppercase tracking-wider text-brand">
          {card.category}
        </span>
        <h4 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white leading-tight my-1 text-center">
          {card.title}
        </h4>
        <p className="text-[11.5px] sm:text-[12px] text-neutral-600 dark:text-neutral-400 leading-relaxed font-normal text-center line-clamp-3">
          {card.definition}
        </p>
      </Link>
    );
  }

  if (card.type === "purple") {
    return (
      <Link
        href={`/docs/${card.docSlug}`}
        className="w-[270px] sm:w-[300px] h-[190px] sm:h-[200px] rounded-[24px] bg-gradient-to-br from-[#6D28D9] via-[#5B21B6] to-[#3B0764] dark:from-[#4C1D95] dark:via-[#3B0764] dark:to-[#1E1B4B] text-white p-5 flex flex-col items-center justify-between text-center shadow-lg border border-white/15 shrink-0 relative overflow-hidden transition-transform active:scale-95 group/mcard cursor-pointer select-none"
      >
        <div className="flex items-center justify-center z-10">
          <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[8.5px] font-mono font-bold uppercase tracking-wider text-white">
            {card.badge}
          </span>
        </div>
        <h4 className="text-base sm:text-lg font-bold text-white leading-tight z-10 my-1 text-center">
          {card.title}
        </h4>
        <p className="text-[11.5px] sm:text-[12px] text-purple-100 leading-relaxed z-10 font-normal text-center line-clamp-3">
          {card.definition}
        </p>
        {card.image && (
          <div className="absolute right-2 bottom-2 w-16 h-16 rounded-xl overflow-hidden opacity-25 border border-white/20 pointer-events-none">
            <Image
              src={card.image}
              alt={card.title}
              fill
              className="object-cover"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          </div>
        )}
      </Link>
    );
  }

  // Dark metallic card
  return (
    <Link
      href={`/docs/${card.docSlug}`}
      className="w-[270px] sm:w-[300px] h-[190px] sm:h-[200px] rounded-[24px] bg-gradient-to-br from-[#1F1F24] to-[#0A0A0C] text-white p-5 flex flex-col items-center justify-between text-center shadow-lg border border-white/15 shrink-0 relative overflow-hidden transition-transform active:scale-95 group/mcard cursor-pointer select-none"
    >
      <div className="flex items-center justify-center z-10">
        <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-[8.5px] font-mono font-bold uppercase tracking-wider text-white">
          {card.badge}
        </span>
      </div>
      <h4 className="text-base sm:text-lg font-bold text-white leading-tight z-10 my-1 text-center">
        {card.title}
      </h4>
      <p className="text-[11.5px] sm:text-[12px] text-neutral-300 leading-relaxed z-10 font-normal text-center line-clamp-3">
        {card.definition}
      </p>
      {card.image && (
        <div className="absolute right-2 bottom-2 w-16 h-16 rounded-xl overflow-hidden opacity-25 border border-white/20 pointer-events-none">
          <Image
            src={card.image}
            alt={card.title}
            fill
            className="object-cover"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>
      )}
    </Link>
  );
}

/**
 * Double-scroll row: Seamless continuous auto-scroll + interactive manual touch-swipe.
 */
function AutoManualScrollRow({
  cards,
  direction = "left",
  speed = 0.45,
}: {
  cards: MobileCard[];
  direction?: "left" | "right";
  speed?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isInteracting = useRef(false);
  const resumeTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    // Initialize initial scroll offset for reverse direction
    if (direction === "right" && el.scrollLeft === 0) {
      el.scrollLeft = el.scrollWidth / 2;
    }

    let animId: number;

    const scrollLoop = () => {
      if (!isInteracting.current && el) {
        if (direction === "left") {
          el.scrollLeft += speed;
          if (el.scrollLeft >= el.scrollWidth / 2) {
            el.scrollLeft = 0;
          }
        } else {
          el.scrollLeft -= speed;
          if (el.scrollLeft <= 0) {
            el.scrollLeft = el.scrollWidth / 2;
          }
        }
      }
      animId = requestAnimationFrame(scrollLoop);
    };

    animId = requestAnimationFrame(scrollLoop);

    return () => {
      cancelAnimationFrame(animId);
      if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    };
  }, [direction, speed]);

  const handleStart = () => {
    isInteracting.current = true;
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
  };

  const handleEnd = () => {
    if (resumeTimeout.current) clearTimeout(resumeTimeout.current);
    resumeTimeout.current = setTimeout(() => {
      isInteracting.current = false;
    }, 1200);
  };

  return (
    <div
      ref={containerRef}
      onTouchStart={handleStart}
      onTouchEnd={handleEnd}
      onMouseDown={handleStart}
      onMouseUp={handleEnd}
      onMouseEnter={handleStart}
      onMouseLeave={handleEnd}
      className="flex overflow-x-auto scrollbar-none gap-3.5 px-4 pb-1.5 touch-pan-x cursor-grab active:cursor-grabbing select-none"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      {[...cards, ...cards].map((card, i) => (
        <MobileFeatureCard key={`${card.id}-${direction}-${i}`} card={card} />
      ))}
    </div>
  );
}

export function FeaturesSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    gsap.registerPlugin(ScrollTrigger);

    const header = document.querySelector(".features-header");
    if (header) {
      gsap.fromTo(
        header,
        { opacity: 0, y: 25 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power2.out",
          scrollTrigger: {
            trigger: header,
            start: "top 88%",
            end: "bottom 12%",
            toggleActions: "play reverse play reverse",
          },
        },
      );
    }

    const cards = document.querySelectorAll(".feature-row-item");

    cards.forEach((card) => {
      const side = card.getAttribute("data-side");

      // Slide-in + subtle float on scroll with full reverse on scroll up
      gsap.fromTo(
        card,
        {
          opacity: 0,
          x: side === "left" ? -40 : 40,
          y: 20,
        },
        {
          opacity: 1,
          x: 0,
          y: 0,
          duration: 0.75,
          ease: "power2.out",
          scrollTrigger: {
            trigger: card,
            start: "top 85%",
            end: "bottom 15%",
            toggleActions: "play reverse play reverse",
          },
        },
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (
          st.trigger &&
          ((st.trigger as HTMLElement).classList?.contains(
            "feature-row-item",
          ) ||
            (st.trigger as HTMLElement).classList?.contains("features-header"))
        ) {
          st.kill();
        }
      });
    };
  }, []);

  return (
    <section
      id="features"
      className="relative z-0 pt-16 sm:pt-24 pb-14 sm:pb-20 overflow-hidden bg-[#FAF7F2] dark:bg-[#09090b] transition-colors"
    >
      {/* Center dividing guide line for desktop */}
      <div className="hidden lg:block absolute left-1/2 top-28 bottom-0 w-px bg-gradient-to-b from-transparent via-[#E7DFD5] to-[#E7DFD5] dark:via-white/[0.08] dark:to-white/[0.08] -translate-x-1/2 pointer-events-none" />

      <div ref={containerRef} className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Header */}
        <div className="features-header text-center max-w-2xl mx-auto mb-8 sm:mb-12 flex flex-col items-center justify-center">
          <span className="text-[11px] font-mono text-brand uppercase tracking-widest font-semibold block mb-2">
            03. Core Capabilities
          </span>
          <h2 className="text-xl sm:text-[24px] font-bold tracking-tight text-neutral-900 dark:text-white leading-snug text-center">
            Comprehensive Features, Zero Compromise
          </h2>
          <p className="mt-1.5 text-xs sm:text-[13.5px] text-neutral-600 dark:text-neutral-400 font-normal text-center max-w-xl">
            Every tool is engineered with precision to empower modern creators,
            growth marketers, and engineering teams.
          </p>
        </div>

        {/* ══ MOBILE FORMAT (lg:hidden): Dual-Row Combined Infinite Auto-Scroll & Manual Touch Swipe ══ */}
        <div className="block lg:hidden -mx-4 sm:mx-0 py-2 space-y-4">
          {/* Subtle swipe & auto indicator */}
          <div className="flex items-center justify-center gap-1.5 text-[11px] font-mono text-neutral-500 dark:text-neutral-400 px-4 mb-1 text-center">
            <span>← Glissez manuellement ou laissez défiler →</span>
          </div>

          {/* Row 1: Right-to-Left Auto + Manual Swipe */}
          <AutoManualScrollRow cards={mobileRow1} direction="left" speed={0.45} />

          {/* Row 2: Left-to-Right Auto + Manual Swipe */}
          <AutoManualScrollRow cards={mobileRow2} direction="right" speed={0.45} />
        </div>

        {/* ══ DESKTOP FORMAT (hidden lg:block): Alternating Detailed Features List ══ */}
        <div className="hidden lg:flex flex-col">
          {features.map((feat, idx) => {
            const isLeft = feat.side === "left";
            const isLast = idx === features.length - 1;

            return (
              <div
                key={feat.id}
                data-side={feat.side}
                className={`feature-row-item w-full flex flex-col ${
                  isLeft ? "lg:items-start" : "lg:items-end"
                } ${!isLast ? "mb-6 sm:mb-10" : ""}`}
              >
                <Link
                  href={`/docs/${feat.docSlug}`}
                  className="group w-full lg:max-w-[48%] rounded-2xl bg-[#FFFDF9] dark:bg-[#121216] border border-[#E7DFD5] dark:border-white/10 shadow-xl overflow-hidden p-3.5 sm:p-5 flex flex-col sm:flex-row gap-3.5 sm:gap-5 items-center justify-between transition-all duration-300 ease-out hover:scale-[1.03] active:scale-[0.99] hover:shadow-2xl hover:border-brand-subtle dark:hover:border-white/30 cursor-pointer"
                  title={`View details: ${feat.title}`}
                >
                  {/* Left-oriented layout */}
                  {isLeft ? (
                    <>
                      {/* Image Preview */}
                      <div className="w-full sm:w-[48%] h-36 sm:h-44 rounded-xl overflow-hidden bg-[#F2ECE4] dark:bg-black/40 relative shrink-0 border border-[#E7DFD5] dark:border-white/10">
                        <Image
                          src={feat.image}
                          alt={feat.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>

                      {/* Text Content + Right Arrow */}
                      <div className="flex-1 flex flex-col justify-between h-full space-y-2 w-full">
                        <div>
                          <span className="text-[10px] font-mono text-brand font-semibold block mb-0.5">
                            0{feat.id}. {feat.subtitle}
                          </span>
                          <h3 className="text-sm sm:text-base font-medium text-neutral-900 dark:text-white leading-snug group-hover:text-brand transition-colors">
                            {feat.title}
                          </h3>
                          <p className="text-[11.5px] sm:text-[12.5px] text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed font-normal">
                            {feat.description}
                          </p>
                        </div>

                        <div className="pt-1 flex justify-end">
                          <span
                            className="w-7 h-7 rounded-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 group-hover:border-brand group-hover:bg-brand flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:text-white shadow-sm transition-all duration-300 group-hover:scale-110 active:scale-95"
                            aria-hidden="true"
                          >
                            <ArrowRight className="w-3.5 h-3.5 text-brand group-hover:text-white transition-transform group-hover:translate-x-0.5 duration-300" />
                          </span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Text Content + Left Arrow */}
                      <div className="order-2 sm:order-1 flex-1 flex flex-col justify-between h-full space-y-2 w-full">
                        <div>
                          <span className="text-[10px] font-mono text-brand font-semibold block mb-0.5">
                            0{feat.id}. {feat.subtitle}
                          </span>
                          <h3 className="text-sm sm:text-base font-medium text-neutral-900 dark:text-white leading-snug group-hover:text-brand transition-colors">
                            {feat.title}
                          </h3>
                          <p className="text-[11.5px] sm:text-[12.5px] text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed font-normal">
                            {feat.description}
                          </p>
                        </div>

                        <div className="pt-1 flex justify-start">
                          <span
                            className="w-7 h-7 rounded-full bg-white dark:bg-white/5 border border-neutral-200 dark:border-white/10 group-hover:border-brand group-hover:bg-brand flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:text-white shadow-sm transition-all duration-300 group-hover:scale-110 active:scale-95"
                            aria-hidden="true"
                          >
                            <ArrowLeft className="w-3.5 h-3.5 text-brand group-hover:text-white transition-transform group-hover:-translate-x-0.5 duration-300" />
                          </span>
                        </div>
                      </div>

                      {/* Image Preview */}
                      <div className="order-1 sm:order-2 w-full sm:w-[48%] h-36 sm:h-44 rounded-xl overflow-hidden bg-[#F2ECE4] dark:bg-black/40 relative shrink-0 border border-[#E7DFD5] dark:border-white/10">
                        <Image
                          src={feat.image}
                          alt={feat.title}
                          fill
                          sizes="(max-width: 768px) 100vw, 400px"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = "none";
                          }}
                        />
                      </div>
                    </>
                  )}
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
