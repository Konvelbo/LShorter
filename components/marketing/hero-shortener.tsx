"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Link2,
  ExternalLink,
  Lock,
  Sparkles,
  Clock,
  X,
  AlertCircle,
  Loader2,
  CornerDownLeft,
} from "lucide-react";
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

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;
const HERO_STORAGE_KEY = "lshorter_hero_active_link_v1";

function formatRemaining24h(ms: number): string {
  const safeSec = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(safeSec / 3600);
  const minutes = Math.floor((safeSec % 3600) / 60);
  const seconds = safeSec % 60;
  const hh = String(hours).padStart(2, "0");
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${hh}h ${mm}m ${ss}s`;
}

function getExpirationMs(item: ShortenedItem): number {
  if (item.expiresAt) {
    const parsed = new Date(item.expiresAt).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }
  const created = item.createdAt
    ? new Date(item.createdAt).getTime()
    : Date.now();
  return (Number.isNaN(created) ? Date.now() : created) + TWENTY_FOUR_HOURS_MS;
}

function readStoredHeroLink(): ShortenedItem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HERO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ShortenedItem;
    if (!parsed || typeof parsed.slug !== "string" || !parsed.slug.trim()) {
      window.localStorage.removeItem(HERO_STORAGE_KEY);
      return null;
    }
    if (getExpirationMs(parsed) <= Date.now()) {
      window.localStorage.removeItem(HERO_STORAGE_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeStoredHeroLink(item: ShortenedItem | null): void {
  if (typeof window === "undefined") return;
  try {
    if (!item) {
      window.localStorage.removeItem(HERO_STORAGE_KEY);
    } else {
      window.localStorage.setItem(HERO_STORAGE_KEY, JSON.stringify(item));
    }
  } catch {
    // ignore storage quota errors
  }
}

export function HeroShortener() {
  const [urlInput, setUrlInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPulseHighlighted, setIsPulseHighlighted] = useState(false);

  const [links, setLinks] = useState<ShortenedItem[]>([]);
  const [maxLinks, setMaxLinks] = useState(1);
  const [limitReached, setLimitReached] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  const inputRef = useRef<HTMLInputElement>(null);
  const expiringSlugsRef = useRef<Set<string>>(new Set());

  // Keep only the single active Hero link (1-link limit)
  const orderedLinks = useMemo(() => {
    return [...links]
      .sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      )
      .slice(-1);
  }, [links]);

  const activeLink = orderedLinks[0] || null;

  // Delete an expired link on the server and remove it from the UI when the 24h timer hits zero
  const handleExpireLink = useCallback(async (slug: string) => {
    if (expiringSlugsRef.current.has(slug)) return;
    expiringSlugsRef.current.add(slug);

    writeStoredHeroLink(null);
    setLinks((prev) => prev.filter((item) => item.slug !== slug));
    setLimitReached(false);

    try {
      const res = await fetch(
        `/api/public/shorten?slug=${encodeURIComponent(slug)}`,
        {
          method: "DELETE",
          credentials: "same-origin",
          cache: "no-store",
        }
      );
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.success) {
          const serverLinks: ShortenedItem[] = Array.isArray(data.links)
            ? data.links
            : [];
          setLinks(serverLinks);
          writeStoredHeroLink(serverLinks[serverLinks.length - 1] || null);
          setMaxLinks(Number(data.maxLinks ?? 1));
          setLimitReached(Boolean(data.limitReached));
        }
      }
    } catch {
      // silent cleanup resilience
    } finally {
      expiringSlugsRef.current.delete(slug);
    }
  }, []);

  // Fetch current Hero link & live clicks from server
  const fetchGuestState = useCallback(async (hintSlug?: string) => {
    try {
      const stored = readStoredHeroLink();
      const slugToQuery = (hintSlug || stored?.slug || "").trim();
      const endpoint = slugToQuery
        ? `/api/public/shorten?slug=${encodeURIComponent(slugToQuery)}`
        : "/api/public/shorten";

      const res = await fetch(endpoint, {
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

      if (serverLinks.length > 0) {
        const latest = serverLinks[serverLinks.length - 1];
        writeStoredHeroLink(latest);
        setLinks(serverLinks);
        setMaxLinks(Number(data.maxLinks ?? 1));
        setLimitReached(
          Boolean(data.limitReached || serverLinks.length >= (data.maxLinks ?? 1))
        );
      } else {
        // Keep a freshly shortened local link if D1 is still propagating (< 15s old)
        const currentStored = readStoredHeroLink();
        const isVeryFresh =
          currentStored &&
          Date.now() - new Date(currentStored.createdAt || 0).getTime() < 15000;

        if (!isVeryFresh) {
          writeStoredHeroLink(null);
          setLinks([]);
          setMaxLinks(Number(data.maxLinks ?? 1));
          setLimitReached(Boolean(data.limitReached));
        }
      }
    } catch {
      // silent polling resilience
    }
  }, []);

  // Initial load of Hero link: hydrate immediately from localStorage, then sync live click count with D1
  useEffect(() => {
    const cached = readStoredHeroLink();
    if (cached) {
      setNowMs(Date.now());
      setLinks([cached]);
      setLimitReached(true);
    }
    fetchGuestState(cached?.slug);
  }, [fetchGuestState]);

  // Real-time 1-second countdown ticker + automatic deletion when timer reaches 00h 00m 00s
  useEffect(() => {
    if (!activeLink) return;

    setNowMs(Date.now());
    const timer = setInterval(() => {
      const currentNow = Date.now();
      setNowMs(currentNow);

      const expMs = getExpirationMs(activeLink);

      if (expMs - currentNow <= 0) {
        handleExpireLink(activeLink.slug);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeLink, handleExpireLink]);

  // Real-time 5-second click polling while a link exists and tab is visible
  useEffect(() => {
    if (links.length === 0) return;

    const interval = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        fetchGuestState(activeLink?.slug);
      }
    }, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchGuestState(activeLink?.slug);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [links.length, activeLink?.slug, fetchGuestState]);

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

    // Validate basic HTTP(S) URL syntax before triggering the limit modal
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
      setErrorMsg(
        "Please enter a valid website URL (for example, https://example.com)."
      );
      inputRef.current?.focus();
      return;
    }

    // Immediate client gate if already at 1 Hero link (server also enforces cookie + IP)
    if (limitReached || orderedLinks.length >= maxLinks) {
      setShowLimitModal(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const existingCached = readStoredHeroLink();
      const res = await fetch("/api/public/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          targetUrl: trimmed,
          existingSlug: activeLink?.slug || existingCached?.slug || undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 403 && data?.code === "GUEST_LIMIT_REACHED") {
        if (Array.isArray(data.links) && data.links.length > 0) {
          setLinks(data.links);
          writeStoredHeroLink(data.links[data.links.length - 1]);
        }
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

      const fallbackExpiresAt = new Date(
        Date.now() + TWENTY_FOUR_HOURS_MS
      ).toISOString();

      const rawLinks: ShortenedItem[] = Array.isArray(data.links)
        ? data.links
        : data.link
          ? [data.link]
          : [];
      const normalizedLinks = rawLinks.map((item) => ({
        ...item,
        expiresAt: item.expiresAt || fallbackExpiresAt,
      }));

      const latest = normalizedLinks[normalizedLinks.length - 1] || null;
      writeStoredHeroLink(latest);
      setNowMs(Date.now());
      setLinks(normalizedLinks);
      setMaxLinks(Number(data.maxLinks ?? 1));
      setLimitReached(Boolean(data.limitReached ?? normalizedLinks.length >= 1));
      setUrlInput("");
    } catch {
      setErrorMsg("Network error. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger rapid click-sync right after user clicks their newly generated short link
  const handleLinkClicked = () => {
    const slug = activeLink?.slug;
    setTimeout(() => fetchGuestState(slug), 1100);
    setTimeout(() => fetchGuestState(slug), 2800);
    setTimeout(() => fetchGuestState(slug), 5200);
  };

  const remainingMs = useMemo(() => {
    if (!activeLink) return 0;
    const expMs = getExpirationMs(activeLink);
    return Math.max(0, expMs - nowMs);
  }, [activeLink, nowMs]);

  return (
    <div
      id="hero-shortener"
      className="w-full max-w-[740px] mx-auto scroll-mt-28"
    >
      {/* ── Clean Single-Surface Link Shortener Bar (strictly rounded-[10px]) ── */}
      <div
        className={`relative z-20 rounded-[10px] bg-white/95 dark:bg-[#11131A]/95 backdrop-blur-md border shadow-[0_10px_30px_rgba(99,102,241,0.08)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.52)] transition-[border-color,box-shadow] duration-200 overflow-hidden ${
          isPulseHighlighted
            ? "border-[#0066FF] ring-2 ring-[#0066FF]/25"
            : errorMsg
              ? "border-red-500/70"
              : "border-[#D4D4D8]/90 dark:border-white/[0.14] focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/15"
        }`}
      >
        <form onSubmit={handleShorten} className="p-2">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="relative flex-1 flex items-center min-w-0 bg-transparent">
              <Link2 className="w-4 h-4 text-[#71717A] dark:text-zinc-400 ml-3.5 shrink-0 pointer-events-none" />
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
                placeholder="Paste a long URL to shorten..."
                aria-label="Paste a long URL to shorten"
                className="w-full h-11 sm:h-12 px-3 bg-transparent text-[15px] text-[#09090B] dark:text-white placeholder:text-[#71717A] dark:placeholder:text-zinc-500 outline-none border-0"
              />
              {urlInput && (
                <span
                  aria-hidden="true"
                  className="hidden md:inline-flex items-center gap-1 mr-2 px-1.5 py-0.5 rounded-[5px] border border-[#E4E7EC] dark:border-white/10 bg-[#F8F9FB] dark:bg-white/[0.04] text-[11px] text-[#71717A] dark:text-zinc-400 shrink-0 select-none"
                >
                  <CornerDownLeft className="w-2.5 h-2.5" />
                  <span>Enter</span>
                </span>
              )}
            </div>

            <WaveRevealButton
              type="submit"
              variant="primary"
              size="lg"
              wave
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
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="mt-2.5 flex items-center justify-center gap-2 text-[13px] font-medium text-red-600 dark:text-red-400"
            role="alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Soft Theme-Harmonious Two-Bar Shortened Link Row with Frosted Backdrop Blur + 24-Hour Live Countdown Timer ── */}
      <AnimatePresence initial={false}>
        {activeLink && (
          <motion.div
            key={activeLink.slug}
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{
              duration: 0.45,
              ease: [0.22, 1, 0.36, 1],
            }}
            aria-live="polite"
            className="relative z-10 mt-3.5 flex flex-col items-center"
          >
            {/* Minimalist Two-Bar Row with Frosted Glass Background Blur */}
            <div className="w-full border-l-2 border-r-2 border-[#6366F1]/60 dark:border-[#A5B4FC]/60 bg-white/55 dark:bg-[#11131A]/60 backdrop-blur-md shadow-[0_8px_24px_rgba(99,102,241,0.10)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.42)] px-4 py-3 flex items-center justify-between gap-4 text-left">
              {/* Left: Shortened link + icon that redirects on click */}
              <a
                href={`/${encodeURIComponent(activeLink.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClicked}
                className="group inline-flex items-center gap-2 text-[15px] sm:text-[16px] font-mono font-semibold text-[#312E81]/95 dark:text-[#E0E7FF]/95 hover:text-[#4F46E5] dark:hover:text-white transition-colors truncate"
              >
                <span className="truncate">lsho.cc/{activeLink.slug}</span>
                <ExternalLink className="w-4 h-4 shrink-0 text-[#6366F1]/85 dark:text-[#A5B4FC]/85 group-hover:text-[#4F46E5] dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* Right: Live click count text (0 clicks, 1 click, 2 clicks...) */}
              <span className="shrink-0 font-mono text-[13.5px] sm:text-[14px] font-medium text-[#4338CA]/85 dark:text-[#C7D2FE]/90 tabular-nums">
                {activeLink.clicksCount}{" "}
                {activeLink.clicksCount === 1 ? "click" : "clicks"}
              </span>
            </div>

            {/* 24-Hour Live Countdown Timer (decrements every second; auto-deletes link at 00h 00m 00s) */}
            <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-white/40 dark:bg-[#11131A]/45 backdrop-blur-md text-[12.5px] sm:text-[13px] text-[#4338CA]/85 dark:text-[#C7D2FE]/85 select-none">
              <Clock className="w-3.5 h-3.5 text-[#6366F1]/90 dark:text-[#A5B4FC]/90 shrink-0" />
              <span>
                Expires in{" "}
                <strong className="font-mono font-semibold tabular-nums text-[#312E81] dark:text-[#E0E7FF]">
                  {formatRemaining24h(remainingMs)}
                </strong>
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Mandatory 2nd-Link Guest Limit Modal (strictly rounded-[10px]) ── */}
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
                <span>GUEST QUOTA // 1 OF 1 USED</span>
              </div>

              <h3
                id="guest-limit-modal-title"
                className="text-[20px] font-bold tracking-[-0.025em] text-[#101828] dark:text-white"
              >
                You&apos;ve reached the 1-link guest limit
              </h3>
              <p className="mt-2 text-[14px] text-[#475467] dark:text-zinc-400 leading-relaxed">
                {activeLink ? (
                  <>
                    Create a free account to continue shortening links. Your{" "}
                    <strong className="text-[#101828] dark:text-white">
                      existing guest link
                    </strong>{" "}
                    and its clicks will automatically save into your dashboard
                    and{" "}
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

              {activeLink && (
                <div className="mt-4 rounded-[10px] border border-[#E4E7EC] dark:border-white/10 bg-[#F7F8FA] dark:bg-white/[0.03] divide-y divide-[#E4E7EC] dark:divide-white/[0.08]">
                  <div className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-[13px]">
                    <div className="min-w-0">
                      <div className="font-semibold text-[#0066FF] dark:text-[#5294FF] truncate">
                        lsho.cc/{activeLink.slug}
                      </div>
                      <div className="text-[11.5px] text-[#667085] dark:text-zinc-400 truncate font-mono">
                        {activeLink.targetUrl}
                      </div>
                    </div>
                    <span className="shrink-0 px-2 py-0.5 rounded-[6px] bg-white dark:bg-white/[0.06] border border-[#E4E7EC] dark:border-white/10 font-mono text-[11.5px] font-semibold text-[#344054] dark:text-zinc-200 tabular-nums">
                      {activeLink.clicksCount}{" "}
                      {activeLink.clicksCount === 1 ? "click" : "clicks"}
                    </span>
                  </div>
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
                  {activeLink
                    ? "Save my link & continue free"
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
                    Sign in {activeLink ? "to save it" : ""}
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
