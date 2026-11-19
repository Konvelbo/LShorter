"use client";

import React from "react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";
import {
  Hero195Showcase,
  HeroShowcaseTab,
  DEFAULT_HERO_SHOWCASE_TABS,
} from "@/components/ui/hero-195";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "destructive"
    | "glow"
    | "default";
}

export interface HeroProps {
  badge?: {
    text: string;
    action: {
      text: string;
      href: string;
    };
  };
  title: string;
  description: string;
  actions: HeroAction[];
  image?: {
    light: string;
    dark: string;
    alt: string;
  };
  tabs?: HeroShowcaseTab[];
  className?: string;
}

export function HeroSection({
  badge,
  title,
  description,
  actions,
  image,
  tabs,
  className,
}: HeroProps) {
  const resolvedTabs = tabs ?? (image ? undefined : DEFAULT_HERO_SHOWCASE_TABS);

  return (
    <section
      className={cn(
        "bg-background text-foreground",
        "py-10 sm:py-16 md:py-20 px-4",
        "overflow-hidden pb-0 relative",
        "mb-16 sm:mb-20 lg:mb-24",
        className
      )}
    >
      <div className="mx-auto flex max-w-container flex-col gap-8 pt-8 sm:gap-14 sm:pt-12">
        <div className="flex flex-col items-center gap-5 text-center sm:gap-10">
          {/* Badge — Mobile Responsive Single-Pill Design (Never disjointed or multi-line) */}
          {badge && (
            <div className="animate-appear delay-60">
              <Badge
                variant="outline"
                className="inline-flex items-center flex-nowrap gap-1.5 sm:gap-2.5 border-zinc-300 dark:border-white/15 bg-white/95 dark:bg-white/[0.06] px-3 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-xs select-none max-w-[94vw] overflow-hidden"
              >
                <span className="text-muted-foreground whitespace-nowrap text-[11px] sm:text-xs font-medium shrink-0">
                  <span className="sm:hidden">Edge Smart Routing</span>
                  <span className="hidden sm:inline">{badge.text}</span>
                </span>
                <span
                  className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-white/20 shrink-0"
                  aria-hidden="true"
                />
                <a
                  href={badge.action.href}
                  className="shrink-0 inline-flex items-center gap-1 text-[#0066FF] dark:text-[#5294FF] font-semibold hover:underline whitespace-nowrap text-[11px] sm:text-xs"
                >
                  <span>{badge.action.text}</span>
                  <ArrowRightIcon className="h-3 w-3 shrink-0" />
                </a>
              </Badge>
            </div>
          )}

          {/* Title with One-Shot Appearance Animation */}
          <h1 className="relative z-10 inline-block text-3xl font-bold tracking-tight leading-[1.15] text-zinc-950 dark:text-white xs:text-4xl sm:text-6xl sm:leading-[1.1] md:text-7xl md:leading-[1.08] max-w-5xl animate-appear delay-150">
            {(() => {
              const splitIdx =
                title.includes(".") && title.indexOf(".") < title.length - 2
                  ? title.indexOf(".") + 1
                  : title.includes(",")
                    ? title.indexOf(",") + 1
                    : -1;

              if (splitIdx !== -1) {
                return (
                  <>
                    <span className="text-zinc-950 dark:text-white">
                      {title.slice(0, splitIdx)}
                    </span>{" "}
                    <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                      {title.slice(splitIdx).trimStart()}
                    </span>
                  </>
                );
              }
              return title;
            })()}
          </h1>

          {/* Description */}
          <p className="text-md relative z-10 max-w-[620px] font-medium text-muted-foreground sm:text-xl animate-appear delay-300">
            {description}
          </p>

          {/* Actions (Wave Reveal Buttons) */}
          <div className="relative z-10 flex justify-center gap-4 flex-wrap animate-appear delay-450">
            {actions.map((action, index) => {
              const isPrimary = index === 0;
              return (
                <WaveRevealButton
                  key={index}
                  href={action.href}
                  variant={isPrimary ? "primary" : "outline"}
                  size="lg"
                  icon={action.icon}
                >
                  {action.text}
                </WaveRevealButton>
              );
            })}
          </div>

          {/* Interactive Hero-195 Tabbed Showcase with BorderBeam & Glow */}
          <div className="relative pt-0 -mt-1 sm:-mt-3 lg:-mt-4 w-full max-w-[1248px] animate-appear delay-600">
            {resolvedTabs && resolvedTabs.length > 0 ? (
              <Hero195Showcase tabs={resolvedTabs} />
            ) : (
              image && (
                <MockupFrame
                  className="bg-accent/5 rounded-2xl border border-zinc-200/80 dark:border-white/10"
                  size="small"
                >
                  <Mockup
                    type="responsive"
                    className="bg-white dark:bg-[#101828] border border-zinc-200 dark:border-white/15"
                  >
                    <Image
                      src={image.light}
                      alt={image.alt}
                      width={1847}
                      height={1013}
                      priority
                      loading="eager"
                      decoding="async"
                      sizes="(max-width: 1280px) 100vw, 1248px"
                      className="w-full h-auto block dark:hidden"
                    />
                    <Image
                      src={image.dark}
                      alt={image.alt}
                      width={1847}
                      height={1013}
                      priority
                      loading="eager"
                      decoding="async"
                      sizes="(max-width: 1280px) 100vw, 1248px"
                      className="w-full h-auto hidden dark:block"
                    />
                  </Mockup>
                </MockupFrame>
              )
            )}
            <Glow
              variant="top"
              className="-z-10 animate-appear-glow delay-300"
            />
          </div>
        </div>
      </div>
      {/* Lightweight bottom fade gradient replacing full-section CSS mask-image offscreen compositing */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 z-20 bg-gradient-to-t from-white dark:from-[#09090B] to-transparent"
      />
    </section>
  );
}

export default HeroSection;
