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
import { formatDateRelative, formatNumber } from "@/lib/utils";

const SOURCE_COLUMNS: ColumnDefinition[] = [
  { key: "timestamp", label: "Horodatage", defaultVisible: true },
  { key: "channel", label: "Canal", defaultVisible: true },
  { key: "referrer", label: "Source / Referrer", defaultVisible: true },
  { key: "link", label: "Lien Cible", defaultVisible: true },
  { key: "location", label: "Localisation", defaultVisible: true },
  { key: "device", label: "Appareil", defaultVisible: true },
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
      setLinks(listData);

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
          topCountries: d.topCountries || [],
          topCities: d.topCities || [],
          topDevices: d.topDevices || [],
          topBrowsers: d.topBrowsers || [],
          topReferrers: (d.topReferrers || []).map((rf: any) => ({
            name: rf.name || rf.referrer || "Direct",
            referrer: rf.referrer || rf.name || "Direct",
            count: rf.count || rf.clicks || 0,
            percentage: rf.percentage !== undefined ? rf.percentage : (total > 0 ? Math.round(((rf.count || rf.clicks || 0) / total) * 100) : 0),
          })),
          liveClickEvents: liveEvents,
          recentConversions: [],
        });
      }
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
      loadData();
    }
  }, [status, userId]);

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
        if (!matchSlug && !matchRef && !matchCity && !matchCountry) return false;
      }
      return true;
    });
  }, [analytics.liveClickEvents, selectedChannelFilter, searchQuery]);

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
            <span className="text-xs text-[#ff6600] font-semibold flex items-center gap-1">
              <Share2 className="w-3 h-3" />
              <span>Sources de Trafic</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>Origines, Canaux & Référents</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-mono">
              Attribution Traffic
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1">
            Traçabilité des plateformes sources : Réseaux Sociaux, Partages Directs, Moteurs et Campagnes Marketing.
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
            className="px-3 py-1.5 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] text-xs font-semibold text-white focus:outline-none focus:border-[#ff6600] cursor-pointer"
          >
            <option value="all">Tous les liens combinés</option>
            {links.map((l) => (
              <option key={l.id} value={l.id}>
                /{l.slug} ({l.clicksCount || 0} clics)
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-[8px] bg-[#141416] border border-[#222225] text-xs">
            {(["day", "week", "month", "year"] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setSelectedRange(r);
                  loadData(r, selectedLinkId);
                }}
                className={`px-2.5 py-1 rounded-[6px] font-semibold transition-all cursor-pointer ${
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
            className="p-2 rounded-[8px] bg-[#1a1a1e] hover:bg-white/10 text-neutral-300 hover:text-white border border-[#27272a] transition-all cursor-pointer"
            title="Rafraîchir"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-[#ff6600]" : ""}`} />
          </button>
        </div>
      </div>

      {/* Top Source KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-[12px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Réseaux Sociaux</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="font-bebas text-3xl font-bold text-[#ff6600]">
              {socialPercentage}%
            </span>
            <span className="text-xs text-neutral-400 font-mono">({socialClicksTotal} clics)</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">LinkedIn, Twitter/X, WhatsApp</span>
        </div>

        <div className="p-4 rounded-[12px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Accès Direct & Messagerie</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="font-bebas text-3xl font-bold text-emerald-400">
              {directPercentage}%
            </span>
            <span className="text-xs text-neutral-400 font-mono">({directClicksTotal} clics)</span>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">QR codes, SMS & Liens copiés</span>
        </div>

        <div className="p-4 rounded-[12px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Top Plateforme Sociale</span>
          <div className="my-1.5 flex items-center gap-2 truncate">
            <Share2 className="w-5 h-5 text-blue-400 shrink-0" />
            <span className="font-bold text-white text-base truncate">
              {socialBreakdown.length > 0 ? socialBreakdown[0].name : "LinkedIn"}
            </span>
          </div>
          <span className="text-[10px] text-blue-400 font-semibold">
            {socialBreakdown.length > 0 ? `${socialBreakdown[0].percentage}% du trafic total` : "Actif"}
          </span>
        </div>

        <div className="p-4 rounded-[12px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-[11px] font-semibold text-neutral-400">Canaux Référents Actifs</span>
          <div className="my-1.5 flex items-baseline gap-2">
            <span className="font-bebas text-3xl font-bold text-purple-400">
              {analytics.topReferrers.length}
            </span>
            <span className="text-xs text-neutral-400">sources détectées</span>
          </div>
          <span className="text-[10px] text-purple-400 font-semibold">Multi-canaux Edge</span>
        </div>
      </div>

      {/* 2-COLUMNS: SOCIAL NETWORKS & ALL REFERRERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Réseaux Sociaux Dédiés */}
        <div className="rounded-[16px] bg-[#141416] border border-[#222225] p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222225]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Share2 className="w-4 h-4 text-[#ff6600]" />
                <span>Performance Réseaux Sociaux</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {socialClicksTotal} clics sociaux
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
                  <div key={soc.name} className="p-3 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="text-xs font-bold text-white">{soc.name}</span>
                      <span className="text-xs font-bold font-mono" style={{ color }}>
                        {soc.percentage}% ({soc.count} clics)
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${soc.percentage}%`, backgroundColor: color }}
                      />
                    </div>
                  </div>
                );
              })}

              {socialBreakdown.length === 0 && (
                <p className="text-xs text-neutral-500 text-center py-8">
                  En attente de partages sur les réseaux sociaux...
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Tous les Référents & Canaux */}
        <div className="rounded-[16px] bg-[#141416] border border-[#222225] p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-[#222225]">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-emerald-400" />
                <span>Tous les Canaux Référents</span>
              </span>
              <span className="text-[11px] text-neutral-400 font-mono">
                {analytics.topReferrers.length} sources
              </span>
            </div>

            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {analytics.topReferrers.map((rf) => (
                <div key={rf.name} className="p-3 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-white">{rf.name}</span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {rf.percentage}% ({rf.count} clics)
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                      style={{ width: `${rf.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* DETAILED SOURCES CLICK STREAM TABLE */}
      <div className="rounded-[16px] bg-[#141416] border border-[#222225] p-5 sm:p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#222225]">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Journal Détaillé des Provenances</span>
            </h3>
            <p className="text-xs text-neutral-400">
              Historique des clics avec plateforme d&apos;origine, referrers exacts, localisation et liens cibles.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Channel */}
            <div className="flex items-center gap-1 p-1 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] text-xs">
              {(["ALL", "social", "direct"] as const).map((ch) => (
                <button
                  key={ch}
                  onClick={() => {
                    setSelectedChannelFilter(ch);
                    setCurrentPage(1);
                  }}
                  className={`px-2.5 py-1 rounded-[6px] font-semibold transition-all cursor-pointer ${
                    selectedChannelFilter === ch
                      ? "bg-emerald-600 text-white font-bold"
                      : "text-neutral-400 hover:text-white"
                  }`}
                >
                  {ch === "ALL" ? "Tous" : ch === "social" ? "Réseaux Sociaux" : "Direct"}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
              <input
                type="text"
                placeholder="Filtrer source, lien, ville..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
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
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#222225] text-neutral-400 uppercase tracking-wider text-[10px]">
                {visibleColumns.has("timestamp") && <th className="py-2.5 px-3">Horodatage</th>}
                {visibleColumns.has("channel") && <th className="py-2.5 px-3">Canal</th>}
                {visibleColumns.has("referrer") && <th className="py-2.5 px-3">Source / Referrer</th>}
                {visibleColumns.has("link") && <th className="py-2.5 px-3">Lien Cible</th>}
                {visibleColumns.has("location") && <th className="py-2.5 px-3">Localisation</th>}
                {visibleColumns.has("device") && <th className="py-2.5 px-3">Appareil</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222225]/60">
              {paginatedEvents.map((ev) => {
                const ref = ev.referrer || "Direct";
                const isSocial = ["linkedin", "twitter", "x.com", "whatsapp", "facebook", "instagram", "t.co"].some((k) => ref.toLowerCase().includes(k));

                return (
                  <tr key={ev.id} className="hover:bg-white/5 transition-colors">
                    {visibleColumns.has("timestamp") && (
                      <td className="py-3 px-3 font-mono text-neutral-400 whitespace-nowrap">
                        {formatDateRelative(ev.timestamp)}
                      </td>
                    )}

                    {visibleColumns.has("channel") && (
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            isSocial
                              ? "bg-[#ff6600]/10 text-[#ff6600] border-[#ff6600]/30"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                          }`}
                        >
                          {isSocial ? "Réseau Social" : "Direct / QR"}
                        </span>
                      </td>
                    )}

                    {visibleColumns.has("referrer") && (
                      <td className="py-3 px-3 font-semibold text-white">
                        <span className="px-2 py-0.5 rounded-[6px] bg-white/5 border border-[#27272a] text-[10px] font-mono">
                          {ref}
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

                    {visibleColumns.has("device") && (
                      <td className="py-3 px-3 text-neutral-400 capitalize">
                        {ev.device}
                      </td>
                    )}
                  </tr>
                );
              })}

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
        <div className="flex items-center justify-between pt-4 mt-3 border-t border-[#222225] text-xs text-neutral-400">
          <span>
            Affichage de {(currentPage - 1) * pageSize + 1} à{" "}
            {Math.min(currentPage * pageSize, filteredEvents.length)} sur {filteredEvents.length} événements
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-[6px] bg-[#1a1a1e] border border-[#27272a] disabled:opacity-40 hover:bg-white/10 text-white cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-white">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-[6px] bg-[#1a1a1e] border border-[#27272a] disabled:opacity-40 hover:bg-white/10 text-white cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
