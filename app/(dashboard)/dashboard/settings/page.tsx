"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Image from "next/image";
import {
  User,
  KeyRound,
  Info,
  CreditCard,
  Globe2,
  Webhook,
  Target,
  Shield,
  Bell,
  Database,
  Check,
  AlertCircle,
  AlertTriangle,
  Calendar,
  Download,
  Trash2,
  Sparkles,
  Lock,
  Smartphone,
  Copy,
  RefreshCw,
  Loader2,
  Send,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  Sliders,
  ExternalLink,
  Laptop,
  Upload,
  Server,
  Plus,
  HelpCircle,
  Lightbulb,
  Zap,
  Share2,
  TrendingUp,
  Layers,
  ChevronDown,
  ChevronUp,
  FileCheck,
  Code2,
  MoreVertical,
  Play,
  Pause,
  Filter,
  ArrowUpRight,
  Mail,
  Pencil,
  X,
} from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { WebhookModal, WebhookModalData } from "@/components/dashboard/webhook-modal";
import { useSession, signOut } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  cfGetApiKeys,
  cfCreateApiKey,
  cfRevokeApiKey,
  cfGetLinks,
  cfGetDomains,
  cfGetAnalytics,
  cfUploadImage,
  cfGetPixels,
  cfCreatePixel,
  cfUpdatePixel,
  cfDeletePixel,
  cfGetWebhooks,
  cfCreateWebhook,
  cfUpdateWebhook,
  cfDeleteWebhook,
  cfGetTargetAlerts,
  cfCreateTargetAlert,
  cfUpdateTargetAlert,
  cfDeleteTargetAlert,
  cfInvalidateCache,
} from "@/lib/cloudflare-api";
import { PixelBrandLogo } from "@/components/dashboard/pixel-badges";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import {
  UserProfile,
  WebhookConfig,
  RetargetingPixel,
  InvoiceItem,
  ActiveSession,
  ApiKeyItem,
  TargetAlert,
} from "@/types";
import { ApiKeyCreatedModal } from "@/components/dashboard/api-key-created-modal";
import { TwoFactorSetupModal } from "@/components/dashboard/two-factor-setup-modal";
import { TwoFactorRecoveryModal } from "@/components/dashboard/two-factor-recovery-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { SettingsPageSkeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/toast-provider";
import { useUndoDelete } from "@/components/ui/undo-delete-provider";
import { syncUserToCloudflare } from "@/app/actions/sync-user";
import { triggerPlanUpgrade, getPlanLimits } from "@/lib/plan-guard";
import confetti from "canvas-confetti";

const VALID_SETTINGS_TABS = [
  "profile",
  "billing",
  "api",
  "domains",
  "webhooks",
  "pixels",
  "security",
  "notifications",
  "data",
  "about",
] as const;

