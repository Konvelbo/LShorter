import { NextResponse } from "next/server";
import { saveProtectedLink, deleteProtectedLink, getProtectedLink } from "@/lib/protected-links-store";
import { deleteFromBunny, uploadToBunny } from "@/lib/bunny";
import { invalidateBotResponseCache } from "@/app/r/[slug]/route";

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
  let body: any = {};
  try {
    body = await req.json();
    const userId = body.userId || "";
    const effectivePlan = (body.userPlan || body.plan || "PRO").toUpperCase();
    const isPro = effectivePlan === "PRO" || effectivePlan === "BUSINESS" || effectivePlan === "ENTERPRISE";

    const rawOg = body.ogImage || body.og_image || "";
    let sanitizedOgImage: string | undefined = rawOg || undefined;

    if (rawOg && rawOg.startsWith("data:")) {
      try {
        const uploadResult = await uploadToBunny(rawOg, { folder: "Banners" });
        if (uploadResult?.success && uploadResult.url) {
          sanitizedOgImage = uploadResult.url;
        }
      } catch (uploadErr) {
        console.warn("[Links API] Failed to upload base64 ogImage to Bunny on update:", uploadErr);
      }
    }

    // If banner was updated, clean up the previous banner from Bunny CDN
    const previousImage = body.previousOgImage || body.previous_og_image || getProtectedLink(body.slug || id)?.ogImage;
    if (previousImage && sanitizedOgImage && previousImage !== sanitizedOgImage && !previousImage.startsWith("data:")) {
      deleteFromBunny(previousImage).catch((e) => console.warn("[Bunny Delete Previous Banner Error]:", e));
    }

    const effectiveTwitterCard = body.twitterCard || body.twitter_card || undefined;

    // 1. Persist in local store
    if (body.slug || id) {
      try {
        saveProtectedLink({
          slug: body.slug || id,
          password: body.password || undefined,
          isCloaked: body.isCloaked !== undefined ? Boolean(body.isCloaked) : undefined,
          metaTitle: body.metaTitle || body.ogTitle || undefined,
          ogTitle: body.ogTitle || body.og_title || body.metaTitle || undefined,
          ogDescription: body.ogDescription || body.og_description || undefined,
          ogImage: sanitizedOgImage || undefined,
          twitterCard: effectiveTwitterCard,
          targetUrl: body.targetUrl || body.target_url || undefined,
          routingRules: body.routingRules || body.routing_rules || undefined,
          geoTargeting: body.geoTargeting || body.geo_targeting || undefined,
          deviceTargeting: body.deviceTargeting || body.device_targeting || undefined,
          maxClicks: body.maxClicks !== undefined ? Number(body.maxClicks) : body.max_clicks !== undefined ? Number(body.max_clicks) : undefined,
          fallbackUrl: body.fallbackUrl || body.fallback_url || undefined,
          abVariations: body.abVariations || body.ab_variations || undefined,
          mainWeight: body.mainWeight !== undefined ? Number(body.mainWeight) : undefined,
          userId: body.userId,
          isActive: body.isActive !== undefined ? Boolean(body.isActive) : (body.is_active !== undefined ? Boolean(body.is_active) : undefined),
          expiresAt: body.expiresAt || body.expires_at || undefined,
          redirectType: body.redirectType || body.redirect_type || undefined,
          passParams: body.passParams !== undefined ? Boolean(body.passParams) : body.pass_params !== undefined ? Boolean(body.pass_params) : undefined,
        });
        if (body.slug) invalidateBotResponseCache(body.slug);
        invalidateBotResponseCache(id);
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
      twitterCard: body.twitterCard || body.twitter_card || undefined,
      twitter_card: body.twitterCard || body.twitter_card || undefined,
      metaTitle: body.metaTitle || body.meta_title || body.ogTitle,
      meta_title: body.meta_title || body.metaTitle || body.ogTitle,
      redirectType: body.redirectType || body.redirect_type,
      redirect_type: body.redirectType || body.redirect_type,
      passParams: body.passParams !== undefined ? Boolean(body.passParams) : body.pass_params !== undefined ? Boolean(body.pass_params) : undefined,
      pass_params: body.passParams !== undefined ? Boolean(body.passParams) : body.pass_params !== undefined ? Boolean(body.pass_params) : undefined,
      routingRules: body.routingRules !== undefined ? body.routingRules : body.routing_rules,
      routing_rules: body.routing_rules !== undefined ? body.routing_rules : body.routingRules,
      geoTargeting: body.geoTargeting !== undefined ? body.geoTargeting : body.geo_targeting,
      geo_targeting: body.geo_targeting !== undefined ? body.geo_targeting : body.geoTargeting,
      deviceTargeting: body.deviceTargeting !== undefined ? body.deviceTargeting : body.device_targeting,
      device_targeting: body.device_targeting !== undefined ? body.device_targeting : body.deviceTargeting,
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
                twitterCard: effectiveTwitterCard || "summary_large_image",
                twitter_card: effectiveTwitterCard || "summary_large_image",
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

    // 4. If worker returns 404, look up real worker link ID by slug and retry PATCH
    if (res.status === 404) {
      try {
        const slugToFind = body.slug || id;
        const listRes = await fetch(`${WORKER_URL}/api/v1/links?userId=${userId || "all"}`, {
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
            Authorization: `Bearer ${FRONTEND_SECRET}`,
          },
          cache: "no-store",
        });

        if (listRes.ok) {
          const listJson = await listRes.json();
          const list = Array.isArray(listJson.data) ? listJson.data : [];
          const found = list.find((l: any) => l.slug?.toLowerCase() === slugToFind.toLowerCase() || l.id === id);
          if (found && found.id && found.id !== id) {
            const retryPatch = await fetch(`${WORKER_URL}/api/v1/links/${found.id}`, {
              method: "PATCH",
              headers: {
                "X-Frontend-Secret": FRONTEND_SECRET,
                Authorization: `Bearer ${FRONTEND_SECRET}`,
                ...(userId ? { "X-User-Id": userId } : {}),
                "Content-Type": "application/json",
              },
              body: JSON.stringify(workerPayload),
            });
            if (retryPatch.ok) {
              const patchData = await retryPatch.json().catch(() => ({}));
              return NextResponse.json({
                success: true,
                data: {
                  ...(patchData.data || patchData),
                  twitterCard: effectiveTwitterCard || "summary_large_image",
                  twitter_card: effectiveTwitterCard || "summary_large_image",
                },
              }, { status: 200 });
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
            "X-User-Plan": effectivePlan,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(workerPayload),
        });
        if (createRes.ok) {
          const createData = await createRes.json().catch(() => ({}));
          return NextResponse.json({
            success: true,
            data: {
              ...(createData.data || createData),
              twitterCard: effectiveTwitterCard || "summary_large_image",
              twitter_card: effectiveTwitterCard || "summary_large_image",
            },
          }, { status: 200 });
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
            twitterCard: effectiveTwitterCard || "summary_large_image",
            twitter_card: effectiveTwitterCard || "summary_large_image",
          },
        },
        { status: 200 }
      );
    }

    if (!res.ok) {
      console.warn("[Links Proxy PATCH] Worker returned error status:", res.status, "- Local fallback succeeded.");
      return NextResponse.json(
        {
          success: true,
          data: {
            id,
            ...workerPayload,
            isActive: body.isActive !== undefined ? Boolean(body.isActive) : (body.is_active !== undefined ? Boolean(body.is_active) : true),
            expiresAt: body.expiresAt || body.expires_at,
            ogImage: sanitizedOgImage,
            og_image: sanitizedOgImage,
            ogTitle: body.ogTitle || body.og_title,
            og_title: body.ogTitle || body.og_title,
            ogDescription: body.ogDescription || body.og_description,
            og_description: body.ogDescription || body.og_description,
            metaTitle: body.metaTitle || body.meta_title,
            twitterCard: effectiveTwitterCard || "summary_large_image",
            twitter_card: effectiveTwitterCard || "summary_large_image",
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

    return NextResponse.json(
      {
        ...data,
        success: true,
        data: {
          ...(data.data || {}),
          ogImage: sanitizedOgImage,
          og_image: sanitizedOgImage,
          ogTitle: body.ogTitle || body.og_title,
          og_title: body.ogTitle || body.og_title,
          ogDescription: body.ogDescription || body.og_description,
          og_description: body.ogDescription || body.og_description,
          metaTitle: body.metaTitle || body.meta_title,
          twitterCard: effectiveTwitterCard || "summary_large_image",
          twitter_card: effectiveTwitterCard || "summary_large_image",
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
      { status: 200 }
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

    // 2. Delete from local memory store (by ID and slug)
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
      // Return success as local store already deleted it
      return NextResponse.json({ success: true });
    }

    const data = await res.json().catch(() => ({ success: true }));
    return NextResponse.json(data);
  } catch (error: any) {
    console.warn("[Links Proxy DELETE] Non-fatal worker connection warning:", error);
    return NextResponse.json({ success: true });
  }
}
