import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import {
  GUEST_COOKIE_NAME,
  verifyGuestToken,
  getClientIpHash,
  claimGuestLinksForUser,
} from "@/lib/guest-links";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
};

/**
 * POST /api/public/claim
 * Transfers any unclaimed guest link (matching lsh_guest cookie or IP hash)
 * into the user's authenticated LShorter dashboard account, removes the 24h expiration
 * (making it permanent), preserves all click_events, and syncs Cloudflare KV.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth().catch(() => null);
    if (
      !session?.user ||
      (session.user as { userNotFound?: boolean }).userNotFound
    ) {
      return NextResponse.json(
        { success: false, error: "Authentication required." },
        { status: 401, headers: NO_STORE_HEADERS }
      );
    }

    const token = req.cookies.get(GUEST_COOKIE_NAME)?.value;
    const guestId = verifyGuestToken(token);
    const ipHash = getClientIpHash(req);

    const userEmail = (session.user.email || "").toLowerCase().trim();
    let userId = session.user.id || "";
    let userPlan = (
      (session.user as { plan?: string }).plan || "FREE"
    ).toUpperCase();
    const userName = session.user.name || "User";

    if (
      (!userId ||
        userId === "usr_anonymous" ||
        userId.includes("@") ||
        !userId.startsWith("usr_")) &&
      userEmail
    ) {
      try {
        const cu = await convex.query(api.users.getUserByEmail, {
          email: userEmail,
        });
        if (cu?.userId) userId = cu.userId;
        if (cu?.plan) userPlan = String(cu.plan).toUpperCase();
      } catch (e) {
        console.warn("[POST /api/public/claim] Convex lookup warning:", e);
      }
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unable to resolve user account." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const { claimedCount, claimedSlugs } = await claimGuestLinksForUser({
      guestId,
      ipHash,
      userId,
      userEmail,
      userName,
      userPlan,
    });

    const response = NextResponse.json(
      {
        success: true,
        claimedCount,
        claimedSlugs,
      },
      { headers: NO_STORE_HEADERS }
    );
    response.cookies.delete(GUEST_COOKIE_NAME);
    return response;
  } catch (err) {
    console.error("[POST /api/public/claim] Error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to claim guest links." },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
