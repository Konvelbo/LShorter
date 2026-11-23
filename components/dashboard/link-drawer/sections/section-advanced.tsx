"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { DrawerSwitch } from "../drawer-switch";
import { useI18n } from "@/components/providers/i18n-provider";

interface SectionAdvancedProps {
  redirectType: "302" | "301" | "307";
  setRedirectType: (type: "302" | "301" | "307") => void;
  passParams: boolean;
  setPassParams: React.Dispatch<React.SetStateAction<boolean>>;
  isActive?: boolean;
  setIsActive?: React.Dispatch<React.SetStateAction<boolean>>;
}

export function SectionAdvanced({
  redirectType,
  setRedirectType,
  passParams,
  setPassParams,
  isActive = true,
  setIsActive,
}: SectionAdvancedProps) {
  const { locale } = useI18n();
  const isFr = locale === "fr";

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
          {isFr ? "Avancé" : "Advanced"}
        </h2>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mt-1">
          {isFr
            ? "Codes de statut de redirection, transfert des paramètres d'URL et statut de disponibilité du lien."
            : "Redirect status codes, query parameters forwarding, and link availability status."}
        </p>
      </div>

      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {/* 1. HTTP REDIRECTION CODE */}
        <div className="py-4">
          <label className="block text-sm font-bold text-zinc-950 dark:text-white mb-2">
            {isFr ? "Type de redirection" : "Redirect type"}
          </label>
          <div className="flex gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a]">
            {[
              { code: "302", label: isFr ? "302 Temporaire" : "302 Temporary" },
              { code: "301", label: isFr ? "301 Permanente" : "301 Permanent" },
              { code: "307", label: isFr ? "307 Stricte" : "307 Strict" },
            ].map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setRedirectType(item.code as any)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-md text-xs transition-all text-center cursor-pointer",
                  redirectType === item.code
                    ? "bg-white dark:bg-[#0e0f12] text-zinc-950 dark:text-white shadow-sm border border-[#0066FF] dark:border-[#3b82f6] font-bold"
                    : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-2 leading-relaxed">
            {redirectType === "302" &&
              (isFr
                ? "Le code 302 préserve la précision du comptage des clics et évite le cache agressif des navigateurs. Recommandé pour la plupart des liens."
                : "302 keeps click counts accurate and avoids aggressive browser caching. Recommended for most links.")}
            {redirectType === "301" &&
              (isFr
                ? "Le code 301 transmet définitivement l'autorité SEO. Les navigateurs mettent cette redirection en cache localement."
                : "301 passes SEO link equity permanently. Browsers cache this redirect locally.")}
            {redirectType === "307" &&
              (isFr
                ? "Le code 307 préserve strictement la méthode HTTP (GET, POST). Idéal pour les webhooks et API."
                : "307 strictly preserves HTTP method (GET, POST). Ideal for webhooks and APIs.")}
          </p>
        </div>

        {/* 2. FORWARD QUERY PARAMETERS */}
        <div className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-bold text-zinc-950 dark:text-white">
                {isFr ? "Transférer les paramètres d'URL" : "Forward query parameters"}
              </span>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
                {isFr
                  ? "Transmet ?ref=… et les autres paramètres de requête vers l'URL de destination."
                  : "Pass ?ref=… and additional query strings on to the destination URL."}
              </p>
            </div>
            <DrawerSwitch
              checked={passParams}
              onChange={setPassParams}
              aria-label={isFr ? "Activer le transfert des paramètres d'URL" : "Toggle query parameter forwarding"}
            />
          </div>
        </div>

        {/* 3. LINK IS ACTIVE */}
        {setIsActive && (
          <div className="py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <span className="text-sm font-bold text-zinc-950 dark:text-white">
                  {isFr ? "Lien actif" : "Link is active"}
                </span>
                <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
                  {isFr
                    ? "Désactivez pour mettre la redirection en pause et afficher un avis de suspension."
                    : "Turn off to pause the redirect and show a suspension notice."}
                </p>
              </div>
              <DrawerSwitch
                checked={isActive}
                onChange={setIsActive}
                aria-label={isFr ? "Basculer le statut actif" : "Toggle active status"}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
export { SectionAdvanced as SectionBannerAdvanced };
