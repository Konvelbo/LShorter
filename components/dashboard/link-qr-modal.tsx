"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  X,
  QrCode,
  Download,
  Share2,
  Sliders,
  Check,
  ArrowUpRight,
} from "lucide-react";
import { ShortLink } from "@/types";

interface LinkQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: ShortLink | null;
}

const FIXED_EXPORT_RESOLUTION = 1024;

const SOBER_SWATCHES = [
  { name: "Obsidian", hex: "#09090B" },
  { name: "Slate", hex: "#1E293B" },
  { name: "Forest", hex: "#0B6E4F" },
  { name: "Indigo", hex: "#3641F5" },
  { name: "Ember", hex: "#FF6600" },
];

export function LinkQRModal({ isOpen, onClose, link }: LinkQRModalProps) {
  const [selectedColor, setSelectedColor] = useState("#09090B");
  const [bgColor] = useState("#FFFFFF");
  const [includeQuietZone, setIncludeQuietZone] = useState(true);
  const [sharedCopied, setSharedCopied] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !link || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      link.shortUrl,
      {
        width: FIXED_EXPORT_RESOLUTION,
        margin: includeQuietZone ? 2 : 0,
        color: {
          dark: selectedColor,
          light: bgColor,
        },
        errorCorrectionLevel: "H",
      },
      (error) => {
        if (error) console.error("QR canvas error:", error);
      }
    );
  }, [isOpen, link, selectedColor, bgColor, includeQuietZone]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !link) return null;

  const handleDownloadPNG = async () => {
    try {
      const dataUrl = await QRCode.toDataURL(link.shortUrl, {
        width: FIXED_EXPORT_RESOLUTION,
        margin: includeQuietZone ? 2 : 0,
        color: {
          dark: selectedColor,
          light: bgColor,
        },
        errorCorrectionLevel: "H",
      });
      const downloadLink = document.createElement("a");
      downloadLink.href = dataUrl;
      downloadLink.download = `lshorter_qr_${link.slug}_1024px.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (e) {
      console.error("PNG export error:", e);
    }
  };

  const handleDownloadSVG = async () => {
    try {
      const svgString = await QRCode.toString(link.shortUrl, {
        type: "svg",
        width: FIXED_EXPORT_RESOLUTION,
        margin: includeQuietZone ? 2 : 0,
        color: {
          dark: selectedColor,
          light: bgColor,
        },
        errorCorrectionLevel: "H",
      });
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = `lshorter_qr_${link.slug}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("SVG export error:", e);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code — ${link.slug}`,
          text: `Access ${link.shortUrl}`,
          url: link.shortUrl,
        });
        return;
      } catch {
        // fallback to clipboard copy
      }
    }
    try {
      await navigator.clipboard.writeText(link.shortUrl);
      setSharedCopied(true);
      setTimeout(() => setSharedCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/75 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Link QR Code"
        className="relative w-full max-w-[400px] rounded-[12px] bg-white dark:bg-[#0F0F11] text-[#09090B] dark:text-[#FAFAFA] border border-black/[0.08] dark:border-white/[0.08] p-5 shadow-2xl"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-[7px] text-[#71717A] hover:text-[#09090B] dark:text-[#A1A1AA] dark:hover:text-[#FAFAFA] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-9 h-9 rounded-[9px] bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center text-[#09090B] dark:text-[#FAFAFA] shrink-0">
            <QrCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold tracking-tight text-[#09090B] dark:text-[#FAFAFA]">
              Link QR Code
            </h3>
            <p className="text-xs text-[#71717A] dark:text-[#A1A1AA] font-mono truncate">
              {link.shortUrl}
            </p>
          </div>
        </div>

        {/* QR Code Canvas Preview */}
        <div className="p-4 rounded-[10px] bg-white border border-black/[0.08] dark:border-white/[0.08] flex items-center justify-center shadow-xs mb-4 aspect-square max-w-[216px] mx-auto">
          <canvas
            ref={canvasRef}
            className="w-full h-full object-contain rounded-[4px]"
          />
        </div>

        {/* Sober Customization Controls (No Resolution Slider; Fixed 1024px High-Res) */}
        <div className="flex flex-col gap-3 p-3.5 rounded-[10px] bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.08] dark:border-white/[0.08] mb-4 text-xs">
          {/* Color Swatches */}
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#52525B] dark:text-[#A1A1AA]">
              Foreground
            </span>
            <div className="flex items-center gap-1.5">
              {SOBER_SWATCHES.map((c) => {
                const isSelected = selectedColor.toLowerCase() === c.hex.toLowerCase();
                return (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => setSelectedColor(c.hex)}
                    title={c.name}
                    aria-label={`Select ${c.name} color`}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                      isSelected
                        ? "ring-2 ring-[#09090B] dark:ring-[#FAFAFA] ring-offset-2 ring-offset-white dark:ring-offset-[#0F0F11] scale-105"
                        : "border-black/15 dark:border-white/15 opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
          </div>

          <div className="h-px bg-black/[0.06] dark:bg-white/[0.06]" />

          {/* Quiet Zone Checkbox + Fixed 1024px Badge */}
          <div className="flex items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-[#52525B] dark:text-[#D4D4D8] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeQuietZone}
                onChange={(e) => setIncludeQuietZone(e.target.checked)}
                className="w-3.5 h-3.5 rounded-[4px] accent-[#09090B] dark:accent-[#FAFAFA] cursor-pointer"
              />
              <span>Quiet zone margin</span>
            </label>
            <span className="text-[11px] font-mono text-[#71717A] dark:text-[#8E8E93]">
              1024 × 1024px
            </span>
          </div>
        </div>

        {/* Clean Action Buttons: PNG, SVG, Share */}
        <div className="grid grid-cols-3 gap-2 mb-2.5">
          <button
            type="button"
            onClick={handleDownloadPNG}
            className="h-9 px-3 rounded-[8px] bg-[#09090B] text-white dark:bg-[#FAFAFA] dark:text-[#09090B] hover:opacity-90 text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-opacity cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadSVG}
            className="h-9 px-3 rounded-[8px] bg-transparent text-[#09090B] dark:text-[#FAFAFA] border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>SVG</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="h-9 px-3 rounded-[8px] bg-transparent text-[#09090B] dark:text-[#FAFAFA] border border-black/[0.08] dark:border-white/[0.08] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] text-xs font-medium inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            {sharedCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>

        {/* Customize in QR Studio Button */}
        <button
          type="button"
          onClick={() => {
            window.location.href = `/dashboard/qr-code?url=${encodeURIComponent(
              link.shortUrl
            )}&slug=${encodeURIComponent(link.slug)}&id=${encodeURIComponent(
              link.id
            )}`;
          }}
          className="w-full h-9 px-3 rounded-[8px] bg-black/[0.03] dark:bg-white/[0.04] hover:bg-black/[0.06] dark:hover:bg-white/[0.08] border border-black/[0.08] dark:border-white/[0.08] text-[#52525B] dark:text-[#D4D4D8] hover:text-[#09090B] dark:hover:text-[#FAFAFA] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Customize in QR Studio</span>
          <ArrowUpRight className="w-3.5 h-3.5 opacity-70" />
        </button>
      </div>
    </div>
  );
}
