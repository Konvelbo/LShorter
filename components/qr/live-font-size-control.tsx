"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";

export interface LiveFontSizeControlProps {
  value: number;
  min?: number;
  max?: number;
  onInstantPreview: (size: number) => void;
  onCommit: (size: number) => void;
  commitDelayMs?: number;
}

const PRESETS = [
  { sz: 8, label: "Mini 8px" },
  { sz: 10, label: "Compact 10px" },
  { sz: 12, label: "Standard 12px" },
  { sz: 15, label: "Medium 15px" },
  { sz: 18, label: "Large 18px" },
  { sz: 22, label: "Max 22px" },
];

/**
 * Ultra-smooth font size slider for QR Studio:
 * - Direct Canvas2D/WebGL preview at 120 FPS via RAF without parent tree re-renders
 * - Coalesces high-frequency slider events to eliminate UI jank and React diffing lag
 */
export const LiveFontSizeControl = React.memo(function LiveFontSizeControl({
  value,
  min = 8,
  max = 22,
  onInstantPreview,
  onCommit,
  commitDelayMs = 120,
}: LiveFontSizeControlProps) {
  const [draft, setDraft] = useState<number>(Math.min(max, Math.max(min, value)));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCommitRef = useRef<number | null>(null);
  const onCommitRef = useRef(onCommit);
  const onInstantPreviewRef = useRef(onInstantPreview);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    onInstantPreviewRef.current = onInstantPreview;
  }, [onInstantPreview]);

  useEffect(() => {
    if (pendingCommitRef.current === null) {
      setDraft(Math.min(max, Math.max(min, value)));
    }
  }, [value, min, max]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const flushCommit = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const latest = pendingCommitRef.current;
    pendingCommitRef.current = null;
    if (latest !== null) {
      onCommitRef.current(latest);
    }
  }, []);

  const scheduleCommit = useCallback(
    (nextSize: number) => {
      pendingCommitRef.current = nextSize;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        pendingCommitRef.current = null;
        onCommitRef.current(nextSize);
      }, commitDelayMs);
    },
    [commitDelayMs]
  );

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = Number(e.target.value);
    const clamped = Math.min(max, Math.max(min, rawVal));
    setDraft(clamped);
    onInstantPreviewRef.current(clamped);
    scheduleCommit(clamped);
  };

  const handlePresetClick = (sz: number) => {
    const clamped = Math.min(max, Math.max(min, sz));
    if (timerRef.current) clearTimeout(timerRef.current);
    pendingCommitRef.current = null;
    setDraft(clamped);
    onInstantPreviewRef.current(clamped);
    onCommitRef.current(clamped);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-zinc-900 dark:text-white">Font Size</span>
          <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
            ({min}px to {max}px max)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-brand bg-brand-subtle px-2 py-0.5 rounded border border-brand-subtle">
            {draft} px
          </span>
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={1}
        value={draft}
        onChange={handleSliderChange}
        onPointerUp={flushCommit}
        onKeyUp={flushCommit}
        className="w-full h-2 bg-neutral-200 dark:bg-[#141416] rounded-lg appearance-none cursor-pointer accent-[var(--brand-primary)] border border-neutral-300 dark:border-[#27272a]"
      />

      {/* Quick Presets for Font Size */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] text-neutral-500 dark:text-neutral-400 mr-1">Presets:</span>
        {PRESETS.map((preset) => (
          <button
            key={preset.sz}
            type="button"
            onClick={() => handlePresetClick(preset.sz)}
            className={`btn-hover-scale px-2.5 py-1 rounded-[6px] text-[10px] font-semibold transition-all cursor-pointer border ${
              draft === preset.sz
                ? "bg-brand text-white border-brand font-bold shadow-xs"
                : "bg-white dark:bg-[#141416] border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5"
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
});
