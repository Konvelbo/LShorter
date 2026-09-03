"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  X,
  Copy,
  Check,
  Share2,
  ExternalLink,
  QrCode,
  Download,
  Sliders,
  Sparkles,
  Palette
} from "lucide-react";
import { ShortLink } from "@/types";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface LinkShareModalProps {
  link: ShortLink | null;
  isOpen: boolean;
  onClose: () => void;
}

// Official Vector Brand Icons
function WhatsAppIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.79 14.07c-.24.68-1.4 1.25-1.92 1.33-.51.07-1.16.1-3.34-.81-2.77-1.16-4.57-3.99-4.71-4.17-.14-.19-1.13-1.5-1.13-2.87 0-1.36.71-2.03.97-2.31.25-.28.56-.35.75-.35.19 0 .37 0 .54.01.17.01.41-.07.64.49.24.57.81 1.98.88 2.13.07.14.12.31.02.5-.09.19-.14.31-.28.47-.14.16-.3.35-.43.47-.14.14-.29.3-.12.59.16.28.73 1.2 1.57 1.95 1.08.96 1.99 1.26 2.27 1.4.28.14.44.12.61-.07.16-.19.71-.82.9-1.1.19-.28.37-.24.63-.14.25.09 1.62.76 1.9 1 .28.24.47.35.54.47.07.12.07.68-.17 1.36z" />
    </svg>
  );
}

function TwitterXIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
    </svg>
  );
}

function TelegramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8c-.15 1.58-.8 5.42-1.13 7.19-.14.75-.42 1-.68 1.03-.58.05-1.02-.38-1.58-.75-.88-.58-1.38-.94-2.23-1.5-.99-.65-.35-1.01.22-1.59.15-.15 2.71-2.48 2.76-2.69a.2.2 0 0 0-.05-.18c-.06-.05-.14-.03-.21-.02-.09.02-1.49.95-4.22 2.79-.4.27-.76.41-1.08.4-.36-.01-1.04-.2-1.55-.37-.63-.2-1.12-.31-1.08-.66.02-.18.27-.36.74-.55 2.92-1.27 4.86-2.11 5.83-2.51 2.78-1.16 3.35-1.36 3.73-1.36.08 0 .27.02.39.12.1.08.13.19.14.27-.01.06.01.24 0 .36z" />
    </svg>
  );
}

function InstagramIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

