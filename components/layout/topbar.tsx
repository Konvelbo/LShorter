/**
 * LShorter Topbar - Mobile Cyber Blue & Desktop Orange
 */

"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ChevronDown,
  LogOut,
  Sparkles,
  Settings,
  CreditCard,
  FileText,
  Sun,
  Moon,
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { NotificationsBell } from "./notifications-bell";
import { getPlanDefinition } from "@/src/config/pricing";

export function Topbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [localPlan, setLocalPlan] = useState<string | null>(null);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);

  // Click outside to close user menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(target) &&
        mobileUserMenuRef.current &&
        !mobileUserMenuRef.current.contains(target)
      ) {
        setShowUserMenu(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowUserMenu(false);
      }
    }

    if (showUserMenu) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showUserMenu]);

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedTheme = localStorage.getItem("lshorter_theme") as "dark" | "light" | null;
      if (savedTheme) {
        setTheme(savedTheme);
        document.documentElement.classList.remove("dark", "light");
        document.documentElement.classList.add(savedTheme);
      } else if (document.documentElement.classList.contains("light")) {
        setTheme("light");
      } else {
        setTheme("dark");
      }
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem("lshorter_theme", nextTheme);
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(nextTheme);
      window.dispatchEvent(new CustomEvent("lshorter_theme_changed", { detail: nextTheme }));
    }
  };

  React.useEffect(() => {
    const update = (e?: Event) => {
      const detail = (e as CustomEvent)?.detail;
      const planFromEvent = detail?.plan as string | undefined;
      if (planFromEvent) {
        setLocalPlan(planFromEvent.toUpperCase());
      } else if (typeof window !== "undefined") {
        setLocalPlan(localStorage.getItem("lshorter_user_plan"));
      }
    };
    update();
    window.addEventListener("lshorter_plan_updated", update);
    return () => window.removeEventListener("lshorter_plan_updated", update);
  }, []);

  // ── Sync localStorage with Convex DB when it loads (DB is source of truth) ──
  React.useEffect(() => {
    if (convexUser?.plan) {
      const dbPlan = convexUser.plan.toUpperCase();
      setLocalPlan(dbPlan);
      if (typeof window !== "undefined") {
        localStorage.setItem("lshorter_user_plan", dbPlan);
      }
    }
  }, [convexUser?.plan]);

  // Convex DB is the source of truth — localPlan is only used before Convex loads
  const plan = (convexUser?.plan || localPlan || (session?.user as any)?.plan || "FREEMIUM").toUpperCase();
  const routeSegments = useMemo(() => {
    if (!pathname || pathname === "/dashboard") {
      return [{ label: "DASHBOARD", href: "/dashboard", isCurrent: true }];
    }

    const parts = pathname.split("/").filter(Boolean);
    const crumbs: { label: string; href: string; isCurrent: boolean }[] = [];
    let currentHref = "";

    const labelMap: Record<string, string> = {
      dashboard: "DASHBOARD",
      analytics: "ANALYTICS",
      geo: "GEOGRAPHY",
      devices: "DEVICES & TECH",
      sources: "TRAFFIC SOURCES",
      links: "MY LINKS",
      domains: "DOMAINS",
      "qr-code": "QR CODES",
      "api-sdk": "API & SDK",
      settings: "SETTINGS",
      pricing: "PLANS & PRICING",
    };

    parts.forEach((p, idx) => {
      currentHref += `/${p}`;
      crumbs.push({
        label: labelMap[p] || p.toUpperCase(),
        href: currentHref,
        isCurrent: idx === parts.length - 1,
      });
    });

    return crumbs;
  }, [pathname]);

  const name = convexUser?.name || session?.user?.name || "My Account";
  const email = convexUser?.email || session?.user?.email || "";
  const avatarUrl = convexUser?.avatarUrl || (session?.user as any)?.avatarUrl || session?.user?.image || "";
  const planDef = getPlanDefinition(plan);
  const clicksLimit = planDef.limits.monthlyClicks;

  return (
    <header className="border-b border-[#222225] md:border-b-0 bg-[#09090b] z-30 select-none transition-all shrink-0">
      {/* ─── 1. MOBILE DEDICATED TOPBAR (< 768px - Cyber Blue Theme) ─── */}
      <div className="flex md:hidden h-14 px-3.5 items-center justify-between">
        {/* Left: Blue LS Badge + Title -> Navigates to Marketing Home */}
        <Link href="/" className="flex items-center gap-2 group cursor-pointer">
          <div className="w-8 h-8 rounded-[8px] bg-brand flex items-center justify-center font-bebas text-lg font-black text-white shadow-md shadow-[var(--brand-primary-glow)] group-hover:scale-105 transition-transform">
            LS
          </div>
          <span className="font-bebas text-xl font-bold tracking-wider text-white leading-none">
            L <span className="text-brand">SHORTER</span>
          </span>
        </Link>

        {/* Right: Theme Switch, Blue Notification Dot & Blue Avatar Ring */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher Mobile (< 768px - Cyber Blue) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-8 h-8 rounded-[8px] bg-[#10141f] border border-[#1e2942] text-neutral-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
          >
            {theme === "dark" ? (
              <Sun className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <Moon className="w-3.5 h-3.5 text-brand" />
            )}
          </button>

          <NotificationsBell
            userId={userId}
            plan={plan}
            clicksLimit={clicksLimit}
            isMobile
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            setShowUserMenu={setShowUserMenu}
          />

          <div ref={mobileUserMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="w-8 h-8 rounded-full ring-2 ring-[var(--brand-primary)] overflow-hidden bg-brand text-white font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 shadow-md shadow-[var(--brand-primary-glow)]"
            >
              {avatarUrl && !imgError ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={avatarUrl}
                  alt={name}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  onError={() => setImgError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                name.slice(0, 2).toUpperCase()
              )}
            </button>

            {/* Mobile User Dropdown */}
            {showUserMenu && (
              <div className="md:hidden absolute right-0 top-full mt-2 w-64 rounded-[14px] bg-[#141416] border border-[#27272a] shadow-2xl p-2 z-50 text-white animate-in fade-in duration-200">
                <div className="p-2.5 border-b border-[#222225] mb-1 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-[8px] bg-brand text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
                    {avatarUrl && !imgError ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={avatarUrl}
                        alt={name}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-bold text-white truncate">{name}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{email}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs text-neutral-300">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4 text-neutral-400" />
                    <span>Account Settings</span>
                  </Link>

                  <Link
                    href="/dashboard/pricing"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-brand" />
                    <span>Plans & Pricing</span>
                  </Link>

                  <Link
                    href="/docs"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <FileText className="w-4 h-4 text-neutral-400" />
                    <span>API Documentation</span>
                  </Link>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-[8px] text-red-400 hover:bg-red-500/10 transition-colors w-full text-left mt-1 border-t border-[#222225] pt-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. DESKTOP FULL TOPBAR (>= 768px - Orange Theme) ─── */}
      <div className="hidden md:flex h-14 px-6 items-center justify-between">
        {/* Left: Brand Logo & Dynamic Route Breadcrumb -> Navigates to Marketing Home */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group cursor-pointer mr-2" title="Back to homepage">
            <div className="w-8 h-8 rounded-[10px] bg-brand flex items-center justify-center font-bebas text-lg font-black text-white shadow-md shadow-[var(--brand-primary-glow)] group-hover:shadow-[var(--brand-primary-glow)] transition-all shrink-0">
              LS
            </div>
            <div className="flex flex-col">
              <span className="font-bebas text-xl font-bold tracking-wider text-white flex items-center gap-1 group-hover:text-brand transition-colors leading-none">
                L <span className="text-brand">SHORTER</span>
              </span>
            </div>
          </Link>

          <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 pl-3 border-l border-[#222228]">
            {routeSegments.map((crumb, idx) => (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <span className="text-neutral-600 font-semibold select-none">/</span>}
                {crumb.isCurrent ? (
                  <span className="text-brand font-bold tracking-widest">{crumb.label}</span>
                ) : (
                  <Link
                    href={crumb.href}
                    className="hover:text-white transition-colors tracking-widest hover:underline"
                  >
                    {crumb.label}
                  </Link>
                )}
              </React.Fragment>
            ))}
          </nav>
        </div>

        {/* Right Actions: Upgrade, Notifications, User Menu */}
        <div className="flex items-center gap-3">
          {/* Upgrade Plan Pill Button */}
          {plan === "FREEMIUM" && (
            <button
              onClick={() =>
                triggerPlanUpgrade({
                  reason: "Upgrade to PRO Plan to unlock unlimited analytics and 15 custom domains.",
                  featureName: "Unlimited PRO Access",
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-brand-light border border-brand-subtle hover:border-brand text-brand hover:bg-brand-light/80 text-xs font-bold transition-all shadow-sm shadow-[var(--brand-primary-light)] cursor-pointer animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Upgrade to PRO</span>
            </button>
          )}

          {/* Theme Toggle Button Desktop (>= 768px) */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="w-9 h-9 rounded-[10px] bg-[#141416] border border-[#27272a] hover:border-neutral-500 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            {theme === "dark" ? (
              <Sun className="w-4 h-4 text-amber-400 hover:rotate-45 transition-transform" />
            ) : (
              <Moon className="w-4 h-4 text-brand hover:-rotate-12 transition-transform" />
            )}
          </button>

          {/* Notifications Popover */}
          <NotificationsBell
            userId={userId}
            plan={plan}
            clicksLimit={clicksLimit}
            showNotifications={showNotifications}
            setShowNotifications={setShowNotifications}
            setShowUserMenu={setShowUserMenu}
          />

          {/* User Profile Pill - Crisp, sharp, no transform blur */}
          <div ref={userMenuRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-[10px] bg-[#141416] border border-[#27272a] hover:border-neutral-500 hover:bg-[#1a1a1e] transition-colors cursor-pointer group shadow-sm"
            >
              <div className="w-7.5 h-7.5 rounded-[8px] bg-brand text-white flex items-center justify-center font-bold text-xs uppercase shadow-sm overflow-hidden shrink-0 border border-white/10">
                {avatarUrl && !imgError ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={avatarUrl}
                    alt={name}
                    referrerPolicy="no-referrer"
                    crossOrigin="anonymous"
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  name.slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="flex flex-col text-left min-w-0">
                <span className="text-xs font-bold text-white group-hover:text-brand transition-colors truncate max-w-[150px] leading-tight">
                  {name}
                </span>
                <span className="text-[9.5px] text-neutral-400 uppercase font-semibold leading-none mt-0.5">
                  {plan} Plan
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-neutral-400 transition-transform duration-200 shrink-0",
                  showUserMenu ? "rotate-180 text-brand" : "rotate-0"
                )}
              />
            </button>

            {/* Desktop User Menu Dropdown */}
            {showUserMenu && (
              <div className="hidden md:block absolute right-0 top-full mt-2 w-64 rounded-[14px] bg-[#141416] border border-[#27272a] shadow-2xl p-2 z-50 text-white animate-in fade-in duration-200">
                <div className="p-2.5 border-b border-[#222225] mb-1 flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[8px] bg-brand text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
                    {avatarUrl && !imgError ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={avatarUrl}
                        alt={name}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      name.slice(0, 2).toUpperCase()
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <p className="text-xs font-bold text-white truncate">{name}</p>
                    <p className="text-[11px] text-neutral-400 truncate">{email}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-1 text-xs text-neutral-300">
                  <Link
                    href="/dashboard/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <Settings className="w-4 h-4 text-neutral-400" />
                    <span>Account Settings</span>
                  </Link>

                  <Link
                    href="/dashboard/pricing"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <CreditCard className="w-4 h-4 text-brand" />
                    <span>Plans & Pricing</span>
                  </Link>

                  <Link
                    href="/docs"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <FileText className="w-4 h-4 text-neutral-400" />
                    <span>API Documentation</span>
                  </Link>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      signOut({ callbackUrl: "/login" });
                    }}
                    className="flex items-center gap-2.5 p-2 rounded-[8px] text-red-400 hover:bg-red-500/10 transition-colors w-full text-left mt-1 border-t border-[#222225] pt-2 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
