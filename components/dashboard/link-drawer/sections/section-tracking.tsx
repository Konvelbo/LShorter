"use client";

import React from "react";
import { Input } from "@/components/ui/input";

interface SectionTrackingProps {
  utmSource: string;
  setUtmSource: (v: string) => void;
  utmMedium: string;
  setUtmMedium: (v: string) => void;
  utmCampaign: string;
  setUtmCampaign: (v: string) => void;
  utmTerm: string;
  setUtmTerm: (v: string) => void;
  utmContent: string;
  setUtmContent: (v: string) => void;
  targetUrl: string;
  computeFinalUrlWithUtm: () => string;
}

export function SectionTracking({
  utmSource,
  setUtmSource,
  utmMedium,
  setUtmMedium,
  utmCampaign,
  setUtmCampaign,
  utmTerm,
  setUtmTerm,
  utmContent,
  setUtmContent,
  targetUrl,
  computeFinalUrlWithUtm,
}: SectionTrackingProps) {
  return (
    <div
      id="drawer-section-tracking"
      className="flex flex-col gap-3 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] p-4 scroll-mt-4 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#222225] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-brand" />
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            TRACKING &amp; UTM
          </h3>
        </div>
        <span className="text-[10px] font-medium text-zinc-500 dark:text-neutral-400">
          Constructeur UTM &amp; Pixels
        </span>
      </div>

      {/* UTM Builder Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300 mb-1">
            UTM Source
          </label>
          <Input
            placeholder="google, newsletter, twitter..."
            value={utmSource}
            onChange={(e) => setUtmSource(e.target.value)}
            className="bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-8.5 rounded-[8px]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300 mb-1">
            UTM Medium
          </label>
          <Input
            placeholder="cpc, banner, email..."
            value={utmMedium}
            onChange={(e) => setUtmMedium(e.target.value)}
            className="bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-8.5 rounded-[8px]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300 mb-1">
            UTM Campaign
          </label>
          <Input
            placeholder="spring_sale, launch_2026..."
            value={utmCampaign}
            onChange={(e) => setUtmCampaign(e.target.value)}
            className="bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-8.5 rounded-[8px]"
          />
        </div>
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300 mb-1">
            UTM Term
          </label>
          <Input
            placeholder="shortener, smart_links..."
            value={utmTerm}
            onChange={(e) => setUtmTerm(e.target.value)}
            className="bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-8.5 rounded-[8px]"
          />
        </div>
      </div>

      {/* UTM Content */}
      <div>
        <label className="block text-[10px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300 mb-1">
          UTM Content (Optionnel)
        </label>
        <Input
          placeholder="logolink, textlink, cta_top..."
          value={utmContent}
          onChange={(e) => setUtmContent(e.target.value)}
          className="bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-8.5 rounded-[8px]"
        />
      </div>

      {/* Live generated target URL */}
      {(utmSource || utmMedium || utmCampaign) && (
        <div className="p-2.5 rounded-[8px] bg-white dark:bg-[#101012] border border-zinc-200 dark:border-[#27272a] text-[10.5px] font-mono text-zinc-800 dark:text-neutral-300 break-all shadow-xs">
          <span className="text-zinc-500 dark:text-neutral-500">Destination finale : </span>
          <span className="text-brand font-semibold">
            {computeFinalUrlWithUtm() || targetUrl}
          </span>
        </div>
      )}
    </div>
  );
}
