import { NextResponse } from "next/server";
import { getProtectedLink, saveProtectedLink, recordLinkClick, checkLinkQuota, resolveAbTargetUrl } from "@/lib/protected-links-store";
import { parseVisitorDetails, detectVisitorGeoAsync } from "@/lib/device-detection";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

export async function trackClickAsync(req: Request, slug: string, meta?: any) {
  try {
    const [geo, details] = await Promise.all([
      detectVisitorGeoAsync(req).catch(() => null),
      Promise.resolve(parseVisitorDetails(req)),
    ]);

    const countryCode = geo?.countryCode || details.countryCode || "BF";
    const city = geo?.city || details.city || "Ouagadougou";
    const userId = meta?.userId || meta?.user_id || "usr_default";

    // Forward click event to Cloudflare Edge Worker D1
    await fetch(`${WORKER_URL}/api/v1/links/${encodeURIComponent(slug)}/click`, {
      method: "POST",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        "Content-Type": "application/json",
        "X-User-Id": userId,
        "X-Country": countryCode,
        "X-City": city,
        "X-Device": details.device || "desktop",
        "X-Browser": details.browser || "Chrome",
        "X-OS": details.os || "Windows",
        "X-Referrer": details.referrer || "Direct",
      },
      body: JSON.stringify({
        country: countryCode,
        city: city,
        device: details.device || "desktop",
        browser: details.browser || "Chrome",
        os: details.os || "Windows",
        referrer: details.referrer || "Direct",
      }),
    }).catch((err) => {
      console.warn("[Worker Click Increment Error]:", err?.message || err);
    });
  } catch (err) {
    console.warn("[Click Track Error]:", err);
  }
}

function safeRedirect(
  urlStr: string,
  base: string,
  reqUrl?: string,
  passParams: boolean = true,
  statusCode: number = 307
) {
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

    return NextResponse.redirect(new URL(target, base), statusCode);
  } catch {
    return NextResponse.redirect(new URL("/", base), 307);
  }
}

import { REGION_COUNTRIES } from "@/lib/routing-utils";

