import { NextResponse } from "next/server";
import { saveProtectedLink } from "@/lib/protected-links-store";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://greedy-mastiff-107.convex.cloud"
);

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    const url = new URL(`${WORKER_URL}/api/v1/links`);
    if (userId) url.searchParams.set("userId", userId);

    const [workerData, convexLinks] = await Promise.all([
      fetch(url.toString(), {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
          ...(userId ? { "X-User-Id": userId } : {}),
        },
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : { success: true, data: [] }))
        .catch(() => ({ success: true, data: [] })),
      userId && userId !== "all"
        ? convex.query(api.links.listUserLinks, { userId }).catch(() => [])
        : Promise.resolve([]),
    ]);

    const convexMap = new Map<string, any>();
    if (Array.isArray(convexLinks)) {
      convexLinks.forEach((cl: any) => {
        if (cl.slug) convexMap.set(cl.slug.toLowerCase(), cl);
      });
    }

    const workerList = Array.isArray(workerData?.data)
      ? workerData.data
      : Array.isArray((workerData?.data as any)?.data)
      ? (workerData.data as any).data
      : [];

    const mergedList = workerList.map((l: any) => {
      const slugKey = (l.slug || "").toLowerCase();
      const cx = convexMap.get(slugKey) || {};

      return {
        ...l,
        meta_title: l.meta_title || l.metaTitle || cx.metaTitle || cx.title,
        metaTitle: l.metaTitle || l.meta_title || cx.metaTitle || cx.title,
        og_title: l.og_title || l.ogTitle || cx.ogTitle || cx.title,
        ogTitle: l.ogTitle || l.og_title || cx.ogTitle || cx.title,
        og_description: l.og_description || l.ogDescription || cx.ogDescription,
        ogDescription: l.ogDescription || l.og_description || cx.ogDescription,
        og_image: l.og_image || l.ogImage || cx.ogImage,
        ogImage: l.ogImage || l.og_image || cx.ogImage,
        password: l.password || cx.password,
        has_password: Boolean(l.password || l.has_password || cx.password),
        is_cloaked: l.is_cloaked !== undefined ? l.is_cloaked : cx.isCloaked ? 1 : 0,
        isCloaked: Boolean(l.isCloaked || l.is_cloaked || cx.isCloaked),
        hide_referrer: l.hide_referrer !== undefined ? l.hide_referrer : cx.hideReferrer ? 1 : 0,
        hideReferrer: Boolean(l.hideReferrer || l.hide_referrer || cx.hideReferrer),
        routing_rules: l.routing_rules || cx.routingRules,
        routingRules: l.routingRules || cx.routingRules,
        geo_targeting: l.geo_targeting || cx.geoTargeting,
        geoTargeting: l.geoTargeting || cx.geoTargeting,
        device_targeting: l.device_targeting || cx.deviceTargeting,
        deviceTargeting: l.deviceTargeting || cx.deviceTargeting,
        max_clicks: l.max_clicks !== undefined ? l.max_clicks : cx.maxClicks,
        maxClicks: l.maxClicks !== undefined ? l.maxClicks : cx.maxClicks,
        fallback_url: l.fallback_url || cx.fallbackUrl,
        fallbackUrl: l.fallbackUrl || cx.fallbackUrl,
        ab_variations: l.ab_variations || cx.abVariations,
        abVariations: l.abVariations || cx.abVariations,
        main_weight: l.main_weight !== undefined ? l.main_weight : cx.mainWeight,
        mainWeight: l.mainWeight !== undefined ? l.mainWeight : cx.mainWeight,
      };
    });

    return NextResponse.json({ success: true, data: mergedList });
  } catch (error: any) {
    console.warn("[Links Proxy GET] Error connecting to Worker:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Impossible de contacter le Worker Cloudflare" },
      { status: 502 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const effectivePlan = (body.userPlan || body.plan || "PRO").toUpperCase();
    const isPro = effectivePlan === "PRO" || effectivePlan === "BUSINESS" || effectivePlan === "ENTERPRISE";

    const sanitizedOgImage =
      body.ogImage && body.ogImage.startsWith("data:") && body.ogImage.length > 100000
        ? undefined
        : body.ogImage || body.og_image;

    // 1. Persist in Convex Cloud DB for permanent 100% cloud reliability
    if (body.slug && body.userId) {
      try {
        await convex.mutation(api.links.upsertLink, {
          userId: body.userId,
          slug: body.slug,
          targetUrl: body.targetUrl || body.target_url,
          domainName: body.domainName || body.domain_name || "lsho.cc",
          title: body.ogTitle || body.metaTitle || body.slug,
          metaTitle: body.metaTitle || body.meta_title || body.ogTitle || undefined,
          ogTitle: body.ogTitle || body.og_title || undefined,
          ogDescription: body.ogDescription || body.og_description || undefined,
          ogImage: sanitizedOgImage || undefined,
          password: body.password || undefined,
          isPasswordProtected: Boolean(body.password),
          isCloaked: Boolean(body.isCloaked || body.is_cloaked),
          cloaking: Boolean(body.isCloaked || body.is_cloaked),
          hideReferrer: Boolean(body.hideReferrer || body.hide_referrer),
          expiresAt: body.expiresAt || body.expires_at || undefined,
          maxClicks: body.maxClicks !== undefined ? Number(body.maxClicks) : undefined,
          fallbackUrl: body.fallbackUrl || body.fallback_url || undefined,
          tags: body.tags || undefined,
          routingRules: body.routingRules || body.routing_rules || undefined,
          geoTargeting: body.geoTargeting || body.geo_targeting || undefined,
          deviceTargeting: body.deviceTargeting || body.device_targeting || undefined,
          abVariations: body.abVariations || body.ab_variations || undefined,
          mainWeight: body.mainWeight !== undefined ? Number(body.mainWeight) : undefined,
          isActive: body.isActive !== false && body.is_active !== 0,
        });
      } catch (cxErr) {
        console.warn("[Convex upsertLink error]:", cxErr);
      }
    }

    // 2. Persist in local in-memory store
    if (body.slug) {
      try {
        saveProtectedLink({
          slug: body.slug,
          password: body.password || undefined,
          isCloaked: Boolean(body.isCloaked || body.is_cloaked),
          metaTitle: body.metaTitle || body.meta_title || body.ogTitle || body.og_title || undefined,
          ogTitle: body.ogTitle || body.og_title || body.metaTitle || body.meta_title || undefined,
          ogDescription: body.ogDescription || body.og_description || undefined,
          ogImage: sanitizedOgImage || undefined,
          targetUrl: body.targetUrl || body.target_url,
          routingRules: body.routingRules || body.routing_rules || undefined,
          geoTargeting: body.geoTargeting || body.geo_targeting || undefined,
          deviceTargeting: body.deviceTargeting || body.device_targeting || undefined,
          maxClicks: body.maxClicks !== undefined ? Number(body.maxClicks) : undefined,
          fallbackUrl: body.fallbackUrl || body.fallback_url || undefined,
          abVariations: body.abVariations || body.ab_variations || undefined,
          mainWeight: body.mainWeight !== undefined ? Number(body.mainWeight) : undefined,
          userId: body.userId,
        });
      } catch (storeErr) {
        console.warn("[ProtectedLinkStore] Non-fatal save warning:", storeErr);
      }
    }

    // 3. Forward to Cloudflare Worker D1 & KV
    const workerPayload = {
      ...body,
      targetUrl: body.targetUrl || body.target_url,
      target_url: body.target_url || body.targetUrl,
      ogImage: sanitizedOgImage,
      og_image: sanitizedOgImage,
      ogTitle: body.ogTitle || body.og_title,
      og_title: body.ogTitle || body.og_title,
      ogDescription: body.ogDescription || body.og_description,
      og_description: body.ogDescription || body.og_description,
      metaTitle: body.metaTitle || body.meta_title || body.ogTitle,
      meta_title: body.meta_title || body.metaTitle || body.ogTitle,
      plan: effectivePlan,
      userPlan: effectivePlan,
    };

    const res = await fetch(`${WORKER_URL}/api/v1/links`, {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(body.userId ? { "X-User-Id": body.userId } : {}),
        ...(body.userEmail ? { "X-User-Email": body.userEmail } : {}),
        ...(body.userName ? { "X-User-Name": body.userName } : {}),
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

        const retryRes = await fetch(`${WORKER_URL}/api/v1/links`, {
          method: "POST",
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
            Authorization: `Bearer ${FRONTEND_SECRET}`,
            ...(body.userId ? { "X-User-Id": body.userId } : {}),
            ...(body.userEmail ? { "X-User-Email": body.userEmail } : {}),
            ...(body.userName ? { "X-User-Name": body.userName } : {}),
            "X-User-Plan": effectivePlan,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sanitizedBody),
          cache: "no-store",
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
                ogTitle: body.ogTitle || body.og_title,
                og_title: body.ogTitle || body.og_title,
                ogDescription: body.ogDescription || body.og_description,
                og_description: body.ogDescription || body.og_description,
                metaTitle: body.metaTitle || body.meta_title,
                password: body.password || undefined,
                isCloaked: Boolean(body.isCloaked || body.is_cloaked),
                routingRules: body.routingRules || body.routing_rules || undefined,
                geoTargeting: body.geoTargeting || body.geo_targeting || undefined,
                deviceTargeting: body.deviceTargeting || body.device_targeting || undefined,
                maxClicks: body.maxClicks !== undefined ? Number(body.maxClicks) : undefined,
                fallbackUrl: body.fallbackUrl || body.fallback_url || undefined,
              },
            },
            { status: 201 }
          );
        }
      }

      return NextResponse.json(
        {
          success: false,
          code: data.code || "PLAN_UPGRADE_REQUIRED",
          error: data.error || data.message || "Fonctionnalité réservée au forfait supérieur",
        },
        { status: 403 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data.error || data.message || `Erreur Cloudflare Worker (${res.status})`,
        },
        { status: res.status }
      );
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
          password: body.password || undefined,
          isCloaked: Boolean(body.isCloaked || body.is_cloaked),
          routingRules: body.routingRules || body.routing_rules || undefined,
          geoTargeting: body.geoTargeting || body.geo_targeting || undefined,
          deviceTargeting: body.deviceTargeting || body.device_targeting || undefined,
          maxClicks: body.maxClicks !== undefined ? Number(body.maxClicks) : undefined,
          fallbackUrl: body.fallbackUrl || body.fallback_url || undefined,
        },
      },
      { status: res.status }
    );
  } catch (error: any) {
    console.warn("[Links Proxy POST] Error connecting to Worker:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Impossible de contacter le Worker Cloudflare" },
      { status: 502 }
    );
  }
}
