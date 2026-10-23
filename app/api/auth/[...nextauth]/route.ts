import { handlers } from "@/auth";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    return await handlers.GET(req);
  } catch (error: any) {
    console.warn("[NextAuth GET error caught]:", error?.message || error);
    return NextResponse.json(null, { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handlers.POST(req);
  } catch (error: any) {
    console.warn("[NextAuth POST error caught]:", error?.message || error);
    return NextResponse.json(
      { error: error?.message || "Authentication error" },
      { status: 500 }
    );
  }
}
