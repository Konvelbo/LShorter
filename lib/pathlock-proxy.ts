import crypto from "crypto";
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
): Promise<{ response: Response; finalUrl: string; redirectCookies: string[] }> {
  let currentUrl = initialUrl;
  let method = (init.method || "GET").toUpperCase();
  let body = init.body;
  const redirectCookies: string[] = [];
  const currentHeaders = new Headers(init.headers);

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!isSafeProxyTargetUrl(currentUrl, configuredTargetUrl)) {
      throw new Error("SSRF_BLOCKED");
    }
    if (allowedHosts && !isSameSiteOrAllowedHost(currentUrl, allowedHosts)) {
      throw new Error("HOST_FORBIDDEN");
    }

    const res = await fetch(currentUrl, {
      ...init,
      headers: currentHeaders,
      signal: init.signal || AbortSignal.timeout(12000),
      method,
      body: method === "GET" || method === "HEAD" ? undefined : body,
      redirect: "manual",
    });

    if (res.status >= 300 && res.status < 400) {
      const hopCookies = extractSetCookiesFromResponse(res);
      for (const hc of hopCookies) redirectCookies.push(hc);

      const loc = res.headers.get("location");
      if (!loc) {
        return { response: res, finalUrl: currentUrl, redirectCookies };
      }
      try { await res.body?.cancel(); } catch {}
      const nextUrl = new URL(loc, currentUrl).href;

      // Propagate cookies set during intermediate redirect hops into the next hop's headers
      if (hopCookies.length > 0 && isSameSiteOrAllowedHost(nextUrl, allowedHosts || [new URL(currentUrl).hostname])) {
        const existingCookie = currentHeaders.get("cookie") || "";
        const mergedMap = new Map<string, string>();
        if (existingCookie) {
          for (const p of existingCookie.split(";")) {
            const eq = p.indexOf("=");
            if (eq !== -1) mergedMap.set(p.slice(0, eq).trim(), p.slice(eq + 1).trim());
          }
        }
        for (const raw of hopCookies) {
          const first = raw.split(";")[0]?.trim();
          if (first) {
            const eq = first.indexOf("=");
            if (eq !== -1) mergedMap.set(first.slice(0, eq).trim(), first.slice(eq + 1).trim());
          }
        }
        currentHeaders.set(
          "cookie",
          Array.from(mergedMap.entries()).map(([k, v]) => `${k}=${v}`).join("; ")
        );
      }

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

    return { response: res, finalUrl: currentUrl, redirectCookies };
  }

  throw new Error("TOO_MANY_REDIRECTS");
}

const globalPathLockStore = globalThis as unknown as {
  __lshorterEffectiveHostCache?: Map<string, { hosts: string[]; expiresAt: number }>;
  __lshorterHostProbeInFlight?: Map<string, Promise<string[]>>;
};

const effectiveHostCache =
  globalPathLockStore.__lshorterEffectiveHostCache ??
  (globalPathLockStore.__lshorterEffectiveHostCache = new Map<string, { hosts: string[]; expiresAt: number }>());

const hostProbeInFlight =
  globalPathLockStore.__lshorterHostProbeInFlight ??
  (globalPathLockStore.__lshorterHostProbeInFlight = new Map<string, Promise<string[]>>());

export interface PathLockSignedContext {
  slug: string;
  targetUrl: string;
  hosts: string[];
  exp: number;
}

const PATHLOCK_CTX_COOKIE = "lsh_pl_ctx";

function getProxySigningSecret(): string {
  return (
    process.env.FRONTEND_API_SECRET ||
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    ""
  ).trim();
}

/**
 * Generates a short-lived HMAC-SHA256 signed context cookie scoped to `/r/<slug>/proxy`
 * so parallel asset & dynamic RSC requests can verify host authorization in <0.1ms
 * without repeating Worker lookups across cold serverless instances.
 */
export function createPathLockContextCookie(
  ctx: Omit<PathLockSignedContext, "exp">,
  reqUrl: URL,
  forwardedProto?: string | null,
  ttlMs: number = 30 * 60 * 1000,
): string | null {
  const secret = getProxySigningSecret();
  if (!secret) return null;
  const payloadObj: PathLockSignedContext = {
    slug: ctx.slug,
    targetUrl: ctx.targetUrl,
    hosts: Array.from(new Set(ctx.hosts.map((h) => h.toLowerCase()).filter(Boolean))),
    exp: Date.now() + ttlMs,
  };
  const encoded = Buffer.from(JSON.stringify(payloadObj), "utf8").toString("base64url");
  const sig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  const isHttps =
    reqUrl.protocol === "https:" || (forwardedProto || "").toLowerCase() === "https";
  const scopedPath = `/r/${encodeURIComponent(ctx.slug)}/proxy`;
  const maxAgeSec = Math.max(10, Math.floor(ttlMs / 1000));
  return `${PATHLOCK_CTX_COOKIE}=${encoded}.${sig}; Path=${scopedPath}; SameSite=Lax${isHttps ? "; Secure" : ""}; HttpOnly; Max-Age=${maxAgeSec}`;
}

/**
 * Verifies the short-lived HMAC-SHA256 signed PathLock context cookie from incoming headers.
 */
