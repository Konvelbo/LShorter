"use client";

import React, {
  Suspense,
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useId,
} from "react";
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
  cfNormalizeImageUrl,
  cfInvalidateCache,
  sanitizeClientError,
} from "@/lib/cloudflare-api";
import { compressImageFile } from "@/lib/image-compress";
import { ShortLink } from "@/types";
import type { RoutingRule } from "../routing-rules-editor";
import { compileRoutingRules } from "@/lib/routing-utils";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { guardLinkCreation } from "@/lib/billing/quota-service";
import { RESERVED_SLUGS } from "@/lib/security-utils";
import { showToast } from "@/components/ui/toast-provider";
import { useUndoDelete } from "@/components/ui/undo-delete-provider";
import { cn } from "@/lib/utils";
import { Trash2, Loader2 } from "lucide-react";

import { LinkDrawerProps, DRAWER_TABS, DrawerTabId } from "./types";
import { SectionLink } from "./sections/section-link";
import { useI18n } from "@/components/providers/i18n-provider";

const DRAWER_TAB_FR_LABELS: Record<DrawerTabId, string> = {
  link: "Lien",
  social_tracking: "Réseaux sociaux, suivi & pixels",
  routing: "Routage",
  protection: "Protection & expiration",
  ab_testing: "Tests A/B",
  advanced: "Avancé",
  review: "Résumé",
};

const loadSectionSocialTracking = () =>
  import("./sections/section-social-tracking").then((m) => ({
    default: m.SectionSocialTracking,
  }));
const loadSectionRouting = () =>
  import("./sections/section-routing").then((m) => ({
    default: m.SectionRouting,
  }));
const loadSectionProtectionExpiry = () =>
  import("./sections/section-protection-expiry").then((m) => ({
    default: m.SectionProtectionExpiry,
  }));
const loadSectionAbTesting = () =>
  import("./sections/section-ab-testing").then((m) => ({
    default: m.SectionAbTesting,
  }));
const loadSectionAdvanced = () =>
  import("./sections/section-advanced").then((m) => ({
    default: m.SectionAdvanced,
  }));
const loadSectionReview = () =>
  import("./sections/section-review").then((m) => ({
    default: m.SectionReview,
  }));

const SectionSocialTracking = React.lazy(loadSectionSocialTracking);
const SectionRouting = React.lazy(loadSectionRouting);
const SectionProtectionExpiry = React.lazy(loadSectionProtectionExpiry);
const SectionAbTesting = React.lazy(loadSectionAbTesting);
const SectionAdvanced = React.lazy(loadSectionAdvanced);
const SectionReview = React.lazy(loadSectionReview);

let hasPreloadedSecondaryTabs = false;
function preloadSecondaryDrawerTabs() {
  if (hasPreloadedSecondaryTabs) return;
  hasPreloadedSecondaryTabs = true;
  void Promise.allSettled([
    loadSectionSocialTracking(),
    loadSectionRouting(),
    loadSectionProtectionExpiry(),
    loadSectionAbTesting(),
    loadSectionAdvanced(),
    loadSectionReview(),
  ]);
}

// Pure validation helpers (module-scoped so references remain stable across renders)
function checkUrlFormat(val: string, isRequired = true, isFr = false): string {
  const trimmed = val.trim();
  if (!trimmed) {
    return isRequired
      ? (isFr ? "L'URL de destination est requise." : "Destination URL is required.")
      : "";
  }
  if (/\s/.test(trimmed)) {
    return isFr ? "L'URL ne doit pas contenir d'espaces." : "URL must not contain spaces.";
  }
  if (/^(javascript|data|vbscript|file|blob|ftp|about):/i.test(trimmed)) {
    return isFr
      ? "Protocole d'URL invalide. Seuls HTTP et HTTPS sont autorisés."
      : "Invalid URL scheme. Only HTTP and HTTPS protocols are permitted.";
  }
  if (
    trimmed.includes("169.254.169.254") ||
    trimmed.includes("metadata.google.internal") ||
    trimmed.includes("100.100.100.200")
  ) {
    return isFr
      ? "Les adresses internes ou de métadonnées cloud ne sont pas autorisées."
      : "Internal or cloud metadata addresses are not permitted.";
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
      return isFr
        ? "Nom de domaine invalide (ex. https://example.com)."
        : "Invalid domain name (e.g. https://example.com).";
    }
  } catch {
    return isFr
      ? "Format d'URL invalide. Attendu : https://example.com/page"
      : "Invalid URL format. Expected: https://example.com/page";
  }
  return "";
}

