"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import { motion, AnimatePresence } from "motion/react";
import {
  Link2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Lock,
  Sparkles,
  Clock,
  BarChart3,
  Globe2,
  Smartphone,
  ShieldCheck,
  X,
  Download,
  AlertCircle,
  Loader2,
  LayoutDashboard,
  CornerDownLeft,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";

export interface ShortenedItem {
  linkId: string;
  slug: string;
  shortUrl: string;
  targetUrl: string;
  clicksCount: number;
  expiresAt: string | null;
  createdAt: string;
  isGuest: boolean;
}

const SAMPLE_DEMO_URL =
  "https://stripe.com/docs/webhooks/quickstart?utm_source=lshorter-demo";

function AnimatedClickCounter({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] bg-[#0066FF]/[0.08] dark:bg-[#0066FF]/[0.16] border border-[#0066FF]/25 text-[#0066FF] dark:text-[#5294FF] text-[12px] font-mono font-semibold tabular-nums">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
      </span>
      <span className="relative inline-flex overflow-hidden h-[17px] leading-[17px]">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={count}
            initial={{ y: 14, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -14, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="inline-block font-bold"
          >
            {count.toLocaleString()}
          </motion.span>
        </AnimatePresence>
      </span>
      <span>{count === 1 ? "click" : "clicks"}</span>
    </span>
  );
}

export function HeroShortener() {
  const { data: session, status } = useSession();
  const isAuthenticated =
    status === "authenticated" &&
    Boolean(session?.user) &&
    !(session?.user as { userNotFound?: boolean })?.userNotFound;

  const [urlInput, setUrlInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPulseHighlighted, setIsPulseHighlighted] = useState(false);

  const [links, setLinks] = useState<ShortenedItem[]>([]);
  const [activeSlug, setActiveSlug] = useState<string | null>(null);
  const [usedCount, setUsedCount] = useState(0);
  const [maxLinks, setMaxLinks] = useState(2);
  const [limitReached, setLimitReached] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  const activeLink =
    links.find((l) => l.slug === activeSlug) || links[0] || null;

  // Fetch current guest links & live clicks from server
  const fetchGuestState = useCallback(async () => {
    if (isAuthenticated) return;
    try {
      const res = await fetch("/api/public/shorten", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
      });
      if (!res.ok) return;
      const data = await res.json().catch(() => null);
      if (!data?.success) return;

      const serverLinks: ShortenedItem[] = Array.isArray(data.links)
        ? data.links
        : [];
      setLinks(serverLinks);
      setUsedCount(Number(data.usedCount ?? serverLinks.length));
      setMaxLinks(Number(data.maxLinks ?? 2));
      setLimitReached(Boolean(data.limitReached));
      setActiveSlug((prev) => {
        if (prev && serverLinks.some((l) => l.slug === prev)) return prev;
        return serverLinks[0]?.slug ?? null;
      });
    } catch {
      // silent polling resilience
    }
  }, [isAuthenticated]);

  // Initial load of guest links (persists across refreshes via httpOnly cookie)
  useEffect(() => {
    if (!isAuthenticated) {
      fetchGuestState();
    }
  }, [isAuthenticated, fetchGuestState]);

  // Real-time 5-second click polling while guest links exist and tab is visible
  useEffect(() => {
    if (isAuthenticated || links.length === 0) return;

    const interval = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        fetchGuestState();
      }
    }, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchGuestState();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [isAuthenticated, links.length, fetchGuestState]);

  // Listen for Navbar / Final CTA focus events
  useEffect(() => {
    const handleFocusEvent = () => {
      setTimeout(() => {
        inputRef.current?.focus();
        setIsPulseHighlighted(true);
        setTimeout(() => setIsPulseHighlighted(false), 1400);
      }, 220);
    };
    window.addEventListener("lshorter_focus_shortener", handleFocusEvent);
    return () => {
      window.removeEventListener("lshorter_focus_shortener", handleFocusEvent);
    };
  }, []);

  // Generate QR preview data URL when toggled
  useEffect(() => {
    if (!showQr || !activeLink) {
      setQrDataUrl(null);
      return;
    }
    let cancelled = false;
    QRCode.toDataURL(activeLink.shortUrl, {
      width: 240,
      margin: 2,
      color: { dark: "#09090B", light: "#FFFFFF" },
      errorCorrectionLevel: "M",
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [showQr, activeLink]);

  // Close limit modal on Escape
  useEffect(() => {
    if (!showLimitModal) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowLimitModal(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showLimitModal]);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const trimmed = urlInput.trim();
    if (!trimmed) {
      setErrorMsg("Please paste a website URL to shorten.");
      inputRef.current?.focus();
      return;
    }

    // Validate basic HTTP(S) URL syntax before triggering the guest limit modal
    const normalizedCandidate = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : /^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?#].*)?$/.test(trimmed)
      ? `https://${trimmed}`
      : "";
    let hasValidUrl = false;
    if (normalizedCandidate) {
      try {
        const parsed = new URL(normalizedCandidate);
        hasValidUrl =
          (parsed.protocol === "http:" || parsed.protocol === "https:") &&
          parsed.hostname.includes(".");
      } catch {
        hasValidUrl = false;
      }
    }
    if (!hasValidUrl) {
      setErrorMsg("Please enter a valid website URL (for example, https://example.com).");
      inputRef.current?.focus();
      return;
    }

    // Immediate client gate if already at 2 guest links (server also enforces cookie + IP)
    if (!isAuthenticated && limitReached) {
      setShowLimitModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/public/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ targetUrl: trimmed }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 403 && data?.code === "GUEST_LIMIT_REACHED") {
        if (Array.isArray(data.links)) setLinks(data.links);
        setUsedCount(Number(data.usedCount ?? maxLinks));
        setLimitReached(true);
        setShowLimitModal(true);
        return;
      }

      if (!res.ok || !data?.success) {
        setErrorMsg(
          data?.error ||
            "Could not shorten this URL. Please check the address and try again."
        );
        return;
      }

      if (data.authenticated && data.link) {
        const created: ShortenedItem = data.link;
        setLinks((prev) =>
          [created, ...prev.filter((p) => p.slug !== created.slug)].slice(0, 5)
        );
        setActiveSlug(created.slug);
        setUrlInput("");
        setShowQr(false);
      } else {
        const serverLinks: ShortenedItem[] = Array.isArray(data.links)
          ? data.links
          : data.link
            ? [data.link]
            : [];
        setLinks(serverLinks);
        setActiveSlug(data.link?.slug || serverLinks[0]?.slug || null);
        setUsedCount(Number(data.usedCount ?? serverLinks.length));
        setMaxLinks(Number(data.maxLinks ?? 2));
        setLimitReached(Boolean(data.limitReached));
        setUrlInput("");
        setShowQr(false);
      }
    } catch {
      setErrorMsg("Network error. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopy = async (link: ShortenedItem) => {
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setCopiedSlug(link.slug);
      setTimeout(
        () => setCopiedSlug((prev) => (prev === link.slug ? null : prev)),
        2000
      );
    } catch {}
  };

  const handleTryExample = () => {
    setErrorMsg(null);
    setUrlInput(SAMPLE_DEMO_URL);
    inputRef.current?.focus();
  };

  // Trigger rapid click-sync right after user clicks their newly generated short link
  const handleLinkClicked = () => {
    if (isAuthenticated) return;
    setTimeout(() => fetchGuestState(), 1100);
    setTimeout(() => fetchGuestState(), 2800);
    setTimeout(() => fetchGuestState(), 5200);
  };

  const remainingGuest = Math.max(0, maxLinks - usedCount);

  return (
    <div id="hero-shortener" className="w-full max-w-[760px] mx-auto scroll-mt-28">
      {/* ── Precision Command Console Shell (strictly rounded-[10px]) ── */}
      <div
        className={`relative rounded-[10px] bg-white dark:bg-[#0E0F13] border transition-all duration-300 shadow-[0_18px_48px_rgba(16,24,40,0.07)] dark:shadow-[0_24px_64px_rgba(0,0,0,0.65)] overflow-hidden ${
          isPulseHighlighted
            ? "border-[#0066FF] ring-4 ring-[#0066FF]/20"
            : errorMsg
              ? "border-red-500/70 ring-2 ring-red-500/15"
              : "border-[#D0D5DD] dark:border-white/14 focus-within:border-[#0066FF] focus-within:ring-4 focus-within:ring-[#0066FF]/12"
        }`}
      >
        {/* Top Console Instrument Bar */}
        <div className="px-4 py-2 bg-[#F7F8FA] dark:bg-[#13141A] border-b border-[#E4E7EC] dark:border-white/[0.08] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
          <div className="flex items-center gap-2 text-[#475467] dark:text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
            <span className="font-semibold text-[#101828] dark:text-zinc-200 tracking-wider uppercase">
              EDGE CONSOLE
            </span>
            <span className="text-[#D0D5DD] dark:text-zinc-700">/</span>
            <span className="text-[#0066FF] dark:text-[#5294FF] font-semibold">
              lsho.cc/••••••
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!urlInput && (
              <button
                type="button"
                onClick={handleTryExample}
                className="text-[11px] font-mono font-semibold text-[#0066FF] dark:text-[#5294FF] hover:underline cursor-pointer"
              >
                Try sample URL ↗
              </button>
            )}
            <span className="hidden sm:inline text-[#667085] dark:text-zinc-500 tabular-nums">
              {isAuthenticated
                ? "ACCOUNT // PERMANENT"
                : limitReached
                  ? "GUEST // 2 OF 2 USED"
                  : `GUEST // ${remainingGuest} FREE LEFT`}
            </span>
          </div>
        </div>

        {/* Form Input Area */}
        <form onSubmit={handleShorten} className="p-2 sm:p-2.5 bg-white dark:bg-[#0E0F13]">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 flex items-center min-w-0 bg-transparent">
              <Link2 className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] ml-3 shrink-0 pointer-events-none" />
              <input
                ref={inputRef}
                type="text"
                inputMode="url"
                autoComplete="off"
                spellCheck={false}
                value={urlInput}
                onChange={(e) => {
                  setUrlInput(e.target.value);
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Paste a long URL to shorten instantly..."
                aria-label="Paste a long URL to shorten"
                className="w-full h-11 sm:h-12 px-3 bg-transparent text-[14.5px] sm:text-[15px] text-[#101828] dark:text-white placeholder:text-[#98A2B3] dark:placeholder:text-zinc-500 outline-none border-0"
              />
              <span
                aria-hidden="true"
                className="hidden md:inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 rounded-[4px] border border-[#E4E7EC] dark:border-white/10 bg-[#F7F8FA] dark:bg-white/[0.04] font-mono text-[10.5px] text-[#667085] dark:text-zinc-500 shrink-0 select-none"
              >
                {urlInput ? (
                  <>
                    <CornerDownLeft className="w-2.5 h-2.5" />
                    <span>Enter</span>
                  </>
                ) : (
                  <span>⌘V</span>
                )}
              </span>
            </div>

            <WaveRevealButton
              type="submit"
              variant="primary"
              size="lg"
              disabled={isSubmitting}
              showArrow={!isSubmitting}
              className="sm:shrink-0 h-11 sm:h-12 px-6"
              icon={
                isSubmitting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : undefined
              }
            >
              {isSubmitting ? "Shortening..." : "Shorten"}
            </WaveRevealButton>
          </div>
        </form>
      </div>

      {/* Inline Validation Error */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mt-2.5 flex items-center justify-center gap-2 text-[13px] font-medium text-red-600 dark:text-red-400"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Reassuring Micro-copy Under Input */}
      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[12px] text-[#667085] dark:text-zinc-400 font-mono">
        {isAuthenticated ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Signed in — links save permanently to your workspace</span>
          </span>
        ) : (
          <>
            <span>Free · No signup required</span>
            <span className="hidden sm:inline text-[#D0D5DD] dark:text-zinc-700" aria-hidden="true">
              /
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#5294FF]" />
              <span>3-day guest TTL</span>
            </span>
            <span className="hidden sm:inline text-[#D0D5DD] dark:text-zinc-700" aria-hidden="true">
              /
            </span>
            <span className="font-semibold text-[#101828] dark:text-zinc-200">
              {limitReached
                ? "2 / 2 guest links used"
                : `${remainingGuest} free ${remainingGuest === 1 ? "link" : "links"} left`}
            </span>
          </>
        )}
      </div>

      {/* ── Live Result Card (Expands Smoothly After Shortening) ── */}
      <AnimatePresence mode="wait">
        {activeLink && (
          <motion.div
            key="shortener-result-card"
            initial={{ opacity: 0, y: 12, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.985 }}
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
            className="mt-5 rounded-[10px] bg-white dark:bg-[#0E0F13] border border-[#E4E7EC] dark:border-white/14 shadow-[0_18px_48px_rgba(16,24,40,0.08)] dark:shadow-[0_24px_60px_rgba(0,0,0,0.62)] overflow-hidden text-left"
          >
            {/* Optional tab switcher when 2 links exist */}
            {links.length > 1 && (
              <div className="flex items-center justify-between gap-2 px-4 py-2 bg-[#F7F8FA] dark:bg-white/[0.03] border-b border-[#E4E7EC] dark:border-white/[0.08]">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#667085] dark:text-zinc-400">
                  Recent links ({links.length})
                </span>
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {links.map((item) => {
                    const isSelected = item.slug === activeLink.slug;
                    return (
                      <button
                        key={item.slug}
                        type="button"
                        onClick={() => {
                          setActiveSlug(item.slug);
                          setShowQr(false);
                        }}
                        className={`px-2.5 py-1 rounded-[6px] font-mono text-[11.5px] font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          isSelected
                            ? "bg-[#0066FF] text-white"
                            : "bg-white dark:bg-white/[0.06] text-[#475467] dark:text-zinc-300 border border-[#E4E7EC] dark:border-white/10 hover:border-[#0066FF]/50"
                        }`}
                      >
                        /{item.slug} · {item.clicksCount}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Top Row: Short Link + Copy + QR + Live Click Counter */}
            <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <a
                    href={`/${encodeURIComponent(activeLink.slug)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleLinkClicked}
                    className="inline-flex items-center gap-1.5 text-[17px] sm:text-[18px] font-bold tracking-[-0.02em] text-[#0066FF] dark:text-[#5294FF] hover:underline break-all"
                  >
                    <span>lsho.cc/{activeLink.slug}</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>

                  <AnimatedClickCounter count={activeLink.clicksCount} />
                </div>

                <p className="mt-1.5 text-[12.5px] text-[#667085] dark:text-zinc-400 truncate max-w-full">
                  Redirects to{" "}
                  <span className="text-[#344054] dark:text-zinc-300 font-medium font-mono text-[12px]">
                    {activeLink.targetUrl}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCopy(activeLink)}
                  className={`h-9 px-3.5 rounded-[8px] inline-flex items-center gap-1.5 text-[13px] font-semibold border transition-all cursor-pointer ${
                    copiedSlug === activeLink.slug
                      ? "bg-emerald-500/10 border-emerald-500/40 text-emerald-600 dark:text-emerald-400"
                      : "bg-[#F7F8FA] dark:bg-white/[0.06] border-[#D0D5DD] dark:border-white/14 text-[#101828] dark:text-white hover:border-[#0066FF] hover:text-[#0066FF] dark:hover:text-[#5294FF]"
                  }`}
                >
                  {copiedSlug === activeLink.slug ? (
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

                <button
                  type="button"
                  onClick={() => setShowQr((v) => !v)}
                  aria-label="Toggle QR code preview"
                  className={`h-9 px-3 rounded-[8px] inline-flex items-center gap-1.5 text-[13px] font-medium border transition-colors cursor-pointer ${
                    showQr
                      ? "bg-[#0066FF]/10 border-[#0066FF]/40 text-[#0066FF] dark:text-[#5294FF]"
                      : "bg-[#F7F8FA] dark:bg-white/[0.06] border-[#D0D5DD] dark:border-white/14 text-[#344054] dark:text-zinc-300 hover:border-[#0066FF]/50"
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>QR</span>
                </button>
              </div>
            </div>

            {/* Inline QR Code Drawer */}
            <AnimatePresence>
              {showQr && qrDataUrl && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22 }}
                  className="overflow-hidden border-t border-[#E4E7EC] dark:border-white/[0.08] bg-[#F7F8FA] dark:bg-white/[0.02]"
                >
                  <div className="p-4 flex flex-col sm:flex-row items-center gap-4">
                    <div className="p-2 rounded-[10px] bg-white border border-[#E4E7EC] shadow-xs shrink-0">
                      <img
                        src={qrDataUrl}
                        alt={`QR code for ${activeLink.shortUrl}`}
                        className="w-28 h-28 block"
                      />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <div className="text-[13.5px] font-semibold text-[#101828] dark:text-white">
                        Instant QR Code for lsho.cc/{activeLink.slug}
                      </div>
                      <p className="text-[12.5px] text-[#667085] dark:text-zinc-400 mt-0.5">
                        Scan with your phone to test live click tracking right now — the counter above updates automatically.
                      </p>
                      <a
                        href={qrDataUrl}
                        download={`lsho-${activeLink.slug}-qr.png`}
                        className="mt-2.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-[#0066FF] dark:text-[#5294FF] hover:underline"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Download PNG
                      </a>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom Conversion Banner: Locked Analytics Teaser + Keep Forever CTA */}
            {!isAuthenticated ? (
              <div className="px-4 py-3.5 sm:px-5 sm:py-4 bg-[#F7F8FA] dark:bg-[#13141A] border-t border-[#E4E7EC] dark:border-white/[0.08] flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3 min-w-0">
                  <span className="mt-0.5 text-[#0066FF] dark:text-[#5294FF] shrink-0">
                    <Lock className="w-4 h-4" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-[#101828] dark:text-white">
                        {activeLink.clicksCount === 0
                          ? "0 clicks so far — click your link to watch it update live"
                          : `${activeLink.clicksCount} live ${activeLink.clicksCount === 1 ? "click" : "clicks"} recorded — detailed analytics locked`}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-[#475467] dark:text-zinc-400 font-mono">
                      <span className="inline-flex items-center gap-1">
                        <Globe2 className="w-3.5 h-3.5 text-[#0066FF]/80" />
                        <span className="blur-[2.5px] select-none">Paris, FR</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5 text-[#0066FF]/80" />
                        <span className="blur-[2.5px] select-none">iOS · Safari</span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <BarChart3 className="w-3.5 h-3.5 text-[#0066FF]/80" />
                        <span>Expires in 3 days unless claimed</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-stretch md:items-end gap-1 shrink-0">
                  <WaveRevealButton
                    href="/register?claim=1"
                    variant="primary"
                    size="sm"
                    icon={<Sparkles className="w-3.5 h-3.5" />}
                  >
                    Keep this link forever &amp; unlock analytics
                  </WaveRevealButton>
                  <span className="text-[11px] font-mono text-[#667085] dark:text-zinc-400 text-center md:text-right">
                    Free plan · 10,000 clicks/mo · No credit card
                  </span>
                </div>
              </div>
            ) : (
              <div className="px-4 py-3 sm:px-5 bg-emerald-500/[0.06] dark:bg-emerald-500/[0.10] border-t border-emerald-500/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <span className="text-[13px] font-medium text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  Saved permanently to your LShorter workspace.
                </span>
                <WaveRevealButton
                  href="/dashboard/links"
                  variant="outline"
                  size="sm"
                  icon={<LayoutDashboard className="w-3.5 h-3.5" />}
                >
                  View analytics in dashboard
                </WaveRevealButton>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mandatory 3rd-Link Guest Limit Modal (strictly rounded-[10px]) ── */}
      <AnimatePresence>
        {showLimitModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10050] flex items-center justify-center p-4 bg-black/60 dark:bg-black/75 backdrop-blur-sm"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget) setShowLimitModal(false);
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="guest-limit-modal-title"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-[480px] rounded-[10px] bg-white dark:bg-[#111216] border border-[#E4E7EC] dark:border-white/15 p-6 sm:p-7 shadow-[0_24px_64px_rgba(0,0,0,0.35)] text-left"
            >
              <button
                type="button"
                onClick={() => setShowLimitModal(false)}
                aria-label="Close modal"
                className="absolute right-4 top-4 w-8 h-8 rounded-[8px] flex items-center justify-center text-[#667085] dark:text-zinc-400 hover:text-[#101828] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.08] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.14em] text-[#0066FF] dark:text-[#5294FF] mb-3">
                <Lock className="w-3.5 h-3.5" />
                <span>GUEST QUOTA // 2 OF 2 USED</span>
              </div>

              <h3
                id="guest-limit-modal-title"
                className="text-[20px] font-bold tracking-[-0.025em] text-[#101828] dark:text-white"
              >
                You&apos;ve reached the 2-link guest limit
              </h3>
              <p className="mt-2 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed">
                {links.length > 0 ? (
                  <>
                    Create a free account to continue shortening links. Your{" "}
                    <strong className="text-[#101828] dark:text-white">
                      {links.length} existing guest{" "}
                      {links.length === 1 ? "link" : "links"}
                    </strong>{" "}
                    and {links.length === 1 ? "its" : "their"} clicks will
                    automatically transfer into your dashboard and{" "}
                    <strong className="text-[#0066FF] dark:text-[#5294FF]">
                      never expire
                    </strong>
                    .
                  </>
                ) : (
                  <>
                    Create a free account to continue shortening permanent links
                    with live analytics, PathLock™ perimeter rules, and custom
                    domains that{" "}
                    <strong className="text-[#0066FF] dark:text-[#5294FF]">
                      never expire
                    </strong>
                    .
                  </>
                )}
              </p>

              {links.length > 0 && (
                <div className="mt-4 rounded-[10px] border border-[#E4E7EC] dark:border-white/10 bg-[#F7F8FA] dark:bg-white/[0.03] divide-y divide-[#E4E7EC] dark:divide-white/[0.08]">
                  {links.slice(0, 2).map((item) => (
                    <div
                      key={item.slug}
                      className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-[13px]"
                    >
                      <div className="min-w-0">
                        <div className="font-semibold text-[#0066FF] dark:text-[#5294FF] truncate">
                          lsho.cc/{item.slug}
                        </div>
                        <div className="text-[11.5px] text-[#667085] dark:text-zinc-400 truncate font-mono">
                          {item.targetUrl}
                        </div>
                      </div>
                      <span className="shrink-0 px-2 py-0.5 rounded-[6px] bg-white dark:bg-white/[0.06] border border-[#E4E7EC] dark:border-white/10 font-mono text-[11.5px] font-semibold text-[#344054] dark:text-zinc-200 tabular-nums">
                        {item.clicksCount}{" "}
                        {item.clicksCount === 1 ? "click" : "clicks"}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex flex-col gap-2.5">
                <WaveRevealButton
                  href="/register?claim=1"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  icon={<Sparkles className="w-4 h-4" />}
                >
                  {links.length > 0
                    ? "Claim my links & continue free"
                    : "Create free account & continue"}
                </WaveRevealButton>
                <div className="text-center font-mono text-[11.5px] text-[#667085] dark:text-zinc-400">
                  Free plan: 50 permanent links · 10,000 clicks/mo · No credit card
                </div>
                <div className="text-center text-[12.5px] text-[#475467] dark:text-zinc-400 pt-1">
                  Already have an account?{" "}
                  <Link
                    href="/login?claim=1"
                    className="font-semibold text-[#0066FF] dark:text-[#5294FF] hover:underline"
                  >
                    Sign in {links.length > 0 ? "to claim them" : ""}
                  </Link>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HeroShortener;
