import React from "react";
import { cn } from "@/lib/utils";

/**
 * Base Shimmer Skeleton - Adaptable Dark & Light Mode
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[10px] bg-white/[0.08] dark:bg-white/[0.08] border border-white/[0.03] max-w-full",
        className
      )}
      {...props}
    />
  );
}

/**
 * Stat Card Skeleton (KPI Metric)
 */
export function StatCardSkeleton() {
  return (
    <div className="rounded-2xl bg-[#141416] border border-[#222225] p-4 sm:p-5 flex flex-col justify-between gap-3 h-32 sm:h-36 shadow-sm">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-20 sm:w-24 bg-white/10" />
        <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-xl bg-white/10 shrink-0" />
      </div>
      <Skeleton className="h-8 sm:h-10 w-24 sm:w-32 bg-white/15" />
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-16 sm:w-20 bg-white/5" />
        <Skeleton className="h-3 w-20 sm:w-24 bg-white/5" />
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton (for Links and Analytics Tables)
 */
export function TableRowSkeleton() {
  return (
    <>
      {/* Mobile Card Skeleton (< 768px) */}
      <div className="md:hidden p-3.5 border-b border-[#222225] flex flex-col gap-2.5 animate-pulse bg-[#141416]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Skeleton className="w-2.5 h-2.5 rounded-full shrink-0 bg-white/20" />
            <Skeleton className="h-4 w-28 sm:w-36 bg-white/15 font-mono" />
          </div>
          <Skeleton className="h-5 w-16 rounded-[8px] bg-white/10 shrink-0" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3 w-3 rounded-full bg-brand-subtle shrink-0" />
          <Skeleton className="h-3 w-48 sm:w-64 max-w-[80%] bg-white/10" />
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-[#1e1e22]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-14 bg-white/10" />
            <Skeleton className="h-3 w-12 bg-white/5" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-14 rounded-[8px] bg-white/10" />
            <Skeleton className="h-6 w-6 rounded-[8px] bg-white/10" />
            <Skeleton className="h-6 w-6 rounded-[8px] bg-white/10" />
          </div>
        </div>
      </div>

      {/* Desktop Table Row Skeleton (>= 768px) */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-[#222225] animate-pulse">
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
          <Skeleton className="h-8 w-8 rounded-xl bg-white/10 shrink-0" />
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <Skeleton className="h-4 w-36 bg-white/15" />
            <Skeleton className="h-3 w-56 max-w-full bg-white/10" />
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Skeleton className="h-4 w-16 bg-white/10 font-mono" />
          <Skeleton className="h-6 w-20 rounded-xl bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-7 rounded-lg bg-white/10" />
            <Skeleton className="h-7 w-7 rounded-lg bg-white/10" />
            <Skeleton className="h-7 w-7 rounded-lg bg-white/10" />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * 1. Dashboard Overview Page Skeleton
 */
export function DashboardOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Banner Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 sm:h-8 w-44 sm:w-52 bg-white/15" />
          <Skeleton className="h-3.5 sm:h-4 w-72 sm:w-96 max-w-full bg-white/10" />
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Skeleton className="h-10 w-28 rounded-xl bg-white/10 hidden sm:block" />
          <Skeleton className="h-10 w-full sm:w-36 rounded-xl bg-brand-subtle shrink-0" />
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Middle Grid: Clics par jour (Bar chart) + Top Pays */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 rounded-2xl bg-[#141416] border border-[#222225] p-4 sm:p-6 flex flex-col justify-between h-64 sm:h-72">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28 sm:w-36 bg-white/15" />
            <Skeleton className="h-4 w-20 sm:w-28 bg-white/10" />
          </div>
          <div className="flex items-end gap-1.5 sm:gap-3 h-36 sm:h-44 pt-4 overflow-hidden">
            {[40, 65, 30, 80, 50, 90, 70, 45, 60, 85, 40, 75].map((h, idx) => (
              <div
                key={idx}
                className="flex-1 bg-white/10 rounded-t-lg"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-2xl bg-[#141416] border border-[#222225] p-4 sm:p-5 flex flex-col gap-4 h-auto sm:h-72 justify-between">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24 bg-white/15" />
            <Skeleton className="h-4 w-14 bg-white/10" />
          </div>
          <div className="flex flex-col gap-3 sm:gap-3.5">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20 sm:w-28 bg-white/15" />
                  <Skeleton className="h-3 w-10 sm:w-12 bg-white/15" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-full bg-white/10" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Links Container Skeleton */}
      <div className="rounded-2xl bg-[#141416] border border-[#222225] p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-28 sm:w-32 bg-white/15" />
            <Skeleton className="h-3 w-36 sm:w-44 bg-white/10" />
          </div>
          <Skeleton className="h-4 w-24 bg-white/10" />
        </div>

        {/* Desktop View: Table Rows */}
        <div className="flex flex-col divide-y divide-[#1e1e22]">
          {[1, 2, 3].map((r) => (
            <div key={r} className="flex items-center justify-between py-3.5">
              <div className="flex flex-col gap-1.5 min-w-0 flex-1 pr-4">
                <Skeleton className="h-4 w-28 bg-white/15" />
                <Skeleton className="h-3 w-56 max-w-full bg-white/10" />
              </div>
              <Skeleton className="h-4 w-44 bg-white/10 font-mono hidden md:block" />
              <Skeleton className="h-4 w-12 bg-white/15 font-mono text-right" />
              <Skeleton className="h-5 w-16 rounded-xl bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Link Card Item Skeleton (Matches My Links modern card design)
 */
export function LinkCardSkeleton() {
  return (
    <div className="flex items-center justify-between gap-2.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#131418] border border-neutral-200 dark:border-[#202228] border-r-4 border-r-rose-500/50 shadow-sm relative w-full animate-pulse">
      {/* Left side: Grip + Thumbnail + Info */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        {/* Grip Handle */}
        <Skeleton className="hidden sm:block w-4 h-6 rounded bg-neutral-200 dark:bg-white/10 shrink-0" />

        {/* Thumbnail with Status Dot */}
        <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl shrink-0 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/5">
          <Skeleton className="w-full h-full rounded-xl bg-neutral-200 dark:bg-white/10" />
          <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white dark:border-[#131418] bg-emerald-500/40 absolute -bottom-1 -right-1" />
        </div>

        {/* Text Information */}
        <div className="min-w-0 space-y-1.5 flex-1 max-w-md">
          <Skeleton className="h-4 sm:h-5 w-28 sm:w-40 rounded-md bg-neutral-200 dark:bg-white/15" />
          <Skeleton className="h-3 w-24 sm:w-32 rounded bg-neutral-100 dark:bg-white/10" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-2.5 w-2.5 rounded-full bg-brand/30 shrink-0" />
            <Skeleton className="h-3 w-40 sm:w-64 max-w-[85%] rounded bg-neutral-100 dark:bg-white/10" />
          </div>
        </div>
      </div>

      {/* Right side: Click Counter + Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-5 sm:h-6 w-10 sm:w-14 rounded-md bg-neutral-200 dark:bg-white/15" />
          <Skeleton className="h-2.5 w-8 rounded bg-neutral-100 dark:bg-white/10" />
        </div>

        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-8 rounded-xl bg-neutral-100 dark:bg-white/10" />
          <Skeleton className="h-8 w-8 rounded-xl bg-neutral-100 dark:bg-white/10" />
          <Skeleton className="h-8 w-8 rounded-xl bg-neutral-100 dark:bg-white/10" />
        </div>
      </div>
    </div>
  );
}

/**
 * 2. Links Page Skeleton
 */
export function LinksPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-44 sm:w-52 rounded-lg bg-neutral-200 dark:bg-white/15" />
          <Skeleton className="h-3.5 sm:h-4 w-64 sm:w-80 max-w-full rounded bg-neutral-100 dark:bg-white/10" />
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Skeleton className="h-10 w-24 rounded-[10px] bg-neutral-100 dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] hidden sm:block" />
          <Skeleton className="h-10 w-full sm:w-36 rounded-[10px] bg-brand/20 border border-brand/40 shrink-0" />
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        <Skeleton className="h-10 w-full flex-1 rounded-[10px] bg-neutral-100 dark:bg-[#141416] border border-neutral-200 dark:border-[#222225]" />
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Skeleton className="h-10 flex-1 md:w-32 rounded-[10px] bg-neutral-100 dark:bg-[#141416] border border-neutral-200 dark:border-[#222225]" />
          <Skeleton className="h-10 flex-1 md:w-40 rounded-[10px] bg-neutral-100 dark:bg-[#141416] border border-neutral-200 dark:border-[#222225]" />
        </div>
      </div>

      {/* Links Cards Container Skeleton */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <LinkCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

/**
 * 3. Analytics Main Page Skeleton (6 KPI Carousel + Globe / Chart + Stream)
 */
export function AnalyticsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-44 sm:w-64 bg-white/15" />
          <Skeleton className="h-3.5 sm:h-4 w-64 sm:w-96 max-w-full bg-white/10" />
        </div>
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-10 w-36 rounded-xl bg-white/10" />
          <Skeleton className="h-10 w-28 rounded-xl bg-white/10 hidden sm:block" />
        </div>
      </div>

      {/* Time Range Pills */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-16 rounded-xl bg-white/10" />
        <Skeleton className="h-9 w-16 rounded-xl bg-white/10" />
        <Skeleton className="h-9 w-16 rounded-xl bg-brand-subtle" />
        <Skeleton className="h-9 w-16 rounded-xl bg-white/10" />
      </div>

      {/* 6 KPI Carousel Skeleton Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="p-4 rounded-2xl bg-[#141416] border border-[#222225] flex flex-col gap-2 h-28 justify-between">
            <Skeleton className="h-3 w-16 bg-white/10" />
            <Skeleton className="h-7 w-20 bg-white/15" />
            <Skeleton className="h-2.5 w-12 bg-white/5" />
          </div>
        ))}
      </div>

      {/* Globe & Chart Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-5 rounded-2xl bg-[#141416] border border-[#222225] p-5 flex flex-col items-center justify-center min-h-[300px]">
          <GlobeSkeleton />
        </div>
        <div className="lg:col-span-7 rounded-2xl bg-[#141416] border border-[#222225] p-5 flex flex-col justify-between min-h-[300px]">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-40 bg-white/15" />
            <Skeleton className="h-4 w-20 bg-white/10" />
          </div>
          <Skeleton className="h-52 w-full rounded-xl bg-white/5 mt-4" />
        </div>
      </div>
    </div>
  );
}

/**
 * 4. Analytics Sources Page Skeleton
 */
export function AnalyticsSourcesSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-48 sm:w-60 bg-white/15" />
          <Skeleton className="h-3.5 sm:h-4 w-60 sm:w-80 max-w-full bg-white/10" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl bg-white/10" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 rounded-2xl bg-[#141416] border border-[#222225] p-5 flex flex-col gap-4">
          <Skeleton className="h-5 w-40 bg-white/15" />
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-[#222225]">
              <Skeleton className="h-4 w-32 bg-white/10" />
              <Skeleton className="h-4 w-16 bg-white/10 font-mono" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-5 rounded-2xl bg-[#141416] border border-[#222225] p-5 flex flex-col items-center justify-center min-h-[260px]">
          <div className="w-40 h-40 rounded-full border-8 border-white/10 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

/**
 * 5. Analytics Revenue Page Skeleton
 */
export function AnalyticsRevenueSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-48 sm:w-64 bg-white/15" />
          <Skeleton className="h-3.5 sm:h-4 w-60 sm:w-80 max-w-full bg-white/10" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl bg-white/10" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="rounded-2xl bg-[#141416] border border-[#222225] p-5 flex flex-col gap-4 min-h-[300px]">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-48 bg-white/15" />
          <Skeleton className="h-4 w-24 bg-white/10" />
        </div>
        <Skeleton className="h-56 w-full rounded-xl bg-white/5" />
      </div>
    </div>
  );
}

/**
 * 6. Analytics Geo Page Skeleton
 */
export function AnalyticsGeoSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-48 sm:w-60 bg-white/15" />
          <Skeleton className="h-3.5 sm:h-4 w-60 sm:w-80 max-w-full bg-white/10" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl bg-white/10" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 rounded-2xl bg-[#141416] border border-[#222225] p-5 flex flex-col items-center justify-center min-h-[320px]">
          <GlobeSkeleton />
        </div>
        <div className="lg:col-span-6 rounded-2xl bg-[#141416] border border-[#222225] p-5 flex flex-col gap-4">
          <Skeleton className="h-5 w-40 bg-white/15" />
          {[1, 2, 3, 4, 5].map((j) => (
            <div key={j} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3.5 w-28 bg-white/15" />
                <Skeleton className="h-3.5 w-14 bg-white/10 font-mono" />
              </div>
              <Skeleton className="h-2 w-full rounded-full bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 7. Analytics Devices Page Skeleton
 */
export function AnalyticsDevicesSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-48 sm:w-60 bg-white/15" />
          <Skeleton className="h-3.5 sm:h-4 w-60 sm:w-80 max-w-full bg-white/10" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl bg-white/10" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-[#141416] border border-[#222225] p-5 flex flex-col gap-4">
          <Skeleton className="h-5 w-36 bg-white/15" />
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-[#222225]">
              <Skeleton className="h-4 w-28 bg-white/10" />
              <Skeleton className="h-4 w-14 bg-white/10 font-mono" />
            </div>
          ))}
        </div>
        <div className="rounded-2xl bg-[#141416] border border-[#222225] p-5 flex flex-col gap-4">
          <Skeleton className="h-5 w-36 bg-white/15" />
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="flex items-center justify-between py-2 border-b border-[#222225]">
              <Skeleton className="h-4 w-28 bg-white/10" />
              <Skeleton className="h-4 w-14 bg-white/10 font-mono" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * 8. QR Code Studio Page Skeleton
 */
export function QRCodePageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-44 sm:w-56 bg-white/15" />
          <Skeleton className="h-3.5 sm:h-4 w-60 sm:w-80 max-w-full bg-white/10" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl bg-white/10" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Preview */}
        <div className="lg:col-span-5 rounded-2xl bg-[#141416] border border-[#222225] p-6 flex flex-col items-center justify-center gap-4 min-h-[380px]">
          <Skeleton className="w-56 h-56 rounded-2xl bg-white/10" />
          <div className="flex items-center gap-2 w-full max-w-xs">
            <Skeleton className="h-10 flex-1 rounded-xl bg-white/10" />
            <Skeleton className="h-10 flex-1 rounded-xl bg-brand-subtle" />
          </div>
        </div>

        {/* Right Controls */}
        <div className="lg:col-span-7 rounded-2xl bg-[#141416] border border-[#222225] p-6 flex flex-col gap-5">
          <Skeleton className="h-5 w-40 bg-white/15" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-28 bg-white/10" />
            <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20 bg-white/10" />
              <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20 bg-white/10" />
              <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * 9. Custom Domains Page Skeleton
 */
export function DomainsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-48 sm:w-56 bg-white/15" />
          <Skeleton className="h-3.5 sm:h-4 w-64 sm:w-96 max-w-full bg-white/10" />
        </div>
        <Skeleton className="h-10 w-full sm:w-44 rounded-xl bg-brand-subtle shrink-0" />
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#141416] border border-[#222225] p-4 sm:p-5 flex flex-col gap-2.5"
          >
            <Skeleton className="h-3.5 sm:h-4 w-24 sm:w-28 bg-white/15" />
            <Skeleton className="h-6 sm:h-7 w-16 sm:w-20 bg-white/15" />
          </div>
        ))}
      </div>

      {/* Domains List */}
      <div className="flex flex-col gap-3 sm:gap-4 mt-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-[#141416] border border-[#222225] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-white/15 shrink-0" />
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <Skeleton className="h-4 sm:h-5 w-32 sm:w-44 bg-white/15 font-mono" />
                <Skeleton className="h-3 w-48 sm:w-64 max-w-full bg-white/10" />
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#222225]">
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-lg bg-white/10" />
              <Skeleton className="h-8 w-20 sm:w-24 rounded-lg bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 10. API & SDK Page Skeleton
 */
export function ApiKeysPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-44 sm:w-48 bg-white/15" />
          <Skeleton className="h-3.5 sm:h-4 w-60 sm:w-80 max-w-full bg-white/10" />
        </div>
        <Skeleton className="h-10 w-full sm:w-44 rounded-xl bg-brand-subtle shrink-0" />
      </div>

      {/* Keys List */}
      <div className="rounded-2xl bg-[#141416] border border-[#222225] p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl bg-[#18181c] border border-[#222225] gap-3"
          >
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <Skeleton className="h-4 w-28 sm:w-36 bg-white/15" />
              <Skeleton className="h-3 w-44 sm:w-60 max-w-full bg-white/10 font-mono" />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <Skeleton className="h-7 sm:h-8 w-16 sm:w-24 rounded-lg bg-white/10" />
              <Skeleton className="h-7 sm:h-8 w-8 rounded-lg bg-red-500/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * 11. Settings Page Skeleton
 */
export function SettingsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 max-w-4xl">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-7 sm:h-8 w-40 bg-white/15" />
        <Skeleton className="h-3.5 w-72 bg-white/10" />
      </div>

      <div className="flex items-center gap-2 border-b border-[#222225] pb-2">
        <Skeleton className="h-8 w-24 rounded-lg bg-white/10" />
        <Skeleton className="h-8 w-24 rounded-lg bg-white/5" />
        <Skeleton className="h-8 w-24 rounded-lg bg-white/5" />
      </div>

      <div className="rounded-2xl bg-[#141416] border border-[#222225] p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-full bg-white/15" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32 bg-white/15" />
            <Skeleton className="h-3 w-48 bg-white/10" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20 bg-white/10" />
            <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20 bg-white/10" />
            <Skeleton className="h-10 w-full rounded-xl bg-white/10" />
          </div>
        </div>

        <Skeleton className="h-10 w-32 rounded-xl bg-brand-subtle" />
      </div>
    </div>
  );
}

/**
 * 12. Globe 3D Loading Placeholder
 */
export function GlobeSkeleton() {
  return (
    <div className="w-full aspect-square max-w-[440px] mx-auto flex items-center justify-center p-4">
      <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-white/10 bg-[#121215] flex items-center justify-center overflow-hidden animate-pulse shadow-2xl">
        <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-dashed border-brand-subtle animate-spin" />
        <span className="absolute text-[11px] sm:text-xs text-neutral-400 font-mono">Loading 3D Edge...</span>
      </div>
    </div>
  );
}

/**
 * 13. Pricing Page Skeleton
 */
export function PricingPageSkeleton() {
  return (
    <div className="flex flex-col items-center gap-8 animate-in fade-in duration-300 max-w-6xl mx-auto pb-16">
      {/* Title & subtitle */}
      <div className="flex flex-col items-center gap-3 text-center">
        <Skeleton className="h-8 sm:h-10 w-64 sm:w-80 bg-white/15" />
        <Skeleton className="h-4 w-80 sm:w-96 max-w-full bg-white/10" />
        <Skeleton className="h-10 w-52 rounded-full bg-white/10 mt-2" />
      </div>

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className={`rounded-2xl bg-[#141416] border ${
              i === 2 ? "border-brand-subtle shadow-xl" : "border-[#222225]"
            } p-6 sm:p-8 flex flex-col justify-between gap-6 min-h-[500px]`}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-28 bg-white/15" />
                {i === 2 && <Skeleton className="h-5 w-20 rounded-full bg-brand-subtle" />}
              </div>
              <Skeleton className="h-3.5 w-48 bg-white/10" />
              <div className="flex items-baseline gap-1 my-2">
                <Skeleton className="h-10 w-24 bg-white/20 font-bebas" />
                <Skeleton className="h-4 w-12 bg-white/10" />
              </div>
              <div className="space-y-3 pt-4 border-t border-[#222225]">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <Skeleton className="h-4 w-4 rounded-full bg-white/10 shrink-0" />
                    <Skeleton className="h-3.5 flex-1 bg-white/10" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton
              className={`h-11 w-full rounded-xl ${
                i === 2 ? "bg-brand-subtle" : "bg-white/10"
              }`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}



