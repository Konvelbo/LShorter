import React from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { OnboardingGuard } from "@/components/auth/onboarding-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <OnboardingGuard>
      <div className="h-screen w-screen overflow-hidden bg-[#09090b] text-[#fafafa] flex flex-col">
        {/* 1. Full-width Topbar across the entire top */}
        <Topbar />

        {/* 2. Content Row: Sidebar on Left + Framed Canvas on Right */}
        <div className="flex-1 flex flex-row min-h-0 overflow-hidden bg-[#09090b]">
          {/* Sidebar (No border) */}
          <Sidebar />

          {/* 3. Central Framed Canvas with Rounded Top-Left (No border, pure contrast + rounded-tl) */}
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#09090b] pr-0 pb-0">
            <main className="h-full w-full bg-[#121215] md:rounded-tl-[28px] overflow-y-auto custom-scroll shadow-2xl p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
              <div className="max-w-7xl w-full mx-auto">
                {children}
              </div>
            </main>
          </div>
        </div>
      </div>
    </OnboardingGuard>
  );
}
