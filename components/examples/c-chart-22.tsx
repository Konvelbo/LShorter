"use client";

import React, { CSSProperties, useState } from "react";
import { Label, Pie, PieChart, Sector, Cell } from "recharts";
import type { PieSectorDataItem } from "recharts";

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const SEGMENT_PALETTE = [
  "#465FFF", // Brand Indigo / Blue
  "#0BA5EC", // Sky Cyan
  "#10B981", // Emerald
  "#8B5CF6", // Violet
  "#F59E0B", // Amber
  "#EC4899", // Pink
];

export interface ReuiDonut22Item {
  key: string;
  label: string;
  sublabel?: string;
  value: number;
  secondaryText?: string;
  color?: string;
}

export interface ReuiDonutChart22Props {
  items: ReuiDonut22Item[];
  centerValueFormatter?: (val: number) => string;
  centerLabel?: string;
  emptyMessage?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  onSelectItem?: (item: ReuiDonut22Item) => void;
}

export function ReuiDonutChart22({
  items,
  centerValueFormatter,
  centerLabel = "Total",
  emptyMessage = "No activity recorded in this period.",
  valuePrefix = "",
  valueSuffix = "",
  onSelectItem,
}: ReuiDonutChart22Props) {
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const validItems = items
    .filter((it) => Number(it.value || 0) > 0)
    .slice(0, 6)
    .map((it, idx) => ({
      ...it,
      key: `seg_${idx}`,
      value: Number(it.value || 0),
      color: it.color || SEGMENT_PALETTE[idx % SEGMENT_PALETTE.length],
    }));

  const totalValue = validItems.reduce((acc, d) => acc + d.value, 0);
  const hasData = totalValue > 0 && validItems.length > 0;

  const chartData = hasData
    ? validItems.map((it) => ({
        segment: it.key,
        name: it.label,
        value: it.value,
        fill: it.color,
      }))
    : [
        {
          segment: "empty",
          name: "No Data",
          value: 1,
          fill: "rgba(152, 162, 179, 0.22)",
        },
      ];

  const chartConfig: ChartConfig = hasData
    ? validItems.reduce(
        (acc, it) => {
          acc[it.key] = {
            label: it.label,
            color: it.color,
          };
          return acc;
        },
        { value: { label: centerLabel } } as ChartConfig
      )
    : {
        value: { label: centerLabel },
        empty: { label: "0 recorded", color: "#98A2B3" },
      };

  const activeItem =
    hasData && validItems[activeIndex] ? validItems[activeIndex] : null;

  const displayedCenterVal = activeItem
    ? centerValueFormatter
      ? centerValueFormatter(activeItem.value)
      : `${valuePrefix}${activeItem.value.toLocaleString()}${valueSuffix}`
    : centerValueFormatter
      ? centerValueFormatter(totalValue)
      : `${valuePrefix}${totalValue.toLocaleString()}${valueSuffix}`;

  const displayedCenterTitle = activeItem
    ? activeItem.label.length > 16
      ? `${activeItem.label.slice(0, 15)}…`
      : activeItem.label
    : centerLabel;

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
      {/* Left 5 Columns: @reui/c-chart-22 Active Segment Donut with Center Label */}
      <div className="md:col-span-5 flex flex-col items-center justify-center">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square w-full max-w-[235px] max-h-[235px]"
        >
          <PieChart accessibilityLayer>
            {hasData && (
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    className="min-w-44 gap-2.5 border-[#E4E7EC] dark:border-gray-800 bg-white/95 dark:bg-[#101828]/95 shadow-xl"
                    formatter={(value: any, name: any) => {
                      const cfg = chartConfig[name as keyof typeof chartConfig];
                      const num = Number(value || 0);
                      const pct =
                        totalValue > 0 ? ((num / totalValue) * 100).toFixed(1) : "0.0";
                      return (
                        <div className="flex w-full items-center justify-between gap-3">
                          <div className="flex items-center gap-1.5">
                            <div
                              className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                              style={
                                {
                                  backgroundColor:
                                    (cfg && "color" in cfg ? cfg.color : undefined) ||
                                    "#465FFF",
                                } as CSSProperties
                              }
                            />
                            <span className="text-[#667085] dark:text-gray-300 text-xs font-medium">
                              {cfg?.label || name}
                            </span>
                          </div>
                          <span className="text-[#101828] dark:text-white font-semibold tabular-nums text-xs">
                            {centerValueFormatter
                              ? centerValueFormatter(num)
                              : `${valuePrefix}${num.toLocaleString()}${valueSuffix}`}{" "}
                            <span className="text-[10px] text-[#667085] dark:text-gray-400">
                              ({pct}%)
                            </span>
                          </span>
                        </div>
                      );
                    }}
                  />
                }
              />
            )}
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="segment"
              innerRadius={60}
              outerRadius={86}
              cornerRadius={6}
              paddingAngle={hasData && validItems.length > 1 ? 3 : 0}
              stroke="transparent"
              strokeWidth={2}
              {...({ activeIndex: hasData ? activeIndex : undefined } as any)}
              onMouseEnter={(_, index) => {
                if (hasData) setActiveIndex(index);
              }}
              activeShape={({
                outerRadius = 0,
                ...props
              }: PieSectorDataItem) => (
                <Sector {...props} outerRadius={outerRadius + 9} />
              )}
            >
              {chartData.map((entry, idx) => (
                <Cell key={`cell-${idx}`} fill={entry.fill} />
              ))}
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text
                        x={viewBox.cx}
                        y={viewBox.cy}
                        textAnchor="middle"
                        dominantBaseline="middle"
                      >
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) - 4}
                          className="fill-[#101828] dark:fill-white text-[20px] font-bold tabular-nums"
                        >
                          {displayedCenterVal}
                        </tspan>
                        <tspan
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 18}
                          className="fill-[#667085] dark:fill-gray-400 text-[11px] font-medium"
                        >
                          {displayedCenterTitle}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </div>

      {/* Right 7 Columns: Interactive Segment Breakdown List */}
      <div className="md:col-span-7 flex flex-col justify-center space-y-2.5">
        {!hasData ? (
          <div className="rounded-xl border border-dashed border-[#E4E7EC] dark:border-gray-800 bg-[#F9FAFB]/60 dark:bg-white/[0.02] p-6 text-center">
            <p className="text-xs font-medium text-[#667085] dark:text-gray-400">
              {emptyMessage}
            </p>
          </div>
        ) : (
          validItems.map((item, idx) => {
            const sharePct =
              totalValue > 0 ? Math.round((item.value / totalValue) * 100) : 0;
            const isHovered = activeIndex === idx;
            return (
              <div
                key={item.key}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => onSelectItem?.(item)}
                className={`group flex flex-col gap-1.5 rounded-xl border p-2.5 transition-all cursor-pointer ${
                  isHovered
                    ? "border-[#465FFF]/40 bg-[#465FFF]/[0.04] dark:bg-[#465FFF]/[0.08] shadow-2xs"
                    : "border-[#E4E7EC]/70 dark:border-gray-800/80 bg-white dark:bg-white/[0.02] hover:border-[#465FFF]/30"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="h-2.5 w-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-xs font-semibold text-[#101828] dark:text-white truncate">
                      {item.label}
                    </span>
                    {item.sublabel && (
                      <span className="text-[11px] text-[#667085] dark:text-gray-400 truncate hidden sm:inline">
                        ({item.sublabel})
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {item.secondaryText && (
                      <span className="text-[11px] text-[#667085] dark:text-gray-400 font-mono">
                        {item.secondaryText}
                      </span>
                    )}
                    <span className="text-xs font-bold text-[#101828] dark:text-white tabular-nums">
                      {centerValueFormatter
                        ? centerValueFormatter(item.value)
                        : `${valuePrefix}${item.value.toLocaleString()}${valueSuffix}`}
                    </span>
                    <span className="inline-flex items-center rounded-md bg-[#F2F4F7] dark:bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-semibold text-[#344054] dark:text-gray-300 tabular-nums">
                      {sharePct}%
                    </span>
                  </div>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#F2F4F7] dark:bg-gray-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.max(sharePct, 4)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export function Pattern() {
  const sampleData: ReuiDonut22Item[] = [
    { key: "free", label: "Free Plan", value: 12800 },
    { key: "starter", label: "Starter Plan", value: 5400 },
    { key: "pro", label: "Pro Plan", value: 3600 },
    { key: "enterprise", label: "Enterprise Plan", value: 1200 },
  ];

  return (
    <div className="w-full rounded-2xl border border-[#E4E7EC] dark:border-gray-800 bg-white dark:bg-white/[0.03] p-5 shadow-xs">
      <ReuiDonutChart22 items={sampleData} centerLabel="Total Users" />
    </div>
  );
}
