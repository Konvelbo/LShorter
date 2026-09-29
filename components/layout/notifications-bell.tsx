"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Bell, X, Check, Trash2 } from "lucide-react";
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

const READ_STORAGE_KEY = "lshorter_read_notifications";
const DELETED_STORAGE_KEY = "lshorter_deleted_notifications";
const SYNC_EVENT_NAME = "lshorter_notifications_sync";

function readStorageSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(key);
    if (raw) return new Set(JSON.parse(raw));
  } catch {}
  return new Set();
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
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(() =>
    readStorageSet(READ_STORAGE_KEY)
  );
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() =>
    readStorageSet(DELETED_STORAGE_KEY)
  );

  // Delete selection mode state (toggled by top trash icon)
  const [isDeleteMode, setIsDeleteMode] = useState(false);
  const [selectedForDelete, setSelectedForDelete] = useState<Set<string>>(
    new Set()
  );

  const containerRef = useRef<HTMLDivElement>(null);

  // Synchronize read/deleted sets across desktop & mobile NotificationsBell instances
  useEffect(() => {
    const handleSync = () => {
      setLocalReadIds(readStorageSet(READ_STORAGE_KEY));
      setDeletedIds(readStorageSet(DELETED_STORAGE_KEY));
    };
    window.addEventListener(SYNC_EVENT_NAME, handleSync);
    window.addEventListener("storage", handleSync);
    return () => {
      window.removeEventListener(SYNC_EVENT_NAME, handleSync);
      window.removeEventListener("storage", handleSync);
    };
  }, []);

  // Reset delete selection mode when popup closes
  useEffect(() => {
    if (!showNotifications) {
      setIsDeleteMode(false);
      setSelectedForDelete(new Set());
    }
  }, [showNotifications]);

  // Click outside to close notifications popover
  // IMPORTANT: NotificationsBell is mounted twice in Topbar (mobile + desktop).
  // We check `[data-notifications-bell-root="true"]` so the hidden instance's mousedown
  // listener NEVER closes the open popup when clicking inside the visible instance!
  useEffect(() => {
    if (!showNotifications) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (!target) return;

      // If click is inside ANY NotificationsBell button or popup, do not close
      if (target.closest?.('[data-notifications-bell-root="true"]')) {
        return;
      }

      setShowNotifications(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (isDeleteMode) {
          setIsDeleteMode(false);
          setSelectedForDelete(new Set());
        } else {
          setShowNotifications(false);
        }
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showNotifications, setShowNotifications, isDeleteMode]);

  // Default welcome notification
  const defaultNotif: NotificationItem = useMemo(
    () => ({
      _id: "welcome_default",
      title: "Welcome to LShorter",
      message: `Your infrastructure is active. Plan ${plan || "STARTER"} (${(clicksLimit ?? 10000).toLocaleString()} clicks/month included).`,
      type: "SUCCESS",
      isRead: false,
      createdAt: Date.now(),
    }),
    [plan, clicksLimit]
  );

  // Background query to Convex HTTP endpoint + process due 2-hour welcome emails
  useEffect(() => {
    if (!userId) return;
    let isSubscribed = true;

    async function fetchRemoteNotifications() {
      if (
        typeof document !== "undefined" &&
        document.visibilityState !== "visible"
      ) {
        return;
      }
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
        // Fallback gracefully
      }
    }

    fetchRemoteNotifications();
    const interval = setInterval(fetchRemoteNotifications, 120000);
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        fetchRemoteNotifications();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [userId]);

  // Display at most the 5 most recent notifications
  const notifications: NotificationItem[] = useMemo(() => {
    let list: NotificationItem[] = [];
    if (liveNotifs && liveNotifs.length > 0) {
      list = liveNotifs.map((n) => ({
        ...n,
        isRead: n.isRead || localReadIds.has(n._id),
      }));
    } else if (!deletedIds.has("welcome_default")) {
      list = [
        {
          ...defaultNotif,
          isRead: localReadIds.has(defaultNotif._id),
        },
      ];
    }
    return list
      .filter((n) => !deletedIds.has(n._id))
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 5);
  }, [liveNotifs, defaultNotif, localReadIds, deletedIds]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const hasUnread = unreadCount > 0;

  // Delete selected notifications and persist in localStorage + Convex
  const deleteSelectedNotifications = useCallback(
    async (idsToRemove: string[]) => {
      if (idsToRemove.length === 0) return;

      const idsSet = new Set(idsToRemove);

      // If deleting all visible notifications, also suppress welcome_default fallback from re-appearing
      const remainingVisible = notifications.filter((n) => !idsSet.has(n._id));
      const allIdsToStore =
        remainingVisible.length === 0
          ? [...idsToRemove, "welcome_default"]
          : idsToRemove;

      setDeletedIds((prev) => {
        const next = new Set([...Array.from(prev), ...allIdsToStore]);
        try {
          localStorage.setItem(
            DELETED_STORAGE_KEY,
            JSON.stringify(Array.from(next))
          );
        } catch {}
        return next;
      });

      setLiveNotifs((prev) =>
        prev ? prev.filter((n) => !idsSet.has(n._id)) : prev
      );
      setSelectedForDelete(new Set());
      setIsDeleteMode(false);

      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event(SYNC_EVENT_NAME));
      }

      const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
      if (convexUrl) {
        for (const notifId of idsToRemove) {
          if (notifId !== "welcome_default") {
            fetch(`${convexUrl}/api/mutation`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                path: "notifications:deleteNotification",
                args: { notificationId: notifId },
                format: "json",
              }),
            }).catch(() => {});
          }
        }
      }
    },
    [notifications]
  );

  // Handle clicking the top trash icon
  const handleHeaderTrashClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isDeleteMode) {
      setIsDeleteMode(true);
      setSelectedForDelete(new Set());
      return;
    }

    // If already in delete mode and user has selected items, delete them
    if (selectedForDelete.size > 0) {
      deleteSelectedNotifications(Array.from(selectedForDelete));
    } else {
      // Exit delete mode if nothing selected
      setIsDeleteMode(false);
      setSelectedForDelete(new Set());
    }
  };

  // Handle clicking a notification row
  const handleNotificationClick = async (
    notif: NotificationItem,
    e: React.MouseEvent
  ) => {
    e.preventDefault();
    e.stopPropagation();

    // In delete mode: clicking a notification toggles its selection for deletion (stays in popup)
    if (isDeleteMode) {
      setSelectedForDelete((prev) => {
        const next = new Set(prev);
        if (next.has(notif._id)) {
          next.delete(notif._id);
        } else {
          next.add(notif._id);
        }
        return next;
      });
      return;
    }

    // Normal mode: clicking a notification marks it as read (stays in popup)
    setLocalReadIds((prev) => {
      const next = new Set([...Array.from(prev), notif._id]);
      try {
        localStorage.setItem(
          READ_STORAGE_KEY,
          JSON.stringify(Array.from(next))
        );
      } catch {}
      return next;
    });

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(SYNC_EVENT_NAME));
    }

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
  };

  return (
    <div
      ref={containerRef}
      data-notifications-bell-root="true"
      className="relative inline-flex items-center"
    >
      {isMobile ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
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
          onClick={(e) => {
            e.stopPropagation();
            setShowNotifications((prev) => !prev);
            setShowUserMenu(false);
          }}
          className="w-9 h-9 rounded-[10px] bg-[#141416] border border-[#27272a] hover:border-neutral-500 text-neutral-400 hover:text-white flex items-center justify-center transition-colors relative cursor-pointer shadow-xs"
        >
          <Bell className="w-4 h-4" />
          {hasUnread && (
            <span className="absolute top-2 right-2 w-2 h-2 bg-brand rounded-full ring-2 ring-[#141416]" />
          )}
        </button>
      )}

      {/* Notifications Popover Dropdown - Styled with globals.css theme tokens (#141416 / #18181b / #222225 / text-neutral-*) */}
      {showNotifications && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
          className={cn(
            "absolute right-0 top-full mt-2.5 w-80 sm:w-88 max-w-[calc(100vw-24px)] rounded-[14px] bg-[#141416] border border-[#27272a] shadow-2xl p-3.5 z-50 text-white animate-in fade-in slide-in-from-top-1 duration-150",
            isMobile ? "md:hidden" : "hidden md:block"
          )}
        >
          {/* Header: Title + Trash Icon + Close Icon (No 'Tout marquer lu' or 'Effacer tout' texts) */}
          <div className="flex items-center justify-between pb-2.5 border-b border-[#222225]">
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-200">
                Notifications
              </h3>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-[#18181b] border border-[#27272a] text-neutral-200 text-[10px] font-bold leading-none">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleHeaderTrashClick}
                  className={cn(
                    "h-6 px-2 rounded-[8px] flex items-center justify-center gap-1.5 cursor-pointer transition-colors border",
                    isDeleteMode
                      ? selectedForDelete.size > 0
                        ? "bg-[#27272a] border-[#3f3f46] text-white"
                        : "bg-[#18181b] border-[#27272a] text-neutral-200"
                      : "border-transparent text-neutral-400 hover:text-white hover:bg-white/10"
                  )}
                  title={
                    isDeleteMode
                      ? selectedForDelete.size > 0
                        ? `Confirmer la suppression (${selectedForDelete.size})`
                        : "Quitter le mode sélection"
                      : "Choisir les notifications à supprimer"
                  }
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {isDeleteMode && selectedForDelete.size > 0 && (
                    <span className="text-[10px] font-bold leading-none">
                      {selectedForDelete.size}
                    </span>
                  )}
                </button>
              )}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications(false);
                }}
                className="w-6 h-6 rounded-[8px] text-neutral-400 hover:text-white hover:bg-white/10 flex items-center justify-center cursor-pointer transition-colors"
                title="Fermer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Selection Mode Action Bar */}
          {isDeleteMode && notifications.length > 0 && (
            <div className="flex items-center justify-between pt-2.5 pb-1 text-[11px] text-neutral-400">
              <span>Cliquez sur les notifications à supprimer</span>
              {selectedForDelete.size > 0 && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    deleteSelectedNotifications(Array.from(selectedForDelete));
                  }}
                  className="px-2 py-0.5 rounded-[6px] bg-[#27272a] border border-[#3f3f46] text-neutral-100 hover:bg-white/10 font-semibold cursor-pointer transition-colors"
                >
                  Supprimer ({selectedForDelete.size})
                </button>
              )}
            </div>
          )}

          {/* Notifications List (Max 5 most recent) */}
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-7 text-center">
              <div className="w-8 h-8 rounded-full bg-[#18181b] border border-[#222225] flex items-center justify-center mb-1.5 text-neutral-400">
                <Bell className="w-4 h-4 opacity-60" />
              </div>
              <p className="text-xs font-semibold text-neutral-200">
                Aucune notification
              </p>
              <p className="text-[11px] text-neutral-500 mt-0.5">
                Vous êtes parfaitement à jour.
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mt-2.5">
              {notifications.map((n) => {
                const isSelected = selectedForDelete.has(n._id);

                return (
                  <div
                    key={n._id}
                    onClick={(e) => handleNotificationClick(n, e)}
                    className={cn(
                      "group p-2.5 rounded-[10px] transition-all cursor-pointer border text-left select-none",
                      isDeleteMode
                        ? isSelected
                          ? "bg-[#1f1f23] border-[#3f3f46]"
                          : "bg-[#141416] border-[#222225] hover:bg-white/5 opacity-80 hover:opacity-100"
                        : !n.isRead
                          ? "bg-[#18181b] border-[#27272a] hover:bg-white/10"
                          : "bg-[#141416] border-[#222225] hover:bg-white/5 opacity-75"
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {isDeleteMode && (
                        <div
                          className={cn(
                            "mt-0.5 w-4 h-4 rounded-[4px] border flex items-center justify-center shrink-0 transition-colors",
                            isSelected
                              ? "bg-[var(--foreground)] border-[var(--foreground)] text-[var(--card)]"
                              : "border-[#3f3f46] bg-[#141416]"
                          )}
                        >
                          {isSelected && (
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          )}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={cn(
                              "text-xs truncate",
                              !n.isRead
                                ? "font-bold text-neutral-100"
                                : "font-medium text-neutral-400"
                            )}
                          >
                            {n.title}
                          </h4>
                          {!isDeleteMode && !n.isRead && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[var(--foreground)] shrink-0" />
                          )}
                        </div>
                        <p
                          className={cn(
                            "text-[11px] mt-0.5 leading-snug line-clamp-2",
                            !n.isRead ? "text-neutral-300" : "text-neutral-500"
                          )}
                        >
                          {n.message}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
