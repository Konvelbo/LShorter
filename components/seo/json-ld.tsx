import React from "react";

export function RootStructuredData() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lsho.cc";

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "LShorter",
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description:
      "Enterprise URL shortener, edge routing infrastructure, and dynamic QR Code platform.",
    sameAs: [
      "https://twitter.com/lshorter",
      "https://github.com/Konvelbo/LShorter",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      email: "contact@lsho.cc",
      availableLanguage: ["English", "French"],
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "LShorter",
    url: baseUrl,
    keywords:
      "raccourccisseur de lien, raccourcisseur de lien, link shorter, link shortener, path lock, pathlock, verrouillage de chemin, verrouillage de lien, lien protégé par mot de passe, password protected link, secure URL shortener, edge routing, dynamic QR code",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/docs?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  const softwareAppSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LShorter Edge Link Management",
    operatingSystem: "Cloud, All Modern Web Browsers",
    applicationCategory: "BusinessApplication",
    description:
      "Enterprise link management, Cloudflare edge redirection under 15ms, dynamic geo-targeting, A/B split testing, PathLock™ (verrouillage de chemin) protection, and real-time revenue attribution.",
    keywords:
      "raccourccisseur de lien, raccourcisseur de lien, link shorter, link shortener, path lock, pathlock, verrouillage de chemin, lien protégé par mot de passe, password protected link, enterprise link management",
    offers: [
      {
        "@type": "Offer",
        name: "Free Starter",
        price: "0",
        priceCurrency: "USD",
      },
      {
        "@type": "Offer",
        name: "Pro",
        price: "9",
        priceCurrency: "USD",
        billingDuration: "P1M",
      },
      {
        "@type": "Offer",
        name: "Business",
        price: "29",
        priceCurrency: "USD",
        billingDuration: "P1M",
      },
      {
        "@type": "Offer",
        name: "Enterprise",
        price: "99",
        priceCurrency: "USD",
        billingDuration: "P1M",
      },
    ],
    featureList: [
      "Sub-15ms Edge Redirection (Raccourcisseur de lien ultra-rapide)",
      "Dynamic Geo & Device Smart Routing",
      "PathLock™ PIN Link Gate (Verrouillage de chemin & protection par mot de passe)",
      "Real-time Telemetry & City-level Analytics",
      "Revenue Attribution & EPC Tracking",
      "Dynamic QR Code Studio",
      "Custom Branded Domains with Auto SSL",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareAppSchema) }}
      />
    </>
  );
}

export function FaqStructuredData() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How does LShorter's geographic routing and telemetry work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "LShorter evaluates ISO 3166-1 alpha-2 country routing rules (geoTargeting), device/OS rules (ios, android, desktop), and weighted A/B variations directly at redirect time. Simultaneously, our asynchronous telemetry engine logs the visitor's Continent, Country, City, Device, Browser, and Referrer with zero redirect delay.",
        },
      },
      {
        "@type": "Question",
        name: "Can we connect our own custom branded domains and verify DNS?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Add your custom domain (e.g., go.yourbrand.com) in the Custom Domains dashboard, configure the CNAME / TXT record, and click Verify DNS. Once verified, any short link can be published on your branded domain with automatic TLS.",
        },
      },
      {
        "@type": "Question",
        name: "How does revenue attribution connect short link clicks to customer purchases?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "When a visitor clicks an LShorter link, a first-party click identifier (qk_cid) is generated. Your checkout or backend calls POST /api/v1/conversions (or lshorter.track.conversion) with the clickId, amount, customerEmail, and customerAvatar—attributing exact revenue and EPC back to the originating slug.",
        },
      },
      {
        "@type": "Question",
        name: "How do PathLock™ PIN protection, click limits, and URL cloaking work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Every link supports an optional PIN/password challenge (/p/:slug), an expiration timestamp (expiresAt) or maximum click cap (maxClicks), and zero-referrer iframe URL masking (cloaking) with custom page title and favicon.",
        },
      },
      {
        "@type": "Question",
        name: "Can we export all click telemetry, geographic data, and revenue logs?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes. Every dashboard view—Analytics Overview, Geo Analytics, Customers & Revenue, Live Click Stream, and Short Links—includes one-click CSV Export alongside full JSON access via /api/v1/analytics/overview and /api/v1/analytics/geo.",
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}

export function DocArticleStructuredData({
  title,
  subtitle,
  slug,
  image,
}: {
  title: string;
  subtitle: string;
  slug: string;
  image?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lsho.cc";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Documentation",
        item: `${baseUrl}/docs`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${baseUrl}/docs/${slug}`,
      },
    ],
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: title,
    description: subtitle,
    url: `${baseUrl}/docs/${slug}`,
    image: image ? (image.startsWith("http") ? image : `${baseUrl}${image}`) : `${baseUrl}/api/og?title=${encodeURIComponent(title)}`,
    datePublished: "2026-08-01T00:00:00Z",
    dateModified: "2026-10-15T00:00:00Z",
    author: {
      "@type": "Organization",
      name: "LShorter",
      url: baseUrl,
    },
    publisher: {
      "@type": "Organization",
      name: "LShorter",
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/logo.png`,
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
    </>
  );
}
