"use client";

import React, { ReactNode } from "react";
import { ConvexProvider } from "convex/react";
import { SessionProvider } from "next-auth/react";
import type { Session } from "next-auth";
import { convexClient } from "@/lib/convex-client";

export function ConvexClientProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession?: Session | null;
}) {
  return (
    <SessionProvider
      session={initialSession}
      basePath="/api/auth"
      refetchOnWindowFocus={false}
      refetchWhenOffline={false}
    >
      <ConvexProvider client={convexClient}>
        {children}
      </ConvexProvider>
    </SessionProvider>
  );
}
