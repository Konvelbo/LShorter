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
import confetti from "canvas-confetti";

export default function ApiSdkPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [keyNameInput, setKeyNameInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKeyItem | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<"create" | "track" | "analytics">("create");

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
        scope: "read_write",
      });

      if (res?.data) {
        setNewlyCreatedKey({
          id: res.data.id || `key_${Date.now()}`,
          name: keyNameInput.trim(),
          prefix: res.data.prefix || "lsh_live_...",
          rawKey: res.data.raw_key || res.data.api_key,
          scope: "read_write",
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

      {/* Secret Key Modal Banner if just created */}
      {newlyCreatedKey && (
        <div className="p-6 rounded-[12px] bg-[#141416] border-2 border-[#ff6600] shadow-2xl flex flex-col gap-3 animate-in zoom-in-95">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Clé API générée avec succès pour &quot;{newlyCreatedKey.name}&quot;</span>
            </h3>
            <button
              onClick={() => setNewlyCreatedKey(null)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Fermer ✕
            </button>
          </div>

          <p className="text-xs text-neutral-300">
            ⚠️ <strong>Attention :</strong> Cette clé secrète ne sera affichée qu&apos;une seule fois. Copiez-la et stockez-la en lieu sûr dès maintenant.
          </p>

          <div className="flex items-center justify-between gap-2 p-3 rounded-[10px] bg-black/60 border border-[#27272a]">
            <span className="font-mono text-xs text-[#ff6600] truncate">
              {newlyCreatedKey.rawKey}
            </span>
            <Button
              size="sm"
              variant="primary"
              onClick={() => handleCopy(newlyCreatedKey.rawKey || "")}
              className="shrink-0 text-xs"
            >
              {copiedKey === newlyCreatedKey.rawKey ? "Copié !" : "Copier la clé"}
            </Button>
          </div>
        </div>
      )}

      {/* Key Generation Drawer */}
      {isGenerating && (
        <form
          onSubmit={handleCreateKey}
          className="p-6 rounded-[12px] bg-[#141416] border border-[#27272a] shadow-xl flex flex-col gap-4 animate-in fade-in"
        >
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#ff6600]" />
            <span>Nommer la nouvelle clé API</span>
          </h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              required
              placeholder="ex: Production Backend Worker"
              value={keyNameInput}
              onChange={(e) => setKeyNameInput(e.target.value)}
            />
            <Button type="submit" variant="glow" className="shrink-0 px-6">
              Créer la clé
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGenerating(false)}
              className="shrink-0"
            >
              Annuler
            </Button>
          </div>
        </form>
      )}

      {/* Active API Keys List */}
      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-5 shadow-xl">
        <h3 className="text-base font-bold text-white mb-4">Clés API Actives</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-400">
            <thead>
              <tr className="border-b border-[#222225] text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
                <th className="pb-3 pl-2">Nom de la Clé</th>
                <th className="pb-3">Préfixe de Clé</th>
                <th className="pb-3">Date de création</th>
                <th className="pb-3">Dernière utilisation</th>
                <th className="pb-3 text-right pr-2">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222225]">
              {keys.map((key) => (
                <tr key={key.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3.5 pl-2 font-bold text-white">{key.name}</td>
                  <td className="py-3.5 font-mono text-neutral-300">{key.prefix}</td>
                  <td className="py-3.5 text-neutral-400">
                    {new Date(key.created_at).toLocaleDateString("fr-FR")}
                  </td>
                  <td className="py-3.5 text-neutral-400">
                    {key.lastUsedAt
                      ? new Date(key.lastUsedAt).toLocaleDateString("fr-FR")
                      : "Jamais"}
                  </td>
                  <td className="py-3.5 text-right pr-2">
                    <button
                      onClick={() => promptRevokeKey(key)}
                      className="p-1.5 rounded-[6px] hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
                      title="Révoquer la clé"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* TypeScript SDK Code Preview Section */}
      <div className="rounded-[14px] bg-[#141416] border border-[#222225] p-6 lg:p-8 flex flex-col gap-5 shadow-2xl">
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
              className={`px-3 py-1.5 rounded-[8px] font-medium transition-colors cursor-pointer ${
                activeCodeTab === "create"
                  ? "bg-[#ff6600] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Créer un Lien
            </button>
            <button
              onClick={() => setActiveCodeTab("track")}
              className={`px-3 py-1.5 rounded-[8px] font-medium transition-colors cursor-pointer ${
                activeCodeTab === "track"
                  ? "bg-[#ff6600] text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              Track Conversion
            </button>
            <button
              onClick={() => setActiveCodeTab("analytics")}
              className={`px-3 py-1.5 rounded-[8px] font-medium transition-colors cursor-pointer ${
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
        <div className="relative rounded-[10px] bg-[#09090b] border border-[#27272a] p-4 font-mono text-xs text-neutral-200 overflow-x-auto">
          <button
            onClick={() => handleCopy(codeSnippets[activeCodeTab])}
            className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-[6px] bg-white/10 hover:bg-white/20 text-white text-[11px] transition-colors cursor-pointer"
          >
            {copiedKey === codeSnippets[activeCodeTab] ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier</span>
              </>
            )}
          </button>
          <pre className="pt-2 leading-relaxed">{codeSnippets[activeCodeTab]}</pre>
        </div>
      </div>

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
