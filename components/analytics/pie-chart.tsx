"use client";

import React, { useState } from "react";
import { PieChart as PieIcon, Link2, Share2, Layers } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export interface PieSlice {
  label: string;
  value: number;
  color: string;
  sublabel?: string;
  percentage?: number;
}

export interface CalculatedPieSlice extends PieSlice {
  percentage: number;
  strokeDasharray: string;
  strokeDashoffset: number;
}

interface AnalyticsPieChartProps {
  topLinksData?: PieSlice[];
  channelsData?: PieSlice[];
}

export function AnalyticsPieChart({
  topLinksData = [],
  channelsData = []
}: AnalyticsPieChartProps) {
  const [activeTab, setActiveTab] = useState<"links" | "channels">("links");
  const [hoveredSlice, setHoveredSlice] = useState<CalculatedPieSlice | null>(null);

  const currentData = activeTab === "links" ? topLinksData : channelsData;
  const totalValue = currentData.reduce((acc, curr) => acc + curr.value, 0);

  // Calculate SVG donut stroke dash arrays
  let cumulativeAngle = 0;
  const radius = 64;
  const circumference = 2 * Math.PI * radius;

  const slicesWithAngles: CalculatedPieSlice[] = currentData.map((slice) => {
    const percentage = totalValue > 0 ? (slice.value / totalValue) * 100 : 0;
    const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
    const strokeDashoffset = -cumulativeAngle;
    cumulativeAngle += (percentage / 100) * circumference;

    return {
      ...slice,
      percentage: Number(percentage.toFixed(1)),
      strokeDasharray,
      strokeDashoffset,
    };
  });

  const activeHovered = hoveredSlice || slicesWithAngles[0] || {
    label: "No clicks",
    value: 0,
    color: "var(--brand-primary)",
    percentage: 0,
    strokeDasharray: "0 400",
    strokeDashoffset: 0,
  };

  return (
    <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-6 flex flex-col justify-between shadow-sm dark:shadow-2xl relative overflow-hidden h-full">
      {/* Top Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-[#222225]">
        <div>
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-brand" />
            <h3 className="text-base font-bold text-zinc-900 dark:text-white tracking-wide">
              {activeTab === "links" ? "Active Links Traffic Share" : "Traffic Acquisition Channels"}
            </h3>
          </div>
          <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
            Overall click volume breakdown for the month.
          </p>
        </div>

        {/* View Switcher */}
        <div className="w-full sm:w-auto grid grid-cols-2 sm:flex sm:items-center gap-1 p-1 bg-zinc-100 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] rounded-[10px] text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("links");
              setHoveredSlice(null);
            }}
            className={`text-center px-3 py-1.5 rounded-[10px] font-semibold transition-all cursor-pointer ${
              activeTab === "links"
                ? "bg-brand text-white shadow-md font-bold"
                : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            By Links
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("channels");
              setHoveredSlice(null);
            }}
            className={`text-center px-3 py-1.5 rounded-[10px] font-semibold transition-all cursor-pointer ${
              activeTab === "channels"
                ? "bg-brand text-white shadow-md font-bold"
                : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
            }`}
          >
            By Channels
          </button>
        </div>
      </div>

      {currentData.length === 0 || totalValue === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-[#1a1a1e] border border-dashed border-zinc-300 dark:border-[#27272a] flex items-center justify-center text-zinc-400 dark:text-neutral-500">
            <PieIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-zinc-900 dark:text-white">No distribution data available</p>
            <p className="text-[11px] text-zinc-500 dark:text-neutral-400 mt-0.5">
              Clicks recorded on your links will appear automatically in this chart.
            </p>
          </div>
        </div>
      ) : (
        /* Middle Body: Donut Chart + Legend Grid */
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center my-4">
          {/* Left: Interactive SVG Donut */}
          <div className="md:col-span-5 flex flex-col items-center justify-center relative">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
                {/* Background Ring */}
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  fill="transparent"
                  className="stroke-zinc-100 dark:stroke-[#1a1a1e]"
                  strokeWidth="20"
                />

                {/* Slices */}
                {slicesWithAngles.map((slice, i) => (
                  <circle
                    key={i}
                    cx="80"
                    cy="80"
                    r={radius}
                    fill="transparent"
                    stroke={slice.color}
                    strokeWidth={hoveredSlice?.label === slice.label ? "26" : "20"}
                    strokeDasharray={slice.strokeDasharray}
                    strokeDashoffset={slice.strokeDashoffset}
                    strokeLinecap="butt"
                    className="transition-all duration-300 cursor-pointer hover:opacity-90"
                    onMouseEnter={() => setHoveredSlice(slice)}
                    onMouseLeave={() => setHoveredSlice(null)}
                  />
                ))}
              </svg>

              {/* Center Metrics Hole */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-neutral-400">
                  Total
                </span>
                <span className="font-bebas text-2xl font-black text-zinc-900 dark:text-white leading-none mt-0.5">
                  {formatNumber(totalValue)}
                </span>
                <span className="text-[9px] text-brand font-semibold mt-0.5">
                  clicks
                </span>
              </div>
            </div>
          </div>

          {/* Right: Legend Breakdown List */}
          <div className="md:col-span-7 flex flex-col gap-2.5">
            {slicesWithAngles.map((slice, idx) => {
              const isHovered = activeHovered.label === slice.label;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredSlice(slice)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  className={`p-2.5 rounded-[10px] border transition-all duration-200 cursor-pointer flex items-center justify-between gap-3 ${
                    isHovered
                      ? "bg-zinc-100 dark:bg-white/[0.04] border-zinc-300 dark:border-white/20 shadow-sm scale-[1.02]"
                      : "bg-zinc-50 dark:bg-[#18181b]/50 border-transparent hover:bg-zinc-100 dark:hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: slice.color }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                        {slice.label}
                      </span>
                      {slice.sublabel && (
                        <span className="text-[10px] text-zinc-500 dark:text-neutral-400 truncate">
                          {slice.sublabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-semibold text-zinc-800 dark:text-neutral-300">
                      {formatNumber(slice.value)}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-[10px] text-[10px] font-extrabold font-mono"
                      style={{
                        backgroundColor: `${slice.color}20`,
                        color: slice.color,
                      }}
                    >
                      {slice.percentage}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom Footer Info */}
      <div className="pt-3 border-t border-zinc-200 dark:border-[#222225] flex items-center justify-between text-[11px] text-zinc-500 dark:text-neutral-400">
        <span>Real-time Edge Routing</span>
        <span className="font-mono text-zinc-700 dark:text-neutral-300">
          {activeHovered ? `${activeHovered.label} (${activeHovered.percentage}%)` : ""}
        </span>
      </div>
    </div>
  );
}
