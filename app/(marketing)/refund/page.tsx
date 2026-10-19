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

export default function NoRefundPolicyPage() {
  const lastUpdated = "October 8, 2026";
  const [activeSection, setActiveSection] = useState<string>("all-sales-final");

  const policyHighlights = [
    {
      icon: Lock,
      title: "All Sales Are Final",
      description:
        "Because LShorter provisions instant access to global Cloudflare edge compute and routing infrastructure, all purchases are final and non-refundable.",
    },
    {
      icon: Zap,
      title: "Immediate Digital Provisioning",
      description:
        "Under digital consumer regulations (including EU Directive 2011/83/EU Art. 16(m)), the right of withdrawal is waived upon immediate digital fulfillment.",
    },
    {
      icon: RefreshCw,
      title: "Cancel Renewals Anytime",
      description:
        "You can cancel future auto-renewals in 1 click at any time from your dashboard to ensure you are never billed for future periods.",
    },
    {
      icon: CreditCard,
      title: "Paddle Merchant of Record",
      description:
        "All checkouts, recurring billing, and invoices are handled securely by Paddle.com Market Ltd as our authorized Merchant of Record.",
    },
  ];

  const sections = [
    { id: "all-sales-final", title: "1. All Sales Are Final (No Refunds)" },
    { id: "digital-waiver", title: "2. Statutory Digital Waiver (EU & Global)" },
    { id: "subscription-cancellation", title: "3. Cancelling Future Renewals" },
    { id: "overages", title: "4. Click Overages & Capacity Add-ons" },
    { id: "paddle-billing", title: "5. Paddle Billing & Merchant of Record" },
    { id: "chargebacks", title: "6. Chargeback Protection & Account Freezes" },
    { id: "contact", title: "7. Contact Billing Support" },
  ];

  useEffect(() => {
    const handleScroll = () => {
      let current = sections[0].id;
      for (const section of sections) {
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
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-neutral-400 dark:text-neutral-600" />
          <span className="text-neutral-900 dark:text-white font-medium">
            Refund & Cancellation Policy
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center sm:text-left border-b border-neutral-200 dark:border-neutral-800 pb-10 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[10px] text-xs font-semibold uppercase tracking-wider bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200/60 dark:border-amber-800/60 mb-4">
            <Lock className="w-3.5 h-3.5" />
            <span>Strict Billing Policy</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Refund & Cancellation Policy
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
            LShorter provides real-time digital software and immediate global edge redirection
            infrastructure. To maintain fair pricing and protect our distributed infrastructure,
            all purchases are final and non-refundable.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Effective Date: {lastUpdated}
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
              <ShieldAlert className="w-3.5 h-3.5" />
              All Sales Are Final Policy
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
                Sections
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
                1. All Sales Are Final (No Refunds)
              </h2>
              <div className="legal-interactive-card p-4 rounded-[10px] border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 mb-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                <strong className="text-amber-800 dark:text-amber-300">Important Notice:</strong>{" "}
                LShorter enforces a strict <strong>No-Refund Policy</strong>. All purchases, including
                monthly and annual plans (Pro, Business, Enterprise) as well as usage-based overage batches,
                are final and non-refundable once the transaction is processed.
              </div>
              <p className="mb-4">
                When you purchase a subscription on LShorter, high-performance edge resources across
                Cloudflare&apos;s 310+ global points of presence, custom SSL certificate generation,
                API access credentials, and database routing tables are instantly provisioned for your workspace.
              </p>
              <p>
                Because these digital resources and computational capacity are consumed and operational
                the moment checkout is completed, we do not offer refunds, cash reversals, or credits for
                any paid fees.
              </p>
            </section>

            {/* Section 2 */}
            <section id="digital-waiver" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                2. Zero Refund Policy & Statutory Digital Waiver (No 14-Day Withdrawal)
              </h2>
              <div className="legal-interactive-card p-4 rounded-[10px] border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 mb-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                <strong>No 14-Day Cooling-off Period:</strong> Due to immediate digital delivery and instantaneous edge routing allocation across 310+ global PoPs, there is <strong>NO 14-day refund window, trial period, or satisfaction guarantee</strong>. All sales are strictly final.
              </div>
              <p className="mb-4">
                Under European Union Consumer Rights Directive (Directive 2011/83/EU, Article 16(m)) and
                equivalent international digital commerce regulations, the statutory 14-day right of withdrawal
                does not apply to digital services and cloud infrastructure that begin immediately upon checkout with the customer&apos;s express prior consent.
              </p>
              <p>
                By completing your payment, you expressly acknowledge and agree that your access begins immediately and you fully waive any right to cancel, retract, or request a refund. All purchases are final and non-refundable under all circumstances.
              </p>
            </section>

            {/* Section 3 */}
            <section id="subscription-cancellation" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                3. Cancelling Future Renewals
              </h2>
              <p className="mb-4">
                While past and ongoing billing periods are strictly non-refundable, you maintain full
                control over your recurring subscription at all times:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                <li>
                  <strong>1-Click Cancellation:</strong> You can cancel future auto-renewals at any moment
                  via your <strong>Dashboard Settings &gt; Billing</strong> tab with zero cancellation fees.
                </li>
                <li>
                  <strong>Continued Access:</strong> When you cancel an active subscription, your access
                  remains active until the end of your current paid billing period.
                </li>
                <li>
                  <strong>No Retroactive Proration:</strong> Cancellation takes effect at the end of the
                  current cycle; no partial refunds are granted for remaining days, unused links, or unused clicks.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="overages" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                4. Click Overages & Capacity Add-ons
              </h2>
              <p className="mb-4">
                Usage-based click batches ($3 per 50,000 clicks on Pro; $8 per 125,000 clicks on Business)
                are dynamically delivered and consumed on-demand by live internet traffic across edge nodes.
                Overage charges are billed upon utilization and are non-refundable under all circumstances.
              </p>
            </section>

            {/* Section 5 */}
            <section id="paddle-billing" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                5. Paddle Billing & Merchant of Record
              </h2>
              <p className="mb-4">
                Our order process is conducted by our online reseller and Merchant of Record,{" "}
                <strong>Paddle.com Market Ltd</strong> (Paddle.com), who also handles order-related inquiries,
                invoicing, currency conversion, and global sales tax / VAT compliance.
              </p>
              <p>
                When you initiate a purchase, you agree to Paddle&apos;s checkout terms in conjunction with
                these LShorter Terms and No-Refund Policy.
              </p>
            </section>

            {/* Section 6 */}
            <section id="chargebacks" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-500" />
                6. Chargeback Protection & Account Freezes
              </h2>
              <div className="legal-interactive-card p-4 rounded-[10px] border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 mb-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                <strong>Zero-Fraud Policy:</strong> Because all transactions are confirmed with explicit
                consent at checkout, issuing an unauthorized chargeback or payment reversal through your bank
                constitutes a breach of our agreement.
              </div>
              <p className="mb-4">
                In the event of an unjustified chargeback or payment dispute:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                <li>The associated LShorter account will be immediately suspended.</li>
                <li>All active shortened links, dynamic QR codes, and custom domains will be frozen at the edge.</li>
                <li>The account holder will be blacklisted from creating future workspaces on LShorter.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="contact" className="scroll-mt-28 pt-4">
              <div className="legal-interactive-card p-6 sm:p-8 rounded-[10px] bg-gradient-to-br from-amber-50 to-neutral-50 dark:from-[#1c160a] dark:to-[#121214] border border-amber-200/80 dark:border-amber-900/50">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  7. Contact Billing Support
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4 text-xs sm:text-sm">
                  If you have billing inquiries, need clarification regarding invoices, or wish to manage your
                  subscription renewal status, our team is available to assist you:
                </p>

                <div className="space-y-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>Billing Support:</strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.billing}
                      className="text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>Customer Support:</strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.support}
                      className="text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <strong>General Inquiries:</strong>{" "}
                    <ClickableEmail
                      email={SITE_EMAILS.contact}
                      className="text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <p className="pt-1">
                    <strong>Merchant of Record:</strong> Paddle.com Market Ltd
                  </p>
                  <p>
                    <strong>Platform:</strong> LShorter Inc.
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
