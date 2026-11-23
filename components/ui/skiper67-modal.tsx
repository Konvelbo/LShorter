"use client";

import { motion } from "motion/react";
import { Plus } from "lucide-react";
import {
  MediaControlBar,
  MediaController,
  MediaFullscreenButton,
  MediaMuteButton,
  MediaPlayButton,
  MediaSeekBackwardButton,
  MediaSeekForwardButton,
  MediaTimeDisplay,
  MediaTimeRange,
  MediaVolumeRange,
} from "media-chrome/react";
import type { ComponentProps } from "react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";

export type VideoPlayerProps = ComponentProps<typeof MediaController>;

export const VideoPlayer = ({ style, ...props }: VideoPlayerProps) => (
  <MediaController style={{ ...style }} {...props} />
);

export type VideoPlayerControlBarProps = ComponentProps<typeof MediaControlBar>;

export const VideoPlayerControlBar = (props: VideoPlayerControlBarProps) => (
  <MediaControlBar {...props} />
);

export type VideoPlayerTimeRangeProps = ComponentProps<typeof MediaTimeRange>;

export const VideoPlayerTimeRange = ({
  className,
  ...props
}: VideoPlayerTimeRangeProps) => (
  <MediaTimeRange
    className={cn(
      "[--media-range-thumb-opacity:0] [--media-range-track-height:2px]",
      className
    )}
    {...props}
  />
);

export type VideoPlayerTimeDisplayProps = ComponentProps<typeof MediaTimeDisplay>;

