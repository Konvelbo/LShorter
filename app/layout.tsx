import type { Metadata } from "next";
import Script from "next/script";
import { Inter, Bebas_Neue, Poppins } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";
import { UndoDeleteProvider } from "@/components/ui/undo-delete-provider";
import { PlanUpgradeModal } from "@/components/dashboard/plan-upgrade-modal";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { RouteProgressBar } from "@/components/layout/route-progress-bar";
import { RootStructuredData } from "@/components/seo/json-ld";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  fallback: ["Impact", "Arial Narrow", "sans-serif"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  weight: ["300", "400", "500", "600", "700", "800"],
  subsets: ["latin"],
  display: "swap",
  fallback: ["system-ui", "-apple-system", "sans-serif"],
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lsho.cc";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LShorter — Enterprise Edge URL Shortener, Smart Routing & QR Code Studio",
    template: "%s | LShorter",
  },
  description:
    "Next-gen edge URL shortener and link infrastructure. Sub-15ms global redirects, dynamic geo & device routing, PathLock™ protection, real-time analytics, and revenue attribution.",
  applicationName: "LShorter",
  authors: [{ name: "LShorter", url: siteUrl }],
  creator: "LShorter",
  publisher: "LShorter",
  keywords: [
    "URL shortener",
    "enterprise link management",
    "edge redirect engine",
    "smart URL routing",
    "dynamic QR codes",
    "geo-targeting redirect",
    "A/B link testing",
    "custom branded domain shortener",
    "PathLock PIN link protection",
    "real-time click analytics",
    "revenue attribution link tracker",
    "Cloudflare edge URL shortener",
  ],
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "./",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "LShorter",
    title: "LShorter — Enterprise Edge URL Shortener, Smart Routing & QR Code Studio",
    description:
      "Enterprise link management, dynamic geo-routing, real-time telemetry, and QR codes at the edge (<15ms latency).",
    images: [
      {
        url: "/api/og?title=LShorter&desc=Enterprise+Edge+URL+Shortener+%26+Smart+Routing",
        width: 1200,
        height: 630,
        alt: "LShorter Enterprise Edge Link Infrastructure",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "LShorter — Enterprise Edge URL Shortener & Smart Routing",
    description:
      "Sub-15ms edge redirects, dynamic geo & device routing, PathLock™ protection, and real-time revenue analytics.",
    images: ["/api/og?title=LShorter&desc=Enterprise+Edge+URL+Shortener+%26+Smart+Routing"],
    creator: "@lshorter",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const gaId = process.env.NEXT_PUBLIC_GA_ID || "G-3WMV9FJFFV";

  return (
    <html
      lang="en"
      className={`${inter.variable} ${bebasNeue.variable} ${poppins.variable} light antialiased overflow-x-clip max-w-[100vw]`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Anton&family=Audiowide&family=Bebas+Neue&family=Caveat:wght@600;700&family=Chakra+Petch:wght@600;700&family=Cinzel:wght@600;700;900&family=Cormorant+Garamond:wght@600;700&family=Dancing+Script:wght@600;700&family=Fira+Code:wght@500;700&family=Great+Vibes&family=Inter:wght@400;600;700;900&family=JetBrains+Mono:wght@500;700&family=Lato:wght@400;700;900&family=Lora:ital,wght@0,600;0,700;1,600&family=Merriweather:wght@400;700;900&family=Montserrat:wght@500;700;900&family=Open+Sans:wght@400;600;700;800&family=Orbitron:wght@600;800;900&family=Oswald:wght@500;700&family=Outfit:wght@500;700;900&family=Pacifico&family=Playfair+Display:ital,wght@0,600;0,800;1,600&family=Plus+Jakarta+Sans:wght@500;700;800&family=Poppins:wght@500;700;800&family=Raleway:wght@600;700;900&family=Righteous&family=Roboto:wght@500;700;900&family=Russo+One&family=Space+Mono:wght@400;700&family=Syne:wght@600;700;800&display=swap"
        />
        <RootStructuredData />
      </head>
      <body
        className="min-h-screen flex flex-col ds-bg-app ds-text-primary font-sans overflow-x-clip max-w-[100vw]"
        suppressHydrationWarning
      >
        <RouteProgressBar />
        <Script
          id="dom-patch"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `if(typeof Node==='function'&&Node.prototype){var p=Node.prototype;if(!p.__lshorterPatched){p.__lshorterPatched=true;var r=p.removeChild;p.removeChild=function(c){if(c&&c.parentNode!==this){return c;}return r.apply(this,arguments);};var i=p.insertBefore;p.insertBefore=function(n,ref){if(ref&&ref.parentNode!==this){return this.appendChild(n);}return i.apply(this,arguments);};}}`,
          }}
        />
        {/* Google tag (gtag.js) */}
        {gaId && (
          <>
            <Script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
              strategy="afterInteractive"
            />
            <Script
              id="google-tag-manager"
              strategy="afterInteractive"
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${gaId}');
                `,
              }}
            />
          </>
        )}
        <ThemeProvider>
          <ConvexClientProvider>
            <ToastProvider>
              <UndoDeleteProvider>
                {children}
                <PlanUpgradeModal />
              </UndoDeleteProvider>
            </ToastProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
