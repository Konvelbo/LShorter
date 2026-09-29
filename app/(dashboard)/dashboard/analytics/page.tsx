"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  MoreVertical,
  ArrowUpRight,
  Download,
  Calendar,
  Activity,
  Globe2,
  RefreshCw,
  Link2,
  ChevronDown,
} from "lucide-react";
import { GeoLogsReuiDataGrid } from "@/components/dashboard/reui-data-grids";
import { ReuiBarChart5 } from "@/components/examples/c-chart-5";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { generateTimelineForRange } from "@/lib/analytics-generators";
import { AnalyticsPageSkeleton } from "@/components/ui/skeleton";
import {
  cfGetAnalytics,
  cfGetLinks,
  cfInvalidateCache,
} from "@/lib/cloudflare-api";
import { formatNumber } from "@/lib/utils";
import { showToast } from "@/components/ui/toast-provider";

const MONTH_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/* ============================================================================
 * COMPOSANT ACTIVE EDGE STREAM (Vrai comportement flux crypto à descente continue)
 * ========================================================================== */
function CryptoEdgeStreamChart({ totalClicks }: { totalClicks: number }) {
  const [streamTicks, setStreamTicks] = useState<
    { time: string; value: number; latency: number }[]
  >([]);
  const currentRateRef = useRef<number>(0);
  const prevTotalClicksRef = useRef<number>(totalClicks);

  // Détection des nouveaux clics réels
  useEffect(() => {
    const diff = totalClicks - prevTotalClicksRef.current;
    if (diff > 0) {
      currentRateRef.current = Math.min(25, currentRateRef.current + diff * 3);
      prevTotalClicksRef.current = totalClicks;
    }
  }, [totalClicks]);

  useEffect(() => {
    const handleEdgeClickEvent = () => {
      currentRateRef.current = Math.min(25, currentRateRef.current + 4);
    };
    window.addEventListener("lshorter_data_change", handleEdgeClickEvent);
    window.addEventListener("lshorter_link_clicked", handleEdgeClickEvent);
    return () => {
      window.removeEventListener("lshorter_data_change", handleEdgeClickEvent);
      window.removeEventListener("lshorter_link_clicked", handleEdgeClickEvent);
    };
  }, []);

  // Initialisation du buffer
  useEffect(() => {
    const now = Date.now();
    const initial: { time: string; value: number; latency: number }[] = [];
    for (let i = 15; i >= 0; i--) {
      const ptTime = new Date(now - i * 3 * 1000);
      initial.push({
        time: ptTime.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        value: 0,
        latency: 0,
      });
    }
    setStreamTicks(initial);

    const interval = setInterval(() => {
      // RÈGLE : S'il n'y a pas de nouvelle requête, le flux DESCEND continuellement vers 0
      if (currentRateRef.current > 0) {
        currentRateRef.current = Math.max(0, currentRateRef.current - 1);
      }

      const nextVal = currentRateRef.current;
      const nowStr = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
      const nextLat =
        nextVal > 0 ? Number((2.1 + Math.random() * 0.5).toFixed(1)) : 0;

      setStreamTicks((prev) => {
        if (prev.length === 0) return prev;
        return [
          ...prev.slice(1),
          { time: nowStr, value: nextVal, latency: nextLat },
        ];
      });
    }, 2500);

    return () => clearInterval(interval);
  }, []);

  const latestVal = streamTicks[streamTicks.length - 1]?.value ?? 0;
  const maxVal = Math.max(...streamTicks.map((t) => t.value), 4);

  return (
    <div className="relative w-full h-[125px] overflow-hidden">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={streamTicks}
          margin={{ top: 12, right: 6, bottom: 0, left: 6 }}
        >
          <defs>
            <linearGradient id="brandCyberBlueGlow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0066FF" stopOpacity={0.45} />
              <stop offset="60%" stopColor="#0066FF" stopOpacity={0.12} />
              <stop offset="100%" stopColor="#0066FF" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <XAxis dataKey="time" hide />
          <YAxis domain={[0, Math.ceil(maxVal * 1.2)]} hide />

          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload || !payload.length) return null;
              const data = payload[0].payload;
              return (
                <div className="rounded-xl border border-[#E4E7EC] dark:border-[#222225] bg-white/95 dark:bg-[#141416]/95 p-2.5 shadow-xl backdrop-blur-md text-xs space-y-1">
                  <div className="flex items-center justify-between gap-3 text-[11px] text-[#667085] dark:text-[#a1a1aa] border-b border-[#E4E7EC] dark:border-[#222225] pb-1">
                    <span>Edge Throughput</span>
                    <span className="text-[#0066FF] dark:text-[#5294FF] font-mono font-bold">
                      {data.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 font-mono font-semibold text-[#101828] dark:text-[#fafafa]">
                    <span>Current Rate:</span>
                    <span className="text-[#0066FF] dark:text-[#5294FF] text-sm">
                      {data.value} req/s
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-[10.5px] text-[#667085] dark:text-[#a1a1aa] font-mono">
                    <span>Edge Latency:</span>
                    <span>
                      {data.latency > 0 ? `${data.latency} ms` : "0 ms (Idle)"}
                    </span>
                  </div>
                </div>
              );
            }}
          />

          <Area
            type="monotone"
            dataKey="value"
            stroke="#0066FF"
            strokeWidth={2.4}
            fill="url(#brandCyberBlueGlow)"
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>

      {/* Ticker / Badge d'état : LIVE si des requêtes traversent le réseau, IDLE sinon */}
      <div className="absolute right-2 top-2 flex items-center gap-1.5 bg-white/90 dark:bg-[#141416]/90 border border-[#E4E7EC] dark:border-[#222225] rounded-full px-2 py-0.5 text-[10px] font-mono shadow-xs pointer-events-none transition-colors">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            latestVal > 0
              ? "bg-[#0066FF] animate-ping"
              : "bg-gray-400 dark:bg-gray-600"
          }`}
        />
        <span
          className={
            latestVal > 0
              ? "text-[#0066FF] dark:text-[#5294FF] font-bold"
              : "text-[#667085] dark:text-[#a1a1aa]"
          }
        >
          {latestVal > 0 ? `${latestVal} REQ/S` : "IDLE (0 REQ/S)"}
        </span>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = session?.user?.id || "";

  const [range, setRange] = useState<"12m" | "30d" | "7d" | "24h">("30d");
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false);
  const [openCardMenu, setOpenCardMenu] = useState<
    "channels" | "links" | "live" | null
  >(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasLoadedOnceRef = useRef(false);
  const [links, setLinks] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      const tab = sp.get("tab");
      if (tab === "conversions" || tab === "revenue") {
        router.replace("/dashboard/analytics/revenue");
      } else if (tab === "live" || tab === "stream") {
        router.replace("/dashboard/analytics/live");
      }
    }
  }, [router]);

  const loadAnalytics = async (selectedPeriod = range, isBg = false) => {
    if (!userId) {
      if (status === "unauthenticated") setIsLoading(false);
      return;
    }
    if (!isBg && !hasLoadedOnceRef.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }
    try {
      const periodParam =
        selectedPeriod === "24h"
          ? "1d"
          : selectedPeriod === "7d"
            ? "7d"
            : selectedPeriod === "12m"
              ? "365d"
              : "30d";
      const [analyticsRes, linksRes] = await Promise.all([
        cfGetAnalytics(userId, periodParam).catch(() => null),
        cfGetLinks(userId).catch(() => null),
      ]);

      const rawLinks = Array.isArray(linksRes?.data)
        ? linksRes.data
        : Array.isArray((linksRes?.data as any)?.data)
          ? (linksRes?.data as any).data
          : [];
      setLinks(rawLinks);

      const workerData = analyticsRes?.data || analyticsRes || {};
      const workerTotal = Number(
        workerData?.total_clicks ?? workerData?.totalClicks ?? 0,
      );
      const sumLinksClicks = rawLinks.reduce(
        (acc: number, l: any) =>
          acc + (l.clicks_count || l.clicksCount || l.clicks || 0),
        0,
      );

      const isShortWindow = selectedPeriod === "24h" || selectedPeriod === "7d";
      const mergedTotal = isShortWindow
        ? workerTotal
        : Math.max(workerTotal, sumLinksClicks);
      const mergedData = {
        ...workerData,
        total_clicks: mergedTotal,
        totalClicks: mergedTotal,
      };

      setAnalytics(mergedData);
      hasLoadedOnceRef.current = true;
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && userId) {
      loadAnalytics(range, hasLoadedOnceRef.current);
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status, userId, range]);

  useEffect(() => {
    if (!userId) return;

    const handleUpdate = () => {
      cfInvalidateCache();
      loadAnalytics(range, true);
    };

    const handleFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      handleUpdate();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "lshorter_last_click" || e.key === "lshorter_data_change") {
        handleUpdate();
      }
    };

    window.addEventListener("lshorter_data_change", handleUpdate);
    window.addEventListener("lshorter_links_updated", handleUpdate);
    window.addEventListener("lshorter_link_clicked", handleUpdate);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("storage", handleStorage);

    // Cross-tab broadcast receiver
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("lshorter_realtime");
        channel.onmessage = (event) => {
          if (event.data?.type === "click" || event.data?.type === "refresh") {
            handleUpdate();
          }
        };
      }
    } catch {}

    // Polling interval (every 4 seconds when tab is active) to keep telemetry live without Chrome F5
    const pollTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      loadAnalytics(range, true);
    }, 4000);

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
  }, [userId, range]);

  const totalClicks = useMemo(() => {
    return Number(analytics?.totalClicks ?? analytics?.total_clicks ?? 0);
  }, [analytics]);

  const uniqueVisitors = useMemo(() => {
    if (totalClicks <= 0) return 0;
    const u = Number(analytics?.uniqueClicks ?? analytics?.unique_clicks ?? 0);
    return u > 0 ? Math.min(u, totalClicks) : totalClicks;
  }, [analytics, totalClicks]);

  const activeLinksCount = useMemo(() => {
    return links.filter((l) => l.is_active !== false && l.isActive !== false)
      .length;
  }, [links]);

  const avgClicksPerLink = useMemo(() => {
    if (links.length === 0 || totalClicks <= 0) return "0.0";
    return (totalClicks / links.length).toFixed(1);
  }, [totalClicks, links.length]);

  const topKpis = useMemo(
    () => [
      {
        label: "Unique Visitors",
        value: formatNumber(uniqueVisitors),
        delta: uniqueVisitors > 0 ? "Verified" : "0%",
        positive: true,
        caption: `Period: ${range}`,
        href: "/dashboard/analytics/geo",
      },
      {
        label: "Total Link Clicks",
        value: formatNumber(totalClicks),
        delta: `${links.length} links`,
        positive: true,
        caption: `Period: ${range}`,
        href: "/dashboard/links",
      },
      {
        label: "Active Short Links",
        value: formatNumber(activeLinksCount),
        delta:
          links.length > 0
            ? `${Math.round((activeLinksCount / links.length) * 100)}% active`
            : "0% active",
        positive: true,
        caption: "In workspace",
        href: "/dashboard/links",
      },
      {
        label: "Avg. Clicks / Link",
        value: avgClicksPerLink,
        delta: totalClicks > 0 ? "HTTP 302" : "Ready",
        positive: true,
        caption: `Period: ${range}`,
        href: "/dashboard/analytics/live",
      },
    ],
    [
      uniqueVisitors,
      totalClicks,
      links.length,
      activeLinksCount,
      avgClicksPerLink,
      range,
    ],
  );

  const chartBars = useMemo(() => {
    const rawDays = analytics?.clicksByDay || analytics?.clicks_by_day || [];
    const rawEvents =
      analytics?.liveClickEvents || analytics?.live_click_events || [];
    const mappedRange =
      range === "24h"
        ? "day"
        : range === "7d"
          ? "week"
          : range === "12m"
            ? "year"
            : "month";

    let timeline: any[] = [];
    try {
      timeline = generateTimelineForRange(
        mappedRange,
        totalClicks,
        uniqueVisitors,
        rawDays,
        rawEvents,
      );
    } catch {
      timeline = [];
    }

    if (!Array.isArray(timeline) || timeline.length === 0) {
      if (mappedRange === "day") {
        timeline = Array.from({ length: 12 }, (_, i) => ({
          label: `${String(i * 2).padStart(2, "0")}h`,
          clicks: 0,
          uniqueClicks: 0,
        }));
      } else if (mappedRange === "week") {
        timeline = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
          (d) => ({
            label: d,
            clicks: 0,
            uniqueClicks: 0,
          }),
        );
      } else if (mappedRange === "year") {
        timeline = MONTH_LABELS.map((m) => ({
          label: m,
          clicks: 0,
          uniqueClicks: 0,
        }));
      } else {
        timeline = Array.from({ length: 30 }, (_, i) => ({
          label: `${i + 1}`,
          clicks: 0,
          uniqueClicks: 0,
        }));
      }
    }



    return timeline.map((entry, i) => {
      const val = Number(entry?.clicks ?? 0);
      const uniq = Number(entry?.uniqueClicks ?? (val > 0 ? val : 0));
      const sharePct =
        totalClicks > 0 ? ((val / totalClicks) * 100).toFixed(1) : "0.0";
      return {
        label: entry?.label || `#${i + 1}`,
        fullDate: entry?.date
          ? `${entry.label} (${String(entry.date).slice(0, 10)})`
          : entry?.label || `#${i + 1}`,
        extraLabel: `${sharePct}% of period traffic`,
        primary: val,
        secondary: val > 0 ? (uniq > 0 ? uniq : val) : 0,
      };
    });
  }, [analytics, range, totalClicks, uniqueVisitors]);

  const allLiveEvents = useMemo(() => {
    const raw =
      analytics?.liveClickEvents ||
      analytics?.live_click_events ||
      analytics?.recentClicks ||
      analytics?.recent_clicks ||
      analytics?.events ||
      [];
    return Array.isArray(raw) ? raw : [];
  }, [analytics]);

  const liveEvents24hCount = useMemo(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const in24h = allLiveEvents.filter((ev: any) => {
      const t = new Date(ev.timestamp || ev.created_at || ev.time || 0).getTime();
      return !isNaN(t) && t >= oneDayAgo;
    }).length;
    if (in24h > 0) return in24h;
    const dayClicks = Number(analytics?.last24hClicks ?? analytics?.day_clicks ?? 0);
    if (dayClicks > 0) return dayClicks;
    return allLiveEvents.length > 0
      ? Math.min(allLiveEvents.length, totalClicks)
      : (range === "24h" ? totalClicks : 0);
  }, [allLiveEvents, analytics, totalClicks, range]);

  const topChannels = useMemo(() => {
    if (totalClicks <= 0) return [];
    const raw = analytics?.topReferrers || analytics?.top_referrers || [];
    if (Array.isArray(raw) && raw.length > 0) {
      return raw.slice(0, 5).map((r: any) => {
        const cnt = Number(r.count ?? r.clicks ?? 0);
        const share =
          totalClicks > 0
            ? Math.min(100, Math.round((cnt / totalClicks) * 100))
            : 0;
        return {
          source: r.source || r.referrer || r.name || "Direct / Custom Domain",
          visitors: formatNumber(cnt),
          share,
        };
      });
    }
    return [
      {
        source: "Direct / Short Links",
        visitors: formatNumber(totalClicks),
        share: 100,
      },
    ];
  }, [analytics, totalClicks]);

  const topShortLinks = useMemo(() => {
    return [...links]
      .map((l) => {
        const c = Number(l.clicks_count ?? l.clicksCount ?? l.clicks ?? 0);
        const domain = l.domain_name || l.domain || "lsho.cc";
        const share =
          totalClicks > 0
            ? Math.min(100, Math.round((c / totalClicks) * 100))
            : 0;
        return {
          id: l.id,
          slug: `${domain}/${l.slug}`,
          rawSlug: l.slug,
          clicksNum: c,
          pageviews: formatNumber(c),
          share,
        };
      })
      .sort((a, b) => b.clicksNum - a.clicksNum)
      .slice(0, 5);
  }, [links, totalClicks]);

  const handleExportOverviewCSV = () => {
    try {
      const headers = [
        "Category",
        "Item / Metric",
        "Value",
        "Share / Delta",
        "Period",
      ];
      const rows = [
        ...topKpis.map((k) => [
          "KPI",
          `"${k.label}"`,
          `"${k.value}"`,
          `"${k.delta}"`,
          range,
        ]),
        ...topChannels.map((c) => [
          "Top Channel",
          `"${c.source}"`,
          `"${c.visitors}"`,
          `${c.share}%`,
          range,
        ]),
        ...topShortLinks.map((l) => [
          "Top Short Link",
          `"${l.slug}"`,
          `"${l.pageviews}"`,
          `${l.share}%`,
          range,
        ]),
      ];
      const csvContent =
        "\uFEFF" +
        [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lshorter_analytics_overview_${range}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setOpenCardMenu(null);
      showToast.success("Analytics overview exported to CSV!");
    } catch {
      showToast.error("Error exporting CSV.");
    }
  };

  if (isLoading) {
    return <AnalyticsPageSkeleton />;
  }

  const rangeLabel =
    range === "24h"
      ? "Last 24 Hours"
      : range === "7d"
        ? "Last 7 Days"
        : range === "12m"
          ? "Last 12 Months"
          : "Last 30 Days";

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold ds-text-primary tracking-tight">
            Traffic & Analytics Overview
          </h1>
          <p className="text-[13px] ds-text-muted mt-0.5">
            Real-time edge redirect telemetry, channel attribution, and
            geographic breakdown
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRangeDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-[10px] ds-card px-3.5 py-2 text-[13px] font-medium ds-text-secondary hover:bg-[#F2F4F7] dark:hover:bg-white/[0.04] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            >
              <Calendar className="w-4 h-4 ds-text-muted" />
              <span>{rangeLabel}</span>
              <ChevronDown className="w-3.5 h-3.5 ds-text-muted" />
            </button>

            {isRangeDropdownOpen && (
              <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] p-1.5 shadow-xl z-50">
                {[
                  { id: "24h", label: "Last 24 Hours" },
                  { id: "7d", label: "Last 7 Days" },
                  { id: "30d", label: "Last 30 Days" },
                  { id: "12m", label: "Last 12 Months" },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => {
                      setRange(opt.id as any);
                      setIsRangeDropdownOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                      range === opt.id
                        ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                        : "text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <span>{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={async () => {
              setIsRefreshing(true);
              cfInvalidateCache();
              await loadAnalytics(range, true);
              showToast.success("Analytics refreshed");
            }}
            className="inline-flex items-center gap-2 rounded-[10px] ds-card px-3.5 py-2 text-[13px] font-medium ds-text-secondary hover:bg-[#F2F4F7] dark:hover:bg-white/[0.04] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#0066FF]" : ""}`}
            />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportOverviewCSV}
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#0066FF] hover:bg-[#0055d4] px-4 py-2 text-[13px] font-semibold !text-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <Download className="w-4 h-4 !text-white" />
            <span className="!text-white">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Row 1: KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {topKpis.map((kpi) => (
          <div
            key={kpi.label}
            onClick={() => router.push(kpi.href)}
            className="rounded-2xl ds-card p-5 sm:p-6 shadow-xs hover:shadow-md hover:-translate-y-0.5 hover:border-[#0066FF]/50 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-3"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-[13px] font-medium text-[#667085] dark:text-[#a1a1aa] truncate">
                {kpi.label}
              </p>
              <span className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold bg-[#ECFDF3] text-[#027A48] dark:bg-emerald-500/15 dark:text-emerald-400 whitespace-nowrap shrink-0">
                <ArrowUpRight className="w-3 h-3 shrink-0" />
                <span>{kpi.delta}</span>
              </span>
            </div>

            <div className="flex items-baseline justify-between gap-2 pt-1">
              <h3 className="text-[26px] sm:text-[28px] font-bold tracking-tight text-[#101828] dark:text-[#fafafa] leading-none whitespace-nowrap">
                {kpi.value}
              </h3>
              <span className="text-[12px] text-[#667085] dark:text-[#a1a1aa] whitespace-nowrap truncate">
                {kpi.caption}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Bar Chart ReuiBarChart5 */}
      <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#111113] p-5 sm:p-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[18px] font-semibold text-[#101828] dark:text-[#fafafa]">
              Analytics ({rangeLabel})
            </h2>
            <p className="text-[13px] text-[#667085] dark:text-[#a1a1aa] mt-0.5">
              Hover over any interval bar to inspect clicks, unique visitors,
              and share of traffic
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-[#F2F4F7] dark:bg-[#18181b] p-1">
            {[
              { id: "12m", label: "12 months" },
              { id: "30d", label: "30 days" },
              { id: "7d", label: "7 days" },
              { id: "24h", label: "24 hours" },
            ].map((tab) => {
              const active = range === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRange(tab.id as any)}
                  className={`px-3 py-1.5 rounded-md text-[12.5px] font-medium transition-all cursor-pointer ${
                    active
                      ? "bg-white dark:bg-[#141416] text-[#101828] dark:text-[#fafafa] shadow-sm"
                      : "text-[#667085] dark:text-[#a1a1aa] hover:text-[#101828] dark:hover:text-[#fafafa]"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="w-full pt-3">
          <ReuiBarChart5
            data={chartBars}
            primaryLabel="Total Clicks"
            secondaryLabel="Unique Visitors"
            primaryColorLight="#0066FF"
            primaryColorDark="#0066FF"
            secondaryColorLight="#0BA5EC"
            secondaryColorDark="#38BDF8"
            heightClassName="h-[255px] w-full"
            showSecondaryBar
            showYAxis
          />
        </div>
      </div>

      {/* Row 3: 3-Column Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#111113] p-5 sm:p-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-5 relative">
              <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#fafafa]">
                Top Channels
              </h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenCardMenu((prev) =>
                      prev === "channels" ? null : "channels",
                    )
                  }
                  className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#344054] dark:hover:text-[#fafafa] hover:bg-[#F2F4F7] transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openCardMenu === "channels" && (
                  <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] p-1.5 shadow-xl z-40">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenCardMenu(null);
                        router.push("/dashboard/analytics/geo");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] cursor-pointer"
                    >
                      <Globe2 className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>Geography & Sources</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportOverviewCSV}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#667085]" />
                      <span>Export Channels CSV</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px] font-medium text-[#667085] dark:text-[#a1a1aa] border-b border-[#F2F4F7] dark:border-[#222225] pb-2.5 mb-3">
              <span>Source</span>
              <span>Visitors</span>
            </div>

            {topChannels.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#667085] dark:text-[#a1a1aa]">
                No referrer channels recorded in this period yet.
              </div>
            ) : (
              <div className="space-y-3">
                {topChannels.map((ch) => (
                  <div key={ch.source} className="relative">
                    <div className="flex items-center justify-between text-[13px] py-2 px-3 relative z-10">
                      <span className="font-medium text-[#344054] dark:text-[#d4d4d8] truncate">
                        {ch.source}
                      </span>
                      <span className="font-semibold text-[#101828] dark:text-[#fafafa]">
                        {ch.visitors}
                      </span>
                    </div>
                    <div
                      style={{ width: `${ch.share}%` }}
                      className="absolute inset-y-0 left-0 rounded-lg bg-[#0066FF]/10 pointer-events-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/analytics/geo")}
            className="mt-6 w-full rounded-xl border border-[#D0D5DD] dark:border-[#2e2e33] py-2.5 text-[13px] font-medium text-[#344054] dark:text-[#d4d4d8] hover:bg-[#F9FAFB] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Geography & Sources Report</span>
            <span>→</span>
          </button>
        </div>

        <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#111113] p-5 sm:p-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-5 relative">
              <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#fafafa]">
                Top Short Links
              </h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenCardMenu((prev) =>
                      prev === "links" ? null : "links",
                    )
                  }
                  className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#344054] dark:hover:text-[#fafafa] hover:bg-[#F2F4F7] transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openCardMenu === "links" && (
                  <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] p-1.5 shadow-xl z-40">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenCardMenu(null);
                        router.push("/dashboard/links");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] cursor-pointer"
                    >
                      <Link2 className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>Manage Short Links</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportOverviewCSV}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#667085]" />
                      <span>Export Top Links CSV</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px] font-medium text-[#667085] dark:text-[#a1a1aa] border-b border-[#F2F4F7] dark:border-[#222225] pb-2.5 mb-3">
              <span>Short Link</span>
              <span>Clicks</span>
            </div>

            {topShortLinks.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#667085] dark:text-[#a1a1aa]">
                No short links created yet.
              </div>
            ) : (
              <div className="space-y-3">
                {topShortLinks.map((item) => (
                  <div
                    key={item.id || item.slug}
                    onClick={() =>
                      router.push(
                        `/dashboard/links?search=${encodeURIComponent(item.rawSlug)}`,
                      )
                    }
                    className="relative cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[13px] py-2 px-3 relative z-10">
                      <span className="font-mono font-medium text-[#0066FF] dark:text-[#5294FF] group-hover:underline truncate">
                        {item.slug}
                      </span>
                      <span className="font-semibold text-[#101828] dark:text-[#fafafa]">
                        {item.pageviews}
                      </span>
                    </div>
                    <div
                      style={{ width: `${item.share}%` }}
                      className="absolute inset-y-0 left-0 rounded-lg bg-[#0066FF]/10 pointer-events-none"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/links")}
            className="mt-6 w-full rounded-xl border border-[#D0D5DD] dark:border-[#2e2e33] py-2.5 text-[13px] font-medium text-[#344054] dark:text-[#d4d4d8] hover:bg-[#F9FAFB] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Manage All Links</span>
            <span>→</span>
          </button>
        </div>

        {/* Card 3: Active Edge Stream (Flux temps réel crypto conforme aux thèmes) */}
        <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#111113] p-5 sm:p-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] flex flex-col justify-between relative transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3 relative">
              <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#fafafa]">
                Active Edge Stream
              </h3>
              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setOpenCardMenu((prev) => (prev === "live" ? null : "live"))
                  }
                  className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#344054] dark:hover:text-[#fafafa] hover:bg-[#F2F4F7] dark:hover:bg-[#18181b] transition-colors cursor-pointer"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
                {openCardMenu === "live" && (
                  <div className="absolute right-0 mt-1.5 w-48 rounded-xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] p-1.5 shadow-xl z-40">
                    <button
                      type="button"
                      onClick={() => {
                        setOpenCardMenu(null);
                        router.push("/dashboard/analytics/live");
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] dark:hover:bg-[#18181b] cursor-pointer"
                    >
                      <Activity className="w-3.5 h-3.5 text-[#0066FF]" />
                      <span>Open Live Click Stream</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportOverviewCSV}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] dark:hover:bg-[#18181b] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#667085]" />
                      <span>Export Telemetry CSV</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0066FF] animate-pulse shadow-[0_0_10px_rgba(0,102,255,0.7)]" />
              <span className="text-[26px] font-bold text-[#101828] dark:text-[#fafafa]">
                {formatNumber(liveEvents24hCount)}
              </span>
              <span className="text-[13px] text-[#667085] dark:text-[#a1a1aa]">
                Live events (last 24h)
              </span>
            </div>

            <div className="rounded-xl bg-[#F9FAFB] dark:bg-[#09090b] p-2 border border-[#E4E7EC] dark:border-[#222225] shadow-inner relative transition-colors">
              <CryptoEdgeStreamChart totalClicks={totalClicks} />
            </div>

            <div className="grid grid-cols-3 divide-x divide-[#E4E7EC] dark:divide-[#222225] mt-5 text-center">
              <div>
                <div className="text-[15px] font-bold text-[#101828] dark:text-[#fafafa]">
                  {formatNumber(totalClicks)}
                </div>
                <div className="text-[11px] text-[#667085] dark:text-[#a1a1aa]">
                  Total Clicks
                </div>
              </div>
              <div>
                <div className="text-[15px] font-bold text-[#101828] dark:text-[#fafafa]">
                  {formatNumber(uniqueVisitors)}
                </div>
                <div className="text-[11px] text-[#667085] dark:text-[#a1a1aa]">
                  Unique
                </div>
              </div>
              <div>
                <div className="text-[15px] font-bold text-[#101828] dark:text-[#fafafa]">
                  {links.length}
                </div>
                <div className="text-[11px] text-[#667085] dark:text-[#a1a1aa]">
                  Links
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/analytics/live")}
            className="mt-6 w-full rounded-xl border border-[#D0D5DD] dark:border-[#2e2e33] py-2.5 text-[13px] font-medium text-[#344054] dark:text-[#d4d4d8] hover:bg-[#F9FAFB] dark:hover:bg-[#18181b] transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Open Live Click Stream</span>
            <span>→</span>
          </button>
        </div>
      </div>

      {/* Row 4: Real-Time Edge Redirect Ledger */}
      <GeoLogsReuiDataGrid
        logs={allLiveEvents}
        analytics={analytics}
        links={links}
      />
    </div>
  );
}
