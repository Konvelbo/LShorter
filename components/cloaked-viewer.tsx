"use client";

import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
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
import { isPathAllowedByPathLock } from "@/lib/pathlock-routes";
import { verifyPathLockUnlockPassword } from "@/app/r/[slug]/view/actions";

export interface CloakedViewerLink {
  slug: string;
  targetUrl: string;
  metaTitle?: string;
  description?: string;
  isCloaked?: boolean;
  pathLockMode?: string;
  path_lock_mode?: string;
  pathLockPrefix?: string;
  path_lock_prefix?: string;
  pathLockMessage?: string;
  path_lock_message?: string;
  hasUnlockPassword?: boolean;
}

export interface CloakedViewerProps {
  link: CloakedViewerLink;
}

export function CloakedViewer({ link }: CloakedViewerProps) {
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isDevUnlocked, setIsDevUnlocked] = useState(false);
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

  const effectivePathnameRef = useRef<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem(`pathlock_unlocked_${link.slug}`);
      if (saved === "true") {
        queueMicrotask(() => setIsDevUnlocked(true));
      }
      try {
        const bc = new BroadcastChannel("lshorter_realtime");
        bc.postMessage({ type: "click", slug: link.slug });
        bc.close();
      } catch {}
    }
  }, [link.slug]);

  const effectiveLockMode = String(
    link.pathLockMode || link.path_lock_mode || "off",
  )
    .trim()
    .toLowerCase();
  const isPathLocked = effectiveLockMode !== "off";
  const hasUnlock = Boolean(
    link.hasUnlockPassword ||
    (link as any).has_unlock_password ||
    (link as any).pathLockPassword ||
    (link as any).path_lock_password
  );
  const title = link.metaTitle || `/${link.slug}`;
  const safeTitle = link.metaTitle || `/${link.slug}`;
  const cleanPrefix = (link.pathLockPrefix || link.path_lock_prefix || "")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
  const authorizedPath = cleanPrefix || link.slug;
  const descriptionText =
    link.pathLockMessage ||
    link.path_lock_message ||
    link.description ||
    (effectiveLockMode === "strict"
      ? "Le propriétaire de ce lien a restreint la navigation à cette page unique. Toute navigation externe est bloquée."
      : "Le propriétaire de ce lien a restreint l'accès aux seules pages de son périmètre autorisé. Toute navigation externe est verrouillée.");

  const validateAndEnforce = useCallback(
    (urlOrPath: string) => {
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

        const rawPrefix = link.pathLockPrefix || link.path_lock_prefix || "";
        const allowed = isPathAllowedByPathLock({
          mode: effectiveLockMode,
          attemptPathOrUrl: urlOrPath,
          rawPrefix,
          slug: link.slug,
          targetPaths: [targetPathname, effectivePathnameRef.current],
        });

        if (!allowed) {
          setIsBlocked(true);
        } else {
          setIsBlocked(false);
        }
      } catch {}
    },
    [
      isPathLocked,
      isDevUnlocked,
      link.targetUrl,
      link.pathLockPrefix,
      link.path_lock_prefix,
      link.slug,
      effectiveLockMode,
    ],
  );

  // Monitor iframe navigation via postMessage from PathLock proxy interceptor
  useEffect(() => {
    if (!isPathLocked) return;

    const handleMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "PATHLOCK_UPSTREAM_RESTRICTED") {
        setIsBlocked(false);
        return;
      }
      if (e.data.type === "PATHLOCK_NAVIGATE") {
        if (isDevUnlocked) return;
        if (e.data.blocked) {
          setIsBlocked(true);
          return;
        }
        if (typeof e.data.effectivePath === "string") {
          effectivePathnameRef.current = e.data.effectivePath;
        }
        const attempted = String(e.data.url || "");
        validateAndEnforce(attempted);
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [isPathLocked, isDevUnlocked, validateAndEnforce]);

  // Synchronize unlock state with the proxied iframe
  useEffect(() => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: isDevUnlocked ? "PATHLOCK_UNLOCK" : "PATHLOCK_LOCK" },
        "*",
      );
    } catch {}
  }, [isDevUnlocked]);

  const handleIframeLoad = () => {
    if (!isPathLocked || isDevUnlocked) return;
    try {
      const doc = iframeRef.current?.contentDocument;
      const win = iframeRef.current?.contentWindow;
      if (win && doc) {
        if (win.location.href === "about:blank") return;
        const effPath = (
          win as unknown as { __PATHLOCK_EFFECTIVE_PATH__?: string }
        ).__PATHLOCK_EFFECTIVE_PATH__;
        if (typeof effPath === "string") {
          effectivePathnameRef.current = effPath;
        }
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

  const handleDevUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = unlockPasswordInput.trim();
    if (!candidate) {
      setUnlockError("Veuillez saisir le mot de passe.");
      return;
    }
    try {
      const res = await verifyPathLockUnlockPassword(link.slug, candidate);
      if (res.success) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`pathlock_unlocked_${link.slug}`, "true");
        }
        setIsDevUnlocked(true);
        setIsBlocked(false);
        setUnlockError("");
        setUnlockPasswordInput("");
      } else {
        setUnlockError(res.error || "Mot de passe incorrect.");
      }
    } catch {
      setUnlockError("Erreur de vérification.");
    }
  };

  const iframeSrc = isPathLocked
    ? `/r/${encodeURIComponent(link.slug)}/proxy${isDevUnlocked ? "?unlocked=1" : ""}`
    : link.targetUrl;

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#0B0C0E] overflow-hidden font-sans select-none text-[#F5F6F8]">
      {/* ── TOPBAR (Slide-in / Expandable) ── */}
      {!isHeaderCollapsed ? (
        <header className="relative z-40 h-16 px-4 sm:px-8 flex items-center justify-between box-border border-b border-white/[0.08] bg-[#0B0C0E]/90 backdrop-blur-[20px] transition-all duration-300 shrink-0">
          {/* Left Brand & Mode */}
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-9 h-9 rounded-[10px] bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-600/20">
              <Shield className="w-5 h-5" />
            </span>
            <span className="text-[16px] sm:text-[17px] font-bold text-white tracking-[-0.01em] truncate max-w-[180px] sm:max-w-xs">
              {safeTitle}
            </span>

            {/* PathLock Badge */}
            {isPathLocked &&
              (isDevUnlocked ? (
                <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Accès débloqué</span>
                </span>
              ) : (
                <span className="inline-flex items-center h-7 px-3 rounded-full bg-white/[0.05] border border-white/10 text-[#A9C4FF] text-xs font-semibold whitespace-nowrap">
                  PathLock™ {effectiveLockMode === "strict" ? "Single-Page" : "Funnel"}
                </span>
              ))}

            {!isPathLocked && (
              <span className="inline-flex items-center h-7 px-3 rounded-full bg-white/[0.05] border border-white/10 text-zinc-400 text-xs font-medium">
                Protégé
              </span>
            )}
          </div>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-2">
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
                className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-[10px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
                title="Re-verrouiller le tunnel"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Re-verrouiller</span>
              </button>
            )}

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleReload}
              className="h-10 px-3.5 inline-flex items-center gap-2 rounded-[10px] border border-white/10 hover:bg-white/[0.07] text-[#D5D9E2] hover:text-white text-sm font-medium transition-colors cursor-pointer"
              title="Actualiser la page"
            >
              <RefreshCw className="w-4 h-4" />
              <span className="hidden sm:inline">Actualiser</span>
            </button>

            {/* Original Link Button (if unlocked or not locked) */}
            {(!isPathLocked || isDevUnlocked) && (
              <a
                href={link.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="h-10 px-3.5 inline-flex items-center gap-1.5 rounded-[10px] border border-white/10 hover:bg-white/[0.07] text-[#D5D9E2] hover:text-white text-sm font-medium transition-colors"
                title="Ouvrir le site original"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Original</span>
              </a>
            )}

            {/* Reduce / Collapse Header Button */}
            <button
              type="button"
              onClick={() => setIsHeaderCollapsed(true)}
              className="w-10 h-10 inline-flex items-center justify-center rounded-[10px] border border-white/10 hover:bg-white/[0.07] text-[#D5D9E2] hover:text-white transition-colors cursor-pointer"
              aria-label="Réduire la barre"
              title="Masquer la barre"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>
        </header>
      ) : null}

      {/* ── RESTORE TOPBAR FLOATING PILL (Always visible when top is hidden) ── */}
      {isHeaderCollapsed && (
        <button
          type="button"
          onClick={() => setIsHeaderCollapsed(false)}
          className="fixed top-3.5 left-1/2 -translate-x-1/2 z-[99999] h-10 px-4 rounded-full bg-[#0B0C0E]/95 hover:bg-[#141418] border border-white/20 hover:border-blue-500/60 text-[#F5F6F8] text-xs font-semibold flex items-center gap-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all hover:scale-105 active:scale-95 cursor-pointer animate-in fade-in slide-in-from-top-3 duration-200"
          title="Afficher la barre"
          aria-label="Afficher la barre"
        >
          <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Shield className="w-3 h-3" />
          </span>
          <span>Afficher la barre</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#8DB0FF]" />
        </button>
      )}

      {/* ── MAIN CONTENT (Iframe + Gate Overlay) ── */}
      <div className="relative w-full flex-1 bg-white overflow-hidden">
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={iframeSrc}
          title={title}
          onLoad={handleIframeLoad}
          className="w-full h-full border-none flex-1 bg-white"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        />

        {/* ── PATHLOCK™ SECURITY GATE BLOCKING OVERLAY ── */}
        {isBlocked && (
          <div className="absolute inset-0 z-50 bg-[#0B0C0E] overflow-y-auto flex flex-col items-center justify-center p-4 sm:p-6 text-white font-sans select-text">
            {/* Ambient Background Glows */}
            <div
              aria-hidden="true"
              className="absolute inset-0 pointer-events-none overflow-hidden"
            >
              <div className="absolute left-[15%] top-[15%] w-[560px] h-[72px] rounded-[18px] bg-white/[0.08] blur-[20px]" />
              <div className="absolute right-[10%] top-[12%] w-[340px] h-[220px] rounded-[24px] bg-white/[0.06] blur-[24px]" />
              <div className="absolute left-[15%] top-[45%] w-[330px] h-[210px] rounded-[24px] bg-white/[0.05] blur-[24px]" />
              <div className="absolute right-[10%] top-[45%] w-[330px] h-[210px] rounded-[24px] bg-white/[0.05] blur-[24px]" />
              <div className="absolute left-[35%] top-[25%] w-[520px] h-[520px] rounded-full bg-blue-600/[0.08] blur-[120px]" />
              <div className="absolute inset-0 bg-[#090A0C]/55 backdrop-blur-[12px]" />
            </div>

            {/* Centered Modal Card */}
            <main className="relative z-10 w-full max-w-[460px] flex flex-col items-center my-auto py-8">
              <section className="w-full box-border p-7 sm:p-10 flex flex-col items-center text-center rounded-[24px] bg-white/[0.05] border border-white/[0.12] backdrop-blur-[28px] shadow-[0_24px_64px_rgba(0,0,0,0.35)] animate-in fade-in zoom-in-95 duration-200">
                {/* Shield Alert Icon Badge */}
                <span className="w-16 h-16 rounded-[18px] bg-blue-600/[0.14] border border-[#608CFF]/[0.35] text-[#8DB0FF] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
                  <ShieldAlert className="w-8 h-8" />
                </span>

                {/* Status Tag Pill */}
                <span className="inline-flex items-center gap-2 mt-6 h-[30px] px-3.5 rounded-full bg-blue-600/[0.14] border border-[#608CFF]/[0.35] text-[#A9C4FF] text-xs font-bold tracking-[0.06em] uppercase">
                  <Lock className="w-3.5 h-3.5 shrink-0" />
                  <span>ACCÈS HORS PÉRIMÈTRE BLOQUÉ</span>
                </span>

                {/* Main Heading */}
                <h1 className="mt-4 text-2xl sm:text-[30px] leading-tight font-bold tracking-[-0.02em] text-white">
                  Navigation restreinte par le créateur du lien
                </h1>

                {/* Link Name */}
                <p className="mt-3 text-[15px] font-semibold text-[#A9AFBA] max-w-sm truncate">
                  {safeTitle}
                </p>

                {/* Description Part */}
                <div className="w-full mt-3.5 p-3 sm:p-3.5 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                  <p className="text-xs sm:text-sm text-[#D5D9E2] leading-relaxed break-words">
                    {descriptionText}
                  </p>
                </div>

                {/* Authorized Perimeter Box */}
                <div className="w-full box-border mt-6 h-[52px] px-4 flex items-center justify-center gap-2.5 rounded-[12px] bg-white/[0.04] border border-white/10">
                  <span className="text-sm text-[#A9AFBA]">Périmètre autorisé</span>
                  <code className="font-mono text-sm font-semibold text-[#A9C4FF] px-2.5 py-1 rounded-lg bg-black/30 border border-white/10">
                    /{authorizedPath}
                  </code>
                </div>

                {/* Return Button */}
                <button
                  type="button"
                  onClick={handleRestore}
                  className="w-full mt-4 h-[52px] flex items-center justify-center gap-2.5 rounded-[12px] bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-base font-semibold transition-all shadow-lg shadow-blue-600/25 cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Revenir à la page autorisée</span>
                </button>

                {/* Divider Line */}
                <div className="w-full h-px mt-7 bg-white/10" />

                {/* Developer / Team Unlock Form */}
                {hasUnlock && (
                  <div className="w-full mt-6 flex flex-col gap-3.5 text-left">
                    <div className="flex items-center justify-between gap-3">
                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-white">
                        <Lock className="w-4 h-4 text-[#8DB0FF]" />
                        <span>Déverrouillage équipe / développeur</span>
                      </span>
                      <span className="text-xs font-medium text-[#A9AFBA] whitespace-nowrap">
                        Accès complet
                      </span>
                    </div>

                    <form onSubmit={handleDevUnlockSubmit} className="flex flex-col gap-3">
                      <div className="relative">
                        <label htmlFor="unlock-pass" className="sr-only">
                          Mot de passe de déblocage
                        </label>
                        <input
                          id="unlock-pass"
                          type={showUnlockPassword ? "text" : "password"}
                          placeholder="Mot de passe de déblocage…"
                          value={unlockPasswordInput}
                          onChange={(e) => {
                            setUnlockPasswordInput(e.target.value);
                            if (unlockError) setUnlockError("");
                          }}
                          className="w-full h-12 px-3.5 pr-12 rounded-[10px] bg-black/30 border border-white/[0.14] focus:border-blue-500 text-[#F5F6F8] placeholder:text-[#8A909C] text-sm outline-none transition-colors"
                        />
                        <button
                          type="button"
                          onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                          aria-label={showUnlockPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                          className="absolute right-1 top-1 w-10 h-10 flex items-center justify-center text-[#A9AFBA] hover:text-white transition-colors cursor-pointer"
                        >
                          {showUnlockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>

                      {unlockError && (
                        <p className="text-xs text-red-400 font-medium">
                          {unlockError}
                        </p>
                      )}

                      <button
                        type="submit"
                        className="w-full h-12 rounded-[10px] border border-[#8DB0FF]/40 hover:bg-white/[0.06] text-[#A9C4FF] text-sm font-semibold transition-colors cursor-pointer"
                      >
                        Déverrouiller l’accès complet
                      </button>
                    </form>
                  </div>
                )}
              </section>

              {/* Footer */}
              <p className="mt-7 text-xs text-[#9096A3] text-center">
                Sécurisé par LShorter Edge Gate • PathLock™ Engine
              </p>
            </main>
          </div>
        )}
      </div>
    </div>
  );
}

export default CloakedViewer;
