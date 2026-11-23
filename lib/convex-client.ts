"use client";

import { ConvexReactClient } from "convex/react";

const raw = (process.env.NEXT_PUBLIC_CONVEX_URL || "")
  .replace(/['"]/g, "")
  .trim()
  .replace(/\/+$/, "");

export const convexClient = new ConvexReactClient(raw.trim().replace(/\/+$/, ""));
