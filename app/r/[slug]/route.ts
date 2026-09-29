import { NextResponse } from "next/server";
import {
  parseVisitorDetails,
  detectVisitorGeoAsync,
} from "@/lib/device-detection";
import { REGION_COUNTRIES, resolveAbTargetUrl } from "@/lib/routing-utils";

import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

export async function trackClickAsync(
  req: Request,
  slug: string,
  meta?: any,
  geoInfo?: { countryCode: string; city: string; rawIp?: string },
) {
  try {
    const geo = geoInfo || (await detectVisitorGeoAsync(req).catch(() => null));
    const details = parseVisitorDetails(req, geo || undefined);

    const countryCode = geo?.countryCode || details.countryCode || "XX";
    const city = geo?.city || details.city || "";
    const userId = meta?.userId || meta?.user_id || "usr_default";

    const userAgent = req.headers.get("user-agent") || "";
    const clientIp =
      geo?.rawIp ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    // Transmission de l'événement de clic au Cloudflare Edge Worker D1
    await fetch(
      `${WORKER_URL}/api/v1/links/${encodeURIComponent(slug)}/click`,
      {
        method: "POST",
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          "Content-Type": "application/json",
          "User-Agent": userAgent,
          "X-Forwarded-For": clientIp,
          "X-User-Id": userId,
          "X-Country": countryCode,
          "X-City": city,
          "X-Device": details.device,
          "X-Browser": details.browser,
          "X-OS": details.os,
          "X-Referrer": details.referrer || "Direct",
        },
        body: JSON.stringify({
          country: countryCode,
          city: city,
          device: details.device,
          browser: details.browser,
          os: details.os,
          referrer: details.referrer || "Direct",
        }),
      },
    ).catch((err) => {
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
  statusCode: number = 307,
) {
  try {
    if (!urlStr || typeof urlStr !== "string") {
      return NextResponse.redirect(new URL("/r/not-found", base), 307);
    }
    let target = urlStr.trim();
    if (!target.startsWith("http://") && !target.startsWith("https://")) {
      target = `https://${target}`;
    }

    if (passParams && reqUrl) {
      try {
        const incomingUrl = new URL(reqUrl, base);
        if (incomingUrl.search) {
          const destUrl = new URL(target);
          incomingUrl.searchParams.forEach((value, key) => {
            destUrl.searchParams.set(key, value);
          });
          target = destUrl.toString();
        }
      } catch {}
    }

    return NextResponse.redirect(new URL(target, base), statusCode);
  } catch (e) {
    console.warn("[safeRedirect failed]:", e);
    return NextResponse.redirect(new URL("/r/not-found", base), 307);
  }
}

export function evaluateTargetUrl(
  baseTargetUrl: string,
  req: Request,
  meta?: any,
  detectedCountry?: string,
): string {
  if (!meta) return baseTargetUrl;
  const userAgent = (req.headers.get("user-agent") || "").toLowerCase();
  const country = (
    detectedCountry ||
    req.headers.get("cf-ipcountry") ||
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("x-country") ||
    ""
  ).toUpperCase();

  // Detect Device Type
  const isTablet = /ipad|tablet|playbook|silk/i.test(userAgent);
  const isMobile =
    !isTablet &&
    /mobile|iphone|ipod|android|blackberry|opera mini|iemobile|wpdesktop/i.test(
      userAgent,
    );
  const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

  // Detect OS Type
  let osType = "other";
  if (
    userAgent.includes("iphone") ||
    userAgent.includes("ipad") ||
    userAgent.includes("ipod")
  )
    osType = "ios";
  else if (userAgent.includes("android")) osType = "android";
  else if (userAgent.includes("windows")) osType = "windows";
  else if (
    userAgent.includes("macintosh") ||
    userAgent.includes("mac os") ||
    userAgent.includes("macos")
  )
    osType = "macos";
  else if (userAgent.includes("linux")) osType = "linux";

  // Detect Browser Type (Order matters: Edge/Opera/Brave/Samsung include Chrome/Safari tokens)
  let browserType = "other";
  if (userAgent.includes("edg/") || userAgent.includes("edge/"))
    browserType = "edge";
  else if (userAgent.includes("opr/") || userAgent.includes("opera"))
    browserType = "opera";
  else if (userAgent.includes("brave")) browserType = "brave";
  else if (userAgent.includes("samsungbrowser")) browserType = "samsung";
  else if (userAgent.includes("firefox") || userAgent.includes("fxios"))
    browserType = "firefox";
  else if (userAgent.includes("chrome") || userAgent.includes("crios"))
    browserType = "chrome";
  else if (userAgent.includes("safari")) browserType = "safari";

  // 1. Evaluate Structured Routing Rules (AND logic + flat rule format compatibility)
  let rules = meta.routingRules || meta.routing_rules;
  if (typeof rules === "string") {
    try {
      rules = JSON.parse(rules);
    } catch {}
  }

  if (Array.isArray(rules) && rules.length > 0) {
    for (const rule of rules) {
      if (!rule) continue;
      const destUrl =
        rule.destinationUrl ||
        rule.url ||
        rule.destination_url ||
        rule.targetUrl ||
        rule.target_url;
      if (!destUrl) continue;

      // Support both structured conditions array AND flat { conditionType, conditionValue } format
      const conditions =
        Array.isArray(rule.conditions) && rule.conditions.length > 0
          ? rule.conditions
          : rule.conditionType || rule.condition_type
            ? [
                {
                  type: rule.conditionType || rule.condition_type,
                  operator: rule.operator || "est",
                  value: rule.conditionValue || rule.condition_value,
                },
              ]
            : [];
      if (conditions.length === 0) continue;

      let allConditionsMet = true;
      for (const cond of conditions) {
        if (!cond || !cond.type || !cond.value) continue;
        const val = String(cond.value).trim().toLowerCase();
        const op = cond.operator || "est";
        const cType = String(cond.type).trim().toLowerCase();
        let isMet = false;

        if (cType === "pays" || cType === "country") {
          const match = country.toLowerCase() === val;
          isMet = op === "est" ? match : !match;
        } else if (cType === "continent" || cType === "region") {
          const regionList = REGION_COUNTRIES[val] || [];
          const match = regionList.includes(country);
          isMet = op === "est" ? match : !match;
        } else if (cType === "navigateur" || cType === "browser") {
          const match =
            browserType === val ||
            (val === "samsung internet" && browserType === "samsung");
          isMet = op === "est" ? match : !match;
        } else if (cType === "appareil" || cType === "device") {
          let match =
            deviceType === val || (val === "mobile" && (isMobile || isTablet));
          if (
            !match &&
            (val === "ios" ||
              val === "android" ||
              val === "windows" ||
              val === "macos" ||
              val === "linux")
          ) {
            match = osType === val || (val === "macos" && osType === "mac");
          }
          isMet = op === "est" ? match : !match;
        } else if (cType === "plateforme" || cType === "os") {
          let match =
            osType === val ||
            (val === "mac" && osType === "macos") ||
            (val === "macos" && osType === "mac");
          if (
            !match &&
            (val === "mobile" || val === "desktop" || val === "tablet")
          ) {
            match =
              deviceType === val ||
              (val === "mobile" && (isMobile || isTablet));
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
        return destUrl.startsWith("http://") || destUrl.startsWith("https://")
          ? destUrl
          : `https://${destUrl}`;
      }
    }
  }

  // 2. Fallback: Legacy Device / OS Targeting (Only when no structured rules)
  if (
    (!rules || (Array.isArray(rules) && rules.length === 0)) &&
    meta.deviceTargeting &&
    typeof meta.deviceTargeting === "object"
  ) {
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
  if (
    (!rules || (Array.isArray(rules) && rules.length === 0)) &&
    country &&
    meta.geoTargeting &&
    typeof meta.geoTargeting === "object"
  ) {
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
    lower.includes("whatsapp") ||
    lower.includes("telegrambot") ||
    lower.includes("discordbot") ||
    lower.includes("slackbot") ||
    lower.includes("slack-imgbatcher") ||
    lower.includes("pinterest") ||
    lower.includes("skypeuripreview") ||
    lower.includes("google-structured-data-testing-tool") ||
    lower.includes("googlebot") ||
    lower.includes("bingbot") ||
    lower.includes("applebot") ||
    lower.includes("yandexbot") ||
    lower.includes("duckduckbot") ||
    lower.includes("baiduspider") ||
    lower.includes("ia_archiver") ||
    lower.includes("opengraph") ||
    lower.includes("meta-tag") ||
    lower.includes("crawler") ||
    lower.includes("spider") ||
    lower.includes("scraper") ||
    lower.includes("validator") ||
    lower.includes("preview") ||
    lower.includes("embedly") ||
    lower.includes("quora") ||
    lower.includes("vkshare") ||
    lower.includes("w3c") ||
    lower.includes("reddit") ||
    lower.includes("mastodon") ||
    lower.includes("curl") ||
    lower.includes("wget") ||
    lower.includes("http-client") ||
    lower.includes("bot")
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

const botResponseCache = new Map<
  string,
  { body: string; headers: Record<string, string>; expiresAt: number }
>();

export function invalidateBotResponseCache(slug?: string) {
  if (slug) {
    botResponseCache.delete(slug.toLowerCase());
  } else {
    botResponseCache.clear();
  }
}

// Builds the dynamic OG image URL for a given link.
function buildDefaultOgImage(
  canonicalUrl: string,
  title?: string,
  slug?: string,
): string {
  try {
    const origin = new URL(canonicalUrl).origin;
    const params = new URLSearchParams();
    if (title) params.set("title", title.substring(0, 80));
    if (slug) params.set("slug", slug);
    params.set(
      "desc",
      "Powered by LShorter — Edge URL Shortener & Smart Routing",
    );
    return `${origin}/api/og?${params.toString()}`;
  } catch {
    return "https://www.lsho.cc/api/og?title=LShorter&desc=Edge+URL+Shortener";
  }
}

function renderSocialHtml(meta: {
  title: string;
  description: string;
  image: string;
  twitterCard?: "summary_large_image" | "summary";
  destinationUrl: string;
  canonicalUrl: string;
  slug?: string;
}) {
  const safeTitle = escapeHtml(meta.title || "LShorter — Smart Link Shortened");
  const safeDesc = escapeHtml(
    meta.description || "Click to access this link powered by LShorter Edge.",
  );
  const cardType =
    meta.twitterCard === "summary" ? "summary" : "summary_large_image";

  let imageUrl = meta.image || "";

  if (imageUrl && imageUrl.startsWith("data:")) {
    try {
      const u = new URL(meta.canonicalUrl);
      const cleanSlug = u.pathname.split("/").pop() || "banner";
      imageUrl = `${u.origin}/api/images/${cleanSlug}.jpg`;
    } catch {
      imageUrl = buildDefaultOgImage(meta.canonicalUrl, meta.title, meta.slug);
    }
  }

  if (!imageUrl || (cardType === "summary" && (imageUrl.includes("/api/og") || imageUrl.includes("default_banner")))) {
    if (cardType === "summary") {
      imageUrl = "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/images/default_icon.png";
    } else {
      imageUrl = "https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/images/default_banner.jpg";
    }
  }

  let cleanCanonical = meta.canonicalUrl;
  let domainName = "lsho.cc";
  try {
    const u = new URL(meta.canonicalUrl);
    domainName = u.host.replace(/^www\./, "");
    if (WORKER_URL) {
      try {
        const workerHost = new URL(WORKER_URL).host;
        cleanCanonical = meta.canonicalUrl.replace(workerHost, "www.lsho.cc");
      } catch {}
    }
  } catch {}

  const safeImg = escapeHtml(imageUrl.replace(/&amp;/g, "&"));
  const safeCanonical = escapeHtml(cleanCanonical);
  const safeDest = escapeHtml(meta.destinationUrl || "https://lsho.cc");
  const imgWidth = cardType === "summary" ? "512" : "1200";
  const imgHeight = cardType === "summary" ? "512" : "630";

  let imgType = "image/jpeg";
  if (imageUrl.includes(".png") || imageUrl.includes("/api/og") || imageUrl.includes("/icon-512")) {
    imgType = "image/png";
  } else if (imageUrl.includes(".webp")) {
    imgType = "image/webp";
  } else if (imageUrl.includes(".gif")) {
    imgType = "image/gif";
  }

  const html = `<!DOCTYPE html>
<html lang="fr" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta name="theme-color" content="#465FFF" />

  <!-- Open Graph / WhatsApp / Facebook / LinkedIn / Telegram / Slack / Discord -->
  <meta property="og:site_name" content="LShorter" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${safeCanonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeImg}" />
  <meta property="og:image:url" content="${safeImg}" />
  <meta property="og:image:secure_url" content="${safeImg}" />
  <meta property="og:image:type" content="${imgType}" />
  <meta property="og:image:width" content="${imgWidth}" />
  <meta property="og:image:height" content="${imgHeight}" />
  <meta property="og:image:alt" content="${safeTitle}" />

  <!-- Twitter / X Cards -->
  <meta name="twitter:card" content="${cardType}" />
  <meta property="twitter:card" content="${cardType}" />
  <meta name="twitter:site" content="@LShorter" />
  <meta name="twitter:creator" content="@LShorter" />
  <meta name="twitter:domain" content="${domainName}" />
  <meta name="twitter:url" content="${safeCanonical}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeImg}" />
  <meta property="twitter:image" content="${safeImg}" />
  <meta name="twitter:image:src" content="${safeImg}" />
  <meta name="twitter:image:alt" content="${safeTitle}" />

</head>
<body style="background:#09090b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;box-sizing:border-box;">
  ${cardType === 'summary' ? `
  <div style="max-width:540px;width:100%;border-radius:14px;border:1px solid #27272a;overflow:hidden;background:#141416;box-shadow:0 10px 30px rgba(0,0,0,0.5);display:flex;align-items:center;padding:16px;gap:16px;box-sizing:border-box;">
    ${safeImg ? `<img src="${safeImg}" alt="${safeTitle}" style="width:96px;height:96px;min-width:96px;border-radius:10px;object-fit:cover;display:block;" />` : ''}
    <div style="flex:1;min-width:0;">
      <span style="font-size:11px;font-weight:700;color:#f97316;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:4px;">${escapeHtml(meta.slug || domainName)}</span>
      <h2 style="margin:0 0 6px;font-size:15px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${safeTitle}</h2>
      <p style="margin:0 0 12px;font-size:12px;color:#a1a1aa;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${safeDesc}</p>
      <a href="${safeDest}" style="display:inline-block;padding:7px 14px;background:#465FFF;color:#fff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;">Continuer &rarr;</a>
    </div>
  </div>
  ` : `
  <div style="max-width:540px;width:100%;border-radius:16px;border:1px solid #27272a;overflow:hidden;background:#141416;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
    ${safeImg ? `<img src="${safeImg}" alt="${safeTitle}" style="width:100%;height:auto;display:block;aspect-ratio:1200/630;object-fit:cover;" />` : ''}
    <div style="padding:20px;">
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#fff;">${safeTitle}</h2>
      <p style="margin:0 0 16px;font-size:13px;color:#a1a1aa;line-height:1.5;">${safeDesc}</p>
      <a href="${safeDest}" style="display:inline-block;padding:10px 20px;background:#465FFF;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">Continuer vers le site &rarr;</a>
    </div>
  </div>
  `}
</body>
</html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=300, s-maxage=3600",
    },
  });
}

const recentClicks = new Map<string, number>();

function shouldTrackClick(
  ip: string,
  slug: string,
  isPrefetch: boolean,
): boolean {
  if (isPrefetch) return false;
  const cleanIp = (ip || "127.0.0.1").split(",")[0].trim();
  const key = `${cleanIp}:${slug.toLowerCase()}`;
  const now = Date.now();
  const lastTime = recentClicks.get(key);
  if (lastTime && now - lastTime < 600) {
    return false;
  }
  recentClicks.set(key, now);
  if (recentClicks.size > 5000) {
    for (const [k, v] of recentClicks.entries()) {
      if (now - v > 15000) recentClicks.delete(k);
    }
  }
  return true;
}

async function fetchWorkerLink(slug: string): Promise<any | null> {
  try {
    const singleRes = await fetch(
      `${WORKER_URL}/api/v1/links/${encodeURIComponent(slug)}`,
      {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
        },
        cache: "no-store",
      },
    ).catch(() => null);

    if (singleRes && singleRes.ok) {
      const json = await singleRes.json().catch(() => null);
      if (json?.data && (json.data.target_url || json.data.targetUrl)) {
        return json.data;
      }
      if (json && (json.target_url || json.targetUrl)) {
        return json;
      }
    }

    const listRes = await fetch(`${WORKER_URL}/api/v1/links?limit=100`, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
      },
      cache: "no-store",
    }).catch(() => null);

    if (listRes && listRes.ok) {
      const listData = await listRes.json().catch(() => null);
      const list = Array.isArray(listData?.data) ? listData.data : [];
      return (
        list.find(
          (l: any) =>
            l.slug?.toLowerCase() === slug.toLowerCase() || l.id === slug,
        ) || null
      );
    }
  } catch (err) {
    console.warn("[Worker Link Lookup error]:", err);
  }
  return null;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await params;
    if (!slug) {
      return NextResponse.redirect(new URL("/", req.url), 307);
    }

    const userAgent = req.headers.get("user-agent") || "";
    const isCrawler = isSocialCrawler(userAgent);
    const purpose = (
      req.headers.get("purpose") ||
      req.headers.get("sec-purpose") ||
      req.headers.get("x-purpose") ||
      req.headers.get("x-moz") ||
      ""
    ).toLowerCase();
    const isInternalProbe =
      req.headers.get("x-internal-probe") === "1" ||
      req.headers.get("x-crawler-prewarm") === "1" ||
      req.headers.get("x-frontend-secret") === FRONTEND_SECRET;
    const isPrefetch = purpose.includes("prefetch") || isInternalProbe;

    // ─── 1. SOCIAL CRAWLER & SCRAPER BOT PATH ONLY ───
    if (isCrawler) {
      // Crawlers/bots are served social previews without writing to D1 or incrementing click counter
      const cached = botResponseCache.get(slug);
      if (cached && Date.now() < cached.expiresAt) {
        return new Response(cached.body, {
          status: 200,
          headers: cached.headers,
        });
      }

      let localMeta = await fetchWorkerLink(slug);

      if (!localMeta || (!localMeta.ogImage && !localMeta.og_image && !localMeta.banner_url && !localMeta.bannerUrl)) {
        try {
          const edgeRes = await fetch(
            `${WORKER_URL}/r/${encodeURIComponent(slug)}`,
            {
              method: "GET",
              headers: {
                "User-Agent": "Twitterbot/1.0",
                "CF-IPCountry": "FR",
                "X-Internal-Probe": "1",
                "X-Frontend-Secret": FRONTEND_SECRET,
                Purpose: "prefetch",
              },
              cache: "no-store",
            },
          ).catch(() => null);

          if (
            edgeRes &&
            edgeRes.ok &&
            (edgeRes.headers.get("content-type") || "").includes("text/html")
          ) {
            const edgeHtml = await edgeRes.text();
            const ogTitleMatch = edgeHtml.match(
              /<meta property="og:title" content="([^"]*)"/i,
            );
            const ogDescMatch = edgeHtml.match(
              /<meta property="og:description" content="([^"]*)"/i,
            );
            const ogImgMatch = edgeHtml.match(
              /<meta property="og:image" content="([^"]*)"/i,
            );
            const twitterCardMatch = edgeHtml.match(
              /<meta name="twitter:card" content="([^"]*)"/i,
            );
            const titleMatch = edgeHtml.match(/<title>([^<]*)<\/title>/i);

            const fetchedImage = ogImgMatch
              ? ogImgMatch[1].replace(/&amp;/g, "&")
              : "";
            const fetchedCard = twitterCardMatch
              ? twitterCardMatch[1]
              : undefined;

            localMeta = {
              slug,
              targetUrl:
                localMeta?.target_url ||
                localMeta?.targetUrl ||
                "https://lsho.cc",
              ogTitle: ogTitleMatch
                ? ogTitleMatch[1]
                : titleMatch
                  ? titleMatch[1]
                  : localMeta?.og_title || localMeta?.ogTitle || slug,
              ogDescription: ogDescMatch
                ? ogDescMatch[1]
                : localMeta?.og_description || localMeta?.ogDescription || "",
              ogImage:
                fetchedImage ||
                localMeta?.og_image ||
                localMeta?.ogImage ||
                "",
              bannerStyle:
                localMeta?.banner_style ||
                localMeta?.bannerStyle ||
                (fetchedCard === "summary" ? "default_banner" : "large_banner"),
              twitterCard:
                localMeta?.twitter_card ||
                localMeta?.twitterCard ||
                (fetchedCard === "summary" ? "summary" : "summary_large_image"),
              metaTitle: ogTitleMatch
                ? ogTitleMatch[1]
                : titleMatch
                  ? titleMatch[1]
                  : localMeta?.meta_title || localMeta?.metaTitle || slug,
            } as any;
          }
        } catch (edgeErr) {
          console.warn("[Crawler Edge Fetch Warning]:", edgeErr);
        }
      }

      let fullOgImage =
        localMeta?.og_image || localMeta?.ogImage || localMeta?.banner_url || localMeta?.bannerUrl || "";
      if (
        fullOgImage &&
        !fullOgImage.startsWith("http") &&
        !fullOgImage.startsWith("data:")
      ) {
        if (fullOgImage.startsWith("/api/images/")) {
          const fName = fullOgImage.replace("/api/images/", "");
          fullOgImage = `https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/images/${fName}`;
        } else {
          try {
            const origin = new URL(req.url).origin;
            fullOgImage = `${origin}${fullOgImage.startsWith("/") ? "" : "/"}${fullOgImage}`;
          } catch {}
        }
      }

      const rawBannerStyle =
        localMeta?.banner_style ||
        localMeta?.bannerStyle;
      const rawTwitterCard =
        localMeta?.twitter_card ||
        localMeta?.twitterCard;
      const isLarge =
        rawTwitterCard === "summary_large_image" || rawBannerStyle === "large_banner";
      const isDefault =
        (rawTwitterCard === "summary" || rawBannerStyle === "default_banner") && !isLarge;
      const resolvedCard = isDefault ? "summary" : "summary_large_image";

      const resp = renderSocialHtml({
        title:
          localMeta?.og_title ||
          localMeta?.ogTitle ||
          localMeta?.meta_title ||
          localMeta?.metaTitle ||
          slug,
        description:
          localMeta?.og_description ||
          localMeta?.ogDescription ||
          "Click to access this link powered by LShorter Edge.",
        image: fullOgImage,
        twitterCard: resolvedCard,
        destinationUrl:
          localMeta?.target_url || localMeta?.targetUrl || "https://lshorter.io",
        canonicalUrl: req.url,
        slug,
      });
      const bodyText = await resp.text();
      const headers = {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=3600",
      };
      botResponseCache.set(slug, {
        body: bodyText,
        headers,
        expiresAt: Date.now() + 5000,
      });
      return new Response(bodyText, { status: 200, headers });
    }

    // ─── 2. REAL VISITOR / HUMAN PATH (INSTANT HTTP 307 REDIRECT) ───
    const geo = await detectVisitorGeoAsync(req).catch(() => ({
      countryCode: "XX",
      city: "",
      rawIp: "127.0.0.1",
    }));
    const visitorDetails = parseVisitorDetails(req, geo);
    const visitorCountry = (
      req.headers.get("cf-ipcountry") ||
      req.headers.get("x-vercel-ip-country") ||
      req.headers.get("x-country") ||
      geo.countryCode ||
      visitorDetails.countryCode ||
      "XX"
    ).toUpperCase();

    const clientIp =
      geo.rawIp ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "127.0.0.1";

    const canRecordClick =
      !isPrefetch &&
      !isInternalProbe &&
      shouldTrackClick(clientIp, slug, isPrefetch);

    // Fetch link metadata directly from Cloudflare Worker D1
    const found = await fetchWorkerLink(slug);

    if (!found || (!found.target_url && !found.targetUrl)) {
      // Direct edge probe fallback
      try {
        const edgeProbe = await fetch(
          `${WORKER_URL}/r/${encodeURIComponent(slug)}`,
          {
            method: "GET",
            headers: {
              "User-Agent": userAgent,
              "CF-IPCountry": visitorCountry,
              "X-Country": visitorCountry,
              "X-Internal-Probe": "1",
              "X-Frontend-Secret": FRONTEND_SECRET,
              Purpose: "prefetch",
            },
            redirect: "manual",
            cache: "no-store",
          },
        );

        const edgeLocation = edgeProbe.headers.get("location");
        if (
          edgeLocation &&
          (edgeProbe.status === 301 ||
            edgeProbe.status === 302 ||
            edgeProbe.status === 307)
        ) {
          return safeRedirect(edgeLocation, req.url);
        }
      } catch (edgeErr) {
        console.warn("[Edge Probe Warning]:", edgeErr);
      }

      return NextResponse.redirect(
        new URL(`/r/${slug}/not-found`, req.url),
        307,
      );
    }

    // 1. Link paused / disabled
    if (
      found.is_active === 0 ||
      found.is_active === false ||
      found.isActive === false
    ) {
      return NextResponse.redirect(new URL(`/r/${slug}/paused`, req.url), 307);
    }

    // 2. Link expired
    const expTime = found.expires_at || found.expiresAt;
    if (expTime && new Date(expTime).getTime() <= Date.now()) {
      if (found.is_active !== 0 && found.isActive !== false) {
        fetch(`${WORKER_URL}/api/v1/links/${encodeURIComponent(found.id || slug)}`, {
          method: "PATCH",
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
            Authorization: `Bearer ${FRONTEND_SECRET}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ is_active: 0, isActive: false }),
        }).catch(() => {});
      }
      return NextResponse.redirect(new URL(`/r/${slug}/expired`, req.url), 307);
    }

    // 3. Click limit quota
    const clicks = Number(found.clicks_count || found.clicks || 0);
    const maxClicks =
      found.max_clicks !== undefined && found.max_clicks !== null
        ? Number(found.max_clicks)
        : found.maxClicks !== undefined && found.maxClicks !== null
          ? Number(found.maxClicks)
          : undefined;
    const fallback = found.fallback_url || found.fallbackUrl;
    if (maxClicks && maxClicks > 0 && clicks >= maxClicks) {
      if (fallback) return safeRedirect(fallback, req.url);
      return NextResponse.redirect(new URL(`/r/${slug}/expired`, req.url), 307);
    }

    // 4. Password protected
    if (
      found.password ||
      found.is_password_protected ||
      found.has_password
    ) {
      return NextResponse.redirect(new URL(`/r/${slug}/gate`, req.url), 307);
    }

    // 5. Cloaked or PathLock
    const isPathLocked = Boolean(
      (found.path_lock_mode && found.path_lock_mode !== "off") ||
      (found.pathLockMode && found.pathLockMode !== "off"),
    );
    if (found.is_cloaked || found.isCloaked || isPathLocked) {
      if (canRecordClick) {
        await trackClickAsync(req, slug, found, geo);
      }
      return NextResponse.redirect(new URL(`/r/${slug}/view`, req.url), 307);
    }

    // 6. Direct redirection
    const target = found.target_url || found.targetUrl;
    if (target) {
      if (canRecordClick) {
        await trackClickAsync(req, slug, found, geo);
      }
      const splitUrl = resolveAbTargetUrl(found, target);
      const finalUrl = evaluateTargetUrl(
        splitUrl,
        req,
        found,
        visitorCountry,
      );
      const redirectCode =
        found?.redirect_type === "301" || found?.redirectType === "301"
          ? 301
          : found?.redirect_type === "302" || found?.redirectType === "302"
            ? 302
            : 307;
      return safeRedirect(
        finalUrl,
        req.url,
        req.url,
        found?.passParams !== false && found?.pass_params !== false,
        redirectCode,
      );
    }

    return NextResponse.redirect(
      new URL(`/r/${slug}/not-found`, req.url),
      307,
    );
  } catch (error: any) {
    console.error("[Redirect Handler Error]:", error);
    return NextResponse.redirect(new URL(`/r/not-found`, req.url), 307);
  }
}
