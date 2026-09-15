import type { Metadata } from "next";
import { Inter, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast-provider";
import { PlanUpgradeModal } from "@/components/dashboard/plan-upgrade-modal";
import { ConvexClientProvider } from "@/components/providers/convex-client-provider";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const bebasNeue = Bebas_Neue({
  variable: "--font-bebas",
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "LShorter — Edge URL Shortener, Smart Routing & QR Code Studio",
  description:
    "Next-gen Edge SaaS for high-performance link management, conversion tracking, 3D real-time analytics, and custom QR Codes.",
  icons: {
    icon: "/lshorter_favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${bebasNeue.variable} dark antialiased`}
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
      </head>
      <body className="min-h-screen flex flex-col bg-[#09090b] text-[#fafafa] font-sans">
        {/* Theme init script — must be first child of body, before any React hydration */}
        <script
          suppressHydrationWarning
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('lshorter_theme');if(t==='light'){document.documentElement.classList.remove('dark');document.documentElement.classList.add('light');}else{document.documentElement.classList.remove('light');document.documentElement.classList.add('dark');}}catch(e){}`,
          }}
        />
        <ConvexClientProvider>
          <ToastProvider>
            {children}
            <PlanUpgradeModal />
          </ToastProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
