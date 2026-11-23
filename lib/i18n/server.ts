import { cookies, headers } from "next/headers";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  detectLocaleFromAcceptLanguage,
  normalizeLocale,
  type Locale,
} from "./types";

/**
 * Reads the active locale on the server (cookie first, then Accept-Language)
 * so <html lang> and initial SSR render match the user's language with zero FOUC.
 */
export async function getServerLocale(): Promise<Locale> {
  try {
    const cookieStore = await cookies();
    const cookieLocale = normalizeLocale(cookieStore.get(LOCALE_COOKIE)?.value);
    if (cookieLocale) return cookieLocale;
  } catch {
    // Ignore outside dynamic request context
  }

  try {
    const headerStore = await headers();
    const acceptLang = headerStore.get("accept-language");
    if (acceptLang) return detectLocaleFromAcceptLanguage(acceptLang);
  } catch {
    // Ignore outside dynamic request context
  }

  return DEFAULT_LOCALE;
}
