import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "No-Refund Policy",
  description:
    "Digital edge infrastructure provisioning policy, statutory digital waivers (EU Directive 2011/83/EU Art. 16(m)), and 1-click renewal cancellation.",
  alternates: {
    canonical: "/refund",
  },
  openGraph: {
    title: "No-Refund Policy | LShorter",
    description:
      "Clear policies on digital edge infrastructure provisioning and subscription renewals.",
    url: "/refund",
  },
};

export default function RefundLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
