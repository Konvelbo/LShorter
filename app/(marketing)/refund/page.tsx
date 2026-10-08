import React from "react";
import Link from "next/link";
import {
  CreditCard,
  RefreshCw,
  CheckCircle2,
  Clock,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  ChevronRight,
  Mail,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund Policy | LShorter - 14-Day Money-Back Guarantee",
  description:
    "Review LShorter's transparent refund policy. Enjoy a 14-day money-back guarantee on all subscription plans, hassle-free cancellation, and fast Stripe processing.",
};

export default function RefundPolicyPage() {
  const lastUpdated = "October 8, 2026";

  const guaranteeHighlights = [
    {
      icon: ShieldCheck,
      title: "14-Day Money-Back Guarantee",
      description:
        "Full 100% refund on any initial Pro or Business subscription within 14 days of purchase. No complex questions asked.",
    },
    {
      icon: Zap,
      title: "Instant 1-Click Cancellation",
      description:
        "Cancel anytime directly from your dashboard billing settings without calling support or undergoing retention hurdles.",
    },
    {
      icon: CreditCard,
      title: "Direct Stripe Reversal",
      description:
        "Refunds are credited directly to your original card or payment method via Stripe within 3 to 5 business days.",
    },
    {
      icon: RefreshCw,
      title: "Transparent Renewals",
      description:
        "Pre-renewal reminders for annual plans and clear invoices automatically delivered to your registered email address.",
    },
  ];

  const refundSteps = [
    {
      step: "01",
      title: "Initiate Request",
      desc: "Go to your Dashboard Settings > Billing tab, or simply send an email to billing@lshorter.com with your account email address.",
    },
    {
      step: "02",
      title: "Verification & Review",
      desc: "Our billing team checks your invoice against the 14-day policy window within 24 to 48 hours.",
    },
    {
      step: "03",
      title: "Stripe Reimbursement",
      desc: "The refund is issued via Stripe. The funds appear on your bank statement within 3 to 5 business days.",
    },
  ];

  return (
    <div className="w-full min-h-screen pt-28 sm:pt-32 pb-24 px-4 sm:px-6 lg:px-8 select-text">
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
            Refund Policy
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center sm:text-left border-b border-neutral-200 dark:border-neutral-800 pb-10 mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 mb-4">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Fair Billing & Satisfaction</span>
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white">
            Refund & Cancellation Policy
          </h1>

          <p className="mt-4 text-base sm:text-lg text-neutral-600 dark:text-neutral-300 max-w-3xl leading-relaxed">
            We want you to be completely satisfied with LShorter&apos;s enterprise link infrastructure.
            If our platform does not suit your workflow, we offer a straightforward, no-friction
            refund process designed to treat every customer fairly.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
            <span className="inline-flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              Effective Date: {lastUpdated}
            </span>
            <span className="hidden sm:inline text-neutral-300 dark:text-neutral-700">•</span>
            <span className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              14-Day Full Satisfaction Guarantee
            </span>
          </div>
        </div>

        {/* Key Guarantees Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-16">
          {guaranteeHighlights.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-5 rounded-2xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-[#222225] shadow-sm hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all"
              >
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
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

        {/* Main Body */}
        <div className="space-y-12 max-w-4xl text-sm sm:text-base text-neutral-700 dark:text-neutral-300 leading-relaxed">
          {/* Section 1 */}
          <section className="scroll-mt-28">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              1. 14-Day Money-Back Guarantee
            </h2>
            <p className="mb-4">
              All first-time subscribers to LShorter paid subscription tiers—including the{" "}
              <strong>Pro Plan</strong> ($15/mo or $90/year) and the <strong>Business Plan</strong>{" "}
              ($49/mo or $350/year)—are covered by our unconditional <strong>14-day money-back guarantee</strong>.
            </p>
            <p>
              If within fourteen (14) days from the initial transaction timestamp you decide that
              LShorter does not meet your technical or marketing requirements, you may request a 100%
              refund of the initial subscription fee.
            </p>
          </section>

          {/* Section 2 */}
          <section className="scroll-mt-28">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              2. Subscription Terms & Cancellation Rules
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 my-6">
              {/* Monthly Subscriptions */}
              <div className="p-5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  Monthly Subscriptions
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed">
                  Monthly plans are billed in advance on a recurring monthly cycle.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  <li>
                    <strong>Within 14 days of initial signup:</strong> Full 100% refund upon request.
                  </li>
                  <li>
                    <strong>Subsequent months:</strong> You can cancel at any time. When cancelled,
                    your service remains active until the end of the current paid billing period with
                    no further charges.
                  </li>
                </ul>
              </div>

              {/* Annual Subscriptions */}
              <div className="p-5 rounded-xl bg-white dark:bg-[#121214] border border-neutral-200 dark:border-neutral-800">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-500" />
                  Annual Subscriptions
                </h3>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mb-3 leading-relaxed">
                  Annual plans are discounted (up to 50% savings) and billed upfront for 12 months.
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-400">
                  <li>
                    <strong>Within 14 days:</strong> Full 100% refund upon request.
                  </li>
                  <li>
                    <strong>After 14 days:</strong> Cancellation stops auto-renewal for subsequent
                    years. Prorated credits may be issued under special circumstances (e.g., documented
                    platform downtime exceeding SLA commitments).
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="scroll-mt-28">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              3. Usage Overages & Non-Refundable Items
            </h2>
            <p className="mb-4">
              Certain consumption-based features and third-party infrastructure components are
              non-refundable once delivered:
            </p>
            <div className="space-y-3">
              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                  • Click Overage Batches
                </h4>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  Additional click capacity batches ($3 per 50,000 clicks on Pro; $8 per 125,000 clicks
                  on Business) are provisioned live onto Cloudflare Edge KV caches. Once traffic has
                  consumed these edge allocations, overage fees are non-refundable.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                  • Custom Domain Third-Party Registrar Fees
                </h4>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  If you purchase a custom top-level domain through an external DNS registrar, those fees
                  are governed by the respective domain registrar and cannot be reimbursed by LShorter.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <h4 className="font-semibold text-neutral-900 dark:text-white text-sm mb-1">
                  • Custom Enterprise Service Contracts
                </h4>
                <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
                  Enterprise agreements ($199/mo or $1,670/yr) with custom SLAs, dedicated IP provisioning,
                  or bespoke engineering contracts are governed by their negotiated Master Services Agreement (MSA).
                </p>
              </div>
            </div>
          </section>

          {/* Section 4: How to Request a Refund */}
          <section className="scroll-mt-28">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-6">
              4. How to Request a Refund (Step-by-Step)
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {refundSteps.map((s) => (
                <div
                  key={s.step}
                  className="p-5 rounded-xl bg-neutral-50 dark:bg-[#151518] border border-neutral-200 dark:border-neutral-800 flex flex-col justify-between"
                >
                  <div>
                    <span className="text-2xl font-mono font-bold text-blue-600 dark:text-blue-400">
                      {s.step}
                    </span>
                    <h3 className="font-semibold text-neutral-900 dark:text-white text-sm mt-2 mb-2">
                      {s.title}
                    </h3>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Section 5 */}
          <section className="scroll-mt-28">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              5. Processing Timeline & Banking Delays
            </h2>
            <p className="mb-4">
              Once approved by our billing desk, your refund is processed immediately through{" "}
              <strong>Stripe</strong>. Depending on your bank or credit card issuer, it typically takes{" "}
              <strong>3 to 5 business days</strong> for the credit to appear on your account statement.
            </p>
            <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/50 dark:bg-blue-950/20 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400">
              <strong className="text-neutral-900 dark:text-white">Note:</strong> If your original payment method
              has expired or been cancelled, notify us prior to the refund execution so we can route the
              credit appropriately with Stripe support.
            </div>
          </section>

          {/* Section 6 */}
          <section className="scroll-mt-28">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white mb-4">
              6. Friendly Resolution & Chargebacks
            </h2>
            <p className="mb-4">
              We pride ourselves on responsive, direct customer support. Before initiating an unexpected
              dispute or chargeback with your credit card provider or PayPal, please reach out to our team at{" "}
              <a href="mailto:billing@lshorter.com" className="text-blue-600 dark:text-blue-400 hover:underline">
                billing@lshorter.com
              </a>
              .
            </p>
            <p>
              Card issuer disputes can lock your account and freeze all active shortened link redirects
              during the bank&apos;s 60-day investigation window. Contacting us directly allows us to resolve any
              discrepancy in minutes.
            </p>
          </section>

          {/* Contact Support Box */}
          <section className="pt-4">
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-[#062016] dark:to-[#041c14] border border-emerald-200/80 dark:border-emerald-900/50">
              <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center gap-2">
                <Mail className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Have questions about your bill?
              </h3>
              <p className="text-neutral-600 dark:text-neutral-300 mb-4 text-xs sm:text-sm leading-relaxed">
                Our support and billing team is available 7 days a week to review invoices, help with plan
                adjustments, and issue eligible reimbursements.
              </p>

              <div className="flex flex-wrap items-center gap-3">
                <a
                  href="mailto:billing@lshorter.com"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs sm:text-sm transition-colors shadow-xs"
                >
                  <Mail className="w-4 h-4" />
                  Contact billing@lshorter.com
                </a>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-neutral-900 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-900 dark:text-white font-medium text-xs sm:text-sm border border-neutral-200 dark:border-neutral-700 transition-colors"
                >
                  View Plans & Pricing
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
