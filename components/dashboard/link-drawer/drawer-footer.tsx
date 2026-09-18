"use client";

import React from "react";
import { Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DrawerFooterProps {
  isEditMode: boolean;
  isSubmitting: boolean;
  onDeleteClick: () => void;
  onClose: () => void;
}

export function DrawerFooter({
  isEditMode,
  isSubmitting,
  onDeleteClick,
  onClose,
}: DrawerFooterProps) {
  return (
    <div className="flex items-center justify-between border-t border-zinc-200 dark:border-[#222225] bg-white dark:bg-[#141416] px-4 sm:px-6 py-3.5 shrink-0 z-30">
      <div>
        {isEditMode && (
          <button
            type="button"
            onClick={onDeleteClick}
            disabled={isSubmitting}
            className="text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-3 py-1.5 rounded-[6px] transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete Link</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onClose}
          className="bg-white dark:bg-[#18181c] border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-white/5 text-xs h-9 rounded-[8px] px-4 cursor-pointer text-zinc-700 dark:text-neutral-300 hover:text-zinc-900 dark:hover:text-white"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="link-drawer-form"
          disabled={isSubmitting}
          className="bg-brand hover:bg-brand-hover shadow-[var(--brand-primary-light)] text-white font-bold text-xs h-9 rounded-[8px] px-5 shadow-lg transition-all cursor-pointer flex items-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Saving...</span>
            </>
          ) : (
            <span>
              {isEditMode ? "Save Changes" : "Create Link"}
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
