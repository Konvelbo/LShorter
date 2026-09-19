"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  cfCreateLink,
  cfUpdateLink,
  cfDeleteLink,
  cfGetDomains,
  cfUploadImage,
  cfInvalidateCache,
  sanitizeClientError,
} from "@/lib/cloudflare-api";
import { compressImageFile } from "@/lib/image-compress";
import { ShortLink } from "@/types";
import { RoutingRule } from "../routing-rules-editor";
import { compileRoutingRules } from "@/lib/routing-utils";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { showToast } from "@/components/ui/toast-provider";
import { cn } from "@/lib/utils";
import { DeleteConfirmModal } from "@/components/dashboard/delete-confirm-modal";
import confetti from "canvas-confetti";

// Modular sub-components
import { LinkDrawerProps, DRAWER_TABS, DrawerTabId } from "./types";
import { DrawerHeader } from "./drawer-header";
import { DrawerFooter } from "./drawer-footer";
import { SectionSocial } from "./sections/section-social";
import { SectionRouting } from "./sections/section-routing";
import { SectionTracking } from "./sections/section-tracking";
import { SectionProtection } from "./sections/section-protection";
import { SectionAbTesting } from "./sections/section-ab-testing";
import { SectionBannerAdvanced } from "./sections/section-banner-advanced";

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
  const scrollContainerRef = useRef<HTMLFormElement>(null);

  // Active Tab state matching Image 2 navigation
  const [activeTab, setActiveTab] = useState<DrawerTabId>("social");

  // 1. General (Mandatory inputs: targetUrl, domainName, slug)
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
  const [twitterCard, setTwitterCard] = useState<"summary_large_image" | "summary">(
    "summary_large_image",
  );
  const [socialPlatformPreview, setSocialPlatformPreview] = useState<
    "x" | "facebook" | "whatsapp"
  >("x");
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

  // 7. Advanced
  const [redirectType, setRedirectType] = useState<"302" | "301" | "307">(
    "302",
  );
  const [passParams, setPassParams] = useState(true);

  // Status & Validation
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [, setHasAttemptedSubmit] = useState(false);

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
      setTwitterCard(
        (link.twitterCard || (link as any).twitter_card || "summary_large_image") === "summary"
          ? "summary"
          : "summary_large_image",
      );

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
      } else if (
        link.geoTargeting ||
        (link as any).geo_targeting ||
        link.deviceTargeting ||
        (link as any).device_targeting
      ) {
        const rawGeo = link.geoTargeting || (link as any).geo_targeting;
        const rawDev = link.deviceTargeting || (link as any).device_targeting;
        const geoObj = typeof rawGeo === "string" ? JSON.parse(rawGeo) : rawGeo;
        const devObj = typeof rawDev === "string" ? JSON.parse(rawDev) : rawDev;

        if (geoObj && typeof geoObj === "object") {
          Object.entries(geoObj).forEach(([country, url], idx) => {
            if (url) {
              parsedRules.push({
                id: `geo_${idx}`,
                title: `Routing ${country}`,
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
                title: `Routing ${device}`,
                isCollapsed: false,
                conditions: [
                  {
                    id: `c_dev_${idx}`,
                    type: "appareil",
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
      const rawVars =
        (link as any).abVariations || (link as any).ab_variations;
      if (rawVars) {
        const parsedVars =
          typeof rawVars === "string" ? JSON.parse(rawVars) : rawVars;
        const finalVars = Array.isArray(parsedVars) ? parsedVars : [];
        setAbVariations(finalVars);
        const weightVal =
          (link as any).mainWeight ?? (link as any).main_weight;
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
      setTwitterCard("summary_large_image");
      setSocialPlatformPreview("x");
      setPreviewImage("");
      setRoutingRules([]);
      setHideReferrer(false);
      setIsCloaked(false);
      setPassword("");
      setShowPassword(false);
      setHasClickLimit(false);
      setMaxClicks("");
      setFallbackUrl("");
      setExpiresAt("");
      setMainWeight(100);
      setAbVariations([]);
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
    setActiveTab("social");
  }, [isOpen, isEditMode, link?.id, initialUrl]);

  // Validation functions (Strict: targetUrl, domainName, and slug are mandatory)
  const checkUrlFormat = (val: string, isRequired = true): string => {
    const trimmed = val.trim();
    if (!trimmed) {
      return isRequired ? "Destination URL is required." : "";
    }
    if (/\s/.test(trimmed)) {
      return "URL must not contain spaces.";
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
        return "Invalid domain name (e.g. https://example.com).";
      }
    } catch {
      return "Invalid URL format. Expected: https://example.com/page";
    }
    return "";
  };

  const checkDomainFormat = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) {
      return "Domain name is required.";
    }
    if (/\s/.test(trimmed)) {
      return "Domain name must not contain spaces.";
    }
    const cleaned = trimmed.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
    if (
      !/^[a-zA-Z0-9.-]+$/.test(cleaned) ||
      (!cleaned.includes(".") && cleaned !== "localhost")
    ) {
      return "Invalid domain name (e.g. example.com or lsho.cc).";
    }
    return "";
  };

  const checkSlugFormat = (val: string): string => {
    const trimmed = val.trim();
    if (!trimmed) {
      return "Custom slug is required.";
    }
    if (trimmed.length < 2) {
      return "Slug must be at least 2 characters.";
    }
    if (!/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
      return "Slug can only contain letters, numbers, hyphens, and underscores.";
    }
    return "";
  };

  const checkPasswordFormat = (val: string): string => {
    if (!val) return "";
    if (val.length < 4) {
      return "Password must be at least 4 characters.";
    }
    return "";
  };

  const checkMaxClicksFormat = (
    val: number | string,
    enabled: boolean,
  ): string => {
    if (!enabled) return "";
    const num = Number(val);
    if (!val || isNaN(num) || num <= 0) {
      return "Maximum clicks limit must be greater than 0.";
    }
    return "";
  };

  const checkExpiresAtFormat = (val: string): string => {
    if (!val) return "";
    const expDate = new Date(val);
    if (isNaN(expDate.getTime())) {
      return "Invalid expiration date.";
    }
    if (expDate.getTime() <= Date.now()) {
      return "Expiration date must be in the future.";
    }
    return "";
  };

  // Instant Banner Selection Handler (0ms delay — Uploads to Bunny CDN during global link submit)
  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error("Please select a valid image file (JPG, PNG, WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("Image file size must be less than 10 MB.");
      return;
    }

    try {
      // Instant local preview and compression
      const compressed = await compressImageFile(file, 1200, 630, 0.85);

      let dataUrl = "";
      if (typeof compressed === "string") {
        dataUrl = compressed;
      } else {
        const reader = new FileReader();
        dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(compressed);
        });
      }

      // Immediately set preview & dataUrl with zero lag
      setPreviewImage(dataUrl);
      setOgImage(dataUrl);
      setTwitterCard((prev) => (prev === "summary" ? "summary" : "summary_large_image"));
      showToast.success("Banner image selected! It will be synced when saving.");
    } catch (err) {
      console.error("Banner selection error:", err);
      showToast.error("Error selecting banner image.");
    } finally {
      setIsUploadingImage(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
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

  // A/B Testing helpers
  const handleAddVariation = () => {
    if (abVariations.length >= 5) {
      showToast.error("Maximum 5 variations allowed.");
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
    showToast.success("Percentages balanced automatically!");
  };

  // Delete Link Handler
  const handleDeleteLink = async () => {
    if (!link?.id) return;
    setIsDeleting(true);
    try {
      await cfDeleteLink(link.id, userId, link.slug, link.ogImage);
      cfInvalidateCache();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("lshorter_data_change"));
        window.dispatchEvent(
          new CustomEvent("lshorter_link_deleted", { detail: { id: link.id } }),
        );
      }
      showToast.success("Link deleted successfully.");
      setIsDeleteModalOpen(false);
      onClose();
    } catch {
      showToast.error("Failed to delete link.");
    } finally {
      setIsDeleting(false);
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
              `Variation ${String.fromCharCode(66 + idx)}: ${err}`;
        }
      });
      const totalWeight =
        mainWeight +
        abVariations.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);
      if (totalWeight !== 100) {
        errors.abTotal = `The sum of percentages must equal 100% (currently ${totalWeight}%).`;
      }
    }

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      if (
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
      showToast.error("Certains champs obligatoires sont manquants ou invalides.");
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
      if (routingRules && routingRules.length > 0) {
        triggerPlanUpgrade({
          reason: "Smart dynamic routing requires the Pro plan.",
          featureName: "Dynamic Routing",
          targetPlan: "PRO",
        });
        setIsSubmitting(false);
        return;
      }
      if (password) {
        triggerPlanUpgrade({
          reason: "Password protection requires the Pro plan.",
          featureName: "Password Protection",
          targetPlan: "PRO",
        });
        setIsSubmitting(false);
        return;
      }
      if (isCloaked) {
        triggerPlanUpgrade({
          reason: "URL cloaking requires the Pro plan.",
          featureName: "URL Cloaking",
          targetPlan: "PRO",
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
          twitterCard: twitterCard,
          twitter_card: twitterCard,
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
          twitterCard: twitterCard,
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

        showToast.success("Link updated successfully!");
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
          ogTitle: ogTitle || undefined,
          ogDescription: ogDescription || undefined,
          ogImage: finalOgImage || undefined,
          twitterCard: twitterCard,
          twitter_card: twitterCard,
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
          twitterCard: twitterCard,
          twitter_card: twitterCard,
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
            twitterCard: twitterCard,
            twitter_card: twitterCard,
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
          `Link https://${cleanDomain}/${cleanSlug} created successfully!`,
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
          reason: "This feature requires the PRO plan or higher.",
          featureName: "Advanced PRO Options & Security",
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
        className="fixed inset-0 bg-black/75 backdrop-blur-[6px] transition-opacity duration-300 animate-in fade-in"
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteLink}
        title="Delete this short link?"
        description={`Are you sure you want to delete /${slug || link?.slug}? This action cannot be undone.`}
        isDeleting={isDeleting}
      />

      {/* Drawer sliding panel — wide mono-page canvas */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex h-full flex-col bg-white dark:bg-[#0d0d10] text-zinc-900 dark:text-white border-l border-zinc-200 dark:border-[#27272a] shadow-2xl transition-transform duration-300 ease-out animate-in slide-in-from-right",
          "w-full sm:max-w-2xl md:max-w-3xl lg:max-w-[860px] max-sm:w-screen max-sm:max-w-[100vw]",
        )}
      >
        {/* ── 1. STICKY TOP HEADER & PINNED INPUTS ── */}
        <DrawerHeader
          isEditMode={isEditMode}
          slug={slug}
          linkSlug={link?.slug}
          onClose={onClose}
          targetUrl={targetUrl}
          setTargetUrl={setTargetUrl}
          domainName={domainName}
          setDomainName={setDomainName}
          customDomains={customDomains}
          setSlug={setSlug}
          fieldErrors={fieldErrors}
          setFieldErrors={setFieldErrors}
          checkUrlFormat={checkUrlFormat}
          checkDomainFormat={checkDomainFormat}
          checkSlugFormat={checkSlugFormat}
        />

        {/* ── 2. HORIZONTAL TAB NAVIGATION (Image 2 style) ── */}
        <div className="border-b border-zinc-200 dark:border-[#222225] bg-zinc-50 dark:bg-[#121215] px-4 sm:px-6 shrink-0">
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 -mb-px">
            {DRAWER_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActiveTab = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-3.5 py-2 rounded-[8px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer select-none relative",
                    isActiveTab
                      ? "bg-white dark:bg-white/10 text-zinc-900 dark:text-white shadow-xs border border-zinc-200 dark:border-white/10"
                      : "text-zinc-500 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-white/5 border border-transparent",
                  )}
                >
                  <Icon
                    className={cn(
                      "w-3.5 h-3.5",
                      isActiveTab ? "text-brand" : "text-zinc-400 dark:text-neutral-400",
                    )}
                  />
                  <span>{tab.label}</span>
                  {tab.isPro && !isProPlan && (
                    <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30 tracking-wider">
                      PRO
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Subtitle Header */}
        <div className="px-4 sm:px-6 pt-3 pb-1 shrink-0 bg-white dark:bg-[#0d0d10]">
          <p className="text-[11.5px] text-zinc-500 dark:text-neutral-400">
            {DRAWER_TABS.find((t) => t.id === activeTab)?.subtitle}
          </p>
        </div>

        {/* ── 3. MAIN WORKSPACE: TABBED CONTENT ── */}
        <div className="flex-1 flex overflow-hidden relative">
          <form
            id="link-drawer-form"
            onSubmit={handleSubmit}
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 flex flex-col gap-4 no-scrollbar drawer-scroll-hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {activeTab === "social" && (
              <SectionSocial
                ogTitle={ogTitle}
                setOgTitle={setOgTitle}
                ogDescription={ogDescription}
                setOgDescription={setOgDescription}
                ogImage={ogImage}
                setOgImage={setOgImage}
                previewImage={previewImage}
                setPreviewImage={setPreviewImage}
                domainName={domainName}
                socialPlatformPreview={socialPlatformPreview}
                setSocialPlatformPreview={setSocialPlatformPreview}
                twitterCard={twitterCard}
                setTwitterCard={setTwitterCard}
                bannerInputRef={bannerInputRef}
                handleBannerUpload={handleBannerUpload}
                isUploadingImage={isUploadingImage}
              />
            )}

            {activeTab === "tracking" && (
              <SectionTracking
                utmSource={utmSource}
                setUtmSource={setUtmSource}
                utmMedium={utmMedium}
                setUtmMedium={setUtmMedium}
                utmCampaign={utmCampaign}
                setUtmCampaign={setUtmCampaign}
                utmTerm={utmTerm}
                setUtmTerm={setUtmTerm}
                utmContent={utmContent}
                setUtmContent={setUtmContent}
                targetUrl={targetUrl}
                computeFinalUrlWithUtm={computeFinalUrlWithUtm}
              />
            )}

            {activeTab === "routing" && (
              <SectionRouting
                routingRules={routingRules}
                setRoutingRules={setRoutingRules}
                isProPlan={isProPlan}
                userPlan={userPlan}
              />
            )}

            {activeTab === "protection" && (
              <SectionProtection
                isProPlan={isProPlan}
                password={password}
                setPassword={setPassword}
                showPassword={showPassword}
                setShowPassword={setShowPassword}
                isCloaked={isCloaked}
                setIsCloaked={setIsCloaked}
                hideReferrer={hideReferrer}
                setHideReferrer={setHideReferrer}
                hasClickLimit={hasClickLimit}
                setHasClickLimit={setHasClickLimit}
                maxClicks={maxClicks}
                setMaxClicks={setMaxClicks}
                fallbackUrl={fallbackUrl}
                setFallbackUrl={setFallbackUrl}
                expiresAt={expiresAt}
                setExpiresAt={setExpiresAt}
                fieldErrors={fieldErrors}
                setFieldErrors={setFieldErrors}
                checkExpiresAtFormat={checkExpiresAtFormat}
              />
            )}

            {activeTab === "ab_testing" && (
              <SectionAbTesting
                targetUrl={targetUrl}
                mainWeight={mainWeight}
                setMainWeight={setMainWeight}
                abVariations={abVariations}
                setAbVariations={setAbVariations}
                handleAddVariation={handleAddVariation}
                handleRemoveVariation={handleRemoveVariation}
                handleAutoBalance={handleAutoBalance}
                fieldErrors={fieldErrors}
              />
            )}

            {activeTab === "advanced" && (
              <SectionBannerAdvanced
                redirectType={redirectType}
                setRedirectType={setRedirectType}
                passParams={passParams}
                setPassParams={setPassParams}
                isActive={isActive}
                setIsActive={setIsActive}
                tagsInput={tagsInput}
                setTagsInput={setTagsInput}
              />
            )}
          </form>
        </div>

        {/* ── 4. STICKY FOOTER ── */}
        <DrawerFooter
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
          onDeleteClick={() => setIsDeleteModalOpen(true)}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
