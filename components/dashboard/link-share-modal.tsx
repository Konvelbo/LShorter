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

function DiscordIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.894.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
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

  const handleDiscordShare = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    confetti({ particleCount: 35, spread: 55, origin: { y: 0.6 } });
    window.open("https://discord.com/channels/@me", "_blank", "noopener,noreferrer");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTelegramShare = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
    window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${title}`, "_blank", "noopener,noreferrer");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLinkedInShare = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, "_blank", "noopener,noreferrer");
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
      onClick: handleLinkedInShare,
    },
    {
      name: "Telegram",
      color: "bg-[#229ED9]/15 text-[#229ED9] hover:bg-[#229ED9]/25 border-[#229ED9]/30",
      icon: TelegramIcon,
      onClick: handleTelegramShare,
    },
    {
      name: "Discord",
      color: "bg-[#5865F2]/15 text-[#5865F2] hover:bg-[#5865F2]/25 border-[#5865F2]/30",
      icon: DiscordIcon,
      onClick: handleDiscordShare,
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-2xl rounded-[10px] bg-[#141416] border border-[#27272a] p-6 sm:p-7 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1.5 rounded-[10px] hover:bg-white/10 transition-colors cursor-pointer"
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
            className="flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#ff6600] hover:bg-[#ff771a] text-white text-xs font-bold shrink-0 transition-all hover:scale-105 active:scale-95 shadow-md shadow-[#ff6600]/25 cursor-pointer"
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
          <div className="md:col-span-6 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] p-4 flex flex-col items-center justify-between gap-4">
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
                if (net.onClick) {
                  return (
                    <button
                      key={net.name}
                      onClick={net.onClick}
                      className={`flex items-center gap-2.5 p-3 rounded-[10px] border text-xs font-semibold transition-all hover:scale-102 text-left cursor-pointer ${net.color}`}
                    >
                      <IconComponent className="w-4 h-4 shrink-0" />
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
              className="mt-2 w-full py-2.5 rounded-[10px] bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer border border-[#27272a]"
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
