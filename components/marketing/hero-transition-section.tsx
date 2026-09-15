"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ExternalLink,
  QrCode,
  Globe2,
  Copy,
  Link2,
  BarChart2,
  Plus,
  ArrowUpRight,
  Share2,
  RefreshCw,
  Edit3,
  KeyRound,
  Settings,
  Home,
  BarChart3,
  Menu,
  Bell,
  Sun,
  FileText,
  HelpCircle,
  PanelLeftClose,
  ChevronDown,
  LayoutDashboard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShinyText } from "@/components/ui/shiny-text";
import { TextType } from "@/components/ui/text-type";
import PlasmaWave from "./plasma-wave";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarImage } from "../ui/avatar";

export function HeroTransitionSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── FRAMER MOTION SCROLL PHYSICS (Transition Hero -> Section 2) ───
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  // 0. PlasmaWave Background: ONLY visible in Hero Section! Fades completely to 0 on scroll down into Section 2
  const heroGridOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);

  // 1. Hero Text & CTAs (Phase 1: Fades out and glides up on initial scroll)
  const heroOpacity = useTransform(smoothProgress, [0, 0.2], [1, 0]);
  const heroY = useTransform(smoothProgress, [0, 0.2], [0, -80]);

  // 2. Mobile Phone Frame (Phase 1: Shares exact same 520px height, top alignment, 3D tilt as Desktop, collapses on scroll)
  const mobileOpacity = useTransform(smoothProgress, [0, 0.18], [1, 0]);
  const mobileX = useTransform(smoothProgress, [0, 0.18], [0, 50]);
  const mobileWidth = useTransform(smoothProgress, [0, 0.22], ["275px", "0px"]);
  const mobileMarginLeft = useTransform(
    smoothProgress,
    [0, 0.22],
    ["16px", "0px"],
  );

  // 3. Desktop Frame Transform:
  // Starts with 3D perspective tilt (rotateX: 14deg), scale 0.80, height 520px matching Mobile Frame exactly
  // Zooms smoothly with dramatic scale (0.80 -> 1.0), stands upright (14deg -> 0deg),
  // expands to full width (1152px / max-w-6xl) and 82vh height (max 860px, min 600px) in a 110vh stage
  const desktopScale = useTransform(smoothProgress, [0, 0.45], [0.8, 1.0]);
  const desktopRotateX = useTransform(smoothProgress, [0, 0.4], [14, 0]);
  const desktopWidth = useTransform(
    smoothProgress,
    [0.05, 0.45],
    ["980px", "1300px"],
  );
  const desktopHeight = useTransform(
    smoothProgress,
    [0.05, 0.45],
    ["420px", "82vh"],
  );
  const desktopMinHeight = useTransform(
    smoothProgress,
    [0.05, 0.45],
    ["520px", "600px"],
  );
  const desktopY = useTransform(smoothProgress, [0.05, 0.45], [0, -80]);

  // 4. Section 2 Header: Fades in between 0.35 and 0.50 once the frame arrives in Section 2
  const section2HeaderOpacity = useTransform(
    smoothProgress,
    [0.35, 0.5],
    [0, 1],
  );
  const section2HeaderY = useTransform(smoothProgress, [0.35, 0.5], [15, 0]);

  // Pointer events helper
  const [isHeroActive, setIsHeroActive] = useState(true);
  useEffect(() => {
    return smoothProgress.on("change", (v) => {
      setIsHeroActive(v < 0.25);
    });
  }, [smoothProgress]);

  // ─── DASHBOARD OVERVIEW DATA (100% Pure Static Replica) ───
  const dailyClicksData = [
    { date: "01 Mar", clicks: 2400 },
    { date: "03 Mar", clicks: 3600 },
    { date: "05 Mar", clicks: 3100 },
    { date: "07 Mar", clicks: 4800 },
    { date: "09 Mar", clicks: 6200 },
    { date: "11 Mar", clicks: 5800 },
    { date: "13 Mar", clicks: 7400 },
    { date: "15 Mar", clicks: 8300 },
    { date: "17 Mar", clicks: 7900 },
    { date: "19 Mar", clicks: 9600 },
    { date: "21 Mar", clicks: 8900 },
    { date: "23 Mar", clicks: 10400 },
    { date: "25 Mar", clicks: 11200 },
    { date: "27 Mar", clicks: 12800 },
  ];
  const maxClicksValue = Math.max(...dailyClicksData.map((d) => d.clicks));

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[340vh] sm:h-[360vh] bg-[#FAF7F2] dark:bg-[#09090b] transition-colors duration-300 "
    >
      {/* Sticky Viewport Stage (Extended 110vh stage for Hero and Section 2, scrolls naturally into Section 3) */}
      <div className="sticky top-0 min-h-[110vh] h-[110vh] w-full overflow-hidden flex flex-col justify-between pt-10 sm:pt-8 pb-8 sm:pb-12 select-none z-[1000]">
        {/* Background PlasmaWave (EXCLUSIVELY for Hero Section - Fades out completely when entering Section 2) */}
        <motion.div
          style={{ opacity: heroGridOpacity }}
          className="absolute inset-0 pointer-events-none z-0 will-change-opacity overflow-hidden"
        >
          <PlasmaWave
            colors={["#FF5B00", "#0080ff"]}
            speed1={0.055}
            speed2={0.055}
            focalLength={0.8}
            bend1={1.2}
            bend2={0.7}
            dir2={1}
            rotationDeg={0}
          />
        </motion.div>

        {/* ─── LAYER 1: HERO TOP TEXTS & CTAS (Scroll 0 -> Fades & floats up) ─── */}
        <motion.div
          style={{
            opacity: heroOpacity,
            y: heroY,
            pointerEvents: isHeroActive ? "auto" : "none",
          }}
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center pt-2 sm:pt-3 will-change-transform mt-10 sm mb-6"
        >
          {/* Main Title: ShinyText */}
          <h1 className="text-2xl sm:text-[34px] md:text-[38px] font-semibold tracking-tight max-w-3xl leading-snug">
            <ShinyText
              text="The next-generation URL shortener for your campaigns & audiences"
              speed={4.5}
            />
          </h1>

          {/* Subtitle: TextType */}
          <p className="mt-2.5 sm:mt-3 text-xs sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl font-normal leading-relaxed px-2 min-h-[42px]">
            <TextType
              text={[
                "Shorten in milliseconds, split traffic with A/B testing, protect access with PIN codes, and analyze visitors in real time without cookies.",
                "Maximize conversions with worldwide geo-targeting and smart device-based routing.",
                "Protect affiliate links and deploy ultra-fast redirects across 300+ Cloudflare edge locations.",
              ]}
              typingSpeed={25}
              deletingSpeed={12}
              pauseDuration={3200}
              loop={true}
            />
          </p>

          {/* CTAs */}
          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full max-w-xs sm:max-w-none">
            <Link href="/login" className="w-full sm:w-auto">
              <Button
                className={cn(
                  "w-full sm:w-auto h-9 sm:h-10 px-6 text-xs sm:text-sm font-medium rounded-full bg-[#0080ff] hover:bg-[#0070e0] sm:bg-[#ff6600] sm:hover:bg-[#ff771a] text-white border-none cursor-pointer shadow-md shadow-[#0080ff]/25 sm:shadow-[#ff6600]/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5",
                  "btn-hover-scale",
                )}
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Button>
            </Link>

            <Button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.scrollTo({
                    top: window.innerHeight * 0.95,
                    behavior: "smooth",
                  });
                }
              }}
              variant="outline"
              className={cn(
                "w-full sm:w-auto h-9 sm:h-10 px-6 text-xs sm:text-sm font-medium rounded-full border-neutral-300 dark:border-white/15 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer transition-all flex items-center justify-center",
                "btn-hover-scale",
              )}
            >
              <span>Explore Live Demo</span>
            </Button>
          </div>
        </motion.div>

        {/* ─── LAYER 2: SECTION 2 HEADER (Sleek, close gap to frame, perfectly balanced) ─── */}
        <motion.div
          style={{
            opacity: section2HeaderOpacity,
            y: section2HeaderY,
            pointerEvents: !isHeroActive ? "auto" : "none",
          }}
          className="absolute top-14 sm:top-18 md:top-20 inset-x-0 mx-auto max-w-3xl px-4 text-center z-20 will-change-transform"
        >
          <h2 className="text-xl sm:text-2xl md:text-[28px] font-bold tracking-tight text-[#2B2520] dark:text-white leading-snug">
            Experience the Power of LShorter in Action
          </h2>
          <p className="mt-auto text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-normal max-w-xl mx-auto">
            An intuitive dashboard engineered to manage your Edge redirects,
            routing rules, and real-time metrics.
          </p>
        </motion.div>

        {/* ─── LAYER 3: CENTRAL DUAL-STAGE FRAME AREA (Docked in Hero, expands in Section 2 with bottom clearance) ─── */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-6 flex flex-col justify-end mt-auto mb-6 sm:mb-6 sm:-mt-4 -mt-`4">
          {/* ══ MOBILE-ONLY: Static centered phone frame (xs only, hidden at sm+) ══ */}
          <div className="flex sm:hidden w-full justify-center">
            <div className="w-[258px] h-[510px] shrink-0 flex flex-col relative">
              <div className="absolute -bottom-4 inset-x-3 h-8 bg-black/50 blur-xl rounded-full pointer-events-none -z-10" />
              <div className="w-full h-full rounded-[44px] bg-[#1a1a1e] p-[7px] ring-1 ring-black/25 border-2 border-[#2f2f38] shadow-[0_30px_70px_-10px_rgba(0,0,0,0.95)] flex flex-col overflow-hidden relative">
                <div className="absolute -left-[3px] top-20 w-[3px] h-7 bg-[#3a3a45] rounded-l-sm" />
                <div className="absolute -left-[3px] top-32 w-[3px] h-10 bg-[#3a3a45] rounded-l-sm" />
                <div className="absolute -left-[3px] top-44 w-[3px] h-10 bg-[#3a3a45] rounded-l-sm" />
                <div className="absolute -right-[3px] top-24 w-[3px] h-12 bg-[#3a3a45] rounded-r-sm" />
                <div className="flex-1 rounded-[37px] bg-[#0d0d0d] border border-white/10 overflow-hidden flex flex-col select-none">
                  {/* Status bar */}
                  <div className="px-5 pt-3 pb-1 flex items-center justify-between text-[10px] font-semibold text-white shrink-0 relative">
                    <span>9:41</span>
                    <div className="absolute left-1/2 -translate-x-1/2 top-2.5 w-[70px] h-[18px] rounded-full bg-black border border-neutral-800" />
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-[9px]">5G</span>
                      <div className="w-3 h-2 border border-white/60 rounded-[2px] p-px flex items-center">
                        <div className="h-full w-2 bg-emerald-400 rounded-[1px]" />
                      </div>
                    </div>
                  </div>
                  {/* App header */}
                  <div className="px-3 pt-1 pb-2 flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-[7px] bg-[#ff6600] flex items-center justify-center font-bebas text-xs text-white font-black shadow-md shadow-[#ff6600]/40">
                        LS
                      </div>
                      <span className="font-bebas text-base font-bold tracking-wide text-[#ff6600] leading-none">
                        L SHORTER
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Sun className="w-3.5 h-3.5 text-amber-400" />
                      <Bell className="w-3.5 h-3.5 text-neutral-400" />
                      <div className="w-6 h-6 rounded-full bg-[#ff6600] border border-white/20 flex items-center justify-center text-white font-bold text-[9px]">
                        LM
                      </div>
                    </div>
                  </div>
                  {/* Scrollable main content */}
                  <div
                    className="flex-1 overflow-y-auto px-3 pb-2 space-y-2 min-h-0"
                    style={{ scrollbarWidth: "none" }}
                  >
                    <div>
                      <h3 className="text-white font-bold text-base leading-tight">
                        Overview
                      </h3>
                      <p className="text-[9px] text-neutral-500 mt-0.5">
                        Global real-time performance
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <div className="flex-1 h-7 rounded-[8px] bg-[#1e1e22] border border-white/10 text-neutral-300 text-[9px] font-semibold flex items-center justify-center gap-1">
                        <RefreshCw className="w-2.5 h-2.5" />
                        <span>Refresh</span>
                      </div>
                      <div className="flex-1 h-7 rounded-[8px] bg-[#ff6600] text-white text-[9px] font-bebas tracking-wide flex items-center justify-center gap-0.5 shadow-sm shadow-[#ff6600]/40">
                        <Plus className="w-2.5 h-2.5 stroke-[3]" />
                        <span>CREATE A LINK</span>
                      </div>
                    </div>
                    {/* KPI cards */}
                    {(
                      [
                        {
                          label: "Total Clicks",
                          value: "128,420",
                          badge: "+14.2%",
                          sub: "71,400 uniques",
                          color: "text-[#ff6600]",
                        },
                        {
                          label: "Created Links",
                          value: "847",
                          badge: "+8.6%",
                          sub: "847 active",
                          color: "text-white",
                        },
                        {
                          label: "Tracked Revenue",
                          value: "$2,450",
                          badge: "+3.4%",
                          sub: "EPC: $0.19",
                          color: "text-white",
                        },
                        {
                          label: "Conversion Rate",
                          value: "3.4%",
                          badge: ">2% target",
                          sub: "4,360 conv.",
                          color: "text-white",
                        },
                      ] as {
                        label: string;
                        value: string;
                        badge: string;
                        sub: string;
                        color: string;
                      }[]
                    ).map((card) => (
                      <div
                        key={card.label}
                        className="rounded-[10px] bg-[#141416] border border-[#222225] p-2.5 flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[5px] font-semibold text-neutral-400">
                            {card.label}
                          </span>
                          <span className="text-[6px] font-bold text-emerald-400 font-mono">
                            {card.badge}
                          </span>
                        </div>
                        <span
                          className={`font-bebas text-[10px] font-bold leading-none tracking-wide ${card.color}`}
                        >
                          {card.value}
                        </span>
                        <span className="text-[6.5px] text-neutral-500">
                          {card.sub}
                        </span>
                      </div>
                    ))}
                    {/* Clicks per day */}
                    <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9.5px] font-bold text-white">
                          Clicks per day
                        </span>
                        <span className="text-[8px] font-mono text-[#ff6600] bg-[#ff6600]/10 border border-[#ff6600]/20 px-1.5 py-0.5 rounded-md">
                          14 days
                        </span>
                      </div>
                      <div className="h-16 flex items-end justify-between gap-0.5">
                        {dailyClicksData.map((d, i) => (
                          <div
                            key={i}
                            className="flex-1 flex flex-col items-center h-full justify-end"
                          >
                            <div
                              style={{
                                height: `${(d.clicks / maxClicksValue) * 100}%`,
                              }}
                              className="w-full rounded-t-[2px] bg-[#ff6600]"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Top Countries */}
                    <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-2.5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[9.5px] font-bold text-white">
                          Top Countries
                        </span>
                        <div className="flex items-center gap-0.5 text-[#ff6600]">
                          <span className="text-[8px] font-semibold">
                            Details
                          </span>
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        {[
                          { code: "FR", pct: 40.8 },
                          { code: "US", pct: 26.5 },
                          { code: "BF", pct: 14.7 },
                        ].map((c) => (
                          <div key={c.code} className="flex items-center gap-2">
                            <span className="font-mono text-[9px] font-bold text-[#ff6600] w-4 shrink-0">
                              {c.code}
                            </span>
                            <div className="flex-1 h-1 rounded-full bg-[#27272a] overflow-hidden">
                              <div
                                className="h-full bg-[#ff6600] rounded-full"
                                style={{ width: `${c.pct}%` }}
                              />
                            </div>
                            <span className="text-[8px] text-neutral-400 font-mono w-8 text-right">
                              {c.pct}%
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Recent Links */}
                    <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-bold text-white">
                          Recent Links
                        </span>
                        <div className="flex items-center gap-0.5 text-[#ff6600]">
                          <span className="text-[8px] font-semibold">
                            View all
                          </span>
                          <ArrowUpRight className="w-2.5 h-2.5" />
                        </div>
                      </div>
                      {[
                        {
                          slug: "/launch-pro-2026",
                          url: "mon-entreprise.com/offre",
                          clicks: "84.2K",
                        },
                        {
                          slug: "/ebook-conversion",
                          url: "ressources.io/growth",
                          clicks: "31.2K",
                        },
                        {
                          slug: "/direction-finance",
                          url: "drive.corporate.com/bilan",
                          clicks: "13.0K",
                        },
                      ].map((link) => (
                        <div
                          key={link.slug}
                          className="flex items-center gap-1.5 py-1 border-t border-[#222225]"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="text-[9px] font-bold text-white truncate">
                              {link.slug}
                            </div>
                            <div className="text-[8px] text-neutral-500 truncate">
                              {link.url}
                            </div>
                          </div>
                          <span className="text-[8.5px] font-mono font-bold text-white shrink-0">
                            {link.clicks}
                          </span>
                          <div className="flex items-center gap-0.5 shrink-0">
                            <div className="p-0.5 rounded-[4px] bg-white/5">
                              <Copy className="w-2.5 h-2.5 text-neutral-400" />
                            </div>
                            <div className="p-0.5 rounded-[4px] bg-white/5">
                              <Edit3 className="w-2.5 h-2.5 text-[#ff6600]" />
                            </div>
                            <div className="p-0.5 rounded-[4px] bg-white/5">
                              <QrCode className="w-2.5 h-2.5 text-[#ff6600]" />
                            </div>
                            <div className="p-0.5 rounded-[4px] bg-white/5">
                              <Share2 className="w-2.5 h-2.5 text-neutral-400" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* Bottom tab bar */}
                  <div className="shrink-0 border-t border-[#222225] bg-[#0d0d0d] px-3 pt-2 pb-1 flex flex-col items-center">
                    <div className="w-full flex items-center justify-around">
                      <span className="flex flex-col items-center gap-0.5 text-[#ff6600]">
                        <Home className="w-3.5 h-3.5" />
                        <span className="text-[7.5px] font-bold">Home</span>
                      </span>
                      <span className="flex flex-col items-center gap-0.5 text-neutral-500">
                        <Link2 className="w-3.5 h-3.5" />
                        <span className="text-[7.5px]">Links</span>
                      </span>
                      <span className="w-7 h-7 -mt-3 rounded-[9px] bg-[#ff6600] text-white flex items-center justify-center shadow-md shadow-[#ff6600]/50 border border-white/20 shrink-0">
                        <Plus className="w-4 h-4 stroke-[3]" />
                      </span>
                      <span className="flex flex-col items-center gap-0.5 text-neutral-500">
                        <BarChart3 className="w-3.5 h-3.5" />
                        <span className="text-[7.5px]">Stats</span>
                      </span>
                      <span className="flex flex-col items-center gap-0.5 text-neutral-500">
                        <Menu className="w-3.5 h-3.5" />
                        <span className="text-[7.5px]">Menu</span>
                      </span>
                    </div>
                    <div className="w-20 h-1 bg-neutral-600 rounded-full mt-1.5 mb-0.5" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ══ DESKTOP (sm+): Desktop frame + animated phone frame side by side ══ */}
          <div className="hidden sm:flex w-full items-start justify-center">
            {/* 1. THE SINGLE DESKTOP FRAME (Starts at 820px/520px tilted in Hero, smoothly zooms and expands to full width & 82vh) */}
            <motion.div
              style={{
                width: desktopWidth,
                maxWidth: "100%",
                height: desktopHeight,
                minHeight: desktopMinHeight,
                maxHeight: "850px",
                scale: desktopScale,
                rotateX: desktopRotateX,
                transformPerspective: 1200,
                transformOrigin: "center top",
                y: desktopY,
              }}
              className="relative rounded-2xl bg-[#FFFDF9] dark:bg-[#121216] border border-[#E7DFD5] dark:border-white/15 shadow-[0_25px_60px_-15px_rgba(43,37,32,0.25),0_12px_28px_-6px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.92),0_15px_35px_-5px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col transition-colors will-change-transform shrink-0"
            >
              {/* Dedicated individual bottom shadows */}
              <div className="absolute -bottom-5 inset-x-8 h-10 bg-neutral-900/35 dark:bg-black/95 blur-xl rounded-full pointer-events-none -z-10" />

              {/* Realistic Browser Chrome Bar */}
              <div className="h-10 bg-[#0f0f13] border-b border-[#222225] px-4 flex items-center justify-between select-none shrink-0 z-20">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1 rounded-md bg-[#141416] border border-[#27272a] text-[11px] font-mono text-neutral-300 w-3/5 max-w-sm justify-center">
                  <span className="text-emerald-500 font-bold">https://</span>
                  <span className="font-semibold text-neutral-100">
                    lsho.cc
                  </span>
                  <span className="text-[#ff6600] font-semibold">
                    /dashboard
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden md:inline font-bold">
                    Edge Cloudflare 11ms
                  </span>
                </div>
              </div>

              {/* 1. Full-width Topbar across the entire top (border-b-0, exact replica of SaaS topbar) */}
              <div className="h-14 bg-[#09090b] px-4 sm:px-6 flex items-center justify-between shrink-0 select-none z-10 border-b-0">
                {/* Left: Brand + Dynamic Route Breadcrumbs */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2.5 group mr-1">
                    <div className="w-8 h-8 rounded-[10px] bg-[#ff6600] flex items-center justify-center font-bebas text-lg font-black text-white shadow-md shadow-[#ff6600]/30 shrink-0">
                      LS
                    </div>
                    <span className="font-bebas text-xl font-bold tracking-wider text-white leading-none">
                      L <span className="text-[#ff6600]">SHORTER</span>
                    </span>
                  </div>

                  <nav
                    aria-label="Breadcrumbs"
                    className="hidden sm:flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-neutral-400 pl-3 border-l border-[#222228]"
                  >
                    <span className="text-[#ff6600] font-bold tracking-widest">
                      DASHBOARD
                    </span>
                  </nav>
                </div>

                {/* Right: Theme Toggle + Bell + User Profile Pill (LUCKY-MAN PRO) */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-[10px] bg-[#141416] border border-[#27272a] text-neutral-400 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="w-9 h-9 rounded-[10px] bg-[#141416] border border-[#27272a] text-neutral-400 flex items-center justify-center relative">
                    <Bell className="w-4 h-4 text-neutral-300" />
                    <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff6600] rounded-full ring-2 ring-[#141416]" />
                  </div>
                  <div className="hidden flex items-center gap-2.5 pl-1.5 pr-3 py-1 rounded-[10px] bg-[#141416] border border-[#27272a] shadow-sm">
                    <div className="w-7.5 h-7.5 rounded-[8px] bg-[#ff6600] text-white font-bold text-xs flex items-center justify-center shrink-0 border border-white/10">
                      <Avatar>
                        <AvatarImage
                          src="https://github.com/shadcn.png"
                          alt="Admin"
                        />
                      </Avatar>
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="text-xs font-bold text-white tracking-tight leading-tight">
                        Admin
                      </span>
                      <span className="text-[9.5px] text-neutral-400 uppercase font-semibold leading-none mt-0.5">
                        PRO Plan
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  </div>
                </div>
              </div>

              {/* 2. Content Row: Sidebar on Left (No border) + Canvas with md:rounded-tl-[28px] on Right */}
              <div className="flex-1 flex flex-row overflow-hidden min-h-0 bg-[#09090b]">
                {/* Authentic Sidebar (No right border) */}
                <aside className="w-48 lg:w-52 p-3 bg-[#09090b] border-r-0 flex flex-col justify-between shrink-0 select-none overflow-y-auto">
                  <div className="flex flex-col gap-2.5 w-full">
                    {/* Main Menu Label + Collapse Toggle */}
                    <div className="flex items-center justify-between px-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-500 font-mono">
                        Main Menu
                      </span>
                      <div className="w-7 h-7 rounded-[8px] bg-white/5 border border-white/10 text-neutral-400 flex items-center justify-center">
                        <PanelLeftClose className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Create Link Button */}
                    <div className="w-full h-8.5 rounded-[10px] bg-[#ff6600] text-white font-bold flex items-center justify-center text-xs gap-1.5 shadow-md shadow-[#ff6600]/30 transition-all">
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span className="font-bebas text-sm tracking-wide">
                        CREATE A LINK
                      </span>
                    </div>

                    {/* Nav Section: Principal */}
                    <div className="flex flex-col gap-0.5">
                      <span className="px-2.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500 mb-0.5">
                        Menu
                      </span>

                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[10px] text-xs font-semibold text-white bg-[#ff6600] shadow-sm">
                        <LayoutDashboard className="w-3.5 h-3.5 shrink-0 text-white" />
                        <span>Overview</span>
                      </div>

                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[10px] text-xs font-medium text-neutral-300 hover:bg-white/5 transition-colors">
                        <Link2 className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                        <span>My Links</span>
                      </div>

                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[10px] text-xs font-medium text-neutral-300 hover:bg-white/5 transition-colors">
                        <QrCode className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                        <span>QR Codes</span>
                      </div>

                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[10px] text-xs font-medium text-neutral-300 hover:bg-white/5 transition-colors">
                        <BarChart2 className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                        <span>Analytics</span>
                      </div>

                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[10px] text-xs font-medium text-neutral-300 hover:bg-white/5 transition-colors">
                        <Globe2 className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                        <span>Domains</span>
                      </div>
                    </div>

                    {/* Nav Section: Account */}
                    <div className="flex flex-col gap-0.5">
                      <span className="px-2.5 text-[9px] font-bold uppercase tracking-widest text-neutral-500 mt-1 mb-0.5">
                        Account
                      </span>

                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[10px] text-xs font-medium text-neutral-300 hover:bg-white/5 transition-colors">
                        <KeyRound className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                        <span>API &amp; SDK</span>
                      </div>

                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[10px] text-xs font-medium text-neutral-300 hover:bg-white/5 transition-colors">
                        <Settings className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                        <span>Settings</span>
                      </div>

                      <div className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-[10px] text-xs font-medium text-neutral-300 hover:bg-white/5 transition-colors">
                        <FileText className="w-3.5 h-3.5 shrink-0 text-neutral-400" />
                        <span>Documentation</span>
                      </div>
                    </div>
                  </div>

                  {/* Sidebar Bottom Quota Card + Feedback */}
                  <div className="flex flex-col gap-2 pt-2.5 border-t border-[#222225]/80 mt-1">
                    <div className="rounded-[10px] bg-[#141416] border border-[#27272a] p-2.5 text-xs flex flex-col gap-1.5">
                      <div className="flex items-center justify-between text-neutral-400">
                        <span className="font-bold text-[10px] text-[#ff6600]">
                          PRO PLAN
                        </span>
                        <span className="font-mono text-white text-[10px]">
                          128.4K / 1M
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                        <div className="h-full bg-[#ff6600] rounded-full w-[32%]" />
                      </div>
                      <div className="flex items-center justify-between text-[9px] text-neutral-500">
                        <span>Clicks this month</span>
                        <span className="text-emerald-400 font-semibold">
                          Edge Live
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 px-2 py-1 text-xs font-medium text-neutral-400">
                      <div className="w-5 h-5 rounded-[8px] bg-white/5 border border-white/10 flex items-center justify-center text-neutral-400">
                        <HelpCircle className="w-3 h-3" />
                      </div>
                      <span className="text-[11px]">Help &amp; Feedback</span>
                    </div>
                  </div>
                </aside>

                {/* 3. Central Framed Canvas with Rounded Top-Left (Exact signature app layout!) */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#09090b]">
                  <main className="h-full w-full bg-[#121215] md:rounded-tl-[28px] overflow-y-auto shadow-2xl p-4 sm:p-5 lg:p-6 flex flex-col gap-4 sm:gap-5 select-none">
                    {/* Top Banner Action */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                          Overview
                        </h3>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          Global real-time performance of your redirects,
                          conversions, and clicks.
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="h-9 px-3.5 rounded-[10px] bg-[#141416] border border-[#27272a] text-neutral-300 text-xs font-semibold flex items-center gap-2 shadow-sm">
                          <RefreshCw className="w-3.5 h-3.5 text-neutral-400" />
                          <span>Refresh</span>
                        </div>
                        <div className="h-9 px-4 rounded-[10px] bg-[#ff6600] text-white font-bebas text-base sm:text-lg tracking-wide flex items-center gap-1.5 shadow-md shadow-[#ff6600]/30 shrink-0">
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>CREATE A LINK</span>
                        </div>
                      </div>
                    </div>

                    {/* 4 Metric KPI Cards */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                      {/* Card 1: Total Clicks */}
                      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-4 flex flex-col justify-between h-32 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-400">
                            Total Clicks
                          </span>
                          <span className="text-[12px] font-bold text-emerald-400 font-mono">
                            +128,420
                          </span>
                        </div>
                        <div>
                          <span className="font-bebas text-[5px] sm:text-[32px] font-bold text-[#ff6600] tracking-wide leading-none">
                            128,420
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500">
                          <span>71,400 uniques</span>
                          <span className="text-neutral-400 font-medium">
                            Real-time Edge
                          </span>
                        </div>
                      </div>

                      {/* Card 2: Created Links */}
                      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-4 flex flex-col justify-between h-32 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-400">
                            Created Links
                          </span>
                          <span className="text-[12px] font-bold text-emerald-400 font-mono">
                            42
                          </span>
                        </div>
                        <div>
                          <span className="font-bebas text-[32px] sm:text-[32px] font-bold text-white tracking-wide leading-none">
                            42
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500">
                          <span>42 active</span>
                          <span className="text-neutral-400 font-medium">
                            Active routing
                          </span>
                        </div>
                      </div>

                      {/* Card 3: Tracked Revenue */}
                      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-4 flex flex-col justify-between h-32 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-400">
                            Tracked Revenue
                          </span>
                          <span className="text-[12px] font-bold text-emerald-400 font-mono">
                            $2,450.00
                          </span>
                        </div>
                        <div>
                          <span className="font-bebas text-[15px] sm:text-[32px] font-bold text-white tracking-wide leading-none">
                            $2,450.00
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500">
                          <span>EPC: $0.19</span>
                          <span className="text-neutral-400 font-medium">
                            Conversions
                          </span>
                        </div>
                      </div>

                      {/* Card 4: Conversion Rate */}
                      <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-4 flex flex-col justify-between h-32 relative group">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-neutral-400">
                            Conversion Rate
                          </span>
                          <span className="text-[12px] font-bold text-emerald-400 font-mono">
                            3.4%
                          </span>
                        </div>
                        <div>
                          <span className="font-bebas text-[32px] sm:text-[32px] font-bold text-white tracking-wide leading-none">
                            3.4%
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-500">
                          <span>4,360 conversions</span>
                          <span className="text-neutral-400 font-medium">
                            Target &gt; 2%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Middle Grid: Click Histogram (8 cols) + Top Countries (4 cols) */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-stretch">
                      {/* Left: Bar Histogram */}
                      <div className="lg:col-span-8 rounded-[10px] bg-[#141416] border border-[#222225] p-4 sm:p-5 flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-sm font-bold text-white tracking-wide">
                              Click Analytics (14 Days)
                            </h4>
                            <p className="text-[11px] text-neutral-400">
                              All links combined
                            </p>
                          </div>
                          <span className="text-[11px] font-mono font-bold text-[#ff6600] bg-[#ff6600]/10 border border-[#ff6600]/20 px-2.5 py-1 rounded-[8px]">
                            128.4K clicks
                          </span>
                        </div>

                        {/* Histogram Bars */}
                        <div className="h-32 sm:h-36 flex items-end justify-between gap-1.5 pt-3 pb-1">
                          {dailyClicksData.map((d, i) => {
                            const heightPct = (d.clicks / maxClicksValue) * 100;
                            return (
                              <div
                                key={i}
                                className="flex-1 flex flex-col items-center h-full justify-end group relative"
                              >
                                <div
                                  style={{ height: `${heightPct}%` }}
                                  className="w-full rounded-t-sm bg-[#ff6600] hover:bg-[#ff771a] transition-all duration-200"
                                />
                                <span className="text-[9px] font-mono text-neutral-500 mt-1 truncate">
                                  {d.date.split(" ")[0]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Right: Top Countries */}
                      <div className="lg:col-span-4 rounded-[10px] bg-[#141416] border border-[#222225] p-4 sm:p-5 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-bold text-white tracking-wide">
                              Top Countries
                            </h4>
                            <div className="text-xs text-[#ff6600] font-semibold flex items-center gap-1">
                              <span>Details</span>
                              <ArrowUpRight className="w-3.5 h-3.5" />
                            </div>
                          </div>

                          <div className="flex flex-col gap-2.5">
                            {[
                              {
                                code: "FR",
                                name: "France",
                                count: "52,400",
                                pct: 40.8,
                              },
                              {
                                code: "US",
                                name: "United States",
                                count: "34,100",
                                pct: 26.5,
                              },
                              {
                                code: "BF",
                                name: "Burkina Faso",
                                count: "18,900",
                                pct: 14.7,
                              },
                              {
                                code: "DE",
                                name: "Germany",
                                count: "12,100",
                                pct: 9.4,
                              },
                              {
                                code: "CA",
                                name: "Canada",
                                count: "10,920",
                                pct: 8.6,
                              },
                            ].map((c) => (
                              <div
                                key={c.code}
                                className="flex flex-col gap-1 text-xs"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <span className="font-mono text-[11px] font-bold text-[#ff6600] w-5">
                                      {c.code}
                                    </span>
                                    <span className="text-neutral-300 font-medium">
                                      {c.name}
                                    </span>
                                  </div>
                                  <span className="text-neutral-400 font-mono text-[11px]">
                                    {c.count} ({c.pct}%)
                                  </span>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-[#27272a] overflow-hidden">
                                  <div
                                    className="h-full bg-[#ff6600] rounded-full transition-all duration-500"
                                    style={{ width: `${c.pct}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="pt-3 border-t border-[#222225] flex items-center justify-between text-[11px] text-neutral-500 mt-2">
                          <span>84 countries tracked</span>
                          <span className="text-neutral-400">
                            Cloudflare Edge
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Recent Links Table */}
                    <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-4 sm:p-5 flex flex-col gap-3.5">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="text-sm sm:text-base font-bold text-white tracking-wide">
                            Recent Links
                          </h4>
                          <p className="text-xs text-neutral-400">
                            Your latest created redirections
                          </p>
                        </div>
                        <div className="text-xs text-[#ff6600] font-semibold flex items-center gap-1">
                          <span>View all links</span>
                          <ArrowUpRight className="w-3.5 h-3.5" />
                        </div>
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-neutral-400">
                          <thead>
                            <tr className="border-b border-[#222225] text-[11px] uppercase tracking-wider text-neutral-500 font-semibold">
                              <th className="pb-3 pl-2">Link & Destination</th>
                              <th className="pb-3">Short URL</th>
                              <th className="pb-3 w-[140px]">User</th>
                              <th className="pb-3 text-right pr-4">Clicks</th>
                              <th className="pb-3">Status</th>
                              <th className="pb-3 text-right pr-2">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e1e22]">
                            {[
                              {
                                id: "1",
                                slug: "launch-pro-2026",
                                shortUrl: "https://lsho.cc/launch-pro-2026",
                                targetUrl:
                                  "https://mon-entreprise.com/offre-speciale-q3",
                                clicks: "84,200",
                                user: "Admin",
                                email: "lm@lshorter.io",
                              },
                              {
                                id: "2",
                                slug: "ebook-conversion",
                                shortUrl: "https://lsho.cc/ebook-conversion",
                                targetUrl:
                                  "https://ressources.io/growth-mastery-v2.pdf",
                                clicks: "31,200",
                                user: "Admin",
                                email: "lm@lshorter.io",
                              },
                              {
                                id: "3",
                                slug: "direction-finance",
                                shortUrl: "https://lsho.cc/direction-finance",
                                targetUrl:
                                  "https://drive.corporate.com/bilan-confidentiel-q3",
                                clicks: "13,020",
                                user: "Admin",
                                email: "lm@lshorter.io",
                              },
                            ].map((link) => (
                              <tr
                                key={link.id}
                                className="hover:bg-white/[0.02] transition-colors group"
                              >
                                <td className="py-3 pl-2 max-w-xs">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-semibold text-white truncate group-hover:text-[#ff6600] transition-colors">
                                      /{link.slug}
                                    </span>
                                    <span
                                      className="text-[11px] text-neutral-500 truncate"
                                      title={link.targetUrl}
                                    >
                                      {link.targetUrl}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 font-mono text-xs text-neutral-300">
                                  <div className="flex items-center gap-1.5">
                                    <span>{link.shortUrl}</span>
                                    <div className="text-neutral-500 hover:text-white p-1 rounded-[6px] transition-colors">
                                      <Copy className="w-3.5 h-3.5" />
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3 max-w-[140px]">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-white text-xs font-medium truncate">
                                      {link.user}
                                    </span>
                                    <span className="text-[10.5px] text-neutral-500 font-mono truncate">
                                      {link.email}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-3 text-right pr-4 font-mono font-bold text-white">
                                  {link.clicks}
                                </td>
                                <td className="py-3">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                    Active
                                  </span>
                                </td>
                                <td className="py-3 text-right pr-2">
                                  <div className="flex items-center justify-end gap-1 text-neutral-400">
                                    <div
                                      className="p-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                                      title="Edit"
                                    >
                                      <Edit3 className="w-3.5 h-3.5 text-[#ff6600]" />
                                    </div>
                                    <div
                                      className="p-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                                      title="QR Code"
                                    >
                                      <QrCode className="w-3.5 h-3.5 text-[#ff6600]" />
                                    </div>
                                    <div
                                      className="p-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                                      title="Share"
                                    >
                                      <Share2 className="w-3.5 h-3.5" />
                                    </div>
                                    <div
                                      className="p-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 hover:text-white transition-colors"
                                      title="External link"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </main>
                </div>
              </div>
            </motion.div>

            {/* 2. SMARTPHONE FRAME (Docked beside Desktop frame in Hero, matching exact 3D angle, top height, and 520px total height) */}
            <motion.div
              style={{
                width: mobileWidth,
                marginLeft: mobileMarginLeft,
                opacity: mobileOpacity,
                scale: desktopScale,
                rotateX: desktopRotateX,
                transformPerspective: 1200,
                transformOrigin: "center top",
                y: desktopY,
                x: mobileX,
                pointerEvents: isHeroActive ? "auto" : "none",
              }}
              className="hidden sm:flex relative shrink-0 h-[520px] z-20 will-change-transform overflow-hidden"
            >
              <div className="w-[260px] lg:w-[275px] h-[520px] shrink-0 flex flex-col relative">
                {/* Dedicated individual bottom shadows */}
                <div className="absolute -bottom-4 inset-x-3 h-8 bg-neutral-900/35 dark:bg-black/95 blur-xl rounded-full pointer-events-none -z-10" />
                <div className="absolute -bottom-7 inset-x-6 h-10 bg-neutral-900/20 dark:bg-black/80 blur-2xl rounded-full pointer-events-none -z-10" />

                {/* iPhone Chassis: Full 4-corner rounded titanium body with realistic side buttons */}
                <div className="w-full h-full rounded-[44px] bg-[#222126] dark:bg-[#151518] p-[7px] ring-1 ring-black/20 dark:ring-white/10 shadow-[0_25px_60px_-12px_rgba(43,37,32,0.3),0_12px_28px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.92),0_15px_35px_-5px_rgba(0,0,0,0.85)] border-2 border-[#cfc7be] dark:border-[#2f2f38] relative flex flex-col overflow-hidden">
                  {/* Side button accents */}
                  <div className="absolute -left-[3px] top-20 w-[3px] h-7 bg-[#a89f95] dark:bg-[#3a3a45] rounded-l-xs" />
                  <div className="absolute -left-[3px] top-30 w-[3px] h-10 bg-[#a89f95] dark:bg-[#3a3a45] rounded-l-xs" />
                  <div className="absolute -left-[3px] top-43 w-[3px] h-10 bg-[#a89f95] dark:bg-[#3a3a45] rounded-l-xs" />
                  <div className="absolute -right-[3px] top-24 w-[3px] h-12 bg-[#a89f95] dark:bg-[#3a3a45] rounded-r-xs" />

                  {/* iPhone Glass Screen */}
                  <div className="flex-1 rounded-[37px] bg-[#FFFDF9] dark:bg-[#0f0f13] border border-[#E7DFD5] dark:border-white/10 overflow-hidden flex flex-col justify-between p-3 select-none relative transition-colors">
                    {/* Dynamic Island + iOS Status Bar */}
                    <div className="relative pt-1 pb-1 shrink-0">
                      {/* Status Bar */}
                      <div className="flex items-center justify-between px-2 text-[10px] font-semibold text-neutral-800 dark:text-neutral-200">
                        <span className="font-medium tracking-tight">9:41</span>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] font-mono font-bold tracking-tighter">
                            5G
                          </span>
                          <div className="w-3.5 h-2 border border-neutral-700 dark:border-neutral-300 rounded-[3px] p-[0.5px] flex items-center">
                            <div className="h-full w-2.5 bg-emerald-500 rounded-[1.5px]" />
                          </div>
                        </div>
                      </div>

                      {/* Dynamic Island Pill */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-0.5 w-[78px] h-[20px] rounded-full bg-black flex items-center justify-between px-2 shadow-sm border border-neutral-800">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#0a121e] border border-[#0066FF]/60 flex items-center justify-center">
                          <div className="w-1 h-1 rounded-full bg-[#0066FF]" />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Mobile App Header (Cyber Blue Theme) */}
                    <div className="flex items-center justify-between pt-1 pb-1.5 border-b border-[#E7DFD5]/80 dark:border-[#1e2942] shrink-0">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5.5 h-5.5 rounded-[7px] bg-[#0066FF] flex items-center justify-center font-bebas text-xs text-white font-black shadow-md shadow-[#0066FF]/40">
                          LS
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bebas text-base font-bold tracking-wide text-neutral-900 dark:text-white leading-none">
                            L <span className="text-[#0066FF]">SHORTER</span>
                          </span>
                          <span className="text-[7.5px] uppercase font-bold tracking-widest text-[#38bdf8] font-mono">
                            Mobile Edge
                          </span>
                        </div>
                      </div>
                      <span className="text-[8px] text-emerald-400 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                        <span className="w-1 h-1 rounded-full bg-emerald-400 animate-ping" />
                        Edge 11ms
                      </span>
                    </div>

                    {/* Mobile Content */}
                    <div className="flex-1 py-1 overflow-hidden flex flex-col justify-between min-h-0 gap-1.5">
                      {/* Mini Quick URL Shorten Input */}
                      <div className="p-1.5 rounded-xl bg-[#FAF7F2] dark:bg-[#0d121f] border border-[#E7DFD5] dark:border-[#1e2942] flex items-center justify-between gap-1 shadow-xs shrink-0">
                        <span className="text-[9.5px] text-neutral-400 font-mono pl-1 truncate">
                          https://my-domain.com/...
                        </span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#0066FF] hover:bg-[#0055d4] text-white text-[9px] font-bold shrink-0 shadow-sm shadow-[#0066FF]/35">
                          Shorten
                        </span>
                      </div>

                      {/* 2 KPI Metrics */}
                      <div className="grid grid-cols-2 gap-1.5 shrink-0">
                        <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0d121f] border border-[#E7DFD5] dark:border-[#1e2942] shadow-xs">
                          <span className="text-[8.5px] text-neutral-500 dark:text-neutral-400 block font-medium">
                            Total Clicks
                          </span>
                          <div className="flex items-baseline justify-between mt-0.5">
                            <span className="font-bebas text-lg font-bold text-[#0066FF] dark:text-[#38bdf8]">
                              128,420
                            </span>
                            <span className="text-[8px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded">
                              +14.2%
                            </span>
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0d121f] border border-[#E7DFD5] dark:border-[#1e2942] shadow-xs">
                          <span className="text-[8.5px] text-neutral-500 dark:text-neutral-400 block font-medium">
                            Revenue
                          </span>
                          <div className="flex items-baseline justify-between mt-0.5">
                            <span className="font-bebas text-lg font-bold text-neutral-900 dark:text-white">
                              $2,450
                            </span>
                            <span className="text-[8px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded">
                              3.4%
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 3 Live Redirect Link Cards */}
                      <div className="space-y-1.5 shrink-0">
                        {/* Link 1 */}
                        <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0d121f] border border-[#E7DFD5] dark:border-[#1e2942] shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-neutral-900 dark:text-white truncate">
                              /launch-pro-2026
                            </span>
                            <span className="text-[7.5px] font-mono text-[#38bdf8] bg-[#0066FF]/15 border border-[#0066FF]/30 px-1.5 py-0.2 rounded font-bold">
                              A/B 50/50
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] font-mono text-neutral-500 dark:text-neutral-400">
                            <span className="text-emerald-400 font-bold">
                              84.2K clicks
                            </span>
                            <span>Active Edge</span>
                          </div>
                        </div>

                        {/* Link 2 */}
                        <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0d121f] border border-[#E7DFD5] dark:border-[#1e2942] shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-neutral-900 dark:text-white truncate">
                              /ebook-conversion
                            </span>
                            <span className="text-[7.5px] font-mono text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.2 rounded font-bold">
                              GEO ROUTE
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] font-mono text-neutral-500 dark:text-neutral-400">
                            <span className="text-emerald-400 font-bold">
                              31.2K clicks
                            </span>
                            <span>FR • US • BF</span>
                          </div>
                        </div>

                        {/* Link 3 */}
                        <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0d121f] border border-[#E7DFD5] dark:border-[#1e2942] shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-neutral-900 dark:text-white truncate">
                              /direction-finance
                            </span>
                            <span className="text-[7.5px] font-mono text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">
                              PIN 8492
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] font-mono text-neutral-500 dark:text-neutral-400">
                            <span className="text-emerald-400 font-bold">
                              13.0K clicks
                            </span>
                            <span>VIP Protected</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Navigation Dock & Home Bar (Accurate Floating Nav Replica) */}
                    <div className="pt-1.5 border-t border-[#E7DFD5]/80 dark:border-[#1e2942] flex flex-col items-center shrink-0">
                      <div className="w-full flex items-center justify-around px-1 py-0.5">
                        <span className="text-[8px] font-bold text-[#0066FF] flex flex-col items-center gap-0.5 cursor-pointer">
                          <Home className="w-3.5 h-3.5" />
                          <span>Home</span>
                        </span>
                        <span className="text-[8px] text-neutral-400 flex flex-col items-center gap-0.5 cursor-pointer">
                          <Link2 className="w-3.5 h-3.5" />
                          <span>Links</span>
                        </span>
                        <span className="w-7 h-7 -mt-2.5 rounded-[8px] bg-[#0066FF] text-white flex items-center justify-center shadow-md shadow-[#0066FF]/60 border border-white/20 shrink-0">
                          <Plus className="w-4 h-4 stroke-[3]" />
                        </span>
                        <span className="text-[8px] text-neutral-400 flex flex-col items-center gap-0.5 cursor-pointer">
                          <BarChart3 className="w-3.5 h-3.5" />
                          <span>Stats</span>
                        </span>
                        <span className="text-[8px] text-neutral-400 flex flex-col items-center gap-0.5 cursor-pointer">
                          <Menu className="w-3.5 h-3.5" />
                          <span>Menu</span>
                        </span>
                      </div>
                      {/* iOS Home Indicator */}
                      <div className="w-20 h-1 bg-neutral-400/80 dark:bg-neutral-600 rounded-full mt-1 mb-0.5" />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
