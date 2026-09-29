"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Clock,
  LayoutDashboard,
  Link2,
  BarChart2,
  Globe2,
  CreditCard,
  Activity,
  QrCode,
  KeyRound,
  Settings,
  FileText,
  Terminal,
  ArrowUpRight,
  CornerDownLeft,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { getAllDocFeatures, DocFeature } from "@/lib/docs-data";

export type CommandBadgeType = "Doc" | "Link" | "Analytics" | "Page";

export interface CommandItem {
  id: string;
  title: string;
  href: string;
  badge: CommandBadgeType;
  meta: string;
  description: string;
  keywords: string[];
  iconType:
    | "dashboard"
    | "link"
    | "analytics"
    | "geo"
    | "revenue"
    | "live"
    | "qr"
    | "domains"
    | "api"
    | "settings"
    | "doc"
    | "endpoint";
}

interface ReuiCommandModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialQuery?: string;
}

const RECENT_STORAGE_KEY = "lshorter_reui_recent_searches_v1";

const DASHBOARD_AND_ANALYTICS_ITEMS: CommandItem[] = [
  {
    id: "page-dashboard",
    title: "Dashboard",
    href: "/dashboard",
    badge: "Page",
    meta: "Overview & KPIs",
    description: "Main dashboard overview, performance metrics, and quick link creation",
    keywords: ["home", "overview", "kpi", "metrics", "summary", "dashboard"],
    iconType: "dashboard",
  },
  {
    id: "page-short-links",
    title: "Short Links",
    href: "/dashboard/links",
    badge: "Page",
    meta: "Link management",
    description: "Create, edit, filter, protect, and manage shortened edge URLs",
    keywords: ["links", "urls", "slugs", "shorten", "redirect", "pin", "ab testing", "expiration"],
    iconType: "link",
  },
  {
    id: "analytics-traffic",
    title: "Traffic Overview",
    href: "/dashboard/analytics",
    badge: "Analytics",
    meta: "Clicks & devices",
    description: "Detailed click telemetry, top referrers, browsers, OS, and time-series charts",
    keywords: ["analytics", "traffic", "clicks", "referrers", "devices", "browsers", "os", "stats"],
    iconType: "analytics",
  },
  {
    id: "analytics-geo",
    title: "Geography & Continents",
    href: "/dashboard/analytics/geo",
    badge: "Analytics",
    meta: "Global heatmaps",
    description: "Interactive continent vector map, ISO country distribution, and country-level click routing",
    keywords: ["geography", "continents", "countries", "map", "location", "geo", "regions"],
    iconType: "geo",
  },
  {
    id: "analytics-revenue",
    title: "Customers & Revenue",
    href: "/dashboard/analytics/revenue",
    badge: "Analytics",
    meta: "Conversions & EPC",
    description: "Conversion attribution, revenue tracking, average order value (AOV), and earnings per click",
    keywords: ["customers", "revenue", "conversions", "sales", "epc", "aov", "roi", "money", "attribution"],
    iconType: "revenue",
  },
  {
    id: "analytics-live",
    title: "Live Click Stream",
    href: "/dashboard/analytics/live",
    badge: "Analytics",
    meta: "Real-time edge feed",
    description: "Millisecond-precision live click stream directly from global Cloudflare edge nodes",
    keywords: ["live", "realtime", "stream", "events", "feed", "edge", "pulse"],
    iconType: "live",
  },
  {
    id: "page-qr-studio",
    title: "QR Studio",
    href: "/dashboard/qr-code",
    badge: "Page",
    meta: "Vector QR codes",
    description: "Customize high-resolution PNG and SVG QR codes with colors, logos, and quiet zones",
    keywords: ["qr", "qrcode", "studio", "barcode", "svg", "png", "scanner"],
    iconType: "qr",
  },
  {
    id: "page-custom-domains",
    title: "Custom Domains",
    href: "/dashboard/domains",
    badge: "Page",
    meta: "Branded DNS & SSL",
    description: "Connect custom branded short domains with automated edge SSL certificates",
    keywords: ["domains", "dns", "cname", "ssl", "custom domain", "branded", "whitelabel"],
    iconType: "domains",
  },
  {
    id: "page-api-sdk",
    title: "API & SDK",
    href: "/dashboard/api-sdk",
    badge: "Page",
    meta: "REST keys & tokens",
    description: "Generate developer API keys, inspect TypeScript SDK usage, and test REST endpoints",
    keywords: ["api", "sdk", "token", "bearer", "developer", "rest", "keys", "webhook"],
    iconType: "api",
  },
  {
    id: "page-settings",
    title: "Settings",
    href: "/dashboard/settings",
    badge: "Page",
    meta: "Account & security",
    description: "Manage profile, subscription billing, 2FA security, webhooks, and retargeting pixels",
    keywords: ["settings", "account", "profile", "billing", "security", "2fa", "password", "preferences", "gdpr"],
    iconType: "settings",
  },
];

