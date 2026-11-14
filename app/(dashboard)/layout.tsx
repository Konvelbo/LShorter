import React from "react";
import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";
import { MobileFabCreateLink } from "@/components/layout/mobile-fab-create-link";
import { SubscriptionGraceBanner } from "@/components/dashboard/subscription-grace-banner";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
      noarchive: true,
    },
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <div className="flex h-screen w-screen overflow-hidden ds-bg-app ds-text-primary">
        {/* 1. Full-height Left Sidebar (No visible scrollbar) */}
        <Sidebar />

        {/* 2. Right Column: Fixed Column containing Topbar, Scrollable Workspace & Bottom Blur Vignette */}
        <div className="relative flex flex-1 flex-col min-w-0 h-full overflow-hidden ds-bg-app">
          <Topbar />
          <SubscriptionGraceBanner />

          {/* Main Scrollable Workspace with Theme-Adapted Scrollbar */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden ds-bg-app ds-main-scroll">
            <main className="mx-auto max-w-[1536px] p-4 md:p-6 2xl:p-8 pb-28 md:pb-16">
              {children}
            </main>
          </div>

          {/* Bottom Blur Vignette Overlay — strictly covers the main content page, leaves sidebar untouched */}
          <div
            aria-hidden="true"
            className="ds-bottom-blur-vignette"
          />
        </div>

        {/* 3. Mobile Draggable Floating Action Button for Link Creation (40px, rounded-full, blue, fluid drag) */}
        <MobileFabCreateLink />
      </div>
    </OnboardingGuard>
  );
}
