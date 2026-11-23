"use client";

import dynamic from "next/dynamic";
import { AnimatePresence, motion, useSpring } from "motion/react";
import { Play } from "lucide-react";
import React, { useCallback, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";

const VideoPopOver = dynamic(
  () => import("@/components/ui/skiper67-modal").then((m) => m.VideoPopOver),
  { ssr: false }
);

export interface Skiper67Props {
  videoSrc?: string;
  thumbnailSrc?: string;
  thumbnailAlt?: string;
  caption?: string;
  initialSeekSeconds?: number | null;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTimeUpdate?: (currentTime: number) => void;
  lang?: "en" | "fr";
  onLangChange?: (lang: "en" | "fr") => void;
  className?: string;
}

export const Skiper67 = ({
  videoSrc = "/videos/demo-walkthrough-en.mp4?v=2",
  thumbnailSrc = "/videos/demo-walkthrough-en-poster.jpg?v=3",
  thumbnailAlt,
  caption,
  initialSeekSeconds = null,
  isOpen,
  onOpenChange,
  onTimeUpdate,
  lang,
  onLangChange,
  className,
}: Skiper67Props) => {
  const { tr } = useI18n();
  const [internalOpen, setInternalOpen] = useState(false);
  const showVideoPopOver = isOpen !== undefined ? isOpen : internalOpen;

  const resolvedCaption =
    caption ?? tr("Click the video to play", "Cliquez pour lancer la vidéo");
  const resolvedThumbnailAlt =
    thumbnailAlt ??
    tr(
      "LShorter 6-minute product walkthrough preview",
      "Aperçu de la présentation produit LShorter en 6 minutes"
    );

  const setShowVideoPopOver = useCallback(
    (next: boolean) => {
      if (isOpen === undefined) {
        setInternalOpen(next);
      }
      onOpenChange?.(next);
    },
    [isOpen, onOpenChange]
  );

  const SPRING = {
    mass: 0.1,
    stiffness: 260,
    damping: 22,
  };

  const x = useSpring(0, SPRING);
  const y = useSpring(0, SPRING);
  const opacity = useSpring(0, SPRING);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    opacity.set(1);
    const bounds = e.currentTarget.getBoundingClientRect();
    x.set(e.clientX - bounds.left - 44);
    y.set(e.clientY - bounds.top - 22);
  };

  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center justify-center rounded-[10px] bg-[#F5F4F3] dark:bg-[#111216] border border-[#E4E7EC] dark:border-white/[0.10] px-4 sm:px-8 pt-10 pb-10 sm:pt-12 sm:pb-12 transition-colors duration-300",
        className
      )}
    >
      {/* Skiper67 Editorial Caption + Vertical Hairline */}
      <div className="mb-10 sm:mb-12 grid content-start justify-items-center text-center">
        <span className="relative max-w-[20ch] text-[11px] font-mono font-medium uppercase tracking-[0.14em] leading-tight text-[#09090B]/55 dark:text-white/55 after:absolute after:left-1/2 after:top-full after:mt-3 after:h-9 after:w-px after:-translate-x-1/2 after:bg-gradient-to-b after:from-transparent after:to-[#09090B]/35 dark:after:to-white/35 after:content-['']">
          {resolvedCaption}
        </span>
      </div>

      <AnimatePresence>
        {showVideoPopOver && (
          <VideoPopOver
            videoSrc={videoSrc}
            thumbnailSrc={thumbnailSrc}
            initialSeekSeconds={initialSeekSeconds}
            onTimeUpdate={onTimeUpdate}
            lang={lang}
            onLangChange={onLangChange}
            setShowVideoPopOver={setShowVideoPopOver}
          />
        )}
      </AnimatePresence>

      {/* Interactive Thumbnail Card with Spring-Tracked Play Cursor */}
      <div
        role="button"
        tabIndex={0}
        aria-label={tr(
          "Play LShorter 6-minute walkthrough video",
          "Lire la vidéo de présentation LShorter de 6 minutes"
        )}
        onPointerMove={handlePointerMove}
        onPointerLeave={() => {
          opacity.set(0);
        }}
        onClick={() => setShowVideoPopOver(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setShowVideoPopOver(true);
          }
        }}
        className="group relative w-full max-w-[920px] aspect-video overflow-hidden rounded-[10px] border border-black/10 dark:border-white/15 bg-[#09090B] shadow-[0_20px_56px_rgba(16,24,40,0.16)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.65)] cursor-pointer select-none focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-4"
      >
        {/* Spring-Tracked Floating Play Pill */}
        <motion.div
          style={{ x, y, opacity }}
          className="pointer-events-none absolute left-0 top-0 z-30 flex w-fit select-none items-center justify-center gap-2 rounded-[8px] bg-[#09090B]/90 px-4 py-2 text-[13px] font-semibold text-white border border-white/20 shadow-[0_10px_28px_rgba(0,0,0,0.45)]"
        >
          <Play className="size-3.5 fill-white" />
          <span>{tr("Play", "Lire")}</span>
        </motion.div>

        {/* Custom LShorter Walkthrough Thumbnail */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={thumbnailSrc}
          alt={resolvedThumbnailAlt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transform-gpu will-change-transform video-hover-smooth transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.025]"
        />

        {/* Subtle Dark Vignette + Center Play Indicator */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/35 via-black/5 to-transparent video-hover-smooth transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-60" />

        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center video-hover-smooth transition-opacity duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-0">
          <span className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-[10px] bg-[#0066FF] text-white shadow-[0_14px_36px_rgba(0,102,255,0.5)]">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-1" />
          </span>
        </div>
      </div>
    </div>
  );
};

export default Skiper67;
