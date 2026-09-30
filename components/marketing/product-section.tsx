"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useInView } from "motion/react";
import {
  LayoutDashboard,
  Link2,
  BarChart2,
  Sparkles,
  KeyRound,
  Settings,
  FileText,
  Plus,
  Search,
  Bell,
  ArrowUpRight,
  ChevronUp,
  ChevronDown,
  X,
  Globe2,
  Shield,
  QrCode,
  Maximize2,
  Minimize2,
  Users,
  Package,
  Activity,
  Menu,
} from "lucide-react";
import { ReuiBarChart5 } from "@/components/examples/c-chart-5";
import { ReuiAreaChart14 } from "@/components/examples/c-chart-14";
import { ReuiDonutChart22 } from "@/components/examples/c-chart-22";
import {
  LinksReuiDataGrid,
  GeoLogsReuiDataGrid,
} from "@/components/dashboard/reui-data-grids";
import { FeedbackModal } from "@/components/feedback/feedback-modal";
import {
  AnalyticsPageSkeleton,
  AnalyticsGeoSkeleton,
  AnalyticsRevenueSkeleton,
  AnalyticsLiveSkeleton,
} from "@/components/ui/skeleton";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

type DesktopPageId =
  | "overview"
  | "links"
  | "analytics-traffic"
  | "analytics-geo"
  | "analytics-revenue"
  | "analytics-live"
  | "bio"
  | "domains"
  | "api"
  | "settings-profile"
  | "settings-billing"
  | "settings-api"
  | "settings-domains"
  | "settings-webhooks"
  | "settings-security"
  | "docs";

const ANALYTICS_SUB_ITEMS: {
  id: DesktopPageId;
  label: string;
  route: string;
}[] = [
  { id: "analytics-traffic", label: "Traffic Overview", route: "analytics" },
  {
    id: "analytics-geo",
    label: "Geography & Continents",
    route: "analytics/geo",
  },
  {
    id: "analytics-revenue",
    label: "Customers & Revenue",
    route: "analytics/revenue",
  },
  { id: "analytics-live", label: "Live Click Stream", route: "analytics/live" },
];

const SETTINGS_SUB_ITEMS: {
  id: DesktopPageId;
  label: string;
  route: string;
}[] = [
  {
    id: "settings-profile",
    label: "Profile & Account",
    route: "settings?tab=profile",
  },
  {
    id: "settings-billing",
    label: "Billing & Invoices",
    route: "settings?tab=billing",
  },
  { id: "settings-api", label: "API Keys", route: "settings?tab=api" },
  {
    id: "settings-domains",
    label: "Domain Routing",
    route: "settings?tab=domains",
  },
  {
    id: "settings-webhooks",
    label: "Webhooks",
    route: "settings?tab=webhooks",
  },
  {
    id: "settings-security",
    label: "Security & 2FA",
    route: "settings?tab=security",
  },
];

const DEMO_LINKS: any[] = [
  {
    id: "1",
    slug: "stripe-billing-q4",
    targetUrl: "https://stripe.com/enterprise/billing",
    clicks: 42500,
    clicksCount: 42500,
    revenue: 1840.5,
    salesCount: 38,
    status: "Active",
    owner: "Abram Schleifer",
    role: "Growth Lead",
    date: "25 Apr, 2026",
    url: "https://stripe.com/enterprise/billing",
  },
  {
    id: "2",
    slug: "linear-roadmap-26",
    targetUrl: "https://linear.app/features/roadmaps",
    clicks: 28910,
    clicksCount: 28910,
    revenue: 920.0,
    salesCount: 19,
    status: "Active",
    owner: "Carla George",
    role: "Product PMM",
    date: "22 Apr, 2026",
    url: "https://linear.app/features/roadmaps",
  },
  {
    id: "3",
    slug: "vercel-edge-sdk",
    targetUrl: "https://vercel.com/docs/edge-network",
    clicks: 19420,
    clicksCount: 19420,
    revenue: 540.0,
    salesCount: 11,
    status: "Active",
    owner: "Ekstrom Bothman",
    role: "Staff Engineer",
    date: "19 Apr, 2026",
    url: "https://vercel.com/docs/edge-network",
  },
  {
    id: "4",
    slug: "summation-deck",
    targetUrl: "https://summation.com/platform",
    clicks: 15800,
    clicksCount: 15800,
    revenue: 310.0,
    salesCount: 6,
    status: "Active",
    owner: "Emery Culhane",
    role: "VP RevOps",
    date: "16 Apr, 2026",
    url: "https://summation.com/platform",
  },
  {
    id: "5",
    slug: "cloudflare-d1-sync",
    targetUrl: "https://developers.cloudflare.com/d1",
    clicks: 12340,
    clicksCount: 12340,
    revenue: 215.0,
    salesCount: 5,
    status: "Active",
    owner: "User",
    role: "Platform Architect",
    date: "14 Apr, 2026",
    url: "https://developers.cloudflare.com/d1",
  },
  {
    id: "6",
    slug: "reui-telemetry-v2",
    targetUrl: "https://lsho.cc/docs/telemetry",
    clicks: 9520,
    clicksCount: 9520,
    revenue: 145.0,
    salesCount: 3,
    status: "Active",
    owner: "User",
    role: "Lead Designer",
    date: "12 Apr, 2026",
    url: "https://lsho.cc/docs/telemetry",
  },
];

