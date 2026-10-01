"use client";

import React, { useState } from "react";
import { KeyRound, Plus, Copy, Code2, Terminal, ExternalLink, Check } from "lucide-react";
import { PREVIEW_API_KEYS } from "@/lib/preview-data";
import { showToast } from "@/components/ui/toast-provider";

export default function PreviewApiSdkPage() {
  const [keys] = useState(PREVIEW_API_KEYS);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"curl" | "node" | "python">("curl");

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast.success("Copied to clipboard!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const codeSnippets = {
    curl: `curl -X POST https://api.lsho.cc/v1/links \\
  -H "Authorization: Bearer lsh_live_9x82••••••••" \\
  -H "Content-Type: application/json" \\
  -d '{
    "target_url": "https://stripe.com/checkout",
    "slug": "launch-deal",
    "geo_routing": { "FR": "https://stripe.com/fr" }
  }'`,
    node: `import { LShorterClient } from "@lshorter/sdk";

const lsh = new LShorterClient({ apiKey: "lsh_live_9x82••••••••" });

const link = await lsh.links.create({
  targetUrl: "https://stripe.com/checkout",
  slug: "launch-deal",
  geoRouting: { FR: "https://stripe.com/fr" }
});

console.log(link.shortUrl); // https://lsho.cc/launch-deal`,
    python: `from lshorter import LShorter

client = LShorter(api_key="lsh_live_9x82••••••••")

link = client.links.create(
    target_url="https://stripe.com/checkout",
    slug="launch-deal",
    geo_routing={"FR": "https://stripe.com/fr"}
)

print(link.short_url)`,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2.5">
            <span>API Keys & Edge SDK</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#465FFF]/20 text-[#7592FF] border border-[#465FFF]/30 font-mono font-semibold">
              v1 API
            </span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Programmatic link generation, dynamic routing rule mutation, and conversion webhook subscriptions.
          </p>
        </div>

        <button
          type="button"
          onClick={() => showToast.info("Preview: API key generator active in live version.")}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white text-xs font-semibold shadow-md shadow-[#465FFF]/25 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Generate New Key</span>
        </button>
      </div>

      {/* API Keys Table */}
      <div className="p-5 rounded-2xl bg-[#111115] border border-white/10 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-white flex items-center justify-between">
          <span className="flex items-center gap-2">
            <KeyRound className="w-4 h-4 text-[#7592FF]" />
            <span>Active API Keys</span>
          </span>
          <span className="text-xs text-neutral-400 font-mono">Rate Limit: 1,000 req/min</span>
        </h3>

        <div className="space-y-3">
          {keys.map((k) => (
            <div
              key={k.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all"
            >
              <div>
                <div className="text-sm font-semibold text-white">{k.name}</div>
                <div className="text-xs font-mono text-neutral-400 mt-1 flex items-center gap-2">
                  <span>{k.prefix}••••••••••••••••</span>
                  <span className="px-1.5 py-0.2 rounded bg-white/10 text-neutral-300 text-[10px]">
                    {k.scope}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-neutral-400">Last used: {k.lastUsedAt}</span>
                <button
                  type="button"
                  onClick={() => handleCopy(`${k.prefix}_mock_secret_key`, k.id)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-neutral-300 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedId === k.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>Copy Key</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Snippets Section */}
      <div className="p-5 rounded-2xl bg-[#111115] border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-semibold text-white">SDK Quickstart</span>
          </div>

          <div className="flex items-center gap-1 bg-white/5 p-1 rounded-lg">
            {(["curl", "node", "python"] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                  activeTab === tab ? "bg-[#465FFF] text-white" : "text-neutral-400 hover:text-white"
                }`}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs text-neutral-200 overflow-x-auto">
          <pre>{codeSnippets[activeTab]}</pre>
        </div>
      </div>
    </div>
  );
}
