"use client";

import React from "react";
import { X, Link2, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { FieldErrorAlert } from "./field-error-alert";

interface DrawerHeaderProps {
  isEditMode: boolean;
  slug: string;
  linkSlug?: string;
  onClose: () => void;
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  domainName: string;
  setDomainName: (domain: string) => void;
  customDomains: Array<{ id: string; domain: string; status: string }>;
  setSlug: (slug: string) => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  checkUrlFormat: (val: string, isRequired?: boolean) => string;
  checkDomainFormat: (val: string) => string;
  checkSlugFormat: (val: string) => string;
}

export function DrawerHeader({
  isEditMode,
  slug,
  linkSlug,
  onClose,
  targetUrl,
  setTargetUrl,
  domainName,
  setDomainName,
  customDomains,
  setSlug,
  fieldErrors,
  setFieldErrors,
  checkUrlFormat,
  checkDomainFormat,
  checkSlugFormat,
}: DrawerHeaderProps) {
  return (
    <div className="flex flex-col border-b border-zinc-200 dark:border-[#222225] bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md px-3.5 sm:px-6 pt-3.5 sm:pt-4 pb-3 sm:pb-3.5 shrink-0 sticky top-0 z-30">
      {/* Title Row */}
      <div className="flex items-center justify-between gap-3 mb-2 sm:mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-brand animate-pulse shadow-sm shadow-[var(--brand-primary-glow)] shrink-0" />
          <div className="flex items-center gap-2 min-w-0">
            <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight leading-tight truncate">
              {isEditMode ? "Edit Redirect" : "Create Redirect"}
            </h2>
            {(slug || linkSlug) && (
              <span className="font-mono text-xs px-2 py-0.5 rounded-[6px] bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-zinc-700 dark:text-neutral-300 truncate max-w-[120px] sm:max-w-none">
                /{slug || linkSlug}
              </span>
            )}
          </div>
        </div>

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center justify-center text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
          aria-label="Close drawer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[11px] text-zinc-500 dark:text-neutral-400 -mt-1 mb-2.5 sm:mb-3 leading-tight">
        Configure destination, smart routing rules, and HTTP behavior.
      </p>

      {/* ── PINNED MAIN INPUTS: URL, DOMAIN, SLUG ── */}
      <div className="bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] rounded-[10px] p-3 sm:p-3.5 flex flex-col gap-2.5 shadow-xs">
        {/* Field 1: Destination URL */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300 flex items-center gap-1.5">
              <Link2 className="w-3.5 h-3.5 text-brand" />
              <span>Destination URL</span>
              <span className="text-brand">*</span>
            </label>
            <span className="text-[9.5px] font-bold uppercase px-1.5 py-0.5 rounded-[4px] bg-zinc-200/80 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400">
              Required
            </span>
          </div>
          <Input
            required
            placeholder="https://example.com/target-landing-page"
            value={targetUrl}
            onChange={(e) => {
              setTargetUrl(e.target.value);
              if (fieldErrors.targetUrl) {
                setFieldErrors((prev) => ({
                  ...prev,
                  targetUrl: checkUrlFormat(e.target.value, true),
                }));
              }
            }}
            className={cn(
              "bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] focus:border-brand text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-9 sm:h-9.5 rounded-[8px]",
              fieldErrors.targetUrl && "border-red-500/60 bg-red-500/5",
            )}
          />
          <FieldErrorAlert message={fieldErrors.targetUrl} />
          <p className="text-[10px] text-zinc-500 dark:text-neutral-500 mt-1">
            Visitors will be redirected immediately to this primary default destination.
          </p>
        </div>

        {/* Fields 2 & 3: Domain (select) + Custom Slug */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {/* Domain Name */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300 mb-1">
              Domain <span className="text-brand">*</span>
            </label>
            <div className="relative flex items-center">
              <select
                required
                disabled={isEditMode}
                value={domainName}
                onChange={(e) => {
                  setDomainName(e.target.value);
                  if (fieldErrors.domainName) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      domainName: checkDomainFormat(e.target.value),
                    }));
                  }
                }}
                className={cn(
                  "w-full appearance-none bg-white dark:bg-[#101012] border border-zinc-200 dark:border-[#27272a] focus:border-brand text-zinc-900 dark:text-white text-xs h-9 sm:h-9.5 pl-3 pr-8 rounded-[8px] transition-colors cursor-pointer outline-none",
                  isEditMode && "opacity-60 cursor-not-allowed",
                  fieldErrors.domainName && "border-red-500/60 bg-red-500/5",
                )}
              >
                {!isEditMode && !domainName && (
                  <option value="" disabled className="bg-white dark:bg-[#141416] text-zinc-500 dark:text-neutral-400">
                    Select a domain...
                  </option>
                )}
                {customDomains.length > 0 &&
                  customDomains.map((cd) => (
                    <option
                      key={cd.id}
                      value={cd.domain}
                      className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white"
                    >
                      {cd.domain}
                    </option>
                  ))}
                {customDomains.length === 0 && (
                  <option
                    value="lsho.cc"
                    className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white"
                  >
                    lsho.cc (Default)
                  </option>
                )}
                {isEditMode &&
                  domainName &&
                  !customDomains.find((cd) => cd.domain === domainName) && (
                    <option
                      value={domainName}
                      className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white"
                    >
                      {domainName}
                    </option>
                  )}
              </select>
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400 dark:text-neutral-400">
                <ChevronDown className="w-3.5 h-3.5" />
              </div>
            </div>
            <FieldErrorAlert message={fieldErrors.domainName} />
          </div>

          {/* Custom Slug */}
          <div>
            <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300 mb-1">
              Custom Slug <span className="text-brand">*</span>
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 dark:text-neutral-500 font-mono select-none pointer-events-none font-medium">
                /
              </span>
              <Input
                required
                placeholder="my-short-link"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  if (fieldErrors.slug) {
                    setFieldErrors((prev) => ({
                      ...prev,
                      slug: checkSlugFormat(e.target.value),
                    }));
                  }
                }}
                className={cn(
                  "pl-6 bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] focus:border-brand text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-9 sm:h-9.5 rounded-[8px] font-mono leading-normal",
                  fieldErrors.slug && "border-red-500/60 bg-red-500/5",
                )}
              />
            </div>
            <FieldErrorAlert message={fieldErrors.slug} />
          </div>
        </div>

        {/* Direct preview line */}
        <div className="text-[10.5px] text-zinc-500 dark:text-neutral-400 flex items-center gap-1">
          <span>Direct link preview:</span>
          <span className="text-brand font-mono font-bold truncate">
            https://{domainName || "lsho.cc"}/{slug || "..."}
          </span>
        </div>
      </div>
    </div>
  );
}
