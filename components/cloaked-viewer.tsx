"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  ExternalLink,
  Shield,
  ShieldAlert,
  ShieldCheck,
  RefreshCw,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
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
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
  const [useProxyFallback, setUseProxyFallback] = useState(false);
  const [unlockPasswordInput, setUnlockPasswordInput] = useState("");
  const [showUnlockPassword, setShowUnlockPassword] = useState(false);
  const [unlockError, setUnlockError] = useState("");
  const [iframeKey, setIframeKey] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (link.metaTitle) {
      document.title = link.metaTitle;
    }
  }, [link.metaTitle]);

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

  // Monitor iframe navigation via postMessage from PathLock proxy interceptor
  useEffect(() => {
    if (!isPathLocked) return;

    const handleMessage = (e: MessageEvent) => {
      if (
        e.data &&
        typeof e.data === "object" &&
        e.data.type === "PATHLOCK_NAVIGATE"
      ) {
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
        targetPathname = tu.pathname || "/";
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
      const prefixes = rawPrefix
        .split(",")
        .map((p: string) => p.trim().replace(/^\/+/, "").replace(/\/+$/, ""))
        .filter(Boolean);

      if (prefixes.length === 0 && cleanTargetPath) {
        prefixes.push(cleanTargetPath);
      }

      if (effectiveLockMode === "strict") {
        const allowed =
          cleanAttempt === cleanTargetPath || prefixes.includes(cleanAttempt);
        if (!allowed) {
          setIsBlocked(true);
        }
      } else if (effectiveLockMode === "funnel") {
        const isRootOrTarget =
          cleanAttempt === "" ||
          cleanAttempt === "/" ||
          cleanAttempt === cleanTargetPath;
        const isAllowedPrefix = prefixes.some(
          (p: string) =>
            cleanAttempt === p || cleanAttempt.startsWith(`${p}/`),
        );
        const allowed = isRootOrTarget || isAllowedPrefix;
        if (!allowed) {
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
      // Cross-origin fallback handled via postMessage
    }
  };

  const handleReload = () => {
    setIframeKey((prev) => prev + 1);
  };

  const handleRestore = () => {
    setIsBlocked(false);
    setIframeKey((prev) => prev + 1);
  };

  const iframeSrc = useProxyFallback
    ? `/r/${encodeURIComponent(link.slug)}/proxy${isDevUnlocked ? "?unlocked=1" : ""}`
    : link.targetUrl;

  return (
    <div className="relative w-screen h-screen flex flex-col bg-black overflow-hidden font-sans select-none">
      {/* Cloaked Header Bar */}
      {!isHeaderCollapsed ? (
        <header className="h-11 bg-zinc-900/95 dark:bg-[#0f0f12]/95 border-b border-zinc-800 dark:border-[#222226] backdrop-blur-md px-4 flex items-center justify-between text-white z-40 transition-all shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-6 h-6 rounded-[6px] bg-brand/10 border border-brand/30 flex items-center justify-center text-brand shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-semibold text-zinc-200 truncate max-w-[220px] sm:max-w-xs">
              {link.metaTitle || `/${link.slug}`}
            </span>

            {/* PathLock Badge */}
            {isPathLocked &&
              (isDevUnlocked ? (
                <span className="text-[10px] text-emerald-400 font-mono font-bold px-2 py-0.5 rounded-[4px] bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Accès Débloqué</span>
                </span>
              ) : (
                <span className="text-[10px] text-brand font-mono font-bold px-2 py-0.5 rounded-[4px] bg-brand/10 border border-brand/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
                  <span>
                    PathLock™{" "}
                    {effectiveLockMode === "strict" ? "Single-Page" : "Funnel"}
                  </span>
                </span>
              ))}

            {!isPathLocked && (
              <span className="text-[10px] text-zinc-400 font-mono hidden sm:inline px-1.5 py-0.5 rounded-[4px] bg-zinc-800 dark:bg-[#1a1a20] border border-zinc-700/50">
                Protégé
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5">
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
                className="h-8 px-2.5 flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition-colors rounded-[6px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 font-semibold cursor-pointer"
                title="Re-verrouiller le tunnel"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Re-verrouiller</span>
              </button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReload}
              className="h-8 px-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-[6px] text-xs gap-1 cursor-pointer"
              title="Actualiser la page"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Actualiser</span>
            </Button>

            {(!isPathLocked || isDevUnlocked) && (
              <a
                href={link.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-8 px-2.5 inline-flex items-center gap-1 text-xs text-zinc-300 hover:text-white hover:bg-white/10 rounded-[6px] transition-colors"
                title="Ouvrir le site original"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Original</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setIsHeaderCollapsed(true)}
              className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 rounded-[6px] transition-colors cursor-pointer"
              title="Masquer la barre"
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
          title="Afficher la barre"
        >
          <Shield className="w-3.5 h-3.5 text-brand" />
          <span>Afficher la barre</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Main Content Area */}
      <div className="relative w-full flex-1 bg-white overflow-hidden">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={iframeSrc}
          title={title}
          onLoad={handleIframeLoad}
          onError={() => setUseProxyFallback(true)}
          className="w-full h-full border-none flex-1 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        />

        {/* ── PATHLOCK™ SECURITY GATE BLOCKING OVERLAY ── */}
        {isBlocked && (
          <div className="absolute inset-0 z-50 bg-[#09090c]/95 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Glowing Shield Icon */}
            <div className="w-16 h-16 rounded-[12px] bg-brand/10 border border-brand/40 flex items-center justify-center shadow-lg shadow-brand/20 mb-4 animate-bounce">
              <ShieldAlert className="w-8 h-8 text-brand" />
            </div>

            {/* Badges & Warnings */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-[6px] bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold uppercase tracking-wider mb-2">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Accès Hors Périmètre Bloqué</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight max-w-md">
              Navigation Restreinte par le Créateur du Lien
            </h2>

            {/* Explanatory message */}
            <p className="text-xs sm:text-sm text-zinc-400 max-w-md mt-2 leading-relaxed">
              {link.pathLockMessage ||
                `Le propriétaire de ce lien a activé le mode PathLock™ ${
                  effectiveLockMode === "strict"
                    ? "Strict Single-Page"
                    : "Funnel & Subpaths"
                }. Vous ne pouvez pas naviguer en dehors de la page autorisée.`}
            </p>

            {/* Allowed route reminder box */}
            <div className="mt-4 px-4 py-2.5 rounded-[10px] bg-[#141418] border border-[#27272a] text-xs text-zinc-300 flex items-center gap-2 max-w-md w-full justify-center">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <span className="text-zinc-400">Périmètre autorisé :</span>
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
              <span>Revenir à la page autorisée</span>
            </button>

            {/* Developer / Team Bypass Unlock Form */}
            {Boolean(targetPassword) && (
              <div className="mt-5 p-3.5 rounded-[8px] bg-[#141418] border border-[#27272a] max-w-md w-full flex flex-col gap-2.5 text-left animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                    Déverrouillage Équipe / Développeur
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Accès complet
                  </span>
                </div>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!unlockPasswordInput.trim()) {
                      setUnlockError("Veuillez saisir le mot de passe.");
                      return;
                    }
                    if (unlockPasswordInput.trim() === targetPassword.trim()) {
                      if (typeof window !== "undefined") {
                        sessionStorage.setItem(
                          `pathlock_unlocked_${link.slug}`,
                          "true",
                        );
                      }
                      setIsDevUnlocked(true);
                      setIsBlocked(false);
                      setUnlockError("");
                      setUnlockPasswordInput("");
                    } else {
                      setUnlockError("Mot de passe incorrect.");
                    }
                  }}
                  className="flex flex-col gap-2"
                >
                  <div className="relative">
                    <input
                      type={showUnlockPassword ? "text" : "password"}
                      placeholder="Mot de passe de déblocage..."
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
                      title={showUnlockPassword ? "Masquer" : "Afficher"}
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
                    <span>Déverrouiller l&apos;accès complet</span>
                  </button>
                </form>
              </div>
            )}

            <span className="text-[10.5px] text-zinc-600 mt-5">
              Sécurisé par LShorter Edge Gate • PathLock™ Engine
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CloakedViewer;
