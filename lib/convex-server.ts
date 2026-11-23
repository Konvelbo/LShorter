import { ConvexHttpClient } from "convex/browser";

export function getCleanConvexUrl(): string {
  const raw = (
    process.env.CONVEX_URL ||
    process.env.NEXT_PUBLIC_CONVEX_URL ||
    ""
  )
    .replace(/['"]/g, "")
    .trim()
    .replace(/\/+$/, "");
  return raw;
}

export const convexUrl = getCleanConvexUrl();

export const convex = new ConvexHttpClient(convexUrl);
export const convexHttp = convex;
