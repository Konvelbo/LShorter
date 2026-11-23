"use client";

import React, { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import {
  Target,
  Search,
  X,
  Check,
  Plus,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  CanonicalPixelPlatform,
  PixelBrandLogo,
  PixelInput,
  PixelRecordLike,
  getPixelPlatformShortLabel,
  normalizePixelPlatform,
} from "@/components/dashboard/pixel-badges";
import { cfGetPixels } from "@/lib/cloudflare-api";
import { useSession } from "next-auth/react";
import { useI18n } from "@/components/providers/i18n-provider";

export interface PixelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPixelIds: PixelInput[];
  onSave: (selectedPixels: PixelRecordLike[]) => void;
  availablePixels?: PixelRecordLike[];
}

function getPixelKey(px: PixelRecordLike): string {
  return String(px.id || px.pixelId || px.pixel_id || "").trim();
}

function buildInitialSelection(
  selectedPixelIds: PixelInput[],
  pixels: PixelRecordLike[]
): Record<string, boolean> {
  const map: Record<string, boolean> = {};
  const barePlatformStrings = new Set<string>();

  for (const item of selectedPixelIds) {
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (trimmed) {
        map[trimmed] = true;
        barePlatformStrings.add(trimmed.toLowerCase());
      }
    } else if (item && typeof item === "object") {
      if (item.id) map[String(item.id)] = true;
      if (item.pixelId) map[String(item.pixelId)] = true;
      if (item.pixel_id) map[String(item.pixel_id)] = true;
    }
  }

  for (const px of pixels) {
    const key = getPixelKey(px);
    if (!key) continue;
    const isIdMatch = Boolean(
      (px.id && map[String(px.id)]) ||
        (px.pixelId && map[String(px.pixelId)]) ||
        (px.pixel_id && map[String(px.pixel_id)])
    );
    const isLegacyBarePlatform = Boolean(
      px.platform && barePlatformStrings.has(String(px.platform).toLowerCase())
    );
    if (isIdMatch || isLegacyBarePlatform) {
      map[key] = true;
    }
  }

  return map;
}

function loadCachedPixels(userId: string): PixelRecordLike[] {
  if (typeof window === "undefined") return [];
  try {
    if (userId && userId !== "usr_anonymous") {
      const saved = localStorage.getItem(`lshorter_pixels_${userId}`);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed as PixelRecordLike[];
      }
    }
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("lshorter_pixels_")) {
        const parsed: unknown = JSON.parse(localStorage.getItem(k) || "[]");
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed as PixelRecordLike[];
        }
      }
    }
  } catch {}
  return [];
}

