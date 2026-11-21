import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { isSafeHttpUrl, checkRateLimit } from "@/lib/security-utils";
import { invalidateServerLinksCache } from "@/lib/server-links-cache";
import {
  GUEST_COOKIE_NAME,
  GUEST_COOKIE_MAX_AGE_SEC,
  GUEST_LINK_TTL_MS,
  GUEST_MAX_LINKS,
  createGuestId,
  signGuestToken,
  verifyGuestToken,
  getClientIpHash,
  generateGuestSlug,
  recordGuestLink,
  countGuestLinksUsage,
  getGuestLinksWithLiveClicks,
  deleteGuestLinkBySlug,
  purgeExpiredGuestLinks,
  isDisallowedLoopHost,
} from "@/lib/guest-links";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

function normalizeInputUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?#].*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * GET /api/public/shorten
 * Purges any expired 24h links and returns the current Hero short link with live D1 click count,
 * 24-hour expiresAt timestamp, and 1-link quota usage.
 */
export async function GET(req: NextRequest) {
  try {
    const ipHash = getClientIpHash(req);
    const token = req.cookies.get(GUEST_COOKIE_NAME)?.value;
    const guestId = verifyGuestToken(token);

    const [usage, links] = await Promise.all([
      countGuestLinksUsage(guestId, ipHash),
      getGuestLinksWithLiveClicks(guestId, ipHash),
    ]);

    return NextResponse.json(
      {
        success: true,
        links,
        usedCount: usage.effectiveCount,
        remaining: usage.remaining,
        maxLinks: GUEST_MAX_LINKS,
        limitReached: usage.limitReached,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    console.warn("[GET /api/public/shorten] Error:", err);
    return NextResponse.json(
      {
        success: true,
        links: [],
        usedCount: 0,
        remaining: GUEST_MAX_LINKS,
        maxLinks: GUEST_MAX_LINKS,
        limitReached: false,
      },
      { headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * POST /api/public/shorten
 * Creates a 24-hour short link from the Hero section with a strict 1-link limit.
 * When the visitor creates an account, `claimGuestLinksForUser` transfers this link
 * into their permanent dashboard (`expires_at = NULL`).
 */
export async function POST(req: NextRequest) {
  try {
    const ipHash = getClientIpHash(req);

    // Burst rate limit per IP (12 attempts / minute)
    const burst = checkRateLimit(`public_shorten:${ipHash}`, 12, 60_000);
    if (!burst.allowed) {
      return NextResponse.json(
        {
          success: false,
          code: "RATE_LIMITED",
          error: `Too many requests. Please wait ${burst.retryAfterSec || 30}s and try again.`,
        },
        { status: 429, headers: NO_STORE_HEADERS }
      );
    }

    let body: { targetUrl?: string } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON payload." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const rawUrl =
      typeof body.targetUrl === "string" ? body.targetUrl.trim() : "";
    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: "Please paste a valid URL to shorten." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (rawUrl.length > 2048) {
      return NextResponse.json(
        {
          success: false,
          error: "URL is too long (maximum 2,048 characters).",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const normalizedUrl = normalizeInputUrl(rawUrl);
    if (!isSafeHttpUrl(normalizedUrl)) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Please enter a valid public http:// or https:// website URL.",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (isDisallowedLoopHost(normalizedUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: "Links pointing to lsho.cc cannot be shortened again.",
        },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const existingToken = req.cookies.get(GUEST_COOKIE_NAME)?.value;
    const existingGuestId = verifyGuestToken(existingToken);

    // Enforce the strict 1-link Hero limit (24h TTL)
    const usage = await countGuestLinksUsage(existingGuestId, ipHash);
    if (usage.limitReached) {
      const existingLinks = await getGuestLinksWithLiveClicks(
        existingGuestId,
        ipHash
      );
      return NextResponse.json(
        {
          success: false,
          code: "GUEST_LIMIT_REACHED",
          error:
            "You've reached the 1-link limit. Create a free account to keep your link forever in your dashboard and shorten more links.",
          links: existingLinks,
          usedCount: usage.effectiveCount,
          remaining: 0,
          maxLinks: GUEST_MAX_LINKS,
          limitReached: true,
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const guestId = existingGuestId || createGuestId();
    const slug = generateGuestSlug();
    const expiresAt = new Date(Date.now() + GUEST_LINK_TTL_MS).toISOString();

    // Check if an authenticated session is also active so the link appears in their dashboard too
    const session = await auth().catch(() => null);
    const isAuthenticated = Boolean(
      session?.user &&
        !(session.user as { userNotFound?: boolean }).userNotFound
    );
    let ownerId = guestId;
    let ownerEmail = `${guestId}@guest.lsho.cc`;
    let ownerName = "Guest";

    if (isAuthenticated && session?.user) {
      const userEmail = (session.user.email || "").toLowerCase().trim();
      let resolvedId = session.user.id || "";
      if (userEmail) {
        try {
          const cu = await convex.query(api.users.getUserByEmail, {
            email: userEmail,
          });
          if (cu?.userId) resolvedId = cu.userId;
        } catch {}
      }
      if (resolvedId) {
        ownerId = resolvedId;
        ownerEmail = userEmail || `${resolvedId}@user.lsho.cc`;
        ownerName = session.user.name || "User";
      }
    }

    const workerRes = await fetch(`${WORKER_URL}/api/v1/links`, {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET || "",
        Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
        "X-User-Id": ownerId,
        "X-User-Email": ownerEmail,
        "X-User-Name": ownerName,
        "X-User-Plan": "PRO",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: ownerId,
        user_id: ownerId,
        userEmail: ownerEmail,
        user_email: ownerEmail,
        userName: ownerName,
        domainName: "lsho.cc",
        slug,
        targetUrl: normalizedUrl,
        target_url: normalizedUrl,
        expiresAt,
        expires_at: expiresAt,
        isActive: true,
        is_active: 1,
        pathLockMode: "off",
        tags: ["guest-hero"],
        plan: "PRO",
      }),
      cache: "no-store",
    });

    const workerData = await workerRes.json().catch(() => ({}));
    if (!workerRes.ok) {
      return NextResponse.json(
        {
          success: false,
          error:
            workerData?.error ||
            "Could not create your short link. Please try again.",
        },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }

    if (isAuthenticated && ownerId !== guestId) {
      invalidateServerLinksCache(ownerId, ownerEmail);
    }

    const createdId = String(
      workerData?.data?.id || `link_${Date.now()}_${slug}`
    );
    const createdSlug = String(workerData?.data?.slug || slug);
    const shortUrl = `https://lsho.cc/${createdSlug}`;

    await recordGuestLink({
      linkId: createdId,
      slug: createdSlug,
      targetUrl: normalizedUrl,
      shortUrl,
      guestId,
      ipHash,
      expiresAt,
    });

    const [updatedUsage, updatedLinks] = await Promise.all([
      countGuestLinksUsage(guestId, ipHash),
      getGuestLinksWithLiveClicks(guestId, ipHash),
    ]);

    const createdLink = updatedLinks.find((l) => l.slug === createdSlug) || {
      linkId: createdId,
      slug: createdSlug,
      shortUrl,
      targetUrl: normalizedUrl,
      clicksCount: 0,
      expiresAt,
      createdAt: new Date().toISOString(),
      isGuest: true as const,
    };

    const response = NextResponse.json(
      {
        success: true,
        authenticated: false,
        link: createdLink,
        links: updatedLinks,
        usedCount: updatedUsage.effectiveCount,
        remaining: updatedUsage.remaining,
        maxLinks: GUEST_MAX_LINKS,
        limitReached: updatedUsage.limitReached,
      },
      { status: 201, headers: NO_STORE_HEADERS }
    );

    response.cookies.set(GUEST_COOKIE_NAME, signGuestToken(guestId), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: GUEST_COOKIE_MAX_AGE_SEC,
    });

    return response;
  } catch (err: any) {
    console.error("[POST /api/public/shorten] Error:", err);
    return NextResponse.json(
      {
        success: false,
        error:
          "An unexpected error occurred while shortening your link. Please try again.",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}

/**
 * DELETE /api/public/shorten?slug=...
 * Invoked automatically when the 24-hour countdown timer reaches 00:00:00,
 * deleting the link from D1 and Cloudflare Worker KV.
 */
export async function DELETE(req: NextRequest) {
  try {
    const ipHash = getClientIpHash(req);
    const token = req.cookies.get(GUEST_COOKIE_NAME)?.value;
    const guestId = verifyGuestToken(token);

    const url = new URL(req.url);
    let slug = url.searchParams.get("slug") || "";
    if (!slug) {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.slug === "string") slug = body.slug;
    }

    await purgeExpiredGuestLinks().catch(() => {});
    if (slug) {
      await deleteGuestLinkBySlug({ slug, guestId, ipHash }).catch(() => {});
    }

    const [usage, links] = await Promise.all([
      countGuestLinksUsage(guestId, ipHash),
      getGuestLinksWithLiveClicks(guestId, ipHash),
    ]);

    return NextResponse.json(
      {
        success: true,
        links,
        usedCount: usage.effectiveCount,
        remaining: usage.remaining,
        maxLinks: GUEST_MAX_LINKS,
        limitReached: usage.limitReached,
      },
      { headers: NO_STORE_HEADERS }
    );
  } catch (err) {
    console.warn("[DELETE /api/public/shorten] Error:", err);
    return NextResponse.json(
      {
        success: true,
        links: [],
        usedCount: 0,
        remaining: GUEST_MAX_LINKS,
        maxLinks: GUEST_MAX_LINKS,
        limitReached: false,
      },
      { headers: NO_STORE_HEADERS }
    );
  }
}
