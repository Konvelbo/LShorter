import { NextResponse } from "next/server";
import {
  extractSetCookiesFromResponse,
  getAllowedHostsForConfig,
  getMergedUpstreamCookies,
  isSameSiteOrAllowedHost,
  isSafeProxyTargetUrl,
  parseProxyAssetFromPathname,
  probeAllowedHostsForSlug,
  rememberAllowedHostsForSlug,
  resolvePathLockLinkConfig,
  rewriteCssForPathLock,
  rewriteSetCookiesForClient,
  safeUpstreamFetch,
  verifyPathLockContextFromCookieHeader,
} from "@/lib/pathlock-proxy";

export const dynamic = "force-dynamic";

interface CachedStaticAsset {
  body: ArrayBuffer | string;
  byteLength: number;
  contentType: string;
  status: number;
  headers: Record<string, string>;
  expiresAt: number;
}

const MAX_STATIC_CACHE_ENTRIES = 600;
const MAX_SINGLE_CACHED_BYTES = 2 * 1024 * 1024; // 2 MB per asset
const MAX_TOTAL_CACHED_BYTES = 60 * 1024 * 1024; // 60 MB total cap
const STATIC_CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes

const globalAssetStore = globalThis as unknown as {
  __lshorterStaticAssetCache?: Map<string, CachedStaticAsset>;
  __lshorterStaticAssetBytes?: number;
  __lshorterInFlightStaticAssets?: Map<string, Promise<CachedStaticAsset | null>>;
};

const staticAssetCache =
  globalAssetStore.__lshorterStaticAssetCache ??
  (globalAssetStore.__lshorterStaticAssetCache = new Map<string, CachedStaticAsset>());

const inFlightStaticAssets =
  globalAssetStore.__lshorterInFlightStaticAssets ??
  (globalAssetStore.__lshorterInFlightStaticAssets = new Map<string, Promise<CachedStaticAsset | null>>());

function getTotalCachedBytes(): number {
  return globalAssetStore.__lshorterStaticAssetBytes ?? 0;
}

function setTotalCachedBytes(n: number): void {
  globalAssetStore.__lshorterStaticAssetBytes = Math.max(0, n);
}

function getCachedAsset(key: string): CachedStaticAsset | null {
  const item = staticAssetCache.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    staticAssetCache.delete(key);
    setTotalCachedBytes(getTotalCachedBytes() - item.byteLength);
    return null;
  }
  return item;
}

function setCachedAsset(key: string, asset: CachedStaticAsset): void {
  if (asset.byteLength > MAX_SINGLE_CACHED_BYTES) return;
  const existing = staticAssetCache.get(key);
  if (existing) {
    staticAssetCache.delete(key);
    setTotalCachedBytes(getTotalCachedBytes() - existing.byteLength);
  }
  while (
    staticAssetCache.size >= MAX_STATIC_CACHE_ENTRIES ||
    (getTotalCachedBytes() + asset.byteLength > MAX_TOTAL_CACHED_BYTES && staticAssetCache.size > 0)
  ) {
    const oldestKey = staticAssetCache.keys().next().value;
    if (oldestKey === undefined) break;
    const oldVal = staticAssetCache.get(oldestKey);
    staticAssetCache.delete(oldestKey);
    if (oldVal) setTotalCachedBytes(getTotalCachedBytes() - oldVal.byteLength);
  }
  staticAssetCache.set(key, asset);
  setTotalCachedBytes(getTotalCachedBytes() + asset.byteLength);
}

const FORWARDED_REQUEST_HEADERS = new Set([
  "content-type",
  "range",
  "if-none-match",
  "if-modified-since",
  "rsc",
  "purpose",
  "sec-purpose",
  "x-deployment-id",
  "x-requested-with",
  "authorization",
  "x-csrf-token",
  "x-xsrf-token",
  "x-api-key",
]);

const FORWARDED_REQUEST_HEADER_PREFIXES = [
  "next-",
  "x-nextjs-",
  "x-inertia",
  "hx-",
  "turbo-",
  "x-remix-",
  "x-sveltekit-",
  "x-nuxt-",
];

const FORWARDED_RESPONSE_HEADERS = new Set([
  "vary",
  "etag",
  "last-modified",
  "date",
  "age",
  "content-disposition",
  "accept-ranges",
  "content-range",
  "x-matched-path",
  "x-deployment-id",
  "x-vercel-cache",
]);

