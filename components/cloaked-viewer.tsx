"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ExternalLink,
  ChevronUp,
  ChevronDown,
  ShieldAlert,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface CloakedViewerProps {
  link: CloakedViewerLink;
}

export function CloakedViewer({ link }: CloakedViewerProps) {
  const [isTopbarHidden, setIsTopbarHidden] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState("");
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`pathlock_unlocked_${link.slug}`);
      if (saved === "true") {
        setIsDevUnlocked(true);
      }
      try {
        const bc = new BroadcastChannel("lshorter_realtime");
        bc.postMessage({ type: "click", slug: link.slug });
        bc.close();
      } catch {}
    }
  }, [link.slug]);

  const effectiveLockMode =
    link.pathLockMode || (link as any).path_lock_mode || "off";
  const isPathLocked = effectiveLockMode !== "off";
  const targetPassword =
    link.pathLockPassword || (link as any).path_lock_password || "";
  const title = link.metaTitle || link.slug;

  // Extract hostname for cleaner presentation in topbar
  let targetHostname = "";
  try {
    const u = new URL(
      link.targetUrl.startsWith("http")
        ? link.targetUrl
        : `https://${link.targetUrl}`,
    );
    targetHostname = u.hostname;
  } catch {}

  // Monitor iframe navigation via postMessage from PathLock proxy interceptor
  useEffect(() => {
    if (!isPathLocked) return;

    const handleMessage = (e: MessageEvent) => {
      if (e.data && typeof e.data === "object" && e.data.type === "PATHLOCK_NAVIGATE") {
        if (isDevUnlocked) return;
        if (e.data.blocked) {
          setIsBlocked(true);
          return;
        }
        const attempted = String(e.data.url || "");
        validateAndEnforce(attempted);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isPathLocked, link.pathLockMode, link.pathLockPrefix, isDevUnlocked]);

  // Synchronize unlock state with the proxied iframe
  useEffect(() => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: isDevUnlocked ? "PATHLOCK_UNLOCK" : "PATHLOCK_LOCK" },
        "*",
      );
    } catch {}
  }, [isDevUnlocked]);

  const validateAndEnforce = (urlOrPath: string) => {
    if (!isPathLocked || isDevUnlocked) return;
    try {
      let targetPathname = "/";
      try {
        const tu = new URL(
          link.targetUrl.startsWith("http")
            ? link.targetUrl
            : `https://${link.targetUrl}`,
        );
        targetPathname = tu.pathname;
      } catch {}

      let pathToCheck = urlOrPath;
      if (urlOrPath.startsWith("http")) {
        const u = new URL(urlOrPath);
        pathToCheck = u.pathname;
      }
      const cleanAttempt = pathToCheck.replace(/^\/+/, "").replace(/\/+$/, "");
      if (
        cleanAttempt === `r/${link.slug}/proxy` ||
        cleanAttempt === `r/${link.slug}/view`
      ) {
        return;
      }

      const cleanTargetPath = targetPathname
        .replace(/^\/+/, "")
        .replace(/\/+$/, "");
      const rawPrefix =
        link.pathLockPrefix || (link as any).path_lock_prefix || "";
      const cleanPrefix = (rawPrefix.trim() ? rawPrefix : cleanTargetPath)
        .replace(/^\/+/, "")
        .replace(/\/+$/, "");

      if (effectiveLockMode === "strict") {
        if (cleanAttempt !== cleanPrefix) {
          setIsBlocked(true);
        }
      } else if (effectiveLockMode === "funnel") {
        if (
          cleanPrefix
            ? cleanAttempt !== cleanPrefix &&
              !cleanAttempt.startsWith(`${cleanPrefix}/`)
            : cleanAttempt !== cleanTargetPath
        ) {
          setIsBlocked(true);
        }
      }
    } catch {}
  };

  const handleIframeLoad = () => {
    if (!isPathLocked || isDevUnlocked) return;
    try {
      const doc = iframeRef.current?.contentDocument;
      const win = iframeRef.current?.contentWindow;
      if (win && doc) {
        const currentPath = win.location.pathname;
        validateAndEnforce(currentPath);
      }
    } catch {
      // Cross-origin fallback
    }
  };

  const handleRestore = () => {
    setIsBlocked(false);
    setIframeKey((prev) => prev + 1);
  };

  const iframeSrc = isPathLocked
    ? `/r/${encodeURIComponent(link.slug)}/proxy${isDevUnlocked ? "?unlocked=1" : ""}`
    : link.targetUrl;

  return (
    <div className="fixed inset-0 w-screen h-screen bg-[#0d0d10] flex flex-col z-[9999] overflow-hidden select-none font-sans">
      {/* ── 1. COLLAPSIBLE TOPBAR (Compact 34px, Fixed) ── */}
      <div
        className={cn(
          "fixed top-0 left-0 right-0 h-[34px] bg-[#141418] border-b border-[#222226] px-3 flex items-center justify-between z-[999] transition-transform duration-250 ease-out shadow-sm",
          isTopbarHidden ? "-translate-y-full pointer-events-none" : "translate-y-0",
        )}
      >
        {/* Left: Status, Slug, Badge */}
        <div className="flex items-center gap-2 text-xs text-neutral-400 min-w-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="font-mono text-white text-[11.5px] font-semibold shrink-0">
            /{link.slug}
          </span>

          {/* PathLock Badge */}
          {isPathLocked && (
            isDevUnlocked ? (
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9.5px] font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>🔓 Access Unlocked</span>
              </div>
            ) : (
              <div className="hidden xs:flex items-center gap-1 px-1.5 py-0.5 rounded-[4px] bg-brand/10 border border-brand/30 text-brand text-[9.5px] font-bold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                <span>
                  PathLock™{" "}
                  {effectiveLockMode === "strict" ? "Single-Page" : "Funnel"}
                </span>
              </div>
            )
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Relock Button if unlocked */}
          {isDevUnlocked && (
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  sessionStorage.removeItem(`pathlock_unlocked_${link.slug}`);
                }
                setIsDevUnlocked(false);
                setIsBlocked(false);
                setIframeKey((prev) => prev + 1);
              }}
              className="flex items-center gap-1 text-[10.5px] text-amber-500 hover:text-amber-400 transition-colors px-2 py-0.5 rounded-[5px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 font-bold cursor-pointer"
              title="Re-lock the tunnel"
            >
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">Re-lock</span>
            </button>
          )}

          {/* Source Link */}
          {(!isPathLocked || isDevUnlocked) && (
            <a
              href={link.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-[10.5px] text-neutral-400 hover:text-white transition-colors px-2 py-0.5 rounded-[5px] hover:bg-white/5 cursor-pointer"
            >
              <span className="hidden sm:inline">Source</span>
              <ExternalLink className="w-3 h-3 text-brand" />
            </a>
          )}

          {/* Collapse Topbar Button */}
          <button
            type="button"
            onClick={() => setIsTopbarHidden(true)}
            className="flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 text-[10.5px] font-bold transition-all cursor-pointer"
            title="Hide bar"
          >
            <span className="hidden sm:inline">Hide</span>
            <ChevronUp className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* ── 2. FLOATING TRIGGER PILL (Fixed, Top Center, z-index 1000) ── */}
      {isTopbarHidden && (
        <div className="fixed top-2.5 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-top-2 duration-250">
          <button
            type="button"
            onClick={() => setIsTopbarHidden(false)}
            className="px-3 py-1 rounded-full bg-[#141418]/95 backdrop-blur-md border border-white/15 shadow-xl text-xs font-semibold text-zinc-200 hover:text-white flex items-center gap-2 group cursor-pointer hover:border-brand/60 hover:bg-[#1a1a20] transition-all"
          >
            <div className="w-3.5 h-3.5 rounded-[3px] bg-brand flex items-center justify-center text-white font-black text-[7.5px]">
              LS
            </div>
            <span className="text-[10.5px] font-medium text-zinc-300 group-hover:text-white">
              Show bar
            </span>
            <ChevronDown className="w-3 h-3 text-brand transition-transform group-hover:translate-y-0.5" />
          </button>
        </div>
      )}

      {/* ── 3. IFRAME CONTAINER (Zero black strip, 100% full screen when collapsed) ── */}
      <div
        className={cn(
          "fixed inset-0 w-full h-full bg-white transition-[padding] duration-250 ease-out",
          isTopbarHidden ? "pt-0" : "pt-[34px]",
        )}
      >
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={iframeSrc}
          title={title}
          onLoad={handleIframeLoad}
          className="w-full h-full border-0 bg-white"
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-downloads"
        />

        {/* ── 4. PATHLOCK™ SECURITY GATE BLOCKING OVERLAY ── */}
        {isBlocked && (
          <div className="absolute inset-0 z-50 bg-[#09090c]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Glowing Shield Icon */}
            <div className="w-16 h-16 rounded-[10px] bg-brand/10 border border-brand/40 flex items-center justify-center shadow-lg shadow-brand/20 mb-4 animate-bounce">
              <ShieldAlert className="w-8 h-8 text-brand" />
            </div>

            {/* Badges & Warnings */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Access Outside Perimeter Blocked</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight max-w-md">
              Navigation Restricted by Link Owner
            </h2>

            {/* Explanatory message */}
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mt-2 leading-relaxed">
              {link.pathLockMessage ||
                `The owner of this link has enabled PathLock™ ${
                  effectiveLockMode === "strict"
                    ? "Strict Single-Page"
                    : "Funnel & Subpaths"
                } mode. You cannot navigate outside the authorized page.`}
            </p>

            {/* Allowed route reminder box (never leaks raw destination URL) */}
            <div className="mt-4 px-4 py-2.5 rounded-[10px] bg-[#141418] border border-[#27272a] text-xs text-zinc-300 flex items-center gap-2 max-w-md w-full justify-center">
              <span className="w-2 h-2 rounded-[999px] bg-emerald-400 shrink-0" />
              <span className="text-zinc-400">Authorized perimeter:</span>
              <span className="font-mono font-bold text-white truncate max-w-[260px]">
                /{link.slug}
              </span>
            </div>

            {/* Recovery CTA Button */}
            <button
              type="button"
              onClick={handleRestore}
              className="mt-6 px-6 py-3 rounded-[8px] bg-brand hover:bg-brand-hover text-white font-bold text-sm tracking-wide shadow-lg shadow-brand/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Return to authorized page</span>
            </button>

            {/* Developer / Team Bypass Unlock */}
            {Boolean(targetPassword) && (
              <div className="mt-5 p-3.5 rounded-[8px] bg-[#141418] border border-[#27272a] max-w-md w-full flex flex-col gap-2.5 text-left animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Developer / Team Unlock
                  </span>
                  <span className="text-[10px] text-zinc-500">Full access</span>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!unlockPasswordInput.trim()) {
                      setUnlockError("Please enter the password.");
                      return;
                    }
                    if (unlockPasswordInput.trim() === targetPassword.trim()) {
                      if (typeof window !== "undefined") {
                        sessionStorage.setItem(`pathlock_unlocked_${link.slug}`, "true");
                      }
                      setIsDevUnlocked(true);
                      setIsBlocked(false);
                      setUnlockError("");
                      setUnlockPasswordInput("");
                    } else {
                      setUnlockError("Incorrect password.");
                    }
                  }}
                  className="flex flex-col gap-2"
                >
                  <div className="relative">
                    <input
                      type={showUnlockPassword ? "text" : "password"}
                      placeholder="Bypass password..."
                      value={unlockPasswordInput}
                      onChange={(e) => {
                        setUnlockPasswordInput(e.target.value);
                        if (unlockError) setUnlockError("");
                      }}
                      className="w-full bg-[#101012] border border-[#27272a] focus:border-brand text-white placeholder:text-zinc-500 text-xs h-9 rounded-[8px] pl-3 pr-10 outline-none transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUnlockPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                      title={showUnlockPassword ? "Hide" : "Show"}
                    >
                      {showUnlockPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {unlockError && (
                    <span className="text-[11px] text-red-400 font-medium">
                      {unlockError}
                    </span>
                  )}
                  <button
                    type="submit"
                    className="w-full py-2 rounded-[8px] bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/10 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <span>Unlock full access</span>
                  </button>
                </form>
              </div>
            )}

            <span className="text-[10.5px] text-zinc-600 mt-5">
              Secured by LShorter Edge Gate • PathLock™ Engine
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
