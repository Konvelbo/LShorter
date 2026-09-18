"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SectionGeneralProps {
  isActive: boolean;
  setIsActive: React.Dispatch<React.SetStateAction<boolean>>;
  tagsInput: string;
  setTagsInput: (tags: string) => void;
}

export function SectionGeneral({
  isActive,
  setIsActive,
  tagsInput,
  setTagsInput,
}: SectionGeneralProps) {
  return (
    <div
      id="drawer-section-general"
      className="flex flex-col gap-3 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] p-4 scroll-mt-4 shadow-xs"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#222225] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-brand" />
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            1. GENERAL
          </h3>
        </div>
        <span className="text-[10px] font-medium text-zinc-500 dark:text-neutral-400">
          Status &amp; Organization
        </span>
      </div>

      {/* Status Switch */}
      <div className="flex items-center justify-between p-3 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] shadow-xs">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-900 dark:text-white">Link Status</span>
            <span
              className={cn(
                "text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded-[4px]",
                isActive
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                  : "bg-zinc-200 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400",
              )}
            >
              {isActive ? "Active" : "Inactive"}
            </span>
          </div>
          <p className="text-[10.5px] text-zinc-500 dark:text-neutral-400 mt-0.5">
            {isActive
              ? "The link is currently live and resolves requests normally."
              : "The link is paused and will redirect to a suspension notice."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsActive((prev) => !prev)}
          className={cn(
            "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
            isActive ? "bg-brand" : "bg-zinc-200 dark:bg-neutral-800",
          )}
          aria-label="Toggle link status"
        >
          <span
            className={cn(
              "w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform",
              isActive ? "translate-x-1" : "-translate-x-5",
            )}
          />
        </button>
      </div>

      {/* Tags */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] font-bold text-zinc-700 dark:text-neutral-300">
          Organization Tags
        </label>
        <Input
          placeholder="marketing-campaign, q4-launch, promo..."
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] focus:border-brand text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-9 rounded-[8px]"
        />
        <p className="text-[10px] text-zinc-500 dark:text-neutral-500">
          Separate tags with commas to filter and organize links easily in your dashboard.
        </p>
      </div>
    </div>
  );
}
