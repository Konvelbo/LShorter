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
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  PixelBrandLogo,
  normalizePixelPlatform,
} from "@/components/dashboard/pixel-badges";
import { cfGetPixels, RetargetingPixel } from "@/lib/cloudflare-api";
import { useSession } from "next-auth/react";

export interface PixelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPixelIds: any[];
  onSave: (selectedPixels: any[]) => void;
  availablePixels?: any[];
}

export function PixelSelectorModal({
  isOpen,
  onClose,
  selectedPixelIds = [],
  onSave,
  availablePixels: propAvailablePixels,
}: PixelSelectorModalProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";

  const [mounted, setMounted] = useState(false);
  const [internalPixels, setInternalPixels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlatformFilter, setActivePlatformFilter] = useState<
    "all" | "meta" | "google" | "tiktok" | "linkedin"
  >("all");

  // Selection state as map of ID -> boolean
  const [tempSelected, setTempSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Fetch or resolve available pixels
  useEffect(() => {
    if (!isOpen) return;

    if (propAvailablePixels && propAvailablePixels.length > 0) {
      setInternalPixels(propAvailablePixels);
      return;
    }

    if (userId && userId !== "usr_anonymous") {
      setIsLoading(true);
      cfGetPixels(userId)
        .then((res) => {
          const list = res?.data?.pixels || [];
          setInternalPixels(list);
          if (typeof window !== "undefined") {
            try {
              localStorage.setItem(
                `lshorter_pixels_${userId}`,
                JSON.stringify(list)
              );
            } catch {}
          }
        })
        .catch(() => {
          // Fallback to localStorage
          if (typeof window !== "undefined") {
            try {
              const saved = localStorage.getItem(`lshorter_pixels_${userId}`);
              if (saved) setInternalPixels(JSON.parse(saved));
            } catch {}
          }
        })
        .finally(() => setIsLoading(false));
    } else if (typeof window !== "undefined") {
      // Check localStorage for any cached pixels
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith("lshorter_pixels_")) {
            const saved = JSON.parse(localStorage.getItem(k) || "[]");
            if (Array.isArray(saved) && saved.length > 0) {
              setInternalPixels(saved);
              break;
            }
          }
        }
      } catch {}
    }
  }, [isOpen, propAvailablePixels, userId]);

  const allPixels = useMemo(() => {
    if (propAvailablePixels && propAvailablePixels.length > 0) {
      return propAvailablePixels;
    }
    return internalPixels;
  }, [propAvailablePixels, internalPixels]);

  // Sync temp selection from incoming props when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const initialMap: Record<string, boolean> = {};

    selectedPixelIds.forEach((item: any) => {
      if (typeof item === "string") {
        initialMap[item] = true;
      } else if (typeof item === "object" && item !== null) {
        if (item.id) initialMap[item.id] = true;
        if (item.pixelId) initialMap[item.pixelId] = true;
        if (item.platform) initialMap[item.platform] = true;
      }
    });

    // Also match against allPixels if ID, pixelId or platform matches
    allPixels.forEach((px) => {
      const match = selectedPixelIds.some((selected: any) => {
        if (typeof selected === "string") {
          return (
            selected === px.id ||
            selected === px.pixelId ||
            selected === px.platform
          );
        }
        if (typeof selected === "object" && selected !== null) {
          return (
            selected.id === px.id ||
            selected.pixelId === px.pixelId ||
            selected.platform === px.platform
          );
        }
        return false;
      });
      if (match) {
        initialMap[px.id || px.pixelId] = true;
      }
    });

    setTempSelected(initialMap);
    setSearchQuery("");
    setActivePlatformFilter("all");
  }, [isOpen, selectedPixelIds, allPixels]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const togglePixel = (px: any) => {
    const key = px.id || px.pixelId || px.platform;
    setTempSelected((prev) => {
      const next = { ...prev };
      if (next[key]) {
        delete next[key];
        if (px.pixelId) delete next[px.pixelId];
        if (px.id) delete next[px.id];
        if (px.platform) delete next[px.platform];
      } else {
        next[key] = true;
      }
      return next;
    });
  };

  const handleApply = () => {
    // Collect selected pixel items or IDs
    const result: any[] = [];
    allPixels.forEach((px) => {
      const key = px.id || px.pixelId;
      if (
        tempSelected[key] ||
        (px.id && tempSelected[px.id]) ||
        (px.pixelId && tempSelected[px.pixelId]) ||
        (px.platform && tempSelected[px.platform])
      ) {
        result.push({
          id: px.id,
          platform: px.platform,
          pixelId: px.pixelId,
          name: px.name,
        });
      }
    });

    onSave(result);
    onClose();
  };

  // Filtered pixels
  const filteredPixels = useMemo(() => {
    return allPixels.filter((px) => {
      const platform = normalizePixelPlatform(px.platform || px.id);
      if (activePlatformFilter !== "all" && platform !== activePlatformFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = String(px.name || "").toLowerCase().includes(q);
        const idMatch = String(px.pixelId || px.id || "").toLowerCase().includes(q);
        const platformMatch = String(px.platform || "").toLowerCase().includes(q);
        return nameMatch || idMatch || platformMatch;
      }
      return true;
    });
  }, [allPixels, activePlatformFilter, searchQuery]);

  const selectedCount = useMemo(() => {
    return allPixels.filter((px) => {
      const key = px.id || px.pixelId;
      return Boolean(
        tempSelected[key] ||
        (px.id && tempSelected[px.id]) ||
        (px.pixelId && tempSelected[px.pixelId]) ||
        (px.platform && tempSelected[px.platform])
      );
    }).length;
  }, [allPixels, tempSelected]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div
      className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[540px] rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#151518] shadow-2xl overflow-hidden flex flex-col max-h-[85vh] transition-all transform scale-100 animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-[#151518]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0066FF]/10 text-[#0066FF] flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-[15px] font-semibold text-zinc-900 dark:text-white leading-tight">
                Sélectionner des Pixels de Retargeting
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Associez les pixels de suivi configurés dans votre compte pour ce lien
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Fermer"
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
              placeholder="Rechercher par nom ou identifiant de pixel..."
              className="w-full h-8.5 pl-9 pr-3 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-[#18181c] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:border-[#0066FF] dark:focus:border-[#0066FF] transition-colors"
            />
          </div>

          {/* Platform Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
            {[
              { id: "all", label: "Tous" },
              { id: "meta", label: "Meta / FB" },
              { id: "google", label: "Google Analytics (GA4)" },
              { id: "tiktok", label: "TikTok" },
              { id: "linkedin", label: "LinkedIn" },
            ].map((tab) => {
              const isActive = activePlatformFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActivePlatformFilter(tab.id as any)}
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
              <span>Chargement des pixels configurés...</span>
            </div>
          ) : allPixels.length === 0 ? (
            /* Empty State: No Pixels configured on account */
            <div className="py-8 px-4 flex flex-col items-center text-center gap-3">
              <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-400">
                <Target className="w-6 h-6" />
              </div>
              <div className="max-w-xs">
                <h4 className="text-[13.5px] font-semibold text-zinc-900 dark:text-white">
                  Aucun pixel de retargeting configuré
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                  Vous n'avez pas encore enregistré de pixel sur votre compte. Ajoutez-en un dans vos Paramètres pour commencer à recibler vos visiteurs.
                </p>
              </div>
              <Link
                href="/dashboard/settings?tab=pixels"
                onClick={onClose}
                className="mt-2 inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#0066FF] hover:bg-[#0055d4] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ajouter un pixel dans les Paramètres</span>
                <ExternalLink className="w-3 h-3 ml-0.5 opacity-80" />
              </Link>
            </div>
          ) : filteredPixels.length === 0 ? (
            /* Search yielded no results */
            <div className="py-10 text-center text-xs text-zinc-500 dark:text-zinc-400">
              Aucun pixel ne correspond à votre filtre de recherche.
            </div>
          ) : (
            /* List of Pixels */
            <div className="flex flex-col gap-2">
              {filteredPixels.map((px) => {
                const key = px.id || px.pixelId;
                const isSelected = Boolean(
                  tempSelected[key] ||
                  (px.id && tempSelected[px.id]) ||
                  (px.pixelId && tempSelected[px.pixelId]) ||
                  (px.platform && tempSelected[px.platform])
                );

                const platformTag =
                  px.platform === "meta"
                    ? "Meta"
                    : px.platform === "google"
                    ? "GA4"
                    : px.platform === "tiktok"
                    ? "TikTok"
                    : "LinkedIn";

                return (
                  <div
                    key={px.id || px.pixelId}
                    onClick={() => togglePixel(px)}
                    className={cn(
                      "flex items-center justify-between p-2.5 rounded-xl border text-left transition-all cursor-pointer select-none",
                      isSelected
                        ? "bg-[#0066FF]/5 border-[#0066FF] text-zinc-900 dark:text-white ring-1 ring-[#0066FF]/20"
                        : "bg-white dark:bg-[#16181d] border-zinc-200 dark:border-zinc-800/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800/90 flex items-center justify-center shrink-0 border border-zinc-200/80 dark:border-zinc-700/60">
                        <PixelBrandLogo platform={px.platform} className="w-4 h-4" />
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
                          ID : {px.pixelId || px.id}
                        </div>
                      </div>
                    </div>

                    <div
                      className={cn(
                        "w-4.5 h-4.5 rounded-md border flex items-center justify-center shrink-0 transition-colors ml-3",
                        isSelected
                          ? "bg-[#0066FF] border-[#0066FF] text-white"
                          : "border-zinc-300 dark:border-zinc-700 bg-transparent"
                      )}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                  </div>
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
            pixel{selectedCount > 1 ? "s" : ""} sélectionné{selectedCount > 1 ? "s" : ""}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800/80 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={allPixels.length === 0}
              className="px-4 py-1.5 rounded-lg bg-[#0066FF] hover:bg-[#0055d4] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold text-white shadow-xs transition-colors cursor-pointer"
            >
              Appliquer la sélection
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
