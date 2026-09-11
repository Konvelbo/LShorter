"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X,
  Plus,
  Share2,
  Sliders,
  Globe2,
  Shield,
  Split,
  Settings2,
  Trash2,
  Upload,
  Info,
  Lock,
  Calendar,
  Sparkles,
  Tag,
  Check,
  ChevronRight,
  Crown,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  ChevronDown,
  ImageIcon,
  Power,
  RotateCcw,
  ExternalLink,
  Layers,
  ArrowRight,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  cfCreateLink,
  cfUpdateLink,
  cfGetDomains,
  cfUploadImage,
  cfInvalidateCache,
  sanitizeClientError,
} from "@/lib/cloudflare-api";
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

export interface LinkDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "create" | "edit";
  link?: ShortLink | null;
  initialUrl?: string;
  onSuccess?: (link: ShortLink) => void;
}

// ─── Error Alert Component ──────────────────────────────────────────────────
function FieldErrorAlert({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/30 rounded-[10px] px-2.5 py-1.5 mt-1.5 animate-in fade-in slide-in-from-top-1">
      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-red-500" />
      <span className="font-medium leading-tight">{message}</span>
    </div>
  );
}

// ─── Frosted Glass Locked PRO Feature Overlay ────────────────────────────────
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
    <div
      onClick={() =>
        triggerPlanUpgrade({
          featureName: title,
          reason: `Débloquez ${title} en passant au plan PRO.`,
          targetPlan: "PRO",
        })
      }
      className="relative rounded-[10px] overflow-hidden border border-amber-500/30 bg-[#16161a] dark:bg-[#16161a] p-4 group select-none cursor-pointer transition-all hover:border-amber-500/50 hover:shadow-lg hover:shadow-amber-500/5"
    >
      {/* Blurred & Disabled Content */}
      <div className="opacity-25 pointer-events-none select-none filter blur-[1.5px]">
        {children}
      </div>

      {/* Frosted Glass Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/80 to-black/90 dark:from-black/90 dark:via-black/80 dark:to-black/90 backdrop-blur-[3px] flex flex-col sm:flex-row items-center justify-between px-5 py-3 gap-3.5 z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-[10px] bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/10">
            <Lock className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white tracking-wide">
                {title}
              </span>
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
          onClick={(e) => {
            e.stopPropagation();
            triggerPlanUpgrade({
              featureName: title,
              reason: `Débloquez ${title} en passant au plan PRO.`,
              targetPlan: "PRO",
            });
          }}
          className="px-3.5 py-1.5 rounded-[10px] bg-gradient-to-r from-[#ff6600] to-amber-500 hover:from-[#ff7711] hover:to-amber-400 max-sm:from-blue-600 max-sm:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-[#ff6600]/25 max-sm:shadow-blue-500/25 transition-all flex items-center gap-1.5 shrink-0 cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Débloquer avec PRO</span>
        </button>
      </div>
    </div>
  );
}

export function LinkDrawer({
  isOpen,
  onClose,
  mode = "create",
  link = null,
  initialUrl = "",
  onSuccess,
}: LinkDrawerProps) {
  const isEditMode = mode === "edit" || Boolean(link);

  const { data: session } = useSession();
  const userId =
    session?.user?.id || (link?.userId ? link.userId : "usr_anonymous");
  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId && userId !== "usr_anonymous" ? { userId } : "skip",
  );

  const userPlan = (
    convexUser?.plan ||
    (session?.user as any)?.plan ||
    (typeof window !== "undefined"
      ? localStorage.getItem("lshorter_user_plan")
      : null) ||
    "FREEMIUM"
  ).toUpperCase();

  const isProPlan =
    userPlan === "PRO" || userPlan === "BUSINESS" || userPlan === "ENTERPRISE";

  const bannerInputRef = useRef<HTMLInputElement>(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState<
    | "general"
    | "social"
    | "tracking"
    | "routing"
    | "protection"
    | "ab_testing"
    | "advanced"
  >("general");

  // 1. Général (Saisie obligatoire : targetUrl, domainName, slug)
  const [targetUrl, setTargetUrl] = useState("");
  const [domainName, setDomainName] = useState("");
  const [slug, setSlug] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [tagsInput, setTagsInput] = useState("");
  const [customDomains, setCustomDomains] = useState<
    Array<{ id: string; domain: string; status: string }>
  >([]);

  // 2. Social Preview
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 3. Tracking & UTM
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");

  // 4. Routing
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([]);

  // 5. Protection & Expiry
  const [hideReferrer, setHideReferrer] = useState(false);
  const [isCloaked, setIsCloaked] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [hasClickLimit, setHasClickLimit] = useState(false);
  const [maxClicks, setMaxClicks] = useState<number | string>("");
  const [fallbackUrl, setFallbackUrl] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  // 6. A/B Testing
  const [mainWeight, setMainWeight] = useState<number>(100);
  const [abVariations, setAbVariations] = useState<
    Array<{ url: string; weight: number }>
  >([]);

  // 7. Avancé
  const [redirectType, setRedirectType] = useState<"302" | "301" | "307">(
    "302",
  );
  const [passParams, setPassParams] = useState(true);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Dynamically retrieve user's custom domains from Cloudflare API
  useEffect(() => {
    if (userId && userId !== "usr_anonymous" && isOpen) {
      cfGetDomains(userId)
        .then((res) => {
          const list = res?.data || [];
          const formatted = list.map((d: any) => ({
            id: d.id,
            domain: d.domain_name || d.domain,
            status: d.status,
          }));
          setCustomDomains(formatted);
        })
        .catch(() => {});
    }
  }, [userId, isOpen]);

  // Initialize or reset form based on mode and link
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && link) {
      setTargetUrl(link.targetUrl || "");
      setDomainName(link.domainName || "");
      setSlug(link.slug || "");
      setIsActive(link.isActive !== false);
      setTagsInput(Array.isArray(link.tags) ? link.tags.join(", ") : "");

      setOgTitle(link.ogTitle || link.metaTitle || "");
      setOgDescription(link.ogDescription || "");
      setOgImage(link.ogImage || "");
      setPreviewImage("");

      // Parse routing rules
      let parsedRules: RoutingRule[] = [];
      const rawRoutingRules = link.routingRules || (link as any).routing_rules;
      if (rawRoutingRules) {
        try {
          parsedRules =
            typeof rawRoutingRules === "string"
              ? JSON.parse(rawRoutingRules)
              : rawRoutingRules;
        } catch {
          parsedRules = [];
        }
      } else if (link.geoTargeting || (link as any).geo_targeting || link.deviceTargeting || (link as any).device_targeting) {
        const rawGeo = link.geoTargeting || (link as any).geo_targeting;
        const rawDev = link.deviceTargeting || (link as any).device_targeting;
        const geoObj = typeof rawGeo === "string" ? JSON.parse(rawGeo) : rawGeo;
        const devObj = typeof rawDev === "string" ? JSON.parse(rawDev) : rawDev;

        if (geoObj && typeof geoObj === "object") {
          Object.entries(geoObj).forEach(([country, url], idx) => {
            if (url) {
              parsedRules.push({
                id: `geo_${idx}`,
                title: `Routage ${country}`,
                isCollapsed: false,
                conditions: [
                  {
                    id: `c_geo_${idx}`,
                    type: "pays",
                    operator: "est",
                    value: country,
                  },
                ],
                destinationUrl: String(url),
              });
            }
          });
        }
        if (devObj && typeof devObj === "object") {
          Object.entries(devObj).forEach(([device, url], idx) => {
            if (url) {
              parsedRules.push({
                id: `dev_${idx}`,
                title: `Routage ${device}`,
                isCollapsed: false,
                conditions: [
                  {
                    id: `c_dev_${idx}`,
                    type: "plateforme",
                    operator: "est",
                    value: device,
                  },
                ],
                destinationUrl: String(url),
              });
            }
          });
        }
      }
      setRoutingRules(Array.isArray(parsedRules) ? parsedRules : []);

      setPassword(link.password || (link as any).password_plain || "");
      setIsCloaked(Boolean(link.isCloaked || (link as any).is_cloaked));
      setHideReferrer(
        Boolean(
          link.hideReferrer !== undefined
            ? link.hideReferrer
            : (link as any).hide_referrer,
        ),
      );
      setExpiresAt(
        link.expiresAt || (link as any).expires_at
          ? String(link.expiresAt || (link as any).expires_at).substring(0, 16)
          : "",
      );

      const hasClicks = Boolean(
        (link.maxClicks && link.maxClicks > 0) ||
        ((link as any).max_clicks && (link as any).max_clicks > 0),
      );
      setHasClickLimit(hasClicks);
      setMaxClicks(
        link.maxClicks !== undefined && link.maxClicks !== null
          ? link.maxClicks
          : (link as any).max_clicks !== undefined &&
              (link as any).max_clicks !== null
            ? (link as any).max_clicks
            : "",
      );
      setFallbackUrl(link.fallbackUrl || (link as any).fallback_url || "");

      // A/B testing
      const rawVars = (link as any).abVariations || (link as any).ab_variations;
      if (rawVars) {
        const parsedVars =
          typeof rawVars === "string" ? JSON.parse(rawVars) : rawVars;
        const finalVars = Array.isArray(parsedVars) ? parsedVars : [];
        setAbVariations(finalVars);
        const weightVal = (link as any).mainWeight ?? (link as any).main_weight;
        setMainWeight(
          weightVal !== undefined
            ? Number(weightVal)
            : finalVars.length > 0
              ? 50
              : 100,
        );
      } else {
        setAbVariations([]);
        setMainWeight(100);
      }

      // Advanced
      setRedirectType(
        (link as any).redirectType || (link as any).redirect_type || "302",
      );
      setPassParams(
        (link as any).passParams !== undefined
          ? Boolean((link as any).passParams)
          : (link as any).pass_params !== undefined
            ? Boolean((link as any).pass_params)
            : true,
      );

      // Extract existing UTM if present in targetUrl
      try {
        const urlObj = new URL(link.targetUrl);
        setUtmSource(urlObj.searchParams.get("utm_source") || "");
        setUtmMedium(urlObj.searchParams.get("utm_medium") || "");
        setUtmCampaign(urlObj.searchParams.get("utm_campaign") || "");
        setUtmTerm(urlObj.searchParams.get("utm_term") || "");
        setUtmContent(urlObj.searchParams.get("utm_content") || "");
      } catch {}
    } else {
      // Create mode reset: targetUrl, domainName, slug start strictly empty and are mandatory
      setTargetUrl(initialUrl || "");
      setDomainName("");
      setSlug("");
      setIsActive(true);
      setTagsInput("");
      setOgTitle("");
      setOgDescription("");
      setOgImage("");
      setPreviewImage("");
      setRoutingRules([]); // No hardcoded rules: user adds them as needed
      setHideReferrer(false);
      setIsCloaked(false);
      setPassword("");
      setShowPassword(false);
      setHasClickLimit(false);
      setMaxClicks("");
      setFallbackUrl("");
      setExpiresAt("");
      setMainWeight(100); // 100% traffic to main destination
      setAbVariations([]); // Empty: user adds variants only if A/B testing is wanted
      setRedirectType("302");
      setPassParams(true);
      setUtmSource("");
      setUtmMedium("");
      setUtmCampaign("");
      setUtmTerm("");
      setUtmContent("");
    }

    setFieldErrors({});
    setHasAttemptedSubmit(false);
    setActiveTab("general");
  }, [isOpen, isEditMode, link, initialUrl]);

  // Validation functions (Strict: targetUrl, domainName, and slug are mandatory)
  const checkUrlFormat = (val: string, isRequired = true): string => {
    const trimmed = val.trim();
    if (!trimmed) {
      return isRequired ? "L'URL de destination est obligatoire." : "";
    }
    if (/\s/.test(trimmed)) {
      return "L'URL ne doit pas contenir d'espaces.";
    }
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
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

  const checkDomainFormat = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) {
      return "Le nom de domaine est obligatoire.";
    }
    if (/\s/.test(trimmed)) {
      return "Le nom de domaine ne doit pas contenir d'espaces.";
    }
    const cleaned = trimmed.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    if (
      !/^[a-zA-Z0-9.-]+$/.test(cleaned) ||
      (!cleaned.includes(".") && cleaned !== "localhost")
    ) {
      return "Nom de domaine invalide (ex: monsite.com ou lsho.cc).";
    }
    return "";
  };

  const checkSlugFormat = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) {
      return "Le slug personnalisé est obligatoire.";
    }
    if (/\s/.test(trimmed)) {
      return "Le slug ne doit pas contenir d'espaces.";
    }
    if (trimmed.includes("/")) {
      return "Le slug ne doit pas comporter de slash (/).";
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return "Seuls les lettres, chiffres, tirets (-) et underscores (_) sont autorisés sans accents.";
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
      return "La date d'expiration doit être strictement ultérieure à maintenant.";
    }
    return "";
  };

  const checkMaxClicksFormat = (
    val: string | number,
    enabled: boolean,
  ): string => {
    if (!enabled) return "";
    const n = Number(val);
    if (isNaN(n) || n < 1 || !Number.isInteger(n)) {
      return "Le plafond de clics doit être un nombre entier supérieur ou égal à 1.";
    }
    return "";
  };

  // Image upload
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("L'image ne doit pas dépasser 10 Mo.");
      return;
    }

    try {
      const localUrl = URL.createObjectURL(file);
      setPreviewImage(localUrl);
    } catch {}

    setIsUploadingImage(true);
    try {
      const compressed = await compressImageFile(file, 1200, 630, 0.82);
      let dataUrl = "";
      if (typeof compressed === "string") {
        dataUrl = compressed;
      } else {
        dataUrl = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (event) => resolve((event.target?.result as string) || "");
          reader.onerror = () => resolve("");
          reader.readAsDataURL(compressed as Blob);
        });
      }

      if (!dataUrl) {
        throw new Error("Impossible de lire le fichier image.");
      }

      // Immediately upload to Bunny CDN!
      const uploadRes = await cfUploadImage(dataUrl, "Banners");
      if (uploadRes?.url) {
        setOgImage(uploadRes.url);
        setPreviewImage(uploadRes.url);
        showToast.success("Bannière téléversée avec succès sur le CDN Bunny !");
      } else {
        setOgImage(dataUrl);
        setPreviewImage(dataUrl);
        showToast.success("Bannière sélectionnée !");
      }
    } catch (err: any) {
      console.error("Banner upload error:", err);
      showToast.error("Erreur lors du téléversement de la bannière.");
    } finally {
      setIsUploadingImage(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  // A/B Testing helpers
  const handleAddVariation = () => {
    if (abVariations.length >= 5) {
      showToast.error("Maximum 5 variantes autorisées.");
      return;
    }
    const newVariations = [...abVariations, { url: "", weight: 20 }];
    const count = 1 + newVariations.length;
    const equalWeight = Math.floor(100 / count);
    const remainder = 100 - equalWeight * count;
    setMainWeight(equalWeight + remainder);
    setAbVariations(newVariations.map((v) => ({ ...v, weight: equalWeight })));
  };

  const handleRemoveVariation = (index: number) => {
    const newVariations = abVariations.filter((_, i) => i !== index);
    const count = 1 + newVariations.length;
    const equalWeight = Math.floor(100 / count);
    const remainder = 100 - equalWeight * count;
    setMainWeight(newVariations.length === 0 ? 100 : equalWeight + remainder);
    setAbVariations(newVariations.map((v) => ({ ...v, weight: equalWeight })));
  };

  const handleAutoBalance = () => {
    const count = 1 + abVariations.length;
    const equalWeight = Math.floor(100 / count);
    const remainder = 100 - equalWeight * count;
    setMainWeight(equalWeight + remainder);
    setAbVariations(abVariations.map((v) => ({ ...v, weight: equalWeight })));
    showToast.success("Pourcentages équilibrés automatiquement !");
  };

  // Compute final generated URL with UTM without hardcoding dummy targets
  const computeFinalUrlWithUtm = () => {
    const base = targetUrl.trim();
    if (!base) return "";
    const withProto = /^https?:\/\//i.test(base) ? base : `https://${base}`;
    try {
      const urlObj = new URL(withProto);
      if (utmSource.trim())
        urlObj.searchParams.set("utm_source", utmSource.trim());
      if (utmMedium.trim())
        urlObj.searchParams.set("utm_medium", utmMedium.trim());
      if (utmCampaign.trim())
        urlObj.searchParams.set("utm_campaign", utmCampaign.trim());
      if (utmTerm.trim()) urlObj.searchParams.set("utm_term", utmTerm.trim());
      if (utmContent.trim())
        urlObj.searchParams.set("utm_content", utmContent.trim());
      return urlObj.toString();
    } catch {
      return withProto;
    }
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);

    const errors: Record<string, string> = {};
    const targetErr = checkUrlFormat(targetUrl, true);
    if (targetErr) errors.targetUrl = targetErr;

    const domainErr = checkDomainFormat(domainName);
    if (domainErr) errors.domainName = domainErr;

    const slugErr = checkSlugFormat(slug);
    if (slugErr) errors.slug = slugErr;

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
        const fbErr = checkUrlFormat(fallbackUrl, false);
        if (fbErr) errors.fallbackUrl = fbErr;
      }
    }

    if (abVariations.length > 0) {
      abVariations.forEach((v, idx) => {
        if (v.url && v.url.trim()) {
          const err = checkUrlFormat(v.url, false);
          if (err)
            errors[`abVariation_${idx}`] =
              `Variante ${String.fromCharCode(66 + idx)} : ${err}`;
        }
      });
      const totalWeight =
        mainWeight +
        abVariations.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);
      if (totalWeight !== 100) {
        errors.abTotal = `La somme des pourcentages doit être égale à 100% (actuellement ${totalWeight}%).`;
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (errors.targetUrl || errors.domainName || errors.slug) {
        setActiveTab("general");
      } else if (
        errors.password ||
        errors.expiresAt ||
        errors.maxClicks ||
        errors.fallbackUrl
      ) {
        setActiveTab("protection");
      } else if (
        errors.abTotal ||
        Object.keys(errors).some((k) => k.startsWith("abVariation_"))
      ) {
        setActiveTab("ab_testing");
      }
      showToast.error(
        "Certains champs obligatoires sont manquants ou invalides.",
      );
      return;
    }

    setIsSubmitting(true);

    // Prepare UTM parameters on targetUrl
    let finalTargetUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(finalTargetUrl)) {
      finalTargetUrl = `https://${finalTargetUrl}`;
    }

    try {
      const urlObj = new URL(finalTargetUrl);
      if (utmSource.trim())
        urlObj.searchParams.set("utm_source", utmSource.trim());
      if (utmMedium.trim())
        urlObj.searchParams.set("utm_medium", utmMedium.trim());
      if (utmCampaign.trim())
        urlObj.searchParams.set("utm_campaign", utmCampaign.trim());
      if (utmTerm.trim()) urlObj.searchParams.set("utm_term", utmTerm.trim());
      if (utmContent.trim())
        urlObj.searchParams.set("utm_content", utmContent.trim());
      finalTargetUrl = urlObj.toString();
    } catch {}

    // Compile routing rules
    const {
      geoTargeting,
      deviceTargeting,
      routingRules: compiledRules,
    } = compileRoutingRules(routingRules);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // Freemium plan security checks
    if (!isProPlan) {
      if (password) {
        triggerPlanUpgrade({
          reason: "La protection par mot de passe requiert le forfait Pro.",
          featureName: "Protection Mot de Passe",
        });
        setIsSubmitting(false);
        return;
      }
      if (isCloaked) {
        triggerPlanUpgrade({
          reason: "Le masquage d'URL (Cloaking) requiert le forfait Pro.",
          featureName: "Cloaking d'URL",
        });
        setIsSubmitting(false);
        return;
      }
    }

    const cleanDomain = domainName
      .trim()
      .toLowerCase()
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "");
    const cleanSlug = slug.trim();

    try {
      let finalOgImage = ogImage;
      if (ogImage && ogImage.startsWith("data:")) {
        const uploadRes = await cfUploadImage(ogImage, "Banners");
        if (uploadRes?.url) {
          finalOgImage = uploadRes.url;
        }
      }

      if (isEditMode && link) {
        // UPDATE EXISTING LINK
        const updates: any = {
          userId: userId || link.userId,
          targetUrl: finalTargetUrl,
          slug: cleanSlug || link.slug,
          domainName: cleanDomain || link.domainName,
          isActive: Boolean(isActive),
          is_active: isActive ? 1 : 0,
          tags: tags.length ? tags : null,
          ogTitle: ogTitle.trim() || null,
          metaTitle: ogTitle.trim() || null,
          ogDescription: ogDescription.trim() || null,
          ogImage: finalOgImage.trim() || null,
          previousOgImage: link.ogImage || null,
          routingRules: compiledRules || null,
          geoTargeting: geoTargeting || null,
          deviceTargeting: deviceTargeting || null,
          isCloaked: isProPlan ? isCloaked : false,
          hideReferrer,
          expiresAt:
            isProPlan && expiresAt ? new Date(expiresAt).toISOString() : null,
          maxClicks:
            isProPlan && hasClickLimit && maxClicks ? Number(maxClicks) : null,
          max_clicks:
            isProPlan && hasClickLimit && maxClicks ? Number(maxClicks) : null,
          fallbackUrl:
            isProPlan && hasClickLimit && fallbackUrl.trim()
              ? fallbackUrl.trim()
              : null,
          fallback_url:
            isProPlan && hasClickLimit && fallbackUrl.trim()
              ? fallbackUrl.trim()
              : null,
          abVariations: abVariations.filter((v) => v.url && v.url.trim()),
          ab_variations: abVariations.filter((v) => v.url && v.url.trim()),
          mainWeight:
            typeof mainWeight === "number" && !isNaN(mainWeight)
              ? mainWeight
              : abVariations.length > 0
                ? 50
                : 100,
          main_weight:
            typeof mainWeight === "number" && !isNaN(mainWeight)
              ? mainWeight
              : abVariations.length > 0
                ? 50
                : 100,
          redirectType,
          redirect_type: redirectType,
          passParams: Boolean(passParams),
          pass_params: Boolean(passParams),
        };

        if (password !== undefined) {
          updates.password = password ? password.trim() : null;
        }

        await cfUpdateLink(link.id, updates);

        const updatedShortLink: ShortLink = {
          ...link,
          targetUrl: updates.targetUrl,
          slug: updates.slug,
          domainName: updates.domainName,
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
          password: password ? password.trim() : undefined,
          isPasswordProtected: Boolean(password && password.trim()),
          abVariations: updates.abVariations,
          mainWeight: updates.mainWeight,
          redirectType: updates.redirectType,
          passParams: updates.passParams,
        };

        cfInvalidateCache();
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("lshorter_links_updated", {
              detail: updatedShortLink,
            }),
          );
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
      } else {
        // CREATE NEW LINK (Strict: cleanSlug and cleanDomain entered by user)
        let createdLink: ShortLink = {
          id: `link_${Date.now()}`,
          userId,
          slug: cleanSlug,
          domainName: cleanDomain,
          shortUrl: `https://${cleanDomain}/${cleanSlug}`,
          targetUrl: finalTargetUrl,
          clicksCount: 0,
          uniqueClicks: 0,
          conversionsCount: 0,
          revenue: 0,
          routingRules: compiledRules,
          geoTargeting,
          deviceTargeting,
          isCloaked: Boolean(isCloaked),
          metaTitle: ogTitle || undefined,
          hideReferrer,
          isPasswordProtected: Boolean(password.trim()),
          password: password.trim() || undefined,
          maxClicks: hasClickLimit && maxClicks ? Number(maxClicks) : undefined,
          fallbackUrl:
            hasClickLimit && fallbackUrl.trim()
              ? fallbackUrl.trim()
              : undefined,
          tags: tags.length ? tags : undefined,
          expiresAt: expiresAt ? expiresAt : undefined,
          isActive: true,
          created_at: new Date().toISOString(),
          abVariations: abVariations.filter((v) => v.url && v.url.trim()),
          mainWeight:
            typeof mainWeight === "number" && !isNaN(mainWeight)
              ? mainWeight
              : abVariations.length > 0
                ? 50
                : 100,
          redirectType,
          passParams: Boolean(passParams),
        };

        const res = await cfCreateLink({
          userId,
          userEmail: session?.user?.email || undefined,
          userName: session?.user?.name || undefined,
          userPlan,
          plan: userPlan,
          domainName: cleanDomain,
          slug: cleanSlug,
          targetUrl: finalTargetUrl,
          geoTargeting,
          deviceTargeting,
          routingRules: compiledRules,
          password: password.trim() || undefined,
          isCloaked: Boolean(isCloaked),
          hideReferrer,
          metaTitle: ogTitle || undefined,
          ogTitle: ogTitle || undefined,
          ogDescription: ogDescription || undefined,
          ogImage: finalOgImage || undefined,
          tags: tags.length ? tags : undefined,
          expiresAt: expiresAt ? expiresAt : undefined,
          maxClicks: hasClickLimit && maxClicks ? Number(maxClicks) : undefined,
          fallbackUrl:
            hasClickLimit && fallbackUrl.trim()
              ? fallbackUrl.trim()
              : undefined,
          abVariations: abVariations.filter((v) => v.url && v.url.trim()),
          mainWeight:
            typeof mainWeight === "number" && !isNaN(mainWeight)
              ? mainWeight
              : abVariations.length > 0
                ? 50
                : 100,
          redirectType,
          passParams: Boolean(passParams),
        });

        if (res?.data) {
          createdLink = {
            ...createdLink,
            id: res.data.id || createdLink.id,
            shortUrl: res.data.short_url || createdLink.shortUrl,
            slug: res.data.slug || createdLink.slug,
            domainName:
              res.data.domain_name || res.data.domainName || cleanDomain,
            ogImage:
              res.data.og_image ||
              res.data.ogImage ||
              finalOgImage ||
              undefined,
            ogTitle:
              res.data.og_title || res.data.ogTitle || ogTitle || undefined,
            ogDescription:
              res.data.og_description ||
              res.data.ogDescription ||
              ogDescription ||
              undefined,
            metaTitle:
              res.data.meta_title || res.data.metaTitle || ogTitle || undefined,
          };
        }

        cfInvalidateCache();
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("lshorter_links_updated", { detail: createdLink }),
          );
          window.dispatchEvent(new Event("lshorter_data_change"));
        }

        confetti({
          particleCount: 70,
          spread: 80,
          origin: { y: 0.6 },
        });

        showToast.success(
          `Lien https://${cleanDomain}/${cleanSlug} créé avec succès !`,
        );
        setIsSubmitting(false);
        if (onSuccess) onSuccess(createdLink);
        onClose();
      }
    } catch (err: any) {
      const msg: string = err?.message || "";
      setIsSubmitting(false);
      if (
        msg.includes("403") ||
        msg.toLowerCase().includes("plan_upgrade_required") ||
        msg.toLowerCase().includes("forbidden") ||
        msg.toLowerCase().includes("pro plan")
      ) {
        triggerPlanUpgrade({
          reason: "Cette fonctionnalité requiert le forfait PRO ou supérieur.",
          featureName: "Options Avancées & Sécurité PRO",
          targetPlan: "PRO",
        });
        return;
      }
      showToast.error(sanitizeClientError(msg));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop overlay */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/65 backdrop-blur-[4px] transition-opacity duration-300 animate-in fade-in"
      />

      {/* Drawer sliding panel */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-full flex-col bg-[#141416] dark:bg-[#141416] text-white border-l border-[#27272a] shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-right",
          "w-full sm:max-w-xl md:max-w-2xl lg:max-w-[700px] max-sm:w-screen max-sm:max-w-[100vw]",
        )}
      >
        {/* ── STICKY HEADER ── */}
        <div className="flex flex-col border-b border-[#222225] bg-[#141416] dark:bg-[#141416] px-4 sm:px-6 pt-4 shrink-0 sticky top-0 z-20">
          {/* Header Title Row */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-[8px] bg-[#ff6600] max-sm:bg-blue-600 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-[#ff6600]/25 max-sm:shadow-blue-500/25 shrink-0">
                {isEditMode ? (
                  <Sliders className="w-4 h-4" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-white tracking-tight leading-tight truncate">
                  {isEditMode ? "Modifier le Lien" : "Créer un Nouveau Lien"}
                </h2>
                <p className="text-[11px] text-neutral-400 leading-tight truncate">
                  {isEditMode
                    ? `Modifier la redirection pour /${slug || link?.slug || ""}`
                    : "Configurez votre redirection courte"}
                </p>
              </div>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* ── INPUTS PRINCIPAUX : URL, DOMAINE, SLUG (Dans le sticky header, remplace la carte barrée) ── */}
          <div className="bg-[#1a1a1e]/80 border border-[#27272a] rounded-[12px] p-3 sm:p-3.5 mb-3 flex flex-col gap-3">
            {/* Champ 1 : URL de destination (pleine largeur) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-300">
                  URL de destination{" "}
                  <span className="text-[#ff6600] max-sm:text-blue-500">*</span>
                </label>
                <span className="text-[10px] text-neutral-500 italic">
                  Obligatoire
                </span>
              </div>
              <Input
                required
                placeholder="https://mon-site-web.com/page..."
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
                  "bg-[#141416] border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-9 sm:h-10 rounded-[8px] font-mono",
                  fieldErrors.targetUrl && "border-red-500/60 bg-red-500/5",
                )}
              />
              <FieldErrorAlert message={fieldErrors.targetUrl} />
              <p className="text-[10px] text-neutral-400 mt-1">
                Les visiteurs seront instantanément redirigés vers cette
                adresse.
              </p>
            </div>

            {/* Champs 2 & 3 : Domaine (select) + Slug, en grille 2 colonnes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Nom de Domaine — Select Dropdown */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Nom de Domaine{" "}
                  <span className="text-[#ff6600] max-sm:text-blue-500">*</span>
                </label>
                <div className="relative">
                  <select
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
                      "w-full appearance-none bg-[#141416] border border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-9 sm:h-10 pl-3 pr-8 rounded-[8px] font-mono transition-colors cursor-pointer outline-none",
                      isEditMode && "opacity-60 cursor-not-allowed",
                      fieldErrors.domainName &&
                        "border-red-500/60 bg-red-500/5",
                    )}
                  >
                    {!isEditMode && !domainName && (
                      <option value="" disabled>
                        Choisir un domaine...
                      </option>
                    )}
                    {/* Domaines personnalisés de l'utilisateur */}
                    {customDomains.length > 0 &&
                      customDomains.map((cd) => (
                        <option
                          key={cd.id}
                          value={cd.domain}
                          className="bg-[#141416] text-white"
                        >
                          {cd.domain}
                        </option>
                      ))}
                    {/* Si aucun domaine custom, afficher le domaine par défaut lsho.cc */}
                    {customDomains.length === 0 && (
                      <option
                        value="lsho.cc"
                        className="bg-[#141416] text-white"
                      >
                        lsho.cc (Officiel)
                      </option>
                    )}
                    {/* En mode édition, s'assurer que le domaine actuel est affiché même s'il n'est pas dans customDomains */}
                    {isEditMode &&
                      domainName &&
                      !customDomains.find((cd) => cd.domain === domainName) && (
                        <option
                          value={domainName}
                          className="bg-[#141416] text-white"
                        >
                          {domainName}
                        </option>
                      )}
                  </select>
                  {/* Chevron custom */}
                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-400">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </div>
                </div>
                <FieldErrorAlert message={fieldErrors.domainName} />
              </div>

              {/* Slug personnalisé */}
              <div>
                <label className="block text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-1">
                  Slug personnalisé{" "}
                  <span className="text-[#ff6600] max-sm:text-blue-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono select-none">
                    /
                  </span>
                  <Input
                    required
                    placeholder="ex: mon-lien-court"
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
                      "pl-6 bg-[#141416] border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-9 sm:h-10 rounded-[8px] font-mono",
                      fieldErrors.slug && "border-red-500/60 bg-red-500/5",
                    )}
                  />
                </div>
                <FieldErrorAlert message={fieldErrors.slug} />
                {(domainName || slug) && (
                  <p className="text-[10px] text-neutral-400 mt-1 font-mono">
                    <span className="text-[#ff6600] max-sm:text-blue-400 font-bold">
                      {domainName || "..."}/{slug || "..."}
                    </span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* ── 7 HORIZONTAL TABS ── */}
          <div
            className="drawer-tabs-scroll flex items-center gap-1 overflow-x-auto pb-1 -mb-[1px]"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(255,102,0,0.6) transparent",
            }}
          >
            {[
              { id: "general", label: "Général", icon: Settings2 },
              { id: "social", label: "Social Preview", icon: ImageIcon },
              { id: "tracking", label: "Tracking & UTM", icon: Tag },
              { id: "routing", label: "Routing (Règles)", icon: Globe2 },
              { id: "protection", label: "Protection & Expiry", icon: Shield },
              { id: "ab_testing", label: "A/B Testing", icon: Split },
              { id: "advanced", label: "Avancé", icon: Sliders },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActiveTab = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    "px-3 py-2 text-xs font-semibold whitespace-nowrap transition-all border-b-2 flex items-center gap-1.5 cursor-pointer shrink-0",
                    isActiveTab
                      ? "text-[#ff6600] max-sm:text-blue-500 border-[#ff6600] max-sm:border-blue-500 font-bold bg-[#ff6600]/5 max-sm:bg-blue-500/5 rounded-t-[6px]"
                      : "text-neutral-400 hover:text-white border-transparent hover:border-neutral-700",
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── SCROLLABLE BODY ── */}
        <form
          id="link-drawer-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 flex flex-col gap-5"
        >
          {/* ────────── TAB 1: GÉNÉRAL ────────── */}
          {activeTab === "general" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              {/* Info : champs déplacés en haut */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-[8px] bg-white/5 border border-white/5 text-[11px] text-neutral-400">
                <span>💡</span>
                <span>
                  L'URL cible, le domaine et le slug sont épinglés en haut du
                  volet et restent modifiables à tout moment.
                </span>
              </div>

              {/* Link Status Toggle */}
              <div className="p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-3 h-3 rounded-full shrink-0 animate-pulse",
                      isActive ? "bg-emerald-500" : "bg-amber-500",
                    )}
                  />
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {isActive
                        ? "Lien Actif (Redirige les visiteurs)"
                        : "Lien en Pause"}
                    </span>
                    <span className="text-[11px] text-neutral-400 block">
                      {isActive
                        ? "Le lien fonctionne normalement et effectue la redirection."
                        : "Les visiteurs sont redirigés vers la page d'information 'Lien en pause'."}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsActive((prev) => !prev)}
                  className={cn(
                    "px-3 py-1.5 rounded-[8px] text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5",
                    isActive
                      ? "bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20",
                  )}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isActive ? "Mettre en pause" : "Réactiver"}</span>
                </button>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Tags (séparés par des virgules)
                </label>
                <Input
                  placeholder="tag1, tag2..."
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  className="bg-[#1a1a1e] border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-10 rounded-[10px]"
                />
                <p className="text-[11px] text-neutral-400 mt-1">
                  Facilite le tri et la recherche dans votre liste de liens.
                </p>
              </div>
            </div>
          )}

          {/* ────────── TAB 2: SOCIAL PREVIEW ────────── */}
          {activeTab === "social" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Titre Open Graph (OG Title)
                </label>
                <Input
                  placeholder="Titre affiché lors du partage sur les réseaux"
                  value={ogTitle}
                  onChange={(e) => setOgTitle(e.target.value)}
                  className="bg-[#1a1a1e] border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-10 rounded-[10px]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Description Open Graph (OG Description)
                </label>
                <textarea
                  rows={2}
                  placeholder="Courte description optimisée..."
                  value={ogDescription}
                  onChange={(e) => setOgDescription(e.target.value)}
                  className="w-full bg-[#1a1a1e] border border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs p-3 rounded-[10px] outline-none resize-none transition-all"
                />
              </div>

              {/* Banner Upload */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Bannière Open Graph (Image)
                </label>
                <div className="flex flex-col sm:flex-row gap-2.5 items-center">
                  <Input
                    placeholder="URL d'image ou téléversement local"
                    value={ogImage}
                    onChange={(e) => {
                      setOgImage(e.target.value);
                      setPreviewImage(e.target.value);
                    }}
                    className="bg-[#1a1a1e] border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-10 rounded-[10px] flex-1"
                  />
                  <input
                    ref={bannerInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBannerUpload}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isUploadingImage}
                    onClick={() => bannerInputRef.current?.click()}
                    className="bg-[#1a1a1e] border-[#27272a] hover:bg-white/5 text-xs h-10 rounded-[10px] shrink-0 gap-1.5 cursor-pointer w-full sm:w-auto"
                  >
                    {isUploadingImage ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-[#ff6600] max-sm:text-blue-500" />
                    ) : (
                      <Upload className="w-3.5 h-3.5" />
                    )}
                    <span>Téléverser</span>
                  </Button>
                  {(ogImage || previewImage) && (
                    <Button
                      type="button"
                      variant="outline"
                      disabled={isUploadingImage}
                      onClick={() => {
                        setOgImage("");
                        setPreviewImage("");
                      }}
                      className="bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs h-10 rounded-[10px] shrink-0 gap-1.5 cursor-pointer px-3"
                      title="Supprimer la bannière"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Social Card Live Preview */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-400 mb-2">
                  Aperçu de la carte sur les réseaux
                </label>
                <div className="rounded-[10px] overflow-hidden border border-[#27272a] bg-[#1a1a1e]">
                  <div className="h-44 bg-[#141416] relative flex items-center justify-center overflow-hidden border-b border-[#27272a]">
                    {previewImage || ogImage ? (
                      <img
                        src={previewImage || ogImage}
                        alt="OG Preview"
                        className="w-full h-full object-cover"
                        onError={() => setPreviewImage("")}
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1.5 text-neutral-500">
                        <ImageIcon className="w-8 h-8 stroke-1" />
                        <span className="text-[11px]">
                          Aucune image sélectionnée (1200x630 recommandé)
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3.5">
                    <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider block">
                      {domainName.trim() || "domaine.com"}
                    </span>
                    <h4 className="text-sm font-bold text-white leading-tight mt-1 truncate">
                      {ogTitle || (
                        <span className="text-neutral-500 font-normal italic">
                          Titre du lien (vide)
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                      {ogDescription || (
                        <span className="text-neutral-500 italic">
                          Aucune description renseignée
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ────────── TAB 3: TRACKING & UTM ────────── */}
          {activeTab === "tracking" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                  Source de campagne (utm_source)
                </label>
                <Input
                  placeholder="ex: newsletter, twitter, google..."
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  className="bg-[#1a1a1e] border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-10 rounded-[10px]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Support (utm_medium)
                  </label>
                  <Input
                    placeholder="ex: cpc, email, social..."
                    value={utmMedium}
                    onChange={(e) => setUtmMedium(e.target.value)}
                    className="bg-[#1a1a1e] border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-10 rounded-[10px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Nom de campagne (utm_campaign)
                  </label>
                  <Input
                    placeholder="ex: promo_ete, lancement..."
                    value={utmCampaign}
                    onChange={(e) => setUtmCampaign(e.target.value)}
                    className="bg-[#1a1a1e] border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-10 rounded-[10px]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Terme / Mot-clé (utm_term)
                  </label>
                  <Input
                    placeholder="ex: mot_cle..."
                    value={utmTerm}
                    onChange={(e) => setUtmTerm(e.target.value)}
                    className="bg-[#1a1a1e] border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-10 rounded-[10px]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-1.5">
                    Contenu (utm_content)
                  </label>
                  <Input
                    placeholder="ex: bouton_cta, banniere_top..."
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                    className="bg-[#1a1a1e] border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-10 rounded-[10px]"
                  />
                </div>
              </div>

              {/* Real-time Computed URL */}
              <div className="p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">
                  Aperçu de l'URL finale avec paramètres UTM
                </span>
                {computeFinalUrlWithUtm() ? (
                  <p className="text-xs font-mono text-[#ff6600] max-sm:text-blue-400 break-all leading-relaxed">
                    {computeFinalUrlWithUtm()}
                  </p>
                ) : (
                  <p className="text-xs text-neutral-500 italic leading-relaxed">
                    Entrez une URL de destination pour prévisualiser l'URL
                    finale avec les paramètres UTM.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ────────── TAB 4: ROUTING (RÈGLES) ────────── */}
          {activeTab === "routing" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <RoutingRulesEditor
                rules={routingRules}
                onChange={setRoutingRules}
                userPlan={userPlan as any}
              />
            </div>
          )}

          {/* ────────── TAB 5: PROTECTION & EXPIRY ────────── */}
          {activeTab === "protection" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              {/* 1. Masquage du Referrer (Accessible à tous) */}
              <div className="p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Masquer le référent (no-referrer)
                  </span>
                  <span className="text-[11px] text-neutral-400 block">
                    Empêche le site de destination d'identifier le domaine
                    source d'où provient le clic.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setHideReferrer((prev) => !prev)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
                    hideReferrer
                      ? "bg-[#ff6600] max-sm:bg-blue-600"
                      : "bg-neutral-800",
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform overflow-x-hidden",
                      hideReferrer ? "translate-x-1" : "-translate-x-5",
                    )}
                  />
                </button>
              </div>

              {/* 2. Masquage d'URL / Cloaking (PRO) */}
              <LockedProFeature
                title="Masquage d'URL (Cloaking)"
                description="Conserve votre nom de domaine court affiché dans la barre d'adresse sans révéler la cible."
                isUnlocked={isProPlan}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <span className="text-xs font-bold text-white block">
                      Masquage d'URL (Cloaking)
                    </span>
                    <span className="text-[11px] text-neutral-400 block">
                      Affiche la page de destination dans une iframe plein écran
                      transparente.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => isProPlan && setIsCloaked((prev) => !prev)}
                    className={cn(
                      "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
                      isCloaked
                        ? "bg-[#ff6600] max-sm:bg-blue-600"
                        : "bg-neutral-800",
                    )}
                  >
                    <span
                      className={cn(
                        "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                        isCloaked ? "translate-x-1" : "-translate-x-5",
                      )}
                    />
                  </button>
                </div>
              </LockedProFeature>

              {/* 3. Mot de Passe de Protection (PRO) */}
              <LockedProFeature
                title="Protection par Mot de Passe"
                description="Exige la saisie d'un mot de passe secret avant d'accéder au lien."
                isUnlocked={isProPlan}
              >
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Mot de passe de protection
                      </span>
                      <span className="text-[11px] text-neutral-400 block">
                        Les visiteurs devront valider ce mot de passe sur la
                        page de sécurité.
                      </span>
                    </div>
                  </div>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mot de passe secret (min. 4 caractères)"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          setFieldErrors((prev) => ({
                            ...prev,
                            password: checkPasswordFormat(e.target.value),
                          }));
                        }
                      }}
                      className={cn(
                        "bg-[#141416] border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-10 rounded-[10px] pr-10",
                        fieldErrors.password &&
                          "border-red-500/60 bg-red-500/5",
                      )}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  <FieldErrorAlert message={fieldErrors.password} />
                </div>
              </LockedProFeature>

              {/* 4. Limite de Clics / Quota (PRO) */}
              <LockedProFeature
                title="Limiter le Nombre d'Accès"
                description="Redirige vers une URL alternative une fois le quota de clics atteint."
                isUnlocked={isProPlan}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <span className="text-xs font-bold text-white block">
                        Limiter le nombre d'accès
                      </span>
                      <span className="text-[11px] text-neutral-400 block">
                        Désactive ou déroute le lien après un seuil précis.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        isProPlan && setHasClickLimit((prev) => !prev)
                      }
                      className={cn(
                        "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
                        hasClickLimit
                          ? "bg-[#ff6600] max-sm:bg-blue-600"
                          : "bg-neutral-800",
                      )}
                    >
                      <span
                        className={cn(
                          "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                          hasClickLimit ? "translate-x-1" : "-translate-x-5",
                        )}
                      />
                    </button>
                  </div>

                  {hasClickLimit && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#27272a]">
                      <div>
                        <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                          Plafond de clics
                        </label>
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setMaxClicks((prev) =>
                                Math.max(1, (Number(prev) || 0) - 10),
                              )
                            }
                            className="h-9 px-2.5 bg-[#141416] border-[#27272a] text-xs font-bold"
                          >
                            -10
                          </Button>
                          <Input
                            type="number"
                            min="1"
                            placeholder="50"
                            value={maxClicks}
                            onChange={(e) => setMaxClicks(e.target.value)}
                            className="bg-[#141416] border-[#27272a] text-center text-xs h-9 rounded-[8px] font-mono"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setMaxClicks((prev) => (Number(prev) || 0) + 10)
                            }
                            className="h-9 px-2.5 bg-[#141416] border-[#27272a] text-xs font-bold"
                          >
                            +10
                          </Button>
                        </div>
                        <FieldErrorAlert message={fieldErrors.maxClicks} />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-neutral-300 mb-1">
                          URL de repli (optionnel)
                        </label>
                        <Input
                          placeholder="https://..."
                          value={fallbackUrl}
                          onChange={(e) => setFallbackUrl(e.target.value)}
                          className="bg-[#141416] border-[#27272a] text-xs h-9 rounded-[8px]"
                        />
                        <FieldErrorAlert message={fieldErrors.fallbackUrl} />
                      </div>
                    </div>
                  )}
                </div>
              </LockedProFeature>

              {/* 5. Date d'Expiration Automatique (PRO) */}
              <LockedProFeature
                title="Expiration Automatique"
                description="Programmez la fin de validité du lien à une date et heure précises."
                isUnlocked={isProPlan}
              >
                <div className="flex flex-col gap-2">
                  <label className="block text-xs font-bold text-white">
                    Date &amp; Heure d'expiration
                  </label>
                  <Input
                    type="datetime-local"
                    value={expiresAt}
                    onChange={(e) => {
                      setExpiresAt(e.target.value);
                      if (fieldErrors.expiresAt) {
                        setFieldErrors((prev) => ({
                          ...prev,
                          expiresAt: checkExpiresAtFormat(e.target.value),
                        }));
                      }
                    }}
                    className={cn(
                      "bg-[#141416] border-[#27272a] focus:border-[#ff6600] max-sm:focus:border-blue-500 text-white text-xs h-10 rounded-[10px] [color-scheme:dark]",
                      fieldErrors.expiresAt && "border-red-500/60 bg-red-500/5",
                    )}
                  />
                  <FieldErrorAlert message={fieldErrors.expiresAt} />
                  <p className="text-[11px] text-neutral-400">
                    Après cette date, les clics seront redirigés vers la page
                    d'information "Lien expiré".
                  </p>
                </div>
              </LockedProFeature>
            </div>
          )}

          {/* ────────── TAB 6: A/B TESTING ────────── */}
          {activeTab === "ab_testing" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                    Répartition du Trafic A/B
                  </h4>
                  <p className="text-[11px] text-neutral-400">
                    Distribuez les visiteurs entre l'URL principale et vos
                    variantes alternatives.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddVariation}
                  className="bg-[#1a1a1e] border-[#27272a] hover:bg-white/5 text-xs h-8 rounded-[8px] gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#ff6600] max-sm:text-blue-500" />
                  <span>Ajouter Variante</span>
                </Button>
              </div>

              {/* Variant A (Main Link) */}
              <div className="p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#ff6600]/40 max-sm:border-blue-500/40 flex flex-col gap-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#ff6600] max-sm:text-blue-400">
                    Variante A (Principale)
                  </span>
                  <span className="text-xs font-mono font-bold text-[#ff6600] max-sm:text-blue-400">
                    {mainWeight}%
                  </span>
                </div>
                <div
                  className={cn(
                    "text-xs font-mono truncate bg-[#141416] px-3 py-2 rounded-[8px] border border-[#27272a]",
                    targetUrl.trim()
                      ? "text-neutral-300"
                      : "text-neutral-500 italic",
                  )}
                >
                  {targetUrl.trim() ||
                    "URL principale (définie dans l'onglet Général)"}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={mainWeight}
                    onChange={(e) => setMainWeight(Number(e.target.value))}
                    className="flex-1 accent-[#ff6600] max-sm:accent-blue-500 cursor-pointer"
                  />
                  <div className="w-20 h-2 bg-neutral-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#ff6600] max-sm:bg-blue-500 transition-all"
                      style={{ width: `${mainWeight}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Variants (B, C, D...) */}
              {abVariations.length === 0 ? (
                <div className="p-6 rounded-[10px] border border-dashed border-[#27272a] bg-[#1a1a1e]/50 text-center flex flex-col items-center justify-center gap-2">
                  <Split className="w-6 h-6 text-neutral-500" />
                  <p className="text-xs text-neutral-400">
                    Aucune variante alternative configurée. 100% du trafic
                    pointe vers l'URL principale.
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddVariation}
                    className="bg-[#1a1a1e] border-[#27272a] hover:bg-white/5 text-xs h-8 rounded-[8px] gap-1 cursor-pointer mt-1"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#ff6600] max-sm:text-blue-500" />
                    <span>Créer une variante B</span>
                  </Button>
                </div>
              ) : (
                abVariations.map((variant, idx) => {
                  const label = `Variante ${String.fromCharCode(66 + idx)}`;
                  const err = fieldErrors[`abVariation_${idx}`];
                  return (
                    <div
                      key={idx}
                      className="p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-white">
                          {label}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-white">
                            {variant.weight}%
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariation(idx)}
                            className="text-neutral-400 hover:text-red-400 transition-colors p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <Input
                        placeholder="https://..."
                        value={variant.url}
                        onChange={(e) => {
                          const next = [...abVariations];
                          next[idx].url = e.target.value;
                          setAbVariations(next);
                        }}
                        className={cn(
                          "bg-[#141416] border-[#27272a] text-xs h-9 rounded-[8px]",
                          err && "border-red-500/60 bg-red-500/5",
                        )}
                      />
                      <FieldErrorAlert message={err} />

                      <div className="flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={variant.weight}
                          onChange={(e) => {
                            const next = [...abVariations];
                            next[idx].weight = Number(e.target.value);
                            setAbVariations(next);
                          }}
                          className="flex-1 accent-neutral-400 cursor-pointer"
                        />
                        <div className="w-20 h-2 bg-neutral-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-neutral-400 transition-all"
                            style={{ width: `${variant.weight}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })
              )}

              {abVariations.length > 0 && (
                <div className="flex items-center justify-between gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAutoBalance}
                    className="bg-[#1a1a1e] border-[#27272a] hover:bg-white/5 text-xs h-8 rounded-[8px] gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-[#ff6600] max-sm:text-blue-500" />
                    <span>Équilibrer à 100%</span>
                  </Button>

                  {/* Total Weight Indicator */}
                  {(() => {
                    const total =
                      mainWeight +
                      abVariations.reduce(
                        (acc, v) => acc + (Number(v.weight) || 0),
                        0,
                      );
                    const isOk = total === 100;
                    return (
                      <span
                        className={cn(
                          "text-xs font-mono font-bold px-2.5 py-1 rounded-[6px] border",
                          isOk
                            ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                            : "bg-red-500/10 text-red-400 border-red-500/30 animate-pulse",
                        )}
                      >
                        Total : {total}% {isOk ? "✓" : "≠ 100%"}
                      </span>
                    );
                  })()}
                </div>
              )}
              <FieldErrorAlert message={fieldErrors.abTotal} />
            </div>
          )}

          {/* ────────── TAB 7: AVANCÉ ────────── */}
          {activeTab === "advanced" && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-neutral-300 mb-2">
                  Code de Redirection HTTP
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { code: "302", title: "302", desc: "Temp (Défaut)" },
                    { code: "301", title: "301", desc: "Perm (SEO)" },
                    { code: "307", title: "307", desc: "Strict" },
                  ].map((item) => {
                    const isSelected = redirectType === item.code;
                    return (
                      <button
                        key={item.code}
                        type="button"
                        onClick={() => setRedirectType(item.code as any)}
                        className={cn(
                          "p-3 rounded-[10px] border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer text-center",
                          isSelected
                            ? "bg-[#ff6600] max-sm:bg-blue-600 text-white border-[#ff6600] max-sm:border-blue-600 shadow-md shadow-[#ff6600]/25 max-sm:shadow-blue-500/25"
                            : "bg-[#1a1a1e] border-[#27272a] text-neutral-300 hover:border-neutral-600",
                        )}
                      >
                        <span className="text-base font-extrabold">
                          {item.title}
                        </span>
                        <span className="text-[10px] opacity-80">
                          {item.desc}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="p-3 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] mt-2 text-[11px] text-neutral-400 leading-relaxed">
                  {redirectType === "302" && (
                    <>
                      💡 <strong>302 Temporaire (Recommandé)</strong> : Permet
                      de compter avec exactitude chaque clic et chaque visiteur
                      sur votre tableau de bord, sans mise en cache navigateur
                      trop agressive.
                    </>
                  )}
                  {redirectType === "301" && (
                    <>
                      💡 <strong>301 Permanent (SEO)</strong> : Transmet
                      l'autorité SEO à la page cible. Attention : les
                      navigateurs mettent cette redirection en cache local,
                      certains clics répétés peuvent ne pas être comptabilisés.
                    </>
                  )}
                  {redirectType === "307" && (
                    <>
                      💡 <strong>307 Temporaire Strict</strong> : Garantit la
                      préservation exacte de la méthode HTTP (ex: POST, PUT)
                      lors de la redirection. Idéal pour les webhooks et appels
                      API.
                    </>
                  )}
                </div>
              </div>

              {/* Forward Query Params Toggle */}
              <div className="p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-bold text-white block">
                    Transmettre les paramètres d'URL (Query Parameters)
                  </span>
                  <span className="text-[11px] text-neutral-400 block">
                    Transfère automatiquement les paramètres de requête reçus
                    (ex: <code>?ref=...</code>) vers la page de destination.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setPassParams((prev) => !prev)}
                  className={cn(
                    "w-11 h-6 rounded-full transition-colors relative cursor-pointer shrink-0",
                    passParams
                      ? "bg-[#ff6600] max-sm:bg-blue-600"
                      : "bg-neutral-800",
                  )}
                >
                  <span
                    className={cn(
                      "w-4 h-4 rounded-full bg-white absolute top-1 transition-transform",
                      passParams ? "translate-x-1" : "-translate-x-5",
                    )}
                  />
                </button>
              </div>

              {/* Documentation helper link */}
              <div className="p-3 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] flex items-center justify-between">
                <span className="text-xs text-neutral-400">
                  Besoin d'aide sur les redirections avancées ?
                </span>
                <a
                  href="/docs#advanced-redirects"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-bold text-[#ff6600] max-sm:text-blue-400 hover:underline flex items-center gap-1"
                >
                  <span>Voir la documentation</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          )}
        </form>

        {/* ── FOOTER ── */}
        <div className="flex items-center justify-end gap-2.5 border-t border-[#222225] bg-[#141416] dark:bg-[#141416] px-4 sm:px-6 py-3.5 shrink-0">
          <Button
            type="button"
            variant="outline"
            disabled={isSubmitting}
            onClick={onClose}
            className="bg-[#1a1a1e] border-[#27272a] hover:bg-white/5 text-xs h-9 rounded-[8px] px-4 cursor-pointer"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            form="link-drawer-form"
            disabled={isSubmitting}
            className="bg-[#ff6600] hover:bg-[#ff7711] max-sm:bg-blue-600 max-sm:hover:bg-blue-500 text-white font-bold text-xs h-9 rounded-[8px] px-5 shadow-lg shadow-[#ff6600]/25 max-sm:shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Enregistrement...</span>
              </>
            ) : (
              <span>
                {isEditMode ? "Enregistrer les modifications" : "Créer le lien"}
              </span>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
