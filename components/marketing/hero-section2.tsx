"use client";

import React from "react";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Sparkles, BookOpen } from "lucide-react";
import { DEFAULT_HERO_SHOWCASE_TABS } from "@/components/ui/hero-195";
import { HeroSection as UIHeroSection } from "@/components/ui/hero-section";

export function HeroSection() {
  const { data: session, status } = useSession();
  const isAuthenticated =
    status === "authenticated" &&
    Boolean(session?.user) &&
    !(session?.user as { userNotFound?: boolean })?.userNotFound;

  return (
    <UIHeroSection
      badge={{
        text: "Edge URL Shortener & Smart Routing",
        action: {
          text: "Explore features",
          href: "#features",
        },
      }}
      title="Control complex edge traffic, track every conversion to real sales, and grow faster."
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
          icon: (
            <BookOpen className="h-4 w-4 text-zinc-600 dark:text-zinc-300" />
          ),
        },
      ]}
      tabs={DEFAULT_HERO_SHOWCASE_TABS}
    />
  );
}

export const HeroSection2 = HeroSection;
export default HeroSection;
