import React from "react";
import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-[10px] bg-neutral-800/60",
        className
      )}
      {...props}
    />
  );
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-8 w-8 rounded-[10px]" />
      </div>
      <Skeleton className="h-8 w-32" />
      <div className="flex items-center gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-3 w-28" />
      </div>
    </div>
  );
}

export function TableRowSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 border-b border-[#222225] animate-pulse">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-[10px]" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-20 rounded-[10px]" />
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-7 w-7 rounded-[10px]" />
          <Skeleton className="h-7 w-7 rounded-[10px]" />
          <Skeleton className="h-7 w-7 rounded-[10px]" />
        </div>
      </div>
    </div>
  );
}

export function DashboardOverviewSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Top Banner Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-48 bg-neutral-800/80" />
          <Skeleton className="h-4 w-96 max-w-full bg-neutral-800/50" />
        </div>
        <Skeleton className="h-11 w-36 rounded-[10px] bg-[#ff6600]/20 shrink-0" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col justify-between h-36"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24 bg-neutral-800/80" />
              <Skeleton className="h-4 w-12 rounded-[10px] bg-neutral-800/60" />
            </div>
            <Skeleton className="h-10 w-28 bg-neutral-800/90" />
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-20 bg-neutral-800/50" />
              <Skeleton className="h-3 w-24 bg-neutral-800/50" />
            </div>
          </div>
        ))}
      </div>

      {/* Middle Grid: Clics par jour (Bar chart) + Top Pays */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        <div className="lg:col-span-8 rounded-[10px] bg-[#141416] border border-[#222225] p-6 flex flex-col justify-between h-72">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-32 bg-neutral-800/80" />
            <Skeleton className="h-4 w-28 bg-neutral-800/60" />
          </div>
          <div className="flex items-end gap-3 h-44 pt-4">
            {[40, 65, 30, 80, 50, 90, 70, 45, 60, 85, 40, 75].map((h, idx) => (
              <div
                key={idx}
                className="flex-1 bg-neutral-800/40 rounded-t-[10px]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col gap-4 h-72">
          <div className="flex items-center justify-between">
            <Skeleton className="h-5 w-24 bg-neutral-800/80" />
            <Skeleton className="h-4 w-14 bg-neutral-800/60" />
          </div>
          <div className="flex flex-col gap-4">
            {[1, 2, 3, 4].map((j) => (
              <div key={j} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-28 bg-neutral-800/70" />
                  <Skeleton className="h-3 w-12 bg-neutral-800/70" />
                </div>
                <Skeleton className="h-1.5 w-full rounded-[10px] bg-neutral-800/40" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Links Table Skeleton */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-32 bg-neutral-800/80" />
          <Skeleton className="h-4 w-28 bg-neutral-800/60" />
        </div>
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((r) => (
            <div key={r} className="flex items-center justify-between py-3 border-b border-[#1e1e22]">
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-4 w-24 bg-neutral-800/80" />
                <Skeleton className="h-3 w-48 bg-neutral-800/50" />
              </div>
              <Skeleton className="h-4 w-52 bg-neutral-800/60 font-mono" />
              <Skeleton className="h-4 w-12 bg-neutral-800/80 font-mono" />
              <Skeleton className="h-5 w-16 rounded-[10px] bg-neutral-800/60" />
              <div className="flex gap-2">
                <Skeleton className="h-6 w-6 rounded-[10px] bg-neutral-800/60" />
                <Skeleton className="h-6 w-6 rounded-[10px] bg-neutral-800/60" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48 bg-neutral-800/80" />
          <Skeleton className="h-4 w-72 bg-neutral-800/60" />
        </div>
        <Skeleton className="h-10 w-36 rounded-[10px] bg-[#ff6600]/20" />
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <Skeleton className="h-10 flex-1 rounded-[10px] bg-neutral-800/80" />
        <Skeleton className="h-10 w-44 rounded-[10px] bg-neutral-800/80" />
      </div>

      {/* Table Skeleton */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] overflow-hidden">
        <div className="p-4 border-b border-[#222225] flex justify-between">
          <Skeleton className="h-4 w-32 bg-neutral-800/60" />
          <Skeleton className="h-4 w-20 bg-neutral-800/60" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-52 bg-neutral-800/80" />
          <Skeleton className="h-4 w-80 bg-neutral-800/60" />
        </div>
        <Skeleton className="h-10 w-44 rounded-[10px] bg-neutral-800/80" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-6 h-80 flex flex-col gap-4">
        <Skeleton className="h-5 w-40 bg-neutral-800/80" />
        <Skeleton className="h-full w-full rounded-[10px] bg-neutral-800/40" />
      </div>
    </div>
  );
}

export function DomainsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-56 bg-neutral-800/80" />
          <Skeleton className="h-4 w-96 max-w-full bg-neutral-800/60" />
        </div>
        <Skeleton className="h-10 w-44 rounded-[10px] bg-[#ff6600]/20" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 flex flex-col gap-3"
          >
            <Skeleton className="h-4 w-28 bg-neutral-800/80" />
            <Skeleton className="h-7 w-20 bg-neutral-800/80" />
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-4 mt-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-[10px] bg-[#141416] border border-[#222225] p-6 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-[10px] bg-neutral-800/80" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-5 w-44 bg-neutral-800/80" />
                <Skeleton className="h-3 w-64 bg-neutral-800/60" />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="h-6 w-20 rounded-[10px] bg-neutral-800/80" />
              <Skeleton className="h-8 w-24 rounded-[10px] bg-neutral-800/80" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-7 w-48 bg-neutral-800/80" />
          <Skeleton className="h-4 w-80 bg-neutral-800/60" />
        </div>
        <Skeleton className="h-10 w-44 rounded-[10px] bg-[#ff6600]/20" />
      </div>

      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-6 flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex items-center justify-between p-4 rounded-[10px] bg-[#1a1a1e] border border-[#222225]"
          >
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-36 bg-neutral-800/80" />
              <Skeleton className="h-3 w-60 bg-neutral-800/60" />
            </div>
            <Skeleton className="h-8 w-24 rounded-[10px] bg-neutral-800/80" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function GlobeSkeleton() {
  return (
    <div className="w-full aspect-square max-w-[440px] mx-auto flex items-center justify-center">
      <div className="relative w-72 h-72 rounded-full border border-[#27272a] bg-[#141418] flex items-center justify-center overflow-hidden animate-pulse">
        <div className="w-48 h-48 rounded-full border border-dashed border-[#ff6600]/30 animate-spin" />
        <span className="absolute text-xs text-neutral-500 font-mono">Chargement 3D Edge...</span>
      </div>
    </div>
  );
}


