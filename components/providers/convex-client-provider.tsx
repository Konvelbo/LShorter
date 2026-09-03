"use client";

import React, { ReactNode } from "react";
import { ConvexProvider } from "convex/react";
import { SessionProvider } from "next-auth/react";
import { convexClient } from "@/lib/convex-client";

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <ConvexProvider client={convexClient}>
        {children}
      </ConvexProvider>
    </SessionProvider>
  );
}
