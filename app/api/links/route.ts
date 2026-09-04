import { NextResponse } from "next/server";
import { saveProtectedLink } from "@/lib/protected-links-store";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    const url = new URL(`${WORKER_URL}/api/v1/links`);
    if (userId) url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
      },
      cache: "no-store",
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: err.error || "Erreur Worker Cloudflare" },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
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
        : body.ogImage;

    // Persist all metadata locally (password, cloaking, meta title, targeting rules, click limits, A/B testing)
    if (body.slug) {
      try {
        saveProtectedLink({
          slug: body.slug,
          password: body.password || undefined,
          isCloaked: Boolean(body.isCloaked || body.is_cloaked),
          metaTitle: body.metaTitle || body.meta_title || body.ogTitle || body.og_title,
          ogTitle: body.ogTitle || body.og_title || body.metaTitle || body.meta_title,
          ogDescription: body.ogDescription || body.og_description,
          ogImage: sanitizedOgImage,
          targetUrl: body.targetUrl || body.target_url,
          routingRules: body.routingRules || body.routing_rules,
          geoTargeting: body.geoTargeting || body.geo_targeting,
          deviceTargeting: body.deviceTargeting || body.device_targeting,
          maxClicks: body.maxClicks !== undefined ? Number(body.maxClicks) : body.max_clicks !== undefined ? Number(body.max_clicks) : undefined,
          fallbackUrl: body.fallbackUrl || body.fallback_url || undefined,
          abVariations: body.abVariations || body.ab_variations || undefined,
          mainWeight: body.mainWeight !== undefined ? Number(body.mainWeight) : undefined,
          userId: body.userId,
        });
      } catch (storeErr) {
        console.warn("[ProtectedLinkStore] Non-fatal save warning:", storeErr);
      }
    }

    const workerPayload = {
      ...body,
      ogImage: sanitizedOgImage,
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
        // User is PRO in application: create the core short link on Worker without triggering worker's freemium plan guard
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
                password: body.password || undefined,
                isCloaked: Boolean(body.isCloaked || body.is_cloaked),
                routingRules: body.routingRules || body.routing_rules || undefined,
                geoTargeting: body.geoTargeting || body.geo_targeting || undefined,
                deviceTargeting: body.deviceTargeting || body.device_targeting || undefined,
                maxClicks: body.maxClicks !== undefined ? Number(body.maxClicks) : body.max_clicks !== undefined ? Number(body.max_clicks) : undefined,
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
          password: body.password || undefined,
          isCloaked: Boolean(body.isCloaked || body.is_cloaked),
          routingRules: body.routingRules || body.routing_rules || undefined,
          geoTargeting: body.geoTargeting || body.geo_targeting || undefined,
          deviceTargeting: body.deviceTargeting || body.device_targeting || undefined,
          maxClicks: body.maxClicks !== undefined ? Number(body.maxClicks) : body.max_clicks !== undefined ? Number(body.max_clicks) : undefined,
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
