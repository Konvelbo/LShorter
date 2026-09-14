"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  Link2,
  QrCode,
  BarChart2,
  Globe,
  Plus,
  ArrowUpRight,
  Copy,
  Check,
  RefreshCw,
  TrendingUp,
  Layers,
  Split,
  Lock,
  EyeOff,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface HeroDashboardViewProps {
  isCompact?: boolean;
  onNavigateTab?: (tab: "overview" | "links" | "qr" | "analytics") => void;
}

export function HeroDashboardView({ isCompact = false, onNavigateTab }: HeroDashboardViewProps) {
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  const dailyClicksData = [
    { date: "01 Mar", clicks: 2400 },
    { date: "03 Mar", clicks: 3600 },
    { date: "05 Mar", clicks: 3100 },
    { date: "07 Mar", clicks: 4800 },
    { date: "09 Mar", clicks: 6200 },
    { date: "11 Mar", clicks: 5800 },
    { date: "13 Mar", clicks: 7400 },
    { date: "15 Mar", clicks: 8300 },
    { date: "17 Mar", clicks: 7900 },
    { date: "19 Mar", clicks: 9600 },
    { date: "21 Mar", clicks: 8900 },
    { date: "23 Mar", clicks: 10400 },
    { date: "25 Mar", clicks: 11200 },
    { date: "27 Mar", clicks: 12800 },
  ];
  const maxClicksValue = Math.max(...dailyClicksData.map((d) => d.clicks));

  const handleCopy = (url: string, slug: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      try {
        confetti({ particleCount: 25, spread: 45, origin: { y: 0.75 } });
      } catch {}
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <div className="flex-1 flex overflow-hidden select-none bg-[#FAF7F2]/40 dark:bg-[#0d0d12] text-neutral-800 dark:text-neutral-200">
      {/* ─── 1. Mini Sidebar ─── */}
      <div
        className={`shrink-0 border-r border-[#E7DFD5] dark:border-white/10 bg-[#FAF7F2] dark:bg-[#111116] flex flex-col justify-between ${
          isCompact ? "w-[145px] lg:w-[155px] p-2" : "w-48 lg:w-56 p-3 sm:p-4"
        }`}
      >
        <div className="space-y-2">
          {/* Logo */}
          <div className="flex items-center gap-2 px-1 py-1">
            <span className="w-5 h-5 rounded-md bg-[#ff6600] flex items-center justify-center font-bold text-white text-[10px] shadow-xs">
              LS
            </span>
            <div className="flex flex-col min-w-0">
              <span className="font-bebas text-sm sm:text-base font-bold tracking-wider text-neutral-900 dark:text-white leading-none">
                L <span className="text-[#ff6600]">SHORTER</span>
              </span>
              <span className="text-[7.5px] sm:text-[8.5px] uppercase font-bold tracking-widest text-neutral-500">
                Edge Platform
              </span>
            </div>
          </div>

          {/* Create a Link Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => onNavigateTab?.("links")}
              className={`w-full rounded-md bg-[#ff6600] hover:bg-[#ff771a] text-white font-bold flex items-center justify-center shadow-xs transition-all cursor-pointer ${
                isCompact ? "h-6.5 text-[10px] gap-1 px-1.5" : "h-8.5 text-xs gap-1.5 px-3"
              }`}
            >
              <Plus className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
              <span className="font-bebas tracking-wide truncate">CREATE A LINK</span>
            </button>
          </div>

          {/* Navigation Links */}
          <div className={`space-y-0.5 ${isCompact ? "text-[10px]" : "text-xs"}`}>
            <span className="block px-1.5 text-[8px] font-bold uppercase tracking-widest text-neutral-400 mb-0.5">
              Menu
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab?.("overview")}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-[#ff6600] text-white font-semibold shadow-xs text-left"
            >
              <LayoutDashboard className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
              <span className="truncate">Overview</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab?.("links")}
              className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
            >
              <div className="flex items-center gap-1.5 truncate">
                <Link2 className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
                <span className="truncate">My Links</span>
              </div>
              <span className="text-[8.5px] font-mono px-1 rounded bg-neutral-200 dark:bg-white/10 shrink-0">
                42
              </span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab?.("qr")}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
            >
              <QrCode className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
              <span className="truncate">QR Code</span>
            </button>

            <button
              type="button"
              onClick={() => onNavigateTab?.("analytics")}
              className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
            >
              <BarChart2 className={isCompact ? "w-3 h-3" : "w-3.5 h-3.5"} />
              <span className="truncate">Analytics</span>
            </button>
          </div>
        </div>

        {/* Sidebar Bottom Quota Card */}
        <div className="p-1.5 rounded-md bg-neutral-200/60 dark:bg-white/5 border border-[#E7DFD5] dark:border-white/5 text-[9px]">
          <div className="flex items-center justify-between text-neutral-500 font-mono mb-1">
            <span className="font-bold text-[#ff6600]">PLAN PRO</span>
            <span className="font-bold text-neutral-700 dark:text-neutral-300">128.4K / 1M</span>
          </div>
          <div className="w-full h-1 rounded-full bg-neutral-300 dark:bg-white/10 overflow-hidden">
            <div className="h-full bg-[#ff6600] w-3/4 rounded-full" />
          </div>
          <span className="text-[7.5px] text-neutral-400 block mt-1 font-mono">
            Cloudflare Edge 11ms
          </span>
        </div>
      </div>

      {/* ─── 2. Main Content Viewport ─── */}
      <div className="flex-1 p-2.5 sm:p-4 overflow-y-auto space-y-2.5 sm:space-y-4">
        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Card 1 */}
          <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-[#18181f] border border-[#E7DFD5] dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-neutral-500">
              <span className="font-semibold">Total Clicks</span>
              <span className="text-emerald-500 font-bold">+14.2%</span>
            </div>
            <div className="font-bebas text-lg sm:text-2xl font-bold text-[#ff6600] leading-tight my-0.5">
              128,420
            </div>
            <div className="flex items-center justify-between text-[7.5px] sm:text-[8.5px] text-neutral-400 font-mono">
              <span>71,400 unique</span>
              <span className="text-emerald-500">Real-time Edge</span>
            </div>
          </div>

          {/* Card 2 */}
          <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-[#18181f] border border-[#E7DFD5] dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-neutral-500">
              <span className="font-semibold">Active Links</span>
              <span className="text-emerald-500 font-bold">100%</span>
            </div>
            <div className="font-bebas text-lg sm:text-2xl font-bold text-neutral-900 dark:text-white leading-tight my-0.5">
              42
            </div>
            <div className="flex items-center justify-between text-[7.5px] sm:text-[8.5px] text-neutral-400 font-mono">
              <span>42 active</span>
              <span>Active routing</span>
            </div>
          </div>

          {/* Card 3 */}
          <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-[#18181f] border border-[#E7DFD5] dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-neutral-500">
              <span className="font-semibold">Tracked Revenue</span>
              <span className="text-emerald-500 font-bold">2,400.00 €</span>
            </div>
            <div className="font-bebas text-lg sm:text-2xl font-bold text-neutral-900 dark:text-white leading-tight my-0.5">
              2,400.00 €
            </div>
            <div className="flex items-center justify-between text-[7.5px] sm:text-[8.5px] text-neutral-400 font-mono">
              <span>EPC: 0.19 €</span>
              <span>Conversions</span>
            </div>
          </div>

          {/* Card 4 */}
          <div className="p-2 sm:p-2.5 rounded-lg bg-white dark:bg-[#18181f] border border-[#E7DFD5] dark:border-white/10 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-neutral-500">
              <span className="font-semibold">Conversion Rate</span>
              <span className="text-emerald-500 font-bold">3.47%</span>
            </div>
            <div className="font-bebas text-lg sm:text-2xl font-bold text-emerald-500 leading-tight my-0.5">
              3.47%
            </div>
            <div className="flex items-center justify-between text-[7.5px] sm:text-[8.5px] text-neutral-400 font-mono">
              <span>4,360 conversions</span>
              <span>Optimum &gt; 2%</span>
            </div>
          </div>
        </div>

        {/* Middle Row: 30-Day Click Histogram + Top Countries */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3 items-stretch">
          {/* Left: 30-Day Histogram Bar Chart */}
          <div className="lg:col-span-7 p-2.5 sm:p-3 rounded-lg bg-white dark:bg-[#18181f] border border-[#E7DFD5] dark:border-white/10 flex flex-col justify-between shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div>
                <h4 className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white">
                  Click Evolution (30 days)
                </h4>
                <span className="text-[8.5px] text-neutral-400">All links combined</span>
              </div>
              <span className="text-[9px] font-mono font-bold text-[#ff6600] bg-[#ff6600]/10 px-1.5 py-0.5 rounded">
                128.4K clicks
              </span>
            </div>

            {/* Dynamic Bars */}
            <div className="h-24 sm:h-28 w-full flex items-end justify-between gap-1 pt-2 pb-1 relative">
              {dailyClicksData.map((d, idx) => {
                const heightPct = Math.round((d.clicks / maxClicksValue) * 100);
                const isHovered = hoveredBarIndex === idx;
                return (
                  <div
                    key={d.date}
                    onMouseEnter={() => setHoveredBarIndex(idx)}
                    onMouseLeave={() => setHoveredBarIndex(null)}
                    className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                  >
                    {isHovered && (
                      <div className="absolute -top-6 px-1.5 py-0.5 bg-neutral-900 text-white rounded text-[8.5px] font-mono whitespace-nowrap shadow-lg z-20 pointer-events-none">
                        {d.clicks.toLocaleString()}
                      </div>
                    )}
                    <div
                      style={{ height: `${heightPct}%` }}
                      className={`w-full rounded-t-xs transition-all duration-150 ${
                        isHovered ? "bg-[#ff6600]" : "bg-[#ff6600]/85 group-hover:bg-[#ff6600]"
                      }`}
                    />
                    <span className="text-[7px] font-mono text-neutral-400 mt-0.5 truncate">
                      {d.date.split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-1.5 border-t border-[#E7DFD5] dark:border-white/5 flex items-center justify-between text-[8px] font-mono text-neutral-400">
              <span>Timeframe: 30 days</span>
              <span>Average: 4,280 clicks/day</span>
            </div>
          </div>

          {/* Right: Top Countries */}
          <div className="lg:col-span-5 p-2.5 sm:p-3 rounded-lg bg-white dark:bg-[#18181f] border border-[#E7DFD5] dark:border-white/10 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white">
                  Top Countries
                </h4>
                <span className="text-[9px] text-[#ff6600] font-semibold">Details &gt;</span>
              </div>

              <div className="space-y-1.5">
                {[
                  { code: "FR", name: "France", count: "52,400", pct: "40.8%" },
                  { code: "US", name: "United States", count: "34,180", pct: "26.5%" },
                  { code: "BF", name: "Burkina Faso", count: "18,900", pct: "14.7%" },
                  { code: "DE", name: "Germany", count: "12,100", pct: "9.4%" },
                  { code: "CA", name: "Canada", count: "10,520", pct: "8.6%" },
                ].map((c) => (
                  <div key={c.code} className="flex items-center justify-between text-[9px] sm:text-[10px]">
                    <div className="flex items-center gap-1.5 truncate">
                      <span className="font-mono font-bold text-[#ff6600] w-4">{c.code}</span>
                      <span className="truncate text-neutral-700 dark:text-neutral-300">{c.name}</span>
                    </div>
                    <span className="font-mono text-neutral-500 shrink-0">
                      {c.count} ({c.pct})
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-1.5 border-t border-[#E7DFD5] dark:border-white/5 flex items-center justify-between text-[8px] font-mono text-neutral-400 mt-2">
              <span>84 recorded countries</span>
              <span>Edge Cloudflare</span>
            </div>
          </div>
        </div>

        {/* Bottom: Recent Links Table */}
        <div className="p-2.5 sm:p-3 rounded-lg bg-white dark:bg-[#18181f] border border-[#E7DFD5] dark:border-white/10 shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-[11px] sm:text-xs font-bold text-neutral-900 dark:text-white">
                Recent Links
              </h4>
              <p className="text-[8px] sm:text-[9px] text-neutral-400">Your latest created redirects</p>
            </div>
            <button
              type="button"
              onClick={() => onNavigateTab?.("links")}
              className="text-[9px] sm:text-[10px] text-[#ff6600] hover:underline font-semibold flex items-center gap-0.5 cursor-pointer"
            >
              <span>View all links</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[9px] sm:text-[10.5px]">
              <thead>
                <tr className="border-b border-[#E7DFD5] dark:border-white/5 text-[7.5px] sm:text-[8.5px] uppercase font-mono text-neutral-500">
                  <th className="pb-1.5 pl-1">Link &amp; Target</th>
                  <th className="pb-1.5">Short URL</th>
                  <th className="pb-1.5 text-center">Options</th>
                  <th className="pb-1.5 text-right pr-2">Clicks</th>
                  <th className="pb-1.5">Status</th>
                  <th className="pb-1.5 text-right pr-1">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7DFD5]/50 dark:divide-white/5">
                {/* Link 1 */}
                <tr className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-1.5 pl-1 max-w-[130px] truncate">
                    <span className="font-bold text-neutral-900 dark:text-white block truncate">
                      /launch-pro-2026
                    </span>
                    <span className="text-[7.5px] font-mono text-neutral-400 truncate block">
                      mon-entreprise.com/offre-speciale-q3
                    </span>
                  </td>
                  <td className="py-1.5 font-mono text-[#ff6600] font-semibold truncate max-w-[120px]">
                    https://lsho.cc/launch-pro-2026
                  </td>
                  <td className="py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-neutral-400">
                      <span title="A/B Routing"><Split className="w-2.5 h-2.5 text-[#ff6600]" /></span>
                      <span title="Geo Routing"><Globe className="w-2.5 h-2.5 text-emerald-500" /></span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right pr-2 font-mono font-bold text-neutral-900 dark:text-white">
                    84,200
                  </td>
                  <td className="py-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[7.5px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                  <td className="py-1.5 text-right pr-1">
                    <button
                      type="button"
                      onClick={() => handleCopy("https://lsho.cc/launch-pro-2026", "link-1")}
                      className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/10 hover:bg-[#ff6600] hover:text-white text-[8px] font-bold transition-colors cursor-pointer"
                    >
                      {copiedSlug === "link-1" ? "Copied" : "Copy"}
                    </button>
                  </td>
                </tr>

                {/* Link 2 */}
                <tr className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-1.5 pl-1 max-w-[130px] truncate">
                    <span className="font-bold text-neutral-900 dark:text-white block truncate">
                      /ebook-conversion
                    </span>
                    <span className="text-[7.5px] font-mono text-neutral-400 truncate block">
                      ressources.io/growth-mastery-v2.pdf
                    </span>
                  </td>
                  <td className="py-1.5 font-mono text-[#ff6600] font-semibold truncate max-w-[120px]">
                    https://lsho.cc/ebook-conversion
                  </td>
                  <td className="py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-neutral-400">
                      <span title="QR Code"><QrCode className="w-2.5 h-2.5 text-cyan-500" /></span>
                      <span title="Cloaking"><EyeOff className="w-2.5 h-2.5 text-purple-400" /></span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right pr-2 font-mono font-bold text-neutral-900 dark:text-white">
                    31,200
                  </td>
                  <td className="py-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[7.5px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                  <td className="py-1.5 text-right pr-1">
                    <button
                      type="button"
                      onClick={() => handleCopy("https://lsho.cc/ebook-conversion", "link-2")}
                      className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/10 hover:bg-[#ff6600] hover:text-white text-[8px] font-bold transition-colors cursor-pointer"
                    >
                      {copiedSlug === "link-2" ? "Copied" : "Copy"}
                    </button>
                  </td>
                </tr>

                {/* Link 3 */}
                <tr className="hover:bg-neutral-50 dark:hover:bg-white/5 transition-colors">
                  <td className="py-1.5 pl-1 max-w-[130px] truncate">
                    <span className="font-bold text-neutral-900 dark:text-white block truncate">
                      /direction-finance
                    </span>
                    <span className="text-[7.5px] font-mono text-neutral-400 truncate block">
                      drive.corporate.com/bilan-confidentiel-q3
                    </span>
                  </td>
                  <td className="py-1.5 font-mono text-[#ff6600] font-semibold truncate max-w-[120px]">
                    https://lsho.cc/direction-finance
                  </td>
                  <td className="py-1.5 text-center">
                    <div className="flex items-center justify-center gap-1 text-neutral-400">
                      <span title="PIN Protected"><Lock className="w-2.5 h-2.5 text-amber-500" /></span>
                    </div>
                  </td>
                  <td className="py-1.5 text-right pr-2 font-mono font-bold text-neutral-900 dark:text-white">
                    13,020
                  </td>
                  <td className="py-1.5">
                    <span className="px-1.5 py-0.2 rounded text-[7.5px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                  <td className="py-1.5 text-right pr-1">
                    <button
                      type="button"
                      onClick={() => handleCopy("https://lsho.cc/direction-finance", "link-3")}
                      className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/10 hover:bg-[#ff6600] hover:text-white text-[8px] font-bold transition-colors cursor-pointer"
                    >
                      {copiedSlug === "link-3" ? "Copied" : "Copy"}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
