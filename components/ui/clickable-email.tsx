"use client";

import React, { useState } from "react";
import { Mail, Copy, Check } from "lucide-react";
import { showToast } from "@/components/ui/toast-provider";

interface ClickableEmailProps {
  email: string;
  className?: string;
  label?: string;
  showIcon?: boolean;
}

export function ClickableEmail({
  email,
  className = "",
  label,
  showIcon = true,
}: ClickableEmailProps) {
  const [copied, setCopied] = useState(false);

  const mailtoUrl = `mailto:${email}`;

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(email);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = email;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      showToast.success(`Adresse ${email} copiée dans le presse-papier !`);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Non-fatal
    }
  };

  return (
    <span className="inline-flex items-center gap-1.5 align-middle">
      {/* Standard native mailto link */}
      <a
        href={mailtoUrl}
        title={`Envoyer un email à ${email}`}
        className={`inline-flex items-center gap-1 font-medium underline underline-offset-2 transition-colors cursor-pointer hover:opacity-80 group ${className}`}
      >
        {showIcon && (
          <Mail className="w-3.5 h-3.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity" />
        )}
        <span>{label || email}</span>
      </a>

      {/* Copy Button */}
      <button
        type="button"
        onClick={handleCopy}
        title={`Copier l'adresse ${email}`}
        className="inline-flex items-center gap-1 p-1 rounded-md text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition-all cursor-pointer"
        aria-label={`Copier ${email}`}
      >
        {copied ? (
          <span className="inline-flex items-center gap-0.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 no-underline bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/60 px-1.5 py-0.2 rounded animate-in fade-in">
            <Check className="w-3 h-3" />
            Copié !
          </span>
        ) : (
          <Copy className="w-3.5 h-3.5 opacity-60 hover:opacity-100 transition-opacity" />
        )}
      </button>
    </span>
  );
}
