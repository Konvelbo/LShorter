"use client";

import React, { useState, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  X,
  Sparkles,
  LayoutGrid,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  Crop as CropIcon,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/toast-provider";
import { cropAndCompressImage, CroppedAreaPixels } from "@/lib/image-compress";

export interface BannerCropModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageSrc: string;
  initialFormat?: "summary_large_image" | "summary";
  onCropCompleteResult: (result: {
    file: File;
    dataUrl: string;
    format: "summary_large_image" | "summary";
  }) => Promise<void> | void;
}

export function BannerCropModal({
  isOpen,
  onClose,
  imageSrc,
  initialFormat = "summary_large_image",
  onCropCompleteResult,
}: BannerCropModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<"summary_large_image" | "summary">(initialFormat);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sync format with initialFormat when opened
  React.useEffect(() => {
    if (isOpen) {
      setSelectedFormat(initialFormat);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  }, [isOpen, initialFormat]);

  const onCropChange = useCallback((newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteHandler = useCallback((_croppedArea: Area, croppedAreaPixelsCoord: Area) => {
    setCroppedAreaPixels(croppedAreaPixelsCoord);
  }, []);

  const handleApplyCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    try {
      setIsProcessing(true);
      const targetW = selectedFormat === "summary" ? 600 : 1200;
      const targetH = selectedFormat === "summary" ? 600 : 630;

      const { file, dataUrl } = await cropAndCompressImage(
        imageSrc,
        croppedAreaPixels,
        targetW,
        targetH,
        0.88
      );

      await onCropCompleteResult({
        file,
        dataUrl,
        format: selectedFormat,
      });

      onClose();
    } catch (err) {
      console.error("[BannerCropModal] Crop error:", err);
      showToast.error("Impossible de recadrer l'image. Veuillez vérifier le fichier sélectionné.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReset = () => {
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  if (!isOpen) return null;

  const aspect = selectedFormat === "summary" ? 1 : 1200 / 630;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-[#111114] border border-zinc-200 dark:border-zinc-800 rounded-[10px] shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[8px] bg-blue-600/10 dark:bg-blue-500/15 border border-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
              <CropIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-zinc-900 dark:text-white">
                Ajuster et recadrer la bannière
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Positionnez, zoomez et choisissez le format idéal pour vos réseaux sociaux
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-[8px] text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Format Selector Bar */}
        <div className="px-5 py-3 bg-zinc-50 dark:bg-[#16181d] border-b border-zinc-200/80 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-zinc-200/70 dark:bg-zinc-900 p-1 rounded-[8px] border border-zinc-300/60 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setSelectedFormat("summary_large_image")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all cursor-pointer",
                selectedFormat === "summary_large_image"
                  ? "bg-white dark:bg-[#0e0f12] text-blue-600 dark:text-blue-400 shadow-xs border border-blue-500/30"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Bannière large (1200×630 · 1.91:1)</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedFormat("summary")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] text-xs font-semibold transition-all cursor-pointer",
                selectedFormat === "summary"
                  ? "bg-white dark:bg-[#0e0f12] text-blue-600 dark:text-blue-400 shadow-xs border border-blue-500/30"
                  : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bannière compacte (600×600 · 1:1)</span>
            </button>
          </div>

          <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
            {selectedFormat === "summary_large_image"
              ? "Recommandé pour Twitter/X, LinkedIn & Facebook"
              : "Format carré optimisé pour les vignettes mobiles"}
          </div>
        </div>

        {/* Cropper Container */}
        <div className="relative w-full h-[320px] sm:h-[380px] bg-black/90 select-none overflow-hidden">
          <Cropper
            image={imageSrc}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteHandler}
            onZoomChange={onZoomChange}
            showGrid={true}
            cropShape="rect"
            style={{
              containerStyle: {
                width: "100%",
                height: "100%",
                backgroundColor: "#09090b",
              },
              cropAreaStyle: {
                border: "2px solid #3b82f6",
                boxShadow: "0 0 0 9999em rgba(0, 0, 0, 0.65)",
              },
            }}
          />
        </div>

        {/* Bottom Zoom & Action Bar */}
        <div className="p-4 sm:p-5 bg-white dark:bg-[#111114] border-t border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Zoom controls */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(2))))}
              className="p-1.5 rounded-[6px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Dézoomer"
            >
              <ZoomOut className="w-4 h-4" />
            </button>

            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-32 sm:w-44 accent-blue-600 cursor-pointer"
            />

            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
              className="p-1.5 rounded-[6px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Zoomer"
            >
              <ZoomIn className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="p-1.5 rounded-[6px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              title="Réinitialiser"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400">
              {Math.round(zoom * 100)}%
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 rounded-[8px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleApplyCrop}
              disabled={isProcessing || !imageSrc || !croppedAreaPixels}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Compression &amp; Sauvegarde...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Valider le recadrage</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
