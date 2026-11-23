"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Plus,
  RefreshCw,
  Users,
  Package,
  MoreVertical,
  Calendar,
  ArrowUp,
  ArrowDown,
  BarChart2,
  Globe2,
  Download,
  ExternalLink,
  ChevronDown,
  Sliders,
  Bell,
  Send,
  X,
  Check,
  Target,
} from "lucide-react";
import { ShortLink, GlobalAnalytics } from "@/types";
import { formatNumber, isLinkActive } from "@/lib/utils";
import { cfInvalidateCache, cfGetTargetAlerts, cfCreateTargetAlert, cfBulkDeleteLinks, cfDeleteLink } from "@/lib/cloudflare-api";
import { showToast } from "@/components/ui/toast-provider";
import { useUndoDelete } from "@/components/ui/undo-delete-provider";
import {
  PageLinkDrawers,
  type PageLinkDrawersHandle,
} from "./page-link-drawers";
import { LinkShareModal } from "./link-share-modal";
import { LinkQRModal } from "./link-qr-modal";
import { LinksReuiDataGrid } from "./reui-data-grids";
import { ReuiBarChart5 } from "@/components/examples/c-chart-5";
import { ReuiAreaChart14 } from "@/components/examples/c-chart-14";
import {
  ReuiDonutChart22,
  type ReuiDonut22Item,
} from "@/components/examples/c-chart-22";
import {
  generateTimelineForRange,
  toLocalDateKey,
} from "@/lib/analytics-generators";
import { useI18n } from "@/components/providers/i18n-provider";

interface PopulatedStateProps {
  links: ShortLink[];
  analytics: GlobalAnalytics;
  onRefresh?: () => void;
}

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

