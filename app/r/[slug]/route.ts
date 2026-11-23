import { NextResponse } from "next/server";
import {
  detectVisitorGeoAsync,
  parseVisitorDetails,
  isSocialCrawler,
  getCachedBotResponse,
  setCachedBotResponse,
  renderSocialHtml,
  fetchWorkerLink,
  markLinkExpiredAsync,
  evaluateProtectionState,
  evaluateRoutingRules,
  resolveAbTargetUrl,
  preserveUtmParams,
  appendForwardedParams,
  PIXEL_INTERSTITIAL_CSP,
  resolveLinkActivePixels,
  renderPixelInterstitialHtml,
  shouldTrackClick,
  trackClickAsync,
} from "@/lib/redirect-engine";

export const dynamic = "force-dynamic";

export {
  invalidateBotResponseCache,
  evaluateTargetUrl,
  trackClickAsync,
} from "@/lib/redirect-engine";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!slug) {
      const res = NextResponse.redirect(new URL("/", req.url), 307);
      res.headers.set("X-Robots-Tag", "noindex, nofollow");
      return res;
    }

    const url = new URL(req.url);
    const userAgent = req.headers.get("user-agent") || "";
    const isCrawler = isSocialCrawler(userAgent);
    const purpose = (
      req.headers.get("purpose") ||
      req.headers.get("sec-purpose") ||
      req.headers.get("x-purpose") ||
      req.headers.get("x-moz") ||
      ""
    ).toLowerCase();
    const isPrefetch = purpose.includes("prefetch");

    const isPreviewMode =
      url.searchParams.get("preview") === "1" ||
      url.searchParams.get("preview") === "true" ||
      url.searchParams.get("banner") === "1" ||
      url.searchParams.get("banner") === "true" ||
      url.searchParams.get("inspect") === "1" ||
      url.searchParams.get("debug") === "1";

    // ─── 1. SOCIAL CRAWLER & DEV BANNER PREVIEW PATH ───
    if (isCrawler || isPreviewMode) {
      const searchStr = url.search || "";
      const hasCacheBuster =
        url.searchParams.has("v") ||
        url.searchParams.has("_t") ||
        url.searchParams.has("nocache") ||
        url.searchParams.has("cb") ||
        isPreviewMode;

      if (!hasCacheBuster) {
        const cached = getCachedBotResponse(slug, searchStr);
        if (cached) {
          return new Response(cached.body, { status: 200, headers: cached.headers });
        }
      }

      const meta = await fetchWorkerLink(slug, true);

      const rawQDomain = (url.searchParams.get("domain") || url.searchParams.get("domain_name") || "").trim().toLowerCase();
      const qDomain = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/.test(rawQDomain)
        ? rawQDomain
        : undefined;
      const qTitle = url.searchParams.get("title") || url.searchParams.get("og_title");
      const qDesc = url.searchParams.get("desc") || url.searchParams.get("og_description");
      const qImage = url.searchParams.get("image") || url.searchParams.get("og_image");
      const qCard = url.searchParams.get("card") || url.searchParams.get("twitter_card");
      const qTarget = url.searchParams.get("target") || url.searchParams.get("target_url");

      const hostHeader = (req.headers.get("x-forwarded-host") || req.headers.get("host") || "").split(":")[0].trim().toLowerCase();
      const cleanHost = (!hostHeader.includes("localhost") && !hostHeader.includes("127.0.0.1") && !hostHeader.includes("workers.dev")) ? hostHeader : undefined;

      const detectedDomain = qDomain || meta?.domain || meta?.domain_name || meta?.domainName || cleanHost || "lsho.cc";

      const title = qTitle || meta?.og_title || meta?.ogTitle || meta?.meta_title || meta?.metaTitle || slug;
      const description = qDesc || meta?.og_description || meta?.ogDescription || "Cliquez pour accéder à ce lien sécurisé par LShorter.";
      
      const cardParam = qCard ? (qCard === "summary" ? "summary" : "summary_large_image") : undefined;
      const isCompactCard = cardParam
        ? cardParam === "summary"
        : Boolean(
            meta?.twitter_card === "summary" ||
            meta?.twitterCard === "summary" ||
            meta?.banner_style === "default_banner" ||
            meta?.bannerStyle === "default_banner" ||
            meta?.banner_style === "summary" ||
            meta?.bannerStyle === "summary"
          ) && !(
            meta?.twitter_card === "summary_large_image" ||
            meta?.twitterCard === "summary_large_image"
          );
      const resolvedCard = isCompactCard ? "summary" : "summary_large_image";

      let rawImage = qImage || meta?.og_image || meta?.ogImage || meta?.banner_url || meta?.bannerUrl || "";
      const isRelativeOrOwnBannerHost =
        !rawImage ||
        rawImage.startsWith("/") ||
        (() => {
          try {
            const h = new URL(rawImage).hostname.toLowerCase();
            return (
              h === detectedDomain.toLowerCase() ||
              h === "lsho.cc" ||
              h.endsWith(".lsho.cc") ||
              h.endsWith(".workers.dev") ||
              h === "localhost"
            );
          } catch {
            return false;
          }
        })();

      if (rawImage && rawImage.startsWith("data:")) {
        // Never emit a broken non-existent /banners/<slug>.jpg URL for unuploaded data URIs;
        // fall through to the dynamic OG image renderer with the link's title & description.
        rawImage = "";
      } else if (
        rawImage &&
        isRelativeOrOwnBannerHost &&
        (rawImage.includes("/api/v1/images/") ||
          rawImage.includes("/api/images/") ||
          rawImage.includes("/banners/"))
      ) {
        const [pathPart, queryPart] = rawImage.split("?");
        const filename = pathPart.split("/").pop();
        if (filename && filename !== "og.png" && filename !== "og") {
          rawImage = `https://${detectedDomain}/banners/${filename}${queryPart ? `?${queryPart}` : ""}`;
        }
      } else if (rawImage && !rawImage.startsWith("http://") && !rawImage.startsWith("https://")) {
        const cleaned = rawImage.replace(/^\/+/, "");
        if (cleaned.startsWith("banner_") || cleaned.startsWith("img_")) {
          rawImage = `https://${detectedDomain}/banners/${cleaned}`;
        } else {
          rawImage = `https://${detectedDomain}/${cleaned}`;
        }
      }

      const isCustomBanner = Boolean(
        rawImage &&
        !rawImage.includes("/api/og") &&
        !rawImage.includes("/banners/og") &&
        !rawImage.includes("default_banner") &&
        !rawImage.includes(".svg") &&
        !rawImage.includes("dicebear")
      );

      const imageOrigin = !cleanHost && isPreviewMode ? url.origin : `https://${detectedDomain}`;
      const encodedDesc = encodeURIComponent(description.substring(0, 160));
      let image = "";
      if (isCompactCard) {
        if (isCustomBanner) {
          image = rawImage;
        } else {
          image = `${imageOrigin}/banners/og.png?card=summary&title=${encodeURIComponent(title.substring(0, 70))}&desc=${encodedDesc}&slug=${encodeURIComponent(slug)}`;
        }
      } else {
        if (isCustomBanner) {
          image = rawImage;
        } else {
          image = `${imageOrigin}/banners/og.png?title=${encodeURIComponent(title.substring(0, 80))}&desc=${encodedDesc}&slug=${encodeURIComponent(slug)}`;
        }
      }

      // Append deterministic version stamp from link update timestamp so social image caches refresh after edits
      const updatedStampRaw =
        (meta as any)?.updated_at ||
        (meta as any)?.updatedAt ||
        (meta as any)?.created_at ||
        (meta as any)?.createdAt;
      if (updatedStampRaw && image && !image.includes("v=") && !image.includes("_t=")) {
        const parsedMs = Date.parse(String(updatedStampRaw));
        if (!Number.isNaN(parsedMs) && parsedMs > 0) {
          const vSec = Math.floor(parsedMs / 1000);
          image += `${image.includes("?") ? "&" : "?"}v=${vSec}`;
        }
      }

      const isRRoute = url.pathname.startsWith("/r/");
      const canonicalUrl = `https://${detectedDomain}${isRRoute ? "/r/" : "/"}${encodeURIComponent(slug)}${searchStr}`;

      // Do not leak the real destination URL in crawler HTML when the link is password-protected,
      // cloaked, PathLock-restricted, paused, or expired.
      const isRestrictedLink = Boolean(
        meta &&
        (meta.is_password_protected ||
          meta.isPasswordProtected ||
          meta.password ||
          meta.is_cloaked ||
          meta.isCloaked ||
          meta.is_active === 0 ||
          meta.isActive === false ||
          (meta.path_lock_mode && meta.path_lock_mode !== "off") ||
          (meta.pathLockMode && meta.pathLockMode !== "off") ||
          ((meta.expires_at || meta.expiresAt) &&
            new Date(String(meta.expires_at || meta.expiresAt)).getTime() <= Date.now())),
      );
      const targetUrl = isRestrictedLink
        ? canonicalUrl
        : qTarget || meta?.target_url || meta?.targetUrl || `https://${detectedDomain}`;

      const html = renderSocialHtml({
        title,
        description,
        image,
        twitterCard: resolvedCard,
        destinationUrl: targetUrl,
        canonicalUrl,
        slug,
        domain: detectedDomain,
        isPreview: isPreviewMode,
      });

      const headers = {
        "Content-Type": "text/html; charset=utf-8",
        "Vary": "User-Agent",
        "Cache-Control": hasCacheBuster || !meta
          ? "no-store, no-cache, must-revalidate, max-age=0"
          : "public, max-age=5, s-maxage=10, stale-while-revalidate=20",
      };

      if (!hasCacheBuster && meta) {
        setCachedBotResponse(slug, html, headers, 5000, searchStr);
      }

      return new Response(html, { status: 200, headers });
    }

    // ─── 2. REAL VISITOR / HUMAN PATH (INSTANT HTTP 307 REDIRECT) ───
    const geo = await detectVisitorGeoAsync(req).catch(() => ({
      countryCode: "XX",
      city: "",
      rawIp: "127.0.0.1",
    }));
    const visitor = parseVisitorDetails(req, geo);

    // Fetch link metadata
    const link = await fetchWorkerLink(slug);
    if (!link || (!link.target_url && !link.targetUrl)) {
      const notFoundRedirect = NextResponse.redirect(new URL(`/r/${slug}/not-found`, req.url), 307);
      notFoundRedirect.headers.set("X-Robots-Tag", "noindex, nofollow");
      return notFoundRedirect;
    }

    const currentClicks = Number(link.clicks_count || link.clicks || 0);

    // ─── 3. PROTECTION GUARD (Status, Expiration, Click limits, Password, PathLock) ───
    const protection = evaluateProtectionState(link, currentClicks, req.url);
    if (protection.type === "redirect") {
      const expTime = link.expires_at || link.expiresAt;
      if (expTime && new Date(expTime).getTime() <= Date.now() && link.is_active !== 0) {
        markLinkExpiredAsync(link.id || slug, link);
      }

      const isPathLocked = Boolean((link.path_lock_mode && link.path_lock_mode !== "off") || (link.pathLockMode && link.pathLockMode !== "off"));
      if ((link.is_cloaked || link.isCloaked || isPathLocked) && shouldTrackClick(visitor.ip, slug, isPrefetch)) {
        trackClickAsync(req, slug, link, geo);
      }

      const protRedirect = NextResponse.redirect(new URL(protection.url, req.url), protection.status as any);
      protRedirect.headers.set("X-Robots-Tag", "noindex, nofollow");
      return protRedirect;
    }

    // ─── 4. DYNAMIC ROUTING & A/B TESTING RESOLUTION ───
    const baseTarget = link.target_url || link.targetUrl || "/";
    const abTarget = resolveAbTargetUrl(link, baseTarget);
    const ruleTarget = evaluateRoutingRules(link, visitor);
    const resolvedTarget = ruleTarget || abTarget;
    const utmPreservedTarget = preserveUtmParams(resolvedTarget, baseTarget);

    const passParams = link.passParams !== false && link.pass_params !== false;
    const finalUrl = appendForwardedParams(utmPreservedTarget, req.url, passParams);

    // Track click telemetry in background
    if (shouldTrackClick(visitor.ip, slug, isPrefetch)) {
      trackClickAsync(req, slug, link, geo, finalUrl);
    }

    const shouldHideReferrer = Boolean(link.hide_referrer || link.hideReferrer);

    // Fire attached retargeting pixels via lightweight interstitial when present
    if (!isPrefetch) {
      const activePixels = await resolveLinkActivePixels(link);
      if (activePixels.length > 0) {
        const html = renderPixelInterstitialHtml(finalUrl, activePixels, {
          title: link.og_title || link.ogTitle || link.meta_title || link.slug,
        });
        return new Response(html, {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "X-Robots-Tag": "noindex, nofollow",
            "Referrer-Policy": shouldHideReferrer ? "no-referrer" : "strict-origin-when-cross-origin",
            "Content-Security-Policy": PIXEL_INTERSTITIAL_CSP,
          },
        });
      }
    }

    const redirectCode =
      link.redirect_type === "301" || link.redirectType === "301"
        ? 301
        : link.redirect_type === "302" || link.redirectType === "302"
          ? 302
          : 307;

    const response = NextResponse.redirect(new URL(finalUrl, req.url), redirectCode);
    response.headers.set("X-Robots-Tag", "noindex, nofollow");
    response.headers.set(
      "Referrer-Policy",
      shouldHideReferrer ? "no-referrer" : "strict-origin-when-cross-origin",
    );
    return response;
  } catch (error: any) {
    console.error("[Redirect Handler Error]:", error);
    const notFoundRes = NextResponse.redirect(new URL(`/r/not-found`, req.url), 307);
    notFoundRes.headers.set("X-Robots-Tag", "noindex, nofollow");
    return notFoundRes;
  }
}

export async function HEAD(
  req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  return GET(req, context);
}
