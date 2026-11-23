"use client";

import React, { useState } from "react";
import { KeyRound, Copy, Check, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast-provider";
import { useI18n } from "@/components/providers/i18n-provider";

interface ApiKeyCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: {
    name: string;
    rawKey?: string;
    prefix?: string;
    scope?: 'read' | 'read_write';
    rateLimit?: string;
  } | null;
}

export function ApiKeyCreatedModal({
  isOpen,
  onClose,
  apiKey,
}: ApiKeyCreatedModalProps) {
  const { tr } = useI18n();
  const [hasCopied, setHasCopied] = useState(false);

  if (!isOpen || !apiKey) return null;

  const keyToCopy = apiKey.rawKey || apiKey.prefix || "";

  const handleCopy = () => {
    if (!keyToCopy) return;
    navigator.clipboard.writeText(keyToCopy);
    setHasCopied(true);
    showToast.success(tr("API key copied to clipboard!", "Clé API copiée dans le presse-papiers !"));
    setTimeout(() => setHasCopied(false), 2500);
  };

  const getScopeLabel = (scope?: "read" | "read_write") => {
    if (scope === "read") return tr("Read Only", "Lecture seule");
    return tr("Read & Write", "Lecture & Écriture");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] rounded-[10px] shadow-2xl p-6 sm:p-7 flex flex-col gap-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-[10px] text-zinc-400 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label={tr("Close", "Fermer")}
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Key Icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-[10px] bg-[var(--badge-brand-bg)] border border-[var(--badge-brand-border)] flex items-center justify-center text-[var(--brand-primary-text)] shrink-0 shadow-lg shadow-[var(--brand-primary-subtle)]">
            <KeyRound className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1 pr-6">
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-white tracking-tight">
              {tr("New API Key Generated", "Nouvelle clé API générée")}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-neutral-400">
              {tr("Key for", "Clé pour")} &quot;{apiKey.name}&quot; • <span className="text-zinc-700 dark:text-neutral-300 font-medium">{getScopeLabel(apiKey.scope)}</span>
            </p>
          </div>
        </div>

        {/* Security Warning Box */}
        <div className="p-3.5 rounded-[10px] bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300">
              {tr("Store this key safely", "Conservez cette clé en lieu sûr")}
            </span>
            <p className="text-[11px] text-amber-600 dark:text-amber-400/90 leading-relaxed">
              {tr(
                "For security reasons, this full secret key will never be displayed again. If lost, you will need to generate a new one.",
                "Pour des raisons de sécurité, cette clé secrète complète ne sera plus jamais affichée. En cas de perte, vous devrez en générer une nouvelle."
              )}
            </p>
          </div>
        </div>

        {/* Key Display Container with One-Click Copy */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-zinc-600 dark:text-neutral-300 uppercase tracking-wider">
            {tr("Your Secret API Key:", "Votre clé API secrète :")}
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-[10px] bg-zinc-100 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#27272a] shadow-inner">
            <div className="flex-1 overflow-x-auto py-1 px-1.5 scrollbar-none font-mono text-xs sm:text-sm text-[var(--brand-primary-text)] select-all break-all sm:break-normal font-semibold">
              {keyToCopy}
            </div>
            <Button
              type="button"
              variant={hasCopied ? "outline" : "glow"}
              size="sm"
              onClick={handleCopy}
              className="shrink-0 h-9 px-4 gap-1.5 font-bold text-xs cursor-pointer shadow-md"
            >
              {hasCopied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span className="text-emerald-400">{tr("Copied!", "Copié !")}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{tr("Copy Key", "Copier la clé")}</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-200 dark:border-[#222225]">
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            className="w-full sm:w-auto h-10 px-6 text-xs font-bold shadow-lg rounded-[10px] cursor-pointer"
          >
            {tr("I have stored my key", "J'ai enregistré ma clé")}
          </Button>
        </div>
      </div>
    </div>
  );
}
