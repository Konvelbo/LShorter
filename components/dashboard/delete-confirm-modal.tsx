"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Check } from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  itemCount?: number;
  itemLabels?: string[];
  confirmText?: string;
  isDeleting?: boolean;
}

export function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemCount = 1,
  itemLabels = [],
  confirmText,
  isDeleting = false,
}: DeleteConfirmModalProps) {
  const { tr } = useI18n();
  const [inputValue, setInputValue] = useState("");
  const [copiedBadge, setCopiedBadge] = useState(false);
  const [inputErrorFlash, setInputErrorFlash] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const flashTimerRef = useRef<NodeJS.Timeout | null>(null);
  const copyTimerRef = useRef<NodeJS.Timeout | null>(null);

  const effectiveConfirmText =
    confirmText?.trim() ||
    (itemLabels.length === 1
      ? itemLabels[0].replace(/^\/+/, "").trim()
      : itemCount > 1
        ? tr("DELETE", "SUPPRIMER")
        : tr("Untitled", "Sans titre"));

  const modalTitle =
    title || (itemCount > 1 ? tr("Delete links", "Supprimer les liens") : tr("Delete link", "Supprimer le lien"));
  const modalQuestion =
    description ||
    (itemCount > 1
      ? tr(
          `Are you sure you want to delete these ${itemCount} links?`,
          `Voulez-vous vraiment supprimer ces ${itemCount} liens ?`
        )
      : tr(
          "Are you sure you want to delete this link?",
          "Voulez-vous vraiment supprimer ce lien ?"
        ));
  const confirmButtonLabel =
    itemCount > 1 ? tr("Delete links", "Supprimer les liens") : tr("Delete link", "Supprimer le lien");

  const typed = inputValue.trim();
  const expected = effectiveConfirmText.trim();
  const isMatched =
    Boolean(typed && expected) &&
    (typed === expected ||
      typed.replace(/^\/+/, "") === expected.replace(/^\/+/, ""));

  const handleClose = useCallback(() => {
    if (isDeleting) return;
    setInputValue("");
    setCopiedBadge(false);
    setInputErrorFlash(false);
    onClose();
  }, [isDeleting, onClose]);

  const handleConfirmAttempt = useCallback(() => {
    if (isDeleting) return;
    if (!isMatched) {
      inputRef.current?.focus();
      setInputErrorFlash(true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      flashTimerRef.current = setTimeout(() => {
        setInputErrorFlash(false);
        flashTimerRef.current = null;
      }, 600);
      return;
    }
    setInputValue("");
    void onConfirm();
  }, [isDeleting, isMatched, onConfirm]);

  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => inputRef.current?.focus(), 20);
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      } else if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        e.stopPropagation();
        handleConfirmAttempt();
      }
    };
    window.addEventListener("keydown", handleKeyDown, true);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", handleKeyDown, true);
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, [isOpen, handleClose, handleConfirmAttempt]);

  if (!isOpen) return null;

  return (
    <div
      onClick={handleClose}
      className="fixed inset-0 z-[100000] box-border px-4 sm:px-0 bg-[rgba(9,9,11,0.5)] dark:bg-[rgba(0,0,0,0.72)] backdrop-blur-[2px] flex items-center justify-center animate-in fade-in duration-150"
      style={{
        fontFamily:
          "Inter, system-ui, -apple-system, 'Segoe UI', sans-serif",
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={modalTitle}
        onClick={(e) => e.stopPropagation()}
        className="box-border w-full max-w-[440px] sm:w-[440px] p-4 sm:p-6 rounded-[10px] bg-[#ffffff] dark:bg-[#141416] border border-[#e4e4e7] dark:border-[#27272a] shadow-[0_24px_48px_-12px_rgba(9,9,11,0.22),0_4px_12px_rgba(9,9,11,0.06)] dark:shadow-[0_24px_56px_-12px_rgba(0,0,0,0.85),0_0_1px_1px_rgba(255,255,255,0.05)] animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center sm:items-start justify-between">
          <h2 className="m-0 text-[16px] leading-[24px] sm:leading-[1.3] font-semibold text-[#09090b] dark:text-[#fafafa]">
            {modalTitle}
          </h2>
          <button
            type="button"
            aria-label={tr("Close", "Fermer")}
            disabled={isDeleting}
            onClick={handleClose}
            className="inline-flex items-center justify-center w-[44px] h-[44px] -my-[10px] -mr-[10px] ml-0 sm:w-[32px] sm:h-[32px] sm:-mt-[4px] sm:-mr-[6px] sm:mb-0 sm:ml-0 p-0 border-0 rounded-[8px] bg-transparent text-[#52525b] dark:text-[#a1a1aa] hover:bg-[#f4f4f5] dark:hover:bg-[#27272a]/60 hover:text-[#09090b] dark:hover:text-[#fafafa] transition-colors cursor-pointer disabled:opacity-50"
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

        <div className="hidden sm:flex mt-4 flex-col gap-1">
          <p className="m-0 text-[14px] leading-[1.5] text-[#52525b] dark:text-[#a1a1aa]">
            {modalQuestion}
          </p>
          <p className="m-0 text-[14px] leading-[1.5] font-semibold text-[#dc2626] dark:text-[#f87171]">
            {tr("This cannot be undone.", "Cette action est irréversible.")}
          </p>
        </div>

        <p className="sm:hidden mt-3 mb-0 text-[14px] leading-[1.45] text-[#52525b] dark:text-[#a1a1aa]">
          {modalQuestion}{" "}
          <span className="font-semibold text-[#dc2626] dark:text-[#f87171]">
            {tr("This cannot be undone.", "Cette action est irréversible.")}
          </span>
        </p>

        <p className="mt-3 mb-2 sm:mt-4 sm:mb-[10px] text-[14px] leading-[1.45] sm:leading-[1.5] text-[#52525b] dark:text-[#a1a1aa]">
          {tr("Type", "Saisissez")}{" "}
          <span className="inline-flex items-center gap-[4px] sm:gap-[6px] align-middle bg-[#f4f4f5] dark:bg-[#27272a] border border-[#e4e4e7] dark:border-[#27272a] rounded-[6px] py-[1px] pr-[2px] pl-[8px] sm:py-[2px] sm:pr-[4px] sm:pl-[8px] text-[13px] font-medium text-[#09090b] dark:text-[#fafafa] max-w-full">
            <span className="truncate max-w-[240px]">
              {effectiveConfirmText}
            </span>
            <button
              type="button"
              aria-label={tr("Copy confirmation name", "Copier le texte de confirmation")}
              onClick={() => {
                navigator.clipboard
                  ?.writeText(effectiveConfirmText)
                  .catch(() => {});
                setCopiedBadge(true);
                inputRef.current?.focus();
                if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
                copyTimerRef.current = setTimeout(() => {
                  setCopiedBadge(false);
                  copyTimerRef.current = null;
                }, 1500);
              }}
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
          {tr("to confirm.", "pour confirmer.")}
        </p>

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
          aria-label={tr("Confirmation name", "Nom de confirmation")}
          aria-invalid={inputErrorFlash}
          placeholder={tr("Enter name to confirm", "Saisissez le nom pour confirmer")}
          className={`box-border w-full h-[44px] sm:h-[40px] px-[12px] rounded-[8px] bg-[#ffffff] dark:bg-[#1f1f23] text-[#09090b] dark:text-[#fafafa] placeholder:text-[#a1a1aa] dark:placeholder:text-[#71717a] text-[16px] sm:text-[14px] outline-none transition-all ${
            inputErrorFlash
              ? "border border-[#dc2626] shadow-[0_0_0_3px_rgba(220,38,38,0.22)] dark:shadow-[0_0_0_3px_rgba(248,113,113,0.30)]"
              : "border border-[#0066FF] shadow-[0_0_0_3px_rgba(0,102,255,0.18)] dark:shadow-[0_0_0_3px_rgba(0,102,255,0.30)]"
          }`}
        />

        <div className="mt-4 sm:mt-6 flex sm:justify-end gap-2 sm:gap-[10px]">
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleClose}
            className="flex-1 sm:flex-initial h-[44px] sm:h-[40px] rounded-[8px] text-[14px] font-semibold inline-flex items-center justify-center gap-2 px-2 sm:px-4 cursor-pointer bg-[#ffffff] dark:bg-[#1f1f23] text-[#09090b] dark:text-[#fafafa] border border-[#d0d5dd] dark:border-[#2e2e33] hover:bg-[#f4f4f5]/60 dark:hover:bg-[#27272a] transition-colors disabled:opacity-50"
          >
            <span>{tr("Cancel", "Annuler")}</span>
            <span className="hidden sm:inline-flex items-center h-[18px] px-[5px] rounded-[4px] bg-[#f4f4f5] dark:bg-[#27272a] text-[#52525b] dark:text-[#a1a1aa] text-[11px] font-medium">
              Esc
            </span>
          </button>

          <button
            type="button"
            disabled={isDeleting}
            onClick={handleConfirmAttempt}
            className="flex-1 sm:flex-initial h-[44px] sm:h-[40px] rounded-[8px] text-[14px] font-semibold inline-flex items-center justify-center gap-2 px-2 sm:px-4 cursor-pointer bg-[rgba(220,38,38,0.10)] dark:bg-[rgba(239,68,68,0.14)] text-[#b91c1c] dark:text-[#f87171] border border-[rgba(220,38,38,0.25)] dark:border-[rgba(239,68,68,0.30)] hover:bg-[rgba(220,38,38,0.16)] dark:hover:bg-[rgba(239,68,68,0.22)] transition-all disabled:opacity-50"
          >
            <span>{isDeleting ? tr("Deleting...", "Suppression...") : confirmButtonLabel}</span>
            <span className="hidden sm:inline-flex items-center h-[18px] px-[5px] rounded-[4px] bg-[rgba(185,28,28,0.12)] dark:bg-[rgba(248,113,113,0.16)] text-[#b91c1c] dark:text-[#f87171] text-[11px] font-medium">
              Ctrl
            </span>
            <span className="hidden sm:inline-flex items-center h-[18px] px-[5px] rounded-[4px] bg-[rgba(185,28,28,0.12)] dark:bg-[rgba(248,113,113,0.16)] text-[#b91c1c] dark:text-[#f87171] text-[11px] font-medium">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="9 10 4 15 9 20" />
                <path d="M20 4v7a4 4 0 0 1-4 4H4" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
