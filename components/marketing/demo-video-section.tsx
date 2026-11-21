"use client";

import React, { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Play, Clock, Link2 } from "lucide-react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";

/**
 * Easy-to-swap demo video source.
 * When the final video is ready, replace `/videos/demo-walkthrough.mp4`
 * or set `NEXT_PUBLIC_DEMO_VIDEO_URL` (supports MP4 or YouTube watch/embed URLs).
 */
export const DEMO_VIDEO_SRC =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "/videos/demo-walkthrough.mp4";

export interface VideoChapter {
  id: string;
  time: string;
  seconds: number;
  label: string;
}

const VIDEO_CHAPTERS: VideoChapter[] = [
  { id: "overview", time: "00:00", seconds: 0, label: "Overview & Shortening" },
  { id: "routing", time: "01:10", seconds: 70, label: "Smart Routing" },
  { id: "pathlock", time: "02:25", seconds: 145, label: "PathLock™ Security" },
  { id: "caps", time: "03:45", seconds: 225, label: "Click Caps & PIN Gate" },
  { id: "qr", time: "04:40", seconds: 280, label: "Dynamic QR Studio" },
  { id: "analytics", time: "05:20", seconds: 320, label: "Live Analytics & Revenue" },
];

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function DemoVideoSection() {
  const [isPlayingStarted, setIsPlayingStarted] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string>(VIDEO_CHAPTERS[0].id);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  const startAndSeek = useCallback((seconds: number, chapterId: string) => {
    setActiveChapterId(chapterId);
    if (!isPlayingStarted) {
      pendingSeekRef.current = seconds;
      setIsPlayingStarted(true);
      return;
    }
    const v = videoRef.current;
    if (v) {
      v.currentTime = seconds;
      v.play().catch(() => {});
    }
  }, [isPlayingStarted]);

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    if (pendingSeekRef.current !== null) {
      v.currentTime = pendingSeekRef.current;
      pendingSeekRef.current = null;
    }
    v.play().catch(() => {});
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    const t = v.currentTime;
    let current = VIDEO_CHAPTERS[0].id;
    for (const ch of VIDEO_CHAPTERS) {
      if (t >= ch.seconds) current = ch.id;
    }
    setActiveChapterId(current);
  };

  const handleScrollToShortener = (e: React.MouseEvent) => {
    e.preventDefault();
    const el = document.getElementById("hero-shortener");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    window.dispatchEvent(new CustomEvent("lshorter_focus_shortener"));
  };

  return (
    <section
      id="demo-video"
      className="relative w-full py-20 sm:py-28 px-4 sm:px-6 bg-[#FFFFFF] dark:bg-[#09090B] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24 overflow-hidden"
    >
      {/* Subtle Ambient Blue Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-12 left-1/2 -translate-x-1/2 w-[700px] h-[340px] rounded-full bg-[#0066FF]/[0.07] dark:bg-[#0066FF]/[0.12] blur-[120px]"
      />

      <div className="relative z-10 max-w-[1060px] mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="text-center max-w-[680px] mx-auto mb-10 sm:mb-12"
        >
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-[#0066FF]/[0.08] dark:bg-[#0066FF]/[0.16] border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] text-[12px] font-semibold tracking-wide uppercase mb-4">
            <Clock className="w-3.5 h-3.5" />
            <span>6-Minute Product Walkthrough</span>
          </span>
          <h2 className="text-[28px] sm:text-[40px] md:text-[46px] font-bold tracking-[-0.035em] leading-[1.08] text-[#101828] dark:text-white">
            See the entire platform{" "}
            <span className="text-[#667085] dark:text-zinc-400 font-medium">
              in action.
            </span>
          </h2>
          <p className="mt-4 text-[15px] sm:text-[16.5px] text-[#475467] dark:text-zinc-400 leading-[1.6]">
            Watch how link shortening, Smart Routing, PathLock™, QR Studio, and
            live analytics work together — or jump straight to any chapter below.
          </p>
        </motion.div>

        {/* Cinema 16:9 Frame (strictly rounded-[10px]) */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.985 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.52, ease: EASE_OUT_EXPO }}
          className="relative rounded-[10px] p-1.5 sm:p-2 bg-white dark:bg-[#111216] border border-[#D0D5DD] dark:border-white/14 shadow-[0_24px_70px_rgba(16,24,40,0.12)] dark:shadow-[0_28px_80px_rgba(0,0,0,0.72)]"
        >
          <div className="relative w-full aspect-video rounded-[8px] overflow-hidden bg-[#09090B]">
            {!isPlayingStarted ? (
              /* Lazy Poster State — Zero video bytes downloaded until user clicks Play */
              <button
                type="button"
                onClick={() => startAndSeek(0, VIDEO_CHAPTERS[0].id)}
                aria-label="Play 6-minute LShorter product walkthrough video"
                className="group relative w-full h-full block text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
              >
                {/* Light mode crisp poster */}
                <Image
                  src="/screenshots/light/dashboard/dashboard_normal_4k.webp"
                  alt="LShorter 6-minute product tour preview"
                  fill
                  sizes="(max-width: 1060px) 100vw, 1060px"
                  className="object-cover object-top block dark:hidden transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />
                {/* Dark mode crisp poster */}
                <Image
                  src="/screenshots/dark/dashboard/dashboard_normal_4k.webp"
                  alt="LShorter 6-minute product tour preview"
                  fill
                  sizes="(max-width: 1060px) 100vw, 1060px"
                  className="object-cover object-top hidden dark:block transition-transform duration-700 ease-out group-hover:scale-[1.02]"
                />

                {/* Calibrated Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#09090B]/80 via-[#09090B]/30 to-[#09090B]/20 group-hover:via-[#09090B]/20 transition-colors duration-300" />

                {/* Top-Left Live Label + Top-Right Duration Badge */}
                <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-2 z-10">
                  <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#09090B]/80 backdrop-blur-md border border-white/15 text-white text-[12px] font-medium">
                    <span className="w-2 h-2 rounded-full bg-[#0066FF]" />
                    <span>Full Platform Tour (4K)</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#09090B]/80 backdrop-blur-md border border-white/15 text-zinc-200 text-[12px] font-semibold tabular-nums">
                    <Clock className="w-3.5 h-3.5 text-[#5294FF]" />
                    <span>06:00</span>
                  </span>
                </div>

                {/* Central Play Button with Blue Ripple */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-4">
                  <span className="relative flex items-center justify-center">
                    <span className="absolute w-24 h-24 rounded-full bg-[#0066FF]/25 animate-ping [animation-duration:2.6s]" />
                    <span className="relative w-18 h-18 sm:w-20 sm:h-20 rounded-[10px] bg-[#0066FF] group-hover:bg-[#0055D4] text-white flex items-center justify-center shadow-[0_12px_36px_rgba(0,102,255,0.55)] group-hover:scale-105 active:scale-95 transition-all duration-300 border border-[#5294FF]/60">
                      <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-1" />
                    </span>
                  </span>
                  <span className="mt-4 px-3.5 py-1.5 rounded-[8px] bg-[#09090B]/75 backdrop-blur-md border border-white/12 text-white text-[13px] sm:text-[14px] font-semibold tracking-[-0.01em]">
                    Click to play walkthrough
                  </span>
                </div>
              </button>
            ) : (
              /* Active HTML5 Video Player (Streams via HTTP Range requests) */
              <div className="relative w-full h-full bg-black">
                <video
                  ref={videoRef}
                  src={DEMO_VIDEO_SRC}
                  controls
                  playsInline
                  preload="metadata"
                  onLoadedMetadata={handleLoadedMetadata}
                  onTimeUpdate={handleTimeUpdate}
                  className="w-full h-full object-contain bg-black"
                />
              </div>
            )}
          </div>
        </motion.div>

        {/* Interactive Clickable Chapters Strip (rounded-[8px]) */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {VIDEO_CHAPTERS.map((ch) => {
            const isActive = activeChapterId === ch.id && isPlayingStarted;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => startAndSeek(ch.seconds, ch.id)}
                className={`group text-left p-3 rounded-[8px] border transition-all duration-200 cursor-pointer ${
                  isActive
                    ? "bg-[#0066FF] border-[#0066FF] text-white shadow-[0_6px_20px_rgba(0,102,255,0.32)]"
                    : "bg-[#F8F9FA] dark:bg-[#141418] border-[#E4E7EC] dark:border-white/10 hover:border-[#0066FF]/50 text-[#101828] dark:text-zinc-200"
                }`}
              >
                <div
                  className={`text-[11px] font-semibold tabular-nums mb-1 ${
                    isActive
                      ? "text-blue-100"
                      : "text-[#0066FF] dark:text-[#5294FF]"
                  }`}
                >
                  {ch.time}
                </div>
                <div className="text-[12.5px] font-semibold leading-snug line-clamp-2">
                  {ch.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Action Prompt */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <WaveRevealButton
            href="/#hero-shortener"
            onClick={handleScrollToShortener}
            variant="outline"
            size="md"
            icon={<Link2 className="w-4 h-4" />}
          >
            Try it yourself — shorten a link above
          </WaveRevealButton>
        </div>
      </div>
    </section>
  );
}

export default DemoVideoSection;
