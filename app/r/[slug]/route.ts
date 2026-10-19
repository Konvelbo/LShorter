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
  appendForwardedParams,
  shouldTrackClick,
  trackClickAsync,
  getDicebearGlassUrl,
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
      return NextResponse.redirect(new URL("/", req.url), 307);
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

      const meta = await fetchWorkerLink(slug);

      const qDomain = url.searchParams.get("domain") || url.searchParams.get("domain_name");
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
      const isLarge = cardParam
        ? cardParam === "summary_large_image"
        : Boolean(
            meta?.twitter_card === "summary_large_image" ||
            meta?.twitterCard === "summary_large_image" ||
            meta?.banner_style === "large_banner" ||
            meta?.bannerStyle === "large_banner"
          );
      const isCompactCard = cardParam
        ? cardParam === "summary"
        : Boolean(
            (meta?.twitter_card === "summary" ||
            meta?.twitterCard === "summary" ||
            meta?.banner_style === "default_banner" ||
            meta?.bannerStyle === "default_banner") && !isLarge
          );
      const resolvedCard = isCompactCard ? "summary" : "summary_large_image";

      const rawImage = qImage || meta?.og_image || meta?.ogImage || meta?.banner_url || meta?.bannerUrl || "";
      const isCustomBanner = Boolean(rawImage && !rawImage.includes("/api/og") && !rawImage.includes("default_banner") && !rawImage.includes(".svg") && !rawImage.includes("dicebear"));
      let image = isCustomBanner ? rawImage : "";
      if (image && !image.startsWith("http://") && !image.startsWith("https://")) {
        image = `https://${detectedDomain}${image.startsWith("/") ? "" : "/"}${image}`;
      }
      if (!image) {
        if (isCompactCard) {
          image = `https://${detectedDomain}/icon-512.png`;
        } else {
          image = `https://${detectedDomain}/api/og?title=${encodeURIComponent(title.substring(0, 80))}&slug=${encodeURIComponent(slug)}`;
        }
      }
      const targetUrl = qTarget || meta?.target_url || meta?.targetUrl || `https://${detectedDomain}`;
      const canonicalUrl = `https://${detectedDomain}/r/${encodeURIComponent(slug)}${searchStr}`;

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
        "Cache-Control": hasCacheBuster
          ? "no-store, no-cache, must-revalidate, max-age=0"
          : "public, max-age=10, s-maxage=30, stale-while-revalidate=60",
      };

      if (!hasCacheBuster) {
        setCachedBotResponse(slug, html, headers, 30000, searchStr);
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
      return NextResponse.redirect(new URL(`/r/${slug}/not-found`, req.url), 307);
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

      return NextResponse.redirect(new URL(protection.url, req.url), protection.status as any);
    }

    // ─── 4. DYNAMIC ROUTING & A/B TESTING RESOLUTION ───
    const baseTarget = link.target_url || link.targetUrl || "/";
    const abTarget = resolveAbTargetUrl(link, baseTarget);
    const ruleTarget = evaluateRoutingRules(link, visitor);
    const resolvedTarget = ruleTarget || abTarget;

    const passParams = link.passParams !== false && link.pass_params !== false;
    const finalUrl = appendForwardedParams(resolvedTarget, req.url, passParams);

    // Track click telemetry in background
    if (shouldTrackClick(visitor.ip, slug, isPrefetch)) {
      trackClickAsync(req, slug, link, geo);
    }

    const redirectCode =
      link.redirect_type === "301" || link.redirectType === "301"
        ? 301
        : link.redirect_type === "302" || link.redirectType === "302"
          ? 302
          : 307;

    return NextResponse.redirect(finalUrl, redirectCode);
  } catch (error: any) {
    console.error("[Redirect Handler Error]:", error);
    return NextResponse.redirect(new URL(`/r/not-found`, req.url), 307);
  }
}

export async function HEAD(
  req: Request,
  context: { params: Promise<{ slug: string }> },
) {
  return GET(req, context);
}
