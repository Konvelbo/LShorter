"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { useRouter } from "next/navigation";
import {
  X,
  Copy,
  Check,
  Share2,
  QrCode,
  Download,
  Edit3,
  ArrowUpRight,
  Palette,
} from "lucide-react";
import { ShortLink } from "@/types";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface LinkShareModalProps {
  link: ShortLink | null;
  isOpen: boolean;
  onClose: () => void;
}

// ─── Authentic Vector Social Network Brand Logos ─────────────────────────────
function TwitterXIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.4 1.25-1.92 1.33-.51.07-1.16.1-3.34-.81-2.77-1.16-4.57-3.99-4.71-4.17-.14-.19-1.13-1.5-1.13-2.87 0-1.36.71-2.03.97-2.31.25-.28.56-.35.75-.35.19 0 .37 0 .54.01.17.01.41-.07.64.49.24.57.81 1.98.88 2.13.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.16-.3.35-.43.47-.14.14-.29.3-.12.59.16.28.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.44.12.61-.07.16-.19.71-.82.9-1.1.19-.28.37-.24.63-.14.25.09 1.62.76 1.9 1 .28.24.47.35.54.47.07.12.07.68-.17 1.36z" />
    </svg>
  );
}

function FacebookIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function TelegramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
    </svg>
  );
}

function RedditIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.703zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.197-2.512-.73a.326.326 0 0 0-.232-.095z" />
    </svg>
  );
}

function DiscordIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
    </svg>
  );
}

function MailIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="16" x="2" y="4" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

