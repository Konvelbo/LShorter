"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  normalizeLocale,
  type Locale,
} from "@/lib/i18n/types";
import {
  getCommonTranslation,
  type CommonKey,
} from "@/lib/i18n/dictionaries/common";

interface I18nContextValue {
  locale: Locale;
  isFr: boolean;
  setLocale: (next: Locale, opts?: { syncRemote?: boolean }) => void;
  toggleLocale: () => void;
  t: (key: CommonKey) => string;
  /** Lightweight co-located EN/FR helper — keeps route translations cleanly code-split */
  tr: (en: string, fr: string) => string;
  formatNumber: (value: number, options?: Intl.NumberFormatOptions) => string;
  formatDate: (
    date: Date | number | string,
    options?: Intl.DateTimeFormatOptions
  ) => string;
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  isFr: false,
  setLocale: () => {},
  toggleLocale: () => {},
  t: (key) => getCommonTranslation(DEFAULT_LOCALE, key),
  tr: (en) => en,
  formatNumber: (value, opts) => value.toLocaleString("en-US", opts),
  formatDate: (d, opts) => new Date(d).toLocaleDateString("en-US", opts),
});

function readCookieLocale(): Locale | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp(`(?:^|;\\s*)${LOCALE_COOKIE}=([^;]+)`)
  );
  return normalizeLocale(match ? decodeURIComponent(match[1]) : null);
}

function writeClientLocalePersistence(next: Locale) {
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore private browsing quota errors
    }
  }
  if (typeof document !== "undefined") {
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=31536000; SameSite=Lax`;
    document.documentElement.lang = next;
  }
}

/**
 * Isolated Convex language sync child — mounted ONLY when the user is authenticated,
 * so unauthenticated landing-page visitors open zero Convex queries on `/`.
 */
function AuthenticatedLocaleSync({
  userId,
  email,
  hasExplicitLocalChoiceRef,
  locale,
  applyLocaleLocally,
}: {
  userId: string;
  email: string;
  hasExplicitLocalChoiceRef: React.MutableRefObject<boolean>;
  locale: Locale;
  applyLocaleLocally: (next: Locale) => void;
}) {
  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId || email ? { userId: userId || email, email: email || undefined } : "skip"
  );
  const syncedFromProfileRef = useRef(false);

  useEffect(() => {
    if (syncedFromProfileRef.current) return;
    if (!convexUser) return;
    const remoteLocale = normalizeLocale(
      convexUser.language || convexUser.onboarding?.language
    );
    syncedFromProfileRef.current = true;
    if (remoteLocale && !hasExplicitLocalChoiceRef.current && remoteLocale !== locale) {
      applyLocaleLocally(remoteLocale);
    }
  }, [convexUser, hasExplicitLocalChoiceRef, locale, applyLocaleLocally]);

  return null;
}

export function I18nProvider({
  initialLocale = DEFAULT_LOCALE,
  children,
}: {
  initialLocale?: Locale;
  children: React.ReactNode;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const hasExplicitLocalChoiceRef = useRef<boolean>(false);

  const { data: session, status: sessionStatus } = useSession();
  const updateProfilePreferences = useMutation(
    api.users.updateProfilePreferences
  );

  const sessionUser = session?.user as
    | { id?: string; userId?: string; email?: string | null; userNotFound?: boolean }
    | undefined;
  const isAuthenticated =
    sessionStatus === "authenticated" &&
    Boolean(sessionUser) &&
    !sessionUser?.userNotFound;
  const authUserId = sessionUser?.id || sessionUser?.userId || sessionUser?.email || "";
  const authEmail = sessionUser?.email || "";

  const applyLocaleLocally = useCallback((next: Locale) => {
    setLocaleState(next);
    writeClientLocalePersistence(next);
  }, []);

  // Reconcile localStorage / cookie / navigator language once on client mount
  useEffect(() => {
    let stored: Locale | null = null;
    try {
      stored = normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY));
    } catch {
      stored = null;
    }
    const cookieVal = readCookieLocale();

    if (stored || cookieVal) {
      hasExplicitLocalChoiceRef.current = true;
      const chosen = cookieVal || stored || initialLocale;
      if (chosen !== locale) {
        setLocaleState(chosen);
      }
      writeClientLocalePersistence(chosen);
    } else if (typeof navigator !== "undefined") {
      const browserLocale = normalizeLocale(navigator.language) || initialLocale;
      if (browserLocale !== locale) {
        setLocaleState(browserLocale);
      }
      document.documentElement.lang = browserLocale;
    }

    // Keep multiple tabs synchronized in real time
    const onStorage = (e: StorageEvent) => {
      if (e.key === LOCALE_STORAGE_KEY) {
        const next = normalizeLocale(e.newValue);
        if (next) {
          hasExplicitLocalChoiceRef.current = true;
          setLocaleState(next);
          document.documentElement.lang = next;
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setLocale = useCallback(
    (next: Locale, opts?: { syncRemote?: boolean }) => {
      hasExplicitLocalChoiceRef.current = true;
      applyLocaleLocally(next);

      const shouldSyncRemote = opts?.syncRemote !== false;
      if (shouldSyncRemote && isAuthenticated && (authUserId || authEmail)) {
        updateProfilePreferences({
          userId: authUserId || authEmail,
          email: authEmail || undefined,
          language: next,
        }).catch(() => {
          // Non-fatal: local cookie + localStorage already persisted
        });
      }
    },
    [applyLocaleLocally, isAuthenticated, authUserId, authEmail, updateProfilePreferences]
  );

  const toggleLocale = useCallback(() => {
    setLocale(locale === "en" ? "fr" : "en");
  }, [locale, setLocale]);

  const t = useCallback(
    (key: CommonKey) => getCommonTranslation(locale, key),
    [locale]
  );

  const tr = useCallback(
    (en: string, fr: string) => (locale === "fr" ? fr : en),
    [locale]
  );

  const formatNumber = useCallback(
    (value: number, options?: Intl.NumberFormatOptions) =>
      value.toLocaleString(locale === "fr" ? "fr-FR" : "en-US", options),
    [locale]
  );

  const formatDate = useCallback(
    (date: Date | number | string, options?: Intl.DateTimeFormatOptions) =>
      new Date(date).toLocaleDateString(
        locale === "fr" ? "fr-FR" : "en-US",
        options
      ),
    [locale]
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      isFr: locale === "fr",
      setLocale,
      toggleLocale,
      t,
      tr,
      formatNumber,
      formatDate,
    }),
    [locale, setLocale, toggleLocale, t, tr, formatNumber, formatDate]
  );

  return (
    <I18nContext.Provider value={value}>
      {isAuthenticated && (authUserId || authEmail) && (
        <AuthenticatedLocaleSync
          userId={authUserId}
          email={authEmail}
          hasExplicitLocalChoiceRef={hasExplicitLocalChoiceRef}
          locale={locale}
          applyLocaleLocally={applyLocaleLocally}
        />
      )}
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
