export function getDicebearGlassUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed || "lshorter")}`;
}

const SOCIAL_CRAWLERS = [
  "twitter",
  "twitterbot",
  "xbot",
  "facebookexternalhit",
  "facebot",
  "whatsapp",
  "telegrambot",
  "linkedinbot",
  "slackbot",
  "slack-imgbatcher",
  "discordbot",
  "pinterest",
  "applebot",
  "bingbot",
  "googlebot",
  "vkshare",
  "w3c_validator",
  "redditbot",
  "quora link preview",
  "embedly",
  "skypeuripreview",
  "nuzzel",
  "bytespider",
  "tiktok",
  "mastodon",
  "bluesky",
];

export function isSocialCrawler(userAgentRaw: string): boolean {
  const ua = (userAgentRaw || "").toLowerCase();
  if (!ua) return false;
  return SOCIAL_CRAWLERS.some((bot) => ua.includes(bot));
}

// In-memory cache for bot responses
const botResponseCache = new Map<string, { body: string; headers: HeadersInit; expiresAt: number }>();

export function getCachedBotResponse(slug: string, search: string = ""): { body: string; headers: HeadersInit } | null {
  // If a cache-busting query parameter is present (like ?v=x, ?_t=123, ?cb=1, ?nocache=1, ?preview=1), completely bypass cache!
  if (search && (search.includes("v=") || search.includes("_t=") || search.includes("cb=") || search.includes("nocache=") || search.includes("preview="))) {
    return null;
  }
  const key = `${(slug || "").toLowerCase()}${search ? `:${search.toLowerCase()}` : ""}`;
  const cached = botResponseCache.get(key) || (!search ? botResponseCache.get((slug || "").toLowerCase()) : undefined);
  if (cached && Date.now() < cached.expiresAt) {
    return { body: cached.body, headers: cached.headers };
  }
  return null;
}

export function setCachedBotResponse(slug: string, body: string, headers: HeadersInit, ttlMs: number = 30000, search: string = ""): void {
  const baseKey = (slug || "").toLowerCase();
  const entry = {
    body,
    headers,
    expiresAt: Date.now() + ttlMs,
  };
  if (!search) {
    botResponseCache.set(baseKey, entry);
  } else {
    botResponseCache.set(`${baseKey}:${search.toLowerCase()}`, entry);
  }
}

export function invalidateBotResponseCache(slug?: string): void {
  if (slug) {
    const s = slug.toLowerCase();
    for (const key of Array.from(botResponseCache.keys())) {
      if (key === s || key.startsWith(`${s}:`)) {
        botResponseCache.delete(key);
      }
    }
    botResponseCache.delete(slug);
  } else {
    botResponseCache.clear();
  }
}

function escapeHtml(text?: string | null): string {
  if (!text) return "";
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function sanitizeSafeUrl(url?: string | null): string {
  if (!url) return "#";
  const trimmed = String(url).trim();
  // Prevent javascript:, vbscript:, and malicious data: schemas
  if (/^(javascript|vbscript|data:(?!image\/)):/i.test(trimmed)) {
    return "#";
  }
  return trimmed;
}

export function renderSocialHtml(options: {
  title?: string;
  description?: string;
  image?: string;
  twitterCard?: string;
  destinationUrl?: string;
  canonicalUrl: string;
  slug: string;
  domain?: string;
  isPreview?: boolean;
}): string {
  const domainName = escapeHtml(options.domain || "lsho.cc");
  const rawDomain = options.domain || "lsho.cc";
  const safeTitle = escapeHtml(options.title || "LShorter");
  const safeDesc = escapeHtml(
    options.description || "Cliquez pour accéder à ce lien sécurisé par LShorter.",
  );
  const cardType = options.twitterCard === "summary" ? "summary" : "summary_large_image";

  // Normalize image URL to absolute HTTPS format
  let resolvedImg = (options.image || "").trim();
  if (resolvedImg && !resolvedImg.startsWith("http://") && !resolvedImg.startsWith("https://")) {
    if (resolvedImg.startsWith("/")) {
      resolvedImg = `https://${rawDomain}${resolvedImg}`;
    } else {
      resolvedImg = `https://${rawDomain}/${resolvedImg}`;
    }
  }

  // Twitter / X STRICTLY requires raster images (PNG, JPG, WEBP, GIF). SVG is dropped by Twitterbot!
  const isSvg = !resolvedImg || resolvedImg.includes(".svg") || resolvedImg.includes("dicebear");
  let twitterImg = resolvedImg;
  if (isSvg) {
    if (cardType === "summary") {
      twitterImg = `https://${rawDomain}/icon-512.png`;
    } else {
      twitterImg = `https://${rawDomain}/api/og?title=${encodeURIComponent((options.title || options.slug || "LShorter").substring(0, 80))}&slug=${encodeURIComponent(options.slug || "")}`;
    }
  }

  // Open Graph raster fallback for Facebook, WhatsApp, Telegram, LinkedIn, Discord
  let ogImg = resolvedImg;
  if (!ogImg || ogImg.includes(".svg") || ogImg.includes("dicebear")) {
    ogImg = twitterImg;
  }

  const fallbackGlass = getDicebearGlassUrl(options.slug || "lshorter");
  const safeOgImg = escapeHtml(sanitizeSafeUrl(ogImg));
  const safeTwitterImg = escapeHtml(sanitizeSafeUrl(twitterImg));
  const safeImg = safeTwitterImg;
  const safeDest = escapeHtml(sanitizeSafeUrl(options.destinationUrl || options.canonicalUrl));
  const safeCanonical = escapeHtml(sanitizeSafeUrl(options.canonicalUrl));
  const safeSlug = escapeHtml(options.slug || "");

  const ogImgType = ogImg.includes(".png")
    ? "image/png"
    : ogImg.includes(".webp")
      ? "image/webp"
      : ogImg.includes(".svg")
        ? "image/svg+xml"
        : "image/jpeg";
  const imgWidth = cardType === "summary" ? "400" : "1200";
  const imgHeight = cardType === "summary" ? "400" : "630";

  if (!options.isPreview) {
    return `<!DOCTYPE html>
<html lang="fr" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta name="theme-color" content="#0066FF" />
  <meta name="robots" content="index, follow, max-image-preview:large" />

  <!-- Open Graph / WhatsApp / Facebook / LinkedIn / Telegram / Slack / Discord -->
  <meta property="og:site_name" content="LShorter" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${safeCanonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeOgImg}" />
  <meta property="og:image:url" content="${safeOgImg}" />
  <meta property="og:image:secure_url" content="${safeOgImg}" />
  <meta property="og:image:type" content="${ogImgType}" />
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
  <meta name="twitter:image" content="${safeTwitterImg}" />
  <meta property="twitter:image" content="${safeTwitterImg}" />
  <meta name="twitter:image:src" content="${safeTwitterImg}" />
  <meta name="twitter:image:alt" content="${safeTitle}" />
  <meta name="twitter:image:width" content="${imgWidth}" />
  <meta name="twitter:image:height" content="${imgHeight}" />
</head>
<body style="background:#09090b;color:#fafafa;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;padding:24px;box-sizing:border-box;">
  ${cardType === "summary" ? `
  <div style="max-width:540px;width:100%;border-radius:14px;border:1px solid #27272a;overflow:hidden;background:#141416;box-shadow:0 10px 30px rgba(0,0,0,0.5);display:flex;align-items:center;padding:16px;gap:16px;box-sizing:border-box;">
    ${safeImg ? `<img src="${safeImg}" alt="${safeTitle}" style="width:96px;height:96px;min-width:96px;border-radius:10px;object-fit:cover;display:block;" />` : ""}
    <div style="flex:1;min-width:0;">
      <span style="font-size:11px;font-weight:700;color:#0066FF;text-transform:uppercase;letter-spacing:0.5px;display:block;margin-bottom:4px;">${safeSlug || domainName}</span>
      <h2 style="margin:0 0 6px;font-size:15px;font-weight:600;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${safeTitle}</h2>
      <p style="margin:0 0 12px;font-size:12px;color:#a1a1aa;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;">${safeDesc}</p>
      <a href="${safeDest}" style="display:inline-block;padding:7px 14px;background:#0066FF;color:#fff;text-decoration:none;border-radius:6px;font-size:12px;font-weight:600;">Continuer &rarr;</a>
    </div>
  </div>
  ` : `
  <div style="max-width:540px;width:100%;border-radius:16px;border:1px solid #27272a;overflow:hidden;background:#141416;box-shadow:0 10px 30px rgba(0,0,0,0.5);">
    ${safeImg ? `<img src="${safeImg}" alt="${safeTitle}" style="width:100%;height:auto;display:block;aspect-ratio:1200/630;object-fit:cover;" />` : ""}
    <div style="padding:20px;">
      <h2 style="margin:0 0 8px;font-size:18px;font-weight:600;color:#fff;">${safeTitle}</h2>
      <p style="margin:0 0 16px;font-size:13px;color:#a1a1aa;line-height:1.5;">${safeDesc}</p>
      <a href="${safeDest}" style="display:inline-block;padding:10px 20px;background:#0066FF;color:#fff;text-decoration:none;border-radius:8px;font-size:13px;font-weight:600;">Continuer vers le site &rarr;</a>
    </div>
  </div>
  `}
</body>
</html>`;
  }

  // Interactive Dev Banner Inspector HTML
  return `<!DOCTYPE html>
<html lang="fr" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Inspecteur de Bannière — ${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta name="theme-color" content="#0066FF" />
  <meta name="robots" content="index, follow, max-image-preview:large" />

  <meta property="og:site_name" content="LShorter" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${safeCanonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeOgImg}" />
  <meta property="og:image:url" content="${safeOgImg}" />
  <meta property="og:image:secure_url" content="${safeOgImg}" />
  <meta property="og:image:type" content="${ogImgType}" />
  <meta property="og:image:width" content="${imgWidth}" />
  <meta property="og:image:height" content="${imgHeight}" />
  <meta property="og:image:alt" content="${safeTitle}" />

  <meta name="twitter:card" content="${cardType}" />
  <meta property="twitter:card" content="${cardType}" />
  <meta name="twitter:site" content="@LShorter" />
  <meta name="twitter:creator" content="@LShorter" />
  <meta name="twitter:domain" content="${domainName}" />
  <meta name="twitter:url" content="${safeCanonical}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeTwitterImg}" />
  <meta property="twitter:image" content="${safeTwitterImg}" />
  <meta name="twitter:image:src" content="${safeTwitterImg}" />
  <meta name="twitter:image:alt" content="${safeTitle}" />
  <meta name="twitter:image:width" content="${imgWidth}" />
  <meta name="twitter:image:height" content="${imgHeight}" />

  <style>
    :root {
      --bg: #09090b;
      --card-bg: #141416;
      --card-border: #27272a;
      --primary: #0066FF;
      --text: #f4f4f5;
      --text-muted: #a1a1aa;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
      min-height: 100vh;
    }
    .wrapper { max-width: 900px; margin: 0 auto; }
    .top-bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 18px 24px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      margin-bottom: 24px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      background: rgba(0, 102, 255, 0.15);
      color: #5294FF;
      border: 1px solid rgba(0, 102, 255, 0.3);
    }
    .badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #0066FF; }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12.5px;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      border: none;
      transition: all 0.15s ease;
    }
    .btn-primary { background: #0066FF; color: #fff; }
    .btn-secondary { background: #27272a; color: #e4e4e7; }
    .tabs-bar {
      display: flex;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 12px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--card-border);
    }
    .tab-btn {
      background: #18181b;
      border: 1px solid #27272a;
      color: var(--text-muted);
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
    }
    .tab-btn.active {
      background: rgba(0, 102, 255, 0.15);
      border-color: #0066FF;
      color: #fff;
    }
    .preview-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      border-radius: 16px;
      overflow: hidden;
      max-width: 560px;
      margin: 0 auto 24px;
    }
    .preview-img { width: 100%; aspect-ratio: 1200/630; object-fit: cover; display: block; }
    .preview-content { padding: 18px; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="top-bar">
      <div>
        <span class="badge"><span class="badge-dot"></span> Mode Dev Preview</span>
        <h1 style="font-size:16px;font-weight:700;margin-top:6px;">${safeTitle}</h1>
        <p style="font-size:12px;color:var(--text-muted);">${domainName}/${safeSlug}</p>
      </div>
      <div>
        <a href="/r/${safeSlug}" class="btn btn-primary">Tester la redirection 307</a>
      </div>
    </div>

    <div class="preview-card">
      <img src="${safeImg}" alt="${safeTitle}" class="preview-img" onerror="this.src='${fallbackGlass}'" />
      <div class="preview-content">
        <h2 style="font-size:16px;font-weight:600;margin-bottom:6px;">${safeTitle}</h2>
        <p style="font-size:13px;color:var(--text-muted);">${safeDesc}</p>
      </div>
    </div>
  </div>
</body>
</html>`;
}
