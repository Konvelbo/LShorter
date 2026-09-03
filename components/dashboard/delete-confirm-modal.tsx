"use client";

import React from "react";
import { AlertTriangle, Trash2, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemCount?: number;
  itemLabels?: string[];
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Supprimer ce lien court définitivement ?",
  description = "Cette action est irréversible. La redirection sera immédiatement désactivée et toutes les statistiques associées seront effacées.",
  itemCount = 1,
  itemLabels = [],
  isDeleting = false,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-[#141416] border border-[#27272a] rounded-[16px] shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Danger Icon */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 shadow-lg shadow-red-500/10">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1 pr-4">
            <h3 className="text-base font-bold text-white leading-snug">
              {itemCount > 1 ? `Supprimer ${itemCount} liens définitivement ?` : title}
            </h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Items preview if any */}
        {itemLabels.length > 0 && (
          <div className="bg-[#1a1a1e] border border-[#27272a] rounded-xl p-3 max-h-28 overflow-y-auto flex flex-wrap gap-1.5">
            {itemLabels.slice(0, 10).map((label, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 font-mono text-[11px] font-semibold"
              >
                /{label}
              </span>
            ))}
            {itemLabels.length > 10 && (
              <span className="text-[11px] text-neutral-500 self-center px-1 font-mono">
                +{itemLabels.length - 10} autres...
              </span>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#222225]">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isDeleting}
            className="h-9 px-4 text-xs font-semibold border-[#27272a] bg-[#1a1a1e] hover:bg-white/5 text-neutral-300 hover:text-white cursor-pointer"
          >
            Annuler
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="h-9 px-4 text-xs font-bold bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 border border-red-500/30 gap-2 cursor-pointer transition-all"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Suppression...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>{itemCount > 1 ? `Supprimer (${itemCount})` : "Supprimer définitivement"}</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
