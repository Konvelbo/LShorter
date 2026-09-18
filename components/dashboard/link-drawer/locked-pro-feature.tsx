"use client";

import React from "react";
import { Lock, Sparkles } from "lucide-react";
import { triggerPlanUpgrade } from "@/lib/plan-guard";

export function LockedProFeature({
  title,
  description,
  children,
  isUnlocked,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  isUnlocked: boolean;
}) {
  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div
      onClick={() =>
        triggerPlanUpgrade({
          featureName: title,
          reason: `Unlock ${title} by upgrading to the PRO plan.`,
          targetPlan: "PRO",
        })
      }
      className="relative rounded-[10px] overflow-hidden border border-amber-500/30 bg-amber-500/[0.03] dark:bg-[#16161a] p-4 group select-none cursor-pointer transition-all hover:border-amber-500/50"
    >
      {/* Blurred & Disabled Content */}
      <div className="opacity-20 pointer-events-none select-none filter blur-[1.5px]">
        {children}
      </div>

      {/* Frosted Glass Overlay */}
      <div className="absolute inset-0 bg-white/95 dark:bg-[#101014]/95 backdrop-blur-[4px] flex flex-col sm:flex-row items-center justify-between px-5 py-3 gap-3.5 z-10 border border-amber-500/20 dark:border-amber-500/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 dark:border-amber-500/30 flex items-center justify-center shrink-0">
            <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-900 dark:text-white tracking-wide">
                {title}
              </span>
              <span className="px-1.5 py-0.5 rounded-[10px] bg-amber-500/15 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 font-extrabold text-[9px] border border-amber-500/30 tracking-wider">
                PLAN PRO
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 dark:text-neutral-400 leading-tight mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            triggerPlanUpgrade({
              featureName: title,
              reason: `Unlock ${title} by upgrading to the PRO plan.`,
              targetPlan: "PRO",
            });
          }}
          className="px-3.5 py-1.5 rounded-[10px] bg-brand hover:bg-brand-hover text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Unlock with PRO</span>
        </button>
      </div>
    </div>
  );
}
