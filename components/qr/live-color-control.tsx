"use client";

import React, { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";

/**
 * Normalizes a 3- or 6-digit hex color string into canonical `#rrggbb` form.
 * Returns null while the user is mid-edit on an incomplete string.
 */
export function normalizeHexColor(raw: string): string | null {
  const trimmed = raw.trim();
  const match = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.exec(trimmed);
  if (!match) return null;
  const digits = match[1].toLowerCase();
  if (digits.length === 3) {
    return `#${digits[0]}${digits[0]}${digits[1]}${digits[1]}${digits[2]}${digits[2]}`;
  }
  return `#${digits}`;
}

export interface LiveColorControlProps {
  value: string;
  onInstantPreview: (hex: string) => void;
  onCommit: (hex: string) => void;
  commitDelayMs?: number;
  showHexInput?: boolean;
  swatchClassName?: string;
  ariaLabel?: string;
  disabled?: boolean;
}

/**
 * Coalesces high-frequency native `<input type="color">` drag events:
 * - Updates the local input state + Canvas2D/WebGL ref immediately (<1ms)
 * - Debounces parent React state commits so heavy UI trees never re-render at 120Hz.
 */
export function LiveColorControl({
  value,
  onInstantPreview,
  onCommit,
  commitDelayMs = 120,
  showHexInput = true,
  swatchClassName = "w-8 h-8 rounded-[10px] bg-transparent border-0 cursor-pointer hover:scale-105 shrink-0",
  ariaLabel = "Color picker",
  disabled = false,
}: LiveColorControlProps) {
  const [draft, setDraft] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingCommitRef = useRef<string | null>(null);
  const onCommitRef = useRef(onCommit);

  useEffect(() => {
    onCommitRef.current = onCommit;
  }, [onCommit]);

  useEffect(() => {
    // Sync only when external state diverges from our pending commit (e.g. Reset or Presets)
    if (pendingCommitRef.current === null) {
      setDraft(value);
    } else if (normalizeHexColor(value) === normalizeHexColor(pendingCommitRef.current)) {
      pendingCommitRef.current = null;
      setDraft(value);
    }
  }, [value]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const scheduleCommit = (hex: string) => {
    pendingCommitRef.current = hex;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      const latest = pendingCommitRef.current;
      pendingCommitRef.current = null;
      if (latest) {
        onCommitRef.current(latest);
      }
    }, commitDelayMs);
  };

  const flushCommit = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const latest = pendingCommitRef.current;
    pendingCommitRef.current = null;
    if (latest) {
      onCommitRef.current(latest);
      return;
    }
    const normalized = normalizeHexColor(draft);
    if (!normalized) {
      setDraft(value);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = normalizeHexColor(e.target.value) ?? e.target.value;
    setDraft(next);
    onInstantPreview(next);
    scheduleCommit(next);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setDraft(raw);
    const normalized = normalizeHexColor(raw);
    if (normalized) {
      onInstantPreview(normalized);
      scheduleCommit(normalized);
    }
  };

  const pickerHex = normalizeHexColor(draft) ?? normalizeHexColor(value) ?? "#ff6600";

  return (
    <>
      <input
        type="color"
        aria-label={ariaLabel}
        value={pickerHex}
        disabled={disabled}
        onChange={handlePickerChange}
        onBlur={flushCommit}
        className={swatchClassName}
      />
      {showHexInput && (
        <Input
          aria-label={`${ariaLabel} hex`}
          value={draft}
          disabled={disabled}
          onChange={handleTextChange}
          onBlur={flushCommit}
          className="font-mono uppercase text-xs h-10"
        />
      )}
    </>
  );
}
