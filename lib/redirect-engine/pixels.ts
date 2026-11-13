import { LinkMetadata } from "./types";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { isSafeHttpUrl } from "@/lib/security-utils";

export type PixelPlatform = "meta" | "google" | "tiktok" | "linkedin";

export interface ActivePixel {
  id?: string;
  platform: PixelPlatform;
  pixelId: string;
  name?: string;
}

type RawPixelEntry = string | Record<string, unknown>;

const VALID_PIXEL_ID_REGEX = /^[A-Za-z0-9_-]{2,64}$/;

export function normalizePixelPlatform(raw: unknown): PixelPlatform | null {
  const val = String(raw || "").trim().toLowerCase();
  if (val === "meta" || val === "facebook" || val === "fb") return "meta";
  if (val === "google" || val === "google_tag" || val === "ga4" || val === "gtag") return "google";
  if (val === "tiktok" || val === "tt") return "tiktok";
  if (val === "linkedin" || val === "li") return "linkedin";
  return null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function safeJsonForInlineScript(value: unknown): string {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

function parsePixelArray(raw: unknown): RawPixelEntry[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as RawPixelEntry[];
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? (parsed as RawPixelEntry[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function fetchUserConfiguredPixels(userId: string): Promise<Record<string, unknown>[]> {
  if (!userId) return [];
  try {
    const url = new URL(`${WORKER_URL}/api/v1/pixels`);
    url.searchParams.set("userId", userId);
    const res = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return [];
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    const data = json?.data as Record<string, unknown> | unknown[] | undefined;
    if (Array.isArray(data)) {
      return data as Record<string, unknown>[];
    }
    if (data && typeof data === "object" && Array.isArray((data as Record<string, unknown>).pixels)) {
      return (data as Record<string, unknown>).pixels as Record<string, unknown>[];
    }
    return [];
  } catch {
    return [];
  }
}

/**
 * Resolves all active retargeting pixels attached to a link, supporting both
 * embedded pixel objects and pixel record IDs stored on the link owner account.
 */
export async function resolveLinkActivePixels(link: LinkMetadata): Promise<ActivePixel[]> {
  const rawEntries = parsePixelArray(link.pixels || link.pixel_ids || link.pixelIds);
  if (rawEntries.length === 0) return [];

  const needsOwnerLookup = rawEntries.some(
    (entry) =>
      typeof entry === "string" ||
      (!entry?.pixelId && !entry?.pixel_id)
  );

  const userId = String(link.userId || link.user_id || "");
  const ownerPixels = needsOwnerLookup && userId
    ? await fetchUserConfiguredPixels(userId)
    : [];

  const ownerById = new Map<string, Record<string, unknown>>();
  for (const px of ownerPixels) {
    if (!px || typeof px !== "object") continue;
    if (px.id) ownerById.set(String(px.id), px);
    if (px.pixelId || px.pixel_id) {
      ownerById.set(String(px.pixelId || px.pixel_id), px);
    }
  }

  const resolved: ActivePixel[] = [];
  const seenKeys = new Set<string>();

  for (const entry of rawEntries) {
    if (!entry) continue;

    let candidate: Record<string, unknown> | null = null;
    if (typeof entry === "string") {
      candidate = ownerById.get(entry.trim()) || null;
    } else if (typeof entry === "object") {
      const lookupKey = String(entry.id || entry.pixelId || entry.pixel_id || "").trim();
      const matched = lookupKey ? ownerById.get(lookupKey) : null;
      candidate = matched ? { ...matched, ...entry } : entry;
    }

    if (!candidate) continue;
    if (candidate.isActive === false || candidate.is_active === false || candidate.is_active === 0) {
      continue;
    }

    const platform = normalizePixelPlatform(candidate.platform || candidate.type);
    const pixelId = String(candidate.pixelId || candidate.pixel_id || "").trim();
    if (!platform || !VALID_PIXEL_ID_REGEX.test(pixelId)) continue;

    const dedupKey = `${platform}:${pixelId}`;
    if (seenKeys.has(dedupKey)) continue;
    seenKeys.add(dedupKey);

    resolved.push({
      id: candidate.id ? String(candidate.id) : undefined,
      platform,
      pixelId,
      name: candidate.name ? String(candidate.name) : undefined,
    });
  }

  return resolved;
}

function buildPixelTagSnippet(pixel: ActivePixel): { headScript: string; noscript: string } {
  const safeIdLiteral = safeJsonForInlineScript(pixel.pixelId);
  const safeIdAttr = encodeURIComponent(pixel.pixelId);

  switch (pixel.platform) {
    case "meta":
      return {
        headScript: `<script>
!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init', ${safeIdLiteral});
fbq('track', 'PageView');
</script>`,
        noscript: `<noscript><img height="1" width="1" style="display:none" alt="" src="https://www.facebook.com/tr?id=${safeIdAttr}&ev=PageView&noscript=1" /></noscript>`,
      };
    case "google":
      return {
        headScript: `<script async src="https://www.googletagmanager.com/gtag/js?id=${safeIdAttr}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', ${safeIdLiteral});
</script>`,
        noscript: "",
      };
    case "tiktok":
      return {
        headScript: `<script>
!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
ttq.methods=['page','track','identify','instances','debug','on','off','once','ready','alias','group','enableCookie','disableCookie'];
ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
ttq.load=function(e){var i='https://analytics.tiktok.com/i18n/pixel/events.js';
var s=d.createElement('script');s.async=!0;s.src=i+'?sdkid='+encodeURIComponent(e)+'&lib='+t;
var a=d.getElementsByTagName('script')[0];a.parentNode.insertBefore(s,a);};
ttq.load(${safeIdLiteral});ttq.page();}(window,document,'ttq');
</script>`,
        noscript: "",
      };
    case "linkedin":
      return {
        headScript: `<script>
window._linkedin_data_partner_ids = window._linkedin_data_partner_ids || [];
window._linkedin_data_partner_ids.push(${safeIdLiteral});
(function(l){if(!l){window.lintrk=function(a,b){window.lintrk.q.push([a,b])};window.lintrk.q=[]}
var s=document.getElementsByTagName('script')[0];var b=document.createElement('script');
b.type='text/javascript';b.async=!0;b.src='https://snap.licdn.com/li.lms-analytics/insight.min.js';
s.parentNode.insertBefore(b,s);})(window.lintrk);
</script>`,
        noscript: `<noscript><img height="1" width="1" style="display:none" alt="" src="https://px.ads.linkedin.com/collect/?pid=${safeIdAttr}&fmt=gif" /></noscript>`,
      };
  }
}

/**
 * Generates an interstitial redirect page that dispatches all configured
 * retargeting pixels cleanly before forwarding the visitor to the destination URL.
 */
export function renderPixelInterstitialHtml(
  finalUrl: string,
  pixels: ActivePixel[],
  options?: { title?: string; delayMs?: number }
): string {
  const safeTarget = isSafeHttpUrl(finalUrl) ? finalUrl : "https://lsho.cc";
  const escapedHref = escapeHtml(safeTarget);
  const inlineDest = safeJsonForInlineScript(safeTarget);
  const titleText = escapeHtml(options?.title || "Redirecting...");
  const delayMs = Math.max(250, Math.min(1200, options?.delayMs ?? 450));

  const snippets = pixels.map(buildPixelTagSnippet);
  const headScripts = snippets.map((s) => s.headScript).filter(Boolean).join("\n");
  const noscripts = snippets.map((s) => s.noscript).filter(Boolean).join("\n");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>${titleText}</title>
  <meta http-equiv="refresh" content="1;url=${escapedHref}" />
  ${headScripts}
  <style>
    body {
      margin: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #09090b;
      color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .box {
      text-align: center;
      padding: 24px;
      max-width: 360px;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 2.5px solid #27272a;
      border-top-color: #0066ff;
      border-radius: 9999px;
      margin: 0 auto 14px;
      animation: spin 0.7s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    a {
      color: #60a5fa;
      font-size: 13px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="box">
    <div class="spinner"></div>
    <p style="margin:0 0 8px;font-size:14px;color:#e4e4e7;">Redirection en cours...</p>
    <a href="${escapedHref}" rel="noopener noreferrer">Continuer vers la destination &rarr;</a>
  </div>
  ${noscripts}
  <script>
    (function() {
      var target = ${inlineDest};
      setTimeout(function() {
        window.location.replace(target);
      }, ${delayMs});
    })();
  </script>
</body>
</html>`;
}
