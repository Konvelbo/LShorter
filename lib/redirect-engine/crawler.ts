import { LinkMetadata } from "./types";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

export function getDicebearGlassUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed || "lshorter")}`;
}

const SOCIAL_CRAWLERS = [
  "twitterbot",
  "facebookexternalhit",
  "whatsapp",
  "telegrambot",
  "linkedinbot",
  "slackbot",
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
];

export function isSocialCrawler(userAgentRaw: string): boolean {
  const ua = (userAgentRaw || "").toLowerCase();
  if (!ua) return false;
  return SOCIAL_CRAWLERS.some((bot) => ua.includes(bot));
}

// In-memory cache for bot responses
const botResponseCache = new Map<string, { body: string; headers: HeadersInit; expiresAt: number }>();

export function getCachedBotResponse(slug: string): { body: string; headers: HeadersInit } | null {
  const key = (slug || "").toLowerCase();
  const cached = botResponseCache.get(key) || botResponseCache.get(slug);
  if (cached && Date.now() < cached.expiresAt) {
    return { body: cached.body, headers: cached.headers };
  }
  return null;
}

export function setCachedBotResponse(slug: string, body: string, headers: HeadersInit, ttlMs: number = 5000): void {
  const key = (slug || "").toLowerCase();
  botResponseCache.set(key, {
    body,
    headers,
    expiresAt: Date.now() + ttlMs,
  });
}

export function invalidateBotResponseCache(slug?: string): void {
  if (slug) {
    botResponseCache.delete(slug.toLowerCase());
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
  const safeTitle = escapeHtml(options.title || "LShorter");
  const safeDesc = escapeHtml(
    options.description || "Cliquez pour accéder à ce lien sécurisé par LShorter.",
  );
  const fallbackGlass = getDicebearGlassUrl(options.slug || "lshorter");
  const rawImg = options.image || fallbackGlass;
  const safeMetaImg = escapeHtml(rawImg);
  const safeImg = escapeHtml(rawImg);
  const safeDest = escapeHtml(options.destinationUrl || options.canonicalUrl);
  const safeCanonical = escapeHtml(options.canonicalUrl);
  const cardType = options.twitterCard === "summary" ? "summary" : "summary_large_image";
  const domainName = escapeHtml(options.domain || "lsho.cc");
  const safeSlug = escapeHtml(options.slug || "");

  const isSvg = rawImg.includes(".svg") || rawImg.includes("dicebear");
  const imgType = isSvg ? "image/svg+xml" : rawImg.includes(".png") ? "image/png" : "image/jpeg";
  const imgWidth = cardType === "summary" ? "600" : "1200";
  const imgHeight = cardType === "summary" ? "600" : "630";

  if (!options.isPreview) {
    return `<!DOCTYPE html>
<html lang="fr" prefix="og: https://ogp.me/ns#">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDesc}" />
  <meta name="theme-color" content="#0066FF" />

  <!-- Open Graph / WhatsApp / Facebook / LinkedIn / Telegram / Slack / Discord -->
  <meta property="og:site_name" content="LShorter" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${safeCanonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeMetaImg}" />
  <meta property="og:image:url" content="${safeMetaImg}" />
  <meta property="og:image:secure_url" content="${safeMetaImg}" />
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
  <meta name="twitter:image" content="${safeMetaImg}" />
  <meta property="twitter:image" content="${safeMetaImg}" />
  <meta name="twitter:image:src" content="${safeMetaImg}" />
  <meta name="twitter:image:alt" content="${safeTitle}" />
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

  <meta property="og:site_name" content="LShorter" />
  <meta property="og:type" content="website" />
  <meta property="og:url" content="${safeCanonical}" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDesc}" />
  <meta property="og:image" content="${safeMetaImg}" />
  <meta name="twitter:card" content="${cardType}" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDesc}" />
  <meta name="twitter:image" content="${safeMetaImg}" />

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
