import { NextResponse } from "next/server";
import { invalidateBotResponseCache } from "@/lib/redirect-engine";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    const url = new URL(`${WORKER_URL}/api/v1/links`);
    if (userId) url.searchParams.set("userId", userId);

    const workerData = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET || "",
        Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
        ...(userId ? { "X-User-Id": userId } : {}),
      },
      cache: "no-store",
    })
      .then((r) => (r.ok ? r.json() : { success: true, data: [] }))
      .catch(() => ({ success: true, data: [] }));

    const workerList = Array.isArray(workerData?.data)
      ? workerData.data
      : Array.isArray((workerData?.data as any)?.data)
        ? (workerData.data as any).data
        : [];

    const seenSlugs = new Set<string>();
    const mergedList: any[] = [];

    // 1. Traitement exclusif des données issues du Worker Cloudflare D1
    for (const l of workerList) {
      const slugKey = (l.slug || "").toLowerCase();
      seenSlugs.add(slugKey);

      const maxClicksVal = l.max_clicks !== undefined ? l.max_clicks : null;
      const clicksVal = Number(
        l.clicks_count || l.clicksCount || l.clicks || 0,
      );

      const finalClicks =
        maxClicksVal && maxClicksVal > 0
          ? Math.min(clicksVal, Number(maxClicksVal))
          : clicksVal;

      const rawCard = l.twitter_card || l.twitterCard;
      const rawStyle = l.banner_style || l.bannerStyle;
      const isLarge =
        rawCard === "summary_large_image" || rawStyle === "large_banner";
      const isDefaultBanner =
        (rawCard === "summary" || rawStyle === "default_banner") && !isLarge;
      const finalBannerStyle: "default_banner" | "large_banner" =
        isDefaultBanner ? "default_banner" : "large_banner";
      const finalTwitterCard: "summary" | "summary_large_image" =
        isDefaultBanner ? "summary" : "summary_large_image";

      const authoritativeRoutingRules =
        l.routing_rules !== undefined
          ? l.routing_rules
          : l.routingRules !== undefined
            ? l.routingRules
            : null;
      const authoritativeGeoTargeting =
        l.geo_targeting !== undefined
          ? l.geo_targeting
          : l.geoTargeting !== undefined
            ? l.geoTargeting
            : null;
      const authoritativeDeviceTargeting =
        l.device_targeting !== undefined
          ? l.device_targeting
          : l.deviceTargeting !== undefined
            ? l.deviceTargeting
            : null;
      const authoritativeAbVariations =
        l.ab_variations !== undefined
          ? l.ab_variations
          : l.abVariations !== undefined
            ? l.abVariations
            : null;

      const expTimeStr = l.expires_at || l.expiresAt;
      const isExpired = Boolean(
        expTimeStr && new Date(expTimeStr).getTime() <= Date.now(),
      );
      const rawIsActive =
        l.is_active !== undefined
          ? Number(l.is_active)
          : l.isActive !== undefined
            ? (l.isActive ? 1 : 0)
            : 1;
      const finalIsActiveInt = isExpired ? 0 : (rawIsActive === 0 ? 0 : 1);
      const finalIsActiveBool = isExpired ? false : (rawIsActive !== 0 && l.isActive !== false);

      mergedList.push({
        ...l,
        clicks_count: finalClicks,
        clicksCount: finalClicks,
        meta_title: l.meta_title ?? l.metaTitle ?? null,
        metaTitle: l.metaTitle ?? l.meta_title ?? null,
        og_title: l.og_title ?? l.ogTitle ?? null,
        ogTitle: l.ogTitle ?? l.og_title ?? null,
        og_description: l.og_description ?? l.ogDescription ?? null,
        ogDescription: l.ogDescription ?? l.og_description ?? null,
        og_image: l.og_image ?? l.ogImage ?? null,
        ogImage: l.ogImage ?? l.og_image ?? null,
        banner_style: finalBannerStyle,
        bannerStyle: finalBannerStyle,
        twitter_card: finalTwitterCard,
        twitterCard: finalTwitterCard,
        password: l.password ?? null,
        has_password: Boolean(l.password || l.has_password),
        is_cloaked: l.is_cloaked !== undefined ? l.is_cloaked : 0,
        isCloaked: Boolean(l.isCloaked || l.is_cloaked),
        hide_referrer: l.hide_referrer !== undefined ? l.hide_referrer : 0,
        hideReferrer: Boolean(l.hideReferrer || l.hide_referrer),
        routing_rules: authoritativeRoutingRules,
        routingRules: authoritativeRoutingRules,
        geo_targeting: authoritativeGeoTargeting,
        geoTargeting: authoritativeGeoTargeting,
        device_targeting: authoritativeDeviceTargeting,
        deviceTargeting: authoritativeDeviceTargeting,
        max_clicks: l.max_clicks !== undefined ? l.max_clicks : null,
        maxClicks: l.maxClicks !== undefined ? l.maxClicks : null,
        fallback_url: l.fallback_url ?? l.fallbackUrl ?? null,
        fallbackUrl: l.fallbackUrl ?? l.fallback_url ?? null,
        ab_variations: authoritativeAbVariations,
        abVariations: authoritativeAbVariations,
        main_weight:
          l.main_weight !== undefined
            ? l.main_weight
            : l.mainWeight !== undefined
              ? l.mainWeight
              : 100,
        mainWeight:
          l.mainWeight !== undefined
            ? l.mainWeight
            : l.main_weight !== undefined
              ? l.main_weight
              : 100,
        redirect_type: l.redirect_type || l.redirectType || "302",
        redirectType: l.redirectType || l.redirect_type || "302",
        pass_params:
          l.pass_params !== undefined
            ? l.pass_params
            : l.passParams !== undefined
              ? l.passParams
                ? 1
                : 0
              : 1,
        passParams:
          l.passParams !== undefined
            ? Boolean(l.passParams)
            : l.pass_params !== undefined
              ? Boolean(l.pass_params)
              : true,
        path_lock_mode: l.path_lock_mode || l.pathLockMode || "off",
        pathLockMode: l.pathLockMode || l.path_lock_mode || "off",
        path_lock_prefix: l.path_lock_prefix ?? l.pathLockPrefix ?? null,
        pathLockPrefix: l.pathLockPrefix ?? l.path_lock_prefix ?? null,
        path_lock_message: l.path_lock_message ?? l.pathLockMessage ?? null,
        pathLockMessage: l.pathLockMessage ?? l.path_lock_message ?? null,
        path_lock_password: l.path_lock_password ?? l.pathLockPassword ?? null,
        pathLockPassword: l.pathLockPassword ?? l.path_lock_password ?? null,
        expires_at: l.expires_at ?? l.expiresAt ?? null,
        expiresAt: l.expiresAt ?? l.expires_at ?? null,
        is_active: finalIsActiveInt,
        isActive: finalIsActiveBool,
        status: isExpired ? "Expired" : finalIsActiveBool ? "Active" : "Paused",
        is_expired: isExpired ? 1 : 0,
        isExpired: isExpired,
        tags: l.tags || [],
        user_email: l.user_email || l.userEmail || l.email || null,
        userEmail: l.userEmail || l.user_email || l.email || null,
        email: l.email || l.userEmail || l.user_email || null,
        user_name:
          l.user_name ||
          l.userName ||
          l.user_full_name ||
          l.userFullName ||
          l.fullName ||
          null,
        userName:
          l.userName ||
          l.user_name ||
          l.user_full_name ||
          l.userFullName ||
          l.fullName ||
          null,
        user_full_name:
          l.user_full_name ||
          l.userFullName ||
          l.user_name ||
          l.userName ||
          l.fullName ||
          null,
        userFullName:
          l.userFullName ||
          l.user_full_name ||
          l.userName ||
          l.user_name ||
          l.fullName ||
          null,
        fullName:
          l.fullName ||
          l.userFullName ||
          l.user_full_name ||
          l.userName ||
          l.user_name ||
          null,
      });
    }

    return NextResponse.json({ success: true, data: mergedList });
  } catch (error: any) {
    console.warn("[Links Proxy GET] Error connecting to Worker:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Impossible de contacter le Worker Cloudflare",
      },
      { status: 502 },
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const session = await auth().catch(() => null);
    const sessionEmail = session?.user?.email;
    const sessionUserId = session?.user?.id;
    const requestEmail = body.userEmail || sessionEmail || "";
    const requestUserId = body.userId || sessionUserId || "";

    let authoritativePlan = (
      body.userPlan ||
      body.plan ||
      ""
    ).toUpperCase();

    if (!authoritativePlan || authoritativePlan === "FREEMIUM" || authoritativePlan === "FREE" || authoritativePlan === "STARTER") {
      try {
        let cu: any = null;
        if (requestEmail) {
          cu = await convex.query(api.users.getUserByEmail, { email: requestEmail.toLowerCase().trim() });
        }
        if (!cu && requestUserId) {
          cu = await convex.query(api.users.getCurrentUser, {
            userId: requestUserId,
            email: requestEmail || undefined,
          });
        }
        if (cu?.plan) {
          authoritativePlan = cu.plan.toUpperCase();
        }
      } catch (e) {
        console.warn("[app/api/links/route.ts] Error querying Convex plan:", e);
      }
    }

    const effectivePlan = (authoritativePlan === "FREEMIUM" || authoritativePlan === "STARTER")
      ? "FREE"
      : (authoritativePlan || "FREE");
    const finalUserId = requestUserId || "usr_anonymous";
    const finalUserEmail = requestEmail || "";

    // Strictly enforce: Dynamic smart routing requires a paid plan (PRO, BUSINESS, ENTERPRISE)
    const isPaidPlan =
      effectivePlan === "PRO" ||
      effectivePlan === "BUSINESS" ||
      effectivePlan === "ENTERPRISE";

    const hasRouting =
      (Array.isArray(body.routingRules) && body.routingRules.length > 0) ||
      (Array.isArray(body.routing_rules) && body.routing_rules.length > 0) ||
      (body.geoTargeting && Object.keys(body.geoTargeting).length > 0) ||
      (body.geo_targeting && Object.keys(body.geo_targeting).length > 0) ||
      (body.deviceTargeting && Object.keys(body.deviceTargeting).length > 0) ||
      (body.device_targeting && Object.keys(body.device_targeting).length > 0);

    if (!isPaidPlan && hasRouting) {
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

    const rawOg = (body.ogImage || body.og_image || "").trim();
    let sanitizedOgImage: string | undefined = rawOg || undefined;

    if (sanitizedOgImage && sanitizedOgImage.startsWith("/api/images/")) {
      const fName = sanitizedOgImage.replace("/api/images/", "");
      sanitizedOgImage = `${WORKER_URL}/api/v1/images/${fName}`;
    } else if (rawOg && rawOg.startsWith("data:") && rawOg.length > 250000) {
      const bannerTitle = encodeURIComponent(
        body.ogTitle || body.metaTitle || body.slug || "LShorter",
      );
      sanitizedOgImage = `/api/og?title=${bannerTitle}`;
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

    const targetUrlClean = body.targetUrl || body.target_url;
    const finalPathLockMode = body.pathLockMode || body.path_lock_mode || "off";
    let finalPathLockPrefix = body.pathLockPrefix || body.path_lock_prefix || undefined;
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

    const expTimeInput = body.expiresAt || body.expires_at;
    const isInputExpired = Boolean(
      expTimeInput && new Date(expTimeInput).getTime() <= Date.now(),
    );
    const finalIsActive = isInputExpired
      ? false
      : body.isActive !== undefined
        ? Boolean(body.isActive)
        : body.is_active !== undefined
          ? Boolean(body.is_active)
          : true;

    // Transmission directe au Worker Cloudflare
    const workerPayload = {
      ...body,
      userId: finalUserId,
      userEmail: finalUserEmail,
      targetUrl: targetUrlClean,
      target_url: targetUrlClean,
      ogImage: sanitizedOgImage,
      og_image: sanitizedOgImage,
      ogTitle: body.ogTitle || body.og_title,
      og_title: body.ogTitle || body.og_title,
      ogDescription: body.ogDescription || body.og_description,
      og_description: body.ogDescription || body.og_description,
      bannerStyle: resolvedBannerStyle,
      banner_style: resolvedBannerStyle,
      twitterCard: resolvedTwitterCard,
      twitter_card: resolvedTwitterCard,
      metaTitle: body.metaTitle || body.meta_title || body.ogTitle,
      meta_title: body.meta_title || body.metaTitle || body.ogTitle,
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
      pathLockMode: finalPathLockMode,
      path_lock_mode: finalPathLockMode,
      pathLockPrefix: finalPathLockPrefix,
      path_lock_prefix: finalPathLockPrefix,
      pathLockMessage:
        body.pathLockMessage || body.path_lock_message || undefined,
      path_lock_message:
        body.pathLockMessage || body.path_lock_message || undefined,
      pathLockPassword:
        body.pathLockPassword || body.path_lock_password || undefined,
      path_lock_password:
        body.pathLockPassword || body.path_lock_password || undefined,
      isActive: finalIsActive,
      is_active: finalIsActive ? 1 : 0,
      plan: effectivePlan,
      userPlan: effectivePlan,
    };

    const res = await fetch(`${WORKER_URL}/api/v1/links`, {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET || "",
        Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
        "X-User-Id": finalUserId,
        "X-User-Email": finalUserEmail,
        ...(body.userName ? { "X-User-Name": body.userName } : {}),
        "X-User-Plan": effectivePlan,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workerPayload),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 403) {
      return NextResponse.json(
        {
          success: false,
          code: data.code || "PLAN_UPGRADE_REQUIRED",
          error:
            data.error ||
            data.message ||
            "Fonctionnalité réservée au forfait supérieur",
        },
        { status: 403 },
      );
    }

    if (!res.ok) {
      const rawErr =
        data.error ||
        data.message ||
        `Erreur Cloudflare Worker (${res.status})`;
      const cleanErr = sanitizeClientErrorMessage(rawErr);
      return NextResponse.json(
        {
          success: false,
          error: cleanErr,
        },
        { status: res.status },
      );
    }

    const createdSlug = data?.data?.slug || body.slug;
    if (createdSlug) {
      try {
        invalidateBotResponseCache(createdSlug);
      } catch {}
    }

    return NextResponse.json(
      {
        ...data,
        data: {
          ...(data.data || {}),
          ogImage: sanitizedOgImage,
          og_image: sanitizedOgImage,
          ogTitle: body.ogTitle || body.og_title,
          og_title: body.ogTitle || body.og_title,
          ogDescription: body.ogDescription || body.og_description,
          og_description: body.ogDescription || body.og_description,
          metaTitle: body.metaTitle || body.meta_title,
          bannerStyle: resolvedBannerStyle,
          banner_style: resolvedBannerStyle,
          twitterCard: resolvedTwitterCard,
          twitter_card: resolvedTwitterCard,
          password: body.password || undefined,
          isCloaked: Boolean(body.isCloaked || body.is_cloaked),
          pathLockMode:
            body.pathLockMode ||
            body.path_lock_mode ||
            (data.data as any)?.pathLockMode ||
            (data.data as any)?.path_lock_mode ||
            "off",
          path_lock_mode:
            body.pathLockMode ||
            body.path_lock_mode ||
            (data.data as any)?.path_lock_mode ||
            (data.data as any)?.pathLockMode ||
            "off",
          pathLockPrefix:
            body.pathLockPrefix ||
            body.path_lock_prefix ||
            (data.data as any)?.pathLockPrefix ||
            (data.data as any)?.path_lock_prefix ||
            undefined,
          path_lock_prefix:
            body.pathLockPrefix ||
            body.path_lock_prefix ||
            (data.data as any)?.path_lock_prefix ||
            (data.data as any)?.pathLockPrefix ||
            undefined,
          pathLockMessage:
            body.pathLockMessage ||
            body.path_lock_message ||
            (data.data as any)?.pathLockMessage ||
            (data.data as any)?.path_lock_message ||
            undefined,
          path_lock_message:
            body.pathLockMessage ||
            body.path_lock_message ||
            (data.data as any)?.path_lock_message ||
            (data.data as any)?.pathLockMessage ||
            undefined,
          pathLockPassword:
            body.pathLockPassword ||
            body.path_lock_password ||
            (data.data as any)?.pathLockPassword ||
            (data.data as any)?.path_lock_password ||
            undefined,
          path_lock_password:
            body.pathLockPassword ||
            body.path_lock_password ||
            (data.data as any)?.path_lock_password ||
            (data.data as any)?.pathLockPassword ||
            undefined,
          routingRules: body.routingRules ?? body.routing_rules ?? null,
          geoTargeting: body.geoTargeting ?? body.geo_targeting ?? null,
          deviceTargeting:
            body.deviceTargeting ?? body.device_targeting ?? null,
          maxClicks:
            body.maxClicks !== undefined ? Number(body.maxClicks) : undefined,
          fallbackUrl: body.fallbackUrl || body.fallback_url || undefined,
        },
      },
      { status: res.status },
    );
  } catch (error: any) {
    console.warn("[Links Proxy POST] Error connecting to Worker:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          "Unable to reach Cloudflare Edge servers. Please check your connection.",
      },
      { status: 502 },
    );
  }
}

