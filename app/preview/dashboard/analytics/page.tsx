"use client";

import React, { useState } from "react";
import {
  Calendar,
  ChevronDown,
  Download,
  RefreshCw,
  TrendingUp,
  Globe2,
  Users,
  Activity,
  Zap,
} from "lucide-react";
import { ReuiBarChart5 } from "@/components/examples/c-chart-5";
import { GeoLogsReuiDataGrid } from "@/components/dashboard/reui-data-grids";
import {
  PREVIEW_ANALYTICS,
  PREVIEW_MONTHLY_BARS,
  PREVIEW_LINKS,
} from "@/lib/preview-data";
import { formatNumber } from "@/lib/utils";
import { showToast } from "@/components/ui/toast-provider";

export default function PreviewAnalyticsTrafficPage() {
  const [range, setRange] = useState<"24h" | "7d" | "30d" | "12m">("30d");
  const [isRangeDropdownOpen, setIsRangeDropdownOpen] = useState(false);

  const rangeLabel =
    range === "24h"
      ? "Last 24 Hours"
      : range === "7d"
        ? "Last 7 Days"
        : range === "12m"
          ? "Last 12 Months"
          : "Last 30 Days";

  const topKpis = [
    {
      label: "Unique Visitors",
      value: formatNumber(PREVIEW_ANALYTICS.uniqueClicks),
      delta: "+12.1%",
      caption: `Period: ${range}`,
    },
    {
      label: "Total Link Clicks",
      value: formatNumber(PREVIEW_ANALYTICS.totalClicks),
      delta: "+18.4%",
      caption: `Period: ${range}`,
    },
    {
      label: "Active Short Links",
      value: formatNumber(PREVIEW_LINKS.length),
      delta: "100% active",
      caption: "In workspace",
    },
    {
      label: "Avg. Clicks / Link",
      value: (PREVIEW_ANALYTICS.totalClicks / PREVIEW_LINKS.length).toFixed(1),
      delta: "HTTP 302",
      caption: `Period: ${range}`,
    },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold ds-text-primary tracking-tight">
            Traffic & Analytics Overview
          </h1>
          <p className="text-[13px] ds-text-muted mt-0.5">
            Real-time edge redirect telemetry, channel attribution, and geographic breakdown
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRangeDropdownOpen((prev) => !prev)}
              className="inline-flex items-center gap-2 rounded-[10px] ds-card px-3.5 py-2 text-[13px] font-medium ds-text-secondary hover:bg-[#F2F4F7] dark:hover:bg-white/[0.04] transition-all cursor-pointer"
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
            onClick={() => showToast.success("Analytics overview exported to CSV!")}
            className="inline-flex items-center gap-1.5 rounded-lg ds-card px-2.5 py-2 text-xs font-medium ds-text-secondary hover:ds-text-primary h-9 cursor-pointer transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#465FFF]" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {topKpis.map((kpi, idx) => (
          <div key={idx} className="p-4 rounded-xl ds-card space-y-1">
            <div className="flex items-center justify-between text-xs ds-text-muted">
              <span>{kpi.label}</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium font-mono">
                {kpi.delta}
              </span>
            </div>
            <div className="text-2xl font-bold ds-text-primary font-mono">{kpi.value}</div>
            <div className="text-[11px] ds-text-muted">{kpi.caption}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl ds-card shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold ds-text-primary">Monthly Click Volume</h3>
              <p className="text-xs ds-text-muted">Seasonal traffic trends across 2026</p>
            </div>
            <span className="text-xs font-mono text-[#0066FF] dark:text-[#5294FF] bg-[#0066FF]/10 px-2 py-0.5 rounded">
              2026
            </span>
          </div>
          <div className="h-[260px]">
            <ReuiBarChart5 data={PREVIEW_MONTHLY_BARS} />
          </div>
        </div>

        {/* Top Channels */}
        <div className="p-5 rounded-2xl ds-card shadow-sm space-y-4">
          <h3 className="text-sm font-semibold ds-text-primary flex items-center justify-between">
            <span>Top Traffic Channels</span>
            <span className="text-xs ds-text-muted font-mono">Share</span>
          </h3>

          <div className="space-y-3">
            {PREVIEW_ANALYTICS.topReferrers.slice(0, 5).map((r, i) => (
              <div
                key={r.source}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-[#E4E7EC] dark:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs ds-text-muted w-4">{i + 1}</span>
                  <div>
                    <div className="text-sm font-medium ds-text-primary">{r.source}</div>
                    <div className="text-[11px] ds-text-muted">Direct or referral</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold ds-text-primary font-mono">
                    {r.count.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#465FFF] dark:text-[#7592FF] font-mono">
                    {r.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Edge Logs */}
      <div className="p-5 rounded-2xl ds-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-semibold ds-text-primary">Real-Time Edge Stream</h3>
          </div>
          <span className="text-xs font-mono ds-text-muted">Cloudflare D1 • 1.8ms</span>
        </div>

        <GeoLogsReuiDataGrid
          logs={PREVIEW_ANALYTICS.liveClickEvents || []}
          analytics={PREVIEW_ANALYTICS}
        />
      </div>
    </div>
  );
}
