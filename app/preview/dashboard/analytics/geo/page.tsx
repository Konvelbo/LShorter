"use client";

import React, { useState } from "react";
import { Globe2, MapPin, Search } from "lucide-react";
import { PREVIEW_ANALYTICS } from "@/lib/preview-data";
import { getCountryFlag } from "@/lib/geo-coordinates";

export default function PreviewAnalyticsGeoPage() {
  const [search, setSearch] = useState("");
  const countries = PREVIEW_ANALYTICS.topCountries || [];
  const cities = PREVIEW_ANALYTICS.topCities || [];

  const filteredCountries = countries.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold ds-text-primary tracking-tight flex items-center gap-2.5">
            <span>Geography & Continents</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#465FFF]/10 text-[#465FFF] dark:text-[#7592FF] border border-[#D1E0FF] dark:border-[#465FFF]/30 font-mono font-semibold">
              Global PoP Network
            </span>
          </h1>
          <p className="text-[13px] ds-text-muted mt-0.5">
            Analyze visitor traffic by country, continent, and city with edge routing telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              placeholder="Search countries..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-1.5 rounded-lg ds-card text-xs ds-text-primary placeholder-neutral-400 focus:outline-none focus:border-[#465FFF]"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl ds-card">
          <div className="text-xs ds-text-muted">Top Country</div>
          <div className="text-2xl font-bold ds-text-primary font-mono mt-1 flex items-center gap-2">
            <span>🇺🇸</span>
            <span>United States</span>
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">38% of total volume (48,200)</div>
        </div>

        <div className="p-4 rounded-xl ds-card">
          <div className="text-xs ds-text-muted">Leading Continent</div>
          <div className="text-2xl font-bold ds-text-primary font-mono mt-1">North America</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">44% global share</div>
        </div>

        <div className="p-4 rounded-xl ds-card">
          <div className="text-xs ds-text-muted">Countries Tracked</div>
          <div className="text-2xl font-bold ds-text-primary font-mono mt-1">68</div>
          <div className="text-[11px] ds-text-muted mt-1">190+ PoPs responding</div>
        </div>

        <div className="p-4 rounded-xl ds-card">
          <div className="text-xs ds-text-muted">Edge Response Time</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">1.8ms</div>
          <div className="text-[11px] ds-text-muted mt-1">Global average latency</div>
        </div>
      </div>

      {/* Continents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-xl ds-card space-y-3">
          <div className="flex items-center justify-between text-sm font-semibold ds-text-primary">
            <span className="flex items-center gap-2">
              <span>🌎</span>
              <span>North America</span>
            </span>
            <span className="font-mono text-[#465FFF] dark:text-[#7592FF]">44%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
            <div className="h-full bg-[#465FFF] rounded-full" style={{ width: "44%" }} />
          </div>
          <div className="text-xs ds-text-muted flex justify-between">
            <span>56,990 clicks</span>
            <span className="text-emerald-600 dark:text-emerald-400">+14% vs last mo</span>
          </div>
        </div>

        <div className="p-5 rounded-xl ds-card space-y-3">
          <div className="flex items-center justify-between text-sm font-semibold ds-text-primary">
            <span className="flex items-center gap-2">
              <span>🌍</span>
              <span>Europe</span>
            </span>
            <span className="font-mono text-emerald-600 dark:text-emerald-400">38%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
            <div className="h-full bg-emerald-500 rounded-full" style={{ width: "38%" }} />
          </div>
          <div className="text-xs ds-text-muted flex justify-between">
            <span>48,820 clicks</span>
            <span className="text-emerald-600 dark:text-emerald-400">+22% vs last mo</span>
          </div>
        </div>

        <div className="p-5 rounded-xl ds-card space-y-3">
          <div className="flex items-center justify-between text-sm font-semibold ds-text-primary">
            <span className="flex items-center gap-2">
              <span>🌏</span>
              <span>Asia & Pacific</span>
            </span>
            <span className="font-mono text-amber-500">18%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full" style={{ width: "18%" }} />
          </div>
          <div className="text-xs ds-text-muted flex justify-between">
            <span>22,680 clicks</span>
            <span className="text-emerald-600 dark:text-emerald-400">+19% vs last mo</span>
          </div>
        </div>
      </div>

      {/* Countries & Cities 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Countries Table */}
        <div className="p-5 rounded-2xl ds-card space-y-4">
          <h3 className="text-sm font-semibold ds-text-primary flex items-center justify-between">
            <span>Top Performing Countries</span>
            <span className="text-xs ds-text-muted font-mono">Clicks & Share</span>
          </h3>

          <div className="space-y-2.5">
            {filteredCountries.map((c, i) => (
              <div
                key={c.code}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-[#E4E7EC] dark:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs ds-text-muted w-4">{i + 1}</span>
                  <span className="text-base">{getCountryFlag(c.code)}</span>
                  <div>
                    <div className="text-sm font-medium ds-text-primary">{c.name}</div>
                    <div className="text-[11px] ds-text-muted font-mono">{c.code}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold ds-text-primary font-mono">
                    {c.count.toLocaleString()}
                  </div>
                  <div className="text-[11px] ds-text-muted font-mono">{c.percentage}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cities Table */}
        <div className="p-5 rounded-2xl ds-card space-y-4">
          <h3 className="text-sm font-semibold ds-text-primary flex items-center justify-between">
            <span>Top Cities by Volume</span>
            <span className="text-xs ds-text-muted font-mono">City Attribution</span>
          </h3>

          <div className="space-y-2.5">
            {cities.map((ci, i) => (
              <div
                key={ci.city}
                className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-[#E4E7EC] dark:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs ds-text-muted w-4">{i + 1}</span>
                  <MapPin className="w-4 h-4 text-[#465FFF]" />
                  <div>
                    <div className="text-sm font-medium ds-text-primary">{ci.city}</div>
                    <div className="text-[11px] ds-text-muted font-mono">{ci.countryCode}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold ds-text-primary font-mono">
                    {ci.count.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    {ci.percentage}% share
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
