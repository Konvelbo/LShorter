import { NextResponse } from "next/server";
import { getProtectedLink, saveProtectedLink, recordLinkClick, resolveAbTargetUrl } from "@/lib/protected-links-store";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { parseVisitorDetails } from "@/lib/device-detection";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://greedy-mastiff-107.convex.cloud"
);

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

function trackClickAsync(req: Request, slug: string, meta?: any) {
  try {
    const details = parseVisitorDetails(req);
    const userId = meta?.userId || meta?.user_id || "usr_default";

    // Forward click event exclusively to Cloudflare Edge Worker (0 Convex DB writes to eliminate database costs)
    fetch(`${WORKER_URL}/api/v1/links/${encodeURIComponent(slug)}/click`, {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        "Content-Type": "application/json",
        "X-User-Id": userId,
        "X-Country": details.countryCode || "FR",
        "X-City": details.city || "Paris",
        "X-Device": details.device || "desktop",
        "X-Browser": details.browser || "Chrome",
        "X-OS": details.os || "Windows",
        "X-Referrer": details.referrer || "Direct",
      },
    }).catch((err) => {
      console.warn("[Worker Click Increment Error]:", err?.message || err);
    });
  } catch (err) {
    console.warn("[Click Track Error]:", err);
  }
}

function safeRedirect(urlStr: string, base: string, reqUrl?: string, passParams: boolean = true) {
  try {
    let target = urlStr.startsWith("http://") || urlStr.startsWith("https://")
      ? urlStr
      : `https://${urlStr}`;

    if (passParams && reqUrl) {
      const incomingUrl = new URL(reqUrl, base);
      if (incomingUrl.search) {
        const destUrl = new URL(target);
        incomingUrl.searchParams.forEach((value, key) => {
          destUrl.searchParams.set(key, value);
        });
        target = destUrl.toString();
      }
    }

    return NextResponse.redirect(new URL(target, base), 307);
  } catch {
    return NextResponse.redirect(new URL("/", base), 307);
  }
}

function evaluateTargetUrl(baseTargetUrl: string, req: Request, meta?: any) {
  if (!meta) return baseTargetUrl;
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
  const country = (
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country") ||
    ""
  ).toUpperCase();

  // 1. Device / OS Targeting
  if (meta.deviceTargeting && typeof meta.deviceTargeting === "object") {
    const dt = meta.deviceTargeting;
    if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ipod")) {
      if (dt.ios) return dt.ios;
      if (dt.mobile) return dt.mobile;
    } else if (userAgent.includes("android")) {
      if (dt.android) return dt.android;
      if (dt.mobile) return dt.mobile;
    } else if (userAgent.includes("windows")) {
      if (dt.windows) return dt.windows;
      if (dt.desktop) return dt.desktop;
    } else if (userAgent.includes("macintosh") || userAgent.includes("mac os")) {
      if (dt.macos) return dt.macos;
      if (dt.desktop) return dt.desktop;
    } else if (userAgent.includes("linux")) {
      if (dt.linux) return dt.linux;
      if (dt.desktop) return dt.desktop;
    } else if (/mobile|touch/i.test(userAgent)) {
      if (dt.mobile) return dt.mobile;
    } else {
      if (dt.desktop) return dt.desktop;
    }
  }

  // 2. Geo Targeting
  if (country && meta.geoTargeting && typeof meta.geoTargeting === "object") {
    if (meta.geoTargeting[country]) {
      return meta.geoTargeting[country];
    }
  }

  return baseTargetUrl;
}

/**
 * Strict bot detection: ONLY match automated preview / scraper crawlers.
 * NEVER match regular browsers or mobile in-app webviews (FB, WhatsApp, Telegram, etc.)
 */
function isSocialCrawler(ua: string): boolean {
  if (!ua) return false;
  const lower = ua.toLowerCase();
  return (
    lower.includes("facebookexternalhit") ||
    lower.includes("facebot") ||
    lower.includes("twitterbot") ||
    lower.includes("xbot") ||
    lower.includes("linkedinbot") ||
    lower.includes("whatsapp/") ||
    lower.includes("telegrambot") ||
    lower.includes("discordbot") ||
    lower.includes("slackbot") ||
    lower.includes("slack-imgbatcher") ||
    lower.includes("pinterestbot") ||
    lower.includes("pinterest/") ||
    lower.includes("skypeuripreview") ||
    lower.includes("google-structured-data-testing-tool") ||
    lower.includes("googlebot") ||
    lower.includes("bingbot") ||
    lower.includes("applebot") ||
    lower.includes("yandexbot") ||
    lower.includes("duckduckbot") ||
    lower.includes("baiduspider") ||
    lower.includes("ia_archiver")
  );
}

