"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRightIcon } from "lucide-react";
import { Mockup, MockupFrame } from "@/components/ui/mockup";
import { Glow } from "@/components/ui/glow";
import Image from "next/image";
import { cn } from "@/lib/utils";

export interface HeroAction {
  text: string;
  href: string;
  icon?: React.ReactNode;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "destructive" | "glow" | "default";
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
  image: {
    light: string;
    dark: string;
    alt: string;
  };
  className?: string;
}

export function HeroSection({
  badge,
  title,
  description,
  actions,
  image,
  className,
}: HeroProps) {
  return (
    <section
      className={cn(
        "bg-background text-foreground",
        "py-12 sm:py-24 md:py-32 px-4",
        "fade-bottom overflow-hidden pb-0 relative",
        className
      )}
    >
      <div className="mx-auto flex max-w-container flex-col gap-12 pt-16 sm:gap-24">
        <div className="flex flex-col items-center gap-6 text-center sm:gap-12">
          {/* Badge */}
          {badge && (
            <Badge variant="outline" className="animate-appear gap-2 border-zinc-300 dark:border-white/15 bg-white/80 dark:bg-white/5 backdrop-blur-md px-3.5 py-1.5 rounded-full shadow-xs">
              <span className="text-muted-foreground">{badge.text}</span>
              <a href={badge.action.href} className="flex items-center gap-1 text-[#0066FF] dark:text-[#5294FF] font-semibold hover:underline">
                {badge.action.text}
                <ArrowRightIcon className="h-3 w-3" />
              </a>
            </Badge>
          )}

          {/* Title */}
          <h1 className="relative z-10 inline-block animate-appear text-3xl font-bold tracking-tight leading-[1.15] text-zinc-950 dark:text-white xs:text-4xl sm:text-6xl sm:leading-[1.1] md:text-7xl md:leading-[1.08] max-w-5xl">
            {title.includes(".") ? (
              <>
                <span className="text-zinc-950 dark:text-white">
                  {title.slice(0, title.indexOf(".") + 1)}
                </span>{" "}
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">
                  {title.slice(title.indexOf(".") + 1)}
                </span>
              </>
            ) : (
              title
            )}
          </h1>

          {/* Description */}
          <p className="text-md relative z-10 max-w-[620px] animate-appear font-medium text-muted-foreground opacity-0 delay-100 sm:text-xl">
            {description}
          </p>

          {/* Actions */}
          <div className="relative z-10 flex animate-appear justify-center gap-4 opacity-0 delay-300 flex-wrap">
            {actions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || "default"}
                size="lg"
                asChild
                className={cn(
                  "rounded-[10px] cursor-pointer",
                  (action.variant === "default" || action.variant === "glow" || action.variant === "primary") &&
                    "bg-[#0066FF] hover:bg-[#0055d4] text-white shadow-lg shadow-blue-500/25 border border-blue-400/30"
                )}
              >
                <a href={action.href} className="flex items-center gap-2">
                  {action.icon}
                  {action.text}
                </a>
              </Button>
            ))}
          </div>

          {/* Image with Glow */}
          <div className="relative pt-12 w-full max-w-[1248px]">
            <MockupFrame
              className="animate-appear opacity-0 delay-700 bg-accent/5 rounded-2xl border border-zinc-200/80 dark:border-white/10"
              size="small"
            >
              <Mockup type="responsive" className="bg-white dark:bg-[#101828] border border-zinc-200 dark:border-white/15">
                <Image
                  src={image.light}
                  alt={image.alt}
                  width={1847}
                  height={1013}
                  priority
                  sizes="(max-width: 1280px) 100vw, 1248px"
                  className="w-full h-auto block dark:hidden"
                />
                <Image
                  src={image.dark}
                  alt={image.alt}
                  width={1847}
                  height={1013}
                  priority
                  sizes="(max-width: 1280px) 100vw, 1248px"
                  className="w-full h-auto hidden dark:block"
                />
              </Mockup>
            </MockupFrame>
            <Glow
              variant="top"
              className="animate-appear-zoom opacity-0 delay-1000"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
