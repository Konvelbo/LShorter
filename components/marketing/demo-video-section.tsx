"use client";

import React, { useState, useRef, useCallback } from "react";
import { Play, ShieldCheck, Globe2 } from "lucide-react";
import { SectionRailFrame } from "@/components/marketing/swiss-frame";

/**
 * Easy-to-swap demo video source.
 * Replace `/videos/demo-walkthrough.mp4` or set `NEXT_PUBLIC_DEMO_VIDEO_URL`.
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
  { id: "overview", time: "00:00", seconds: 0, label: "Overview & shortening" },
  { id: "routing", time: "01:10", seconds: 70, label: "Smart routing" },
  { id: "pathlock", time: "02:25", seconds: 145, label: "PathLock™ security" },
  { id: "caps", time: "03:45", seconds: 225, label: "Click caps & PIN gate" },
  { id: "qr", time: "04:40", seconds: 280, label: "Dynamic QR studio" },
  { id: "analytics", time: "05:20", seconds: 320, label: "Live analytics & revenue" },
];

/**
 * Clean 100% English product preview poster rendered inside the 16:9 viewport
 * before video playback starts.
 */
function EnglishCinemaPosterOverlay() {
  const barHeights = [34, 48, 42, 66, 54, 78, 62, 88, 72, 94, 82, 96];

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 bg-[#0B0C10] text-white flex flex-col justify-between p-4 sm:p-7 select-none overflow-hidden"
    >
      <div className="relative z-10 grid grid-cols-12 gap-3 sm:gap-4 h-full opacity-95 group-hover:opacity-100 transition-opacity duration-300">
        {/* Sidebar */}
        <div className="hidden sm:flex col-span-3 rounded-[8px] border border-white/[0.10] bg-[#13151D] p-3.5 flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 pb-3 border-b border-white/[0.08]">
              <span className="w-4 h-4 rounded-[4px] bg-[#0066FF] inline-block" />
              <span className="text-[12.5px] font-semibold tracking-tight text-white">
                LShorter
              </span>
            </div>
            <div className="mt-3 space-y-1 text-[11.5px]">
              {[
                { name: "Overview", active: true },
                { name: "Short links", active: false },
                { name: "Smart routing", active: false },
                { name: "PathLock™ guard", active: false },
                { name: "QR studio", active: false },
                { name: "Stripe revenue", active: false },
              ].map((nav) => (
                <div
                  key={nav.name}
                  className={`px-2.5 py-1.5 rounded-[6px] ${
                    nav.active
                      ? "bg-[#0066FF]/20 text-[#7AB3FF] font-medium"
                      : "text-zinc-400"
                  }`}
                >
                  {nav.name}
                </div>
              ))}
            </div>
          </div>
          <div className="pt-3 border-t border-white/[0.08] text-[11px] text-zinc-400">
            310+ edge PoPs active
          </div>
        </div>

        {/* Main Workspace Canvas */}
        <div className="col-span-12 sm:col-span-9 flex flex-col gap-3">
          {/* Top KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
            {[
              { label: "Total clicks", value: "14,820", note: "Example data" },
              { label: "Median latency", value: "11.4 ms", note: "Cloudflare Edge" },
              { label: "Active rules", value: "48", note: "All routes live" },
              { label: "Attributed sales", value: "$4,320", note: "Stripe checkout" },
            ].map((kpi) => (
              <div
                key={kpi.label}
                className="rounded-[8px] border border-white/[0.10] bg-[#13151D] p-3"
              >
                <div className="text-[11px] text-zinc-400 truncate">
                  {kpi.label}
                </div>
                <div className="mt-1 text-[16px] sm:text-[18px] font-semibold tracking-tight text-white tabular-nums">
                  {kpi.value}
                </div>
                <div className="text-[10.5px] text-[#6CA8FF] mt-0.5 truncate">
                  {kpi.note}
                </div>
              </div>
            ))}
          </div>

          {/* Chart + Active Rules */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-3 min-h-0">
            <div className="md:col-span-7 rounded-[8px] border border-white/[0.10] bg-[#13151D] p-3.5 flex flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Edge traffic (24h)</span>
                <span className="text-emerald-400 font-mono text-[10.5px]">
                  HTTP 302
                </span>
              </div>
              <div className="flex items-end gap-1.5 sm:gap-2 h-24 sm:h-32 pt-3">
                {barHeights.map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col justify-end h-full">
                    <div
                      style={{ height: `${h}%` }}
                      className={`w-full rounded-t-[3px] ${
                        i >= 9 ? "bg-[#0066FF]" : "bg-[#3B82F6]/55"
                      }`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden md:flex md:col-span-5 rounded-[8px] border border-white/[0.10] bg-[#13151D] p-3.5 flex-col justify-between">
              <div className="flex items-center justify-between text-[11px] text-zinc-400">
                <span>Active rules</span>
                <ShieldCheck className="w-3.5 h-3.5 text-[#6CA8FF]" />
              </div>
              <div className="space-y-2 my-auto font-mono text-[11px]">
                <div className="p-2 rounded-[6px] bg-white/[0.04] flex items-center justify-between">
                  <span className="text-[#6CA8FF]">lsho.cc/beta-v2</span>
                  <span className="text-emerald-400">/app/dashboard/*</span>
                </div>
                <div className="p-2 rounded-[6px] bg-white/[0.04] flex items-center justify-between">
                  <span className="text-white">go.brand.io/app</span>
                  <span className="text-zinc-400">iOS, Android, FR</span>
                </div>
                <div className="p-2 rounded-[6px] bg-white/[0.04] flex items-center justify-between">
                  <span className="text-white">lsho.cc/launch</span>
                  <span className="text-amber-300">Cap 23 / 25</span>
                </div>
              </div>
              <div className="text-[10.5px] text-zinc-400 flex items-center gap-1.5">
                <Globe2 className="w-3 h-3 text-[#5294FF]" />
                <span>Paris, New York, Tokyo, Frankfurt</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(9,9,11,0.14)_0%,rgba(9,9,11,0.48)_82%)] group-hover:bg-[radial-gradient(circle_at_center,rgba(9,9,11,0.06)_0%,rgba(9,9,11,0.34)_82%)] transition-colors duration-300 z-10" />
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
      className="relative w-full bg-[#FFFFFF] dark:bg-[#09090B] py-24 sm:py-32 scroll-mt-20 overflow-x-clip transition-colors duration-300"
    >
      <SectionRailFrame>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-10">
          <div className="lg:col-span-7">
            <h2 className="text-[30px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-[1.08] text-[#09090B] dark:text-white text-balance">
              See the full workflow in six minutes
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[15.5px] text-[#52525B] dark:text-zinc-400 leading-[1.6] text-pretty">
              Walk through link shortening, Smart Routing, PathLock™ rules,
              Dynamic QR codes, and live Stripe revenue tracking, or jump
              straight to any chapter below.
            </p>
          </div>
        </div>

        {/* Clean 16:9 Video Frame + Integrated Chapters (strictly rounded-[10px]) */}
        <div className="rounded-[10px] border border-[#E4E7EC] dark:border-white/[0.10] bg-[#09090B] overflow-hidden">
          <div className="relative w-full aspect-video bg-[#09090B]">
            {!isPlayingStarted ? (
              <button
                type="button"
                onClick={() => startAndSeek(0, VIDEO_CHAPTERS[0].id)}
                aria-label="Play 6-minute LShorter product walkthrough video"
                className="group relative w-full h-full block text-left cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-[-2px]"
              >
                <EnglishCinemaPosterOverlay />

                <div className="relative z-20 w-full h-full flex flex-col items-center justify-center px-4">
                  <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-[10px] bg-[#0066FF] group-hover:bg-[#0055D4] text-white flex items-center justify-center shadow-[0_14px_36px_rgba(0,102,255,0.48)] group-hover:scale-105 active:scale-95 transition-transform duration-200">
                    <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-white ml-1" />
                  </span>
                  <span className="mt-4 px-3.5 py-1.5 rounded-[8px] bg-[#09090B]/90 backdrop-blur-md border border-white/15 text-white text-[13px] font-medium">
                    Play walkthrough (06:00)
                  </span>
                </div>
              </button>
            ) : (
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
            )}
          </div>

          {/* 6 Chapter Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y lg:divide-y-0 sm:divide-x divide-[#E4E7EC] dark:divide-white/[0.08] border-t border-[#E4E7EC] dark:border-white/[0.08] bg-white dark:bg-[#111216]">
            {VIDEO_CHAPTERS.map((ch) => {
              const isActive = activeChapterId === ch.id && isPlayingStarted;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => startAndSeek(ch.seconds, ch.id)}
                  className={`text-left px-4 py-3.5 transition-colors duration-150 cursor-pointer ${
                    isActive
                      ? "bg-[#0066FF] text-white"
                      : "hover:bg-[#F8F9FB] dark:hover:bg-white/[0.04] text-[#09090B] dark:text-zinc-200"
                  }`}
                >
                  <div
                    className={`font-mono text-[11.5px] font-medium tabular-nums mb-1 ${
                      isActive
                        ? "text-blue-100"
                        : "text-[#0066FF] dark:text-[#5294FF]"
                    }`}
                  >
                    {ch.time}
                  </div>
                  <div className="text-[13px] font-medium leading-snug">
                    {ch.label}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </SectionRailFrame>
    </section>
  );
}

export default DemoVideoSection;
