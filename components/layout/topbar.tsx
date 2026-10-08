"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  PanelLeft,
  ChevronDown,
  Plus,
  Settings,
  LogOut,
  User as UserIcon,
  CreditCard,
} from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { useSession, signOut } from "next-auth/react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Avatar, AvatarImage, AvatarFallback, getDiceBearAvatar } from "@/components/ui/avatar";
import { LinkCreateModal } from "@/components/dashboard/link-create-modal";
import { ReuiCommandModal } from "@/components/search/reui-command-modal";
import { getPlanDefinition } from "@/src/config/pricing";
import { DashboardMobileMenu } from "./dashboard-mobile-menu";

export function Topbar() {
  const { theme, toggleTheme } = useTheme();
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId ? { userId, email: session?.user?.email || undefined } : "skip"
  );

  useEffect(() => {
    if (convexUser?.plan && typeof window !== "undefined") {
      localStorage.setItem("lshorter_user_plan", convexUser.plan.toUpperCase());
    }
  }, [convexUser?.plan]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [localNotifs, setLocalNotifs] = useState<
    Array<{
      id: string;
      title: string;
      message: string;
      createdAt: number;
      isRead: boolean;
    }>
  >([]);

  const convexNotifs = useQuery(
    api.notifications.listNotifications,
    userId ? { orgId: userId } : "skip"
  );

  useEffect(() => {
    try {
      const saved = localStorage.getItem("lshorter_saas_notifications");
      if (saved) {
        setLocalNotifs(JSON.parse(saved));
      }
    } catch {}

    const onNewNotif = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail && detail.title) {
        setLocalNotifs((prev) => {
          const next = [
            {
              id: detail.id || `notif_${Date.now()}`,
              title: detail.title,
              message: detail.message,
              createdAt: detail.createdAt || Date.now(),
              isRead: false,
            },
            ...prev,
          ].slice(0, 12);
          try {
            localStorage.setItem(
              "lshorter_saas_notifications",
              JSON.stringify(next)
            );
          } catch {}
          return next;
        });
      }
    };

    const onOpenCmdModal = () => {
      setIsCommandModalOpen(true);
      setIsNotifOpen(false);
      setIsProfileOpen(false);
    };

    window.addEventListener("lshorter:notification", onNewNotif);
    window.addEventListener("lshorter:open-command-modal", onOpenCmdModal);
    return () => {
      window.removeEventListener("lshorter:notification", onNewNotif);
      window.removeEventListener("lshorter:open-command-modal", onOpenCmdModal);
    };
  }, []);

  const markAsReadMutation = useMutation(api.notifications.markAsRead);
  const markAllAsReadMutation = useMutation(api.notifications.markAllAsRead);

  const mergedNotifications = React.useMemo(() => {
    const fromConvex = Array.isArray(convexNotifs)
      ? convexNotifs.map((n: any) => ({
          id: String(n._id || n.id),
          title: n.title,
          message: n.message,
          createdAt: n.createdAt || n._creationTime || Date.now(),
          isRead: Boolean(n.isRead),
          linkUrl: n.linkUrl,
        }))
      : [];
    const seen = new Set(fromConvex.map((n) => n.title + n.message));
    const combined = [
      ...localNotifs.filter((n) => !seen.has(n.title + n.message)),
      ...fromConvex,
    ];
    return combined.sort((a, b) => b.createdAt - a.createdAt).slice(0, 10);
  }, [convexNotifs, localNotifs]);

  const unreadCount = mergedNotifications.filter((n) => !n.isRead).length;

  const markNotificationRead = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setLocalNotifs((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      try {
        localStorage.setItem("lshorter_saas_notifications", JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (id && !id.startsWith("notif_") && userId) {
      try {
        await markAsReadMutation({ notificationId: id as any });
      } catch (err) {
        console.warn("[topbar] Error marking notification as read:", err);
      }
    }
  };

  const markAllNotificationsRead = async () => {
    const updated = localNotifs.map((n) => ({ ...n, isRead: true }));
    setLocalNotifs(updated);
    try {
      localStorage.setItem(
        "lshorter_saas_notifications",
        JSON.stringify(updated)
      );
    } catch {}

    if (userId) {
      try {
        await markAllAsReadMutation({ orgId: userId });
      } catch (err) {
        console.warn("[topbar] Error marking all notifications as read:", err);
      }
    }
  };

  const displayName =
    convexUser?.name || session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const displayEmail = convexUser?.email || session?.user?.email || "";
  const avatarUrl =
    convexUser?.avatarUrl ||
    (convexUser as any)?.image ||
    session?.user?.image ||
    getDiceBearAvatar(displayEmail || displayName);

  const userTier =
    (convexUser?.plan as string) ||
    ((session?.user as any)?.plan as string) ||
    "FREE";
  const planDef = getPlanDefinition(userTier);

  return (
    <>
      <header className="sticky top-0 z-30 flex h-[43px] min-h-[43px] max-h-[43px] w-full items-center justify-between ds-bg-topbar border-b ds-border px-3 sm:px-4">
        {/* ─── DESKTOP VIEW (>= lg) ─── */}
        <div className="hidden lg:flex items-center justify-between w-full h-full">
          {/* Left: Hamburger Toggle for Desktop Sidebar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new CustomEvent("lshorter:toggle-sidebar"))}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-transparent text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Toggle Sidebar"
            >
              <PanelLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Right: Compact Search Button + Notifications + Framed User Profile */}
          <div className="flex items-center gap-2">
            {/* Compact Search Icon Button */}
            <button
              type="button"
              onClick={() => {
                setIsCommandModalOpen(true);
                setIsNotifOpen(false);
                setIsProfileOpen(false);
              }}
              className="flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-transparent text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
              aria-label="Search commands, links, analytics, and docs"
              title="Search (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Bell Button + Dropdown Inbox */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsNotifOpen((prev) => !prev);
                  setIsProfileOpen(false);
                }}
                className="relative flex h-7.5 w-7.5 items-center justify-center rounded-lg bg-transparent text-zinc-500 hover:text-zinc-900 dark:text-neutral-400 dark:hover:text-white transition-colors cursor-pointer"
                aria-label="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute right-1 top-1 flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F79009] opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F79009]" />
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div
                  onMouseLeave={() => setIsNotifOpen(false)}
                  className="absolute right-0 mt-2 w-80 sm:w-96 rounded-[12px] ds-card p-3 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  <div className="flex items-center justify-between pb-2.5 mb-2 border-b ds-border">
                    <span className="text-sm font-semibold ds-text-primary flex items-center gap-1.5">
                      Notifications
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-[#465FFF]/15 text-[#465FFF] dark:text-[#7592FF]">
                          {unreadCount}
                        </span>
                      )}
                    </span>
                    {unreadCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="text-xs font-medium text-[#465FFF] dark:text-[#7592FF] hover:underline cursor-pointer"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>

                  {mergedNotifications.length === 0 ? (
                    <div className="py-6 text-center text-xs ds-text-muted">
                      No notifications yet. Set a Monthly Target on your dashboard to receive goal alerts.
                    </div>
                  ) : (
                    <div className="max-h-72 overflow-y-auto flex flex-col gap-1.5">
                      {mergedNotifications.slice(0, 8).map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationRead(notif.id)}
                          className={`rounded-[10px] p-3 text-left transition-all cursor-pointer ${
                            notif.isRead
                              ? "bg-transparent hover:bg-[#F2F4F7] dark:hover:bg-white/[0.04]"
                              : "bg-[#ECF3FF]/70 dark:bg-[#465FFF]/15 border border-[#465FFF]/20"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-xs font-semibold ds-text-primary flex items-center gap-1.5">
                              {!notif.isRead && (
                                <span className="h-1.5 w-1.5 rounded-full bg-[#465FFF] shrink-0" />
                              )}
                              {notif.title}
                            </span>
                            <span className="text-[10.5px] ds-text-muted shrink-0">
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
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Framed User Profile Trigger */}
            <div className="relative">
              <button
                type="button"
                onClick={() => {
                  setIsProfileOpen((prev) => !prev);
                  setIsNotifOpen(false);
                }}
                className="ds-profile-frame cursor-pointer"
              >
                <Avatar className="h-6.5 w-6.5 sm:h-7 sm:w-7 rounded-lg border border-[#E4E7EC]/60 dark:border-white/10 overflow-hidden shrink-0">
                  <AvatarImage
                    src={avatarUrl}
                    alt={displayName}
                    seed={displayEmail}
                    className="rounded-lg object-cover"
                  />
                  <AvatarFallback seed={displayEmail} className="rounded-lg text-[10px]">
                    {displayName.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="hidden sm:flex flex-col items-start text-left leading-tight pr-0.5">
                  <span className="text-[11px] font-semibold ds-text-primary truncate max-w-[140px]" title={displayName}>
                    {displayName}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-medium text-[#465FFF] dark:text-[#7592FF] mt-0.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] shrink-0" />
                    {planDef.name} Plan
                  </span>
                </div>

                <ChevronDown
                  className={`hidden sm:block h-3.5 w-3.5 ds-text-muted transition-transform duration-200 ${
                    isProfileOpen ? "rotate-180 text-[#465FFF]" : ""
                  }`}
                />
              </button>

              {isProfileOpen && (
                <div
                  onMouseLeave={() => setIsProfileOpen(false)}
                  className="absolute right-0 mt-2 w-64 rounded-[12px] ds-card p-2 shadow-xl z-50"
                >
                  <div className="px-3 py-2.5 border-b ds-border flex items-center gap-3">
                    <Avatar className="h-9 w-9 rounded-[10px] border ds-border shrink-0">
                      <AvatarImage src={avatarUrl} alt={displayName} seed={displayEmail} className="rounded-[10px]" />
                      <AvatarFallback seed={displayEmail} className="rounded-[10px]">
                        {displayName.slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-bold ds-text-primary truncate">
                          {displayName}
                        </p>
                      </div>
                      <p className="text-xs ds-text-muted truncate mt-0.5">
                        {displayEmail}
                      </p>
                    </div>
                  </div>
                  <div className="py-1">
                    <Link
                      href="/dashboard/settings?tab=profile"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm ds-text-secondary hover:bg-[#F2F4F7] dark:hover:bg-white/[0.05]"
                    >
                      <UserIcon className="h-4 w-4 ds-text-muted" />
                      Edit Profile
                    </Link>
                    <Link
                      href="/dashboard/settings?tab=billing"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm ds-text-secondary hover:bg-[#F2F4F7] dark:hover:bg-white/[0.05]"
                    >
                      <CreditCard className="h-4 w-4 ds-text-muted" />
                      Billing & Plan ({planDef.name})
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setIsProfileOpen(false)}
                      className="flex items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm ds-text-secondary hover:bg-[#F2F4F7] dark:hover:bg-white/[0.05]"
                    >
                      <Settings className="h-4 w-4 ds-text-muted" />
                      Account Settings
                    </Link>
                    <button
                      type="button"
                      onClick={toggleTheme}
                      className="flex w-full items-center justify-between rounded-[8px] px-3 py-2 text-sm ds-text-secondary hover:bg-[#F2F4F7] dark:hover:bg-white/[0.05] cursor-pointer"
                    >
                      <span className="flex items-center gap-2.5">
                        {theme === "dark" ? (
                          <Sun className="h-4 w-4 text-amber-400" />
                        ) : (
                          <Moon className="h-4 w-4 ds-text-muted" />
                        )}
                        <span>Theme</span>
                      </span>
                      <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-[5px] bg-black/[0.04] dark:bg-white/[0.06] ds-text-muted capitalize">
                        {theme === "dark" ? "Dark" : "Light"}
                      </span>
                    </button>
                  </div>
                  <div className="border-t ds-border pt-1">
                    <button
                      type="button"
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex w-full items-center gap-2.5 rounded-[8px] px-3 py-2 text-sm text-[#D92D20] hover:bg-[#FEF3F2] dark:hover:bg-[#D92D20]/10 cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ─── MOBILE VIEW (< lg): Logo at left + Menu button at right ─── */}
        <div className="flex lg:hidden items-center justify-between w-full h-full">
          {/* Logo à gauche */}
          <Link
            href="/"
            className="flex items-center gap-2 select-none group"
            title="Retour à l'accueil"
          >
            <div className="flex h-6 w-6 items-center justify-center rounded-[6px] overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/logo.svg"
                alt="LShorter Logo"
                width={24}
                height={24}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            <span className="font-bold ds-text-primary text-[14px] tracking-tight">
              LShorter
            </span>
          </Link>

          {/* Bouton d'ouverture du menu mobile à droite (Sandwich / Hamburger) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-transparent text-zinc-600 hover:text-zinc-900 dark:text-neutral-300 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-neutral-800/60 active:scale-95 transition-all cursor-pointer"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ─── MOBILE MENU BACKDROP (Système identique à la landing page) ─── */}
      <DashboardMobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        onOpenCreateLink={() => setIsCreateOpen(true)}
        onOpenSearch={() => setIsCommandModalOpen(true)}
        mergedNotifications={mergedNotifications}
        unreadCount={unreadCount}
        markAllNotificationsRead={markAllNotificationsRead}
        markNotificationRead={markNotificationRead}
        displayName={displayName}
        displayEmail={displayEmail}
        avatarUrl={avatarUrl}
        planDef={planDef}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      <ReuiCommandModal
        isOpen={isCommandModalOpen}
        onClose={() => setIsCommandModalOpen(false)}
      />
      <LinkCreateModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} />
    </>
  );
}
