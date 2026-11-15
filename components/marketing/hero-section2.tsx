"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Sparkles, BookOpen } from "lucide-react";
import { withScreenshotCacheBuster } from "@/lib/themed-screenshots";
import { HeroSection as UIHeroSection } from "@/components/ui/hero-section";

export function HeroSection() {
  const { data: session, status } = useSession();
  const isAuthenticated =
    status === "authenticated" &&
    Boolean(session?.user) &&
    !(session?.user as any)?.userNotFound;

  return (
    <UIHeroSection
      badge={{
        text: "Edge URL Shortener & Smart Routing",
        action: {
          text: "Explore features",
          href: "#features",
        },
      }}
      title="Stop wasting ad traffic. Route, convert, and attribute every click to real sales."
      description="LShorter unifies branded link shortening, programmable ISO Country & Device edge routing, weighted A/B testing, PathLock™ PIN & destination masking, high-converting bio micro-sites, and cookie-free revenue attribution inside one workspace."
      actions={[
        {
          text: isAuthenticated ? "Dashboard" : "Get started",
          href: isAuthenticated ? "/dashboard" : "/register",
          variant: "default",
          icon: isAuthenticated ? (
            <LayoutDashboard className="h-4 w-4 text-white" />
          ) : (
            <Sparkles className="h-4 w-4 text-white" />
          ),
        },
        {
          text: "API documentation",
          href: "/docs",
          variant: "outline",
          icon: <BookOpen className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />,
        },
      ]}
      image={{
        light: withScreenshotCacheBuster(
          "/screenshots/dashboard/dashboardwithsidbare_light1.webp"
        ),
        dark: withScreenshotCacheBuster(
          "/screenshots/dashboard/dashboardwithsidbare_dark1.webp"
        ),
        alt: "LShorter Enterprise Dashboard Preview",
      }}
    />
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
