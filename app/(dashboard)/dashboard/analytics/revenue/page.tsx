"use client";

import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  DollarSign,
  TrendingUp,
  ArrowLeft,
  Calendar,
  Filter,
  Search,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  CreditCard,
  MousePointerClick,
  Percent,
  Download,
  ExternalLink,
  SlidersHorizontal,
  Globe2,
  Smartphone,
  Laptop,
  ArrowUpRight,
  ShieldCheck,
  User,
  MoreHorizontal,
  Copy,
} from "lucide-react";
import { ShortLink, GlobalAnalytics, TimeRange, LiveClickEvent } from "@/types";
import { cfGetAnalytics, cfGetLinks, cfInvalidateCache } from "@/lib/cloudflare-api";
import { ColumnMaskToggle, ColumnDefinition } from "@/components/dashboard/analytics/column-mask-toggle";
import { KpiCardsCarousel } from "@/components/dashboard/analytics/kpi-cards-carousel";
import { ReuiBarChart5 } from "@/components/examples/c-chart-5";
import { AnalyticsRevenueSkeleton } from "@/components/ui/skeleton";
import { formatDateRelative, formatNumber, formatCurrency, getCountryName } from "@/lib/utils";
import { generateTimelineForRange } from "@/lib/analytics-generators";
import { getCountryFlag } from "@/lib/geo-coordinates";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast-provider";

const REVENUE_COLUMNS: ColumnDefinition[] = [
  { key: "beneficiary", label: "Beneficiary (Avatar & Name)", defaultVisible: true },
  { key: "revenue", label: "Revenue Generated (€)", defaultVisible: true },
  { key: "clicks", label: "Associated Clicks", defaultVisible: true },
  { key: "link", label: "Target Link", defaultVisible: true },
  { key: "location", label: "Country", defaultVisible: true },
  { key: "device", label: "Device & OS", defaultVisible: true },
  { key: "timestamp", label: "Timestamp", defaultVisible: true },
];

function RevenueAnalyticsContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = session?.user?.id || "";

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
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

  const [selectedRange, setSelectedRange] = useState<TimeRange>("month");
  const [selectedLinkId, setSelectedLinkId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(8);

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(REVENUE_COLUMNS.map((c) => c.key))
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
    setVisibleColumns(new Set(REVENUE_COLUMNS.map((c) => c.key)));
  };

  // Synchronize linkId from query string
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

  const hasLoadedOnceRef = useRef(false);

  const loadData = async (range = selectedRange, linkId = selectedLinkId, isBg = false) => {
    if (!userId) return;
    if (!isBg && !hasLoadedOnceRef.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const periodParam = range === "day" ? "1d" : range === "week" ? "7d" : range === "year" ? "365d" : "30d";
      const [analyticsRes, linksRes] = await Promise.all([
        cfGetAnalytics(userId, periodParam, linkId !== "all" ? linkId : undefined).catch(() => null),
        cfGetLinks(userId).catch(() => null),
      ]);

      const listData = Array.isArray(linksRes?.data)
        ? linksRes.data
        : Array.isArray((linksRes?.data as any)?.data)
        ? (linksRes?.data as any).data
        : [];
      const fetchedLinks = listData;
      setLinks(fetchedLinks);

      if (analyticsRes?.data) {
        const d = analyticsRes.data;
        const targetLink = linkId !== "all"
          ? fetchedLinks.find((l: any) => l.id === linkId || l.slug === linkId)
          : null;

        const totalClicks = Number(d.totalClicks ?? d.total_clicks ?? 0);
        const trackedRevenue = Number(d.trackedRevenue ?? d.total_revenue ?? 0);
        const epc = totalClicks > 0 ? Number((trackedRevenue / totalClicks).toFixed(2)) : 0;

        const rawEvents = (d.liveClickEvents ?? d.live_click_events ?? []) as LiveClickEvent[];

        setAnalytics({
          totalClicks,
          clicksGrowth: 0,
          uniqueClicks: Number(d.uniqueClicks ?? d.unique_clicks ?? 0),
          uniqueClicksGrowth: 0,
          trackedRevenue,
          revenueGrowth: 0,
          avgCtr: totalClicks > 0 ? Number(((rawEvents.filter(e => (e.conversionAmount || 0) > 0).length / totalClicks) * 100).toFixed(1)) : 0,
          ctrGrowth: 0,
          bounceRate: 0,
          epc,
          avgEngagementTime: "0s",
          clicksByDay: d.clicksByDay || [],
          topCountries: d.topCountries || [],
          topCities: d.topCities || [],
          topDevices: d.topDevices || [],
          topBrowsers: d.topBrowsers || [],
          topReferrers: d.topReferrers || [],
          liveClickEvents: rawEvents,
          recentConversions: d.recentConversions || [],
        });
      }
      hasLoadedOnceRef.current = true;
    } catch (err) {
      console.error("Error loading revenue analytics:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      setIsLoading(false);
      return;
    }
    if (userId) {
      loadData(selectedRange, selectedLinkId, hasLoadedOnceRef.current);
    }
  }, [status, userId, selectedRange, selectedLinkId]);

  const handleRangeChange = (newRange: TimeRange) => {
    setSelectedRange(newRange);
    setCurrentPage(1);
  };

  const handleLinkSelectChange = (newLinkId: string) => {
    setSelectedLinkId(newLinkId);
    setCurrentPage(1);
    const target = links.find((l: any) => l.id === newLinkId || l.slug === newLinkId);
    if (target) {
      router.push(`/dashboard/analytics/revenue?linkId=${encodeURIComponent(target.id)}&slug=${encodeURIComponent(target.slug)}`);
    } else {
      router.push("/dashboard/analytics/revenue");
    }
  };

  const rangeLabels: Record<TimeRange, string> = {
    day: "Last 24 hours",
    week: "Last 7 days",
    month: "Last 30 days",
    year: "Last 12 months",
  };

  const selectedLinkObj = selectedLinkId !== "all"
    ? links.find((l: any) => l.id === selectedLinkId || l.slug === selectedLinkId)
    : undefined;

  // Beneficiaries & Transactions Aggregation
  // We extract all events with conversion or customer details, and group or list them authentically
  const beneficiariesList = useMemo(() => {
    const rawList = analytics.liveClickEvents || [];

    // Filter events matching link filter
    const linkFiltered = rawList.filter((e) => {
      if (selectedLinkObj && e.slug) {
        return e.slug.toLowerCase() === selectedLinkObj.slug.toLowerCase();
      }
      return true;
    });

    // Only real buyers & beneficiaries with payments or customer contacts
    const buyerEvents = linkFiltered.filter(
      (ev) =>
        Number(ev.conversionAmount || 0) > 0 ||
        Boolean(
          ev.customerName ||
            ev.customerFullName ||
            ev.fullName ||
            ev.userName ||
            ev.customerEmail ||
            ev.email ||
            ev.userEmail,
        ),
    );

    // Map each event to a structured beneficiary entry
    const entries = buyerEvents.map((ev, idx) => {
      const name =
        ev.customerName ||
        ev.customerFullName ||
        ev.fullName ||
        ev.userName ||
        "";
      const email = ev.customerEmail || ev.email || ev.userEmail || "";
      const avatar =
        ev.customerAvatar ||
        ev.avatarUrl ||
        ev.avatar ||
        ev.userAvatar ||
        "";
      const rev = Number(ev.conversionAmount || 0);
      const clicks = Number((ev as any).clicks || 1);

      return {
        id: ev.id || `ben_${idx}`,
        name,
        email,
        avatar,
        revenue: rev,
        clicks,
        slug: ev.slug || (selectedLinkObj ? selectedLinkObj.slug : ""),
        countryCode: ev.countryCode || ev.countryName || "",
        city: ev.city || "",
        device: ev.device || "",
        os: ev.os || "",
        timestamp: ev.timestamp || new Date().toISOString(),
        hasPayment: rev > 0,
      };
    });

    return entries;
  }, [analytics.liveClickEvents, selectedLinkObj]);

  // Search & Filter Beneficiaries
  const filteredBeneficiaries = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return beneficiariesList;
    return beneficiariesList.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.email.toLowerCase().includes(q) ||
        b.slug.toLowerCase().includes(q) ||
        b.city.toLowerCase().includes(q)
    );
  }, [beneficiariesList, searchQuery]);

  // Pagination Calculations
  const totalPages = Math.max(1, Math.ceil(filteredBeneficiaries.length / pageSize));
  const paginatedBeneficiaries = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBeneficiaries.slice(start, start + pageSize);
  }, [filteredBeneficiaries, currentPage, pageSize]);

  // Aggregated KPIs
  const totalRevenue = analytics.trackedRevenue || 0;
  const totalBeneficiaries = filteredBeneficiaries.filter((b) => b.revenue > 0).length;
  const totalAssociatedClicks = analytics.totalClicks || 0;
  const epcValue = analytics.epc || (totalAssociatedClicks > 0 ? Number((totalRevenue / totalAssociatedClicks).toFixed(2)) : 0);
  const aov = totalBeneficiaries > 0 ? Number((totalRevenue / totalBeneficiaries).toFixed(2)) : 0;
  const conversionRate = totalAssociatedClicks > 0 ? Number(((totalBeneficiaries / totalAssociatedClicks) * 100).toFixed(1)) : 0;

  const timelinePoints = useMemo(() => {
    return generateTimelineForRange(
      selectedRange,
      totalAssociatedClicks,
      analytics.uniqueClicks,
      analytics.clicksByDay,
      analytics.liveClickEvents,
    );
  }, [
    selectedRange,
    totalAssociatedClicks,
    analytics.uniqueClicks,
    analytics.clicksByDay,
    analytics.liveClickEvents,
  ]);

  // CSV Export Handler
  const handleExportCSV = () => {
    try {
      setIsExporting(true);
      const headers = ["ID", "Name", "Email", "Revenue (€)", "Clicks", "Link", "Country", "City", "Device", "Date"];
      const rows = filteredBeneficiaries.map((b) => [
        b.id,
        `"${b.name.replace(/"/g, '""')}"`,
        `"${b.email.replace(/"/g, '""')}"`,
        b.revenue.toFixed(2),
        b.clicks,
        `"${b.slug}"`,
        b.countryCode,
        `"${b.city}"`,
        b.device,
        b.timestamp,
      ]);

      const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\r\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lshorter_revenue_${selectedRange}_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast.success("Revenue data exported successfully!");
    } catch (err: any) {
      showToast.error("Error exporting CSV.");
    } finally {
      setIsExporting(false);
    }
  };

  if (status === "loading" || isLoading) {
    return <AnalyticsRevenueSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in pb-16">
      {/* ─── Top Navigation Header ────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-zinc-200 dark:border-[#222225]">
        <div className="flex flex-col gap-1.5">
          <Link
            href={`/dashboard/analytics${selectedLinkObj ? `?linkId=${encodeURIComponent(selectedLinkObj.id)}&slug=${encodeURIComponent(selectedLinkObj.slug)}` : ""}`}
            className="inline-flex items-center gap-1.5 text-xs text-zinc-500 hover:text-emerald-600 dark:text-neutral-400 dark:hover:text-emerald-400 transition-colors w-fit group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
            <span>Back to global analytics</span>
          </Link>
          <div className="flex items-center gap-2 mt-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-wide flex items-center gap-2">
              <span>In-Depth Revenue Analytics</span>
            </h1>
          </div>
          <p className="text-xs text-zinc-500 dark:text-neutral-400">
            Complete traceability of beneficiaries, average order values (AOV), earnings per click (EPC), and real-time conversions.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 lg:ml-auto w-full lg:w-auto">
          {/* Link Filter Selector */}
          <div className="flex items-center gap-2 bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] rounded-[10px] px-3 py-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
            <span className="text-zinc-500 dark:text-neutral-400 font-medium">Link:</span>
            <select
              value={selectedLinkObj ? selectedLinkObj.id : "all"}
              onChange={(e) => handleLinkSelectChange(e.target.value)}
              className="bg-transparent text-zinc-900 dark:text-white font-semibold focus:outline-none cursor-pointer border-none"
            >
              <option value="all" className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white">All links ({links.length})</option>
              {links.map((l: any) => (
                <option key={l.id} value={l.id} className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white">
                  {l.slug} ({formatNumber(l.clicks_count || l.clicksCount || 0)} clicks)
                </option>
              ))}
            </select>
          </div>

          {/* Refresh Button */}
          <Button
            onClick={async () => {
              setIsRefreshing(true);
              cfInvalidateCache("/api/analytics");
              await loadData(selectedRange, selectedLinkId, true);
              showToast.success("Revenue data updated!");
            }}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5 border-zinc-300 dark:border-[#27272a] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#141416] dark:hover:bg-white/5 text-zinc-700 hover:text-zinc-900 dark:text-neutral-300 dark:hover:text-white hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-500 dark:text-emerald-400" : "text-zinc-500 dark:text-neutral-400"}`} />
            <span>Refresh</span>
          </Button>

          {/* Export CSV Button pushed all the way to the right */}
          <Button
            onClick={handleExportCSV}
            disabled={isExporting}
            variant="outline"
            size="sm"
            className="ml-auto sm:ml-0 text-xs gap-1.5 border-emerald-500/30 hover:border-emerald-500/60 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isExporting ? "Exporting..." : "Export CSV"}</span>
          </Button>
        </div>
      </div>

      {/* ─── Time Range Selector Bar ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-2 sm:p-2.5 rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs w-full sm:w-auto">
          <div className="flex items-center justify-between sm:justify-start gap-1.5 px-1 sm:px-2 text-zinc-500 dark:text-neutral-400 font-medium">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
              <span>Analysis period:</span>
            </span>
            <span className="sm:hidden text-zinc-400 dark:text-neutral-500 text-[11px] font-medium">
              {rangeLabels[selectedRange]}
            </span>
          </div>

          <div className="grid grid-cols-4 gap-1 p-1 bg-zinc-100 dark:bg-[#0d0d10] border border-zinc-200 dark:border-[#1f1f24] rounded-[10px] sm:flex sm:items-center sm:bg-transparent sm:border-0 sm:p-0">
            {(["day", "week", "month", "year"] as TimeRange[]).map((r) => {
              const labels: Record<TimeRange, string> = { day: "24h", week: "7 days", month: "30 days", year: "1 year" };
              const isSel = selectedRange === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => handleRangeChange(r)}
                  className={`text-center py-1.5 px-2 sm:px-3 rounded-[10px] font-semibold transition-all cursor-pointer text-xs ${
                    isSel
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20 font-bold"
                      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/60 dark:text-neutral-400 dark:hover:text-white dark:hover:bg-white/5"
                  }`}
                >
                  {labels[r]}
                </button>
              );
            })}
          </div>
        </div>

        <span className="hidden sm:inline-block text-zinc-500 dark:text-neutral-400 text-xs px-2 font-medium">
          {rangeLabels[selectedRange]}
        </span>
      </div>

      {/* ─── Key Financial Metrics KPI Cards (Wide & Tall Summary Grid) ───────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* 1. Revenue Generated */}
        <div className="min-h-[155px] p-6 sm:p-7 rounded-[14px] bg-white dark:bg-[#111113] border border-black/[0.08] dark:border-white/[0.08] text-[#09090B] dark:text-white shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
              Total Revenue
            </span>
            <div className="w-9 h-9 rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <DollarSign className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none tracking-tight">
            {formatCurrency(totalRevenue)}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-black/[0.08] dark:border-white/[0.08]">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 truncate">
              <TrendingUp className="w-3.5 h-3.5 shrink-0" />
              <span>Net attributed revenue</span>
            </span>
            <span className="text-xs text-zinc-500 dark:text-neutral-400 font-mono font-semibold">
              {formatNumber(totalAssociatedClicks)} clicks
            </span>
          </div>
        </div>

        {/* 2. Beneficiaries & Buyers */}
        <div className="min-h-[155px] p-6 sm:p-7 rounded-[14px] bg-white dark:bg-[#111113] border border-black/[0.08] dark:border-white/[0.08] text-[#09090B] dark:text-white shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">
              Customers &amp; Buyers
            </span>
            <div className="w-9 h-9 rounded-[10px] bg-[#465FFF]/10 border border-[#465FFF]/20 flex items-center justify-center shrink-0">
              <UserCheck className="w-4.5 h-4.5 text-[#465FFF]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#09090B] dark:text-white leading-none tracking-tight">
            {formatNumber(totalBeneficiaries)}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-black/[0.08] dark:border-white/[0.08]">
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate">
              {totalBeneficiaries > 0 ? `${totalBeneficiaries} verified buyers` : "Active tracking"}
            </span>
            <span className="text-xs text-zinc-500 dark:text-neutral-400 font-mono font-semibold">
              {conversionRate}% CR
            </span>
          </div>
        </div>

        {/* 3. EPC (Earnings Per Click) */}
        <div className="min-h-[155px] p-6 sm:p-7 rounded-[14px] bg-white dark:bg-[#111113] border border-black/[0.08] dark:border-white/[0.08] text-[#09090B] dark:text-white shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider truncate">
              Earnings Per Click (EPC)
            </span>
            <div className="w-9 h-9 rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-600 dark:text-emerald-400 leading-none tracking-tight">
            {epcValue.toFixed(2)}€
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-black/[0.08] dark:border-white/[0.08]">
            <span className="text-xs text-zinc-600 dark:text-neutral-400 truncate">
              Average yield per click
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono font-bold">
              EPC
            </span>
          </div>
        </div>

        {/* 4. Average Order Value (AOV) */}
        <div className="min-h-[155px] p-6 sm:p-7 rounded-[14px] bg-white dark:bg-[#111113] border border-black/[0.08] dark:border-white/[0.08] text-[#09090B] dark:text-white shadow-sm flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-600 dark:text-neutral-400 uppercase tracking-wider truncate">
              Average Order Value
            </span>
            <div className="w-9 h-9 rounded-[10px] bg-[#465FFF]/10 border border-[#465FFF]/20 flex items-center justify-center shrink-0">
              <CreditCard className="w-4.5 h-4.5 text-[#465FFF]" />
            </div>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-[#09090B] dark:text-white leading-none tracking-tight">
            {formatCurrency(aov)}
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-black/[0.08] dark:border-white/[0.08]">
            <span className="text-xs text-zinc-600 dark:text-neutral-400 truncate">
              Average basket per buyer
            </span>
            <span className="text-xs text-[#465FFF] font-mono font-bold">
              AOV
            </span>
          </div>
        </div>
      </div>

      {/* ─── Visual Timeline Chart & Revenue Attribution Breakdown ────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Timeline Chart (8 cols) */}
        <div className="lg:col-span-8 p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] flex flex-col justify-between shadow-sm dark:shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Chronological Revenue Trend</span>
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
                Time series of amounts generated over the period ({rangeLabels[selectedRange]}).
              </p>
            </div>
            <span className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-[8px] border border-emerald-500/20">
              Total: {formatCurrency(totalRevenue)}
            </span>
          </div>

          {/* @reui/c-chart-5 Revenue & Conversions Bar Chart (Strictly 0 when $0 revenue) */}
          <div className="w-full pt-3">
            <ReuiBarChart5
              data={timelinePoints.map((pt, i) => {
                const dayRevNum =
                  totalRevenue > 0 && totalAssociatedClicks > 0 && pt.clicks > 0
                    ? Number(((pt.clicks / totalAssociatedClicks) * totalRevenue).toFixed(2))
                    : 0;
                const estDayConversions =
                  totalBeneficiaries > 0 && totalAssociatedClicks > 0 && pt.clicks > 0
                    ? Math.max(1, Math.round((pt.clicks / totalAssociatedClicks) * totalBeneficiaries))
                    : 0;
                return {
                  label: pt.label || (pt.date ? String(pt.date).slice(5, 10) : `D${i + 1}`),
                  fullDate: pt.date ? `${pt.label || ""} (${String(pt.date).slice(0, 10)})` : pt.label || `Day ${i + 1}`,
                  extraLabel: `${pt.clicks || 0} associated clicks`,
                  primary: dayRevNum,
                  secondary: estDayConversions,
                };
              })}
              primaryLabel="Attributed Revenue ($)"
              secondaryLabel="Confirmed Sales"
              primaryColorLight="#10B981"
              primaryColorDark="#34D399"
              secondaryColorLight="#465FFF"
              secondaryColorDark="#6366F1"
              heightClassName="h-[220px] w-full"
              showSecondaryBar
              showYAxis
            />
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500 dark:text-neutral-400 pt-3">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
              <span>Revenue & Attributed Conversions</span>
            </span>
            <span>Edge Attribution <strong className="text-zinc-900 dark:text-white">Cloudflare D1</strong></span>
          </div>
        </div>

        {/* Top Revenue Links Breakdown (4 cols) */}
        <div className="lg:col-span-4 p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] flex flex-col justify-between shadow-sm dark:shadow-xl">
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Top Earning Links</span>
              </h3>
              <span className="text-[10px] text-zinc-500 dark:text-neutral-500">By amount</span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-neutral-400 mb-4">
              Links that generated the highest revenue over the period.
            </p>

            <div className="flex flex-col gap-3">
              {links.length === 0 ? (
                <p className="text-xs text-zinc-500 dark:text-neutral-500 italic">No links recorded.</p>
              ) : (
                links.slice(0, 4).map((l: any) => {
                  const linkRev = Number(l.revenue || 0);
                  const share = totalRevenue > 0 ? Math.min(100, Math.round((linkRev / totalRevenue) * 100)) : 0;
                  return (
                    <div key={l.id} className="flex flex-col gap-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-zinc-900 dark:text-white truncate max-w-[140px]">
                          /{l.slug}
                        </span>
                        <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(linkRev)}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-zinc-100 dark:bg-[#222226] rounded-full overflow-hidden">
                        <div
                          style={{ width: `${share}%` }}
                          className="h-full bg-emerald-500 rounded-full"
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-200 dark:border-[#222225] flex items-center justify-between text-xs text-zinc-500 dark:text-neutral-400">
            <span>SDK Tracking</span>
            <Link
              href="/dashboard/api-sdk"
              className="text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <span>API Docs</span>
              <ArrowUpRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Detailed Beneficiaries List & Pagination DataGrid ─────────────── */}
      <div className="flex flex-col gap-4 rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-5 shadow-sm dark:shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>Detailed Beneficiaries & Buyers List</span>
              </h3>
              <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-neutral-800 text-zinc-700 dark:text-neutral-300 text-[11px] font-mono">
                {filteredBeneficiaries.length} transaction{filteredBeneficiaries.length > 1 ? "s" : ""}
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
              View each beneficiary&apos;s avatar, full name, email, associated clicks, and earned revenue.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 text-zinc-400 dark:text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8.5 pr-3 py-1.5 rounded-[10px] bg-zinc-50 dark:bg-[#0e0e11] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 focus:outline-none focus:border-emerald-500/60"
              />
            </div>

            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 bg-zinc-50 dark:bg-[#0e0e11] border border-zinc-200 dark:border-[#27272a] rounded-[10px] px-2.5 py-1 text-xs text-zinc-700 dark:text-neutral-300">
              <span className="text-zinc-500 dark:text-neutral-500 text-[11px]">Show:</span>
              <select
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-transparent text-zinc-900 dark:text-white font-semibold focus:outline-none cursor-pointer border-none text-xs"
              >
                <option value={5} className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white">5</option>
                <option value={8} className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white">8</option>
                <option value={15} className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white">15</option>
                <option value={25} className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white">25</option>
              </select>
            </div>

            {/* Column Mask Toggle */}
            <ColumnMaskToggle
              columns={REVENUE_COLUMNS}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
              onResetColumns={resetColumns}
            />
          </div>
        </div>

        {/* ─── Table ──────────────────────────────────────────────────────── */}
        <div className="overflow-x-auto rounded-[8px] border border-zinc-200 dark:border-[#222225] custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-[#222225] bg-zinc-100/70 dark:bg-[#0e0e11]/80 text-zinc-700 dark:text-neutral-400 font-semibold select-none text-[10.5px] uppercase tracking-wider">
                {visibleColumns.has("beneficiary") && (
                  <th className="py-2 px-3 min-w-[200px]">Beneficiary / Buyer</th>
                )}
                {visibleColumns.has("revenue") && (
                  <th className="py-2 px-3 min-w-[120px]">Generated Revenue</th>
                )}
                {visibleColumns.has("clicks") && (
                  <th className="py-2 px-3 min-w-[100px]">Associated Clicks</th>
                )}
                {visibleColumns.has("link") && (
                  <th className="py-2 px-3 min-w-[120px]">Target Link</th>
                )}
                {visibleColumns.has("location") && (
                  <th className="py-2 px-3 min-w-[130px]">Location</th>
                )}
                {visibleColumns.has("device") && (
                  <th className="py-2 px-3 min-w-[110px]">Device & OS</th>
                )}
                {visibleColumns.has("timestamp") && (
                  <th className="py-2 px-3 min-w-[120px]">Date & Time</th>
                )}
                <th className="py-2 px-3 text-right min-w-[70px]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-[#222225] text-zinc-800 dark:text-neutral-200">
              {paginatedBeneficiaries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-500 dark:text-neutral-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <UserCheck className="w-8 h-8 text-zinc-400 dark:text-neutral-600" />
                      <p className="font-semibold text-sm text-zinc-700 dark:text-neutral-400">No beneficiaries found</p>
                      <p className="text-xs text-zinc-500 dark:text-neutral-500 max-w-sm">
                        Conversions and payments tracked via API or SDK will automatically display each customer&apos;s avatar and details here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedBeneficiaries.map((b) => {
                  const initial = (b.name || b.email || "").trim().charAt(0).toUpperCase();
                  const cleanSlug = String(b.slug || "").replace(/^\//, "");
                  const shortLinkUrl = cleanSlug ? `https://lsho.cc/${cleanSlug}` : "https://lsho.cc";

                  return (
                    <tr
                      key={b.id}
                      className="hover:bg-zinc-50 dark:hover:bg-[#1a1a1e] transition-colors group"
                    >
                      {/* 1. Beneficiary (Avatar & FullName & Email) */}
                      {visibleColumns.has("beneficiary") && (
                        <td className="py-2 px-3">
                          <div className="flex items-center gap-2.5">
                            {/* Avatar on the far left */}
                            <div className="relative w-7 h-7 rounded-full overflow-hidden shrink-0 border border-zinc-200 dark:border-[#333338] bg-zinc-100 dark:bg-[#1a1a1e] flex items-center justify-center shadow-inner">
                              {b.avatar ? (
                                <img
                                  src={b.avatar}
                                  alt={b.name || "Avatar"}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = "none";
                                  }}
                                />
                              ) : null}
                              {/* Fallback initial text or user icon */}
                              {initial ? (
                                <span className="font-bold text-[11px] text-zinc-700 dark:text-neutral-300 select-none">
                                  {initial}
                                </span>
                              ) : (
                                <User className="w-3 h-3 text-zinc-400 dark:text-neutral-500" />
                              )}
                            </div>

                            {/* Name & Email */}
                            <div className="min-w-0">
                              <div className="font-bold text-zinc-900 dark:text-white group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors truncate text-xs">
                                {b.name || <span className="text-zinc-400 dark:text-neutral-500 italic font-normal text-xs">—</span>}
                              </div>
                              {b.email ? (
                                <div className="text-[10px] text-zinc-500 dark:text-neutral-400 font-mono truncate">
                                  {b.email}
                                </div>
                              ) : null}
                            </div>
                          </div>
                        </td>
                      )}

                      {/* 2. Generated Revenue (Attribution Amount) */}
                      {visibleColumns.has("revenue") && (
                        <td className="py-2 px-3 font-mono">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/30 text-[11px]">
                            +{formatCurrency(b.revenue)}
                          </span>
                        </td>
                      )}

                      {/* 3. Associated Clicks */}
                      {visibleColumns.has("clicks") && (
                        <td className="py-2 px-3 font-mono font-bold text-zinc-700 dark:text-neutral-300 text-xs">
                          <span className="flex items-center gap-1">
                            <MousePointerClick className="w-3 h-3 text-zinc-400 dark:text-neutral-500" />
                            <span>{b.clicks} click{b.clicks > 1 ? "s" : ""}</span>
                          </span>
                        </td>
                      )}

                      {/* 4. Target Link */}
                      {visibleColumns.has("link") && (
                        <td className="py-2 px-3 font-mono text-zinc-700 dark:text-neutral-300 truncate text-xs">
                          {b.slug ? (
                            <span className="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-[#222226] text-zinc-800 dark:text-neutral-300 font-semibold">
                              /{b.slug}
                            </span>
                          ) : (
                            <span className="text-zinc-400 dark:text-neutral-500">—</span>
                          )}
                        </td>
                      )}

                      {/* 5. Location (Country) */}
                      {visibleColumns.has("location") && (
                        <td className="py-2 px-3 text-zinc-700 dark:text-neutral-300 text-xs">
                          {b.countryCode ? (
                            <div className="flex items-center gap-1.5">
                              <img
                                src={`https://flagcdn.com/w20/${String(b.countryCode).toLowerCase()}.png`}
                                alt={b.countryCode}
                                className="w-4 h-3 rounded-[2px] object-cover shrink-0"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = "none";
                                }}
                              />
                              <span className="truncate font-medium">
                                {getCountryName(b.countryCode) || b.countryCode}
                              </span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 dark:text-neutral-500">—</span>
                          )}
                        </td>
                      )}

                      {/* 6. Device & OS */}
                      {visibleColumns.has("device") && (
                        <td className="py-2 px-3 text-zinc-700 dark:text-neutral-300 text-xs">
                          {b.device || b.os ? (
                            <div className="flex items-center gap-1">
                              {b.device === "mobile" ? (
                                <Smartphone className="w-3 h-3 text-blue-500 dark:text-blue-400" />
                              ) : (
                                <Laptop className="w-3 h-3 text-purple-500 dark:text-purple-400" />
                              )}
                              <span className="capitalize text-[11px]">{b.os || b.device}</span>
                            </div>
                          ) : (
                            <span className="text-zinc-400 dark:text-neutral-500">—</span>
                          )}
                        </td>
                      )}

                      {/* 7. Date & Time */}
                      {visibleColumns.has("timestamp") && (
                        <td className="py-2 px-3 text-zinc-500 dark:text-neutral-400 whitespace-nowrap text-[11px]">
                          {b.timestamp ? formatDateRelative(b.timestamp) : "—"}
                        </td>
                      )}

                      {/* 8. Three-Dots Action Dropdown */}
                      <td className="py-2 px-3 text-right relative whitespace-nowrap">
                        <details className="relative inline-block text-left">
                          <summary
                            aria-label="Open link actions"
                            className="list-none inline-flex h-7 w-7 items-center justify-center rounded-lg text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </summary>
                          <div className="absolute right-0 mt-1.5 w-52 rounded-xl border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#141418] p-1.5 shadow-xl z-50 text-left">
                            <a
                              href={`/r/${encodeURIComponent(cleanSlug)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                setTimeout(() => {
                                  window.dispatchEvent(new CustomEvent("lshorter_data_change"));
                                  window.dispatchEvent(new CustomEvent("lshorter_links_updated"));
                                }, 900);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-[#465FFF] dark:text-[#7592FF] hover:bg-[#ECF3FF]/70 dark:hover:bg-[#465FFF]/15 transition-colors cursor-pointer"
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-[#465FFF] dark:text-[#7592FF]" />
                              <span>Open link in new tab</span>
                            </a>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(shortLinkUrl);
                              }}
                              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-700 dark:text-neutral-200 hover:bg-zinc-100 dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                            >
                              <Copy className="w-3.5 h-3.5 text-zinc-500" />
                              <span>Copy short link</span>
                            </button>
                          </div>
                        </details>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ─── Pagination Controls ────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-zinc-500 dark:text-neutral-400">
          <span>
            Showing{" "}
            <strong className="text-zinc-900 dark:text-white">
              {filteredBeneficiaries.length === 0 ? 0 : (currentPage - 1) * pageSize + 1}
            </strong>{" "}
            to{" "}
            <strong className="text-zinc-900 dark:text-white">
              {Math.min(currentPage * pageSize, filteredBeneficiaries.length)}
            </strong>{" "}
            of <strong className="text-zinc-900 dark:text-white">{filteredBeneficiaries.length}</strong> beneficiary(ies)
          </span>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1}
              className="h-8 px-2.5 text-xs border-zinc-300 dark:border-[#27272a] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#141416] text-zinc-700 hover:text-zinc-900 dark:text-neutral-300 dark:hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5 mr-1" />
              <span>Previous</span>
            </Button>

            <span className="px-2 py-1 bg-zinc-100 dark:bg-[#1a1a1e] rounded text-zinc-900 dark:text-white font-semibold">
              Page {currentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages}
              className="h-8 px-2.5 text-xs border-zinc-300 dark:border-[#27272a] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#141416] text-zinc-700 hover:text-zinc-900 dark:text-neutral-300 dark:hover:text-white disabled:opacity-40 cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3.5 h-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RevenueAnalyticsPage() {
  return (
    <Suspense fallback={<AnalyticsRevenueSkeleton />}>
      <RevenueAnalyticsContent />
    </Suspense>
  );
}
