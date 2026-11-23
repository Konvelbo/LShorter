"use client";

import React, { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";

function formatTime(sec: number) {
  const s = Math.max(0, Math.floor(sec));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

type VideoLang = "en" | "fr";

const VIDEO_SOURCES: Record<VideoLang, { src: string; poster: string; defaultDuration: number }> = {
  en: {
    src: "/videos/api-cartoon-en.mp4?v=2",
    poster: "/videos/api-cartoon-en-poster.jpg?v=2",
    defaultDuration: 58.6,
  },
  fr: {
    src: "/videos/api-cartoon-fr.mp4?v=2",
    poster: "/videos/api-cartoon-fr-poster.jpg?v=2",
    defaultDuration: 62.6,
  },
};

export function ApiCartoonPanel() {
  const { locale, tr } = useI18n();
  const initialLang: VideoLang = locale === "fr" ? "fr" : "en";
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const pendingResumeRef = useRef<{ ratio: number; shouldPlay: boolean } | null>(null);
  const prevLocaleRef = useRef<VideoLang>(initialLang);
  const [lang, setLang] = useState<VideoLang>(initialLang);
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userPaused, setUserPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(VIDEO_SOURCES[initialLang].defaultDuration);

  // Keep video language synchronized with global site locale while preserving
  // manual switcher overrides and lazy loading (`shouldLoad`).
  useEffect(() => {
    const nextLang: VideoLang = locale === "fr" ? "fr" : "en";
    if (prevLocaleRef.current === nextLang) return;
    prevLocaleRef.current = nextLang;
    if (lang === nextLang) return;

    const video = videoRef.current;
    if (video && shouldLoad) {
      const ratio = duration > 0 ? video.currentTime / duration : 0;
      const shouldPlay = !video.paused;
      pendingResumeRef.current = { ratio, shouldPlay };
    }
    setLang(nextLang);
    setDuration(VIDEO_SOURCES[nextLang].defaultDuration);
  }, [locale, lang, duration, shouldLoad]);

  const handleSwitchLang = (nextLang: VideoLang, e: React.MouseEvent) => {
    e.stopPropagation();
    if (nextLang === lang) return;
    setShouldLoad(true);
    const video = videoRef.current;
    const ratio = video && duration > 0 ? video.currentTime / duration : 0;
    const shouldPlay = video ? !video.paused : false;
    pendingResumeRef.current = { ratio, shouldPlay };
    setLang(nextLang);
    setDuration(VIDEO_SOURCES[nextLang].defaultDuration);
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container || shouldLoad) return;
    const preloadObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setShouldLoad(true);
          preloadObserver.disconnect();
        }
      },
      { rootMargin: "350px 0px", threshold: 0.01 },
    );
    preloadObserver.observe(container);
    return () => preloadObserver.disconnect();
  }, [shouldLoad]);

  useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video || !shouldLoad) return;

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
  }, [userPaused, shouldLoad]);

  const handleTogglePlay = () => {
    if (!shouldLoad) {
      setShouldLoad(true);
      setUserPaused(false);
      pendingResumeRef.current = { ratio: 0, shouldPlay: true };
      return;
    }
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
        src={shouldLoad ? VIDEO_SOURCES[lang].src : undefined}
        poster={VIDEO_SOURCES[lang].poster}
        muted={isMuted}
        loop
        playsInline
        preload={shouldLoad ? "metadata" : "none"}
        aria-label={tr(
          "Animated cartoon explaining everything possible with the LShorter REST API",
          "Dessin animé expliquant tout ce qui est possible avec l'API REST LShorter"
        )}
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
        className="h-full w-full object-cover cursor-pointer"
      />

      {/* Sleek EN / FR Language Switcher */}
      <div
        role="group"
        aria-label={tr("Video language", "Langue de la vidéo")}
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
          aria-label={tr(
            "Play LShorter API cartoon walkthrough",
            "Lire la vidéo animée de présentation de l'API LShorter"
          )}
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
            aria-label={
              isPlaying
                ? tr("Pause API cartoon", "Mettre en pause la vidéo API")
                : tr("Play API cartoon", "Lire la vidéo API")
            }
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
            aria-label={tr("Video timeline", "Barre de progression de la vidéo")}
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
            aria-label={
              isMuted
                ? tr("Unmute cartoon audio", "Activer le son de la vidéo")
                : tr("Mute cartoon audio", "Couper le son de la vidéo")
            }
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
            aria-label={tr("Fullscreen cartoon video", "Afficher la vidéo en plein écran")}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
