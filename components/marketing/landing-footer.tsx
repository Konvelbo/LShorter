"use client";

import React, { useRef, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { LayoutDashboard, Link2, BookOpen } from "lucide-react";
import { WaveRevealButton } from "@/components/ui/wave-reveal-button";
import {
  SectionRailFrame,
  SwissSectionIndex,
  CrosshairNode,
} from "@/components/marketing/swiss-frame";

const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Smart Geo & Device Routing", href: "/docs/geo-routing" },
      { label: "Weighted A/B Testing", href: "/docs/ab-testing-routing" },
      {
        label: "Stripe Revenue Attribution",
        href: "/docs/conversion-tracking-amount-count",
      },
      { label: "Dynamic QR Studio", href: "/docs/dynamic-qr-codes" },
    ],
  },
  {
    title: "Security & Access",
    links: [
      { label: "PathLock™ Perimeter Control", href: "/docs/pin-protection" },
      { label: "White-Label URL Masking", href: "/docs/url-masking" },
      {
        label: "Click Caps & Auto-Expiry",
        href: "/docs/click-limits-and-expiration",
      },
      {
        label: "Custom OpenGraph Cards",
        href: "/docs/social-sharing-opengraph",
      },
    ],
  },
  {
    title: "Developers",
    links: [
      { label: "REST API & SDK Quickstart", href: "/docs/sdk-quickstart" },
      { label: "Real-Time Click Telemetry", href: "/docs/realtime-analytics" },
      { label: "Signed Webhooks & Events", href: "/docs/webhooks-and-events" },
      { label: "Full Documentation Hub", href: "/docs" },
    ],
  },
  {
    title: "Company & Legal",
    links: [
      { label: "Pricing & Free Plan", href: "/pricing" },
      { label: "Privacy Policy (GDPR)", href: "/privacy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Billing & Refund Policy", href: "/refund" },
    ],
  },
];

