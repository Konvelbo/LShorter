"use client";

import React, { useState, useId, useEffect, useRef, useMemo } from "react";
import { Eye, EyeOff, Shield, ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawerSwitch } from "../drawer-switch";
import { FieldErrorAlert } from "../field-error-alert";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { Input } from "@/components/ui/input";
import { type Tag as EmblorTag, TagInput } from "emblor";
import {
  getPathLockNavigableRoutes,
  parsePathLockRoutes,
} from "@/lib/pathlock-routes";
import { useI18n } from "@/components/providers/i18n-provider";

interface SectionProtectionExpiryProps {
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
  pathLockMode: "off" | "strict" | "funnel" | string;
  setPathLockMode: (mode: "off" | "strict" | "funnel") => void;
  pathLockPrefix: string;
  setPathLockPrefix: (prefix: string) => void;
  pathLockMessage: string;
  setPathLockMessage: (msg: string) => void;
  pathLockPassword: string;
  setPathLockPassword: (pwd: string) => void;
  pathLockAction: "block" | "fallback";
  setPathLockAction: (action: "block" | "fallback") => void;
  pathLockFallbackPath: string;
  setPathLockFallbackPath: (path: string) => void;
  targetUrl?: string;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  checkExpiresAtFormat: (val: string) => string;
}

