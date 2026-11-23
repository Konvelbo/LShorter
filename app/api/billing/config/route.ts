import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { isDodoLiveMode } from "@/lib/dodo/dodo-server";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  const isLive = isDodoLiveMode();

  return NextResponse.json({
    provider: "dodo",
    environment: isLive ? "live_mode" : "test_mode",
    isLive,
  });
}
