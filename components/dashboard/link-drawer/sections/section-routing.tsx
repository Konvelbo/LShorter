"use client";

import React from "react";
import { RoutingRulesEditor, RoutingRule } from "../../routing-rules-editor";
import { LockedProFeature } from "../locked-pro-feature";
import { useI18n } from "@/components/providers/i18n-provider";

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
  const { locale } = useI18n();
  const isFr = locale === "fr";

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
          {isFr ? "Routage intelligent" : "Routing"}
        </h2>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mt-1">
          {isFr
            ? "Redirigez dynamiquement vos visiteurs selon le pays, l'appareil, le navigateur ou la langue."
            : "Send visitors elsewhere dynamically by country, device, browser or language."}
        </p>
      </div>

      <LockedProFeature
        title={isFr ? "Routage dynamique intelligent" : "Dynamic Smart Routing"}
        description={
          isFr
            ? "Redirigez les visiteurs dynamiquement selon leur pays, leur navigateur (Chrome, Safari, Firefox, Edge) ou leur système d'exploitation."
            : "Redirect visitors dynamically based on their country, web browser (Chrome, Safari, Firefox, Edge), or operating system."
        }
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
