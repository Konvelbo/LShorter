"use client";

import React, { useState } from "react";
import { Check, Copy, Terminal, Code2 } from "lucide-react";

export interface CodeTab {
  name: string;
  code: string;
  language?: string;
  filename?: string;
}

export interface CodeBlockProps {
  code?: string;
  language?: string;
  filename?: string;
  showLineNumbers?: boolean;
  tabs?: CodeTab[];
  className?: string;
}

/**
 * Lightweight syntax highlighter for Clean visual presentation
 */
function highlightSyntax(rawCode: string, lang: string = "bash") {
  const lines = rawCode.trim().split("\n");

  return lines.map((line, lineIdx) => {
    // 1. Comments
    if (line.trim().startsWith("#") || line.trim().startsWith("//")) {
      return (
        <span key={lineIdx} className="text-neutral-500 italic">
          {line}
        </span>
      );
    }

    // 2. cURL command line
    if (lang === "bash" || lang === "curl" || line.includes("curl ") || line.includes("http")) {
      // Color HTTP methods
      const methodRegex = /\b(GET|POST|PUT|PATCH|DELETE)\b/g;
      const flagsRegex = /(-X|-H|-d|--data|--location|-u)\b/g;
      const urlRegex = /(https?:\/\/[^\s"\\]+)/g;

      // Tokenize line
      const parts = line.split(/(\b(?:GET|POST|PUT|PATCH|DELETE)\b|-X|-H|-d|--data|--location|-u|https?:\/\/[^\s"\\]+|"(?:\\.|[^"\\])*")/g);

      return (
        <span key={lineIdx}>
          {parts.map((part, pIdx) => {
            if (/^(GET|POST|PUT|PATCH|DELETE)$/.test(part)) {
              return (
                <span key={pIdx} className="text-emerald-400 font-bold">
                  {part}
                </span>
              );
            }
            if (/^(-X|-H|-d|--data|--location|-u)$/.test(part)) {
              return (
                <span key={pIdx} className="text-[#ff6600] font-semibold">
                  {part}
                </span>
              );
            }
            if (/^https?:\/\//.test(part)) {
              return (
                <span key={pIdx} className="text-sky-400 underline-offset-2">
                  {part}
                </span>
              );
            }
            if (part.startsWith('"') && part.endsWith('"')) {
              return (
                <span key={pIdx} className="text-amber-300">
                  {part}
                </span>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </span>
      );
    }

    // 3. JSON format
    if (lang === "json" || line.trim().startsWith("{") || line.trim().startsWith('"')) {
      const parts = line.split(/("(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\d+(?:\.\d+)?)/g);

      return (
        <span key={lineIdx}>
          {parts.map((part, pIdx) => {
            if (part.endsWith(":") && part.startsWith('"')) {
              return (
                <span key={pIdx} className="text-sky-300 font-medium">
                  {part}
                </span>
              );
            }
            if (part.startsWith('"') && part.endsWith('"')) {
              return (
                <span key={pIdx} className="text-emerald-300">
                  {part}
                </span>
              );
            }
            if (/^(true|false|null)$/.test(part)) {
              return (
                <span key={pIdx} className="text-rose-400 font-bold">
                  {part}
                </span>
              );
            }
            if (/^-?\d+(\.\d+)?$/.test(part)) {
              return (
                <span key={pIdx} className="text-amber-400">
                  {part}
                </span>
              );
            }
            return <span key={pIdx}>{part}</span>;
          })}
        </span>
      );
    }

    // Default text
    return <span key={lineIdx}>{line}</span>;
  });
}

export function CodeBlock({
  code = "",
  language = "bash",
  filename,
  showLineNumbers = true,
  tabs,
  className = "",
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [activeTabIdx, setActiveTabIdx] = useState(0);

  const activeCode = tabs && tabs.length > 0 ? tabs[activeTabIdx].code : code;
  const activeLang = tabs && tabs.length > 0 ? (tabs[activeTabIdx].language || "bash") : language;
  const activeFilename = tabs && tabs.length > 0 ? tabs[activeTabIdx].filename : filename;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activeCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  const lines = activeCode.trim().split("\n");
  const highlightedLines = highlightSyntax(activeCode, activeLang);

  return (
    <div
      className={`rounded-[10px] border border-[#27272a] bg-[#0c0c0e] overflow-hidden text-xs font-mono text-neutral-200 shadow-2xl transition-all ${className}`}
    >
      {/* Top Window Bar (Traffic lights + Tabs/Title + Copy button) */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#141417] border-b border-[#222226] select-none">
        {/* Left: macOS Traffic light dots & filename */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 shrink-0">
            <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]/90 border border-[#e0443e]/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]/90 border border-[#dea123]/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#27c93f]/90 border border-[#1aab29]/50" />
          </div>

          {/* Optional Tabs */}
          {tabs && tabs.length > 0 ? (
            <div className="flex items-center gap-1 ml-1 overflow-x-auto">
              {tabs.map((tab, idx) => {
                const isActive = idx === activeTabIdx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveTabIdx(idx)}
                    className={`px-2.5 py-1 rounded-[10px] text-[11px] font-medium transition-all cursor-pointer ${
                      isActive
                        ? "bg-[#222226] text-white border border-white/10 shadow-sm"
                        : "text-neutral-400 hover:text-neutral-200 hover:bg-white/5"
                    }`}
                  >
                    {tab.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Terminal className="w-3.5 h-3.5 text-[#ff6600]" />
              <span className="text-[11px] font-medium text-neutral-300">
                {activeFilename || activeLang}
              </span>
            </div>
          )}
        </div>

        {/* Right: Language Badge & Copy Button */}
        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-block px-2 py-0.5 rounded-[10px] bg-white/5 text-[10px] uppercase font-bold text-neutral-400 border border-white/5">
            {activeLang}
          </span>

          <button
            type="button"
            onClick={handleCopy}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] border transition-all text-[11px] font-medium cursor-pointer ${
              copied
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm"
                : "bg-white/5 hover:bg-white/10 border-transparent text-neutral-300 hover:text-white"
            }`}
            title="Copier le code"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[10px]">Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span className="text-[10px]">Copier</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="p-4 overflow-x-auto custom-scrollbar">
        <pre className="flex leading-relaxed font-mono">
          {showLineNumbers && (
            <div className="select-none text-neutral-600 pr-4 text-right flex flex-col font-mono text-xs border-r border-white/5 mr-4 shrink-0">
              {lines.map((_, i) => (
                <span key={i} className="leading-relaxed opacity-60">
                  {i + 1}
                </span>
              ))}
            </div>
          )}
          <code className="flex-1 font-mono text-neutral-100 whitespace-pre flex flex-col">
            {highlightedLines.map((hLine, i) => (
              <div key={i} className="leading-relaxed">
                {hLine}
              </div>
            ))}
          </code>
        </pre>
      </div>
    </div>
  );
}
