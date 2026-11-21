"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { GuestLinksClaimer } from "@/components/dashboard/guest-links-claimer";

export default function OnboardingPage() {
  const { data: session } = useSession();
  const userEmail = session?.user?.email || "";
  const userId = session?.user?.id || (session?.user as any)?.userId || userEmail;

  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId ? { userId, email: userEmail || undefined } : "skip"
  );

  useEffect(() => {
    if (convexUser && convexUser.hasCompletedOnboarding === true) {
      if (typeof document !== "undefined") {
        document.cookie =
          "lsh_onboarding_completed=true; path=/; max-age=31536000; SameSite=Lax";
      }
      window.location.href = "/dashboard";
    }
  }, [convexUser]);

  return (
    <>
      <GuestLinksClaimer />
      <OnboardingWizard />
    </>
  );
}
