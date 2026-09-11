"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  Copy,
  Check,
  Download,
  KeyRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast-provider";

interface TwoFactorRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  recoveryCodes: string[];
  email: string;
}

export function TwoFactorRecoveryModal({
  isOpen,
  onClose,
  recoveryCodes,
  email,
}: TwoFactorRecoveryModalProps) {
  const [isCopied, setIsCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!recoveryCodes.length) return;
    const text = [
      "================================================",
      "CODES DE SECOURS DOUBLE AUTHENTIFICATION LSHORTER",
      `Compte : ${email}`,
      `Généré le : ${new Date().toLocaleDateString("fr-FR")}`,
      "Chaque code ne peut être utilisé qu'une seule fois.",
      "================================================",
      "",
      ...recoveryCodes.map((c, i) => `${i + 1}. ${c}`),
    ].join("\n");

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    showToast.success("Codes de secours copiés !");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!recoveryCodes.length) return;
    const text = [
      "================================================",
      "CODES DE SECOURS DOUBLE AUTHENTIFICATION LSHORTER",
      `Compte : ${email}`,
      `Date : ${new Date().toISOString()}`,
      "Chaque code ne peut être utilisé qu'une seule fois.",
      "================================================",
      "",
      ...recoveryCodes.map((c, i) => `${i + 1}. ${c}`),
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `lshorter-backup-codes-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast.success("Fichier des codes de secours téléchargé !");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[14px] bg-[#121215] border border-[#27272a] shadow-2xl flex flex-col overflow-hidden text-neutral-200 animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-[#222225] flex items-center justify-between bg-gradient-to-r from-[#141418] to-[#1a1a20]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Vos Codes de Secours 2FA</h3>
              <p className="text-[11px] text-neutral-400">Usage unique en cas de perte de téléphone</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 p-3 rounded-[10px] bg-[#0c0c0e] border border-[#222226]">
            {recoveryCodes.length === 0 ? (
              <div className="col-span-2 py-4 text-center text-xs text-neutral-500">
                Aucun code de secours enregistré.
              </div>
            ) : (
              recoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-[6px] bg-[#141418] border border-[#1f1f25] text-center font-mono text-xs font-bold text-white select-all"
                >
                  <span className="text-[10px] text-neutral-500 mr-1.5">{idx + 1}.</span>
                  {code}
                </div>
              ))
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCopy}
              className="text-xs h-9 border-[#27272a] gap-1.5"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copié !" : "Copier"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              className="text-xs h-9 border-[#27272a] gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-[#ff6600]" />
              <span>Télécharger</span>
            </Button>
          </div>

          <Button
            type="button"
            variant="glow"
            onClick={onClose}
            className="w-full text-xs h-10 font-bold mt-1 cursor-pointer"
          >
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
}