export const VideoPlayerTimeDisplay = ({
  className,
  ...props
}: VideoPlayerTimeDisplayProps) => (
  <MediaTimeDisplay className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerVolumeRangeProps = ComponentProps<typeof MediaVolumeRange>;

export const VideoPlayerVolumeRange = ({
  className,
  ...props
}: VideoPlayerVolumeRangeProps) => (
  <MediaVolumeRange className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerPlayButtonProps = ComponentProps<typeof MediaPlayButton>;

export const VideoPlayerPlayButton = ({
  className,
  ...props
}: VideoPlayerPlayButtonProps) => (
  <MediaPlayButton className={cn("", className)} {...props} />
);

export type VideoPlayerSeekBackwardButtonProps = ComponentProps<
  typeof MediaSeekBackwardButton
>;

export const VideoPlayerSeekBackwardButton = ({
  className,
  ...props
}: VideoPlayerSeekBackwardButtonProps) => (
  <MediaSeekBackwardButton className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerSeekForwardButtonProps = ComponentProps<
  typeof MediaSeekForwardButton
>;

export const VideoPlayerSeekForwardButton = ({
  className,
  ...props
}: VideoPlayerSeekForwardButtonProps) => (
  <MediaSeekForwardButton className={cn("p-2.5", className)} {...props} />
);

export type VideoPlayerMuteButtonProps = ComponentProps<typeof MediaMuteButton>;

export const VideoPlayerMuteButton = ({
  className,
  ...props
}: VideoPlayerMuteButtonProps) => (
  <MediaMuteButton className={cn("", className)} {...props} />
);

export type VideoPlayerFullscreenButtonProps = ComponentProps<
  typeof MediaFullscreenButton
>;

export const VideoPlayerFullscreenButton = ({
  className,
  ...props
}: VideoPlayerFullscreenButtonProps) => (
  <MediaFullscreenButton className={cn("", className)} {...props} />
);

export type VideoPlayerContentProps = ComponentProps<"video">;

export const VideoPlayerContent = ({
  className,
  ...props
}: VideoPlayerContentProps) => (
  <video className={cn("mb-0 mt-0", className)} {...props} />
);

export interface VideoPopOverProps {
  videoSrc: string;
  thumbnailSrc: string;
  initialSeekSeconds?: number | null;
  onTimeUpdate?: (currentTime: number) => void;
  lang?: "en" | "fr";
  onLangChange?: (lang: "en" | "fr") => void;
  setShowVideoPopOver: (showVideoPopOver: boolean) => void;
}

export const VideoPopOver = ({
  videoSrc,
  thumbnailSrc,
  initialSeekSeconds,
  onTimeUpdate,
  lang,
  onLangChange,
  setShowVideoPopOver,
}: VideoPopOverProps) => {
  const { tr } = useI18n();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controllerRef = useRef<HTMLElement | null>(null);
  const pendingRatioRef = useRef<number | null>(null);

  const [canStartPlayback, setCanStartPlayback] = useState(false);

  const handleSwitchLang = (next: "en" | "fr") => {
    if (!onLangChange || next === lang) return;
    const v = videoRef.current;
    if (v && Number.isFinite(v.duration) && v.duration > 0) {
      pendingRatioRef.current = v.currentTime / v.duration;
    }
    onLangChange(next);
  };

  const handleClose = useCallback(() => {
    try {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
      videoRef.current?.pause();
    } catch {}
    setShowVideoPopOver(false);
  }, [setShowVideoPopOver]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) {
        handleClose();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleClose]);

  useEffect(() => {
    if (!canStartPlayback) return;
    const v = videoRef.current;
    if (!v) return;
    if (
      typeof initialSeekSeconds === "number" &&
      initialSeekSeconds > 0 &&
      v.readyState >= 1
    ) {
      v.currentTime = initialSeekSeconds;
    }
    v.play().catch(() => {});
  }, [canStartPlayback, initialSeekSeconds]);

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    if (pendingRatioRef.current !== null && Number.isFinite(v.duration) && v.duration > 0) {
      v.currentTime = Math.min(v.duration - 0.1, Math.max(0, pendingRatioRef.current * v.duration));
      pendingRatioRef.current = null;
    } else if (typeof initialSeekSeconds === "number" && initialSeekSeconds > 0) {
      v.currentTime = initialSeekSeconds;
    }
    if (canStartPlayback) {
      v.play().catch(() => {});
    }
  };

  const handleDoubleClickVideo = () => {
    const el = controllerRef.current || videoRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={tr("LShorter Walkthrough Video Player", "Lecteur vidéo de démonstration LShorter")}
      className="fixed inset-0 z-[10060] flex h-screen w-screen items-center justify-center p-4 sm:p-8"
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.16, ease: "easeOut" }}
        className="absolute inset-0 bg-black/90"
        onClick={handleClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{
          duration: 0.22,
          ease: [0.16, 1, 0.3, 1],
        }}
        onAnimationComplete={() => setCanStartPlayback(true)}
        className="relative z-10 aspect-video w-full max-w-6xl overflow-hidden rounded-[10px] border border-white/15 bg-black shadow-[0_28px_80px_rgba(0,0,0,0.85)] will-change-transform"
      >
        <VideoPlayer
          ref={controllerRef as any}
          autohide="3"
          style={{
            width: "100%",
            height: "100%",
            display: "block",
            backgroundColor: "#000000",
          }}
        >
          <VideoPlayerContent
            ref={videoRef}
            src={videoSrc}
            poster={thumbnailSrc}
            playsInline
            preload="metadata"
            slot="media"
            onDoubleClick={handleDoubleClickVideo}
            onLoadedMetadata={handleLoadedMetadata}
            onTimeUpdate={(e) =>
              onTimeUpdate?.((e.currentTarget as HTMLVideoElement).currentTime)
            }
            className="h-full w-full object-contain bg-black"
            style={{ width: "100%", height: "100%" }}
          />

          <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
            {lang && onLangChange && (
              <div
                role="group"
                aria-label={tr("Video language", "Langue de la vidéo")}
                className="inline-flex items-center rounded-[8px] border border-white/15 bg-black/75 p-0.5 backdrop-blur-md"
              >
                {(["en", "fr"] as const).map((code) => (
                  <button
                    key={code}
                    type="button"
                    onClick={() => handleSwitchLang(code)}
                    aria-pressed={lang === code}
                    className={`px-2.5 py-1 rounded-[6px] font-mono text-[11px] font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
                      lang === code
                        ? "bg-[#0066FF] text-white"
                        : "text-white/75 hover:text-white"
                    }`}
                  >
                    {code}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              aria-label={tr("Close video player", "Fermer le lecteur vidéo")}
              onClick={handleClose}
              className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-black/75 hover:bg-black/95 border border-white/15 text-white transition-colors cursor-pointer"
            >
              <Plus className="size-5 rotate-45 text-white" />
            </button>
          </div>

          <VideoPlayerControlBar className="absolute bottom-0 left-1/2 flex w-full max-w-6xl -translate-x-1/2 items-center justify-center gap-1.5 bg-gradient-to-t from-black/95 via-black/75 to-transparent px-4 py-2.5 md:px-6 md:py-3 [--media-background-color:transparent] [--media-control-background:transparent] [--media-control-hover-background:rgba(255,255,255,0.14)] [--media-primary-color:#ffffff] [--media-secondary-color:rgba(255,255,255,0.85)] [--media-range-bar-color:#0066FF]">
            <VideoPlayerPlayButton className="h-8 w-8 rounded-[6px] bg-transparent" />
            <VideoPlayerSeekBackwardButton
              seekOffset={10}
              className="hidden sm:inline-flex h-8 bg-transparent"
            />
            <VideoPlayerSeekForwardButton
              seekOffset={10}
              className="hidden sm:inline-flex h-8 bg-transparent"
            />
            <VideoPlayerTimeRange className="flex-1 bg-transparent px-2" />
            <VideoPlayerTimeDisplay
              showDuration
              className="text-xs font-mono text-white bg-transparent"
            />
            <VideoPlayerMuteButton className="h-8 w-8 rounded-[6px] bg-transparent" />
            <VideoPlayerVolumeRange className="hidden md:inline-flex w-24 bg-transparent" />
            <VideoPlayerFullscreenButton className="h-8 w-8 rounded-[6px] bg-transparent" />
          </VideoPlayerControlBar>
        </VideoPlayer>
      </motion.div>
    </div>
  );
};

export default VideoPopOver;
