"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
  Link2,
  ExternalLink,
  Lock,
  Sparkles,
  Clock,
  ShieldCheck,
  X,
  AlertCircle,
  Loader2,
  CornerDownLeft,
  Play,
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
  const [usedCount, setUsedCount] = useState(0);
  const [maxLinks, setMaxLinks] = useState(2);
  const [limitReached, setLimitReached] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  // Order links chronologically (oldest first: 1st shortened link on top, 2nd link cascades below it)
  const orderedLinks = useMemo(() => {
    return [...links]
      .sort(
        (a, b) =>
          new Date(a.createdAt || 0).getTime() -
          new Date(b.createdAt || 0).getTime()
      )
      .slice(-2);
  }, [links]);

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
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
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
      setErrorMsg(
        "Please enter a valid website URL (for example, https://example.com)."
      );
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
          [...prev.filter((p) => p.slug !== created.slug), created].slice(-2)
        );
        setUrlInput("");
      } else {
        const serverLinks: ShortenedItem[] = Array.isArray(data.links)
          ? data.links
          : data.link
            ? [data.link]
            : [];
        setLinks(serverLinks);
        setUsedCount(Number(data.usedCount ?? serverLinks.length));
        setMaxLinks(Number(data.maxLinks ?? 2));
        setLimitReached(Boolean(data.limitReached));
        setUrlInput("");
      }
    } catch {
      setErrorMsg("Network error. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
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
    <div
      id="hero-shortener"
      className="w-full max-w-[740px] mx-auto scroll-mt-28"
    >
      {/* ── Clean Single-Surface Link Shortener Bar (strictly rounded-[10px], without Try sample) ── */}
      <div
        className={`relative z-20 rounded-[10px] bg-white dark:bg-[#111318] border shadow-[0_10px_30px_rgba(16,24,40,0.06)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.52)] transition-[border-color,box-shadow] duration-200 overflow-hidden ${
          isPulseHighlighted
            ? "border-[#0066FF] ring-2 ring-[#0066FF]/25"
            : errorMsg
              ? "border-red-500/70"
              : "border-[#D4D4D8] dark:border-white/[0.14] focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/15"
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

      {/* ── Minimalist Cascading Shortened Link Rows (NO card, ONLY left & right vertical bars) ── */}
      {orderedLinks.length > 0 && (
        <div
          aria-live="polite"
          className="relative z-10 mt-3.5 flex flex-col gap-2.5"
        >
          <AnimatePresence initial={false}>
            {orderedLinks.map((item, idx) => (
              <motion.div
                key={item.slug}
                initial={{ opacity: 0, y: -24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{
                  duration: 0.45,
                  ease: [0.22, 1, 0.36, 1],
                }}
                style={{ zIndex: 10 - idx }}
                className="w-full border-l-2 border-r-2 border-black dark:border-white px-4 py-2.5 flex items-center justify-between gap-4 text-left"
              >
                {/* Left: Shortened link + icon that redirects on click */}
                <a
                  href={`/${encodeURIComponent(item.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleLinkClicked}
                  className="group inline-flex items-center gap-2 text-[15px] sm:text-[16px] font-mono font-semibold text-[#09090B] dark:text-white hover:text-[#0066FF] dark:hover:text-[#5294FF] transition-colors truncate"
                >
                  <span className="truncate">lsho.cc/{item.slug}</span>
                  <ExternalLink className="w-4 h-4 shrink-0 text-[#09090B]/70 dark:text-white/75 group-hover:text-[#0066FF] dark:group-hover:text-[#5294FF] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </a>

                {/* Right: Live click count text (0 clicks, 1 click, 2 clicks...) */}
                <span className="shrink-0 font-mono text-[13.5px] sm:text-[14px] font-medium text-[#09090B] dark:text-white tabular-nums">
                  {item.clicksCount}{" "}
                  {item.clicksCount === 1 ? "click" : "clicks"}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Sub-line: Guest Quota Status + 6-Minute Walkthrough Link */}
      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[13px] text-[#52525B] dark:text-zinc-300">
        {isAuthenticated ? (
          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Signed in — links save permanently to your workspace</span>
          </span>
        ) : (
          <>
            <span>No signup required</span>
            <span
              aria-hidden="true"
              className="hidden sm:inline-block h-3 w-px bg-[#D4D4D8] dark:bg-white/15"
            />
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#5294FF]" />
              <span>Active for 3 days as a guest</span>
            </span>
            <span
              aria-hidden="true"
              className="hidden sm:inline-block h-3 w-px bg-[#D4D4D8] dark:bg-white/15"
            />
            <span className="font-medium text-[#09090B] dark:text-white tabular-nums">
              {limitReached
                ? "2 of 2 guest links used"
                : `${remainingGuest} free ${remainingGuest === 1 ? "link" : "links"} left`}
            </span>
          </>
        )}
        <span
          aria-hidden="true"
          className="hidden md:inline-block h-3 w-px bg-[#D4D4D8] dark:bg-white/15"
        />
        <Link
          href="/#demo-video"
          className="inline-flex items-center gap-1.5 font-medium text-[#09090B] dark:text-white hover:text-[#0066FF] dark:hover:text-[#5294FF] transition-colors"
        >
          <Play className="w-3 h-3 fill-current text-[#0066FF] dark:text-[#5294FF]" />
          <span>Watch 6-min walkthrough</span>
        </Link>
      </div>

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
                  {orderedLinks.map((item) => (
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
