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
  
  const userEmail = session?.user?.email || "";
  const userId = session?.user?.id || (session?.user as any)?.userId || userEmail;

  // Real-time query to Convex DB for the current user's onboarding status
  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId ? { userId, email: userEmail || undefined } : "skip"
  );

  useEffect(() => {
    if (status === "loading" || status === "unauthenticated") return;

    // 1. If Convex query is still resolving (undefined), wait - DO NOT redirect prematurely
    if (convexUser === undefined && userId) {
      return;
    }

    // 2. Check live Convex database first
    if (convexUser !== undefined && convexUser !== null) {
      if (convexUser.hasCompletedOnboarding === false) {
        if (!pathname.startsWith("/onboarding")) {
          router.replace("/onboarding");
        }
        return;
      }
      // If convexUser.hasCompletedOnboarding is true, dashboard is authorized
      return;
    }

    // 3. Fallback to NextAuth session token ONLY when convexUser is confirmed null (not found)
    if (convexUser === null && session?.user) {
      const hasCompleted = (session.user as any).hasCompletedOnboarding;
      if (hasCompleted === false) {
        if (!pathname.startsWith("/onboarding")) {
          router.replace("/onboarding");
        }
      }
    }
  }, [convexUser, session, status, pathname, router, userId]);

  return <>{children}</>;
}
