"use client";

import React, { useState, useEffect, Suspense } from "react";
import {
  BarChart3,
  Globe2,
  Smartphone,
  TrendingUp,
  Download,
  Calendar,
  Sparkles,
  ArrowUpRight,
  Filter,
  Layers,
  Activity,
  DollarSign,
  Compass,
  Monitor,
  Share2,
  ExternalLink,
  Search,
  Check,
  Zap,
  MousePointerClick,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  PieChart as PieIcon,
  RefreshCw,
} from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { cfGetAnalytics, cfGetLinks, EMPTY_ANALYTICS, cfInvalidateCache } from "@/lib/cloudflare-api";
import { GlobalAnalytics, UserProfile, TimeRange, ShortLink } from "@/types";
import { formatNumber, formatCurrency, formatDateRelative, getCountryName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlobeSkeleton, AnalyticsPageSkeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/toast-provider";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { ColumnMaskToggle, ColumnDefinition } from "@/components/dashboard/analytics/column-mask-toggle";
import { KpiCardsCarousel } from "@/components/dashboard/analytics/kpi-cards-carousel";
import {
  computePeriodMetrics,
  generateTimelineForRange,
  generateEdgeTopCountries,
  generateEdgeTopCities,
  generateEdgeTopDevices,
  generateEdgeTopBrowsers,
  generateEdgeTopReferrers,
  generateEdgeLiveClickEvents,
} from "@/lib/analytics-generators";

const PERF_COLUMNS: ColumnDefinition[] = [
  { key: "slug", label: "Link & Slug", defaultVisible: true },
  { key: "clicks", label: "Total Clicks", defaultVisible: true },
  { key: "unique", label: "Unique Clicks", defaultVisible: true },
  { key: "conversions", label: "Conversions", defaultVisible: true },
  { key: "revenue", label: "Revenue (€)", defaultVisible: true },
  { key: "ctr", label: "Conv. Rate / Share", defaultVisible: true },
  { key: "action", label: "Action", defaultVisible: true },
];

const STREAM_COLUMNS: ColumnDefinition[] = [
  { key: "timestamp", label: "Timestamp", defaultVisible: true },
  { key: "slug", label: "Link", defaultVisible: true },
  { key: "customer", label: "Customer / Buyer", defaultVisible: true },
  { key: "location", label: "Location", defaultVisible: true },
  { key: "device", label: "Device & Browser", defaultVisible: true },
  { key: "source", label: "Source", defaultVisible: true },
  { key: "event", label: "Event", defaultVisible: true },
];

function getCountryFlag(code?: string) {
  if (!code || code === "XX" || code.length !== 2) return "🌐";
  try {
    const upper = code.toUpperCase();
    const codePoints = [...upper].map((c) => 127397 + c.charCodeAt(0));
    return String.fromCodePoint(...codePoints);
  } catch {
    return "🌐";
  }
}

const CobeGlobe = dynamic(
  () => import("@/components/globe/cobe-globe").then((mod) => mod.CobeGlobe),
  { ssr: false, loading: () => <GlobeSkeleton /> }
);

const StatsBarChart = dynamic(
  () => import("@/components/dashboard/stats-bar-chart").then((mod) => mod.StatsBarChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-[10px] bg-zinc-100 dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] animate-pulse flex items-center justify-center text-xs text-zinc-500 dark:text-neutral-400 font-mono">
        Loading Edge charts...
      </div>
    ),
  }
);

const AnalyticsPieChart = dynamic(
  () => import("@/components/analytics/pie-chart").then((mod) => mod.AnalyticsPieChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-[10px] bg-zinc-100 dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] animate-pulse flex items-center justify-center text-xs text-zinc-500 dark:text-neutral-400 font-mono">
        Loading distribution...
      </div>
    ),
  }
);

function AnalyticsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramLinkId = searchParams.get("linkId");
  const paramSlug = searchParams.get("slug");

  const [links, setLinks] = useState<ShortLink[]>([]);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("month");
  const [selectedLinkId, setSelectedLinkId] = useState<string>(() => paramLinkId || paramSlug || "all");
  const [analytics, setAnalytics] = useState<GlobalAnalytics>(EMPTY_ANALYTICS);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const userId = session?.user?.id;
  const plan = (session?.user as any)?.plan || "FREEMIUM";
  const isProPlan = plan === "PRO" || plan === "BUSINESS";

  // DataGrid state for Performance table
  const [searchLinkQuery, setSearchLinkQuery] = useState("");
  const [perfSortKey, setPerfSortKey] = useState<"clicks" | "conversions" | "revenue" | "ctr">("clicks");
  const [perfSortAsc, setPerfSortAsc] = useState(false);
  const [perfPage, setPerfPage] = useState(1);
  const perfPageSize = 5;

  // DataGrid state for Live Click Stream table
  const [streamSearch, setStreamSearch] = useState("");
  const [streamPage, setStreamPage] = useState(1);
  const streamPageSize = 5;

  // Column Visibility States
  const [visiblePerfCols, setVisiblePerfCols] = useState<Set<string>>(
    new Set(PERF_COLUMNS.map((c) => c.key))
  );
  const [visibleStreamCols, setVisibleStreamCols] = useState<Set<string>>(
    new Set(STREAM_COLUMNS.map((c) => c.key))
  );

  const togglePerfCol = (key: string) => {
    setVisiblePerfCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 2) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleStreamCol = (key: string) => {
    setVisibleStreamCols((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 2) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  // Synchronize selectedLinkId if URL parameters change (e.g. navigation from /links or browser back/forward)
  useEffect(() => {
    const qLinkId = searchParams.get("linkId");
    const qSlug = searchParams.get("slug");
    if (qLinkId) {
      setSelectedLinkId(qLinkId);
    } else if (qSlug) {
      setSelectedLinkId(qSlug);
    } else {
      setSelectedLinkId("all");
    }
  }, [searchParams]);

  const refreshData = async (range: TimeRange = selectedRange, linkId: string = selectedLinkId, isBackground = false) => {
    if (!userId) return;
    if (!isBackground) setIsLoading(true);

    try {
      const periodParam = range === "day" ? "1d" : range === "week" ? "7d" : range === "year" ? "365d" : "30d";
      const [analyticsRes, linksRes] = await Promise.all([
        cfGetAnalytics(userId, periodParam, linkId !== "all" ? linkId : undefined).catch(() => null),
        cfGetLinks(userId).catch(() => null),
      ]);

      const listData = Array.isArray(linksRes?.data) ? linksRes.data : Array.isArray((linksRes?.data as any)?.data) ? (linksRes?.data as any).data : [];
      const fetchedLinks: ShortLink[] = listData.map((l: any) => ({
        id: l.id,
        userId: l.user_id || userId,
        slug: l.slug,
        domainName: l.domain_name || "lsho.cc",
        shortUrl: typeof window !== "undefined" ? `${window.location.origin}/r/${l.slug}` : `http://localhost:3000/r/${l.slug}`,
        targetUrl: l.target_url,
        clicksCount: l.clicks_count || l.clicksCount || l.clicks || 0,
        uniqueClicks: l.unique_clicks || 0,
        conversionsCount: l.conversions_count || 0,
        revenue: l.revenue || 0,
        routingRules: l.routing_rules
          ? (typeof l.routing_rules === "string" ? JSON.parse(l.routing_rules) : l.routing_rules)
          : (typeof l.routingRules === "string" ? JSON.parse(l.routingRules) : l.routingRules || []),
        geoTargeting: l.geo_targeting
          ? (typeof l.geo_targeting === "string" ? JSON.parse(l.geo_targeting) : l.geo_targeting)
          : (typeof l.geoTargeting === "string" ? JSON.parse(l.geoTargeting) : l.geoTargeting || {}),
        deviceTargeting: l.device_targeting
          ? (typeof l.device_targeting === "string" ? JSON.parse(l.device_targeting) : l.device_targeting)
          : (typeof l.deviceTargeting === "string" ? JSON.parse(l.deviceTargeting) : l.deviceTargeting || {}),
        isPasswordProtected: Boolean(l.is_password_protected || l.isPasswordProtected || l.has_password || l.hasPassword || l.password),
        isCloaked: Boolean(l.is_cloaked || l.isCloaked),
        metaTitle: l.meta_title || l.metaTitle || l.og_title || l.ogTitle,
        ogTitle: l.og_title || l.ogTitle || l.meta_title || l.metaTitle,
        ogDescription: l.og_description || l.ogDescription,
        ogImage: l.og_image || l.ogImage,
        hideReferrer: Boolean(l.hide_referrer),
        tags: l.tags ? (typeof l.tags === "string" ? JSON.parse(l.tags) : l.tags) : [],
        expiresAt: l.expires_at,
        isActive: Boolean(l.is_active !== 0),
        created_at: l.created_at || new Date().toISOString(),
      }));

      setLinks(fetchedLinks);

      // Match target link if specific link is selected
      const targetLink = linkId !== "all"
        ? fetchedLinks.find((l) => l.id === linkId || l.slug === linkId)
        : null;

      if (targetLink && targetLink.id !== linkId && linkId !== "all") {
        setSelectedLinkId(targetLink.id);
      }

      if (analyticsRes?.data || fetchedLinks.length > 0) {
        const d = analyticsRes?.data || {};
        const isAll = !targetLink || linkId === "all";

        // Global metrics across all links
        const sumLinksClicks = fetchedLinks.reduce((acc, l) => acc + (l.clicksCount || 0), 0);
        const sumUniqueClicks = fetchedLinks.reduce((acc, l) => acc + (l.uniqueClicks || Math.floor((l.clicksCount || 0) * 0.8)), 0);
        const sumRevenue = fetchedLinks.reduce((acc, l) => acc + (l.revenue || 0), 0);
        const sumConversions = fetchedLinks.reduce((acc, l) => acc + (l.conversionsCount || 0), 0);
        const globalCtr = sumLinksClicks > 0 ? Number(((sumConversions / sumLinksClicks) * 100).toFixed(1)) : 0;
        const globalEpc = sumLinksClicks > 0 ? Number((sumRevenue / sumLinksClicks).toFixed(2)) : 0;

        // Specific link metrics
        const linkClicks = targetLink ? (targetLink.clicksCount || 0) : 0;
        const linkUnique = targetLink ? (targetLink.uniqueClicks || Math.floor(linkClicks * 0.8)) : 0;
        const linkRevenue = targetLink ? (targetLink.revenue || 0) : 0;
        const linkConversions = targetLink ? (targetLink.conversionsCount || 0) : 0;
        const linkCtr = linkClicks > 0 ? Number(((linkConversions / linkClicks) * 100).toFixed(1)) : 0;
        const linkEpc = linkClicks > 0 ? Number((linkRevenue / linkClicks).toFixed(2)) : 0;

        // Resilient total & unique: when single link selected, never fall back to sum of ALL links!
        const baseTotal = isAll
          ? ((d.totalClicks ?? d.total_clicks) || sumLinksClicks)
          : ((d.totalClicks ?? d.total_clicks) || linkClicks);

        const baseUnique = baseTotal === 0
          ? 0
          : (isAll
              ? ((d.uniqueClicks ?? d.unique_clicks) ?? sumUniqueClicks ?? baseTotal)
              : ((d.uniqueClicks ?? d.unique_clicks) ?? linkUnique ?? baseTotal));

        const baseRevenue = isAll
          ? ((d.totalRevenue ?? d.total_revenue) ?? sumRevenue)
          : ((d.totalRevenue ?? d.total_revenue) ?? linkRevenue);

        const baseConversions = isAll
          ? ((d.conversionsCount ?? d.conversions_count) ?? sumConversions)
          : ((d.conversionsCount ?? d.conversions_count) ?? linkConversions);

        // Dynamically compute period metrics (24h, 7j, 30j, 1an)
        const periodStats = computePeriodMetrics(range, baseTotal, baseUnique, baseRevenue, baseConversions);
        const total = periodStats.periodClicks;
        const unique = periodStats.periodUniques;
        const revenue = periodStats.periodRevenue;
        const avgCtr = periodStats.ctr;
        const epc = periodStats.epc;

        // Dynamic time-series timeline for selected period
        const rawClicksDay = d.clicksByDay ?? d.clicks_by_day ?? [];
        const clicksByDay = generateTimelineForRange(range, total, unique, rawClicksDay);

        // Geographic breakdowns with coordinates that light up the 3D Cobe Globe
        // Geographic breakdowns with coordinates that light up the 3D Cobe Globe
        const rawCountries = d.topCountries ?? d.top_countries ?? [];
        const countries = (rawCountries.length > 0)
          ? rawCountries.map((c: any) => {
              const code = (c.code || c.country_code || c.country || "XX").toUpperCase();
              const cnt = c.count || c.clicks || 0;
              const pct = c.percentage !== undefined && c.percentage !== null ? c.percentage : (total > 0 ? Math.round((cnt / total) * 100) : 0);
              return {
                code,
                name: getCountryName(code),
                count: cnt,
                percentage: pct,
              };
            })
          : [];

        // Top Cities breakdown
        const rawCities = d.topCities ?? d.top_cities ?? [];
        const cities = (rawCities.length > 0)
          ? rawCities.map((ci: any) => ({
              city: ci.city || ci.name || "Unknown",
              countryCode: (ci.countryCode || ci.country_code || "XX").toUpperCase(),
              count: ci.count || ci.clicks || 0,
              percentage: ci.percentage !== undefined ? ci.percentage : (total > 0 ? Math.round(((ci.count || ci.clicks || 0) / total) * 100) : 0),
            }))
          : [];

        // Top Devices breakdown
        const rawDevices = d.topDevices ?? d.top_devices ?? [];
        const devices = (rawDevices.length > 0)
          ? rawDevices.map((dv: any) => ({
              label: dv.label || dv.device || dv.name || "Desktop",
              device: dv.device || dv.label || dv.name || "Desktop",
              count: dv.count || dv.clicks || 0,
              percentage: dv.percentage !== undefined ? dv.percentage : (total > 0 ? Math.round(((dv.count || dv.clicks || 0) / total) * 100) : 0),
            }))
          : [];

        // Top Browsers breakdown
        const rawBrowsers = d.topBrowsers ?? d.top_browsers ?? [];
        const browsers = (rawBrowsers.length > 0)
          ? rawBrowsers.map((br: any) => ({
              name: br.name || br.browser || "Chrome",
              browser: br.browser || br.name || "Chrome",
              count: br.count || br.clicks || 0,
              percentage: br.percentage !== undefined ? br.percentage : (total > 0 ? Math.round(((br.count || br.clicks || 0) / total) * 100) : 0),
            }))
          : [];

        // Top Referrers breakdown
        const rawReferrers = d.topReferrers ?? d.top_referrers ?? [];
        const referrers = (rawReferrers.length > 0)
          ? rawReferrers.map((rf: any) => ({
              source: rf.source || rf.referrer || rf.name || "Direct",
              referrer: rf.referrer || rf.source || rf.name || "Direct",
              count: rf.count || rf.clicks || 0,
              percentage: rf.percentage !== undefined ? rf.percentage : (total > 0 ? Math.round(((rf.count || rf.clicks || 0) / total) * 100) : 0),
            }))
          : [];

        // Live Event Stream
        const rawLiveEvents = d.liveClickEvents ?? d.live_click_events ?? [];
        let finalLiveEvents: any[] = [];

        if (rawLiveEvents.length > 0) {
          const allMappedEvents = rawLiveEvents.map((ev: any) => {
            const cCode = (ev.country_code || ev.countryCode || "XX").toUpperCase();
            return {
              id: ev.id || `${Date.now()}-${Math.random()}`,
              linkId: ev.linkId || ev.link_id || ev.slug || "",
              timestamp: ev.timestamp || new Date().toISOString(),
              slug: ev.slug || "link",
              countryCode: cCode,
              countryName: getCountryName(cCode),
              city: ev.city || "—",
              device: ev.device || "desktop",
              os: ev.os || "Windows",
              browser: ev.browser || "Chrome",
              referrer: ev.referrer || "Direct",
              ipMasked: ev.ipMasked || ev.ip_masked || "•••.•••.•••",
              conversionAmount: ev.conversionAmount || ev.conversion_amount,
              customerEmail: ev.customerEmail || ev.email || ev.customer_email || null,
              customerName: ev.customerName || ev.customerFullName || ev.fullName || ev.name || ev.customer_name || null,
              customerFullName: ev.customerFullName || ev.customerName || ev.fullName || ev.name || null,
              email: ev.customerEmail || ev.email || ev.customer_email || null,
              fullName: ev.customerFullName || ev.customerName || ev.fullName || ev.name || null,
            };
          });

          finalLiveEvents = (!isAll && targetLink)
            ? allMappedEvents.filter((ev: any) => ev.slug?.toLowerCase() === targetLink.slug?.toLowerCase())
            : allMappedEvents;
        } else {
          finalLiveEvents = [];
        }

        setAnalytics({
          totalClicks: total,
          clicksGrowth: 0,
          uniqueClicks: unique,
          uniqueClicksGrowth: 0,
          trackedRevenue: revenue,
          revenueGrowth: 0,
          avgCtr: avgCtr,
          ctrGrowth: 0,
          bounceRate: d.bounceRate ?? d.bounce_rate ?? 0,
          epc: epc,
          avgEngagementTime: d.avgEngagementTime || "0s",
          clicksByDay,
          topCountries: countries,
          topCities: cities,
          topDevices: devices,
          topBrowsers: browsers,
          topReferrers: referrers,
          liveClickEvents: finalLiveEvents,
          recentConversions: [],
        });
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && userId) {
      refreshData();
    }
  }, [status, userId, selectedRange, selectedLinkId]);

  // Listen for global link creation/update events to refresh analytics and link selectors
  useEffect(() => {
    const handleUpdate = () => {
      cfInvalidateCache();
      refreshData(selectedRange, selectedLinkId, true);
    };

    window.addEventListener("lshorter_links_updated", handleUpdate);
    window.addEventListener("lshorter_data_change", handleUpdate);

    return () => {
      window.removeEventListener("lshorter_links_updated", handleUpdate);
      window.removeEventListener("lshorter_data_change", handleUpdate);
    };
  }, [userId, selectedRange, selectedLinkId]);

  const handleRangeChange = (range: TimeRange) => {
    setSelectedRange(range);
    refreshData(range, selectedLinkId, true);
  };

  const handleLinkSelectChange = (newLinkId: string) => {
    setSelectedLinkId(newLinkId);
    setPerfPage(1);
    setStreamPage(1);

    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (newLinkId === "all") {
        params.delete("linkId");
        params.delete("slug");
      } else {
        params.set("linkId", newLinkId);
        const target = links.find((l) => l.id === newLinkId || l.slug === newLinkId);
        if (target?.slug) {
          params.set("slug", target.slug);
        }
      }
      const queryStr = params.toString();
      router.replace(`/dashboard/analytics${queryStr ? `?${queryStr}` : ""}`, { scroll: false });
    }
    refreshData(selectedRange, newLinkId, true);
  };

  const handleExportCSV = async () => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        reason: "Raw CSV data export is reserved for Pro Plan subscribers.",
        featureName: "Analytics CSV Export",
      });
      return;
    }

    setIsExporting(true);
    try {
      const activeLink = selectedLinkId === "all" ? "" : selectedLinkId;
      const response = await fetch(
        `/api/analytics/export?format=excel&userId=${encodeURIComponent(userId || "")}&linkId=${encodeURIComponent(activeLink)}&range=${encodeURIComponent(selectedRange)}`
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server error (${response.status})`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lshorter_analytics_${selectedRange}_${new Date().toISOString().split("T")[0]}.xls`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showToast.success("Excel report with live data downloaded!");
    } catch (e: any) {
      console.error("Export error:", e);
      showToast.error(e?.message || "Error exporting file");
    } finally {
      setIsExporting(false);
    }
  };

  const selectedLinkObj = selectedLinkId !== "all"
    ? links.find((l) => l.id === selectedLinkId || l.slug === selectedLinkId)
    : undefined;

  const rangeLabels: Record<TimeRange, string> = {
    day: "Last 24h",
    week: "Last 7 days",
    month: "Last 30 days",
    year: "Last 12 months",
  };

  const linkFilterParam = selectedLinkObj
    ? `?linkId=${encodeURIComponent(selectedLinkObj.id)}&slug=${encodeURIComponent(selectedLinkObj.slug)}`
    : "";

  // Performance DataGrid Filtering & Sorting
  const filteredLinks = (links || [])
    .filter((l) => {
      if (selectedLinkId !== "all") {
        const matchesSelected = l.id === selectedLinkId || l.slug === selectedLinkId;
        if (!matchesSelected) return false;
      }
      return (
        (l?.slug || "").toLowerCase().includes(searchLinkQuery.toLowerCase()) ||
        (l?.targetUrl || "").toLowerCase().includes(searchLinkQuery.toLowerCase())
      );
    })
    .sort((a, b) => {
      let aVal = a?.clicksCount || 0;
      let bVal = b?.clicksCount || 0;
      if (perfSortKey === "conversions") {
        aVal = a?.conversionsCount || 0;
        bVal = b?.conversionsCount || 0;
      } else if (perfSortKey === "revenue") {
        aVal = a?.revenue || 0;
        bVal = b?.revenue || 0;
      } else if (perfSortKey === "ctr") {
        aVal = (a?.clicksCount || 0) > 0 ? (a?.conversionsCount || 0) / a.clicksCount : 0;
        bVal = (b?.clicksCount || 0) > 0 ? (b?.conversionsCount || 0) / b.clicksCount : 0;
      }
      return perfSortAsc ? aVal - bVal : bVal - aVal;
    });

  const totalPerfPages = Math.max(1, Math.ceil(filteredLinks.length / perfPageSize));
  const paginatedPerfLinks = filteredLinks.slice((perfPage - 1) * perfPageSize, perfPage * perfPageSize);

  // Live Stream Filtering
  const filteredEvents = (analytics?.liveClickEvents || []).filter((e) => {
    if (selectedLinkObj && e?.slug) {
      if (e.slug.toLowerCase() !== selectedLinkObj.slug.toLowerCase()) {
        return false;
      }
    }
    const q = streamSearch.toLowerCase();
    const custName = (e?.customerName || e?.customerFullName || e?.fullName || "").toLowerCase();
    const custEmail = (e?.customerEmail || e?.email || "").toLowerCase();
    return (
      (e?.slug || "").toLowerCase().includes(q) ||
      (e?.countryName || "").toLowerCase().includes(q) ||
      (e?.city || "").toLowerCase().includes(q) ||
      (e?.referrer || "").toLowerCase().includes(q) ||
      custName.includes(q) ||
      custEmail.includes(q)
    );
  });
  const totalStreamPages = Math.max(1, Math.ceil(filteredEvents.length / streamPageSize));
  const paginatedEvents = filteredEvents.slice((streamPage - 1) * streamPageSize, streamPage * streamPageSize);

  if (status === "loading" || isLoading) {
    return <AnalyticsPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in pb-16">
      {/* Top Header with Per-Link Selector & Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-[#222225]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-wide">
              Analytics Hub & Edge Intelligence
            </h1>
            <span className="px-2 py-0.5 rounded bg-brand-light text-brand text-[10px] font-bold">
              REAL TIME
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
            Traffic, conversion, attribution, and pinpoint geolocation data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Link Filter Selector with theme styling */}
          <div className="flex items-center gap-2 bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] rounded-[10px] px-3 py-1.5 text-xs shadow-sm">
            <Filter className="w-3.5 h-3.5 text-brand" />
            <span className="text-zinc-500 dark:text-neutral-400 font-medium">Link:</span>
            <select
              value={selectedLinkObj ? selectedLinkObj.id : "all"}
              onChange={(e) => handleLinkSelectChange(e.target.value)}
              className="bg-transparent text-zinc-900 dark:text-white font-semibold focus:outline-none cursor-pointer border-none"
            >
              <option value="all" className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white">All links ({links.length})</option>
              {links.map((l) => (
                <option key={l.id} value={l.id} className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white">
                  {l.slug} ({formatNumber(l.clicksCount)} clicks)
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <Button
            onClick={async () => {
              setIsRefreshing(true);
              cfInvalidateCache("/api/analytics");
              await refreshData(selectedRange, selectedLinkId);
              setIsRefreshing(false);
              showToast.success("Analytics updated!");
            }}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#141416] hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-800 dark:text-neutral-200 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand" : "text-zinc-400 dark:text-neutral-400"}`} />
            <span>Refresh</span>
          </Button>

          {/* Export Button */}
          <Button
            onClick={handleExportCSV}
            disabled={isExporting}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#141416] hover:bg-zinc-50 dark:hover:bg-white/5 text-zinc-800 dark:text-neutral-200 shadow-sm"
          >
            <Download className="w-3.5 h-3.5 text-brand" />
            <span>{isExporting ? "Exporting..." : "Export CSV (Excel)"}</span>
            {!isProPlan && (
              <span className="px-1.5 py-0.2 rounded bg-brand-light text-brand text-[9px] font-bold">
                PRO
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Selected Link Banner (if specific link selected) */}
      {selectedLinkObj && (
        <div className="p-4 rounded-[10px] bg-white dark:bg-[#141416] border border-brand-subtle flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[10px] bg-brand flex items-center justify-center font-bold text-white shadow-sm">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-zinc-900 dark:text-white text-sm">{selectedLinkObj.slug}</span>
                <Badge variant={selectedLinkObj.isActive ? "active" : "inactive"}>
                  {selectedLinkObj.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
              <p className="text-xs text-zinc-500 dark:text-neutral-400 font-mono">
                {selectedLinkObj.domainName}/{selectedLinkObj.slug} → {selectedLinkObj.targetUrl}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleLinkSelectChange("all")}
            className="text-xs text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white underline cursor-pointer"
          >
            Reset to global filter
          </button>
        </div>
      )}

      {/* Time Range Filter Bar (Day, Week, Month, Year) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 sm:p-2.5 rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-1.5 px-1 sm:px-2 text-zinc-500 dark:text-neutral-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-brand" />
              <span className="whitespace-nowrap">Period:</span>
            </span>
            <span className="sm:hidden text-zinc-500 dark:text-neutral-400 text-[11px] font-medium">
              {rangeLabels[selectedRange]}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-[#0d0d10] border border-zinc-200 dark:border-[#1f1f24] rounded-[10px] sm:flex sm:items-center sm:bg-transparent sm:border-0 sm:p-0">
            <button
              type="button"
              onClick={() => handleRangeChange("day")}
              className={`text-center py-1.5 px-2 sm:px-3 rounded-[10px] font-semibold transition-all cursor-pointer text-xs ${
                selectedRange === "day"
                  ? "bg-brand text-white shadow-md font-bold"
                  : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1f1f24]"
              }`}
            >
              24h
            </button>

            <button
              type="button"
              onClick={() => handleRangeChange("week")}
              className={`text-center py-1.5 px-2 sm:px-3 rounded-[10px] font-semibold transition-all cursor-pointer text-xs ${
                selectedRange === "week"
                  ? "bg-brand text-white shadow-md font-bold"
                  : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1f1f24]"
              }`}
            >
              7 days
            </button>

            <button
              type="button"
              onClick={() => handleRangeChange("month")}
              className={`text-center py-1.5 px-2 sm:px-3 rounded-[10px] font-semibold transition-all cursor-pointer text-xs ${
                selectedRange === "month"
                  ? "bg-brand text-white shadow-md font-bold"
                  : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1f1f24]"
              }`}
            >
              30 days
            </button>

            <button
              type="button"
              onClick={() => handleRangeChange("year")}
              className={`text-center py-1.5 px-2 sm:px-3 rounded-[10px] font-semibold transition-all cursor-pointer text-xs ${
                selectedRange === "year"
                  ? "bg-brand text-white shadow-md font-bold"
                  : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1f1f24]"
              }`}
            >
              1 year
            </button>
          </div>
        </div>

        <span className="hidden sm:inline-block text-zinc-500 dark:text-neutral-400 text-xs px-2 font-medium">
          {rangeLabels[selectedRange]}
        </span>
      </div>

      {/* 6 Key Precision Metrics Cards with Auto-Scrolling Infinite Marquee & Drag */}
      <KpiCardsCarousel autoScroll={true} speed={0.9} pauseOnHover={false}>
        {/* Card 1: Total Clicks */}
        <div className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm flex flex-col justify-between hover:border-brand-subtle hover:shadow-md transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">Total Clicks</span>
            <span className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-brand animate-pulse" />
              <span className="text-[9px] sm:text-[11px] font-mono text-zinc-500 dark:text-neutral-400 hidden sm:inline">LIVE</span>
            </span>
          </div>
          <div className="my-0 sm:my-0.5">
            <span className="font-bebas text-2xl sm:text-3xl md:text-4xl font-black text-brand leading-none tracking-wide">
              {formatNumber(analytics.totalClicks)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-zinc-200/60 dark:border-[#222225]">
            <span className="text-[9px] sm:text-[11px] md:text-xs font-bold text-emerald-500 dark:text-emerald-400 truncate">
              {analytics.totalClicks > 0 ? (analytics.clicksGrowth > 0 ? `↑ +${analytics.clicksGrowth}%` : `+${analytics.totalClicks} clicks`) : "0% volume"}
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono shrink-0">Global</span>
          </div>
        </div>

        {/* Card 2: Unique Clicks */}
        <div className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm flex flex-col justify-between hover:border-blue-500/50 hover:shadow-md transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">Unique Clicks</span>
            <span className="text-[8px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-mono font-semibold shrink-0">100%</span>
          </div>
          <div className="my-0 sm:my-0.5">
            <span className="font-bebas text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-none tracking-wide">
              {formatNumber(analytics.uniqueClicks)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-zinc-200/60 dark:border-[#222225]">
            <span className="text-[9px] sm:text-[11px] md:text-xs font-bold text-emerald-500 dark:text-emerald-400 truncate">
              {analytics.uniqueClicks > 0 ? (analytics.uniqueClicksGrowth > 0 ? `↑ +${analytics.uniqueClicksGrowth}%` : `100% unique`) : "0%"}
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono shrink-0">IPs</span>
          </div>
        </div>

        {/* Card 3: Tracked Revenue (STAR METRIC) */}
        <Link
          href={`/dashboard/analytics/revenue${linkFilterParam}`}
          className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border-2 border-emerald-500/60 dark:border-emerald-500/60 shadow-sm dark:shadow-[0_0_20px_-3px_rgba(16,185,129,0.25)] hover:border-emerald-500 transition-all duration-200 flex flex-col justify-between group relative overflow-hidden cursor-pointer select-none"
        >
          <div className="absolute top-0 right-0 w-14 sm:w-16 h-14 sm:h-16 bg-emerald-500/10 rounded-bl-full pointer-events-none transition-transform group-hover:scale-110"></div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">Revenue</span>
            <div className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1 sm:px-1.5 py-0.5 rounded-full shrink-0">
              <span>Details</span>
              <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <div className="my-0 sm:my-0.5">
            <span className="font-bebas text-2xl sm:text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 leading-none tracking-wide">
              {formatCurrency(analytics.trackedRevenue)}
            </span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-emerald-500/20">
            <span className="text-[9px] sm:text-[11px] md:text-xs font-bold text-emerald-600/90 dark:text-emerald-300 truncate">
              {analytics.trackedRevenue > 0 ? `↑ +${analytics.revenueGrowth}%` : "0 conversions"}
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-mono shrink-0">Net</span>
          </div>

          {/* Tooltip on Hover */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-30 whitespace-nowrap bg-popover dark:bg-[#1f1f24] text-popover-foreground dark:text-white px-3 py-1.5 rounded-[8px] border border-emerald-500/50 shadow-2xl text-[11px] font-medium flex items-center gap-1.5 hidden md:flex">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Click to open deep revenue & customer analytics →</span>
          </div>
        </Link>

        {/* Card 4: Conversion Rate */}
        <div className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm flex flex-col justify-between hover:border-purple-500/50 hover:shadow-md transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">Conversion</span>
            <span className="text-[8px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-500 font-mono font-semibold shrink-0">CR</span>
          </div>
          <div className="my-0 sm:my-0.5">
            <span className="font-bebas text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-none tracking-wide">
              {analytics.avgCtr}%
            </span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-zinc-200/60 dark:border-[#222225]">
            <span className="text-[9px] sm:text-[11px] md:text-xs font-bold text-zinc-500 dark:text-neutral-400 truncate">
              {analytics.avgCtr > 0 ? `${analytics.avgCtr}%` : "Pending"}
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono shrink-0">Avg</span>
          </div>
        </div>

        {/* Card 5: EPC (Earn / Click) */}
        <Link
          href={`/dashboard/analytics/revenue${linkFilterParam}`}
          className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border-2 border-emerald-500/40 dark:border-emerald-500/40 hover:border-emerald-500 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between group relative cursor-pointer select-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">EPC (Earn/Click)</span>
            <div className="flex items-center gap-0.5 sm:gap-1 text-[8px] sm:text-[10px] md:text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1 sm:px-1.5 py-0.5 rounded-full shrink-0">
              <span>Details</span>
              <ArrowUpRight className="w-2.5 h-2.5 sm:w-3 sm:h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </div>
          </div>
          <div className="my-0 sm:my-0.5">
            <span className="font-bebas text-2xl sm:text-3xl md:text-4xl font-black text-emerald-600 dark:text-emerald-400 leading-none tracking-wide">
              {analytics.epc}€
            </span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-emerald-500/20">
            <span className="text-[9px] sm:text-[11px] md:text-xs font-bold text-zinc-500 dark:text-neutral-400 truncate">
              Avg. / click
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] text-emerald-600/80 dark:text-emerald-400/80 font-mono shrink-0">EPC</span>
          </div>

          {/* Tooltip on Hover */}
          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 z-30 whitespace-nowrap bg-popover dark:bg-[#1f1f24] text-popover-foreground dark:text-white px-3 py-1.5 rounded-[8px] border border-emerald-500/50 shadow-2xl text-[11px] font-medium flex items-center gap-1.5 hidden md:flex">
            <Sparkles className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span>Click to open deep revenue & customer analytics →</span>
          </div>
        </Link>

        {/* Card 6: Bounce Rate */}
        <div className="shrink-0 w-[170px] sm:w-[240px] md:w-[280px] lg:w-[300px] h-[100px] sm:h-[120px] md:h-[135px] lg:h-[145px] p-2.5 sm:p-3.5 md:p-4 rounded-[10px] sm:rounded-[12px] md:rounded-[14px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm flex flex-col justify-between hover:border-amber-500/50 hover:shadow-md transition-all select-none">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs md:text-sm font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">Bounce</span>
            <span className="text-[8px] sm:text-[10px] md:text-xs px-1 sm:px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-500 font-mono font-semibold shrink-0">Bounce</span>
          </div>
          <div className="my-0 sm:my-0.5">
            <span className="font-bebas text-2xl sm:text-3xl md:text-4xl font-black text-zinc-900 dark:text-white leading-none tracking-wide">
              {analytics.bounceRate}%
            </span>
          </div>
          <div className="flex items-center justify-between pt-0.5 sm:pt-1 border-t border-zinc-200/60 dark:border-[#222225]">
            <span className="text-[9px] sm:text-[11px] md:text-xs font-bold text-emerald-500 dark:text-emerald-400 truncate">
              {analytics.totalClicks > 0 ? "High retention" : "< 30%"}
            </span>
            <span className="text-[8px] sm:text-[10px] md:text-[11px] text-zinc-500 dark:text-neutral-400 font-mono shrink-0">Engage</span>
          </div>
        </div>
      </KpiCardsCarousel>

      {/* 3D GLOBE SHOWCASE & TIME SERIES HISTOGRAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 3D Cobe Globe (5 cols) */}
        <div className="lg:col-span-5 rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-6 flex flex-col justify-between shadow-sm dark:shadow-2xl relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                <Globe2 className="w-4 h-4" />
                <span>Interactive 3D Globe</span>
              </span>
              <span className="text-[10px] text-zinc-500 dark:text-neutral-400">Drag to rotate</span>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Live Global Traffic</h3>
            <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
              Live visualization of countries where your clicks originate with glowing markers.
            </p>
          </div>

          <div className="my-2 flex items-center justify-center">
            <CobeGlobe className="max-h-[290px] max-w-[290px]" topCountries={analytics.topCountries} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-zinc-200 dark:border-[#222225]">
            <div className="p-2.5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e]">
              <span className="text-[10px] text-zinc-500 dark:text-neutral-400">Top Region</span>
              <p className="font-bold text-zinc-900 dark:text-white text-sm truncate">
                {analytics.topCountries.length > 0 ? analytics.topCountries[0].name : "Pending"}
              </p>
            </div>
            <div className="p-2.5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e]">
              <span className="text-[10px] text-zinc-500 dark:text-neutral-400">Edge Latency</span>
              <p className="font-bold text-emerald-500 dark:text-emerald-400 text-sm">&lt; 0.8 ms</p>
            </div>
          </div>
        </div>

        {/* Dynamic Histogram Chart (7 cols) */}
        <div className="lg:col-span-7">
          <StatsBarChart
            data={analytics.clicksByDay}
            title={`Click Trend (${rangeLabels[selectedRange]})`}
            subtitle={selectedLinkObj ? `Link: ${selectedLinkObj.slug}` : "All links combined"}
          />
        </div>
      </div>

      {/* NEW: DONUT / PIE CHART COMPONENT & Granular Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Donut / Pie Chart (6 cols) */}
        <div className="lg:col-span-6">
          <AnalyticsPieChart
            topLinksData={
              selectedLinkObj
                ? [
                    {
                      label: `/${selectedLinkObj.slug}`,
                      value: selectedLinkObj.clicksCount || 1,
                      color: "var(--brand-primary)",
                      sublabel: selectedLinkObj.targetUrl,
                    },
                  ]
                : links
                    .filter((l) => (l.clicksCount || 0) > 0)
                    .map((l, i) => ({
                      label: `/${l.slug}`,
                      value: l.clicksCount || 0,
                      color: ["var(--brand-primary)", "#ff8833", "#ffa366", "#3b82f6", "#10b981", "#8b5cf6"][i % 6],
                      sublabel: l.targetUrl,
                    }))
            }
            channelsData={analytics.topReferrers.map((r, i) => ({
              label: r.referrer || "Direct",
              value: r.clicks || (r as any).count || 0,
              color: ["var(--brand-primary)", "#3b82f6", "#10b981", "#eab308", "#ec4899"][i % 5],
              sublabel: `${r.clicks || (r as any).count || 0} clicks`,
            }))}
          />
        </div>

        {/* Mini Cards (6 cols) with direct links to dedicated detailed pages */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Revenue & Customer Analysis (Links to /dashboard/analytics/revenue) */}
          <Link
            href={`/dashboard/analytics/revenue${linkFilterParam}`}
            className="sm:col-span-2 p-4 rounded-xl bg-gradient-to-r from-emerald-500/[0.06] via-white to-white dark:from-emerald-950/25 dark:via-[#141416] dark:to-[#141416] hover:from-emerald-500/[0.12] dark:hover:from-emerald-900/35 border border-emerald-500/30 hover:border-emerald-500 dark:hover:border-emerald-400 flex items-center justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99] group cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 group-hover:scale-110 group-hover:bg-emerald-500/30 transition-all duration-300 shrink-0 shadow-sm">
                <DollarSign className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    Revenue & Customer Analysis
                  </h4>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[9px] font-bold tracking-wider">
                    DETAILED
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-neutral-400 truncate mt-0.5">
                  Total: <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(analytics.trackedRevenue)}</strong> • {analytics.epc}€/click (EPC) • Avatars & buyers
                </p>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-emerald-600 dark:text-emerald-400 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300 shrink-0 ml-2" />
          </Link>

          {/* Top Countries (Links to /dashboard/analytics/geo) */}
          <Link
            href={`/dashboard/analytics/geo${linkFilterParam}`}
            className="p-5 rounded-xl bg-white dark:bg-[#141416] hover:bg-zinc-50/80 dark:hover:bg-[#17171b] border border-zinc-200 dark:border-[#222225] hover:border-brand/70 dark:hover:border-brand/70 flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-brand/10 active:scale-[0.99] group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-brand transition-colors flex items-center gap-1.5">
                  <span>Top Countries</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 text-brand" />
                </h4>
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/[0.04] group-hover:bg-brand/10 flex items-center justify-center transition-colors">
                  <Compass className="w-4 h-4 text-zinc-400 dark:text-neutral-500 group-hover:text-brand group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {analytics.topCountries.length === 0 ? (
                  <span className="text-xs text-zinc-500 dark:text-neutral-400 italic">Waiting for traffic...</span>
                ) : (
                  analytics.topCountries.slice(0, 4).map((c) => (
                    <div key={c.code} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-brand w-5">
                          {c.code}
                        </span>
                        <span className="text-zinc-800 dark:text-neutral-200">{c.name}</span>
                      </div>
                      <span className="font-mono text-zinc-500 dark:text-neutral-400 text-[11px]">
                        {c.percentage}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <span className="text-[10px] text-brand font-semibold mt-3 pt-2.5 border-t border-zinc-100 dark:border-[#222225] flex items-center justify-between">
              <span>View map & continents</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </span>
          </Link>

          {/* Top Cities (Links to /dashboard/analytics/geo) */}
          <Link
            href={`/dashboard/analytics/geo${linkFilterParam}`}
            className="p-5 rounded-xl bg-white dark:bg-[#141416] hover:bg-zinc-50/80 dark:hover:bg-[#17171b] border border-zinc-200 dark:border-[#222225] hover:border-emerald-500/70 dark:hover:border-emerald-500/70 flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/10 active:scale-[0.99] group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span>Top Cities</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 text-emerald-500 dark:text-emerald-400" />
                </h4>
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/[0.04] group-hover:bg-emerald-500/10 flex items-center justify-center transition-colors">
                  <Globe2 className="w-4 h-4 text-zinc-400 dark:text-neutral-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {analytics.topCities.length === 0 ? (
                  <span className="text-xs text-zinc-500 dark:text-neutral-400 italic">Edge Worldwide (Direct)</span>
                ) : (
                  analytics.topCities.slice(0, 4).map((city) => (
                    <div key={city.city} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-800 dark:text-neutral-200 truncate">{city.city} ({city.countryCode})</span>
                      <span className="font-mono text-zinc-500 dark:text-neutral-400 text-[11px]">
                        {city.percentage}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold mt-3 pt-2.5 border-t border-zinc-100 dark:border-[#222225] flex items-center justify-between">
              <span>Explore cities & metros</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </span>
          </Link>

          {/* Devices (Links to /dashboard/analytics/devices) */}
          <Link
            href={`/dashboard/analytics/devices${linkFilterParam}`}
            className="p-5 rounded-xl bg-white dark:bg-[#141416] hover:bg-zinc-50/80 dark:hover:bg-[#17171b] border border-zinc-200 dark:border-[#222225] hover:border-blue-500/70 dark:hover:border-blue-500/70 flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/10 active:scale-[0.99] group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>Devices & Formats</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 text-blue-500 dark:text-blue-400" />
                </h4>
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/[0.04] group-hover:bg-blue-500/10 flex items-center justify-center transition-colors">
                  <Smartphone className="w-4 h-4 text-zinc-400 dark:text-neutral-500 group-hover:text-blue-500 dark:group-hover:text-blue-400 group-hover:scale-110 group-hover:-rotate-6 transition-all duration-300" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {analytics.topDevices.length === 0 ? (
                  <span className="text-xs text-zinc-500 dark:text-neutral-400 italic">Waiting for clicks...</span>
                ) : (
                  analytics.topDevices.map((d) => (
                    <div key={d.label} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-800 dark:text-neutral-200 truncate">{d.label}</span>
                      <span className="font-mono text-zinc-500 dark:text-neutral-400 text-[11px]">{d.percentage}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <span className="text-[10px] text-blue-500 dark:text-blue-400 font-semibold mt-3 pt-2.5 border-t border-zinc-100 dark:border-[#222225] flex items-center justify-between">
              <span>OS & Browser Details</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </span>
          </Link>

          {/* Sources / Referrers (Links to /dashboard/analytics/sources) */}
          <Link
            href={`/dashboard/analytics/sources${linkFilterParam}`}
            className="p-5 rounded-xl bg-white dark:bg-[#141416] hover:bg-zinc-50/80 dark:hover:bg-[#17171b] border border-zinc-200 dark:border-[#222225] hover:border-purple-500/70 dark:hover:border-purple-500/70 flex flex-col justify-between transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-purple-500/10 active:scale-[0.99] group cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  <span>Traffic Sources</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all duration-300 text-purple-500 dark:text-purple-400" />
                </h4>
                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/[0.04] group-hover:bg-purple-500/10 flex items-center justify-center transition-colors">
                  <Share2 className="w-4 h-4 text-zinc-400 dark:text-neutral-500 group-hover:text-purple-500 dark:group-hover:text-purple-400 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
                </div>
              </div>
              <div className="flex flex-col gap-2">
                {analytics.topReferrers.length === 0 ? (
                  <span className="text-xs text-zinc-500 dark:text-neutral-400 italic">Direct traffic</span>
                ) : (
                  analytics.topReferrers.slice(0, 4).map((ref) => (
                    <div key={ref.source} className="flex items-center justify-between text-xs">
                      <span className="text-zinc-800 dark:text-neutral-200 truncate">{ref.source}</span>
                      <span className="font-mono text-zinc-500 dark:text-neutral-400 text-[11px]">{ref.percentage}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <span className="text-[10px] text-purple-500 dark:text-purple-400 font-semibold mt-3 pt-2.5 border-t border-zinc-100 dark:border-[#222225] flex items-center justify-between">
              <span>Social & UTM Tracking</span>
              <span className="group-hover:translate-x-1 transition-transform duration-300">→</span>
            </span>
          </Link>
        </div>
      </div>

      {/* DATAGRID 1: PERFORMANCE COMPARISON BY LINK (With Scrollable Body & Pagination & Column Masking) */}
      <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">Link Performance Comparison</h3>
              {selectedLinkObj && (
                <button
                  type="button"
                  onClick={() => handleLinkSelectChange("all")}
                  className="text-[11px] px-2.5 py-0.5 rounded-full bg-brand-light text-brand border border-brand-subtle hover:bg-brand-subtle transition-colors cursor-pointer font-medium flex items-center gap-1.5"
                  title="Reset to view all links"
                >
                  <span>Filter: /{selectedLinkObj.slug}</span>
                  <span className="font-bold text-xs">✕ Show all</span>
                </button>
              )}
            </div>
            <p className="text-xs text-zinc-500 dark:text-neutral-400">
              Interactive DataGrid with pagination, metric sorting, and column visibility toggle.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Filter links..."
                value={searchLinkQuery}
                onChange={(e) => {
                  setSearchLinkQuery(e.target.value);
                  setPerfPage(1);
                }}
                className="w-full h-9 rounded-[10px] bg-zinc-50 dark:bg-[#0e0e11] border border-zinc-200 dark:border-[#27272a] px-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-brand"
              />
            </div>

            <ColumnMaskToggle
              columns={PERF_COLUMNS}
              visibleColumns={visiblePerfCols}
              onToggleColumn={togglePerfCol}
              onResetColumns={() => setVisiblePerfCols(new Set(PERF_COLUMNS.map((c) => c.key)))}
            />
          </div>
        </div>

        {/* 1. Mobile Cards Layout (< 768px) */}
        <div className="flex flex-col gap-3 md:hidden">
          {paginatedPerfLinks.map((l, index) => {
            const totalClicksAll = analytics.totalClicks || 1;
            const convRate = l.clicksCount > 0 && (l.conversionsCount || 0) > 0
              ? (((Number(l.conversionsCount) || 0) / l.clicksCount) * 100).toFixed(1)
              : "0.0";
            const trafficShare = ((l.clicksCount / totalClicksAll) * 100).toFixed(1);
            const isSelected = selectedLinkId === l.id;
            const rankIndex = (perfPage - 1) * perfPageSize + index + 1;
            const progressPercent = Math.min(100, Math.max(8, Math.round((l.clicksCount / totalClicksAll) * 100)));

            return (
              <div
                key={l.id}
                className={`rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] p-3.5 flex flex-col gap-2.5 transition-all shadow-sm ${
                  isSelected ? "border-brand bg-brand-light" : "hover:border-brand-subtle"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0 ${
                      rankIndex === 1 ? "bg-brand" : "bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-neutral-400 font-bold"
                    }`}>
                      {rankIndex}
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white text-sm truncate">
                      /{l.slug}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-brand shrink-0">
                    {formatNumber(l.clicksCount)} clicks <span className="text-[10px] text-zinc-500 dark:text-neutral-400 font-normal">({trafficShare}%)</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* 3 Metrics Columns */}
                <div className="grid grid-cols-3 gap-1 pt-1.5 text-center border-t border-zinc-200 dark:border-[#222225]">
                  <div>
                    <span className="text-[9px] text-zinc-500 dark:text-neutral-400 uppercase block">Unique</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono">
                      {formatNumber(l.uniqueClicks || Math.floor(l.clicksCount * 0.8))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 dark:text-neutral-400 uppercase block">Conv.</span>
                    <span className="text-xs font-bold text-emerald-500 dark:text-emerald-400 font-mono">{convRate}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-zinc-500 dark:text-neutral-400 uppercase block">Revenue</span>
                    <span className="text-xs font-bold text-zinc-900 dark:text-white font-mono">{formatCurrency(l.revenue || 0)}</span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleLinkSelectChange(isSelected ? "all" : l.id)}
                  className={`w-full py-1.5 rounded-[10px] text-xs font-semibold transition-colors mt-0.5 cursor-pointer ${
                    isSelected
                      ? "bg-brand text-white shadow-md"
                      : "bg-zinc-200 dark:bg-zinc-800 hover:bg-brand-hover text-zinc-700 dark:text-neutral-300 hover:text-white"
                  }`}
                >
                  {isSelected ? "Active filter (Click to clear ✕)" : "Filter analytics on this link"}
                </button>
              </div>
            );
          })}
        </div>

        {/* 2. Desktop Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto max-h-[360px] overflow-y-auto border border-zinc-200 dark:border-[#222225] rounded-[10px]">
          <table className="w-full text-left text-xs text-zinc-500 dark:text-neutral-400">
            <thead className="sticky top-0 bg-zinc-100/80 dark:bg-[#17171a] border-b border-zinc-200 dark:border-[#222225] z-10">
              <tr className="text-[11px] uppercase tracking-wider text-zinc-700 dark:text-neutral-400 font-bold">
                {visiblePerfCols.has("slug") && <th className="py-3 pl-3">Link & Slug</th>}
                {visiblePerfCols.has("clicks") && (
                  <th
                    onClick={() => {
                      setPerfSortKey("clicks");
                      setPerfSortAsc(!perfSortAsc);
                    }}
                    className="py-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-white"
                  >
                    Total Clicks {perfSortKey === "clicks" ? (perfSortAsc ? "↑" : "↓") : ""}
                  </th>
                )}
                {visiblePerfCols.has("unique") && <th className="py-3 text-right">Unique Clicks</th>}
                {visiblePerfCols.has("conversions") && (
                  <th
                    onClick={() => {
                      setPerfSortKey("conversions");
                      setPerfSortAsc(!perfSortAsc);
                    }}
                    className="py-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-white"
                  >
                    Conversions {perfSortKey === "conversions" ? (perfSortAsc ? "↑" : "↓") : ""}
                  </th>
                )}
                {visiblePerfCols.has("revenue") && (
                  <th
                    onClick={() => {
                      setPerfSortKey("revenue");
                      setPerfSortAsc(!perfSortAsc);
                    }}
                    className="py-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-white"
                  >
                    Revenue (€) {perfSortKey === "revenue" ? (perfSortAsc ? "↑" : "↓") : ""}
                  </th>
                )}
                {visiblePerfCols.has("ctr") && (
                  <th
                    onClick={() => {
                      setPerfSortKey("ctr");
                      setPerfSortAsc(!perfSortAsc);
                    }}
                    className="py-3 text-right cursor-pointer hover:text-zinc-900 dark:hover:text-white"
                  >
                    Conv. Rate / Share {perfSortKey === "ctr" ? (perfSortAsc ? "↑" : "↓") : ""}
                  </th>
                )}
                {visiblePerfCols.has("action") && <th className="py-3 text-right pr-3">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#222225]">
              {paginatedPerfLinks.map((l) => {
                const totalClicksAll = analytics.totalClicks || 1;
                const convRate = l.clicksCount > 0 && (l.conversionsCount || 0) > 0
                  ? (((Number(l.conversionsCount) || 0) / l.clicksCount) * 100).toFixed(1)
                  : "0.0";
                const trafficShare = ((l.clicksCount / totalClicksAll) * 100).toFixed(1);
                const uniqueRatio = l.clicksCount > 0
                  ? (((l.uniqueClicks || l.clicksCount) / l.clicksCount) * 100).toFixed(0)
                  : "100";
                const isSelected = selectedLinkId === l.id;

                return (
                  <tr
                    key={l.id}
                    className={`hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors ${
                      isSelected ? "bg-brand-subtle border-l-2 border-l-brand" : ""
                    }`}
                  >
                    {visiblePerfCols.has("slug") && (
                      <td className="py-3.5 pl-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-zinc-900 dark:text-white text-sm">{l.slug}</span>
                          <span className="text-[11px] text-zinc-500 dark:text-neutral-400 font-mono truncate max-w-[200px]">
                            {l.domainName}/{l.slug}
                          </span>
                        </div>
                      </td>
                    )}

                    {visiblePerfCols.has("clicks") && (
                      <td className="py-3.5 text-right font-mono font-bold text-zinc-900 dark:text-white text-sm">
                        {formatNumber(l.clicksCount)}
                      </td>
                    )}

                    {visiblePerfCols.has("unique") && (
                      <td className="py-3.5 text-right font-mono text-zinc-500 dark:text-neutral-400">
                        {formatNumber(l.uniqueClicks || Math.floor(l.clicksCount * 0.8))}
                      </td>
                    )}

                    {visiblePerfCols.has("conversions") && (
                      <td className="py-3.5 text-right font-mono font-semibold text-emerald-500 dark:text-emerald-400">
                        {formatNumber(l.conversionsCount || 0)}
                      </td>
                    )}

                    {visiblePerfCols.has("revenue") && (
                      <td className="py-3.5 text-right font-mono font-bold text-zinc-900 dark:text-white">
                        {formatCurrency(l.revenue || 0)}
                      </td>
                    )}

                    {visiblePerfCols.has("ctr") && (
                      <td className="py-3.5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-brand font-bold text-xs">
                            {convRate}% conv.
                          </span>
                          <span className="text-[10px] text-zinc-500 dark:text-neutral-400 font-mono">
                            {trafficShare}% traffic · {uniqueRatio}% unq.
                          </span>
                        </div>
                      </td>
                    )}

                    {visiblePerfCols.has("action") && (
                      <td className="py-3.5 text-right pr-3">
                        <button
                          onClick={() => handleLinkSelectChange(isSelected ? "all" : l.id)}
                          className={`px-2.5 py-1 rounded-[10px] text-[11px] font-medium transition-colors cursor-pointer ${
                            isSelected
                              ? "bg-brand text-white shadow-sm"
                              : "bg-zinc-100 hover:bg-brand dark:bg-zinc-800 text-zinc-700 dark:text-neutral-300 hover:text-white"
                          }`}
                        >
                          {isSelected ? "Active ✓" : "Analyze"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* DataGrid Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500 dark:text-neutral-400 pt-3 border-t border-zinc-200 dark:border-[#222225]">
          <span className="text-center sm:text-left">
            Showing {((perfPage - 1) * perfPageSize) + 1} to {Math.min(perfPage * perfPageSize, filteredLinks.length)} of {filteredLinks.length} links
          </span>
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={perfPage <= 1}
              onClick={() => setPerfPage(perfPage - 1)}
              className="h-8 px-2.5 border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#141416] text-zinc-800 dark:text-neutral-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-zinc-900 dark:text-white text-xs px-3 py-1 bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-[#27272a] rounded-[10px] whitespace-nowrap">
              Page {perfPage} / {totalPerfPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={perfPage >= totalPerfPages}
              onClick={() => setPerfPage(perfPage + 1)}
              className="h-8 px-2.5 border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#141416] text-zinc-800 dark:text-neutral-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* DATAGRID 2: REAL-TIME LIVE CLICK STREAM (With Scrollable Body & Pagination & Column Masking) */}
      <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-6 shadow-sm flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Activity className="w-5 h-5 text-brand animate-pulse" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white">Live Click & Conversion Stream</h3>
            {selectedLinkObj && (
              <span className="text-[11px] px-2 py-0.5 rounded bg-brand-light text-brand border border-brand-subtle font-medium font-mono">
                /{selectedLinkObj.slug}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Filter events..."
                value={streamSearch}
                onChange={(e) => {
                  setStreamSearch(e.target.value);
                  setStreamPage(1);
                }}
                className="w-full h-9 rounded-[10px] bg-zinc-50 dark:bg-[#0e0e11] border border-zinc-200 dark:border-[#27272a] px-3 text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-brand"
              />
            </div>

            <ColumnMaskToggle
              columns={STREAM_COLUMNS}
              visibleColumns={visibleStreamCols}
              onToggleColumn={toggleStreamCol}
              onResetColumns={() => setVisibleStreamCols(new Set(STREAM_COLUMNS.map((c) => c.key)))}
            />
          </div>
        </div>

        {/* 1. Mobile Cards Layout (< 768px) */}
        <div className="flex flex-col gap-2.5 md:hidden">
          {paginatedEvents.length === 0 ? (
            <div className="py-8 text-center text-xs text-zinc-500 dark:text-neutral-400">
              {selectedLinkObj ? `No live events found for /${selectedLinkObj.slug}.` : "No live events found."}
            </div>
          ) : (
            paginatedEvents.map((evt) => {
              const custName = evt.customerName || evt.customerFullName || evt.fullName;
              const custEmail = evt.customerEmail || evt.email;
              return (
                <div
                  key={evt.id}
                  className="rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] p-3 flex flex-col gap-2 transition-all hover:border-brand-subtle"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-base">{getCountryFlag(evt.countryCode)}</span>
                      <span className="font-bold text-zinc-900 dark:text-white truncate">
                        {evt.city}, {evt.countryName || evt.countryCode}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 dark:text-neutral-400 font-mono shrink-0">
                      {formatDateRelative(evt.timestamp)}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] bg-white dark:bg-[#141416] px-2.5 py-1.5 rounded-[10px] border border-zinc-200 dark:border-[#222225]">
                    <span className="font-mono font-bold text-brand">/{evt.slug}</span>
                    <div className="flex items-center gap-1 text-zinc-500 dark:text-neutral-400 text-[10px]">
                      <span>{evt.device?.toLowerCase().includes("mobile") ? "📱 Mobile" : "💻 Desktop"}</span>
                      <span>·</span>
                      <span>{evt.browser || "Chrome"}</span>
                    </div>
                  </div>

                  {(custName || custEmail) && (
                    <div className="flex flex-col gap-0.5 bg-white dark:bg-[#141416] px-2.5 py-1.5 rounded-[8px] border border-zinc-200 dark:border-[#222225]">
                      <span className="text-[10px] uppercase font-bold text-zinc-500 dark:text-neutral-400">Customer / Buyer</span>
                      {custName && <span className="font-semibold text-zinc-900 dark:text-white text-xs truncate">{custName}</span>}
                      {custEmail && <span className="text-[11px] text-zinc-500 dark:text-neutral-400 font-mono truncate">{custEmail}</span>}
                    </div>
                  )}

                  {evt.conversionAmount ? (
                    <div className="flex items-center justify-end">
                      <Badge variant="active">
                        Purchase +{evt.conversionAmount}€
                      </Badge>
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* 2. Desktop Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto max-h-[360px] overflow-y-auto border border-zinc-200 dark:border-[#222225] rounded-[10px]">
          <table className="w-full text-left text-xs text-zinc-500 dark:text-neutral-400">
            <thead className="sticky top-0 bg-zinc-100/80 dark:bg-[#17171a] border-b border-zinc-200 dark:border-[#222225] z-10">
              <tr className="text-[11px] uppercase tracking-wider text-zinc-700 dark:text-neutral-400 font-bold">
                {visibleStreamCols.has("timestamp") && <th className="py-3 pl-3">Timestamp</th>}
                {visibleStreamCols.has("slug") && <th className="py-3">Link</th>}
                {visibleStreamCols.has("customer") && <th className="py-3">Customer / Buyer</th>}
                {visibleStreamCols.has("location") && <th className="py-3">Location</th>}
                {visibleStreamCols.has("device") && <th className="py-3">Device & Browser</th>}
                {visibleStreamCols.has("source") && <th className="py-3">Source</th>}
                {visibleStreamCols.has("event") && <th className="py-3 text-right pr-3">Event</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#222225]">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-zinc-500 dark:text-neutral-400">
                    {selectedLinkObj ? `No live events found for /${selectedLinkObj.slug}.` : "No live events found."}
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-zinc-50 dark:hover:bg-white/[0.02] transition-colors">
                  {visibleStreamCols.has("timestamp") && (
                    <td className="py-3 pl-3 font-mono text-[11px] text-zinc-500 dark:text-neutral-400 whitespace-nowrap">
                      {formatDateRelative(evt.timestamp)}
                    </td>
                  )}

                  {visibleStreamCols.has("slug") && (
                    <td className="py-3 font-mono font-bold text-zinc-900 dark:text-white text-xs">
                      {evt.slug}
                    </td>
                  )}

                  {visibleStreamCols.has("customer") && (
                    <td className="py-3">
                      {(() => {
                        const name = evt.customerName || evt.customerFullName || evt.fullName;
                        const email = evt.customerEmail || evt.email;
                        if (!name && !email) {
                          return <span className="text-zinc-400 dark:text-neutral-500 font-mono text-xs">—</span>;
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

                  {visibleStreamCols.has("location") && (
                    <td className="py-3">
                      <span className="font-semibold text-zinc-900 dark:text-white">
                        {evt.city}, {evt.countryName} ({evt.countryCode})
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-neutral-400 block font-mono">
                        IP: {evt.ipMasked}
                      </span>
                    </td>
                  )}

                  {visibleStreamCols.has("device") && (
                    <td className="py-3 text-zinc-800 dark:text-neutral-200">
                      {evt.device} · <span className="text-zinc-500 dark:text-neutral-400">{evt.browser}</span>
                    </td>
                  )}

                  {visibleStreamCols.has("source") && (
                    <td className="py-3 text-zinc-500 dark:text-neutral-400">
                      <span className="px-2 py-0.5 rounded-[10px] bg-zinc-100 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] text-[10px] font-mono text-zinc-900 dark:text-white">
                        {evt.referrer}
                      </span>
                    </td>
                  )}

                  {visibleStreamCols.has("event") && (
                    <td className="py-3 text-right pr-3">
                      {evt.conversionAmount ? (
                        <Badge variant="active">
                          Purchase +{evt.conversionAmount}€
                        </Badge>
                      ) : (
                        <span className="text-zinc-500 dark:text-neutral-400 text-[11px]">Click 302</span>
                      )}
                    </td>
                  )}
                </tr>
              )))}
            </tbody>
          </table>
        </div>

        {/* DataGrid Pagination Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-zinc-500 dark:text-neutral-400 pt-3 border-t border-zinc-200 dark:border-[#222225]">
          <span className="text-center sm:text-left">
            Showing {((streamPage - 1) * streamPageSize) + 1} to {Math.min(streamPage * streamPageSize, filteredEvents.length)} of {filteredEvents.length} events
          </span>
          <div className="flex items-center justify-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={streamPage <= 1}
              onClick={() => setStreamPage(streamPage - 1)}
              className="h-8 px-2.5 border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#141416] text-zinc-800 dark:text-neutral-200"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-zinc-900 dark:text-white text-xs px-3 py-1 bg-white dark:bg-[#0e0e11] border border-zinc-200 dark:border-[#27272a] rounded-[10px] whitespace-nowrap">
              Page {streamPage} / {totalStreamPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={streamPage >= totalStreamPages}
              onClick={() => setStreamPage(streamPage + 1)}
              className="h-8 px-2.5 border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#141416] text-zinc-800 dark:text-neutral-200"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsPageSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  );
}
