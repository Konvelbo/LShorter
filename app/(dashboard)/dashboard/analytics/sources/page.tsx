"use client";

import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Share2,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Globe2,
  MousePointerClick,
  Compass,
  TrendingUp,
} from "lucide-react";
import { ShortLink, GlobalAnalytics, LiveClickEvent } from "@/types";
import {
  cfGetAnalytics,
  cfGetLinks,
  cfInvalidateCache,
} from "@/lib/cloudflare-api";
import { AnalyticsSourcesSkeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";

type ChannelCategory = "Direct" | "Social" | "Search" | "Referral";
type DateRangeOption = "day" | "week" | "month" | "year";

function formatChannelLabel(channel: ChannelCategory, isFr: boolean): string {
  if (!isFr) return channel;
  switch (channel) {
    case "Direct":
      return "Direct";
    case "Social":
      return "Réseaux sociaux";
    case "Search":
      return "Recherche";
    case "Referral":
      return "Référent";
  }
}

interface ClassifiedReferrer {
  raw: string;
  displayHost: string;
  channel: ChannelCategory;
  platformName: string;
  shortName: string;
  badgeText: string;
}

interface RawLinkRecord extends ShortLink {
  clicks_count?: number;
  clicks?: number;
}

interface RawReferrerRecord {
  source?: string;
  referrer?: string;
  name?: string;
  count?: number;
  clicks?: number;
}

interface RawClickEventRecord extends Partial<LiveClickEvent> {
  rawSlug?: string;
}

interface RawAnalyticsPayload {
  totalClicks?: number;
  total_clicks?: number;
  uniqueClicks?: number;
  unique_clicks?: number;
  clicksByDay?: GlobalAnalytics["clicksByDay"];
  clicks_by_day?: GlobalAnalytics["clicksByDay"];
  topCountries?: GlobalAnalytics["topCountries"];
  top_countries?: GlobalAnalytics["topCountries"];
  topCities?: GlobalAnalytics["topCities"];
  top_cities?: GlobalAnalytics["topCities"];
  topDevices?: GlobalAnalytics["topDevices"];
  top_devices?: GlobalAnalytics["topDevices"];
  topBrowsers?: GlobalAnalytics["topBrowsers"];
  top_browsers?: GlobalAnalytics["topBrowsers"];
  topReferrers?: RawReferrerRecord[];
  top_referrers?: RawReferrerRecord[];
  liveClickEvents?: RawClickEventRecord[];
  live_click_events?: RawClickEventRecord[];
  data?: RawAnalyticsPayload;
}

function extractHostname(input: string): string {
  const cleaned = input.trim();
  if (!cleaned) return "";
  try {
    const withProtocol = /^https?:\/\//i.test(cleaned)
      ? cleaned
      : `https://${cleaned}`;
    const parsed = new URL(withProtocol);
    return parsed.hostname.toLowerCase().replace(/^www\./, "");
  } catch {
    return cleaned
      .toLowerCase()
      .replace(/^https?:\/\/(www\.)?/, "")
      .split("/")[0]
      .split("?")[0]
      .split("#")[0];
  }
}

function hostMatches(host: string, domain: string): boolean {
  return host === domain || host.endsWith(`.${domain}`);
}

function classifyReferrer(rawRef?: string | null): ClassifiedReferrer {
  const trimmed = String(rawRef || "").trim();
  const low = trimmed.toLowerCase();

  if (
    !trimmed ||
    low === "direct" ||
    low === "(direct)" ||
    low === "none" ||
    low === "—" ||
    low === "-"
  ) {
    return {
      raw: "Direct",
      displayHost: "Direct",
      channel: "Direct",
      platformName: "Direct",
      shortName: "Direct",
      badgeText: "",
    };
  }

  const displayHost = trimmed
    .replace(/^https?:\/\/(www\.)?/i, "")
    .replace(/\/+$/, "");
  const host = extractHostname(trimmed);

  if (
    hostMatches(host, "t.co") ||
    hostMatches(host, "x.com") ||
    hostMatches(host, "twitter.com")
  ) {
    return {
      raw: trimmed,
      displayHost: displayHost || host || "x.com",
      channel: "Social",
      platformName: "X (Twitter)",
      shortName: "X",
      badgeText: "X",
    };
  }

  if (hostMatches(host, "linkedin.com") || hostMatches(host, "lnkd.in")) {
    return {
      raw: trimmed,
      displayHost: displayHost || host || "linkedin.com",
      channel: "Social",
      platformName: "LinkedIn",
      shortName: "LinkedIn",
      badgeText: "in",
    };
  }

  if (hostMatches(host, "instagram.com") || hostMatches(host, "instagr.am")) {
    return {
      raw: trimmed,
      displayHost: displayHost || host || "instagram.com",
      channel: "Social",
      platformName: "Instagram",
      shortName: "Instagram",
      badgeText: "IG",
    };
  }

  if (
    hostMatches(host, "facebook.com") ||
    hostMatches(host, "fb.com") ||
    hostMatches(host, "fb.me")
  ) {
    return {
      raw: trimmed,
      displayHost: displayHost || host || "facebook.com",
      channel: "Social",
      platformName: "Facebook",
      shortName: "Facebook",
      badgeText: "f",
    };
  }

  if (hostMatches(host, "whatsapp.com") || hostMatches(host, "wa.me")) {
    return {
      raw: trimmed,
      displayHost: displayHost || host || "wa.me",
      channel: "Social",
      platformName: "WhatsApp",
      shortName: "WhatsApp",
      badgeText: "WA",
    };
  }

  if (
    hostMatches(host, "t.me") ||
    hostMatches(host, "telegram.me") ||
    hostMatches(host, "telegram.org")
  ) {
    return {
      raw: trimmed,
      displayHost: displayHost || host || "t.me",
      channel: "Social",
      platformName: "Telegram",
      shortName: "Telegram",
      badgeText: "TG",
    };
  }

  if (hostMatches(host, "youtube.com") || hostMatches(host, "youtu.be")) {
    return {
      raw: trimmed,
      displayHost: displayHost || host || "youtube.com",
      channel: "Social",
      platformName: "YouTube",
      shortName: "YouTube",
      badgeText: "YT",
    };
  }

  if (hostMatches(host, "tiktok.com")) {
    return {
      raw: trimmed,
      displayHost: displayHost || host || "tiktok.com",
      channel: "Social",
      platformName: "TikTok",
      shortName: "TikTok",
      badgeText: "TT",
    };
  }

  if (hostMatches(host, "reddit.com") || hostMatches(host, "redd.it")) {
    return {
      raw: trimmed,
      displayHost: displayHost || host || "reddit.com",
      channel: "Social",
      platformName: "Reddit",
      shortName: "Reddit",
      badgeText: "R",
    };
  }

  if (hostMatches(host, "github.com")) {
    return {
      raw: trimmed,
      displayHost: displayHost || host || "github.com",
      channel: "Social",
      platformName: "GitHub",
      shortName: "GitHub",
      badgeText: "GH",
    };
  }

  if (
    hostMatches(host, "google.com") ||
    host.startsWith("google.") ||
    host.includes(".google.") ||
    hostMatches(host, "bing.com") ||
    hostMatches(host, "duckduckgo.com") ||
    hostMatches(host, "yahoo.com")
  ) {
    const isGoogle =
      host.startsWith("google.") ||
      host.includes(".google.") ||
      hostMatches(host, "google.com");
    const isBing = hostMatches(host, "bing.com");
    const isDdg = hostMatches(host, "duckduckgo.com");
    const pName = isGoogle
      ? "Google"
      : isBing
        ? "Bing"
        : isDdg
          ? "DuckDuckGo"
          : "Yahoo";
    return {
      raw: trimmed,
      displayHost: displayHost || host || pName.toLowerCase(),
      channel: "Search",
      platformName: pName,
      shortName: pName,
      badgeText: pName.slice(0, 1).toUpperCase(),
    };
  }

  const cleanHost = host || displayHost.split("/")[0] || trimmed;
  return {
    raw: trimmed,
    displayHost: displayHost || cleanHost,
    channel: "Referral",
    platformName: cleanHost,
    shortName: cleanHost,
    badgeText: cleanHost.slice(0, 1).toUpperCase(),
  };
}

function formatDeviceLabel(rawDevice?: string | null, isFr = false): string {
  const low = String(rawDevice || "").trim().toLowerCase();
  if (!low || low === "unknown" || low === "inconnu" || low === "—") {
    return isFr ? "Inconnu" : "Unknown";
  }
  if (low === "mobile" || low === "phone" || low === "smartphone") {
    return "Mobile";
  }
  if (low === "desktop" || low === "pc" || low === "computer") {
    return isFr ? "Ordinateur" : "Desktop";
  }
  if (low === "tablet" || low === "tablette" || low === "ipad") {
    return isFr ? "Tablette" : "Tablet";
  }
  return low.charAt(0).toUpperCase() + low.slice(1);
}

function formatEventTime(rawTimestamp?: string | number | null, isFr = false): string {
  if (!rawTimestamp) return "—";
  let normalized: string | number = rawTimestamp;
  if (typeof rawTimestamp === "string") {
    const s = rawTimestamp.trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
      normalized = `${s.replace(" ", "T")}Z`;
    }
  }
  const parsed = new Date(normalized);
  if (isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleTimeString(isFr ? "fr-FR" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getLinkClicks(link: RawLinkRecord): number {
  return Number(link.clicks_count ?? link.clicksCount ?? link.clicks ?? 0);
}

export default function SourcesAnalyticsPage() {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id || "";

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [links, setLinks] = useState<RawLinkRecord[]>([]);
  const [analytics, setAnalytics] = useState<GlobalAnalytics>({
    totalClicks: 0,
    clicksGrowth: 0,
    uniqueClicks: 0,
    uniqueClicksGrowth: 0,
    trackedRevenue: 0,
    revenueGrowth: 0,
    avgCtr: 0,
    ctrGrowth: 0,
    bounceRate: 0,
    epc: 0,
    avgEngagementTime: "0s",
    clicksByDay: [],
    topCountries: [],
    topCities: [],
    topDevices: [],
    topBrowsers: [],
    topReferrers: [],
    liveClickEvents: [],
    recentConversions: [],
  });

  const [selectedRange, setSelectedRange] = useState<DateRangeOption>("month");
  const [selectedLinkId, setSelectedLinkId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      return params.get("linkId") || params.get("slug") || "all";
    }
    return "all";
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const requestIdRef = useRef(0);
  const lastRealtimeRefreshRef = useRef(0);

  const loadData = useCallback(
    async (
      range: DateRangeOption,
      linkId: string,
      isBg = false,
      force = false,
    ) => {
      if (!userId) return;
      const reqId = ++requestIdRef.current;

      try {
        const periodParam =
          range === "day"
            ? "1d"
            : range === "week"
              ? "7d"
              : range === "year"
                ? "365d"
                : "30d";
        const needForce = isBg || force;
        const [analyticsRes, linksRes] = await Promise.all([
          cfGetAnalytics(
            userId,
            periodParam,
            linkId !== "all" ? linkId : undefined,
            needForce,
          ).catch(() => null),
          cfGetLinks(userId, needForce).catch(() => null),
        ]);

        if (reqId !== requestIdRef.current) return;

        const rawLinksContainer = linksRes?.data as
          | RawLinkRecord[]
          | { data?: RawLinkRecord[] }
          | undefined;
        const listData: RawLinkRecord[] = Array.isArray(rawLinksContainer)
          ? rawLinksContainer
          : Array.isArray(rawLinksContainer?.data)
            ? rawLinksContainer.data
            : [];
        setLinks(listData);

        const targetLink =
          linkId !== "all"
            ? listData.find(
                (l) =>
                  l.id === linkId ||
                  String(l.slug || "").toLowerCase() ===
                    linkId.replace(/^\/+/, "").toLowerCase(),
              )
            : null;
        const isAll = !targetLink || linkId === "all";

        const sumLinksClicks = listData.reduce(
          (acc, l) => acc + getLinkClicks(l),
          0,
        );
        if (sumLinksClicks > 0 && typeof window !== "undefined" && userId) {
          try {
            localStorage.setItem(
              `lshorter_live_clicks_${userId}`,
              String(sumLinksClicks),
            );
          } catch {}
        }

        const rawPayload = (analyticsRes?.data ||
          analyticsRes ||
          {}) as RawAnalyticsPayload;
        const d: RawAnalyticsPayload = rawPayload.data || rawPayload;
        const workerTotal = Number(d.totalClicks ?? d.total_clicks ?? 0);

        const rawLiveEvents = d.liveClickEvents ?? d.live_click_events ?? [];
        let liveEvents: LiveClickEvent[] = [];
        if (Array.isArray(rawLiveEvents) && rawLiveEvents.length > 0) {
          let filteredRaw = rawLiveEvents;
          if (!isAll && targetLink) {
            const targetSlugLow = String(targetLink.slug || "").toLowerCase();
            filteredRaw = rawLiveEvents.filter(
              (ev) =>
                ev.linkId === targetLink.id ||
                String(ev.slug || "").toLowerCase() === targetSlugLow ||
                String(ev.rawSlug || "").toLowerCase() === targetSlugLow,
            );
          }
          liveEvents = filteredRaw.map((ev, idx) => ({
            id: ev.id || `${ev.timestamp || "ev"}-${ev.slug || "link"}-${idx}`,
            linkId: ev.linkId || "",
            slug: ev.slug || "",
            timestamp: ev.timestamp || "",
            countryName: ev.countryName || "Unknown",
            countryCode: ev.countryCode || "UN",
            city: ev.city || "—",
            device: ev.device || "unknown",
            browser: ev.browser || "Unknown",
            os: ev.os || "Unknown",
            referrer: ev.referrer || "Direct",
            ipMasked: ev.ipMasked || "0.0.0.0",
            customerName: ev.customerName,
            customerEmail: ev.customerEmail,
            customerAvatar: ev.customerAvatar,
          }));
        }

        const rawReferrers = d.topReferrers ?? d.top_referrers ?? [];
        const referrersSum = Array.isArray(rawReferrers)
          ? rawReferrers.reduce(
              (acc, rf) => acc + Number(rf.count ?? rf.clicks ?? 0),
              0,
            )
          : 0;

        let referrers: {
          source: string;
          name: string;
          referrer: string;
          count: number;
          percentage: number;
        }[] = [];

        if (
          Array.isArray(rawReferrers) &&
          rawReferrers.length > 0 &&
          (isAll ||
            (liveEvents.length > 0 && referrersSum === liveEvents.length))
        ) {
          const denom = referrersSum > 0 ? referrersSum : workerTotal || 1;
          referrers = rawReferrers
            .map((rf) => {
              const cnt = Number(rf.count ?? rf.clicks ?? 0);
              const refName = String(
                rf.source || rf.referrer || rf.name || "Direct",
              ).trim();
              return {
                source: refName,
                name: refName,
                referrer: refName,
                count: cnt,
                percentage: Math.round((cnt / denom) * 100),
              };
            })
            .filter((rf) => rf.count > 0)
            .sort((a, b) => b.count - a.count);
        } else if (liveEvents.length > 0) {
          const countsMap = new Map<string, number>();
          for (const ev of liveEvents) {
            const refName = String(ev.referrer || "Direct").trim() || "Direct";
            countsMap.set(refName, (countsMap.get(refName) || 0) + 1);
          }
          const denom = liveEvents.length || 1;
          referrers = Array.from(countsMap.entries())
            .map(([refName, cnt]) => ({
              source: refName,
              name: refName,
              referrer: refName,
              count: cnt,
              percentage: Math.round((cnt / denom) * 100),
            }))
            .sort((a, b) => b.count - a.count);
        }

        const computedReferrersTotal = referrers.reduce(
          (acc, r) => acc + r.count,
          0,
        );
        const total =
          computedReferrersTotal > 0
            ? computedReferrersTotal
            : liveEvents.length > 0
              ? liveEvents.length
              : isAll
                ? workerTotal
                : 0;

        setAnalytics({
          totalClicks: total,
          clicksGrowth: 0,
          uniqueClicks: Number(d.uniqueClicks ?? d.unique_clicks ?? total),
          uniqueClicksGrowth: 0,
          trackedRevenue: 0,
          revenueGrowth: 0,
          avgCtr: 0,
          ctrGrowth: 0,
          bounceRate: 0,
          epc: 0,
          avgEngagementTime: "0s",
          clicksByDay: d.clicksByDay || d.clicks_by_day || [],
          topCountries: d.topCountries || d.top_countries || [],
          topCities: d.topCities || d.top_cities || [],
          topDevices: d.topDevices || d.top_devices || [],
          topBrowsers: d.topBrowsers || d.top_browsers || [],
          topReferrers: referrers,
          liveClickEvents: liveEvents,
          recentConversions: [],
        });
      } catch (err) {
        console.error("Sources analytics fetch error:", err);
      } finally {
        if (reqId === requestIdRef.current) {
          if (!isBg) setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    },
    [userId],
  );

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && userId) {
      const timer = setTimeout(() => {
        void loadData(selectedRange, selectedLinkId, false, false);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [status, userId, selectedRange, selectedLinkId, router, loadData]);

  useEffect(() => {
    if (!userId) return;

    const handleUpdate = () => {
      const now = Date.now();
      if (now - lastRealtimeRefreshRef.current < 800) return;
      lastRealtimeRefreshRef.current = now;
      cfInvalidateCache();
      void loadData(selectedRange, selectedLinkId, true, true);
    };

    const handleFocus = () => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      )
        return;
      handleUpdate();
    };

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === "lshorter_last_click" ||
        e.key === "lshorter_data_change"
      ) {
        handleUpdate();
      }
    };

    window.addEventListener("lshorter_data_change", handleUpdate);
    window.addEventListener("lshorter_links_updated", handleUpdate);
    window.addEventListener("lshorter_link_clicked", handleUpdate);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("storage", handleStorage);

    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("lshorter_realtime");
        channel.onmessage = (event) => {
          if (
            event.data?.type === "click" ||
            event.data?.type === "refresh" ||
            event.data?.type === "live_clicks_synced"
          ) {
            handleUpdate();
          }
        };
      }
    } catch {}

    const pollTimer = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      )
        return;
      void loadData(selectedRange, selectedLinkId, true, true);
    }, 15000);

    return () => {
      window.removeEventListener("lshorter_data_change", handleUpdate);
      window.removeEventListener("lshorter_links_updated", handleUpdate);
      window.removeEventListener("lshorter_link_clicked", handleUpdate);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("storage", handleStorage);
      if (channel) channel.close();
      clearInterval(pollTimer);
    };
  }, [userId, selectedRange, selectedLinkId, loadData]);

  const selectedLinkObj = useMemo(() => {
    if (selectedLinkId === "all") return null;
    const clean = selectedLinkId.replace(/^\/+/, "").toLowerCase();
    return (
      links.find(
        (l) =>
          l.id === selectedLinkId ||
          String(l.slug || "").toLowerCase() === clean,
      ) || null
    );
  }, [links, selectedLinkId]);

  const referrersList = useMemo(() => {
    const grouped = new Map<
      string,
      {
        displayHost: string;
        channel: ChannelCategory;
        platformName: string;
        shortName: string;
        badgeText: string;
        count: number;
      }
    >();

    for (const rf of analytics.topReferrers) {
      const cnt = Number(rf.count || 0);
      if (cnt <= 0) continue;
      const info = classifyReferrer(rf.name || rf.referrer || rf.source);
      const key = info.displayHost.toLowerCase();
      const existing = grouped.get(key);
      if (existing) {
        existing.count += cnt;
      } else {
        grouped.set(key, {
          displayHost: info.displayHost,
          channel: info.channel,
          platformName: info.platformName,
          shortName: info.shortName,
          badgeText: info.badgeText,
          count: cnt,
        });
      }
    }

    const totalSum = Array.from(grouped.values()).reduce(
      (acc, item) => acc + item.count,
      0,
    );
    const denom = totalSum > 0 ? totalSum : 1;

    return Array.from(grouped.values())
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        ...item,
        percentage: Math.round((item.count / denom) * 100),
      }));
  }, [analytics.topReferrers]);

  const totalAttributedClicks = useMemo(() => {
    return referrersList.reduce((acc, item) => acc + item.count, 0);
  }, [referrersList]);

  const directClicks = useMemo(() => {
    return referrersList
      .filter((r) => r.channel === "Direct")
      .reduce((acc, r) => acc + r.count, 0);
  }, [referrersList]);

  const socialClicks = useMemo(() => {
    return referrersList
      .filter((r) => r.channel === "Social")
      .reduce((acc, r) => acc + r.count, 0);
  }, [referrersList]);

  const otherClicks = useMemo(() => {
    return referrersList
      .filter((r) => r.channel !== "Direct" && r.channel !== "Social")
      .reduce((acc, r) => acc + r.count, 0);
  }, [referrersList]);

  const { directPct, socialPct, otherPct } = useMemo(() => {
    if (totalAttributedClicks <= 0) {
      return { directPct: 0, socialPct: 0, otherPct: 0 };
    }
    const rawDirect = Math.round((directClicks / totalAttributedClicks) * 100);
    const rawSocial = Math.round((socialClicks / totalAttributedClicks) * 100);
    if (otherClicks <= 0) {
      const clampedSocial =
        rawDirect + rawSocial > 100 ? Math.max(0, 100 - rawDirect) : rawSocial;
      return { directPct: rawDirect, socialPct: clampedSocial, otherPct: 0 };
    }
    const remaining = Math.max(0, 100 - rawDirect - rawSocial);
    return {
      directPct: rawDirect,
      socialPct: rawSocial,
      otherPct: remaining,
    };
  }, [totalAttributedClicks, directClicks, socialClicks, otherClicks]);

  const activeChannelsCount = useMemo(() => {
    let count = 0;
    if (directClicks > 0) count++;
    if (socialClicks > 0) count++;
    if (otherClicks > 0) count++;
    return count;
  }, [directClicks, socialClicks, otherClicks]);

  const socialPlatformsList = useMemo(() => {
    const map = new Map<
      string,
      {
        platformName: string;
        shortName: string;
        badgeText: string;
        count: number;
      }
    >();

    for (const r of referrersList) {
      if (r.channel !== "Social" || r.count <= 0) continue;
      const existing = map.get(r.platformName);
      if (existing) {
        existing.count += r.count;
      } else {
        map.set(r.platformName, {
          platformName: r.platformName,
          shortName: r.shortName,
          badgeText: r.badgeText,
          count: r.count,
        });
      }
    }

    const socialDenom = socialClicks || 1;
    return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .map((item) => ({
        ...item,
        shareOfSocial:
          socialClicks > 0
            ? Math.round((item.count / socialDenom) * 100)
            : 0,
      }));
  }, [referrersList, socialClicks]);

  const topSocialPlatform =
    socialPlatformsList.length > 0 ? socialPlatformsList[0] : null;

  const topReferrerHighlight = useMemo(() => {
    if (referrersList.length === 0) return null;
    const topExternal = referrersList.find((r) => r.channel !== "Direct");
    return topExternal || referrersList[0];
  }, [referrersList]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return analytics.liveClickEvents;
    const q = searchQuery.trim().toLowerCase();

    return analytics.liveClickEvents.filter((ev) => {
      const info = classifyReferrer(ev.referrer);
      const matchSlug = String(ev.slug || "")
        .toLowerCase()
        .includes(q);
      const matchRawRef = String(ev.referrer || "Direct")
        .toLowerCase()
        .includes(q);
      const matchPlatform =
        info.platformName.toLowerCase().includes(q) ||
        info.shortName.toLowerCase().includes(q) ||
        info.channel.toLowerCase().includes(q);
      const matchCity = String(ev.city || "")
        .toLowerCase()
        .includes(q);
      const matchCountry = String(ev.countryName || ev.countryCode || "")
        .toLowerCase()
        .includes(q);
      const matchDevice = String(ev.device || "")
        .toLowerCase()
        .includes(q);

      return (
        matchSlug ||
        matchRawRef ||
        matchPlatform ||
        matchCity ||
        matchCountry ||
        matchDevice
      );
    });
  }, [analytics.liveClickEvents, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const paginatedEvents = filteredEvents.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize,
  );

  const showSkeleton =
    status === "loading" ||
    (status === "authenticated" && Boolean(userId) && isLoading);

  if (showSkeleton) {
    return <AnalyticsSourcesSkeleton />;
  }

  const showingStart =
    filteredEvents.length === 0 ? 0 : (safeCurrentPage - 1) * pageSize + 1;
  const showingEnd = Math.min(
    safeCurrentPage * pageSize,
    filteredEvents.length,
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* ─── Breadcrumb, Title & Global Controls (Same colors & dimensions as Devices / Live) ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-1.5 text-xs ds-text-muted hover:text-[#0066FF] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{isFr ? "Retour aux analytiques" : "Back to Analytics"}</span>
            </Link>
            <span className="text-zinc-400 dark:text-neutral-600">/</span>
            <span className="text-xs text-[#0066FF] font-semibold flex items-center gap-1">
              <Share2 className="w-3 h-3" />
              <span>{isFr ? "Sources de trafic" : "Traffic Sources"}</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight ds-text-primary flex flex-wrap items-center gap-2.5">
            <span>{isFr ? "Sources de trafic" : "Traffic Sources"}</span>
            <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/30">
              {isFr ? "Attribution des canaux" : "Channel Attribution"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm ds-text-muted mt-1">
            {isFr
              ? "Canaux, référents et campagnes qui génèrent des clics vers vos liens."
              : "Channels, referrers and campaigns that drive clicks to your links."}
          </p>
        </div>

        {/* Global Controls: Period & Link Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label={isFr ? "Filtrer par lien" : "Filter by link"}
            value={selectedLinkObj ? selectedLinkObj.id : selectedLinkId}
            onChange={(e) => {
              setSelectedLinkId(e.target.value);
              setCurrentPage(1);
              setIsRefreshing(true);
              cfInvalidateCache();
            }}
            className="px-3 py-1.5 rounded-[10px] ds-input text-xs font-semibold cursor-pointer"
          >
            <option value="all">
              {isFr ? `Tous les liens combinés (${links.length})` : `All links combined (${links.length})`}
            </option>
            {links.map((l) => (
              <option key={l.id} value={l.id}>
                /{l.slug} ({getLinkClicks(l)} {isFr ? "clics" : "clicks"})
              </option>
            ))}
          </select>

          <div
            className="flex items-center gap-1 p-1 rounded-[10px] ds-card text-xs shadow-xs"
            role="group"
            aria-label={isFr ? "Période" : "Date range"}
          >
            {(
              [
                { id: "day", label: "24h" },
                { id: "week", label: isFr ? "7j" : "7d" },
                { id: "month", label: isFr ? "30j" : "30d" },
                { id: "year", label: "12m" },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={selectedRange === r.id}
                onClick={() => {
                  setSelectedRange(r.id);
                  setCurrentPage(1);
                  setIsRefreshing(true);
                  cfInvalidateCache();
                }}
                className={`px-2.5 py-1 rounded-[8px] font-semibold transition-all cursor-pointer ${
                  selectedRange === r.id
                    ? "bg-[#0066FF] !text-white font-bold"
                    : "ds-text-muted hover:ds-text-primary"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label={isFr ? "Actualiser" : "Refresh"}
            onClick={() => {
              setIsRefreshing(true);
              cfInvalidateCache();
              void loadData(selectedRange, selectedLinkId, false, true);
            }}
            className="p-2 rounded-[10px] ds-card ds-text-secondary hover:ds-text-primary hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            title={isFr ? "Actualiser" : "Refresh"}
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${
                isRefreshing ? "animate-spin text-[#0066FF]" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* ─── 4 Top KPI Summary Cards (Same dimensions & ds-card colors as Devices / Live) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Attributed clicks */}
        <div className="p-4 sm:p-5 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              {isFr ? "Clics attribués" : "Attributed clicks"}
            </span>
            <div className="p-1 rounded-full bg-[#0066FF]/10 shrink-0">
              <MousePointerClick className="w-4 h-4 text-[#0066FF]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold ds-text-primary leading-none">
              {formatNumber(totalAttributedClicks)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#E4E7EC] dark:border-[#222225]">
            <span className="text-xs ds-text-muted font-mono">
              {activeChannelsCount}{" "}
              {activeChannelsCount === 1
                ? (isFr ? "canal" : "channel")
                : (isFr ? "canaux" : "channels")}{" "}
              · {referrersList.length}{" "}
              {referrersList.length === 1 ? "source" : "sources"}
            </span>
            <span className="text-xs font-semibold text-[#0066FF]">100%</span>
          </div>
        </div>

        {/* KPI 2: Direct */}
        <div className="p-4 sm:p-5 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block shrink-0" />
              Direct
            </span>
            <div className="p-1 rounded-full bg-emerald-500/10 shrink-0">
              <Compass className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold ds-text-primary leading-none">
              {formatNumber(directClicks)}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {directPct}%
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#E4E7EC] dark:border-[#222225]">
            <span className="text-xs ds-text-muted truncate">
              {isFr ? "QR codes, SMS, liens saisis" : "QR codes, SMS, typed links"}
            </span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0 ml-1">
              Direct
            </span>
          </div>
        </div>

        {/* KPI 3: Social */}
        <div className="p-4 sm:p-5 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#0066FF] inline-block shrink-0" />
              {isFr ? "Réseaux sociaux" : "Social"}
            </span>
            <div className="p-1 rounded-full bg-[#0066FF]/10 shrink-0">
              <Share2 className="w-4 h-4 text-[#0066FF]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold ds-text-primary leading-none">
              {formatNumber(socialClicks)}
            </span>
            <span className="text-xs text-[#0066FF] font-semibold">
              {socialPct}%
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#E4E7EC] dark:border-[#222225]">
            <span className="text-xs ds-text-muted truncate">
              {topSocialPlatform
                ? isFr
                  ? `Mené par ${topSocialPlatform.platformName}`
                  : `Led by ${topSocialPlatform.platformName}`
                : isFr
                  ? "Aucun trafic social encore"
                  : "No social traffic yet"}
            </span>
            <span className="text-xs font-semibold text-[#0066FF] shrink-0 ml-1">
              Social
            </span>
          </div>
        </div>

        {/* KPI 4: Top referrer */}
        <div className="p-4 sm:p-5 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              {isFr ? "Principal référent" : "Top referrer"}
            </span>
            <div className="p-1 rounded-full bg-purple-500/10 shrink-0">
              <TrendingUp className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 truncate">
            <span className="font-bold ds-text-primary text-xl sm:text-2xl truncate leading-none">
              {topReferrerHighlight ? topReferrerHighlight.displayHost : "—"}
            </span>
            {topReferrerHighlight && (
              <span className="text-xs ds-text-muted font-mono shrink-0">
                {formatNumber(topReferrerHighlight.count)}{" "}
                {topReferrerHighlight.count === 1
                  ? (isFr ? "clic" : "click")
                  : (isFr ? "clics" : "clicks")}
              </span>
            )}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#E4E7EC] dark:border-[#222225]">
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold truncate">
              {topReferrerHighlight
                ? isFr
                  ? `${topReferrerHighlight.platformName} · ${topReferrerHighlight.percentage}% des clics`
                  : `${topReferrerHighlight.platformName} · ${topReferrerHighlight.percentage}% of clicks`
                : isFr
                  ? "Aucun référent enregistré"
                  : "No referrers recorded"}
            </span>
            <span className="text-xs ds-text-muted font-mono shrink-0 ml-1">
              #1
            </span>
          </div>
        </div>
      </div>

      {/* ─── Two-Column Breakdown: Channel Mix & Top Referrers (Same card padding & colors as Devices) ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Card: Channel mix */}
        <div className="p-5 sm:p-6 rounded-[12px] ds-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC] dark:border-[#222225]">
              <span className="text-sm font-bold ds-text-primary flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#0066FF]" />
                <span>{isFr ? "Répartition des canaux" : "Channel mix"}</span>
              </span>
              <span className="text-xs ds-text-muted font-mono">
                {formatNumber(totalAttributedClicks)}{" "}
                {isFr
                  ? totalAttributedClicks === 1
                    ? "clic attribué"
                    : "clics attribués"
                  : totalAttributedClicks === 1
                    ? "attributed click"
                    : "attributed clicks"}
              </span>
            </div>

            {/* Stacked Channel Bar */}
            <div
              role="img"
              aria-label={
                isFr
                  ? `Part des canaux : Direct ${directPct}%, Social ${socialPct}%`
                  : `Channel share: Direct ${directPct}%, Social ${socialPct}%`
              }
              className="flex gap-[2px] h-3 my-5 rounded-[6px] overflow-hidden bg-[#EEF2F6] dark:bg-[#232C3D]"
            >
              {directPct > 0 && (
                <i
                  className="block h-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-300"
                  style={{ width: `${directPct}%` }}
                  title={`Direct: ${directPct}%`}
                />
              )}
              {socialPct > 0 && (
                <i
                  className="block h-full bg-[#0066FF] transition-all duration-300"
                  style={{ width: `${socialPct}%` }}
                  title={`${isFr ? "Réseaux sociaux" : "Social"}: ${socialPct}%`}
                />
              )}
              {otherClicks > 0 && otherPct > 0 && (
                <i
                  className="block h-full bg-purple-600 dark:bg-purple-400 transition-all duration-300"
                  style={{ width: `${otherPct}%` }}
                  title={`${isFr ? "Web & Recherche" : "Web & Search"}: ${otherPct}%`}
                />
              )}
            </div>

            {/* Channel Rows */}
            <div className="space-y-0">
              <div className="flex justify-between items-center py-3 border-t border-[#E4E7EC] dark:border-[#222225] text-sm">
                <span className="inline-flex items-center ds-text-primary font-medium">
                  <u className="inline-block w-2.5 h-2.5 mr-2.5 rounded-[3px] bg-emerald-600 dark:bg-emerald-400 no-underline" />
                  Direct
                </span>
                <span className="font-bold ds-text-primary text-xs sm:text-sm">
                  {formatNumber(directClicks)}{" "}
                  {directClicks === 1 ? (isFr ? "clic" : "click") : (isFr ? "clics" : "clicks")}
                  <span className="ml-1.5 font-medium ds-text-muted">
                    · {directPct}%
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-t border-[#E4E7EC] dark:border-[#222225] text-sm">
                <span className="inline-flex items-center ds-text-primary font-medium">
                  <u className="inline-block w-2.5 h-2.5 mr-2.5 rounded-[3px] bg-[#0066FF] no-underline" />
                  {isFr ? "Réseaux sociaux" : "Social"}
                </span>
                <span className="font-bold ds-text-primary text-xs sm:text-sm">
                  {formatNumber(socialClicks)}{" "}
                  {socialClicks === 1 ? (isFr ? "clic" : "click") : (isFr ? "clics" : "clicks")}
                  <span className="ml-1.5 font-medium ds-text-muted">
                    · {socialPct}%
                  </span>
                </span>
              </div>

              {otherClicks > 0 && (
                <div className="flex justify-between items-center py-3 border-t border-[#E4E7EC] dark:border-[#222225] text-sm">
                  <span className="inline-flex items-center ds-text-primary font-medium">
                    <u className="inline-block w-2.5 h-2.5 mr-2.5 rounded-[3px] bg-purple-600 dark:bg-purple-400 no-underline" />
                    {isFr ? "Web & Recherche" : "Web & Search"}
                  </span>
                  <span className="font-bold ds-text-primary text-xs sm:text-sm">
                    {formatNumber(otherClicks)}{" "}
                    {otherClicks === 1 ? (isFr ? "clic" : "click") : (isFr ? "clics" : "clicks")}
                    <span className="ml-1.5 font-medium ds-text-muted">
                      · {otherPct}%
                    </span>
                  </span>
                </div>
              )}
            </div>

            {/* Social Networks Subsection */}
            <div className="mt-3 pt-4 border-t border-[#E4E7EC] dark:border-[#222225]">
              <div className="text-[11px] font-bold uppercase tracking-wider ds-text-muted mb-3">
                {isFr ? "Réseaux sociaux" : "Social networks"}
              </div>

              {socialPlatformsList.length === 0 ? (
                <p className="py-4 text-center text-xs text-zinc-500 dark:text-neutral-400">
                  {isFr
                    ? "Aucun clic issu des réseaux sociaux enregistré pour ce filtre."
                    : "No social network clicks recorded for this filter."}
                </p>
              ) : (
                <div className="space-y-3.5">
                  {socialPlatformsList.map((platform) => (
                    <div
                      key={platform.platformName}
                      className="flex items-center gap-3"
                    >
                      <span className="inline-grid place-items-center w-6 h-6 rounded-[6px] bg-zinc-100 dark:bg-[#1c1c20] border border-[#E4E7EC] dark:border-[#27272a] ds-text-primary font-bold text-[11px] shrink-0">
                        {platform.badgeText}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs sm:text-sm font-semibold ds-text-primary">
                          <span className="truncate">
                            {platform.platformName}
                          </span>
                          <span className="font-medium ds-text-muted text-xs shrink-0 ml-2">
                            {formatNumber(platform.count)}{" "}
                            {platform.count === 1 ? (isFr ? "clic" : "click") : (isFr ? "clics" : "clicks")} ·{" "}
                            {platform.shareOfSocial}% {isFr ? "du social" : "of social"}
                          </span>
                        </div>
                        <i className="block h-1.5 mt-2 rounded-[3px] bg-[#EEF2F6] dark:bg-[#232C3D] overflow-hidden not-italic">
                          <b
                            style={{
                              width: `${Math.min(100, Math.max(4, platform.shareOfSocial))}%`,
                            }}
                            className="block h-full rounded-[3px] bg-[#0066FF] transition-all duration-300"
                          />
                        </i>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Top referrers */}
        <div className="p-5 sm:p-6 rounded-[12px] ds-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC] dark:border-[#222225]">
              <span className="text-sm font-bold ds-text-primary flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isFr ? "Principaux référents" : "Top referrers"}</span>
              </span>
              <span className="text-xs ds-text-muted font-mono">
                {referrersList.length}{" "}
                {referrersList.length === 1 ? "source" : "sources"}
              </span>
            </div>

            <div className="space-y-4 mt-4">
              {referrersList.length === 0 ? (
                <p className="py-6 text-center text-xs text-zinc-500 dark:text-neutral-400">
                  {isFr
                    ? "Aucun référent enregistré pour cette période."
                    : "No referrers recorded for this period."}
                </p>
              ) : (
                referrersList.map((ref, idx) => {
                  const isDirect = ref.channel === "Direct";
                  return (
                    <div
                      key={ref.displayHost}
                      className="flex items-center gap-3"
                    >
                      <span className="w-6 h-6 rounded-[6px] bg-zinc-100 dark:bg-[#1c1c20] border border-[#E4E7EC] dark:border-[#27272a] ds-text-muted text-xs font-semibold grid place-items-center shrink-0 font-mono">
                        {idx + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center text-xs sm:text-sm font-semibold ds-text-primary gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="truncate">{ref.displayHost}</span>
                            <em
                              className={`not-italic inline-flex items-center px-2 py-0.5 rounded-[10px] text-[11px] font-semibold shrink-0 border ${
                                isDirect
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                                  : "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF] border-[#0066FF]/25"
                              }`}
                            >
                              {formatChannelLabel(ref.channel, isFr)}
                            </em>
                          </div>
                          <span className="font-medium ds-text-muted text-xs shrink-0">
                            {formatNumber(ref.count)}{" "}
                            {ref.count === 1 ? (isFr ? "clic" : "click") : (isFr ? "clics" : "clicks")} ·{" "}
                            {ref.percentage}%
                          </span>
                        </div>
                        <i className="block h-1.5 mt-2 rounded-[3px] bg-[#EEF2F6] dark:bg-[#232C3D] overflow-hidden not-italic">
                          <b
                            style={{
                              width: `${Math.min(100, Math.max(4, ref.percentage))}%`,
                            }}
                            className={`block h-full rounded-[3px] transition-all duration-300 ${
                              isDirect
                                ? "bg-emerald-600 dark:bg-emerald-400"
                                : "bg-[#0066FF]"
                            }`}
                          />
                        </i>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Bottom Card: Live click stream (Same table dimensions & colors as Devices / Live) ─── */}
      <div className="rounded-[12px] ds-card shadow-sm flex flex-col overflow-hidden">
        <div className="px-5 sm:px-6 py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E7EC] dark:border-[#222225]">
          <div className="flex items-center gap-2.5">
            <h3 className="text-lg font-bold ds-text-primary flex items-center gap-2">
              <span>{isFr ? "Flux de clics en direct" : "Live click stream"}</span>
            </h3>
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              {isFr ? "Direct" : "Live"}
            </span>
          </div>

          <input
            type="search"
            aria-label={isFr ? "Filtrer les événements" : "Filter events"}
            placeholder={isFr ? "Filtrer référent, lien, ville…" : "Filter referrer, link, city…"}
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full sm:w-64 px-3 py-1.5 rounded-[10px] border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#121215] text-xs text-zinc-800 dark:text-neutral-200 placeholder:text-zinc-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#0066FF]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-[#E4E7EC] dark:border-[#222225] bg-[#F9FAFB] dark:bg-white/[0.03] text-zinc-700 dark:text-neutral-400 font-semibold text-[11px]">
                <th
                  scope="col"
                  className="py-3.5 pl-5 sm:pl-6 pr-3 whitespace-nowrap"
                >
                  {isFr ? "Heure" : "Time"}
                </th>
                <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                  {isFr ? "Canal" : "Channel"}
                </th>
                <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                  {isFr ? "Référent" : "Referrer"}
                </th>
                <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                  {isFr ? "Lien court" : "Short link"}
                </th>
                <th scope="col" className="py-3.5 px-3 whitespace-nowrap">
                  {isFr ? "Localisation" : "Location"}
                </th>
                <th
                  scope="col"
                  className="py-3.5 pl-3 pr-5 sm:pr-6 whitespace-nowrap"
                >
                  {isFr ? "Appareil" : "Device"}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#222225]/60 text-zinc-800 dark:text-neutral-200">
              {paginatedEvents.map((ev) => {
                const info = classifyReferrer(ev.referrer);
                const isDirect = info.channel === "Direct";
                const cleanSlug =
                  String(ev.slug || "").replace(/^\/+/, "") || "link";
                const rawCity = String(ev.city || "").trim();
                const hasValidCity =
                  Boolean(rawCity) &&
                  rawCity !== "—" &&
                  rawCity.toLowerCase() !== "inconnue" &&
                  rawCity.toLowerCase() !== "unknown";
                const countryLabel = String(
                  ev.countryName || ev.countryCode || "",
                ).trim();
                const timeStr = formatEventTime(ev.timestamp, isFr);

                return (
                  <tr
                    key={ev.id}
                    className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors h-[52px]"
                  >
                    <td className="py-3.5 pl-5 sm:pl-6 pr-3 font-mono text-zinc-500 dark:text-neutral-400 whitespace-nowrap text-[11px]">
                      {timeStr}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <em
                        className={`not-italic inline-flex items-center px-2 py-0.5 rounded-[10px] text-[11px] font-semibold border ${
                          isDirect
                            ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25"
                            : "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF] border-[#0066FF]/25"
                        }`}
                      >
                        {formatChannelLabel(info.channel, isFr)}
                      </em>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {isDirect ? (
                        <span className="text-zinc-500 dark:text-neutral-400 font-medium">
                          Direct
                        </span>
                      ) : (
                        <span className="inline-flex items-center font-medium text-zinc-800 dark:text-neutral-200">
                          <span className="inline-grid place-items-center w-5 h-5 rounded-[5px] bg-zinc-100 dark:bg-[#1c1c20] border border-[#E4E7EC] dark:border-[#27272a] ds-text-primary font-bold text-[10px] mr-1.5">
                            {info.badgeText}
                          </span>
                          {info.shortName}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap font-mono font-semibold text-[#0066FF]">
                      <Link
                        href="/dashboard/links"
                        className="text-[#0066FF] dark:text-[#5294FF] hover:underline"
                      >
                        /{cleanSlug}
                      </Link>
                    </td>

                    <td className="py-3.5 px-3 whitespace-nowrap">
                      {hasValidCity ? (
                        <>
                          <b className="font-semibold text-zinc-900 dark:text-neutral-100">
                            {rawCity}
                          </b>{" "}
                          <span className="text-zinc-500 dark:text-neutral-400">
                            {countryLabel}
                          </span>
                        </>
                      ) : (
                        <span className="text-zinc-500 dark:text-neutral-400">
                          {countryLabel || "—"}
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 pl-3 pr-5 sm:pr-6 whitespace-nowrap font-medium text-zinc-800 dark:text-neutral-200">
                      {formatDeviceLabel(ev.device, isFr)}
                    </td>
                  </tr>
                );
              })}

              {paginatedEvents.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 text-center text-xs text-zinc-500 dark:text-neutral-400"
                  >
                    {isFr
                      ? "Aucun événement de clic ne correspond à votre filtre."
                      : "No click events matching your filter."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Footer Pagination (Same colors & dimensions as Devices) ─── */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-[#E4E7EC] dark:border-[#222225] text-xs text-zinc-500 dark:text-neutral-400 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="m-0">
            {isFr
              ? `Affichage de ${showingStart}–${showingEnd} sur ${filteredEvents.length} ${filteredEvents.length === 1 ? "événement" : "événements"} · Page ${safeCurrentPage} / ${totalPages}`
              : `Showing ${showingStart}–${showingEnd} of ${filteredEvents.length} ${filteredEvents.length === 1 ? "event" : "events"} · Page ${safeCurrentPage} / ${totalPages}`}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              aria-label={isFr ? "Page précédente" : "Previous page"}
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-[8px] border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] text-zinc-700 dark:text-neutral-300 hover:text-black dark:hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
              title={isFr ? "Page précédente" : "Previous page"}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="px-2.5 py-1 font-mono text-xs text-zinc-800 dark:text-neutral-200 border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] rounded-[8px]">
              {safeCurrentPage} / {totalPages}
            </span>

            <button
              type="button"
              aria-label={isFr ? "Page suivante" : "Next page"}
              disabled={safeCurrentPage >= totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className="p-1.5 rounded-[8px] border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] text-zinc-700 dark:text-neutral-300 hover:text-black dark:hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
              title={isFr ? "Page suivante" : "Next page"}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
