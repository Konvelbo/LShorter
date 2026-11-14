import { NextResponse } from "next/server";
import { DODO_PRODUCT_IDS } from "@/src/config/pricing";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    provider: "dodo",
    environment: process.env.DODO_PAYMENTS_ENVIRONMENT || "test_mode",
    productIds: DODO_PRODUCT_IDS,
  });
}
