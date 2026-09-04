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

  // Generate a clean 14-day daily timeline ending today with real click mapping
  const timelineData = React.useMemo(() => {
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

  const maxClicks = Math.max(...timelineData.map((d) => d.clicks), 5);

  return (
    <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col justify-between h-full relative group">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-bold text-white tracking-wide">{title}</h3>
        <span className="text-xs text-neutral-400 font-medium">{subtitle}</span>
      </div>

      {/* Hover tooltip */}
      {hoveredPoint && (
        <div className="absolute top-14 right-5 bg-[#1f1f23] border border-[#27272a] rounded-[10px] px-3 py-2 text-xs shadow-xl pointer-events-none z-10 animate-in fade-in">
          <p className="text-neutral-400 text-[10px]">{hoveredPoint.label} ({hoveredPoint.date})</p>
          <p className="text-white font-bold text-sm">
            <span className="text-[#ff6600]">{formatNumber(hoveredPoint.clicks)}</span> clic{hoveredPoint.clicks > 1 ? "s" : ""}
          </p>
          <p className="text-neutral-400 text-[11px]">
            {formatNumber(hoveredPoint.uniqueClicks)} unique{hoveredPoint.uniqueClicks > 1 ? "s" : ""}
          </p>
        </div>
      )}

      {/* Bar Chart Area */}
      <div className="h-44 w-full flex items-end justify-between gap-1.5 sm:gap-2 pt-4 pb-2">
        {timelineData.map((point, index) => {
          const hasClicks = point.clicks > 0;
          const heightPercent = hasClicks
            ? Math.max(14, Math.round((point.clicks / maxClicks) * 100))
            : 6;
          const isHovered = hoveredPoint === point;

          return (
            <div
              key={index}
              onMouseEnter={() => setHoveredPoint(point)}
              onMouseLeave={() => setHoveredPoint(null)}
              className="flex-1 max-w-[28px] flex flex-col items-center justify-end h-full group/bar cursor-pointer"
            >
              <div
                className={cn(
                  "w-full rounded-t-[4px] transition-all duration-300 relative",
                  hasClicks
                    ? (isHovered ? "bg-[#ff771a] shadow-lg shadow-[#ff6600]/60" : "bg-[#ff6600] shadow-md shadow-[#ff6600]/30")
                    : (isHovered ? "bg-[#2e2e34]" : "bg-[#1f1f23]")
                )}
                style={{
                  height: `${heightPercent}%`,
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Dynamic X-Axis labels */}
      <div className="flex items-center justify-between text-[11px] font-medium text-neutral-500 pt-2 border-t border-[#222225]">
        <span>{timelineData[0]?.label || "J-14"}</span>
        <span>{timelineData[Math.floor(timelineData.length / 2)]?.label || "J-7"}</span>
        <span className="text-[#ff6600] font-semibold">Aujourd&apos;hui</span>
      </div>
    </div>
  );
}