function renderItemIcon(iconType: CommandItem["iconType"], className = "h-4 w-4") {
  switch (iconType) {
    case "dashboard":
      return <LayoutDashboard className={className} />;
    case "link":
      return <Link2 className={className} />;
    case "analytics":
      return <BarChart2 className={className} />;
    case "geo":
      return <Globe2 className={className} />;
    case "revenue":
      return <CreditCard className={className} />;
    case "live":
      return <Activity className={className} />;
    case "qr":
      return <QrCode className={className} />;
    case "domains":
      return <Globe2 className={className} />;
    case "api":
      return <KeyRound className={className} />;
    case "settings":
      return <Settings className={className} />;
    case "endpoint":
      return <Terminal className={className} />;
    case "doc":
    default:
      return <FileText className={className} />;
  }
}

/**
 * Intelligent fuzzy & multi-token scoring across title, description, slug, keywords, and API endpoints
 */
function scoreCommandItem(item: CommandItem, rawQuery: string): number {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return 1;

  const title = item.title.toLowerCase();
  const meta = item.meta.toLowerCase();
  const desc = item.description.toLowerCase();
  const keywords = item.keywords.join(" ").toLowerCase();
  const fullText = `${title} ${meta} ${desc} ${keywords}`;

  let score = 0;

  // Direct matches in title
  if (title === query) score += 120;
  else if (title.startsWith(query)) score += 90;
  else if (title.includes(query)) score += 70;

  // Direct matches in meta or keywords
  if (meta.includes(query)) score += 45;
  if (keywords.includes(query)) score += 40;
  if (desc.includes(query)) score += 25;

  // Multi-word token matching
  const tokens = query.split(/\s+/).filter(Boolean);
  if (tokens.length > 1) {
    let matchedTokens = 0;
    for (const token of tokens) {
      if (title.includes(token)) {
        score += 25;
        matchedTokens++;
      } else if (fullText.includes(token)) {
        score += 12;
        matchedTokens++;
      }
    }
    if (matchedTokens === tokens.length) {
      score += 35;
    }
  }

  // Subsequence character fuzzy match on title/keywords if no direct hit yet
  if (score === 0 && query.length >= 2) {
    let qIdx = 0;
    let consecutive = 0;
    let fuzzyBonus = 0;
    for (let i = 0; i < title.length && qIdx < query.length; i++) {
      if (title[i] === query[qIdx]) {
        qIdx++;
        consecutive++;
        fuzzyBonus += consecutive * 3;
      } else {
        consecutive = 0;
      }
    }
    if (qIdx === query.length) {
      score += 15 + fuzzyBonus;
    }
  }

  return score;
}

