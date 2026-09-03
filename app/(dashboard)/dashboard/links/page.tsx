"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Link2,
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
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { cfGetLinks, cfDeleteLink, cfInvalidateCache } from "@/lib/cloudflare-api";
import { ShortLink } from "@/types";
import { formatNumber, formatDateRelative } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { LinksPageSkeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  const [selectedEditLink, setSelectedEditLink] = useState<ShortLink | null>(null);
  const [selectedShareLink, setSelectedShareLink] = useState<ShortLink | null>(null);
  const [selectedQRLink, setSelectedQRLink] = useState<ShortLink | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Checkbox Selection & Bulk Actions
  const [selectedLinkIds, setSelectedLinkIds] = useState<Set<string>>(new Set());

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
      const listData = Array.isArray(res?.data) ? res.data : Array.isArray((res?.data as any)?.data) ? (res?.data as any).data : [];
      const rawLinks: ShortLink[] = listData.map((l: any) => ({
        id: l.id,
        userId: l.user_id || userId,
        slug: l.slug,
        domainName: l.domain_name || "lsho.cc",
        shortUrl: typeof window !== "undefined" ? `${window.location.origin}/r/${l.slug}` : `http://localhost:3000/r/${l.slug}`,
        targetUrl: l.target_url || l.targetUrl,
        clicksCount: l.clicks_count || l.clicksCount || l.clicks || 0,
        uniqueClicks: l.unique_clicks || l.uniqueClicks || 0,
        conversionsCount: l.conversions_count || l.conversionsCount || 0,
        revenue: l.revenue || 0,
        routingRules: l.routing_rules ? (typeof l.routing_rules === "string" ? JSON.parse(l.routing_rules) : l.routing_rules) : (l.routingRules || []),
        geoTargeting: l.geo_targeting ? (typeof l.geo_targeting === "string" ? JSON.parse(l.geo_targeting) : l.geo_targeting) : (l.geoTargeting || {}),
        deviceTargeting: l.device_targeting ? (typeof l.device_targeting === "string" ? JSON.parse(l.device_targeting) : l.device_targeting) : (l.deviceTargeting || {}),
        isPasswordProtected: Boolean(l.is_password_protected || l.isPasswordProtected || l.has_password || l.hasPassword || l.password),
        isCloaked: Boolean(l.is_cloaked || l.isCloaked),
        metaTitle: l.meta_title || l.metaTitle || l.og_title || l.ogTitle,
        ogTitle: l.og_title || l.ogTitle || l.meta_title || l.metaTitle,
        ogDescription: l.og_description || l.ogDescription,
        ogImage: l.og_image || l.ogImage,
        hideReferrer: Boolean(l.hide_referrer || l.hideReferrer),
        tags: l.tags ? (typeof l.tags === "string" ? JSON.parse(l.tags) : l.tags) : [],
        expiresAt: l.expires_at || l.expiresAt,
        isActive: !(
          l.is_active === 0 ||
          l.is_active === false ||
          l.is_active === "0" ||
          l.isActive === 0 ||
          l.isActive === false ||
          l.isActive === "0"
        ),
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

  // Click outside listener for tag dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(event.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    if (selectedLinkIds.size === filteredLinks.length && filteredLinks.length > 0) {
      setSelectedLinkIds(new Set());
    } else {
      setSelectedLinkIds(new Set(filteredLinks.map((l) => l.id)));
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
    setLinks((prev) => prev.filter((l) => !idsToDelete.includes(l.id)));
    setSelectedLinkIds((prev) => {
      const next = new Set(prev);
      idsToDelete.forEach((id) => next.delete(id));
      return next;
    });

    try {
      // 2. Perform API delete calls in parallel
      await Promise.all(idsToDelete.map((id) => cfDeleteLink(id, userId)));
      cfInvalidateCache("/api/links");
      showToast.success(
        idsToDelete.length > 1
          ? `${idsToDelete.length} liens supprimés avec succès.`
          : "Lien supprimé avec succès."
      );
      setDeleteTarget({ isOpen: false, ids: [], labels: [] });
      // 3. Background re-sync
      await loadLinks(true);
    } catch (err) {
      console.error("Delete error:", err);
      showToast.error("Erreur lors de la suppression.");
      await loadLinks();
    } finally {
      setIsDeleting(false);
    }
  };

  // Collect all unique tags
  const allTags = Array.from(
    new Set(links.flatMap((l) => l.tags || []))
  );

  // Filter links by search and selected tag
  const filteredLinks = links.filter((l) => {
    const matchesSearch =
      l.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.targetUrl.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.tags && l.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesTag =
      selectedTag === "all" || (l.tags && l.tags.includes(selectedTag));

    return matchesSearch && matchesTag;
  });

  const isAllSelected = filteredLinks.length > 0 && selectedLinkIds.size === filteredLinks.length;
  const isPartiallySelected = selectedLinkIds.size > 0 && !isAllSelected;

  if (status === "loading" || isLoading) {
    return <LinksPageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-6 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Mes Liens Courts</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Gérez, éditez et analysez vos {links.length} redirections actives avec QR Code et UTM.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            onClick={async () => {
              setIsRefreshing(true);
              cfInvalidateCache("/api/links");
              await loadLinks();
              setIsRefreshing(false);
              showToast.success("Liste des liens actualisée !");
            }}
            variant="outline"
            disabled={isRefreshing}
            className="h-10 px-3.5 text-xs font-semibold gap-2 border-[#27272a] bg-[#141416] hover:bg-white/5 text-neutral-300 hover:text-white cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-[#ff6600]" : "text-neutral-400"}`} />
            <span>Actualiser</span>
          </Button>

          <Button
            onClick={() => setIsCreateOpen(true)}
            variant="glow"
            className="font-bebas text-lg tracking-wide gap-1.5 shrink-0"
          >
            <Plus className="w-5 h-5" />
            <span>CRÉER UN LIEN</span>
          </Button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Rechercher par slug, URL de destination, ou tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-[10px] bg-[#141416] border border-[#222225] text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#ff6600]"
          />
        </div>

        {/* Tag Filter Dropdown */}
        <div className="relative shrink-0" ref={tagDropdownRef}>
          <button
            type="button"
            onClick={() => setIsTagDropdownOpen(!isTagDropdownOpen)}
            className="h-11 px-3.5 rounded-[10px] bg-[#141416] border border-[#222225] hover:border-[#333338] text-xs font-semibold text-white flex items-center justify-between gap-3 min-w-[170px] transition-colors cursor-pointer shadow-sm"
          >
            <div className="flex items-center gap-2 truncate">
              {selectedTag === "all" ? (
                <Globe2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              ) : (
                <Tag className="w-3.5 h-3.5 text-[#ff6600] shrink-0" />
              )}
              <span className="truncate">
                {selectedTag === "all" ? `Tous les liens (${links.length})` : `#${selectedTag}`}
              </span>
            </div>
            <ChevronDown
              className={`w-3.5 h-3.5 text-neutral-400 shrink-0 transition-transform duration-200 ${
                isTagDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {isTagDropdownOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-60 rounded-xl bg-[#18181c] border border-[#2a2a32] shadow-2xl shadow-black/90 py-1.5 z-40 animate-in fade-in zoom-in-95 duration-150 max-h-72 overflow-y-auto">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                Filtrer par catégorie / tag
              </div>

              {/* Option: Tous les liens */}
              <button
                type="button"
                onClick={() => {
                  setSelectedTag("all");
                  setIsTagDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 text-xs flex items-center justify-between transition-colors text-left cursor-pointer ${
                  selectedTag === "all"
                    ? "bg-[#ff6600]/15 text-[#ff6600] font-bold"
                    : "text-neutral-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-2">
                  <Globe2 className="w-3.5 h-3.5 text-cyan-400 md:text-[#ff6600]" />
                  <span>Tous les liens</span>
                </span>
                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-400">
                  {links.length}
                </span>
              </button>

              {allTags.length > 0 && <div className="h-px bg-[#26262e] my-1" />}

              {/* Individual Tag Options */}
              {allTags.map((t) => {
                const count = links.filter((l) => l.tags && l.tags.includes(t)).length;
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
                        ? "bg-[#ff6600]/15 text-[#ff6600] font-bold"
                        : "text-neutral-300 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Tag className="w-3 h-3 text-[#ff6600] shrink-0" />
                      <span className="truncate">#{t}</span>
                    </span>
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-neutral-400">
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedLinkIds.size > 0 && (
        <div className="rounded-xl bg-[#1c1414] border border-red-500/40 p-3.5 px-4.5 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xl shadow-red-950/40 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span className="text-xs font-bold text-white">
              {selectedLinkIds.size} {selectedLinkIds.size > 1 ? "liens sélectionnés" : "lien sélectionné"}
            </span>
            <button
              onClick={toggleSelectAll}
              className="text-[11px] text-neutral-400 hover:text-white underline ml-1 cursor-pointer"
            >
              {isAllSelected ? "Tout désélectionner" : `Sélectionner tout (${filteredLinks.length})`}
            </button>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={() => setSelectedLinkIds(new Set())}
              className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-neutral-300 text-xs font-medium transition-colors cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={promptDeleteBulk}
              className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Supprimer la sélection ({selectedLinkIds.size})</span>
            </button>
          </div>
        </div>
      )}

      {/* Links Container */}
      <div className="rounded-[12px] bg-[#141416] border border-[#222225] p-4 sm:p-6 shadow-xl">
        {filteredLinks.length === 0 ? (
          <div className="py-12 text-center text-xs text-neutral-500">
            Aucun lien trouvé pour cette recherche.
          </div>
        ) : (
          <>
            {/* 1. Mobile Cards Layout (< 768px) */}
            <div className="flex flex-col gap-3 md:hidden">
              {filteredLinks.map((link) => {
                const isCopied = copiedId === link.id;
                const isExpired = Boolean(link.expiresAt && new Date(link.expiresAt) < new Date());
                const isSelected = selectedLinkIds.has(link.id);

                return (
                  <div
                    key={link.id}
                    className={`rounded-2xl bg-[#18181c] border p-3.5 flex flex-col gap-2.5 transition-all ${
                      isSelected
                        ? "border-[#ff6600] bg-[#ff6600]/5 ring-1 ring-[#ff6600]/30 shadow-lg shadow-[#ff6600]/10"
                        : "border-[#27272a] hover:border-[#ff6600]/40"
                    }`}
                  >
                    {/* Header: Checkbox + Slug, Status Badge */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        {/* Mobile Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelectLink(link.id)}
                          aria-label={`Sélectionner ${link.slug}`}
                          className="w-4 h-4 rounded border-[#27272a] bg-[#1a1a1e] accent-[#ff6600] cursor-pointer shrink-0"
                        />
                        <span className={`w-2 h-2 rounded-full shrink-0 ${isExpired ? "bg-amber-400" : !link.isActive ? "bg-neutral-500" : "bg-emerald-400"}`}></span>
                        <span className="font-mono font-bold text-white text-sm truncate">
                          /{link.slug}
                        </span>
                      </div>
                      <div className="shrink-0">
                        {isExpired ? (
                          <Badge variant="expire">Expiré</Badge>
                        ) : !link.isActive ? (
                          <Badge variant="inactive">Inactif</Badge>
                        ) : (
                          <Badge variant="active">Actif</Badge>
                        )}
                      </div>
                    </div>

                    {/* Target URL */}
                    <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 bg-[#090b10] px-2.5 py-1.5 rounded-lg border border-[#222225] truncate">
                      <span className="text-[#ff6600] font-bold shrink-0">↳</span>
                      <span className="truncate">{link.targetUrl}</span>
                    </div>

                    {/* Tags if any */}
                    {link.tags && link.tags.length > 0 && (
                      <div className="flex items-center gap-1 flex-wrap">
                        {link.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Metrics & Actions Row */}
                    <div className="flex items-center justify-between pt-1 text-xs">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-white font-bold">
                          <span className="text-[#ff6600] font-mono text-sm">{formatNumber(link.clicksCount)}</span>
                          <span className="text-[10px] text-neutral-400 font-normal">clics</span>
                        </div>
                        <div className="flex items-center gap-1 text-neutral-300">
                          <span className="font-mono text-sm">{formatNumber(link.uniqueClicks || 0)}</span>
                          <span className="text-[10px] text-neutral-400">uniques</span>
                        </div>
                      </div>

                      {/* Quick Action Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleCopy(link)}
                          className="px-2.5 py-1 rounded-lg bg-[#ff6600]/15 text-[#ff771a] border border-[#ff6600]/30 hover:bg-[#ff6600] hover:text-white text-[10.5px] font-bold transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span>Copié</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copier</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setSelectedQRLink(link)}
                          className="p-1.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white"
                          title="QR Code"
                        >
                          <QrCode className="w-3.5 h-3.5 text-[#ff6600]" />
                        </button>
                        <button
                          onClick={() => setSelectedEditLink(link)}
                          className="p-1.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white"
                          title="Modifier"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedShareLink(link)}
                          className="p-1.5 rounded-lg bg-white/5 text-neutral-400 hover:text-white"
                          title="Partager"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => promptDeleteSingle(link)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 cursor-pointer transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. Desktop Table (>= 768px) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-400">
                <thead>
                  <tr className="border-b border-[#222225] text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                    <th className="pb-3 pl-3 w-10">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = isPartiallySelected;
                        }}
                        onChange={toggleSelectAll}
                        aria-label="Sélectionner tous les liens"
                        className="w-4 h-4 rounded border-[#27272a] bg-[#1a1a1e] accent-[#ff6600] cursor-pointer"
                      />
                    </th>
                    <th className="pb-3 pl-2">Lien & Destination</th>
                    <th className="pb-3">URL Courte</th>
                    <th className="pb-3 text-center">Options</th>
                    <th className="pb-3 text-right pr-4">Clics</th>
                    <th className="pb-3">Statut</th>
                    <th className="pb-3 text-right pr-2">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#222225]">
                  {filteredLinks.map((link) => {
                    const isCopied = copiedId === link.id;
                    const isExpired = Boolean(link.expiresAt && new Date(link.expiresAt) < new Date());
                    const isSelected = selectedLinkIds.has(link.id);

                    return (
                      <tr
                        key={link.id}
                        className={`hover:bg-white/[0.02] transition-colors group ${
                          isSelected ? "bg-[#ff6600]/10 border-l-2 border-l-[#ff6600]" : ""
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-4 pl-3 w-10">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleSelectLink(link.id)}
                            aria-label={`Sélectionner ${link.slug}`}
                            className="w-4 h-4 rounded border-[#27272a] bg-[#1a1a1e] accent-[#ff6600] cursor-pointer"
                          />
                        </td>

                        {/* Name & Target URL */}
                        <td className="py-4 pl-2 max-w-xs">
                          <div className="flex flex-col">
                            <span className="font-bold text-white text-sm group-hover:text-[#ff6600] transition-colors">
                              {link.slug}
                            </span>
                            <span className="text-[11px] text-neutral-500 truncate" title={link.targetUrl}>
                              → {link.targetUrl}
                            </span>
                            {link.tags && link.tags.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-1.5">
                                {link.tags.map((t) => (
                                  <span
                                    key={t}
                                    className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-neutral-800 text-neutral-400"
                                  >
                                    #{t}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Short URL */}
                        <td className="py-4 font-mono text-[#ff6600] font-medium">
                          {link.domainName}/{link.slug}
                        </td>

                        {/* Options icons (Geo, Device, Lock, Cloak) */}
                        <td className="py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5 text-neutral-400">
                            {link.geoTargeting && Object.keys(link.geoTargeting).length > 0 && (
                              <span title="Ciblage par pays actif">
                                <Globe2 className="w-3.5 h-3.5 text-sky-400" />
                              </span>
                            )}
                            {link.deviceTargeting && Object.values(link.deviceTargeting).some(Boolean) && (
                              <span title="Ciblage par appareil actif">
                                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                              </span>
                            )}
                            {link.isPasswordProtected && (
                              <span title="Protégé par mot de passe">
                                <Lock className="w-3.5 h-3.5 text-amber-400" />
                              </span>
                            )}
                            {link.isCloaked && (
                              <span title="Masquage Cloaking actif">
                                <EyeOff className="w-3.5 h-3.5 text-purple-400" />
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Clics */}
                        <td className="py-4 text-right pr-4 font-bold text-white font-mono text-sm">
                          {formatNumber(link.clicksCount)}
                        </td>

                        {/* Statut */}
                        <td className="py-4">
                          {isExpired ? (
                            <Badge variant="expire">Expiré</Badge>
                          ) : !link.isActive ? (
                            <Badge variant="inactive">Inactif</Badge>
                          ) : (
                            <Badge variant="active">Actif</Badge>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-4 text-right pr-2">
                          <div className="flex items-center justify-end gap-1 text-neutral-400">
                            {/* Copy */}
                            <button
                              onClick={() => handleCopy(link)}
                              title="Copier le lien"
                              className="p-1.5 rounded-[6px] hover:bg-white/10 hover:text-white transition-colors cursor-pointer"
                            >
                              {isCopied ? (
                                <Check className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>

                            {/* QR Code */}
                            <button
                              onClick={() => setSelectedQRLink(link)}
                              title="Afficher et personnaliser le QR Code"
                              className="p-1.5 rounded-[6px] hover:bg-white/10 hover:text-[#ff6600] transition-colors cursor-pointer"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>

                            {/* Open Short Link */}
                            <a
                              href={link.shortUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Tester la redirection courte"
                              className="p-1.5 rounded-[6px] hover:bg-white/10 hover:text-[#ff6600] transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>

                            {/* Edit Link */}
                            <button
                              onClick={() => setSelectedEditLink(link)}
                              title="Modifier le lien"
                              className="p-1.5 rounded-[6px] hover:bg-white/10 hover:text-[#ff6600] transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            {/* Share */}
                            <button
                              onClick={() => setSelectedShareLink(link)}
                              title="Partager"
                              className="p-1.5 rounded-[6px] hover:bg-white/10 hover:text-[#ff6600] transition-colors cursor-pointer"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>

                            {/* Delete */}
                            <button
                              onClick={() => promptDeleteSingle(link)}
                              title="Supprimer"
                              className="p-1.5 rounded-[6px] hover:bg-red-500/20 hover:text-red-400 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <LinkCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => loadLinks()}
      />

      <LinkEditModal
        isOpen={Boolean(selectedEditLink)}
        link={selectedEditLink}
        onClose={() => setSelectedEditLink(null)}
        onSuccess={() => loadLinks()}
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
