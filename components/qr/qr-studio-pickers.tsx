"use client";

import React from "react";
import { Crown, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { PixelStyleType, EyeStyleType, FrameType, FontFamilyType } from "./qr-render-engine";
import { ANIMATED_THEME_CATEGORIES, type AnimatedThemeCategory } from "./qr-animated-themes";
import { useI18n } from "@/components/providers/i18n-provider";

const ANIMATED_CAT_FR: Record<string, string> = {
  all: "Tous",
  tech: "Tech & Cyber",
  cyber: "Cyber",
  neon: "Néon",
  nature: "Nature",
  weather: "Météo",
  luxury: "Luxe",
  seasonal: "Saisonnier",
  sport: "Sport",
  sports: "Sports",
  lifestyle: "Style de vie",
  creative: "Créatif",
  abstract: "Abstrait",
  events: "Événements",
};

const FONT_CAT_FR: Record<string, string> = {
  "Sans-Serif": "Sans-Serif",
  Serif: "Serif",
  Display: "Titres",
  Monospace: "Monospace",
  Cursive: "Cursive",
  Futuristic: "Futuriste",
};

// =============================================================================
// 1. MEMOIZED BRAND LOGOS PICKER (99 OFFICIAL HD LOGOS)
// =============================================================================
export interface LogoItem {
  id: string;
  label: string;
  isPro: boolean;
  iconNode: React.ReactNode;
}

export interface BrandLogosPickerProps {
  logos: LogoItem[];
  selectedLogo: string;
  isProPlan: boolean;
  showMoreLogos: boolean;
  onToggleShowMore: () => void;
  onSelectLogo: (id: string, label: string, isPro: boolean) => void;
}

export const BrandLogosPicker = React.memo(function BrandLogosPicker({
  logos,
  selectedLogo,
  isProPlan,
  showMoreLogos,
  onToggleShowMore,
  onSelectLogo,
}: BrandLogosPickerProps) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const displayedLogos = showMoreLogos ? logos : logos.slice(0, 8);

  return (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
        {displayedLogos.map((logoItem) => {
          const isSelected = selectedLogo === logoItem.id;
          return (
            <button
              key={logoItem.id}
              type="button"
              onClick={() => onSelectLogo(logoItem.id, logoItem.label, logoItem.isPro)}
              title={logoItem.label}
              className={`btn-hover-scale relative flex flex-col items-center justify-center h-14 rounded-[10px] border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-brand/10 dark:bg-brand-light border-brand text-brand dark:text-white ring-1 ring-brand font-bold"
                  : "bg-white dark:bg-[#1a1a1e] border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-white/5"
              }`}
            >
              {logoItem.isPro && !isProPlan && (
                <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
              )}
              <div className="mb-0.5 flex items-center justify-center">{logoItem.iconNode}</div>
              <span
                className={`text-[9px] truncate max-w-[48px] ${
                  isSelected
                    ? "text-brand dark:text-white font-bold"
                    : "text-neutral-500 dark:text-neutral-400"
                }`}
              >
                {logoItem.label}
              </span>
            </button>
          );
        })}
      </div>

      {logos.length > 8 && (
        <button
          type="button"
          onClick={onToggleShowMore}
          className="btn-hover-scale text-xs font-semibold text-brand hover:underline cursor-pointer self-end"
        >
          {showMoreLogos
            ? (isFr ? "Afficher moins ↑" : "Show less ↑")
            : (isFr ? `Voir tous les logos (${logos.length}) ↓` : `View all logos (${logos.length}) ↓`)}
        </button>
      )}
    </div>
  );
});

// =============================================================================
// 2. MEMOIZED FRAMES PICKER (60 HIGH-CONVERSION FRAMES)
// =============================================================================
export interface FrameItem {
  id: FrameType;
  label: string;
  isPro: boolean;
  isAnimated?: boolean;
  category?: Exclude<AnimatedThemeCategory, "all">;
  previewIcon: React.ReactNode;
}

export interface FramesPickerProps {
  frames: FrameItem[];
  selectedFrame: FrameType;
  frameFilter: "all" | "static" | "animated";
  animatedCategoryFilter: AnimatedThemeCategory;
  showMoreFrames: boolean;
  isProPlan: boolean;
  onSelectFrame: (id: FrameType, isPro: boolean) => void;
  onSetFrameFilter: (filter: "all" | "static" | "animated") => void;
  onSetAnimatedCategoryFilter: (cat: AnimatedThemeCategory) => void;
  onToggleShowMore: () => void;
}

