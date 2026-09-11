"use client";

import React, { useState } from "react";
import { KeyRound, Copy, Check, ShieldAlert, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast-provider";

interface ApiKeyCreatedModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: {
    name: string;
    rawKey?: string;
    prefix?: string;
    scope?: string;
    rateLimit?: string;
  } | null;
}

export function ApiKeyCreatedModal({
  isOpen,
  onClose,
  apiKey,
}: ApiKeyCreatedModalProps) {
  const [hasCopied, setHasCopied] = useState(false);

  if (!isOpen || !apiKey) return null;

  const keyToCopy = apiKey.rawKey || apiKey.prefix || "";

  const handleCopy = () => {
    if (!keyToCopy) return;
    navigator.clipboard.writeText(keyToCopy);
    setHasCopied(true);
    showToast.success("Clé API copiée dans le presse-papier !");
    setTimeout(() => setHasCopied(false), 2500);
  };

  const getScopeLabel = (scope?: string) => {
    if (scope === "admin") return "Accès Complet (Admin)";
    if (scope === "read") return "Lecture Seule";
    return "Lecture & Écriture";
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#141416] border border-[#27272a] rounded-[10px] shadow-2xl p-6 sm:p-7 flex flex-col gap-5 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-[10px] text-neutral-400 hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="Fermer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with Key Icon */}
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-[10px] bg-[#ff6600]/15 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] shrink-0 shadow-lg shadow-[#ff6600]/10">
            <KeyRound className="w-6 h-6" />
          </div>
          <div className="flex flex-col gap-1 pr-6">
            <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
              Nouvelle Clé API Générée
            </h3>
            <p className="text-xs text-neutral-400">
              Clé pour &quot;{apiKey.name}&quot; • <span className="text-neutral-300 font-medium">{getScopeLabel(apiKey.scope)}</span>
            </p>
          </div>
        </div>

        {/* Security Warning Box */}
        <div className="p-3.5 rounded-[10px] bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-bold text-amber-300">
              Conservez cette clé en lieu sûr
            </span>
            <p className="text-[11px] text-amber-400/90 leading-relaxed">
              Pour des raisons de sécurité, cette clé secrète complète ne sera plus jamais affichée. En cas de perte, vous devrez en générer une nouvelle.
            </p>
          </div>
        </div>

        {/* Key Display Container with One-Click Copy */}
        <div className="flex flex-col gap-2">
          <label className="text-[11px] font-semibold text-neutral-300 uppercase tracking-wider">
            Votre Clé API Secrète :
          </label>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-[10px] bg-[#0c0c0e] border border-[#27272a] shadow-inner">
            <div className="flex-1 overflow-x-auto py-1 px-1.5 scrollbar-none font-mono text-xs sm:text-sm text-[#ff6600] select-all break-all sm:break-normal font-semibold">
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
                  <span className="text-emerald-400">Copié !</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copier la clé</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#222225]">
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
            className="w-full sm:w-auto h-10 px-6 text-xs font-bold bg-[#ff6600] hover:bg-[#ff771a] text-white shadow-lg shadow-[#ff6600]/25 rounded-[10px] cursor-pointer"
          >
            J&apos;ai bien enregistré ma clé
          </Button>
        </div>
      </div>
    </div>
  );
}