export function PopulatedState({
  links,
  analytics,
  onRefresh,
}: PopulatedStateProps) {
  const { locale, tr, formatNumber: formatLocaleNumber, formatDate } = useI18n();
  const MONTH_LABELS = locale === "fr" ? MONTH_LABELS_FR : MONTH_LABELS_EN;
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { triggerUndoDelete } = useUndoDelete();
  const [pendingDeletedIds, setPendingDeletedIds] = useState<Set<string>>(new Set());

  const displayLinks = useMemo(() => {
    if (pendingDeletedIds.size === 0) return links;
    return links.filter(
      (l) =>
        !pendingDeletedIds.has(String(l.id)) &&
        !pendingDeletedIds.has(String(l.slug)) &&
        !((l as any)._id && pendingDeletedIds.has(String((l as any)._id)))
    );
  }, [links, pendingDeletedIds]);

  const linkDrawersRef = useRef<PageLinkDrawersHandle>(null);
  const handleOpenEditDrawer = useCallback((link: ShortLink) => {
    linkDrawersRef.current?.openEdit(link);
  }, []);
  const [selectedShareLink, setSelectedShareLink] = useState<ShortLink | null>(
    null,
  );
  const [selectedQRLink, setSelectedQRLink] = useState<ShortLink | null>(null);
  const [statsTab, setStatsTab] = useState<"Overview" | "Sales" | "Revenue">(
    "Overview",
  );
  const [saasPeriod, setSaasPeriod] = useState<"Weekly" | "Monthly" | "Yearly">(
    "Monthly",
  );
  const [statsRange, setStatsRange] = useState<"24h" | "7d" | "30d" | "12m">("30d");
  const [monthlyMetricMode, setMonthlyMetricMode] = useState<"clicks" | "income">("clicks");
  const [isStatsDateOpen, setIsStatsDateOpen] = useState(false);
  const [isMonthlyMenuOpen, setIsMonthlyMenuOpen] = useState(false);

  const searchUserId = typeof window !== "undefined" ? (new URLSearchParams(window.location.search).get("userId") || localStorage.getItem("lshorter_user_id")) : null;
  const linkUserId = links?.[0]?.userId || (links?.[0] as any)?.user_id || "";
  const rawUserId = session?.user?.id || (session?.user as any)?.userId || searchUserId || linkUserId || session?.user?.email || "";
  const rawEmail = session?.user?.email || "";
  const convexUser = useQuery(
    api.users.getCurrentUser,
    rawUserId || rawEmail
      ? { userId: rawUserId || rawEmail, email: rawEmail || undefined }
      : "skip"
  );
  const userId = convexUser?.userId || linkUserId || rawUserId;

  const cachedName = React.useMemo(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lshorter_cached_user");
        if (saved) return JSON.parse(saved)?.name;
      } catch {}
    }
    return "";
  }, []);

  const userName =
    convexUser?.name?.trim() ||
    session?.user?.name?.trim() ||
    cachedName?.trim() ||
    session?.user?.email?.split("@")[0] ||
    tr("User", "Utilisateur");

  const getGreeting = useCallback(
    (name: string): string => {
      const hour = new Date().getHours();
      if (hour >= 5 && hour < 12) {
        return tr(`Good morning ${name} 👋`, `Bonjour ${name} 👋`);
      }
      if (hour >= 12 && hour < 17) {
        return tr(`Good afternoon ${name} 👋`, `Bon après-midi ${name} 👋`);
      }
      if (hour >= 17 && hour < 22) {
        return tr(`Good evening ${name} 👋`, `Bonsoir ${name} 👋`);
      }
      return tr(`Good night ${name} 🌙`, `Bonne nuit ${name} 🌙`);
    },
    [tr],
  );

  const [greetingText, setGreetingText] = useState<string>(() =>
    getGreeting(userName),
  );
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    const updateTimeGreeting = () => {
      setGreetingText(getGreeting(userName));
      setFormattedDate(
        formatDate(new Date(), {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
        }),
      );
    };

    updateTimeGreeting();

    // Check every 10 seconds for real-time accuracy across hour transitions
    const timer = setInterval(updateTimeGreeting, 10_000);

    // Refresh immediately when tab gains focus or visibility (waking up laptop or switching tabs)
    window.addEventListener("focus", updateTimeGreeting);
    document.addEventListener("visibilitychange", updateTimeGreeting);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", updateTimeGreeting);
      document.removeEventListener("visibilitychange", updateTimeGreeting);
    };
  }, [userName, getGreeting, formatDate]);

  const [targetMetric, setTargetMetric] = useState<"revenue" | "clicks">(
    "clicks",
  );
  const [isTargetMenuOpen, setIsTargetMenuOpen] = useState(false);
  const [isTargetEditModalOpen, setIsTargetEditModalOpen] = useState(false);
  const isTargetEditModalOpenRef = useRef(false);
  useEffect(() => {
    isTargetEditModalOpenRef.current = isTargetEditModalOpen;
  }, [isTargetEditModalOpen]);
  const [isTestingTargetNotif, setIsTestingTargetNotif] = useState(false);
  const [targetRevenueLimit, setTargetRevenueLimit] = useState<number>(5000);
  const [targetClicksLimit, setTargetClicksLimit] = useState<number>(1000);
  const [draftRevenueInput, setDraftRevenueInput] = useState<string>("5000");
  const [draftClicksInput, setDraftClicksInput] = useState<string>("1000");

  useEffect(() => {
    try {
      const savedRev = localStorage.getItem("lshorter_target_revenue");
      const savedClk = localStorage.getItem("lshorter_target_clicks");
      if (savedRev && Number(savedRev) > 0) {
        setTargetRevenueLimit(Number(savedRev));
        setDraftRevenueInput(savedRev);
      }
      if (savedClk && Number(savedClk) > 0) {
        setTargetClicksLimit(Number(savedClk));
        setDraftClicksInput(savedClk);
      }
    } catch {}
  }, []);

  // Synchronisation Cloud multi-appareils (Desktop / Mobile / Paramètres) depuis Cloudflare D1
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    let lastSyncedAt = 0;

    const syncTargetsFromCloudflare = async () => {
      const now = Date.now();
      if (now - lastSyncedAt < 2500) return;
      lastSyncedAt = now;
      try {
        const res = await cfGetTargetAlerts(userId);
        if (cancelled || !res?.success || !Array.isArray(res.data)) return;

        const globalClicksAlert = res.data.find(
          (a: any) => !a.linkId && a.metricType === "clicks"
        );
        const globalRevenueAlert = res.data.find(
          (a: any) => !a.linkId && a.metricType === "revenue"
        );

        if (globalClicksAlert && Number(globalClicksAlert.targetValue) > 0) {
          const val = Number(globalClicksAlert.targetValue);
          setTargetClicksLimit(val);
          if (!isTargetEditModalOpenRef.current) {
            setDraftClicksInput(String(val));
          }
          try {
            localStorage.setItem("lshorter_target_clicks", String(val));
          } catch {}
        }

        if (globalRevenueAlert && Number(globalRevenueAlert.targetValue) > 0) {
          const val = Number(globalRevenueAlert.targetValue);
          setTargetRevenueLimit(val);
          if (!isTargetEditModalOpenRef.current) {
            setDraftRevenueInput(String(val));
          }
          try {
            localStorage.setItem("lshorter_target_revenue", String(val));
          } catch {}
        }
      } catch {}
    };

    syncTargetsFromCloudflare();

    const handleTargetEvent = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.clicks && Number(detail.clicks) > 0) {
        setTargetClicksLimit(Number(detail.clicks));
        setDraftClicksInput(String(detail.clicks));
      }
      if (detail?.revenue && Number(detail.revenue) > 0) {
        setTargetRevenueLimit(Number(detail.revenue));
        setDraftRevenueInput(String(detail.revenue));
      }
    };

    const handleFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "visible") {
        syncTargetsFromCloudflare();
      }
    };

    window.addEventListener("lshorter_target_updated", handleTargetEvent);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);

    return () => {
      cancelled = true;
      window.removeEventListener("lshorter_target_updated", handleTargetEvent);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
    };
  }, [userId]);

  const sumLinkClicks = useMemo(
    () =>
      links.reduce(
        (acc, l) =>
          acc +
          Number(
            (l as any).clicksCount ??
              (l as any).clicks_count ??
              (l as any).clicks ??
              0,
          ),
        0,
      ),
    [links],
  );
  const sumLinkRevenue = useMemo(
    () => links.reduce((acc, l) => acc + Number((l as any).revenue ?? 0), 0),
    [links],
  );

  const workerClicks = Number(analytics?.totalClicks ?? (analytics as any)?.total_clicks ?? 0);
  const displayTotalClicks = workerClicks > 0 ? workerClicks : sumLinkClicks;
  const displayActiveLinks = useMemo(
    () => links.filter((l) => isLinkActive(l)).length,
    [links],
  );
  const displayRevenue = Math.max(
    Number(
      analytics?.trackedRevenue ?? (analytics as any)?.tracked_revenue ?? 0,
    ),
    sumLinkRevenue,
  );
  const rawUnique = Number(
    analytics?.uniqueClicks ?? (analytics as any)?.unique_clicks ?? 0,
  );
  const displayUniqueVisitors =
    rawUnique > 0
      ? Math.min(rawUnique, displayTotalClicks)
      : (displayTotalClicks > 0 ? displayTotalClicks : 0);

  const clicksGrowthPct = Number(analytics?.clicksGrowth ?? 0);
  const activeRatioPct = useMemo(() => {
    if (links.length === 0) return 0;
    return Math.round((displayActiveLinks / links.length) * 100);
  }, [displayActiveLinks, links.length]);

  const expiredLinksCount = useMemo(
    () =>
      links.filter((l: any) => {
        const exp = l.expires_at || l.expiresAt;
        return (
          l.isExpired === true ||
          l.is_expired === 1 ||
          (exp && new Date(exp).getTime() <= Date.now()) ||
          String(l.status || "").toLowerCase() === "expired" ||
          String(l.status || "").toLowerCase() === "expiré"
        );
      }).length,
    [links],
  );

  const pausedLinksCount = useMemo(
    () =>
      links.filter((l: any) => {
        const exp = l.expires_at || l.expiresAt;
        const isExp =
          l.isExpired === true ||
          l.is_expired === 1 ||
          (exp && new Date(exp).getTime() <= Date.now()) ||
          String(l.status || "").toLowerCase() === "expired" ||
          String(l.status || "").toLowerCase() === "expiré";
        if (isExp) return false;
        const s = String(l.status || l.statusLabel || "").toLowerCase();
        return (
          s === "paused" ||
          s === "en pause" ||
          l.isActive === false ||
          l.isActive === 0 ||
          l.is_active === 0 ||
          l.is_active === false
        );
      }).length,
    [links],
  );

  // Récupération unifiée des tableaux analytiques (camelCase + snake_case)
  const safeClicksByDay = useMemo(() => {
    const raw = analytics?.clicksByDay || (analytics as any)?.clicks_by_day;
    return Array.isArray(raw) ? raw : [];
  }, [analytics]);

  const safeLiveClickEvents = useMemo(() => {
    const raw =
      analytics?.liveClickEvents ||
      (analytics as any)?.live_click_events ||
      (analytics as any)?.recentClicks;
    return Array.isArray(raw) ? raw : [];
  }, [analytics]);

  const todayIso = toLocalDateKey(new Date());
  const todayDayEntry = safeClicksByDay.find((d: any) => {
    if (!d?.date) return false;
    const parsed = new Date(d.date);
    const key = !isNaN(parsed.getTime())
      ? toLocalDateKey(parsed)
      : String(d.date).slice(0, 10);
    return key === todayIso;
  });

  const todayEventsCount = safeLiveClickEvents.filter((ev: any) => {
    const ts = ev?.timestamp ? new Date(ev.timestamp).getTime() : NaN;
    return !isNaN(ts) && ts >= Date.now() - 24 * 3600 * 1000;
  }).length;

  const todayClicksValue = Math.max(
    todayDayEntry && typeof todayDayEntry.clicks === "number"
      ? todayDayEntry.clicks
      : 0,
    safeLiveClickEvents.length > 0 ? todayEventsCount : 0,
  );

  const todayRevenueValue = displayRevenue;

  const rawClicksByMonth = analytics?.clicksByMonth;
  const rawIncomeByMonth = analytics?.incomeByMonth;

  const monthlyBars = useMemo(() => {
    if (Array.isArray(rawClicksByMonth) && rawClicksByMonth.length === 12) {
      return rawClicksByMonth.map(
        (item: number | { month?: string; value?: number }, idx: number) =>
          typeof item === "number"
            ? { month: MONTH_LABELS[idx] ?? `M${idx + 1}`, value: item }
            : {
                month: item?.month ?? MONTH_LABELS[idx] ?? `M${idx + 1}`,
                value: Number(item?.value ?? 0),
              },
      );
    }

    const currentMonthIdx = new Date().getMonth();
    const buckets = MONTH_LABELS.map((month) => ({ month, value: 0 }));

    if (safeClicksByDay.length > 0) {
      for (const day of safeClicksByDay) {
        const d = day.date ? new Date(day.date) : new Date();
        const mIdx = !isNaN(d.getTime()) ? d.getMonth() : currentMonthIdx;
        buckets[mIdx].value += Number(day.clicks || 0);
      }
    } else if (safeLiveClickEvents.length > 0) {
      for (const ev of safeLiveClickEvents) {
        const d = ev.timestamp ? new Date(ev.timestamp) : new Date();
        const mIdx = !isNaN(d.getTime()) ? d.getMonth() : currentMonthIdx;
        buckets[mIdx].value += 1;
      }
    }

    const totalBucketSum = buckets.reduce((acc, b) => acc + b.value, 0);
    if (totalBucketSum < displayTotalClicks) {
      buckets[currentMonthIdx].value += displayTotalClicks - totalBucketSum;
    }

    return buckets;
  }, [safeLiveClickEvents, safeClicksByDay, displayTotalClicks, rawClicksByMonth, MONTH_LABELS]);

  const monthlyIncomeBars = useMemo(() => {
    if (Array.isArray(rawIncomeByMonth) && rawIncomeByMonth.length === 12) {
      return rawIncomeByMonth.map(
        (
          item: number | { month?: string; value?: number; conversions?: number },
          idx: number,
        ) =>
          typeof item === "number"
            ? {
                month: MONTH_LABELS[idx] ?? `M${idx + 1}`,
                value: item,
                conversions: item > 0 ? Math.max(1, Math.round(item / 100)) : 0,
              }
            : {
                month: item?.month ?? MONTH_LABELS[idx] ?? `M${idx + 1}`,
                value: Number(item?.value ?? 0),
                conversions: Number(item?.conversions ?? 0),
              },
      );
    }

    const currentMonthIdx = new Date().getMonth();
    const buckets = MONTH_LABELS.map((month) => ({ month, value: 0, conversions: 0 }));

    if (safeLiveClickEvents.length > 0) {
      for (const ev of safeLiveClickEvents) {
        const d = ev.timestamp ? new Date(ev.timestamp) : new Date();
        const mIdx = !isNaN(d.getTime()) ? d.getMonth() : currentMonthIdx;
        const amt = Number(ev.conversionAmount || (ev as any).conversion_amount || 0);
        if (amt > 0) {
          buckets[mIdx].value += amt;
          buckets[mIdx].conversions += 1;
        }
      }
    }

    const totalIncomeSum = buckets.reduce((acc, b) => acc + b.value, 0);
    if (totalIncomeSum < displayRevenue) {
      buckets[currentMonthIdx].value = Number(
        (buckets[currentMonthIdx].value + (displayRevenue - totalIncomeSum)).toFixed(2),
      );
    }

    return buckets;
  }, [safeLiveClickEvents, displayRevenue, rawIncomeByMonth, MONTH_LABELS]);

  const periodMetrics = useMemo(() => {
    const nowMs = Date.now();
    const rawCutoffMs =
      saasPeriod === "Weekly"
        ? nowMs - 7 * 86400 * 1000
        : saasPeriod === "Monthly"
          ? nowMs - 30 * 86400 * 1000
          : nowMs - 365 * 86400 * 1000;
    // Align day-level comparisons to UTC midnight so YYYY-MM-DD entries aren't excluded mid-day
    const dayCutoffMs = rawCutoffMs - (rawCutoffMs % 86400000);

    let clicksFromDays = 0;
    let uniquesFromDays = 0;
    if (safeClicksByDay.length > 0) {
      for (const d of safeClicksByDay) {
        const dtMs = d.date ? new Date(d.date).getTime() : NaN;
        if (!isNaN(dtMs) && dtMs >= dayCutoffMs) {
          const c = Number(d.clicks || 0);
          clicksFromDays += c;
          const u = (d as any).uniqueClicks ?? (d as any).unique_clicks;
          uniquesFromDays +=
            u !== undefined && u !== null && !isNaN(Number(u))
              ? Number(u)
              : c;
        }
      }
    }

    let clicksFromEvents = 0;
    let uniquesFromEvents = 0;
    if (safeLiveClickEvents.length > 0) {
      for (const ev of safeLiveClickEvents) {
        const dtMs = ev.timestamp ? new Date(ev.timestamp).getTime() : NaN;
        if (!isNaN(dtMs) && dtMs >= rawCutoffMs) {
          clicksFromEvents += 1;
          if (Boolean((ev as any).isUnique ?? (ev as any).is_unique)) {
            uniquesFromEvents += 1;
          }
        }
      }
    }

    const windowClicks =
      clicksFromDays > 0
        ? Math.max(clicksFromDays, clicksFromEvents)
        : clicksFromEvents;

    const windowUniques =
      uniquesFromDays > 0
        ? Math.max(uniquesFromDays, uniquesFromEvents)
        : uniquesFromEvents;

    // For Yearly: since safeClicksByDay only covers recent 30-90 days,
    // the annual click volume must encompass all recorded clicks (displayTotalClicks).
    const effectivePeriodClicks =
      saasPeriod === "Yearly"
        ? Math.max(windowClicks, displayTotalClicks)
        : windowClicks;

    const rev =
      saasPeriod === "Yearly"
        ? displayRevenue
        : effectivePeriodClicks > 0 && displayTotalClicks > 0
          ? Number(
              (
                (effectivePeriodClicks / displayTotalClicks) *
                displayRevenue
              ).toFixed(2),
            )
          : 0;

    const sampleClicks = Math.max(clicksFromDays, clicksFromEvents);
    const sampleUniques = Math.max(uniquesFromDays, uniquesFromEvents);
    const uniqueRatio =
      sampleClicks > 0 && sampleUniques > 0
        ? Math.min(1, sampleUniques / sampleClicks)
        : displayTotalClicks > 0 && displayUniqueVisitors > 0
          ? Math.min(1, displayUniqueVisitors / Math.min(displayTotalClicks, 40))
          : 1;

    const sumLinkUniques = links.reduce(
      (acc, l) => acc + Number((l as any).uniqueClicks ?? (l as any).unique_clicks ?? 0),
      0,
    );

    let visitors = 0;
    if (saasPeriod === "Yearly") {
      visitors = Math.min(
        effectivePeriodClicks,
        Math.max(
          displayUniqueVisitors,
          sumLinkUniques > 0
            ? sumLinkUniques
            : Math.round(effectivePeriodClicks * uniqueRatio),
        ),
      );
    } else if (saasPeriod === "Monthly") {
      visitors = Math.min(
        effectivePeriodClicks,
        windowUniques > 0
          ? windowUniques
          : displayUniqueVisitors > 0
            ? displayUniqueVisitors
            : Math.round(effectivePeriodClicks * uniqueRatio),
      );
    } else {
      // Weekly
      visitors = Math.min(
        effectivePeriodClicks,
        windowUniques > 0
          ? windowUniques
          : Math.round(effectivePeriodClicks * uniqueRatio),
      );
    }

    const epc =
      effectivePeriodClicks > 0
        ? Number((rev / effectivePeriodClicks).toFixed(2))
        : Number(analytics?.epc || 0);

    const avgClicks =
      links.length > 0
        ? (effectivePeriodClicks / links.length).toFixed(1)
        : "0.0";

    return { rev, visitors, epc, avgClicks };
  }, [
    saasPeriod,
    safeLiveClickEvents,
    safeClicksByDay,
    displayRevenue,
    displayUniqueVisitors,
    displayTotalClicks,
    analytics?.epc,
    links,
  ]);

  // Statistics — Overview / Sales / Revenue (Correction des données et de l'affichage)
  const statsChartCurves = useMemo(() => {
    const mappedRange =
      statsRange === "24h"
        ? "day"
        : statsRange === "7d"
          ? "week"
          : statsRange === "12m"
            ? "year"
            : "month";

    let timeline: any[] = [];
    try {
      timeline = generateTimelineForRange(
        mappedRange,
        displayTotalClicks,
        displayUniqueVisitors,
        safeClicksByDay,
        safeLiveClickEvents,
      );
    } catch {
      timeline = [];
    }

    // Fallback de structure si la timeline est vide
    if (!Array.isArray(timeline) || timeline.length === 0) {
      if (mappedRange === "day") {
        timeline = Array.from({ length: 24 }, (_, i) => ({
          label: `${String(i).padStart(2, "0")}h00`,
          clicks: 0,
          uniqueClicks: 0,
        }));
      } else if (mappedRange === "week") {
        const weekLabels =
          locale === "fr"
            ? ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]
            : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
        timeline = weekLabels.map((d) => ({
          label: d,
          clicks: 0,
          uniqueClicks: 0,
        }));
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



    const conversionEvents = [
      ...(Array.isArray(analytics?.recentConversions)
        ? analytics.recentConversions
        : []),
      ...safeLiveClickEvents.filter(
        (e: any) => Number(e?.conversionAmount || 0) > 0,
      ),
    ];
    const totalSalesCount =
      conversionEvents.length > 0
        ? conversionEvents.length
        : displayRevenue > 0
          ? 1
          : 0;

    const chart14Data = timeline.map((pt, idx) => {
      const clicksVal = Number(pt.clicks || 0);
      const uniqueVal =
        clicksVal > 0
          ? Math.min(
              clicksVal,
              Number(pt.uniqueClicks || clicksVal),
            )
          : 0;

      if (statsTab === "Sales") {
        return {
          label: pt.label || `#${idx + 1}`,
          fullDate: pt.date ? `${pt.label} (${pt.date})` : pt.label,
          organic: totalSalesCount > 0 ? (clicksVal > 0 ? 1 : 0) : 0,
          paid: 0,
        };
      }

      if (statsTab === "Revenue") {
        const pointRev =
          displayRevenue > 0 && displayTotalClicks > 0
            ? Number(
                ((clicksVal / displayTotalClicks) * displayRevenue).toFixed(2),
              )
            : 0;
        return {
          label: pt.label || `#${idx + 1}`,
          fullDate: pt.date ? `${pt.label} (${pt.date})` : pt.label,
          organic: pointRev,
          paid: 0,
        };
      }

      return {
        label: pt.label || `#${idx + 1}`,
        fullDate: pt.date ? `${pt.label} (${pt.date})` : pt.label,
        organic: clicksVal,
        paid: uniqueVal,
      };
    });

    const rangeClicksSum = timeline.reduce(
      (acc, pt) => acc + Number(pt.clicks || 0),
      0,
    );
    const rangeUniquesSum = timeline.reduce(
      (acc, pt) =>
        acc + (pt.clicks > 0 ? Number(pt.uniqueClicks || pt.clicks) : 0),
      0,
    );

    if (statsTab === "Sales") {
      return {
        chart14Data,
        organicLabel: tr("Confirmed Sales", "Ventes confirmées"),
        paidLabel: tr("Converted Visitors", "Visiteurs convertis"),
        primaryLabel: `${tr("Confirmed Sales", "Ventes confirmées")} (${formatNumber(totalSalesCount)})`,
        secondaryLabel: `${tr("Converted Visitors", "Visiteurs convertis")} (${formatNumber(totalSalesCount)})`,
        valuePrefix: "",
      };
    }
    if (statsTab === "Revenue") {
      return {
        chart14Data,
        organicLabel: tr("Tracked Revenue", "Revenus suivis"),
        paidLabel: tr("Net Attribution", "Attribution nette"),
        primaryLabel: `${tr("Tracked Revenue", "Revenus suivis")} ($${formatLocaleNumber(displayRevenue, { minimumFractionDigits: 2 })})`,
        secondaryLabel: `${tr("Target", "Objectif")} ($${formatLocaleNumber(targetRevenueLimit)})`,
        valuePrefix: "$",
      };
    }
    return {
      chart14Data,
      organicLabel: tr("Total Clicks", "Total des clics"),
      paidLabel: tr("Unique Visitors", "Visiteurs uniques"),
      primaryLabel: `${tr("Total Clicks", "Total des clics")} (${formatNumber(rangeClicksSum)})`,
      secondaryLabel: `${tr("Unique Visitors", "Visiteurs uniques")} (${formatNumber(Math.min(rangeClicksSum, rangeUniquesSum))})`,
      valuePrefix: "",
    };
  }, [
    statsTab,
    statsRange,
    safeClicksByDay,
    safeLiveClickEvents,
    analytics?.recentConversions,
    displayTotalClicks,
    displayUniqueVisitors,
    displayRevenue,
    targetRevenueLimit,
    locale,
    tr,
    formatLocaleNumber,
    MONTH_LABELS,
  ]);

  const [donutToggleMode, setDonutToggleMode] = useState<"clicks" | "revenue">(
    "clicks",
  );

  const dashboardDonutItems = useMemo<ReuiDonut22Item[]>(() => {
    if (donutToggleMode === "clicks") {
      return [...links]
        .map((l: any) => {
          const clk = Number(l.clicksCount ?? l.clicks_count ?? l.clicks ?? 0);
          const uniq = Number(l.uniqueClicks ?? l.unique_clicks ?? clk);
          return {
            key: l.id || l.slug,
            label: `lsho.cc/${l.slug}`,
            sublabel: l.title || l.targetUrl || tr("Active short link", "Lien court actif"),
            value: clk,
            secondaryText: `${formatNumber(uniq)} ${tr("unique", "uniques")}`,
          };
        })
        .filter((it) => it.value > 0)
        .sort((a, b) => b.value - a.value)
        .slice(0, 6);
    }

    return [...links]
      .map((l: any) => {
        const rev = Number(l.revenue ?? 0);
        const clk = Number(l.clicksCount ?? l.clicks_count ?? l.clicks ?? 0);
        return {
          key: l.id || l.slug,
          label: `lsho.cc/${l.slug}`,
          sublabel: l.title || l.targetUrl || tr("Monetized short link", "Lien court monétisé"),
          value: rev,
          secondaryText: `${formatNumber(clk)} ${tr("clicks", "clics")}`,
        };
      })
      .filter((it) => it.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [donutToggleMode, links, tr]);

  const formatCompactMetric = (val: number, isCurrency: boolean) => {
    const prefix = isCurrency ? "$" : "";
    if (val >= 1_000_000)
      return `${prefix}${(val / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (val >= 1_000)
      return `${prefix}${(val / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    return `${prefix}${formatLocaleNumber(val)}`;
  };

  const currentMetricVal =
    targetMetric === "revenue" ? displayRevenue : displayTotalClicks;
  const currentMetricLim =
    targetMetric === "revenue" ? targetRevenueLimit : targetClicksLimit;
  const rawProgressRatio =
    currentMetricLim > 0 ? (currentMetricVal / currentMetricLim) * 100 : 0;
  const activeProgressPct = Math.min(100, Math.round(rawProgressRatio));
  const displayProgressPct =
    currentMetricVal === 0
      ? 0
      : rawProgressRatio < 1
        ? 1
        : activeProgressPct;

  const gaugeDashoffset =
    345.5 -
    (345.5 *
      Math.min(
        100,
        currentMetricVal === 0 ? 0 : Math.max(2, rawProgressRatio),
      )) /
      100;

  const handleSaveTargets = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextRev = Math.max(1, Number(draftRevenueInput) || 5000);
    const nextClk = Math.max(1, Number(draftClicksInput) || 1000);
    setTargetRevenueLimit(nextRev);
    setTargetClicksLimit(nextClk);
    try {
      localStorage.setItem("lshorter_target_revenue", String(nextRev));
      localStorage.setItem("lshorter_target_clicks", String(nextClk));
      // Dispatch event so settings page updates immediately
      window.dispatchEvent(new CustomEvent("lshorter_target_updated", {
        detail: { revenue: nextRev, clicks: nextClk }
      }));
    } catch {}
    setIsTargetMenuOpen(false);
    setIsTargetEditModalOpen(false);
    showToast.success(tr("Monthly target updated", "Objectif mensuel mis à jour"));

    // Persist targets directly into Cloudflare D1
    if (userId) {
      try {
        await Promise.all([
          cfCreateTargetAlert({
            userId,
            linkId: null,
            metricType: "clicks",
            period: "month",
            targetValue: nextClk,
            notifyExpired: false,
            notifyEmail: true,
            notifyBell: true,
            status: "active",
          }),
          cfCreateTargetAlert({
            userId,
            linkId: null,
            metricType: "revenue",
            period: "month",
            targetValue: nextRev,
            notifyExpired: false,
            notifyEmail: true,
            notifyBell: true,
            status: "active",
          }),
        ]);
      } catch (err) {
        console.warn("[Dashboard] Target alert D1 persistence warning:", err);
      }
    }
  };

  const handleTestTargetNotification = async () => {
    try {
      setIsTestingTargetNotif(true);
      const targetEmail = session?.user?.email || "";
      const targetName = userName || session?.user?.name || "";
      const metricAchieved =
        targetMetric === "revenue"
          ? `$${formatLocaleNumber(displayRevenue)}`
          : `${formatLocaleNumber(displayTotalClicks)} ${tr("clicks", "clics")}`;
      const metricTarget =
        targetMetric === "revenue"
          ? `$${formatLocaleNumber(targetRevenueLimit)}`
          : `${formatLocaleNumber(targetClicksLimit)} ${tr("clicks", "clics")}`;

      const res = await fetch("/api/targets/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email: targetEmail,
          name: targetName,
          metricType: targetMetric,
          achievedValue: metricAchieved,
          targetValue: metricTarget,
          monthLabel: formatDate(new Date(), {
            month: "long",
            year: "numeric",
          }),
        }),
      });

      const data = await res.json();
      if (data?.success) {
        // Trigger in-app topbar notification bell immediately
        window.dispatchEvent(
          new CustomEvent("lshorter:notification", {
            detail: {
              id: `target_test_${Date.now()}`,
              title:
                targetMetric === "revenue"
                  ? tr("🎯 Monthly revenue target reached!", "🎯 Objectif de revenus mensuel atteint !")
                  : tr("🎯 Monthly clicks target reached!", "🎯 Objectif de clics mensuel atteint !"),
              message: tr(
                `Congratulations ${targetName}! You reached your target (${metricAchieved} of ${metricTarget}).`,
                `Félicitations ${targetName} ! Vous avez atteint votre objectif (${metricAchieved} sur ${metricTarget}).`
              ),
              createdAt: Date.now(),
            },
          })
        );

        showToast.success(
          tr(
            `Test notification sent! Email sent to ${targetEmail} and notification bell updated.`,
            `Notification test envoyée ! Email expédié à ${targetEmail} et popup cloche mis à jour.`
          )
        );
      } else {
        showToast.error(
          tr(
            "Failed to send test notification.",
            "Échec de l'envoi de la notification test."
          )
        );
      }
    } catch {
      showToast.error(
        tr(
          "Network error while sending notification.",
          "Erreur réseau lors de l'envoi de la notification."
        )
      );
    } finally {
      setIsTestingTargetNotif(false);
      setIsTargetMenuOpen(false);
    }
  };

  // Détection automatique de l'atteinte de l'objectif mensuel (avec déduplication)
  useEffect(() => {
    if (displayProgressPct >= 100 && currentMetricVal > 0) {
      const currentYearMonth = `${new Date().getFullYear()}_${new Date().getMonth() + 1}`;
      const alertedKey = `lshorter_target_congrats_${targetMetric}_${currentYearMonth}`;
      try {
        const alreadyAlerted = localStorage.getItem(alertedKey);
        if (!alreadyAlerted) {
          localStorage.setItem(alertedKey, "sent");

          const targetEmail = session?.user?.email || "";
          const targetName = userName || session?.user?.name || "";
          const metricAchieved =
            targetMetric === "revenue"
              ? `$${formatLocaleNumber(displayRevenue)}`
              : `${formatLocaleNumber(displayTotalClicks)} ${tr("clicks", "clics")}`;
          const metricTarget =
            targetMetric === "revenue"
              ? `$${formatLocaleNumber(targetRevenueLimit)}`
              : `${formatLocaleNumber(targetClicksLimit)} ${tr("clicks", "clics")}`;

          fetch("/api/targets/notify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId,
              email: targetEmail,
              name: targetName,
              metricType: targetMetric,
              achievedValue: metricAchieved,
              targetValue: metricTarget,
              monthLabel: formatDate(new Date(), {
                month: "long",
                year: "numeric",
              }),
            }),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data?.success) {
                window.dispatchEvent(
                  new CustomEvent("lshorter:notification", {
                    detail: {
                      id: `target_${Date.now()}`,
                      title:
                        targetMetric === "revenue"
                          ? tr("🎉 Monthly revenue target reached!", "🎉 Objectif de revenus mensuel atteint !")
                          : tr("🎉 Monthly clicks target reached!", "🎉 Objectif de clics mensuel atteint !"),
                      message: tr(
                        `Congratulations ${targetName}! You reached 100% of your target (${metricAchieved} / ${metricTarget}).`,
                        `Félicitations ${targetName} ! Vous avez atteint 100% de votre objectif (${metricAchieved} / ${metricTarget}).`
                      ),
                      createdAt: Date.now(),
                    },
                  })
                );
                showToast.success(
                  tr(
                    "🎉 Congratulations! Your monthly target is reached. An email and notification have been sent!",
                    "🎉 Félicitations ! Votre objectif mensuel est atteint. Un email et une notification ont été envoyés !"
                  )
                );
              }
            })
            .catch(() => {});
        }
      } catch {}
    }
  }, [
    displayProgressPct,
    currentMetricVal,
    targetMetric,
    displayRevenue,
    displayTotalClicks,
    targetRevenueLimit,
    targetClicksLimit,
    session?.user?.email,
    userName,
    userId,
    formatLocaleNumber,
    formatDate,
    tr,
  ]);

  const handleExportMonthlyCsv = () => {
    try {
      const isClicks = monthlyMetricMode === "clicks";
      const headers = isClicks
        ? [tr("Month", "Mois"), tr("Clicks", "Clics"), tr("Unique Visitors", "Visiteurs uniques")]
        : [tr("Month", "Mois"), tr("Attributed Revenue ($)", "Revenus attribués ($)"), tr("Conversions", "Conversions")];

      const rows = isClicks
        ? monthlyBars.map((b) => {
            const estUnique =
              displayTotalClicks > 0
                ? Math.round(
                    (b.value / displayTotalClicks) * displayUniqueVisitors,
                  )
                : 0;
            return [b.month, String(b.value), String(estUnique)];
          })
        : monthlyIncomeBars.map((b) => [
            b.month,
            b.value.toFixed(2),
            String(b.conversions),
          ]);

      const csv =
        "\uFEFF" +
        [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lshorter_monthly_${isClicks ? "clicks" : "income"}_${new Date().getFullYear()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setIsMonthlyMenuOpen(false);
      showToast.success(
        isClicks
          ? tr("Monthly clicks CSV downloaded", "CSV des clics mensuels téléchargé")
          : tr("Monthly income CSV downloaded", "CSV des revenus mensuels téléchargé")
      );
    } catch {
      showToast.error(tr("Could not export CSV", "Impossible d'exporter le CSV"));
    }
  };

  const handleDeleteLink = (linkOrId: any) => {
    let linkId = "";
    let linkSlug = "";
    let linkObj: ShortLink | undefined;
    if (typeof linkOrId === "object" && linkOrId !== null) {
      linkId = String(linkOrId.id || linkOrId._id || linkOrId.slug || "");
      linkSlug = String(linkOrId.slug || linkId);
      linkObj = linkOrId;
    } else {
      linkId = String(linkOrId || "");
      linkObj = links.find((l) => String(l.id) === linkId || l.slug === linkId);
      linkSlug = String(linkObj?.slug || linkId);
    }
    if (!linkId) return;

    triggerUndoDelete({
      id: linkId,
      itemType: "link",
      title: tr("Link deleted", "Lien supprimé"),
      description: `/${linkSlug}`,
      confirmText: linkSlug,
      onExecute: async () => {
        setPendingDeletedIds((prev) => {
          const next = new Set(prev);
          next.add(linkId);
          if (linkSlug) next.add(linkSlug);
          return next;
        });

        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("lshorter_link_deleted", { detail: { id: linkId, slug: linkSlug } })
          );
        }

        try {
          await cfDeleteLink(linkId, userId, linkSlug, linkObj?.ogImage);
          cfInvalidateCache();
          onRefresh?.();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("lshorter_data_change"));
            window.dispatchEvent(new CustomEvent("lshorter_links_updated"));
          }
        } catch (err) {
          console.error("Delete link error:", err);
          showToast.error(
            tr(
              "Error permanently deleting link",
              "Erreur lors de la suppression définitive du lien"
            )
          );
          setPendingDeletedIds((prev) => {
            const next = new Set(prev);
            next.delete(linkId);
            if (linkSlug) next.delete(linkSlug);
            return next;
          });
          onRefresh?.();
          return false;
        }
      },
    });
  };

  const handleDeleteMultiple = (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const targetIds = ids.map((id) => String(id).trim()).filter(Boolean);
    const count = targetIds.length;
    const firstLink =
      count === 1
        ? links.find((l) => String(l.id) === targetIds[0] || l.slug === targetIds[0])
        : undefined;

    triggerUndoDelete({
      id: `bulk_${Date.now()}`,
      itemType: "link",
      title:
        count > 1
          ? tr(`${count} links deleted`, `${count} liens supprimés`)
          : tr("Link deleted", "Lien supprimé"),
      description:
        count > 1
          ? tr(`${count} selected links`, `${count} liens sélectionnés`)
          : (firstLink?.slug ? `/${firstLink.slug}` : undefined),
      confirmText: count === 1 && firstLink?.slug ? firstLink.slug : "DELETE",
      onExecute: async () => {
        setPendingDeletedIds((prev) => {
          const next = new Set(prev);
          targetIds.forEach((id) => next.add(id));
          return next;
        });

        try {
          await cfBulkDeleteLinks(targetIds, userId);
          cfInvalidateCache();
          onRefresh?.();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("lshorter_data_change"));
            window.dispatchEvent(new CustomEvent("lshorter_links_updated"));
          }
        } catch (err) {
          console.error("Bulk delete error:", err);
          showToast.error(
            tr("Error deleting links", "Erreur lors de la suppression des liens")
          );
          setPendingDeletedIds((prev) => {
            const next = new Set(prev);
            targetIds.forEach((id) => next.delete(id));
            return next;
          });
          onRefresh?.();
          return false;
        }
      },
    });
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-[#101828] dark:text-white">
            {greetingText}
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] dark:text-[#98A2B3] mt-1">
            {formattedDate}
          </p>
        </div>
      </div>

      {/* Row 1: KPI Cards + Monthly Clicks + Monthly Target Gauge */}
      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <div className="col-span-12 xl:col-span-7 flex flex-col gap-4 md:gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
            <div
              onClick={() => router.push("/dashboard/analytics")}
              className="group rounded-[10px] border border-[#E4E7EC] dark:border-[#344054] bg-white dark:bg-[#1D2939] p-5 md:p-6 shadow-2xs hover:border-[#0066FF]/50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#F2F4F7] dark:bg-white/[0.06] text-[#101828] dark:text-white group-hover:bg-[#0066FF]/10 group-hover:text-[#0066FF] transition-colors">
                  <Users className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-[#667085] dark:text-[#98A2B3] group-hover:text-[#0066FF] inline-flex items-center gap-1 transition-colors">
                  {tr("Analytics", "Analytiques")} <ExternalLink className="h-3 w-3" />
                </span>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <span className="text-sm font-medium text-[#667085] dark:text-[#98A2B3]">
                    {tr("Total Clicks", "Total des clics")}
                  </span>
                  <h4 className="mt-2 text-[30px] font-bold leading-none text-[#101828] dark:text-white">
                    {formatNumber(displayTotalClicks)}
                  </h4>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-[#0066FF]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0066FF] dark:text-[#5294FF]">
                  <ArrowUp className="h-3 w-3 text-[#0066FF]" />
                  {clicksGrowthPct > 0
                    ? `${clicksGrowthPct}%`
                    : `${todayClicksValue} ${tr("today", "auj.")}`}
                </span>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#E4E7EC]/70 dark:border-[#344054]/70 flex items-center justify-between text-[11px] text-[#667085] dark:text-[#98A2B3]">
                <span>{tr("Cumulative Edge total", "Total cumulé Edge")}</span>
                <span className="font-medium text-[#0066FF] dark:text-[#5294FF]">
                  {todayClicksValue > 0
                    ? tr(
                        `+${todayClicksValue} click${todayClicksValue > 1 ? "s" : ""} today`,
                        `+${todayClicksValue} clic${todayClicksValue > 1 ? "s" : ""} aujourd'hui`
                      )
                    : tr("0 clicks today", "0 clic aujourd'hui")}
                </span>
              </div>
            </div>

            <div
              onClick={() => router.push("/dashboard/links")}
              className="group rounded-[10px] border border-[#E4E7EC] dark:border-[#344054] bg-white dark:bg-[#1D2939] p-5 md:p-6 shadow-2xs hover:border-[#0066FF]/50 transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[#F2F4F7] dark:bg-white/[0.06] text-[#101828] dark:text-white group-hover:bg-[#0066FF]/10 group-hover:text-[#0066FF] transition-colors">
                  <Package className="h-6 w-6" />
                </div>
                <span className="text-xs font-medium text-[#667085] dark:text-[#98A2B3] group-hover:text-[#0066FF] inline-flex items-center gap-1 transition-colors">
                  {tr("Manage Links", "Gérer les liens")} <ExternalLink className="h-3 w-3" />
                </span>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <span className="text-sm font-medium text-[#667085] dark:text-[#98A2B3]">
                    {tr("Active Short Links", "Liens courts actifs")}
                  </span>
                  <h4 className="mt-2 text-[30px] font-bold leading-none text-[#101828] dark:text-white flex items-baseline gap-1.5">
                    <span>{formatNumber(displayActiveLinks)}</span>
                    <span className="text-sm font-semibold text-[#667085] dark:text-[#98A2B3]">
                      / {links.length}
                    </span>
                  </h4>
                </div>

                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#0066FF]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0066FF] dark:text-[#5294FF]">
                  <span className={`w-1.5 h-1.5 rounded-full ${displayActiveLinks > 0 ? "bg-[#0066FF] animate-pulse" : "bg-neutral-400"}`} />
                  {links.length > 0
                    ? `${activeRatioPct}% ${tr("active", "actifs")}`
                    : `0% ${tr("active", "actifs")}`}
                </span>
              </div>

              {links.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#E4E7EC]/70 dark:border-[#344054]/70 flex items-center justify-between text-[11px] text-[#667085] dark:text-[#98A2B3]">
                  <span>
                    {links.length > displayActiveLinks
                      ? tr(
                          `${displayActiveLinks} active out of ${links.length} total`,
                          `${displayActiveLinks} actif${displayActiveLinks > 1 ? "s" : ""} sur ${links.length} total`
                        )
                      : tr("100% of links are active", "100% des liens sont actifs")}
                  </span>
                  {links.length > displayActiveLinks && (
                    <span className="font-medium text-[#F04438] dark:text-[#FDA29B]">
                      {expiredLinksCount > 0
                        ? tr(
                            `${expiredLinksCount} expired`,
                            `${expiredLinksCount} expiré${expiredLinksCount > 1 ? "s" : ""}`
                          )
                        : ""}
                      {expiredLinksCount > 0 && pausedLinksCount > 0 ? " • " : ""}
                      {pausedLinksCount > 0
                        ? tr(`${pausedLinksCount} paused`, `${pausedLinksCount} en pause`)
                        : ""}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-[10px] border border-[#E4E7EC] dark:border-[#344054] bg-white dark:bg-[#1D2939] p-5 md:p-6 shadow-2xs flex-1 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative">
              <div>
                <h3 className="text-lg font-semibold text-[#101828] dark:text-white">
                  {monthlyMetricMode === "clicks"
                    ? tr("Monthly Clicks", "Clics mensuels")
                    : tr("Monthly Income", "Revenus mensuels")}
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#98A2B3] mt-0.5">
                  {monthlyMetricMode === "clicks"
                    ? tr(
                        `Live click distribution across ${new Date().getFullYear()} (${formatNumber(displayTotalClicks)} total)`,
                        `Répartition en direct des clics sur ${new Date().getFullYear()} (${formatNumber(displayTotalClicks)} au total)`
                      )
                    : tr(
                        `Attributed revenue distribution across ${new Date().getFullYear()} ($${displayRevenue.toFixed(2)} total)`,
                        `Répartition des revenus attribués sur ${new Date().getFullYear()} ($${displayRevenue.toFixed(2)} au total)`
                      )}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Switch Monthly Clicks / Monthly Income */}
                <div className="inline-flex rounded-[8px] bg-[#F2F4F7] dark:bg-[#101828] p-0.5 border border-[#E4E7EC] dark:border-[#344054]">
                  <button
                    type="button"
                    onClick={() => setMonthlyMetricMode("clicks")}
                    className={`rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      monthlyMetricMode === "clicks"
                        ? "bg-white dark:bg-[#1D2939] text-[#101828] dark:text-white shadow-2xs font-semibold"
                        : "text-[#667085] dark:text-[#98A2B3] hover:text-[#101828]"
                    }`}
                  >
                    {tr("Monthly Clicks", "Clics mensuels")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMonthlyMetricMode("income")}
                    className={`rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                      monthlyMetricMode === "income"
                        ? "bg-white dark:bg-[#1D2939] text-[#101828] dark:text-white shadow-2xs font-semibold"
                        : "text-[#667085] dark:text-[#98A2B3] hover:text-[#101828]"
                    }`}
                  >
                    {tr("Monthly Income", "Revenus mensuels")}
                  </button>
                </div>

                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsMonthlyMenuOpen((prev) => !prev)}
                    className="p-1.5 rounded-lg text-[#98A2B3] hover:text-[#344054] dark:hover:text-white hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <MoreVertical className="h-5 w-5" />
                  </button>

                  {isMonthlyMenuOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-[12px] border border-[#E4E7EC] dark:border-[#344054] bg-white dark:bg-[#141418] p-1.5 shadow-xl z-40 text-left">
                      <button
                        type="button"
                        onClick={() => {
                          setIsMonthlyMenuOpen(false);
                          router.push(
                            monthlyMetricMode === "clicks"
                              ? "/dashboard/analytics"
                              : "/dashboard/analytics/revenue",
                          );
                        }}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        <BarChart2 className="h-4 w-4 text-[#465FFF]" />
                        <span>
                          {monthlyMetricMode === "clicks"
                            ? tr("Open Traffic Analytics", "Ouvrir l'analyse du trafic")
                            : tr("Open Revenue Analytics", "Ouvrir l'analyse des revenus")}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportMonthlyCsv}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        <Download className="h-4 w-4 text-[#667085]" />
                        <span>
                          {monthlyMetricMode === "clicks"
                            ? tr("Export Monthly Clicks CSV", "Exporter les clics mensuels (CSV)")
                            : tr("Export Monthly Income CSV", "Exporter les revenus mensuels (CSV)")}
                        </span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full pt-2">
              <ReuiBarChart5
                data={
                  monthlyMetricMode === "clicks"
                    ? monthlyBars.map((item) => {
                        const estUnique =
                          displayTotalClicks > 0
                            ? Math.round(
                                (item.value / displayTotalClicks) *
                                  displayUniqueVisitors,
                              )
                            : 0;
                        const sharePct =
                          displayTotalClicks > 0
                            ? ((item.value / displayTotalClicks) * 100).toFixed(1)
                            : "0.0";
                        return {
                          label: item.month,
                          fullDate: `${item.month} ${new Date().getFullYear()}`,
                          extraLabel: tr(
                            `${sharePct}% of annual traffic`,
                            `${sharePct}% du trafic annuel`
                          ),
                          primary: item.value,
                          secondary: estUnique,
                        };
                      })
                    : monthlyIncomeBars.map((item) => {
                        const sharePct =
                          displayRevenue > 0
                            ? ((item.value / displayRevenue) * 100).toFixed(1)
                            : "0.0";
                        return {
                          label: item.month,
                          fullDate: `${item.month} ${new Date().getFullYear()}`,
                          extraLabel: tr(
                            `${sharePct}% of annual revenue`,
                            `${sharePct}% des revenus annuels`
                          ),
                          primary: item.value,
                          secondary: item.conversions,
                        };
                      })
                }
                primaryLabel={
                  monthlyMetricMode === "clicks"
                    ? tr("Total Clicks", "Total des clics")
                    : tr("Attributed Revenue ($)", "Revenus attribués ($)")
                }
                secondaryLabel={
                  monthlyMetricMode === "clicks"
                    ? tr("Unique Visitors", "Visiteurs uniques")
                    : tr("Conversions", "Conversions")
                }
                primaryColorLight="#0066FF"
                primaryColorDark="#0066FF"
                secondaryColorLight="#93C5FD"
                secondaryColorDark="#60A5FA"
                heightClassName="h-[225px] w-full"
                showSecondaryBar
                showYAxis
              />
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Monthly Target Gauge */}
        <div className="col-span-12 xl:col-span-5">
          <div className="relative flex h-full flex-col justify-between rounded-[10px] border border-[#E4E7EC] dark:border-[#344054] bg-[#F2F4F7] dark:bg-[#101828] overflow-hidden shadow-2xs">
            <div className="rounded-[10px] bg-white dark:bg-[#1D2939] p-5 md:p-6 pb-8 border-b border-[#E4E7EC] dark:border-[#344054] flex-1 flex flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="text-lg font-semibold text-[#101828] dark:text-white">
                    {tr("Monthly Target", "Objectif mensuel")}
                  </h3>
                  <p className="mt-1 text-sm text-[#667085] dark:text-[#98A2B3]">
                    {tr(
                      "Target you've set for each month",
                      "Objectif défini pour chaque mois"
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-[8px] bg-[#F2F4F7] dark:bg-[#101828] p-0.5 border border-[#E4E7EC] dark:border-[#344054]">
                    <button
                      type="button"
                      onClick={() => setTargetMetric("clicks")}
                      className={`rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        targetMetric === "clicks"
                          ? "bg-white dark:bg-[#1D2939] text-[#101828] dark:text-white shadow-2xs font-semibold"
                          : "text-[#667085] dark:text-[#98A2B3] hover:text-[#101828]"
                      }`}
                    >
                      {tr("Clicks", "Clics")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setTargetMetric("revenue")}
                      className={`rounded-[6px] px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        targetMetric === "revenue"
                          ? "bg-white dark:bg-[#1D2939] text-[#101828] dark:text-white shadow-2xs font-semibold"
                          : "text-[#667085] dark:text-[#98A2B3] hover:text-[#101828]"
                      }`}
                    >
                      {tr("Revenue", "Revenus")}
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTargetMenuOpen((prev) => !prev)}
                      className="p-1 rounded-lg text-[#98A2B3] hover:text-[#344054] dark:hover:text-white hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      aria-label={tr("Target options", "Options d'objectif")}
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {isTargetMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsTargetMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-1.5 w-60 rounded-[8px] bg-white dark:bg-[#1D2939] border border-[#E4E7EC] dark:border-[#344054] shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                          <button
                            type="button"
                            onClick={() => {
                              setIsTargetMenuOpen(false);
                              setIsTargetEditModalOpen(true);
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[#344054] dark:text-[#E4E7EC] hover:bg-[#F9FAFB] dark:hover:bg-[#101828] cursor-pointer transition-colors"
                          >
                            <Sliders className="h-4 w-4 text-[#0066FF]" />
                            <div>
                              <p className="font-semibold">
                                {tr("Edit target", "Modifier l'objectif")}
                              </p>
                              <p className="text-[10px] text-[#667085] dark:text-[#98A2B3]">
                                {tr(
                                  "Adjust click or revenue thresholds",
                                  "Ajuster les seuils de clics ou revenus"
                                )}
                              </p>
                            </div>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setIsTargetMenuOpen(false);
                              router.push("/dashboard/settings?tab=notifications");
                            }}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[#344054] dark:text-[#E4E7EC] hover:bg-[#F9FAFB] dark:hover:bg-[#101828] cursor-pointer transition-colors"
                          >
                            <Bell className="h-4 w-4 text-[#0066FF]" />
                            <div>
                              <p className="font-semibold">
                                {tr("Manage all alerts", "Gérer toutes les alertes")}
                              </p>
                              <p className="text-[10px] text-[#667085] dark:text-[#98A2B3]">
                                {tr(
                                  "Full dashboard in Settings",
                                  "Tableau complet dans Paramètres"
                                )}
                              </p>
                            </div>
                          </button>

                          <div className="my-1 border-t border-[#E4E7EC] dark:border-[#344054]" />

                          <button
                            type="button"
                            disabled={isTestingTargetNotif}
                            onClick={() => handleTestTargetNotification()}
                            className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-[#0066FF] dark:text-[#5294FF] hover:bg-[#F9FAFB] dark:hover:bg-[#101828] cursor-pointer transition-colors disabled:opacity-50"
                          >
                            <Send className="h-4 w-4" />
                            <div>
                              <p className="font-semibold">
                                {isTestingTargetNotif
                                  ? tr("Sending test...", "Envoi du test en cours...")
                                  : tr("Test alert & email", "Tester l'alerte & e-mail")}
                              </p>
                              <p className="text-[10px] text-[#667085] dark:text-[#98A2B3]">
                                {tr(
                                  "Verify congratulatory email & bell alert",
                                  "Vérifier l'e-mail de félicitations & la cloche"
                                )}
                              </p>
                            </div>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="relative mx-auto my-4 flex flex-col items-center justify-center">
                <svg className="w-[270px] h-[145px]" viewBox="0 0 260 140">
                  <path
                    d="M 20 130 A 110 110 0 0 1 240 130"
                    fill="none"
                    stroke="#E4E7EC"
                    strokeWidth="12"
                    strokeLinecap="round"
                    className="dark:stroke-[#344054]"
                  />
                  <path
                    d="M 20 130 A 110 110 0 0 1 240 130"
                    fill="none"
                    stroke="#0066FF"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray="345.5"
                    strokeDashoffset={gaugeDashoffset}
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="-mt-16 flex flex-col items-center">
                  <span className="text-[34px] font-bold text-[#101828] dark:text-white leading-none">
                    {displayProgressPct}%
                  </span>
                  <span className="mt-2.5 inline-flex items-center rounded-full bg-[#0066FF]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0066FF] dark:text-[#5294FF]">
                    {targetMetric === "revenue"
                      ? tr("Revenue Goal", "Objectif de revenus")
                      : tr("Clicks Goal", "Objectif de clics")}
                  </span>
                </div>
              </div>

              <p className="mx-auto max-w-[330px] text-center text-sm text-[#667085] dark:text-[#98A2B3] leading-relaxed">
                {targetMetric === "revenue"
                  ? tr(
                      `You generated $${formatLocaleNumber(displayRevenue)} in attributed revenue against your $${formatLocaleNumber(targetRevenueLimit)} target.`,
                      `Vous avez généré $${formatLocaleNumber(displayRevenue)} de revenus attribués sur votre objectif de $${formatLocaleNumber(targetRevenueLimit)}.`
                    )
                  : tr(
                      `You recorded ${formatLocaleNumber(displayTotalClicks)} total clicks (${formatLocaleNumber(todayClicksValue)} today) against your ${formatLocaleNumber(targetClicksLimit)} target.`,
                      `Vous avez enregistré ${formatLocaleNumber(displayTotalClicks)} clics au total (${formatLocaleNumber(todayClicksValue)} aujourd'hui) sur votre objectif de ${formatLocaleNumber(targetClicksLimit)}.`
                    )}
              </p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-[#E4E7EC] dark:divide-[#344054] px-4 py-5 text-center">
              <div>
                <p className="text-xs font-medium text-[#667085] dark:text-[#98A2B3] mb-1">
                  {tr("Target", "Objectif")}
                </p>
                <p className="text-lg font-bold text-[#101828] dark:text-white">
                  {targetMetric === "revenue"
                    ? formatCompactMetric(targetRevenueLimit, true)
                    : formatCompactMetric(targetClicksLimit, false)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#667085] dark:text-[#98A2B3] mb-1">
                  {targetMetric === "revenue"
                    ? tr("Revenue", "Revenus")
                    : tr("Clicks", "Clics")}
                </p>
                <p className="inline-flex items-center justify-center gap-1 text-lg font-bold text-[#101828] dark:text-white">
                  {targetMetric === "revenue"
                    ? formatCompactMetric(displayRevenue, true)
                    : formatCompactMetric(displayTotalClicks, false)}
                  <ArrowUp className="h-4 w-4 text-[#0066FF]" />
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#667085] dark:text-[#98A2B3] mb-1">
                  {tr("Today", "Aujourd'hui")}
                </p>
                <p className="inline-flex items-center justify-center gap-1 text-lg font-bold text-[#101828] dark:text-white">
                  {targetMetric === "revenue"
                    ? formatCompactMetric(todayRevenueValue, true)
                    : formatCompactMetric(todayClicksValue, false)}
                  <ArrowUp className="h-4 w-4 text-[#0066FF]" />
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: SaaS Overview Metric Strip */}
      <div className="rounded-[10px] border border-[#E4E7EC] dark:border-[#344054] bg-white dark:bg-[#1D2939] p-5 md:p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <h3 className="text-lg font-semibold text-[#101828] dark:text-white">
            {tr("Overview", "Vue d'ensemble")} (
            {saasPeriod === "Weekly"
              ? tr("Weekly", "Hebdomadaire")
              : saasPeriod === "Monthly"
                ? tr("Monthly", "Mensuel")
                : tr("Yearly", "Annuel")}
            )
          </h3>
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="inline-flex rounded-[10px] bg-[#F2F4F7] dark:bg-[#101828] p-1">
              {(["Weekly", "Monthly", "Yearly"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setSaasPeriod(tab)}
                  className={`rounded-[8px] px-3.5 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    saasPeriod === tab
                      ? "bg-white dark:bg-[#1D2939] text-[#101828] dark:text-white shadow-2xs"
                      : "text-[#667085] dark:text-[#98A2B3]"
                  }`}
                >
                  {tab === "Weekly"
                    ? tr("Weekly", "Hebdo")
                    : tab === "Monthly"
                      ? tr("Monthly", "Mensuel")
                      : tr("Yearly", "Annuel")}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => linkDrawersRef.current?.openCreate()}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#465FFF] hover:bg-[#3641F5] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>{tr("Create Link", "Créer un lien")}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-[10px] border border-[#E4E7EC] dark:border-[#344054] divide-y sm:divide-y-0 sm:divide-x divide-[#E4E7EC] dark:divide-[#344054]">
          <div
            onClick={() => router.push("/dashboard/analytics/revenue")}
            className="p-5 cursor-pointer"
          >
            <p className="text-xs font-medium text-[#667085]">
              {tr("Total Revenue", "Revenus totaux")}
            </p>
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-[#101828] dark:text-white">
                ${periodMetrics.rev.toFixed(2)}
              </span>
              <span className="rounded-full bg-[#ECFDF3] dark:bg-[#027A48]/20 px-2 py-0.5 text-xs font-semibold text-[#039855] dark:text-[#12B76A]">
                {tr("Live", "En direct")}
              </span>
            </div>
          </div>
          <div
            onClick={() => router.push("/dashboard/analytics")}
            className="p-5 cursor-pointer"
          >
            <p className="text-xs font-medium text-[#667085]">
              {tr("Unique Edge Visitors", "Visiteurs Edge uniques")}
            </p>
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-[#101828] dark:text-white">
                {formatNumber(periodMetrics.visitors)}
              </span>
              <span className="rounded-full bg-[#ECFDF3] dark:bg-[#027A48]/20 px-2 py-0.5 text-xs font-semibold text-[#039855] dark:text-[#12B76A]">
                {tr("Verified", "Vérifié")}
              </span>
            </div>
          </div>
          <div
            onClick={() => router.push("/dashboard/analytics/revenue")}
            className="p-5 cursor-pointer"
          >
            <p className="text-xs font-medium text-[#667085]">
              {tr("Avg. Value per Click (EPC)", "Valeur moy. par clic (EPC)")}
            </p>
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-[#101828] dark:text-white">
                ${periodMetrics.epc.toFixed(2)}
              </span>
              <span className="rounded-full bg-[#ECFDF3] dark:bg-[#027A48]/20 px-2 py-0.5 text-xs font-semibold text-[#039855] dark:text-[#12B76A]">
                {tr("Attributed", "Attribué")}
              </span>
            </div>
          </div>
          <div
            onClick={() => router.push("/dashboard/links")}
            className="p-5 cursor-pointer"
          >
            <p className="text-xs font-medium text-[#667085]">
              {tr("Avg. Clicks per Link", "Clics moy. par lien")}
            </p>
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-[#101828] dark:text-white">
                {periodMetrics.avgClicks}
              </span>
              <span className="rounded-full bg-[#ECFDF3] dark:bg-[#027A48]/20 px-2 py-0.5 text-xs font-semibold text-[#039855] dark:text-[#12B76A]">
                {displayActiveLinks} / {links.length} {tr("Active", "Actifs")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 3: Statistics — Overview / Sales / Revenue (Dual-Area Chart) */}
      <div className="rounded-[10px] border border-[#E4E7EC] dark:border-[#344054] bg-white dark:bg-[#1D2939] p-5 md:p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#101828] dark:text-white">
              {tr("Statistics", "Statistiques")} —{" "}
              {statsTab === "Overview"
                ? tr("Overview", "Vue d'ensemble")
                : statsTab === "Sales"
                  ? tr("Sales", "Ventes")
                  : tr("Revenue", "Revenus")}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-4 text-xs text-[#667085] dark:text-[#98A2B3]">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#465FFF]" />
                {statsChartCurves.primaryLabel}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#0BA5EC]" />
                {statsChartCurves.secondaryLabel}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="inline-flex rounded-[10px] bg-[#F2F4F7] dark:bg-[#101828] p-1">
              {(["Overview", "Sales", "Revenue"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setStatsTab(tab)}
                  className={`rounded-[8px] px-4 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
                    statsTab === tab
                      ? "bg-white dark:bg-[#1D2939] text-[#101828] dark:text-white shadow-2xs"
                      : "text-[#667085] dark:text-[#98A2B3]"
                  }`}
                >
                  {tab === "Overview"
                    ? tr("Overview", "Vue d'ensemble")
                    : tab === "Sales"
                      ? tr("Sales", "Ventes")
                      : tr("Revenue", "Revenus")}
                </button>
              ))}
            </div>

            <div className="relative">
              <button
                type="button"
                onClick={() => setIsStatsDateOpen((prev) => !prev)}
                className="inline-flex items-center gap-2 rounded-[10px] border border-[#E4E7EC] dark:border-[#344054] bg-white dark:bg-[#101828] px-3.5 py-2 text-sm font-medium text-[#344054] dark:text-[#D0D5DD] hover:bg-[#F9FAFB] transition-colors cursor-pointer"
              >
                <Calendar className="h-4 w-4 text-[#667085]" />
                <span>
                  {statsRange === "24h"
                    ? tr("Last 24 Hours", "24 dernières heures")
                    : statsRange === "7d"
                      ? tr("Last 7 Days", "7 derniers jours")
                      : statsRange === "30d"
                        ? tr("Last 30 Days", "30 derniers jours")
                        : tr("Last 12 Months", "12 derniers mois")}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#667085]" />
              </button>

              {isStatsDateOpen && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-[8px] border border-[#E4E7EC] dark:border-[#344054] bg-white dark:bg-[#141418] p-1.5 shadow-xl z-40">
                  {[
                    { id: "24h", label: tr("Last 24 Hours", "24 dernières heures") },
                    { id: "7d", label: tr("Last 7 Days", "7 derniers jours") },
                    { id: "30d", label: tr("Last 30 Days", "30 derniers jours") },
                    { id: "12m", label: tr("Last 12 Months", "12 derniers mois") },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setStatsRange(opt.id as any);
                        setIsStatsDateOpen(false);
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-colors cursor-pointer ${
                        statsRange === opt.id
                          ? "bg-[#465FFF]/10 text-[#465FFF] font-semibold"
                          : "text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7]"
                      }`}
                    >
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full pt-2">
          <ReuiAreaChart14
            data={statsChartCurves.chart14Data}
            organicLabel={statsChartCurves.organicLabel}
            paidLabel={statsChartCurves.paidLabel}
            valuePrefix={statsChartCurves.valuePrefix}
            heightClassName="h-[270px] w-full"
            showYAxis
            stacked={false}
          />
        </div>
      </div>

      {/* Row 3.5: Active Segment Donut */}
      <div className="rounded-[10px] border border-[#E4E7EC] dark:border-[#344054] bg-white dark:bg-[#1D2939] p-5 md:p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-lg font-semibold text-[#101828] dark:text-white">
              {donutToggleMode === "clicks"
                ? tr("Top Short Links by Clicks", "Meilleurs liens courts par clics")
                : tr(
                    "Top Clients & Links by Revenue Traffic",
                    "Meilleurs clients & liens par revenus"
                  )}
            </h3>
            <p className="mt-0.5 text-xs text-[#667085] dark:text-[#98A2B3]">
              {donutToggleMode === "clicks"
                ? tr(
                    "Active-segment breakdown of links receiving click volume",
                    "Répartition des liens générant le plus de volume de clics"
                  )
                : tr(
                    "Breakdown of clients and links driving attributed revenue",
                    "Répartition des clients et liens générant des revenus attribués"
                  )}
            </p>
          </div>

          <div className="inline-flex rounded-[10px] bg-[#F2F4F7] dark:bg-[#101828] p-1">
            <button
              type="button"
              onClick={() => setDonutToggleMode("clicks")}
              className={`rounded-[8px] px-4 py-1.5 text-xs font-medium cursor-pointer ${
                donutToggleMode === "clicks"
                  ? "bg-white dark:bg-[#1D2939] text-[#101828] dark:text-white shadow-2xs"
                  : "text-[#667085]"
              }`}
            >
              {tr("Top Clicks", "Top clics")}
            </button>
            <button
              type="button"
              onClick={() => setDonutToggleMode("revenue")}
              className={`rounded-[8px] px-4 py-1.5 text-xs font-medium cursor-pointer ${
                donutToggleMode === "revenue"
                  ? "bg-white dark:bg-[#1D2939] text-[#101828] dark:text-white shadow-2xs"
                  : "text-[#667085]"
              }`}
            >
              {tr("Revenue & Clients", "Revenus & Clients")}
            </button>
          </div>
        </div>

        <ReuiDonutChart22
          items={dashboardDonutItems}
          centerLabel={
            donutToggleMode === "clicks"
              ? tr("Total Clicks", "Total des clics")
              : tr("Total Revenue", "Revenus totaux")
          }
          centerValueFormatter={(val) =>
            donutToggleMode === "revenue"
              ? `$${formatLocaleNumber(Number(val || 0), { minimumFractionDigits: 2 })}`
              : formatNumber(val)
          }
          emptyMessage={tr(
            "No clicks or revenue recorded yet.",
            "Aucun clic ni revenu enregistré pour le moment."
          )}
        />
      </div>

      {/* Row 4: Short Links Directory Table */}
      <LinksReuiDataGrid
        links={displayLinks}
        copiedId={copiedId}
        onCopy={handleCopyText}
        onSelectLink={handleOpenEditDrawer}
        onEdit={handleOpenEditDrawer}
        onShareLink={(link) => setSelectedShareLink(link)}
        onSelectQr={(link) => setSelectedQRLink(link)}
        onQr={(link) => setSelectedQRLink(link)}
        onDeleteLink={handleDeleteLink}
        onDeleteMultiple={handleDeleteMultiple}
        title={tr("Short Links Directory", "Répertoire des liens courts")}
      />

      <PageLinkDrawers
        ref={linkDrawersRef}
        linksCount={links.length}
        onCreated={() => onRefresh?.()}
        onUpdated={() => onRefresh?.()}
      />
      {selectedShareLink && (
        <LinkShareModal
          link={selectedShareLink}
          isOpen={Boolean(selectedShareLink)}
          onClose={() => setSelectedShareLink(null)}
        />
      )}
      {selectedQRLink && (
        <LinkQRModal
          link={selectedQRLink}
          isOpen={Boolean(selectedQRLink)}
          onClose={() => setSelectedQRLink(null)}
        />
      )}

      {/* Target Goals Configuration Modal */}
      {isTargetEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-[10px] bg-white dark:bg-[#1D2939] border border-[#E4E7EC] dark:border-[#344054] shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC] dark:border-[#344054]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101828] dark:text-white">
                    {tr("Edit Monthly Targets", "Modifier les objectifs mensuels")}
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-[#98A2B3]">
                    {tr(
                      "Configure your workspace targets for the current month",
                      "Configurez les objectifs de votre espace pour le mois en cours"
                    )}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTargetEditModalOpen(false)}
                className="p-1 rounded-lg text-[#98A2B3] hover:text-[#344054] dark:hover:text-white hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTargets} noValidate className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-[#E4E7EC] mb-1.5">
                  {tr("Monthly Clicks Target", "Objectif mensuel de clics")}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="any"
                    max="10000000"
                    value={draftClicksInput}
                    onChange={(e) => setDraftClicksInput(e.target.value)}
                    className="w-full rounded-lg border border-[#D0D5DD] dark:border-[#344054] bg-white dark:bg-[#101828] px-3 py-2 text-sm text-[#101828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                    placeholder="1000"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#667085] dark:text-[#98A2B3]">
                    {tr("clicks", "clics")}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {[500, 1000, 5000, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDraftClicksInput(String(preset))}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F2F4F7] dark:bg-[#101828] hover:bg-[#E4E7EC] dark:hover:bg-[#344054] text-[#344054] dark:text-[#E4E7EC] transition-colors cursor-pointer"
                    >
                      {formatNumber(preset)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-[#E4E7EC] mb-1.5">
                  {tr("Monthly Revenue Target ($)", "Objectif mensuel de revenus ($)")}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-[#667085] dark:text-[#98A2B3]">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    max="10000000"
                    value={draftRevenueInput}
                    onChange={(e) => setDraftRevenueInput(e.target.value)}
                    className="w-full rounded-lg border border-[#D0D5DD] dark:border-[#344054] bg-white dark:bg-[#101828] pl-7 pr-3 py-2 text-sm text-[#101828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                    placeholder="5000"
                    required
                  />
                </div>
                <div className="flex items-center gap-1.5 mt-2">
                  {[1000, 2500, 5000, 10000].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDraftRevenueInput(String(preset))}
                      className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F2F4F7] dark:bg-[#101828] hover:bg-[#E4E7EC] dark:hover:bg-[#344054] text-[#344054] dark:text-[#E4E7EC] transition-colors cursor-pointer"
                    >
                      ${formatNumber(preset)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-[#0066FF]/5 border border-[#0066FF]/15 text-[11px] text-[#344054] dark:text-[#D0D5DD] space-y-1">
                <p className="font-semibold text-[#0066FF] dark:text-[#5294FF] flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" />{" "}
                  {tr("Automatic alert at 100%", "Alerte automatique à 100%")}
                </p>
                <p className="text-[#667085] dark:text-[#98A2B3] leading-relaxed">
                  {tr(
                    "As soon as your threshold is reached, a congratulatory email is sent and a notification appears in your dashboard bell icon.",
                    "Dès que votre seuil est atteint, un e-mail de félicitations est envoyé et une notification apparaît dans la cloche de votre tableau de bord."
                  )}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTargetEditModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#344054] dark:text-[#E4E7EC] hover:bg-[#F2F4F7] dark:hover:bg-[#101828] transition-colors cursor-pointer"
                >
                  {tr("Cancel", "Annuler")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0066FF] text-white hover:bg-[#0055D6] transition-colors shadow-sm cursor-pointer"
                >
                  {tr("Save Targets", "Enregistrer les objectifs")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