function checkDomainFormat(val: string, isFr = false): string {
  const trimmed = val.trim();
  if (!trimmed) {
    return isFr ? "Le nom de domaine est requis." : "Domain name is required.";
  }
  if (/\s/.test(trimmed)) {
    return isFr
      ? "Le nom de domaine ne doit pas contenir d'espaces."
      : "Domain name must not contain spaces.";
  }
  const cleaned = trimmed.replace(/^https?:\/\//i, "").replace(/\/.*$/, "");
  if (
    !/^[a-zA-Z0-9.-]+$/.test(cleaned) ||
    (!cleaned.includes(".") && cleaned !== "localhost")
  ) {
    return isFr
      ? "Nom de domaine invalide (ex. example.com ou lsho.cc)."
      : "Invalid domain name (e.g. example.com or lsho.cc).";
  }
  return "";
}

function checkSlugFormat(val: string, isFr = false): string {
  const trimmed = val.trim();
  if (!trimmed) {
    return isFr ? "Le slug personnalisé est requis." : "Custom slug is required.";
  }
  if (trimmed.length < 2) {
    return isFr
      ? "Le slug doit contenir au moins 2 caractères."
      : "Slug must be at least 2 characters.";
  }
  if (!/^[a-zA-Z0-9-_]+$/.test(trimmed)) {
    return isFr
      ? "Le slug ne peut contenir que des lettres, chiffres, tirets et underscores."
      : "Slug can only contain letters, numbers, hyphens, and underscores.";
  }
  if (RESERVED_SLUGS.has(trimmed.toLowerCase())) {
    return isFr
      ? `Le slug « ${trimmed} » est réservé et ne peut pas être utilisé.`
      : `The slug '${trimmed}' is reserved and cannot be used.`;
  }
  return "";
}

function checkPasswordFormat(val: string, isFr = false): string {
  if (!val) return "";
  if (val.length < 4) {
    return isFr
      ? "Le mot de passe doit contenir au moins 4 caractères."
      : "Password must be at least 4 characters.";
  }
  return "";
}

function checkMaxClicksFormat(val: number | string, enabled: boolean, isFr = false): string {
  if (!enabled) return "";
  const num = Number(val);
  if (!val || isNaN(num) || num <= 0) {
    return isFr
      ? "La limite de clics maximum doit être supérieure à 0."
      : "Maximum clicks limit must be greater than 0.";
  }
  return "";
}

function checkExpiresAtFormat(val: string, isFr = false): string {
  if (!val) return "";
  const expDate = new Date(val);
  if (isNaN(expDate.getTime())) {
    return isFr ? "Date d'expiration invalide." : "Invalid expiration date.";
  }
  if (expDate.getTime() <= Date.now()) {
    return isFr
      ? "La date d'expiration doit être dans le futur."
      : "Expiration date must be in the future.";
  }
  return "";
}

function parseTags(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.map((t) => String(t).trim()).filter(Boolean);
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.map((t: any) => String(t).trim()).filter(Boolean);
      }
      if (typeof parsed === "string") {
        return parsed.split(",").map((t: string) => t.trim()).filter(Boolean);
      }
    } catch {
      return raw.split(",").map((t) => t.trim()).filter(Boolean);
    }
  }
  return [];
}

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function LinkDrawer({
  isOpen,
  onClose,
  mode = "create",
  link = null,
  initialUrl = "",
  onSuccess,
  linksCount,
}: LinkDrawerProps) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const drawerFormId = useId();
  const isEditMode = mode === "edit" || Boolean(link);

  const validateUrl = React.useCallback(
    (val: string, isRequired = true) => checkUrlFormat(val, isRequired, isFr),
    [isFr],
  );
  const validateDomain = React.useCallback(
    (val: string) => checkDomainFormat(val, isFr),
    [isFr],
  );
  const validateSlug = React.useCallback(
    (val: string) => checkSlugFormat(val, isFr),
    [isFr],
  );
  const validateExpiresAt = React.useCallback(
    (val: string) => checkExpiresAtFormat(val, isFr),
    [isFr],
  );

  const { data: session } = useSession();
  const sessionUserId = session?.user?.id;
  const sessionEmail = session?.user?.email || "";

  // Defer Convex subscription until after the 220ms open slide settles (and skip when closed)
  // so idle drawers consume zero subscriptions and open animations never suffer mid-slide re-renders.
  const [isConvexQueryActive, setIsConvexQueryActive] = useState(false);
  useEffect(() => {
    if (!isOpen) {
      setIsConvexQueryActive(false);
      return;
    }
    const t = setTimeout(() => setIsConvexQueryActive(true), 260);
    return () => clearTimeout(t);
  }, [isOpen]);

  const convexUser = useQuery(
    api.users.getCurrentUser,
    isConvexQueryActive &&
      ((sessionUserId && sessionUserId !== "usr_anonymous") || sessionEmail)
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

  const [runtimePlan, setRuntimePlan] = useState<string | null>(null);
  const [cachedStoragePlan, setCachedStoragePlan] = useState<string | null>(null);

  useEffect(() => {
    try {
      const savedPlan = localStorage.getItem("lshorter_user_plan");
      if (savedPlan) setCachedStoragePlan(savedPlan.toUpperCase());
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined" && convexUser?.plan) {
      const upper = convexUser.plan.toUpperCase();
      setCachedStoragePlan(upper);
      try {
        localStorage.setItem("lshorter_user_plan", upper);
      } catch {}
    }
  }, [convexUser?.plan]);

  useEffect(() => {
    const handlePlanUpdated = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.plan) {
        const upper = String(detail.plan).toUpperCase();
        setRuntimePlan(upper);
        setCachedStoragePlan(upper);
      }
    };
    window.addEventListener("lshorter_plan_updated", handlePlanUpdated);
    return () => window.removeEventListener("lshorter_plan_updated", handlePlanUpdated);
  }, []);

  const rawUserPlan = (
    runtimePlan ||
    convexUser?.plan ||
    (session?.user as any)?.plan ||
    cachedStoragePlan ||
    "FREE"
  ).toUpperCase();

  const userPlan =
    rawUserPlan === "FREEMIUM" || rawUserPlan === "STARTER" || rawUserPlan === "FREE"
      ? "FREE"
      : rawUserPlan;

  const isProPlan =
    userPlan === "PRO" ||
    userPlan === "BUSINESS" ||
    userPlan === "ENTERPRISE";

  const scrollContainerRef = useRef<HTMLFormElement>(null);
  const tabsNavRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLElement>(null);

  const { triggerUndoDelete } = useUndoDelete();

  const [mounted, setMounted] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const [isBodyWarm, setIsBodyWarm] = useState(isOpen);
  const [isShadowActive, setIsShadowActive] = useState(isOpen);

  // Pre-mount portal shell on client and warm up initial tab DOM in idle time
  // so clicking to open transitions immediately on Frame 1 (<16ms) with zero cold-mount cost.
  useEffect(() => {
    setMounted(true);
    const rAF = requestAnimationFrame(() => {
      setPortalReady(true);
    });
    const ric =
      typeof window !== "undefined" && "requestIdleCallback" in window
        ? (window as any).requestIdleCallback(() => setIsBodyWarm(true), {
            timeout: 400,
          })
        : setTimeout(() => setIsBodyWarm(true), 220);

    return () => {
      cancelAnimationFrame(rAF);
      if (typeof window !== "undefined" && "cancelIdleCallback" in window) {
        (window as any).cancelIdleCallback(ric);
      } else {
        clearTimeout(ric);
      }
    };
  }, []);

  // Active Tab state
  const [activeTab, setActiveTab] = useState<DrawerTabId>("link");
  const openedAtRef = useRef<number>(0);

  // Hardware-accelerated CSS transition lifecycle (pure state, zero close delay timers)
  useEffect(() => {
    if (!isOpen) return;
    openedAtRef.current = Date.now();
    setIsBodyWarm(true);
    setIsShadowActive(true);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("lshorter_drawer_opened"));
    }
    // Preload secondary tab chunks right after the 220ms slide-in completes
    const preloadTimer = setTimeout(() => {
      preloadSecondaryDrawerTabs();
    }, 260);

    return () => {
      clearTimeout(preloadTimer);
    };
  }, [isOpen]);

  const isShown = isOpen && portalReady;
  const shouldRenderBody = isBodyWarm || isOpen;

  // Listen for Escape key and trap Tab focus inside the open dialog panel
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = panelRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (!panelRef.current.contains(active) || active === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (!panelRef.current.contains(active) || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Reset scroll position when switching tabs without triggering layout thrashing on initial open
  useEffect(() => {
    if (!isOpen) return;
    const scroller = scrollContainerRef.current;
    if (scroller && scroller.scrollTop !== 0) {
      scroller.scrollTop = 0;
    }
    const nav = tabsNavRef.current;
    if (!nav) return;
    if (activeTab === "link") {
      if (nav.scrollLeft !== 0) nav.scrollLeft = 0;
      return;
    }
    const activeBtn = nav.querySelector<HTMLButtonElement>('[data-active="true"]');
    if (activeBtn && nav.scrollWidth > nav.clientWidth) {
      const targetLeft =
        activeBtn.offsetLeft - nav.clientWidth / 2 + activeBtn.offsetWidth / 2;
      nav.scrollTo({
        left: Math.max(0, targetLeft),
        behavior: "smooth",
      });
    }
  }, [activeTab, isOpen]);

  // 1. General Link inputs
  const [targetUrl, setTargetUrl] = useState("");
  const [domainName, setDomainName] = useState("lsho.cc");
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
  const rawUploadedBannerFileRef = useRef<File | null>(null);
  const originalEditOgImageRef = useRef<string>("");
  const originalEditCardRef = useRef<"summary_large_image" | "summary">("summary_large_image");
  const bannerCropReqIdRef = useRef(0);
  const tabSwitchSeqRef = useRef(0);
  const pendingCropRef = useRef<
    (() => Promise<{
      file: File | null;
      originalFile?: File | null;
      dataUrl: string;
      format: "summary_large_image" | "summary";
    } | null>) | null
  >(null);

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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [, setHasAttemptedSubmit] = useState(false);

  // Dynamically retrieve user's custom domains and retargeting pixels from Cloudflare API
  // Deferred past the 220ms slide-in transition to eliminate mid-animation re-render jank
  useEffect(() => {
    if (userId && userId !== "usr_anonymous" && isOpen) {
      const timer = setTimeout(() => {
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
      }, 260);

      return () => clearTimeout(timer);
    }
  }, [userId, isOpen]);

  // Synchronously batch form initialization before browser paint (React 19 batches all updates in useLayoutEffect into 1 commit)
  const initializedKeyRef = useRef<string | null>(null);
  useIsomorphicLayoutEffect(() => {
    if (!isOpen) {
      initializedKeyRef.current = null;
      bannerCropReqIdRef.current += 1;
      tabSwitchSeqRef.current += 1;
      pendingCropRef.current = null;
      setIsUploadingImage(false);
      return;
    }

    const currentInitKey =
      isEditMode && link
        ? `edit_${link.id || link.slug || "edit_link"}`
        : `create_${initialUrl || ""}`;

    if (initializedKeyRef.current === currentInitKey) {
      return;
    }
    initializedKeyRef.current = currentInitKey;
      if (isEditMode && link) {
        setTargetUrl(link.targetUrl || "");
        setDomainName(link.domainName || "");
        setSlug(link.slug || "");
        const expTime = (link as any).expires_at || (link as any).expiresAt;
        const isExp = Boolean(
          expTime && new Date(expTime).getTime() <= Date.now(),
        );
        setIsActive(
          !isExp && link.isActive !== false && (link as any).is_active !== 0,
        );
        setTagsInput(parseTags(link.tags ?? (link as any).tags).join(", "));

        setOgTitle(
          link.ogTitle || link.metaTitle || (link as any).og_title || "",
        );
        setOgDescription(
          link.ogDescription || (link as any).og_description || "",
        );
        const initialLinkOgImg = link.ogImage || (link as any).og_image || "";
        setOgImage(initialLinkOgImg);
        setPreviewImage("");
        rawUploadedBannerFileRef.current = null;
        bannerCropReqIdRef.current += 1;
        const rawCard = link.twitterCard || (link as any).twitter_card;
        const rawStyle =
          (link as any).bannerStyle || (link as any).banner_style;
        const isLarge =
          rawCard === "summary_large_image" || rawStyle === "large_banner";
        const isDefault =
          (rawCard === "summary" || rawStyle === "default_banner") && !isLarge;
        const initialCard = isDefault ? "summary" : "summary_large_image";
        setTwitterCard(initialCard);
        originalEditOgImageRef.current = initialLinkOgImg;
        originalEditCardRef.current = initialCard;

        let parsedRules: RoutingRule[] = [];
        const rawRoutingRules =
          link.routingRules || (link as any).routing_rules;
        if (rawRoutingRules) {
          try {
            const rawParsed =
              typeof rawRoutingRules === "string"
                ? JSON.parse(rawRoutingRules)
                : rawRoutingRules;
            if (Array.isArray(rawParsed)) {
              parsedRules = rawParsed.map((r: any, idx: number) => {
                if (r && Array.isArray(r.conditions)) return r;
                const typeMap: Record<string, string> = {
                  country: "pays",
                  device: "appareil",
                  browser: "navigateur",
                  os: "plateforme",
                };
                const ruleType = typeMap[r?.type] || r?.type || "pays";
                return {
                  id: r?.id || `r_${idx}`,
                  title: r?.title || `Rule ${idx + 1}`,
                  isCollapsed: false,
                  conditions: [
                    {
                      id: `c_${idx}`,
                      type: ruleType,
                      operator: r?.operator || "est",
                      value: r?.match || r?.value || "FR",
                    },
                  ],
                  destinationUrl: r?.target || r?.destinationUrl || "",
                };
              });
            }
          } catch {
            parsedRules = [];
          }
        } else if (
          link.geoTargeting ||
          (link as any).geo_targeting ||
          link.deviceTargeting ||
          (link as any).device_targeting
        ) {
          try {
            const rawGeo = link.geoTargeting || (link as any).geo_targeting;
            const rawDev =
              link.deviceTargeting || (link as any).device_targeting;
            const geoObj =
              typeof rawGeo === "string" ? JSON.parse(rawGeo) : rawGeo;
            const devObj =
              typeof rawDev === "string" ? JSON.parse(rawDev) : rawDev;

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
          } catch {}
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
            ? String(link.expiresAt || (link as any).expires_at).substring(
                0,
                16,
              )
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

        const rawVars =
          (link as any).abVariations || (link as any).ab_variations;
        if (rawVars) {
          let parsedVars: any = [];
          try {
            parsedVars =
              typeof rawVars === "string" ? JSON.parse(rawVars) : rawVars;
          } catch {
            parsedVars = [];
          }
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

        try {
          const urlObj = new URL(link.targetUrl);
          setUtmSource(urlObj.searchParams.get("utm_source") || "");
          setUtmMedium(urlObj.searchParams.get("utm_medium") || "");
          setUtmCampaign(urlObj.searchParams.get("utm_campaign") || "");
          setUtmTerm(urlObj.searchParams.get("utm_term") || "");
          setUtmContent(urlObj.searchParams.get("utm_content") || "");
        } catch {
          setUtmSource("");
          setUtmMedium("");
          setUtmCampaign("");
          setUtmTerm("");
          setUtmContent("");
        }

        const initialPixels =
          (link as any).pixels ||
          (link as any).pixel_ids ||
          (link as any).pixelIds ||
          [];
        setSelectedPixels(
          Array.isArray(initialPixels)
            ? initialPixels.map((p: any) =>
                typeof p === "string" ? p : p.id || p.platform || String(p),
              )
            : [],
        );
      } else {
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
        rawUploadedBannerFileRef.current = null;
        originalEditOgImageRef.current = "";
        originalEditCardRef.current = "summary_large_image";
        bannerCropReqIdRef.current += 1;
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

      setIsUploadingImage(false);
      tabSwitchSeqRef.current += 1;
      pendingCropRef.current = null;
      setFieldErrors({});
      setHasAttemptedSubmit(false);
      setActiveTab("link");
  }, [isOpen, isEditMode, link, initialUrl]);

  const uploadCompressedBannerFromSource = async (
    source: File | Blob | string,
    targetCard: "summary_large_image" | "summary",
    reqId: number
  ) => {
    const targetW = targetCard === "summary" ? 600 : 1200;
    const targetH = targetCard === "summary" ? 600 : 630;
    const compressed = await compressImageFile(source, targetW, targetH, 0.86);
    if (bannerCropReqIdRef.current !== reqId) return;

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
    if (bannerCropReqIdRef.current !== reqId) return;

    setPreviewImage(dataUrl);
    const uploadRes = await cfUploadImage(dataUrl, "Banners", {
      maxWidth: targetW,
      maxHeight: targetH,
      skipCompress: true,
    });
    if (bannerCropReqIdRef.current !== reqId) return;

    if (uploadRes?.url) {
      setOgImage(uploadRes.url);
    } else {
      setOgImage(dataUrl);
    }
  };

  // Interactive Banner Crop Result Handler: Receives cropped file + dataUrl from SectionSocialTracking inline cropper
  const handleCropCompleteResult = async ({
    file,
    originalFile,
    dataUrl,
    format,
  }: {
    file: File;
    originalFile?: File | null;
    dataUrl: string;
    format: "summary_large_image" | "summary";
  }) => {
    setTwitterCard(format);
    setPreviewImage(dataUrl);
    if (originalFile) {
      rawUploadedBannerFileRef.current = originalFile;
    } else if (!rawUploadedBannerFileRef.current) {
      rawUploadedBannerFileRef.current = file;
    }

    const reqId = ++bannerCropReqIdRef.current;
    try {
      setIsUploadingImage(true);
      const targetW = format === "summary" ? 600 : 1200;
      const targetH = format === "summary" ? 600 : 630;
      const uploadRes = await cfUploadImage(dataUrl, "Banners", {
        maxWidth: targetW,
        maxHeight: targetH,
        skipCompress: true,
      });

      if (bannerCropReqIdRef.current === reqId && uploadRes?.url) {
        setOgImage(uploadRes.url);
        showToast.success(
          isFr
            ? "Bannière recadrée et compressée avec succès !"
            : "Banner cropped and compressed successfully!",
        );
      }
    } catch (err) {
      console.error("Banner crop & upload error:", err);
      showToast.error(
        isFr
          ? "Erreur lors de l'enregistrement de la bannière."
          : "Error saving banner image.",
      );
    } finally {
      if (bannerCropReqIdRef.current === reqId) {
        setIsUploadingImage(false);
      }
    }
  };

  // Switch between Large (1200x630) and Compact (600x600) banner formats cleanly
  const handleTwitterCardChange = async (
    nextCard: "summary_large_image" | "summary"
  ) => {
    if (nextCard === twitterCard) return;
    setTwitterCard(nextCard);

    if (
      nextCard === "summary" &&
      ogImage &&
      (ogImage.includes("/api/og") || ogImage.includes("/banners/og"))
    ) {
      setOgImage("");
      setPreviewImage("");
      return;
    }

    const reqId = ++bannerCropReqIdRef.current;

    // Case 1: User uploaded a fresh file during this drawer session -> re-crop from original File
    if (rawUploadedBannerFileRef.current) {
      try {
        setIsUploadingImage(true);
        await uploadCompressedBannerFromSource(
          rawUploadedBannerFileRef.current,
          nextCard,
          reqId
        );
      } catch (err) {
        console.warn("Banner format re-crop warning:", err);
      } finally {
        if (bannerCropReqIdRef.current === reqId) {
          setIsUploadingImage(false);
        }
      }
      return;
    }

    // Case 2: Editing an existing link with a saved custom banner
    const origImg = originalEditOgImageRef.current;
    if (
      origImg &&
      !origImg.includes("/api/og") &&
      !origImg.includes("/banners/og") &&
      !origImg.includes("default_banner")
    ) {
      if (nextCard === originalEditCardRef.current) {
        setOgImage(origImg);
        setPreviewImage("");
        setIsUploadingImage(false);
        return;
      }
      try {
        setIsUploadingImage(true);
        const normalizedSrc = cfNormalizeImageUrl(origImg);
        const res = await fetch(normalizedSrc);
        if (res.ok && bannerCropReqIdRef.current === reqId) {
          const blob = await res.blob();
          if (bannerCropReqIdRef.current === reqId) {
            await uploadCompressedBannerFromSource(blob, nextCard, reqId);
          }
        }
      } catch (err) {
        console.warn("Existing banner format crop fallback:", err);
      } finally {
        if (bannerCropReqIdRef.current === reqId) {
          setIsUploadingImage(false);
        }
      }
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
      showToast.error(
        isFr
          ? "Maximum 5 variations autorisées."
          : "Maximum 5 variations allowed.",
      );
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
    showToast.success(
      isFr
        ? "Pourcentages équilibrés automatiquement !"
        : "Percentages balanced automatically!",
    );
  };

  const handleDeleteLinkWithUndo = () => {
    if (!link?.id) return;
    const deletedLink = { ...link };
    const effectiveSlug = (link.slug || slug || "").trim();

    triggerUndoDelete({
      id: link.id,
      itemType: "link",
      title: isFr ? "Lien supprimé" : "Link deleted",
      description: `/${effectiveSlug}`,
      confirmText: effectiveSlug,
      onExecute: async () => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("lshorter_link_deleted", { detail: { id: link.id } }),
          );
        }
        onClose();
        try {
          await cfDeleteLink(link.id, userId, link.slug, link.ogImage);
          cfInvalidateCache();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("lshorter_data_change"));
          }
        } catch {
          showToast.error(
            isFr
              ? "Erreur lors de la suppression du lien."
              : "Error deleting link.",
          );
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("lshorter_links_updated", { detail: deletedLink }),
            );
            window.dispatchEvent(new Event("lshorter_data_change"));
          }
          return false;
        }
      },
    });
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || isUploadingImage) return;
    setHasAttemptedSubmit(true);

    const errors: Record<string, string> = {};
    const targetErr = checkUrlFormat(targetUrl, true, isFr);
    if (targetErr) errors.targetUrl = targetErr;

    const domainErr = checkDomainFormat(domainName, isFr);
    if (domainErr) errors.domainName = domainErr;

    const slugErr = checkSlugFormat(slug, isFr);
    if (slugErr) errors.slug = slugErr;

    if (password) {
      const pwdErr = checkPasswordFormat(password, isFr);
      if (pwdErr) errors.password = pwdErr;
    }

    if (expiresAt) {
      const expErr = checkExpiresAtFormat(expiresAt, isFr);
      if (expErr) errors.expiresAt = expErr;
    }

    if (hasClickLimit) {
      const clicksErr = checkMaxClicksFormat(maxClicks, hasClickLimit, isFr);
      if (clicksErr) errors.maxClicks = clicksErr;

      if (fallbackUrl) {
        const fbErr = checkUrlFormat(fallbackUrl, false, isFr);
        if (fbErr) errors.fallbackUrl = fbErr;
      }
    }

    if (abVariations.length > 0) {
      abVariations.forEach((v, idx) => {
        if (v.url && v.url.trim()) {
          const err = checkUrlFormat(v.url, false, isFr);
          if (err)
            errors[`abVariation_${idx}`] =
              `${isFr ? "Variante" : "Variation"} ${String.fromCharCode(66 + idx)}: ${err}`;
        }
      });
      const totalWeight =
        mainWeight +
        abVariations.reduce((sum, v) => sum + (Number(v.weight) || 0), 0);
      if (totalWeight !== 100) {
        errors.abTotal = isFr
          ? `La somme des pourcentages doit être égale à 100 % (actuellement ${totalWeight} %).`
          : `The sum of percentages must equal 100% (currently ${totalWeight}%).`;
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
      showToast.error(
        isFr
          ? "Certains champs obligatoires sont manquants ou invalides."
          : "Some required fields are missing or invalid.",
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

    // Free / Starter plan link creation quota check
    if (!isEditMode && linksCount !== undefined) {
      const quotaCheck = guardLinkCreation(userPlan as any, linksCount);
      if (!quotaCheck.allowed) {
        triggerPlanUpgrade({
          reason:
            quotaCheck.reason ||
            (isFr
              ? `Limite de liens atteinte pour le forfait ${userPlan}. Passez au forfait supérieur pour créer des liens illimités.`
              : `Link limit reached for the ${userPlan} plan. Upgrade to create unlimited links.`),
          featureName: isFr ? "Quota de liens actifs" : "Active Links Quota",
          targetPlan: "PRO",
        });
        showToast.error(
          quotaCheck.reason ||
            (isFr
              ? "Limite de liens atteinte pour votre forfait."
              : "Link limit reached for your plan."),
        );
        setIsSubmitting(false);
        return;
      }
    }

    // Free / Starter plan security checks: Dynamic routing is strictly reserved for paid plans
    if (!isProPlan) {
      if (
        (routingRules && routingRules.length > 0) ||
        (compiledRules && compiledRules.length > 0) ||
        (geoTargeting && Object.keys(geoTargeting).length > 0) ||
        (deviceTargeting && Object.keys(deviceTargeting).length > 0)
      ) {
        triggerPlanUpgrade({
          reason: isFr
            ? "Le système de routage dynamique intelligent est strictement réservé aux forfaits payants (Pro, Business et Enterprise)."
            : "Dynamic smart routing is reserved for paid plans (Pro, Business, and Enterprise).",
          featureName: isFr ? "Routage dynamique" : "Dynamic Routing",
          targetPlan: "PRO",
        });
        showToast.error(
          isFr
            ? "Le routage dynamique requiert un forfait payant (Pro, Business ou Enterprise)."
            : "Dynamic routing requires a paid plan (Pro, Business, or Enterprise).",
        );
        setIsSubmitting(false);
        return;
      }
      if (password) {
        triggerPlanUpgrade({
          reason: isFr
            ? "La protection par mot de passe nécessite le forfait Pro."
            : "Password protection requires the Pro plan.",
          featureName: isFr ? "Protection par mot de passe" : "Password Protection",
          targetPlan: "PRO",
        });
        setIsSubmitting(false);
        return;
      }
      if (isCloaked) {
        triggerPlanUpgrade({
          reason: isFr
            ? "Le masquage d'URL de marque nécessite le forfait Pro."
            : "Branded URL masking requires the Pro plan.",
          featureName: isFr ? "Masquage d'URL de marque" : "Branded URL Masking",
          targetPlan: "PRO",
        });
        setIsSubmitting(false);
        return;
      }
      if (pathLockMode && pathLockMode !== "off") {
        triggerPlanUpgrade({
          reason: isFr
            ? "La navigation restreinte PathLock™ nécessite le forfait Pro."
            : "PathLock™ restricted browsing requires the Pro plan.",
          featureName: isFr ? "Navigation restreinte PathLock™" : "PathLock™ Restricted Browsing",
          targetPlan: "PRO",
        });
        setIsSubmitting(false);
        return;
      }
      if (abVariations && abVariations.length > 0) {
        triggerPlanUpgrade({
          reason: isFr
            ? "Les tests A/B nécessitent le forfait Pro."
            : "A/B testing requires the Pro plan.",
          featureName: isFr ? "Tests A/B" : "A/B Split Testing",
          targetPlan: "PRO",
        });
        setIsSubmitting(false);
        return;
      }
      if (selectedPixels && selectedPixels.length > 0) {
        triggerPlanUpgrade({
          reason: isFr
            ? "Les pixels de retargeting (Meta, Google, TikTok, LinkedIn) sont réservés aux forfaits payants (Pro, Business, Enterprise)."
            : "Retargeting Pixels (Meta, Google, TikTok, LinkedIn) are reserved for paid plans (Pro, Business, Enterprise).",
          featureName: isFr ? "Pixels de retargeting" : "Retargeting Pixels",
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
      let effectiveCard = twitterCard;
      let finalOgImage = (ogImage || previewImage || "").trim();

      // Auto-commit any pending unvalidated crop in the inline Crop Studio so the banner is never dropped
      if (pendingCropRef.current) {
        try {
          const cropped = await pendingCropRef.current();
          if (cropped?.dataUrl) {
            effectiveCard = cropped.format;
            setTwitterCard(cropped.format);
            setPreviewImage(cropped.dataUrl);
            finalOgImage = cropped.dataUrl;
          }
        } catch (cropErr) {
          console.warn("[LinkDrawer] Pending crop auto-commit warning:", cropErr);
        }
      }

      const isDefaultCard = effectiveCard === "summary";
      const finalBannerStyle: "default_banner" | "large_banner" =
        isDefaultCard ? "default_banner" : "large_banner";
      const resolvedTwitterCard: "summary" | "summary_large_image" =
        isDefaultCard ? "summary" : "summary_large_image";

      if (finalOgImage && finalOgImage.startsWith("data:")) {
        const uploadRes = await cfUploadImage(finalOgImage, "Banners", {
          maxWidth: isDefaultCard ? 600 : 1200,
          maxHeight: isDefaultCard ? 600 : 630,
          skipCompress: true,
        });
        if (uploadRes?.url) {
          finalOgImage = uploadRes.url;
        }
      }

      if (
        finalOgImage.includes("/api/og") ||
        finalOgImage.includes("/banners/og") ||
        finalOgImage.includes("default_banner")
      ) {
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
          pixels: isProPlan ? selectedPixels : [],
        };

        if (password !== undefined && password.trim() !== "••••••••") {
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

        showToast.success(
          isFr ? "Lien mis à jour avec succès !" : "Link updated successfully!",
        );
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
          pixels: isProPlan ? selectedPixels : [],
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
            twitterCard:
              res.data.twitter_card || res.data.twitterCard || resolvedTwitterCard,
            twitter_card:
              res.data.twitter_card || res.data.twitterCard || resolvedTwitterCard,
            bannerStyle:
              res.data.banner_style || res.data.bannerStyle || finalBannerStyle,
            banner_style:
              res.data.banner_style || res.data.bannerStyle || finalBannerStyle,
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

        showToast.success(
          isFr
            ? `Lien https://${cleanDomain}/${cleanSlug} créé avec succès !`
            : `Link https://${cleanDomain}/${cleanSlug} created successfully!`,
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
            ? (isFr
                ? "Le système de routage dynamique est strictement réservé aux forfaits payants."
                : "Dynamic routing is strictly reserved for paid plans.")
            : (msg ||
              (isFr
                ? "Cette fonctionnalité requiert un forfait payant supérieur."
                : "This feature requires a paid plan upgrade.")),
          featureName: isFr ? "Options avancées" : "Advanced Options",
          targetPlan: "PRO",
        });
        return;
      }
      showToast.error(sanitizeClientError(msg));
    }
  };

  const activeTabIndex = DRAWER_TABS.findIndex((t) => t.id === activeTab);

  const commitPendingCropIfNeeded = async () => {
    if (!pendingCropRef.current) return;
    try {
      const cropped = await pendingCropRef.current();
      if (cropped?.dataUrl) {
        await handleCropCompleteResult({
          file:
            cropped.file ||
            cropped.originalFile ||
            new File([], "social-banner.jpg", { type: "image/jpeg" }),
          originalFile: cropped.originalFile,
          dataUrl: cropped.dataUrl,
          format: cropped.format,
        });
      }
    } catch (err) {
      console.warn("[LinkDrawer] Auto-commit crop on tab switch warning:", err);
    }
  };

  const handleNextTab = async () => {
    if (isUploadingImage || isSubmitting) return;
    // If moving past the first tab ("link"), validate destination, domain, and slug
    if (activeTab === "link") {
      const targetErr = checkUrlFormat(targetUrl, true, isFr);
      const domainErr = checkDomainFormat(domainName, isFr);
      const slugErr = checkSlugFormat(slug, isFr);
      if (targetErr || domainErr || slugErr) {
        setFieldErrors((prev) => ({
          ...prev,
          ...(targetErr ? { targetUrl: targetErr } : {}),
          ...(domainErr ? { domainName: domainErr } : {}),
          ...(slugErr ? { slug: slugErr } : {}),
        }));
        showToast.error(
          isFr
            ? "Veuillez renseigner l'URL de destination, le domaine et le slug personnalisé."
            : "Please fill in destination URL, domain and custom slug.",
        );
        return;
      }
    }

    const seq = ++tabSwitchSeqRef.current;
    if (activeTab === "social_tracking") {
      await commitPendingCropIfNeeded();
      if (tabSwitchSeqRef.current !== seq) return;
    }

    if (activeTabIndex < DRAWER_TABS.length - 1) {
      setActiveTab(DRAWER_TABS[activeTabIndex + 1].id);
    }
  };

  const handlePrevTab = async () => {
    if (isUploadingImage || isSubmitting) return;
    const seq = ++tabSwitchSeqRef.current;
    if (activeTab === "social_tracking") {
      await commitPendingCropIfNeeded();
      if (tabSwitchSeqRef.current !== seq) return;
    }
    if (activeTabIndex > 0) {
      setActiveTab(DRAWER_TABS[activeTabIndex - 1].id);
    } else {
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      inert={!isShown ? true : undefined}
      aria-hidden={!isShown}
      className={cn(
        "fixed inset-0 z-[2000] overflow-hidden select-none",
        isShown ? "pointer-events-auto" : "pointer-events-none",
      )}
    >
      {/* Scrim backdrop overlay with pure GPU opacity fade (no full-viewport backdrop-blur shader) */}
      <div
        onClick={() => {
          // Guard against synthesized mobile ghost-clicks firing during the 220ms slide-in animation
          if (Date.now() - openedAtRef.current < 320) return;
          onClose();
        }}
        className={cn(
          "fixed inset-0 bg-black/45 dark:bg-black/70 z-[2000] cursor-pointer",
          "will-change-[opacity] transition-opacity duration-200 ease-out",
          isShown ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      />

      {/* Drawer panel with pre-mounted GPU layer and containment for instant <16ms slide */}
      <aside
        ref={panelRef}
        role="dialog"
        aria-modal={isShown || undefined}
        aria-label={
          isEditMode
            ? (isFr ? "Modifier le lien" : "Edit link")
            : (isFr ? "Créer un lien" : "Create link")
        }
        onTransitionEnd={(e) => {
          if (e.target === e.currentTarget && !isShown) {
            setIsShadowActive(false);
          }
        }}
        className={cn(
          "fixed top-0 right-0 bottom-0 z-[2001] flex h-full flex-col [contain:layout_paint_style]",
          "w-full sm:w-[760px] md:w-[840px] lg:w-[920px] max-w-full",
          "bg-white dark:bg-[#0e0f12] text-[#131417] dark:text-[#f1f2f4]",
          "border-l border-[#e6e7ea] dark:border-[#22242a]",
          "transform-gpu will-change-transform transition-transform duration-220",
          (isShown || isShadowActive) && "shadow-2xl",
          isShown ? "translate-x-0" : "translate-x-full",
        )}
        style={{
          transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        {/* ── 1. MINIMALIST HEADER ── */}
        <header className="flex justify-between items-center px-6 pt-5 pb-3 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <b className="font-bold text-[15px] text-zinc-950 dark:text-white">
            {isEditMode
              ? (isFr ? "Modifier le lien" : "Edit link")
              : (isFr ? "Créer un lien" : "Create link")}
          </b>
          <button
            type="button"
            onClick={onClose}
            aria-label={isFr ? "Fermer" : "Close"}
            className="text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 text-2xl leading-none px-2 py-0.5 rounded-[6px] transition-colors cursor-pointer"
          >
            ×
          </button>
        </header>

        {/* ── 2. RESPONSIVE TAB BAR NAVIGATION ── */}
        {/* Desktop: wraps automatically (flex-wrap) if not enough width. */}
        {/* Mobile: horizontal manual scroll (overflow-x-auto whitespace-nowrap). */}
        <nav
          ref={tabsNavRef}
          aria-label={isFr ? "Étapes du formulaire" : "Drawer steps"}
          className={cn(
            "flex items-center border-b border-zinc-200 dark:border-zinc-800 px-5 sm:px-6 pt-2 pb-0 shrink-0 select-none",
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
                disabled={isUploadingImage || isSubmitting}
                data-active={isActiveTab}
                onClick={async () => {
                  if (isUploadingImage || isSubmitting) return;
                  const seq = ++tabSwitchSeqRef.current;
                  if (activeTab === "social_tracking" && tab.id !== "social_tracking") {
                    await commitPendingCropIfNeeded();
                    if (tabSwitchSeqRef.current !== seq) return;
                  }
                  if (tab.id === "routing" && !isProPlan) {
                    triggerPlanUpgrade({
                      featureName: isFr ? "Routage dynamique intelligent" : "Dynamic Smart Routing",
                      reason: isFr
                        ? "Le routage dynamique intelligent est réservé aux forfaits payants (Pro, Business et Enterprise)."
                        : "Dynamic Smart Routing is reserved for paid plans (Pro, Business, and Enterprise).",
                      targetPlan: "PRO",
                    });
                    setActiveTab("routing");
                    return;
                  }

                  // If leaving tab 0, validate destination URL
                  if (activeTab === "link" && tab.id !== "link") {
                    const targetErr = checkUrlFormat(targetUrl, true, isFr);
                    const domainErr = checkDomainFormat(domainName, isFr);
                    const slugErr = checkSlugFormat(slug, isFr);
                    if (targetErr || domainErr || slugErr) {
                      setFieldErrors((prev) => ({
                        ...prev,
                        ...(targetErr ? { targetUrl: targetErr } : {}),
                        ...(domainErr ? { domainName: domainErr } : {}),
                        ...(slugErr ? { slug: slugErr } : {}),
                      }));
                      showToast.error(
                        isFr
                          ? "Veuillez renseigner l'URL de destination, le domaine et le slug personnalisé."
                          : "Please fill in destination URL, domain and custom slug.",
                      );
                      return;
                    }
                  }
                  setActiveTab(tab.id);
                }}
                className={cn(
                  "text-[13px] font-medium py-2.5 border-b-2 -mb-px transition-colors cursor-pointer flex items-center gap-1.5 shrink-0 sm:shrink disabled:opacity-50 disabled:cursor-not-allowed",
                  isActiveTab
                    ? "border-[#1d5fe0] dark:border-[#3b82f6] text-zinc-950 dark:text-white font-bold"
                    : isCompleted
                      ? "border-transparent text-zinc-800 dark:text-zinc-200 hover:text-[#1d5fe0] dark:hover:text-[#3b82f6] font-medium"
                      : "border-transparent text-zinc-600 dark:text-zinc-300 hover:text-zinc-950 dark:hover:text-white font-medium",
                )}
              >
                <Icon
                  className={cn(
                    "w-3.5 h-3.5",
                    isActiveTab
                      ? "text-[#1d5fe0] dark:text-[#3b82f6]"
                      : "opacity-80",
                  )}
                />
                <span>{isFr ? DRAWER_TAB_FR_LABELS[tab.id] : tab.label}</span>
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
            id={drawerFormId}
            autoComplete="off"
            data-lpignore="true"
            data-1p-ignore="true"
            data-bwignore="true"
            onSubmit={handleSubmit}
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto px-6 py-5 drawer-scroll-hidden"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {shouldRenderBody && activeTab === "link" && (
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
                checkUrlFormat={validateUrl}
                checkDomainFormat={validateDomain}
                checkSlugFormat={validateSlug}
              />
            )}

            {activeTab !== "link" && (
              <Suspense
                fallback={
                  <div className="flex items-center justify-center py-14 text-zinc-400">
                    <Loader2 className="w-5 h-5 animate-spin" />
                  </div>
                }
              >
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
                    setTwitterCard={handleTwitterCardChange}
                    onClearBanner={() => {
                      rawUploadedBannerFileRef.current = null;
                      originalEditOgImageRef.current = "";
                      bannerCropReqIdRef.current += 1;
                      setIsUploadingImage(false);
                      setOgImage("");
                      setPreviewImage("");
                    }}
                    onCropCompleteResult={handleCropCompleteResult}
                    pendingCropRef={pendingCropRef}
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
                    checkExpiresAtFormat={validateExpiresAt}
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
                    onNavigateTab={(tabId) => {
                      tabSwitchSeqRef.current += 1;
                      setActiveTab(tabId);
                    }}
                    isSubmitting={isSubmitting || isUploadingImage}
                    formId={drawerFormId}
                  />
                )}
              </Suspense>
            )}
          </form>
        </main>

        {/* ── 4. FOOTER (Matching template style) ── */}
        <footer className="flex justify-between items-center gap-3 px-6 py-3.5 border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0e0f12] shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevTab}
              disabled={isSubmitting || isUploadingImage}
              className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 px-4 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {activeTabIndex > 0
                ? (isFr ? "Retour" : "Back")
                : (isFr ? "Annuler" : "Cancel")}
            </button>

            {isEditMode && (
              <button
                type="button"
                onClick={handleDeleteLinkWithUndo}
                disabled={isSubmitting}
                className="text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-500/10 px-3 py-1.5 rounded-[8px] transition-colors cursor-pointer flex items-center gap-1.5"
                title={isFr ? "Supprimer ce lien" : "Delete this link"}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isFr ? "Supprimer" : "Delete"}</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2.5">
            {activeTab !== "review" && (
              <button
                type="submit"
                form={drawerFormId}
                disabled={isSubmitting || isUploadingImage}
                className="border border-[#1d5fe0]/30 dark:border-[#3b82f6]/30 bg-transparent hover:bg-[#1d5fe0]/10 text-[#1d5fe0] dark:text-[#3b82f6] font-semibold text-xs sm:text-sm px-3.5 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isUploadingImage ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>{isFr ? "Envoi de la bannière..." : "Uploading banner..."}</span>
                  </>
                ) : (
                  <span>
                    {isEditMode
                      ? (isFr ? "Enregistrer maintenant" : "Save now")
                      : (isFr ? "Créer le lien maintenant" : "Create Link now")}
                  </span>
                )}
              </button>
            )}

            {activeTab !== "review" ? (
              <button
                type="button"
                onClick={handleNextTab}
                disabled={isUploadingImage}
                className="bg-[#1d5fe0] dark:bg-[#3b82f6] hover:bg-[#154fc0] dark:hover:bg-[#2563eb] text-white font-medium text-sm px-5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isFr ? "Continuer" : "Continue"}
              </button>
            ) : (
              <button
                type="submit"
                form={drawerFormId}
                disabled={isSubmitting || isUploadingImage}
                className="bg-[#1d5fe0] dark:bg-[#3b82f6] hover:bg-[#154fc0] dark:hover:bg-[#2563eb] text-white font-medium text-sm px-5 py-2 rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting || isUploadingImage ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>
                      {isUploadingImage
                        ? (isFr ? "Envoi de la bannière..." : "Uploading banner...")
                        : isEditMode
                          ? (isFr ? "Enregistrement..." : "Saving...")
                          : (isFr ? "Création..." : "Creating...")}
                    </span>
                  </>
                ) : (
                  <span>
                    {isEditMode
                      ? (isFr ? "Enregistrer les modifications" : "Save Changes")
                      : (isFr ? "Créer le lien" : "Create Link")}
                  </span>
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