export function evaluateTargetUrl(baseTargetUrl: string, req: Request, meta?: any, detectedCountry?: string): string {
  if (!meta) return baseTargetUrl;
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
  const country = (
    detectedCountry ||
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country") ||
    "BF"
  ).toUpperCase();

  // Detect Device Type
  const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent);
  const isMobile = !isTablet && /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(userAgent);
  const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  // Detect OS Type
  let osType = "other";
  if (userAgent.includes("iphone") || userAgent.includes("ipad") || userAgent.includes("ipod")) osType = "ios";
  else if (userAgent.includes("android")) osType = "android";
  else if (userAgent.includes("windows")) osType = "windows";
  else if (userAgent.includes("macintosh") || userAgent.includes("mac os") || userAgent.includes("macos")) osType = "macos";
  else if (userAgent.includes("linux")) osType = "linux";

  // 1. Evaluate Structured Routing Rules (AND logic)
  let rules = meta.routingRules || meta.routing_rules;
  if (typeof rules === "string") {
    try { rules = JSON.parse(rules); } catch {}
  }

  if (Array.isArray(rules) && rules.length > 0) {
    for (const rule of rules) {
      if (!rule) continue;
      const destUrl = rule.destinationUrl || rule.url || rule.destination_url;
      if (!destUrl) continue;
      const conditions = Array.isArray(rule.conditions) ? rule.conditions : [];
      if (conditions.length === 0) continue;

      let allConditionsMet = true;
      for (const cond of conditions) {
        if (!cond || !cond.type || !cond.value) continue;
        const val = String(cond.value).trim().toLowerCase();
        const op = cond.operator || "est";
        let isMet = false;

        if (cond.type === "pays") {
          const match = country.toLowerCase() === val;
          isMet = op === "est" ? match : !match;
        } else if (cond.type === "region") {
          const regionList = REGION_COUNTRIES[val] || [];
          const match = regionList.includes(country);
          isMet = op === "est" ? match : !match;
        } else if (cond.type === "appareil") {
          let match = deviceType === val || (val === "mobile" && (isMobile || isTablet));
          // Tolerant fallback: if an OS value like "ios" or "android" is in appareil
          if (!match && (val === "ios" || val === "android" || val === "windows" || val === "macos" || val === "linux")) {
            match = osType === val || (val === "macos" && osType === "mac");
          }
          isMet = op === "est" ? match : !match;
        } else if (cond.type === "plateforme") {
          let match = osType === val || (val === "mac" && osType === "macos") || (val === "macos" && osType === "mac");
          // Tolerant fallback: if a device format like "mobile" or "desktop" is in plateforme
          if (!match && (val === "mobile" || val === "desktop" || val === "tablet")) {
            match = deviceType === val || (val === "mobile" && (isMobile || isTablet));
          }
          isMet = op === "est" ? match : !match;
        } else {
          isMet = true;
        }

        if (!isMet) {
          allConditionsMet = false;
          break;
        }
      }

      if (allConditionsMet) {
        return destUrl.startsWith("http://") || destUrl.startsWith("https://") ? destUrl : `https://${destUrl}`;
      }
    }
  }

  // 2. Fallback: Legacy Device / OS Targeting (Only when no structured rules)
  if ((!rules || (Array.isArray(rules) && rules.length === 0)) && meta.deviceTargeting && typeof meta.deviceTargeting === "object") {
    const dt = meta.deviceTargeting;
    if (osType === "ios" && dt.ios) return dt.ios;
    if (osType === "android" && dt.android) return dt.android;
    if (osType === "windows" && dt.windows) return dt.windows;
    if (osType === "macos" && dt.macos) return dt.macos;
    if (osType === "linux" && dt.linux) return dt.linux;
    if (isMobile && dt.mobile) return dt.mobile;
    if (!isMobile && dt.desktop) return dt.desktop;
  }

  // 3. Fallback: Legacy Geo Targeting (Only when no structured rules)
  if ((!rules || (Array.isArray(rules) && rules.length === 0)) && country && meta.geoTargeting && typeof meta.geoTargeting === "object") {
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
    }

    // ─── 2. REAL VISITOR / HUMAN PATH (INSTANT HTTP 307 REDIRECT) ───
    const visitorDetails = parseVisitorDetails(req);
    const visitorCountry = (
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("x-country") ||
      visitorDetails.countryCode ||
      "BF"
    ).toUpperCase();

    // Check Click Quotas / Limits (READ-ONLY check: does not increment before password is provided)
    const quotaCheck = checkLinkQuota(slug);
    if (!quotaCheck.isAllowed) {
      if (quotaCheck.fallbackUrl) {
        return safeRedirect(quotaCheck.fallbackUrl, req.url);
      }
      return NextResponse.redirect(new URL(`/r/${slug}/expired`, req.url), 307);
    }

    // Check in-memory store (<1ms lookup)
    let meta = getProtectedLink(slug);

    // If maxClicks is set on meta or in storage, sync live count with Cloudflare D1
    if (meta?.maxClicks && meta.maxClicks > 0) {
      try {
        const syncRes = await fetch(`${WORKER_URL}/api/v1/links`, {
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
            Authorization: `Bearer ${FRONTEND_SECRET}`,
          },
          cache: "no-store",
        });
        if (syncRes.ok) {
          const listData = await syncRes.json();
          const list = Array.isArray(listData?.data) ? listData.data : [];
          const found = list.find((l: any) => l.slug?.toLowerCase() === slug.toLowerCase());
          if (found) {
            const d1Clicks = Number(found.clicks_count || found.clicks || 0);
            meta.clicksCount = Math.max(meta.clicksCount || 0, d1Clicks);
            if (found.fallback_url) meta.fallbackUrl = found.fallback_url;
            if (found.max_clicks) meta.maxClicks = Number(found.max_clicks);
          }
        }
      } catch (syncErr) {
        console.warn("[Quota Live Sync Warning]:", syncErr);
      }
    }

    // 1. Check if link is paused / disabled
    if (meta?.isActive === false) {
      return NextResponse.redirect(new URL(`/r/${slug}/paused`, req.url), 307);
    }

    // 2. Check if link is expired
    if (meta?.expiresAt && new Date(meta.expiresAt).getTime() <= Date.now()) {
      return NextResponse.redirect(new URL(`/r/${slug}/expired`, req.url), 307);
    }

    // 3. Check Access Limit on meta
    if (meta?.maxClicks && meta.maxClicks > 0 && (meta.clicksCount || 0) >= meta.maxClicks) {
      if (meta.fallbackUrl) {
        return safeRedirect(meta.fallbackUrl, req.url);
      }
      return NextResponse.redirect(new URL(`/r/${slug}/expired`, req.url), 307);
    }

    // 4. If password protected, show gate (DO NOT count click until password entered)
    if (meta?.password) {
      return NextResponse.redirect(new URL(`/r/${slug}/gate`, req.url), 307);
    }

    // 5. If cloaked, show view
    if (meta?.isCloaked && meta?.targetUrl) {
      recordLinkClick(slug);
      await trackClickAsync(req, slug, meta);
      return NextResponse.redirect(new URL(`/r/${slug}/view`, req.url), 307);
    }

    // 6. If targetUrl is available locally, increment click and redirect
    if (meta?.targetUrl) {
      recordLinkClick(slug);
      await trackClickAsync(req, slug, meta);
      const splitUrl = resolveAbTargetUrl(meta, meta.targetUrl);
      const finalUrl = evaluateTargetUrl(splitUrl, req, meta, visitorCountry);
      const redirectCode = meta.redirectType === "301" ? 301 : meta.redirectType === "302" ? 302 : 307;
      return safeRedirect(finalUrl, req.url, req.url, meta.passParams !== false, redirectCode);
    }

    // Fallback: Fetch complete link metadata from Cloudflare API
    try {
      const linkRes = await fetch(`${WORKER_URL}/api/v1/links/${encodeURIComponent(slug)}`, {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
        },
        cache: "no-store",
      });

      let found = null;
      if (linkRes.ok) {
        const json = await linkRes.json();
        found = json?.data || json;
      }

      if (!found || !found.target_url && !found.targetUrl) {
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
          found = list.find((l: any) => l.slug?.toLowerCase() === slug.toLowerCase());
        }
      }

      if (found) {
        // Cache found link in local memory store so subsequent hits evaluate in <0.5ms
        try {
          saveProtectedLink({
            slug: found.slug || slug,
            password: found.password || found.has_password || undefined,
            isCloaked: Boolean(found.is_cloaked || found.isCloaked),
            metaTitle: found.meta_title || found.metaTitle || found.og_title || found.ogTitle || undefined,
            ogTitle: found.og_title || found.ogTitle || undefined,
            ogDescription: found.og_description || found.ogDescription || undefined,
            ogImage: found.og_image || found.ogImage || undefined,
            targetUrl: found.target_url || found.targetUrl,
            routingRules: found.routing_rules || found.routingRules || undefined,
            geoTargeting: found.geo_targeting || found.geoTargeting || undefined,
            deviceTargeting: found.device_targeting || found.deviceTargeting || undefined,
            maxClicks: found.max_clicks !== undefined && found.max_clicks !== null ? Number(found.max_clicks) : undefined,
            fallbackUrl: found.fallback_url || found.fallbackUrl || undefined,
            abVariations: found.ab_variations || found.abVariations || undefined,
            mainWeight: found.main_weight !== undefined ? Number(found.main_weight) : undefined,
            redirectType: found.redirect_type || found.redirectType || undefined,
            passParams: found.pass_params !== undefined ? Boolean(found.pass_params) : found.passParams !== undefined ? Boolean(found.passParams) : undefined,
            userId: found.user_id || found.userId,
            isActive: found.is_active !== 0 && found.is_active !== false && found.isActive !== false,
            expiresAt: found.expires_at || found.expiresAt || undefined,
          });
        } catch {}

        if (found.is_active === 0 || found.is_active === false || found.isActive === false) {
          return NextResponse.redirect(new URL(`/r/${slug}/paused`, req.url), 307);
        }
        const expTime = found.expires_at || found.expiresAt;
        if (expTime && new Date(expTime).getTime() <= Date.now()) {
          return NextResponse.redirect(new URL(`/r/${slug}/expired`, req.url), 307);
        }

        const clicks = found.clicks_count || found.clicks || 0;
        const maxClicks = found.max_clicks !== undefined && found.max_clicks !== null ? Number(found.max_clicks) : found.maxClicks !== undefined && found.maxClicks !== null ? Number(found.maxClicks) : undefined;
        const fallback = found.fallback_url || found.fallbackUrl;
        if (maxClicks && maxClicks > 0 && clicks >= maxClicks) {
          if (fallback) return safeRedirect(fallback, req.url);
          return NextResponse.redirect(new URL(`/r/${slug}/expired`, req.url), 307);
        }

        if (found.password || found.is_password_protected || found.has_password) {
          return NextResponse.redirect(new URL(`/r/${slug}/gate`, req.url), 307);
        }
        if (found.is_cloaked || found.isCloaked) {
          recordLinkClick(slug);
          await trackClickAsync(req, slug, found);
          return NextResponse.redirect(new URL(`/r/${slug}/view`, req.url), 307);
        }
        const target = found.target_url || found.targetUrl;
        if (target) {
          recordLinkClick(slug);
          await trackClickAsync(req, slug, found);
          const finalUrl = evaluateTargetUrl(target, req, found, visitorCountry);
          const redirectCode = found?.redirect_type === "301" || found?.redirectType === "301" ? 301 : found?.redirect_type === "302" || found?.redirectType === "302" ? 302 : 307;
          return safeRedirect(finalUrl, req.url, req.url, found?.passParams !== false, redirectCode);
        }
      }
    } catch (err) {
      console.warn("[Worker Links Metadata Fetch error]:", err);
    }

    return NextResponse.redirect(new URL("/", req.url), 307);
  } catch (error: any) {
    console.error("[Redirect Handler Error]:", error);
    return NextResponse.redirect(new URL("/", req.url), 307);
  }
}

