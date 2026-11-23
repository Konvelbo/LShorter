"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldAlert,
  CreditCard,
  RefreshCw,
  Clock,
  ArrowLeft,
  ChevronRight,
  Mail,
  Zap,
  Lock,
} from "lucide-react";
import { SITE_EMAILS } from "@/lib/constants/emails";
import { ClickableEmail } from "@/components/ui/clickable-email";
import { useI18n } from "@/components/providers/i18n-provider";

const SECTION_IDS = [
  "all-sales-final",
  "digital-waiver",
  "subscription-cancellation",
  "overages",
  "dodo-billing",
  "chargebacks",
  "contact",
] as const;

export default function NoRefundPolicyPage() {
  const { isFr, tr } = useI18n();
  const lastUpdated = tr("October 8, 2026", "8 octobre 2026");
  const [activeSection, setActiveSection] = useState<string>("all-sales-final");

  const policyHighlights = [
    {
      icon: Lock,
      title: tr("All Sales Are Final", "Toutes les ventes sont définitives"),
      description: tr(
        "Because LShorter provisions instant access to global Cloudflare edge compute and routing infrastructure, all purchases are final and non-refundable.",
        "Parce que LShorter provisionne un accès immédiat au calcul et au routage edge mondial sur Cloudflare, tous les achats sont définitifs et non remboursables."
      ),
    },
    {
      icon: Zap,
      title: tr(
        "Immediate Digital Provisioning",
        "Exécution numérique immédiate"
      ),
      description: tr(
        "Under digital consumer regulations (including EU Directive 2011/83/EU Art. 16(m)), the right of withdrawal is waived upon immediate digital fulfillment.",
        "Conformément au droit des services numériques (dont la directive européenne 2011/83/UE, art. 16(m)), le droit de rétractation est levé dès l'exécution numérique immédiate."
      ),
    },
    {
      icon: RefreshCw,
      title: tr(
        "Cancel Renewals Anytime",
        "Annulez les renouvellements à tout moment"
      ),
      description: tr(
        "You can cancel future auto-renewals in 1 click at any time from your dashboard to ensure you are never billed for future periods.",
        "Vous pouvez annuler les renouvellements automatiques futurs en 1 clic depuis votre tableau de bord afin de ne plus être facturé lors des cycles suivants."
      ),
    },
    {
      icon: CreditCard,
      title: tr(
        "Dodo Payments Merchant of Record",
        "Dodo Payments — Merchant of Record"
      ),
      description: tr(
        "All checkouts, recurring billing, and invoices are handled securely by Dodo Payments as our authorized Merchant of Record.",
        "Tous les paiements, la facturation récurrente et les factures sont gérés en toute sécurité par Dodo Payments, notre Merchant of Record agréé."
      ),
    },
  ];

  const sections = [
    {
      id: "all-sales-final",
      title: tr(
        "1. All Sales Are Final (No Refunds)",
        "1. Toutes les ventes sont définitives (aucun remboursement)"
      ),
    },
    {
      id: "digital-waiver",
      title: tr(
        "2. Statutory Digital Waiver (EU & Global)",
        "2. Renonciation légale au droit de rétractation (UE & international)"
      ),
    },
    {
      id: "subscription-cancellation",
      title: tr(
        "3. Cancelling Future Renewals",
        "3. Annulation des renouvellements futurs"
      ),
    },
    {
      id: "overages",
      title: tr(
        "4. Click Overages & Capacity Add-ons",
        "4. Dépassements de clics et capacités additionnelles"
      ),
    },
    {
      id: "dodo-billing",
      title: tr(
        "5. Dodo Payments Billing & Merchant of Record",
        "5. Facturation Dodo Payments et Merchant of Record"
      ),
    },
    {
      id: "chargebacks",
      title: tr(
        "6. Chargeback Protection & Account Freezes",
        "6. Protection contre les rétrofacturations et gel de compte"
      ),
    },
    {
      id: "contact",
      title: tr(
        "7. Contact Billing Support",
        "7. Contacter le support facturation"
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
          border-color: #f59e0b !important;
        }
        .dark .legal-interactive-card:hover,
        :is(.dark, .dark *) .legal-interactive-card:hover {
          transform: translateY(-4px) scale(1.025) !important;
          box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.75), 0 8px 16px -4px rgba(245, 158, 11, 0.2) !important;
          border-color: #fbbf24 !important;
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
          color: #d97706 !important;
          background-color: rgba(217, 119, 6, 0.08) !important;
          transform: translateX(6px) !important;
        }
        .dark .legal-toc-link:hover,
        :is(.dark, .dark *) .legal-toc-link:hover {
          color: #fbbf24 !important;
          background-color: rgba(251, 191, 36, 0.12) !important;
          transform: translateX(6px) !important;
        }
        .legal-toc-link.active {
          color: #d97706 !important;
          font-weight: 600 !important;
          background-color: rgba(217, 119, 6, 0.12) !important;
          border-left: 3px solid #d97706 !important;
          transform: translateX(4px) !important;
        }
        .dark .legal-toc-link.active,
        :is(.dark, .dark *) .legal-toc-link.active {
          color: #fde68a !important;
          background-color: rgba(251, 191, 36, 0.18) !important;
          border-left: 3px solid #fbbf24 !important;
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
            {tr(
              "Refund & Cancellation Policy",
              "Politique de non-remboursement et d'annulation"
            )}
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center sm:text-left border-b border-neutral-200 dark:border-neutral-800 pb-10 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[10px] text-xs font-semibold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 mb-4">
            <Lock className="w-3.5 h-3.5" />
            <span>
              {tr("Strict Billing Policy", "Politique de facturation stricte")}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            {tr(
              "Refund & Cancellation Policy",
              "Politique de non-remboursement et d'annulation"
            )}
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
            {tr(
              "LShorter provides real-time digital software and immediate global edge redirection infrastructure. To maintain fair pricing and protect our distributed infrastructure, all purchases are final and non-refundable.",
              "LShorter fournit un logiciel numérique en temps réel et une infrastructure mondiale de redirection edge immédiatement opérationnelle. Pour maintenir une tarification juste et protéger notre infrastructure distribuée, tous les achats sont définitifs et non remboursables."
            )}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              {tr("Effective Date:", "Date d'entrée en vigueur :")} {lastUpdated}
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              {tr(
                "All Sales Are Final Policy",
                "Politique stricte : toutes les ventes sont définitives"
              )}
            </span>
          </div>
        </div>

        {/* Highlights with Hover Scale */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {policyHighlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="legal-interactive-card group p-5 rounded-[10px] bg-white dark:bg-[#121214] border border-neutral-200 dark:border-[#222225] shadow-sm"
              >
                <div className="w-10 h-10 rounded-[10px] bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
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
            <section id="all-sales-final" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "1. All Sales Are Final (No Refunds)",
                  "1. Toutes les ventes sont définitives (aucun remboursement)"
                )}
              </h2>
              <div className="legal-interactive-card p-4 rounded-[10px] border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 mb-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                {isFr ? (
                  <>
                    <strong className="text-amber-800 dark:text-amber-300">
                      Avis important :
                    </strong>{" "}
                    LShorter applique une{" "}
                    <strong>politique stricte de non-remboursement</strong>. Tous
                    les achats, y compris les abonnements mensuels et annuels
                    (Pro, Business, Enterprise) ainsi que les tranches de
                    dépassement à l&apos;usage, sont définitifs et non
                    remboursables dès que la transaction est traitée.
                  </>
                ) : (
                  <>
                    <strong className="text-amber-800 dark:text-amber-300">
                      Important Notice:
                    </strong>{" "}
                    LShorter enforces a strict <strong>No-Refund Policy</strong>.
                    All purchases, including monthly and annual plans (Pro,
                    Business, Enterprise) as well as usage-based overage batches,
                    are final and non-refundable once the transaction is
                    processed.
                  </>
                )}
              </div>
              <p className="mb-4">
                {tr(
                  "When you purchase a subscription on LShorter, high-performance edge resources across Cloudflare's 310+ global points of presence, custom SSL certificate generation, API access credentials, and database routing tables are instantly provisioned for your workspace.",
                  "Lorsque vous souscrivez un abonnement sur LShorter, des ressources edge haute performance sur plus de 310 points de présence Cloudflare dans le monde, la génération de certificats SSL personnalisés, des clés d'accès API et des tables de routage en base de données sont immédiatement provisionnés pour votre espace de travail."
                )}
              </p>
              <p>
                {tr(
                  "Because these digital resources and computational capacity are consumed and operational the moment checkout is completed, we do not offer refunds, cash reversals, or credits for any paid fees.",
                  "Ces ressources numériques et capacités de calcul étant mobilisées et opérationnelles dès la validation du paiement, nous n'accordons aucun remboursement, avoir ni rétrocession sur les sommes réglées."
                )}
              </p>
            </section>

            {/* Section 2 */}
            <section id="digital-waiver" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "2. Zero Refund Policy & Statutory Digital Waiver (No 14-Day Withdrawal)",
                  "2. Politique zéro remboursement et renonciation légale (pas de rétractation de 14 jours)"
                )}
              </h2>
              <div className="legal-interactive-card p-4 rounded-[10px] border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 mb-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                {isFr ? (
                  <>
                    <strong>Aucun délai de rétractation de 14 jours :</strong> En
                    raison de la livraison numérique immédiate et de
                    l&apos;allocation instantanée du routage edge sur plus de 310
                    PoP mondiaux, il n&apos;existe{" "}
                    <strong>
                      AUCUN délai de remboursement de 14 jours, aucune période
                      d&apos;essai remboursable ni garantie satisfait ou
                      remboursé
                    </strong>
                    . Toutes les ventes sont strictement définitives.
                  </>
                ) : (
                  <>
                    <strong>No 14-Day Cooling-off Period:</strong> Due to
                    immediate digital delivery and instantaneous edge routing
                    allocation across 310+ global PoPs, there is{" "}
                    <strong>
                      NO 14-day refund window, trial period, or satisfaction
                      guarantee
                    </strong>
                    . All sales are strictly final.
                  </>
                )}
              </div>
              <p className="mb-4">
                {tr(
                  "Under European Union Consumer Rights Directive (Directive 2011/83/EU, Article 16(m)) and equivalent international digital commerce regulations, the statutory 14-day right of withdrawal does not apply to digital services and cloud infrastructure that begin immediately upon checkout with the customer's express prior consent.",
                  "Conformément à la directive européenne sur les droits des consommateurs (directive 2011/83/UE, article 16(m)) et aux réglementations internationales équivalentes relatives au commerce numérique, le droit légal de rétractation de 14 jours ne s'applique pas aux services numériques et infrastructures cloud dont l'exécution commence immédiatement après le paiement avec l'accord préalable exprès du client."
                )}
              </p>
              <p>
                {tr(
                  "By completing your payment, you expressly acknowledge and agree that your access begins immediately and you fully waive any right to cancel, retract, or request a refund. All purchases are final and non-refundable under all circumstances.",
                  "En finalisant votre paiement, vous reconnaissez et acceptez expressément que votre accès commence immédiatement et vous renoncez intégralement à tout droit de rétractation, d'annulation rétroactive ou de demande de remboursement. Tous les achats sont définitifs et non remboursables en toutes circonstances."
                )}
              </p>
            </section>

            {/* Section 3 */}
            <section id="subscription-cancellation" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "3. Cancelling Future Renewals",
                  "3. Annulation des renouvellements futurs"
                )}
              </h2>
              <p className="mb-4">
                {tr(
                  "While past and ongoing billing periods are strictly non-refundable, you maintain full control over your recurring subscription at all times:",
                  "Bien que les périodes facturées passées et en cours soient strictement non remboursables, vous gardez un contrôle total sur votre abonnement récurrent à tout moment :"
                )}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                <li>
                  {isFr ? (
                    <>
                      <strong>Annulation en 1 clic :</strong> Vous pouvez annuler
                      les renouvellements automatiques futurs à tout moment
                      depuis l&apos;onglet{" "}
                      <strong>Paramètres du tableau de bord &gt; Facturation</strong>{" "}
                      sans frais d&apos;annulation.
                    </>
                  ) : (
                    <>
                      <strong>1-Click Cancellation:</strong> You can cancel
                      future auto-renewals at any moment via your{" "}
                      <strong>Dashboard Settings &gt; Billing</strong> tab with
                      zero cancellation fees.
                    </>
                  )}
                </li>
                <li>
                  {isFr ? (
                    <>
                      <strong>Maintien de l&apos;accès :</strong> Lorsque vous
                      annulez un abonnement actif, votre accès reste pleinement
                      opérationnel jusqu&apos;à la fin de la période déjà réglée.
                    </>
                  ) : (
                    <>
                      <strong>Continued Access:</strong> When you cancel an
                      active subscription, your access remains active until the
                      end of your current paid billing period.
                    </>
                  )}
                </li>
                <li>
                  {isFr ? (
                    <>
                      <strong>Aucun prorata rétroactif :</strong> L&apos;annulation
                      prend effet à la fin du cycle en cours ; aucun
                      remboursement partiel n&apos;est accordé pour les jours,
                      liens ou clics non utilisés.
                    </>
                  ) : (
                    <>
                      <strong>No Retroactive Proration:</strong> Cancellation
                      takes effect at the end of the current cycle; no partial
                      refunds are granted for remaining days, unused links, or
                      unused clicks.
                    </>
                  )}
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="overages" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "4. Click Overages & Capacity Add-ons",
                  "4. Dépassements de clics et capacités additionnelles"
                )}
              </h2>
              <p className="mb-4">
                {tr(
                  "Usage-based click batches ($3 per 50,000 clicks on Pro; $8 per 125,000 clicks on Business) are dynamically delivered and consumed on-demand by live internet traffic across edge nodes. Overage charges are billed upon utilization and are non-refundable under all circumstances.",
                  "Les tranches de clics à l'usage (3 $ par tranche de 50 000 clics sur Pro ; 8 $ par tranche de 125 000 clics sur Business) sont allouées dynamiquement et consommées à la demande par le trafic Internet réel sur nos nœuds edge. Les frais de dépassement sont facturés selon la consommation effective et sont non remboursables en toutes circonstances."
                )}
              </p>
            </section>

            {/* Section 5 */}
            <section id="dodo-billing" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                {tr(
                  "5. Dodo Payments Billing & Merchant of Record",
                  "5. Facturation Dodo Payments et Merchant of Record"
                )}
              </h2>
              <p className="mb-4">
                {isFr ? (
                  <>
                    Notre processus de commande est opéré par notre revendeur en
                    ligne et Merchant of Record, <strong>Dodo Payments</strong>,
                    qui gère également les demandes liées aux commandes, la
                    facturation, la conversion de devises ainsi que la conformité
                    fiscale internationale (TVA / taxes de vente).
                  </>
                ) : (
                  <>
                    Our order process is conducted by our online reseller and
                    Merchant of Record, <strong>Dodo Payments</strong>, who also
                    handles order-related inquiries, invoicing, currency
                    conversion, and global sales tax / VAT compliance.
                  </>
                )}
              </p>
              <p>
                {tr(
                  "When you initiate a purchase, you agree to Dodo Payments' checkout terms in conjunction with these LShorter Terms and No-Refund Policy.",
                  "En procédant à un achat, vous acceptez les conditions de paiement de Dodo Payments conjointement avec les Conditions d'utilisation et la présente Politique de non-remboursement de LShorter."
                )}
              </p>
            </section>

            {/* Section 6 */}
            <section id="chargebacks" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                {tr(
                  "6. Chargeback Protection & Account Freezes",
                  "6. Protection contre les rétrofacturations et gel de compte"
                )}
              </h2>
              <div className="legal-interactive-card p-4 rounded-[10px] border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 mb-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                {isFr ? (
                  <>
                    <strong>Politique zéro fraude :</strong> Toutes les
                    transactions étant confirmées avec votre consentement exprès
                    au moment du paiement, l&apos;initiation d&apos;une
                    rétrofacturation (chargeback) ou d&apos;une opposition
                    bancaire injustifiée constitue une violation de notre
                    contrat.
                  </>
                ) : (
                  <>
                    <strong>Zero-Fraud Policy:</strong> Because all transactions
                    are confirmed with explicit consent at checkout, issuing an
                    unauthorized chargeback or payment reversal through your bank
                    constitutes a breach of our agreement.
                  </>
                )}
              </div>
              <p className="mb-4">
                {tr(
                  "In the event of an unjustified chargeback or payment dispute:",
                  "En cas de rétrofacturation ou de contestation de paiement injustifiée :"
                )}
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                <li>
                  {tr(
                    "The associated LShorter account will be immediately suspended.",
                    "Le compte LShorter associé sera immédiatement suspendu."
                  )}
                </li>
                <li>
                  {tr(
                    "All active shortened links, dynamic QR codes, and custom domains will be frozen at the edge.",
                    "Tous les liens raccourcis actifs, QR codes dynamiques et domaines personnalisés seront gelés au niveau edge."
                  )}
                </li>
                <li>
                  {tr(
                    "The account holder will be blacklisted from creating future workspaces on LShorter.",
                    "Le titulaire du compte sera placé sur liste noire et ne pourra plus créer de nouveaux espaces de travail sur LShorter."
                  )}
                </li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="contact" className="scroll-mt-28 pt-4">
              <div className="legal-interactive-card p-6 sm:p-8 rounded-[10px] bg-gradient-to-br from-amber-50 to-neutral-50 dark:from-[#1c160a] dark:to-[#121214] border border-amber-200/80 dark:border-amber-900/50">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  {tr(
                    "7. Contact Billing Support",
                    "7. Contacter le support facturation"
                  )}
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4 text-xs sm:text-sm">
                  {tr(
                    "If you have billing inquiries, need clarification regarding invoices, or wish to manage your subscription renewal status, our team is available to assist you:",
                    "Pour toute question relative à la facturation, aux factures ou au statut de renouvellement de votre abonnement, notre équipe est à votre disposition :"
                  )}
                </p>

                <div className="space-y-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>{tr("Billing Support:", "Support facturation :")}</strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.billing}
                      className="text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>{tr("Customer Support:", "Support client :")}</strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.support}
                      className="text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>{tr("General Inquiries:", "Demandes générales :")}</strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.contact}
                      className="text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <p className="pt-1">
                    <strong>{tr("Merchant of Record:", "Merchant of Record :")}</strong>{" "}
                    Dodo Payments
                  </p>
                  <p>
                    <strong>{tr("Platform:", "Plateforme :")}</strong> LShorter Inc.
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
