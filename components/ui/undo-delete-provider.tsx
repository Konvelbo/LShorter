"use client";

import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { Trash2, RotateCcw, X } from "lucide-react";
import { showToast } from "./toast-provider";

export interface UndoDeleteOptions {
  id: string;
  itemType?: "link" | "api_key" | "domain" | "pixel" | "webhook" | "other";
  title?: string;
  description?: string;
  duration?: number; // In seconds, default 10
  onExecute: () => Promise<void> | void;
  onCancel?: () => void;
}

interface PendingDeleteItem extends UndoDeleteOptions {
  remaining: number;
  totalDuration: number;
}

export interface UndoDeleteActions {
  triggerUndoDelete: (options: UndoDeleteOptions) => void;
  cancelUndoDelete: () => void;
  commitUndoDelete: () => void;
}

const UndoDeleteActionsContext = createContext<UndoDeleteActions | null>(null);

let globalUndoDeleteHandler: ((options: UndoDeleteOptions) => void) | null = null;
let globalCancelHandler: (() => void) | null = null;
let globalCommitHandler: (() => void) | null = null;

export const triggerGlobalUndoDelete = (options: UndoDeleteOptions) => {
  if (globalUndoDeleteHandler) {
    globalUndoDeleteHandler(options);
  } else {
    // Fallback: execute immediately if provider isn't mounted yet
    void Promise.resolve(options.onExecute()).catch(console.error);
  }
};

export const cancelGlobalUndoDelete = () => {
  globalCancelHandler?.();
};

export const commitGlobalUndoDelete = () => {
  globalCommitHandler?.();
};

