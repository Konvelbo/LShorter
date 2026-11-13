import { NextResponse } from "next/server";
import {
  getAllowedHostsForConfig,
  isSameSiteOrAllowedHost,
  isSafeProxyTargetUrl,
  parseProxyAssetSegments,
  rememberAllowedHostsForSlug,
  resolvePathLockLinkConfig,
  rewriteCssForPathLock,
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
    const forwardHeaders: Record<string, string> = {
      "User-Agent":
        req.headers.get("user-agent") ||
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
      Accept: req.headers.get("accept") || "*/*",
      "Accept-Language": req.headers.get("accept-language") || "fr-FR,fr;q=0.9,en-US;q=0.8,en;q=0.7",
    };
    const contentTypeIn = req.headers.get("content-type");
    if (contentTypeIn) forwardHeaders["Content-Type"] = contentTypeIn;
    const rscHeader = req.headers.get("rsc");
    if (rscHeader) forwardHeaders["RSC"] = rscHeader;
    const nextRouterStateTree = req.headers.get("next-router-state-tree");
    if (nextRouterStateTree) forwardHeaders["Next-Router-State-Tree"] = nextRouterStateTree;

    const hasBody = req.method !== "GET" && req.method !== "HEAD";
    const bodyBuffer = hasBody ? await req.arrayBuffer() : undefined;

    const { response: upstreamRes, finalUrl } = await safeUpstreamFetch(
      parsedTarget.url,
      {
        method: req.method,
        headers: forwardHeaders,
        body: bodyBuffer,
      },
      config.targetUrl,
      allowedHosts,
    );

    const finalAllowedHosts = Array.from(
      new Set([configHost, ...allowedHosts, new URL(finalUrl).hostname]),
    );
    const contentType = upstreamRes.headers.get("content-type") || "application/octet-stream";

    if (contentType.toLowerCase().includes("text/css")) {
      const cssText = await upstreamRes.text();
      const rewrittenCss = rewriteCssForPathLock(
        cssText,
        finalUrl,
        slug,
        finalAllowedHosts,
      );
      return new NextResponse(rewrittenCss, {
        status: upstreamRes.status,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "private, max-age=300",
        },
      });
    }

    if (req.method === "HEAD") {
      return new NextResponse(null, {
        status: upstreamRes.status,
        headers: {
          "Content-Type": contentType,
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    const resBuffer = await upstreamRes.arrayBuffer();
    return new NextResponse(resBuffer, {
      status: upstreamRes.status,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": upstreamRes.status >= 400 ? "no-store" : "private, max-age=300",
      },
    });
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
