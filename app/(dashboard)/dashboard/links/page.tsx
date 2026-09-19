"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  Plus,
  Copy,
  ExternalLink,
  Share2,
  Trash2,
  Check,
  Globe2,
  Smartphone,
  Lock,
  EyeOff,
  Filter,
  QrCode,
  Edit3,
  RefreshCw,
  ChevronDown,
  Tag,
  MoreVertical,
  BarChart2,
  ImageIcon,
  GitFork,
  Split,
  Clock,
  Zap,
  ShieldCheck,
  RotateCcw,
  GripVertical,
  X,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  cfGetLinks,
  cfDeleteLink,
  cfInvalidateCache,
} from "@/lib/cloudflare-api";
import { ShortLink } from "@/types";
import { cn, formatNumber } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LinksPageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { showToast } from "@/components/ui/toast-provider";
import { LinkCreateModal } from "@/components/dashboard/link-create-modal";
import { LinkEditModal } from "@/components/dashboard/link-edit-modal";
import { LinkShareModal } from "@/components/dashboard/link-share-modal";
import { LinkQRModal } from "@/components/dashboard/link-qr-modal";
import { DeleteConfirmModal } from "@/components/dashboard/delete-confirm-modal";
import confetti from "canvas-confetti";

export default function LinksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagDropdownRef = useRef<HTMLDivElement>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedEditLink, setSelectedEditLink] = useState<ShortLink | null>(
    null,
  );
  const [selectedShareLink, setSelectedShareLink] = useState<ShortLink | null>(
    null,
  );
  const [selectedQRLink, setSelectedQRLink] = useState<ShortLink | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Portal Floating Action Menu State
  const [mounted, setMounted] = useState(false);
  const [activeMenuLink, setActiveMenuLink] = useState<ShortLink | null>(null);
  const [menuPosition, setMenuPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

  // 10-Second Undo Toast State & Timer Refs
  const [undoToast, setUndoToast] = useState<{
    link: ShortLink;
    index: number;
    remaining: number;
  } | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const undoIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Drag & Drop Reordering State
  const [draggedLinkId, setDraggedLinkId] = useState<string | null>(null);
  const [dragOverLinkId, setDragOverLinkId] = useState<string | null>(null);
  const [dragPosition, setDragPosition] = useState<"top" | "bottom" | null>(null);

  // Swipe-to-Delete Pointer Refs
  const activeSwipeIdRef = useRef<string | null>(null);
  const swipeStartXRef = useRef<number>(0);
  const swipeCurrentXRef = useRef<number>(0);
  const isSwipingRef = useRef<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Cleanup undo timer on unmount
  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
    };
  }, []);

  // Checkbox Selection & Bulk Actions
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(
    new Set(),
  );

  // Custom Delete Modal State
  const [deleteTarget, setDeleteTarget] = useState<{
    isOpen: boolean;
    ids: string[];
    labels: string[];
  }>({
    isOpen: false,
    ids: [],
    labels: [],
  });
  const [isDeleting, setIsDeleting] = useState(false);

  const userId = session?.user?.id;

  const loadLinks = async (isBackground = false) => {
    if (!userId) return;
    if (!isBackground) setIsLoading(true);
    try {
      const res = await cfGetLinks(userId);
      const listData = Array.isArray(res?.data)
        ? res.data
        : Array.isArray((res?.data as any)?.data)
          ? (res?.data as any).data
          : [];
      const rawLinks: ShortLink[] = listData.map((l: any) => ({
        id: l.id,
        userId: l.user_id || userId,
        slug: l.slug,
        domainName: l.domain_name || "lsho.cc",
        shortUrl:
          typeof window !== "undefined"
            ? `${window.location.origin}/r/${l.slug}`
            : `http://localhost:3000/r/${l.slug}`,
        targetUrl: l.target_url || l.targetUrl,
        clicksCount: l.clicks_count || l.clicksCount || l.clicks || 0,
        uniqueClicks: l.unique_clicks || l.uniqueClicks || 0,
        conversionsCount: l.conversions_count || l.conversionsCount || 0,
        revenue: l.revenue || 0,
        routingRules: l.routing_rules
          ? typeof l.routing_rules === "string"
            ? JSON.parse(l.routing_rules)
            : l.routing_rules
          : typeof l.routingRules === "string"
            ? JSON.parse(l.routingRules)
            : l.routingRules || [],
        geoTargeting: l.geo_targeting
          ? typeof l.geo_targeting === "string"
            ? JSON.parse(l.geo_targeting)
            : l.geo_targeting
          : typeof l.geoTargeting === "string"
            ? JSON.parse(l.geoTargeting)
            : l.geoTargeting || {},
        deviceTargeting: l.device_targeting
          ? typeof l.device_targeting === "string"
            ? JSON.parse(l.device_targeting)
            : l.device_targeting
          : typeof l.deviceTargeting === "string"
            ? JSON.parse(l.deviceTargeting)
            : l.deviceTargeting || {},
        isPasswordProtected: Boolean(
          l.is_password_protected ||
          l.isPasswordProtected ||
          l.has_password ||
          l.hasPassword ||
          l.password ||
          l.password_plain,
        ),
        password: l.password || l.password_plain || "",
        maxClicks:
          l.max_clicks !== undefined && l.max_clicks !== null
            ? Number(l.max_clicks)
            : l.maxClicks !== undefined && l.maxClicks !== null
              ? Number(l.maxClicks)
              : undefined,
        fallbackUrl: l.fallback_url || l.fallbackUrl || "",
        isCloaked: Boolean(l.is_cloaked || l.isCloaked),
        metaTitle: l.meta_title || l.metaTitle || l.og_title || l.ogTitle,
        ogTitle: l.og_title || l.ogTitle || l.meta_title || l.metaTitle,
        ogDescription: l.og_description || l.ogDescription,
        ogImage: l.og_image || l.ogImage,
        twitterCard: "summary_large_image",
        hideReferrer: Boolean(l.hide_referrer || l.hideReferrer),
        tags: l.tags
          ? typeof l.tags === "string"
            ? JSON.parse(l.tags)
            : l.tags
          : [],
        expiresAt: l.expires_at || l.expiresAt,
        abVariations: l.ab_variations
          ? typeof l.ab_variations === "string"
            ? JSON.parse(l.ab_variations)
            : l.ab_variations
          : typeof l.abVariations === "string"
            ? JSON.parse(l.abVariations)
            : l.abVariations || [],
        mainWeight:
          l.main_weight !== undefined
            ? Number(l.main_weight)
            : l.mainWeight !== undefined
              ? Number(l.mainWeight)
              : undefined,
        redirectType: l.redirect_type || l.redirectType,
        passParams:
          l.pass_params !== undefined
            ? Boolean(l.pass_params)
            : l.passParams !== undefined
              ? Boolean(l.passParams)
              : undefined,
        isActive: !(
          l.is_active === 0 ||
          l.is_active === false ||
          l.is_active === "0" ||
          l.isActive === 0 ||
          l.isActive === false ||
          l.isActive === "0"
        ),
        userEmail: l.user_email || l.userEmail || l.email,
        userName:
          l.user_name ||
          l.userName ||
          l.user_full_name ||
          l.userFullName ||
          l.fullName,
        userFullName:
          l.user_full_name ||
          l.userFullName ||
          l.user_name ||
          l.userName ||
          l.fullName,
        email: l.user_email || l.userEmail || l.email,
        fullName:
          l.user_full_name ||
          l.userFullName ||
          l.user_name ||
          l.userName ||
          l.fullName,
        created_at: l.created_at || l.createdAt || new Date().toISOString(),
      }));
      setLinks(rawLinks);
    } catch (err) {
      console.error("Error loading links:", err);
      if (!isBackground) setLinks([]);
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && userId) {
      loadLinks();
    }
  }, [status, userId]);

  // Listen for global link creation/update events (from sidebar, overview, etc.) & browser focus
  useEffect(() => {
    const handleUpdate = (e?: any) => {
      cfInvalidateCache();
      if (e?.detail?.id) {
        setLinks((prev) => [
          e.detail,
          ...prev.filter((l) => l.id !== e.detail.id),
        ]);
      }
      loadLinks(true);
    };

    window.addEventListener("lshorter_links_updated", handleUpdate);
    window.addEventListener("lshorter_data_change", handleUpdate);

    return () => {
      window.removeEventListener("lshorter_links_updated", handleUpdate);
      window.removeEventListener("lshorter_data_change", handleUpdate);
    };
  }, [userId]);

  // Click outside listener for tag dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        tagDropdownRef.current &&
        !tagDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Click outside and scroll listener for portal action dropdown menu
  useEffect(() => {
    if (!activeMenuLink) return;
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.closest(".portal-action-menu") ||
        target.closest(".dropdown-anchor-btn")
      ) {
        return;
      }
      setActiveMenuLink(null);
      setMenuPosition(null);
    };
    const handleScrollOrResize = () => {
      setActiveMenuLink(null);
      setMenuPosition(null);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
    };
  }, [activeMenuLink]);

  const handleToggleMenu = (
    e: React.MouseEvent<HTMLButtonElement>,
    link: ShortLink,
  ) => {
    e.stopPropagation();
    if (activeMenuLink?.id === link.id) {
      setActiveMenuLink(null);
      setMenuPosition(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const menuWidth = 208; // w-52 = 208px
    const menuHeight = 265; // ~265px

    const spaceBelow = window.innerHeight - rect.bottom;
    const isDropUp = spaceBelow < menuHeight && rect.top > menuHeight;

    const top = isDropUp ? rect.top - menuHeight - 6 : rect.bottom + 6;
    let right = window.innerWidth - rect.right;
    if (right < 8) right = 8;
    if (window.innerWidth - right < menuWidth) {
      right = Math.max(8, window.innerWidth - menuWidth - 8);
    }

    setActiveMenuLink(link);
    setMenuPosition({ top, right });
  };

  const handleCopy = (link: ShortLink) => {
    navigator.clipboard.writeText(link.shortUrl);
    setCopiedId(link.id);
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Toggle selection for a single link
  const toggleSelectLink = (id: string) => {
    setSelectedLinkIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Toggle select all filtered links
  const toggleSelectAll = () => {
    if (
      selectedLinkIds.size === filteredLinks.length &&
      filteredLinks.length > 0
    ) {
      setSelectedLinkIds(new Set());
    } else {
      setSelectedLinkIds(new Set(filteredLinks.map((l) => l.id)));
    }
  };

  // Mobile Long Press Selection Refs & Handlers
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef<boolean>(false);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  const startLongPress = (
    linkId: string,
    e: React.TouchEvent | React.MouseEvent,
  ) => {
    if (
      (e.target as HTMLElement).closest(
        "button, a, input, select, .dropdown-anchor",
      )
    ) {
      return;
    }

    if ("touches" in e && e.touches.length > 0) {
      touchStartPosRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
    } else if ("clientX" in e) {
      touchStartPosRef.current = { x: e.clientX, y: e.clientY };
    }

    isLongPressActiveRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);

    longPressTimerRef.current = setTimeout(() => {
      isLongPressActiveRef.current = true;
      toggleSelectLink(linkId);
      if (
        typeof window !== "undefined" &&
        window.navigator &&
        window.navigator.vibrate
      ) {
        try {
          window.navigator.vibrate(45);
        } catch (_) {}
      }
    }, 450);
  };

  const cancelLongPress = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartPosRef.current || !e.touches[0]) return;
    const dx = Math.abs(e.touches[0].clientX - touchStartPosRef.current.x);
    const dy = Math.abs(e.touches[0].clientY - touchStartPosRef.current.y);
    if (dx > 8 || dy > 8) {
      cancelLongPress();
    }
  };

  const handleMobileCardClick = (linkId: string, e: React.MouseEvent) => {
    if (isLongPressActiveRef.current) {
      isLongPressActiveRef.current = false;
      return;
    }
    if (
      (e.target as HTMLElement).closest(
        "button, a, input, select, .dropdown-anchor",
      )
    ) {
      return;
    }
    // If selection mode is active, tapping anywhere on card toggles selection
    if (selectedLinkIds.size > 0) {
      toggleSelectLink(linkId);
    }
  };

  // Trigger custom delete modal for 1 link
  const promptDeleteSingle = (link: ShortLink) => {
    setDeleteTarget({
      isOpen: true,
      ids: [link.id],
      labels: [link.slug],
    });
  };

  // Trigger custom delete modal for bulk selection
  const promptDeleteBulk = () => {
    if (selectedLinkIds.size === 0) return;
    const selected = links.filter((l) => selectedLinkIds.has(l.id));
    setDeleteTarget({
      isOpen: true,
      ids: Array.from(selectedLinkIds),
      labels: selected.map((l) => l.slug),
    });
  };

  // Execute deletion with optimistic UI update and background refresh
  const confirmDelete = async () => {
    if (!deleteTarget.ids.length || !userId) return;
    setIsDeleting(true);
    const idsToDelete = [...deleteTarget.ids];

    // 1. Optimistic removal: remove immediately from UI
    setLinks((prev) =>
      prev.filter(
        (l) => !idsToDelete.includes(l.id) && !idsToDelete.includes(l.slug),
      ),
    );
    setSelectedLinkIds((prev) => {
      const next = new Set(prev);
      idsToDelete.forEach((id) => next.delete(id));
      return next;
    });

    try {
      // 2. Perform API delete calls in parallel (including associated Bunny CDN image cleanup)
      await Promise.all(
        idsToDelete.map((id) => {
          const target = links.find((l) => l.id === id || l.slug === id);
          return cfDeleteLink(id, userId, target?.slug, target?.ogImage);
        }),
      );
      cfInvalidateCache();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lshorter_data_change"));
      }
      showToast.success(
        idsToDelete.length > 1
          ? `${idsToDelete.length} links deleted successfully.`
          : "Link deleted successfully.",
      );
      setDeleteTarget({ isOpen: false, ids: [], labels: [] });
      // 3. Background re-sync
      await loadLinks(true);
    } catch (err) {
      console.error("Delete error:", err);
      showToast.error("Error during deletion.");
      await loadLinks();
    } finally {
      setIsDeleting(false);
    }
  };

  // --- 10-Second Undo Delete Flow ---
  const start10SecondUndoDelete = (link: ShortLink) => {
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);

    const index = links.findIndex((l) => l.id === link.id);
    if (index === -1) return;

    // 1. Optimistic removal
    setLinks((prev) => prev.filter((l) => l.id !== link.id));
    setSelectedLinkIds((prev) => {
      const next = new Set(prev);
      next.delete(link.id);
      return next;
    });

    // 2. Open top-center undo toast with 10s counter
    setUndoToast({ link, index, remaining: 10 });

    // 3. 1-second countdown decrement
    undoIntervalRef.current = setInterval(() => {
      setUndoToast((prev) => {
        if (!prev) return null;
        if (prev.remaining <= 1) {
          if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
          return null;
        }
        return { ...prev, remaining: prev.remaining - 1 };
      });
    }, 1000);

    // 4. Background deletion on 10s expiry
    undoTimeoutRef.current = setTimeout(async () => {
      setUndoToast(null);
      if (undoIntervalRef.current) clearInterval(undoIntervalRef.current);
      try {
        await cfDeleteLink(link.id, userId, link.slug, link.ogImage);
        cfInvalidateCache();
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("lshorter_data_change"));
        }
      } catch (err) {
        console.error("Cloudflare delete error:", err);
      }
    }, 10000);
  };

  const cancelUndoDelete = () => {
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
      undoTimeoutRef.current = null;
    }
    if (undoIntervalRef.current) {
      clearInterval(undoIntervalRef.current);
      undoIntervalRef.current = null;
    }

    if (undoToast) {
      const { link, index } = undoToast;
      setLinks((prev) => {
        const next = [...prev];
        next.splice(Math.min(index, next.length), 0, link);
        return next;
      });
      setUndoToast(null);
      showToast.success(`Link /${link.slug} restored successfully.`);
    }
  };

  // --- Drag & Drop Reordering Handlers ---
  const handleReorderDragStart = (e: React.DragEvent, linkId: string) => {
    setActiveMenuLink(null);
    setDraggedLinkId(linkId);
    e.dataTransfer.setData("text/plain", linkId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleReorderDragEnd = () => {
    setDraggedLinkId(null);
    setDragOverLinkId(null);
    setDragPosition(null);
  };

  const handleCardDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (targetId === draggedLinkId) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const pos = e.clientY < midY ? "top" : "bottom";

    setDragOverLinkId(targetId);
    setDragPosition(pos);
  };

  const handleCardDragLeave = (e: React.DragEvent, targetId: string) => {
    if (dragOverLinkId === targetId) {
      setDragOverLinkId(null);
      setDragPosition(null);
    }
  };

  const handleCardDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggedLinkId;
    if (!sourceId || sourceId === targetId) {
      handleReorderDragEnd();
      return;
    }

    setLinks((prev) => {
      const sourceIdx = prev.findIndex((l) => l.id === sourceId);
      const targetIdx = prev.findIndex((l) => l.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const next = [...prev];
      const [moved] = next.splice(sourceIdx, 1);
      let insertIdx = next.findIndex((l) => l.id === targetId);
      if (dragPosition === "bottom") insertIdx += 1;
      next.splice(insertIdx, 0, moved);
      return next;
    });

    handleReorderDragEnd();
  };

  // --- Swipe-to-Delete Pointer & Touch Handlers ---
  const handleCardPointerDown = (linkId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button, a, input, select, .drag-handle, .dropdown-anchor-btn")) {
      return;
    }
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
    activeSwipeIdRef.current = linkId;
    swipeStartXRef.current = e.clientX;
    swipeCurrentXRef.current = e.clientX;
    isSwipingRef.current = true;

    const card = document.getElementById(`link-card-${linkId}`);
    if (card) {
      card.classList.remove("link-smooth-snap");
    }
  };

  const handleCardPointerMove = (linkId: string, e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSwipingRef.current || activeSwipeIdRef.current !== linkId) return;

    swipeCurrentXRef.current = e.clientX;
    const deltaX = swipeCurrentXRef.current - swipeStartXRef.current;

    // Only allow swipe left (negative deltaX)
    if (deltaX < 0) {
      const card = document.getElementById(`link-card-${linkId}`);
      const swipeBg = document.getElementById(`link-swipe-bg-${linkId}`);
      const progress = Math.min(Math.abs(deltaX) / 120, 1);
      const opacity = Math.max(1 - progress * 0.75, 0.2);

      if (card) {
        card.style.transform = `translateX(${deltaX}px)`;
        card.style.opacity = opacity.toFixed(3);
      }
      if (swipeBg) {
        swipeBg.style.opacity = Math.min(0.2 + progress * 0.8, 1).toFixed(3);
      }
    }
  };

  const handleCardPointerUp = (link: ShortLink, e: React.PointerEvent<HTMLDivElement>) => {
    if (!isSwipingRef.current || activeSwipeIdRef.current !== link.id) return;
    isSwipingRef.current = false;

    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}

    const deltaX = swipeCurrentXRef.current - swipeStartXRef.current;
    const card = document.getElementById(`link-card-${link.id}`);
    const wrapper = document.getElementById(`link-wrapper-${link.id}`);

    if (card) {
      card.classList.add("link-smooth-snap");
    }

    if (deltaX < -80) {
      if (card) {
        card.style.transform = "translateX(-110%)";
        card.style.opacity = "0";
      }
      if (wrapper) wrapper.classList.add("link-card-exit");
      setTimeout(() => {
        start10SecondUndoDelete(link);
      }, 300);
    } else {
      if (card) {
        card.style.transform = "translateX(0px)";
        card.style.opacity = "1";
      }
      const swipeBg = document.getElementById(`link-swipe-bg-${link.id}`);
      if (swipeBg) swipeBg.style.opacity = "0";
    }

    activeSwipeIdRef.current = null;
  };

  // Collect all unique tags
  const allTags = Array.from(new Set(links.flatMap((l) => l.tags || [])));

  // Filter links by search, selected tag, and status
  const filteredLinks = links.filter((l) => {
    const matchesSearch =
      l.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.tags &&
        l.tags.some((t) =>
          t.toLowerCase().includes(searchQuery.toLowerCase()),
        ));

    const matchesTag =
      selectedTag === "all" || (l.tags && l.tags.includes(selectedTag));

    const isExpired = Boolean(
      l.expiresAt && new Date(l.expiresAt) < new Date(),
    );
    let matchesStatus = true;
    if (statusFilter === "active") matchesStatus = l.isActive && !isExpired;
    else if (statusFilter === "expired") matchesStatus = isExpired;
    else if (statusFilter === "protected")
      matchesStatus = Boolean(l.isPasswordProtected);

    return matchesSearch && matchesTag && matchesStatus;
  });

  const isAllSelected =
    filteredLinks.length > 0 && selectedLinkIds.size === filteredLinks.length;
  const isPartiallySelected = selectedLinkIds.size > 0 && !isAllSelected;

  if (status === "loading" || isLoading) {
    return <LinksPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">
            My Short Links
          </h1>
          <p className="text-xs text-neutral-400 mt-1">
            Manage, edit, and analyze your {links.length} active redirections
            with QR codes and UTM tracking.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={async () => {
              setIsRefreshing(true);
              cfInvalidateCache("/api/links");
              await loadLinks();
              setIsRefreshing(false);
              showToast.success("Links list refreshed!");
            }}
            variant="outline"
            disabled={isRefreshing}
            className="h-10 px-3.5 text-xs font-semibold gap-2 border-[#27272a] bg-[#141416] hover:bg-white/5 text-neutral-300 hover:text-white cursor-pointer shadow-sm"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[var(--brand-primary-text)]" : "text-neutral-400"}`}
            />
            <span>Refresh</span>
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            variant="glow"
            className="h-10 px-4 font-bebas text-base tracking-wide gap-1.5 shrink-0 flex items-center justify-center leading-none"
          >
            <Plus className="w-4 h-4" />
            <span>CREATE A LINK</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by slug, URL, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-[10px] bg-[#141416] border border-[#222225] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[var(--input-focus-border)]"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2">
          {/* Status Filter */}
          <div className="relative flex-1 md:flex-initial">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Filter by status"
              className="w-full md:w-auto h-10 pl-3 pr-8 rounded-[10px] bg-[#141416] border border-[#222225] text-xs font-semibold text-white focus:outline-none focus:border-[var(--input-focus-border)] cursor-pointer shadow-sm appearance-none truncate"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="expired">Expired</option>
              <option value="protected">Protected (🔒)</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Tag Filter Dropdown */}
          <div className="relative flex-1 md:flex-initial" ref={tagDropdownRef}>
            <button
              type="button"
              onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
              className="w-full md:w-auto h-10 px-3 rounded-[10px] bg-[#141416] border border-[#222225] hover:border-[#333338] text-xs font-semibold text-white flex items-center justify-between gap-2 md:min-w-[155px] transition-colors cursor-pointer shadow-sm truncate"
            >
              <div className="flex items-center gap-1.5 truncate">
                {selectedTag === "all" ? (
                  <Globe2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                ) : (
                  <Tag className="w-3.5 h-3.5 text-[var(--brand-primary-text)] shrink-0" />
                )}
                <span className="truncate">
                  {selectedTag === "all"
                    ? `All (${links.length})`
                    : `#${selectedTag}`}
                </span>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${
                  isTagDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {isTagDropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-56 rounded-[10px] bg-[#141416] border border-[#27272a] shadow-2xl py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Filter by category / tag
                </div>

                {/* Option: All links */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTag("all");
                    setIsTagDropdownOpen(false);
                  }}
                  className={`w-full px-3 py-2 text-xs flex items-center justify-between transition-colors text-left cursor-pointer ${
                    selectedTag === "all"
                      ? "bg-[var(--badge-brand-bg)] text-[var(--badge-brand-text)] font-bold"
                      : "text-neutral-300 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Globe2 className="w-3.5 h-3.5 text-[var(--brand-primary-text)]" />
                    <span>All links</span>
                  </span>
                  <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-[10px] bg-white/5 text-neutral-400">
                    {links.length}
                  </span>
                </button>

                {allTags.length > 0 && (
                  <div className="h-px bg-[#222225] my-1" />
                )}

                {/* Individual Tag Options */}
                {allTags.map((t) => {
                  const count = links.filter(
                    (l) => l.tags && l.tags.includes(t),
                  ).length;
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => {
                        setSelectedTag(t);
                        setIsTagDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-xs flex items-center justify-between transition-colors text-left cursor-pointer ${
                        selectedTag === t
                          ? "bg-[var(--badge-brand-bg)] text-[var(--badge-brand-text)] font-bold"
                          : "text-neutral-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span className="flex items-center gap-2 truncate">
                        <Tag className="w-3 h-3 text-[var(--brand-primary-text)] shrink-0" />
                        <span className="truncate">#{t}</span>
                      </span>
                      <span className="text-[11px] font-mono px-1.5 py-0.5 rounded-[10px] bg-white/5 text-neutral-400">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Links Container */}
      <div className="space-y-3 relative min-h-[220px]">
        {filteredLinks.length === 0 ? (
          <div className="py-12 px-4 rounded-2xl bg-white dark:bg-[#131418] border border-neutral-200 dark:border-neutral-800 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 mx-auto rounded-full bg-neutral-100 dark:bg-neutral-800/80 flex items-center justify-center text-neutral-400">
              <Globe2 className="w-6 h-6" />
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 font-medium">
              No links found matching your search.
            </p>
          </div>
        ) : (
          filteredLinks.map((link) => {
            const isCopied = copiedId === link.id;
            const isExpired = Boolean(
              link.expiresAt && new Date(link.expiresAt) < new Date(),
            );
            const isMenuOpen = activeMenuLink?.id === link.id;
            const isDropTop = dragOverLinkId === link.id && dragPosition === "top";
            const isDropBottom = dragOverLinkId === link.id && dragPosition === "bottom";
            const isDraggingThis = draggedLinkId === link.id;

            // Compute protocol badge label
            const protocolLabel = String(link.redirectType) === "307"
              ? "HTTP 307 Temporary"
              : String(link.redirectType) === "302"
                ? "HTTP 302 Found"
                : link.routingRules && link.routingRules.length > 0
                  ? "HTTP 301 Edge Direct"
                  : "HTTP 301 Permanent";

            // Thumbnail fallback / image
            const thumbnailImage = link.ogImage || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80";

            return (
              <div
                key={link.id}
                id={`link-wrapper-${link.id}`}
                className="relative overflow-hidden rounded-2xl w-full link-swipe-container"
              >
                {/* Swipe-to-Delete Background Reveal (Underneath the card) */}
                <div
                  id={`link-swipe-bg-${link.id}`}
                  className="absolute inset-0 bg-gradient-to-l from-rose-600 to-rose-700 dark:from-rose-700 dark:to-rose-800 text-white rounded-2xl flex items-center justify-end px-6 sm:px-8 gap-2.5 font-bold text-xs sm:text-sm tracking-wide opacity-0 transition-opacity duration-150 pointer-events-none"
                >
                  <span>Delete</span>
                  <Trash2 className="w-5 h-5 animate-pulse" />
                </div>

                {/* Sliding Card */}
                <div
                  id={`link-card-${link.id}`}
                  onPointerDown={(e) => handleCardPointerDown(link.id, e)}
                  onPointerMove={(e) => handleCardPointerMove(link.id, e)}
                  onPointerUp={(e) => handleCardPointerUp(link, e)}
                  onPointerCancel={(e) => handleCardPointerUp(link, e)}
                  className={cn(
                    "group flex items-center justify-between gap-2.5 sm:gap-4 p-3.5 sm:p-4 rounded-2xl bg-white dark:bg-[#131418] hover:bg-neutral-50 dark:hover:bg-[#181920] border border-neutral-200 dark:border-[#202228] border-r-4 border-r-rose-500 dark:border-r-rose-500 hover:border-neutral-300 dark:hover:border-[#2f333d] transition-all duration-150 shadow-sm dark:shadow-md relative w-full touch-pan-y cursor-grab active:cursor-grabbing",
                    isDraggingThis && "opacity-30 scale-[0.98]",
                    isDropTop && "link-drop-indicator-top",
                    isDropBottom && "link-drop-indicator-bottom",
                    isMenuOpen ? "z-40" : "z-10",
                  )}
                  onDragOver={(e) => handleCardDragOver(e, link.id)}
                  onDragLeave={(e) => handleCardDragLeave(e, link.id)}
                  onDrop={(e) => handleCardDrop(e, link.id)}
                >
                  {/* Left side: Grip + Thumbnail + Info */}
                  <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
                    {/* Grip Handle for Vertical Reordering (Hidden on Mobile) */}
                    <div
                      draggable="true"
                      onDragStart={(e) => handleReorderDragStart(e, link.id)}
                      onDragEnd={handleReorderDragEnd}
                      className="hidden sm:block drag-handle text-neutral-400 dark:text-neutral-500 group-hover:text-neutral-700 dark:group-hover:text-neutral-300 transition-colors p-1 cursor-grab shrink-0"
                      title="Drag to reorder"
                    >
                      <GripVertical className="w-4 h-4" />
                    </div>

                    {/* Thumbnail with Glowing Status Dot */}
                    <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-xl overflow-visible shrink-0 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-white/5">
                      <img
                        src={thumbnailImage}
                        alt={link.slug}
                        className="w-full h-full object-cover rounded-xl"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100&auto=format&fit=crop&q=80";
                        }}
                      />
                      {/* Glowing Status Dot */}
                      <span
                        className={cn(
                          "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border-2 border-white dark:border-[#131418] absolute -bottom-1 -right-1",
                          isExpired
                            ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"
                            : !link.isActive
                              ? "bg-neutral-400 dark:bg-neutral-600"
                              : "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]",
                        )}
                      />
                    </div>

                    {/* Text Information (Slug, Protocol, Target URL) */}
                    <div className="min-w-0 space-y-0.5 text-left">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-neutral-900 dark:text-white text-xs sm:text-base tracking-tight truncate group-hover:text-[var(--brand-primary-text)] transition-colors">
                          /{link.slug}
                        </h3>
                      </div>
                      <div className="text-[10px] sm:text-[11px] font-mono text-neutral-500 dark:text-neutral-400 truncate">
                        {protocolLabel}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400 truncate hover:text-neutral-700 dark:hover:text-neutral-200 transition-colors">
                        <span className="text-[var(--brand-primary-text)] font-bold">↳</span>
                        <span className="truncate">{link.targetUrl}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right side: Click Counter + Direct Analytics Button + Three Dots Button */}
                  <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                    {/* Click Counter */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(
                          `/dashboard/analytics?linkId=${encodeURIComponent(link.id)}&slug=${encodeURIComponent(link.slug)}`,
                        );
                      }}
                      className="text-right whitespace-nowrap cursor-pointer hover:opacity-80 transition-opacity"
                      title="View analytics"
                    >
                      <span className="text-sm sm:text-xl font-extrabold text-neutral-900 dark:text-white tracking-tight">
                        {formatNumber(link.clicksCount)}
                      </span>
                      <span className="text-[10px] sm:text-xs text-neutral-500 dark:text-neutral-400 font-mono ml-0.5 sm:ml-1">
                        clicks
                      </span>
                    </div>

                    {/* Action Buttons Row */}
                    <div className="flex items-center gap-1 text-neutral-400 relative">
                      {/* Direct Analytics Button on Card */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(
                            `/dashboard/analytics?linkId=${encodeURIComponent(link.id)}&slug=${encodeURIComponent(link.slug)}`,
                          );
                        }}
                        className="p-1.5 sm:p-2 rounded-lg hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                        title="View analytics"
                      >
                        <BarChart2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                      </button>

                      {/* Three Dots Button (⋮) with Portal Dropdown */}
                      <div className="relative">
                        <button
                          type="button"
                          onClick={(e) => handleToggleMenu(e, link)}
                          className={cn(
                            "dropdown-anchor-btn p-1.5 sm:p-2 rounded-lg hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer",
                            isMenuOpen && "bg-neutral-200 dark:bg-white/10 text-neutral-900 dark:text-white",
                          )}
                          title="More options"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Menu rendered in Portal (Guaranteed Top Layer z-[99999] with No Clipping) */}
      {mounted &&
        activeMenuLink &&
        menuPosition &&
        createPortal(
          <div
            style={{
              position: "fixed",
              top: `${menuPosition.top}px`,
              right: `${menuPosition.right}px`,
              zIndex: 99999,
            }}
            onClick={(e) => e.stopPropagation()}
            className="portal-action-menu w-52 rounded-2xl bg-white dark:bg-[#141518] border border-neutral-200 dark:border-[#272930] shadow-[0_15px_40px_rgba(0,0,0,0.15)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.9)] py-2 text-left font-sans text-xs text-neutral-800 dark:text-neutral-200 backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150 divide-y divide-neutral-100 dark:divide-[#22242b]"
          >
            {/* Top Section */}
            <div className="py-1">
              {/* 1. Copy link */}
              <button
                type="button"
                onClick={() => {
                  const link = activeMenuLink;
                  setActiveMenuLink(null);
                  handleCopy(link);
                }}
                className="w-full px-4 py-2.5 text-left text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Copy className="w-4 h-4 text-neutral-400" />
                <span>Copy link</span>
              </button>

              {/* 2. View QR Code */}
              <button
                type="button"
                onClick={() => {
                  const link = activeMenuLink;
                  setActiveMenuLink(null);
                  setSelectedQRLink(link);
                }}
                className="w-full px-4 py-2.5 text-left text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <QrCode className="w-4 h-4 text-[var(--brand-primary-text)]" />
                <span>View QR Code</span>
              </button>

              {/* 3. Test redirection */}
              <a
                href={activeMenuLink.shortUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setActiveMenuLink(null);
                  cfInvalidateCache("links");
                }}
                className="w-full px-4 py-2.5 text-left text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <ExternalLink className="w-4 h-4 text-neutral-400" />
                <span>Test redirection</span>
              </a>

              {/* 4. Edit link */}
              <button
                type="button"
                onClick={() => {
                  const link = activeMenuLink;
                  setActiveMenuLink(null);
                  setSelectedEditLink(link);
                }}
                className="w-full px-4 py-2.5 text-left text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Edit3 className="w-4 h-4 text-[var(--brand-primary-text)]" />
                <span>Edit link</span>
              </button>

              {/* 5. Share link */}
              <button
                type="button"
                onClick={() => {
                  const link = activeMenuLink;
                  setActiveMenuLink(null);
                  setSelectedShareLink(link);
                }}
                className="w-full px-4 py-2.5 text-left text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Share2 className="w-4 h-4 text-sky-400" />
                <span>Share link</span>
              </button>

              {/* 6. View analytics */}
              <button
                type="button"
                onClick={() => {
                  const link = activeMenuLink;
                  setActiveMenuLink(null);
                  router.push(
                    `/dashboard/analytics?linkId=${encodeURIComponent(link.id)}&slug=${encodeURIComponent(link.slug)}`,
                  );
                }}
                className="w-full px-4 py-2.5 text-left text-neutral-700 dark:text-neutral-200 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <BarChart2 className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
                <span>View analytics</span>
              </button>
            </div>

            {/* Bottom Section: Delete link */}
            <div className="py-1">
              <button
                type="button"
                onClick={() => {
                  const link = activeMenuLink;
                  setActiveMenuLink(null);
                  start10SecondUndoDelete(link);
                }}
                className="w-full px-4 py-2.5 text-left text-rose-600 dark:text-rose-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-500/10 flex items-center gap-3 transition-colors cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-500" />
                <span className="font-semibold">Delete link</span>
              </button>
            </div>
          </div>,
          document.body,
        )}

      {/* Floating Undo Toast at Top Center (10-Second Countdown & Progress Bar) */}
      {mounted &&
        undoToast &&
        createPortal(
          <div className="fixed top-4 md:top-6 left-1/2 -translate-x-1/2 max-w-md w-[calc(100vw-2rem)] sm:w-[460px] z-[99999] shadow-2xl animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#14161d]/95 border border-neutral-200 dark:border-[#2e323e] p-3.5 sm:p-4 text-neutral-900 dark:text-white shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_60px_rgba(0,0,0,0.9)] backdrop-blur-2xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-rose-500/15 dark:bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-500 dark:text-rose-400 shrink-0 shadow-sm">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs sm:text-sm font-bold text-neutral-900 dark:text-white truncate">
                      Link /{undoToast.link.slug} deleted
                    </div>
                    <div className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                      Swiped to delete • Undo available
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Undo Button with Dynamic Countdown */}
                  <button
                    type="button"
                    onClick={cancelUndoDelete}
                    className="px-3 py-1.5 rounded-xl bg-[var(--btn-primary-bg)] hover:bg-[var(--btn-primary-hover)] text-white md:text-black font-extrabold text-xs font-mono transition-all transform active:scale-95 shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-white md:text-black" />
                    <span>Undo ({undoToast.remaining}s)</span>
                  </button>

                  {/* Red 'X' Button: ALSO cancels deletion and restores link */}
                  <button
                    type="button"
                    onClick={cancelUndoDelete}
                    className="p-1.5 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-500/15 border border-rose-500/30 transition-all cursor-pointer active:scale-95"
                    title="Cancel deletion and close"
                  >
                    <X className="w-4 h-4 stroke-[2.5]" />
                  </button>
                </div>
              </div>

              {/* 10-Second Progress Bar */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-800/80">
                <div className="h-full bg-gradient-to-r from-[var(--brand-primary)] via-rose-500 to-rose-600 origin-left link-animate-progress" />
              </div>
            </div>
          </div>,
          document.body,
        )}

      {/* Modals */}
      <LinkCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={(created) => {
          cfInvalidateCache();
          if (created?.id) {
            setLinks((prev) => [
              created,
              ...prev.filter((l) => l.id !== created.id),
            ]);
          }
          loadLinks(true);
        }}
      />

      <LinkEditModal
        isOpen={Boolean(selectedEditLink)}
        link={selectedEditLink}
        onClose={() => setSelectedEditLink(null)}
        onSuccess={(updated) => {
          cfInvalidateCache();
          if (updated?.id) {
            setLinks((prev) =>
              prev.map((l) => (l.id === updated.id ? updated : l)),
            );
          }
          loadLinks(true);
        }}
      />

      <LinkShareModal
        isOpen={Boolean(selectedShareLink)}
        link={selectedShareLink}
        onClose={() => setSelectedShareLink(null)}
      />

      <LinkQRModal
        isOpen={Boolean(selectedQRLink)}
        link={selectedQRLink}
        onClose={() => setSelectedQRLink(null)}
      />

      {/* Custom Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteTarget.isOpen}
        onClose={() => setDeleteTarget({ isOpen: false, ids: [], labels: [] })}
        onConfirm={confirmDelete}
        itemCount={deleteTarget.ids.length}
        itemLabels={deleteTarget.labels}
        isDeleting={isDeleting}
      />
    </div>
  );
}
