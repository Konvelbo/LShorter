"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, ShieldCheck, KeyRound, Gauge } from "lucide-react";
import {
  SectionRailFrame,
  JargonTooltip,
  scrollToHeroShortener,
} from "@/components/marketing/swiss-frame";
import { PathLockCartoonPanel } from "@/components/marketing/pathlock-cartoon-panel";
import {
  FeatureUIRow,
  ChecklistVisual,
  TimelineVisual,
  VideoTutorialVisual,
} from "@/components/ui/feature-ui-row";
import { useI18n } from "@/components/providers/i18n-provider";

export {
  DifferenceSection,
  UseCasesSection,
  DeveloperApiSection,
  PricingPreviewSection,
} from "@/components/marketing/landing-sections-bottom";

const NAMECHEAP_AFFILIATE_URL =
  process.env.NEXT_PUBLIC_NAMECHEAP_AFFILIATE_LINK ||
  "https://namecheap.pxf.io/c/7999167/386170/5618";

function NamecheapLogo({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Namecheap"
    >
      <path
        d="M11.1 10.6c-.9-1.5-2.9-1.9-4.4-1-.4.2-.8.6-1 1L2.2 16.5c-.6 1-.6 2.3 0 3.3l1.7 2.8c.5.9 1.7 1.2 2.6.6.3-.2.5-.4.6-.7l4-6.9 4.2 7.1c.9 1.5 2.9 1.9 4.4 1 .4-.2.8-.6 1-1l3.5-5.9c.6-1 .6-2.3 0-3.3l-1.7-2.8c-.5-.9-1.7-1.2-2.6-.6-.3.2-.5.4-.6.7l-4 6.9-4.2-7.1Z"
        fill="#DE3723"
      />
      <path
        d="M25.3 10.2c-.9-.5-2.1-.2-2.6.7l-3.9 6.8 2.4 4.1c.9 1.5 2.9 1.9 4.4 1 .4-.2.8-.6 1-1l3.2-5.4c.6-1 .6-2.3 0-3.3l-1.6-2.7c-.6-.9-1.9-1-2.9-.2Z"
        fill="#FF5C35"
      />
    </svg>
  );
}

// ============================================================================
// 1. TRUST STRIP (Docked inside HeroSection — kept as empty export for page.tsx)
// ============================================================================
export function TrustStripSection() {
  return null;
}

