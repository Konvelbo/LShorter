import { NextRequest, NextResponse } from "next/server";
import { isPathAllowedByPathLock } from "@/lib/pathlock-routes";
import {
  buildPathLockHeadInjection,
  buildRestrictedFallbackHtml,
  detectUpstreamRestriction,
  extractSetCookiesFromResponse,
  getAllowedHostsForConfig,
  getMergedUpstreamCookies,
  isSameSiteOrAllowedHost,
  isSafeProxyTargetUrl,
  rememberAllowedHostsForSlug,
  resolvePathLockLinkConfig,
  rewriteCssForPathLock,
  rewriteHtmlForPathLock,
  rewriteSetCookiesForClient,
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
        if (!isUnlockedParam) {
          const isAllowed = isPathAllowedByPathLock({
            mode: config.pathLockMode || "strict",
            attemptPathOrUrl: candidate.href,
            rawPrefix: config.pathLockPrefix || "",
            slug: config.slug,
            targetPaths: [parsedBase.pathname || "/"],
          });
          if (!isAllowed) {
            return new NextResponse(
              buildRestrictedFallbackHtml(
                {
                  restricted: true,
                  status: 403,
                  provider: "PathLock™ Gate",
                  reason: "pathlock_blocked",
                  message:
                    config.pathLockMessage ||
                    "Cette route est restreinte par la protection PathLock™.",
                },
                baseTargetUrl,
              ),
              {
                status: 403,
                headers: {
                  "Content-Type": "text/html; charset=utf-8",
                  "X-Frame-Options": "SAMEORIGIN",
                },
              },
            );
          }
        }
        fetchTargetUrl = candidate.href;
        hasSubpageOverride = true;
        subpageAllowedHosts = allowedHosts;
      }
    } catch {}
  }

  try {
    const targetUrlParsed = new URL(fetchTargetUrl);
    const forwardHeaders: Record<string, string> = {
      "User-Agent":
        req.headers.get("user-agent") ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language":
        req.headers.get("accept-language") ||
        "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      Origin: targetUrlParsed.origin,
      Referer: fetchTargetUrl,
    };

    const mergedCookie = getMergedUpstreamCookies(req.headers.get("cookie"));
    if (mergedCookie) {
      forwardHeaders["Cookie"] = mergedCookie;
    }

    const { response: upstreamRes, finalUrl, redirectCookies } = await safeUpstreamFetch(
      fetchTargetUrl,
      {
        headers: forwardHeaders,
        cache: "no-store",
      },
      baseTargetUrl,
      hasSubpageOverride ? subpageAllowedHosts : null,
    );

    const allSetCookies = [
      ...redirectCookies,
      ...extractSetCookiesFromResponse(upstreamRes),
    ];
    const clientSetCookies = rewriteSetCookiesForClient(
      allSetCookies,
      config.slug,
      req.nextUrl,
      req.headers.get("x-forwarded-proto"),
    );

    const contentType = upstreamRes.headers.get("content-type") || "";
    const effectiveTarget = new URL(finalUrl || fetchTargetUrl);

    const allowedHosts = Array.from(
      new Set([parsedBase.hostname.toLowerCase(), effectiveTarget.hostname.toLowerCase()]),
    );
    rememberAllowedHostsForSlug(config.slug, allowedHosts);

    if (contentType.toLowerCase().includes("text/css")) {
      const cssText = await upstreamRes.text();
      const cssRes = new NextResponse(
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
      for (const sc of clientSetCookies) {
        cssRes.headers.append("Set-Cookie", sc);
      }
      return cssRes;
    }

    if (!contentType.toLowerCase().includes("text/html")) {
      const isNoBodyStatus = [204, 205, 304].includes(upstreamRes.status);
      const bodyBuffer = isNoBodyStatus ? null : await upstreamRes.arrayBuffer();
      const binRes = new NextResponse(bodyBuffer, {
        status: upstreamRes.status,
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
        },
      });
      for (const sc of clientSetCookies) {
        binRes.headers.append("Set-Cookie", sc);
      }
      return binRes;
    }

    const rawHtml = await upstreamRes.text();
    const restriction = detectUpstreamRestriction(
      upstreamRes.status,
      upstreamRes.headers,
      rawHtml,
    );
    if (restriction.restricted) {
      const fbRes = new NextResponse(
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
      for (const sc of clientSetCookies) {
        fbRes.headers.append("Set-Cookie", sc);
      }
      return fbRes;
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

    const htmlRes = new NextResponse(finalHtml, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "SAMEORIGIN",
        "Content-Security-Policy": "frame-ancestors 'self'",
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
      },
    });
    for (const sc of clientSetCookies) {
      htmlRes.headers.append("Set-Cookie", sc);
    }
    return htmlRes;
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
