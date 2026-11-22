"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

export interface SdkInstallOption {
  id: string;
  label: string;
  langBadge: string;
  prefix: string;
  subcmd: string;
  pkg: string;
  command: string;
}

export const SDK_INSTALL_OPTIONS: SdkInstallOption[] = [
  {
    id: "npm",
    label: "npm",
    langBadge: "JS / TS",
    prefix: "npm",
    subcmd: "install",
    pkg: "lshorter-api",
    command: "npm install lshorter-api",
  },
  {
    id: "pnpm",
    label: "pnpm",
    langBadge: "JS / TS",
    prefix: "pnpm",
    subcmd: "add",
    pkg: "lshorter-api",
    command: "pnpm add lshorter-api",
  },
  {
    id: "yarn",
    label: "yarn",
    langBadge: "JS / TS",
    prefix: "yarn",
    subcmd: "add",
    pkg: "lshorter-api",
    command: "yarn add lshorter-api",
  },
  {
    id: "bun",
    label: "bun",
    langBadge: "JS / TS",
    prefix: "bun",
    subcmd: "add",
    pkg: "lshorter-api",
    command: "bun add lshorter-api",
  },
  {
    id: "pip",
    label: "pip",
    langBadge: "Python",
    prefix: "pip",
    subcmd: "install",
    pkg: "lshorter-api",
    command: "pip install lshorter-api",
  },
  {
    id: "cargo",
    label: "cargo",
    langBadge: "Rust",
    prefix: "cargo",
    subcmd: "add",
    pkg: "lshorter-api",
    command: "cargo add lshorter-api",
  },
  {
    id: "go",
    label: "go",
    langBadge: "Go",
    prefix: "go",
    subcmd: "get",
    pkg: "github.com/Konvelbo/LShorter-api/sdks/go",
    command: "go get github.com/Konvelbo/LShorter-api/sdks/go",
  },
  {
    id: "composer",
    label: "composer",
    langBadge: "PHP",
    prefix: "composer",
    subcmd: "require",
    pkg: "lshorter/lshorter-api",
    command: "composer require lshorter/lshorter-api",
  },
];

export function SdkInstallBar() {
  const [selectedId, setSelectedId] = useState<string>("npm");
  const [copied, setCopied] = useState(false);

  const active =
    SDK_INSTALL_OPTIONS.find((item) => item.id === selectedId) ||
    SDK_INSTALL_OPTIONS[0];

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(active.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  return (
    <div
      className="w-full rounded-[12px] bg-white dark:bg-[#141416] border border-black/[0.08] dark:border-white/[0.1] shadow-xs overflow-hidden"
      data-testid="sdk-install-bar"
    >
      {/* Package manager & language selector tabs */}
      <div
        role="tablist"
        aria-label="Official SDK installation commands"
        className="flex items-center gap-1 px-2.5 py-2 border-b border-black/[0.06] dark:border-white/[0.08] bg-zinc-50/80 dark:bg-white/[0.02] overflow-x-auto no-scrollbar"
      >
        <Terminal className="w-3.5 h-3.5 text-brand shrink-0 mr-1" />
        {SDK_INSTALL_OPTIONS.map((opt) => {
          const isActive = opt.id === active.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setSelectedId(opt.id);
                setCopied(false);
              }}
              className={`px-2 py-1 rounded-[7px] text-[11px] font-mono leading-none whitespace-nowrap transition-all cursor-pointer shrink-0 ${
                isActive
                  ? "bg-brand/12 text-brand border border-brand/30 font-semibold shadow-2xs"
                  : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] border border-transparent font-medium"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Active command line + Copy action */}
      <div className="flex items-center justify-between gap-2.5 px-3.5 py-2.5 bg-white dark:bg-[#0e0e11]">
        <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar font-mono text-xs sm:text-[13px]">
          <span className="text-zinc-400 dark:text-neutral-500 select-none shrink-0">
            $
          </span>
          <code className="whitespace-nowrap select-all">
            <span className="text-blue-600 dark:text-sky-400 font-semibold">
              {active.prefix}
            </span>{" "}
            <span className="text-purple-600 dark:text-purple-400 font-medium">
              {active.subcmd}
            </span>{" "}
            <span className="text-[#101828] dark:text-neutral-100">
              {active.pkg}
            </span>
          </code>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="hidden sm:inline-flex px-1.5 py-0.5 rounded-[5px] bg-black/[0.04] dark:bg-white/[0.06] text-[10px] font-mono text-zinc-500 dark:text-neutral-400">
            {active.langBadge}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            aria-label={`Copy ${active.command}`}
            className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-[7px] border text-[11px] font-mono font-medium transition-all cursor-pointer ${
              copied
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                : "bg-zinc-50 hover:bg-zinc-100 dark:bg-white/[0.05] dark:hover:bg-white/[0.1] border-black/[0.08] dark:border-white/[0.1] text-zinc-700 dark:text-neutral-200"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
