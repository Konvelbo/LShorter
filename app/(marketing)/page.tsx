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
  Copy,
  Split,
  Share2,
  DollarSign,
  Layers,
  Cpu,
  Webhook,
  Key,
  Check,
  ChevronDown,
  ExternalLink,
  FileSpreadsheet,
  TrendingUp,
  Sliders,
  Shield,
  Fingerprint,
  ImageIcon,
  Wifi,
  Mail,
  FileText,
  Code2,
  Server,
  MousePointerClick,
  Target,
  Clock,
  Radio,
  Shuffle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast-provider";
import { CobeGlobe } from "@/components/globe/cobe-globe";

// Interactive tabs for the deep-dive feature explorer
type FeatureTab = "routing" | "security" | "branding" | "analytics" | "developers";

export default function LandingPage() {
  const [demoUrl, setDemoUrl] = useState("");
  const [shortenedDemo, setShortenedDemo] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FeatureTab>("routing");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleDemoShorten = (e: React.FormEvent) => {
    e.preventDefault();
    if (!demoUrl.trim()) return;
    const randomSlug = Math.random().toString(36).substring(2, 8);
    setShortenedDemo(`https://lsho.cc/${randomSlug}`);
  };

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const comparisonData = [
    {
      icon: Zap,
      label: "Latence de redirection (TTFB)",
      lshorter: "< 1 ms (Mémoire Edge Cloudflare)",
      others: "200 - 650 ms (DB centralisée)",
      highlight: true
    },
    {
      icon: Split,
      label: "Géo-ciblage & Routage OS",
      lshorter: "Inclus dès le plan Gratuit (0€)",
      others: "Payant (> 35€ / mois)",
      highlight: true
    },
    {
      icon: EyeOff,
      label: "Link Cloaking & Referrer Hiding",
      lshorter: "Natif & 100% anonyme",
      others: "Non supporté ou partiel",
      highlight: true
    },
    {
      icon: QrCode,
      label: "Studio QR Code Vectoriel",
      lshorter: "Vectoriel SVG + PNG + Logo central",
      others: "PNG standard basse résolution",
      highlight: true
    },
    {
      icon: ImageIcon,
      label: "Bannières OpenGraph CDN",
      lshorter: "Bunny.net CDN mondial optimisé",
      others: "Hébergement externe non inclus",
      highlight: true
    },
    {
      icon: DollarSign,
      label: "Attribution du Chiffre d'Affaires",
      lshorter: "Suivi du ROI direct par clic",
      others: "Clics basiques uniquement",
      highlight: true
    },
    {
      icon: MousePointerClick,
      label: "Quota de clics gratuits",
      lshorter: "100 000 clics / mois (Gratuit)",
      others: "50 à 500 clics / mois",
      highlight: true
    }
  ];

  return (
    <div className="flex flex-col gap-20 sm:gap-28 py-8 sm:py-10 px-4 sm:px-6 lg:px-12 max-w-7xl mx-auto overflow-hidden">
      {/* ─────────────────────────────────────────────────────────────
          1. HERO SECTION
      ───────────────────────────────────────────────────────────── */}
      <section className="text-center flex flex-col items-center gap-5 sm:gap-6 pt-4 sm:pt-10 relative">
        {/* Glow backdrop behind hero */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[600px] h-[300px] sm:h-[400px] bg-[#0066FF]/15 md:bg-[#ff6600]/10 rounded-full blur-[120px] pointer-events-none -z-10" />

        {/* Top Innovation Pill */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0066FF]/10 md:bg-[#ff6600]/10 border border-[#0066FF]/30 md:border-[#ff6600]/30 text-xs font-semibold text-[#0066FF] md:text-[#ff6600] animate-in fade-in shadow-inner max-w-full">
          <Zap className="w-3.5 h-3.5 animate-pulse shrink-0" />
          <span className="truncate">Réseau Edge Cloudflare &lt; 1 ms • Stockage Bunny.net CDN</span>
        </div>

        {/* Hero Title */}
        <h1 className="font-bebas text-4xl sm:text-7xl lg:text-8xl text-white tracking-wide leading-[0.95] max-w-5xl">
          LA PLATEFORME DE LIENS COURTS LA PLUS{" "}
          <span className="text-[#0066FF] md:text-[#ff6600] drop-shadow-[0_0_40px_rgba(0,102,255,0.4)] md:drop-shadow-[0_0_40px_rgba(255,102,0,0.5)]">
            RAPIDE, INTELLIGENTE & LUCRATIVE
          </span>
        </h1>

        {/* Hero Subtitle */}
        <p className="text-xs sm:text-base lg:text-lg text-neutral-300 max-w-3xl leading-relaxed">
          Raccourcissez vos URLs, ciblez automatiquement vos visiteurs par <strong className="text-white">pays</strong> et <strong className="text-white">appareil</strong>, masquez vos référents d&apos;affiliation, générez des <strong className="text-white">QR Codes vectoriels</strong> et suivez vos conversions en temps réel sur un <strong className="text-white">Globe 3D interactif</strong>.
        </p>

        {/* Hero CTA Action Buttons - Clean Responsive Layout */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2 w-full max-w-xs sm:max-w-none">
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              variant="glow"
              size="lg"
              className="w-full sm:w-auto font-bebas text-xl sm:text-2xl px-6 sm:px-8 py-3.5 sm:py-5 tracking-wide gap-2 rounded-[10px] shadow-lg shadow-[#0066FF]/25 md:shadow-[#ff6600]/25 h-auto leading-normal bg-[#0066FF] md:bg-[#ff6600]"
            >
              <span>COMMENCER GRATUITEMENT</span>
              <ArrowRight className="w-4 h-4 sm:w-5 h-5" />
            </Button>
          </Link>
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-bebas text-xl sm:text-2xl px-6 sm:px-8 py-3.5 sm:py-5 tracking-wide text-neutral-300 rounded-[10px] border-[#27272a] hover:bg-white/5 hover:text-white h-auto leading-normal"
            >
              VOIR LES TARIFS
            </Button>
          </Link>
        </div>

        {/* Quick Value Metrics Pill Line */}
        <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-8 pt-2 text-xs text-neutral-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>100 000 clics gratuits / mois</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Sans carte bancaire</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Conforme RGPD & Zéro cookie</span>
          </div>
        </div>

        {/* Interactive Hero Shortener Bar Capsule (Mobile: Electric Blue, Desktop: Orange) */}
        <div className="w-full max-w-2xl mx-auto mt-2 sm:mt-4 transition-all">
          <form
            onSubmit={handleDemoShorten}
            className="w-full h-13 sm:h-16 p-1 sm:p-1.5 rounded-full bg-[#0d0d12]/95 backdrop-blur-2xl border border-white/15 hover:border-white/25 focus-within:border-[#0066FF] md:focus-within:border-[#ff6600] focus-within:shadow-[0_0_30px_rgba(0,102,255,0.3)] md:focus-within:shadow-[0_0_30px_rgba(255,102,0,0.3)] shadow-[0_12px_40px_rgba(0,0,0,0.75)] flex items-center gap-2 transition-all"
          >
            <div className="pl-3 sm:pl-4 flex items-center text-neutral-400">
              <Link2 className="w-4 h-4 sm:w-5 h-5 text-[#0066FF] md:text-[#ff6600] shrink-0" />
            </div>
            <input
              type="url"
              required
              placeholder="Collez votre lien long ici..."
              value={demoUrl}
              onChange={(e) => setDemoUrl(e.target.value)}
              className="flex-1 min-w-0 bg-transparent text-xs sm:text-sm text-white placeholder:text-neutral-500 focus:outline-none px-2"
            />
            {/* Button: BLUE on mobile (<768px), ORANGE on desktop (md:) */}
            <button
              type="submit"
              className="h-10 sm:h-12 px-4 sm:px-8 rounded-full bg-gradient-to-r from-[#0066FF] to-[#0052cc] md:from-[#ff6600] md:to-[#e65c00] hover:brightness-110 active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 sm:gap-2 shadow-md shadow-[#0066FF]/40 md:shadow-[#ff6600]/35 transition-all cursor-pointer shrink-0"
            >
              <span>Raccourcir</span>
              <Sparkles className="w-3.5 h-3.5 sm:w-4 h-4" />
            </button>
          </form>

          {shortenedDemo && (
            <div className="mt-3 p-3.5 rounded-[10px] bg-emerald-500/10 border border-emerald-500/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs animate-in zoom-in-95 duration-200 shadow-xl">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                <span className="font-mono text-emerald-300 font-bold break-all text-xs sm:text-sm">
                  {shortenedDemo}
                </span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shortenedDemo);
                    showToast.success("Lien court copié dans le presse-papier !");
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 text-white text-[11px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copier</span>
                </button>
                <Link
                  href="/login"
                  className="px-3.5 py-1.5 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 hover:bg-[#0066FF]/30 md:hover:bg-[#ff6600]/30 text-[#0066FF] md:text-[#ff6600] font-semibold transition-colors text-[11px] flex items-center gap-1"
                >
                  <span>Configurer le ciblage</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          2. 3D GLOBE SHOWCASE & EDGE NETWORK STATS
      ───────────────────────────────────────────────────────────── */}
      <section className="rounded-[12px] bg-[#141416] border border-[#222225] p-6 sm:p-10 lg:p-14 flex flex-col lg:flex-row items-center gap-8 lg:gap-14 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-[#0066FF]/10 md:bg-[#ff6600]/10 rounded-full blur-3xl pointer-events-none -z-0" />

        <div className="flex-1 flex flex-col gap-4 sm:gap-5 z-10">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0066FF] md:text-[#ff6600]">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Technologie Cloudflare Workers & KV Edge</span>
          </div>

          <h2 className="font-bebas text-3xl sm:text-5xl text-white tracking-wide leading-tight">
            REDIRECTIONS ULTRA-RAPIDES & TRACKING 3D EN TEMPS RÉEL
          </h2>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
            Chaque clic est intercepté par le serveur Edge le plus proche de votre utilisateur parmi plus de <strong className="text-white">300 centres de données mondiaux</strong>. Vos règles de ciblage (pays, OS, langue, A/B test) sont résolues en mémoire vive (<strong className="text-[#0066FF] md:text-[#ff6600]">&lt; 1 ms</strong>) sans solliciter de base de données centrale lente.
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <div className="p-3 sm:p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col">
              <span className="font-bebas text-2xl sm:text-4xl text-[#0066FF] md:text-[#ff6600] font-bold">&lt; 1 ms</span>
              <span className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">Résolution KV Edge</span>
            </div>
            <div className="p-3 sm:p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col">
              <span className="font-bebas text-2xl sm:text-4xl text-white font-bold">300+</span>
              <span className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">Points de présence</span>
            </div>
            <div className="p-3 sm:p-4 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col col-span-2 sm:col-span-1">
              <span className="font-bebas text-2xl sm:text-4xl text-emerald-400 font-bold">99.99%</span>
              <span className="text-[10px] sm:text-xs text-neutral-400 mt-0.5">Disponibilité SLA</span>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center w-full min-h-[300px] sm:min-h-[400px]">
          <CobeGlobe />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          3. COMPREHENSIVE FEATURE EXPLORER (INTERACTIVE TABS)
      ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8 sm:gap-10">
        <div className="text-center flex flex-col items-center gap-2 sm:gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0066FF] md:text-[#ff6600]">
            Visite Guidée des Fonctionnalités
          </span>
          <h2 className="font-bebas text-3xl sm:text-6xl text-white tracking-wide">
            DÉCOUVREZ LA PUISSANCE DU MOTEUR LSHORTER
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-2xl leading-relaxed">
            Cliquez sur un domaine fonctionnel pour comprendre comment LShorter optimise vos taux de clics, protège votre marque et augmente votre chiffre d&apos;affaires.
          </p>
        </div>

        {/* Category Navigation Pills */}
        <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 p-1.5 rounded-[12px] bg-[#141416] border border-[#222225] max-w-4xl mx-auto">
          <button
            onClick={() => setActiveTab("routing")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[8px] font-medium text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "routing"
                ? "bg-[#0066FF] md:bg-[#ff6600] text-white shadow-md shadow-[#0066FF]/30 md:shadow-[#ff6600]/30 font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Split className="w-3.5 h-3.5 sm:w-4 h-4" />
            <span>Ciblage & A/B</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[8px] font-medium text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "security"
                ? "bg-[#0066FF] md:bg-[#ff6600] text-white shadow-md shadow-[#0066FF]/30 md:shadow-[#ff6600]/30 font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 sm:w-4 h-4" />
            <span>Sécurité & Cloaking</span>
          </button>

          <button
            onClick={() => setActiveTab("branding")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[8px] font-medium text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "branding"
                ? "bg-[#0066FF] md:bg-[#ff6600] text-white shadow-md shadow-[#0066FF]/30 md:shadow-[#ff6600]/30 font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <QrCode className="w-3.5 h-3.5 sm:w-4 h-4" />
            <span>QR Codes & CDN</span>
          </button>

          <button
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[8px] font-medium text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "analytics"
                ? "bg-[#0066FF] md:bg-[#ff6600] text-white shadow-md shadow-[#0066FF]/30 md:shadow-[#ff6600]/30 font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5 sm:w-4 h-4" />
            <span>Analytics & ROI</span>
          </button>

          <button
            onClick={() => setActiveTab("developers")}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-[8px] font-medium text-xs sm:text-sm transition-all cursor-pointer ${
              activeTab === "developers"
                ? "bg-[#0066FF] md:bg-[#ff6600] text-white shadow-md shadow-[#0066FF]/30 md:shadow-[#ff6600]/30 font-bold"
                : "text-neutral-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <Terminal className="w-3.5 h-3.5 sm:w-4 h-4" />
            <span>API & Webhooks</span>
          </button>
        </div>

        {/* Tab Content 1: ROUTING & A/B TESTING */}
        {activeTab === "routing" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch animate-in fade-in duration-300">
            <div className="lg:col-span-7 flex flex-col justify-center gap-4 sm:gap-6 p-5 sm:p-10 rounded-[12px] bg-[#141416] border border-[#222225]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0066FF] md:text-[#ff6600] uppercase tracking-wider">
                <Split className="w-4 h-4" />
                <span>Routage Dynamique & Optimisation du Taux de Conversion</span>
              </div>
              <h3 className="font-bebas text-2xl sm:text-4xl text-white">
                UN SEUL LIEN, DES DESTINATIONS SUR-MESURE SELON LE VISITEUR
              </h3>
              <div className="space-y-3.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    1
                  </div>
                  <div>
                    <strong className="text-white">Géo-ciblage par Pays :</strong> Redirigez vos clients français vers votre boutique en EUR et vos clients américains vers la page en USD automatiquement.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    2
                  </div>
                  <div>
                    <strong className="text-white">Ciblage par Système d&apos;Exploitation (iOS vs Android) :</strong> L&apos;utilisateur iPhone arrive directement sur l&apos;App Store, et l&apos;utilisateur Android sur le Play Store.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    3
                  </div>
                  <div>
                    <strong className="text-white">A/B Testing & Split de Trafic Pondéré :</strong> Répartissez le trafic entre deux ou trois pages d&apos;atterrissage (ex: 70% / 30%) pour déterminer celle qui convertit le plus.
                  </div>
                </div>
              </div>
            </div>

            {/* Visual preview box */}
            <div className="lg:col-span-5 p-5 sm:p-6 rounded-[12px] bg-[#0d0d10] border border-[#27272a] flex flex-col justify-between gap-4 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-[#222225] text-neutral-400">
                <span className="flex items-center gap-1.5 text-white font-semibold">
                  <Sliders className="w-3.5 h-3.5 text-[#0066FF] md:text-[#ff6600]" /> Moteur de Routage Edge
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                  Règles Actives
                </span>
              </div>

              <div className="space-y-2.5">
                <div className="p-2.5 sm:p-3 rounded-[8px] bg-[#141416] border border-[#222225] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">🇫🇷</span>
                    <div>
                      <p className="text-white font-sans text-xs font-semibold">France / iOS</p>
                      <p className="text-neutral-500 text-[10px]">apps.apple.com/fr/app/...</p>
                    </div>
                  </div>
                  <span className="text-emerald-400 text-[10px] sm:text-[11px] font-bold">100% direct</span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-[8px] bg-[#141416] border border-[#222225] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">🇺🇸</span>
                    <div>
                      <p className="text-white font-sans text-xs font-semibold">USA / Desktop</p>
                      <p className="text-neutral-500 text-[10px]">us.mystore.com/checkout</p>
                    </div>
                  </div>
                  <span className="text-[#0066FF] md:text-[#ff6600] text-[10px] sm:text-[11px] font-bold">Variante A (70%)</span>
                </div>

                <div className="p-2.5 sm:p-3 rounded-[8px] bg-[#141416] border border-[#222225] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-base sm:text-lg">🌍</span>
                    <div>
                      <p className="text-white font-sans text-xs font-semibold">Reste du Monde</p>
                      <p className="text-neutral-500 text-[10px]">mystore.com/global</p>
                    </div>
                  </div>
                  <span className="text-blue-400 text-[10px] sm:text-[11px] font-bold">Défaut</span>
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-400 font-sans">
                💡 <span className="text-neutral-200">Avantage :</span> Vos campagnes marketing maximisent chaque euro dépensé en évitant les rebonds dus à un appareil incompatible ou une mauvaise devise.
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 2: SECURITY & CLOAKING */}
        {activeTab === "security" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch animate-in fade-in duration-300">
            <div className="lg:col-span-7 flex flex-col justify-center gap-4 sm:gap-6 p-5 sm:p-10 rounded-[12px] bg-[#141416] border border-[#222225]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0066FF] md:text-[#ff6600] uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4" />
                <span>Protection des Données & Discrétion Absolue</span>
              </div>
              <h3 className="font-bebas text-2xl sm:text-4xl text-white">
                CLOAKING D&apos;AFFILIATION, REFERRER HIDING & MOT DE PASSE
              </h3>
              <div className="space-y-3.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <EyeOff className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">Link Cloaking (Iframe Furtive) :</strong> L&apos;URL de destination réelle reste masquée sous votre propre nom de domaine. Idéal pour protéger vos liens d&apos;affiliation.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <Shield className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">Masquage du Référent (Referrer Hiding) :</strong> Active la politique HTTP <code className="text-neutral-200 bg-black/40 px-1 py-0.5 rounded text-[11px]">no-referrer</code>. Vos partenaires ne savent jamais d&apos;où provient votre trafic.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">Protection par Mot de Passe & Plafond de Clics :</strong> Verrouillez vos liens privés ou limitez un lien à 100 clics avant désactivation automatique.
                  </div>
                </div>
              </div>
            </div>

            {/* Visual preview box */}
            <div className="lg:col-span-5 p-5 sm:p-6 rounded-[12px] bg-[#0d0d10] border border-[#27272a] flex flex-col justify-between gap-4 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-[#222225] text-neutral-400">
                <span className="flex items-center gap-1.5 text-white font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Sécurité des En-têtes HTTP
                </span>
                <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px]">
                  Cloaking Actif
                </span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-[8px] bg-[#141416] border border-[#222225] space-y-2 font-mono text-[11px]">
                <div className="text-neutral-400">
                  <span className="text-neutral-500">GET</span> <span className="text-emerald-400">https://lsho.cc/vip-deal</span>
                </div>
                <div className="pl-3 border-l-2 border-[#0066FF]/40 md:border-[#ff6600]/40 space-y-1 text-neutral-300">
                  <p><span className="text-[#0066FF] md:text-[#ff6600]">Referrer-Policy:</span> no-referrer</p>
                  <p><span className="text-[#0066FF] md:text-[#ff6600]">X-Frame-Options:</span> SAMEORIGIN</p>
                  <p><span className="text-[#0066FF] md:text-[#ff6600]">Sec-Fetch-Site:</span> cross-site-masked</p>
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-emerald-950/20 border border-emerald-900/40 text-[11px] text-emerald-300 font-sans flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Protection maximale : vos affiliés et sources payantes restent 100% invisibles.</span>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: BRANDING, QR CODE & BUNNY CDN */}
        {activeTab === "branding" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch animate-in fade-in duration-300">
            <div className="lg:col-span-7 flex flex-col justify-center gap-4 sm:gap-6 p-5 sm:p-10 rounded-[12px] bg-[#141416] border border-[#222225]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0066FF] md:text-[#ff6600] uppercase tracking-wider">
                <QrCode className="w-4 h-4" />
                <span>Image de Marque & Présence Omnicanale</span>
              </div>
              <h3 className="font-bebas text-2xl sm:text-4xl text-white">
                STUDIO QR CODE VECTORIEL & APERÇUS SOCIAUX BUNNY.NET CDN
              </h3>
              <div className="space-y-3.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <QrCode className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">QR Codes Vectoriels Haute Résolution (SVG / PNG) :</strong> Générez en un clic des QR codes pour liens web, Wi-Fi, contacts vCard, emails ou SMS avec intégration de votre logo au centre.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <ImageIcon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">Bannières OpenGraph & Stockage Bunny.net :</strong> Uploadez des visuels HD 1200×630 stockés sur le CDN Bunny.net pour un affichage instantané sur Facebook, X, LinkedIn et WhatsApp.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <Globe2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">Domaines Personnalisés (BYOD) :</strong> Connectez votre nom de domaine (ex: <code className="text-[#0066FF] md:text-[#ff6600]">link.votre-marque.com</code>) avec certificats SSL/TLS automatisés.
                  </div>
                </div>
              </div>
            </div>

            {/* Visual preview box */}
            <div className="lg:col-span-5 p-5 sm:p-6 rounded-[12px] bg-[#0d0d10] border border-[#27272a] flex flex-col justify-between gap-4 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-[#222225] text-neutral-400">
                <span className="flex items-center gap-1.5 text-white font-semibold">
                  <ImageIcon className="w-3.5 h-3.5 text-[#0066FF] md:text-[#ff6600]" /> Aperçu Réseau Social (OpenGraph)
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[10px]">
                  Bunny CDN Edge
                </span>
              </div>

              {/* Mock Social Card */}
              <div className="rounded-[10px] bg-[#141416] border border-[#27272a] overflow-hidden">
                <div className="h-28 sm:h-32 bg-gradient-to-r from-blue-600/30 md:from-orange-600/30 to-indigo-600/20 md:to-amber-600/20 border-b border-[#222225] flex items-center justify-center text-neutral-400 font-sans text-xs">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-6 h-6 sm:w-8 h-8 text-[#0066FF] md:text-[#ff6600]" />
                    <span className="font-bebas text-base sm:text-lg text-white">Bannière HD 1200×630 CDN</span>
                  </div>
                </div>
                <div className="p-3 space-y-1 font-sans">
                  <p className="text-[10px] text-neutral-400 uppercase tracking-wider font-bold">lsho.b-cdn.net</p>
                  <p className="text-white font-semibold text-xs">Offre Exclusive • -50% Annuel</p>
                  <p className="text-neutral-400 text-[11px] line-clamp-1">Routage de liens ultra-rapide pour booster vos ventes.</p>
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-300 font-sans">
                🚀 <strong className="text-white">Résultat :</strong> Un taux de clic (CTR) social multiplié par 3 grâce à des bannières enrichies et des domaines de confiance.
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 4: ANALYTICS & REVENUES */}
        {activeTab === "analytics" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch animate-in fade-in duration-300">
            <div className="lg:col-span-7 flex flex-col justify-center gap-4 sm:gap-6 p-5 sm:p-10 rounded-[12px] bg-[#141416] border border-[#222225]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0066FF] md:text-[#ff6600] uppercase tracking-wider">
                <BarChart3 className="w-4 h-4" />
                <span>Mesure de Performance & Rentabilité</span>
              </div>
              <h3 className="font-bebas text-2xl sm:text-4xl text-white">
                ATTRIBUTION DES VENTES, GLOBE 3D & EXPORT EXCEL RÉEL
              </h3>
              <div className="space-y-3.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">Attribution du Chiffre d&apos;Affaires (ROI Direct) :</strong> Associez chaque commande client au clic exact qui l&apos;a générée pour identifier les canaux les plus rentables.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">Export Multi-feuilles Excel XML & CSV UTF-8 :</strong> Exportez l&apos;intégralité de vos données réelles (visiteurs uniques, pays, navigateurs, UTMs) en 1 clic.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <Target className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">Pixels de Reciblage Publicitaire :</strong> Injectez vos balises Meta Pixel, Google Tag Manager, TikTok ou LinkedIn pour recibler vos visiteurs.
                  </div>
                </div>
              </div>
            </div>

            {/* Visual preview box */}
            <div className="lg:col-span-5 p-5 sm:p-6 rounded-[12px] bg-[#0d0d10] border border-[#27272a] flex flex-col justify-between gap-4 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-[#222225] text-neutral-400">
                <span className="flex items-center gap-1.5 text-white font-semibold">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Données Consolidées en Temps Réel
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                  Cloudflare D1 Live
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 font-sans">
                <div className="p-3 rounded-[8px] bg-[#141416] border border-[#222225]">
                  <p className="text-[11px] text-neutral-400">Clics Totaux</p>
                  <p className="font-bebas text-xl sm:text-2xl text-white mt-1">128 450</p>
                  <span className="text-[10px] text-emerald-400 font-bold">+18.4%</span>
                </div>
                <div className="p-3 rounded-[8px] bg-[#141416] border border-[#222225]">
                  <p className="text-[11px] text-neutral-400">Chiffre d&apos;Affaires</p>
                  <p className="font-bebas text-xl sm:text-2xl text-[#0066FF] md:text-[#ff6600] mt-1">34 890 €</p>
                  <span className="text-[10px] text-emerald-400 font-bold">ROI : 4.8x</span>
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-[#141416] border border-[#222225] space-y-2 font-sans text-xs">
                <div className="flex justify-between text-neutral-300">
                  <span>🇫🇷 France</span>
                  <span className="font-mono font-bold text-white">45.2%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div className="h-full bg-[#0066FF] md:bg-[#ff6600]" style={{ width: "45.2%" }} />
                </div>
                <div className="flex justify-between text-neutral-300 pt-1">
                  <span>🇺🇸 États-Unis</span>
                  <span className="font-mono font-bold text-white">28.7%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-800 overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: "28.7%" }} />
                </div>
              </div>

              <div className="p-3 rounded-[8px] bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-300 font-sans">
                📊 <strong className="text-white">Export complet :</strong> Téléchargez vos rapports au format Excel multi-feuilles avec tableaux mis en forme.
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 5: DEVELOPERS, API & WEBHOOKS */}
        {activeTab === "developers" && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-stretch animate-in fade-in duration-300">
            <div className="lg:col-span-7 flex flex-col justify-center gap-4 sm:gap-6 p-5 sm:p-10 rounded-[12px] bg-[#141416] border border-[#222225]">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0066FF] md:text-[#ff6600] uppercase tracking-wider">
                <Terminal className="w-4 h-4" />
                <span>Pour les Développeurs & Automatisation</span>
              </div>
              <h3 className="font-bebas text-2xl sm:text-4xl text-white">
                API REST HAUTE FRÉQUENCE, WEBHOOKS & SDK TYPESCRIPT
              </h3>
              <div className="space-y-3.5 text-xs sm:text-sm text-neutral-300 leading-relaxed">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <Key className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">API REST :</strong> Créez et gérez des milliers de liens courts par seconde avec des temps de réponse sous les 10 ms.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <Webhook className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">Webhooks Événementiels :</strong> Recevez des alertes instantanées sur votre serveur à chaque clic ou conversion.
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-[#0066FF]/20 md:bg-[#ff6600]/20 text-[#0066FF] md:text-[#ff6600] flex items-center justify-center shrink-0 mt-0.5 font-bold text-xs">
                    <Code2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <strong className="text-white">SDK TypeScript Officiel :</strong> Intégrez LShorter dans vos projets Node.js ou Next.js en 3 lignes de code.
                  </div>
                </div>
              </div>
            </div>

            {/* Visual preview box: Code snippet */}
            <div className="lg:col-span-5 p-5 sm:p-6 rounded-[12px] bg-[#0d0d10] border border-[#27272a] flex flex-col justify-between gap-4 font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between pb-3 border-b border-[#222225] text-neutral-400">
                <span className="flex items-center gap-1.5 text-white font-semibold">
                  <Code2 className="w-3.5 h-3.5 text-[#0066FF] md:text-[#ff6600]" /> api.lshorter.com/v1/links
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px]">
                  HTTP 201 Created
                </span>
              </div>

              <div className="p-3.5 sm:p-4 rounded-[8px] bg-[#141416] border border-[#222225] overflow-x-auto text-[11px] text-neutral-300 font-mono leading-relaxed">
                <p className="text-neutral-500">// Création d&apos;un lien avec géo-ciblage</p>
                <p><span className="text-purple-400">const</span> res = <span className="text-blue-400">await</span> lshorter.links.<span className="text-yellow-400">create</span>({`{`}</p>
                <p className="pl-4">targetUrl: <span className="text-emerald-400">&quot;https://myshop.com&quot;</span>,</p>
                <p className="pl-4">slug: <span className="text-emerald-400">&quot;promo-2026&quot;</span>,</p>
                <p className="pl-4">geoTargeting: {`{`} <span className="text-amber-400">FR</span>: <span className="text-emerald-400">&quot;https://myshop.fr&quot;</span> {`}`},</p>
                <p className="pl-4">hideReferrer: <span className="text-red-400">true</span></p>
                <p>{`}`});</p>
              </div>

              <div className="p-3 rounded-[8px] bg-neutral-900/80 border border-neutral-800 text-[11px] text-neutral-300 font-sans">
                ⚡ <strong className="text-white">Clés d&apos;API instantanées :</strong> Générez vos tokens dans votre espace développeur en 1 clic.
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ─────────────────────────────────────────────────────────────
          4. 6-PILLAR TECHNICAL BREAKDOWN GRID
      ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-8 sm:gap-10">
        <div className="text-center flex flex-col items-center gap-2 sm:gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0066FF] md:text-[#ff6600]">
            Panorama Complet
          </span>
          <h2 className="font-bebas text-3xl sm:text-5xl text-white tracking-wide">
            TOUTES LES FONCTIONNALITÉS EN DÉTAIL
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
            Conçu pour les créateurs de contenu, agences marketing, affiliés et développeurs exigeants.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Card 1: Géo-ciblage & Device */}
          <div className="p-6 sm:p-7 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-[#0066FF]/40 md:hover:border-[#ff6600]/40 transition-all flex flex-col gap-4 group shadow-lg">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] bg-[#0066FF]/15 md:bg-[#ff6600]/15 border border-[#0066FF]/30 md:border-[#ff6600]/30 flex items-center justify-center text-[#0066FF] md:text-[#ff6600] group-hover:scale-110 transition-transform">
              <Globe2 className="w-5 h-5 sm:w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#0066FF] md:group-hover:text-[#ff6600] transition-colors">
                Routage Géo & Multi-Appareil
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Inclus dès le plan gratuit ! Détectez en temps réel le pays et l&apos;appareil de chaque visiteur pour router vers la bonne page (iOS, Android, Desktop).
              </p>
            </div>
            <ul className="mt-auto pt-3 border-t border-[#222225] space-y-1.5 text-[11px] text-neutral-400">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Routage iOS vers App Store</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Routage Android vers Google Play</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Règles par pays illimitées</span>
              </li>
            </ul>
          </div>

          {/* Card 2: Cloaking & Referrer */}
          <div className="p-6 sm:p-7 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-[#0066FF]/40 md:hover:border-[#ff6600]/40 transition-all flex flex-col gap-4 group shadow-lg">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] bg-[#0066FF]/15 md:bg-[#ff6600]/15 border border-[#0066FF]/30 md:border-[#ff6600]/30 flex items-center justify-center text-[#0066FF] md:text-[#ff6600] group-hover:scale-110 transition-transform">
              <EyeOff className="w-5 h-5 sm:w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#0066FF] md:group-hover:text-[#ff6600] transition-colors">
                Link Cloaking & No-Referrer
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Gardez votre URL masquée dans une iframe propre. Activez la directive <code className="text-neutral-300">no-referrer</code> pour protéger vos sources d&apos;affiliation.
              </p>
            </div>
            <ul className="mt-auto pt-3 border-t border-[#222225] space-y-1.5 text-[11px] text-neutral-400">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Protection contre le scraping</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Conservation du titre et favicon</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Anonymisation totale des sources</span>
              </li>
            </ul>
          </div>

          {/* Card 3: QR Codes Studio */}
          <div className="p-6 sm:p-7 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-[#0066FF]/40 md:hover:border-[#ff6600]/40 transition-all flex flex-col gap-4 group shadow-lg">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] bg-[#0066FF]/15 md:bg-[#ff6600]/15 border border-[#0066FF]/30 md:border-[#ff6600]/30 flex items-center justify-center text-[#0066FF] md:text-[#ff6600] group-hover:scale-110 transition-transform">
              <QrCode className="w-5 h-5 sm:w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#0066FF] md:group-hover:text-[#ff6600] transition-colors">
                Générateur QR Codes Vectoriels
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Créez des QR codes pour le print et le digital (URLs, Wi-Fi, vCard, e-mails) avec personnalisation des couleurs et insertion de votre logo central.
              </p>
            </div>
            <ul className="mt-auto pt-3 border-t border-[#222225] space-y-1.5 text-[11px] text-neutral-400">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Formats SVG vectoriel & PNG HD</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Correction d&apos;erreur Level H (30%)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Logo de marque intégré au centre</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Mot de passe & Expiration */}
          <div className="p-6 sm:p-7 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-[#0066FF]/40 md:hover:border-[#ff6600]/40 transition-all flex flex-col gap-4 group shadow-lg">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] bg-[#0066FF]/15 md:bg-[#ff6600]/15 border border-[#0066FF]/30 md:border-[#ff6600]/30 flex items-center justify-center text-[#0066FF] md:text-[#ff6600] group-hover:scale-110 transition-transform">
              <Lock className="w-5 h-5 sm:w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#0066FF] md:group-hover:text-[#ff6600] transition-colors">
                Mot de Passe & Expiration
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Protégez l&apos;accès à vos documents confidentiels par mot de passe. Définissez une date de fin ou un plafond maximal de clics avec URL de secours.
              </p>
            </div>
            <ul className="mt-auto pt-3 border-t border-[#222225] space-y-1.5 text-[11px] text-neutral-400">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Passerelle de déverrouillage sécurisée</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Plafond de clics (ex: 500 clics max)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>URL de repli personnalisable</span>
              </li>
            </ul>
          </div>

          {/* Card 5: Analytics 3D & Revenus */}
          <div className="p-6 sm:p-7 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-[#0066FF]/40 md:hover:border-[#ff6600]/40 transition-all flex flex-col gap-4 group shadow-lg">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] bg-[#0066FF]/15 md:bg-[#ff6600]/15 border border-[#0066FF]/30 md:border-[#ff6600]/30 flex items-center justify-center text-[#0066FF] md:text-[#ff6600] group-hover:scale-110 transition-transform">
              <BarChart3 className="w-5 h-5 sm:w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#0066FF] md:group-hover:text-[#ff6600] transition-colors">
                Analytics 3D & Attribution ROI
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Visualisez vos visiteurs sur un Globe 3D interactif. Suivez le chiffre d&apos;affaires généré et téléchargez vos exports Excel et CSV consolidés.
              </p>
            </div>
            <ul className="mt-auto pt-3 border-t border-[#222225] space-y-1.5 text-[11px] text-neutral-400">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Attribution directe du chiffre d&apos;affaires</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Export Excel multi-feuilles (.xls / .csv)</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Constructeur UTM intégré</span>
              </li>
            </ul>
          </div>

          {/* Card 6: Domaines Personnalisés & API */}
          <div className="p-6 sm:p-7 rounded-[12px] bg-[#141416] border border-[#222225] hover:border-[#0066FF]/40 md:hover:border-[#ff6600]/40 transition-all flex flex-col gap-4 group shadow-lg">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] bg-[#0066FF]/15 md:bg-[#ff6600]/15 border border-[#0066FF]/30 md:border-[#ff6600]/30 flex items-center justify-center text-[#0066FF] md:text-[#ff6600] group-hover:scale-110 transition-transform">
              <Terminal className="w-5 h-5 sm:w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-[#0066FF] md:group-hover:text-[#ff6600] transition-colors">
                Domaines Personnalisés & API
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Branchez vos propres domaines avec certificats SSL Cloudflare automatiques. Automatisez la création de liens avec l&apos;API REST et les Webhooks.
              </p>
            </div>
            <ul className="mt-auto pt-3 border-t border-[#222225] space-y-1.5 text-[11px] text-neutral-400">
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Certificats SSL automatiques Cloudflare</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Webhooks événementiels en temps réel</span>
              </li>
              <li className="flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>SDK TypeScript pour Node & Next.js</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          5. COMPARISON SECTION (POURQUOI CHOISIR LSHORTER ?)
          - Mobile Layout: Stacked Comparison Cards (No horizontal truncation)
          - Desktop Layout: Structured Comparison Table
      ───────────────────────────────────────────────────────────── */}
      <section className="rounded-[12px] bg-[#141416] border border-[#222225] p-5 sm:p-10 lg:p-12 flex flex-col gap-6 sm:gap-8 shadow-2xl">
        <div className="text-center flex flex-col items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0066FF] md:text-[#ff6600]">
            Comparatif Technique
          </span>
          <h2 className="font-bebas text-3xl sm:text-5xl text-white tracking-wide">
            POURQUOI CHOISIR LSHORTER ?
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-xl">
            Découvrez comment notre architecture Edge surpasse les raccourcisseurs traditionnels sur tous les critères essentiels.
          </p>
        </div>

        {/* ─── MOBILE VIEW (< md / < 768px): Responsive Dual-Badge Cards (NO CUT-OFF) ─── */}
        <div className="flex flex-col gap-3 md:hidden">
          {comparisonData.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-3.5 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] flex flex-col gap-2.5 shadow-sm"
              >
                {/* Feature Name with Icon */}
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-[6px] bg-[#0066FF]/15 text-[#0066FF] flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-white">{item.label}</span>
                </div>

                {/* LShorter Edge Native vs Raccourcisseurs Classiques */}
                <div className="grid grid-cols-1 gap-1.5 pt-1">
                  {/* LShorter Benefit Badge */}
                  <div className="p-2 rounded-[8px] bg-emerald-500/10 border border-emerald-500/25 flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">LShorter (Edge Native)</p>
                      <p className="text-xs font-semibold text-emerald-200 mt-0.5">{item.lshorter}</p>
                    </div>
                  </div>

                  {/* Classique Muted Badge */}
                  <div className="p-2 rounded-[8px] bg-neutral-900/90 border border-neutral-800 flex items-start gap-2">
                    <X className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">Raccourcisseurs Classiques</p>
                      <p className="text-xs text-neutral-400 mt-0.5">{item.others}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ─── DESKTOP VIEW (>= md / >= 768px): Structured Comparison Table ─── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#27272a] text-neutral-400">
                <th className="py-4 px-4 font-semibold text-white">Critères & Fonctionnalités</th>
                <th className="py-4 px-4 font-bold text-[#ff6600] bg-[#ff6600]/10 rounded-t-[8px]">
                  LShorter (Edge Native)
                </th>
                <th className="py-4 px-4 font-normal text-neutral-500">Raccourcisseurs Classiques (Bitly, etc.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#222225]">
              {comparisonData.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <tr key={idx}>
                    <td className="py-3.5 px-4 font-medium text-white flex items-center gap-2">
                      <Icon className="w-4 h-4 text-[#ff6600] shrink-0" />
                      <span>{item.label}</span>
                    </td>
                    <td className="py-3.5 px-4 font-bold text-emerald-400 bg-[#ff6600]/5">
                      {item.lshorter}
                    </td>
                    <td className="py-3.5 px-4 text-neutral-400">{item.others}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          6. FREQUENTLY ASKED QUESTIONS (FAQ ACCORDION)
      ───────────────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-6 sm:gap-10 max-w-4xl mx-auto w-full">
        <div className="text-center flex flex-col items-center gap-2 sm:gap-3">
          <span className="text-xs font-bold uppercase tracking-widest text-[#0066FF] md:text-[#ff6600]">
            Des Réponses Claires
          </span>
          <h2 className="font-bebas text-3xl sm:text-5xl text-white tracking-wide">
            FOIRE AUX QUESTIONS
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400">
            Toutes les réponses à vos questions techniques et commerciales.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {[
            {
              q: "Comment fonctionne la redirection sub-milliseconde (< 1 ms) ?",
              a: "Contrairement aux architectures traditionnelles où chaque clic exécute une requête SQL lourde sur un serveur distant, LShorter déploie votre table de redirection sur le réseau mondial Cloudflare KV. Votre lien est résolu directement dans la mémoire vive du point d'accès le plus proche du visiteur, éliminant tout délai de chargement."
            },
            {
              q: "Qu'est-ce que le Link Cloaking et comment protège-t-il mes liens ?",
              a: "Le cloaking affiche votre contenu cible à l'intérieur d'un conteneur iframe fluide tout en maintenant votre nom de domaine raccourci dans la barre d'adresse de l'utilisateur. Cela empêche les internautes ou concurrents de modifier votre lien d'affiliation et d'écraser vos cookies de commission."
            },
            {
              q: "Comment fonctionne le masquage de référent (Referrer Hiding) ?",
              a: "Lorsque vous activez cette option, LShorter transmet la directive de sécurité HTTP 'Referrer-Policy: no-referrer'. Le site web de destination recevra le clic en tant que trafic 'Direct', sans aucune indication de votre site source, de vos comptes publicitaires ou de vos paramètres privés."
            },
            {
              q: "Puis-je utiliser mes propres noms de domaine de marque ?",
              a: "Absolument. Vous pouvez connecter vos domaines et sous-domaines (ex: link.maboutique.com). LShorter provisionne et gère automatiquement le certificat SSL/TLS pour garantir un cadenas vert et une sécurité HTTPS irréprochable sans aucune manipulation technique de votre part."
            },
            {
              q: "Pourquoi utiliser Bunny.net pour les bannières OpenGraph ?",
              a: "Bunny.net est un réseau de diffusion de contenu (CDN) ultra-performant et économique. En hébergeant vos bannières 1200×630 sur Bunny CDN, vos aperçus d'images sur les réseaux sociaux (Facebook, X, LinkedIn, WhatsApp) se chargent instantanément sans ralentir votre trafic."
            },
            {
              q: "Les données d'analyse respectent-elles le RGPD / GDPR ?",
              a: "Oui, à 100%. LShorter applique une anonymisation stricte des adresses IP dès l'interception au niveau de l'Edge et ne dépose aucun cookie traceur invasif sur les appareils de vos visiteurs. Vous restez en conformité totale avec les réglementations européennes."
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="rounded-[10px] bg-[#141416] border border-[#222225] overflow-hidden transition-all"
            >
              <button
                type="button"
                onClick={() => toggleFaq(idx)}
                className="w-full p-4 sm:p-6 text-left flex items-center justify-between gap-4 text-xs sm:text-base font-bold text-white hover:text-[#0066FF] md:hover:text-[#ff6600] transition-colors cursor-pointer"
              >
                <span>{item.q}</span>
                <ChevronDown
                  className={`w-4 h-4 text-neutral-400 shrink-0 transition-transform duration-200 ${
                    openFaq === idx ? "rotate-180 text-[#0066FF] md:text-[#ff6600]" : ""
                  }`}
                />
              </button>
              {openFaq === idx && (
                <div className="px-4 sm:px-6 pb-4 sm:pb-6 text-xs sm:text-sm text-neutral-300 leading-relaxed border-t border-[#222225]/60 pt-3 sm:pt-4 animate-in fade-in duration-150">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────
          7. FINAL CONVERSION CTA (Clean Mobile & Desktop Layout)
      ───────────────────────────────────────────────────────────── */}
      <section className="text-center p-6 sm:p-14 lg:p-20 rounded-[12px] bg-gradient-to-b from-[#141416] via-[#111114] to-[#09090b] border border-[#0066FF]/30 md:border-[#ff6600]/30 shadow-2xl flex flex-col items-center gap-5 sm:gap-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[200px] sm:h-[300px] bg-[#0066FF]/15 md:bg-[#ff6600]/15 rounded-full blur-[100px] pointer-events-none -z-0" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#0066FF]/15 md:bg-[#ff6600]/15 border border-[#0066FF]/30 md:border-[#ff6600]/30 text-xs font-bold text-[#0066FF] md:text-[#ff6600]">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Prêt à booster vos conversions dès aujourd&apos;hui ?</span>
        </div>

        <h2 className="font-bebas text-3xl sm:text-6xl lg:text-7xl text-white tracking-wide max-w-3xl leading-[0.95] z-10">
          REJOIGNEZ DES MILLIERS DE CRÉATEURS ET D&apos;ENTREPRISES
        </h2>

        <p className="text-xs sm:text-sm lg:text-base text-neutral-300 max-w-xl z-10 leading-relaxed px-2">
          Créez votre compte en moins de 30 secondes, raccourcissez vos liens et profitez de <strong className="text-white">100 000 clics gratuits chaque mois</strong>.
        </p>

        {/* Clean Stacked Layout on Mobile, Inline on Desktop */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2 z-10 w-full max-w-xs sm:max-w-none sm:w-auto justify-center">
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              variant="glow"
              size="lg"
              className="w-full sm:w-auto font-bebas text-xl sm:text-2xl px-6 sm:px-10 py-3.5 sm:py-5 tracking-wider shadow-xl shadow-[#0066FF]/30 md:shadow-[#ff6600]/30 hover:scale-105 transition-transform rounded-[10px] h-auto leading-normal whitespace-nowrap bg-[#0066FF] md:bg-[#ff6600]"
            >
              CRÉER MON PREMIER LIEN COURT
            </Button>
          </Link>
          <Link href="/pricing" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto font-bebas text-xl sm:text-2xl px-6 sm:px-8 py-3.5 sm:py-5 tracking-wide text-neutral-300 rounded-[10px] border-[#27272a] hover:bg-white/5 hover:text-white h-auto leading-normal whitespace-nowrap"
            >
              CONSULTER LES FORFAITS
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
