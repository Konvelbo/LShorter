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
import { useI18n } from "@/components/providers/i18n-provider";

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
  initialBlocked?: boolean;
  initialHeaderCollapsed?: boolean;
  hideRestorePill?: boolean;
}

export function CloakedViewer({
  link,
  initialBlocked = false,
  initialHeaderCollapsed = false,
  hideRestorePill = false,
}: CloakedViewerProps) {
  const { tr } = useI18n();
  const [isHeaderCollapsed, setIsHeaderCollapsed] = useState(initialHeaderCollapsed);
  const [isReloading, setIsReloading] = useState(false);
  const [isBlocked, setIsBlocked] = useState(initialBlocked);
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
      ? tr(
          "The owner of this link restricted navigation to this single page. External navigation is blocked.",
          "Le propriétaire de ce lien a restreint la navigation à cette page unique. Toute navigation externe est bloquée.",
        )
      : tr(
          "The owner of this link restricted access to pages inside the authorized perimeter. External navigation is locked.",
          "Le propriétaire de ce lien a restreint l'accès aux seules pages de son périmètre autorisé. Toute navigation externe est verrouillée.",
        ));

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
          targetPaths: [targetPathname],
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
    setIsReloading(false);
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
    setIsReloading(true);
    try {
      const win = iframeRef.current?.contentWindow;
      if (win && win.location) {
        win.location.reload();
        return;
      }
    } catch {}
    if (iframeRef.current) {
      iframeRef.current.src = iframeSrc;
    } else {
      setIframeKey((prev) => prev + 1);
    }
  };

  const handleRestore = () => {
    setIsBlocked(false);
    setIsReloading(true);
    if (iframeRef.current) {
      iframeRef.current.src = iframeSrc;
    } else {
      setIframeKey((prev) => prev + 1);
    }
  };

  const handleDevUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const candidate = unlockPasswordInput.trim();
    if (!candidate) {
      setUnlockError(tr("Please enter the password.", "Veuillez saisir le mot de passe."));
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
        setUnlockError(res.error || tr("Incorrect password.", "Mot de passe incorrect."));
      }
    } catch {
      setUnlockError(tr("Verification error.", "Erreur de vérification."));
    }
  };

  const iframeSrc = isPathLocked
    ? `/r/${encodeURIComponent(link.slug)}/proxy${isDevUnlocked ? "?unlocked=1" : ""}`
    : link.targetUrl;

  return (
    <div className="relative w-screen h-screen bg-[#0B0C0E] overflow-hidden font-sans select-none text-[#F5F6F8]">
      {/* ── TOP LOADING PROGRESS BAR (Ultra-fluid instant feedback on reload) ── */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 h-[2.5px] bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500 transition-all duration-300 pointer-events-none ${
          isReloading
            ? "opacity-100 scale-x-100 animate-pulse origin-left"
            : "opacity-0 scale-x-0 origin-left"
        }`}
      />

      {/* ── TOPBAR (Slide-in / Expandable with Landing Navbar Cubic-Bezier Animation) ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-[110] h-14 sm:h-16 px-4 sm:px-8 flex items-center justify-between box-border border-b border-white/[0.08] bg-[#0B0C0E]/95 backdrop-blur-[20px] transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity] ${
          isHeaderCollapsed
            ? "-translate-y-full opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100 pointer-events-auto"
        }`}
      >
        {/* Left Brand & Mode */}
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-[10px] bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-md shadow-blue-600/20">
            <Shield className="w-5 h-5" />
          </span>
          <span className="text-[15px] sm:text-[17px] font-bold text-white tracking-[-0.01em] truncate max-w-[160px] sm:max-w-xs">
            {safeTitle}
          </span>

          {/* PathLock Badge */}
          {isPathLocked &&
            (isDevUnlocked ? (
              <span className="inline-flex items-center gap-1.5 h-7 px-2.5 sm:px-3 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{tr("Access unlocked", "Accès débloqué")}</span>
              </span>
            ) : (
              <span className="inline-flex items-center h-7 px-2.5 sm:px-3 rounded-full bg-white/[0.05] border border-white/10 text-[#A9C4FF] text-xs font-semibold whitespace-nowrap shrink-0">
                PathLock™ {effectiveLockMode === "strict" ? tr("Single-Page", "Page unique") : tr("Funnel", "Tunnel")}
              </span>
            ))}

          {!isPathLocked && (
            <span className="inline-flex items-center h-7 px-2.5 sm:px-3 rounded-full bg-white/[0.05] border border-white/10 text-zinc-400 text-xs font-medium shrink-0">
              {tr("Protected", "Protégé")}
            </span>
          )}
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
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
              className="h-9 sm:h-10 px-2.5 sm:px-3.5 inline-flex items-center gap-1.5 rounded-[10px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold transition-colors cursor-pointer"
              title={tr("Re-lock perimeter", "Re-verrouiller le tunnel")}
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tr("Re-lock", "Re-verrouiller")}</span>
            </button>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={handleReload}
            disabled={isReloading}
            className="h-9 sm:h-10 px-2.5 sm:px-3.5 inline-flex items-center gap-2 rounded-[10px] border border-white/10 hover:bg-white/[0.07] text-[#D5D9E2] hover:text-white text-xs sm:text-sm font-medium transition-colors cursor-pointer disabled:opacity-70"
            title={tr("Refresh page", "Actualiser la page")}
          >
            <RefreshCw className={`w-4 h-4 transition-transform ${isReloading ? "animate-spin text-blue-400" : ""}`} />
            <span className="hidden sm:inline">{isReloading ? tr("Refreshing…", "Actualisation…") : tr("Refresh", "Actualiser")}</span>
          </button>

          {/* Original Link Button (if unlocked or not locked) */}
          {(!isPathLocked || isDevUnlocked) && (
            <a
              href={link.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="h-9 sm:h-10 px-2.5 sm:px-3.5 inline-flex items-center gap-1.5 rounded-[10px] border border-white/10 hover:bg-white/[0.07] text-[#D5D9E2] hover:text-white text-xs sm:text-sm font-medium transition-colors"
              title={tr("Open original website", "Ouvrir le site original")}
            >
              <ExternalLink className="w-4 h-4" />
              <span className="hidden sm:inline">{tr("Original", "Original")}</span>
            </a>
          )}

          {/* Reduce / Collapse Header Button */}
          <button
            type="button"
            onClick={() => setIsHeaderCollapsed(true)}
            className="w-9 h-9 sm:w-10 sm:h-10 inline-flex items-center justify-center rounded-[10px] border border-white/10 hover:bg-white/[0.07] text-[#D5D9E2] hover:text-white transition-colors cursor-pointer"
            aria-label={tr("Collapse bar", "Réduire la barre")}
            title={tr("Hide bar", "Masquer la barre")}
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ── RESTORE TOPBAR FLOATING PILL (Smooth slide-in like landing navbar) ── */}
      {!hideRestorePill && (
        <button
          type="button"
          onClick={() => setIsHeaderCollapsed(false)}
          className={`fixed top-3 left-1/2 -translate-x-1/2 z-[99999] h-10 px-4 rounded-full bg-[#0B0C0E]/95 hover:bg-[#141418] border border-white/20 hover:border-blue-500/60 text-[#F5F6F8] text-xs font-semibold flex items-center gap-2.5 shadow-[0_8px_32px_rgba(0,0,0,0.6)] backdrop-blur-xl transition-all duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-[transform,opacity] cursor-pointer hover:scale-105 active:scale-95 ${
            isHeaderCollapsed
              ? "translate-y-0 opacity-100 scale-100 pointer-events-auto"
              : "-translate-y-6 opacity-0 scale-95 pointer-events-none"
          }`}
          title={tr("Show bar", "Afficher la barre")}
          aria-label={tr("Show bar", "Afficher la barre")}
        >
          <span className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
            <Shield className="w-3 h-3" />
          </span>
          <span>{tr("Show bar", "Afficher la barre")}</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#8DB0FF]" />
        </button>
      )}

      {/* ── MAIN CONTENT (Iframe Container) — Pure GPU Transform, Zero Reflow, Zero White Band ── */}
      <div
        className={`absolute inset-0 w-full h-full bg-[#0B0C0E] overflow-hidden transition-transform duration-400 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          isHeaderCollapsed ? "translate-y-0" : "translate-y-14 sm:translate-y-16"
        }`}
      >
        <iframe
          key={iframeKey}
          ref={iframeRef}
          src={iframeSrc}
          title={title}
          onLoad={handleIframeLoad}
          className="w-full h-full border-none block bg-transparent"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-downloads"
        />
      </div>

      {/* ── PATHLOCK™ SECURITY GATE BLOCKING OVERLAY ── */}
      {isBlocked && (
        <div className="fixed inset-0 z-[100] bg-[#0B0C0E] overflow-y-auto flex flex-col items-center justify-center p-3 sm:p-6 text-white font-sans select-text">
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

          {/* Centered Modal Card: Compact & Responsive. Mobile: Transparent background without card box */}
          <main className="relative z-10 w-full max-w-[390px] sm:max-w-[420px] flex flex-col items-center my-auto py-4 sm:py-6">
            <section className="w-full box-border rounded-[24px] transition-all duration-300 flex flex-col items-center text-center p-3 sm:p-7 sm:bg-white/[0.05] sm:border sm:border-white/[0.12] sm:backdrop-blur-[28px] sm:shadow-[0_24px_64px_rgba(0,0,0,0.35)] bg-transparent border-transparent shadow-none backdrop-blur-none animate-in fade-in zoom-in-95 duration-200">
              {/* Shield Alert Icon Badge (Refined Size) */}
              <span className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-blue-600/[0.14] border border-[#608CFF]/[0.35] text-[#8DB0FF] flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/10">
                <ShieldAlert className="w-6 h-6 sm:w-7 sm:h-7" />
              </span>

              {/* Status Tag Pill */}
              <span className="inline-flex items-center gap-1.5 mt-4 sm:mt-5 h-7 px-3 rounded-full bg-blue-600/[0.14] border border-[#608CFF]/[0.35] text-[#A9C4FF] text-[11px] font-bold tracking-[0.05em] uppercase">
                <Lock className="w-3 h-3" />
                <span>{tr("OUT-OF-SCOPE ACCESS BLOCKED", "ACCÈS HORS PÉRIMÈTRE BLOQUÉ")}</span>
              </span>

              {/* Main Heading (Compact & Balanced) */}
              <h1 className="mt-3 sm:mt-4 text-xl sm:text-[23px] leading-tight font-bold tracking-tight text-white text-balance">
                {tr("Navigation restricted by the link creator", "Navigation restreinte par le créateur du lien")}
              </h1>

              {/* Link Name */}
              <p className="mt-2 text-sm font-semibold text-[#A9AFBA] max-w-xs truncate">
                {safeTitle}
              </p>

              {/* Description Part */}
              <div className="w-full mt-3 p-2.5 sm:p-3 rounded-xl bg-white/[0.04] border border-white/10 text-center">
                <p className="text-xs sm:text-[13px] text-[#D5D9E2] leading-relaxed break-words">
                  {descriptionText}
                </p>
              </div>

              {/* Authorized Perimeter Box */}
              <div className="w-full box-border mt-4 sm:mt-5 h-11 sm:h-12 px-3.5 flex items-center justify-center gap-2 rounded-xl bg-white/[0.04] border border-white/10">
                <span className="text-xs sm:text-sm text-[#A9AFBA]">{tr("Allowed perimeter", "Périmètre autorisé")}</span>
                <code className="font-mono text-xs sm:text-sm font-semibold text-[#A9C4FF] px-2 py-0.5 rounded-lg bg-black/30 border border-white/10">
                  /{authorizedPath}
                </code>
              </div>

              {/* Return Button */}
              <button
                type="button"
                onClick={handleRestore}
                className="w-full mt-3.5 h-11 sm:h-12 flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-500 active:scale-[0.99] text-white text-sm sm:text-[15px] font-semibold transition-all shadow-md shadow-blue-600/25 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{tr("Return to authorized page", "Revenir à la page autorisée")}</span>
              </button>

              {/* Divider Line */}
              <div className="w-full h-px mt-5 sm:mt-6 bg-white/10" />

              {/* Developer / Team Unlock Form */}
              {hasUnlock && (
                <div className="w-full mt-4 sm:mt-5 flex flex-col gap-3 text-left">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-white">
                      <Lock className="w-3.5 h-3.5 text-[#8DB0FF]" />
                      <span>{tr("Team / dev unlock", "Déverrouillage équipe / dev")}</span>
                    </span>
                    <span className="text-[11px] font-medium text-[#A9AFBA] whitespace-nowrap">
                      {tr("Full access", "Accès complet")}
                    </span>
                  </div>

                  <form onSubmit={handleDevUnlockSubmit} className="flex flex-col gap-2.5">
                    <div className="relative">
                      <label htmlFor="unlock-pass" className="sr-only">
                        {tr("Unlock password", "Mot de passe de déblocage")}
                      </label>
                      <input
                        id="unlock-pass"
                        type={showUnlockPassword ? "text" : "password"}
                        placeholder={tr("Unlock password…", "Mot de passe de déblocage…")}
                        value={unlockPasswordInput}
                        onChange={(e) => {
                          setUnlockPasswordInput(e.target.value);
                          if (unlockError) setUnlockError("");
                        }}
                        className="w-full h-10 sm:h-11 px-3 pr-10 rounded-[10px] bg-black/30 border border-white/[0.14] focus:border-blue-500 text-[#F5F6F8] placeholder:text-[#8A909C] text-xs sm:text-sm outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowUnlockPassword(!showUnlockPassword)}
                        aria-label={showUnlockPassword ? tr("Hide password", "Masquer le mot de passe") : tr("Show password", "Afficher le mot de passe")}
                        className="absolute right-1 top-1 w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center text-[#A9AFBA] hover:text-white transition-colors cursor-pointer"
                      >
                        {showUnlockPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    {unlockError && (
                      <p className="text-xs text-red-400 font-medium">
                        {unlockError}
                      </p>
                    )}

                    <button
                      type="submit"
                      className="w-full h-10 sm:h-11 rounded-[10px] border border-[#8DB0FF]/40 hover:bg-white/[0.06] text-[#A9C4FF] text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                    >
                      {tr("Unlock full access", "Déverrouiller l’accès complet")}
                    </button>
                  </form>
                </div>
              )}
            </section>

            {/* Footer */}
            <p className="mt-5 sm:mt-6 text-[11px] text-[#9096A3] text-center">
              {tr("Secured by LShorter Edge Gate • PathLock™ Engine", "Sécurisé par LShorter Edge Gate • PathLock™ Engine")}
            </p>
          </main>
        </div>
      )}
    </div>
  );
}

export default CloakedViewer;
