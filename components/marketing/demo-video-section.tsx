"use client";

import React, { useState, useRef, useCallback } from "react";
import { motion } from "motion/react";
import { Play, Link2, ShieldCheck, Globe2, ArrowUpRight } from "lucide-react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
  SwissSectionIndex,
  scrollToHeroShortener,
} from "@/components/marketing/swiss-frame";

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

/**
 * 100% English architectural dashboard poster preview rendered inside the 16:9 cinema viewport
 * before video playback starts (zero French legacy screenshot text, zero badge collision).
 */
function EnglishCinemaPosterOverlay() {
  const barHeights = [34, 48, 42, 66, 54, 78, 62, 88, 72, 94, 82, 96];

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[#0B0C10] text-white flex flex-col justify-between p-4 sm:p-7 select-none overflow-hidden"
    >
      {/* Subtle blueprint dot grid inside poster */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.06)_1px,transparent_1px)] [background-size:20px_20px] opacity-60" />

      {/* Mock English Dashboard Shell */}
      <div className="relative z-10 grid grid-cols-12 gap-3 sm:gap-4 h-full opacity-95 group-hover:opacity-100 transition-opacity duration-500">
        {/* Left Sidebar */}
        <div className="hidden sm:flex col-span-3 rounded-[8px] border border-white/[0.12] bg-[#131620] p-3.5 flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.10]">
              <span className="w-4 h-4 rounded-[4px] bg-[#0066FF] inline-block" />
              <span className="text-[12px] font-bold tracking-tight text-white">
                LShorter Edge
              </span>
            </div>
            <div className="mt-3 space-y-1.5 font-mono text-[10.5px]">
              {[
                { name: "Overview", active: true },
                { name: "Short Links", active: false },
                { name: "Smart Routing", active: false },
                { name: "PathLock™ Guard", active: false },
                { name: "QR Vector Studio", active: false },
                { name: "Stripe Revenue", active: false },
              ].map((nav) => (
                <div
                  key={nav.name}
                  className={`px-2.5 py-1.5 rounded-[5px] flex items-center justify-between ${
                    nav.active
                      ? "bg-[#0066FF]/25 text-[#7AB3FF] border border-[#0066FF]/45 font-semibold"
                      : "text-zinc-300"
                  }`}
                >
                  <span>{nav.name}</span>
                  {nav.active && <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" />}
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-white/[0.10] font-mono text-[10px] text-emerald-400 flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>310+ EDGE POPS ACTIVE</span>
          </div>
        </div>

        {/* Main Workspace Canvas */}
        <div className="col-span-12 sm:col-span-9 flex flex-col gap-3">
          {/* Top Telemetry Strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[
              { label: "Total Edge Clicks", value: "14,820", note: "Example telemetry" },
              { label: "Global P95 Latency", value: "11.4 ms", note: "Cloudflare Workers" },
              { label: "Active Rules", value: "48", note: "100% links operational" },
              { label: "Stripe Attributed", value: "$4,320", note: "First-party qk_cid" },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-[8px] border border-white/[0.12] bg-[#131620] p-2.5 sm:p-3"
              >
                <div className="font-mono text-[9.5px] uppercase tracking-wider text-zinc-400 truncate">
                  {kpi.label}
                </div>
                <div className="mt-1 text-[15px] sm:text-[18px] font-bold tracking-tight text-white tabular-nums">
                  {kpi.value}
                </div>
                <div className="font-mono text-[9px] text-[#6CA8FF] mt-0.5 truncate">
                  {kpi.note}
                </div>
              </div>
            ))}
          </div>

          {/* Chart + Live Route Ledger */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0">
            <div className="md:col-span-7 rounded-[8px] border border-white/[0.12] bg-[#131620] p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between font-mono text-[10px] text-zinc-300">
                <span>EDGE THROUGHPUT // 24H</span>
                <span className="text-emerald-400">HTTP 302 · LIVE</span>
              </div>
              <div className="flex items-end gap-1.5 sm:gap-2 h-24 sm:h-32 pt-3">
                {barHeights.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${h}%` }}
                      className={`w-full rounded-t-[3px] ${
                        i >= 9 ? "bg-[#0066FF]" : "bg-[#3B82F6]/65"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden md:flex md:col-span-5 rounded-[8px] border border-white/[0.12] bg-[#131620] p-3.5 flex-col justify-between">
              <div className="flex items-center justify-between font-mono text-[10px] text-zinc-300">
                <span>ACTIVE PERIMETER RULES</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#6CA8FF]" />
              </div>
              <div className="space-y-2 my-auto font-mono text-[10.5px]">
                <div className="p-2 rounded-[6px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                  <span className="text-[#6CA8FF]">lsho.cc/beta-v2</span>
                  <span className="text-emerald-400">/app/dashboard/*</span>
                </div>
                <div className="p-2 rounded-[6px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                  <span className="text-white">go.brand.io/app</span>
                  <span className="text-zinc-300">iOS · Android · FR</span>
                </div>
                <div className="p-2 rounded-[6px] bg-white/[0.04] border border-white/[0.08] flex items-center justify-between">
                  <span className="text-white">lsho.cc/launch</span>
                  <span className="text-amber-300">Cap 23 / 25</span>
                </div>
              </div>
              <div className="font-mono text-[9.5px] text-zinc-400 flex items-center gap-1.5">
                <Globe2 className="w-3 h-3 text-[#5294FF]" />
                <span>Paris · New York · Tokyo · Frankfurt</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Calibrated Cinema Vignette (preserves crisp dashboard readability behind Play control) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(9,9,11,0.16)_0%,rgba(9,9,11,0.52)_80%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(9,9,11,0.08)_0%,rgba(9,9,11,0.40)_80%)] transition-all duration-300 z-10" />
    </div>
  );
}

export function DemoVideoSection() {
  const [isPlayingStarted, setIsPlayingStarted] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string>(
    VIDEO_CHAPTERS[0].id
  );
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const pendingSeekRef = useRef<number | null>(null);

  const startAndSeek = useCallback(
    (seconds: number, chapterId: string) => {
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
    },
    [isPlayingStarted]
  );

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

  return (
    <section
      id="demo-video"
      className="relative w-full bg-[#FFFFFF] dark:bg-[#09090B] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 scroll-mt-24 overflow-x-clip"
    >
      <SectionRailFrame className="px-4 sm:px-8 py-20 sm:py-28">
        {/* Asymmetric Split Section Header (breaks centered cliché) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45, ease: EASE_OUT_EXPO }}
          className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-10 sm:mb-12"
        >
          <div className="lg:col-span-7">
            <SwissSectionIndex
              index="02"
              label="WALKTHROUGH"
              meta="6-MINUTE PRODUCT TOUR"
            />
            <h2 className="mt-4 text-[30px] sm:text-[42px] md:text-[48px] font-bold tracking-[-0.04em] leading-[1.04] text-[#09090B] dark:text-white">
              Inspect the entire switchboard in six minutes.
            </h2>
          </div>

          <div className="lg:col-span-5 lg:pb-1">
            <p className="text-[14.5px] sm:text-[15.5px] text-[#475467] dark:text-zinc-400 leading-[1.6]">
              Watch link provisioning, Smart Routing rules, PathLock™ perimeter
              enforcement, Dynamic QR generation, and live revenue telemetry — or
              jump directly to any timestamp below.
            </p>
          </div>
        </motion.div>

        {/* Exterior Precision Instrument Frame + 16:9 Cinema Stage (strictly rounded-[10px]) */}
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.99 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.52, ease: EASE_OUT_EXPO }}
          className="rounded-[10px] border border-[#D0D5DD] dark:border-white/14 bg-[#F7F8FA] dark:bg-[#0D0E12] shadow-[0_24px_70px_rgba(16,24,40,0.09)] dark:shadow-[0_28px_80px_rgba(0,0,0,0.75)] overflow-hidden"
        >
          {/* Exterior Instrument Header Strip (zero overlay collision with video content) */}
          <div className="px-4 sm:px-5 py-2.5 border-b border-[#E4E7EC] dark:border-white/[0.08] bg-white dark:bg-[#121318] flex flex-wrap items-center justify-between gap-3 font-mono text-[11px]">
            <div className="flex items-center gap-2.5 text-[#101828] dark:text-zinc-200">
              <span
                className={`w-2 h-2 rounded-full ${
                  isPlayingStarted ? "bg-red-500 animate-pulse" : "bg-[#0066FF]"
                }`}
              />
              <span className="font-bold tracking-wider uppercase">
                4K PRODUCT WALKTHROUGH
              </span>
              <span className="hidden sm:inline text-[#D0D5DD] dark:text-zinc-700">
                //
              </span>
              <span className="hidden sm:inline text-[#667085] dark:text-zinc-400">
                100% LIVE INTERFACE
              </span>
            </div>

            <div className="flex items-center gap-3 text-[#475467] dark:text-zinc-400 tabular-nums">
              <span>DURATION: 06:00</span>
              <span className="text-[#D0D5DD] dark:text-zinc-700">|</span>
              <span className="text-[#0066FF] dark:text-[#5294FF] font-semibold">
                6 CHAPTERS
              </span>
            </div>
          </div>

          {/* 16:9 Cinema Viewport */}
          <div className="p-1.5 sm:p-2 bg-[#09090B]">
            <div className="relative w-full aspect-video rounded-[8px] overflow-hidden bg-[#09090B]">
              {!isPlayingStarted ? (
                <button
                  type="button"
                  onClick={() => startAndSeek(0, VIDEO_CHAPTERS[0].id)}
                  aria-label="Play 6-minute LShorter product walkthrough video"
                  className="group relative w-full h-full block text-left cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0066FF]"
                >
                  <EnglishCinemaPosterOverlay />

                  {/* Central Tactile Play Control */}
                  <div className="relative z-20 w-full h-full flex flex-col items-center justify-center px-4">
                    <span className="relative flex items-center justify-center">
                      <span className="absolute w-24 h-24 rounded-full bg-[#0066FF]/25 animate-ping [animation-duration:2.6s]" />
                      <span className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-[10px] bg-[#0066FF] group-hover:bg-[#0055D4] text-white flex items-center justify-center shadow-[0_14px_40px_rgba(0,102,255,0.6)] group-hover:scale-105 active:scale-95 transition-all duration-300 border border-[#5294FF]/60">
                        <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-1" />
                      </span>
                    </span>
                    <span className="mt-4 px-3.5 py-1.5 rounded-[8px] bg-[#09090B]/92 backdrop-blur-md border border-white/20 shadow-[0_12px_32px_rgba(0,0,0,0.55)] text-white font-mono text-[12px] sm:text-[13px] font-semibold tracking-tight inline-flex items-center gap-2">
                      <span>Play 6-min walkthrough</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#5294FF]" />
                    </span>
                  </div>
                </button>
              ) : (
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
          </div>

          {/* Integrated 6-Chapter Switchboard Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y lg:divide-y-0 sm:divide-x divide-[#E4E7EC] dark:divide-white/[0.08] border-t border-[#E4E7EC] dark:border-white/[0.08] bg-white dark:bg-[#111216]">
            {VIDEO_CHAPTERS.map((ch) => {
              const isActive = activeChapterId === ch.id && isPlayingStarted;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => startAndSeek(ch.seconds, ch.id)}
                  className={`group text-left p-3.5 transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? "bg-[#0066FF] text-white"
                      : "hover:bg-[#F7F8FA] dark:hover:bg-white/[0.04] text-[#101828] dark:text-zinc-200"
                  }`}
                >
                  <div
                    className={`font-mono text-[11px] font-bold tabular-nums mb-1 ${
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
        </motion.div>

        {/* Bottom Action Prompt */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-[#E4E7EC] dark:border-white/[0.08]">
          <span className="font-mono text-[11.5px] text-[#667085] dark:text-zinc-400">
            Ready in the browser — test link creation above without creating an account.
          </span>
          <WaveRevealButton
            href="/#hero-shortener"
            onClick={scrollToHeroShortener}
            variant="outline"
            size="md"
            icon={<Link2 className="w-4 h-4" />}
          >
            Try it yourself — shorten a link above
          </WaveRevealButton>
        </div>
      </SectionRailFrame>
    </section>
  );
}

export default DemoVideoSection;
