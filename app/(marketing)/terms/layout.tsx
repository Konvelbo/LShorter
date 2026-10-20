import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "LShorter terms of service, acceptable use policies, 99.9% edge SLA commitments, anti-phishing enforcement, and API rate limits.",
  alternates: {
    canonical: "/terms",
  },
  openGraph: {
    title: "Terms of Service | LShorter",
    description:
      "Acceptable use policy, anti-phishing rules, and edge SLA commitments.",
    url: "/terms",
  },
};

export default function TermsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
