"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Laptop,
  Smartphone,
  Tablet,
  ArrowLeft,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Monitor,
  Cpu,
  Layers
} from "lucide-react";
import { ShortLink, GlobalAnalytics } from "@/types";
import { cfGetAnalytics, cfGetLinks } from "@/lib/cloudflare-api";
import { ColumnMaskToggle, ColumnDefinition } from "@/components/dashboard/analytics/column-mask-toggle";
import { KpiCardsCarousel } from "@/components/dashboard/analytics/kpi-cards-carousel";
import { AnalyticsDevicesSkeleton } from "@/components/ui/skeleton";
import { formatDateRelative, formatNumber } from "@/lib/utils";
import { detectOSFromEvent } from "@/lib/device-detection";
import {
  computePeriodMetrics,
  generateEdgeTopDevices,
  generateEdgeTopBrowsers,
  generateEdgeLiveClickEvents,
} from "@/lib/analytics-generators";

const DEVICE_COLUMNS: ColumnDefinition[] = [
  { key: "timestamp", label: "Timestamp", defaultVisible: true },
  { key: "device", label: "Device Type", defaultVisible: true },
  { key: "browser", label: "Browser", defaultVisible: true },
  { key: "os", label: "Operating System (OS)", defaultVisible: true },
  { key: "customer", label: "Customer / Buyer", defaultVisible: true },
  { key: "link", label: "Target Link", defaultVisible: true },
  { key: "location", label: "Location", defaultVisible: true },
  { key: "referrer", label: "Referrer", defaultVisible: true },
];

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

  const [selectedRange, setSelectedRange] = useState<"day" | "week" | "month" | "year">("month");
  const [selectedLinkId, setSelectedLinkId] = useState<string>("all");
  const [selectedDeviceFilter, setSelectedDeviceFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(DEVICE_COLUMNS.map((c) => c.key))
  );

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 2) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const resetColumns = () => {
    setVisibleColumns(new Set(DEVICE_COLUMNS.map((c) => c.key)));
  };

  const loadData = async (range = selectedRange, linkId = selectedLinkId, isBg = false) => {
    if (!userId) return;
    if (!isBg) setIsLoading(true);

    try {
      const periodParam = range === "day" ? "1d" : range === "week" ? "7d" : range === "year" ? "365d" : "30d";
      const [analyticsRes, linksRes] = await Promise.all([
        cfGetAnalytics(userId, periodParam, linkId !== "all" ? linkId : undefined).catch(() => null),
        cfGetLinks(userId).catch(() => null),
      ]);

      const listData = Array.isArray(linksRes?.data) ? linksRes.data : Array.isArray((linksRes?.data as any)?.data) ? (linksRes?.data as any).data : [];
      const fetchedLinks = listData;
      setLinks(fetchedLinks);

      const targetLink = linkId !== "all"
        ? fetchedLinks.find((l: any) => l.id === linkId || l.slug === linkId)
        : null;
      const sumLinksClicks = fetchedLinks.reduce((acc: number, l: any) => acc + (l.clicks_count || l.clicksCount || l.clicks || 0), 0);
      const linkClicks = targetLink ? (targetLink.clicks_count || targetLink.clicksCount || targetLink.clicks || 0) : 0;
      const isAll = !targetLink || linkId === "all";

      const d = analyticsRes?.data || {};
      const baseTotal = isAll
        ? ((d.totalClicks ?? d.total_clicks) || sumLinksClicks)
        : ((d.totalClicks ?? d.total_clicks) || linkClicks);

      const periodStats = computePeriodMetrics(range, baseTotal, baseTotal, 0, 0);
      const total = periodStats.periodClicks;

      const rawDevices = d.topDevices ?? d.top_devices ?? [];
      const devices = (rawDevices.length > 0)
        ? rawDevices.map((dv: any) => ({
            label: dv.label || dv.device || dv.name || "desktop",
            device: dv.device || dv.label || dv.name || "desktop",
            count: dv.count || dv.clicks || 0,
            percentage: dv.percentage !== undefined ? dv.percentage : (total > 0 ? Math.round(((dv.count || dv.clicks || 0) / total) * 100) : 0),
          }))
        : [];

      const rawBrowsers = d.topBrowsers ?? d.top_browsers ?? [];
      const browsers = (rawBrowsers.length > 0)
        ? rawBrowsers.map((br: any) => ({
            name: br.name || br.browser || "Chrome",
            browser: br.browser || br.name || "Chrome",
            count: br.count || br.clicks || 0,
            percentage: br.percentage !== undefined ? br.percentage : (total > 0 ? Math.round(((br.count || br.clicks || 0) / total) * 100) : 0),
          }))
        : [];

      const rawLiveEvents = d.liveClickEvents ?? d.live_click_events ?? [];
      let liveEvents: any[] = [];
      if (rawLiveEvents.length > 0) {
        liveEvents = rawLiveEvents.map((ev: any) => {
          const detectedOS = detectOSFromEvent(ev);
          return {
            id: ev.id,
            timestamp: ev.timestamp || new Date().toISOString(),
            slug: ev.slug || "link",
            countryCode: (ev.country_code || ev.countryCode || "XX").toUpperCase(),
            countryName: ev.country_name || ev.countryName || "World",
            city: ev.city || "—",
            device: ev.device || "desktop",
            browser: ev.browser || "Chrome",
            os: detectedOS,
            referrer: ev.referrer || "Direct",
            userAgent: ev.user_agent || ev.userAgent || "",
            customerName: ev.customerName || ev.customerFullName || ev.fullName || ev.name || ev.customer_name || null,
            customerEmail: ev.customerEmail || ev.email || ev.customer_email || null,
            conversionAmount: ev.conversionAmount || ev.conversion_amount || 0,
          };
        });
        if (!isAll && targetLink) {
          liveEvents = liveEvents.filter((ev: any) => ev.slug?.toLowerCase() === targetLink.slug?.toLowerCase());
        }
      } else {
        liveEvents = [];
      }

      setAnalytics({
        totalClicks: total,
        clicksGrowth: 0,
        uniqueClicks: periodStats.periodUniques,
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

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && userId) {
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        const qLinkId = params.get("linkId");
        const qSlug = params.get("slug");
        const activeLink = qLinkId || qSlug || selectedLinkId;
        if (activeLink !== selectedLinkId) {
          setSelectedLinkId(activeLink);
        }
        loadData(selectedRange, activeLink);
      } else {
        loadData();
      }
    }
  }, [status, userId, selectedRange, selectedLinkId]);

  // Listen for explicit data update events
  useEffect(() => {
    const handleUpdate = () => {
      loadData(selectedRange, selectedLinkId, true);
    };

    window.addEventListener("lshorter_data_change", handleUpdate);

    return () => {
      window.removeEventListener("lshorter_data_change", handleUpdate);
    };
  }, [userId, selectedRange, selectedLinkId]);

  // Derived OS breakdown from live events
  const osBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    analytics.liveClickEvents.forEach((ev) => {
      const osName = ev.os || detectOSFromEvent(ev);
      counts[osName] = (counts[osName] || 0) + 1;
    });

    const total = analytics.liveClickEvents.length || 1;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / total) * 100),
    })).sort((a, b) => b.count - a.count);
  }, [analytics.liveClickEvents]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return analytics.liveClickEvents.filter((ev) => {
      if (selectedDeviceFilter !== "ALL" && ev.device?.toLowerCase() !== selectedDeviceFilter.toLowerCase()) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSlug = ev.slug?.toLowerCase().includes(q);
        const matchBrowser = ev.browser?.toLowerCase().includes(q);
        const matchDevice = ev.device?.toLowerCase().includes(q);
        const matchOS = ev.os?.toLowerCase().includes(q);
        const matchCity = ev.city?.toLowerCase().includes(q);
        const matchCustName = (ev.customerName || "").toLowerCase().includes(q);
        const matchCustEmail = (ev.customerEmail || "").toLowerCase().includes(q);
        if (!matchSlug && !matchBrowser && !matchDevice && !matchOS && !matchCity && !matchCustName && !matchCustEmail) return false;
      }
      return true;
    });
  }, [analytics.liveClickEvents, selectedDeviceFilter, searchQuery]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const desktopItem = analytics.topDevices.find((d) => d.device?.toLowerCase() === "desktop");
  const mobileItem = analytics.topDevices.find((d) => d.device?.toLowerCase() === "mobile");

  if (status === "loading" || isLoading) {
    return <AnalyticsDevicesSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Navigation Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-[#ff6600] dark:text-neutral-400 dark:hover:text-[#ff6600] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Analytics</span>
            </Link>
            <span className="text-zinc-400 dark:text-neutral-600">/</span>
            <span className="text-xs text-[#ff6600] font-semibold flex items-center gap-1">
              <Laptop className="w-3 h-3" />
              <span>Devices & Formats</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <span>Technologies, Screens & Browsers</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 font-mono">
              Hardware Intelligence
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-neutral-400 mt-1">
            Detailed breakdown of visitor hardware: Mobile vs Desktop, Browsers and Operating Systems.
          </p>
        </div>

        {/* Global Controls: Period & Link Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={selectedLinkId}
            onChange={(e) => {
              setSelectedLinkId(e.target.value);
              loadData(selectedRange, e.target.value);
            }}
            className="px-3 py-1.5 rounded-[10px] bg-zinc-100 dark:bg-[#1a1a1e] border border-zinc-300 dark:border-[#27272a] text-xs font-semibold text-zinc-800 dark:text-white focus:outline-none focus:border-[#ff6600] cursor-pointer"
          >
            <option value="all" className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white">All links combined</option>
            {links.map((l) => (
              <option key={l.id} value={l.id} className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white">
                /{l.slug} ({l.clicksCount || 0} clicks)
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] text-xs shadow-sm">
            {(["day", "week", "month", "year"] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setSelectedRange(r);
                  loadData(r, selectedLinkId);
                }}
                className={`px-2.5 py-1 rounded-[10px] font-semibold transition-all cursor-pointer ${
                  selectedRange === r
                    ? "bg-[#ff6600] text-white font-bold"
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5"
                }`}
              >
                {r === "day" ? "24h" : r === "week" ? "7d" : r === "month" ? "30d" : "12m"}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(selectedRange, selectedLinkId)}
            className="p-2 rounded-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1a1a1e] dark:hover:bg-white/10 text-zinc-700 hover:text-zinc-900 dark:text-neutral-300 dark:hover:text-white border border-zinc-300 dark:border-[#27272a] transition-all cursor-pointer"
            title="Refresh"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#ff6600]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top Device KPI Summary Cards (Infinite Auto-Scroll Carousel) */}
      <KpiCardsCarousel autoScroll={true} speed={0.9} pauseOnHover={false}>
        <div className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm flex flex-col justify-between hover:border-blue-500/50 hover:shadow-md transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">Desktop</span>
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-blue-500 shrink-0" />
          </div>
          <div className="my-0 sm:my-0.5 flex items-baseline gap-1.5">
            <span className="font-bebas text-2xl sm:text-3xl md:text-4xl font-black text-blue-600 dark:text-blue-400 leading-none tracking-wide">
              {desktopItem ? `${desktopItem.percentage}%` : "0%"}
            </span>
            <span className="text-[9px] sm:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">({desktopItem?.count || 0} clicks)</span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-zinc-200/60 dark:border-[#222225]">
            <span className="text-[9px] sm:text-[11px] md:text-xs text-zinc-500 dark:text-neutral-400 font-mono truncate">PC & Mac</span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] font-bold text-blue-500 shrink-0">PC</span>
          </div>
        </div>

        <div className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">Mobile</span>
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>
          <div className="my-0 sm:my-0.5 flex items-baseline gap-1.5">
            <span className="font-bebas text-2xl sm:text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 leading-none tracking-wide">
              {mobileItem ? `${mobileItem.percentage}%` : "0%"}
            </span>
            <span className="text-[9px] sm:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">({mobileItem?.count || 0} clicks)</span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-zinc-200/60 dark:border-[#222225]">
            <span className="text-[9px] sm:text-[11px] md:text-xs text-zinc-500 dark:text-neutral-400 font-mono truncate">Smartphones</span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">Mobile</span>
          </div>
        </div>

        <div className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm flex flex-col justify-between hover:border-[#ff6600]/50 hover:shadow-md transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">Browser</span>
            <div className="p-1 sm:p-1.5 rounded-full bg-orange-500/10 shrink-0">
              <Cpu className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-[#ff6600]" />
            </div>
          </div>
          <div className="my-0 sm:my-0.5 flex items-center gap-1.5 truncate">
            <span className="font-bold text-zinc-900 dark:text-white text-base sm:text-lg md:text-xl truncate">
              {analytics.totalClicks > 0 && analytics.topBrowsers.length > 0 ? analytics.topBrowsers[0].name : "Pending"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-zinc-200/60 dark:border-[#222225]">
            <span className="text-[9px] sm:text-[11px] md:text-xs text-[#ff6600] font-bold truncate">
              {analytics.totalClicks > 0 && analytics.topBrowsers.length > 0 ? `${analytics.topBrowsers[0].percentage}%` : "0%"}
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono shrink-0">#1</span>
          </div>
        </div>

        <div className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm flex flex-col justify-between hover:border-purple-500/50 hover:shadow-md transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">Operating System</span>
            <div className="p-1 sm:p-1.5 rounded-full bg-purple-500/10 shrink-0">
              <Layers className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-purple-500" />
            </div>
          </div>
          <div className="my-0 sm:my-0.5 flex items-center gap-1.5 truncate">
            <span className="font-bold text-zinc-900 dark:text-white text-base sm:text-lg md:text-xl truncate">
              {analytics.totalClicks > 0 && osBreakdown.length > 0 ? osBreakdown[0].name : "Pending"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-zinc-200/60 dark:border-[#222225]">
            <span className="text-[9px] sm:text-[11px] md:text-xs text-purple-600 dark:text-purple-400 font-bold truncate">
              {analytics.totalClicks > 0 && osBreakdown.length > 0 ? `${osBreakdown[0].percentage}%` : "0%"}
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono shrink-0">OS #1</span>
          </div>
        </div>
      </KpiCardsCarousel>

      {/* 3-COLUMNS: FORMATS, OS & NAVIGATEURS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formats d'Appareils */}
        <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-5 shadow-sm dark:shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200 dark:border-[#222225]">
              <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span>Screen Formats</span>
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">3 categories</span>
            </div>

            <div className="space-y-3">
              {analytics.topDevices.map((dv) => {
                const isDesktop = dv.device?.toLowerCase() === "desktop";
                const isMobile = dv.device?.toLowerCase() === "mobile";
                const color = isDesktop ? "#3b82f6" : isMobile ? "#10b981" : "#8b5cf6";
                const IconComponent = isDesktop ? Laptop : isMobile ? Smartphone : Tablet;

                return (
                  <div key={dv.device} className="p-3 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-zinc-600 dark:text-neutral-300" />
                        <span className="text-xs font-bold text-zinc-900 dark:text-white capitalize">{dv.device}</span>
                      </div>
                      <span className="text-xs font-bold font-mono" style={{ color }}>
                        {dv.percentage}% ({dv.count})
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${dv.percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Systèmes d'Exploitation (OS) */}
        <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-5 shadow-sm dark:shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200 dark:border-[#222225]">
              <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-500 dark:text-purple-400" />
                <span>Operating Systems</span>
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">{osBreakdown.length} OS</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {osBreakdown.map((os) => {
                const isWin = os.name.toLowerCase().includes("win");
                const isAndroid = os.name.toLowerCase().includes("android");
                const isApple = os.name.toLowerCase().includes("ios") || os.name.toLowerCase().includes("mac") || os.name.toLowerCase().includes("ipad");
                const isLinux = os.name.toLowerCase().includes("linux");
                const color = isWin ? "#38bdf8" : isAndroid ? "#22c55e" : isApple ? "#a855f7" : isLinux ? "#f97316" : "#eab308";

                return (
                  <div key={os.name} className="p-3 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span>{os.name}</span>
                      </span>
                      <span className="text-xs font-bold font-mono" style={{ color }}>
                        {os.percentage}% ({os.count})
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${os.percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}

              {osBreakdown.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-neutral-500 text-center py-8">
                  Awaiting OS detection...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Navigateurs Web */}
        <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-5 shadow-sm dark:shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200 dark:border-[#222225]">
              <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#ff6600]" />
                <span>Web Browsers</span>
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">{analytics.topBrowsers.length} browsers</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {analytics.topBrowsers.map((br) => (
                <div key={br.name} className="p-3 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{br.name}</span>
                    <span className="text-xs font-bold text-[#ff6600] font-mono">
                      {br.percentage}% ({br.count})
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#ff6600] transition-all duration-500"
                      style={{ width: `${br.percentage}%` }}
                    />
                  </div>
                </div>
              ))}

              {analytics.topBrowsers.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-neutral-500 text-center py-8">
                  Awaiting browser detection...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED TECHNOLOGICAL CLICK STREAM TABLE */}
      <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-5 sm:p-6 shadow-sm dark:shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-zinc-200 dark:border-[#222225]">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-500 dark:text-blue-400" />
              <span>Detailed Technology Stream</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-neutral-400">
              Visitor log with timestamps, device formats, operating systems, and browsers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Device */}
            <div className="flex items-center gap-1 p-1 rounded-[10px] bg-zinc-100 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] text-xs">
              {(["ALL", "desktop", "mobile"] as const).map((d) => (
                <button
                  key={d}
                  onClick={() => {
                    setSelectedDeviceFilter(d);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-[10px] font-semibold transition-all cursor-pointer ${
                    selectedDeviceFilter === d
                      ? "bg-blue-600 text-white font-bold"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  {d === "ALL" ? "All" : d === "desktop" ? "Desktop" : "Mobile"}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder="Filter by browser, OS, link..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-neutral-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Column Masking */}
            <ColumnMaskToggle
              columns={DEVICE_COLUMNS}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
              onResetColumns={resetColumns}
            />
          </div>
        </div>

        {/* 1. Mobile Cards Layout (< 768px) */}
        <div className="flex flex-col gap-3 md:hidden">
          {paginatedEvents.map((ev) => (
            <div
              key={ev.id}
              className="rounded-[10px] bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] p-3.5 flex flex-col gap-2.5 hover:border-purple-500/40 transition-colors"
            >
              {/* Top Row: Device & OS Badges + Relative Time */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded-[10px] bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 capitalize">
                    {ev.device}
                  </span>
                  <span className="px-2 py-0.5 rounded-[10px] bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                    {ev.os}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-500 dark:text-neutral-400 shrink-0">
                  {formatDateRelative(ev.timestamp)}
                </span>
              </div>

              {/* Middle Row: Browser & City/Country Location */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-800 dark:text-neutral-300 font-medium truncate">
                  🌐 {ev.browser || "Chrome"}
                </span>
                <span className="text-zinc-500 dark:text-neutral-400 text-[11px] truncate">
                  📍 {ev.city ? `${ev.city}, ${ev.countryName}` : ev.countryName}
                </span>
              </div>

              {/* Customer / Acheteur info */}
              {(ev.customerName || ev.customerEmail) && (
                <div className="flex flex-col gap-0.5 bg-zinc-100 dark:bg-[#0e0e11] px-2.5 py-1.5 rounded-[8px] border border-zinc-200 dark:border-[#222225] text-xs">
                  <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-neutral-500">Customer / Buyer</span>
                  {ev.customerName && <span className="font-semibold text-zinc-900 dark:text-white text-xs truncate">{ev.customerName}</span>}
                  {ev.customerEmail && <span className="text-[11px] text-zinc-500 dark:text-neutral-400 font-mono truncate">{ev.customerEmail}</span>}
                </div>
              )}

              {/* Bottom Row: Target Link & Referrer */}
              <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-[#222228] text-[11px] gap-2">
                <span className="font-mono font-bold text-cyan-600 dark:text-cyan-400 md:text-[#ff6600] bg-cyan-500/10 md:bg-[#ff6600]/10 px-2 py-0.5 rounded-[10px] border border-cyan-500/20 md:border-[#ff6600]/20 truncate">
                  /{ev.slug}
                </span>
                <span className="px-2 py-0.5 rounded-[10px] bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-[#27272a] text-[10px] font-mono text-zinc-500 dark:text-neutral-400 shrink-0">
                  {ev.referrer || "Direct"}
                </span>
              </div>
            </div>
          ))}

          {paginatedEvents.length === 0 && (
            <div className="py-8 text-center text-zinc-500 dark:text-neutral-500 text-xs">
              No events match the selected criteria.
            </div>
          )}
        </div>

        {/* 2. Desktop Data Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto rounded-[8px] border border-zinc-200 dark:border-[#222225]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-[#222225] bg-zinc-100/70 dark:bg-[#0e0e11]/80 text-zinc-700 dark:text-neutral-400 font-semibold text-[11px]">
                {visibleColumns.has("timestamp") && <th className="py-2.5 px-3">Timestamp</th>}
                {visibleColumns.has("device") && <th className="py-2.5 px-3">Device</th>}
                {visibleColumns.has("browser") && <th className="py-2.5 px-3">Browser</th>}
                {visibleColumns.has("os") && <th className="py-2.5 px-3">Operating System (OS)</th>}
                {visibleColumns.has("customer") && <th className="py-2.5 px-3">Customer / Buyer</th>}
                {visibleColumns.has("link") && <th className="py-2.5 px-3">Target Link</th>}
                {visibleColumns.has("location") && <th className="py-2.5 px-3">Location</th>}
                {visibleColumns.has("referrer") && <th className="py-2.5 px-3">Referrer</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#222225]/60 text-zinc-800 dark:text-neutral-200">
              {paginatedEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                  {visibleColumns.has("timestamp") && (
                    <td className="py-3 px-3 font-mono text-zinc-500 dark:text-neutral-400 whitespace-nowrap">
                      {formatDateRelative(ev.timestamp)}
                    </td>
                  )}

                  {visibleColumns.has("device") && (
                    <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-white capitalize whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 text-[10px]">
                        {ev.device}
                      </span>
                    </td>
                  )}

                  {visibleColumns.has("browser") && (
                    <td className="py-3 px-3 text-zinc-700 dark:text-neutral-300 font-medium">
                      {ev.browser || "Chrome"}
                    </td>
                  )}

                  {visibleColumns.has("os") && (
                    <td className="py-3 px-3 font-semibold whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 text-[10px]">
                        {ev.os}
                      </span>
                    </td>
                  )}

                  {visibleColumns.has("customer") && (
                    <td className="py-3 px-3">
                      {(() => {
                        const name = ev.customerName;
                        const email = ev.customerEmail;
                        if (!name && !email) {
                          return <span className="text-zinc-400 dark:text-neutral-600 font-mono text-xs">—</span>;
                        }
                        return (
                          <div className="flex flex-col min-w-0">
                            {name && <span className="font-medium text-zinc-900 dark:text-white truncate text-xs">{name}</span>}
                            {email && <span className="text-[10.5px] text-zinc-500 dark:text-neutral-400 font-mono truncate" title={email}>{email}</span>}
                          </div>
                        );
                      })()}
                    </td>
                  )}

                  {visibleColumns.has("link") && (
                    <td className="py-3 px-3 font-mono text-[#ff6600] font-semibold">
                      /{ev.slug}
                    </td>
                  )}

                  {visibleColumns.has("location") && (
                    <td className="py-3 px-3 text-zinc-700 dark:text-neutral-400">
                      {ev.city ? `${ev.city}, ${ev.countryName}` : ev.countryName}
                    </td>
                  )}

                  {visibleColumns.has("referrer") && (
                    <td className="py-3 px-3 text-zinc-700 dark:text-neutral-400">
                      <span className="px-2 py-0.5 rounded-[10px] bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-[#27272a] text-[10px] font-mono">
                        {ev.referrer || "Direct"}
                      </span>
                    </td>
                  )}
                </tr>
              ))}

              {paginatedEvents.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.size} className="py-8 text-center text-zinc-500 dark:text-neutral-500 text-xs">
                    No events match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-3 border-t border-zinc-200 dark:border-[#222225] text-xs text-zinc-500 dark:text-neutral-400">
          <span className="text-center sm:text-left">
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredEvents.length)} of {filteredEvents.length} events
          </span>

          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1a1a1e] border border-zinc-300 dark:border-[#27272a] disabled:opacity-40 text-zinc-700 dark:text-white cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 py-1 font-mono text-zinc-900 dark:text-white text-xs bg-zinc-100 dark:bg-[#1a1a1e] border border-zinc-300 dark:border-[#27272a] rounded-[10px] whitespace-nowrap">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1a1a1e] border border-zinc-300 dark:border-[#27272a] disabled:opacity-40 text-zinc-700 dark:text-white cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
