"use client";

import React, { useState } from "react";
import {
  Link2,
  Settings,
  ShieldCheck,
  ArrowRight,
  Sparkles,
  Zap,
  Globe2,
  Lock,
  QrCode,
  BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LinkCreateModal } from "./link-create-modal";
import { GlobalAnalytics } from "@/types";
import { formatNumber } from "@/lib/utils";

interface EmptyStateProps {
  onLinkCreated?: () => void;
  analytics?: GlobalAnalytics;
}

export function EmptyState({ onLinkCreated, analytics }: EmptyStateProps) {
  const [urlInput, setUrlInput] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const totalClicks = analytics?.totalClicks ?? 0;
  const uniqueClicks = analytics?.uniqueClicks ?? 0;
  const trackedRevenue = analytics?.trackedRevenue ?? 0;
  const avgCtr = analytics?.avgCtr ?? 0;

  const handleShortenClick = (e: React.FormEvent) => {
    e.preventDefault();
    let cleaned = urlInput.trim();
    if (!cleaned) return;
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = `https://${cleaned}`;
      setUrlInput(cleaned);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* 4 Stats Cards — Real Data Only */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-400">Total Clicks</span>
          <div className="my-2">
            <span className="font-bebas text-4xl font-bold tracking-wide text-[var(--brand-primary-text)]">
              {formatNumber(totalClicks)}
            </span>
          </div>
          <span className="text-xs font-semibold text-neutral-500 flex items-center gap-1">
            {totalClicks > 0 ? `+${totalClicks} clicks` : "Real-time Edge"}
          </span>
        </div>

        {/* Card 2 */}
        <div className="p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-400">Unique Clicks</span>
          <div className="my-2">
            <span className="font-bebas text-4xl font-bold tracking-wide text-white">
              {formatNumber(uniqueClicks)}
            </span>
          </div>
          <span className="text-xs font-semibold text-neutral-500">
            {uniqueClicks > 0 ? `${uniqueClicks} visitors` : "0 visitors"}
          </span>
        </div>

        {/* Card 3 */}
        <div className="p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-400">Tracked Revenue</span>
          <div className="my-2">
            <span className="font-bebas text-4xl font-bold tracking-wide text-white">
              ${trackedRevenue.toFixed(2)}
            </span>
          </div>
          <span className="text-xs font-semibold text-neutral-500">
            Tracked conversions
          </span>
        </div>

        {/* Card 4 */}
        <div className="p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col justify-between">
          <span className="text-xs font-semibold text-neutral-400">Average CTR</span>
          <div className="my-2">
            <span className="font-bebas text-4xl font-bold tracking-wide text-white">
              {avgCtr}%
            </span>
          </div>
          <span className="text-xs font-semibold text-neutral-500">
            Click average
          </span>
        </div>
      </div>

      {/* Big Center Shorten Box */}
      <div className="p-8 md:p-12 rounded-[10px] bg-[#141416] border-2 border-dashed border-[var(--brand-primary-border)] flex flex-col items-center justify-center text-center relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute w-72 h-72 bg-[var(--brand-primary-subtle)] rounded-full blur-3xl pointer-events-none -top-10" />

        {/* Center Icon */}
        <div className="w-16 h-16 rounded-full bg-neutral-100 dark:bg-[#27272a] border border-neutral-200 dark:border-[#3f3f46] flex items-center justify-center mb-5 shadow-xl relative">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 rounded-full bg-[var(--brand-primary)]" />
            <div className="w-5 h-3 rounded-full bg-neutral-900 dark:bg-white" />
          </div>
        </div>

        <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
          Create your first short link
        </h2>
        <p className="text-xs md:text-sm text-neutral-400 max-w-lg mb-8">
          Paste a long URL below and click{" "}
          <span className="text-[var(--brand-primary-text)] font-semibold">SHORTEN</span> to generate your first trackable link.
        </p>

        {/* Shorten Input Form */}
        <form
          onSubmit={handleShortenClick}
          className="w-full max-w-xl flex flex-col sm:flex-row items-center gap-2.5 mb-10"
        >
          <input
            type="url"
            required
            placeholder="https://your-site.com/destination-page..."
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="w-full h-12 rounded-[10px] bg-neutral-50 dark:bg-white border-2 border-neutral-300 dark:border-transparent text-neutral-900 px-4 text-sm placeholder:text-neutral-500 font-medium shadow-sm focus:outline-none focus:border-[var(--input-focus-border)] focus:ring-2 focus:ring-[var(--input-focus-ring)] focus:bg-white transition-all"
          />
          <Button
            type="submit"
            variant="glow"
            className="w-full sm:w-auto h-12 px-8 font-bebas text-xl tracking-wider shrink-0"
          >
            SHORTEN
          </Button>
        </form>

        {/* 3 Steps Timeline */}
        <div className="flex flex-wrap items-center justify-center gap-3 md:gap-6 text-xs text-neutral-600 dark:text-neutral-400">
          <div className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-neutral-100 dark:bg-[#1a1a1e] border border-neutral-300 dark:border-[#27272a] shadow-sm">
            <span className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
              1
            </span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">Copy your URL</span>
          </div>

          <span className="text-neutral-400 dark:text-neutral-600 font-bold select-none">→</span>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-neutral-100 dark:bg-[#1a1a1e] border border-neutral-300 dark:border-[#27272a] shadow-sm">
            <span className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
              2
            </span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">Paste &amp; shorten</span>
          </div>

          <span className="text-neutral-400 dark:text-neutral-600 font-bold select-none">→</span>

          <div className="flex items-center gap-2 px-3.5 py-2 rounded-[10px] bg-neutral-100 dark:bg-[#1a1a1e] border border-neutral-300 dark:border-[#27272a] shadow-sm">
            <span className="w-5 h-5 rounded-full bg-[var(--brand-primary)] text-white font-bold text-[11px] flex items-center justify-center shrink-0">
              3
            </span>
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">Share &amp; analyze</span>
          </div>
        </div>
      </div>

      {/* Bottom Section: OUR FEATURES */}
      <div className="flex flex-col gap-3 pt-2">
        <span className="text-xs font-bold uppercase tracking-widest text-[var(--brand-primary-text)]">
          Our Features
        </span>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Feature Card 1 */}
          <div className="p-6 rounded-[10px] bg-[#141416] border border-[#222225] border-l-4 border-l-[var(--brand-primary)] flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm mb-1">
              <Link2 className="w-4 h-4 text-neutral-400" />
              <span>Links &amp; Targeting</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Branded Links
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Fast Redirects
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Country Targeting
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Link Cloaking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Deep Linking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Campaign Tags
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Device Targeting
              </li>
            </ul>
          </div>

          {/* Feature Card 2 */}
          <div className="p-6 rounded-[10px] bg-[#141416] border border-[#222225] border-l-4 border-l-[var(--brand-primary)] flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm mb-1">
              <Settings className="w-4 h-4 text-neutral-400" />
              <span>Management &amp; Control</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Custom Domains
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> A/B Split Testing
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Referrer Masking
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Link Permissions
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Main Domain Redirect
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> REST API &amp; SDK
              </li>
            </ul>
          </div>

          {/* Feature Card 3 */}
          <div className="p-6 rounded-[10px] bg-[#141416] border border-[#222225] border-l-4 border-l-[var(--brand-primary)] flex flex-col gap-3">
            <div className="flex items-center gap-2 font-bold text-white text-sm mb-1">
              <BarChart3 className="w-4 h-4 text-neutral-400" />
              <span>Analytics &amp; Security</span>
            </div>
            <ul className="flex flex-col gap-2 text-xs text-neutral-300">
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Real-Time Clicks
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Link Expiration
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> PIN Protection
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> UTM Builder
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Dynamic Destination URL
              </li>
              <li className="flex items-center gap-2">
                <span className="text-[var(--brand-primary-text)] font-bold">✓</span> Instant QR Code
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Link Create Modal */}
      <LinkCreateModal
        isOpen={isModalOpen}
        initialUrl={urlInput}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => {
          setUrlInput("");
          if (onLinkCreated) onLinkCreated();
        }}
      />
    </div>
  );
}
