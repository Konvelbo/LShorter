import { NextResponse } from "next/server";

export async function POST() {
  // Security: Direct plan upgrade bypass is disabled.
  // All plan changes must go through Dodo Payments Checkout and verified webhook / transaction verification.
  return NextResponse.json(
    {
      success: false,
      error: "Direct plan modifications are disabled. Subscriptions must be processed via Checkout.",
      code: "CHECKOUT_REQUIRED",
    },
    { status: 403 }
  );
}
