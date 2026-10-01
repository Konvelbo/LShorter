"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { X, ArrowRight, LayoutDashboard, Sun, Moon } from "lucide-react";
import { useMobileMenu } from "@/components/providers/use-mobile-menu";
import { useSession } from "next-auth/react";
import gsap from "gsap";

export function MobileBackdropMenu() {
  const { isOpen, setIsOpen } = useMobileMenu();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const linksRef = useRef<HTMLAnchorElement[]>([]);

  const isAuthenticated =
    status === "authenticated" &&
    Boolean(session?.user) &&
    !(session?.user as any)?.userNotFound;

  const toggleTheme = () => {
    const root = document.documentElement;
    const isDark = root.classList.contains("dark");
    if (isDark) {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("lshorter_theme", "light");
    } else {
      root.classList.remove("light");
      root.classList.add("dark");
      localStorage.setItem("lshorter_theme", "dark");
    }
  };

  const navLinks = [
    { label: "Hi", href: "/", isHome: true },
    { label: "Platform", href: "/#product" },
    { label: "Features", href: "/#features" },
    { label: "Security", href: "/#security" },
    { label: "Difference", href: "/#why-us" },
    { label: "Limits", href: "/#analytics" },
    { label: "FAQ", href: "/#faq" },
    { label: "Pricing", href: "/pricing" },
    { label: "Docs", href: "/docs" },
  ];

  useEffect(() => {
    const links = linksRef.current.filter(Boolean);
    if (links.length === 0) return;

    if (isOpen) {
      gsap.fromTo(
        links,
        { opacity: 0, x: 20 },
        {
          opacity: 1,
          x: 0,
          stagger: 0.03,
          duration: 0.24,
          ease: "power2.out",
          delay: 0.05,
        },
      );
    } else {
      gsap.to(links, { opacity: 0, x: 20, duration: 0.15, ease: "power1.in" });
    }
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-y-0 right-0 z-0 w-full flex justify-end md:hidden pointer-events-auto transition-opacity duration-300 bg-[#F4F4F5] dark:bg-[#0A0A0A] text-[#09090B] dark:text-[#FAFAFA] ${
        isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      <div className="w-[58%] max-w-[300px] h-full flex flex-col justify-between py-8 px-6">
        {/* Croix de fermeture en haut à droite */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-black/[0.04] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.08] text-[#52525B] dark:text-[#A1A1AA] hover:text-[#09090B] dark:hover:text-white active:scale-90 transition-all"
            aria-label="Fermer le menu"
          >
            <X className="w-5 h-5 stroke-[1.75]" />
          </button>
        </div>

        {/* Liens verticaux identiques à landing-navbar */}
        <nav className="flex flex-col gap-2.5 my-auto pl-1">
          {navLinks.map((item, index) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href) && !item.href.includes("#");

            return (
              <Link
                key={item.label}
                href={item.href}
                ref={(el) => {
                  if (el) linksRef.current[index] = el;
                }}
                onClick={() => setIsOpen(false)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[10px] text-base tracking-[-0.01em] transition-colors ${
                  isActive
                    ? "bg-black/[0.05] dark:bg-white/[0.08] text-[#09090B] dark:text-white font-medium"
                    : "text-[#52525B] dark:text-[#A1A1AA] font-normal hover:text-[#09090B] dark:hover:text-white"
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6]" />
                )}
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bas : Accès Dashboard / Get Started (sans toggle thème) */}
        <div className="pt-4 border-t border-black/[0.08] dark:border-white/[0.08]">
          <Link
            href={isAuthenticated ? "/dashboard" : "/register"}
            onClick={() => setIsOpen(false)}
            className="w-full h-11 rounded-[12px] bg-[#3B82F6] hover:bg-[#2563EB] text-white text-xs sm:text-sm font-medium flex items-center justify-center gap-2 shadow-xs transition-colors"
          >
            <span>{isAuthenticated ? "Go in the dashboard" : "Get started free"}</span>
            <ArrowRight className="w-3.5 h-3.5 text-white" />
          </Link>
        </div>
      </div>
    </div>
  );
}
