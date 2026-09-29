import { NextResponse } from "next/server";
import { trackClickAsync, evaluateTargetUrl } from "@/app/r/[slug]/route";

import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

async function resolveLinkData(slug: string, req: Request) {
  // 1. Vérification du slug auprès du Worker via la redirection /r/ (302)
  let workerTargetUrl: string | null = null;
  let isActive = true;

  try {
    const redirectRes = await fetch(`${WORKER_URL}/r/${slug}`, {
      method: "GET",
      headers: {
        "X-Internal-Probe": "1",
        Purpose: "prefetch",
        "X-Frontend-Secret": FRONTEND_SECRET,
      },
      redirect: "manual",
      cache: "no-store",
    });

    if (redirectRes.status === 302 || redirectRes.status === 307) {
      workerTargetUrl = redirectRes.headers.get("location");
    } else if (redirectRes.status === 404 || redirectRes.status === 403) {
      isActive = false;
    }
  } catch (err) {
    console.warn("[Worker Redirect Resolution error]:", err);
  }

  // 2. Recherche directe via /api/v1/links/:slug, avec repli sur /api/v1/links
  let linkObj: any = null;
  try {
    const singleRes = await fetch(
      `${WORKER_URL}/api/v1/links/${encodeURIComponent(slug)}`,
      {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
        },
        cache: "no-store",
      },
    ).catch(() => null);

    if (singleRes && singleRes.ok) {
      const singleData = await singleRes.json().catch(() => null);
      const candidate = singleData?.data || singleData;
      if (candidate && (candidate.target_url || candidate.targetUrl)) {
        linkObj = candidate;
      }
    }

    if (!linkObj) {
      const listRes = await fetch(`${WORKER_URL}/api/v1/links?limit=100`, {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
        },
        cache: "no-store",
      });

      if (listRes.ok) {
        const listData = await listRes.json();
        const list = Array.isArray(listData?.data) ? listData.data : [];
        linkObj =
          list.find((l: any) => l.slug?.toLowerCase() === slug.toLowerCase()) ||
          null;
      }
    }
  } catch (err) {
    console.warn("[Worker Links Lookup error]:", err);
  }

  // Si le worker fournit l'état actif, on met à jour le flag
  if (linkObj) {
    if (linkObj.is_active !== undefined) {
      isActive = Boolean(
        linkObj.is_active !== 0 && linkObj.is_active !== false,
      );
    } else if (linkObj.isActive !== undefined) {
      isActive = Boolean(linkObj.isActive);
    }
  }

  const rawTargetUrl =
    workerTargetUrl || linkObj?.target_url || linkObj?.targetUrl || null;

  if (!rawTargetUrl) {
    return null;
  }

  const evaluatedTargetUrl = evaluateTargetUrl(
    rawTargetUrl,
    req,
    linkObj || {},
  );

  const password = linkObj?.password;
  const hasPassword = Boolean(
    password ||
    linkObj?.is_password_protected ||
    linkObj?.isPasswordProtected ||
    linkObj?.has_password,
  );

  const isCloaked = Boolean(linkObj?.is_cloaked || linkObj?.isCloaked);

  const metaTitle =
    linkObj?.meta_title || linkObj?.metaTitle || linkObj?.og_title || slug;

  const pathLockMode =
    linkObj?.path_lock_mode || linkObj?.pathLockMode || "off";
  const pathLockPrefix =
    linkObj?.path_lock_prefix || linkObj?.pathLockPrefix || "";
  const pathLockMessage =
    linkObj?.path_lock_message || linkObj?.pathLockMessage || "";
  const pathLockPassword =
    linkObj?.path_lock_password || linkObj?.pathLockPassword || "";

  return {
    id: linkObj?.id || `link_${slug}`,
    slug,
    domainName: linkObj?.domain_name || "lsho.cc",
    isPasswordProtected: hasPassword,
    password: password || undefined,
    isCloaked,
    pathLockMode,
    pathLockPrefix,
    pathLockMessage,
    pathLockPassword,
    metaTitle,
    targetUrl: evaluatedTargetUrl,
    isActive,
    expiresAt: linkObj?.expires_at || linkObj?.expiresAt || null,
    maxClicks: linkObj?.max_clicks || linkObj?.maxClicks || null,
    fallbackUrl: linkObj?.fallback_url || linkObj?.fallbackUrl || null,
    clicksCount: Number(
      linkObj?.clicks_count || linkObj?.clicksCount || linkObj?.clicks || 0,
    ),
    userId: linkObj?.user_id || "usr_default",
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json(
      { success: false, error: "Slug manquant" },
      { status: 400 },
    );
  }

  const link = await resolveLinkData(slug, req);
  if (!link) {
    return NextResponse.json(
      { success: false, error: "Lien introuvable ou expiré" },
      { status: 404 },
    );
  }

  if (!link.isActive) {
    return NextResponse.json(
      { success: false, error: "Ce lien a été désactivé par son propriétaire" },
      { status: 403 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      id: link.id,
      slug: link.slug,
      domainName: link.domainName,
      isPasswordProtected: link.isPasswordProtected,
      isCloaked: link.isCloaked,
      metaTitle: link.metaTitle,
      // L'URL de destination est masquée si le lien est protégé par mot de passe
      targetUrl: link.isPasswordProtected ? undefined : link.targetUrl,
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  if (!slug) {
    return NextResponse.json(
      { success: false, error: "Slug manquant" },
      { status: 400 },
    );
  }

  const link = await resolveLinkData(slug, req);
  if (!link) {
    return NextResponse.json(
      { success: false, error: "Lien introuvable" },
      { status: 404 },
    );
  }

  try {
    const body = await req.json();
    const providedPassword = (body?.password || "").trim();
    const actualPassword = (link.password || "").trim();

    if (!link.isActive) {
      return NextResponse.json(
        {
          success: false,
          error: "LINK_PAUSED",
          fallbackUrl: `/r/${slug}/paused`,
        },
        { status: 403 },
      );
    }

    if (link.expiresAt && new Date(link.expiresAt).getTime() <= Date.now()) {
      return NextResponse.json(
        {
          success: false,
          error: "LINK_EXPIRED",
          fallbackUrl: `/r/${slug}/expired`,
        },
        { status: 403 },
      );
    }

    // Vérification du quota de clics
    if (
      link.maxClicks &&
      link.maxClicks > 0 &&
      (link.clicksCount || 0) >= link.maxClicks
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "QUOTA_REACHED",
          fallbackUrl: link.fallbackUrl || `/r/${slug}/expired`,
        },
        { status: 403 },
      );
    }

    if (!actualPassword || providedPassword === actualPassword) {
      // Enregistrement direct du clic dans Cloudflare D1
      await trackClickAsync(req, slug, link).catch(() => {});

      const isIsolated = Boolean(
        link.isCloaked || (link.pathLockMode && link.pathLockMode !== "off"),
      );

      return NextResponse.json({
        success: true,
        targetUrl: link.targetUrl,
        isCloaked: isIsolated,
        pathLockMode: link.pathLockMode,
        pathLockPrefix: link.pathLockPrefix,
        pathLockMessage: link.pathLockMessage,
        pathLockPassword: link.pathLockPassword,
        metaTitle: link.metaTitle,
      });
    }

    return NextResponse.json(
      { success: false, error: "Mot de passe incorrect. Veuillez réessayer." },
      { status: 401 },
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || "Erreur serveur" },
      { status: 500 },
    );
  }
}
