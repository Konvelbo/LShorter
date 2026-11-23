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
import { useSession } from "next-auth/react";
import { motion, AnimatePresence, useReducedMotion } from "motion/react";
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
  ArrowRight,
} from "lucide-react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import { cfInvalidateCache } from "@/lib/cloudflare-api";

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
  name: string;
  hex: string;
  guestLocked: boolean;
}> = [
  { id: "black", name: "Classic Black", hex: "#000000", guestLocked: false },
  { id: "blue", name: "Electric Blue", hex: "#0066FF", guestLocked: true },
  { id: "indigo", name: "Royal Indigo", hex: "#6366F1", guestLocked: true },
  { id: "violet", name: "Deep Violet", hex: "#8B5CF6", guestLocked: true },
  { id: "emerald", name: "Emerald", hex: "#10B981", guestLocked: true },
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
  if (!item.isGuest && !item.expiresAt) {
    return 0;
  }
  if (item.expiresAt) {
    const parsed = new Date(item.expiresAt).getTime();
    if (!Number.isNaN(parsed)) return parsed;
  }
  if (!item.isGuest) return 0;
  const created = item.createdAt
    ? new Date(item.createdAt).getTime()
    : Date.now();
  return (Number.isNaN(created) ? Date.now() : created) + TWENTY_FOUR_HOURS_MS;
}

function readStoredHeroLink(isAuthenticated: boolean): ShortenedItem | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(HERO_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ShortenedItem;
    if (!parsed || typeof parsed.slug !== "string" || !parsed.slug.trim()) {
      window.localStorage.removeItem(HERO_STORAGE_KEY);
      return null;
    }
    if (isAuthenticated) {
      return {
        ...parsed,
        expiresAt: null,
        isGuest: false,
      };
    }
    if (!parsed.isGuest && parsed.expiresAt === null) {
      return parsed;
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
 * Isolated 1-second 24-hour countdown timer (rendered strictly for guest links).
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
    <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-[8px] bg-white/60 dark:bg-[#0D1320]/75 text-[12.5px] sm:text-[13px] text-[#0F2952]/85 dark:text-[#BFDBFE]/85 select-none">
      <Clock className="w-3.5 h-3.5 text-[#0066FF]/90 dark:text-[#60A5FA]/90 shrink-0" />
      <span>
        Expires in{" "}
        <strong className="font-mono font-semibold tabular-nums text-[#0A1F44] dark:text-[#DBEAFE]">
          {formatRemaining24h(remainingMs)}
        </strong>
      </span>
    </div>
  );
});