export function LinkShareModal({ link, isOpen, onClose }: LinkShareModalProps) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#09090b");
  const [bgColor] = useState("#ffffff");
  const [mobileTab, setMobileTab] = useState<"qr" | "social">("qr");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !link || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      link.shortUrl,
      {
        width: 180,
        margin: 1.5,
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
  }, [isOpen, link, selectedColor, bgColor]);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !link) return null;

  const rawDomain = link.domainName || "lsho.cc";
  const publicShareUrl = `https://${rawDomain}/r/${link.slug}`;
  const shareTitle = link.metaTitle || link.ogTitle || `Check out this link: ${link.slug}`;
  const encodedUrl = encodeURIComponent(publicShareUrl);
  const encodedTitle = encodeURIComponent(shareTitle);

  const handleCopy = () => {
    navigator.clipboard.writeText(publicShareUrl);
    setCopied(true);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPNG = () => {
    if (!canvasRef.current) return;
    const pngUrl = canvasRef.current.toDataURL("image/png");
    const downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `lshorter_qr_${link.slug}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleDownloadSVG = async () => {
    try {
      const svgString = await QRCode.toString(link.shortUrl, {
        type: "svg",
        margin: 1.5,
        color: {
          dark: selectedColor,
          light: bgColor,
        },
      });
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const dlUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = dlUrl;
      downloadLink.download = `lshorter_qr_${link.slug}.svg`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
      URL.revokeObjectURL(dlUrl);
    } catch (e) {
      console.error(e);
    }
  };

  const handleEditQrCode = () => {
    onClose();
    const query = new URLSearchParams({
      url: link.shortUrl,
      slug: link.slug,
      id: link.id,
      target: link.targetUrl,
    });
    router.push(`/dashboard/qr-code?${query.toString()}`);
  };

  const shareNetworks = [
    {
      name: "X (Twitter)",
      icon: TwitterXIcon,
      iconColor: "text-zinc-900 dark:text-white",
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "WhatsApp",
      icon: WhatsAppIcon,
      iconColor: "text-[#25D366]",
      url: `https://api.whatsapp.com/send?text=${encodedTitle}%20${encodedUrl}`,
    },
    {
      name: "LinkedIn",
      icon: LinkedInIcon,
      iconColor: "text-[#0A66C2]",
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      name: "Facebook",
      icon: FacebookIcon,
      iconColor: "text-[#1877F2]",
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
    {
      name: "Telegram",
      icon: TelegramIcon,
      iconColor: "text-[#229ED9]",
      url: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      name: "Reddit",
      icon: RedditIcon,
      iconColor: "text-[#FF4500]",
      url: `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`,
    },
    {
      name: "Discord",
      icon: DiscordIcon,
      iconColor: "text-[#5865F2]",
      onClick: () => {
        handleCopy();
        window.open("https://discord.com/channels/@me", "_blank", "noopener,noreferrer");
      },
    },
    {
      name: "Email",
      icon: MailIcon,
      iconColor: "text-zinc-600 dark:text-neutral-400",
      onClick: () => {
        const emailBody = encodeURIComponent(
          `Hello,\n\nCheck out this link:\n${publicShareUrl}\n\n${shareTitle}`
        );
        window.location.href = `mailto:?subject=${encodedTitle}&body=${emailBody}`;
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        role="dialog"
        aria-modal="true"
        className="relative w-full max-w-2xl rounded-xl bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] shadow-xl text-zinc-900 dark:text-white overflow-hidden max-h-[92vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-200 dark:border-[#222225] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-[#27272a] flex items-center justify-center text-zinc-700 dark:text-zinc-200">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white leading-tight">
                Share &amp; QR Code
              </h3>
              <p className="text-[11.5px] text-zinc-500 dark:text-neutral-400 font-mono">
                /{link.slug}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-md hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Segmented Switcher (Visible only on mobile screens) */}
        <div className="md:hidden px-5 pt-3 shrink-0">
          <div className="flex p-1 rounded-lg bg-zinc-100 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a]">
            <button
              type="button"
              onClick={() => setMobileTab("qr")}
              className={cn(
                "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                mobileTab === "qr"
                  ? "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white shadow-2xs"
                  : "text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>QR Code</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab("social")}
              className={cn(
                "flex-1 py-1.5 text-xs font-semibold rounded-md transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                mobileTab === "social"
                  ? "bg-white dark:bg-[#27272a] text-zinc-900 dark:text-white shadow-2xs"
                  : "text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Social Network</span>
            </button>
          </div>
        </div>

        {/* Main Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1">
          {/* Short URL Copy Bar (Always visible) */}
          <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-50 dark:bg-[#18181c] border border-zinc-200 dark:border-[#27272a] mb-5">
            <span className="text-xs font-mono text-zinc-800 dark:text-zinc-200 truncate pl-1">
              {publicShareUrl}
            </span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 text-xs font-semibold shrink-0 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          {/* Desktop 2-Columns Grid with Middle Separator / Mobile Tabbed */}
          <div className="grid grid-cols-1 md:grid-cols-11 gap-6 items-start">
            {/* ── Left Column: QR Code (5 cols on md) ── */}
            <div
              className={cn(
                "md:col-span-5 flex flex-col items-center gap-3.5",
                mobileTab === "qr" ? "flex" : "hidden md:flex"
              )}
            >
              <div className="flex items-center justify-between w-full">
                <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                  <QrCode className="w-3.5 h-3.5 text-zinc-500" />
                  <span>QR Code</span>
                </span>
                <span className="text-[10.5px] text-zinc-400 dark:text-neutral-500">
                  Ready to scan
                </span>
              </div>

              {/* QR Code Canvas Frame */}
              <div className="p-2.5 bg-white rounded-lg border border-zinc-200 dark:border-white/10 shadow-2xs aspect-square flex items-center justify-center">
                <canvas ref={canvasRef} className="max-w-full h-auto" />
              </div>

              {/* Color Swatches */}
              <div className="flex items-center justify-between w-full px-1">
                <span className="text-[11px] text-zinc-500 dark:text-neutral-400 flex items-center gap-1">
                  <Palette className="w-3 h-3 text-zinc-400" />
                  <span>Color:</span>
                </span>
                <div className="flex items-center gap-1.5">
                  {[
                    { name: "Black", hex: "#09090b" },
                    { name: "Slate", hex: "#1e293b" },
                    { name: "Brand Blue", hex: "#0066FF" },
                    { name: "Emerald", hex: "#059669" },
                    { name: "Crimson", hex: "#dc2626" },
                  ].map((c) => (
                    <button
                      key={c.hex}
                      type="button"
                      onClick={() => setSelectedColor(c.hex)}
                      title={c.name}
                      className={cn(
                        "w-4 h-4 rounded-full border transition-all cursor-pointer",
                        selectedColor === c.hex
                          ? "border-zinc-900 dark:border-white scale-125"
                          : "border-transparent opacity-70 hover:opacity-100"
                      )}
                      style={{ backgroundColor: c.hex }}
                    />
                  ))}
                </div>
              </div>

              {/* Export Buttons */}
              <div className="grid grid-cols-2 gap-2 w-full">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadPNG}
                  className="h-8 text-xs font-medium border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" />
                  <span>PNG</span>
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadSVG}
                  className="h-8 text-xs font-medium border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-700 dark:text-zinc-200 cursor-pointer"
                >
                  <Download className="w-3 h-3 mr-1" />
                  <span>SVG</span>
                </Button>
              </div>

              {/* Edit QR Code Button */}
              <button
                type="button"
                onClick={handleEditQrCode}
                className="w-full h-8 px-3 rounded-lg border border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-white/5 hover:bg-zinc-100 dark:hover:bg-white/10 text-zinc-800 dark:text-zinc-200 text-xs font-medium flex items-center justify-between transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Edit QR code</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-zinc-400" />
              </button>
            </div>

            {/* ── Middle Separator (1 col on md, hidden on mobile) ── */}
            <div className="hidden md:flex md:col-span-1 justify-center self-stretch">
              <div className="w-px bg-zinc-200 dark:bg-[#27272a] h-full" />
            </div>

            {/* ── Right Column: Social Networks (5 cols on md) ── */}
            <div
              className={cn(
                "md:col-span-5 flex flex-col gap-3",
                mobileTab === "social" ? "flex" : "hidden md:flex"
              )}
            >
              <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Share2 className="w-3.5 h-3.5 text-zinc-500" />
                <span>Social Networks</span>
              </span>

              <div className="grid grid-cols-2 gap-2">
                {shareNetworks.map((net) => {
                  const Icon = net.icon;
                  if (net.onClick) {
                    return (
                      <button
                        key={net.name}
                        type="button"
                        onClick={net.onClick}
                        className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.07] text-left text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                      >
                        <Icon className={cn("w-4 h-4 shrink-0", net.iconColor)} />
                        <span className="truncate">{net.name}</span>
                      </button>
                    );
                  }
                  return (
                    <a
                      key={net.name}
                      href={net.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-white/[0.03] hover:bg-zinc-100 dark:hover:bg-white/[0.07] text-left text-xs font-medium text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer"
                    >
                      <Icon className={cn("w-4 h-4 shrink-0", net.iconColor)} />
                      <span className="truncate">{net.name}</span>
                    </a>
                  );
                })}
              </div>

              <p className="text-[11px] text-zinc-500 dark:text-neutral-500 mt-1 leading-relaxed">
                Click any channel to share instantly with an automatic OpenGraph &amp; Twitter Card preview.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
