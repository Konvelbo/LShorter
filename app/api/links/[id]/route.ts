import { NextResponse } from "next/server";
import {
  invalidateBotResponseCache,
  invalidateWorkerLinkCache,
  saveLinkExtras,
} from "@/lib/redirect-engine";
import { WORKER_URL, FRONTEND_SECRET, CF_ACCOUNT_ID, CF_D1_DATABASE_ID, CF_API_TOKEN } from "@/lib/backend-config";
import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { isSafeHttpUrl, isValidSlug } from "@/lib/security-utils";
import { invalidateServerLinksCache } from "@/lib/server-links-cache";
import { parseBody, parseParams, linkUpdateBodySchema, linkIdParamsSchema } from "@/lib/api-schemas";
import { validateAndPersistOgImage } from "@/lib/og-image-validator";
import { dispatchUserWebhooks } from "@/lib/redirect-engine/webhooks";

function parseTags(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((t: any) => String(t).trim()).filter(Boolean);
      }
      if (typeof parsed === "string") {
        return parsed.split(",").map((t: string) => t.trim()).filter(Boolean);
      }
    } catch {
      return raw.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }
  return [];
}

async function verifyLinkOwnership(
  id: string,
  userId: string,
  userEmail: string,
): Promise<{ ok: boolean; status: number; link?: any }> {
  try {
    const checkRes = await fetch(`${WORKER_URL}/api/v1/links/${encodeURIComponent(id)}`, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
      },
      cache: "no-store",
    });
    if (checkRes.status === 404) return { ok: false, status: 404 };
    if (checkRes.status === 403) return { ok: false, status: 403 };
    if (checkRes.ok) {
      const json = await checkRes.json().catch(() => null);
      const link = json?.data || json;
      const ownerId = String(link?.user_id || link?.userId || "").trim();
      const ownerEmail = String(link?.user_email || link?.userEmail || "").toLowerCase().trim();
      const matchesUser =
        (userId && ownerId === userId) ||
        (userEmail && (ownerId.toLowerCase() === userEmail || ownerEmail === userEmail));
      if (ownerId && !matchesUser) {
        return { ok: false, status: 403 };
      }
      return { ok: true, status: 200, link };
    }
  } catch {}
  return { ok: true, status: 200 };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const { data: pData, error: pError } = parseParams(rawParams, linkIdParamsSchema);
  if (pError) return pError;
  const id = pData.id;

  const session = await auth().catch(() => null);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required." },
      { status: 401 }
    );
  }

  const requestEmail = (session.user.email || "").toLowerCase().trim();
  let requestUserId = session.user.id || "";
  if ((!requestUserId || requestUserId === "usr_anonymous" || requestUserId.includes("@") || !requestUserId.startsWith("usr_")) && requestEmail) {
    try {
      const cu = await convex.query(api.users.getUserByEmail, { email: requestEmail });
      if (cu?.userId) requestUserId = cu.userId;
    } catch {}
  }

  const ownership = await verifyLinkOwnership(id, requestUserId, requestEmail);
  if (!ownership.ok) {
    return NextResponse.json(
      {
        success: false,
        error: ownership.status === 404 ? "Link not found" : "Forbidden",
      },
      { status: ownership.status }
    );
  }

  return NextResponse.json({
    success: true,
    data: ownership.link || null,
  });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const { data: pData, error: pError } = parseParams(rawParams, linkIdParamsSchema);
  if (pError) return pError;
  const id = pData.id;

  const { data: _bodyParsed, error: bodyError } = await parseBody(req, linkUpdateBodySchema);
  if (bodyError) return bodyError;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const body = _bodyParsed as any; // Zod validation done above; cast needed for legacy snake_case fields forwarded to Cloudflare Worker

  let resolvedUserId = "";
  let resolvedUserEmail = "";
  try {
    const session = await auth().catch(() => null);

    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update links." },
        { status: 401 }
      );
    }

    const requestEmail = (session.user.email || "").toLowerCase().trim();
    let requestUserId = session.user.id || "";
    if ((!requestUserId || requestUserId === "usr_anonymous" || requestUserId.includes("@") || !requestUserId.startsWith("usr_")) && requestEmail) {
      try {
        const cu = await convex.query(api.users.getUserByEmail, { email: requestEmail });
        if (cu?.userId) requestUserId = cu.userId;
      } catch {}
    }
    resolvedUserId = requestUserId;
    resolvedUserEmail = requestEmail;

    if (!requestUserId && !requestEmail) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update links." },
        { status: 401 }
      );
    }

    const ownership = await verifyLinkOwnership(id, requestUserId, requestEmail);
    if (ownership.status === 403) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to update this link." },
        { status: 403 }
      );
    }

    if (body.targetUrl || body.target_url) {
      const u = String(body.targetUrl || body.target_url).trim();
      if (!isSafeHttpUrl(u)) {
        return NextResponse.json(
          { success: false, error: "Invalid target URL scheme. Only HTTP and HTTPS are permitted." },
          { status: 400 }
        );
      }
    }

    if (body.fallbackUrl || body.fallback_url) {
      const fb = String(body.fallbackUrl || body.fallback_url).trim();
      if (!isSafeHttpUrl(fb)) {
        return NextResponse.json(
          { success: false, error: "Invalid fallback URL scheme. Only HTTP and HTTPS are permitted." },
          { status: 400 }
        );
      }
    }

    const patchRules = Array.isArray(body.routingRules)
      ? body.routingRules
      : Array.isArray(body.routing_rules)
        ? body.routing_rules
        : [];
    for (const rule of patchRules) {
      const dest = String(rule?.destinationUrl || rule?.destination_url || rule?.targetUrl || rule?.target_url || "").trim();
      if (dest && !isSafeHttpUrl(dest)) {
        return NextResponse.json(
          { success: false, error: "Invalid routing rule destination URL scheme. Only HTTP and HTTPS are permitted." },
          { status: 400 }
        );
      }
    }

    let patchAbVariations: unknown[] = [];
    const patchAbInput = body.abVariations ?? body.ab_variations;
    if (Array.isArray(patchAbInput)) {
      patchAbVariations = patchAbInput;
    } else if (typeof patchAbInput === "string" && patchAbInput.trim()) {
      try {
        const parsedAb = JSON.parse(patchAbInput);
        if (Array.isArray(parsedAb)) patchAbVariations = parsedAb;
      } catch {
        return NextResponse.json(
          { success: false, error: "Invalid A/B variations payload format." },
          { status: 400 }
        );
      }
    }
    for (const variation of patchAbVariations) {
      const vUrl = String((variation as Record<string, unknown>)?.url || "").trim();
      if (vUrl && !isSafeHttpUrl(vUrl)) {
        return NextResponse.json(
          { success: false, error: "Invalid A/B variation destination URL scheme. Only HTTP and HTTPS are permitted." },
          { status: 400 }
        );
      }
    }

    if (body.slug) {
      const slugValidation = isValidSlug(body.slug);
      if (!slugValidation.valid) {
        return NextResponse.json(
          { success: false, error: slugValidation.error },
          { status: 400 }
        );
      }
    }

    // Authoritative plan resolution: strictly from session or Convex DB.
    // Client self-declarations (body.userPlan or body.plan) are NEVER trusted.
    let authoritativePlan = ((session?.user as any)?.plan || "").toUpperCase();
    try {
      let cu: any = null;
      if (requestEmail) {
        cu = await convex.query(api.users.getUserByEmail, { email: requestEmail.toLowerCase().trim() });
      }
      if (!cu && requestUserId && requestUserId !== "usr_anonymous") {
        cu = await convex.query(api.users.getCurrentUser, {
          userId: requestUserId,
          email: requestEmail || undefined,
        });
      }
      if (cu?.plan) {
        authoritativePlan = cu.plan.toUpperCase();
      }
    } catch (e) {
      console.warn("[app/api/links/[id]/route.ts] Error querying Convex plan:", e);
    }

    const effectivePlan = (authoritativePlan === "FREEMIUM" || authoritativePlan === "STARTER" || !authoritativePlan)
      ? "FREE"
      : authoritativePlan;
    const userId = requestUserId || "usr_anonymous";
    const isPro =
      effectivePlan === "PRO" ||
      effectivePlan === "BUSINESS" ||
      effectivePlan === "ENTERPRISE";

    const hasExplicitClearOg = body.ogImage === null || body.og_image === null;
    const ogValidation = await validateAndPersistOgImage(
      body.ogImage ?? body.og_image,
      hasExplicitClearOg,
      userId,
    );
    if (!ogValidation.ok) {
      return NextResponse.json(
        { success: false, error: ogValidation.error },
        { status: ogValidation.status },
      );
    }
    const sanitizedOgImage = ogValidation.value;

    const rawStyle = body.bannerStyle || body.banner_style;
    const rawCard = body.twitterCard || body.twitter_card;
    const isLarge =
      rawCard === "summary_large_image" || rawStyle === "large_banner";
    const isDefaultBanner =
      (rawCard === "summary" || rawStyle === "default_banner" || rawStyle === "summary") && !isLarge;
    const resolvedBannerStyle: "default_banner" | "large_banner" =
      isDefaultBanner ? "default_banner" : "large_banner";
    const resolvedTwitterCard: "summary_large_image" | "summary" =
      isDefaultBanner ? "summary" : "summary_large_image";

    const rawRouting =
      body.routingRules !== undefined ? body.routingRules : body.routing_rules;
    const parsedRouting =
      typeof rawRouting === "string" ? JSON.parse(rawRouting) : rawRouting;
    const rawGeo =
      body.geoTargeting !== undefined ? body.geoTargeting : body.geo_targeting;
    const parsedGeo = typeof rawGeo === "string" ? JSON.parse(rawGeo) : rawGeo;
    const rawDevice =
      body.deviceTargeting !== undefined
        ? body.deviceTargeting
        : body.device_targeting;
    const parsedDevice =
      typeof rawDevice === "string" ? JSON.parse(rawDevice) : rawDevice;

    // Strictly enforce: Dynamic smart routing & protection features require a paid plan (PRO, BUSINESS, ENTERPRISE)
    const hasRouting =
      (Array.isArray(parsedRouting) && parsedRouting.length > 0) ||
      (parsedGeo && Object.keys(parsedGeo).length > 0) ||
      (parsedDevice && Object.keys(parsedDevice).length > 0);

    const rawMaxClicksVal = body.maxClicks ?? body.max_clicks;
    const rawPixelsVal = body.pixels ?? body.pixel_ids;
    const rawPathLockVal = body.pathLockMode || body.path_lock_mode;
    const hasProProtection = Boolean(
      body.password ||
      body.link_password ||
      body.isCloaked ||
      body.is_cloaked ||
      (rawPathLockVal && rawPathLockVal !== "off") ||
      body.hideReferrer ||
      body.hide_referrer ||
      body.expiresAt ||
      body.expires_at ||
      (rawMaxClicksVal !== undefined && rawMaxClicksVal !== null && Number(rawMaxClicksVal) > 0) ||
      body.fallbackUrl ||
      body.fallback_url ||
      (Array.isArray(patchAbVariations) && patchAbVariations.length > 0) ||
      (Array.isArray(rawPixelsVal) && rawPixelsVal.length > 0)
    );

    if (!isPro && (hasRouting || hasProProtection)) {
      return NextResponse.json(
        {
          success: false,
          code: "PLAN_UPGRADE_REQUIRED",
          error: "Cette fonctionnalité avancée est strictement réservée aux forfaits payants (Pro, Business et Enterprise).",
          message: "Cette fonctionnalité avancée est strictement réservée aux forfaits payants (Pro, Business et Enterprise).",
        },
        { status: 403 }
      );
    }

    const targetUrlClean = body.targetUrl || body.target_url;
    const finalPathLockMode = body.pathLockMode || body.path_lock_mode;
    let finalPathLockPrefix = body.pathLockPrefix ?? body.path_lock_prefix;
    if (finalPathLockMode === "strict" && (!finalPathLockPrefix || finalPathLockPrefix.trim() === "") && targetUrlClean) {
      try {
        const u = new URL(targetUrlClean.startsWith("http") ? targetUrlClean : `https://${targetUrlClean}`);
        const p = u.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
        finalPathLockPrefix = p || "/";
      } catch {
        finalPathLockPrefix = "/";
      }
    } else if (finalPathLockMode === "funnel" && (!finalPathLockPrefix || finalPathLockPrefix.trim() === "")) {
      finalPathLockPrefix = "/";
    }

    const expTimeInput = body.expiresAt ?? body.expires_at;
    const isInputExpired = Boolean(
      expTimeInput && new Date(expTimeInput).getTime() <= Date.now(),
    );

    // 3. Forward to Cloudflare Worker
    const workerPayload = {
      ...body,
      userId: requestUserId,
      user_id: requestUserId,
      userEmail: requestEmail,
      user_email: requestEmail,
      targetUrl: targetUrlClean,
      target_url: targetUrlClean,
      ogImage: sanitizedOgImage,
      og_image: sanitizedOgImage,
      ogTitle: body.ogTitle ?? body.og_title,
      og_title: body.ogTitle ?? body.og_title,
      ogDescription: body.ogDescription ?? body.og_description,
      og_description: body.ogDescription ?? body.og_description,
      bannerStyle: resolvedBannerStyle,
      banner_style: resolvedBannerStyle,
      twitterCard: resolvedTwitterCard,
      twitter_card: resolvedTwitterCard,
      metaTitle: body.metaTitle ?? body.meta_title ?? body.ogTitle,
      meta_title: body.meta_title ?? body.metaTitle ?? body.ogTitle,
      redirectType: body.redirectType || body.redirect_type,
      redirect_type: body.redirectType || body.redirect_type,
      passParams:
        body.passParams !== undefined
          ? Boolean(body.passParams)
          : body.pass_params !== undefined
            ? Boolean(body.pass_params)
            : undefined,
      pass_params:
        body.passParams !== undefined
          ? Boolean(body.passParams)
          : body.pass_params !== undefined
            ? Boolean(body.pass_params)
            : undefined,
      routingRules: parsedRouting !== undefined ? parsedRouting : null,
      routing_rules: parsedRouting !== undefined ? parsedRouting : null,
      geoTargeting: parsedGeo !== undefined ? parsedGeo : null,
      geo_targeting: parsedGeo !== undefined ? parsedGeo : null,
      deviceTargeting: parsedDevice !== undefined ? parsedDevice : null,
      device_targeting: parsedDevice !== undefined ? parsedDevice : null,
      pathLockMode: finalPathLockMode,
      path_lock_mode: finalPathLockMode,
      pathLockPrefix: finalPathLockPrefix,
      path_lock_prefix: finalPathLockPrefix,
      pathLockMessage: body.pathLockMessage ?? body.path_lock_message,
      path_lock_message: body.pathLockMessage ?? body.path_lock_message,
      pathLockPassword: body.pathLockPassword ?? body.path_lock_password,
      path_lock_password: body.pathLockPassword ?? body.path_lock_password,
      ...(isInputExpired
        ? { isActive: false, is_active: 0 }
        : {}),
      tags: body.tags !== undefined ? parseTags(body.tags) : undefined,
      plan: effectivePlan,
      userPlan: effectivePlan,
    };

    const persistExtrasAndInvalidate = (resolvedId?: string, resolvedSlug?: string) => {
      const targetSlug = (resolvedSlug || body.slug || id || "").trim();
      saveLinkExtras({ id: resolvedId || id, slug: targetSlug }, workerPayload);
      if (targetSlug) {
        invalidateBotResponseCache(targetSlug);
        invalidateWorkerLinkCache(targetSlug);
      }
      if (id) {
        invalidateBotResponseCache(id);
        invalidateWorkerLinkCache(id);
      }
      invalidateServerLinksCache(resolvedUserId, resolvedUserEmail);
    };

    const url = new URL(`${WORKER_URL}/api/v1/links/${id}`);
    if (userId) url.searchParams.set("userId", userId);
    if (requestEmail) url.searchParams.set("userEmail", requestEmail);

    const res = await fetch(url.toString(), {
      method: "PATCH",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
        ...(requestEmail ? { "X-User-Email": requestEmail } : {}),
        "X-User-Plan": effectivePlan,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workerPayload),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 403 || res.status === 400) {
      if (isPro) {
        const sanitizedBody = { ...workerPayload };
        delete sanitizedBody.password;
        delete sanitizedBody.isCloaked;
        delete sanitizedBody.is_cloaked;
        delete sanitizedBody.routingRules;
        delete sanitizedBody.routing_rules;
        delete sanitizedBody.geoTargeting;
        delete sanitizedBody.geo_targeting;
        delete sanitizedBody.deviceTargeting;
        delete sanitizedBody.device_targeting;

        const retryRes = await fetch(url.toString(), {
          method: "PATCH",
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
            Authorization: `Bearer ${FRONTEND_SECRET}`,
            ...(userId ? { "X-User-Id": userId } : {}),
            ...(requestEmail ? { "X-User-Email": requestEmail } : {}),
            "X-User-Plan": effectivePlan,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sanitizedBody),
        });

        if (retryRes.ok) {
          const retryData = await retryRes.json().catch(() => ({}));
          persistExtrasAndInvalidate(
            (retryData.data as any)?.id || id,
            (retryData.data as any)?.slug || body.slug,
          );
          return NextResponse.json(
            {
              ...retryData,
              data: {
                ...(retryData.data || {}),
                ogImage: sanitizedOgImage,
                og_image: sanitizedOgImage,
                ogTitle: body.ogTitle ?? body.og_title,
                og_title: body.ogTitle ?? body.og_title,
                ogDescription: body.ogDescription ?? body.og_description,
                og_description: body.ogDescription ?? body.og_description,
                metaTitle: body.metaTitle ?? body.meta_title,
                bannerStyle: resolvedBannerStyle,
                banner_style: resolvedBannerStyle,
                twitterCard: resolvedTwitterCard,
                twitter_card: resolvedTwitterCard,
                password: body.password ?? null,
                isCloaked: Boolean(body.isCloaked || body.is_cloaked),
                routingRules: parsedRouting ?? null,
                geoTargeting: parsedGeo ?? null,
                deviceTargeting: parsedDevice ?? null,
                maxClicks:
                  body.maxClicks !== undefined
                    ? body.maxClicks
                      ? Number(body.maxClicks)
                      : null
                    : undefined,
                fallbackUrl: body.fallbackUrl ?? body.fallback_url ?? null,
                pathLockMode: body.pathLockMode || body.path_lock_mode,
                path_lock_mode: body.pathLockMode || body.path_lock_mode,
                pathLockPrefix: body.pathLockPrefix ?? body.path_lock_prefix,
                path_lock_prefix: body.pathLockPrefix ?? body.path_lock_prefix,
                pathLockMessage: body.pathLockMessage ?? body.path_lock_message,
                path_lock_message:
                  body.pathLockMessage ?? body.path_lock_message,
                pathLockPassword:
                  body.pathLockPassword ?? body.path_lock_password,
                path_lock_password:
                  body.pathLockPassword ?? body.path_lock_password,
              },
            },
            { status: 200 },
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          error:
            (data as any)?.error ||
            (res.status === 403
              ? "Forbidden: You do not have permission to update this link."
              : "Invalid link update payload."),
        },
        { status: res.status },
      );
    }

    // 4. If worker returns 404, look up real worker link ID by slug strictly within caller's own links
    if (res.status === 404) {
      try {
        const slugToFind = body.slug || id;
        const listUrl = new URL(`${WORKER_URL}/api/v1/links`);
        if (userId) listUrl.searchParams.set("userId", userId);
        if (requestEmail) listUrl.searchParams.set("userEmail", requestEmail);
        const listRes = await fetch(listUrl.toString(), {
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
            Authorization: `Bearer ${FRONTEND_SECRET}`,
            ...(userId ? { "X-User-Id": userId } : {}),
            ...(requestEmail ? { "X-User-Email": requestEmail } : {}),
          },
          cache: "no-store",
        });

        if (listRes.ok) {
          const listJson = await listRes.json();
          const list = Array.isArray(listJson.data) ? listJson.data : [];
          const found = list.find(
            (l: any) =>
              l.slug?.toLowerCase() === slugToFind.toLowerCase() || l.id === id,
          );
          if (found && found.id && found.id !== id) {
            const retryPatchUrl = new URL(`${WORKER_URL}/api/v1/links/${found.id}`);
            if (userId) retryPatchUrl.searchParams.set("userId", userId);
            if (requestEmail) retryPatchUrl.searchParams.set("userEmail", requestEmail);
            const retryPatch = await fetch(retryPatchUrl.toString(), {
              method: "PATCH",
              headers: {
                "X-Frontend-Secret": FRONTEND_SECRET,
                Authorization: `Bearer ${FRONTEND_SECRET}`,
                ...(userId ? { "X-User-Id": userId } : {}),
                ...(requestEmail ? { "X-User-Email": requestEmail } : {}),
                "X-User-Plan": effectivePlan,
                "Content-Type": "application/json",
              },
              body: JSON.stringify(workerPayload),
            });
            if (retryPatch.ok) {
              const patchData = await retryPatch.json().catch(() => ({}));
              persistExtrasAndInvalidate(found.id, found.slug || body.slug);
              return NextResponse.json(
                {
                  success: true,
                  data: {
                    ...(patchData.data || patchData),
                    bannerStyle: resolvedBannerStyle,
                    banner_style: resolvedBannerStyle,
                    twitterCard: resolvedTwitterCard,
                    twitter_card: resolvedTwitterCard,
                    tags: body.tags !== undefined ? parseTags(body.tags) : parseTags((patchData.data || patchData)?.tags),
                  },
                },
                { status: 200 },
              );
            }
          }
        }
      } catch (lookupErr) {
        console.warn(
          "[Links Proxy PATCH] Caller-scoped link lookup failed:",
          lookupErr,
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: (data as any)?.error || "Link not found or not owned by current user.",
        },
        { status: 404 },
      );
    }

    if (!res.ok) {
      console.warn(
        "[Links Proxy PATCH] Worker returned error status:",
        res.status,
      );
      return NextResponse.json(
        {
          success: false,
          error: (data as any)?.error || "Failed to update link.",
        },
        { status: res.status },
      );
    }

    persistExtrasAndInvalidate(
      (data.data as any)?.id || id,
      (data.data as any)?.slug || body.slug,
    );
    if (requestUserId) {
      dispatchUserWebhooks(requestUserId, "link.updated", {
        linkId: (data.data as any)?.id || id,
        slug: (data.data as any)?.slug || body.slug || "",
        targetUrl: targetUrlClean || (data.data as any)?.targetUrl || (data.data as any)?.target_url || "",
      }).catch(() => {});
    }
    return NextResponse.json(
      {
        ...data,
        success: true,
        data: {
          ...(data.data || {}),
          ogImage: sanitizedOgImage,
          og_image: sanitizedOgImage,
          ogTitle: body.ogTitle ?? body.og_title,
          og_title: body.ogTitle ?? body.og_title,
          ogDescription: body.ogDescription ?? body.og_description,
          og_description: body.ogDescription ?? body.og_description,
          metaTitle: body.metaTitle ?? body.meta_title,
          bannerStyle: resolvedBannerStyle,
          banner_style: resolvedBannerStyle,
          twitterCard: resolvedTwitterCard,
          twitter_card: resolvedTwitterCard,
          password: body.password ?? null,
          isCloaked: Boolean(body.isCloaked || body.is_cloaked),
          routingRules: parsedRouting ?? null,
          routing_rules: parsedRouting ?? null,
          geoTargeting: parsedGeo ?? null,
          geo_targeting: parsedGeo ?? null,
          deviceTargeting: parsedDevice ?? null,
          device_targeting: parsedDevice ?? null,
          maxClicks:
            body.maxClicks !== undefined
              ? body.maxClicks
                ? Number(body.maxClicks)
                : null
              : undefined,
          fallbackUrl: body.fallbackUrl ?? body.fallback_url ?? null,
          pathLockMode:
            body.pathLockMode ||
            body.path_lock_mode ||
            (data.data as any)?.pathLockMode ||
            (data.data as any)?.path_lock_mode,
          path_lock_mode:
            body.pathLockMode ||
            body.path_lock_mode ||
            (data.data as any)?.path_lock_mode ||
            (data.data as any)?.pathLockMode,
          pathLockPrefix:
            body.pathLockPrefix ??
            body.path_lock_prefix ??
            (data.data as any)?.pathLockPrefix ??
            (data.data as any)?.path_lock_prefix,
          path_lock_prefix:
            body.pathLockPrefix ??
            body.path_lock_prefix ??
            (data.data as any)?.path_lock_prefix ??
            (data.data as any)?.pathLockPrefix,
          pathLockMessage:
            body.pathLockMessage ??
            body.path_lock_message ??
            (data.data as any)?.pathLockMessage ??
            (data.data as any)?.path_lock_message,
          path_lock_message:
            body.pathLockMessage ??
            body.path_lock_message ??
            (data.data as any)?.path_lock_message ??
            (data.data as any)?.pathLockMessage,
          pathLockPassword:
            body.pathLockPassword ??
            body.path_lock_password ??
            (data.data as any)?.pathLockPassword ??
            (data.data as any)?.path_lock_password,
          path_lock_password:
            body.pathLockPassword ??
            body.path_lock_password ??
            (data.data as any)?.path_lock_password ??
            (data.data as any)?.pathLockPassword,
          tags: body.tags !== undefined ? parseTags(body.tags) : parseTags((data.data as any)?.tags),
        },
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.warn("[Links Proxy PATCH] Error connecting to Worker:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update link on backend.",
      },
      { status: 502 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const rawParams = await params;
  const { data: pData, error: pError } = parseParams(rawParams, linkIdParamsSchema);
  if (pError) return pError;
  const id = pData.id;

  const { searchParams } = new URL(req.url);
  const session = await auth().catch(() => null);

  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required to delete links." },
      { status: 401 }
    );
  }

  const userEmail = (session.user.email || "").toLowerCase().trim();
  let userId = session.user.id || "";

  if ((!userId || userId === "usr_anonymous" || userId.includes("@") || !userId.startsWith("usr_")) && userEmail) {
    try {
      const cu = await convex.query(api.users.getUserByEmail, { email: userEmail });
      if (cu?.userId) userId = cu.userId;
    } catch {}
  }

  if (!userId && !userEmail) {
    return NextResponse.json(
      { success: false, error: "Authentication required to delete links." },
      { status: 401 }
    );
  }

  const ownership = await verifyLinkOwnership(id, userId, userEmail);
  if (ownership.status === 403) {
    return NextResponse.json(
      { success: false, error: "Forbidden: You do not have permission to delete this link." },
      { status: 403 }
    );
  }
  if (ownership.status === 404) {
    return NextResponse.json(
      { success: false, error: "Link not found." },
      { status: 404 }
    );
  }

  const slug = searchParams.get("slug");

  try {
    // 1. Delete from local memory store (by ID and slug)
    try {
      if (slug) {
        invalidateBotResponseCache(slug);
        invalidateWorkerLinkCache(slug);
      }
      invalidateBotResponseCache(id);
      invalidateWorkerLinkCache(id);
    } catch {}

    let targetId = id;

    // 2. Direct Cloudflare D1 SQL Deletion (Strictly Ownership-Scoped)
    if (CF_ACCOUNT_ID && CF_D1_DATABASE_ID && CF_API_TOKEN) {
      try {
        await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${CF_API_TOKEN}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              sql: "DELETE FROM links WHERE (id = ? OR LOWER(slug) = LOWER(?)) AND (user_id = ? OR user_id IN (SELECT id FROM users WHERE LOWER(email) = LOWER(?)));",
              params: [targetId, slug || targetId, userId || "__never_match__", userEmail || "__never_match__"],
            }),
            cache: "no-store",
          }
        );
      } catch (d1Err) {
        console.warn("[Direct D1 Delete warning]:", d1Err);
      }
    }

    // 3. Delete from Worker (KV and Secondary Cache eviction, strictly scoped to verified caller)
    const workerHeaders: Record<string, string> = {
      "X-Frontend-Secret": FRONTEND_SECRET,
      Authorization: `Bearer ${FRONTEND_SECRET}`,
    };
    if (userId) workerHeaders["X-User-Id"] = userId;
    if (userEmail) workerHeaders["X-User-Email"] = userEmail;

    const url = new URL(`${WORKER_URL}/api/v1/links/${encodeURIComponent(targetId)}`);
    if (slug) url.searchParams.set("slug", slug);
    if (userId) url.searchParams.set("userId", userId);
    if (userEmail) url.searchParams.set("userEmail", userEmail);

    let res = await fetch(url.toString(), {
      method: "DELETE",
      headers: workerHeaders,
      cache: "no-store",
    });

    if (res.status === 403) {
      return NextResponse.json(
        { success: false, error: "Forbidden: You do not have permission to delete this link." },
        { status: 403 }
      );
    }

    // If 404 and id does not start with "link_", attempt to resolve authoritative link ID by slug within caller's links
    if ((!res.ok || res.status === 404) && (!targetId.startsWith("link_") || slug)) {
      try {
        const listUrl = new URL(`${WORKER_URL}/api/v1/links`);
        listUrl.searchParams.set("limit", "500");
        if (userId) listUrl.searchParams.set("userId", userId);
        if (userEmail) listUrl.searchParams.set("userEmail", userEmail);
        const listRes = await fetch(listUrl.toString(), {
          headers: workerHeaders,
          cache: "no-store",
        });
        if (listRes.ok) {
          const listData = await listRes.json();
          const items = listData?.data || listData?.links || [];
          const match = items.find((l: any) => l.slug === (slug || id) || l.id === id);
          if (match?.id && match.id !== id) {
            targetId = match.id;
            const retryUrl = new URL(`${WORKER_URL}/api/v1/links/${encodeURIComponent(targetId)}`);
            if (slug) retryUrl.searchParams.set("slug", slug);
            if (userId) retryUrl.searchParams.set("userId", userId);
            if (userEmail) retryUrl.searchParams.set("userEmail", userEmail);
            res = await fetch(retryUrl.toString(), {
              method: "DELETE",
              headers: workerHeaders,
              cache: "no-store",
            });
          }
        }
      } catch {}
    }

    invalidateServerLinksCache(userId, userEmail);
    if (userId) {
      dispatchUserWebhooks(userId, "link.deleted", {
        linkId: targetId,
        slug: slug || "",
      }).catch(() => {});
    }
    return NextResponse.json({ success: true, data: { deleted: true, id: targetId } });
  } catch (error: any) {
    console.warn(
      "[Links Proxy DELETE] Non-fatal worker connection warning:",
      error,
    );
    invalidateServerLinksCache(userId, userEmail);
    return NextResponse.json({ success: true, data: { deleted: true, id } });
  }
}
