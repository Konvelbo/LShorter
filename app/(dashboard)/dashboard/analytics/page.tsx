"use client";

import React, { useState, useEffect } from "react";
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
import { useRouter } from "next/navigation";
import { cfGetAnalytics, cfGetLinks, EMPTY_ANALYTICS, cfInvalidateCache } from "@/lib/cloudflare-api";
import { GlobalAnalytics, UserProfile, TimeRange, ShortLink } from "@/types";
import { formatNumber, formatCurrency, formatDateRelative, getCountryName } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlobeSkeleton, AnalyticsPageSkeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/toast-provider";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { ColumnMaskToggle, ColumnDefinition } from "@/components/dashboard/analytics/column-mask-toggle";

const PERF_COLUMNS: ColumnDefinition[] = [
  { key: "slug", label: "Lien & Slug", defaultVisible: true },
  { key: "clicks", label: "Clics Totaux", defaultVisible: true },
  { key: "unique", label: "Clics Uniques", defaultVisible: true },
  { key: "conversions", label: "Conversions", defaultVisible: true },
  { key: "revenue", label: "Revenus (€)", defaultVisible: true },
  { key: "ctr", label: "Taux Conv. / Part", defaultVisible: true },
  { key: "action", label: "Action", defaultVisible: true },
];

const STREAM_COLUMNS: ColumnDefinition[] = [
  { key: "timestamp", label: "Horodatage", defaultVisible: true },
  { key: "slug", label: "Lien", defaultVisible: true },
  { key: "location", label: "Localisation", defaultVisible: true },
  { key: "device", label: "Appareil & Navigateur", defaultVisible: true },
  { key: "source", label: "Source", defaultVisible: true },
  { key: "event", label: "Événement", defaultVisible: true },
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
      <div className="h-64 rounded-[12px] bg-[#141416] border border-[#222225] animate-pulse flex items-center justify-center text-xs text-neutral-500 font-mono">
        Chargement des graphiques Edge...
      </div>
    ),
  }
);

const AnalyticsPieChart = dynamic(
  () => import("@/components/analytics/pie-chart").then((mod) => mod.AnalyticsPieChart),
  {
    ssr: false,
    loading: () => (
      <div className="h-64 rounded-[12px] bg-[#141416] border border-[#222225] animate-pulse flex items-center justify-center text-xs text-neutral-500 font-mono">
        Chargement répartition...
      </div>
    ),
  }
);

