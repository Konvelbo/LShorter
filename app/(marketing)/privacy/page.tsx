import React from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Lock,
  EyeOff,
  Server,
  FileCheck,
  Globe2,
  UserCheck,
  RefreshCcw,
  Mail,
  ArrowLeft,
  ChevronRight,
  Database,
  ExternalLink,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | LShorter - Zero-Visitor-Cookie Link Infrastructure",
  description:
    "Learn how LShorter safeguards your data, ensures GDPR & CCPA compliance, and enforces zero-visitor-cookie edge redirection across 310+ Cloudflare PoPs.",
};

export default function PrivacyPolicyPage() {
  const lastUpdated = "October 8, 2026";

  const trustHighlights = [
    {
      icon: EyeOff,
      title: "Zero-Visitor Cookies",
      description:
        "We never plant tracking cookies, local beacons, or advertising fingerprints on visitors who click your shortened links.",
    },
    {
      icon: Server,
      title: "Edge IP Anonymization",
      description:
        "Visitor IP addresses are anonymized and hashed at the Cloudflare Edge PoP level before telemetry is recorded.",
    },
    {
      icon: ShieldCheck,
      title: "GDPR & CCPA Compliant",
      description:
        "Strict compliance with European GDPR (RGPD) and California CCPA regulations. Full right to export or delete your account data.",
    },
    {
      icon: Lock,
      title: "PathLock™ Cryptographic PINs",
      description:
        "PIN protection uses one-way cryptographic hashes. Your passwords and PIN codes are never stored in plaintext.",
    },
  ];

  const tableOfContents = [
    { id: "introduction", title: "1. Introduction & Company Overview" },
    { id: "data-collection", title: "2. Information We Collect" },
    { id: "visitor-privacy", title: "3. Link Visitor Privacy & Edge Routing" },
    { id: "legal-basis", title: "4. Legal Basis for Processing (GDPR)" },
    { id: "data-retention", title: "5. Data Retention Schedules" },
    { id: "subprocessors", title: "6. Third-Party Sub-Processors" },
    { id: "user-rights", title: "7. Your Rights (GDPR, CCPA & Global)" },
    { id: "security", title: "8. Technical & Organizational Security" },
    { id: "children", title: "9. Children's Privacy" },
    { id: "policy-changes", title: "10. Changes to This Policy" },
    { id: "contact", title: "11. Data Protection Officer (DPO) Contact" },
  ];

  return (
    <div className="w-full min-h-screen pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 select-text">
      {/* Background ambient lighting */}
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
            Privacy Policy
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center sm:text-left border-b border-neutral-200 dark:border-neutral-800 pb-10 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Legal & Data Protection</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Privacy Policy
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
            At LShorter, transparency and data minimization are core principles of our
            distributed edge architecture. This Privacy Policy details how we collect,
            use, disclose, and safeguard your data when using our platform and redirect engine.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <RefreshCcw className="w-3.5 h-3.5 text-emerald-500" />
              Effective Date: {lastUpdated}
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
            <span className="inline-flex items-center gap-1.5">
              <Globe2 className="w-3.5 h-3.5 text-blue-500" />
              Global Application (GDPR, RGPD, CCPA, CPRA)
            </span>
          </div>
        </div>

        {/* Key Privacy Guarantees Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {trustHighlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-[#222225] shadow-sm hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
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
          {/* Desktop Sticky Table of Contents */}
          <aside className="hidden lg:block lg:col-span-4">
            <div className="sticky top-28 p-6 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-[#222225]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-4">
                Table of Contents
              </h2>
              <nav className="space-y-2">
                {tableOfContents.map((section) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="block text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors py-1 leading-snug"
                  >
                    {section.title}
                  </a>
                ))}
              </nav>

              <div className="mt-8 pt-6 border-t border-neutral-200 dark:border-neutral-800 text-xs text-neutral-500 dark:text-neutral-400 space-y-3">
                <p className="font-semibold text-neutral-800 dark:text-neutral-200">
                  Need a DPA or custom compliance?
                </p>
                <p>Enterprise accounts may request our standard Data Processing Addendum (DPA).</p>
                <a
                  href="mailto:privacy@lshorter.com"
                  className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-medium"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Contact DPO
                </a>
              </div>
            </div>
          </aside>

          {/* Legal Text Body */}
          <main className="lg:col-span-8 space-y-12 text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {/* Section 1 */}
            <section id="introduction" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4 flex items-center gap-2">
                <span>1. Introduction & Company Overview</span>
              </h2>
              <p className="mb-4">
                LShorter (&quot;LShorter&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) provides high-performance
                URL shortening, programmable edge routing, A/B testing, dynamic QR codes, and
                analytics infrastructure designed for modern digital teams and developers.
              </p>
              <p>
                This Privacy Policy applies to personal data collected via our website (
                <strong>lshorter.com</strong>), dashboard applications, APIs, SDKs, and link
                redirection services. By accessing or using LShorter, you acknowledge that you
                have read and understood this Privacy Policy.
              </p>
            </section>

            {/* Section 2 */}
            <section id="data-collection" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                2. Information We Collect
              </h2>
              <p className="mb-4">
                We clearly differentiate between data collected from <strong>Registered Account Users</strong>{" "}
                and telemetry collected from <strong>End-User Link Visitors</strong>:
              </p>

              <div className="space-y-4 my-6">
                <div className="p-5 rounded-xl bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800">
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                    <UserCheck className="w-4 h-4 text-blue-500" />
                    A. Registered Account Holders
                  </h3>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    <li>
                      <strong>Account Identification:</strong> Full name, email address, password hash
                      (encrypted with modern bcrypt algorithms), or third-party OAuth profile IDs
                      (Google, GitHub).
                    </li>
                    <li>
                      <strong>Billing & Payment Information:</strong> Payment card transactions are
                      processed directly through our PCI-DSS Level 1 compliant payment provider
                      (Stripe). LShorter never stores or sees raw credit card numbers or CVV codes.
                    </li>
                    <li>
                      <strong>Customer Support Communications:</strong> Inquiries, bug reports, and
                      communications submitted via email or our support channels.
                    </li>
                    <li>
                      <strong>Configuration & Assets:</strong> Custom domains, destination URLs,
                      geographic routing rules, UTM parameters, and webhook endpoints.
                    </li>
                  </ul>
                </div>

                <div className="p-5 rounded-xl bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800">
                  <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                    <EyeOff className="w-4 h-4 text-blue-500" />
                    B. Link Visitors (Anonymous Edge Redirection)
                  </h3>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-2">
                    When someone clicks a shortened link hosted on LShorter or a verified custom domain,
                    our edge infrastructure processes the incoming HTTP request. To preserve privacy:
                  </p>
                  <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    <li>
                      <strong>No Personal Profiling:</strong> We do NOT create persistent behavioral
                      profiles, track across distinct domains, or sell browsing histories.
                    </li>
                    <li>
                      <strong>Coarse Telemetry Only:</strong> Country, region, city, device category
                      (Mobile/Desktop/Tablet), OS, browser engine, and HTTP referrer header.
                    </li>
                    <li>
                      <strong>Zero Third-Party Advertising Trackers:</strong> No marketing pixels or ad
                      beacons are introduced into the redirect sequence by LShorter.
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="visitor-privacy" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                3. Link Visitor Privacy & Edge Routing
              </h2>
              <p className="mb-4">
                Our redirect engine operates across Cloudflare&apos;s 310+ global edge locations.
                We implement strict data minimization principles:
              </p>
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    IP Address Anonymization at the Edge
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    Raw visitor IP addresses are evaluated solely in temporary RAM at the edge node to
                    resolve country/city geo-coordinates and detect malicious DDoS traffic. The raw IP is
                    immediately discarded or transformed into a salted, one-way hash before any click
                    telemetry is permanently saved.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    PathLock™ Zero-Knowledge Protection
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    When a user configures a PIN code on a shortened link, the PIN is verified using
                    cryptographic hashing. Neither LShorter operators nor database backups hold your PIN in
                    plaintext.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    Zero-Referrer URL Cloaking
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    When Zero-Referrer masking is enabled, LShorter terminates the HTTP Referrer chain
                    via HTTP headers and secure client meta-redirection, preventing downstream origin
                    leakage to destination servers.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="legal-basis" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                4. Legal Basis for Processing under GDPR
              </h2>
              <p className="mb-4">
                For individuals located in the European Economic Area (EEA), the United Kingdom, or
                Switzerland, we process personal data under the following lawful bases pursuant to
                Article 6 of the General Data Protection Regulation (GDPR):
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <strong>Performance of Contract (Art. 6(1)(b)):</strong> To provide our services,
                  authenticate accounts, execute redirects, process payments, and fulfill our Terms of
                  Service.
                </li>
                <li>
                  <strong>Legitimate Interests (Art. 6(1)(f)):</strong> To secure our edge infrastructure
                  against phishing, abuse, fraud, and bot attacks, as well as to optimize platform
                  performance and uptime.
                </li>
                <li>
                  <strong>Compliance with Legal Obligations (Art. 6(1)(c)):</strong> To maintain tax,
                  accounting, and corporate audit records as mandated by applicable laws.
                </li>
                <li>
                  <strong>Consent (Art. 6(1)(a)):</strong> Where explicitly obtained, such as for
                  optional marketing updates (which you can withdraw at any time).
                </li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="data-retention" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                5. Data Retention Schedules
              </h2>
              <p className="mb-4">
                We store data only for as long as necessary to fulfill the operational purposes described
                in this policy:
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                  <thead className="bg-neutral-100 dark:bg-neutral-800/60 text-neutral-900 dark:text-white">
                    <tr>
                      <th className="p-3 font-semibold">Data Category</th>
                      <th className="p-3 font-semibold">Tier / Context</th>
                      <th className="p-3 font-semibold">Retention Window</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800 text-neutral-600 dark:text-neutral-400">
                    <tr>
                      <td className="p-3 font-medium text-neutral-900 dark:text-white">
                        Click Analytics & Telemetry
                      </td>
                      <td className="p-3">Starter (Free) Plan</td>
                      <td className="p-3">30 Days (Rolling)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-neutral-900 dark:text-white">
                        Click Analytics & Telemetry
                      </td>
                      <td className="p-3">Pro Plan</td>
                      <td className="p-3">365 Days (1 Year)</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-neutral-900 dark:text-white">
                        Click Analytics & Telemetry
                      </td>
                      <td className="p-3">Business & Enterprise Plans</td>
                      <td className="p-3">Full Account Lifetime</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-neutral-900 dark:text-white">
                        Account Profile & Auth Data
                      </td>
                      <td className="p-3">All Active Accounts</td>
                      <td className="p-3">Retained until account deletion</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-medium text-neutral-900 dark:text-white">
                        Billing & Tax Invoices
                      </td>
                      <td className="p-3">Paid Subscriptions</td>
                      <td className="p-3">7 Years (Mandatory statutory audit period)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 6 */}
            <section id="subprocessors" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                6. Third-Party Sub-Processors
              </h2>
              <p className="mb-4">
                To guarantee high availability, global low-latency resolution, and secure billing, we
                rely on industry-leading infrastructure partners who meet stringent data protection
                agreements:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    Cloudflare Inc.
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    Global Edge Workers, Anycast DNS, DDoS mitigation, and KV storage.
                  </p>
                  <span className="text-[11px] font-mono text-neutral-400">USA & Global PoPs (SOC 2, ISO 27001)</span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    Convex Inc.
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    Realtime serverless transactional database and cloud application backend.
                  </p>
                  <span className="text-[11px] font-mono text-neutral-400">USA (SOC 2 Type II Certified)</span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    Stripe Inc.
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    Payment processing, subscription billing, and tax calculation.
                  </p>
                  <span className="text-[11px] font-mono text-neutral-400">Global (PCI-DSS Level 1)</span>
                </div>

                <div className="p-4 rounded-xl bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    Resend Inc.
                  </h4>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-2">
                    Transactional email delivery, login magic links, and team invites.
                  </p>
                  <span className="text-[11px] font-mono text-neutral-400">USA (GDPR Compliant DPA)</span>
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="user-rights" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                7. Your Rights (GDPR, CCPA & Global)
              </h2>
              <p className="mb-4">
                Under European (GDPR), UK, and Californian (CCPA/CPRA) privacy legislations, you enjoy
                substantial rights over your personal data:
              </p>
              <div className="space-y-3">
                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    • Right of Access & Data Portability (GDPR Art. 15, 20)
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    You may request a copy of all personal information we hold about you in a structured,
                    machine-readable JSON/CSV format directly from your{" "}
                    <Link href="/dashboard/settings" className="text-blue-600 dark:text-blue-400 hover:underline">
                      Dashboard Settings
                    </Link>
                    .
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    • Right to Rectification & Deletion (GDPR Art. 16, 17)
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    You have the right to correct inaccurate records or permanently delete (&quot;Right to be
                    Forgotten&quot;) your account and associated links. Deleting your account irreversibly
                    removes all shortened links and historical telemetry.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                    • CCPA Notice: We Do NOT Sell or Share Personal Information
                  </h4>
                  <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                    LShorter has not sold, does not sell, and will never sell personal information to third
                    parties or data brokers. We do not engage in cross-context behavioral advertising.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="security" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                8. Technical & Organizational Security
              </h2>
              <p className="mb-4">
                We implement comprehensive enterprise-grade security controls:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-neutral-600 dark:text-neutral-400">
                <li>
                  <strong>Transport Layer Security:</strong> All web traffic and edge redirection calls
                  are encrypted using Modern TLS 1.3 with automatic HSTS enforcement.
                </li>
                <li>
                  <strong>Database Encryption:</strong> All data stored at rest is encrypted with
                  AES-256 standard encryption keys.
                </li>
                <li>
                  <strong>Anti-Phishing Automated Scanners:</strong> Destination URLs are systematically
                  screened against global real-time malware and malicious intelligence databases to
                  protect internet users.
                </li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="children" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                9. Children&apos;s Privacy
              </h2>
              <p>
                LShorter is not designed for or marketed to individuals under the age of 16. We do not
                knowingly collect personal information from children. If you become aware that a minor has
                provided us with personal data, please contact our privacy desk immediately.
              </p>
            </section>

            {/* Section 10 */}
            <section id="policy-changes" className="scroll-mt-28">
              <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                10. Changes to This Policy
              </h2>
              <p>
                We may revise this Privacy Policy periodically to reflect technological changes, new legal
                requirements, or enhancements to our platform. Material modifications will be signaled by
                updating the &quot;Effective Date&quot; at the top of this document and providing prominent notice
                within your dashboard or via email.
              </p>
            </section>

            {/* Section 11 */}
            <section id="contact" className="scroll-mt-28 pt-4">
              <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-[#111827] dark:to-[#0f172a] border border-blue-200/80 dark:border-blue-900/50">
                <h2 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  11. Contact Our Data Protection Officer (DPO)
                </h2>
                <p className="text-neutral-600 dark:text-neutral-300 mb-4 text-xs sm:text-sm">
                  If you have inquiries regarding this Privacy Policy, wish to exercise your GDPR/CCPA
                  statutory rights, or require an enterprise Data Processing Agreement, reach out to our team:
                </p>

                <div className="space-y-2 text-xs sm:text-sm font-medium text-neutral-800 dark:text-neutral-200">
                  <p>
                    <strong>Email:</strong>{" "}
                    <a href="mailto:privacy@lshorter.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                      privacy@lshorter.com
                    </a>
                  </p>
                  <p>
                    <strong>DPO Desk:</strong>{" "}
                    <a href="mailto:dpo@lshorter.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                      dpo@lshorter.com
                    </a>
                  </p>
                  <p>
                    <strong>Organization:</strong> LShorter Inc. (Data Protection & Legal Compliance Desk)
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
