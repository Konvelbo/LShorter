"use client";

import React, { useState, useEffect, useMemo } from "react";
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
import { formatNumber } from "@/lib/utils";
import { cfInvalidateCache } from "@/lib/cloudflare-api";
import { showToast } from "@/components/ui/toast-provider";
import { LinkCreateModal } from "./link-create-modal";
import { LinkEditModal } from "./link-edit-modal";
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
import confetti from "canvas-confetti";

interface PopulatedStateProps {
  links: ShortLink[];
  analytics: GlobalAnalytics;
  onRefresh?: () => void;
}

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

export function PopulatedState({
  links,
  analytics,
  onRefresh,
}: PopulatedStateProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEditLink, setSelectedEditLink] = useState<ShortLink | null>(
    null,
  );
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

  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");

  const userName =
    convexUser?.name?.trim()?.split(" ")[0] ||
    session?.user?.name?.trim()?.split(" ")[0] ||
    session?.user?.email?.split("@")[0] ||
    "User";

  const getGreeting = (name: string): string => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      return `Good morning ${name} 👋`;
    }
    if (hour >= 12 && hour < 17) {
      return `Good afternoon ${name} 👋`;
    }
    if (hour >= 17 && hour < 22) {
      return `Good evening ${name} 👋`;
    }
    return `Good night ${name} 🌙`;
  };

  const [greetingText, setGreetingText] = useState<string>(() =>
    getGreeting(userName),
  );
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    const updateTimeGreeting = () => {
      setGreetingText(getGreeting(userName));
      setFormattedDate(
        new Date().toLocaleDateString("en-US", {
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
  }, [userName]);

  const [targetMetric, setTargetMetric] = useState<"revenue" | "clicks">(
    "clicks",
  );
  const [isTargetMenuOpen, setIsTargetMenuOpen] = useState(false);
  const [isTargetEditModalOpen, setIsTargetEditModalOpen] = useState(false);
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

  const displayTotalClicks = Math.max(
    Number(analytics?.totalClicks ?? (analytics as any)?.total_clicks ?? 0),
    sumLinkClicks,
  );
  const displayActiveLinks = links.filter((l) => {
    const expTime = (l as any).expires_at || (l as any).expiresAt;
    const isExp = Boolean(expTime && new Date(expTime).getTime() <= Date.now());
    return !isExp && l.isActive !== false && (l as any).is_active !== 0;
  }).length;
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
  const activeRatioPct =
    links.length > 0
      ? Math.round((displayActiveLinks / links.length) * 100)
      : 100;

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

  const todayClicksValue =
    safeLiveClickEvents.length > 0
      ? todayEventsCount
      : todayDayEntry && typeof todayDayEntry.clicks === "number"
        ? todayDayEntry.clicks
        : 0;

  const todayRevenueValue = displayRevenue;

  const monthlyBars = useMemo(() => {
    // DEMO-START: Return pre-calculated monthly distribution if provided
    if (Array.isArray(analytics?.clicksByMonth) && analytics.clicksByMonth.length === 12) {
      return analytics.clicksByMonth;
    }
    // DEMO-END

    const currentMonthIdx = new Date().getMonth();
    const buckets = MONTH_LABELS.map((month) => ({ month, value: 0 }));

    if (safeLiveClickEvents.length > 0) {
      for (const ev of safeLiveClickEvents) {
        const d = ev.timestamp ? new Date(ev.timestamp) : new Date();
        const mIdx = !isNaN(d.getTime()) ? d.getMonth() : currentMonthIdx;
        buckets[mIdx].value += 1;
      }
    } else if (safeClicksByDay.length > 0) {
      for (const day of safeClicksByDay) {
        const d = day.date ? new Date(day.date) : new Date();
        const mIdx = !isNaN(d.getTime()) ? d.getMonth() : currentMonthIdx;
        buckets[mIdx].value += Number(day.clicks || 0);
      }
    }

    const totalBucketSum = buckets.reduce((acc, b) => acc + b.value, 0);
    if (totalBucketSum < displayTotalClicks) {
      buckets[currentMonthIdx].value += displayTotalClicks - totalBucketSum;
    }

    return buckets;
  }, [safeLiveClickEvents, safeClicksByDay, displayTotalClicks, analytics?.clicksByMonth]);

  const monthlyIncomeBars = useMemo(() => {
    // DEMO-START: Return pre-calculated monthly income distribution if provided
    if (Array.isArray(analytics?.incomeByMonth) && analytics.incomeByMonth.length === 12) {
      return analytics.incomeByMonth;
    }
    // DEMO-END

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
  }, [safeLiveClickEvents, displayRevenue, analytics?.incomeByMonth]);

  const periodMetrics = useMemo(() => {
    const nowMs = Date.now();
    const cutoffMs =
      saasPeriod === "Weekly"
        ? nowMs - 7 * 86400 * 1000
        : saasPeriod === "Monthly"
          ? nowMs - 30 * 86400 * 1000
          : nowMs - 365 * 86400 * 1000;

    let windowClicks = 0;
    if (safeLiveClickEvents.length > 0) {
      for (const ev of safeLiveClickEvents) {
        const dtMs = ev.timestamp ? new Date(ev.timestamp).getTime() : NaN;
        if (!isNaN(dtMs) && dtMs >= cutoffMs) {
          windowClicks += 1;
        }
      }
    } else if (safeClicksByDay.length > 0) {
      for (const d of safeClicksByDay) {
        const dtMs = d.date ? new Date(d.date).getTime() : NaN;
        if (!isNaN(dtMs) && dtMs >= cutoffMs) {
          windowClicks += Number(d.clicks || 0);
        }
      }
    } else {
      windowClicks = 0;
    }

    const effectivePeriodClicks = windowClicks;
    const rev =
      effectivePeriodClicks > 0 && displayTotalClicks > 0
        ? Number(
            (
              (effectivePeriodClicks / displayTotalClicks) *
              displayRevenue
            ).toFixed(2),
          )
        : 0;
    const visitors =
      effectivePeriodClicks > 0 && displayTotalClicks > 0
        ? Math.min(
            effectivePeriodClicks,
            Math.round(
              (effectivePeriodClicks / displayTotalClicks) *
                displayUniqueVisitors,
            ),
          )
        : 0;
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
    links.length,
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
        organicLabel: "Confirmed Sales",
        paidLabel: "Converted Visitors",
        primaryLabel: `Confirmed Sales (${formatNumber(totalSalesCount)})`,
        secondaryLabel: `Converted Visitors (${formatNumber(totalSalesCount)})`,
        valuePrefix: "",
      };
    }
    if (statsTab === "Revenue") {
      return {
        chart14Data,
        organicLabel: "Tracked Revenue",
        paidLabel: "Net Attribution",
        primaryLabel: `Tracked Revenue ($${displayRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })})`,
        secondaryLabel: `Target ($${targetRevenueLimit.toLocaleString("en-US")})`,
        valuePrefix: "$",
      };
    }
    return {
      chart14Data,
      organicLabel: "Total Clicks",
      paidLabel: "Unique Visitors",
      primaryLabel: `Total Clicks (${formatNumber(rangeClicksSum)})`,
      secondaryLabel: `Unique Visitors (${formatNumber(Math.min(rangeClicksSum, rangeUniquesSum))})`,
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
            sublabel: l.title || l.targetUrl || "Active short link",
            value: clk,
            secondaryText: `${formatNumber(uniq)} unique`,
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
          sublabel: l.title || l.targetUrl || "Monetized short link",
          value: rev,
          secondaryText: `${formatNumber(clk)} clicks`,
        };
      })
      .filter((it) => it.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6);
  }, [donutToggleMode, links]);

  const formatCompactMetric = (val: number, isCurrency: boolean) => {
    const prefix = isCurrency ? "$" : "";
    if (val >= 1_000_000)
      return `${prefix}${(val / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
    if (val >= 1_000)
      return `${prefix}${(val / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
    return `${prefix}${val.toLocaleString("en-US")}`;
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

  const handleSaveTargets = (e: React.FormEvent) => {
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
    showToast.success("Objectif mensuel mis à jour");
  };

  const handleTestTargetNotification = async () => {
    try {
      setIsTestingTargetNotif(true);
      const targetEmail = session?.user?.email || "founder@lshorter.com";
      const targetName = userName || "Founder";
      const metricAchieved =
        targetMetric === "revenue"
          ? `$${displayRevenue.toLocaleString("en-US")}`
          : `${displayTotalClicks.toLocaleString("en-US")} clics`;
      const metricTarget =
        targetMetric === "revenue"
          ? `$${targetRevenueLimit.toLocaleString("en-US")}`
          : `${targetClicksLimit.toLocaleString("en-US")} clics`;

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
          monthLabel: new Date().toLocaleDateString("fr-FR", {
            month: "long",
            year: "numeric",
          }),
        }),
      });

      const data = await res.json();
      if (data?.success) {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });

        // Trigger in-app topbar notification bell immediately
        window.dispatchEvent(
          new CustomEvent("lshorter:notification", {
            detail: {
              id: `target_test_${Date.now()}`,
              title:
                targetMetric === "revenue"
                  ? "🎯 Objectif de revenus mensuel atteint !"
                  : "🎯 Objectif de clics mensuel atteint !",
              message: `Félicitations ${targetName} ! Vous avez atteint votre objectif (${metricAchieved} sur ${metricTarget}).`,
              createdAt: Date.now(),
            },
          })
        );

        showToast.success(
          `Notification test envoyée ! Email expédié à ${targetEmail} et popup cloche mis à jour.`
        );
      } else {
        showToast.error("Échec de l'envoi de la notification test.");
      }
    } catch {
      showToast.error("Erreur réseau lors de l'envoi de la notification.");
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
          confetti({
            particleCount: 100,
            spread: 90,
            origin: { y: 0.6 },
          });

          const targetEmail = session?.user?.email || "founder@lshorter.com";
          const targetName = userName || "Founder";
          const metricAchieved =
            targetMetric === "revenue"
              ? `$${displayRevenue.toLocaleString("en-US")}`
              : `${displayTotalClicks.toLocaleString("en-US")} clics`;
          const metricTarget =
            targetMetric === "revenue"
              ? `$${targetRevenueLimit.toLocaleString("en-US")}`
              : `${targetClicksLimit.toLocaleString("en-US")} clics`;

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
              monthLabel: new Date().toLocaleDateString("fr-FR", {
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
                          ? "🎉 Objectif de revenus mensuel atteint !"
                          : "🎉 Objectif de clics mensuel atteint !",
                      message: `Félicitations ${targetName} ! Vous avez atteint 100% de votre objectif (${metricAchieved} / ${metricTarget}).`,
                      createdAt: Date.now(),
                    },
                  })
                );
                showToast.success(
                  "🎉 Félicitations ! Votre objectif mensuel est atteint. Un email et une notification ont été envoyés !"
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
  ]);

  const handleExportMonthlyCsv = () => {
    try {
      const isClicks = monthlyMetricMode === "clicks";
      const headers = isClicks
        ? ["Month", "Clicks", "Unique Visitors"]
        : ["Month", "Attributed Revenue (€)", "Conversions"];

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
      showToast.success(`Monthly ${isClicks ? "clicks" : "income"} CSV downloaded`);
    } catch {
      showToast.error("Could not export CSV");
    }
  };

  const handleDeleteLink = async (linkObj: ShortLink) => {
    if (!linkObj?.id) return;
    try {
      const res = await fetch(`/api/links/${encodeURIComponent(linkObj.id)}`, {
        method: "DELETE",
      });
      if (res.ok) {
        cfInvalidateCache();
        showToast.success(`Deleted /${linkObj.slug}`);
        onRefresh?.();
      } else {
        showToast.error("Failed to delete link");
      }
    } catch {
      showToast.error("Error deleting link");
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.8 } });
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
                  Analytics <ExternalLink className="h-3 w-3" />
                </span>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <span className="text-sm font-medium text-[#667085] dark:text-[#98A2B3]">
                    Total Clicks
                  </span>
                  <h4 className="mt-2 text-[30px] font-bold leading-none text-[#101828] dark:text-white">
                    {formatNumber(displayTotalClicks)}
                  </h4>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-[#0066FF]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0066FF] dark:text-[#5294FF]">
                  <ArrowUp className="h-3 w-3 text-[#0066FF]" />
                  {clicksGrowthPct > 0
                    ? `${clicksGrowthPct}%`
                    : `${todayClicksValue} today`}
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
                  Manage Links <ExternalLink className="h-3 w-3" />
                </span>
              </div>

              <div className="mt-5 flex items-end justify-between">
                <div>
                  <span className="text-sm font-medium text-[#667085] dark:text-[#98A2B3]">
                    Active Short Links
                  </span>
                  <h4 className="mt-2 text-[30px] font-bold leading-none text-[#101828] dark:text-white">
                    {formatNumber(displayActiveLinks)}
                  </h4>
                </div>

                <span className="inline-flex items-center gap-1 rounded-full bg-[#0066FF]/10 px-2.5 py-0.5 text-xs font-semibold text-[#0066FF] dark:text-[#5294FF]">
                  <ArrowUp className="h-3 w-3 text-[#0066FF]" />
                  {activeRatioPct}% active
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-[10px] border border-[#E4E7EC] dark:border-[#344054] bg-white dark:bg-[#1D2939] p-5 md:p-6 shadow-2xs flex-1 flex flex-col justify-between">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative">
              <div>
                <h3 className="text-lg font-semibold text-[#101828] dark:text-white">
                  {monthlyMetricMode === "clicks" ? "Monthly Clicks" : "Monthly Income"}
                </h3>
                <p className="text-xs text-[#667085] dark:text-[#98A2B3] mt-0.5">
                  {monthlyMetricMode === "clicks"
                    ? `Live click distribution across ${new Date().getFullYear()} (${formatNumber(displayTotalClicks)} total)`
                    : `Attributed revenue distribution across ${new Date().getFullYear()} ($${displayRevenue.toFixed(2)} total)`}
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
                    Monthly Clicks
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
                    Monthly Income
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
                            ? "Open Traffic Analytics"
                            : "Open Revenue Analytics"}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={handleExportMonthlyCsv}
                        className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#344054] dark:text-gray-200 hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      >
                        <Download className="h-4 w-4 text-[#667085]" />
                        <span>
                          Export {monthlyMetricMode === "clicks" ? "Monthly Clicks" : "Monthly Income"} CSV
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
                          extraLabel: `${sharePct}% of annual traffic`,
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
                          extraLabel: `${sharePct}% of annual revenue`,
                          primary: item.value,
                          secondary: item.conversions,
                        };
                      })
                }
                primaryLabel={monthlyMetricMode === "clicks" ? "Total Clicks" : "Attributed Revenue ($)"}
                secondaryLabel={monthlyMetricMode === "clicks" ? "Unique Visitors" : "Conversions"}
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
                    Monthly Target
                  </h3>
                  <p className="mt-1 text-sm text-[#667085] dark:text-[#98A2B3]">
                    Target you&apos;ve set for each month
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
                      Clicks
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
                      Revenue
                    </button>
                  </div>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsTargetMenuOpen((prev) => !prev)}
                      className="p-1 rounded-lg text-[#98A2B3] hover:text-[#344054] dark:hover:text-white hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                      aria-label="Options d'objectif"
                    >
                      <MoreVertical className="h-5 w-5" />
                    </button>

                    {isTargetMenuOpen && (
                      <>
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsTargetMenuOpen(false)}
                        />
                        <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-white dark:bg-[#1D2939] border border-[#E4E7EC] dark:border-[#344054] shadow-xl py-1.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
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
                              <p className="font-semibold">Modifier l'objectif</p>
                              <p className="text-[10px] text-[#667085] dark:text-[#98A2B3]">
                                Ajuster les seuils de clics ou revenus
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
                              <p className="font-semibold">Gérer toutes les alertes</p>
                              <p className="text-[10px] text-[#667085] dark:text-[#98A2B3]">
                                Dashboard complet dans Paramètres
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
                                {isTestingTargetNotif ? "Envoi du test en cours..." : "Tester l'alerte & e-mail"}
                              </p>
                              <p className="text-[10px] text-[#667085] dark:text-[#98A2B3]">
                                Vérifier l'e-mail de félicitations & la cloche
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
                      ? "Revenue Goal"
                      : "Clicks Goal"}
                  </span>
                </div>
              </div>

              <p className="mx-auto max-w-[330px] text-center text-sm text-[#667085] dark:text-[#98A2B3] leading-relaxed">
                {targetMetric === "revenue" ? (
                  <>
                    You generated ${displayRevenue.toLocaleString("en-US")} in
                    attributed revenue against your $
                    {targetRevenueLimit.toLocaleString("en-US")} target.
                  </>
                ) : (
                  <>
                    You recorded {displayTotalClicks.toLocaleString("en-US")}{" "}
                    total clicks ({todayClicksValue.toLocaleString("en-US")}{" "}
                    today) against your{" "}
                    {targetClicksLimit.toLocaleString("en-US")} target.
                  </>
                )}
              </p>
            </div>

            <div className="grid grid-cols-3 divide-x divide-[#E4E7EC] dark:divide-[#344054] px-4 py-5 text-center">
              <div>
                <p className="text-xs font-medium text-[#667085] dark:text-[#98A2B3] mb-1">
                  Target
                </p>
                <p className="text-lg font-bold text-[#101828] dark:text-white">
                  {targetMetric === "revenue"
                    ? formatCompactMetric(targetRevenueLimit, true)
                    : formatCompactMetric(targetClicksLimit, false)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-[#667085] dark:text-[#98A2B3] mb-1">
                  {targetMetric === "revenue" ? "Revenue" : "Clicks"}
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
                  Today
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
            Overview ({saasPeriod})
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
                  {tab}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="inline-flex items-center gap-2 rounded-[10px] bg-[#465FFF] hover:bg-[#3641F5] px-4 py-2 text-xs font-semibold text-white shadow-2xs transition-colors cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Create Link</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 rounded-[10px] border border-[#E4E7EC] dark:border-[#344054] divide-y sm:divide-y-0 sm:divide-x divide-[#E4E7EC] dark:divide-[#344054]">
          <div
            onClick={() => router.push("/dashboard/analytics/revenue")}
            className="p-5 cursor-pointer"
          >
            <p className="text-xs font-medium text-[#667085]">Total Revenue</p>
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-[#101828] dark:text-white">
                ${periodMetrics.rev.toFixed(2)}
              </span>
              <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 text-xs font-semibold text-[#039855]">
                Live
              </span>
            </div>
          </div>
          <div
            onClick={() => router.push("/dashboard/analytics")}
            className="p-5 cursor-pointer"
          >
            <p className="text-xs font-medium text-[#667085]">
              Unique Edge Visitors
            </p>
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-[#101828] dark:text-white">
                {formatNumber(periodMetrics.visitors)}
              </span>
              <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 text-xs font-semibold text-[#039855]">
                Verified
              </span>
            </div>
          </div>
          <div
            onClick={() => router.push("/dashboard/analytics/revenue")}
            className="p-5 cursor-pointer"
          >
            <p className="text-xs font-medium text-[#667085]">
              Avg. Value per Click (EPC)
            </p>
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-[#101828] dark:text-white">
                ${periodMetrics.epc.toFixed(2)}
              </span>
              <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 text-xs font-semibold text-[#039855]">
                Attributed
              </span>
            </div>
          </div>
          <div
            onClick={() => router.push("/dashboard/links")}
            className="p-5 cursor-pointer"
          >
            <p className="text-xs font-medium text-[#667085]">
              Avg. Clicks per Link
            </p>
            <div className="mt-2.5 flex items-baseline gap-2.5">
              <span className="text-2xl font-bold text-[#101828] dark:text-white">
                {periodMetrics.avgClicks}
              </span>
              <span className="rounded-full bg-[#ECFDF3] px-2 py-0.5 text-xs font-semibold text-[#039855]">
                {displayActiveLinks} Active
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
              Statistics — {statsTab}
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
                  {tab}
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
                    ? "Last 24 Hours"
                    : statsRange === "7d"
                      ? "Last 7 Days"
                      : statsRange === "30d"
                        ? "Last 30 Days"
                        : "Last 12 Months"}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-[#667085]" />
              </button>

              {isStatsDateOpen && (
                <div className="absolute right-0 mt-1.5 w-44 rounded-xl border border-[#E4E7EC] dark:border-[#344054] bg-white dark:bg-[#141418] p-1.5 shadow-xl z-40">
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
                ? "Top Short Links by Clicks"
                : "Top Clients & Links by Revenue Traffic"}
            </h3>
            <p className="mt-0.5 text-xs text-[#667085] dark:text-[#98A2B3]">
              {donutToggleMode === "clicks"
                ? "Active-segment breakdown of links receiving click volume"
                : "Breakdown of clients and links driving attributed revenue"}
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
              Top Clicks
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
              Revenue & Clients
            </button>
          </div>
        </div>

        <ReuiDonutChart22
          items={dashboardDonutItems}
          centerLabel={
            donutToggleMode === "clicks" ? "Total Clicks" : "Total Revenue"
          }
          centerValueFormatter={(val) =>
            donutToggleMode === "revenue"
              ? `$${Number(val || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`
              : formatNumber(val)
          }
          emptyMessage="No clicks or revenue recorded yet."
        />
      </div>

      {/* Row 4: Short Links Directory Table */}
      <LinksReuiDataGrid
        links={links}
        copiedId={copiedId}
        onCopy={handleCopyText}
        onSelectLink={(link) => setSelectedEditLink(link)}
        onEdit={(link) => setSelectedEditLink(link)}
        onShareLink={(link) => setSelectedShareLink(link)}
        onSelectQr={(link) => setSelectedShareLink(link)}
        onQr={(link) => setSelectedShareLink(link)}
        onDeleteLink={handleDeleteLink}
        title="Short Links Directory"
      />

      <LinkCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          onRefresh?.();
        }}
      />
      {selectedEditLink && (
        <LinkEditModal
          link={selectedEditLink}
          isOpen={Boolean(selectedEditLink)}
          onClose={() => setSelectedEditLink(null)}
          onSuccess={() => {
            setSelectedEditLink(null);
            onRefresh?.();
          }}
        />
      )}
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
          <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-[#1D2939] border border-[#E4E7EC] dark:border-[#344054] shadow-2xl p-6">
            <div className="flex items-center justify-between pb-3 border-b border-[#E4E7EC] dark:border-[#344054]">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]">
                  <Target className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#101828] dark:text-white">
                    Modifier les objectifs mensuels
                  </h3>
                  <p className="text-xs text-[#667085] dark:text-[#98A2B3]">
                    Configurez vos cibles pour le mois en cours
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

            <form onSubmit={handleSaveTargets} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#344054] dark:text-[#E4E7EC] mb-1.5">
                  Objectif de Clics mensuel
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="10000000"
                    value={draftClicksInput}
                    onChange={(e) => setDraftClicksInput(e.target.value)}
                    className="w-full rounded-lg border border-[#D0D5DD] dark:border-[#344054] bg-white dark:bg-[#101828] px-3 py-2 text-sm text-[#101828] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0066FF]"
                    placeholder="1000"
                    required
                  />
                  <span className="absolute right-3 top-2 text-xs text-[#667085] dark:text-[#98A2B3]">
                    clics
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
                  Objectif de Revenus mensuel ($)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-[#667085] dark:text-[#98A2B3]">
                    $
                  </span>
                  <input
                    type="number"
                    min="1"
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

              <div className="p-3 rounded-xl bg-[#0066FF]/5 border border-[#0066FF]/15 text-[11px] text-[#344054] dark:text-[#D0D5DD] space-y-1">
                <p className="font-semibold text-[#0066FF] dark:text-[#5294FF] flex items-center gap-1.5">
                  <Check className="h-3.5 w-3.5" /> Alerte automatique à 100%
                </p>
                <p className="text-[#667085] dark:text-[#98A2B3] leading-relaxed">
                  Dès que votre seuil est atteint, un e-mail de félicitations vous est envoyé et une notification s'affiche dans l'icône cloche du tableau de bord.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTargetEditModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold text-[#344054] dark:text-[#E4E7EC] hover:bg-[#F2F4F7] dark:hover:bg-[#101828] transition-colors cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#0066FF] text-white hover:bg-[#0055D6] transition-colors shadow-sm cursor-pointer"
                >
                  Enregistrer l'objectif
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
