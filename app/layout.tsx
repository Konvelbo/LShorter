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
  title: "LShorter — Raccourcisseur de liens, Tracking & QR Codes",
  description: "Plateforme Edge SaaS pour la gestion de liens courts, tracking des conversions, analytics 3D et QR Codes personnalisés.",
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
      lang="fr"
      className={`${inter.variable} ${bebasNeue.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#09090b] text-[#fafafa] font-sans">
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
