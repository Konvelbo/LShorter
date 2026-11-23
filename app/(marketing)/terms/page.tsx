"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  ShieldAlert,
  Server,
  KeyRound,
  AlertTriangle,
  Scale,
  ArrowLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Mail,
} from "lucide-react";
import { SITE_EMAILS } from "@/lib/constants/emails";
import { ClickableEmail } from "@/components/ui/clickable-email";
import { useI18n } from "@/components/providers/i18n-provider";

const SECTION_IDS = [
  "acceptance",
  "accounts",
  "acceptable-use",
  "edge-sla",
  "billing",
  "api-terms",
  "ip-rights",
  "termination",
  "liability",
  "governing-law",
  "contact",
] as const;

export default function TermsOfServicePage() {
  const { isFr, tr } = useI18n();
  const lastUpdated = tr("October 8, 2026", "8 octobre 2026");
  const [activeSection, setActiveSection] = useState<string>("acceptance");

  const keyTerms = [
    {
      icon: ShieldAlert,
      title: tr("Zero Tolerance Phishing", "Tolérance zéro contre le phishing"),
      description: tr(
        "LShorter strictly prohibits phishing, malware, credential harvesting, scamming, and illegal content. Infringing links are instantaneously nuked at the edge.",
        "LShorter interdit strictement le phishing, les logiciels malveillants, le vol d'identifiants, les arnaques et tout contenu illégal. Les liens frauduleux sont immédiatement bloqués à l'edge."
      ),
    },
    {
      icon: Server,
      title: tr("99.9% Edge SLA", "SLA Edge 99,9 %"),
      description: tr(
        "Our redirect engine runs across 310+ Cloudflare Edge locations worldwide, ensuring ultra-low latency sub-15ms redirection and high availability.",
        "Notre moteur de redirection s'exécute sur plus de 310 emplacements Cloudflare Edge dans le monde, garantissant une latence ultra-faible inférieure à 15 ms et une haute disponibilité."
      ),
    },
    {
      icon: KeyRound,
      title: tr("PathLock™ & Masking Rules", "Règles PathLock™ et masquage"),
      description: tr(
        "PIN protection and Zero-Referrer masking are intended for brand safety and affiliate attribution, not to conceal illicit payloads.",
        "La protection par code PIN et le masquage Zero-Referrer visent la sécurité de marque et l'attribution, jamais la dissimulation de contenus illicites."
      ),
    },
    {
      icon: Scale,
      title: tr("Fair Developer API Limits", "Quotas API développeur équitables"),
      description: tr(
        "Tier-based programmatic API access with clear rate limits and real-time webhook telemetry to ensure system-wide stability.",
        "Un accès API programmatique par forfait avec des limites de débit transparentes et des webhooks en temps réel pour préserver la stabilité globale."
      ),
    },
  ];

  const sections = [
    {
      id: "acceptance",
      title: tr("1. Acceptance of Terms", "1. Acceptation des conditions"),
    },
    {
      id: "accounts",
      title: tr(
        "2. Account Registration & Security",
        "2. Création et sécurité du compte"
      ),
    },
    {
      id: "acceptable-use",
      title: tr(
        "3. Acceptable Use & Anti-Abuse Policy",
        "3. Utilisation acceptable et lutte contre les abus"
      ),
    },
    {
      id: "edge-sla",
      title: tr(
        "4. Edge Infrastructure & SLA Commitments",
        "4. Infrastructure Edge et engagements de SLA"
      ),
    },
    {
      id: "billing",
      title: tr(
        "5. Billing, Dodo Payments MoR & No-Refund Policy",
        "5. Facturation, Dodo Payments (MoR) et non-remboursement"
      ),
    },
    {
      id: "api-terms",
      title: tr(
        "6. Developer API & SDK Usage",
        "6. Utilisation de l'API développeur et des SDK"
      ),
    },
    {
      id: "ip-rights",
      title: tr(
        "7. Intellectual Property & Domain Ownership",
        "7. Propriété intellectuelle et propriété des domaines"
      ),
    },
    {
      id: "termination",
      title: tr(
        "8. Suspension & Account Termination",
        "8. Suspension et résiliation du compte"
      ),
    },
    {
      id: "liability",
      title: tr(
        "9. Limitation of Liability & Warranty Disclaimer",
        "9. Limitation de responsabilité et exclusion de garantie"
      ),
    },
    {
      id: "governing-law",
      title: tr(
        "10. Governing Law & Dispute Resolution",
        "10. Droit applicable et résolution des litiges"
      ),
    },
    {
      id: "contact",
      title: tr(
        "11. Contact Legal & Compliance",
        "11. Contacter le service juridique"
      ),
    },
  ];

  useEffect(() => {
    const handleScroll = () => {
      let current: string = SECTION_IDS[0];
      for (const id of SECTION_IDS) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 260) {
            current = id;
          }
        }
      }
      setActiveSection(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveSection(id);
    }
  };

  return (
    <div className="w-full min-h-screen pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 select-text">
      {/* Simple Pure CSS for Card Hover Scale & TOC Interactive Hover/Active states */}
      <style>{`
        .legal-interactive-card {
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s ease, border-color 0.25s ease !important;
          will-change: transform, box-shadow;
          cursor: default;
        }
        .legal-interactive-card:hover {
          transform: translateY(-4px) scale(1.025) !important;
          box-shadow: 0 14px 30px -6px rgba(0, 0, 0, 0.12), 0 8px 14px -6px rgba(0, 0, 0, 0.08) !important;
          border-color: #a855f7 !important;
        }
        .dark .legal-interactive-card:hover,
        :is(.dark, .dark *) .legal-interactive-card:hover {
          transform: translateY(-4px) scale(1.025) !important;
          box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.75), 0 8px 16px -4px rgba(168, 85, 247, 0.25) !important;
          border-color: #c084fc !important;
        }
        .legal-toc-link {
          display: block;
          padding: 8px 12px;
          border-radius: 8px;
          color: #64748b;
          text-decoration: none;
          font-size: 0.875rem;
          line-height: 1.4;
          border-left: 2px solid transparent;
          transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1) !important;
        }
        .dark .legal-toc-link,
        :is(.dark, .dark *) .legal-toc-link {
          color: #94a3b8;
        }
        .legal-toc-link:hover {
          color: #9333ea !important;
          background-color: rgba(147, 51, 234, 0.08) !important;
          transform: translateX(6px) !important;
        }
        .dark .legal-toc-link:hover,
        :is(.dark, .dark *) .legal-toc-link:hover {
          color: #c084fc !important;
          background-color: rgba(192, 132, 252, 0.12) !important;
          transform: translateX(6px) !important;
        }
        .legal-toc-link.active {
          color: #9333ea !important;
          font-weight: 600 !important;
          background-color: rgba(147, 51, 234, 0.12) !important;
          border-left: 3px solid #9333ea !important;
          transform: translateX(4px) !important;
        }
        .dark .legal-toc-link.active,
        :is(.dark, .dark *) .legal-toc-link.active {
          color: #e9d5ff !important;
          background-color: rgba(192, 132, 252, 0.18) !important;
          border-left: 3px solid #c084fc !important;
          transform: translateX(4px) !important;
        }
      `}</style>

      <div className="max-w-6xl mx-auto">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 mb-8">
          <Link
            href="/"
            className="hover:text-neutral-900 dark:hover:text-white transition-colors inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {tr("Home", "Accueil")}
          </Link>
          <ChevronRight className="w-3 h-3 text-neutral-400 dark:text-neutral-600" />
          <span className="text-neutral-900 dark:text-white font-medium">
            {tr("Terms of Service", "Conditions d'utilisation")}
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center sm:text-left border-b border-neutral-200 dark:border-neutral-800 pb-10 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[10px] text-xs font-semibold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 mb-4">
            <FileText className="w-3.5 h-3.5" />
            <span>{tr("Legal Agreement", "Accord juridique")}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {tr("Terms of Service", "Conditions d'utilisation")}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
            {tr(
              "These Terms of Service govern your access to and use of LShorter's link shortening infrastructure, APIs, dashboard, and edge services. Please read them carefully.",
              "Les présentes Conditions d'utilisation régissent votre accès et votre utilisation de l'infrastructure de raccourcissement de liens, des API, du tableau de bord et des services edge de LShorter. Veuillez les lire attentivement."
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {tr("Effective Date:", "Date d'entrée en vigueur :")} {lastUpdated}
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
              {tr(
                "Binding Customer Agreement",
                "Contrat client juridiquement contraignant"
              )}
            </span>
          </div>
        </div>

        {/* Highlights with Hover Scale */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {keyTerms.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="legal-interactive-card group p-5 rounded-[10px] bg-white dark:bg-[#121214] border border-neutral-200 dark:border-[#222225] shadow-sm"
              >
                <div className="w-10 h-10 rounded-[10px] bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Desktop Sticky Sidebar with Scroll Spy & Hover Animation */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 p-6 rounded-[10px] bg-white dark:bg-[#121214] border border-neutral-200 dark:border-[#222225]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
                {tr("Sections", "Sommaire")}
              </h2>
              <nav className="space-y-1">
                {sections.map((section) => {
                  const isActive = activeSection === section.id;
                  return (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      onClick={(e) => scrollToSection(e, section.id)}
                      className={`legal-toc-link ${isActive ? "active" : ""}`}
                    >
                      {section.title}
                    </a>
                  );
                })}
              </nav>
            </div>
          </aside>

          {/* Body */}
          <main className="lg:col-span-8 space-y-12 text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {/* Section 1 */}
            <section id="acceptance" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr("1. Acceptance of Terms", "1. Acceptation des conditions")}
              </h2>
              <p className="mb-4">
                {tr(
                  'By signing up for, accessing, or using LShorter ("Service"), provided by LShorter Inc., you agree to be bound by these Terms of Service ("Terms"). If you are using the Service on behalf of a company, organization, or other entity, you represent and warrant that you have the legal authority to bind that entity to these Terms.',
                  'En vous inscrivant, en accédant ou en utilisant LShorter (le « Service »), fourni par LShorter Inc., vous acceptez d’être lié par les présentes Conditions d’utilisation (les « Conditions »). Si vous utilisez le Service au nom d’une entreprise, d’une organisation ou de toute autre entité, vous déclarez et garantissez disposer de l’autorité légale nécessaire pour engager cette entité.'
                )}
              </p>
              <p>
                {tr(
                  "If you do not agree to these Terms, you must not access or use the Service.",
                  "Si vous n'acceptez pas ces Conditions, vous ne devez ni accéder au Service ni l'utiliser."
                )}
              </p>
            </section>

            {/* Section 2 */}
            <section id="accounts" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "2. Account Registration & Security",
                  "2. Création et sécurité du compte"
                )}
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  {tr(
                    "You must provide accurate, current, and complete registration information during signup.",
                    "Vous devez fournir des informations exactes, à jour et complètes lors de votre inscription."
                  )}
                </li>
                <li>
                  {tr(
                    "You are solely responsible for safeguarding your login credentials, API secret keys, and PathLock™ access codes.",
                    "Vous êtes seul responsable de la confidentialité de vos identifiants de connexion, de vos clés API secrètes et de vos codes d'accès PathLock™."
                  )}
                </li>
                <li>
                  {tr(
                    "You must promptly notify LShorter of any unauthorized use of your account or security breaches at",
                    "Vous devez informer rapidement LShorter de toute utilisation non autorisée de votre compte ou faille de sécurité à l'adresse"
                  )}{" "}
                  <ClickableEmail
                    email={SITE_EMAILS.security}
                    className="text-blue-600 dark:text-blue-400"
                  />
                  .
                </li>
                <li>
                  {tr(
                    'Accounts registered by automated "bots" or fraudulent mechanisms are strictly prohibited and subject to immediate termination.',
                    'Les comptes créés par des robots automatisés (« bots ») ou des procédés frauduleux sont strictement interdits et immédiatement résiliés.'
                  )}
                </li>
              </ul>
            </section>

            {/* Section 3: Acceptable Use */}
            <section id="acceptable-use" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                {tr(
                  "3. Acceptable Use & Anti-Abuse Policy",
                  "3. Utilisation acceptable et lutte contre les abus"
                )}
              </h2>
              <div className="legal-interactive-card p-4 rounded-[10px] border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 mb-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                {isFr ? (
                  <>
                    <strong>Politique de tolérance zéro :</strong> LShorter
                    exécute des analyses heuristiques en temps réel et
                    s&apos;intègre aux bases de renseignement sur les menaces.
                    Tout lien créé pour tromper les utilisateurs ou diffuser un
                    logiciel malveillant sera bloqué instantanément sans préavis.
                  </>
                ) : (
                  <>
                    <strong>Zero Tolerance Policy:</strong> LShorter operates
                    real-time automated heuristics and integrates with threat
                    intelligence services. Any link created to deceive users or
                    spread malicious software will be instantly blocked without
                    notice.
                  </>
                )}
              </div>
              <p className="mb-3">
                {tr(
                  "You agree NOT to use LShorter to create links that direct to:",
                  "Vous vous engagez à NE PAS utiliser LShorter pour créer des liens redirigeant vers :"
                )}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                <li>
                  {isFr ? (
                    <>
                      <strong>Phishing et vol d&apos;identifiants :</strong>{" "}
                      Usurpation de banques, prestataires de paiement, écrans de
                      connexion ou réseaux sociaux.
                    </>
                  ) : (
                    <>
                      <strong>Phishing & Credential Harvesting:</strong>{" "}
                      Impersonating banks, payment gateways, login screens, or
                      social media sites.
                    </>
                  )}
                </li>
                <li>
                  {isFr ? (
                    <>
                      <strong>Malwares et exploits :</strong> Distribution de
                      chevaux de Troie, logiciels espions, rançongiciels ou
                      téléchargements binaires non autorisés.
                    </>
                  ) : (
                    <>
                      <strong>Malware & Exploits:</strong> Distributing trojans,
                      spyware, ransomware, or unauthorized binary downloads.
                    </>
                  )}
                </li>
                <li>
                  {isFr ? (
                    <>
                      <strong>Envois massifs non sollicités (Spam) :</strong>{" "}
                      Redirection de trafic issu de campagnes SMS, e-mails ou
                      bots sociaux non sollicités.
                    </>
                  ) : (
                    <>
                      <strong>Unsolicited Bulk Messaging (Spam):</strong>{" "}
                      Directing traffic originating from unauthorized SMS blasts,
                      email spam, or social network spam bots.
                    </>
                  )}
                </li>
                <li>
                  {isFr ? (
                    <>
                      <strong>Contenus illégaux ou préjudiciables :</strong>{" "}
                      Discours haineux, apologie du terrorisme, contenus
                      pédopornographiques (CSAM) ou atteinte aux droits
                      d&apos;auteur.
                    </>
                  ) : (
                    <>
                      <strong>Illegal or Harmful Materials:</strong> Hate speech,
                      terrorism promotion, child sexual abuse material (CSAM), or
                      copyright infringement.
                    </>
                  )}
                </li>
                <li>
                  {isFr ? (
                    <>
                      <strong>Contournement des filtres de sécurité :</strong>{" "}
                      Utilisation du code PIN PathLock™ ou du masquage de
                      destination pour dissimuler des charges malveillantes ou
                      échapper aux scanners de sécurité.
                    </>
                  ) : (
                    <>
                      <strong>Evasion of Security Filters:</strong> Using
                      PathLock™ PIN or Destination Masking to hide malicious
                      payloads or evade automated security scanners.
                    </>
                  )}
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="edge-sla" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "4. Edge Infrastructure & SLA Commitments",
                  "4. Infrastructure Edge et engagements de SLA"
                )}
              </h2>
              <p className="mb-4">
                {isFr ? (
                  <>
                    LShorter s&apos;appuie sur le réseau mondial Anycast Edge de
                    Cloudflare, couvrant plus de 310 centres de données. Nous
                    nous engageons sur un{" "}
                    <strong>objectif de disponibilité de 99,9 %</strong> pour la
                    résolution des redirections edge sur les forfaits payants
                    (Pro, Business et Enterprise).
                  </>
                ) : (
                  <>
                    LShorter leverages Cloudflare&apos;s global Anycast Edge
                    network spanning over 310 data centers. We commit to
                    maintaining a <strong>99.9% uptime target</strong> for edge
                    redirect resolution on paid tiers (Pro, Business, and
                    Enterprise).
                  </>
                )}
              </p>
              <p>
                {tr(
                  "Scheduled maintenance windows, force majeure events, and upstream DNS registrar failures outside our reasonable control are excluded from uptime calculations.",
                  "Les fenêtres de maintenance planifiées, cas de force majeure et défaillances de registrars DNS tiers hors de notre contrôle raisonnable sont exclus du calcul de disponibilité."
                )}
              </p>
            </section>

            {/* Section 5: Billing & Strict No-Refund Policy */}
            <section id="billing" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "5. Billing, Dodo Payments Merchant of Record & Strict No-Refund Policy",
                  "5. Facturation, Dodo Payments (Merchant of Record) et politique stricte de non-remboursement"
                )}
              </h2>
              <div className="space-y-4">
                <div className="legal-interactive-card p-4 rounded-[10px] border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#121214] text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-1.5">
                    {tr(
                      "Merchant of Record (Dodo Payments)",
                      "Merchant of Record (Dodo Payments)"
                    )}
                  </h4>
                  <p>
                    {isFr ? (
                      <>
                        Toutes les transactions financières, paiements clients,
                        factures et calculs de taxes/TVA sont effectués par notre
                        Merchant of Record agréé, <strong>Dodo Payments</strong>.
                        Lors de l&apos;achat d&apos;un abonnement LShorter ou
                        d&apos;une option de capacité, votre commande est régie
                        par les conditions de paiement de Dodo Payments.
                      </>
                    ) : (
                      <>
                        All financial transactions, customer checkouts, invoices,
                        and sales tax/VAT assessments are conducted through our
                        authorized Merchant of Record,{" "}
                        <strong>Dodo Payments</strong>. When purchasing an
                        LShorter subscription or capacity add-on, your order is
                        governed by Dodo Payments&apos; checkout terms.
                      </>
                    )}
                  </p>
                </div>

                <div className="legal-interactive-card p-4 rounded-[10px] border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-1.5 text-amber-700 dark:text-amber-400">
                    {tr(
                      "Strict No-Refund Policy (All Sales Are Final)",
                      "Politique stricte de non-remboursement (toutes les ventes sont définitives)"
                    )}
                  </h4>
                  <p className="mb-2">
                    {isFr ? (
                      <>
                        Parce que LShorter est une plateforme SaaS numérique qui
                        provisionne immédiatement de la capacité de calcul, des
                        ressources de redirection edge sur plus de 310 PoP
                        Cloudflare et des capacités de routage programmables dès
                        le paiement,{" "}
                        <strong>
                          tous les achats sont définitifs et non remboursables
                        </strong>
                        .
                      </>
                    ) : (
                      <>
                        Because LShorter is a digital software-as-a-service
                        (SaaS) platform that provisions immediate compute, edge
                        redirect resources across 310+ Cloudflare PoPs, and
                        programmable routing capacities upon checkout,{" "}
                        <strong>all purchases are final and non-refundable</strong>
                        .
                      </>
                    )}
                  </p>
                  <p>
                    {tr(
                      "In accordance with digital product consumer protections (including EU Directive 2011/83/EU Article 16(m)), you acknowledge and agree that your statutory right of withdrawal is waived upon the immediate activation and digital execution of the service.",
                      "Conformément aux dispositions légales relatives aux services numériques (notamment la directive européenne 2011/83/UE, article 16(m)), vous reconnaissez et acceptez que votre droit légal de rétractation est levé dès l'activation et l'exécution numérique immédiate du service."
                    )}
                  </p>
                </div>

                <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                  <li>
                    {isFr ? (
                      <>
                        <strong>Annulation des renouvellements futurs :</strong>{" "}
                        Vous pouvez annuler les renouvellements automatiques
                        futurs à tout moment depuis votre portail de facturation
                        dans le tableau de bord. L&apos;annulation stoppe les
                        prélèvements futurs tout en maintenant votre accès
                        jusqu&apos;à la fin de la période payée en cours.
                      </>
                    ) : (
                      <>
                        <strong>Cancellation of Future Renewals:</strong> You may
                        cancel future automatic renewals at any time directly
                        through your dashboard billing portal. Cancellation
                        prevents future recurring billing, and your account will
                        remain accessible until the conclusion of the current
                        paid period.
                      </>
                    )}
                  </li>
                  <li>
                    {isFr ? (
                      <>
                        <strong>Aucun prorata rétroactif :</strong> Aucun
                        remboursement partiel ou au prorata n&apos;est accordé
                        pour le temps, les liens ou les clics restants durant un
                        cycle de facturation.
                      </>
                    ) : (
                      <>
                        <strong>No Retroactive Prorations:</strong> No partial or
                        prorated refunds will be issued for unused time, links,
                        or clicks remaining during a billing cycle.
                      </>
                    )}
                  </li>
                  <li>
                    {isFr ? (
                      <>
                        <strong>Tranches de dépassement :</strong> Les tranches
                        de clics à l&apos;usage (3 $ par 50k sur Pro, 8 $ par
                        125k sur Business) sont consommées dynamiquement par le
                        trafic edge en direct et sont strictement non
                        remboursables.
                      </>
                    ) : (
                      <>
                        <strong>Overage Batches:</strong> Usage-based click
                        batches ($3 per 50k on Pro, $8 per 125k on Business) are
                        consumed dynamically by live edge traffic and are
                        strictly non-refundable.
                      </>
                    )}
                  </li>
                  <li>
                    <strong>
                      {tr(
                        "Billing Inquiries & Invoices:",
                        "Demandes de facturation et factures :"
                      )}
                    </strong>{" "}
                    {tr(
                      "For invoice receipts, tax/VAT questions, or subscription inquiries, contact our billing desk at",
                      "Pour vos justificatifs de facture, questions TVA/taxes ou demandes d'abonnement, contactez notre service facturation à"
                    )}{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.billing}
                      className="text-purple-600 dark:text-purple-400"
                    />
                    .
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section id="api-terms" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "6. Developer API & SDK Usage",
                  "6. Utilisation de l'API développeur et des SDK"
                )}
              </h2>
              <p className="mb-4">
                {tr(
                  "API rate limits apply based on plan tier (Starter: 60 req/min; Pro: 200 req/min; Business: 600 req/min; Enterprise: 1,400+ req/min). You agree not to bypass these rate limits through distributed attacks, credential rotation, or excessive concurrency.",
                  "Les limites de débit de l'API dépendent de votre forfait (Starter : 60 req/min ; Pro : 200 req/min ; Business : 600 req/min ; Enterprise : 1 400+ req/min). Vous vous engagez à ne pas contourner ces quotas par des attaques distribuées, une rotation d'identifiants ou une concurrence excessive."
                )}
              </p>
            </section>

            {/* Section 7 */}
            <section id="ip-rights" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "7. Intellectual Property & Domain Ownership",
                  "7. Propriété intellectuelle et propriété des domaines"
                )}
              </h2>
              <p className="mb-4">
                {tr(
                  "You retain complete ownership of all destination content, custom domain names, brand assets, and marketing links routed through LShorter. LShorter owns all proprietary code, edge worker algorithms, UI components, trademarks, and documentation.",
                  "Vous conservez l'entière propriété de tous vos contenus de destination, noms de domaine personnalisés, éléments de marque et liens marketing routés via LShorter. LShorter détient l'ensemble du code propriétaire, des algorithmes edge worker, des composants d'interface, des marques et de la documentation."
                )}
              </p>
            </section>

            {/* Section 8 */}
            <section id="termination" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "8. Suspension & Account Termination",
                  "8. Suspension et résiliation du compte"
                )}
              </h2>
              <p className="mb-4">
                {tr(
                  "We reserve the right to temporarily suspend or permanently terminate access to the Service immediately without prior notice if you violate our Acceptable Use Policy, engage in fraudulent disputes/chargebacks, or if required by court order or competent law enforcement authority.",
                  "Nous nous réservons le droit de suspendre temporairement ou de résilier définitivement l'accès au Service immédiatement et sans préavis en cas de violation de notre Politique d'utilisation acceptable, de litige ou rétrofacturation frauduleuse, ou sur injonction judiciaire ou demande d'une autorité compétente."
                )}
              </p>
            </section>

            {/* Section 9 */}
            <section id="liability" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "9. Limitation of Liability & Warranty Disclaimer",
                  "9. Limitation de responsabilité et exclusion de garantie"
                )}
              </h2>
              <p className="mb-4 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                {tr(
                  'TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LSHORTER IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS. LSHORTER DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS OR IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. IN NO EVENT SHALL LSHORTER\'S TOTAL AGGREGATE LIABILITY EXCEED THE TOTAL AMOUNT PAID BY YOU TO LSHORTER IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.',
                  'DANS TOUTE LA MESURE AUTORISÉE PAR LA LOI APPLICABLE, LSHORTER EST FOURNI « EN L’ÉTAT » ET « SELON DISPONIBILITÉ ». LSHORTER EXCLUT TOUTE GARANTIE, EXPRESSE OU IMPLICITE, Y COMPRIS DE QUALITÉ MARCHANDE, D’ADÉQUATION À UN USAGE PARTICULIER ET DE NON-CONTREFAÇON. EN AUCUN CAS LA RESPONSABILITÉ GLOBALE CUMULÉE DE LSHORTER NE SAURAIT EXCÉDER LE MONTANT TOTAL QUE VOUS AVEZ VERSÉ À LSHORTER AU COURS DES DOUZE (12) MOIS PRÉCÉDANT LA RÉCLAMATION.'
                )}
              </p>
            </section>

            {/* Section 10 */}
            <section id="governing-law" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "10. Governing Law & Dispute Resolution",
                  "10. Droit applicable et résolution des litiges"
                )}
              </h2>
              <p className="mb-4">
                {tr(
                  "These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law principles. Any dispute arising under these Terms shall be resolved through confidential binding arbitration.",
                  "Les présentes Conditions sont régies et interprétées conformément aux lois de l'État du Delaware (États-Unis), sans égard aux principes de conflit de lois. Tout litige découlant des présentes Conditions sera résolu par arbitrage confidentiel et contraignant."
                )}
              </p>
            </section>

            {/* Section 11 */}
            <section id="contact" className="scroll-mt-28 pt-4">
              <div className="legal-interactive-card p-6 sm:p-8 rounded-[10px] bg-gradient-to-br from-purple-50 to-blue-50 dark:from-[#181126] dark:to-[#0f172a] border border-purple-200/80 dark:border-purple-900/50">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  {tr(
                    "11. Contact Legal & Compliance",
                    "11. Contacter le service juridique et conformité"
                  )}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4 text-xs sm:text-sm">
                  {tr(
                    "Questions regarding these Terms of Service or reports of link abuse should be directed to:",
                    "Pour toute question relative aux présentes Conditions d'utilisation ou pour signaler un lien abusif, contactez :"
                  )}
                </p>

                <div className="space-y-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>
                      {tr(
                        "Security & Vulnerability Reports:",
                        "Sécurité et signalement de vulnérabilités :"
                      )}
                    </strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.security}
                      className="text-purple-600 dark:text-purple-400"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>
                      {tr(
                        "Billing & Subscription Inquiries:",
                        "Facturation et abonnements :"
                      )}
                    </strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.billing}
                      className="text-purple-600 dark:text-purple-400"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>
                      {tr(
                        "Legal & Abuse Inquiries:",
                        "Questions juridiques et signalements d'abus :"
                      )}
                    </strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.contact}
                      className="text-purple-600 dark:text-purple-400"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>{tr("Customer Support:", "Support client :")}</strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.support}
                      className="text-purple-600 dark:text-purple-400"
                    />
                  </div>
                  <p className="pt-1">
                    <strong>{tr("Company:", "Société :")}</strong> LShorter Inc.
                  </p>
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
