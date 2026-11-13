import { NextRequest, NextResponse } from "next/server";
import {
  buildPathLockHeadInjection,
  buildRestrictedFallbackHtml,
  detectUpstreamRestriction,
  getAllowedHostsForConfig,
  isSameSiteOrAllowedHost,
  isSafeProxyTargetUrl,
  rememberAllowedHostsForSlug,
  resolvePathLockLinkConfig,
  rewriteCssForPathLock,
  rewriteHtmlForPathLock,
  safeUpstreamFetch,
} from "@/lib/pathlock-proxy";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const config = await resolvePathLockLinkConfig(slug);

  if (!config || !config.targetUrl) {
    return new NextResponse("Link not found", { status: 404 });
  }

  const baseTargetUrl = config.targetUrl;

  let parsedBase: URL;
  try {
    parsedBase = new URL(baseTargetUrl);
  } catch {
    return new NextResponse("Invalid target URL", { status: 400 });
  }

  if (!isSafeProxyTargetUrl(parsedBase.href, baseTargetUrl)) {
    return new NextResponse("Unsafe target URL", { status: 403 });
  }

  const requestedUrlParam = req.nextUrl.searchParams.get("url");
  const isUnlockedParam = req.nextUrl.searchParams.get("unlocked") === "1";
  let fetchTargetUrl = baseTargetUrl;
  let hasSubpageOverride = false;
  let subpageAllowedHosts: string[] | null = null;

  if (requestedUrlParam) {
    try {
      const candidate = new URL(requestedUrlParam, baseTargetUrl);
      const allowedHosts = await getAllowedHostsForConfig(slug, baseTargetUrl);
      const sameSite = isSameSiteOrAllowedHost(candidate.href, allowedHosts);
      // Strictly require same-site origin even when unlocked; never act as an arbitrary open forward proxy
      if (isSafeProxyTargetUrl(candidate.href, baseTargetUrl) && sameSite) {
        fetchTargetUrl = candidate.href;
        hasSubpageOverride = true;
        subpageAllowedHosts = allowedHosts;
      }
    } catch {}
  }

  try {
    const { response: upstreamRes, finalUrl } = await safeUpstreamFetch(
      fetchTargetUrl,
      {
        headers: {
          "User-Agent":
            req.headers.get("user-agent") ||
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language":
            req.headers.get("accept-language") ||
            "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        cache: "no-store",
      },
      baseTargetUrl,
      hasSubpageOverride ? subpageAllowedHosts : null,
    );

    const contentType = upstreamRes.headers.get("content-type") || "";
    const effectiveTarget = new URL(finalUrl || fetchTargetUrl);

    const allowedHosts = Array.from(
      new Set([parsedBase.hostname.toLowerCase(), effectiveTarget.hostname.toLowerCase()]),
    );
    rememberAllowedHostsForSlug(config.slug, allowedHosts);

    if (contentType.toLowerCase().includes("text/css")) {
      const cssText = await upstreamRes.text();
      return new NextResponse(
        rewriteCssForPathLock(cssText, effectiveTarget.href, config.slug, allowedHosts),
        {
          status: upstreamRes.status,
          headers: {
            "Content-Type": contentType,
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "private, max-age=300",
          },
        },
      );
    }

    if (!contentType.toLowerCase().includes("text/html")) {
      const bodyBuffer = await upstreamRes.arrayBuffer();
      return new NextResponse(bodyBuffer, {
        status: upstreamRes.status,
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const rawHtml = await upstreamRes.text();
    const restriction = detectUpstreamRestriction(
      upstreamRes.status,
      upstreamRes.headers,
      rawHtml,
    );
    if (restriction.restricted) {
      return new NextResponse(
        buildRestrictedFallbackHtml(restriction, effectiveTarget.href),
        {
          status: 200,
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Frame-Options": "SAMEORIGIN",
            "Content-Security-Policy": "frame-ancestors 'self'",
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          },
        },
      );
    }

    const cleanedHtml = rewriteHtmlForPathLock(
      rawHtml,
      effectiveTarget.href,
      config.slug,
      allowedHosts,
    );

    const injectedHeadContent = buildPathLockHeadInjection({
      slug: config.slug,
      targetUrl: baseTargetUrl,
      effectiveUrl: effectiveTarget.href,
      parsedBaseOrigin: parsedBase.origin,
      parsedBasePathname: parsedBase.pathname || "/",
      effectiveOrigin: effectiveTarget.origin,
      effectivePathname: effectiveTarget.pathname || "/",
      mode: config.pathLockMode || "strict",
      prefix: config.pathLockPrefix || "",
      initialUnlocked: isUnlockedParam,
    });

    // Use a replacer callback so `$'` / `$&` in target URLs or scripts never trigger String.replace substitutions
    const finalHtml = /<head[^>]*>/i.test(cleanedHtml)
      ? cleanedHtml.replace(
          /<head([^>]*)>/i,
          (_match, attrs) => `<head${attrs}>${injectedHeadContent}`,
        )
      : `${injectedHeadContent}${cleanedHtml}`;

    return new NextResponse(finalHtml, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self'",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
  } catch (err) {
    console.error("[PathLock Proxy Error]:", err);
    return new NextResponse(
      buildRestrictedFallbackHtml(
        {
          restricted: true,
          status: 502,
          provider: "Passerelle Réseau",
          reason: "network_error",
          message:
            "Impossible de charger la page distante via le proxy PathLock pour le moment.",
        },
        baseTargetUrl,
      ),
      {
        status: 200,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Frame-Options": "SAMEORIGIN",
          "Content-Security-Policy": "frame-ancestors 'self'",
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      },
    );
  }
}