const FORWARDED_RESPONSE_HEADER_PREFIXES = [
  "x-nextjs-",
  "x-action-",
  "x-inertia",
  "hx-",
  "turbo-",
  "x-remix-",
  "x-sveltekit-",
  "x-nuxt-",
];

function shouldForwardRequestHeader(lowerName: string): boolean {
  if (FORWARDED_REQUEST_HEADERS.has(lowerName)) return true;
  return FORWARDED_REQUEST_HEADER_PREFIXES.some((p) => lowerName.startsWith(p));
}

function shouldForwardResponseHeader(lowerName: string): boolean {
  if (FORWARDED_RESPONSE_HEADERS.has(lowerName)) return true;
  return FORWARDED_RESPONSE_HEADER_PREFIXES.some((p) => lowerName.startsWith(p));
}

const BASE_EXPOSED_CORS_HEADERS = [
  "X-PathLock-Final-Url",
  "X-PathLock-Redirected",
  "Vary",
  "Date",
  "Age",
  "X-Nextjs-Redirect",
  "X-Action-Redirect",
  "X-Action-Revalidated",
  "X-Nextjs-Rewrite",
  "X-Nextjs-Prerender",
  "X-Nextjs-Postponed",
  "X-Nextjs-Deployment-Id",
  "X-Nextjs-Stale-Time",
  "X-Nextjs-Date",
  "X-Nextjs-Cache",
  "X-Matched-Path",
  "X-Vercel-Cache",
  "X-Inertia",
  "X-Inertia-Location",
  "Content-Disposition",
];

const EXPOSED_CORS_HEADERS = BASE_EXPOSED_CORS_HEADERS.join(", ");

function isStaticAssetPathname(pathname: string): boolean {
  if (/^\/(api|ajax|auth|graphql)\b/i.test(pathname)) return false;
  if (
    pathname.startsWith("/_next/static/") ||
    pathname === "/_next/image" ||
    pathname.startsWith("/cdn-cgi/image/")
  ) {
    return true;
  }
  return /\.(js|mjs|cjs|css|woff2?|ttf|eot|otf|png|jpe?g|gif|webp|avif|ico|svg|wasm|map)$/i.test(
    pathname,
  );
}

function isPublicBuildAssetPathname(pathname: string): boolean {
  if (/^\/(api|ajax|auth|graphql)\b/i.test(pathname)) return false;
  if (pathname.startsWith("/_next/static/")) return true;
  return /\.(js|mjs|cjs|css|woff2?|ttf|eot|otf|wasm)$/i.test(pathname);
}

function buildStaticCachedResponse(cached: CachedStaticAsset, finalUrl: string): NextResponse {
  return new NextResponse(cached.body, {
    status: cached.status,
    headers: {
      "Content-Type": cached.contentType,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": EXPOSED_CORS_HEADERS,
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800, immutable",
      "CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "Vercel-CDN-Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800",
      "X-PathLock-Final-Url": finalUrl,
      ...cached.headers,
    },
  });
}

