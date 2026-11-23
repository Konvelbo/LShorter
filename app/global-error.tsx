"use client";

import React, { useEffect, useState } from "react";
import { AlertOctagon, RefreshCw } from "lucide-react";
import { LOCALE_STORAGE_KEY, normalizeLocale } from "@/lib/i18n/types";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const [locale, setLocale] = useState<"en" | "fr">("en");

  useEffect(() => {
    console.error("[Next.js Global Error]", error);
    try {
      const stored = normalizeLocale(localStorage.getItem(LOCALE_STORAGE_KEY));
      if (stored === "fr" || stored === "en") {
        setLocale(stored);
      } else if (typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("fr")) {
        setLocale("fr");
      }
    } catch {}
  }, [error]);

  const isFr = locale === "fr";

  return (
    <html lang={locale} className="dark">
      <body className="min-h-screen bg-[#09090b] text-[#fafafa] flex items-center justify-center p-4 font-sans antialiased">
        <div className="max-w-md w-full rounded-[14px] bg-[#141416] border border-[#27272a] p-6 sm:p-8 flex flex-col items-center text-center shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 flex items-center justify-center mb-4">
            <AlertOctagon className="w-6 h-6" />
          </div>

          <h1 className="text-xl font-bold text-white mb-2">
            {isFr ? "Erreur Critique de l'Application" : "Critical Application Error"}
          </h1>
          <p className="text-xs text-neutral-400 mb-6 leading-relaxed">
            {isFr
              ? "Une interruption inattendue s'est produite. Veuillez rafraîchir l'application."
              : "An unexpected interruption occurred. Please refresh the application."}
          </p>

          <button
            onClick={() => reset()}
            className="w-full h-10 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isFr ? "Rafraîchir l'application" : "Refresh application"}</span>
          </button>
        </div>
      </body>
    </html>
  );
}
