import { NextResponse } from "next/server";
import { auth } from "@/auth";

import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

export async function POST(req: Request) {
  // Security: Direct plan upgrade bypass is disabled.
  // All plan changes must go through Paddle Checkout and verified webhook / transaction verification.
  return NextResponse.json(
    {
      success: false,
      error: "Direct plan modifications are disabled. Subscriptions must be processed via Paddle Checkout.",
      code: "CHECKOUT_REQUIRED",
    },
    { status: 403 }
  );
}
