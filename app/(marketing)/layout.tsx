"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  X,
  ArrowRight,
  LayoutDashboard,
} from "lucide-react";
import { useMobileMenu } from "@/components/providers/use-mobile-menu";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { useSession } from "next-auth/react";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isOpen, setIsOpen } = useMobileMenu();
  const pathname = usePathname();
  const { data: session, status } = useSession();

  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ isFullscreen: boolean }>;
      setIsIframeFullscreen(Boolean(customEvent.detail?.isFullscreen));
    };

    window.addEventListener("product-fullscreen-change", handleFullscreenChange);
    return () => {
      window.removeEventListener("product-fullscreen-change", handleFullscreenChange);
    };
  }, []);

  // Lock body scroll & keep drawer visible during the exit slide transition without reflowing the page
  useEffect(() => {
    if (isOpen) {
      setDrawerVisible(true);
      document.body.style.overflow = "hidden";
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") setIsOpen(false);
      };
      window.addEventListener("keydown", onKeyDown);
      return () => {
        window.removeEventListener("keydown", onKeyDown);
      };
    }

    document.body.style.overflow = "";
    const timer = window.setTimeout(() => setDrawerVisible(false), 240);
    return () => {
      window.clearTimeout(timer);
    };
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  const isAuthenticated =
    status === "authenticated" &&
    Boolean(session?.user) &&
    !(session?.user as any)?.userNotFound;
  const hasCompletedOnboarding =
    (session?.user as any)?.hasCompletedOnboarding === true;

  const handleCloseMenu = () => {
    setIsOpen(false);
  };

  const navLinks = [
    { label: "Hi", href: "/", isHome: true },
    { label: "Features", href: "/#features" },
    { label: "Security", href: "/#security" },
    { label: "Difference", href: "/#why-us" },
    { label: "Pricing", href: "/pricing" },
    { label: "Doc & Api", href: "/docs" },
  ];

  if (pathname?.startsWith("/checkout")) {
    return <>{children}</>;
  }

  return (
    <div className="relative min-h-screen w-full bg-[#FAFAFA] dark:bg-[#09090b] text-[#09090B] dark:text-[#fafafa] font-sans">
      <div className="w-full relative flex flex-col">
        <main className="w-full flex flex-col">{children}</main>
        <LandingFooter />
      </div>

      {/* Wrapper de la Navbar masqué sans latence lors du plein écran */}
      <div
        style={{ display: isIframeFullscreen ? "none" : undefined }}
        className={`fixed top-0 inset-x-0 z-[9999] pointer-events-none transition-opacity duration-200 ${
          isIframeFullscreen ? "opacity-0 invisible pointer-events-none -z-50" : ""
        }`}
      >
        <LandingNavbar />
      </div>

      {/* Menu Mobile Drawer GPU-composité (transform + opacity uniquement, zéro reflow sur ouverture/fermeture) */}
      <div
        aria-hidden={!isOpen}
        className={`fixed inset-0 z-[10000] md:hidden overflow-hidden ${
          isOpen ? "pointer-events-auto" : "pointer-events-none"
        } ${!isOpen && !drawerVisible ? "invisible" : "visible"}`}
      >
        <div
          onClick={handleCloseMenu}
          className={`absolute inset-0 bg-black/45 dark:bg-black/65 transition-opacity duration-200 ease-out will-change-[opacity] ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
        />

        <aside
          role="dialog"
          aria-modal={isOpen}
          aria-label="Menu de navigation"
          className={`absolute top-0 right-0 bottom-0 w-[82%] max-w-[320px] flex flex-col justify-between py-6 px-5 bg-[#FAFAFA] dark:bg-[#09090B] border-l border-black/[0.08] dark:border-white/[0.1] shadow-[-16px_0_40px_rgba(0,0,0,0.18)] dark:shadow-[-16px_0_48px_rgba(0,0,0,0.75)] transition-transform duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform [contain:layout_paint_style] ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex items-center justify-between pt-0.5 pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
            <Link
              href="/"
              onClick={handleCloseMenu}
              className="flex items-center gap-2 select-none"
            >
              <div className="w-7 h-7 rounded-[8px] overflow-hidden shrink-0">
                <Image
                  src="/logo.svg"
                  alt="LShorter Logo"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="text-[16px] font-bold tracking-[-0.025em] text-[#09090B] dark:text-white">
                LShorter
              </span>
            </Link>
            <button
              type="button"
              onClick={handleCloseMenu}
              className="w-9 h-9 rounded-full flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white active:scale-90 transition-transform cursor-pointer"
              aria-label="Fermer le menu"
            >
              <X className="w-5 h-5 stroke-[1.75]" />
            </button>
          </div>

          <nav className="flex flex-col justify-center items-stretch gap-1.5 my-auto py-4 w-full overflow-y-auto">
            {navLinks.map((item) => {
              const isActive =
                item.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.href) && !item.href.includes("#");

              return (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={handleCloseMenu}
                  className={`flex items-center justify-between px-4 py-2.5 rounded-[11px] text-[15px] tracking-[-0.01em] outline-none transition-colors ${
                    isActive
                      ? "bg-black/[0.06] dark:bg-white/[0.09] text-[#09090B] dark:text-white font-semibold"
                      : "text-[#52525B] dark:text-[#A1A1AA] font-normal hover:bg-black/[0.03] dark:hover:bg-white/[0.04] hover:text-[#09090B] dark:hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    {isActive && <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />}
                    <span>{item.label}</span>
                  </span>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-black/[0.08] dark:border-white/[0.08] w-full">
            <Link
              href={
                isAuthenticated && hasCompletedOnboarding
                  ? "/dashboard"
                  : isAuthenticated
                  ? "/onboarding"
                  : "/register"
              }
              onClick={handleCloseMenu}
              className="w-full h-11 rounded-[12px] bg-[#3B82F6] hover:bg-[#2563EB] active:scale-[0.98] text-white font-medium text-sm border border-black/[0.06] dark:border-white/[0.1] shadow-xs flex items-center justify-center gap-2 transition-[background-color,transform]"
            >
              {isAuthenticated ? (
                <>
                  <LayoutDashboard className="w-4 h-4 text-white" />
                  <span className="text-white">Go in the dashboard</span>
                </>
              ) : (
                <span className="text-white">Get started free</span>
              )}
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
