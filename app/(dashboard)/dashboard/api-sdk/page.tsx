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
  const [activeCodeTab, setActiveCodeTab] = useState<"create" | "track" | "analytics" | "profile">("create");

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
      const defaultRateLimit = isProOrBusiness ? "Unlimited (Max Throughput)" : "1,000 req / min";

      const rawKeys: ApiKeyItem[] = (res?.data || []).map((k: any) => ({
        id: k.id,
        name: k.name || "API Key",
        prefix: k.prefix || k.key_prefix || "lsh_live_...",
        rawKey: k.raw_key,
        scope: (k.scope as any) || "read_write",
        rateLimit: k.rate_limit ? `${k.rate_limit} req / min` : defaultRateLimit,
        userEmail: k.user_email || k.userEmail || k.email,
        userName: k.user_name || k.userName || k.user_full_name || k.userFullName || k.fullName,
        userFullName: k.user_full_name || k.userFullName || k.user_name || k.userName || k.fullName,
        email: k.user_email || k.userEmail || k.email,
        fullName: k.user_full_name || k.userFullName || k.user_name || k.userName || k.fullName,
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
        userEmail: session?.user?.email || undefined,
        userName: session?.user?.name || undefined,
        userFullName: session?.user?.name || undefined,
      });

      if (res?.data) {
        setNewlyCreatedKey({
          id: res.data.id || `key_${Date.now()}`,
          name: keyNameInput.trim(),
          prefix: res.data.prefix || res.data.key_prefix || "lsh_live_...",
          rawKey: res.data.raw_key || res.data.rawKey || res.data.api_key,
          scope: keyScopeInput,
          rateLimit: "600 req / min",
          userEmail: session?.user?.email || undefined,
          userName: session?.user?.name || undefined,
          userFullName: session?.user?.name || undefined,
          email: session?.user?.email || undefined,
          fullName: session?.user?.name || undefined,
          created_at: new Date().toISOString(),
        });
      }

      setKeyNameInput("");
      setIsGenerating(false);
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
      showToast.success("API key generated successfully!");
      loadKeys();
    } catch (err: any) {
      showToast.error(err.message || "Error creating API key.");
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
      showToast.success("API key revoked.");
      setDeleteTarget({ isOpen: false, id: "", name: "" });
      loadKeys();
    } catch (err) {
      showToast.error("Error revoking API key.");
    } finally {
      setIsRevoking(false);
    }
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

    profile: `import { LShorter } from "lshorter-api";

const qk = new LShorter({ apiKey: "sk_live_..." });

// GET /api/v1/users/me — Profile, Email & Full Name
const me = await qk.users.me();

console.log("User ID:", me.id);
console.log("Email Address:", me.email);
console.log("Full Name:", me.fullName);
console.log("Subscribed Plan:", me.plan);
console.log("Clicks consumed this month:", me.clicksThisMonth);
console.log("Active links:", me.linksCount);
console.log("Custom domains:", me.domainsCount);`
  };

  if (status === "loading" || isLoading) {
    return <ApiKeysPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-8 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Developer API & SDK</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Generate secure API keys (sk_live_...) and integrate URL shortening directly into your applications.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={async () => {
              setIsRefreshing(true);
              cfInvalidateCache("/api/keys");
              await loadKeys();
              setIsRefreshing(false);
              showToast.success("API keys list refreshed!");
            }}
            variant="outline"
            disabled={isRefreshing}
            className="h-10 px-3.5 text-xs font-semibold gap-2 border-[#27272a] bg-[#141416] hover:bg-white/5 text-neutral-300 hover:text-white cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand" : "text-neutral-400"}`} />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => setIsGenerating(!isGenerating)}
            variant="glow"
            className="font-bebas text-lg tracking-wide gap-1.5 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>GENERATE API KEY</span>
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
              <KeyRound className="w-4 h-4 text-brand" />
              <span>Generate a new API key</span>
            </h3>
            <button
              type="button"
              onClick={() => setIsGenerating(false)}
              className="text-xs text-neutral-400 hover:text-white cursor-pointer"
            >
              Close ✕
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex-1">
              <Input
                required
                placeholder="Application name (e.g. Telegram Bot, Zapier, Backend Worker...)"
                value={keyNameInput}
                onChange={(e) => setKeyNameInput(e.target.value)}
                className="h-10 text-xs bg-[#0c0c0e] border-[#27272a]"
              />
            </div>
            <div className="w-full sm:w-56 shrink-0">
              <select
                value={keyScopeInput}
                onChange={(e) => setKeyScopeInput(e.target.value as "read" | "read_write" | "admin")}
                className="w-full h-10 rounded-[10px] bg-[#0c0c0e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-brand cursor-pointer"
              >
                <option value="read_write" className="bg-[#141416] text-white">Read & Write</option>
                <option value="admin" className="bg-[#141416] text-white">Full Access (Admin)</option>
                <option value="read" className="bg-[#141416] text-white">Read Only</option>
              </select>
            </div>
            <Button type="submit" variant="glow" className="shrink-0 h-10 px-6 text-xs font-bold gap-1.5 cursor-pointer shadow-md">
              <Plus className="w-4 h-4" />
              <span>Create key</span>
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsGenerating(false)}
              className="shrink-0 h-10 px-4 text-xs font-semibold border-[#27272a] cursor-pointer"
            >
              Cancel
            </Button>
          </div>
        </form>
      )}

      {/* Active API Keys List */}
      <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-5 shadow-sm flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-zinc-900 dark:text-white flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-brand" />
            <span>Active API Keys ({keys.length})</span>
          </h3>
        </div>

        {keys.length === 0 ? (
          <div className="py-12 px-4 text-center flex flex-col items-center justify-center gap-2.5 bg-zinc-50 dark:bg-[#0c0c0e] rounded-[10px] border border-zinc-200 dark:border-[#27272a]">
            <div className="w-10 h-10 rounded-[10px] bg-zinc-200 dark:bg-neutral-800/60 border border-zinc-300 dark:border-neutral-700/40 flex items-center justify-center text-zinc-500 dark:text-neutral-500">
              <KeyRound className="w-5 h-5" />
            </div>
            <p className="text-xs font-semibold text-zinc-800 dark:text-neutral-300">No active API keys yet</p>
            <p className="text-[11px] text-zinc-500 dark:text-neutral-500 max-w-xs">
              Click &quot;Generate API Key&quot; above to create your first developer token.
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
                if (scope === "admin") return { label: "Admin", color: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20" };
                if (scope === "read") return { label: "Read Only", color: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20" };
                return { label: "Read & Write", color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" };
              };
              const scopeInfo = getScopeBadge(key.scope);

              return (
                <div
                  key={key.id}
                  className="p-4 rounded-[10px] bg-zinc-50 dark:bg-[#0e0e11] border border-zinc-200 dark:border-[#27272a] hover:border-zinc-300 dark:hover:border-[#38383e] transition-all flex flex-col gap-3 shadow-xs"
                >
                  {/* Key Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-sm text-zinc-900 dark:text-white">{key.name}</span>
                      <span className={`px-2 py-0.5 rounded-[6px] border text-[10px] font-semibold ${scopeInfo.color}`}>
                        {scopeInfo.label}
                      </span>
                      <span className="px-2 py-0.5 rounded-[6px] bg-zinc-200/80 dark:bg-neutral-800/70 border border-zinc-300 dark:border-neutral-700/40 text-[10px] text-zinc-600 dark:text-neutral-400 font-mono">
                        {key.rateLimit || "600 req / min"}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-[11px] text-zinc-500 dark:text-neutral-500">
                      <span>Created on {new Date(key.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}</span>
                      {key.lastUsedAt && (
                        <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString("en-US")}</span>
                      )}
                    </div>
                  </div>

                  {/* Creator / User Details (Full Name & Email) - empty if no info */}
                  {(() => {
                    const name = key.userFullName || key.userName || key.fullName;
                    const email = key.userEmail || key.email;
                    if (!name && !email) return null;
                    return (
                      <div className="flex items-center gap-1.5 text-[11px] text-zinc-600 dark:text-neutral-400 bg-zinc-100 dark:bg-[#070709] px-2.5 py-1 rounded-[6px] border border-zinc-200 dark:border-[#1f1f23] truncate">
                        <span className="text-zinc-500 text-[10px] font-semibold shrink-0">Creator:</span>
                        {name && <span className="text-zinc-800 dark:text-neutral-200 font-medium truncate">{name}</span>}
                        {name && email && <span className="text-zinc-400 dark:text-neutral-600">·</span>}
                        {email && <span className="text-zinc-500 dark:text-neutral-400 font-mono text-[10px] truncate">{email}</span>}
                      </div>
                    );
                  })()}

                  {/* Key Value & Action Buttons */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-[8px] bg-zinc-100/90 dark:bg-[#070709] border border-zinc-200 dark:border-[#1f1f23]">
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
                        className="h-8 px-2.5 rounded-[6px] bg-white dark:bg-[#1a1a1e] hover:bg-zinc-100 dark:hover:bg-[#25252c] border border-zinc-200 dark:border-[#2a2a30] text-zinc-700 dark:text-neutral-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title={isRevealed ? "Hide key" : "Reveal key"}
                      >
                        {isRevealed ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5 text-zinc-500 dark:text-neutral-400" />
                            <span className="hidden sm:inline">Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-zinc-500 dark:text-neutral-400" />
                            <span className="hidden sm:inline">Reveal</span>
                          </>
                        )}
                      </button>

                      {/* Copy Button */}
                      <button
                        type="button"
                        onClick={() => {
                          handleCopy(actualKey);
                          setCopiedKey(key.id);
                          showToast.success("API key copied to clipboard!");
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                        className="h-8 px-2.5 rounded-[6px] bg-white dark:bg-[#1a1a1e] hover:bg-zinc-100 dark:hover:bg-[#25252c] border border-zinc-200 dark:border-[#2a2a30] text-zinc-700 dark:text-neutral-300 hover:text-zinc-900 dark:hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                        title="Copy key"
                      >
                        {isCopied ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400" />
                            <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5 text-zinc-500 dark:text-neutral-400" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {/* Revoke Button */}
                      <button
                        type="button"
                        onClick={() => promptRevokeKey(key)}
                        className="h-8 w-8 rounded-[6px] bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 flex items-center justify-center transition-colors cursor-pointer"
                        title="Revoke key"
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
      <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-zinc-200 dark:border-[#222225] p-6 lg:p-8 flex flex-col gap-5 shadow-sm dark:shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#3178c6]/15 dark:bg-[#3178c6]/20 border border-[#3178c6]/30 dark:border-[#3178c6]/40 flex items-center justify-center text-[#3178c6]">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Official TypeScript SDK (npm i lshorter-api)</h3>
              <p className="text-xs text-zinc-500 dark:text-neutral-400">Ready-to-use implementation examples</p>
            </div>
          </div>

          <div className="flex items-center gap-2 p-1 rounded-[10px] bg-zinc-100 dark:bg-[#1a1a1e] border border-zinc-200 dark:border-[#27272a] text-xs overflow-x-auto">
            <button
              onClick={() => setActiveCodeTab("create")}
              className={`px-3 py-1.5 rounded-[10px] font-medium transition-colors cursor-pointer ${
                activeCodeTab === "create"
                  ? "bg-brand text-white shadow-sm"
                  : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Create Link
            </button>
            <button
              onClick={() => setActiveCodeTab("track")}
              className={`px-3 py-1.5 rounded-[10px] font-medium transition-colors cursor-pointer ${
                activeCodeTab === "track"
                  ? "bg-brand text-white shadow-sm"
                  : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Track Conversion
            </button>
            <button
              onClick={() => setActiveCodeTab("analytics")}
              className={`px-3 py-1.5 rounded-[10px] font-medium transition-colors cursor-pointer ${
                activeCodeTab === "analytics"
                  ? "bg-brand text-white shadow-sm"
                  : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveCodeTab("profile")}
              className={`px-3 py-1.5 rounded-[10px] font-medium transition-colors cursor-pointer ${
                activeCodeTab === "profile"
                  ? "bg-brand text-white shadow-sm"
                  : "text-zinc-600 dark:text-neutral-400 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              Profile (FullName)
            </button>
          </div>
        </div>

        {/* Code Box */}
        <CodeBlock
          code={codeSnippets[activeCodeTab]}
          language="typescript"
          filename={`sdk - ${activeCodeTab}.ts`}
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
        title="Revoke this API key?"
        description={`The key "${deleteTarget.name}" will be invalidated immediately. All applications using this token will lose API access.`}
        itemLabels={deleteTarget.name ? [deleteTarget.name] : []}
        isDeleting={isRevoking}
      />
    </div>
  );
}

