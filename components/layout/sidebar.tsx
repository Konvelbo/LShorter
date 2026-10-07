"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Link2,
  QrCode,
  BarChart2,
  Globe2,
  Settings,
  FileText,
  Plus,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  cfGetAnalytics,
  cfGetLinks,
  cfInvalidateCache,
} from "@/lib/cloudflare-api";
import { LinkCreateModal } from "@/components/dashboard/link-create-modal";
import { FeedbackModal } from "@/components/feedback/feedback-modal";
import { getPlanDefinition } from "@/src/config/pricing";

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
  { name: "Documentation", href: "/docs", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(
    api.users.getCurrentUser,
    userId ? { userId } : "skip",
  );
  const [isCreateLinkOpen, setIsCreateLinkOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [currentTabParam, setCurrentTabParam] = useState<string>("");
  const [liveClicks, setLiveClicks] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const uId = session?.user?.id;
        if (uId) {
          const saved = localStorage.getItem(`lshorter_live_clicks_${uId}`);
          if (saved !== null && !isNaN(Number(saved))) return Number(saved);
        }
      } catch {}
    }
    return 0;
  });
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({
    Dashboard: true,
    Analytics: false,
    Settings: false,
  });

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

    if (pathname.startsWith("/dashboard/settings")) {
      setOpenMenus((prev) => ({ ...prev, Settings: true }));
    } else if (pathname.startsWith("/dashboard/analytics")) {
      setOpenMenus((prev) => ({ ...prev, Dashboard: true, Analytics: true }));
    }

    return () => {
      window.removeEventListener("popstate", syncTabFromWindow);
      window.removeEventListener(
        "lshorter_settings_tab_change",
        handleSettingsTabEvent,
      );
    };
  }, [pathname]);

  useEffect(() => {
    const onToggleSidebar = () => setIsCollapsed((prev) => !prev);
    window.addEventListener("lshorter:toggle-sidebar", onToggleSidebar);
    return () =>
      window.removeEventListener("lshorter:toggle-sidebar", onToggleSidebar);
  }, []);

  // Synchronisation des clics mensuels avec invalidation du cache & events
  useEffect(() => {
    if (!userId) {
      setLiveClicks(0);
      return;
    }

    try {
      const saved = localStorage.getItem(`lshorter_live_clicks_${userId}`);
      if (saved !== null && !isNaN(Number(saved))) {
        setLiveClicks(Number(saved));
      }
    } catch {}

    const fetchLiveClicks = async (forceRefresh = false) => {
      try {
        if (forceRefresh) {
          cfInvalidateCache("/api/links");
          cfInvalidateCache("/api/analytics");
        }
        const [linksRes, analytics30dRes] = await Promise.all([
          cfGetLinks(userId, forceRefresh).catch(() => null),
          cfGetAnalytics(userId, "30d", undefined, forceRefresh).catch(
            () => null,
          ),
        ]);

        const lList = Array.isArray(linksRes?.data)
          ? linksRes.data
          : Array.isArray((linksRes?.data as any)?.data)
            ? (linksRes?.data as any).data
            : [];

        const sumClicksFromLinks = lList.reduce(
          (acc: number, l: any) =>
            acc +
            (Number(l.clicks_count) ||
              Number(l.clicksCount) ||
              Number(l.clicks) ||
              0),
          0,
        );

        const analyticsClicks30d = Number(
          analytics30dRes?.data?.totalClicks ??
            analytics30dRes?.data?.total_clicks ??
            0,
        );

        // Réactivité immédiate : maximum entre agrégation 30j et cumul direct des liens
        const serverClicks = Math.max(
          analyticsClicks30d,
          sumClicksFromLinks,
        );

        setLiveClicks((prev) => {
          const resolved = Math.max(prev ?? 0, serverClicks);
          try {
            localStorage.setItem(
              `lshorter_live_clicks_${userId}`,
              String(resolved),
            );
          } catch {}
          return resolved;
        });
      } catch (err) {
        console.warn("[Sidebar] Error fetching live clicks:", err);
      }
    };

    fetchLiveClicks();

    // Incrémentation optimiste immédiate lors d'un clic dans l'UI
    const handleLinkClicked = () => {
      setLiveClicks((prev) => {
        const next = (prev ?? 0) + 1;
        try {
          localStorage.setItem(`lshorter_live_clicks_${userId}`, String(next));
        } catch {}
        return next;
      });
      setTimeout(() => fetchLiveClicks(false), 2000);
    };

    const handleSyncedEvent = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (typeof detail?.clicks === "number") {
        setLiveClicks((prev) => {
          const resolved = Math.max(prev ?? 0, detail.clicks);
          try {
            localStorage.setItem(`lshorter_live_clicks_${userId}`, String(resolved));
          } catch {}
          return resolved;
        });
      }
    };

    // Polling modéré (toutes les 90s) pour synchroniser en tâche de fond sans saturer Cloudflare D1
    const pollInterval = setInterval(() => {
      if (
        typeof document !== "undefined" &&
        document.visibilityState === "hidden"
      )
        return;
      fetchLiveClicks(false);
    }, 90000);

    window.addEventListener("lshorter_live_clicks_synced", handleSyncedEvent);
    window.addEventListener("lshorter_data_change", () =>
      fetchLiveClicks(true),
    );
    window.addEventListener("lshorter_links_updated", () =>
      fetchLiveClicks(true),
    );
    window.addEventListener("lshorter_link_clicked", handleLinkClicked);
    window.addEventListener("focus", () => fetchLiveClicks(false));

    return () => {
      clearInterval(pollInterval);
      window.removeEventListener(
        "lshorter_live_clicks_synced",
        handleSyncedEvent,
      );
      window.removeEventListener("lshorter_data_change", () =>
        fetchLiveClicks(true),
      );
      window.removeEventListener("lshorter_links_updated", () =>
        fetchLiveClicks(true),
      );
      window.removeEventListener("lshorter_link_clicked", handleLinkClicked);
      window.removeEventListener("focus", () => fetchLiveClicks(true));
    };
  }, [userId]);

  const plan = (
    (convexUser?.plan as string) ||
    ((session?.user as any)?.plan as string) ||
    "FREEMIUM"
  ).toUpperCase();
  const planNormalized = (plan === "FREEMIUM" ? "FREE" : plan) as
    "FREE" | "FREEMIUM" | "PRO" | "BUSINESS" | "ENTERPRISE";
  const planDef = getPlanDefinition(planNormalized);
  const clicksThisMonth = typeof liveClicks === "number" ? liveClicks : 0;
  const clicksLimit =
    plan === "ENTERPRISE"
      ? -1
      : plan === "BUSINESS"
        ? 500_000
        : plan === "PRO"
          ? 150_000
          : 10_000;

  // Calcul sobre et précis du pourcentage (ex: 0.03% pour 49/150,000 au lieu de 1% erroné)
  const rawClicksRatio =
    clicksLimit > 0 ? (clicksThisMonth / clicksLimit) * 100 : 0;
  const clicksPercent = Math.min(100, Math.round(rawClicksRatio));
  const formatSidebarPercentage = (used: number, limit: number): string => {
    if (limit === -1) return "Unlimited";
    if (used <= 0) return "0%";
    const ratio = (used / limit) * 100;
    if (ratio < 0.01) {
      return `${ratio.toFixed(3)}%`;
    }
    if (ratio < 1) {
      return `${ratio.toFixed(2)}%`;
    }
    if (ratio < 10 && ratio % 1 !== 0) {
      return `${ratio.toFixed(1)}%`;
    }
    return `${Math.min(100, Math.round(ratio))}%`;
  };

  const clicksPercentLabel = formatSidebarPercentage(
    clicksThisMonth,
    clicksLimit,
  );

  const isOverage =
    clicksLimit !== -1 &&
    clicksThisMonth > clicksLimit &&
    (plan === "PRO" || plan === "BUSINESS");

  // Largeur visible sobre et fluide de la barre de progression
  const barWidth =
    clicksLimit === -1
      ? 0
      : clicksThisMonth === 0
        ? 0
        : Math.min(100, Math.max(2, rawClicksRatio));

  const toggleSubmenu = (name: string) => {
    if (isCollapsed) setIsCollapsed(false);
    setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
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

  const renderGroup = (items: NavItem[]) => (
    <ul className="flex flex-col gap-1">
      {items.map((item) => {
        const hasSub = Array.isArray(item.subItems) && item.subItems.length > 0;
        const isParentActive =
          item.name === "Dashboard"
            ? pathname === "/dashboard"
            : item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
        const isOpen = Boolean(openMenus[item.name]);

        return (
          <li key={item.name}>
            {hasSub ? (
              <button
                type="button"
                onClick={() => toggleSubmenu(item.name)}
                className={cn(
                  "group relative flex w-full items-center rounded-[8px] text-[13px] font-medium transition-all duration-150 cursor-pointer",
                  isCollapsed
                    ? "justify-center px-2 py-2"
                    : "gap-2.5 px-2.5 py-1.5",
                  isParentActive
                    ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                    : "ds-text-secondary hover:bg-[#F2F4F7] dark:hover:bg-white/[0.05]",
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isParentActive
                      ? "text-[#0066FF] dark:text-[#5294FF]"
                      : "ds-text-muted group-hover:text-[#344054] dark:group-hover:text-white",
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 text-left truncate">
                      {item.name}
                    </span>
                    {item.badge && (
                      <span className="rounded-full bg-[#ECFDF3] dark:bg-[#039855]/15 px-1.5 py-0.2 text-[10px] font-semibold text-[#039855] dark:text-[#32D583]">
                        {item.badge}
                      </span>
                    )}
                    <ChevronDown
                      className={cn(
                        "w-3.5 h-3.5 shrink-0 transition-transform duration-200",
                        isOpen ? "rotate-180 text-[#0066FF]" : "ds-text-muted",
                      )}
                    />
                  </>
                )}
              </button>
            ) : (
              <Link
                href={item.href}
                className={cn(
                  "group relative flex w-full items-center rounded-[8px] text-[13px] font-medium transition-all duration-150",
                  isCollapsed
                    ? "justify-center px-2 py-2"
                    : "gap-2.5 px-2.5 py-1.5",
                  isParentActive
                    ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                    : "ds-text-secondary hover:bg-[#F2F4F7] dark:hover:bg-white/[0.05]",
                )}
                title={isCollapsed ? item.name : undefined}
              >
                <item.icon
                  className={cn(
                    "w-4 h-4 shrink-0",
                    isParentActive
                      ? "text-[#0066FF] dark:text-[#5294FF]"
                      : "ds-text-muted group-hover:text-[#344054] dark:group-hover:text-white",
                  )}
                />
                {!isCollapsed && (
                  <>
                    <span className="flex-1 truncate">{item.name}</span>
                    {item.badge && (
                      <span className="rounded-full bg-[#ECFDF3] dark:bg-[#039855]/15 px-1.5 py-0.2 text-[10px] font-semibold text-[#039855] dark:text-[#32D583]">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            )}

            {hasSub && isOpen && !isCollapsed && (
              <ul className="mt-1 flex flex-col gap-0.5 pl-6">
                {item.subItems!.map((sub) => {
                  const subActive = isSubItemActive(sub);
                  return (
                    <li key={sub.id}>
                      <Link
                        href={sub.href}
                        onClick={() => {
                          const [, q] = sub.href.split("?");
                          const nextTab = q
                            ? new URLSearchParams(q).get("tab") || ""
                            : "";
                          setCurrentTabParam(nextTab);
                        }}
                        className={cn(
                          "flex items-center justify-between rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium transition-all duration-150",
                          subActive
                            ? "bg-[#0066FF]/10 text-[#0066FF] dark:text-[#5294FF]"
                            : "ds-text-secondary hover:bg-[#F2F4F7] dark:hover:bg-white/[0.05]",
                        )}
                      >
                        <span className="truncate">{sub.name}</span>
                        {sub.badge && (
                          <span className="rounded-full bg-[#ECFDF3] dark:bg-[#039855]/15 px-1.5 py-0.2 text-[10px] font-semibold text-[#039855] dark:text-[#32D583]">
                            {sub.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );

  return (
    <>
      <aside
        className={cn(
          "relative hidden lg:flex flex-col h-screen shrink-0 ds-bg-sidebar border-r ds-border transition-all duration-300 select-none z-30",
          isCollapsed ? "w-[72px]" : "w-[240px]",
        )}
      >
        {/* Header / Logo */}
        <div
          className={cn(
            "flex h-[43px] min-h-[43px] max-h-[43px] items-center shrink-0 border-b ds-border",
            isCollapsed ? "justify-center px-2" : "justify-between px-4",
          )}
        >
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-6 w-6 items-center justify-center rounded-[8px] overflow-hidden shadow-xs shrink-0 group-hover:scale-105 transition-transform">
              <Image
                src="/logo.svg"
                alt="LShorter Logo"
                width={25}
                height={25}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            {!isCollapsed && (
              <span className="text-[15px] font-bold tracking-tight ds-text-primary">
                LShorter
              </span>
            )}
          </Link>
        </div>

        {/* Scrollable middle navigation */}
        <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden px-2.5 py-2.5 no-scrollbar">
          <div className="mb-4">
            {!isCollapsed && (
              <h3 className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider ds-text-muted">
                MENU
              </h3>
            )}
            {renderGroup(navMenu)}
          </div>

          <div className="mb-2">
            {!isCollapsed && (
              <h3 className="mb-1.5 px-2.5 text-[10px] font-semibold uppercase tracking-wider ds-text-muted">
                OTHERS
              </h3>
            )}
            {renderGroup(navOthers)}
          </div>
        </div>

        {/* Fixed bottom section with monthly quota widget & feedback button */}
        <div
          className={cn(
            "shrink-0 border-t ds-border ds-bg-sidebar relative",
            isCollapsed ? "p-2" : "p-2.5",
          )}
        >
          {/* Widget de quota mensuel avec mise à jour en temps réel */}
          {!isCollapsed ? (
            <div className="rounded-xl border border-[#E4E7EC] dark:border-[#27272a] bg-[#F9FAFB]/80 dark:bg-[#141416] p-3 text-xs flex flex-col gap-2.5 shadow-2xs">
              {/* Header: Plan badge & % usage */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-[#0066FF]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0066FF] dark:text-[#5294FF]">
                    {planNormalized}
                  </span>
                </div>
                <span className="font-mono text-[10.5px] font-semibold text-[#667085] dark:text-[#98A2B3]">
                  {clicksPercentLabel}
                </span>
              </div>

              {/* Main counter numbers */}
              <div className="flex items-baseline justify-between">
                <div className="flex items-baseline gap-1">
                  <span className="font-mono text-sm font-bold text-[#101828] dark:text-white">
                    {clicksThisMonth.toLocaleString("en-US")}
                  </span>
                  <span className="text-[10.5px] text-[#667085] dark:text-[#98A2B3] font-medium">
                    /{" "}
                    {clicksLimit === -1
                      ? "Unlimited"
                      : clicksLimit >= 1_000_000
                        ? `${(clicksLimit / 1_000_000).toLocaleString("en-US")}M+`
                        : clicksLimit.toLocaleString("en-US")}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-[#98A2B3] dark:text-[#71717a]">
                  clicks
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-[#EAECF0] dark:bg-[#27272a] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-[#0066FF]"
                  style={{ width: `${barWidth}%` }}
                />
              </div>

              {/* Subtitle / Details */}
              <div className="flex items-center justify-between text-[10px] text-[#667085] dark:text-[#98A2B3]">
                <span className="truncate">
                  {plan === "ENTERPRISE"
                    ? "Unlimited clicks"
                    : isOverage
                      ? "Quota exceeded"
                      : "Monthly quota"}
                </span>
                {planNormalized === "FREE" ? (
                  <Link
                    href="/dashboard/pricing"
                    className="text-[#0066FF] dark:text-[#5294FF] font-semibold hover:underline shrink-0 ml-1"
                  >
                    Upgrade →
                  </Link>
                ) : (
                  <span className="text-[#0066FF] dark:text-[#5294FF] font-medium shrink-0 ml-1">
                    Active
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsCreateLinkOpen(true)}
                className="mt-0.5 w-full flex items-center justify-center gap-1.5 rounded-lg bg-[#0066FF] hover:bg-[#0055d4] py-1.5 px-2 text-[11.5px] font-semibold !text-white transition-colors cursor-pointer shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5 !text-white" />
                <span className="!text-white">Create Short Link</span>
              </button>
            </div>
          ) : (
            <div
              title={`${planDef.name} Plan : ${clicksThisMonth.toLocaleString("en-US")} / ${clicksLimit === -1 ? "Unlimited" : clicksLimit.toLocaleString("en-US")} clicks (${clicksPercentLabel})`}
              className="w-9 h-9 rounded-[8px] ds-card mx-auto flex items-center justify-center cursor-pointer hover:border-[#0066FF] transition-colors"
              onClick={() => setIsCreateLinkOpen(true)}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#0066FF]" />
            </div>
          )}

          {/* Bouton Feedback & Help */}
          <div className="mt-1.5">
            <button
              type="button"
              onClick={() => setIsFeedbackOpen(true)}
              className={cn(
                "group relative flex w-full items-center rounded-[8px] text-[12px] font-medium transition-all duration-150 cursor-pointer ds-text-secondary hover:bg-[#0066FF]/10 hover:text-[#0066FF] dark:hover:text-[#5294FF]",
                isCollapsed ? "justify-center p-1.5" : "gap-2 px-2.5 py-1.5",
              )}
            >
              <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-[10px] font-extrabold text-[#0066FF] group-hover:border-[#0066FF] group-hover:bg-[#0066FF] group-hover:text-white transition-colors">
                ?
              </span>
              {!isCollapsed && (
                <span className="flex-1 text-left truncate font-semibold text-[11.5px]">
                  Feedback &amp; Help
                </span>
              )}
            </button>
          </div>
        </div>
      </aside>

      <LinkCreateModal
        isOpen={isCreateLinkOpen}
        onClose={() => setIsCreateLinkOpen(false)}
      />
      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}
