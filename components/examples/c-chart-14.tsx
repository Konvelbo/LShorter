"use client";

import React, { CSSProperties, useId } from "react";
import { Badge } from "@/components/reui/badge";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { TrendingUp } from "lucide-react";

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export interface ReuiAreaChart14Datum {
  label: string;
  fullDate?: string;
  organic: number;
  paid: number;
  referral?: number;
}

export interface ReuiAreaChart14Props {
  data: ReuiAreaChart14Datum[];
  organicLabel?: string;
  paidLabel?: string;
  referralLabel?: string;
  showReferral?: boolean;
  valuePrefix?: string;
  valueSuffix?: string;
  heightClassName?: string;
  showYAxis?: boolean;
  stacked?: boolean;
}

export function ReuiAreaChart14({
  data,
  organicLabel = "Total Clicks",
  paidLabel = "Unique Visitors",
  referralLabel = "Direct / Referral",
  showReferral = false,
  valuePrefix = "",
  valueSuffix = "",
  heightClassName = "h-[260px] w-full",
  showYAxis = true,
  stacked = false,
}: ReuiAreaChart14Props) {
  const uid = useId().replace(/:/g, "");

  const chartConfig = {
    organic: {
      label: organicLabel,
      theme: {
        light: "#465FFF",
        dark: "#6366F1",
      },
    },
    paid: {
      label: paidLabel,
      theme: {
        light: "#0BA5EC",
        dark: "#38BDF8",
      },
    },
    referral: {
      label: referralLabel,
      theme: {
        light: "#10B981",
        dark: "#34D399",
      },
    },
  } satisfies ChartConfig;

  const normalizedData = (
    Array.isArray(data) && data.length > 0
      ? data
      : [
          { label: "1", organic: 0, paid: 0 },
          { label: "2", organic: 0, paid: 0 },
        ]
  ).map((d) => ({
    ...d,
    organic: Math.max(0, Number(d.organic || 0)),
    paid: Math.max(0, Number(d.paid || 0)),
    referral: Math.max(0, Number(d.referral || 0)),
  }));

  const maxVal = Math.max(
    ...normalizedData.map((d) =>
      stacked
        ? d.organic + d.paid + (showReferral ? d.referral : 0)
        : Math.max(d.organic, d.paid, showReferral ? d.referral : 0),
    ),
    4,
  );

  return (
    <ChartContainer
      config={chartConfig}
      className={`aspect-auto w-full min-h-[220px] ${heightClassName}`}
    >
      <AreaChart
        accessibilityLayer
        data={normalizedData}
        margin={{ top: 18, right: 12, bottom: 6, left: showYAxis ? -14 : 6 }}
      >
        <defs>
          <linearGradient
            id={`chart14-${uid}-organic`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="5%" stopColor="#465FFF" stopOpacity={0.45} />
            <stop offset="95%" stopColor="#465FFF" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient
            id={`chart14-${uid}-paid`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="5%" stopColor="#0BA5EC" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#0BA5EC" stopOpacity={0.04} />
          </linearGradient>
          <linearGradient
            id={`chart14-${uid}-referral`}
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
            <stop offset="95%" stopColor="#10B981" stopOpacity={0.04} />
          </linearGradient>
        </defs>

        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          className="stroke-[#E4E7EC] dark:stroke-gray-800/80"
        />

        {showYAxis && (
          <YAxis
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            allowDecimals={false}
            domain={[0, Math.ceil(maxVal * 1.15)]}
            tick={{ fontSize: 11 }}
          />
        )}

        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
          minTickGap={normalizedData.length > 16 ? 16 : 8}
          tick={{ fontSize: 11 }}
        />

        <ChartTooltip
          content={
            <ChartTooltipContent
              indicator="dot"
              className="min-w-44 gap-2.5 border-[#E4E7EC] dark:border-gray-800 bg-white/95 dark:bg-[#101828]/95 shadow-xl"
              labelFormatter={(value: any, payload: any) => {
                const row = payload?.[0]?.payload as
                  ReuiAreaChart14Datum | undefined;
                return (
                  <div className="border-[#E4E7EC] dark:border-gray-800 mb-1 border-b pb-2">
                    <span className="text-xs font-semibold text-[#101828] dark:text-white">
                      {row?.fullDate || value}
                    </span>
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
                            name === "organic"
                              ? "#465FFF"
                              : name === "paid"
                                ? "#0BA5EC"
                                : "#10B981",
                        } as CSSProperties
                      }
                    />
                    <span className="text-[#667085] dark:text-gray-300 text-xs">
                      {chartConfig[name as keyof typeof chartConfig]?.label ||
                        name}
                    </span>
                  </div>
                  <span className="text-[#101828] dark:text-white font-semibold tabular-nums text-xs">
                    {valuePrefix}
                    {Number(value).toLocaleString()}
                    {valueSuffix}
                  </span>
                </div>
              )}
            />
          }
        />

        {showReferral && (
          <Area
            dataKey="referral"
            type="monotone"
            stackId={stacked ? "1" : undefined}
            fill={`url(#chart14-${uid}-referral)`}
            stroke="#10B981"
            strokeWidth={1.2}
            strokeDasharray="3 3"
          />
        )}

        <Area
          dataKey="paid"
          type="monotone"
          stackId={stacked ? "1" : undefined}
          fill={`url(#chart14-${uid}-paid)`}
          stroke="#0BA5EC"
          strokeWidth={1.5}
          strokeDasharray="3 3"
        />

        <Area
          dataKey="organic"
          type="monotone"
          stackId={stacked ? "1" : undefined}
          fill={`url(#chart14-${uid}-organic)`}
          stroke="#465FFF"
          strokeWidth={2.2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
