"use client";

import React from "react";
import { RoutingRulesEditor, RoutingRule } from "../../routing-rules-editor";
import { LockedProFeature } from "../locked-pro-feature";

interface SectionRoutingProps {
  routingRules: RoutingRule[];
  setRoutingRules: React.Dispatch<React.SetStateAction<RoutingRule[]>>;
  isProPlan: boolean;
  userPlan: string;
}

export function SectionRouting({
  routingRules,
  setRoutingRules,
  isProPlan,
  userPlan,
}: SectionRoutingProps) {
  return (
    <div
      id="drawer-section-routing"
      className="flex flex-col gap-3 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] p-4 scroll-mt-4 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#222225] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-brand" />
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            ROUTING &amp; TARGETING
          </h3>
        </div>
        <span className="text-[10px] font-medium text-zinc-500 dark:text-neutral-400">
          Geo &amp; Device Targeting
        </span>
      </div>

      <LockedProFeature
        title="Dynamic Smart Routing"
        description="Redirect visitors dynamically based on their country or operating system (iOS, Android, Windows, Mac)."
        isUnlocked={isProPlan}
      >
        <div className="flex flex-col gap-3">
          <RoutingRulesEditor
            rules={routingRules}
            onChange={setRoutingRules}
            userPlan={userPlan}
          />
        </div>
      </LockedProFeature>
    </div>
  );
}
