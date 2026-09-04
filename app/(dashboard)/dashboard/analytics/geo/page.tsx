"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe2,
  ArrowLeft,
  Calendar,
  Filter,
  Search,
  MapPin,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft
} from "lucide-react";
import { ShortLink, GlobalAnalytics } from "@/types";
import { cfGetAnalytics, cfGetLinks } from "@/lib/cloudflare-api";
import {
  Continent,
  CONTINENTS_META,
  WORLD_COUNTRIES,
  getCountryData,
  getContinentForCountry,
  getCountryName,
  getCountryFlag,
} from "@/lib/geo-coordinates";
import { detectOSFromEvent } from "@/lib/device-detection";
import { ContinentsVectorMap, ContinentTraffic } from "@/components/dashboard/analytics/continents-vector-map";
import { ColumnMaskToggle, ColumnDefinition } from "@/components/dashboard/analytics/column-mask-toggle";
import { Button } from "@/components/ui/button";
import { formatDateRelative, formatNumber } from "@/lib/utils";

const GEO_COLUMNS: ColumnDefinition[] = [
  { key: "timestamp", label: "Horodatage", defaultVisible: true },
  { key: "country", label: "Pays & Drapeau", defaultVisible: true },
  { key: "city", label: "Ville / Région", defaultVisible: true },
  { key: "continent", label: "Continent", defaultVisible: true },
  { key: "link", label: "Lien Cible", defaultVisible: true },
  { key: "device", label: "Appareil & OS", defaultVisible: true },
  { key: "browser", label: "Navigateur", defaultVisible: true },
  { key: "referrer", label: "Source", defaultVisible: true },
];

