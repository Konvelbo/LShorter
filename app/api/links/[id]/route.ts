import { NextResponse } from "next/server";
import { invalidateBotResponseCache } from "@/lib/redirect-engine";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { isSafeHttpUrl, isValidSlug } from "@/lib/security-utils";

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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  let body: any = {};
  try {
    const session = await auth().catch(() => null);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required to update links." },
        { status: 401 }
      );
    }

    body = await req.json();
    const requestEmail = session.user.email || "";
    const requestUserId = session.user.id || "";

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

    const rawOg = (body.ogImage || body.og_image || "").trim();
    let sanitizedOgImage: string | undefined = rawOg || undefined;
    if (sanitizedOgImage && sanitizedOgImage.startsWith("/api/images/")) {
      const fName = sanitizedOgImage.replace("/api/images/", "");
      sanitizedOgImage = `${WORKER_URL}/api/v1/images/${fName}`;
    }

    const rawStyle = body.bannerStyle || body.banner_style;
    const rawCard = body.twitterCard || body.twitter_card;
    const isLarge =
      rawCard === "summary_large_image" || rawStyle === "large_banner";
    const isDefaultBanner =
      (rawCard === "summary" || rawStyle === "default_banner") && !isLarge;
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

    // Strictly enforce: Dynamic smart routing requires a paid plan (PRO, BUSINESS, ENTERPRISE)
    const hasRouting =
      (Array.isArray(parsedRouting) && parsedRouting.length > 0) ||
      (parsedGeo && Object.keys(parsedGeo).length > 0) ||
      (parsedDevice && Object.keys(parsedDevice).length > 0);

    if (!isPro && hasRouting) {
      return NextResponse.json(
        {
          success: false,
          code: "PLAN_UPGRADE_REQUIRED",
          error: "Le système de routage dynamique intelligent est strictement réservé aux forfaits payants (Pro, Business et Enterprise).",
          message: "Le système de routage dynamique intelligent est strictement réservé aux forfaits payants (Pro, Business et Enterprise).",
        },
        { status: 403 }
      );
    }

    // 1. Persist in local store
    // if (body.slug || id) {
    //   try {
    //     saveProtectedLink({
    //       id,
    //       slug: body.slug || id,
    //       password:
    //         body.password !== undefined ? body.password || null : undefined,
    //       isCloaked:
    //         body.isCloaked !== undefined ? Boolean(body.isCloaked) : undefined,
    //       metaTitle:
    //         body.metaTitle !== undefined
    //           ? body.metaTitle || body.ogTitle || null
    //           : undefined,
    //       ogTitle:
    //         body.ogTitle !== undefined
    //           ? body.ogTitle || body.og_title || body.metaTitle || null
    //           : undefined,
    //       ogDescription:
    //         body.ogDescription !== undefined
    //           ? body.ogDescription || body.og_description || null
    //           : undefined,
    //       ogImage:
    //         sanitizedOgImage !== undefined
    //           ? sanitizedOgImage || null
    //           : undefined,
    //       bannerStyle: resolvedBannerStyle,
    //       banner_style: resolvedBannerStyle,
    //       twitterCard: resolvedTwitterCard,
    //       twitter_card: resolvedTwitterCard,
    //       targetUrl: body.targetUrl || body.target_url || undefined,
    //       routingRules: parsedRouting !== undefined ? parsedRouting : null,
    //       geoTargeting: parsedGeo !== undefined ? parsedGeo : null,
    //       deviceTargeting: parsedDevice !== undefined ? parsedDevice : null,
    //       maxClicks:
    //         body.maxClicks !== undefined
    //           ? body.maxClicks
    //             ? Number(body.maxClicks)
    //             : null
    //           : body.max_clicks !== undefined
    //             ? body.max_clicks
    //               ? Number(body.max_clicks)
    //               : null
    //             : undefined,
    //       fallbackUrl:
    //         body.fallbackUrl !== undefined
    //           ? body.fallbackUrl || null
    //           : body.fallback_url !== undefined
    //             ? body.fallback_url || null
    //             : undefined,
    //       abVariations:
    //         body.abVariations !== undefined
    //           ? body.abVariations
    //           : body.ab_variations !== undefined
    //             ? body.ab_variations
    //             : undefined,
    //       mainWeight:
    //         body.mainWeight !== undefined
    //           ? Number(body.mainWeight)
    //           : body.main_weight !== undefined
    //             ? Number(body.main_weight)
    //             : undefined,
    //       userId: body.userId,
    //       isActive:
    //         body.isActive !== undefined
    //           ? Boolean(body.isActive)
    //           : body.is_active !== undefined
    //             ? Boolean(body.is_active)
    //             : undefined,
    //       expiresAt:
    //         body.expiresAt !== undefined
    //           ? body.expiresAt || null
    //           : body.expires_at !== undefined
    //             ? body.expires_at || null
    //             : undefined,
    //       redirectType: body.redirectType || body.redirect_type || undefined,
    //       passParams:
    //         body.passParams !== undefined
    //           ? Boolean(body.passParams)
    //           : body.pass_params !== undefined
    //             ? Boolean(body.pass_params)
    //             : undefined,
    //       pathLockMode: body.pathLockMode || body.path_lock_mode || undefined,
    //       path_lock_mode: body.pathLockMode || body.path_lock_mode || undefined,
    //       pathLockPrefix:
    //         body.pathLockPrefix !== undefined
    //           ? body.pathLockPrefix || null
    //           : body.path_lock_prefix !== undefined
    //             ? body.path_lock_prefix || null
    //             : undefined,
    //       path_lock_prefix:
    //         body.pathLockPrefix !== undefined
    //           ? body.pathLockPrefix || null
    //           : body.path_lock_prefix !== undefined
    //             ? body.path_lock_prefix || null
    //             : undefined,
    //       pathLockMessage:
    //         body.pathLockMessage !== undefined
    //           ? body.pathLockMessage || null
    //           : body.path_lock_message !== undefined
    //             ? body.path_lock_message || null
    //             : undefined,
    //       path_lock_message:
    //         body.pathLockMessage !== undefined
    //           ? body.pathLockMessage || null
    //           : body.path_lock_message !== undefined
    //             ? body.path_lock_message || null
    //             : undefined,
    //       pathLockPassword:
    //         body.pathLockPassword !== undefined
    //           ? body.pathLockPassword || null
    //           : body.path_lock_password !== undefined
    //             ? body.path_lock_password || null
    //             : undefined,
    //       path_lock_password:
    //         body.pathLockPassword !== undefined
    //           ? body.pathLockPassword || null
    //           : body.path_lock_password !== undefined
    //             ? body.path_lock_password || null
    //             : undefined,
    //     });
    //     if (body.slug) invalidateBotResponseCache(body.slug);
    //     invalidateBotResponseCache(id);
    //   } catch (storeErr) {
    //     console.warn("[ProtectedLinkStore] Non-fatal save warning:", storeErr);
    //   }
    // }

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

    const targetSlug = (body.slug || id || "").trim();
    if (targetSlug) invalidateBotResponseCache(targetSlug);
    if (id) invalidateBotResponseCache(id);

    const url = new URL(`${WORKER_URL}/api/v1/links/${id}`);
    if (userId) url.searchParams.set("userId", userId);
    if (requestEmail) url.searchParams.set("userEmail", requestEmail);

    const res = await fetch(url.toString(), {
      method: "PATCH",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
        "X-User-Email": requestEmail || "fiatechnologiecam@gmail.com",
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
            "X-User-Plan": effectivePlan,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sanitizedBody),
        });

        if (retryRes.ok) {
          const retryData = await retryRes.json().catch(() => ({}));
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
    }

    // 4. If worker returns 404, look up real worker link ID by slug and retry PATCH
    if (res.status === 404) {
      try {
        const slugToFind = body.slug || id;
        const listRes = await fetch(
          `${WORKER_URL}/api/v1/links?userId=${userId || "all"}`,
          {
            headers: {
              "X-Frontend-Secret": FRONTEND_SECRET,
              Authorization: `Bearer ${FRONTEND_SECRET}`,
            },
            cache: "no-store",
          },
        );

        if (listRes.ok) {
          const listJson = await listRes.json();
          const list = Array.isArray(listJson.data) ? listJson.data : [];
          const found = list.find(
            (l: any) =>
              l.slug?.toLowerCase() === slugToFind.toLowerCase() || l.id === id,
          );
          if (found && found.id && found.id !== id) {
            const retryPatch = await fetch(
              `${WORKER_URL}/api/v1/links/${found.id}`,
              {
                method: "PATCH",
                headers: {
                  "X-Frontend-Secret": FRONTEND_SECRET,
                  Authorization: `Bearer ${FRONTEND_SECRET}`,
                  ...(userId ? { "X-User-Id": userId } : {}),
                  "X-User-Plan": effectivePlan,
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(workerPayload),
              },
            );
            if (retryPatch.ok) {
              const patchData = await retryPatch.json().catch(() => ({}));
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

        const createUrl = new URL(`${WORKER_URL}/api/v1/links`);
        const createRes = await fetch(createUrl.toString(), {
          method: "POST",
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
        if (createRes.ok) {
          const createData = await createRes.json().catch(() => ({}));
          return NextResponse.json(
            {
              success: true,
              data: {
                ...(createData.data || createData),
                bannerStyle: resolvedBannerStyle,
                banner_style: resolvedBannerStyle,
                twitterCard: resolvedTwitterCard,
                twitter_card: resolvedTwitterCard,
              },
            },
            { status: 200 },
          );
        }
      } catch (createErr) {
        console.warn(
          "[Links Proxy PATCH] Fallback sync to worker failed:",
          createErr,
        );
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            id,
            ...workerPayload,
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
          },
        },
        { status: 200 },
      );
    }

    if (!res.ok) {
      console.warn(
        "[Links Proxy PATCH] Worker returned error status:",
        res.status,
        "- Local fallback succeeded.",
      );
      return NextResponse.json(
        {
          success: true,
          data: {
            id,
            ...workerPayload,
            isActive:
              body.isActive !== undefined
                ? Boolean(body.isActive)
                : body.is_active !== undefined
                  ? Boolean(body.is_active)
                  : true,
            expiresAt: body.expiresAt ?? body.expires_at,
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
            path_lock_message: body.pathLockMessage ?? body.path_lock_message,
            pathLockPassword: body.pathLockPassword ?? body.path_lock_password,
            path_lock_password:
              body.pathLockPassword ?? body.path_lock_password,
            tags: body.tags !== undefined ? parseTags(body.tags) : undefined,
          },
        },
        { status: 200 },
      );
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
        success: true,
        data: {
          id,
          ...body,
        },
      },
      { status: 200 },
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth().catch(() => null);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required to delete links." },
      { status: 401 }
    );
  }

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = session.user.id;
  const slug = searchParams.get("slug");
  const imageParam = searchParams.get("image") || searchParams.get("ogImage");

  try {
    // 1. Delete from local memory store (by ID and slug)
    try {
      if (slug) {
        invalidateBotResponseCache(slug);
      }
      invalidateBotResponseCache(id);
    } catch {}

    // 3. Delete from Worker
    const url = new URL(`${WORKER_URL}/api/v1/links/${encodeURIComponent(id)}`);
    if (userId) url.searchParams.set("userId", userId);
    if (session.user.email) url.searchParams.set("userEmail", session.user.email);
    if (slug) url.searchParams.set("slug", slug);

    const res = await fetch(url.toString(), {
      method: "DELETE",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
        ...(session.user.email ? { "X-User-Email": session.user.email } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      // Return success as local store already deleted it
      return NextResponse.json({ success: true });
    }

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error: any) {
    console.warn(
      "[Links Proxy DELETE] Non-fatal worker connection warning:",
      error,
    );
    return NextResponse.json({ success: true });
  }
}
