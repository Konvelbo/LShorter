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
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#131417] dark:text-[#f1f2f4]">
          Routing
        </h2>
        <p className="text-sm text-[#6c717c] dark:text-[#8a8f9a] mt-1">
          Send visitors elsewhere dynamically by country, device, browser or language.
        </p>
      </div>

      <LockedProFeature
        title="Dynamic Smart Routing"
        description="Redirect visitors dynamically based on their country, web browser (Chrome, Safari, Firefox, Edge), or operating system."
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
