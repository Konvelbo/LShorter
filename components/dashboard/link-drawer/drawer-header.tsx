"use client";

import React, { useState, useRef, useEffect } from "react";
import { X, Link2, ChevronDown, ChevronUp, EyeOff, Eye } from "lucide-react";
import gsap from "gsap";
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
  isTopCollapsed?: boolean;
  onToggleTopCollapse?: () => void;
}

export function DrawerHeader({
  isEditMode,
  slug,
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
  isTopCollapsed: controlledCollapsed,
  onToggleTopCollapse,
}: DrawerHeaderProps) {
  const [internalCollapsed, setInternalCollapsed] = useState(false);
  const isCollapsed =
    controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;

  const collapsibleRef = useRef<HTMLDivElement>(null);
  const compactBadgeRef = useRef<HTMLDivElement>(null);
  const isFirstRender = useRef(true);

  const toggleCollapse = () => {
    if (onToggleTopCollapse) {
      onToggleTopCollapse();
    } else {
      setInternalCollapsed((prev) => !prev);
    }
  };

  // GSAP smooth height & opacity animation when masking/unmasking the top section
  useEffect(() => {
    const el = collapsibleRef.current;
    if (!el) return;

    if (isFirstRender.current) {
      isFirstRender.current = false;
      gsap.set(el, {
        height: isCollapsed ? 0 : "auto",
        opacity: isCollapsed ? 0 : 1,
        overflow: "hidden",
      });
      return;
    }

    if (isCollapsed) {
      gsap.fromTo(
        el,
        { height: el.scrollHeight, opacity: 1 },
        {
          height: 0,
          opacity: 0,
          duration: 0.36,
          ease: "power3.inOut",
        }
      );
      if (compactBadgeRef.current) {
        gsap.fromTo(
          compactBadgeRef.current,
          { opacity: 0, y: -6 },
          { opacity: 1, y: 0, duration: 0.28, delay: 0.12, ease: "power2.out" }
        );
      }
    } else {
      gsap.to(el, {
        height: "auto",
        opacity: 1,
        duration: 0.38,
        ease: "power3.out",
      });
    }
  }, [isCollapsed]);

  // Automatically expand if validation errors occur in top fields
  useEffect(() => {
    if (
      (fieldErrors.targetUrl || fieldErrors.domainName || fieldErrors.slug) &&
      isCollapsed
    ) {
      if (onToggleTopCollapse) {
        onToggleTopCollapse();
      } else {
        setInternalCollapsed(false);
      }
    }
  }, [
    fieldErrors.targetUrl,
    fieldErrors.domainName,
    fieldErrors.slug,
    isCollapsed,
    onToggleTopCollapse,
  ]);

  return (
    <div className="flex flex-col border-b border-zinc-200 dark:border-[#222225] bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md px-3.5 sm:px-5 pt-3 pb-2.5 shrink-0 sticky top-0 z-30 transition-colors">
      {/* Title & Action Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="w-2.5 h-2.5 rounded-full bg-[#0066FF] animate-pulse shadow-sm shadow-[#0066FF]/40 shrink-0" />
          <h2 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white tracking-tight leading-tight truncate">
            {isEditMode ? "Edit Redirect" : "Create Redirect"}
          </h2>

          {/* Compact summary pill shown when top is masked */}
          {isCollapsed && (
            <div
              ref={compactBadgeRef}
              onClick={toggleCollapse}
              title="Click to unmask destination & slug fields"
              className="hidden sm:flex items-center gap-1.5 px-2.5 py-0.5 rounded-[8px] bg-[#0066FF]/10 border border-[#0066FF]/25 text-[11px] font-mono text-[#0066FF] cursor-pointer hover:bg-[#0066FF]/15 transition-colors max-w-[240px] truncate"
            >
              <span className="truncate font-semibold">
                {domainName || "lsho.cc"}/{slug || "..."}
              </span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {/* Mask / Unmask Top Section Button */}
          <button
            type="button"
            onClick={toggleCollapse}
            className={cn(
              "h-7 px-2.5 rounded-[8px] border text-[11px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer",
              isCollapsed
                ? "bg-[#0066FF] text-white border-[#0066FF] shadow-xs hover:bg-[#0052cc]"
                : "bg-zinc-100 dark:bg-[#1c1c20] border-zinc-200 dark:border-[#27272a] text-zinc-600 dark:text-neutral-300 hover:text-zinc-900 dark:hover:text-white hover:border-zinc-300 dark:hover:border-[#3f3f46]"
            )}
            title={
              isCollapsed
                ? "Show destination URL & slug inputs"
                : "Hide top inputs to maximize workspace space"
            }
          >
            {isCollapsed ? (
              <>
                <Eye className="w-3.5 h-3.5" />
                <span>Show Top</span>
                <ChevronDown className="w-3 h-3" />
              </>
            ) : (
              <>
                <EyeOff className="w-3.5 h-3.5" />
                <span>Hide Top</span>
                <ChevronUp className="w-3 h-3" />
              </>
            )}
          </button>

          {/* Close Drawer Button */}
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-[8px] bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 hover:bg-zinc-200 dark:hover:bg-white/10 flex items-center justify-center text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close drawer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Collapsible Top Container animated by GSAP */}
      <div ref={collapsibleRef} className="overflow-hidden">
        <p className="text-[11px] text-zinc-500 dark:text-neutral-400 mt-1 mb-2.5 leading-tight">
          Configure destination, smart routing rules, and HTTP behavior.
        </p>

        {/* ── PINNED MAIN INPUTS: URL, DOMAIN, SLUG ── */}
        <div className="bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] rounded-[10px] p-3 flex flex-col gap-2.5 shadow-xs">
          {/* Field 1: Destination URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-[#0066FF]" />
                <span>Destination URL</span>
                <span className="text-[#0066FF]">*</span>
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
                "bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] focus:border-[#0066FF] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-9 rounded-[10px]",
                fieldErrors.targetUrl && "border-red-500/60 bg-red-500/5"
              )}
            />
            <FieldErrorAlert message={fieldErrors.targetUrl} />
          </div>

          {/* Fields 2 & 3: Domain (select) + Custom Slug */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Domain Name */}
            <div>
              <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-zinc-700 dark:text-neutral-300 mb-1">
                Domain <span className="text-[#0066FF]">*</span>
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
                    "w-full appearance-none bg-white dark:bg-[#101012] border border-zinc-200 dark:border-[#27272a] focus:border-[#0066FF] text-zinc-900 dark:text-white text-xs h-9 pl-3 pr-8 rounded-[10px] transition-colors cursor-pointer outline-none",
                    isEditMode && "opacity-60 cursor-not-allowed",
                    fieldErrors.domainName && "border-red-500/60 bg-red-500/5"
                  )}
                >
                  {!isEditMode && !domainName && (
                    <option
                      value=""
                      disabled
                      className="bg-white dark:bg-[#141416] text-zinc-500 dark:text-neutral-400"
                    >
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
                Custom Slug <span className="text-[#0066FF]">*</span>
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
                    "pl-6 bg-white dark:bg-[#101012] border-zinc-200 dark:border-[#27272a] focus:border-[#0066FF] text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 text-xs h-9 rounded-[10px] font-mono leading-normal",
                    fieldErrors.slug && "border-red-500/60 bg-red-500/5"
                  )}
                />
              </div>
              <FieldErrorAlert message={fieldErrors.slug} />
            </div>
          </div>

          {/* Direct preview line */}
          <div className="text-[10.5px] text-zinc-500 dark:text-neutral-400 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 min-w-0">
              <span className="shrink-0">Direct link preview:</span>
              {slug ? (
                <a
                  href={`/r/${encodeURIComponent(slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    if (typeof window !== "undefined") {
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent("lshorter_data_change"));
                        window.dispatchEvent(new CustomEvent("lshorter_links_updated"));
                      }, 900);
                      setTimeout(() => {
                        window.dispatchEvent(new CustomEvent("lshorter_data_change"));
                        window.dispatchEvent(new CustomEvent("lshorter_links_updated"));
                      }, 2200);
                    }
                  }}
                  className="text-[#0066FF] hover:underline font-mono font-bold truncate cursor-pointer"
                >
                  https://{domainName || "lsho.cc"}/{slug}
                </a>
              ) : (
                <span className="text-[#0066FF] font-mono font-bold truncate">
                  https://{domainName || "lsho.cc"}/...
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={toggleCollapse}
              className="text-[10px] font-semibold text-zinc-400 hover:text-[#0066FF] transition-colors shrink-0 cursor-pointer flex items-center gap-0.5"
            >
              <span> Collapse top</span>
              <ChevronUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
