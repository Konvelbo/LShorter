"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";

export default function OnboardingPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = session?.user?.id || "";

  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId ? { userId } : "skip"
  );

  useEffect(() => {
    if (convexUser && convexUser.hasCompletedOnboarding === true) {
      router.replace("/dashboard");
    }
  }, [convexUser, router]);

  return <OnboardingWizard />;
}
