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
        <h2 className="text-xl font-bold tracking-tight text-[#131417] dark:text-[#f1f2f4]">
          {isEditMode ? "Ready to save" : "Ready to create"}
        </h2>
        <p className="text-sm text-[#6c717c] dark:text-[#8a8f9a] mt-1">
          Check the summary below, then finalize your short link.
        </p>
      </div>

      {/* Main Link Preview Card */}
      <div className="p-4 rounded-xl bg-[#f4f5f7] dark:bg-[#16181d] border border-[#e6e7ea] dark:border-[#22242a] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#6c717c] dark:text-[#8a8f9a]">
            Primary Short Link
          </span>
          <button
            type="button"
            onClick={() => onNavigateTab("link")}
            className="text-xs font-medium text-[#1d5fe0] dark:text-[#3b82f6] hover:underline cursor-pointer"
          >
            Edit
          </button>
        </div>

        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-[#1d5fe0] dark:text-[#3b82f6] shrink-0" />
          <span className="text-base font-bold font-mono text-[#131417] dark:text-[#f1f2f4] truncate">
            {shortUrl}
          </span>
        </div>

        <div className="flex items-start gap-2 pt-1 border-t border-[#e6e7ea] dark:border-[#22242a] text-xs text-[#6c717c] dark:text-[#8a8f9a]">
          <ExternalLink className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span className="break-all">
            Redirects to:{" "}
            <strong className="text-[#131417] dark:text-[#f1f2f4] font-medium">
              {finalDest}
            </strong>
          </span>
        </div>
      </div>

      {/* Structured Summary Rows (.rv style) */}
      <div className="border border-[#e6e7ea] dark:border-[#22242a] rounded-xl overflow-hidden bg-white dark:bg-[#0e0f12]">
        {/* Row: Social Media */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-[#e6e7ea] dark:border-[#22242a] hover:bg-[#f4f5f7]/50 dark:hover:bg-[#16181d]/50 transition-colors">
          <div className="flex items-center gap-2 text-[#6c717c] dark:text-[#8a8f9a] text-xs font-medium shrink-0">
            <Share2 className="w-3.5 h-3.5" />
            <span>Social media & tracking</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#131417] dark:text-[#f1f2f4] font-medium text-right truncate">
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
              className="text-[#1d5fe0] dark:text-[#3b82f6] hover:underline text-[11px] cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        </div>

        {/* Row: Routing */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-[#e6e7ea] dark:border-[#22242a] hover:bg-[#f4f5f7]/50 dark:hover:bg-[#16181d]/50 transition-colors">
          <div className="flex items-center gap-2 text-[#6c717c] dark:text-[#8a8f9a] text-xs font-medium shrink-0">
            <Globe2 className="w-3.5 h-3.5" />
            <span>Smart Routing</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#131417] dark:text-[#f1f2f4] font-medium text-right">
              {routingRulesCount > 0
                ? `${routingRulesCount} dynamic rule${routingRulesCount > 1 ? "s" : ""} active`
                : "Direct redirect (None)"}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab("routing")}
              className="text-[#1d5fe0] dark:text-[#3b82f6] hover:underline text-[11px] cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        </div>

        {/* Row: Protection & Security */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-[#e6e7ea] dark:border-[#22242a] hover:bg-[#f4f5f7]/50 dark:hover:bg-[#16181d]/50 transition-colors">
          <div className="flex items-center gap-2 text-[#6c717c] dark:text-[#8a8f9a] text-xs font-medium shrink-0">
            <Shield className="w-3.5 h-3.5" />
            <span>Protection & expiry</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#131417] dark:text-[#f1f2f4] font-medium text-right">
              {hasProtection ? (
                <span className="flex items-center gap-1.5 justify-end">
                  {password && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono text-[10px]">
                      Password
                    </span>
                  )}
                  {expiresAt && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px]">
                      Expiry
                    </span>
                  )}
                  {hasClickLimit && maxClicks && (
                    <span className="px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px]">
                      {maxClicks} clicks
                    </span>
                  )}
                  {pathLockMode && pathLockMode !== "off" && (
                    <span className="px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 text-[10px]">
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
              className="text-[#1d5fe0] dark:text-[#3b82f6] hover:underline text-[11px] cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        </div>

        {/* Row: A/B Testing */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-[#e6e7ea] dark:border-[#22242a] hover:bg-[#f4f5f7]/50 dark:hover:bg-[#16181d]/50 transition-colors">
          <div className="flex items-center gap-2 text-[#6c717c] dark:text-[#8a8f9a] text-xs font-medium shrink-0">
            <Split className="w-3.5 h-3.5" />
            <span>A/B Testing</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#131417] dark:text-[#f1f2f4] font-medium text-right">
              {abVariationsCount > 0
                ? `${abVariationsCount + 1} variations (${mainWeight}% / split)`
                : "Disabled (100% to primary)"}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab("ab_testing")}
              className="text-[#1d5fe0] dark:text-[#3b82f6] hover:underline text-[11px] cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        </div>

        {/* Row: Advanced Settings */}
        <div className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-[#f4f5f7]/50 dark:hover:bg-[#16181d]/50 transition-colors">
          <div className="flex items-center gap-2 text-[#6c717c] dark:text-[#8a8f9a] text-xs font-medium shrink-0">
            <Sliders className="w-3.5 h-3.5" />
            <span>Advanced</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#131417] dark:text-[#f1f2f4] font-medium text-right">
              HTTP {redirectType} • {passParams ? "Forward params" : "Strip params"} •{" "}
              {isActive ? "Active" : "Paused"}
            </span>
            <button
              type="button"
              onClick={() => onNavigateTab("advanced")}
              className="text-[#1d5fe0] dark:text-[#3b82f6] hover:underline text-[11px] cursor-pointer shrink-0"
            >
              Change
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation & CTA Button */}
      <div className="p-4 rounded-xl bg-gradient-to-r from-[#1d5fe0]/5 to-transparent dark:from-[#3b82f6]/10 border border-[#1d5fe0]/20 dark:border-[#3b82f6]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs font-bold text-[#131417] dark:text-[#f1f2f4] block">
            Everything looks good?
          </span>
          <span className="text-[11px] text-[#6c717c] dark:text-[#8a8f9a] block">
            Click below to publish your short link with real-time routing.
          </span>
        </div>
        <Button
          type="submit"
          form="link-drawer-form"
          disabled={isSubmitting}
          className="bg-[#1d5fe0] dark:bg-[#3b82f6] hover:bg-[#154fc0] dark:hover:bg-[#2563eb] text-white font-semibold text-xs h-9 px-5 rounded-lg shadow-sm cursor-pointer shrink-0"
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
