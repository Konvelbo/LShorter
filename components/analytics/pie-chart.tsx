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
    label: "Aucun clic",
    value: 0,
    color: "#ff6600",
    percentage: 0,
    strokeDasharray: "0 400",
    strokeDashoffset: 0,
  };

  return (
    <div className="rounded-[14px] bg-[#141416] border border-[#222225] p-6 flex flex-col justify-between shadow-2xl relative overflow-hidden h-full">
      {/* Top Header with Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#222225]">
        <div>
          <div className="flex items-center gap-2">
            <PieIcon className="w-4 h-4 text-[#ff6600]" />
            <h3 className="text-base font-bold text-white tracking-wide">
              {activeTab === "links" ? "Part de Trafic des Liens Actifs" : "Canaux d'Acquisition de Trafic"}
            </h3>
          </div>
          <p className="text-xs text-neutral-400 mt-0.5">
            Répartition globale du volume de clics sur le mois.
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-[#1a1a1e] border border-[#27272a] rounded-[8px] text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab("links");
              setHoveredSlice(null);
            }}
            className={`px-2.5 py-1 rounded-[6px] font-semibold transition-all cursor-pointer ${
              activeTab === "links"
                ? "bg-[#ff6600] text-white shadow-md font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Par Liens
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("channels");
              setHoveredSlice(null);
            }}
            className={`px-2.5 py-1 rounded-[6px] font-semibold transition-all cursor-pointer ${
              activeTab === "channels"
                ? "bg-[#ff6600] text-white shadow-md font-bold"
                : "text-neutral-400 hover:text-white"
            }`}
          >
            Par Canaux
          </button>
        </div>
      </div>

      {currentData.length === 0 || totalValue === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-dashed border-[#27272a] flex items-center justify-center text-neutral-500">
            <PieIcon className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-neutral-300">Aucune donnée de répartition disponible</p>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              Les clics enregistrés sur vos liens apparaîtront automatiquement dans ce graphique.
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
                  stroke="#1a1a1e"
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
                <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  Total
                </span>
                <span className="font-bebas text-2xl font-black text-white leading-none mt-0.5">
                  {formatNumber(totalValue)}
                </span>
                <span className="text-[9px] text-[#ff6600] font-semibold mt-0.5">
                  clics
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
                      ? "bg-white/[0.04] border-white/20 shadow-lg scale-[1.02]"
                      : "bg-[#18181b]/50 border-transparent hover:bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: slice.color }}
                    />
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-white truncate">
                        {slice.label}
                      </span>
                      {slice.sublabel && (
                        <span className="text-[10px] text-neutral-400 truncate">
                          {slice.sublabel}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-mono text-xs font-semibold text-neutral-300">
                      {formatNumber(slice.value)}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-[6px] text-[10px] font-extrabold font-mono"
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
      <div className="pt-3 border-t border-[#222225] flex items-center justify-between text-[11px] text-neutral-500">
        <span>Routage Edge temps réel</span>
        <span className="font-mono text-neutral-400">
          {activeHovered ? `${activeHovered.label} (${activeHovered.percentage}%)` : ""}
        </span>
      </div>
    </div>
  );
}
