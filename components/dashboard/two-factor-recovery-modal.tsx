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
      "LSHORTER TWO-FACTOR AUTHENTICATION BACKUP CODES",
      `Account: ${email}`,
      `Generated on: ${new Date().toLocaleDateString("en-US")}`,
      "Each code can only be used once.",
      "================================================",
      "",
      ...recoveryCodes.map((c, i) => `${i + 1}. ${c}`),
    ].join("\n");

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    showToast.success("Backup codes copied!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!recoveryCodes.length) return;
    const text = [
      "================================================",
      "LSHORTER TWO-FACTOR AUTHENTICATION BACKUP CODES",
      `Account: ${email}`,
      `Date: ${new Date().toISOString()}`,
      "Each code can only be used once.",
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
    showToast.success("Backup codes file downloaded!");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-[10px] bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] shadow-2xl flex flex-col overflow-hidden text-zinc-900 dark:text-neutral-200 animate-in zoom-in-95 duration-200">
        <div className="p-5 border-b border-zinc-200 dark:border-[#222225] flex items-center justify-between bg-zinc-50 dark:bg-gradient-to-r dark:from-[#141418] dark:to-[#1a1a20]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-[8px] bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/25">
              <KeyRound className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">Your 2FA Backup Codes</h3>
              <p className="text-[11px] text-zinc-500 dark:text-neutral-400">One-time use in case of phone loss</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:text-neutral-400 dark:hover:text-white p-1 rounded-[6px] hover:bg-zinc-200/60 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-2 p-3 rounded-[10px] bg-zinc-50 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#222226]">
            {recoveryCodes.length === 0 ? (
              <div className="col-span-2 py-4 text-center text-xs text-zinc-400 dark:text-neutral-500">
                No backup codes recorded.
              </div>
            ) : (
              recoveryCodes.map((code, idx) => (
                <div
                  key={idx}
                  className="p-2 rounded-[6px] bg-white dark:bg-[#141418] border border-zinc-200 dark:border-[#1f1f25] text-center font-mono text-xs font-bold text-zinc-900 dark:text-white select-all shadow-2xs"
                >
                  <span className="text-[10px] text-zinc-400 dark:text-neutral-500 mr-1.5">{idx + 1}.</span>
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
              className="text-xs h-9 border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-neutral-200 gap-1.5 rounded-[8px]"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied!" : "Copy"}</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleDownload}
              className="text-xs h-9 border-zinc-200 dark:border-[#27272a] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-neutral-200 gap-1.5 rounded-[8px]"
            >
              <Download className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Download</span>
            </Button>
          </div>

          <Button
            type="button"
            onClick={onClose}
            className="w-full text-xs h-10 font-bold mt-1 cursor-pointer bg-[#0066FF] hover:bg-[#0055d4] text-white rounded-[10px]"
          >
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
