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
import { ShortLink, GlobalAnalytics, LiveClickEvent } from "@/types";
import {
  cfGetAnalytics,
  cfGetLinks,
  cfInvalidateCache,
} from "@/lib/cloudflare-api";
import { AnalyticsSourcesSkeleton } from "@/components/ui/skeleton";
import { formatNumber } from "@/lib/utils";

type ChannelCategory = "Direct" | "Social" | "Search" | "Referral";
type DateRangeOption = "day" | "week" | "month" | "year";

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
    const isGoogle = host.startsWith("google.") || host.includes(".google.") || hostMatches(host, "google.com");
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

function formatDeviceLabel(rawDevice?: string | null): string {
  const low = String(rawDevice || "").trim().toLowerCase();
  if (!low || low === "unknown" || low === "inconnu" || low === "—") {
    return "Unknown";
  }
  if (low === "mobile" || low === "phone" || low === "smartphone") {
    return "Mobile";
  }
  if (low === "desktop" || low === "pc" || low === "computer") {
    return "Desktop";
  }
  if (low === "tablet" || low === "tablette" || low === "ipad") {
    return "Tablet";
  }
  return low.charAt(0).toUpperCase() + low.slice(1);
}

function formatEventTime(rawTimestamp?: string | number | null): string {
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
  return parsed.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getLinkClicks(link: RawLinkRecord): number {
  return Number(link.clicks_count ?? link.clicksCount ?? link.clicks ?? 0);
}

export default function SourcesAnalyticsPage() {
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
    <div className="max-w-[1440px] mx-auto pb-12 flex flex-col gap-5 animate-in fade-in">
      {/* Header & Controls */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-1.5 text-[12px] text-[#667085] dark:text-[#7C8596] mb-1.5">
            <Link
              href="/dashboard/analytics"
              className="hover:text-[#101828] dark:hover:text-[#E6E8EE] transition-colors"
            >
              Analytics
            </Link>
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className="w-[13px] h-[13px] stroke-current fill-none stroke-2"
            >
              <path d="M9 6l6 6-6 6" />
            </svg>
            <span className="text-[#344054] dark:text-[#9AA3B2]">
              Traffic Sources
            </span>
          </div>
          <h1 className="text-[26px] font-bold tracking-[-0.015em] text-[#101828] dark:text-[#E6E8EE] leading-tight">
            Traffic Sources
          </h1>
          <p className="text-[14px] text-[#667085] dark:text-[#9AA3B2] mt-1">
            Channels, referrers and campaigns that drive clicks to your links.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            aria-label="Filter by link"
            value={selectedLinkObj ? selectedLinkObj.id : selectedLinkId}
            onChange={(e) => {
              setSelectedLinkId(e.target.value);
              setCurrentPage(1);
              setIsRefreshing(true);
              cfInvalidateCache();
            }}
            className="h-[44px] px-[14px] rounded-[10px] border border-[#E4E7EC] dark:border-[#2A3040] bg-white dark:bg-[#12151C] text-[#101828] dark:text-[#E6E8EE] text-[13px] font-medium focus:outline-none focus:border-[#2F5FE0] cursor-pointer"
          >
            <option
              value="all"
              className="bg-white dark:bg-[#12151C] text-[#101828] dark:text-[#E6E8EE]"
            >
              All links combined
            </option>
            {links.map((l) => (
              <option
                key={l.id}
                value={l.id}
                className="bg-white dark:bg-[#12151C] text-[#101828] dark:text-[#E6E8EE]"
              >
                /{l.slug} ({getLinkClicks(l)} clicks)
              </option>
            ))}
          </select>

          <div
            className="flex p-[3px] rounded-[10px] border border-[#E4E7EC] dark:border-[#2A3040] bg-white dark:bg-[#12151C]"
            role="group"
            aria-label="Date range"
          >
            {(["day", "week", "month", "year"] as const).map((r) => (
              <button
                key={r}
                type="button"
                aria-pressed={selectedRange === r}
                onClick={() => {
                  setSelectedRange(r);
                  setCurrentPage(1);
                  setIsRefreshing(true);
                  cfInvalidateCache();
                }}
                className={`h-[36px] px-[14px] rounded-[7px] text-[13px] font-medium transition-colors cursor-pointer ${
                  selectedRange === r
                    ? "bg-[#2F5FE0] text-white"
                    : "text-[#667085] dark:text-[#9AA3B2] hover:text-[#101828] dark:hover:text-[#E6E8EE]"
                }`}
              >
                {r === "day"
                  ? "24h"
                  : r === "week"
                    ? "7d"
                    : r === "month"
                      ? "30d"
                      : "12m"}
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-label="Refresh"
            onClick={() => {
              setIsRefreshing(true);
              cfInvalidateCache();
              void loadData(selectedRange, selectedLinkId, false, true);
            }}
            className="w-[44px] h-[44px] rounded-[10px] border border-[#E4E7EC] dark:border-[#2A3040] bg-white dark:bg-[#12151C] text-[#667085] dark:text-[#9AA3B2] hover:text-[#101828] dark:hover:text-[#E6E8EE] hover:border-[#D0D5DD] dark:hover:border-[#3A4256] grid place-items-center cursor-pointer transition-colors"
            title="Refresh"
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              className={`w-[16px] h-[16px] stroke-current fill-none stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round] ${
                isRefreshing ? "animate-spin text-[#2F5FE0]" : ""
              }`}
            >
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5" />
            </svg>
          </button>
        </div>
      </header>

      {/* 4 KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* KPI 1: Attributed clicks */}
        <div className="rounded-[12px] border border-[#E4E7EC] dark:border-[#1E232E] bg-white dark:bg-[#12151C] px-[20px] py-[18px] flex flex-col gap-1.5">
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#667085] dark:text-[#9AA3B2] flex items-center gap-2">
            Attributed clicks
          </div>
          <div className="text-[30px] font-bold tracking-[-0.02em] leading-[1.15] text-[#101828] dark:text-[#E6E8EE]">
            {formatNumber(totalAttributedClicks)}
          </div>
          <div className="text-[13px] text-[#667085] dark:text-[#8E97A7]">
            {activeChannelsCount}{" "}
            {activeChannelsCount === 1 ? "channel" : "channels"} ·{" "}
            {referrersList.length}{" "}
            {referrersList.length === 1 ? "source" : "sources"}
          </div>
        </div>

        {/* KPI 2: Direct */}
        <div className="rounded-[12px] border border-[#E4E7EC] dark:border-[#1E232E] bg-white dark:bg-[#12151C] px-[20px] py-[18px] flex flex-col gap-1.5">
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#667085] dark:text-[#9AA3B2] flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{ background: "#2DD4A7" }}
            />
            Direct
          </div>
          <div className="text-[30px] font-bold tracking-[-0.02em] leading-[1.15] text-[#101828] dark:text-[#E6E8EE]">
            {formatNumber(directClicks)}{" "}
            <small className="text-[14px] font-medium text-[#667085] dark:text-[#9AA3B2] ml-1.5">
              {directPct}%
            </small>
          </div>
          <div className="text-[13px] text-[#667085] dark:text-[#8E97A7]">
            QR codes, SMS, typed links
          </div>
        </div>

        {/* KPI 3: Social */}
        <div className="rounded-[12px] border border-[#E4E7EC] dark:border-[#1E232E] bg-white dark:bg-[#12151C] px-[20px] py-[18px] flex flex-col gap-1.5">
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#667085] dark:text-[#9AA3B2] flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full inline-block shrink-0"
              style={{ background: "#5B8CFF" }}
            />
            Social
          </div>
          <div className="text-[30px] font-bold tracking-[-0.02em] leading-[1.15] text-[#101828] dark:text-[#E6E8EE]">
            {formatNumber(socialClicks)}{" "}
            <small className="text-[14px] font-medium text-[#667085] dark:text-[#9AA3B2] ml-1.5">
              {socialPct}%
            </small>
          </div>
          <div className="text-[13px] text-[#667085] dark:text-[#8E97A7]">
            {topSocialPlatform
              ? `Led by ${topSocialPlatform.platformName}`
              : "No social traffic recorded"}
          </div>
        </div>

        {/* KPI 4: Top referrer */}
        <div className="rounded-[12px] border border-[#E4E7EC] dark:border-[#1E232E] bg-white dark:bg-[#12151C] px-[20px] py-[18px] flex flex-col gap-1.5">
          <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#667085] dark:text-[#9AA3B2] flex items-center gap-2">
            Top referrer
          </div>
          <div className="text-[30px] font-bold tracking-[-0.02em] leading-[1.15] text-[#101828] dark:text-[#E6E8EE] truncate">
            {topReferrerHighlight ? topReferrerHighlight.displayHost : "—"}
            {topReferrerHighlight && (
              <small className="text-[14px] font-medium text-[#667085] dark:text-[#9AA3B2] ml-2">
                {formatNumber(topReferrerHighlight.count)}{" "}
                {topReferrerHighlight.count === 1 ? "click" : "clicks"}
              </small>
            )}
          </div>
          <div className="text-[13px] text-[#667085] dark:text-[#8E97A7] truncate">
            {topReferrerHighlight
              ? `${topReferrerHighlight.platformName} · ${topReferrerHighlight.percentage}% of clicks`
              : "No referrers recorded"}
          </div>
        </div>
      </section>

      {/* Two-Column Breakdown: Channel Mix & Top Referrers */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Card: Channel mix */}
        <div className="rounded-[12px] border border-[#E4E7EC] dark:border-[#1E232E] bg-white dark:bg-[#12151C]">
          <div className="px-[20px] py-[16px] border-b border-[#E4E7EC] dark:border-[#1E232E] flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-[#101828] dark:text-[#E6E8EE]">
              Channel mix
            </h2>
            <span className="text-[13px] text-[#667085] dark:text-[#9AA3B2]">
              {formatNumber(totalAttributedClicks)} attributed{" "}
              {totalAttributedClicks === 1 ? "click" : "clicks"}
            </span>
          </div>

          <div className="p-[20px] flex flex-col gap-[18px]">
            {/* Stacked Channel Bar */}
            <div
              role="img"
              aria-label={`Channel share: Direct ${directPct}%, Social ${socialPct}%`}
              className="flex h-[12px] rounded-full overflow-hidden gap-[2px] bg-[#EEF2F6] dark:bg-[#232834]"
            >
              {directPct > 0 && (
                <i
                  className="block h-full transition-all duration-300"
                  style={{ width: `${directPct}%`, background: "#2DD4A7" }}
                />
              )}
              {socialPct > 0 && (
                <i
                  className="block h-full transition-all duration-300"
                  style={{ width: `${socialPct}%`, background: "#5B8CFF" }}
                />
              )}
              {otherClicks > 0 && otherPct > 0 && (
                <i
                  className="block h-full transition-all duration-300"
                  style={{ width: `${otherPct}%`, background: "#A78BFA" }}
                />
              )}
            </div>

            {/* Direct Channel Row */}
            <div className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full inline-block shrink-0"
                style={{ background: "#2DD4A7" }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline text-[14px]">
                  <b className="font-semibold text-[#101828] dark:text-[#E6E8EE]">
                    Direct
                  </b>
                  <span className="text-[#667085] dark:text-[#9AA3B2] text-[13px]">
                    {formatNumber(directClicks)}{" "}
                    {directClicks === 1 ? "click" : "clicks"} · {directPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Social Channel Row */}
            <div className="flex items-center gap-3">
              <span
                className="w-2 h-2 rounded-full inline-block shrink-0"
                style={{ background: "#5B8CFF" }}
              />
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline text-[14px]">
                  <b className="font-semibold text-[#101828] dark:text-[#E6E8EE]">
                    Social
                  </b>
                  <span className="text-[#667085] dark:text-[#9AA3B2] text-[13px]">
                    {formatNumber(socialClicks)}{" "}
                    {socialClicks === 1 ? "click" : "clicks"} · {socialPct}%
                  </span>
                </div>
              </div>
            </div>

            {/* Optional Web / Referral Row if any non-direct non-social clicks exist */}
            {otherClicks > 0 && (
              <div className="flex items-center gap-3">
                <span
                  className="w-2 h-2 rounded-full inline-block shrink-0"
                  style={{ background: "#A78BFA" }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline text-[14px]">
                    <b className="font-semibold text-[#101828] dark:text-[#E6E8EE]">
                      Web &amp; Search
                    </b>
                    <span className="text-[#667085] dark:text-[#9AA3B2] text-[13px]">
                      {formatNumber(otherClicks)}{" "}
                      {otherClicks === 1 ? "click" : "clicks"} · {otherPct}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Social Networks Section */}
            <div className="text-[12px] font-semibold uppercase tracking-[0.06em] text-[#667085] dark:text-[#7C8596] border-t border-[#E4E7EC] dark:border-[#1E232E] pt-[16px]">
              Social networks
            </div>

            {socialPlatformsList.length === 0 ? (
              <div className="text-[13px] text-[#667085] dark:text-[#9AA3B2] py-2">
                No social network clicks recorded for this filter.
              </div>
            ) : (
              socialPlatformsList.map((platform) => (
                <div
                  key={platform.platformName}
                  className="flex items-center gap-3"
                >
                  <span className="inline-grid place-items-center w-[20px] h-[20px] rounded-[5px] bg-[#F2F4F7] dark:bg-[#1E2430] text-[#101828] dark:text-[#E6E8EE] font-bold text-[11px] shrink-0">
                    {platform.badgeText}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline text-[14px] mb-[7px]">
                      <b className="font-semibold text-[#101828] dark:text-[#E6E8EE] truncate">
                        {platform.platformName}
                      </b>
                      <span className="text-[#667085] dark:text-[#9AA3B2] text-[13px] shrink-0 ml-2">
                        {formatNumber(platform.count)}{" "}
                        {platform.count === 1 ? "click" : "clicks"} ·{" "}
                        {platform.shareOfSocial}% of social
                      </span>
                    </div>
                    <div className="h-[6px] rounded-full bg-[#EEF2F6] dark:bg-[#232834] overflow-hidden">
                      <i
                        className="block h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${platform.shareOfSocial}%`,
                          background: "#5B8CFF",
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right Card: Top referrers */}
        <div className="rounded-[12px] border border-[#E4E7EC] dark:border-[#1E232E] bg-white dark:bg-[#12151C]">
          <div className="px-[20px] py-[16px] border-b border-[#E4E7EC] dark:border-[#1E232E] flex items-center justify-between gap-3">
            <h2 className="text-[15px] font-semibold text-[#101828] dark:text-[#E6E8EE]">
              Top referrers
            </h2>
            <span className="text-[13px] text-[#667085] dark:text-[#9AA3B2]">
              {referrersList.length}{" "}
              {referrersList.length === 1 ? "source" : "sources"}
            </span>
          </div>

          <div className="p-[20px] flex flex-col gap-[18px]">
            {referrersList.length === 0 ? (
              <div className="text-[13px] text-[#667085] dark:text-[#9AA3B2] py-4 text-center">
                No referrers recorded for this period.
              </div>
            ) : (
              referrersList.map((ref, idx) => {
                const isDirect = ref.channel === "Direct";
                return (
                  <div
                    key={ref.displayHost}
                    className="flex items-center gap-3"
                  >
                    <span className="w-[24px] h-[24px] rounded-[6px] bg-[#F2F4F7] dark:bg-[#1A1F29] text-[#667085] dark:text-[#9AA3B2] text-[12px] font-semibold grid place-items-center shrink-0">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline text-[14px] mb-[7px] gap-2">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <b className="font-semibold text-[#101828] dark:text-[#E6E8EE] truncate">
                            {ref.displayHost}
                          </b>
                          <em
                            className={`not-italic inline-flex items-center px-[10px] py-[2px] rounded-full text-[12px] font-semibold shrink-0 ${
                              isDirect
                                ? "bg-[#2DD4A7]/14 text-[#027A48] dark:text-[#5EE0BC]"
                                : "bg-[#5B8CFF]/15 text-[#2F5FE0] dark:text-[#9DBBFF]"
                            }`}
                          >
                            {ref.channel}
                          </em>
                        </div>
                        <span className="text-[#667085] dark:text-[#9AA3B2] text-[13px] shrink-0">
                          {formatNumber(ref.count)}{" "}
                          {ref.count === 1 ? "click" : "clicks"} ·{" "}
                          {ref.percentage}%
                        </span>
                      </div>
                      <div className="h-[6px] rounded-full bg-[#EEF2F6] dark:bg-[#232834] overflow-hidden">
                        <i
                          className="block h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${ref.percentage}%`,
                            background: isDirect ? "#2DD4A7" : "#5B8CFF",
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* Bottom Card: Live click stream */}
      <section className="rounded-[12px] border border-[#E4E7EC] dark:border-[#1E232E] bg-white dark:bg-[#12151C]">
        <div className="px-[20px] py-[16px] border-b border-[#E4E7EC] dark:border-[#1E232E] flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-[15px] font-semibold text-[#101828] dark:text-[#E6E8EE] flex items-center">
            Live click stream
            <span className="inline-flex items-center gap-1.5 text-[12px] text-[#027A48] dark:text-[#2DD4A7] font-medium ml-2.5">
              <span
                className="w-2 h-2 rounded-full inline-block"
                style={{ background: "#2DD4A7" }}
              />
              Live
            </span>
          </h2>

          <input
            type="search"
            aria-label="Filter events"
            placeholder="Filter referrer, link, city…"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-[44px] w-full sm:w-[260px] px-[14px] rounded-[10px] border border-[#E4E7EC] dark:border-[#2A3040] bg-white dark:bg-[#12151C] text-[#101828] dark:text-[#E6E8EE] placeholder:text-[#98A2B3] dark:placeholder:text-[#7C8596] text-[13px] focus:outline-none focus:border-[#2F5FE0]"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[14px] min-w-[780px]">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-[#667085] dark:text-[#8E97A7] px-[20px] py-[12px] border-b border-[#E4E7EC] dark:border-[#1E232E]"
                >
                  Time
                </th>
                <th
                  scope="col"
                  className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-[#667085] dark:text-[#8E97A7] px-[20px] py-[12px] border-b border-[#E4E7EC] dark:border-[#1E232E]"
                >
                  Channel
                </th>
                <th
                  scope="col"
                  className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-[#667085] dark:text-[#8E97A7] px-[20px] py-[12px] border-b border-[#E4E7EC] dark:border-[#1E232E]"
                >
                  Referrer
                </th>
                <th
                  scope="col"
                  className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-[#667085] dark:text-[#8E97A7] px-[20px] py-[12px] border-b border-[#E4E7EC] dark:border-[#1E232E]"
                >
                  Short link
                </th>
                <th
                  scope="col"
                  className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-[#667085] dark:text-[#8E97A7] px-[20px] py-[12px] border-b border-[#E4E7EC] dark:border-[#1E232E]"
                >
                  Location
                </th>
                <th
                  scope="col"
                  className="text-left text-[12px] font-semibold uppercase tracking-[0.05em] text-[#667085] dark:text-[#8E97A7] px-[20px] py-[12px] border-b border-[#E4E7EC] dark:border-[#1E232E]"
                >
                  Device
                </th>
              </tr>
            </thead>
            <tbody>
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
                const timeStr = formatEventTime(ev.timestamp);

                return (
                  <tr
                    key={ev.id}
                    className="border-b border-[#F2F4F7] dark:border-[#171B24] last:border-b-0 hover:bg-[#F9FAFB] dark:hover:bg-[#161A23] transition-colors"
                  >
                    <td className="px-[20px] py-[13px] whitespace-nowrap text-[#667085] dark:text-[#9AA3B2] font-mono text-[13px]">
                      {timeStr}
                    </td>

                    <td className="px-[20px] py-[13px] whitespace-nowrap">
                      <em
                        className={`not-italic inline-flex items-center px-[10px] py-[2px] rounded-full text-[12px] font-semibold ${
                          isDirect
                            ? "bg-[#2DD4A7]/14 text-[#027A48] dark:text-[#5EE0BC]"
                            : "bg-[#5B8CFF]/15 text-[#2F5FE0] dark:text-[#9DBBFF]"
                        }`}
                      >
                        {info.channel}
                      </em>
                    </td>

                    <td className="px-[20px] py-[13px] whitespace-nowrap">
                      {isDirect ? (
                        <span className="text-[#667085] dark:text-[#9AA3B2]">
                          Direct
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[#101828] dark:text-[#E6E8EE]">
                          <span className="inline-grid place-items-center w-[20px] h-[20px] rounded-[5px] bg-[#F2F4F7] dark:bg-[#1E2430] text-[#101828] dark:text-[#E6E8EE] font-bold text-[11px] mr-[6px]">
                            {info.badgeText}
                          </span>
                          {info.shortName}
                        </span>
                      )}
                    </td>

                    <td className="px-[20px] py-[13px] whitespace-nowrap">
                      <Link
                        href="/dashboard/links"
                        className="font-mono text-[13px] font-medium text-[#2F5FE0] dark:text-[#9DBBFF] hover:underline"
                      >
                        /{cleanSlug}
                      </Link>
                    </td>

                    <td className="px-[20px] py-[13px] whitespace-nowrap">
                      {hasValidCity ? (
                        <>
                          <b className="font-semibold text-[#101828] dark:text-[#E6E8EE]">
                            {rawCity}
                          </b>{" "}
                          <span className="text-[#667085] dark:text-[#9AA3B2]">
                            {countryLabel}
                          </span>
                        </>
                      ) : (
                        <span className="text-[#667085] dark:text-[#9AA3B2]">
                          {countryLabel || "—"}
                        </span>
                      )}
                    </td>

                    <td className="px-[20px] py-[13px] whitespace-nowrap text-[#101828] dark:text-[#E6E8EE]">
                      {formatDeviceLabel(ev.device)}
                    </td>
                  </tr>
                );
              })}

              {paginatedEvents.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-[20px] py-10 text-center text-[13px] text-[#667085] dark:text-[#9AA3B2]"
                  >
                    No click events matching your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-[20px] py-[12px] border-t border-[#E4E7EC] dark:border-[#1E232E] flex flex-wrap items-center justify-between gap-3 text-[13px] text-[#667085] dark:text-[#9AA3B2]">
          <span>
            Showing {showingStart}–{showingEnd} of {filteredEvents.length}{" "}
            {filteredEvents.length === 1 ? "event" : "events"}
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="Previous page"
              disabled={safeCurrentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="w-[44px] h-[44px] rounded-[10px] border border-[#E4E7EC] dark:border-[#2A3040] bg-white dark:bg-[#12151C] text-[#667085] dark:text-[#9AA3B2] hover:text-[#101828] dark:hover:text-[#E6E8EE] hover:border-[#D0D5DD] dark:hover:border-[#3A4256] disabled:opacity-40 disabled:pointer-events-none grid place-items-center cursor-pointer transition-colors"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="w-[16px] h-[16px] stroke-current fill-none stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>

            <span>
              Page {safeCurrentPage} of {totalPages}
            </span>

            <button
              type="button"
              aria-label="Next page"
              disabled={safeCurrentPage >= totalPages}
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              className="w-[44px] h-[44px] rounded-[10px] border border-[#E4E7EC] dark:border-[#2A3040] bg-white dark:bg-[#12151C] text-[#667085] dark:text-[#9AA3B2] hover:text-[#101828] dark:hover:text-[#E6E8EE] hover:border-[#D0D5DD] dark:hover:border-[#3A4256] disabled:opacity-40 disabled:pointer-events-none grid place-items-center cursor-pointer transition-colors"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                className="w-[16px] h-[16px] stroke-current fill-none stroke-[1.8] [stroke-linecap:round] [stroke-linejoin:round]"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
