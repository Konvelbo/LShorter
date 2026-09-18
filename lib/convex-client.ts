"use client";

import { ConvexReactClient } from "convex/react";

const raw =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://beloved-avocet-415.convex.cloud";

export const convexClient = new ConvexReactClient(raw.trim().replace(/\/+$/, ""));
