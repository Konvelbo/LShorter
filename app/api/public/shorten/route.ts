import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { isSafeHttpUrl, checkRateLimit } from "@/lib/security-utils";
import { guardLinkCreation } from "@/lib/billing/quota-service";
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
 * Returns the current guest session's unclaimed links with live D1 click counts,
 * plus accurate quota usage (cookie + IP).
 */
export async function GET(req: NextRequest) {
  try {
    const ipHash = getClientIpHash(req);
    const token = req.cookies.get(GUEST_COOKIE_NAME)?.value;
    const guestId = verifyGuestToken(token);

    const [usage, links] = await Promise.all([
      countGuestLinksUsage(guestId, ipHash),
      guestId ? getGuestLinksWithLiveClicks(guestId) : Promise.resolve([]),
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
 * - Authenticated users: creates a permanent short link under their real account (subject to plan quota).
 * - Unauthenticated guests: creates a 3-day short link with a strict 2-link limit (cookie + IP hash).
 */
export async function POST(req: NextRequest) {
  try {
    const ipHash = getClientIpHash(req);

    // Burst rate limit per IP (12 attempts / minute) to block automated scraping
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

    const rawUrl = typeof body.targetUrl === "string" ? body.targetUrl.trim() : "";
    if (!rawUrl) {
      return NextResponse.json(
        { success: false, error: "Please paste a valid URL to shorten." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    if (rawUrl.length > 2048) {
      return NextResponse.json(
        { success: false, error: "URL is too long (maximum 2,048 characters)." },
        { status: 400, headers: NO_STORE_HEADERS }
      );
    }

    const normalizedUrl = normalizeInputUrl(rawUrl);
    if (!isSafeHttpUrl(normalizedUrl)) {
      return NextResponse.json(
        {
          success: false,
          error: "Please enter a valid public http:// or https:// website URL.",
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

    // ─── Check if caller is already authenticated ─────────────────────────
    const session = await auth().catch(() => null);
    const isAuthenticated = Boolean(
      session?.user && !(session.user as { userNotFound?: boolean }).userNotFound
    );

    if (isAuthenticated && session?.user) {
      const userEmail = (session.user.email || "").toLowerCase().trim();
      let userId = session.user.id || "";
      let authoritativePlan = ((session.user as { plan?: string }).plan || "FREE").toUpperCase();

      if (userEmail) {
        try {
          const cu = await convex.query(api.users.getUserByEmail, { email: userEmail });
          if (cu?.userId) userId = cu.userId;
          if (cu?.plan) authoritativePlan = String(cu.plan).toUpperCase();
        } catch {}
      }

      const effectivePlan =
        authoritativePlan === "FREEMIUM" || authoritativePlan === "STARTER" || !authoritativePlan
          ? "FREE"
          : authoritativePlan;

      // Enforce account link quota
      const initialCheck = guardLinkCreation(effectivePlan as any, 0);
      if (!initialCheck.allowed || initialCheck.limit !== -1) {
        try {
          const countUrl = new URL(`${WORKER_URL}/api/v1/links`);
          if (userId) countUrl.searchParams.set("userId", userId);
          if (userEmail) countUrl.searchParams.set("userEmail", userEmail);
          countUrl.searchParams.set("limit", "1");
          const countRes = await fetch(countUrl.toString(), {
            headers: {
              "X-Frontend-Secret": FRONTEND_SECRET || "",
              Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
              ...(userId ? { "X-User-Id": userId } : {}),
              ...(userEmail ? { "X-User-Email": userEmail } : {}),
            },
            cache: "no-store",
          });
          if (countRes.ok) {
            const countData = await countRes.json().catch(() => ({}));
            const currentCount = Number(countData?.pagination?.total ?? countData?.total ?? 0);
            const limitCheck = guardLinkCreation(effectivePlan as any, currentCount);
            if (!limitCheck.allowed) {
              return NextResponse.json(
                {
                  success: false,
                  code: "PLAN_UPGRADE_REQUIRED",
                  error: `You've reached your ${effectivePlan} plan limit (${currentCount}/${limitCheck.limit} links). Upgrade to create more links.`,
                },
                { status: 403, headers: NO_STORE_HEADERS }
              );
            }
          }
        } catch {}
      }

      const slug = generateGuestSlug();
      const workerRes = await fetch(`${WORKER_URL}/api/v1/links`, {
        method: "POST",
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET || "",
          Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
          "X-User-Id": userId,
          "X-User-Email": userEmail,
          "X-User-Plan": effectivePlan,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          user_id: userId,
          userEmail,
          user_email: userEmail,
          userName: session.user.name || "User",
          domainName: "lsho.cc",
          slug,
          targetUrl: normalizedUrl,
          target_url: normalizedUrl,
          isActive: true,
          is_active: 1,
          pathLockMode: "off",
          plan: effectivePlan,
        }),
        cache: "no-store",
      });

      const workerData = await workerRes.json().catch(() => ({}));
      if (!workerRes.ok) {
        return NextResponse.json(
          {
            success: false,
            error: workerData?.error || "Unable to create short link right now. Please retry.",
          },
          { status: 502, headers: NO_STORE_HEADERS }
        );
      }

      invalidateServerLinksCache(userId, userEmail);

      const finalSlug = workerData?.data?.slug || slug;
      const finalId = workerData?.data?.id || `link_${Date.now()}`;
      return NextResponse.json(
        {
          success: true,
          authenticated: true,
          link: {
            linkId: finalId,
            slug: finalSlug,
            shortUrl: `https://lsho.cc/${finalSlug}`,
            targetUrl: normalizedUrl,
            clicksCount: 0,
            expiresAt: null,
            createdAt: new Date().toISOString(),
            isGuest: false,
          },
        },
        { status: 201, headers: NO_STORE_HEADERS }
      );
    }

    // ─── Unauthenticated Guest Path (strict 2-link limit, 3-day TTL) ──────
    const existingToken = req.cookies.get(GUEST_COOKIE_NAME)?.value;
    const existingGuestId = verifyGuestToken(existingToken);

    const usage = await countGuestLinksUsage(existingGuestId, ipHash);
    if (usage.limitReached) {
      const existingLinks = existingGuestId
        ? await getGuestLinksWithLiveClicks(existingGuestId)
        : [];
      return NextResponse.json(
        {
          success: false,
          code: "GUEST_LIMIT_REACHED",
          error:
            "You've reached the limit of 2 links without an account. Create a free account to keep your links forever and continue shortening.",
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

    const workerRes = await fetch(`${WORKER_URL}/api/v1/links`, {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET || "",
        Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
        "X-User-Id": guestId,
        "X-User-Email": `${guestId}@guest.lsho.cc`,
        "X-User-Name": "Guest",
        // System-enforced 3-day guest TTL (no user-supplied protection/routing rules allowed)
        "X-User-Plan": "PRO",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: guestId,
        user_id: guestId,
        userEmail: `${guestId}@guest.lsho.cc`,
        user_email: `${guestId}@guest.lsho.cc`,
        userName: "Guest",
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
          error: workerData?.error || "Could not create your short link. Please try again.",
        },
        { status: 502, headers: NO_STORE_HEADERS }
      );
    }

    const createdId = String(workerData?.data?.id || `link_${Date.now()}_${slug}`);
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
      getGuestLinksWithLiveClicks(guestId),
    ]);

    const createdLink =
      updatedLinks.find((l) => l.slug === createdSlug) || {
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
        error: "An unexpected error occurred while shortening your link. Please try again.",
      },
      { status: 500, headers: NO_STORE_HEADERS }
    );
  }
}
