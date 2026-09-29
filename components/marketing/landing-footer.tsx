"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUpRight } from "lucide-react";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Country & Device Routing", href: "/docs/geo-routing" },
      { label: "Weighted A/B Testing", href: "/docs/ab-testing-routing" },
      { label: "Revenue Attribution (EPC)", href: "/docs/conversion-tracking-amount-count" },
      { label: "Dynamic QR Studio", href: "/docs/dynamic-qr-codes" },
    ],
  },
  {
    title: "Security & Access",
    links: [
      { label: "PathLock™ PIN Protection", href: "/docs/pin-protection" },
      { label: "Zero-Referrer URL Cloaking", href: "/docs/url-masking" },
      { label: "Click Limits & Expiration", href: "/docs/click-limits-and-expiration" },
      { label: "Custom OpenGraph Cards", href: "/docs/social-sharing-opengraph" },
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
    title: "Workspace",
    links: [
      { label: "Interactive Product Demo", href: "/#product" },
      { label: "Dashboard Overview", href: "/dashboard" },
      { label: "Geo Analytics Map", href: "/dashboard/analytics/geo" },
      { label: "Live Click Stream", href: "/dashboard/analytics/live" },
    ],
  },
];

export function LandingFooter() {
  const { data: session, status } = useSession();
  const footerRef = useRef<HTMLElement>(null);
  const isAuthenticated =
    status === "authenticated" &&
    Boolean(session?.user) &&
    !(session?.user as any)?.userNotFound;

  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || "https://github.com/lshorter";
  const twitterUrl = process.env.NEXT_PUBLIC_TWITTER_URL || "https://x.com/lshorter";
  const linkedinUrl = process.env.NEXT_PUBLIC_LINKEDIN_URL || "https://linkedin.com/company/lshorter";

  useEffect(() => {
    if (!footerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".footer-reveal-item",
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.1,
          ease: "expo.out",
          scrollTrigger: {
            trigger: footerRef.current,
            start: "top 85%",
          },
        }
      );
    }, footerRef);
    return () => ctx.revert();
  }, []);

  const handleScrollToProduct = (e: React.MouseEvent) => {
    const productEl = document.getElementById("product");
    if (productEl) {
      e.preventDefault();
      productEl.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <footer
      ref={footerRef}
      className="w-full bg-[#F9FAFB] dark:bg-[#0B0B0B] text-[#101828] dark:text-[#FFFFFF] border-t border-[#E4E7EC] dark:border-[#1E1E1E] transition-colors duration-300"
    >
      {/* Monumental Pre-Footer CTA */}
      <div className="footer-reveal-item max-w-[1320px] mx-auto px-4 sm:px-8 pt-20 pb-20 md:pt-28 md:pb-24 text-center">
        <span className="inline-block text-[11px] font-mono uppercase tracking-[0.18em] text-[#465FFF] mb-5">
          NEXT-GEN LINK INFRASTRUCTURE
        </span>
        <h2 className="text-[36px] sm:text-[54px] md:text-[64px] font-normal tracking-[-0.035em] leading-[1.04] text-[#101828] dark:text-[#FFFFFF] max-w-[760px] mx-auto">
          Stop guessing.
          <br />
          <span className="text-[#667085] dark:text-[#8E8E8E]">Start improving.</span>
        </h2>
        <p className="mt-6 text-[15px] sm:text-[15.5px] text-[#475467] dark:text-[#9A9A9A] max-w-[520px] mx-auto leading-[1.6]">
          Deploy custom domains, ISO country routing, A/B split testing, PathLock™ PIN gates, and deterministic revenue attribution in under two minutes.
        </p>

        <div className="mt-9 flex flex-col sm:flex-row items-center justify-center gap-3.5">
          <Link
            href={isAuthenticated ? "/dashboard" : "/register"}
            onMouseEnter={(e) => {
              gsap.to(e.currentTarget, { scale: 1.04, duration: 0.32, ease: "expo.out" });
              const arrow = e.currentTarget.querySelector(".footer-cta-arrow");
              if (arrow) gsap.to(arrow, { x: 2, y: -2, duration: 0.32, ease: "expo.out" });
            }}
            onMouseLeave={(e) => {
              gsap.to(e.currentTarget, { scale: 1, duration: 0.32, ease: "expo.out" });
              const arrow = e.currentTarget.querySelector(".footer-cta-arrow");
              if (arrow) gsap.to(arrow, { x: 0, y: 0, duration: 0.32, ease: "expo.out" });
            }}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-full bg-[#465FFF] hover:bg-[#3641F5] text-white pl-6 pr-2.5 py-2.5 text-[13.5px] font-semibold transition-colors shadow-xs"
          >
            <span className="!text-white">
              {isAuthenticated ? "Dashboard" : "Get started"}
            </span>
            <span className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <ArrowUpRight className="footer-cta-arrow w-3.5 h-3.5 text-white" />
            </span>
          </Link>
          <Link
            href="/#product"
            onClick={handleScrollToProduct}
            onMouseEnter={(e) =>
              gsap.to(e.currentTarget, { scale: 1.03, duration: 0.32, ease: "expo.out" })
            }
            onMouseLeave={(e) =>
              gsap.to(e.currentTarget, { scale: 1, duration: 0.32, ease: "expo.out" })
            }
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-full bg-white dark:bg-[#1C1C1C] hover:bg-[#F2F4F7] dark:hover:bg-[#262626] text-[#101828] dark:text-[#FFFFFF] border border-[#D0D5DD] dark:border-[#2E2E2E] px-6 py-2.5 text-[13.5px] font-medium transition-colors"
          >
            Open live dashboard
          </Link>
        </div>
      </div>

      {/* 4-Column Vertical Divider Table */}
      <div className="footer-reveal-item border-t border-[#E4E7EC] dark:border-[#1E1E1E]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#E4E7EC] dark:divide-[#1E1E1E]">
            {FOOTER_COLUMNS.map((col) => (
              <div
                key={col.title}
                className="py-8 md:py-10 md:px-6 first:md:pl-0 last:md:pr-0"
              >
                <div className="text-[12px] font-mono uppercase tracking-[0.14em] text-[#667085] dark:text-[#777777] mb-4 sm:mb-5">
                  {col.title}
                </div>
                <ul className="space-y-3">
                  {col.links.map((lnk) => (
                    <li key={lnk.label}>
                      <Link
                        href={lnk.href}
                        className="text-[13.5px] text-[#475467] dark:text-[#C8C8C8] hover:text-[#465FFF] dark:hover:text-[#FFFFFF] transition-colors"
                      >
                        {lnk.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Legal, Official Cloudflare Badge & Social Links */}
      <div className="footer-reveal-item border-t border-[#E4E7EC] dark:border-[#1E1E1E]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-7 flex flex-col lg:flex-row items-center justify-between gap-6 text-[12.5px] text-[#667085] dark:text-[#888888]">
          {/* Left: Brand Copyright + Built on Cloudflare */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-[6px] bg-[#465FFF] text-white font-extrabold text-[10px] flex items-center justify-center">
                LS
              </div>
              <span className="font-semibold text-[#101828] dark:text-[#FFFFFF] tracking-tight">
                LShorter
              </span>
              <span>© {new Date().getFullYear()} LShorter Inc.</span>
            </div>

            {/* Official Cloudflare Logo Badge */}
            <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white dark:bg-[#141416] border border-[#E4E7EC] dark:border-[#26262B] text-[#344054] dark:text-[#E4E4E7] text-[12px] font-medium shadow-2xs">
              <svg
                className="w-5 h-3.5 shrink-0"
                viewBox="0 0 64 42"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-label="Cloudflare Logo"
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
              <span>
                Built on{" "}
                <strong className="text-[#101828] dark:text-white font-semibold">
                  Cloudflare
                </strong>{" "}
                Edge Network
              </span>
            </div>
          </div>

          {/* Center: Operational Status */}
          <div className="inline-flex items-center gap-2 text-[#475467] dark:text-[#A0A0A0]">
            <span className="w-2 h-2 rounded-full bg-[#12B76A] animate-pulse" />
            <span>All 310+ Cloudflare Edge PoPs Operational</span>
          </div>

          {/* Right: Social Icons + Legal */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              {/* GitHub */}
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                title="GitHub"
                className="w-8 h-8 rounded-full bg-white dark:bg-[#161618] border border-[#E4E7EC] dark:border-[#26262B] flex items-center justify-center text-[#475467] dark:text-[#A0A0A0] transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-[#24292F] hover:text-white dark:hover:bg-white dark:hover:text-[#24292F] hover:border-[#24292F]"
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                </svg>
              </a>

              {/* Twitter / X */}
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Twitter / X"
                title="Twitter / X"
                className="w-8 h-8 rounded-full bg-white dark:bg-[#161618] border border-[#E4E7EC] dark:border-[#26262B] flex items-center justify-center text-[#475467] dark:text-[#A0A0A0] transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2]"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>

              {/* LinkedIn */}
              <a
                href={linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                title="LinkedIn"
                className="w-8 h-8 rounded-full bg-white dark:bg-[#161618] border border-[#E4E7EC] dark:border-[#26262B] flex items-center justify-center text-[#475467] dark:text-[#A0A0A0] transition-all duration-300 hover:scale-110 active:scale-95 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2]"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
                </svg>
              </a>
            </div>

            <div className="flex items-center gap-4 border-l border-[#E4E7EC] dark:border-[#222226] pl-4">
              <Link
                href="/docs"
                className="hover:text-[#101828] dark:hover:text-white transition-colors"
              >
                Privacy
              </Link>
              <Link
                href="/docs"
                className="hover:text-[#101828] dark:hover:text-white transition-colors"
              >
                Terms
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default LandingFooter;
