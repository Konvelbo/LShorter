import { NextResponse } from "next/server";
import { getProtectedLink, recordLinkClick, resolveAbTargetUrl } from "@/lib/protected-links-store";

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
  /bot|crawl|slurp|spider|facebookexternalhit|twitterbot|whatsapp|telegrambot|linkedinbot|discordbot|slackbot|applebot|bingbot|googlebot|pinterest|skypeuripreview/i;

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
  const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(meta.title)}</title>
  <meta name="description" content="${escapeHtml(meta.description)}" />

  <!-- Open Graph / Facebook / LinkedIn / WhatsApp -->
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${escapeHtml(meta.canonicalUrl)}" />
  <meta property="og:title" content="${escapeHtml(meta.title)}" />
  <meta property="og:description" content="${escapeHtml(meta.description)}" />
  ${meta.image ? `<meta property="og:image" content="${escapeHtml(meta.image)}" />` : ""}
  ${meta.image ? `<meta property="og:image:secure_url" content="${escapeHtml(meta.image)}" />` : ""}
  ${meta.image ? `<meta property="og:image:alt" content="${escapeHtml(meta.title)}" />` : ""}
  <meta property="og:site_name" content="LShorter" />

  <!-- Twitter / X Card (Large Banner) -->
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:url" content="${escapeHtml(meta.canonicalUrl)}" />
  <meta name="twitter:title" content="${escapeHtml(meta.title)}" />
  <meta name="twitter:description" content="${escapeHtml(meta.description)}" />
  ${meta.image ? `<meta name="twitter:image" content="${escapeHtml(meta.image)}" />` : ""}
  ${meta.image ? `<meta name="twitter:image:alt" content="${escapeHtml(meta.title)}" />` : ""}

  <!-- Instant Redirection fallback -->
  <meta http-equiv="refresh" content="0;url=${escapeHtml(meta.destinationUrl)}" />
</head>
<body>
  <p>Redirection en cours vers <a href="${escapeHtml(meta.destinationUrl)}">${escapeHtml(meta.destinationUrl)}</a>...</p>
  <script>window.location.replace("${escapeJs(meta.destinationUrl)}");</script>
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
    const meta = getProtectedLink(slug);

    // If request comes from a social crawler (Twitterbot, facebookexternalhit, WhatsApp, Discord...)
    // AND custom social metadata (ogImage, ogTitle, ogDescription) is present, serve Open Graph HTML
    if (isBot && (meta?.ogImage || meta?.ogTitle || meta?.ogDescription || meta?.metaTitle)) {
      const finalTarget = meta?.targetUrl || "https://lshorter.io";
      return renderSocialHtml({
        title: meta.ogTitle || meta.metaTitle || slug,
        description: meta.ogDescription || "",
        image: meta.ogImage || "",
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

    // Fallback 1: Worker direct redirect (302)
    try {
      const workerRes = await fetch(`${WORKER_URL}/r/${slug}`, {
        method: "GET",
        redirect: "manual",
        cache: "no-store",
      });

      if (workerRes.status === 302) {
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
          if (isBot && (found.og_image || found.ogImage || found.og_title || found.ogTitle || found.meta_title)) {
            return renderSocialHtml({
              title: found.og_title || found.ogTitle || found.meta_title || slug,
              description: found.og_description || found.ogDescription || "",
              image: found.og_image || found.ogImage || "",
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
