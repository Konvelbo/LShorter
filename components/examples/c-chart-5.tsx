"use client";

import React, { CSSProperties, useId } from "react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface ReuiBarChart5Datum {
  label: string;
  fullDate?: string;
  primary: number;
  secondary?: number;
  extraLabel?: string;
}

export interface ReuiBarChart5Props {
  data: ReuiBarChart5Datum[];
  primaryLabel?: string;
  secondaryLabel?: string;
  primaryColorLight?: string;
  primaryColorDark?: string;
  secondaryColorLight?: string;
  secondaryColorDark?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  heightClassName?: string;
  showSecondaryBar?: boolean;
  showYAxis?: boolean;
}

export function ReuiBarChart5({
  data,
  primaryLabel = "Total Clicks",
  secondaryLabel = "Unique Visitors",
  primaryColorLight = "#0066FF",
  primaryColorDark = "#0066FF",
  secondaryColorLight = "#0BA5EC",
  secondaryColorDark = "#38BDF8",
  valuePrefix = "",
  valueSuffix = "",
  heightClassName = "h-[255px] w-full",
  showSecondaryBar = true,
  showYAxis = true,
}: ReuiBarChart5Props) {
  const uid = useId().replace(/:/g, "");
  const gradientPrimary = `bar-grad-primary-${uid}`;
  const gradientSecondary = `bar-grad-secondary-${uid}`;

  const config: ChartConfig = {
    primary: {
      label: primaryLabel,
      theme: {
        light: primaryColorLight,
        dark: primaryColorDark,
      },
    },
    secondary: {
      label: secondaryLabel,
      theme: {
        light: secondaryColorLight,
        dark: secondaryColorDark,
      },
    },
  };

  const normalizedData = (
    Array.isArray(data) && data.length > 0
      ? data
      : [
          { label: "Mon", primary: 0, secondary: 0 },
          { label: "Tue", primary: 0, secondary: 0 },
          { label: "Wed", primary: 0, secondary: 0 },
          { label: "Thu", primary: 0, secondary: 0 },
          { label: "Fri", primary: 0, secondary: 0 },
          { label: "Sat", primary: 0, secondary: 0 },
          { label: "Sun", primary: 0, secondary: 0 },
        ]
  ).map((d) => ({
    ...d,
    primary: Math.max(0, Number(d.primary || 0)),
    secondary: Math.max(
      0,
      Number(d.secondary !== undefined ? d.secondary : d.primary || 0),
    ),
  }));

  const maxDataVal = Math.max(
    ...normalizedData.map((d) => Math.max(d.primary, d.secondary || 0)),
    4,
  );

  const count = normalizedData.length;
  const maxBarSize = count <= 8 ? 36 : count <= 14 ? 24 : count <= 24 ? 16 : 12;
  const barGap = count <= 12 ? 4 : 2;

  return (
    <div className={`w-full ${heightClassName} min-h-[250px]`}>
      {/* BarChart est directement enfant de ChartContainer sans ResponsiveContainer imbriqué */}
      <ChartContainer config={config} className="h-full w-full aspect-auto">
        <BarChart
          accessibilityLayer
          data={normalizedData}
          barGap={barGap}
          margin={{ top: 16, right: 12, bottom: 8, left: showYAxis ? -14 : 8 }}
        >
          <defs>
            <linearGradient id={gradientPrimary} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={primaryColorLight} stopOpacity={1} />
              <stop
                offset="100%"
                stopColor={primaryColorLight}
                stopOpacity={0.7}
              />
            </linearGradient>
            <linearGradient id={gradientSecondary} x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor={secondaryColorLight}
                stopOpacity={0.9}
              />
              <stop
                offset="100%"
                stopColor={secondaryColorLight}
                stopOpacity={0.6}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            vertical={false}
            strokeDasharray="3 3"
            className="stroke-[#E4E7EC] dark:stroke-[#222225]"
          />

          {showYAxis && (
            <YAxis
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              allowDecimals={false}
              domain={[0, Math.ceil(maxDataVal * 1.15)]}
              tick={{ fontSize: 11 }}
              tickFormatter={(v: number) => (valuePrefix ? `${valuePrefix}${v}` : `${v}`)}
            />
          )}

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={10}
            minTickGap={count > 16 ? 16 : 6}
            tick={{ fontSize: 11 }}
          />

          <ChartTooltip
            cursor={{ fill: "rgba(0, 102, 255, 0.08)", radius: 6 }}
            content={
              <ChartTooltipContent
                indicator="dot"
                className="min-w-44 gap-2.5 border-[#E4E7EC] dark:border-[#222225] bg-white/95 dark:bg-[#141416]/95 shadow-xl text-xs"
                labelFormatter={(value: any, payload: any) => {
                  const row = payload?.[0]?.payload as
                    ReuiBarChart5Datum | undefined;
                  return (
                    <div className="border-[#E4E7EC] dark:border-[#222225] mb-1 flex flex-col gap-0.5 border-b pb-2">
                      <span className="text-xs font-semibold text-[#101828] dark:text-[#fafafa]">
                        {row?.fullDate || value}
                      </span>
                      {row?.extraLabel && (
                        <span className="text-[10px] text-[#667085] dark:text-[#a1a1aa]">
                          {row.extraLabel}
                        </span>
                      )}
                    </div>
                  );
                }}
                formatter={(value: any, name: any) => (
                  <div className="flex w-full items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[3px]"
                        style={
                          {
                            backgroundColor:
                              name === "primary"
                                ? primaryColorLight
                                : secondaryColorLight,
                          } as CSSProperties
                        }
                      />
                      <span className="text-[#667085] dark:text-[#a1a1aa] text-xs">
                        {config[name as keyof typeof config]?.label || name}
                      </span>
                    </div>
                    <span className="text-[#101828] dark:text-[#fafafa] font-semibold tabular-nums text-xs">
                      {name === "primary" ? valuePrefix : ""}
                      {Number(value).toLocaleString()}
                      {name === "primary" ? valueSuffix : " sales"}
                    </span>
                  </div>
                )}
              />
            }
          />

          <Bar
            dataKey="primary"
            fill={`url(#${gradientPrimary})`}
            stroke={primaryColorLight}
            strokeWidth={1}
            radius={[6, 6, 2, 2]}
            maxBarSize={maxBarSize}
          />

          {showSecondaryBar && (
            <Bar
              dataKey="secondary"
              fill={`url(#${gradientSecondary})`}
              stroke={secondaryColorLight}
              strokeWidth={1}
              radius={[6, 6, 2, 2]}
              maxBarSize={maxBarSize}
            />
          )}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
