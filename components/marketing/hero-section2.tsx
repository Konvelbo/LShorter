"use client";

import React, { useRef } from "react";
import { HeroShortener } from "@/components/marketing/hero-shortener";
import { HeroBackground } from "@/components/ui/tailwind-css-background-snippet";
import { FlipWords } from "@/components/ui/flip-words";
import { VariableProximity } from "@/components/ui/VariableProximity";
import { BrandScroller } from "@/components/ui/brand-scoller";
import { SectionRailFrame } from "@/components/marketing/swiss-frame";
import { useI18n } from "@/components/providers/i18n-provider";

const HERO_FLIP_WORDS = {
  en: ["control.", "manage.", "protect.", "monetize."],
  fr: ["contrôlez.", "gérez.", "protégez.", "monétisez."],
};

export function HeroSection() {
  const proximityContainerRef = useRef<HTMLDivElement | null>(null);
  const { locale, isFr, tr } = useI18n();

  return (
    <section
      id="hero"
      className="relative isolate w-full overflow-x-clip pt-[74px] sm:pt-[86px] flex flex-col"
    >
      {/* Background Pattern from tailwind-css-background-snippet */}
      <HeroBackground />

      {/* Fluid 2D-responsive Hero Stage — immediately visible on SSR first paint (zero opacity:0 flash behind navbar) */}
      <SectionRailFrame className="relative z-30 min-h-[calc(100svh-74px)] sm:min-h-[calc(100svh-86px)] flex flex-col justify-center">
        <div className="my-auto py-[clamp(12px,2.8svh,44px)] flex flex-col items-center text-center w-full">
          <h1
            className={`flex flex-col items-center text-center font-bold tracking-[-0.04em] leading-[1.03] sm:leading-[1.02] text-[#09090B] dark:text-white ${
              isFr
                ? "text-[clamp(25px,min(7.5vw,6.4svh),60px)] sm:text-[clamp(42px,min(6.6vw,8.2svh),82px)]"
                : "text-[clamp(30px,min(9.2vw,6.8svh),64px)] sm:text-[clamp(46px,min(7.2vw,8.6svh),86px)]"
            }`}
          >
            <span className="block whitespace-nowrap">
              {tr("Short links you", "Des liens courts que")}
            </span>
            <span className="inline-flex items-baseline justify-center whitespace-nowrap">
              <span>{tr("actually", "vous")}</span>
              <span aria-hidden="true">&nbsp;</span>
              <FlipWords
                key={locale}
                words={HERO_FLIP_WORDS[locale]}
                className="px-0 text-[#0066FF] dark:text-[#60A5FA]"
              />
            </span>
          </h1>

          {/* React Bits <VariableProximity /> Interactive Subtitle (zero-reflow GRAD axis + scoped pointer) */}
          <div
            ref={proximityContainerRef}
            className="mt-[clamp(12px,2.4svh,26px)] relative max-w-[660px] mx-auto text-[clamp(14.5px,min(4.6vw,2.2svh),18.5px)] sm:text-[clamp(16px,2.1svh,18.5px)] leading-[1.52] sm:leading-[1.6] text-[#3F3F46] dark:text-zinc-300 text-pretty cursor-default"
          >
            <VariableProximity
              key={locale}
              label={tr(
                "Turn every click into a smart destination — route visitors by country or device in under 12ms, lock private links with PathLock™, and track real-time revenue attribution.",
                "Transformez chaque clic en destination intelligente — routez vos visiteurs par pays ou appareil en moins de 12 ms, verrouillez vos liens privés avec PathLock™ et suivez vos revenus en temps réel."
              )}
              fromFontVariationSettings="'wght' 450, 'GRAD' 0"
              toFontVariationSettings="'wght' 450, 'GRAD' 150"
              containerRef={proximityContainerRef}
              radius={90}
              falloff="gaussian"
              smoothing={0.16}
              scale={1.06}
              lift={0.04}
              idleWave={false}
            />
          </div>

          {/* Primary Interactive Guest Shortener Command Bar + Cascading Two-Bar Link Row */}
          <div className="mt-[clamp(16px,3.2svh,38px)] w-full">
            <HeroShortener />
          </div>
        </div>
      </SectionRailFrame>

      {/* Below-the-Fold Logo Band powered by BrandScroller (seamless transparent overlay over the continuous Hero fade) */}
      <div
        role="region"
        aria-label={tr(
          "Social networks and ad pixel platforms tracked by LShorter",
          "Réseaux sociaux et plateformes de pixels publicitaires suivis par LShorter"
        )}
        className="relative z-10 w-full mt-10 sm:mt-14 pt-8 pb-10 sm:pt-10 sm:pb-12 bg-transparent flex flex-col justify-center gap-10 sm:gap-12"
      >
        <p className="text-center font-sans text-[11px] sm:text-[12px] font-semibold uppercase tracking-[0.22em] text-[#0F2952]/75 dark:text-[#BFDBFE]/75 select-none px-4">
          {tr(
            "Track your links everywhere — whether in paid ads or your daily social posts",
            "Suivez vos liens partout — dans vos campagnes publicitaires comme dans vos publications quotidiennes"
          )}
        </p>

        <BrandScroller iconSize={32} duration="64s" />
      </div>
    </section>
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
