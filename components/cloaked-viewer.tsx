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
  pathLockPassword?: string;
}

export interface CloakedViewerProps {
  link: CloakedViewerLink;
}

export function CloakedViewer({ link }: CloakedViewerProps) {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);
  const [isUnlocked, setIsUnlocked] = useState(
    !link.pathLockPassword || link.pathLockMode === "off"
  );
  const [enteredPassword, setEnteredPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    if (link.metaTitle) {
      document.title = link.metaTitle;
    }
  }, [link.metaTitle]);

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enteredPassword.trim() === link.pathLockPassword) {
      setIsUnlocked(true);
      setPasswordError("");
    } else {
      setPasswordError("Incorrect path lock password.");
    }
  };

  // If strict path locking is enabled with a password and not yet unlocked
  if (!isUnlocked && link.pathLockPassword && link.pathLockMode !== "off") {
    return (
      <div className="min-h-screen w-full bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md rounded-[10px] bg-white dark:bg-[#121215] border border-zinc-200 dark:border-[#27272a] p-6 shadow-2xl text-zinc-900 dark:text-white">
          <div className="flex flex-col items-center text-center gap-2 mb-6">
            <div className="w-12 h-12 rounded-[10px] bg-brand-light dark:bg-brand-subtle text-brand flex items-center justify-center border border-brand-subtle">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold">Path Locked Link</h2>
            <p className="text-xs text-zinc-500 dark:text-neutral-400">
              {link.pathLockMessage ||
                "This cloaked URL requires authentication to view destination content."}
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
            <input
              type="password"
              placeholder="Enter path password..."
              value={enteredPassword}
              onChange={(e) => {
                setEnteredPassword(e.target.value);
                setPasswordError("");
              }}
              className="w-full h-10 px-3 text-sm rounded-[10px] bg-zinc-50 dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-white focus:outline-none focus:border-brand"
            />
            {passwordError && (
              <p className="text-xs text-red-500 font-medium">{passwordError}</p>
            )}
            <Button
              type="submit"
              className="w-full h-10 bg-[#0066FF] hover:bg-[#0055d4] text-white font-semibold rounded-[10px] cursor-pointer"
            >
              <span>Unlock Viewer</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>
        </div>
      </div>
    );
  }

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
