"use client";

import React, { useState, useCallback } from "react";
import { SectionRailFrame } from "@/components/marketing/swiss-frame";
import { Skiper67 } from "@/components/ui/skiper67";

type VideoLang = "en" | "fr";

export interface VideoChapter {
  id: string;
  time: string;
  seconds: number;
  label: string;
}

const DEMO_VIDEO_SOURCES: Record<
  VideoLang,
  { src: string; poster: string; chapters: VideoChapter[] }
> = {
  en: {
    src: "/videos/demo-walkthrough-en.mp4?v=2",
    poster: "/videos/demo-walkthrough-en-poster.jpg?v=2",
    chapters: [
      { id: "intro", time: "00:00", seconds: 0, label: "What is a link shortener" },
      { id: "dashboard", time: "01:29", seconds: 89, label: "Dashboard & links" },
      { id: "tools", time: "02:02", seconds: 122, label: "Smart routing, PathLock & QR" },
      { id: "analytics", time: "04:04", seconds: 244, label: "Analytics & real sales" },
      { id: "api", time: "05:04", seconds: 304, label: "Integration API & 5 SDKs" },
      { id: "offer", time: "05:57", seconds: 357, label: "Launch offer -75% Pro" },
    ],
  },
  fr: {
    src: "/videos/demo-walkthrough-fr.mp4?v=2",
    poster: "/videos/demo-walkthrough-fr-poster.jpg?v=2",
    chapters: [
      { id: "intro", time: "00:00", seconds: 0, label: "What is a link shortener" },
      { id: "dashboard", time: "01:32", seconds: 92, label: "Dashboard & links" },
      { id: "tools", time: "02:09", seconds: 129, label: "Smart routing, PathLock & QR" },
      { id: "analytics", time: "04:07", seconds: 247, label: "Analytics & real sales" },
      { id: "api", time: "05:07", seconds: 307, label: "Integration API & 5 SDKs" },
      { id: "offer", time: "06:01", seconds: 361, label: "Launch offer -75% Pro" },
    ],
  },
};

export function DemoVideoSection() {
  const [lang, setLang] = useState<VideoLang>("en");
  const [isPopOverOpen, setIsPopOverOpen] = useState(false);
  const [seekSeconds, setSeekSeconds] = useState<number | null>(null);
  const [activeChapterId, setActiveChapterId] = useState<string>("intro");

  const activeSource = DEMO_VIDEO_SOURCES[lang];
  const chapters = activeSource.chapters;

  const handleOpenAtChapter = useCallback(
    (seconds: number, chapterId: string) => {
      setActiveChapterId(chapterId);
      setSeekSeconds(seconds);
      setIsPopOverOpen(true);
    },
    []
  );

  const handleTimeUpdate = useCallback(
    (t: number) => {
      let current = chapters[0].id;
      for (const ch of chapters) {
        if (t >= ch.seconds) current = ch.id;
      }
      setActiveChapterId(current);
    },
    [chapters]
  );

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
          <div className="lg:col-span-5 flex flex-col items-start lg:items-end gap-4">
            <p className="text-[15.5px] text-[#52525B] dark:text-zinc-400 leading-[1.6] text-pretty lg:text-right">
              Start from what a link shortener does, explore Smart Routing,
              PathLock™, Dynamic QR codes, revenue analytics, and our
              integration API — available in English and French.
            </p>
            <div
              role="group"
              aria-label="Demo video language"
              className="inline-flex items-center rounded-full border border-[#E4E7EC] dark:border-white/12 bg-[#F8F9FB] dark:bg-white/[0.04] p-1"
            >
              {(
                [
                  { code: "en", label: "English" },
                  { code: "fr", label: "Français" },
                ] as const
              ).map(({ code, label }) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLang(code)}
                  aria-pressed={lang === code}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors cursor-pointer ${
                    lang === code
                      ? "bg-[#0066FF] text-white shadow-xs"
                      : "text-[#52525B] dark:text-zinc-400 hover:text-[#09090B] dark:hover:text-white"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Redesigned Skiper67 Interactive Video Stage + PopOver Player + 6 Chapter Jump Controls */}
        <div
          data-parallax="float"
          data-parallax-depth="0.065"
          data-parallax-max="32"
          className="rounded-[10px] border border-[#E4E7EC] dark:border-white/[0.10] overflow-hidden bg-[#F5F4F3] dark:bg-[#111216]"
        >
          <Skiper67
            videoSrc={activeSource.src}
            thumbnailSrc={activeSource.poster}
            thumbnailAlt={`LShorter 6-minute product walkthrough (${lang.toUpperCase()})`}
            caption="Click the video to play"
            initialSeekSeconds={seekSeconds}
            isOpen={isPopOverOpen}
            onOpenChange={setIsPopOverOpen}
            onTimeUpdate={handleTimeUpdate}
            lang={lang}
            onLangChange={setLang}
            className="border-0 rounded-none"
          />

          {/* 6 Chapter Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 divide-y lg:divide-y-0 sm:divide-x divide-[#E4E7EC] dark:divide-white/[0.08] border-t border-[#E4E7EC] dark:border-white/[0.08] bg-white dark:bg-[#111216]">
            {chapters.map((ch) => {
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
