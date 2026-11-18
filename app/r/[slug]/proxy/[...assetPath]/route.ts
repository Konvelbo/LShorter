import { NextResponse } from "next/server";
import {
  extractSetCookiesFromResponse,
  getAllowedHostsForConfig,
  getMergedUpstreamCookies,
  isSameSiteOrAllowedHost,
  isSafeProxyTargetUrl,
  parseProxyAssetSegments,
  rememberAllowedHostsForSlug,
  resolvePathLockLinkConfig,
  rewriteCssForPathLock,
  rewriteSetCookiesForClient,
  safeUpstreamFetch,
} from "@/lib/pathlock-proxy";

export const dynamic = "force-dynamic";

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
        "Access-Control-Allow-Methods": "GET, HEAD, POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  const parsedTarget = parseProxyAssetSegments(assetPath, reqUrl.search);
  if (!parsedTarget) {
    return NextResponse.json({ error: "Invalid proxy asset path" }, { status: 400 });
  }

  const config = await resolvePathLockLinkConfig(slug);
  if (!config) {
    return NextResponse.json({ error: "Link not found" }, { status: 404 });
  }

  let configHost = "";
  try {
    configHost = new URL(config.targetUrl).hostname;
  } catch {
    return NextResponse.json({ error: "Invalid link configuration" }, { status: 400 });
  }

  let allowedHosts = await getAllowedHostsForConfig(slug, config.targetUrl);
  if (
    !isSafeProxyTargetUrl(parsedTarget.url, config.targetUrl) ||
    !isSameSiteOrAllowedHost(parsedTarget.url, allowedHosts)
  ) {
    // Follow initial configured target redirects with SSRF validation per hop in cold worker isolates
    try {
      const probe = await safeUpstreamFetch(
        config.targetUrl,
        { method: "HEAD" },
        config.targetUrl,
        null,
      ).catch(() => null);
      if (probe?.finalUrl) {
        const effHost = new URL(probe.finalUrl).hostname;
        rememberAllowedHostsForSlug(slug, [effHost]);
        allowedHosts = await getAllowedHostsForConfig(slug, config.targetUrl);
      }
    } catch {}
  }

  if (
    !isSafeProxyTargetUrl(parsedTarget.url, config.targetUrl) ||
    !isSameSiteOrAllowedHost(parsedTarget.url, allowedHosts)
  ) {
    return NextResponse.json({ error: "Forbidden asset host" }, { status: 403 });
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
    const targetUrlParsed = new URL(parsedTarget.url);
    const forwardHeaders: Record<string, string> = {
      "User-Agent":
        req.headers.get("user-agent") ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: req.headers.get("accept") || "*/*",
      "Accept-Language": req.headers.get("accept-language") || "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
      Origin: targetUrlParsed.origin,
      Referer: parsedTarget.url,
    };

    const contentTypeIn = req.headers.get("content-type");
    if (contentTypeIn) forwardHeaders["Content-Type"] = contentTypeIn;
    const rscHeader = req.headers.get("rsc");
    if (rscHeader) forwardHeaders["RSC"] = rscHeader;
    const nextRouterStateTree = req.headers.get("next-router-state-tree");
    if (nextRouterStateTree) forwardHeaders["Next-Router-State-Tree"] = nextRouterStateTree;
    const xRequestedWith = req.headers.get("x-requested-with");
    if (xRequestedWith) forwardHeaders["X-Requested-With"] = xRequestedWith;
    const authHeader = req.headers.get("authorization");
    if (authHeader) forwardHeaders["Authorization"] = authHeader;
    const csrfToken = req.headers.get("x-csrf-token");
    if (csrfToken) forwardHeaders["X-CSRF-Token"] = csrfToken;
    const xsrfToken = req.headers.get("x-xsrf-token");
    if (xsrfToken) forwardHeaders["X-XSRF-Token"] = xsrfToken;

    const mergedCookie = getMergedUpstreamCookies(req.headers.get("cookie"));
    if (mergedCookie) {
      forwardHeaders["Cookie"] = mergedCookie;
    }

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const bodyBuffer = hasBody ? await req.arrayBuffer() : undefined;

    const { response: upstreamRes, finalUrl, redirectCookies } = await safeUpstreamFetch(
      parsedTarget.url,
      {
        method: req.method,
        headers: forwardHeaders,
        body: bodyBuffer,
      },
      config.targetUrl,
      allowedHosts,
    );

    const allSetCookies = [
      ...redirectCookies,
      ...extractSetCookiesFromResponse(upstreamRes),
    ];
    const clientSetCookies = rewriteSetCookiesForClient(
      allSetCookies,
      slug,
      reqUrl,
      req.headers.get("x-forwarded-proto"),
    );

    const finalAllowedHosts = Array.from(
      new Set([configHost, ...allowedHosts, new URL(finalUrl).hostname]),
    );
    const contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";

    const isDynamicAjax =
      req.method !== "GET" ||
      parsedTarget.url.includes("/ajax/") ||
      parsedTarget.url.includes("/api/") ||
      Boolean(xRequestedWith || rscHeader) ||
      clientSetCookies.length > 0 ||
      contentType.toLowerCase().includes("application/json") ||
      (upstreamRes.headers.get("cache-control") || "").toLowerCase().includes("no-store");

    const cacheControlHeader =
      upstreamRes.status >= 400 || isDynamicAjax
        ? "no-store, no-cache, must-revalidate"
        : "private, max-age=300";

    if (contentType.toLowerCase().includes("text/css")) {
      const cssText = await upstreamRes.text();
      const rewrittenCss = rewriteCssForPathLock(
        cssText,
        finalUrl,
        slug,
        finalAllowedHosts,
      );
      const cssRes = new NextResponse(rewrittenCss, {
        status: upstreamRes.status,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": cacheControlHeader,
        },
      });
      for (const sc of clientSetCookies) {
        cssRes.headers.append("Set-Cookie", sc);
      }
      return cssRes;
    }

    if (req.method === "HEAD") {
      const headRes = new NextResponse(null, {
        status: upstreamRes.status,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        },
      });
      for (const sc of clientSetCookies) {
        headRes.headers.append("Set-Cookie", sc);
      }
      return headRes;
    }

    const isNoBodyStatus = [204, 205, 304].includes(upstreamRes.status);
    const resBuffer = isNoBodyStatus ? null : await upstreamRes.arrayBuffer();
    const binRes = new NextResponse(resBuffer, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": cacheControlHeader,
      },
    });
    for (const sc of clientSetCookies) {
      binRes.headers.append("Set-Cookie", sc);
    }
    return binRes;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "";
    if (msg === "SSRF_BLOCKED" || msg === "HOST_FORBIDDEN") {
      return NextResponse.json({ error: "Forbidden redirect destination" }, { status: 403 });
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

export async function OPTIONS(
  req: Request,
  context: { params: Promise<{ slug: string; assetPath: string[] }> },
) {
  return handleAssetProxy(req, context);
}
