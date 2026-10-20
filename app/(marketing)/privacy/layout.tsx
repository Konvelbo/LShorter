import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Zero-visitor cookies, edge IP anonymization, GDPR & CCPA compliance, and cryptographic PathLock™ security standards.",
  alternates: {
    canonical: "/privacy",
  },
  openGraph: {
    title: "Privacy Policy | LShorter",
    description:
      "Zero tracking cookies, GDPR compliance, and edge IP anonymization.",
    url: "/privacy",
  },
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
