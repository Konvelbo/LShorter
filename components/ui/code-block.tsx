"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal } from "lucide-react";

export interface CodeBlockProps {
  code: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  className?: string;
}

export function CodeBlock({
  code,
  language = "bash",
  filename,
  showLineNumbers = true,
  className = "",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const lines = code.trim().split("\n");

  return (
    <div
      className={`rounded-[10px] border border-[#27272a] bg-[#0d0d10] overflow-hidden text-xs font-mono text-neutral-200 shadow-xl ${className}`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#121215] border-b border-[#222226]">
        <div className="flex items-center gap-2 text-neutral-400">
          <Terminal className="w-3.5 h-3.5 text-[#ff6600]" />
          <span className="text-[11px] font-medium text-neutral-300">
            {filename || language}
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded-[6px] hover:bg-white/10 text-neutral-400 hover:text-white transition-all text-[11px] cursor-pointer"
          title="Copier le code"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[10px]">Copié !</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[10px]">Copier</span>
            </>
          )}
        </button>
      </div>

      {/* Code contents with line numbers */}
      <div className="p-3.5 overflow-x-auto">
        <pre className="flex leading-relaxed">
          {showLineNumbers && (
            <div className="select-none text-neutral-600 pr-4 text-right flex flex-col font-mono text-xs border-r border-white/5 mr-4">
              {lines.map((_, i) => (
                <span key={i}>{i + 1}</span>
              ))}
            </div>
          )}
          <code className="flex-1 font-mono text-neutral-100 whitespace-pre">
            {code}
          </code>
        </pre>
      </div>
    </div>
  );
}
