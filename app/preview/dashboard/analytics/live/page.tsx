"use client";

import React, { useState, useEffect } from "react";
import { Radio, Zap } from "lucide-react";
import { GeoLogsReuiDataGrid } from "@/components/dashboard/reui-data-grids";
import { PREVIEW_ANALYTICS } from "@/lib/preview-data";
import { LiveClickEvent } from "@/types";

export default function PreviewAnalyticsLivePage() {
  const [events] = useState<LiveClickEvent[]>(PREVIEW_ANALYTICS.liveClickEvents || []);
  const [rate, setRate] = useState(38);

  useEffect(() => {
    const timer = setInterval(() => {
      setRate((r) => Math.max(28, Math.min(55, r + Math.floor(Math.random() * 7 - 3))));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold ds-text-primary tracking-tight flex items-center gap-2.5">
            <span>Live Click Stream</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-mono font-semibold flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Real-Time WebSocket Active
            </span>
          </h1>
          <p className="text-[13px] ds-text-muted mt-0.5">
            Sub-millisecond global click stream routed via Cloudflare Workers & D1 Edge network.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl ds-card flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="text-xs font-mono ds-text-primary font-bold">{rate} clicks/sec</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl ds-card">
          <div className="text-xs ds-text-muted">Stream Status</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">
            Connected
          </div>
          <div className="text-[11px] ds-text-muted mt-1">Cloudflare Global Edge</div>
        </div>

        <div className="p-4 rounded-xl ds-card">
          <div className="text-xs ds-text-muted">Edge PoP Latency</div>
          <div className="text-2xl font-bold ds-text-primary font-mono mt-1">1.8ms</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">P99 routing latency</div>
        </div>

        <div className="p-4 rounded-xl ds-card">
          <div className="text-xs ds-text-muted">Buffer Size</div>
          <div className="text-2xl font-bold ds-text-primary font-mono mt-1">500 Events</div>
          <div className="text-[11px] ds-text-muted mt-1">In-memory circular buffer</div>
        </div>

        <div className="p-4 rounded-xl ds-card">
          <div className="text-xs ds-text-muted">Data Masking</div>
          <div className="text-2xl font-bold text-[#465FFF] dark:text-[#7592FF] font-mono mt-1">GDPR PII Shield</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Client IP /24 masked</div>
        </div>
      </div>

      {/* Real-time Grid */}
      <div className="p-5 rounded-2xl ds-card space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold ds-text-primary flex items-center gap-2">
            <Radio className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span>Incoming Click Stream (Live Feed)</span>
          </h3>
          <span className="text-xs font-mono ds-text-muted">Auto-refresh: 1s</span>
        </div>

        <GeoLogsReuiDataGrid logs={events} analytics={PREVIEW_ANALYTICS} />
      </div>
    </div>
  );
}
