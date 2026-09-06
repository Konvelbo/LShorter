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
  title = "Clics par jour",
  subtitle = "30 derniers jours"
}: StatsBarChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ClickDataPoint | null>(null);

  const safeData = Array.isArray(data) ? data : [];

  // Render passed-in timelineData directly when available, or generate a clean 14-day daily timeline fallback
  const timelineData = React.useMemo(() => {
    // If safeData already has pre-formatted points with labels (e.g. from generateTimelineForRange), use it directly!
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
      const dayLabel = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

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
    <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col justify-between h-full relative group">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
          <span className="text-xs text-neutral-400 font-medium">{subtitle}</span>
        </div>
        {hoveredPoint ? (
          <div className="flex items-center gap-2 bg-[#1a1a1e] border border-[#27272a] rounded-[8px] px-2.5 py-1 text-xs animate-in fade-in">
            <span className="w-2 h-2 rounded-full bg-[#ff6600] animate-pulse" />
            <span className="text-white font-bold">{formatNumber(hoveredPoint.clicks)} clic{hoveredPoint.clicks > 1 ? "s" : ""}</span>
            <span className="text-neutral-400 text-[11px]">({hoveredPoint.label})</span>
          </div>
        ) : (
          <div className="text-xs text-neutral-500 font-mono hidden sm:block">
            Pic : <span className="text-white font-bold">{actualMax}</span> clics
          </div>
        )}
      </div>

      {/* Floating Hover tooltip for touch / cursor precision */}
      {hoveredPoint && (
        <div className="absolute top-16 right-5 bg-[#1f1f23]/95 backdrop-blur border border-[#27272a] rounded-[10px] px-3 py-2 text-xs shadow-2xl pointer-events-none z-20 animate-in fade-in">
          <p className="text-neutral-400 text-[10px]">{hoveredPoint.label} {hoveredPoint.date ? `(${hoveredPoint.date.slice(0, 10)})` : ""}</p>
          <p className="text-white font-bold text-sm">
            <span className="text-[#ff6600]">{formatNumber(hoveredPoint.clicks)}</span> clic{hoveredPoint.clicks > 1 ? "s" : ""}
          </p>
          <p className="text-neutral-400 text-[11px]">
            {formatNumber(hoveredPoint.uniqueClicks || hoveredPoint.clicks)} unique{(hoveredPoint.uniqueClicks || hoveredPoint.clicks) > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Bar Chart Area with Horizontal Guide Lines */}
      <div className="relative h-44 w-full pt-4 pb-2">
        {/* Horizontal Guide Lines */}
        <div className="absolute inset-x-0 top-6 border-b border-[#222226] border-dashed pointer-events-none flex justify-end pr-1 z-0">
          <span className="text-[9px] text-neutral-600 font-mono -mt-3.5">{yAxisMax}</span>
        </div>
        <div className="absolute inset-x-0 top-1/2 border-b border-[#1c1c20] border-dashed pointer-events-none flex justify-end pr-1 z-0">
          <span className="text-[9px] text-neutral-600 font-mono -mt-3.5">{Math.max(1, Math.round(yAxisMax / 2))}</span>
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
                          ? "bg-gradient-to-t from-[#ea580c] to-[#ff771a] shadow-lg shadow-[#ff6600]/50"
                          : "bg-gradient-to-t from-[#d94e00] to-[#ff6600] shadow-sm shadow-[#ff6600]/25")
                      : (isHovered ? "bg-[#2a2a30]" : "bg-[#1c1c20]")
                  )}
                  style={{
                    height: `${heightPercent}%`,
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic X-Axis labels */}
      <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500 pt-2.5 px-0.5 border-t border-[#222225]">
        <span className="truncate max-w-[30%]">{timelineData[0]?.label || ""}</span>
        <span className="truncate max-w-[30%] text-center">{timelineData[Math.floor(timelineData.length / 2)]?.label || ""}</span>
        <span className="text-[#ff6600] font-semibold truncate max-w-[35%] text-right">
          {timelineData[timelineData.length - 1]?.label || "Aujourd'hui"}
        </span>
      </div>
    </div>
  );
}