export const LandingFooter = React.memo(function LandingFooter() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const footerRef = useRef<HTMLElement>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const isAuthenticated =
    status === "authenticated" &&
    Boolean(session?.user) &&
    !(session?.user as { userNotFound?: boolean } | undefined)?.userNotFound;

  const githubUrl =
    process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/lshorter";
  const twitterUrl =
    process.env.NEXT_PUBLIC_TWITTER_URL || "https://x.com/lshorter";
  const linkedinUrl =
    process.env.NEXT_PUBLIC_LINKEDIN_URL ||
    "https://linkedin.com/company/lshorter";

  useEffect(() => {
    const el = footerRef.current;
    if (
      !el ||
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined"
    ) {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setIsRevealed(true);
          observer.disconnect();
        }
      },
      { rootMargin: "120px 0px", threshold: 0.01 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [pathname]);

  const handlePrimaryCta = (e: React.MouseEvent) => {
    if (isAuthenticated) return;
    e.preventDefault();
    if (pathname === "/") {
      const el = document.getElementById("hero-shortener");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
      window.dispatchEvent(new CustomEvent("lshorter_focus_shortener"));
    } else {
      router.push("/#hero-shortener");
    }
  };

  return (
    <footer
      ref={footerRef}
      className="w-full bg-[#FFFFFF] dark:bg-[#09090B] text-[#09090B] dark:text-[#FFFFFF] border-t border-[#E4E7EC] dark:border-white/[0.08] transition-colors duration-300 overflow-x-clip"
    >
      {/* Monumental Minimal Architectural CTA Band (distinct from PathLock, zero radial blur) */}
      <SectionRailFrame
        showBottomCrosshairs
        className={`relative px-4 sm:px-8 py-16 sm:py-24 transition-[opacity,transform] duration-500 ease-out ${
          isRevealed ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
        }`}
      >
        <div className="rounded-[10px] border border-[#D0D5DD] dark:border-white/14 bg-[#F7F8FA] dark:bg-[#0D0E12] p-7 sm:p-12 lg:p-14 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center relative overflow-hidden">
          <CrosshairNode className="hidden sm:inline-flex absolute top-3 left-3 opacity-60" />
          <CrosshairNode className="hidden sm:inline-flex absolute top-3 right-3 opacity-60" />

          <div className="lg:col-span-6">
            <SwissSectionIndex
              index="10"
              label="PROVISION"
              meta="10 SECONDS TO FIRST LINK"
            />
            <h2 className="mt-4 text-[clamp(30px,4vw,48px)] font-bold tracking-[-0.045em] leading-[1.03] text-[#09090B] dark:text-white">
              Stop sharing blind links. Provision your first governed route.
            </h2>
            <p className="mt-4 text-[15px] sm:text-[16px] text-[#475467] dark:text-zinc-400 leading-[1.6] max-w-[520px]">
              Test LShorter live from the homepage without creating an account,
              or start free forever with 50 permanent links and 10,000 monthly
              edge clicks.
            </p>
          </div>

          <div className="lg:col-span-6 flex flex-col items-stretch sm:items-start lg:items-end justify-center gap-3.5">
            <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row gap-3 w-full sm:w-auto">
              <WaveRevealButton
                href={isAuthenticated ? "/dashboard" : "/#hero-shortener"}
                onClick={isAuthenticated ? undefined : handlePrimaryCta}
                variant="primary"
                size="lg"
                icon={
                  isAuthenticated ? (
                    <LayoutDashboard className="w-4 h-4" />
                  ) : (
                    <Link2 className="w-4 h-4" />
                  )
                }
              >
                {isAuthenticated
                  ? "Open Dashboard"
                  : "Shorten a link — no signup"}
              </WaveRevealButton>

              <WaveRevealButton
                href="/docs"
                variant="outline"
                size="lg"
                icon={<BookOpen className="w-4 h-4" />}
              >
                Read API documentation
              </WaveRevealButton>
            </div>
            <p className="font-mono text-[11px] text-[#667085] dark:text-zinc-400">
              Starter $0 forever · No credit card · Upgrade or cancel anytime
            </p>
          </div>
        </div>
      </SectionRailFrame>

      {/* 4-Column Footer Navigation */}
      <div className="border-t border-[#E4E7EC] dark:border-white/[0.08]">
        <SectionRailFrame className="px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E4E7EC] dark:divide-white/[0.08]">
            {FOOTER_COLUMNS.map((col) => (
              <div
                key={col.title}
                className="py-8 md:py-10 md:px-6 first:md:pl-0 last:md:pr-0"
              >
                <div className="font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-[#667085] dark:text-zinc-500 mb-4">
                  {col.title}
                </div>
                <ul className="space-y-3">
                  {col.links.map((lnk) => (
                    <li key={lnk.label}>
                      <Link
                        href={lnk.href}
                        className="text-[13.5px] text-[#475467] dark:text-zinc-300 hover:text-[#0066FF] dark:hover:text-[#5294FF] transition-colors"
                      >
                        {lnk.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </SectionRailFrame>
      </div>

      {/* Bottom Legal, Cloudflare Edge Badge & Social Links */}
      <div className="border-t border-[#E4E7EC] dark:border-white/[0.08] bg-[#F7F8FA] dark:bg-[#0B0C0E]">
        <SectionRailFrame className="px-4 sm:px-8 py-6 flex flex-col lg:flex-row items-center justify-between gap-5 text-[12.5px] text-[#667085] dark:text-zinc-400">
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-[6px] overflow-hidden shrink-0 shadow-2xs">
                <Image
                  src="/logo.svg"
                  alt="LShorter Logo"
                  width={24}
                  height={24}
                  className="w-full h-full object-contain"
                  loading="eager"
                />
              </div>
              <span className="font-bold text-[#101828] dark:text-white tracking-tight">
                LShorter
              </span>
              <span className="font-mono text-[11.5px]">
                © {new Date().getFullYear()} LShorter.
              </span>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[8px] bg-white dark:bg-[#14151A] border border-[#E4E7EC] dark:border-white/10 text-[#344054] dark:text-zinc-200 font-mono text-[11.5px] font-medium">
              <svg
                className="w-4.5 h-3 shrink-0"
                viewBox="0 0 64 42"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M46.6 33.8H16.2C10.9 33.8 6.6 29.6 6.6 24.3C6.6 19.5 10.1 15.5 14.8 14.9C16.2 8.2 22.1 3.2 29.2 3.2C36.9 3.2 43.3 9.1 43.9 16.6C44.8 16.3 45.7 16.2 46.6 16.2C51.5 16.2 55.4 20.1 55.4 25C55.4 29.9 51.5 33.8 46.6 33.8Z"
                  fill="#F38020"
                />
                <path
                  d="M52.2 18.8C51.6 18.8 51 18.9 50.5 19.1C49.6 14.8 45.8 11.6 41.2 11.6C39.6 11.6 38.1 12 36.8 12.7C39.7 15.1 41.6 18.7 41.8 22.8H42.5C45.9 22.8 48.6 25.5 48.6 28.9C48.6 30.8 47.7 32.5 46.4 33.6H52.2C56.3 33.6 59.6 30.3 59.6 26.2C59.6 22.1 56.3 18.8 52.2 18.8Z"
                  fill="#FAAE40"
                />
              </svg>
              <span>Cloudflare 310+ Edge PoPs</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 font-mono text-[11.5px] text-[#475467] dark:text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Global Edge Network Operational</span>
          </div>

          <div className="flex flex-wrap items-center justify-center lg:justify-end gap-4">
            <div className="flex items-center gap-3 text-[12px]">
              <Link
                href="/privacy"
                className="hover:text-[#0066FF] dark:hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <span className="text-[#D0D5DD] dark:text-zinc-700">/</span>
              <Link
                href="/terms"
                className="hover:text-[#0066FF] dark:hover:text-white transition-colors"
              >
                Terms
              </Link>
              <span className="text-[#D0D5DD] dark:text-zinc-700">/</span>
              <Link
                href="/refund"
                className="hover:text-[#0066FF] dark:hover:text-white transition-colors"
              >
                Billing Policy
              </Link>
            </div>

            <div className="hidden sm:block w-px h-3.5 bg-[#E4E7EC] dark:bg-white/12" />

            <div className="flex items-center gap-2">
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="w-8 h-8 rounded-[8px] bg-white dark:bg-[#14151A] border border-[#E4E7EC] dark:border-white/10 flex items-center justify-center text-[#475467] dark:text-zinc-400 hover:bg-[#0066FF] hover:text-white hover:border-[#0066FF] transition-colors"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="X (Twitter)"
                className="w-8 h-8 rounded-[8px] bg-white dark:bg-[#14151A] border border-[#E4E7EC] dark:border-white/10 flex items-center justify-center text-[#475467] dark:text-zinc-400 hover:bg-[#0066FF] hover:text-white hover:border-[#0066FF] transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="w-8 h-8 rounded-[8px] bg-white dark:bg-[#14151A] border border-[#E4E7EC] dark:border-white/10 flex items-center justify-center text-[#475467] dark:text-zinc-400 hover:bg-[#0066FF] hover:text-white hover:border-[#0066FF] transition-colors"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>
            </div>
          </div>
        </SectionRailFrame>
      </div>
    </footer>
  );
});

export default LandingFooter;
