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
  const normalizedLang = (lang || "").toLowerCase().trim();
  const lines = rawCode.trim().split("\n");

  return lines.map((line, lineIdx) => {
    // Empty line
    if (!line.trim()) {
      return <span key={lineIdx}>{" "}</span>;
    }

    // 1. Comments
    if (line.trim().startsWith("//") || line.trim().startsWith("/*") || line.trim().startsWith("*")) {
      return (
        <span key={lineIdx} className="text-neutral-500 italic">
          {line}
        </span>
      );
    }
    if (normalizedLang.includes("bash") || normalizedLang.includes("curl") || normalizedLang.includes("sh")) {
      if (line.trim().startsWith("#")) {
        return (
          <span key={lineIdx} className="text-neutral-500 italic">
            {line}
          </span>
        );
      }
    }

    // 2. JSON format
    if (normalizedLang === "json") {
      const jsonRegex = /("(?:\\.|[^"\\])*"(?:\s*:)?|\b(?:true|false|null)\b|-?\b\d+(?:\.\d+)?\b|[{}[\],:])/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = jsonRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }
        const token = match[0];
        if (token.endsWith(":") && token.startsWith('"')) {
          parts.push(
            <span key={match.index} className="text-sky-300 font-medium">
              {token}
            </span>
          );
        } else if (token.startsWith('"')) {
          parts.push(
            <span key={match.index} className="text-emerald-300">
              {token}
            </span>
          );
        } else if (/^(true|false|null)$/.test(token)) {
          parts.push(
            <span key={match.index} className="text-rose-400 font-bold">
              {token}
            </span>
          );
        } else if (/^-?\d+(\.\d+)?$/.test(token)) {
          parts.push(
            <span key={match.index} className="text-amber-400">
              {token}
            </span>
          );
        } else {
          parts.push(
            <span key={match.index} className="text-neutral-400">
              {token}
            </span>
          );
        }
        lastIndex = jsonRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }
      return <span key={lineIdx}>{parts}</span>;
    }

    // 3. Bash / Shell / cURL format
    if (
      normalizedLang === "bash" ||
      normalizedLang === "curl" ||
      normalizedLang === "sh" ||
      normalizedLang === "shell" ||
      line.includes("curl ") ||
      line.startsWith("npm ") ||
      line.startsWith("pnpm ") ||
      line.startsWith("yarn ") ||
      line.startsWith("bun ")
    ) {
      const bashRegex = /(\b(?:GET|POST|PUT|PATCH|DELETE)\b|(-[a-zA-Z]+|--[a-zA-Z0-9_-]+)|https?:\/\/[^\s"\\]+|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\$[A-Z0-9_]+|\b(?:npm|pnpm|yarn|bun|npx|curl|git|node)\b|\b(?:install|add|run|exec)\b)/g;
      const parts: React.ReactNode[] = [];
      let lastIndex = 0;
      let match: RegExpExecArray | null;

      while ((match = bashRegex.exec(line)) !== null) {
        if (match.index > lastIndex) {
          parts.push(line.slice(lastIndex, match.index));
        }
        const token = match[0];
        if (/^(GET|POST|PUT|PATCH|DELETE)$/.test(token)) {
          parts.push(
            <span key={match.index} className="text-emerald-400 font-bold">
              {token}
            </span>
          );
        } else if (/^(-[a-zA-Z]+|--[a-zA-Z0-9_-]+)$/.test(token)) {
          parts.push(
            <span key={match.index} className="text-[#ff6600] font-semibold">
              {token}
            </span>
          );
        } else if (/^https?:\/\//.test(token)) {
          parts.push(
            <span key={match.index} className="text-cyan-300 underline-offset-2">
              {token}
            </span>
          );
        } else if (token.startsWith('"') || token.startsWith("'")) {
          parts.push(
            <span key={match.index} className="text-amber-300">
              {token}
            </span>
          );
        } else if (token.startsWith("$")) {
          parts.push(
            <span key={match.index} className="text-rose-400 font-semibold">
              {token}
            </span>
          );
        } else if (/^(npm|pnpm|yarn|bun|npx|curl|git|node)$/.test(token)) {
          parts.push(
            <span key={match.index} className="text-sky-400 font-bold">
              {token}
            </span>
          );
        } else if (/^(install|add|run|exec)$/.test(token)) {
          parts.push(
            <span key={match.index} className="text-purple-400 font-semibold">
              {token}
            </span>
          );
        } else {
          parts.push(token);
        }
        lastIndex = bashRegex.lastIndex;
      }
      if (lastIndex < line.length) {
        parts.push(line.slice(lastIndex));
      }
      return <span key={lineIdx}>{parts}</span>;
    }

    // 4. TypeScript / JavaScript / Universal Tokenizer
    const tsRegex = /(\/\/[^\n]*|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`(?:\\.|[^`\\])*`|\b(?:import|export|from|as|default|const|let|var|function|class|interface|type|enum|extends|implements|await|async|return|new|typeof|instanceof|void|delete|in|of|if|else|switch|case|break|continue|try|catch|finally|throw)\b|\b(?:true|false|null|undefined)\b|\b(?:string|number|boolean|any|unknown|never|void|Promise|Date|LShorter|LShorterClient|Record|Array|object)\b|\b-?\d+(?:\.\d+)?\b|\b[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*:)|[a-zA-Z_$][a-zA-Z0-9_$]*(?=\s*\()|=>|===|!==|==|!=|\+=|-=|\*=|&&|\|\|)/g;

    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tsRegex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      const token = match[0];

      if (token.startsWith("//")) {
        parts.push(
          <span key={match.index} className="text-neutral-500 italic">
            {token}
          </span>
        );
      } else if (token.startsWith('"') || token.startsWith("'") || token.startsWith("`")) {
        parts.push(
          <span key={match.index} className="text-emerald-400 dark:text-emerald-300">
            {token}
          </span>
        );
      } else if (
        /^(import|export|from|as|default|const|let|var|function|class|interface|type|enum|extends|implements|await|async|return|new|typeof|instanceof|void|delete|in|of|if|else|switch|case|break|continue|try|catch|finally|throw)$/.test(
          token
        )
      ) {
        parts.push(
          <span key={match.index} className="text-purple-400 font-semibold">
            {token}
          </span>
        );
      } else if (/^(true|false|null|undefined)$/.test(token)) {
        parts.push(
          <span key={match.index} className="text-rose-400 font-bold">
            {token}
          </span>
        );
      } else if (/^(string|number|boolean|any|unknown|never|void|Promise|Date|LShorter|LShorterClient|Record|Array|object)$/.test(token)) {
        parts.push(
          <span key={match.index} className="text-cyan-400 font-medium">
            {token}
          </span>
        );
      } else if (/^-?\d+(\.\d+)?$/.test(token)) {
        parts.push(
          <span key={match.index} className="text-amber-400 font-mono">
            {token}
          </span>
        );
      } else if (token === "=>") {
        parts.push(
          <span key={match.index} className="text-purple-400 font-bold">
            {token}
          </span>
        );
      } else if (line.slice(match.index + token.length).trim().startsWith(":")) {
        parts.push(
          <span key={match.index} className="text-pink-400 font-medium">
            {token}
          </span>
        );
      } else if (line.slice(match.index + token.length).trim().startsWith("(")) {
        parts.push(
          <span key={match.index} className="text-sky-400 font-medium">
            {token}
          </span>
        );
      } else {
        parts.push(
          <span key={match.index} className="text-neutral-200">
            {token}
          </span>
        );
      }

      lastIndex = tsRegex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return <span key={lineIdx}>{parts}</span>;
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
