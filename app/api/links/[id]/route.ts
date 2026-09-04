import { NextResponse } from "next/server";
import { saveProtectedLink, deleteProtectedLink } from "@/lib/protected-links-store";
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

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await req.json();
    const userId = body.userId || "";
    const effectivePlan = (body.userPlan || body.plan || "PRO").toUpperCase();
    const isPro = effectivePlan === "PRO" || effectivePlan === "BUSINESS" || effectivePlan === "ENTERPRISE";

    const sanitizedOgImage =
      (body.ogImage || body.og_image) &&
      (body.ogImage || body.og_image).startsWith("data:") &&
      (body.ogImage || body.og_image).length > 100000
        ? undefined
        : (body.ogImage || body.og_image);

    // 1. Persist in Convex Cloud DB
    if (body.slug) {
      try {
        await convex.mutation(api.links.upsertLink, {
          userId: userId || "usr_default",
          slug: body.slug,
          targetUrl: body.targetUrl || body.target_url || "",
          domainName: body.domainName || body.domain_name || "lsho.cc",
          title: body.ogTitle || body.metaTitle || body.title || body.slug,
          metaTitle: body.metaTitle || body.meta_title || body.ogTitle,
          ogTitle: body.ogTitle || body.og_title,
          ogDescription: body.ogDescription || body.og_description,
          ogImage: sanitizedOgImage,
          password: body.password,
          isPasswordProtected: Boolean(body.password),
          isCloaked: body.isCloaked !== undefined ? Boolean(body.isCloaked) : undefined,
          cloaking: body.isCloaked !== undefined ? Boolean(body.isCloaked) : undefined,
          hideReferrer: body.hideReferrer !== undefined ? Boolean(body.hideReferrer) : undefined,
          expiresAt: body.expiresAt || body.expires_at,
          maxClicks: body.maxClicks !== undefined ? Number(body.maxClicks) : undefined,
          fallbackUrl: body.fallbackUrl || body.fallback_url,
          tags: body.tags,
          routingRules: body.routingRules || body.routing_rules,
          geoTargeting: body.geoTargeting || body.geo_targeting,
          deviceTargeting: body.deviceTargeting || body.device_targeting,
          abVariations: body.abVariations || body.ab_variations,
          mainWeight: body.mainWeight !== undefined ? Number(body.mainWeight) : undefined,
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : undefined,
        });
      } catch (cxErr) {
        console.warn("[Convex PATCH upsertLink error]:", cxErr);
      }
    }

    // 2. Persist in local in-memory store
    if (body.slug) {
      try {
        saveProtectedLink({
          slug: body.slug,
          password: body.password,
          isCloaked: body.isCloaked !== undefined ? Boolean(body.isCloaked) : undefined,
          metaTitle: body.metaTitle || body.ogTitle,
          ogTitle: body.ogTitle || body.og_title || body.metaTitle,
          ogDescription: body.ogDescription || body.og_description,
          ogImage: sanitizedOgImage,
          targetUrl: body.targetUrl,
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

    // 3. Forward to Cloudflare Worker
    const workerPayload = {
      ...body,
      ogImage: sanitizedOgImage,
      og_image: sanitizedOgImage,
      plan: effectivePlan,
      userPlan: effectivePlan,
    };

    const url = new URL(`${WORKER_URL}/api/v1/links/${id}`);
    if (userId) url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      method: "PATCH",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        ...(userId ? { "X-User-Id": userId } : {}),
        "X-User-Plan": effectivePlan,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(workerPayload),
      cache: "no-store",
    });

    const data = await res.json().catch(() => ({}));

    if (res.status === 403 || res.status === 400) {
      if (isPro) {
        const sanitizedBody = { ...body };
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
            { status: 200 }
          );
        }
      }
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
    console.warn("[Links Proxy PATCH] Error connecting to Worker:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Impossible de contacter le Worker Cloudflare" },
      { status: 502 }
    );
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  try {
    const url = new URL(`${WORKER_URL}/api/v1/links/${id}`);
    if (userId) url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      method: "DELETE",
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

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error: any) {
    console.warn("[Links Proxy DELETE] Error connecting to Worker:", error);
    return NextResponse.json(
      { success: false, error: error?.message || "Impossible de contacter le Worker Cloudflare" },
      { status: 502 }
    );
  }
}
