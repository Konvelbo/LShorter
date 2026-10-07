"use client";

import React, { useState, useEffect, useRef, useId } from "react";
import { Dices, Copy, Check, ChevronDown, Tag as TagIcon } from "lucide-react";
import { type Tag as EmblorTag, TagInput } from "emblor";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FieldErrorAlert } from "../field-error-alert";
import { showToast } from "@/components/ui/toast-provider";
import { Input } from "@/components/ui/input";

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
  const tagInputId = useId();
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null);
  const [emblorTags, setEmblorTags] = useState<EmblorTag[]>(() => {
    if (!tagsInput) return [];
    return tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .map((text, idx) => ({ id: `${text}-${idx}`, text }));
  });

  const lastDispatchedTagsRef = useRef<string>(tagsInput || "");

  useEffect(() => {
    lastDispatchedTagsRef.current = tagsInput || "";
    const currentSerialized = emblorTags.map((t) => t.text).join(", ");
    if (tagsInput !== currentSerialized) {
      if (!tagsInput) {
        setEmblorTags([]);
      } else {
        const parsed = tagsInput
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .map((text, idx) => ({ id: `${text}-${idx}`, text }));
        setEmblorTags(parsed);
      }
    }
  }, [tagsInput]);

  const handleUpdateTags = (newTags: React.SetStateAction<EmblorTag[]>) => {
    setEmblorTags((prev) => {
      const resolved = typeof newTags === "function" ? newTags(prev) : newTags;
      const joined = resolved.map((t) => t.text.trim()).filter(Boolean).join(", ");
      if (setTagsInput && joined !== lastDispatchedTagsRef.current) {
        lastDispatchedTagsRef.current = joined;
        setTimeout(() => {
          setTagsInput(joined);
        }, 0);
      }
      return resolved;
    });
  };

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
          <Input
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
              "h-10 text-sm",
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
                "w-full h-10 appearance-none bg-white dark:bg-[#16181d] text-zinc-900 dark:text-[#f1f2f4] border border-zinc-300 dark:border-[#27272a] focus:border-[#0066FF] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#0066FF] dark:focus:ring-[#3b82f6] rounded-[10px] pl-3 pr-8 py-2 text-sm outline-none transition-colors cursor-pointer",
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
            <Input
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
                "h-10 text-sm font-mono",
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
              className="p-2.5 bg-zinc-100 dark:bg-[#16181d] hover:bg-zinc-200 dark:hover:bg-[#22242a] text-zinc-600 hover:text-zinc-900 dark:text-[#8a8f9a] dark:hover:text-[#f1f2f4] rounded-[10px] border border-zinc-200 dark:border-zinc-800 transition-colors cursor-pointer shrink-0"
              aria-label="Generate random slug"
            >
              <Dices className="w-4 h-4" />
            </button>
          )}
        </div>
        <FieldErrorAlert message={fieldErrors.domainName || fieldErrors.slug} />
      </div>

      {/* Tags Input (comp-56 emblor TagInput) */}
      <div className="flex flex-col gap-1.5 mt-1 w-full">
        <Label
          htmlFor={tagInputId}
          className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5"
        >
          <TagIcon className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
          <span>Tags (Optional)</span>
        </Label>
        <div className="lshorter-tag-container w-full flex flex-col items-start">
          <TagInput
            id={tagInputId}
            tags={emblorTags}
            setTags={handleUpdateTags}
            activeTagIndex={activeTagIndex}
            setActiveTagIndex={setActiveTagIndex}
            inlineTags={false}
            inputFieldPosition="top"
            placeholder="Add tags (press Enter)..."
            styleClasses={{
              input:
                "w-full h-10 rounded-[10px] bg-white dark:bg-[#16181d] border border-zinc-300 dark:border-[#27272a] text-zinc-900 dark:text-[#f1f2f4] placeholder:text-zinc-400 dark:placeholder:text-[#8a8f9a] text-sm px-3 focus:outline-none focus:ring-1 focus:ring-[#0066FF] dark:focus:ring-[#3b82f6] focus:border-[#0066FF] dark:focus:border-[#3b82f6] transition-colors text-left",
              tag: {
                body: "relative h-7 bg-zinc-100 dark:bg-[#20222a] border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-200/80 dark:hover:bg-[#282b35] rounded-md font-medium text-xs ps-2 pe-7 text-zinc-800 dark:text-zinc-200 shadow-2xs transition-colors",
                closeButton:
                  "absolute -inset-y-px -end-px p-0 rounded-s-none rounded-e-md flex size-7 transition-colors outline-none text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-100 hover:bg-zinc-200/50 dark:hover:bg-zinc-700/50",
              },
              tagList: {
                container: "flex flex-wrap items-center justify-start gap-1.5 pt-1 w-full",
              },
            }}
          />
        </div>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Press enter to add tags to filter and organize links in your dashboard.
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
