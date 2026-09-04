import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

export async function GET() {
  const googleId = process.env.GOOGLE_CLIENT_ID || process.env.AUTH_GOOGLE_ID || "";
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET || process.env.AUTH_GOOGLE_SECRET || "";
  const authSecret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || "";
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL || "https://greedy-mastiff-107.convex.cloud";

  let convexStatus = "unknown";
  try {
    const convex = new ConvexHttpClient(convexUrl);
    await convex.query(api.users.getUserByEmail, { email: "ping-healthcheck@test.internal" });
    convexStatus = "connected";
  } catch (err: any) {
    convexStatus = `error: ${err?.message || String(err)}`;
  }

  return NextResponse.json({
    status: "ok",
    environment: {
      hasGoogleClientId: Boolean(googleId.trim()),
      googleClientIdPreview: googleId ? `${googleId.slice(0, 12)}...${googleId.slice(-10)}` : "MISSING",
      hasGoogleClientSecret: Boolean(googleSecret.trim()),
      googleClientSecretLength: googleSecret.trim().length,
      hasAuthSecret: Boolean(authSecret.trim()),
      authUrl: process.env.AUTH_URL || null,
      nextAuthUrl: process.env.NEXTAUTH_URL || null,
      vercelEnv: process.env.VERCEL_ENV || "local",
      convexUrl,
      convexStatus,
    },
  });
}
