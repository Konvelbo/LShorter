"use client";

import React from "react";
import { Eye, EyeOff, Sparkles, LayoutGrid, Check, Zap } from "lucide-react";
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
}: SectionProtectionProps) {
  const [showPathLockPassword, setShowPathLockPassword] = React.useState(false);

  return (
    <div
      id="drawer-section-protection"
      className="flex flex-col gap-3 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] p-4 scroll-mt-4 shadow-xs"
    >
      <div className="flex items-center justify-between border-b border-zinc-200 dark:border-[#222225] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-1 h-3.5 rounded-[2px] bg-brand" />
          <h3 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-wider">
            PROTECTION &amp; SECURITY
          </h3>
        </div>
        <span className="text-[10px] font-medium text-zinc-500 dark:text-neutral-400">
          Password, Cloaking &amp; Expiry
        </span>
      </div>

      {/* 1. Password Protection (PRO) */}
      <LockedProFeature
        title="Password Protection"
        description="Gate link access behind a secure PIN or alphanumeric password."
        isUnlocked={isProPlan}
      >
        <div className="flex flex-col gap-2 p-3 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              Access Password
            </span>
            <span className="text-[10px] text-zinc-500 dark:text-neutral-400">
              {password ? "Locked" : "Disabled"}
            </span>
          </div>
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Set an access password..."
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
        title="URL Cloaking &amp; Masking"
        description="Display target content in a clean iframe container without exposing the raw destination URL."
        isUnlocked={isProPlan}
      >
        <div className="flex items-center justify-between p-3 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] shadow-xs">
          <div>
            <span className="text-xs font-bold text-zinc-900 dark:text-white block">
              Mask Destination URL
            </span>
            <span className="text-[10.5px] text-zinc-500 dark:text-neutral-400 block">
              Keeps your branded domain in the browser address bar.
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
        title="HTTP Referrer Hiding"
        description="Strip the HTTP Referer header to ensure 100% anonymous redirect traffic."
        isUnlocked={isProPlan}
      >
        <div className="flex items-center justify-between p-3 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] shadow-xs">
          <div>
            <span className="text-xs font-bold text-zinc-900 dark:text-white block">
              Hide HTTP Referrer Header
            </span>
            <span className="text-[10.5px] text-zinc-500 dark:text-neutral-400 block">
              Removes the Referer header to protect traffic sources.
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
        title="Maximum Click Limit"
        description="Automatically deactivate the link or redirect to fallback after reaching a click quota."
        isUnlocked={isProPlan}
      >
        <div className="flex flex-col gap-2.5 p-3 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-900 dark:text-white">
              Enable Click Limit
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
                  Maximum Clicks
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
                  Fallback Redirect URL
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

      {/* 5. PathLock™ Browsing Restriction (PRO) */}
      <LockedProFeature
        title="PathLock™ Restricted Browsing"
        description="Lock visitors strictly into the designated landing page or sales funnel, preventing unauthorized directory exploration."
        isUnlocked={isProPlan}
      >
        <div className="flex flex-col gap-3 p-3.5 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-zinc-900 dark:text-white">
                PathLock™ Restricted Browsing
              </span>
              <span className="text-[10.5px] text-zinc-500 dark:text-neutral-400">
                Lock visitors strictly to the designated landing page or sales funnel.
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (pathLockMode === "off") {
                  setPathLockMode("strict");
                  if (!pathLockPrefix && targetUrl) {
                    try {
                      const parsed = new URL(
                        targetUrl.startsWith("http")
                          ? targetUrl
                          : `https://${targetUrl}`,
                      );
                      const cleanP = parsed.pathname
                        .replace(/^\/+/, "")
                        .replace(/\/+$/, "");
                      if (cleanP) setPathLockPrefix(cleanP);
                    } catch {}
                  }
                } else {
                  setPathLockMode("off");
                }
              }}
              className={cn(
                "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
                pathLockMode !== "off" ? "bg-brand" : "bg-zinc-200 dark:bg-neutral-800",
              )}
            >
              <span
                className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-xs absolute top-1 transition-transform",
                  pathLockMode !== "off" ? "translate-x-1" : "-translate-x-5",
                )}
              />
            </button>
          </div>

          {pathLockMode !== "off" && (
            <div className="flex flex-col gap-3 pt-2 border-t border-zinc-200 dark:border-[#222225] animate-in fade-in">
              {/* Isolation Mode Format Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pt-0.5">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    Isolation Mode Scope
                  </span>
                  <span className="text-[10.5px] text-zinc-500 dark:text-neutral-400">
                    Choose the restriction scope for visitor navigation.
                  </span>
                </div>
                <span className="text-[9.5px] font-bold text-brand uppercase px-2 py-0.5 rounded-[4px] bg-brand/10 border border-brand/30 self-start sm:self-auto shrink-0">
                  {pathLockMode === "strict" ? "Strict Single-Page" : "Funnel & Subpaths"}
                </span>
              </div>

              {/* Radio Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {/* Option 1: Strict Single-Page */}
                <button
                  type="button"
                  onClick={() => setPathLockMode("strict")}
                  className={cn(
                    "p-3 rounded-[8px] border flex flex-col items-start gap-1.5 transition-all cursor-pointer text-left relative",
                    pathLockMode === "strict"
                      ? "bg-brand/10 border-brand text-zinc-900 dark:text-white shadow-sm ring-1 ring-brand/50"
                      : "bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] text-zinc-600 dark:text-neutral-400 hover:border-zinc-300 dark:hover:border-neutral-600 hover:text-zinc-900 dark:hover:text-neutral-200",
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Sparkles
                        className={cn(
                          "w-4 h-4",
                          pathLockMode === "strict"
                            ? "text-brand"
                            : "text-zinc-400 dark:text-neutral-500",
                        )}
                      />
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        Strict Single-Page
                      </span>
                    </div>
                    {pathLockMode === "strict" && (
                      <Check className="w-3.5 h-3.5 text-brand" />
                    )}
                  </div>
                  <span className="text-[10.5px] text-zinc-500 dark:text-neutral-400 leading-tight">
                    Locks visitor strictly to the target URL. Any outside subpath triggers an immediate security gate.
                  </span>
                </button>

                {/* Option 2: Funnel & Subpaths */}
                <button
                  type="button"
                  onClick={() => setPathLockMode("funnel")}
                  className={cn(
                    "p-3 rounded-[8px] border flex flex-col items-start gap-1.5 transition-all cursor-pointer text-left relative",
                    pathLockMode === "funnel"
                      ? "bg-brand/10 border-brand text-zinc-900 dark:text-white shadow-sm ring-1 ring-brand/50"
                      : "bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] text-zinc-600 dark:text-neutral-400 hover:border-zinc-300 dark:hover:border-neutral-600 hover:text-zinc-900 dark:hover:text-neutral-200",
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <LayoutGrid
                        className={cn(
                          "w-4 h-4",
                          pathLockMode === "funnel"
                            ? "text-brand"
                            : "text-zinc-400 dark:text-neutral-500",
                        )}
                      />
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        Funnel &amp; Subpaths
                      </span>
                    </div>
                    {pathLockMode === "funnel" && (
                      <Check className="w-3.5 h-3.5 text-brand" />
                    )}
                  </div>
                  <span className="text-[10.5px] text-zinc-500 dark:text-neutral-400 leading-tight">
                    Permits all nested steps of the funnel (checkout, confirmation). Blocks outside site navigation.
                  </span>
                </button>
              </div>

              {/* Sub-inputs: Allowed Path Prefix & Warning Message */}
              <div className="flex flex-col gap-2.5 pt-2 border-t border-zinc-200 dark:border-[#222225] mt-1">
                {pathLockMode === "strict" && (
                  <div className="flex flex-col gap-1 p-2.5 rounded-[8px] bg-brand/5 border border-brand/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[10.5px] font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        Locked Target Page (Strict Single-Page)
                      </span>
                      <span className="text-[10px] text-zinc-500 dark:text-neutral-400 font-mono">
                        100% Strict Isolation
                      </span>
                    </div>
                    <span className="text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate">
                      {targetUrl ? (
                        (() => {
                          try {
                            const u = new URL(
                              targetUrl.startsWith("http")
                                ? targetUrl
                                : `https://${targetUrl}`,
                            );
                            return u.pathname || "/";
                          } catch {
                            return "/";
                          }
                        })()
                      ) : (
                        "Target destination URL"
                      )}
                    </span>
                    <p className="text-[10px] text-zinc-500 dark:text-neutral-500 mt-0.5">
                      Visitors are strictly limited to this single page. No path prefix is required.
                    </p>
                  </div>
                )}

                {pathLockMode === "funnel" && (
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <label className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
                        Allowed Path Prefix
                      </label>
                      {targetUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              const parsed = new URL(
                                targetUrl.startsWith("http")
                                  ? targetUrl
                                  : `https://${targetUrl}`,
                              );
                              const cleanP = parsed.pathname
                                .replace(/^\/+/, "")
                                .replace(/\/+$/, "");
                              if (cleanP) setPathLockPrefix(cleanP);
                            } catch {}
                          }}
                          className="text-[10px] text-brand hover:underline cursor-pointer font-semibold flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" /> Auto-detect from URL
                        </button>
                      )}
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-neutral-500 font-mono text-xs">
                        /
                      </span>
                      <Input
                        placeholder="e.g. checkout (default route: /)"
                        value={pathLockPrefix}
                        onChange={(e) =>
                          setPathLockPrefix(e.target.value.replace(/^\/+/, ""))
                        }
                        className="pl-6 bg-zinc-50 dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] focus:border-brand text-zinc-900 dark:text-white text-xs h-8.5 rounded-[8px] font-mono placeholder:text-zinc-400 dark:placeholder:text-neutral-500"
                      />
                    </div>
                    <p className="text-[10px] text-zinc-500 dark:text-neutral-500">
                      Allows access to sub-pages under this prefix. Leave empty to allow the full funnel (default route: <code className="text-zinc-600 dark:text-neutral-400 font-mono">/</code>).
                    </p>
                    <p className="text-[10px] text-zinc-500 dark:text-neutral-500">
                      In-page anchors (<code className="text-zinc-600 dark:text-neutral-400 font-mono">#features</code>, <code className="text-zinc-600 dark:text-neutral-400 font-mono">#reviews</code>) and query parameters are 100% preserved.
                    </p>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
                    Custom Block Notice Message <span className="text-zinc-400 dark:text-neutral-500 font-normal lowercase">(optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Link author has restricted navigation to this isolated page."
                    value={pathLockMessage}
                    onChange={(e) => setPathLockMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-[8px] bg-zinc-50 dark:bg-[#101012] border border-zinc-200 dark:border-[#27272a] focus:border-brand text-zinc-900 dark:text-white text-xs outline-none transition-colors resize-none leading-relaxed"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300">
                    Developer / Team Bypass Password <span className="text-zinc-400 dark:text-neutral-500 font-normal lowercase">(optional)</span>
                  </label>
                  <div className="relative">
                    <Input
                      type={showPathLockPassword ? "text" : "password"}
                      placeholder="Set a bypass password for testers..."
                      value={pathLockPassword}
                      onChange={(e) => setPathLockPassword(e.target.value)}
                      className="bg-zinc-50 dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] focus:border-brand text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-9 rounded-[8px] pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPathLockPassword((prev) => !prev)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer"
                      title={showPathLockPassword ? "Hide password" : "Show password"}
                    >
                      {showPathLockPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-500 dark:text-neutral-500">
                    Allows developers and testers to bypass the navigation restriction by entering this password.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </LockedProFeature>

      {/* 6. Automatic Expiration Date (PRO) */}
      <LockedProFeature
        title="Scheduled Expiration Date"
        description="Set an exact expiration date and time when the link should expire."
        isUnlocked={isProPlan}
      >
        <div className="flex flex-col gap-2 p-3 rounded-[8px] bg-white dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] shadow-xs">
          <label className="block text-xs font-bold text-zinc-900 dark:text-white">
            Expiration Date &amp; Time
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
            After this date, visitor clicks will be automatically redirected to the &quot;Link Expired&quot; landing notice.
          </p>
        </div>
      </LockedProFeature>
    </div>
  );
}
