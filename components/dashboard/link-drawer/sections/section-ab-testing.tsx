"use client";

import React from "react";
import { Plus, Trash2, Split, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FieldErrorAlert } from "../field-error-alert";

interface SectionAbTestingProps {
  targetUrl: string;
  mainWeight: number;
  setMainWeight: (w: number) => void;
  abVariations: Array<{ url: string; weight: number }>;
  setAbVariations: React.Dispatch<
    React.SetStateAction<Array<{ url: string; weight: number }>>
  >;
  handleAddVariation: () => void;
  handleRemoveVariation: (idx: number) => void;
  handleAutoBalance: () => void;
  fieldErrors: Record<string, string>;
}

export function SectionAbTesting({
  targetUrl,
  mainWeight,
  setMainWeight,
  abVariations,
  setAbVariations,
  handleAddVariation,
  handleRemoveVariation,
  handleAutoBalance,
  fieldErrors,
}: SectionAbTestingProps) {
  return (
    <div
      id="drawer-section-ab_testing"
      className="flex flex-col gap-3 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] p-4 scroll-mt-4 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#222225] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-brand" />
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            A/B TESTING
          </h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddVariation}
          className="bg-white dark:bg-[#18181c] border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-800 dark:text-neutral-200 text-xs h-7 rounded-[6px] gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-brand" />
          <span>Add Variation</span>
        </Button>
      </div>

      {/* Variant A (Main Link) */}
      <div className="p-3.5 rounded-[8px] bg-white dark:bg-[#18181c] border border-brand-subtle flex flex-col gap-2 shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-brand">
            Variation A (Primary)
          </span>
          <span className="text-xs font-mono font-bold text-brand">
            {mainWeight}%
          </span>
        </div>
        <div className="text-xs font-mono truncate bg-zinc-100 dark:bg-[#101012] px-3 py-1.5 rounded-[6px] border border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-neutral-300">
          {targetUrl.trim() || "Primary destination URL configured above"}
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0"
            max="100"
            value={mainWeight}
            onChange={(e) => setMainWeight(Number(e.target.value))}
            className="flex-1 accent-[var(--brand-primary)] cursor-pointer"
          />
          <div className="w-20 h-2 bg-zinc-200 dark:bg-neutral-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand transition-all"
              style={{ width: `${mainWeight}%` }}
            />
          </div>
        </div>
      </div>

      {/* Dynamic Variants (B, C, D...) */}
      {abVariations.length === 0 ? (
        <div className="p-4 rounded-[8px] border border-dashed border-zinc-300 dark:border-[#27272a] bg-white/60 dark:bg-[#18181c]/50 text-center flex flex-col items-center justify-center gap-1.5">
          <Split className="w-5 h-5 text-zinc-400 dark:text-neutral-500" />
          <p className="text-[11px] text-zinc-500 dark:text-neutral-400">
            No alternative variations configured. 100% of visitor traffic routes to the primary URL.
          </p>
        </div>
      ) : (
        abVariations.map((variant, idx) => {
          const label = `Variation ${String.fromCharCode(66 + idx)}`;
          const err = fieldErrors[`abVariation_${idx}`];
          return (
            <div
              key={idx}
              className="p-3 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] flex flex-col gap-2 shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-900 dark:text-white">
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                    {variant.weight}%
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariation(idx)}
                    className="text-zinc-400 hover:text-red-500 transition-colors p-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <Input
                placeholder="https://variant-landing.com/..."
                value={variant.url}
                onChange={(e) => {
                  const next = [...abVariations];
                  next[idx].url = e.target.value;
                  setAbVariations(next);
                }}
                className={cn(
                  "bg-zinc-50 dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-white text-xs h-8.5 rounded-[8px]",
                  err && "border-red-500/60 bg-red-500/5",
                )}
              />
              <FieldErrorAlert message={err} />

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={variant.weight}
                  onChange={(e) => {
                    const next = [...abVariations];
                    next[idx].weight = Number(e.target.value);
                    setAbVariations(next);
                  }}
                  className="flex-1 accent-zinc-500 dark:accent-neutral-400 cursor-pointer"
                />
                <div className="w-20 h-2 bg-zinc-200 dark:bg-neutral-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-zinc-600 dark:bg-neutral-400 transition-all"
                    style={{ width: `${variant.weight}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })
      )}

      {abVariations.length > 0 && (
        <div className="flex items-center justify-between gap-3 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAutoBalance}
            className="bg-white dark:bg-[#18181c] border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-800 dark:text-neutral-200 text-xs h-8 rounded-[8px] gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-brand" />
            <span>Auto-Balance to 100%</span>
          </Button>

          {/* Total Weight Indicator */}
          {(() => {
            const total =
              mainWeight +
              abVariations.reduce(
                (acc, v) => acc + (Number(v.weight) || 0),
                0,
              );
            const isOk = total === 100;
            return (
              <span
                className={cn(
                  "text-xs font-mono font-bold px-2.5 py-1 rounded-[6px] border",
                  isOk
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                    : "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse",
                )}
              >
                Total: {total}% {isOk ? "✓" : "≠ 100%"}
              </span>
            );
          })()}
        </div>
      )}
      <FieldErrorAlert message={fieldErrors.abTotal} />
    </div>
  );
}
