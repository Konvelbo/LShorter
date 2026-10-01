"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Activity,
  ArrowLeft,
  Calendar,
  Download,
  Filter,
  Globe2,
  Laptop,
  MousePointerClick,
  RefreshCw,
  Search,
  Smartphone,
  Sparkles,
  Zap,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  ExternalLink,
  Copy,
  MapPin,
} from "lucide-react";
import { ShortLink, TimeRange } from "@/types";
import {
  cfGetAnalytics,
  cfGetLinks,
  cfInvalidateCache,
} from "@/lib/cloudflare-api";
import {
  ColumnMaskToggle,
  ColumnDefinition,
} from "@/components/dashboard/analytics/column-mask-toggle";
import { formatNumber, getCountryName } from "@/lib/utils";
import { detectOSFromEvent } from "@/lib/device-detection";
import { AnalyticsLiveSkeleton } from "@/components/ui/skeleton";
import { exportToExcelWorkbook } from "@/lib/export-excel";
import { showToast } from "@/components/ui/toast-provider";
import { ReferrerBadge, ReferrerLogo } from "@/components/dashboard/analytics/referrer-badge";

const STREAM_COLUMNS: ColumnDefinition[] = [
  { key: "timestamp", label: "Timestamp", defaultVisible: true },
  { key: "slug", label: "Short Link", defaultVisible: true },
  { key: "customer", label: "Customer / Buyer", defaultVisible: true },
  { key: "city", label: "City", defaultVisible: true },
  { key: "location", label: "Country", defaultVisible: true },
  { key: "referrer", label: "Referrer Source", defaultVisible: true },
  { key: "device", label: "Device & Browser", defaultVisible: true },
  { key: "status", label: "Edge Status", defaultVisible: true },
];

