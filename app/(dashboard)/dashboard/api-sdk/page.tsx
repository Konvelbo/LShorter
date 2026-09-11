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
import { cfGetApiKeys, cfCreateApiKey, cfRevokeApiKey, cfInvalidateCache } from "@/lib/cloudflare-api";
import { ApiKeyItem } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiKeysPageSkeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/toast-provider";
import { DeleteConfirmModal } from "@/components/dashboard/delete-confirm-modal";
import { ApiKeyCreatedModal } from "@/components/dashboard/api-key-created-modal";
import { CodeBlock } from "@/components/ui/code-block";
import confetti from "canvas-confetti";

export default function ApiSdkPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [keyNameInput, setKeyNameInput] = useState("");
  const [keyScopeInput, setKeyScopeInput] = useState<"read" | "read_write" | "admin">("read_write");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKeyItem | null>(null);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<"create" | "track" | "analytics">("create");

  const toggleRevealKey = (id: string) => {
    setRevealedKeys((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const userId = session?.user?.id;

  const loadKeys = async (isBackground = false) => {
    if (!userId) return;
    if (!isBackground) setIsLoading(true);
    try {
      const res = await cfGetApiKeys(userId);
      const userPlan = (session?.user as any)?.plan || "FREEMIUM";
      const isProOrBusiness = userPlan === "PRO" || userPlan === "BUSINESS";
      const defaultRateLimit = isProOrBusiness ? "Illimité (Débit Max)" : "1 000 req / min";

      const rawKeys: ApiKeyItem[] = (res?.data || []).map((k: any) => ({
        id: k.id,
        name: k.name || "Clé API",
        prefix: k.prefix || k.key_prefix || "lsh_live_...",
        rawKey: k.raw_key,
        scope: (k.scope as any) || "read_write",
        rateLimit: k.rate_limit ? `${k.rate_limit} req / min` : defaultRateLimit,
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

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyNameInput.trim() || !userId) return;

    try {
      const res = await cfCreateApiKey({
        userId,
        name: keyNameInput.trim(),
        scope: keyScopeInput,
      });

      if (res?.data) {
        setNewlyCreatedKey({
          id: res.data.id || `key_${Date.now()}`,
          name: keyNameInput.trim(),
          prefix: res.data.prefix || res.data.key_prefix || "lsh_live_...",
          rawKey: res.data.raw_key || res.data.rawKey || res.data.api_key,
          scope: keyScopeInput,
          rateLimit: "600 req / min",
          created_at: new Date().toISOString(),
        });
      }

      setKeyNameInput("");
      setIsGenerating(false);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      showToast.success("Clé API générée avec succès !");
      loadKeys();
    } catch (err: any) {
      showToast.error(err.message || "Erreur lors de la création de la clé API.");
    }
  };

  // Revoke modal state
  const [deleteTarget, setDeleteTarget] = useState<{ isOpen: boolean; id: string; name: string }>({
    isOpen: false,
    id: "",
    name: "",
  });
  const [isRevoking, setIsRevoking] = useState(false);

  const promptRevokeKey = (key: ApiKeyItem) => {
    setDeleteTarget({
      isOpen: true,
      id: key.id,
      name: key.name,
    });
  };

  const confirmRevokeKey = async () => {
    if (!deleteTarget.id) return;
    setIsRevoking(true);
    try {
      await cfRevokeApiKey(deleteTarget.id);
      cfInvalidateCache("/api/keys");
      showToast.success("Clé API révoquée.");
      setDeleteTarget({ isOpen: false, id: "", name: "" });
      loadKeys();
    } catch (err) {
      showToast.error("Erreur lors de la révocation de la clé API.");
    } finally {
      setIsRevoking(false);
    }
  };

  const codeSnippets = {
    create: `import { LShorter } from "@lshorter/sdk";

const qk = new LShorter({
  apiKey: "sk_live_votre_cle_api_ici",
});

// Création d'un lien avec ciblage intelligent
const link = await qk.links.create({
  targetUrl: "https://votre-boutique.com/produit",
  slug: "promo-ete",
  geoTargeting: {
    FR: "https://votre-boutique.fr/promo",
    US: "https://votre-boutique.com/us-promo",
  },
  deviceTargeting: {
    ios: "https://apps.apple.com/app/...",
    android: "https://play.google.com/store/apps/...",
  },
});

console.log("Lien court :", link.shortUrl);
console.log("QR Code (DataURL) :", link.qrCode);`,

    track: `import { LShorter } from "@lshorter/sdk";

const qk = new LShorter({ apiKey: "sk_live_..." });

// Remontez une conversion/vente lors du paiement
await qk.track.conversion({
  eventName: "purchase",
  amount: 49.0,
  currency: "EUR",
  linkId: "link_01",
  clickId: "clk_abc123", // Capturé lors de la visite
  customer: {
    email: "client@exemple.com",
    name: "Jean Dupont"
  }
});`,

    analytics: `import { LShorter } from "@lshorter/sdk";

const qk = new LShorter({ apiKey: "sk_live_..." });

// Récupération des analytics et des top pays
const stats = await qk.analytics.dashboard({ linkId: "link_01" });
console.log("Clics totaux :", stats.clicks.total);
console.log("Revenus trackés :", stats.conversions[0].revenue);

const topAudience = await qk.analytics.top();
console.log("Top Pays :", topAudience.topCountries);`
  };

  if (status === "loading" || isLoading) {
    return <ApiKeysPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">API & SDK Développeur</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Générez des clés API sécurisées (sk_live_...) et intégrez la réduction de liens dans vos applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={async () => {
              setIsRefreshing(true);
              cfInvalidateCache("/api/keys");
              await loadKeys();
              setIsRefreshing(false);
              showToast.success("Liste des clés API actualisée !");
            }}
            variant="outline"
            disabled={isRefreshing}
            className="h-10 px-3.5 text-xs font-semibold gap-2 border-[#27272a] bg-[#141416] hover:bg-white/5 text-neutral-300 hover:text-white cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#ff6600]" : "text-neutral-400"}`} />
            <span>Actualiser</span>
          </Button>

          <Button
            onClick={() => setIsGenerating(!isGenerating)}
            variant="glow"
            className="font-bebas text-lg tracking-wide gap-1.5 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>GÉNÉRER UNE CLÉ API</span>
          </Button>
        </div>
      </div>

      {/* Key Generation Drawer */}
      {isGenerating && (
        <form
          onSubmit={handleCreateKey}
          className="p-6 rounded-[10px] bg-[#141416] border border-[#27272a] shadow-xl flex flex-col gap-4 animate-in fade-in"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <KeyRound className="w-4 h-4 text-[#ff6600]" />
              <span>Générer une nouvelle clé API</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsGenerating(false)}
              className="text-xs text-neutral-400 hover:text-white cursor-pointer"
            >
              Fermer ✕
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <Input
                required
                placeholder="Nom de l'application (ex: Bot Telegram, Zapier, Backend Worker...)"
                value={keyNameInput}
                onChange={(e) => setKeyNameInput(e.target.value)}
                className="h-10 text-xs bg-[#0c0c0e] border-[#27272a]"
              />
            </div>
            <div className="w-full sm:w-56 shrink-0">
              <select
                value={keyScopeInput}
                onChange={(e) => setKeyScopeInput(e.target.value as "read" | "read_write" | "admin")}
                className="w-full h-10 rounded-[10px] bg-[#0c0c0e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
              >
                <option value="read_write" className="bg-[#141416] text-white">Lecture & Écriture</option>
                <option value="admin" className="bg-[#141416] text-white">Accès Complet (Admin)</option>
                <option value="read" className="bg-[#141416] text-white">Lecture Seule</option>
              </select>
            </div>
            <Button type="submit" variant="glow" className="shrink-0 h-10 px-6 text-xs font-bold gap-1.5 cursor-pointer shadow-md">
              <Plus className="w-4 h-4" />
              <span>Créer la clé</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGenerating(false)}
              className="shrink-0 h-10 px-4 text-xs font-semibold border-[#27272a] cursor-pointer"
            >
              Annuler
            </Button>
          </div>
        </form>
      )}

      {/* Active API Keys List */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 shadow-xl flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#ff6600]" />
            <span>Clés API Actives ({keys.length})</span>
          </h3>
        </div>

        {keys.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2.5 bg-[#0c0c0e] rounded-[10px] border border-[#27272a]">
            <div className="w-10 h-10 rounded-[10px] bg-neutral-800/60 border border-neutral-700/40 flex items-center justify-center text-neutral-500">
              <KeyRound className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-neutral-300">Aucune clé API active pour le moment</p>
            <p className="text-[11px] text-neutral-500 max-w-xs">
              Cliquez sur &quot;Générer une clé API&quot; ci-dessus pour créer votre premier jeton développeur.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {keys.map((key) => {
              const isRevealed = Boolean(revealedKeys[key.id]);
              const actualKey = key.rawKey || key.prefix;
              const displayKey = isRevealed ? actualKey : "••••••••••••••••••••••••••••••••••••••••";
              const isCopied = copiedKey === key.id;

              const getScopeBadge = (scope?: string) => {
                if (scope === "admin") return { label: "Admin", color: "bg-red-500/10 text-red-400 border-red-500/20" };
                if (scope === "read") return { label: "Lecture Seule", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" };
                return { label: "Lecture & Écriture", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" };
              };
              const scopeInfo = getScopeBadge(key.scope);

              return (
                <div
                  key={key.id}
                  className="p-4 rounded-[10px] bg-[#0e0e11] border border-[#27272a] hover:border-[#38383e] transition-all flex flex-col gap-3 shadow-sm"
                >
                  {/* Key Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-white">{key.name}</span>
                      <span className={`px-2 py-0.5 rounded-[6px] border text-[10px] font-semibold ${scopeInfo.color}`}>
                        {scopeInfo.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-[6px] bg-neutral-800/70 border border-neutral-700/40 text-[10px] text-neutral-400 font-mono">
                        {key.rateLimit || "600 req / min"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-neutral-500">
                      <span>Créée le {new Date(key.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {key.lastUsedAt && (
                        <span>Dernier accès : {new Date(key.lastUsedAt).toLocaleDateString("fr-FR")}</span>
                      )}
                    </div>
                  </div>

                  {/* Key Value & Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-[8px] bg-[#070709] border border-[#1f1f23]">
                    <div className="flex-1 flex items-center gap-2 overflow-hidden">
                      <div className="font-mono text-xs text-[#ff6600] truncate font-semibold select-all">
                        {displayKey}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                      {/* Toggle Mask / Unmask */}
                      <button
                        type="button"
                        onClick={() => toggleRevealKey(key.id)}
                        className="h-8 px-2.5 rounded-[6px] bg-[#1a1a1e] hover:bg-[#25252c] border border-[#2a2a30] text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title={isRevealed ? "Masquer la clé" : "Démasquer la clé"}
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="hidden sm:inline">Masquer</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-neutral-400" />
                            <span className="hidden sm:inline">Démasquer</span>
                          </>
                        )}
                      </button>

                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => {
                          handleCopy(actualKey);
                          setCopiedKey(key.id);
                          showToast.success("Clé API copiée dans le presse-papier !");
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                        className="h-8 px-2.5 rounded-[6px] bg-[#1a1a1e] hover:bg-[#25252c] border border-[#2a2a30] text-neutral-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copier la clé"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Copié</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-neutral-400" />
                            <span>Copier</span>
                          </>
                        )}
                      </button>

                      {/* Revoke Button */}
                      <button
                        type="button"
                        onClick={() => promptRevokeKey(key)}
                        className="h-8 w-8 rounded-[6px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                        title="Révoquer cette clé"
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
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-6 lg:p-8 flex flex-col gap-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#3178c6]/20 border border-[#3178c6]/40 flex items-center justify-center text-[#3178c6]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">SDK TypeScript Officiel (@lshorter/sdk)</h3>
              <p className="text-xs text-neutral-400">Exemples d&apos;implémentation prêts à l&apos;emploi</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] text-xs">
            <button
              onClick={() => setActiveCodeTab("create")}
              className={`px-3 py-1.5 rounded-[10px] font-medium transition-colors cursor-pointer ${
                activeCodeTab === "create"
                  ? "bg-[#ff6600] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Créer un Lien
            </button>
            <button
              onClick={() => setActiveCodeTab("track")}
              className={`px-3 py-1.5 rounded-[10px] font-medium transition-colors cursor-pointer ${
                activeCodeTab === "track"
                  ? "bg-[#ff6600] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Track Conversion
            </button>
            <button
              onClick={() => setActiveCodeTab("analytics")}
              className={`px-3 py-1.5 rounded-[10px] font-medium transition-colors cursor-pointer ${
                activeCodeTab === "analytics"
                  ? "bg-[#ff6600] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* Code Box */}
        <CodeBlock
          code={codeSnippets[activeCodeTab]}
          language="bash"
          filename={`curl - ${activeCodeTab}`}
        />
      </div>

      {/* Newly Created Key Modal */}
      <ApiKeyCreatedModal
        isOpen={Boolean(newlyCreatedKey)}
        onClose={() => setNewlyCreatedKey(null)}
        apiKey={newlyCreatedKey}
      />

      {/* Revoke API Key Modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget({ isOpen: false, id: "", name: "" })}
        onConfirm={confirmRevokeKey}
        title="Révoquer cette clé API ?"
        description={`La clé "${deleteTarget.name}" sera invalidée immédiatement. Toutes les applications utilisant ce token perdront l'accès aux API.`}
        itemLabels={deleteTarget.name ? [deleteTarget.name] : []}
        isDeleting={isRevoking}
      />
    </div>
  );
}
