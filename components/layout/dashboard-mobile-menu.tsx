"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Search,
  Bell,
  Plus,
  ChevronDown,
  LayoutDashboard,
  Link2,
  QrCode,
  BarChart2,
  Globe2,
  Settings,
  User as UserIcon,
  CreditCard,
  Sun,
  Moon,
  LogOut,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import gsap from "gsap";

interface SubNavItem {
  id: string;
  name: string;
  href: string;
  badge?: string;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  subItems?: SubNavItem[];
}

const navMenu: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Short Links", href: "/dashboard/links", icon: Link2 },
  {
    name: "Analytics",
    href: "/dashboard/analytics",
    icon: BarChart2,
    subItems: [
      { id: "traffic", name: "Traffic Overview", href: "/dashboard/analytics" },
      {
        id: "geo-map",
        name: "Geography & Continents",
        href: "/dashboard/analytics/geo",
      },
      {
        id: "conversions",
        name: "Customers & Revenue",
        href: "/dashboard/analytics/revenue",
      },
      {
        id: "live",
        name: "Live Click Stream",
        href: "/dashboard/analytics/live",
      },
    ],
  },
  { name: "QR Studio", href: "/dashboard/qr-code", icon: QrCode },
  { name: "Custom Domains", href: "/dashboard/domains", icon: Globe2 },
];

const navOthers: NavItem[] = [
  {
    name: "Settings",
    href: "/dashboard/settings",
    icon: Settings,
    subItems: [
      {
        id: "profile",
        name: "Profile & Account",
        href: "/dashboard/settings?tab=profile",
      },
      {
        id: "billing",
        name: "Billing & Invoices",
        href: "/dashboard/settings?tab=billing",
      },
      { id: "api", name: "API Keys", href: "/dashboard/settings?tab=api" },
      {
        id: "domains",
        name: "Domain Routing",
        href: "/dashboard/settings?tab=domains",
      },
      {
        id: "webhooks",
        name: "Webhooks",
        href: "/dashboard/settings?tab=webhooks",
      },
      {
        id: "pixels",
        name: "Retargeting Pixels",
        href: "/dashboard/settings?tab=pixels",
      },
      {
        id: "security",
        name: "Security & 2FA",
        href: "/dashboard/settings?tab=security",
      },
      {
        id: "notifications",
        name: "Notifications",
        href: "/dashboard/settings?tab=notifications",
      },
      { id: "data", name: "Data & GDPR", href: "/dashboard/settings?tab=data" },
      { id: "about", name: "About", href: "/dashboard/settings?tab=about" },
    ],
  },
];

export interface DashboardMobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenCreateLink: () => void;
  onOpenSearch: () => void;
  mergedNotifications: Array<{
    id: string;
    title: string;
    message: string;
    createdAt: number;
    isRead: boolean;
  }>;
  unreadCount: number;
  markAllNotificationsRead: () => void;
  displayName: string;
  displayEmail: string;
  avatarUrl: string;
  planDef: { name: string };
  theme: string;
  toggleTheme: () => void;
}

