"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Server,
  Globe2,
  UserCheck,
  RefreshCcw,
  Mail,
  ArrowLeft,
  ChevronRight,
  Database,
  ExternalLink,
} from "lucide-react";
import { SITE_EMAILS } from "@/lib/constants/emails";
import { ClickableEmail } from "@/components/ui/clickable-email";
import { useI18n } from "@/components/providers/i18n-provider";

export default function PrivacyPolicyPage() {
  const { tr } = useI18n();
  const lastUpdated = tr("October 8, 2026", "8 octobre 2026");
  const [activeSection, setActiveSection] = useState<string>("introduction");

  const trustHighlights = [
    {
      icon: EyeOff,
      title: tr("Zero-Visitor Cookies", "Zéro cookie visiteur"),
      description: tr(
        "We never plant tracking cookies, local beacons, or advertising fingerprints on visitors who click your shortened links.",
        "Nous ne déposons jamais de cookies de suivi, de balises locales ou d'empreintes publicitaires chez les visiteurs qui cliquent sur vos liens courts."
      ),
    },
    {
      icon: Server,
      title: tr("Edge IP Anonymization", "Anonymisation IP en périphérie"),
      description: tr(
        "Visitor IP addresses are anonymized and hashed at the Cloudflare Edge PoP level before telemetry is recorded.",
        "Les adresses IP des visiteurs sont anonymisées et hachées au niveau des PoPs Cloudflare Edge avant tout enregistrement télémétrique."
      ),
    },
    {
      icon: ShieldCheck,
      title: tr("GDPR & CCPA Compliant", "Conforme RGPD & CCPA"),
      description: tr(
        "Strict compliance with European GDPR (RGPD) and California CCPA regulations. Full right to export or delete your account data.",
        "Conformité stricte avec le RGPD européen et le CCPA californien. Droit intégral d'exporter ou de supprimer les données de votre compte."
      ),
    },
    {
      icon: Lock,
      title: tr("PathLock™ Cryptographic PINs", "Codes PIN cryptographiques PathLock™"),
      description: tr(
        "PIN protection uses one-way cryptographic hashes. Your passwords and PIN codes are never stored in plaintext.",
        "La protection par code PIN repose sur un hachage cryptographique à sens unique. Vos mots de passe et codes PIN ne sont jamais stockés en clair."
      ),
    },
  ];

  const tableOfContents = [
    { id: "introduction", title: tr("1. Introduction & Company Overview", "1. Introduction et présentation") },
    { id: "data-collection", title: tr("2. Information We Collect", "2. Données collectées") },
    { id: "visitor-privacy", title: tr("3. Link Visitor Privacy & Edge Routing", "3. Confidentialité des visiteurs et routage Edge") },
    { id: "legal-basis", title: tr("4. Legal Basis for Processing (GDPR)", "4. Base légale du traitement (RGPD)") },
    { id: "data-retention", title: tr("5. Data Retention Schedules", "5. Durées de conservation") },
    { id: "subprocessors", title: tr("6. Third-Party Sub-Processors", "6. Sous-traitants tiers") },
    { id: "user-rights", title: tr("7. Your Rights (GDPR, CCPA & Global)", "7. Vos droits (RGPD, CCPA et international)") },
    { id: "security", title: tr("8. Technical & Organizational Security", "8. Sécurité technique et organisationnelle") },
    { id: "children", title: tr("9. Children's Privacy", "9. Protection des mineurs") },
    { id: "policy-changes", title: tr("10. Changes to This Policy", "10. Modifications de cette politique") },
    { id: "contact", title: tr("11. Contact Privacy Desk", "11. Contacter le pôle confidentialité") },
  ];

  useEffect(() => {
    const handleScroll = () => {
      let current = tableOfContents[0].id;
      for (const section of tableOfContents) {
        const el = document.getElementById(section.id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 260) {
            current = section.id;
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
          border-color: #3b82f6 !important;
        }
        .dark .legal-interactive-card:hover,
        :is(.dark, .dark *) .legal-interactive-card:hover {
          transform: translateY(-4px) scale(1.025) !important;
          box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.75), 0 8px 16px -4px rgba(59, 130, 246, 0.25) !important;
          border-color: #60a5fa !important;
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
          color: #2563eb !important;
          background-color: rgba(37, 99, 235, 0.08) !important;
          transform: translateX(6px) !important;
        }
        .dark .legal-toc-link:hover,
        :is(.dark, .dark *) .legal-toc-link:hover {
          color: #60a5fa !important;
          background-color: rgba(96, 165, 250, 0.12) !important;
          transform: translateX(6px) !important;
        }
        .legal-toc-link.active {
          color: #2563eb !important;
          font-weight: 600 !important;
          background-color: rgba(37, 99, 235, 0.12) !important;
          border-left: 3px solid #2563eb !important;
          transform: translateX(4px) !important;
        }
        .dark .legal-toc-link.active,
        :is(.dark, .dark *) .legal-toc-link.active {
          color: #93c5fd !important;
          background-color: rgba(96, 165, 250, 0.18) !important;
          border-left: 3px solid #60a5fa !important;
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
            {tr("Privacy Policy", "Politique de confidentialité")}
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center sm:text-left border-b border-neutral-200 dark:border-neutral-800 pb-10 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[10px] text-xs font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{tr("Legal & Data Protection", "Juridique & Protection des données")}</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {tr("Privacy Policy", "Politique de confidentialité")}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
            {tr(
              "At LShorter, transparency and data minimization are core principles of our distributed edge architecture. This Privacy Policy details how we collect, use, disclose, and safeguard your data when using our platform and redirect engine.",
              "Chez LShorter, la transparence et la minimisation des données sont au cœur de notre architecture edge distribuée. Cette politique explique comment nous collectons, utilisons et protégeons vos données lorsque vous utilisez notre plateforme et notre moteur de redirection."
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <RefreshCcw className="w-3.5 h-3.5 text-emerald-500" />
              {tr("Effective Date:", "Date d'entrée en vigueur :")} {lastUpdated}
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-blue-500" />
              {tr("Global Application (GDPR, RGPD, CCPA, CPRA)", "Application mondiale (RGPD, GDPR, CCPA, CPRA)")}
            </span>
          </div>
        </div>

        {/* Key Privacy Guarantees Grid with Scale on Hover */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {trustHighlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="legal-interactive-card group p-5 rounded-[10px] bg-white dark:bg-[#121214] border border-neutral-200 dark:border-[#222225] shadow-sm"
              >
                <div className="w-10 h-10 rounded-[10px] bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
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

        {/* Layout: Sidebar TOC + Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Desktop Sticky Table of Contents with Simple CSS Hover Animation & Active Class */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 p-6 rounded-[10px] bg-white dark:bg-[#121214] border border-neutral-200 dark:border-[#222225]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
                {tr("Table of Contents", "Sommaire")}
              </h2>
              <nav className="space-y-1">
                {tableOfContents.map((section) => {
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

          {/* Legal Text Body */}
          <main className="lg:col-span-8 space-y-12 text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {/* Section 1 */}
            <section id="introduction" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <span>{tr("1. Introduction & Company Overview", "1. Introduction et présentation")}</span>
              </h2>
              <p className="mb-4">
                {tr(
                  'LShorter ("LShorter", "we", "us", or "our") provides high-performance URL shortening, programmable edge routing, A/B testing, dynamic QR codes, and analytics infrastructure designed for modern digital teams and developers.',
                  'LShorter (« LShorter », « nous », « notre ») fournit une infrastructure haute performance de raccourcissement d\'URL, de routage edge programmable, de tests A/B, de codes QR dynamiques et d\'analytique conçue pour les équipes digitales et les développeurs.'
                )}
              </p>
              <p>
                {tr("This Privacy Policy applies to personal data collected via our website (", "La présente politique de confidentialité s'applique aux données personnelles collectées via notre site (")}
                <strong>lsho.cc</strong>
                {tr(
                  "), dashboard applications, APIs, SDKs, and link redirection services. By accessing or using LShorter, you acknowledge that you have read and understood this Privacy Policy.",
                  "), nos applications de tableau de bord, nos API, nos SDK et nos services de redirection de liens. En accédant à LShorter ou en l'utilisant, vous reconnaissez avoir lu et compris cette politique."
                )}
              </p>
            </section>

            {/* Section 2 */}
            <section id="data-collection" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr("2. Information We Collect", "2. Données collectées")}
              </h2>
              <p className="mb-4">
                {tr("We clearly differentiate between data collected from ", "Nous distinguons clairement les données collectées auprès des ")}
                <strong>{tr("Registered Account Users", "utilisateurs titulaires d'un compte")}</strong>{" "}
                {tr("and telemetry collected from ", "et la télémétrie collectée auprès des ")}
                <strong>{tr("End-User Link Visitors", "visiteurs finaux des liens")}</strong> :
              </p>

              <div className="space-y-4 my-6">
                <div className="legal-interactive-card p-5 rounded-[10px] bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800">
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    {tr("A. Registered Account Holders", "A. Titulaires de compte inscrit")}
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    <li>
                      <strong>{tr("Account Identification:", "Identification du compte :")}</strong>{" "}
                      {tr(
                        "Full name, email address, password hash (encrypted with modern bcrypt algorithms), or third-party OAuth profile IDs (Google, GitHub).",
                        "Nom complet, adresse e-mail, empreinte de mot de passe (chiffrée avec bcrypt) ou identifiants OAuth tiers (Google, GitHub)."
                      )}
                    </li>
                    <li>
                      <strong>{tr("Billing & Payment Information:", "Facturation et paiements :")}</strong>{" "}
                      {tr(
                        "Payment transactions and subscription orders are processed directly through our Merchant of Record and payment provider, ",
                        "Les paiements et abonnements sont traités directement par notre marchand officiel (Merchant of Record), "
                      )}
                      <strong>Dodo Payments</strong>
                      {tr(
                        ", which complies with PCI-DSS Level 1 standards. Dodo Payments securely manages checkout, recurring billing, fraud prevention, and international tax compliance. LShorter never stores or sees raw credit card numbers or CVV codes.",
                        ", conforme aux normes PCI-DSS niveau 1. Dodo Payments gère de manière sécurisée le paiement, la facturation récurrente, la prévention de la fraude et la conformité fiscale internationale. LShorter ne voit ni ne stocke jamais vos numéros de carte bancaire ou codes CVV."
                      )}
                    </li>
                    <li>
                      <strong>{tr("Customer Support Communications:", "Échanges avec le support :")}</strong>{" "}
                      {tr(
                        "Inquiries, bug reports, and communications submitted via email or our support channels.",
                        "Demandes d'assistance, signalements de bugs et messages envoyés par e-mail ou via nos canaux de support."
                      )}
                    </li>
                    <li>
                      <strong>{tr("Configuration & Assets:", "Configuration et ressources :")}</strong>{" "}
                      {tr(
                        "Custom domains, destination URLs, geographic routing rules, UTM parameters, and webhook endpoints.",
                        "Domaines personnalisés, URLs de destination, règles de routage géographique, paramètres UTM et endpoints webhook."
                      )}
                    </li>
                  </ul>
                </div>

                <div className="legal-interactive-card p-5 rounded-[10px] bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800">
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-blue-500" />
                    {tr("B. Link Visitors (Anonymous Edge Redirection)", "B. Visiteurs de liens (redirection edge anonyme)")}
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    {tr(
                      "When someone clicks a shortened link hosted on LShorter or a verified custom domain, our edge infrastructure processes the incoming HTTP request. To preserve privacy:",
                      "Lorsqu'une personne clique sur un lien court hébergé sur LShorter ou sur un domaine personnalisé vérifié, notre infrastructure edge traite la requête HTTP entrante. Pour préserver la vie privée :"
                    )}
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    <li>
                      <strong>{tr("No Personal Profiling:", "Aucun profilage personnel :")}</strong>{" "}
                      {tr(
                        "We do NOT create persistent behavioral profiles, track across distinct domains, or sell browsing histories.",
                        "Nous ne créons AUCUN profil comportemental persistant, n'effectuons aucun suivi inter-domaines et ne vendons jamais d'historiques de navigation."
                      )}
                    </li>
                    <li>
                      <strong>{tr("Coarse Telemetry Only:", "Télémétrie agrégée uniquement :")}</strong>{" "}
                      {tr(
                        "Country, region, city, device category (Mobile/Desktop/Tablet), OS, browser engine, and HTTP referrer header.",
                        "Pays, région, ville, type d'appareil (Mobile/Ordinateur/Tablette), système d'exploitation, navigateur et en-tête HTTP Referer."
                      )}
                    </li>
                    <li>
                      <strong>{tr("Zero Third-Party Advertising Trackers:", "Zéro traqueur publicitaire tiers :")}</strong>{" "}
                      {tr(
                        "No marketing pixels or ad beacons are introduced into the redirect sequence by LShorter.",
                        "Aucun pixel marketing ou balise publicitaire n'est injecté dans la redirection par LShorter."
                      )}
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="visitor-privacy" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr("3. Link Visitor Privacy & Edge Routing", "3. Confidentialité des visiteurs et routage Edge")}
              </h2>
              <p className="mb-4">
                {tr(
                  "Our redirect engine operates across Cloudflare's 310+ global edge locations. We implement strict data minimization principles:",
                  "Notre moteur de redirection fonctionne sur plus de 310 points de présence Cloudflare dans le monde, selon des principes stricts de minimisation des données :"
                )}
              </p>
              <div className="space-y-4">
                <div className="legal-interactive-card p-4 rounded-[10px] border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    {tr("IP Address Anonymization at the Edge", "Anonymisation des adresses IP en périphérie")}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {tr(
                      "Raw visitor IP addresses are evaluated solely in temporary RAM at the edge node to resolve country/city geo-coordinates and detect malicious DDoS traffic. The raw IP is immediately discarded or transformed into a salted, one-way hash before any click telemetry is permanently saved.",
                      "Les adresses IP brutes des visiteurs sont évaluées uniquement en mémoire temporaire sur le nœud edge pour déterminer la géolocalisation pays/ville et bloquer le trafic DDoS malveillant. L'IP brute est immédiatement supprimée ou transformée en empreinte salée irréversible avant tout enregistrement."
                    )}
                  </p>
                </div>

                <div className="legal-interactive-card p-4 rounded-[10px] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    {tr("PathLock™ Zero-Knowledge Protection", "Protection Zero-Knowledge PathLock™")}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {tr(
                      "When a user configures a PIN code on a shortened link, the PIN is verified using cryptographic hashing. Neither LShorter operators nor database backups hold your PIN in plaintext.",
                      "Lorsqu'un utilisateur configure un code PIN sur un lien court, celui-ci est vérifié par hachage cryptographique. Ni les opérateurs de LShorter ni nos sauvegardes ne détiennent votre code PIN en clair."
                    )}
                  </p>
                </div>

                <div className="legal-interactive-card p-4 rounded-[10px] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    {tr("Zero-Referrer Destination Masking", "Masquage de destination Zero-Referrer")}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {tr(
                      "When Zero-Referrer masking is enabled, LShorter terminates the HTTP Referrer chain via HTTP headers and secure client meta-redirection, preventing downstream origin leakage to destination servers.",
                      "Lorsque le masquage Zero-Referrer est activé, LShorter interrompt la chaîne HTTP Referer via des en-têtes sécurisés, empêchant toute fuite d'origine vers les serveurs de destination."
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="legal-basis" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr("4. Legal Basis for Processing under GDPR", "4. Base légale du traitement (RGPD)")}
              </h2>
              <p className="mb-4">
                {tr(
                  "For individuals located in the European Economic Area (EEA), the United Kingdom, or Switzerland, we process personal data under the following lawful bases pursuant to Article 6 of the General Data Protection Regulation (GDPR):",
                  "Pour les personnes résidant dans l'Espace économique européen (EEE), au Royaume-Uni ou en Suisse, nous traitons les données personnelles selon les bases légales de l'article 6 du RGPD :"
                )}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <strong>{tr("Performance of Contract (Art. 6(1)(b)):", "Exécution du contrat (Art. 6(1)(b)) :")}</strong>{" "}
                  {tr(
                    "To provide our services, authenticate accounts, execute redirects, process subscription orders, and fulfill our Terms of Service.",
                    "Pour fournir nos services, authentifier les comptes, exécuter les redirections, traiter les abonnements et respecter nos Conditions d'utilisation."
                  )}
                </li>
                <li>
                  <strong>{tr("Legitimate Interests (Art. 6(1)(f)):", "Intérêts légitimes (Art. 6(1)(f)) :")}</strong>{" "}
                  {tr(
                    "To secure our edge infrastructure against phishing, abuse, fraud, and bot attacks, as well as to optimize platform performance and uptime.",
                    "Pour protéger notre infrastructure edge contre le phishing, les abus, la fraude et les attaques de bots, et optimiser les performances et la disponibilité."
                  )}
                </li>
                <li>
                  <strong>{tr("Compliance with Legal Obligations (Art. 6(1)(c)):", "Obligations légales (Art. 6(1)(c)) :")}</strong>{" "}
                  {tr(
                    "To maintain tax, accounting, and corporate audit records as mandated by applicable laws.",
                    "Pour conserver les pièces fiscales, comptables et d'audit exigées par la loi."
                  )}
                </li>
                <li>
                  <strong>{tr("Consent (Art. 6(1)(a)):", "Consentement (Art. 6(1)(a)) :")}</strong>{" "}
                  {tr(
                    "Where explicitly obtained, such as for optional marketing updates (which you can withdraw at any time).",
                    "Lorsqu'il est explicitement recueilli, notamment pour les communications marketing facultatives (révocables à tout moment)."
                  )}
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="data-retention" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr("5. Data Retention Schedules", "5. Durées de conservation")}
              </h2>
              <p className="mb-4">
                {tr(
                  "We store data only for as long as necessary to fulfill the operational purposes described in this policy:",
                  "Nous ne conservons les données que pendant la durée strictement nécessaire aux finalités décrites dans cette politique :"
                )}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border border-neutral-200 dark:border-neutral-800 rounded-[10px] overflow-hidden">
                  <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-neutral-900 dark:text-white">
                    <tr>
                      <th className="p-3 font-semibold">{tr("Data Category", "Catégorie de données")}</th>
                      <th className="p-3 font-semibold">{tr("Tier / Context", "Forfait / Contexte")}</th>
                      <th className="p-3 font-semibold">{tr("Retention Window", "Durée de conservation")}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-600 dark:text-neutral-400">
                    <tr>
                      <td className="p-3 font-medium text-neutral-900 dark:text-white">
                        {tr("Click Analytics & Telemetry", "Statistiques de clics & Télémétrie")}
                      </td>
                      <td className="p-3">{tr("Starter (Free) Plan", "Forfait Starter (Gratuit)")}</td>
                      <td className="p-3">{tr("30 Days (Rolling window enforced at edge & query level)", "30 jours (fenêtre glissante)")}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-neutral-900 dark:text-white">
                        {tr("Click Analytics & Telemetry", "Statistiques de clics & Télémétrie")}
                      </td>
                      <td className="p-3">{tr("Pro Plan", "Forfait Pro")}</td>
                      <td className="p-3">{tr("365 Days (1 Year rolling window)", "365 jours (fenêtre glissante d'1 an)")}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-neutral-900 dark:text-white">
                        {tr("Click Analytics & Telemetry", "Statistiques de clics & Télémétrie")}
                      </td>
                      <td className="p-3">{tr("Business & Enterprise Plans", "Forfaits Business & Enterprise")}</td>
                      <td className="p-3">{tr("Full Account Lifetime", "Toute la durée de vie du compte")}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-neutral-900 dark:text-white">
                        {tr("Account Profile & Auth Data", "Profil de compte & Authentification")}
                      </td>
                      <td className="p-3">{tr("All Active Accounts", "Tous les comptes actifs")}</td>
                      <td className="p-3">{tr("Retained until account deletion by user", "Conservées jusqu'à la suppression du compte")}</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-neutral-900 dark:text-white">
                        {tr("Billing & Tax Records", "Facturation & Pièces fiscales")}
                      </td>
                      <td className="p-3">{tr("Paid Subscriptions", "Abonnements payants")}</td>
                      <td className="p-3">{tr("7 Years (Managed by Merchant of Record Dodo Payments for statutory audits)", "7 ans (géré par Dodo Payments pour obligations légales)")}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 6 */}
            <section id="subprocessors" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr("6. Third-Party Sub-Processors", "6. Sous-traitants tiers")}
              </h2>
              <p className="mb-4">
                {tr(
                  "To guarantee high availability, global low-latency resolution, and secure billing, we rely on industry-leading infrastructure partners who meet stringent data protection agreements:",
                  "Pour garantir une haute disponibilité, une latence minimale dans le monde entier et une facturation sécurisée, nous travaillons avec des partenaires d'infrastructure soumis à des accords stricts de protection des données :"
                )}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="legal-interactive-card p-4 rounded-[10px] bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    Cloudflare Inc.
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    {tr(
                      "Global Edge Workers, Anycast DNS, DDoS mitigation, and KV storage.",
                      "Edge Workers mondiaux, DNS Anycast, protection DDoS et stockage KV."
                    )}
                  </p>
                  <span className="text-[11px] font-mono text-neutral-400">{tr("USA & Global PoPs (SOC 2, ISO 27001)", "USA & PoPs mondiaux (SOC 2, ISO 27001)")}</span>
                </div>

                <div className="legal-interactive-card p-4 rounded-[10px] bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    Convex Inc.
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    {tr(
                      "Realtime serverless transactional database and cloud application backend.",
                      "Base de données transactionnelle serverless temps réel et backend applicatif cloud."
                    )}
                  </p>
                  <span className="text-[11px] font-mono text-neutral-400">{tr("USA (SOC 2 Type II Certified)", "USA (Certifié SOC 2 Type II)")}</span>
                </div>

                <div className="legal-interactive-card p-4 rounded-[10px] bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    Dodo Payments
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    {tr(
                      "Merchant of Record, checkout, global payment processing, fraud prevention, and international tax/VAT compliance.",
                      "Marchand officiel (Merchant of Record), paiement, prévention de la fraude et conformité TVA/fiscale internationale."
                    )}
                  </p>
                  <span className="text-[11px] font-mono text-neutral-400">{tr("Global (PCI-DSS Level 1 Merchant of Record)", "International (PCI-DSS Niveau 1)")}</span>
                </div>

                <div className="legal-interactive-card p-4 rounded-[10px] bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    Resend Inc.
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    {tr(
                      "Transactional email delivery, login magic links, and team invites.",
                      "Envoi d'e-mails transactionnels, liens de connexion et invitations d'équipe."
                    )}
                  </p>
                  <span className="text-[11px] font-mono text-neutral-400">{tr("USA (GDPR Compliant DPA)", "USA (DPA conforme RGPD)")}</span>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="user-rights" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr("7. Your Rights (GDPR, CCPA & Global)", "7. Vos droits (RGPD, CCPA et international)")}
              </h2>
              <p className="mb-4">
                {tr(
                  "Under European (GDPR), UK, and Californian (CCPA/CPRA) privacy legislations, you enjoy substantial rights over your personal data:",
                  "En vertu des législations européenne (RGPD), britannique et californienne (CCPA/CPRA), vous disposez des droits suivants sur vos données personnelles :"
                )}
              </p>
              <div className="space-y-3">
                <div className="legal-interactive-card p-4 rounded-[10px] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    {tr("• Right of Access & Data Portability (GDPR Art. 15, 20)", "• Droit d'accès et de portabilité (RGPD Art. 15, 20)")}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {tr(
                      "You may request a copy of all personal information we hold about you in a structured, machine-readable JSON/CSV format directly from your ",
                      "Vous pouvez demander une copie structurée et exploitable (JSON/CSV) de toutes vos données directement depuis vos "
                    )}
                    <Link href="/dashboard/settings" className="text-blue-600 dark:text-blue-400 hover:underline">
                      {tr("Dashboard Settings", "Paramètres du tableau de bord")}
                    </Link>
                    .
                  </p>
                </div>

                <div className="legal-interactive-card p-4 rounded-[10px] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    {tr("• Right to Rectification & Deletion (GDPR Art. 16, 17)", "• Droit de rectification et d'effacement (RGPD Art. 16, 17)")}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {tr(
                      'You have the right to correct inaccurate records or permanently delete ("Right to be Forgotten") your account and associated links. Deleting your account irreversibly removes all shortened links and historical telemetry.',
                      "Vous avez le droit de corriger les informations inexactes ou de supprimer définitivement (« droit à l'oubli ») votre compte et tous les liens associés de manière irréversible."
                    )}
                  </p>
                </div>

                <div className="legal-interactive-card p-4 rounded-[10px] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    {tr("• CCPA Notice: We Do NOT Sell or Share Personal Information", "• Avis CCPA : nous ne vendons ni ne partageons aucune donnée personnelle")}
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    {tr(
                      "LShorter has not sold, does not sell, and will never sell personal information to third parties or data brokers. We do not engage in cross-context behavioral advertising.",
                      "LShorter n'a jamais vendu, ne vend pas et ne vendra jamais de données personnelles à des tiers ou courtiers en données. Nous ne faisons aucune publicité comportementale inter-contexte."
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="security" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr("8. Technical & Organizational Security", "8. Sécurité technique et organisationnelle")}
              </h2>
              <p className="mb-4">
                {tr(
                  "We implement comprehensive enterprise-grade security controls:",
                  "Nous appliquons des contrôles de sécurité de niveau entreprise :"
                )}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <strong>{tr("Transport Layer Security:", "Chiffrement en transit :")}</strong>{" "}
                  {tr(
                    "All web traffic and edge redirection calls are encrypted using Modern TLS 1.3 with automatic HSTS enforcement.",
                    "Tout le trafic web et toutes les redirections edge sont chiffrés via TLS 1.3 avec HSTS automatique."
                  )}
                </li>
                <li>
                  <strong>{tr("Database Encryption:", "Chiffrement des bases de données :")}</strong>{" "}
                  {tr(
                    "All data stored at rest is encrypted with AES-256 standard encryption keys.",
                    "Toutes les données stockées au repos sont chiffrées avec la norme AES-256."
                  )}
                </li>
                <li>
                  <strong>{tr("Anti-Phishing Automated Scanners:", "Détection anti-phishing automatisée :")}</strong>{" "}
                  {tr(
                    "Destination URLs are systematically screened against global real-time malware and malicious intelligence databases to protect internet users.",
                    "Les URLs de destination sont systématiquement vérifiées face aux bases mondiales anti-malware et anti-phishing en temps réel."
                  )}
                </li>
                <li>
                  <strong>{tr("Security Incident Reporting:", "Signalement d'incident de sécurité :")}</strong>{" "}
                  {tr(
                    "Vulnerability disclosures, suspected breaches, or infrastructure audits should be reported directly to our security engineering team at ",
                    "Toute vulnérabilité, suspicion de faille ou demande d'audit doit être signalée directement à notre équipe sécurité à "
                  )}
                  <ClickableEmail
                    email={SITE_EMAILS.security}
                    className="text-blue-600 dark:text-blue-400"
                  />.
                </li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="children" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr("9. Children's Privacy", "9. Protection des mineurs")}
              </h2>
              <p>
                {tr(
                  "LShorter is not designed for or marketed to individuals under the age of 16. We do not knowingly collect personal information from children. If you become aware that a minor has provided us with personal data, please contact our privacy desk immediately.",
                  "LShorter n'est pas conçu pour les personnes de moins de 16 ans. Nous ne collectons sciemment aucune donnée personnelle concernant des mineurs. Si vous pensez qu'un mineur nous a transmis des données, contactez immédiatement notre pôle confidentialité."
                )}
              </p>
            </section>

            {/* Section 10 */}
            <section id="policy-changes" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr("10. Changes to This Policy", "10. Modifications de cette politique")}
              </h2>
              <p>
                {tr(
                  'We may revise this Privacy Policy periodically to reflect technological changes, new legal requirements, or enhancements to our platform. Material modifications will be signaled by updating the "Effective Date" at the top of this document and providing prominent notice within your dashboard or via email.',
                  "Nous pouvons réviser cette politique de confidentialité périodiquement pour refléter les évolutions techniques, légales ou produit. Toute modification majeure sera signalée par la mise à jour de la date d'entrée en vigueur et par un avis dans votre tableau de bord ou par e-mail."
                )}
              </p>
            </section>

            {/* Section 11 */}
            <section id="contact" className="scroll-mt-28 pt-4">
              <div className="legal-interactive-card p-6 sm:p-8 rounded-[10px] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#111827] dark:to-[#0f172a] border border-blue-200/80 dark:border-blue-900/50">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  {tr("11. Contact Privacy Desk", "11. Contacter le pôle confidentialité")}
                </h2>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4 text-xs sm:text-sm">
                  {tr(
                    "If you have inquiries regarding this Privacy Policy or wish to exercise your GDPR/CCPA statutory rights, reach out to our team:",
                    "Pour toute question relative à cette politique ou pour exercer vos droits RGPD/CCPA, contactez notre équipe :"
                  )}
                </p>

                <div className="space-y-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>{tr("Security & Vulnerability Desk:", "Sécurité & Vulnérabilités :")}</strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.security}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>{tr("Billing & Data Requests:", "Facturation & Demandes de données :")}</strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.billing}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>{tr("General & Privacy Inquiries:", "Questions générales & Confidentialité :")}</strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.contact}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>{tr("Customer Support:", "Support client :")}</strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.support}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <p className="pt-1">
                    <strong>{tr("Organization:", "Organisation :")}</strong>{" "}
                    {tr(
                      "LShorter Inc. (Data Protection & Legal Compliance Desk)",
                      "LShorter Inc. (Pôle Protection des Données & Conformité Juridique)"
                    )}
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
