"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Share2,
  ArrowLeft,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Globe2,
  TrendingUp,
  MessageSquare,
  Compass,
  Link2
} from "lucide-react";
import { ShortLink, GlobalAnalytics } from "@/types";
import { cfGetAnalytics, cfGetLinks } from "@/lib/cloudflare-api";
import { ColumnMaskToggle, ColumnDefinition } from "@/components/dashboard/analytics/column-mask-toggle";
import { KpiCardsCarousel } from "@/components/dashboard/analytics/kpi-cards-carousel";
import { AnalyticsSourcesSkeleton } from "@/components/ui/skeleton";
import { formatDateRelative, formatNumber } from "@/lib/utils";
import {
  computePeriodMetrics,
  generateEdgeTopReferrers,
  generateEdgeLiveClickEvents,
} from "@/lib/analytics-generators";

const SOURCE_COLUMNS: ColumnDefinition[] = [
  { key: "timestamp", label: "Timestamp", defaultVisible: true },
  { key: "channel", label: "Channel", defaultVisible: true },
  { key: "referrer", label: "Source / Referrer", defaultVisible: true },
  { key: "customer", label: "Customer / Buyer", defaultVisible: true },
  { key: "link", label: "Target Link", defaultVisible: true },
  { key: "location", label: "Location", defaultVisible: true },
  { key: "device", label: "Device", defaultVisible: true },
];

