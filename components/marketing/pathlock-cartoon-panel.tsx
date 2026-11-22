"use client";

import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";

const CARTOON_CHAPTERS = [
  { id: "dilemma", label: "Scenario", sec: 0 },
  { id: "exposed", label: "No Lock", sec: 10 },
  { id: "setup", label: "PathLock™", sec: 19.7 },
  { id: "blocked", label: "403 Block", sec: 30.5 },
] as const;

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function PathLockCartoonPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(52);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting && !userPaused) {
          const p = video.play();
          if (p && typeof p.catch === "function") p.catch(() => {});
        } else {
          video.pause();
        }
      },
      { threshold: 0.28 },
    );

    observer.observe(container);
    return () => {
      observer.disconnect();
      video.pause();
    };
  }, [userPaused]);

  const activeChapter = (() => {
    let cur: string = CARTOON_CHAPTERS[0].id;
    for (const ch of CARTOON_CHAPTERS) {
      if (currentTime >= ch.sec - 0.25) cur = ch.id;
    }
    return cur;
  })();

  const handleTogglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      setUserPaused(false);
      video.play().catch(() => {});
    } else {
      setUserPaused(true);
      video.pause();
    }
  };

  const handleToggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    const next = !isMuted;
    video.muted = next;
    setIsMuted(next);
    if (!next && video.paused) {
      setUserPaused(false);
      video.play().catch(() => {});
    }
  };

  const handleJumpChapter = (sec: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = sec;
    setCurrentTime(sec);
    setUserPaused(false);
    video.play().catch(() => {});
  };

  const handleFullscreen = () => {
    const video = videoRef.current;
    if (!video) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
      return;
    }
    if (video.requestFullscreen) {
      video.requestFullscreen().catch(() => {});
    }
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const target = ratio * duration;
    video.currentTime = target;
    setCurrentTime(target);
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      ref={containerRef}
      className="min-w-0 overflow-hidden rounded-[10px] border border-white/12 dark:border-[#222225] bg-[#0F172A] dark:bg-[#111113] text-[#D4D4D8] shadow-[0_20px_56px_-20px_rgba(15,23,42,0.38)] dark:shadow-[0_24px_64px_-20px_rgba(0,0,0,0.7)]"
    >
      {/* Top Panel Bar (.bar) — Chapter Jump Tabs + Sound & Fullscreen */}
      <div className="flex h-[56px] items-center justify-between gap-2 border-b border-white/10 dark:border-[#222225] pl-4 pr-3">
        <div
          role="tablist"
          aria-label="PathLock cartoon scenes"
          className="flex items-center gap-1 overflow-x-auto"
        >
          {CARTOON_CHAPTERS.map((ch) => {
            const selected = activeChapter === ch.id;
            return (
              <button
                key={ch.id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => handleJumpChapter(ch.sec)}
                className={`h-8 shrink-0 rounded-[6px] px-3 text-[13.5px] font-medium whitespace-nowrap transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-2 ${
                  selected
                    ? "bg-white/[0.10] text-[#FAFAFA]"
                    : "bg-transparent text-[#A1A1AA] hover:text-[#FAFAFA]"
                }`}
              >
                {ch.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? "Unmute cartoon audio" : "Mute cartoon audio"}
            className="inline-flex h-8 items-center gap-1.5 rounded-[6px] border border-white/10 dark:border-[#222225] px-2.5 text-[13px] font-medium text-[#D4D4D8] hover:bg-white/[0.06] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-2"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 stroke-[1.6]" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 stroke-[1.6] text-[#529DFF]" />
            )}
            <span className="hidden sm:inline">{isMuted ? "Sound off" : "Sound on"}</span>
          </button>

          <button
            type="button"
            onClick={handleFullscreen}
            aria-label="Fullscreen cartoon video"
            className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border border-white/10 dark:border-[#222225] text-[#D4D4D8] hover:bg-white/[0.06] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-2"
          >
            <Maximize2 className="w-3.5 h-3.5 stroke-[1.6]" />
          </button>
        </div>
      </div>

      {/* Main 16:9 Animated Cartoon Stage */}
      <div className="group relative aspect-video w-full bg-[#0B0C10] overflow-hidden">
        <video
          ref={videoRef}
          src="/videos/pathlock-cartoon.mp4?v=3"
          poster="/videos/pathlock-cartoon-poster.jpg?v=3"
          muted={isMuted}
          loop
          playsInline
          preload="metadata"
          aria-label="Animated cartoon explaining LShorter PathLock URL perimeter security"
          onClick={handleTogglePlay}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => {
            if (Number.isFinite(e.currentTarget.duration) && e.currentTarget.duration > 0) {
              setDuration(e.currentTarget.duration);
            }
          }}
          className="h-full w-full object-cover cursor-pointer"
        />

        {/* Subtle Center Play Indicator when paused */}
        {!isPlaying && (
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label="Play PathLock cartoon explainer"
            className="absolute inset-0 m-auto flex size-14 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-[0_10px_28px_rgba(0,102,255,0.45)] transition-transform hover:scale-105 cursor-pointer"
          >
            <Play className="w-5 h-5 fill-white ml-0.5" />
          </button>
        )}

        {/* Bottom Scrub Bar — reveals cleanly on hover or pause so FR subtitles remain 100% unobstructed */}
        <div
          className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-3.5 pt-6 pb-2.5 transition-opacity duration-200 ${
            isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleTogglePlay}
              aria-label={isPlaying ? "Pause cartoon" : "Play cartoon"}
              className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
              )}
            </button>

            <div
              role="slider"
              aria-label="Video timeline"
              aria-valuemin={0}
              aria-valuemax={Math.round(duration)}
              aria-valuenow={Math.round(currentTime)}
              tabIndex={0}
              onClick={handleScrub}
              className="relative h-1.5 flex-1 rounded-full bg-white/25 cursor-pointer overflow-hidden"
            >
              <div
                style={{ width: `${progressPct}%` }}
                className="h-full rounded-full bg-[#0066FF]"
              />
            </div>

            <span className="font-mono text-[11px] text-white/85 tabular-nums shrink-0">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Status Bar (.foot) */}
      <div className="flex h-[48px] items-center justify-between gap-4 border-t border-white/10 dark:border-[#222225] px-4 sm:px-6 font-mono text-[12px] text-[#A1A1AA]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2 w-2 rounded-full bg-[#22C55E] shrink-0" />
          <b className="font-medium text-[#FAFAFA] shrink-0">PathLock™ Active</b>
          <span className="hidden sm:inline truncate text-[#A1A1AA]">
            52s animated demo
          </span>
        </div>
        <div className="shrink-0 text-[#A1A1AA]">/app/dashboard/*</div>
      </div>
    </div>
  );
}
