export interface ParsedPathLockRoutes {
  /** True when empty or an explicit wildcard/root token ("/", "*", "/*", "/**") allows the entire same-site funnel */
  allowAllSubpaths: boolean;
  /** True when a non-empty entry explicitly resolved to root ("/" or "*" or URL with "/" pathname) */
  hasExplicitRoot: boolean;
  /** Deduplicated normalized route prefixes without leading/trailing slashes (lowercased) */
  routes: string[];
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
 * Supports leading/trailing slashes, pasted full URLs, query/hash stripping, and trailing /* wildcards.
 */
export function parsePathLockRoutes(rawPrefix?: string | null): ParsedPathLockRoutes {
  const trimmedRaw = String(rawPrefix ?? "").trim();
  if (!trimmedRaw) {
    return {
      allowAllSubpaths: true,
      hasExplicitRoot: false,
      routes: [],
      isEmpty: true,
    };
  }

  const tokens = trimmedRaw.split(/[,\n\r;| \t]+/);
  let hasWildcard = false;
  let hasExplicitRoot = false;
  const routes: string[] = [];
  const seen = new Set<string>();

  for (const rawToken of tokens) {
    let entry = rawToken.trim();
    if (!entry) continue;

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
      hasExplicitRoot = true;
      continue;
    }

    entry = entry.replace(/\/\*+$/, "").replace(/\*+$/, "");
    const clean = entry.replace(/^\/+/, "").replace(/\/+$/, "").toLowerCase();

    if (!clean) {
      hasExplicitRoot = true;
      continue;
    }

    if (!seen.has(clean)) {
      seen.add(clean);
      routes.push(clean);
    }
  }

  return {
    allowAllSubpaths: hasWildcard || (hasExplicitRoot && routes.length === 0),
    hasExplicitRoot,
    routes,
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
    return (
      baseTargets.has(cleanAttempt) ||
      (parsed.hasExplicitRoot && cleanAttempt === "") ||
      parsed.routes.includes(cleanAttempt)
    );
  }

  if (normalizedMode === "funnel") {
    if (
      parsed.allowAllSubpaths ||
      cleanAttempt === "" ||
      baseTargets.has(cleanAttempt)
    ) {
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
