"use client";

import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSession } from "next-auth/react";
import {
  Search,
  ArrowUpDown,
  Copy,
  Check,
  QrCode,
  Share2,
  ExternalLink,
  Trash2,
  Pencil,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Maximize2,
  Image as ImageIcon,
  Globe2,
  MapPin,
  Tag,
} from "lucide-react";
import { ShortLink } from "@/types";
import { BannerLightboxModal } from "@/components/dashboard/banner-lightbox-modal";
import { triggerClickSync } from "@/lib/cloudflare-api";
import { getCountryName } from "@/lib/utils";
import { ReferrerBadge, ReferrerLogo } from "@/components/dashboard/analytics/referrer-badge";

export function getDicebearGlassUrl(seed: string): string {
  return `https://api.dicebear.com/9.x/glass/svg?seed=${encodeURIComponent(seed || "lshorter")}`;
}

export const getDiceBearAvatar = getDicebearGlassUrl;

export function normalizeBannerUrl(rawUrl?: string | null): string {
  if (!rawUrl) return "";
  const trimmed = String(rawUrl).trim();
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:") || trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/api/images/")) {
    const filename = trimmed.replace("/api/images/", "");
    return `https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/images/${filename}`;
  }
  if (trimmed.startsWith("banner_") && (trimmed.endsWith(".jpg") || trimmed.endsWith(".png") || trimmed.endsWith(".webp") || trimmed.endsWith(".gif"))) {
    return `https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/images/${trimmed}`;
  }
  return trimmed;
}

function formatLiveRelativeTime(
  timestamp: string | number | Date,
  nowMs: number,
): string {
  if (!timestamp) return "Just now";
  let timeMs = 0;
  if (typeof timestamp === "number") {
    timeMs = timestamp < 1e11 ? timestamp * 1000 : timestamp;
  } else if (timestamp instanceof Date) {
    timeMs = timestamp.getTime();
  } else {
    let s = String(timestamp).trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
      s = s.replace(" ", "T") + "Z";
    }
    const parsed = Date.parse(s);
    timeMs = isNaN(parsed) ? new Date(timestamp).getTime() : parsed;
  }

  if (isNaN(timeMs) || timeMs <= 0) return "Just now";
  const diffSec = Math.floor((nowMs - timeMs) / 1000);
  if (diffSec < 60) return "Just now";
  const mins = Math.floor(diffSec / 60);
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

/* ============================================================================
 * 1. LINKS DATA TABLE (Auto-hydraté et infaillible)
 * ========================================================================== */

export interface LinksReuiDataGridProps {
  links?: ShortLink[];
  title?: string;
  pageSize?: number;
  copiedId?: string | null;
  onCopy?: (text: string, id: string) => void;
  onSelectLink?: (link: ShortLink) => void;
  onEditLink?: (link: ShortLink) => void;
  onEdit?: (link: ShortLink) => void;
  onDeleteLink?: (linkOrId: any) => void;
  onDeleteMultiple?: (selectedIds: string[]) => void;
  onShareLink?: (link: ShortLink) => void;
  onShare?: (link: ShortLink) => void;
  onShowQr?: (link: ShortLink) => void;
  onSelectQr?: (link: ShortLink) => void;
  onQr?: (link: ShortLink) => void;
}