export default function GeoAnalyticsPage() {
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
  const [selectedContinent, setSelectedContinent] = useState<Continent | "ALL">("ALL");
  const [selectedCountryFilter, setSelectedCountryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  // Column Visibility State
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(GEO_COLUMNS.map((c) => c.key))
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
    setVisibleColumns(new Set(GEO_COLUMNS.map((c) => c.key)));
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
        routingRules: [],
        geoTargeting: {},
        deviceTargeting: {},
        isPasswordProtected: Boolean(l.is_password_protected || l.isPasswordProtected || l.has_password || l.hasPassword || l.password),
        isCloaked: Boolean(l.is_cloaked || l.isCloaked),
        metaTitle: l.meta_title || l.slug,
        hideReferrer: Boolean(l.hide_referrer),
        tags: [],
        isActive: Boolean(l.is_active !== 0),
        created_at: l.created_at || new Date().toISOString(),
      }));

      setLinks(fetchedLinks);

      if (analyticsRes?.data) {
        const d = analyticsRes.data;
        const total = d.totalClicks ?? d.total_clicks ?? 0;
        const liveEvents = d.liveClickEvents ?? d.live_click_events ?? [];

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
          topCountries: (d.topCountries || []).map((c: any) => {
            const code = (c.code || c.country_code || c.country || "XX").toUpperCase();
            const cnt = c.count || c.clicks || 0;
            return {
              code,
              name: getCountryName(code),
              count: cnt,
              percentage: c.percentage !== undefined ? c.percentage : (total > 0 ? Math.round((cnt / total) * 100) : 0),
            };
          }),
          topCities: (d.topCities || []).map((ci: any) => ({
            city: ci.city || ci.name || "Inconnue",
            countryCode: (ci.countryCode || ci.country_code || "XX").toUpperCase(),
            count: ci.count || ci.clicks || 0,
            percentage: ci.percentage !== undefined ? ci.percentage : (total > 0 ? Math.round(((ci.count || ci.clicks || 0) / total) * 100) : 0),
          })),
          topDevices: d.topDevices || [],
          topBrowsers: d.topBrowsers || [],
          topReferrers: d.topReferrers || [],
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
              os: detectOSFromEvent(ev),
              referrer: ev.referrer || "Direct",
            };
          }),
          recentConversions: [],
        });
      }
    } catch (err) {
      console.error("Geo analytics fetch error:", err);
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

  // Aggregate Traffic per Continent
  const continentsData = useMemo<Record<Continent, ContinentTraffic>>(() => {
    const base: Record<Continent, ContinentTraffic> = {
      Africa: { continent: "Africa", clicks: 0, uniqueVisitors: 0, percentage: 0, countriesCount: 0 },
      Europe: { continent: "Europe", clicks: 0, uniqueVisitors: 0, percentage: 0, countriesCount: 0 },
      "North America": { continent: "North America", clicks: 0, uniqueVisitors: 0, percentage: 0, countriesCount: 0 },
      "South America": { continent: "South America", clicks: 0, uniqueVisitors: 0, percentage: 0, countriesCount: 0 },
      Asia: { continent: "Asia", clicks: 0, uniqueVisitors: 0, percentage: 0, countriesCount: 0 },
      Oceania: { continent: "Oceania", clicks: 0, uniqueVisitors: 0, percentage: 0, countriesCount: 0 },
    };

    const countriesPerContinent: Record<Continent, Set<string>> = {
      Africa: new Set(),
      Europe: new Set(),
      "North America": new Set(),
      "South America": new Set(),
      Asia: new Set(),
      Oceania: new Set(),
    };

    analytics.topCountries.forEach((c) => {
      const cont = getContinentForCountry(c.code);
      base[cont].clicks += c.count;
      countriesPerContinent[cont].add(c.code);
    });

    const total = analytics.totalClicks || 1;
    (Object.keys(base) as Continent[]).forEach((cont) => {
      base[cont].percentage = Math.round((base[cont].clicks / total) * 100);
      base[cont].countriesCount = countriesPerContinent[cont].size;
    });

    return base;
  }, [analytics.topCountries, analytics.totalClicks]);

  // Top Continent calculation
  const topContinent = useMemo(() => {
    const sorted = Object.values(continentsData).sort((a, b) => b.clicks - a.clicks);
    return sorted[0]?.clicks > 0 ? sorted[0] : null;
  }, [continentsData]);

  // Filtered Live Click Events
  const filteredEvents = useMemo(() => {
    return analytics.liveClickEvents.filter((ev) => {
      const cont = getContinentForCountry(ev.countryCode);
      if (selectedContinent !== "ALL" && cont !== selectedContinent) return false;
      if (selectedCountryFilter !== "ALL" && ev.countryCode !== selectedCountryFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchSlug = ev.slug?.toLowerCase().includes(q);
        const matchCountry = ev.countryName?.toLowerCase().includes(q) || ev.countryCode?.toLowerCase().includes(q);
        const matchCity = ev.city?.toLowerCase().includes(q);
        const matchBrowser = ev.browser?.toLowerCase().includes(q);
        const matchDevice = ev.device?.toLowerCase().includes(q);
        const matchRef = ev.referrer?.toLowerCase().includes(q);
        if (!matchSlug && !matchCountry && !matchCity && !matchBrowser && !matchDevice && !matchRef) return false;
      }
      return true;
    });
  }, [analytics.liveClickEvents, selectedContinent, selectedCountryFilter, searchQuery]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;
  const paginatedEvents = filteredEvents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

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
            <span className="text-xs text-cyan-400 md:text-[#ff6600] font-semibold flex items-center gap-1">
              <Globe2 className="w-3 h-3" />
              <span>Contexte Géographique</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Analyse Géographique Avancée</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#ff6600]/15 text-[#ff6600] border border-[#ff6600]/30 font-mono">
              Live Geo Edge
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Visualisation continentale, cartographie par pays, villes, quartiers et horodatages précis.
          </p>
        </div>

        {/* Global Controls: Period & Link Selector */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Link Selector */}
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

          {/* Period Range Buttons */}
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

          {/* Refresh Button */}
          <button
            onClick={() => loadData(selectedRange, selectedLinkId)}
            className="p-2 rounded-[10px] bg-[#1a1a1e] hover:bg-white/10 text-neutral-300 hover:text-white border border-[#27272a] transition-all cursor-pointer"
            title="Rafraîchir les données"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#ff6600]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top Geo KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Total Clics Géolocalisés</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="font-bebas text-3xl font-bold text-white">
              {formatNumber(analytics.totalClicks)}
            </span>
            <span className="text-xs text-emerald-400 font-bold">100% certifiés</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Précision IP Edge</span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Top Continent</span>
          <div className="my-1.5 flex items-center gap-2 truncate">
            <span className="text-xl">{topContinent ? CONTINENTS_META[topContinent.continent]?.icon : "🌍"}</span>
            <span className="font-bold text-white text-base truncate">
              {topContinent ? CONTINENTS_META[topContinent.continent]?.name : "En attente"}
            </span>
          </div>
          <span className="text-[10px] text-[#ff6600] font-semibold">
            {topContinent ? `${topContinent.percentage}% du trafic global` : "0%"}
          </span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Top Pays</span>
          <div className="my-1.5 flex items-center gap-2 truncate">
            <span className="text-xl">
              {analytics.topCountries.length > 0 ? getCountryFlag(analytics.topCountries[0].code) : "🌐"}
            </span>
            <span className="font-bold text-white text-base truncate">
              {analytics.topCountries.length > 0 ? analytics.topCountries[0].name : "En attente"}
            </span>
          </div>
          <span className="text-[10px] text-emerald-400 font-semibold">
            {analytics.topCountries.length > 0 ? `${analytics.topCountries[0].percentage}% des visites` : "0%"}
          </span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Top Ville</span>
          <div className="my-1.5 flex items-center gap-1.5 truncate">
            <MapPin className="w-4 h-4 text-[#ff6600] shrink-0" />
            <span className="font-bold text-white text-base truncate">
              {analytics.topCities.length > 0 ? analytics.topCities[0].city : "En attente"}
            </span>
          </div>
          <span className="text-[10px] text-neutral-400 font-semibold truncate">
            {analytics.topCities.length > 0 ? `${analytics.topCities[0].percentage}% de la zone` : "0%"}
          </span>
        </div>

        <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between col-span-2 lg:col-span-1">
          <span className="text-[11px] font-semibold text-neutral-400">Couverture Mondiale</span>
          <div className="my-1.5 flex items-baseline gap-1.5">
            <span className="font-bebas text-3xl font-bold text-emerald-400">
              {analytics.topCountries.length}
            </span>
            <span className="text-xs text-neutral-400">pays touchés</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">Edge Cloudflare Mondial</span>
        </div>
      </div>

      {/* CONTINENTS INTERACTIVE VECTOR MAP COMPONENT (react-simple-maps) */}
      <ContinentsVectorMap
        continentsData={continentsData}
        selectedContinent={selectedContinent}
        onSelectContinent={(c) => {
          setSelectedContinent(c);
          setSelectedCountryFilter("ALL");
          setCurrentPage(1);
        }}
        totalClicks={analytics.totalClicks}
        topCountries={analytics.topCountries}
        selectedCountry={selectedCountryFilter}
        onSelectCountry={(c) => {
          setSelectedCountryFilter(c);
          setCurrentPage(1);
        }}
      />

      {/* 2-COLUMNS: TOP PAYS & TOP VILLES GRANULAR BREAKDOWN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Pays Box */}
        <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222225]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Globe2 className="w-4 h-4 text-cyan-400 md:text-[#ff6600]" />
                <span>Top Pays par Volume</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {analytics.topCountries.length} pays répertoriés
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {analytics.topCountries.map((c) => {
                const flag = getCountryFlag(c.code);
                const isSelected = selectedCountryFilter === c.code;

                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => {
                      setSelectedCountryFilter(isSelected ? "ALL" : c.code);
                      setCurrentPage(1);
                    }}
                    className={`w-full p-2.5 rounded-[10px] border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-[#ff6600]/15 border-[#ff6600] shadow-md"
                        : "bg-[#1a1a1e] border-[#27272a] hover:border-neutral-500"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-lg shrink-0">{flag}</span>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{c.name}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">{c.code} • {getContinentForCountry(c.code)}</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <span className="text-xs font-bold text-white font-mono">{c.count}</span>
                        <span className="text-[10px] font-bold text-[#ff6600]">({c.percentage}%)</span>
                      </div>
                      <div className="w-20 h-1 rounded-full bg-white/10 mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#ff6600]"
                          style={{ width: `${c.percentage}%` }}
                        />
                      </div>
                    </div>
                  </button>
                );
              })}

              {analytics.topCountries.length === 0 && (
                <p className="text-xs text-neutral-500 text-center py-8">
                  En attente de visites géolocalisées...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Top Villes & Métropoles Box */}
        <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222225]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-emerald-400" />
                <span>Top Villes & Métropoles</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {analytics.topCities.length} villes identifiées
              </span>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {analytics.topCities.map((ci, idx) => {
                const flag = getCountryFlag(ci.countryCode);
                return (
                  <div
                    key={`${ci.city}-${idx}`}
                    className="p-2.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-lg shrink-0">{flag}</span>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white truncate">{ci.city}</p>
                        <p className="text-[10px] text-neutral-400 font-mono">{getCountryName(ci.countryCode)} ({ci.countryCode})</p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="flex items-baseline justify-end gap-1.5">
                        <span className="text-xs font-bold text-white font-mono">{ci.count}</span>
                        <span className="text-[10px] font-bold text-emerald-400">({ci.percentage}%)</span>
                      </div>
                      <div className="w-20 h-1 rounded-full bg-white/10 mt-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-emerald-400"
                          style={{ width: `${ci.percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {analytics.topCities.length === 0 && (
                <p className="text-xs text-neutral-500 text-center py-8">
                  En attente de détection urbaine...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ADVANCED LIVE GEOLOCATION STREAM (JOURNAL GÉOGRAPHIQUE AVANCÉ) */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#222225]">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#ff6600]" />
              <span>Journal Géographique Détaillé en Direct</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Historique chronologique horodaté des visiteurs avec localisation et métadonnées complètes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Filtrer par ville, pays, lien..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-[#ff6600]"
              />
            </div>

            {/* Column Masking Toggle */}
            <ColumnMaskToggle
              columns={GEO_COLUMNS}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
              onResetColumns={resetColumns}
            />
          </div>
        </div>

        {/* 1. Mobile Cards Layout (< 768px) */}
        <div className="flex flex-col gap-3 md:hidden">
          {paginatedEvents.map((ev) => {
            const flag = getCountryFlag(ev.countryCode);
            const cont = getContinentForCountry(ev.countryCode);
            const contMeta = CONTINENTS_META[cont];

            return (
              <div
                key={ev.id}
                className="rounded-[10px] bg-[#18181c] border border-[#27272a] p-3.5 flex flex-col gap-2.5 hover:border-cyan-500/40 transition-colors"
              >
                {/* Top Row: Flag & Country + Relative Time */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-base shrink-0">{flag}</span>
                    <span className="font-bold text-white text-xs truncate">{ev.countryName}</span>
                    <span className="text-[10px] font-mono text-neutral-500">({ev.countryCode})</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-400 shrink-0">
                    {formatDateRelative(ev.timestamp)}
                  </span>
                </div>

                {/* Middle Row: City & Continent Badge */}
                <div className="flex items-center justify-between text-xs">
                  <span className="text-neutral-300 font-medium truncate">
                    📍 {ev.city || "Zone non géocodée"}
                  </span>
                  <span
                    className="text-[10px] font-semibold px-2 py-0.5 rounded-full border shrink-0"
                    style={{
                      color: contMeta.color,
                      borderColor: `${contMeta.color}40`,
                      backgroundColor: `${contMeta.color}15`,
                    }}
                  >
                    {contMeta.name}
                  </span>
                </div>

                {/* Bottom Row: Link & Device Tech Tags */}
                <div className="flex items-center justify-between pt-2 border-t border-[#222228] text-[11px] gap-2">
                  <span className="font-mono font-bold text-cyan-400 md:text-[#ff6600] bg-cyan-500/10 md:bg-[#ff6600]/10 px-2 py-0.5 rounded-[10px] border border-cyan-500/20 md:border-[#ff6600]/20 truncate">
                    /{ev.slug}
                  </span>
                  <div className="flex items-center gap-1.5 text-[10px] shrink-0 font-mono">
                    <span className="px-1.5 py-0.5 rounded-[10px] bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                      {ev.device}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-[10px] bg-purple-500/10 text-purple-400 border border-purple-500/20">
                      {ev.browser}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {paginatedEvents.length === 0 && (
            <div className="py-8 text-center text-neutral-500 text-xs">
              Aucun événement correspondant aux filtres sélectionnés.
            </div>
          )}
        </div>

        {/* 2. Desktop Data Table (>= 768px) */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#222225] text-neutral-400 uppercase tracking-wider text-[10px]">
                {visibleColumns.has("timestamp") && <th className="py-2.5 px-3">Horodatage</th>}
                {visibleColumns.has("country") && <th className="py-2.5 px-3">Pays</th>}
                {visibleColumns.has("city") && <th className="py-2.5 px-3">Ville / Région</th>}
                {visibleColumns.has("continent") && <th className="py-2.5 px-3">Continent</th>}
                {visibleColumns.has("link") && <th className="py-2.5 px-3">Lien</th>}
                {visibleColumns.has("device") && <th className="py-2.5 px-3">Appareil</th>}
                {visibleColumns.has("browser") && <th className="py-2.5 px-3">Navigateur</th>}
                {visibleColumns.has("referrer") && <th className="py-2.5 px-3">Source</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222225]/60">
              {paginatedEvents.map((ev) => {
                const flag = getCountryFlag(ev.countryCode);
                const cont = getContinentForCountry(ev.countryCode);
                const contMeta = CONTINENTS_META[cont];

                return (
                  <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                    {visibleColumns.has("timestamp") && (
                      <td className="py-3 px-3 font-mono text-neutral-400 whitespace-nowrap">
                        {formatDateRelative(ev.timestamp)}
                      </td>
                    )}

                    {visibleColumns.has("country") && (
                      <td className="py-3 px-3 font-semibold text-white whitespace-nowrap">
                        <span className="mr-1.5">{flag}</span>
                        <span>{ev.countryName}</span>
                        <span className="text-[10px] text-neutral-500 font-mono ml-1">({ev.countryCode})</span>
                      </td>
                    )}

                    {visibleColumns.has("city") && (
                      <td className="py-3 px-3 text-neutral-300 font-medium">
                        {ev.city || "—"}
                      </td>
                    )}

                    {visibleColumns.has("continent") && (
                      <td className="py-3 px-3">
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold border"
                          style={{
                            color: contMeta.color,
                            borderColor: `${contMeta.color}40`,
                            backgroundColor: `${contMeta.color}15`,
                          }}
                        >
                          {contMeta.name}
                        </span>
                      </td>
                    )}

                    {visibleColumns.has("link") && (
                      <td className="py-3 px-3 font-mono text-[#ff6600] font-semibold">
                        /{ev.slug}
                      </td>
                    )}

                    {visibleColumns.has("device") && (
                      <td className="py-3 px-3 text-neutral-400 capitalize">
                        {ev.device}
                      </td>
                    )}

                    {visibleColumns.has("browser") && (
                      <td className="py-3 px-3 text-neutral-400">
                        {ev.browser}
                      </td>
                    )}

                    {visibleColumns.has("referrer") && (
                      <td className="py-3 px-3 text-neutral-300">
                        <span className="px-2 py-0.5 rounded-[10px] bg-white/5 border border-[#27272a] text-[10px] font-mono">
                          {ev.referrer || "Direct"}
                        </span>
                      </td>
                    )}
                  </tr>
                );
              })}

              {paginatedEvents.length === 0 && (
                <tr>
                  <td colSpan={visibleColumns.size} className="py-8 text-center text-neutral-500 text-xs">
                    Aucun événement correspondant aux filtres sélectionnés.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
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
