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
import { Trash2, X, Check } from "lucide-react";
import { showToast } from "./toast-provider";
import { useI18n } from "@/components/providers/i18n-provider";

export interface UndoDeleteOptions {
  id: string;
  itemType?: "link" | "api_key" | "domain" | "pixel" | "webhook" | "other";
  title?: string;
  description?: string;
  duration?: number;
  confirmText?: string;
  modalTitle?: string;
  modalQuestion?: string;
  inputPlaceholder?: string;
  confirmButtonLabel?: string;
  onExecute: () => Promise<boolean | void> | boolean | void;
  onCancel?: () => void;
}

interface CompletedDeleteToast {
  id: string;
  title: string;
  description?: string;
}

export interface UndoDeleteActions {
  triggerUndoDelete: (options: UndoDeleteOptions) => void;
  cancelUndoDelete: () => void;
  commitUndoDelete: () => void;
}

declare global {
  interface Window {
    __lshorter_triggerUndoDelete?: (options: UndoDeleteOptions) => void;
  }
}

const UndoDeleteActionsContext = createContext<UndoDeleteActions | null>(null);

let globalUndoDeleteHandler: ((options: UndoDeleteOptions) => void) | null = null;
let globalCancelHandler: (() => void) | null = null;
let globalCommitHandler: (() => void) | null = null;

export const triggerGlobalUndoDelete = (options: UndoDeleteOptions) => {
  if (globalUndoDeleteHandler) {
    globalUndoDeleteHandler(options);
  } else {
    void Promise.resolve(options.onExecute()).catch(console.error);
  }
};

export const cancelGlobalUndoDelete = () => {
  globalCancelHandler?.();
};

export const commitGlobalUndoDelete = () => {
  globalCommitHandler?.();
};

