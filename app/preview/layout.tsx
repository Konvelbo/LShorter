"use client";

import React, { useEffect } from "react";
import { PreviewSidebar } from "@/components/preview/preview-sidebar";
import { PreviewTopbar } from "@/components/preview/preview-topbar";
import { useTheme } from "@/components/providers/theme-provider";

function PreviewThemeSync() {
  const { setTheme } = useTheme();

  useEffect(() => {
    // 1. Sync theme from parent window on mount
    try {
      if (typeof window !== "undefined" && window.parent && window.parent !== window) {
        const isParentDark = window.parent.document.documentElement.classList.contains("dark");
        setTheme(isParentDark ? "dark" : "light");
      }
    } catch {}

    // 2. Listen to storage changes across windows
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "lshorter_theme_v2" && (e.newValue === "light" || e.newValue === "dark")) {
        setTheme(e.newValue);
      }
    };

    // 3. Listen to postMessage from landing page
    const handleMessage = (e: MessageEvent) => {
      if (e.data?.type === "lshorter-theme-change" && (e.data.theme === "light" || e.data.theme === "dark")) {
        setTheme(e.data.theme);
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("message", handleMessage);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("message", handleMessage);
    };
  }, [setTheme]);

  return null;
}

export default function PreviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden ds-bg-app ds-text-primary">
      <PreviewThemeSync />
      {/* 1. Left Navigation Sidebar */}
      <PreviewSidebar />

      {/* 2. Right Workspace */}
      <div className="relative flex flex-1 flex-col overflow-y-auto overflow-x-hidden ds-bg-app ds-main-scroll">
        <PreviewTopbar />

        <main className="flex-1">
          <div className="mx-auto max-w-[1536px] p-4 md:p-6 2xl:p-8 pb-20">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
