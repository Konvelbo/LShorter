"use client";

import React, { useState, useEffect } from "react";
import {
  KeyRound,
  Plus,
  Copy,
  Check,
  Trash2,
  Code2,
  Terminal,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  BookOpen,
  RefreshCw,
  Eye,
  EyeOff,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  cfGetApiKeys,
  cfCreateApiKey,
  cfRevokeApiKey,
  cfInvalidateCache,
} from "@/lib/cloudflare-api";
import { ApiKeyItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiKeysPageSkeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/toast-provider";
import { useUndoDelete } from "@/components/ui/undo-delete-provider";
import { ApiKeyCreatedModal } from "@/components/dashboard/api-key-created-modal";
import { ApiKeyDrawer } from "@/components/dashboard/api-key-drawer";
import { CodeBlock } from "@/components/ui/code-block";
import { getPlanLimits } from "@/lib/plan-guard";
import { useI18n } from "@/components/providers/i18n-provider";

export default function ApiSdkPage() {
  const { locale, tr } = useI18n();
  const { triggerUndoDelete } = useUndoDelete();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKeyItem | null>(
    null,
  );
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<
    "create" | "track" | "analytics"
  >("create");

  const toggleRevealKey = (id: string) => {
    setRevealedKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const userId = session?.user?.id;
  const userPlan = (session?.user as any)?.plan || "FREE";

  const loadKeys = async (isBackground = false) => {
    if (!userId) return;
    if (!isBackground) setIsLoading(true);
    try {
      const userEmail = session?.user?.email || undefined;
      const res = await cfGetApiKeys(userId, userEmail);
      const rawUserPlan = (session?.user as any)?.plan || "FREE";
      const userPlan = rawUserPlan === "FREEMIUM" || rawUserPlan === "STARTER" ? "FREE" : rawUserPlan;
      const planLimits = getPlanLimits(userPlan);
      const defaultRateLimit = `${planLimits.rateLimitReqPerMin} req / min`;

      const rawKeys: ApiKeyItem[] = (res?.data || []).map((k: any) => ({
        id: k.id,
        name: k.name || "API Key",
        prefix: k.prefix || k.key_prefix || "lsh_live_...",
        rawKey: k.raw_key,
        scope: (k.scope as any) || "read_write",
        rateLimit: k.rate_limit
          ? `${k.rate_limit} req / min`
          : defaultRateLimit,
        userEmail: k.user_email || k.userEmail || k.email,
        userName:
          k.user_name ||
          k.userName ||
          k.user_full_name ||
          k.userFullName ||
          k.fullName,
        userFullName:
          k.user_full_name ||
          k.userFullName ||
          k.user_name ||
          k.userName ||
          k.fullName,
        email: k.user_email || k.userEmail || k.email,
        fullName:
          k.user_full_name ||
          k.userFullName ||
          k.user_name ||
          k.userName ||
          k.fullName,
        created_at: k.created_at || new Date().toISOString(),
      }));
      setKeys(rawKeys);
    } catch (err) {
      console.error("Error loading API keys:", err);
      if (!isBackground) setKeys([]);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && userId) {
      loadKeys();
    }
  }, [status, userId]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const promptRevokeKeyWithUndo = (key: ApiKeyItem) => {
    const label = key.name || key.prefix || tr("API Key", "Clé API");
    triggerUndoDelete({
      id: key.id,
      itemType: "api_key",
      title: tr("API Key revoked", "Clé API révoquée"),
      description: label,
      confirmText: label,
      onExecute: async () => {
        setKeys((prev) => prev.filter((k) => k.id !== key.id));
        try {
          await cfRevokeApiKey(key.id, userId);
          cfInvalidateCache("/api/keys");
        } catch {
          loadKeys();
          showToast.error(
            tr("Error revoking API key.", "Erreur lors de la révocation de la clé API.")
          );
          return false;
        }
      },
    });
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

  if (status === "loading" || isLoading) {
    return <ApiKeysPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#09090B] dark:text-white tracking-wide">
            {tr("Developer API & SDK", "API Développeur & SDK")}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-1">
            {tr(
              "Generate secure API keys (sk_live_...) and integrate URL shortening directly into your applications.",
              "Générez des clés API sécurisées (sk_live_...) et intégrez le raccourcissement d'URL directement dans vos applications."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={async () => {
              setIsRefreshing(true);
              cfInvalidateCache("/api/keys");
              await loadKeys();
              setIsRefreshing(false);
              showToast.success(tr("API keys list refreshed!", "Liste des clés API actualisée !"));
            }}
            variant="outline"
            disabled={isRefreshing}
            className="h-10 px-3.5 text-xs font-semibold gap-2 border-black/[0.08] dark:border-[#27272a] bg-white dark:bg-[#111113] hover:bg-zinc-50 dark:hover:bg-white/5 text-[#09090B] dark:text-neutral-300 hover:text-[#09090B] dark:hover:text-white cursor-pointer shadow-sm"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand" : "text-zinc-500 dark:text-neutral-400"}`}
            />
            <span>{tr("Refresh", "Actualiser")}</span>
          </Button>

          <Button
            onClick={() => setIsGenerating(true)}
            variant="glow"
            className="font-bebas text-lg tracking-wide gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus className="w-5 h-5" />
            <span>{tr("GENERATE API KEY", "GÉNÉRER UNE CLÉ API")}</span>
          </Button>
        </div>
      </div>

      {/* Key Generation Sliding Drawer */}
      <ApiKeyDrawer
        isOpen={isGenerating}
        onClose={() => setIsGenerating(false)}
        onCreated={(newKey) => {
          setNewlyCreatedKey(newKey);
          loadKeys();
        }}
        userId={userId}
        userPlan={userPlan}
        userEmail={session?.user?.email || undefined}
      />

      {/* Active API Keys List */}
      <div className="rounded-[10px] bg-white dark:bg-[#111113] text-[#09090B] dark:text-white border border-black/[0.08] dark:border-[#222225] p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#09090B] dark:text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand" />
            <span>{tr("Active API Keys", "Clés API actives")} ({keys.length})</span>
          </h3>
        </div>

        {keys.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2.5 bg-zinc-50 dark:bg-[#0c0c0e] rounded-[10px] border border-black/[0.08] dark:border-[#27272a]">
            <div className="w-10 h-10 rounded-[10px] bg-zinc-200 dark:bg-neutral-800/60 border border-zinc-300 dark:border-neutral-700/40 flex items-center justify-center text-zinc-500 dark:text-neutral-500">
              <KeyRound className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-zinc-800 dark:text-neutral-300">
              {tr("No active API keys yet", "Aucune clé API active pour le moment")}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-neutral-500 max-w-xs">
              {tr(
                'Click "Generate API Key" above to create your first developer token.',
                'Cliquez sur « Générer une clé API » ci-dessus pour créer votre premier jeton développeur.'
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {keys.map((key) => {
              const isRevealed = Boolean(revealedKeys[key.id]);
              const actualKey = key.rawKey || key.prefix;
              const displayKey = isRevealed
                ? actualKey
                : "••••••••••••••••••••••••••••••••••••••••";
              const isCopied = copiedKey === key.id;

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
              const scopeInfo = getScopeBadge(key.scope);

              return (
                <div
                  key={key.id}
                  className="p-4 rounded-[10px] bg-zinc-50 dark:bg-[#0e0e11] border border-black/[0.08] dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#38383e] transition-all flex flex-col gap-3 shadow-xs"
                >
                  {/* Key Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-[#09090B] dark:text-white">
                        {key.name}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-[6px] border text-[10px] font-semibold ${scopeInfo.color}`}
                      >
                        {scopeInfo.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-[6px] bg-zinc-200/80 dark:bg-neutral-800/70 border border-zinc-300 dark:border-neutral-700/40 text-[10px] text-zinc-600 dark:text-neutral-400 font-mono">
                        {key.rateLimit || "600 req / min"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-zinc-500 dark:text-neutral-500">
                      <span>
                        {tr("Created on", "Créée le")}{" "}
                        {new Date(key.created_at).toLocaleDateString(
                          locale === "fr" ? "fr-FR" : "en-US",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          }
                        )}
                      </span>
                      {key.lastUsedAt && (
                        <span>
                          {tr("Last used:", "Dernière utilisation :")}{" "}
                          {new Date(key.lastUsedAt).toLocaleDateString(
                            locale === "fr" ? "fr-FR" : "en-US"
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Creator / User Details (Full Name & Email) - empty if no info */}
                  {(() => {
                    const name =
                      key.userFullName || key.userName || key.fullName;
                    const email = key.userEmail || key.email;
                    if (!name && !email) return null;
                    return (
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-neutral-400 bg-zinc-100 dark:bg-[#070709] px-2.5 py-1 rounded-[6px] border border-black/[0.08] dark:border-[#1f1f23] truncate">
                        <span className="text-zinc-500 text-[10px] font-semibold shrink-0">
                          {tr("Creator:", "Créateur :")}
                        </span>
                        {name && (
                          <span className="text-zinc-800 dark:text-neutral-200 font-medium truncate">
                            {name}
                          </span>
                        )}
                        {name && email && (
                          <span className="text-zinc-400 dark:text-neutral-600">
                            ·
                          </span>
                        )}
                        {email && (
                          <span className="text-zinc-500 dark:text-neutral-400 font-mono text-[10px] truncate">
                            {email}
                          </span>
                        )}
                      </div>
                    );
                  })()}

                  {/* Key Value & Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-[8px] bg-zinc-100/90 dark:bg-[#070709] border border-black/[0.08] dark:border-[#1f1f23]">
                    <div className="flex-1 flex items-center gap-2 overflow-hidden">
                      <div className="font-mono text-xs text-brand truncate font-semibold select-all">
                        {displayKey}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {/* Toggle Mask / Unmask */}
                      <button
                        type="button"
                        onClick={() => toggleRevealKey(key.id)}
                        className="h-8 px-2.5 rounded-[6px] bg-white dark:bg-[#1a1a1e] hover:bg-zinc-100 dark:hover:bg-[#25252c] border border-black/[0.08] dark:border-[#2a2a30] text-zinc-700 dark:text-neutral-300 hover:text-[#09090B] dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title={isRevealed ? tr("Hide key", "Masquer la clé") : tr("Reveal key", "Afficher la clé")}
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-zinc-500 dark:text-neutral-400" />
                            <span className="hidden sm:inline">{tr("Hide", "Masquer")}</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-zinc-500 dark:text-neutral-400" />
                            <span className="hidden sm:inline">{tr("Reveal", "Afficher")}</span>
                          </>
                        )}
                      </button>

                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => {
                          handleCopy(actualKey);
                          setCopiedKey(key.id);
                          showToast.success(tr("API key copied to clipboard!", "Clé API copiée dans le presse-papiers !"));
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                        className="h-8 px-2.5 rounded-[6px] bg-white dark:bg-[#1a1a1e] hover:bg-zinc-100 dark:hover:bg-[#25252c] border border-black/[0.08] dark:border-[#2a2a30] text-zinc-700 dark:text-neutral-300 hover:text-[#09090B] dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
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

                      {/* Revoke Button with 10s Undo Toast */}
                      <button
                        type="button"
                        onClick={() => promptRevokeKeyWithUndo(key)}
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
                {tr("Official TypeScript SDK (npm i lshorter-api)", "SDK TypeScript officiel (npm i lshorter-api)")}
              </h3>
              <p className="text-xs text-zinc-500 dark:text-neutral-400">
                {tr("Ready-to-use implementation examples", "Exemples d'implémentation prêts à l'emploi")}
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

        {/* Code Box */}
        <CodeBlock
          code={codeSnippets[activeCodeTab]}
          language="typescript"
          filename={`sdk - ${activeCodeTab}.ts`}
          className="max-h-120 sm:max-h-120"
        />
      </div>

      {/* Newly Created Key Modal */}
      <ApiKeyCreatedModal
        isOpen={Boolean(newlyCreatedKey)}
        onClose={() => setNewlyCreatedKey(null)}
        apiKey={newlyCreatedKey}
      />

      {/* Revoke API Key Modal */}
    </div>
  );
}
