"use client";

import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export function ApiCartoonPanel() {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(54);

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
      { threshold: 0.25 },
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

  const handleScrubKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || duration <= 0) return;
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      const delta = e.key === "ArrowRight" ? 5 : -5;
      const target = Math.min(duration, Math.max(0, video.currentTime + delta));
      video.currentTime = target;
      setCurrentTime(target);
    }
  };

  const progressPct = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;

  return (
    <div
      ref={containerRef}
      className="group relative w-full aspect-video overflow-hidden rounded-2xl border border-[#E4E7EC] dark:border-white/10 bg-[#FFF8F3] dark:bg-[#111216] shadow-2xl flex items-center justify-center"
    >
      <video
        ref={videoRef}
        src="/videos/api-cartoon.mp4?v=1"
        poster="/videos/api-cartoon-poster.jpg?v=1"
        muted={isMuted}
        loop
        playsInline
        preload="metadata"
        aria-label="Animated cartoon explaining everything possible with the LShorter REST API"
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

      {/* Subtle Center Play Button when paused */}
      {!isPlaying && (
        <button
          type="button"
          onClick={handleTogglePlay}
          aria-label="Play LShorter API cartoon walkthrough"
          className="absolute inset-0 m-auto flex size-14 items-center justify-center rounded-full bg-[#0066FF] text-white shadow-[0_10px_28px_rgba(0,102,255,0.45)] transition-transform hover:scale-105 cursor-pointer"
        >
          <Play className="w-5 h-5 fill-white ml-0.5" />
        </button>
      )}

      {/* Unobtrusive Floating Overlay Controls — visible on hover or pause */}
      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-4 pt-8 pb-3 transition-opacity duration-200 ${
          isPlaying ? "opacity-0 group-hover:opacity-100" : "opacity-100"
        }`}
      >
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? "Pause API cartoon" : "Play API cartoon"}
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
            onKeyDown={handleScrubKeyDown}
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
