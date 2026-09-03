import { NextResponse } from "next/server";
import { saveProtectedLink, deleteProtectedLink } from "@/lib/protected-links-store";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

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

    if (body.slug) {
      saveProtectedLink({
        slug: body.slug,
        password: body.password,
        isCloaked: body.isCloaked !== undefined ? Boolean(body.isCloaked) : undefined,
        metaTitle: body.metaTitle || body.ogTitle,
        ogTitle: body.ogTitle || body.og_title || body.metaTitle,
        ogDescription: body.ogDescription || body.og_description,
        ogImage: body.ogImage || body.og_image,
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
    }

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
      body: JSON.stringify({
        ...body,
        plan: effectivePlan,
      }),
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
                password: body.password || undefined,
                isCloaked: Boolean(body.isCloaked || body.is_cloaked),
                routingRules: body.routingRules || body.routing_rules || undefined,
                geoTargeting: body.geoTargeting || body.geo_targeting || undefined,
                deviceTargeting: body.deviceTargeting || body.device_targeting || undefined,
                maxClicks: body.maxClicks !== undefined ? Number(body.maxClicks) : body.max_clicks !== undefined ? Number(body.max_clicks) : undefined,
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
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { success: false, error: err.error || "Erreur suppression Worker" },
        { status: res.status }
      );
    }

    // Attempt to cleanup local protected store if slug is provided
    const slug = searchParams.get("slug");
    if (slug) {
      deleteProtectedLink(slug);
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
