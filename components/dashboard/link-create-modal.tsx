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
  Loader2
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cfCreateLink, cfGetDomains, cfUploadImage, cfNormalizeImageUrl, cfInvalidateCache } from "@/lib/cloudflare-api";
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

interface LinkCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (created: ShortLink) => void;
  initialUrl?: string;
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

export function LinkCreateModal({
  isOpen,
  onClose,
  onSuccess,
  initialUrl = ""
}: LinkCreateModalProps) {
  const { data: session } = useSession();
  const userId = session?.user?.id || "usr_anonymous";
  const convexUser = useQuery(api.users.getCurrentUser, userId && userId !== "usr_anonymous" ? { userId } : "skip");

  // Plan detection with fallback support
  const userPlan = (
    convexUser?.plan ||
    (session?.user as any)?.plan ||
    (typeof window !== "undefined" ? localStorage.getItem("lshorter_user_plan") : null) ||
    "FREEMIUM"
  ).toUpperCase();

  const isProPlan = userPlan === "PRO" || userPlan === "BUSINESS" || userPlan === "ENTERPRISE";

  const bannerInputRef = useRef<HTMLInputElement>(null);

  const DEFAULT_DOMAIN = "lsho.cc";

  // Base Info
  const [targetUrl, setTargetUrl] = useState(initialUrl || "");
  const [domainName, setDomainName] = useState("lsho.cc");
  const [slug, setSlug] = useState("");

  // Dynamic domain list from Cloudflare
  const [customDomains, setCustomDomains] = useState<Array<{ id: string; domain: string; status: string }>>([]);

  useEffect(() => {
    if (userId && userId !== "usr_anonymous" && isOpen) {
      cfGetDomains(userId)
        .then((res) => {
          const list = res?.data || [];
          setCustomDomains(list.map((d: any) => ({ id: d.id, domain: d.domain_name || d.domain, status: d.status })));
        })
        .catch(() => {});
    }
  }, [userId, isOpen]);

  // Tab State
  const [activeTab, setActiveTab] = useState<
    "social" | "tracking" | "routing" | "protection" | "ab_testing" | "advanced"
  >("social");

  // Social Preview
  const [ogTitle, setOgTitle] = useState("");
  const [ogDescription, setOgDescription] = useState("");
  const [ogImage, setOgImage] = useState("");
  const [previewImage, setPreviewImage] = useState("");

  // Tracking & UTM
  const [tagsInput, setTagsInput] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");

  // Advanced Routing Rules (All World Countries & Multi-Condition Logic)
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>([
    {
      id: "rule_default_1",
      title: "Règle 1",
      isCollapsed: false,
      conditions: [
        {
          id: "cond_1",
          type: "pays",
          operator: "est",
          value: "FR",
        },
      ],
      destinationUrl: "",
    },
  ]);

  // Protection & Expiry
  const [isCloaked, setIsCloaked] = useState(false);
  const [metaTitle, setMetaTitle] = useState("");
  const [hideReferrer, setHideReferrer] = useState(true);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [hasClickLimit, setHasClickLimit] = useState(false);
  const [maxClicks, setMaxClicks] = useState<number | string>(50);
  const [fallbackUrl, setFallbackUrl] = useState("");

  // A/B Testing
  const [mainWeight, setMainWeight] = useState<number>(50);
  const [abVariations, setAbVariations] = useState<Array<{ url: string; weight: number }>>([
    { url: "", weight: 50 }
  ]);

  const handleAddVariation = () => {
    if (abVariations.length >= 5) {
      showToast.error("Maximum 5 variantes autorisées.");
      return;
    }
    const newVariations = [...abVariations, { url: "", weight: 20 }];
    const count = 1 + newVariations.length;
    const equalWeight = Math.floor(100 / count);
    const remainder = 100 - (equalWeight * count);
    setMainWeight(equalWeight + remainder);
    setAbVariations(newVariations.map(v => ({ ...v, weight: equalWeight })));
  };

  const handleRemoveVariation = (index: number) => {
    const newVariations = abVariations.filter((_, i) => i !== index);
    const count = 1 + newVariations.length;
    const equalWeight = Math.floor(100 / count);
    const remainder = 100 - (equalWeight * count);
    setMainWeight(equalWeight + remainder);
    setAbVariations(newVariations.map(v => ({ ...v, weight: equalWeight })));
  };

  const handleAutoBalance = () => {
    const count = 1 + abVariations.length;
    const equalWeight = Math.floor(100 / count);
    const remainder = 100 - (equalWeight * count);
    setMainWeight(equalWeight + remainder);
    setAbVariations(abVariations.map(v => ({ ...v, weight: equalWeight })));
    showToast.success("Pourcentages équilibrés automatiquement !");
  };

  // Advanced
  const [redirectType, setRedirectType] = useState<"302" | "301" | "307">("302");
  const [passParams, setPassParams] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 8 * 1024 * 1024) {
      showToast.error("L'image ne doit pas dépasser 8 Mo.");
      return;
    }

    try {
      const localUrl = URL.createObjectURL(file);
      setPreviewImage(localUrl);
    } catch {}

    setIsUploadingImage(true);
    try {
      const res = await cfUploadImage(file);
      if (res?.url) {
        setOgImage(res.url);
        showToast.success("Bannière prête !");
      } else {
        const compressed = await compressImageFile(file, 1200, 630, 0.82);
        if (typeof compressed === "string") {
          setOgImage(compressed);
        } else {
          const reader = new FileReader();
          reader.onload = (event) => {
            setOgImage(event.target?.result as string);
          };
          reader.readAsDataURL(compressed as Blob);
        }
        showToast.success("Bannière importée !");
      }
    } catch (err) {
      console.error("Banner upload error:", err);
      showToast.error("Erreur lors de l'optimisation de l'image.");
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
      return "Le slug ne doit pas contenir d'espaces.";
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

  // Live validation on value changes
  useEffect(() => {
    if (!hasAttemptedSubmit && !targetUrl && !slug) return;
    const errors: Record<string, string> = {};

    if (hasAttemptedSubmit || targetUrl) {
      const targetErr = checkUrlFormat(targetUrl, true);
      if (targetErr) errors.targetUrl = targetErr;
    }

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

    if (abVariations.length > 0) {
      abVariations.forEach((v, idx) => {
        if (v.url && v.url.trim()) {
          const err = checkUrlFormat(v.url, false);
          if (err) errors[`abVariation_${idx}`] = `Variante ${String.fromCharCode(66 + idx)} : ${err}`;
        }
      });
      const totalWeight = mainWeight + abVariations.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);
      if (totalWeight !== 100) {
        errors.abTotal = `La somme des pourcentages de trafic doit être égale à 100% (actuellement ${totalWeight}%).`;
      }
    }

    setFieldErrors(errors);
  }, [targetUrl, slug, password, expiresAt, hasClickLimit, maxClicks, fallbackUrl, abVariations, mainWeight, hasAttemptedSubmit]);

  const hasProtectionErrors = Boolean(
    fieldErrors.password ||
    fieldErrors.expiresAt ||
    fieldErrors.maxClicks ||
    fieldErrors.fallbackUrl
  );

  const hasAbErrors = Boolean(
    fieldErrors.abTotal ||
    Object.keys(fieldErrors).some((k) => k.startsWith("abVariation_"))
  );

  if (!isOpen) return null;

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

    if (abVariations.length > 0) {
      abVariations.forEach((v, idx) => {
        if (v.url && v.url.trim()) {
          const err = checkUrlFormat(v.url, false);
          if (err) errors[`abVariation_${idx}`] = `Variante ${String.fromCharCode(66 + idx)} : ${err}`;
        }
      });
      const totalWeight = mainWeight + abVariations.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);
      if (totalWeight !== 100) {
        errors.abTotal = `La somme des pourcentages de trafic doit être égale à 100% (actuellement ${totalWeight}%).`;
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (errors.targetUrl || errors.slug) {
        // focus remains on main inputs
      } else if (errors.password || errors.expiresAt || errors.maxClicks || errors.fallbackUrl) {
        setActiveTab("protection");
      } else if (errors.abTotal || Object.keys(errors).some((k) => k.startsWith("abVariation_"))) {
        setActiveTab("ab_testing");
      }
      showToast.error("Certains champs ne respectent pas le format strict. Veuillez corriger les alertes en rouge.");
      return;
    }

    setIsSubmitting(true);

    // Prepare UTM parameters
    let finalTargetUrl = targetUrl.trim();
    if (!/^https?:\/\//i.test(finalTargetUrl)) {
      finalTargetUrl = `https://${finalTargetUrl}`;
    }

    try {
      const urlObj = new URL(finalTargetUrl);
      if (utmSource.trim()) urlObj.searchParams.set("utm_source", utmSource.trim());
      if (utmMedium.trim()) urlObj.searchParams.set("utm_medium", utmMedium.trim());
      if (utmCampaign.trim()) urlObj.searchParams.set("utm_campaign", utmCampaign.trim());
      if (utmTerm.trim()) urlObj.searchParams.set("utm_term", utmTerm.trim());
      if (utmContent.trim()) urlObj.searchParams.set("utm_content", utmContent.trim());
      finalTargetUrl = urlObj.toString();
    } catch {
      // Keep finalTargetUrl as is if invalid URL object
    }

    // Compile routing rules with comprehensive geo & device targeting
    const { geoTargeting, deviceTargeting, routingRules: compiledRules } = compileRoutingRules(routingRules);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    // Freemium plan guard verification
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

    let createdLink: ShortLink = {
      id: `link_${Date.now()}`,
      userId,
      slug: slug.trim() || Math.random().toString(36).substring(2, 8),
      domainName,
      shortUrl: `https://${domainName}/${slug.trim() || Math.random().toString(36).substring(2, 8)}`,
      targetUrl: finalTargetUrl,
      clicksCount: 0,
      uniqueClicks: 0,
      conversionsCount: 0,
      revenue: 0,
      routingRules: compiledRules,
      geoTargeting,
      deviceTargeting,
      isCloaked: Boolean(isCloaked),
      metaTitle: ogTitle || metaTitle || undefined,
      hideReferrer,
      password: password.trim() || undefined,
      tags: tags.length ? tags : undefined,
      expiresAt: expiresAt ? expiresAt : undefined,
      isActive: true,
      created_at: new Date().toISOString(),
    };

    try {
      let finalOgImage = ogImage;
      if (ogImage && ogImage.startsWith("data:")) {
        if (ogImage.length > 150000) {
          const uploadRes = await cfUploadImage(ogImage);
          if (uploadRes?.url) {
            finalOgImage = uploadRes.url;
          } else {
            finalOgImage = "";
          }
        }
      }

      const res = await cfCreateLink({
        userId,
        userEmail: session?.user?.email || undefined,
        userName: session?.user?.name || undefined,
        userPlan,
        plan: userPlan,
        domainName: domainName || undefined,
        slug: slug.trim() || undefined,
        targetUrl: finalTargetUrl,
        geoTargeting,
        deviceTargeting,
        routingRules: compiledRules,
        password: password.trim() || undefined,
        isCloaked: Boolean(isCloaked),
        hideReferrer,
        metaTitle: ogTitle || metaTitle || undefined,
        ogTitle: ogTitle || undefined,
        ogDescription: ogDescription || undefined,
        ogImage: finalOgImage || undefined,
        tags: tags.length ? tags : undefined,
        expiresAt: expiresAt ? expiresAt : undefined,
        maxClicks: hasClickLimit && maxClicks ? Number(maxClicks) : undefined,
        fallbackUrl: hasClickLimit && fallbackUrl.trim() ? fallbackUrl.trim() : undefined,
        abVariations: abVariations.filter(v => v.url && v.url.trim()),
        mainWeight: Number(mainWeight) || 50,
      });

      if (res?.data) {
        createdLink = {
          ...createdLink,
          id: res.data.id || createdLink.id,
          shortUrl: res.data.short_url || createdLink.shortUrl,
          slug: res.data.slug || createdLink.slug,
          ogImage: res.data.og_image || res.data.ogImage || finalOgImage || undefined,
          ogTitle: res.data.og_title || res.data.ogTitle || ogTitle || undefined,
          ogDescription: res.data.og_description || res.data.ogDescription || ogDescription || undefined,
          metaTitle: res.data.meta_title || res.data.metaTitle || ogTitle || metaTitle || undefined,
        };
      } else {
        createdLink = {
          ...createdLink,
          ogImage: finalOgImage || undefined,
          ogTitle: ogTitle || undefined,
          ogDescription: ogDescription || undefined,
          metaTitle: ogTitle || metaTitle || undefined,
        };
      }
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
      showToast.error(msg || "Erreur lors de la création du lien.");
      return;
    }

    cfInvalidateCache();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lshorter_links_updated", { detail: createdLink }));
      window.dispatchEvent(new Event("lshorter_data_change"));
    }

    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 }
    });

    showToast.success(`Lien https://${domainName}/${createdLink.slug} créé avec succès !`);
    setIsSubmitting(false);
    if (onSuccess) onSuccess(createdLink);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in select-none">
      <div className="relative w-full max-w-3xl rounded-[10px] bg-[#141416] border border-[#27272a] p-6 sm:p-8 shadow-2xl text-white max-h-[92vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-neutral-400 hover:text-white p-1 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[10px] bg-[#ff6600] flex items-center justify-center text-white shadow-lg shadow-[#ff6600]/30 font-bold">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Créer un Nouveau Lien</h2>
            <p className="text-xs text-neutral-400">
              Configurez votre redirection courte, paramètres de tracking UTM et règles de routage.
            </p>
          </div>
        </div>

        {/* Top Common Fields: Destination URL & Short Link */}
        <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              URL de destination <span className="text-[#ff6600]">*</span>
            </label>
            <Input
              required
              placeholder="https://example.com/votre-page-de-vente"
              value={targetUrl}
              onChange={(e) => {
                setTargetUrl(e.target.value);
                if (fieldErrors.targetUrl) {
                  const err = checkUrlFormat(e.target.value, true);
                  setFieldErrors((prev) => ({ ...prev, targetUrl: err }));
                }
              }}
              className={cn(
                fieldErrors.targetUrl &&
                  "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-950/20 text-red-100"
              )}
            />
            <FieldErrorAlert message={fieldErrors.targetUrl} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Domaine
              </label>
              <select
                value={domainName}
                onChange={(e) => setDomainName(e.target.value)}
                className="w-full h-11 rounded-[10px] bg-[#141416] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
              >
                <option value="lsho.cc" className="bg-[#141416] text-white font-bold">
                  lsho.cc (Domaine Officiel · Par défaut)
                </option>
                {customDomains.map((d) => (
                  <option key={d.id} value={d.domain} className="bg-[#141416] text-white">
                    {d.domain} (Personnalisé · Actif)
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-7">
              <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                Custom Slug (Optionnel)
              </label>
              <Input
                placeholder="mon-slug-personnalise"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  if (fieldErrors.slug) {
                    const err = checkSlugFormat(e.target.value);
                    setFieldErrors((prev) => ({ ...prev, slug: err }));
                  }
                }}
                className={cn(
                  fieldErrors.slug &&
                    "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-950/20 text-red-100"
                )}
              />
              <FieldErrorAlert message={fieldErrors.slug} />
            </div>
          </div>
        </div>

        {/* Navigation Tabs - Smooth Horizontal Scroll (Never Clipped) */}
        <div className="flex items-center gap-2 border-b border-[#27272a] pb-2.5 mb-5 overflow-x-auto no-scrollbar scroll-smooth px-0.5 text-xs select-none -mx-1 sm:mx-0">
          <button
            type="button"
            onClick={() => setActiveTab("social")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "social"
                ? "bg-[#ff6600] text-white shadow-md font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Social Preview</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tracking")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "tracking"
                ? "bg-[#ff6600] text-white shadow-md font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Tracking &amp; UTM</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("routing")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "routing"
                ? "bg-[#ff6600] text-white shadow-md font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" />
            <span>Routing (Règles)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("protection")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "protection"
                ? "bg-[#ff6600] text-white shadow-md font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Protection &amp; Expiry</span>
            {hasProtectionErrors && (
              <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-400 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("ab_testing")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "ab_testing"
                ? "bg-[#ff6600] text-white shadow-md font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Split className="w-3.5 h-3.5" />
            <span>A/B Testing</span>
            {hasAbErrors && (
              <span className="w-2 h-2 rounded-full bg-red-500 ring-2 ring-red-400 animate-pulse ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("advanced")}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-[10px] font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              activeTab === "advanced"
                ? "bg-[#ff6600] text-white shadow-md font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Advanced</span>
          </button>
        </div>

        {/* Tab Contents */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          {/* TAB 1: SOCIAL PREVIEW */}
          {activeTab === "social" && (
            <div className="flex flex-col gap-5 animate-in fade-in">
              <div className="p-3 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex items-center justify-between text-xs">
                <span className="text-neutral-300">
                  Personnalisez l&apos;image et le texte qui s&apos;affichent lors du partage sur Twitter, WhatsApp, etc.
                </span>
              </div>

              {/* Hidden file input for banner image */}
              <input
                type="file"
                ref={bannerInputRef}
                accept="image/*"
                onChange={handleBannerUpload}
                className="hidden"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Titre OpenGraph</label>
                    <Input
                      placeholder="Offre Spéciale d'Été ☀️"
                      value={ogTitle}
                      onChange={(e) => setOgTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">Description</label>
                    <textarea
                      rows={3}
                      placeholder="Profitez de -30% sur toute la boutique."
                      value={ogDescription}
                      onChange={(e) => setOgDescription(e.target.value)}
                      className="w-full rounded-[10px] bg-[#1a1a1e] border border-[#27272a] p-3 text-xs text-neutral-200 focus:outline-none focus:border-[#ff6600]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">URL ou Fichier de l&apos;image</label>
                    <div className="flex items-center gap-2">
                      <Input
                        placeholder="https://images.unsplash.com/... ou importer"
                        value={ogImage}
                        onChange={(e) => setOgImage(e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => bannerInputRef.current?.click()}
                        className="shrink-0 h-10 text-xs font-semibold text-white border-[#27272a] hover:border-[#ff6600] cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5 mr-1 text-[#ff6600]" /> Importer
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Live Social Card Preview */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-neutral-400">Aperçu en direct (Twitter / WhatsApp)</span>
                  <div className="rounded-[10px] bg-[#1a1a1e] border border-[#27272a] overflow-hidden shadow-lg">
                    <div
                      onClick={() => !isUploadingImage && bannerInputRef.current?.click()}
                      className="w-full h-36 bg-neutral-800 relative flex items-center justify-center overflow-hidden cursor-pointer group hover:bg-neutral-750 transition-colors"
                      title="Cliquez pour importer une image"
                    >
                      {isUploadingImage ? (
                        <div className="flex flex-col items-center gap-2 text-neutral-400">
                          <Loader2 className="w-6 h-6 animate-spin text-[#ff6600]" />
                          <span className="text-xs font-medium">Optimisation de l&apos;image...</span>
                        </div>
                      ) : (previewImage || ogImage) ? (
                        <>
                          <img
                            src={previewImage || cfNormalizeImageUrl(ogImage)}
                            alt="OG Preview"
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
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <span className="text-xs font-semibold text-white bg-black/70 px-2.5 py-1 rounded-[10px] flex items-center gap-1">
                              <Upload className="w-3 h-3 text-[#ff6600]" /> Remplacer
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setOgImage("");
                                setPreviewImage("");
                              }}
                              className="text-xs font-semibold text-red-400 bg-black/70 px-2.5 py-1 rounded-[10px] hover:text-red-300 cursor-pointer"
                            >
                              Supprimer
                            </button>
                          </div>
                        </>
                      ) : (
                        <div className="text-neutral-400 text-xs flex flex-col items-center gap-1.5 p-4 text-center group-hover:text-white transition-colors">
                          <Upload className="w-5 h-5 text-[#ff6600]" />
                          <span className="font-semibold">Cliquez pour importer une bannière</span>
                          <span className="text-[10px] text-neutral-500">1200×630 recommandé (JPG, PNG, WebP)</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex flex-col gap-1 text-xs">
                      <span className="text-[10px] text-[#ff6600] font-mono">{domainName}/{slug || "votre-lien"}</span>
                      <p className="font-bold text-white line-clamp-1">{ogTitle || "Titre de la page partagée"}</p>
                      <p className="text-[11px] text-neutral-400 line-clamp-2">
                        {ogDescription || "Description qui s'affiche automatiquement dans le flux de réseaux sociaux."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TRACKING & UTM */}
          {activeTab === "tracking" && (
            <div className="flex flex-col gap-5 animate-in fade-in">
              {/* Tags Gated Feature */}
              <LockedProFeature
                title="Tags Personnalisés"
                description="Organisez et filtrez vos liens avec des tags et catégories illimités."
                isUnlocked={isProPlan}
              >
                <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5 text-[#ff6600]" />
                      <span>Tags</span>
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400">
                    Organisez vos liens avec des tags. Séparez par des virgules.
                  </p>
                  <Input
                    placeholder="ex: promo, ete, marketing, twitter"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                  />
                </div>
              </LockedProFeature>

              {/* UTM Parameters Section */}
              <div className="flex flex-col gap-3">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#ff6600]" />
                  <span>Paramètres UTM (Tracking de Campagnes)</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">Source (utm_source)</label>
                    <Input
                      placeholder="ex: twitter, facebook, newsletter"
                      value={utmSource}
                      onChange={(e) => setUtmSource(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">Medium (utm_medium)</label>
                    <Input
                      placeholder="ex: social, cpc, email"
                      value={utmMedium}
                      onChange={(e) => setUtmMedium(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">Campaign (utm_campaign)</label>
                    <Input
                      placeholder="ex: soldes_ete_2026"
                      value={utmCampaign}
                      onChange={(e) => setUtmCampaign(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">Term (utm_term)</label>
                    <Input
                      placeholder="ex: mot-cle-ads"
                      value={utmTerm}
                      onChange={(e) => setUtmTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-400 mb-1">Content (utm_content)</label>
                  <Input
                    placeholder="ex: bouton_cta_haut"
                    value={utmContent}
                    onChange={(e) => setUtmContent(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ADVANCED ROUTING RULES */}
          {activeTab === "routing" && (
            <div className="flex flex-col gap-4 animate-in fade-in">
              <RoutingRulesEditor
                rules={routingRules}
                onChange={setRoutingRules}
                userPlan={userPlan}
              />
            </div>
          )}

          {/* TAB 4: PROTECTION & EXPIRY */}
          {activeTab === "protection" && (
            <div className="flex flex-col gap-4 animate-in fade-in text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] cursor-pointer">
                <div>
                  <span className="font-bold text-white block">Masquer le référent (no-referrer)</span>
                  <span className="text-[11px] text-neutral-400">
                    Ne transmet pas votre domaine source au site de destination.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={hideReferrer}
                  onChange={(e) => setHideReferrer(e.target.checked)}
                  className="w-4 h-4 accent-[#ff6600] cursor-pointer"
                />
              </label>

              {/* Cloaking Feature Gated */}
              <LockedProFeature
                title="Masquage d'URL (Cloaking)"
                description="Garde le domaine court affiché dans la barre d'adresse sans révéler l'URL finale."
                isUnlocked={isProPlan}
              >
                <label className="flex items-center justify-between p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] cursor-pointer">
                  <div>
                    <span className="font-bold text-white block">Masquage d&apos;URL (Cloaking)</span>
                    <span className="text-[11px] text-neutral-400">
                      Garde le domaine court affiché dans la barre d&apos;adresse du navigateur.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isCloaked}
                    onChange={(e) => setIsCloaked(e.target.checked)}
                    className="w-4 h-4 accent-[#ff6600] cursor-pointer"
                  />
                </label>
              </LockedProFeature>

              {/* Password Protection Gated */}
              <LockedProFeature
                title="Protection par Mot de Passe"
                description="Sécurisez l'accès à votre destination avec un mot de passe obligatoire."
                isUnlocked={isProPlan}
              >
                <div className="p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
                  <label className="block font-semibold text-neutral-300 mb-1">
                    Mot de passe d&apos;accès (Optionnel)
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Laisser vide si public (min. 4 caractères)"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (fieldErrors.password) {
                          const err = checkPasswordFormat(e.target.value);
                          setFieldErrors((prev) => ({ ...prev, password: err }));
                        }
                      }}
                      className={cn(
                        "pr-10",
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
                <div className="p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] space-y-3">
                  <label className="flex items-center justify-between cursor-pointer select-none">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-xs">Limiter le nombre d&apos;accès</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={hasClickLimit}
                      onChange={(e) => setHasClickLimit(e.target.checked)}
                      className="w-4 h-4 accent-[#ff6600] rounded-[10px] cursor-pointer"
                    />
                  </label>

                  {hasClickLimit && (
                    <div className="pt-2.5 border-t border-[#26262e] space-y-2.5 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-[11px] text-neutral-300 font-medium">
                          Nombre maximal de clics :
                        </span>
                        <div className="inline-flex items-center rounded-[10px] bg-[#121215] border border-[#2a2a32] p-0.5 focus-within:border-[#ff6600] transition-colors">
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
                            "h-8 text-xs bg-[#121215] border-[#2a2a32] focus:border-[#ff6600]",
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

              {/* Expiry Date Gated */}
              <LockedProFeature
                title="Expiration Automatique"
                description="Programmez la désactivation ou la redirection automatique à une date précise."
                isUnlocked={isProPlan}
              >
                <div className="p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
                  <label className="block font-semibold text-neutral-300 mb-1">
                    Date & Heure d&apos;expiration
                  </label>
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
                      fieldErrors.expiresAt &&
                        "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-950/20 text-red-100"
                    )}
                  />
                  <FieldErrorAlert message={fieldErrors.expiresAt} />
                </div>
              </LockedProFeature>
            </div>
          )}

          {/* TAB 5: A/B TESTING */}
          {activeTab === "ab_testing" && (
            <div className="flex flex-col gap-4 animate-in fade-in text-xs">
              <LockedProFeature
                title="A/B Testing Multi-Variantes"
                description="Répartissez intelligemment le trafic entre plusieurs destinations pour tester et maximiser vos conversions."
                isUnlocked={isProPlan}
              >
                <div className="flex flex-col gap-3">
                  <div className="p-3 rounded-[10px] bg-[#ff6600]/10 border border-[#ff6600]/30 text-xs text-[#ff6600] flex items-start gap-2">
                    <Split className="w-4 h-4 shrink-0 mt-0.5" />
                    <div>
                      <strong>A/B Testing Multi-Variantes :</strong> Répartissez automatiquement les visiteurs de votre lien court vers différentes pages de vente ou produits pour voir laquelle performe le mieux.
                    </div>
                  </div>

                  {/* Variante A : Destination Principale */}
                  <div className="p-3.5 rounded-[10px] bg-[#19191d] border border-[#27272e] flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                        <span className="w-5 h-5 rounded-[10px] bg-[#ff6600] text-white flex items-center justify-center text-[10px] font-bold">A</span>
                        <span>Variante A (URL Principale)</span>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-neutral-400">Trafic :</span>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={mainWeight}
                          onChange={(e) => setMainWeight(Math.max(1, Math.min(100, Number(e.target.value) || 0)))}
                          className="w-14 h-8 rounded-[10px] bg-[#121215] border border-[#27272a] text-center text-xs font-mono font-bold text-white focus:border-[#ff6600] focus:outline-none"
                        />
                        <span className="text-neutral-400 font-bold">%</span>
                      </div>
                    </div>
                    <div className="text-[11px] font-mono text-neutral-300 bg-[#121215] px-3 py-2 rounded-[10px] border border-[#222227] truncate">
                      {targetUrl.trim() || <span className="text-neutral-500 italic">Renseignez l&apos;URL de destination ci-dessus</span>}
                    </div>
                  </div>

                  {/* Variantes additionnelles B, C, D... */}
                  {abVariations.map((v, i) => (
                    <div key={i} className="p-3.5 rounded-[10px] bg-[#19191d] border border-[#27272e] flex flex-col gap-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white flex items-center gap-1.5 text-xs">
                          <span className="w-5 h-5 rounded-[10px] bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold">
                            {String.fromCharCode(66 + i)}
                          </span>
                          <span>Variante {String.fromCharCode(66 + i)}</span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] text-neutral-400">Trafic :</span>
                          <input
                            type="number"
                            min="1"
                            max="100"
                            value={v.weight}
                            onChange={(e) => {
                              const updated = [...abVariations];
                              updated[i].weight = Math.max(1, Math.min(100, Number(e.target.value) || 0));
                              setAbVariations(updated);
                            }}
                            className="w-14 h-8 rounded-[10px] bg-[#121215] border border-[#27272a] text-center text-xs font-mono font-bold text-white focus:border-[#ff6600] focus:outline-none"
                          />
                          <span className="text-neutral-400 font-bold">%</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariation(i)}
                            className="w-7 h-7 rounded-[10px] bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center ml-1 transition-colors"
                            title="Supprimer cette variante"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <Input
                        type="url"
                        placeholder={`https://example.com/produit-variante-${String.fromCharCode(98 + i)}`}
                        value={v.url}
                        onChange={(e) => {
                          const updated = [...abVariations];
                          updated[i].url = e.target.value;
                          setAbVariations(updated);
                        }}
                        className={cn(
                          "h-9 text-xs bg-[#121215] border-[#27272a] focus:border-[#ff6600]",
                          fieldErrors[`abVariation_${i}`] &&
                            "border-red-500 focus:border-red-500 focus:ring-red-500/30 bg-red-950/20 text-red-100"
                        )}
                      />
                      <FieldErrorAlert message={fieldErrors[`abVariation_${i}`]} />
                    </div>
                  ))}

                  {/* Boutons d'actions & Répartition (Mobile-First Responsive Grid) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleAddVariation}
                      className="w-full flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-[10px] bg-[#202026] hover:bg-[#282830] active:scale-98 text-neutral-200 hover:text-white font-semibold text-xs border border-[#2c2c34] transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4 text-[#ff6600]" />
                      <span>Ajouter une variante</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAutoBalance}
                      className="w-full flex items-center justify-center gap-1.5 h-10 px-3.5 rounded-[10px] bg-amber-500/10 hover:bg-amber-500/20 active:scale-98 text-amber-400 text-xs font-semibold border border-amber-500/30 transition-all cursor-pointer shadow-sm"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Équilibrer automatiquement (100%)</span>
                    </button>
                  </div>

                  {/* Total Traffic Badge with Strict Format Alert */}
                  {(() => {
                    const total = mainWeight + abVariations.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);
                    return (
                      <div className="flex flex-col gap-1.5">
                        <div className={`p-2.5 rounded-[10px] text-xs flex items-center justify-between ${
                          total === 100 
                            ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400" 
                            : "bg-red-500/15 border border-red-500/40 text-red-400"
                        }`}>
                          <span>Total de la répartition :</span>
                          <span className="font-mono font-bold">
                            {total}% {total === 100 ? "✓ (Parfait)" : "❌ (Doit faire exactement 100%)"}
                          </span>
                        </div>
                        {total !== 100 && (
                          <FieldErrorAlert message={`La somme des pourcentages fait ${total}%. Cliquez sur "Équilibrer automatiquement (100%)" ou ajustez manuellement pour atteindre 100%.`} />
                        )}
                      </div>
                    );
                  })()}
                </div>
              </LockedProFeature>
            </div>
          )}

          {/* TAB 6: ADVANCED */}
          {activeTab === "advanced" && (
            <div className="flex flex-col gap-4 animate-in fade-in text-xs">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1.5">
                  Code de redirection HTTP
                </label>
                <select
                  value={redirectType}
                  onChange={(e) => setRedirectType(e.target.value as any)}
                  className="w-full h-11 rounded-[10px] bg-[#141416] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                >
                  <option value="302" className="bg-[#141416] text-white">302 — Redirection temporaire (Recommandé)</option>
                  <option value="301" className="bg-[#141416] text-white">301 — Redirection permanente (SEO)</option>
                  <option value="307" className="bg-[#141416] text-white">307 — Redirection stricte</option>
                </select>
              </div>

              <label className="flex items-center justify-between p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] cursor-pointer">
                <div>
                  <span className="font-bold text-white block">Transmettre les paramètres d&apos;URL</span>
                  <span className="text-[11px] text-neutral-400">
                    Transfère automatiquement les paramètres de requête reçus vers la destination.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={passParams}
                  onChange={(e) => setPassParams(e.target.checked)}
                  className="w-4 h-4 accent-[#ff6600] rounded-[10px] cursor-pointer"
                />
              </label>
            </div>
          )}

          {/* Validation Error Summary Alert */}
          {hasAttemptedSubmit && Object.keys(fieldErrors).length > 0 && (
            <div className="p-3.5 rounded-[10px] bg-red-500/15 border border-red-500/40 text-red-400 text-xs flex items-start gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
              <div className="flex flex-col gap-0.5">
                <span className="font-bold text-red-300">Format strict non respecté :</span>
                <span className="text-[11px] text-red-300">
                  Certains champs contiennent des erreurs indiquées en rouge ci-dessus. Veuillez les corriger avant de pouvoir créer le lien.
                </span>
              </div>
            </div>
          )}

          {/* Footer Submit Buttons (Mobile-Responsive) */}
          <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-4 border-t border-[#27272a]">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="h-11 sm:h-9 text-xs cursor-pointer rounded-[10px] border-[#27272a] text-white hover:bg-white/5"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="glow"
              disabled={isSubmitting}
              className="h-11 sm:h-9 text-xs font-bold cursor-pointer rounded-[10px] shadow-lg shadow-[#ff6600]/25"
            >
              {isSubmitting ? "Création..." : "Créer le Lien"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
