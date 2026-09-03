import { NextResponse } from "next/server";

const WORKER_URL = process.env.NEXT_PUBLIC_BACKEND_API_URL || process.env.QUICKLINK_API_URL || "https://click_tracker.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET = process.env.FRONTEND_API_SECRET || process.env.QUICKLINK_MASTER_KEY || "lsh_secret_live_prod_2026";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, avatarUrl, provider } = body;

    const res = await fetch(`${WORKER_URL}/api/v1/users/sync`, {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, name, avatarUrl, provider }),
    });

    if (!res.ok) {
      return NextResponse.json({ success: true, isLocalFallback: true });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("User OAuth Sync proxy error:", error);
    return NextResponse.json({ success: true, isLocalFallback: true });
  }
}
