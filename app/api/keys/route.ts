import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { WORKER_URL, FRONTEND_SECRET as SECRET } from "@/lib/backend-config";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { executeD1Query, createD1ApiKey } from "@/lib/d1-client";

export async function GET(req: Request) {
  const reqUrl = new URL(req.url);
  const session = await auth().catch(() => null);

  const authHeader = req.headers.get("authorization") || "";
  const frontendSecret = req.headers.get("x-frontend-secret") || "";
  const isInternal = frontendSecret === SECRET || authHeader === `Bearer ${SECRET}`;

  // 1. Authentication check
  if (!session?.user && !isInternal) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  // 2. Derive user identity strictly from session for standard web clients
  const sessionUserId = (session?.user as any)?.id || (session?.user as any)?.sub || "";
  const sessionEmail = session?.user?.email || "";

  let userId = isInternal
    ? (reqUrl.searchParams.get("userId") || sessionUserId)
    : (sessionUserId || reqUrl.searchParams.get("userId") || "");
  let userEmail = isInternal
    ? (reqUrl.searchParams.get("userEmail") || sessionEmail)
    : (sessionEmail || reqUrl.searchParams.get("userEmail") || "");

  // Prevent cross-user IDOR: authenticated users can only request their own keys
  if (!isInternal && sessionUserId && userId !== sessionUserId && !sessionUserId.includes("@")) {
    userId = sessionUserId;
  }

  // If userId is missing or email-shaped, resolve authoritative Convex userId
  if ((!userId || userId === "usr_anonymous" || userId.includes("@")) && userEmail) {
    try {
      const cu = await convex.query(api.users.getUserByEmail, {
        email: userEmail.toLowerCase().trim(),
      });
      if (cu?.userId) {
        userId = cu.userId;
      }
    } catch (e) {
      console.warn("[app/api/keys/route.ts GET] Convex lookup warning:", e);
    }
  }

  const effectiveId = userId || userEmail;
  if (!effectiveId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    let cfList: any[] = [];

    // Attempt 1: Fetch via Cloudflare Worker
    try {
      const cfRes = await fetch(
        `${WORKER_URL}/api/v1/users/${encodeURIComponent(effectiveId)}/keys`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "X-Frontend-Secret": SECRET,
          },
          cache: "no-store",
        }
      );
      if (cfRes.ok) {
        const cfJson = await cfRes.json().catch(() => null);
        cfList = Array.isArray(cfJson?.data)
          ? cfJson.data
          : Array.isArray(cfJson)
          ? cfJson
          : [];
      }
    } catch (workerErr) {
      console.warn("[app/api/keys/route.ts GET] Cloudflare worker fetch warning:", workerErr);
    }

    // Attempt 2: If worker returned empty or failed, query Cloudflare D1 directly
    if (cfList.length === 0) {
      try {
        const d1Rows = await executeD1Query(
          `SELECT id, user_id, name, key_prefix, raw_key, scope, rate_limit, last_used_at, created_at 
           FROM api_keys 
           WHERE user_id = ? OR user_id = ? 
           ORDER BY created_at DESC`,
          [effectiveId, userEmail || effectiveId]
        );
        if (d1Rows && d1Rows.length > 0) {
          cfList = d1Rows;
        }
      } catch (d1Err) {
        console.warn("[app/api/keys/route.ts GET] Direct D1 fallback warning:", d1Err);
      }
    }

    return NextResponse.json({ success: true, data: cfList });
  } catch (error) {
    console.error("[API Keys GET] Error retrieving keys from Cloudflare:", error);
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(req: Request) {
  try {
    const reqUrl = new URL(req.url);
    const session = await auth().catch(() => null);
    const body = await req.json().catch(() => ({}));

    const authHeader = req.headers.get("authorization") || "";
    const frontendSecret = req.headers.get("x-frontend-secret") || "";
    const isInternal = frontendSecret === SECRET || authHeader === `Bearer ${SECRET}`;

    // 1. Authentication check
    if (!session?.user && !isInternal) {
      return NextResponse.json(
        { success: false, error: "Authentication required to generate API keys." },
        { status: 401 }
      );
    }

    const sessionUserId = (session?.user as any)?.id || (session?.user as any)?.sub || "";
    const sessionEmail = session?.user?.email || "";

    let userId = isInternal
      ? (body.userId || reqUrl.searchParams.get("userId") || sessionUserId)
      : (sessionUserId || reqUrl.searchParams.get("userId") || "");
    let userEmail = isInternal
      ? (body.userEmail || reqUrl.searchParams.get("userEmail") || sessionEmail)
      : (sessionEmail || reqUrl.searchParams.get("userEmail") || "");

    // If userId is missing or email-shaped, resolve authoritative Convex userId
    if ((!userId || userId === "usr_anonymous" || userId.includes("@")) && userEmail) {
      try {
        const cu = await convex.query(api.users.getUserByEmail, {
          email: userEmail.toLowerCase().trim(),
        });
        if (cu?.userId) {
          userId = cu.userId;
        }
      } catch (e) {
        console.warn("[app/api/keys/route.ts POST] Convex lookup warning:", e);
      }
    }

    const effectiveId = userId || userEmail;
    if (!effectiveId) {
      return NextResponse.json(
        { success: false, error: "Authentication required to generate API keys." },
        { status: 401 }
      );
    }

    const keyName = (body.name || "Clé API").trim();
    const keyScope = body.scope || "read_write";

    // Attempt 1: Create via Cloudflare Worker
    try {
      const cfRes = await fetch(
        `${WORKER_URL}/api/v1/users/${encodeURIComponent(effectiveId)}/keys`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Frontend-Secret": SECRET,
          },
          body: JSON.stringify({
            name: keyName,
            scope: keyScope,
          }),
        }
      );

      if (cfRes.ok) {
        const cfJson = await cfRes.json().catch(() => null);
        const cfData = cfJson?.data || cfJson;
        return NextResponse.json({ success: true, data: cfData }, { status: 201 });
      }

      // If status is 429 (Rate limit) or worker failed, smoothly fall through to direct D1 creation
      console.warn(`[app/api/keys/route.ts POST] Worker returned ${cfRes.status}, failing over to direct D1 creation.`);
    } catch (workerErr) {
      console.warn("[app/api/keys/route.ts POST] Worker request error, failing over to direct D1:", workerErr);
    }

    // Attempt 2: Direct Cloudflare D1 insertion (Bypasses any worker route rate limiting)
    const directKey = await createD1ApiKey({
      userId: effectiveId,
      name: keyName,
      scope: keyScope,
      rateLimit: 600,
    });

    if (directKey) {
      return NextResponse.json({ success: true, data: directKey }, { status: 201 });
    }

    return NextResponse.json(
      { success: false, error: "Erreur création clé API" },
      { status: 500 }
    );
  } catch (error: any) {
    console.error("[API Keys POST] Error generating key on Cloudflare:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur création clé API" },
      { status: 500 }
    );
  }
}