function sanitizeClientErrorMessage(raw: any): string {
  if (!raw) return "An unexpected error occurred. Please try again.";
  const msg =
    typeof raw === "string" ? raw : raw.message || raw.error || String(raw);
  const lower = msg.toLowerCase();

  if (
    lower.includes("unique") ||
    lower.includes("idx_links_slug") ||
    lower.includes("already exists")
  ) {
    return "This custom slug is already in use. Please choose another one.";
  }
  if (
    lower.includes("self-referencing") ||
    lower.includes("infinite_redirect")
  ) {
    return "The destination URL cannot redirect to the same domain (lsho.cc). Please specify an external URL.";
  }
  if (
    lower.includes("403") ||
    lower.includes("plan_upgrade") ||
    lower.includes("forbidden") ||
    lower.includes("quota")
  ) {
    return "This feature requires a higher plan tier.";
  }
  if (
    lower.includes("foreign key") ||
    lower.includes("constraint failed") ||
    lower.includes("sqlite")
  ) {
    return "Temporary synchronization error. Please try again.";
  }
  if (
    lower.includes("d1_error") ||
    lower.includes("prepare(") ||
    lower.includes("bind(") ||
    lower.includes("table ") ||
    lower.includes("column ")
  ) {
    return "A technical error occurred. Please try again.";
  }
  return msg;
}
