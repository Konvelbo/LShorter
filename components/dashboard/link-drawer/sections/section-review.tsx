"use client";

import React from "react";
import {
  Link2,
  ExternalLink,
  Shield,
  Clock,
  MousePointer,
  Share2,
  Globe2,
  Split,
  Sliders,
  Sparkles,
  CheckCircle2,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { DrawerTabId } from "../types";

interface SectionReviewProps {
  isEditMode: boolean;
  domainName: string;
  slug: string;
  targetUrl: string;
  computeFinalUrlWithUtm: () => string;
  // Social
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  twitterCard: "summary_large_image" | "summary";
  // UTM
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  // Protection
  password: string;
  expiresAt: string;
  hasClickLimit: boolean;
  maxClicks: number | string;
  fallbackUrl: string;
  pathLockMode: string;
  pathLockPrefix: string;
  isCloaked: boolean;
  hideReferrer: boolean;
  // Routing
  routingRulesCount: number;
  // A/B Testing
  abVariationsCount: number;
  mainWeight: number;
  // Advanced
  redirectType: string;
  passParams: boolean;
  isActive: boolean;
  tagsInput: string;
  onNavigateTab: (tabId: DrawerTabId) => void;
  isSubmitting: boolean;
  formId?: string;
}

export function SectionReview({
  isEditMode,
  domainName,
  slug,
  targetUrl,
  computeFinalUrlWithUtm,
  ogTitle,
  ogDescription,
  ogImage,
  twitterCard,
  utmSource,
  utmMedium,
  utmCampaign,
  password,
  expiresAt,
  hasClickLimit,
  maxClicks,
  fallbackUrl,
  pathLockMode,
  pathLockPrefix,
  isCloaked,
  hideReferrer,
  routingRulesCount,
  abVariationsCount,
  mainWeight,
  redirectType,
  passParams,
  isActive,
  tagsInput,
  onNavigateTab,
  isSubmitting,
  formId = "link-drawer-form",
}: SectionReviewProps) {
  const shortUrl = `https://${domainName || "lsho.cc"}/${slug || "..."}`;
  const finalDest = computeFinalUrlWithUtm() || targetUrl || "https://...";
  const hasSocial = Boolean(ogTitle || ogDescription || ogImage);
  const hasUtm = Boolean(utmSource || utmMedium || utmCampaign);
  const hasProtection = Boolean(
    password ||
      expiresAt ||
      (hasClickLimit && maxClicks) ||
      (pathLockMode && pathLockMode !== "off") ||
      isCloaked ||
      hideReferrer,
  );

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
          {isEditMode ? "Ready to save" : "Ready to create"}
        </h2>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mt-1">
          Check the summary below, then finalize your short link.
        </p>
      </div>

      {/* Main Link Preview Card */}
      <div className="p-4 rounded-[10px] bg-zinc-50 dark:bg-[#16181d] border border-zinc-200 dark:border-zinc-800 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300">
            Primary Short Link
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab("link")}
            className="text-xs font-semibold text-[#0066FF] dark:text-[#5294FF] hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#0066FF] dark:text-[#5294FF] shrink-0" />
          <span className="text-base font-bold font-mono text-zinc-950 dark:text-white truncate">
            {shortUrl}
          </span>
        </div>

        <div className="flex items-start gap-2 pt-1 border-t border-zinc-200 dark:border-zinc-800 text-xs text-zinc-700 dark:text-zinc-300">
          <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="break-all">
            Redirects to:{" "}
            <strong className="text-zinc-950 dark:text-white font-bold">
              {finalDest}
            </strong>
          </span>
        </div>
      </div>

      {/* Structured Summary Rows (.rv style) */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-[10px] overflow-hidden bg-white dark:bg-[#0e0f12]">
        {/* Row: Social Media */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 text-xs font-semibold shrink-0">
            <Share2 className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#5294FF]" />
            <span>Social media, tracking & pixel</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-950 dark:text-white font-medium text-right truncate">
              {hasSocial && hasUtm
                ? "Custom card & UTM enabled"
                : hasSocial
                  ? `Custom card (${twitterCard === "summary_large_image" ? "Large banner" : "Compact"})`
                  : hasUtm
                    ? `UTM tags (${utmCampaign || utmSource || "active"})`
                    : "Standard preview"}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab("social_tracking")}
              className="text-[#0066FF] dark:text-[#5294FF] hover:underline text-[11px] font-semibold cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        </div>

        {/* Row: Routing */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 text-xs font-semibold shrink-0">
            <Globe2 className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#5294FF]" />
            <span>Smart Routing</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-950 dark:text-white font-medium text-right">
              {routingRulesCount > 0
                ? `${routingRulesCount} dynamic rule${routingRulesCount > 1 ? "s" : ""} active`
                : "Direct redirect (None)"}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab("routing")}
              className="text-[#0066FF] dark:text-[#5294FF] hover:underline text-[11px] font-semibold cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        </div>

        {/* Row: Protection & Security */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 text-xs font-semibold shrink-0">
            <Shield className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#5294FF]" />
            <span>Protection & expiry</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-950 dark:text-white font-medium text-right">
              {hasProtection ? (
                <span className="flex items-center gap-1.5 justify-end">
                  {password && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold">
                      Password
                    </span>
                  )}
                  {expiresAt && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold">
                      Expiry
                    </span>
                  )}
                  {hasClickLimit && maxClicks && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold">
                      {maxClicks} clicks
                    </span>
                  )}
                  {pathLockMode && pathLockMode !== "off" && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px] font-bold">
                      PathLock™
                    </span>
                  )}
                </span>
              ) : (
                "Open access (None)"
              )}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab("protection")}
              className="text-[#0066FF] dark:text-[#5294FF] hover:underline text-[11px] font-semibold cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        </div>

        {/* Row: A/B Testing */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 text-xs font-semibold shrink-0">
            <Split className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#5294FF]" />
            <span>A/B Testing</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-950 dark:text-white font-medium text-right">
              {abVariationsCount > 0
                ? `${abVariationsCount + 1} variations (${mainWeight}% / split)`
                : "Disabled (100% to primary)"}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab("ab_testing")}
              className="text-[#0066FF] dark:text-[#5294FF] hover:underline text-[11px] font-semibold cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        </div>

        {/* Row: Advanced Settings */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors">
          <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200 text-xs font-semibold shrink-0">
            <Sliders className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#5294FF]" />
            <span>Advanced</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-zinc-950 dark:text-white font-medium text-right">
              HTTP {redirectType} • {passParams ? "Forward params" : "Strip params"} •{" "}
              {isActive ? "Active" : "Paused"}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab("advanced")}
              className="text-[#0066FF] dark:text-[#5294FF] hover:underline text-[11px] font-semibold cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation & CTA Button */}
      <div className="p-4 rounded-[10px] bg-gradient-to-r from-[#0066FF]/5 to-transparent dark:from-[#3b82f6]/10 border border-[#0066FF]/20 dark:border-[#3b82f6]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-zinc-950 dark:text-white block">
            Everything looks good?
          </span>
          <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 block">
            Click below to publish your short link with real-time routing.
          </span>
        </div>
        <Button
          type="submit"
          form={formId}
          disabled={isSubmitting}
          className="bg-[#0066FF] hover:bg-[#0055d4] text-white font-bold text-xs h-9 px-5 rounded-lg shadow-sm cursor-pointer shrink-0"
        >
          {isSubmitting ? (
            <span className="flex items-center gap-1.5">Saving...</span>
          ) : (
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{isEditMode ? "Save Changes" : "Create Short Link"}</span>
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
