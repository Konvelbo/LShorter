export type Locale = "en" | "fr";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_COOKIE = "lsh_locale";
export const LOCALE_STORAGE_KEY = "lshorter_locale_v1";

/**
 * Normalizes any stored or browser language value (e.g. "fr", "fr-FR",
 * "Français", "English (US)", "en-GB") into a strict Locale or null.
 */
export function normalizeLocale(raw?: string | null): Locale | null {
  if (!raw || typeof raw !== "string") return null;
  const cleaned = raw.trim().toLowerCase();
  if (!cleaned) return null;
  if (
    cleaned === "fr" ||
    cleaned.startsWith("fr-") ||
    cleaned.startsWith("fr_") ||
    cleaned.includes("fran") ||
    cleaned.includes("french")
  ) {
    return "fr";
  }
  if (
    cleaned === "en" ||
    cleaned.startsWith("en-") ||
    cleaned.startsWith("en_") ||
    cleaned.includes("english") ||
    cleaned.includes("anglais")
  ) {
    return "en";
  }
  return null;
}

/**
 * Parses an HTTP Accept-Language header and picks "fr" if French is preferred
 * before English, otherwise defaults to "en".
 */
export function detectLocaleFromAcceptLanguage(
  acceptLanguage?: string | null
): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE;
  const parts = acceptLanguage
    .split(",")
    .map((entry) => {
      const [tagPart, ...params] = entry.trim().split(";");
      const qParam = params.find((p) => p.trim().startsWith("q="));
      const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1;
      return {
        tag: tagPart.trim().toLowerCase(),
        q: Number.isFinite(q) ? q : 0,
      };
    })
    .sort((a, b) => b.q - a.q);

  for (const { tag } of parts) {
    if (tag.startsWith("fr")) return "fr";
    if (tag.startsWith("en")) return "en";
  }
  return DEFAULT_LOCALE;
}
