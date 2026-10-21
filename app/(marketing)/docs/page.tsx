import type { Metadata } from "next";
import { DocsHomeContent } from "@/components/marketing/docs-home-content";

export const metadata: Metadata = {
  title: "Documentation & Developer API",
  description:
    "Comprehensive guides and API reference for LShorter: SDK quickstart, edge geo-routing, A/B testing, PathLock™ PIN protection (verrouillage de chemin), webhooks, and revenue attribution.",
  keywords: [
    "raccourccisseur de lien",
    "raccourcisseur de lien",
    "link shorter",
    "link shortener",
    "path lock",
    "pathlock",
    "verrouillage de chemin",
    "verrouillage de lien",
    "documentation api",
    "url shortener api",
    "edge redirect api",
  ],
  alternates: {
    canonical: "/docs",
  },
  openGraph: {
    title: "LShorter Documentation & API Reference",
    description:
      "Build on high-speed edge link infrastructure with our REST API, TypeScript SDK, and webhooks.",
    url: "/docs",
    images: [
      "/api/og?title=Documentation&desc=SDK+Quickstart%2C+API+Reference+%26+Edge+Routing",
    ],
  },
};

export default function DocsPage() {
  return <DocsHomeContent />;
}
