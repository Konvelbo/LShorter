import { ConvexReactClient } from "convex/react";

const convexUrl =
  process.env.NEXT_PUBLIC_CONVEX_URL ||
  "https://greedy-mastiff-107.convex.cloud";

export const convexClient = new ConvexReactClient(convexUrl);
