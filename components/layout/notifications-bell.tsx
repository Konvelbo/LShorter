"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info as InfoIcon,
  X,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationsBellProps {
  userId: string;
  plan: string;
  clicksLimit: number;
  isMobile?: boolean;
  showNotifications: boolean;
  setShowNotifications: (v: boolean | ((prev: boolean) => boolean)) => void;
  setShowUserMenu: (v: boolean) => void;
}

interface NotificationItem {
  _id: string;
  title: string;
  message: string;
  type: "INFO" | "WARNING" | "ALERT" | "SUCCESS";
  isRead: boolean;
  linkUrl?: string;
  createdAt: number;
}

export function NotificationsBell({
  userId,
  plan,
  clicksLimit,
  isMobile,
  showNotifications,
  setShowNotifications,
  setShowUserMenu,
}: NotificationsBellProps) {
  const [liveNotifs, setLiveNotifs] = useState<NotificationItem[] | null>(null);
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Click outside to close notifications popover (uses composedPath to avoid closing when elements unmount)
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      const path = event.composedPath ? event.composedPath() : [];
      const isInside =
        containerRef.current &&
        (containerRef.current.contains(target) ||
          path.includes(containerRef.current));

      if (!isInside) {
        setShowNotifications(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowNotifications(false);
      }
    }

    if (showNotifications) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotifications, setShowNotifications]);

  // Default welcome notification in English
  const defaultNotif: NotificationItem = useMemo(() => ({
    _id: "welcome_default",
    title: "Welcome to LShorter Edge 🚀",
    message: `Your Anycast Cloudflare infrastructure is active. Plan ${plan || "STARTER"} (${(clicksLimit ?? 10000).toLocaleString()} clicks/month included).`,
    type: "SUCCESS",
    isRead: false,
    createdAt: Date.now(),
  }), [plan, clicksLimit]);

  // Safe background query to Convex HTTP endpoint (avoids useQuery render crash if not deployed)
  useEffect(() => {
    if (!userId) return;
    let isSubscribed = true;

    async function fetchRemoteNotifications() {
      try {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (!convexUrl) return;

        const response = await fetch(`${convexUrl}/api/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "notifications:listNotifications",
            args: { orgId: userId },
            format: "json",
          }),
        });

        if (response.ok) {
          const result = await response.json();
          if (isSubscribed && result?.value && Array.isArray(result.value)) {
            setLiveNotifs(result.value);
          }
        }
      } catch {
        // Fallback gracefully without throwing in React
      }
    }

    fetchRemoteNotifications();
    const interval = setInterval(fetchRemoteNotifications, 20000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [userId]);

  const notifications: NotificationItem[] = useMemo(() => {
    if (liveNotifs && liveNotifs.length > 0) {
      return liveNotifs.map((n) => ({
        ...n,
        isRead: n.isRead || localReadIds.has(n._id),
      }));
    }
    return [{
      ...defaultNotif,
      isRead: localReadIds.has(defaultNotif._id),
    }];
  }, [liveNotifs, defaultNotif, localReadIds]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  const handleMarkAllAsRead = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const allIds = new Set(notifications.map((n) => n._id));
    setLocalReadIds((prev) => new Set([...Array.from(prev), ...Array.from(allIds)]));

    try {
      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (convexUrl && userId) {
        await fetch(`${convexUrl}/api/mutation`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            path: "notifications:markAllAsRead",
            args: { orgId: userId },
            format: "json",
          }),
        });
      }
    } catch {}
  };

  const handleNotificationClick = async (notif: NotificationItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setLocalReadIds((prev) => new Set([...Array.from(prev), notif._id]));

    if (notif._id !== "welcome_default") {
      try {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (convexUrl) {
          await fetch(`${convexUrl}/api/mutation`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              path: "notifications:markAsRead",
              args: { notificationId: notif._id },
              format: "json",
            }),
          });
        }
      } catch {}
    }

    if (notif.linkUrl) {
      setShowNotifications(false);
      window.location.href = notif.linkUrl;
    }
  };

  return (
    <div ref={containerRef} className="relative inline-flex items-center">
      {isMobile ? (
        <button
          type="button"
          onClick={() => {
            setShowNotifications((prev) => !prev);
            setShowUserMenu(false);
          }}
          className="w-8 h-8 rounded-[8px] bg-[#10141f] border border-[#1e2942] text-neutral-400 hover:text-white flex items-center justify-center relative cursor-pointer transition-colors"
        >
          <Bell className="w-3.5 h-3.5" />
          {hasUnread && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full ring-2 ring-[#10141f]" />
          )}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => {
            setShowNotifications((prev) => !prev);
            setShowUserMenu(false);
          }}
          className="w-9 h-9 rounded-[10px] bg-white dark:bg-[#141416] border border-neutral-300 dark:border-[#27272a] hover:border-neutral-400 dark:hover:border-neutral-500 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center justify-center transition-colors relative cursor-pointer shadow-xs"
        >
          <Bell className="w-4 h-4" />
          {hasUnread && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full ring-2 ring-white dark:ring-[#141416]" />
          )}
        </button>
      )}

      {/* Notifications Popover Dropdown - Anchored directly below the Bell icon */}
      {showNotifications && (
        <div className="absolute right-0 top-full mt-2.5 w-80 sm:w-88 max-w-[calc(100vw-24px)] rounded-[14px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#27272a] shadow-2xl p-3.5 z-50 text-neutral-900 dark:text-white animate-in fade-in slide-in-from-top-1 duration-150">
          <div className="flex items-center justify-between pb-2.5 border-b border-neutral-200 dark:border-[#222225]">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-brand text-white text-[10px] font-bold leading-none">
                  {unreadCount}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {hasUnread && (
                <button
                  type="button"
                  onClick={handleMarkAllAsRead}
                  className="text-[10px] text-brand font-semibold cursor-pointer hover:underline flex items-center gap-1"
                >
                  <Check className="w-3 h-3" />
                  <span>Tout marquer lu</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowNotifications(false)}
                className="w-5 h-5 rounded-md text-neutral-400 hover:text-neutral-700 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                title="Fermer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2.5 max-h-80 overflow-y-auto pr-0.5">
            {notifications.map((n) => {
              const Icon =
                n.type === "ALERT" || n.type === "WARNING"
                  ? AlertTriangle
                  : n.type === "SUCCESS"
                    ? CheckCircle2
                    : InfoIcon;
              const iconColor =
                n.type === "ALERT"
                  ? "text-red-500 dark:text-red-400"
                  : n.type === "WARNING"
                    ? "text-amber-500 dark:text-amber-400"
                    : n.type === "SUCCESS"
                      ? "text-emerald-500 dark:text-emerald-400"
                      : "text-brand";

              return (
                <div
                  key={n._id}
                  onClick={(e) => handleNotificationClick(n, e)}
                  className={cn(
                    "p-2.5 rounded-[10px] transition-all cursor-pointer border text-left",
                    !n.isRead
                      ? "bg-brand/5 dark:bg-[#1a1a1e] border-brand/30 shadow-xs"
                      : "bg-neutral-50 dark:bg-[#101012] border-transparent hover:border-neutral-200 dark:hover:border-[#27272a] hover:bg-neutral-100 dark:hover:bg-[#16161a]"
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    <div className="mt-0.5 shrink-0">
                      <Icon className={cn("w-4 h-4", iconColor)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                          {n.title}
                        </h4>
                        {!n.isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-brand shrink-0" />
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-600 dark:text-neutral-400 mt-0.5 leading-snug">
                        {n.message}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