export default function SourcesAnalyticsPage() {
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
  const [selectedChannelFilter, setSelectedChannelFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(SOURCE_COLUMNS.map((c) => c.key))
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
    setVisibleColumns(new Set(SOURCE_COLUMNS.map((c) => c.key)));
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

      const rawReferrers = d.topReferrers ?? d.top_referrers ?? [];
      const referrers = (rawReferrers.length > 0)
        ? rawReferrers.map((rf: any) => ({
            name: rf.name || rf.referrer || "Direct",
            referrer: rf.referrer || rf.name || "Direct",
            count: rf.count || rf.clicks || 0,
            percentage: rf.percentage !== undefined ? rf.percentage : (total > 0 ? Math.round(((rf.count || rf.clicks || 0) / total) * 100) : 0),
          }))
        : [];

      const rawLiveEvents = d.liveClickEvents ?? d.live_click_events ?? [];
      let liveEvents: any[] = [];
      if (rawLiveEvents.length > 0) {
        liveEvents = rawLiveEvents;
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
        topDevices: d.topDevices || d.top_devices || [],
        topBrowsers: d.topBrowsers || d.top_browsers || [],
        topReferrers: referrers,
        liveClickEvents: liveEvents,
        recentConversions: [],
      });
    } catch (err) {
      console.error("Sources analytics fetch error:", err);
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

  // Social Breakdown calculation
  const socialBreakdown = useMemo(() => {
    const socialKeywords = ["linkedin", "twitter", "x.com", "whatsapp", "facebook", "instagram", "t.co", "telegram"];
    return analytics.topReferrers.filter((rf) => {
      const low = (rf.name || "").toLowerCase();
      return socialKeywords.some((k) => low.includes(k));
    });
  }, [analytics.topReferrers]);

  const socialClicksTotal = useMemo(() => {
    return socialBreakdown.reduce((acc, curr) => acc + curr.count, 0);
  }, [socialBreakdown]);

  const directClicksTotal = useMemo(() => {
    const directItem = analytics.topReferrers.find((rf) => (rf.name || "").toLowerCase() === "direct");
    return directItem ? directItem.count : 0;
  }, [analytics.topReferrers]);

  const total = analytics.totalClicks || 1;
  const socialPercentage = Math.round((socialClicksTotal / total) * 100);
  const directPercentage = Math.round((directClicksTotal / total) * 100);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return analytics.liveClickEvents.filter((ev) => {
      const ref = (ev.referrer || "Direct").toLowerCase();
      const isSocial = ["linkedin", "twitter", "x.com", "whatsapp", "facebook", "instagram", "t.co", "telegram"].some((k) => ref.includes(k));
      const isDirect = ref === "direct" || ref === "";

      if (selectedChannelFilter === "social" && !isSocial) return false;
      if (selectedChannelFilter === "direct" && !isDirect) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSlug = ev.slug?.toLowerCase().includes(q);
        const matchRef = ev.referrer?.toLowerCase().includes(q);
        const matchCity = ev.city?.toLowerCase().includes(q);
        const matchCountry = ev.countryName?.toLowerCase().includes(q);
        const matchCustName = (ev.customerName || "").toLowerCase().includes(q);
        const matchCustEmail = (ev.customerEmail || "").toLowerCase().includes(q);
        if (!matchSlug && !matchRef && !matchCity && !matchCountry && !matchCustName && !matchCustEmail) return false;
      }
      return true;
    });
  }, [analytics.liveClickEvents, selectedChannelFilter, searchQuery]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  if (status === "loading" || isLoading) {
    return <AnalyticsSourcesSkeleton />;
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
              <Share2 className="w-3 h-3" />
              <span>Traffic Sources</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white flex items-center gap-2.5">
            <span>Origins, Channels & Referrers</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-mono">
              Traffic Attribution
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 dark:text-neutral-400 mt-1">
            Tracking source platforms: Social Networks, Direct Shares, Search Engines, and Marketing Campaigns.
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

      {/* Top Source KPI Summary Cards (Infinite Auto-Scroll Carousel) */}
      <KpiCardsCarousel autoScroll={true} speed={0.9} pauseOnHover={false}>
        <div className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm flex flex-col justify-between hover:border-[#ff6600]/50 hover:shadow-md transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">Social</span>
            <div className="p-1 sm:p-1.5 rounded-full bg-orange-500/10 shrink-0">
              <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-[#ff6600]" />
            </div>
          </div>
          <div className="my-0 sm:my-0.5 flex items-baseline gap-1.5">
            <span className="font-bebas text-2xl sm:text-3xl md:text-4xl font-black text-[#ff6600] leading-none tracking-wide">
              {socialPercentage}%
            </span>
            <span className="text-[9px] sm:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">({socialClicksTotal} clicks)</span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-zinc-200/60 dark:border-[#222225]">
            <span className="text-[9px] sm:text-[11px] md:text-xs text-zinc-500 dark:text-neutral-400 font-mono truncate">X, LinkedIn, WA</span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] font-bold text-[#ff6600] shrink-0">Social</span>
          </div>
        </div>

        <div className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm flex flex-col justify-between hover:border-emerald-500/50 hover:shadow-md transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">Direct Access</span>
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          </div>
          <div className="my-0 sm:my-0.5 flex items-baseline gap-1.5">
            <span className="font-bebas text-2xl sm:text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 leading-none tracking-wide">
              {directPercentage}%
            </span>
            <span className="text-[9px] sm:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">({directClicksTotal} clicks)</span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-zinc-200/60 dark:border-[#222225]">
            <span className="text-[9px] sm:text-[11px] md:text-xs text-zinc-500 dark:text-neutral-400 font-mono truncate">QR codes, SMS</span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0">Direct</span>
          </div>
        </div>

        <div className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm flex flex-col justify-between hover:border-blue-500/50 hover:shadow-md transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">Top Network</span>
            <div className="p-1 sm:p-1.5 rounded-full bg-blue-500/10 shrink-0">
              <Share2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-blue-500" />
            </div>
          </div>
          <div className="my-0 sm:my-0.5 flex items-center gap-1.5 truncate">
            <span className="font-bold text-zinc-900 dark:text-white text-base sm:text-lg md:text-xl truncate">
              {socialBreakdown.length > 0 && socialClicksTotal > 0 ? socialBreakdown[0].name : "Pending"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-zinc-200/60 dark:border-[#222225]">
            <span className="text-[9px] sm:text-[11px] md:text-xs text-blue-500 font-bold truncate">
              {socialBreakdown.length > 0 && socialClicksTotal > 0 ? `${socialBreakdown[0].percentage}%` : "0%"}
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono shrink-0">#1</span>
          </div>
        </div>

        <div className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm flex flex-col justify-between hover:border-purple-500/50 hover:shadow-md transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">Active Channels</span>
            <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-purple-500 shrink-0" />
          </div>
          <div className="my-0 sm:my-0.5 flex items-baseline gap-1.5">
            <span className="font-bebas text-2xl sm:text-3xl md:text-4xl font-black text-purple-600 dark:text-purple-400 leading-none tracking-wide">
              {analytics.topReferrers.length}
            </span>
            <span className="text-[9px] sm:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">sources</span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-zinc-200/60 dark:border-[#222225]">
            <span className="text-[9px] sm:text-[11px] md:text-xs text-purple-600 dark:text-purple-400 font-bold truncate">Multi-channel</span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono shrink-0">Channels</span>
          </div>
        </div>
      </KpiCardsCarousel>

      {/* 2-COLUMNS: SOCIAL NETWORKS & ALL REFERRERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dedicated Social Networks */}
        <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-5 shadow-sm dark:shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200 dark:border-[#222225]">
              <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#ff6600]" />
                <span>Social Media Performance</span>
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">
                {socialClicksTotal} social clicks
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {socialBreakdown.map((soc) => {
                const nameLow = (soc.name || "").toLowerCase();
                const color = nameLow.includes("linkedin")
                  ? "#0a66c2"
                  : nameLow.includes("twitter") || nameLow.includes("x.com") || nameLow.includes("t.co")
                  ? "#1d9bf0"
                  : nameLow.includes("whatsapp")
                  ? "#25d366"
                  : nameLow.includes("facebook")
                  ? "#1877f2"
                  : "#ff6600";

                return (
                  <div key={soc.name} className="p-3 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">{soc.name}</span>
                      <span className="text-xs font-bold font-mono" style={{ color }}>
                        {soc.percentage}% ({soc.count} clicks)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${soc.percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}

              {socialBreakdown.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-neutral-500 text-center py-8">
                  Waiting for social media shares...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* All Referrers & Channels */}
        <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-5 shadow-sm dark:shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-200 dark:border-[#222225]">
              <span className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>All Referrer Channels</span>
              </span>
              <span className="text-[11px] text-zinc-500 dark:text-neutral-400 font-mono">
                {analytics.topReferrers.length} sources
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {analytics.topReferrers.map((rf) => (
                <div key={rf.name} className="p-3 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-zinc-900 dark:text-white">{rf.name}</span>
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                      {rf.percentage}% ({rf.count} clicks)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${rf.percentage}%` }}
                    />
                  </div>
                </div>
              ))}

              {analytics.topReferrers.length === 0 && (
                <p className="text-xs text-zinc-500 dark:text-neutral-500 text-center py-8">
                  Waiting for referrer channel data...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED SOURCES CLICK STREAM TABLE */}
      <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-5 sm:p-6 shadow-sm dark:shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-zinc-200 dark:border-[#222225]">
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
              <span>Detailed Provenance Log</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-neutral-400">
              Click history with origin platform, exact referrers, location, and target links.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Channel */}
            <div className="flex items-center gap-1 p-1 rounded-[10px] bg-zinc-100 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] text-xs">
              {(["ALL", "social", "direct"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => {
                    setSelectedChannelFilter(ch);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-[10px] font-semibold transition-all cursor-pointer ${
                    selectedChannelFilter === ch
                      ? "bg-emerald-600 text-white font-bold"
                      : "text-zinc-600 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white"
                  }`}
                >
                  {ch === "ALL" ? "All" : ch === "social" ? "Social Media" : "Direct"}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-neutral-500" />
              <input
                type="text"
                placeholder="Filter source, link, city..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Column Masking */}
            <ColumnMaskToggle
              columns={SOURCE_COLUMNS}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
              onResetColumns={resetColumns}
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-[8px] border border-zinc-200 dark:border-[#222225]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-[#222225] bg-zinc-100/70 dark:bg-[#0e0e11]/80 text-zinc-700 dark:text-neutral-400 font-semibold text-[11px]">
                {visibleColumns.has("timestamp") && <th className="py-2.5 px-3">Timestamp</th>}
                {visibleColumns.has("channel") && <th className="py-2.5 px-3">Channel</th>}
                {visibleColumns.has("referrer") && <th className="py-2.5 px-3">Source / Referrer</th>}
                {visibleColumns.has("customer") && <th className="py-2.5 px-3">Customer / Buyer</th>}
                {visibleColumns.has("link") && <th className="py-2.5 px-3">Target Link</th>}
                {visibleColumns.has("location") && <th className="py-2.5 px-3">Location</th>}
                {visibleColumns.has("device") && <th className="py-2.5 px-3">Device</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#222225]/60 text-zinc-800 dark:text-neutral-200">
              {paginatedEvents.map((ev) => {
                const ref = ev.referrer || "Direct";
                const isSocial = ["linkedin", "twitter", "x.com", "whatsapp", "facebook", "instagram", "t.co"].some((k) => ref.toLowerCase().includes(k));

                return (
                  <tr key={ev.id} className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors">
                    {visibleColumns.has("timestamp") && (
                      <td className="py-3 px-3 font-mono text-zinc-500 dark:text-neutral-400 whitespace-nowrap">
                        {formatDateRelative(ev.timestamp)}
                      </td>
                    )}

                    {visibleColumns.has("channel") && (
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isSocial
                              ? "bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/30"
                              : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          {isSocial ? "Social Media" : "Direct / QR"}
                        </span>
                      </td>
                    )}

                    {visibleColumns.has("referrer") && (
                      <td className="py-3 px-3 font-semibold text-zinc-900 dark:text-white">
                        <span className="px-2 py-0.5 rounded-[10px] bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-[#27272a] text-[10px] font-mono">
                          {ref}
                        </span>
                      </td>
                    )}

                    {visibleColumns.has("customer") && (
                      <td className="py-3 px-3">
                        {(() => {
                          const name = ev.customerName || ev.customerFullName || ev.fullName;
                          const email = ev.customerEmail || ev.email;
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

                    {visibleColumns.has("device") && (
                      <td className="py-3 px-3 text-zinc-700 dark:text-neutral-400 capitalize">
                        {ev.device}
                      </td>
                    )}
                  </tr>
                );
              })}

              {paginatedEvents.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.size} className="py-8 text-center text-zinc-500 dark:text-neutral-500 text-xs">
                    No events matching criteria.
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
