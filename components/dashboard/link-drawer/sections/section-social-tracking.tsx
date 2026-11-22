"use client";

import React, { useState, useRef, useCallback } from "react";
import Cropper, { Area } from "react-easy-crop";
import {
  Sparkles,
  LayoutGrid,
  Upload,
  Image as ImageIcon,
  Trash2,
  Share2,
  Tag,
  Target,
  Check,
  Plus,
  Pencil,
  X,
  Info,
  Globe2,
  Crop as CropIcon,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { cfNormalizeImageUrl } from "@/lib/cloudflare-api";
import { PixelBrandLogo, getPixelPlatformLabel, normalizePixelPlatform } from "@/components/dashboard/pixel-badges";
import { PixelSelectorModal } from "@/components/dashboard/pixel-selector-modal";
import { Input } from "@/components/ui/input";
import { showToast } from "@/components/ui/toast-provider";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { cropAndCompressImage, compressImageFile, CroppedAreaPixels } from "@/lib/image-compress";

interface SectionSocialTrackingProps {
  slug?: string;
  // Social Preview props
  ogTitle: string;
  setOgTitle: (title: string) => void;
  ogDescription: string;
  setOgDescription: (desc: string) => void;
  ogImage: string;
  setOgImage: (img: string) => void;
  previewImage: string;
  setPreviewImage: (img: string) => void;
  domainName: string;
  socialPlatformPreview: "x" | "facebook" | "whatsapp" | "linkedin";
  setSocialPlatformPreview: (p: "x" | "facebook" | "whatsapp" | "linkedin") => void;
  twitterCard: "summary_large_image" | "summary";
  setTwitterCard: (card: "summary_large_image" | "summary") => void;
  onClearBanner?: () => void;
  bannerInputRef?: React.RefObject<HTMLInputElement | null>;
  handleBannerUpload?: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void> | void;
  onCropCompleteResult?: (result: {
    file: File;
    originalFile?: File | null;
    dataUrl: string;
    format: "summary_large_image" | "summary";
  }) => Promise<void> | void;
  pendingCropRef?: React.MutableRefObject<
    (() => Promise<{
      file: File | null;
      originalFile?: File | null;
      dataUrl: string;
      format: "summary_large_image" | "summary";
    } | null>) | null
  >;
  isUploadingImage?: boolean;
  // UTM Tracking props
  utmSource: string;
  setUtmSource: (v: string) => void;
  utmMedium: string;
  setUtmMedium: (v: string) => void;
  utmCampaign: string;
  setUtmCampaign: (v: string) => void;
  utmTerm: string;
  setUtmTerm: (v: string) => void;
  utmContent: string;
  setUtmContent: (v: string) => void;
  targetUrl: string;
  computeFinalUrlWithUtm: () => string;
  // Retargeting Pixels props
  selectedPixels?: any[];
  setSelectedPixels?: React.Dispatch<React.SetStateAction<any[]>> | ((pixels: any[]) => void);
  availablePixels?: any[];
  isProPlan?: boolean;
}

export function SectionSocialTracking({
  ogTitle,
  setOgTitle,
  ogDescription,
  setOgDescription,
  ogImage,
  setOgImage,
  previewImage,
  setPreviewImage,
  domainName,
  socialPlatformPreview,
  setSocialPlatformPreview,
  twitterCard,
  setTwitterCard,
  onClearBanner,
  bannerInputRef,
  onCropCompleteResult,
  pendingCropRef,
  isUploadingImage = false,
  utmSource,
  setUtmSource,
  utmMedium,
  setUtmMedium,
  utmCampaign,
  setUtmCampaign,
  utmTerm,
  setUtmTerm,
  utmContent,
  setUtmContent,
  targetUrl,
  computeFinalUrlWithUtm,
  selectedPixels = [],
  setSelectedPixels,
  availablePixels = [],
  isProPlan = false,
  slug = "",
}: SectionSocialTrackingProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const activeImage = previewImage || cfNormalizeImageUrl(ogImage);
  const hasCustomImage = Boolean(activeImage && (!hasImageError || previewImage));
  const [isDragging, setIsDragging] = useState(false);
  const [isPixelModalOpen, setIsPixelModalOpen] = useState(false);

  // ── INLINE CROP STUDIO STATE ──
  const [isCropMode, setIsCropMode] = useState(false);
  const [cropSourceImage, setCropSourceImage] = useState<string>("");
  const [cropFormat, setCropFormat] = useState<"summary_large_image" | "summary">(twitterCard);
  const [crop, setCrop] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState<number>(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CroppedAreaPixels | null>(null);
  const [isProcessingCrop, setIsProcessingCrop] = useState(false);
  const selectedOriginalFileRef = useRef<File | null>(null);

  const localFileInputRef = useRef<HTMLInputElement>(null);
  const activeFileInputRef = bannerInputRef || localFileInputRef;

  const onCropChange = useCallback((newCrop: { x: number; y: number }) => {
    setCrop(newCrop);
  }, []);

  const onZoomChange = useCallback((newZoom: number) => {
    setZoom(newZoom);
  }, []);

  const onCropCompleteHandler = useCallback((_croppedArea: Area, pixelsCoord: Area) => {
    setCroppedAreaPixels(pixelsCoord);
  }, []);

  // Expose auto-commit hook so clicking "Create Link" / "Save" while in crop mode never drops the banner
  React.useEffect(() => {
    if (!pendingCropRef) return;
    if (isCropMode && cropSourceImage) {
      pendingCropRef.current = async () => {
        // Clear ref synchronously so concurrent triggers cannot double-run
        if (pendingCropRef) pendingCropRef.current = null;
        const targetW = cropFormat === "summary" ? 600 : 1200;
        const targetH = cropFormat === "summary" ? 600 : 630;
        if (croppedAreaPixels) {
          const { file, dataUrl } = await cropAndCompressImage(
            cropSourceImage,
            croppedAreaPixels,
            targetW,
            targetH,
            0.88
          );
          setIsCropMode(false);
          setCropSourceImage("");
          setCroppedAreaPixels(null);
          return {
            file,
            originalFile: selectedOriginalFileRef.current,
            dataUrl,
            format: cropFormat,
          };
        }
        const compressed = await compressImageFile(cropSourceImage, targetW, targetH, 0.88);
        const dataUrl = typeof compressed === "string" ? compressed : cropSourceImage;
        setIsCropMode(false);
        setCropSourceImage("");
        setCroppedAreaPixels(null);
        return {
          file: null,
          originalFile: selectedOriginalFileRef.current,
          dataUrl,
          format: cropFormat,
        };
      };
    } else {
      pendingCropRef.current = null;
    }
    return () => {
      if (pendingCropRef) pendingCropRef.current = null;
    };
  }, [pendingCropRef, isCropMode, cropSourceImage, croppedAreaPixels, cropFormat]);

  // Handle local file selection from file input or drag-and-drop
  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      showToast.error("Veuillez sélectionner un fichier image valide (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("La taille du fichier image doit être inférieure à 10 Mo.");
      return;
    }

    selectedOriginalFileRef.current = file;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setCroppedAreaPixels(null);
      setCropSourceImage(dataUrl);
      setCropFormat(twitterCard);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setIsCropMode(true);
    };
    reader.readAsDataURL(file);

    if (activeFileInputRef.current) activeFileInputRef.current.value = "";
  };

  const handleStartCropExisting = () => {
    const currentSrc = previewImage || cfNormalizeImageUrl(ogImage);
    if (
      currentSrc &&
      !currentSrc.includes("/api/og") &&
      !currentSrc.includes("/banners/og")
    ) {
      setCroppedAreaPixels(null);
      setCropSourceImage(currentSrc);
      setCropFormat(twitterCard);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setIsCropMode(true);
    } else {
      activeFileInputRef.current?.click();
    }
  };

  const handleCancelCrop = () => {
    setIsCropMode(false);
    setCropSourceImage("");
    setCroppedAreaPixels(null);
    setIsProcessingCrop(false);
  };

  const handleApplyCrop = async () => {
    if (!cropSourceImage || isProcessingCrop) return;
    if (pendingCropRef) pendingCropRef.current = null;

    try {
      setIsProcessingCrop(true);
      const targetW = cropFormat === "summary" ? 600 : 1200;
      const targetH = cropFormat === "summary" ? 600 : 630;

      let file: File;
      let dataUrl: string;
      if (croppedAreaPixels) {
        const res = await cropAndCompressImage(
          cropSourceImage,
          croppedAreaPixels,
          targetW,
          targetH,
          0.88
        );
        file = res.file;
        dataUrl = res.dataUrl;
      } else {
        const compressed = await compressImageFile(cropSourceImage, targetW, targetH, 0.88);
        dataUrl = typeof compressed === "string" ? compressed : cropSourceImage;
        file = selectedOriginalFileRef.current || new File([], `social-banner-${targetW}x${targetH}.jpg`, { type: "image/jpeg" });
      }

      if (onCropCompleteResult) {
        await onCropCompleteResult({
          file,
          originalFile: selectedOriginalFileRef.current || file,
          dataUrl,
          format: cropFormat,
        });
      } else {
        setTwitterCard(cropFormat);
        setPreviewImage(dataUrl);
        setOgImage(dataUrl);
        showToast.success("Bannière mise à jour avec succès !");
      }

      setIsCropMode(false);
      setCropSourceImage("");
    } catch (err) {
      console.error("[InlineCrop] Error cropping image:", err);
      showToast.error("Impossible de recadrer l'image. Veuillez réessayer.");
    } finally {
      setIsProcessingCrop(false);
    }
  };

  const handleClearBannerAction = () => {
    if (onClearBanner) {
      onClearBanner();
    } else {
      setOgImage("");
      setPreviewImage("");
    }
    setIsCropMode(false);
    setCropSourceImage("");
    showToast.success("Bannière personnalisée supprimée.");
  };

  const getPixelInfo = (p: any) => {
    if (typeof p === "object" && p !== null) {
      return {
        id: p.id || p.pixelId,
        name: p.name || p.id,
        platform: p.platform || normalizePixelPlatform(p.id),
        pixelId: p.pixelId || p.id,
      };
    }
    const found = (availablePixels || []).find(
      (ap: any) => ap.id === p || ap.pixelId === p || ap.platform === p
    );
    if (found) {
      return {
        id: found.id || found.pixelId,
        name: found.name,
        platform: found.platform,
        pixelId: found.pixelId || found.id,
      };
    }
    const normPlatform = normalizePixelPlatform(p);
    const platformName = getPixelPlatformLabel(normPlatform);
    return {
      id: p,
      name: platformName,
      platform: normPlatform,
      pixelId: p,
    };
  };

  const handleRemovePixel = (pixelKey: string) => {
    if (!setSelectedPixels) return;
    setSelectedPixels(
      selectedPixels.filter((item: any) => {
        const id = typeof item === "string" ? item : item.id || item.pixelId;
        return id !== pixelKey;
      })
    );
  };

  React.useEffect(() => {
    setHasImageError(false);
  }, [previewImage, ogImage]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleProcessFile(file);
    }
  };

  const cropAspect = cropFormat === "summary" ? 1 : 1200 / 630;

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={activeFileInputRef}
        accept="image/png, image/jpeg, image/webp"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleProcessFile(file);
        }}
        className="hidden"
      />

      <div>
        <h2 className="text-xl font-bold tracking-tight text-zinc-950 dark:text-white">
          Réseaux sociaux, tracking &amp; pixels
        </h2>
        <p className="text-sm font-medium text-zinc-700 dark:text-zinc-200 mt-1">
          Configurez les paramètres UTM, associez vos pixels et personnalisez vos cartes de partage social.
        </p>
      </div>

      {/* ── GROUP 1: TRAFFIC (UTM BUILDER) ON TOP ── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-200 dark:border-zinc-800">
          <Tag className="w-4 h-4 text-[#0066FF] dark:text-[#60a5fa]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
            Campagne &amp; Paramètres UTM
          </h3>
        </div>

        <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 -mt-1">
          Balisez l&apos;URL de destination pour suivre les clics et conversions dans Google Analytics, Mixpanel ou vos plateformes publicitaires.
        </p>

        {/* 2-Column UTM Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-950 dark:text-white">
              UTM Source
            </label>
            <Input
              type="text"
              placeholder="google, newsletter, twitter"
              value={utmSource}
              onChange={(e) => setUtmSource(e.target.value)}
              className="h-9 text-xs text-zinc-950 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-950 dark:text-white">
              UTM Medium
            </label>
            <Input
              type="text"
              placeholder="cpc, banner, email"
              value={utmMedium}
              onChange={(e) => setUtmMedium(e.target.value)}
              className="h-9 text-xs text-zinc-950 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-950 dark:text-white">
              UTM Campaign
            </label>
            <Input
              type="text"
              placeholder="spring_sale, launch_2026"
              value={utmCampaign}
              onChange={(e) => setUtmCampaign(e.target.value)}
              className="h-9 text-xs text-zinc-950 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-zinc-950 dark:text-white">
              UTM Term
            </label>
            <Input
              type="text"
              placeholder="url shortener, link tracker"
              value={utmTerm}
              onChange={(e) => setUtmTerm(e.target.value)}
              className="h-9 text-xs text-zinc-950 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-1.5 sm:col-span-2">
            <label className="text-xs font-semibold text-zinc-950 dark:text-white">
              UTM Content
            </label>
            <Input
              type="text"
              placeholder="logolink, sidebar_button"
              value={utmContent}
              onChange={(e) => setUtmContent(e.target.value)}
              className="h-9 text-xs text-zinc-950 dark:text-white"
            />
          </div>
        </div>

        {/* Final URL preview */}
        {computeFinalUrlWithUtm && targetUrl && (
          <div className="p-3 rounded-[8px] bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-zinc-700 dark:text-zinc-300 block mb-1">
              URL Finale de Destination
            </span>
            <span className="text-xs font-mono font-medium text-zinc-950 dark:text-white break-all select-all">
              {computeFinalUrlWithUtm()}
            </span>
          </div>
        )}
      </div>

      {/* ── GROUP 1B: RETARGETING PIXELS ── */}
      <div className="flex flex-col gap-2.5 pt-1">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold text-zinc-950 dark:text-white flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#60a5fa]" />
            <span>Pixels de Retargeting</span>
            {!isProPlan && (
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                PRO
              </span>
            )}
          </label>
          {selectedPixels.length > 0 && (
            <span className="text-[11px] font-semibold text-[#0066FF] dark:text-[#60a5fa]">
              {selectedPixels.length} associé{selectedPixels.length > 1 ? "s" : ""}
            </span>
          )}
        </div>

        {selectedPixels.length === 0 ? (
          <button
            type="button"
            onClick={() => {
              if (!isProPlan) {
                triggerPlanUpgrade({
                  featureName: "Retargeting Pixels",
                  reason: "Retargeting Pixels (Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat & X Ads) are reserved for paid plans (Pro, Business, Enterprise).",
                  targetPlan: "PRO",
                });
                return;
              }
              setIsPixelModalOpen(true);
            }}
            className="w-full py-2.5 px-3 rounded-[8px] border border-dashed border-zinc-300 dark:border-zinc-700 hover:border-[#0066FF] dark:hover:border-[#0066FF] bg-zinc-50/50 dark:bg-white/[0.02] hover:bg-[#0066FF]/5 text-xs text-zinc-800 dark:text-zinc-200 hover:text-[#0066FF] dark:hover:text-[#5294FF] flex items-center justify-center gap-2 transition-all cursor-pointer font-semibold select-none"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Sélectionner ou associer un pixel de retargeting</span>
          </button>
        ) : (
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap gap-2">
              {selectedPixels.map((p: any, idx: number) => {
                const info = getPixelInfo(p);
                return (
                  <div
                    key={info.id || idx}
                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-[8px] bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-xs text-zinc-950 dark:text-white shadow-2xs"
                  >
                    <PixelBrandLogo platform={info.platform} className="w-3.5 h-3.5 shrink-0" />
                    <span className="font-semibold text-xs">{info.name}</span>
                    <span className="font-mono text-[10.5px] text-zinc-700 dark:text-zinc-300">
                      {info.pixelId}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePixel(info.id)}
                      className="p-0.5 rounded text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer ml-0.5"
                      title="Désassocier ce pixel"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => {
                if (!isProPlan) {
                  triggerPlanUpgrade({
                    featureName: "Retargeting Pixels",
                    reason: "Retargeting Pixels (Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat & X Ads) are reserved for paid plans (Pro, Business, Enterprise).",
                    targetPlan: "PRO",
                  });
                  return;
                }
                setIsPixelModalOpen(true);
              }}
              className="self-start text-xs font-semibold text-[#0066FF] dark:text-[#5294FF] hover:underline inline-flex items-center gap-1.5 pt-0.5 cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
              <span>Modifier la sélection des pixels</span>
            </button>
          </div>
        )}

        <PixelSelectorModal
          isOpen={isPixelModalOpen}
          onClose={() => setIsPixelModalOpen(false)}
          selectedPixelIds={selectedPixels}
          onSave={(newPixels) => {
            if (setSelectedPixels) setSelectedPixels(newPixels);
          }}
          availablePixels={availablePixels}
        />
      </div>

      {/* ── GROUP 2: SHARING & SOCIAL PREVIEW ── */}
      <div className="flex flex-col gap-4 pt-2">
        <div className="flex items-center gap-2 pb-1.5 border-b border-zinc-200 dark:border-zinc-800">
          <Share2 className="w-4 h-4 text-[#0066FF] dark:text-[#60a5fa]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-950 dark:text-white">
            Partage &amp; Aperçu Réseaux Sociaux
          </h3>
        </div>

        {/* 1. Title & Description Inputs */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-950 dark:text-white">
                Titre de la carte sociale (Open Graph)
              </label>
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                {ogTitle.length}/70
              </span>
            </div>
            <Input
              type="text"
              maxLength={70}
              placeholder="Titre accrocheur pour Twitter, Facebook, LinkedIn..."
              value={ogTitle}
              onChange={(e) => setOgTitle(e.target.value)}
              className="h-9 text-xs text-zinc-950 dark:text-white"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-950 dark:text-white">
                Description de la carte sociale (Open Graph)
              </label>
              <span className="text-[11px] font-semibold text-zinc-700 dark:text-zinc-300 font-mono">
                {ogDescription.length}/160
              </span>
            </div>
            <textarea
              rows={2}
              maxLength={160}
              placeholder="Brève description affichée lors du partage sur les plateformes sociales..."
              value={ogDescription}
              onChange={(e) => setOgDescription(e.target.value)}
              className="w-full bg-white dark:bg-[#16181d] text-zinc-950 dark:text-white border border-zinc-300 dark:border-[#27272a] focus:border-[#0066FF] dark:focus:border-[#3b82f6] focus:ring-1 focus:ring-[#0066FF] dark:focus:ring-[#3b82f6] rounded-[8px] px-3 py-2 text-xs outline-none transition-colors placeholder:text-zinc-500 dark:placeholder:text-zinc-400 font-normal resize-vertical min-h-[58px]"
            />
          </div>
        </div>

        {/* 2. Banner Format Selector */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-zinc-950 dark:text-white">
            Format de la bannière sociale
          </label>
          <div className="flex gap-1.5 p-1 rounded-[8px] bg-zinc-100 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a]">
            <button
              type="button"
              onClick={() => {
                if (isCropMode) {
                  setCroppedAreaPixels(null);
                  setCropFormat("summary_large_image");
                } else {
                  setTwitterCard("summary_large_image");
                }
              }}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-[6px] text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5",
                (isCropMode ? cropFormat : twitterCard) === "summary_large_image"
                  ? "bg-white dark:bg-[#0e0f12] text-zinc-950 dark:text-white shadow-xs border border-zinc-200 dark:border-zinc-700 font-semibold"
                  : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium",
              )}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
              <span>Bannière large (1200×630)</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (isCropMode) {
                  setCroppedAreaPixels(null);
                  setCropFormat("summary");
                } else {
                  setTwitterCard("summary");
                }
              }}
              className={cn(
                "flex-1 py-1.5 px-3 rounded-[6px] text-xs transition-all text-center cursor-pointer flex items-center justify-center gap-1.5",
                (isCropMode ? cropFormat : twitterCard) === "summary"
                  ? "bg-white dark:bg-[#0e0f12] text-zinc-950 dark:text-white shadow-xs border border-zinc-200 dark:border-zinc-700 font-semibold"
                  : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium",
              )}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Bannière compacte (1:1)</span>
            </button>
          </div>
          <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 leading-relaxed flex items-start gap-1.5 mt-0.5">
            <Info className="w-3.5 h-3.5 shrink-0 text-[#0066FF] dark:text-[#60a5fa] mt-0.5" />
            <span>
              Les réseaux sociaux mettent en cache le format de la bannière dès le premier partage du lien.
            </span>
          </p>
        </div>

        {/* 3. Inline Banner Crop Studio OR Sober Banner Control Bar */}
        {isCropMode ? (
          /* ── INLINE BANNER CROP STUDIO (Sobre, épuré, directement dans le drawer) ── */
          <div className="rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#121316] p-3.5 sm:p-4 flex flex-col gap-3 shadow-xs">
            {/* Studio Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-[6px] bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF] flex items-center justify-center shrink-0">
                  <CropIcon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-950 dark:text-white">
                    Ajuster et recadrer la bannière
                  </h4>
                  <p className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                    Positionnez et zoomez pour un rendu optimal sur vos partages
                  </p>
                </div>
              </div>

              {/* Aspect Ratio Switcher Pills */}
              <div className="inline-flex items-center p-0.5 rounded-[6px] bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/60 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => {
                    setCroppedAreaPixels(null);
                    setCropFormat("summary_large_image");
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-[5px] text-[11px] font-medium transition-colors cursor-pointer",
                    cropFormat === "summary_large_image"
                      ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-semibold"
                      : "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                  )}
                >
                  Large 1200×630
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCroppedAreaPixels(null);
                    setCropFormat("summary");
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-[5px] text-[11px] font-medium transition-colors cursor-pointer",
                    cropFormat === "summary"
                      ? "bg-white dark:bg-zinc-900 text-zinc-950 dark:text-white shadow-2xs font-semibold"
                      : "text-zinc-700 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white"
                  )}
                >
                  Carré 600×600
                </button>
              </div>
            </div>

            {/* Cropper Viewport */}
            <div className="relative w-full h-56 sm:h-64 rounded-[8px] overflow-hidden bg-black select-none border border-zinc-200 dark:border-zinc-800">
              <Cropper
                image={cropSourceImage}
                crop={crop}
                zoom={zoom}
                aspect={cropAspect}
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
                    border: "2px solid #0066FF",
                    boxShadow: "0 0 0 9999em rgba(0, 0, 0, 0.65)",
                  },
                }}
              />
            </div>

            {/* Bottom Toolbar: Zoom slider + Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
              {/* Zoom controls */}
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.max(1, Number((z - 0.1).toFixed(2))))}
                  className="p-1.5 rounded-[6px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Dézoomer"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>

                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.05}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-28 sm:w-36 accent-[#0066FF] cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg"
                />

                <button
                  type="button"
                  onClick={() => setZoom((z) => Math.min(3, Number((z + 0.1).toFixed(2))))}
                  className="p-1.5 rounded-[6px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Zoomer"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                  }}
                  className="p-1.5 rounded-[6px] border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  title="Réinitialiser"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <span className="text-[11px] font-mono font-semibold text-zinc-700 dark:text-zinc-300 min-w-[36px]">
                  {Math.round(zoom * 100)}%
                </span>
              </div>

              {/* Buttons: Annuler & Valider */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={handleCancelCrop}
                  disabled={isProcessingCrop}
                  className="px-3 py-1.5 rounded-[8px] border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={handleApplyCrop}
                  disabled={isProcessingCrop}
                  className="px-3.5 py-1.5 rounded-[8px] bg-[#0066FF] hover:bg-[#0055d4] text-white text-xs font-semibold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProcessingCrop ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Application...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Valider le recadrage</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : hasCustomImage ? (
          /* ── ACTIVE BANNER BAR (Simple & Sobre) ── */
          <div className="flex items-center justify-between p-2.5 rounded-[10px] bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-12 h-9 rounded-[6px] overflow-hidden bg-zinc-200 dark:bg-zinc-800 shrink-0 border border-zinc-200 dark:border-zinc-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImage}
                  alt="Bannière active"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-semibold text-zinc-950 dark:text-white truncate">
                  Bannière personnalisée active
                </span>
                <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300">
                  {twitterCard === "summary" ? "Format 600×600 (1:1)" : "Format 1200×630 (1.91:1)"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={handleStartCropExisting}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-100 transition-colors cursor-pointer"
                title="Ajuster le recadrage ou le zoom"
              >
                <CropIcon className="w-3.5 h-3.5 text-[#0066FF]" />
                <span>Ajuster</span>
              </button>
              <button
                type="button"
                onClick={() => activeFileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-100 transition-colors cursor-pointer"
                title="Remplacer par une autre image"
              >
                <Upload className="w-3.5 h-3.5 text-zinc-600 dark:text-zinc-300" />
                <span>Remplacer</span>
              </button>
              <button
                type="button"
                onClick={handleClearBannerAction}
                className="p-1 rounded-[6px] text-zinc-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors cursor-pointer"
                title="Supprimer la bannière personnalisée"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* ── EMPTY DROPZONE (Simple & Sobre) ── */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => activeFileInputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center p-4 rounded-[10px] border border-dashed text-center transition-colors cursor-pointer select-none",
              isDragging
                ? "border-[#0066FF] bg-[#0066FF]/5"
                : "border-zinc-300 dark:border-zinc-700 hover:border-zinc-400 dark:hover:border-zinc-600 bg-zinc-50/60 dark:bg-zinc-900/40"
            )}
          >
            <div className="w-8 h-8 rounded-[8px] bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 flex items-center justify-center mb-1.5">
              <Upload className="w-4 h-4" />
            </div>
            <span className="text-xs font-bold text-zinc-950 dark:text-white">
              Importer une bannière personnalisée
            </span>
            <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 mt-0.5">
              Glissez-déposez ou cliquez · JPG, PNG, WebP (max 10 Mo)
            </span>
          </div>
        )}

        {/* 4. Social Network Switcher Tabs */}
        <div className="flex flex-col gap-1.5 pt-1">
          <label className="text-xs font-semibold text-zinc-950 dark:text-white">
            Aperçu sur les réseaux sociaux
          </label>
          <div className="grid grid-cols-4 gap-1 p-1 rounded-[8px] bg-zinc-100 dark:bg-[#16181d] border border-zinc-200 dark:border-[#22242a]">
            {(
              [
                { id: "x", label: "Twitter / X" },
                { id: "facebook", label: "Facebook" },
                { id: "linkedin", label: "LinkedIn" },
                { id: "whatsapp", label: "WhatsApp" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSocialPlatformPreview(p.id)}
                className={cn(
                  "py-1.5 px-2 rounded-[6px] text-[11px] transition-all text-center cursor-pointer",
                  socialPlatformPreview === p.id
                    ? "bg-white dark:bg-[#0e0f12] text-zinc-950 dark:text-white shadow-xs border border-zinc-200 dark:border-zinc-700 font-semibold"
                    : "text-zinc-700 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 5. Live Card Mockups (Simple, Sobre, Light & Dark Adaptive) */}
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-[10px] overflow-hidden bg-white dark:bg-[#12141a] text-left shadow-2xs transition-all">
          {socialPlatformPreview === "whatsapp" ? (
            /* WhatsApp Message Card Style (Clean Light/Dark) */
            <div className="p-3.5 bg-zinc-50 dark:bg-[#0e1015]">
              <div className="max-w-[320px] rounded-[8px] bg-white dark:bg-[#181b22] p-2.5 shadow-2xs border border-zinc-200 dark:border-zinc-800 flex flex-col gap-2">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (hasCustomImage) handleStartCropExisting();
                    else activeFileInputRef.current?.click();
                  }}
                  className={cn(
                    "relative w-full rounded-[6px] overflow-hidden cursor-pointer bg-zinc-100 dark:bg-[#12141a] border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center transition-all group",
                    twitterCard === "summary" ? "h-24 sm:h-28" : "h-32 sm:h-36"
                  )}
                >
                  {hasCustomImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImage}
                        alt="WhatsApp preview"
                        className="w-full h-full object-cover"
                        onError={() => setHasImageError(true)}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
                        <span className="p-1.5 rounded-[6px] bg-white text-zinc-950 text-xs shadow-xs">
                          <CropIcon className="w-3.5 h-3.5 text-[#0066FF]" />
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="p-2 text-center flex flex-col items-center gap-1 text-zinc-600 dark:text-zinc-300">
                      <ImageIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                      <span className="text-[11px] font-medium">Aperçu de l&apos;image</span>
                    </div>
                  )}
                </div>
                <div className="px-1">
                  <span className="text-xs font-bold text-zinc-950 dark:text-white block truncate">
                    {ogTitle || "Titre du lien partagé"}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2 leading-snug mt-0.5">
                    {ogDescription || "Aperçu de la description partagée sur WhatsApp."}
                  </span>
                  <span className="text-[11px] font-semibold text-[#0066FF] dark:text-[#60a5fa] font-mono block mt-1">
                    https://{domainName || "lsho.cc"}/{slug || "..."}
                  </span>
                </div>
              </div>
            </div>
          ) : socialPlatformPreview === "facebook" ? (
            /* Facebook Feed Post Card Style */
            twitterCard === "summary" ? (
              /* Compact Facebook Card (Horizontal split) */
              <div className="flex bg-white dark:bg-[#12141a] overflow-hidden">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (hasCustomImage) handleStartCropExisting();
                    else activeFileInputRef.current?.click();
                  }}
                  className="relative w-28 sm:w-32 h-28 sm:h-32 shrink-0 bg-zinc-100 dark:bg-[#181a20] flex items-center justify-center cursor-pointer group border-r border-zinc-200 dark:border-zinc-800"
                >
                  {hasCustomImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImage}
                        alt="Facebook compact preview"
                        className="w-full h-full object-cover"
                        onError={() => setHasImageError(true)}
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <CropIcon className="w-4 h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="p-2 text-center flex flex-col items-center gap-1 text-zinc-600 dark:text-zinc-300">
                      <ImageIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                      <span className="text-[10px] font-medium">Format 1:1</span>
                    </div>
                  )}
                </div>
                <div className="p-3.5 flex flex-col justify-center min-w-0 flex-1 bg-zinc-50/60 dark:bg-[#151821]">
                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400 uppercase font-bold tracking-wider block">
                    {(domainName || "lsho.cc").toUpperCase()}
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white block truncate mt-0.5">
                    {ogTitle || "Titre du lien sur Facebook"}
                  </span>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2 mt-0.5">
                    {ogDescription || "Description du contenu affichée dans le fil d'actualité Facebook."}
                  </span>
                </div>
              </div>
            ) : (
              /* Large Facebook Banner */
              <div>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (hasCustomImage) handleStartCropExisting();
                    else activeFileInputRef.current?.click();
                  }}
                  className="relative w-full h-40 sm:h-44 overflow-hidden cursor-pointer group flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-[#181a20]"
                >
                  {hasCustomImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImage}
                        alt="Facebook preview"
                        className="w-full h-full object-cover"
                        onError={() => setHasImageError(true)}
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white text-zinc-950 text-xs font-semibold shadow-xs">
                          <CropIcon className="w-3.5 h-3.5 text-[#0066FF]" />
                          <span>Ajuster / Recadrer</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-5 px-4 flex flex-col items-center justify-center text-center gap-1.5">
                      <ImageIcon className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        Aperçu de la bannière (1200 × 630 px)
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3.5 bg-zinc-50/70 dark:bg-[#151821]">
                  <span className="text-[10px] text-zinc-600 dark:text-zinc-400 uppercase font-bold tracking-wider block">
                    {(domainName || "lsho.cc").toUpperCase()}
                  </span>
                  <span className="text-sm font-bold text-zinc-950 dark:text-white block truncate mt-0.5">
                    {ogTitle || "Titre du lien sur Facebook"}
                  </span>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2 mt-0.5">
                    {ogDescription || "Description du contenu affichée dans le fil d'actualité Facebook."}
                  </span>
                </div>
              </div>
            )
          ) : socialPlatformPreview === "linkedin" ? (
            /* LinkedIn Post Card Style */
            twitterCard === "summary" ? (
              /* Compact LinkedIn Card */
              <div className="flex bg-white dark:bg-[#12141a] overflow-hidden">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (hasCustomImage) handleStartCropExisting();
                    else activeFileInputRef.current?.click();
                  }}
                  className="relative w-24 sm:w-28 h-24 sm:h-28 shrink-0 bg-zinc-100 dark:bg-[#181a20] flex items-center justify-center cursor-pointer group border-r border-zinc-200 dark:border-zinc-800"
                >
                  {hasCustomImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImage}
                        alt="LinkedIn compact preview"
                        className="w-full h-full object-cover"
                        onError={() => setHasImageError(true)}
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <CropIcon className="w-4 h-4 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="p-2 text-center flex flex-col items-center gap-1 text-zinc-600 dark:text-zinc-300">
                      <ImageIcon className="w-5 h-5 text-zinc-400 dark:text-zinc-500" />
                      <span className="text-[10px] font-medium">Format 1:1</span>
                    </div>
                  )}
                </div>
                <div className="p-3.5 flex flex-col justify-center min-w-0 flex-1 bg-zinc-50/60 dark:bg-[#151821]">
                  <span className="text-xs sm:text-sm font-bold text-zinc-950 dark:text-white block truncate">
                    {ogTitle || "Titre professionnel LinkedIn"}
                  </span>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 line-clamp-1 mt-0.5">
                    {ogDescription || "Description affichée sur LinkedIn."}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 font-mono block mt-1">
                    {domainName || "lsho.cc"}
                  </span>
                </div>
              </div>
            ) : (
              /* Large LinkedIn Banner */
              <div>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => {
                    if (hasCustomImage) handleStartCropExisting();
                    else activeFileInputRef.current?.click();
                  }}
                  className="relative w-full h-40 sm:h-44 overflow-hidden cursor-pointer group flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/80 dark:bg-[#181a20]"
                >
                  {hasCustomImage ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={activeImage}
                        alt="LinkedIn preview"
                        className="w-full h-full object-cover"
                        onError={() => setHasImageError(true)}
                      />
                      <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white text-zinc-950 text-xs font-semibold shadow-xs">
                          <CropIcon className="w-3.5 h-3.5 text-[#0066FF]" />
                          <span>Ajuster / Recadrer</span>
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-5 px-4 flex flex-col items-center justify-center text-center gap-1.5">
                      <ImageIcon className="w-6 h-6 text-zinc-400 dark:text-zinc-500" />
                      <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                        Aperçu de la bannière (1200 × 630 px)
                      </span>
                    </div>
                  )}
                </div>
                <div className="p-3.5 bg-zinc-50/70 dark:bg-[#151821]">
                  <span className="text-sm font-bold text-zinc-950 dark:text-white block truncate">
                    {ogTitle || "Titre professionnel LinkedIn"}
                  </span>
                  <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2 mt-0.5">
                    {ogDescription || "Description affichée lors du partage sur LinkedIn."}
                  </span>
                  <span className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 font-mono block mt-1">
                    {domainName || "lsho.cc"}
                  </span>
                </div>
              </div>
            )
          ) : twitterCard === "summary_large_image" ? (
            /* Twitter / X Large Banner Style (Simple, Sobre, Light & Dark Mode) */
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (hasCustomImage) handleStartCropExisting();
                  else activeFileInputRef.current?.click();
                }}
                className={cn(
                  "relative w-full h-40 sm:h-44 overflow-hidden cursor-pointer group flex items-center justify-center border-b border-zinc-200 dark:border-zinc-800 transition-colors",
                  isDragging
                    ? "bg-[#0066FF]/10"
                    : "bg-zinc-100/80 dark:bg-[#181a20] hover:bg-zinc-200/50 dark:hover:bg-[#1e2028]",
                )}
              >
                {hasCustomImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeImage}
                      alt="Social preview banner"
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.01]"
                      onError={(e) => {
                        if (previewImage) return;
                        const target = e.currentTarget;
                        if (
                          ogImage &&
                          (ogImage.includes("/banners/") || ogImage.startsWith("/api/images/")) &&
                          !target.dataset.retried
                        ) {
                          target.dataset.retried = "1";
                          const filename = ogImage.split("?")[0].split("/").pop();
                          target.src = `/api/images/${filename}`;
                        } else {
                          setHasImageError(true);
                        }
                      }}
                    />
                    {/* Hover Overlay with Action Buttons */}
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartCropExisting();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#0066FF] hover:bg-[#0055d4] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                      >
                        <CropIcon className="w-3.5 h-3.5" />
                        <span>Ajuster</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          activeFileInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-white text-zinc-950 text-xs font-semibold shadow-xs hover:bg-zinc-100 transition-colors cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#0066FF]" />
                        <span>Remplacer</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearBannerAction();
                        }}
                        className="p-1.5 rounded-[6px] bg-red-600/90 hover:bg-red-600 text-white shadow-xs transition-colors cursor-pointer"
                        title="Supprimer la bannière"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  /* Live Auto-Generated Banner Preview (matches /banners/og.png) */
                  <div className="w-full h-full bg-gradient-to-br from-[#f8faff] to-[#e8f0ff] p-4 flex flex-col justify-between text-left select-none relative overflow-hidden">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-[5px] bg-[#2563EB] text-white text-[9px] font-black flex items-center justify-center">
                          LS
                        </span>
                        <span className="text-[11px] font-extrabold text-zinc-950">LShorter</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#2563EB] text-white text-[9px] font-bold font-mono">
                        {domainName || "lsho.cc"}/{slug || "slug"}
                      </span>
                    </div>
                    <div className="my-auto py-1">
                      <div className="text-sm font-black text-zinc-950 line-clamp-1 leading-tight">
                        {ogTitle || "Titre de votre lien partagé"}
                      </div>
                      <div className="text-[11px] font-medium text-zinc-700 line-clamp-2 mt-1 leading-snug">
                        {ogDescription || "Votre description apparaîtra automatiquement ici sur la bannière."}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[9px] font-semibold text-zinc-500 border-t border-zinc-900/10 pt-1.5">
                      <span className="text-[#2563EB] font-bold">Bannière auto-générée (1200×630)</span>
                      <span>Cliquez pour importer une image</span>
                    </div>
                  </div>
                )}
                {/* Authentic X/Twitter Large Card Title Pill Overlay */}
                <div className="pointer-events-none absolute bottom-2 left-2 right-2 flex items-center">
                  <span className="max-w-full truncate px-2 py-0.5 rounded-[5px] bg-black/75 text-white text-[11px] font-semibold backdrop-blur-xs">
                    {ogTitle || "Titre de votre lien partagé"}
                  </span>
                </div>
              </div>

              {/* Twitter / X Post Metadata Block */}
              <div className="px-3.5 py-2.5 bg-white dark:bg-[#12141a] flex flex-col gap-1">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  <Globe2 className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                  <span>From {domainName || "lsho.cc"}</span>
                </div>
                <p className="text-[11px] font-medium text-zinc-600 dark:text-zinc-400 leading-snug">
                  Sur X (Twitter), le format Large affiche uniquement l&apos;image et le titre en superposition. Pour afficher le texte de description à côté sur X, utilisez le format <strong className="text-zinc-900 dark:text-zinc-200">Compact (1:1)</strong>. Sur LinkedIn, WhatsApp, Facebook et Discord, la description s&apos;affiche dans les deux formats.
                </p>
              </div>
            </div>
          ) : (
            /* Twitter / X Compact Summary Style (Simple, Sobre, Light & Dark Mode) */
            <div className="flex items-center gap-3.5 p-3.5 bg-white dark:bg-[#12141a]">
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => {
                  if (hasCustomImage) handleStartCropExisting();
                  else activeFileInputRef.current?.click();
                }}
                className={cn(
                  "relative w-20 h-20 rounded-[8px] overflow-hidden cursor-pointer group shrink-0 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-colors",
                  isDragging
                    ? "bg-[#0066FF]/10"
                    : "bg-zinc-100 dark:bg-[#181a20] hover:bg-zinc-200/60 dark:hover:bg-[#1e2028]",
                )}
              >
                {hasCustomImage ? (
                  <>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={activeImage}
                      alt="Compact thumb"
                      className="w-full h-full object-cover"
                      onError={() => setHasImageError(true)}
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartCropExisting();
                        }}
                        className="p-1 rounded-[5px] bg-[#0066FF] text-white cursor-pointer"
                        title="Ajuster"
                      >
                        <CropIcon className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          activeFileInputRef.current?.click();
                        }}
                        className="p-1 rounded-[5px] bg-white text-zinc-950 cursor-pointer"
                        title="Remplacer"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#0066FF]" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClearBannerAction();
                        }}
                        className="p-1 rounded-[5px] bg-red-600 text-white cursor-pointer"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-1 text-center text-zinc-500 dark:text-zinc-400">
                    <ImageIcon className="w-5 h-5" />
                    <span className="text-[10px] font-semibold mt-1 leading-tight">
                      1:1
                    </span>
                  </div>
                )}
              </div>

              {/* Compact Text Metadata */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-[11px] font-semibold text-zinc-600 dark:text-zinc-400">
                  <Globe2 className="w-3 h-3 text-zinc-500 dark:text-zinc-400" />
                  <span>{domainName || "lsho.cc"}</span>
                </div>
                <span className="text-sm font-bold text-zinc-950 dark:text-white block truncate mt-0.5">
                  {ogTitle || "Titre de la carte compacte"}
                </span>
                <span className="text-xs font-medium text-zinc-700 dark:text-zinc-300 line-clamp-2 mt-0.5">
                  {ogDescription || "Description compacte pour Twitter / X."}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