async function handleAssetProxy(
  req: Request,
  context: { params: Promise<{ slug: string; assetPath: string[] }> },
) {
  const { slug, assetPath } = await context.params;
  const reqUrl = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "*",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const parsedTarget = parseProxyAssetFromPathname(
    reqUrl.pathname,
    reqUrl.search,
    assetPath,
  );
  if (!parsedTarget) {
    return NextResponse.json({ error: "Invalid proxy asset path" }, { status: 400 });
  }

  const targetUrlParsed = new URL(parsedTarget.url);
  const hasFrameworkDynamicHeaders = Boolean(
    req.headers.get("rsc") ||
      req.headers.get("next-router-state-tree") ||
      req.headers.get("next-router-prefetch") ||
      req.headers.get("next-router-segment-prefetch") ||
      req.headers.get("next-action") ||
      req.headers.get("x-nextjs-data") ||
      req.headers.get("x-requested-with") ||
      req.headers.get("x-inertia") ||
      req.headers.get("hx-request"),
  );

  const isStaticFileCandidate =
    req.method === "GET" &&
    !hasFrameworkDynamicHeaders &&
    isStaticAssetPathname(targetUrlParsed.pathname);

  const isPublicBuildAsset =
    isStaticFileCandidate && isPublicBuildAssetPathname(targetUrlParsed.pathname);

  const assetCacheKey = `${slug.toLowerCase()}:${parsedTarget.url}`;
  if (isStaticFileCandidate && !reqUrl.searchParams.has("force")) {
    const cached = getCachedAsset(assetCacheKey);
    if (cached) {
      return buildStaticCachedResponse(cached, parsedTarget.url);
    }
    const existingInFlight = inFlightStaticAssets.get(assetCacheKey);
    if (existingInFlight) {
      const awaited = await existingInFlight.catch(() => null);
      if (awaited) {
        return buildStaticCachedResponse(awaited, parsedTarget.url);
      }
    }
  }

  // Fast path: verify short-lived HMAC-signed PathLock context cookie in <0.1ms (ZERO Worker round-trip!)
  const incomingCookieHeader = req.headers.get("cookie");
  const signedCtx = verifyPathLockContextFromCookieHeader(incomingCookieHeader, slug);
  let targetConfigUrl = "";
  let configHost = "";
  let allowedHosts: string[] = [];

  if (
    signedCtx &&
    isSafeProxyTargetUrl(parsedTarget.url, signedCtx.targetUrl) &&
    isSameSiteOrAllowedHost(parsedTarget.url, signedCtx.hosts)
  ) {
    targetConfigUrl = signedCtx.targetUrl;
    allowedHosts = signedCtx.hosts;
    try {
      configHost = new URL(targetConfigUrl).hostname;
    } catch {
      configHost = signedCtx.hosts[0] || "";
    }
    rememberAllowedHostsForSlug(slug, allowedHosts);
  } else {
    const config = await resolvePathLockLinkConfig(slug);
    if (!config) {
      return NextResponse.json({ error: "Link not found" }, { status: 404 });
    }
    targetConfigUrl = config.targetUrl;
    try {
      configHost = new URL(config.targetUrl).hostname;
    } catch {
      return NextResponse.json({ error: "Invalid link configuration" }, { status: 400 });
    }

    allowedHosts = await getAllowedHostsForConfig(slug, config.targetUrl);
    if (
      !isSafeProxyTargetUrl(parsedTarget.url, config.targetUrl) ||
      !isSameSiteOrAllowedHost(parsedTarget.url, allowedHosts)
    ) {
      allowedHosts = await probeAllowedHostsForSlug(slug, config.targetUrl);
    }

    if (
      !isSafeProxyTargetUrl(parsedTarget.url, config.targetUrl) ||
      !isSameSiteOrAllowedHost(parsedTarget.url, allowedHosts)
    ) {
      return NextResponse.json({ error: "Forbidden asset host" }, { status: 403 });
    }
  }

  // Prevent bypassing PathLock HTML isolation by hitting __p directly as a document
  const fetchDest = (req.headers.get("sec-fetch-dest") || "").toLowerCase();
  if (req.method === "GET" && (fetchDest === "document" || fetchDest === "iframe")) {
    return NextResponse.redirect(
      new URL(
        `/r/${encodeURIComponent(slug)}/proxy?url=${encodeURIComponent(parsedTarget.url)}`,
        reqUrl.origin,
      ),
      307,
    );
  }

  try {
    let forwardedReferer = parsedTarget.url;
    const incomingReferer = req.headers.get("referer");
    if (incomingReferer) {
      try {
        const refU = new URL(incomingReferer);
        if (refU.origin === reqUrl.origin) {
          if (
            refU.pathname.startsWith(`/r/${encodeURIComponent(slug)}/proxy`) ||
            refU.pathname.startsWith(`/r/${slug}/proxy`)
          ) {
            const qUrl = refU.searchParams.get("url");
            forwardedReferer =
              qUrl && isSameSiteOrAllowedHost(qUrl, allowedHosts) ? qUrl : targetConfigUrl;
          } else {
            forwardedReferer = `${targetUrlParsed.origin}${refU.pathname}${refU.search}`;
          }
        }
      } catch {}
    }

    const forwardHeaders: Record<string, string> = {
      "User-Agent":
        req.headers.get("user-agent") ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: req.headers.get("accept") || "*/*",
      "Accept-Language":
        req.headers.get("accept-language") || "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      Referer: forwardedReferer,
    };

    // Only attach Origin when incoming request carried Origin or uses mutating methods
    if (req.headers.get("origin") || (req.method !== "GET" && req.method !== "HEAD")) {
      forwardHeaders["Origin"] = targetUrlParsed.origin;
    }

    req.headers.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (val && shouldForwardRequestHeader(lowerKey)) {
        forwardHeaders[key] = val;
      }
    });

    // Do not send cookies on public immutable static CDN assets so upstream edge caches HIT
    if (!isPublicBuildAsset) {
      const mergedCookie = getMergedUpstreamCookies(incomingCookieHeader);
      if (mergedCookie) {
        forwardHeaders["Cookie"] = mergedCookie;
      }
    }

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const bodyBuffer = hasBody ? await req.arrayBuffer() : undefined;

    const fetchSignal =
      !isStaticFileCandidate && typeof AbortSignal.any === "function"
        ? AbortSignal.any([req.signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000);

    let resolveInFlight: ((val: CachedStaticAsset | null) => void) | null = null;
    if (isStaticFileCandidate && !inFlightStaticAssets.has(assetCacheKey)) {
      const sharedPromise = new Promise<CachedStaticAsset | null>((resolve) => {
        resolveInFlight = resolve;
      });
      inFlightStaticAssets.set(assetCacheKey, sharedPromise);
    }

    const finalizeInFlight = (val: CachedStaticAsset | null) => {
      if (resolveInFlight) {
        resolveInFlight(val);
        resolveInFlight = null;
        inFlightStaticAssets.delete(assetCacheKey);
      }
    };

    let upstreamRes: Response;
    let finalUrl: string;
    let redirectCookies: string[];
    try {
      const fetched = await safeUpstreamFetch(
        parsedTarget.url,
        {
          method: req.method,
          headers: forwardHeaders,
          body: bodyBuffer,
          signal: fetchSignal,
        },
        targetConfigUrl,
        allowedHosts,
      );
      upstreamRes = fetched.response;
      finalUrl = fetched.finalUrl;
      redirectCookies = fetched.redirectCookies;
    } catch (fetchErr) {
      finalizeInFlight(null);
      throw fetchErr;
    }

    const allSetCookies = isPublicBuildAsset
      ? []
      : [...redirectCookies, ...extractSetCookiesFromResponse(upstreamRes)];
    const clientSetCookies =
      allSetCookies.length > 0
        ? rewriteSetCookiesForClient(
            allSetCookies,
            slug,
            reqUrl,
            req.headers.get("x-forwarded-proto"),
          )
        : [];

    const finalAllowedHosts = Array.from(
      new Set([configHost, ...allowedHosts, new URL(finalUrl).hostname]),
    );
    const contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";
    const lowerCt = contentType.toLowerCase();

    const isDynamicAjax =
      req.method !== "GET" ||
      hasFrameworkDynamicHeaders ||
      parsedTarget.url.includes("/ajax/") ||
      parsedTarget.url.includes("/api/") ||
      clientSetCookies.length > 0 ||
      lowerCt.includes("application/json") ||
      lowerCt.includes("text/x-component") ||
      lowerCt.includes("text/event-stream") ||
      (upstreamRes.headers.get("cache-control") || "").toLowerCase().includes("no-store");

    const isStaticAsset = isStaticFileCandidate && !isDynamicAjax;

    const responseHeaders: Record<string, string> = {
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Expose-Headers": EXPOSED_CORS_HEADERS,
      "X-PathLock-Final-Url": finalUrl,
    };

    if (finalUrl !== parsedTarget.url) {
      responseHeaders["X-PathLock-Redirected"] = "1";
    }

    const exposedHeaderNames = new Set(BASE_EXPOSED_CORS_HEADERS);
    upstreamRes.headers.forEach((val, key) => {
      const lowerKey = key.toLowerCase();
      if (val && shouldForwardResponseHeader(lowerKey)) {
        responseHeaders[key] = val;
        exposedHeaderNames.add(key);
      }
    });
    responseHeaders["Access-Control-Expose-Headers"] = Array.from(exposedHeaderNames).join(", ");

    if (upstreamRes.status >= 400 || isDynamicAjax) {
      responseHeaders["Cache-Control"] = "no-store, no-cache, must-revalidate";
    } else if (isStaticAsset) {
      responseHeaders["Cache-Control"] =
        "public, max-age=86400, stale-while-revalidate=604800, immutable";
      responseHeaders["CDN-Cache-Control"] =
        "public, s-maxage=86400, stale-while-revalidate=604800";
      responseHeaders["Vercel-CDN-Cache-Control"] =
        "public, s-maxage=86400, stale-while-revalidate=604800";
    } else {
      responseHeaders["Cache-Control"] = "private, max-age=300";
    }

    if (lowerCt.includes("text/css")) {
      const cssText = await upstreamRes.text();
      const rewrittenCss = rewriteCssForPathLock(
        cssText,
        finalUrl,
        slug,
        finalAllowedHosts,
      );

      let cachedEntry: CachedStaticAsset | null = null;
      if (isStaticAsset && upstreamRes.status === 200) {
        const byteLength = Buffer.byteLength(rewrittenCss, "utf8");
        cachedEntry = {
          body: rewrittenCss,
          byteLength,
          contentType,
          status: upstreamRes.status,
          headers: responseHeaders.etag ? { etag: responseHeaders.etag } : {},
          expiresAt: Date.now() + STATIC_CACHE_TTL_MS,
        };
        setCachedAsset(assetCacheKey, cachedEntry);
      }
      finalizeInFlight(cachedEntry);

      const cssRes = new NextResponse(rewrittenCss, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });
      for (const sc of clientSetCookies) {
        cssRes.headers.append("Set-Cookie", sc);
      }
      return cssRes;
    }

    if (req.method === "HEAD") {
      finalizeInFlight(null);
      const headRes = new NextResponse(null, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });
      for (const sc of clientSetCookies) {
        headRes.headers.append("Set-Cookie", sc);
      }
      return headRes;
    }

    const isNoBodyStatus = [204, 205, 304].includes(upstreamRes.status);
    const contentLengthHeader = Number(upstreamRes.headers.get("content-length") || "0");
    const shouldCacheStaticBody =
      isStaticAsset &&
      upstreamRes.status === 200 &&
      !isNoBodyStatus &&
      clientSetCookies.length === 0 &&
      (contentLengthHeader === 0 || contentLengthHeader <= MAX_SINGLE_CACHED_BYTES);

    if (shouldCacheStaticBody) {
      const resBuffer = await upstreamRes.arrayBuffer();
      let cachedEntry: CachedStaticAsset | null = null;
      if (resBuffer.byteLength <= MAX_SINGLE_CACHED_BYTES) {
        cachedEntry = {
          body: resBuffer,
          byteLength: resBuffer.byteLength,
          contentType,
          status: upstreamRes.status,
          headers: responseHeaders.etag ? { etag: responseHeaders.etag } : {},
          expiresAt: Date.now() + STATIC_CACHE_TTL_MS,
        };
        setCachedAsset(assetCacheKey, cachedEntry);
      }
      finalizeInFlight(cachedEntry);

      return new NextResponse(resBuffer, {
        status: upstreamRes.status,
        headers: responseHeaders,
      });
    }

    // Stream all dynamic routes (Next.js RSC flight streams, SSE, API JSON, media) directly without buffering!
    finalizeInFlight(null);
    const streamRes = new NextResponse(isNoBodyStatus ? null : upstreamRes.body, {
      status: upstreamRes.status,
      headers: responseHeaders,
    });
    for (const sc of clientSetCookies) {
      streamRes.headers.append("Set-Cookie", sc);
    }
    return streamRes;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "SSRF_BLOCKED" || msg === "HOST_FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden redirect destination" }, { status: 403 });
    }
    if (err instanceof Error && err.name === "AbortError") {
      return new NextResponse(null, { status: 499 });
    }
    console.error("[PathLock Asset Proxy Error]:", err);
    return NextResponse.json({ error: "Upstream asset fetch failed" }, { status: 502 });
  }
}

export async function GET(
  req: Request,
  context: { params: Promise<{ slug: string; assetPath: string[] }> },
) {
  return handleAssetProxy(req, context);
}

export async function HEAD(
  req: Request,
  context: { params: Promise<{ slug: string; assetPath: string[] }> },
) {
  return handleAssetProxy(req, context);
}

export async function POST(
  req: Request,
  context: { params: Promise<{ slug: string; assetPath: string[] }> },
) {
  return handleAssetProxy(req, context);
}

export async function PUT(
  req: Request,
  context: { params: Promise<{ slug: string; assetPath: string[] }> },
) {
  return handleAssetProxy(req, context);
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ slug: string; assetPath: string[] }> },
) {
  return handleAssetProxy(req, context);
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ slug: string; assetPath: string[] }> },
) {
  return handleAssetProxy(req, context);
}

export async function OPTIONS(
  req: Request,
  context: { params: Promise<{ slug: string; assetPath: string[] }> },
) {
  return handleAssetProxy(req, context);
}
