import { NextRequest, NextResponse } from "next/server";
import {
  isPathAllowedByPathLock,
  resolveSafePathLockFallbackUrl,
} from "@/lib/pathlock-routes";
import {
  buildPathLockBlockedHtml,
  buildPathLockHeadInjection,
  buildRestrictedFallbackHtml,
  createPathLockContextCookie,
  detectUpstreamRestriction,
  extractSetCookiesFromResponse,
  getAllowedHostsForConfig,
  getMergedUpstreamCookies,
  hashCookieFingerprint,
  isSameSiteOrAllowedHost,
  isSafeProxyTargetUrl,
  probeAllowedHostsForSlug,
  rememberAllowedHostsForSlug,
  resolvePathLockLinkConfig,
  rewriteCssForPathLock,
  rewriteHtmlForPathLock,
  rewriteSetCookiesForClient,
  safeUpstreamFetch,
  verifyPathLockContextFromCookieHeader,
} from "@/lib/pathlock-proxy";

export const dynamic = "force-dynamic";

interface PrefetchedHtmlEntry {
  html: string;
  status: number;
  clientSetCookies: string[];
  contextCookie: string | null;
  expiresAt: number;
}

const globalHtmlPrefetchStore = globalThis as unknown as {
  __lshorterHtmlPrefetchCache?: Map<string, PrefetchedHtmlEntry>;
  __lshorterHtmlPrefetchInFlight?: Map<string, Promise<PrefetchedHtmlEntry | null>>;
};

const htmlPrefetchCache =
  globalHtmlPrefetchStore.__lshorterHtmlPrefetchCache ??
  (globalHtmlPrefetchStore.__lshorterHtmlPrefetchCache = new Map<string, PrefetchedHtmlEntry>());

const htmlPrefetchInFlight =
  globalHtmlPrefetchStore.__lshorterHtmlPrefetchInFlight ??
  (globalHtmlPrefetchStore.__lshorterHtmlPrefetchInFlight = new Map<string, Promise<PrefetchedHtmlEntry | null>>());

const MAX_HTML_PREFETCH_ENTRIES = 120;
const HTML_PREFETCH_TTL_MS = 15_000;

function setPrefetchedHtml(key: string, entry: PrefetchedHtmlEntry): void {
  if (htmlPrefetchCache.size >= MAX_HTML_PREFETCH_ENTRIES) {
    const oldest = htmlPrefetchCache.keys().next().value;
    if (oldest !== undefined) htmlPrefetchCache.delete(oldest);
  }
  htmlPrefetchCache.set(key, entry);
}

function consumePrefetchedHtml(key: string): PrefetchedHtmlEntry | null {
  const entry = htmlPrefetchCache.get(key);
  if (!entry) return null;
  htmlPrefetchCache.delete(key);
  if (Date.now() > entry.expiresAt) return null;
  return entry;
}

