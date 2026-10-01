"use client";

import React from "react";
import { DollarSign, TrendingUp, CreditCard, ShoppingBag, ArrowUpRight, CheckCircle2 } from "lucide-react";
import { PREVIEW_LINKS } from "@/lib/preview-data";

export default function PreviewAnalyticsRevenuePage() {
  const linksWithRev = PREVIEW_LINKS.filter((l) => (l.revenue || 0) > 0);

  const transactions = [
    { id: "tx-1", slug: "stripe-billing-q4", amount: 140.0, customer: "enterprise@acme.com", time: "12m ago" },
    { id: "tx-2", slug: "linear-roadmap-26", amount: 89.0, customer: "dev@startup.io", time: "34m ago" },
    { id: "tx-3", slug: "stripe-billing-q4", amount: 240.0, customer: "billing@fintech.fr", time: "1h ago" },
    { id: "tx-4", slug: "vercel-edge-sdk", amount: 49.0, customer: "team@scale.de", time: "2h ago" },
    { id: "tx-5", slug: "summation-deck", amount: 310.0, customer: "partner@fund.vc", time: "4h ago" },
  ];

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[22px] font-bold ds-text-primary tracking-tight flex items-center gap-2.5">
            <span>Customers & Revenue</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-mono font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Stripe Webhook Verified
            </span>
          </h1>
          <p className="text-[13px] ds-text-muted mt-0.5">
            End-to-end attribution: map link clicks to Stripe payments, checkouts, and customer signups.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono ds-text-muted ds-card px-3 py-1.5 rounded-lg">
            Currency: USD ($)
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl ds-card">
          <div className="text-xs ds-text-muted">Total Tracked Revenue</div>
          <div className="text-2xl font-bold text-[#465FFF] dark:text-[#7592FF] font-mono mt-1">$3,971.50</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>+24.8% vs last month</span>
          </div>
        </div>

        <div className="p-4 rounded-xl ds-card">
          <div className="text-xs ds-text-muted">Earnings Per Click (EPC)</div>
          <div className="text-2xl font-bold ds-text-primary font-mono mt-1">$0.031</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">High conversion yield</div>
        </div>

        <div className="p-4 rounded-xl ds-card">
          <div className="text-xs ds-text-muted">Stripe Checkouts</div>
          <div className="text-2xl font-bold ds-text-primary font-mono mt-1">38 sales</div>
          <div className="text-[11px] ds-text-muted mt-1">Avg checkout: $104.51</div>
        </div>

        <div className="p-4 rounded-xl ds-card">
          <div className="text-xs ds-text-muted">Conversion Rate</div>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-1">2.8%</div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">Above SaaS benchmark</div>
        </div>
      </div>

      {/* 2-Column: Revenue by Link & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Link Attribution */}
        <div className="p-5 rounded-2xl ds-card space-y-4">
          <h3 className="text-sm font-semibold ds-text-primary flex items-center justify-between">
            <span>Revenue Attribution by Link</span>
            <span className="text-xs ds-text-muted font-mono">Top Earners</span>
          </h3>

          <div className="space-y-2.5">
            {linksWithRev.map((link) => (
              <div
                key={link.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-[#E4E7EC] dark:border-white/5"
              >
                <div>
                  <div className="text-sm font-semibold ds-text-primary font-mono">
                    /{link.slug}
                  </div>
                  <div className="text-xs ds-text-muted mt-0.5">
                    {link.conversionsCount} sales • {(link.clicksCount || 0).toLocaleString()} clicks
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-base font-bold text-[#465FFF] dark:text-[#7592FF] font-mono">
                    ${link.revenue?.toFixed(2)}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                    EPC: ${( (link.revenue || 0) / (link.clicksCount || 1) ).toFixed(3)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Live Transactions */}
        <div className="p-5 rounded-2xl ds-card space-y-4">
          <h3 className="text-sm font-semibold ds-text-primary flex items-center justify-between">
            <span>Recent Attributed Checkouts</span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Stripe Feed
            </span>
          </h3>

          <div className="space-y-2.5">
            {transactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-50 dark:bg-white/[0.02] border border-[#E4E7EC] dark:border-white/5"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs border border-emerald-500/20">
                    $
                  </div>
                  <div>
                    <div className="text-sm font-medium ds-text-primary">{tx.customer}</div>
                    <div className="text-[11px] ds-text-muted font-mono">
                      Via /{tx.slug} • {tx.time}
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                  +${tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
