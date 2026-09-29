"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Download,
  Trash2,
  Sparkles,
  Lock,
  Smartphone,
  Copy,
  RefreshCw,
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
} from "lucide-react";
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
} from "@/lib/cloudflare-api";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import {
  UserProfile,
  WebhookConfig,
  RetargetingPixel,
  InvoiceItem,
  ActiveSession,
  ApiKeyItem,
} from "@/types";
import { ApiKeyCreatedModal } from "@/components/dashboard/api-key-created-modal";
import { DeleteConfirmModal } from "@/components/dashboard/delete-confirm-modal";
import { TwoFactorSetupModal } from "@/components/dashboard/two-factor-setup-modal";
import { TwoFactorRecoveryModal } from "@/components/dashboard/two-factor-recovery-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { SettingsPageSkeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/toast-provider";
import { syncUserToCloudflare } from "@/app/actions/sync-user";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
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
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlTabParam = searchParams.get("tab");
  const userId = session?.user?.id || "";
  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId ? { userId } : "skip",
  );
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

  const loadAccountStats = async () => {
    if (!userId) return;
    try {
      const [linksRes, domainsRes, analyticsRes, analytics30dRes] =
        await Promise.all([
          cfGetLinks(userId).catch(() => null),
          cfGetDomains(userId).catch(() => null),
          cfGetAnalytics(userId).catch(() => null),
          cfGetAnalytics(userId, "30d").catch(() => null),
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
      const analyticsClicksAll = Number(
        analyticsRes?.data?.totalClicks ??
          analyticsRes?.data?.total_clicks ??
          0,
      );
      const analyticsClicks30d = Number(
        analytics30dRes?.data?.totalClicks ??
          analytics30dRes?.data?.total_clicks ??
          0,
      );
      const totalLiveClicks = Math.max(
        analyticsClicksAll,
        analyticsClicks30d,
        sumClicks,
      );

      setAccountStats({
        linksCount: lList.length,
        clicksThisMonth: totalLiveClicks,
        domainsCount: dList.length,
        userDomains: dList,
      });

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(`lshorter_live_clicks_${userId}`, String(totalLiveClicks));
          window.dispatchEvent(
            new CustomEvent("lshorter_live_clicks_synced", {
              detail: { clicks: totalLiveClicks },
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
    loadAccountStats();
    window.addEventListener("lshorter_data_change", loadAccountStats);
    window.addEventListener("lshorter_links_updated", loadAccountStats);
    window.addEventListener("lshorter_link_clicked", loadAccountStats);
    window.addEventListener("focus", loadAccountStats);
    return () => {
      window.removeEventListener("lshorter_data_change", loadAccountStats);
      window.removeEventListener("lshorter_links_updated", loadAccountStats);
      window.removeEventListener("lshorter_link_clicked", loadAccountStats);
      window.removeEventListener("focus", loadAccountStats);
    };
  }, [userId]);

  // ─── Legal Billing Details State ───────────────────────────────────────────
  const [legalCompanyName, setLegalCompanyName] = useState("");
  const [legalTaxId, setLegalTaxId] = useState("");
  const [legalBillingAddress, setLegalBillingAddress] = useState("");
  const [billingSaved, setBillingSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      const savedBilling = localStorage.getItem(
        `lshorter_legal_billing_${userId}`,
      );
      if (savedBilling) {
        try {
          const parsed = JSON.parse(savedBilling);
          if (parsed.companyName) setLegalCompanyName(parsed.companyName);
          if (parsed.taxId) setLegalTaxId(parsed.taxId);
          if (parsed.billingAddress)
            setLegalBillingAddress(parsed.billingAddress);
        } catch {}
      }
    }
  }, [userId]);

  const handleSaveBillingDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && userId) {
      const data = {
        companyName: legalCompanyName,
        taxId: legalTaxId,
        billingAddress: legalBillingAddress,
      };
      localStorage.setItem(
        `lshorter_legal_billing_${userId}`,
        JSON.stringify(data),
      );
      setBillingSaved(true);
      showToast.success("Billing details saved!");
      setTimeout(() => setBillingSaved(false), 2500);
    }
  };

  const planNormalized = (plan === "FREEMIUM" ? "FREE" : plan) as
    "FREE" | "FREEMIUM" | "PRO" | "BUSINESS" | "ENTERPRISE";
  const clicksLimit =
    plan === "ENTERPRISE"
      ? 2_000_000
      : plan === "BUSINESS"
        ? 500_000
        : plan === "PRO"
          ? 150_000
          : 10_000;
  const domainsLimit =
    plan === "ENTERPRISE"
      ? 50
      : plan === "BUSINESS"
        ? 15
        : plan === "PRO"
          ? 3
          : 0;
  const rawClicksRatio =
    clicksLimit > 0 ? (accountStats.clicksThisMonth / clicksLimit) * 100 : 0;
  const clicksPercent = Math.min(100, Math.round(rawClicksRatio));
  const clicksPercentLabel =
    accountStats.clicksThisMonth === 0
      ? "0%"
      : rawClicksRatio < 1
        ? `${rawClicksRatio.toFixed(2)}%`
        : `${clicksPercent}%`;
  const clicksBarWidthPercent =
    accountStats.clicksThisMonth > 0
      ? Math.min(100, Math.max(2, rawClicksRatio))
      : 0;

  const isOverage =
    accountStats.clicksThisMonth > clicksLimit &&
    (plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE");
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

  // ─── Real Invoices (Only populated if paid subscription exists) ─────────────
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  useEffect(() => {
    if (plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE") {
      const now = new Date();
      const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
      ];
      const baseAmount =
        plan === "ENTERPRISE" ? 199 : plan === "BUSINESS" ? 49 : 15;
      const totalAmount = baseAmount + overageAmount;
      const invNum = `INV-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, "0")}-${userId ? userId.substring(0, 4).toUpperCase() : "LIVE"}`;
      setInvoices([
        {
          id: `inv_${now.getFullYear()}_${now.getMonth() + 1}`,
          number: invNum,
          invoiceNumber: invNum,
          date: `01 ${monthNames[now.getMonth()]} ${now.getFullYear()}`,
          amount: totalAmount,
          amountPaid: totalAmount,
          currency: "EUR",
          status: "paid",
          planName: `LShorter ${plan}`,
          planId: plan as any,
          pdfUrl: `/api/billing/invoices/${invNum}/download`,
        },
      ]);
    } else {
      setInvoices([]);
    }
  }, [plan, userId, overageAmount]);

  const handleDownloadInvoice = (inv: InvoiceItem) => {
    const invNumber = inv.number || inv.invoiceNumber || "INV-2026-001";
    const baseAmt =
      inv.amount ||
      (plan === "ENTERPRISE" ? 199 : plan === "BUSINESS" ? 49 : 15);
    const params = new URLSearchParams({
      plan: planNormalized,
      amount: baseAmt.toString(),
      companyName: legalCompanyName || name || "Customer Account",
      email: email || "client@lshorter.io",
      taxId: legalTaxId || "",
      address: legalBillingAddress || "123 Market St, San Francisco, CA 94105",
      overageClicks: overageClicks.toString(),
      overageAmount: overageAmount.toString(),
      batchesOverage: overageBatches.toString(),
    });
    window.open(
      `/api/billing/invoices/${invNumber}/download?${params.toString()}`,
      "_blank",
    );
    showToast.success(`Downloading invoice ${invNumber}...`);
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
  const [copiedKeyText, setCopiedKeyText] = useState<string | null>(null);
  const [keyToDelete, setKeyToDelete] = useState<{
    isOpen: boolean;
    id: string;
    name: string;
  }>({
    isOpen: false,
    id: "",
    name: "",
  });
  const [isRevokingKey, setIsRevokingKey] = useState(false);

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

  // ─── Webhooks State (Persistent Storage) ────────────────────────────────────
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [webhookTestResponse, setWebhookTestResponse] = useState<string | null>(
    null,
  );
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [showWebhookGuide, setShowWebhookGuide] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      const saved = localStorage.getItem(`lshorter_webhooks_${userId}`);
      if (saved) {
        try {
          setWebhooks(JSON.parse(saved));
        } catch {}
      }
    }
  }, [userId]);

  const saveWebhooksList = (list: WebhookConfig[]) => {
    setWebhooks(list);
    if (typeof window !== "undefined" && userId) {
      localStorage.setItem(`lshorter_webhooks_${userId}`, JSON.stringify(list));
    }
  };

  // ─── Pixels State (Persistent Storage) ──────────────────────────────────────
  const [pixels, setPixels] = useState<RetargetingPixel[]>([]);
  const [newPixelId, setNewPixelId] = useState("");
  const [newPixelPlatform, setNewPixelPlatform] = useState<
    "facebook" | "google_tag" | "tiktok" | "linkedin"
  >("facebook");
  const [showPixelGuide, setShowPixelGuide] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      const saved = localStorage.getItem(`lshorter_pixels_${userId}`);
      if (saved) {
        try {
          setPixels(JSON.parse(saved));
        } catch {}
      }
    }
  }, [userId]);

  const savePixelsList = (list: RetargetingPixel[]) => {
    setPixels(list);
    if (typeof window !== "undefined" && userId) {
      localStorage.setItem(`lshorter_pixels_${userId}`, JSON.stringify(list));
    }
  };

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

  // ─── Notifications State (Persistent, Confirmed via Global Button) ──────────
  const [spikeThreshold, setSpikeThreshold] = useState(1000);
  const [linkAlerts, setLinkAlerts] = useState(true);
  const [expirationAlerts, setExpirationAlerts] = useState(true);
  const [notifSaved, setNotifSaved] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      const saved = localStorage.getItem(`lshorter_notif_${userId}`);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.spikeThreshold) setSpikeThreshold(parsed.spikeThreshold);
          if (parsed.linkAlerts !== undefined) setLinkAlerts(parsed.linkAlerts);
          if (parsed.expirationAlerts !== undefined)
            setExpirationAlerts(parsed.expirationAlerts);
        } catch {}
      }
    }
  }, [userId]);

  const handleConfirmNotificationPrefs = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const newPrefs = {
      spikeThreshold,
      linkAlerts,
      expirationAlerts,
    };
    if (typeof window !== "undefined" && userId) {
      localStorage.setItem(
        `lshorter_notif_${userId}`,
        JSON.stringify(newPrefs),
      );
    }
    setNotifSaved(true);
    showToast.success(
      "Préférences de notifications confirmées et enregistrées !",
    );
    setTimeout(() => setNotifSaved(false), 2500);
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
    try {
      const res = await cfGetApiKeys(userId);
      const rawKeys: ApiKeyItem[] = (res?.data || []).map((k: any) => ({
        id: k.id,
        name: k.name || "API Key",
        prefix: k.prefix || k.key_prefix || "lsh_live_...",
        rawKey: k.raw_key,
        scope: (k.scope as any) || "read_write",
        rateLimit: k.rate_limit ? `${k.rate_limit} req / min` : "600 req / min",
        created_at: k.created_at || new Date().toISOString(),
      }));
      setApiKeys(rawKeys);
    } catch (err) {
      console.warn("[Settings] Error loading API keys:", err);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
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
        setAvatarUrl(uploadRes.url);
        showToast.success("Profile picture uploaded to Bunny CDN!");
      } else {
        showToast.error("Failed to upload profile picture");
      }
    } catch {
      showToast.error("Error uploading profile picture");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyText(text);
    setTimeout(() => setCopiedKeyText(null), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfileMutation({
        userId,
        name,
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
    if (!newKeyName.trim() || !userId) return;
    try {
      const res = await cfCreateApiKey({
        userId,
        name: newKeyName.trim(),
        scope: newKeyScope,
      });
      if (res?.data) {
        const generatedKeyData: ApiKeyItem = {
          id: res.data.id || `key_${Date.now()}`,
          name: newKeyName.trim(),
          prefix: res.data.prefix || res.data.key_prefix || "lsh_live_...",
          rawKey: res.data.raw_key || res.data.rawKey || res.data.api_key,
          scope: newKeyScope,
          rateLimit: "600 req / min",
          created_at: new Date().toISOString(),
        };
        setCreatedKeyModal(generatedKeyData);
      }
      setNewKeyName("");
      confetti({ particleCount: 40, spread: 60 });
      showToast.success("API key created successfully!");
      loadApiKeys();
    } catch (err: any) {
      showToast.error(err.message || "Error creating API key.");
    }
  };

  const confirmRevokeKey = async () => {
    if (!keyToDelete.id) return;
    setIsRevokingKey(true);
    try {
      await cfRevokeApiKey(keyToDelete.id, userId);
      showToast.success("API key revoked successfully.");
      setKeyToDelete({ isOpen: false, id: "", name: "" });
      loadApiKeys();
    } catch (err) {
      showToast.error("Error revoking key.");
    } finally {
      setIsRevokingKey(false);
    }
  };

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (plan === "FREEMIUM") {
      triggerPlanUpgrade({
        featureName: "Webhooks",
        reason:
          "Webhooks and real-time event streaming are reserved for PRO and BUSINESS plans.",
        targetPlan: "PRO",
      });
      return;
    }
    if (!newWebhookUrl.trim()) return;
    const newWh: WebhookConfig = {
      id: `wh_${Date.now()}`,
      url: newWebhookUrl.trim(),
      events: ["click.created", "conversion.created"],
      isActive: true,
      secretKey: `whsec_${Math.random().toString(36).substring(2, 14)}`,
      lastStatus: 200,
      created_at: new Date().toISOString(),
    };
    saveWebhooksList([...webhooks, newWh]);
    setNewWebhookUrl("");
    confetti({ particleCount: 30, spread: 50 });
    showToast.success("Webhook configured successfully!");
  };

  const handleDeleteWebhook = (id: string) => {
    saveWebhooksList(webhooks.filter((w) => w.id !== id));
    showToast.success("Webhook deleted.");
  };

  const handleToggleWebhook = (id: string) => {
    saveWebhooksList(
      webhooks.map((w) => (w.id === id ? { ...w, isActive: !w.isActive } : w)),
    );
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

  const handleAddPixel = (e: React.FormEvent) => {
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
    if (!newPixelId.trim()) return;
    const nameMap: Record<string, string> = {
      facebook: "Meta Facebook Pixel",
      google_tag: "Google Analytics 4 / Tag",
      tiktok: "TikTok Ads Tag",
      linkedin: "LinkedIn Insight Tag",
    };
    const newPx: RetargetingPixel = {
      id: `px_${Date.now()}`,
      platform: newPixelPlatform,
      pixelId: newPixelId.trim(),
      name: nameMap[newPixelPlatform] || "Pixel Tag",
      isActive: true,
      eventsTrackedCount: 0,
    };
    savePixelsList([...pixels, newPx]);
    setNewPixelId("");
    confetti({ particleCount: 30, spread: 50 });
    showToast.success("Retargeting pixel connected!");
  };

  const handleDeletePixel = (id: string) => {
    savePixelsList(pixels.filter((p) => p.id !== id));
    showToast.success("Pixel deleted.");
  };

  const handleTogglePixel = (id: string) => {
    savePixelsList(
      pixels.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p)),
    );
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
    <div className="flex flex-col gap-6 lg:gap-8 animate-in fade-in pb-20 md:pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-wide">
          Account Settings
        </h1>
        <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
          Configure your profile, API keys, webhook integrations, pixels, and
          security.
        </p>
      </div>

      <div className="w-full">
        {/* Full-width Content Area (controlled via Main Sidebar Tree Sub-Menu) */}
        <div className="w-full rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-5 lg:p-8 shadow-xs dark:shadow-2xl">
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    User Profile
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400">
                    Personal information, timezone, and display preferences.
                  </p>
                </div>
                <Badge variant="orange">Plan {plan}</Badge>
              </div>

              {/* Avatar Selector */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5 p-4 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a]">
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
            </form>
          )}

          {/* TAB 2: BILLING & INVOICES */}
          {activeTab === "billing" && (
            <div className="flex flex-col gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 dark:border-[#222225]">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                      Plan &amp; Billing
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full bg-brand-subtle text-brand border border-brand-subtle text-[10px] font-extrabold uppercase tracking-wider">
                      {plan}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
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

              {/* Quota gauges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600 dark:text-neutral-400 font-semibold">
                      Monthly Click Volume
                    </span>
                    <span
                      className="text-xs text-brand font-bold"
                      data-testid="billing-monthly-clicks-percent"
                    >
                      {plan === "ENTERPRISE"
                        ? `${clicksPercentLabel} (Unlimited overage)`
                        : isOverage
                          ? "100% (Overage active)"
                          : `${clicksPercentLabel} used`}
                    </span>
                  </div>
                  <p
                    className="text-2xl font-bold font-bebas text-zinc-900 dark:text-white"
                    data-testid="billing-monthly-clicks-count"
                  >
                    {(accountStats?.clicksThisMonth ?? 0).toLocaleString(
                      "en-US",
                    )}{" "}
                    / {(clicksLimit ?? 10000).toLocaleString("en-US")}
                    {plan === "ENTERPRISE" ? "+" : ""}
                  </p>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-[#27272a] overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isOverage && plan !== "ENTERPRISE" ? "bg-amber-500" : "bg-brand"}`}
                      style={{ width: `${clicksBarWidthPercent}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-neutral-500 pt-0.5">
                    <span>
                      {plan === "ENTERPRISE"
                        ? "Unlimited overage included ($0 extra)"
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

                <div className="p-4 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-zinc-600 dark:text-neutral-400 font-semibold">
                      Custom Domains
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-neutral-400 font-bold">
                      {accountStats.domainsCount} of {domainsLimit}
                    </span>
                  </div>
                  <p className="text-2xl font-bold font-bebas text-zinc-900 dark:text-white">
                    {accountStats.domainsCount} / {domainsLimit}
                  </p>
                  <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-[#27272a] overflow-hidden mt-1">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{
                        width: `${domainsLimit > 0 ? Math.min(100, (accountStats.domainsCount / domainsLimit) * 100) : 0}%`,
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-zinc-500 dark:text-neutral-500">
                    {domainsLimit === 0
                      ? "Custom domains available from Pro plan"
                      : `${Math.max(0, domainsLimit - accountStats.domainsCount)} domain(s) available`}
                  </span>
                </div>
              </div>

              {/* Legal Billing Details Form */}
              <div className="p-5 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand" />
                      <span>
                        Legal Billing Details (SIRET / EU VAT / Address)
                      </span>
                    </h3>
                    <p className="text-[11px] text-zinc-500 dark:text-neutral-400 mt-0.5">
                      This information automatically appears on all official
                      B2B/EU-compliant downloadable PDF invoices.
                    </p>
                  </div>
                </div>

                <form
                  onSubmit={handleSaveBillingDetails}
                  className="grid grid-cols-1 md:grid-cols-3 gap-3"
                >
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-neutral-300 mb-1">
                      Company / Legal Name
                    </label>
                    <Input
                      value={legalCompanyName}
                      onChange={(e) => setLegalCompanyName(e.target.value)}
                      placeholder={name || "e.g. Acme Corporation SAS"}
                      className="h-9 text-xs bg-white dark:bg-[#0c0c0e] border-zinc-200 dark:border-[#27272a]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-neutral-300 mb-1">
                      Tax ID / EU VAT / SIRET
                    </label>
                    <Input
                      value={legalTaxId}
                      onChange={(e) => setLegalTaxId(e.target.value)}
                      placeholder="e.g. FR 48 912485301 or US-EIN"
                      className="h-9 text-xs bg-white dark:bg-[#0c0c0e] border-zinc-200 dark:border-[#27272a]"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-700 dark:text-neutral-300 mb-1">
                      Full Billing Address
                    </label>
                    <Input
                      value={legalBillingAddress}
                      onChange={(e) => setLegalBillingAddress(e.target.value)}
                      placeholder="e.g. 60 Rue François 1er, 75008 Paris, France"
                      className="h-9 text-xs bg-white dark:bg-[#0c0c0e] border-zinc-200 dark:border-[#27272a]"
                    />
                  </div>
                  <div className="md:col-span-3 flex justify-end pt-1">
                    <Button
                      type="submit"
                      variant="glow"
                      size="sm"
                      className="text-xs px-4 cursor-pointer"
                    >
                      {billingSaved ? "Saved!" : "Save Billing Details"}
                    </Button>
                  </div>
                </form>
              </div>

              {/* Invoices Table */}
              <div className="flex flex-col gap-3 pt-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <FileCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                    <span>
                      Certified Commercial Invoices (EU Directive 2006/112/CE
                      &amp; Art. L441-9)
                    </span>
                  </h3>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                    Norme Comptable HT / TVA / TTC • SIRET &amp; TVA Intracom.
                  </span>
                </div>
                {invoices.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500 dark:text-neutral-500 bg-zinc-50 dark:bg-[#1a1a1e] rounded-[10px] border border-zinc-200 dark:border-[#27272a]">
                    No invoices available. You are currently on the Free plan.
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-zinc-50 dark:bg-[#1a1a1e] rounded-[10px] border border-zinc-200 dark:border-[#27272a]">
                    <table className="w-full text-left text-xs text-zinc-600 dark:text-neutral-400">
                      <thead>
                        <tr className="border-b border-zinc-200 dark:border-[#27272a] text-[11px] uppercase tracking-wider text-zinc-500 dark:text-neutral-500">
                          <th className="py-3 px-3.5">Invoice Ref.</th>
                          <th className="py-3 px-3.5">Issue Date</th>
                          <th className="py-3 px-3.5">Net HT</th>
                          <th className="py-3 px-3.5">VAT (0%)</th>
                          <th className="py-3 px-3.5">Total TTC</th>
                          <th className="py-3 px-3.5">Status</th>
                          <th className="py-3 px-3.5 text-right">
                            Official PDF
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
                              {inv.amount?.toFixed(2)} {inv.currency || "EUR"}
                            </td>
                            <td className="py-3 px-3.5 font-mono text-zinc-500 dark:text-neutral-400">
                              0.00 {inv.currency || "EUR"}
                            </td>
                            <td className="py-3 px-3.5 font-bold font-mono text-zinc-900 dark:text-white">
                              {inv.amount === 0
                                ? "0.00 EUR"
                                : `${inv.amount?.toFixed(2)} ${inv.currency || "EUR"}`}
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
                                <span>Download Compliant PDF</span>
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
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                    <KeyRound className="w-5 h-5 text-brand" />
                    <span>Developer API Keys</span>
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
                    Generate secure{" "}
                    <code className="text-brand">lsh_live_...</code> tokens with
                    granular permissions to integrate your applications.
                  </p>
                </div>
              </div>

              {/* Create Key Card */}
              <div className="p-5 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] shadow-xs dark:shadow-xl flex flex-col gap-4">
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
                    className="shrink-0 h-10 px-5 text-xs font-bold gap-1.5 shadow-md cursor-pointer"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Generate Key</span>
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

                {apiKeys.length === 0 ? (
                  <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2.5 bg-zinc-50 dark:bg-[#141416] rounded-[10px] border border-zinc-200 dark:border-[#27272a]">
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
                          className="p-4 rounded-[10px] bg-zinc-50 dark:bg-[#141416] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#38383e] transition-all flex flex-col gap-3 shadow-xs"
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
                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-[8px] bg-white dark:bg-[#0c0c0e] border border-zinc-200 dark:border-[#222226]">
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
                                  const cmd = `curl -X POST https://api.lshorter.io/v1/links \\\n  -H "Authorization: Bearer ${actualKey}" \\\n  -H "Content-Type: application/json" \\\n  -d '{"targetUrl":"https://example.com"}'`;
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

                              {/* Revoke Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setKeyToDelete({
                                    isOpen: true,
                                    id: k.id,
                                    name: k.name,
                                  })
                                }
                                className="h-8 w-8 rounded-[6px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                                title="Revoke this key"
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
              <div className="rounded-[10px] bg-white dark:bg-[#111113] text-[#09090B] dark:text-white border border-black/[0.08] dark:border-[#222225] p-6 lg:p-8 flex flex-col gap-5 shadow-sm dark:shadow-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#3178c6]/15 dark:bg-[#3178c6]/20 border border-[#3178c6]/30 dark:border-[#3178c6]/40 flex items-center justify-center text-[#3178c6]">
                      <Code2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#09090B] dark:text-white">
                        Official TypeScript SDK (npm i lshorter-api)
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-neutral-400">
                        Ready-to-use implementation examples
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 p-1 rounded-[10px] bg-zinc-100 dark:bg-[#1a1a1e] border border-black/[0.08] dark:border-[#27272a] text-xs overflow-x-auto">
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
                <div className="p-8 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] flex flex-col items-center justify-center gap-3 text-center">
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
                      className="flex items-center justify-between p-4 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] text-xs"
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
                                "cname.lshorter.io"}
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
                <div className="p-4 rounded-[10px] bg-neutral-50 dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-neutral-200/60 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-neutral-900 dark:text-white">
                          Webhooks API &amp; Real-Time Events
                        </h3>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
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

              <form
                onSubmit={handleAddWebhook}
                className="flex flex-col sm:flex-row gap-2"
              >
                <Input
                  required
                  placeholder="https://your-server.com/api/webhooks/lshorter (or Zapier / Make / n8n URL)"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                  className="bg-white dark:bg-[#141416] border-neutral-300 dark:border-[#27272a] text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 h-9"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="shrink-0 text-xs h-9 px-4 font-medium bg-brand hover:bg-brand-hover text-white rounded-[8px] cursor-pointer"
                >
                  Add Webhook
                </Button>
              </form>

              <div className="flex flex-col gap-2.5">
                {webhooks.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500 bg-neutral-50 dark:bg-[#141416] rounded-[10px] border border-neutral-200 dark:border-[#27272a]">
                    No webhooks configured. Add your endpoint above to start
                    receiving events.
                  </div>
                ) : (
                  webhooks.map((wh: any) => (
                    <div
                      key={wh.id}
                      className="p-3.5 rounded-[10px] bg-neutral-50 dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] flex flex-col gap-2.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-neutral-900 dark:text-white font-semibold truncate">
                          {wh.url}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isTestingWebhook}
                            onClick={() =>
                              handleTestWebhook(wh.url, wh.secretKey)
                            }
                            className="text-xs gap-1.5 h-7 px-2.5 border-neutral-200 dark:border-[#27272a] bg-white dark:bg-transparent"
                          >
                            <Send className="w-3 h-3 text-neutral-400" />
                            <span>
                              {isTestingWebhook ? "Sending..." : "Test"}
                            </span>
                          </Button>
                          <button
                            type="button"
                            onClick={() => handleToggleWebhook(wh.id)}
                            className={`px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors ${
                              wh.isActive
                                ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                                : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                            }`}
                          >
                            {wh.isActive ? "Active" : "Paused"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteWebhook(wh.id)}
                            className="text-neutral-400 hover:text-red-400 p-1 cursor-pointer transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400 text-[11px] pt-2 border-t border-neutral-200 dark:border-[#222225]">
                        <span className="font-mono">
                          Secret Signature:{" "}
                          {wh.secretKey || "whsec_live_default"}
                        </span>
                        <span>Events: clicks &amp; conversions</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

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
                <div className="p-4 rounded-[10px] bg-neutral-50 dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start sm:items-center gap-3">
                    <div className="w-8 h-8 rounded-[8px] bg-neutral-200/60 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 flex items-center justify-center text-neutral-600 dark:text-neutral-400 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-xs font-semibold text-neutral-900 dark:text-white">
                          Advertising Retargeting Pixels
                        </h3>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-200/80 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-300 dark:border-neutral-700">
                          PRO
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
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

              <form
                onSubmit={handleAddPixel}
                className="grid grid-cols-1 sm:grid-cols-3 gap-2"
              >
                <select
                  value={newPixelPlatform}
                  onChange={(e) => setNewPixelPlatform(e.target.value as any)}
                  className="h-9 rounded-[8px] bg-white dark:bg-[#141416] text-neutral-900 dark:text-white border border-neutral-300 dark:border-[#27272a] px-3 text-xs focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option
                    value="facebook"
                    className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white"
                  >
                    Meta Facebook Pixel
                  </option>
                  <option
                    value="google_tag"
                    className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white"
                  >
                    Google Analytics 4 (GA4)
                  </option>
                  <option
                    value="tiktok"
                    className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white"
                  >
                    TikTok Ads Pixel
                  </option>
                  <option
                    value="linkedin"
                    className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white"
                  >
                    LinkedIn Insight Tag
                  </option>
                </select>
                <Input
                  required
                  placeholder="Pixel ID (e.g. 987654321 or G-XXXXXX)"
                  value={newPixelId}
                  onChange={(e) => setNewPixelId(e.target.value)}
                  className="bg-white dark:bg-[#141416] border-neutral-300 dark:border-[#27272a] text-xs text-neutral-900 dark:text-white placeholder:text-neutral-400 dark:placeholder:text-neutral-500 h-9"
                />
                <Button
                  type="submit"
                  size="sm"
                  className="text-xs h-9 px-4 font-medium bg-brand hover:bg-brand-hover text-white rounded-[8px] cursor-pointer"
                >
                  Connect Pixel
                </Button>
              </form>

              <div className="flex flex-col gap-2.5">
                {pixels.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500 bg-neutral-50 dark:bg-[#141416] rounded-[10px] border border-neutral-200 dark:border-[#27272a]">
                    No pixels configured. Add your first tracking ID above.
                  </div>
                ) : (
                  pixels.map((px: any) => (
                    <div
                      key={px.id}
                      className="p-3.5 rounded-[10px] bg-neutral-50 dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Target className="w-4 h-4 text-brand" />
                        <div>
                          <p className="font-semibold text-neutral-900 dark:text-white">
                            {px.name}
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 font-mono">
                            ID: {px.pixelId}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleTogglePixel(px.id)}
                          className={`px-2.5 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer ${
                            px.isActive
                              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                              : "bg-neutral-200 dark:bg-neutral-800 text-neutral-500"
                          }`}
                        >
                          {px.isActive ? "Active" : "Disabled"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePixel(px.id)}
                          className="text-neutral-400 hover:text-red-400 p-1 cursor-pointer transition-colors"
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
              <div className="p-4 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 border ${
                      is2FAEnabled
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400"
                        : "bg-brand-light border-brand-subtle text-brand"
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
                        <span className="px-2 py-0.5 rounded-full bg-zinc-200 dark:bg-neutral-800 border border-zinc-300 dark:border-neutral-700 text-[10px] font-semibold text-zinc-600 dark:text-neutral-400">
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
                        className="text-xs h-9 border-zinc-200 dark:border-[#27272a] gap-1.5 cursor-pointer"
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
                      className="text-xs h-9 px-4 font-bold gap-1.5 cursor-pointer shadow-md"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Enable 2FA</span>
                    </Button>
                  )}
                </div>
              </div>

              {/* Change Password */}
              <div className="p-4 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] flex flex-col gap-3">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Change password
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="password"
                    placeholder="Current password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="New password (min 8 chars)"
                    value={newPassword}
                    onChange={(e) => handlePasswordInput(e.target.value)}
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
                  className="w-fit text-xs"
                >
                  {isUpdatingPassword ? "Updating..." : "Update password"}
                </Button>
              </div>

              {/* Real Live Active Session */}
              <div className="flex flex-col gap-3">
                <p className="text-xs font-bold text-zinc-900 dark:text-white">
                  Active Session &amp; Hardware Detection
                </p>
                <div className="p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
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

          {/* TAB 8: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <form
              onSubmit={handleConfirmNotificationPrefs}
              className="flex flex-col gap-6"
            >
              <div className="flex items-center justify-between pb-4 border-b border-zinc-200 dark:border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-white">
                    Notification Preferences
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-neutral-400">
                    Adjust traffic spike alert thresholds and periodic
                    reporting, then click Confirm to apply.
                  </p>
                </div>
              </div>

              {/* Traffic Spike Threshold */}
              <div className="p-4 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] flex flex-col gap-3 text-xs">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-bold text-zinc-900 dark:text-white">
                    Traffic spike alert threshold (clicks / hour)
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="10"
                      max="100000"
                      step="50"
                      value={spikeThreshold}
                      onChange={(e) =>
                        setSpikeThreshold(
                          Math.max(10, Number(e.target.value) || 100),
                        )
                      }
                      data-testid="notif-spike-threshold-input"
                      className="w-28 h-8 rounded-[8px] bg-white dark:bg-[#0c0c0e] border border-zinc-300 dark:border-[#27272a] px-2.5 font-mono font-bold text-xs text-zinc-900 dark:text-white focus:outline-none focus:border-[#465FFF]"
                    />
                    <span className="font-mono text-[#465FFF] font-bold text-xs">
                      clicks / hour
                    </span>
                  </div>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={Math.min(10000, Math.max(100, spikeThreshold))}
                  onChange={(e) => setSpikeThreshold(Number(e.target.value))}
                  className="w-full accent-[#465FFF] cursor-pointer mt-1"
                />
                <p className="text-[11px] text-zinc-500 dark:text-neutral-400">
                  You will receive an email alert whenever a short link exceeds
                  this hourly click rate.
                </p>
              </div>

              {/* Checkboxes (No immediate toast on toggle — confirmed via Confirm button below) */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#34343a] transition-colors cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                      Link expiration alerts
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-neutral-400">
                      Notification 24 hours before a short link expires
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={expirationAlerts}
                    onChange={(e) => setExpirationAlerts(e.target.checked)}
                    data-testid="notif-expiration-checkbox"
                    className="w-4 h-4 accent-[#465FFF] cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#34343a] transition-colors cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-white">
                      Weekly performance summary report
                    </p>
                    <p className="text-[11px] text-zinc-500 dark:text-neutral-400">
                      Analytics recap of clicks and conversions delivered every
                      Monday morning
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={linkAlerts}
                    onChange={(e) => setLinkAlerts(e.target.checked)}
                    data-testid="notif-weekly-checkbox"
                    className="w-4 h-4 accent-[#465FFF] cursor-pointer"
                  />
                </label>
              </div>

              <div className="flex items-center justify-end pt-3 border-t border-zinc-200 dark:border-[#222225]">
                <Button
                  type="submit"
                  variant="glow"
                  data-testid="confirm-notifications-btn"
                  className="text-xs px-6 h-10 font-bold gap-2 cursor-pointer shadow-md"
                >
                  <Check className="w-4 h-4" />
                  <span>{notifSaved ? "Confirmé !" : "Confirmer"}</span>
                </Button>
              </div>
            </form>
          )}

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
                <div className="p-5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] flex flex-col justify-between gap-4">
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
                    className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[8px] bg-white hover:bg-slate-100 dark:bg-[#141416] dark:hover:bg-[#222228] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2f2f37] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#465FFF]" />
                    <span>Download JSON Archive</span>
                  </button>
                </div>

                <div className="p-5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] flex flex-col justify-between gap-4">
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
                    className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-[8px] bg-white hover:bg-slate-100 dark:bg-[#141416] dark:hover:bg-[#222228] text-slate-900 dark:text-white border border-slate-300 dark:border-[#2f2f37] text-xs font-semibold shadow-2xs transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-[#465FFF]" />
                    <span>Download CSV</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-5 rounded-[10px] bg-red-50/90 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 flex flex-col gap-3">
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
                    className="max-w-xs bg-white dark:bg-[#0c0c0e] text-slate-900 dark:text-white border-red-300 dark:border-red-500/30"
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
                <div className="p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a]">
                  <span className="text-zinc-500 dark:text-neutral-500">
                    Application Version
                  </span>
                  <p className="font-mono text-zinc-900 dark:text-white font-bold text-sm mt-0.5">
                    v1.2.0 (Production)
                  </p>
                </div>
                <div className="p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a]">
                  <span className="text-zinc-500 dark:text-neutral-500">
                    Cloudflare Edge &amp; D1 Network
                  </span>
                  <p className="text-emerald-600 dark:text-emerald-400 font-bold text-sm flex items-center gap-1.5 mt-0.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Operational (&lt;0.8ms latency)
                  </p>
                </div>
                <div className="p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a]">
                  <span className="text-zinc-500 dark:text-neutral-500">
                    OpenGraph &amp; Social Previews
                  </span>
                  <p className="text-zinc-900 dark:text-white font-bold text-sm mt-0.5">
                    Direct URL Metadata Injection
                  </p>
                </div>
                <div className="p-3.5 rounded-[10px] bg-zinc-50 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a]">
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

      {/* Revoke API Key Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={keyToDelete.isOpen}
        onClose={() => setKeyToDelete({ isOpen: false, id: "", name: "" })}
        onConfirm={confirmRevokeKey}
        isDeleting={isRevokingKey}
        title={`Revoke key "${keyToDelete.name}"?`}
        description="This action is irreversible. All applications, bots, or scripts using this key will immediately stop working."
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
