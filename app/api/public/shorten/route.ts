import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { isSafeHttpUrl, checkRateLimit } from "@/lib/security-utils";
import { invalidateServerLinksCache } from "@/lib/server-links-cache";
import {
  invalidateWorkerLinkCache,
  invalidateBotResponseCache,
} from "@/lib/redirect-engine";
import { executeD1Query } from "@/lib/d1-client";
import { guardLinkCreation } from "@/lib/billing/quota-service";
import type { PlanType } from "@/types";
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
  claimGuestLinksForUser,
  isDisallowedLoopHost,
} from "@/lib/guest-links";

const NO_STORE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
  Pragma: "no-cache",
  Expires: "0",
};

interface ResolvedAuthUser {
  userId: string;
  userEmail: string;
  userName: string;
  effectivePlan: PlanType;
}

interface HeroLinkItem {
  linkId: string;
  slug: string;
  shortUrl: string;
  targetUrl: string;
  clicksCount: number;
  expiresAt: string | null;
  createdAt: string;
  isGuest: boolean;
}

function normalizeInputUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+([/?#].*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

async function resolveAuthenticatedUser(): Promise<ResolvedAuthUser | null> {
  const session = await auth().catch(() => null);
  const sessionUser = session?.user as
    | {
        id?: string;
        email?: string | null;
        name?: string | null;
        plan?: string;
        userNotFound?: boolean;
      }
    | undefined;

  if (!sessionUser || sessionUser.userNotFound) {
    return null;
  }

  const userEmail = (sessionUser.email || "").toLowerCase().trim();
  let userId = sessionUser.id || "";
  let rawPlan = (sessionUser.plan || "").toUpperCase();

  try {
    let cu: { userId?: string; plan?: string; name?: string } | null = null;
    if (userEmail) {
      cu = await convex.query(api.users.getUserByEmail, { email: userEmail });
    }
    if (!cu && userId && userId !== "usr_anonymous") {
      cu = await convex.query(api.users.getCurrentUser, {
        userId,
        email: userEmail || undefined,
      });
    }
    if (cu?.userId) {
      userId = cu.userId;
    }
    if (cu?.plan) {
      rawPlan = String(cu.plan).toUpperCase();
    }
  } catch (e) {
    console.warn("[/api/public/shorten] Convex user resolution warning:", e);
  }

  if (!userId || userId === "usr_anonymous") {
    return null;
  }

  const effectivePlan: PlanType =
    rawPlan === "PRO" || rawPlan === "BUSINESS" || rawPlan === "ENTERPRISE"
      ? (rawPlan as PlanType)
      : "FREE";

  return {
    userId,
    userEmail: userEmail || `${userId}@user.lsho.cc`,
    userName: sessionUser.name || "User",
    effectivePlan,
  };
}

async function fetchAuthenticatedOwnedLink(
  slug: string,
  user: ResolvedAuthUser
): Promise<HeroLinkItem | null> {
  const cleanSlug = slug.trim();
  if (!cleanSlug) return null;

  // 1. Fast direct D1 lookup scoped to the authenticated user
  try {
    const rows = await executeD1Query<{
      id: string;
      slug: string;
      target_url: string;
      user_id: string | null;
      clicks_count: number | null;
      expires_at: string | null;
      created_at: string | null;
    }>(
      `SELECT id, slug, target_url, user_id, clicks_count, expires_at, created_at
       FROM links
       WHERE LOWER(slug) = LOWER(?) AND user_id = ?
       LIMIT 1`,
      [cleanSlug, user.userId]
    );

    const row = rows[0];
    if (row) {
      return {
        linkId: String(row.id),
        slug: String(row.slug),
        shortUrl: `https://lsho.cc/${row.slug}`,
        targetUrl: String(row.target_url),
        clicksCount: Number(row.clicks_count ?? 0),
        expiresAt: null,
        createdAt: row.created_at || new Date().toISOString(),
        isGuest: false,
      };
    }
  } catch {
    // Fall through to Cloudflare Worker API lookup
  }

  // 2. Fallback lookup via Cloudflare Worker API
  try {
    const url = new URL(`${WORKER_URL}/api/v1/links`);
    url.searchParams.set("userId", user.userId);
    url.searchParams.set("userEmail", user.userEmail);
    url.searchParams.set("limit", "25");

    const res = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET || "",
        Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
        "X-User-Id": user.userId,
        "X-User-Email": user.userEmail,
      },
      cache: "no-store",
    });

    if (res.ok) {
      const payload = await res.json().catch(() => null);
      const list = Array.isArray(payload?.data)
        ? payload.data
        : Array.isArray(payload?.data?.data)
          ? payload.data.data
          : [];
      const match = list.find(
        (item: { slug?: string }) =>
          String(item?.slug || "").toLowerCase() === cleanSlug.toLowerCase()
      );
      if (match) {
        return {
          linkId: String(match.id || `link_${cleanSlug}`),
          slug: String(match.slug || cleanSlug),
          shortUrl: `https://lsho.cc/${match.slug || cleanSlug}`,
          targetUrl: String(match.target_url || match.targetUrl || ""),
          clicksCount: Number(
            match.clicks_count ?? match.clicksCount ?? match.clicks ?? 0
          ),
          expiresAt: null,
          createdAt:
            match.created_at || match.createdAt || new Date().toISOString(),
          isGuest: false,
        };
      }
    }
  } catch {
    // ignore fallback error
  }

  return null;
}

