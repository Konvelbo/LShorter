"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "motion/react";
import {
  Check,
  X as XIcon,
  Terminal,
  Users,
  Code2,
  Megaphone,
  Building2,
  Link2,
  ArrowRight,
  Globe,
  ShieldCheck,
  Lock,
  Download,
  Gauge,
  Activity,
  DollarSign,
  Smartphone,
  QrCode,
  Share2,
} from "lucide-react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import {
  SplitDeveloperHero,
  type CodeTab,
} from "@/components/ui/split-developer-hero-with-interactive-code-terminal";
import {
  Pricing,
  type PricingPlan,
  type EnterpriseBannerPlan,
  type PaidPlanId,
  type BillingCycle,
} from "@/components/ui/pricing";
import { showToast } from "@/components/ui/toast-provider";
import { PRICING_PLANS } from "@/src/config/pricing";
import {
  EASE_OUT_EXPO,
  SectionRailFrame,
  scrollToHeroShortener,
} from "@/components/marketing/swiss-frame";
import { useI18n } from "@/components/providers/i18n-provider";

// ============================================================================
// 5. THE LSHORTER DIFFERENCE (#difference — Clean Borderless Editorial Table)
// ============================================================================
export function DifferenceSection() {
  const { tr } = useI18n();

  const comparisonRows = useMemo(
    () => [
      {
        id: "pathlock",
        feature: tr(
          "Post-click perimeter control (PathLock™)",
          "Contrôle périmétrique post-clic (PathLock™)"
        ),
        others: tr(
          "Stops working after the redirect — visitors can explore your entire site",
          "S'arrête après la redirection — les visiteurs peuvent explorer tout votre site"
        ),
        lshorter: tr(
          "Locks visitors strictly inside your authorized URL prefix (e.g. /app/dashboard/*)",
          "Verrouille strictement les visiteurs dans le préfixe d'URL autorisé (ex. /app/dashboard/*)"
        ),
      },
      {
        id: "caps",
        feature: tr(
          "Self-destructing click caps + fallback",
          "Quotas de clics auto-expirants + secours"
        ),
        others: tr(
          "Not included or locked behind custom enterprise contracts",
          "Non inclus ou réservé aux contrats entreprise sur mesure"
        ),
        lshorter: tr(
          "Deactivate at an exact click count or redirect to a fallback URL",
          "Désactivation à un nombre exact de clics ou redirection vers une URL de secours"
        ),
      },
      {
        id: "edge-routing",
        feature: tr(
          "Multi-condition Edge routing (< 12ms)",
          "Routage Edge multi-conditions (< 12 ms)"
        ),
        others: tr(
          "1 static URL per link, centralized redirects (80–150ms)",
          "1 URL statique par lien, redirections centralisées (80–150 ms)"
        ),
        lshorter: tr(
          "Route 1 link by country, OS, device, browser, or weighted A/B split on 310+ PoPs",
          "Routez 1 lien par pays, OS, appareil, navigateur ou test A/B pondéré sur 310+ PoP"
        ),
      },
      {
        id: "masking",
        feature: tr(
          "White-label masking & password protection",
          "Masquage marque blanche et mot de passe"
        ),
        others: tr(
          "Exposes the raw destination URL immediately in the address bar",
          "Expose immédiatement l'URL de destination brute dans la barre d'adresse"
        ),
        lshorter: tr(
          "Masked viewer with custom OpenGraph cards and password challenge",
          "Visionneuse masquée avec cartes OpenGraph personnalisées et protection par mot de passe"
        ),
      },
      {
        id: "qr",
        feature: tr(
          "Editable Vector QR Studio (15 styles)",
          "QR Studio vectoriel modifiable (15 styles)"
        ),
        others: tr(
          "Basic bitmap QR or paid $35+/mo add-on",
          "QR bitmap basique ou option payante à 35 $+/mois"
        ),
        lshorter: tr(
          "15 pixel styles, brand gradients, SVG/PNG/GIF export — editable after print",
          "15 styles de pixels, dégradés de marque, export SVG/PNG/GIF — modifiable après impression"
        ),
      },
      {
        id: "attribution",
        feature: tr(
          "Cookie-free revenue attribution",
          "Attribution des revenus sans cookies"
        ),
        others: tr(
          "Raw click counts only — no visibility into which link produced sales",
          "Simple compteur de clics — aucune visibilité sur le lien qui génère des ventes"
        ),
        lshorter: tr(
          "Attributes signups and revenue conversions directly back to each short slug",
          "Attribue les inscriptions et revenus convertis directement à chaque lien court"
        ),
      },
      {
        id: "starter",
        feature: tr(
          "Free Starter plan (verified limits)",
          "Forfait Starter gratuit (limites vérifiées)"
        ),
        others: tr(
          "Bitly Free: 5 links/month, 0 custom domains, basic stats",
          "Bitly Gratuit : 5 liens/mois, 0 domaine personnalisé, stats basiques"
        ),
        lshorter: tr(
          "50 permanent links, 10,000 clicks/month, 3 custom domains, real-time analytics",
          "50 liens permanents, 10 000 clics/mois, 3 domaines personnalisés, analyses en temps réel"
        ),
      },
    ],
    [tr]
  );

  return (
    <section
      id="difference"
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] py-24 sm:py-32 border-t border-[#E4E7EC] dark:border-white/[0.08] scroll-mt-20 overflow-x-clip transition-colors duration-300"
    >
      <SectionRailFrame>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end mb-12">
          <div className="lg:col-span-7">
            <h2 className="text-[30px] sm:text-[40px] font-semibold tracking-[-0.03em] leading-[1.08] text-[#09090B] dark:text-white text-balance">
              {tr(
                "Why teams move off legacy redirectors",
                "Pourquoi les équipes quittent les raccourcisseurs classiques"
              )}
            </h2>
          </div>
          <div className="lg:col-span-5">
            <p className="text-[15.5px] text-[#52525B] dark:text-zinc-400 leading-[1.6] text-pretty">
              {tr(
                "Traditional shorteners stop helping the millisecond a 302 fires. LShorter keeps routing, isolating perimeters, and attributing revenue end to end.",
                "Les raccourcisseurs traditionnels s'arrêtent dès qu'une redirection 302 part. LShorter continue de router, d'isoler vos périmètres et d'attribuer vos revenus de bout en bout."
              )}
            </p>
          </div>
        </div>

        {/* Full-Width Horizontal-Rule Comparison — Zero Horizontal Scroll on Any Viewport */}
        {/* Mobile (< 640px): Identical borderless editorial rows with full-width capability + 2-column side-by-side comparison */}
        <div className="sm:hidden w-full">
          <div className="grid grid-cols-2 gap-4 pb-3 border-b border-[#D4D4D8] dark:border-white/15 text-[12px] font-medium">
            <span className="text-[#71717A] dark:text-zinc-400 leading-snug">
              {tr(
                "Traditional shorteners (Bitly, TinyURL)",
                "Raccourcisseurs classiques (Bitly, TinyURL)"
              )}
            </span>
            <span className="text-[#0066FF] dark:text-[#6CA8FF] leading-snug">
              LShorter
            </span>
          </div>
          <div className="divide-y divide-[#E4E7EC] dark:divide-white/[0.08]">
            {comparisonRows.map((row) => (
              <div key={row.id} className="py-4">
                <div className="text-[13.5px] font-medium text-[#09090B] dark:text-white leading-snug mb-2.5">
                  {row.feature}
                </div>
                <div className="grid grid-cols-2 gap-4 text-[12.5px] leading-[1.48]">
                  <div className="min-w-0 flex items-start gap-1.5 text-[#71717A] dark:text-zinc-400">
                    <XIcon className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-600 shrink-0 mt-0.5" />
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {row.others}
                    </span>
                  </div>
                  <div className="min-w-0 flex items-start gap-1.5 text-[#09090B] dark:text-zinc-100 font-medium">
                    <Check className="w-3.5 h-3.5 text-[#0066FF] dark:text-[#6CA8FF] shrink-0 mt-0.5 stroke-[2.25]" />
                    <span className="min-w-0 [overflow-wrap:anywhere]">
                      {row.lshorter}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tablet & Desktop (>= 640px): Exact 3-column horizontal-rule table occupying 100% width with zero scrollbar */}
        <div className="hidden sm:block w-full">
          <table className="w-full table-fixed text-left border-collapse">
            <thead>
              <tr className="border-b border-[#D4D4D8] dark:border-white/15 text-[12.5px] md:text-[13px] font-medium">
                <th className="py-3.5 pr-3 md:pr-6 text-[#71717A] dark:text-zinc-400 w-[28%]">
                  {tr("Capability", "Capacité")}
                </th>
                <th className="py-3.5 px-3 md:px-6 text-[#71717A] dark:text-zinc-400 w-[34%]">
                  {tr(
                    "Traditional shorteners (Bitly, TinyURL)",
                    "Raccourcisseurs classiques (Bitly, TinyURL)"
                  )}
                </th>
                <th className="py-3.5 pl-3 md:pl-6 text-[#0066FF] dark:text-[#6CA8FF] w-[38%]">
                  LShorter
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] dark:divide-white/[0.08] text-[13px] md:text-[14px]">
              {comparisonRows.map((row) => (
                <tr
                  key={row.id}
                  className="hover:bg-[#F8F9FB] dark:hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-4 pr-3 md:pr-6 font-medium text-[#09090B] dark:text-white align-top break-words">
                    {row.feature}
                  </td>
                  <td className="py-4 px-3 md:px-6 text-[#71717A] dark:text-zinc-400 align-top">
                    <div className="flex items-start gap-2 md:gap-2.5">
                      <XIcon className="w-4 h-4 text-zinc-400 dark:text-zinc-600 shrink-0 mt-0.5" />
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        {row.others}
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pl-3 md:pl-6 text-[#09090B] dark:text-zinc-100 font-medium align-top">
                    <div className="flex items-start gap-2 md:gap-2.5">
                      <Check className="w-4 h-4 text-[#0066FF] dark:text-[#6CA8FF] shrink-0 mt-0.5 stroke-[2.25]" />
                      <span className="min-w-0 [overflow-wrap:anywhere]">
                        {row.lshorter}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-10 pt-6 border-t border-[#E4E7EC] dark:border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <span className="text-[14px] text-[#71717A] dark:text-zinc-400">
            {tr(
              "50 permanent links and 3 custom domains free forever.",
              "50 liens permanents et 3 domaines personnalisés gratuits à vie."
            )}
          </span>
          <WaveRevealButton
            href="/#hero-shortener"
            onClick={scrollToHeroShortener}
            variant="outline"
            size="md"
            icon={<Link2 className="w-4 h-4" />}
          >
            {tr("Shorten a link now", "Raccourcir un lien maintenant")}
          </WaveRevealButton>
        </div>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 6. USE CASES BY PROFILE (Segmented Tab Bar + Split Interactive Governance Card)
// ============================================================================
interface UseCaseRuleRow {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  verifiedDot?: boolean;
}

interface UseCaseBarRow {
  label: string;
  percent: number;
  count: string;
}

interface UseCaseItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  eyebrow: string;
  headline: string;
  bullets: string[];
  shortUrl: string;
  destination: string;
  status: string;
  rules: UseCaseRuleRow[];
  chartTitle: string;
  chartSub: string;
  actionLabel: string;
  actionDoneLabel: string;
  bars: UseCaseBarRow[];
}

export function UseCasesSection() {
  const { isFr, tr, formatNumber } = useI18n();
  const [activeId, setActiveId] = useState("agencies");
  const [exportedId, setExportedId] = useState<string | null>(null);

  const useCases = useMemo<UseCaseItem[]>(
    () => [
      {
        id: "founders",
        label: tr("SaaS founders & devs", "Fondateurs SaaS & devs"),
        icon: Code2,
        eyebrow: tr(
          "For SaaS teams shipping staging demos & private betas",
          "Pour les équipes SaaS livrant des démos de staging et bêtas privées"
        ),
        headline: tr(
          "Lock beta testers inside /app/dashboard/* and auto-close invites after 25 clicks",
          "Verrouillez vos bêta-testeurs dans /app/dashboard/* et fermez les invitations après 25 clics"
        ),
        bullets: [
          tr(
            "Prevent beta testers from exploring unfinished routes with PathLock™",
            "Empêchez les testeurs d'explorer des routes non finalisées avec PathLock™"
          ),
          tr(
            "Cap private invite batches with exact click limits and waitlist fallback",
            "Plafonnez vos lots d'invitations avec des quotas précis et une liste d'attente"
          ),
          tr(
            "Automate link provisioning directly from CI/CD via REST API",
            "Automatisez la création de liens depuis votre CI/CD via l'API REST"
          ),
        ],
        shortUrl: "go.acmesaas.io/beta-v2",
        destination: "staging.acmesaas.io/app/dashboard/overview",
        status: tr("Live", "Actif"),
        rules: [
          {
            icon: ShieldCheck,
            label: tr("PathLock™ prefix", "Préfixe PathLock™"),
            value: "/app/dashboard/*",
            verifiedDot: true,
          },
          {
            icon: Gauge,
            label: tr("Click cap", "Quota de clics"),
            value: tr("19 / 25 clicks", "19 / 25 clics"),
          },
          {
            icon: Terminal,
            label: tr("Provisioning", "Provisionnement"),
            value: "REST API · CI/CD",
          },
        ],
        chartTitle: tr("Route activity", "Activité par route"),
        chartSub: tr("Last 7 days", "7 derniers jours"),
        actionLabel: tr("Export CSV", "Exporter CSV"),
        actionDoneLabel: tr("Exported", "Exporté"),
        bars: [
          { label: "/dashboard", percent: 100, count: formatNumber(142) },
          { label: "/metrics", percent: 64, count: formatNumber(91) },
          { label: "/admin", percent: 18, count: formatNumber(26) },
          { label: "/billing", percent: 11, count: formatNumber(15) },
        ],
      },
      {
        id: "marketers",
        label: tr("Affiliates & marketers", "Affiliés & marketeurs"),
        icon: Megaphone,
        eyebrow: tr(
          "For growth teams running paid campaigns across regions",
          "Pour les équipes growth pilotant des campagnes payantes internationales"
        ),
        headline: tr(
          "Route every region to its local offer, fire ad pixels and track attributed revenue",
          "Routez chaque région vers son offre locale, déclenchez vos pixels et suivez vos revenus attribués"
        ),
        bullets: [
          tr(
            "Split-test two landing pages with weighted A/B routing on one link",
            "Testez deux pages de destination grâce au routage A/B pondéré sur un seul lien"
          ),
          tr(
            "Fire Meta Ads, Google Ads, and TikTok retargeting pixels automatically",
            "Déclenchez automatiquement les pixels Meta Ads, Google Ads et TikTok"
          ),
          tr(
            "Connect conversion webhooks to see exact revenue per short link",
            "Connectez vos webhooks de conversion pour connaître le revenu exact par lien"
          ),
        ],
        shortUrl: "deals.brand.co/spring",
        destination: "brand.co/offers/spring-campaign",
        status: tr("Live", "Actif"),
        rules: [
          {
            icon: Globe,
            label: tr("Geo & A/B split", "Géo & test A/B"),
            value: "FR → /fr · 50/50",
            verifiedDot: true,
          },
          {
            icon: Activity,
            label: tr("Retargeting pixels", "Pixels retargeting"),
            value: "Meta · TikTok",
          },
          {
            icon: DollarSign,
            label: tr("Attributed revenue", "Revenu attribué"),
            value: isFr ? "4 820 $" : "$4,820",
          },
        ],
        chartTitle: tr("Clicks by country", "Clics par pays"),
        chartSub: tr("Last 7 days", "7 derniers jours"),
        actionLabel: tr("Export CSV", "Exporter CSV"),
        actionDoneLabel: tr("Exported", "Exporté"),
        bars: [
          { label: tr("France", "France"), percent: 100, count: formatNumber(2140) },
          {
            label: tr("United States", "États-Unis"),
            percent: 72,
            count: formatNumber(1538),
          },
          {
            label: tr("United Kingdom", "Royaume-Uni"),
            percent: 44,
            count: formatNumber(942),
          },
          { label: tr("Canada", "Canada"), percent: 29, count: formatNumber(618) },
        ],
      },
      {
        id: "creators",
        label: tr("Creators", "Créateurs"),
        icon: Users,
        eyebrow: tr(
          "For creators sharing drops across Instagram, YouTube & TikTok",
          "Pour les créateurs partageant leurs sorties sur Instagram, YouTube et TikTok"
        ),
        headline: tr(
          "Send iOS followers to the App Store, Android to Google Play and track live clicks",
          "Envoyez vos abonnés iOS sur l'App Store, Android sur Google Play et suivez vos clics en direct"
        ),
        bullets: [
          tr(
            "Smart OS detection routes iOS, Android, and desktop visitors automatically",
            "La détection d'OS route automatiquement vos visiteurs iOS, Android et ordinateur"
          ),
          tr(
            "Custom OpenGraph cards so links look sharp on X, LinkedIn, and Discord",
            "Cartes OpenGraph sur mesure pour des aperçus soignés sur X, LinkedIn et Discord"
          ),
          tr(
            "Branded vector QR codes for merch, slides, and live events",
            "QR codes vectoriels à votre image pour vos produits, slides et événements"
          ),
        ],
        shortUrl: "lsho.cc/creator-kit",
        destination: "apps.apple.com/app/creator-kit",
        status: tr("Live", "Actif"),
        rules: [
          {
            icon: Smartphone,
            label: tr("Smart OS routing", "Routage OS intelligent"),
            value: "iOS · Android · Web",
            verifiedDot: true,
          },
          {
            icon: QrCode,
            label: tr("Dynamic QR code", "QR code dynamique"),
            value: tr("SVG · Branded", "SVG · Personnalisé"),
          },
          {
            icon: Share2,
            label: tr("OpenGraph card", "Carte OpenGraph"),
            value: tr("Custom preview", "Aperçu sur mesure"),
          },
        ],
        chartTitle: tr("Clicks by device", "Clics par appareil"),
        chartSub: tr("Last 7 days", "7 derniers jours"),
        actionLabel: tr("Export CSV", "Exporter CSV"),
        actionDoneLabel: tr("Exported", "Exporté"),
        bars: [
          { label: "iOS", percent: 100, count: formatNumber(3412) },
          { label: "Android", percent: 58, count: formatNumber(1978) },
          {
            label: tr("Desktop", "Ordinateur"),
            percent: 27,
            count: formatNumber(924),
          },
          {
            label: tr("QR Scans", "Scans QR"),
            percent: 19,
            count: formatNumber(648),
          },
        ],
      },
      {
        id: "agencies",
        label: tr("Agencies", "Agences"),
        icon: Building2,
        eyebrow: tr(
          "For agencies running campaigns for multiple clients",
          "Pour les agences pilotant des campagnes pour plusieurs clients"
        ),
        headline: tr(
          "Give every client a verified short domain, live geo reports and password-protected previews",
          "Offrez à chaque client un domaine court vérifié, des rapports géo en direct et des aperçus protégés"
        ),
        bullets: [
          tr(
            "Connect up to 15 custom client domains with automated DNS and SSL",
            "Connectez jusqu'à 15 domaines clients avec DNS et SSL automatisés"
          ),
          tr(
            "Export clean CSV/Excel reports for every client campaign in one click",
            "Exportez des rapports CSV/Excel propres pour chaque campagne client en un clic"
          ),
          tr(
            "Protect confidential pitch decks and client previews behind a password",
            "Protégez vos présentations confidentielles et aperçus clients par mot de passe"
          ),
        ],
        shortUrl: "go.clientbrand.com/q4",
        destination: "clientbrand.com/campaigns/q4-launch",
        status: tr("Live", "Actif"),
        rules: [
          {
            icon: Globe,
            label: tr("Custom domain", "Domaine personnalisé"),
            value: tr("Verified", "Vérifié"),
            verifiedDot: true,
          },
          {
            icon: ShieldCheck,
            label: tr("SSL certificate", "Certificat SSL"),
            value: tr("Active", "Actif"),
          },
          {
            icon: Lock,
            label: tr("Password", "Mot de passe"),
            value: tr("Required", "Requis"),
          },
        ],
        chartTitle: tr("Clicks by country", "Clics par pays"),
        chartSub: tr("Last 7 days", "7 derniers jours"),
        actionLabel: tr("Export CSV", "Exporter CSV"),
        actionDoneLabel: tr("Exported", "Exporté"),
        bars: [
          {
            label: tr("United States", "États-Unis"),
            percent: 100,
            count: formatNumber(1284),
          },
          {
            label: tr("Germany", "Allemagne"),
            percent: 50,
            count: formatNumber(642),
          },
          { label: tr("France", "France"), percent: 33, count: formatNumber(418) },
          { label: tr("Brazil", "Brésil"), percent: 23, count: formatNumber(291) },
        ],
      },
    ],
    [isFr, tr, formatNumber]
  );

  const current = useCases.find((u) => u.id === activeId) || useCases[3];

  const handlePreviewExport = (id: string) => {
    setExportedId(id);
    window.setTimeout(() => {
      setExportedId((prev) => (prev === id ? null : prev));
    }, 1600);
  };

  return (
    <section className="w-full bg-[#f7f8fa] dark:bg-[#0D0E12] py-20 sm:py-24 border-t border-[#0f1217]/[0.08] dark:border-white/[0.08] overflow-x-clip transition-colors duration-300">
      <SectionRailFrame>
        <div className="flex flex-col gap-8">
          <h2 className="m-0 text-[32px] sm:text-[44px] leading-[1.16] font-semibold tracking-[-0.03em] text-[#0f1217] dark:text-white text-balance">
            {tr(
              "Tailored to how your team ships",
              "Adapté à la façon dont votre équipe livre"
            )}
          </h2>

          {/* Segmented Tab Bar */}
          <div
            role="tablist"
            aria-label={tr("Audience", "Public")}
            className="self-start inline-flex flex-wrap sm:flex-nowrap items-center gap-1 p-1 bg-white dark:bg-[#14151B] border border-[#0f1217]/[0.09] dark:border-white/[0.10] rounded-[10px] max-w-full"
          >
            {useCases.map((tab) => {
              const Icon = tab.icon;
              const isSelected = tab.id === activeId;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveId(tab.id)}
                  className={`relative h-9 px-3.5 inline-flex items-center gap-2 rounded-[6px] text-[14px] font-medium transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-[#1f5fe0] focus-visible:outline-offset-2 ${
                    isSelected
                      ? "text-[#0f1217] dark:text-white"
                      : "text-[#5b6270] dark:text-zinc-400 hover:text-[#0f1217] dark:hover:text-white"
                  }`}
                >
                  {isSelected && (
                    <motion.span
                      layoutId="use-case-pill"
                      transition={{ type: "spring", stiffness: 460, damping: 38 }}
                      className="absolute inset-0 rounded-[6px] bg-[#eef0f4] dark:bg-white/[0.11] border border-[#0f1217]/[0.10] dark:border-white/[0.14] z-0"
                    />
                  )}
                  <Icon className="w-4 h-4 relative z-10 shrink-0 stroke-[1.6]" />
                  <span className="relative z-10 whitespace-nowrap">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Split Panel Card */}
          <div
            data-parallax="float"
            data-parallax-depth="0.055"
            data-parallax-max="26"
            className="bg-white dark:bg-[#121319] border border-[#0f1217]/[0.09] dark:border-white/[0.09] rounded-[10px] overflow-hidden"
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                role="tabpanel"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.22, ease: EASE_OUT_EXPO }}
                className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr]"
              >
                {/* Left Column: Narrative + Bullets + Primary CTA */}
                <div className="p-7 sm:p-10 flex flex-col justify-between gap-8">
                  <div className="flex flex-col gap-8">
                    <div className="flex flex-col gap-3">
                      <span className="text-[14px] leading-5 font-medium text-[#5b6270] dark:text-zinc-400">
                        {current.eyebrow}
                      </span>
                      <h3 className="m-0 text-[24px] sm:text-[30px] leading-[1.33] font-semibold tracking-[-0.02em] text-[#0f1217] dark:text-white text-balance">
                        {current.headline}
                      </h3>
                    </div>

                    <ul className="flex flex-col gap-3">
                      {current.bullets.map((b, bIdx) => (
                        <li
                          key={bIdx}
                          className="flex items-start gap-3 text-[15px] leading-6 text-[#4a5160] dark:text-zinc-300"
                        >
                          <Check className="w-4 h-4 shrink-0 mt-1 stroke-[1.6] text-[#4a5160] dark:text-zinc-400" />
                          <span>{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <a
                    href="/#hero-shortener"
                    onClick={scrollToHeroShortener}
                    className="self-start h-11 px-5 inline-flex items-center gap-2.5 bg-[#1f5fe0] hover:bg-[#1a52c4] text-white rounded-[8px] text-[15px] font-medium transition-[background-color,border-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow focus-visible:outline-2 focus-visible:outline-[#1f5fe0] focus-visible:outline-offset-2"
                  >
                    <span>
                      {tr(
                        "Try this workflow without signup",
                        "Tester ce flux sans inscription"
                      )}
                    </span>
                    <ArrowRight className="w-4 h-4 stroke-[1.75]" />
                  </a>
                </div>

                {/* Right Column: Elevated Live Link Governance Card */}
                <div className="p-6 sm:p-8 bg-[#f1f3f6] dark:bg-[#0A0B0F] border-t lg:border-t-0 lg:border-l border-[#0f1217]/[0.09] dark:border-white/[0.08] flex flex-col justify-center">
                  <div className="bg-white dark:bg-[#15171F] border border-[#0f1217]/[0.10] dark:border-white/[0.10] rounded-[8px] shadow-[0_1px_2px_rgba(15,18,23,0.06),0_8px_24px_rgba(15,18,23,0.06)] dark:shadow-[0_12px_32px_rgba(0,0,0,0.45)] overflow-hidden">
                    {/* Link Header */}
                    <div className="px-5 pt-5 pb-4 flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-[17px] sm:text-[18px] leading-7 font-medium text-[#1f5fe0] dark:text-[#60A5FA] truncate">
                          {current.shortUrl}
                        </span>
                        <span className="inline-flex items-center gap-2 text-[13px] text-[#4a5160] dark:text-zinc-300 shrink-0">
                          <span className="w-2 h-2 rounded-full bg-[#2f8f5b] dark:bg-emerald-400" />
                          {current.status}
                        </span>
                      </div>
                      <span className="font-mono text-[13px] leading-5 text-[#5b6270] dark:text-zinc-400 truncate">
                        {current.destination}
                      </span>
                    </div>

                    {/* Structured Governance Rows */}
                    <div className="border-t border-[#0f1217]/[0.08] dark:border-white/[0.08]">
                      {current.rules.map((rule, idx) => {
                        const RuleIcon = rule.icon;
                        return (
                          <div
                            key={idx}
                            className={`h-11 px-5 flex items-center gap-3 text-[14px] ${
                              idx > 0
                                ? "border-t border-[#0f1217]/[0.08] dark:border-white/[0.08]"
                                : ""
                            }`}
                          >
                            <RuleIcon className="w-4 h-4 shrink-0 text-[#4a5160] dark:text-zinc-400 stroke-[1.6]" />
                            <span className="flex-1 text-[#4a5160] dark:text-zinc-400 truncate">
                              {rule.label}
                            </span>
                            <span className="inline-flex items-center gap-2 text-[#0f1217] dark:text-white font-normal shrink-0">
                              {rule.verifiedDot && (
                                <span className="w-2 h-2 rounded-full bg-[#2f8f5b] dark:bg-emerald-400" />
                              )}
                              {rule.value}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {/* Country / Activity Breakdown + Ghost Export Button */}
                    <div className="border-t border-[#0f1217]/[0.08] dark:border-white/[0.08] px-5 pt-4 pb-5 flex flex-col gap-3.5">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[14px] leading-5 font-medium text-[#0f1217] dark:text-white">
                            {current.chartTitle}
                          </span>
                          <span className="text-[13px] leading-4 text-[#5b6270] dark:text-zinc-400">
                            {current.chartSub}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePreviewExport(current.id)}
                          className="h-8 px-3 inline-flex items-center gap-2 bg-white dark:bg-white/[0.04] hover:bg-[#f1f3f6] dark:hover:bg-white/[0.09] border border-[#0f1217]/[0.14] dark:border-white/[0.14] rounded-[6px] text-[#0f1217] dark:text-zinc-200 text-[13px] font-medium transition-[background-color,border-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow cursor-pointer shrink-0 focus-visible:outline-2 focus-visible:outline-[#1f5fe0] focus-visible:outline-offset-2"
                        >
                          {exportedId === current.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-[#2f8f5b] dark:text-emerald-400" />
                              <span>{current.actionDoneLabel}</span>
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5 stroke-[1.6]" />
                              <span>{current.actionLabel}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 text-[13px] text-[#4a5160] dark:text-zinc-400">
                        {current.bars.map((bar, idx) => (
                          <div
                            key={idx}
                            className="grid grid-cols-[112px_1fr_56px] items-center gap-3"
                          >
                            <span className="truncate">{bar.label}</span>
                            <span className="h-1 rounded-[2px] bg-[#e6e9ee] dark:bg-white/[0.08] overflow-hidden">
                              <motion.span
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: bar.percent / 100 }}
                                transition={{
                                  duration: 0.45,
                                  delay: 0.05 + idx * 0.05,
                                  ease: EASE_OUT_EXPO,
                                }}
                                style={{ transformOrigin: "left" }}
                                className={`block w-full h-1 rounded-[2px] ${
                                  idx === 0
                                    ? "bg-[#1f5fe0] dark:bg-[#3B82F6]"
                                    : "bg-[#aeb5c1] dark:bg-zinc-600"
                                }`}
                              />
                            </span>
                            <span className="text-right font-mono tabular-nums text-[#0f1217] dark:text-zinc-200 whitespace-nowrap">
                              {bar.count}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 7. DEVELOPER-FIRST REST API & WEBHOOKS (#api)
// ============================================================================
const DEVELOPER_API_TABS: CodeTab[] = [
  {
    label: "cURL",
    language: "bash",
    code: `curl -X POST https://lsho.cc/api/v1/links \\
  -H "Authorization: Bearer lsh_live_9f8a2c..." \\
  -H "Content-Type: application/json" \\
  -d '{
    "targetUrl": "https://app.acmesaas.io/app/dashboard",
    "slug": "beta-demo",
    "maxClicks": 50,
    "pathLockMode": "strict",
    "pathLockPrefix": "/app/dashboard",
    "geoTargeting": { "FR": "https://fr.acmesaas.io/demo" }
  }'`,
  },
  {
    label: "TypeScript",
    language: "typescript",
    code: `import { LShorter } from "lshorter-api";

const lsh = new LShorter({ apiKey: process.env.LSHORTER_API_KEY! });

const link = await lsh.links.create({
  targetUrl: "https://app.acmesaas.io/app/dashboard",
  slug: "beta-demo",
  maxClicks: 50,
  pathLockMode: "strict",
  pathLockPrefix: "/app/dashboard",
});

console.log(link.shortUrl); // https://lsho.cc/beta-demo`,
  },
  {
    label: "Python",
    language: "python",
    code: `import os
from lshorter import LShorter

lsh = LShorter(api_key=os.environ["LSHORTER_API_KEY"])

link = lsh.links.create({
    "targetUrl": "https://app.acmesaas.io/app/dashboard",
    "slug": "beta-demo",
    "maxClicks": 50,
    "pathLockMode": "strict",
    "pathLockPrefix": "/app/dashboard",
})
print(link["shortUrl"]) # https://lsho.cc/beta-demo`,
  },
  {
    label: "Go",
    language: "go",
    code: `package main

import (
  "context"
  "fmt"
  "os"
  lshorter "github.com/Konvelbo/LShorter-api/sdks/go"
)

func main() {
  client := lshorter.New(os.Getenv("LSHORTER_API_KEY"))
  maxClicks := 50
  link, _ := client.Links.Create(context.Background(), lshorter.CreateLinkOptions{
    TargetURL:      "https://app.acmesaas.io/app/dashboard",
    Slug:           "beta-demo",
    MaxClicks:      &maxClicks,
    PathLockMode:   "strict",
    PathLockPrefix: "/app/dashboard",
  })
  fmt.Println(link.ShortURL)
}`,
  },
  {
    label: "PHP",
    language: "php",
    code: `<?php
use LShorter\\LShorter;

$lsh = new LShorter(getenv("LSHORTER_API_KEY"));

$link = $lsh->links->create([
    "targetUrl"      => "https://app.acmesaas.io/app/dashboard",
    "slug"           => "beta-demo",
    "maxClicks"      => 50,
    "pathLockMode"   => "strict",
    "pathLockPrefix" => "/app/dashboard",
]);

echo $link["shortUrl"]; // https://lsho.cc/beta-demo`,
  },
  {
    label: "Rust",
    language: "rust",
    code: `use lshorter::{CreateLinkOptions, LShorter};

#[tokio::main]
async fn main() -> lshorter::Result<()> {
    let client = LShorter::new(std::env::var("LSHORTER_API_KEY")?);
    let link = client.links().create(&CreateLinkOptions {
        target_url: "https://app.acmesaas.io/app/dashboard".into(),
        slug: Some("beta-demo".into()),
        max_clicks: Some(50),
        ..Default::default()
    }).await?;
    println!("{}", link.short_url);
    Ok(())
}`,
  },
  {
    label: "Webhook",
    language: "json",
    code: `{
  "event": "link.clicked",
  "slug": "beta-demo",
  "shortUrl": "https://lsho.cc/beta-demo",
  "country": "FR",
  "city": "Paris",
  "device": "mobile",
  "os": "iOS",
  "clickId": "qk_cid_89a1f02b",
  "timestamp": "2026-11-21T04:12:08.412Z"
}`,
  },
];

const DEVELOPER_INSTALL_COMMANDS = [
  { label: "Node", command: "npm i lshorter-api" },
  { label: "Python", command: "pip install lshorter-api" },
  { label: "Go", command: "go get github.com/Konvelbo/LShorter-api/sdks/go" },
  { label: "PHP", command: "composer require lshorter/lshorter-api" },
  { label: "Rust", command: "cargo add lshorter-api" },
];

export function DeveloperApiSection() {
  const { tr } = useI18n();

  const highlights = useMemo(
    () => [
      {
        title: tr("Scoped SHA-256 API keys", "Clés API SHA-256 cloisonnées"),
        desc: tr(
          "Granular read and read_write Bearer tokens with rate limits.",
          "Jetons Bearer read et read_write granulaires avec limites de débit."
        ),
      },
      {
        title: tr("Global edge KV sync", "Synchronisation Edge KV mondiale"),
        desc: tr(
          "Every POST or PATCH propagates across 310+ PoPs right away.",
          "Chaque requête POST ou PATCH se propage instantanément sur 310+ PoP."
        ),
      },
      {
        title: tr("Signed webhooks", "Webhooks signés"),
        desc: tr(
          "Stream click geo, device metadata, and live revenue events.",
          "Recevez la géolocalisation, les métadonnées appareil et vos revenus en direct."
        ),
      },
    ],
    [tr]
  );

  return (
    <SplitDeveloperHero
      id="api"
      badge={tr("REST API v1 · Edge KV synced", "API REST v1 · Sync Edge KV")}
      title={tr(
        "Provision links and rules from your codebase",
        "Provisionnez liens et règles depuis votre code"
      )}
      installCommands={DEVELOPER_INSTALL_COMMANDS}
      description={tr(
        "Create links programmatically, enforce PathLock™ prefixes, set click caps, and receive signed conversion webhooks in real time.",
        "Créez des liens par programme, imposez des préfixes PathLock™, définissez des quotas de clics et recevez des webhooks de conversion signés en temps réel."
      )}
      highlights={highlights}
      primaryAction={{
        label: tr(
          "Explore API documentation",
          "Explorer la documentation API"
        ),
        href: "/docs",
      }}
      secondaryAction={{
        label: tr("Quickstart guide", "Guide de démarrage rapide"),
        href: "/docs/sdk-quickstart",
      }}
      codeTabs={DEVELOPER_API_TABS}
      terminalFooter={{
        status: tr(
          "201 Created — Edge KV synced",
          "201 Created — Edge KV synchronisé"
        ),
        endpoint: "POST /api/v1/links",
      }}
    />
  );
}

// ============================================================================
// 8. REAL PRICING SECTION (#pricing-preview — Animated NumberFlow + Switch + Confetti)
// ============================================================================
export function PricingPreviewSection() {
  const { tr } = useI18n();
  const { data: session } = useSession();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const pricingPlans = useMemo<PricingPlan[]>(
    () => [
      {
        planId: "FREE",
        name: PRICING_PLANS.FREE.name,
        price: PRICING_PLANS.FREE.monthlyPrice,
        yearlyPrice: PRICING_PLANS.FREE.yearlyPrice,
        period: tr("forever", "à vie"),
        yearlyPeriod: tr("forever", "à vie"),
        monthlyBillingNote: tr(
          "Free forever, no credit card",
          "Gratuit à vie, sans carte bancaire"
        ),
        yearlyBillingNote: tr(
          "Free forever, no credit card",
          "Gratuit à vie, sans carte bancaire"
        ),
        badgeMonthly: tr("Free", "Gratuit"),
        badgeYearly: tr("Free", "Gratuit"),
        features: [
          tr("10,000 clicks / month", "10 000 clics / mois"),
          tr("3 domains and 50 active links", "3 domaines et 50 liens actifs"),
          tr(
            "Global Workspace Target (clicks & revenue)",
            "Objectif global d'espace (clics et revenus)"
          ),
          tr("QR Code Studio (basic styles)", "QR Studio (styles de base)"),
          tr(
            "30-day analytics · API 60 req/min",
            "Analyses 30 jours · API 60 req/min"
          ),
          tr("Community support", "Support communautaire"),
        ],
        notIncludedNote: tr(
          "Not included: Smart Routing, password protection, individual link alerts, webhooks, and pixels.",
          "Non inclus : routage intelligent, protection par mot de passe, alertes par lien, webhooks et pixels."
        ),
        description: tr(
          "To explore our Edge infrastructure, no credit card required.",
          "Pour découvrir notre infrastructure Edge, sans carte bancaire."
        ),
        buttonText: tr("Get Started Free", "Commencer gratuitement"),
        href: "/register",
        yearlyHref: "/register",
        isPopular: false,
      },
      {
        planId: "PRO",
        name: PRICING_PLANS.PRO.name,
        price: PRICING_PLANS.PRO.promoMonthly.firstMonthPrice,
        yearlyPrice: PRICING_PLANS.PRO.yearlyPrice,
        monthlyOriginalPrice: PRICING_PLANS.PRO.monthlyPrice,
        yearlyOriginalPrice:
          PRICING_PLANS.PRO.promoYearly.fullPriceBeforeDiscount,
        period: tr("2 mo", "2 mois"),
        yearlyPeriod: tr("yr", "an"),
        monthlySavings: tr(
          "Save $22.50 over 2 months",
          "Économisez 22,50 $ sur 2 mois"
        ),
        yearlySavings: tr("Save $90 / yr", "Économisez 90 $ / an"),
        monthlyBillingNote: tr(
          `then $${PRICING_PLANS.PRO.monthlyPrice} / month`,
          `puis ${PRICING_PLANS.PRO.monthlyPrice} $ / mois`
        ),
        yearlyBillingNote: tr(
          `or $${PRICING_PLANS.PRO.promoYearly.equivalentMonthlyPrice.toFixed(2)} / month`,
          `soit ${PRICING_PLANS.PRO.promoYearly.equivalentMonthlyPrice.toFixed(2).replace(".", ",")} $ / mois`
        ),
        badgeMonthly: tr("-75% promo", "-75 % promo"),
        badgeYearly: tr("-50% annual", "-50 % annuel"),
        features: [
          tr(
            "150,000 clicks / month (+$3 / 50k)",
            "150 000 clics / mois (+3 $ / 50k)"
          ),
          tr(
            "6 domains and 1,000 active links",
            "6 domaines et 1 000 liens actifs"
          ),
          tr(
            "Individual link alerts (clicks, revenue, expiry)",
            "Alertes individuelles par lien (clics, revenus, expiration)"
          ),
          tr(
            "Dynamic Smart Routing (country + OS/device)",
            "Routage intelligent dynamique (pays + OS/appareil)"
          ),
          tr(
            "Password protection and destination masking",
            "Protection par mot de passe et masquage d'URL"
          ),
          tr(
            "5 webhooks and 5 retargeting pixels",
            "5 webhooks et 5 pixels de retargeting"
          ),
          tr(
            "365-day analytics · API 200 req/min",
            "Analyses 365 jours · API 200 req/min"
          ),
          tr("Priority email support", "Support prioritaire par e-mail"),
        ],
        description: tr(
          "Grow your brand and maximize your conversion rates.",
          "Développez votre marque et maximisez vos conversions."
        ),
        buttonText: tr("Choose Pro", "Choisir Pro"),
        href: "/pricing",
        yearlyHref: "/pricing",
        isPopular: true,
      },
      {
        planId: "BUSINESS",
        name: PRICING_PLANS.BUSINESS.name,
        price: PRICING_PLANS.BUSINESS.promoMonthly.firstMonthPrice,
        yearlyPrice: PRICING_PLANS.BUSINESS.yearlyPrice,
        monthlyOriginalPrice: PRICING_PLANS.BUSINESS.monthlyPrice,
        yearlyOriginalPrice:
          PRICING_PLANS.BUSINESS.promoYearly.fullPriceBeforeDiscount,
        period: tr("2 mo", "2 mois"),
        yearlyPeriod: tr("yr", "an"),
        monthlySavings: tr(
          "Save $58.80 over 2 months",
          "Économisez 58,80 $ sur 2 mois"
        ),
        yearlySavings: tr("Save $238 / yr", "Économisez 238 $ / an"),
        monthlyBillingNote: tr(
          `then $${PRICING_PLANS.BUSINESS.monthlyPrice} / month`,
          `puis ${PRICING_PLANS.BUSINESS.monthlyPrice} $ / mois`
        ),
        yearlyBillingNote: tr(
          `or $${PRICING_PLANS.BUSINESS.promoYearly.equivalentMonthlyPrice.toFixed(2)} / month`,
          `soit ${PRICING_PLANS.BUSINESS.promoYearly.equivalentMonthlyPrice.toFixed(2).replace(".", ",")} $ / mois`
        ),
        badgeMonthly: tr("-60% promo", "-60 % promo"),
        badgeYearly: tr("-40% annual", "-40 % annuel"),
        features: [
          tr(
            "500,000 clicks / month (+$8 / 125k)",
            "500 000 clics / mois (+8 $ / 125k)"
          ),
          tr(
            "15 domains and unlimited active links",
            "15 domaines et liens actifs illimités"
          ),
          tr(
            "Unlimited individual link alerts",
            "Alertes individuelles illimitées"
          ),
          tr("Multi-condition rule engine", "Moteur de règles multi-conditions"),
          tr(
            "Advanced protection and destination masking",
            "Protection avancée et masquage de destination"
          ),
          tr("Vector QR Code Studio (SVG / PDF)", "QR Studio vectoriel (SVG / PDF)"),
          tr("Unlimited webhooks and pixels", "Webhooks et pixels illimités"),
          tr(
            "Unlimited analytics · API 600 req/min",
            "Analyses illimitées · API 600 req/min"
          ),
          tr("5 team seats · 24/7 support", "5 membres d'équipe · support 24/7"),
        ],
        description: tr(
          "For multi-channel campaigns and growing teams.",
          "Pour les campagnes multicanales et les équipes en croissance."
        ),
        buttonText: tr("Choose Business", "Choisir Business"),
        href: "/pricing",
        yearlyHref: "/pricing",
        isPopular: false,
      },
    ],
    [tr]
  );

  const enterprisePlan = useMemo<EnterpriseBannerPlan>(
    () => ({
      planId: "ENTERPRISE",
      name: PRICING_PLANS.ENTERPRISE.name,
      monthlyPrice: PRICING_PLANS.ENTERPRISE.promoMonthly.firstMonthPrice,
      yearlyPrice: PRICING_PLANS.ENTERPRISE.yearlyPrice,
      monthlyOriginalPrice: PRICING_PLANS.ENTERPRISE.monthlyPrice,
      yearlyOriginalPrice:
        PRICING_PLANS.ENTERPRISE.promoYearly.fullPriceBeforeDiscount,
      monthlyBillingNote: tr(
        `then $${PRICING_PLANS.ENTERPRISE.monthlyPrice} / month`,
        `puis ${PRICING_PLANS.ENTERPRISE.monthlyPrice} $ / mois`
      ),
      yearlyBillingNote: tr(
        `or $${PRICING_PLANS.ENTERPRISE.promoYearly.equivalentMonthlyPrice.toFixed(2)} / month`,
        `soit ${PRICING_PLANS.ENTERPRISE.promoYearly.equivalentMonthlyPrice.toFixed(2).replace(".", ",")} $ / mois`
      ),
      description: tr(
        "Unlimited clicks and dedicated high-throughput Edge SLA.",
        "Clics illimités et SLA Edge haute performance dédié."
      ),
      features: [
        tr(
          "Unlimited clicks, domains, and links",
          "Clics, domaines et liens illimités"
        ),
        tr(
          "Hyper-targeted routing (ISP / ASN / city)",
          "Routage hyper-ciblé (FAI / ASN / ville)"
        ),
        tr(
          "Unlimited analytics & raw CSV export",
          "Analyses illimitées et export CSV brut"
        ),
        tr(
          "API 1,400 req/min · 15 team seats",
          "API 1 400 req/min · 15 membres d'équipe"
        ),
        tr(
          "99.99% Edge SLA & direct VIP support",
          "SLA Edge 99,99 % et support VIP direct"
        ),
        tr(
          "Global alerts with VIP routing",
          "Alertes globales avec routage VIP"
        ),
      ],
      buttonText: tr("Choose Enterprise", "Choisir Enterprise"),
      monthlyHref: "/pricing",
      yearlyHref: "/pricing",
    }),
    [tr]
  );

  const handleDirectCheckout = async (
    planId: PaidPlanId,
    cycle: BillingCycle
  ) => {
    setLoadingPlan(planId);
    try {
      const userId = (session?.user as { id?: string } | undefined)?.id;
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId,
          cycle,
          userId: userId || undefined,
          customerEmail: session?.user?.email || undefined,
          successUrl: `${window.location.origin}/dashboard/settings?tab=billing&checkout_success=true&plan=${planId}`,
          cancelUrl: `${window.location.origin}/#pricing-preview`,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success && data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
        return;
      }

      showToast.error(
        data.error ||
          tr(
            "Unable to initiate Dodo Payments checkout session.",
            "Impossible de lancer la session de paiement Dodo Payments."
          )
      );
    } catch {
      showToast.error(
        tr(
          "Unable to reach Dodo Payments checkout. Please try again.",
          "Impossible de joindre le paiement Dodo Payments. Veuillez réessayer."
        )
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <section
      id="pricing-preview"
      className="w-full bg-[#F8F9FB] dark:bg-[#0D0E12] border-t border-[#E4E7EC] dark:border-white/[0.08] scroll-mt-20 overflow-x-clip transition-colors duration-300"
    >
      <Pricing
        plans={pricingPlans}
        enterprise={enterprisePlan}
        title={tr("Simple, transparent pricing", "Des tarifs simples et transparents")}
        description={tr(
          "Zero downtime guaranteed across 310+ Cloudflare Edge PoPs.\nCertified PDF invoices generated instantly in one click.",
          "Zéro interruption garantie sur plus de 310 PoP Cloudflare Edge.\nFactures PDF certifiées générées instantanément en un clic."
        )}
        annualSaveLabel={tr("Save up to 50%", "Jusqu'à -50 %")}
        onSelectPlan={handleDirectCheckout}
        loadingPlan={loadingPlan}
      />

      <div className="pb-16 flex justify-center">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#0066FF] dark:text-[#6CA8FF] hover:underline"
        >
          <span>
            {tr(
              "View full feature comparison matrix",
              "Voir le tableau comparatif complet"
            )}
          </span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </section>
  );
}
