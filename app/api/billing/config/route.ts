import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({
    clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN || "",
    environment: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT || "sandbox",
    priceIds: {
      PRO: {
        monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_MONTHLY || "",
        yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_YEARLY || "",
      },
      BUSINESS: {
        monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_BUSINESS_MONTHLY || "",
        yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_BUSINESS_YEARLY || "",
      },
      ENTERPRISE: {
        monthly: process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_MONTHLY || "",
        yearly: process.env.NEXT_PUBLIC_PADDLE_PRICE_ENTERPRISE_YEARLY || "",
      },
    },
    discountIds: {
      PRO: {
        monthly: process.env.NEXT_PUBLIC_PADDLE_DISCOUNT_PRO_MONTHLY || "",
      },
      BUSINESS: {
        monthly: process.env.NEXT_PUBLIC_PADDLE_DISCOUNT_BUSINESS_MONTHLY || "",
      },
      ENTERPRISE: {
        monthly: process.env.NEXT_PUBLIC_PADDLE_DISCOUNT_ENTERPRISE_MONTHLY || "",
      },
    },
  });
}