export function verifyPathLockContextFromCookieHeader(
  cookieHeader: string | null | undefined,
  expectedSlug: string,
): PathLockSignedContext | null {
  const secret = getProxySigningSecret();
  if (!secret || !cookieHeader) return null;
  let tokenValue = "";
  for (const part of cookieHeader.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === PATHLOCK_CTX_COOKIE) {
      tokenValue = part.slice(eq + 1).trim();
      break;
    }
  }
  if (!tokenValue) return null;
  const dotIdx = tokenValue.indexOf(".");
  if (dotIdx === -1) return null;
  const encoded = tokenValue.slice(0, dotIdx);
  const sig = tokenValue.slice(dotIdx + 1);
  if (!encoded || !sig) return null;

  const expectedSig = crypto.createHmac("sha256", secret).update(encoded).digest("base64url");
  const a = Buffer.from(sig, "utf8");
  const b = Buffer.from(expectedSig, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8"),
    ) as PathLockSignedContext;
    if (
      !parsed ||
      typeof parsed.slug !== "string" ||
      parsed.slug.toLowerCase() !== expectedSlug.toLowerCase() ||
      typeof parsed.targetUrl !== "string" ||
      !Array.isArray(parsed.hosts) ||
      typeof parsed.exp !== "number" ||
      Date.now() > parsed.exp
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Produces a short collision-resistant session fingerprint for isolating per-user HTML prefetch cache entries.
 */
export function hashCookieFingerprint(mergedCookie: string): string {
  if (!mergedCookie) return "anon";
  return crypto.createHash("sha256").update(mergedCookie).digest("base64url").slice(0, 16);
}

const RESERVED_ORIGIN_COOKIE_PATTERNS = [
  /^__secure-authjs/i,
  /^authjs\./i,
  /^next-auth\./i,
  /^__host-/i,
  /^lsh_/i,
  /^theme$/i,
  /^__vercel/i,
];

/**
 * Checks whether a cookie name belongs to LShorter's own internal session or auth system.
 */
export function isReservedOriginCookie(name: string): boolean {
  const trimmed = (name || "").trim();
  return RESERVED_ORIGIN_COOKIE_PATTERNS.some((pat) => pat.test(trimmed));
}

/**
 * Safely extracts individual Set-Cookie header strings from a Response.
 */
export function extractSetCookiesFromResponse(res: Response): string[] {
  try {
    if (typeof (res.headers as unknown as { getSetCookie?: () => string[] }).getSetCookie === "function") {
      const list = (res.headers as unknown as { getSetCookie: () => string[] }).getSetCookie();
      if (Array.isArray(list) && list.length > 0) return list;
    }
  } catch {}
  const raw = res.headers.get("set-cookie");
  return raw ? [raw] : [];
}

/**
 * Filters incoming client cookies to strip any LShorter application/auth cookies
 * before forwarding them to an upstream third-party destination.
 */
export function getMergedUpstreamCookies(
  incomingCookieHeader: string | null | undefined,
): string {
  if (!incomingCookieHeader) return "";
  const merged = new Map<string, string>();
  const parts = incomingCookieHeader.split(";");

  for (const part of parts) {
    const eq = part.indexOf("=");
    if (eq !== -1) {
      const k = part.slice(0, eq).trim();
      const v = part.slice(eq + 1).trim();
      if (k && v && !isReservedOriginCookie(k)) {
        merged.set(k, v);
      }
    }
  }

  // Mirror __Secure- and non-prefixed session identifiers (e.g. PHPSESSID <-> __Secure-PHPSESSID)
  for (const [k, v] of Array.from(merged.entries())) {
    if (k.startsWith("__Secure-")) {
      const bare = k.replace(/^__Secure-/, "");
      if (!merged.has(bare) && !isReservedOriginCookie(bare)) {
        merged.set(bare, v);
      }
    } else if (k === "PHPSESSID" && !merged.has("__Secure-PHPSESSID")) {
      merged.set("__Secure-PHPSESSID", v);
    }
  }

  return Array.from(merged.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join("; ");
}

/**
 * Rewrites upstream Set-Cookie headers for safe delivery to the proxy client browser:
 * - Scopes Path to `/r/<slug>/proxy` so upstream cookies never pollute Path=/ or overwrite LShorter cookies.
 * - Strips any attempt by upstream to set reserved LShorter cookie names (authjs, next-auth, etc.).
 * - Corrects SameSite=None on plain HTTP development to prevent browser drops.
 */
export function rewriteSetCookiesForClient(
  upstreamCookies: string[],
  slug: string,
  reqUrl: URL,
  forwardedProto?: string | null,
): string[] {
  const isHttps = reqUrl.protocol === "https:" || (forwardedProto || "").toLowerCase() === "https";
  const rewritten: string[] = [];
  const scopedPath = `/r/${encodeURIComponent(slug)}/proxy`;

  for (const raw of upstreamCookies) {
    if (!raw || !raw.trim()) continue;
    const parts = raw.split(";").map((p) => p.trim()).filter(Boolean);
    if (parts.length === 0) continue;

    const first = parts[0];
    const eqIdx = first.indexOf("=");
    if (eqIdx === -1) continue;
    const name = first.slice(0, eqIdx).trim();
    const value = first.slice(eqIdx + 1);

    // Guard against upstream attempting to overwrite LShorter origin cookies
    if (isReservedOriginCookie(name)) continue;

    let sameSite = "Lax";
    let isHttpOnly = false;
    let expiresOrMaxAge = "";

    for (let i = 1; i < parts.length; i++) {
      const attr = parts[i];
      if (/^httponly$/i.test(attr)) {
        isHttpOnly = true;
      } else if (/^samesite=/i.test(attr)) {
        const val = attr.slice(9).trim().toLowerCase();
        if (val === "none") {
          sameSite = isHttps ? "None" : "Lax";
        } else {
          sameSite = "Lax";
        }
      } else if (/^(max-age|expires)=/i.test(attr)) {
        expiresOrMaxAge += `; ${attr}`;
      }
    }

    const secureAttr = isHttps ? "; Secure" : "";
    const httpOnlyAttr = isHttpOnly ? "; HttpOnly" : "";
    const cookieBase = `; Path=${scopedPath}; SameSite=${sameSite}${secureAttr}${httpOnlyAttr}${expiresOrMaxAge}`;

    if (!isHttps && name.startsWith("__Secure-")) {
      const bareName = name.replace(/^__Secure-/, "");
      if (!isReservedOriginCookie(bareName)) {
        rewritten.push(`${bareName}=${value}${cookieBase}`);
      }
    } else {
      rewritten.push(`${name}=${value}${cookieBase}`);
    }
  }

  return rewritten;
}

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
 * Probes the configured target URL via HEAD (with in-flight deduplication) to discover
 * canonical redirect hosts on cold worker instances without firing duplicate probes.
 */
export async function probeAllowedHostsForSlug(
  slug: string,
  configuredTargetUrl: string,
): Promise<string[]> {
  const key = `${(slug || "").toLowerCase()}|${configuredTargetUrl}`;
  const existing = hostProbeInFlight.get(key);
  if (existing) return existing;

  const probePromise = (async () => {
    try {
      const probe = await safeUpstreamFetch(
        configuredTargetUrl,
        { method: "HEAD", signal: AbortSignal.timeout(4000) },
        configuredTargetUrl,
        null,
      ).catch(() => null);
      if (probe?.finalUrl) {
        const effHost = new URL(probe.finalUrl).hostname;
        rememberAllowedHostsForSlug(slug, [effHost]);
      }
    } catch {}
    return getAllowedHostsForConfig(slug, configuredTargetUrl);
  })().finally(() => {
    hostProbeInFlight.delete(key);
  });

  hostProbeInFlight.set(key, probePromise);
  return probePromise;
}

/**
 * Loads normalized PathLock proxy configuration for a slug from Worker storage.
 */
export async function resolvePathLockLinkConfig(
  slug: string,
): Promise<PathLockProxyConfig | null> {
  const found = await fetchWorkerLink(slug);
  if (!found) return null;

  // Enforce active state, expiration, click limit, and cloaked/PathLock mode
  const isActive =
    found.is_active !== undefined
      ? Boolean(found.is_active)
      : found.isActive !== undefined
        ? Boolean(found.isActive)
        : true;
  if (!isActive) return null;

  const expiresAt = found.expires_at || found.expiresAt;
  if (expiresAt && new Date(expiresAt).getTime() <= Date.now()) {
    return null;
  }

  const maxClicks = found.max_clicks ?? found.maxClicks;
  const clicksCount = Number(found.clicks_count ?? found.clicksCount ?? 0);
  if (maxClicks !== null && maxClicks !== undefined && Number(maxClicks) > 0 && clicksCount >= Number(maxClicks)) {
    return null;
  }

  const isCloaked = Boolean(found.is_cloaked || found.isCloaked);
  const pathLockMode = found.path_lock_mode || found.pathLockMode || "off";
  if (!isCloaked && (!pathLockMode || pathLockMode === "off")) {
    return null;
  }

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
        /\b(srcset|data-srcset)=(["'])([^"']+)\2/gi,
        (_am: string, attr: string, q: string, val: string) =>
          `${attr}=${q}${rewriteSrcsetValue(val, effectiveUrl, slug, allowedHosts)}${q}`,
      );
      return `<${tag}${nextAttrs}>`;
    },
  );

  // Nested same-site <iframe> embeds (e.g. shadcn /create live preview frame)
  out = out.replace(/<iframe\b([^>]*?)>/gi, (_m, attrs) => {
    const nextAttrs = attrs.replace(
      /\bsrc=(["'])([^"']+)\1/gi,
      (_am: string, q: string, url: string) => {
        const trimmed = decodeHtmlUrlEntities(url.trim());
        if (
          !trimmed ||
          trimmed === "about:blank" ||
          trimmed.startsWith("data:") ||
          trimmed.startsWith("blob:") ||
          trimmed.startsWith("javascript:") ||
          trimmed.startsWith(`/r/${encodeURIComponent(slug)}/proxy`) ||
          trimmed.startsWith(`/r/${slug}/proxy`)
        ) {
          return `src=${q}${url}${q}`;
        }
        try {
          const resolved = new URL(trimmed, effectiveUrl);
          if (isSameSiteOrAllowedHost(resolved.href, allowedHosts)) {
            return `src=${q}/r/${encodeURIComponent(slug)}/proxy?url=${encodeURIComponent(resolved.href)}&embed=1${q}`;
          }
        } catch {}
        return `src=${q}${url}${q}`;
      },
    );
    return `<iframe${nextAttrs}>`;
  });

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
    let hrefWasProxied = false;
    let nextAttrs = attrs.replace(
      /\bhref=(["'])([^"']+)\1/gi,
      (_hm: string, q: string, url: string) => {
        const proxied = toProxyAssetUrl(url, effectiveUrl, slug, allowedHosts);
        if (proxied !== url) hrefWasProxied = true;
        return `href=${q}${proxied}${q}`;
      },
    );
    nextAttrs = nextAttrs.replace(
      /\bimagesrcset=(["'])([^"']+)\1/gi,
      (_sm: string, q: string, val: string) =>
        `imagesrcset=${q}${rewriteSrcsetValue(val, effectiveUrl, slug, allowedHosts)}${q}`,
    );
    // Strip SRI integrity on rewritten stylesheets since CSS url() rewriting alters bytes
    if (hrefWasProxied && rel.includes("stylesheet")) {
      nextAttrs = nextAttrs.replace(/\s+integrity=(["'])[^"']*\1/gi, "");
    }
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

  // Existing <script type="importmap"> blocks: rewrite same-site paths & add root prefix mapping
  out = out.replace(
    /(<script\b[^>]*\btype=["']importmap["'][^>]*>)([\s\S]*?)(<\/script>)/gi,
    (full, open, jsonBody, close) => {
      try {
        const parsed = JSON.parse(jsonBody);
        if (parsed && typeof parsed === "object") {
          const effU = new URL(effectiveUrl);
          const proxyBase = `/r/${encodeURIComponent(slug)}/proxy/__p/${effU.protocol.replace(":", "")}/${encodeURIComponent(effU.host)}/`;
          const rewriteMap = (mapObj: Record<string, string>) => {
            const next: Record<string, string> = {};
            for (const [k, v] of Object.entries(mapObj)) {
              next[k] = typeof v === "string" ? toProxyAssetUrl(v, effectiveUrl, slug, allowedHosts) : v;
            }
            return next;
          };
          parsed.imports = { "/": proxyBase, ...(parsed.imports ? rewriteMap(parsed.imports) : {}) };
          if (parsed.scopes && typeof parsed.scopes === "object") {
            const nextScopes: Record<string, Record<string, string>> = {};
            for (const [scopeKey, scopeVal] of Object.entries(parsed.scopes)) {
              if (scopeVal && typeof scopeVal === "object") {
                nextScopes[toProxyAssetUrl(scopeKey, effectiveUrl, slug, allowedHosts)] = rewriteMap(
                  scopeVal as Record<string, string>,
                );
              }
            }
            parsed.scopes = nextScopes;
          }
          return open + JSON.stringify(parsed).replace(/</g, "\\u003c") + close;
        }
      } catch {}
      return full;
    },
  );

  // Inline style="...url(...)..." and style='...url(...)...' attributes
  out = out.replace(
    /\bstyle="([^"]*url\([^"]*)"/gi,
    (_m, cssVal) => `style="${rewriteCssForPathLock(cssVal, effectiveUrl, slug, allowedHosts)}"`,
  );
  out = out.replace(
    /\bstyle='([^']*url\([^']*)'/gi,
    (_m, cssVal) => `style='${rewriteCssForPathLock(cssVal, effectiveUrl, slug, allowedHosts)}'`,
  );

  // Inline <style> blocks
  out = out.replace(
    /(<style\b[^>]*>)([\s\S]*?)(<\/style>)/gi,
    (_m, open, css, close) =>
      open + rewriteCssForPathLock(css, effectiveUrl, slug, allowedHosts) + close,
  );

  return out;
}

/**
 * Parses `/r/[slug]/proxy/__p/<scheme>/<encodedHost>/...` from the raw request pathname,
 * preserving percent-encoded dynamic route segments (e.g. `%5Bid%5D`, `%2F`) and trailing slashes.
 */
export function parseProxyAssetFromPathname(
  rawPathname: string,
  rawSearch: string,
  fallbackSegments?: string[],
): { url: string; host: string } | null {
  const match = rawPathname.match(/\/proxy\/__p\/(https?)\/([^/]+)(\/.*)?$/i);
  if (match) {
    const scheme = match[1].toLowerCase();
    let host = "";
    try {
      host = decodeURIComponent(match[2] || "").trim();
    } catch {
      return null;
    }
    if (!host || /[\s/@\\]/.test(host)) {
      return null;
    }
    const rawRest = match[3] || "/";
    let cleanSearch = rawSearch ? (rawSearch.startsWith("?") ? rawSearch : `?${rawSearch}`) : "";
    let effectiveRest = rawRest;
    if (cleanSearch && /(?:^\?|&)_plts=1(?:&|$)/.test(cleanSearch)) {
      const sp = new URLSearchParams(cleanSearch.slice(1));
      sp.delete("_plts");
      const nextQ = sp.toString();
      cleanSearch = nextQ ? `?${nextQ}` : "";
      if (!effectiveRest.endsWith("/")) {
        effectiveRest += "/";
      }
    }
    const rebuilt = `${scheme}://${host}${effectiveRest}${cleanSearch}`;
    try {
      const parsed = new URL(rebuilt);
      return { url: parsed.href, host: parsed.host };
    } catch {
      return null;
    }
  }
  return fallbackSegments ? parseProxyAssetSegments(fallbackSegments, rawSearch) : null;
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

/**
 * Returns a clean PathLock-blocked HTML response that immediately activates the parent
 * CloakedViewer Security Gate overlay without ever leaking the raw destination URL.
 */
export function buildPathLockBlockedHtml(
  blockedUrl: string,
  message?: string,
): string {
  const safeMsg = escapeHtmlText(
    message || "Cette route est restreinte par la protection PathLock™.",
  );
  const payload = JSON.stringify({
    type: "PATHLOCK_NAVIGATE",
    url: blockedUrl || "/blocked",
    blocked: true,
  }).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Accès restreint — PathLock™</title>
  <script>
    try {
      window.parent.postMessage(${payload}, "*");
    } catch (e) {}
  </script>
</head>
<body style="margin:0;min-height:100vh;background:#0B0C0E;color:#f4f4f5;font-family:system-ui,-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;">
  <div style="max-width:420px;width:100%;background:#111114;border:1px solid #27272a;border-radius:14px;padding:28px;text-align:center;">
    <div style="display:inline-flex;padding:5px 12px;border-radius:999px;background:rgba(59,130,246,.14);border:1px solid rgba(96,140,255,.35);color:#A9C4FF;font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;margin-bottom:14px;">
      PathLock™ Security Gate
    </div>
    <h1 style="margin:0 0 10px;font-size:18px;font-weight:700;color:#fff;">Accès hors périmètre bloqué</h1>
    <p style="margin:0;font-size:13.5px;line-height:1.55;color:#a1a1aa;">${safeMsg}</p>
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
  hasExistingImportMap?: boolean;
  isNestedEmbed?: boolean;
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
    isNestedEmbed: Boolean(opts.isNestedEmbed),
    mode: String(opts.mode || "strict").trim().toLowerCase(),
    prefix: opts.prefix || "",
    filterType: parsedRoutes.filterType,
    routes: parsedRoutes.routes,
    blockedRoutes: parsedRoutes.blockedRoutes,
    allowAllSubpaths: parsedRoutes.allowAllSubpaths,
    hasExplicitRoot: parsedRoutes.hasExplicitRoot,
    initialUnlocked: opts.initialUnlocked,
  };

  // JSON-safe embed (escape `<` so `</script>` can never break out of inline script)
  const serializedCfg = JSON.stringify(clientConfig).replace(/</g, "\\u003c");
  const importMapTag = opts.hasExistingImportMap
    ? ""
    : `<script type="importmap">${JSON.stringify({
        imports: {
          "/": `${proxyAssetBase}/${effScheme}/${effHostEnc}/`,
        },
      }).replace(/</g, "\\u003c")}</script>\n`;

  return `
${importMapTag}<script>
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
        var pathPart = u.pathname === "/" ? "" : u.pathname;
        var searchPart = u.search;
        if (pathPart.length > 1 && pathPart.charAt(pathPart.length - 1) === "/") {
          pathPart = pathPart.slice(0, -1);
          searchPart = searchPart ? searchPart + "&_plts=1" : "?_plts=1";
        }
        return (
          CFG.proxyAssetBase +
          "/" +
          u.protocol.replace(":", "") +
          "/" +
          encodeURIComponent(u.host) +
          pathPart +
          searchPart +
          u.hash
        );
      }
    } catch (e) {}
    return rawUrl;
  }

  function toVirtualOriginUrl(rawUrl) {
    if (!rawUrl) return rawUrl;
    var s = String(rawUrl).trim();
    try {
      var u = new URL(s, window.location.origin);
      var prefixP = CFG.proxyAssetBase + "/";
      if (u.origin.toLowerCase() === window.location.origin.toLowerCase() && u.pathname.indexOf(prefixP) === 0) {
        var rest = u.pathname.slice(prefixP.length);
        var parts = rest.split("/");
        if (parts.length >= 2) {
          var innerPath = "/" + parts.slice(2).join("/");
          var innerSearch = u.search;
          if (innerSearch && /(?:^\\?|&)_plts=1(?:&|$)/.test(innerSearch)) {
            var sp = new URLSearchParams(innerSearch.slice(1));
            sp.delete("_plts");
            var nextQ = sp.toString();
            innerSearch = nextQ ? "?" + nextQ : "";
            if (innerPath.charAt(innerPath.length - 1) !== "/") innerPath += "/";
          }
          return window.location.origin + innerPath + innerSearch + u.hash;
        }
      }
      if (isHostAllowed(u.hostname)) {
        return window.location.origin + u.pathname + u.search + u.hash;
      }
    } catch (e) {}
    return rawUrl;
  }

  function patchProxiedResponse(res, virtualUrl, wasRedirected) {
    if (!res) return res;
    try {
      if (virtualUrl && virtualUrl !== res.url) {
        Object.defineProperty(res, "url", {
          value: virtualUrl,
          configurable: true,
          enumerable: true,
        });
      }
      if (wasRedirected) {
        Object.defineProperty(res, "redirected", {
          value: true,
          configurable: true,
          enumerable: true,
        });
      }
      var origClone = res.clone;
      if (typeof origClone === "function") {
        res.clone = function() {
          return patchProxiedResponse(origClone.call(this), virtualUrl, wasRedirected);
        };
      }
    } catch (e) {}
    return res;
  }

  function getHeaderValue(headersObj, targetName) {
    if (!headersObj) return null;
    var lowTarget = targetName.toLowerCase();
    try {
      if (typeof Headers !== "undefined" && headersObj instanceof Headers) {
        return headersObj.get(targetName);
      }
      if (Array.isArray(headersObj)) {
        for (var i = 0; i < headersObj.length; i++) {
          if (headersObj[i] && String(headersObj[i][0] || "").toLowerCase() === lowTarget) {
            return String(headersObj[i][1] || "");
          }
        }
        return null;
      }
      if (typeof headersObj === "object") {
        var keys = Object.keys(headersObj);
        for (var j = 0; j < keys.length; j++) {
          if (keys[j].toLowerCase() === lowTarget) {
            return String(headersObj[keys[j]] || "");
          }
        }
      }
    } catch (e) {}
    return null;
  }

  function toProxyIframeUrl(rawUrl) {
    if (!rawUrl) return rawUrl;
    var s = String(rawUrl).trim();
    if (
      !s ||
      s === "about:blank" ||
      s.indexOf("data:") === 0 ||
      s.indexOf("blob:") === 0 ||
      s.indexOf("javascript:") === 0 ||
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
        return CFG.proxyPrefix + "?url=" + encodeURIComponent(u.href) + "&embed=1" + (isUnlocked ? "&unlocked=1" : "");
      }
    } catch (e) {}
    return rawUrl;
  }

  function toVirtualAttrPath(rawAttr) {
    if (!rawAttr || typeof rawAttr !== "string") return rawAttr;
    var prefixP = CFG.proxyAssetBase + "/";
    if (rawAttr.indexOf(prefixP) !== 0) return rawAttr;
    try {
      var rest = rawAttr.slice(prefixP.length);
      var slash1 = rest.indexOf("/");
      if (slash1 === -1) return rawAttr;
      var scheme = rest.slice(0, slash1);
      var afterScheme = rest.slice(slash1 + 1);
      var slash2 = afterScheme.indexOf("/");
      var encHost = slash2 === -1 ? afterScheme : afterScheme.slice(0, slash2);
      var pathAndQuery = slash2 === -1 ? "/" : afterScheme.slice(slash2);
      var host = decodeURIComponent(encHost);
      var hostnameOnly = host.split(":")[0];
      if (isHostAllowed(hostnameOnly)) {
        return pathAndQuery;
      }
      return scheme + "://" + host + pathAndQuery;
    } catch (e) {
      return rawAttr;
    }
  }

  function rewriteAssetSelector(sel) {
    if (!sel || typeof sel !== "string") return sel;
    if (sel.indexOf("script[") === -1 && sel.indexOf("SCRIPT[") === -1 && sel.indexOf("link[") === -1 && sel.indexOf("LINK[") === -1) {
      return sel;
    }
    return sel.replace(/(script|link)([^,]*?)\\[(src|href)(\\^?=)(["'])([^"']+)\\5\\]/gi, function(full, tag, mid, attr, op, q, val) {
      if (!val || val.indexOf(CFG.proxyPrefix) === 0) return full;
      var mapped = toProxyAsset(val);
      if (mapped === val) return full;
      if (val.charAt(val.length - 1) === "?" && mapped.charAt(mapped.length - 1) !== "?") {
        mapped += "?";
      }
      return tag + mid + "[" + attr + op + q + mapped + q + "]";
    });
  }

  function rewriteSrcset(val) {
    if (!val || typeof val !== "string") return val;
    return val
      .split(/,\\s+(?=\\S)/)
      .map(function(entry) {
        var trimmed = entry.trim();
        if (!trimmed) return entry;
        var spaceIdx = trimmed.search(/\\s/);
        if (spaceIdx === -1) return toProxyAsset(trimmed);
        return toProxyAsset(trimmed.slice(0, spaceIdx)) + trimmed.slice(spaceIdx);
      })
      .join(", ");
  }

  // Transparently route dynamic scripts, styles, iframes, srcset, fetch, XHR, EventSource & sendBeacon via same-origin proxy
  // while keeping script/link virtual paths intact for Next.js Turbopack, React Flight & Webpack chunk registries!
  try {
    var origSetAttr = Element.prototype.setAttribute;
    var origGetAttr = Element.prototype.getAttribute;

    Element.prototype.setAttribute = function(name, val) {
      var lowerName = String(name || "").toLowerCase();
      var tag = this.tagName;
      if (
        (lowerName === "src" || lowerName === "poster") &&
        (tag === "SCRIPT" || tag === "IMG" || tag === "SOURCE" || tag === "VIDEO" || tag === "AUDIO")
      ) {
        val = toProxyAsset(val);
      } else if ((lowerName === "srcset" || lowerName === "data-srcset") && (tag === "IMG" || tag === "SOURCE")) {
        val = rewriteSrcset(val);
      } else if (lowerName === "imagesrcset" && tag === "LINK") {
        val = rewriteSrcset(val);
      } else if (lowerName === "src" && tag === "IFRAME") {
        val = toProxyIframeUrl(val);
      } else if (lowerName === "href" && (tag === "LINK" || tag === "USE" || tag === "IMAGE")) {
        var rel = String(origGetAttr.call(this, "rel") || "").toLowerCase();
        if (rel !== "canonical" && rel !== "alternate" && rel !== "preconnect" && rel !== "dns-prefetch") {
          val = toProxyAsset(val);
        }
      }
      return origSetAttr.call(this, name, val);
    };

    if (origGetAttr) {
      Element.prototype.getAttribute = function(name) {
        var raw = origGetAttr.call(this, name);
        if (!raw) return raw;
        var lowerName = String(name || "").toLowerCase();
        var tag = this.tagName;
        if ((tag === "SCRIPT" && lowerName === "src") || (tag === "LINK" && lowerName === "href")) {
          return toVirtualAttrPath(raw);
        }
        return raw;
      };
    }

    if (typeof Document !== "undefined" && Document.prototype) {
      var origDocQsa = Document.prototype.querySelectorAll;
      if (origDocQsa) {
        Document.prototype.querySelectorAll = function(sel) {
          return origDocQsa.call(this, rewriteAssetSelector(sel));
        };
      }
      var origDocQs = Document.prototype.querySelector;
      if (origDocQs) {
        Document.prototype.querySelector = function(sel) {
          return origDocQs.call(this, rewriteAssetSelector(sel));
        };
      }
    }

    if (typeof Element !== "undefined" && Element.prototype) {
      var origElQsa = Element.prototype.querySelectorAll;
      if (origElQsa) {
        Element.prototype.querySelectorAll = function(sel) {
          return origElQsa.call(this, rewriteAssetSelector(sel));
        };
      }
      var origElQs = Element.prototype.querySelector;
      if (origElQs) {
        Element.prototype.querySelector = function(sel) {
          return origElQs.call(this, rewriteAssetSelector(sel));
        };
      }
    }

    var scriptDesc = Object.getOwnPropertyDescriptor(HTMLScriptElement.prototype, "src");
    if (scriptDesc && scriptDesc.set) {
      Object.defineProperty(HTMLScriptElement.prototype, "src", {
        get: function() {
          var raw = scriptDesc.get ? scriptDesc.get.call(this) : "";
          return toVirtualOriginUrl(raw);
        },
        set: function(v) { return scriptDesc.set.call(this, toProxyAsset(v)); },
        configurable: true,
      });
    }

    if (typeof HTMLIFrameElement !== "undefined") {
      var iframeDesc = Object.getOwnPropertyDescriptor(HTMLIFrameElement.prototype, "src");
      if (iframeDesc && iframeDesc.set) {
        Object.defineProperty(HTMLIFrameElement.prototype, "src", {
          get: iframeDesc.get,
          set: function(v) { return iframeDesc.set.call(this, toProxyIframeUrl(v)); },
          configurable: true,
        });
      }
    }

    var linkDesc = Object.getOwnPropertyDescriptor(HTMLLinkElement.prototype, "href");
    if (linkDesc && linkDesc.set) {
      Object.defineProperty(HTMLLinkElement.prototype, "href", {
        get: function() {
          var raw = linkDesc.get ? linkDesc.get.call(this) : "";
          return toVirtualOriginUrl(raw);
        },
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
      var sd = proto && Object.getOwnPropertyDescriptor(proto, "srcset");
      if (sd && sd.set) {
        Object.defineProperty(proto, "srcset", {
          get: sd.get,
          set: function(v) { return sd.set.call(this, rewriteSrcset(v)); },
          configurable: true,
        });
      }
    });

    var linkImgSrcsetDesc = Object.getOwnPropertyDescriptor(HTMLLinkElement.prototype, "imageSrcset");
    if (linkImgSrcsetDesc && linkImgSrcsetDesc.set) {
      Object.defineProperty(HTMLLinkElement.prototype, "imageSrcset", {
        get: linkImgSrcsetDesc.get,
        set: function(v) { return linkImgSrcsetDesc.set.call(this, rewriteSrcset(v)); },
        configurable: true,
      });
    }

    var videoPosterDesc = Object.getOwnPropertyDescriptor(HTMLVideoElement.prototype, "poster");
    if (videoPosterDesc && videoPosterDesc.set) {
      Object.defineProperty(HTMLVideoElement.prototype, "poster", {
        get: videoPosterDesc.get,
        set: function(v) { return videoPosterDesc.set.call(this, toProxyAsset(v)); },
        configurable: true,
      });
    }
  } catch (e) {}

  var baseNormA = normPath(CFG.parsedBasePathname);
  var baseNormB = normPath(CFG.effectivePathname);
  var allowedRoutes = Array.isArray(CFG.routes) ? CFG.routes : [];
  var blockedRoutes = Array.isArray(CFG.blockedRoutes) ? CFG.blockedRoutes : [];
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

      // 1. First priority: if attempt matches any blocked route, BLOCK IMMEDIATELY!
      if (blockedRoutes.length > 0) {
        var isExplicitlyBlocked = blockedRoutes.some(function(b) {
          if (b === "" || b === "/") return attemptNorm === "";
          return attemptNorm === b || attemptNorm.indexOf(b + "/") === 0;
        });
        if (isExplicitlyBlocked) {
          return { allowed: false, url: u.href, isSameSite: true };
        }
      }

      if (CFG.mode === "strict") {
        var strictAllowed =
          attemptNorm === baseNormA ||
          attemptNorm === baseNormB ||
          (hasExplicitRoot && attemptNorm === "") ||
          allowedRoutes.indexOf(attemptNorm) !== -1;
        return { allowed: strictAllowed, isHashOnly: strictAllowed && isSameDocHashOnly, hash: u.hash, url: u.href };
      }

      if (CFG.mode === "funnel") {
        // Blacklist mode: if not blocked above, everything is permitted
        if (CFG.filterType === "blacklist") {
          return {
            allowed: true,
            isHashOnly: isSameDocHashOnly,
            hash: u.hash,
            url: u.href,
          };
        }

        // Whitelist mode: only base target and explicitly allowed prefixes are permitted
        var isTarget =
          attemptNorm === baseNormA ||
          (CFG.isNestedEmbed && attemptNorm === baseNormB) ||
          (hasExplicitRoot && attemptNorm === "") ||
          (baseNormA === "" && attemptNorm === "");
        var isAllowedPrefix = allowedRoutes.some(function(p) {
          return attemptNorm === p || attemptNorm.indexOf(p + "/") === 0;
        });
        var isHexPalette = /^[0-9a-f]{6}(-[0-9a-f]{6})+$/i.test(attemptNorm);
        var isCoolorsGenerator = isHexPalette && allowedRoutes.some(function(p) {
          return p === "generate" || p.indexOf("generate") === 0;
        });
        var funnelAllowed = allowAllSubpaths || isTarget || isAllowedPrefix || isCoolorsGenerator;
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

  function getGateWindow() {
    if (CFG.isNestedEmbed) {
      return window.top || window.parent;
    }
    return window.parent;
  }

  function notifyBlocked(blockedUrl) {
    try {
      getGateWindow().postMessage(
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
    if (CFG.isNestedEmbed) return;
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

  function notifyLoading(isLoading) {
    if (CFG.isNestedEmbed) return;
    try {
      window.parent.postMessage({ type: "PATHLOCK_LOADING", loading: Boolean(isLoading) }, "*");
    } catch (e) {}
  }

  function navigateViaProxy(targetHref) {
    notifyLoading(true);
    window.location.href = CFG.proxyPrefix + "?url=" + encodeURIComponent(targetHref) + (CFG.isNestedEmbed ? "&embed=1" : "") + (isUnlocked ? "&unlocked=1" : "");
  }

  var origFetch = window.fetch ? window.fetch.bind(window) : null;
  if (origFetch) {
    window.fetch = function(input, init) {
      var mappedInput = input;
      var fetchInit = init;
      var originalUrlStr = "";
      var isProxied = false;
      try {
        if (typeof input === "string") {
          originalUrlStr = input;
          mappedInput = toProxyAsset(input);
        } else if (typeof URL !== "undefined" && input instanceof URL) {
          // Critical for Next.js App Router (13/14/15/16), Remix & SvelteKit which pass URL instances to fetch()
          originalUrlStr = input.href;
          mappedInput = toProxyAsset(input.href);
        } else if (typeof Request !== "undefined" && input instanceof Request) {
          originalUrlStr = input.url;
          var mappedUrl = toProxyAsset(input.url);
          if (mappedUrl !== input.url) {
            mappedInput = new Request(mappedUrl, input);
          }
        } else if (input && typeof input === "object" && typeof input.href === "string") {
          originalUrlStr = input.href;
          mappedInput = toProxyAsset(input.href);
        }

        isProxied =
          (typeof mappedInput === "string" && mappedInput.indexOf(CFG.proxyPrefix) === 0) ||
          (typeof Request !== "undefined" && mappedInput instanceof Request && mappedInput.url.indexOf(CFG.proxyPrefix) !== -1);

        // Short-circuit blocked SPA prefetches & dynamic route fetches in 0ms client-side
        if (isProxied && !isUnlocked && CFG.mode !== "off" && originalUrlStr) {
          var reqHeaders = (init && init.headers) || (typeof Request !== "undefined" && input instanceof Request ? input.headers : null);
          var isPrefetch = Boolean(
            getHeaderValue(reqHeaders, "next-router-prefetch") ||
            getHeaderValue(reqHeaders, "next-router-segment-prefetch") ||
            String(getHeaderValue(reqHeaders, "purpose") || "").toLowerCase() === "prefetch" ||
            String(getHeaderValue(reqHeaders, "sec-purpose") || "").toLowerCase() === "prefetch"
          );
          var isSpaRouteFetch =
            (getHeaderValue(reqHeaders, "rsc") === "1" || String(getHeaderValue(reqHeaders, "x-inertia") || "").toLowerCase() === "true") &&
            !getHeaderValue(reqHeaders, "next-action");

          if (isPrefetch || isSpaRouteFetch) {
            var candPath = "";
            try { candPath = new URL(originalUrlStr, CFG.effectiveUrl).pathname || ""; } catch (e) {}
            if (candPath.indexOf("/_next/") !== 0 && candPath.indexOf("/api/") !== 0 && candPath.indexOf(CFG.proxyPrefix) !== 0) {
              var fetchCheck = checkUrlAllowed(originalUrlStr);
              if (!fetchCheck.allowed) {
                if (!isPrefetch) {
                  notifyBlocked(fetchCheck.url || originalUrlStr);
                }
                return Promise.resolve(new Response(null, { status: isPrefetch ? 204 : 403 }));
              }
            }
          }
        }

        if (isProxied) {
          if (init) {
            fetchInit = Object.assign({}, init);
            if (fetchInit.credentials === "omit") fetchInit.credentials = "same-origin";
          } else if (typeof Request !== "undefined" && mappedInput instanceof Request && mappedInput.credentials === "omit") {
            mappedInput = new Request(mappedInput, { credentials: "same-origin" });
          }
        }
      } catch (e) {}

      var p = origFetch(mappedInput, fetchInit);
      if (!isProxied) return p;

      return p.then(function(res) {
        try {
          var finalHdr = res.headers && res.headers.get("x-pathlock-final-url");
          var wasRedir = Boolean(res.headers && res.headers.get("x-pathlock-redirected") === "1");
          var virtualUrl = toVirtualOriginUrl(finalHdr || res.url);
          return patchProxiedResponse(res, virtualUrl, wasRedir);
        } catch (e) {
          return res;
        }
      });
    };
  }

  if (window.XMLHttpRequest) {
    var origXhrOpen = window.XMLHttpRequest.prototype.open;
    window.XMLHttpRequest.prototype.open = function(method, url) {
      var args = Array.prototype.slice.call(arguments);
      try {
        args[1] = toProxyAsset(url);
      } catch (e) {}
      var ret = origXhrOpen.apply(this, args);
      try {
        // Only set withCredentials on same-origin proxied requests; never on third-party URLs to avoid breaking CORS
        if (typeof args[1] === "string" && args[1].indexOf(CFG.proxyPrefix) === 0) {
          this.withCredentials = true;
        }
      } catch (e) {}
      return ret;
    };

    try {
      var xhrRespUrlDesc = Object.getOwnPropertyDescriptor(window.XMLHttpRequest.prototype, "responseURL");
      if (xhrRespUrlDesc && xhrRespUrlDesc.get) {
        Object.defineProperty(window.XMLHttpRequest.prototype, "responseURL", {
          get: function() {
            var raw = xhrRespUrlDesc.get.call(this);
            try {
              var finalHdr = this.getResponseHeader && this.getResponseHeader("x-pathlock-final-url");
              return toVirtualOriginUrl(finalHdr || raw);
            } catch (e) {
              return toVirtualOriginUrl(raw);
            }
          },
          configurable: true,
        });
      }
    } catch (e) {}
  }

  if (window.EventSource) {
    try {
      var OrigEventSource = window.EventSource;
      window.EventSource = function(url, eventSourceInitDict) {
        return new OrigEventSource(toProxyAsset(url), eventSourceInitDict);
      };
      window.EventSource.prototype = OrigEventSource.prototype;
      window.EventSource.CONNECTING = OrigEventSource.CONNECTING;
      window.EventSource.OPEN = OrigEventSource.OPEN;
      window.EventSource.CLOSED = OrigEventSource.CLOSED;
    } catch (e) {}
  }

  if (window.navigator && window.navigator.sendBeacon) {
    var origBeacon = window.navigator.sendBeacon.bind(window.navigator);
    window.navigator.sendBeacon = function(url, data) {
      return origBeacon(toProxyAsset(url), data);
    };
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

  window.addEventListener("popstate", function() {
    try {
      var currentPath = window.location.pathname + window.location.search + window.location.hash;
      if (currentPath.indexOf(CFG.proxyPrefix) === 0) return;
      var check = checkUrlAllowed(currentPath);
      if (!check.allowed) {
        notifyBlocked(check.url || currentPath);
        return;
      }
      if (check.url && !check.isProxySelf) {
        updateEffectiveState(check.url);
        notifyAllowedNavigate(CFG.effectivePathname);
      }
    } catch (e) {}
  });

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
          navigateViaProxy(reloadTarget);
        }
        return;
      }
      if (!e.userInitiated && check.url === CFG.effectiveUrl) {
        if (e.cancelable) e.preventDefault();
        return;
      }
      // Route real full-document same-site navigations (e.g. location.href redirect) via proxy
      if (
        e.cancelable &&
        !e.defaultPrevented &&
        check.url &&
        destUrl.indexOf(CFG.proxyPrefix) === -1 &&
        e.navigationType !== "traverse"
      ) {
        e.preventDefault();
        navigateViaProxy(check.url);
      }
    });
  }

  function getAnchorFromEvent(e) {
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
    return target;
  }

  // 2b. Predictive hover & pointerdown HTML prefetching for traditional (non-SPA) dynamic routes
  var prefetchedAt = {};
  var activePrefetches = 0;
  var hoverTimer = null;

  function isActiveSpaFramework() {
    return Boolean(
      window.__next_f ||
      window.__NEXT_DATA__ ||
      window.__NUXT__ ||
      window.__remixContext ||
      window.__sveltekit_
    );
  }

  function maybePrefetchAnchor(anchor, immediate) {
    if (!origFetch || !anchor) return;
    if (!immediate && isActiveSpaFramework()) return;
    try {
      var conn = window.navigator && window.navigator.connection;
      if (conn && (conn.saveData || conn.effectiveType === "slow-2g")) return;
      if (anchor.hasAttribute && anchor.hasAttribute("download")) return;
      var rawHref = anchor.getAttribute("href");
      if (!rawHref) return;
      var trimmed = rawHref.trim();
      if (!trimmed || trimmed.charAt(0) === "#" || trimmed.indexOf("javascript:") === 0 || trimmed.indexOf("mailto:") === 0 || trimmed.indexOf("tel:") === 0) return;

      var check = checkUrlAllowed(rawHref);
      if (!check.allowed || !check.url || check.isHashOnly || check.isProxySelf || check.url === CFG.effectiveUrl) return;
      if (/\\/(logout|signout|sign-out|log-out|delete|remove|unsubscribe|cancel)(\\/|\\?|$)/i.test(check.url)) return;

      var now = Date.now();
      if (prefetchedAt[check.url] && now - prefetchedAt[check.url] < 12000) return;
      if (activePrefetches >= 2) return;

      prefetchedAt[check.url] = now;
      activePrefetches++;
      var prefetchUrl = CFG.proxyPrefix + "?url=" + encodeURIComponent(check.url) + (isUnlocked ? "&unlocked=1" : "") + "&prefetch=1";
      origFetch(prefetchUrl, { method: "GET", credentials: "same-origin", priority: "low" })
        .catch(function() {})
        .finally(function() { activePrefetches = Math.max(0, activePrefetches - 1); });
    } catch (e) {}
  }

  document.addEventListener("mouseover", function(e) {
    var anchor = getAnchorFromEvent(e);
    if (!anchor) return;
    if (hoverTimer) clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function() {
      maybePrefetchAnchor(anchor, false);
    }, 65);
  }, true);

  document.addEventListener("mouseout", function(e) {
    if (hoverTimer && getAnchorFromEvent(e)) {
      clearTimeout(hoverTimer);
      hoverTimer = null;
    }
  }, true);

  document.addEventListener("pointerdown", function(e) {
    if (e.button && e.button !== 0) return;
    if (isActiveSpaFramework()) return;
    var anchor = getAnchorFromEvent(e);
    if (anchor) maybePrefetchAnchor(anchor, true);
  }, true);

  // 3a. Intercept anchor clicks & middle-clicks in CAPTURE PHASE: Block disallowed routes immediately!
  function captureBlockCheck(e) {
    var target = getAnchorFromEvent(e);
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

    if (e.type === "click" && check.isHashOnly && check.hash) {
      e.preventDefault();
      scrollToHash(check.hash);
      return false;
    }

    if (e.type === "click" && check.url && !isUnlocked && target.target === "_blank") {
      e.preventDefault();
      target.removeAttribute("target");
      navigateViaProxy(check.url);
      return false;
    }
    // When allowed, DO NOT call e.preventDefault() in capture phase so that SPA routers
    // (Next.js Link, React Router, Vue Router, SvelteKit, Remix) handle transitions dynamically in milliseconds!
  }

  document.addEventListener("click", captureBlockCheck, true);
  document.addEventListener("auxclick", captureBlockCheck, true);

  // 3b. Intercept anchor clicks on WINDOW BUBBLE PHASE (strictly AFTER all document/#root SPA handlers!)
  window.addEventListener("click", function(e) {
    if (e.defaultPrevented) {
      // SPA framework (Next.js hydrateRoot(document), React Router, Vue, Remix, SvelteKit) already intercepted this click
      return;
    }
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
      if (isUnlocked) return;
    }
    var target = getAnchorFromEvent(e);
    if (!target) return;
    if (target.hasAttribute && target.hasAttribute("download")) return;
    var rawHref = target.getAttribute("href");
    if (!rawHref) return;

    var trimmed = rawHref.trim();
    if (trimmed.indexOf("#") === 0 || trimmed.indexOf("javascript:") === 0 || trimmed.indexOf("mailto:") === 0 || trimmed.indexOf("tel:") === 0) {
      return;
    }

    var check = checkUrlAllowed(rawHref);
    if (check.allowed && check.url && !check.isProxySelf) {
      e.preventDefault();
      navigateViaProxy(check.url);
      return false;
    }
  }, false);

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
        navigateViaProxy(formUrl.href);
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
        navigateViaProxy(check.url);
        return null;
      }
    }
    return origOpen.apply(window, arguments);
  };

  if (!CFG.isNestedEmbed) {
    try {
      window.parent.postMessage({ type: "PATHLOCK_READY", effectiveUrl: CFG.effectiveUrl }, "*");
    } catch (e) {}
  }
})();
</script>`;
}
