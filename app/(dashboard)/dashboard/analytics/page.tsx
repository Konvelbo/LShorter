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
import { generateTimelineForRange } from "@/lib/analytics-generators";
import { AnalyticsPageSkeleton } from "@/components/ui/skeleton";
import {
  cfGetAnalytics,
  cfGetLinks,
  cfInvalidateCache,
} from "@/lib/cloudflare-api";
import { isLinkActive } from "@/lib/utils";
import { useI18n } from "@/components/providers/i18n-provider";
import { showToast } from "@/components/ui/toast-provider";
import { exportToExcelWorkbook } from "@/lib/export-excel";
import { ActiveEdgeStreamChart } from "@/components/dashboard/analytics/active-edge-stream";

const MONTH_LABELS_EN = [
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

const MONTH_LABELS_FR = [
  "Jan",
  "Fév",
  "Mar",
  "Avr",
  "Mai",
  "Juin",
  "Juil",
  "Août",
  "Sep",
  "Oct",
  "Nov",
  "Déc",
];

export default function AnalyticsPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { locale, tr, formatNumber, formatDate } = useI18n();
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
  const [syncedLiveClicks, setSyncedLiveClicks] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const uId = session?.user?.id;
        if (uId) {
          const s = localStorage.getItem(`lshorter_live_clicks_${uId}`);
          if (s !== null && !isNaN(Number(s))) return Number(s);
        }
      } catch {}
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      try {
        const s = localStorage.getItem(`lshorter_live_clicks_${userId}`);
        if (s !== null && !isNaN(Number(s))) {
          setSyncedLiveClicks(Number(s));
        }
      } catch {}
    }
  }, [userId]);

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

  const loadAnalytics = async (selectedPeriod = range, isBg = false, force = false) => {
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

      const needForce = force || isBg || hasLoadedOnceRef.current;
      const [analyticsRes, linksRes] = await Promise.all([
        cfGetAnalytics(userId, periodParam, undefined, needForce).catch(() => null),
        cfGetLinks(userId, needForce).catch(() => null),
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
          acc + (Number(l.clicks_count) || Number(l.clicksCount) || Number(l.clicks) || 0),
        0,
      );

      const mergedTotal = workerTotal;

      const mergedData = {
        ...workerData,
        total_clicks: mergedTotal,
        totalClicks: mergedTotal,
      };

      setAnalytics(mergedData);
      hasLoadedOnceRef.current = true;

      if (typeof window !== "undefined" && userId && sumLinksClicks > 0) {
        try {
          localStorage.setItem(`lshorter_live_clicks_${userId}`, String(sumLinksClicks));
        } catch {}
        setSyncedLiveClicks(sumLinksClicks);
      }
    } catch {
      // fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === "authenticated" && userId) {
      loadAnalytics(range, hasLoadedOnceRef.current, hasLoadedOnceRef.current);
    } else if (status === "unauthenticated") {
      setIsLoading(false);
    }
  }, [status, userId, range]);

  useEffect(() => {
    if (!userId) return;

    const handleUpdate = () => {
      cfInvalidateCache();
      loadAnalytics(range, true, true);
    };

    const handleLiveSync = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (typeof detail?.clicks === "number") {
        setSyncedLiveClicks((prev) => Math.max(prev, detail.clicks));
        if (!detail?.fromPage) {
          cfInvalidateCache();
          loadAnalytics(range, true, true);
        }
      }
    };

    const handleFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      handleUpdate();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "lshorter_last_click" || e.key === "lshorter_data_change") {
        handleUpdate();
      } else if (e.key === `lshorter_live_clicks_${userId}` && e.newValue) {
        const val = Number(e.newValue);
        if (!isNaN(val)) {
          setSyncedLiveClicks((prev) => Math.max(prev, val));
        }
      }
    };

    window.addEventListener("lshorter_live_clicks_synced", handleLiveSync);
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
          } else if (event.data?.type === "live_clicks_synced" && typeof event.data?.clicks === "number") {
            setSyncedLiveClicks((prev) => Math.max(prev, event.data.clicks));
            handleUpdate();
          }
        };
      }
    } catch {}

    // Polling régulier (toutes les 15 secondes) avec forçage de cache pour garantir un rafraîchissement rapide
    const pollTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      loadAnalytics(range, true, true);
    }, 15000);

    return () => {
      window.removeEventListener("lshorter_live_clicks_synced", handleLiveSync);
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
    return links.filter((l) => isLinkActive(l)).length;
  }, [links]);

  const avgClicksPerLink = useMemo(() => {
    if (links.length === 0 || totalClicks <= 0) return "0.0";
    return (totalClicks / links.length).toFixed(1);
  }, [totalClicks, links.length]);

  const rangeShort = useMemo(() => {
    if (range === "24h") return tr("24h", "24 h");
    if (range === "7d") return tr("7d", "7 j");
    if (range === "12m") return tr("12m", "12 m");
    return tr("30d", "30 j");
  }, [range, tr]);

  const topKpis = useMemo(
    () => [
      {
        label: tr("Unique Visitors", "Visiteurs uniques"),
        value: formatNumber(uniqueVisitors),
        delta: uniqueVisitors > 0 ? tr("Verified", "Vérifiés") : "0%",
        positive: true,
        caption: tr(`Period: ${rangeShort}`, `Période : ${rangeShort}`),
        href: "/dashboard/analytics/geo",
      },
      {
        label: tr("Total Link Clicks", "Total des clics"),
        value: formatNumber(totalClicks),
        delta: tr(
          `${formatNumber(links.length)} ${links.length === 1 ? "link" : "links"}`,
          `${formatNumber(links.length)} ${links.length === 1 ? "lien" : "liens"}`,
        ),
        positive: true,
        caption: tr(`Period: ${rangeShort}`, `Période : ${rangeShort}`),
        href: "/dashboard/links",
      },
      {
        label: tr("Active Short Links", "Liens courts actifs"),
        value: `${formatNumber(activeLinksCount)} / ${formatNumber(links.length)}`,
        delta:
          links.length > 0
            ? tr(
                `${Math.round((activeLinksCount / links.length) * 100)}% active`,
                `${Math.round((activeLinksCount / links.length) * 100)} % actifs`,
              )
            : tr("0% active", "0 % actif"),
        positive: true,
        caption:
          links.length - activeLinksCount > 0
            ? tr(
                `${links.length - activeLinksCount} inactive`,
                `${links.length - activeLinksCount} ${links.length - activeLinksCount === 1 ? "inactif" : "inactifs"}`,
              )
            : tr("All active", "Tous actifs"),
        href: "/dashboard/links",
      },
      {
        label: tr("Avg. Clicks / Link", "Moy. clics / lien"),
        value: formatNumber(Number(avgClicksPerLink), {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        }),
        delta: totalClicks > 0 ? "HTTP 302" : tr("Ready", "Prêt"),
        positive: true,
        caption: tr(`Period: ${rangeShort}`, `Période : ${rangeShort}`),
        href: "/dashboard/analytics/live",
      },
    ],
    [
      uniqueVisitors,
      totalClicks,
      links.length,
      activeLinksCount,
      avgClicksPerLink,
      rangeShort,
      tr,
      formatNumber,
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
        const weekDays =
          locale === "fr"
            ? ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
            : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        timeline = weekDays.map((d) => ({
          label: d,
          clicks: 0,
          uniqueClicks: 0,
        }));
      } else if (mappedRange === "year") {
        const monthLabels =
          locale === "fr" ? MONTH_LABELS_FR : MONTH_LABELS_EN;
        timeline = monthLabels.map((m) => ({
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
      const parsedDate = entry?.date ? new Date(String(entry.date)) : null;
      const formattedDateStr =
        parsedDate && !isNaN(parsedDate.getTime())
          ? formatDate(parsedDate, {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : entry?.date
            ? String(entry.date).slice(0, 10)
            : "";
      return {
        label: entry?.label || `#${i + 1}`,
        fullDate: formattedDateStr
          ? `${entry.label} (${formattedDateStr})`
          : entry?.label || `#${i + 1}`,
        extraLabel: tr(
          `${sharePct}% of period traffic`,
          `${sharePct} % du trafic sur la période`,
        ),
        primary: val,
        secondary: val > 0 ? (uniq > 0 ? uniq : val) : 0,
      };
    });
  }, [analytics, range, totalClicks, uniqueVisitors, locale, tr, formatDate]);

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
    const dayClicks = Number(analytics?.last24hClicks ?? analytics?.day_clicks ?? -1);
    if (dayClicks >= 0) return dayClicks;
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    return allLiveEvents.filter((ev: any) => {
      let s = String(ev.timestamp || ev.created_at || ev.time || "").trim();
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
        s = s.replace(" ", "T") + "Z";
      }
      const t = new Date(s).getTime();
      return !isNaN(t) && t >= oneDayAgo;
    }).length;
  }, [allLiveEvents, analytics]);

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
        const rawSource = r.source || r.referrer || r.name || "Direct";
        return {
          source:
            String(rawSource).toLowerCase() === "direct"
              ? tr("Direct", "Direct")
              : rawSource,
          visitors: formatNumber(cnt),
          share,
        };
      });
    }
    return [];
  }, [analytics, totalClicks, formatNumber, tr]);

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
  }, [links, totalClicks, formatNumber]);

  const handleExportOverviewCSV = () => {
    try {
      exportToExcelWorkbook({
        filename: `lshorter_analytics_overview_${range}_${new Date().toISOString().split("T")[0]}.xls`,
        reportTitle: tr(
          `LShorter — Analytics Overview Report (${range.toUpperCase()})`,
          `LShorter — Rapport d'aperçu analytique (${range.toUpperCase()})`,
        ),
        reportSubtitle: tr(
          "Real-time edge telemetry, referral channel attribution & top performing links",
          "Télémétrie edge en temps réel, attribution des canaux référents et liens les plus performants",
        ),
        columns: [
          { header: tr("Category", "Catégorie"), width: 180, align: "left" },
          {
            header: tr("Item / Metric", "Élément / Indicateur"),
            width: 340,
            align: "left",
          },
          { header: tr("Value", "Valeur"), width: 140, align: "right" },
          {
            header: tr("Share / Delta", "Part / Évolution"),
            width: 180,
            align: "center",
          },
          { header: tr("Period", "Période"), width: 120, align: "center" },
        ],
        rows: [
          ...topKpis.map((k) => [
            tr("KPI", "Indicateur"),
            k.label,
            k.value,
            k.delta,
            rangeShort,
          ]),
          ...topChannels.map((c) => [
            tr("Top Channel", "Canal principal"),
            c.source,
            c.visitors,
            `${c.share}%`,
            rangeShort,
          ]),
          ...topShortLinks.map((l) => [
            tr("Top Short Link", "Meilleur lien court"),
            l.slug,
            l.pageviews,
            `${l.share}%`,
            rangeShort,
          ]),
        ],
      });
      setOpenCardMenu(null);
      showToast.success(
        tr(
          "Analytics overview exported to Excel with formatted columns!",
          "Aperçu analytique exporté vers Excel avec colonnes formatées !",
        ),
      );
    } catch {
      showToast.error(
        tr(
          "Error exporting Excel file.",
          "Erreur lors de l'exportation du fichier Excel.",
        ),
      );
    }
  };

  if (isLoading) {
    return <AnalyticsPageSkeleton />;
  }

  const rangeLabel =
    range === "24h"
      ? tr("Last 24 Hours", "Dernières 24 heures")
      : range === "7d"
        ? tr("Last 7 Days", "7 derniers jours")
        : range === "12m"
          ? tr("Last 12 Months", "12 derniers mois")
          : tr("Last 30 Days", "30 derniers jours");

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold ds-text-primary tracking-tight">
            {tr("Traffic & Analytics Overview", "Aperçu du trafic et des analyses")}
          </h1>
          <p className="text-[13px] ds-text-muted mt-0.5">
            {tr(
              "Real-time edge redirect telemetry, channel attribution, and geographic breakdown",
              "Télémétrie des redirections edge en temps réel, attribution des canaux et répartition géographique",
            )}
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
                  { id: "24h", label: tr("Last 24 Hours", "Dernières 24 heures") },
                  { id: "7d", label: tr("Last 7 Days", "7 derniers jours") },
                  { id: "30d", label: tr("Last 30 Days", "30 derniers jours") },
                  { id: "12m", label: tr("Last 12 Months", "12 derniers mois") },
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
              await loadAnalytics(range, true, true);
              showToast.success(tr("Analytics refreshed", "Analyses actualisées"));
            }}
            className="inline-flex items-center gap-2 rounded-[10px] ds-card px-3.5 py-2 text-[13px] font-medium ds-text-secondary hover:bg-[#F2F4F7] dark:hover:bg-white/[0.04] hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${isRefreshing ? "animate-spin text-[#0066FF]" : ""}`}
            />
            <span>{tr("Refresh", "Actualiser")}</span>
          </button>

          <button
            type="button"
            onClick={handleExportOverviewCSV}
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#0066FF] hover:bg-[#0055d4] px-4 py-2 text-[13px] font-semibold !text-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <Download className="w-4 h-4 !text-white" />
            <span className="!text-white">{tr("Export Excel", "Exporter en Excel")}</span>
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
              {tr(`Analytics (${rangeLabel})`, `Analyses (${rangeLabel})`)}
            </h2>
            <p className="text-[13px] text-[#667085] dark:text-[#a1a1aa] mt-0.5">
              {tr(
                "Hover over any interval bar to inspect clicks, unique visitors, and share of traffic",
                "Survolez une barre d'intervalle pour consulter les clics, visiteurs uniques et la part du trafic",
              )}
            </p>
          </div>

          <div className="inline-flex rounded-lg bg-[#F2F4F7] dark:bg-[#18181b] p-1">
            {[
              { id: "12m", label: tr("12 months", "12 mois") },
              { id: "30d", label: tr("30 days", "30 jours") },
              { id: "7d", label: tr("7 days", "7 jours") },
              { id: "24h", label: tr("24 hours", "24 heures") },
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
            primaryLabel={tr("Total Clicks", "Total des clics")}
            secondaryLabel={tr("Unique Visitors", "Visiteurs uniques")}
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
                {tr("Top Channels", "Principaux canaux")}
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
                      <span>{tr("Geography & Sources", "Géographie & Sources")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportOverviewCSV}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#667085]" />
                      <span>{tr("Export Channels CSV", "Exporter les canaux CSV")}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px] font-medium text-[#667085] dark:text-[#a1a1aa] border-b border-[#F2F4F7] dark:border-[#222225] pb-2.5 mb-3">
              <span>{tr("Source", "Source")}</span>
              <span>{tr("Visitors", "Visiteurs")}</span>
            </div>

            {topChannels.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#667085] dark:text-[#a1a1aa]">
                {tr(
                  "No referrer channels recorded in this period yet.",
                  "Aucun canal référent enregistré sur cette période pour le moment.",
                )}
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
            <span>{tr("Geography & Sources Report", "Rapport Géographie & Sources")}</span>
            <span>→</span>
          </button>
        </div>

        <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#111113] p-5 sm:p-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] flex flex-col justify-between relative">
          <div>
            <div className="flex items-center justify-between mb-5 relative">
              <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#fafafa]">
                {tr("Top Short Links", "Meilleurs liens courts")}
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
                      <span>{tr("Manage Short Links", "Gérer les liens courts")}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportOverviewCSV}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#667085]" />
                      <span>{tr("Export Top Links CSV", "Exporter les liens CSV")}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between text-[12px] font-medium text-[#667085] dark:text-[#a1a1aa] border-b border-[#F2F4F7] dark:border-[#222225] pb-2.5 mb-3">
              <span>{tr("Short Link", "Lien court")}</span>
              <span>{tr("Clicks", "Clics")}</span>
            </div>

            {topShortLinks.length === 0 ? (
              <div className="py-10 text-center text-xs text-[#667085] dark:text-[#a1a1aa]">
                {tr("No short links created yet.", "Aucun lien court créé pour le moment.")}
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
            <span>{tr("Manage All Links", "Gérer tous les liens")}</span>
            <span>→</span>
          </button>
        </div>

        {/* Card 3: Active Edge Stream (Flux temps réel crypto conforme aux thèmes) */}
        <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#111113] p-5 sm:p-6 shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] flex flex-col justify-between relative transition-colors">
          <div>
            <div className="flex items-center justify-between mb-3 relative">
              <h3 className="text-[16px] font-semibold text-[#101828] dark:text-[#fafafa]">
                {tr("Active Edge Stream", "Flux Edge actif")}
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
                      <span>
                        {tr("Open Live Click Stream", "Ouvrir le flux en direct")}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={handleExportOverviewCSV}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] dark:hover:bg-[#18181b] cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-[#667085]" />
                      <span>
                        {tr("Export Telemetry CSV", "Exporter la télémétrie CSV")}
                      </span>
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
                {tr("Live events (last 24h)", "Événements en direct (24 h)")}
              </span>
            </div>

            <div className="rounded-xl bg-[#F9FAFB] dark:bg-[#09090b] p-2 border border-[#E4E7EC] dark:border-[#222225] shadow-inner relative transition-colors">
              <ActiveEdgeStreamChart
                variant="compact"
                totalClicks={totalClicks}
                liveEvents24hCount={liveEvents24hCount}
                events={allLiveEvents}
                activeLinksCount={activeLinksCount}
              />
            </div>

            <div className="grid grid-cols-3 divide-x divide-[#E4E7EC] dark:divide-[#222225] mt-5 text-center">
              <div>
                <div className="text-[15px] font-bold text-[#101828] dark:text-[#fafafa]">
                  {formatNumber(totalClicks)}
                </div>
                <div className="text-[11px] text-[#667085] dark:text-[#a1a1aa]">
                  {tr("Total Clicks", "Total clics")}
                </div>
              </div>
              <div>
                <div className="text-[15px] font-bold text-[#101828] dark:text-[#fafafa]">
                  {formatNumber(uniqueVisitors)}
                </div>
                <div className="text-[11px] text-[#667085] dark:text-[#a1a1aa]">
                  {tr("Unique", "Uniques")}
                </div>
              </div>
              <div>
                <div className="text-[15px] font-bold text-[#101828] dark:text-[#fafafa]">
                  {formatNumber(links.length)}
                </div>
                <div className="text-[11px] text-[#667085] dark:text-[#a1a1aa]">
                  {tr("Links", "Liens")}
                </div>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/dashboard/analytics/live")}
            className="mt-6 w-full rounded-xl border border-[#D0D5DD] dark:border-[#2e2e33] py-2.5 text-[13px] font-medium text-[#344054] dark:text-[#d4d4d8] hover:bg-[#F9FAFB] dark:hover:bg-[#18181b] transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>{tr("Open Live Click Stream", "Ouvrir le flux de clics en direct")}</span>
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
