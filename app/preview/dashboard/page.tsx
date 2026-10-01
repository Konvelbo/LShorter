"use client";

import React from "react";
import { PopulatedState } from "@/components/dashboard/populated-state";
import { PREVIEW_LINKS, PREVIEW_ANALYTICS } from "@/lib/preview-data";

export default function PreviewDashboardPage() {
  return (
    <div className="w-full">
      <PopulatedState
        links={PREVIEW_LINKS}
        analytics={PREVIEW_ANALYTICS}
        onRefresh={() => {}}
      />
    </div>
  );
}
