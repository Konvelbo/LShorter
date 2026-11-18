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
  const sectionRef = React.useRef<HTMLElement>(null);
  const [inView, setInView] = React.useState(true);

  // Bi-directional observer: animates in on scroll down, reverses on scroll out, re-animates on return
  React.useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
      },
      { threshold: 0.08 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className={cn(
        "bg-background text-foreground",
        "py-10 sm:py-16 md:py-20 px-4",
        "fade-bottom overflow-hidden pb-0 relative",
        "mb-16 sm:mb-20 lg:mb-24",
        className
      )}
    >
      <div className="mx-auto flex max-w-container flex-col gap-8 pt-8 sm:gap-14 sm:pt-12">
        <div className="flex flex-col items-center gap-5 text-center sm:gap-10">
          {/* Badge — Mobile Responsive Single-Pill Design (Never disjointed or multi-line) */}
          {badge && (
            <div
              className={cn(
                "animate-appear delay-60 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]",
                !inView && "!opacity-0 !-translate-y-3 !scale-95"
              )}
            >
              <Badge
                variant="outline"
                className="inline-flex items-center flex-nowrap gap-1.5 sm:gap-2.5 border-zinc-300 dark:border-white/15 bg-white/80 dark:bg-white/5 backdrop-blur-md px-3 py-1 sm:px-4 sm:py-1.5 rounded-full shadow-xs select-none max-w-[94vw] overflow-hidden"
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

          {/* Title with Appearance Animation & Reverse Scroll Animation */}
          <h1
            className={cn(
              "relative z-10 inline-block text-3xl font-bold tracking-tight leading-[1.15] text-zinc-950 dark:text-white xs:text-4xl sm:text-6xl sm:leading-[1.1] md:text-7xl md:leading-[1.08] max-w-5xl",
              "animate-appear delay-150 transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)]",
              !inView && "!opacity-0 !translate-y-6"
            )}
          >
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

          {/* Description with Appearance Animation & Reverse Scroll Animation */}
          <p
            className={cn(
              "text-md relative z-10 max-w-[620px] font-medium text-muted-foreground sm:text-xl",
              "animate-appear delay-300 transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)]",
              !inView && "!opacity-0 !translate-y-5"
            )}
          >
            {description}
          </p>

          {/* Actions (Wave Reveal Buttons) with Appearance Animation & Reverse Scroll Animation */}
          <div
            className={cn(
              "relative z-10 flex justify-center gap-4 flex-wrap",
              "animate-appear delay-450 transition-all duration-800 ease-[cubic-bezier(0.16,1,0.3,1)]",
              !inView && "!opacity-0 !translate-y-4"
            )}
          >
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
          <div
            className={cn(
              "relative pt-0 -mt-1 sm:-mt-3 lg:-mt-4 w-full max-w-[1248px]",
              "animate-appear delay-600 transition-all duration-900 ease-[cubic-bezier(0.16,1,0.3,1)]",
              !inView && "!opacity-0 !translate-y-8 !scale-[0.98]"
            )}
          >
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
                      sizes="(max-width: 1280px) 100vw, 1248px"
                      className="w-full h-auto hidden dark:block"
                    />
                  </Mockup>
                </MockupFrame>
              )
            )}
            <Glow
              variant="top"
              className={cn(
                "animate-appear-glow delay-300 transition-opacity duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)]",
                !inView && "!opacity-0"
              )}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
