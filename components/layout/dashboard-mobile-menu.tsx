"use client";

import React, { useState, useEffect } from "react";
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
  Languages,
} from "lucide-react";
import { useI18n } from "@/components/providers/i18n-provider";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  getDiceBearAvatar,
} from "@/components/ui/avatar";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";

interface SubNavItem {
  id: string;
  name: string;
  href: string;
  badge?: string;
}

interface NavItem {
  id: string;
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  subItems?: SubNavItem[];
}

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
  markNotificationRead?: (id: string, e?: React.MouseEvent) => void;
  displayName: string;
  displayEmail: string;
  avatarUrl: string;
  planDef: { name: string };
  theme: string;
  toggleTheme: () => void;
}

export const DashboardMobileMenu = React.memo(function DashboardMobileMenu({
  isOpen,
  onClose,
  onOpenCreateLink,
  onOpenSearch,
  mergedNotifications,
  unreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  displayName,
  displayEmail,
  avatarUrl,
  planDef,
  theme,
  toggleTheme,
}: DashboardMobileMenuProps) {
  const pathname = usePathname();
  const { locale, toggleLocale, t, tr } = useI18n();

  const navMenu: NavItem[] = React.useMemo(
    () => [
      {
        id: "Dashboard",
        name: tr("Dashboard", "Tableau de bord"),
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        id: "Short Links",
        name: tr("Short Links", "Liens courts"),
        href: "/dashboard/links",
        icon: Link2,
      },
      {
        id: "Analytics",
        name: tr("Analytics", "Analytiques"),
        href: "/dashboard/analytics",
        icon: BarChart2,
        subItems: [
          {
            id: "traffic",
            name: tr("Traffic Overview", "Vue du trafic"),
            href: "/dashboard/analytics",
          },
          {
            id: "geo-map",
            name: tr("Geography & Continents", "Géographie & Continents"),
            href: "/dashboard/analytics/geo",
          },
          {
            id: "conversions",
            name: tr("Customers & Revenue", "Clients & Revenus"),
            href: "/dashboard/analytics/revenue",
          },
          {
            id: "devices",
            name: tr("Devices & Formats", "Appareils & Formats"),
            href: "/dashboard/analytics/devices",
          },
          {
            id: "sources",
            name: tr("Traffic Sources", "Sources de trafic"),
            href: "/dashboard/analytics/sources",
          },
          {
            id: "live",
            name: tr("Live Click Stream", "Flux de clics en direct"),
            href: "/dashboard/analytics/live",
          },
        ],
      },
      {
        id: "QR Studio",
        name: tr("QR Studio", "Studio QR"),
        href: "/dashboard/qr-code",
        icon: QrCode,
      },
      {
        id: "Custom Domains",
        name: tr("Custom Domains", "Domaines personnalisés"),
        href: "/dashboard/domains",
        icon: Globe2,
      },
    ],
    [tr],
  );

  const navOthers: NavItem[] = React.useMemo(
    () => [
      {
        id: "Settings",
        name: tr("Settings", "Paramètres"),
        href: "/dashboard/settings",
        icon: Settings,
        subItems: [
          {
            id: "profile",
            name: tr("Profile & Account", "Profil & Compte"),
            href: "/dashboard/settings?tab=profile",
          },
          {
            id: "billing",
            name: tr("Billing & Invoices", "Facturation & Factures"),
            href: "/dashboard/settings?tab=billing",
          },
          {
            id: "api",
            name: tr("API Keys", "Clés API"),
            href: "/dashboard/settings?tab=api",
          },
          {
            id: "domains",
            name: tr("Domain Routing", "Routage de domaine"),
            href: "/dashboard/settings?tab=domains",
          },
          {
            id: "webhooks",
            name: tr("Webhooks", "Webhooks"),
            href: "/dashboard/settings?tab=webhooks",
          },
          {
            id: "pixels",
            name: tr("Retargeting Pixels", "Pixels de reciblage"),
            href: "/dashboard/settings?tab=pixels",
          },
          {
            id: "security",
            name: tr("Security & 2FA", "Sécurité & 2FA"),
            href: "/dashboard/settings?tab=security",
          },
          {
            id: "notifications",
            name: tr("Notifications", "Notifications"),
            href: "/dashboard/settings?tab=notifications",
          },
          {
            id: "data",
            name: tr("Data & GDPR", "Données & RGPD"),
            href: "/dashboard/settings?tab=data",
          },
          {
            id: "about",
            name: tr("About", "À propos"),
            href: "/dashboard/settings?tab=about",
          },
        ],
      },
    ],
    [tr],
  );
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Analytics: true,
  });
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Auto-expand menu containing current path
  useEffect(() => {
    if (pathname.startsWith("/dashboard/analytics")) {
      setOpenMenus((prev) => ({ ...prev, Analytics: true }));
    }
    if (pathname.startsWith("/dashboard/settings")) {
      setOpenMenus((prev) => ({ ...prev, Settings: true }));
    }
  }, [pathname]);

  // Close modals when menu closes
  useEffect(() => {
    if (!isOpen) {
      setIsNotifModalOpen(false);
      setIsProfileModalOpen(false);
    }
  }, [isOpen]);

  const [currentTabParam, setCurrentTabParam] = useState<string>("");

  useEffect(() => {
    const syncTabFromWindow = () => {
      if (typeof window !== "undefined") {
        const sp = new URLSearchParams(window.location.search);
        setCurrentTabParam(
          sp.get("tab") ||
            (pathname === "/dashboard/settings" ? "profile" : ""),
        );
      }
    };

    syncTabFromWindow();

    const handleSettingsTabEvent = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (detail?.tab) setCurrentTabParam(detail.tab);
    };

    window.addEventListener("popstate", syncTabFromWindow);
    window.addEventListener(
      "lshorter_settings_tab_change",
      handleSettingsTabEvent,
    );

    return () => {
      window.removeEventListener("popstate", syncTabFromWindow);
      window.removeEventListener(
        "lshorter_settings_tab_change",
        handleSettingsTabEvent,
      );
    };
  }, [pathname]);

  const toggleSubmenu = (id: string) => {
    setOpenMenus((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const isSubItemActive = (sub: SubNavItem) => {
    const [subPath, subQuery] = sub.href.split("?");
    if (subQuery) {
      const targetTab = new URLSearchParams(subQuery).get("tab");
      return pathname === subPath && currentTabParam === targetTab;
    }
    if (subPath === "/dashboard") return pathname === "/dashboard";
    if (subPath === "/dashboard/analytics")
      return pathname === "/dashboard/analytics" && !currentTabParam;
    return pathname === subPath;
  };

  const isParentActive = (item: NavItem) => {
    if (item.id === "Dashboard" || item.href === "/dashboard")
      return pathname === "/dashboard";
    return pathname.startsWith(item.href);
  };

  return (
    <>
      {/* ─── 1. OVERLAY & DRAWER CONTAINER ─── */}
      <div
        inert={!isOpen ? true : undefined}
        aria-hidden={!isOpen}
        className={cn(
          "fixed inset-0 z-50 lg:hidden",
          isOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        {/* Backdrop (clic pour fermer) */}
        <div
          onClick={onClose}
          className={cn(
            "absolute inset-0 bg-black/50 touch-none will-change-[opacity] transition-opacity duration-200 ease-out",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none",
          )}
        />

        {/* Panneau latéral droit */}
        <div
          className={cn(
            "absolute inset-y-0 right-0 w-[84%] max-w-[320px] h-full flex flex-col justify-between ds-bg-sidebar border-l ds-border transform-gpu will-change-transform [contain:layout_paint_style] transition-transform duration-220 py-5 px-4 select-none",
            isOpen && "shadow-2xl",
            isOpen ? "translate-x-0" : "translate-x-full",
          )}
          style={{
            transitionTimingFunction: "cubic-bezier(0.22, 1, 0.36, 1)",
          }}
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
                aria-label={t("topbar.notifications")}
                title={t("topbar.notifications")}
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
                aria-label={tr("Search", "Rechercher")}
                title={tr("Search (⌘K)", "Rechercher (⌘K)")}
              >
                <Search className="w-5 h-5 stroke-[1.75]" />
              </button>

              {/* Theme toggle icon button */}
              <button
                type="button"
                onClick={toggleTheme}
                className="p-2 text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white transition-colors cursor-pointer bg-transparent border-none active:scale-90"
                aria-label={tr("Toggle theme", "Basculer le thème")}
                title={
                  theme === "dark"
                    ? t("nav.lightMode")
                    : t("nav.darkMode")
                }
              >
                {theme === "dark" ? (
                  <Sun className="w-5 h-5 stroke-[1.75] text-amber-400" />
                ) : (
                  <Moon className="w-5 h-5 stroke-[1.75]" />
                )}
              </button>
            </div>

            {/* À droite : Bouton de fermeture */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white active:scale-90 transition-all cursor-pointer"
              aria-label={t("nav.closeMenu")}
            >
              <X className="w-4 h-4 stroke-[1.75]" />
            </button>
          </div>

          {/* ─── AU MILIEU : Navigation avec sous-pages ─── */}
          <div
            className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-3 no-scrollbar space-y-4"
          >
            {/* Section MENU */}
            <div>
              <span className="block px-2 mb-1.5 text-[10px] font-semibold uppercase tracking-wider ds-text-muted">
                {tr("Menu", "Menu")}
              </span>
              <div className="flex flex-col gap-1">
                {navMenu.map((item) => {
                  const hasSubs = Boolean(
                    item.subItems && item.subItems.length > 0,
                  );
                  const isExpanded = openMenus[item.id] ?? false;
                  const active = isParentActive(item);
                  const Icon = item.icon;

                  return (
                    <div key={item.id} className="mobile-nav-item">
                      {hasSubs ? (
                        <button
                          type="button"
                          onClick={() => toggleSubmenu(item.id)}
                          className={cn(
                            "w-full flex items-center justify-between rounded-[8px] px-2.5 py-2 text-[13px] font-medium transition-colors cursor-pointer",
                            active
                              ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                              : "ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5",
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 transition-transform duration-200 ds-text-muted",
                              isExpanded && "rotate-180",
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
                              : "ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5",
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
                                    : "ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5",
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
                {tr("Others", "Autres")}
              </span>
              <div className="flex flex-col gap-1">
                {navOthers.map((item) => {
                  const hasSubs = Boolean(
                    item.subItems && item.subItems.length > 0,
                  );
                  const isExpanded = openMenus[item.id] ?? false;
                  const active = isParentActive(item);
                  const Icon = item.icon;

                  return (
                    <div key={item.id} className="mobile-nav-item">
                      {hasSubs ? (
                        <button
                          type="button"
                          onClick={() => toggleSubmenu(item.id)}
                          className={cn(
                            "w-full flex items-center justify-between rounded-[8px] px-2.5 py-2 text-[13px] font-medium transition-colors cursor-pointer",
                            active
                              ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                              : "ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5",
                          )}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 shrink-0" />
                            <span>{item.name}</span>
                          </div>
                          <ChevronDown
                            className={cn(
                              "w-3.5 h-3.5 transition-transform duration-200 ds-text-muted",
                              isExpanded && "rotate-180",
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
                              : "ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5",
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
                                    : "ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5",
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
              <span>{tr("Create link", "Créer un lien")}</span>
            </button>

            {/* Profil utilisateur en dessous (avatar à gauche, nom + email à droite colonne 1) */}
            <div
              onClick={() => setIsProfileModalOpen(true)}
              className="flex items-center gap-3 p-2 rounded-[10px] hover:bg-black/5 dark:hover:bg-white/5 active:scale-[0.98] cursor-pointer transition-colors"
            >
              <Avatar className="h-9 w-9 rounded-[10px] border ds-border shrink-0">
                <AvatarImage
                  src={
                    avatarUrl || getDiceBearAvatar(displayEmail || displayName)
                  }
                  alt={displayName}
                  seed={displayEmail || displayName}
                  className="rounded-[10px] object-cover"
                />
                <AvatarFallback
                  suppressHydrationWarning
                  seed={displayEmail || displayName}
                  className="rounded-[10px]"
                >
                  {displayName.slice(0, 2)}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col min-w-0 flex-1 leading-tight text-left">
                <span
                  suppressHydrationWarning
                  className="text-[13px] font-bold ds-text-primary truncate"
                >
                  {displayName}
                </span>
                <span
                  suppressHydrationWarning
                  className="text-[11px] ds-text-muted truncate mt-0.5"
                >
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
                  {t("topbar.notifications")}
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
                    {tr("Mark all as read", "Tout marquer lu")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsNotifModalOpen(false)}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10 text-muted hover:text-primary transition-colors cursor-pointer"
                  aria-label={t("common.close")}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto pt-3 pb-2 flex flex-col gap-2">
              {mergedNotifications.length === 0 ? (
                <div className="py-8 text-center text-xs ds-text-muted">
                  {tr("No notifications yet.", "Aucune notification pour le moment.")}
                </div>
              ) : (
                mergedNotifications.slice(0, 10).map((notif) => {
                  const d = new Date(notif.createdAt || Date.now());
                  const datePopLabel = `${String(d.getFullYear()).slice(-2)}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
                  return (
                    <div
                      key={notif.id}
                      onClick={() => markNotificationRead?.(notif.id)}
                      className={cn(
                        "group relative rounded-[10px] p-3 text-left transition-colors cursor-pointer",
                        notif.isRead
                          ? "bg-transparent hover:bg-black/[0.02] dark:hover:bg-white/[0.02]"
                          : "bg-[#ECF3FF]/70 dark:bg-[#465FFF]/15 border border-[#465FFF]/20",
                      )}
                    >
                      {/* Hover Date Pop (YY/MM/DD) */}
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute -top-2 right-2.5 z-20 inline-flex items-center rounded-[6px] bg-zinc-900 dark:bg-[#27272A] px-2 py-0.5 text-[10px] font-mono font-semibold tracking-wider text-white shadow-md ring-1 ring-black/10 dark:ring-white/15 opacity-0 scale-90 translate-y-1 group-hover:opacity-100 group-hover:scale-100 group-hover:translate-y-0 transition-all duration-150 ease-out"
                      >
                        {datePopLabel}
                        <span className="absolute -bottom-0.5 right-3 h-1.5 w-1.5 rotate-45 bg-zinc-900 dark:bg-[#27272A]" />
                      </span>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-semibold ds-text-primary flex items-center gap-1.5">
                          {!notif.isRead && (
                            <span className="h-1.5 w-1.5 rounded-full bg-[#465FFF] shrink-0" />
                          )}
                          {notif.title}
                        </span>
                        <span className="text-[10px] ds-text-muted shrink-0">
                          {d.toLocaleTimeString(locale === "fr" ? "fr-FR" : "en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                      <p className="mt-1 text-xs ds-text-secondary leading-relaxed">
                        {notif.message}
                      </p>
                    </div>
                  );
                })
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
                    src={
                      avatarUrl ||
                      getDiceBearAvatar(displayEmail || displayName)
                    }
                    alt={displayName}
                    seed={displayEmail || displayName}
                    className="rounded-[10px] object-cover"
                  />
                  <AvatarFallback
                    suppressHydrationWarning
                    seed={displayEmail || displayName}
                    className="rounded-[10px]"
                  >
                    {displayName.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 text-left">
                  <p
                    suppressHydrationWarning
                    className="text-sm font-bold ds-text-primary truncate"
                  >
                    {displayName}
                  </p>
                  <p
                    suppressHydrationWarning
                    className="text-xs ds-text-muted truncate mt-0.5"
                  >
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
              <span className="text-xs ds-text-muted">{tr("Subscription", "Abonnement")}</span>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0066FF] dark:text-[#5294FF]">
                <Sparkles className="w-3.5 h-3.5" />
                {tr("Plan", "Forfait")} {planDef.name}
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
                <span>{t("topbar.editProfile")}</span>
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
                <span>{t("topbar.billingPlan")} ({planDef.name})</span>
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
                <span>{t("topbar.accountSettings")}</span>
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
                  <span>{t("topbar.theme")}</span>
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-[5px] bg-black/[0.04] dark:bg-white/[0.06] ds-text-muted">
                  {theme === "dark" ? t("topbar.dark") : t("topbar.light")}
                </span>
              </button>

              {/* Language Toggle */}
              <button
                type="button"
                onClick={toggleLocale}
                className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-sm ds-text-secondary hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
              >
                <span className="flex items-center gap-2.5">
                  <Languages className="h-4 w-4 ds-text-muted" />
                  <span>{t("topbar.language")}</span>
                </span>
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-[5px] bg-black/[0.04] dark:bg-white/[0.06] ds-text-muted">
                  {locale === "fr" ? "Français" : "English"}
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
                <span>{t("topbar.signOut")}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
});