function resolveModalCopy(item: UndoDeleteOptions, isFr: boolean) {
  const rawDesc = (item.description || "").trim();
  const cleanSlug = rawDesc.replace(/^\/+/, "").trim();
  const customConfirm = (item.confirmText || "").trim();
  const isBulk =
    /liens supprimés|links deleted/i.test(item.title || "") ||
    /^\d+\s+(liens|links)/i.test(rawDesc) ||
    (item.id.startsWith("bulk_") && (!customConfirm || customConfirm === "DELETE"));

  switch (item.itemType) {
    case "domain":
      return {
        modalTitle: item.modalTitle || (isFr ? "Supprimer le domaine" : "Delete domain"),
        modalQuestion:
          item.modalQuestion ||
          (isFr
            ? "Voulez-vous vraiment supprimer ce domaine ?"
            : "Are you sure you want to delete this domain?"),
        confirmText: customConfirm || rawDesc || "DELETE",
        copyAriaLabel: isFr ? "Copier le nom de domaine" : "Copy domain name",
        inputAriaLabel: isFr ? "Nom de domaine" : "Domain name",
        inputPlaceholder:
          item.inputPlaceholder || (isFr ? "Saisir le nom de domaine" : "Enter domain name"),
        confirmButtonLabel:
          item.confirmButtonLabel || (isFr ? "Supprimer le domaine" : "Delete domain"),
      };
    case "api_key":
      return {
        modalTitle: item.modalTitle || (isFr ? "Révoquer la clé API" : "Delete API key"),
        modalQuestion:
          item.modalQuestion ||
          (isFr
            ? "Voulez-vous vraiment révoquer cette clé API ?"
            : "Are you sure you want to revoke this API key?"),
        confirmText: customConfirm || rawDesc || "DELETE",
        copyAriaLabel: isFr ? "Copier le nom de la clé API" : "Copy API key name",
        inputAriaLabel: isFr ? "Nom de la clé API" : "API key name",
        inputPlaceholder:
          item.inputPlaceholder || (isFr ? "Saisir le nom de la clé API" : "Enter API key name"),
        confirmButtonLabel:
          item.confirmButtonLabel || (isFr ? "Supprimer la clé API" : "Delete API key"),
      };
    case "webhook":
      return {
        modalTitle: item.modalTitle || (isFr ? "Supprimer le webhook" : "Delete webhook"),
        modalQuestion:
          item.modalQuestion ||
          (isFr
            ? "Voulez-vous vraiment supprimer ce webhook ?"
            : "Are you sure you want to delete this webhook?"),
        confirmText: customConfirm || rawDesc || "DELETE",
        copyAriaLabel: isFr ? "Copier l'URL du webhook" : "Copy webhook URL",
        inputAriaLabel: isFr ? "URL du webhook" : "Webhook URL",
        inputPlaceholder:
          item.inputPlaceholder || (isFr ? "Saisir l'URL du webhook" : "Enter webhook URL"),
        confirmButtonLabel:
          item.confirmButtonLabel || (isFr ? "Supprimer le webhook" : "Delete webhook"),
      };
    case "pixel":
      return {
        modalTitle: item.modalTitle || (isFr ? "Supprimer le pixel" : "Delete pixel"),
        modalQuestion:
          item.modalQuestion ||
          (isFr
            ? "Voulez-vous vraiment supprimer ce pixel ?"
            : "Are you sure you want to delete this pixel?"),
        confirmText: customConfirm || rawDesc || "DELETE",
        copyAriaLabel: isFr ? "Copier le nom du pixel" : "Copy pixel name",
        inputAriaLabel: isFr ? "Nom du pixel" : "Pixel name",
        inputPlaceholder:
          item.inputPlaceholder || (isFr ? "Saisir le nom du pixel" : "Enter pixel name"),
        confirmButtonLabel:
          item.confirmButtonLabel || (isFr ? "Supprimer le pixel" : "Delete pixel"),
      };
    case "other":
      return {
        modalTitle: item.modalTitle || (isFr ? "Supprimer l'alerte" : "Delete alert"),
        modalQuestion:
          item.modalQuestion ||
          (isFr
            ? "Voulez-vous vraiment supprimer cette alerte ?"
            : "Are you sure you want to delete this alert?"),
        confirmText: customConfirm || cleanSlug || "DELETE",
        copyAriaLabel: isFr ? "Copier le nom" : "Copy name",
        inputAriaLabel: isFr ? "Nom de confirmation" : "Confirmation name",
        inputPlaceholder:
          item.inputPlaceholder || (isFr ? "Saisir le nom pour confirmer" : "Enter name to confirm"),
        confirmButtonLabel:
          item.confirmButtonLabel || (isFr ? "Supprimer l'alerte" : "Delete alert"),
      };
    case "link":
    default:
      if (isBulk) {
        return {
          modalTitle: item.modalTitle || (isFr ? "Supprimer les liens" : "Delete links"),
          modalQuestion:
            item.modalQuestion ||
            (isFr
              ? "Voulez-vous vraiment supprimer les liens sélectionnés ?"
              : "Are you sure you want to delete the selected links?"),
          confirmText: customConfirm || "DELETE",
          copyAriaLabel: isFr ? "Copier le texte de confirmation" : "Copy confirmation text",
          inputAriaLabel: isFr ? "Texte de confirmation" : "Confirmation text",
          inputPlaceholder:
            item.inputPlaceholder ||
            (isFr ? "Saisir DELETE pour confirmer" : "Enter DELETE to confirm"),
          confirmButtonLabel:
            item.confirmButtonLabel || (isFr ? "Supprimer les liens" : "Delete links"),
        };
      }
      return {
        modalTitle: item.modalTitle || (isFr ? "Supprimer le lien" : "Delete link"),
        modalQuestion:
          item.modalQuestion ||
          (isFr
            ? "Voulez-vous vraiment supprimer ce lien ?"
            : "Are you sure you want to delete this link?"),
        confirmText: customConfirm || cleanSlug || (isFr ? "Sans titre" : "Untitled"),
        copyAriaLabel: isFr ? "Copier le nom du lien" : "Copy link name",
        inputAriaLabel: isFr ? "Nom du lien" : "Link name",
        inputPlaceholder:
          item.inputPlaceholder || (isFr ? "Saisir le nom du lien" : "Enter link name"),
        confirmButtonLabel:
          item.confirmButtonLabel || (isFr ? "Supprimer le lien" : "Delete link"),
      };
  }
}

