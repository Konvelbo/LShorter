"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Link2,
  QrCode,
  BarChart2,
  Globe2,
  Settings,
  Plus,
  ChevronDown,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { showToast } from "@/components/ui/toast-provider";

interface SubNavItem {
  id: string;
  name: string;
  href: string;
  badge?: string;
  isActionDisabled?: boolean;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  subItems?: SubNavItem[];
  isActionDisabled?: boolean;
}

const navMenu: NavItem[] = [
  { name: "Dashboard", href: "/preview/dashboard", icon: LayoutDashboard },
  { name: "Short Links", href: "/preview/dashboard/links", icon: Link2, badge: "8" },
  {
    name: "Analytics",
    href: "/preview/dashboard/analytics",
    icon: BarChart2,
    subItems: [
      { id: "traffic", name: "Traffic Overview", href: "/preview/dashboard/analytics" },
      { id: "geo-map", name: "Geography & Continents", href: "/preview/dashboard/analytics/geo" },
      { id: "conversions", name: "Customers & Revenue", href: "/preview/dashboard/analytics/revenue" },
      { id: "live", name: "Live Click Stream", href: "/preview/dashboard/analytics/live", badge: "LIVE" },
    ],
  },
  { name: "QR Studio", href: "/preview/dashboard/qr-code", icon: QrCode },
  { name: "Custom Domains", href: "/preview/dashboard/domains", icon: Globe2 },
];

const navOthers: NavItem[] = [
  {
    name: "Settings",
    href: "#",
    icon: Settings,
    isActionDisabled: true,
    subItems: [
      { id: "profile", name: "Profile & Account", href: "#", isActionDisabled: true },
      { id: "billing", name: "Billing & Invoices", href: "#", isActionDisabled: true },
      { id: "api", name: "API Keys", href: "#", isActionDisabled: true },
      { id: "domains", name: "Domain Routing", href: "#", isActionDisabled: true },
      { id: "webhooks", name: "Webhooks", href: "#", isActionDisabled: true },
      { id: "security", name: "Security & 2FA", href: "#", isActionDisabled: true },
    ],
  },
];