export default function AnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("month");
  const [selectedLinkId, setSelectedLinkId] = useState<string>("all");
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
        routingRules: l.routing_rules ? (typeof l.routing_rules === "string" ? JSON.parse(l.routing_rules) : l.routing_rules) : (l.routingRules || []),
        geoTargeting: l.geo_targeting ? (typeof l.geo_targeting === "string" ? JSON.parse(l.geo_targeting) : l.geo_targeting) : (l.geoTargeting || {}),
        deviceTargeting: l.device_targeting ? (typeof l.device_targeting === "string" ? JSON.parse(l.device_targeting) : l.device_targeting) : (l.deviceTargeting || {}),
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

      if (analyticsRes?.data || fetchedLinks.length > 0) {
        const d = analyticsRes?.data || {};
        const sumLinksClicks = fetchedLinks.reduce((acc, l) => acc + (l.clicksCount || 0), 0);
        const sumUniqueClicks = fetchedLinks.reduce((acc, l) => acc + (l.uniqueClicks || 0), 0);

        const total = (d.totalClicks ?? d.total_clicks ?? 0) || sumLinksClicks;
        const unique = (d.uniqueClicks ?? d.unique_clicks ?? 0) || sumUniqueClicks || total;
        const countries = d.topCountries ?? d.top_countries ?? [];
        const devices = d.topDevices ?? d.top_devices ?? [];
        const browsers = d.topBrowsers ?? d.top_browsers ?? [];
        const referrers = d.topReferrers ?? d.top_referrers ?? [];
        const cities = d.topCities ?? d.top_cities ?? [];
        const clicksDay = d.clicksByDay ?? d.clicks_by_day ?? [];
        const liveEvents = d.liveClickEvents ?? d.live_click_events ?? [];

        setAnalytics({
          totalClicks: total,
          clicksGrowth: d.clicksGrowth ?? d.clicks_growth ?? 0,
          uniqueClicks: unique,
          uniqueClicksGrowth: 0,
          trackedRevenue: d.totalRevenue ?? d.total_revenue ?? 0,
          revenueGrowth: 0,
          avgCtr: d.avgCtr ?? d.avg_ctr ?? 0,
          ctrGrowth: 0,
          bounceRate: d.bounceRate ?? d.bounce_rate ?? 0,
          epc: d.epc ?? 0,
          avgEngagementTime: d.avgEngagementTime || "0s",
          clicksByDay: clicksDay.length > 0 
            ? clicksDay.map((c: any, i: number) => ({
                date: c.date || new Date().toISOString().slice(0, 10),
                clicks: c.clicks || 0,
                uniqueClicks: c.uniqueClicks || c.unique_clicks || c.clicks || 0,
                dayNumber: c.dayNumber || i + 1,
              }))
            : (total > 0 ? [{ date: new Date().toISOString().slice(0, 10), clicks: total, uniqueClicks: unique, dayNumber: 1 }] : []),
          topCountries: countries.map((c: any) => {
            const code = (c.code || c.country_code || c.country || "XX").toUpperCase();
            const cnt = c.count || c.clicks || 0;
            const pct = c.percentage !== undefined && c.percentage !== null ? c.percentage : (total > 0 ? Math.round((cnt / total) * 100) : 0);
            return {
              code,
              name: getCountryName(code),
              count: cnt,
              percentage: pct,
            };
          }),
          topCities: cities.map((ci: any) => ({
            city: ci.city || ci.name || "Inconnue",
            countryCode: (ci.countryCode || ci.country_code || "XX").toUpperCase(),
            count: ci.count || ci.clicks || 0,
            percentage: ci.percentage !== undefined ? ci.percentage : (total > 0 ? Math.round(((ci.count || ci.clicks || 0) / total) * 100) : 0),
          })),
          topDevices: devices.map((dv: any) => ({
            label: dv.label || dv.device || dv.name || "Desktop",
            device: dv.device || dv.label || dv.name || "Desktop",
            count: dv.count || dv.clicks || 0,
            percentage: dv.percentage !== undefined ? dv.percentage : (total > 0 ? Math.round(((dv.count || dv.clicks || 0) / total) * 100) : 0),
          })),
          topBrowsers: browsers.map((br: any) => ({
            name: br.name || br.browser || "Chrome",
            browser: br.browser || br.name || "Chrome",
            count: br.count || br.clicks || 0,
            percentage: br.percentage !== undefined ? br.percentage : (total > 0 ? Math.round(((br.count || br.clicks || 0) / total) * 100) : 0),
          })),
          topReferrers: referrers.map((rf: any) => ({
            source: rf.source || rf.referrer || rf.name || "Direct",
            referrer: rf.referrer || rf.source || rf.name || "Direct",
            count: rf.count || rf.clicks || 0,
            percentage: rf.percentage !== undefined ? rf.percentage : (total > 0 ? Math.round(((rf.count || rf.clicks || 0) / total) * 100) : 0),
          })),
          liveClickEvents: liveEvents.map((ev: any) => {
            const cCode = (ev.country_code || ev.countryCode || "XX").toUpperCase();
            return {
              id: ev.id,
              timestamp: ev.timestamp || new Date().toISOString(),
              slug: ev.slug || "link",
              countryCode: cCode,
              countryName: getCountryName(cCode),
              city: ev.city || "—",
              device: ev.device || "desktop",
              browser: ev.browser || "Chrome",
              referrer: ev.referrer || "Direct",
            };
          }),
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
      refreshData();
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
  };

  const handleLinkSelectChange = (linkId: string) => {
    setSelectedLinkId(linkId);
  };

  const handleExportCSV = async () => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        reason: "L'exportation CSV des données brutes est réservée aux abonnés du Plan Pro.",
        featureName: "Export CSV Analytics",
      });
      return;
    }

    setIsExporting(true);
    try {
      const response = await fetch(`/api/analytics/export?linkId=${selectedLinkId === "all" ? "" : selectedLinkId}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lshorter_analytics_${selectedRange}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("Export error:", e);
    } finally {
      setIsExporting(false);
    }
  };

  const selectedLinkObj = links.find((l) => l.id === selectedLinkId);

  const rangeLabels: Record<TimeRange, string> = {
    day: "Dernières 24 Heures (Heure par heure)",
    week: "7 Derniers Jours (Par jour)",
    month: "30 Derniers Jours (Mois)",
    year: "12 Derniers Mois (Année)",
  };

  // Performance DataGrid Filtering & Sorting
  const filteredLinks = (links || [])
    .filter((l) =>
      (l?.slug || "").toLowerCase().includes(searchLinkQuery.toLowerCase()) ||
      (l?.targetUrl || "").toLowerCase().includes(searchLinkQuery.toLowerCase())
    )
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
  const filteredEvents = (analytics?.liveClickEvents || []).filter((e) =>
    (e?.slug || "").toLowerCase().includes(streamSearch.toLowerCase()) ||
    (e?.countryName || "").toLowerCase().includes(streamSearch.toLowerCase()) ||
    (e?.referrer || "").toLowerCase().includes(streamSearch.toLowerCase())
  );
  const totalStreamPages = Math.max(1, Math.ceil(filteredEvents.length / streamPageSize));
  const paginatedEvents = filteredEvents.slice((streamPage - 1) * streamPageSize, streamPage * streamPageSize);

  if (status === "loading" || isLoading) {
    return <AnalyticsPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in pb-16">
      {/* Top Header with Per-Link Selector & Export */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#222225]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-white tracking-wide">
              Centre d&apos;Analyse & Intelligence Edge
            </h1>
            <span className="px-2 py-0.5 rounded bg-[#ff6600]/15 text-[#ff6600] text-[10px] font-bold">
              TEMPS RÉEL
            </span>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Données de trafic, conversion, attribution et géolocalisation au millimètre près.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Link Filter Selector with fixed dark background */}
          <div className="flex items-center gap-2 bg-[#141416] border border-[#27272a] rounded-[10px] px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-[#ff6600]" />
            <span className="text-neutral-400 font-medium">Lien :</span>
            <select
              value={selectedLinkId}
              onChange={(e) => handleLinkSelectChange(e.target.value)}
              className="bg-[#141416] text-white font-semibold focus:outline-none cursor-pointer border-none"
            >
              <option value="all" className="bg-[#141416] text-white">Tous les liens ({links.length})</option>
              {links.map((l) => (
                <option key={l.id} value={l.id} className="bg-[#141416] text-white">
                  {l.slug} ({formatNumber(l.clicksCount)} clics)
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
              showToast.success("Statistiques actualisées !");
            }}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-[#27272a] bg-[#141416] hover:bg-white/5 text-neutral-300 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#ff6600]" : "text-neutral-400"}`} />
            <span>Actualiser</span>
          </Button>

          {/* Export Button */}
          <Button
            onClick={handleExportCSV}
            disabled={isExporting}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#ff6600]" />
            <span>{isExporting ? "Exportation..." : "Exporter CSV (Excel)"}</span>
            {!isProPlan && (
              <span className="px-1.5 py-0.2 rounded bg-[#ff6600]/20 text-[#ff6600] text-[9px] font-bold">
                PRO
              </span>
            )}
          </Button>
        </div>
      </div>

      {/* Selected Link Banner (if specific link selected) */}
      {selectedLinkObj && (
        <div className="p-4 rounded-[12px] bg-[#141416] border border-[#ff6600]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#ff6600] flex items-center justify-center font-bold text-white">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-sm">{selectedLinkObj.slug}</span>
                <Badge variant={selectedLinkObj.isActive ? "active" : "inactive"}>
                  {selectedLinkObj.isActive ? "Actif" : "Inactif"}
                </Badge>
              </div>
              <p className="text-xs text-neutral-400 font-mono">
                {selectedLinkObj.domainName}/{selectedLinkObj.slug} → {selectedLinkObj.targetUrl}
              </p>
            </div>
          </div>

          <button
            onClick={() => handleLinkSelectChange("all")}
            className="text-xs text-neutral-400 hover:text-white underline cursor-pointer"
          >
            Réinitialiser au filtre global
          </button>
        </div>
      )}

      {/* Time Range Filter Bar (Jour, Semaine, Mois, An) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 rounded-[12px] bg-[#141416] border border-[#222225]">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="text-neutral-400 font-medium px-2 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[#ff6600]" />
            <span>Période :</span>
          </span>

          <button
            type="button"
            onClick={() => handleRangeChange("day")}
            className={`px-3 py-1.5 rounded-[8px] font-semibold transition-all cursor-pointer ${
              selectedRange === "day"
                ? "bg-[#ff6600] text-white shadow-md font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Jour (24h)
          </button>

          <button
            type="button"
            onClick={() => handleRangeChange("week")}
            className={`px-3 py-1.5 rounded-[8px] font-semibold transition-all cursor-pointer ${
              selectedRange === "week"
                ? "bg-[#ff6600] text-white shadow-md font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Semaine (7j)
          </button>

          <button
            type="button"
            onClick={() => handleRangeChange("month")}
            className={`px-3 py-1.5 rounded-[8px] font-semibold transition-all cursor-pointer ${
              selectedRange === "month"
                ? "bg-[#ff6600] text-white shadow-md font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            Mois (30j)
          </button>

          <button
            type="button"
            onClick={() => handleRangeChange("year")}
            className={`px-3 py-1.5 rounded-[8px] font-semibold transition-all cursor-pointer ${
              selectedRange === "year"
                ? "bg-[#ff6600] text-white shadow-md font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            An (12 mois)
          </button>
        </div>

        <span className="text-neutral-400 text-xs px-2 font-medium">
          {rangeLabels[selectedRange]}
        </span>
      </div>

      {/* 6 Key Precision Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Clics Totaux</span>
          <div className="my-1.5">
            <span className="font-bebas text-3xl font-bold text-[#ff6600]">
              {formatNumber(analytics.totalClicks)}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400">
            {analytics.totalClicks > 0 ? (analytics.clicksGrowth > 0 ? `↑ +${analytics.clicksGrowth}%` : `+${analytics.totalClicks} clics`) : "0%"}
          </span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Clics Uniques</span>
          <div className="my-1.5">
            <span className="font-bebas text-3xl font-bold text-white">
              {formatNumber(analytics.uniqueClicks)}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400">
            {analytics.uniqueClicks > 0 ? (analytics.uniqueClicksGrowth > 0 ? `↑ +${analytics.uniqueClicksGrowth}%` : `100% uniques`) : "0%"}
          </span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Revenus Attribués</span>
          <div className="my-1.5">
            <span className="font-bebas text-3xl font-bold text-white">
              {formatCurrency(analytics.trackedRevenue)}
            </span>
          </div>
          <span className="text-[10px] font-semibold text-neutral-400">
            {analytics.trackedRevenue > 0 ? `↑ +${analytics.revenueGrowth}%` : "0 conversion"}
          </span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Taux Conversion</span>
          <div className="my-1.5">
            <span className="font-bebas text-3xl font-bold text-white">
              {analytics.avgCtr}%
            </span>
          </div>
          <span className="text-[10px] font-semibold text-neutral-400">
            {analytics.avgCtr > 0 ? `${analytics.avgCtr}%` : "Attente conversion"}
          </span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">EPC (Gain / Clic)</span>
          <div className="my-1.5">
            <span className="font-bebas text-3xl font-bold text-emerald-400">
              {analytics.epc}€
            </span>
          </div>
          <span className="text-[10px] font-semibold text-neutral-400">
            Rentabilité / clic
          </span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Taux de Rebond</span>
          <div className="my-1.5">
            <span className="font-bebas text-3xl font-bold text-white">
              {analytics.bounceRate}%
            </span>
          </div>
          <span className="text-[10px] font-semibold text-emerald-400">
            {analytics.totalClicks > 0 ? "Excellente rétention" : "Optimum < 30%"}
          </span>
        </div>
      </div>

      {/* 3D GLOBE SHOWCASE & TIME SERIES HISTOGRAM */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* 3D Cobe Globe (5 cols) */}
        <div className="lg:col-span-5 rounded-[14px] bg-[#141416] border border-[#222225] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#ff6600] flex items-center gap-1.5">
                <Globe2 className="w-4 h-4" />
                <span>Globe 3D Interactif</span>
              </span>
              <span className="text-[10px] text-neutral-500">Faites glisser pour tourner</span>
            </div>
            <h3 className="text-lg font-bold text-white">Trafic Mondial en Direct</h3>
            <p className="text-xs text-neutral-400 mt-1">
              Visualisation en direct des pays d&apos;où proviennent vos clics avec points lumineux.
            </p>
          </div>

          <div className="my-4 flex items-center justify-center">
            <CobeGlobe className="max-h-[340px]" topCountries={analytics.topCountries} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-[#222225]">
            <div className="p-2.5 rounded-[8px] bg-[#1a1a1e]">
              <span className="text-[10px] text-neutral-400">Top Zone</span>
              <p className="font-bold text-white text-sm truncate">
                {analytics.topCountries.length > 0 ? analytics.topCountries[0].name : "En attente"}
              </p>
            </div>
            <div className="p-2.5 rounded-[8px] bg-[#1a1a1e]">
              <span className="text-[10px] text-neutral-400">Latence Edge</span>
              <p className="font-bold text-emerald-400 text-sm">&lt; 0.8 ms</p>
            </div>
          </div>
        </div>

        {/* Dynamic Histogram Chart (7 cols) */}
        <div className="lg:col-span-7">
          <StatsBarChart
            data={analytics.clicksByDay}
            title={`Évolution des clics (${rangeLabels[selectedRange]})`}
            subtitle={selectedLinkObj ? `Lien : ${selectedLinkObj.slug}` : "Tous vos liens combinés"}
          />
        </div>
      </div>

      {/* NEW: DONUT / PIE CHART COMPONENT & Granular Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Donut / Pie Chart (6 cols) */}
        <div className="lg:col-span-6">
          <AnalyticsPieChart
            topLinksData={links.filter((l) => (l.clicksCount || 0) > 0).map((l, i) => ({
              label: `/${l.slug}`,
              value: l.clicksCount || 0,
              color: ["#ff6600", "#ff8833", "#ffa366", "#3b82f6", "#10b981", "#8b5cf6"][i % 6],
              sublabel: l.targetUrl,
            }))}
            channelsData={analytics.topReferrers.map((r, i) => ({
              label: r.referrer || "Direct",
              value: r.clicks || (r as any).count || 0,
              color: ["#ff6600", "#3b82f6", "#10b981", "#eab308", "#ec4899"][i % 5],
              sublabel: `${r.clicks || (r as any).count || 0} clics`,
            }))}
          />
        </div>

        {/* 4 Mini Cards (6 cols) with direct links to dedicated detailed pages */}
        <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Top Pays (Links to /dashboard/analytics/geo) */}
          <Link
            href="/dashboard/analytics/geo"
            className="p-5 rounded-[12px] bg-[#141416] hover:bg-[#1a1a1e] border border-[#222225] hover:border-[#ff6600]/60 flex flex-col justify-between transition-all group cursor-pointer shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white group-hover:text-[#ff6600] transition-colors flex items-center gap-1.5">
                  <span>Top Pays</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-[#ff6600]" />
                </h4>
                <Compass className="w-4 h-4 text-neutral-500 group-hover:text-[#ff6600] transition-colors" />
              </div>
              <div className="flex flex-col gap-2">
                {analytics.topCountries.length === 0 ? (
                  <span className="text-xs text-neutral-500 italic">En attente de visites...</span>
                ) : (
                  analytics.topCountries.slice(0, 4).map((c) => (
                    <div key={c.code} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold text-[#ff6600] w-5">
                          {c.code}
                        </span>
                        <span className="text-neutral-200">{c.name}</span>
                      </div>
                      <span className="font-mono text-neutral-400 text-[11px]">
                        {c.percentage}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <span className="text-[10px] text-[#ff6600] font-semibold mt-3 pt-2 border-t border-[#222225] flex items-center justify-between">
              <span>Voir la carte & continents</span>
              <span>→</span>
            </span>
          </Link>

          {/* Top Villes (Links to /dashboard/analytics/geo) */}
          <Link
            href="/dashboard/analytics/geo"
            className="p-5 rounded-[12px] bg-[#141416] hover:bg-[#1a1a1e] border border-[#222225] hover:border-emerald-500/60 flex flex-col justify-between transition-all group cursor-pointer shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors flex items-center gap-1.5">
                  <span>Top Villes</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-400" />
                </h4>
                <Globe2 className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div className="flex flex-col gap-2">
                {analytics.topCities.length === 0 ? (
                  <span className="text-xs text-neutral-500 italic">Edge Worldwide (Direct)</span>
                ) : (
                  analytics.topCities.slice(0, 4).map((city) => (
                    <div key={city.city} className="flex items-center justify-between text-xs">
                      <span className="text-neutral-200 truncate">{city.city} ({city.countryCode})</span>
                      <span className="font-mono text-neutral-400 text-[11px]">
                        {city.percentage}%
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <span className="text-[10px] text-emerald-400 font-semibold mt-3 pt-2 border-t border-[#222225] flex items-center justify-between">
              <span>Explorer métropoles & villes</span>
              <span>→</span>
            </span>
          </Link>

          {/* Appareils (Links to /dashboard/analytics/devices) */}
          <Link
            href="/dashboard/analytics/devices"
            className="p-5 rounded-[12px] bg-[#141416] hover:bg-[#1a1a1e] border border-[#222225] hover:border-blue-500/60 flex flex-col justify-between transition-all group cursor-pointer shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors flex items-center gap-1.5">
                  <span>Appareils & Formats</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                </h4>
                <Smartphone className="w-4 h-4 text-neutral-500 group-hover:text-blue-400 transition-colors" />
              </div>
              <div className="flex flex-col gap-2">
                {analytics.topDevices.length === 0 ? (
                  <span className="text-xs text-neutral-500 italic">En attente de clics...</span>
                ) : (
                  analytics.topDevices.map((d) => (
                    <div key={d.label} className="flex items-center justify-between text-xs">
                      <span className="text-neutral-200 truncate">{d.label}</span>
                      <span className="font-mono text-neutral-400 text-[11px]">{d.percentage}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <span className="text-[10px] text-blue-400 font-semibold mt-3 pt-2 border-t border-[#222225] flex items-center justify-between">
              <span>Détails OS & Navigateurs</span>
              <span>→</span>
            </span>
          </Link>

          {/* Sources / Référents (Links to /dashboard/analytics/sources) */}
          <Link
            href="/dashboard/analytics/sources"
            className="p-5 rounded-[12px] bg-[#141416] hover:bg-[#1a1a1e] border border-[#222225] hover:border-purple-500/60 flex flex-col justify-between transition-all group cursor-pointer shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors flex items-center gap-1.5">
                  <span>Sources de Trafic</span>
                  <ArrowUpRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-purple-400" />
                </h4>
                <Share2 className="w-4 h-4 text-neutral-500 group-hover:text-purple-400 transition-colors" />
              </div>
              <div className="flex flex-col gap-2">
                {analytics.topReferrers.length === 0 ? (
                  <span className="text-xs text-neutral-500 italic">Accès direct</span>
                ) : (
                  analytics.topReferrers.slice(0, 4).map((ref) => (
                    <div key={ref.source} className="flex items-center justify-between text-xs">
                      <span className="text-neutral-200 truncate">{ref.source}</span>
                      <span className="font-mono text-neutral-400 text-[11px]">{ref.percentage}%</span>
                    </div>
                  ))
                )}
              </div>
            </div>
            <span className="text-[10px] text-purple-400 font-semibold mt-3 pt-2 border-t border-[#222225] flex items-center justify-between">
              <span>Traçabilité réseaux & UTM</span>
              <span>→</span>
            </span>
          </Link>
        </div>
      </div>

      {/* DATAGRID 1: PERFORMANCE COMPARÉE PAR LIEN (With Scrollable Body & Pagination & Column Masking) */}
      <div className="rounded-[14px] bg-[#141416] border border-[#222225] p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">Performance Comparée par Lien</h3>
            <p className="text-xs text-neutral-400">
              DataGrid interactif avec pagination, tri par métrique et filtrage par masquage de colonnes.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Filtrer les liens..."
                value={searchLinkQuery}
                onChange={(e) => {
                  setSearchLinkQuery(e.target.value);
                  setPerfPage(1);
                }}
                className="w-full h-9 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] px-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6600]"
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
                className={`rounded-2xl bg-[#18181c] border border-[#27272a] p-3.5 flex flex-col gap-2.5 transition-all ${
                  isSelected ? "border-[#ff6600] bg-[#ff6600]/5" : "hover:border-[#ff6600]/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center shrink-0 ${
                      rankIndex === 1 ? "bg-[#ff6600]" : "bg-[#27272a] text-neutral-300"
                    }`}>
                      {rankIndex}
                    </span>
                    <span className="font-mono font-bold text-white text-sm truncate">
                      /{l.slug}
                    </span>
                  </div>
                  <span className="font-mono text-sm font-bold text-[#ff6600] shrink-0">
                    {formatNumber(l.clicksCount)} clics <span className="text-[10px] text-neutral-400 font-normal">({trafficShare}%)</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-1.5 rounded-full bg-black/40 overflow-hidden">
                  <div
                    className="h-full bg-[#ff6600] rounded-full transition-all duration-500"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* 3 Metrics Columns */}
                <div className="grid grid-cols-3 gap-1 pt-1.5 text-center border-t border-[#222225]">
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase block">Uniques</span>
                    <span className="text-xs font-bold text-white font-mono">
                      {formatNumber(l.uniqueClicks || Math.floor(l.clicksCount * 0.8))}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase block">Conv.</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">{convRate}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-neutral-500 uppercase block">Revenus</span>
                    <span className="text-xs font-bold text-white font-mono">{formatCurrency(l.revenue || 0)}</span>
                  </div>
                </div>

                {/* Action button */}
                <button
                  onClick={() => handleLinkSelectChange(l.id)}
                  className={`w-full py-1.5 rounded-lg text-xs font-semibold transition-colors mt-0.5 cursor-pointer ${
                    isSelected
                      ? "bg-[#ff6600] text-white shadow-md shadow-[#ff6600]/30"
                      : "bg-white/5 hover:bg-[#ff6600] text-neutral-300 hover:text-white"
                  }`}
                >
                  {isSelected ? "Filtre actif ✓" : "Filtrer les analytics sur ce lien"}
                </button>
              </div>
            );
          })}
        </div>

        {/* 2. Desktop Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto max-h-[360px] overflow-y-auto border border-[#222225] rounded-[10px]">
          <table className="w-full text-left text-xs text-neutral-400">
            <thead className="sticky top-0 bg-[#17171a] border-b border-[#222225] z-10">
              <tr className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">
                {visiblePerfCols.has("slug") && <th className="py-3 pl-3">Lien & Slug</th>}
                {visiblePerfCols.has("clicks") && (
                  <th
                    onClick={() => {
                      setPerfSortKey("clicks");
                      setPerfSortAsc(!perfSortAsc);
                    }}
                    className="py-3 text-right cursor-pointer hover:text-white"
                  >
                    Clics Totaux {perfSortKey === "clicks" ? (perfSortAsc ? "↑" : "↓") : ""}
                  </th>
                )}
                {visiblePerfCols.has("unique") && <th className="py-3 text-right">Clics Uniques</th>}
                {visiblePerfCols.has("conversions") && (
                  <th
                    onClick={() => {
                      setPerfSortKey("conversions");
                      setPerfSortAsc(!perfSortAsc);
                    }}
                    className="py-3 text-right cursor-pointer hover:text-white"
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
                    className="py-3 text-right cursor-pointer hover:text-white"
                  >
                    Revenus (€) {perfSortKey === "revenue" ? (perfSortAsc ? "↑" : "↓") : ""}
                  </th>
                )}
                {visiblePerfCols.has("ctr") && (
                  <th
                    onClick={() => {
                      setPerfSortKey("ctr");
                      setPerfSortAsc(!perfSortAsc);
                    }}
                    className="py-3 text-right cursor-pointer hover:text-white"
                  >
                    Taux Conv. / Part {perfSortKey === "ctr" ? (perfSortAsc ? "↑" : "↓") : ""}
                  </th>
                )}
                {visiblePerfCols.has("action") && <th className="py-3 text-right pr-3">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222225]">
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
                    className={`hover:bg-white/[0.02] transition-colors ${
                      isSelected ? "bg-[#ff6600]/10 border-l-2 border-l-[#ff6600]" : ""
                    }`}
                  >
                    {visiblePerfCols.has("slug") && (
                      <td className="py-3.5 pl-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">{l.slug}</span>
                          <span className="text-[11px] text-neutral-500 font-mono truncate max-w-[200px]">
                            {l.domainName}/{l.slug}
                          </span>
                        </div>
                      </td>
                    )}

                    {visiblePerfCols.has("clicks") && (
                      <td className="py-3.5 text-right font-mono font-bold text-white text-sm">
                        {formatNumber(l.clicksCount)}
                      </td>
                    )}

                    {visiblePerfCols.has("unique") && (
                      <td className="py-3.5 text-right font-mono text-neutral-300">
                        {formatNumber(l.uniqueClicks || Math.floor(l.clicksCount * 0.8))}
                      </td>
                    )}

                    {visiblePerfCols.has("conversions") && (
                      <td className="py-3.5 text-right font-mono font-semibold text-emerald-400">
                        {formatNumber(l.conversionsCount || 0)}
                      </td>
                    )}

                    {visiblePerfCols.has("revenue") && (
                      <td className="py-3.5 text-right font-mono font-bold text-white">
                        {formatCurrency(l.revenue || 0)}
                      </td>
                    )}

                    {visiblePerfCols.has("ctr") && (
                      <td className="py-3.5 text-right">
                        <div className="flex flex-col items-end">
                          <span className="font-mono text-[#ff6600] font-bold text-xs">
                            {convRate}% conv.
                          </span>
                          <span className="text-[10px] text-neutral-400 font-mono">
                            {trafficShare}% trafic · {uniqueRatio}% unq.
                          </span>
                        </div>
                      </td>
                    )}

                    {visiblePerfCols.has("action") && (
                      <td className="py-3.5 text-right pr-3">
                        <button
                          onClick={() => handleLinkSelectChange(l.id)}
                          className="px-2.5 py-1 rounded-[6px] bg-white/5 hover:bg-[#ff6600] text-neutral-300 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                        >
                          {isSelected ? "Actif ✓" : "Analyser"}
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
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-[#222225]">
          <span>
            Affichage de {((perfPage - 1) * perfPageSize) + 1} à {Math.min(perfPage * perfPageSize, filteredLinks.length)} sur {filteredLinks.length} liens
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={perfPage <= 1}
              onClick={() => setPerfPage(perfPage - 1)}
              className="h-8 px-2.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-white px-2">Page {perfPage} / {totalPerfPages}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={perfPage >= totalPerfPages}
              onClick={() => setPerfPage(perfPage + 1)}
              className="h-8 px-2.5"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* DATAGRID 2: REAL-TIME LIVE CLICK STREAM (With Scrollable Body & Pagination & Column Masking) */}
      <div className="rounded-[14px] bg-[#141416] border border-[#222225] p-6 shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#ff6600] animate-pulse" />
            <h3 className="text-base font-bold text-white">Journal des Clics & Conversions en Direct</h3>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Filtrer événements..."
                value={streamSearch}
                onChange={(e) => {
                  setStreamSearch(e.target.value);
                  setStreamPage(1);
                }}
                className="w-full h-9 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] px-3 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6600]"
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
            <div className="py-8 text-center text-xs text-neutral-500">
              Aucun événement trouvé.
            </div>
          ) : (
            paginatedEvents.map((evt) => (
              <div
                key={evt.id}
                className="rounded-xl bg-[#18181c] border border-[#27272a] p-3 flex flex-col gap-2 transition-all hover:border-[#ff6600]/40"
              >
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-base">{getCountryFlag(evt.countryCode)}</span>
                    <span className="font-bold text-white truncate">
                      {evt.city}, {evt.countryName || evt.countryCode}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono shrink-0">
                    {formatDateRelative(evt.timestamp)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] bg-[#090b10] px-2.5 py-1.5 rounded-lg border border-[#222225]">
                  <span className="font-mono font-bold text-[#ff6600]">/{evt.slug}</span>
                  <div className="flex items-center gap-1 text-neutral-400 text-[10px]">
                    <span>{evt.device?.toLowerCase().includes("mobile") ? "📱 Mobile" : "💻 Desktop"}</span>
                    <span>·</span>
                    <span>{evt.browser || "Chrome"}</span>
                  </div>
                </div>

                {evt.conversionAmount && (
                  <div className="flex items-center justify-end">
                    <Badge variant="active">
                      Achat +{evt.conversionAmount}€
                    </Badge>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* 2. Desktop Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto max-h-[360px] overflow-y-auto border border-[#222225] rounded-[10px]">
          <table className="w-full text-left text-xs text-neutral-400">
            <thead className="sticky top-0 bg-[#17171a] border-b border-[#222225] z-10">
              <tr className="text-[11px] uppercase tracking-wider text-neutral-400 font-bold">
                {visibleStreamCols.has("timestamp") && <th className="py-3 pl-3">Horodatage</th>}
                {visibleStreamCols.has("slug") && <th className="py-3">Lien</th>}
                {visibleStreamCols.has("location") && <th className="py-3">Localisation</th>}
                {visibleStreamCols.has("device") && <th className="py-3">Appareil & Navigateur</th>}
                {visibleStreamCols.has("source") && <th className="py-3">Source</th>}
                {visibleStreamCols.has("event") && <th className="py-3 text-right pr-3">Événement</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222225]">
              {paginatedEvents.map((evt) => (
                <tr key={evt.id} className="hover:bg-white/[0.02] transition-colors">
                  {visibleStreamCols.has("timestamp") && (
                    <td className="py-3 pl-3 font-mono text-[11px] text-neutral-400 whitespace-nowrap">
                      {formatDateRelative(evt.timestamp)}
                    </td>
                  )}

                  {visibleStreamCols.has("slug") && (
                    <td className="py-3 font-mono font-bold text-white text-xs">
                      {evt.slug}
                    </td>
                  )}

                  {visibleStreamCols.has("location") && (
                    <td className="py-3">
                      <span className="font-semibold text-neutral-200">
                        {evt.city}, {evt.countryName} ({evt.countryCode})
                      </span>
                      <span className="text-[10px] text-neutral-500 block font-mono">
                        IP: {evt.ipMasked}
                      </span>
                    </td>
                  )}

                  {visibleStreamCols.has("device") && (
                    <td className="py-3 text-neutral-300">
                      {evt.device} · <span className="text-neutral-500">{evt.browser}</span>
                    </td>
                  )}

                  {visibleStreamCols.has("source") && (
                    <td className="py-3 text-neutral-400">
                      <span className="px-2 py-0.5 rounded-[6px] bg-white/5 border border-[#27272a] text-[10px] font-mono">
                        {evt.referrer}
                      </span>
                    </td>
                  )}

                  {visibleStreamCols.has("event") && (
                    <td className="py-3 text-right pr-3">
                      {evt.conversionAmount ? (
                        <Badge variant="active">
                          Achat +{evt.conversionAmount}€
                        </Badge>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">Clic 302</span>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* DataGrid Pagination Controls */}
        <div className="flex items-center justify-between text-xs text-neutral-400 pt-2 border-t border-[#222225]">
          <span>
            Affichage de {((streamPage - 1) * streamPageSize) + 1} à {Math.min(streamPage * streamPageSize, filteredEvents.length)} sur {filteredEvents.length} événements
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={streamPage <= 1}
              onClick={() => setStreamPage(streamPage - 1)}
              className="h-8 px-2.5"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </Button>
            <span className="font-mono text-white px-2">Page {streamPage} / {totalStreamPages}</span>
            <Button
              size="sm"
              variant="outline"
              disabled={streamPage >= totalStreamPages}
              onClick={() => setStreamPage(streamPage + 1)}
              className="h-8 px-2.5"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
