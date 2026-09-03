"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  X,
  QrCode,
  Download,
  Share2,
  Sliders,
  Copy,
  Check,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { ShortLink } from "@/types";
import { Button } from "@/components/ui/button";
import confetti from "canvas-confetti";

interface LinkQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: ShortLink | null;
}

export function LinkQRModal({ isOpen, onClose, link }: LinkQRModalProps) {
  const [selectedColor, setSelectedColor] = useState("#ff6600");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [size, setSize] = useState(256);
  const [includeQuietZone, setIncludeQuietZone] = useState(true);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!isOpen || !link || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      link.shortUrl,
      {
        width: size,
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
  }, [isOpen, link, selectedColor, bgColor, size, includeQuietZone]);

  if (!isOpen || !link) return null;

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
        margin: includeQuietZone ? 2 : 0,
        color: {
          dark: selectedColor,
          light: bgColor,
        },
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
      confetti({ particleCount: 30, spread: 50 });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(link.shortUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `QR Code — ${link.slug}`,
          text: `Scannez ce QR Code pour accéder à ${link.shortUrl}`,
          url: link.shortUrl,
        });
      } catch {
        // ignore
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md rounded-[14px] bg-[#141416] border border-[#27272a] p-6 shadow-2xl text-white">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-neutral-400 hover:text-white p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-[10px] bg-[#ff6600] flex items-center justify-center text-white shadow-lg shadow-[#ff6600]/30 font-bold">
            <QrCode className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">QR Code du Lien</h3>
            <p className="text-xs text-neutral-400 font-mono truncate max-w-[260px]">
              {link.shortUrl}
            </p>
          </div>
        </div>

        {/* QR Code Canvas Preview */}
        <div className="p-4 rounded-[12px] bg-white flex items-center justify-center shadow-lg mb-5 aspect-square max-w-[220px] mx-auto">
          <canvas ref={canvasRef} className="w-full h-full object-contain" />
        </div>

        {/* Customization Controls */}
        <div className="flex flex-col gap-3.5 p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] mb-5 text-xs">
          {/* Color Presets */}
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-300">Couleur du QR Code</span>
            <div className="flex items-center gap-1.5">
              {[
                { name: "Orange", hex: "#ff6600" },
                { name: "Forest", hex: "#0b6e4f" },
                { name: "Classic", hex: "#09090b" },
                { name: "Midnight", hex: "#1e293b" },
                { name: "Sky", hex: "#0ea5e9" },
              ].map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c.hex)}
                  title={c.name}
                  className={`w-6 h-6 rounded-full border transition-all cursor-pointer ${
                    selectedColor === c.hex
                      ? "border-white scale-110 shadow-md"
                      : "border-transparent opacity-80 hover:opacity-100"
                  }`}
                  style={{ backgroundColor: c.hex }}
                />
              ))}
            </div>
          </div>

          {/* Size Slider */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-neutral-400">
              <span>Résolution</span>
              <span className="font-mono text-white">{size}px</span>
            </div>
            <input
              type="range"
              min="128"
              max="512"
              step="32"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-[#ff6600] cursor-pointer"
            />
          </div>

          {/* Quiet Zone Checkbox */}
          <label className="flex items-center gap-2 text-neutral-300 cursor-pointer">
            <input
              type="checkbox"
              checked={includeQuietZone}
              onChange={(e) => setIncludeQuietZone(e.target.checked)}
              className="w-4 h-4 accent-[#ff6600] cursor-pointer"
            />
            <span>Bordure de marge blanche (Quiet zone)</span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button
            onClick={handleDownloadPNG}
            variant="glow"
            size="sm"
            className="text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>PNG</span>
          </Button>

          <Button
            onClick={handleDownloadSVG}
            variant="outline"
            size="sm"
            className="text-xs gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-[#ff6600]" />
            <span>SVG</span>
          </Button>

          <Button
            onClick={handleShare}
            variant="secondary"
            size="sm"
            className="text-xs gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Partager</span>
          </Button>
        </div>

        {/* Advanced Editor Link */}
        <button
          onClick={() => {
            window.location.href = `/dashboard/qr-code?url=${encodeURIComponent(link.shortUrl)}`;
          }}
          className="w-full py-2 rounded-[8px] bg-white/5 hover:bg-white/10 text-neutral-400 hover:text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-[#ff6600]" />
          <span>Personnaliser dans l&apos;éditeur complet (Logo, Styles)</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
}
