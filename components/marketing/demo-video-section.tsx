"use client";

import React, { useState, useCallback } from "react";
import { SectionRailFrame } from "@/components/marketing/swiss-frame";
import { Skiper67 } from "@/components/ui/skiper67";

/**
 * Easy-to-swap demo video source & thumbnail.
 * Thumbnail copied from `LShorter-Cartoon-Full-6min-4K-v4-Thumbnail-1080p.png`.
 */
export const DEMO_VIDEO_SRC =
  process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "/videos/demo-walkthrough.mp4";
export const DEMO_VIDEO_THUMBNAIL = "/videos/demo-walkthrough-thumbnail.png";

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
  {
    id: "analytics",
    time: "05:20",
    seconds: 320,
    label: "Live analytics & revenue",
  },
];

export function DemoVideoSection() {
  const [isPopOverOpen, setIsPopOverOpen] = useState(false);
  const [seekSeconds, setSeekSeconds] = useState<number | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string>(
    VIDEO_CHAPTERS[0].id
  );

  const handleOpenAtChapter = useCallback(
    (seconds: number, chapterId: string) => {
      setActiveChapterId(chapterId);
      setSeekSeconds(seconds);
      setIsPopOverOpen(true);
    },
    []
  );

  const handleTimeUpdate = useCallback((t: number) => {
    let current = VIDEO_CHAPTERS[0].id;
    for (const ch of VIDEO_CHAPTERS) {
      if (t >= ch.seconds) current = ch.id;
    }
    setActiveChapterId(current);
  }, []);

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
              Dynamic QR codes, and live revenue tracking, or jump straight to
              any chapter below.
            </p>
          </div>
        </div>

        {/* Redesigned Skiper67 Interactive Video Stage + PopOver Player + 6 Chapter Jump Controls */}
        <div className="rounded-[10px] border border-[#E4E7EC] dark:border-white/[0.10] overflow-hidden bg-[#F5F4F3] dark:bg-[#111216]">
          <Skiper67
            videoSrc={DEMO_VIDEO_SRC}
            thumbnailSrc={DEMO_VIDEO_THUMBNAIL}
            thumbnailAlt="LShorter 6-minute 4K walkthrough thumbnail"
            caption="Click the video to play"
            initialSeekSeconds={seekSeconds}
            isOpen={isPopOverOpen}
            onOpenChange={setIsPopOverOpen}
            onTimeUpdate={handleTimeUpdate}
            className="border-0 rounded-none"
          />

          {/* 6 Chapter Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y lg:divide-y-0 sm:divide-x divide-[#E4E7EC] dark:divide-white/[0.08] border-t border-[#E4E7EC] dark:border-white/[0.08] bg-white dark:bg-[#111216]">
            {VIDEO_CHAPTERS.map((ch) => {
              const isActive = activeChapterId === ch.id && isPopOverOpen;
              return (
                <button
                  key={ch.id}
                  type="button"
                  onClick={() => handleOpenAtChapter(ch.seconds, ch.id)}
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