export function HeroShortener() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const sessionUser = session?.user as
    | {
        id?: string;
        name?: string | null;
        email?: string | null;
        userNotFound?: boolean;
        hasCompletedOnboarding?: boolean;
      }
    | undefined;

  const isAuthenticated =
    sessionStatus === "authenticated" &&
    Boolean(sessionUser) &&
    !sessionUser?.userNotFound;

  const dashboardHref =
    sessionUser?.hasCompletedOnboarding === false
      ? "/onboarding"
      : "/dashboard";

  const userFirstName = useMemo(() => {
    const rawName = sessionUser?.name?.trim();
    if (rawName) return rawName.split(/\s+/)[0];
    const emailPrefix = sessionUser?.email?.split("@")[0]?.trim();
    return emailPrefix || "there";
  }, [sessionUser?.name, sessionUser?.email]);

  const [urlInput, setUrlInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPulseHighlighted, setIsPulseHighlighted] = useState(false);

  const [links, setLinks] = useState<ShortenedItem[]>([]);
  const [maxLinks, setMaxLinks] = useState(1);
  const [limitReached, setLimitReached] = useState(false);

  // QR Code hover popup state, active color & export states
  const [isQrHovered, setIsQrHovered] = useState(false);
  const [selectedQrColor, setSelectedQrColor] = useState<string>("#000000");
  const [qrDataUrl, setQrDataUrl] = useState<string>("");
  const [isExportingGif, setIsExportingGif] = useState(false);
  const qrCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const qrOpenedAtRef = useRef<number>(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const expiringSlugsRef = useRef<Set<string>>(new Set());
  const prefersReducedMotion = useReducedMotion();

  // Display the latest shortened Hero link
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
  const activeColorName =
    QR_COLOR_SWATCHES.find((s) => s.hex === selectedQrColor)?.name ||
    "Classic Black";

  // Reset color to Classic Black if user logs out
  useEffect(() => {
    if (!isAuthenticated && selectedQrColor !== "#000000") {
      setSelectedQrColor("#000000");
    }
  }, [isAuthenticated, selectedQrColor]);

  // Generate QR code PNG whenever activeLink or selectedQrColor changes
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
        dark: isAuthenticated ? selectedQrColor : "#000000",
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
  }, [activeLink?.slug, selectedQrColor, isAuthenticated]);

  const handleQrMouseEnter = useCallback(() => {
    if (qrCloseTimeoutRef.current) {
      clearTimeout(qrCloseTimeoutRef.current);
      qrCloseTimeoutRef.current = null;
    }
    setIsQrHovered((prev) => {
      if (!prev) qrOpenedAtRef.current = Date.now();
      return true;
    });
  }, []);

  const handleQrToggleClick = useCallback(() => {
    setIsQrHovered((prev) => {
      if (!prev) {
        qrOpenedAtRef.current = Date.now();
        return true;
      }
      // If hover just opened the popup right before click, keep it open instead of snapping shut
      if (Date.now() - qrOpenedAtRef.current < 350) {
        return true;
      }
      return false;
    });
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

  const handleDownloadGif = useCallback(async () => {
    if (!qrDataUrl || !activeLink?.slug || isExportingGif) return;
    setIsExportingGif(true);
    try {
      const [{ exportFramesToGif }, img] = await Promise.all([
        import("@/lib/qr/gif-export"),
        new Promise<HTMLImageElement>((resolve, reject) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.onerror = reject;
          image.src = qrDataUrl;
        }),
      ]);

      const accent = isAuthenticated ? selectedQrColor : "#000000";
      const size = 320;
      const blob = await exportFramesToGif({
        width: size,
        height: size,
        scale: 1,
        totalFrames: 18,
        delayMs: 85,
        durationSec: 1.53,
        maxColors: 64,
        renderFrame: (ctx, timeSec) => {
          const phase = (timeSec / 1.53) * Math.PI * 2;
          const pulse = 0.96 + 0.04 * Math.sin(phase);
          const scanY = 26 + ((timeSec / 1.53) * (size - 52));

          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, size, size);

          // Crisp centered QR code with subtle breathing pulse
          const drawSize = Math.round((size - 40) * pulse);
          const offset = Math.round((size - drawSize) / 2);
          ctx.drawImage(img, offset, offset, drawSize, drawSize);

          // Subtle animated scan line in the selected QR color
          ctx.save();
          ctx.globalAlpha = 0.22;
          ctx.fillStyle = accent;
          ctx.fillRect(24, Math.round(scanY), size - 48, 3);
          ctx.restore();

          // Subtle rounded border
          ctx.strokeStyle = "#E4E7EC";
          ctx.lineWidth = 2;
          ctx.strokeRect(1, 1, size - 2, size - 2);
        },
      });

      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = objectUrl;
      anchor.download = `lsho-${activeLink.slug}-qr.gif`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      setTimeout(() => URL.revokeObjectURL(objectUrl), 1500);
    } catch {
      // Fallback to PNG download if GIF encoder encounters an environment limitation
      handleDownloadPng();
    } finally {
      setIsExportingGif(false);
    }
  }, [
    qrDataUrl,
    activeLink?.slug,
    isExportingGif,
    isAuthenticated,
    selectedQrColor,
    handleDownloadPng,
  ]);

  const handleLockedQrAction = useCallback(() => {
    setIsQrHovered(false);
    router.push("/register?claim=1");
  }, [router]);

  // Delete an expired guest link on the server (never called for authenticated links)
  const handleExpireLink = useCallback(
    async (slug: string) => {
      if (isAuthenticated) return;
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
    },
    [isAuthenticated]
  );

  // Fetch current Hero link & live clicks from server
  const fetchHeroState = useCallback(
    async (hintSlug?: string) => {
      try {
        const stored = readStoredHeroLink(isAuthenticated);
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

        const serverAuthenticated = Boolean(data.authenticated || isAuthenticated);
        const serverLinks: ShortenedItem[] = (
          Array.isArray(data.links) ? data.links : []
        ).map((item: ShortenedItem) =>
          serverAuthenticated
            ? { ...item, expiresAt: null, isGuest: false }
            : item
        );

        if (serverLinks.length > 0) {
          const latest = serverLinks[serverLinks.length - 1];
          writeStoredHeroLink(latest);
          setLinks(serverLinks);
          setMaxLinks(serverAuthenticated ? -1 : Number(data.maxLinks ?? 1));
          setLimitReached(
            serverAuthenticated
              ? false
              : Boolean(
                  data.limitReached || serverLinks.length >= (data.maxLinks ?? 1)
                )
          );
        } else {
          const currentStored = readStoredHeroLink(serverAuthenticated);
          const isVeryFresh =
            currentStored &&
            Date.now() - new Date(currentStored.createdAt || 0).getTime() <
              15000;

          if (!isVeryFresh) {
            writeStoredHeroLink(null);
            setLinks([]);
            setMaxLinks(serverAuthenticated ? -1 : Number(data.maxLinks ?? 1));
            setLimitReached(
              serverAuthenticated ? false : Boolean(data.limitReached)
            );
          } else if (serverAuthenticated && currentStored) {
            setLinks([{ ...currentStored, expiresAt: null, isGuest: false }]);
            setMaxLinks(-1);
            setLimitReached(false);
          }
        }
      } catch {
        // silent polling resilience
      }
    },
    [isAuthenticated]
  );

  // Initial load & auth transition sync: hydrate from localStorage, then sync live clicks with D1
  useEffect(() => {
    if (sessionStatus === "loading") return;
    const cached = readStoredHeroLink(isAuthenticated);
    if (cached) {
      setLinks([cached]);
      setLimitReached(!isAuthenticated);
    } else if (isAuthenticated) {
      setLimitReached(false);
    }
    fetchHeroState(cached?.slug);
  }, [sessionStatus, isAuthenticated, fetchHeroState]);

  // Real-time 5-second click polling while a link exists and tab is visible
  useEffect(() => {
    if (links.length === 0) return;

    const interval = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "visible"
      ) {
        fetchHeroState(activeLink?.slug);
      }
    }, 5000);

    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchHeroState(activeLink?.slug);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [links.length, activeLink?.slug, fetchHeroState]);

  // Listen for Navbar / Final CTA focus events
  useEffect(() => {
    const handleFocusEvent = () => {
      setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
        setIsPulseHighlighted(true);
        setTimeout(() => setIsPulseHighlighted(false), 1400);
      }, 320);
    };
    window.addEventListener("lshorter_focus_shortener", handleFocusEvent);
    return () => {
      window.removeEventListener("lshorter_focus_shortener", handleFocusEvent);
    };
  }, []);

  const handleShorten = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Guests only: after 1 temporary link, guide to free account creation
    if (!isAuthenticated && (limitReached || (maxLinks > 0 && orderedLinks.length >= maxLinks))) {
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
      const existingCached = readStoredHeroLink(isAuthenticated);
      const res = await fetch("/api/public/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          targetUrl: trimmed,
          existingSlug: !isAuthenticated
            ? activeLink?.slug || existingCached?.slug || undefined
            : undefined,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!isAuthenticated && res.status === 403 && data?.code === "GUEST_LIMIT_REACHED") {
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

      const serverAuthenticated = Boolean(data.authenticated || isAuthenticated);
      const fallbackExpiresAt = serverAuthenticated
        ? null
        : new Date(Date.now() + TWENTY_FOUR_HOURS_MS).toISOString();

      const rawLinks: ShortenedItem[] = Array.isArray(data.links)
        ? data.links
        : data.link
          ? [data.link]
          : [];
      const normalizedLinks = rawLinks.map((item) => ({
        ...item,
        expiresAt: serverAuthenticated
          ? null
          : item.expiresAt || fallbackExpiresAt,
        isGuest: !serverAuthenticated,
      }));

      const latest = normalizedLinks[normalizedLinks.length - 1] || null;
      writeStoredHeroLink(latest);
      setLinks(normalizedLinks);
      setMaxLinks(serverAuthenticated ? -1 : Number(data.maxLinks ?? 1));
      setLimitReached(
        serverAuthenticated
          ? false
          : Boolean(data.limitReached ?? normalizedLinks.length >= 1)
      );
      setUrlInput("");

      // Synchronize authenticated link creation immediately with the Dashboard (same tab & other open tabs)
      if (serverAuthenticated && latest) {
        cfInvalidateCache("/api/links");
        cfInvalidateCache("/api/analytics");
        try {
          const bc = new BroadcastChannel("lshorter_realtime");
          bc.postMessage({
            type: "click",
            timestamp: Date.now(),
            slug: latest.slug,
            id: latest.linkId,
          });
          bc.close();
        } catch {
          // ignore BroadcastChannel unavailability
        }
        window.dispatchEvent(
          new CustomEvent("lshorter_links_updated", {
            detail: { slug: latest.slug, id: latest.linkId },
          })
        );
        window.dispatchEvent(new Event("lshorter_data_change"));
      }
    } catch {
      setErrorMsg("Network error. Please try again in a moment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Trigger rapid click-sync right after user clicks their newly generated short link
  const handleLinkClicked = () => {
    const slug = activeLink?.slug;
    setTimeout(() => fetchHeroState(slug), 1100);
    setTimeout(() => fetchHeroState(slug), 2800);
    setTimeout(() => fetchHeroState(slug), 5200);
  };

  const activeExpiresAtMs = useMemo(() => {
    if (!activeLink || isAuthenticated || !activeLink.isGuest) return 0;
    return getExpirationMs(activeLink);
  }, [activeLink, isAuthenticated]);

  const showGuestCountdown =
    !isAuthenticated &&
    Boolean(activeLink?.isGuest) &&
    activeExpiresAtMs > 0;

  return (
    <div
      id="hero-shortener"
      className="w-full max-w-[740px] mx-auto scroll-mt-28"
    >
      {/* Relative anchor strictly wrapping the input bar so the desktop handwritten callout never shifts when a result row opens below */}
      <div className="relative">
        {/* ── Clean Single-Surface Link Shortener Bar (strictly rounded-[10px]) ── */}
        <div
          className={`relative z-20 rounded-[10px] bg-white/95 dark:bg-[#0D1320]/95 border shadow-[0_10px_30px_rgba(0,102,255,0.10)] dark:shadow-[0_18px_44px_rgba(0,0,0,0.52)] transition-[border-color,box-shadow] duration-200 overflow-hidden ${
            isPulseHighlighted
              ? "border-[#0066FF] ring-2 ring-[#0066FF]/25"
              : errorMsg
                ? "border-red-500/70"
                : "border-[#D4D4D8]/90 dark:border-white/[0.14] focus-within:border-[#0066FF] focus-within:ring-2 focus-within:ring-[#0066FF]/15"
          }`}
        >
          <form onSubmit={handleShorten} className="p-[clamp(8px,1.2svh,12px)] sm:p-2">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-[clamp(8px,1.2svh,12px)] sm:gap-2">
              <div className="relative flex-1 flex items-center min-w-0 bg-transparent">
                <Link2 className="w-4 h-4 sm:w-4 sm:h-4 text-[#71717A] dark:text-zinc-400 ml-3 sm:ml-3.5 shrink-0 pointer-events-none" />
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
                  className="w-full h-[clamp(42px,6.4svh,54px)] sm:h-12 px-3 bg-transparent text-[16px] sm:text-[15px] text-[#09090B] dark:text-white placeholder:text-[#71717A] dark:placeholder:text-zinc-500 outline-none border-0"
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
                className="sm:shrink-0 h-[clamp(42px,6.4svh,54px)] sm:h-12 px-6 text-[clamp(15px,2svh,17px)] sm:text-[15px]"
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

        {/* ── Desktop-only Handwritten Callout + Hand-Drawn Looped Arrow (strictly hidden on mobile & tablet) ── */}
        <motion.button
          type="button"
          onClick={() => inputRef.current?.focus()}
          aria-label="Focus the URL input to shorten a link for free"
          initial={prefersReducedMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="hidden lg:flex items-start gap-1.5 xl:gap-2 absolute left-[calc(100%+6px)] xl:left-[calc(100%+16px)] top-1/2 -translate-y-[78%] z-20 select-none cursor-pointer group text-[#0066FF] dark:text-[#60A5FA] focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-4 rounded-[6px]"
        >
          <svg
            viewBox="0 0 88 52"
            fill="none"
            aria-hidden="true"
            className="w-[54px] h-[32px] xl:w-[98px] xl:h-[58px] 2xl:w-[108px] 2xl:h-[64px] shrink-0 overflow-visible transition-transform duration-300 ease-out group-hover:-translate-x-1"
          >
            <motion.path
              d="M 84 15 C 66 5, 38 13, 42 27 C 46 39, 61 35, 57 22 C 53 10, 29 21, 8 42"
              stroke="currentColor"
              strokeWidth="2.35"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.85, delay: 0.62, ease: [0.22, 1, 0.36, 1] }}
            />
            <motion.path
              d="M 10 30 C 9.5 35, 8.5 39, 7 43 C 12 42, 16.5 41.8, 21.5 42.5"
              stroke="currentColor"
              strokeWidth="2.35"
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={prefersReducedMotion ? false : { pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.32, delay: 1.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </svg>
          <span
            className="font-caveat font-bold text-[21px] xl:text-[32px] 2xl:text-[36px] leading-none tracking-[0.01em] text-left -rotate-[8deg] -mt-1.5 xl:-mt-2 whitespace-nowrap transition-transform duration-300 ease-out group-hover:-rotate-[6deg]"
          >
            Try it for free
          </span>
        </motion.button>
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

      {/* Greeting for authenticated users when no link has been shortened in this Hero yet */}
      {isAuthenticated && !activeLink && (
        <p className="mt-[clamp(10px,1.8svh,18px)] sm:mt-3 text-center text-[clamp(13px,min(3.8vw,1.85svh),15px)] sm:text-[13.5px] text-[#0F2952]/85 dark:text-[#BFDBFE]/85 leading-[1.55] sm:leading-relaxed">
          Welcome back,{" "}
          <span className="font-semibold text-[#0A1F44] dark:text-white">
            {userFirstName}
          </span>
          ! Any link you shorten here is saved straight to your account —{" "}
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-1 font-semibold text-[#0066FF] dark:text-[#60A5FA] underline-offset-4 hover:underline"
          >
            <span>Open Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </p>
      )}

      {/* ── Shortened Link Row + Hover Scale + QR Hover Popup + Guest Timer/Prompt OR Auth Greeting ── */}
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
            className="relative z-30 mt-[clamp(10px,2svh,18px)] sm:mt-3.5 flex flex-col items-center will-change-transform"
          >
            {/* Minimalist Two-Bar Row with Frosted Glass Background Blur & Hover Scale */}
            <motion.div
              whileHover={{ scale: 1.018 }}
              transition={{ type: "spring", stiffness: 360, damping: 24 }}
              className="relative w-full border-l-2 border-r-2 border-[#0066FF]/60 dark:border-[#60A5FA]/60 bg-white/60 dark:bg-[#0D1320]/65 backdrop-blur-md shadow-[0_8px_24px_rgba(0,102,255,0.10)] dark:shadow-[0_10px_28px_rgba(0,0,0,0.42)] px-3.5 sm:px-4 py-[clamp(10px,1.6svh,16px)] sm:py-3 flex items-center justify-between gap-2.5 sm:gap-4 text-left"
            >
              {/* Left: Shortened link + icon that redirects on click */}
              <a
                href={`/${encodeURIComponent(activeLink.slug)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleLinkClicked}
                className="group inline-flex items-center gap-1.5 sm:gap-2 text-[clamp(14.5px,min(4.2vw,2.1svh),17px)] sm:text-[16px] font-mono font-semibold text-[#0A1F44]/95 dark:text-[#DBEAFE]/95 hover:text-[#0066FF] dark:hover:text-white transition-all duration-200 hover:scale-[1.02] origin-left truncate min-w-0"
              >
                <span className="truncate">lsho.cc/{activeLink.slug}</span>
                <ExternalLink className="w-4 h-4 shrink-0 text-[#0066FF]/85 dark:text-[#60A5FA]/85 group-hover:text-[#0052CC] dark:group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </a>

              {/* Right: Live click count text + QR Code hover trigger button */}
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
                <span className="font-mono text-[clamp(13px,min(3.6vw,1.8svh),15px)] sm:text-[14px] font-medium text-[#1D4ED8]/85 dark:text-[#BFDBFE]/90 tabular-nums whitespace-nowrap">
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
                    onClick={handleQrToggleClick}
                    className={`w-[clamp(34px,4.8svh,40px)] h-[clamp(34px,4.8svh,40px)] sm:w-8 sm:h-8 rounded-[8px] flex items-center justify-center border transition-all duration-150 cursor-pointer ${
                      isQrHovered
                        ? "bg-[#0066FF] text-white border-[#0066FF] shadow-[0_4px_14px_rgba(0,102,255,0.35)]"
                        : "bg-white/65 dark:bg-white/[0.08] border-[#0066FF]/30 dark:border-[#60A5FA]/30 text-[#0A1F44] dark:text-[#DBEAFE] hover:bg-[#0066FF]/15 dark:hover:bg-white/[0.15]"
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
                        className="absolute right-0 bottom-full mb-2.5 z-50 w-[236px] rounded-[10px] bg-white/95 dark:bg-[#0D1320]/95 backdrop-blur-xl border border-[#E4E7EC] dark:border-white/15 p-3.5 shadow-[0_20px_48px_rgba(16,24,40,0.18)] dark:shadow-[0_22px_54px_rgba(0,0,0,0.75)] text-left after:content-[''] after:absolute after:top-full after:left-0 after:right-0 after:h-3"
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 mb-2.5 border-b border-[#E4E7EC] dark:border-white/10">
                          <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0A1F44] dark:text-[#BFDBFE]">
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
                            <Loader2 className="w-5 h-5 animate-spin text-[#0066FF]" />
                          )}
                        </div>

                        {/* Color Options: Fully unlocked for authenticated users, locked padlocks for guests only */}
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-[11px] font-medium text-[#475467] dark:text-zinc-400 mb-1.5">
                            <span>Color</span>
                            <span className="text-[10.5px] text-[#0066FF] dark:text-[#60A5FA]">
                              {isAuthenticated
                                ? activeColorName
                                : "Account colors locked"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1.5">
                            {QR_COLOR_SWATCHES.map((swatch) => {
                              const isLocked =
                                !isAuthenticated && swatch.guestLocked;
                              const isSelected = isAuthenticated
                                ? selectedQrColor === swatch.hex
                                : !swatch.guestLocked;
                              const swatchLabel = isLocked
                                ? `${swatch.name} (Account required)`
                                : swatch.name;

                              return (
                                <button
                                  key={swatch.id}
                                  type="button"
                                  title={swatchLabel}
                                  aria-label={swatchLabel}
                                  aria-pressed={isSelected}
                                  onClick={() => {
                                    if (isLocked) {
                                      handleLockedQrAction();
                                    } else {
                                      setSelectedQrColor(swatch.hex);
                                    }
                                  }}
                                  className={`relative w-7 h-7 rounded-[7px] flex items-center justify-center transition-transform cursor-pointer ${
                                    isSelected
                                      ? "ring-2 ring-[#0066FF] ring-offset-2 ring-offset-white dark:ring-offset-[#0D1320] scale-105"
                                      : "opacity-85 hover:opacity-100 hover:scale-105"
                                  }`}
                                  style={{ backgroundColor: swatch.hex }}
                                >
                                  {isLocked ? (
                                    <Lock className="w-3 h-3 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.65)]" />
                                  ) : isSelected ? (
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  ) : null}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Action Buttons: Download PNG + GIF (unlocked for authenticated users, locked for guests) */}
                        <div className="mt-3.5 grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleDownloadPng}
                            className="h-8 px-2.5 rounded-[8px] bg-[#0066FF] hover:bg-[#0052CC] text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5 shrink-0" />
                            <span>PNG</span>
                          </button>

                          {isAuthenticated ? (
                            <button
                              type="button"
                              disabled={isExportingGif}
                              onClick={handleDownloadGif}
                              title="Download animated GIF QR code"
                              className="h-8 px-2.5 rounded-[8px] bg-[#F2F4F7] dark:bg-white/[0.08] hover:bg-[#E4E7EC] dark:hover:bg-white/[0.14] border border-[#D0D5DD] dark:border-white/15 text-[#101828] dark:text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60"
                            >
                              {isExportingGif ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                              ) : (
                                <Download className="w-3.5 h-3.5 shrink-0" />
                              )}
                              <span>GIF</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={handleLockedQrAction}
                              title="Create a free account to export animated GIF QR codes"
                              className="h-8 px-2.5 rounded-[8px] bg-[#F2F4F7] dark:bg-white/[0.08] hover:bg-[#E4E7EC] dark:hover:bg-white/[0.14] border border-[#D0D5DD] dark:border-white/15 text-[#101828] dark:text-white text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Lock className="w-3 h-3 text-[#0066FF] dark:text-[#60A5FA] shrink-0" />
                              <span>GIF</span>
                            </button>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </motion.div>

            {/* 24-Hour Live Countdown Timer (strictly for unauthenticated guest links) */}
            {showGuestCountdown && (
              <HeroCountdownTimer
                slug={activeLink.slug}
                expiresAtMs={activeExpiresAtMs}
                onExpire={handleExpireLink}
              />
            )}

            {/* Authenticated Greeting + Dashboard link OR Guest Account Creation Prompt */}
            {isAuthenticated ? (
              <p className="mt-[clamp(10px,1.8svh,18px)] sm:mt-3 text-center text-[clamp(13px,min(3.8vw,1.85svh),15px)] sm:text-[13.5px] text-[#0F2952]/90 dark:text-[#BFDBFE]/90 leading-[1.5] sm:leading-relaxed max-w-[580px]">
                Welcome back,{" "}
                <span className="font-semibold text-[#0A1F44] dark:text-white">
                  {userFirstName}
                </span>
                ! This link is saved permanently in your workspace —{" "}
                <Link
                  href={dashboardHref}
                  className="inline-flex items-center gap-1 font-semibold text-[#0066FF] dark:text-[#60A5FA] underline-offset-4 hover:underline"
                >
                  <span>Go to your Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </p>
            ) : (
              <p className="mt-[clamp(10px,1.6svh,16px)] sm:mt-2.5 text-center text-[clamp(13px,min(3.8vw,1.85svh),15px)] sm:text-[13.5px] text-[#0F2952]/90 dark:text-[#BFDBFE]/90 leading-[1.5] sm:leading-relaxed max-w-[580px]">
                <Link
                  href="/register?claim=1"
                  className="font-semibold text-[#0066FF] dark:text-[#60A5FA] underline-offset-4 hover:underline"
                >
                  Create your account
                </Link>{" "}
                to keep this link forever, customize its slug &amp; QR code, and
                track every click in real time.
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default HeroShortener;
