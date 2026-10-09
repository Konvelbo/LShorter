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

export default function TermsOfServicePage() {
  const lastUpdated = "October 8, 2026";
  const [activeSection, setActiveSection] = useState<string>("acceptance");

  const keyTerms = [
    {
      icon: ShieldAlert,
      title: "Zero Tolerance Phishing",
      description:
        "LShorter strictly prohibits phishing, malware, credential harvesting, scamming, and illegal content. Infringing links are instantaneously nuked at the edge.",
    },
    {
      icon: Server,
      title: "99.9% Edge SLA",
      description:
        "Our redirect engine runs across 310+ Cloudflare Edge locations worldwide, ensuring ultra-low latency sub-15ms redirection and high availability.",
    },
    {
      icon: KeyRound,
      title: "PathLock™ & Masking Rules",
      description:
        "PIN protection and Zero-Referrer masking are intended for brand safety and affiliate attribution, not to conceal illicit payloads.",
    },
    {
      icon: Scale,
      title: "Fair Developer API Limits",
      description:
        "Tier-based programmatic API access with clear rate limits and real-time webhook telemetry to ensure system-wide stability.",
    },
  ];

  const sections = [
    { id: "acceptance", title: "1. Acceptance of Terms" },
    { id: "accounts", title: "2. Account Registration & Security" },
    { id: "acceptable-use", title: "3. Acceptable Use & Anti-Abuse Policy" },
    { id: "edge-sla", title: "4. Edge Infrastructure & SLA Commitments" },
    { id: "billing", title: "5. Billing, Paddle MoR & No-Refund Policy" },
    { id: "api-terms", title: "6. Developer API & SDK Usage" },
    { id: "ip-rights", title: "7. Intellectual Property & Domain Ownership" },
    { id: "termination", title: "8. Suspension & Account Termination" },
    { id: "liability", title: "9. Limitation of Liability & Warranty Disclaimer" },
    { id: "governing-law", title: "10. Governing Law & Dispute Resolution" },
    { id: "contact", title: "11. Contact Legal & Compliance" },
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
            Home
          </Link>
          <ChevronRight className="w-3 h-3 text-neutral-400 dark:text-neutral-600" />
          <span className="text-neutral-900 dark:text-white font-medium">
            Terms of Service
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center sm:text-left border-b border-neutral-200 dark:border-neutral-800 pb-10 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60 mb-4">
            <FileText className="w-3.5 h-3.5" />
            <span>Legal Agreement</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Terms of Service
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
            These Terms of Service govern your access to and use of LShorter&apos;s link shortening
            infrastructure, APIs, dashboard, and edge services. Please read them carefully.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Effective Date: {lastUpdated}
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-purple-500" />
              Binding Customer Agreement
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
                className="legal-interactive-card group p-5 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-[#222225] shadow-sm"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
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
            <div className="sticky top-28 p-6 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-[#222225]">
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
            <section id="acceptance" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                1. Acceptance of Terms
              </h2>
              <p className="mb-4">
                By signing up for, accessing, or using LShorter (&quot;Service&quot;), provided by LShorter Inc.,
                you agree to be bound by these Terms of Service (&quot;Terms&quot;). If you are using the Service on
                behalf of a company, organization, or other entity, you represent and warrant that you
                have the legal authority to bind that entity to these Terms.
              </p>
              <p>
                If you do not agree to these Terms, you must not access or use the Service.
              </p>
            </section>

            {/* Section 2 */}
            <section id="accounts" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                2. Account Registration & Security
              </h2>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  You must provide accurate, current, and complete registration information during signup.
                </li>
                <li>
                  You are solely responsible for safeguarding your login credentials, API secret keys,
                  and PathLock™ access codes.
                </li>
                <li>
                  You must promptly notify LShorter of any unauthorized use of your account or security
                  breaches at{" "}
                  <a href="mailto:contact@lshorter.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                    contact@lshorter.com
                  </a>
                  .
                </li>
                <li>
                  Accounts registered by automated &quot;bots&quot; or fraudulent mechanisms are strictly prohibited
                  and subject to immediate termination.
                </li>
              </ul>
            </section>

            {/* Section 3: Acceptable Use */}
            <section id="acceptable-use" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-500" />
                3. Acceptable Use & Anti-Abuse Policy
              </h2>
              <div className="legal-interactive-card p-4 rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 mb-4 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                <strong>Zero Tolerance Policy:</strong> LShorter operates real-time automated heuristics
                and integrates with threat intelligence services. Any link created to deceive users or
                spread malicious software will be instantly blocked without notice.
              </div>
              <p className="mb-3">You agree NOT to use LShorter to create links that direct to:</p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                <li>
                  <strong>Phishing & Credential Harvesting:</strong> Impersonating banks, payment gateways,
                  login screens, or social media sites.
                </li>
                <li>
                  <strong>Malware & Exploits:</strong> Distributing trojans, spyware, ransomware, or
                  unauthorized binary downloads.
                </li>
                <li>
                  <strong>Unsolicited Bulk Messaging (Spam):</strong> Directing traffic originating from
                  unauthorized SMS blasts, email spam, or social network spam bots.
                </li>
                <li>
                  <strong>Illegal or Harmful Materials:</strong> Hate speech, terrorism promotion, child
                  sexual abuse material (CSAM), or copyright infringement.
                </li>
                <li>
                  <strong>Evasion of Security Filters:</strong> Using PathLock™ PIN or URL Cloaking to
                  hide malware payloads from security scanners.
                </li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="edge-sla" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                4. Edge Infrastructure & SLA Commitments
              </h2>
              <p className="mb-4">
                LShorter leverages Cloudflare&apos;s global Anycast Edge network spanning over 310 data centers.
                We commit to maintaining a <strong>99.9% uptime target</strong> for edge redirect resolution
                on paid tiers (Pro, Business, and Enterprise).
              </p>
              <p>
                Scheduled maintenance windows, force majeure events, and upstream DNS registrar failures
                outside our reasonable control are excluded from uptime calculations.
              </p>
            </section>

            {/* Section 5: Billing & Strict No-Refund Policy */}
            <section id="billing" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                5. Billing, Paddle Merchant of Record & Strict No-Refund Policy
              </h2>
              <div className="space-y-4">
                <div className="legal-interactive-card p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#121214] text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-1.5">
                    Merchant of Record (Paddle)
                  </h4>
                  <p>
                    All financial transactions, customer checkouts, invoices, and sales tax/VAT assessments
                    are conducted through our authorized Merchant of Record,{" "}
                    <strong>Paddle.com Market Ltd</strong> (or its local subsidiaries). When purchasing an
                    LShorter subscription or capacity add-on, your order is governed by Paddle&apos;s checkout terms.
                  </p>
                </div>

                <div className="legal-interactive-card p-4 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/20 text-xs sm:text-sm text-neutral-700 dark:text-neutral-300">
                  <h4 className="font-semibold text-neutral-900 dark:text-white mb-1.5 text-amber-700 dark:text-amber-400">
                    Strict No-Refund Policy (All Sales Are Final)
                  </h4>
                  <p className="mb-2">
                    Because LShorter is a digital software-as-a-service (SaaS) platform that provisions
                    immediate compute, edge redirect resources across 310+ Cloudflare PoPs, and programmable
                    routing capacities upon checkout, <strong>all purchases are final and non-refundable</strong>.
                  </p>
                  <p>
                    In accordance with digital product consumer protections (including EU Directive 2011/83/EU
                    Article 16(m)), you acknowledge and agree that your statutory right of withdrawal is waived
                    upon the immediate activation and digital execution of the service.
                  </p>
                </div>

                <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400 text-xs sm:text-sm">
                  <li>
                    <strong>Cancellation of Future Renewals:</strong> You may cancel future automatic
                    renewals at any time directly through your dashboard billing portal. Cancellation prevents
                    future recurring billing, and your account will remain accessible until the conclusion of
                    the current paid period.
                  </li>
                  <li>
                    <strong>No Retroactive Prorations:</strong> No partial or prorated refunds will be issued
                    for unused time, links, or clicks remaining during a billing cycle.
                  </li>
                  <li>
                    <strong>Overage Batches:</strong> Usage-based click batches ($3 per 50k on Pro, $8 per 125k
                    on Business) are consumed dynamically by live edge traffic and are strictly non-refundable.
                  </li>
                </ul>
              </div>
            </section>

            {/* Section 6 */}
            <section id="api-terms" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                6. Developer API & SDK Usage
              </h2>
              <p className="mb-4">
                API rate limits apply based on plan tier (Starter: 60 req/min; Pro: 200 req/min; Business:
                600 req/min; Enterprise: 1,400+ req/min). You agree not to bypass these rate limits through
                distributed attacks, credential rotation, or excessive concurrency.
              </p>
            </section>

            {/* Section 7 */}
            <section id="ip-rights" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                7. Intellectual Property & Domain Ownership
              </h2>
              <p className="mb-4">
                You retain complete ownership of all destination content, custom domain names, brand assets,
                and marketing links routed through LShorter. LShorter owns all proprietary code, edge worker
                algorithms, UI components, trademarks, and documentation.
              </p>
            </section>

            {/* Section 8 */}
            <section id="termination" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                8. Suspension & Account Termination
              </h2>
              <p className="mb-4">
                We reserve the right to temporarily suspend or permanently terminate access to the Service
                immediately without prior notice if you violate our Acceptable Use Policy, engage in fraudulent
                disputes/chargebacks, or if required by court order or competent law enforcement authority.
              </p>
            </section>

            {/* Section 9 */}
            <section id="liability" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                9. Limitation of Liability & Warranty Disclaimer
              </h2>
              <p className="mb-4 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, LSHORTER IS PROVIDED ON AN &quot;AS IS&quot;
                AND &quot;AS AVAILABLE&quot; BASIS. LSHORTER DISCLAIMS ALL WARRANTIES, WHETHER EXPRESS OR
                IMPLIED, INCLUDING MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
                IN NO EVENT SHALL LSHORTER&apos;S TOTAL AGGREGATE LIABILITY EXCEED THE TOTAL AMOUNT PAID BY YOU
                TO LSHORTER IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM.
              </p>
            </section>

            {/* Section 10 */}
            <section id="governing-law" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                10. Governing Law & Dispute Resolution
              </h2>
              <p className="mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the State of
                Delaware, United States, without regard to its conflict of law principles. Any dispute
                arising under these Terms shall be resolved through confidential binding arbitration.
              </p>
            </section>

            {/* Section 11 */}
            <section id="contact" className="scroll-mt-28 pt-4">
              <div className="legal-interactive-card p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-purple-50 to-blue-50 dark:from-[#181126] dark:to-[#0f172a] border border-purple-200/80 dark:border-purple-900/50">
                <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  11. Contact Legal & Compliance
                </h3>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4 text-xs sm:text-sm">
                  Questions regarding these Terms of Service or reports of link abuse should be directed to:
                </p>

                <div className="space-y-1.5 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  <p>
                    <strong>Legal & Abuse Inquiries:</strong>{" "}
                    <a href="mailto:contact@lshorter.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                      contact@lshorter.com
                    </a>
                  </p>
                  <p>
                    <strong>Customer Support:</strong>{" "}
                    <a href="mailto:support@lshorter.com" className="text-purple-600 dark:text-purple-400 hover:underline">
                      support@lshorter.com
                    </a>
                  </p>
                  <p>
                    <strong>Company:</strong> LShorter Inc.
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