// ============================================================================
// 2. HOW IT WORKS (Clean 3-Column Hairline Sequence)
// ============================================================================
export function HowItWorksSection() {
  const { tr } = useI18n();
  const steps = [
    {
      num: "1",
      title: tr("Paste any destination URL", "Collez n'importe quelle URL"),
      desc: tr(
        "Drop in a landing page, app link, or staging URL and get a clean lsho.cc slug or custom branded link instantly.",
        "Collez une page de destination, un lien d'application ou une URL de staging et obtenez instantanément un lien lsho.cc ou un domaine personnalisé."
      ),
    },
    {
      num: "2",
      title: tr(
        "Add routing and access rules",
        "Ajoutez vos règles de routage et d'accès"
      ),
      desc: tr(
        "Target visitors by country, device, or weighted A/B split, cap total clicks, or lock private demos inside PathLock™.",
        "Ciblez vos visiteurs par pays, appareil ou test A/B pondéré, limitez le nombre de clics ou verrouillez vos démos privées avec PathLock™."
      ),
    },
    {
      num: "3",
      title: tr(
        "Measure clicks and live revenue",
        "Mesurez vos clics et revenus en direct"
      ),
      desc: tr(
        "Watch live redirects across 310+ Cloudflare PoPs and trace signups and attributed revenue back to each short link.",
        "Suivez vos redirections en direct sur plus de 310 PoP Cloudflare et attribuez chaque inscription et vente au bon lien court."
      ),
    },
  ];

  return (
    <section className="w-full bg-[#FFFFFF] dark:bg-[#09090B] py-20 sm:py-24 transition-colors duration-300 overflow-x-clip">
      <SectionRailFrame>
        <div className="max-w-[620px] mb-12">
          <h2 className="text-[28px] sm:text-[36px] font-semibold tracking-[-0.03em] leading-[1.1] text-[#09090B] dark:text-white text-balance">
            {tr(
              "From raw URL to governed link in three steps",
              "D'une URL brute à un lien maîtrisé en trois étapes"
            )}
          </h2>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10">
          {steps.map((step) => (
            <li
              key={step.num}
              className="group relative flex flex-col cursor-default"
            >
              {/* Fine horizontal bar with 1.2s left-to-right blue fill on hover */}
              <div
                aria-hidden="true"
                className="relative w-full h-[1.5px] bg-[#0066FF]/20 dark:bg-white/[0.12] overflow-hidden"
              >
                <span className="how-step-bar-fill block h-full w-full bg-[#0066FF] dark:bg-[#3B82F6]" />
              </div>

              <div className="pt-6 flex flex-col">
                <span className="how-step-vivid-color font-mono text-[13px] font-semibold text-[#0066FF]/70 dark:text-[#60A5FA]/75 group-hover:text-[#0066FF] dark:group-hover:text-[#3B82F6] tabular-nums">
                  0{step.num}
                </span>
                <h3 className="how-step-vivid-color mt-3 text-[18px] font-semibold tracking-[-0.02em] text-[#09090B]/80 dark:text-white/80 group-hover:text-[#0047FF] dark:group-hover:text-[#60A5FA]">
                  {step.title}
                </h3>
                <p className="how-step-vivid-color mt-2.5 text-[14.5px] leading-[1.6] text-[#52525B]/80 dark:text-zinc-400/80 group-hover:text-[#09090B] dark:group-hover:text-white text-pretty">
                  {step.desc}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 3. CORE PLATFORM FEATURES (#features — Alternating FeatureUIRow Showcase)
// ============================================================================
export function FeaturesBentoSection() {
  const { isFr, tr } = useI18n();

  return (
    <section
      id="features"
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] py-24 sm:py-32 border-t border-[#F1F2F6] dark:border-white/[0.06] scroll-mt-20 overflow-x-clip transition-colors duration-300"
    >
      <SectionRailFrame>
        {/* Centered Header */}
        <div className="max-w-[680px] mx-auto text-center pb-10 sm:pb-16 mb-16 sm:mb-24">
          <h2 className="text-[32px] sm:text-[44px] font-bold tracking-[-0.035em] leading-[1.08] text-[#09090B] dark:text-white text-balance">
            {tr(
              "Everything a link needs before and after the click.",
              "Tout ce qu'un lien exige avant et après le clic."
            )}
          </h2>
          <p className="mt-4 text-[15.5px] sm:text-[16.5px] text-[#52525B] dark:text-zinc-400 leading-[1.6] max-w-[540px] mx-auto text-pretty">
            {isFr ? (
              <>
                Propulsé par le{" "}
                <JargonTooltip
                  term="réseau edge"
                  explanation="Votre redirection s'exécute sur le serveur Cloudflare le plus proche du visiteur parmi plus de 310 nœuds mondiaux, pour un temps de réponse inférieur à 12 ms."
                />{" "}
                de Cloudflare afin que routage, contrôle d&apos;accès et analyses
                s&apos;exécutent sans jamais ralentir la redirection.
              </>
            ) : (
              <>
                Built on Cloudflare&apos;s{" "}
                <JargonTooltip
                  term="edge network"
                  explanation="Your redirect executes on whichever of 310+ global Cloudflare servers is physically closest to the visitor, keeping response time under 12ms."
                />{" "}
                so routing, access control, and analytics run without slowing the
                redirect down.
              </>
            )}
          </p>
        </div>

        {/* 6 Alternating FeatureUIRow Blocks — Exact 6 Core Capabilities */}
        <div className="flex flex-col gap-20 sm:gap-28">
          {/* 1. Smart Geo, Device & A/B Routing */}
          <FeatureUIRow
            tone="royal"
            eyebrow={tr("01 · Smart Routing", "01 · Routage intelligent")}
            title={tr(
              "Smart Geo, Device & A/B Routing",
              "Routage géo, appareil et A/B"
            )}
            body={tr(
              "Send one short link to different destinations based on country, mobile OS, browser, or a weighted split test.",
              "Redirigez un seul lien court vers différentes destinations selon le pays, l'OS mobile, le navigateur ou un test A/B pondéré."
            )}
            cta={{
              label: tr("Explore routing rules", "Explorer les règles de routage"),
              href: "/docs/geo-routing",
            }}
            visual={
              <VideoTutorialVisual
                src="/videos/tutorials/05-Analytics-Geography.mp4"
                poster="/videos/tutorials/05-Analytics-Geography-poster.jpg"
                label={tr(
                  "Geography & Device Telemetry",
                  "Télémétrie géographique et appareils"
                )}
                ariaLabel={tr(
                  "LShorter Geography and Device Analytics tutorial clip",
                  "Tutoriel LShorter sur les analyses géographiques et appareils"
                )}
              />
            }
          />

          {/* 2. Click Caps & Scheduled Expiry */}
          <FeatureUIRow
            reverse
            tone="night"
            eyebrow={tr("02 · Link Lifecycle", "02 · Cycle de vie")}
            title={tr(
              "Click Caps & Scheduled Expiry",
              "Limites de clics et expiration"
            )}
            body={tr(
              "Automatically deactivate invite links or route visitors to a waitlist once a click limit or expiration date is reached.",
              "Désactivez automatiquement vos liens d'invitation ou redirigez vers une liste d'attente dès qu'un quota de clics ou une date d'expiration est atteint."
            )}
            cta={{
              label: tr(
                "See expiry & caps docs",
                "Voir la doc expiration & quotas"
              ),
              href: "/docs/click-limits-and-expiration",
            }}
            visual={
              <TimelineVisual
                title={tr(
                  "Private beta link lifecycle",
                  "Cycle de vie d'un lien bêta privée"
                )}
                total={500}
                totalLabel={tr("500 clicks cap", "Plafond 500 clics")}
                stages={[
                  {
                    label: tr("Open invites (320)", "Invitations (320)"),
                    value: 320,
                  },
                  {
                    label: tr("Final cap (180)", "Plafond (180)"),
                    value: 180,
                  },
                ]}
                ticks={["0", "100", "200", "300", "400", "500"]}
                badgeLabel={tr("Then", "Ensuite")}
                note={tr(
                  "Auto-deactivate or redirect visitors to your waitlist",
                  "Désactivation auto ou redirection vers la liste d'attente"
                )}
              />
            }
          />

          {/* 3. Live Revenue & Pixel Attribution */}
          <FeatureUIRow
            tone="royal"
            eyebrow={tr("03 · Revenue Attribution", "03 · Attribution des revenus")}
            title={tr(
              "Live Revenue & Pixel Attribution",
              "Revenus en direct et pixels"
            )}
            body={
              isFr ? (
                <>
                  Connectez{" "}
                  <JargonTooltip
                    term="l'attribution first-party"
                    explanation="LShorter transmet un jeton de clic first-party (qk_cid) à votre webhook de paiement sans déposer de cookies publicitaires tiers."
                  />{" "}
                  pour suivre vos revenus en temps réel et déclencher vos pixels
                  Meta, Google ou TikTok à la redirection.
                </>
              ) : (
                <>
                  Connect{" "}
                  <JargonTooltip
                    term="first-party attribution"
                    explanation="LShorter passes a first-party click token (qk_cid) through to your checkout webhook without dropping third-party ad cookies."
                  />{" "}
                  to track real-time revenue and fire Meta, Google, or TikTok
                  pixels on redirect.
                </>
              )
            }
            cta={{
              label: tr("Explore revenue tracking", "Explorer le suivi des revenus"),
              href: "/docs/conversion-tracking-amount-count",
            }}
            visual={
              <VideoTutorialVisual
                src="/videos/tutorials/06-Analytics-Revenue.mp4"
                poster="/videos/tutorials/06-Analytics-Revenue-poster.jpg"
                label={tr(
                  "Live Revenue Attribution",
                  "Attribution des revenus en direct"
                )}
                ariaLabel={tr(
                  "LShorter Live Revenue Attribution tutorial clip",
                  "Tutoriel LShorter sur l'attribution des revenus en direct"
                )}
              />
            }
          />

          {/* 4. Dynamic Vector QR Studio */}
          <FeatureUIRow
            reverse
            tone="night"
            eyebrow={tr("04 · Dynamic QR Studio", "04 · QR Studio dynamique")}
            title={tr(
              "Dynamic Vector QR Studio",
              "QR Studio vectoriel dynamique"
            )}
            body={tr(
              "15 pixel styles, custom brand gradients, SVG, PNG & animated GIF exports, and editable destinations even after printing.",
              "15 styles de pixels, dégradés de marque, exports SVG, PNG et GIF animé, et destinations modifiables même après impression."
            )}
            cta={{
              label: tr("Explore QR Studio docs", "Découvrir la doc QR Studio"),
              href: "/docs/dynamic-qr-codes",
            }}
            visual={
              <VideoTutorialVisual
                src="/videos/tutorials/10-QR-Studio.mp4"
                poster="/videos/tutorials/10-QR-Studio-poster.jpg"
                label={tr(
                  "QR Studio · Logos & Frames",
                  "QR Studio · Logos & cadres"
                )}
                ariaLabel={tr(
                  "LShorter Dynamic Vector QR Studio tutorial clip",
                  "Tutoriel LShorter sur QR Studio vectoriel dynamique"
                )}
              />
            }
          />

          {/* 5. Custom Branded Domains & Auto SSL */}
          <FeatureUIRow
            tone="royal"
            eyebrow={tr(
              "05 · Branded Domains · 3 free included",
              "05 · Domaines de marque · 3 gratuits inclus"
            )}
            title={tr(
              "Custom Branded Domains & Auto SSL",
              "Domaines personnalisés et SSL auto"
            )}
            body={
              isFr ? (
                <>
                  Remplacez les domaines génériques par{" "}
                  <code className="font-mono text-[13px] px-1.5 py-0.5 rounded-[6px] bg-[#F4F5F8] dark:bg-white/[0.07] text-[#09090B] dark:text-zinc-200 border border-black/[0.06] dark:border-white/[0.08]">
                    go.yourbrand.io
                  </code>
                  . Pointez un simple enregistrement CNAME et LShorter
                  provisionne le certificat SSL edge automatiquement.
                </>
              ) : (
                <>
                  Replace generic domains with{" "}
                  <code className="font-mono text-[13px] px-1.5 py-0.5 rounded-[6px] bg-[#F4F5F8] dark:bg-white/[0.07] text-[#09090B] dark:text-zinc-200 border border-black/[0.06] dark:border-white/[0.08]">
                    go.yourbrand.io
                  </code>
                  . Point a single CNAME record and LShorter provisions edge SSL
                  automatically.
                </>
              )
            }
            cta={{
              label: tr(
                "Connect a custom domain",
                "Connecter un domaine personnalisé"
              ),
              href: "/register",
            }}
            extraContent={
              <div className="rounded-[10px] bg-[#F8F9FC] dark:bg-[#111218] border border-[#E7E9F2] dark:border-white/[0.08] p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-[8px] bg-white dark:bg-white/[0.06] border border-[#E7E9F2] dark:border-white/[0.10] flex items-center justify-center shrink-0">
                    <NamecheapLogo className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[12.5px] font-semibold text-[#09090B] dark:text-white">
                      {tr(
                        "Need a short branded domain?",
                        "Besoin d'un domaine court de marque ?"
                      )}
                    </div>
                    <p className="text-[11.5px] text-[#71717A] dark:text-zinc-400 mt-0.5">
                      {tr("Partner registrar —", "Registrar partenaire —")}{" "}
                      <span className="font-mono text-[#09090B] dark:text-zinc-200">
                        .co
                      </span>
                      ,{" "}
                      <span className="font-mono text-[#09090B] dark:text-zinc-200">
                        .io
                      </span>{" "}
                      {tr("&", "et")}{" "}
                      <span className="font-mono text-[#09090B] dark:text-zinc-200">
                        .cc
                      </span>{" "}
                      {tr("with free DNS.", "avec DNS gratuit.")}
                    </p>
                  </div>
                </div>

                <a
                  href={NAMECHEAP_AFFILIATE_URL}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-[8px] bg-[#09090B] hover:bg-[#0066FF] dark:bg-white dark:hover:bg-[#0066FF] text-white dark:text-[#09090B] dark:hover:text-white text-[12px] font-semibold transition-[background-color,border-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow whitespace-nowrap shrink-0"
                >
                  <span>Namecheap</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            }
            visual={
              <VideoTutorialVisual
                src="/videos/tutorials/11-Custom-Domains.mp4"
                poster="/videos/tutorials/11-Custom-Domains-poster.jpg"
                label={tr(
                  "Custom Domains & Edge SSL",
                  "Domaines personnalisés & SSL Edge"
                )}
                ariaLabel={tr(
                  "LShorter Custom Branded Domains tutorial clip",
                  "Tutoriel LShorter sur les domaines personnalisés"
                )}
              />
            }
          />

          {/* 6. Password Protection & Branded Masking */}
          <FeatureUIRow
            reverse
            tone="night"
            eyebrow={tr("06 · Access & Masking", "06 · Accès & masquage")}
            title={tr(
              "Password Protection & Branded Masking",
              "Mot de passe et masquage de marque"
            )}
            body={tr(
              "Protect confidential decks behind a password challenge, strip referrer headers, and customize OpenGraph social previews.",
              "Protégez vos présentations confidentielles par mot de passe, supprimez l'en-tête Referrer et personnalisez vos aperçus sociaux OpenGraph."
            )}
            cta={{
              label: tr(
                "Explore access & masking",
                "Explorer accès et masquage"
              ),
              href: "/docs/url-masking",
            }}
            visual={
              <ChecklistVisual
                title={tr(
                  "Protected link · lsho.cc/q4-deck",
                  "Lien protégé · lsho.cc/q4-deck"
                )}
                rows={[
                  {
                    label: tr(
                      "Password verification",
                      "Vérification mot de passe"
                    ),
                    value: "SHA-256",
                  },
                  {
                    label: tr("Referrer header", "En-tête Referrer"),
                    value: tr("Stripped", "Supprimé"),
                  },
                  {
                    label: tr("Destination URL", "URL de destination"),
                    value: tr("Masked", "Masquée"),
                  },
                  {
                    label: tr("OpenGraph card", "Carte OpenGraph"),
                    value: tr("Custom preview", "Aperçu sur mesure"),
                  },
                ]}
                stat={{
                  value: 100,
                  suffix: "%",
                  label: tr(
                    "Edge-enforced link privacy",
                    "Confidentialité appliquée à l'edge"
                  ),
                }}
              />
            }
          />
        </div>
      </SectionRailFrame>
    </section>
  );
}

// ============================================================================
// 4. SIGNATURE FOCUS: PATHLOCK™ PERIMETER SECURITY (#pathlock)
// ============================================================================
export function PathLockFocusSection() {
  const { isFr, tr } = useI18n();

  const pathlockFeatures = [
    {
      icon: ShieldCheck,
      title: tr(
        "Strict URL prefix enforcement",
        "Contrôle strict du préfixe d'URL"
      ),
      desc: tr(
        "Blocks out-of-scope routes immediately at the edge before internal pages load.",
        "Bloque immédiatement à l'edge toute route hors périmètre avant même le chargement des pages internes."
      ),
    },
    {
      icon: KeyRound,
      title: tr(
        "Optional team unlock password",
        "Mot de passe de déverrouillage équipe"
      ),
      desc: tr(
        "Built directly into the gate so authorized reviewers can bypass restrictions.",
        "Intégré directement au portail pour permettre aux relecteurs autorisés de lever les restrictions."
      ),
    },
    {
      icon: Gauge,
      title: tr(
        "Click Caps & scheduled expiry",
        "Quotas de clics et expiration planifiée"
      ),
      desc: tr(
        "Automatically close private beta links or route visitors to a waitlist after N visits.",
        "Fermez automatiquement vos liens bêta ou redirigez vers une liste d'attente après N visites."
      ),
    },
  ];

  return (
    <section
      id="pathlock"
      className="relative w-full min-h-[100svh] flex items-center bg-[#FFFFFF] dark:bg-[#09090B] text-[#101828] dark:text-[#FAFAFA] py-20 sm:py-24 border-t border-[#E4E7EC] dark:border-[#222225] scroll-mt-16 overflow-x-clip transition-colors duration-300"
    >
      <div className="mx-auto w-full max-w-[1520px] px-6 sm:px-10 xl:px-14">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,5fr)_minmax(0,8.2fr)] gap-10 xl:gap-14 items-stretch">
          {/* Left Column — Wider Editorial Hairline Feature Architecture */}
          <div className="min-w-0 flex flex-col justify-between">
            <div>
              <h2 className="m-0 font-medium text-[clamp(28px,3.1vw,38px)] leading-[1.12] tracking-[-0.025em] text-[#101828] dark:text-[#FAFAFA] text-balance">
                {tr("Expose", "Exposez")}{" "}
                <code className="font-mono text-[#0066FF] dark:text-[#529DFF] font-medium">
                  /app/dashboard/*
                </code>
                {tr(
                  ". Lock the rest of your app.",
                  ". Verrouillez le reste de votre app."
                )}
              </h2>

              <p className="mt-3.5 text-[15.5px] leading-[1.6] text-[#344054] dark:text-[#D4D4D8] text-pretty">
                {isFr ? (
                  <>
                    Vous partagez un SaaS de staging ou un aperçu investisseur ?{" "}
                    <JargonTooltip
                      term="PathLock™"
                      explanation="Contrairement à un simple mot de passe qui n'agit qu'avant la redirection, PathLock™ maintient une frontière d'URL stricte tout au long de la navigation."
                    />{" "}
                    impose un périmètre d&apos;URL strict afin d&apos;empêcher
                    tout accès aux pages facturation, admin ou paramètres non
                    finalisées.
                  </>
                ) : (
                  <>
                    Sharing a staging SaaS or investor preview?{" "}
                    <JargonTooltip
                      term="PathLock™"
                      explanation="Unlike basic link passwords that stop working after the redirect, PathLock enforces an authorized URL prefix boundary while visitors browse your preview."
                    />{" "}
                    enforces a strict URL perimeter so visitors cannot wander
                    into unfinished billing, admin, or settings pages.
                  </>
                )}
              </p>

              <ul className="mt-5 list-none p-0 border-t border-[#E4E7EC] dark:border-[#222225]">
                {pathlockFeatures.map((feat, idx) => {
                  const Icon = feat.icon;
                  return (
                    <li
                      key={idx}
                      className="grid grid-cols-[20px_1fr] gap-3 py-3 border-b border-[#E4E7EC] dark:border-[#222225]"
                    >
                      <Icon className="w-5 h-5 mt-0.5 text-[#667085] dark:text-[#A1A1AA] stroke-[1.5]" />
                      <div>
                        <b className="block font-medium text-[14.5px] text-[#101828] dark:text-[#FAFAFA]">
                          {feat.title}
                        </b>
                        <span className="block text-[14px] leading-[1.5] text-[#344054] dark:text-[#D4D4D8] mt-0.5">
                          {feat.desc}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/#hero-shortener"
                onClick={scrollToHeroShortener}
                className="inline-flex items-center h-[44px] px-[18px] rounded-[10px] bg-[#0066FF] hover:bg-[#0055D4] text-white text-[15px] font-medium leading-none transition-[background-color,border-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-2"
              >
                {tr("Protect a demo link", "Protéger un lien de démo")}
              </a>

              <Link
                href="/docs/path-lock"
                className="inline-flex items-center h-[44px] px-[18px] rounded-[10px] border border-[#D0D5DD] dark:border-[#2E2E33] text-[#101828] dark:text-[#FAFAFA] hover:bg-[#101828]/[0.05] dark:hover:bg-[#FAFAFA]/[0.06] text-[15px] font-medium leading-none transition-[background-color,border-color,color] duration-[1100ms] ease-[cubic-bezier(0.22,1,0.36,1)] btn-hover-slow focus-visible:outline-2 focus-visible:outline-[#0066FF] focus-visible:outline-offset-2"
              >
                {tr("Read PathLock docs", "Lire la doc PathLock™")}
              </Link>
            </div>
          </div>

          {/* Right Column — Full-Height & Full-Width Pure Video Frame */}
          <PathLockCartoonPanel />
        </div>
      </div>
    </section>
  );
}
