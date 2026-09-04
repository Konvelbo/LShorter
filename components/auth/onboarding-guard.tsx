"use client";

import React, { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export function OnboardingGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const userId = session?.user?.id || "";

  // Real-time query to Convex DB for the current user's onboarding status
  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId ? { userId } : "skip"
  );

  useEffect(() => {
    if (status === "loading" || status === "unauthenticated") return;

    // 1. Check live Convex database first
    if (convexUser !== undefined && convexUser !== null) {
      if (convexUser.hasCompletedOnboarding === false) {
        if (!pathname.startsWith("/onboarding")) {
          router.replace("/onboarding");
        }
        return;
      }
    }

    // 2. Fallback to NextAuth session token
    if (session?.user) {
      const hasCompleted = (session.user as any).hasCompletedOnboarding;
      if (hasCompleted === false) {
        if (!pathname.startsWith("/onboarding")) {
          router.replace("/onboarding");
        }
      }
    }
  }, [convexUser, session, status, pathname, router]);

  return <>{children}</>;
}