/**
 * GET /api/public/shorten
 * - For authenticated users: auto-claims any lingering guest link into their permanent
 *   account and returns live clicks for their Hero link with NO expiration and NO 1-link cap.
 * - For guests: purges expired 24h links and returns their active guest link + 1-link quota.
 */
export async function GET(req: NextRequest) {
  try {
    const ipHash = getClientIpHash(req);
    const token = req.cookies.get(GUEST_COOKIE_NAME)?.value;
    const guestId = verifyGuestToken(token);
    const hintSlug = req.nextUrl.searchParams.get("slug")?.trim() || null;

    const authUser = await resolveAuthenticatedUser();
    if (authUser) {
      // Silently claim any pre-login guest link into this permanent dashboard account
      const claimed = await claimGuestLinksForUser({
        guestId,
        ipHash,
        userId: authUser.userId,
        userEmail: authUser.userEmail,
        userName: authUser.userName,
        userPlan: authUser.effectivePlan,
      }).catch(() => ({ claimedCount: 0, claimedSlugs: [] as string[] }));

      const slugToFetch = hintSlug || claimed.claimedSlugs[0] || null;
      const ownedLink = slugToFetch
        ? await fetchAuthenticatedOwnedLink(slugToFetch, authUser)
        : null;

      return NextResponse.json(
        {
          success: true,
          authenticated: true,
          links: ownedLink ? [ownedLink] : [],
          usedCount: 0,
          remaining: -1,
          maxLinks: -1,
          limitReached: false,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

    const links = await getGuestLinksWithLiveClicks(guestId, ipHash, hintSlug);
    const usage = await countGuestLinksUsage(
      guestId || links[0]?.guestId || null,
      ipHash,
      hintSlug
    );

    const response = NextResponse.json(
      {
        success: true,
        authenticated: false,
        links,
        usedCount: Math.max(usage.effectiveCount, links.length),
        remaining: Math.max(
          0,
          GUEST_MAX_LINKS - Math.max(usage.effectiveCount, links.length)
        ),
        maxLinks: GUEST_MAX_LINKS,
        limitReached:
          usage.limitReached || links.length >= GUEST_MAX_LINKS,
      },
      { headers: NO_STORE_HEADERS }
    );

    const activeGuestId = guestId || links[0]?.guestId;
    if (activeGuestId && !guestId) {
      response.cookies.set(GUEST_COOKIE_NAME, signGuestToken(activeGuestId), {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: GUEST_COOKIE_MAX_AGE_SEC,
      });
    }

    return response;
  } catch (err) {
    console.warn("[GET /api/public/shorten] Error:", err);
    return NextResponse.json(
      {
        success: true,
        authenticated: false,
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
 * - For authenticated users: bypasses the 1-link guest cap, enforces real plan quota,
 *   saves the link permanently (`expires_at = NULL`) directly into their Dashboard account,
 *   and invalidates Dashboard caches so it appears immediately.
 * - For guests: creates a 24-hour temporary short link with a strict 1-link limit.
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

    let body: { targetUrl?: string; existingSlug?: string } = {};
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

    // ── AUTHENTICATED PATH: Permanent link saved straight to Dashboard (NO 1-link cap, NO 24h expiry) ──
    const authUser = await resolveAuthenticatedUser();
    if (authUser) {
      // Enforce real account plan link quota (Starter: 50, Pro: 1,000, Business/Enterprise: unlimited)
      const initialQuotaCheck = guardLinkCreation(authUser.effectivePlan, 0);
      if (!initialQuotaCheck.allowed || initialQuotaCheck.limit !== -1) {
        try {
          const countUrl = new URL(`${WORKER_URL}/api/v1/links`);
          countUrl.searchParams.set("userId", authUser.userId);
          countUrl.searchParams.set("userEmail", authUser.userEmail);
          countUrl.searchParams.set("limit", "1");
          const countRes = await fetch(countUrl.toString(), {
            headers: {
              "X-Frontend-Secret": FRONTEND_SECRET || "",
              Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
              "X-User-Id": authUser.userId,
              "X-User-Email": authUser.userEmail,
            },
            cache: "no-store",
          });
          if (countRes.ok) {
            const countData = await countRes.json();
            const currentCount = Number(
              countData?.pagination?.total ?? countData?.total ?? 0
            );
            const limitCheck = guardLinkCreation(
              authUser.effectivePlan,
              currentCount
            );
            if (!limitCheck.allowed) {
              return NextResponse.json(
                {
                  success: false,
                  code: "PLAN_UPGRADE_REQUIRED",
                  error: `You have reached your ${authUser.effectivePlan} plan limit (${currentCount}/${limitCheck.limit} links). Upgrade your plan in the dashboard to create more links.`,
                },
                { status: 403, headers: NO_STORE_HEADERS }
              );
            }
          }
        } catch (countErr) {
          console.warn(
            "[POST /api/public/shorten] Authenticated quota check warning:",
            countErr
          );
        }
      }

      // Ensure user row exists in D1 before link creation
      await executeD1Query(
        `INSERT OR IGNORE INTO users (id, email, name, plan, created_at)
         VALUES (?, ?, ?, ?, datetime('now'))`,
        [
          authUser.userId,
          authUser.userEmail,
          authUser.userName,
          authUser.effectivePlan,
        ]
      ).catch(() => {});

      const slug = generateGuestSlug();
      const workerRes = await fetch(`${WORKER_URL}/api/v1/links`, {
        method: "POST",
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET || "",
          Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
          "X-User-Id": authUser.userId,
          "X-User-Email": authUser.userEmail,
          "X-User-Name": authUser.userName,
          "X-User-Plan": authUser.effectivePlan,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: authUser.userId,
          user_id: authUser.userId,
          userEmail: authUser.userEmail,
          user_email: authUser.userEmail,
          userName: authUser.userName,
          user_name: authUser.userName,
          domainName: "lsho.cc",
          slug,
          targetUrl: normalizedUrl,
          target_url: normalizedUrl,
          expiresAt: null,
          expires_at: null,
          isActive: true,
          is_active: 1,
          pathLockMode: "off",
          tags: ["hero-shortener"],
          plan: authUser.effectivePlan,
          userPlan: authUser.effectivePlan,
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

      const createdId = String(
        workerData?.data?.id || `link_${Date.now()}_${slug}`
      );
      const createdSlug = String(workerData?.data?.slug || slug);
      const shortUrl = `https://lsho.cc/${createdSlug}`;

      // Immediately refresh Dashboard link lists & edge caches
      invalidateServerLinksCache(authUser.userId, authUser.userEmail);
      try {
        invalidateWorkerLinkCache(createdSlug);
        invalidateBotResponseCache(createdSlug);
      } catch {}

      // Silently claim any pre-login guest links so nothing is orphaned
      if (existingGuestId || ipHash) {
        await claimGuestLinksForUser({
          guestId: existingGuestId,
          ipHash,
          userId: authUser.userId,
          userEmail: authUser.userEmail,
          userName: authUser.userName,
          userPlan: authUser.effectivePlan,
        }).catch(() => {});
      }

      const createdLink: HeroLinkItem = {
        linkId: createdId,
        slug: createdSlug,
        shortUrl,
        targetUrl: normalizedUrl,
        clicksCount: 0,
        expiresAt: null,
        createdAt: new Date().toISOString(),
        isGuest: false,
      };

      return NextResponse.json(
        {
          success: true,
          authenticated: true,
          link: createdLink,
          links: [createdLink],
          usedCount: 0,
          remaining: -1,
          maxLinks: -1,
          limitReached: false,
        },
        { status: 201, headers: NO_STORE_HEADERS }
      );
    }

    // ── GUEST PATH: Strict 1-link limit + 24h TTL ──
    const hintSlug =
      typeof body.existingSlug === "string" ? body.existingSlug.trim() : null;

    const existingLinks = await getGuestLinksWithLiveClicks(
      existingGuestId,
      ipHash,
      hintSlug
    );
    const usage = await countGuestLinksUsage(existingGuestId, ipHash, hintSlug);
    if (usage.limitReached || existingLinks.length >= GUEST_MAX_LINKS) {
      return NextResponse.json(
        {
          success: false,
          code: "GUEST_LIMIT_REACHED",
          error:
            "You've reached the 1-link limit. Create a free account to keep your link forever in your dashboard and shorten more links.",
          links: existingLinks,
          usedCount: Math.max(usage.effectiveCount, existingLinks.length),
          remaining: 0,
          maxLinks: GUEST_MAX_LINKS,
          limitReached: true,
        },
        { status: 403, headers: NO_STORE_HEADERS }
      );
    }

    const guestId = existingGuestId || createGuestId();
    const slug = generateGuestSlug();
    const heroExpiresAt = new Date(Date.now() + GUEST_LINK_TTL_MS).toISOString();
    const ownerEmail = `${guestId}@guest.lsho.cc`;

    const workerRes = await fetch(`${WORKER_URL}/api/v1/links`, {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET || "",
        Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
        "X-User-Id": guestId,
        "X-User-Email": ownerEmail,
        "X-User-Name": "Guest",
        "X-User-Plan": "FREE",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        userId: guestId,
        user_id: guestId,
        userEmail: ownerEmail,
        user_email: ownerEmail,
        userName: "Guest",
        domainName: "lsho.cc",
        slug,
        targetUrl: normalizedUrl,
        target_url: normalizedUrl,
        expiresAt: heroExpiresAt,
        expires_at: heroExpiresAt,
        isActive: true,
        is_active: 1,
        pathLockMode: "off",
        tags: ["guest-hero"],
        plan: "FREE",
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
      expiresAt: heroExpiresAt,
      claimedBy: null,
    });

    const [updatedUsage, updatedLinks] = await Promise.all([
      countGuestLinksUsage(guestId, ipHash, createdSlug),
      getGuestLinksWithLiveClicks(guestId, ipHash, createdSlug),
    ]);

    const createdLink = updatedLinks.find((l) => l.slug === createdSlug) || {
      linkId: createdId,
      slug: createdSlug,
      shortUrl,
      targetUrl: normalizedUrl,
      clicksCount: 0,
      expiresAt: heroExpiresAt,
      createdAt: new Date().toISOString(),
      isGuest: true as const,
    };

    const response = NextResponse.json(
      {
        success: true,
        authenticated: false,
        link: createdLink,
        links: updatedLinks.length > 0 ? updatedLinks : [createdLink],
        usedCount: Math.max(updatedUsage.effectiveCount, 1),
        remaining: 0,
        maxLinks: GUEST_MAX_LINKS,
        limitReached: true,
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
 * Invoked automatically when a guest's 24-hour countdown timer reaches 00:00:00,
 * deleting the link from D1 and Cloudflare Worker KV (if unclaimed).
 * Authenticated permanent account links are never deleted here.
 */
export async function DELETE(req: NextRequest) {
  try {
    const authUser = await resolveAuthenticatedUser();
    if (authUser) {
      return NextResponse.json(
        {
          success: true,
          authenticated: true,
          links: [],
          usedCount: 0,
          remaining: -1,
          maxLinks: -1,
          limitReached: false,
        },
        { headers: NO_STORE_HEADERS }
      );
    }

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
        authenticated: false,
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
        authenticated: false,
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
