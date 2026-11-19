"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  X,
  LayoutDashboard,
} from "lucide-react";
import { useMobileMenu } from "@/components/providers/use-mobile-menu";
import { LandingNavbar } from "@/components/marketing/landing-navbar";
import { LandingFooter } from "@/components/marketing/landing-footer";
import { useSession } from "next-auth/react";
import { SmoothScrollProvider } from "@/components/providers/smooth-scroll-provider";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";

const MARKETING_NAV_LINKS = [
  { label: "Hi", href: "/", isHome: true },
  { label: "Features", href: "/#features" },
  { label: "Security", href: "/#security" },
  { label: "Difference", href: "/#why-us" },
  { label: "Pricing", href: "/pricing" },
  { label: "Doc & Api", href: "/docs" },
];

/**
 * Isolated mobile drawer so toggling the menu never re-renders MarketingLayout,
 * SmoothScrollProvider, page sections, or LandingFooter (and never mutates
 * document.body.style.overflow, avoiding full-page synchronous reflows).
 */
const MarketingMobileDrawer = React.memo(function MarketingMobileDrawer() {
  const { isOpen, setIsOpen } = useMobileMenu();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const overlayRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const prevFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    prevFocusRef.current = document.activeElement as HTMLElement | null;
    closeBtnRef.current?.focus({ preventScroll: true });

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        return;
      }
      if (e.key === "Tab" && drawerRef.current) {
        const focusables = drawerRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        );
        if (focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const active = document.activeElement as HTMLElement | null;
        if (e.shiftKey) {
          if (!drawerRef.current.contains(active) || active === first) {
            e.preventDefault();
            last.focus();
          }
        } else if (!drawerRef.current.contains(active) || active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    // Prevent background scroll chaining without mutating document.body.style.overflow (zero page reflow)
    const overlay = overlayRef.current;
    const blockBackgroundScroll = (e: Event) => {
      const nav = navRef.current;
      if (nav && nav.contains(e.target as Node) && nav.scrollHeight > nav.clientHeight) {
        return;
      }
      e.preventDefault();
    };

    window.addEventListener("keydown", onKeyDown);
    overlay?.addEventListener("wheel", blockBackgroundScroll, { passive: false });
    overlay?.addEventListener("touchmove", blockBackgroundScroll, { passive: false });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      overlay?.removeEventListener("wheel", blockBackgroundScroll);
      overlay?.removeEventListener("touchmove", blockBackgroundScroll);
      prevFocusRef.current?.focus?.({ preventScroll: true });
    };
  }, [isOpen, setIsOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [pathname, setIsOpen]);

  const sessionUser = session?.user as
    | { userNotFound?: boolean; hasCompletedOnboarding?: boolean }
    | undefined;
  const isAuthenticated =
    status === "authenticated" &&
    Boolean(sessionUser) &&
    !sessionUser?.userNotFound;
  const hasCompletedOnboarding = sessionUser?.hasCompletedOnboarding === true;

  const handleCloseMenu = () => setIsOpen(false);

  return (
    <div
      ref={overlayRef}
      inert={!isOpen ? true : undefined}
      aria-hidden={!isOpen}
      className={`fixed inset-0 z-[10000] md:hidden overflow-hidden ${
        isOpen ? "pointer-events-auto" : "pointer-events-none"
      }`}
    >
      <div
        onClick={handleCloseMenu}
        className={`absolute inset-0 bg-black/45 dark:bg-black/65 touch-none transition-opacity duration-200 ease-out will-change-[opacity] ${
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        ref={drawerRef}
        role="dialog"
        aria-modal={isOpen}
        aria-label="Menu de navigation"
        className={`absolute top-0 right-0 bottom-0 w-[82%] max-w-[320px] flex flex-col justify-between py-6 px-5 bg-[#FAFAFA] dark:bg-[#09090B] border-l border-black/[0.08] dark:border-white/[0.1] transform-gpu transition-transform duration-[220ms] ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform [contain:layout_paint_style] overscroll-contain ${
          isOpen
            ? "translate-x-0 shadow-[-16px_0_40px_rgba(0,0,0,0.18)] dark:shadow-[-16px_0_48px_rgba(0,0,0,0.75)]"
            : "translate-x-full shadow-none"
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
            ref={closeBtnRef}
            type="button"
            onClick={handleCloseMenu}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white active:scale-90 transition-transform cursor-pointer"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        <nav
          ref={navRef}
          className="flex flex-col justify-center items-stretch gap-1.5 my-auto py-4 w-full overflow-y-auto overscroll-contain"
        >
          {MARKETING_NAV_LINKS.map((item) => {
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
          <WaveRevealButton
            href={
              isAuthenticated && hasCompletedOnboarding
                ? "/dashboard"
                : isAuthenticated
                ? "/onboarding"
                : "/register"
            }
            onClick={handleCloseMenu}
            variant="primary"
            size="md"
            className="w-full"
            icon={
              isAuthenticated ? (
                <LayoutDashboard className="w-4 h-4 text-white" />
              ) : undefined
            }
          >
            {isAuthenticated ? "Go in the dashboard" : "Get started free"}
          </WaveRevealButton>
        </div>
      </aside>
    </div>
  );
});

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [isIframeFullscreen, setIsIframeFullscreen] = useState(false);

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

  if (pathname?.startsWith("/checkout")) {
    return <>{children}</>;
  }

  return (
    <SmoothScrollProvider>
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

        {/* Menu Mobile Drawer isolé (GPU-composité, zéro re-render de la page, zéro body overflow reflow) */}
        <MarketingMobileDrawer />
      </div>
    </SmoothScrollProvider>
  );
}
