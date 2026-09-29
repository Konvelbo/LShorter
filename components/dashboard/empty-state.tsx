"use client";

import React from "react";
import { GlobalAnalytics } from "@/types";
import { PopulatedState } from "./populated-state";

interface EmptyStateProps {
  onLinkCreated?: () => void;
  analytics?: GlobalAnalytics;
}

const DEFAULT_ANALYTICS: GlobalAnalytics = {
  totalClicks: 0,
  clicksGrowth: 0,
  uniqueClicks: 0,
  uniqueClicksGrowth: 0,
  trackedRevenue: 0,
  revenueGrowth: 0,
  avgCtr: 0,
  ctrGrowth: 0,
  bounceRate: 0,
  epc: 0,
  avgEngagementTime: "0s",
  clicksByDay: [],
  topCountries: [],
  topCities: [],
  topDevices: [],
  topBrowsers: [],
  topReferrers: [],
  liveClickEvents: [],
  recentConversions: [],
};

export function EmptyState({ onLinkCreated, analytics }: EmptyStateProps) {
  return (
    <PopulatedState
      links={[]}
      analytics={analytics ?? DEFAULT_ANALYTICS}
      onRefresh={onLinkCreated}
    />
  );
}