export function DashboardMobileMenu({
  isOpen,
  onClose,
  onOpenCreateLink,
  onOpenSearch,
  mergedNotifications,
  unreadCount,
  markAllNotificationsRead,
  displayName,
  displayEmail,
  avatarUrl,
  planDef,
  theme,
  toggleTheme,
}: DashboardMobileMenuProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Analytics: true,
  });
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const linksContainerRef = useRef<HTMLDivElement>(null);

  // Auto-expand menu containing current path
  useEffect(() => {
    if (pathname.startsWith("/dashboard/analytics")) {
      setOpenMenus((prev) => ({ ...prev, Analytics: true }));
    }
    if (pathname.startsWith("/dashboard/settings")) {
      setOpenMenus((prev) => ({ ...prev, Settings: true }));
    }
  }, [pathname]);

  // GSAP animation on open (like landing page mobile menu)
  useEffect(() => {
    if (!linksContainerRef.current) return;
    const items = linksContainerRef.current.querySelectorAll(".mobile-nav-item");
    if (isOpen) {
      gsap.fromTo(
        items,
        { opacity: 0, x: 20 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.025,
          duration: 0.22,
          ease: "power2.out",
          delay: 0.05,
        }
      );
    }
  }, [isOpen]);

  // Close modals when menu closes
  useEffect(() => {
    if (!isOpen) {
      setIsNotifModalOpen(false);
      setIsProfileModalOpen(false);
    }
  }, [isOpen]);

  const toggleSubmenu = (name: string) => {
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const isSubItemActive = (sub: SubNavItem) => {
    const [subPath, subQuery] = sub.href.split("?");
    if (subQuery) {
      const targetTab = new URLSearchParams(subQuery).get("tab");
      return pathname === subPath && typeof window !== "undefined" && new URLSearchParams(window.location.search).get("tab") === targetTab;
    }
    return pathname === subPath;
  };

  const isParentActive = (item: NavItem) => {
    if (item.href === "/dashboard") return pathname === "/dashboard";
    if (item.subItems) {
      return item.subItems.some((s) => isSubItemActive(s));
    }
    return pathname === item.href;
  };

  return (
    <>
      {/* ─── 1. OVERLAY & DRAWER CONTAINER ─── */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-all duration-300",
          isOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        )}
      >
        {/* Backdrop (clic pour fermer) */}
        <div
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
        />

        {/* Panneau latéral droit */}
        <div
          className={cn(
            "absolute inset-y-0 right-0 w-[84%] max-w-[320px] h-full flex flex-col justify-between ds-bg-sidebar border-l ds-border shadow-2xl transition-transform duration-300 ease-out py-5 px-4 select-none",
            isOpen ? "translate-x-0" : "translate-x-full"
          )}
        >
          {/* ─── EN HAUT (TOP) : Notifications & Recherche à gauche, Fermeture à droite ─── */}
          <div className="flex items-center justify-between pb-3 border-b ds-border shrink-0">
            {/* À gauche : Boutons Notification et Recherche (sans background, juste les icônes) */}
            <div className="flex items-center gap-1">
              {/* Notification icon button */}
              <button
                type="button"
                onClick={() => setIsNotifModalOpen(true)}
                className="relative p-2 text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none active:scale-90"
                aria-label="Notifications"
                title="Notifications"
              >
                <Bell className="w-5 h-5 stroke-[1.75]" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#F79009] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#F79009]" />
                  </span>
                )}
              </button>

              {/* Search icon button */}
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenSearch();
                }}
                className="p-2 text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none active:scale-90"
                aria-label="Rechercher"
                title="Rechercher (⌘K)"
              >
                <Search className="w-5 h-5 stroke-[1.75]" />
              </button>
            </div>

            {/* À droite : Bouton de fermeture */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white active:scale-90 transition-all cursor-pointer"
              aria-label="Fermer le menu"
            >
              <X className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>

          {/* ─── AU MILIEU : Navigation avec sous-pages ─── */}
          <div
            ref={linksContainerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden py-3 no-scrollbar space-y-4"
          >
            {/* Section MENU */}
            <div>
              <span className="block px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider ds-text-muted">
                Menu
              </span>
              <div className="flex flex-col gap-1">
                {navMenu.map((item) => {
                  const hasSubs = Boolean(item.subItems && item.subItems.length > 0);
                  const isExpanded = openMenus[item.name] ?? false;
                  const active = isParentActive(item);
                  const Icon = item.icon;

                  return (
                    <div key={item.name} className="mobile-nav-item">
                      {hasSubs ? (
                        <button
                          type="button"
                          onClick={() => toggleSubmenu(item.name)}
                          className={cn(
                            "w-full flex items-center justify-between rounded-[8px] px-2.5 py-2 text-[13px] font-medium transition-colors cursor-pointer",
                            active
                              ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                              : "ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 transition-transform duration-200 ds-text-muted",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center justify-between rounded-[8px] px-2.5 py-2 text-[13px] font-medium transition-colors",
                            active
                              ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                              : "ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          {item.badge && (
                            <span className="rounded-full bg-[#ECFDF3] dark:bg-[#039855]/15 px-1.5 py-0.5 text-[9.5px] font-semibold text-[#039855] dark:text-[#32D583]">
                              {item.badge}
                            </span>
                          )}
                        </Link>
                      )}

                      {/* Sous-pages */}
                      {hasSubs && isExpanded && (
                        <div className="mt-1 ml-4 pl-2.5 border-l ds-border flex flex-col gap-1">
                          {item.subItems!.map((sub) => {
                            const subActive = isSubItemActive(sub);
                            return (
                              <Link
                                key={sub.id}
                                href={sub.href}
                                onClick={onClose}
                                className={cn(
                                  "flex items-center justify-between rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                                  subActive
                                    ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF] font-semibold"
                                    : "ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5"
                                )}
                              >
                                <span className="truncate">{sub.name}</span>
                                {sub.badge && (
                                  <span className="rounded-full bg-[#ECFDF3] dark:bg-[#039855]/15 px-1.5 py-0.5 text-[9px] font-semibold text-[#039855] dark:text-[#32D583]">
                                    {sub.badge}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section OTHERS */}
            <div>
              <span className="block px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider ds-text-muted">
                Others
              </span>
              <div className="flex flex-col gap-1">
                {navOthers.map((item) => {
                  const hasSubs = Boolean(item.subItems && item.subItems.length > 0);
                  const isExpanded = openMenus[item.name] ?? false;
                  const active = isParentActive(item);
                  const Icon = item.icon;

                  return (
                    <div key={item.name} className="mobile-nav-item">
                      {hasSubs ? (
                        <button
                          type="button"
                          onClick={() => toggleSubmenu(item.name)}
                          className={cn(
                            "w-full flex items-center justify-between rounded-[8px] px-2.5 py-2 text-[13px] font-medium transition-colors cursor-pointer",
                            active
                              ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                              : "ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 transition-transform duration-200 ds-text-muted",
                              isExpanded && "rotate-180"
                            )}
                          />
                        </button>
                      ) : (
                        <Link
                          href={item.href}
                          onClick={onClose}
                          className={cn(
                            "flex items-center justify-between rounded-[8px] px-2.5 py-2 text-[13px] font-medium transition-colors",
                            active
                              ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                              : "ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5"
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                        </Link>
                      )}

                      {/* Sous-pages de Settings */}
                      {hasSubs && isExpanded && (
                        <div className="mt-1 ml-4 pl-2.5 border-l ds-border flex flex-col gap-1">
                          {item.subItems!.map((sub) => {
                            const subActive = isSubItemActive(sub);
                            return (
                              <Link
                                key={sub.id}
                                href={sub.href}
                                onClick={onClose}
                                className={cn(
                                  "flex items-center justify-between rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium transition-colors",
                                  subActive
                                    ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF] font-semibold"
                                    : "ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5"
                                )}
                              >
                                <span className="truncate">{sub.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* ─── EN BAS : Ligne (gap-1) + Bouton Create Link + Profil utilisateur en dessous ─── */}
          <div className="shrink-0 pt-3 border-t ds-border flex flex-col gap-2">
            {/* Bouton "Create link" tout en bas */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenCreateLink();
              }}
              className="w-full h-10 rounded-[10px] bg-[#0066FF] hover:bg-[#0055d4] active:scale-[0.98] text-white text-[13px] font-semibold flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create link</span>
            </button>

            {/* Profil utilisateur en dessous (avatar à gauche, nom + email à droite colonne 1) */}
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 p-2 rounded-[10px] hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] cursor-pointer transition-colors"
            >
              <Avatar className="h-9 w-9 rounded-[10px] border ds-border shrink-0">
                <AvatarImage
                  src={avatarUrl}
                  alt={displayName}
                  seed={displayEmail}
                  className="rounded-[10px] object-cover"
                />
                <AvatarFallback seed={displayEmail} className="rounded-[10px]">
                  {displayName.slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col min-w-0 flex-1 leading-tight text-left">
                <span className="text-[13px] font-bold ds-text-primary truncate">
                  {displayName}
                </span>
                <span className="text-[11px] ds-text-muted truncate mt-0.5">
                  {displayEmail}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. MODALE NOTIFICATIONS MOBILE ─── */}
      {isNotifModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-sm rounded-[14px] ds-card p-4 shadow-2xl border ds-border flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b ds-border">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold ds-text-primary">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <span className="rounded-full bg-[#ECF3FF] dark:bg-[#465FFF]/20 text-[#0066FF] dark:text-[#7592FF] text-[10.5px] font-bold px-2 py-0.5">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-xs font-medium text-[#0066FF] dark:text-[#7592FF] hover:underline cursor-pointer"
                  >
                    Tout marquer lu
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsNotifModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-muted hover:text-primary transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto py-2 flex flex-col gap-2">
              {mergedNotifications.length === 0 ? (
                <div className="py-8 text-center text-xs ds-text-muted">
                  Aucune notification pour le moment.
                </div>
              ) : (
                mergedNotifications.slice(0, 8).map((notif) => (
                  <div
                    key={notif.id}
                    className={cn(
                      "rounded-[10px] p-3 text-left transition-colors",
                      notif.isRead
                        ? "bg-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                        : "bg-[#ECF3FF]/70 dark:bg-[#465FFF]/15 border border-[#465FFF]/20"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold ds-text-primary">
                        {notif.title}
                      </span>
                      <span className="text-[10px] ds-text-muted shrink-0">
                        {new Date(notif.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="mt-1 text-xs ds-text-secondary leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. MODALE PROFIL MOBILE (mêmes infos que sur le popup desktop) ─── */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div
            className="w-full max-w-sm rounded-[14px] ds-card p-4 shadow-2xl border ds-border flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Profil */}
            <div className="flex items-center justify-between pb-3 border-b ds-border">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 rounded-[10px] border ds-border shrink-0">
                  <AvatarImage
                    src={avatarUrl}
                    alt={displayName}
                    seed={displayEmail}
                    className="rounded-[10px] object-cover"
                  />
                  <AvatarFallback seed={displayEmail} className="rounded-[10px]">
                    {displayName.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-left">
                  <p className="text-sm font-bold ds-text-primary truncate">
                    {displayName}
                  </p>
                  <p className="text-xs ds-text-muted truncate mt-0.5">
                    {displayEmail}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-muted hover:text-primary transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Badge Plan */}
            <div className="flex items-center justify-between px-3 py-2 rounded-[8px] bg-black/[0.03] dark:bg-white/[0.04]">
              <span className="text-xs ds-text-muted">Abonnement</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0066FF] dark:text-[#5294FF]">
                <Sparkles className="w-3.5 h-3.5" />
                Plan {planDef.name}
              </span>
            </div>

            {/* Liens d'action */}
            <div className="flex flex-col gap-1 py-1">
              <Link
                href="/dashboard/settings?tab=profile"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  onClose();
                }}
                className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <UserIcon className="h-4 w-4 ds-text-muted" />
                <span>Edit Profile</span>
              </Link>

              <Link
                href="/dashboard/settings?tab=billing"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  onClose();
                }}
                className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <CreditCard className="h-4 w-4 ds-text-muted" />
                <span>Billing & Plan ({planDef.name})</span>
              </Link>

              <Link
                href="/dashboard/settings"
                onClick={() => {
                  setIsProfileModalOpen(false);
                  onClose();
                }}
                className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
              >
                <Settings className="h-4 w-4 ds-text-muted" />
                <span>Account Settings</span>
              </Link>

              {/* Theme Toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-sm ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  {theme === "dark" ? (
                    <Sun className="h-4 w-4 text-amber-400" />
                  ) : (
                    <Moon className="h-4 w-4 ds-text-muted" />
                  )}
                  <span>Thème</span>
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-[5px] bg-black/[0.04] dark:bg-white/[0.06] ds-text-muted capitalize">
                  {theme === "dark" ? "Sombre" : "Clair"}
                </span>
              </button>
            </div>

            {/* Sign out */}
            <div className="border-t ds-border pt-2">
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm text-[#D92D20] hover:bg-[#FEF3F2] dark:hover:bg-[#D92D20]/10 cursor-pointer transition-colors"
              >
                <LogOut className="h-4 w-4" />
                <span>Se déconnecter</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
