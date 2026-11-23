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
  Languages,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import { normalizeLocale } from "@/lib/i18n/types";
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
import { PixelBrandLogo, getPixelPlatformShortLabel } from "@/components/dashboard/pixel-badges";
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
import { ApiKeyDrawer } from "@/components/dashboard/api-key-drawer";
import { PixelDrawer } from "@/components/dashboard/pixel-drawer";
import { DomainDrawer } from "@/components/dashboard/domain-drawer";
import { TwoFactorSetupModal } from "@/components/dashboard/two-factor-setup-modal";
import { TwoFactorRecoveryModal } from "@/components/dashboard/two-factor-recovery-modal";
import { CancellationFeedbackModal } from "@/components/feedback/cancellation-feedback-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { SettingsPageSkeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/toast-provider";
import { useUndoDelete } from "@/components/ui/undo-delete-provider";
import { syncUserToCloudflare } from "@/app/actions/sync-user";
import { triggerPlanUpgrade, getPlanLimits } from "@/lib/plan-guard";
import { formatCurrencyDisplay } from "@/lib/billing/currency";

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
  const { data: session, status, update: updateSession } = useSession();
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
  const userId =
    rawUserId && rawUserId !== "usr_anonymous"
      ? rawUserId
      : convexUser?.userId || userEmail || "";
  const plan = (
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
  const { locale, setLocale, tr } = useI18n();
  const [name, setName] = useState(session?.user?.name || "My Account");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [language, setLanguage] = useState<string>(locale);
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
    trackedRevenue: 0,
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
      const sumRevenue = lList.reduce(
        (acc: number, l: any) => acc + (Number(l.revenue) || 0),
        0,
      );
      const analyticsClicks30d = Number(
        analytics30dRes?.data?.totalClicks ??
          analytics30dRes?.data?.total_clicks ??
          0,
      );
      const analyticsRevenue = Number(
        analytics30dRes?.data?.trackedRevenue ??
          (analytics30dRes?.data as any)?.tracked_revenue ??
          analyticsRes?.data?.trackedRevenue ??
          (analyticsRes?.data as any)?.tracked_revenue ??
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
      const totalLiveRevenue = Math.max(analyticsRevenue, sumRevenue);

      setAccountStats({
        linksCount: lList.length,
        clicksThisMonth: totalLiveClicks,
        trackedRevenue: totalLiveRevenue,
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
    if (limit === -1) return tr("Unlimited", "Illimité");
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

  // ─── Real Invoices (Fetched from Dodo Payments & Convex) ────────────────────
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

  // Handle return from Dodo Payments checkout (triggers exactly once without duplicate toasts)
  const handledCheckoutSuccessRef = useRef(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const isSuccess = params.get("checkout_success") === "true";
      const ptxn = params.get("_ptxn") || params.get("ptxn");
      const dodoSubId = params.get("subscription_id");
      const dodoPaymentId = params.get("payment_id");
      const dodoSessionId = params.get("session_id");
      const urlPlan = (params.get("plan") || "").toUpperCase();

      if (isSuccess && !handledCheckoutSuccessRef.current) {
        handledCheckoutSuccessRef.current = true;

        // Clean query parameters from URL immediately to prevent repeated toasts on re-render
        window.history.replaceState({}, "", "/dashboard/settings?tab=billing");

        const syncClientPlanState = async (newPlan?: string) => {
          const validPlan =
            newPlan && ["PRO", "BUSINESS", "ENTERPRISE"].includes(newPlan.toUpperCase())
              ? newPlan.toUpperCase()
              : urlPlan && ["PRO", "BUSINESS", "ENTERPRISE"].includes(urlPlan)
                ? urlPlan
                : undefined;

          if (validPlan) {
            localStorage.setItem("lshorter_user_plan", validPlan);
            window.dispatchEvent(
              new CustomEvent("lshorter_plan_updated", {
                detail: { plan: validPlan },
              })
            );
            try {
              await updateSession({ plan: validPlan });
            } catch {}
          }
          window.dispatchEvent(new Event("lshorter_notifications_sync"));
          loadRealInvoices();
          loadSubscriptionDetails();
        };

        fetch("/api/billing/verify-transaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            transactionId: ptxn || undefined,
            subscriptionId: dodoSubId || undefined,
            paymentId: dodoPaymentId || undefined,
            sessionId: dodoSessionId || undefined,
            plan: urlPlan || undefined,
            userId,
          }),
        })
          .then((r) => r.json())
          .then(async (data) => {
            if (data?.success && data?.plan && ["PRO", "BUSINESS", "ENTERPRISE"].includes(data.plan.toUpperCase())) {
              const confirmedPlan = data.plan.toUpperCase();
              await syncClientPlanState(confirmedPlan);
              showToast.success(
                tr(
                  `${confirmedPlan} subscription activated and synced successfully!`,
                  `Abonnement ${confirmedPlan} activé et synchronisé avec succès !`
                )
              );
            }
          })
          .catch((err) => {
            console.warn("[Verify Transaction Warning]", err);
          });
      }
    }
  }, [userId, loadRealInvoices, loadSubscriptionDetails, updateSession, tr]);

  const handleDownloadInvoice = (inv: any) => {
    const downloadUrl = inv.downloadUrl || `/api/billing/invoices/${inv.id}/download`;
    window.open(downloadUrl, "_blank");
    showToast.success(
      tr(
        `Downloading official invoice (${inv.number})...`,
        `Téléchargement de la facture officielle (${inv.number})...`
      )
    );
  };

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
      return new Date(currentPeriodEndTimestamp).toLocaleDateString(
        locale === "fr" ? "fr-FR" : "en-US",
        {
          day: "numeric",
          month: "long",
          year: "numeric",
        }
      );
    }
    if (subDetails?.formattedPeriodEnd) {
      return subDetails.formattedPeriodEnd;
    }
    return "—";
  }, [currentPeriodEndTimestamp, subDetails?.formattedPeriodEnd, locale]);

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
          tr(
            "Auto-renewal canceled. Your services remain active until the end of the paid period.",
            "Renouvellement automatique annulé. Vos services restent actifs jusqu'au terme de la période payée."
          )
        );
        setIsCancelSubModalOpen(false);
        loadSubscriptionDetails();
        window.dispatchEvent(new Event("lshorter_notifications_sync"));
      } else {
        showToast.error(
          data.error ||
            tr(
              "Unable to cancel auto-renewal at the moment.",
              "Impossible d'annuler le renouvellement automatique pour le moment."
            )
        );
      }
    } catch (err: any) {
      console.error("[Cancel Subscription Error]", err);
      showToast.error(
        tr(
          "A network error occurred. Please try again.",
          "Une erreur réseau est survenue. Veuillez réessayer."
        )
      );
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
        showToast.success(
          tr(
            "Auto-renewal resumed successfully!",
            "Renouvellement automatique réactivé avec succès !"
          )
        );
        loadSubscriptionDetails();
        window.dispatchEvent(new Event("lshorter_notifications_sync"));
      } else {
        showToast.error(
          data.error ||
            tr(
              "Unable to resume auto-renewal.",
              "Impossible de réactiver le renouvellement automatique."
            )
        );
      }
    } catch (err: any) {
      console.error("[Resume Subscription Error]", err);
      showToast.error(
        tr(
          "A network error occurred. Please try again.",
          "Une erreur réseau est survenue. Veuillez réessayer."
        )
      );
    } finally {
      setResumingSub(false);
    }
  };

  // ─── API Keys State ─────────────────────────────────────────────────────────
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [activeCodeTab, setActiveCodeTab] = useState<
    "create" | "track" | "analytics"
  >("create");
  const [createdKeyModal, setCreatedKeyModal] = useState<ApiKeyItem | null>(
    null,
  );
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);
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
  const [copiedWebhookSecretId, setCopiedWebhookSecretId] = useState<string | null>(null);
  const [isApiKeyDrawerOpen, setIsApiKeyDrawerOpen] = useState(false);
  const [isPixelDrawerOpen, setIsPixelDrawerOpen] = useState(false);
  const [isDomainDrawerOpen, setIsDomainDrawerOpen] = useState(false);

  const loadWebhooks = async () => {
    if (!userId) return;
    setIsLoadingWebhooks(true);
    try {
      const res = await cfGetWebhooks(userId);
      const rawData = (res as any)?.data;
      const list = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.webhooks)
          ? rawData.webhooks
          : [];
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
  const [isLoadingPixels, setIsLoadingPixels] = useState(false);

  const loadPixels = async () => {
    if (!userId) return;
    setIsLoadingPixels(true);
    try {
      const res = await cfGetPixels(userId);
      const rawData = (res as any)?.data;
      const rawList = Array.isArray(rawData)
        ? rawData
        : Array.isArray(rawData?.pixels)
          ? rawData.pixels
          : [];
      const list = rawList.map((px: any) => ({
        ...px,
        platform: px?.platform || px?.type || "meta",
        isActive: px?.isActive !== false && px?.is_active !== false,
      }));
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
  const [globalTargetMetric, setGlobalTargetMetric] = useState<"clicks" | "revenue">("clicks");
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
  const [alertTargetValue, setAlertTargetValue] = useState<number>(1000);
  const [alertTargetClicks, setAlertTargetClicks] = useState<number>(1000);
  const [alertTargetRevenue, setAlertTargetRevenue] = useState<number>(5000);
  const [alertNotifyExpired, setAlertNotifyExpired] = useState<boolean>(true);
  const [alertNotifyEmail, setAlertNotifyEmail] = useState<boolean>(true);
  const [alertNotifyBell, setAlertNotifyBell] = useState<boolean>(true);
  const [isSavingAlert, setIsSavingAlert] = useState<boolean>(false);

  const loadTargetAlerts = async () => {
    if (!userId) return;
    setIsLoadingTargets(true);
    try {
      // 1. Fetch user's links & targets concurrently
      const [linksRes, res] = await Promise.all([
        cfGetLinks(userId).catch(() => null),
        cfGetTargetAlerts(userId).catch(() => null),
      ]);
      const rawLinks = Array.isArray(linksRes?.data)
        ? linksRes.data
        : Array.isArray((linksRes?.data as any)?.data)
          ? (linksRes?.data as any).data
          : [];
      setUserLinksList(rawLinks);

      let alerts: TargetAlert[] = [];
      if (res && res.success && Array.isArray(res.data)) {
        alerts = res.data;
      }

      // Compute live clicks & revenue from links + accountStats so values are never 0 while stats load
      const linksClicksSum = rawLinks.reduce(
        (acc: number, l: any) =>
          acc + (Number(l.clicks_count) || Number(l.clicksCount) || Number(l.clicks) || 0),
        0
      );
      const linksRevenueSum = rawLinks.reduce(
        (acc: number, l: any) => acc + (Number(l.revenue) || 0),
        0
      );
      const liveClicksTotal = Math.max(accountStats.clicksThisMonth || 0, linksClicksSum);
      const liveRevenueTotal = Math.max(accountStats.trackedRevenue || 0, linksRevenueSum);

      // Sync global monthly targets between Cloudflare D1 and localStorage
      const savedClk = typeof window !== "undefined" ? Number(localStorage.getItem("lshorter_target_clicks")) : 0;
      const savedRev = typeof window !== "undefined" ? Number(localStorage.getItem("lshorter_target_revenue")) : 0;

      const d1GlobalClicks = alerts.find((a) => !a.linkId && a.metricType !== "revenue");
      const d1GlobalRevenue = alerts.find((a) => !a.linkId && a.metricType === "revenue");

      if (d1GlobalClicks && Number(d1GlobalClicks.targetValue) > 0 && typeof window !== "undefined") {
        try {
          localStorage.setItem("lshorter_target_clicks", String(d1GlobalClicks.targetValue));
        } catch {}
      }
      if (d1GlobalRevenue && Number(d1GlobalRevenue.targetValue) > 0 && typeof window !== "undefined") {
        try {
          localStorage.setItem("lshorter_target_revenue", String(d1GlobalRevenue.targetValue));
        } catch {}
      }

      if (!d1GlobalClicks) {
        alerts.unshift({
          id: `global_${userId}_clicks`,
          userId,
          linkId: null,
          metricType: "clicks",
          period: "month",
          targetValue: savedClk > 0 ? savedClk : 1000,
          currentValue: liveClicksTotal,
          notifyExpired: false,
          notifyEmail: true,
          notifyBell: true,
          status: "active",
        });
      }

      if (!d1GlobalRevenue) {
        alerts.push({
          id: `global_${userId}_revenue`,
          userId,
          linkId: null,
          metricType: "revenue",
          period: "month",
          targetValue: savedRev > 0 ? savedRev : 5000,
          currentValue: liveRevenueTotal,
          notifyExpired: false,
          notifyEmail: true,
          notifyBell: true,
          status: "active",
        });
      }

      // Compute current live values for alerts from links
      alerts = alerts.map((al) => {
        if (!al.linkId) {
          const cur = al.metricType === "revenue" ? liveRevenueTotal : liveClicksTotal;
          return {
            ...al,
            currentValue: cur,
            status: al.status === "paused" ? "paused" : (cur >= al.targetValue ? "reached" : al.status),
          };
        } else {
          const matched = rawLinks.find((l: any) => String(l.id) === String(al.linkId) || l.slug === al.slug);
          const cur = matched
            ? (al.metricType === "revenue"
                ? (Number(matched.revenue) || 0)
                : (Number(matched.clicks_count) || Number(matched.clicksCount) || Number(matched.clicks) || 0))
            : (al.currentValue || 0);
          return {
            ...al,
            linkTitle: matched ? (matched.title || `lsho.cc/${matched.slug}`) : al.linkTitle,
            slug: matched ? matched.slug : al.slug,
            targetUrl: matched ? (matched.target_url || matched.targetUrl) : al.targetUrl,
            currentValue: cur,
            status: al.status === "paused" ? "paused" : (cur >= al.targetValue ? "reached" : al.status),
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
  }, [activeTab, userId, accountStats.clicksThisMonth, accountStats.trackedRevenue]);

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
      showToast.success(
        nextStatus === "paused"
          ? tr("Alert paused", "Alerte mise en pause")
          : tr("Alert resumed", "Alerte réactivée")
      );
    } catch {
      showToast.error(
        tr("Failed to update status", "Échec de la mise à jour du statut")
      );
      loadTargetAlerts();
    }
  };

  const handleDeleteTarget = (alertId: string) => {
    if (alertId.startsWith("global_")) {
      showToast.error(
        tr(
          "Global workspace target cannot be deleted",
          "L'objectif global de l'espace de travail ne peut pas être supprimé"
        )
      );
      return;
    }
    setOpenRowMenuId(null);
    const targetObj = targetAlerts.find((a) => a.id === alertId);
    const linked = targetObj
      ? userLinksList.find(
          (l) => String(l.id) === String(targetObj.linkId) || l.slug === targetObj.linkId
        )
      : undefined;
    const label = linked?.slug || targetObj?.linkId || "DELETE";

    triggerUndoDelete({
      id: alertId,
      itemType: "other",
      title: tr("Alert deleted", "Alerte supprimée"),
      description: linked?.slug ? `/${linked.slug}` : label,
      confirmText: label,
      onExecute: async () => {
        setTargetAlerts((prev) => prev.filter((a) => a.id !== alertId));
        try {
          await cfDeleteTargetAlert(alertId);
        } catch {
          showToast.error(
            tr("Failed to delete alert", "Échec de la suppression de l'alerte")
          );
          loadTargetAlerts();
          return false;
        }
      },
    });
  };

  const handleOpenCreateModal = () => {
    setEditingAlert(null);
    setIsEditingGlobalAlert(false);
    const firstLink = isPremium ? userLinksList[0] : null;
    const initialLinkId = firstLink ? String(firstLink.id || firstLink.slug) : "global";
    setAlertLinkId(initialLinkId);
    setAlertMetricType("clicks");
    setAlertPeriod("month");
    setAlertTargetValue(1000);
    setAlertTargetClicks(1000);
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
    const clkAlert = targetAlerts.find((a) => !a.linkId && a.metricType !== "revenue");
    const revAlert = targetAlerts.find((a) => !a.linkId && a.metricType === "revenue");
    const savedClk = clkAlert?.targetValue || (typeof window !== "undefined" ? Number(localStorage.getItem("lshorter_target_clicks")) : 0) || 1000;
    const savedRev = revAlert?.targetValue || (typeof window !== "undefined" ? Number(localStorage.getItem("lshorter_target_revenue")) : 0) || 5000;
    setAlertTargetValue(alert.targetValue || (alert.metricType === "revenue" ? savedRev : savedClk));
    if (alert.metricType === "revenue") {
      setAlertTargetRevenue(alert.targetValue || savedRev);
      setAlertTargetClicks(savedClk);
    } else {
      setAlertTargetClicks(alert.targetValue || savedClk);
      setAlertTargetRevenue(savedRev);
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
        showToast.error(
          tr(
            "Please enter a valid threshold (> 0) for both clicks and revenue",
            "Veuillez saisir un seuil valide (> 0) pour les clics et les revenus"
          )
        );
        return;
      }
    } else {
      if (alertTargetValue <= 0) {
        showToast.error(
          tr(
            "Please enter a valid target threshold greater than 0",
            "Veuillez saisir un seuil cible valide supérieur à 0"
          )
        );
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
          showToast.success(
            tr(
              "Global clicks and revenue targets saved",
              "Objectifs globaux de clics et revenus enregistrés"
            )
          );
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
          showToast.success(
            tr("Global revenue target saved", "Objectif global de revenus enregistré")
          );
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
          showToast.success(
            tr("Global clicks target saved", "Objectif global de clics enregistré")
          );
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
          showToast.success(
            tr("Alert updated successfully", "Alerte mise à jour avec succès")
          );
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
            showToast.success(
              tr(
                "Clicks and revenue alerts created successfully",
                "Alertes clics et revenus créées avec succès"
              )
            );
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
            showToast.success(
              tr("Alert created successfully", "Alerte créée avec succès")
            );
          }
        }
      }

      setIsAlertModalOpen(false);
      await loadTargetAlerts();
    } catch (err: any) {
      showToast.error(
        err?.message || tr("Failed to save alert", "Échec de l'enregistrement de l'alerte")
      );
    } finally {
      setIsSavingAlert(false);
    }
  };

  const handleTestTarget = async (alert: TargetAlert) => {
    setOpenRowMenuId(null);
    showToast.info(tr("Sending test alert...", "Envoi de l'alerte de test..."));
    try {
      const isGlobal = !alert.linkId;
      const res = await fetch("/api/targets/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          email: session?.user?.email || "",
          name: session?.user?.name || "",
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
        showToast.success(
          tr(
            "Test alert sent! Notification added to bell & test email dispatched.",
            "Alerte de test envoyée ! Notification ajoutée à la cloche et e-mail de test envoyé."
          )
        );
      } else {
        showToast.error(
          tr("Failed to send test alert", "Échec de l'envoi de l'alerte de test")
        );
      }
    } catch {
      showToast.error(
        tr("Error sending test alert", "Erreur lors de l'envoi de l'alerte de test")
      );
    }
  };

  // ─── Data & RGPD State ──────────────────────────────────────────────────────
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExportingArchive, setIsExportingArchive] = useState(false);

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
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (convexUser) {
      if (convexUser.name) setName(convexUser.name);
      if (convexUser.email) setEmail(convexUser.email);
      if (convexUser.avatarUrl) setAvatarUrl(convexUser.avatarUrl);
      if (convexUser.language) {
        const normalized = normalizeLocale(convexUser.language);
        setLanguage(normalized || locale);
      }
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

        showToast.success(
          tr(
            "Profile picture updated successfully!",
            "Photo de profil mise à jour avec succès !"
          )
        );
      } else {
        showToast.error(
          tr(
            "Failed to upload profile picture",
            "Échec du téléversement de la photo de profil"
          )
        );
      }
    } catch {
      showToast.error(
        tr(
          "Error uploading profile picture",
          "Erreur lors de l'envoi de la photo de profil"
        )
      );
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
      showToast.success(
        tr("Profile updated successfully!", "Profil mis à jour avec succès !")
      );
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err) {
      showToast.error(
        tr("Error updating profile.", "Erreur lors de la mise à jour du profil.")
      );
    }
  };

  const promptRevokeKeyWithUndo = (k: ApiKeyItem) => {
    const label = k.name || k.prefix || tr("API Key", "Clé API");
    triggerUndoDelete({
      id: k.id,
      itemType: "api_key",
      title: tr("API key revoked", "Clé API révoquée"),
      description: label,
      confirmText: label,
      onExecute: async () => {
        setApiKeys((prev) => prev.filter((item) => item.id !== k.id));
        try {
          await cfRevokeApiKey(k.id, userId);
          cfInvalidateCache("/api/keys");
        } catch {
          loadApiKeys();
          showToast.error(
            tr(
              "Error revoking API key.",
              "Erreur lors de la révocation de la clé API."
            )
          );
          return false;
        }
      },
    });
  };

  const handleOpenCreateWebhook = () => {
    if (plan === "FREEMIUM") {
      triggerPlanUpgrade({
        featureName: "Webhooks",
        reason: tr(
          "Webhooks and real-time event streaming are reserved for PRO and BUSINESS plans.",
          "Les webhooks et le streaming d'événements en temps réel sont réservés aux forfaits PRO et BUSINESS."
        ),
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
      name: wh.name || "",
      url: wh.url,
      events: wh.events || [],
      isActive: wh.isActive,
      secretKey: wh.secretKey,
    });
    setIsWebhookModalOpen(true);
  };

  const handleCopyWebhookSecret = async (wh: any) => {
    if (!wh?.secretKey) return;
    try {
      await navigator.clipboard.writeText(wh.secretKey);
      setCopiedWebhookSecretId(wh.id);
      showToast.success(
        tr(
          "HMAC secret key copied to clipboard.",
          "Clé secrète HMAC copiée dans le presse-papiers."
        )
      );
      setTimeout(() => {
        setCopiedWebhookSecretId((cur) => (cur === wh.id ? null : cur));
      }, 2000);
    } catch {
      showToast.error(
        tr("Unable to copy secret key.", "Impossible de copier la clé secrète.")
      );
    }
  };

  const handleSaveWebhookModal = async (data: WebhookModalData) => {
    if (!userId) return;
    setIsSavingWebhookModal(true);
    setIsCreatingWebhook(true);
    try {
      if (data.id) {
        await cfUpdateWebhook(data.id, {
          userId,
          name: data.name,
          url: data.url,
          events: data.events,
          isActive: data.isActive,
        });
        showToast.success(
          tr("Webhook updated successfully!", "Webhook mis à jour avec succès !")
        );
      } else {
        await cfCreateWebhook({
          userId,
          name: data.name,
          url: data.url,
          events: data.events,
          secretKey: data.secretKey,
          isActive: true,
        });
        showToast.success(
          tr("Webhook created successfully!", "Webhook créé avec succès !")
        );
      }
      setIsWebhookModalOpen(false);
      await loadWebhooks();
    } catch (err: any) {
      showToast.error(
        err?.message ||
          tr("Failed to save webhook", "Échec de l'enregistrement du webhook")
      );
    } finally {
      setIsSavingWebhookModal(false);
      setIsCreatingWebhook(false);
    }
  };

  const handleDeleteWebhookWithUndo = (wh: WebhookConfig) => {
    const label = wh.name?.trim() || wh.url;
    triggerUndoDelete({
      id: wh.id,
      itemType: "webhook",
      title: tr("Webhook deleted", "Webhook supprimé"),
      description: label,
      confirmText: label,
      onExecute: async () => {
        setWebhooks((prev) => prev.filter((w) => w.id !== wh.id));
        try {
          await cfDeleteWebhook(wh.id, userId);
          cfInvalidateCache("/api/webhooks");
        } catch {
          loadWebhooks();
          showToast.error(
            tr("Failed to delete webhook", "Échec de suppression du webhook")
          );
          return false;
        }
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
      showToast.success(
        nextActive
          ? tr("Webhook activated", "Webhook activé")
          : tr("Webhook paused", "Webhook mis en pause")
      );
    } catch {
      loadWebhooks();
      showToast.error(
        tr("Failed to update webhook", "Échec de mise à jour du webhook")
      );
    }
  };

  const handleTestWebhook = async (wh: {
    id?: string;
    name?: string;
    url: string;
    secretKey?: string;
  }) => {
    if (plan === "FREEMIUM") {
      triggerPlanUpgrade({
        featureName: "Webhooks",
        reason: tr(
          "Webhook testing simulator is reserved for PRO and BUSINESS plans.",
          "Le simulateur de test webhook est réservé aux forfaits PRO et BUSINESS."
        ),
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
        body: JSON.stringify({
          webhookId: wh.id,
          name: wh.name,
          url: wh.url,
          secretKey: wh.secretKey,
        }),
      });
      const data = await res.json();
      setWebhookTestResponse(JSON.stringify(data, null, 2));
      if (res.ok && data?.success) {
        showToast.success(
          tr(
            `Ping sent (HTTP ${data.status || 200}) in ${data.durationMs ?? 0} ms`,
            `Ping envoyé (HTTP ${data.status || 200}) en ${data.durationMs ?? 0} ms`
          ),
        );
        loadWebhooks();
      } else {
        showToast.error(
          data?.error || tr("Webhook test failed", "Échec du test webhook")
        );
      }
    } catch (err) {
      setWebhookTestResponse(
        JSON.stringify(
          { error: "Webhook sending error", detail: String(err) },
          null,
          2,
        ),
      );
      showToast.error(tr("Webhook test failed", "Échec du test webhook"));
    } finally {
      setIsTestingWebhook(false);
    }
  };

  const handleDeletePixelWithUndo = (px: RetargetingPixel) => {
    const label = px.name || px.pixelId;
    triggerUndoDelete({
      id: px.id,
      itemType: "pixel",
      title: tr("Pixel deleted", "Pixel supprimé"),
      description: label,
      confirmText: label,
      onExecute: async () => {
        setPixels((prev) => prev.filter((p) => p.id !== px.id));
        try {
          await cfDeletePixel(px.id, userId);
          cfInvalidateCache("/api/pixels");
        } catch {
          loadPixels();
          showToast.error(
            tr("Failed to delete pixel.", "Échec de la suppression du pixel.")
          );
          return false;
        }
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
      showToast.success(
        nextActive
          ? tr("Pixel activated", "Pixel activé")
          : tr("Pixel paused", "Pixel mis en pause")
      );
    } catch {
      loadPixels();
      showToast.error(
        tr("Failed to update pixel", "Échec de mise à jour du pixel")
      );
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
        tr(
          "Are you sure you want to disable Two-Factor Authentication (2FA)? Your account will be less protected.",
          "Voulez-vous vraiment désactiver l'authentification à deux facteurs (2FA) ? Votre compte sera moins protégé."
        ),
      )
    ) {
      try {
        await update2FAMutation({
          userId,
          enabled: false,
        });
        setIs2FAEnabled(false);
        showToast.info(
          tr(
            "Two-Factor Authentication disabled.",
            "Authentification à deux facteurs désactivée."
          )
        );
      } catch {
        showToast.error(
          tr("Error disabling 2FA.", "Erreur lors de la désactivation de la 2FA.")
        );
      }
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim() || newPassword.length < 8) {
      showToast.error(
        tr(
          "New password must be at least 8 characters long.",
          "Le nouveau mot de passe doit contenir au moins 8 caractères."
        )
      );
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
      showToast.success(
        tr("Password updated successfully!", "Mot de passe mis à jour avec succès !")
      );
    } catch {
      showToast.error(
        tr(
          "Error updating password.",
          "Erreur lors de la mise à jour du mot de passe."
        )
      );
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleExportData = async (type: "json" | "csv" | "zip") => {
    if (!userId) return;
    try {
      if (type === "zip" || type === "csv") {
        setIsExportingArchive(true);
        const res = await fetch(
          `/api/analytics/export?format=${type}&userId=${encodeURIComponent(userId)}`,
        );
        if (!res.ok)
          throw new Error(
            tr("Error generating archive", "Erreur lors de la génération de l'archive")
          );
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const ext = type === "zip" ? "zip" : "csv";
        a.download = `lshorter_data_${userId}_${new Date().toISOString().split("T")[0]}.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast.success(
          type === "zip"
            ? tr(
                "Complete ZIP archive (subfolders & CSV) downloaded!",
                "Archive ZIP complète (sous-dossiers & CSV) téléchargée !"
              )
            : tr(
                "CSV data exported successfully!",
                "Données CSV exportées avec succès !"
              ),
        );
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
      showToast.success(
        tr(
          "JSON archive exported successfully!",
          "Archive JSON exportée avec succès !"
        )
      );
    } catch (err) {
      showToast.error(
        tr(
          "Error exporting data.",
          "Erreur lors de l'exportation des données."
        )
      );
    } finally {
      setIsExportingArchive(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmationText !== "DELETE") {
      showToast.error(
        tr("Please type DELETE to confirm.", "Veuillez saisir DELETE pour confirmer.")
      );
      return;
    }

    setIsDeletingAccount(true);
    try {
      await deleteAccountMutation({ userId });
      showToast.success(
        tr(
          "Account and data permanently deleted.",
          "Compte et données définitivement supprimés."
        )
      );
      await signOut({ callbackUrl: "/" });
    } catch (err) {
      showToast.error(
        tr("Error deleting account.", "Erreur lors de la suppression du compte.")
      );
      setIsDeletingAccount(false);
    }
  };

  const tabs = [
    { id: "profile", label: tr("Profile & Account", "Profil & Compte"), icon: User },
    { id: "billing", label: tr("Billing & Invoices", "Facturation & Factures"), icon: CreditCard },
    { id: "api", label: tr("API & Keys", "API & Clés"), icon: KeyRound },
    { id: "domains", label: tr("Domains", "Domaines"), icon: Globe2 },
    { id: "webhooks", label: "Webhooks", icon: Webhook, isPro: true },
    { id: "pixels", label: tr("Retargeting Pixels", "Pixels de retargeting"), icon: Target, isPro: true },
    { id: "security", label: tr("Security & 2FA", "Sécurité & 2FA"), icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: tr("Data & GDPR", "Données & RGPD"), icon: Database },
    { id: "about", label: tr("About", "À propos"), icon: Info },
  ] as const;

  if (status === "loading") {
    return <SettingsPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in pb-20 md:pb-16">
      <div className="w-full">
        {/* TAB 1: PROFILE & ACCOUNT */}
        {activeTab === "profile" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-[#222225]">
              <div>
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                  {tr("Profile & Account", "Profil & Compte")}
                </h1>
                <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
                  {tr(
                    "Personal information, edge infrastructure quotas, and display preferences.",
                    "Informations personnelles, quotas d'infrastructure edge et préférences d'affichage."
                  )}
                </p>
              </div>
              <Badge variant="orange">
                {tr(`Plan ${plan}`, `Forfait ${plan}`)}
              </Badge>
            </div>

            {/* Quota gauges */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600 dark:text-neutral-400 font-semibold">
                    {tr("Monthly Click Volume", "Volume mensuel de clics")}
                  </span>
                  <span
                    className="text-xs text-[#0066FF] dark:text-[#5294FF] font-semibold"
                    data-testid="billing-monthly-clicks-percent"
                  >
                    {plan === "ENTERPRISE" || clicksLimit === -1
                      ? tr("Unlimited clicks included", "Clics illimités inclus")
                      : isOverage
                        ? tr(
                            `${billingClicksPercentLabel} (Overage active)`,
                            `${billingClicksPercentLabel} (Dépassement actif)`
                          )
                        : tr(
                            `${billingClicksPercentLabel} used`,
                            `${billingClicksPercentLabel} utilisé`
                          )}
                  </span>
                </div>
                <p
                  className="text-2xl font-bold font-bebas text-zinc-900 dark:text-white"
                  data-testid="billing-monthly-clicks-count"
                >
                  {(accountStats?.clicksThisMonth ?? 0).toLocaleString(
                    locale === "fr" ? "fr-FR" : "en-US",
                  )}{" "}
                  / {clicksLimit === -1 ? tr("Unlimited", "Illimité") : (clicksLimit ?? 10000).toLocaleString(locale === "fr" ? "fr-FR" : "en-US")}
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
                      ? tr("Unlimited clicks included ($0 extra)", "Clics illimités inclus (0 $ en sus)")
                      : plan === "BUSINESS"
                        ? tr("Overage rate: $8 / 125,000 extra clicks", "Dépassement : 8 $ / 125 000 clics sup.")
                        : plan === "PRO"
                          ? tr("Overage rate: $3 / 50,000 extra clicks", "Dépassement : 3 $ / 50 000 clics sup.")
                          : tr("Hard limit at 10,000 clicks/month", "Limite stricte à 10 000 clics/mois")}
                  </span>
                  {isOverage && (
                    <span className="text-amber-600 dark:text-amber-400 font-semibold">
                      {plan === "ENTERPRISE"
                        ? tr(
                            `+${(overageClicks ?? 0).toLocaleString("en-US")} clicks ($0 free overage)`,
                            `+${(overageClicks ?? 0).toLocaleString("fr-FR")} clics (0 $ offert)`
                          )
                        : tr(
                            `+${(overageClicks ?? 0).toLocaleString("en-US")} clicks ($${overageAmount.toFixed(2)} overage)`,
                            `+${(overageClicks ?? 0).toLocaleString("fr-FR")} clics (${overageAmount.toFixed(2)} $ dépassement)`
                          )}
                    </span>
                  )}
                </div>
              </div>

              <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-600 dark:text-neutral-400 font-semibold">
                    {tr("Custom Domains", "Domaines personnalisés")}
                  </span>
                  <span className="text-xs text-zinc-600 dark:text-neutral-400 font-bold">
                    {accountStats.domainsCount} {tr("of", "sur")} {domainsLimit === -1 ? tr("Unlimited", "Illimité") : domainsLimit}
                  </span>
                </div>
                <p className="text-2xl font-bold font-bebas text-zinc-900 dark:text-white">
                  {accountStats.domainsCount} / {domainsLimit === -1 ? tr("Unlimited", "Illimité") : domainsLimit}
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
                    ? tr("Unlimited custom domains included", "Domaines personnalisés illimités inclus")
                    : tr(
                        `${Math.max(0, domainsLimit - accountStats.domainsCount)} domain(s) available`,
                        `${Math.max(0, domainsLimit - accountStats.domainsCount)} domaine(s) disponible(s)`
                      )}
                </span>
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">

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
                      {tr("Profile picture URL", "URL de la photo de profil")}
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
                        {isUploadingAvatar
                          ? tr("Uploading...", "Téléversement...")
                          : tr("Change photo", "Changer la photo")}
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
                      {tr("Full name", "Nom complet")}
                    </label>
                    <Input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-zinc-700 dark:text-neutral-300 mb-1.5">
                      {tr("Login email address", "Adresse e-mail de connexion")}
                    </label>
                    <Input
                      type="email"
                      value={email}
                      readOnly
                      className="bg-zinc-50 dark:bg-white/[0.03] text-zinc-600 dark:text-neutral-300 cursor-not-allowed select-all border-zinc-200 dark:border-[#27272a] focus:border-zinc-200 dark:focus:border-[#27272a] focus:ring-0"
                    />
                  </div>
                </div>

                {/* Interface Language Selector */}
                <div className="pt-4 border-t border-zinc-200 dark:border-[#222225]">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <label className="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-neutral-300">
                        <Languages className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#5294FF]" />
                        <span>{tr("Interface language", "Langue de l'interface")}</span>
                      </label>
                      <p className="text-[11.5px] text-zinc-500 dark:text-neutral-400 mt-1">
                        {tr(
                          "Choose the display language applied across all LShorter pages and your dashboard.",
                          "Choisissez la langue d'affichage appliquée à toutes les pages LShorter et à votre tableau de bord.",
                        )}
                      </p>
                    </div>
                    <div
                      role="group"
                      aria-label={tr("Interface language", "Langue de l'interface")}
                      className="inline-flex items-center rounded-[8px] border border-zinc-200 dark:border-[#27272a] bg-zinc-50 dark:bg-white/[0.03] p-1 shrink-0"
                    >
                      {(
                        [
                          { code: "en" as const, label: "English" },
                          { code: "fr" as const, label: "Français" },
                        ]
                      ).map((opt) => {
                        const active = locale === opt.code;
                        return (
                          <button
                            key={opt.code}
                            type="button"
                            onClick={() => {
                              setLanguage(opt.code);
                              setLocale(opt.code);
                            }}
                            aria-pressed={active}
                            className={`px-3.5 py-1.5 rounded-[6px] text-xs font-semibold transition-colors cursor-pointer ${
                              active
                                ? "bg-[#0066FF] text-white shadow-xs"
                                : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-200 dark:border-[#222225]">
                  <Button type="submit" variant="glow" className="text-xs px-6">
                    {profileSuccess
                      ? tr("Saved successfully!", "Enregistré avec succès !")
                      : tr("Save changes", "Enregistrer les modifications")}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        )}

          {/* TAB 2: BILLING & INVOICES */}
          {activeTab === "billing" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-[#222225]">
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">
                      {tr("Plan & Billing", "Forfait & Facturation")}
                    </h1>
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-subtle text-brand border border-brand-subtle text-[10px] font-extrabold uppercase tracking-wider">
                      {plan}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
                    {tr(
                      "Manage your subscription, auto-renewal, and download compliant official invoices.",
                      "Gérez votre abonnement, votre renouvellement automatique et téléchargez vos factures officielles conformes."
                    )}
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="glow"
                  onClick={() => router.push("/pricing")}
                  className="cursor-pointer font-bold shrink-0"
                >
                  {tr("Change Plan", "Changer de forfait")}
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
                          {tr(
                            "Subscription & Auto-Renewal",
                            "Abonnement & Renouvellement Automatique"
                          )}
                        </h3>
                        {isPaidPlan && (
                          isCanceledAtPeriodEnd ? (
                            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {tr("Cancellation scheduled", "Annulation programmée")}
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              {tr("Auto-renewal active", "Renouvellement actif")}
                            </span>
                          )
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
                        {tr(
                          "Manage recurring billing, renewal date, and cancellation options.",
                          "Gérez la récurrence de vos paiements, votre date d'échéance et vos options de résiliation."
                        )}
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
                        <span>{tr("Resume auto-renewal", "Réactiver le renouvellement")}</span>
                      </Button>
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                {isPaidPlan ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="p-3.5 rounded-[8px] bg-zinc-50 dark:bg-[#161619] border border-zinc-200/80 dark:border-[#27272a] flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-neutral-400 uppercase tracking-wider">
                        {tr("Current Plan", "Formule Actuelle")}
                      </span>
                      <div className="flex items-baseline gap-2">
                        <span className="text-base font-bold text-zinc-900 dark:text-white">
                          LShorter {plan}
                        </span>
                        <span className="text-xs text-zinc-500 dark:text-neutral-400">
                          ({subCycle === "YEARLY" ? tr("Yearly", "Annuel") : tr("Monthly", "Mensuel")})
                        </span>
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-neutral-500">
                        {tr("Certified Dodo Payments billing", "Facturation certifiée Dodo Payments")}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-[8px] bg-zinc-50 dark:bg-[#161619] border border-zinc-200/80 dark:border-[#27272a] flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-neutral-400 uppercase tracking-wider">
                        {isCanceledAtPeriodEnd
                          ? tr("Paid period ends", "Fin de la période payée")
                          : tr("Next renewal", "Prochaine échéance")}
                      </span>
                      <div className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-brand" />
                        <span>{displayPeriodEnd}</span>
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-neutral-500">
                        {isCanceledAtPeriodEnd
                          ? tr("Access guaranteed until this date", "Accès garanti jusqu'à cette date")
                          : tr("Dodo Payments automatic billing", "Prélèvement automatique Dodo Payments")}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-[8px] bg-zinc-50 dark:bg-[#161619] border border-zinc-200/80 dark:border-[#27272a] flex flex-col gap-1">
                      <span className="text-[11px] font-semibold text-zinc-500 dark:text-neutral-400 uppercase tracking-wider">
                        {tr("Renewal status", "Statut du renouvellement")}
                      </span>
                      <div className="text-sm font-bold">
                        {isCanceledAtPeriodEnd ? (
                          <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            {tr("Cancellation scheduled", "Résiliation programmée")}
                          </span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-emerald-500" />
                            {tr("Auto-renewal active", "Renouvellement automatique actif")}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 dark:text-neutral-500">
                        {isCanceledAtPeriodEnd
                          ? tr("No further charges", "Aucun prélèvement ultérieur")
                          : tr("Cancel anytime in 1 click", "Annulable à tout moment en 1 clic")}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-[8px] bg-zinc-50 dark:bg-[#161619] border border-zinc-200/80 dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold text-zinc-900 dark:text-white">
                        {tr(
                          "You are currently on the Free plan (Freemium)",
                          "Vous utilisez actuellement la formule Gratuite (Freemium)"
                        )}
                      </span>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400">
                        {tr(
                          "No recurring subscription or payment card is on file. You will not be charged automatically.",
                          "Aucun abonnement récurrent ni carte bancaire n'est enregistré. Vous n'avez aucun prélèvement automatique."
                        )}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="glow"
                      onClick={() => router.push("/pricing")}
                      className="rounded-[8px] font-bold text-xs shrink-0 cursor-pointer"
                    >
                      {tr("Explore Pro plans", "Découvrir les forfaits Pro")}
                    </Button>
                  </div>
                )}

                {/* Informational banner when cancellation is scheduled */}
                {isPaidPlan && isCanceledAtPeriodEnd && (
                  <div className="p-3 rounded-[8px] bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                    <div className="flex flex-col gap-0.5">
                      <span className="font-bold">
                        {tr(
                          "Your auto-renewal is paused.",
                          "Votre renouvellement automatique est suspendu."
                        )}
                      </span>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300/90 leading-relaxed">
                        {locale === "fr" ? (
                          <>
                            Conformément à nos conditions de vente pour les infrastructures numériques, vos services, liens, redirections edge et domaines restent <strong>100% actifs jusqu&apos;au {displayPeriodEnd}</strong>. Aucun autre prélèvement ne sera effectué sur votre moyen de paiement.
                          </>
                        ) : (
                          <>
                            Under our digital infrastructure terms of sale, your services, links, edge redirects, and domains remain <strong>100% active until {displayPeriodEnd}</strong>. No further charges will be made to your payment method.
                          </>
                        )}
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
                        {tr(
                          "Canceling stops all future automatic renewals, and your account remains accessible until the end of the current paid period.",
                          "L'annulation empêche tout prélèvement automatique ultérieur et votre compte restera accessible jusqu'à la fin de la période payée en cours."
                        )}
                      </span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsCancelSubModalOpen(true)}
                      className="text-xs font-semibold text-red-500 hover:text-red-600 underline underline-offset-2 cursor-pointer transition-colors shrink-0 text-left sm:text-right"
                    >
                      {tr("Cancel auto-renewal", "Annuler le renouvellement automatique")}
                    </button>
                  </div>
                )}
              </div>

              {/* Certified Dodo Payments Invoices Table */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      <span>
                        {tr(
                          "Official Invoices (Dodo Payments)",
                          "Factures Officielles (Dodo Payments)"
                        )}
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-neutral-400 mt-0.5">
                      {tr(
                        "All your transactions, receipts, and compliant certified invoices generated automatically.",
                        "Toutes vos transactions, reçus et factures certifiées conformes générées automatiquement."
                      )}
                    </p>
                  </div>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                    {tr(
                      "Tax-Compliant Net / VAT / Total • Certified Receipts & Invoices",
                      "Norme Fiscale HT / TVA / TTC • Reçus & Factures Certifiés"
                    )}
                  </span>
                </div>
                {loadingInvoices ? (
                  <div className="py-8 text-center text-xs text-zinc-500 dark:text-neutral-400 bg-white dark:bg-[#111113] rounded-[10px] border border-zinc-200 dark:border-[#222225] flex items-center justify-center gap-2">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand" />
                    <span>
                      {tr("Syncing invoices...", "Synchronisation des factures en cours...")}
                    </span>
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500 dark:text-neutral-500 bg-white dark:bg-[#111113] rounded-[10px] border border-zinc-200 dark:border-[#222225]">
                    {tr(
                      "No invoices available yet. Your official invoices will appear here after your first payment or renewal.",
                      "Aucune facture disponible. Vos factures officielles apparaîtront ici dès votre premier paiement ou renouvellement."
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-white dark:bg-[#111113] rounded-[10px] border border-zinc-200 dark:border-[#222225]">
                    <table className="hidden sm:table w-full text-left text-xs text-zinc-600 dark:text-neutral-400">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-[#27272a] text-[11px] uppercase tracking-wider text-zinc-500 dark:text-neutral-500">
                          <th className="py-3 px-3.5">{tr("Invoice Ref.", "Réf. Facture")}</th>
                          <th className="py-3 px-3.5">{tr("Issue Date", "Date d'émission")}</th>
                          <th className="py-3 px-3.5">{tr("Subtotal", "Net HT")}</th>
                          <th className="py-3 px-3.5">{tr("VAT / Tax", "TVA / Taxe")}</th>
                          <th className="py-3 px-3.5">{tr("Total", "Total TTC")}</th>
                          <th className="py-3 px-3.5">{tr("Status", "Statut")}</th>
                          <th className="py-3 px-3.5 text-right">
                            {tr("Official Invoice", "Facture Officielle")}
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
                              {formatCurrencyDisplay(inv.netAmount, inv.currency)}
                            </td>
                            <td className="py-3 px-3.5 font-mono text-zinc-500 dark:text-neutral-400">
                              {inv.taxAmount > 0
                                ? formatCurrencyDisplay(inv.taxAmount, inv.currency)
                                : formatCurrencyDisplay(0, inv.currency)}
                            </td>
                            <td className="py-3 px-3.5 font-bold font-mono text-zinc-900 dark:text-white">
                              {formatCurrencyDisplay(inv.totalAmount, inv.currency)}
                            </td>
                            <td className="py-3 px-3.5">
                              <Badge variant="active">{tr("Paid", "Acquittée")}</Badge>
                            </td>
                            <td className="py-3 px-3.5 text-right">
                              <button
                                onClick={() => handleDownloadInvoice(inv)}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#465FFF]/10 hover:bg-[#465FFF] text-[#465FFF] hover:text-white border border-[#465FFF]/25 font-bold cursor-pointer transition-all text-xs"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>{tr("Download Official PDF", "Télécharger le PDF officiel")}</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {/* Mobile Invoices Cards (< sm: / < 640px) */}
                    <div className="sm:hidden flex flex-col gap-2 p-2 font-sans">
                      {invoices.map((inv) => (
                        <div
                          key={inv.id}
                          className="rounded-[8px] border border-zinc-200 dark:border-[#27272a] bg-zinc-50/50 dark:bg-[#18181c] p-3 space-y-2"
                        >
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-zinc-900 dark:text-white">
                              {inv.number}
                            </span>
                            <Badge variant="active">{tr("Paid", "Payée")}</Badge>
                          </div>
                          <div className="flex items-center justify-between text-xs text-zinc-500">
                            <span>{inv.date}</span>
                            <span className="font-mono font-bold text-zinc-900 dark:text-white text-xs">
                              {formatCurrencyDisplay(inv.totalAmount, inv.currency)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500">
                            <span>
                              {tr("Subtotal:", "Net HT :")} {formatCurrencyDisplay(inv.netAmount, inv.currency)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(inv)}
                              className="px-2.5 py-1 rounded-[6px] border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-[#111113] hover:bg-zinc-100 dark:hover:bg-zinc-800 font-medium text-zinc-700 dark:text-zinc-200 text-xs flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-[#0066FF]" />
                              <span>PDF</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
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
                    <span>{tr("Developer API Keys", "Clés API développeur")}</span>
                  </h1>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
                    {locale === "fr" ? (
                      <>
                        Générez des jetons sécurisés <code className="text-brand">lsh_live_...</code> avec permissions granulaires pour intégrer vos applications.
                      </>
                    ) : (
                      <>
                        Generate secure <code className="text-brand">lsh_live_...</code> tokens with granular permissions to integrate your applications.
                      </>
                    )}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="glow"
                  onClick={() => setIsApiKeyDrawerOpen(true)}
                  className="h-9 px-4 text-xs font-semibold gap-1.5 shrink-0 rounded-[8px] cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{tr("New API Key", "Nouvelle Clé API")}</span>
                </Button>
              </div>

              {/* Active Keys Section */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-xs font-bold text-zinc-700 dark:text-neutral-300 uppercase tracking-wider">
                    {tr("Active API Keys", "Clés API actives")} ({apiKeys.length})
                  </h3>
                </div>

                {isLoadingApiKeys && apiKeys.length === 0 ? (
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
                ) : apiKeys.length === 0 ? (
                  <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2.5 bg-white dark:bg-[#111113] rounded-[10px] border border-zinc-200 dark:border-[#222225]">
                    <div className="w-10 h-10 rounded-[10px] bg-zinc-200/70 dark:bg-neutral-800/60 border border-zinc-300 dark:border-neutral-700/40 flex items-center justify-center text-zinc-500 dark:text-neutral-500">
                      <KeyRound className="w-5 h-5" />
                    </div>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-neutral-300">
                      {tr("No active API keys yet", "Aucune clé API active pour le moment")}
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-neutral-500 max-w-xs">
                      {tr(
                        "Generate your first authentication token to integrate your applications.",
                        "Générez votre premier jeton d'authentification pour intégrer vos applications."
                      )}
                    </p>
                    <Button
                      size="sm"
                      variant="glow"
                      onClick={() => setIsApiKeyDrawerOpen(true)}
                      className="mt-2 h-8 px-4 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{tr("Generate API Key", "Générer une Clé API")}</span>
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {apiKeys.map((k) => {
                      const isRevealed = Boolean(revealedKeys[k.id]);
                      const actualKey = k.rawKey || k.prefix;
                      const displayKey = isRevealed
                        ? actualKey
                        : "••••••••••••••••••••••••••••••••••••••••";
                      const isCopied = copiedKeyId === k.id;

                      const getScopeBadge = (scope?: string) => {
                        if (scope === "read")
                          return {
                            label: tr("Read Only", "Lecture seule"),
                            color:
                              "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
                          };
                        return {
                          label: tr("Read & Write", "Lecture & Écriture"),
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
                              {tr("Created on", "Créée le")}{" "}
                              {new Date(k.created_at).toLocaleDateString(
                                locale === "fr" ? "fr-FR" : "en-US",
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
                                title={
                                  isRevealed
                                    ? tr("Hide key", "Masquer la clé")
                                    : tr("Reveal key", "Afficher la clé")
                                }
                              >
                                {isRevealed ? (
                                  <>
                                    <EyeOff className="w-3.5 h-3.5 text-zinc-500 dark:text-neutral-400" />
                                    <span className="hidden sm:inline">
                                      {tr("Hide", "Masquer")}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Eye className="w-3.5 h-3.5 text-zinc-500 dark:text-neutral-400" />
                                    <span className="hidden sm:inline">
                                      {tr("Reveal", "Afficher")}
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
                                    tr(
                                      "API key copied to clipboard!",
                                      "Clé API copiée dans le presse-papiers !"
                                    ),
                                  );
                                  setTimeout(() => setCopiedKeyId(null), 2000);
                                }}
                                className="h-8 px-2.5 rounded-[6px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1a1a1e] dark:hover:bg-[#25252c] border border-zinc-200 dark:border-[#2a2a30] text-zinc-700 hover:text-zinc-900 dark:text-neutral-300 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                                title={tr("Copy key", "Copier la clé")}
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                                    <span className="text-emerald-600 dark:text-emerald-400">
                                      {tr("Copied", "Copié")}
                                    </span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-neutral-400" />
                                    <span>{tr("Copy", "Copier")}</span>
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
                                    tr(
                                      "cURL example command copied!",
                                      "Exemple de commande cURL copié !"
                                    ),
                                  );
                                }}
                                className="h-8 px-2.5 rounded-[6px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#1a1a1e] dark:hover:bg-[#25252c] border border-zinc-200 dark:border-[#2a2a30] text-zinc-600 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white text-xs flex items-center gap-1 transition-colors cursor-pointer"
                                title={tr("Copy cURL example", "Copier l'exemple cURL")}
                              >
                                <span>cURL</span>
                              </button>

                              {/* Revoke Button with 10s Undo Toast */}
                              <button
                                type="button"
                                onClick={() => promptRevokeKeyWithUndo(k)}
                                className="h-8 w-8 rounded-[6px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                                title={tr("Revoke this API key", "Révoquer cette clé API")}
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
                        {tr(
                          "Official TypeScript SDK (npm i lshorter-api)",
                          "SDK TypeScript officiel (npm i lshorter-api)"
                        )}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400">
                        {tr(
                          "Ready-to-use implementation examples",
                          "Exemples d'implémentation prêts à l'emploi"
                        )}
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
                      {tr("Create Link", "Créer un lien")}
                    </button>
                    <button
                      onClick={() => setActiveCodeTab("track")}
                      className={`px-3 py-1.5 rounded-[10px] font-medium transition-colors cursor-pointer ${
                        activeCodeTab === "track"
                          ? "bg-brand text-white shadow-sm"
                          : "text-zinc-600 dark:text-neutral-400 hover:text-[#09090B] dark:hover:text-white"
                      }`}
                    >
                      {tr("Track Conversion", "Suivre une conversion")}
                    </button>
                    <button
                      onClick={() => setActiveCodeTab("analytics")}
                      className={`px-3 py-1.5 rounded-[10px] font-medium transition-colors cursor-pointer ${
                        activeCodeTab === "analytics"
                          ? "bg-brand text-white shadow-sm"
                          : "text-zinc-600 dark:text-neutral-400 hover:text-[#09090B] dark:hover:text-white"
                      }`}
                    >
                      {tr("Analytics", "Analytique")}
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

              {/* API Key Sliding Drawer */}
              <ApiKeyDrawer
                isOpen={isApiKeyDrawerOpen}
                onClose={() => setIsApiKeyDrawerOpen(false)}
                onCreated={(newKey) => {
                  setCreatedKeyModal(newKey);
                  loadApiKeys();
                }}
                userId={userId}
                userPlan={plan}
                userEmail={session?.user?.email || undefined}
              />
            </div>
          )}

          {/* TAB 4: DOMAINS (Real Live User Domains) */}
          {activeTab === "domains" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {tr("White-Label Custom Domains", "Domaines personnalisés en marque blanche")}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400">
                    {tr(
                      "Redirect your short links through your own branded domain names.",
                      "Redirigez vos liens courts via vos propres noms de domaine de marque."
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => router.push("/dashboard/domains")}
                    className="h-8.5 text-xs font-medium cursor-pointer"
                  >
                    {tr("Manage Domains", "Gérer les domaines")}
                  </Button>
                  <Button
                    size="sm"
                    variant="glow"
                    onClick={() => setIsDomainDrawerOpen(true)}
                    className="h-8.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{tr("Connect a Domain", "Connecter un Domaine")}</span>
                  </Button>
                </div>
              </div>

              {accountStats.userDomains.length === 0 ? (
                <div className="p-8 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col items-center justify-center gap-3 text-center shadow-xs">
                  <Globe2 className="w-10 h-10 text-zinc-400 dark:text-neutral-600" />
                  <div>
                    <p className="text-sm font-bold text-zinc-900 dark:text-white">
                      {tr("No custom domains connected", "Aucun domaine personnalisé connecté")}
                    </p>
                    <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
                      {tr(
                        "Your links are currently using the default platform domain.",
                        "Vos liens utilisent actuellement le domaine par défaut de la plateforme."
                      )}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="glow"
                    onClick={() => setIsDomainDrawerOpen(true)}
                    className="mt-2 h-8.5 text-xs font-semibold gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{tr("Connect a Domain", "Connecter un Domaine")}</span>
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
                            {tr("DNS Target:", "Cible DNS :")}{" "}
                            <span className="font-mono text-zinc-700 dark:text-neutral-300">
                              {d.dns_target ||
                                d.dnsTarget ||
                                "cname.lsho.cc"}
                            </span>
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="active">{tr("SSL Active", "SSL actif")}</Badge>
                        <span className="text-zinc-500 dark:text-neutral-500 text-[11px]">
                          Edge OK
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Domain Sliding Drawer */}
              <DomainDrawer
                isOpen={isDomainDrawerOpen}
                onClose={() => setIsDomainDrawerOpen(false)}
                onCreated={loadAccountStats}
                userId={userId}
                userEmail={session?.user?.email || undefined}
                userName={session?.user?.name || undefined}
                plan={plan}
                domainsCount={accountStats.userDomains.length}
                domainsLimit={domainsLimit}
                onUpgrade={() =>
                  triggerPlanUpgrade({
                    featureName: tr("Custom Domains", "Domaines personnalisés"),
                    reason: tr(
                      `Your ${plan} plan is limited to ${domainsLimit} custom domains. Upgrade to add more.`,
                      `Votre forfait ${plan} est limité à ${domainsLimit} domaines personnalisés. Passez au forfait supérieur pour en ajouter davantage.`
                    ),
                    targetPlan: plan === "FREE" ? "PRO" : "BUSINESS",
                  })
                }
              />
            </div>
          )}

          {/* TAB 5: WEBHOOKS & SIMULATOR */}
          {activeTab === "webhooks" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                      Webhooks
                    </h1>
                    {plan === "FREEMIUM" && (
                      <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {tr(
                      "Receive HMAC-SHA256 signed HTTP (POST) notifications for every event on your short links.",
                      "Recevez des notifications HTTP (POST) signées en HMAC-SHA256 à chaque événement de vos liens courts."
                    )}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={handleOpenCreateWebhook}
                  className="h-9 px-4 text-[13px] font-medium gap-1.5 shrink-0 rounded-[8px] bg-brand hover:bg-brand-hover text-white cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{tr("New webhook", "Nouveau webhook")}</span>
                </Button>
              </div>

              {/* Freemium Banner */}
              {plan === "FREEMIUM" && (
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200/90 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-[8px] bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/70 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                          {tr(
                            "Webhooks API & real-time events",
                            "API Webhooks & événements temps réel"
                          )}
                        </h3>
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {tr(
                          "Webhooks, HMAC-SHA256 signatures, and real-time event streams are included starting with the Pro plan.",
                          "Les webhooks, signatures HMAC-SHA256 et flux d'événements temps réel sont inclus dès le forfait Pro."
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      triggerPlanUpgrade({
                        featureName: "Webhooks",
                        reason: tr(
                          "Upgrade to PRO to unlock webhooks and the real-time simulator.",
                          "Passez au forfait PRO pour débloquer les webhooks et le simulateur temps réel."
                        ),
                        targetPlan: "PRO",
                      })
                    }
                    className="shrink-0 text-[13px] h-9 px-3.5 font-medium bg-brand hover:bg-brand-hover text-white rounded-[8px] cursor-pointer transition-colors"
                  >
                    {tr("Upgrade to PRO", "Passer au plan PRO")}
                  </button>
                </div>
              )}

              {/* Summary Bar */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-[10px] bg-zinc-50/70 dark:bg-[#141417] border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                    {tr(
                      `Configured endpoints (${webhooks.length})`,
                      `Points de terminaison configurés (${webhooks.length})`
                    )}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {tr(
                      "Name your webhooks, select your events, and verify your HMAC-SHA256 signatures.",
                      "Nommez vos webhooks, sélectionnez vos événements et vérifiez vos signatures HMAC-SHA256."
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {isLoadingWebhooks && !isCreatingWebhook && webhooks.length === 0 ? (
                  <div className="flex flex-col gap-3">
                    {[1, 2].map((i) => (
                      <div
                        key={i}
                        className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200/90 dark:border-zinc-800/80 animate-pulse flex flex-col gap-3"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex flex-col gap-1.5">
                            <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 rounded-[6px]" />
                            <div className="h-3.5 w-64 bg-zinc-100 dark:bg-zinc-800/70 rounded-[6px]" />
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <div className="h-8 w-16 bg-zinc-200 dark:bg-zinc-800 rounded-[6px]" />
                            <div className="h-7 w-14 bg-zinc-200 dark:bg-zinc-800 rounded-[6px]" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : webhooks.length === 0 && !isCreatingWebhook ? (
                  <div className="py-12 px-4 flex flex-col items-center justify-center text-center gap-3 bg-white dark:bg-[#111113] rounded-[10px] border border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="w-10 h-10 rounded-[10px] bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                      <Webhook className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {tr("No webhooks configured", "Aucun webhook configuré")}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 leading-relaxed">
                        {tr(
                          "Connect your first endpoint to receive real-time click, conversion, and link events.",
                          "Connectez votre premier endpoint pour recevoir vos événements de clics, conversions et liens en temps réel."
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleOpenCreateWebhook}
                      className="mt-1 h-9 px-4 text-[13px] font-medium bg-brand hover:bg-brand-hover text-white rounded-[8px] cursor-pointer gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{tr("Create a webhook", "Créer un webhook")}</span>
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Animated Skeleton Card when creating webhook */}
                    {isCreatingWebhook && (
                      <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-blue-500/30 animate-pulse flex flex-col gap-2.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="h-4 w-56 bg-zinc-200 dark:bg-zinc-800 rounded-[6px]" />
                          <div className="h-7 w-20 bg-zinc-200 dark:bg-zinc-800 rounded-[6px]" />
                        </div>
                        <div className="h-3.5 w-72 bg-zinc-100 dark:bg-zinc-800/70 rounded-[6px]" />
                      </div>
                    )}
                    {webhooks.map((wh: any) => {
                      const eventsList = Array.isArray(wh.events) && wh.events.length > 0 ? wh.events : ["click.created", "conversion.created"];
                      const isGlobal = eventsList.length >= 6;
                      const displayName =
                        (typeof wh.name === "string" && wh.name.trim()) ||
                        (() => {
                          try {
                            return new URL(wh.url).hostname;
                          } catch {
                            return "Webhook";
                          }
                        })();
                      const isSecretCopied = copiedWebhookSecretId === wh.id;

                      return (
                        <div
                          key={wh.id}
                          data-testid={`webhook-card-${wh.id}`}
                          className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200/90 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col gap-3"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="flex items-start gap-3 min-w-0">
                              <div className="w-9 h-9 rounded-[8px] bg-zinc-100 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/60 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0 mt-0.5">
                                <Webhook className="w-4 h-4" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                                    {displayName}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded-[6px] text-[11px] font-medium border ${
                                      wh.isActive
                                        ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/20"
                                        : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                                    }`}
                                  >
                                    {wh.isActive
                                      ? tr("Active", "Actif")
                                      : tr("Paused", "En pause")}
                                  </span>
                                </div>
                                <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                                  {wh.url}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={isTestingWebhook}
                                onClick={() => handleTestWebhook(wh)}
                                className="h-8 px-2.5 text-xs font-medium gap-1.5 rounded-[6px] border-zinc-200 dark:border-zinc-800 bg-white dark:bg-transparent text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5 text-zinc-400" />
                                <span>
                                  {isTestingWebhook
                                    ? tr("Sending...", "Envoi...")
                                    : tr("Test", "Tester")}
                                </span>
                              </Button>
                              <button
                                type="button"
                                onClick={() => handleOpenEditWebhook(wh)}
                                title={tr("Edit this webhook", "Modifier ce webhook")}
                                aria-label={tr("Edit this webhook", "Modifier ce webhook")}
                                className="h-8 w-8 flex items-center justify-center rounded-[6px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleToggleWebhook(wh.id)}
                                title={
                                  wh.isActive
                                    ? tr("Pause", "Mettre en pause")
                                    : tr("Activate", "Activer")
                                }
                                className="h-8 px-2.5 rounded-[6px] text-xs font-medium border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/70 cursor-pointer transition-colors"
                              >
                                {wh.isActive
                                  ? tr("Pause", "Pause")
                                  : tr("Activate", "Activer")}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteWebhookWithUndo(wh)}
                                className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors"
                                title={tr("Delete this webhook", "Supprimer ce webhook")}
                                aria-label={tr("Delete this webhook", "Supprimer ce webhook")}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="text-xs text-zinc-500 dark:text-zinc-400 mr-0.5">
                                {tr("Events:", "Événements :")}
                              </span>
                              {isGlobal ? (
                                <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-blue-50/70 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/70 dark:border-blue-500/20">
                                  {tr("All events", "Tous les événements")}
                                </span>
                              ) : (
                                eventsList.map((ev: string) => (
                                  <span
                                    key={ev}
                                    className="px-2 py-0.5 rounded-[6px] text-[11px] font-mono text-zinc-600 dark:text-zinc-300 bg-zinc-100/80 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/60"
                                  >
                                    {ev}
                                  </span>
                                ))
                              )}
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-zinc-500 dark:text-zinc-400">
                                {tr("HMAC Key:", "Clé HMAC :")}
                              </span>
                              <code className="font-mono text-[11.5px] text-zinc-600 dark:text-zinc-300 bg-zinc-100/80 dark:bg-zinc-800/80 px-2 py-0.5 rounded-[6px] max-w-[190px] truncate">
                                {wh.secretKey || "—"}
                              </code>
                              {wh.secretKey && (
                                <button
                                  type="button"
                                  onClick={() => handleCopyWebhookSecret(wh)}
                                  title={tr("Copy HMAC secret key", "Copier la clé secrète HMAC")}
                                  aria-label={tr("Copy HMAC secret key", "Copier la clé secrète HMAC")}
                                  className="p-1.5 rounded-[6px] text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800/70 transition-colors cursor-pointer"
                                >
                                  {isSecretCopied ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>
                              )}
                            </div>
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
                  <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium px-1">
                    <span>{tr("✓ Webhook test response", "✓ Réponse du test webhook")}</span>
                    <button
                      onClick={() => setWebhookTestResponse(null)}
                      className="text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 cursor-pointer"
                    >
                      {tr("Close ✕", "Fermer ✕")}
                    </button>
                  </div>
                  <CodeBlock
                    code={webhookTestResponse}
                    language="json"
                    filename={tr("Webhook HTTP Response", "Réponse HTTP du webhook")}
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PIXELS RETARGETING */}
          {activeTab === "pixels" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
                <div>
                  <div className="flex items-center gap-2.5">
                    <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                      {tr("Retargeting Pixels", "Pixels de retargeting")}
                    </h1>
                    {plan === "FREEMIUM" && (
                      <span className="px-2 py-0.5 rounded-[6px] text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                        PRO
                      </span>
                    )}
                  </div>
                  <p className="text-[13px] text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
                    {tr(
                      "Connect your Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat, and X Ads tags to your short links.",
                      "Connectez vos tags publicitaires Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat et X Ads à vos liens courts."
                    )}
                  </p>
                </div>

                <Button
                  type="button"
                  size="sm"
                  onClick={() => {
                    if (plan === "FREEMIUM" || plan === "STARTER") {
                      triggerPlanUpgrade({
                        featureName: tr("Retargeting Pixels", "Pixels de retargeting"),
                        reason: tr(
                          "Upgrade to PRO to unlock Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat & X Ads pixel retargeting.",
                          "Passez au forfait PRO pour débloquer le reciblage par pixels Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat et X Ads."
                        ),
                        targetPlan: "PRO",
                      });
                      return;
                    }
                    setIsPixelDrawerOpen(true);
                  }}
                  className="h-9 px-4 text-[13px] font-medium gap-1.5 shrink-0 rounded-[8px] bg-brand hover:bg-brand-hover text-white cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{tr("New pixel", "Nouveau pixel")}</span>
                </Button>
              </div>

              {/* Freemium Banner */}
              {plan === "FREEMIUM" && (
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200/90 dark:border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-9 h-9 rounded-[8px] bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700/70 flex items-center justify-center text-zinc-600 dark:text-zinc-300 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                          {tr("Ad retargeting pixels", "Pixels de reciblage publicitaire")}
                        </h3>
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 leading-relaxed">
                        {tr(
                          "Ad pixel injection across all 9 major networks is included starting with the Pro plan.",
                          "L'injection de pixels publicitaires pour les 9 réseaux majeurs est incluse dès le forfait Pro."
                        )}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      triggerPlanUpgrade({
                        featureName: tr("Retargeting Pixels", "Pixels de retargeting"),
                        reason: tr(
                          "Upgrade to PRO to unlock Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat & X Ads pixel retargeting.",
                          "Passez au forfait PRO pour débloquer le reciblage par pixels Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat et X Ads."
                        ),
                        targetPlan: "PRO",
                      })
                    }
                    className="shrink-0 text-[13px] h-9 px-3.5 font-medium bg-brand hover:bg-brand-hover text-white rounded-[8px] cursor-pointer transition-colors"
                  >
                    {tr("Upgrade to PRO", "Passer au plan PRO")}
                  </button>
                </div>
              )}

              {/* Summary Bar */}
              <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-[10px] bg-zinc-50/70 dark:bg-[#141417] border border-zinc-200/80 dark:border-zinc-800/80">
                <div className="flex flex-col min-w-0">
                  <span className="text-[13px] font-medium text-zinc-900 dark:text-zinc-100">
                    {tr(`Connected pixels (${pixels.length})`, `Pixels connectés (${pixels.length})`)}
                  </span>
                  <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">
                    {tr(
                      "Enable or pause your ad tags in one click.",
                      "Activez ou mettez en pause vos tags publicitaires en un clic."
                    )}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {isLoadingPixels ? (
                  <div className="py-10 text-center text-[13px] text-zinc-500 dark:text-zinc-400 bg-white dark:bg-[#111113] rounded-[10px] border border-zinc-200/90 dark:border-zinc-800/80">
                    {tr("Loading connected pixels...", "Chargement des pixels connectés...")}
                  </div>
                ) : pixels.length === 0 ? (
                  <div className="py-12 px-4 flex flex-col items-center justify-center text-center gap-3 bg-white dark:bg-[#111113] rounded-[10px] border border-dashed border-zinc-200 dark:border-zinc-800">
                    <div className="w-10 h-10 rounded-[10px] bg-zinc-100 dark:bg-zinc-800/80 flex items-center justify-center text-zinc-600 dark:text-zinc-300">
                      <Target className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {tr("No pixels configured", "Aucun pixel configuré")}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mt-1 leading-relaxed">
                        {tr(
                          "Connect your Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat, or X Ads tags to retarget your visitors.",
                          "Connectez vos tags publicitaires Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat ou X Ads pour recibler vos visiteurs."
                        )}
                      </p>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        if (plan === "FREEMIUM" || plan === "STARTER") {
                          triggerPlanUpgrade({
                            featureName: tr("Retargeting Pixels", "Pixels de retargeting"),
                            reason: tr(
                              "Upgrade to PRO to unlock Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat & X Ads pixel retargeting.",
                              "Passez au forfait PRO pour débloquer le reciblage par pixels Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat et X Ads."
                            ),
                            targetPlan: "PRO",
                          });
                          return;
                        }
                        setIsPixelDrawerOpen(true);
                      }}
                      className="mt-1 h-9 px-4 text-[13px] font-medium bg-brand hover:bg-brand-hover text-white rounded-[8px] cursor-pointer gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{tr("Connect a pixel", "Connecter un pixel")}</span>
                    </Button>
                  </div>
                ) : (
                  pixels.map((px: any) => (
                    <div
                      key={px.id}
                      className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200/90 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-[8px] bg-zinc-50 dark:bg-[#161619] border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center shrink-0">
                          <PixelBrandLogo platform={px} className="w-4.5 h-4.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50 truncate">
                              {px.name}
                            </p>
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-[6px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700/60">
                              {getPixelPlatformShortLabel(px.platform || px.type || px.name)}
                            </span>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                            <span className="font-mono text-[11.5px] text-zinc-600 dark:text-zinc-300">
                              {tr(`ID: ${px.pixelId}`, `ID : ${px.pixelId}`)}
                            </span>
                            <span className="text-zinc-300 dark:text-zinc-700">•</span>
                            <span>
                              {tr(
                                `${px.eventsTrackedCount ?? 0} tracked events`,
                                `${px.eventsTrackedCount ?? 0} événements suivis`
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleTogglePixel(px.id)}
                          className={`h-8 px-2.5 rounded-[6px] text-xs font-medium border transition-colors cursor-pointer ${
                            px.isActive
                              ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200/80 dark:border-emerald-500/20"
                              : "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {px.isActive
                            ? tr("Active", "Actif")
                            : tr("Paused", "En pause")}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePixelWithUndo(px)}
                          className="h-8 w-8 flex items-center justify-center text-zinc-400 hover:text-red-500 rounded-[6px] hover:bg-red-50 dark:hover:bg-red-500/10 cursor-pointer transition-colors"
                          title={tr("Delete this pixel", "Supprimer ce pixel")}
                          aria-label={tr("Delete this pixel", "Supprimer ce pixel")}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <PixelDrawer
                isOpen={isPixelDrawerOpen}
                onClose={() => setIsPixelDrawerOpen(false)}
                onCreated={loadPixels}
                userId={userId}
                plan={plan}
                onUpgrade={() =>
                  triggerPlanUpgrade({
                    featureName: tr("Retargeting Pixels", "Pixels de retargeting"),
                    reason: tr(
                      "Upgrade to PRO to unlock Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat & X Ads pixel retargeting.",
                      "Passez au forfait PRO pour débloquer le reciblage par pixels Facebook, Instagram, Google, YouTube, TikTok, LinkedIn, Pinterest, Snapchat et X Ads."
                    ),
                    targetPlan: "PRO",
                  })
                }
              />
            </div>
          )}

          {/* TAB 7: SECURITY & 2FA */}
          {activeTab === "security" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    {tr("Security & Active Sessions", "Sécurité & Sessions actives")}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400">
                    {tr(
                      "Protect your account with TOTP Two-Factor Authentication and manage connected devices.",
                      "Protégez votre compte avec l'authentification à deux facteurs TOTP et gérez vos appareils connectés."
                    )}
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
                        {tr(
                          "Two-Factor Authentication (2FA / TOTP)",
                          "Authentification à deux facteurs (2FA / TOTP)"
                        )}
                      </p>
                      {is2FAEnabled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3 h-3" />
                          <span>{tr("Enabled & Secured (RFC 6238)", "Activée & Sécurisée (RFC 6238)")}</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full bg-zinc-100 dark:bg-neutral-800 border border-zinc-200 dark:border-neutral-700 text-[10px] font-semibold text-zinc-600 dark:text-neutral-400">
                          {tr("Not configured", "Non configurée")}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-neutral-400 mt-0.5">
                      {tr(
                        "Compatible with Google Authenticator, Apple Passwords, Microsoft Authenticator, Authy, and 1Password.",
                        "Compatible avec Google Authenticator, Mots de passe Apple, Microsoft Authenticator, Authy et 1Password."
                      )}
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
                        <span>{tr("Recovery codes", "Codes de secours")}</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleDisable2FA}
                        className="text-xs h-9 border-red-500/20 text-red-500 dark:text-red-400 hover:bg-red-500/10 cursor-pointer"
                      >
                        {tr("Disable", "Désactiver")}
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
                      <span>{tr("Enable 2FA", "Activer la 2FA")}</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Change Password */}
              <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col gap-3 shadow-xs">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  {tr("Change password", "Modifier le mot de passe")}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="password"
                    placeholder={tr("Current password", "Mot de passe actuel")}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="bg-white dark:bg-[#161619] border-zinc-200 dark:border-[#27272a]"
                  />
                  <Input
                    type="password"
                    placeholder={tr("New password (min 8 chars)", "Nouveau mot de passe (min 8 caract.)")}
                    value={newPassword}
                    onChange={(e) => handlePasswordInput(e.target.value)}
                    className="bg-white dark:bg-[#161619] border-zinc-200 dark:border-[#27272a]"
                  />
                </div>

                {newPassword && (
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between text-zinc-500 dark:text-neutral-400">
                      <span>{tr("Password strength", "Force du mot de passe")}</span>
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
                  {isUpdatingPassword
                    ? tr("Updating...", "Mise à jour...")
                    : tr("Update password", "Mettre à jour le mot de passe")}
                </Button>
              </div>

              {/* Real Live Active Session */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  {tr(
                    "Active Session & Hardware Detection",
                    "Session active & détection matérielle"
                  )}
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
                          {currentSessionInfo.browser === "Navigateur" ||
                          currentSessionInfo.browser === "Navigateur Web"
                            ? tr("Web Browser", "Navigateur Web")
                            : currentSessionInfo.browser}
                        </span>
                        <Badge
                          variant="active"
                          className="shrink-0 text-[10px]"
                        >
                          {tr("Current Session", "Session actuelle")}
                        </Badge>
                      </div>
                      <p className="text-[11px] text-zinc-500 dark:text-neutral-500 mt-0.5">
                        {tr("Network:", "Réseau :")}{" "}
                        {currentSessionInfo.ip === "Connexion sécurisée" ||
                        currentSessionInfo.ip === "Secure Active Session"
                          ? tr("Secure Active Session", "Session active sécurisée")
                          : currentSessionInfo.ip}{" "}
                        ·{" "}
                        {currentSessionInfo.location === "En ligne" ||
                        currentSessionInfo.location === "Active Connection"
                          ? tr("Active Connection", "Connexion active")
                          : currentSessionInfo.location ===
                              "Cloudflare Edge Network (SSL/TLS)"
                            ? tr(
                                "Cloudflare Edge Network (SSL/TLS)",
                                "Réseau Edge Cloudflare (SSL/TLS)"
                              )
                            : currentSessionInfo.location}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0 pl-11 sm:pl-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {tr("Online", "En ligne")}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: NOTIFICATIONS (TARGET & LIMIT ALERTS) */}
          {activeTab === "notifications" && (() => {
            const globalClicksAlert = targetAlerts.find((a) => !a.linkId && a.metricType !== "revenue");
            const globalRevenueAlert = targetAlerts.find((a) => !a.linkId && a.metricType === "revenue");
            const globalAlert =
              globalTargetMetric === "revenue"
                ? (globalRevenueAlert || globalClicksAlert)
                : (globalClicksAlert || globalRevenueAlert);
            const individualAlerts = targetAlerts.filter((a) => a.linkId);

            const filteredAlerts = individualAlerts.filter((a) => {
              if (activeAlertFilter === "all") return true;
              return a.status === activeAlertFilter;
            });

            const activeCount = individualAlerts.filter((a) => a.status === "active").length;
            const pausedCount = individualAlerts.filter((a) => a.status === "paused").length;
            const reachedCount = individualAlerts.filter((a) => a.status === "reached").length;

            // Global stats synchronized with Dashboard Monthly Target (no 2500 flash or revenue override)
            const cachedClk =
              typeof window !== "undefined"
                ? Number(localStorage.getItem("lshorter_target_clicks")) || 1000
                : 1000;
            const cachedRev =
              typeof window !== "undefined"
                ? Number(localStorage.getItem("lshorter_target_revenue")) || 5000
                : 5000;

            const isRevenue = globalTargetMetric === "revenue";
            const globalCurrent = isRevenue
              ? (globalRevenueAlert?.currentValue ?? accountStats.trackedRevenue ?? 0)
              : (globalClicksAlert?.currentValue ?? accountStats.clicksThisMonth ?? 0);
            const globalTarget = isRevenue
              ? (globalRevenueAlert?.targetValue ?? cachedRev)
              : (globalClicksAlert?.targetValue ?? cachedClk);
            const rawGlobalRatio = globalTarget > 0 ? (globalCurrent / globalTarget) * 100 : 0;
            const globalProgressPct =
              globalCurrent === 0
                ? 0
                : rawGlobalRatio < 1
                  ? 1
                  : Math.min(100, Math.round(rawGlobalRatio));

            const numLocale = locale === "fr" ? "fr-FR" : "en-US";
            const globalCurrentFormatted = isRevenue
              ? `$${globalCurrent.toLocaleString(numLocale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              : globalCurrent.toLocaleString(numLocale);
            const globalTargetFormatted = isRevenue
              ? `$${globalTarget.toLocaleString(numLocale)}`
              : globalTarget.toLocaleString(numLocale);

            return (
              <div className="flex flex-col gap-6">
                {/* Main Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-zinc-200 dark:border-[#222225]">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                      {tr("Target & Limit Alerts", "Alertes d'objectifs & de limites")}
                    </h2>
                    <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
                      {tr(
                        "Set custom click or revenue limits per link or workspace-wide, with real-time tracking and automated notifications.",
                        "Définissez des limites personnalisées de clics ou de revenus par lien ou sur tout l'espace de travail, avec suivi en temps réel et notifications automatiques."
                      )}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="glow"
                    onClick={() => {
                      if (!isPremium) {
                        triggerPlanUpgrade({
                          featureName: tr("Link Alerts", "Alertes par lien"),
                          reason: tr(
                            "Upgrade to the Pro plan to configure click, revenue, and expiration alerts on your individual links.",
                            "Passez au forfait Pro pour configurer des alertes de clics, de revenus et d'expiration sur vos liens individuels."
                          ),
                          targetPlan: "PRO",
                        });
                        return;
                      }
                      handleOpenCreateModal();
                    }}
                    className="h-9 px-4 text-xs font-semibold gap-2 self-start sm:self-auto cursor-pointer shadow-sm shrink-0 rounded-[8px]"
                  >
                    {!isPremium ? <Lock className="w-3.5 h-3.5 text-amber-500" /> : <Plus className="w-3.5 h-3.5" />}
                    <span>{tr("New Link Alert", "Nouvelle alerte de lien")}</span>
                    {!isPremium && (
                      <span className="ml-1 px-1.5 py-0.5 rounded-[4px] text-[9px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                        PRO
                      </span>
                    )}
                  </Button>
                </div>

                {/* ─── SECTION 1: GLOBAL WORKSPACE TARGET (MONTHLY) ─────────── */}
                <div className="rounded-[10px] border border-zinc-200 dark:border-[#222225] bg-white dark:bg-[#111113] p-5 shadow-xs">
                  <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-zinc-100 dark:border-[#202024]">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-[8px] bg-brand/10 text-brand flex items-center justify-center border border-brand/20 shrink-0">
                        <Target className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                          {tr(
                            "Global Workspace Target (Monthly)",
                            "Objectif global de l'espace de travail (Mensuel)"
                          )}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
                          {tr(
                            "Synchronized with your main dashboard Monthly Target. Locked to monthly tracking.",
                            "Synchronisé avec l'objectif mensuel de votre tableau de bord principal. Verrouillé sur un suivi mensuel."
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 relative" data-row-menu>
                      <div className="inline-flex rounded-[8px] bg-zinc-100 dark:bg-zinc-800/80 p-0.5 border border-zinc-200 dark:border-zinc-700/80">
                        <button
                          type="button"
                          onClick={() => setGlobalTargetMetric("clicks")}
                          className={`rounded-[6px] px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                            globalTargetMetric === "clicks"
                              ? "bg-white dark:bg-[#1a1a1e] text-zinc-900 dark:text-white shadow-2xs font-semibold"
                              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                        >
                          {tr("Clicks", "Clics")}
                        </button>
                        <button
                          type="button"
                          onClick={() => setGlobalTargetMetric("revenue")}
                          className={`rounded-[6px] px-2.5 py-1 text-[11px] font-medium transition-colors cursor-pointer ${
                            globalTargetMetric === "revenue"
                              ? "bg-white dark:bg-[#1a1a1e] text-zinc-900 dark:text-white shadow-2xs font-semibold"
                              : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
                          }`}
                        >
                          {tr("Revenue", "Revenus")}
                        </button>
                      </div>

                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                        globalAlert?.status === "paused"
                          ? "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800"
                          : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          globalAlert?.status === "paused" ? "bg-amber-500" : "bg-emerald-500 animate-pulse"
                        }`} />
                        {globalAlert?.status === "paused"
                          ? tr("Paused", "En pause")
                          : tr("Active", "Active")}
                      </span>

                      {/* 3-dots menu button */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenRowMenuId(openRowMenuId === (globalAlert?.id || "global") ? null : (globalAlert?.id || "global"));
                        }}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                        aria-label={tr("Actions menu", "Menu d'actions")}
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
                                <span>{tr("Resume Alert", "Réactiver l'alerte")}</span>
                              </>
                            ) : (
                              <>
                                <Pause className="w-3.5 h-3.5 text-amber-600" />
                                <span>{tr("Pause Alert", "Mettre en pause")}</span>
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => globalAlert && handleOpenEditModal(globalAlert)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                          >
                            <Sliders className="w-3.5 h-3.5 text-blue-600" />
                            <span>{tr("Edit Target", "Modifier l'objectif")}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => globalAlert && handleTestTarget(globalAlert)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                            <span>{tr("Send Test Alert", "Envoyer une alerte test")}</span>
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
                          {tr("Monthly Progress", "Progression mensuelle")}
                        </span>
                        <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                          {isRevenue
                            ? tr("Revenue ($)", "Revenus ($)")
                            : tr("Total Clicks", "Clics totaux")}
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
                        {tr("Period:", "Période :")}{" "}
                        <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">
                          {tr("Monthly (Workspace locked)", "Mensuel (Verrouillé espace de travail)")}
                        </strong>
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5 text-zinc-400" />
                        {tr("Channels:", "Canaux :")}{" "}
                        <strong className="text-zinc-700 dark:text-zinc-300 font-semibold">
                          {tr("Email + Bell Notification", "E-mail + Notification cloche")}
                        </strong>
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
                          {tr("Individual Link Alerts", "Alertes sur liens individuels")}
                        </h3>
                        {!isPremium && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                            {tr("RESERVED FOR PRO PLANS", "RÉSERVÉ AUX FORFAITS PRO")}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400">
                        {tr(
                          "Custom thresholds per short link with automated notifications",
                          "Seuils personnalisés par lien court avec notifications automatiques"
                        )}
                      </p>
                    </div>

                    {/* Filter buttons */}
                    <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/60 rounded-lg text-xs font-medium self-start sm:self-auto">
                      {(
                        [
                          { id: "all", label: `${tr("All", "Toutes")} (${individualAlerts.length})` },
                          { id: "active", label: `${tr("Active", "Actives")} (${activeCount})` },
                          { id: "paused", label: `${tr("Paused", "En pause")} (${pausedCount})` },
                          { id: "reached", label: `${tr("Reached", "Atteintes")} (${reachedCount})` },
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
                              {tr("Individual Link Alerts", "Alertes sur liens individuels")}
                            </h4>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/25">
                              {tr("PRO PLAN", "FORFAIT PRO")}
                            </span>
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-neutral-400 leading-relaxed max-w-xl">
                            {locale === "fr" ? (
                              <>
                                La configuration d&apos;alertes personnalisées par lien (seuils de clics, revenus attribués et alertes d&apos;expiration en temps réel) est réservée aux abonnés Pro. Votre formule Starter inclut déjà un accès complet à l&apos;<strong>Objectif global de l&apos;espace de travail</strong> ci-dessus.
                              </>
                            ) : (
                              <>
                                Configuring custom per-link alerts (click thresholds, attributed revenue, and real-time expiration warnings) is reserved for Pro subscribers. Your Starter plan already includes full access to the <strong>Global Workspace Target</strong> above.
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="glow"
                        onClick={() =>
                          triggerPlanUpgrade({
                            featureName: tr("Link Alerts", "Alertes par lien"),
                            reason: tr(
                              "Upgrade to the Pro plan to configure click, revenue, and expiration alerts on your individual links.",
                              "Passez au forfait Pro pour configurer des alertes de clics, de revenus et d'expiration sur vos liens individuels."
                            ),
                            targetPlan: "PRO",
                          })
                        }
                        className="h-8 px-4 text-xs font-semibold shrink-0 self-start sm:self-auto cursor-pointer shadow-sm rounded-[8px]"
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        <span>{tr("Unlock with PRO", "Débloquer avec PRO")}</span>
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
                        {tr(
                          "No alerts match the selected filter",
                          "Aucune alerte ne correspond au filtre sélectionné"
                        )}
                      </h4>
                      <p className="text-[11px] text-zinc-500 mt-1 max-w-sm mx-auto">
                        {tr(
                          "Create an alert on any of your short links to get notified as soon as a click limit or revenue target is reached.",
                          "Créez une alerte sur n'importe lequel de vos liens courts pour être averti dès qu'une limite de clics ou un objectif de revenus est atteint."
                        )}
                      </p>
                      <Button
                        type="button"
                        variant="glow"
                        onClick={handleOpenCreateModal}
                        className="mt-4 h-8 px-4 text-xs font-medium cursor-pointer"
                      >
                        <Plus className="w-3 h-3 mr-1.5" />
                        {tr("Create Alert", "Créer une alerte")}
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
                            ? tr("Day", "Jour")
                            : alert.period === "week"
                              ? tr("Week", "Semaine")
                              : tr("Month", "Mois");

                        return (
                          <div
                            key={alert.id}
                            className="p-4 rounded-[10px] border border-zinc-200 dark:border-[#222225] bg-white dark:bg-[#111113] flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 hover:border-brand shadow-xs relative cursor-default"
                          >
                            {/* Link Info */}
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-xs text-zinc-900 dark:text-white truncate max-w-xs">
                                  {alert.linkTitle ||
                                    (alert.slug
                                      ? `lsho.cc/${alert.slug}`
                                      : tr("Custom Alert", "Alerte personnalisée"))}
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
                                  {isRev ? tr("Revenue ($)", "Revenus ($)") : tr("Clicks", "Clics")}
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
                                    ? tr("Reached", "Atteinte")
                                    : alert.status === "paused"
                                      ? tr("Paused", "En pause")
                                      : tr("Active", "Active")}
                                </span>
                                {alert.notifyExpired && Boolean(alert.linkId) && (
                                  <span className="text-[10px] text-zinc-400">
                                    · {tr("Alert on exact expiration", "Alerte à l'expiration exacte")}
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
                                    ? `$${current.toLocaleString(numLocale, { minimumFractionDigits: 0 })} / $${target.toLocaleString(numLocale)}`
                                    : `${current.toLocaleString(numLocale)} / ${target.toLocaleString(numLocale)}`}
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
                                aria-label={tr("Open menu", "Ouvrir le menu")}
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
                                        <span>{tr("Resume Alert", "Réactiver l'alerte")}</span>
                                      </>
                                    ) : (
                                      <>
                                        <Pause className="w-3.5 h-3.5 text-amber-600" />
                                        <span>{tr("Pause Alert", "Mettre en pause")}</span>
                                      </>
                                    )}
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditModal(alert)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                                  >
                                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                                    <span>{tr("Edit Alert", "Modifier l'alerte")}</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleTestTarget(alert)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800/80 rounded-lg transition-colors cursor-pointer text-left"
                                  >
                                    <Sparkles className="w-3.5 h-3.5 text-violet-600" />
                                    <span>{tr("Send Test Alert", "Envoyer une alerte test")}</span>
                                  </button>
                                  <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-1" />
                                  <button
                                    type="button"
                                    onClick={() => handleDeleteTarget(alert.id)}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer text-left"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>{tr("Delete Alert", "Supprimer l'alerte")}</span>
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
                    widthClass="w-full sm:max-w-[620px] md:max-w-[680px]"
                    className="h-auto max-h-[88vh] md:h-full md:max-h-full flex flex-col bg-white dark:bg-[#121215] border-zinc-200 dark:border-[#27272a] rounded-[10px] shadow-2xl overflow-hidden"
                  >
                    {/* Drawer Header */}
                    <div className="flex items-center justify-between px-6 py-4.5 border-b border-zinc-100 dark:border-[#202024] shrink-0 bg-white dark:bg-[#121215]">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-[8px] bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-blue-900/40 shrink-0">
                          <Target className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h3 className="text-base font-bold text-zinc-950 dark:text-white">
                            {isEditingGlobalAlert
                              ? tr("Edit Monthly Global Target", "Modifier l'objectif mensuel global")
                              : editingAlert
                                ? tr("Edit Alert", "Modifier l'alerte")
                                : tr("New Performance Alert", "Nouvelle alerte de performance")}
                          </h3>
                          <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200 mt-0.5">
                            {isEditingGlobalAlert
                              ? tr(
                                  "Configure your workspace monthly click or revenue target",
                                  "Configurez l'objectif mensuel de clics ou de revenus de votre espace de travail"
                                )
                              : tr(
                                  "Set click thresholds, revenue limits, or both combined",
                                  "Définissez des seuils de clics, des limites de revenus ou les deux combinés"
                                )}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsAlertModalOpen(false)}
                        aria-label={tr("Close drawer", "Fermer le panneau")}
                        className="p-1.5 rounded-[8px] text-zinc-600 hover:text-zinc-950 dark:text-zinc-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-[#1f1f23] transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Scrollable Form Body */}
                    <form onSubmit={handleSaveTarget} noValidate className="flex-1 min-h-0 overflow-y-auto p-6 flex flex-col gap-5 text-xs">
                      {/* Link Selection (hidden if editing global) */}
                      {!isEditingGlobalAlert && (
                        <div className="flex flex-col gap-1.5 text-xs">
                          <label htmlFor="target-link-select" className="font-bold text-zinc-950 dark:text-white">
                            {tr("Alert Target (Link or Global)", "Cible de l'alerte (Lien ou Global)")}
                          </label>
                          <select
                            id="target-link-select"
                            value={alertLinkId}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!isPremium && val !== "global") {
                                triggerPlanUpgrade({
                                  featureName: tr("Link Alerts", "Alertes par lien"),
                                  reason: tr(
                                    "Configuring alerts on individual links requires the Pro plan.",
                                    "La configuration d'alertes sur des liens individuels nécessite le forfait Pro."
                                  ),
                                  targetPlan: "PRO",
                                });
                                return;
                              }
                              setAlertLinkId(val);
                              if (val === "global") {
                                setAlertNotifyExpired(false);
                              }
                            }}
                            className="h-10 px-3 rounded-[8px] bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs font-medium text-zinc-950 dark:text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                          >
                            <option value="global">
                              {tr("🌐 Global (All workspace links)", "🌐 Global (Tous les liens de l'espace)")}
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
                        <label className="font-bold text-zinc-950 dark:text-white">
                          {tr("Metric to Monitor", "Métrique à surveiller")}
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            type="button"
                            onClick={() => setAlertMetricType("clicks")}
                            className={`h-9 rounded-[8px] font-bold text-xs border transition-all cursor-pointer ${
                              alertMetricType === "clicks"
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-zinc-200 hover:border-zinc-300"
                            }`}
                          >
                            {tr("Total Clicks", "Clics totaux")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAlertMetricType("revenue")}
                            className={`h-9 rounded-[8px] font-bold text-xs border transition-all cursor-pointer ${
                              alertMetricType === "revenue"
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-zinc-200 hover:border-zinc-300"
                            }`}
                          >
                            {tr("Revenue ($)", "Revenus ($)")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setAlertMetricType("both")}
                            className={`h-9 rounded-[8px] font-bold text-xs border transition-all cursor-pointer ${
                              alertMetricType === "both"
                                ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                : "bg-zinc-50 dark:bg-[#18181b] border-zinc-200 dark:border-[#27272a] text-zinc-800 dark:text-zinc-200 hover:border-zinc-300"
                            }`}
                          >
                            {tr("Both Metrics", "Les deux")}
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
                                {tr("Total Clicks Threshold", "Seuil de clics totaux")}
                              </span>
                              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-semibold">
                                {alertTargetClicks.toLocaleString(numLocale)} {tr("clicks", "clics")}
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
                              <span className="text-[10px] text-zinc-400">{tr("Presets:", "Préréglages :")}</span>
                              {[500, 1000, 2500, 5000, 10000].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setAlertTargetClicks(preset)}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 cursor-pointer"
                                >
                                  {preset.toLocaleString(numLocale)}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="h-px bg-zinc-200 dark:bg-zinc-800" />

                          {/* Revenue Threshold in Dual Mode */}
                          <div className="flex flex-col gap-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-semibold text-zinc-800 dark:text-zinc-200">
                                {tr("Attributed Revenue Threshold ($)", "Seuil de revenus attribués ($)")}
                              </span>
                              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold">
                                ${alertTargetRevenue.toLocaleString(numLocale)} USD
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
                              <span className="text-[10px] text-zinc-400">{tr("Presets:", "Préréglages :")}</span>
                              {[100, 500, 1000, 2500, 5000].map((preset) => (
                                <button
                                  key={preset}
                                  type="button"
                                  onClick={() => setAlertTargetRevenue(preset)}
                                  className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-200/60 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-300 cursor-pointer"
                                >
                                  ${preset.toLocaleString(numLocale)}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Single Metric Input */
                        <div className="flex flex-col gap-1.5 text-xs">
                          <label className="font-bold text-zinc-950 dark:text-white">
                            {tr("Alert Threshold Value", "Valeur du seuil d'alerte")}
                          </label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              step="any"
                              value={alertTargetValue}
                              onChange={(e) => setAlertTargetValue(Math.max(1, Number(e.target.value) || 0))}
                              className="flex-1 h-9 px-3 rounded-[8px] bg-zinc-50 dark:bg-[#18181b] border border-zinc-200 dark:border-[#27272a] text-xs font-mono font-bold text-zinc-950 dark:text-white focus:outline-none focus:border-blue-500"
                            />
                            <span className="font-bold text-xs text-blue-600 dark:text-blue-400 shrink-0">
                              {alertMetricType === "revenue" ? "USD ($)" : tr("clicks", "clics")}
                            </span>
                          </div>
                          {/* Quick presets */}
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-semibold">
                              {tr("Quick:", "Rapide :")}
                            </span>
                            {(alertMetricType === "revenue"
                              ? [100, 500, 1000, 2500, 5000]
                              : [500, 1000, 2500, 5000, 10000]
                            ).map((preset) => (
                              <button
                                key={preset}
                                type="button"
                                onClick={() => setAlertTargetValue(preset)}
                                className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                              >
                                {alertMetricType === "revenue"
                                  ? `$${preset.toLocaleString(numLocale)}`
                                  : preset.toLocaleString(numLocale)}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Period Selection (Day, Week, Month) */}
                      <div className="flex flex-col gap-1.5 text-xs">
                        <label className="font-bold text-zinc-950 dark:text-white flex items-center justify-between">
                          <span>{tr("Tracking Period", "Période de suivi")}</span>
                          {isEditingGlobalAlert && (
                            <span className="text-[10px] text-zinc-500 dark:text-zinc-400 font-normal">
                              {tr("Locked to Monthly for workspace", "Verrouillé sur Mensuel pour l'espace")}
                            </span>
                          )}
                        </label>
                        {isEditingGlobalAlert ? (
                          <div className="h-9 px-3 rounded-[8px] bg-zinc-100 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center">
                            {tr("Monthly (Workspace Target)", "Mensuel (Objectif espace de travail)")}
                          </div>
                        ) : (
                          <div className="grid grid-cols-3 gap-2">
                            {(
                              [
                                { id: "day", label: tr("Day", "Jour") },
                                { id: "week", label: tr("Week", "Semaine") },
                                { id: "month", label: tr("Month", "Mois") },
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
                                  <p className={`font-bold ${isGlobalTarget ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-950 dark:text-white"}`}>
                                    {tr("Link expiration alert", "Alerte d'expiration du lien")}
                                  </p>
                                  {isGlobalTarget && (
                                    <span className="px-1.5 py-0.5 rounded-[6px] text-[9px] font-semibold bg-zinc-200/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
                                      {tr("Individual link required", "Lien individuel requis")}
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium mt-0.5">
                                  {isGlobalTarget
                                    ? tr(
                                        "Unavailable for a global target. Select a specific short link above to be alerted at its exact expiration time.",
                                        "Indisponible pour un objectif global. Sélectionnez un lien court spécifique ci-dessus pour être alerté à son heure exacte d'expiration."
                                      )
                                    : tr(
                                        "Receive an instant notification the exact moment the link expires.",
                                        "Recevez une notification instantanée au moment exact où le lien expire."
                                      )}
                                </p>
                              </div>
                              <input
                                id="drawer_alert_notify_expired"
                                type="checkbox"
                                aria-label={tr("Link expiration alert", "Alerte d'expiration du lien")}
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
                            <p className="font-bold text-zinc-950 dark:text-white">
                              {tr("Email Notification", "Notification par e-mail")}
                            </p>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">
                              {tr(
                                "Transactional alert sent to your account email address",
                                "Alerte transactionnelle envoyée à l'adresse e-mail de votre compte"
                              )}
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
                            <p className="font-bold text-zinc-950 dark:text-white">
                              {tr("In-App Notification (Bell)", "Notification dans l'application (Cloche)")}
                            </p>
                            <p className="text-[11px] text-zinc-600 dark:text-zinc-300 font-medium">
                              {tr(
                                "Display a badge and notification in the top navigation bar",
                                "Afficher un badge et une notification dans la barre de navigation supérieure"
                              )}
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
                          {tr("Cancel", "Annuler")}
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
                              <span>{tr("Saving...", "Enregistrement...")}</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-3.5 h-3.5" />
                              <span>
                                {editingAlert || isEditingGlobalAlert
                                  ? tr("Save Changes", "Enregistrer les modifications")
                                  : tr("Create Alert", "Créer l'alerte")}
                              </span>
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
                    {tr("Data, Export & GDPR Privacy", "Données, Exportation & Confidentialité RGPD")}
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400">
                    {tr(
                      "Export your complete archives or permanently delete your account.",
                      "Exportez vos archives complètes ou supprimez définitivement votre compte."
                    )}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col justify-between gap-4 shadow-xs">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white">
                      {tr("Complete Archive (JSON)", "Archive complète (JSON)")}
                    </h3>
                    <p className="text-[11px] text-zinc-600 dark:text-neutral-400 mt-1">
                      {tr(
                        "Contains all your short links, tags, targeting rules, and aggregated metrics.",
                        "Contient tous vos liens courts, tags, règles de ciblage et métriques agrégées."
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExportData("json")}
                    className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[8px] bg-zinc-50 hover:bg-zinc-100 dark:bg-[#161619] dark:hover:bg-[#202024] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#27272a] text-xs font-semibold shadow-xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-brand" />
                    <span>{tr("Download JSON Archive", "Télécharger l'archive JSON")}</span>
                  </button>
                </div>

                <div className="p-5 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] flex flex-col justify-between gap-4 shadow-xs">
                  <div>
                    <h3 className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <span>{tr("Export Events & Clicks (ZIP & CSV)", "Exporter événements & clics (ZIP & CSV)")}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-brand/10 text-brand font-medium">
                        {tr("Multi-page", "Multi-pages")}
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-600 dark:text-neutral-400 mt-1 leading-relaxed">
                      {tr(
                        "Complete ZIP archive with per-page subfolders (links, analytics, geography, devices, sources, conversions) and a clean full CSV file.",
                        "Archive ZIP complète avec sous-dossiers par page (liens, analytics, géographie, appareils, sources, conversions) et fichier CSV complet aéré."
                      )}
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={isExportingArchive}
                    onClick={() => handleExportData("zip")}
                    className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[8px] bg-zinc-50 hover:bg-zinc-100 dark:bg-[#161619] dark:hover:bg-[#202024] text-zinc-900 dark:text-white border border-zinc-200 dark:border-[#27272a] text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isExportingArchive ? (
                      <RefreshCw className="w-3.5 h-3.5 text-brand animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5 text-brand" />
                    )}
                    <span>
                      {isExportingArchive
                        ? tr("Generating ZIP archive...", "Génération de l'archive ZIP...")
                        : tr("Download ZIP & CSV Archive", "Télécharger l'archive ZIP & CSV")}
                    </span>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-5 rounded-[10px] bg-red-50/50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/25 flex flex-col gap-3 shadow-xs">
                <h3 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">
                  {tr("Danger Zone", "Zone de danger")}
                </h3>
                <p className="text-xs text-slate-700 dark:text-neutral-300">
                  {tr(
                    "Account deletion is immediate and irreversible. All your short links, metadata, and connected domains will be permanently erased.",
                    "La suppression du compte est immédiate et irréversible. Tous vos liens courts, métadonnées et domaines connectés seront définitivement effacés."
                  )}
                </p>
                <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
                  <Input
                    placeholder={tr("Type DELETE to confirm", "Saisissez DELETE pour confirmer")}
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
                        ? tr("Deleting account...", "Suppression du compte...")
                        : tr("Permanently delete my account", "Supprimer définitivement mon compte")}
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
                {tr("About LShorter", "À propos de LShorter")}
              </h2>
              <p className="leading-relaxed text-zinc-600 dark:text-neutral-300">
                {tr(
                  "LShorter is a high-performance Edge SaaS link infrastructure platform powered globally by Cloudflare Workers, D1, and Convex Realtime Database.",
                  "LShorter est une plateforme SaaS d'infrastructure de liens Edge haute performance propulsée mondialement par Cloudflare Workers, D1 et Convex Realtime Database."
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] shadow-xs">
                  <span className="text-zinc-500 dark:text-neutral-500">
                    {tr("Application Version", "Version de l'application")}
                  </span>
                  <p className="font-mono text-zinc-900 dark:text-white font-bold text-sm mt-0.5">
                    v1.2.0 ({tr("Production", "Production")})
                  </p>
                </div>
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] shadow-xs">
                  <span className="text-zinc-500 dark:text-neutral-500">
                    {tr("Cloudflare Edge & D1 Network", "Réseau Cloudflare Edge & D1")}
                  </span>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {tr("Operational (<0.8ms latency)", "Opérationnel (latence <0,8 ms)")}
                  </p>
                </div>
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] shadow-xs">
                  <span className="text-zinc-500 dark:text-neutral-500">
                    {tr("OpenGraph & Social Previews", "OpenGraph & Aperçus sociaux")}
                  </span>
                  <p className="text-zinc-900 dark:text-white font-bold text-sm mt-0.5">
                    {tr("Direct URL Metadata Injection", "Injection directe de métadonnées URL")}
                  </p>
                </div>
                <div className="p-4 rounded-[10px] bg-white dark:bg-[#111113] border border-zinc-200 dark:border-[#222225] shadow-xs">
                  <span className="text-zinc-500 dark:text-neutral-500">
                    {tr("Realtime Database", "Base de données temps réel")}
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



      {/* Cancel Auto-Renewal & Churn Feedback Modal */}
      <CancellationFeedbackModal
        isOpen={isCancelSubModalOpen}
        onClose={() => setIsCancelSubModalOpen(false)}
        plan={plan}
        displayPeriodEnd={displayPeriodEnd}
        onSuccess={() => {
          setIsCancelSubModalOpen(false);
          loadSubscriptionDetails();
          window.dispatchEvent(new Event("lshorter_notifications_sync"));
        }}
      />
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
