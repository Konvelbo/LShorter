"use client";

import React from "react";
import { Plus, Trash2, Split, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldErrorAlert } from "../field-error-alert";
import { LockedProFeature } from "../locked-pro-feature";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { Input } from "@/components/ui/input";

interface SectionAbTestingProps {
  isProPlan: boolean;
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
  isProPlan,
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
  const totalWeight =
    mainWeight +
    abVariations.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#131417] dark:text-[#f1f2f4]">
            A/B Testing
          </h2>
          <p className="text-sm text-[#6c717c] dark:text-[#8a8f9a] mt-1">
            Split visitors between multiple landing pages to maximize conversion.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isProPlan) {
              triggerPlanUpgrade({
                featureName: "A/B Split Testing",
                reason: "Unlock A/B Split Testing by upgrading to the PRO plan.",
                targetPlan: "PRO",
              });
              return;
            }
            handleAddVariation();
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1d5fe0]/10 dark:bg-[#3b82f6]/10 text-[#1d5fe0] dark:text-[#3b82f6] hover:bg-[#1d5fe0]/15 dark:hover:bg-[#3b82f6]/20 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add variation</span>
        </button>
      </div>

      <LockedProFeature
        title="A/B Split Testing"
        description="Split visitor traffic between multiple landing page variations with customizable traffic weights."
        isUnlocked={isProPlan}
      >
        <div className="flex flex-col gap-4">
          {/* Variation A (Primary) */}
          <div className="p-3.5 rounded-xl bg-[#f4f5f7] dark:bg-[#16181d] border border-[#e6e7ea] dark:border-[#22242a] flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#1d5fe0] dark:text-[#3b82f6]">
                Variation A (Primary Destination)
              </span>
              <span className="text-xs font-mono font-bold text-[#1d5fe0] dark:text-[#3b82f6]">
                {mainWeight}%
              </span>
            </div>
            <div className="text-xs font-mono truncate px-3 py-2 rounded-lg bg-white dark:bg-[#0e0f12] border border-[#e6e7ea] dark:border-[#22242a] text-[#131417] dark:text-[#f1f2f4]">
              {targetUrl.trim() || "Primary destination URL configured in Link tab"}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={mainWeight}
                onChange={(e) => setMainWeight(Number(e.target.value))}
                className="flex-1 accent-[#1d5fe0] dark:accent-[#3b82f6] cursor-pointer"
              />
              <div className="flex items-center gap-1 text-xs">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={mainWeight}
                  onChange={(e) => setMainWeight(Number(e.target.value))}
                  className="w-14 bg-white dark:bg-[#0e0f12] border border-[#e6e7ea] dark:border-[#22242a] text-center font-mono rounded px-1.5 py-1 text-xs outline-none"
                />
                <span className="text-[#6c717c] dark:text-[#8a8f9a]">%</span>
              </div>
            </div>
          </div>

          {/* Additional Variations */}
          {abVariations.map((variation, index) => {
            const letter = String.fromCharCode(66 + index);
            const errKey = `abVariation_${index}`;
            return (
              <div
                key={index}
                className="p-3.5 rounded-xl bg-[#f4f5f7] dark:bg-[#16181d] border border-[#e6e7ea] dark:border-[#22242a] flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#131417] dark:text-[#f1f2f4]">
                    Variation {letter}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#131417] dark:text-[#f1f2f4]">
                      {variation.weight}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariation(index)}
                      className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                      title="Remove variation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <Input
                  type="url"
                  placeholder={`https://example.com/landing-${letter.toLowerCase()}`}
                  value={variation.url}
                  onChange={(e) => {
                    const newVars = [...abVariations];
                    newVars[index].url = e.target.value;
                    setAbVariations(newVars);
                  }}
                  className={cn(
                    "h-9 text-xs",
                    fieldErrors[errKey] && "border-red-500/70 bg-red-500/5",
                  )}
                />
                <FieldErrorAlert message={fieldErrors[errKey]} />

                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={variation.weight}
                    onChange={(e) => {
                      const newVars = [...abVariations];
                      newVars[index].weight = Number(e.target.value);
                      setAbVariations(newVars);
                    }}
                    className="flex-1 accent-[#1d5fe0] dark:accent-[#3b82f6] cursor-pointer"
                  />
                  <div className="flex items-center gap-1 text-xs">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={variation.weight}
                      onChange={(e) => {
                        const newVars = [...abVariations];
                        newVars[index].weight = Number(e.target.value);
                        setAbVariations(newVars);
                      }}
                      className="w-14 bg-white dark:bg-[#0e0f12] border border-[#e6e7ea] dark:border-[#22242a] text-center font-mono rounded px-1.5 py-1 text-xs outline-none"
                    />
                    <span className="text-[#6c717c] dark:text-[#8a8f9a]">%</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Auto-balance & Total Bar */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#f4f5f7] dark:bg-[#16181d] border border-[#e6e7ea] dark:border-[#22242a] text-xs">
            <div className="flex items-center gap-2">
              <span className="text-[#6c717c] dark:text-[#8a8f9a]">Total Weight:</span>
              <span
                className={cn(
                  "font-mono font-bold",
                  totalWeight === 100
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-red-500",
                )}
              >
                {totalWeight}% / 100%
              </span>
            </div>

            {abVariations.length > 0 && (
              <button
                type="button"
                onClick={handleAutoBalance}
                className="px-2.5 py-1 rounded-md text-xs font-medium text-[#1d5fe0] dark:text-[#3b82f6] hover:bg-[#1d5fe0]/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Auto-balance (100%)</span>
              </button>
            )}
          </div>
          <FieldErrorAlert message={fieldErrors.abTotal} />
        </div>
      </LockedProFeature>
    </div>
  );
}
