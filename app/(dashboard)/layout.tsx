import React from "react";
import type { Metadata } from "next";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";

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

        {/* 2. Right Column: Sticky Topbar + Main Scrollable Workspace with Theme-Adapted Scrollbar */}
        <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden ds-bg-app ds-main-scroll">
          <Topbar />

          <main className="flex-1">
            <div className="mx-auto max-w-[1536px] p-4 md:p-6 2xl:p-8 pb-24 md:pb-10">
              {children}
            </div>
          </main>
        </div>
      </div>
    </OnboardingGuard>
  );
}