export function LinksReuiDataGrid({
  links: propLinks,
  title = "Short Links Data Table",
  pageSize: initialPageSize = 10,
  onCopy,
  onSelectLink,
  onEditLink,
  onEdit,
  onDeleteLink,
  onDeleteMultiple,
  onShareLink,
  onShare,
  onShowQr,
  onSelectQr,
  onQr,
}: LinksReuiDataGridProps) {
  const [internalLinks, setInternalLinks] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState<number>(initialPageSize);
  const [page, setPage] = useState<number>(1);
  const [sortField, setSortField] = useState<
    "slug" | "clicks" | "revenue" | "createdAt"
  >("clicks");
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [openActionRowId, setOpenActionRowId] = useState<string | null>(null);
  const [menuCoords, setMenuCoords] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isColMenuOpen, setIsColMenuOpen] = useState<boolean>(false);
  const [optimisticMinClicks, setOptimisticMinClicks] = useState<
    Record<string, number>
  >({});
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    shortLink: true,
    destination: true,
    clicks: true,
    revenue: true,
    createdAt: true,
    status: true,
    action: true,
  });
  const [previewBanner, setPreviewBanner] = useState<{
    imageUrl: string;
    title: string;
    shortUrl: string;
    slug: string;
  } | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleClose = () => {
      setOpenActionRowId(null);
      setMenuCoords(null);
    };
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, []);

  const handleToggleActionMenu = (e: React.MouseEvent, rowId: string) => {
    e.stopPropagation();
    if (openActionRowId === rowId) {
      setOpenActionRowId(null);
      setMenuCoords(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dropdownHeight = 190;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setOpenActionRowId(rowId);
    if (openUpward) {
      setMenuCoords({
        bottom: window.innerHeight - rect.top + 4,
        right: window.innerWidth - rect.right,
      });
    } else {
      setMenuCoords({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  };

  const effectiveEdit = onEditLink || onEdit;
  const effectiveShare = onShareLink || onShare || onSelectQr || onQr || onShowQr;
  const effectiveQr = effectiveShare;

  // Auto-hydratation : si la prop links est absente ou vide, charger directement depuis /api/links
  useEffect(() => {
    if (!propLinks || propLinks.length === 0) {
      fetch("/api/links", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((json) => {
          const list = Array.isArray(json?.data)
            ? json.data
            : Array.isArray(json?.data?.data)
              ? json.data.data
              : [];
          if (list.length > 0) setInternalLinks(list);
        })
        .catch(() => {});
    }
  }, [propLinks]);

  const effectiveLinks = useMemo(() => {
    if (Array.isArray(propLinks) && propLinks.length > 0) return propLinks;
    return internalLinks;
  }, [propLinks, internalLinks]);

  const handleOpenAndTrackClick = (slug: string, currentClicks: number) => {
    setOptimisticMinClicks((prev) => ({
      ...prev,
      [slug]: Math.max(currentClicks + 1, (prev[slug] || 0) + 1),
    }));
    triggerClickSync();
  };

  const toggleColumn = (colKey: string) => {
    setVisibleCols((prev) => {
      const next = { ...prev, [colKey]: !prev[colKey] };
      if (Object.values(next).filter(Boolean).length === 0) return prev;
      return next;
    });
  };

  const rowsData = useMemo(() => {
    return effectiveLinks.map((item: any, idx: number) => {
      const rawClicksVal =
        typeof item.clicksCount === "number"
          ? item.clicksCount
          : typeof item.totalClicks === "number"
            ? item.totalClicks
            : typeof item.clicks === "number"
              ? item.clicks
              : Number(
                  item.clicks_count ?? item.totalClicks ?? item.clicks ?? 0,
                );
      const slug = item.slug || `link-${idx + 1}`;
      const clicksVal = Math.max(rawClicksVal, optimisticMinClicks[slug] || 0);
      const revenueVal = Number(
        item.revenue ?? item.tracked_revenue ?? item.trackedRevenue ?? 0,
      );
      const conversionsVal = Number(
        item.conversionsCount ?? item.conversions_count ?? 0,
      );
      const dest =
        item.targetUrl ||
        item.target_url ||
        item.destinationUrl ||
        item.originalUrl ||
        "https://lsho.cc";
      const domain =
        item.domainName || item.domain_name || item.domain || "lsho.cc";
      const shortUrl = item.shortUrl || `https://${domain}/${slug}`;
      const ownerName =
        item.title ||
        item.metaTitle ||
        item.ogTitle ||
        item.og_title ||
        `/${slug}`;
      const role = item.role || domain;
      const expTimeStr = item.expires_at || item.expiresAt;
      const isExpired = Boolean(
        expTimeStr && new Date(expTimeStr).getTime() <= Date.now()
      );
      const isItemActive =
        !isExpired &&
        item.isActive !== false &&
        item.is_active !== 0 &&
        item.is_active !== "0";

      const status = isExpired
        ? "Expired"
        : item.statusLabel || (isItemActive ? "Active" : "Paused");
      const rawBanner =
        item.ogImage ||
        item.og_image ||
        item.bannerUrl ||
        item.banner_url ||
        item.imageUrl ||
        item.image_url ||
        "";
      const ogImage = normalizeBannerUrl(rawBanner);
      const hasCustomBanner = Boolean(ogImage && !ogImage.includes("dicebear"));
      const avatarUrl = ogImage || getDiceBearAvatar(slug);

      const rawTags = item.tags ?? item.tagList ?? item.labels;
      let tags: string[] = [];
      if (Array.isArray(rawTags)) {
        tags = rawTags.map((t: any) => String(t).trim()).filter(Boolean);
      } else if (typeof rawTags === "string" && rawTags.trim()) {
        try {
          const parsed = JSON.parse(rawTags);
          if (Array.isArray(parsed)) {
            tags = parsed.map((t: any) => String(t).trim()).filter(Boolean);
          } else if (typeof parsed === "string") {
            tags = parsed.split(",").map((t: string) => t.trim()).filter(Boolean);
          }
        } catch {
          tags = rawTags.split(",").map((t: string) => t.trim()).filter(Boolean);
        }
      }

      return {
        raw: item,
        id: String(item.id || item._id || `row_${idx}`),
        slug,
        shortUrl,
        destinationUrl: dest,
        ownerName,
        role,
        domain,
        clicks: clicksVal,
        revenue: revenueVal,
        conversions: conversionsVal,
        createdAt:
          item.createdAt || item.created_at || new Date().toISOString(),
        status,
        ogImage,
        hasCustomBanner,
        avatarUrl,
        tags,
      };
    });
  }, [effectiveLinks, optimisticMinClicks]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? rowsData.filter(
          (r) =>
            r.slug.toLowerCase().includes(q) ||
            r.destinationUrl.toLowerCase().includes(q) ||
            r.ownerName.toLowerCase().includes(q) ||
            (r.tags && r.tags.some((t: string) => t.toLowerCase().includes(q))),
        )
      : [...rowsData];

    list.sort((a, b) => {
      let cmp = 0;
      if (sortField === "clicks") cmp = a.clicks - b.clicks;
      else if (sortField === "revenue") cmp = a.revenue - b.revenue;
      else if (sortField === "slug") cmp = a.slug.localeCompare(b.slug);
      else
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [rowsData, search, sortField, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const toggleSort = (field: "slug" | "clicks" | "revenue" | "createdAt") => {
    if (sortField === field) setSortAsc(!sortAsc);
    else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const handleCopy = (e: React.MouseEvent, id: string, url: string) => {
    e.stopPropagation();
    if (onCopy) onCopy(url, id);
    else navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Checkbox Selection & Bulk Action Helpers
  const selectedLinkIdsList = useMemo(
    () => Object.entries(selectedIds).filter(([_, v]) => v).map(([k]) => k),
    [selectedIds]
  );

  const isAllSelected = useMemo(
    () =>
      filteredRows.length > 0 &&
      filteredRows.every((r) => !!selectedIds[r.id]),
    [filteredRows, selectedIds]
  );

  const isSomeSelected = useMemo(
    () =>
      !isAllSelected &&
      filteredRows.some((r) => !!selectedIds[r.id]),
    [filteredRows, selectedIds, isAllSelected]
  );

  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = isSomeSelected;
    }
  }, [isSomeSelected]);

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds({});
    } else {
      const next: Record<string, boolean> = {};
      filteredRows.forEach((r) => {
        next[r.id] = true;
      });
      setSelectedIds(next);
    }
  };

  // Auto-prune selection state if links were deleted
  useEffect(() => {
    setSelectedIds((prev) => {
      const validIds = new Set(rowsData.map((r) => r.id));
      let changed = false;
      const next: Record<string, boolean> = {};
      for (const [k, v] of Object.entries(prev)) {
        if (v && validIds.has(k)) {
          next[k] = true;
        } else if (v) {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [rowsData]);

  const COLUMN_DEFINITIONS = [
    { key: "shortLink", label: "Owner & Short Link" },
    { key: "destination", label: "Destination URL" },
    { key: "clicks", label: "Total Clicks" },
    { key: "revenue", label: "Revenue ($)" },
    { key: "createdAt", label: "Created Date" },
    { key: "status", label: "Status" },
    { key: "action", label: "Actions" },
  ];

  const activeColCount =
    1 + COLUMN_DEFINITIONS.filter((c) => visibleCols[c.key]).length;

  return (
    <div
      onClick={() => {
        if (openActionRowId) {
          setOpenActionRowId(null);
          setMenuCoords(null);
        }
        if (isColMenuOpen) setIsColMenuOpen(false);
      }}
      className="rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#111113] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] h-[80vh] min-h-[80vh] flex flex-col relative overflow-hidden"
    >
      <div className="px-6 pt-5 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div>
          <h3 className="text-[17px] font-semibold text-[#101828] dark:text-[#fafafa]">
            {title}
          </h3>
          <p className="text-[13px] text-[#667085] dark:text-[#a1a1aa] mt-0.5">
            Manage custom branded links, destination routing rules, revenue
            attribution, and click telemetry
          </p>
        </div>
      </div>

      <div className="px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent shrink-0">
        <div className="flex items-center gap-2 text-xs text-[#667085] dark:text-[#a1a1aa]">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setPage(1);
            }}
            className="h-8 rounded-lg border border-[#D0D5DD] dark:border-[#2e2e33] bg-white dark:bg-[#141416] px-2 text-xs font-medium text-[#101828] dark:text-[#fafafa] focus:outline-none focus:border-[#0066FF]"
          >
            <option value={5}>5</option>
            <option value={10}>10</option>
            <option value={25}>25</option>
          </select>
          <span>entries</span>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative flex-1 sm:w-[240px] sm:flex-initial">
            <Search className="w-3.5 h-3.5 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search short links, URLs or tags..."
              className="w-full h-8 rounded-lg border border-[#D0D5DD] dark:border-[#2e2e33] bg-white dark:bg-[#141416] pl-8.5 pr-2.5 text-xs text-[#101828] dark:text-[#fafafa] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#0066FF]"
            />
          </div>

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsColMenuOpen((prev) => !prev)}
              className="h-8 px-2.5 rounded-lg border border-[#D0D5DD] dark:border-[#2e2e33] bg-white dark:bg-[#141416] hover:bg-[#F9FAFB] dark:hover:bg-[#1c1c20] text-xs font-medium text-[#344054] dark:text-[#d4d4d8] inline-flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Columns</span>
              <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded text-[10px] font-bold bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]">
                {COLUMN_DEFINITIONS.filter((c) => visibleCols[c.key]).length}/
                {COLUMN_DEFINITIONS.length}
              </span>
            </button>

            {isColMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] p-2 shadow-xl z-50">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#E4E7EC] dark:border-[#222225] mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa]">
                    Show / Hide Columns
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setVisibleCols({
                        shortLink: true,
                        destination: true,
                        clicks: true,
                        revenue: true,
                        createdAt: true,
                        status: true,
                        action: true,
                      })
                    }
                    className="text-[11px] font-semibold text-[#0066FF] hover:underline cursor-pointer"
                  >
                    Show all
                  </button>
                </div>

                <div className="space-y-0.5">
                  {COLUMN_DEFINITIONS.map((col) => {
                    const checked = !!visibleCols[col.key];
                    return (
                      <label
                        key={col.key}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-white/[0.05] cursor-pointer text-xs font-medium text-[#344054] dark:text-[#d4d4d8]"
                      >
                        <span>{col.label}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleColumn(col.key)}
                          className="w-4 h-4 rounded border-[#D0D5DD] dark:border-[#2e2e33] text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto overscroll-x-contain px-2 sm:px-3">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-white dark:bg-[#111113] shadow-xs">
            <tr className="rounded-xl bg-[#F9FAFB] dark:bg-white/[0.03]">
              <th className="py-2.5 px-4 w-10 first:rounded-l-xl">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  aria-label="Select all rows"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="w-3.5 h-3.5 rounded border-[#D0D5DD] dark:border-[#2e2e33] text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                />
              </th>
              {visibleCols.shortLink && (
                <th
                  onClick={() => toggleSort("slug")}
                  className="py-2.5 px-4 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] cursor-pointer select-none whitespace-nowrap"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>Owner & Short Link</span>
                    <ArrowUpDown className="w-3 h-3 text-[#98A2B3]" />
                  </div>
                </th>
              )}
              {visibleCols.destination && (
                <th className="py-2.5 px-4 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] whitespace-nowrap">
                  <div className="flex items-center justify-between gap-2">
                    <span>Destination URL</span>
                    <ArrowUpDown className="w-3 h-3 text-[#98A2B3]" />
                  </div>
                </th>
              )}
              {visibleCols.clicks && (
                <th
                  onClick={() => toggleSort("clicks")}
                  className="py-2.5 px-4 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] cursor-pointer select-none whitespace-nowrap"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>Total Clicks</span>
                    <ArrowUpDown className="w-3 h-3 text-[#98A2B3]" />
                  </div>
                </th>
              )}
              {visibleCols.revenue && (
                <th
                  onClick={() => toggleSort("revenue")}
                  className="py-2.5 px-4 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] cursor-pointer select-none whitespace-nowrap"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>Revenue</span>
                    <ArrowUpDown className="w-3 h-3 text-[#98A2B3]" />
                  </div>
                </th>
              )}
              {visibleCols.createdAt && (
                <th
                  onClick={() => toggleSort("createdAt")}
                  className="py-2.5 px-4 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] cursor-pointer select-none whitespace-nowrap"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>Created Date</span>
                    <ArrowUpDown className="w-3 h-3 text-[#98A2B3]" />
                  </div>
                </th>
              )}
              {visibleCols.status && (
                <th className="py-2.5 px-4 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] whitespace-nowrap">
                  <span>Status</span>
                </th>
              )}
              {visibleCols.action && (
                <th className="py-2.5 px-4 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] text-right whitespace-nowrap last:rounded-r-xl">
                  <span>Action</span>
                </th>
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedRows.length === 0 ? (
              <tr>
                <td
                  colSpan={activeColCount}
                  className="py-14 px-6 text-center text-[13.5px] text-[#667085] dark:text-[#a1a1aa]"
                >
                  No short links found. Create your first link to start tracking
                  analytics and custom banners.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => {
                const isChecked = !!selectedIds[row.id];
                const isMenuOpen = openActionRowId === row.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => onSelectLink && onSelectLink(row.raw)}
                    className="hover:bg-[#F9FAFB] dark:hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td
                      onClick={(e) => e.stopPropagation()}
                      className="py-2.5 px-4 first:rounded-l-xl whitespace-nowrap"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) =>
                          setSelectedIds((prev) => ({
                            ...prev,
                            [row.id]: e.target.checked,
                          }))
                        }
                        className="w-3.5 h-3.5 rounded border-[#D0D5DD] dark:border-[#2e2e33] text-[#0066FF] focus:ring-[#0066FF]"
                      />
                    </td>

                    {visibleCols.shortLink && (
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (row.hasCustomBanner) {
                                setPreviewBanner({
                                  imageUrl: row.avatarUrl,
                                  title: row.ownerName,
                                  shortUrl: row.shortUrl,
                                  slug: row.slug,
                                });
                              } else if (onEditLink) {
                                onEditLink(row.raw);
                              } else if (onSelectLink) {
                                onSelectLink(row.raw);
                              }
                            }}
                            title={row.hasCustomBanner ? "Click to view full banner preview" : "Click to edit link"}
                            className={
                              row.hasCustomBanner
                                ? "group/avatar relative w-9 h-7 rounded-lg border border-[#0066FF]/35 dark:border-[#5294FF]/40 bg-[#F2F4F7] dark:bg-white/[0.04] overflow-hidden shrink-0 cursor-pointer transition-all duration-200 hover:scale-105 shadow-2xs hover:shadow-md ring-1.5 ring-[#0066FF]/15"
                                : "group/avatar relative w-7.5 h-7.5 rounded-full border border-[#E4E7EC]/80 dark:border-white/15 bg-[#F2F4F7] dark:bg-white/[0.04] overflow-hidden shrink-0 cursor-pointer transition-transform duration-200 hover:scale-105"
                            }
                          >
                            <img
                              src={row.avatarUrl}
                              alt={row.ownerName}
                              className="w-full h-full object-cover transition-transform group-hover/avatar:scale-105"
                              onError={(e) => {
                                const target = e.currentTarget as HTMLImageElement;
                                if (row.hasCustomBanner && row.ogImage.startsWith("/api/images/")) {
                                  const fName = row.ogImage.replace("/api/images/", "");
                                  target.src = `https://lshorter-api.fiatechnologiecam.workers.dev/api/v1/images/${fName}`;
                                } else {
                                  target.src = getDiceBearAvatar(row.slug);
                                }
                              }}
                            />
                            <span className="absolute inset-0 bg-black/40 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center text-white">
                              <Maximize2 className="w-3 h-3" />
                            </span>
                            {row.hasCustomBanner && (
                              <span className="absolute bottom-0 right-0 p-0.5 bg-[#0066FF] text-white rounded-tl-[3px] shadow-xs pointer-events-none">
                                <ImageIcon className="w-2 h-2" />
                              </span>
                            )}
                          </button>
                          <div className="min-w-0">
                            <a
                              href={`/r/${encodeURIComponent(row.slug)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenAndTrackClick(row.slug, row.clicks);
                              }}
                              className="inline-flex items-center gap-1 text-[13px] font-semibold text-[#101828] dark:text-[#fafafa] hover:text-[#0066FF] dark:hover:text-[#5294FF] transition-colors truncate"
                            >
                              <span className="truncate">
                                {row.domain}/{row.slug}
                              </span>
                              <ExternalLink className="w-3 h-3 text-[#0066FF] opacity-75 shrink-0" />
                            </a>
                            <div className="text-[11px] text-[#667085] dark:text-[#a1a1aa] truncate">
                              {row.ownerName} • {row.role}
                            </div>
                            {/* Tags de lien */}
                            {row.tags && row.tags.length > 0 && (
                              <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                {row.tags.slice(0, 3).map((tag: string, tIdx: number) => (
                                  <span
                                    key={tIdx}
                                    className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9.5px] font-medium bg-[#F2F4F7] dark:bg-white/[0.06] text-[#475467] dark:text-[#a1a1aa] border border-[#E4E7EC] dark:border-white/10"
                                  >
                                    <Tag className="w-2 h-2 opacity-60" />
                                    <span>{tag}</span>
                                  </span>
                                ))}
                                {row.tags.length > 3 && (
                                  <span
                                    title={row.tags.slice(3).join(", ")}
                                    className="text-[9px] font-medium text-[#98A2B3] dark:text-[#71717a] px-0.5"
                                  >
                                    +{row.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    )}

                    {visibleCols.destination && (
                      <td className="py-2.5 px-4 max-w-[260px] whitespace-nowrap">
                        <div className="text-[12px] text-[#475467] dark:text-[#d4d4d8] truncate font-mono">
                          {row.destinationUrl}
                        </div>
                      </td>
                    )}

                    {visibleCols.clicks && (
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="text-[13px] font-semibold text-[#101828] dark:text-[#fafafa] font-mono">
                          {row.clicks.toLocaleString()}
                        </span>
                      </td>
                    )}

                    {visibleCols.revenue && (
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span
                            className={`text-[13px] font-bold font-mono tabular-nums ${
                              row.revenue > 0
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-[#667085] dark:text-[#a1a1aa]"
                            }`}
                          >
                            ${row.revenue.toFixed(2)}
                          </span>
                          {row.conversions > 0 && (
                            <span className="text-[10px] font-medium text-[#667085] dark:text-[#a1a1aa]">
                              {row.conversions} sale
                              {row.conversions > 1 ? "s" : ""}
                            </span>
                          )}
                        </div>
                      </td>
                    )}

                    {visibleCols.createdAt && (
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span className="text-[12px] text-[#667085] dark:text-[#a1a1aa]">
                          {new Date(row.createdAt).toLocaleDateString("en-US", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>
                      </td>
                    )}

                    {visibleCols.status && (
                      <td className="py-2.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium ${
                            row.status === "Active"
                              ? "bg-[#ECFDF3] text-[#027A48] dark:bg-emerald-500/15 dark:text-emerald-400"
                              : row.status === "Pending"
                                ? "bg-[#FFFAEB] text-[#B54708] dark:bg-amber-500/15 dark:text-amber-400"
                                : row.status === "Expired"
                                  ? "bg-[#FEF3F2] text-[#B42318] dark:bg-rose-500/15 dark:text-rose-400"
                                  : "bg-[#F2F4F7] text-[#344054] dark:bg-neutral-800 dark:text-neutral-400"
                          }`}
                        >
                          {row.status === "Expired"
                            ? "Expiré"
                            : row.status === "Active"
                              ? "Actif"
                              : row.status === "Paused"
                                ? "En pause"
                                : row.status}
                        </span>
                      </td>
                    )}

                    {visibleCols.action && (
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="py-2.5 px-4 text-right whitespace-nowrap last:rounded-r-xl"
                      >
                        <button
                          type="button"
                          onClick={(e) => handleToggleActionMenu(e, row.id)}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer ${
                            openActionRowId === row.id
                              ? "bg-[#F2F4F7] dark:bg-white/10 text-[#101828] dark:text-[#fafafa]"
                              : "text-[#667085] dark:text-[#a1a1aa] hover:text-[#101828] dark:hover:text-[#fafafa] hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06]"
                          }`}
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#E4E7EC] dark:border-[#222225] shrink-0 mt-auto bg-white dark:bg-[#111113]">
        <div className="flex items-center gap-2.5">
          {selectedLinkIdsList.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (onDeleteMultiple) {
                  onDeleteMultiple(selectedLinkIdsList);
                } else if (onDeleteLink) {
                  selectedLinkIdsList.forEach((id) => onDeleteLink(id));
                }
              }}
              title={`Supprimer ${selectedLinkIdsList.length} lien${selectedLinkIdsList.length > 1 ? "s" : ""} sélectionné${selectedLinkIdsList.length > 1 ? "s" : ""}`}
              aria-label="Supprimer les liens sélectionnés"
              className="text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors cursor-pointer bg-transparent border-0 p-0 flex items-center justify-center shrink-0 focus:outline-hidden"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300" />
            </button>
          )}
          <p className="text-xs text-[#667085] dark:text-[#a1a1aa]">
            Showing{" "}
            {filteredRows.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredRows.length)} of{" "}
            {filteredRows.length} entries
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={currentPage <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="w-7.5 h-7.5 rounded-md border border-[#D0D5DD] dark:border-[#2e2e33] flex items-center justify-center text-[#344054] dark:text-[#d4d4d8] disabled:opacity-40 hover:bg-[#F9FAFB] cursor-pointer"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setPage(num)}
              className={`w-7.5 h-7.5 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                num === currentPage
                  ? "bg-[#0066FF] text-white"
                  : "border border-[#D0D5DD] dark:border-[#2e2e33] text-[#344054] dark:text-[#d4d4d8] hover:bg-[#F9FAFB]"
              }`}
            >
              {num}
            </button>
          ))}

          <button
            type="button"
            disabled={currentPage >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="w-7.5 h-7.5 rounded-md border border-[#D0D5DD] dark:border-[#2e2e33] flex items-center justify-center text-[#344054] dark:text-[#d4d4d8] disabled:opacity-40 hover:bg-[#F9FAFB] cursor-pointer"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Floating Action Menu rendered in Portal — Guaranteed Top Layer z-[99999] with No Clipping */}
      {mounted &&
        openActionRowId &&
        menuCoords &&
        (() => {
          const activeRow = paginatedRows.find((r) => r.id === openActionRowId);
          if (!activeRow) return null;
          return createPortal(
            <div
              style={{
                position: "fixed",
                top:
                  menuCoords.top !== undefined
                    ? `${menuCoords.top}px`
                    : undefined,
                bottom:
                  menuCoords.bottom !== undefined
                    ? `${menuCoords.bottom}px`
                    : undefined,
                right: `${menuCoords.right}px`,
                zIndex: 99999,
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-56 rounded-xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] p-1.5 shadow-2xl text-left font-sans animate-in fade-in zoom-in-95 duration-100 divide-y divide-[#F2F4F7] dark:divide-[#222225]"
            >
              <div className="py-0.5 space-y-0.5">
                <button
                  type="button"
                  onClick={(e) => {
                    handleCopy(e, activeRow.id, activeRow.shortUrl);
                    setOpenActionRowId(null);
                    setMenuCoords(null);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#344054] dark:text-[#d4d4d8] hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                >
                  {copiedId === activeRow.id ? (
                    <Check className="w-4 h-4 text-[#027A48]" />
                  ) : (
                    <Copy className="w-4 h-4 text-[#667085]" />
                  )}
                  <span>Copy short link</span>
                </button>

                {effectiveShare && (
                  <button
                    type="button"
                    onClick={() => {
                      effectiveShare(activeRow.raw);
                      setOpenActionRowId(null);
                      setMenuCoords(null);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#344054] dark:text-[#d4d4d8] hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <Share2 className="w-4 h-4 text-[#667085]" />
                    <span>Share</span>
                  </button>
                )}

                {effectiveEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      effectiveEdit(activeRow.raw);
                      setOpenActionRowId(null);
                      setMenuCoords(null);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#344054] dark:text-[#d4d4d8] hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
                  >
                    <Pencil className="w-4 h-4 text-[#667085]" />
                    <span>Edit short link</span>
                  </button>
                )}
              </div>

              {onDeleteLink && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteLink(activeRow.raw);
                      setOpenActionRowId(null);
                      setMenuCoords(null);
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#D92D20] hover:bg-[#FEF3F2] dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span>Delete link</span>
                  </button>
                </div>
              )}
            </div>,
            document.body,
          );
        })()}

      <BannerLightboxModal
        isOpen={!!previewBanner}
        onClose={() => setPreviewBanner(null)}
        data={previewBanner}
      />
    </div>
  );
}

export function CustomersReuiDataGrid(_props?: {
  links?: any[];
  recentClicks?: any[];
}) {
  return <LinksReuiDataGrid links={_props?.links} />;
}

/* ============================================================================
 * 2. REAL-TIME EDGE REDIRECT LEDGER (GeoLogsReuiDataGrid - Auto-hydraté)
 * ========================================================================== */

const GEO_LOGS_COLUMNS = [
  { key: "country", label: "Country" },
  { key: "city", label: "City / PoP" },
  { key: "referrer", label: "Referrer Source" },
  { key: "shortLink", label: "Short Link" },
  { key: "device", label: "Client OS / Browser" },
  { key: "time", label: "Time" },
  { key: "status", label: "Security Check" },
  { key: "action", label: "Action" },
];

export function GeoLogsReuiDataGrid({
  logs: propLogs,
  analytics: propAnalytics,
  links: propLinks = [],
}: {
  logs?: any[];
  analytics?: any;
  links?: any[];
}) {
  const [internalLogs, setInternalLogs] = useState<any[]>([]);
  const [internalLinks, setInternalLinks] = useState<any[]>([]);
  const [currentTimeTick, setCurrentTimeTick] = useState<number>(() =>
    Date.now(),
  );
  const [query, setQuery] = useState("");
  const [openGeoRowId, setOpenGeoRowId] = useState<string | null>(null);
  const [geoMenuCoords, setGeoMenuCoords] = useState<{
    top?: number;
    bottom?: number;
    right: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [copiedGeoId, setCopiedGeoId] = useState<string | null>(null);
  const [isColMenuOpen, setIsColMenuOpen] = useState(false);
  const [visibleCols, setVisibleCols] = useState<Record<string, boolean>>({
    country: true,
    city: true,
    referrer: true,
    shortLink: true,
    device: true,
    time: true,
    status: true,
    action: true,
  });

  const toggleColumn = (key: string) => {
    setVisibleCols((prev) => {
      const activeCount = Object.values(prev).filter(Boolean).length;
      if (prev[key] && activeCount <= 1) return prev;
      return { ...prev, [key]: !prev[key] };
    });
  };

  const showAllColumns = () => {
    setVisibleCols({
      country: true,
      city: true,
      referrer: true,
      shortLink: true,
      device: true,
      time: true,
      status: true,
      action: true,
    });
  };

  const activeColCount = Object.values(visibleCols).filter(Boolean).length;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Horloge de rafraîchissement des minutes (toutes les 5 secondes)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const { data: session } = useSession();
  const userId = session?.user?.id || "";

  useEffect(() => {
    const handleClose = () => {
      setOpenGeoRowId(null);
      setGeoMenuCoords(null);
    };
    window.addEventListener("scroll", handleClose, true);
    window.addEventListener("resize", handleClose);
    return () => {
      window.removeEventListener("scroll", handleClose, true);
      window.removeEventListener("resize", handleClose);
    };
  }, []);

  const handleToggleGeoMenu = (e: React.MouseEvent, rowId: string) => {
    e.stopPropagation();
    if (openGeoRowId === rowId) {
      setOpenGeoRowId(null);
      setGeoMenuCoords(null);
      return;
    }
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const dropdownHeight = 110;
    const spaceBelow = window.innerHeight - rect.bottom;
    const openUpward = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

    setOpenGeoRowId(rowId);
    if (openUpward) {
      setGeoMenuCoords({
        bottom: window.innerHeight - rect.top + 4,
        right: window.innerWidth - rect.right,
      });
    } else {
      setGeoMenuCoords({
        top: rect.bottom + 4,
        right: window.innerWidth - rect.right,
      });
    }
  };

  const fetchLogs = useCallback(async () => {
    if (!userId) return;
    try {
      const timestamp = Date.now();
      const [aJson, lJson] = await Promise.all([
        fetch(
          `/api/analytics?userId=${encodeURIComponent(userId)}&period=30d&_t=${timestamp}`,
          { cache: "no-store" },
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch(
          `/api/links?userId=${encodeURIComponent(userId)}&_t=${timestamp}`,
          { cache: "no-store" },
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
      ]);
      const d = aJson?.data?.data || aJson?.data || aJson || {};
      const evs =
        d.liveClickEvents || d.live_click_events || d.recentClicks || [];
      if (Array.isArray(evs) && evs.length > 0) setInternalLogs(evs);
      const lList = Array.isArray(lJson?.data)
        ? lJson.data
        : Array.isArray(lJson?.data?.data)
          ? lJson.data.data
          : [];
      if (lList.length > 0) setInternalLinks(lList);
    } catch {}
  }, [userId]);

  // Initial fetch and automatic real-time event listeners
  useEffect(() => {
    if (!userId) return;

    if (propLogs === undefined || propLinks === undefined || propLogs.length === 0) {
      fetchLogs();
    }

    const handleUpdate = () => {
      fetchLogs();
    };

    const handleFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      fetchLogs();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "lshorter_data_change" || e.key === "lshorter_last_click") {
        fetchLogs();
      }
    };

    window.addEventListener("lshorter_data_change", handleUpdate);
    window.addEventListener("lshorter_links_updated", handleUpdate);
    window.addEventListener("lshorter_link_clicked", handleUpdate);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("storage", handleStorage);

    // Active polling every 4s for live stream updates
    const pollTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      fetchLogs();
    }, 4000);

    return () => {
      window.removeEventListener("lshorter_data_change", handleUpdate);
      window.removeEventListener("lshorter_links_updated", handleUpdate);
      window.removeEventListener("lshorter_link_clicked", handleUpdate);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("storage", handleStorage);
      clearInterval(pollTimer);
    };
  }, [userId, propLogs, propLinks, fetchLogs]);

  const effectiveLogs = useMemo(() => {
    if (Array.isArray(propLogs) && propLogs.length > 0) return propLogs;
    return internalLogs;
  }, [propLogs, internalLogs]);

  const effectiveLinks = useMemo(() => {
    if (Array.isArray(propLinks) && propLinks.length > 0) return propLinks;
    return internalLinks;
  }, [propLinks, internalLinks]);

  const normalizedRows = useMemo(() => {
    // 1. Événements réels individuels si disponibles
    if (effectiveLogs.length > 0) {
      return effectiveLogs.map((c: any, idx: number) => {
        const cCode = (
          c.countryCode ||
          c.country_code ||
          c.country ||
          "XX"
        ).toUpperCase();
        const country =
          c.countryName || c.country_name || getCountryName(cCode) || cCode;
        const city = c.city && c.city !== "Inconnue" && c.city !== "—" ? c.city : "Edge Node";
        const referrer = c.referrer || "Direct";
        const rawSlug = c.rawSlug || c.slug || "link";
        const cleanSlug = String(rawSlug)
          .replace(/^https?:\/\/[^/]+\//, "")
          .replace(/^lsho\.cc\//, "")
          .replace(/^lshrt\.co\//, "")
          .replace(/^\//, "");
        const os = c.os && c.os !== "unknown" ? c.os : "Inconnu";
        const browser = c.browser && c.browser !== "unknown" ? c.browser : "Inconnu";
        const device =
          c.device && c.device.includes("•") ? c.device : `${os} • ${browser}`;

        return {
          id: c.id || `geo_${idx}_${cleanSlug}`,
          timestamp: c.timestamp || c.created_at || new Date().toISOString(),
          visitor: `${city} (${cCode})`,
          country,
          countryCode: cCode,
          city,
          referrer,
          slug: `lsho.cc/${cleanSlug}`,
          rawSlug: cleanSlug,
          device,
          latency: c.latency ? `${c.latency}` : (c.latencyMs ? `${c.latencyMs}` : "—"),
          status: "Verified",
        };
      });
    }

    return [];
  }, [effectiveLogs]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedRows;
    return normalizedRows.filter(
      (r) =>
        String(r.country || "")
          .toLowerCase()
          .includes(q) ||
        String(r.city || "")
          .toLowerCase()
          .includes(q) ||
        String(r.referrer || "")
          .toLowerCase()
          .includes(q) ||
        String(r.slug || "")
          .toLowerCase()
          .includes(q) ||
        String(r.device || "")
          .toLowerCase()
          .includes(q) ||
        String(r.visitor || "")
          .toLowerCase()
          .includes(q),
    );
  }, [normalizedRows, query]);

  return (
    <div
      onClick={() => {
        if (openGeoRowId) {
          setOpenGeoRowId(null);
          setGeoMenuCoords(null);
        }
        if (isColMenuOpen) setIsColMenuOpen(false);
      }}
      className="rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#111113] shadow-[0px_1px_2px_0px_rgba(16,24,40,0.05)] h-[80vh] min-h-[80vh] flex flex-col relative overflow-hidden"
    >
      <div className="px-6 py-5 border-b border-[#E4E7EC] dark:border-[#222225] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <h3 className="text-[17px] font-semibold text-[#101828] dark:text-[#fafafa]">
            Real-Time Edge Redirect Ledger
          </h3>
          <p className="text-[13px] text-[#667085] dark:text-[#a1a1aa] mt-0.5">
            Live geographic, city and referrer resolution stream across global PoPs
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto justify-end">
          <div className="relative flex-1 sm:w-[260px] sm:flex-initial">
            <Search className="w-4 h-4 text-[#98A2B3] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by city, country, or referrer..."
              className="w-full h-10 rounded-lg border border-[#D0D5DD] dark:border-[#2e2e33] bg-white dark:bg-[#141416] pl-10 pr-4 text-[13px] text-[#101828] dark:text-[#fafafa] placeholder:text-[#98A2B3] focus:outline-none focus:border-[#0066FF]"
            />
          </div>

          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setIsColMenuOpen((prev) => !prev)}
              className="h-10 px-3.5 rounded-lg border border-[#D0D5DD] dark:border-[#2e2e33] bg-white dark:bg-[#141416] hover:bg-[#F9FAFB] dark:hover:bg-[#1c1c20] text-[13px] font-medium text-[#344054] dark:text-[#d4d4d8] inline-flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>Columns</span>
              <span className="inline-flex items-center justify-center px-1.5 py-0.5 rounded-md text-[11px] font-bold bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]">
                {activeColCount}/{GEO_LOGS_COLUMNS.length}
              </span>
            </button>

            {isColMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] p-2 shadow-xl z-50">
                <div className="flex items-center justify-between px-2 py-1.5 border-b border-[#E4E7EC] dark:border-[#222225] mb-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa]">
                    Show / Hide Columns
                  </span>
                  <button
                    type="button"
                    onClick={showAllColumns}
                    className="text-[11px] font-semibold text-[#0066FF] hover:underline cursor-pointer"
                  >
                    Show all
                  </button>
                </div>

                <div className="space-y-0.5">
                  {GEO_LOGS_COLUMNS.map((col) => {
                    const checked = !!visibleCols[col.key];
                    return (
                      <label
                        key={col.key}
                        className="flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[#F9FAFB] dark:hover:bg-white/[0.05] cursor-pointer text-xs font-medium text-[#344054] dark:text-[#d4d4d8]"
                      >
                        <span>{col.label}</span>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleColumn(col.key)}
                          className="w-4 h-4 rounded border-[#D0D5DD] dark:border-[#2e2e33] text-[#0066FF] focus:ring-[#0066FF] cursor-pointer"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto overscroll-x-contain px-2 sm:px-3 pb-3">
        <table className="w-full border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-white dark:bg-[#111113] shadow-xs">
            <tr className="rounded-xl bg-[#F9FAFB] dark:bg-white/[0.03]">
              {visibleCols.country && (
                <th className="py-2.5 px-3.5 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] whitespace-nowrap first:rounded-l-xl">
                  Country
                </th>
              )}
              {visibleCols.city && (
                <th className="py-2.5 px-3.5 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] whitespace-nowrap">
                  City / PoP
                </th>
              )}
              {visibleCols.referrer && (
                <th className="py-2.5 px-3.5 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] whitespace-nowrap text-center">
                  Referrer Source
                </th>
              )}
              {visibleCols.shortLink && (
                <th className="py-2.5 px-3.5 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] whitespace-nowrap">
                  Short Link
                </th>
              )}
              {visibleCols.device && (
                <th className="py-2.5 px-3.5 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] whitespace-nowrap">
                  Client OS / Browser
                </th>
              )}
              {visibleCols.time && (
                <th className="py-2.5 px-3.5 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] whitespace-nowrap">
                  Time
                </th>
              )}
              {visibleCols.status && (
                <th className="py-2.5 px-3.5 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] whitespace-nowrap">
                  Security Check
                </th>
              )}
              {visibleCols.action && (
                <th className="py-2.5 px-3.5 text-[11.5px] font-semibold uppercase tracking-wider text-[#667085] dark:text-[#a1a1aa] text-right whitespace-nowrap last:rounded-r-xl">
                  Action
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={activeColCount}
                  className="py-12 px-6 text-center text-xs text-[#667085] dark:text-[#a1a1aa]"
                >
                  No geographic edge redirects recorded yet.
                </td>
              </tr>
            ) : (
              rows.map((item) => {
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-[#F9FAFB] dark:hover:bg-white/[0.03] transition-colors"
                  >
                    {visibleCols.country && (
                      <td className="py-2.5 px-3.5 whitespace-nowrap first:rounded-l-xl">
                        <div className="flex items-center gap-2.5">
                          {item.countryCode && item.countryCode !== "XX" ? (
                            <img
                              src={`https://flagcdn.com/w40/${item.countryCode.toLowerCase()}.png`}
                              alt={item.country}
                              className="w-5.5 h-4 rounded-[2px] object-cover border border-black/10 dark:border-white/10 shrink-0"
                            />
                          ) : (
                            <Globe2 className="w-4 h-4 text-zinc-400 shrink-0" />
                          )}
                          <div>
                            <div className="text-[12.5px] font-semibold text-[#101828] dark:text-[#fafafa]">
                              {item.country}
                            </div>
                            <div className="text-[10px] font-mono text-[#667085] dark:text-[#a1a1aa]">
                              Code: {item.countryCode}
                            </div>
                          </div>
                        </div>
                      </td>
                    )}
                    {visibleCols.city && (
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-[12px] font-medium text-[#101828] dark:text-[#f4f4f5]">
                        {item.city}
                      </td>
                    )}
                    {visibleCols.referrer && (
                      <td className="py-2.5 px-3.5 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <ReferrerLogo referrer={item.referrer} size={18} />
                        </div>
                      </td>
                    )}
                    {visibleCols.shortLink && (
                      <td className="py-2.5 px-3.5 font-mono text-[12px] font-medium whitespace-nowrap">
                        <a
                          href={`/r/${encodeURIComponent(item.rawSlug)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => triggerClickSync()}
                          className="inline-flex items-center gap-1 text-[#0066FF] dark:text-[#5294FF] hover:underline"
                        >
                          <span>{item.slug}</span>
                          <ExternalLink className="w-3 h-3 opacity-70" />
                        </a>
                      </td>
                    )}
                    {visibleCols.device && (
                      <td className="py-2.5 px-3.5 text-[12px] text-[#475467] dark:text-[#d4d4d8] whitespace-nowrap">
                        {item.device}
                      </td>
                    )}
                    {visibleCols.time && (
                      <td className="py-2.5 px-3.5 font-mono text-[11px] text-[#667085] dark:text-[#a1a1aa] whitespace-nowrap">
                        {/* S'actualise en temps réel au fil des minutes */}
                        {formatLiveRelativeTime(item.timestamp, currentTimeTick)}
                      </td>
                    )}
                    {visibleCols.status && (
                      <td className="py-2.5 px-3.5 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-medium bg-[#ECFDF3] text-[#027A48] dark:bg-emerald-500/15 dark:text-emerald-400">
                          {item.status}
                        </span>
                      </td>
                    )}
                    {visibleCols.action && (
                      <td
                        onClick={(e) => e.stopPropagation()}
                        className="py-2.5 px-3.5 text-right whitespace-nowrap last:rounded-r-xl"
                      >
                        <button
                          type="button"
                          onClick={(e) => handleToggleGeoMenu(e, item.id)}
                          className={`inline-flex h-7 w-7 items-center justify-center rounded-md transition-colors cursor-pointer ${
                            openGeoRowId === item.id
                              ? "bg-[#F2F4F7] dark:bg-white/10 text-[#101828] dark:text-[#fafafa]"
                              : "text-[#667085] dark:text-[#a1a1aa] hover:text-[#101828] dark:hover:text-[#fafafa] hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06]"
                          }`}
                        >
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Action Menu rendered in Portal — Guaranteed Top Layer with No Clipping */}
      {mounted &&
        openGeoRowId &&
        geoMenuCoords &&
        (() => {
          const activeItem = rows.find((r) => r.id === openGeoRowId);
          if (!activeItem) return null;
          const fullShortUrl = `https://lsho.cc/${activeItem.rawSlug}`;
          return createPortal(
            <div
              style={{
                position: "fixed",
                top:
                  geoMenuCoords.top !== undefined
                    ? `${geoMenuCoords.top}px`
                    : undefined,
                bottom:
                  geoMenuCoords.bottom !== undefined
                    ? `${geoMenuCoords.bottom}px`
                    : undefined,
                right: `${geoMenuCoords.right}px`,
                zIndex: 99999,
              }}
              onClick={(e) => e.stopPropagation()}
              className="w-52 rounded-xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] p-1.5 shadow-2xl text-left font-sans animate-in fade-in zoom-in-95 duration-100"
            >
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(fullShortUrl);
                  setCopiedGeoId(activeItem.id);
                  setTimeout(() => setCopiedGeoId(null), 1800);
                  setOpenGeoRowId(null);
                  setGeoMenuCoords(null);
                }}
                className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] font-medium text-[#344054] dark:text-[#d4d4d8] hover:bg-[#F2F4F7] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
              >
                {copiedGeoId === activeItem.id ? (
                  <Check className="w-4 h-4 text-[#027A48]" />
                ) : (
                  <Copy className="w-4 h-4 text-[#667085]" />
                )}
                <span>Copy short link</span>
              </button>
            </div>,
            document.body,
          );
        })()}
    </div>
  );
}