export function UndoDeleteProvider({ children }: { children: React.ReactNode }) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [pendingItem, setPendingItem] = useState<UndoDeleteOptions | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [inputErrorFlash, setInputErrorFlash] = useState(false);
  const [completedToast, setCompletedToast] = useState<CompletedDeleteToast | null>(
    null
  );

  const pendingItemRef = useRef<UndoDeleteOptions | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearModalTimers = useCallback(() => {
    if (flashTimerRef.current) {
      clearTimeout(flashTimerRef.current);
      flashTimerRef.current = null;
    }
    if (copyTimerRef.current) {
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = null;
    }
  }, []);

  const clearToastTimer = useCallback(() => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
  }, []);

  const dismissCompletedToast = useCallback(() => {
    clearToastTimer();
    setCompletedToast(null);
  }, [clearToastTimer]);

  const showPostDeleteToast = useCallback(
    (item: UndoDeleteOptions) => {
      clearToastTimer();
      setCompletedToast({
        id: item.id,
        title: item.title || (isFr ? "Lien supprimé" : "Link deleted"),
        description: item.description,
      });
      toastTimerRef.current = setTimeout(() => {
        setCompletedToast(null);
        toastTimerRef.current = null;
      }, 4000);
    },
    [clearToastTimer, isFr]
  );

  // Commit deletion after user confirms in the modal
  const commitUndoDelete = useCallback(async () => {
    const current = pendingItemRef.current;
    if (!current) return;

    clearModalTimers();
    pendingItemRef.current = null;
    setPendingItem(null);
    setInputValue("");
    setCopiedBadge(false);
    setInputErrorFlash(false);

    try {
      const result = await current.onExecute();
      if (result !== false) {
        showPostDeleteToast(current);
      }
    } catch (err) {
      console.error("Failed to execute deletion:", err);
      showToast.error(isFr ? "Erreur lors de la suppression." : "Error during deletion.");
    }
  }, [clearModalTimers, showPostDeleteToast, isFr]);

  // Cancel modal without deleting
  const cancelUndoDelete = useCallback(() => {
    const current = pendingItemRef.current;
    clearModalTimers();
    pendingItemRef.current = null;
    setPendingItem(null);
    setInputValue("");
    setCopiedBadge(false);
    setInputErrorFlash(false);

    if (current) {
      try {
        current.onCancel?.();
      } catch (err) {
        console.error("Failed to cancel deletion:", err);
      }
    }

    const prevEl = previousActiveElementRef.current;
    previousActiveElementRef.current = null;
    if (prevEl && typeof prevEl.focus === "function") {
      setTimeout(() => {
        try {
          prevEl.focus();
        } catch {}
      }, 0);
    }
  }, [clearModalTimers]);

  // Open the confirmation modal
  const triggerUndoDelete = useCallback(
    (options: UndoDeleteOptions) => {
      clearModalTimers();
      if (typeof document !== "undefined") {
        previousActiveElementRef.current =
          document.activeElement as HTMLElement | null;
      }
      pendingItemRef.current = options;
      setInputValue("");
      setCopiedBadge(false);
      setInputErrorFlash(false);
      setPendingItem(options);
    },
    [clearModalTimers]
  );

  // Focus input when modal opens
  useEffect(() => {
    if (pendingItem) {
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [pendingItem]);

  const modalCopy = useMemo(
    () => (pendingItem ? resolveModalCopy(pendingItem, isFr) : null),
    [pendingItem, isFr]
  );

  const isConfirmationMatched = useMemo(() => {
    if (!modalCopy) return false;
    // For single link deletions, clicking the delete button in the modal is immediate confirmation
    if (pendingItem?.itemType === "link" && !pendingItem.id.startsWith("bulk_")) {
      return true;
    }
    const expected = modalCopy.confirmText.trim();
    const typed = inputValue.trim();
    if (!typed || !expected) return false;
    return (
      typed === expected ||
      typed.replace(/^\/+/, "") === expected.replace(/^\/+/, "")
    );
  }, [modalCopy, inputValue, pendingItem]);

  const handleConfirmAttempt = useCallback(() => {
    if (!pendingItem) return;
    if (!isConfirmationMatched) {
      inputRef.current?.focus();
      setInputErrorFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => {
        setInputErrorFlash(false);
        flashTimerRef.current = null;
      }, 600);
      return;
    }
    void commitUndoDelete();
  }, [pendingItem, isConfirmationMatched, commitUndoDelete]);

  // Keyboard shortcuts & Focus trap: Esc to cancel, Ctrl+Enter/Cmd+Enter to confirm, Tab trapped inside modal
  useEffect(() => {
    if (!pendingItem) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        cancelUndoDelete();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        handleConfirmAttempt();
      } else if (e.key === "Tab" && dialogRef.current) {
        e.stopPropagation();
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter((el) => el.offsetParent !== null);

        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement as HTMLElement | null;

        if (e.shiftKey) {
          if (!dialogRef.current.contains(active) || active === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (!dialogRef.current.contains(active) || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [pendingItem, cancelUndoDelete, handleConfirmAttempt]);

  // Hook global listeners
  useEffect(() => {
    globalUndoDeleteHandler = triggerUndoDelete;
    globalCancelHandler = cancelUndoDelete;
    globalCommitHandler = commitUndoDelete;

    if (typeof window !== "undefined") {
      window.__lshorter_triggerUndoDelete = triggerUndoDelete;
    }

    return () => {
      globalUndoDeleteHandler = null;
      globalCancelHandler = null;
      globalCommitHandler = null;
      if (typeof window !== "undefined") {
        delete window.__lshorter_triggerUndoDelete;
      }
      clearModalTimers();
      clearToastTimer();
    };
  }, [
    triggerUndoDelete,
    cancelUndoDelete,
    commitUndoDelete,
    clearModalTimers,
    clearToastTimer,
  ]);

  const handleCopyConfirmText = useCallback(() => {
    if (!modalCopy) return;
    navigator.clipboard?.writeText(modalCopy.confirmText).catch(() => {});
    setInputValue(modalCopy.confirmText);
    setCopiedBadge(true);
    inputRef.current?.focus();
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    copyTimerRef.current = setTimeout(() => {
      setCopiedBadge(false);
      copyTimerRef.current = null;
    }, 1500);
  }, [modalCopy]);

  const actionsValue = useMemo<UndoDeleteActions>(
    () => ({
      triggerUndoDelete,
      cancelUndoDelete,
      commitUndoDelete,
    }),
    [triggerUndoDelete, cancelUndoDelete, commitUndoDelete]
  );

  return (
    <UndoDeleteActionsContext.Provider value={actionsValue}>
      {children}

      {/* Broadcast-style Delete Confirmation Modal */}
      {pendingItem && modalCopy && (
        <div
          onClick={cancelUndoDelete}
          className="fixed inset-0 z-[100000] box-border px-4 sm:px-0 bg-[rgba(9,9,11,0.5)] dark:bg-[rgba(0,0,0,0.72)] backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-150"
          style={{
            fontFamily:
              "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
          }}
        >
          <div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={modalCopy.modalTitle}
            onClick={(e) => e.stopPropagation()}
            className="box-border w-full max-w-[440px] sm:w-[440px] p-4 sm:p-6 rounded-[10px] bg-[#ffffff] dark:bg-[#141416] border border-[#e4e4e7] dark:border-[#27272a] shadow-[0_24px_48px_-12px_rgba(9,9,11,0.22),0_4px_12px_rgba(9,9,11,0.06)] dark:shadow-[0_24px_56px_-12px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.05)] animate-in zoom-in-95 duration-150"
          >
            {/* Header */}
            <div className="flex items-center sm:items-start justify-between">
              <h2 className="m-0 text-[16px] leading-[24px] sm:leading-[1.3] font-semibold text-[#09090b] dark:text-[#fafafa]">
                {modalCopy.modalTitle}
              </h2>
              <button
                type="button"
                aria-label={isFr ? "Fermer" : "Close"}
                onClick={cancelUndoDelete}
                className="inline-flex items-center justify-center w-[44px] h-[44px] -my-[10px] -mr-[10px] ml-0 sm:w-[32px] sm:h-[32px] sm:-mt-[4px] sm:-mr-[6px] sm:mb-0 sm:ml-0 p-0 border-0 rounded-[8px] bg-transparent text-[#52525b] dark:text-[#a1a1aa] hover:bg-[#f4f4f5] dark:hover:bg-[#27272a]/60 hover:text-[#09090b] dark:hover:text-[#fafafa] transition-colors cursor-pointer"
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </div>

            {/* Desktop Warning (2 stacked lines) */}
            <div className="hidden sm:flex mt-4 flex-col gap-1">
              <p className="m-0 text-[14px] leading-[1.5] text-[#52525b] dark:text-[#a1a1aa]">
                {modalCopy.modalQuestion}
              </p>
              <p className="m-0 text-[14px] leading-[1.5] font-semibold text-[#dc2626] dark:text-[#f87171]">
                {isFr ? "Cette action est irréversible." : "This cannot be undone."}
              </p>
            </div>

            {/* Mobile Warning (inline paragraph) */}
            <p className="sm:hidden mt-3 mb-0 text-[14px] leading-[1.45] text-[#52525b] dark:text-[#a1a1aa]">
              {modalCopy.modalQuestion}{" "}
              <span className="font-semibold text-[#dc2626] dark:text-[#f87171]">
                {isFr ? "Cette action est irréversible." : "This cannot be undone."}
              </span>
            </p>

            {/* Type-to-confirm Prompt & Copy Badge OR Clean Single Link Confirmation */}
            {pendingItem.itemType === "link" && !pendingItem.id.startsWith("bulk_") ? (
              <div className="mt-3.5 mb-2 sm:mt-4 sm:mb-2 flex items-center gap-2 p-2.5 rounded-[8px] bg-red-50/70 dark:bg-red-950/20 border border-red-200/60 dark:border-red-900/40">
                <span className="text-[13px] font-medium text-red-700 dark:text-red-400">
                  {isFr ? "Lien concerné :" : "Selected link:"}
                </span>
                <span className="inline-flex items-center font-mono font-bold text-[13px] text-red-900 dark:text-red-300">
                  {modalCopy.confirmText.startsWith("/") ? modalCopy.confirmText : `/${modalCopy.confirmText}`}
                </span>
              </div>
            ) : (
              <>
                <p
                  id="delete-confirm-prompt"
                  className="mt-3 mb-2 sm:mt-4 sm:mb-[10px] text-[14px] leading-[1.45] sm:leading-[1.5] text-[#52525b] dark:text-[#a1a1aa]"
                >
                  {isFr ? "Tapez " : "Type "}
                  <span className="inline-flex items-center gap-[4px] sm:gap-[6px] align-middle bg-[#f4f4f5] dark:bg-[#27272a] border border-[#e4e4e7] dark:border-[#27272a] rounded-[6px] py-[1px] pr-[2px] pl-[8px] sm:py-[2px] sm:pr-[4px] sm:pl-[8px] text-[13px] font-medium text-[#09090b] dark:text-[#fafafa] max-w-full">
                    <span className="truncate max-w-[240px]">
                      {modalCopy.confirmText}
                    </span>
                    <button
                      type="button"
                      aria-label={modalCopy.copyAriaLabel}
                      onClick={handleCopyConfirmText}
                      className="inline-flex items-center justify-center w-[28px] h-[28px] sm:w-[22px] sm:h-[22px] m-0 p-0 border-0 rounded-[4px] bg-transparent text-[#52525b] dark:text-[#a1a1aa] hover:bg-black/5 dark:hover:bg-white/10 hover:text-[#09090b] dark:hover:text-[#fafafa] transition-colors cursor-pointer shrink-0"
                    >
                      {copiedBadge ? (
                        <Check className="w-[13px] h-[13px] text-emerald-600 dark:text-emerald-400 stroke-[2.2]" />
                      ) : (
                        <svg
                          width="13"
                          height="13"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          aria-hidden="true"
                        >
                          <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                          <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                      )}
                    </button>
                  </span>{" "}
                  {isFr ? "pour confirmer." : "to confirm."}
                </p>

                {/* Confirmation Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleConfirmAttempt();
                    }
                  }}
                  aria-label={modalCopy.inputAriaLabel}
                  aria-describedby="delete-confirm-prompt"
                  aria-invalid={inputErrorFlash}
                  placeholder={modalCopy.inputPlaceholder}
                  className={`box-border w-full h-[44px] sm:h-[40px] px-[12px] rounded-[8px] bg-[#ffffff] dark:bg-[#1f1f23] text-[#09090b] dark:text-[#fafafa] placeholder:text-[#a1a1aa] dark:placeholder:text-[#71717a] text-[16px] sm:text-[14px] outline-none transition-all ${
                    inputErrorFlash
                      ? "border border-[#dc2626] shadow-[0_0_0_3px_rgba(220,38,38,0.22)] dark:shadow-[0_0_0_3px_rgba(248,113,113,0.30)]"
                      : "border border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.18)] dark:shadow-[0_0_0_3px_rgba(0,102,255,0.30)]"
                  }`}
                  style={{
                    fontFamily:
                      "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
                  }}
                />
              </>
            )}

            {/* Footer Actions */}
            <div className="mt-4 sm:mt-6 flex sm:justify-end gap-2 sm:gap-[10px]">
              <button
                type="button"
                onClick={cancelUndoDelete}
                className="flex-1 sm:flex-initial h-[44px] sm:h-[40px] rounded-[8px] text-[14px] font-semibold inline-flex items-center justify-center gap-2 px-2 sm:px-4 cursor-pointer bg-[#ffffff] dark:bg-[#1f1f23] text-[#09090b] dark:text-[#fafafa] border border-[#d0d5dd] dark:border-[#2e2e33] hover:bg-[#f4f4f5]/60 dark:hover:bg-[#27272a] transition-colors"
                style={{
                  fontFamily:
                    "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
                }}
              >
                <span>{isFr ? "Annuler" : "Cancel"}</span>
                <span className="hidden sm:inline-flex items-center h-[18px] px-[5px] rounded-[4px] bg-[#f4f4f5] dark:bg-[#27272a] text-[#52525b] dark:text-[#a1a1aa] text-[11px] font-medium">
                  Esc
                </span>
              </button>

              <button
                type="button"
                onClick={handleConfirmAttempt}
                className={`flex-1 sm:flex-initial h-[44px] sm:h-[40px] rounded-[8px] text-[14px] font-semibold inline-flex items-center justify-center gap-2 px-3 sm:px-5 transition-all ${
                  isConfirmationMatched
                    ? "cursor-pointer bg-[#dc2626] hover:bg-[#b91c1c] text-white shadow-sm active:scale-[0.99]"
                    : "cursor-pointer opacity-70 bg-[#dc2626]/20 text-[#b91c1c] dark:text-[#f87171] border border-red-500/20"
                }`}
                style={{
                  fontFamily:
                    "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
                }}
              >
                <span>{modalCopy.confirmButtonLabel}</span>
                <span className="hidden sm:inline-flex items-center h-[18px] px-[5px] rounded-[4px] bg-black/20 text-white text-[11px] font-medium">
                  {isFr ? "Entrée ↵" : "Enter ↵"}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Post-Deletion Notification Toast (No Countdown Timer / No Undo Button) */}
      {completedToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[99999] pointer-events-auto w-full max-w-[390px] px-3 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            role="status"
            aria-live="polite"
            className="relative overflow-hidden w-full rounded-[10px] bg-white dark:bg-[#121214] border border-neutral-200/90 dark:border-white/10 p-2.5 sm:p-3 text-neutral-900 dark:text-neutral-100 shadow-[0_10px_30px_rgba(0,0,0,0.10)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.65)] backdrop-blur-xl"
          >
            <div className="flex items-center justify-between gap-3">
              {/* Left: Icon & Text */}
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <div className="w-7 h-7 rounded-[7px] bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 flex items-center justify-center shrink-0">
                  <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-semibold text-neutral-900 dark:text-white truncate leading-tight">
                    {completedToast.title}
                  </div>
                  {completedToast.description && (
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono truncate leading-normal mt-0.5">
                      {completedToast.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Action: Close Button Only */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={dismissCompletedToast}
                  className="p-1 rounded-[6px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                  aria-label={isFr ? "Fermer" : "Close"}
                  title={isFr ? "Fermer" : "Close"}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
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
