"use client";

import React from "react";
import { Smartphone, Monitor, Tablet, Globe2, Compass } from "lucide-react";
import { PREVIEW_ANALYTICS } from "@/lib/preview-data";

export default function PreviewAnalyticsDevicesPage() {
  const devices = PREVIEW_ANALYTICS.topDevices || [];
  const browsers = PREVIEW_ANALYTICS.topBrowsers || [];

  const osList = [
    { name: "macOS", percentage: 42, count: 53965 },
    { name: "Windows 11", percentage: 36, count: 46256 },
    { name: "iOS 18", percentage: 14, count: 17988 },
    { name: "Android 15", percentage: 6, count: 7709 },
    { name: "Linux", percentage: 2, count: 2572 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <span>Devices & Platforms</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#465FFF]/20 text-[#7592FF] border border-[#465FFF]/30 font-mono font-semibold">
            Client Telemetry
          </span>
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Detailed breakdown of operating systems, hardware form-factors, and web browsers.
        </p>
      </div>

      {/* 3-Column: Form Factors, Operating Systems, Browsers */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Form Factors */}
        <div className="p-5 rounded-2xl bg-[#111115] border border-white/10 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Monitor className="w-4 h-4 text-[#7592FF]" />
            <span>Form Factors</span>
          </h3>

          <div className="space-y-3">
            {devices.map((d) => (
              <div key={d.label} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{d.label}</span>
                  <span className="font-mono font-bold text-[#7592FF]">{d.percentage}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-[#465FFF] rounded-full" style={{ width: `${d.percentage}%` }} />
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  {d.count.toLocaleString()} visits
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Operating Systems */}
        <div className="p-5 rounded-2xl bg-[#111115] border border-white/10 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-emerald-400" />
            <span>Operating Systems</span>
          </h3>

          <div className="space-y-3">
            {osList.map((os) => (
              <div key={os.name} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{os.name}</span>
                  <span className="font-mono font-bold text-emerald-400">{os.percentage}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${os.percentage}%` }} />
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  {os.count.toLocaleString()} visits
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Browsers */}
        <div className="p-5 rounded-2xl bg-[#111115] border border-white/10 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Compass className="w-4 h-4 text-amber-400" />
            <span>Web Browsers</span>
          </h3>

          <div className="space-y-3">
            {browsers.map((b) => (
              <div key={b.name} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-white">{b.name}</span>
                  <span className="font-mono font-bold text-amber-400">{b.percentage}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${b.percentage}%` }} />
                </div>
                <div className="text-[11px] text-neutral-400 font-mono">
                  {b.count.toLocaleString()} visits
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
