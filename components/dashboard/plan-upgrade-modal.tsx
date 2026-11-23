"use client";

import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";

const PlanUpgradeModalContent = dynamic(
  () =>
    import("@/components/dashboard/plan-upgrade-modal-content").then(
      (m) => m.PlanUpgradeModalContent
    ),
  { ssr: false }
);

export function PlanUpgradeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [reason, setReason] = useState<string | null>(null);

  useEffect(() => {
    const handleUpgradeRequest = (e: Event) => {
      const customEvent = e as CustomEvent<{ reason?: string }>;
      const rawReason = customEvent.detail?.reason?.trim();
      setReason(rawReason || null);
      setIsOpen(true);
    };

    window.addEventListener(
      "lshorter_plan_upgrade_requested",
      handleUpgradeRequest
    );
    return () => {
      window.removeEventListener(
        "lshorter_plan_upgrade_requested",
        handleUpgradeRequest
      );
    };
  }, []);

  if (!isOpen) return null;

  return (
    <PlanUpgradeModalContent
      reason={reason}
      onClose={() => setIsOpen(false)}
    />
  );
}
