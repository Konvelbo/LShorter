"use client";

import React, { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import {
  Activity,
  Globe2,
  Radio,
  TrendingUp,
  Wifi,
} from "lucide-react";
import { formatNumber } from "@/lib/utils";

export interface ActiveEdgeStreamProps {
  /** Total number of clicks tracked for current filter */
  totalClicks?: number;
  /** Number of live events captured in the last 24h */
  liveEvents24hCount?: number;
  /** Raw live click events list (already filtered by selected link & period) */
  events?: Record<string, unknown>[];
  /** Active links count */
  activeLinksCount?: number;
  /** Visual variant: compact for dashboard cards, large for dedicated live stream page */
  variant?: "compact" | "large";
  className?: string;
}

interface StreamTick {
  time: string;
  value: number;
}

const emptySubscribe = () => () => {};

function parseTs(raw: unknown): number {
  if (!raw) return NaN;
  let s = String(raw).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
    s = s.replace(" ", "T") + "Z";
  }
  return new Date(s).getTime();
}

export function ActiveEdgeStreamChart({
  totalClicks = 0,
  liveEvents24hCount,
  events = [],
  activeLinksCount = 0,
  variant = "compact",
  className = "",
}: ActiveEdgeStreamProps) {
  const mounted = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );

  const [referenceNowMs, setReferenceNowMs] = useState<number>(0);
  useEffect(() => {
    setReferenceNowMs(Date.now());
  }, [events, liveEvents24hCount]);

  // Build 100% authentic time-series buckets directly from real click events
  const { streamTicks, real24hCount, uniqueCountriesCount, peakBucketClicks } =
    useMemo(() => {
      const validTimestamps: number[] = [];
      const countries = new Set<string>();

      for (const ev of events) {
        const ts = parseTs(ev.timestamp ?? ev.created_at ?? ev.time);
        if (!isNaN(ts) && ts > 0) {
          validTimestamps.push(ts);
        }
        const cc = String(ev.countryCode ?? ev.country_code ?? "")
          .trim()
          .toUpperCase();
        if (cc && cc !== "XX") {
          countries.add(cc);
        }
      }

      const latestEventTs =
        validTimestamps.length > 0 ? Math.max(...validTimestamps) : 0;
      const anchorNow =
        referenceNowMs > 0
          ? Math.max(referenceNowMs, latestEventTs)
          : latestEventTs;
      const oneDayAgo = anchorNow > 0 ? anchorNow - 24 * 3600 * 1000 : 0;
      const count24h =
        oneDayAgo > 0
          ? validTimestamps.filter((t) => t >= oneDayAgo).length
          : 0;

      const resolved24h =
        typeof liveEvents24hCount === "number" ? liveEvents24hCount : count24h;

      const bucketCount = variant === "large" ? 16 : 12;

      if (validTimestamps.length === 0) {
        const baseAnchor = anchorNow > 0 ? anchorNow : 0;
        const emptyTicks: StreamTick[] = [];
        for (let i = bucketCount - 1; i >= 0; i--) {
          const d = new Date(baseAnchor - i * 3600 * 1000);
          emptyTicks.push({
            time:
              baseAnchor > 0
                ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                : `${String(24 - i).padStart(2, "0")}:00`,
            value: 0,
          });
        }
        return {
          streamTicks: emptyTicks,
          real24hCount: resolved24h,
          uniqueCountriesCount: countries.size,
          peakBucketClicks: 0,
        };
      }

      const minTs = Math.min(...validTimestamps);
      const maxTs = Math.max(...validTimestamps, anchorNow);
      const spanMs = Math.max(maxTs - minTs, 12 * 3600 * 1000);
      const useHourlyLabels = spanMs <= 48 * 3600 * 1000;
      const stepMs = Math.max(Math.ceil(spanMs / bucketCount), 1800 * 1000);
      const startMs = maxTs - bucketCount * stepMs;

      const counts = new Array<number>(bucketCount).fill(0);
      for (const ts of validTimestamps) {
        const idx = Math.min(
          bucketCount - 1,
          Math.max(0, Math.floor((ts - startMs) / stepMs))
        );
        counts[idx] += 1;
      }

      const ticks: StreamTick[] = counts.map((cnt, idx) => {
        const bucketEnd = new Date(startMs + (idx + 1) * stepMs);
        const label = useHourlyLabels
          ? bucketEnd.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })
          : bucketEnd.toLocaleDateString([], {
              month: "short",
              day: "2-digit",
            });
        return {
          time: label,
          value: cnt,
        };
      });

      const peak = Math.max(...counts, 0);

      return {
        streamTicks: ticks,
        real24hCount: resolved24h,
        uniqueCountriesCount: countries.size,
        peakBucketClicks: peak,
      };
    }, [events, liveEvents24hCount, variant, referenceNowMs]);

  const capturedCount = events.length;
  const hasActivity = capturedCount > 0 || totalClicks > 0;
  const maxVal = Math.max(peakBucketClicks, 4);

  if (!mounted) {
    if (variant === "large") {
      return (
        <div
          className={`rounded-[10px] bg-white dark:bg-[#141416] border border-[#E4E7EC] dark:border-[#222225] p-5 sm:p-6 mb-6 h-[440px] animate-pulse flex flex-col justify-between ${className}`}
          role="region"
          aria-label="Active edge telemetry loading skeleton"
        >
          <div className="h-6 w-48 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
          <div className="h-[240px] w-full bg-zinc-100 dark:bg-zinc-900 rounded-xl" />
          <div className="h-4 w-64 bg-zinc-200 dark:bg-zinc-800 rounded-md" />
        </div>
      );
    }
    return (
      <div
        className={`w-full h-[125px] flex items-center justify-center bg-zinc-50 dark:bg-zinc-900/50 rounded-lg animate-pulse ${className}`}
        role="region"
        aria-label="Edge stream loading skeleton"
      >
        <span className="text-xs text-[#667085] dark:text-[#a1a1aa]">
          Loading edge stream...
        </span>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VARIANT: LARGE (Pour la page /dashboard/analytics/live)
  // --------------------------------------------------------------------------
  if (variant === "large") {
    return (
      <div
        className={`rounded-[10px] bg-white dark:bg-[#141416] border border-[#E4E7EC] dark:border-[#222225] shadow-sm dark:shadow-2xl p-5 sm:p-6 mb-6 transition-all duration-300 ${className}`}
        role="region"
        aria-label="Active edge stream telemetry monitor"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-[#E4E7EC] dark:border-[#222225]">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF] border border-[#0066FF]/20">
                <span className="relative flex h-2 w-2" aria-hidden="true">
                  <span
                    className={`animate-ping motion-reduce:animate-none absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      hasActivity ? "bg-[#0066FF]" : "bg-zinc-400"
                    }`}
                  />
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      hasActivity ? "bg-[#0066FF]" : "bg-zinc-400"
                    }`}
                  />
                </span>
                LIVE EDGE TELEMETRY
              </span>
              <span className="text-xs font-mono text-[#667085] dark:text-[#a1a1aa]">
                Cloudflare D1 Click Ledger
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-[#101828] dark:text-[#fafafa] flex items-center gap-2 tracking-tight">
              Active Edge Stream Throughput
            </h2>

            <p className="text-xs text-[#667085] dark:text-[#a1a1aa]">
              Authentic chronological click distribution recorded from real HTTP 302 edge redirects.
            </p>
          </div>

          {/* Authentic Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex flex-wrap items-center gap-2.5 sm:gap-3 px-3.5 py-2 rounded-lg bg-[#F9FAFB] dark:bg-[#0c0c0e] border border-[#E4E7EC] dark:border-[#222225]">
              <div className="flex items-center gap-1.5 text-xs">
                <Activity className="w-3.5 h-3.5 text-[#0066FF]" aria-hidden="true" />
                <span className="text-[#667085] dark:text-[#a1a1aa] font-medium">
                  Captured:
                </span>
                <span className="font-mono font-bold text-[#101828] dark:text-[#fafafa]">
                  {formatNumber(capturedCount)} clicks
                </span>
              </div>
              <div className="hidden sm:block h-3 w-px bg-[#E4E7EC] dark:bg-[#222225]" />
              <div className="flex items-center gap-1.5 text-xs">
                <Globe2 className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
                <span className="text-[#667085] dark:text-[#a1a1aa] font-medium">
                  Countries:
                </span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {uniqueCountriesCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 4 Mini KPI Telemetry Strips — 100% Real Data */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-4">
          <div className="p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#09090b] border border-[#E4E7EC] dark:border-[#222225]">
            <div className="text-[11px] font-medium text-[#667085] dark:text-[#a1a1aa]">
              Captured Period Events
            </div>
            <div className="text-xl font-bold font-mono text-[#0066FF] dark:text-[#5294FF] mt-0.5">
              {formatNumber(capturedCount)}
            </div>
            <div className="text-[10.5px] text-[#667085] dark:text-[#a1a1aa] mt-1 flex items-center gap-1">
              <Radio className="w-3 h-3 text-emerald-500" aria-hidden="true" />
              <span>Verified D1 events</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#09090b] border border-[#E4E7EC] dark:border-[#222225]">
            <div className="text-[11px] font-medium text-[#667085] dark:text-[#a1a1aa]">
              24h Captured Events
            </div>
            <div className="text-xl font-bold text-[#101828] dark:text-[#fafafa] mt-0.5">
              {formatNumber(real24hCount)}
            </div>
            <div className="text-[10.5px] text-[#667085] dark:text-[#a1a1aa] mt-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066FF]" aria-hidden="true" />
              <span>Last 24 hours</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#09090b] border border-[#E4E7EC] dark:border-[#222225]">
            <div className="text-[11px] font-medium text-[#667085] dark:text-[#a1a1aa]">
              Peak Interval Clicks
            </div>
            <div className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
              {formatNumber(peakBucketClicks)}
            </div>
            <div className="text-[10.5px] text-[#667085] dark:text-[#a1a1aa] mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-500" aria-hidden="true" />
              <span>Max in single window</span>
            </div>
          </div>

          <div className="p-3 rounded-lg bg-[#F9FAFB] dark:bg-[#09090b] border border-[#E4E7EC] dark:border-[#222225]">
            <div className="text-[11px] font-medium text-[#667085] dark:text-[#a1a1aa]">
              Total Redirect Clicks
            </div>
            <div className="text-xl font-bold text-[#101828] dark:text-[#fafafa] mt-0.5">
              {formatNumber(totalClicks)}
            </div>
            <div className="text-[10.5px] text-[#667085] dark:text-[#a1a1aa] mt-1 flex items-center gap-1">
              <Wifi className="w-3 h-3 text-[#0066FF]" aria-hidden="true" />
              <span>
                {activeLinksCount === 1
                  ? "1 filtered link"
                  : activeLinksCount > 1
                    ? `${activeLinksCount} active links`
                    : "Cloudflare Edge"}
              </span>
            </div>
          </div>
        </div>

        {/* Grand Area Chart Container */}
        <div
          className="relative w-full h-[220px] sm:h-[250px] bg-[#F9FAFB] dark:bg-[#09090b] rounded-xl p-3 border border-[#E4E7EC] dark:border-[#222225] overflow-hidden"
          role="region"
          aria-label="Active edge throughput area chart"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              accessibilityLayer
              data={streamTicks}
              margin={{ top: 16, right: 12, bottom: 8, left: -10 }}
            >
              <defs>
                <linearGradient id="largeCyberBlueGlow" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0066FF" stopOpacity={0.42} />
                  <stop offset="50%" stopColor="#0066FF" stopOpacity={0.14} />
                  <stop offset="100%" stopColor="#0066FF" stopOpacity={0.01} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#888888"
                opacity={0.12}
              />

              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: "#888888" }}
                tickLine={false}
                axisLine={{ stroke: "#888888", opacity: 0.2 }}
                interval="preserveStartEnd"
              />

              <YAxis
                domain={[0, Math.ceil(maxVal * 1.25)]}
                allowDecimals={false}
                tick={{ fontSize: 10, fill: "#888888" }}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}`}
              />

              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const data = payload[0].payload as StreamTick;
                  return (
                    <div className="rounded-xl border border-[#E4E7EC] dark:border-[#222225] bg-white/95 dark:bg-[#141416]/95 p-3 shadow-xl backdrop-blur-md text-xs space-y-1.5 min-w-[190px]">
                      <div className="flex items-center justify-between text-[11px] text-[#667085] dark:text-[#a1a1aa] border-b border-[#E4E7EC] dark:border-[#222225] pb-1.5">
                        <span className="font-semibold">Window</span>
                        <span className="text-[#0066FF] dark:text-[#5294FF] font-mono font-bold">
                          {data.time}
                        </span>
                      </div>
                      <div className="flex items-center justify-between font-mono text-[#101828] dark:text-[#fafafa]">
                        <span className="text-[#667085] dark:text-[#a1a1aa]">
                          Recorded Clicks:
                        </span>
                        <span className="text-[#0066FF] dark:text-[#5294FF] font-bold text-sm">
                          {data.value}
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
                fill="url(#largeCyberBlueGlow)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>

          {/* Badge */}
          <div className="absolute right-4 top-3 flex items-center gap-2 bg-white/90 dark:bg-[#141416]/90 border border-[#E4E7EC] dark:border-[#222225] rounded-full px-3 py-1 text-xs font-mono shadow-sm pointer-events-none">
            <span
              className={`w-2 h-2 rounded-full ${
                hasActivity
                  ? "bg-[#0066FF]"
                  : "bg-gray-400 dark:bg-gray-600"
              }`}
              aria-hidden="true"
            />
            <span
              className={
                hasActivity
                  ? "text-[#0066FF] dark:text-[#5294FF] font-bold"
                  : "text-[#667085] dark:text-[#a1a1aa]"
              }
            >
              {formatNumber(capturedCount)} CLICKS
            </span>
          </div>
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // VARIANT: COMPACT (Pour la carte 'Active Edge Stream' de /dashboard/analytics)
  // --------------------------------------------------------------------------
  return (
    <div
      className={`relative w-full h-[125px] overflow-hidden ${className}`}
      role="region"
      aria-label="Active edge stream throughput chart"
    >
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          accessibilityLayer
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
              const data = payload[0].payload as StreamTick;
              return (
                <div className="rounded-xl border border-[#E4E7EC] dark:border-[#222225] bg-white/95 dark:bg-[#141416]/95 p-2.5 shadow-xl backdrop-blur-md text-xs space-y-1">
                  <div className="flex items-center justify-between gap-3 text-[11px] text-[#667085] dark:text-[#a1a1aa] border-b border-[#E4E7EC] dark:border-[#222225] pb-1">
                    <span>Window</span>
                    <span className="text-[#0066FF] dark:text-[#5294FF] font-mono font-bold">
                      {data.time}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4 font-mono font-semibold text-[#101828] dark:text-[#fafafa]">
                    <span>Clicks:</span>
                    <span className="text-[#0066FF] dark:text-[#5294FF] text-sm">
                      {data.value}
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

      <div className="absolute right-2 top-2 flex items-center gap-1.5 bg-white/90 dark:bg-[#141416]/90 border border-[#E4E7EC] dark:border-[#222225] rounded-full px-2 py-0.5 text-[10px] font-mono shadow-xs pointer-events-none transition-colors">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            hasActivity ? "bg-[#0066FF]" : "bg-gray-400 dark:bg-gray-600"
          }`}
          aria-hidden="true"
        />
        <span
          className={
            hasActivity
              ? "text-[#0066FF] dark:text-[#5294FF] font-bold"
              : "text-[#667085] dark:text-[#a1a1aa]"
          }
        >
          {formatNumber(capturedCount)} EVENTS
        </span>
      </div>
    </div>
  );
}