const DEMO_GEO_LOGS = [
  {
    id: "evt_1",
    timestamp: "Just now",
    slug: "stripe-billing-q4",
    countryCode: "FR",
    countryName: "France",
    city: "Paris",
    device: "Desktop",
    browser: "Chrome 134",
    os: "macOS",
    referrer: "linkedin.com",
    latencyMs: "2.4ms",
  },
  {
    id: "evt_2",
    timestamp: "14s ago",
    slug: "linear-roadmap-26",
    countryCode: "US",
    countryName: "United States",
    city: "San Francisco",
    device: "Mobile",
    browser: "Safari 18",
    os: "iOS 18",
    referrer: "x.com",
    latencyMs: "3.1ms",
  },
  {
    id: "evt_3",
    timestamp: "38s ago",
    slug: "vercel-edge-sdk",
    countryCode: "DE",
    countryName: "Germany",
    city: "Frankfurt",
    device: "Desktop",
    browser: "Firefox",
    os: "Windows 11",
    referrer: "github.com",
    latencyMs: "1.9ms",
  },
  {
    id: "evt_4",
    timestamp: "1m ago",
    slug: "cloudflare-d1-sync",
    countryCode: "GB",
    countryName: "United Kingdom",
    city: "London",
    device: "Desktop",
    browser: "Edge",
    os: "Windows 11",
    referrer: "Direct",
    latencyMs: "2.8ms",
  },
];

const MONTHLY_CLICKS_BARS = [
  { label: "Jan", fullDate: "January 2026", primary: 8420, secondary: 6100 },
  { label: "Feb", fullDate: "February 2026", primary: 9640, secondary: 7200 },
  { label: "Mar", fullDate: "March 2026", primary: 11200, secondary: 8450 },
  { label: "Apr", fullDate: "April 2026", primary: 14800, secondary: 11100 },
  { label: "May", fullDate: "May 2026", primary: 12900, secondary: 9800 },
  { label: "Jun", fullDate: "June 2026", primary: 15400, secondary: 11900 },
  { label: "Jul", fullDate: "July 2026", primary: 13200, secondary: 10100 },
  { label: "Aug", fullDate: "August 2026", primary: 14900, secondary: 11400 },
  {
    label: "Sep",
    fullDate: "September 2026",
    primary: 16890,
    secondary: 12900,
  },
  { label: "Oct", fullDate: "October 2026", primary: 4200, secondary: 3100 },
  { label: "Nov", fullDate: "November 2026", primary: 3800, secondary: 2900 },
  { label: "Dec", fullDate: "December 2026", primary: 3140, secondary: 2400 },
];

