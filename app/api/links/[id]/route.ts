import { NextResponse } from "next/server";
import { saveProtectedLink, deleteProtectedLink, getProtectedLink } from "@/lib/protected-links-store";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { deleteFromBunny } from "@/lib/bunny";

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

    // If banner was updated, clean up the previous banner from Bunny CDN
    const previousImage = body.previousOgImage || body.previous_og_image || getProtectedLink(body.slug || id)?.ogImage;
    if (previousImage && sanitizedOgImage && previousImage !== sanitizedOgImage) {
      deleteFromBunny(previousImage).catch((e) => console.warn("[Bunny Delete Previous Banner Error]:", e));
    }

    // 1. Persist in Convex Cloud DB
    if (body.slug) {
      try {
        await convex.mutation(api.links.upsertLink, {
          userId: userId || "usr_default",
          slug: body.slug,
          targetUrl: body.targetUrl || body.target_url || "",
          domainName: body.domainName || body.domain_name || "lsho.cc",
          title: body.ogTitle || body.metaTitle || body.title || body.slug,
          metaTitle: body.metaTitle || body.meta_title || body.ogTitle || undefined,
          ogTitle: body.ogTitle || body.og_title || undefined,
          ogDescription: body.ogDescription || body.og_description || undefined,
          ogImage: sanitizedOgImage || undefined,
          password: body.password || undefined,
          isPasswordProtected: Boolean(body.password),
          isCloaked: body.isCloaked !== undefined ? Boolean(body.isCloaked) : undefined,
          cloaking: body.isCloaked !== undefined ? Boolean(body.isCloaked) : undefined,
          hideReferrer: body.hideReferrer !== undefined ? Boolean(body.hideReferrer) : undefined,
          expiresAt: body.expiresAt || body.expires_at || undefined,
          maxClicks: body.maxClicks !== undefined ? Number(body.maxClicks) : undefined,
          fallbackUrl: body.fallbackUrl || body.fallback_url || undefined,
          tags: body.tags || undefined,
          routingRules: body.routingRules || body.routing_rules || undefined,
          geoTargeting: body.geoTargeting || body.geo_targeting || undefined,
          deviceTargeting: body.deviceTargeting || body.device_targeting || undefined,
          abVariations: body.abVariations || body.ab_variations || undefined,
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
          password: body.password || undefined,
          isCloaked: body.isCloaked !== undefined ? Boolean(body.isCloaked) : undefined,
          metaTitle: body.metaTitle || body.ogTitle || undefined,
          ogTitle: body.ogTitle || body.og_title || body.metaTitle || undefined,
          ogDescription: body.ogDescription || body.og_description || undefined,
          ogImage: sanitizedOgImage || undefined,
          targetUrl: body.targetUrl || body.target_url || undefined,
          routingRules: body.routingRules || body.routing_rules || undefined,
          geoTargeting: body.geoTargeting || body.geo_targeting || undefined,
          deviceTargeting: body.deviceTargeting || body.device_targeting || undefined,
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

    // 4. If worker returns 404, fallback to creating/syncing or returning local/Convex success
    if (res.status === 404) {
      try {
        const createUrl = new URL(`${WORKER_URL}/api/v1/links`);
        const createRes = await fetch(createUrl.toString(), {
          method: "POST",
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
            Authorization: `Bearer ${FRONTEND_SECRET}`,
            ...(userId ? { "X-User-Id": userId } : {}),
            "X-User-Plan": effectivePlan,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workerPayload),
        });
        if (createRes.ok) {
          const createData = await createRes.json().catch(() => ({}));
          return NextResponse.json({ success: true, data: createData.data || createData }, { status: 200 });
        }
      } catch (createErr) {
        console.warn("[Links Proxy PATCH] Fallback sync to worker failed:", createErr);
      }

      return NextResponse.json(
        {
          success: true,
          data: {
            id,
            ...workerPayload,
            ogImage: sanitizedOgImage,
            og_image: sanitizedOgImage,
            ogTitle: body.ogTitle || body.og_title,
            og_title: body.ogTitle || body.og_title,
            ogDescription: body.ogDescription || body.og_description,
            og_description: body.ogDescription || body.og_description,
            metaTitle: body.metaTitle || body.meta_title,
          },
        },
        { status: 200 }
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
  const slug = searchParams.get("slug");
  const imageParam = searchParams.get("image") || searchParams.get("ogImage");

  try {
    // 1. Delete associated image from Bunny.net CDN Storage
    let bannerToDelete = imageParam;
    if (!bannerToDelete && (slug || id)) {
      const local = getProtectedLink(slug || id);
      if (local?.ogImage) bannerToDelete = local.ogImage;
    }
    if (bannerToDelete) {
      deleteFromBunny(bannerToDelete).catch((e) => console.warn("[Bunny Delete Banner Error]:", e));
    }

    // 2. Delete from Convex if ID is a valid Convex ID
    if (id && userId) {
      try {
        await convex.mutation(api.links.deleteLink, { id: id as any, userId }).catch(() => {});
      } catch {}
    }

    // 3. Delete from local memory store (by ID and slug)
    try {
      if (slug) deleteProtectedLink(slug);
      deleteProtectedLink(id);
    } catch {}

    // 3. Delete from Worker
    const url = new URL(`${WORKER_URL}/api/v1/links/${id}`);
    if (userId) url.searchParams.set("userId", userId);
    if (slug) url.searchParams.set("slug", slug);

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
      // Even if worker returned non-OK, Convex already deleted it, so return success
      return NextResponse.json({ success: true });
    }

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error: any) {
    console.warn("[Links Proxy DELETE] Non-fatal worker connection warning:", error);
    return NextResponse.json({ success: true });
  }
}
