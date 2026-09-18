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
    if (status === "unauthenticated") {
      router.replace("/register");
      return;
    }

    if (convexUser && convexUser.hasCompletedOnboarding === true) {
      router.replace("/dashboard");
      return;
    }

    // If query has finished and user is confirmed null (e.g. database was cleared),
    // immediately clear the orphaned cookie and redirect to register.
    if (status === "authenticated" && convexUser === null) {
      import("next-auth/react").then(({ signOut }) => {
        signOut({ redirect: true, callbackUrl: "/register" });
      });
    }
  }, [convexUser, router, status]);

  if (status === "loading" || (userId && convexUser === undefined)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (convexUser === null) {
    return null;
  }

  return <OnboardingWizard />;
}