export function LinkShareModal({ link, isOpen, onClose }: LinkShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [selectedColor, setSelectedColor] = useState("#ff6600");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [qrSize, setQrSize] = useState(200);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !link || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      link.shortUrl,
      {
        width: qrSize,
        margin: 2,
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
  }, [isOpen, link, selectedColor, bgColor, qrSize]);

  if (!isOpen || !link) return null;

  const url = link.shortUrl;
  const title = encodeURIComponent(link.metaTitle || `Découvrez ce lien : ${link.slug}`);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
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
    confetti({ particleCount: 30, spread: 50 });
  };

  const handleDownloadSVG = async () => {
    try {
      const svgString = await QRCode.toString(link.shortUrl, {
        type: "svg",
        margin: 2,
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
      confetti({ particleCount: 30, spread: 50 });
    } catch (e) {
      console.error(e);
    }
  };

  const shareNetworks = [
    {
      name: "WhatsApp",
      color: "bg-[#25D366]/15 text-[#25D366] hover:bg-[#25D366]/25 border-[#25D366]/30",
      icon: WhatsAppIcon,
      url: `https://api.whatsapp.com/send?text=${title}%20${encodeURIComponent(url)}`,
    },
    {
      name: "Twitter / X",
      color: "bg-white/10 text-white hover:bg-white/20 border-white/20",
      icon: TwitterXIcon,
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${title}`,
    },
    {
      name: "Facebook",
      color: "bg-[#1877F2]/15 text-[#1877F2] hover:bg-[#1877F2]/25 border-[#1877F2]/30",
      icon: FacebookIcon,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    },
    {
      name: "LinkedIn",
      color: "bg-[#0A66C2]/15 text-[#0A66C2] hover:bg-[#0A66C2]/25 border-[#0A66C2]/30",
      icon: LinkedInIcon,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
    },
    {
      name: "Telegram",
      color: "bg-[#229ED9]/15 text-[#229ED9] hover:bg-[#229ED9]/25 border-[#229ED9]/30",
      icon: TelegramIcon,
      url: `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${title}`,
    },
    {
      name: "Instagram",
      color: "bg-[#E4405F]/15 text-[#E4405F] hover:bg-[#E4405F]/25 border-[#E4405F]/30",
      icon: InstagramIcon,
      url: `https://www.instagram.com/`,
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-[16px] bg-[#141416] border border-[#27272a] p-6 sm:p-7 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-[10px] bg-[#ff6600]/15 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600]">
            <Share2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Partager le lien & QR Code</h3>
            <p className="text-xs text-neutral-400 font-mono">{link.slug}</p>
          </div>
        </div>

        {/* Short URL Copy Box */}
        <div className="flex items-center justify-between gap-2 p-3 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] mb-6">
          <span className="text-xs font-mono text-[#ff6600] truncate">{link.shortUrl}</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#ff6600] hover:bg-[#ff771a] text-white text-xs font-bold shrink-0 transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#ff6600]/25 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier</span>
              </>
            )}
          </button>
        </div>

        {/* 2-Columns Grid: Left = Customizable QR Code, Right = Official Vector Social Sharing */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Left Column: QR Code Box (6 cols) */}
          <div className="md:col-span-6 rounded-[12px] bg-[#1a1a1e] border border-[#27272a] p-4 flex flex-col items-center justify-between gap-4">
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-[#ff6600]" />
                <span>QR Code Personnalisable</span>
              </span>
              <span className="text-[10px] text-neutral-400">Haute Résolution</span>
            </div>

            {/* QR Canvas */}
            <div className="p-3 bg-white rounded-[10px] flex items-center justify-center shadow-lg aspect-square">
              <canvas ref={canvasRef} />
            </div>

            {/* Color Presets */}
            <div className="flex items-center justify-between w-full text-xs">
              <span className="text-neutral-400 text-[11px] font-medium flex items-center gap-1">
                <Palette className="w-3 h-3 text-[#ff6600]" />
                <span>Couleur :</span>
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { name: "Orange", hex: "#ff6600" },
                  { name: "Forest", hex: "#0b6e4f" },
                  { name: "Classic", hex: "#09090b" },
                  { name: "Midnight", hex: "#1e293b" },
                  { name: "Sky", hex: "#0ea5e9" },
                  { name: "Violet", hex: "#8b5cf6" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setSelectedColor(c.hex)}
                    title={c.name}
                    className={`w-5 h-5 rounded-full border transition-all cursor-pointer ${
                      selectedColor === c.hex
                        ? "border-white scale-125 shadow-md"
                        : "border-transparent opacity-75 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Download Buttons */}
            <div className="grid grid-cols-2 gap-2 w-full pt-1">
              <Button
                onClick={handleDownloadPNG}
                variant="glow"
                size="sm"
                className="text-xs gap-1.5 w-full"
              >
                <Download className="w-3.5 h-3.5" />
                <span>PNG</span>
              </Button>

              <Button
                onClick={handleDownloadSVG}
                variant="outline"
                size="sm"
                className="text-xs gap-1.5 w-full border-[#27272a] hover:border-[#ff6600]"
              >
                <Download className="w-3.5 h-3.5 text-[#ff6600]" />
                <span>SVG</span>
              </Button>
            </div>
          </div>

          {/* Right Column: Social Networks Grid (6 cols) with Real Vector Brand Icons */}
          <div className="md:col-span-6 flex flex-col gap-3">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <Share2 className="w-4 h-4 text-[#ff6600]" />
              <span>Partager sur les Réseaux Sociaux</span>
            </span>

            <div className="grid grid-cols-2 gap-2.5">
              {shareNetworks.map((net) => {
                const IconComponent = net.icon;
                return (
                  <a
                    key={net.name}
                    href={net.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-2.5 p-3 rounded-[10px] border text-xs font-semibold transition-all hover:scale-102 ${net.color}`}
                  >
                    <IconComponent className="w-4 h-4 shrink-0" />
                    <span className="truncate">{net.name}</span>
                  </a>
                );
              })}
            </div>

            {/* Full Editor Link */}
            <button
              onClick={() => {
                window.location.href = `/dashboard/qr-code?url=${encodeURIComponent(link.shortUrl)}`;
              }}
              className="mt-2 w-full py-2.5 rounded-[8px] bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#27272a]"
            >
              <Sliders className="w-3.5 h-3.5 text-[#ff6600]" />
              <span>Éditeur QR complet (Logo, Styles)</span>
              <ExternalLink className="w-3 h-3 text-neutral-500" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
