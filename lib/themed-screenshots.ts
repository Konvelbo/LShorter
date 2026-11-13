export const SCREENSHOT_CACHE_VERSION = "20261111_2";

const RENAMED_BASE_PAIRS: Record<string, { light: string; dark: string }> = {
  "/screenshots/dashboard/dashboardwithsidbare.webp": {
    light: "/screenshots/dashboard/dashboardwithsidbare_light1.webp",
    dark: "/screenshots/dashboard/dashboardwithsidbare_dark1.webp",
  },
  "/screenshots/dashboard/dashboard1.webp": {
    light: "/screenshots/dashboard/dashboard1_light1.webp",
    dark: "/screenshots/dashboard/dashboard1_dark1.webp",
  },
};

/**
 * Appends the active cache-busting version query parameter to `/screenshots/` assets
 * matching `images.localPatterns` in `next.config.ts`.
 */
export function withScreenshotCacheBuster(src: string): string {
  if (!src) return src;
  const clean = src.split("?")[0];
  if (!clean.startsWith("/screenshots/")) return src;
  return `${clean}?v=${SCREENSHOT_CACHE_VERSION}`;
}

/**
 * Resolves a base, `_light`/`_dark`, or `_light1`/`_dark1` screenshot path into
 * matching Light and Dark WebP URLs with cache busting applied.
 */
export function getThemedScreenshotPair(src: string): {
  light: string;
  dark: string;
} {
  if (!src) return { light: src, dark: src };
  const withoutQuery = src.split("?")[0];
  const cleanSrc = withoutQuery.replace(/\.png$/i, ".webp");

  const renamedMatch = RENAMED_BASE_PAIRS[cleanSrc];
  if (renamedMatch) {
    return {
      light: withScreenshotCacheBuster(renamedMatch.light),
      dark: withScreenshotCacheBuster(renamedMatch.dark),
    };
  }

  if (/_(?:light|dark)1\./i.test(cleanSrc)) {
    return {
      light: withScreenshotCacheBuster(cleanSrc.replace(/_dark1\./i, "_light1.")),
      dark: withScreenshotCacheBuster(cleanSrc.replace(/_light1\./i, "_dark1.")),
    };
  }

  if (/_(?:light|dark)\./i.test(cleanSrc)) {
    return {
      light: withScreenshotCacheBuster(cleanSrc.replace(/_dark\./i, "_light.")),
      dark: withScreenshotCacheBuster(cleanSrc.replace(/_light\./i, "_dark.")),
    };
  }

  return {
    light: withScreenshotCacheBuster(cleanSrc.replace(/(\.[^.]+)$/, "_light$1")),
    dark: withScreenshotCacheBuster(cleanSrc.replace(/(\.[^.]+)$/, "_dark$1")),
  };
}
