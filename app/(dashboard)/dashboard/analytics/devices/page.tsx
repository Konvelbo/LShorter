"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Laptop,
  Smartphone,
  Monitor,
  Layers,
  Cpu,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { ShortLink, GlobalAnalytics } from "@/types";
import {
  cfGetAnalytics,
  cfGetLinks,
  cfInvalidateCache,
} from "@/lib/cloudflare-api";
import { AnalyticsDevicesSkeleton } from "@/components/ui/skeleton";
import { formatDateRelative, formatNumber } from "@/lib/utils";
import { detectOSFromEvent } from "@/lib/device-detection";
import { ReferrerLogo } from "@/components/dashboard/analytics/referrer-badge";

/**
 * Displays official SVG brand logo for referrers, and plain text "Direct" for direct traffic
 */
function SourceBrandLogo({
  referrer,
  size = 22,
}: {
  referrer?: string | null;
  size?: number;
}) {
  return <ReferrerLogo referrer={referrer} size={size} />;
}

export default function DevicesAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id || "";

  const [isLoading, setIsLoading] = useState(true);
  const [links, setLinks] = useState<ShortLink[]>([]);
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

  const [selectedRange, setSelectedRange] = useState<
    "day" | "week" | "month" | "year"
  >("month");
  const [selectedLinkId, setSelectedLinkId] = useState<string>("all");
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<
    "ALL" | "Desktop" | "Mobile"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const loadData = async (
    range = selectedRange,
    linkId = selectedLinkId,
    isBg = false,
    force = false,
  ) => {
    if (!userId) return;
    if (!isBg) setIsLoading(true);

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

      const listData = Array.isArray(linksRes?.data)
        ? linksRes.data
        : Array.isArray((linksRes?.data as any)?.data)
          ? (linksRes?.data as any).data
          : [];
      const fetchedLinks = listData;
      setLinks(fetchedLinks);

      const targetLink =
        linkId !== "all"
          ? fetchedLinks.find(
              (l: any) =>
                l.id === linkId ||
                String(l.slug || "").toLowerCase() ===
                  linkId.replace(/^\/+/, "").toLowerCase(),
            )
          : null;
      const isAll = !targetLink || linkId === "all";

      const d =
        analyticsRes?.data?.data || analyticsRes?.data || analyticsRes || {};
      const workerTotal = Number(d.totalClicks ?? d.total_clicks ?? 0);

      const rawLiveEvents = d.liveClickEvents ?? d.live_click_events ?? [];
      let liveEvents: any[] = [];
      if (Array.isArray(rawLiveEvents) && rawLiveEvents.length > 0) {
        liveEvents = rawLiveEvents.map((ev: any, idx: number) => {
          const detectedOS = detectOSFromEvent(ev);
          return {
            id: ev.id || `evt_${idx}`,
            linkId: ev.linkId || ev.link_id || ev.slug || "",
            timestamp: ev.timestamp || new Date().toISOString(),
            slug: ev.slug || "link",
            rawSlug: ev.rawSlug || ev.raw_slug || ev.slug || "link",
            countryCode: (
              ev.country_code ||
              ev.countryCode ||
              "XX"
            ).toUpperCase(),
            countryName: ev.country_name || ev.countryName || "World",
            city: ev.city || "—",
            device:
              ev.device && ev.device !== "unknown" ? ev.device : "Inconnu",
            browser:
              ev.browser && ev.browser !== "unknown" ? ev.browser : "Inconnu",
            os: detectedOS || "Inconnu",
            referrer: ev.referrer || "Direct",
            userAgent: ev.user_agent || ev.userAgent || "",
            customerName:
              ev.customerName ||
              ev.customerFullName ||
              ev.fullName ||
              ev.name ||
              ev.customer_name ||
              null,
            customerEmail:
              ev.customerEmail || ev.email || ev.customer_email || null,
            conversionAmount: ev.conversionAmount || ev.conversion_amount || 0,
          };
        });
        if (!isAll && targetLink) {
          const targetSlugLow = String(targetLink.slug || "").toLowerCase();
          liveEvents = liveEvents.filter(
            (ev: any) =>
              ev.linkId === targetLink.id ||
              String(ev.slug || "").toLowerCase() === targetSlugLow ||
              String(ev.rawSlug || "").toLowerCase() === targetSlugLow,
          );
        }
      }

      const rawDevices = d.topDevices ?? d.top_devices ?? [];
      const devicesSum = Array.isArray(rawDevices)
        ? rawDevices.reduce(
            (acc: number, dv: any) => acc + Number(dv.count || dv.clicks || 0),
            0,
          )
        : 0;
      const total =
        liveEvents.length > 0
          ? liveEvents.length
          : devicesSum > 0
            ? devicesSum
            : workerTotal;

      const devices =
        Array.isArray(rawDevices) && rawDevices.length > 0
          ? rawDevices.map((dv: any) => {
              const cnt = Number(dv.count || dv.clicks || 0);
              return {
                label: dv.label || dv.device || dv.name || "Inconnu",
                device: dv.device || dv.label || dv.name || "Inconnu",
                count: cnt,
                percentage:
                  devicesSum > 0
                    ? Math.round((cnt / devicesSum) * 100)
                    : total > 0
                      ? Math.round((cnt / total) * 100)
                      : 0,
              };
            })
          : [];

      const rawBrowsers = d.topBrowsers ?? d.top_browsers ?? [];
      const browsersSum = Array.isArray(rawBrowsers)
        ? rawBrowsers.reduce(
            (acc: number, br: any) => acc + Number(br.count || br.clicks || 0),
            0,
          )
        : 0;
      const browsers =
        Array.isArray(rawBrowsers) && rawBrowsers.length > 0
          ? rawBrowsers.map((br: any) => {
              const cnt = Number(br.count || br.clicks || 0);
              const bName =
                br.name && br.name !== "unknown"
                  ? br.name
                  : br.browser && br.browser !== "unknown"
                    ? br.browser
                    : "Inconnu";
              return {
                name: bName,
                browser: bName,
                count: cnt,
                percentage:
                  browsersSum > 0
                    ? Math.round((cnt / browsersSum) * 100)
                    : total > 0
                      ? Math.round((cnt / total) * 100)
                      : 0,
              };
            })
          : [];

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
        topDevices: devices,
        topBrowsers: browsers,
        topReferrers: d.topReferrers || d.top_referrers || [],
        liveClickEvents: liveEvents,
        recentConversions: [],
      });
    } catch (err) {
      console.error("Device analytics fetch error:", err);
    } finally {
      if (!isBg) setIsLoading(false);
    }
  };

  // Initialize linkId from URL query parameters once on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const qLinkId = params.get("linkId") || params.get("slug");
      if (qLinkId) {
        setSelectedLinkId(qLinkId);
      }
    }
  }, []);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && userId) {
      loadData(selectedRange, selectedLinkId, false, true);
    }
  }, [status, userId, selectedRange, selectedLinkId]);

  // Listen for explicit data update events
  useEffect(() => {
    if (!userId) return;

    const handleUpdate = () => {
      cfInvalidateCache();
      loadData(selectedRange, selectedLinkId, true, true);
    };

    window.addEventListener("lshorter_data_change", handleUpdate);
    window.addEventListener("lshorter_links_updated", handleUpdate);
    window.addEventListener("lshorter_link_clicked", handleUpdate);

    return () => {
      window.removeEventListener("lshorter_data_change", handleUpdate);
      window.removeEventListener("lshorter_links_updated", handleUpdate);
      window.removeEventListener("lshorter_link_clicked", handleUpdate);
    };
  }, [userId, selectedRange, selectedLinkId]);

  // Derived OS breakdown from real live events (100% authentic counts, zero artificial scaling)
  const osBreakdown = useMemo(() => {
    if (!analytics.liveClickEvents || analytics.liveClickEvents.length === 0) {
      return [];
    }
    const counts: Record<string, number> = {};
    analytics.liveClickEvents.forEach((ev) => {
      const osName = ev.os || detectOSFromEvent(ev) || "Inconnu";
      counts[osName] = (counts[osName] || 0) + 1;
    });

    const totalEvents = analytics.liveClickEvents.length || 1;

    return Object.entries(counts)
      .map(([name, rawCount]) => ({
        name,
        count: rawCount,
        percentage: Math.round((rawCount / totalEvents) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [analytics.liveClickEvents]);

  // Effective devices
  const effectiveDevices = useMemo(() => {
    return analytics.topDevices || [];
  }, [analytics.topDevices]);

  // Effective browsers
  const effectiveBrowsers = useMemo(() => {
    return analytics.topBrowsers || [];
  }, [analytics.topBrowsers]);

  // Effective events (pure authentic live traffic)
  const effectiveEvents = useMemo(() => {
    return analytics.liveClickEvents || [];
  }, [analytics.liveClickEvents]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return effectiveEvents.filter((ev) => {
      if (
        selectedDeviceFilter !== "ALL" &&
        ev.device?.toLowerCase() !== selectedDeviceFilter.toLowerCase()
      ) {
        return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSlug = ev.slug?.toLowerCase().includes(q);
        const matchBrowser = ev.browser?.toLowerCase().includes(q);
        const matchDevice = ev.device?.toLowerCase().includes(q);
        const matchOS = ev.os?.toLowerCase().includes(q);
        const matchCity = ev.city?.toLowerCase().includes(q);
        const matchCountry = ev.countryName?.toLowerCase().includes(q);
        const matchRef = ev.referrer?.toLowerCase().includes(q);
        const matchCustName = (ev.customerName || "").toLowerCase().includes(q);
        const matchCustEmail = (ev.customerEmail || "")
          .toLowerCase()
          .includes(q);
        if (
          !matchSlug &&
          !matchBrowser &&
          !matchDevice &&
          !matchOS &&
          !matchCity &&
          !matchCountry &&
          !matchRef &&
          !matchCustName &&
          !matchCustEmail
        ) {
          return false;
        }
      }
      return true;
    });
  }, [effectiveEvents, selectedDeviceFilter, searchQuery]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const { desktopItem, mobileItem, tabletItem } = useMemo(() => {
    let dCount = 0;
    let mCount = 0;
    let tCount = 0;

    if (effectiveDevices.length > 0) {
      for (const item of effectiveDevices) {
        const key = String(item.device || item.label || "").toLowerCase();
        const cnt = Number(item.count || 0);
        if (key.includes("mobile") || key.includes("phone") || key.includes("smart")) {
          mCount += cnt;
        } else if (key.includes("tablet") || key.includes("tablette") || key.includes("ipad")) {
          tCount += cnt;
        } else {
          dCount += cnt;
        }
      }
    } else if (effectiveEvents.length > 0) {
      for (const ev of effectiveEvents) {
        const key = String(ev.device || "").toLowerCase();
        if (key.includes("mobile") || key.includes("phone") || key.includes("smart")) {
          mCount += 1;
        } else if (key.includes("tablet") || key.includes("tablette") || key.includes("ipad")) {
          tCount += 1;
        } else {
          dCount += 1;
        }
      }
    }

    const sum = dCount + mCount + tCount;
    const mPct = sum > 0 ? Math.round((mCount / sum) * 100) : 0;
    const tPct = sum > 0 ? Math.round((tCount / sum) * 100) : 0;
    const dPct = sum > 0 ? Math.max(0, 100 - mPct - tPct) : 0;

    return {
      desktopItem: { device: "Desktop", count: dCount, percentage: dPct },
      mobileItem: { device: "Mobile", count: mCount, percentage: mPct },
      tabletItem: { device: "Tablette", count: tCount, percentage: tPct },
    };
  }, [effectiveDevices, effectiveEvents]);

  const selectedLinkObj = useMemo(() => {
    if (selectedLinkId === "all") return null;
    const clean = selectedLinkId.replace(/^\/+/, "").toLowerCase();
    return (
      links.find(
        (l: any) =>
          l.id === selectedLinkId ||
          String(l.slug || "").toLowerCase() === clean,
      ) || null
    );
  }, [links, selectedLinkId]);

  const topBrowser = effectiveBrowsers[0] || {
    name: "—",
    count: 0,
    percentage: 0,
  };

  const topOS = osBreakdown[0] || {
    name: "—",
    count: 0,
    percentage: 0,
  };

  if (status === "loading" || isLoading) {
    return <AnalyticsDevicesSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* ─── Breadcrumb, Title & Global Controls ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-1.5 text-xs ds-text-muted hover:text-brand transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour à Analytics</span>
            </Link>
            <span className="text-zinc-400 dark:text-neutral-600">/</span>
            <span className="text-xs text-brand font-semibold flex items-center gap-1">
              <Laptop className="w-3 h-3" />
              <span>Appareils & Formats</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight ds-text-primary flex flex-wrap items-center gap-2.5">
            <span>Technologies, écrans et navigateurs</span>
            <span className="inline-flex items-center text-xs px-2.5 py-0.5 rounded-full font-semibold bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/30">
              Hardware Intelligence
            </span>
          </h1>
          <p className="text-xs sm:text-sm ds-text-muted mt-1">
            Détail du matériel des visiteurs : mobile et ordinateur, navigateurs et systèmes d’exploitation.
          </p>
        </div>

        {/* Global Controls: Period & Link Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Liens"
            value={selectedLinkObj ? selectedLinkObj.id : selectedLinkId}
            onChange={(e) => {
              const val = e.target.value;
              setSelectedLinkId(val);
              setCurrentPage(1);
              cfInvalidateCache();
            }}
            className="px-3 py-1.5 rounded-[10px] ds-input text-xs font-semibold cursor-pointer"
          >
            <option value="all">Tous les liens combinés ({links.length})</option>
            {links.map((l: any) => (
              <option key={l.id} value={l.id}>
                /{l.slug} ({l.clicks_count || l.clicksCount || l.clicks || 0} clics)
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-[10px] ds-card text-xs shadow-xs">
            {(
              [
                { id: "day", label: "24h" },
                { id: "week", label: "7j" },
                { id: "month", label: "30j" },
                { id: "year", label: "12m" },
              ] as const
            ).map((r) => (
              <button
                key={r.id}
                onClick={() => {
                  setSelectedRange(r.id);
                  setCurrentPage(1);
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
            aria-label="Actualiser"
            onClick={() => loadData(selectedRange, selectedLinkId, false, true)}
            className="p-2 rounded-[10px] ds-card ds-text-secondary hover:ds-text-primary hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            title="Actualiser les données"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-brand" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* ─── 4 Top KPI Summary Cards (Identical to other analytics pages) ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: MOBILE */}
        <div className="p-4 sm:p-5 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Mobile
            </span>
            <div className="p-1 rounded-full bg-[#0066FF]/10 shrink-0">
              <Smartphone className="w-4 h-4 text-[#0066FF]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold ds-text-primary leading-none">
              {mobileItem.percentage} %
            </span>
            <span className="text-xs text-[#0066FF] font-semibold">
              smartphones
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#E4E7EC] dark:border-[#222225]">
            <span className="text-xs ds-text-muted font-mono">{formatNumber(mobileItem.count)} clics</span>
            <span className="text-xs font-semibold text-[#0066FF]">Mobile</span>
          </div>
        </div>

        {/* Card 2: DESKTOP */}
        <div className="p-4 sm:p-5 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Desktop
            </span>
            <div className="p-1 rounded-full bg-emerald-500/10 shrink-0">
              <Laptop className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold ds-text-primary leading-none">
              {desktopItem.percentage} %
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              PC & Mac
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#E4E7EC] dark:border-[#222225]">
            <span className="text-xs ds-text-muted font-mono">{formatNumber(desktopItem.count)} clics</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">Desktop</span>
          </div>
        </div>

        {/* Card 3: NAVIGATEUR N°1 */}
        <div className="p-4 sm:p-5 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Navigateur N°1
            </span>
            <div className="p-1 rounded-full bg-[#0066FF]/10 shrink-0">
              <Cpu className="w-4 h-4 text-[#0066FF]" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold ds-text-primary text-xl sm:text-2xl truncate">
              {topBrowser.name}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#E4E7EC] dark:border-[#222225]">
            <span className="text-xs text-[#0066FF] font-semibold">
              {topBrowser.percentage} % des clics
            </span>
            <span className="text-xs ds-text-muted font-mono">#1</span>
          </div>
        </div>

        {/* Card 4: SYSTÈME N°1 */}
        <div className="p-4 sm:p-5 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Système N°1
            </span>
            <div className="p-1 rounded-full bg-purple-500/10 shrink-0">
              <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold ds-text-primary text-xl sm:text-2xl truncate">
              {topOS.name}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-[#E4E7EC] dark:border-[#222225]">
            <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold">
              {topOS.percentage} % des clics
            </span>
            <span className="text-xs ds-text-muted font-mono">OS #1</span>
          </div>
        </div>
      </div>

      {/* ─── 3 Middle Cards: Formats, OS & Navigateurs ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Card 1: Formats d'écran */}
        <div className="p-5 sm:p-6 rounded-[12px] ds-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC] dark:border-[#222225]">
              <span className="text-sm font-bold ds-text-primary flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-[#0066FF]" />
                <span>Formats d’écran</span>
              </span>
              <span className="text-xs ds-text-muted font-mono">
                3 catégories
              </span>
            </div>

            {/* Segmented multi-color progress bar */}
            <div className="flex gap-[2px] h-3 my-5 rounded-[6px] overflow-hidden bg-[#EEF2F6] dark:bg-[#232C3D]">
              {mobileItem.percentage > 0 && (
                <i
                  style={{ width: `${mobileItem.percentage}%` }}
                  className="block h-full bg-[#0066FF] transition-all duration-300"
                  title={`Mobile: ${mobileItem.percentage}%`}
                />
              )}
              {desktopItem.percentage > 0 && (
                <i
                  style={{ width: `${desktopItem.percentage}%` }}
                  className="block h-full bg-emerald-600 dark:bg-emerald-400 transition-all duration-300"
                  title={`Desktop: ${desktopItem.percentage}%`}
                />
              )}
              {tabletItem.percentage > 0 && (
                <i
                  style={{ width: `${tabletItem.percentage}%` }}
                  className="block h-full bg-purple-600 dark:bg-purple-400 transition-all duration-300"
                  title={`Tablette: ${tabletItem.percentage}%`}
                />
              )}
            </div>

            {/* List items */}
            <div className="space-y-0">
              <div className="flex justify-between items-center py-3 border-t border-[#E4E7EC] dark:border-[#222225] text-sm">
                <span className="inline-flex items-center ds-text-primary font-medium">
                  <u className="inline-block w-2.5 h-2.5 mr-2.5 rounded-[3px] bg-[#0066FF] no-underline" />
                  Mobile
                </span>
                <span className="font-bold ds-text-primary">
                  {mobileItem.percentage} %
                  <span className="ml-2 not-italic font-medium ds-text-muted">
                    ({formatNumber(mobileItem.count)})
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-t border-[#E4E7EC] dark:border-[#222225] text-sm">
                <span className="inline-flex items-center ds-text-primary font-medium">
                  <u className="inline-block w-2.5 h-2.5 mr-2.5 rounded-[3px] bg-emerald-600 dark:bg-emerald-400 no-underline" />
                  Desktop
                </span>
                <span className="font-bold ds-text-primary">
                  {desktopItem.percentage} %
                  <span className="ml-2 not-italic font-medium ds-text-muted">
                    ({formatNumber(desktopItem.count)})
                  </span>
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-t border-[#E4E7EC] dark:border-[#222225] text-sm">
                <span className="inline-flex items-center ds-text-primary font-medium">
                  <u className="inline-block w-2.5 h-2.5 mr-2.5 rounded-[3px] bg-purple-600 dark:bg-purple-400 no-underline" />
                  Tablette
                </span>
                <span className="font-bold ds-text-primary">
                  {tabletItem.percentage} %
                  <span className="ml-2 not-italic font-medium ds-text-muted">
                    ({formatNumber(tabletItem.count)})
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Systèmes d'exploitation */}
        <div className="p-5 sm:p-6 rounded-[12px] ds-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC] dark:border-[#222225]">
              <span className="text-sm font-bold ds-text-primary flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                <span>Systèmes d’exploitation</span>
              </span>
              <span className="text-xs ds-text-muted font-mono">
                {osBreakdown.length} OS
              </span>
            </div>

            <div className="space-y-4 mt-4">
              {osBreakdown.map((os) => (
                <div key={os.name}>
                  <div className="flex justify-between text-sm font-semibold ds-text-primary">
                    <span>{os.name}</span>
                    <span className="font-medium ds-text-muted">
                      {os.percentage} % · {formatNumber(os.count)}
                    </span>
                  </div>
                  <i className="block h-1.5 mt-2 rounded-[3px] bg-[#EEF2F6] dark:bg-[#232C3D] overflow-hidden not-italic">
                    <b
                      style={{ width: `${Math.min(100, Math.max(4, os.percentage))}%` }}
                      className="block h-full rounded-[3px] bg-purple-600 dark:bg-purple-400"
                    />
                  </i>
                </div>
              ))}
              {osBreakdown.length === 0 && (
                <p className="py-6 text-center text-xs text-zinc-500 dark:text-neutral-400">
                  Aucun système d’exploitation enregistré sur la période.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Card 3: Navigateurs web */}
        <div className="p-5 sm:p-6 rounded-[12px] ds-card shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC] dark:border-[#222225]">
              <span className="text-sm font-bold ds-text-primary flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#0066FF]" />
                <span>Navigateurs web</span>
              </span>
              <span className="text-xs ds-text-muted font-mono">
                {effectiveBrowsers.length} navigateurs
              </span>
            </div>

            <div className="space-y-4 mt-4">
              {effectiveBrowsers.map((br) => (
                <div key={br.name}>
                  <div className="flex justify-between text-sm font-semibold ds-text-primary">
                    <span>{br.name}</span>
                    <span className="font-medium ds-text-muted">
                      {br.percentage} % · {formatNumber(br.count)}
                    </span>
                  </div>
                  <i className="block h-1.5 mt-2 rounded-[3px] bg-[#EEF2F6] dark:bg-[#232C3D] overflow-hidden not-italic">
                    <b
                      style={{ width: `${Math.min(100, Math.max(4, br.percentage))}%` }}
                      className="block h-full rounded-[3px] bg-[#0066FF]"
                    />
                  </i>
                </div>
              ))}
              {effectiveBrowsers.length === 0 && (
                <p className="py-6 text-center text-xs text-zinc-500 dark:text-neutral-400">
                  Aucun navigateur enregistré sur la période.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ─── Detailed Technology Stream Section ─── */}
      <div className="rounded-[12px] ds-card shadow-sm flex flex-col overflow-hidden">
        {/* Table Header / Filter Bar */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#E4E7EC] dark:border-[#222225]">
          <div>
            <h3 className="text-lg font-bold ds-text-primary flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0066FF]" />
              <span>Flux technologique détaillé</span>
            </h3>
            <p className="text-xs ds-text-muted mt-0.5">
              Journal des visites : horodatage, format, système et navigateur.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5 items-center">
            {/* Filter by Device Segment Buttons */}
            <div className="flex items-center gap-1 p-1 rounded-[10px] bg-zinc-100 dark:bg-[#18181b] border border-[#E4E7EC] dark:border-[#222225] text-xs">
              {(["ALL", "Desktop", "Mobile"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDeviceFilter(d);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-[8px] font-semibold transition-all cursor-pointer ${
                    selectedDeviceFilter === d
                      ? "bg-[#0066FF] !text-white font-bold"
                      : "ds-text-muted hover:ds-text-primary"
                  }`}
                >
                  {d === "ALL" ? "Tous" : d}
                </button>
              ))}
            </div>

            {/* Filter Input */}
            <input
              aria-label="Filtrer"
              type="text"
              placeholder="Filtrer par navigateur, OS, lien…"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full sm:w-60 px-3 py-1.5 rounded-[10px] border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#121215] text-xs text-zinc-800 dark:text-neutral-200 placeholder:text-zinc-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-[#0066FF]"
            />
          </div>
        </div>

        {/* ─── Desktop Table (>= 768px) ─── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-[#E4E7EC] dark:border-[#222225] bg-[#F9FAFB] dark:bg-white/[0.03] text-zinc-700 dark:text-neutral-400 font-semibold text-[11px]">
                <th className="py-3.5 pl-5 sm:pl-6 pr-3 whitespace-nowrap">
                  Horodatage
                </th>
                <th className="py-3.5 px-3 whitespace-nowrap">
                  Appareil
                </th>
                <th className="py-3.5 px-3 whitespace-nowrap">
                  Navigateur
                </th>
                <th className="py-3.5 px-3 whitespace-nowrap">
                  Système
                </th>
                <th className="py-3.5 px-3 whitespace-nowrap">
                  Client
                </th>
                <th className="py-3.5 px-3 whitespace-nowrap">
                  Lien cible
                </th>
                <th className="py-3.5 px-3 whitespace-nowrap">
                  Localisation
                </th>
                <th className="py-3.5 pl-3 pr-5 sm:pr-6 whitespace-nowrap text-center">
                  Source
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#222225]/60 text-zinc-800 dark:text-neutral-200">
              {paginatedEvents.map((ev) => (
                <tr
                  key={ev.id}
                  className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors h-[52px]"
                >
                  <td className="py-3.5 pl-5 sm:pl-6 pr-3 font-mono text-zinc-500 dark:text-neutral-400 whitespace-nowrap text-[11px]">
                    {formatDateRelative(ev.timestamp)}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-[10px] bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/25 text-[11px] font-semibold inline-block">
                      {ev.device}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-medium whitespace-nowrap text-zinc-800 dark:text-neutral-200">
                    {ev.browser}
                  </td>
                  <td className="py-3.5 px-3 font-medium whitespace-nowrap text-zinc-800 dark:text-neutral-200">
                    {ev.os}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    {ev.customerName || ev.customerEmail ? (
                      <div>
                        {ev.customerName && (
                          <span className="font-semibold text-zinc-900 dark:text-neutral-100 block text-xs">
                            {ev.customerName}
                          </span>
                        )}
                        {ev.customerEmail && (
                          <span className="block text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">
                            {ev.customerEmail}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400 dark:text-neutral-600">—</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap font-mono font-semibold text-[#0066FF]">
                    <a
                      href={`/r/${encodeURIComponent(ev.slug)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#0066FF] hover:underline"
                    >
                      /{ev.slug}
                    </a>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap text-zinc-600 dark:text-neutral-300">
                    {ev.city && ev.city !== "—" && ev.city !== "Inconnue"
                      ? `${ev.city}, ${ev.countryName}`
                      : ev.countryName}
                  </td>
                  {/* REAL OFFICIAL LOGO IN SOURCE COLUMN */}
                  <td className="py-3.5 pl-3 pr-5 sm:pr-6 whitespace-nowrap text-center">
                    <SourceBrandLogo referrer={ev.referrer} size={22} />
                  </td>
                </tr>
              ))}

              {paginatedEvents.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="py-12 text-center text-xs text-zinc-500 dark:text-neutral-400"
                  >
                    Aucun événement ne correspond aux critères sélectionnés.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Mobile Cards Layout (< 768px) ─── */}
        <div className="block md:hidden p-3.5 space-y-3">
          {paginatedEvents.map((ev) => (
            <div
              key={ev.id}
              className="p-4 rounded-[10px] bg-zinc-50/50 dark:bg-white/[0.02] border border-[#E4E7EC] dark:border-[#222225] text-xs shadow-xs leading-normal"
            >
              {/* Top Row: Device Pill & Time */}
              <div className="flex justify-between items-center">
                <span className="px-2 py-0.5 rounded-[10px] bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/25 text-[11px] font-semibold">
                  {ev.device}
                </span>
                <span className="text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">
                  {formatDateRelative(ev.timestamp)}
                </span>
              </div>

              {/* Title: Browser · OS */}
              <p className="mt-2.5 font-bold text-zinc-900 dark:text-neutral-100 text-sm">
                {ev.browser} · {ev.os}
              </p>

              {/* Customer / Email */}
              {ev.customerName && (
                <span className="block text-xs text-zinc-900 dark:text-neutral-100 mt-1 font-semibold">
                  {ev.customerName}
                </span>
              )}
              {ev.customerEmail && (
                <span className="block text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">
                  {ev.customerEmail}
                </span>
              )}

              {/* Bottom Row: Link & Location + Source Logo */}
              <div className="flex justify-between items-center mt-3 pt-2.5 border-t border-[#E4E7EC] dark:border-[#222225]">
                <a
                  href={`/r/${encodeURIComponent(ev.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-[#0066FF] hover:underline font-mono text-xs"
                >
                  /{ev.slug}
                </a>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 dark:text-neutral-400">
                    {ev.city && ev.city !== "—" ? ev.city : ev.countryName}
                  </span>
                  {/* Real Official Brand Logo */}
                  <SourceBrandLogo referrer={ev.referrer} size={20} />
                </div>
              </div>
            </div>
          ))}

          {paginatedEvents.length === 0 && (
            <div className="py-8 text-center text-xs text-zinc-500 dark:text-neutral-400">
              Aucun événement ne correspond aux critères sélectionnés.
            </div>
          )}
        </div>

        {/* ─── Footer Pagination ─── */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-[#E4E7EC] dark:border-[#222225] text-xs text-zinc-500 dark:text-neutral-400 flex flex-col sm:flex-row justify-between items-center gap-3">
          <p className="m-0">
            Affichage de {filteredEvents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0} à{" "}
            {Math.min(currentPage * pageSize, filteredEvents.length)} sur{" "}
            {filteredEvents.length} événements · Page {currentPage} / {totalPages}
          </p>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-[8px] border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] text-zinc-700 dark:text-neutral-300 hover:text-black dark:hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
              title="Page précédente"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2.5 py-1 font-mono text-xs text-zinc-800 dark:text-neutral-200 border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] rounded-[8px]">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-[8px] border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] text-zinc-700 dark:text-neutral-300 hover:text-black dark:hover:text-white disabled:opacity-40 cursor-pointer transition-colors"
              title="Page suivante"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
