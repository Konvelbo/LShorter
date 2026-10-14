"use client";

import React, { useState, useEffect } from "react";
import {
  ExternalLink,
  Shield,
  ShieldCheck,
  RefreshCw,
  Lock,
  ArrowRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface CloakedViewerLink {
  slug: string;
  targetUrl: string;
  metaTitle?: string;
  isCloaked?: boolean;
  pathLockMode?: string;
  pathLockPrefix?: string;
  pathLockMessage?: string;
}

export interface CloakedViewerProps {
  link: CloakedViewerLink;
}

export function CloakedViewer({ link }: CloakedViewerProps) {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (link.metaTitle) {
      document.title = link.metaTitle;
    }
  }, [link.metaTitle]);

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-screen h-screen flex flex-col bg-black overflow-hidden font-sans">
      {/* Cloaked Header Bar */}
      {!isHeaderCollapsed ? (
        <header className="h-11 bg-zinc-900/95 dark:bg-[#0f0f12]/95 border-b border-zinc-800 dark:border-[#222226] backdrop-blur-md px-4 flex items-center justify-between text-white z-40 transition-all shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-[6px] bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-zinc-200 truncate">
              {link.metaTitle || `/${link.slug}`}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline px-1.5 py-0.5 rounded-[4px] bg-zinc-800 dark:bg-[#1a1a20] border border-zinc-700/50">
              Cloaked
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReload}
              className="h-8 px-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-[6px] text-xs gap-1 cursor-pointer"
              title="Refresh Frame"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Refresh</span>
            </Button>

            <a
              href={link.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-8 px-2.5 inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white hover:bg-white/10 rounded-[6px] transition-colors"
              title="Open destination in new tab"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Open Original</span>
            </a>

            <button
              type="button"
              onClick={() => setIsHeaderCollapsed(true)}
              className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-[6px] transition-colors cursor-pointer"
              title="Hide Bar"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </header>
      ) : (
        <button
          type="button"
          onClick={() => setIsHeaderCollapsed(false)}
          className="fixed top-2 right-4 z-50 px-2.5 py-1 rounded-[8px] bg-zinc-900/90 border border-zinc-700/60 text-white text-xs flex items-center gap-1.5 shadow-lg backdrop-blur hover:bg-zinc-800 transition-all cursor-pointer opacity-70 hover:opacity-100"
        >
          <Shield className="w-3.5 h-3.5 text-brand" />
          <span>Show Bar</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Primary Cloaked Iframe */}
      <iframe
        key={iframeKey}
        src={link.targetUrl}
        title={link.metaTitle || link.slug}
        className="w-full h-full border-none flex-1 bg-white"
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
      />
    </div>
  );
}