function escapeHtml(str: string = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const botResponseCache = new Map<string, { body: string; headers: Record<string, string>; expiresAt: number }>();

function renderSocialHtml(meta: {
  title: string;
  description: string;
  image: string;
  destinationUrl: string;
  canonicalUrl: string;
}) {
  const safeTitle = escapeHtml(meta.title || "Lien partagé");
  const safeDesc = escapeHtml(meta.description || "Cliquez pour accéder au lien.");
  
  let imageUrl = meta.image || "";
  if (imageUrl && imageUrl.startsWith("data:")) {
    try {
      const u = new URL(meta.canonicalUrl);
      const cleanSlug = u.pathname.split("/").pop() || "banner";
      imageUrl = `${u.origin}/api/images/${cleanSlug}.jpg`;
    } catch {
      imageUrl = "https://www.lsho.cc/api/images/banner.jpg";
    }
  }

  let cleanCanonical = meta.canonicalUrl;
  let domainName = "lsho.cc";
  try {
    const u = new URL(meta.canonicalUrl);
    domainName = u.host.replace(/^www\./, "");
    cleanCanonical = meta.canonicalUrl.replace("lshorter-api.fiatechnologiecam.workers.dev", "www.lsho.cc");
  } catch {}

  const safeImg = escapeHtml(imageUrl.replace(/&amp;/g, "&"));
  const safeCanonical = escapeHtml(cleanCanonical);

  const html = `<!DOCTYPE html>
<html lang="fr" prefix="og: http://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta name="theme-color" content="#ff6600" />

  <!-- Open Graph / WhatsApp / Facebook / LinkedIn / Telegram / Slack / Discord -->
  <meta property="og:site_name" content="LShorter" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${safeCanonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  ${safeImg ? `<meta property="og:image" content="${safeImg}" />` : ""}
  ${safeImg ? `<meta property="og:image:url" content="${safeImg}" />` : ""}
  ${safeImg ? `<meta property="og:image:secure_url" content="${safeImg}" />` : ""}
  ${safeImg ? `<meta property="og:image:type" content="image/jpeg" />` : ""}
  ${safeImg ? `<meta property="og:image:width" content="1200" />` : ""}
  ${safeImg ? `<meta property="og:image:height" content="630" />` : ""}
  ${safeImg ? `<meta property="og:image:alt" content="${safeTitle}" />` : ""}

  <!-- Twitter / X Cards (Large Banner Format) -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:site" content="@LShorter" />
  <meta name="twitter:creator" content="@LShorter" />
  <meta name="twitter:domain" content="${domainName}" />
  <meta name="twitter:url" content="${safeCanonical}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  ${safeImg ? `<meta name="twitter:image" content="${safeImg}" />` : ""}
  ${safeImg ? `<meta name="twitter:image:src" content="${safeImg}" />` : ""}
  ${safeImg ? `<meta name="twitter:image:alt" content="${safeTitle}" />` : ""}
</head>
<body style="background:#09090b;">
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.redirect(new URL("/", req.url), 307);
    }

    const userAgent = req.headers.get("user-agent") || "";
    const isCrawler = isSocialCrawler(userAgent);

    // ─── 1. SOCIAL CRAWLER & SCRAPER BOT PATH ONLY ───
    if (isCrawler) {
      const cached = botResponseCache.get(slug);
      if (cached && Date.now() < cached.expiresAt) {
        return new Response(cached.body, { status: 200, headers: cached.headers });
      }

      // Check in-memory store
      const localMeta = getProtectedLink(slug);
      if (localMeta && (localMeta.ogImage || localMeta.ogTitle || localMeta.ogDescription || localMeta.metaTitle)) {
        let fullOgImage = localMeta.ogImage || "";
        if (fullOgImage && !fullOgImage.startsWith("http") && !fullOgImage.startsWith("data:")) {
          try {
            const origin = new URL(req.url).origin;
            fullOgImage = `${origin}${fullOgImage.startsWith("/") ? "" : "/"}${fullOgImage}`;
          } catch {}
        }
        const resp = renderSocialHtml({
          title: localMeta.ogTitle || localMeta.metaTitle || slug,
          description: localMeta.ogDescription || "",
          image: fullOgImage,
          destinationUrl: localMeta.targetUrl || "https://lshorter.io",
          canonicalUrl: req.url,
        });
        const bodyText = await resp.text();
        const headers = {
          "Content-Type": "text/html; charset=utf-8",
          "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
        };
        botResponseCache.set(slug, { body: bodyText, headers, expiresAt: Date.now() + 600000 });
        return new Response(bodyText, { status: 200, headers });
      }

      // Check Convex
      try {
        const cxLink: any = await convex.query(api.links.getLinkBySlug, { slug });
        if (cxLink && (cxLink.ogImage || cxLink.ogTitle || cxLink.ogDescription || cxLink.metaTitle)) {
          let fullOgImage = cxLink.ogImage || "";
          if (fullOgImage && !fullOgImage.startsWith("http") && !fullOgImage.startsWith("data:")) {
            try {
              const origin = new URL(req.url).origin;
              fullOgImage = `${origin}${fullOgImage.startsWith("/") ? "" : "/"}${fullOgImage}`;
            } catch {}
          }
          const resp = renderSocialHtml({
            title: cxLink.ogTitle || cxLink.metaTitle || cxLink.title || slug,
            description: cxLink.ogDescription || "",
            image: fullOgImage,
            destinationUrl: cxLink.targetUrl || "https://lshorter.io",
            canonicalUrl: req.url,
          });
          const bodyText = await resp.text();
          const headers = {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
          };
          botResponseCache.set(slug, { body: bodyText, headers, expiresAt: Date.now() + 600000 });
          return new Response(bodyText, { status: 200, headers });
        }
      } catch (cxErr) {
        console.warn("[Convex Bot Fetch Error]:", cxErr);
      }
    }

    // ─── 2. REAL VISITOR / HUMAN PATH (INSTANT HTTP 307 REDIRECT) ───

    // Check Click Quotas / Limits
    const clickCheck = recordLinkClick(slug);
    if (!clickCheck.isAllowed) {
      if (clickCheck.fallbackUrl) {
        return safeRedirect(clickCheck.fallbackUrl, req.url);
      }
      return NextResponse.redirect(new URL(`/r/${slug}/expired`, req.url), 307);
    }

    // Check in-memory store (<1ms lookup)
    let meta = getProtectedLink(slug);

    if (!meta) {
      try {
        const cxLink: any = await convex.query(api.links.getLinkBySlug, { slug });
        if (cxLink) {
          meta =
            saveProtectedLink({
              slug: cxLink.slug,
              password: cxLink.password,
              isCloaked: cxLink.isCloaked || cxLink.cloaking,
              metaTitle: cxLink.metaTitle || cxLink.title,
              ogTitle: cxLink.ogTitle || cxLink.title,
              ogDescription: cxLink.ogDescription,
              ogImage: cxLink.ogImage,
              targetUrl: cxLink.targetUrl,
              routingRules: cxLink.routingRules,
              geoTargeting: cxLink.geoTargeting,
              deviceTargeting: cxLink.deviceTargeting,
              maxClicks: cxLink.maxClicks,
              fallbackUrl: cxLink.fallbackUrl,
              abVariations: cxLink.abVariations,
              mainWeight: cxLink.mainWeight,
              userId: cxLink.userId,
            }) || null;
        }
      } catch (cxErr) {
        console.warn("[Route Slug Convex Query Error]:", cxErr);
      }
    }

    // If password protected, show gate
    if (meta?.password) {
      return NextResponse.redirect(new URL(`/r/${slug}/gate`, req.url), 307);
    }

    // If cloaked, show view
    if (meta?.isCloaked && meta?.targetUrl) {
      return NextResponse.redirect(new URL(`/r/${slug}/view`, req.url), 307);
    }

    // If targetUrl is available locally/from Convex, redirect INSTANTLY with 307
    if (meta?.targetUrl) {
      trackClickAsync(req, slug, meta);
      const splitUrl = resolveAbTargetUrl(meta, meta.targetUrl);
      const finalUrl = evaluateTargetUrl(splitUrl, req, meta);
      return safeRedirect(finalUrl, req.url, req.url, meta.passParams !== false);
    }

    // Fallback: Query Worker
    try {
      const originHost = req.headers.get("host") || "www.lsho.cc";
      const workerRes = await fetch(`${WORKER_URL}/r/${slug}`, {
        method: "GET",
        headers: {
          "User-Agent": userAgent,
          "X-Frontend-Secret": FRONTEND_SECRET,
          "X-Forwarded-Host": originHost,
        },
        redirect: "manual",
        cache: "no-store",
      });

      if (workerRes.status === 302 || workerRes.status === 307) {
        const location = workerRes.headers.get("location");
        if (location) {
          trackClickAsync(req, slug, meta);
          const finalUrl = evaluateTargetUrl(location, req, meta);
          return safeRedirect(finalUrl, req.url, req.url, meta?.passParams !== false);
        }
      }
    } catch (err) {
      console.warn("[Worker Redirect Resolution error]:", err);
    }

    // Fallback: Query Worker /api/v1/links
    try {
      const listRes = await fetch(`${WORKER_URL}/api/v1/links`, {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
        },
        cache: "no-store",
      });

      if (listRes.ok) {
        const listData = await listRes.json();
        const list = Array.isArray(listData?.data) ? listData.data : [];
        const found = list.find((l: any) => l.slug?.toLowerCase() === slug.toLowerCase());
        if (found) {
          if (found.password || found.is_password_protected || found.has_password) {
            return NextResponse.redirect(new URL(`/r/${slug}/gate`, req.url), 307);
          }
          if (found.is_cloaked) {
            return NextResponse.redirect(new URL(`/r/${slug}/view`, req.url), 307);
          }
          const target = found.target_url || found.targetUrl;
          if (target) {
            trackClickAsync(req, slug, found);
            const finalUrl = evaluateTargetUrl(target, req, found);
            return safeRedirect(finalUrl, req.url, req.url, found?.passParams !== false);
          }
        }
      }
    } catch (err) {
      console.warn("[Worker Links List error]:", err);
    }

    return NextResponse.redirect(new URL("/", req.url), 307);
  } catch (error: any) {
    console.error("[Redirect Handler Error]:", error);
    return NextResponse.redirect(new URL("/", req.url), 307);
  }
}

