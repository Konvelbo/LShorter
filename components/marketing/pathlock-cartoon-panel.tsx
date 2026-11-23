"use client";

import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

type VideoLang = "en" | "fr";

const PATHLOCK_SOURCES: Record<VideoLang, { src: string; poster: string; defaultDuration: number }> = {
  en: {
    src: "/videos/pathlock-cartoon-en.mp4?v=1",
    poster: "/videos/pathlock-cartoon-en-poster.jpg?v=1",
    defaultDuration: 190.4,
  },
  fr: {
    src: "/videos/pathlock-cartoon-fr.mp4?v=1",
    poster: "/videos/pathlock-cartoon-fr-poster.jpg?v=1",
    defaultDuration: 185.4,
  },
};

export function PathLockCartoonPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingResumeRef = useRef<{ ratio: number; shouldPlay: boolean } | null>(null);
  const [lang, setLang] = useState<VideoLang>("en");
  const [isPlaying, setIsPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(PATHLOCK_SOURCES.en.defaultDuration);

  const handleSwitchLang = (nextLang: VideoLang, e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextLang === lang) return;
    const video = videoRef.current;
    const ratio = video && duration > 0 ? video.currentTime / duration : 0;
    const shouldPlay = video ? !video.paused : false;
    pendingResumeRef.current = { ratio, shouldPlay };
    setLang(nextLang);
    setDuration(PATHLOCK_SOURCES[nextLang].defaultDuration);
  };

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

  const handleToggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
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

  const handleFullscreen = (e: React.MouseEvent) => {
    e.stopPropagation();
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
    e.stopPropagation();
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
      data-parallax="float"
      data-parallax-depth="0.075"
      data-parallax-max="32"
      className="group relative w-full h-full aspect-video lg:aspect-auto overflow-hidden rounded-[10px] border border-[#E4E7EC] dark:border-[#222225] bg-[#F6F7FA] dark:bg-[#111216] shadow-[0_18px_48px_-20px_rgba(15,23,42,0.16)] dark:shadow-[0_24px_64px_-20px_rgba(0,0,0,0.65)] flex items-center justify-center"
    >
      <video
        ref={videoRef}
        src={PATHLOCK_SOURCES[lang].src}
        poster={PATHLOCK_SOURCES[lang].poster}
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
          const v = e.currentTarget;
          if (Number.isFinite(v.duration) && v.duration > 0) {
            setDuration(v.duration);
            if (pendingResumeRef.current) {
              const { ratio, shouldPlay } = pendingResumeRef.current;
              pendingResumeRef.current = null;
              v.currentTime = Math.min(v.duration - 0.1, Math.max(0, ratio * v.duration));
              if (shouldPlay) v.play().catch(() => {});
            }
          }
        }}
        className="h-full w-full object-contain cursor-pointer"
      />

      {/* Sleek EN / FR Language Switcher */}
      <div
        role="group"
        aria-label="Video language"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-3 top-3 z-20 inline-flex items-center rounded-full border border-white/20 bg-black/65 p-0.5 backdrop-blur-md shadow-md"
      >
        {(["en", "fr"] as const).map((code) => (
          <button
            key={code}
            type="button"
            onClick={(e) => handleSwitchLang(code, e)}
            aria-pressed={lang === code}
            className={`px-2.5 py-1 rounded-full font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
              lang === code
                ? "bg-[#0066FF] text-white shadow-xs"
                : "text-white/75 hover:text-white"
            }`}
          >
            {code}
          </button>
        ))}
      </div>

      {/* Subtle Center Play Button when paused */}
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

      {/* Unobtrusive Floating Overlay Controls — visible on hover or pause only */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pt-8 pb-3 transition-opacity duration-200 ${
          isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? "Pause cartoon" : "Play cartoon"}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
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
            className="relative h-1.5 flex-1 rounded-full bg-white/30 cursor-pointer overflow-hidden"
          >
            <div
              style={{ width: `${progressPct}%` }}
              className="h-full rounded-full bg-[#0066FF]"
            />
          </div>

          <span className="font-mono text-[11.5px] text-white/90 tabular-nums shrink-0">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          <button
            type="button"
            onClick={handleToggleMute}
            aria-label={isMuted ? "Unmute cartoon audio" : "Mute cartoon audio"}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5" />
            ) : (
              <Volume2 className="w-3.5 h-3.5 text-[#60A5FA]" />
            )}
          </button>

          <button
            type="button"
            onClick={handleFullscreen}
            aria-label="Fullscreen cartoon video"
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