export function UndoDeleteProvider({ children }: { children: React.ReactNode }) {
  const [pendingItem, setPendingItem] = useState<PendingDeleteItem | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pendingItemRef = useRef<PendingDeleteItem | null>(null);

  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Commit deletion immediately (execute onExecute)
  const commitUndoDelete = useCallback(async () => {
    const current = pendingItemRef.current;
    clearTimers();
    pendingItemRef.current = null;
    setPendingItem(null);
    if (current) {
      try {
        await current.onExecute();
      } catch (err) {
        console.error("Failed to execute deletion:", err);
        showToast.error("Erreur lors de la suppression.");
      }
    }
  }, [clearTimers]);

  // Cancel deletion and restore state
  const cancelUndoDelete = useCallback(() => {
    const current = pendingItemRef.current;
    clearTimers();
    pendingItemRef.current = null;
    setPendingItem(null);
    if (current) {
      try {
        current.onCancel?.();
        showToast.info("Suppression annulée.");
      } catch (err) {
        console.error("Failed to cancel deletion:", err);
      }
    }
  }, [clearTimers]);

  // Trigger a new undoable deletion with 10s delay
  const triggerUndoDelete = useCallback(
    (options: UndoDeleteOptions) => {
      // If there's an active item, commit it immediately in the background before starting the next
      if (pendingItemRef.current) {
        const prev = pendingItemRef.current;
        clearTimers();
        void Promise.resolve(prev.onExecute()).catch((err) => {
          console.error("Failed to execute previous deletion:", err);
        });
      }

      const totalDuration = options.duration && options.duration > 0 ? options.duration : 10;
      const newItem: PendingDeleteItem = {
        ...options,
        remaining: totalDuration,
        totalDuration,
      };

      // Synchronously record ref to eliminate race conditions
      pendingItemRef.current = newItem;
      setPendingItem(newItem);

      // Decrement every 1 second
      intervalRef.current = setInterval(() => {
        setPendingItem((prev) => {
          if (!prev) return null;
          const nextRemaining = prev.remaining <= 1 ? 0 : prev.remaining - 1;
          if (pendingItemRef.current) {
            pendingItemRef.current.remaining = nextRemaining;
          }
          return { ...prev, remaining: nextRemaining };
        });
      }, 1000);

      // Execute deletion after totalDuration * 1000 ms
      timeoutRef.current = setTimeout(async () => {
        const itemToExecute = pendingItemRef.current;
        clearTimers();
        pendingItemRef.current = null;
        setPendingItem(null);
        if (itemToExecute) {
          try {
            await itemToExecute.onExecute();
          } catch (err) {
            console.error("Failed to execute deletion on timeout:", err);
            showToast.error("Erreur lors de la suppression.");
          }
        }
      }, totalDuration * 1000);
    },
    [clearTimers]
  );

  // Hook global listeners
  useEffect(() => {
    globalUndoDeleteHandler = triggerUndoDelete;
    globalCancelHandler = cancelUndoDelete;
    globalCommitHandler = commitUndoDelete;

    if (typeof window !== "undefined") {
      (window as any).__lshorter_triggerUndoDelete = triggerUndoDelete;
    }

    // Window beforeunload commit fallback
    const handleBeforeUnload = () => {
      if (pendingItemRef.current) {
        try {
          void Promise.resolve(pendingItemRef.current.onExecute()).catch(console.error);
        } catch {}
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      globalUndoDeleteHandler = null;
      globalCancelHandler = null;
      globalCommitHandler = null;
      window.removeEventListener("beforeunload", handleBeforeUnload);
      clearTimers();
    };
  }, [triggerUndoDelete, cancelUndoDelete, commitUndoDelete, clearTimers]);

  // Memoize stable actions context value so consumers NEVER re-render on countdown ticks
  const actionsValue = useMemo<UndoDeleteActions>(
    () => ({
      triggerUndoDelete,
      cancelUndoDelete,
      commitUndoDelete,
    }),
    [triggerUndoDelete, cancelUndoDelete, commitUndoDelete]
  );

  const progressPercent = pendingItem
    ? Math.max(0, Math.min(100, (pendingItem.remaining / pendingItem.totalDuration) * 100))
    : 0;

  return (
    <UndoDeleteActionsContext.Provider value={actionsValue}>
      {children}

      {/* Floating Undo Toast at Top Center */}
      {pendingItem && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto w-full max-w-[420px] px-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            role="status"
            aria-live="polite"
            className="relative overflow-hidden w-full rounded-[10px] bg-white/95 dark:bg-[#121316]/95 border border-neutral-200 dark:border-[#272a37] p-3 text-neutral-900 dark:text-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.85)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3">
              {/* Left: Icon & Text */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-[8px] bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <Trash2 className="w-3.5 h-3.5 stroke-[2.25]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-neutral-900 dark:text-white truncate leading-tight">
                    {pendingItem.title || "Élément supprimé"}
                  </div>
                  {pendingItem.description && (
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate leading-normal mt-0.5">
                      {pendingItem.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Action: Button "Annuler" + Countdown + Instant Commit */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={cancelUndoDelete}
                  className="h-7 px-2.5 rounded-[6px] bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 font-semibold text-xs transition-all flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95"
                  title="Annuler la suppression"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Annuler</span>
                  <span className="font-mono text-[10px] font-bold tabular-nums opacity-80 border-l border-white/20 dark:border-black/20 pl-1">
                    {pendingItem.remaining}s
                  </span>
                </button>

                <button
                  type="button"
                  onClick={commitUndoDelete}
                  className="p-1 rounded-[6px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label="Supprimer immédiatement"
                  title="Supprimer immédiatement"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Subtle Progress Bar (10s countdown) */}
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-neutral-100 dark:bg-[#1f222c]">
              <div
                className="h-full bg-rose-500 dark:bg-rose-500 transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </UndoDeleteActionsContext.Provider>
  );
}

export function useUndoDelete() {
  const context = useContext(UndoDeleteActionsContext);
  if (!context) {
    return {
      triggerUndoDelete: triggerGlobalUndoDelete,
      cancelUndoDelete: cancelGlobalUndoDelete,
      commitUndoDelete: commitGlobalUndoDelete,
    };
  }
  return context;
}
