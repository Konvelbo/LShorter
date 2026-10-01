"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Moon,
  Sun,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { showToast } from "@/components/ui/toast-provider";

export function PreviewTopbar() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const getPageTitle = (path: string) => {
    if (path.includes("/analytics/geo")) return "Geography & Continents";
    if (path.includes("/analytics/revenue")) return "Customers & Revenue";
    if (path.includes("/analytics/live")) return "Live Click Stream";
    if (path.includes("/analytics")) return "Traffic Analytics";
    if (path.includes("/links")) return "Short Links";
    if (path.includes("/qr-code")) return "QR Code Studio";
    if (path.includes("/domains")) return "Custom Domains";
    return "Dashboard Overview";
  };

  const handleToggleTheme = () => {
    toggleTheme();
    // Notify parent window if in iframe
    if (typeof window !== "undefined" && window.parent && window.parent !== window) {
      window.parent.postMessage({ type: "lshorter-theme-toggle" }, "*");
    }
  };

  return (
    <header className="h-[64px] ds-bg-topbar border-b ds-border px-4 md:px-6 flex items-center justify-between ds-text-primary shrink-0 z-10 transition-colors">
      {/* Left: Breadcrumbs & Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[12px] font-mono ds-text-muted">
          <span>lshorter</span>
          <span>/</span>
          <span className="text-[#465FFF] dark:text-[#7592FF] font-medium">{getPageTitle(pathname)}</span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-mono">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Edge Sync 1.8ms</span>
        </div>
      </div>

      {/* Right: Search, Theme, Notifications, Profile */}
      <div className="flex items-center gap-2.5">
        {/* Search Input Bar (Decorative) */}
        <div
          onClick={() => showToast.info("Search modal is active in full dashboard.")}
          className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg ds-card ds-text-muted hover:ds-border-strong transition-all cursor-pointer text-xs w-48"
        >
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <span>Search links, tags...</span>
          <kbd className="ml-auto text-[10px] bg-neutral-200 dark:bg-white/10 px-1.5 py-0.5 rounded ds-text-muted font-mono">⌘K</kbd>
        </div>

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={handleToggleTheme}
          aria-label="Toggle theme"
          className="w-8 h-8 rounded-lg flex items-center justify-center ds-text-secondary hover:ds-text-primary hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
        >
          {theme === "dark" ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>

        {/* Notification Bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsNotifOpen((p) => !p)}
            className="w-8 h-8 rounded-lg flex items-center justify-center ds-text-secondary hover:ds-text-primary hover:bg-neutral-100 dark:hover:bg-white/10 transition-colors relative cursor-pointer"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#465FFF]" />
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-72 rounded-xl ds-card shadow-2xl p-3 z-50 text-xs">
              <div className="font-semibold ds-text-primary mb-2 flex items-center justify-between">
                <span>Notifications</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">2 new</span>
              </div>
              <div className="space-y-2">
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5">
                  <div className="font-medium text-[#465FFF] dark:text-[#7592FF]">Stripe checkout conversion</div>
                  <div className="ds-text-muted text-[11px] mt-0.5">
                    Link /stripe-billing-q4 generated +$140.00
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-neutral-50 dark:bg-white/5 border border-neutral-100 dark:border-white/5">
                  <div className="font-medium text-emerald-600 dark:text-emerald-400">Custom Domain Verified</div>
                  <div className="ds-text-muted text-[11px] mt-0.5">
                    go.acme.io is now routing at Edge with SSL.
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Pill */}
        <div className="flex items-center gap-2 pl-2 border-l ds-border">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#465FFF] to-indigo-500 text-white font-bold text-[11px] flex items-center justify-center border border-black/10 dark:border-white/20">
            AM
          </div>
          <span className="hidden sm:inline-block text-[12.5px] font-medium ds-text-primary">
            Alex Moran
          </span>
        </div>
      </div>
    </header>
  );
}