export const FramesPicker = React.memo(function FramesPicker({
  frames,
  selectedFrame,
  frameFilter,
  animatedCategoryFilter,
  showMoreFrames,
  isProPlan,
  onSelectFrame,
  onSetFrameFilter,
  onSetAnimatedCategoryFilter,
  onToggleShowMore,
}: FramesPickerProps) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const filteredFrames = React.useMemo(() => {
    return frames.filter((frame) => {
      if (frameFilter === "static") return !frame.isAnimated;
      if (frameFilter === "animated") {
        if (!frame.isAnimated) return false;
        if (animatedCategoryFilter === "all") return true;
        return frame.category === animatedCategoryFilter;
      }
      return true;
    });
  }, [frames, frameFilter, animatedCategoryFilter]);

  const displayedFrames = showMoreFrames ? filteredFrames : filteredFrames.slice(0, 7);

  return (
    <div className="flex flex-col gap-3">
      {/* Frame Filter Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 bg-neutral-100 dark:bg-[#1a1a1e] p-1 rounded-[10px] border border-neutral-200 dark:border-[#27272a] w-fit">
          {[
            { id: "all" as const, label: isFr ? `Tous (${frames.length})` : `All (${frames.length})` },
            { id: "static" as const, label: isFr ? `Statiques (${frames.filter((f) => !f.isAnimated).length})` : `Static (${frames.filter((f) => !f.isAnimated).length})` },
            { id: "animated" as const, label: isFr ? `Animés (${frames.filter((f) => f.isAnimated).length})` : `Animated (${frames.filter((f) => f.isAnimated).length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                onSetFrameFilter(tab.id);
                if (tab.id !== "animated") onSetAnimatedCategoryFilter("all");
              }}
              className={`btn-hover-scale px-2.5 py-1 rounded-[10px] text-[11px] font-semibold transition-all cursor-pointer ${
                frameFilter === tab.id
                  ? "bg-brand text-white shadow-xs font-bold"
                  : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Animated Theme Category Sub-Filters */}
      {frameFilter === "animated" && (
        <div className="flex flex-wrap items-center gap-1.5">
          {ANIMATED_THEME_CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSetAnimatedCategoryFilter(cat.id)}
              className={`btn-hover-scale px-2.5 py-1 rounded-[10px] text-[11px] font-semibold border transition-all cursor-pointer ${
                animatedCategoryFilter === cat.id
                  ? "bg-brand/15 border-brand text-brand dark:text-white"
                  : "bg-neutral-50 dark:bg-[#1a1a1e] border-neutral-200 dark:border-[#27272a] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {isFr ? (ANIMATED_CAT_FR[cat.id] || cat.label) : cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Grid of Frames */}
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2.5">
        {displayedFrames.map((frameItem) => {
          const isSelected = selectedFrame === frameItem.id;
          return (
            <button
              key={frameItem.id}
              type="button"
              onClick={() => onSelectFrame(frameItem.id, frameItem.isPro)}
              className={`btn-hover-scale relative flex flex-col items-center justify-center h-16 rounded-[10px] border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-brand/10 dark:bg-brand-light border-brand text-brand dark:text-white ring-1 ring-brand font-bold"
                  : "bg-white dark:bg-[#1a1a1e] border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-white/5"
              }`}
            >
              {frameItem.isPro && !isProPlan && (
                <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
              )}
              <div className="mb-1 flex items-center justify-center">{frameItem.previewIcon}</div>
              <span
                className={`text-[10px] truncate max-w-[62px] text-center font-medium leading-tight ${
                  isSelected ? "text-brand dark:text-white font-bold" : "text-neutral-600 dark:text-neutral-400"
                }`}
              >
                {frameItem.label}
              </span>
            </button>
          );
        })}
      </div>

      {filteredFrames.length > 7 && (
        <button
          type="button"
          onClick={onToggleShowMore}
          className="btn-hover-scale text-xs font-semibold text-brand hover:underline cursor-pointer self-end"
        >
          {showMoreFrames
            ? (isFr ? "Afficher moins ↑" : "Show less ↑")
            : (isFr ? `Tout voir (${filteredFrames.length}) ↓` : `View all (${filteredFrames.length}) ↓`)}
        </button>
      )}
    </div>
  );
});

// =============================================================================
// 3. MEMOIZED FONTS PICKER (80 CURATED TYPOGRAPHY FAMILIES)
// =============================================================================
export interface FontItem {
  id: FontFamilyType;
  label: string;
  name: string;
  preview: string;
  category: "Sans-Serif" | "Serif" | "Display" | "Monospace" | "Cursive" | "Futuristic";
  fontCss: string;
}

export interface FontsPickerProps {
  fonts: FontItem[];
  fontFamily: FontFamilyType;
  frameText: string;
  fontCategoryFilter: string;
  fontSearchQuery: string;
  showAllFonts: boolean;
  onSelectFont: (id: FontFamilyType) => void;
  onSetCategoryFilter: (cat: string) => void;
  onSetSearchQuery: (query: string) => void;
  onToggleShowAll: () => void;
}

export const FontsPicker = React.memo(function FontsPicker({
  fonts,
  fontFamily,
  frameText,
  fontCategoryFilter,
  fontSearchQuery,
  showAllFonts,
  onSelectFont,
  onSetCategoryFilter,
  onSetSearchQuery,
  onToggleShowAll,
}: FontsPickerProps) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const filteredFonts = React.useMemo(() => {
    return fonts.filter((f) => {
      const matchesCat = fontCategoryFilter === "all" || f.category === fontCategoryFilter;
      const q = fontSearchQuery.trim().toLowerCase();
      const matchesSearch =
        !q ||
        f.label.toLowerCase().includes(q) ||
        f.name.toLowerCase().includes(q) ||
        f.category.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [fonts, fontCategoryFilter, fontSearchQuery]);

  const displayedFonts = showAllFonts ? filteredFonts : filteredFonts.slice(0, 8);

  return (
    <div className="flex flex-col gap-3">
      {/* Category Pills & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
          {["all", "Sans-Serif", "Serif", "Display", "Monospace", "Cursive", "Futuristic"].map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => onSetCategoryFilter(cat)}
              className={`btn-hover-scale px-2.5 py-1 rounded-[10px] text-[10px] font-semibold shrink-0 transition-all cursor-pointer border ${
                fontCategoryFilter === cat
                  ? "bg-brand text-white border-brand shadow-xs font-bold"
                  : "bg-neutral-50 dark:bg-[#1a1a1e] border-neutral-200 dark:border-[#27272a] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
              }`}
            >
              {cat === "all"
                ? (isFr ? "Tous les styles (80)" : "All Styles (80)")
                : (isFr ? (FONT_CAT_FR[cat] || cat) : cat)}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-44">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <Input
            value={fontSearchQuery}
            onChange={(e) => onSetSearchQuery(e.target.value)}
            placeholder={isFr ? "Rechercher une police..." : "Search fonts..."}
            className="pl-8 h-8 text-xs rounded-[10px]"
          />
          {fontSearchQuery && (
            <button
              type="button"
              onClick={() => onSetSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Grid of Fonts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {displayedFonts.map((f) => {
          const isSelected = fontFamily === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelectFont(f.id)}
              className={`btn-hover-scale relative flex flex-col p-2.5 rounded-[10px] border text-left transition-all cursor-pointer ${
                isSelected
                  ? "bg-brand/10 dark:bg-brand-light border-brand text-brand dark:text-white ring-1 ring-brand shadow-xs"
                  : "bg-white dark:bg-[#1a1a1e] border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-[11px] font-bold truncate max-w-[90px] ${
                    isSelected ? "text-brand dark:text-white" : "text-zinc-900 dark:text-white"
                  }`}
                >
                  {f.label}
                </span>
                <span
                  className={`text-[8px] font-semibold px-1 py-0.5 rounded border ${
                    isSelected
                      ? "bg-brand/15 dark:bg-white/10 text-brand dark:text-neutral-300 border-brand/20 dark:border-white/10"
                      : "bg-neutral-100 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-neutral-200 dark:border-white/5"
                  }`}
                >
                  {isFr ? (FONT_CAT_FR[f.category] || f.category) : f.category}
                </span>
              </div>
              <div
                className={`text-xs truncate mt-0.5 font-medium ${
                  isSelected
                    ? "text-zinc-900 dark:text-white font-semibold"
                    : "text-zinc-800 dark:text-neutral-200"
                }`}
                style={{ fontFamily: f.fontCss }}
              >
                {frameText || f.preview}
              </div>
            </button>
          );
        })}
      </div>

      {filteredFonts.length > 8 && (
        <button
          type="button"
          onClick={onToggleShowAll}
          className="btn-hover-scale text-xs font-semibold text-brand hover:underline cursor-pointer self-end mt-1"
        >
          {showAllFonts
            ? (isFr ? "Afficher moins ↑" : "Show less ↑")
            : (isFr ? `Voir toutes les polices (${filteredFonts.length}) ↓` : `View all fonts (${filteredFonts.length}) ↓`)}
        </button>
      )}

      {filteredFonts.length === 0 && (
        <div className="text-center py-4 text-xs text-neutral-500 dark:text-neutral-400">
          {isFr
            ? `Aucune police ne correspond à « ${fontSearchQuery} ».`
            : `No fonts match "${fontSearchQuery}".`}
        </div>
      )}
    </div>
  );
});

// =============================================================================
// 4. MEMOIZED PIXEL STYLES PICKER
// =============================================================================
export interface PixelStyleItem {
  id: PixelStyleType;
  label: string;
  icon: string;
  isPro: boolean;
}

export interface PixelStylesPickerProps {
  styles: PixelStyleItem[];
  selectedPixel: PixelStyleType;
  isProPlan: boolean;
  showMore: boolean;
  onToggleShowMore: () => void;
  onSelectPixel: (id: PixelStyleType, isPro: boolean) => void;
}

export const PixelStylesPicker = React.memo(function PixelStylesPicker({
  styles,
  selectedPixel,
  isProPlan,
  showMore,
  onToggleShowMore,
  onSelectPixel,
}: PixelStylesPickerProps) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const displayed = showMore ? styles : styles.slice(0, 6);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {displayed.map((styleItem) => {
          const isSelected = selectedPixel === styleItem.id;
          return (
            <button
              key={styleItem.id}
              type="button"
              onClick={() => onSelectPixel(styleItem.id, styleItem.isPro)}
              className={`btn-hover-scale relative flex flex-col items-center justify-center p-3 rounded-[10px] border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-brand/10 dark:bg-brand-light border-brand text-brand dark:text-white ring-1 ring-brand font-bold"
                  : "bg-white dark:bg-[#1a1a1e] border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-white/5"
              }`}
            >
              {styleItem.isPro && !isProPlan && (
                <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
              )}
              <span className="text-xl mb-1">{styleItem.icon}</span>
              <span className="text-xs truncate max-w-full font-medium">{styleItem.label}</span>
            </button>
          );
        })}
      </div>

      {styles.length > 6 && (
        <button
          type="button"
          onClick={onToggleShowMore}
          className="btn-hover-scale text-xs font-semibold text-brand hover:underline cursor-pointer self-end"
        >
          {showMore
            ? (isFr ? "Afficher moins ↑" : "Show less ↑")
            : (isFr ? `Voir tous les motifs (${styles.length}) ↓` : `View all patterns (${styles.length}) ↓`)}
        </button>
      )}
    </div>
  );
});

// =============================================================================
// 5. MEMOIZED EYE STYLES PICKER
// =============================================================================
export interface EyeStyleItem {
  id: EyeStyleType;
  label: string;
  isPro: boolean;
  svg: React.ReactNode;
}

export interface EyeStylesPickerProps {
  styles: EyeStyleItem[];
  selectedEye: EyeStyleType;
  isProPlan: boolean;
  showMore: boolean;
  onToggleShowMore: () => void;
  onSelectEye: (id: EyeStyleType, isPro: boolean) => void;
}

export const EyeStylesPicker = React.memo(function EyeStylesPicker({
  styles,
  selectedEye,
  isProPlan,
  showMore,
  onToggleShowMore,
  onSelectEye,
}: EyeStylesPickerProps) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const displayed = showMore ? styles : styles.slice(0, 6);

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {displayed.map((styleItem) => {
          const isSelected = selectedEye === styleItem.id;
          return (
            <button
              key={styleItem.id}
              type="button"
              onClick={() => onSelectEye(styleItem.id, styleItem.isPro)}
              className={`btn-hover-scale relative flex flex-col items-center justify-center p-3 rounded-[10px] border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? "bg-brand/10 dark:bg-brand-light border-brand text-brand dark:text-white ring-1 ring-brand font-bold"
                  : "bg-white dark:bg-[#1a1a1e] border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:border-neutral-400 dark:hover:border-neutral-500 hover:bg-neutral-50 dark:hover:bg-white/5"
              }`}
            >
              {styleItem.isPro && !isProPlan && (
                <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
              )}
              <div className="mb-1 flex items-center justify-center">{styleItem.svg}</div>
              <span className="text-xs truncate max-w-full font-medium">{styleItem.label}</span>
            </button>
          );
        })}
      </div>

      {styles.length > 6 && (
        <button
          type="button"
          onClick={onToggleShowMore}
          className="btn-hover-scale text-xs font-semibold text-brand hover:underline cursor-pointer self-end"
        >
          {showMore
            ? (isFr ? "Afficher moins ↑" : "Show less ↑")
            : (isFr ? `Voir toutes les formes (${styles.length}) ↓` : `View all shapes (${styles.length}) ↓`)}
        </button>
      )}
    </div>
  );
});
