"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  cfCreateLink,
  cfUpdateLink,
  cfDeleteLink,
  cfGetDomains,
  cfGetPixels,
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
import { Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { DeleteConfirmModal } from "@/components/dashboard/delete-confirm-modal";
import confetti from "canvas-confetti";
import gsap from "gsap";

import { LinkDrawerProps, DRAWER_TABS, DrawerTabId } from "./types";
import { SectionLink } from "./sections/section-link";
import { SectionSocialTracking } from "./sections/section-social-tracking";
import { SectionRouting } from "./sections/section-routing";
import { SectionProtectionExpiry } from "./sections/section-protection-expiry";
import { SectionAbTesting } from "./sections/section-ab-testing";
import { SectionAdvanced } from "./sections/section-advanced";
import { SectionReview } from "./sections/section-review";

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
  const sessionUserId = session?.user?.id;
  const sessionEmail = session?.user?.email || "";

  const convexUser = useQuery(
    api.users.getCurrentUser,
    (sessionUserId && sessionUserId !== "usr_anonymous") || sessionEmail
      ? { userId: sessionUserId || sessionEmail, email: sessionEmail || undefined }
      : "skip",
  );

  const effectiveUserId =
    (sessionUserId && sessionUserId !== "usr_anonymous" ? sessionUserId : null) ||
    convexUser?.userId ||
    (link?.userId && link.userId !== "usr_anonymous" ? link.userId : null) ||
    "usr_anonymous";

  const effectiveUserEmail =
    sessionEmail ||
    convexUser?.email ||
    link?.userEmail ||
    undefined;

  const userId = effectiveUserId;
  const userEmail = effectiveUserEmail || "";

  const [runtimePlan, setRuntimePlan] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && convexUser?.plan) {
      localStorage.setItem("lshorter_user_plan", convexUser.plan.toUpperCase());
    }
  }, [convexUser?.plan]);

  useEffect(() => {
    const handlePlanUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.plan) {
        setRuntimePlan(String(detail.plan).toUpperCase());
      }
    };
    window.addEventListener("lshorter_plan_updated", handlePlanUpdated);
    return () => window.removeEventListener("lshorter_plan_updated", handlePlanUpdated);
  }, []);

  const rawUserPlan = (
    runtimePlan ||
    convexUser?.plan ||
    (session?.user as any)?.plan ||
    (typeof window !== "undefined"
      ? localStorage.getItem("lshorter_user_plan")
      : null) ||
    "FREE"
  ).toUpperCase();

  const userPlan = rawUserPlan === "FREEMIUM" || rawUserPlan === "STARTER" ? "FREE" : rawUserPlan;

  const isProPlan =
    userPlan === "PRO" ||
    userPlan === "BUSINESS" ||
    userPlan === "ENTERPRISE" ||
    process.env.NODE_ENV !== "production";

  const bannerInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLFormElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const tabsNavRef = useRef<HTMLDivElement>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [shouldRender, setShouldRender] = useState(isOpen);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<DrawerTabId>("link");

  // GSAP Open / Close animation lifecycle
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lshorter_drawer_opened"));
      }
    }
  }, [isOpen]);

  useEffect(() => {
    if (!shouldRender) return;
    const backdrop = backdropRef.current;
    const panel = panelRef.current;

    if (isOpen && backdrop && panel) {
      gsap.fromTo(
        backdrop,
        { opacity: 0 },
        { opacity: 1, duration: 0.28, ease: "power2.out" },
      );
      gsap.fromTo(
        panel,
        { x: "100%", opacity: 0.8 },
        { x: "0%", opacity: 1, duration: 0.38, ease: "power3.out" },
      );
    } else if (!isOpen && backdrop && panel) {
      gsap.to(backdrop, {
        opacity: 0,
        duration: 0.25,
        ease: "power2.in",
      });
      gsap.to(panel, {
        x: "100%",
        opacity: 0.8,
        duration: 0.3,
        ease: "power3.in",
        onComplete: () => setShouldRender(false),
      });
    }
  }, [isOpen, shouldRender]);

  const handleAnimatedClose = React.useCallback(() => {
    const backdrop = backdropRef.current;
    const panel = panelRef.current;
    if (backdrop && panel) {
      gsap.to(backdrop, { opacity: 0, duration: 0.24, ease: "power2.in" });
      gsap.to(panel, {
        x: "100%",
        duration: 0.28,
        ease: "power3.in",
        onComplete: () => {
          setShouldRender(false);
          onClose();
        },
      });
    } else {
      onClose();
    }
  }, [onClose]);

  // Smooth scroll container to top when changing tabs
  useEffect(() => {
    if (!scrollContainerRef.current) return;
    scrollContainerRef.current.scrollTop = 0;
  }, [activeTab]);

  // Ensure active tab button scrolls into view on mobile
  useEffect(() => {
    const el = tabsNavRef.current;
    if (el) {
      const activeBtn = el.querySelector<HTMLButtonElement>('[data-active="true"]');
      if (activeBtn) {
        activeBtn.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
          inline: "nearest",
        });
      }
    }
  }, [activeTab]);

  // 1. General Link inputs
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
    "x" | "facebook" | "whatsapp" | "linkedin"
  >("x");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // 3. Tracking & UTM
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");
  // 3b. Retargeting Pixels
  const [selectedPixels, setSelectedPixels] = useState<any[]>([]);
  const [availablePixels, setAvailablePixels] = useState<any[]>([]);

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
  const [pathLockMode, setPathLockMode] = useState<
    "off" | "strict" | "funnel"
  >("off");
  const [pathLockPrefix, setPathLockPrefix] = useState<string>("");
  const [pathLockMessage, setPathLockMessage] = useState<string>("");
  const [pathLockPassword, setPathLockPassword] = useState<string>("");

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

  // Dynamically retrieve user's custom domains and retargeting pixels from Cloudflare API
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

      cfGetPixels(userId)
        .then((res) => {
          const list = res?.data?.pixels || [];
          setAvailablePixels(list);
        })
        .catch(() => {});
    }
  }, [userId, isOpen]);

  const initializedKeyRef = useRef<string | null>(null);

  // Initialize or reset form based on mode and link
  useEffect(() => {
    if (!isOpen) {
      initializedKeyRef.current = null;
      return;
    }

    const currentKey =
      isEditMode && link
        ? (link.id || link.slug || "edit_link")
        : `create_${initialUrl || ""}`;
    if (initializedKeyRef.current === currentKey) {
      return;
    }
    initializedKeyRef.current = currentKey;

    if (isEditMode && link) {
      setTargetUrl(link.targetUrl || "");
      setDomainName(link.domainName || "");
      setSlug(link.slug || "");
      const expTime = (link as any).expires_at || (link as any).expiresAt;
      const isExp = Boolean(expTime && new Date(expTime).getTime() <= Date.now());
      setIsActive(!isExp && link.isActive !== false && (link as any).is_active !== 0);
      setTagsInput(Array.isArray(link.tags) ? link.tags.join(", ") : "");

      setOgTitle(link.ogTitle || link.metaTitle || (link as any).og_title || "");
      setOgDescription(link.ogDescription || (link as any).og_description || "");
      setOgImage(link.ogImage || (link as any).og_image || "");
      setPreviewImage("");
      const rawCard = link.twitterCard || (link as any).twitter_card;
      const rawStyle =
        (link as any).bannerStyle || (link as any).banner_style;
      const isLarge =
        rawCard === "summary_large_image" || rawStyle === "large_banner";
      const isDefault =
        (rawCard === "summary" || rawStyle === "default_banner") && !isLarge;
      setTwitterCard(isDefault ? "summary" : "summary_large_image");

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
      setPathLockMode(
        (link.pathLockMode ||
          (link as any).path_lock_mode ||
          "off") as "off" | "strict" | "funnel",
      );
      setPathLockPrefix(
        link.pathLockPrefix || (link as any).path_lock_prefix || "",
      );
      setPathLockMessage(
        link.pathLockMessage || (link as any).path_lock_message || "",
      );
      setPathLockPassword(
        link.pathLockPassword || (link as any).path_lock_password || "",
      );

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

      const initialPixels =
        (link as any).pixels ||
        (link as any).pixel_ids ||
        (link as any).pixelIds ||
        [];
      setSelectedPixels(
        Array.isArray(initialPixels)
          ? initialPixels.map((p: any) =>
              typeof p === "string" ? p : p.id || p.platform || String(p)
            )
          : []
      );
    } else {
      // Create mode reset
      setTargetUrl(initialUrl || "");
      setDomainName("lsho.cc");
      setSlug("");
      setIsActive(true);
      setTagsInput("");
      setOgTitle("");
      setOgDescription("");
      setOgImage("");
      setTwitterCard("summary_large_image");
      setSocialPlatformPreview("x");
      setPreviewImage("");
      setSelectedPixels([]);
      setRoutingRules([]);
      setHideReferrer(false);
      setIsCloaked(false);
      setPassword("");
      setShowPassword(false);
      setHasClickLimit(false);
      setMaxClicks("");
      setFallbackUrl("");
      setExpiresAt("");
      setPathLockMode("off");
      setPathLockPrefix("");
      setPathLockMessage("");
      setPathLockPassword("");
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
    setActiveTab("link");
  }, [isOpen, isEditMode, link, initialUrl]);

  // Validation functions
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

  // Instant Banner Upload Handler
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
      setIsUploadingImage(true);
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

      setPreviewImage(dataUrl);

      const uploadRes = await cfUploadImage(dataUrl, "Banners");
      if (uploadRes?.url) {
        setOgImage(uploadRes.url);
      } else {
        setOgImage(dataUrl);
      }

      setTwitterCard("summary_large_image");
      showToast.success("Banner uploaded successfully!");
    } catch (err) {
      console.error("Banner upload error:", err);
      showToast.error("Error uploading banner image.");
    } finally {
      setIsUploadingImage(false);
      if (bannerInputRef.current) bannerInputRef.current.value = "";
    }
  };

  // Compute final URL with UTM
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
      if (errors.targetUrl || errors.domainName || errors.slug) {
        setActiveTab("link");
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

    // Free / Starter plan security checks: Dynamic routing is strictly reserved for paid plans
    if (!isProPlan) {
      if (
        (routingRules && routingRules.length > 0) ||
        (compiledRules && compiledRules.length > 0) ||
        (geoTargeting && Object.keys(geoTargeting).length > 0) ||
        (deviceTargeting && Object.keys(deviceTargeting).length > 0)
      ) {
        triggerPlanUpgrade({
          reason: "Le système de routage dynamique intelligent est strictement réservé aux forfaits payants (Pro, Business et Enterprise).",
          featureName: "Dynamic Routing",
          targetPlan: "PRO",
        });
        showToast.error("Le routage dynamique requiert un forfait payant (Pro, Business ou Enterprise).");
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
      if (pathLockMode && pathLockMode !== "off") {
        triggerPlanUpgrade({
          reason: "PathLock™ restricted browsing requires the Pro plan.",
          featureName: "PathLock™ Restricted Browsing",
          targetPlan: "PRO",
        });
        setIsSubmitting(false);
        return;
      }
      if (abVariations && abVariations.length > 0) {
        triggerPlanUpgrade({
          reason: "A/B testing requires the Pro plan.",
          featureName: "A/B Split Testing",
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
    const cleanSlug = slug
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9_-]/g, "");

    try {
      let finalOgImage = (ogImage || previewImage || "").trim();
      if (finalOgImage && finalOgImage.startsWith("data:")) {
        const uploadRes = await cfUploadImage(finalOgImage, "Banners");
        if (uploadRes?.url) {
          finalOgImage = uploadRes.url;
        }
      }

      const isDefaultCard = twitterCard === "summary";
      const finalBannerStyle: "default_banner" | "large_banner" =
        isDefaultCard ? "default_banner" : "large_banner";
      const resolvedTwitterCard: "summary" | "summary_large_image" =
        isDefaultCard ? "summary" : "summary_large_image";

      if (finalOgImage.includes("/api/og") || finalOgImage.includes("default_banner")) {
        finalOgImage = "";
      }

      if (isEditMode && link) {
        // UPDATE EXISTING LINK
        const resolvedExpiresAt =
          isProPlan && expiresAt ? new Date(expiresAt).toISOString() : null;
        const isEditExpired = Boolean(
          resolvedExpiresAt && new Date(resolvedExpiresAt).getTime() <= Date.now(),
        );
        const finalEditActive = !isEditExpired && Boolean(isActive);

        const updates: any = {
          userId: userId || link.userId,
          targetUrl: finalTargetUrl,
          slug: cleanSlug || link.slug,
          domainName: cleanDomain || link.domainName,
          isActive: finalEditActive,
          is_active: finalEditActive ? 1 : 0,
          tags: tags.length ? tags : null,
          ogTitle: ogTitle.trim() || null,
          metaTitle: ogTitle.trim() || null,
          ogDescription: ogDescription.trim() || null,
          ogImage: finalOgImage || null,
          og_image: finalOgImage || null,
          previousOgImage: link.ogImage || null,
          bannerStyle: finalBannerStyle,
          banner_style: finalBannerStyle,
          twitterCard: resolvedTwitterCard,
          twitter_card: resolvedTwitterCard,
          routingRules: compiledRules,
          routing_rules: compiledRules,
          geoTargeting: geoTargeting,
          geo_targeting: geoTargeting,
          deviceTargeting: deviceTargeting,
          device_targeting: deviceTargeting,
          isCloaked: isProPlan
            ? Boolean(isCloaked || (pathLockMode && pathLockMode !== "off"))
            : false,
          is_cloaked: isProPlan
            ? Boolean(isCloaked || (pathLockMode && pathLockMode !== "off"))
              ? 1
              : 0
            : 0,
          hideReferrer,
          expiresAt: resolvedExpiresAt,
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
          pathLockMode: isProPlan ? pathLockMode : "off",
          path_lock_mode: isProPlan ? pathLockMode : "off",
          pathLockPrefix:
            !isProPlan || pathLockMode === "off"
              ? null
              : pathLockMode === "strict"
                ? (() => {
                    try {
                      const u = new URL(
                        finalTargetUrl.startsWith("http")
                          ? finalTargetUrl
                          : `https://${finalTargetUrl}`,
                      );
                      return (
                        u.pathname.replace(/^\/+/, "").replace(/\/+$/, "") || "/"
                      );
                    } catch {
                      return "/";
                    }
                  })()
                : pathLockPrefix.trim() || "/",
          path_lock_prefix:
            !isProPlan || pathLockMode === "off"
              ? null
              : pathLockMode === "strict"
                ? (() => {
                    try {
                      const u = new URL(
                        finalTargetUrl.startsWith("http")
                          ? finalTargetUrl
                          : `https://${finalTargetUrl}`,
                      );
                      return (
                        u.pathname.replace(/^\/+/, "").replace(/\/+$/, "") || "/"
                      );
                    } catch {
                      return "/";
                    }
                  })()
                : pathLockPrefix.trim() || "/",
          pathLockMessage:
            isProPlan && pathLockMode !== "off" && pathLockMessage.trim()
              ? pathLockMessage.trim()
              : null,
          path_lock_message:
            isProPlan && pathLockMode !== "off" && pathLockMessage.trim()
              ? pathLockMessage.trim()
              : null,
          pathLockPassword:
            isProPlan && pathLockMode !== "off" && pathLockPassword.trim()
              ? pathLockPassword.trim()
              : null,
          path_lock_password:
            isProPlan && pathLockMode !== "off" && pathLockPassword.trim()
              ? pathLockPassword.trim()
              : null,
          pixels: selectedPixels,
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
          pixels: selectedPixels,
          tags: updates.tags || [],
          ogTitle: updates.ogTitle || undefined,
          metaTitle: updates.metaTitle || undefined,
          ogDescription: updates.ogDescription || undefined,
          ogImage: updates.ogImage || undefined,
          og_image: updates.og_image || undefined,
          bannerStyle: finalBannerStyle,
          banner_style: finalBannerStyle,
          twitterCard: resolvedTwitterCard,
          twitter_card: resolvedTwitterCard,
          routingRules:
            Array.isArray(compiledRules) && compiledRules.length > 0
              ? compiledRules
              : undefined,
          geoTargeting: geoTargeting || undefined,
          deviceTargeting: deviceTargeting || undefined,
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
          pathLockMode: updates.pathLockMode,
          path_lock_mode: updates.path_lock_mode,
          pathLockPrefix: updates.pathLockPrefix || undefined,
          path_lock_prefix: updates.path_lock_prefix || undefined,
          pathLockMessage: updates.pathLockMessage || undefined,
          path_lock_message: updates.path_lock_message || undefined,
          pathLockPassword: updates.pathLockPassword || undefined,
          path_lock_password: updates.path_lock_password || undefined,
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
        // Auto-derive locked path for strict single-page mode if not specified
        const autoStrictPrefix = (() => {
          try {
            const u = new URL(
              finalTargetUrl.startsWith("http")
                ? finalTargetUrl
                : `https://${finalTargetUrl}`,
            );
            return u.pathname.replace(/^\/+/, "").replace(/\/+$/, "");
          } catch {
            return "";
          }
        })();
        const resolvedPathLockPrefix =
          !isProPlan || pathLockMode === "off"
            ? undefined
            : pathLockMode === "strict"
              ? autoStrictPrefix || "/"
              : pathLockPrefix.trim() || "/";

        // CREATE NEW LINK
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
          routingRules:
            Array.isArray(compiledRules) && compiledRules.length > 0
              ? compiledRules
              : undefined,
          geoTargeting: geoTargeting || undefined,
          deviceTargeting: deviceTargeting || undefined,
          isCloaked: isProPlan
            ? Boolean(isCloaked || (pathLockMode && pathLockMode !== "off"))
            : false,
          is_cloaked: isProPlan
            ? Boolean(isCloaked || (pathLockMode && pathLockMode !== "off"))
              ? 1
              : 0
            : 0,
          metaTitle: ogTitle || undefined,
          ogTitle: ogTitle || undefined,
          ogDescription: ogDescription || undefined,
          ogImage: finalOgImage || undefined,
          og_image: finalOgImage || undefined,
          bannerStyle: finalBannerStyle,
          banner_style: finalBannerStyle,
          twitterCard: resolvedTwitterCard,
          twitter_card: resolvedTwitterCard,
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
          isActive:
            (!expiresAt || new Date(expiresAt).getTime() > Date.now()) &&
            Boolean(isActive),
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
          pathLockMode: isProPlan ? pathLockMode : "off",
          path_lock_mode: isProPlan ? pathLockMode : "off",
          pathLockPrefix: resolvedPathLockPrefix,
          path_lock_prefix: resolvedPathLockPrefix,
          pathLockMessage:
            isProPlan && pathLockMode !== "off" && pathLockMessage.trim()
              ? pathLockMessage.trim()
              : undefined,
          path_lock_message:
            isProPlan && pathLockMode !== "off" && pathLockMessage.trim()
              ? pathLockMessage.trim()
              : undefined,
          pathLockPassword:
            isProPlan && pathLockMode !== "off" && pathLockPassword.trim()
              ? pathLockPassword.trim()
              : undefined,
          path_lock_password:
            isProPlan && pathLockMode !== "off" && pathLockPassword.trim()
              ? pathLockPassword.trim()
              : undefined,
          pixels: selectedPixels,
        };

        const isNewLinkExpired = Boolean(
          expiresAt && new Date(expiresAt).getTime() <= Date.now(),
        );
        const finalCreateActive = !isNewLinkExpired && Boolean(isActive);

        const res = await cfCreateLink({
          userId: effectiveUserId,
          userEmail: effectiveUserEmail || session?.user?.email || undefined,
          userName: session?.user?.name || convexUser?.name || undefined,
          userPlan,
          plan: userPlan,
          domainName: cleanDomain,
          slug: cleanSlug,
          targetUrl: finalTargetUrl,
          geoTargeting,
          deviceTargeting,
          routingRules: compiledRules,
          pixels: selectedPixels,
          password: password.trim() || undefined,
          isCloaked: isProPlan
            ? Boolean(isCloaked || (pathLockMode && pathLockMode !== "off"))
            : false,
          is_cloaked: isProPlan
            ? Boolean(isCloaked || (pathLockMode && pathLockMode !== "off"))
              ? 1
              : 0
            : 0,
          hideReferrer,
          metaTitle: ogTitle || undefined,
          ogTitle: ogTitle || undefined,
          ogDescription: ogDescription || undefined,
          ogImage: finalOgImage || undefined,
          bannerStyle: finalBannerStyle,
          banner_style: finalBannerStyle,
          twitterCard: resolvedTwitterCard,
          twitter_card: resolvedTwitterCard,
          tags: tags.length ? tags : undefined,
          expiresAt: expiresAt ? expiresAt : undefined,
          isActive: finalCreateActive,
          is_active: finalCreateActive ? 1 : 0,
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
          pathLockMode: isProPlan ? pathLockMode : "off",
          path_lock_mode: isProPlan ? pathLockMode : "off",
          pathLockPrefix: resolvedPathLockPrefix,
          path_lock_prefix: resolvedPathLockPrefix,
          pathLockMessage:
            isProPlan && pathLockMode !== "off" && pathLockMessage.trim()
              ? pathLockMessage.trim()
              : undefined,
          path_lock_message:
            isProPlan && pathLockMode !== "off" && pathLockMessage.trim()
              ? pathLockMessage.trim()
              : undefined,
          pathLockPassword:
            isProPlan && pathLockMode !== "off" && pathLockPassword.trim()
              ? pathLockPassword.trim()
              : undefined,
          path_lock_password:
            isProPlan && pathLockMode !== "off" && pathLockPassword.trim()
              ? pathLockPassword.trim()
              : undefined,
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
            pathLockMode: isProPlan ? pathLockMode : "off",
            path_lock_mode: isProPlan ? pathLockMode : "off",
            pathLockPrefix:
              isProPlan && pathLockMode !== "off" && pathLockPrefix.trim()
                ? pathLockPrefix.trim()
                : undefined,
            path_lock_prefix:
              isProPlan && pathLockMode !== "off" && pathLockPrefix.trim()
                ? pathLockPrefix.trim()
                : undefined,
            pathLockMessage:
              isProPlan && pathLockMode !== "off" && pathLockMessage.trim()
                ? pathLockMessage.trim()
                : undefined,
            path_lock_message:
              isProPlan && pathLockMode !== "off" && pathLockMessage.trim()
                ? pathLockMessage.trim()
                : undefined,
            pathLockPassword:
              isProPlan && pathLockMode !== "off" && pathLockPassword.trim()
                ? pathLockPassword.trim()
                : undefined,
            path_lock_password:
              isProPlan && pathLockMode !== "off" && pathLockPassword.trim()
                ? pathLockPassword.trim()
                : undefined,
            pixels: res.data.pixels || selectedPixels,
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
      const lower = msg.toLowerCase();
      if (
        msg.includes("403") ||
        lower.includes("plan_upgrade_required") ||
        lower.includes("plan_upgrade") ||
        lower.includes("forbidden") ||
        lower.includes("pro plan") ||
        lower.includes("forfait supérieur") ||
        lower.includes("forfait payant") ||
        lower.includes("réservé") ||
        lower.includes("quota")
      ) {
        triggerPlanUpgrade({
          reason: lower.includes("routage")
            ? "Le système de routage dynamique est strictement réservé aux forfaits payants."
            : (msg || "Cette fonctionnalité requiert un forfait payant supérieur."),
          featureName: "Options Avancées",
          targetPlan: "PRO",
        });
        return;
      }
      showToast.error(sanitizeClientError(msg));
    }
  };

  const activeTabIndex = DRAWER_TABS.findIndex((t) => t.id === activeTab);

  const handleNextTab = () => {
    // If moving past the first tab ("link"), validate destination, domain, and slug
    if (activeTab === "link") {
      const targetErr = checkUrlFormat(targetUrl, true);
      const domainErr = checkDomainFormat(domainName);
      const slugErr = checkSlugFormat(slug);
      if (targetErr || domainErr || slugErr) {
        setFieldErrors((prev) => ({
          ...prev,
          ...(targetErr ? { targetUrl: targetErr } : {}),
          ...(domainErr ? { domainName: domainErr } : {}),
          ...(slugErr ? { slug: slugErr } : {}),
        }));
        showToast.error("Please fill in destination URL, domain and custom slug.");
        return;
      }
    }

    if (activeTabIndex < DRAWER_TABS.length - 1) {
      setActiveTab(DRAWER_TABS[activeTabIndex + 1].id);
    }
  };

  const handlePrevTab = () => {
    if (activeTabIndex > 0) {
      setActiveTab(DRAWER_TABS[activeTabIndex - 1].id);
    } else {
      handleAnimatedClose();
    }
  };

  if (!shouldRender && !isOpen) return null;
  if (!mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[2000] overflow-hidden select-none">
      {/* Scrim backdrop overlay */}
      <div
        ref={backdropRef}
        onClick={handleAnimatedClose}
        className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-[2px] z-[2000]"
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

      {/* Drawer panel matching template layout */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-label={isEditMode ? "Edit link" : "Create link"}
        className={cn(
          "fixed top-0 right-0 bottom-0 z-[2001] flex h-full flex-col will-change-transform shadow-2xl",
          "w-full sm:w-[680px] md:w-[740px] lg:w-[780px] max-w-full",
          "bg-white dark:bg-[#0e0f12] text-[#131417] dark:text-[#f1f2f4]",
          "border-l border-[#e6e7ea] dark:border-[#22242a]",
        )}
      >
        {/* ── 1. MINIMALIST HEADER ── */}
        <header className="flex justify-between items-center px-6 pt-5 pb-3 border-b border-[#e6e7ea] dark:border-[#22242a] shrink-0">
          <b className="font-semibold text-[15px] text-[#131417] dark:text-[#f1f2f4]">
            {isEditMode ? "Edit link" : "Create link"}
          </b>
          <button
            type="button"
            onClick={handleAnimatedClose}
            aria-label="Close"
            className="text-[#6c717c] dark:text-[#8a8f9a] hover:text-[#131417] dark:hover:text-[#f1f2f4] hover:bg-[#f4f5f7] dark:hover:bg-[#16181d] text-2xl leading-none px-2 py-0.5 rounded-[6px] transition-colors cursor-pointer"
          >
            ×
          </button>
        </header>

        {/* ── 2. RESPONSIVE TAB BAR NAVIGATION ── */}
        {/* Desktop: wraps automatically (flex-wrap) if not enough width. */}
        {/* Mobile: horizontal manual scroll (overflow-x-auto whitespace-nowrap). */}
        <nav
          ref={tabsNavRef}
          aria-label="Drawer steps"
          className={cn(
            "flex items-center border-b border-[#e6e7ea] dark:border-[#22242a] px-5 sm:px-6 pt-2 pb-0 shrink-0 select-none",
            "gap-x-4 sm:gap-x-5 gap-y-1 sm:gap-y-1.5",
            // Mobile: horizontal manual scroll
            "overflow-x-auto whitespace-nowrap flex-nowrap scrollbar-none [scrollbar-width:none] [-ms-overflow-style:none]",
            // Desktop: automatic wrap to next line if space is constrained
            "sm:overflow-x-visible sm:whitespace-normal sm:flex-wrap",
          )}
        >
          {DRAWER_TABS.map((tab, idx) => {
            const Icon = tab.icon;
            const isActiveTab = activeTab === tab.id;
            const isCompleted = idx < activeTabIndex;

            return (
              <button
                key={tab.id}
                type="button"
                data-active={isActiveTab}
                onClick={() => {
                  if (tab.id === "routing" && !isProPlan) {
                    triggerPlanUpgrade({
                      featureName: "Dynamic Smart Routing",
                      reason: "Le système de routage dynamique est strictement réservé aux forfaits payants (Pro, Business et Enterprise).",
                      targetPlan: "PRO",
                    });
                    setActiveTab("routing");
                    return;
                  }

                  // If leaving tab 0, validate destination URL
                  if (activeTab === "link" && tab.id !== "link") {
                    const targetErr = checkUrlFormat(targetUrl, true);
                    const domainErr = checkDomainFormat(domainName);
                    const slugErr = checkSlugFormat(slug);
                    if (targetErr || domainErr || slugErr) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        ...(targetErr ? { targetUrl: targetErr } : {}),
                        ...(domainErr ? { domainName: domainErr } : {}),
                        ...(slugErr ? { slug: slugErr } : {}),
                      }));
                      showToast.error("Please fill in destination URL, domain and custom slug.");
                      return;
                    }
                  }
                  setActiveTab(tab.id);
                }}
                className={cn(
                  "text-[13px] font-medium py-2.5 border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 sm:shrink",
                  isActiveTab
                    ? "border-[#1d5fe0] dark:border-[#3b82f6] text-[#131417] dark:text-[#f1f2f4] font-semibold"
                    : isCompleted
                      ? "border-transparent text-[#131417] dark:text-[#f1f2f4] hover:text-[#1d5fe0] dark:hover:text-[#3b82f6]"
                      : "border-transparent text-[#6c717c] dark:text-[#8a8f9a] hover:text-[#131417] dark:hover:text-[#f1f2f4]",
                )}
              >
                <Icon
                  className={cn(
                    "w-3.5 h-3.5",
                    isActiveTab
                      ? "text-[#1d5fe0] dark:text-[#3b82f6]"
                      : "opacity-70",
                  )}
                />
                <span>{tab.label}</span>
                {tab.isPro && !isProPlan && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30 tracking-wider">
                    PRO
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ── 3. MAIN TABBED WORKSPACE ── */}
        <main className="flex-1 flex overflow-hidden relative">
          <form
            id="link-drawer-form"
            onSubmit={handleSubmit}
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-6 py-5 drawer-scroll-hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {activeTab === "link" && (
              <SectionLink
                isEditMode={isEditMode}
                targetUrl={targetUrl}
                setTargetUrl={setTargetUrl}
                domainName={domainName}
                setDomainName={setDomainName}
                customDomains={customDomains}
                slug={slug}
                setSlug={setSlug}
                tagsInput={tagsInput}
                setTagsInput={setTagsInput}
                fieldErrors={fieldErrors}
                setFieldErrors={setFieldErrors}
                checkUrlFormat={checkUrlFormat}
                checkDomainFormat={checkDomainFormat}
                checkSlugFormat={checkSlugFormat}
              />
            )}

            {activeTab === "social_tracking" && (
              <SectionSocialTracking
                slug={slug}
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
                selectedPixels={selectedPixels}
                setSelectedPixels={setSelectedPixels}
                availablePixels={availablePixels}
                isProPlan={isProPlan}
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
              <SectionProtectionExpiry
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
                pathLockMode={pathLockMode}
                setPathLockMode={setPathLockMode}
                pathLockPrefix={pathLockPrefix}
                setPathLockPrefix={setPathLockPrefix}
                pathLockMessage={pathLockMessage}
                setPathLockMessage={setPathLockMessage}
                pathLockPassword={pathLockPassword}
                setPathLockPassword={setPathLockPassword}
                targetUrl={targetUrl}
                fieldErrors={fieldErrors}
                setFieldErrors={setFieldErrors}
                checkExpiresAtFormat={checkExpiresAtFormat}
              />
            )}

            {activeTab === "ab_testing" && (
              <SectionAbTesting
                isProPlan={isProPlan}
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
              <SectionAdvanced
                redirectType={redirectType}
                setRedirectType={setRedirectType}
                passParams={passParams}
                setPassParams={setPassParams}
                isActive={isActive}
                setIsActive={setIsActive}
              />
            )}

            {activeTab === "review" && (
              <SectionReview
                isEditMode={isEditMode}
                domainName={domainName}
                slug={slug}
                targetUrl={targetUrl}
                computeFinalUrlWithUtm={computeFinalUrlWithUtm}
                ogTitle={ogTitle}
                ogDescription={ogDescription}
                ogImage={ogImage}
                twitterCard={twitterCard}
                utmSource={utmSource}
                utmMedium={utmMedium}
                utmCampaign={utmCampaign}
                password={password}
                expiresAt={expiresAt}
                hasClickLimit={hasClickLimit}
                maxClicks={maxClicks}
                fallbackUrl={fallbackUrl}
                pathLockMode={pathLockMode}
                pathLockPrefix={pathLockPrefix}
                isCloaked={isCloaked}
                hideReferrer={hideReferrer}
                routingRulesCount={routingRules.length}
                abVariationsCount={abVariations.length}
                mainWeight={mainWeight}
                redirectType={redirectType}
                passParams={passParams}
                isActive={isActive}
                tagsInput={tagsInput}
                onNavigateTab={(tabId) => setActiveTab(tabId)}
                isSubmitting={isSubmitting}
              />
            )}
          </form>
        </main>

        {/* ── 4. FOOTER (Matching template style) ── */}
        <footer className="flex justify-between items-center gap-3 px-6 py-3.5 border-t border-[#e6e7ea] dark:border-[#22242a] bg-white dark:bg-[#0e0f12] shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevTab}
              disabled={isSubmitting}
              className="text-sm font-medium text-[#131417] dark:text-[#f1f2f4] hover:bg-[#f4f5f7] dark:hover:bg-[#16181d] px-4 py-2 rounded-lg transition-colors cursor-pointer"
            >
              {activeTabIndex > 0 ? "Back" : "Cancel"}
            </button>

            {isEditMode && (
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                disabled={isSubmitting}
                className="text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab !== "review" ? (
              <button
                type="button"
                onClick={handleNextTab}
                className="bg-[#1d5fe0] dark:bg-[#3b82f6] hover:bg-[#154fc0] dark:hover:bg-[#2563eb] text-white font-medium text-sm px-5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                Continue
              </button>
            ) : (
              <button
                type="submit"
                form="link-drawer-form"
                disabled={isSubmitting}
                className="bg-[#1d5fe0] dark:bg-[#3b82f6] hover:bg-[#154fc0] dark:hover:bg-[#2563eb] text-white font-medium text-sm px-5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isEditMode ? "Saving..." : "Creating..."}</span>
                  </>
                ) : (
                  <span>{isEditMode ? "Save Changes" : "Create Link"}</span>
                )}
              </button>
            )}
          </div>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
