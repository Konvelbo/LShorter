import { ConvexHttpClient } from "convex/browser";

export function getCleanConvexUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_CONVEX_URL ||
    "https://beloved-avocet-415.convex.cloud";
  return raw.trim().replace(/\/+$/, "");
}

export const convexUrl = getCleanConvexUrl();

export const convex = new ConvexHttpClient(convexUrl);
export const convexHttp = convex;
