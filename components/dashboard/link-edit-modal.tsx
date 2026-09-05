"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  Share2,
  Sliders,
  Globe2,
  Shield,
  Trash2,
  Upload,
  Info,
  Lock,
  Calendar,
  Sparkles,
  Tag,
  Check,
  Crown,
  Edit3,
  Power,
  Eye,
  EyeOff,
  AlertCircle,
  ImageIcon
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cfUpdateLink, cfUploadImage, cfNormalizeImageUrl, cfInvalidateCache } from "@/lib/cloudflare-api";
import { compressImageFile } from "@/lib/image-compress";
import { ShortLink } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RoutingRulesEditor, RoutingRule } from "./routing-rules-editor";
import { compileRoutingRules } from "@/lib/routing-utils";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { showToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface LinkEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  link: ShortLink | null;
  onSuccess?: (updated: ShortLink) => void;
}

// ─── Reusable Error Alert Component ──────────────────────────────────────────
function FieldErrorAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-[10px] px-2.5 py-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1">
      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
      <span className="font-medium leading-tight">{message}</span>
    </div>
  );
}

// ─── Reusable Frosted Glass Locked PRO Feature Overlay ─────────────────────────
function LockedProFeature({
  title,
  description,
  children,
  isUnlocked,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  isUnlocked: boolean;
}) {
  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="relative rounded-[10px] overflow-hidden border border-amber-500/25 bg-[#16161a] p-4 group select-none">
      {/* Blurred & Disabled Content */}
      <div className="opacity-25 pointer-events-none select-none filter blur-[1.5px]">
        {children}
      </div>

      {/* Frosted Glass Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-black/90 backdrop-blur-[3px] flex flex-col sm:flex-row items-center justify-between px-5 py-3 gap-3.5 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">{title}</span>
              <span className="px-1.5 py-0.5 rounded-[10px] bg-amber-500/20 text-amber-400 font-extrabold text-[9px] border border-amber-500/30 tracking-wider">
                PLAN PRO
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 leading-tight mt-0.5">
              {description}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() =>
            triggerPlanUpgrade({
              featureName: title,
              reason: `Débloquez ${title} en passant au plan PRO.`,
              targetPlan: "PRO",
            })
          }
          className="px-3.5 py-1.5 rounded-[10px] bg-gradient-to-r from-[#ff6600] to-amber-500 hover:from-[#ff7711] hover:to-amber-400 text-white font-bold text-xs shadow-lg shadow-[#ff6600]/25 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Débloquer avec PRO</span>
        </button>
      </div>
    </div>
  );
}

export function LinkEditModal({
  isOpen,
  onClose,
  link,
  onSuccess,
}: LinkEditModalProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");

  // Plan detection with fallback support
  const userPlan = (
    convexUser?.plan ||
    (session?.user as any)?.plan ||
    (typeof window !== "undefined" ? localStorage.getItem("lshorter_user_plan") : null) ||
    "FREEMIUM"
  ).toUpperCase();

  const isProPlan = userPlan === "PRO" || userPlan === "BUSINESS" || userPlan === "ENTERPRISE";

  const [activeTab, setActiveTab] = useState<"general" | "social" | "routing" | "protection">("general");

  // Form State
  const [targetUrl, setTargetUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [tagsInput, setTagsInput] = useState("");

  // Social Preview & Banner
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Routing Rules
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);

  // Protection & Expiration
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isCloaked, setIsCloaked] = useState(false);
  const [hideReferrer, setHideReferrer] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [hasClickLimit, setHasClickLimit] = useState(false);
  const [maxClicks, setMaxClicks] = useState<number | string>(50);
  const [fallbackUrl, setFallbackUrl] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize form with link data when opened
  useEffect(() => {
    if (link && isOpen) {
      setTargetUrl(link.targetUrl || "");
      setSlug(link.slug || "");
      setIsActive(link.isActive !== false);
      setTagsInput(Array.isArray(link.tags) ? link.tags.join(", ") : "");

      setOgTitle(link.ogTitle || link.metaTitle || "");
      setOgDescription(link.ogDescription || "");
      setOgImage(link.ogImage || "");
      setPreviewImage("");

      // Routing rules initialization
      let parsedRules: RoutingRule[] = [];
      if (link.routingRules) {
        parsedRules = typeof link.routingRules === "string" ? JSON.parse(link.routingRules) : link.routingRules;
      } else if (link.geoTargeting || link.deviceTargeting) {
        // Map legacy geo/device targeting to visual routing rules
        if (link.geoTargeting) {
          Object.entries(link.geoTargeting).forEach(([country, url], idx) => {
            parsedRules.push({
              id: `geo_${idx}`,
              title: `Routage ${country}`,
              isCollapsed: false,
              conditions: [{ id: `c_geo_${idx}`, type: "pays", operator: "est", value: country }],
              destinationUrl: url,
            });
          });
        }
        if (link.deviceTargeting) {
          Object.entries(link.deviceTargeting).forEach(([device, url], idx) => {
            if (url) {
              parsedRules.push({
                id: `dev_${idx}`,
                title: `Routage ${device}`,
                isCollapsed: false,
                conditions: [{ id: `c_dev_${idx}`, type: "plateforme", operator: "est", value: device }],
                destinationUrl: url,
              });
            }
          });
        }
      }
      setRoutingRules(parsedRules);

      setPassword(link.password || "");
      setIsCloaked(Boolean(link.isCloaked));
      setHideReferrer(Boolean(link.hideReferrer));
      setExpiresAt(link.expiresAt ? link.expiresAt.substring(0, 16) : "");
      setHasClickLimit(Boolean(link.maxClicks && link.maxClicks > 0));
      setMaxClicks(link.maxClicks || 50);
      setFallbackUrl(link.fallbackUrl || "");
    }
  }, [link, isOpen]);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast.error("L'image ne doit pas dépasser 8 Mo.");
      return;
    }

    // Reset input value so selecting the same file again triggers onChange
    e.target.value = "";

    try {
      const localUrl = URL.createObjectURL(file);
      setPreviewImage(localUrl);
    } catch {}

    setIsUploadingImage(true);
    try {
      const res = await cfUploadImage(file);
      if (res?.url) {
        setOgImage(res.url);
        setPreviewImage(res.url);
        showToast.success("Bannière prête !");
      } else {
        const compressed = await compressImageFile(file, 1200, 630, 0.82);
        if (typeof compressed === "string") {
          setOgImage(compressed);
          setPreviewImage(compressed);
        } else {
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = (event.target?.result as string) || "";
            setOgImage(dataUrl);
            setPreviewImage(dataUrl);
          };
          reader.readAsDataURL(compressed as Blob);
        }
        showToast.success("Bannière importée !");
      }
    } catch (err) {
      console.error("Upload error:", err);
      showToast.error("Erreur lors du traitement de l'image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ─── Format Validation Functions ─────────────────────────────────────────
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const checkUrlFormat = (val: string, isRequired = false): string => {
    const trimmed = val.trim();
    if (!trimmed) {
      return isRequired ? "L'URL de destination est obligatoire." : "";
    }
    if (/\s/.test(trimmed)) {
      return "L'URL ne doit pas contenir d'espaces.";
    }
    const withProto = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const urlObj = new URL(withProto);
      if (
        !urlObj.hostname ||
        (!urlObj.hostname.includes(".") && urlObj.hostname !== "localhost") ||
        urlObj.hostname.startsWith(".") ||
        urlObj.hostname.endsWith(".")
      ) {
        return "Nom de domaine invalide (ex: https://monsite.com).";
      }
    } catch {
      return "Format d'URL invalide. Exemple attendu : https://monsite.com/page";
    }
    return "";
  };

  const checkSlugFormat = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) return "";
    if (/\s/.test(trimmed)) {
      return "Le slug personnalisé ne doit pas contenir d'espaces.";
    }
    if (trimmed.includes("/")) {
      return "Le slug ne doit pas comporter de slash (/).";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return "Format strict requis : seuls les lettres, chiffres, tirets (-) et underscores (_) sont autorisés sans accents ni caractères spéciaux.";
    }
    if (trimmed.length < 2) {
      return "Le slug doit contenir au moins 2 caractères.";
    }
    if (trimmed.length > 80) {
      return "Le slug ne doit pas dépasser 80 caractères.";
    }
    return "";
  };

  const checkPasswordFormat = (val: string): string => {
    if (!val) return "";
    if (val.length < 4) {
      return "Le mot de passe doit comporter au moins 4 caractères.";
    }
    return "";
  };

  const checkExpiresAtFormat = (val: string): string => {
    if (!val) return "";
    const time = new Date(val).getTime();
    if (isNaN(time)) return "Format de date invalide.";
    if (time <= Date.now()) {
      return "La date d'expiration doit être strictement ultérieure à la date et heure actuelles.";
    }
    return "";
  };

  const checkMaxClicksFormat = (val: string | number, enabled: boolean): string => {
    if (!enabled) return "";
    const n = Number(val);
    if (isNaN(n) || n < 1 || !Number.isInteger(n)) {
      return "Le plafond de clics doit être un nombre entier supérieur ou égal à 1.";
    }
    return "";
  };

  const checkFallbackUrlFormat = (val: string, enabled: boolean): string => {
    if (!enabled || !val.trim()) return "";
    return checkUrlFormat(val, false);
  };

  if (!isOpen || !link) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    const errors: Record<string, string> = {};
    const targetErr = checkUrlFormat(targetUrl, true);
    if (targetErr) errors.targetUrl = targetErr;

    if (slug) {
      const slugErr = checkSlugFormat(slug);
      if (slugErr) errors.slug = slugErr;
    }

    if (password) {
      const pwdErr = checkPasswordFormat(password);
      if (pwdErr) errors.password = pwdErr;
    }

    if (expiresAt) {
      const expErr = checkExpiresAtFormat(expiresAt);
      if (expErr) errors.expiresAt = expErr;
    }

    if (hasClickLimit) {
      const clicksErr = checkMaxClicksFormat(maxClicks, hasClickLimit);
      if (clicksErr) errors.maxClicks = clicksErr;

      if (fallbackUrl) {
        const fbErr = checkFallbackUrlFormat(fallbackUrl, hasClickLimit);
        if (fbErr) errors.fallbackUrl = fbErr;
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (errors.targetUrl || errors.slug) {
        setActiveTab("general");
      } else if (errors.password || errors.expiresAt || errors.maxClicks || errors.fallbackUrl) {
        setActiveTab("protection");
      }
      showToast.error("Certains champs ne respectent pas le format strict. Veuillez corriger les alertes en rouge.");
      return;
    }

    setIsSubmitting(true);

    try {
      let finalOgImage = ogImage;
      if (ogImage && ogImage.startsWith("data:")) {
        const uploadRes = await cfUploadImage(ogImage);
        if (uploadRes?.url) {
          finalOgImage = uploadRes.url;
        }
      }

      // Compile routing rules with comprehensive geo & device targeting
      const { geoTargeting, deviceTargeting, routingRules: compiledRules } = compileRoutingRules(routingRules);

      const tags = tagsInput
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const updates: any = {
        userId: userId || link.userId,
        targetUrl: targetUrl.trim(),
        slug: slug.trim() || link.slug,
        isActive: Boolean(isActive),
        is_active: isActive ? 1 : 0,
        tags: tags.length ? tags : null,
        ogTitle: ogTitle.trim() || null,
        metaTitle: ogTitle.trim() || null,
        ogDescription: ogDescription.trim() || null,
        ogImage: finalOgImage.trim() || null,
        routingRules: compiledRules || null,
        geoTargeting: geoTargeting || null,
        deviceTargeting: deviceTargeting || null,
        isCloaked: isProPlan ? isCloaked : false,
        hideReferrer,
        expiresAt: isProPlan && expiresAt ? new Date(expiresAt).toISOString() : null,
        maxClicks: isProPlan && hasClickLimit && maxClicks ? Number(maxClicks) : null,
        max_clicks: isProPlan && hasClickLimit && maxClicks ? Number(maxClicks) : null,
        fallbackUrl: isProPlan && hasClickLimit && fallbackUrl.trim() ? fallbackUrl.trim() : null,
        fallback_url: isProPlan && hasClickLimit && fallbackUrl.trim() ? fallbackUrl.trim() : null,
      };

      if (password) {
        updates.password = password;
      }

      await cfUpdateLink(link.id, updates);

      const updatedShortLink: ShortLink = {
        ...link,
        targetUrl: updates.targetUrl,
        slug: updates.slug,
        isActive: updates.isActive,
        tags: updates.tags || [],
        ogTitle: updates.ogTitle || undefined,
        metaTitle: updates.metaTitle || undefined,
        ogDescription: updates.ogDescription || undefined,
        ogImage: updates.ogImage || undefined,
        routingRules: updates.routingRules || undefined,
        geoTargeting: updates.geoTargeting || undefined,
        deviceTargeting: updates.deviceTargeting || undefined,
        isCloaked: updates.isCloaked,
        hideReferrer: updates.hideReferrer,
        expiresAt: updates.expiresAt || undefined,
        maxClicks: updates.maxClicks || undefined,
        fallbackUrl: updates.fallbackUrl || undefined,
      };

      cfInvalidateCache();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lshorter_links_updated", { detail: updatedShortLink }));
        window.dispatchEvent(new Event("lshorter_data_change"));
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });

      showToast.success("Lien mis à jour avec succès !");
      setIsSubmitting(false);
      if (onSuccess) onSuccess(updatedShortLink);
      onClose();
    } catch (err: any) {
      const msg: string = err?.message || "";
      setIsSubmitting(false);
      if (msg.includes("403") || msg.toLowerCase().includes("plan_upgrade_required") || msg.toLowerCase().includes("forbidden") || msg.toLowerCase().includes("pro plan")) {
        triggerPlanUpgrade({
          reason: "La protection par mot de passe et le cloaking requièrent le forfait PRO ou supérieur.",
          featureName: "Protection & Cloaking PRO",
          targetPlan: "PRO",
        });
        return;
      }
      showToast.error(msg || "Erreur lors de la modification du lien.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-[#141416] border border-[#27272a] rounded-[10px] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-start justify-between p-4 sm:p-6 border-b border-[#222225] bg-[#1a1a1e]/80">
          <div className="flex items-start gap-3.5 pr-4 flex-1 min-w-0">
            <div className="w-10 h-10 min-w-[40px] min-h-[40px] shrink-0 aspect-square rounded-[10px] bg-[#ff6600]/10 border border-[#ff6600]/20 flex items-center justify-center text-[#ff6600]">
              <Edit3 className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Modifier le Lien Court
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded-[10px] bg-[#ff6600]/10 text-[#ff6600] font-semibold border border-[#ff6600]/20 truncate max-w-[200px]">
                  {link.domainName}/{link.slug}
                </span>
              </div>
              <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                Personnalisez la bannière, l&apos;URL cible, les règles de routage et la sécurité.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-all cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-4 sm:px-6 pt-3 pb-2 border-b border-[#222225] bg-[#141416] overflow-x-auto no-scrollbar scroll-smooth">
          {[
            { id: "general", label: "Général", icon: Sliders },
            { id: "social", label: "Bannière & Réseaux Sociaux", icon: Share2 },
            { id: "routing", label: "Règles de Routage", icon: Globe2 },
            { id: "protection", label: "Protection & Sécurité", icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActiveTab = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-[10px] transition-all cursor-pointer whitespace-nowrap ${
                  isActiveTab
                    ? "bg-[#ff6600] text-black shadow-lg shadow-[#ff6600]/20"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* TAB 1: GENERAL */}
          {activeTab === "general" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Target URL */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  URL de Destination *
                </label>
                <Input
                  value={targetUrl}
                  onChange={(e) => {
                    setTargetUrl(e.target.value);
                    if (fieldErrors.targetUrl) {
                      const err = checkUrlFormat(e.target.value, true);
                      setFieldErrors((prev) => ({ ...prev, targetUrl: err }));
                    }
                  }}
                  placeholder="https://votre-site.com/ma-page"
                  required
                  className={cn(
                    "bg-[#0e0e10] border-[#2a2a2e] text-white font-mono text-sm focus:border-[#ff6600]",
                    fieldErrors.targetUrl &&
                      "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-950/20 text-red-100"
                  )}
                />
                <FieldErrorAlert message={fieldErrors.targetUrl} />
                <p className="text-[11px] text-neutral-500 mt-1">
                  Les visiteurs seront instantanément redirigés vers cette adresse.
                </p>
              </div>

              {/* Slug & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Slug Personnalisé
                  </label>
                  <Input
                    value={slug}
                    onChange={(e) => {
                      setSlug(e.target.value);
                      if (fieldErrors.slug) {
                        const err = checkSlugFormat(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, slug: err }));
                      }
                    }}
                    placeholder="promo-special"
                    className={cn(
                      "bg-[#0e0e10] border-[#2a2a2e] text-white font-mono text-sm focus:border-[#ff6600]",
                      fieldErrors.slug &&
                        "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-950/20 text-red-100"
                    )}
                  />
                  <FieldErrorAlert message={fieldErrors.slug} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                    Statut de Redirection
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsActive(!isActive)}
                    className={`w-full h-10 px-3 flex items-center justify-between rounded-[10px] border text-xs font-semibold transition-colors cursor-pointer ${
                      isActive
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-red-500/10 border-red-500/30 text-red-400"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Power className="w-4 h-4" />
                      {isActive ? "Lien Actif (Redirige)" : "Lien en Pause (Désactivé)"}
                    </span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-[10px] bg-black/40">
                      {isActive ? "ON" : "OFF"}
                    </span>
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-1.5">
                  Tags (séparés par des virgules)
                </label>
                <div className="relative">
                  <Tag className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
                  <Input
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                    placeholder="marketing, twitter, promo"
                    className="bg-[#0e0e10] border-[#2a2a2e] text-white text-sm pl-9 focus:border-[#ff6600]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOCIAL PREVIEW & BANNER */}
          {activeTab === "social" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 animate-in fade-in duration-200">
              {/* Left Column: Form Controls */}
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Titre OpenGraph
                  </label>
                  <Input
                    value={ogTitle}
                    onChange={(e) => setOgTitle(e.target.value)}
                    placeholder="Titre accrocheur pour Twitter, Facebook, WhatsApp..."
                    className="bg-[#1a1a1e] border-[#27272a] text-white text-xs focus:border-[#ff6600]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Description OpenGraph
                  </label>
                  <textarea
                    rows={3}
                    value={ogDescription}
                    onChange={(e) => setOgDescription(e.target.value)}
                    placeholder="Découvrez notre nouvelle offre spéciale et nos services exclusifs..."
                    className="w-full rounded-[10px] bg-[#1a1a1e] border border-[#27272a] p-3 text-xs text-neutral-200 focus:outline-none focus:border-[#ff6600]"
                  />
                </div>

                {/* Banner Upload Area */}
                <div className="flex flex-col gap-2">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Bannière Image (1200×630)
                  </label>

                  {/* Hidden file input */}
                  <input
                    type="file"
                    ref={bannerInputRef}
                    accept="image/*"
                    onChange={handleBannerUpload}
                    className="hidden"
                  />

                  {(previewImage || ogImage) ? (
                    /* Display full active banner with management actions */
                    <div className="rounded-[10px] border border-[#333338] bg-[#141416] p-3 space-y-3 shadow-md">
                      <div className="flex items-center gap-3">
                        <div className="w-20 h-12 rounded-lg bg-black border border-[#27272a] overflow-hidden shrink-0">
                          <img
                            src={previewImage || cfNormalizeImageUrl(ogImage)}
                            alt="Bannière active"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              if (previewImage && e.currentTarget.src !== previewImage) {
                                e.currentTarget.src = previewImage;
                              }
                            }}
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-white truncate">
                            {ogImage.startsWith("data:") ? "Image prête" : ogImage.includes("b-cdn.net") ? "Hébergée sur Bunny CDN" : "Bannière sélectionnée"}
                          </p>
                          <p className="text-[10px] text-neutral-400 truncate font-mono mt-0.5">
                            {ogImage.startsWith("data:") ? "Base64 (Optimisée)" : ogImage}
                          </p>
                        </div>
                      </div>

                      {/* Card actions */}
                      <div className="flex items-center gap-2 pt-1 border-t border-[#222226]">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          disabled={isUploadingImage}
                          onClick={() => {
                            if (bannerInputRef.current) {
                              bannerInputRef.current.value = "";
                              bannerInputRef.current.click();
                            }
                          }}
                          className="h-8 text-xs font-semibold text-white border-[#333338] hover:border-[#ff6600] flex-1 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5 mr-1.5 text-[#ff6600]" />
                          <span>{isUploadingImage ? "Téléversement..." : "Remplacer l'image"}</span>
                        </Button>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setOgImage("");
                            setPreviewImage("");
                            if (bannerInputRef.current) bannerInputRef.current.value = "";
                          }}
                          className="h-8 text-xs font-semibold text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/10 px-3 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          <span>Supprimer</span>
                        </Button>
                      </div>
                    </div>
                  ) : (
                    /* When NO image is set: clean Dropzone + Direct URL input */
                    <div className="space-y-2.5">
                      <div
                        onClick={() => {
                          if (bannerInputRef.current) {
                            bannerInputRef.current.value = "";
                            bannerInputRef.current.click();
                          }
                        }}
                        className="rounded-[10px] border-2 border-dashed border-[#27272a] hover:border-[#ff6600] bg-[#1a1a1e] hover:bg-[#222226] p-4 text-center transition-colors cursor-pointer group select-none"
                      >
                        <div className="w-8 h-8 rounded-full bg-[#ff6600]/10 text-[#ff6600] flex items-center justify-center mx-auto mb-1.5 group-hover:scale-110 transition-transform">
                          <Upload className="w-4 h-4" />
                        </div>
                        <p className="text-xs font-semibold text-white">
                          {isUploadingImage ? "Téléversement en cours..." : "Importer une bannière"}
                        </p>
                        <p className="text-[10px] text-neutral-400 mt-0.5">
                          PNG, JPG, WebP jusqu'à 8 Mo · 1200×630
                        </p>
                      </div>

                      <div>
                        <Input
                          placeholder="Ou coller une URL d'image directe (https://...)"
                          value={ogImage}
                          onChange={(e) => {
                            setOgImage(e.target.value);
                            setPreviewImage(e.target.value);
                          }}
                          className="text-xs font-mono"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: STRICTLY Non-Interactive Social Preview Simulation */}
              <div className="flex flex-col gap-2">
                <label className="block text-xs font-semibold text-neutral-300">
                  Aperçu
                </label>

                <div className="rounded-[10px] bg-[#1a1a1e] border border-[#27272a] overflow-hidden shadow-lg select-none pointer-events-none">
                  <div className="w-full h-40 bg-neutral-900 relative flex items-center justify-center overflow-hidden border-b border-[#27272a]">
                    {(previewImage || ogImage) ? (
                      <img
                        src={previewImage || cfNormalizeImageUrl(ogImage)}
                        alt="Preview banner"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const current = e.currentTarget.src;
                          if (current.includes("/api/images/")) {
                            const fname = current.split("/api/images/")[1];
                            e.currentTarget.src = `https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/images/${fname}`;
                          } else if (previewImage && current !== previewImage) {
                            e.currentTarget.src = previewImage;
                          }
                        }}
                      />
                    ) : (
                      <div className="text-neutral-500 text-xs flex flex-col items-center gap-1.5 p-4 text-center">
                        <ImageIcon className="w-6 h-6 text-neutral-600 mb-1" />
                        <span className="font-semibold text-neutral-400">Aucune bannière configurée</span>
                        <span className="text-[10px] text-neutral-600">L'image apparaîtra ici au format 1200×630</span>
                      </div>
                    )}
                  </div>

                  <div className="p-3.5 flex flex-col gap-1.5 text-xs bg-[#141416]">
                    <span className="text-[10px] text-[#ff6600] font-mono tracking-wide">
                      {link?.domainName || "lsho.cc"}/{link?.slug}
                    </span>
                    <p className="font-bold text-white line-clamp-1 text-sm">
                      {ogTitle || link?.ogTitle || link?.metaTitle || "Titre de la page partagée"}
                    </p>
                    <p className="text-[11px] text-neutral-400 line-clamp-2 leading-relaxed">
                      {ogDescription || link?.ogDescription || "Description qui s'affiche automatiquement dans le flux de réseaux sociaux (WhatsApp, Twitter, LinkedIn)."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === "routing" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <p className="text-xs text-neutral-400">
                Redirigez automatiquement vos utilisateurs vers des destinations différentes selon leur pays, appareil ou ville.
              </p>
              <RoutingRulesEditor
                rules={routingRules}
                onChange={setRoutingRules}
                userPlan={convexUser?.plan || "FREEMIUM"}
              />
            </div>
          )}

          {/* TAB 4: PROTECTION & SECURITY */}
          {activeTab === "protection" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              {/* Hide Referrer */}
              <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#26262a] flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-semibold text-white">Masquage du Référent (No-Referrer)</span>
                  <p className="text-[11px] text-neutral-400 mt-0.5">
                    Protège votre source de trafic en empêchant le site cible de voir l&apos;origine du clic.
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={hideReferrer}
                  onClick={() => setHideReferrer(!hideReferrer)}
                  className={cn(
                    "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                    hideReferrer ? "bg-[#ff6600]" : "bg-[#27272a]"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out",
                      hideReferrer ? "translate-x-5" : "translate-x-0"
                    )}
                  />
                </button>
              </div>

              {/* URL Cloaking (Iframe Masking) */}
              <LockedProFeature
                title="Masquage d'URL (Cloaking)"
                description="Garde votre nom de domaine dans la barre d'adresse du navigateur sans révéler la destination."
                isUnlocked={isProPlan}
              >
                <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#26262a] flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-purple-400" />
                      <span className="text-xs font-semibold text-white">Masquage d&apos;URL (Cloaking)</span>
                    </div>
                    <p className="text-[11px] text-neutral-400 mt-0.5">
                      Garde votre nom de domaine dans la barre d&apos;adresse du navigateur.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isCloaked}
                    onClick={() => setIsCloaked(!isCloaked)}
                    className={cn(
                      "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                      isCloaked ? "bg-[#ff6600]" : "bg-[#27272a]"
                    )}
                  >
                    <span
                      className={cn(
                        "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out",
                        isCloaked ? "translate-x-5" : "translate-x-0"
                      )}
                    />
                  </button>
                </div>
              </LockedProFeature>

              {/* Password Protection */}
              <LockedProFeature
                title="Protection par Mot de Passe"
                description="Sécurisez l'accès à votre destination avec un mot de passe obligatoire."
                isUnlocked={isProPlan}
              >
                <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#26262a] space-y-2">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-400" />
                    <span className="text-xs font-semibold text-white">Protection par Mot de Passe</span>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          const err = checkPasswordFormat(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, password: err }));
                        }
                      }}
                      placeholder="Laisser vide si public (min. 4 caractères)"
                      className={cn(
                        "bg-[#0e0e10] border-[#2a2a2e] text-white text-sm focus:border-[#ff6600] pr-10",
                        fieldErrors.password &&
                          "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-950/20 text-red-100"
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white transition-colors cursor-pointer p-1"
                      aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FieldErrorAlert message={fieldErrors.password} />
                </div>
              </LockedProFeature>

              {/* Click Limit Gated */}
              <LockedProFeature
                title="Limiter le Nombre d'Accès"
                description="Désactivez automatiquement le lien ou redirigez vers une URL de secours après un nombre de clics défini."
                isUnlocked={isProPlan}
              >
                <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#26262a] space-y-3">
                  <div className="flex items-center justify-between gap-3 select-none">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white text-xs">Limiter le nombre d&apos;accès</span>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={hasClickLimit}
                      onClick={() => setHasClickLimit(!hasClickLimit)}
                      className={cn(
                        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none",
                        hasClickLimit ? "bg-[#ff6600]" : "bg-[#27272a]"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform ring-0 transition duration-200 ease-in-out",
                          hasClickLimit ? "translate-x-5" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>

                  {hasClickLimit && (
                    <div className="pt-2.5 border-t border-[#26262e] space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] text-neutral-300 font-medium">
                          Nombre maximal de clics :
                        </span>
                        <div className="inline-flex items-center rounded-[10px] bg-[#0e0e10] border border-[#2a2a32] p-0.5 focus-within:border-[#ff6600] transition-colors">
                          <button
                            type="button"
                            onClick={() => setMaxClicks((prev) => Math.max(1, (Number(prev) || 1) - 1))}
                            className="w-7 h-7 flex items-center justify-center rounded-[10px] text-neutral-400 hover:text-white hover:bg-[#202026] active:scale-95 transition-all text-xs cursor-pointer font-bold"
                            title="Diminuer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={maxClicks}
                            onChange={(e) => {
                              setMaxClicks(e.target.value);
                              if (fieldErrors.maxClicks) {
                                const err = checkMaxClicksFormat(e.target.value, hasClickLimit);
                                setFieldErrors((prev) => ({ ...prev, maxClicks: err }));
                              }
                            }}
                            className={cn(
                              "w-16 text-center bg-transparent text-xs font-mono font-bold text-white focus:outline-none px-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                              fieldErrors.maxClicks && "text-red-400 font-extrabold"
                            )}
                          />
                          <button
                            type="button"
                            onClick={() => setMaxClicks((prev) => (Number(prev) || 0) + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-[10px] text-neutral-400 hover:text-white hover:bg-[#202026] active:scale-95 transition-all text-xs cursor-pointer font-bold"
                            title="Augmenter"
                          >
                            +
                          </button>
                        </div>
                      </div>
                      <FieldErrorAlert message={fieldErrors.maxClicks} />

                      <div>
                        <label className="block text-[10px] text-neutral-400 mb-1">
                          URL de secours une fois le quota atteint (Optionnel) :
                        </label>
                        <Input
                          type="url"
                          placeholder="https://monsite.com/expire"
                          value={fallbackUrl}
                          onChange={(e) => {
                            setFallbackUrl(e.target.value);
                            if (fieldErrors.fallbackUrl) {
                              const err = checkFallbackUrlFormat(e.target.value, hasClickLimit);
                              setFieldErrors((prev) => ({ ...prev, fallbackUrl: err }));
                            }
                          }}
                          className={cn(
                            "h-8 text-xs bg-[#0e0e10] border-[#2a2a2e] focus:border-[#ff6600]",
                            fieldErrors.fallbackUrl &&
                              "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-950/20 text-red-100"
                          )}
                        />
                        <FieldErrorAlert message={fieldErrors.fallbackUrl} />
                      </div>
                    </div>
                  )}
                </div>
              </LockedProFeature>

              {/* Expiration Date */}
              <LockedProFeature
                title="Date d'Expiration Automatique"
                description="Programmez la désactivation ou la redirection alternative à une date précise."
                isUnlocked={isProPlan}
              >
                <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#26262a] space-y-2">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-semibold text-white">Date d&apos;Expiration</span>
                  </div>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => {
                      setExpiresAt(e.target.value);
                      if (fieldErrors.expiresAt) {
                        const err = checkExpiresAtFormat(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, expiresAt: err }));
                      }
                    }}
                    className={cn(
                      "bg-[#0e0e10] border-[#2a2a2e] text-white text-sm focus:border-[#ff6600]",
                      fieldErrors.expiresAt &&
                        "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-950/20 text-red-100"
                    )}
                  />
                  <FieldErrorAlert message={fieldErrors.expiresAt} />
                </div>
              </LockedProFeature>
            </div>
          )}

          {/* Validation Error Summary Alert */}
          {hasAttemptedSubmit && Object.keys(fieldErrors).length > 0 && (
            <div className="p-3.5 rounded-[10px] bg-red-500/15 border border-red-500/40 text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-red-300">Format strict non respecté :</span>
                <span className="text-[11px] text-red-300">
                  Certains champs contiennent des erreurs indiquées en rouge ci-dessus. Veuillez les corriger avant de pouvoir enregistrer les modifications.
                </span>
              </div>
            </div>
          )}

          {/* Modal Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222225]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="text-xs cursor-pointer"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="glow"
              disabled={isSubmitting || isUploadingImage}
              className="text-xs font-bold font-bebas text-base tracking-wide cursor-pointer"
            >
              {isSubmitting ? "ENREGISTREMENT..." : "ENREGISTRER LES MODIFICATIONS"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
