"use client";

import React, { useState } from "react";
import { Eye, EyeOff, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { DrawerSwitch } from "../drawer-switch";
import { FieldErrorAlert } from "../field-error-alert";
import { triggerPlanUpgrade } from "@/lib/plan-guard";

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
  targetUrl,
  fieldErrors,
  setFieldErrors,
  checkExpiresAtFormat,
}: SectionProtectionExpiryProps) {
  const [hasPassword, setHasPassword] = useState(Boolean(password));
  const [hasExpiry, setHasExpiry] = useState(Boolean(expiresAt));
  const [hasPathLock, setHasPathLock] = useState(pathLockMode !== "off");
  const [showPathLockPassword, setShowPathLockPassword] = useState(false);

  // Compute single-page path from targetUrl
  const singlePagePath = (() => {
    if (!targetUrl || !targetUrl.trim()) return "/...";
    try {
      const u = new URL(targetUrl.startsWith("http") ? targetUrl : `https://${targetUrl}`);
      const path = u.pathname || "/";
      return path === "" ? "/" : path;
    } catch {
      return "/...";
    }
  })();

  const handleProGuard = (action: () => void, featureName: string) => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        featureName,
        reason: `Unlock ${featureName} by upgrading to the PRO plan.`,
        targetPlan: "PRO",
      });
      return;
    }
    action();
  };

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#131417] dark:text-[#f1f2f4]">
          Protection &amp; expiry
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          All optional. Turn on only what you need to protect and limit access.
        </p>
      </div>

      <div className="flex flex-col divide-y divide-zinc-200 dark:divide-[#22242a]">
        {/* 1. PASSWORD PROTECTION */}
        <div className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-[#f1f2f4]">
                  Password protection
                </span>
                {!isProPlan && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Visitors must enter a PIN or secret passphrase to continue.
              </p>
            </div>
            <DrawerSwitch
              checked={hasPassword}
              onChange={(val) => {
                handleProGuard(() => {
                  setHasPassword(val);
                  if (!val) setPassword("");
                }, "Password Protection");
              }}
              aria-label="Toggle password protection"
            />
          </div>

          {hasPassword && isProPlan && (
            <div className="mt-3.5 pt-3 border-t border-zinc-200/70 dark:border-[#22242a]/50 flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Choose Password (minimum 4 characters)
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter secret access key"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg pl-3.5 pr-10 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800 dark:text-[#8a8f9a] dark:hover:text-[#f1f2f4] transition-colors cursor-pointer"
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
                <span className="text-sm font-semibold text-zinc-900 dark:text-[#f1f2f4]">
                  Expiry date
                </span>
                {!isProPlan && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Automatically display a “Link expired” page after this date.
              </p>
            </div>
            <DrawerSwitch
              checked={hasExpiry}
              onChange={(val) => {
                handleProGuard(() => {
                  setHasExpiry(val);
                  if (!val) setExpiresAt("");
                }, "Link Expiration");
              }}
              aria-label="Toggle link expiration"
            />
          </div>

          {hasExpiry && isProPlan && (
            <div className="mt-3.5 pt-3 border-t border-zinc-200/70 dark:border-[#22242a]/50 flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                Select Expiration Date &amp; Time
              </label>
              <input
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
                className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors"
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
                <span className="text-sm font-semibold text-zinc-900 dark:text-[#f1f2f4]">
                  Click limit
                </span>
                {!isProPlan && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Redirect elsewhere after a maximum number of clicks.
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
                }, "Click Limit & Fallback");
              }}
              aria-label="Toggle click limit"
            />
          </div>

          {hasClickLimit && isProPlan && (
            <div className="mt-3.5 pt-3 border-t border-zinc-200/70 dark:border-[#22242a]/50 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Max Clicks
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 500"
                  value={maxClicks}
                  onChange={(e) => setMaxClicks(e.target.value)}
                  className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3.5 py-2 text-xs outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Fallback URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/expired"
                  value={fallbackUrl}
                  onChange={(e) => setFallbackUrl(e.target.value)}
                  className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3.5 py-2 text-xs outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
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
                <span className="text-sm font-semibold text-zinc-900 dark:text-[#f1f2f4]">
                  Restrict browsing (PathLock™)
                </span>
                {!isProPlan && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Lock visitors to the landing page or checkout funnel only.
              </p>
            </div>
            <DrawerSwitch
              checked={hasPathLock}
              onChange={(val) => {
                handleProGuard(() => {
                  setHasPathLock(val);
                  setPathLockMode(val ? "strict" : "off");
                }, "PathLock™ Restricted Browsing");
              }}
              aria-label="Toggle PathLock restricted browsing"
            />
          </div>

          {hasPathLock && isProPlan && (
            <div className="mt-3.5 pt-3 border-t border-zinc-200/70 dark:border-[#22242a]/50 flex flex-col gap-3">
              {/* Segmented Mode Selector */}
              <div className="flex gap-1.5 p-1 rounded-lg bg-zinc-100 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a]">
                <button
                  type="button"
                  onClick={() => setPathLockMode("strict")}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all text-center cursor-pointer",
                    pathLockMode === "strict"
                      ? "bg-white dark:bg-[#0e0f12] text-zinc-900 dark:text-[#f1f2f4] shadow-sm border border-[#1d5fe0] dark:border-[#3b82f6] font-semibold"
                      : "text-zinc-600 dark:text-[#8a8f9a] hover:text-zinc-900 dark:hover:text-[#f1f2f4]",
                  )}
                >
                  Single page (Strict)
                </button>
                <button
                  type="button"
                  onClick={() => setPathLockMode("funnel")}
                  className={cn(
                    "flex-1 py-1.5 px-3 rounded-md text-xs font-medium transition-all text-center cursor-pointer",
                    pathLockMode === "funnel"
                      ? "bg-white dark:bg-[#0e0f12] text-zinc-900 dark:text-[#f1f2f4] shadow-sm border border-[#1d5fe0] dark:border-[#3b82f6] font-semibold"
                      : "text-zinc-600 dark:text-[#8a8f9a] hover:text-zinc-900 dark:hover:text-[#f1f2f4]",
                  )}
                >
                  Funnel &amp; subpaths
                </button>
              </div>

              {/* Informative UI for Single Page (Strict) */}
              {pathLockMode === "strict" && (
                <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/25 border border-blue-200/80 dark:border-blue-900/50 flex items-start gap-3 animate-in fade-in duration-150">
                  <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 shrink-0 mt-0.5">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-blue-950 dark:text-blue-200">
                        Page accessible autorisée :
                      </span>
                      <code className="px-2 py-0.5 rounded-md bg-blue-200/70 dark:bg-blue-900/70 text-blue-900 dark:text-blue-200 font-mono text-xs font-bold border border-blue-300/60 dark:border-blue-700/50">
                        {singlePagePath}
                      </code>
                    </div>
                    <p className="text-[11px] text-blue-900/80 dark:text-blue-300/80 leading-relaxed">
                      Seule cette page exacte sera accessible. Toutes les autres navigations, liens sortants et sous-pages du site de destination seront automatiquement restreints.
                    </p>
                  </div>
                </div>
              )}

              {/* Funnel subpath prefix */}
              {pathLockMode === "funnel" && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                    Allowed Subpath Prefix
                  </label>
                  <input
                    type="text"
                    placeholder="/shop/checkout"
                    value={pathLockPrefix}
                    onChange={(e) => setPathLockPrefix(e.target.value)}
                    className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3.5 py-2 text-xs outline-none transition-colors font-mono placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
                  />
                </div>
              )}

              {/* Message shown when navigation is blocked */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Message shown when navigation is blocked (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="External navigation is disabled for this secure session."
                  value={pathLockMessage}
                  onChange={(e) => setPathLockMessage(e.target.value)}
                  className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg p-2.5 text-xs outline-none transition-colors resize-none placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
                />
              </div>

              {/* PathLock bypass password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  Unlock Passcode to leave (Optional)
                </label>
                <div className="relative">
                  <input
                    type={showPathLockPassword ? "text" : "password"}
                    placeholder="Optional passcode to bypass lock"
                    value={pathLockPassword}
                    onChange={(e) => setPathLockPassword(e.target.value)}
                    className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg pl-3 pr-10 py-2 text-xs outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPathLockPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800 dark:text-[#8a8f9a] dark:hover:text-[#f1f2f4] transition-colors cursor-pointer"
                  >
                    {showPathLockPassword ? (
                      <EyeOff className="w-3.5 h-3.5" />
                    ) : (
                      <Eye className="w-3.5 h-3.5" />
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
              <span className="text-sm font-semibold text-zinc-900 dark:text-[#f1f2f4]">
                Hide referrer
              </span>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Strips HTTP referrer headers to protect your traffic sources.
              </p>
            </div>
            <DrawerSwitch
              checked={hideReferrer}
              onChange={setHideReferrer}
              aria-label="Toggle hide referrer"
            />
          </div>
        </div>

        {/* 6. HIDE DESTINATION URL (CLOAKING) */}
        <div className="py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-zinc-900 dark:text-[#f1f2f4]">
                  Hide destination URL (Cloaking)
                </span>
                {!isProPlan && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    PRO
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5">
                Keep your short domain in the address bar via secure iframe masking.
              </p>
            </div>
            <DrawerSwitch
              checked={isCloaked}
              onChange={(val) => {
                handleProGuard(() => {
                  setIsCloaked(val);
                }, "URL Cloaking");
              }}
              aria-label="Toggle URL cloaking"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
