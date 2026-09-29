"use client";

import React, { useState } from "react";
import { X, Download, ExternalLink, Copy, Check, Image as ImageIcon } from "lucide-react";

export interface BannerLightboxData {
  imageUrl: string;
  title?: string;
  description?: string;
  slug?: string;
  shortUrl?: string;
  targetUrl?: string;
}

interface BannerLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: BannerLightboxData | null;
  imageUrl?: string;
  title?: string;
  description?: string;
  slug?: string;
  shortUrl?: string;
  targetUrl?: string;
}

export function BannerLightboxModal({
  isOpen,
  onClose,
  data: propData,
  imageUrl,
  title,
  description,
  slug,
  shortUrl,
  targetUrl,
}: BannerLightboxModalProps) {
  const [downloading, setDownloading] = useState(false);
  const [copied, setCopied] = useState(false);

  const data: BannerLightboxData | null =
    propData ||
    (imageUrl
      ? { imageUrl, title, description, slug, shortUrl, targetUrl }
      : null);

  if (!isOpen || !data || !data.imageUrl) return null;

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(data.imageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const response = await fetch(data.imageUrl, { mode: "cors" });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const ext = blob.type.includes("png")
        ? "png"
        : blob.type.includes("webp")
          ? "webp"
          : blob.type.includes("svg")
            ? "svg"
            : "jpg";
      const safeName = (data.slug || data.title || "lshorter-banner")
        .replace(/[^a-zA-Z0-9_-]/g, "-")
        .toLowerCase();
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `banner-${safeName}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      // Fallback: open or trigger direct download via anchor if CORS blocks blob fetch
      const a = document.createElement("a");
      a.href = data.imageUrl;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.download = `banner-${data.slug || "link"}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-[720px] rounded-2xl bg-white dark:bg-[#0F0F11] text-[#09090B] dark:text-[#FAFAFA] border border-black/[0.08] dark:border-white/[0.1] shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#3B82F6]/10 border border-[#3B82F6]/20 flex items-center justify-center text-[#3B82F6] shrink-0">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-[#09090B] dark:text-white truncate">
                {data.title || (data.slug ? `Banner • /${data.slug}` : "Link Banner Preview")}
              </h3>
              {data.shortUrl && (
                <p className="text-xs font-mono text-[#52525B] dark:text-[#A1A1AA] truncate">
                  {data.shortUrl}
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Large Image Canvas */}
        <div className="relative w-full bg-[#F4F4F5] dark:bg-[#09090B] flex items-center justify-center p-4 sm:p-6 min-h-[280px] max-h-[65vh] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={data.imageUrl}
            alt={data.title || "Link Banner"}
            className="max-w-full max-h-[58vh] w-auto h-auto object-contain rounded-xl border border-black/[0.08] dark:border-white/[0.08] shadow-md bg-white dark:bg-[#141416]"
          />
        </div>

        {/* Optional Description & Footer Actions */}
        <div className="px-5 py-4 bg-white dark:bg-[#0F0F11] border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            {data.description ? (
              <p className="text-xs text-[#52525B] dark:text-[#A1A1AA] line-clamp-2">
                {data.description}
              </p>
            ) : (
              <p className="text-xs font-mono text-[#71717A] truncate">
                {data.imageUrl}
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {data.slug && (
              <a
                href={`/r/${encodeURIComponent(data.slug)}`}
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
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#465FFF]/10 hover:bg-[#465FFF]/20 text-[#465FFF] border border-[#465FFF]/25 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Short Link</span>
              </a>
            )}

            <button
              type="button"
              onClick={handleCopyUrl}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-[#09090B] dark:text-white border border-black/[0.08] dark:border-white/[0.08] transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied URL</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy URL</span>
                </>
              )}
            </button>

            <a
              href={data.imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-black/[0.04] dark:bg-white/[0.06] hover:bg-black/[0.08] dark:hover:bg-white/[0.1] text-[#09090B] dark:text-white border border-black/[0.08] dark:border-white/[0.08] transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Banner</span>
            </a>

            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium bg-[#3B82F6] hover:bg-[#2563EB] text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{downloading ? "Downloading..." : "Download"}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
