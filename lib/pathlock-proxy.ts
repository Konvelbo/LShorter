import { isSafeHttpUrl } from "@/lib/security-utils";
import { fetchWorkerLink } from "@/lib/redirect-engine/worker-client";
import { parsePathLockRoutes } from "@/lib/pathlock-routes";

export interface PathLockProxyConfig {
  slug: string;
  targetUrl: string;
  pathLockMode: "off" | "strict" | "funnel" | string;
  pathLockPrefix: string;
  pathLockMessage: string;
  pathLockPassword: string;
}

export interface UpstreamRestrictionInfo {
  restricted: boolean;
  status: number;
  provider: string;
  reason: string;
  message: string;
}

/**
 * Strips leading `www.` and lowercases hostname for same-site subdomain checks.
 */
export function normalizeApexHost(hostname: string): string {
  return (hostname || "").trim().toLowerCase().replace(/^www\./, "");
}

/**
 * Validates that an upstream fetch target URL is HTTP(S) and free from SSRF vectors.
 * In non-production development, allows matching an explicitly configured local dev target.
 */
export function isSafeProxyTargetUrl(
  candidateUrl: string,
  configuredTargetUrl?: string,
): boolean {
  try {
    const parsed = new URL(candidateUrl);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    const host = parsed.hostname.toLowerCase().replace(/^\[|\]$/g, "");
    // Explicitly guard IPv6 link-local (fe80::/10 -> fe80..febf), ULA (fc00::/7), multicast & loopback
    if (
      /^fe[89ab][0-9a-f]*:/i.test(host) ||
      /^f[cd][0-9a-f]*:/i.test(host) ||
      /^ff[0-9a-f]*:/i.test(host) ||
      host.includes("::ffff:") ||
      host === "::" ||
      host === "::1"
    ) {
      if (process.env.NODE_ENV !== "development" || !configuredTargetUrl) {
        return false;
      }
      const cfgHost = new URL(configuredTargetUrl).hostname.toLowerCase();
      if (host !== cfgHost) return false;
    }

    if (isSafeHttpUrl(parsed.href)) {
      return true;
    }

    // Permit local test targets only in development and only when matching configured target host
    if (process.env.NODE_ENV === "development" && configuredTargetUrl) {
      const cfg = new URL(configuredTargetUrl);
      if (
        normalizeApexHost(host) === normalizeApexHost(cfg.hostname) &&
        (parsed.port || "") === (cfg.port || "")
      ) {
        return true;
      }
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Checks whether `candidateUrl` belongs to the same site (apex, www sibling, or subdomain)
 * as any of the allowed reference hostnames.
 */
export function isSameSiteOrAllowedHost(
  candidateUrl: string,
  allowedHosts: string[],
): boolean {
  try {
    const u = new URL(candidateUrl);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const candHost = u.hostname.toLowerCase();
    const candApex = normalizeApexHost(candHost);
    if (!candApex) return false;

    return allowedHosts.some((raw) => {
      const baseApex = normalizeApexHost(raw);
      if (!baseApex) return false;
      return (
        candHost === raw.toLowerCase() ||
        candApex === baseApex ||
        candHost.endsWith(`.${baseApex}`)
      );
    });
  } catch {
    return false;
  }
}

/**
 * Performs an HTTP fetch with manual redirect hopping, verifying every redirect
 * target against SSRF and (optionally) same-site host allowlists before connecting.
 */
export async function safeUpstreamFetch(
  initialUrl: string,
  init: RequestInit,
  configuredTargetUrl: string,
  allowedHosts: string[] | null,
  maxRedirects: number = 5,
): Promise<{ response: Response; finalUrl: string }> {
  let currentUrl = initialUrl;
  let method = (init.method || "GET").toUpperCase();
  let body = init.body;

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!isSafeProxyTargetUrl(currentUrl, configuredTargetUrl)) {
      throw new Error("SSRF_BLOCKED");
    }
    if (allowedHosts && !isSameSiteOrAllowedHost(currentUrl, allowedHosts)) {
      throw new Error("HOST_FORBIDDEN");
    }

    const res = await fetch(currentUrl, {
      ...init,
      method,
      body: method === "GET" || method === "HEAD" ? undefined : body,
      redirect: "manual",
    });

    if (res.status >= 300 && res.status < 400) {
      const loc = res.headers.get("location");
      if (!loc) {
        return { response: res, finalUrl: currentUrl };
      }
      try { await res.body?.cancel(); } catch {}
      const nextUrl = new URL(loc, currentUrl).href;
      // Follow standard HTTP redirect semantics (301/302/303 downgrade POST -> GET without resending body)
      if (res.status === 301 || res.status === 302 || res.status === 303) {
        if (method === "POST") {
          method = "GET";
          body = undefined;
        }
      }
      currentUrl = nextUrl;
      continue;
    }

    return { response: res, finalUrl: currentUrl };
  }

  throw new Error("TOO_MANY_REDIRECTS");
}

const effectiveHostCache = new Map<string, { hosts: string[]; expiresAt: number }>();

/**
 * Registers additional allowed hosts discovered after following an upstream redirect for a slug.
 */
export function rememberAllowedHostsForSlug(slug: string, hosts: string[]): void {
  const key = (slug || "").toLowerCase();
  const prev = effectiveHostCache.get(key)?.hosts || [];
  const merged = Array.from(new Set([...prev, ...hosts.map((h) => h.toLowerCase()).filter(Boolean)]));
  if (effectiveHostCache.size > 500) {
    const first = effectiveHostCache.keys().next().value;
    if (first !== undefined) effectiveHostCache.delete(first);
  }
  effectiveHostCache.set(key, { hosts: merged, expiresAt: Date.now() + 10 * 60 * 1000 });
}

/**
 * Resolves allowed asset hosts for a slug, falling back to checking the configured target's redirect host.
 */
export async function getAllowedHostsForConfig(
  slug: string,
  configuredTargetUrl: string,
): Promise<string[]> {
  const baseHost = new URL(configuredTargetUrl).hostname.toLowerCase();
  const cached = effectiveHostCache.get((slug || "").toLowerCase());
  if (cached && Date.now() < cached.expiresAt) {
    return Array.from(new Set([baseHost, ...cached.hosts]));
  }
  return [baseHost];
}

/**
 * Loads normalized PathLock proxy configuration for a slug from Worker storage.
 */
export async function resolvePathLockLinkConfig(
  slug: string,
): Promise<PathLockProxyConfig | null> {
  const found = await fetchWorkerLink(slug);
  if (!found) return null;

  const rawTarget = found.target_url || found.targetUrl || "";
  if (!rawTarget) return null;

  const targetUrl =
    rawTarget.startsWith("http://") || rawTarget.startsWith("https://")
      ? rawTarget
      : `https://${rawTarget}`;

  return {
    slug: found.slug || slug,
    targetUrl,
    pathLockMode: found.path_lock_mode || found.pathLockMode || "off",
    pathLockPrefix: found.path_lock_prefix || found.pathLockPrefix || "",
    pathLockMessage: found.path_lock_message || found.pathLockMessage || "",
    pathLockPassword: found.path_lock_password || found.pathLockPassword || "",
  };
}

function decodeHtmlUrlEntities(raw: string): string {
  return raw
    .replace(/&amp;/gi, "&")
    .replace(/&#x26;/gi, "&")
    .replace(/&#38;/gi, "&");
}

/**
 * Converts a relative or same-site URL into a same-origin `/r/<slug>/proxy/__p/...` asset URL
 * so fonts, ES modules, stylesheets, SVGs, images, and same-site fetch requests never fail CORS.
 */
export function toProxyAssetUrl(
  rawUrl: string,
  baseUrl: string,
  slug: string,
  allowedHosts: string[],
): string {
  if (!rawUrl || typeof rawUrl !== "string") return rawUrl;
  const trimmed = decodeHtmlUrlEntities(rawUrl.trim());
  if (
    !trimmed ||
    trimmed.startsWith("#") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("mailto:") ||
    trimmed.startsWith("tel:") ||
    trimmed.startsWith(`/r/${encodeURIComponent(slug)}/proxy`) ||
    trimmed.startsWith(`/r/${slug}/proxy`)
  ) {
    return rawUrl;
  }

  try {
    const resolved = new URL(trimmed, baseUrl);
    if (!isSameSiteOrAllowedHost(resolved.href, allowedHosts)) {
      return rawUrl;
    }
    const scheme = resolved.protocol.replace(":", "");
    const encodedHost = encodeURIComponent(resolved.host);
    return `/r/${encodeURIComponent(slug)}/proxy/__p/${scheme}/${encodedHost}${resolved.pathname}${resolved.search}${resolved.hash}`;
  } catch {
    return rawUrl;
  }
}

function rewriteSrcsetValue(
  srcset: string,
  baseUrl: string,
  slug: string,
  allowedHosts: string[],
): string {
  // Split only on comma followed by whitespace before the next candidate URL
  // so CDN paths with inline options (e.g. /cdn-cgi/image/w=800,q=80/...) stay intact.
  return srcset
    .split(/,\s+(?=\S)/)
    .map((entry) => {
      const trimmed = entry.trim();
      if (!trimmed) return entry;
      const spaceIdx = trimmed.search(/\s/);
      if (spaceIdx === -1) {
        return toProxyAssetUrl(trimmed, baseUrl, slug, allowedHosts);
      }
      const urlPart = trimmed.slice(0, spaceIdx);
      const descPart = trimmed.slice(spaceIdx);
      return `${toProxyAssetUrl(urlPart, baseUrl, slug, allowedHosts)}${descPart}`;
    })
    .join(", ");
}

/**
 * Rewrites CSS `url(...)` and `@import` references so relative webfonts & assets resolve same-origin.
 */
export function rewriteCssForPathLock(
  cssText: string,
  cssUrl: string,
  slug: string,
  allowedHosts: string[],
): string {
  let out = cssText.replace(
    /url\(\s*(['"]?)([^)'"\s]+)\1\s*\)/gi,
    (_m, quote, inner) => {
      const proxied = toProxyAssetUrl(inner, cssUrl, slug, allowedHosts);
      return `url(${quote}${proxied}${quote})`;
    },
  );
  out = out.replace(
    /@import\s+(?!url\()(['"])([^'"]+)\1/gi,
    (_m, quote, inner) => {
      const proxied = toProxyAssetUrl(inner, cssUrl, slug, allowedHosts);
      return `@import ${quote}${proxied}${quote}`;
    },
  );
  return out;
}

/**
 * Cleans restrictive framing/RocketLoader directives and rewrites same-site static subresources
 * to go through `/r/<slug>/proxy/__p/...` (never altering navigation `<a href>` targets).
 */
export function rewriteHtmlForPathLock(
  html: string,
  effectiveUrl: string,
  slug: string,
  allowedHosts: string[],
): string {
  let out = html
    .replace(/<base\b[^>]*>/gi, "")
    .replace(
      /<meta[^>]+http-equiv\s*=\s*["']?\s*(?:Content-Security-Policy|X-Frame-Options)\s*["']?[^>]*>/gi,
      "",
    )
    .replace(/type="[a-f0-9]+-text\/javascript"/gi, 'type="text/javascript"')
    .replace(/<script[^>]*rocket-loader\.min\.js[^>]*><\/script>/gi, "");

  // Resource tags: <script>, <img>, <source>, <video>, <audio>, <track>
  out = out.replace(
    /<(script|img|source|video|audio|track)\b([^>]*?)>/gi,
    (_m, tag, attrs) => {
      let nextAttrs = attrs.replace(
        /\b(src|poster|data-src|data-poster)=(["'])([^"']+)\2/gi,
        (_am: string, attr: string, q: string, url: string) =>
          `${attr}=${q}${toProxyAssetUrl(url, effectiveUrl, slug, allowedHosts)}${q}`,
      );
      nextAttrs = nextAttrs.replace(
        /\bsrcset=(["'])([^"']+)\1/gi,
        (_am: string, q: string, val: string) =>
          `srcset=${q}${rewriteSrcsetValue(val, effectiveUrl, slug, allowedHosts)}${q}`,
      );
      return `<${tag}${nextAttrs}>`;
    },
  );

  // <link>: stylesheets, preloads, fonts, icons, manifests (skip canonical/alternate/preconnect)
  out = out.replace(/<link\b([^>]*?)>/gi, (full, attrs) => {
    const relMatch = attrs.match(/\brel=(["'])([^"']+)\1/i);
    const rel = relMatch ? relMatch[2].toLowerCase() : "";
    if (
      rel === "canonical" ||
      rel === "alternate" ||
      rel === "preconnect" ||
      rel === "dns-prefetch"
    ) {
      return full;
    }
    let nextAttrs = attrs.replace(
      /\bhref=(["'])([^"']+)\1/gi,
      (_hm: string, q: string, url: string) =>
        `href=${q}${toProxyAssetUrl(url, effectiveUrl, slug, allowedHosts)}${q}`,
    );
    nextAttrs = nextAttrs.replace(
      /\bimagesrcset=(["'])([^"']+)\1/gi,
      (_sm: string, q: string, val: string) =>
        `imagesrcset=${q}${rewriteSrcsetValue(val, effectiveUrl, slug, allowedHosts)}${q}`,
    );
    return `<link${nextAttrs}>`;
  });

  // SVG <use href="/icons.svg#..."> and <image href="...">
  out = out.replace(/<(use|image)\b([^>]*?)>/gi, (_m, tag, attrs) => {
    const nextAttrs = attrs.replace(
      /\b(href|xlink:href)=(["'])([^"']+)\2/gi,
      (_am: string, attr: string, q: string, url: string) =>
        `${attr}=${q}${toProxyAssetUrl(url, effectiveUrl, slug, allowedHosts)}${q}`,
    );
    return `<${tag}${nextAttrs}>`;
  });

  // Astro islands (`component-url` / `renderer-url`)
  out = out.replace(/<astro-island\b([^>]*?)>/gi, (_m, attrs) => {
    const nextAttrs = attrs.replace(
      /\b(component-url|renderer-url)=(["'])([^"']+)\2/gi,
      (_am: string, attr: string, q: string, url: string) =>
        `${attr}=${q}${toProxyAssetUrl(url, effectiveUrl, slug, allowedHosts)}${q}`,
    );
    return `<astro-island${nextAttrs}>`;
  });

  // Inline <style> blocks
  out = out.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_m, open, css, close) =>
      open + rewriteCssForPathLock(css, effectiveUrl, slug, allowedHosts) + close,
  );

  return out;
}

/**
 * Parses `/r/[slug]/proxy/__p/<scheme>/<encodedHost>/...` back into an upstream URL.
 */
export function parseProxyAssetSegments(
  segments: string[],
  rawSearch: string,
): { url: string; host: string } | null {
  if (!Array.isArray(segments) || segments.length < 3 || segments[0] !== "__p") {
    return null;
  }
  const scheme = (segments[1] || "").toLowerCase();
  if (scheme !== "http" && scheme !== "https") {
    return null;
  }
  let host = "";
  try {
    host = decodeURIComponent(segments[2] || "").trim();
  } catch {
    return null;
  }
  if (!host || /[\s/@\\]/.test(host)) {
    return null;
  }
  const pathRest = segments.slice(3).join("/");
  const cleanSearch = rawSearch ? (rawSearch.startsWith("?") ? rawSearch : `?${rawSearch}`) : "";
  const rebuilt = `${scheme}://${host}/${pathRest}${cleanSearch}`;
  try {
    const parsed = new URL(rebuilt);
    return { url: parsed.href, host: parsed.host };
  } catch {
    return null;
  }
}

/**
 * Detects whether an upstream response is a WAF / Bot / Turnstile restriction page
 * rather than usable destination content. Does NOT attempt to evade anti-bot controls.
 */
export function detectUpstreamRestriction(
  status: number,
  headers: Headers,
  htmlBody: string,
): UpstreamRestrictionInfo {
  const cfMitigated = (headers.get("cf-mitigated") || "").toLowerCase();
  const sample = (htmlBody || "").slice(0, 12000);
  const titleMatch = sample.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const pageTitle = titleMatch ? titleMatch[1].trim() : "";

  const isCfChallenge =
    cfMitigated.includes("challenge") ||
    /Just a moment\.\.\./i.test(pageTitle) ||
    /Attention Required!\s*\|\s*Cloudflare/i.test(pageTitle) ||
    /id=["']cf-challenge-running["']/i.test(sample) ||
    /class=["'][^"']*cf-error-details/i.test(sample) ||
    /Sorry, you have been blocked/i.test(sample);

  if (isCfChallenge) {
    return {
      restricted: true,
      status: status || 403,
      provider: "Cloudflare WAF / Bot Protection",
      reason: "waf_protection",
      message:
        "Le site de destination applique une protection Cloudflare WAF / anti-bot qui refuse l'affichage via un proxy iframe.",
    };
  }

  const isHttpBlocked =
    (status === 403 || status === 429 || status === 503) &&
    (/Access Denied|Request blocked|Bot Protection|px-captcha|g-recaptcha|hcaptcha/i.test(
      sample,
    ) ||
      sample.length < 4000);

  if (isHttpBlocked) {
    return {
      restricted: true,
      status,
      provider: headers.get("server") || "Pare-feu / WAF distant",
      reason: "upstream_http_blocked",
      message: `Le serveur distant a refusé la requête proxy (HTTP ${status}).`,
    };
  }

  return {
    restricted: false,
    status,
    provider: "",
    reason: "",
    message: "",
  };
}

/**
 * Escapes HTML entities safely when rendering error/fallback templates.
 */
function escapeHtmlText(str: string): string {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Returns clean diagnostic HTML inside the iframe and notifies the parent CloakedViewer
 * so users see an informative notice instead of a broken WAF page or blank screen.
 */
export function buildRestrictedFallbackHtml(
  info: UpstreamRestrictionInfo,
  targetUrl: string,
): string {
  let validatedTarget = "#";
  try {
    const parsed = new URL(targetUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      validatedTarget = parsed.href;
    }
  } catch {}
  const safeTarget = escapeHtmlText(validatedTarget);
  const safeMsg = escapeHtmlText(info.message);
  const safeProvider = escapeHtmlText(info.provider);
  const payload = JSON.stringify({
    type: "PATHLOCK_UPSTREAM_RESTRICTED",
    targetUrl: validatedTarget,
    status: info.status,
    provider: info.provider,
    reason: info.reason,
    message: info.message,
  }).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Contenu restreint par le site de destination</title>
  <script>
    try {
      window.parent.postMessage(${payload}, "*");
    } catch (e) {}
  </script>
</head>
<body style="margin:0;min-height:100vh;background:#09090b;color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;">
  <div style="max-width:460px;width:100%;background:#111114;border:1px solid #27272a;border-radius:14px;padding:28px;text-align:center;box-shadow:0 20px 50px rgba(0,0,0,.55);">
    <div style="display:inline-flex;padding:6px 12px;border-radius:999px;background:rgba(245,158,11,.12);border:1px solid rgba(245,158,11,.35);color:#fbbf24;font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin-bottom:16px;">
      ${safeProvider} (HTTP ${info.status})
    </div>
    <h1 style="margin:0 0 10px;font-size:19px;font-weight:700;color:#fff;">Protection anti-proxy détectée</h1>
    <p style="margin:0 0 18px;font-size:13.5px;line-height:1.55;color:#a1a1aa;">${safeMsg}</p>
    <a href="${safeTarget}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:10px 18px;border-radius:8px;background:#ffffff;color:#09090b;font-size:13px;font-weight:600;text-decoration:none;">
      Ouvrir le lien directement
    </a>
  </div>
</body>
</html>`;
}

export interface HeadInjectionOptions {
  slug: string;
  targetUrl: string;
  effectiveUrl: string;
  parsedBaseOrigin: string;
  parsedBasePathname: string;
  effectiveOrigin: string;
  effectivePathname: string;
  mode: string;
  prefix: string;
  initialUnlocked: boolean;
}

/**
 * Generates the synchronous PathLock runtime script + importmap injected at the top of `<head>`.
 */
export function buildPathLockHeadInjection(opts: HeadInjectionOptions): string {
  const effU = new URL(opts.effectiveUrl);
  const proxyPrefix = `/r/${encodeURIComponent(opts.slug)}/proxy`;
  const proxyAssetBase = `${proxyPrefix}/__p`;
  const effScheme = effU.protocol.replace(":", "");
  const effHostEnc = encodeURIComponent(effU.host);
  const effVirtualPath = effU.pathname + effU.search + effU.hash;
  const parsedRoutes = parsePathLockRoutes(opts.prefix);

  const clientConfig = {
    slug: opts.slug,
    targetUrl: opts.targetUrl,
    effectiveUrl: opts.effectiveUrl,
    parsedBaseOrigin: opts.parsedBaseOrigin,
    parsedBasePathname: opts.parsedBasePathname || "/",
    effectiveOrigin: opts.effectiveOrigin,
    effectivePathname: opts.effectivePathname || "/",
    effectiveVirtualPath: effVirtualPath || "/",
    proxyPrefix,
    proxyAssetBase,
    mode: String(opts.mode || "strict").trim().toLowerCase(),
    prefix: opts.prefix || "",
    routes: parsedRoutes.routes,
    allowAllSubpaths: parsedRoutes.allowAllSubpaths,
    hasExplicitRoot: parsedRoutes.hasExplicitRoot,
    initialUnlocked: opts.initialUnlocked,
  };

  // JSON-safe embed (escape `<` so `</script>` can never break out of inline script)
  const serializedCfg = JSON.stringify(clientConfig).replace(/</g, "\\u003c");
  const importMapJson = JSON.stringify({
    imports: {
      "/": `${proxyAssetBase}/${effScheme}/${effHostEnc}/`,
    },
  }).replace(/</g, "\\u003c");

  return `
<script type="importmap">${importMapJson}</script>
<script>
(function() {
  var CFG = ${serializedCfg};
  var isUnlocked = Boolean(CFG.initialUnlocked);
  var isSyncingVirtualUrl = false;
  var isHistoryApiCall = false;
  window.__PATHLOCK_EFFECTIVE_PATH__ = CFG.effectivePathname || "/";
  window.__PATHLOCK_BASE_PATH__ = CFG.parsedBasePathname || "/";
  var origPushState = window.history.pushState;
  var origReplaceState = window.history.replaceState;

  try {
    if (window.sessionStorage && window.sessionStorage.getItem("pathlock_unlocked_" + CFG.slug) === "true") {
      isUnlocked = true;
    }
  } catch (e) {}

  // Align iframe virtual pathname BEFORE hydration so Next.js/React/Astro/Vue match SSR HTML!
  try {
    isSyncingVirtualUrl = true;
    isHistoryApiCall = true;
    origReplaceState.call(window.history, window.history.state, "", CFG.effectiveVirtualPath);
  } catch (e) {
  } finally {
    isSyncingVirtualUrl = false;
    isHistoryApiCall = false;
  }

  window.addEventListener("message", function(e) {
    if (!e || !e.data) return;
    if (e.data.type === "PATHLOCK_UNLOCK") {
      isUnlocked = true;
    } else if (e.data.type === "PATHLOCK_LOCK") {
      isUnlocked = false;
    }
  });

  function normHost(h) {
    return String(h || "").toLowerCase().replace(/^www\\./, "");
  }

  function normPath(p) {
    var s = String(p || "/").trim();
    if (!s) return "";
    if (/^(https?:)?\\/\\//i.test(s)) {
      try {
        s = new URL(s.indexOf("//") === 0 ? "https:" + s : s).pathname || "/";
      } catch (e) {
        s = s.replace(/^(https?:)?\\/\\/[^/?#]+/i, "") || "/";
      }
    }
    s = (s.split(/[?#]/)[0] || "").replace(/\\/{2,}/g, "/");
    return s.replace(/^\\/+/, "").replace(/\\/+$/, "").toLowerCase();
  }

  var allowedApexA = normHost((function(){ try { return new URL(CFG.parsedBaseOrigin).hostname; } catch(e) { return ""; } })());
  var allowedApexB = normHost((function(){ try { return new URL(CFG.effectiveOrigin).hostname; } catch(e) { return ""; } })());

  function isHostAllowed(hostname) {
    var h = normHost(hostname);
    return h === allowedApexA || h === allowedApexB;
  }

  function isAssetSubdomainOrSame(hostname) {
    var h = normHost(hostname);
    return (
      h === allowedApexA ||
      h === allowedApexB ||
      h.endsWith("." + allowedApexA) ||
      h.endsWith("." + allowedApexB)
    );
  }

  function toProxyAsset(rawUrl) {
    if (!rawUrl) return rawUrl;
    var s = String(rawUrl).trim();
    if (
      !s ||
      s.indexOf("data:") === 0 ||
      s.indexOf("blob:") === 0 ||
      s.indexOf("javascript:") === 0 ||
      s.indexOf("mailto:") === 0 ||
      s.indexOf("tel:") === 0 ||
      s.indexOf(CFG.proxyPrefix) === 0
    ) {
      return rawUrl;
    }
    try {
      var u = new URL(s, CFG.effectiveUrl);
      if (u.origin.toLowerCase() === window.location.origin.toLowerCase()) {
        if (u.pathname.indexOf(CFG.proxyPrefix) === 0) return rawUrl;
        u = new URL(u.pathname + u.search + u.hash, CFG.effectiveOrigin);
      }
      if (isAssetSubdomainOrSame(u.hostname)) {
        return (
          CFG.proxyAssetBase +
          "/" +
          u.protocol.replace(":", "") +
          "/" +
          encodeURIComponent(u.host) +
          u.pathname +
          u.search +
          u.hash
        );
      }
    } catch (e) {}
    return rawUrl;
  }

  // Transparently route dynamic scripts, styles, fetch, XHR & sendBeacon via same-origin proxy
  try {
    var origSetAttr = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function(name, val) {
      var lowerName = String(name || "").toLowerCase();
      var tag = this.tagName;
      if (
        (lowerName === "src" || lowerName === "poster") &&
        (tag === "SCRIPT" || tag === "IMG" || tag === "SOURCE" || tag === "VIDEO" || tag === "AUDIO")
      ) {
        val = toProxyAsset(val);
      } else if (lowerName === "href" && (tag === "LINK" || tag === "USE" || tag === "IMAGE")) {
        var rel = String(this.getAttribute("rel") || "").toLowerCase();
        if (rel !== "canonical" && rel !== "alternate" && rel !== "preconnect" && rel !== "dns-prefetch") {
          val = toProxyAsset(val);
        }
      }
      return origSetAttr.call(this, name, val);
    };

    var scriptDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src");
    if (scriptDesc && scriptDesc.set) {
      Object.defineProperty(HTMLScriptElement.prototype, "src", {
        get: scriptDesc.get,
        set: function(v) { return scriptDesc.set.call(this, toProxyAsset(v)); },
        configurable: true,
      });
    }

    var linkDesc = Object.getOwnPropertyDescriptor(HTMLLinkElement.prototype, "href");
    if (linkDesc && linkDesc.set) {
      Object.defineProperty(HTMLLinkElement.prototype, "href", {
        get: linkDesc.get,
        set: function(v) {
          var rel = String(this.rel || "").toLowerCase();
          if (rel === "canonical" || rel === "alternate" || rel === "preconnect" || rel === "dns-prefetch") {
            return linkDesc.set.call(this, v);
          }
          return linkDesc.set.call(this, toProxyAsset(v));
        },
        configurable: true,
      });
    }

    [HTMLImageElement.prototype, HTMLSourceElement.prototype].forEach(function(proto) {
      var d = proto && Object.getOwnPropertyDescriptor(proto, "src");
      if (d && d.set) {
        Object.defineProperty(proto, "src", {
          get: d.get,
          set: function(v) { return d.set.call(this, toProxyAsset(v)); },
          configurable: true,
        });
      }
    });

    var videoPosterDesc = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, "poster");
    if (videoPosterDesc && videoPosterDesc.set) {
      Object.defineProperty(HTMLVideoElement.prototype, "poster", {
        get: videoPosterDesc.get,
        set: function(v) { return videoPosterDesc.set.call(this, toProxyAsset(v)); },
        configurable: true,
      });
    }
  } catch (e) {}

  if (window.fetch) {
    var origFetch = window.fetch;
    window.fetch = function(input, init) {
      try {
        if (typeof input === "string") {
          input = toProxyAsset(input);
        } else if (typeof Request !== "undefined" && input instanceof Request) {
          var mapped = toProxyAsset(input.url);
          if (mapped !== input.url) {
            input = new Request(mapped, input);
          }
        }
      } catch (e) {}
      return origFetch.call(this, input, init);
    };
  }

  if (window.XMLHttpRequest) {
    var origXhrOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url) {
      var args = Array.prototype.slice.call(arguments);
      try {
        args[1] = toProxyAsset(url);
      } catch (e) {}
      return origXhrOpen.apply(this, args);
    };
  }

  if (window.navigator && window.navigator.sendBeacon) {
    var origBeacon = window.navigator.sendBeacon.bind(window.navigator);
    window.navigator.sendBeacon = function(url, data) {
      return origBeacon(toProxyAsset(url), data);
    };
  }

  var baseNormA = normPath(CFG.parsedBasePathname);
  var baseNormB = normPath(CFG.effectivePathname);
  var allowedRoutes = Array.isArray(CFG.routes) ? CFG.routes : [];
  var allowAllSubpaths = Boolean(CFG.allowAllSubpaths);
  var hasExplicitRoot = Boolean(CFG.hasExplicitRoot);

  function resolveCandidateUrl(str) {
    if (str.charAt(0) === "/" && str.charAt(1) !== "/") {
      // Root-relative paths belong to target site unless pointing to our proxy route
      if (str.indexOf(CFG.proxyPrefix) === 0 || str.indexOf("/r/" + CFG.slug + "/view") === 0) {
        return new URL(str, window.location.origin);
      }
      return new URL(str, CFG.effectiveOrigin);
    }
    var u = new URL(str, CFG.effectiveUrl);
    if (u.origin.toLowerCase() === window.location.origin.toLowerCase() && u.pathname.indexOf("/r/" + CFG.slug + "/") !== 0) {
      return new URL(u.pathname + u.search + u.hash, CFG.effectiveOrigin);
    }
    return u;
  }

  function updateEffectiveState(nextUrlStr) {
    try {
      var nu = resolveCandidateUrl(nextUrlStr);
      if (isHostAllowed(nu.hostname)) {
        CFG.effectiveUrl = nu.href;
        CFG.effectiveOrigin = nu.origin;
        CFG.effectivePathname = nu.pathname || "/";
        baseNormB = normPath(CFG.effectivePathname);
        window.__PATHLOCK_EFFECTIVE_PATH__ = CFG.effectivePathname;
      }
    } catch (e) {}
  }

  function toSameOriginHistoryArg(check, fallbackUrl) {
    if (!check || !check.url || check.isProxySelf) return fallbackUrl;
    try {
      var parsed = new URL(check.url);
      return parsed.pathname + parsed.search + parsed.hash;
    } catch (e) {
      return fallbackUrl;
    }
  }

  function checkUrlAllowed(rawUrl) {
    if (!rawUrl) return { allowed: true, isHashOnly: false };
    var str = String(rawUrl).trim();
    if (!str || str === "about:blank") return { allowed: true, isHashOnly: false, isBlank: str === "about:blank" };
    if (str.indexOf("javascript:") === 0 || str.indexOf("mailto:") === 0 || str.indexOf("tel:") === 0) {
      return { allowed: true, isHashOnly: false };
    }
    if (str.charAt(0) === "#") {
      return { allowed: true, isHashOnly: true, hash: str, url: CFG.effectiveUrl.split("#")[0] + str };
    }

    try {
      var u = resolveCandidateUrl(str);
      var sameSite = isHostAllowed(u.hostname);
      if (isUnlocked || CFG.mode === "off") {
        return {
          allowed: true,
          isHashOnly: false,
          url: sameSite ? u.href : undefined,
          isSameSite: sameSite,
        };
      }
      if (
        u.origin.toLowerCase() === window.location.origin.toLowerCase() &&
        (u.pathname.indexOf(CFG.proxyPrefix) === 0 || u.pathname.indexOf("/r/" + CFG.slug + "/view") === 0)
      ) {
        return { allowed: true, isHashOnly: Boolean(u.hash), hash: u.hash, url: u.href, isProxySelf: true, isSameSite: true };
      }

      if (!sameSite) {
        return { allowed: false, url: u.href, isSameSite: false };
      }

      var attemptNorm = normPath(u.pathname);
      var curEffUrl = null;
      try { curEffUrl = new URL(CFG.effectiveUrl); } catch (e) {}
      var curEffPath = normPath(CFG.effectivePathname);
      var curEffSearch = curEffUrl ? curEffUrl.search : "";
      var isSameDocHashOnly = Boolean(u.hash) && attemptNorm === curEffPath && u.search === curEffSearch;

      if (CFG.mode === "strict") {
        var strictAllowed =
          attemptNorm === baseNormA ||
          attemptNorm === baseNormB ||
          (hasExplicitRoot && attemptNorm === "") ||
          allowedRoutes.indexOf(attemptNorm) !== -1;
        return { allowed: strictAllowed, isHashOnly: strictAllowed && isSameDocHashOnly, hash: u.hash, url: u.href };
      }

      if (CFG.mode === "funnel") {
        var isRootOrTarget =
          allowAllSubpaths ||
          attemptNorm === "" ||
          attemptNorm === baseNormA ||
          attemptNorm === baseNormB;
        var isAllowedPrefix = allowedRoutes.some(function(p) {
          return attemptNorm === p || attemptNorm.indexOf(p + "/") === 0;
        });
        var isHexPalette = /^[0-9a-f]{6}(-[0-9a-f]{6})+$/i.test(attemptNorm);
        var isCoolorsGenerator = isHexPalette && allowedRoutes.some(function(p) {
          return p === "generate" || p.indexOf("generate") === 0;
        });
        var funnelAllowed = isRootOrTarget || isAllowedPrefix || isCoolorsGenerator;
        return {
          allowed: funnelAllowed,
          isHashOnly: funnelAllowed && isSameDocHashOnly,
          hash: u.hash,
          url: u.href,
        };
      }
    } catch (err) {
      return { allowed: false, url: str };
    }
    return { allowed: true, isHashOnly: false };
  }

  function scrollToHash(hash) {
    if (!hash || hash === "#") {
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (e) {}
      return;
    }
    try {
      var id = decodeURIComponent(hash.replace(/^#/, ""));
      var el = document.getElementById(id) || document.querySelector("[name='" + id.replace(/'/g, "") + "']");
      if (el && el.scrollIntoView) el.scrollIntoView({ behavior: "smooth" });
    } catch (e) {}
  }

  function notifyBlocked(blockedUrl) {
    try {
      window.parent.postMessage(
        {
          type: "PATHLOCK_NAVIGATE",
          url: blockedUrl || "/blocked",
          blocked: true
        },
        "*"
      );
    } catch (e) {}
  }

  function notifyAllowedNavigate(nextPathname) {
    try {
      window.parent.postMessage(
        {
          type: "PATHLOCK_NAVIGATE",
          url: nextPathname || "/",
          effectivePath: CFG.effectivePathname || "/",
          blocked: false
        },
        "*"
      );
    } catch (e) {}
  }

  // 1. Intercept history.pushState & history.replaceState
  window.history.pushState = function(state, title, url) {
    var hasUrlArg = arguments.length >= 3 && url !== undefined && url !== null;
    var nextUrlArg = url;
    if (!isSyncingVirtualUrl && hasUrlArg) {
      var check = checkUrlAllowed(url);
      if (!check.allowed) {
        notifyBlocked(check.url || String(url));
        return;
      }
      if (check.url && !check.isProxySelf) {
        updateEffectiveState(check.url);
        notifyAllowedNavigate(CFG.effectivePathname);
      }
      if (check.isHashOnly && check.hash) {
        try {
          isHistoryApiCall = true;
          return origPushState.call(window.history, state, title, window.location.pathname + window.location.search + check.hash);
        } catch (e) {
          return;
        } finally {
          isHistoryApiCall = false;
        }
      }
      nextUrlArg = toSameOriginHistoryArg(check, url);
    }
    try {
      isHistoryApiCall = true;
      if (hasUrlArg) {
        return origPushState.call(window.history, state, title, nextUrlArg);
      }
      return origPushState.apply(window.history, arguments);
    } finally {
      isHistoryApiCall = false;
    }
  };

  window.history.replaceState = function(state, title, url) {
    var hasUrlArg = arguments.length >= 3 && url !== undefined && url !== null;
    var nextUrlArg = url;
    if (!isSyncingVirtualUrl && hasUrlArg) {
      var check = checkUrlAllowed(url);
      if (!check.allowed) {
        // Keep virtual URL stable if third-party script attempts non-authorized replaceState
        return;
      }
      if (check.url && !check.isProxySelf) {
        updateEffectiveState(check.url);
        notifyAllowedNavigate(CFG.effectivePathname);
      }
      if (check.isHashOnly && check.hash) {
        try {
          isHistoryApiCall = true;
          return origReplaceState.call(window.history, state, title, window.location.pathname + window.location.search + check.hash);
        } catch (e) {
          return;
        } finally {
          isHistoryApiCall = false;
        }
      }
      nextUrlArg = toSameOriginHistoryArg(check, url);
    }
    try {
      isHistoryApiCall = true;
      if (hasUrlArg) {
        return origReplaceState.call(window.history, state, title, nextUrlArg);
      }
      return origReplaceState.apply(window.history, arguments);
    } finally {
      isHistoryApiCall = false;
    }
  };

  // 2. Intercept Navigation API (Chromium 102+: prevents about:blank escapes & programmatic location.href escapes;
  //    Firefox/Safari fall back to click/submit/history/window.open hooks + parent CloakedViewer onLoad guard)
  if (window.navigation && window.navigation.addEventListener) {
    window.navigation.addEventListener("navigate", function(e) {
      if (!e || !e.destination || !e.destination.url) return;
      if (isHistoryApiCall) return;
      var destUrl = e.destination.url;
      if (destUrl === "about:blank") {
        if (e.cancelable) e.preventDefault();
        return;
      }
      if (e.hashChange) return;
      if (destUrl.indexOf(window.location.origin + CFG.proxyPrefix) === 0) return;

      var check = checkUrlAllowed(destUrl);
      if (check.isProxySelf) return;
      if (!check.allowed) {
        if (e.cancelable) {
          e.preventDefault();
          notifyBlocked(check.url || destUrl);
        }
        return;
      }
      if (e.navigationType === "reload") {
        if (e.cancelable) {
          e.preventDefault();
          var reloadTarget = CFG.effectiveUrl || CFG.targetUrl;
          window.location.href = CFG.proxyPrefix + (reloadTarget ? "?url=" + encodeURIComponent(reloadTarget) + (isUnlocked ? "&unlocked=1" : "") : (isUnlocked ? "?unlocked=1" : ""));
        }
        return;
      }
      if (!e.userInitiated && check.url === CFG.effectiveUrl) {
        if (e.cancelable) e.preventDefault();
        return;
      }
      // Route real full-document same-site navigations (e.g. location.href redirect) via proxy
      if (e.cancelable && check.url && destUrl.indexOf(CFG.proxyPrefix) === -1 && e.navigationType !== "traverse") {
        e.preventDefault();
        window.location.href = CFG.proxyPrefix + "?url=" + encodeURIComponent(check.url) + (isUnlocked ? "&unlocked=1" : "");
      }
    });
  }

  // 3. Intercept anchor clicks inside page (including Shadow DOM / SVG links)
  document.addEventListener("click", function(e) {
    var target = null;
    if (e.composedPath) {
      var cp = e.composedPath();
      for (var pi = 0; pi < cp.length; pi++) {
        var node = cp[pi];
        var nodeTag = node && node.tagName ? String(node.tagName).toUpperCase() : "";
        if (nodeTag === "A" || nodeTag === "AREA") {
          target = node;
          break;
        }
      }
    }
    if (!target) {
      target = e.target;
      while (target) {
        var tTag = target.tagName ? String(target.tagName).toUpperCase() : "";
        if (tTag === "A" || tTag === "AREA") break;
        target = target.parentElement;
      }
    }
    if (!target) return;
    if (target.hasAttribute && target.hasAttribute("download")) return;
    var rawHref = target.getAttribute("href");
    if (!rawHref) return;

    var trimmed = rawHref.trim();
    if (trimmed.indexOf("#") === 0 || trimmed.indexOf("javascript:") === 0 || trimmed.indexOf("mailto:") === 0 || trimmed.indexOf("tel:") === 0) {
      return;
    }

    var check = checkUrlAllowed(rawHref);
    if (!check.allowed) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      notifyBlocked(check.url || rawHref);
      return false;
    }

    if (check.isHashOnly && check.hash) {
      e.preventDefault();
      scrollToHash(check.hash);
      return false;
    }

    if (check.url && !isUnlocked && target.target === "_blank") {
      e.preventDefault();
      target.removeAttribute("target");
      window.location.href = CFG.proxyPrefix + "?url=" + encodeURIComponent(check.url) + (isUnlocked ? "&unlocked=1" : "");
      return false;
    }

    if (check.url && !check.isProxySelf) {
      e.preventDefault();
      window.location.href = CFG.proxyPrefix + "?url=" + encodeURIComponent(check.url) + (isUnlocked ? "&unlocked=1" : "");
      return false;
    }
  }, true);

  // 4. Intercept form submissions
  document.addEventListener("submit", function(e) {
    var form = e.target;
    if (!form || String(form.tagName || "").toUpperCase() !== "FORM") return;
    var method = String(form.getAttribute("method") || "GET").trim().toUpperCase();
    var action = form.getAttribute("action") || CFG.effectiveUrl;
    var check = checkUrlAllowed(action);
    if (!check.allowed) {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      notifyBlocked(check.url || action);
      return false;
    }
    if (method === "GET" && check.url && !check.isProxySelf && typeof FormData !== "undefined") {
      try {
        var formUrl = new URL(check.url);
        var fd = new FormData(form);
        var sp = new URLSearchParams();
        fd.forEach(function(val, key) {
          if (typeof val === "string") sp.append(key, val);
        });
        formUrl.search = sp.toString() ? "?" + sp.toString() : "";
        var getCheck = checkUrlAllowed(formUrl.href);
        if (!getCheck.allowed) {
          e.preventDefault();
          e.stopPropagation();
          e.stopImmediatePropagation();
          notifyBlocked(getCheck.url || formUrl.href);
          return false;
        }
        e.preventDefault();
        window.location.href = CFG.proxyPrefix + "?url=" + encodeURIComponent(formUrl.href) + (isUnlocked ? "&unlocked=1" : "");
        return false;
      } catch (err) {}
    }
  }, true);

  // 5. Intercept window.open
  var origOpen = window.open;
  window.open = function(url, targetName, features) {
    if (url) {
      var check = checkUrlAllowed(url);
      if (!check.allowed) {
        notifyBlocked(check.url || String(url));
        return null;
      }
      if (check.url) {
        window.location.href = CFG.proxyPrefix + "?url=" + encodeURIComponent(check.url) + (isUnlocked ? "&unlocked=1" : "");
        return null;
      }
    }
    return origOpen.apply(window, arguments);
  };

  try {
    window.parent.postMessage({ type: "PATHLOCK_READY", effectiveUrl: CFG.effectiveUrl }, "*");
  } catch (e) {}
})();
</script>`;
}
