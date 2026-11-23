import { NextResponse } from "next/server";
import {
  trackClickAsync,
  evaluateTargetUrl,
  detectVisitorGeoAsync,
  fetchWorkerLink,
} from "@/lib/redirect-engine";
import { checkRateLimit } from "@/lib/security-utils";
import { parseBody, parseParams, slugParamsSchema, linkUnlockBodySchema } from "@/lib/api-schemas";

async function resolveLinkData(slug: string, req: Request) {
  const linkObj = await fetchWorkerLink(slug);
  if (!linkObj) return null;

  const rawTargetUrl = linkObj.target_url || linkObj.targetUrl || null;
  if (!rawTargetUrl) return null;

  const evaluatedTargetUrl = evaluateTargetUrl(rawTargetUrl, req, linkObj);

  const password = linkObj.password;
  const hasPassword = Boolean(
    password ||
    linkObj.is_password_protected ||
    (linkObj as any).isPasswordProtected ||
    (linkObj as any).has_password
  );

  const isCloaked = Boolean(linkObj.is_cloaked || linkObj.isCloaked);
  const metaTitle = linkObj.meta_title || linkObj.metaTitle || linkObj.og_title || slug;
  const pathLockMode = linkObj.path_lock_mode || linkObj.pathLockMode || "off";
  const pathLockPrefix = linkObj.path_lock_prefix || linkObj.pathLockPrefix || "";
  const pathLockMessage = linkObj.path_lock_message || linkObj.pathLockMessage || "";
  const pathLockPassword = linkObj.path_lock_password || linkObj.pathLockPassword || "";

  const expTime = linkObj.expires_at || linkObj.expiresAt;
  const isExpired = Boolean(expTime && new Date(expTime).getTime() <= Date.now());
  const rawActive = linkObj.is_active !== undefined ? linkObj.is_active : (linkObj.isActive !== undefined ? (linkObj.isActive ? 1 : 0) : 1);
  const isActive = isExpired ? false : (rawActive !== 0 && linkObj.isActive !== false);

  return {
    id: linkObj.id || `link_${slug}`,
    slug,
    domainName: linkObj.domain || (linkObj as any).domain_name || "lsho.cc",
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
    expiresAt: linkObj.expires_at || linkObj.expiresAt || null,
    maxClicks: linkObj.max_clicks !== undefined ? linkObj.max_clicks : linkObj.maxClicks !== undefined ? linkObj.maxClicks : null,
    fallbackUrl: linkObj.fallback_url || linkObj.fallbackUrl || null,
    clicksCount: Number(linkObj.clicks_count || (linkObj as any).clicksCount || linkObj.clicks || 0),
    userId: linkObj.userId || (linkObj as any).user_id || "",
  };
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rawParams = await params;
  const { data: pData, error: pError } = parseParams(rawParams, slugParamsSchema);
  if (pError) return pError;
  const slug = pData.slug;

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
      // L'URL de destination est masquée si le lien est protégé par mot de passe ou masqué (cloaked / PathLock)
      targetUrl:
        link.isPasswordProtected || link.isCloaked || (link.pathLockMode && link.pathLockMode !== "off")
          ? undefined
          : link.targetUrl,
    },
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const rawParams = await params;
  const { data: pData, error: pError } = parseParams(rawParams, slugParamsSchema);
  if (pError) return pError;
  const slug = pData.slug;

  const link = await resolveLinkData(slug, req);
  if (!link) {
    return NextResponse.json(
      { success: false, error: "Lien introuvable" },
      { status: 404 },
    );
  }

  try {
    const { data: body, error: bodyError } = await parseBody(req, linkUnlockBodySchema);
    if (bodyError) return bodyError;
    const providedPassword = (body?.password || "").trim();
    const requiredPassword = (link.password || link.pathLockPassword || "").trim();

    if (requiredPassword) {
      const clientIp =
        req.headers.get("cf-connecting-ip") ||
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        "ip_anon";
      const rateLimitKey = `gate_${slug}_${clientIp}`;
      const rateCheck = checkRateLimit(rateLimitKey, 10, 60000);

      if (!rateCheck.allowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Trop de tentatives infructueuses. Veuillez réessayer dans ${rateCheck.retryAfterSec} secondes.`,
            code: "RATE_LIMITED",
          },
          {
            status: 429,
            headers: {
              "Retry-After": String(rateCheck.retryAfterSec || 60),
            },
          },
        );
      }
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

    if (!requiredPassword || providedPassword === requiredPassword) {
      // Détection géolocalisation authentique (zéro mock/hardcode)
      const geo = await detectVisitorGeoAsync(req).catch(() => undefined);
      // Enregistrement direct du clic dans Cloudflare D1
      await trackClickAsync(req, slug, link as any, geo, link.targetUrl).catch(() => {});

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
