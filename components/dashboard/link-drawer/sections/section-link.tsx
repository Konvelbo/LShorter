"use client";

import React, { useState } from "react";
import { Dices, Copy, Check, ChevronDown, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { FieldErrorAlert } from "../field-error-alert";
import { showToast } from "@/components/ui/toast-provider";

interface SectionLinkProps {
  isEditMode: boolean;
  targetUrl: string;
  setTargetUrl: (url: string) => void;
  domainName: string;
  setDomainName: (domain: string) => void;
  customDomains: Array<{ id: string; domain: string; status: string }>;
  slug: string;
  setSlug: (slug: string) => void;
  tagsInput?: string;
  setTagsInput?: (tags: string) => void;
  fieldErrors: Record<string, string>;
  setFieldErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  checkUrlFormat: (val: string, isRequired?: boolean) => string;
  checkDomainFormat: (val: string) => string;
  checkSlugFormat: (val: string) => string;
}

export function SectionLink({
  isEditMode,
  targetUrl,
  setTargetUrl,
  domainName,
  setDomainName,
  customDomains,
  slug,
  setSlug,
  tagsInput = "",
  setTagsInput,
  fieldErrors,
  setFieldErrors,
  checkUrlFormat,
  checkDomainFormat,
  checkSlugFormat,
}: SectionLinkProps) {
  const [copied, setCopied] = useState(false);

  const generateRandomSlug = () => {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSlug(result);
    if (fieldErrors.slug) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.slug;
        return next;
      });
    }
  };

  const handleCopyPreview = () => {
    const full = `https://${domainName || "lsho.cc"}/${slug || ""}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(full);
      setCopied(true);
      showToast.success("Short link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const currentShortUrl = `${domainName || "lsho.cc"}/${slug || "…"}`;
  const currentTarget = targetUrl || "…";

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-200">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-[#131417] dark:text-[#f1f2f4]">
          Where should your link go?
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
          Paste the destination and choose your short link.
        </p>
      </div>

      {/* Destination URL */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="dest-url"
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
        >
          Destination URL <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <input
            id="dest-url"
            type="url"
            required
            placeholder="https://example.com/page"
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
              "w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal",
              fieldErrors.targetUrl && "border-red-500/70 bg-red-500/5",
            )}
          />
        </div>
        <FieldErrorAlert message={fieldErrors.targetUrl} />
      </div>

      {/* Domain & Custom Slug */}
      <div className="flex flex-col gap-1.5 mt-1">
        <label
          htmlFor="custom-slug"
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200"
        >
          Short link <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2">
          {/* Domain Selector */}
          <div className="relative w-[40%] min-w-[120px]">
            <select
              id="domain-select"
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
                "w-full appearance-none bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg pl-3 pr-8 py-2.5 text-sm outline-none transition-colors cursor-pointer",
                isEditMode && "opacity-60 cursor-not-allowed",
                fieldErrors.domainName && "border-red-500/70 bg-red-500/5",
              )}
            >
              {!isEditMode && !domainName && (
                <option value="" disabled>
                  Domain...
                </option>
              )}
              {customDomains.map((cd) => (
                <option key={cd.id} value={cd.domain}>
                  {cd.domain}
                </option>
              ))}
              {customDomains.length === 0 && (
                <option value="lsho.cc">lsho.cc</option>
              )}
              {isEditMode &&
                domainName &&
                !customDomains.find((cd) => cd.domain === domainName) && (
                  <option value={domainName}>{domainName}</option>
                )}
            </select>
            <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500 dark:text-[#8a8f9a]" />
          </div>

          {/* Custom Slug Input */}
          <div className="relative flex-1">
            <input
              id="custom-slug"
              required
              placeholder="custom-slug"
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
                "w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm font-mono outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal",
                fieldErrors.slug && "border-red-500/70 bg-red-500/5",
              )}
            />
          </div>

          {/* Random Slug Generator Button */}
          {!isEditMode && (
            <button
              type="button"
              onClick={generateRandomSlug}
              title="Generate random slug"
              className="p-2.5 bg-zinc-100 dark:bg-[#16181d] hover:bg-zinc-200 dark:hover:bg-[#22242a] text-zinc-600 hover:text-zinc-900 dark:text-[#8a8f9a] dark:hover:text-[#f1f2f4] rounded-lg border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer shrink-0"
              aria-label="Generate random slug"
            >
              <Dices className="w-4 h-4" />
            </button>
          )}
        </div>
        <FieldErrorAlert message={fieldErrors.domainName || fieldErrors.slug} />
      </div>

      {/* Tags Input (Relocated from Advanced, directly above Preview Card) */}
      <div className="flex flex-col gap-1.5 mt-1">
        <label
          htmlFor="link-tags"
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5"
        >
          <Tag className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span>Tags (Optional)</span>
        </label>
        <input
          id="link-tags"
          type="text"
          placeholder="promo2026, affiliate, campaign (separated by commas)"
          value={tagsInput}
          onChange={(e) => setTagsInput?.(e.target.value)}
          className="w-full bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#1d5fe0] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#1d5fe0] dark:focus:ring-[#3b82f6] rounded-lg px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal"
        />
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Separate tags with commas to filter and organize links in your dashboard.
        </p>
      </div>

      {/* Live Preview Result Box */}
      <div className="mt-2 p-4 rounded-xl bg-zinc-50 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a] text-sm text-zinc-700 dark:text-[#8a8f9a] break-all leading-relaxed flex items-start justify-between gap-3 shadow-xs">
        <div>
          Visitors to{" "}
          <b className="text-zinc-900 dark:text-[#f1f2f4] font-semibold">
            {currentShortUrl}
          </b>{" "}
          will be sent to{" "}
          <b className="text-zinc-900 dark:text-[#f1f2f4] font-semibold">
            {currentTarget}
          </b>
        </div>
        {slug && (
          <button
            type="button"
            onClick={handleCopyPreview}
            title="Copy preview link"
            className="p-1.5 rounded-md hover:bg-white dark:hover:bg-[#0e0f12] text-zinc-600 dark:text-[#8a8f9a] hover:text-zinc-900 dark:hover:text-[#f1f2f4] transition-colors cursor-pointer shrink-0"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
}
