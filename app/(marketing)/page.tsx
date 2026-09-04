"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Zap,
  Globe2,
  Lock,
  BarChart3,
  QrCode,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Smartphone,
  EyeOff,
  Link2,
  Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast-provider";
import { CobeGlobe } from "@/components/globe/cobe-globe";

export default function LandingPage() {
  const [demoUrl, setDemoUrl] = useState("");
  const [shortenedDemo, setShortenedDemo] = useState<string | null>(null);

  const handleDemoShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoUrl.trim()) return;
    setShortenedDemo(`https://lsho.cc/${Math.random().toString(36).substring(2, 8)}`);
  };

  return (
    <div className="flex flex-col gap-24 py-12 px-6 lg:px-12 max-w-7xl mx-auto">
      {/* HERO SECTION with Bebas Neue */}
      <section className="text-center flex flex-col items-center gap-6 pt-10 relative">
        {/* Decorative Top Pill */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#ff6600]/10 border border-[#ff6600]/30 text-xs font-semibold text-[#ff6600] animate-in fade-in">
          <Zap className="w-3.5 h-3.5" />
          <span>Edge-Native Redirection (&lt; 1 ms) sur Cloudflare Workers</span>
        </div>

        {/* Big Bebas Neue Title */}
        <h1 className="font-bebas text-5xl sm:text-7xl lg:text-8xl text-white tracking-wide leading-[0.95] max-w-4xl">
          DES LIENS COURTS PLUS RAPIDES, PLUS INTELLIGENTS &{" "}
          <span className="text-[#ff6600] drop-shadow-[0_0_35px_rgba(255,102,0,0.45)]">
            LUCRATIFS
          </span>
        </h1>

        <p className="text-sm sm:text-base text-neutral-400 max-w-2xl leading-relaxed">
          Raccourcissez vos URLs, ciblez automatiquement vos visiteurs par pays et appareil, masquez vos référents et trackez vos revenus en temps réel sur un Globe 3D interactif.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-sm sm:max-w-none">
          <Link href="/login" className="w-full sm:w-auto">
            <Button variant="glow" size="lg" className="w-full sm:w-auto font-bebas text-2xl px-8 py-5 tracking-wide gap-2 rounded-2xl sm:rounded-full">
              <span>COMMENCER GRATUITEMENT</span>
              <ArrowRight className="w-5 h-5" />
            </Button>
          </Link>
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full sm:w-auto font-bebas text-2xl px-8 py-5 tracking-wide text-neutral-300 rounded-2xl sm:rounded-full border-[#27272a]">
              VOIR LES TARIFS
            </Button>
          </Link>
        </div>

        {/* Interactive Hero Shortener Bar - Single Unified Capsule Pill */}
        <div className="w-full max-w-xl mx-auto mt-4 transition-all">
          <form
            onSubmit={handleDemoShorten}
            className="w-full h-13 sm:h-14 p-1.5 rounded-full bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/15 hover:border-white/25 focus-within:border-[#0066FF] md:focus-within:border-[#ff6600] focus-within:shadow-[0_0_25px_rgba(0,102,255,0.25)] shadow-[0_12px_40px_rgba(0,0,0,0.75)] flex items-center gap-2 transition-all"
          >
            <div className="pl-3 sm:pl-4 flex items-center text-neutral-400">
              <Link2 className="w-4 h-4 text-[#0066FF] md:text-[#ff6600] shrink-0" />
            </div>
            <input
              type="url"
              required
              placeholder="Collez une URL à raccourcir..."
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none"
            />
            <button
              type="submit"
              className="h-10 sm:h-11 px-4 sm:px-6 rounded-full bg-gradient-to-r from-[#0066FF] to-[#0052cc] md:from-[#ff6600] md:to-[#e65c00] hover:brightness-110 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md shadow-[#0066FF]/35 md:shadow-[#ff6600]/35 transition-all cursor-pointer shrink-0"
            >
              <span>Raccourcir</span>
              <Sparkles className="w-3.5 h-3.5" />
            </button>
          </form>

          {shortenedDemo && (
            <div className="mt-3 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs animate-in zoom-in-95 duration-200 shadow-lg">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-mono text-emerald-400 font-bold break-all text-xs sm:text-sm">{shortenedDemo}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shortenedDemo);
                    showToast.success("Lien court copié dans le presse-papier !");
                  }}
                  className="px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[11px] font-semibold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copier</span>
                </button>
                <Link href="/login" className="px-3 py-1.5 rounded-full bg-blue-500/15 hover:bg-blue-500/25 text-[#0066FF] md:text-[#ff6600] font-semibold transition-colors text-[11px]">
                  Personnaliser →
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3D GLOBE SHOWCASE SECTION */}
      <section className="rounded-[16px] bg-[#141416] border border-[#222225] p-8 lg:p-14 flex flex-col lg:flex-row items-center gap-12 shadow-2xl relative overflow-hidden">
        <div className="flex-1 flex flex-col gap-5 z-10">
          <span className="text-xs font-bold uppercase tracking-widest text-[#ff6600]">
            Technologie Edge Mondiale
          </span>
          <h2 className="font-bebas text-4xl sm:text-5xl text-white tracking-wide leading-tight">
            TRACKING & ANALYTICS 3D EN TEMPS RÉEL
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
            Chaque clic est intercepté par le point de présence Cloudflare le plus proche de votre visiteur. Résolvez le pays, l&apos;OS et appliquez les redirections sans aucune latence de base de données.
          </p>

          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
              <span className="font-bebas text-3xl text-[#ff6600] font-bold">100k</span>
              <p className="text-xs text-neutral-400 mt-0.5">Clics gratuits / mois</p>
            </div>
            <div className="p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a]">
              <span className="font-bebas text-3xl text-white font-bold">&lt; 1 ms</span>
              <p className="text-xs text-neutral-400 mt-0.5">Lookup KV en mémoire</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center w-full min-h-[380px]">
          <CobeGlobe />
        </div>
      </section>

      {/* 4 PILLARS FEATURE GRID */}
      <section className="flex flex-col gap-10">
        <div className="text-center flex flex-col items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#ff6600]">
            Fonctionnalités Clés
          </span>
          <h2 className="font-bebas text-4xl sm:text-5xl text-white tracking-wide">
            TOUT CE DONT VOUS AVEZ BESOIN POUR VOS CAMPAGNES
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-[#ff6600]/40 transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-[10px] bg-[#ff6600]/15 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] group-hover:scale-110 transition-transform">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Smart Routing Géo & Appareil</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Inclus dès le plan gratuit ! Redirigez les visiteurs selon leur pays et appareil (iOS vers App Store, Android vers Play Store).
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-[#ff6600]/40 transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-[10px] bg-[#ff6600]/15 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] group-hover:scale-110 transition-transform">
              <EyeOff className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Link Cloaking & Referrer Hiding</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Masquez les URL d&apos;affiliation dans une iframe propre et protégez vos sources de trafic avec le Referrer Policy no-referrer.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-[#ff6600]/40 transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-[10px] bg-[#ff6600]/15 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] group-hover:scale-110 transition-transform">
              <QrCode className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Générateur QR Codes Haute Résolution</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Créez des QR codes vectoriels pour liens, Wi-Fi, e-mails avec logo central et formats PNG/SVG téléchargeables.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-[#ff6600]/40 transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-[10px] bg-[#ff6600]/15 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Protection par Mot de Passe & Expiration</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Restreignez l&apos;accès à vos liens VIP ou planifiez une date d&apos;expiration automatique pour vos ventes flash.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-[#ff6600]/40 transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-[10px] bg-[#ff6600]/15 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Attribution des Ventes & Revenus</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Associez chaque euro de chiffre d&apos;affaires à son clic d&apos;origine pour mesurer précisément le retour sur investissement (ROI).
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-[#ff6600]/40 transition-all flex flex-col gap-3 group">
            <div className="w-10 h-10 rounded-[10px] bg-[#ff6600]/15 border border-[#ff6600]/30 flex items-center justify-center text-[#ff6600] group-hover:scale-110 transition-transform">
              <Terminal className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">API REST & SDK TypeScript Développeur</h3>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Générez vos clés d&apos;API en 1 clic et intégrez la création de liens directement dans votre code avec le SDK officiel.
            </p>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="text-center p-12 lg:p-16 rounded-[16px] bg-gradient-to-b from-[#141416] to-[#09090b] border border-[#ff6600]/30 shadow-2xl flex flex-col items-center gap-6">
        <h2 className="font-bebas text-4xl sm:text-6xl text-white tracking-wide">
          PRÊT À ACCÉLÉRER VOS REDIRECTIONS ?
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-lg">
          Rejoignez des milliers de créateurs et d&apos;entreprises qui font confiance à LShorter.
        </p>
        <Link href="/login">
          <Button
            variant="glow"
            size="lg"
            className="font-bebas text-xl sm:text-2xl px-8 sm:px-12 py-5 sm:py-6 tracking-wider h-auto leading-tight shadow-xl shadow-[#ff6600]/30 hover:scale-105 transition-transform max-w-full"
          >
            CRÉER MON PREMIER LIEN COURT
          </Button>
        </Link>
      </section>
    </div>
  );
}
