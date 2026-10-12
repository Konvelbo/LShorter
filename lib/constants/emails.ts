/**
 * Platform Official Email Addresses (Configured via Environment Variables)
 * ─────────────────────────────────────────────────────────────────────────────
 * All platform-wide email addresses are configured via .env (NEXT_PUBLIC_*)
 * with safe fallbacks to the official domain lsho.cc.
 */

export const SITE_EMAILS = {
  support: process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "support@lsho.cc",
  contact: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "contact@lsho.cc",
  security: process.env.NEXT_PUBLIC_SECURITY_EMAIL || "security@lsho.cc",
  billing: process.env.NEXT_PUBLIC_BILLING_EMAIL || "billing@lsho.cc",
} as const;

export type SiteEmailKey = keyof typeof SITE_EMAILS;
