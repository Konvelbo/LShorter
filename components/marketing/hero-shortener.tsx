"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import {
  Link2,
  ExternalLink,
  Clock,
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
  const router = useRouter();
  const [urlInput, setUrlInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPulseHighlighted, setIsPulseHighlighted] = useState(false);

  const [links, setLinks] = useState<ShortenedItem[]>([]);
  const [maxLinks, setMaxLinks] = useState(1);
  const [limitReached, setLimitReached] = useState(false);
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

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // On the 2nd click (when 1 link has already been shortened), redirect directly to account creation
    if (limitReached || orderedLinks.length >= maxLinks) {
      router.push("/register?claim=1");
      return;
    }

    const trimmed = urlInput.trim();
    if (!trimmed) {
      setErrorMsg("Please paste a website URL to shorten.");
      inputRef.current?.focus();
      return;
    }

    // Validate basic HTTP(S) URL syntax
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
        router.push("/register?claim=1");
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
    </div>
  );
}

export default HeroShortener;
