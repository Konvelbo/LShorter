/**
 * LShorter Topbar - Mobile Cyber Blue & Desktop Orange
 */

"use client";

import React, { useState, useMemo } from "react";
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
} from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { cn } from "@/lib/utils";
import { triggerPlanUpgrade } from "@/lib/plan-guard";

export function Topbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [localPlan, setLocalPlan] = useState<string | null>(null);

  React.useEffect(() => {
    const update = () => {
      if (typeof window !== "undefined") {
        setLocalPlan(localStorage.getItem("lshorter_user_plan"));
      }
    };
    update();
    window.addEventListener("lshorter_plan_updated", update);
    return () => window.removeEventListener("lshorter_plan_updated", update);
  }, []);

  // Dynamic Route Breadcrumb calculation
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
      geo: "GÉOGRAPHIE",
      devices: "APPAREILS & FORMATS",
      sources: "SOURCES DE TRAFIC",
      links: "MES LIENS",
      domains: "DOMAINES",
      "qr-code": "QR CODES",
      "api-sdk": "API & SDK",
      settings: "PARAMÈTRES",
      pricing: "TARIFS & OFFRES",
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

  const plan = (localPlan || convexUser?.plan || (session?.user as any)?.plan || "FREEMIUM").toUpperCase();
  const name = convexUser?.name || session?.user?.name || "Mon Compte";
  const email = convexUser?.email || session?.user?.email || "";
  const avatarUrl = convexUser?.avatarUrl || (session?.user as any)?.avatarUrl || session?.user?.image || "";
  const clicksLimit = plan === "BUSINESS" ? -1 : plan === "PRO" ? 1_000_000 : 100_000;

  const notifications = [
    {
      id: 1,
      title: "Bienvenue sur LShorter Edge 🚀",
      desc: "Votre infrastructure Edge Cloudflare est prête à raccourcir et tracker vos liens.",
      time: "il y a 5 min",
      unread: true,
    },
    {
      id: 2,
      title: "Quota mensuel activé",
      desc: `Vous disposez de ${clicksLimit === -1 ? "clics illimités" : `${clicksLimit.toLocaleString()} clics`} sur votre forfait ${plan}.`,
      time: "aujourd'hui",
      unread: false,
    },
  ];

  return (
    <header className="border-b border-[#222225] bg-[#09090b]/85 backdrop-blur-md sticky top-0 z-30 select-none transition-all">
      {/* ─── 1. MOBILE DEDICATED TOPBAR (< 768px - Cyber Blue Theme) ─── */}
      <div className="flex md:hidden h-14 px-3.5 items-center justify-between">
        {/* Left: Blue LS Badge + Title */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-[8px] bg-[#0066FF] flex items-center justify-center font-bebas text-lg font-black text-white shadow-md shadow-[#0066FF]/40">
            LS
          </div>
          <span className="font-bebas text-xl font-bold tracking-wider text-white leading-none">
            L <span className="text-[#0066FF]">SHORTER</span>
          </span>
        </Link>

        {/* Right: Blue Notification Dot & Blue Avatar Ring */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowUserMenu(false);
            }}
            className="w-8 h-8 rounded-[8px] bg-[#10141f] border border-[#1e2942] text-neutral-400 hover:text-white flex items-center justify-center relative cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#0066FF] rounded-full" />
          </button>

          <button
            type="button"
            onClick={() => {
              setShowUserMenu(!showUserMenu);
              setShowNotifications(false);
            }}
            className="w-8 h-8 rounded-full ring-2 ring-[#0066FF]/60 overflow-hidden bg-[#0066FF] text-white font-bold text-xs flex items-center justify-center cursor-pointer active:scale-95 shadow-md shadow-[#0066FF]/30"
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
        </div>
      </div>

      {/* ─── 2. DESKTOP FULL TOPBAR (>= 768px - Orange Theme) ─── */}
      <div className="hidden md:flex h-20 px-8 items-center justify-between">
        {/* Left: Dynamic Route Breadcrumb & User Greeting */}
        <div className="flex flex-col group cursor-default">
          <nav aria-label="Fil d'ariane" className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {routeSegments.map((crumb, idx) => (
              <React.Fragment key={crumb.href}>
                {idx > 0 && <span className="text-neutral-600 font-semibold select-none">/</span>}
                {crumb.isCurrent ? (
                  <span className="text-[#ff6600] font-bold tracking-widest">{crumb.label}</span>
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
          <h1 className="text-2xl font-bold font-bebas tracking-wide text-white flex items-center gap-2">
            HELLO,{" "}
            <span className="text-[#ff6600] drop-shadow-[0_0_20px_rgba(255,102,0,0.35)]">
              {name.toUpperCase()}
            </span>{" "}
            👋
          </h1>
        </div>

        {/* Right Actions: Upgrade, Notifications, User Menu */}
        <div className="flex items-center gap-4">
          {/* Upgrade Plan Pill Button */}
          {plan === "FREEMIUM" && (
            <button
              onClick={() =>
                triggerPlanUpgrade({
                  reason: "Passez au Forfait PRO pour débloquer les analytics illimités et 15 domaines.",
                  featureName: "Accès PRO Illimité",
                })
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#ff6600]/10 border border-[#ff6600]/30 hover:border-[#ff6600] text-[#ff6600] hover:bg-[#ff6600]/20 text-xs font-bold transition-all shadow-sm shadow-[#ff6600]/20 cursor-pointer animate-pulse"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Passer en PRO</span>
            </button>
          )}

          {/* Notifications Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="w-10 h-10 rounded-[10px] bg-[#141416] border border-[#27272a] hover:border-neutral-500 text-neutral-400 hover:text-white flex items-center justify-center transition-colors relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-[#ff6600] rounded-full ring-2 ring-[#141416]" />
            </button>
          </div>

          {/* User Profile Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="btn-hover-scale flex items-center gap-3 pl-2 pr-3 py-1.5 rounded-[10px] bg-[#141416] border border-[#27272a] hover:border-neutral-500 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-[8px] bg-[#ff6600] text-white flex items-center justify-center font-bold text-xs uppercase shadow-md shadow-[#ff6600]/30 overflow-hidden shrink-0">
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
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-white group-hover:text-[#ff6600] transition-colors truncate max-w-[160px]">
                  {name}
                </span>
                <span className="text-[10px] text-neutral-400 uppercase font-semibold">
                  Plan {plan}
                </span>
              </div>
              <ChevronDown
                className={cn(
                  "w-3.5 h-3.5 text-neutral-400 transition-transform duration-300",
                  showUserMenu ? "rotate-180 text-[#ff6600]" : "rotate-0"
                )}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ─── SHARED DROPDOWNS (Notifications & User Menu) ─── */}
      {showNotifications && (
        <div className="absolute right-4 mt-2 w-80 rounded-[14px] bg-[#141416] border border-[#27272a] shadow-2xl p-4 z-50 text-white animate-in fade-in duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-[#222225]">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-300">
              Notifications
            </h3>
            <span className="text-[10px] text-[#0066FF] md:text-[#ff6600] font-semibold cursor-pointer hover:underline">
              Tout marquer lu
            </span>
          </div>

          <div className="flex flex-col gap-2.5 mt-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-2.5 rounded-[8px] transition-colors ${
                  n.unread
                    ? "bg-[#0066FF]/10 md:bg-[#ff6600]/10 border border-[#0066FF]/20 md:border-[#ff6600]/20"
                    : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white">{n.title}</h4>
                  <span className="text-[10px] text-neutral-500">{n.time}</span>
                </div>
                <p className="text-[11px] text-neutral-400 mt-1 leading-snug">{n.desc}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {showUserMenu && (
        <div className="absolute right-4 mt-2 w-64 rounded-[14px] bg-[#141416] border border-[#27272a] shadow-2xl p-2 z-50 text-white animate-in fade-in duration-200">
          <div className="p-2.5 border-b border-[#222225] mb-1 flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[8px] bg-[#0066FF] md:bg-[#ff6600] text-white flex items-center justify-center font-bold text-xs uppercase overflow-hidden shrink-0">
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
              <span>Paramètres du compte</span>
            </Link>

            <Link
              href="/dashboard/pricing"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-white/10 hover:text-white transition-colors"
            >
              <CreditCard className="w-4 h-4 text-[#0066FF] md:text-[#ff6600]" />
              <span>Tarifs & Forfaits</span>
            </Link>

            <Link
              href="/docs"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-white/10 hover:text-white transition-colors"
            >
              <FileText className="w-4 h-4 text-neutral-400" />
              <span>Documentation API</span>
            </Link>

            <button
              onClick={() => {
                setShowUserMenu(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="flex items-center gap-2.5 p-2 rounded-[8px] text-red-400 hover:bg-red-500/10 transition-colors w-full text-left mt-1 border-t border-[#222225] pt-2 cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Se déconnecter</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