export function ProductSection() {
  const [mounted, setMounted] = useState(false);
  const [activePage, setActivePage] = useState<DesktopPageId>("overview");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isAnalyticsMenuOpen, setIsAnalyticsMenuOpen] = useState(true);
  const [isSettingsMenuOpen, setIsSettingsMenuOpen] = useState(false);
  const [isSubpageLoading, setIsSubpageLoading] = useState(false);

  const [targetMetricMode, setTargetMetricMode] = useState<
    "clicks" | "revenue"
  >("clicks");
  const [overviewPeriod, setOverviewPeriod] = useState<
    "weekly" | "monthly" | "yearly"
  >("monthly");
  const [statsTab, setStatsTab] = useState<"overview" | "sales" | "revenue">(
    "overview",
  );
  const [statsRange, setStatsRange] = useState<"7d" | "30d" | "12m">("30d");
  const [overviewDonutMode, setOverviewDonutMode] = useState<
    "clicks" | "revenue"
  >("clicks");

  const [trafficRange, setTrafficRange] = useState<
    "12m" | "30d" | "7d" | "24h"
  >("30d");
  const [geoDonutTab, setGeoDonutTab] = useState<
    "devices" | "browsers" | "countries" | "continents" | "os"
  >("devices");
  const [isLiveStreaming, setIsLiveStreaming] = useState(true);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTopCollapsed, setIsTopCollapsed] = useState(false);
  const [, setCopiedSlug] = useState<string | null>(null);
  const [newSlug, setNewSlug] = useState("launch-2026");
  const [newUrl, setNewUrl] = useState(
    "https://stripe.com/enterprise/payments",
  );
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [demoDomainInput, setDemoDomainInput] = useState("go.MonSite.com");
  const [iframeSearchQuery, setIframeSearchQuery] = useState("");

  const sectionRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const drawerBackdropRef = useRef<HTMLDivElement>(null);
  const drawerTopSectionRef = useRef<HTMLDivElement>(null);

  // Déclencheur unique pour toute la section (évite les décalages d'animation au scroll)
  const sectionContentRef = useRef<HTMLDivElement>(null);
  const isSectionInView = useInView(sectionContentRef, {
    once: false,
    margin: "-80px",
  });

  const toggleFullscreen = useCallback(() => {
    setIsFullscreen((prev) => !prev);
  }, []);

  // Montage côté client pour createPortal
  useEffect(() => {
    setMounted(true);
  }, []);

  // Écouteur global pour raccourcis clavier & notification plein écran
  useEffect(() => {
    if (typeof document === "undefined") return;

    document.body.style.overflow = isFullscreen ? "hidden" : "";

    if (isFullscreen) {
      document.documentElement.setAttribute("data-iframe-fullscreen", "true");
      document.body.setAttribute("data-iframe-fullscreen", "true");
    } else {
      document.documentElement.removeAttribute("data-iframe-fullscreen");
      document.body.removeAttribute("data-iframe-fullscreen");
    }

    window.dispatchEvent(
      new CustomEvent("product-fullscreen-change", {
        detail: { isFullscreen },
      }),
    );

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.code === "Space" || e.key === " ")) {
        e.preventDefault();
        toggleFullscreen();
      }
      if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.documentElement.removeAttribute("data-iframe-fullscreen");
      document.body.removeAttribute("data-iframe-fullscreen");
      window.removeEventListener("keydown", handleKeyDown);
      window.dispatchEvent(
        new CustomEvent("product-fullscreen-change", {
          detail: { isFullscreen: false },
        }),
      );
    };
  }, [isFullscreen, toggleFullscreen]);

  const handleSelectPage = (pageId: DesktopPageId) => {
    if (pageId === activePage) return;
    if (pageId.startsWith("analytics-")) {
      setIsAnalyticsMenuOpen(true);
      setIsSubpageLoading(true);
      setActivePage(pageId);
      setTimeout(() => setIsSubpageLoading(false), 120);
    } else {
      if (pageId.startsWith("settings-")) setIsSettingsMenuOpen(true);
      setIsSubpageLoading(false);
      setActivePage(pageId);
    }
  };

  useEffect(() => {
    if (!drawerRef.current || !drawerBackdropRef.current) return;
    if (isDrawerOpen) {
      gsap.set([drawerRef.current, drawerBackdropRef.current], {
        pointerEvents: "auto",
      });
      gsap.to(drawerBackdropRef.current, {
        opacity: 1,
        duration: 0.2,
        overwrite: "auto",
      });
      gsap.to(drawerRef.current, {
        xPercent: 0,
        opacity: 1,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    } else {
      gsap.to(drawerBackdropRef.current, {
        opacity: 0,
        duration: 0.18,
        overwrite: "auto",
        onComplete: () => {
          if (drawerBackdropRef.current)
            drawerBackdropRef.current.style.pointerEvents = "none";
        },
      });
      gsap.to(drawerRef.current, {
        xPercent: 100,
        opacity: 0,
        duration: 0.22,
        overwrite: "auto",
        onComplete: () => {
          if (drawerRef.current) drawerRef.current.style.pointerEvents = "none";
        },
      });
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!drawerTopSectionRef.current) return;
    gsap.to(drawerTopSectionRef.current, {
      height: isTopCollapsed ? 0 : "auto",
      opacity: isTopCollapsed ? 0 : 1,
      duration: 0.2,
      ease: "power2.out",
      overwrite: "auto",
    });
  }, [isTopCollapsed]);

  const handleCopy = (slug: string) => {
    navigator.clipboard.writeText(`https://lshrt.co/${slug}`);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1200);
  };

  const getUrlPathForActivePage = (page: DesktopPageId) => {
    switch (page) {
      case "overview":
        return "dashboard";
      case "links":
        return "dashboard/links";
      case "analytics-traffic":
        return "dashboard/analytics";
      case "analytics-geo":
        return "dashboard/analytics/geo";
      case "analytics-revenue":
        return "dashboard/analytics/revenue";
      case "analytics-live":
        return "dashboard/analytics/live";
      case "bio":
        return "dashboard/bio";
      case "domains":
        return "dashboard/domains";
      case "api":
        return "dashboard/api";
      case "docs":
        return "docs";
      default:
        return `dashboard/settings?tab=${page.replace("settings-", "")}`;
    }
  };

  const isAnalyticsActive = activePage.startsWith("analytics-");
  const isSettingsActive = activePage.startsWith("settings-");
  const smoothEase: [number, number, number, number] = [0.16, 1, 0.3, 1];

  // Rendu de l'espace de travail (utilisé en mode standard et téléporté en plein écran)
  const renderIframeShell = () => (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[999999] w-screen h-screen bg-[#09090B] p-2 sm:p-4 flex flex-col overflow-x-auto overscroll-x-contain"
          : "relative rounded-[20px] p-2.5 sm:p-5 bg-[#1F2A38] border border-[#E4E7EC] dark:border-white/15 shadow-xl overflow-x-auto overscroll-x-contain no-scrollbar"
      }
    >
      {/* Barre Chrome */}
      <div className="min-w-[1080px] w-full px-4 py-2.5 rounded-t-[14px] bg-[#141C27] border-x border-t border-white/10 flex items-center justify-between text-white select-none shrink-0">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => isFullscreen && setIsFullscreen(false)}
            title={isFullscreen ? "Quitter le plein écran (Échap)" : "Fermer"}
            className="w-3 h-3 rounded-full bg-[#F04438] hover:opacity-80 cursor-pointer"
          />
          <span className="w-3 h-3 rounded-full bg-[#F79009]" />
          <button
            type="button"
            onClick={toggleFullscreen}
            title="Basculer en plein écran (Ctrl + Espace)"
            className="w-3 h-3 rounded-full bg-[#12B76A] hover:opacity-80 cursor-pointer"
          />
          <div className="ml-3 flex items-center gap-2 px-3 py-1 rounded-md bg-black/40 border border-white/10 text-[11.5px] font-mono text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
            <span>https://lsho.cc/{getUrlPathForActivePage(activePage)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] text-zinc-400 font-mono">
            Raccourci:
            <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-zinc-200 border border-white/15">
              Ctrl + Espace
            </kbd>
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white text-[11.5px] font-semibold transition-colors cursor-pointer"
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Quitter le plein écran (Échap)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Plein écran</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div
        className={`min-w-[1080px] w-full ${
          isFullscreen ? "flex-1 min-h-0" : "h-[580px]"
        } rounded-b-[14px] bg-[#F9FAFB] dark:bg-[#09090B] border border-[#E4E7EC] dark:border-[#222225] flex overflow-hidden relative shadow-md`}
      >
        {/* SIDEBAR */}
        <aside
          className={`${
            isSidebarCollapsed ? "w-[76px]" : "w-[260px]"
          } h-full bg-white dark:bg-[#0E0E11] border-r border-[#E4E7EC] dark:border-[#222225] flex flex-col justify-between shrink-0 select-none transition-all duration-200`}
        >
          <div className="flex flex-col flex-1 min-h-0">
            <div
              className={`h-[64px] flex items-center border-b border-[#F2F4F7] dark:border-[#222225] shrink-0 ${
                isSidebarCollapsed
                  ? "justify-center px-2"
                  : "justify-between px-5"
              }`}
            >
              <button
                type="button"
                onClick={() => handleSelectPage("overview")}
                className="flex items-center gap-2.5 cursor-pointer"
              >
                <div className="w-8 h-8 rounded-[9px] bg-[#465FFF] text-white font-extrabold text-[12.5px] flex items-center justify-center shrink-0">
                  LS
                </div>
                {!isSidebarCollapsed && (
                  <span className="text-[17px] font-bold tracking-tight text-[#101828] dark:text-white">
                    LShorter
                  </span>
                )}
              </button>
              {!isSidebarCollapsed && (
                <span className="text-[10px] font-mono bg-[#ECF3FF] dark:bg-[#465FFF]/20 text-[#465FFF] dark:text-[#7592FF] px-2 py-0.5 rounded-full font-semibold">
                  PRO
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5 no-scrollbar">
              <div>
                {!isSidebarCollapsed && (
                  <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#98A2B3]">
                    MENU
                  </div>
                )}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleSelectPage("overview")}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed
                        ? "justify-center px-2"
                        : "justify-between px-3"
                    } py-2.5 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                      activePage === "overview"
                        ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]"
                        : "text-[#344054] dark:text-gray-300 hover:bg-[#F2F4F7] dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <LayoutDashboard className="w-[18px] h-[18px] shrink-0" />
                      {!isSidebarCollapsed && <span>Dashboard</span>}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPage("links")}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed
                        ? "justify-center px-2"
                        : "justify-between px-3"
                    } py-2.5 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                      activePage === "links"
                        ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]"
                        : "text-[#344054] dark:text-gray-300 hover:bg-[#F2F4F7] dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Link2 className="w-[18px] h-[18px] shrink-0" />
                      {!isSidebarCollapsed && <span>Short Links</span>}
                    </span>
                  </button>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (isSidebarCollapsed) {
                          setIsSidebarCollapsed(false);
                          setIsAnalyticsMenuOpen(true);
                        } else {
                          setIsAnalyticsMenuOpen((p) => !p);
                        }
                      }}
                      className={`w-full flex items-center ${
                        isSidebarCollapsed
                          ? "justify-center px-2"
                          : "justify-between px-3"
                      } py-2.5 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                        isAnalyticsActive
                          ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]"
                          : "text-[#344054] dark:text-gray-300 hover:bg-[#F2F4F7] dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <BarChart2 className="w-[18px] h-[18px] shrink-0" />
                        {!isSidebarCollapsed && <span>Analytics</span>}
                      </span>
                      {!isSidebarCollapsed && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isAnalyticsMenuOpen
                              ? "rotate-180 text-[#465FFF]"
                              : "text-[#98A2B3]"
                          }`}
                        />
                      )}
                    </button>

                    {!isSidebarCollapsed && isAnalyticsMenuOpen && (
                      <div className="mt-1 ml-6 pl-3 border-l border-[#E4E7EC] dark:border-[#222225] space-y-0.5">
                        {ANALYTICS_SUB_ITEMS.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleSelectPage(sub.id)}
                            className={`w-full text-left px-3 py-2 rounded-[8px] text-[12.5px] font-medium transition-colors flex items-center justify-between cursor-pointer ${
                              activePage === sub.id
                                ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF] font-semibold"
                                : "text-[#475467] dark:text-gray-400 hover:bg-[#F2F4F7] dark:hover:bg-white/5"
                            }`}
                          >
                            <span className="truncate">{sub.label}</span>
                            {sub.id === "analytics-live" && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#12B76A] animate-pulse shrink-0" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPage("bio")}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed
                        ? "justify-center px-2"
                        : "justify-between px-3"
                    } py-2.5 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                      activePage === "bio"
                        ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]"
                        : "text-[#344054] dark:text-gray-300 hover:bg-[#F2F4F7] dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <QrCode className="w-[18px] h-[18px] shrink-0" />
                      {!isSidebarCollapsed && <span>QR Studio</span>}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectPage("domains")}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed
                        ? "justify-center px-2"
                        : "justify-between px-3"
                    } py-2.5 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                      activePage === "domains"
                        ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]"
                        : "text-[#344054] dark:text-gray-300 hover:bg-[#F2F4F7] dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Globe2 className="w-[18px] h-[18px] shrink-0" />
                      {!isSidebarCollapsed && <span>Custom Domains</span>}
                    </span>
                  </button>
                </div>
              </div>

              <div>
                {!isSidebarCollapsed && (
                  <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#98A2B3]">
                    OTHERS
                  </div>
                )}
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => handleSelectPage("api")}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed
                        ? "justify-center px-2"
                        : "justify-between px-3"
                    } py-2.5 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                      activePage === "api"
                        ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]"
                        : "text-[#344054] dark:text-gray-300 hover:bg-[#F2F4F7] dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <KeyRound className="w-[18px] h-[18px] shrink-0" />
                      {!isSidebarCollapsed && <span>API &amp; SDK</span>}
                    </span>
                  </button>

                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        if (isSidebarCollapsed) {
                          setIsSidebarCollapsed(false);
                          setIsSettingsMenuOpen(true);
                        } else {
                          setIsSettingsMenuOpen((p) => !p);
                        }
                      }}
                      className={`w-full flex items-center ${
                        isSidebarCollapsed
                          ? "justify-center px-2"
                          : "justify-between px-3"
                      } py-2.5 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                        isSettingsActive
                          ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]"
                          : "text-[#344054] dark:text-gray-300 hover:bg-[#F2F4F7] dark:hover:bg-white/5"
                      }`}
                    >
                      <span className="flex items-center gap-3">
                        <Settings className="w-[18px] h-[18px] shrink-0" />
                        {!isSidebarCollapsed && <span>Settings</span>}
                      </span>
                      {!isSidebarCollapsed && (
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${
                            isSettingsMenuOpen
                              ? "rotate-180 text-[#465FFF]"
                              : "text-[#98A2B3]"
                          }`}
                        />
                      )}
                    </button>

                    {!isSidebarCollapsed && isSettingsMenuOpen && (
                      <div className="mt-1 ml-6 pl-3 border-l border-[#E4E7EC] dark:border-[#222225] space-y-0.5">
                        {SETTINGS_SUB_ITEMS.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => handleSelectPage(sub.id)}
                            className={`w-full text-left px-3 py-1.5 rounded-[8px] text-[12px] font-medium transition-colors cursor-pointer ${
                              activePage === sub.id
                                ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF] font-semibold"
                                : "text-[#475467] dark:text-gray-400 hover:bg-[#F2F4F7] dark:hover:bg-white/5"
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectPage("docs")}
                    className={`w-full flex items-center ${
                      isSidebarCollapsed
                        ? "justify-center px-2"
                        : "justify-between px-3"
                    } py-2.5 rounded-[10px] text-[13px] font-medium transition-colors cursor-pointer ${
                      activePage === "docs"
                        ? "bg-[#ECF3FF] text-[#465FFF] dark:bg-[#465FFF]/15 dark:text-[#7592FF]"
                        : "text-[#344054] dark:text-gray-300 hover:bg-[#F2F4F7] dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <FileText className="w-[18px] h-[18px] shrink-0" />
                      {!isSidebarCollapsed && <span>Documentation</span>}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {!isSidebarCollapsed && (
            <div className="p-3.5 border-t border-[#F2F4F7] dark:border-[#222225] space-y-2">
              <div className="rounded-xl bg-[#F9FAFB] dark:bg-[#141417] border border-[#E4E7EC] dark:border-[#222225] p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[#101828] dark:text-white">
                    <Sparkles className="w-3.5 h-3.5 text-[#465FFF]" />
                    PRO PLAN
                  </span>
                  <span className="text-[10.5px] font-mono font-semibold text-[#667085] dark:text-gray-400">
                    128,490 / 150,000
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-[#E4E7EC] dark:bg-[#222225] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#465FFF]"
                    style={{ width: "85.6%" }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className="mt-2.5 w-full py-2 px-3 rounded-[9px] bg-[#465FFF] hover:bg-[#3641F5] text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Create Short Link</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsFeedbackModalOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-[12.5px] font-medium text-[#475467] dark:text-gray-300 hover:bg-[#F2F4F7] dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#465FFF]/10 text-[#465FFF] font-bold text-[11px]">
                  ?
                </span>
                <span>Feedback &amp; Help</span>
              </button>
            </div>
          )}
        </aside>

        {/* CONTENU PRINCIPAL */}
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          <header className="h-[64px] bg-white dark:bg-[#0E0E11] border-b border-[#E4E7EC] dark:border-[#222225] px-5 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setIsSidebarCollapsed((p) => !p)}
                className="w-9 h-9 rounded-[10px] border border-[#E4E7EC] dark:border-[#222225] flex items-center justify-center text-[#667085] hover:bg-[#F2F4F7] dark:hover:bg-white/5 transition-colors cursor-pointer"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="relative w-[300px] lg:w-[360px]">
                <Search className="w-4 h-4 text-[#667085] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={iframeSearchQuery}
                  onChange={(e) => setIframeSearchQuery(e.target.value)}
                  placeholder="Search or type command..."
                  className="w-full h-9 rounded-[10px] border border-[#E4E7EC] dark:border-[#222225] bg-[#F9FAFB] dark:bg-[#141417] pl-9 pr-12 text-[12.5px] text-[#101828] dark:text-white focus:outline-none focus:border-[#465FFF]"
                />
                <kbd className="absolute right-2.5 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono rounded bg-white dark:bg-[#1E1E24] border border-[#E4E7EC] text-[#667085]">
                  ⌘K
                </kbd>
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-[10px] bg-[#465FFF] hover:bg-[#3641F5] text-white px-3.5 py-2 text-[12.5px] font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Link</span>
              </button>

              <button
                type="button"
                onClick={toggleFullscreen}
                className="w-9 h-9 rounded-[10px] border border-[#E4E7EC] dark:border-[#222225] flex items-center justify-center text-[#667085] hover:text-[#465FFF] transition-colors cursor-pointer"
              >
                {isFullscreen ? (
                  <Minimize2 className="w-4 h-4" />
                ) : (
                  <Maximize2 className="w-4 h-4" />
                )}
              </button>

              <button
                type="button"
                onClick={() => handleSelectPage("analytics-live")}
                className="relative w-9 h-9 rounded-[10px] border border-[#E4E7EC] dark:border-[#222225] flex items-center justify-center text-[#667085] hover:bg-[#F2F4F7] cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-[#F79009]" />
              </button>

              <button
                type="button"
                onClick={() => handleSelectPage("settings-profile")}
                className="flex items-center gap-2 pl-1.5 pr-2.5 py-1 rounded-[12px] border border-[#E4E7EC] dark:border-[#222225] bg-[#F9FAFB] dark:bg-[#141417] cursor-pointer"
              >
                <div className="w-7 h-7 rounded-full bg-[#465FFF] text-white flex items-center justify-center text-[11px] font-bold">
                  U
                </div>
                <span className="text-[12px] font-semibold text-[#101828] dark:text-white">
                  User
                </span>
              </button>
            </div>
          </header>

          <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#F9FAFB] dark:bg-[#09090B]">
            {isSubpageLoading ? (
              <div>
                {activePage === "analytics-traffic" && (
                  <AnalyticsPageSkeleton />
                )}
                {activePage === "analytics-geo" && <AnalyticsGeoSkeleton />}
                {activePage === "analytics-revenue" && (
                  <AnalyticsRevenueSkeleton />
                )}
                {activePage === "analytics-live" && <AnalyticsLiveSkeleton />}
              </div>
            ) : (
              <>
                {activePage === "overview" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <h1 className="text-[22px] font-bold tracking-tight text-[#101828] dark:text-white">
                          Good morning User 👋
                        </h1>
                        <p className="text-[13px] text-[#667085] dark:text-gray-400 mt-0.5">
                          Saturday, September 26, 2026 • Real-time Cloudflare D1
                          edge telemetry
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={() => handleSelectPage("analytics-traffic")}
                          className="inline-flex items-center gap-2 rounded-[10px] border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141417] px-3.5 py-2 text-[12.5px] font-medium text-[#344054] dark:text-gray-200 cursor-pointer"
                        >
                          <BarChart2 className="w-4 h-4 text-[#465FFF]" />
                          <span>Analytics Report</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsDrawerOpen(true)}
                          className="inline-flex items-center gap-2 rounded-[10px] bg-[#465FFF] hover:bg-[#3641F5] text-white px-4 py-2 text-[12.5px] font-semibold cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Create Short Link</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-7 flex flex-col gap-6">
                        <div className="grid grid-cols-2 gap-5">
                          <div
                            onClick={() =>
                              handleSelectPage("analytics-traffic")
                            }
                            className="rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141417] p-5 cursor-pointer"
                          >
                            <div className="w-11 h-11 rounded-xl bg-[#F2F4F7] dark:bg-white/[0.06] flex items-center justify-center">
                              <Users className="w-5 h-5 text-[#465FFF]" />
                            </div>
                            <div className="mt-4 flex items-end justify-between">
                              <div>
                                <span className="text-[13px] text-[#667085] dark:text-gray-400">
                                  Total Clicks
                                </span>
                                <h3 className="mt-1 text-[26px] font-bold tracking-tight text-[#101828] dark:text-white">
                                  128,490
                                </h3>
                              </div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#027A48]">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                +18.4%
                              </span>
                            </div>
                          </div>

                          <div
                            onClick={() => handleSelectPage("links")}
                            className="rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141417] p-5 cursor-pointer"
                          >
                            <div className="w-11 h-11 rounded-xl bg-[#F2F4F7] dark:bg-white/[0.06] flex items-center justify-center">
                              <Package className="w-5 h-5 text-[#465FFF]" />
                            </div>
                            <div className="mt-4 flex items-end justify-between">
                              <div>
                                <span className="text-[13px] text-[#667085] dark:text-gray-400">
                                  Active Short Links
                                </span>
                                <h3 className="mt-1 text-[26px] font-bold tracking-tight text-[#101828] dark:text-white">
                                  1,420
                                </h3>
                              </div>
                              <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF3] px-2.5 py-0.5 text-[11.5px] font-semibold text-[#027A48]">
                                <ArrowUpRight className="w-3.5 h-3.5" />
                                +11.2%
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141417] p-5">
                          <div className="flex items-center justify-between mb-3">
                            <h3 className="text-[16px] font-semibold text-[#101828] dark:text-white">
                              Monthly Clicks
                            </h3>
                            <button
                              type="button"
                              onClick={() =>
                                handleSelectPage("analytics-traffic")
                              }
                              className="text-[12px] font-semibold text-[#465FFF] hover:underline cursor-pointer"
                            >
                              View Traffic →
                            </button>
                          </div>
                          <ReuiBarChart5
                            data={MONTHLY_CLICKS_BARS}
                            primaryLabel="Total Clicks"
                            secondaryLabel="Unique Visitors"
                            heightClassName="h-[180px] w-full"
                            showSecondaryBar
                            showYAxis
                          />
                        </div>
                      </div>

                      <div className="col-span-5 rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141417] flex flex-col justify-between overflow-hidden p-6">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="text-[16px] font-semibold text-[#101828] dark:text-white">
                              Monthly Target
                            </h3>
                            <p className="text-[12px] text-[#667085] dark:text-gray-400 mt-0.5">
                              Target you’ve set for each month
                            </p>
                          </div>
                          <div className="inline-flex rounded-lg bg-[#F2F4F7] dark:bg-[#1D1D21] p-0.5 border border-[#E4E7EC]">
                            <button
                              type="button"
                              onClick={() => setTargetMetricMode("clicks")}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                                targetMetricMode === "clicks"
                                  ? "bg-[#465FFF] text-white"
                                  : "text-[#667085]"
                              }`}
                            >
                              Clicks
                            </button>
                            <button
                              type="button"
                              onClick={() => setTargetMetricMode("revenue")}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold cursor-pointer ${
                                targetMetricMode === "revenue"
                                  ? "bg-[#465FFF] text-white"
                                  : "text-[#667085]"
                              }`}
                            >
                              Revenue
                            </button>
                          </div>
                        </div>

                        <div className="relative flex flex-col items-center justify-center my-6">
                          <svg
                            viewBox="0 0 240 135"
                            className="w-[230px] h-[130px]"
                          >
                            <path
                              d="M 24 115 A 96 96 0 0 1 216 115"
                              fill="none"
                              stroke="currentColor"
                              className="text-[#E4E7EC] dark:text-[#26272B]"
                              strokeWidth="16"
                              strokeLinecap="round"
                            />
                            <path
                              d="M 24 115 A 96 96 0 0 1 216 115"
                              fill="none"
                              stroke="#465FFF"
                              strokeWidth="16"
                              strokeLinecap="round"
                              strokeDasharray="301.6"
                              strokeDashoffset={
                                targetMetricMode === "clicks" ? "43.4" : "62.0"
                              }
                            />
                          </svg>
                          <div className="-mt-12 text-center">
                            <div className="text-[30px] font-bold text-[#101828] dark:text-white leading-none">
                              {targetMetricMode === "clicks"
                                ? "85.66%"
                                : "79.41%"}
                            </div>
                          </div>
                        </div>

                        <p className="text-center text-[12px] text-[#667085] dark:text-gray-400">
                          {targetMetricMode === "clicks"
                            ? "You recorded 128,490 clicks this month."
                            : "You generated $3,970.50 in link conversions."}
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141417] overflow-hidden">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E7EC]">
                        <h3 className="text-[16px] font-semibold text-[#101828] dark:text-white">
                          Overview
                        </h3>
                        <div className="inline-flex rounded-lg bg-[#F2F4F7] dark:bg-[#1D1D21] p-1">
                          {(["weekly", "monthly", "yearly"] as const).map(
                            (p) => (
                              <button
                                key={p}
                                type="button"
                                onClick={() => setOverviewPeriod(p)}
                                className={`px-3 py-1 rounded-md text-[12px] font-medium capitalize cursor-pointer ${
                                  overviewPeriod === p
                                    ? "bg-white text-[#101828] shadow-xs"
                                    : "text-[#667085]"
                                }`}
                              >
                                {p}
                              </button>
                            ),
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-4 divide-x divide-[#E4E7EC]">
                        {[
                          {
                            label: "Unique Visitors",
                            value: "94,120",
                            delta: "+18.4%",
                          },
                          {
                            label: "Total Pageviews",
                            value: "128,490",
                            delta: "+22.1%",
                          },
                          {
                            label: "Bounce Rate",
                            value: "18.4%",
                            delta: "-2.1%",
                          },
                          {
                            label: "Visit Duration",
                            value: "1m 42s",
                            delta: "+14.0%",
                          },
                        ].map((item) => (
                          <div key={item.label} className="p-5">
                            <div className="text-[12.5px] text-[#667085]">
                              {item.label}
                            </div>
                            <div className="mt-2 flex items-baseline justify-between">
                              <span className="text-[22px] font-bold text-[#101828] dark:text-white">
                                {item.value}
                              </span>
                              <span className="text-[11px] font-semibold text-[#027A48]">
                                {item.delta}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-6">
                      <div className="col-span-7 rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141417] p-5">
                        <h3 className="text-[16px] font-semibold text-[#101828] dark:text-white mb-3">
                          Statistics
                        </h3>
                        <ReuiAreaChart14
                          organicLabel="Total Clicks"
                          paidLabel={
                            statsTab === "revenue"
                              ? "Revenue ($)"
                              : "Unique Visitors"
                          }
                          heightClassName="h-[220px] w-full"
                          data={[
                            { label: "Apr 20", organic: 14200, paid: 420 },
                            { label: "Apr 21", organic: 18400, paid: 580 },
                            { label: "Apr 22", organic: 16900, paid: 510 },
                            { label: "Apr 23", organic: 22800, paid: 740 },
                            { label: "Apr 24", organic: 25100, paid: 820 },
                            { label: "Apr 25", organic: 31090, paid: 900 },
                          ]}
                        />
                      </div>

                      <div className="col-span-5 rounded-2xl border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141417] p-5 flex flex-col justify-between">
                        <h3 className="text-[15px] font-semibold text-[#101828] dark:text-white mb-3">
                          Active Segment Breakdown
                        </h3>
                        <ReuiDonutChart22
                          centerLabel="Total Clicks"
                          items={DEMO_LINKS.slice(0, 6).map((l) => ({
                            key: l.id,
                            label: `/${l.slug}`,
                            value: l.clicks,
                            sublabel: `$${(l.revenue ?? 0).toFixed(2)} rev`,
                          }))}
                        />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <LinksReuiDataGrid
                        links={DEMO_LINKS.filter(
                          (l) =>
                            !iframeSearchQuery.trim() ||
                            l.slug
                              .toLowerCase()
                              .includes(iframeSearchQuery.toLowerCase()) ||
                            (l.url || "")
                              .toLowerCase()
                              .includes(iframeSearchQuery.toLowerCase()),
                        )}
                        onCopy={(code) => handleCopy(code)}
                      />
                      <GeoLogsReuiDataGrid logs={DEMO_GEO_LOGS} />
                    </div>
                  </div>
                )}

                {activePage === "links" && (
                  <div className="space-y-5">
                    <LinksReuiDataGrid
                      links={DEMO_LINKS}
                      onCopy={(code) => handleCopy(code)}
                    />
                  </div>
                )}

                {activePage === "analytics-traffic" && (
                  <div className="space-y-6">
                    <div className="rounded-2xl bg-white dark:bg-[#141417] border border-[#E4E7EC] p-5">
                      <ReuiBarChart5
                        data={MONTHLY_CLICKS_BARS}
                        primaryLabel="Total Clicks"
                        secondaryLabel="Unique Visitors"
                        heightClassName="h-[220px] w-full"
                        showSecondaryBar
                        showYAxis
                      />
                    </div>
                  </div>
                )}

                {activePage === "analytics-geo" && (
                  <div className="space-y-6">
                    <GeoLogsReuiDataGrid logs={DEMO_GEO_LOGS} />
                  </div>
                )}

                {activePage === "analytics-revenue" && (
                  <div className="space-y-6">
                    <div className="rounded-2xl bg-white dark:bg-[#141417] border border-[#E4E7EC] p-5">
                      <ReuiBarChart5
                        data={[
                          { label: "Week 1", primary: 840, secondary: 18 },
                          { label: "Week 2", primary: 960, secondary: 21 },
                          { label: "Week 3", primary: 1050, secondary: 22 },
                          { label: "Week 4", primary: 1120.5, secondary: 21 },
                        ]}
                        primaryLabel="Revenue ($)"
                        secondaryLabel="Conversions"
                        heightClassName="h-[200px] w-full"
                      />
                    </div>
                  </div>
                )}

                {activePage === "analytics-live" && (
                  <div className="space-y-5">
                    <GeoLogsReuiDataGrid logs={DEMO_GEO_LOGS} />
                  </div>
                )}

                {(activePage === "domains" ||
                  activePage === "bio" ||
                  activePage === "api" ||
                  activePage === "docs" ||
                  activePage.startsWith("settings-")) && (
                  <div className="rounded-2xl bg-white dark:bg-[#141417] border border-[#E4E7EC] p-6 space-y-4">
                    <h3 className="text-[16px] font-semibold text-[#101828] dark:text-white">
                      {activePage === "domains"
                        ? "Custom Domains DNS Check"
                        : "Workspace Management"}
                    </h3>
                    <p className="text-[12.5px] text-[#667085]">
                      Page active : {activePage}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={() => setIsFeedbackModalOpen(false)}
        />

        {/* DRAWER SHORT LINK */}
        <div
          ref={drawerBackdropRef}
          onClick={() => setIsDrawerOpen(false)}
          className="absolute inset-0 bg-black/40 opacity-0 pointer-events-none z-30"
        />

        <div
          ref={drawerRef}
          className="absolute top-0 right-0 bottom-0 w-[360px] bg-white dark:bg-[#1D2939] border-l border-[#E4E7EC] shadow-xl z-40 flex flex-col pointer-events-none opacity-0"
        >
          <div className="px-5 py-3.5 border-b border-[#E4E7EC] flex items-center justify-between bg-[#F9FAFB]">
            <span className="text-[13.5px] font-semibold text-[#101828] dark:text-white">
              New Short Link
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsTopCollapsed((p) => !p)}
                className="px-2 py-0.5 text-[11px] font-medium rounded-full bg-[#ECF3FF] text-[#465FFF] cursor-pointer"
              >
                {isTopCollapsed ? (
                  <ChevronDown className="w-3.5 h-3.5" />
                ) : (
                  <ChevronUp className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="w-7 h-7 flex items-center justify-center text-[#667085] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-1 p-5 overflow-y-auto space-y-4">
            <div
              ref={drawerTopSectionRef}
              className="overflow-hidden space-y-3"
            >
              <div>
                <label className="block text-[11.5px] font-medium text-[#344054] mb-1">
                  Destination URL
                </label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#D0D5DD] px-3 text-[12.5px]"
                />
              </div>
              <div>
                <label className="block text-[11.5px] font-medium text-[#344054] mb-1">
                  Slug (lshrt.co/)
                </label>
                <input
                  type="text"
                  value={newSlug}
                  onChange={(e) => setNewSlug(e.target.value)}
                  className="w-full h-9 rounded-lg border border-[#D0D5DD] px-3 font-mono text-[12.5px] text-[#465FFF]"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsDrawerOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#465FFF] hover:bg-[#3641F5] text-white text-[13px] font-semibold cursor-pointer"
            >
              Publish Short Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <section
      ref={sectionRef}
      id="product"
      className="w-full min-h-[110vh] mt-16 sm:mt-24 md:mt-32 bg-[#F9FAFB] dark:bg-[#0C0C0F] pt-14 md:pt-20 pb-16 md:pb-24 border-t border-[#E4E7EC] dark:border-white/10 transition-colors duration-200 flex flex-col"
    >
      <div
        ref={sectionContentRef}
        className="max-w-[1340px] mx-auto px-4 sm:px-8 w-full"
      >
        {/* En-tête avec transition synchronisée */}
        <div className="flex flex-col items-start gap-4 mb-8">
          <motion.span
            initial={{ opacity: 0, y: 16 }}
            animate={
              isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
            }
            transition={{
              duration: isSectionInView ? 0.65 : 0.4,
              ease: smoothEase,
            }}
            className="inline-flex items-center gap-2 text-[11.5px] font-mono uppercase tracking-[0.16em] text-[#465FFF]"
          >
            <span className="w-2 h-2 rounded-full bg-[#465FFF]" />
            02 • INTERACTIVE DESKTOP PRODUCT WORKSPACE
          </motion.span>

          <motion.h2
            initial={{ opacity: 0, y: 22 }}
            animate={
              isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 22 }
            }
            transition={{
              duration: isSectionInView ? 0.8 : 0.4,
              delay: isSectionInView ? 0.08 : 0,
              ease: smoothEase,
            }}
            className="text-[32px] sm:text-[44px] md:text-[52px] font-normal tracking-[-0.03em] leading-[1.08] text-[#101828] dark:text-white max-w-[860px]"
          >
            Test every page of the SaaS.{" "}
            <span className="text-[#667085] dark:text-zinc-400">
              Identical down to the millimeter.
            </span>
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={
              isSectionInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }
            }
            transition={{
              duration: isSectionInView ? 0.7 : 0.35,
              delay: isSectionInView ? 0.16 : 0,
              ease: smoothEase,
            }}
          >
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-[#465FFF] hover:bg-[#3641F5] text-white px-5 py-2.5 text-[13px] font-semibold transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Open Link Drawer</span>
            </button>
          </motion.div>
        </div>

        {/* Workspace Frame : apparition longue, douce et progressive */}
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.98 }}
          animate={
            isSectionInView
              ? { opacity: 1, y: 0, scale: 1 }
              : { opacity: 0, y: 50, scale: 0.98 }
          }
          transition={{
            duration: isSectionInView ? 1.05 : 0.5,
            delay: isSectionInView ? 0.24 : 0,
            ease: smoothEase,
          }}
          className="transform-gpu will-change-transform"
        >
          {isFullscreen && mounted ? (
            <>
              {/* Espace réservé pour éviter tout saut de scroll de la page */}
              <div className="relative rounded-[20px] p-6 bg-[#1F2A38]/30 border border-dashed border-white/15 h-[620px] flex flex-col items-center justify-center text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#465FFF]/20 border border-[#465FFF]/30 flex items-center justify-center text-[#7592FF] mb-3">
                  <Maximize2 className="w-6 h-6" />
                </div>
                <p className="text-[14px] font-semibold text-white">
                  Espace de travail en plein écran
                </p>
                <p className="text-[12px] text-zinc-400 mt-1 max-w-sm">
                  Appuyez sur{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[11px] border border-white/20">
                    Échap
                  </kbd>{" "}
                  ou{" "}
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-mono text-[11px] border border-white/20">
                    Ctrl + Espace
                  </kbd>{" "}
                  pour quitter le plein écran.
                </p>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(false)}
                  className="mt-4 px-4 py-2 rounded-lg bg-[#465FFF] hover:bg-[#3641F5] text-white text-[12px] font-semibold transition-colors cursor-pointer"
                >
                  Quitter le plein écran
                </button>
              </div>

              {/* Téléporté directement sur le body pour couvrir 100% de la fenêtre sans blocage */}
              {createPortal(renderIframeShell(), document.body)}
            </>
          ) : (
            renderIframeShell()
          )}
        </motion.div>
      </div>
    </section>
  );
}

export default ProductSection;
