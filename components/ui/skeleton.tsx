import React from "react";
import { cn } from "@/lib/utils";

/**
 * Base Shimmer Skeleton - Centralized via .ds-skeleton in app/globals.css
 * Automatically adapts to Light Mode & Pure Black Dark Mode with a directional shimmer wave
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "ds-skeleton rounded-[10px] max-w-full",
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
    <div className="ds-card rounded-2xl p-4 sm:p-5 flex flex-col justify-between gap-3 h-32 sm:h-36">
      <div className="flex items-center justify-between">
        <Skeleton className="h-3.5 w-20 sm:w-24" />
        <Skeleton className="h-8 w-8 rounded-xl shrink-0" />
      </div>
      <Skeleton className="h-8 sm:h-9 w-24 sm:w-32" />
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-16 sm:w-20" />
        <Skeleton className="h-3 w-20 sm:w-24" />
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
      <div className="md:hidden p-3.5 border-b ds-border flex flex-col gap-2.5 ds-card">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Skeleton className="w-2.5 h-2.5 rounded-full shrink-0" />
            <Skeleton className="h-4 w-28 sm:w-36" />
          </div>
          <Skeleton className="h-5 w-16 rounded-[8px] shrink-0" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3 w-3 rounded-full shrink-0" />
          <Skeleton className="h-3 w-48 sm:w-64 max-w-[80%]" />
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t ds-border">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-3 w-12" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-14 rounded-[8px]" />
            <Skeleton className="h-6 w-6 rounded-[8px]" />
            <Skeleton className="h-6 w-6 rounded-[8px]" />
          </div>
        </div>
      </div>

      {/* Desktop Table Row Skeleton (>= 768px) */}
      <div className="hidden md:flex items-center justify-between p-4 border-b ds-border">
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
          <Skeleton className="h-9 w-9 rounded-xl shrink-0" />
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <Skeleton className="h-4 w-36" />
            <Skeleton className="h-3 w-56 max-w-full" />
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20 rounded-xl" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
            <Skeleton className="h-7 w-7 rounded-lg" />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * 1. Dashboard Overview Page Skeleton (1:1 UI Sincerity with /dashboard TailAdmin + @reui/c-chart-5, @reui/c-chart-14, @reui/c-chart-22)
 */