export function PreviewSidebar() {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Analytics: true,
    Settings: false,
  });

  const toggleMenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleCreateClick = () => {
    showToast.info("Preview: Create link modal is active in the full dashboard.");
  };

  return (
    <aside className="w-[260px] h-screen ds-bg-sidebar border-r ds-border flex flex-col justify-between shrink-0 select-none ds-text-secondary transition-colors z-20">
      {/* Top Header */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="h-[64px] flex items-center justify-between px-5 border-b ds-border shrink-0">
          <Link href="/preview/dashboard" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[9px] bg-[#465FFF] text-white font-extrabold text-[12.5px] flex items-center justify-center shadow-md shadow-[#465FFF]/25">
              LS
            </div>
            <span className="text-[17px] font-bold tracking-tight ds-text-primary">
              LShorter
            </span>
          </Link>
          <span className="text-[10px] font-mono bg-[#ECF3FF] dark:bg-[#465FFF]/20 text-[#465FFF] dark:text-[#7592FF] border border-[#D1E0FF] dark:border-[#465FFF]/30 px-2 py-0.5 rounded-full font-semibold">
            PRO
          </span>
        </div>

        {/* Quick Action Button */}
        <div className="p-3 pb-1">
          <button
            type="button"
            onClick={handleCreateClick}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white text-[13px] font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Link</span>
          </button>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4 no-scrollbar">
          <div>
            <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider ds-text-muted">
              Menu
            </div>

            <div className="space-y-0.5">
              {navMenu.map((item) => {
                const Icon = item.icon;
                const hasSub = Boolean(item.subItems && item.subItems.length > 0);
                const isSubActive = Boolean(item.subItems?.some((s) => pathname === s.href));
                const isActive = pathname === item.href || isSubActive;
                const isOpen = openMenus[item.name] ?? false;

                if (hasSub) {
                  return (
                    <div key={item.name} className="space-y-0.5">
                      <button
                        type="button"
                        onClick={() => toggleMenu(item.name)}
                        className={cn(
                          "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer",
                          isActive
                            ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF] font-semibold"
                            : "ds-text-secondary hover:bg-neutral-100 dark:hover:bg-white/5 hover:ds-text-primary"
                        )}
                      >
                        <span className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 shrink-0" />
                          <span>{item.name}</span>
                        </span>
                        <ChevronDown
                          className={cn(
                            "w-3.5 h-3.5 transition-transform duration-200 ds-text-muted",
                            isOpen && "rotate-180 text-[#465FFF] dark:text-[#7592FF]"
                          )}
                        />
                      </button>

                      {isOpen && (
                        <div className="ml-5 pl-2 border-l ds-border space-y-0.5 mt-0.5">
                          {item.subItems!.map((sub) => {
                            const isSubCurrent = pathname === sub.href;
                            return (
                              <Link
                                key={sub.id}
                                href={sub.href}
                                className={cn(
                                  "w-full text-left px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors flex items-center justify-between",
                                  isSubCurrent
                                    ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/20 dark:text-[#7592FF] font-semibold"
                                    : "ds-text-muted hover:bg-neutral-100 dark:hover:bg-white/5 hover:ds-text-primary"
                                )}
                              >
                                <span className="truncate">{sub.name}</span>
                                {sub.badge && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                }

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF] font-semibold"
                        : "ds-text-secondary hover:bg-neutral-100 dark:hover:bg-white/5 hover:ds-text-primary"
                    )}
                  >
                    <span className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.name}</span>
                    </span>
                    {item.badge && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-white/10 ds-text-muted font-mono">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Others / Settings Section (Subpages do nothing in preview) */}
          <div>
            <div className="px-3 mb-1.5 text-[11px] font-semibold uppercase tracking-wider ds-text-muted">
              Others
            </div>

            <div className="space-y-0.5">
              {navOthers.map((item) => {
                const Icon = item.icon;
                const isOpen = openMenus[item.name] ?? false;

                return (
                  <div key={item.name} className="space-y-0.5">
                    <button
                      type="button"
                      onClick={() => toggleMenu(item.name)}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ds-text-secondary hover:bg-neutral-100 dark:hover:bg-white/5 hover:ds-text-primary"
                    >
                      <span className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 shrink-0" />
                        <span>{item.name}</span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform duration-200 ds-text-muted",
                          isOpen && "rotate-180 text-[#465FFF] dark:text-[#7592FF]"
                        )}
                      />
                    </button>

                    {isOpen && item.subItems && (
                      <div className="ml-5 pl-2 border-l ds-border space-y-0.5 mt-0.5">
                        {item.subItems.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              // Settings subpages do nothing in preview
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors flex items-center justify-between ds-text-muted hover:bg-neutral-100 dark:hover:bg-white/5 hover:ds-text-primary cursor-default"
                          >
                            <span className="truncate">{sub.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Live Monthly Capacity Indicator */}
        <div className="p-3 border-t ds-border">
          <div className="p-3 rounded-xl bg-neutral-50 dark:bg-white/[0.03] border ds-border space-y-2">
            <div className="flex items-center justify-between text-[11.5px]">
              <span className="flex items-center gap-1.5 ds-text-secondary font-medium">
                <Zap className="w-3.5 h-3.5 text-[#465FFF] dark:text-[#7592FF]" />
                Monthly Clicks
              </span>
              <span className="font-mono text-[#465FFF] dark:text-[#7592FF] font-bold">128.5k / 150k</span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#465FFF] to-[#7592FF] rounded-full"
                style={{ width: "85%" }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] ds-text-muted">
              <span>85% capacity</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Edge active</span>
            </div>
          </div>
        </div>

        {/* Mock User Profile Footer */}
        <div className="p-3 border-t ds-border flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#465FFF] to-indigo-500 text-white font-bold text-xs flex items-center justify-center shrink-0 border border-black/10 dark:border-white/20">
              AM
            </div>
            <div className="min-w-0">
              <div className="text-[12.5px] font-semibold ds-text-primary truncate">
                Alex Moran
              </div>
              <div className="text-[11px] ds-text-muted truncate">
                alex@acme.io
              </div>
            </div>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25 font-semibold">
            PRO
          </span>
        </div>
      </div>
    </aside>
  );
}
