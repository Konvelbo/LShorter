import { NextResponse } from "next/server";
import { DODO_PRODUCT_IDS_LIVE, DODO_PRODUCT_IDS_TEST } from "@/src/config/pricing";
import { isDodoLiveMode } from "@/lib/dodo/dodo-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const isLive = isDodoLiveMode();
  const apiKey = (
    process.env.DODO_PAYMENTS_API_KEY ||
    process.env.NEXT_PUBLIC_DODO_PAYMENTS_API_KEY ||
    ""
  ).trim();

  return NextResponse.json({
    provider: "dodo",
    environment: isLive ? "live_mode" : "test_mode",
    isLive,
    hasApiKey: Boolean(apiKey),
    keyType: apiKey.startsWith("dodo_live_")
      ? "live"
      : apiKey.startsWith("dodo_test_")
        ? "test"
        : apiKey ? "custom" : "missing",
    productIds: isLive ? DODO_PRODUCT_IDS_LIVE : DODO_PRODUCT_IDS_TEST,
  });
}
