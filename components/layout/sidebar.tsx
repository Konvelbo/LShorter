/**
 * LShorter Sidebar - Desktop Orange & Mobile Cyber Blue
 */

"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Link2,
  QrCode,
  BarChart2,
  Globe2,
  KeyRound,
  Settings,
  FileText,
  Plus,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Sparkles,
  Home,
  BarChart3,
  Menu,
  HelpCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cfGetAnalytics } from "@/lib/cloudflare-api";
import { LinkCreateModal } from "@/components/dashboard/link-create-modal";
import { FeedbackModal } from "@/components/feedback/feedback-modal";

const navPrincipal = [
  { name: "Vue d'ensemble", href: "/dashboard", icon: LayoutDashboard },
  { name: "Mes liens", href: "/dashboard/links", icon: Link2 },
  { name: "QR Code", href: "/dashboard/qr-code", icon: QrCode },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart2 },
  { name: "Domaines", href: "/dashboard/domains", icon: Globe2 },
];

const navCompte = [
  { name: "API & SDK", href: "/dashboard/api-sdk", icon: KeyRound },
  { name: "Paramètres", href: "/dashboard/settings", icon: Settings },
  { name: "Documentation", href: "/docs", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");
  const [isCreateLinkOpen, setIsCreateLinkOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [liveClicks, setLiveClicks] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load collapse preference
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("lshorter_sidebar_collapsed");
      if (saved !== null) {
        setIsCollapsed(saved === "true");
      } else if (window.innerWidth < 1024) {
        setIsCollapsed(true);
      }
    }
  }, []);

  // Listen for mobile drawer event
  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    const handleClose = () => setIsMobileOpen(false);
    window.addEventListener("lshorter_toggle_mobile_drawer", handleToggle);
    window.addEventListener("lshorter_close_mobile_drawer", handleClose);
    return () => {
      window.removeEventListener("lshorter_toggle_mobile_drawer", handleToggle);
      window.removeEventListener("lshorter_close_mobile_drawer", handleClose);
    };
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("lshorter_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  useEffect(() => {
    if (!userId) return;
    const fetchLiveClicks = async () => {
      try {
        const res = await cfGetAnalytics(userId, "30d").catch(() => null);
        const total = (res?.data?.totalClicks ?? res?.data?.total_clicks ?? 0);
        setLiveClicks(total);
      } catch {}
    };

    fetchLiveClicks();
    window.addEventListener("lshorter_data_change", fetchLiveClicks);

    return () => {
      window.removeEventListener("lshorter_data_change", fetchLiveClicks);
    };
  }, [userId]);

  const [localPlan, setLocalPlan] = useState<string | null>(null);

  useEffect(() => {
    const update = () => {
      if (typeof window !== "undefined") {
        setLocalPlan(localStorage.getItem("lshorter_user_plan"));
      }
    };
    update();
    window.addEventListener("lshorter_plan_updated", update);
    return () => window.removeEventListener("lshorter_plan_updated", update);
  }, []);

  const plan = (localPlan || convexUser?.plan || (session?.user as any)?.plan || "FREEMIUM").toUpperCase();
  const clicksThisMonth = liveClicks || (session?.user as any)?.clicksThisMonth || 0;
  const clicksLimit = plan === "BUSINESS" ? -1 : plan === "PRO" ? 1_000_000 : 100_000;
  const percentage =
    clicksLimit === -1
      ? 10
      : Math.min(100, Math.max(0, Math.round((clicksThisMonth / clicksLimit) * 100)));

  return (
    <>
      {/* ─── 1. DESKTOP SIDEBAR (>= 768px - Orange Theme) ─── */}
      <aside
        className={cn(
          "h-screen border-r border-[#222225] bg-[#09090b] hidden md:flex flex-col justify-between sticky top-0 shrink-0 z-20 select-none transition-all duration-300",
          isCollapsed ? "w-[68px] p-2" : "w-60 p-3.5"
        )}
      >
        {/* Top Section */}
        <div className="flex flex-col gap-4">
          {/* Brand Header with LS Badge & Collapse Toggle */}
          {isCollapsed ? (
            <div className="flex flex-col items-center gap-2 pt-1">
              <Link href="/dashboard" className="cursor-pointer" title="LShorter Dashboard">
                <div className="w-8.5 h-8.5 rounded-[8px] bg-[#ff6600] flex items-center justify-center font-bebas text-lg font-black text-white shadow-md shadow-[#ff6600]/30 hover:shadow-[#ff6600]/60 transition-all">
                  LS
                </div>
              </Link>
              <button
                onClick={toggleCollapse}
                title="Déplier la barre latérale"
                className="w-7 h-7 rounded-[6px] bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-[#ff6600]/20 hover:border-[#ff6600]/40 flex items-center justify-center transition-all cursor-pointer"
              >
                <PanelLeftOpen className="w-3.5 h-3.5 text-neutral-300" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between px-0.5">
              <Link href="/dashboard" className="flex items-center gap-2.5 group cursor-pointer">
                <div className="w-8 h-8 rounded-[8px] bg-[#ff6600] flex items-center justify-center font-bebas text-lg font-black text-white shadow-md shadow-[#ff6600]/30 group-hover:shadow-[#ff6600]/60 transition-all shrink-0">
                  LS
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-bebas text-xl font-bold tracking-wider text-white flex items-center gap-1 group-hover:text-[#ff6600] transition-colors leading-none">
                    L <span className="text-[#ff6600]">SHORTER</span>
                  </span>
                  <span className="text-[9px] uppercase font-bold tracking-widest text-neutral-500 mt-0.5">
                    Edge Platform
                  </span>
                </div>
              </Link>

              <button
                onClick={toggleCollapse}
                title="Rétracter la barre latérale"
                className="w-7 h-7 rounded-[6px] bg-white/5 border border-white/10 text-neutral-400 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all cursor-pointer"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Create Link Button (Compact) */}
          <button
            onClick={() => setIsCreateLinkOpen(true)}
            title="Créer un nouveau lien"
            className={cn(
              "bg-[#ff6600] hover:bg-[#ff771a] text-white font-bold flex items-center justify-center shadow-md shadow-[#ff6600]/20 hover:shadow-[#ff6600]/40 transition-all active:scale-95 cursor-pointer",
              isCollapsed
                ? "w-8.5 h-8.5 rounded-[8px] mx-auto"
                : "w-full h-8.5 rounded-[8px] text-xs gap-1.5"
            )}
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            {!isCollapsed && <span className="font-bebas text-sm tracking-wide">CRÉER UN LIEN</span>}
          </button>

          {/* Nav Section: Principal */}
          <div className="flex flex-col gap-1">
            {!isCollapsed && (
              <span className="px-2.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                Menu
              </span>
            )}
            {navPrincipal.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    "sidebar-link-btn flex items-center rounded-[7px] text-xs font-medium cursor-pointer transition-colors",
                    isCollapsed
                      ? "w-8.5 h-8.5 justify-center mx-auto"
                      : "gap-2.5 px-2.5 py-1.5 w-full",
                    isActive
                      ? "sidebar-link-active font-semibold text-white"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "text-neutral-400")} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>

          {/* Nav Section: Compte (Sans Tarifs) */}
          <div className="flex flex-col gap-1">
            {!isCollapsed && (
              <span className="px-2.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500">
                Compte
              </span>
            )}
            {navCompte.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isCollapsed ? item.name : undefined}
                  className={cn(
                    "sidebar-link-btn flex items-center rounded-[7px] text-xs font-medium cursor-pointer transition-colors",
                    isCollapsed
                      ? "w-8.5 h-8.5 justify-center mx-auto"
                      : "gap-2.5 px-2.5 py-1.5 w-full",
                    isActive
                      ? "sidebar-link-active font-semibold text-white"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5 shrink-0", isActive ? "text-white" : "text-neutral-400")} />
                  {!isCollapsed && <span className="truncate">{item.name}</span>}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Bottom Section: Quota Card & Feedback */}
        <div className="flex flex-col gap-2.5 pt-3 border-t border-[#222225]/80">
          {!isCollapsed ? (
            <div className="rounded-[8px] bg-[#141416] border border-[#27272a] p-2.5 text-xs flex flex-col gap-1.5 hover:border-[#ff6600]/40 transition-colors">
              <div className="flex items-center justify-between text-neutral-400">
                <span className="font-bold text-[10px] text-[#ff6600]">PLAN {plan}</span>
                <span className="font-mono text-white text-[10px]">
                  {clicksThisMonth.toLocaleString()} / {clicksLimit === -1 ? "Illimité" : clicksLimit.toLocaleString()}
                </span>
              </div>
              <div className="w-full h-1 rounded-full bg-[#27272a] overflow-hidden">
                <div
                  className="h-full bg-[#ff6600] rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[9px] text-neutral-500">
                <span>Clics ce mois</span>
                <span className="text-emerald-400 font-semibold">Edge OK</span>
              </div>
            </div>
          ) : (
            <div title={`Plan ${plan} : ${clicksThisMonth.toLocaleString()} clics`} className="w-8.5 h-8.5 rounded-[8px] bg-[#141416] border border-[#27272a] mx-auto flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-[#ff6600]" />
            </div>
          )}

          {/* Feedback Button with HelpCircle Icon */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            title="Aide & Feedback"
            className={cn(
              "flex items-center rounded-[8px] text-xs font-medium text-neutral-400 hover:text-white hover:bg-[#222226] transition-all cursor-pointer group",
              isCollapsed
                ? "w-8.5 h-8.5 justify-center mx-auto"
                : "w-full gap-2 px-2.5 py-1.5"
            )}
          >
            <div className="w-5 h-5 rounded-[4px] bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400 group-hover:text-white group-hover:bg-[#ff6600] transition-colors">
              <HelpCircle className="w-3.5 h-3.5" />
            </div>
            {!isCollapsed && <span className="text-[11px]">Aide & Feedback</span>}
          </button>
        </div>
      </aside>

      {/* ─── 2. MOBILE SLIDE-OVER DRAWER (< 768px - Cyber Blue Theme) ─── */}
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/75 backdrop-blur-sm z-40 duration-300 animate-in fade-in md:hidden"
        />
      )}

      <div
        className={cn(
          "fixed inset-y-0 left-0 w-72 bg-[#0d121f] border-r border-[#1e2942] z-50 p-4 flex flex-col justify-between duration-300 transition-transform md:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="space-y-4">
          {/* Mobile Drawer Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[8px] bg-[#0066FF] flex items-center justify-center font-bebas text-lg font-black text-white shadow-md shadow-[#0066FF]/40">
                LS
              </div>
              <div className="flex flex-col">
                <span className="font-bebas text-xl font-bold tracking-wider text-white">
                  L <span className="text-[#0066FF]">SHORTER</span>
                </span>
                <span className="text-[8px] uppercase font-bold tracking-widest text-neutral-400">Mobile Edge</span>
              </div>
            </div>
            <button
              onClick={() => setIsMobileOpen(false)}
              className="w-7 h-7 rounded-full bg-white/5 text-neutral-400 hover:text-white flex items-center justify-center"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Create Button */}
          <button
            onClick={() => {
              setIsMobileOpen(false);
              setIsCreateLinkOpen(true);
            }}
            className="w-full h-9 rounded-[10px] bg-[#0066FF] hover:bg-[#0055d4] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#0066FF]/35 cursor-pointer active:scale-95 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span className="font-bebas text-sm tracking-wide">CRÉER UN LIEN</span>
          </button>

          {/* Mobile Nav Principal */}
          <div className="space-y-0.5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 px-2">Menu Principal</span>
            {navPrincipal.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors",
                    isActive
                      ? "bg-[#0066FF]/15 text-[#38bdf8] font-bold border border-[#0066FF]/30"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[#0066FF]" : "text-neutral-400")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* Mobile Nav Compte */}
          <div className="space-y-0.5 pt-2 border-t border-white/5">
            <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-500 px-2">Développeur & Compte</span>
            {navCompte.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-3 py-1.5 rounded-[8px] text-xs font-medium transition-colors",
                    isActive
                      ? "bg-[#0066FF]/15 text-[#38bdf8] font-bold border border-[#0066FF]/30"
                      : "text-neutral-300 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className={cn("w-3.5 h-3.5", isActive ? "text-[#0066FF]" : "text-neutral-400")} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Mobile Drawer Bottom Quota */}
        <div className="p-2.5 rounded-[10px] bg-[#151c2e] border border-[#27375a] space-y-1.5">
          <div className="flex items-center justify-between text-[10px]">
            <span className="font-bold text-[#0066FF]">PLAN {plan}</span>
            <span className="font-mono text-white">
              {clicksThisMonth.toLocaleString()} / {clicksLimit === -1 ? "Illimité" : clicksLimit.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-1 rounded-full bg-black/40 overflow-hidden">
            <div
              className="h-full bg-[#0066FF] rounded-full"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[8.5px] text-neutral-400">
            <span>Edge Cloudflare</span>
            <span className="text-emerald-400 font-bold">● En ligne</span>
          </div>
        </div>
      </div>

      {/* ─── 3. FLOATING MOBILE BOTTOM NAV BAR (< 768px - Cyber Blue Theme) ─── */}
      <div className="fixed bottom-3 left-3 right-3 h-14 bg-[#0d121f]/95 backdrop-blur-xl border border-[#1e2942] rounded-[20px] px-3 flex items-center justify-around z-30 shadow-2xl shadow-[#0066FF]/25 md:hidden">
        <Link
          href="/dashboard"
          className={cn(
            "flex flex-col items-center gap-0.5 cursor-pointer transition-colors",
            pathname === "/dashboard" ? "text-[#0066FF]" : "text-neutral-400 hover:text-white"
          )}
        >
          <Home className="w-4.5 h-4.5" />
          <span className="text-[9px] font-bold">Accueil</span>
        </Link>

        <Link
          href="/dashboard/links"
          className={cn(
            "flex flex-col items-center gap-0.5 cursor-pointer transition-colors",
            pathname === "/dashboard/links" ? "text-[#0066FF]" : "text-neutral-400 hover:text-white"
          )}
        >
          <Link2 className="w-4.5 h-4.5" />
          <span className="text-[9px] font-medium">Liens</span>
        </Link>

        <button
          onClick={() => setIsCreateLinkOpen(true)}
          className="w-10 h-10 -mt-5 rounded-full bg-[#0066FF] text-white flex items-center justify-center shadow-lg shadow-[#0066FF]/60 active:scale-90 transition-transform cursor-pointer border-2 border-[#09090b]"
        >
          <Plus className="w-5 h-5 stroke-[3]" />
        </button>

        <Link
          href="/dashboard/analytics"
          className={cn(
            "flex flex-col items-center gap-0.5 cursor-pointer transition-colors",
            pathname === "/dashboard/analytics" ? "text-[#0066FF]" : "text-neutral-400 hover:text-white"
          )}
        >
          <BarChart3 className="w-4.5 h-4.5" />
          <span className="text-[9px] font-medium">Stats</span>
        </Link>

        <button
          onClick={() => setIsMobileOpen((prev) => !prev)}
          className="flex flex-col items-center gap-0.5 text-neutral-400 hover:text-white cursor-pointer transition-colors"
        >
          <Menu className="w-4.5 h-4.5" />
          <span className="text-[9px] font-medium">Menu</span>
        </button>
      </div>

      {/* Global Modals */}
      <LinkCreateModal
        isOpen={isCreateLinkOpen}
        onClose={() => setIsCreateLinkOpen(false)}
        onSuccess={() => {
          window.dispatchEvent(new Event("lshorter_data_change"));
        }}
      />

      <FeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />
    </>
  );
}
