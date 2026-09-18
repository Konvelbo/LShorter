"use client";

import React from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { LockedProFeature } from "../locked-pro-feature";
import { FieldErrorAlert } from "../field-error-alert";

interface SectionProtectionProps {
  isProPlan: boolean;
  password: string;
  setPassword: (pwd: string) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
  isCloaked: boolean;
  setIsCloaked: React.Dispatch<React.SetStateAction<boolean>>;
  hideReferrer: boolean;
  setHideReferrer: React.Dispatch<React.SetStateAction<boolean>>;
  hasClickLimit: boolean;
  setHasClickLimit: React.Dispatch<React.SetStateAction<boolean>>;
  maxClicks: number | string;
  setMaxClicks: (clicks: number | string) => void;
  fallbackUrl: string;
  setFallbackUrl: (url: string) => void;
  expiresAt: string;
  setExpiresAt: (exp: string) => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  checkExpiresAtFormat: (val: string) => string;
}

export function SectionProtection({
  isProPlan,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  isCloaked,
  setIsCloaked,
  hideReferrer,
  setHideReferrer,
  hasClickLimit,
  setHasClickLimit,
  maxClicks,
  setMaxClicks,
  fallbackUrl,
  setFallbackUrl,
  expiresAt,
  setExpiresAt,
  fieldErrors,
  setFieldErrors,
  checkExpiresAtFormat,
}: SectionProtectionProps) {
  return (
    <div
      id="drawer-section-protection"
      className="flex flex-col gap-3 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] p-4 scroll-mt-4 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#222225] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-full bg-brand" />
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            PROTECTION &amp; SÉCURITÉ
          </h3>
        </div>
        <span className="text-[10px] font-medium text-zinc-500 dark:text-neutral-400">
          Mot de passe, Cloaking &amp; Expiration
        </span>
      </div>

      {/* 1. Password Protection (PRO) */}
      <LockedProFeature
        title="Protection par mot de passe"
        description="Verrouillez l'accès avec un mot de passe sécurisé."
        isUnlocked={isProPlan}
      >
        <div className="flex flex-col gap-2 p-3 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              Mot de passe d'accès
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-neutral-400">
              {password ? "Verrouillé" : "Désactivé"}
            </span>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Définir un mot de passe d'accès..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-zinc-50 dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] focus:border-brand text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-9 rounded-[8px] pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <FieldErrorAlert message={fieldErrors.password} />
        </div>
      </LockedProFeature>

      {/* 2. URL Cloaking & Masking (PRO) */}
      <LockedProFeature
        title="Masquage d'URL (Cloaking)"
        description="Affiche la page cible dans un cadre sécurisé sans exposer l'URL d'origine."
        isUnlocked={isProPlan}
      >
        <div className="flex items-center justify-between p-3 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] shadow-xs">
          <div>
            <span className="text-xs font-bold text-zinc-900 dark:text-white block">
              Masquer l'URL de destination
            </span>
            <span className="text-[10.5px] text-zinc-500 dark:text-neutral-400 block">
              Garde votre domaine court dans la barre d'adresse du navigateur.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setIsCloaked((prev) => !prev)}
            className={cn(
              "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
              isCloaked ? "bg-brand" : "bg-zinc-200 dark:bg-neutral-800",
            )}
          >
            <span
              className={cn(
                "w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform",
                isCloaked ? "translate-x-1" : "-translate-x-5",
              )}
            />
          </button>
        </div>
      </LockedProFeature>

      {/* 3. Referrer Hiding (PRO) */}
      <LockedProFeature
        title="Masquage de l'en-tête Referrer"
        description="Supprime l'en-tête HTTP Referrer pour garantir une redirection totalement anonyme."
        isUnlocked={isProPlan}
      >
        <div className="flex items-center justify-between p-3 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] shadow-xs">
          <div>
            <span className="text-xs font-bold text-zinc-900 dark:text-white block">
              Masquer l'en-tête HTTP Referrer
            </span>
            <span className="text-[10.5px] text-zinc-500 dark:text-neutral-400 block">
              Supprime l'en-tête Referrer pour garantir une redirection anonyme.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setHideReferrer((prev) => !prev)}
            className={cn(
              "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
              hideReferrer ? "bg-brand" : "bg-zinc-200 dark:bg-neutral-800",
            )}
          >
            <span
              className={cn(
                "w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform",
                hideReferrer ? "translate-x-1" : "-translate-x-5",
              )}
            />
          </button>
        </div>
      </LockedProFeature>

      {/* 4. Click Limits (PRO) */}
      <LockedProFeature
        title="Limite de clics maximale"
        description="Désactive automatiquement le lien après avoir atteint un quota défini."
        isUnlocked={isProPlan}
      >
        <div className="flex flex-col gap-2.5 p-3 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              Activer la limite de clics
            </span>
            <button
              type="button"
              onClick={() => setHasClickLimit((prev) => !prev)}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
                hasClickLimit ? "bg-brand" : "bg-zinc-200 dark:bg-neutral-800",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform",
                  hasClickLimit ? "translate-x-1" : "-translate-x-5",
                )}
              />
            </button>
          </div>
          {hasClickLimit && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 animate-in fade-in">
              <div>
                <label className="block text-[10px] font-bold text-zinc-700 dark:text-neutral-300 mb-1">
                  Clics maximum
                </label>
                <Input
                  type="number"
                  placeholder="e.g. 500"
                  value={maxClicks}
                  onChange={(e) => setMaxClicks(e.target.value)}
                  className="bg-zinc-50 dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-white text-xs h-8.5 rounded-[8px]"
                />
                <FieldErrorAlert message={fieldErrors.maxClicks} />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-zinc-700 dark:text-neutral-300 mb-1">
                  URL de redirection de secours
                </label>
                <Input
                  placeholder="https://..."
                  value={fallbackUrl}
                  onChange={(e) => setFallbackUrl(e.target.value)}
                  className="bg-zinc-50 dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] text-zinc-900 dark:text-white text-xs h-8.5 rounded-[8px]"
                />
                <FieldErrorAlert message={fieldErrors.fallbackUrl} />
              </div>
            </div>
          )}
        </div>
      </LockedProFeature>

      {/* 5. Automatic Expiration Date (PRO) */}
      <LockedProFeature
        title="Expiration automatique programmée"
        description="Planifiez la date et l'heure exacte de fin de vie du lien."
        isUnlocked={isProPlan}
      >
        <div className="flex flex-col gap-2 p-3 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] shadow-xs">
          <label className="block text-xs font-bold text-zinc-900 dark:text-white">
            Date &amp; Heure d'expiration
          </label>
          <Input
            type="datetime-local"
            value={expiresAt}
            onChange={(e) => {
              setExpiresAt(e.target.value);
              if (fieldErrors.expiresAt) {
                setFieldErrors((prev) => ({
                  ...prev,
                  expiresAt: checkExpiresAtFormat(e.target.value),
                }));
              }
            }}
            className={cn(
              "bg-zinc-50 dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] focus:border-brand text-zinc-900 dark:text-white text-xs h-9 rounded-[8px]",
              fieldErrors.expiresAt && "border-red-500/60 bg-red-500/5",
            )}
          />
          <FieldErrorAlert message={fieldErrors.expiresAt} />
          <p className="text-[10px] text-zinc-500 dark:text-neutral-500">
            Après cette date, les clics seront automatiquement redirigés vers la page "Lien expiré".
          </p>
        </div>
      </LockedProFeature>
    </div>
  );
}