export function DashboardOverviewSkeleton() {
  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-300">
      {/* ════════════════════════════════════════════════════════════════════════
          ROW 1: TailAdmin 12-Col Grid (Left 7 Cols: 2 KPIs + Monthly Clicks c-chart-5 | Right 5 Cols: Monthly Target Radial Gauge)
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        {/* LEFT COLUMN (7 cols) */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          {/* 2 KPI Cards: Unique Visitors & Total Clicks */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="rounded-2xl ds-card p-6 shadow-xs flex flex-col justify-between min-h-[168px]"
              >
                <Skeleton className="w-12 h-12 rounded-2xl" />
                <div className="mt-6 flex items-end justify-between gap-2">
                  <div className="space-y-2">
                    <Skeleton className="h-3.5 w-28 rounded" />
                    <Skeleton className="h-8 w-24 rounded-lg" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>

          {/* Monthly Clicks Card (@reui/c-chart-5 Paired Striped/Solid Bar Chart) */}
          <div className="rounded-2xl ds-card p-6 shadow-xs flex-1 flex flex-col justify-between min-h-[310px]">
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-36 rounded" />
                <Skeleton className="h-3 w-56 rounded" />
              </div>
              <div className="flex items-center gap-3">
                <Skeleton className="h-3.5 w-20 rounded" />
                <Skeleton className="h-3.5 w-24 rounded" />
              </div>
            </div>

            {/* Paired Bars Skeleton (12 Months) */}
            <div className="w-full h-[215px] flex items-end justify-between gap-2.5 pt-6 pb-2 px-2 border-b ds-border">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                  <div className="w-full flex items-end justify-center gap-1 h-full">
                    <Skeleton
                      className="w-2.5 rounded-t-[4px]"
                      style={{ height: `${25 + ((i * 19) % 65)}%` }}
                    />
                    <Skeleton
                      className="w-2.5 rounded-t-[4px] opacity-60"
                      style={{ height: `${18 + ((i * 13) % 50)}%` }}
                    />
                  </div>
                  <Skeleton className="h-2.5 w-5 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN (5 cols): Monthly Target Semi-Circular Gauge Card */}
        <div className="xl:col-span-5 rounded-2xl ds-card shadow-xs flex flex-col justify-between overflow-hidden">
          <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-36 rounded" />
                <Skeleton className="h-3.5 w-52 rounded" />
              </div>
              <Skeleton className="w-8 h-8 rounded-lg" />
            </div>

            {/* Semi-Circular Radial Gauge Placeholder */}
            <div className="my-6 flex flex-col items-center justify-center">
              <div className="relative w-[220px] h-[115px] flex items-end justify-center overflow-hidden">
                <div className="w-[210px] h-[210px] rounded-full border-[14px] border-zinc-200 dark:border-zinc-800 border-b-transparent border-r-transparent rotate-45 animate-pulse" />
                <div className="flex flex-col items-center pb-1">
                  <Skeleton className="h-8 w-24 rounded-lg mb-2" />
                  <Skeleton className="h-5 w-14 rounded-full" />
                </div>
              </div>
              <div className="mt-5 flex flex-col items-center gap-1.5 w-full max-w-[320px]">
                <Skeleton className="h-3.5 w-full rounded" />
                <Skeleton className="h-3.5 w-4/5 rounded" />
              </div>
            </div>
          </div>

          {/* Bottom 3-Column Summary Bar: Target | Revenue | Today */}
          <div className="grid grid-cols-3 divide-x divide-zinc-200/80 dark:divide-[#222225] border-t ds-border bg-zinc-50/70 dark:bg-white/[0.02] py-4 px-3">
            {[1, 2, 3].map((k) => (
              <div key={k} className="flex flex-col items-center gap-1.5">
                <Skeleton className="h-3 w-14 rounded" />
                <Skeleton className="h-5 w-16 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          ROW 2: Overview 4-Column Connected KPI Strip
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl ds-card shadow-xs overflow-hidden">
        <div className="p-6 sm:px-7 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b ds-border">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-28 rounded" />
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>
          <Skeleton className="h-9 w-52 rounded-xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-zinc-200/80 dark:divide-[#222225]">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="p-6 sm:px-7 flex flex-col justify-between gap-3">
              <Skeleton className="h-3.5 w-28 rounded" />
              <div className="flex items-baseline justify-between gap-2">
                <Skeleton className="h-8 w-24 rounded-lg" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          ROW 3: Statistics Layered Area Chart (@reui/c-chart-14)
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl ds-card p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-32 rounded" />
            <Skeleton className="h-3.5 w-56 rounded" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-56 rounded-xl" />
            <Skeleton className="h-9 w-36 rounded-xl" />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8 mb-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-7 w-24 rounded-lg" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
              <Skeleton className="h-3 w-28 rounded" />
            </div>
          ))}
        </div>

        <Skeleton className="w-full h-[250px] rounded-2xl" />
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          ROW 3.5: Active Segment Donut (@reui/c-chart-22 — Top Clicks | Revenue & Clients)
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl ds-card p-6 sm:p-7 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-64 rounded" />
            <Skeleton className="h-3.5 w-80 max-w-full rounded" />
          </div>
          <Skeleton className="h-9 w-56 rounded-xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 flex items-center justify-center py-4">
            <div className="relative w-[185px] h-[185px] rounded-full border-[22px] border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center animate-pulse">
              <Skeleton className="h-6 w-16 rounded mb-1" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
          </div>
          <div className="md:col-span-7 space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════════════
          ROW 4: LinksReuiDataGrid Table Skeleton
         ════════════════════════════════════════════════════════════════════════ */}
      <div className="rounded-2xl ds-card p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>
          <div className="flex items-center gap-2.5">
            <Skeleton className="h-9 w-56 rounded-xl" />
            <Skeleton className="h-9 w-28 rounded-xl" />
          </div>
        </div>
        {[1, 2, 3, 4].map((r) => (
          <Skeleton key={r} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * Link Card Item Skeleton (Matches My Links modern card design)
 */
export function LinkCardSkeleton() {
  return (
    <div className="ds-card flex items-center justify-between gap-2.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl relative w-full">
      {/* Left side: Grip + Thumbnail + Info */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        <Skeleton className="hidden sm:block w-4 h-6 rounded shrink-0" />
        <div className="relative w-10 h-10 sm:w-11 sm:h-11 rounded-xl shrink-0">
          <Skeleton className="w-full h-full rounded-xl" />
        </div>
        <div className="min-w-0 space-y-1.5 flex-1 max-w-md">
          <Skeleton className="h-4 sm:h-5 w-28 sm:w-40 rounded-md" />
          <Skeleton className="h-3 w-24 sm:w-32 rounded" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-2.5 w-2.5 rounded-full shrink-0" />
            <Skeleton className="h-3 w-40 sm:w-64 max-w-[85%] rounded" />
          </div>
        </div>
      </div>

      {/* Right side: Click Counter + Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        <div className="flex flex-col items-end gap-1">
          <Skeleton className="h-5 sm:h-6 w-10 sm:w-14 rounded-md" />
          <Skeleton className="h-2.5 w-8 rounded" />
        </div>

        <div className="flex items-center gap-1.5">
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-xl" />
          <Skeleton className="h-8 w-8 rounded-xl" />
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
          <Skeleton className="h-7 sm:h-8 w-44 sm:w-52 rounded-lg" />
          <Skeleton className="h-3.5 sm:h-4 w-64 sm:w-80 max-w-full rounded" />
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Skeleton className="h-10 w-24 rounded-[10px] hidden sm:block" />
          <Skeleton className="h-10 w-full sm:w-36 rounded-[10px] shrink-0" />
        </div>
      </div>

      {/* 3 Metric Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#111113] p-5 shadow-2xs space-y-3"
          >
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="w-10 h-10 rounded-lg" />
              <Skeleton className="w-16 h-5 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="w-36 h-3 rounded" />
              <Skeleton className="w-24 h-7 rounded-lg" />
              <Skeleton className="w-44 h-3 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        <Skeleton className="h-10 w-full flex-1 rounded-[10px]" />
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Skeleton className="h-10 flex-1 md:w-32 rounded-[10px]" />
          <Skeleton className="h-10 flex-1 md:w-40 rounded-[10px]" />
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
 * 3. Analytics Main Page Skeleton (1:1 UI Match with /dashboard/analytics — Traffic Overview)
 */
export function AnalyticsPageSkeleton() {
  return (
    <div className="space-y-6 pb-10 animate-in fade-in duration-200">
      {/* Top thin progress shimmer */}
      <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-zinc-500/10 via-zinc-400/25 to-zinc-500/10 dark:from-white/5 dark:via-white/20 dark:to-white/5 animate-pulse" />

      {/* Page Breadcrumb / Header + Right Controls (Last 30 Days Dropdown, Refresh, Export CSV) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 w-64 sm:w-72 rounded-lg" />
          <Skeleton className="h-4 w-72 sm:w-[420px] max-w-full rounded" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Skeleton className="h-9 w-36 rounded-[10px]" />
          <Skeleton className="h-9 w-24 rounded-[10px]" />
          <Skeleton className="h-9 w-28 rounded-[10px]" />
        </div>
      </div>

      {/* Row 1: 4 Interactive Top KPI Cards (Unique Visitors, Total Link Clicks, Active Short Links, Avg. Clicks / Link) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl ds-card p-5 sm:p-6 flex flex-col justify-between gap-3 shadow-xs"
          >
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <div className="flex items-baseline justify-between gap-2 pt-1">
              <Skeleton className="h-7 sm:h-8 w-20 rounded-md" />
              <Skeleton className="h-3.5 w-24 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Full-Width (12-Col) Vertical Bar Chart (@reui/c-chart-5) with 12m | 30d | 7d | 24h Switcher */}
      <div className="rounded-2xl ds-card p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-52 rounded" />
            <Skeleton className="h-3.5 w-80 max-w-full rounded" />
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-lg bg-[#F2F4F7] dark:bg-white/[0.05] p-1">
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-16 rounded-md" />
            <Skeleton className="h-7 w-20 rounded-md" />
          </div>
        </div>
        <div className="flex items-end justify-between gap-2 h-[255px] pt-6 pb-3 border-b ds-border">
          {Array.from({ length: 18 }).map((_, idx) => (
            <div key={idx} className="flex-1 flex items-end justify-center gap-1 h-full">
              <Skeleton
                className="w-2.5 rounded-t-[4px]"
                style={{ height: `${20 + ((idx * 17) % 68)}%` }}
              />
              <Skeleton
                className="w-2.5 rounded-t-[4px] opacity-55"
                style={{ height: `${12 + ((idx * 13) % 52)}%` }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-4">
            <Skeleton className="h-3.5 w-24 rounded" />
            <Skeleton className="h-3.5 w-28 rounded" />
          </div>
          <Skeleton className="h-3.5 w-32 rounded" />
        </div>
      </div>

      {/* Row 3: 3-Column Breakdown (Top Channels, Top Short Links, Active Edge Stream 24h) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((col) => (
          <div
            key={col}
            className="rounded-2xl ds-card p-5 sm:p-6 flex flex-col justify-between gap-4 shadow-xs"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-5 w-36 rounded" />
                <Skeleton className="h-7 w-7 rounded-lg" />
              </div>
              {col === 3 ? (
                <>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-8 w-16 rounded-md" />
                    <Skeleton className="h-3.5 w-28 rounded" />
                  </div>
                  <Skeleton className="h-[115px] w-full rounded-xl" />
                  <div className="grid grid-cols-3 gap-2 pt-1">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <Skeleton className="h-12 w-full rounded-lg" />
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between pb-2 border-b ds-border">
                    <Skeleton className="h-3.5 w-16 rounded" />
                    <Skeleton className="h-3.5 w-16 rounded" />
                  </div>
                  <div className="space-y-2.5">
                    {[1, 2, 3, 4].map((r) => (
                      <Skeleton key={r} className="h-9 w-full rounded-lg" />
                    ))}
                  </div>
                </>
              )}
            </div>
            <Skeleton className="h-10 w-full rounded-xl mt-2" />
          </div>
        ))}
      </div>

      {/* Row 4: Full-Width LinksReuiDataGrid + GeoLogsReuiDataGrid */}
      <div className="rounded-2xl ds-card p-5 space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <Skeleton className="h-5 w-48 rounded" />
            <Skeleton className="h-3.5 w-64 rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-56 rounded-lg" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>
        {[1, 2, 3, 4].map((r) => (
          <Skeleton key={r} className="h-12 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}

/**
 * 4. Analytics Sources Page Skeleton
 */
export function AnalyticsSourcesSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-48 sm:w-60" />
          <Skeleton className="h-3.5 sm:h-4 w-60 sm:w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-7 ds-card rounded-2xl p-5 flex flex-col gap-4">
          <Skeleton className="h-5 w-40" />
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="flex items-center justify-between py-2 border-b ds-border">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
        <div className="lg:col-span-5 ds-card rounded-2xl p-5 flex flex-col items-center justify-center min-h-[260px]">
          <Skeleton className="w-40 h-40 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * 5. Analytics Revenue Page Skeleton (1:1 UI Match with /dashboard/analytics/revenue — Customers & Revenue)
 */
export function AnalyticsRevenueSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200 pb-16">
      <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-zinc-500/10 via-zinc-400/25 to-zinc-500/10 dark:from-white/5 dark:via-white/20 dark:to-white/5 animate-pulse" />

      {/* Header + Right-Aligned Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-40 rounded" />
          <Skeleton className="h-8 w-64 sm:w-72 rounded-lg" />
          <Skeleton className="h-3.5 w-72 sm:w-96 max-w-full rounded" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 lg:ml-auto">
          <Skeleton className="h-9 w-44 rounded-[10px]" />
          <Skeleton className="h-9 w-24 rounded-[10px]" />
          <Skeleton className="h-9 w-36 rounded-[10px]" />
        </div>
      </div>

      {/* Time Range Selector Bar */}
      <div className="flex items-center justify-between p-2.5 rounded-[10px] ds-card">
        <div className="flex items-center gap-3">
          <Skeleton className="h-4 w-28 rounded" />
          <Skeleton className="h-8 w-56 rounded-[10px]" />
        </div>
        <Skeleton className="h-4 w-32 rounded hidden sm:block" />
      </div>

      {/* 4 Financial Metrics KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="min-h-[148px] p-5 sm:p-6 rounded-[14px] ds-card flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-28 rounded" />
              <Skeleton className="h-9 w-9 rounded-[10px]" />
            </div>
            <Skeleton className="h-8 w-32 rounded-md" />
            <div className="flex items-center justify-between pt-2.5 border-t ds-border">
              <Skeleton className="h-3.5 w-32 rounded" />
              <Skeleton className="h-3.5 w-10 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* 12-Col Grid: Chronological Revenue Trend (@reui/c-chart-5 Paired Bars, 8 cols) + Attribution Breakdown (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8 p-5 sm:p-6 rounded-2xl ds-card flex flex-col justify-between gap-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-52 rounded" />
              <Skeleton className="h-3.5 w-64 rounded" />
            </div>
            <div className="flex items-center gap-2.5">
              <Skeleton className="h-4 w-20 rounded" />
              <Skeleton className="h-4 w-20 rounded" />
            </div>
          </div>
          <div className="w-full h-56 flex items-end gap-2 pt-6 pb-2 border-b ds-border">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="flex-1 flex items-end justify-center gap-1 h-full">
                <Skeleton
                  className="w-2 rounded-t-[4px]"
                  style={{ height: `${18 + ((i * 23) % 72)}%` }}
                />
                <Skeleton
                  className="w-2 rounded-t-[4px] opacity-60"
                  style={{ height: `${14 + ((i * 19) % 58)}%` }}
                />
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-3.5 w-44 rounded" />
            <Skeleton className="h-3.5 w-36 rounded" />
          </div>
        </div>

        <div className="lg:col-span-4 p-5 sm:p-6 rounded-2xl ds-card flex flex-col justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-44 rounded" />
            <Skeleton className="h-3.5 w-56 rounded" />
          </div>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((r) => (
              <Skeleton key={r} className="h-12 w-full rounded-[10px]" />
            ))}
          </div>
        </div>
      </div>

      {/* Beneficiaries / Conversion Ledger Table */}
      <div className="rounded-2xl ds-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-56 rounded" />
          <Skeleton className="h-9 w-48 rounded-lg" />
        </div>
        {[1, 2, 3, 4].map((r) => (
          <Skeleton key={r} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/**
 * 6. Analytics Geo Page Skeleton (1:1 UI Match with /dashboard/analytics/geo — Geography & Continents)
 */
export function AnalyticsGeoSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200 pb-16">
      <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-zinc-500/10 via-zinc-400/25 to-zinc-500/10 dark:from-white/5 dark:via-white/20 dark:to-white/5 animate-pulse" />

      {/* Header + Far-Right Controls (Link Selector, Period Buttons, Refresh, Export CSV) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-44 rounded" />
          <Skeleton className="h-8 w-64 sm:w-80 rounded-lg" />
          <Skeleton className="h-3.5 w-72 sm:w-96 max-w-full rounded" />
        </div>
        <div className="flex flex-wrap items-center gap-2.5 lg:ml-auto">
          <Skeleton className="h-9 w-40 rounded-[10px]" />
          <Skeleton className="h-9 w-48 rounded-[10px]" />
          <Skeleton className="h-9 w-9 rounded-[10px]" />
          <Skeleton className="h-9 w-28 rounded-[10px]" />
        </div>
      </div>

      {/* 5 Top Geo KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 rounded-2xl ds-card flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <Skeleton className="h-3.5 w-24 rounded" />
              <Skeleton className="h-7 w-7 rounded-lg" />
            </div>
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-3 w-28 rounded" />
          </div>
        ))}
      </div>

      {/* Full-Width Interactive World Map + 6 Continental Cards Grid */}
      <div className="rounded-2xl ds-card p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-56 rounded" />
            <Skeleton className="h-3.5 w-80 max-w-full rounded" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-28 rounded-lg" />
            <Skeleton className="h-8 w-24 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-[340px] w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[1, 2, 3, 4, 5, 6].map((c) => (
            <div key={c} className="p-3.5 rounded-xl border ds-border space-y-2">
              <Skeleton className="h-3.5 w-20 rounded" />
              <Skeleton className="h-6 w-14 rounded" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>

      {/* Multi-Dimension Active Segment Donut (@reui/c-chart-22: Devices | Browsers | Countries | Continents | OS) */}
      <div className="rounded-2xl ds-card p-5 sm:p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-64 rounded" />
            <Skeleton className="h-3.5 w-80 max-w-full rounded" />
          </div>
          <Skeleton className="h-9 w-96 max-w-full rounded-xl" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-5 flex items-center justify-center py-4">
            <div className="relative w-[185px] h-[185px] rounded-full border-[22px] border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center animate-pulse">
              <Skeleton className="h-6 w-16 rounded mb-1" />
              <Skeleton className="h-2.5 w-20 rounded" />
            </div>
          </div>
          <div className="md:col-span-7 space-y-2.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>

      {/* Live Detailed Geographic Stream Table */}
      <div className="rounded-2xl ds-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-52 rounded" />
          <Skeleton className="h-9 w-48 rounded-lg" />
        </div>
        {[1, 2, 3, 4].map((r) => (
          <Skeleton key={r} className="h-11 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/**
 * 6b. Analytics Live Click Stream Page Skeleton (1:1 UI Match with /dashboard/analytics/live)
 */
export function AnalyticsLiveSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-14 animate-in fade-in duration-200">
      <div className="h-0.5 w-full rounded-full bg-gradient-to-r from-zinc-500/10 via-zinc-400/25 to-zinc-500/10 dark:from-white/5 dark:via-white/20 dark:to-white/5 animate-pulse" />

      {/* Header + Single-Row Action Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b ds-border">
        <div className="space-y-1.5">
          <Skeleton className="h-3.5 w-44 rounded" />
          <Skeleton className="h-8 w-64 sm:w-80 rounded-lg" />
          <Skeleton className="h-3.5 w-80 sm:w-96 max-w-full rounded" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Skeleton className="h-9 w-40 rounded-[8px]" />
          <Skeleton className="h-9 w-24 rounded-[8px]" />
          <Skeleton className="h-9 w-24 rounded-[8px]" />
          <Skeleton className="h-9 w-28 rounded-[8px]" />
        </div>
      </div>

      {/* Filter Bar (Period Buttons + Search Input) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-xl ds-card">
        <Skeleton className="h-8 w-60 rounded-lg" />
        <Skeleton className="h-9 w-full sm:w-72 rounded-lg" />
      </div>

      {/* 4 Live Stream KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="p-4 rounded-xl ds-card flex flex-col justify-between gap-2.5">
            <Skeleton className="h-3.5 w-28 rounded" />
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-3 w-32 rounded" />
          </div>
        ))}
      </div>

      {/* Live Click Events Table */}
      <div className="rounded-xl ds-card p-5 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b ds-border">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-4 w-24 rounded" />
        </div>
        {[1, 2, 3, 4, 5, 6].map((r) => (
          <Skeleton key={r} className="h-12 w-full rounded-lg" />
        ))}
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
          <Skeleton className="h-7 sm:h-8 w-48 sm:w-60" />
          <Skeleton className="h-3.5 sm:h-4 w-60 sm:w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="ds-card rounded-2xl p-5 flex flex-col gap-4">
          <Skeleton className="h-5 w-36" />
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="flex items-center justify-between py-2 border-b ds-border">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
        <div className="ds-card rounded-2xl p-5 flex flex-col gap-4">
          <Skeleton className="h-5 w-36" />
          {[1, 2, 3, 4].map((k) => (
            <div key={k} className="flex items-center justify-between py-2 border-b ds-border">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-14" />
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
          <Skeleton className="h-7 sm:h-8 w-44 sm:w-56" />
          <Skeleton className="h-3.5 sm:h-4 w-60 sm:w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-36 rounded-xl" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 ds-card rounded-2xl p-6 flex flex-col items-center justify-center gap-4 min-h-[380px]">
          <Skeleton className="w-56 h-56 rounded-2xl" />
          <div className="flex items-center gap-2 w-full max-w-xs">
            <Skeleton className="h-10 flex-1 rounded-xl" />
            <Skeleton className="h-10 flex-1 rounded-xl" />
          </div>
        </div>

        <div className="lg:col-span-7 ds-card rounded-2xl p-6 flex flex-col gap-5">
          <Skeleton className="h-5 w-40" />
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-20" />
              <Skeleton className="h-10 w-full rounded-xl" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-48 sm:w-56" />
          <Skeleton className="h-3.5 sm:h-4 w-64 sm:w-96 max-w-full" />
        </div>
        <Skeleton className="h-10 w-full sm:w-44 rounded-xl shrink-0" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="ds-card rounded-2xl p-4 sm:p-5 flex flex-col gap-2.5"
          >
            <Skeleton className="h-3.5 sm:h-4 w-24 sm:w-28" />
            <Skeleton className="h-6 sm:h-7 w-16 sm:w-20" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:gap-4 mt-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="ds-card rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl shrink-0" />
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <Skeleton className="h-4 sm:h-5 w-32 sm:w-44" />
                <Skeleton className="h-3 w-48 sm:w-64 max-w-full" />
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 ds-border">
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-lg" />
              <Skeleton className="h-8 w-20 sm:w-24 rounded-lg" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-44 sm:w-48" />
          <Skeleton className="h-3.5 sm:h-4 w-60 sm:w-80 max-w-full" />
        </div>
        <Skeleton className="h-10 w-full sm:w-44 rounded-xl shrink-0" />
      </div>

      <div className="ds-card rounded-2xl p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-xl ds-surface border ds-border gap-3"
          >
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <Skeleton className="h-4 w-28 sm:w-36" />
              <Skeleton className="h-3 w-44 sm:w-60 max-w-full" />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <Skeleton className="h-7 sm:h-8 w-16 sm:w-24 rounded-lg" />
              <Skeleton className="h-7 sm:h-8 w-8 rounded-lg" />
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
        <Skeleton className="h-7 sm:h-8 w-40" />
        <Skeleton className="h-3.5 w-72" />
      </div>

      <div className="flex items-center gap-2 border-b ds-border pb-2">
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
        <Skeleton className="h-8 w-24 rounded-lg" />
      </div>

      <div className="ds-card rounded-2xl p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="w-16 h-16 rounded-[10px]" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-10 w-full rounded-xl" />
          </div>
        </div>

        <Skeleton className="h-10 w-32 rounded-xl" />
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
      <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full border ds-border ds-surface flex items-center justify-center overflow-hidden shadow-lg">
        <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-dashed border-rose-500/40 animate-spin" />
        <span className="absolute text-[11px] sm:text-xs ds-text-secondary font-mono">Loading 3D Edge...</span>
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
        <Skeleton className="h-8 sm:h-10 w-64 sm:w-80" />
        <Skeleton className="h-4 w-80 sm:w-96 max-w-full" />
        <Skeleton className="h-10 w-52 rounded-full mt-2" />
      </div>

      {/* 3 Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="ds-card rounded-2xl p-6 sm:p-8 flex flex-col justify-between gap-6 min-h-[500px]"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-28" />
                {i === 2 && <Skeleton className="h-5 w-20 rounded-full" />}
              </div>
              <Skeleton className="h-3.5 w-48" />
              <div className="flex items-baseline gap-1 my-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
              <div className="space-y-3 pt-4 border-t ds-border">
                {[1, 2, 3, 4, 5, 6].map((j) => (
                  <div key={j} className="flex items-center gap-2.5">
                    <Skeleton className="h-4 w-4 rounded-full shrink-0" />
                    <Skeleton className="h-3.5 flex-1" />
                  </div>
                ))}
              </div>
            </div>
            <Skeleton className="h-11 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}