function buildHtmlResponseFromEntry(entry: PrefetchedHtmlEntry): NextResponse {
  const htmlRes = new NextResponse(entry.html, {
    status: entry.status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy": "frame-ancestors 'self'",
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
  if (entry.contextCookie) {
    htmlRes.headers.append("Set-Cookie", entry.contextCookie);
  }
  for (const sc of entry.clientSetCookies) {
    htmlRes.headers.append("Set-Cookie", sc);
  }
  return htmlRes;
}

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
  const isPrefetchParam = req.nextUrl.searchParams.get("prefetch") === "1";
  const isEmbedParam = req.nextUrl.searchParams.get("embed") === "1";
  const isFallbackAttempt = req.nextUrl.searchParams.get("fb") === "1";

  const fallbackResolution = resolveSafePathLockFallbackUrl({
    targetUrl: baseTargetUrl,
    rawPrefix: config.pathLockPrefix || "",
    mode: config.pathLockMode || "strict",
    action: config.pathLockAction || "block",
    fallbackPath: config.pathLockFallbackPath || "",
    slug: config.slug,
  });
  const incomingCookieHeader = req.headers.get("cookie");
  const signedCtx = verifyPathLockContextFromCookieHeader(incomingCookieHeader, config.slug);
  if (signedCtx && signedCtx.hosts.length > 0) {
    rememberAllowedHostsForSlug(config.slug, signedCtx.hosts);
  }

  // Authorize nested same-site sub-iframes (e.g. shadcn /create live preview frame) ONLY when
  // embedded by an already-authorized proxied page (never from direct URL bar or top-level /view).
  let isLegitimateNestedEmbed = false;
  if (isEmbedParam && signedCtx) {
    const fetchDest = (req.headers.get("sec-fetch-dest") || "").toLowerCase();
    const incomingRef = req.headers.get("referer") || "";
    let refPath = "";
    try {
      const refU = new URL(incomingRef);
      if (refU.origin === req.nextUrl.origin) refPath = refU.pathname;
    } catch {}
    const isFromTopView =
      !refPath ||
      refPath.startsWith(`/r/${encodeURIComponent(config.slug)}/view`) ||
      refPath.startsWith(`/r/${config.slug}/view`);
    if (!isFromTopView && (!fetchDest || fetchDest === "iframe")) {
      const parentAllowed =
        isUnlockedParam ||
        refPath.startsWith(`/r/${encodeURIComponent(config.slug)}/proxy`) ||
        isPathAllowedByPathLock({
          mode: config.pathLockMode || "strict",
          attemptPathOrUrl: refPath,
          rawPrefix: config.pathLockPrefix || "",
          slug: config.slug,
          targetPaths: [parsedBase.pathname || "/"],
        });
      if (parentAllowed) {
        isLegitimateNestedEmbed = true;
      }
    }
  }

  let fetchTargetUrl = baseTargetUrl;
  let hasSubpageOverride = false;
  let subpageAllowedHosts: string[] | null = null;

  if (requestedUrlParam) {
    try {
      const candidate = new URL(requestedUrlParam, baseTargetUrl);
      let allowedHosts = await getAllowedHostsForConfig(slug, baseTargetUrl);
      let sameSite = isSameSiteOrAllowedHost(candidate.href, allowedHosts);

      if (!sameSite && isSafeProxyTargetUrl(candidate.href, baseTargetUrl)) {
        allowedHosts = await probeAllowedHostsForSlug(slug, baseTargetUrl);
        sameSite = isSameSiteOrAllowedHost(candidate.href, allowedHosts);
      }

      // Strictly require same-site origin even when unlocked; never act as an arbitrary open forward proxy
      if (isSafeProxyTargetUrl(candidate.href, baseTargetUrl) && sameSite) {
        if (!isUnlockedParam && !isLegitimateNestedEmbed) {
          const isAllowed = isPathAllowedByPathLock({
            mode: config.pathLockMode || "strict",
            attemptPathOrUrl: candidate.href,
            rawPrefix: config.pathLockPrefix || "",
            slug: config.slug,
            targetPaths: [parsedBase.pathname || "/"],
          });
          if (!isAllowed) {
            if (isPrefetchParam) {
              return new NextResponse(null, { status: 204 });
            }
            if (
              !isFallbackAttempt &&
              fallbackResolution.enabled &&
              fallbackResolution.fallbackUrl
            ) {
              return NextResponse.redirect(
                new URL(
                  `/r/${encodeURIComponent(config.slug)}/proxy?url=${encodeURIComponent(fallbackResolution.fallbackUrl)}&fb=1`,
                  req.nextUrl.origin,
                ),
                302,
              );
            }
            return new NextResponse(
              buildPathLockBlockedHtml(candidate.href, config.pathLockMessage),
              {
                status: 403,
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
        fetchTargetUrl = candidate.href;
        hasSubpageOverride = true;
        subpageAllowedHosts = allowedHosts;
      }
    } catch {}
  }

  const mergedCookie = getMergedUpstreamCookies(incomingCookieHeader);
  const cookieFp = hashCookieFingerprint(mergedCookie);
  const prefetchKey = `${config.slug.toLowerCase()}|${fetchTargetUrl}|${isUnlockedParam ? "1" : "0"}|${isLegitimateNestedEmbed ? "e1" : "e0"}|${fallbackResolution.enabled ? `fb:${fallbackResolution.fallbackPath || "/"}` : "blk"}|${cookieFp}`;

  // 1. Instant one-shot hit from hover/pointerdown prefetch cache (skip on explicit hard reload)
  const isManualReload =
    (req.headers.get("cache-control") || "").toLowerCase().includes("no-cache") ||
    (req.headers.get("pragma") || "").toLowerCase().includes("no-cache");

  if (!isPrefetchParam && !isManualReload) {
    const prefetched = consumePrefetchedHtml(prefetchKey);
    if (prefetched) {
      return buildHtmlResponseFromEntry(prefetched);
    }
    const inFlight = htmlPrefetchInFlight.get(prefetchKey);
    if (inFlight) {
      const awaited = await inFlight.catch(() => null);
      if (awaited) {
        htmlPrefetchCache.delete(prefetchKey);
        return buildHtmlResponseFromEntry(awaited);
      }
    }
  } else if (isPrefetchParam) {
    const existing = htmlPrefetchCache.get(prefetchKey);
    if (existing && Date.now() < existing.expiresAt) {
      return new NextResponse(null, { status: 204 });
    }
    const inFlight = htmlPrefetchInFlight.get(prefetchKey);
    if (inFlight) {
      await inFlight.catch(() => null);
      return new NextResponse(null, { status: 204 });
    }
  }

  const executeHtmlFetch = async (): Promise<
    | { kind: "html"; entry: PrefetchedHtmlEntry }
    | { kind: "raw"; response: NextResponse }
  > => {
    const forwardHeaders: Record<string, string> = {
      "User-Agent":
        req.headers.get("user-agent") ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language":
        req.headers.get("accept-language") ||
        "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: fetchTargetUrl,
    };

    if (mergedCookie) {
      forwardHeaders["Cookie"] = mergedCookie;
    }

    const fetchSignal =
      !isPrefetchParam && typeof AbortSignal.any === "function"
        ? AbortSignal.any([req.signal, AbortSignal.timeout(12000)])
        : AbortSignal.timeout(12000);

    const { response: upstreamRes, finalUrl, redirectCookies } = await safeUpstreamFetch(
      fetchTargetUrl,
      {
        headers: forwardHeaders,
        cache: "no-store",
        signal: fetchSignal,
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
      new Set([
        parsedBase.hostname.toLowerCase(),
        effectiveTarget.hostname.toLowerCase(),
        ...(subpageAllowedHosts || []),
      ]),
    );
    rememberAllowedHostsForSlug(config.slug, allowedHosts);

    // Post-redirect server-side PathLock enforcement on subpage navigations
    if (hasSubpageOverride && !isUnlockedParam && !isLegitimateNestedEmbed) {
      const postRedirectAllowed = isPathAllowedByPathLock({
        mode: config.pathLockMode || "strict",
        attemptPathOrUrl: effectiveTarget.href,
        rawPrefix: config.pathLockPrefix || "",
        slug: config.slug,
        targetPaths: [parsedBase.pathname || "/"],
      });
      if (!postRedirectAllowed) {
        try { await upstreamRes.body?.cancel(); } catch {}
        if (
          !isPrefetchParam &&
          !isFallbackAttempt &&
          fallbackResolution.enabled &&
          fallbackResolution.fallbackUrl
        ) {
          return {
            kind: "raw",
            response: NextResponse.redirect(
              new URL(
                `/r/${encodeURIComponent(config.slug)}/proxy?url=${encodeURIComponent(fallbackResolution.fallbackUrl)}&fb=1`,
                req.nextUrl.origin,
              ),
              302,
            ),
          };
        }
        return {
          kind: "raw",
          response: new NextResponse(
            buildPathLockBlockedHtml(effectiveTarget.href, config.pathLockMessage),
            {
              status: 403,
              headers: {
                "Content-Type": "text/html; charset=utf-8",
                "X-Frame-Options": "SAMEORIGIN",
                "Content-Security-Policy": "frame-ancestors 'self'",
                "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
              },
            },
          ),
        };
      }
    }

    const contextCookie = createPathLockContextCookie(
      {
        slug: config.slug,
        targetUrl: baseTargetUrl,
        hosts: allowedHosts,
      },
      req.nextUrl,
      req.headers.get("x-forwarded-proto"),
    );

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
      if (contextCookie) cssRes.headers.append("Set-Cookie", contextCookie);
      for (const sc of clientSetCookies) {
        cssRes.headers.append("Set-Cookie", sc);
      }
      return { kind: "raw", response: cssRes };
    }

    if (!contentType.toLowerCase().includes("text/html")) {
      const isNoBodyStatus = [204, 205, 304].includes(upstreamRes.status);
      const binRes = new NextResponse(isNoBodyStatus ? null : upstreamRes.body, {
        status: upstreamRes.status,
        headers: {
          "Content-Type": contentType || "application/octet-stream",
          "Access-Control-Allow-Origin": "*",
        },
      });
      if (contextCookie) binRes.headers.append("Set-Cookie", contextCookie);
      for (const sc of clientSetCookies) {
        binRes.headers.append("Set-Cookie", sc);
      }
      return { kind: "raw", response: binRes };
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
      if (contextCookie) fbRes.headers.append("Set-Cookie", contextCookie);
      for (const sc of clientSetCookies) {
        fbRes.headers.append("Set-Cookie", sc);
      }
      return { kind: "raw", response: fbRes };
    }

    const cleanedHtml = rewriteHtmlForPathLock(
      rawHtml,
      effectiveTarget.href,
      config.slug,
      allowedHosts,
    );

    const hasExistingImportMap = /<script\b[^>]*\btype=["']importmap["']/i.test(cleanedHtml);
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
      action: fallbackResolution.enabled ? "fallback" : "block",
      fallbackUrl: fallbackResolution.fallbackUrl,
      fallbackPath: fallbackResolution.fallbackPath,
      initialUnlocked: isUnlockedParam,
      hasExistingImportMap,
      isNestedEmbed: isLegitimateNestedEmbed,
    });

    // Use a replacer callback so `$'` / `$&` in target URLs or scripts never trigger String.replace substitutions
    const finalHtml = /<head[^>]*>/i.test(cleanedHtml)
      ? cleanedHtml.replace(
          /<head([^>]*)>/i,
          (_match, attrs) => `<head${attrs}>${injectedHeadContent}`,
        )
      : `${injectedHeadContent}${cleanedHtml}`;

    return {
      kind: "html",
      entry: {
        html: finalHtml,
        status: upstreamRes.status,
        clientSetCookies,
        contextCookie,
        expiresAt: Date.now() + HTML_PREFETCH_TTL_MS,
      },
    };
  };

  try {
    if (isPrefetchParam) {
      const prefetchPromise: Promise<PrefetchedHtmlEntry | null> = executeHtmlFetch()
        .then((res) => {
          if (res.kind === "html" && res.entry.status >= 200 && res.entry.status < 300) {
            setPrefetchedHtml(prefetchKey, res.entry);
            return res.entry;
          }
          return null;
        })
        .catch(() => null)
        .finally(() => {
          htmlPrefetchInFlight.delete(prefetchKey);
        });

      htmlPrefetchInFlight.set(prefetchKey, prefetchPromise);
      await prefetchPromise;
      return new NextResponse(null, { status: 204 });
    }

    const result = await executeHtmlFetch();
    if (result.kind === "raw") {
      return result.response;
    }
    return buildHtmlResponseFromEntry(result.entry);
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
