"use client";

import React from "react";
import { Plus, Trash2, Split, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldErrorAlert } from "../field-error-alert";
import { LockedProFeature } from "../locked-pro-feature";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/components/providers/i18n-provider";

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
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const totalWeight =
    mainWeight +
    abVariations.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
            {isFr ? "Tests A/B" : "A/B Testing"}
          </h2>
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mt-1">
            {isFr
              ? "Répartissez les visiteurs entre plusieurs pages d'atterrissage pour maximiser vos conversions."
              : "Split visitors between multiple landing pages to maximize conversion."}
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            if (!isProPlan) {
              triggerPlanUpgrade({
                featureName: isFr ? "Tests A/B" : "A/B Split Testing",
                reason: isFr
                  ? "Débloquez les tests A/B en passant au forfait PRO."
                  : "Unlock A/B Split Testing by upgrading to the PRO plan.",
                targetPlan: "PRO",
              });
              return;
            }
            handleAddVariation();
          }}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#1d5fe0]/10 dark:bg-[#3b82f6]/10 text-[#1d5fe0] dark:text-[#3b82f6] hover:bg-[#1d5fe0]/15 dark:hover:bg-[#3b82f6]/20 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isFr ? "Ajouter une variante" : "Add variation"}</span>
        </button>
      </div>

      <LockedProFeature
        title={isFr ? "Tests A/B" : "A/B Split Testing"}
        description={
          isFr
            ? "Répartissez le trafic visiteur entre plusieurs variantes de pages d'atterrissage avec des poids personnalisables."
            : "Split visitor traffic between multiple landing page variations with customizable traffic weights."
        }
        isUnlocked={isProPlan}
      >
        <div className="flex flex-col gap-4">
          {/* Variation A (Primary) */}
          <div className="p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#16181d] border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#0066FF] dark:text-[#5294FF]">
                {isFr ? "Variante A (Destination principale)" : "Variation A (Primary Destination)"}
              </span>
              <span className="text-xs font-mono font-bold text-[#0066FF] dark:text-[#5294FF]">
                {mainWeight}%
              </span>
            </div>
            <div className="text-xs font-mono font-medium truncate px-3 py-2 rounded-lg bg-white dark:bg-[#0e0f12] border border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-white">
              {targetUrl.trim() ||
                (isFr
                  ? "URL de destination principale configurée dans l'onglet Lien"
                  : "Primary destination URL configured in Link tab")}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="100"
                value={mainWeight}
                onChange={(e) => setMainWeight(Number(e.target.value))}
                className="flex-1 accent-[#0066FF] dark:accent-[#3b82f6] cursor-pointer"
              />
              <div className="flex items-center gap-1 text-xs">
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={mainWeight}
                  onChange={(e) => setMainWeight(Number(e.target.value))}
                  className="w-14 bg-white dark:bg-[#0e0f12] border border-zinc-200 dark:border-zinc-800 text-center font-mono font-bold rounded px-1.5 py-1 text-xs text-zinc-950 dark:text-white outline-none"
                />
                <span className="text-zinc-700 dark:text-zinc-300 font-semibold">%</span>
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
                className="p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#16181d] border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-950 dark:text-white">
                    {isFr ? `Variante ${letter}` : `Variation ${letter}`}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-zinc-950 dark:text-white">
                      {variation.weight}%
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveVariation(index)}
                      className="p-1 rounded text-red-500 hover:bg-red-500/10 transition-colors"
                      title={isFr ? "Supprimer la variante" : "Remove variation"}
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
                    "h-9 text-xs text-zinc-950 dark:text-white font-medium",
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
                    className="flex-1 accent-[#0066FF] dark:accent-[#3b82f6] cursor-pointer"
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
                      className="w-14 bg-white dark:bg-[#0e0f12] border border-zinc-200 dark:border-zinc-800 text-center font-mono font-bold rounded px-1.5 py-1 text-xs text-zinc-950 dark:text-white outline-none"
                    />
                    <span className="text-zinc-700 dark:text-zinc-300 font-semibold">%</span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Auto-balance & Total Bar */}
          <div className="flex items-center justify-between gap-3 p-3 rounded-[10px] bg-zinc-50 dark:bg-[#16181d] border border-zinc-200 dark:border-zinc-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                {isFr ? "Poids total :" : "Total Weight:"}
              </span>
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
                className="px-2.5 py-1 rounded-md text-xs font-semibold text-[#0066FF] dark:text-[#5294FF] hover:bg-[#0066FF]/10 transition-colors flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isFr ? "Équilibrer auto (100 %)" : "Auto-balance (100%)"}</span>
              </button>
            )}
          </div>
          <FieldErrorAlert message={fieldErrors.abTotal} />
        </div>
      </LockedProFeature>
    </div>
  );
}
