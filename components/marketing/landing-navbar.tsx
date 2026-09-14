"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowRight, Menu, X, LayoutDashboard, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

export function LandingNavbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLight, setIsLight] = useState(false);
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated" || Boolean((session as any)?.user);

  useEffect(() => {
    try {
      const isLightClass = document.documentElement.classList.contains("light");
      setIsLight(isLightClass);
    } catch {}
  }, []);

  const toggleTheme = () => {
    const root = document.documentElement;
    if (root.classList.contains("light")) {
      root.classList.remove("light");
      root.classList.add("dark");
      localStorage.setItem("lshorter_theme", "dark");
      setIsLight(false);
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
      localStorage.setItem("lshorter_theme", "light");
      setIsLight(true);
    }
  };

  const handleHomeClick = (e: React.MouseEvent) => {
    if (pathname === "/") {
      e.preventDefault();
      window.location.reload();
    }
  };

  const navLinks = [
    { label: "Home", href: "/", isHome: true },
    { label: "Features", href: "/#features" },
    { label: "Pricing", href: "/pricing" },
    { label: "API & Docs", href: "/docs" },
    { label: "FAQ", href: "/#faq" },
  ];

  return (
    <div className="fixed top-0 inset-x-0 z-50 w-full px-3 pt-3 sm:px-6 sm:pt-4 pointer-events-none transition-all">
      {/* DESKTOP NAVBAR: Sleek Glass Effect, Minimalist Frame */}
      <header className="hidden md:flex max-w-5xl mx-auto bg-[#FAF7F2]/80 dark:bg-[#09090b]/80 hover:bg-[#FAF7F2]/95 dark:hover:bg-[#09090b]/95 backdrop-blur-xl border border-[#E7DFD5] dark:border-white/10 shadow-[0_8px_32px_rgba(43,37,32,0.04)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] rounded-full px-5 py-2.5 items-center justify-between pointer-events-auto transition-all duration-300">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={handleHomeClick}
          className="flex items-center gap-2.5 select-none cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#ff6600] to-[#ffa347] flex items-center justify-center font-bebas text-xl text-white font-bold tracking-wider group-hover:scale-105 transition-transform">
            LS
          </div>
          <span className="font-bebas text-2xl text-neutral-900 dark:text-white tracking-wider flex items-center gap-0.5">
            L<span className="text-[#ff6600]">SHORTER</span>
          </span>
        </Link>

        {/* Center Desktop Links */}
        <nav className="flex items-center gap-1">
          {navLinks.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href) && !item.href.includes("#");
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={item.isHome ? handleHomeClick : undefined}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium tracking-wide transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#E7DFD5]/70 dark:bg-white/15 text-neutral-900 dark:text-white font-semibold"
                    : "text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Theme Switcher */}
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
            title={isLight ? "Switch to dark mode" : "Switch to light mode"}
            aria-label="Toggle theme"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          {isAuthenticated ? (
            <Link href="/dashboard">
              <Button
                variant="glow"
                className="h-8 px-4 text-xs font-semibold rounded-full bg-[#ff6600] hover:bg-[#ff771a] text-white border-none cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#ff6600]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <Link href="/login">
              <Button
                variant="glow"
                className="h-8 px-4 text-xs font-semibold rounded-full bg-[#ff6600] hover:bg-[#ff771a] text-white border-none cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#ff6600]/20 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* MOBILE NAVBAR */}
      <header className="flex md:hidden max-w-6xl mx-auto bg-[#FAF7F2]/90 dark:bg-[#09090b]/90 backdrop-blur-xl border border-[#E7DFD5] dark:border-white/10 shadow-lg rounded-xl px-3.5 py-2 items-center justify-between pointer-events-auto transition-all">
        <Link
          href="/"
          onClick={handleHomeClick}
          className="flex items-center gap-2 select-none"
        >
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#0080ff] to-[#38bdf8] flex items-center justify-center font-bebas text-lg text-white font-bold">
            LS
          </div>
          <span className="font-bebas text-xl text-neutral-900 dark:text-white tracking-wider flex items-center gap-0.5">
            L<span className="text-[#0080ff]">SHORTER</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-neutral-600 dark:text-neutral-400"
            aria-label="Toggle theme"
          >
            {isLight ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="w-8 h-8 rounded-lg bg-neutral-100 dark:bg-white/5 flex items-center justify-center text-neutral-700 dark:text-neutral-300"
            aria-label="Menu"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden max-w-6xl mx-auto mt-2 rounded-xl bg-[#FFFDF9]/95 dark:bg-[#09090b]/95 backdrop-blur-2xl border border-[#E7DFD5] dark:border-white/10 shadow-2xl p-4 flex flex-col gap-2 pointer-events-auto animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href) && !item.href.includes("#");
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={(e) => {
                  setIsMobileMenuOpen(false);
                  if (item.isHome) handleHomeClick(e);
                }}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                  isActive
                    ? "bg-[#E7DFD5]/70 dark:bg-white/15 text-neutral-900 dark:text-white font-semibold"
                    : "text-neutral-700 dark:text-neutral-300 hover:bg-[#F2ECE4] dark:hover:bg-white/5"
                }`}
              >
                {item.label}
              </Link>
            );
          })}

          <div className="pt-2 border-t border-neutral-200 dark:border-white/10 mt-1">
            {isAuthenticated ? (
              <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full text-xs h-9 justify-center bg-[#0080ff] hover:bg-[#0070e0] text-white rounded-lg">
                  <span>Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            ) : (
              <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full text-xs h-9 justify-center bg-[#0080ff] hover:bg-[#0070e0] text-white rounded-lg">
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