function PixelSelectorModalInner({
  onClose,
  selectedPixelIds = [],
  onSave,
  availablePixels: propAvailablePixels,
  userId,
}: Omit<PixelSelectorModalProps, "isOpen"> & { userId: string }) {
  const { tr } = useI18n();
  const hasPropPixels = Boolean(propAvailablePixels && propAvailablePixels.length > 0);
  const [fetchedPixels, setFetchedPixels] = useState<PixelRecordLike[]>(() =>
    hasPropPixels ? [] : loadCachedPixels(userId)
  );
  const [isLoading, setIsLoading] = useState<boolean>(
    () => !hasPropPixels && Boolean(userId && userId !== "usr_anonymous")
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlatformFilter, setActivePlatformFilter] = useState<
    "all" | CanonicalPixelPlatform
  >("all");
  const [tempSelected, setTempSelected] = useState<Record<string, boolean>>(() =>
    buildInitialSelection(
      selectedPixelIds,
      hasPropPixels ? propAvailablePixels! : loadCachedPixels(userId)
    )
  );

  // Async fetch when pixels aren't already supplied by props; preserves user edits & filters!
  useEffect(() => {
    if (hasPropPixels || !userId || userId === "usr_anonymous") return;

    let cancelled = false;
    cfGetPixels(userId)
      .then((res) => {
        if (cancelled) return;
        const list = (res?.data?.pixels || []) as PixelRecordLike[];
        setFetchedPixels(list);
        setTempSelected((prev) => {
          // Only hydrate newly discovered IDs from initial selectedPixelIds without clobbering toggles
          const hydrated = buildInitialSelection(selectedPixelIds, list);
          const merged = { ...prev };
          for (const [k, v] of Object.entries(hydrated)) {
            if (merged[k] === undefined) merged[k] = v;
          }
          return merged;
        });
        if (typeof window !== "undefined") {
          try {
            localStorage.setItem(`lshorter_pixels_${userId}`, JSON.stringify(list));
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [hasPropPixels, userId, selectedPixelIds]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const allPixels = useMemo(
    () => (hasPropPixels ? propAvailablePixels! : fetchedPixels),
    [hasPropPixels, propAvailablePixels, fetchedPixels]
  );

  const isPixelSelected = (px: PixelRecordLike): boolean => {
    const key = getPixelKey(px);
    if (!key) return false;
    if (key in tempSelected) return Boolean(tempSelected[key]);
    if (px.id && String(px.id) in tempSelected) return Boolean(tempSelected[String(px.id)]);
    if (px.pixelId && String(px.pixelId) in tempSelected) return Boolean(tempSelected[String(px.pixelId)]);
    return false;
  };

  const togglePixel = (px: PixelRecordLike) => {
    const key = getPixelKey(px);
    if (!key) return;
    setTempSelected((prev) => {
      const next = { ...prev };
      const currentlySelected = Boolean(
        prev[key] ||
          (px.id && prev[String(px.id)]) ||
          (px.pixelId && prev[String(px.pixelId)])
      );
      const nextValue = !currentlySelected;
      next[key] = nextValue;
      if (px.id) next[String(px.id)] = nextValue;
      if (px.pixelId) next[String(px.pixelId)] = nextValue;
      return next;
    });
  };

  const handleApply = () => {
    const result: PixelRecordLike[] = [];
    for (const px of allPixels) {
      if (isPixelSelected(px)) {
        result.push({
          id: px.id,
          platform: px.platform || px.type,
          pixelId: px.pixelId || px.pixel_id,
          name: px.name,
        });
      }
    }
    onSave(result);
    onClose();
  };

  const filteredPixels = useMemo(() => {
    return allPixels.filter((px) => {
      const platform = normalizePixelPlatform(px);
      if (activePlatformFilter !== "all" && platform !== activePlatformFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = String(px.name || "").toLowerCase().includes(q);
        const idMatch = String(px.pixelId || px.id || "").toLowerCase().includes(q);
        const platformMatch = String(px.platform || px.type || "").toLowerCase().includes(q);
        const labelMatch = getPixelPlatformShortLabel(platform).toLowerCase().includes(q);
        return nameMatch || idMatch || platformMatch || labelMatch;
      }
      return true;
    });
  }, [allPixels, activePlatformFilter, searchQuery]);

  const selectedCount = useMemo(
    () =>
      allPixels.filter((px) => {
        const key = getPixelKey(px);
        if (!key) return false;
        if (key in tempSelected) return Boolean(tempSelected[key]);
        if (px.id && String(px.id) in tempSelected) return Boolean(tempSelected[String(px.id)]);
        if (px.pixelId && String(px.pixelId) in tempSelected) return Boolean(tempSelected[String(px.pixelId)]);
        return false;
      }).length,
    [allPixels, tempSelected]
  );

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="pixel-selector-modal-title"
        className="w-full max-w-[540px] rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#151518] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all transform scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-[#151518]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3
                id="pixel-selector-modal-title"
                className="text-[15px] font-semibold text-zinc-900 dark:text-white leading-tight"
              >
                {tr("Select Retargeting Pixels", "Sélectionner des Pixels de Retargeting")}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                {tr("Attach tracking pixels configured in your account to this link", "Associez les pixels de suivi configurés dans votre compte pour ce lien")}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label={tr("Close", "Fermer")}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search & Platform Filter Bar */}
        <div className="p-3.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-[#121214] flex flex-col gap-2.5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tr("Search by pixel name or ID...", "Rechercher par nom ou identifiant de pixel...")}
              className="w-full h-8.5 pl-9 pr-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-[#18181c] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#0066FF] dark:focus:border-[#0066FF] transition-colors"
            />
          </div>

          {/* Platform Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {(
              [
                { id: "all", label: tr("All", "Tous") },
                { id: "meta", label: "Facebook" },
                { id: "instagram", label: "Instagram" },
                { id: "google", label: "Google / GA4" },
                { id: "youtube", label: "YouTube" },
                { id: "tiktok", label: "TikTok" },
                { id: "linkedin", label: "LinkedIn" },
                { id: "pinterest", label: "Pinterest" },
                { id: "snapchat", label: "Snapchat" },
                { id: "x", label: "X Ads" },
              ] as const
            ).map((tab) => {
              const isActive = activePlatformFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePlatformFilter(tab.id)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-[11px] font-medium whitespace-nowrap transition-colors cursor-pointer shrink-0",
                    isActive
                      ? "bg-[#0066FF] text-white shadow-2xs font-semibold"
                      : "bg-white dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content / Pixels List */}
        <div className="p-4 overflow-y-auto max-h-[300px] flex-1">
          {isLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs">
              <div className="w-5 h-5 border-2 border-[#0066FF] border-t-transparent rounded-full animate-spin" />
              <span>{tr("Loading configured pixels...", "Chargement des pixels configurés...")}</span>
            </div>
          ) : allPixels.length === 0 ? (
            <div className="py-8 px-4 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                <Target className="w-6 h-6" />
              </div>
              <div className="max-w-xs">
                <h4 className="text-[13.5px] font-semibold text-zinc-900 dark:text-white">
                  {tr("No retargeting pixels configured", "Aucun pixel de retargeting configuré")}
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  {tr(
                    "You haven't registered any pixels yet. Add one in Settings to start retargeting your visitors.",
                    "Vous n'avez pas encore enregistré de pixel sur votre compte. Ajoutez-en un dans vos Paramètres pour commencer à recibler vos visiteurs."
                  )}
                </p>
              </div>
              <Link
                href="/dashboard/settings?tab=pixels"
                onClick={onClose}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0066FF] hover:bg-[#0055d4] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{tr("Add a pixel in Settings", "Ajouter un pixel dans les Paramètres")}</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
              </Link>
            </div>
          ) : filteredPixels.length === 0 ? (
            <div className="py-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
              {tr("No pixels match your search filter.", "Aucun pixel ne correspond à votre filtre de recherche.")}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredPixels.map((px) => {
                const isSelected = isPixelSelected(px);
                const platformTag = getPixelPlatformShortLabel(px);
                const rowKey = getPixelKey(px) || `${px.platform}-${px.name}`;

                return (
                  <button
                    key={rowKey}
                    type="button"
                    role="checkbox"
                    aria-checked={isSelected}
                    onClick={() => togglePixel(px)}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-[8px] border text-left transition-all cursor-pointer select-none",
                      isSelected
                        ? "bg-[#0066FF]/5 border-[#0066FF] text-zinc-900 dark:text-white ring-1 ring-[#0066FF]/20"
                        : "bg-white dark:bg-[#16181d] border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/90 flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-zinc-700/60">
                        <PixelBrandLogo platform={px} className="w-4 h-4" decorative />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-zinc-900 dark:text-white truncate">
                            {px.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9.5px] font-mono uppercase bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                            {platformTag}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-zinc-400 dark:text-zinc-500 mt-0.5 truncate">
                          ID: {px.pixelId || px.id}
                        </div>
                      </div>
                    </div>

                    <div
                      aria-hidden="true"
                      className={cn(
                        "w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ml-3",
                        isSelected
                          ? "bg-[#0066FF] border-[#0066FF] text-white"
                          : "border-zinc-300 dark:border-zinc-700 bg-transparent"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-[#111114] flex items-center justify-between">
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            <strong className="text-zinc-900 dark:text-white font-semibold">
              {selectedCount}
            </strong>{" "}
            {tr(
              `pixel${selectedCount > 1 ? "s" : ""} selected`,
              `pixel${selectedCount > 1 ? "s" : ""} sélectionné${selectedCount > 1 ? "s" : ""}`
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              {tr("Cancel", "Annuler")}
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={allPixels.length === 0}
              className="px-4 py-1.5 rounded-lg bg-[#0066FF] hover:bg-[#0055d4] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              {tr("Apply selection", "Appliquer la sélection")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}

export function PixelSelectorModal({
  isOpen,
  onClose,
  selectedPixelIds = [],
  onSave,
  availablePixels,
}: PixelSelectorModalProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";

  if (!isOpen || typeof document === "undefined") return null;

  return (
    <PixelSelectorModalInner
      onClose={onClose}
      selectedPixelIds={selectedPixelIds}
      onSave={onSave}
      availablePixels={availablePixels}
      userId={userId}
    />
  );
}
