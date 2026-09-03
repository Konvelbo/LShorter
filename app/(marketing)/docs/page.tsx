"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Code2,
  Sparkles,
  Terminal,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Check,
  Copy,
  Layers,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DocsPage() {
  const [copied, setCopied] = useState(false);

  const sampleSnippet = `// 1. Installation du SDK
npm install @lshorter/sdk

// 2. Initialisation
import { LShorter } from "@lshorter/sdk";

const qk = new LShorter({ apiKey: process.env.LSHORTER_API_KEY });

// 3. Création d'un lien avec ciblage pays & appareil
const link = await qk.links.create({
  targetUrl: "https://mon-site.com/produit",
  slug: "promo-2026",
  geoTargeting: {
    FR: "https://mon-site.fr",
    US: "https://mon-site.com/us",
  },
  deviceTargeting: {
    ios: "https://apps.apple.com/app/...",
    android: "https://play.google.com/store/apps/...",
  }
});

console.log(link.shortUrl); // https://qlsk.cc/promo-2026`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sampleSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const endpoints = [
    { method: "POST", path: "/api/v1/links", desc: "Création d'un lien court avec ciblage et options" },
    { method: "GET", path: "/api/v1/links", desc: "Liste paginée des liens d'un utilisateur" },
    { method: "GET", path: "/r/:slug", desc: "Redirection Edge <1ms (Route publique sans auth)" },
    { method: "POST", path: "/api/v1/track", desc: "Tracking d'un événement d'achat / conversion" },
    { method: "GET", path: "/api/v1/analytics", desc: "Statistiques globales (clics, top pays, devices)" },
    { method: "POST", path: "/api/v1/domains", desc: "Déclaration d'un domaine personnalisé SSL" },
  ];

  return (
    <div className="py-12 px-6 lg:px-12 max-w-5xl mx-auto flex flex-col gap-12 animate-in fade-in">
      {/* Top Coming Soon Banner */}
      <div className="p-8 rounded-[16px] bg-[#141416] border border-[#ff6600]/40 shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-6 relative overflow-hidden">
        <div className="flex flex-col gap-2 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff6600]/15 border border-[#ff6600]/30 text-xs font-bold text-[#ff6600] w-fit">
            <Sparkles className="w-3.5 h-3.5" />
            <span>ACCÈS ANTICIPÉ (BETA PRIVÉE)</span>
          </div>
          <h1 className="font-bebas text-3xl sm:text-4xl text-white tracking-wide">
            SDK TYPESCRIPT & API REST PUBLIQUE
          </h1>
          <p className="text-xs text-neutral-400 max-w-md">
            Le SDK officiel <code className="text-[#ff6600]">@lshorter/sdk</code> sera publié sur npm prochainement. Vous pouvez générer vos clés API dès maintenant depuis votre dashboard.
          </p>
        </div>

        <Link href="/dashboard/api-sdk" className="shrink-0 z-10">
          <Button variant="glow" className="font-bebas text-xl px-6 py-3 tracking-wide gap-2">
            <span>ESPACE DÉVELOPPEUR</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* Code Preview */}
      <div className="rounded-[14px] bg-[#141416] border border-[#222225] p-6 flex flex-col gap-4 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#ff6600]" />
            <h3 className="text-sm font-bold text-white">Exemple d&apos;Intégration (@lshorter/sdk)</h3>
          </div>

          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 text-neutral-300 hover:text-white text-xs transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Copié !</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copier le code</span>
              </>
            )}
          </button>
        </div>

        <pre className="p-4 rounded-[10px] bg-[#09090b] border border-[#27272a] font-mono text-xs text-neutral-300 leading-relaxed overflow-x-auto">
          {sampleSnippet}
        </pre>
      </div>

      {/* Endpoints Reference Table */}
      <div className="rounded-[14px] bg-[#141416] border border-[#222225] p-6 flex flex-col gap-4 shadow-xl">
        <h3 className="text-base font-bold text-white">Endpoints API REST (v1)</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-400">
            <thead>
              <tr className="border-b border-[#222225] text-[11px] uppercase tracking-wider text-neutral-500">
                <th className="pb-3 pl-2">Méthode</th>
                <th className="pb-3">Route Endpoint</th>
                <th className="pb-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222225]">
              {endpoints.map((ep, i) => (
                <tr key={i} className="hover:bg-white/[0.02]">
                  <td className="py-3 pl-2">
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                        ep.method === "POST"
                          ? "bg-[#ff6600]/20 text-[#ff6600]"
                          : "bg-sky-500/20 text-sky-400"
                      }`}
                    >
                      {ep.method}
                    </span>
                  </td>
                  <td className="py-3 font-mono text-white">{ep.path}</td>
                  <td className="py-3 text-neutral-300">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
