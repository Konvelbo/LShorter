export interface ParsedPathLockRoutes {
  /** "whitelist" (only allowed routes accessible) or "blacklist" (all accessible except blocked routes) */
  filterType: "whitelist" | "blacklist";
  /** True when empty or an explicit wildcard/root token ("/", "*", "/*", "/**") allows the entire same-site funnel */
  allowAllSubpaths: boolean;
  /** True when a non-empty entry explicitly resolved to root ("/" or "*" or URL with "/" pathname) */
  hasExplicitRoot: boolean;
  /** Deduplicated normalized route prefixes without leading/trailing slashes (lowercased) */
  routes: string[];
  /** Deduplicated normalized blocked route prefixes without leading/trailing slashes (lowercased) */
  blockedRoutes: string[];
  /** True when the raw prefix string is empty or whitespace-only */
  isEmpty: boolean;
}

export interface PathLockPathCheckOptions {
  mode?: string | null;
  attemptPathOrUrl: string;
  rawPrefix?: string | null;
  slug?: string | null;
  targetPaths?: Array<string | null | undefined>;
}

/**
 * Normalizes a candidate URL or path into a canonical lowercase relative path segment
 * without scheme/host, query parameters, hash fragments, or leading/trailing slashes.
 */
export function normalizePathLockAttempt(rawPathOrUrl: string): string {
  const trimmed = String(rawPathOrUrl || "").trim();
  if (!trimmed) return "";

  let pathPart = trimmed;
  if (/^(https?:)?\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed.startsWith("//") ? `https:${trimmed}` : trimmed);
      pathPart = u.pathname || "/";
    } catch {
      pathPart = trimmed.replace(/^(https?:)?\/\/[^/?#]+/i, "") || "/";
    }
  }

  pathPart = pathPart.split(/[?#]/)[0] || "";
  return pathPart
    .replace(/\/{2,}/g, "/")
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

/**
 * Parses user-configured PathLock routes (comma, semicolon, pipe, newline, or whitespace separated).
 * Supports leading/trailing slashes, pasted full URLs, query/hash stripping, trailing /* wildcards,
 * and block prefixes (e.g. `block:/pricing,/admin` or `!/admin`).
 */
export function parsePathLockRoutes(rawPrefix?: string | null): ParsedPathLockRoutes {
  let trimmedRaw = String(rawPrefix ?? "").trim();
  if (!trimmedRaw) {
    return {
      filterType: "whitelist",
      allowAllSubpaths: true,
      hasExplicitRoot: false,
      routes: [],
      blockedRoutes: [],
      isEmpty: true,
    };
  }

  let filterType: "whitelist" | "blacklist" = "whitelist";
  if (/^(block:|blacklist:|deny:)/i.test(trimmedRaw)) {
    filterType = "blacklist";
    trimmedRaw = trimmedRaw.replace(/^(block:|blacklist:|deny:)/i, "").trim();
  }

  const tokens = trimmedRaw.split(/[,\n\r;| \t]+/);
  let hasWildcard = false;
  let hasExplicitRoot = false;
  const routes: string[] = [];
  const blockedRoutes: string[] = [];
  const seenRoutes = new Set<string>();
  const seenBlocked = new Set<string>();

  for (const rawToken of tokens) {
    let entry = rawToken.trim();
    if (!entry) continue;

    let isExplicitBlock = false;
    if (entry.startsWith("!") || entry.startsWith("-") || /^block:/i.test(entry)) {
      isExplicitBlock = true;
      entry = entry.replace(/^(!+|-+|block:)/i, "").trim();
    }

    if (/^(https?:)?\/\//i.test(entry)) {
      try {
        const u = new URL(entry.startsWith("//") ? `https:${entry}` : entry);
        entry = u.pathname || "/";
      } catch {
        entry = entry.replace(/^(https?:)?\/\/[^/?#]+/i, "") || "/";
      }
    }

    entry = (entry.split(/[?#]/)[0] || "").trim().replace(/\/{2,}/g, "/");

    if (entry === "*" || entry === "/*" || entry === "/**" || entry === "**") {
      hasWildcard = true;
      hasExplicitRoot = true;
      continue;
    }

    if (entry === "/") {
      if (isExplicitBlock || filterType === "blacklist") {
        if (!seenBlocked.has("")) {
          seenBlocked.add("");
          blockedRoutes.push("");
        }
      } else {
        hasExplicitRoot = true;
      }
      continue;
    }

    entry = entry.replace(/\/\*+$/, "").replace(/\*+$/, "");
    const clean = entry.replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();

    if (!clean) {
      if (isExplicitBlock || filterType === "blacklist") {
        if (!seenBlocked.has("")) {
          seenBlocked.add("");
          blockedRoutes.push("");
        }
      } else {
        hasExplicitRoot = true;
      }
      continue;
    }

    if (isExplicitBlock || filterType === "blacklist") {
      if (!seenBlocked.has(clean)) {
        seenBlocked.add(clean);
        blockedRoutes.push(clean);
      }
    } else {
      if (!seenRoutes.has(clean)) {
        seenRoutes.add(clean);
        routes.push(clean);
      }
    }
  }

  // If filterType was whitelist, but all specified tokens were explicit blocks (!/admin), treat as blacklist
  if (filterType === "whitelist" && blockedRoutes.length > 0 && routes.length === 0) {
    filterType = "blacklist";
  }

  const allowAllSubpaths =
    filterType === "blacklist"
      ? true
      : hasWildcard || (hasExplicitRoot && routes.length === 0);

  return {
    filterType,
    allowAllSubpaths,
    hasExplicitRoot,
    routes,
    blockedRoutes,
    isEmpty: false,
  };
}

/**
 * Determines whether a same-site pathname or URL is permitted by the configured PathLock mode and routes.
 */
export function isPathAllowedByPathLock({
  mode,
  attemptPathOrUrl,
  rawPrefix,
  slug,
  targetPaths,
}: PathLockPathCheckOptions): boolean {
  const normalizedMode = String(mode || "strict").trim().toLowerCase();
  if (normalizedMode === "off") return true;

  const raw = String(attemptPathOrUrl || "").trim();
  if (!raw || raw === "about:blank" || raw.startsWith("chrome-error")) {
    return true;
  }

  const cleanAttempt = normalizePathLockAttempt(raw);
  if (slug) {
    const cleanSlug = String(slug)
      .trim()
      .toLowerCase()
      .replace(/^\/+|\/+$/g, "");
    if (
      cleanAttempt === `r/${cleanSlug}/proxy` ||
      cleanAttempt === `r/${cleanSlug}/view` ||
      cleanAttempt === "blank"
    ) {
      return true;
    }
  }

  const baseTargets = new Set<string>();
  for (const t of targetPaths || []) {
    if (t !== null && t !== undefined) {
      baseTargets.add(normalizePathLockAttempt(t));
    }
  }

  const parsed = parsePathLockRoutes(rawPrefix);

  if (normalizedMode === "strict") {
    if (parsed.blockedRoutes.length > 0) {
      const isBlocked = parsed.blockedRoutes.some((b) => {
        if (b === "" || b === "/") return cleanAttempt === "";
        return cleanAttempt === b || cleanAttempt.startsWith(`${b}/`);
      });
      if (isBlocked) return false;
    }

    return (
      baseTargets.has(cleanAttempt) ||
      (parsed.hasExplicitRoot && cleanAttempt === "") ||
      parsed.routes.includes(cleanAttempt)
    );
  }

  if (normalizedMode === "funnel") {
    // 1. Primary check: blocked routes always win
    if (parsed.blockedRoutes.length > 0) {
      const isBlocked = parsed.blockedRoutes.some((b) => {
        if (b === "" || b === "/") return cleanAttempt === "";
        return cleanAttempt === b || cleanAttempt.startsWith(`${b}/`);
      });
      if (isBlocked) {
        return false;
      }
    }

    // 2. Blacklist mode: anything not explicitly blocked is permitted
    if (parsed.filterType === "blacklist") {
      return true;
    }

    // 3. Whitelist mode: only base target and explicitly allowed routes are permitted
    if (parsed.allowAllSubpaths) {
      return true;
    }

    if (baseTargets.has(cleanAttempt)) {
      return true;
    }

    if (cleanAttempt === "" && (parsed.hasExplicitRoot || baseTargets.has(""))) {
      return true;
    }

    const isAllowedPrefix = parsed.routes.some(
      (r) => cleanAttempt === r || cleanAttempt.startsWith(`${r}/`),
    );
    if (isAllowedPrefix) return true;

    const isHexPalette = /^[0-9a-f]{6}(-[0-9a-f]{6})+$/i.test(cleanAttempt);
    if (
      isHexPalette &&
      parsed.routes.some((r) => r === "generate" || r.startsWith("generate"))
    ) {
      return true;
    }

    return false;
  }

  return true;
}

export interface PathLockNavigableRoute {
  label: string;
  path: string;
  url: string;
  isTarget: boolean;
}

export interface PathLockFallbackResolution {
  enabled: boolean;
  fallbackUrl: string | null;
  fallbackPath: string | null;
}

/**
 * Normalizes a relative fallback path (e.g. "/create/") to canonical "/create" or "/".
 * Rejects protocol-relative ("//..."), external URLs, whitespace, or control chars.
 */
export function normalizePathLockFallbackPath(raw?: string | null): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (
    !s.startsWith("/") ||
    s.startsWith("//") ||
    /[\s\x00-\x1F\x7F]/.test(s) ||
    /^\/?(javascript|data|vbscript|file):/i.test(s)
  ) {
    return null;
  }
  const clean = s.replace(/\/{2,}/g, "/");
  return clean === "/" ? "/" : clean.replace(/\/+$/, "");
}

/**
 * Returns the deduplicated list of navigable authorized routes for a PathLock link.
 * Used both for clickable route pills on the Security Gate (Option 1) and for the
 * pre-populated single-choice Fallback dropdown in Tunnel mode (Option 3).
 */
export function getPathLockNavigableRoutes(opts: {
  targetUrl: string;
  rawPrefix?: string | null;
  mode?: string | null;
  slug?: string | null;
}): PathLockNavigableRoute[] {
  const normalizedMode = String(opts.mode || "strict").trim().toLowerCase();
  const rawTarget = String(opts.targetUrl || "").trim();
  if (!rawTarget) return [];

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(
      rawTarget.startsWith("http://") || rawTarget.startsWith("https://")
        ? rawTarget
        : `https://${rawTarget}`,
    );
  } catch {
    return [];
  }

  const targetPath =
    parsedTarget.pathname === "/" || !parsedTarget.pathname
      ? "/"
      : parsedTarget.pathname.replace(/\/+$/, "");
  const parsed = parsePathLockRoutes(opts.rawPrefix);
  const out: PathLockNavigableRoute[] = [];
  const seen = new Set<string>();

  const pushCandidate = (candidatePath: string, fullUrl: string, isTarget: boolean) => {
    const cleanPath =
      candidatePath === "/" || !candidatePath
        ? "/"
        : `/${candidatePath.replace(/^\/+/, "").replace(/\/+$/, "")}`;
    const key = cleanPath.toLowerCase();
    if (seen.has(key)) return;

    const allowed = isPathAllowedByPathLock({
      mode: normalizedMode,
      attemptPathOrUrl: cleanPath,
      rawPrefix: opts.rawPrefix,
      slug: opts.slug,
      targetPaths: [targetPath],
    });
    if (!allowed) return;

    seen.add(key);
    out.push({
      label: cleanPath,
      path: cleanPath,
      url: fullUrl,
      isTarget,
    });
  };

  // Always prefer the configured target page first when allowed
  pushCandidate(targetPath, parsedTarget.href, true);

  // In Tunnel whitelist mode, include each explicitly configured allowed route
  if (normalizedMode === "funnel" && parsed.filterType === "whitelist") {
    for (const r of parsed.routes) {
      const routePath = r ? `/${r}` : "/";
      pushCandidate(routePath, `${parsedTarget.origin}${routePath}`, false);
    }
  }

  return out;
}

/**
 * Resolves a verified, loop-safe fallback destination URL for PathLock Tunnel mode.
 * Returns `enabled: false` (degrading safely to the Security Gate) whenever mode is not "funnel",
 * action is not "fallback", or no allowed target route exists (preventing infinite redirect loops).
 */
export function resolveSafePathLockFallbackUrl(opts: {
  targetUrl: string;
  rawPrefix?: string | null;
  mode?: string | null;
  action?: string | null;
  fallbackPath?: string | null;
  slug?: string | null;
}): PathLockFallbackResolution {
  const normalizedMode = String(opts.mode || "strict").trim().toLowerCase();
  const normalizedAction = String(opts.action || "block").trim().toLowerCase();

  if (normalizedMode !== "funnel" || normalizedAction !== "fallback") {
    return { enabled: false, fallbackUrl: null, fallbackPath: null };
  }

  const rawTarget = String(opts.targetUrl || "").trim();
  if (!rawTarget) {
    return { enabled: false, fallbackUrl: null, fallbackPath: null };
  }

  let parsedTarget: URL;
  try {
    parsedTarget = new URL(
      rawTarget.startsWith("http://") || rawTarget.startsWith("https://")
        ? rawTarget
        : `https://${rawTarget}`,
    );
  } catch {
    return { enabled: false, fallbackUrl: null, fallbackPath: null };
  }

  const targetPath =
    parsedTarget.pathname === "/" || !parsedTarget.pathname
      ? "/"
      : parsedTarget.pathname.replace(/\/+$/, "");

  // 1. Explicit single-choice fallback path if valid and allowed
  const cleanFallback = normalizePathLockFallbackPath(opts.fallbackPath);
  if (cleanFallback) {
    const isExplicitAllowed = isPathAllowedByPathLock({
      mode: "funnel",
      attemptPathOrUrl: cleanFallback,
      rawPrefix: opts.rawPrefix,
      slug: opts.slug,
      targetPaths: [targetPath],
    });
    if (isExplicitAllowed) {
      const targetNorm = targetPath.toLowerCase();
      const url =
        cleanFallback.toLowerCase() === targetNorm
          ? parsedTarget.href
          : `${parsedTarget.origin}${cleanFallback}`;
      return { enabled: true, fallbackUrl: url, fallbackPath: cleanFallback };
    }
  }

  // 2. Fallback to any safe navigable route (prefers targetUrl first, then first allowed route)
  const navigable = getPathLockNavigableRoutes({
    targetUrl: parsedTarget.href,
    rawPrefix: opts.rawPrefix,
    mode: "funnel",
    slug: opts.slug,
  });
  if (navigable.length > 0) {
    return {
      enabled: true,
      fallbackUrl: navigable[0].url,
      fallbackPath: navigable[0].path,
    };
  }

  // 3. No allowed route exists (e.g. blacklist blocking "/") -> degrade safely to block gate
  return { enabled: false, fallbackUrl: null, fallbackPath: null };
}
