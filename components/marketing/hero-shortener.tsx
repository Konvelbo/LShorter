"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import QRCode from "qrcode";
import {
  Link2,
  ExternalLink,
  Clock,
  AlertCircle,
  Loader2,
  CornerDownLeft,
  QrCode,
  Download,
  Lock,
  Check,
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

const QR_COLOR_SWATCHES: Array<{
  id: string;
  label: string;
  hex: string;
  locked: boolean;
}> = [
  { id: "black", label: "Classic Black (Default)", hex: "#000000", locked: false },
  { id: "blue", label: "Electric Blue (Account required)", hex: "#0066FF", locked: true },
  { id: "indigo", label: "Royal Indigo (Account required)", hex: "#6366F1", locked: true },
  { id: "violet", label: "Deep Violet (Account required)", hex: "#8B5CF6", locked: true },
  { id: "emerald", label: "Emerald (Account required)", hex: "#10B981", locked: true },
];

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

/**
 * Isolated 1-second 24-hour countdown timer so ticking once per second
 * never triggers re-renders of the parent HeroShortener or Hero section.
 */
const HeroCountdownTimer = React.memo(function HeroCountdownTimer({
  slug,
  expiresAtMs,
  onExpire,
}: {
  slug: string;
  expiresAtMs: number;
  onExpire: (slug: string) => void;
}) {
  const [remainingMs, setRemainingMs] = useState<number>(() =>
    Math.max(0, expiresAtMs - Date.now())
  );

  useEffect(() => {
    const update = () => {
      const rem = expiresAtMs - Date.now();
      setRemainingMs(Math.max(0, rem));
      if (rem <= 0) {
        onExpire(slug);
      }
    };
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [slug, expiresAtMs, onExpire]);

  return (
    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-white/55 dark:bg-[#11131A]/70 text-[12.5px] sm:text-[13px] text-[#4338CA]/85 dark:text-[#C7D2FE]/85 select-none">
      <Clock className="w-3.5 h-3.5 text-[#6366F1]/90 dark:text-[#A5B4FC]/90 shrink-0" />
      <span>
        Expires in{" "}
        <strong className="font-mono font-semibold tabular-nums text-[#312E81] dark:text-[#E0E7FF]">
          {formatRemaining24h(remainingMs)}
        </strong>
      </span>
    </div>
  );
});

export function HeroShortener() {
  const router = useRouter();
  const [urlInput, setUrlInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPulseHighlighted, setIsPulseHighlighted] = useState(false);

  const [links, setLinks] = useState<ShortenedItem[]>([]);
  const [maxLinks, setMaxLinks] = useState(1);
  const [limitReached, setLimitReached] = useState(false);

  // QR Code hover popup state & generated PNG data URL
  const [isQrHovered, setIsQrHovered] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const qrCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Generate default black-on-white QR code PNG whenever activeLink changes
  useEffect(() => {
    if (!activeLink?.slug) {
      setQrDataUrl("");
      setIsQrHovered(false);
      return;
    }
    let cancelled = false;
    const targetShortUrl = `https://lsho.cc/${activeLink.slug}`;
    QRCode.toDataURL(targetShortUrl, {
      width: 360,
      margin: 2,
      errorCorrectionLevel: "M",
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url);
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl("");
      });
    return () => {
      cancelled = true;
    };
  }, [activeLink?.slug]);

  const handleQrMouseEnter = useCallback(() => {
    if (qrCloseTimeoutRef.current) {
      clearTimeout(qrCloseTimeoutRef.current);
      qrCloseTimeoutRef.current = null;
    }
    setIsQrHovered(true);
  }, []);

  const handleQrMouseLeave = useCallback(() => {
    qrCloseTimeoutRef.current = setTimeout(() => {
      setIsQrHovered(false);
    }, 180);
  }, []);

  useEffect(() => {
    return () => {
      if (qrCloseTimeoutRef.current) {
        clearTimeout(qrCloseTimeoutRef.current);
      }
    };
  }, []);

  const handleDownloadPng = useCallback(() => {
    if (!qrDataUrl || !activeLink?.slug) return;
    const anchor = document.createElement("a");
    anchor.href = qrDataUrl;
    anchor.download = `lsho-${activeLink.slug}-qr.png`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
  }, [qrDataUrl, activeLink?.slug]);

  const handleLockedQrAction = useCallback(() => {
    setIsQrHovered(false);
    router.push("/register?claim=1");
  }, [router]);

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
      setLinks([cached]);
      setLimitReached(true);
    }
    fetchGuestState(cached?.slug);
  }, [fetchGuestState]);

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

  const activeExpiresAtMs = useMemo(() => {
    if (!activeLink) return 0;
    return getExpirationMs(activeLink);
  }, [activeLink]);

  return (
    <div
      id="hero-shortener"
      className="w-full max-w-[740px] mx-auto scroll-mt-28"
    >
      {/* ── Clean Single-Surface Link Shortener Bar (strictly rounded-[10px]) ── */}
      <div
        className={`relative z-20 rounded-[10px] bg-white/95 dark:bg-[#11131A]/95 border shadow-[0_10px_30px_rgba(99,102,241,0.08)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.52)] transition-[border-color,box-shadow] duration-200 overflow-hidden ${
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

      {/* ── Top-to-Bottom Fade & Slide Shortened Link Row + Hover Scale + QR Hover Popup + 24-Hour Countdown + Signup Prompt ── */}
      <AnimatePresence mode="wait">
        {activeLink && (
          <motion.div
            key={activeLink.slug}
            initial={{ opacity: 0, y: -38 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{
              duration: 0.48,
              ease: [0.22, 1, 0.36, 1],
            }}
            aria-live="polite"
            className="relative z-30 mt-3.5 flex flex-col items-center will-change-transform"
          >
            {/* Minimalist Two-Bar Row with Frosted Glass Background Blur & Hover Scale */}
            <motion.div
              whileHover={{ scale: 1.018 }}
              transition={{ type: "spring", stiffness: 360, damping: 24 }}
              className="relative w-full border-l-2 border-r-2 border-[#6366F1]/60 dark:border-[#A5B4FC]/60 bg-white/55 dark:bg-[#11131A]/60 backdrop-blur-md shadow-[0_8px_24px_rgba(99,102,241,0.10)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.42)] px-4 py-3 flex items-center justify-between gap-4 text-left"
            >
              {/* Left: Shortened link + icon that redirects on click */}
              <a
                href={`/${encodeURIComponent(activeLink.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClicked}
                className="group inline-flex items-center gap-2 text-[15px] sm:text-[16px] font-mono font-semibold text-[#312E81]/95 dark:text-[#E0E7FF]/95 hover:text-[#4F46E5] dark:hover:text-white transition-all duration-200 hover:scale-[1.02] origin-left truncate"
              >
                <span className="truncate">lsho.cc/{activeLink.slug}</span>
                <ExternalLink className="w-4 h-4 shrink-0 text-[#6366F1]/85 dark:text-[#A5B4FC]/85 group-hover:text-[#4F46E5] dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* Right: Live click count text + QR Code hover trigger button */}
              <div className="flex items-center gap-3 shrink-0">
                <span className="font-mono text-[13.5px] sm:text-[14px] font-medium text-[#4338CA]/85 dark:text-[#C7D2FE]/90 tabular-nums">
                  {activeLink.clicksCount}{" "}
                  {activeLink.clicksCount === 1 ? "click" : "clicks"}
                </span>

                {/* QR Code Icon Trigger & Hover Popup */}
                <div
                  className="relative"
                  onMouseEnter={handleQrMouseEnter}
                  onMouseLeave={handleQrMouseLeave}
                >
                  <button
                    type="button"
                    aria-label="Preview QR Code"
                    aria-expanded={isQrHovered}
                    onClick={() => setIsQrHovered((prev) => !prev)}
                    className={`w-8 h-8 rounded-[8px] flex items-center justify-center border transition-all duration-150 cursor-pointer ${
                      isQrHovered
                        ? "bg-[#6366F1] text-white border-[#6366F1] shadow-[0_4px_14px_rgba(99,102,241,0.35)]"
                        : "bg-white/65 dark:bg-white/[0.08] border-[#6366F1]/30 dark:border-[#A5B4FC]/25 text-[#312E81] dark:text-[#E0E7FF] hover:bg-[#6366F1]/15 dark:hover:bg-white/[0.15]"
                    }`}
                  >
                    <QrCode className="w-4 h-4" />
                  </button>

                  {/* Hover QR Code Popup (strictly rounded-[10px], opens upwards so it never clips at the bottom of the screen) */}
                  <AnimatePresence>
                    {isQrHovered && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                        onMouseEnter={handleQrMouseEnter}
                        onMouseLeave={handleQrMouseLeave}
                        role="dialog"
                        aria-label="QR Code options"
                        className="absolute right-0 bottom-full mb-2.5 z-50 w-[236px] rounded-[10px] bg-white/95 dark:bg-[#11131A]/95 backdrop-blur-xl border border-[#E4E7EC] dark:border-white/15 p-3.5 shadow-[0_20px_48px_rgba(16,24,40,0.18)] dark:shadow-[0_22px_54px_rgba(0,0,0,0.75)] text-left after:content-[''] after:absolute after:top-full after:left-0 after:right-0 after:h-3"
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-[#E4E7EC] dark:border-white/10">
                          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#312E81] dark:text-[#C7D2FE]">
                            QR Code
                          </span>
                          <span className="font-mono text-[11px] text-[#667085] dark:text-zinc-400 truncate">
                            lsho.cc/{activeLink.slug}
                          </span>
                        </div>

                        {/* QR Code Image Preview */}
                        <div className="w-full aspect-square max-w-[152px] mx-auto rounded-[8px] bg-white p-2 border border-[#E4E7EC] dark:border-white/15 flex items-center justify-center">
                          {qrDataUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={qrDataUrl}
                              alt={`QR Code for lsho.cc/${activeLink.slug}`}
                              className="w-full h-full object-contain select-none"
                            />
                          ) : (
                            <Loader2 className="w-5 h-5 animate-spin text-[#6366F1]" />
                          )}
                        </div>

                        {/* Color Options (Black active by default, others locked with padlock) */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] font-medium text-[#475467] dark:text-zinc-400 mb-1.5">
                            <span>Color</span>
                            <span className="text-[10.5px] text-[#6366F1] dark:text-[#A5B4FC]">
                              Pro colors locked
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1.5">
                            {QR_COLOR_SWATCHES.map((swatch) => (
                              <button
                                key={swatch.id}
                                type="button"
                                title={swatch.label}
                                aria-label={swatch.label}
                                onClick={
                                  swatch.locked
                                    ? handleLockedQrAction
                                    : undefined
                                }
                                className={`relative w-7 h-7 rounded-[7px] flex items-center justify-center transition-transform cursor-pointer ${
                                  !swatch.locked
                                    ? "ring-2 ring-[#0066FF] ring-offset-2 ring-offset-white dark:ring-offset-[#11131A] scale-105"
                                    : "opacity-80 hover:opacity-100 hover:scale-105"
                                }`}
                                style={{ backgroundColor: swatch.hex }}
                              >
                                {swatch.locked ? (
                                  <Lock className="w-3 h-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]" />
                                ) : (
                                  <Check className="w-3.5 h-3.5 text-white" />
                                )}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Action Buttons: Download PNG + Locked GIF Button */}
                        <div className="mt-3.5 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleDownloadPng}
                            className="h-8 px-2.5 rounded-[8px] bg-[#0066FF] hover:bg-[#0052CC] text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 shrink-0" />
                            <span>PNG</span>
                          </button>

                          <button
                            type="button"
                            onClick={handleLockedQrAction}
                            title="Create a free account to export animated GIF QR codes"
                            className="h-8 px-2.5 rounded-[8px] bg-[#F2F4F7] dark:bg-white/[0.08] hover:bg-[#E4E7EC] dark:hover:bg-white/[0.14] border border-[#D0D5DD] dark:border-white/15 text-[#101828] dark:text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Lock className="w-3 h-3 text-[#6366F1] dark:text-[#A5B4FC] shrink-0" />
                            <span>GIF</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* Isolated 24-Hour Live Countdown Timer */}
            <HeroCountdownTimer
              slug={activeLink.slug}
              expiresAtMs={activeExpiresAtMs}
              onExpire={handleExpireLink}
            />

            {/* English Account Creation Prompt (at the red line position below the countdown) */}
            <p className="mt-2.5 text-center text-[13px] sm:text-[13.5px] text-[#312E81]/90 dark:text-[#C7D2FE]/90 leading-relaxed max-w-[580px]">
              <Link
                href="/register?claim=1"
                className="font-semibold text-[#0066FF] dark:text-[#5294FF] underline-offset-4 hover:underline"
              >
                Create your account
              </Link>{" "}
              to keep this link forever, customize its slug &amp; QR code, and
              track every click in real time.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HeroShortener;
