/**
 * Enterprise-grade security utilities for input sanitization,
 * URL validation (SSRF / XSS prevention), SVG safety, and rate-limiting.
 */

// In-memory sliding window rate-limiter store
interface RateLimitRecord {
  timestamps: number[];
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Clean up stale rate-limit records periodically (every 5 minutes)
if (typeof setInterval !== "undefined") {
  const timer = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitMap.entries()) {
      record.timestamps = record.timestamps.filter((ts) => now - ts < 300000);
      if (record.timestamps.length === 0) {
        rateLimitMap.delete(key);
      }
    }
  }, 300000);
  if (timer.unref) {
    timer.unref();
  }
}

/**
 * Validates that a URL strictly belongs to HTTP or HTTPS protocols,
 * and contains no control characters, invalid schemes, or script payloads.
 */
export function isSafeHttpUrl(urlStr: unknown): boolean {
  if (typeof urlStr !== "string") return false;
  const trimmed = urlStr.trim();
  if (!trimmed || trimmed.length > 4096) return false;

  // Reject control characters or null bytes
  if (/[\x00-\x1F\x7F]/.test(trimmed)) return false;

  // Reject explicitly dangerous URI schemes
  if (
    /^(javascript|data|vbscript|file|blob|about|chrome|intent|ms-windows-store|ftp|gopher):/i.test(
      trimmed,
    )
  ) {
    return false;
  }

  try {
    const candidate =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;

    const parsed = new URL(candidate);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    if (!parsed.hostname || parsed.hostname.length < 1) {
      return false;
    }

    const host = parsed.hostname.toLowerCase().replace(/\.$/, "");
    const unbracketed = host.replace(/^\[|\]$/g, "");

    const isIpv6Private =
      unbracketed.includes(":") &&
      (unbracketed === "::" ||
        unbracketed === "::1" ||
        unbracketed.startsWith("::ffff:") ||
        /^fe[89ab]/i.test(unbracketed) ||
        /^f[cd]/i.test(unbracketed) ||
        unbracketed.startsWith("ff"));

    const isPrivateOrLocal =
      host === "169.254.169.254" ||
      /^169\.254\.\d{1,3}\.\d{1,3}$/.test(host) ||
      host === "metadata.google.internal" ||
      host === "metadata.goog" ||
      host === "instance-data" ||
      host === "100.100.100.200" ||
      host === "localhost" ||
      host.endsWith(".localhost") ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      host.endsWith(".lan") ||
      host.endsWith(".home.arpa") ||
      /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^0\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^192\.168\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/.test(host) ||
      /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\.\d{1,3}\.\d{1,3}$/.test(host) ||
      isIpv6Private ||
      (!unbracketed.includes(":") && (!host.includes(".") || /^(0x[0-9a-f]+|\d+)$/i.test(host)));

    // Block cloud metadata services, private RFC1918/IPv6 ranges, and single-label internal hosts
    if (isPrivateOrLocal) {
      if (process.env.ALLOW_LOCAL_TARGETS !== "true") {
        return false;
      }
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Checks if a webhook URL points back to LShorter's own edge or worker domains (preventing self-loops).
 */
export function isSelfLoopWebhookUrl(urlStr: unknown): boolean {
  if (typeof urlStr !== "string") return true;
  try {
    const trimmed = urlStr.trim();
    const candidate =
      trimmed.startsWith("http://") || trimmed.startsWith("https://")
        ? trimmed
        : `https://${trimmed}`;
    const host = new URL(candidate).hostname.toLowerCase().replace(/\.$/, "");
    const rawWorkerUrl =
      process.env.BACKEND_API_URL ||
      process.env.CLOUDFLARE_WORKER_URL ||
      process.env.NEXT_PUBLIC_BACKEND_API_URL ||
      "";
    let workerHost = "";
    if (rawWorkerUrl) {
      try {
        workerHost = new URL(rawWorkerUrl).hostname.toLowerCase();
      } catch {}
    }
    return (
      host === "lsho.cc" ||
      host.endsWith(".lsho.cc") ||
      host.endsWith(".workers.dev") ||
      Boolean(workerHost && host === workerHost)
    );
  } catch {
    return true;
  }
}

/**
 * Allowed image MIME types for profile images, banners, and QR logos
 */
export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/svg+xml",
] as const;

/**
 * Inspects SVG content to detect Stored XSS and XXE payloads.
 */
export function validateSvgSafety(svgContent: string): {
  isSafe: boolean;
  reason?: string;
} {
  if (!svgContent || typeof svgContent !== "string") {
    return { isSafe: false, reason: "Invalid SVG content." };
  }

  const lower = svgContent.toLowerCase();

  // 1. Detect XXE / Entity expansion
  if (lower.includes("<!doctype") && (lower.includes("entity") || lower.includes("system"))) {
    return { isSafe: false, reason: "SVG contains forbidden XML entity or DOCTYPE definitions." };
  }

  // 2. Detect script, iframe, embed, or object tags
  if (
    /<script[\s\S]*?>[\s\S]*?<\/script>/i.test(lower) ||
    /<(script|iframe|embed|object)[\s/>]/i.test(lower)
  ) {
    return { isSafe: false, reason: "SVG contains embedded <script> or active object tags." };
  }

  // 3. Detect dangerous event handlers (onload, onerror, onclick, including <svg/onload=...>)
  if (/[\s/<]on[a-z]+\s*=/i.test(lower)) {
    return { isSafe: false, reason: "SVG contains active JavaScript event handlers." };
  }

  // 4. Detect javascript: or data:text/html pseudo-protocols in href, xlink:href, or styles
  if (
    /(?:xlink:)?href\s*=\s*['"]?\s*(?:javascript:|data:text\/html|&#)/i.test(lower)
  ) {
    return { isSafe: false, reason: "SVG contains javascript: link targets." };
  }

  // 5. Detect HTML embedding via foreignObject
  if (/<foreignobject[\s\S]*?>/i.test(lower)) {
    return { isSafe: false, reason: "SVG contains <foreignObject> elements." };
  }

  return { isSafe: true };
}

/**
 * In-memory sliding-window rate limiter for sensitive endpoints
 * (e.g. password verification gate, auth actions).
 */
export function checkRateLimit(
  key: string,
  maxAttempts: number = 10,
  windowMs: number = 60000,
): { allowed: boolean; remaining: number; retryAfterSec?: number } {
  const now = Date.now();
  let record = rateLimitMap.get(key);

  if (!record) {
    record = { timestamps: [] };
    rateLimitMap.set(key, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((ts) => now - ts < windowMs);

  if (record.timestamps.length >= maxAttempts) {
    const oldest = record.timestamps[0];
    const retryAfterSec = Math.ceil((windowMs - (now - oldest)) / 1000);
    return { allowed: false, remaining: 0, retryAfterSec: Math.max(1, retryAfterSec) };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxAttempts - record.timestamps.length,
  };
}

/**
 * Reserved slugs that conflict with core Next.js routing, dashboard paths, or static assets.
 */
export const RESERVED_SLUGS = new Set([
  "api",
  "app",
  "auth",
  "dashboard",
  "r",
  "login",
  "signin",
  "signup",
  "register",
  "pricing",
  "features",
  "terms",
  "privacy",
  "refund",
  "settings",
  "admin",
  "status",
  "health",
  "favicon.ico",
  "robots.txt",
  "sitemap.xml",
  "icon-512.png",
]);

/**
 * Validates a custom short link slug:
 * - Alphanumeric, hyphens, and underscores only
 * - Length between 1 and 80 characters
 * - Not in the reserved routes blacklist
 */
export function isValidSlug(slug: unknown): { valid: boolean; error?: string } {
  if (typeof slug !== "string") {
    return { valid: false, error: "Slug must be a string." };
  }
  const clean = slug.trim();
  if (!clean) {
    return { valid: false, error: "Slug cannot be empty." };
  }
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(clean)) {
    return {
      valid: false,
      error: "Slug must contain only alphanumeric characters, hyphens, and underscores (1 to 80 characters).",
    };
  }
  if (RESERVED_SLUGS.has(clean.toLowerCase())) {
    return { valid: false, error: `The slug '${clean}' is reserved and cannot be used.` };
  }
  return { valid: true };
}
