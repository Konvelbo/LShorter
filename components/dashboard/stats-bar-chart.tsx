"use client";

import React, { useState } from "react";
import { ClickDataPoint } from "@/types";
import { formatNumber, cn } from "@/lib/utils";

interface StatsBarChartProps {
  data: ClickDataPoint[];
  title?: string;
  subtitle?: string;
}

export function StatsBarChart({
  data = [],
  title = "Clicks per day",
  subtitle = "Last 30 days"
}: StatsBarChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ClickDataPoint | null>(null);

  const safeData = Array.isArray(data) ? data : [];

  // Render passed-in timelineData directly when available, or generate a clean 14-day daily timeline fallback
  const timelineData = React.useMemo(() => {
    // If safeData already has pre-formatted points with labels, use it directly
    if (safeData.length > 0 && safeData.every((d) => Boolean(d.label))) {
      return safeData;
    }

    const daysCount = 14;
    const clicksMap = new Map<string, number>();
    const uniquesMap = new Map<string, number>();

    safeData.forEach((d) => {
      if (d?.date) {
        const key = d.date.slice(0, 10);
        clicksMap.set(key, (clicksMap.get(key) || 0) + (d.clicks || 0));
        uniquesMap.set(key, (uniquesMap.get(key) || 0) + (d.uniqueClicks || d.clicks || 0));
      }
    });

    const result: ClickDataPoint[] = [];
    const today = new Date();

    for (let i = daysCount - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const clicks = clicksMap.get(isoDate) || 0;
      const uniqueClicks = uniquesMap.get(isoDate) || (clicks > 0 ? clicks : 0);
      const dayLabel = d.toLocaleDateString("en-US", { day: "numeric", month: "short" });

      result.push({
        date: isoDate,
        dayNumber: d.getDate(),
        label: dayLabel,
        clicks,
        uniqueClicks,
      });
    }

    return result;
  }, [safeData]);

  const actualMax = Math.max(...timelineData.map((d) => d.clicks || 0), 0);
  const yAxisMax = actualMax <= 2 ? 4 : actualMax <= 5 ? 6 : actualMax <= 10 ? 12 : actualMax;

  return (
    <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-5 flex flex-col justify-between h-full relative group shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-wide">{title}</h3>
          <span className="text-xs text-zinc-500 dark:text-neutral-400 font-medium">{subtitle}</span>
        </div>
        {hoveredPoint ? (
          <div className="flex items-center gap-2 bg-zinc-100 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] rounded-[8px] px-2.5 py-1 text-xs animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="text-zinc-900 dark:text-white font-bold">{formatNumber(hoveredPoint.clicks)} click{hoveredPoint.clicks === 1 ? "" : "s"}</span>
            <span className="text-zinc-500 dark:text-neutral-400 text-[11px]">({hoveredPoint.label})</span>
          </div>
        ) : (
          <div className="text-xs text-zinc-500 dark:text-neutral-400 font-mono hidden sm:block">
            Peak: <span className="text-zinc-900 dark:text-white font-bold">{actualMax}</span> clicks
          </div>
        )}
      </div>

      {/* Floating Hover tooltip */}
      {hoveredPoint && (
        <div className="absolute top-16 right-5 bg-white/95 dark:bg-[#1f1f23]/95 backdrop-blur border border-zinc-200 dark:border-[#27272a] rounded-[10px] px-3 py-2 text-xs shadow-2xl pointer-events-none z-20 animate-in fade-in">
          <p className="text-zinc-500 dark:text-neutral-400 text-[10px]">{hoveredPoint.label} {hoveredPoint.date ? `(${hoveredPoint.date.slice(0, 10)})` : ""}</p>
          <p className="text-zinc-900 dark:text-white font-bold text-sm">
            <span className="text-brand">{formatNumber(hoveredPoint.clicks)}</span> click{hoveredPoint.clicks === 1 ? "" : "s"}
          </p>
          <p className="text-zinc-500 dark:text-neutral-400 text-[11px]">
            {formatNumber(hoveredPoint.uniqueClicks || hoveredPoint.clicks)} unique{(hoveredPoint.uniqueClicks || hoveredPoint.clicks) === 1 ? "" : "s"}
          </p>
        </div>
      )}

      {/* Bar Chart Area with Horizontal Guide Lines */}
      <div className="relative h-44 w-full pt-4 pb-2">
        {/* Horizontal Guide Lines */}
        <div className="absolute inset-x-0 top-6 border-b border-zinc-200 dark:border-[#27272a] border-dashed pointer-events-none flex justify-end pr-1 z-0">
          <span className="text-[9px] text-zinc-400 dark:text-neutral-500 font-mono -mt-3.5">{yAxisMax}</span>
        </div>
        <div className="absolute inset-x-0 top-1/2 border-b border-zinc-200/70 dark:border-[#27272a]/70 border-dashed pointer-events-none flex justify-end pr-1 z-0">
          <span className="text-[9px] text-zinc-400 dark:text-neutral-500 font-mono -mt-3.5">{Math.max(1, Math.round(yAxisMax / 2))}</span>
        </div>

        {/* Bars Container */}
        <div className="h-full w-full flex items-end justify-between gap-1 sm:gap-1.5 relative z-10">
          {timelineData.map((point, index) => {
            const hasClicks = (point.clicks || 0) > 0;
            const heightPercent = hasClicks
              ? Math.max(8, Math.round(((point.clicks || 0) / yAxisMax) * 100))
              : 3;
            const isHovered = hoveredPoint === point;

            return (
              <div
                key={index}
                onMouseEnter={() => setHoveredPoint(point)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="flex-1 min-w-[2px] max-w-[28px] flex flex-col items-center justify-end h-full group/bar cursor-pointer"
              >
                <div
                  className={cn(
                    "w-full rounded-t-[3px] transition-all duration-300 relative",
                    hasClicks
                      ? (isHovered
                          ? "bg-brand shadow-lg"
                          : "bg-brand opacity-90 shadow-sm")
                      : (isHovered ? "bg-zinc-300 dark:bg-[#2a2a30]" : "bg-zinc-200 dark:bg-[#1c1c20]")
                  )}
                  style={{
                    height: `${heightPercent}%`,
                    ...(hasClicks && isHovered ? { boxShadow: "0 0 12px var(--brand-primary-glow)" } : {}),
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic X-Axis labels */}
      <div className="flex items-center justify-between text-[11px] font-medium text-zinc-500 dark:text-neutral-400 pt-2.5 px-0.5 border-t border-zinc-200 dark:border-[#222225]">
        <span className="truncate max-w-[30%]">{timelineData[0]?.label || ""}</span>
        <span className="truncate max-w-[30%] text-center">{timelineData[Math.floor(timelineData.length / 2)]?.label || ""}</span>
        <span className="text-brand font-semibold truncate max-w-[35%] text-right">
          {timelineData[timelineData.length - 1]?.label || "Today"}
        </span>
      </div>
    </div>
  );
}
