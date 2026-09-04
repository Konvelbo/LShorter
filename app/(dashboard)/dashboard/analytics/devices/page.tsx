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
import { formatDateRelative, formatNumber } from "@/lib/utils";
import { detectOSFromEvent } from "@/lib/device-detection";

const DEVICE_COLUMNS: ColumnDefinition[] = [
  { key: "timestamp", label: "Horodatage", defaultVisible: true },
  { key: "device", label: "Format Appareil", defaultVisible: true },
  { key: "browser", label: "Navigateur", defaultVisible: true },
  { key: "os", label: "Système (OS)", defaultVisible: true },
  { key: "link", label: "Lien Cible", defaultVisible: true },
  { key: "location", label: "Localisation", defaultVisible: true },
  { key: "referrer", label: "Source", defaultVisible: true },
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
      setLinks(listData);

      if (analyticsRes?.data) {
        const d = analyticsRes.data;
        const total = d.totalClicks ?? d.total_clicks ?? 0;
        const rawLiveEvents = d.liveClickEvents ?? d.live_click_events ?? [];
        const liveEvents = rawLiveEvents.map((ev: any) => {
          const detectedOS = detectOSFromEvent(ev);
          return {
            id: ev.id,
            timestamp: ev.timestamp || new Date().toISOString(),
            slug: ev.slug || "link",
            countryCode: (ev.country_code || ev.countryCode || "XX").toUpperCase(),
            countryName: ev.country_name || ev.countryName || "Monde",
            city: ev.city || "—",
            device: ev.device || "desktop",
            browser: ev.browser || "Chrome",
            os: detectedOS,
            referrer: ev.referrer || "Direct",
            userAgent: ev.user_agent || ev.userAgent || "",
          };
        });

        setAnalytics({
          totalClicks: total,
          clicksGrowth: d.clicksGrowth ?? 0,
          uniqueClicks: d.uniqueClicks ?? total,
          uniqueClicksGrowth: 0,
          trackedRevenue: 0,
          revenueGrowth: 0,
          avgCtr: 0,
          ctrGrowth: 0,
          bounceRate: 0,
          epc: 0,
          avgEngagementTime: "0s",
          clicksByDay: d.clicksByDay || [],
          topCountries: d.topCountries || [],
          topCities: d.topCities || [],
          topDevices: (d.topDevices || []).map((dv: any) => ({
            label: dv.label || dv.device || dv.name || "desktop",
            device: dv.device || dv.label || dv.name || "desktop",
            count: dv.count || dv.clicks || 0,
            percentage: dv.percentage !== undefined ? dv.percentage : (total > 0 ? Math.round(((dv.count || dv.clicks || 0) / total) * 100) : 0),
          })),
          topBrowsers: (d.topBrowsers || []).map((br: any) => ({
            name: br.name || br.browser || "Chrome",
            browser: br.browser || br.name || "Chrome",
            count: br.count || br.clicks || 0,
            percentage: br.percentage !== undefined ? br.percentage : (total > 0 ? Math.round(((br.count || br.clicks || 0) / total) * 100) : 0),
          })),
          topReferrers: d.topReferrers || [],
          liveClickEvents: liveEvents,
          recentConversions: [],
        });
      }
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
      loadData();
    }
  }, [status, userId]);

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
        if (!matchSlug && !matchBrowser && !matchDevice && !matchOS && !matchCity) return false;
      }
      return true;
    });
  }, [analytics.liveClickEvents, selectedDeviceFilter, searchQuery]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const desktopItem = analytics.topDevices.find((d) => d.device?.toLowerCase() === "desktop");
  const mobileItem = analytics.topDevices.find((d) => d.device?.toLowerCase() === "mobile");

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Navigation Breadcrumb & Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-1.5 text-xs text-neutral-400 hover:text-[#ff6600] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Retour Analytics</span>
            </Link>
            <span className="text-neutral-600">/</span>
            <span className="text-xs text-[#ff6600] font-semibold flex items-center gap-1">
              <Laptop className="w-3 h-3" />
              <span>Appareils & Formats</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Technologies, Écrans & Navigateurs</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/15 text-blue-400 border border-blue-500/30 font-mono">
              Hardware Intelligence
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Analyse détaillée des supports utilisés : Mobile vs Ordinateur, Navigateurs et Systèmes d&apos;exploitation.
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
            className="px-3 py-1.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] text-xs font-semibold text-white focus:outline-none focus:border-[#ff6600] cursor-pointer"
          >
            <option value="all">Tous les liens combinés</option>
            {links.map((l) => (
              <option key={l.id} value={l.id}>
                /{l.slug} ({l.clicksCount || 0} clics)
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-[10px] bg-[#141416] border border-[#222225] text-xs">
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
                    : "text-neutral-400 hover:text-white"
                }`}
              >
                {r === "day" ? "24h" : r === "week" ? "7j" : r === "month" ? "30j" : "12m"}
              </button>
            ))}
          </div>

          <button
            onClick={() => loadData(selectedRange, selectedLinkId)}
            className="p-2 rounded-[10px] bg-[#1a1a1e] hover:bg-white/10 text-neutral-300 hover:text-white border border-[#27272a] transition-all cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#ff6600]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top Device KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Trafic Ordinateur (Desktop)</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="font-bebas text-3xl font-bold text-blue-400">
              {desktopItem ? `${desktopItem.percentage}%` : "0%"}
            </span>
            <span className="text-xs text-neutral-400 font-mono">({desktopItem?.count || 0} clics)</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Grand format & Écrans larges</span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Trafic Mobile & Tactile</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="font-bebas text-3xl font-bold text-emerald-400">
              {mobileItem ? `${mobileItem.percentage}%` : "0%"}
            </span>
            <span className="text-xs text-neutral-400 font-mono">({mobileItem?.count || 0} clics)</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Smartphones & Réseaux Sociaux</span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Navigateur Dominant</span>
          <div className="my-1.5 flex items-center gap-2 truncate">
            <Cpu className="w-5 h-5 text-[#ff6600] shrink-0" />
            <span className="font-bold text-white text-base truncate">
              {analytics.topBrowsers.length > 0 ? analytics.topBrowsers[0].name : "Chrome"}
            </span>
          </div>
          <span className="text-[10px] text-[#ff6600] font-semibold">
            {analytics.topBrowsers.length > 0 ? `${analytics.topBrowsers[0].percentage}% de part` : "100%"}
          </span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Système Majoritaire</span>
          <div className="my-1.5 flex items-center gap-2 truncate">
            <Layers className="w-5 h-5 text-purple-400 shrink-0" />
            <span className="font-bold text-white text-base truncate">
              {osBreakdown.length > 0 ? osBreakdown[0].name : "Windows"}
            </span>
          </div>
          <span className="text-[10px] text-purple-400 font-semibold">
            {osBreakdown.length > 0 ? `${osBreakdown[0].percentage}% du parc` : "100%"}
          </span>
        </div>
      </div>

      {/* 3-COLUMNS: FORMATS, OS & NAVIGATEURS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Formats d'Appareils */}
        <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222225]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Monitor className="w-4 h-4 text-blue-400" />
                <span>Formats d&apos;Écran</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">3 catégories</span>
            </div>

            <div className="space-y-3">
              {analytics.topDevices.map((dv) => {
                const isDesktop = dv.device?.toLowerCase() === "desktop";
                const isMobile = dv.device?.toLowerCase() === "mobile";
                const color = isDesktop ? "#3b82f6" : isMobile ? "#10b981" : "#8b5cf6";
                const IconComponent = isDesktop ? Laptop : isMobile ? Smartphone : Tablet;

                return (
                  <div key={dv.device} className="p-3 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-4 h-4 text-neutral-300" />
                        <span className="text-xs font-bold text-white capitalize">{dv.device}</span>
                      </div>
                      <span className="text-xs font-bold font-mono" style={{ color }}>
                        {dv.percentage}% ({dv.count})
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
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
        <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222225]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>Systèmes d&apos;Exploitation</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">{osBreakdown.length} OS</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {osBreakdown.map((os) => {
                const isWin = os.name.toLowerCase().includes("win");
                const isAndroid = os.name.toLowerCase().includes("android");
                const isApple = os.name.toLowerCase().includes("ios") || os.name.toLowerCase().includes("mac") || os.name.toLowerCase().includes("ipad");
                const isLinux = os.name.toLowerCase().includes("linux");
                const color = isWin ? "#38bdf8" : isAndroid ? "#22c55e" : isApple ? "#a855f7" : isLinux ? "#f97316" : "#eab308";

                return (
                  <div key={os.name} className="p-3 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        <span>{os.name}</span>
                      </span>
                      <span className="text-xs font-bold font-mono" style={{ color }}>
                        {os.percentage}% ({os.count})
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${os.percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Navigateurs Web */}
        <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222225]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-[#ff6600]" />
                <span>Navigateurs Web</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">{analytics.topBrowsers.length} navigateurs</span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {analytics.topBrowsers.map((br) => (
                <div key={br.name} className="p-3 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white">{br.name}</span>
                    <span className="text-xs font-bold text-[#ff6600] font-mono">
                      {br.percentage}% ({br.count})
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#ff6600] transition-all duration-500"
                      style={{ width: `${br.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED TECHNOLOGICAL CLICK STREAM TABLE */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#222225]">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span>Journal Technologique Détaillé</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Historique des visites avec horodatage, formats d&apos;écran, systèmes d&apos;exploitation et navigateurs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter by Device */}
            <div className="flex items-center gap-1 p-1 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] text-xs">
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
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {d === "ALL" ? "Tous" : d === "desktop" ? "Desktop" : "Mobile"}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Filtrer navigateur, OS, lien..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-blue-500"
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
              className="rounded-[10px] bg-[#18181c] border border-[#27272a] p-3.5 flex flex-col gap-2.5 hover:border-purple-500/40 transition-colors"
            >
              {/* Top Row: Device & OS Badges + Relative Time */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold">
                  <span className="px-2 py-0.5 rounded-[10px] bg-blue-500/15 text-blue-400 border border-blue-500/30 capitalize">
                    {ev.device}
                  </span>
                  <span className="px-2 py-0.5 rounded-[10px] bg-purple-500/15 text-purple-400 border border-purple-500/30">
                    {ev.os}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                  {formatDateRelative(ev.timestamp)}
                </span>
              </div>

              {/* Middle Row: Browser & City/Country Location */}
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-300 font-medium truncate">
                  🌐 {ev.browser || "Chrome"}
                </span>
                <span className="text-neutral-400 text-[11px] truncate">
                  📍 {ev.city ? `${ev.city}, ${ev.countryName}` : ev.countryName}
                </span>
              </div>

              {/* Bottom Row: Target Link & Referrer */}
              <div className="flex items-center justify-between pt-2 border-t border-[#222228] text-[11px] gap-2">
                <span className="font-mono font-bold text-cyan-400 md:text-[#ff6600] bg-cyan-500/10 md:bg-[#ff6600]/10 px-2 py-0.5 rounded-[10px] border border-cyan-500/20 md:border-[#ff6600]/20 truncate">
                  /{ev.slug}
                </span>
                <span className="px-2 py-0.5 rounded-[10px] bg-white/5 border border-[#27272a] text-[10px] font-mono text-neutral-400 shrink-0">
                  {ev.referrer || "Direct"}
                </span>
              </div>
            </div>
          ))}

          {paginatedEvents.length === 0 && (
            <div className="py-8 text-center text-neutral-500 text-xs">
              Aucun événement correspondant aux critères.
            </div>
          )}
        </div>

        {/* 2. Desktop Data Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#222225] text-neutral-400 uppercase tracking-wider text-[10px]">
                {visibleColumns.has("timestamp") && <th className="py-2.5 px-3">Horodatage</th>}
                {visibleColumns.has("device") && <th className="py-2.5 px-3">Appareil</th>}
                {visibleColumns.has("browser") && <th className="py-2.5 px-3">Navigateur</th>}
                {visibleColumns.has("os") && <th className="py-2.5 px-3">Système (OS)</th>}
                {visibleColumns.has("link") && <th className="py-2.5 px-3">Lien Cible</th>}
                {visibleColumns.has("location") && <th className="py-2.5 px-3">Localisation</th>}
                {visibleColumns.has("referrer") && <th className="py-2.5 px-3">Source</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222225]/60">
              {paginatedEvents.map((ev) => (
                <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                  {visibleColumns.has("timestamp") && (
                    <td className="py-3 px-3 font-mono text-neutral-400 whitespace-nowrap">
                      {formatDateRelative(ev.timestamp)}
                    </td>
                  )}

                  {visibleColumns.has("device") && (
                    <td className="py-3 px-3 font-semibold text-white capitalize whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px]">
                        {ev.device}
                      </span>
                    </td>
                  )}

                  {visibleColumns.has("browser") && (
                    <td className="py-3 px-3 text-neutral-300 font-medium">
                      {ev.browser || "Chrome"}
                    </td>
                  )}

                  {visibleColumns.has("os") && (
                    <td className="py-3 px-3 font-semibold whitespace-nowrap">
                      <span className="px-2 py-0.5 rounded-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px]">
                        {ev.os}
                      </span>
                    </td>
                  )}

                  {visibleColumns.has("link") && (
                    <td className="py-3 px-3 font-mono text-[#ff6600] font-semibold">
                      /{ev.slug}
                    </td>
                  )}

                  {visibleColumns.has("location") && (
                    <td className="py-3 px-3 text-neutral-400">
                      {ev.city ? `${ev.city}, ${ev.countryName}` : ev.countryName}
                    </td>
                  )}

                  {visibleColumns.has("referrer") && (
                    <td className="py-3 px-3 text-neutral-400">
                      <span className="px-2 py-0.5 rounded-[10px] bg-white/5 border border-[#27272a] text-[10px] font-mono">
                        {ev.referrer || "Direct"}
                      </span>
                    </td>
                  )}
                </tr>
              ))}

              {paginatedEvents.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.size} className="py-8 text-center text-neutral-500 text-xs">
                    Aucun événement correspondant aux critères.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-3 border-t border-[#222225] text-xs text-neutral-400">
          <span className="text-center sm:text-left">
            Affichage de {(currentPage - 1) * pageSize + 1} à{" "}
            {Math.min(currentPage * pageSize, filteredEvents.length)} sur {filteredEvents.length} événements
          </span>

          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] disabled:opacity-40 hover:bg-white/10 text-white cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 py-1 font-mono text-white text-xs bg-[#1a1a1e] border border-[#27272a] rounded-[10px] whitespace-nowrap">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] disabled:opacity-40 hover:bg-white/10 text-white cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