function SettingsPageContent() {
  const { triggerUndoDelete } = useUndoDelete();
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTabParam = searchParams.get("tab");
  const rawUserId = session?.user?.id || "";
  const userEmail = session?.user?.email || "";
  const convexUser = useQuery(
    api.users.getCurrentUser,
    rawUserId || userEmail
      ? { userId: rawUserId || userEmail, email: userEmail || undefined }
      : "skip",
  );
  const isPlaywrightPreview =
    process.env.NODE_ENV === "development" &&
    searchParams.get("playwright_preview") === "1";

  const userId =
    rawUserId && rawUserId !== "usr_anonymous"
      ? rawUserId
      : convexUser?.userId || userEmail || (isPlaywrightPreview ? "mock_playwright_user" : "");
  const previewPlanParam =
    process.env.NODE_ENV === "development"
      ? searchParams.get("plan_preview")?.toUpperCase()
      : null;
  const plan = (
    previewPlanParam ||
    convexUser?.plan ||
    (session?.user as any)?.plan ||
    "FREEMIUM"
  ).toUpperCase();

  const [activeTab, setActiveTab] = useState<
    | "profile"
    | "billing"
    | "api"
    | "domains"
    | "webhooks"
    | "pixels"
    | "security"
    | "notifications"
    | "data"
    | "about"
  >(() => {
    if (
      urlTabParam &&
      (VALID_SETTINGS_TABS as readonly string[]).includes(urlTabParam)
    ) {
      return urlTabParam as any;
    }
    return "profile";
  });

  // Reactively sync activeTab whenever URL ?tab= parameter changes via Next.js router
  useEffect(() => {
    if (
      urlTabParam &&
      (VALID_SETTINGS_TABS as readonly string[]).includes(urlTabParam)
    ) {
      setActiveTab(urlTabParam as any);
    } else if (!urlTabParam) {
      setActiveTab("profile");
    }
  }, [urlTabParam]);

  // Also sync activeTab with main Sidebar tree sub-menu custom events and browser popstate
  useEffect(() => {
    const syncFromUrl = () => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tab");
      if (t && (VALID_SETTINGS_TABS as readonly string[]).includes(t)) {
        setActiveTab(t as any);
      } else if (!t) {
        setActiveTab("profile");
      }
    };
    const handleSidebarTabChange = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (
        detail?.tab &&
        (VALID_SETTINGS_TABS as readonly string[]).includes(detail.tab)
      ) {
        setActiveTab(detail.tab);
      }
    };
    window.addEventListener("popstate", syncFromUrl);
    window.addEventListener(
      "lshorter_settings_tab_change",
      handleSidebarTabChange,
    );
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
      window.removeEventListener(
        "lshorter_settings_tab_change",
        handleSidebarTabChange,
      );
    };
  }, []);

  // ─── Profile State ──────────────────────────────────────────────────────────
  const [name, setName] = useState(session?.user?.name || "My Account");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [language, setLanguage] = useState("English (US)");
  const [timezone, setTimezone] = useState(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  });
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.image || "");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // ─── Real Live Account Stats (Synchronized) ─────────────────────────────────
  const [accountStats, setAccountStats] = useState({
    linksCount: 0,
    clicksThisMonth: 0,
    domainsCount: 0,
    userDomains: [] as any[],
  });

  const loadAccountStats = async (force = false) => {
    if (!userId) return;
    try {
      const [linksRes, domainsRes, analyticsRes, analytics30dRes] =
        await Promise.all([
          cfGetLinks(userId, force).catch(() => null),
          cfGetDomains(userId).catch(() => null),
          cfGetAnalytics(userId, undefined, undefined, force).catch(() => null),
          cfGetAnalytics(userId, "30d", undefined, force).catch(() => null),
        ]);

      const lList = Array.isArray(linksRes?.data)
        ? linksRes.data
        : Array.isArray((linksRes?.data as any)?.data)
          ? (linksRes?.data as any).data
          : [];
      const dList = Array.isArray(domainsRes?.data)
        ? domainsRes.data
        : Array.isArray((domainsRes?.data as any)?.data)
          ? (domainsRes?.data as any).data
          : [];
      const sumClicks = lList.reduce(
        (acc: number, l: any) =>
          acc +
          (Number(l.clicks_count) ||
            Number(l.clicksCount) ||
            Number(l.clicks) ||
            0),
        0,
      );
      const analyticsClicks30d = Number(
        analytics30dRes?.data?.totalClicks ??
          analytics30dRes?.data?.total_clicks ??
          0,
      );

      let storedLive = 0;
      if (typeof window !== "undefined") {
        try {
          const s = localStorage.getItem(`lshorter_live_clicks_${userId}`);
          if (s && !isNaN(Number(s))) storedLive = Number(s);
        } catch {}
      }

      const totalLiveClicks = Math.max(analyticsClicks30d, sumClicks, storedLive);

      setAccountStats({
        linksCount: lList.length,
        clicksThisMonth: totalLiveClicks,
        domainsCount: dList.length,
        userDomains: dList,
      });

      if (typeof window !== "undefined" && totalLiveClicks > 0) {
        try {
          localStorage.setItem(`lshorter_live_clicks_${userId}`, String(totalLiveClicks));
          window.dispatchEvent(
            new CustomEvent("lshorter_live_clicks_synced", {
              detail: { clicks: totalLiveClicks, fromSettings: true },
            }),
          );
        } catch {}
      }
    } catch (err) {
      console.warn("[Settings] Error loading live stats:", err);
    }
  };

  useEffect(() => {
    if (!userId) return;
    loadAccountStats(true);

    const handleUpdate = () => {
      cfInvalidateCache();
      loadAccountStats(true);
    };

    const handleLiveSync = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (typeof detail?.clicks === "number") {
        setAccountStats((prev) => ({
          ...prev,
          clicksThisMonth: Math.max(prev.clicksThisMonth, detail.clicks),
        }));
        if (!detail?.fromSettings) {
          loadAccountStats(true);
        }
      }
    };

    const handleFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      handleUpdate();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "lshorter_last_click" || e.key === "lshorter_data_change") {
        handleUpdate();
      } else if (e.key === `lshorter_live_clicks_${userId}` && e.newValue) {
        const val = Number(e.newValue);
        if (!isNaN(val)) {
          setAccountStats((prev) => ({
            ...prev,
            clicksThisMonth: Math.max(prev.clicksThisMonth, val),
          }));
        }
      }
    };

    window.addEventListener("lshorter_data_change", handleUpdate);
    window.addEventListener("lshorter_links_updated", handleUpdate);
    window.addEventListener("lshorter_link_clicked", handleUpdate);
    window.addEventListener("lshorter_live_clicks_synced", handleLiveSync);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("storage", handleStorage);

    // Cross-tab broadcast receiver
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("lshorter_realtime");
        channel.onmessage = (event) => {
          if (event.data?.type === "click" || event.data?.type === "refresh") {
            handleUpdate();
          } else if (event.data?.type === "live_clicks_synced" && typeof event.data?.clicks === "number") {
            setAccountStats((prev) => ({
              ...prev,
              clicksThisMonth: Math.max(prev.clicksThisMonth, event.data.clicks),
            }));
            handleUpdate();
          }
        };
      }
    } catch {}

    const pollTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      loadAccountStats(true);
    }, 20000);

    return () => {
      window.removeEventListener("lshorter_data_change", handleUpdate);
      window.removeEventListener("lshorter_links_updated", handleUpdate);
      window.removeEventListener("lshorter_link_clicked", handleUpdate);
      window.removeEventListener("lshorter_live_clicks_synced", handleLiveSync);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("storage", handleStorage);
      if (channel) channel.close();
      clearInterval(pollTimer);
    };
  }, [userId]);


  const planNormalized = (plan === "FREEMIUM" ? "FREE" : plan) as
    "FREE" | "FREEMIUM" | "PRO" | "BUSINESS" | "ENTERPRISE";
  const isPremium =
    planNormalized === "PRO" ||
    planNormalized === "BUSINESS" ||
    planNormalized === "ENTERPRISE";
  const clicksLimit =
    plan === "ENTERPRISE"
      ? -1
      : plan === "BUSINESS"
        ? 500_000
        : plan === "PRO"
          ? 150_000
          : 10_000;
  const domainsLimit =
    plan === "ENTERPRISE"
      ? -1
      : plan === "BUSINESS"
        ? 15
        : plan === "PRO"
          ? 6
          : 3;
  const rawClicksRatio =
    clicksLimit > 0 ? (accountStats.clicksThisMonth / clicksLimit) * 100 : 0;
  
  // Formatage précis du pourcentage pour la page Billing (ex: 0.12%, 4.56%, 105.20%)
  const formatPrecisePercentage = (used: number, limit: number): string => {
    if (limit === -1) return "Unlimited";
    if (used <= 0) return "0.00%";
    const ratio = (used / limit) * 100;
    if (ratio < 0.01) {
      return `${ratio.toFixed(3)}%`;
    }
    return `${ratio.toFixed(2)}%`;
  };

  const billingClicksPercentLabel = formatPrecisePercentage(
    accountStats.clicksThisMonth,
    clicksLimit,
  );

  const clicksBarWidthPercent =
    clicksLimit === -1 || plan === "ENTERPRISE"
      ? 100
      : accountStats.clicksThisMonth > 0
        ? Math.min(100, Math.max(0.75, rawClicksRatio))
        : 0;

  const isOverage =
    clicksLimit !== -1 &&
    accountStats.clicksThisMonth > clicksLimit &&
    (plan === "PRO" || plan === "BUSINESS");
  const overageClicks = isOverage
    ? accountStats.clicksThisMonth - clicksLimit
    : 0;
  const overageBatchSize =
    plan === "BUSINESS" ? 125_000 : plan === "PRO" ? 50_000 : 0;
  const overageBatches =
    overageBatchSize > 0 ? Math.ceil(overageClicks / overageBatchSize) : 0;
  const costPerBatch = plan === "BUSINESS" ? 8.0 : plan === "PRO" ? 3.0 : 0;
  const overageAmount =
    plan === "ENTERPRISE"
      ? 0
      : Number((overageBatches * costPerBatch).toFixed(2));

  // ─── Real Invoices (Fetched from Paddle & Convex) ───────────────────────────
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  const loadRealInvoices = useCallback(async () => {
    if (!userId && !userEmail) return;
    setLoadingInvoices(true);
    try {
      const res = await fetch(
        `/api/billing/invoices?userId=${encodeURIComponent(userId)}&email=${encodeURIComponent(userEmail)}`,
      );
      const data = await res.json();
      if (data.success && Array.isArray(data.invoices)) {
        setInvoices(data.invoices);
      }
    } catch (err) {
      console.warn("[Settings] Error loading real invoices:", err);
    } finally {
      setLoadingInvoices(false);
    }
  }, [userId, userEmail]);

  useEffect(() => {
    if (activeTab === "billing") {
      loadRealInvoices();
    }
  }, [activeTab, loadRealInvoices]);

  // Handle return from Paddle checkout (triggers exactly once without duplicate toasts)
  const handledCheckoutSuccessRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isSuccess = params.get("checkout_success") === "true";
      const ptxn = params.get("_ptxn") || params.get("ptxn");

      if (isSuccess && !handledCheckoutSuccessRef.current) {
        handledCheckoutSuccessRef.current = true;

        // Clean query parameters from URL immediately to prevent repeated toasts on re-render
        window.history.replaceState({}, "", "/dashboard/settings?tab=billing");

        if (ptxn) {
          fetch("/api/billing/verify-transaction", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ transactionId: ptxn, userId }),
          })
            .then((r) => r.json())
            .then((data) => {
              if (data.success) {
                confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
                showToast.success(`Abonnement ${data.plan} confirmé avec succès via Paddle !`);
                window.dispatchEvent(new Event("lshorter_notifications_sync"));
                loadRealInvoices();
              }
            })
            .catch((err) => console.error("[Verify Transaction Error]", err));
        } else {
          confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
          showToast.success("Abonnement activé avec succès !");
          window.dispatchEvent(new Event("lshorter_notifications_sync"));
          loadRealInvoices();
        }
      }
    }
  }, [userId, loadRealInvoices]);

  const handleDownloadInvoice = (inv: any) => {
    const downloadUrl = inv.downloadUrl || `/api/billing/invoices/${inv.id}/download`;
    window.open(downloadUrl, "_blank");
    showToast.success(`Téléchargement de la facture officielle Paddle (${inv.number})...`);
  };

  // ─── Real Subscription & Auto-Renewal State ───────────────────────────────
  const convexSubscription = useQuery(
    api.subscriptions.getSubscription,
    userId ? { orgId: userId } : "skip"
  );
  const [subDetails, setSubDetails] = useState<{
    id: string | null;
    plan: string;
    cycle: string;
    status: string;
    cancelAtPeriodEnd: boolean;
    currentPeriodEnd: number | null;
    formattedPeriodEnd: string | null;
  } | null>(null);
  const [loadingSub, setLoadingSub] = useState(false);
  const [cancelingSub, setCancelingSub] = useState(false);
  const [resumingSub, setResumingSub] = useState(false);
  const [isCancelSubModalOpen, setIsCancelSubModalOpen] = useState(false);

  const loadSubscriptionDetails = useCallback(async () => {
    if (!userId && !userEmail) return;
    setLoadingSub(true);
    try {
      const res = await fetch("/api/billing/subscription");
      const data = await res.json();
      if (data.success && data.subscription) {
        setSubDetails(data.subscription);
      }
    } catch (err) {
      console.warn("[Settings] Error loading subscription details:", err);
    } finally {
      setLoadingSub(false);
    }
  }, [userId, userEmail]);

  useEffect(() => {
    if (activeTab === "billing") {
      loadSubscriptionDetails();
    }
  }, [activeTab, loadSubscriptionDetails]);

  const isCanceledAtPeriodEnd =
    convexSubscription?.cancelAtPeriodEnd ??
    subDetails?.cancelAtPeriodEnd ??
    false;

  const currentPeriodEndTimestamp =
    convexSubscription?.currentPeriodEnd ??
    subDetails?.currentPeriodEnd ??
    null;

  const displayPeriodEnd = useMemo(() => {
    if (currentPeriodEndTimestamp) {
      return new Date(currentPeriodEndTimestamp).toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    if (subDetails?.formattedPeriodEnd) {
      return subDetails.formattedPeriodEnd;
    }
    return new Date(Date.now() + 30 * 86400000).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, [currentPeriodEndTimestamp, subDetails?.formattedPeriodEnd]);

  const subCycle = (
    convexSubscription?.cycle ||
    subDetails?.cycle ||
    "MONTHLY"
  ).toUpperCase();

  const isPaidPlan =
    plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE";

  const handleConfirmCancelSubscription = async () => {
    setCancelingSub(true);
    try {
      const res = await fetch("/api/billing/subscription/cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        showToast.success(
          "Renouvellement automatique annulé. Vos services restent actifs jusqu'au terme de la période payée."
        );
        setIsCancelSubModalOpen(false);
        loadSubscriptionDetails();
        window.dispatchEvent(new Event("lshorter_notifications_sync"));
      } else {
        showToast.error(
          data.error || "Impossible d'annuler le renouvellement automatique pour le moment."
        );
      }
    } catch (err: any) {
      console.error("[Cancel Subscription Error]", err);
      showToast.error("Une erreur réseau est survenue. Veuillez réessayer.");
    } finally {
      setCancelingSub(false);
    }
  };

  const handleResumeSubscription = async () => {
    setResumingSub(true);
    try {
      const res = await fetch("/api/billing/subscription/resume", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.success) {
        showToast.success("Renouvellement automatique réactivé avec succès !");
        loadSubscriptionDetails();
        window.dispatchEvent(new Event("lshorter_notifications_sync"));
      } else {
        showToast.error(
          data.error || "Impossible de réactiver le renouvellement automatique."
        );
      }
    } catch (err: any) {
      console.error("[Resume Subscription Error]", err);
      showToast.error("Une erreur réseau est survenue. Veuillez réessayer.");
    } finally {
      setResumingSub(false);
    }
  };

  // ─── API Keys State ─────────────────────────────────────────────────────────
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScope, setNewKeyScope] = useState<
    "read" | "read_write" | "admin"
  >("read_write");
  const [activeCodeTab, setActiveCodeTab] = useState<
    "create" | "track" | "analytics"
  >("create");
  const [createdKeyModal, setCreatedKeyModal] = useState<ApiKeyItem | null>(
    null,
  );
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
  const [isCreatingKey, setIsCreatingKey] = useState(false);
  const [isLoadingApiKeys, setIsLoadingApiKeys] = useState(false);

  const toggleRevealKey = (id: string) => {
    setRevealedKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const codeSnippets = {
    create: `// Installation: npm i lshorter-api
import { LShorter } from "lshorter-api";

const qk = new LShorter({
  apiKey: "sk_live_your_api_key_here",
});

// Create a short link with smart targeting
const link = await qk.links.create({
  targetUrl: "https://your-store.com/product",
  slug: "summer-promo",
  geoTargeting: {
    FR: "https://your-store.fr/promo",
    US: "https://your-store.com/us-promo",
  },
  deviceTargeting: {
    ios: "https://apps.apple.com/app/...",
    android: "https://play.google.com/store/apps/...",
  },
});

console.log("Short link:", link.shortUrl);
console.log("QR Code (DataURL):", link.qrCode);`,

    track: `import { LShorter } from "lshorter-api";

const qk = new LShorter({ apiKey: "sk_live_..." });

// Record a conversion/sale upon checkout (with avatar, name, and email)
await qk.track.conversion({
  eventName: "purchase",
  amount: 49.0,
  currency: "EUR",
  linkId: "link_01",
  clickId: "clk_abc123", // Captured during visitor session
  customer: {
    email: "customer@example.com",
    name: "Alex Smith",
    avatarUrl: "https://example.com/photos/alex.jpg" // Profile photo in revenue analytics
  }
});`,

    analytics: `import { LShorter } from "lshorter-api";

const qk = new LShorter({ apiKey: "sk_live_..." });

// Retrieve link analytics and top audience countries
const stats = await qk.analytics.dashboard({ linkId: "link_01" });
console.log("Total clicks:", stats.clicks.total);
console.log("Tracked revenue:", stats.conversions[0].revenue);

const topAudience = await qk.analytics.top();
console.log("Top Countries:", topAudience.topCountries);`,
  };

  // ─── Webhooks State (Cloudflare D1 & Sync) ──────────────────────────────────
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [webhookTestResponse, setWebhookTestResponse] = useState<string | null>(
    null,
  );
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(true);
  const [isLoadingWebhooks, setIsLoadingWebhooks] = useState(false);
  const [isCreatingWebhook, setIsCreatingWebhook] = useState(false);
  const [isWebhookModalOpen, setIsWebhookModalOpen] = useState(false);
  const [webhookToEdit, setWebhookToEdit] = useState<WebhookModalData | null>(null);
  const [isSavingWebhookModal, setIsSavingWebhookModal] = useState(false);

  const loadWebhooks = async () => {
    if (!userId) return;
    setIsLoadingWebhooks(true);
    try {
      const res = await cfGetWebhooks(userId);
      const list = res?.data?.webhooks || [];
      setWebhooks(list as any);
      try {
        localStorage.setItem(`lshorter_webhooks_${userId}`, JSON.stringify(list));
      } catch {}
    } catch {
      try {
        const saved = localStorage.getItem(`lshorter_webhooks_${userId}`);
        if (saved) setWebhooks(JSON.parse(saved));
      } catch {}
    } finally {
      setIsLoadingWebhooks(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadWebhooks();
    }
  }, [userId, activeTab]);

  // ─── Pixels State (Cloudflare D1 & Sync) ────────────────────────────────────
  const [pixels, setPixels] = useState<any[]>([]);
  const [newPixelId, setNewPixelId] = useState("");
  const [newPixelName, setNewPixelName] = useState("");
  const [newPixelPlatform, setNewPixelPlatform] = useState<
    "meta" | "google" | "tiktok" | "linkedin"
  >("meta");
  const [isLoadingPixels, setIsLoadingPixels] = useState(false);

  const loadPixels = async () => {
    if (!userId) return;
    setIsLoadingPixels(true);
    try {
      const res = await cfGetPixels(userId);
      const list = res?.data?.pixels || [];
      setPixels(list);
      try {
        localStorage.setItem(`lshorter_pixels_${userId}`, JSON.stringify(list));
      } catch {}
    } catch {
      try {
        const saved = localStorage.getItem(`lshorter_pixels_${userId}`);
        if (saved) setPixels(JSON.parse(saved));
      } catch {}
    } finally {
      setIsLoadingPixels(false);
    }
  };

  useEffect(() => {
    if (userId) {
      loadPixels();
    }
  }, [userId, activeTab]);

  // ─── Security State ─────────────────────────────────────────────────────────
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FASetupModal, setShow2FASetupModal] = useState(false);
  const [showRecoveryCodesModal, setShowRecoveryCodesModal] = useState(false);
  const storedRecoveryCodes: string[] =
    (convexUser?.twoFactorRecoveryCodes as string[]) || [];

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // ─── Live Dynamic Real Active Session Detection ─────────────────────────────
  const [currentSessionInfo, setCurrentSessionInfo] = useState<{
    device: string;
    browser: string;
    ip: string;
    location: string;
  }>({
    device: "Windows 10/11",
    browser: "Google Chrome",
    ip: "Connexion sécurisée",
    location: "En ligne",
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const ua = navigator.userAgent || "";
    let detectedOs = "Desktop";
    let detectedBrowser = "Navigateur";

    // 1. Accurate OS Detection (Check mobile/tablets before desktop mac)
    if (/windows nt 10\.0|windows nt 11\.0|windows|win32|win64/i.test(ua)) {
      detectedOs = "Windows 10/11";
    } else if (/android/i.test(ua)) {
      detectedOs = "Android";
    } else if (/iphone|ipod/i.test(ua)) {
      detectedOs = "iOS (iPhone)";
    } else if (/ipad/i.test(ua)) {
      detectedOs = "iPadOS (Tablette)";
    } else if (
      /macintosh|mac os x/i.test(ua) &&
      !/iphone|ipad|ipod/i.test(ua)
    ) {
      detectedOs = "macOS";
    } else if (/linux/i.test(ua) && !/android/i.test(ua)) {
      detectedOs = "Linux";
    } else {
      detectedOs = navigator.platform || "Desktop";
    }

    // 2. Accurate Browser Detection
    if (/edg\//i.test(ua)) {
      detectedBrowser = "Microsoft Edge";
    } else if (/opr\/|opera/i.test(ua)) {
      detectedBrowser = "Opera";
    } else if (
      /chrome|crios/i.test(ua) &&
      !/edg\//i.test(ua) &&
      !/opr\//i.test(ua)
    ) {
      detectedBrowser = "Google Chrome";
    } else if (/firefox|fxios/i.test(ua)) {
      detectedBrowser = "Mozilla Firefox";
    } else if (/safari/i.test(ua) && !/chrome|crios/i.test(ua)) {
      detectedBrowser = "Apple Safari";
    } else {
      detectedBrowser = "Navigateur Web";
    }

    // 3. Real Live IP & Location (No Hardcoded Data)
    fetch("https://ipapi.co/json/")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .catch(() =>
        fetch("https://ip-api.com/json").then((res) =>
          res.ok ? res.json() : null,
        ),
      )
      .then((data) => {
        if (data && (data.ip || data.query)) {
          const ip = data.ip || data.query;
          const city = data.city || "";
          const country =
            data.country_name || data.country || data.countryCode || "";
          const loc =
            [city, country].filter(Boolean).join(", ") || "Active Connection";
          setCurrentSessionInfo({
            device: detectedOs,
            browser: detectedBrowser,
            ip: `IP: ${ip}`,
            location: loc,
          });
        } else {
          setCurrentSessionInfo({
            device: detectedOs,
            browser: detectedBrowser,
            ip: "Secure Active Session",
            location: "Cloudflare Edge Network (SSL/TLS)",
          });
        }
      })
      .catch(() => {
        setCurrentSessionInfo({
          device: detectedOs,
          browser: detectedBrowser,
          ip: "Secure Active Session",
          location: "Cloudflare Edge Network (SSL/TLS)",
        });
      });
  }, []);

  // ─── Target Alerts & Notifications State (Cloudflare D1 Synced) ─────────────
  const [targetAlerts, setTargetAlerts] = useState<TargetAlert[]>([]);
  const [userLinksList, setUserLinksList] = useState<any[]>([]);
  const [isLoadingTargets, setIsLoadingTargets] = useState(false);
  const [activeAlertFilter, setActiveAlertFilter] = useState<"all" | "active" | "paused" | "reached">("all");
  const [openRowMenuId, setOpenRowMenuId] = useState<string | null>(null);
  const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
  const [editingAlert, setEditingAlert] = useState<TargetAlert | null>(null);
  const [isEditingGlobalAlert, setIsEditingGlobalAlert] = useState(false);

  // Responsive Drawer Detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Modal / Drawer form inputs
  const [alertLinkId, setAlertLinkId] = useState<string>("");
  const [alertMetricType, setAlertMetricType] = useState<"clicks" | "revenue" | "both">("clicks");
  const [alertPeriod, setAlertPeriod] = useState<"day" | "week" | "month">("month");
  const [alertTargetValue, setAlertTargetValue] = useState<number>(2500);
  const [alertTargetClicks, setAlertTargetClicks] = useState<number>(2500);
  const [alertTargetRevenue, setAlertTargetRevenue] = useState<number>(5000);
  const [alertNotifyExpired, setAlertNotifyExpired] = useState<boolean>(true);
  const [alertNotifyEmail, setAlertNotifyEmail] = useState<boolean>(true);
  const [alertNotifyBell, setAlertNotifyBell] = useState<boolean>(true);
  const [isSavingAlert, setIsSavingAlert] = useState<boolean>(false);

  const loadTargetAlerts = async () => {
    if (!userId) return;
    setIsLoadingTargets(true);
    try {
      // 1. Fetch user's links
      const linksRes = await cfGetLinks(userId).catch(() => null);
      const rawLinks = Array.isArray(linksRes?.data)
        ? linksRes.data
        : Array.isArray((linksRes?.data as any)?.data)
          ? (linksRes?.data as any).data
          : [];
      setUserLinksList(rawLinks);

      // 2. Fetch targets from Cloudflare D1
      const res = await cfGetTargetAlerts(userId).catch(() => null);
      let alerts: TargetAlert[] = [];
      if (res && res.success && Array.isArray(res.data)) {
        alerts = res.data;
      }

      // Check global monthly target from storage or list
      const savedClk = typeof window !== "undefined" ? Number(localStorage.getItem("lshorter_target_clicks")) : 0;
      const savedRev = typeof window !== "undefined" ? Number(localStorage.getItem("lshorter_target_revenue")) : 0;

      const hasGlobal = alerts.some((a) => !a.linkId);
      if (!hasGlobal) {
        alerts.unshift({
          id: `global_${userId}`,
          userId,
          linkId: null,
          metricType: "clicks",
          period: "month",
          targetValue: savedClk > 0 ? savedClk : 2500,
          currentValue: accountStats.clicksThisMonth || 0,
          notifyExpired: false,
          notifyEmail: true,
          notifyBell: true,
          status: "active",
        });
      }

      // Compute current live values for alerts from links
      alerts = alerts.map((al) => {
        if (!al.linkId) {
          const cur = al.metricType === "revenue"
            ? (accountStats.clicksThisMonth || 0) * 0.05
            : (accountStats.clicksThisMonth || 0);
          return {
            ...al,
            currentValue: cur,
            status: cur >= al.targetValue ? "reached" : al.status,
          };
        } else {
          const matched = rawLinks.find((l: any) => String(l.id) === String(al.linkId) || l.slug === al.slug);
          const cur = matched
            ? (Number(matched.clicks_count) || Number(matched.clicksCount) || Number(matched.clicks) || 0)
            : (al.currentValue || 0);
          return {
            ...al,
            linkTitle: matched ? (matched.title || `lsho.cc/${matched.slug}`) : al.linkTitle,
            slug: matched ? matched.slug : al.slug,
            targetUrl: matched ? (matched.target_url || matched.targetUrl) : al.targetUrl,
            currentValue: cur,
            status: cur >= al.targetValue ? "reached" : al.status,
          };
        }
      });

      setTargetAlerts(alerts);
    } catch (err) {
      console.warn("[Settings] Error loading target alerts:", err);
    } finally {
      setIsLoadingTargets(false);
    }
  };

  useEffect(() => {
    if (activeTab === "notifications" && userId) {
      loadTargetAlerts();
    }
  }, [activeTab, userId, accountStats.clicksThisMonth]);

  useEffect(() => {
    const handleTargetUpdate = (e: any) => {
      const { revenue, clicks } = e.detail || {};
      setTargetAlerts((prev) =>
        prev.map((al) => {
          if (!al.linkId) {
            const nextVal = al.metricType === "revenue" ? (revenue ?? al.targetValue) : (clicks ?? al.targetValue);
            return { ...al, targetValue: nextVal };
          }
          return al;
        })
      );
    };
    window.addEventListener("lshorter_target_updated", handleTargetUpdate);
    return () => {
      window.removeEventListener("lshorter_target_updated", handleTargetUpdate);
    };
  }, []);

  useEffect(() => {
    if (!openRowMenuId) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-row-menu]")) {
        setOpenRowMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openRowMenuId]);

  const handleTogglePauseTarget = async (alert: TargetAlert) => {
    const nextStatus = alert.status === "paused" ? "active" : "paused";
    setTargetAlerts((prev) =>
      prev.map((a) => (a.id === alert.id ? { ...a, status: nextStatus } : a))
    );
    setOpenRowMenuId(null);

    try {
      if (!alert.id.startsWith("global_")) {
        await cfUpdateTargetAlert(alert.id, { status: nextStatus });
      }
      showToast.success(nextStatus === "paused" ? "Alert paused" : "Alert resumed");
    } catch {
      showToast.error("Failed to update status");
      loadTargetAlerts();
    }
  };

  const handleDeleteTarget = async (alertId: string) => {
    if (alertId.startsWith("global_")) {
      showToast.error("Global workspace target cannot be deleted");
      return;
    }
    setOpenRowMenuId(null);
    setTargetAlerts((prev) => prev.filter((a) => a.id !== alertId));
    try {
      await cfDeleteTargetAlert(alertId);
      showToast.success("Alert deleted successfully");
    } catch {
      showToast.error("Failed to delete alert");
      loadTargetAlerts();
    }
  };

  const handleOpenCreateModal = () => {
    setEditingAlert(null);
    setIsEditingGlobalAlert(false);
    const firstLink = isPremium ? userLinksList[0] : null;
    const initialLinkId = firstLink ? String(firstLink.id || firstLink.slug) : "global";
    setAlertLinkId(initialLinkId);
    setAlertMetricType("clicks");
    setAlertPeriod("month");
    setAlertTargetValue(2500);
    setAlertTargetClicks(2500);
    setAlertTargetRevenue(5000);
    setAlertNotifyExpired(initialLinkId !== "global");
    setAlertNotifyEmail(true);
    setAlertNotifyBell(true);
    setIsAlertModalOpen(true);
  };

  const handleOpenEditModal = (alert: TargetAlert) => {
    setOpenRowMenuId(null);
    setEditingAlert(alert);
    const isGlobal = !alert.linkId;
    setIsEditingGlobalAlert(isGlobal);
    setAlertLinkId(alert.linkId ? String(alert.linkId) : "global");
    setAlertMetricType(alert.metricType || "clicks");
    setAlertPeriod(isGlobal ? "month" : (alert.period || "month"));
    setAlertTargetValue(alert.targetValue || 2500);
    if (alert.metricType === "revenue") {
      setAlertTargetRevenue(alert.targetValue || 5000);
      setAlertTargetClicks(2500);
    } else {
      setAlertTargetClicks(alert.targetValue || 2500);
      setAlertTargetRevenue(5000);
    }
    setAlertNotifyExpired(isGlobal ? false : (alert.notifyExpired !== false));
    setAlertNotifyEmail(alert.notifyEmail !== false);
    setAlertNotifyBell(alert.notifyBell !== false);
    setIsAlertModalOpen(true);
  };

  const handleSaveTarget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (alertMetricType === "both") {
      if (alertTargetClicks <= 0 || alertTargetRevenue <= 0) {
        showToast.error("Veuillez saisir un seuil valide (> 0) pour les clics et les revenus");
        return;
      }
    } else {
      if (alertTargetValue <= 0) {
        showToast.error("Veuillez saisir un seuil d'objectif valide supérieur à 0");
        return;
      }
    }

    const isGlobalTarget = isEditingGlobalAlert || !alertLinkId || alertLinkId === "global" || !isPremium;
    const effectiveNotifyExpired = isGlobalTarget ? false : alertNotifyExpired;

    setIsSavingAlert(true);
    try {
      if (isEditingGlobalAlert) {
        if (alertMetricType === "both") {
          localStorage.setItem("lshorter_target_clicks", String(alertTargetClicks));
          localStorage.setItem("lshorter_target_revenue", String(alertTargetRevenue));
          window.dispatchEvent(
            new CustomEvent("lshorter_target_updated", {
              detail: { clicks: alertTargetClicks, revenue: alertTargetRevenue },
            })
          );
          await Promise.allSettled([
            cfCreateTargetAlert({
              userId,
              linkId: null,
              metricType: "clicks",
              period: "month",
              targetValue: alertTargetClicks,
              notifyExpired: false,
              notifyEmail: alertNotifyEmail,
              notifyBell: alertNotifyBell,
            }),
            cfCreateTargetAlert({
              userId,
              linkId: null,
              metricType: "revenue",
              period: "month",
              targetValue: alertTargetRevenue,
              notifyExpired: false,
              notifyEmail: alertNotifyEmail,
              notifyBell: alertNotifyBell,
            }),
          ]);
          showToast.success("Objectifs globaux clics et revenus enregistrés dans Cloudflare");
        } else if (alertMetricType === "revenue") {
          localStorage.setItem("lshorter_target_revenue", String(alertTargetValue));
          window.dispatchEvent(
            new CustomEvent("lshorter_target_updated", {
              detail: { revenue: alertTargetValue },
            })
          );
          await cfCreateTargetAlert({
            userId,
            linkId: null,
            metricType: "revenue",
            period: "month",
            targetValue: alertTargetValue,
            notifyExpired: false,
            notifyEmail: alertNotifyEmail,
            notifyBell: alertNotifyBell,
          });
          showToast.success("Objectif global de revenus enregistré dans Cloudflare");
        } else {
          localStorage.setItem("lshorter_target_clicks", String(alertTargetValue));
          window.dispatchEvent(
            new CustomEvent("lshorter_target_updated", {
              detail: { clicks: alertTargetValue },
            })
          );
          await cfCreateTargetAlert({
            userId,
            linkId: null,
            metricType: "clicks",
            period: "month",
            targetValue: alertTargetValue,
            notifyExpired: false,
            notifyEmail: alertNotifyEmail,
            notifyBell: alertNotifyBell,
          });
          showToast.success("Objectif global de clics enregistré dans Cloudflare");
        }
      } else {
        const effectiveLinkId = (!alertLinkId || alertLinkId === "global" || !isPremium)
          ? null
          : alertLinkId;

        if (editingAlert && !editingAlert.id.startsWith("global_")) {
          const targetValue = alertMetricType === "both"
            ? alertTargetClicks
            : alertTargetValue;

          await cfUpdateTargetAlert(editingAlert.id, {
            metricType: alertMetricType === "both" ? "clicks" : alertMetricType,
            period: alertPeriod,
            targetValue,
            notifyExpired: effectiveNotifyExpired,
            notifyEmail: alertNotifyEmail,
            notifyBell: alertNotifyBell,
          });

          if (alertMetricType === "both") {
            await cfCreateTargetAlert({
              userId,
              linkId: effectiveLinkId || editingAlert.linkId,
              metricType: "revenue",
              period: alertPeriod,
              targetValue: alertTargetRevenue,
              notifyExpired: effectiveNotifyExpired,
              notifyEmail: alertNotifyEmail,
              notifyBell: alertNotifyBell,
            });
          }
          showToast.success("Alerte mise à jour dans Cloudflare D1");
        } else {
          if (alertMetricType === "both") {
            await Promise.all([
              cfCreateTargetAlert({
                userId,
                linkId: effectiveLinkId,
                metricType: "clicks",
                period: alertPeriod,
                targetValue: alertTargetClicks,
                notifyExpired: effectiveNotifyExpired,
                notifyEmail: alertNotifyEmail,
                notifyBell: alertNotifyBell,
              }),
              cfCreateTargetAlert({
                userId,
                linkId: effectiveLinkId,
                metricType: "revenue",
                period: alertPeriod,
                targetValue: alertTargetRevenue,
                notifyExpired: effectiveNotifyExpired,
                notifyEmail: alertNotifyEmail,
                notifyBell: alertNotifyBell,
              }),
            ]);
            showToast.success("Alertes clics et revenus créées avec succès dans Cloudflare D1");
          } else {
            await cfCreateTargetAlert({
              userId,
              linkId: effectiveLinkId,
              metricType: alertMetricType,
              period: alertPeriod,
              targetValue: alertTargetValue,
              notifyExpired: effectiveNotifyExpired,
              notifyEmail: alertNotifyEmail,
              notifyBell: alertNotifyBell,
            });
            showToast.success("Alerte créée avec succès dans Cloudflare D1");
          }
        }
      }

      setIsAlertModalOpen(false);
      await loadTargetAlerts();
    } catch (err: any) {
      showToast.error(err?.message || "Erreur lors de l'enregistrement de l'alerte");
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleTestTarget = async (alert: TargetAlert) => {
    setOpenRowMenuId(null);
    showToast.info("Sending test alert...");
    try {
      const isGlobal = !alert.linkId;
      const res = await fetch("/api/targets/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email: session?.user?.email || "founder@lshorter.com",
          name: session?.user?.name || "Founder",
          linkTitle: isGlobal ? "Global Workspace" : (alert.linkTitle || (alert.slug ? `lsho.cc/${alert.slug}` : "Link")),
          slug: alert.slug || "",
          metricType: alert.metricType,
          achievedValue: alert.currentValue || (alert.targetValue * 0.78),
          targetValue: alert.targetValue,
          monthLabel: isGlobal ? "This Month" : (alert.period === "day" ? "Today" : alert.period === "week" ? "This Week" : "This Month"),
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast.success("Test alert sent! Notification added to bell & test email dispatched.");
      } else {
        showToast.error("Failed to send test alert");
      }
    } catch {
      showToast.error("Error sending test alert");
    }
  };

  // ─── Data & RGPD State ──────────────────────────────────────────────────────
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // ─── Convex Mutations ───────────────────────────────────────────────────────
  const storeUserMutation = useMutation(api.users.storeUser);
  const updateProfileMutation = useMutation(api.users.updateProfilePreferences);
  const update2FAMutation = useMutation(api.users.update2FASettings);
  const changePasswordMutation = useMutation(api.users.changePassword);
  const deleteAccountMutation = useMutation(api.users.deleteUserAccount);

  useEffect(() => {
    if (convexUser?.twoFactorEnabled !== undefined) {
      setIs2FAEnabled(Boolean(convexUser.twoFactorEnabled));
    }
  }, [convexUser?.twoFactorEnabled]);

  const loadApiKeys = async () => {
    if (!userId) return;
    setIsLoadingApiKeys(true);
    try {
      const res = await cfGetApiKeys(userId, userEmail);
      const rawUserPlan = (session?.user as any)?.plan || "FREE";
      const userPlan = rawUserPlan === "FREEMIUM" || rawUserPlan === "STARTER" ? "FREE" : rawUserPlan;
      const planLimits = getPlanLimits(userPlan);
      const defaultRateLimit = `${planLimits.rateLimitReqPerMin} req / min`;

      const rawKeys: ApiKeyItem[] = (res?.data || []).map((k: any) => {
        const rawKeyVal = k.raw_key || k.rawKey || k.key || k.api_key;
        const rawPrefix =
          k.prefix ||
          k.key_prefix ||
          (rawKeyVal ? `${String(rawKeyVal).slice(0, 13)}...${String(rawKeyVal).slice(-4)}` : "lsh_live_...");
        const rawRateLimit = k.rate_limit ?? k.rateLimit;
        const formattedRateLimit = rawRateLimit
          ? String(rawRateLimit).includes("req")
            ? String(rawRateLimit)
            : `${rawRateLimit} req / min`
          : defaultRateLimit;

        return {
          id: k.id,
          name: k.name || "API Key",
          prefix: rawPrefix,
          rawKey: rawKeyVal,
          scope: (k.scope as any) || "read_write",
          rateLimit: formattedRateLimit,
          created_at: k.created_at || k.createdAt || new Date().toISOString(),
        };
      });
      setApiKeys(rawKeys);
    } catch (err) {
      console.warn("[Settings] Error loading API keys:", err);
    } finally {
      setIsLoadingApiKeys(false);
    }
  };

  useEffect(() => {
    if (userId && activeTab === "api") {
      loadApiKeys();
    }
  }, [userId, activeTab]);

  useEffect(() => {
    const isPlaywrightPreview =
      process.env.NODE_ENV === "development" &&
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("playwright_preview") === "1";

    if (status === "unauthenticated" && !isPlaywrightPreview) {
      router.replace("/login");
      return;
    }
    if (convexUser) {
      if (convexUser.name) setName(convexUser.name);
      if (convexUser.email) setEmail(convexUser.email);
      if (convexUser.avatarUrl) setAvatarUrl(convexUser.avatarUrl);
      if (convexUser.language) setLanguage(convexUser.language);
      if (convexUser.timezone) setTimezone(convexUser.timezone);
    } else if (session?.user) {
      if (session.user.name) setName(session.user.name);
      if (session.user.email) setEmail(session.user.email);
      if (session.user.image) setAvatarUrl(session.user.image);
    }
    if (userId) {
      loadApiKeys();
      loadAccountStats();
    }
  }, [status, userId, session, convexUser]);

  const handleAvatarFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingAvatar(true);
    try {
      const uploadRes = await cfUploadImage(file, "lshorter/avatars");
      if (uploadRes.success && uploadRes.url) {
        const newAvatarUrl = uploadRes.url;
        setAvatarUrl(newAvatarUrl);

        // Auto-save immediately so the topbar and profile update right away
        if (userId) {
          try {
            await updateProfileMutation({
              userId,
              name: name?.trim() || undefined,
              email: email?.trim() || undefined,
              avatarUrl: newAvatarUrl,
              language: language || undefined,
              timezone: timezone || undefined,
            });

            await storeUserMutation({
              userId,
              name: name?.trim() || convexUser?.name || "User",
              email: email?.trim() || convexUser?.email || "",
              avatarUrl: newAvatarUrl,
              plan: plan as any,
            });

            await syncUserToCloudflare({
              id: userId,
              name,
              email,
              avatarUrl: newAvatarUrl,
              plan: plan as any,
            });
          } catch (persistErr) {
            console.warn("Avatar auto-persist sync warning:", persistErr);
          }
        }

        const updatedProfile = {
          name,
          email,
          avatarUrl: newAvatarUrl,
          plan: plan || "FREE",
        };
        try {
          localStorage.setItem("lshorter_cached_user", JSON.stringify(updatedProfile));
        } catch {}
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("lshorter:profile-updated", { detail: updatedProfile })
          );
        }

        showToast.success("Photo de profil mise à jour avec succès !");
      } else {
        showToast.error("Échec du téléversement de la photo de profil");
      }
    } catch {
      showToast.error("Erreur lors de l'envoi de la photo de profil");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCopy = (text: string) => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation({
        userId,
        name,
        email: email || undefined,
        avatarUrl: avatarUrl || undefined,
        language,
        timezone,
      });

      await storeUserMutation({
        userId,
        name,
        email,
        avatarUrl: avatarUrl || undefined,
        plan: plan as any,
      });

      await syncUserToCloudflare({
        id: userId,
        name,
        email,
        avatarUrl: avatarUrl || undefined,
        plan: plan as any,
      });

      const updatedProfile = {
        name,
        email,
        avatarUrl: avatarUrl || "",
        plan: plan || "FREE",
      };
      try {
        localStorage.setItem("lshorter_cached_user", JSON.stringify(updatedProfile));
      } catch {}
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("lshorter:profile-updated", { detail: updatedProfile })
        );
      }

      setProfileSuccess(true);
      showToast.success("Profile updated successfully!");
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err) {
      showToast.error("Error updating profile.");
    }
  };

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingKey) return;
    if (!newKeyName.trim() || !userId) return;

    setIsCreatingKey(true);
    try {
      const res = await cfCreateApiKey({
        userId,
        name: newKeyName.trim(),
        scope: newKeyScope,
      });
      if (res?.data) {
        const rawUserPlan = (session?.user as any)?.plan || "FREE";
        const userPlan = rawUserPlan === "FREEMIUM" || rawUserPlan === "STARTER" ? "FREE" : rawUserPlan;
        const planLimits = getPlanLimits(userPlan);
        const currentRateLimit = `${planLimits.rateLimitReqPerMin} req / min`;

        const generatedKeyData: ApiKeyItem = {
          id: res.data.id || `key_${Date.now()}`,
          name: newKeyName.trim(),
          prefix: res.data.prefix || res.data.key_prefix || "lsh_live_...",
          rawKey: res.data.raw_key || res.data.rawKey || res.data.api_key,
          scope: newKeyScope,
          rateLimit: currentRateLimit,
          created_at: new Date().toISOString(),
        };
        setCreatedKeyModal(generatedKeyData);
      }
      setNewKeyName("");
      confetti({ particleCount: 40, spread: 60 });
      showToast.success("API key created successfully!");
      await loadApiKeys();
    } catch (err: any) {
      showToast.error(err.message || "Error creating API key.");
    } finally {
      setIsCreatingKey(false);
    }
  };

  const promptRevokeKeyWithUndo = (k: ApiKeyItem) => {
    const originalIndex = apiKeys.findIndex((item) => item.id === k.id);
    setApiKeys((prev) => prev.filter((item) => item.id !== k.id));

    triggerUndoDelete({
      id: k.id,
      itemType: "api_key",
      title: "Clé API révoquée",
      description: k.name || k.prefix || "Clé API",
      duration: 10,
      onExecute: async () => {
        try {
          await cfRevokeApiKey(k.id, userId);
          cfInvalidateCache("/api/keys");
        } catch {
          loadApiKeys();
          showToast.error("Erreur lors de la révocation de la clé API.");
        }
      },
      onCancel: () => {
        setApiKeys((prev) => {
          if (prev.some((item) => item.id === k.id)) return prev;
          const next = [...prev];
          next.splice(originalIndex >= 0 ? Math.min(originalIndex, next.length) : next.length, 0, k);
          return next;
        });
      },
    });
  };

  const handleOpenCreateWebhook = () => {
    if (plan === "FREEMIUM") {
      triggerPlanUpgrade({
        featureName: "Webhooks",
        reason:
          "Webhooks and real-time event streaming are reserved for PRO and BUSINESS plans.",
        targetPlan: "PRO",
      });
      return;
    }
    setWebhookToEdit(null);
    setIsWebhookModalOpen(true);
  };

  const handleOpenEditWebhook = (wh: any) => {
    setWebhookToEdit({
      id: wh.id,
      url: wh.url,
      events: wh.events || [],
      isActive: wh.isActive,
      secretKey: wh.secretKey,
    });
    setIsWebhookModalOpen(true);
  };

  const handleSaveWebhookModal = async (data: WebhookModalData) => {
    if (!userId) return;
    setIsSavingWebhookModal(true);
    setIsCreatingWebhook(true);
    try {
      if (data.id) {
        await cfUpdateWebhook(data.id, {
          userId,
          url: data.url,
          events: data.events,
          secretKey: data.secretKey,
          isActive: data.isActive,
        });
        showToast.success("Webhook mis à jour avec succès !");
      } else {
        await cfCreateWebhook({
          userId,
          url: data.url,
          events: data.events,
          secretKey: data.secretKey,
          isActive: true,
        });
        confetti({ particleCount: 30, spread: 50 });
        showToast.success("Webhook configuré et enregistré dans Cloudflare D1 !");
      }
      setIsWebhookModalOpen(false);
      await loadWebhooks();
    } catch (err: any) {
      showToast.error(err?.message || "Échec de l'enregistrement du webhook");
    } finally {
      setIsSavingWebhookModal(false);
      setIsCreatingWebhook(false);
    }
  };

  const handleDeleteWebhookWithUndo = (wh: WebhookConfig) => {
    const originalIndex = webhooks.findIndex((w) => w.id === wh.id);
    setWebhooks((prev) => prev.filter((w) => w.id !== wh.id));

    triggerUndoDelete({
      id: wh.id,
      itemType: "webhook",
      title: "Webhook supprimé",
      description: wh.url,
      duration: 10,
      onExecute: async () => {
        try {
          await cfDeleteWebhook(wh.id, userId);
          cfInvalidateCache("/api/webhooks");
        } catch {
          loadWebhooks();
          showToast.error("Échec de suppression du webhook");
        }
      },
      onCancel: () => {
        setWebhooks((prev) => {
          if (prev.some((w) => w.id === wh.id)) return prev;
          const next = [...prev];
          next.splice(originalIndex >= 0 ? Math.min(originalIndex, next.length) : next.length, 0, wh);
          return next;
        });
      },
    });
  };

  const handleToggleWebhook = async (id: string) => {
    const target = webhooks.find((w) => w.id === id);
    if (!target) return;
    const nextActive = !target.isActive;
    try {
      setWebhooks((prev) =>
        prev.map((w) => (w.id === id ? { ...w, isActive: nextActive } : w)),
      );
      await cfUpdateWebhook(id, { userId, isActive: nextActive });
      showToast.success(nextActive ? "Webhook activé" : "Webhook mis en pause");
    } catch {
      loadWebhooks();
      showToast.error("Échec de mise à jour du webhook");
    }
  };

  const handleTestWebhook = async (url: string, secretKey?: string) => {
    if (plan === "FREEMIUM") {
      triggerPlanUpgrade({
        featureName: "Webhooks",
        reason:
          "Webhook testing simulator is reserved for PRO and BUSINESS plans.",
        targetPlan: "PRO",
      });
      return;
    }
    setIsTestingWebhook(true);
    setWebhookTestResponse(null);
    try {
      const res = await fetch("/api/webhooks/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, secretKey }),
      });
      const data = await res.json();
      setWebhookTestResponse(JSON.stringify(data, null, 2));
      showToast.success(
        `Ping sent! HTTP status ${data.status || 200} in ${data.durationMs || 45}ms`,
      );
    } catch (err) {
      setWebhookTestResponse(
        JSON.stringify(
          { error: "Webhook sending error", detail: String(err) },
          null,
          2,
        ),
      );
      showToast.error("Webhook test failed");
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleAddPixel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (plan === "FREEMIUM") {
      triggerPlanUpgrade({
        featureName: "Retargeting Pixels",
        reason:
          "Ad Retargeting Pixels are reserved for PRO and BUSINESS plans.",
        targetPlan: "PRO",
      });
      return;
    }
    if (!newPixelId.trim() || !userId) return;
    const nameMap: Record<string, string> = {
      meta: "Meta Facebook Pixel",
      google: "Google Analytics (GA4)",
      tiktok: "TikTok Ads Tag",
      linkedin: "LinkedIn Insight Tag",
    };
    try {
      const pName =
        newPixelName.trim() || nameMap[newPixelPlatform] || "Pixel Tag";
      const platformMap: Record<string, "facebook" | "google_tag" | "tiktok" | "linkedin"> = {
        meta: "facebook",
        google: "google_tag",
        tiktok: "tiktok",
        linkedin: "linkedin",
      };
      const apiPlatform = platformMap[newPixelPlatform] || (newPixelPlatform as any);
      await cfCreatePixel({
        userId,
        platform: apiPlatform,
        pixelId: newPixelId.trim(),
        name: pName,
        isActive: true,
      });
      setNewPixelId("");
      setNewPixelName("");
      showToast.success("Retargeting pixel connected!");
      loadPixels();
    } catch (err: any) {
      showToast.error(err?.message || "Failed to create pixel");
    }
  };

  const handleDeletePixelWithUndo = (px: RetargetingPixel) => {
    const originalIndex = pixels.findIndex((p) => p.id === px.id);
    setPixels((prev) => prev.filter((p) => p.id !== px.id));

    triggerUndoDelete({
      id: px.id,
      itemType: "pixel",
      title: "Pixel supprimé",
      description: px.name || px.pixelId,
      duration: 10,
      onExecute: async () => {
        try {
          await cfDeletePixel(px.id, userId);
          cfInvalidateCache("/api/pixels");
        } catch {
          loadPixels();
          showToast.error("Échec de la suppression du pixel.");
        }
      },
      onCancel: () => {
        setPixels((prev) => {
          if (prev.some((p) => p.id === px.id)) return prev;
          const next = [...prev];
          next.splice(originalIndex >= 0 ? Math.min(originalIndex, next.length) : next.length, 0, px);
          return next;
        });
      },
    });
  };

  const handleTogglePixel = async (id: string) => {
    const target = pixels.find((p) => p.id === id);
    if (!target) return;
    const nextActive = !target.isActive;
    try {
      setPixels((prev) =>
        prev.map((p) => (p.id === id ? { ...p, isActive: nextActive } : p)),
      );
      await cfUpdatePixel(id, { userId, isActive: nextActive });
      showToast.success(nextActive ? "Pixel activated" : "Pixel paused");
    } catch {
      loadPixels();
      showToast.error("Failed to update pixel");
    }
  };

  const handlePasswordInput = (val: string) => {
    setNewPassword(val);
    let score = 0;
    if (val.length >= 8) score += 25;
    if (/[A-Z]/.test(val)) score += 25;
    if (/[0-9]/.test(val)) score += 25;
    if (/[^A-Za-z0-9]/.test(val)) score += 25;
    setPasswordStrength(score);
  };

  const handle2FASuccess = async (secret: string, recoveryCodes: string[]) => {
    if (!userId) return;
    await update2FAMutation({
      userId,
      enabled: true,
      secret,
      recoveryCodes,
      verifiedAt: new Date().toISOString(),
    });
    setIs2FAEnabled(true);
  };

  const handleDisable2FA = async () => {
    if (
      confirm(
        "Are you sure you want to disable Two-Factor Authentication (2FA)? Your account will be less protected.",
      )
    ) {
      try {
        await update2FAMutation({
          userId,
          enabled: false,
        });
        setIs2FAEnabled(false);
        showToast.info("Two-Factor Authentication disabled.");
      } catch {
        showToast.error("Error disabling 2FA.");
      }
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim() || newPassword.length < 8) {
      showToast.error("New password must be at least 8 characters long.");
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      await changePasswordMutation({
        userId,
        newPasswordHash,
      });
      setCurrentPassword("");
      setNewPassword("");
      setPasswordStrength(0);
      confetti({ particleCount: 50, spread: 70 });
      showToast.success("Password updated successfully!");
    } catch {
      showToast.error("Error updating password.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleExportData = async (type: "json" | "csv") => {
    if (!userId) return;
    try {
      if (type === "csv") {
        const res = await fetch(
          `/api/analytics/export?format=csv&userId=${encodeURIComponent(userId)}`,
        );
        if (!res.ok) throw new Error("Error exporting CSV");
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `lshorter_data_${userId}_${new Date().toISOString().split("T")[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast.success("Data exported to CSV successfully!");
        return;
      }

      const [linksRes, domainsRes, analyticsRes] = await Promise.all([
        cfGetLinks(userId).catch(() => ({ data: [] })),
        cfGetDomains(userId).catch(() => ({ data: [] })),
        cfGetAnalytics(userId).catch(() => ({ data: {} })),
      ]);

      const data = {
        exportDate: new Date().toISOString(),
        user: { id: userId, name, email, plan },
        links: linksRes?.data || [],
        domains: domainsRes?.data || [],
        analytics: analyticsRes?.data || {},
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lshorter_archive_${userId}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast.success("JSON archive exported successfully!");
    } catch (err) {
      showToast.error("Error exporting data.");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE") {
      showToast.error("Please type DELETE to confirm.");
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccountMutation({ userId });
      showToast.success("Account and data permanently deleted.");
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      showToast.error("Error deleting account.");
      setIsDeletingAccount(false);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "billing", label: "Billing & Invoices", icon: CreditCard },
    { id: "api", label: "API & Keys", icon: KeyRound },
    { id: "domains", label: "Domains", icon: Globe2 },
    { id: "webhooks", label: "Webhooks", icon: Webhook, isPro: true },
    { id: "pixels", label: "Retargeting Pixels", icon: Target, isPro: true },
    { id: "security", label: "Security & 2FA", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Data & GDPR", icon: Database },
    { id: "about", label: "About", icon: Info },
  ] as const;

  if (status === "loading") {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in pb-20 md:pb-16">
      <div className="w-full">
        {/* TAB 1: PROFILE */}
        {activeTab === "profile" && (
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-[#222225]">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  User Profile
                </h1>
                <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
                  Personal information, timezone, and display preferences.
                </p>
              </div>
              <Badge variant="orange">Plan {plan}</Badge>
            </div>

            {/* Avatar Selector */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225]">
                <label className="relative group cursor-pointer shrink-0">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarFile}
                    disabled={isUploadingAvatar}
                  />
                  <div className="w-16 h-16 rounded-[10px] overflow-hidden bg-white dark:bg-[#141416] border-2 border-brand shadow-lg flex items-center justify-center font-bebas text-2xl font-bold text-zinc-900 dark:text-white relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={
                        avatarUrl ||
                        `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(
                          email || name || userId || "lshorter-user",
                        )}`
                      }
                      alt={name}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />

                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Upload className="w-5 h-5 text-white" />
                    </div>

                    {isUploadingAvatar && (
                      <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                        <RefreshCw className="w-5 h-5 text-brand animate-spin" />
                      </div>
                    )}
                  </div>
                </label>

                <div className="flex flex-col gap-2 flex-1 w-full">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-700 dark:text-neutral-300">
                      Profile picture URL
                    </label>
                    <label className="cursor-pointer text-xs font-medium text-brand hover:underline flex items-center gap-1 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarFile}
                        disabled={isUploadingAvatar}
                      />
                      <Upload className="w-3.5 h-3.5" />
                      <span>
                        {isUploadingAvatar ? "Uploading..." : "Change photo"}
                      </span>
                    </label>
                  </div>
                  <Input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://example.com/avatars/avatar.png"
                    className="text-xs font-mono"
                  />
                </div>
              </div>

              <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col gap-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-neutral-300 mb-1.5">
                      Full name
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-neutral-300 mb-1.5">
                      Login email address
                    </label>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-[#222225]">
                  <Button type="submit" variant="glow" className="text-xs px-6">
                    {profileSuccess ? "Saved successfully!" : "Save changes"}
                  </Button>
                </div>
              </div>
            </form>
          )}

          {/* TAB 2: BILLING & INVOICES */}
          {activeTab === "billing" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-[#222225]">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      Plan &amp; Billing
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-subtle text-brand border border-brand-subtle text-[10px] font-extrabold uppercase tracking-wider">
                      {plan}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
                    Manage your Edge infrastructure quotas, legal billing
                    details, and download compliant invoices.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="glow"
                  onClick={() => router.push("/pricing")}
                  className="cursor-pointer font-bold shrink-0"
                >
                  Change Plan
                </Button>
              </div>

              {/* Subscription & Auto-Renewal Management Card */}
              <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col gap-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-[#222225]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-brand/10 border border-brand/20 flex items-center justify-center text-brand shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                          Abonnement &amp; Renouvellement Automatique
                        </h3>
                        {isPaidPlan && (
                          isCanceledAtPeriodEnd ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Annulation programmée
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Renouvellement actif
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
                        Gérez la récurrence de vos paiements, votre date d&apos;échéance et vos options de résiliation.
                      </p>
                    </div>
                  </div>

                  {/* Header Status / Action: Only resume button when canceled; NO duplicate cancel button */}
                  {isPaidPlan && isCanceledAtPeriodEnd && (
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleResumeSubscription}
                        disabled={resumingSub}
                        className="h-8 text-xs font-semibold rounded-[8px] border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 cursor-pointer gap-1.5"
                      >
                        {resumingSub ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <RefreshCw className="w-3.5 h-3.5" />
                        )}
                        <span>Réactiver le renouvellement</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                {isPaidPlan ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-[8px] bg-zinc-50 dark:bg-[#161619] border border-zinc-200/80 dark:border-[#27272a] flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-neutral-400 uppercase tracking-wider">
                        Formule Actuelle
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-zinc-900 dark:text-white">
                          LShorter {plan}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-neutral-400">
                          ({subCycle === "YEARLY" ? "Annuel" : "Mensuel"})
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-neutral-500">
                        Facturation certifiée Paddle
                      </span>
                    </div>

                    <div className="p-3.5 rounded-[8px] bg-zinc-50 dark:bg-[#161619] border border-zinc-200/80 dark:border-[#27272a] flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-neutral-400 uppercase tracking-wider">
                        {isCanceledAtPeriodEnd ? "Fin de la période payée" : "Prochaine échéance"}
                      </span>
                      <div className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-brand" />
                        <span>{displayPeriodEnd}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-neutral-500">
                        {isCanceledAtPeriodEnd
                          ? "Accès garanti jusqu'à cette date"
                          : "Prélèvement automatique Paddle"}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-[8px] bg-zinc-50 dark:bg-[#161619] border border-zinc-200/80 dark:border-[#27272a] flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-neutral-400 uppercase tracking-wider">
                        Statut du renouvellement
                      </span>
                      <div className="text-sm font-bold">
                        {isCanceledAtPeriodEnd ? (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            Résiliation programmée
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            Renouvellement automatique actif
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-neutral-500">
                        {isCanceledAtPeriodEnd
                          ? "Aucun prélèvement ultérieur"
                          : "Annulable à tout moment en 1 clic"}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-[8px] bg-zinc-50 dark:bg-[#161619] border border-zinc-200/80 dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        Vous utilisez actuellement la formule Gratuite (Freemium)
                      </span>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400">
                        Aucun abonnement récurrent ni carte bancaire n&apos;est enregistré. Vous n&apos;avez aucun prélèvement automatique.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="glow"
                      onClick={() => router.push("/pricing")}
                      className="rounded-[8px] font-bold text-xs shrink-0 cursor-pointer"
                    >
                      Découvrir les forfaits Pro
                    </Button>
                  </div>
                )}

                {/* Informational banner when cancellation is scheduled */}
                {isPaidPlan && isCanceledAtPeriodEnd && (
                  <div className="p-3 rounded-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold">
                        Votre renouvellement automatique est suspendu.
                      </span>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                        Conformément à nos conditions de vente pour les infrastructures numériques, vos services, liens, redirections edge et domaines restent <strong>100% actifs jusqu&apos;au {displayPeriodEnd}</strong>. Aucun autre prélèvement ne sera effectué sur votre moyen de paiement.
                      </p>
                    </div>
                  </div>
                )}

                {/* Policy reminder note */}
                {isPaidPlan && !isCanceledAtPeriodEnd && (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-neutral-500 pt-1">
                    <span className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>
                        L&apos;annulation empêche tout prélèvement automatique ultérieur et votre compte restera accessible jusqu&apos;à la fin de la période payée en cours.
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCancelSubModalOpen(true)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600 underline underline-offset-2 cursor-pointer transition-colors shrink-0 text-left sm:text-right"
                    >
                      Annuler le renouvellement automatique
                    </button>
                  </div>
                )}
              </div>

              {/* Quota gauges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600 dark:text-neutral-400 font-semibold">
                      Monthly Click Volume
                    </span>
                    <span
                      className="text-xs text-[#0066FF] dark:text-[#5294FF] font-semibold"
                      data-testid="billing-monthly-clicks-percent"
                    >
                      {plan === "ENTERPRISE" || clicksLimit === -1
                        ? "Unlimited clicks included"
                        : isOverage
                          ? `${billingClicksPercentLabel} (Overage active)`
                          : `${billingClicksPercentLabel} used`}
                    </span>
                  </div>
                  <p
                    className="text-2xl font-bold font-bebas text-zinc-900 dark:text-white"
                    data-testid="billing-monthly-clicks-count"
                  >
                    {(accountStats?.clicksThisMonth ?? 0).toLocaleString(
                      "en-US",
                    )}{" "}
                    / {clicksLimit === -1 ? "Unlimited" : (clicksLimit ?? 10000).toLocaleString("en-US")}
                  </p>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-[#27272a] overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isOverage && plan !== "ENTERPRISE" ? "bg-amber-500" : "bg-[#0066FF]"}`}
                      style={{ width: `${clicksBarWidthPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-neutral-500 pt-0.5">
                    <span>
                      {plan === "ENTERPRISE"
                        ? "Unlimited clicks included ($0 extra)"
                        : plan === "BUSINESS"
                          ? "Overage rate: $8 / 125,000 extra clicks"
                          : plan === "PRO"
                            ? "Overage rate: $3 / 50,000 extra clicks"
                            : "Hard limit at 10,000 clicks/month"}
                    </span>
                    {isOverage && (
                      <span className="text-amber-600 dark:text-amber-400 font-semibold">
                        {plan === "ENTERPRISE"
                          ? `+${(overageClicks ?? 0).toLocaleString()} clicks ($0 free overage)`
                          : `+${(overageClicks ?? 0).toLocaleString()} clicks ($${overageAmount.toFixed(2)} overage)`}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600 dark:text-neutral-400 font-semibold">
                      Custom Domains
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-neutral-400 font-bold">
                      {accountStats.domainsCount} of {domainsLimit === -1 ? "Unlimited" : domainsLimit}
                    </span>
                  </div>
                  <p className="text-2xl font-bold font-bebas text-zinc-900 dark:text-white">
                    {accountStats.domainsCount} / {domainsLimit === -1 ? "Unlimited" : domainsLimit}
                  </p>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-[#27272a] overflow-hidden mt-1">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${domainsLimit === -1 ? 100 : domainsLimit > 0 ? Math.min(100, (accountStats.domainsCount / domainsLimit) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-neutral-500">
                    {domainsLimit === -1
                      ? "Unlimited custom domains included"
                      : `${Math.max(0, domainsLimit - accountStats.domainsCount)} domain(s) available`}
                  </span>
                </div>
              </div>

              {/* Certified Paddle Invoices Table */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <span>
                        Factures Officielles Paddle (Merchant of Record)
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-neutral-400 mt-0.5">
                      Toutes vos transactions, taxes (TVA) et factures certifiées conformes générées par Paddle.
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                    Norme Fiscale HT / TVA / TTC • Reçus & Factures Certifiés
                  </span>
                </div>
                {loadingInvoices ? (
                  <div className="py-8 text-center text-xs text-zinc-500 dark:text-neutral-400 bg-white dark:bg-[#111113] rounded-[10px] border border-zinc-200 dark:border-[#222225] flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" />
                    <span>Synchronisation des factures Paddle en cours...</span>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500 dark:text-neutral-500 bg-white dark:bg-[#111113] rounded-[10px] border border-zinc-200 dark:border-[#222225]">
                    Aucune facture disponible. Vos factures officielles Paddle apparaîtront ici dès votre premier abonnement payant.
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white dark:bg-[#111113] rounded-[10px] border border-zinc-200 dark:border-[#222225]">
                    <table className="w-full text-left text-xs text-zinc-600 dark:text-neutral-400">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-[#27272a] text-[11px] uppercase tracking-wider text-zinc-500 dark:text-neutral-500">
                          <th className="py-3 px-3.5">Réf. Facture</th>
                          <th className="py-3 px-3.5">Date d&apos;émission</th>
                          <th className="py-3 px-3.5">Net HT</th>
                          <th className="py-3 px-3.5">TVA / Taxe</th>
                          <th className="py-3 px-3.5">Total TTC</th>
                          <th className="py-3 px-3.5">Statut</th>
                          <th className="py-3 px-3.5 text-right">
                            Facture Officielle
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-200 dark:divide-[#27272a]">
                        {invoices.map((inv) => (
                          <tr
                            key={inv.id}
                            className="hover:bg-zinc-100/60 dark:hover:bg-white/[0.02] transition-colors"
                          >
                            <td className="py-3 px-3.5 font-mono font-bold text-zinc-900 dark:text-white">
                              {inv.number}
                            </td>
                            <td className="py-3 px-3.5">{inv.date}</td>
                            <td className="py-3 px-3.5 font-mono text-zinc-700 dark:text-neutral-300">
                              {typeof inv.netAmount === "number" ? inv.netAmount.toFixed(2) : "0.00"} {inv.currency || "USD"}
                            </td>
                            <td className="py-3 px-3.5 font-mono text-zinc-500 dark:text-neutral-400">
                              {typeof inv.taxAmount === "number" && inv.taxAmount > 0
                                ? `${inv.taxAmount.toFixed(2)} ${inv.currency || "USD"}`
                                : `0.00 ${inv.currency || "USD"}`}
                            </td>
                            <td className="py-3 px-3.5 font-bold font-mono text-zinc-900 dark:text-white">
                              {typeof inv.totalAmount === "number"
                                ? `${inv.totalAmount.toFixed(2)} ${inv.currency || "USD"}`
                                : `0.00 ${inv.currency || "USD"}`}
                            </td>
                            <td className="py-3 px-3.5">
                              <Badge variant="active">Paid (Acquittée)</Badge>
                            </td>
                            <td className="py-3 px-3.5 text-right">
                              <button
                                onClick={() => handleDownloadInvoice(inv)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#465FFF]/10 hover:bg-[#465FFF] text-[#465FFF] hover:text-white border border-[#465FFF]/25 font-bold cursor-pointer transition-all text-xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download Official PDF</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: API & KEYS */}
          {activeTab === "api" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-[#222225]">
                <div>
                  <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-brand" />
                    <span>Developer API Keys</span>
                  </h1>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
                    Generate secure <code className="text-brand">lsh_live_...</code> tokens with granular permissions to integrate your applications.
                  </p>
                </div>
              </div>

              {/* Create Key Card */}
              <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col gap-4">
                <h3 className="text-xs font-bold text-zinc-700 dark:text-neutral-300 uppercase tracking-wider flex items-center gap-2">
                  <Plus className="w-3.5 h-3.5 text-brand" />
                  <span>Generate a new API key</span>
                </h3>

                <form
                  onSubmit={handleCreateApiKey}
                  className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3"
                >
                  <div className="flex-1">
                    <Input
                      required
                      placeholder="Application name (e.g. Telegram Bot, Zapier, Webhook...)"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      className="h-10 text-xs bg-white dark:bg-[#0c0c0e] border-zinc-200 dark:border-[#27272a]"
                    />
                  </div>
                  <div className="w-full sm:w-56 shrink-0">
                    <select
                      value={newKeyScope}
                      onChange={(e) =>
                        setNewKeyScope(
                          e.target.value as "read" | "read_write" | "admin",
                        )
                      }
                      className="w-full h-10 rounded-[10px] bg-white dark:bg-[#0c0c0e] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#27272a] px-3 text-xs focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option
                        value="read_write"
                        className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white"
                      >
                        Read & Write
                      </option>
                      <option
                        value="admin"
                        className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white"
                      >
                        Full Access (Admin)
                      </option>
                      <option
                        value="read"
                        className="bg-white dark:bg-[#141416] text-zinc-900 dark:text-white"
                      >
                        Read Only
                      </option>
                    </select>
                  </div>
                  <Button
                    type="submit"
                    variant="glow"
                    disabled={isCreatingKey || !newKeyName.trim()}
                    className="shrink-0 h-10 px-5 text-xs font-bold gap-1.5 shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {isCreatingKey ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Création en cours...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>Generate Key</span>
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Active Keys Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-zinc-700 dark:text-neutral-300 uppercase tracking-wider">
                    Active API Keys ({apiKeys.length})
                  </h3>
                </div>

                {isLoadingApiKeys && !isCreatingKey && apiKeys.length === 0 ? (
                  <div className="grid grid-cols-1 gap-3">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] animate-pulse flex flex-col gap-3 shadow-xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="h-4 w-32 bg-zinc-200 dark:bg-neutral-800 rounded-md" />
                            <div className="h-5 w-20 bg-zinc-200 dark:bg-neutral-800 rounded-[6px]" />
                            <div className="h-5 w-24 bg-zinc-200 dark:bg-neutral-800 rounded-[6px]" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-7 w-20 bg-zinc-200 dark:bg-neutral-800 rounded-md" />
                            <div className="h-7 w-16 bg-zinc-200 dark:bg-neutral-800 rounded-md" />
                            <div className="h-7 w-7 bg-zinc-200 dark:bg-neutral-800 rounded-md" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/70 dark:border-[#222225]">
                          <div className="h-4 w-64 bg-zinc-200 dark:bg-neutral-800 rounded font-mono" />
                          <div className="h-3 w-24 bg-zinc-200 dark:bg-neutral-800 rounded" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : apiKeys.length === 0 && !isCreatingKey ? (
                  <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2.5 bg-white dark:bg-[#111113] rounded-[10px] border border-zinc-200 dark:border-[#222225]">
                    <div className="w-10 h-10 rounded-[10px] bg-zinc-200/70 dark:bg-neutral-800/60 border border-zinc-300 dark:border-neutral-700/40 flex items-center justify-center text-zinc-500 dark:text-neutral-500">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-neutral-300">
                      No active API keys yet
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-neutral-500 max-w-xs">
                      Use the form above to generate your first authentication
                      key.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {/* Animated Skeleton Card when creating key */}
                    {isCreatingKey && (
                      <div className="p-4 rounded-[10px] bg-zinc-50/80 dark:bg-[#141416] border border-blue-500/40 dark:border-blue-500/30 animate-pulse flex flex-col gap-3 shadow-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <div className="h-4 w-32 bg-blue-200/70 dark:bg-blue-900/50 rounded-md" />
                            <div className="h-5 w-20 bg-blue-500/20 rounded-[6px]" />
                            <div className="h-5 w-24 bg-zinc-200 dark:bg-neutral-800 rounded-[6px]" />
                          </div>
                          <div className="flex items-center gap-1.5">
                            <div className="h-7 w-20 bg-zinc-200 dark:bg-neutral-800 rounded-md" />
                            <div className="h-7 w-16 bg-zinc-200 dark:bg-neutral-800 rounded-md" />
                            <div className="h-7 w-7 bg-zinc-200 dark:bg-neutral-800 rounded-md" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-zinc-200/70 dark:border-[#222225]">
                          <div className="h-4 w-64 sm:w-80 bg-zinc-200 dark:bg-neutral-800 rounded font-mono" />
                          <div className="h-3 w-24 bg-zinc-200 dark:bg-neutral-800 rounded" />
                        </div>
                      </div>
                    )}
                    {apiKeys.map((k) => {
                      const isRevealed = Boolean(revealedKeys[k.id]);
                      const actualKey = k.rawKey || k.prefix;
                      const displayKey = isRevealed
                        ? actualKey
                        : "••••••••••••••••••••••••••••••••••••••••";
                      const isCopied = copiedKeyId === k.id;

                      const getScopeBadge = (scope?: string) => {
                        if (scope === "admin")
                          return {
                            label: "Admin",
                            color:
                              "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
                          };
                        if (scope === "read")
                          return {
                            label: "Read Only",
                            color:
                              "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                          };
                        return {
                          label: "Read & Write",
                          color:
                            "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
                        };
                      };
                      const scopeInfo = getScopeBadge(k.scope);

                      return (
                        <div
                          key={k.id}
                          className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] hover:border-zinc-300 dark:hover:border-[#38383e] transition-all flex flex-col gap-3 shadow-xs"
                        >
                          {/* Key Header */}
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold text-sm text-zinc-900 dark:text-white">
                                {k.name}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-[6px] border text-[10px] font-semibold ${scopeInfo.color}`}
                              >
                                {scopeInfo.label}
                              </span>
                              <span className="px-2 py-0.5 rounded-[6px] bg-zinc-200/70 dark:bg-neutral-800/70 border border-zinc-300 dark:border-neutral-700/40 text-[10px] text-zinc-600 dark:text-neutral-400 font-mono">
                                {k.rateLimit || "600 req / min"}
                              </span>
                            </div>

                            <span className="text-[11px] text-zinc-500 dark:text-neutral-500">
                              Created on{" "}
                              {new Date(k.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  day: "numeric",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>

                          {/* Key Value & Actions Area */}
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-[8px] bg-zinc-50 dark:bg-[#161619] border border-zinc-200 dark:border-[#222226]">
                            <div className="flex-1 flex items-center gap-2 overflow-hidden">
                              <div className="font-mono text-xs text-brand truncate font-semibold select-all">
                                {displayKey}
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                              {/* Toggle Mask / Unmask */}
                              <button
                                type="button"
                                onClick={() => toggleRevealKey(k.id)}
                                className="h-8 px-2.5 rounded-[6px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1a1a1e] dark:hover:bg-[#25252c] border border-zinc-200 dark:border-[#2a2a30] text-zinc-700 hover:text-zinc-900 dark:text-neutral-300 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title={isRevealed ? "Hide key" : "Reveal key"}
                              >
                                {isRevealed ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 text-zinc-500 dark:text-neutral-400" />
                                    <span className="hidden sm:inline">
                                      Hide
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5 text-zinc-500 dark:text-neutral-400" />
                                    <span className="hidden sm:inline">
                                      Reveal
                                    </span>
                                  </>
                                )}
                              </button>

                              {/* Copy Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  handleCopy(actualKey);
                                  setCopiedKeyId(k.id);
                                  showToast.success(
                                    "API key copied to clipboard!",
                                  );
                                  setTimeout(() => setCopiedKeyId(null), 2000);
                                }}
                                className="h-8 px-2.5 rounded-[6px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1a1a1e] dark:hover:bg-[#25252c] border border-zinc-200 dark:border-[#2a2a30] text-zinc-700 hover:text-zinc-900 dark:text-neutral-300 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title="Copy key"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      Copied
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-neutral-400" />
                                    <span>Copy</span>
                                  </>
                                )}
                              </button>

                              {/* cURL Example Button */}
                              <button
                                type="button"
                                onClick={() => {
                                  const cmd = `curl -X POST https://api.lsho.cc/v1/links \\\n  -H "Authorization: Bearer ${actualKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"targetUrl":"https://example.com"}'`;
                                  handleCopy(cmd);
                                  showToast.success(
                                    "cURL example command copied!",
                                  );
                                }}
                                className="h-8 px-2.5 rounded-[6px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1a1a1e] dark:hover:bg-[#25252c] border border-zinc-200 dark:border-[#2a2a30] text-zinc-600 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title="Copy cURL example"
                              >
                                <span>cURL</span>
                              </button>

                              {/* Revoke Button with 10s Undo Toast */}
                              <button
                                type="button"
                                onClick={() => promptRevokeKeyWithUndo(k)}
                                className="h-8 w-8 rounded-[6px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                                title="Révoquer cette clé API"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* TypeScript SDK Code Preview Section */}
              <div className="rounded-[10px] bg-white dark:bg-[#111113] text-[#09090B] dark:text-white border border-zinc-200 dark:border-[#222225] p-5 flex flex-col gap-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[8px] bg-[#3178c6]/10 dark:bg-[#3178c6]/15 border border-[#3178c6]/20 dark:border-[#3178c6]/30 flex items-center justify-center text-[#3178c6]">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#09090B] dark:text-white">
                        Official TypeScript SDK (npm i lshorter-api)
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400">
                        Ready-to-use implementation examples
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 p-1 rounded-[8px] bg-zinc-100 dark:bg-[#161619] border border-zinc-200 dark:border-[#27272a] text-xs overflow-x-auto">
                    <button
                      onClick={() => setActiveCodeTab("create")}
                      className={`px-3 py-1.5 rounded-[10px] font-medium transition-colors cursor-pointer ${
                        activeCodeTab === "create"
                          ? "bg-brand text-white shadow-sm"
                          : "text-zinc-600 dark:text-neutral-400 hover:text-[#09090B] dark:hover:text-white"
                      }`}
                    >
                      Create Link
                    </button>
                    <button
                      onClick={() => setActiveCodeTab("track")}
                      className={`px-3 py-1.5 rounded-[10px] font-medium transition-colors cursor-pointer ${
                        activeCodeTab === "track"
                          ? "bg-brand text-white shadow-sm"
                          : "text-zinc-600 dark:text-neutral-400 hover:text-[#09090B] dark:hover:text-white"
                      }`}
                    >
                      Track Conversion
                    </button>
                    <button
                      onClick={() => setActiveCodeTab("analytics")}
                      className={`px-3 py-1.5 rounded-[10px] font-medium transition-colors cursor-pointer ${
                        activeCodeTab === "analytics"
                          ? "bg-brand text-white shadow-sm"
                          : "text-zinc-600 dark:text-neutral-400 hover:text-[#09090B] dark:hover:text-white"
                      }`}
                    >
                      Analytics
                    </button>
                  </div>
                </div>
              </div>
              <CodeBlock
                code={codeSnippets[activeCodeTab]}
                language="typescript"
                filename={`sdk - ${activeCodeTab}.ts`}
                className="min-h-150 sm:min-h-150"
              />
            </div>
          )}

          {/* TAB 4: DOMAINS (Real Live User Domains) */}
          {activeTab === "domains" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    White-Label Custom Domains
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400">
                    Redirect your short links through your own branded domain
                    names.
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="glow"
                  onClick={() => router.push("/dashboard/domains")}
                >
                  Manage Domains
                </Button>
              </div>

              {accountStats.userDomains.length === 0 ? (
                <div className="p-8 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col items-center justify-center gap-3 text-center shadow-xs">
                  <Globe2 className="w-10 h-10 text-zinc-400 dark:text-neutral-600" />
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">
                      No custom domains connected
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
                      Your links are currently using the default platform
                      domain.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="glow"
                    onClick={() => router.push("/dashboard/domains")}
                    className="mt-2"
                  >
                    Add a Domain
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {accountStats.userDomains.map((d: any, idx: number) => (
                    <div
                      key={d.id || idx}
                      className="flex items-center justify-between p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Globe2 className="w-5 h-5 text-brand" />
                        <div>
                          <p className="font-bold text-zinc-900 dark:text-white font-mono text-sm">
                            {d.domain}
                          </p>
                          <p className="text-[11px] text-zinc-500 dark:text-neutral-400">
                            DNS Target:{" "}
                            <span className="font-mono text-zinc-700 dark:text-neutral-300">
                              {d.dns_target ||
                                d.dnsTarget ||
                                "cname.lsho.cc"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="active">SSL Active</Badge>
                        <span className="text-zinc-500 dark:text-neutral-500 text-[11px]">
                          Edge OK
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: WEBHOOKS & SIMULATOR */}
          {activeTab === "webhooks" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-[#222225]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                      Webhooks &amp; Simulator
                    </h2>
                    {plan === "FREEMIUM" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
                        PLAN PRO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Receive instant HTTP (POST) notifications on every click and
                    conversion of your short links.
                  </p>
                </div>
              </div>

              {/* Freemium Banner */}
              {plan === "FREEMIUM" && (
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-zinc-100 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 flex items-center justify-center text-zinc-600 dark:text-neutral-400 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">
                          Webhooks API &amp; Real-Time Events
                        </h3>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400 border border-zinc-200 dark:border-neutral-700">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
                        Webhook subscriptions, HMAC SHA-256 signatures, and
                        real-time click streams are reserved for Pro and
                        Business plans.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                    triggerPlanUpgrade({
                      featureName: "Webhooks",
                      reason:
                        "Upgrade to PRO to unlock webhooks and the real-time simulator.",
                      targetPlan: "PRO",
                    })
                  }
                  className="shrink-0 text-xs h-8 px-3 font-medium bg-brand hover:bg-brand-hover text-white rounded-[8px] cursor-pointer transition-colors"
                >
                  Unlock with PRO
                </button>
              </div>
            )}

              {/* Webhooks Action Bar */}
              <div className="flex items-center justify-between gap-3 p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] shadow-xs">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs font-bold text-zinc-900 dark:text-white">
                    Points de terminaison Webhook ({webhooks.length})
                  </span>
                  <span className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                    Configurez vos endpoints avec choix des événements ou globalité
                  </span>
                </div>
                <Button
                  type="button"
                  size="sm"
                  variant="glow"
                  onClick={handleOpenCreateWebhook}
                  className="h-8 px-3.5 text-xs font-semibold gap-1.5 shrink-0 rounded-[8px] cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Nouveau Webhook</span>
                </Button>
              </div>

              <div className="flex flex-col gap-2.5">
                {isLoadingWebhooks && !isCreatingWebhook && webhooks.length === 0 ? (
                  <div className="flex flex-col gap-2.5">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] animate-pulse flex flex-col gap-2.5 text-xs shadow-xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="h-4 w-64 bg-zinc-200 dark:bg-neutral-800 rounded-[6px] font-mono" />
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="h-7 w-16 bg-zinc-200 dark:bg-neutral-800 rounded-[6px]" />
                            <div className="h-6 w-14 bg-zinc-200 dark:bg-neutral-800 rounded-[6px]" />
                            <div className="h-6 w-6 bg-zinc-200 dark:bg-neutral-800 rounded-[6px]" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-[#222225]">
                          <div className="h-3 w-44 bg-zinc-200 dark:bg-neutral-800 rounded-[4px] font-mono" />
                          <div className="h-3 w-32 bg-zinc-200 dark:bg-neutral-800 rounded-[4px]" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : webhooks.length === 0 && !isCreatingWebhook ? (
                  <div className="py-8 text-center text-xs text-zinc-500 dark:text-neutral-400 bg-white dark:bg-[#111113] rounded-[10px] border border-zinc-200 dark:border-[#222225] shadow-xs">
                    Aucun webhook configuré. Cliquez sur &quot;Nouveau Webhook&quot; pour connecter votre premier endpoint.
                  </div>
                ) : (
                  <>
                    {/* Animated Skeleton Card when creating webhook */}
                    {isCreatingWebhook && (
                      <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-blue-500/40 dark:border-blue-500/30 animate-pulse flex flex-col gap-2.5 text-xs shadow-xs">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            <div className="h-4 w-60 sm:w-80 bg-blue-200/70 dark:bg-blue-900/40 rounded-[6px] font-mono" />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="h-7 w-16 bg-zinc-200 dark:bg-neutral-800 rounded-[6px]" />
                            <div className="h-6 w-14 bg-emerald-500/20 rounded-[6px]" />
                            <div className="h-6 w-6 bg-zinc-200 dark:bg-neutral-800 rounded-[6px]" />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-zinc-500 dark:text-neutral-400 text-[11px] pt-2 border-t border-zinc-200 dark:border-[#222225]">
                          <div className="h-3 w-48 bg-zinc-200 dark:bg-neutral-800 rounded-[4px] font-mono" />
                          <div className="h-3 w-36 bg-zinc-200 dark:bg-neutral-800 rounded-[4px]" />
                        </div>
                      </div>
                    )}
                    {webhooks.map((wh: any) => {
                      const eventsList = Array.isArray(wh.events) && wh.events.length > 0 ? wh.events : ["click.created", "conversion.created"];
                      const isGlobal = eventsList.length >= 6;

                      return (
                        <div
                          key={wh.id}
                          className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] hover:border-zinc-300 dark:hover:border-[#38383e] transition-all flex flex-col gap-2.5 text-xs shadow-xs"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-neutral-900 dark:text-white font-semibold truncate">
                              {wh.url}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isTestingWebhook}
                                onClick={() => handleTestWebhook(wh.url, wh.secretKey)}
                                className="text-xs gap-1.5 h-7 px-2.5 rounded-[6px] border-neutral-200 dark:border-[#27272a] bg-white dark:bg-transparent cursor-pointer"
                              >
                                <Send className="w-3 h-3 text-neutral-400" />
                                <span>{isTestingWebhook ? "Sending..." : "Test"}</span>
                              </Button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditWebhook(wh)}
                                title="Modifier ce webhook"
                                className="p-1.5 rounded-[6px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleWebhook(wh.id)}
                                className={`px-2 py-0.5 rounded-[6px] text-[11px] font-medium cursor-pointer transition-colors ${
                                  wh.isActive
                                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                    : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                                }`}
                              >
                                {wh.isActive ? "Active" : "Paused"}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWebhookWithUndo(wh)}
                                className="text-neutral-400 hover:text-red-400 p-1 rounded-[6px] cursor-pointer transition-colors"
                                title="Supprimer ce webhook"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-2 text-neutral-500 dark:text-neutral-400 text-[11px] pt-2 border-t border-neutral-200 dark:border-[#222225]">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-[10px] text-zinc-400">Événements:</span>
                              {isGlobal ? (
                                <span className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-medium bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                                  Globalité (Tous les événements)
                                </span>
                              ) : (
                                eventsList.map((ev: string) => (
                                  <span
                                    key={ev}
                                    className="px-1.5 py-0.5 rounded-[4px] text-[10px] font-mono bg-zinc-200/70 dark:bg-neutral-800 text-zinc-700 dark:text-neutral-300 border border-zinc-300/50 dark:border-neutral-700/50"
                                  >
                                    {ev}
                                  </span>
                                ))
                              )}
                            </div>
                            <span className="font-mono text-[10px] text-zinc-400 truncate max-w-xs">
                              Secret: {wh.secretKey || "whsec_live_default"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>

              {/* Webhook Create / Edit Modal */}
              <WebhookModal
                isOpen={isWebhookModalOpen}
                onClose={() => setIsWebhookModalOpen(false)}
                webhookToEdit={webhookToEdit}
                onSave={handleSaveWebhookModal}
                isSaving={isSavingWebhookModal}
              />

              {/* Webhook Test Response Viewer */}
              {webhookTestResponse && (
                <div className="flex flex-col gap-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-emerald-600 dark:text-emerald-400 font-semibold px-1">
                    <span>✓ Webhook test response:</span>
                    <button
                      onClick={() => setWebhookTestResponse(null)}
                      className="text-neutral-400 hover:text-neutral-900 dark:hover:text-white cursor-pointer"
                    >
                      Close ✕
                    </button>
                  </div>
                  <CodeBlock
                    code={webhookTestResponse}
                    language="json"
                    filename="Webhook HTTP Response"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PIXELS RETARGETING */}
          {activeTab === "pixels" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 dark:border-[#222225]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-neutral-900 dark:text-white">
                      Retargeting Pixels
                    </h2>
                    {plan === "FREEMIUM" && (
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
                        PLAN PRO
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400">
                    Attach your Meta Facebook, Google Analytics 4, TikTok Ads,
                    or LinkedIn Insight tags to your short links.
                  </p>
                </div>
              </div>

              {/* Freemium Banner */}
              {plan === "FREEMIUM" && (
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-zinc-100 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 flex items-center justify-center text-zinc-600 dark:text-neutral-400 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-zinc-900 dark:text-white">
                          Advertising Retargeting Pixels
                        </h3>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-zinc-100 dark:bg-neutral-800 text-zinc-600 dark:text-neutral-400 border border-zinc-200 dark:border-neutral-700">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
                        Automatic pixel tracking for Meta, Google Tag, TikTok,
                        and LinkedIn is reserved for Pro and Business plans.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      triggerPlanUpgrade({
                        featureName: "Retargeting Pixels",
                        reason:
                          "Upgrade to PRO to unlock Meta, Google, TikTok, and LinkedIn pixel retargeting.",
                        targetPlan: "PRO",
                      })
                    }
                    className="shrink-0 text-xs h-8 px-3 font-medium bg-brand hover:bg-brand-hover text-white rounded-[8px] cursor-pointer transition-colors"
                  >
                    Unlock with PRO
                  </button>
                </div>
              )}

              <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] shadow-xs">
                <form
                  onSubmit={handleAddPixel}
                  className="grid grid-cols-1 sm:grid-cols-4 gap-2"
                >
                  <select
                    value={newPixelPlatform}
                    onChange={(e) => setNewPixelPlatform(e.target.value as any)}
                    className="h-9 rounded-[8px] bg-white dark:bg-[#161619] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#27272a] px-3 text-xs focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option
                      value="meta"
                      className="bg-white dark:bg-[#161619] text-zinc-900 dark:text-white"
                    >
                      Meta Facebook Pixel
                    </option>
                    <option
                      value="google"
                      className="bg-white dark:bg-[#161619] text-zinc-900 dark:text-white"
                    >
                      Google Analytics (GA4)
                    </option>
                    <option
                      value="tiktok"
                      className="bg-white dark:bg-[#161619] text-zinc-900 dark:text-white"
                    >
                      TikTok Ads Pixel
                    </option>
                    <option
                      value="linkedin"
                      className="bg-white dark:bg-[#161619] text-zinc-900 dark:text-white"
                    >
                      LinkedIn Insight Tag
                    </option>
                  </select>
                  <Input
                    placeholder="Pixel Name (e.g. My Meta Ads)"
                    value={newPixelName}
                    onChange={(e) => setNewPixelName(e.target.value)}
                    className="bg-white dark:bg-[#161619] border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 h-9"
                  />
                  <Input
                    required
                    placeholder="Pixel ID (e.g. 987654321 or G-XXXXXX)"
                    value={newPixelId}
                    onChange={(e) => setNewPixelId(e.target.value)}
                    className="bg-white dark:bg-[#161619] border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-neutral-500 h-9"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    className="text-xs h-9 px-4 font-semibold bg-brand hover:bg-brand-hover text-white rounded-[8px] cursor-pointer"
                  >
                    Connect Pixel
                  </Button>
                </form>
              </div>

              <div className="flex flex-col gap-2.5">
                {isLoadingPixels ? (
                  <div className="py-8 text-center text-xs text-zinc-500 dark:text-neutral-400 bg-white dark:bg-[#111113] rounded-[10px] border border-zinc-200 dark:border-[#222225] shadow-xs">
                    Loading connected pixels...
                  </div>
                ) : pixels.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500 dark:text-neutral-400 bg-white dark:bg-[#111113] rounded-[10px] border border-zinc-200 dark:border-[#222225] shadow-xs">
                    No retargeting pixels configured. Connect your first tag above to start syncing audiences.
                  </div>
                ) : (
                  pixels.map((px: any) => (
                    <div
                      key={px.id}
                      className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex items-center justify-between text-xs shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white dark:bg-[#18181b] border border-neutral-200 dark:border-[#27272a] flex items-center justify-center shrink-0">
                          <PixelBrandLogo platform={px.platform || px.name} className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold text-neutral-900 dark:text-white">
                              {px.name}
                            </p>
                            <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-neutral-200/60 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 uppercase">
                              {px.platform}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
                            <span className="font-mono">ID: {px.pixelId}</span>
                            <span>•</span>
                            <span>{px.eventsTrackedCount ?? 0} events tracked</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePixel(px.id)}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                            px.isActive
                              ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF] border border-[#0066FF]/20"
                              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                          }`}
                        >
                          {px.isActive ? "Active" : "Paused"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePixelWithUndo(px)}
                          className="text-neutral-400 hover:text-red-400 p-1 cursor-pointer transition-colors"
                          title="Supprimer ce pixel"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY & 2FA */}
          {activeTab === "security" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Security & Active Sessions
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400">
                    Protect your account with TOTP Two-Factor Authentication and
                    manage connected devices.
                  </p>
                </div>
              </div>

              {/* 2FA Card */}
              <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-[8px] flex items-center justify-center shrink-0 border ${
                      is2FAEnabled
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-brand/10 border-brand/20 text-brand"
                    }`}
                  >
                    {is2FAEnabled ? (
                      <ShieldCheck className="w-5 h-5" />
                    ) : (
                      <Smartphone className="w-5 h-5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white">
                        Two-Factor Authentication (2FA / TOTP)
                      </p>
                      {is2FAEnabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3 h-3" />
                          <span>Enabled &amp; Secured (RFC 6238)</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 text-[10px] font-semibold text-zinc-600 dark:text-neutral-400">
                          Not configured
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-neutral-400 mt-0.5">
                      Compatible with Google Authenticator, Apple Passwords,
                      Microsoft Authenticator, Authy, and 1Password.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                  {is2FAEnabled ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowRecoveryCodesModal(true)}
                        className="text-xs h-9 border-zinc-200 dark:border-[#222225] gap-1.5 cursor-pointer"
                      >
                        <KeyRound className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                        <span>Recovery codes</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDisable2FA}
                        className="text-xs h-9 border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
                      >
                        Disable
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      variant="glow"
                      onClick={() => setShow2FASetupModal(true)}
                      className="text-xs h-9 px-4 font-bold gap-1.5 cursor-pointer shadow-xs rounded-[8px]"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Enable 2FA</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Change Password */}
              <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col gap-3 shadow-xs">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Change password
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-white dark:bg-[#161619] border-zinc-200 dark:border-[#27272a]"
                  />
                  <Input
                    type="password"
                    placeholder="New password (min 8 chars)"
                    value={newPassword}
                    onChange={(e) => handlePasswordInput(e.target.value)}
                    className="bg-white dark:bg-[#161619] border-zinc-200 dark:border-[#27272a]"
                  />
                </div>

                {newPassword && (
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between text-zinc-500 dark:text-neutral-400">
                      <span>Password strength</span>
                      <span className="text-zinc-900 dark:text-white font-bold">
                        {passwordStrength}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-[#27272a] overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength <= 50
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="glow"
                  disabled={
                    isUpdatingPassword || !newPassword || newPassword.length < 8
                  }
                  onClick={handleChangePassword}
                  className="w-fit text-xs rounded-[8px]"
                >
                  {isUpdatingPassword ? "Updating..." : "Update password"}
                </Button>
              </div>

              {/* Real Live Active Session */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Active Session &amp; Hardware Detection
                </p>
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-xs">
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="p-2 rounded-[8px] bg-brand-light text-brand shrink-0 mt-0.5 sm:mt-0">
                      <Laptop className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-zinc-900 dark:text-white text-xs truncate">
                          {currentSessionInfo.device} ·{" "}
                          {currentSessionInfo.browser}
                        </span>
                        <Badge
                          variant="active"
                          className="shrink-0 text-[10px]"
                        >
                          Current Session
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-neutral-500 mt-0.5">
                        Network: {currentSessionInfo.ip} ·{" "}
                        {currentSessionInfo.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pl-11 sm:pl-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      Online
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: NOTIFICATIONS (TARGET & LIMIT ALERTS) */}
          {activeTab === "notifications" && (() => {
            const globalAlert = targetAlerts.find((a) => !a.linkId);
            const individualAlerts = targetAlerts.filter((a) => a.linkId);

            const filteredAlerts = individualAlerts.filter((a) => {
              if (activeAlertFilter === "all") return true;
              return a.status === activeAlertFilter;
            });

            const activeCount = individualAlerts.filter((a) => a.status === "active").length;
            const pausedCount = individualAlerts.filter((a) => a.status === "paused").length;
            const reachedCount = individualAlerts.filter((a) => a.status === "reached").length;

            // Global stats
            const globalCurrent = globalAlert?.currentValue ?? accountStats.clicksThisMonth ?? 0;
            const globalTarget = globalAlert?.targetValue ?? 2500;
            const globalProgressPct = Math.min(100, Math.round((globalCurrent / (globalTarget || 1)) * 100));

            const isRevenue = globalAlert?.metricType === "revenue";
            const globalCurrentFormatted = isRevenue
              ? `$${globalCurrent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : globalCurrent.toLocaleString();
            const globalTargetFormatted = isRevenue
              ? `$${globalTarget.toLocaleString("en-US")}`
              : globalTarget.toLocaleString();

            return (
              <div className="flex flex-col gap-6">
                {/* Main Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-[#222225]">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      Target &amp; Limit Alerts
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
                      Set custom click or revenue limits per link or workspace-wide, with real-time tracking and automated notifications.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="glow"
                    onClick={() => {
                      if (!isPremium) {
                        triggerPlanUpgrade({
                          featureName: "Alertes par Lien",
                          reason: "Passez au forfait PRO pour configurer des alertes de clics, de revenus et d'expiration sur vos liens individuels.",
                          targetPlan: "PRO",
                        });
                        return;
                      }
                      handleOpenCreateModal();
                    }}
                    className="h-9 px-4 text-xs font-semibold gap-2 self-start sm:self-auto cursor-pointer shadow-sm shrink-0 rounded-[8px]"
                  >
                    {!isPremium ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>New Link Alert</span>
                    {!isPremium && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                        PRO
                      </span>
                    )}
                  </Button>
                </div>

                {/* ─── SECTION 1: GLOBAL WORKSPACE TARGET (MONTHLY) ─────────── */}
                <div className="rounded-[10px] border border-zinc-200 dark:border-[#222225] bg-white dark:bg-[#111113] p-5 shadow-xs">
                  <div className="flex items-start justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-[#202024]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[8px] bg-brand/10 text-brand flex items-center justify-center border border-brand/20 shrink-0">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                          Global Workspace Target (Monthly)
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
                          Synchronized with your main dashboard Monthly Target. Locked to monthly tracking.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 relative" data-row-menu>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        globalAlert?.status === "paused"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          globalAlert?.status === "paused" ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                        }`} />
                        {globalAlert?.status === "paused" ? "Paused" : "Active"}
                      </span>

                      {/* 3-dots menu button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenRowMenuId(openRowMenuId === (globalAlert?.id || "global") ? null : (globalAlert?.id || "global"));
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        aria-label="Actions menu"
                        aria-haspopup="menu"
                        aria-expanded={openRowMenuId === (globalAlert?.id || "global")}
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>

                      {/* Dropdown Popup */}
                      {openRowMenuId === (globalAlert?.id || "global") && (
                        <div className="absolute right-0 top-9 w-44 rounded-[10px] border border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#161619] shadow-xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                          <button
                            type="button"
                            onClick={() => globalAlert && handleTogglePauseTarget(globalAlert)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                          >
                            {globalAlert?.status === "paused" ? (
                              <>
                                <Play className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Resume Alert</span>
                              </>
                            ) : (
                              <>
                                <Pause className="w-3.5 h-3.5 text-amber-600" />
                                <span>Pause Alert</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => globalAlert && handleOpenEditModal(globalAlert)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                          >
                            <Sliders className="w-3.5 h-3.5 text-blue-600" />
                            <span>Edit Target</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => globalAlert && handleTestTarget(globalAlert)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                            <span>Send Test Alert</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Display */}
                  <div className="mt-4 pt-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          Monthly Progress
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {globalAlert?.metricType === "revenue" ? "Revenue ($)" : "Total Clicks"}
                        </span>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-sm font-bold text-zinc-900 dark:text-white">
                          {globalProgressPct}%
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono font-medium">
                          {globalCurrentFormatted} / {globalTargetFormatted}
                        </span>
                      </div>
                    </div>

                    <div className="w-full h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mt-2">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(0, globalProgressPct))}%` }}
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-4 mt-3 text-[11px] text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        Period: <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">Monthly (Workspace locked)</strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-zinc-400" />
                        Channels: <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">Email + Bell Notification</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* ─── SECTION 2: INDIVIDUAL LINK ALERTS ──────────────────────── */}
                <div className="flex flex-col gap-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                          Individual Link Alerts
                        </h3>
                        {!isPremium && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                            RÉSERVÉ AUX FORFAITS PRO
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400">
                        Custom thresholds per short link with automated notifications
                      </p>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg text-xs font-medium self-start sm:self-auto">
                      {(
                        [
                          { id: "all", label: `All (${individualAlerts.length})` },
                          { id: "active", label: `Active (${activeCount})` },
                          { id: "paused", label: `Paused (${pausedCount})` },
                          { id: "reached", label: `Reached (${reachedCount})` },
                        ] as const
                      ).map((tab) => (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setActiveAlertFilter(tab.id)}
                          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                            activeAlertFilter === tab.id
                              ? "bg-white dark:bg-[#1a1a1e] text-zinc-900 dark:text-white shadow-sm"
                              : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* List of Link Alerts */}
                  {!isPremium ? (
                    <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
                      <div className="flex items-start sm:items-center gap-3.5">
                        <div className="w-10 h-10 rounded-[8px] bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0">
                          <Lock className="w-5 h-5" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white">
                              Alertes Individuelles par Lien
                            </h4>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                              PLAN PRO
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-neutral-400 leading-relaxed max-w-xl">
                            La configuration d'alertes personnalisées par lien (seuils de clics, revenus attribués et avertissements d'expiration en temps réel) est réservée aux abonnés Premium. Votre formule Standard bénéficie déjà de l'accès complet à l'<strong>Objectif Global du Workspace</strong> ci-dessus.
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="glow"
                        onClick={() =>
                          triggerPlanUpgrade({
                            featureName: "Alertes par Lien",
                            reason: "Passez au forfait PRO pour configurer des alertes de clics, de revenus et d'expiration sur vos liens individuels.",
                            targetPlan: "PRO",
                          })
                        }
                        className="h-8 px-4 text-xs font-semibold shrink-0 self-start sm:self-auto cursor-pointer shadow-sm rounded-[8px]"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        <span>Débloquer avec PRO</span>
                      </Button>
                    </div>
                  ) : isLoadingTargets && !isSavingAlert ? (
                    <div className="flex flex-col gap-2.5">
                      {[1, 2].map((i) => (
                        <div
                          key={i}
                          className="p-4 rounded-[10px] border border-zinc-200 dark:border-[#222225] bg-white dark:bg-[#111113] animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded" />
                              <div className="h-4 w-24 bg-blue-500/10 rounded" />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="h-4 w-14 bg-zinc-200 dark:bg-zinc-800 rounded" />
                              <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                              <div className="h-4 w-16 bg-emerald-500/10 rounded" />
                            </div>
                          </div>
                          <div className="w-full md:w-64 shrink-0">
                            <div className="flex justify-between items-baseline mb-2">
                              <div className="h-4 w-10 bg-zinc-200 dark:bg-zinc-800 rounded" />
                              <div className="h-3 w-24 bg-zinc-200 dark:bg-zinc-800 rounded font-mono" />
                            </div>
                            <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredAlerts.length === 0 && !isSavingAlert ? (
                    <div className="p-8 text-center border border-dashed border-zinc-200 dark:border-[#222225] rounded-[10px] bg-white dark:bg-[#111113] shadow-xs">
                      <Sliders className="w-7 h-7 text-zinc-300 dark:text-zinc-600 mx-auto mb-2" />
                      <h4 className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                        No alerts match the selected filter
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
                        Create an alert on any of your short links to get notified as soon as a click limit or revenue target is reached.
                      </p>
                      <Button
                        type="button"
                        variant="glow"
                        onClick={handleOpenCreateModal}
                        className="mt-4 h-8 px-4 text-xs font-medium cursor-pointer"
                      >
                        <Plus className="w-3 h-3 mr-1.5" />
                        Create Alert
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {/* Animated Skeleton Card when creating alert */}
                      {isSavingAlert && (
                        <div className="p-4 rounded-[10px] border border-blue-500/40 dark:border-blue-500/30 bg-blue-50/20 dark:bg-blue-950/20 animate-pulse flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                              </span>
                              <div className="h-4 w-44 bg-blue-200/70 dark:bg-blue-900/60 rounded" />
                              <div className="h-4 w-24 bg-blue-500/20 rounded font-mono" />
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="h-4 w-14 bg-zinc-200 dark:bg-zinc-800 rounded" />
                              <div className="h-4 w-16 bg-zinc-200 dark:bg-zinc-800 rounded" />
                              <div className="h-4 w-16 bg-emerald-500/20 rounded" />
                            </div>
                          </div>
                          <div className="w-full md:w-64 shrink-0">
                            <div className="flex justify-between items-baseline mb-2">
                              <div className="h-4 w-10 bg-blue-200 dark:bg-blue-900/60 rounded" />
                              <div className="h-3 w-28 bg-zinc-200 dark:bg-zinc-800 rounded font-mono" />
                            </div>
                            <div className="w-full h-1.5 bg-blue-500/30 rounded-full overflow-hidden">
                              <div className="h-full w-1/3 bg-blue-500 rounded-full" />
                            </div>
                          </div>
                        </div>
                      )}
                      {filteredAlerts.map((alert) => {
                        const current = alert.currentValue || 0;
                        const target = alert.targetValue || 1;
                        const pct = Math.min(100, Math.round((current / target) * 100));
                        const isRev = alert.metricType === "revenue";

                        const periodLabel =
                          alert.period === "day"
                            ? "Day"
                            : alert.period === "week"
                              ? "Week"
                              : "Month";

                        return (
                          <div
                            key={alert.id}
                            className="p-4 rounded-[10px] border border-zinc-200 dark:border-[#222225] bg-white dark:bg-[#111113] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:border-brand shadow-xs relative cursor-default"
                          >
                            {/* Link Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-xs text-zinc-900 dark:text-white truncate max-w-xs">
                                  {alert.linkTitle || (alert.slug ? `lsho.cc/${alert.slug}` : "Custom Alert")}
                                </span>
                                {alert.slug && (
                                  <span className="text-[11px] font-mono text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded border border-blue-200/50 dark:border-blue-900/30">
                                    lsho.cc/{alert.slug}
                                  </span>
                                )}
                              </div>

                              <div className="flex flex-wrap items-center gap-2 mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
                                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 font-medium">
                                  {periodLabel}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800/80 font-medium">
                                  {isRev ? "Revenue ($)" : "Clicks"}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded font-semibold text-[10px] border ${
                                    alert.status === "reached"
                                      ? "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800"
                                      : alert.status === "paused"
                                        ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                                  }`}
                                >
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full ${
                                      alert.status === "reached"
                                        ? "bg-purple-500"
                                        : alert.status === "paused"
                                          ? "bg-amber-500"
                                          : "bg-emerald-500"
                                    }`}
                                  />
                                  {alert.status === "reached"
                                    ? "Reached"
                                    : alert.status === "paused"
                                      ? "Paused"
                                      : "Active"}
                                </span>
                                {alert.notifyExpired && Boolean(alert.linkId) && (
                                  <span className="text-[10px] text-zinc-400">
                                    · Alerte à l&apos;expiration exacte
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Clean, Uncluttered Progress Column */}
                            <div className="w-full md:w-64 shrink-0">
                              <div className="flex items-baseline justify-between text-xs">
                                <span className="text-sm font-bold text-zinc-900 dark:text-white">
                                  {pct}%
                                </span>
                                <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono font-medium">
                                  {isRev
                                    ? `$${current.toLocaleString("en-US", { minimumFractionDigits: 0 })} / $${target.toLocaleString("en-US")}`
                                    : `${current.toLocaleString()} / ${target.toLocaleString()}`}
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden mt-1.5">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    pct >= 100
                                      ? "bg-purple-600"
                                      : alert.status === "paused"
                                        ? "bg-zinc-400"
                                        : "bg-blue-600"
                                  }`}
                                  style={{ width: `${Math.min(100, Math.max(0, pct))}%` }}
                                />
                              </div>
                            </div>

                            {/* 3-dots Menu Button */}
                            <div className="relative self-end md:self-center" data-row-menu>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setOpenRowMenuId(openRowMenuId === alert.id ? null : alert.id);
                                }}
                                className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                                aria-label="Open menu"
                                aria-haspopup="menu"
                                aria-expanded={openRowMenuId === alert.id}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>

                              {/* Dropdown Popup */}
                              {openRowMenuId === alert.id && (
                                <div className="absolute right-0 top-9 w-44 rounded-[10px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#1a1a1e] shadow-xl p-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                                  <button
                                    type="button"
                                    onClick={() => handleTogglePauseTarget(alert)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                                  >
                                    {alert.status === "paused" ? (
                                      <>
                                        <Play className="w-3.5 h-3.5 text-emerald-600" />
                                        <span>Resume Alert</span>
                                      </>
                                    ) : (
                                      <>
                                        <Pause className="w-3.5 h-3.5 text-amber-600" />
                                        <span>Pause Alert</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(alert)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                                  >
                                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                                    <span>Edit Alert</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTestTarget(alert)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                                    <span>Send Test Alert</span>
                                  </button>
                                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTarget(alert.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer text-left"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Delete Alert</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* ─── DRAWER: CREATE / EDIT ALERT (RIGHT ON DESKTOP, BOTTOM ON MOBILE) ─── */}
                <Drawer
                  open={isAlertModalOpen}
                  onOpenChange={setIsAlertModalOpen}
                  direction={isMobile ? "bottom" : "right"}
                >
                  <DrawerContent
                    direction={isMobile ? "bottom" : "right"}
                    widthClass="w-full sm:max-w-[480px]"
                    className="h-auto max-h-[88vh] md:h-full md:max-h-full flex flex-col bg-white dark:bg-[#121215] border-zinc-200 dark:border-[#27272a] rounded-[10px] shadow-2xl overflow-hidden"
                  >
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 dark:border-[#202024] shrink-0">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-[8px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/40 shrink-0">
                          <Target className="w-4 h-4" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                            {isEditingGlobalAlert
                              ? "Modifier l'Objectif Mensuel Global"
                              : editingAlert
                                ? "Modifier l'Alerte"
                                : "Nouvelle Alerte de Performance"}
                          </h3>
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                            {isEditingGlobalAlert
                              ? "Configurez l'objectif de clics ou revenus du workspace"
                              : "Définissez des seuils de clics, revenus ou les deux combinés"}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAlertModalOpen(false)}
                        className="p-1.5 rounded-[8px] text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-[#1f1f23] transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Scrollable Form Body */}
                    <form onSubmit={handleSaveTarget} noValidate className="flex-1 overflow-y-auto p-5 flex flex-col gap-4 text-xs">
                      {/* Link Selection (hidden if editing global) */}
                      {!isEditingGlobalAlert && (
                        <div className="flex flex-col gap-1.5 text-xs">
                          <label htmlFor="target-link-select" className="font-semibold text-zinc-700 dark:text-zinc-300">
                            Cible de l&apos;Alerte (Lien ou Global)
                          </label>
                          <select
                            id="target-link-select"
                            value={alertLinkId}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!isPremium && val !== "global") {
                                triggerPlanUpgrade({
                                  featureName: "Alertes par Lien",
                                  reason: "La configuration d'alertes par lien individuel requiert le forfait Pro.",
                                  targetPlan: "PRO",
                                });
                                return;
                              }
                              setAlertLinkId(val);
                              if (val === "global") {
                                setAlertNotifyExpired(false);
                              }
                            }}
                            className="h-9 px-3 rounded-[8px] bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="global">
                              🌐 Global (Tous les liens du workspace)
                            </option>
                            {userLinksList.map((link: any) => (
                              <option key={link.id || link.slug} value={String(link.id || link.slug)}>
                                🔗 {link.title || `lsho.cc/${link.slug}`} (lsho.cc/{link.slug})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Metric Type Selector with 3 Options: Clicks, Revenue, or Both */}
                      <div className="flex flex-col gap-1.5 text-xs">
                        <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                          Métrique à Surveiller
                        </label>
                        <div className="grid grid-cols-3 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setAlertMetricType("clicks")}
                            className={`h-9 rounded-[8px] font-semibold text-[11px] border transition-all cursor-pointer ${
                              alertMetricType === "clicks"
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                            }`}
                          >
                            Total Clics
                          </button>
                          <button
                            type="button"
                            onClick={() => setAlertMetricType("revenue")}
                            className={`h-9 rounded-[8px] font-semibold text-[11px] border transition-all cursor-pointer ${
                              alertMetricType === "revenue"
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                            }`}
                          >
                            Revenus ($)
                          </button>
                          <button
                            type="button"
                            onClick={() => setAlertMetricType("both")}
                            className={`h-9 rounded-[8px] font-semibold text-[11px] border transition-all cursor-pointer ${
                              alertMetricType === "both"
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                            }`}
                          >
                            Les 2 Types
                          </button>
                        </div>
                      </div>

                      {/* Threshold Inputs based on Metric Type */}
                      {alertMetricType === "both" ? (
                        <div className="flex flex-col gap-3 p-3 rounded-[8px] bg-zinc-50/70 dark:bg-[#18181b]/70 border border-zinc-200 dark:border-[#27272a]">
                          {/* Clicks Threshold in Dual Mode */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                                Seuil Clics Total
                              </span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                                {alertTargetClicks.toLocaleString()} clics
                              </span>
                            </div>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={alertTargetClicks}
                              onChange={(e) => setAlertTargetClicks(Math.max(1, Number(e.target.value) || 0))}
                              className="h-8 px-3 rounded-[6px] bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-zinc-400">Presets:</span>
                              {[500, 1000, 2500, 5000, 10000].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setAlertTargetClicks(preset)}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 cursor-pointer"
                                >
                                  {preset.toLocaleString()}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                          {/* Revenue Threshold in Dual Mode */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                                Seuil Revenus Attribués ($)
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                                ${alertTargetRevenue.toLocaleString()} USD
                              </span>
                            </div>
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={alertTargetRevenue}
                              onChange={(e) => setAlertTargetRevenue(Math.max(1, Number(e.target.value) || 0))}
                              className="h-8 px-3 rounded-[6px] bg-white dark:bg-[#121215] border border-zinc-200 dark:border-zinc-700 text-xs font-mono font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-zinc-400">Presets:</span>
                              {[100, 500, 1000, 2500, 5000].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setAlertTargetRevenue(preset)}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 cursor-pointer"
                                >
                                  ${preset.toLocaleString()}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Single Metric Input */
                        <div className="flex flex-col gap-1.5 text-xs">
                          <label className="font-semibold text-zinc-700 dark:text-zinc-300">
                            Valeur Seuil d&apos;Alerte
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={alertTargetValue}
                              onChange={(e) => setAlertTargetValue(Math.max(1, Number(e.target.value) || 0))}
                              className="flex-1 h-9 px-3 rounded-[8px] bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs font-mono font-bold text-zinc-900 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                            <span className="font-semibold text-xs text-blue-600 dark:text-blue-400 shrink-0">
                              {alertMetricType === "revenue" ? "USD ($)" : "clics"}
                            </span>
                          </div>
                          {/* Quick presets */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] text-zinc-400">Rapide:</span>
                            {(alertMetricType === "revenue"
                              ? [100, 500, 1000, 2500, 5000]
                              : [500, 1000, 2500, 5000, 10000]
                            ).map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setAlertTargetValue(preset)}
                                className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                              >
                                {alertMetricType === "revenue" ? `$${preset.toLocaleString()}` : preset.toLocaleString()}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Period Selection (Day, Week, Month) */}
                      <div className="flex flex-col gap-1.5 text-xs">
                        <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center justify-between">
                          <span>Période de Calcul</span>
                          {isEditingGlobalAlert && (
                            <span className="text-[10px] text-zinc-400 font-normal">
                              Verrouillé sur Mensuel pour le workspace
                            </span>
                          )}
                        </label>
                        {isEditingGlobalAlert ? (
                          <div className="h-9 px-3 rounded-[8px] bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center">
                            Mensuel (Objectif du Workspace)
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {(
                              [
                                { id: "day", label: "Jour" },
                                { id: "week", label: "Semaine" },
                                { id: "month", label: "Mois" },
                              ] as const
                            ).map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => setAlertPeriod(p.id)}
                                className={`h-8 rounded-[8px] font-semibold text-xs border transition-all cursor-pointer ${
                                  alertPeriod === p.id
                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                    : "bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-zinc-700 dark:text-zinc-300 hover:border-zinc-300"
                                }`}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Options & Channels */}
                      <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100 dark:border-[#202024] text-xs">
                        {(() => {
                          const isGlobalTarget = isEditingGlobalAlert || !alertLinkId || alertLinkId === "global";
                          return (
                            <label
                              htmlFor="drawer_alert_notify_expired"
                              className={`flex items-center justify-between p-2.5 rounded-[8px] border transition-colors ${
                                isGlobalTarget
                                  ? "bg-zinc-100/70 dark:bg-[#151518] border-zinc-200/60 dark:border-zinc-800/60 opacity-60 cursor-not-allowed select-none"
                                  : "bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-zinc-700 cursor-pointer"
                              }`}
                            >
                              <div className="pr-3">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className={`font-semibold ${isGlobalTarget ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-900 dark:text-white"}`}>
                                    Alerte à l&apos;expiration du lien
                                  </p>
                                  {isGlobalTarget && (
                                    <span className="px-1.5 py-0.5 rounded-[6px] text-[9px] font-semibold bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                      Lien individuel requis
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                                  {isGlobalTarget
                                    ? "Inaccessible pour une cible globale. Sélectionnez un lien court spécifique ci-dessus pour être alerté au moment précis de son expiration."
                                    : "Recevez une notification instantanée au moment précis où le lien expire."}
                                </p>
                              </div>
                              <input
                                id="drawer_alert_notify_expired"
                                type="checkbox"
                                aria-label="Alerte à l'expiration du lien"
                                disabled={isGlobalTarget}
                                checked={isGlobalTarget ? false : alertNotifyExpired}
                                onChange={(e) => {
                                  if (!isGlobalTarget) {
                                    setAlertNotifyExpired(e.target.checked);
                                  }
                                }}
                                className={`w-4 h-4 accent-blue-600 shrink-0 ${
                                  isGlobalTarget ? "cursor-not-allowed opacity-40" : "cursor-pointer"
                                }`}
                              />
                            </label>
                          );
                        })()}

                        <label className="flex items-center justify-between p-2.5 rounded-[8px] bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 cursor-pointer transition-colors">
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-white">
                              Notification par Email
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              Alerte transactionnelle envoyée sur l&apos;adresse email de votre compte
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={alertNotifyEmail}
                            onChange={(e) => setAlertNotifyEmail(e.target.checked)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                          />
                        </label>

                        <label className="flex items-center justify-between p-2.5 rounded-[8px] bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 cursor-pointer transition-colors">
                          <div>
                            <p className="font-semibold text-zinc-900 dark:text-white">
                              Notification In-App (Cloche)
                            </p>
                            <p className="text-[10px] text-zinc-500">
                              Afficher un badge et une notification dans la barre supérieure
                            </p>
                          </div>
                          <input
                            type="checkbox"
                            checked={alertNotifyBell}
                            onChange={(e) => setAlertNotifyBell(e.target.checked)}
                            className="w-4 h-4 accent-blue-600 cursor-pointer"
                          />
                        </label>
                      </div>

                      {/* Drawer Actions */}
                      <div className="flex items-center justify-end gap-2 pt-4 mt-auto border-t border-zinc-100 dark:border-[#202024] shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsAlertModalOpen(false)}
                          className="px-4 h-8 rounded-[8px] text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer transition-colors"
                        >
                          Annuler
                        </button>
                        <Button
                          type="submit"
                          variant="glow"
                          disabled={isSavingAlert}
                          className="h-8 px-4 text-xs font-semibold gap-1.5 cursor-pointer shadow-sm rounded-[8px]"
                        >
                          {isSavingAlert ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Enregistrement...</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>{editingAlert || isEditingGlobalAlert ? "Enregistrer" : "Créer l'alerte"}</span>
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </DrawerContent>
                </Drawer>
              </div>
            );
          })()}

          {/* TAB 9: DATA & RGPD */}
          {activeTab === "data" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Data, Export &amp; GDPR Privacy
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400">
                    Export your complete archives or permanently delete your
                    account.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col justify-between gap-4 shadow-xs">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                      Complete Archive (JSON)
                    </h3>
                    <p className="text-[11px] text-zinc-600 dark:text-neutral-400 mt-1">
                      Contains all your short links, tags, targeting rules, and
                      aggregated metrics.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportData("json")}
                    className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[8px] bg-zinc-50 hover:bg-zinc-100 dark:bg-[#161619] dark:hover:bg-[#202024] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#27272a] text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-brand" />
                    <span>Download JSON Archive</span>
                  </button>
                </div>

                <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col justify-between gap-4 shadow-xs">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                      Export Events &amp; Clicks (CSV)
                    </h3>
                    <p className="text-[11px] text-zinc-600 dark:text-neutral-400 mt-1">
                      UTF-8 tabular format with separated columns, optimized for
                      Excel and Google Sheets.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportData("csv")}
                    className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[8px] bg-zinc-50 hover:bg-zinc-100 dark:bg-[#161619] dark:hover:bg-[#202024] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#27272a] text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-brand" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-5 rounded-[10px] bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 flex flex-col gap-3 shadow-xs">
                <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  Danger Zone
                </h3>
                <p className="text-xs text-slate-700 dark:text-neutral-300">
                  Account deletion is immediate and irreversible. All your short
                  links, metadata, and connected domains will be permanently
                  erased.
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <Input
                    placeholder="Type DELETE to confirm"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className="max-w-xs bg-white dark:bg-[#161619] text-slate-900 dark:text-white border-red-300 dark:border-red-500/30"
                  />
                  <button
                    type="button"
                    disabled={
                      deleteConfirmationText !== "DELETE" || isDeletingAccount
                    }
                    onClick={handleDeleteAccount}
                    className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-[8px] bg-red-600 hover:bg-red-700 disabled:bg-red-600/40 dark:disabled:bg-red-900/40 text-white disabled:text-white/70 text-xs font-bold shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>
                      {isDeletingAccount
                        ? "Deleting account..."
                        : "Permanently delete my account"}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: ABOUT */}
          {activeTab === "about" && (
            <div className="flex flex-col gap-6 text-xs text-zinc-700 dark:text-neutral-300">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                About LShorter
              </h2>
              <p className="leading-relaxed text-zinc-600 dark:text-neutral-300">
                LShorter is a high-performance Edge SaaS link infrastructure
                platform powered globally by Cloudflare Workers, D1, and Convex
                Realtime Database.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] shadow-xs">
                  <span className="text-zinc-500 dark:text-neutral-500">
                    Application Version
                  </span>
                  <p className="font-mono text-zinc-900 dark:text-white font-bold text-sm mt-0.5">
                    v1.2.0 (Production)
                  </p>
                </div>
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] shadow-xs">
                  <span className="text-zinc-500 dark:text-neutral-500">
                    Cloudflare Edge &amp; D1 Network
                  </span>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Operational (&lt;0.8ms latency)
                  </p>
                </div>
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] shadow-xs">
                  <span className="text-zinc-500 dark:text-neutral-500">
                    OpenGraph &amp; Social Previews
                  </span>
                  <p className="text-zinc-900 dark:text-white font-bold text-sm mt-0.5">
                    Direct URL Metadata Injection
                  </p>
                </div>
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] shadow-xs">
                  <span className="text-zinc-500 dark:text-neutral-500">
                    Realtime Database
                  </span>
                  <p className="text-zinc-900 dark:text-white font-bold text-sm mt-0.5">
                    Convex Realtime Database
                  </p>
                </div>
              </div>
            </div>
          )}
      </div>

      {/* 2FA Setup Multi-Step Modal */}
      <TwoFactorSetupModal
        isOpen={show2FASetupModal}
        onClose={() => setShow2FASetupModal(false)}
        userId={userId || ""}
        email={email || session?.user?.email || ""}
        name={name || session?.user?.name || ""}
        onSuccess={handle2FASuccess}
      />

      {/* 2FA Recovery Codes Modal */}
      <TwoFactorRecoveryModal
        isOpen={showRecoveryCodesModal}
        onClose={() => setShowRecoveryCodesModal(false)}
        recoveryCodes={storedRecoveryCodes}
        email={email || session?.user?.email || ""}
      />

      {/* Modal on API Key Creation */}
      <ApiKeyCreatedModal
        isOpen={Boolean(createdKeyModal)}
        onClose={() => setCreatedKeyModal(null)}
        apiKey={createdKeyModal}
      />



      {/* Cancel Auto-Renewal Confirmation Modal */}
      {isCancelSubModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className="relative w-full max-w-lg bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] rounded-[10px] shadow-2xl p-6 flex flex-col gap-5 animate-in zoom-in-95 duration-200"
            role="dialog"
            aria-modal="true"
          >
            {/* Close button */}
            <button
              onClick={() => !cancelingSub && setIsCancelSubModalOpen(false)}
              disabled={cancelingSub}
              className="absolute right-4 top-4 p-1.5 rounded-[10px] text-zinc-400 hover:text-zinc-600 dark:text-neutral-400 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-[10px] bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shrink-0 shadow-lg shadow-red-500/10">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex flex-col gap-1 pr-4">
                <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-snug">
                  Annuler le renouvellement automatique ?
                </h3>
                <p className="text-xs text-zinc-500 dark:text-neutral-400 leading-relaxed">
                  Vous êtes sur le point de désactiver la reconduction tacite de votre formule <strong>LShorter {plan}</strong>.
                </p>
              </div>
            </div>

            {/* Key points box */}
            <div className="p-4 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] flex flex-col gap-3 text-xs">
              <div className="flex items-start gap-2.5 text-zinc-700 dark:text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Accès garanti jusqu&apos;au {displayPeriodEnd}</strong> : Vos quotas de clics, domaines personnalisés et liens courts restent 100% opérationnels jusqu&apos;à la fin de la période payée en cours.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-zinc-700 dark:text-neutral-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Zéro prélèvement futur</strong> : Paddle n&apos;effectuera aucun débit automatique ultérieur sur votre moyen de paiement.
                </span>
              </div>
              <div className="flex items-start gap-2.5 text-zinc-600 dark:text-neutral-400 text-[11px] border-t border-zinc-200 dark:border-[#27272a] pt-2">
                <Info className="w-3.5 h-3.5 text-zinc-400 shrink-0 mt-0.5" />
                <span>
                  Politique commerciale : Conformément à nos conditions pour les infrastructures numériques, tout achat est ferme et définitif. Aucun remboursement rétroactif n&apos;est émis pour la période déjà commencée.
                </span>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2 border-t border-zinc-200 dark:border-[#222225]">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCancelSubModalOpen(false)}
                disabled={cancelingSub}
                className="h-9 px-4 text-xs font-semibold rounded-[10px] border-zinc-200 dark:border-[#27272a] bg-white dark:bg-[#1a1a1e] hover:bg-zinc-100 dark:hover:bg-white/5 text-zinc-700 dark:text-neutral-300 cursor-pointer"
              >
                Conserver mon abonnement
              </Button>

              <Button
                type="button"
                onClick={handleConfirmCancelSubscription}
                disabled={cancelingSub}
                className="h-9 px-4 text-xs font-bold rounded-[10px] bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/25 border border-red-500/30 gap-2 cursor-pointer transition-all"
              >
                {cancelingSub ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Annulation en cours...</span>
                  </>
                ) : (
                  <span>Confirmer l&apos;annulation</span>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SettingsPage() {
  return (
    <React.Suspense fallback={<SettingsPageSkeleton />}>
      <SettingsPageContent />
    </React.Suspense>
  );
}
