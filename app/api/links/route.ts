import { NextResponse } from "next/server";
import { saveProtectedLink, getProtectedLink, getAllProtectedLinks } from "@/lib/protected-links-store";

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

    const workerData = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
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

    // 1. Merge workerList links with Local Store
    for (const l of workerList) {
      const slugKey = (l.slug || "").toLowerCase();
      seenSlugs.add(slugKey);
      const local = getProtectedLink(slugKey);

      const maxClicksVal = l.max_clicks !== undefined ? l.max_clicks : local?.maxClicks;
      const clicksVal = Math.max(
        Number(l.clicks_count || l.clicksCount || l.clicks || 0),
        Number(local?.clicksCount || 0)
      );
      // If maxClicks is defined, clamp clicksVal to maxClicks
      const finalClicks = maxClicksVal && maxClicksVal > 0 ? Math.min(clicksVal, Number(maxClicksVal)) : clicksVal;

      mergedList.push({
        ...l,
        clicks_count: finalClicks,
        clicksCount: finalClicks,
        meta_title: l.meta_title || l.metaTitle || local?.metaTitle,
        metaTitle: l.metaTitle || l.meta_title || local?.metaTitle,
        og_title: l.og_title || l.ogTitle || local?.ogTitle,
        ogTitle: l.ogTitle || l.og_title || local?.ogTitle,
        og_description: l.og_description || l.ogDescription || local?.ogDescription,
        ogDescription: l.ogDescription || l.og_description || local?.ogDescription,
        og_image: l.og_image || l.ogImage || local?.ogImage,
        ogImage: l.ogImage || l.og_image || local?.ogImage,
        password: l.password || local?.password,
        has_password: Boolean(l.password || l.has_password || local?.password),
        is_cloaked: l.is_cloaked !== undefined ? l.is_cloaked : local?.isCloaked ? 1 : 0,
        isCloaked: Boolean(l.isCloaked || l.is_cloaked || local?.isCloaked),
        hide_referrer: l.hide_referrer !== undefined ? l.hide_referrer : 0,
        hideReferrer: Boolean(l.hideReferrer || l.hide_referrer),
        routing_rules: l.routing_rules || local?.routingRules,
        routingRules: l.routingRules || local?.routingRules,
        geo_targeting: l.geo_targeting || local?.geoTargeting,
        geoTargeting: l.geoTargeting || local?.geoTargeting,
        device_targeting: l.device_targeting || local?.deviceTargeting,
        deviceTargeting: l.deviceTargeting || local?.deviceTargeting,
        max_clicks: l.max_clicks !== undefined ? l.max_clicks : local?.maxClicks,
        maxClicks: l.maxClicks !== undefined ? l.maxClicks : local?.maxClicks,
        fallback_url: l.fallback_url || local?.fallbackUrl,
        fallbackUrl: l.fallbackUrl || local?.fallbackUrl,
        ab_variations: l.ab_variations || local?.abVariations,
        abVariations: l.abVariations || local?.abVariations,
        main_weight: l.main_weight !== undefined ? l.main_weight : local?.mainWeight,
        mainWeight: l.mainWeight !== undefined ? l.mainWeight : local?.mainWeight,
        redirect_type: l.redirect_type || l.redirectType || local?.redirectType || "302",
        redirectType: l.redirectType || l.redirect_type || local?.redirectType || "302",
        pass_params: l.pass_params !== undefined ? l.pass_params : local?.passParams !== undefined ? (local.passParams ? 1 : 0) : 1,
        passParams: l.passParams !== undefined ? Boolean(l.passParams) : local?.passParams !== undefined ? Boolean(local.passParams) : true,
        expires_at: local?.expiresAt || l.expires_at || l.expiresAt,
        expiresAt: local?.expiresAt || l.expiresAt || l.expires_at,
        is_active: local?.isActive !== undefined ? (local.isActive ? 1 : 0) : l.is_active !== undefined ? l.is_active : 1,
        isActive: local?.isActive !== undefined ? Boolean(local.isActive) : l.isActive !== undefined ? Boolean(l.isActive) : l.is_active !== undefined ? Boolean(l.is_active) : true,
        tags: l.tags || [],
      });
    }

    // 2. Also add any links from local store not present in workerList (e.g. offline fallback or pending worker sync)
    const localLinks = getAllProtectedLinks();
    for (const local of localLinks) {
      if (!local.slug) continue;
      const slugKey = local.slug.toLowerCase();
      if (!seenSlugs.has(slugKey)) {
        if (!userId || userId === "all" || !local.userId || local.userId === userId) {
          seenSlugs.add(slugKey);
          mergedList.push({
            id: `link_${local.slug}`,
            user_id: local.userId || userId || "usr_default",
            domain_name: "lsho.cc",
            slug: local.slug,
            short_url: `https://lsho.cc/${local.slug}`,
            target_url: local.targetUrl || "",
            clicks_count: local.clicksCount || 0,
            is_active: local.isActive !== false ? 1 : 0,
            isActive: local.isActive !== false,
            created_at: local.updatedAt || new Date().toISOString(),
            meta_title: local.metaTitle,
            metaTitle: local.metaTitle,
            og_title: local.ogTitle,
            ogTitle: local.ogTitle,
            og_description: local.ogDescription,
            ogDescription: local.ogDescription,
            og_image: local.ogImage,
            ogImage: local.ogImage,
            password: local.password,
            has_password: Boolean(local.password),
            is_cloaked: local.isCloaked ? 1 : 0,
            isCloaked: Boolean(local.isCloaked),
            hide_referrer: 0,
            hideReferrer: false,
            routing_rules: local.routingRules,
            routingRules: local.routingRules,
            geo_targeting: local.geoTargeting,
            geoTargeting: local.geoTargeting,
            device_targeting: local.deviceTargeting,
            deviceTargeting: local.deviceTargeting,
            max_clicks: local.maxClicks,
            maxClicks: local.maxClicks,
            fallback_url: local.fallbackUrl,
            fallbackUrl: local.fallbackUrl,
            ab_variations: local.abVariations,
            abVariations: local.abVariations,
            main_weight: local.mainWeight,
            redirect_type: local.redirectType || "302",
            redirectType: local.redirectType || "302",
            pass_params: local.passParams !== false ? 1 : 0,
            passParams: local.passParams !== false,
            expires_at: local.expiresAt,
            expiresAt: local.expiresAt,
            tags: [],
          });
        }
      }
    }

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
    const effectivePlan = (body.userPlan || body.plan || "FREEMIUM").toUpperCase();
    const isPro = effectivePlan === "PRO" || effectivePlan === "BUSINESS" || effectivePlan === "ENTERPRISE";

    const sanitizedOgImage =
      body.ogImage && body.ogImage.startsWith("data:") && body.ogImage.length > 100000
        ? undefined
        : body.ogImage || body.og_image;

    // 1. Persist in local store
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
          redirectType: body.redirectType || body.redirect_type || undefined,
          passParams: body.passParams !== undefined ? Boolean(body.passParams) : body.pass_params !== undefined ? Boolean(body.pass_params) : undefined,
          userId: body.userId,
          isActive: body.isActive !== false && body.is_active !== 0,
          expiresAt: body.expiresAt || body.expires_at || undefined,
        });
      } catch (storeErr) {
        console.warn("[ProtectedLinkStore] Non-fatal save warning:", storeErr);
      }
    }

    // 2. Forward to Cloudflare Worker D1 & KV
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
      redirectType: body.redirectType || body.redirect_type,
      redirect_type: body.redirectType || body.redirect_type,
      passParams: body.passParams !== undefined ? Boolean(body.passParams) : body.pass_params !== undefined ? Boolean(body.pass_params) : undefined,
      pass_params: body.passParams !== undefined ? Boolean(body.passParams) : body.pass_params !== undefined ? Boolean(body.pass_params) : undefined,
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

    if (res.status === 403) {
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
      // If local store succeeded and worker returned 500/quota limit, return success with local data
      if (res.status >= 500 && body.slug) {
        console.warn("[Links Proxy POST] Worker error, falling back to local store:", data);
        return NextResponse.json(
          {
            success: true,
            data: {
              id: body.id || `link_${Date.now()}`,
              user_id: body.userId,
              domain_name: body.domainName || "lsho.cc",
              slug: body.slug,
              short_url: `https://${body.domainName || "lsho.cc"}/${body.slug}`,
              target_url: body.targetUrl || body.target_url,
              clicks_count: 0,
              is_active: 1,
              created_at: new Date().toISOString(),
              ogImage: sanitizedOgImage,
              ogTitle: body.ogTitle || body.og_title,
              ogDescription: body.ogDescription || body.og_description,
              metaTitle: body.metaTitle || body.meta_title,
              password: body.password || undefined,
              isCloaked: Boolean(body.isCloaked || body.is_cloaked),
            },
          },
          { status: 201 }
        );
      }

      const rawErr = data.error || data.message || `Erreur Cloudflare Worker (${res.status})`;
      const cleanErr = sanitizeClientErrorMessage(rawErr);
      return NextResponse.json(
        {
          success: false,
          error: cleanErr,
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
      { success: false, error: "Impossible de contacter les serveurs Cloudflare. Veuillez vérifier votre connexion." },
      { status: 502 }
    );
  }
}

function sanitizeClientErrorMessage(raw: any): string {
  if (!raw) return "Une erreur inattendue est survenue. Veuillez réessayer.";
  const msg = typeof raw === "string" ? raw : raw.message || raw.error || String(raw);
  const lower = msg.toLowerCase();

  if (lower.includes("unique") || lower.includes("idx_links_slug") || lower.includes("already exists")) {
    return "Ce slug personnalisé est déjà utilisé. Veuillez en choisir un autre.";
  }
  if (lower.includes("403") || lower.includes("plan_upgrade") || lower.includes("forbidden") || lower.includes("quota")) {
    return "Cette fonctionnalité nécessite un forfait supérieur.";
  }
  if (lower.includes("foreign key") || lower.includes("constraint failed") || lower.includes("sqlite")) {
    return "Erreur temporaire de synchronisation. Veuillez réessayer.";
  }
  if (lower.includes("d1_error") || lower.includes("prepare(") || lower.includes("bind(") || lower.includes("table ") || lower.includes("column ")) {
    return "Une erreur technique est survenue. Veuillez réessayer.";
  }
  return msg;
}
