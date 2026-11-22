"use client";

import * as React from "react";
import Link from "next/link";
import { motion, useInView } from "motion/react";
import { Check, ChevronRight, Pause, Play } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const EASE_OUT_EXPO: [number, number, number, number] = [0.16, 1, 0.3, 1];
const EASE_SMOOTH: [number, number, number, number] = [0.42, 0, 0, 1];

/* ---------- odometer ---------- */

function Reel({
  digit,
  lh,
  delay,
}: {
  digit: number;
  lh: number;
  delay: number;
}) {
  return (
    <span
      className="inline-block overflow-hidden align-top"
      style={{ height: lh }}
    >
      <motion.span
        className="flex flex-col"
        initial={{ y: 0 }}
        animate={{ y: -digit * lh }}
        transition={{ duration: 1.4, ease: EASE_OUT_EXPO, delay }}
      >
        {Array.from({ length: 10 }).map((_, d) => (
          <span
            key={d}
            className="block"
            style={{ height: lh, lineHeight: `${lh}px` }}
          >
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  );
}

export function Odometer({
  value,
  size,
  run,
  suffix,
}: {
  value: number;
  size: number;
  run: boolean;
  suffix?: string;
}) {
  const lh = Math.round(size * 1.05);
  const chars = String(value).split("");
  return (
    <span
      className="inline-flex tabular-nums"
      style={{ fontSize: size, height: lh, lineHeight: `${lh}px` }}
      role="img"
      aria-label={`${value}${suffix ?? ""}`}
    >
      <span aria-hidden className="inline-flex select-none">
        {chars.map((c, i) => (
          <Reel
            key={i}
            digit={run ? Number(c) : 0}
            lh={lh}
            delay={0.35 + i * 0.08}
          />
        ))}
        {suffix && <span>{suffix}</span>}
      </span>
    </span>
  );
}

/* ---------- visuals ---------- */

export interface ChecklistVisualProps {
  title: string;
  rows: { label: string; value: string }[];
  stat: { value: number; suffix?: string; label: string };
}

export function ChecklistVisual({ title, rows, stat }: ChecklistVisualProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.22 });

  return (
    <div ref={ref} className="relative mt-12 w-[min(410px,82vw)]">
      <motion.div
        className="absolute -right-1 -top-16 z-10 rounded-[10px] border border-white/15 bg-[#0b1424] px-5 py-3.5 text-white shadow-[0_18px_40px_-14px_rgba(0,0,0,0.6)] md:-right-8"
        initial={{ opacity: 0, y: 20 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.7, ease: EASE_SMOOTH, delay: inView ? 0.14 : 0 }}
      >
        <div className="font-semibold tracking-[-0.03em]">
          <Odometer
            value={stat.value}
            size={40}
            run={inView}
            suffix={stat.suffix}
          />
        </div>
        <p className="mt-0.5 text-[12px] text-white/65">{stat.label}</p>
      </motion.div>

      <motion.div
        className="rounded-[10px] border border-white/15 bg-white/[0.08] p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)]"
        initial={{ opacity: 0, y: 44 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 44 }}
        transition={{ duration: 0.8, ease: EASE_SMOOTH }}
      >
        <div className="rounded-[8px] bg-white p-4">
          <p className="pb-3 text-[13.5px] font-semibold tracking-[-0.01em] text-[#0b1424]">
            {title}
          </p>
          <ul>
            {rows.map((r, i) => (
              <motion.li
                key={r.label}
                className="flex items-center justify-between gap-4 border-t border-black/[0.07] py-2.5 text-[13px]"
                initial={{ opacity: 0, y: 12 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                transition={{
                  duration: 0.6,
                  ease: EASE_SMOOTH,
                  delay: inView ? 0.25 + i * 0.08 : 0,
                }}
              >
                <span className="flex items-center gap-2 text-black/70">
                  <motion.span
                    className="grid size-4 shrink-0 place-items-center rounded-full bg-[#0b1424] text-white"
                    initial={{ scale: 0 }}
                    animate={inView ? { scale: 1 } : { scale: 0 }}
                    transition={{
                      type: "spring",
                      bounce: 0.45,
                      duration: 0.45,
                      delay: inView ? 0.55 + i * 0.14 : 0,
                    }}
                  >
                    <Check className="size-2.5" strokeWidth={3} />
                  </motion.span>
                  {r.label}
                </span>
                <span className="font-medium text-[#0b1424]">{r.value}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.div>
    </div>
  );
}

export interface TimelineVisualStage {
  label: string;
  years?: number;
  value?: number;
}

export interface TimelineVisualProps {
  title: string;
  stages: TimelineVisualStage[];
  total: number;
  totalLabel?: string;
  ticks?: (string | number)[];
  badgeLabel?: string;
  note: string;
}

export function TimelineVisual({
  title,
  stages,
  total,
  totalLabel,
  ticks,
  badgeLabel = "Then",
  note,
}: TimelineVisualProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: false, amount: 0.22 });
  let acc = 0;

  const axisTicks =
    ticks ?? Array.from({ length: total + 1 }, (_, i) => String(i));

  return (
    <div ref={ref} className="w-[min(450px,80vw)]">
      <motion.div
        className="w-full rounded-[10px] border border-white/15 bg-[#0b1424]/90 p-5 text-white shadow-[0_14px_32px_-12px_rgba(0,0,0,0.45)] will-change-[transform,opacity]"
        initial={{ opacity: 0, y: 44 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 44 }}
        transition={{ duration: 0.8, ease: EASE_SMOOTH }}
      >
      <div className="flex items-baseline justify-between gap-3 text-[13.5px]">
        <span className="font-medium text-white">{title}</span>
        <span className="font-mono text-[12px] text-white/55 tabular-nums">
          {totalLabel ?? `${total} years`}
        </span>
      </div>
      <div className="mt-4 flex h-10 overflow-hidden rounded-[6px] bg-white/10">
        {stages.map((s, i) => {
          const amount = s.value ?? s.years ?? 0;
          const start = acc;
          acc += amount;
          return (
            <motion.div
              key={s.label}
              className={cn(
                "flex h-full items-center px-3 text-[12px] font-medium",
                i === 0
                  ? "bg-white text-[#0b1424]"
                  : "bg-[#c9d6ff] text-[#0b1424]",
              )}
              style={{
                width: `${(amount / total) * 100}%`,
                transformOrigin: "left",
              }}
              initial={{ scaleX: 0 }}
              animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
              transition={{
                duration: 0.65,
                ease: EASE_SMOOTH,
                delay: inView ? 0.2 + (start / total) * 0.5 : 0,
              }}
            >
              <span className="truncate">{s.label}</span>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between font-mono text-[11px] text-white/45 tabular-nums">
        {axisTicks.map((tick, i) => (
          <span key={i}>{tick}</span>
        ))}
      </div>
      <motion.p
        className="mt-4 flex items-center gap-2 text-[13px] text-white/75"
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
        transition={{ delay: inView ? 0.85 : 0, duration: 0.45 }}
      >
        <span className="shrink-0 rounded-[4px] bg-[#f2b24c] px-1.5 py-0.5 text-[11px] font-semibold text-[#0b1424]">
          {badgeLabel}
        </span>
        <span>{note}</span>
      </motion.p>
      </motion.div>
    </div>
  );
}

/* ---------- tutorial video visual ---------- */

export interface VideoTutorialVisualProps {
  src: string;
  poster?: string;
  label: string;
  ariaLabel: string;
}

export function VideoTutorialVisual({
  src,
  poster,
  label,
  ariaLabel,
}: VideoTutorialVisualProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [userPaused, setUserPaused] = React.useState(false);
  const [isPlaying, setIsPlaying] = React.useState(false);

  React.useEffect(() => {
    const container = containerRef.current;
    const video = videoRef.current;
    if (!container || !video) return;

    let playTimer: number | null = null;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (playTimer !== null) {
          window.clearTimeout(playTimer);
          playTimer = null;
        }
        if (entry.isIntersecting && !userPaused) {
          // Debounce playback start so rapid scrolling past multiple video rows
          // never spins up 4 hardware video decoders synchronously mid-scroll.
          playTimer = window.setTimeout(() => {
            const p = video.play();
            if (p && typeof p.catch === "function") {
              p.catch(() => {});
            }
          }, 150);
        } else {
          video.pause();
        }
      },
      { threshold: 0.35 },
    );

    observer.observe(container);
    return () => {
      if (playTimer !== null) window.clearTimeout(playTimer);
      observer.disconnect();
      video.pause();
    };
  }, [userPaused]);

  const togglePlayback = () => {
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

  return (
    <div
      ref={containerRef}
      className="w-full max-w-[560px] rounded-[10px] border border-white/15 bg-white/[0.08] p-2 shadow-[0_12px_28px_-10px_rgba(0,0,0,0.42)] [contain:layout_paint]"
    >
      <div className="group/vid relative aspect-video w-full overflow-hidden rounded-[8px] bg-[#0b1424] transform-gpu">
        <video
          ref={videoRef}
          src={src}
          poster={poster}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={ariaLabel}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          className="h-full w-full object-cover object-top transform-gpu [backface-visibility:hidden]"
        />

        {/* Subtle bottom-left product label (keeps dashboard header clear) */}
        <div className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-[6px] border border-white/15 bg-[#0b1424]/85 px-2.5 py-1 text-[11px] font-medium text-white">
          <span
            className={cn(
              "size-1.5 rounded-full transition-colors",
              isPlaying ? "bg-emerald-400" : "bg-white/50",
            )}
          />
          <span>{label}</span>
        </div>

        {/* Manual Play/Pause button */}
        <button
          type="button"
          onClick={togglePlayback}
          aria-label={isPlaying ? `Pause ${ariaLabel}` : `Play ${ariaLabel}`}
          className="absolute bottom-2.5 right-2.5 inline-flex size-8 items-center justify-center rounded-full border border-white/15 bg-[#0b1424]/80 text-white opacity-85 transition-opacity hover:opacity-100 focus-visible:opacity-100 cursor-pointer"
        >
          {isPlaying ? (
            <Pause className="size-3.5" />
          ) : (
            <Play className="size-3.5 fill-white ml-0.5" />
          )}
        </button>
      </div>
    </div>
  );
}

/* ---------- row ---------- */

export interface FeatureUIRowProps {
  eyebrow: string;
  title: string;
  body: React.ReactNode;
  cta?: { label: string; href: string };
  extraContent?: React.ReactNode;
  visual: React.ReactNode;
  /** put the visual on the left */
  reverse?: boolean;
  /** panel background behind the visual */
  tone?: "royal" | "night";
  className?: string;
}

export function FeatureUIRow({
  eyebrow,
  title,
  body,
  cta,
  extraContent,
  visual,
  reverse,
  tone = "royal",
  className,
}: FeatureUIRowProps) {
  const rowRef = React.useRef<HTMLDivElement>(null);
  const inView = useInView(rowRef, { once: false, amount: 0.16 });

  const textHiddenX = reverse ? 36 : -36;
  const visualHiddenX = reverse ? -36 : 36;

  return (
    <div
      ref={rowRef}
      className={cn(
        "grid w-full items-center gap-10 md:gap-14 lg:gap-16",
        reverse
          ? "md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]"
          : "md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]",
        className,
      )}
    >
      <motion.div
        className={cn("max-w-[460px] will-change-[transform,opacity]", reverse && "md:order-2")}
        initial={{ opacity: 0, x: textHiddenX, y: 20 }}
        animate={
          inView
            ? { opacity: 1, x: 0, y: 0 }
            : { opacity: 0, x: textHiddenX, y: 20 }
        }
        transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
      >
        <p className="flex items-center gap-2.5 text-[13px] font-medium tracking-[0.01em] text-[#52525B] dark:text-zinc-400">
          <span className="h-px w-5 bg-[#09090B]/35 dark:bg-white/35" />
          {eyebrow}
        </p>
        <h3 className="mt-5 text-[clamp(26px,2.8vw,38px)] font-semibold leading-[1.12] tracking-[-0.03em] text-[#09090B] dark:text-white text-balance">
          {title}
        </h3>
        <div className="mt-4 text-[15.5px] leading-[1.65] text-[#52525B] dark:text-zinc-400 text-pretty">
          {body}
        </div>
        {cta && (
          <Link
            href={cta.href}
            className="group mt-7 inline-flex items-center gap-1 rounded-full border border-[#09090B]/15 dark:border-white/15 px-4 py-2 text-[13.5px] font-medium text-[#09090B] dark:text-white transition-[background-color,border-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow hover:bg-[#0066FF] hover:border-[#0066FF] hover:text-white dark:hover:bg-[#0066FF] dark:hover:border-[#0066FF] dark:hover:text-white"
          >
            {cta.label}
            <ChevronRight
              className="size-4 transition-transform duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow group-hover:translate-x-0.5"
              strokeWidth={1.6}
            />
          </Link>
        )}
        {extraContent && <div className="mt-6">{extraContent}</div>}
      </motion.div>

      <motion.div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden rounded-[10px] border px-4 py-12 sm:px-6 md:aspect-[7/5] md:px-7 md:py-7 [contain:layout_paint] will-change-[transform,opacity]",
          tone === "royal"
            ? "bg-[#1d3a8a] border-[#1d3a8a]/25 dark:border-white/10"
            : "bg-[#0b1424] border-[#0b1424]/20 dark:border-white/10",
          reverse && "md:order-1",
        )}
        initial={{ opacity: 0, x: visualHiddenX, y: 26, scale: 0.97 }}
        animate={
          inView
            ? { opacity: 1, x: 0, y: 0, scale: 1 }
            : { opacity: 0, x: visualHiddenX, y: 26, scale: 0.97 }
        }
        transition={{
          duration: 0.72,
          ease: EASE_OUT_EXPO,
          delay: inView ? 0.08 : 0,
        }}
      >
        {/* Hairline texture on both edges */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1/4 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,.35) 0 1px, transparent 1px 9px)",
            maskImage: "linear-gradient(90deg, #000, transparent)",
          }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1/4 opacity-40"
          style={{
            backgroundImage:
              "repeating-linear-gradient(90deg, rgba(255,255,255,.35) 0 1px, transparent 1px 9px)",
            maskImage: "linear-gradient(270deg, #000, transparent)",
          }}
        />
        <div className="relative z-10 flex w-full items-center justify-center">
          {visual}
        </div>
      </motion.div>
    </div>
  );
}

export default FeatureUIRow;