export function ReuiCommandModal({
  isOpen: controlledOpen,
  onClose,
  initialQuery = "",
}: ReuiCommandModalProps) {
  const router = useRouter();
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentIds, setRecentIds] = useState<string[]>([
    "doc-sdk-quickstart",
    "analytics-traffic",
    "page-short-links",
  ]);
  const [shortLinks, setShortLinks] = useState<CommandItem[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listContainerRef = useRef<HTMLDivElement>(null);

  const isOpen = Boolean(controlledOpen || internalOpen);

  const handleClose = useCallback(() => {
    setInternalOpen(false);
    onClose?.();
  }, [onClose]);

  // Load recent items from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setRecentIds(parsed.slice(0, 5));
        }
      }
    } catch {
      // ignore storage errors
    }
  }, [isOpen]);

  const recordRecentItem = useCallback((id: string) => {
    try {
      setRecentIds((prev) => {
        const next = [id, ...prev.filter((item) => item !== id)].slice(0, 5);
        localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(next));
        return next;
      });
    } catch {
      // ignore storage errors
    }
  }, []);

  // Build Documentation items from lib/docs-data.ts (excluding any removed profile API docs)
  const docItems = useMemo<CommandItem[]>(() => {
    const features: DocFeature[] = getAllDocFeatures().filter(
      (f) => !f.slug.toLowerCase().includes("profile")
    );
    const items: CommandItem[] = [];

    for (const doc of features) {
      const endpointKeywords =
        doc.apiEndpoints
          ?.filter((ep) => !ep.path.toLowerCase().includes("/profile"))
          .flatMap((ep) => [ep.method, ep.path, ep.name, ep.description]) || [];

      const endpointCount =
        doc.apiEndpoints?.filter((ep) => !ep.path.toLowerCase().includes("/profile")).length || 0;

      items.push({
        id: `doc-${doc.slug}`,
        title: doc.title,
        href: `/docs/${doc.slug}`,
        badge: "Doc",
        meta: endpointCount > 0 ? `${endpointCount} API endpoints · ${doc.readTime}` : doc.readTime,
        description: doc.subtitle || doc.description,
        keywords: [
          doc.slug,
          doc.title,
          doc.description,
          ...doc.keyPoints.map((kp) => kp.title),
          ...endpointKeywords,
        ],
        iconType: "doc",
      });

      // Also index individual API endpoints for instant developer search
      if (doc.apiEndpoints) {
        for (const ep of doc.apiEndpoints) {
          if (ep.path.toLowerCase().includes("/profile")) continue;
          items.push({
            id: `ep-${doc.slug}-${ep.method}-${ep.path}`,
            title: `${ep.name} (${ep.method} ${ep.path})`,
            href: `/docs/${doc.slug}`,
            badge: "Doc",
            meta: `${ep.method} ${ep.path}`,
            description: ep.description,
            keywords: [
              ep.method,
              ep.path,
              ep.name,
              doc.slug,
              doc.title,
              ...(ep.bodyParams?.map((p) => p.name) || []),
              ...(ep.queryParams?.map((p) => p.name) || []),
            ],
            iconType: "endpoint",
          });
        }
      }
    }

    return items;
  }, []);

  // Fetch User's Short Links from /api/links (via cfGetLinks cache or fetch) when modal opens
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    async function loadLinks() {
      try {
        const resp = await fetch("/api/links");
        if (!resp.ok) return;
        const res = await resp.json();
        const rawLinks = Array.isArray(res)
          ? res
          : Array.isArray((res as any)?.data)
          ? (res as any).data
          : Array.isArray((res as any)?.links)
          ? (res as any).links
          : [];

        if (cancelled) return;

        const mapped: CommandItem[] = rawLinks.slice(0, 40).map((lnk: any) => {
          const slug = String(lnk.slug || "");
          const dest = String(lnk.originalUrl || lnk.url || "");
          let host = dest;
          try {
            host = new URL(dest).hostname.replace(/^www\./, "");
          } catch {}
          const clicks = Number(lnk.clicks ?? 0);

          return {
            id: `link-${lnk.id || slug}`,
            title: `/${slug}`,
            href: `/dashboard/links?search=${encodeURIComponent(slug)}`,
            badge: "Link" as const,
            meta: `${clicks.toLocaleString()} clicks${host ? ` · ${host}` : ""}`,
            description: dest || `Short link /${slug}`,
            keywords: [
              slug,
              dest,
              host,
              lnk.shortUrl || "",
              ...(Array.isArray(lnk.tags) ? lnk.tags : []),
            ],
            iconType: "link" as const,
          };
        });

        setShortLinks(mapped);
      } catch {
        // User might be unauthenticated on public /docs page; silently skip link items
      }
    }

    loadLinks();
    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Global Cmd+K / Ctrl+K shortcut & custom event listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key.toLowerCase() === "k" || e.code === "KeyK")) {
        e.preventDefault();
        e.stopPropagation();
        if (isOpen) {
          handleClose();
        } else {
          setInternalOpen(true);
          window.dispatchEvent(new CustomEvent("lshorter:open-command-modal"));
        }
      } else if (e.key === "Escape" && isOpen) {
        e.preventDefault();
        handleClose();
      }
    };

    const handleCustomOpen = () => {
      setInternalOpen(true);
    };

    window.addEventListener("keydown", handleGlobalKeyDown);
    window.addEventListener("lshorter:open-command-modal", handleCustomOpen);
    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
      window.removeEventListener("lshorter:open-command-modal", handleCustomOpen);
    };
  }, [controlledOpen, isOpen, handleClose, onClose]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 20);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // All available items
  const allCatalogItems = useMemo(() => {
    return [...DASHBOARD_AND_ANALYTICS_ITEMS, ...shortLinks, ...docItems];
  }, [shortLinks, docItems]);

  // Resolve recent items
  const recentItems = useMemo(() => {
    const byId = new Map(allCatalogItems.map((item) => [item.id, item]));
    return recentIds
      .map((id) => byId.get(id))
      .filter((item): item is CommandItem => Boolean(item));
  }, [allCatalogItems, recentIds]);

  // Filtered & ranked results
  const sections = useMemo(() => {
    const trimmed = query.trim();
    if (!trimmed) {
      const browsePages = DASHBOARD_AND_ANALYTICS_ITEMS;
      const browseDocs = docItems.filter((d) => d.iconType === "doc").slice(0, 8);
      const browseLinks = shortLinks.slice(0, 5);

      const resultSections: Array<{ title: string; isRecent?: boolean; items: CommandItem[] }> = [];

      if (recentItems.length > 0) {
        resultSections.push({
          title: "Recent",
          isRecent: true,
          items: recentItems,
        });
      }

      resultSections.push({
        title: "Browse — Pages & Analytics",
        items: browsePages,
      });

      if (browseLinks.length > 0) {
        resultSections.push({
          title: "Short Links",
          items: browseLinks,
        });
      }

      resultSections.push({
        title: "Documentation",
        items: browseDocs,
      });

      return resultSections;
    }

    const scored = allCatalogItems
      .map((item) => ({ item, score: scoreCommandItem(item, trimmed) }))
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score);

    const matchedPages = scored
      .filter((s) => s.item.badge === "Page" || s.item.badge === "Analytics")
      .slice(0, 6)
      .map((s) => s.item);

    const matchedLinks = scored
      .filter((s) => s.item.badge === "Link")
      .slice(0, 6)
      .map((s) => s.item);

    const matchedDocs = scored
      .filter((s) => s.item.badge === "Doc")
      .slice(0, 8)
      .map((s) => s.item);

    const resultSections: Array<{ title: string; isRecent?: boolean; items: CommandItem[] }> = [];

    if (matchedPages.length > 0) {
      resultSections.push({ title: "Pages & Analytics", items: matchedPages });
    }
    if (matchedLinks.length > 0) {
      resultSections.push({ title: "Short Links", items: matchedLinks });
    }
    if (matchedDocs.length > 0) {
      resultSections.push({ title: "Documentation & API", items: matchedDocs });
    }

    return resultSections;
  }, [query, allCatalogItems, docItems, shortLinks, recentItems]);

  const flatItems = useMemo(() => {
    return sections.flatMap((sec) =>
      sec.items.map((item) => ({
        ...item,
        _isRecent: Boolean(sec.isRecent),
      }))
    );
  }, [sections]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleSelectItem = useCallback(
    (item: CommandItem) => {
      recordRecentItem(item.id);
      handleClose();
      router.push(item.href);
    },
    [recordRecentItem, handleClose, router]
  );

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (flatItems.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = flatItems[selectedIndex];
      if (target) {
        handleSelectItem(target);
      }
    }
  };

  // Keep active row scrolled into view
  useEffect(() => {
    const container = listContainerRef.current;
    if (!container) return;
    const activeEl = container.querySelector<HTMLElement>(`[data-cmd-index="${selectedIndex}"]`);
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest" });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  let runningIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[8vh] sm:pt-[12vh] px-4 bg-black/50 dark:bg-black/70 backdrop-blur-xs animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          handleClose();
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command Search Modal"
        className="w-full max-w-[640px] rounded-[12px] bg-white text-[#09090B] border border-black/[0.08] dark:bg-[#141416] dark:text-[#FAFAFA] dark:border-white/[0.1] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.22)] dark:shadow-[0_24px_60px_-12px_rgba(0,0,0,0.75)] overflow-hidden flex flex-col"
      >
        {/* Top Search Input Bar */}
        <div className="flex items-center gap-3 px-4 h-[54px] border-b border-black/[0.08] dark:border-white/[0.1]">
          <Search className="h-4 w-4 text-[#71717A] dark:text-[#A1A1AA] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            placeholder="Search links, analytics, domains, docs, settings..."
            className="w-full bg-transparent text-[14px] text-[#09090B] dark:text-[#FAFAFA] placeholder:text-[#71717A] dark:placeholder:text-[#71717A] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="text-[11px] font-medium px-2 py-0.5 rounded-[6px] text-[#71717A] hover:text-[#09090B] dark:hover:text-[#FAFAFA] hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close command search"
            className="flex h-7 w-7 items-center justify-center rounded-[7px] text-[#71717A] hover:text-[#09090B] dark:text-[#A1A1AA] dark:hover:text-[#FAFAFA] hover:bg-black/[0.05] dark:hover:bg-white/[0.07] transition-colors cursor-pointer shrink-0"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable Results List */}
        <div
          ref={listContainerRef}
          className="max-h-[400px] overflow-y-auto p-2 space-y-3"
        >
          {flatItems.length === 0 ? (
            <div className="py-12 px-4 text-center">
              <p className="text-sm font-medium text-[#09090B] dark:text-[#FAFAFA]">
                No results found for &ldquo;{query}&rdquo;
              </p>
              <p className="mt-1 text-xs text-[#71717A] dark:text-[#A1A1AA]">
                Try searching for documentation topics, API endpoints, analytics views, or link slugs.
              </p>
            </div>
          ) : (
            sections.map((section) => (
              <div key={section.title} className="space-y-0.5">
                <div className="flex items-center justify-between px-2.5 py-1">
                  <span className="text-[11px] font-medium tracking-wide uppercase text-[#71717A] dark:text-[#8E8E93]">
                    {section.title}
                  </span>
                  {section.isRecent && (
                    <button
                      type="button"
                      onClick={() => {
                        setRecentIds([]);
                        try {
                          localStorage.removeItem(RECENT_STORAGE_KEY);
                        } catch {}
                      }}
                      className="text-[11px] text-[#71717A] hover:text-[#09090B] dark:hover:text-[#FAFAFA] transition-colors cursor-pointer"
                    >
                      Clear recent
                    </button>
                  )}
                </div>

                {section.items.map((item) => {
                  runningIndex++;
                  const itemIndex = runningIndex;
                  const isSelected = itemIndex === selectedIndex;

                  return (
                    <button
                      key={`${section.title}-${item.id}`}
                      type="button"
                      data-cmd-index={itemIndex}
                      onMouseEnter={() => setSelectedIndex(itemIndex)}
                      onClick={() => handleSelectItem(item)}
                      className={`w-full flex items-center justify-between gap-3 px-2.5 py-2 rounded-[8px] text-left transition-colors cursor-pointer ${
                        isSelected
                          ? "bg-black/[0.05] dark:bg-white/[0.07] text-[#09090B] dark:text-[#FAFAFA]"
                          : "text-[#27272A] dark:text-[#D4D4D8] hover:bg-black/[0.03] dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      {/* Left: Monochrome Icon + Title + Sober Badge */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[6px] border ${
                            isSelected
                              ? "border-black/[0.1] bg-white dark:border-white/[0.14] dark:bg-[#1C1C1F] text-[#09090B] dark:text-[#FAFAFA]"
                              : "border-black/[0.06] bg-black/[0.02] dark:border-white/[0.07] dark:bg-white/[0.03] text-[#71717A] dark:text-[#A1A1AA]"
                          }`}
                        >
                          {section.isRecent ? (
                            <Clock className="h-3.5 w-3.5" />
                          ) : (
                            renderItemIcon(item.iconType, "h-3.5 w-3.5")
                          )}
                        </span>

                        <span className="text-[13.5px] font-medium truncate">
                          {item.title}
                        </span>

                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-[5px] text-[10.5px] font-medium leading-none shrink-0 bg-black/[0.04] dark:bg-white/[0.06] text-[#52525B] dark:text-[#A1A1AA] border border-black/[0.06] dark:border-white/[0.08]">
                          {item.badge}
                        </span>
                      </div>

                      {/* Right: Metadata description / count ONLY (NO Ctrl+... shortcuts) */}
                      <div className="flex items-center gap-2 shrink-0 max-w-[42%]">
                        <span className="text-[12px] text-[#71717A] dark:text-[#8E8E93] truncate">
                          {item.meta}
                        </span>
                        <ArrowUpRight
                          className={`h-3.5 w-3.5 shrink-0 transition-opacity ${
                            isSelected
                              ? "opacity-80 text-[#09090B] dark:text-[#FAFAFA]"
                              : "opacity-0"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Bottom Footer Bar with Navigation Hints */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-black/[0.08] dark:border-white/[0.1] bg-[#FAFAFA] dark:bg-[#101012] text-[11.5px] text-[#71717A] dark:text-[#8E8E93]">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-[4px] border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#18181B] px-1 text-[10.5px] font-mono text-[#09090B] dark:text-[#FAFAFA]">
                ↵
              </kbd>
              <span>Open</span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center justify-center rounded-[4px] border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#18181B] px-1 text-[10.5px] font-mono text-[#09090B] dark:text-[#FAFAFA]">
                <ArrowUp className="h-2.5 w-2.5" />
              </kbd>
              <kbd className="inline-flex h-5 items-center justify-center rounded-[4px] border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#18181B] px-1 text-[10.5px] font-mono text-[#09090B] dark:text-[#FAFAFA]">
                <ArrowDown className="h-2.5 w-2.5" />
              </kbd>
              <span>Navigate</span>
            </span>

            <span className="inline-flex items-center gap-1.5">
              <kbd className="inline-flex h-5 items-center justify-center rounded-[4px] border border-black/[0.1] dark:border-white/[0.12] bg-white dark:bg-[#18181B] px-1.5 text-[10.5px] font-mono text-[#09090B] dark:text-[#FAFAFA]">
                esc
              </kbd>
              <span>Close</span>
            </span>
          </div>

          <span className="hidden sm:inline text-[11px] text-[#71717A] dark:text-[#8E8E93]">
            {flatItems.length} {flatItems.length === 1 ? "item" : "items"}
          </span>
        </div>
      </div>
    </div>
  );
}