export function SectionProtectionExpiry({
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
  pathLockMode,
  setPathLockMode,
  pathLockPrefix,
  setPathLockPrefix,
  pathLockMessage,
  setPathLockMessage,
  pathLockPassword,
  setPathLockPassword,
  pathLockAction,
  setPathLockAction,
  pathLockFallbackPath,
  setPathLockFallbackPath,
  targetUrl,
  fieldErrors,
  setFieldErrors,
  checkExpiresAtFormat,
}: SectionProtectionExpiryProps) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const [hasPassword, setHasPassword] = useState(Boolean(password));
  const [hasExpiry, setHasExpiry] = useState(Boolean(expiresAt));
  const hasPathLock = pathLockMode !== "off";
  const [showPathLockPassword, setShowPathLockPassword] = useState(false);
  const [isFallbackDropdownOpen, setIsFallbackDropdownOpen] = useState(false);
  const fallbackDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isFallbackDropdownOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        fallbackDropdownRef.current &&
        !fallbackDropdownRef.current.contains(e.target as Node)
      ) {
        setIsFallbackDropdownOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFallbackDropdownOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isFallbackDropdownOpen]);

  // Subpath Prefix Tags Input setup (identical to Tags Input in SectionLink)
  const prefixTagInputId = useId();
  const [activePrefixTagIndex, setActivePrefixTagIndex] = useState<number | null>(null);

  const parsePrefixesToTags = (prefixStr: string): { tags: EmblorTag[]; filterType: "whitelist" | "blacklist" } => {
    const parsed = parsePathLockRoutes(prefixStr);
    const filterType = parsed.filterType;
    if (parsed.isEmpty) {
      return { tags: [], filterType };
    }
    const sourceList = filterType === "blacklist" ? parsed.blockedRoutes : parsed.routes;
    const items = sourceList.map((route) => (route === "" ? "/" : `/${route}`));
    if (filterType === "whitelist" && parsed.allowAllSubpaths && !items.includes("/*") && items.length > 0) {
      items.unshift("/*");
    }
    return {
      filterType,
      tags: items.map((text, idx) => ({
        id: `prefix-${text}-${idx}`,
        text,
      })),
    };
  };

  const initialParsed = parsePrefixesToTags(pathLockPrefix);
  const [filterType, setFilterType] = useState<"whitelist" | "blacklist">(initialParsed.filterType);
  const [emblorPrefixTags, setEmblorPrefixTags] = useState<EmblorTag[]>(initialParsed.tags);

  const isLocalTagEditRef = useRef<boolean>(false);
  const lastDispatchedPrefixRef = useRef<string>(
    (initialParsed.filterType === "blacklist" ? "block:" : "") +
    initialParsed.tags.map((t) => t.text).join(", ")
  );

  // 1. Sync external pathLockPrefix into local emblorPrefixTags when edited/loaded externally
  useEffect(() => {
    const externalParsed = parsePrefixesToTags(pathLockPrefix);
    const tagText = externalParsed.tags.map((t) => t.text).join(", ");
    const externalJoined = externalParsed.filterType === "blacklist"
      ? (tagText ? `block:${tagText}` : "block:")
      : tagText;

    if (externalJoined !== lastDispatchedPrefixRef.current) {
      isLocalTagEditRef.current = false;
      lastDispatchedPrefixRef.current = externalJoined;
      setFilterType(externalParsed.filterType);
      setEmblorPrefixTags(externalParsed.tags);
    }
  }, [pathLockPrefix]);

  // 2. Sync user edits from emblorPrefixTags and filterType up to parent state without fighting external loads
  useEffect(() => {
    if (!isLocalTagEditRef.current) return;
    isLocalTagEditRef.current = false;
    const tagText = emblorPrefixTags.map((t) => t.text).join(", ");
    const joined = filterType === "blacklist"
      ? (tagText ? `block:${tagText}` : "block:")
      : tagText;

    if (joined !== lastDispatchedPrefixRef.current) {
      lastDispatchedPrefixRef.current = joined;
      setPathLockPrefix(joined);
    }
  }, [emblorPrefixTags, filterType, setPathLockPrefix]);

  const handleUpdatePrefixTags = (newTags: React.SetStateAction<EmblorTag[]>) => {
    isLocalTagEditRef.current = true;
    setEmblorPrefixTags((prev) => {
      const resolved = typeof newTags === "function" ? newTags(prev) : newTags;
      const seen = new Set<string>();
      const normalizedTags: EmblorTag[] = [];
      for (const item of resolved) {
        let clean = String(item.text || "").trim();
        clean = clean.replace(/^(block:|!+|-+)/i, "").trim();
        clean = clean.replace(/^[#?]+/, "");
        if (clean === "/" || clean === "/*") {
          const formatted = clean;
          if (!seen.has(formatted)) {
            seen.add(formatted);
            normalizedTags.push({
              id: `prefix-${formatted}-${normalizedTags.length}`,
              text: formatted,
            });
          }
          continue;
        }
        clean = clean.replace(/^\/+/, "").replace(/\/+$/, "");
        const formatted = clean ? `/${clean}` : "/";
        if (!seen.has(formatted)) {
          seen.add(formatted);
          normalizedTags.push({
            id: `prefix-${formatted}-${normalizedTags.length}`,
            text: formatted,
          });
        }
      }
      return normalizedTags;
    });
  };

  // Compute single-page path from targetUrl
  const singlePagePath = (() => {
    if (!targetUrl || !targetUrl.trim()) return "/";
    try {
      const u = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
      const path = u.pathname || "/";
      return path === "" ? "/" : path.replace(/\/+$/, "") || "/";
    } catch {
      return "/";
    }
  })();

  // Pre-populated single-choice fallback options derived strictly from allowed tunnel routes
  const fallbackDropdownOptions = useMemo(() => {
    if (pathLockMode !== "funnel") return [];
    const safeTarget =
      targetUrl && targetUrl.trim() ? targetUrl.trim() : "https://example.com/";
    return getPathLockNavigableRoutes({
      targetUrl: safeTarget,
      rawPrefix: pathLockPrefix,
      mode: "funnel",
    });
  }, [pathLockMode, targetUrl, pathLockPrefix]);

  const isTargetBlockedByBlacklist =
    filterType === "blacklist" && fallbackDropdownOptions.length === 0;

  // Keep selected single-choice fallback path valid whenever allowed tags or filterType change
  useEffect(() => {
    if (pathLockMode !== "funnel" || pathLockAction !== "fallback") return;
    if (!pathLockFallbackPath) return;
    const stillValid = fallbackDropdownOptions.some(
      (opt) => opt.path.toLowerCase() === pathLockFallbackPath.toLowerCase(),
    );
    if (!stillValid) {
      setPathLockFallbackPath("");
    }
  }, [
    pathLockMode,
    pathLockAction,
    pathLockFallbackPath,
    fallbackDropdownOptions,
    setPathLockFallbackPath,
  ]);

  const handleProGuard = (action: () => void, featureName: string) => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        featureName,
        reason: isFr
          ? `Débloquez « ${featureName} » en passant au forfait PRO.`
          : `Unlock ${featureName} by upgrading to the PRO plan.`,
        targetPlan: "PRO",
      });
      return;
    }
    action();
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
          {isFr ? "Protection & expiration" : "Protection & expiry"}
        </h2>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mt-1">
          {isFr
            ? "Tout est optionnel. Activez uniquement ce dont vous avez besoin pour protéger et limiter l'accès."
            : "All optional. Turn on only what you need to protect and limit access."}
        </p>
      </div>

      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-zinc-800">
        {/* 1. PASSWORD PROTECTION */}
        <div className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-950 dark:text-white">
                  {isFr ? "Protection par mot de passe" : "Password protection"}
                </span>
                {!isProPlan && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
                {isFr
                  ? "Les visiteurs doivent saisir un code PIN ou mot de passe secret pour continuer."
                  : "Visitors must enter a PIN or secret passphrase to continue."}
              </p>
            </div>
            <DrawerSwitch
              checked={hasPassword}
              onChange={(val) => {
                handleProGuard(() => {
                  setHasPassword(val);
                  if (!val) setPassword("");
                }, isFr ? "Protection par mot de passe" : "Password Protection");
              }}
              aria-label={isFr ? "Activer la protection par mot de passe" : "Toggle password protection"}
            />
          </div>

          {hasPassword && isProPlan && (
            <div className="mt-3.5 pt-3 border-t border-zinc-200/70 dark:border-zinc-800 flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-950 dark:text-white">
                {isFr ? "Choisir un mot de passe (4 caractères minimum)" : "Choose Password (minimum 4 characters)"}
              </label>
              <div className="relative">
                <Input
                  type="text"
                  style={{
                    WebkitTextSecurity: showPassword ? "none" : "disc",
                  } as React.CSSProperties}
                  placeholder={isFr ? "Saisissez la clé d'accès secrète" : "Enter secret access key"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-10 text-[13px] font-sans font-medium pr-10 text-zinc-950 dark:text-white placeholder:font-normal placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  name="link_secret_password"
                  data-lpignore="true"
                  data-1p-ignore="true"
                  data-bwignore="true"
                  data-form-type="other"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              <FieldErrorAlert message={fieldErrors.password} />
            </div>
          )}
        </div>

        {/* 2. EXPIRY DATE */}
        <div className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-950 dark:text-white">
                  {isFr ? "Date d'expiration" : "Expiry date"}
                </span>
                {!isProPlan && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
                {isFr
                  ? "Affiche automatiquement une page « Lien expiré » après cette date."
                  : "Automatically display a “Link expired” page after this date."}
              </p>
            </div>
            <DrawerSwitch
              checked={hasExpiry}
              onChange={(val) => {
                handleProGuard(() => {
                  setHasExpiry(val);
                  if (!val) setExpiresAt("");
                }, isFr ? "Expiration du lien" : "Link Expiration");
              }}
              aria-label={isFr ? "Activer l'expiration du lien" : "Toggle link expiration"}
            />
          </div>

          {hasExpiry && isProPlan && (
            <div className="mt-3.5 pt-3 border-t border-zinc-200/70 dark:border-zinc-800 flex flex-col gap-2">
              <label className="text-xs font-bold text-zinc-950 dark:text-white">
                {isFr ? "Sélectionner la date et l'heure d'expiration" : "Select Expiration Date & Time"}
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
                className="h-10 text-[13px] font-sans font-medium text-zinc-950 dark:text-white"
              />
              <FieldErrorAlert message={fieldErrors.expiresAt} />
            </div>
          )}
        </div>

        {/* 3. CLICK LIMIT & FALLBACK */}
        <div className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-950 dark:text-white">
                  {isFr ? "Limite de clics" : "Click limit"}
                </span>
                {!isProPlan && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
                {isFr
                  ? "Redirigez ailleurs après un nombre maximum de clics."
                  : "Redirect elsewhere after a maximum number of clicks."}
              </p>
            </div>
            <DrawerSwitch
              checked={hasClickLimit}
              onChange={(val) => {
                handleProGuard(() => {
                  setHasClickLimit(val);
                  if (!val) {
                    setMaxClicks("");
                    setFallbackUrl("");
                  }
                }, isFr ? "Limite de clics et redirection de secours" : "Click Limit & Fallback");
              }}
              aria-label={isFr ? "Activer la limite de clics" : "Toggle click limit"}
            />
          </div>

          {hasClickLimit && isProPlan && (
            <div className="mt-3.5 pt-3 border-t border-zinc-200/70 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-950 dark:text-white">
                  {isFr ? "Clics maximum" : "Max Clicks"}
                </label>
                <Input
                  type="number"
                  min="1"
                  placeholder={isFr ? "ex. 500" : "e.g. 500"}
                  value={maxClicks}
                  onChange={(e) => setMaxClicks(e.target.value)}
                  className="h-10 text-[13px] font-sans font-medium text-zinc-950 dark:text-white placeholder:font-normal placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-950 dark:text-white">
                  {isFr ? "URL de secours" : "Fallback URL"}
                </label>
                <Input
                  type="url"
                  placeholder="https://example.com/expired"
                  value={fallbackUrl}
                  onChange={(e) => setFallbackUrl(e.target.value)}
                  className="h-10 text-[13px] font-sans font-medium text-zinc-950 dark:text-white placeholder:font-normal placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                />
              </div>
            </div>
          )}
        </div>

        {/* 4. RESTRICT BROWSING (PathLock™) */}
        <div className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-950 dark:text-white">
                  {isFr ? "Restreindre la navigation (PathLock™)" : "Restrict browsing (PathLock™)"}
                </span>
                {!isProPlan && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
                {isFr
                  ? "Limitez les visiteurs uniquement à la page d'atterrissage ou au tunnel de commande."
                  : "Lock visitors to the landing page or checkout funnel only."}
              </p>
            </div>
            <DrawerSwitch
              checked={hasPathLock}
              onChange={(val) => {
                handleProGuard(() => {
                  setPathLockMode(val ? "strict" : "off");
                }, isFr ? "Navigation restreinte PathLock™" : "PathLock™ Restricted Browsing");
              }}
              aria-label={isFr ? "Activer la navigation restreinte PathLock" : "Toggle PathLock restricted browsing"}
            />
          </div>

          {hasPathLock && isProPlan && (
            <div className="mt-3.5 pt-3 border-t border-zinc-200/70 dark:border-zinc-800 flex flex-col gap-3">
              {/* Segmented Mode Selector */}
              <div className="flex gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a]">
                <button
                  type="button"
                  onClick={() => setPathLockMode("strict")}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-md text-xs transition-all text-center cursor-pointer",
                    pathLockMode === "strict"
                      ? "bg-white dark:bg-[#0e0f12] text-zinc-950 dark:text-white shadow-sm border border-[#1d5fe0] dark:border-[#3b82f6] font-bold"
                      : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium",
                  )}
                >
                  {isFr ? "Page unique (Strict)" : "Single page (Strict)"}
                </button>
                <button
                  type="button"
                  onClick={() => setPathLockMode("funnel")}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-md text-xs transition-all text-center cursor-pointer",
                    pathLockMode === "funnel"
                      ? "bg-white dark:bg-[#0e0f12] text-zinc-950 dark:text-white shadow-sm border border-[#1d5fe0] dark:border-[#3b82f6] font-bold"
                      : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium",
                  )}
                >
                  {isFr ? "Tunnel & sous-chemins" : "Funnel & subpaths"}
                </button>
              </div>

              {/* Informative UI for Single Page (Strict) */}
              {pathLockMode === "strict" && (
                <div className="p-3.5 rounded-[10px] bg-blue-50/80 dark:bg-blue-950/25 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3 animate-in fade-in duration-150">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                        {isFr ? "Page accessible autorisée :" : "Allowed accessible page:"}
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-blue-200/70 dark:bg-blue-900/70 text-blue-900 dark:text-blue-200 font-sans text-xs font-semibold border border-blue-300/60 dark:border-blue-700/50">
                        {singlePagePath}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-blue-900/90 dark:text-blue-200 leading-relaxed">
                      {isFr
                        ? "Seule cette page exacte sera accessible. Toutes les autres navigations, liens sortants et sous-pages du site de destination seront automatiquement restreints."
                        : "Only this exact page will be accessible. All other navigation, outgoing links, and subpages on the destination site will be automatically restricted."}
                    </p>
                  </div>
                </div>
              )}

              {/* Funnel subpath prefix */}
              {pathLockMode === "funnel" && (
                <div className="flex flex-col gap-3 w-full">
                  {/* Filter Type Toggle */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-zinc-950 dark:text-white">
                      {isFr ? "Type de filtrage des routes" : "Route filtering type"}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a]">
                      <button
                        type="button"
                        onClick={() => {
                          isLocalTagEditRef.current = true;
                          setFilterType("whitelist");
                        }}
                        className={cn(
                          "py-1.5 px-2 rounded-md text-xs transition-all text-center cursor-pointer font-medium",
                          filterType === "whitelist"
                            ? "bg-white dark:bg-[#0e0f12] text-blue-600 dark:text-blue-400 shadow-sm border border-blue-500/40 font-bold"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white",
                        )}
                      >
                        {isFr ? "Routes autorisées (Liste blanche)" : "Allowed routes (Whitelist)"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          isLocalTagEditRef.current = true;
                          setFilterType("blacklist");
                        }}
                        className={cn(
                          "py-1.5 px-2 rounded-md text-xs transition-all text-center cursor-pointer font-medium",
                          filterType === "blacklist"
                            ? "bg-white dark:bg-[#0e0f12] text-red-600 dark:text-red-400 shadow-sm border border-red-500/40 font-bold"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white",
                        )}
                      >
                        {isFr ? "Routes bloquées (Liste noire)" : "Blocked routes (Blacklist)"}
                      </button>
                    </div>
                  </div>

                  {/* Route Tag Input */}
                  <div className="flex flex-col gap-1.5 w-full">
                    <div className="flex items-center justify-between gap-2">
                      <label
                        htmlFor={prefixTagInputId}
                        className="text-xs font-bold text-zinc-950 dark:text-white"
                      >
                        {filterType === "blacklist"
                          ? (isFr ? "Sous-chemins bloqués / interdits" : "Blocked subpaths")
                          : (isFr ? "Préfixes de sous-chemins autorisés" : "Allowed subpath prefixes")}
                      </label>
                      <span
                        className={cn(
                          "text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase border",
                          filterType === "blacklist"
                            ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30"
                            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30"
                        )}
                      >
                        {filterType === "blacklist"
                          ? (isFr ? "Bloquer" : "Blocklist")
                          : (isFr ? "Autoriser" : "Allowlist")}
                      </span>
                    </div>

                    <div
                      className="lshorter-tag-container w-full flex flex-col items-start"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          // Crucial: stop propagation so pressing Enter in the route tag input NEVER submits the parent drawer form
                          e.stopPropagation();
                        }
                      }}
                    >
                      <TagInput
                        id={prefixTagInputId}
                        tags={emblorPrefixTags}
                        setTags={handleUpdatePrefixTags}
                        activeTagIndex={activePrefixTagIndex}
                        setActiveTagIndex={setActivePrefixTagIndex}
                        inlineTags={false}
                        inputFieldPosition="top"
                        addTagsOnBlur
                        addOnPaste
                        delimiterList={["Enter", ",", ";", " "]}
                        placeholder={
                          filterType === "blacklist"
                            ? (isFr
                                ? "Ajoutez des routes à bloquer (ex. /pricing, /admin, /blog)..."
                                : "Add routes to block (e.g. /pricing, /admin, /blog)...")
                            : (isFr
                                ? "Ajoutez des routes autorisées (ex. /checkout, /shop)... vide = tout (/)"
                                : "Add allowed routes (e.g. /checkout, /shop)... empty = all (/)")
                        }
                        inputProps={
                          {
                            name: "pathlock_subpath_prefix_input",
                            autoComplete: "off",
                            autoCorrect: "off",
                            autoCapitalize: "off",
                            spellCheck: false,
                            "data-lpignore": "true",
                            "data-1p-ignore": "true",
                            "data-bwignore": "true",
                            "data-form-type": "other",
                          } as React.InputHTMLAttributes<HTMLInputElement>
                        }
                        styleClasses={{
                          input:
                            "w-full h-10 rounded-[10px] bg-white dark:bg-[#16181d] border border-zinc-300 dark:border-[#27272a] text-zinc-950 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-500 placeholder:font-normal text-[13px] font-sans font-medium px-3 focus:outline-none focus:ring-2 focus:ring-[#0066FF]/15 dark:focus:ring-[#3b82f6]/20 focus:border-[#0066FF] dark:focus:border-[#3b82f6] transition-colors text-left",
                          tag: {
                            body:
                              filterType === "blacklist"
                                ? "relative h-7 bg-red-500/10 dark:bg-red-950/30 border border-red-500/30 dark:border-red-800/50 hover:bg-red-500/15 rounded-md font-sans font-medium text-xs tracking-[-0.01em] ps-2.5 pe-7 text-red-700 dark:text-red-300 shadow-2xs transition-colors"
                                : "relative h-7 bg-zinc-100 dark:bg-[#20222a] border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200/80 dark:hover:bg-[#282b35] rounded-md font-sans font-medium text-xs tracking-[-0.01em] ps-2.5 pe-7 text-zinc-900 dark:text-zinc-100 shadow-2xs transition-colors",
                            closeButton:
                              filterType === "blacklist"
                                ? "absolute -inset-y-px -end-px p-0 rounded-s-none rounded-e-md flex size-7 transition-colors outline-none text-red-500 hover:text-red-700 dark:hover:text-red-200 hover:bg-red-500/20"
                                : "absolute -inset-y-px -end-px p-0 rounded-s-none rounded-e-md flex size-7 transition-colors outline-none text-zinc-500 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50",
                          },
                          tagList: {
                            container: "flex flex-wrap items-center justify-start gap-1.5 pt-1 w-full",
                          },
                        }}
                      />
                    </div>
                    <p className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                      {filterType === "blacklist" ? (
                        isFr ? (
                          <>
                            Toutes les pages du site restent navigables, <span className="font-semibold text-red-600 dark:text-red-400">sauf</span> celles listées ici qui seront bloquées (ex. <span className="font-medium text-zinc-700 dark:text-zinc-200">/pricing</span>, <span className="font-medium text-zinc-700 dark:text-zinc-200">/admin</span>).
                          </>
                        ) : (
                          <>
                            All pages on the site remain navigable, <span className="font-semibold text-red-600 dark:text-red-400">except</span> those listed here which will be blocked (e.g. <span className="font-medium text-zinc-700 dark:text-zinc-200">/pricing</span>, <span className="font-medium text-zinc-700 dark:text-zinc-200">/admin</span>).
                          </>
                        )
                      ) : (
                        isFr ? (
                          <>
                            Seules ces routes seront accessibles. Laissez vide pour autoriser tout le site (<span className="font-medium text-zinc-700 dark:text-zinc-200">/</span>).
                          </>
                        ) : (
                          <>
                            Only these routes will be accessible. Leave empty to allow the entire site (<span className="font-medium text-zinc-700 dark:text-zinc-200">/</span>).
                          </>
                        )
                      )}
                    </p>
                  </div>
                  {/* Out-of-scope behavior selector (Tunnel mode only — sober segmented + custom theme-aware dropdown) */}
                  <div className="flex flex-col gap-2 pt-1">
                    <label className="text-xs font-bold text-zinc-950 dark:text-white">
                      {isFr ? "Comportement hors périmètre" : "Out-of-scope behavior"}
                    </label>
                    <div className="grid grid-cols-2 gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a]">
                      <button
                        type="button"
                        onClick={() => {
                          setPathLockAction("block");
                          setIsFallbackDropdownOpen(false);
                        }}
                        className={cn(
                          "py-1.5 px-2 rounded-md text-xs transition-colors text-center cursor-pointer",
                          pathLockAction !== "fallback"
                            ? "bg-white dark:bg-[#0e0f12] text-zinc-950 dark:text-white shadow-sm border border-[#1d5fe0] dark:border-[#3b82f6] font-bold"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-medium",
                        )}
                      >
                        {isFr ? "Écran PathLock" : "PathLock screen"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPathLockAction("fallback");
                        }}
                        className={cn(
                          "py-1.5 px-2 rounded-md text-xs transition-colors text-center cursor-pointer",
                          pathLockAction === "fallback"
                            ? "bg-white dark:bg-[#0e0f12] text-zinc-950 dark:text-white shadow-sm border border-[#1d5fe0] dark:border-[#3b82f6] font-bold"
                            : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white font-medium",
                        )}
                      >
                        {isFr ? "Redirection auto" : "Auto redirect"}
                      </button>
                    </div>

                    {pathLockAction === "fallback" && (
                      <div className="flex flex-col gap-1.5 pt-1">
                        <label
                          htmlFor={`${prefixTagInputId}-fallback-page`}
                          className="text-xs font-bold text-zinc-950 dark:text-white"
                        >
                          {isFr ? "Page de redirection" : "Redirect page"}
                        </label>
                        {isTargetBlockedByBlacklist ? (
                          <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                            {isFr
                              ? "La page principale est bloquée dans la liste noire : l'écran PathLock sera utilisé automatiquement pour éviter toute boucle."
                              : "The primary page is blocked in the blocklist: the PathLock screen will be used automatically to prevent redirect loops."}
                          </p>
                        ) : (
                          <>
                            <div ref={fallbackDropdownRef} className="relative">
                              <button
                                id={`${prefixTagInputId}-fallback-page`}
                                type="button"
                                role="combobox"
                                aria-expanded={isFallbackDropdownOpen}
                                aria-haspopup="listbox"
                                aria-controls={`${prefixTagInputId}-fallback-listbox`}
                                onClick={() => setIsFallbackDropdownOpen((prev) => !prev)}
                                className={cn(
                                  "w-full h-10 px-3 rounded-[10px] bg-white dark:bg-[#16181d] border text-left flex items-center justify-between gap-2 transition-colors cursor-pointer outline-none",
                                  isFallbackDropdownOpen
                                    ? "border-[#0066FF] dark:border-[#3b82f6] ring-2 ring-[#0066FF]/15 dark:ring-[#3b82f6]/20"
                                    : "border-zinc-300 dark:border-[#27272a] hover:border-zinc-400 dark:hover:border-zinc-600",
                                )}
                              >
                                <span className="flex items-center gap-2 min-w-0 font-sans text-[13px] font-medium text-zinc-950 dark:text-white truncate">
                                  {pathLockFallbackPath ? (
                                    <span className="truncate">{pathLockFallbackPath}</span>
                                  ) : (
                                    <>
                                      <span className="truncate">
                                        {isFr ? "Page principale du lien" : "Primary link page"}
                                      </span>
                                      <span className="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800/80 px-1.5 py-0.5 rounded-md shrink-0">
                                        {singlePagePath}
                                      </span>
                                    </>
                                  )}
                                </span>
                                <ChevronDown
                                  className={cn(
                                    "w-4 h-4 text-zinc-400 dark:text-zinc-500 shrink-0 transition-transform duration-150",
                                    isFallbackDropdownOpen && "rotate-180 text-zinc-600 dark:text-zinc-300",
                                  )}
                                />
                              </button>

                              {isFallbackDropdownOpen && (
                                <div
                                  id={`${prefixTagInputId}-fallback-listbox`}
                                  role="listbox"
                                  className="absolute left-0 right-0 top-full mt-1.5 z-50 rounded-[10px] bg-white dark:bg-[#16181d] border border-zinc-200 dark:border-[#27272a] shadow-[0_10px_28px_-6px_rgba(0,0,0,0.12)] dark:shadow-[0_12px_32px_-4px_rgba(0,0,0,0.55)] p-1 max-h-56 overflow-y-auto"
                                >
                                  <button
                                    type="button"
                                    role="option"
                                    aria-selected={!pathLockFallbackPath}
                                    onClick={() => {
                                      setPathLockFallbackPath("");
                                      setIsFallbackDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[7px] text-left font-sans text-[13px] transition-colors cursor-pointer",
                                      !pathLockFallbackPath
                                        ? "bg-blue-50/90 dark:bg-blue-500/15 text-[#0055D4] dark:text-blue-300 font-semibold"
                                        : "text-zinc-800 dark:text-zinc-200 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800/70",
                                    )}
                                  >
                                    <span className="flex items-center gap-2 min-w-0">
                                      <span className="truncate">
                                        {isFr ? "Page principale du lien" : "Primary link page"}
                                      </span>
                                      <span
                                        className={cn(
                                          "text-[11px] font-medium px-1.5 py-0.5 rounded-md shrink-0",
                                          !pathLockFallbackPath
                                            ? "bg-blue-100/80 dark:bg-blue-500/20 text-[#0055D4] dark:text-blue-300"
                                            : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400",
                                        )}
                                      >
                                        {singlePagePath}
                                      </span>
                                    </span>
                                    {!pathLockFallbackPath && (
                                      <Check className="w-3.5 h-3.5 text-[#0066FF] dark:text-blue-400 shrink-0" />
                                    )}
                                  </button>

                                  {fallbackDropdownOptions.filter((opt) => !opt.isTarget).length > 0 && (
                                    <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                  )}

                                  {fallbackDropdownOptions
                                    .filter((opt) => !opt.isTarget)
                                    .map((opt) => {
                                      const isSelected =
                                        pathLockFallbackPath.toLowerCase() === opt.path.toLowerCase();
                                      return (
                                        <button
                                          key={opt.path}
                                          type="button"
                                          role="option"
                                          aria-selected={isSelected}
                                          onClick={() => {
                                            setPathLockFallbackPath(opt.path);
                                            setIsFallbackDropdownOpen(false);
                                          }}
                                          className={cn(
                                            "w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-[7px] text-left font-sans text-[13px] transition-colors cursor-pointer",
                                            isSelected
                                              ? "bg-blue-50/90 dark:bg-blue-500/15 text-[#0055D4] dark:text-blue-300 font-semibold"
                                              : "text-zinc-800 dark:text-zinc-200 font-medium hover:bg-zinc-100 dark:hover:bg-zinc-800/70",
                                          )}
                                        >
                                          <span className="truncate">{opt.label}</span>
                                          {isSelected && (
                                            <Check className="w-3.5 h-3.5 text-[#0066FF] dark:text-blue-400 shrink-0" />
                                          )}
                                        </button>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                            <p className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
                              {isFr
                                ? "Tout clic hors périmètre redirigera automatiquement vers cette page."
                                : "Any out-of-scope click will automatically redirect to this page."}
                            </p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Message shown when navigation is blocked */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-950 dark:text-white">
                  {pathLockMode === "funnel" && pathLockAction === "fallback"
                    ? isFr
                      ? "Message du bandeau de redirection (Optionnel)"
                      : "Redirect notice message (Optional)"
                    : isFr
                      ? "Message affiché lorsque la navigation est bloquée (Optionnel)"
                      : "Message shown when navigation is blocked (Optional)"}
                </label>
                <textarea
                  rows={2}
                  placeholder={
                    pathLockMode === "funnel" && pathLockAction === "fallback"
                      ? isFr
                        ? "Accès hors périmètre — redirection vers la page autorisée."
                        : "Out-of-scope route — redirected to the authorized page."
                      : isFr
                        ? "La navigation externe est désactivée pour cette session sécurisée."
                        : "External navigation is disabled for this secure session."
                  }
                  value={pathLockMessage}
                  onChange={(e) => setPathLockMessage(e.target.value)}
                  className="w-full bg-white dark:bg-[#16181d] text-zinc-950 dark:text-white border border-zinc-300 dark:border-[#27272a] focus:border-[#0066FF] dark:focus:border-[#3b82f6] focus:ring-2 focus:ring-[#0066FF]/15 dark:focus:ring-[#3b82f6]/20 rounded-[10px] p-3 text-[13px] font-sans leading-relaxed outline-none transition-colors resize-none placeholder:text-zinc-400 dark:placeholder:text-zinc-500 font-normal"
                />
              </div>

              {/* PathLock bypass password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-950 dark:text-white">
                  {isFr
                    ? "Code de déverrouillage pour quitter (Optionnel)"
                    : "Unlock Passcode to leave (Optional)"}
                </label>
                <div className="relative">
                  <Input
                    type="text"
                    style={{
                      WebkitTextSecurity: showPathLockPassword ? "none" : "disc",
                    } as React.CSSProperties}
                    placeholder={
                      isFr
                        ? "Code optionnel pour contourner le verrouillage"
                        : "Optional passcode to bypass lock"
                    }
                    value={pathLockPassword}
                    onChange={(e) => setPathLockPassword(e.target.value)}
                    className="h-10 text-[13px] font-sans font-medium pr-10 text-zinc-950 dark:text-white placeholder:font-normal placeholder:text-zinc-400 dark:placeholder:text-zinc-500"
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck={false}
                    name="pathlock_bypass_passcode"
                    data-lpignore="true"
                    data-1p-ignore="true"
                    data-bwignore="true"
                    data-form-type="other"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPathLockPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white transition-colors cursor-pointer"
                  >
                    {showPathLockPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 5. HIDE REFERRER */}
        <div className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-sm font-bold text-zinc-950 dark:text-white">
                {isFr ? "Masquer le référent" : "Hide referrer"}
              </span>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
                {isFr
                  ? "Supprime les en-têtes HTTP Referer pour protéger vos sources de trafic."
                  : "Strips HTTP referrer headers to protect your traffic sources."}
              </p>
            </div>
            <DrawerSwitch
              checked={hideReferrer}
              onChange={setHideReferrer}
              aria-label={isFr ? "Activer le masquage du référent" : "Toggle hide referrer"}
            />
          </div>
        </div>

        {/* 6. HIDE DESTINATION URL (BRANDED MASKING) */}
        <div className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-zinc-950 dark:text-white">
                  {isFr
                    ? "Masquer l'URL de destination (Masquage de marque)"
                    : "Hide destination URL (Branded Masking)"}
                </span>
                {!isProPlan && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
                {isFr
                  ? "Conservez votre domaine de marque dans la barre d'adresse via un masquage iframe sécurisé."
                  : "Keep your branded custom domain in the address bar via secure iframe masking."}
              </p>
            </div>
            <DrawerSwitch
              checked={isCloaked}
              onChange={(val) => {
                handleProGuard(() => {
                  setIsCloaked(val);
                }, isFr ? "Masquage d'URL de marque" : "Branded URL Masking");
              }}
              aria-label={isFr ? "Activer le masquage d'URL de marque" : "Toggle branded URL masking"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
