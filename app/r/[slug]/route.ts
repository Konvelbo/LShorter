import { NextResponse } from "next/server";
import { getProtectedLink, saveProtectedLink, recordLinkClick, resolveAbTargetUrl } from "@/lib/protected-links-store";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://greedy-mastiff-107.convex.cloud"
);

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

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

const BOT_USER_AGENTS =
  /bot|crawl|slurp|spider|facebookexternalhit|facebook|twitter|twitterbot|xbot|whatsapp|telegram|telegrambot|linkedin|linkedinbot|discord|discordbot|slack|slackbot|applebot|bingbot|google|googlebot|pinterest|skype|skypeuripreview|embedly|quora|iframely|redditbot|vkshare/i;

function escapeHtml(str: string = "") {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeJs(str: string = "") {
  return str.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/'/g, "\\'");
}

function renderSocialHtml(meta: {
  title: string;
  description: string;
  image: string;
  destinationUrl: string;
  canonicalUrl: string;
}) {
  const safeTitle = escapeHtml(meta.title || "Lien partagé");
  const safeDesc = escapeHtml(meta.description || "Cliquez pour accéder au lien sécurisé.");
  const safeImg = escapeHtml(meta.image || "");
  const safeCanonical = escapeHtml(meta.canonicalUrl);
  const safeDest = escapeHtml(meta.destinationUrl);
  const jsDest = escapeJs(meta.destinationUrl);

  const html = `<!DOCTYPE html>
<html lang="fr" prefix="og: https://ogp.me/ns#">
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
  <meta name="twitter:domain" content="lsho.cc" />
  <meta name="twitter:url" content="${safeCanonical}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  ${safeImg ? `<meta name="twitter:image" content="${safeImg}" />` : ""}
  ${safeImg ? `<meta name="twitter:image:src" content="${safeImg}" />` : ""}
  ${safeImg ? `<meta name="twitter:image:alt" content="${safeTitle}" />` : ""}
</head>
<body style="background:#09090b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;">
  <div style="text-align:center;padding:20px;">
    <p style="font-size:16px;color:#e4e4e7;margin-bottom:12px;">Redirection vers <a href="${safeDest}" style="color:#0066FF;text-decoration:none;font-weight:600;">${safeDest}</a>...</p>
    <script>window.location.replace("${jsDest}");</script>
  </div>
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=60, s-maxage=300",
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
    const isBot = BOT_USER_AGENTS.test(userAgent);

    // Check Click Quotas / Limits (only for real users, not crawlers)
    if (!isBot) {
      const clickCheck = recordLinkClick(slug);
      if (!clickCheck.isAllowed) {
        if (clickCheck.fallbackUrl) {
          return safeRedirect(clickCheck.fallbackUrl, req.url);
        }
        return NextResponse.redirect(new URL(`/r/${slug}/expired`, req.url), 307);
      }
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

    // If request comes from a social crawler (Twitterbot, facebookexternalhit, WhatsApp, Discord...)
    // AND custom social metadata (ogImage, ogTitle, ogDescription) is present, serve Open Graph HTML
    if (isBot && (meta?.ogImage || meta?.ogTitle || meta?.ogDescription || meta?.metaTitle)) {
      const finalTarget = meta?.targetUrl || "https://lshorter.io";
      let fullOgImage = meta?.ogImage || "";
      if (fullOgImage && !fullOgImage.startsWith("http") && !fullOgImage.startsWith("data:")) {
        try {
          const origin = new URL(req.url).origin;
          fullOgImage = `${origin}${fullOgImage.startsWith("/") ? "" : "/"}${fullOgImage}`;
        } catch {}
      }

      return renderSocialHtml({
        title: meta.ogTitle || meta.metaTitle || slug,
        description: meta.ogDescription || "",
        image: fullOgImage,
        destinationUrl: finalTarget,
        canonicalUrl: req.url,
      });
    }

    // If password protected, immediately show gate (no spinner)
    if (meta?.password) {
      return NextResponse.redirect(new URL(`/r/${slug}/gate`, req.url), 307);
    }

    // If cloaked, immediately render view
    if (meta?.isCloaked && meta?.targetUrl) {
      return NextResponse.redirect(new URL(`/r/${slug}/view`, req.url), 307);
    }

    // If targetUrl is cached locally, evaluate A/B testing & routing and redirect INSTANTLY with 307
    if (meta?.targetUrl) {
      const splitUrl = resolveAbTargetUrl(meta, meta.targetUrl);
      const finalUrl = evaluateTargetUrl(splitUrl, req, meta);
      return safeRedirect(finalUrl, req.url, req.url, meta.passParams !== false);
    }

    // Fallback 1: Worker direct request (Passes bot user-agent to get Worker OpenGraph if available)
    try {
      const workerRes = await fetch(`${WORKER_URL}/r/${slug}`, {
        method: "GET",
        headers: {
          "User-Agent": userAgent,
          "X-Frontend-Secret": FRONTEND_SECRET,
        },
        redirect: "manual",
        cache: "no-store",
      });

      if (isBot && workerRes.status === 200) {
        const workerHtml = await workerRes.text();
        if (workerHtml && (workerHtml.includes("og:image") || workerHtml.includes("twitter:image"))) {
          return new Response(workerHtml, {
            status: 200,
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": "public, max-age=60, s-maxage=300",
            },
          });
        }
      }

      if (workerRes.status === 302 || workerRes.status === 307) {
        const location = workerRes.headers.get("location");
        if (location) {
          const finalUrl = evaluateTargetUrl(location, req, meta);
          return safeRedirect(finalUrl, req.url, req.url, meta?.passParams !== false);
        }
      }
    } catch (err) {
      console.warn("[Worker Redirect Resolution error]:", err);
    }

    // Fallback 2: Worker /api/v1/links
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
          if (isBot && (found.og_image || found.ogImage || found.og_title || found.ogTitle || found.meta_title || found.title)) {
            let fullOgImage = found.og_image || found.ogImage || "";
            if (fullOgImage && !fullOgImage.startsWith("http") && !fullOgImage.startsWith("data:")) {
              try {
                const origin = new URL(req.url).origin;
                fullOgImage = `${origin}${fullOgImage.startsWith("/") ? "" : "/"}${fullOgImage}`;
              } catch {}
            }
            return renderSocialHtml({
              title: found.og_title || found.ogTitle || found.meta_title || found.title || slug,
              description: found.og_description || found.ogDescription || "",
              image: fullOgImage,
              destinationUrl: found.target_url || found.targetUrl || "https://lshorter.io",
              canonicalUrl: req.url,
            });
          }
          if (found.password || found.is_password_protected || found.has_password) {
            return NextResponse.redirect(new URL(`/r/${slug}/gate`, req.url), 307);
          }
          if (found.is_cloaked) {
            return NextResponse.redirect(new URL(`/r/${slug}/view`, req.url), 307);
          }
          const target = found.target_url || found.targetUrl;
          if (target) {
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
