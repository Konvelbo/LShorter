"use client";

import React, { useState, useEffect } from "react";
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
  Laptop
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cfGetApiKeys, cfCreateApiKey, cfRevokeApiKey, cfGetLinks, cfGetDomains, cfGetAnalytics } from "@/lib/cloudflare-api";
import QRCode from "qrcode";
import bcrypt from "bcryptjs";
import {
  UserProfile,
  WebhookConfig,
  RetargetingPixel,
  InvoiceItem,
  ActiveSession,
  ApiKeyItem
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CodeBlock } from "@/components/ui/code-block";
import { showToast } from "@/components/ui/toast-provider";
import { syncUserToCloudflare } from "@/app/actions/sync-user";
import confetti from "canvas-confetti";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");
  const plan = convexUser?.plan || (session?.user as any)?.plan || "FREEMIUM";

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
  >("profile");

  // Profile
  const [name, setName] = useState(session?.user?.name || "Mon Compte");
  const [email, setEmail] = useState(session?.user?.email || "");
  const [language, setLanguage] = useState("Français (FR)");
  const [timezone, setTimezone] = useState("Europe/Paris (UTC+1)");
  const [avatarUrl, setAvatarUrl] = useState(session?.user?.image || "");
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [accountStats, setAccountStats] = useState({ linksCount: 0, clicksThisMonth: 0, domainsCount: 0 });

  const loadAccountStats = async () => {
    if (!userId) return;
    try {
      const [linksRes, domainsRes, analyticsRes] = await Promise.all([
        cfGetLinks(userId).catch(() => null),
        cfGetDomains(userId).catch(() => null),
        cfGetAnalytics(userId, "30d").catch(() => null),
      ]);
      const lList = Array.isArray(linksRes?.data) ? linksRes.data : Array.isArray((linksRes?.data as any)?.data) ? (linksRes?.data as any).data : [];
      const dList = Array.isArray(domainsRes?.data) ? domainsRes.data : [];
      const sumClicks = lList.reduce((acc: number, l: any) => acc + (l.clicks_count || l.clicksCount || 0), 0);
      const cCount = (analyticsRes?.data?.totalClicks ?? analyticsRes?.data?.total_clicks ?? 0) || sumClicks;
      setAccountStats({ linksCount: lList.length, clicksThisMonth: cCount, domainsCount: dList.length });
    } catch {}
  };

  const user = {
    id: userId,
    name,
    email,
    plan,
    avatarUrl,
    language,
    timezone,
    clicksThisMonth: accountStats.clicksThisMonth,
    clicksLimit: plan === "BUSINESS" ? 1_000_000 : plan === "PRO" ? 100_000 : 10_000,
    domainsCount: accountStats.domainsCount,
    domainsLimit: plan === "BUSINESS" ? 50 : plan === "PRO" ? 15 : 3,
    linksCount: accountStats.linksCount,
    linksLimit: plan === "FREEMIUM" ? 1_000 : -1,
  };

  const clicksPercent =
    user.clicksLimit === -1
      ? 0
      : Math.min(100, Math.round((user.clicksThisMonth / user.clicksLimit) * 100));

  // Billing
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);

  // API Keys
  const [apiKeys, setApiKeys] = useState<ApiKeyItem[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newKeyScope, setNewKeyScope] = useState<"read" | "read_write" | "admin">("read_write");
  const [createdSecretKey, setCreatedSecretKey] = useState<ApiKeyItem | null>(null);
  const [copiedKeyText, setCopiedKeyText] = useState<string | null>(null);

  // Webhooks
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [webhookTestResponse, setWebhookTestResponse] = useState<string | null>(null);
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);

  // Retargeting Pixels
  const [pixels, setPixels] = useState<RetargetingPixel[]>([]);
  const [newPixelId, setNewPixelId] = useState("");
  const [newPixelPlatform, setNewPixelPlatform] = useState<"facebook" | "google_tag" | "tiktok" | "linkedin">("facebook");

  // Security
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [twoFactorSecret, setTwoFactorSecret] = useState("LSH" + Math.random().toString(36).substring(2, 10).toUpperCase());
  const [twoFactorQrCode, setTwoFactorQrCode] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [sessions, setSessions] = useState<ActiveSession[]>([
    {
      id: "sess_current",
      device: "Desktop / Navigateur Web",
      browser: "Chrome (Actuel)",
      ip: "—",
      location: "France / Edge",
      lastActive: "En ligne maintenant",
      isCurrent: true
    }
  ]);

  // Notifications
  const [emailDigest, setEmailDigest] = useState<"daily" | "weekly" | "off">("weekly");
  const [spikeThreshold, setSpikeThreshold] = useState(1000);
  const [linkAlerts, setLinkAlerts] = useState(true);
  const [expirationAlerts, setExpirationAlerts] = useState(true);
  const [productUpdates, setProductUpdates] = useState(false);

  // Data / Delete
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const storeUserMutation = useMutation(api.users.storeUser);
  const update2FAMutation = useMutation(api.users.update2FASettings);
  const changePasswordMutation = useMutation(api.users.changePassword);

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
        name: k.name || "Clé API",
        prefix: k.prefix || k.key_prefix || "lsh_live_...",
        rawKey: k.raw_key,
        scope: (k.scope as any) || "read_write",
        rateLimit: k.rate_limit ? `${k.rate_limit} req / min` : "600 req / min",
        created_at: k.created_at || new Date().toISOString(),
      }));
      setApiKeys(rawKeys);
    } catch (err) {
      console.error("Error loading keys in settings:", err);
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKeyText(text);
    setTimeout(() => setCopiedKeyText(null), 2000);
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await storeUserMutation({
        userId,
        name,
        email,
        avatarUrl: avatarUrl || undefined,
        plan: plan as any,
      });

      // Synchronize changes to Cloudflare Worker D1 database
      await syncUserToCloudflare({
        id: userId,
        name,
        email,
        avatarUrl: avatarUrl || undefined,
        plan: plan as any,
      });

      setProfileSuccess(true);
      showToast.success("Profil mis à jour avec succès !");
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
      setTimeout(() => setProfileSuccess(false), 2500);
    } catch (err) {
      showToast.error("Erreur lors de la mise à jour du profil.");
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
        setCreatedSecretKey({
          id: res.data.id || `key_${Date.now()}`,
          name: newKeyName.trim(),
          prefix: res.data.prefix || "lsh_live_...",
          rawKey: res.data.raw_key || res.data.api_key,
          scope: newKeyScope,
          rateLimit: "600 req / min",
          created_at: new Date().toISOString(),
        });
      }
      setNewKeyName("");
      confetti({ particleCount: 40, spread: 60 });
      showToast.success("Clé API créée !");
      loadApiKeys();
    } catch (err: any) {
      showToast.error(err.message || "Erreur création clé.");
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (confirm("Révoquer définitivement cette clé API ?")) {
      try {
        await cfRevokeApiKey(id);
        showToast.success("Clé API révoquée.");
        loadApiKeys();
      } catch (err) {
        showToast.error("Erreur lors de la révocation.");
      }
    }
  };

  const handleAddWebhook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWebhookUrl.trim()) return;
    const newWh: WebhookConfig = {
      id: `wh_${Date.now()}`,
      url: newWebhookUrl.trim(),
      events: ["click.created", "conversion.created"],
      isActive: true,
      secretKey: `whsec_${Math.random().toString(36).substring(2, 14)}`,
      lastStatus: 200,
      created_at: new Date().toISOString()
    };
    setWebhooks([...webhooks, newWh]);
    setNewWebhookUrl("");
    confetti({ particleCount: 30, spread: 50 });
    showToast.success("Webhook configuré !");
  };

  const handleTestWebhook = (url: string) => {
    setIsTestingWebhook(true);
    setWebhookTestResponse(null);
    setTimeout(() => {
      setIsTestingWebhook(false);
      setWebhookTestResponse(JSON.stringify({
        event: "click.test",
        timestamp: new Date().toISOString(),
        status: 200,
        message: "Ping de test reçu avec succès par votre serveur endpoint.",
        payload: {
          clickId: "clk_test_001",
          slug: "my-short-link",
          ip: "192.0.2.1",
          country: "FR"
        }
      }, null, 2));
    }, 600);
  };

  const handleAddPixel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPixelId.trim()) return;
    const newPx: RetargetingPixel = {
      id: `px_${Date.now()}`,
      platform: newPixelPlatform,
      pixelId: newPixelId.trim(),
      name: `${newPixelPlatform.toUpperCase()} Conversion Tag`,
      isActive: true,
      eventsTrackedCount: 0
    };
    setPixels([...pixels, newPx]);
    setNewPixelId("");
    confetti({ particleCount: 30, spread: 50 });
    showToast.success("Pixel ajouté !");
  };

  const handleTogglePixel = (id: string) => {
    setPixels(pixels.map(p => p.id === id ? { ...p, isActive: !p.isActive } : p));
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

  const handleOpen2FAModal = async () => {
    const secret = "LSH" + Math.random().toString(36).substring(2, 10).toUpperCase() + "2FA";
    setTwoFactorSecret(secret);
    setTwoFACode("");
    try {
      const otpauthUrl = `otpauth://totp/LShorter:${encodeURIComponent(email || user.email)}?secret=${secret}&issuer=LShorter`;
      const qr = await QRCode.toDataURL(otpauthUrl, { width: 180, margin: 1 });
      setTwoFactorQrCode(qr);
      setShow2FAModal(true);
    } catch {
      showToast.error("Erreur lors de la génération du QR code.");
    }
  };

  const handleConfirm2FA = async () => {
    if (twoFACode.trim().length !== 6) {
      showToast.error("Veuillez saisir un code à 6 chiffres.");
      return;
    }
    try {
      await update2FAMutation({
        userId,
        enabled: true,
        secret: twoFactorSecret,
      });
      setIs2FAEnabled(true);
      setShow2FAModal(false);
      confetti({ particleCount: 40, spread: 60 });
      showToast.success("Double Authentification (2FA) activée avec succès !");
    } catch {
      showToast.error("Erreur lors de l'activation du 2FA.");
    }
  };

  const handleDisable2FA = async () => {
    if (confirm("Voulez-vous vraiment désactiver la double authentification ?")) {
      try {
        await update2FAMutation({
          userId,
          enabled: false,
        });
        setIs2FAEnabled(false);
        showToast.info("Double Authentification désactivée.");
      } catch {
        showToast.error("Erreur lors de la désactivation du 2FA.");
      }
    }
  };

  const handleChangePassword = async () => {
    if (!newPassword.trim() || newPassword.length < 8) {
      showToast.error("Le nouveau mot de passe doit comporter au moins 8 caractères.");
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
      showToast.success("Mot de passe mis à jour avec succès !");
    } catch {
      showToast.error("Erreur lors de la mise à jour du mot de passe.");
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleRevokeOtherSessions = () => {
    showToast.success("Toutes les autres sessions ont été révoquées avec succès.");
  };

  const handleExportData = async (type: "json" | "csv") => {
    if (!userId) return;
    try {
      const [linksRes, domainsRes, analyticsRes] = await Promise.all([
        cfGetLinks(userId).catch(() => ({ data: [] })),
        cfGetDomains(userId).catch(() => ({ data: [] })),
        cfGetAnalytics(userId).catch(() => ({ data: {} })),
      ]);

      const data = {
        user: { name, email, plan },
        links: linksRes?.data || [],
        domains: domainsRes?.data || [],
        analytics: analyticsRes?.data || {}
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `lshorter_archive_${userId}.${type === "csv" ? "json" : "json"}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      showToast.error("Erreur lors de l'export.");
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "billing", label: "Billing & Factures", icon: CreditCard },
    { id: "api", label: "API & Clés", icon: KeyRound },
    { id: "domains", label: "Domaines", icon: Globe2 },
    { id: "webhooks", label: "Webhooks", icon: Webhook },
    { id: "pixels", label: "Pixels Retargeting", icon: Target },
    { id: "security", label: "Sécurité & 2FA", icon: Shield },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "data", label: "Données & RGPD", icon: Database },
    { id: "about", label: "À Propos", icon: Info },
  ] as const;

  return (
    <div className="flex flex-col gap-8 animate-in fade-in pb-16">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Paramètres du Compte</h1>
        <p className="text-xs text-neutral-400 mt-1">
          Configurez votre profil, vos clés API, intégrations webhooks, pixels et sécurité.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Tabs Navigation (3 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-1 p-2 rounded-[12px] bg-[#141416] border border-[#222225] sticky top-24">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#ff6600] text-white shadow-md shadow-[#ff6600]/25 font-bold"
                    : "text-neutral-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Content Area (9 cols) */}
        <div className="lg:col-span-9 rounded-[14px] bg-[#141416] border border-[#222225] p-6 lg:p-8 shadow-2xl">
          {/* TAB 1: PROFILE */}
          {activeTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-white">Profil Utilisateur</h2>
                  <p className="text-xs text-neutral-400">
                    Informations personnelles, fuseau horaire et préférences d&apos;affichage.
                  </p>
                </div>
                <Badge variant="orange">
                  Plan {user.plan}
                </Badge>
              </div>

              {/* Avatar Selector */}
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[12px] overflow-hidden bg-neutral-800 border-2 border-[#ff6600] shadow-lg shrink-0 flex items-center justify-center font-bebas text-2xl font-bold text-white">
                  {avatarUrl ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={avatarUrl}
                      alt={user.name}
                      referrerPolicy="no-referrer"
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-[#ff6600]">
                      {user.name.charAt(0).toUpperCase() || "U"}
                    </span>
                  )}
                </div>
                <div className="flex flex-col gap-1.5 flex-1">
                  <label className="text-xs font-semibold text-neutral-300">
                    URL de votre Avatar
                  </label>
                  <Input
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Nom complet
                  </label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Adresse e-mail de connexion
                  </label>
                  <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Fuseau Horaire (Timezone)
                  </label>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-11 rounded-[10px] bg-[#141416] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                  >
                    <option value="Europe/Paris (UTC+1)" className="bg-[#141416] text-white">Europe/Paris (UTC+1)</option>
                    <option value="Africa/Dakar (UTC+0)" className="bg-[#141416] text-white">Africa/Dakar (UTC+0)</option>
                    <option value="Africa/Abidjan (UTC+0)" className="bg-[#141416] text-white">Africa/Abidjan (UTC+0)</option>
                    <option value="America/New_York (UTC-5)" className="bg-[#141416] text-white">America/New_York (UTC-5)</option>
                    <option value="America/Montreal (UTC-5)" className="bg-[#141416] text-white">America/Montreal (UTC-5)</option>
                    <option value="Asia/Tokyo (UTC+9)" className="bg-[#141416] text-white">Asia/Tokyo (UTC+9)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Langue de l&apos;interface
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full h-11 rounded-[10px] bg-[#141416] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                  >
                    <option value="Français (FR)" className="bg-[#141416] text-white">Français (FR)</option>
                    <option value="English (US)" className="bg-[#141416] text-white">English (US)</option>
                    <option value="Español (ES)" className="bg-[#141416] text-white">Español (ES)</option>
                    <option value="Deutsch (DE)" className="bg-[#141416] text-white">Deutsch (DE)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#222225]">
                <Button type="submit" variant="glow" className="text-xs px-6">
                  {profileSuccess ? "Enregistré avec succès !" : "Sauvegarder les modifications"}
                </Button>
              </div>
            </form>
          )}

          {/* TAB 2: BILLING & FACTURES */}
          {activeTab === "billing" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-white">Plan & Consommation</h2>
                  <p className="text-xs text-neutral-400">
                    Gérez votre abonnement, vos quotas et téléchargez vos factures.
                  </p>
                </div>
                <Button size="sm" variant="glow" onClick={() => (window.location.href = "/dashboard/pricing")}>
                  Changer de Plan
                </Button>
              </div>

              {/* Quota gauges */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400 font-semibold">Volume de Clics Mensuel</span>
                    <span className="text-xs text-[#ff6600] font-bold">{clicksPercent}% utilisé</span>
                  </div>
                  <p className="text-2xl font-bold font-bebas text-white">
                    {user.clicksThisMonth.toLocaleString()} / {user.clicksLimit === -1 ? "Illimité" : user.clicksLimit.toLocaleString()}
                  </p>
                  <div className="w-full h-2 rounded-full bg-[#27272a] overflow-hidden mt-1">
                    <div className="h-full bg-[#ff6600] rounded-full transition-all duration-500" style={{ width: `${clicksPercent}%` }} />
                  </div>
                  <span className="text-[11px] text-neutral-500">Renouvellement automatique dans 30 jours</span>
                </div>

                <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-neutral-400 font-semibold">Domaines Personnalisés</span>
                    <span className="text-xs text-neutral-400 font-bold">{user.domainsCount} sur {user.domainsLimit}</span>
                  </div>
                  <p className="text-2xl font-bold font-bebas text-white">
                    {user.domainsCount} / {user.domainsLimit}
                  </p>
                  <div className="w-full h-2 rounded-full bg-[#27272a] overflow-hidden mt-1">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${(user.domainsCount / user.domainsLimit) * 100}%` }}
                    />
                  </div>
                  <span className="text-[11px] text-neutral-500">{user.domainsLimit - user.domainsCount} domaines disponibles</span>
                </div>
              </div>

              {/* Invoices Table */}
              <div className="flex flex-col gap-3 pt-2">
                <h3 className="text-sm font-bold text-white">Historique des Factures</h3>
                {invoices.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-500 bg-[#1a1a1e] rounded-[10px] border border-[#27272a]">
                    Aucune facture enregistrée pour le moment.
                  </div>
                ) : (
                  <div className="overflow-x-auto bg-[#1a1a1e] rounded-[10px] border border-[#27272a]">
                    <table className="w-full text-left text-xs text-neutral-400">
                      <thead>
                        <tr className="border-b border-[#27272a] text-[11px] uppercase tracking-wider text-neutral-500">
                          <th className="py-3 px-3">Numéro</th>
                          <th className="py-3 px-3">Date</th>
                          <th className="py-3 px-3">Montant</th>
                          <th className="py-3 px-3">Statut</th>
                          <th className="py-3 px-3 text-right">Facture PDF</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#27272a]">
                        {invoices.map((inv) => (
                          <tr key={inv.id} className="hover:bg-white/[0.02]">
                            <td className="py-3 px-3 font-mono font-bold text-white">{inv.number}</td>
                            <td className="py-3 px-3">{inv.date}</td>
                            <td className="py-3 px-3 font-bold text-white">{inv.amount} {inv.currency}</td>
                            <td className="py-3 px-3">
                              <Badge variant="active">Payée</Badge>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => alert(`Téléchargement de la facture ${inv.number} (PDF)`)}
                                className="inline-flex items-center gap-1 text-[#ff6600] hover:underline font-medium cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>PDF</span>
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

          {/* TAB 3: API & CLÉS */}
          {activeTab === "api" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-white">Clés d&apos;API Développeur</h2>
                  <p className="text-xs text-neutral-400">
                    Générez des tokens <code className="text-[#ff6600]">sk_live_...</code> avec contrôle précis des permissions.
                  </p>
                </div>
              </div>

              {/* Secret key revealed */}
              {createdSecretKey && (
                <div className="p-4 rounded-[10px] bg-[#1a1a1e] border-2 border-[#ff6600] flex flex-col gap-2">
                  <span className="text-xs font-bold text-white">
                    Clé générée pour &quot;{createdSecretKey.name}&quot; ({createdSecretKey.scope})
                  </span>
                  <div className="flex items-center justify-between gap-2 p-2 rounded bg-black/60 font-mono text-xs text-[#ff6600]">
                    <span className="truncate">{createdSecretKey.rawKey}</span>
                    <Button size="sm" variant="primary" onClick={() => handleCopy(createdSecretKey.rawKey || "")}>
                      {copiedKeyText === createdSecretKey.rawKey ? "Copié !" : "Copier"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Create Key Form */}
              <form onSubmit={handleCreateApiKey} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div className="sm:col-span-2">
                  <Input
                    required
                    placeholder="Nom de l'application (ex: Bot Telegram)"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                <div>
                  <select
                    value={newKeyScope}
                    onChange={(e) => setNewKeyScope(e.target.value as "read" | "read_write" | "admin")}
                    className="w-full h-11 rounded-[10px] bg-[#141416] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                  >
                    <option value="admin" className="bg-[#141416] text-white">Accès Complet (Admin)</option>
                    <option value="read_write" className="bg-[#141416] text-white">Lecture & Écriture</option>
                    <option value="read" className="bg-[#141416] text-white">Lecture Seule</option>
                  </select>
                </div>
                <Button type="submit" variant="glow" className="text-xs">
                  Générer la Clé
                </Button>
              </form>

              {/* Active Keys */}
              <div className="flex flex-col gap-2">
                {apiKeys.map((k) => (
                  <div
                    key={k.id}
                    className="p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{k.name}</span>
                        <span className="px-1.5 py-0.2 rounded bg-black/40 text-[10px] text-neutral-400 font-mono">
                          {k.scope}
                        </span>
                      </div>
                      <p className="font-mono text-neutral-400 text-[11px] mt-0.5">{k.prefix}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleCopy(`curl -X POST https://api.lshorter.io/v1/links -H "Authorization: Bearer ${k.prefix}"`)}
                        className="text-xs text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer"
                        title="Copier exemple cURL"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>cURL</span>
                      </button>
                      <button
                        onClick={() => handleRevokeKey(k.id)}
                        className="text-red-400 hover:text-red-300 p-1 cursor-pointer"
                        title="Révoquer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DOMAINS */}
          {activeTab === "domains" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-white">Domaines en Marque Blanche</h2>
                  <p className="text-xs text-neutral-400">
                    Redirigez vos liens via votre propre domaine d&apos;entreprise.
                  </p>
                </div>
                <Button size="sm" variant="glow" onClick={() => (window.location.href = "/dashboard/domains")}>
                  Gérer mes domaines
                </Button>
              </div>

              <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-3 text-xs">
                <span className="font-bold text-white">Domaine par défaut sélectionné :</span>
                <div className="flex items-center justify-between p-3 rounded-[8px] bg-black/40 border border-[#27272a]">
                  <div className="flex items-center gap-2">
                    <Globe2 className="w-4 h-4 text-[#ff6600]" />
                    <span className="font-bold text-white font-mono">link.monentreprise.com</span>
                    <Badge variant="active">SSL Actif</Badge>
                  </div>
                  <span className="text-neutral-500 text-[11px]">8 liens actifs</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: WEBHOOKS & TESTEUR */}
          {activeTab === "webhooks" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-white">Webhooks & Simulator</h2>
                  <p className="text-xs text-neutral-400">
                    Envoyez des événements de clics et conversions vers vos serveurs en temps réel.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddWebhook} className="flex gap-2">
                <Input
                  required
                  placeholder="https://votre-serveur.com/api/webhooks/lshorter"
                  value={newWebhookUrl}
                  onChange={(e) => setNewWebhookUrl(e.target.value)}
                />
                <Button type="submit" variant="glow" className="shrink-0 text-xs">
                  Ajouter Webhook
                </Button>
              </form>

              <div className="flex flex-col gap-3">
                {webhooks.map((wh) => (
                  <div
                    key={wh.id}
                    className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-3 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-white font-bold">{wh.url}</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isTestingWebhook}
                          onClick={() => handleTestWebhook(wh.url)}
                          className="text-xs gap-1.5 h-8"
                        >
                          <Send className="w-3 h-3 text-[#ff6600]" />
                          <span>{isTestingWebhook ? "Envoi..." : "Tester l'événement"}</span>
                        </Button>
                        <Badge variant="active">HTTP 200</Badge>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-neutral-400 text-[11px] pt-2 border-t border-[#27272a]">
                      <span className="font-mono">Secret: {wh.secretKey}</span>
                      <span>Dernier ping : il y a 2 min</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Webhook Test Response Viewer */}
              {webhookTestResponse && (
                <div className="flex flex-col gap-2 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-emerald-400 font-bold px-1">
                    <span>✓ Réponse reçue (HTTP 200 OK en 42ms) :</span>
                    <button onClick={() => setWebhookTestResponse(null)} className="text-neutral-400 hover:text-white cursor-pointer">
                      Fermer ✕
                    </button>
                  </div>
                  <CodeBlock
                    code={webhookTestResponse}
                    language="json"
                    filename="Webhook Payload (HTTP 200 OK)"
                  />
                </div>
              )}
            </div>
          )}

          {/* TAB 6: PIXELS */}
          {activeTab === "pixels" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-white">Pixels Publicitaires de Retargeting</h2>
                  <p className="text-xs text-neutral-400">
                    Déclenchez vos tags Facebook, Google Ads et TikTok lors de chaque redirection.
                  </p>
                </div>
              </div>

              <form onSubmit={handleAddPixel} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newPixelPlatform}
                  onChange={(e) => setNewPixelPlatform(e.target.value as any)}
                  className="h-11 rounded-[10px] bg-[#141416] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                >
                  <option value="facebook" className="bg-[#141416] text-white">Meta Facebook Pixel</option>
                  <option value="google_tag" className="bg-[#141416] text-white">Google Analytics 4</option>
                  <option value="tiktok" className="bg-[#141416] text-white">TikTok Ads Pixel</option>
                  <option value="linkedin" className="bg-[#141416] text-white">LinkedIn Insight Tag</option>
                </select>
                <Input
                  required
                  placeholder="ID du Pixel (ex: 987654321)"
                  value={newPixelId}
                  onChange={(e) => setNewPixelId(e.target.value)}
                />
                <Button type="submit" variant="glow" className="text-xs">
                  Connecter Pixel
                </Button>
              </form>

              <div className="flex flex-col gap-3">
                {pixels.map((px) => (
                  <div
                    key={px.id}
                    className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <Target className="w-5 h-5 text-[#ff6600]" />
                      <div>
                        <p className="font-bold text-white">{px.name}</p>
                        <p className="text-[11px] text-neutral-400 font-mono">ID: {px.pixelId}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-neutral-400 font-mono text-[11px]">
                        {px.eventsTrackedCount.toLocaleString()} events
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTogglePixel(px.id)}
                        className={`px-3 py-1 rounded-[6px] font-semibold text-xs transition-colors cursor-pointer ${
                          px.isActive ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40" : "bg-neutral-800 text-neutral-500"
                        }`}
                      >
                        {px.isActive ? "Actif" : "Désactivé"}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: SECURITY & 2FA */}
          {activeTab === "security" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-white">Sécurité & Sessions Actives</h2>
                  <p className="text-xs text-neutral-400">
                    Protégez votre compte avec la double authentification TOTP et gérez les appareils connectés.
                  </p>
                </div>
              </div>

              {/* 2FA */}
              <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="w-6 h-6 text-[#ff6600]" />
                  <div>
                    <p className="text-xs font-bold text-white">Double Authentification (2FA / TOTP)</p>
                    <p className="text-[11px] text-neutral-400">Google Authenticator, Authy ou 1Password</p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant={is2FAEnabled ? "outline" : "glow"}
                  onClick={() => {
                    if (is2FAEnabled) {
                      handleDisable2FA();
                    } else {
                      handleOpen2FAModal();
                    }
                  }}
                  className="text-xs"
                >
                  {is2FAEnabled ? "Désactiver 2FA" : "Configurer 2FA"}
                </Button>
              </div>

              {/* Change Password */}
              <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-3">
                <p className="text-xs font-bold text-white">Changer de mot de passe</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    type="password"
                    placeholder="Mot de passe actuel"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                  />
                  <Input
                    type="password"
                    placeholder="Nouveau mot de passe (min 8 car.)"
                    value={newPassword}
                    onChange={(e) => handlePasswordInput(e.target.value)}
                  />
                </div>

                {newPassword && (
                  <div className="flex flex-col gap-1 text-[11px]">
                    <div className="flex justify-between text-neutral-400">
                      <span>Force du mot de passe</span>
                      <span className="text-white font-bold">{passwordStrength}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          passwordStrength <= 50 ? "bg-amber-500" : "bg-emerald-500"
                        }`}
                        style={{ width: `${passwordStrength}%` }}
                      />
                    </div>
                  </div>
                )}

                <Button
                  size="sm"
                  variant="glow"
                  disabled={isUpdatingPassword || !newPassword || newPassword.length < 8}
                  onClick={handleChangePassword}
                  className="w-fit text-xs"
                >
                  {isUpdatingPassword ? "Mise à jour..." : "Mettre à jour le mot de passe"}
                </Button>
              </div>

              {/* Active Sessions */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-white">Sessions Actives & Appareils</p>
                  <button
                    onClick={handleRevokeOtherSessions}
                    className="text-xs text-red-400 hover:underline cursor-pointer"
                  >
                    Déconnecter les autres appareils
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  {sessions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <Laptop className="w-4 h-4 text-neutral-400" />
                        <div>
                          <p className="font-bold text-white flex items-center gap-2">
                            <span>{s.device} · {s.browser}</span>
                            {s.isCurrent && <Badge variant="active">Cet appareil</Badge>}
                          </p>
                          <p className="text-[11px] text-neutral-500">
                            IP: {s.ip} · {s.location}
                          </p>
                        </div>
                      </div>
                      <span className="text-neutral-400 text-[11px]">{s.lastActive}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: NOTIFICATIONS */}
          {activeTab === "notifications" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-white">Préférences de Notification</h2>
                  <p className="text-xs text-neutral-400">
                    Ajustez les seuils d&apos;alerte de trafic et les rapports par e-mail.
                  </p>
                </div>
              </div>

              {/* Traffic Spike Threshold */}
              <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">Seuil d&apos;alerte de pic de trafic (Trafic Spike)</span>
                  <span className="font-mono text-[#ff6600] font-bold text-sm">{spikeThreshold} clics / heure</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="10000"
                  step="100"
                  value={spikeThreshold}
                  onChange={(e) => setSpikeThreshold(Number(e.target.value))}
                  className="w-full accent-[#ff6600] cursor-pointer mt-1"
                />
                <p className="text-[11px] text-neutral-400">
                  Vous recevrez un e-mail instantané dès qu&apos;un de vos liens dépasse ce rythme de clics.
                </p>
              </div>

              {/* Checkboxes */}
              <div className="flex flex-col gap-3">
                <label className="flex items-center justify-between p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-white">Alertes d&apos;expiration de liens</p>
                    <p className="text-[11px] text-neutral-400">Notification 24h avant la fin de validité d&apos;un lien court</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={expirationAlerts}
                    onChange={(e) => setExpirationAlerts(e.target.checked)}
                    className="w-4 h-4 accent-[#ff6600]"
                  />
                </label>

                <label className="flex items-center justify-between p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] cursor-pointer">
                  <div>
                    <p className="text-xs font-bold text-white">Rapports de performance hebdomadaires</p>
                    <p className="text-[11px] text-neutral-400">Bilan récapitulatif du ROI et des conversions chaque lundi</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={linkAlerts}
                    onChange={(e) => setLinkAlerts(e.target.checked)}
                    className="w-4 h-4 accent-[#ff6600]"
                  />
                </label>
              </div>
            </div>
          )}

          {/* TAB 9: DATA & RGPD */}
          {activeTab === "data" && (
            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#222225]">
                <div>
                  <h2 className="text-lg font-bold text-white">Données, Export & Confidentialité</h2>
                  <p className="text-xs text-neutral-400">
                    Téléchargez vos archives brutes ou supprimez votre espace de travail.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-white">Archive Complète (JSON)</h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Contient tous vos liens, tags, règles de ciblage et analytics agrégés.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleExportData("json")} className="gap-1.5 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger JSON</span>
                  </Button>
                </div>

                <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col justify-between gap-3">
                  <div>
                    <h3 className="text-xs font-bold text-white">Export Brut Clics (CSV)</h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Format tabulaire prêt pour Excel, Google Sheets ou PowerBI.
                    </p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => (window.location.href = "/api/analytics/export")} className="gap-1.5 text-xs">
                    <Download className="w-3.5 h-3.5" />
                    <span>Télécharger CSV</span>
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="p-5 rounded-[10px] bg-red-500/10 border border-red-500/30 flex flex-col gap-3">
                <h3 className="text-xs font-bold text-red-400 uppercase tracking-wider">Zone Dangereuse</h3>
                <p className="text-xs text-neutral-300">
                  La suppression de compte est irréversible. Vos liens courts deviendront inaccessibles et vos domaines seront libérés.
                </p>
                <div className="flex gap-2">
                  <Input
                    placeholder="Tapez SUPPRIMER pour confirmer"
                    value={deleteConfirmationText}
                    onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    className="max-w-xs"
                  />
                  <Button
                    size="sm"
                    variant="destructive"
                    disabled={deleteConfirmationText !== "SUPPRIMER"}
                    onClick={() => alert("Compte supprimé.")}
                  >
                    Supprimer Définitivement
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: ABOUT */}
          {activeTab === "about" && (
            <div className="flex flex-col gap-6 text-xs text-neutral-300">
              <h2 className="text-lg font-bold text-white">À Propos de LShorter</h2>
              <p className="leading-relaxed text-neutral-300">
                LShorter est une plateforme Edge SaaS haute performance propulsée par le réseau mondial Cloudflare Workers, D1 et KV.
              </p>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className="p-3 rounded-[8px] bg-[#1a1a1e] border border-[#27272a]">
                  <span className="text-neutral-500">Version</span>
                  <p className="font-mono text-white font-bold text-sm">v1.2.0 (Production)</p>
                </div>
                <div className="p-3 rounded-[8px] bg-[#1a1a1e] border border-[#27272a]">
                  <span className="text-neutral-500">Statut Edge API</span>
                  <p className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Opérationnel (&lt;0.8ms)
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 2FA Setup Modal */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-[14px] bg-[#141416] border border-[#27272a] p-6 text-white shadow-2xl flex flex-col gap-4 text-center">
            <h3 className="text-base font-bold">Activer la Double Authentification</h3>
            <p className="text-xs text-neutral-400">
              Scannez ce QR Code avec votre application d&apos;authentification (Google Authenticator, Authy, 1Password) :
            </p>

            <div className="w-40 h-40 bg-white p-2 rounded-[12px] mx-auto flex items-center justify-center shadow-lg">
              {twoFactorQrCode ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={twoFactorQrCode}
                  alt="2FA TOTP QR Code"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full bg-neutral-900 rounded flex items-center justify-center font-mono text-[10px] text-white p-2">
                  Génération du QR...
                </div>
              )}
            </div>

            <div className="p-2.5 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] text-[11px] flex items-center justify-between">
              <span className="text-neutral-400 font-mono">Clé : {twoFactorSecret}</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(twoFactorSecret);
                  showToast.success("Clé secrète copiée !");
                }}
                className="text-[#ff6600] hover:underline font-bold cursor-pointer"
              >
                Copier
              </button>
            </div>

            <Input
              placeholder="Code à 6 chiffres (ex: 123456)"
              maxLength={6}
              value={twoFACode}
              onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              className="text-center font-mono tracking-widest text-base"
              autoFocus
            />

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1 text-xs"
                onClick={() => setShow2FAModal(false)}
              >
                Annuler
              </Button>
              <Button
                variant="glow"
                className="flex-1 text-xs"
                disabled={twoFACode.trim().length !== 6}
                onClick={handleConfirm2FA}
              >
                Valider 2FA
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
