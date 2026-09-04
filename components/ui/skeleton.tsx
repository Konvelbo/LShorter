import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[10px] bg-neutral-800/60 max-w-full",
        className
      )}
      {...props}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-4 sm:p-5 flex flex-col justify-between gap-3 h-32 sm:h-36">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-20 sm:w-24 bg-neutral-800/80" />
        <Skeleton className="h-7 w-7 sm:h-8 sm:w-8 rounded-[10px] bg-neutral-800/60 shrink-0" />
      </div>
      <Skeleton className="h-7 sm:h-9 w-24 sm:w-32 bg-neutral-800/90" />
      <div className="flex items-center justify-between gap-2">
        <Skeleton className="h-3 w-16 sm:w-20 bg-neutral-800/50" />
        <Skeleton className="h-3 w-20 sm:w-24 bg-neutral-800/50" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <>
      {/* Mobile Card Skeleton (< 768px) */}
      <div className="md:hidden p-3.5 border-b border-[#222225] flex flex-col gap-2.5 animate-pulse bg-[#141416]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <Skeleton className="w-2.5 h-2.5 rounded-full shrink-0 bg-neutral-700" />
            <Skeleton className="h-4 w-28 sm:w-36 bg-neutral-800/90 font-mono" />
          </div>
          <Skeleton className="h-5 w-16 rounded-[8px] bg-neutral-800/70 shrink-0" />
        </div>
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-3 w-3 rounded-full bg-[#ff6600]/40 shrink-0" />
          <Skeleton className="h-3 w-48 sm:w-64 max-w-[80%] bg-neutral-800/50" />
        </div>
        <div className="flex items-center justify-between pt-1.5 border-t border-[#1e1e22]">
          <div className="flex items-center gap-2">
            <Skeleton className="h-3 w-14 bg-neutral-800/60" />
            <Skeleton className="h-3 w-12 bg-neutral-800/40" />
          </div>
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-14 rounded-[8px] bg-neutral-800/60" />
            <Skeleton className="h-6 w-6 rounded-[8px] bg-neutral-800/60" />
            <Skeleton className="h-6 w-6 rounded-[8px] bg-neutral-800/60" />
          </div>
        </div>
      </div>

      {/* Desktop Table Row Skeleton (>= 768px) */}
      <div className="hidden md:flex items-center justify-between p-4 border-b border-[#222225] animate-pulse">
        <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
          <Skeleton className="h-8 w-8 rounded-[10px] shrink-0" />
          <div className="flex flex-col gap-1.5 min-w-0 flex-1">
            <Skeleton className="h-4 w-36 bg-neutral-800/80" />
            <Skeleton className="h-3 w-56 max-w-full bg-neutral-800/50" />
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <Skeleton className="h-4 w-16 bg-neutral-800/60 font-mono" />
          <Skeleton className="h-6 w-20 rounded-[10px] bg-neutral-800/60" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-7 w-7 rounded-[10px] bg-neutral-800/60" />
            <Skeleton className="h-7 w-7 rounded-[10px] bg-neutral-800/60" />
            <Skeleton className="h-7 w-7 rounded-[10px] bg-neutral-800/60" />
          </div>
        </div>
      </div>
    </>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Banner Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 sm:h-8 w-44 sm:w-48 bg-neutral-800/80" />
          <Skeleton className="h-3.5 sm:h-4 w-72 sm:w-96 max-w-full bg-neutral-800/50" />
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Skeleton className="h-10 w-28 rounded-[10px] bg-neutral-800/60 hidden sm:block" />
          <Skeleton className="h-10 w-full sm:w-36 rounded-[10px] bg-[#ff6600]/20 shrink-0" />
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
        <div className="lg:col-span-8 rounded-[10px] bg-[#141416] border border-[#222225] p-4 sm:p-6 flex flex-col justify-between h-64 sm:h-72">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-28 sm:w-32 bg-neutral-800/80" />
            <Skeleton className="h-4 w-20 sm:w-28 bg-neutral-800/60" />
          </div>
          <div className="flex items-end gap-1.5 sm:gap-3 h-36 sm:h-44 pt-4 overflow-hidden">
            {[40, 65, 30, 80, 50, 90, 70, 45, 60, 85, 40, 75].map((h, idx) => (
              <div
                key={idx}
                className="flex-1 bg-neutral-800/40 rounded-t-[6px] sm:rounded-t-[10px]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-[10px] bg-[#141416] border border-[#222225] p-4 sm:p-5 flex flex-col gap-4 h-auto sm:h-72 justify-between">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24 bg-neutral-800/80" />
            <Skeleton className="h-4 w-14 bg-neutral-800/60" />
          </div>
          <div className="flex flex-col gap-3 sm:gap-3.5">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-20 sm:w-28 bg-neutral-800/70" />
                  <Skeleton className="h-3 w-10 sm:w-12 bg-neutral-800/70" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-[10px] bg-neutral-800/40" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Links Container Skeleton */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-4 sm:p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <Skeleton className="h-5 w-28 sm:w-32 bg-neutral-800/80" />
            <Skeleton className="h-3 w-36 sm:w-44 bg-neutral-800/50" />
          </div>
          <Skeleton className="h-4 w-24 bg-neutral-800/60" />
        </div>

        {/* Mobile View: 3 cards */}
        <div className="flex flex-col gap-2.5 md:hidden">
          {[1, 2, 3].map((r) => (
            <div key={r} className="rounded-[10px] bg-[#18181c] border border-[#27272a] p-3 flex flex-col gap-2.5 animate-pulse">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1 flex flex-col gap-1">
                  <div className="flex items-center gap-1.5">
                    <Skeleton className="w-2 h-2 rounded-full bg-neutral-700 shrink-0" />
                    <Skeleton className="h-4 w-24 bg-neutral-800/80 font-mono" />
                  </div>
                  <Skeleton className="h-3 w-40 max-w-[85%] bg-neutral-800/50" />
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Skeleton className="h-4 w-8 bg-neutral-800/80 font-mono" />
                  <Skeleton className="h-2.5 w-7 bg-neutral-800/40" />
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-[#222225]">
                <Skeleton className="h-6 w-16 rounded-[8px] bg-neutral-800/60" />
                <div className="flex items-center gap-1">
                  <Skeleton className="h-6 w-6 rounded-[8px] bg-neutral-800/60" />
                  <Skeleton className="h-6 w-6 rounded-[8px] bg-neutral-800/60" />
                  <Skeleton className="h-6 w-6 rounded-[8px] bg-neutral-800/60" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop View: Table Rows */}
        <div className="hidden md:flex flex-col divide-y divide-[#1e1e22]">
          {[1, 2, 3].map((r) => (
            <div key={r} className="flex items-center justify-between py-3.5">
              <div className="flex flex-col gap-1.5 min-w-0 flex-1 pr-4">
                <Skeleton className="h-4 w-28 bg-neutral-800/80" />
                <Skeleton className="h-3 w-56 max-w-full bg-neutral-800/50" />
              </div>
              <Skeleton className="h-4 w-44 bg-neutral-800/60 font-mono" />
              <Skeleton className="h-4 w-12 bg-neutral-800/80 font-mono text-right" />
              <Skeleton className="h-5 w-16 rounded-[10px] bg-neutral-800/60" />
              <div className="flex gap-1.5">
                <Skeleton className="h-7 w-7 rounded-[8px] bg-neutral-800/60" />
                <Skeleton className="h-7 w-7 rounded-[8px] bg-neutral-800/60" />
                <Skeleton className="h-7 w-7 rounded-[8px] bg-neutral-800/60" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LinksPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-44 sm:w-52 bg-neutral-800/80" />
          <Skeleton className="h-3.5 sm:h-4 w-64 sm:w-80 max-w-full bg-neutral-800/60" />
        </div>
        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <Skeleton className="h-10 w-28 rounded-[10px] bg-neutral-800/60 hidden sm:block" />
          <Skeleton className="h-10 w-full sm:w-36 rounded-[10px] bg-[#ff6600]/20 shrink-0" />
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        <Skeleton className="h-10 w-full flex-1 rounded-[10px] bg-neutral-800/80" />
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Skeleton className="h-10 flex-1 md:w-36 rounded-[10px] bg-neutral-800/80" />
          <Skeleton className="h-10 flex-1 md:w-40 rounded-[10px] bg-neutral-800/80" />
        </div>
      </div>

      {/* Links Container Skeleton */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] overflow-hidden">
        <div className="p-3.5 sm:p-4 border-b border-[#222225] flex items-center justify-between">
          <Skeleton className="h-4 w-28 sm:w-32 bg-neutral-800/60" />
          <Skeleton className="h-4 w-16 sm:w-20 bg-neutral-800/60" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <TableRowSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function AnalyticsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-44 sm:w-56 bg-neutral-800/80" />
          <Skeleton className="h-3.5 sm:h-4 w-64 sm:w-80 max-w-full bg-neutral-800/60" />
        </div>
        <Skeleton className="h-10 w-full sm:w-44 rounded-[10px] bg-neutral-800/80" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Main Analytics Chart */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-4 sm:p-6 h-64 sm:h-80 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32 sm:w-40 bg-neutral-800/80" />
          <Skeleton className="h-4 w-20 sm:w-24 bg-neutral-800/60" />
        </div>
        <Skeleton className="h-full w-full rounded-[10px] bg-neutral-800/40" />
      </div>
    </div>
  );
}

export function DomainsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-48 sm:w-56 bg-neutral-800/80" />
          <Skeleton className="h-3.5 sm:h-4 w-64 sm:w-96 max-w-full bg-neutral-800/60" />
        </div>
        <Skeleton className="h-10 w-full sm:w-44 rounded-[10px] bg-[#ff6600]/20 shrink-0" />
      </div>

      {/* 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[10px] bg-[#141416] border border-[#222225] p-4 sm:p-5 flex flex-col gap-2.5"
          >
            <Skeleton className="h-3.5 sm:h-4 w-24 sm:w-28 bg-neutral-800/80" />
            <Skeleton className="h-6 sm:h-7 w-16 sm:w-20 bg-neutral-800/80" />
          </div>
        ))}
      </div>

      {/* Domains List */}
      <div className="flex flex-col gap-3 sm:gap-4 mt-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[10px] bg-[#141416] border border-[#222225] p-4 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4"
          >
            <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
              <Skeleton className="h-9 w-9 sm:h-10 sm:w-10 rounded-[10px] bg-neutral-800/80 shrink-0" />
              <div className="flex flex-col gap-1.5 min-w-0 flex-1">
                <Skeleton className="h-4 sm:h-5 w-32 sm:w-44 bg-neutral-800/80 font-mono" />
                <Skeleton className="h-3 w-48 sm:w-64 max-w-full bg-neutral-800/60" />
              </div>
            </div>
            <div className="flex items-center justify-between sm:justify-end gap-2.5 sm:gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-[#222225]">
              <Skeleton className="h-5 sm:h-6 w-16 sm:w-20 rounded-[8px] bg-neutral-800/80" />
              <Skeleton className="h-8 w-20 sm:w-24 rounded-[8px] bg-neutral-800/80" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ApiKeysPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-7 sm:h-8 w-44 sm:w-48 bg-neutral-800/80" />
          <Skeleton className="h-3.5 sm:h-4 w-60 sm:w-80 max-w-full bg-neutral-800/60" />
        </div>
        <Skeleton className="h-10 w-full sm:w-44 rounded-[10px] bg-[#ff6600]/20 shrink-0" />
      </div>

      {/* Keys List */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-4 sm:p-6 flex flex-col gap-3 sm:gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 sm:p-4 rounded-[10px] bg-[#1a1a1e] border border-[#222225] gap-3"
          >
            <div className="flex flex-col gap-1.5 min-w-0 flex-1">
              <Skeleton className="h-4 w-28 sm:w-36 bg-neutral-800/80" />
              <Skeleton className="h-3 w-44 sm:w-60 max-w-full bg-neutral-800/60 font-mono" />
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <Skeleton className="h-7 sm:h-8 w-16 sm:w-24 rounded-[8px] bg-neutral-800/80" />
              <Skeleton className="h-7 sm:h-8 w-8 rounded-[8px] bg-red-500/20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function GlobeSkeleton() {
  return (
    <div className="w-full aspect-square max-w-[440px] mx-auto flex items-center justify-center p-4">
      <div className="relative w-56 h-56 sm:w-72 sm:h-72 rounded-full border border-[#27272a] bg-[#141418] flex items-center justify-center overflow-hidden animate-pulse shadow-2xl">
        <div className="w-36 h-36 sm:w-48 sm:h-48 rounded-full border border-dashed border-[#ff6600]/30 animate-spin" />
        <span className="absolute text-[11px] sm:text-xs text-neutral-500 font-mono">Chargement 3D Edge...</span>
      </div>
    </div>
  );
}


