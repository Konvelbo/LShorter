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