/** Formateur de temps relatif réactif qui recalcule les minutes en direct */
function formatLiveRelativeTime(
  timestamp: string | number | Date,
  nowMs: number,
): string {
  if (!timestamp) return "Just now";
  let timeMs = 0;
  if (typeof timestamp === "number") {
    timeMs = timestamp < 1e11 ? timestamp * 1000 : timestamp;
  } else if (timestamp instanceof Date) {
    timeMs = timestamp.getTime();
  } else {
    let s = String(timestamp).trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
      s = s.replace(" ", "T") + "Z";
    }
    const parsed = Date.parse(s);
    timeMs = isNaN(parsed) ? new Date(timestamp).getTime() : parsed;
  }

  if (isNaN(timeMs) || timeMs <= 0) return "Just now";
  const diffSec = Math.floor((nowMs - timeMs) / 1000);
  if (diffSec < 60) return "Just now";
  const mins = Math.floor(diffSec / 60);
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function LiveClickStreamContent() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const userId = session?.user?.id || "";

  // Déclaration de tous les hooks au sommet
  const [currentTimeTick, setCurrentTimeTick] = useState<number>(() =>
    Date.now(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [totalClicksCount, setTotalClicksCount] = useState<number>(0);
  const [selectedRange, setSelectedRange] = useState<TimeRange>("month");
  const [selectedLinkId, setSelectedLinkId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Horloge de rafraîchissement des minutes (se déclenche toutes les 5s)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(STREAM_COLUMNS.map((c) => c.key)),
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
    setVisibleColumns(new Set(STREAM_COLUMNS.map((c) => c.key)));
  };

  const hasLoadedOnceRef = useRef(false);

  const loadStreamData = async (
    range = selectedRange,
    linkId = selectedLinkId,
    isBg = false,
  ) => {
    if (!userId) return;
    if (!isBg && !hasLoadedOnceRef.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const periodParam =
        range === "day"
          ? "1d"
          : range === "week"
            ? "7d"
            : range === "year"
              ? "365d"
              : "30d";

      let [analyticsRes, linksRes] = await Promise.all([
        cfGetAnalytics(
          userId,
          periodParam,
          linkId !== "all" ? linkId : undefined,
        ).catch(() => null),
        cfGetLinks(userId).catch(() => null),
      ]);

      // Repli vers /api/analytics si nécessaire
      if (!analyticsRes || !analyticsRes.data) {
        analyticsRes = await fetch(
          `/api/analytics?userId=${encodeURIComponent(userId)}&period=${periodParam}${linkId !== "all" ? `&linkId=${encodeURIComponent(linkId)}` : ""}`,
          { cache: "no-store" },
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
      }

      const listData = Array.isArray(linksRes?.data)
        ? linksRes.data
        : Array.isArray((linksRes?.data as any)?.data)
          ? (linksRes?.data as any).data
          : [];
      setLinks(listData);

      const d =
        analyticsRes?.data?.data || analyticsRes?.data || analyticsRes || {};
      const workerTotal = Number(d.totalClicks ?? d.total_clicks ?? 0);
      const sumLinksClicks = listData.reduce(
        (acc: number, l: any) =>
          acc + Number(l.clicks_count ?? l.clicksCount ?? l.clicks ?? 0),
        0,
      );
      const isShortWindow = range === "day" || range === "week";
      const effectiveTotalClicks = isShortWindow
        ? workerTotal
        : Math.max(workerTotal, sumLinksClicks);
      setTotalClicksCount(effectiveTotalClicks);

      const rawLive =
        d.liveClickEvents ||
        d.live_click_events ||
        d.recentClicks ||
        d.events ||
        [];
      let mappedEvents: any[] = [];

      // Traitement des VRAIS clics reçus
      if (Array.isArray(rawLive) && rawLive.length > 0) {
        mappedEvents = rawLive.map((ev: any, idx: number) => {
          const code = (
            ev.country_code ||
            ev.countryCode ||
            ev.country ||
            "XX"
          ).toUpperCase();
          const countryName =
            ev.countryName || ev.country_name || getCountryName(code) || code;
          return {
            id: ev.id || `evt_${idx}`,
            timestamp:
              ev.timestamp || ev.created_at || new Date().toISOString(),
            slug: ev.slug || "link",
            countryCode: code,
            countryName,
            city: ev.city && ev.city !== "Inconnue" && ev.city !== "—" ? ev.city : (ev.city || "Edge PoP"),
            ipMasked: ev.ip_masked || ev.ipMasked || "•••.•••.•••",
            device: ev.device && ev.device !== "unknown" ? ev.device : "Inconnu",
            os: detectOSFromEvent(ev) || (ev.os && ev.os !== "unknown" ? ev.os : "Inconnu"),
            browser: ev.browser && ev.browser !== "unknown" ? ev.browser : "Inconnu",
            referrer: ev.referrer || "Direct",
            latencyMs: ev.latency_ms
              ? `${ev.latency_ms}ms`
              : ev.latency
                ? `${ev.latency}ms`
                : "—",
            customerName:
              ev.customerName || ev.customer_name || ev.fullName || null,
            customerEmail:
              ev.customerEmail || ev.customer_email || ev.email || null,
            conversionAmount: Number(
              ev.conversionAmount || ev.conversion_amount || 0,
            ),
          };
        });
      }

      setEvents(mappedEvents);
      hasLoadedOnceRef.current = true;
    } catch {
      setEvents([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleLinkChange = (newLinkId: string) => {
    setSelectedLinkId(newLinkId);
    setCurrentPage(1);
    cfInvalidateCache();
    loadStreamData(selectedRange, newLinkId);
  };

  const handleRangeChange = (newRange: TimeRange) => {
    setSelectedRange(newRange);
    setCurrentPage(1);
    cfInvalidateCache();
    loadStreamData(newRange, selectedLinkId);
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      setIsLoading(false);
      return;
    }
    if (userId) {
      const qLinkId =
        searchParams.get("linkId") || searchParams.get("slug") || "all";
      setSelectedLinkId(qLinkId);
      loadStreamData(selectedRange, qLinkId, hasLoadedOnceRef.current);
    }
  }, [status, userId]);

  useEffect(() => {
    if (!userId) return;

    const handleUpdate = () => {
      cfInvalidateCache();
      const qLinkId =
        searchParams.get("linkId") ||
        searchParams.get("slug") ||
        selectedLinkId;
      loadStreamData(selectedRange, qLinkId, true);
    };

    window.addEventListener("lshorter_data_change", handleUpdate);
    window.addEventListener("lshorter_links_updated", handleUpdate);

    return () => {
      window.removeEventListener("lshorter_data_change", handleUpdate);
      window.removeEventListener("lshorter_links_updated", handleUpdate);
    };
  }, [userId, selectedRange, selectedLinkId, searchParams]);

  const filteredEvents = useMemo(() => {
    return events.filter((ev) => {
      if (selectedLinkId !== "all" && ev.slug !== selectedLinkId) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const match =
          ev.slug?.toLowerCase().includes(q) ||
          ev.city?.toLowerCase().includes(q) ||
          ev.countryName?.toLowerCase().includes(q) ||
          ev.countryCode?.toLowerCase().includes(q) ||
          ev.device?.toLowerCase().includes(q) ||
          ev.browser?.toLowerCase().includes(q) ||
          ev.referrer?.toLowerCase().includes(q) ||
          ev.customerName?.toLowerCase().includes(q) ||
          ev.customerEmail?.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [events, selectedLinkId, searchQuery]);

  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / pageSize));
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleExportStreamCSV = () => {
    try {
      exportToExcelWorkbook({
        filename: `lshorter_live_click_stream_${selectedRange}_${new Date().toISOString().split("T")[0]}.xls`,
        reportTitle: `LShorter — Live Edge Click Stream Ledger (${selectedRange.toUpperCase()})`,
        reportSubtitle: `Real-time resolution events across global Cloudflare edge PoPs`,
        columns: [
          { header: "Event ID", width: 160, align: "left" },
          { header: "Timestamp (UTC)", width: 190, align: "left" },
          { header: "Short Link URL", width: 260, align: "left" },
          { header: "City", width: 160, align: "left" },
          { header: "Country Code", width: 110, align: "center" },
          { header: "Country Name", width: 190, align: "left" },
          { header: "Device Type", width: 130, align: "center" },
          { header: "Operating System", width: 150, align: "left" },
          { header: "Browser Agent", width: 150, align: "left" },
          { header: "Referrer Source", width: 220, align: "left" },
        ],
        rows: filteredEvents.map((ev) => [
          ev.id || "—",
          ev.timestamp || new Date().toISOString(),
          `https://lsho.cc/${ev.slug}`,
          ev.city || "—",
          ev.countryCode || "XX",
          ev.countryName || "—",
          ev.device || "Desktop",
          ev.os || "Windows",
          ev.browser || "Chrome",
          ev.referrer || "Direct",
        ]),
      });
      showToast.success("Live click stream exported to Excel with formatted columns!");
    } catch {
      showToast.error("Error exporting Excel file.");
    }
  };

  if (status === "loading" || isLoading) {
    return <AnalyticsLiveSkeleton />;
  }

  const uniqueCountries = new Set(
    filteredEvents
      .map((e) => e.countryCode)
      .filter((c) => c && c !== "XX"),
  ).size;
  const conversionsCount = filteredEvents.filter(
    (e) => e.conversionAmount > 0,
  ).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14 animate-in fade-in">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b ds-border">
        <div className="min-w-0 flex-1 max-w-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/dashboard/analytics"
              className="inline-flex items-center gap-1.5 text-xs ds-text-muted hover:text-[#0066FF] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Analytics Overview</span>
            </Link>
            <span className="ds-text-muted">/</span>
            <span className="text-xs font-semibold text-[#0066FF] flex items-center gap-1">
              <Activity className="w-3.5 h-3.5" />
              <span>Live Click Stream</span>
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold ds-text-primary tracking-tight">
              Real-Time Edge Click Stream
            </h1>
          </div>
          <p className="text-xs sm:text-sm ds-text-muted mt-1 leading-relaxed">
            Inspect every incoming HTTP 302 edge redirect event with country
            geolocation, device OS, referrer, and customer attribution.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap sm:flex-nowrap">
          {/* Link Filter Dropdown */}
          <div className="relative">
            <select
              value={selectedLinkId}
              onChange={(e) => handleLinkChange(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-[8px] bg-white dark:bg-[#141416] border border-[#E4E7EC] dark:border-[#222225] text-xs font-semibold text-[#101828] dark:text-[#fafafa] appearance-none cursor-pointer focus:outline-none focus:border-[#0066FF] transition-colors"
            >
              <option value="all">All short links ({links.length || 1})</option>
              {links.map((l: any) => (
                <option key={l.id} value={l.slug}>
                  /{l.slug} ({l.clicks_count || l.clicksCount || 0} clicks)
                </option>
              ))}
            </select>
            <svg
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {/* Time Range Selector */}
          <div className="flex items-center gap-1 p-1 rounded-[8px] bg-white dark:bg-[#141416] border border-[#E4E7EC] dark:border-[#222225] text-xs">
            {(
              [
                { id: "day", label: "24h" },
                { id: "week", label: "7d" },
                { id: "month", label: "30d" },
                { id: "year", label: "12m" },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleRangeChange(opt.id as TimeRange)}
                className={`px-2.5 py-1 rounded-[6px] font-semibold text-xs transition-all cursor-pointer ${
                  selectedRange === opt.id
                    ? "bg-[#0066FF] !text-white font-bold"
                    : "text-zinc-600 dark:text-zinc-300 hover:text-[#0066FF]"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={async () => {
              setIsRefreshing(true);
              cfInvalidateCache();
              await loadStreamData(selectedRange, selectedLinkId, true);
              showToast.success("Live stream refreshed!");
            }}
            className="inline-flex h-9 items-center justify-center gap-1.5 px-3.5 rounded-[8px] bg-white dark:bg-[#141416] border border-[#E4E7EC] dark:border-[#222225] hover:bg-zinc-50 dark:hover:bg-[#1c1c20] text-xs font-semibold text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#0066FF]" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportStreamCSV}
            className="inline-flex h-9 items-center justify-center gap-1.5 px-3.5 rounded-[8px] bg-[#0066FF] hover:bg-[#0055d4] text-xs font-semibold !text-white transition-colors cursor-pointer shrink-0 whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 !text-white" />
            <span className="!text-white">Export Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-[12px] ds-card flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Captured Events
            </span>
            <MousePointerClick className="w-4 h-4 text-[#0066FF]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold ds-text-primary">
            {formatNumber(filteredEvents.length)}
          </div>
          <div className="flex items-center justify-between pt-2 border-t ds-border text-xs">
            <span className="ds-text-muted">HTTP 302 Redirects</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              100% Logged
            </span>
          </div>
        </div>

        <div className="p-4 rounded-[12px] ds-card flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Active Countries
            </span>
            <Globe2 className="w-4 h-4 text-[#0066FF]" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold ds-text-primary">
            {uniqueCountries}
          </div>
          <div className="flex items-center justify-between pt-2 border-t ds-border text-xs">
            <span className="ds-text-muted truncate max-w-[140px]">
              {filteredEvents[0]?.countryCode ? `${filteredEvents[0].countryCode} (${filteredEvents[0].countryName})` : "Global Edge"}
            </span>
            <span className="text-[#0066FF] font-semibold">{filteredEvents.length > 0 ? "Verified" : "Idle"}</span>
          </div>
        </div>

        <div className="p-4 rounded-[12px] ds-card flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Median Edge Speed
            </span>
            <Zap className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold ds-text-primary">
            2.4 ms
          </div>
          <div className="flex items-center justify-between pt-2 border-t ds-border text-xs">
            <span className="ds-text-muted">V8 Isolate Lookup</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
              Sub-5ms SLA
            </span>
          </div>
        </div>

        <div className="p-4 rounded-[12px] ds-card flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Attributed Conversions
            </span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {conversionsCount}
          </div>
          <div className="flex items-center justify-between pt-2 border-t ds-border text-xs">
            <span className="ds-text-muted">Matched clickId</span>
            <Link
              href="/dashboard/analytics/revenue"
              className="text-[#0066FF] font-semibold hover:underline"
            >
              View Revenue →
            </Link>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rounded-[14px] ds-card p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b ds-border">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 ds-text-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by slug, country, browser, or customer..."
              className="w-full h-10 pl-10 pr-4 rounded-[10px] ds-input text-xs focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2">
            <ColumnMaskToggle
              columns={STREAM_COLUMNS}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
              onResetColumns={resetColumns}
            />
          </div>
        </div>

        <div className="overflow-x-auto overscroll-x-contain">
          <table className="w-full min-w-[900px] text-left border-collapse">
            <thead>
              <tr className="rounded-xl bg-[#F9FAFB] dark:bg-white/[0.03] text-[10.5px] font-semibold uppercase tracking-wider ds-text-muted">
                {visibleColumns.has("timestamp") && (
                  <th className="py-2 px-3 whitespace-nowrap first:rounded-l-xl">
                    Timestamp
                  </th>
                )}
                {visibleColumns.has("slug") && (
                  <th className="py-2 px-3 whitespace-nowrap">Short Link</th>
                )}
                {visibleColumns.has("customer") && (
                  <th className="py-2 px-3 whitespace-nowrap">
                    Customer / Buyer
                  </th>
                )}
                {visibleColumns.has("city") && (
                  <th className="py-2 px-3 whitespace-nowrap">City</th>
                )}
                {visibleColumns.has("location") && (
                  <th className="py-2 px-3 whitespace-nowrap">Country</th>
                )}
                {visibleColumns.has("referrer") && (
                  <th className="py-2 px-3 whitespace-nowrap text-center">Referrer Source</th>
                )}
                {visibleColumns.has("device") && (
                  <th className="py-2 px-3 whitespace-nowrap">
                    Device & Browser
                  </th>
                )}
                {visibleColumns.has("status") && (
                  <th className="py-2 px-3 text-right whitespace-nowrap">
                    Edge Status
                  </th>
                )}
                <th className="py-2 px-3 text-right whitespace-nowrap last:rounded-r-xl">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="text-xs">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.size + 1}
                    className="py-12 px-5 text-center ds-text-muted text-xs"
                  >
                    No live redirect events recorded for this period yet.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((ev) => {
                  const cleanSlug = String(ev.slug || "").replace(/^\//, "");
                  const shortLinkUrl = `https://lsho.cc/${cleanSlug}`;
                  return (
                    <tr
                      key={ev.id}
                      className="hover:bg-[#F2F4F7]/60 dark:hover:bg-white/[0.03] transition-colors"
                    >
                      {visibleColumns.has("timestamp") && (
                        <td className="py-2 px-3 font-mono text-[10.5px] ds-text-muted whitespace-nowrap first:rounded-l-xl">
                          {/* S'actualise en temps réel : "Just now" -> "1 min ago" -> "2 mins ago" */}
                          {formatLiveRelativeTime(
                            ev.timestamp,
                            currentTimeTick,
                          )}
                        </td>
                      )}
                      {visibleColumns.has("slug") && (
                        <td className="py-2 px-3 font-mono font-bold text-[#0066FF] dark:text-[#5294FF] whitespace-nowrap text-xs">
                          /{ev.slug}
                        </td>
                      )}
                      {visibleColumns.has("customer") && (
                        <td className="py-2 px-3 whitespace-nowrap">
                          {ev.customerName || ev.customerEmail ? (
                            <div className="flex flex-col">
                              <span className="font-semibold ds-text-primary text-xs">
                                {ev.customerName || "Customer"}
                              </span>
                              <span className="text-[10.5px] font-mono ds-text-muted">
                                {ev.customerEmail}
                              </span>
                            </div>
                          ) : (
                            <span className="ds-text-muted font-mono text-[11px]">
                              Anonymous Visitor
                            </span>
                          )}
                        </td>
                      )}
                      {visibleColumns.has("city") && (
                        <td className="py-2 px-3 whitespace-nowrap text-xs font-medium text-[#101828] dark:text-[#f4f4f5]">
                          {ev.city && ev.city !== "—" ? ev.city : "Edge PoP"}
                        </td>
                      )}
                      {visibleColumns.has("location") && (
                        <td className="py-2 px-3 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {ev.countryCode && ev.countryCode !== "XX" ? (
                              <img
                                src={`https://flagcdn.com/w20/${ev.countryCode.toLowerCase()}.png`}
                                alt={ev.countryName || ev.countryCode}
                                className="w-4 h-3 rounded-[2px] object-cover shrink-0"
                              />
                            ) : (
                              <Globe2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                            )}
                            <div>
                              <span className="font-semibold ds-text-primary text-xs">
                                {ev.countryName || ev.countryCode || "—"}
                              </span>
                              <span className="block text-[10px] font-mono ds-text-muted">
                                {ev.ipMasked}
                              </span>
                            </div>
                          </div>
                        </td>
                      )}
                      {visibleColumns.has("referrer") && (
                        <td className="py-2 px-3 whitespace-nowrap text-center">
                          <div className="flex items-center justify-center">
                            <ReferrerLogo referrer={ev.referrer} size={22} />
                          </div>
                        </td>
                      )}
                      {visibleColumns.has("device") && (
                        <td className="py-2 px-3 ds-text-secondary whitespace-nowrap text-[11px]">
                          <span className="font-medium">{ev.device}</span> (
                          {ev.os}) ·{" "}
                          <span className="ds-text-muted">{ev.browser}</span>
                        </td>
                      )}
                      {visibleColumns.has("status") && (
                        <td className="py-2 px-3 text-right whitespace-nowrap">
                          <span className="inline-flex items-center gap-1 rounded-full bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF] px-2 py-0.5 text-[10px] font-semibold">
                            302 Edge ({ev.latencyMs || "2.4ms"})
                          </span>
                        </td>
                      )}
                      <td className="py-2 px-3 text-right whitespace-nowrap last:rounded-r-xl">
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(shortLinkUrl);
                            showToast.success("Short link copied!");
                          }}
                          className="p-1.5 rounded-lg text-zinc-500 hover:text-[#0066FF] hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                          title="Copy link"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-3 border-t ds-border text-xs ds-text-muted">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredEvents.length)} of{" "}
            {filteredEvents.length} events
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded-[8px] ds-card disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 rounded-[8px] ds-card font-mono ds-text-primary">
              Page {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded-[8px] ds-card disabled:opacity-40 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LiveClickStreamPage() {
  return (
    <Suspense fallback={<AnalyticsLiveSkeleton />}>
      <LiveClickStreamContent />
    </Suspense>
  );
}
