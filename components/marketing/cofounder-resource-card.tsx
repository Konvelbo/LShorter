"use client";

import React, { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import gsap from "gsap";
import { DocFeature } from "@/lib/docs-data";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface CofounderResourceCardProps {
  feature: DocFeature;
  tagColor?: string;
  tagLabel?: string;
  dateLabel?: string;
  index?: number;
}

export function CofounderResourceCard({
  feature,
  tagColor = "bg-emerald-500",
  tagLabel = "Guide",
  dateLabel = "09/12",
  index = 0,
}: CofounderResourceCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const popupImgRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (!popupImgRef.current) return;
    gsap.killTweensOf(popupImgRef.current);
    gsap.to(popupImgRef.current, {
      y: -36,
      opacity: 1,
      scale: 1,
      duration: 0.45,
      ease: "back.out(1.4)",
    });
  };

  const handleMouseLeave = () => {
    if (!popupImgRef.current) return;
    gsap.killTweensOf(popupImgRef.current);
    gsap.to(popupImgRef.current, {
      y: 35,
      opacity: 0,
      scale: 0.92,
      duration: 0.35,
      ease: "power2.inOut",
    });
  };

  return (
    <div
      ref={cardRef}
      className="cofounder-card-item relative pt-10 select-none group/item"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link href={`/docs/${feature.slug}`} className="block h-full cursor-pointer">
        {/* Layer 1: Back Tab Envelope Layer */}
        <div className="absolute inset-x-3 top-3 bottom-0 rounded-2xl bg-[#EFEAE2] dark:bg-[#1a1a1e] border border-[#E7DFD5] dark:border-white/10 z-0 transition-colors" />

        {/* Layer 2: The GSAP Pop-up Image coming from inside the top slot */}
        <div
          ref={popupImgRef}
          style={{ transform: "translateY(35px) scale(0.92)", opacity: 0 }}
          className="absolute left-6 right-6 top-0 aspect-[16/9] rounded-xl overflow-hidden shadow-2xl border border-[#E7DFD5] dark:border-white/20 bg-neutral-900 z-10 pointer-events-none"
        >
          <Image
            src={feature.image}
            alt={feature.title}
            fill
            sizes="(max-width: 768px) 100vw, 360px"
            className="object-cover"
          />
        </div>

        {/* Layer 3: Main Front Card */}
        <Card className="cofounder-card-front relative z-20 h-full rounded-2xl bg-[#FFFDF9] dark:bg-[#121214] border border-[#E7DFD5] dark:border-white/10 p-6 sm:p-7 shadow-sm transition-all duration-300 group-hover/item:shadow-[0_20px_40px_rgba(43,37,32,0.08)] dark:group-hover/item:shadow-[0_20px_40px_rgba(0,0,0,0.7)] group-hover/item:border-[#D6CCC0] dark:group-hover/item:border-white/20 flex flex-col justify-between">
          
          <div>
            {/* Top Meta: Category Tag on left, Version/Date on right */}
            <div className="flex items-center justify-between text-xs font-mono">
              <div className="flex items-center gap-2 text-neutral-600 dark:text-neutral-400">
                <span className={`w-2 h-2 rounded-full ${tagColor} shrink-0`} />
                <span className="capitalize">{tagLabel}</span>
              </div>
              <span className="text-neutral-600 dark:text-neutral-400">{dateLabel}</span>
            </div>

            {/* Title */}
            <CardHeader className="p-0 mt-4 mb-2.5">
              <CardTitle className="text-lg sm:text-xl font-bold tracking-tight text-[#2B2520] dark:text-white group-hover/item:text-brand transition-colors leading-snug line-clamp-2">
                {feature.title}
              </CardTitle>
            </CardHeader>

            {/* Description */}
            <CardContent className="p-0">
              <CardDescription className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-3">
                {feature.description}
              </CardDescription>
            </CardContent>
          </div>

          {/* Bottom Monospace Action Link */}
          <div className="mt-6 pt-4 border-t border-[#E7DFD5]/60 dark:border-white/5 flex items-center justify-between font-mono text-xs text-neutral-500 dark:text-neutral-400 group-hover/item:text-brand transition-colors">
            <span>Read guide</span>
            <ArrowRight className="w-3.5 h-3.5 group-hover/item:translate-x-1.5 transition-transform duration-200" />
          </div>
        </Card>
      </Link>
    </div>
  );
}
