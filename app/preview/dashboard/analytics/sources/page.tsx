"use client";

import React from "react";
import { Share2, ExternalLink, Globe2, Tag } from "lucide-react";
import { PREVIEW_ANALYTICS } from "@/lib/preview-data";
import { ReferrerLogo } from "@/components/dashboard/analytics/referrer-badge";

export default function PreviewAnalyticsSourcesPage() {
  const referrers = PREVIEW_ANALYTICS.topReferrers || [];

  const utmCampaigns = [
    { campaign: "q4_product_hunt_launch", source: "producthunt.com", medium: "referral", clicks: 32410, revenue: 1420 },
    { campaign: "stripe_partner_newsletter", source: "stripe.com", medium: "email", clicks: 21800, revenue: 980 },
    { campaign: "x_threads_developer_advocacy", source: "x.com", medium: "social", clicks: 18450, revenue: 640 },
    { campaign: "github_readme_badge", source: "github.com", medium: "organic_repo", clicks: 12900, revenue: 410 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
          <span>Traffic Sources & Referrers</span>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#465FFF]/20 text-[#7592FF] border border-[#465FFF]/30 font-mono font-semibold">
            Inbound Telemetry
          </span>
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Track inbound traffic domains, social networks, and UTM marketing campaign parameters.
        </p>
      </div>

      {/* 2-Column: Inbound Referrers & UTM Campaigns */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Referrers */}
        <div className="p-5 rounded-2xl bg-[#111115] border border-white/10 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Globe2 className="w-4 h-4 text-[#7592FF]" />
              <span>Inbound Referrer Domains</span>
            </span>
            <span className="text-xs text-neutral-400 font-mono">Volume & Share</span>
          </h3>

          <div className="space-y-3">
            {referrers.map((r, i) => (
              <div
                key={r.source}
                className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all"
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs text-neutral-500 w-4">{i + 1}</span>
                  <ReferrerLogo referrer={r.source} size={22} />
                  <div>
                    <div className="text-sm font-medium text-white">{r.source}</div>
                    <div className="text-[11px] text-neutral-400">Direct or HTTPS referral</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-sm font-bold text-white font-mono">
                    {r.count.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#7592FF] font-mono">{r.percentage}% share</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* UTM Campaigns */}
        <div className="p-5 rounded-2xl bg-[#111115] border border-white/10 shadow-xl space-y-4">
          <h3 className="text-sm font-semibold text-white flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-emerald-400" />
              <span>UTM Marketing Campaigns</span>
            </span>
            <span className="text-xs text-neutral-400 font-mono">Attributed Revenue</span>
          </h3>

          <div className="space-y-3">
            {utmCampaigns.map((utm) => (
              <div
                key={utm.campaign}
                className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold text-white font-mono">{utm.campaign}</div>
                  <div className="text-sm font-bold text-emerald-400 font-mono">+${utm.revenue}</div>
                </div>
                <div className="flex items-center justify-between text-xs text-neutral-400">
                  <span>Source: {utm.source} ({utm.medium})</span>
                  <span className="font-mono">{utm.clicks.toLocaleString()} clicks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
