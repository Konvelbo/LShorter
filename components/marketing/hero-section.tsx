"use client";

import React, { useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Sparkles,
  ExternalLink,
  QrCode,
  Shield,
  Sliders,
  Globe,
  Copy,
  Check,
  Smartphone,
  TrendingUp,
  Lock,
  LayoutDashboard,
  Link2,
  BarChart2,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShinyText } from "@/components/ui/shiny-text";
import { TextType } from "@/components/ui/text-type";
import PlasmaWave from "./plasma-wave";
import { HeroDashboardView } from "./hero-dashboard-view";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const chevronRef = useRef<HTMLAnchorElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const framesContainerRef = useRef<HTMLDivElement>(null);
  const mobilePhoneRef = useRef<HTMLDivElement>(null);
  const gridContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      gsap.registerPlugin(ScrollTrigger);
    }

    // 1. Subtle pulsing animation on the scroll chevron
    if (chevronRef.current) {
      gsap.to(chevronRef.current, {
        y: 6,
        repeat: -1,
        yoyo: true,
        duration: 1.2,
        ease: "power1.inOut",
      });
    }

    // 2. Entrance animation for the top hero headline and texts
    if (heroContentRef.current) {
      gsap.fromTo(
        heroContentRef.current,
        { opacity: 0, y: 24 },
        { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
      );
    }

    // 3. Mobile phone frame fades out as user scrolls down out of hero section
    if (mobilePhoneRef.current) {
      gsap.to(mobilePhoneRef.current, {
        opacity: 0,
        scale: 0.82,
        x: 60,
        ease: "power2.out",
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "center 40%",
          end: "bottom 10%",
          scrub: 1,
        },
      });
    }

    return () => {
      ScrollTrigger.getAll().forEach((st) => {
        if (st.trigger === sectionRef.current || st.trigger === framesContainerRef.current) {
          st.kill();
        }
      });
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[86vh] sm:min-h-[92vh] flex flex-col items-center justify-between overflow-hidden pt-16 sm:pt-24 pb-0 bg-[#FAF7F2] dark:bg-[#09090b] transition-colors duration-300"
    >
      {/* Background Interactive PlasmaWave */}
      <div ref={gridContainerRef} className="absolute inset-0 pointer-events-none overflow-hidden">
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
      </div>

      {/* Top Hero Text & CTAs */}
      <div
        ref={heroContentRef}
        className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center pt-2 sm:pt-4"
      >
        {/* Main Title: React Bits ShinyText */}
        <h1 className="text-2xl sm:text-[34px] md:text-[38px] font-semibold tracking-tight max-w-3xl leading-snug">
          <ShinyText
            text="The next-generation URL shortener for your campaigns & audiences"
            speed={4.5}
          />
        </h1>

        {/* Subtitle: React Bits TextType with dynamic rotation */}
        <p className="mt-3 sm:mt-4 text-xs sm:text-base text-neutral-600 dark:text-neutral-400 max-w-2xl font-normal leading-relaxed px-2 min-h-[44px] sm:min-h-[48px]">
          <TextType
            text={[
              "Shorten in milliseconds, split traffic with A/B testing, protect access with PIN codes, and analyze visitors in real time without cookies.",
              "Maximize conversions with worldwide geo-targeting and smart device-based routing.",
              "Protect affiliate links and deploy ultra-fast redirects across 300+ Cloudflare edge locations."
            ]}
            typingSpeed={25}
            deletingSpeed={12}
            pauseDuration={3200}
            loop={true}
          />
        </p>

        {/* CTAs using shadcn Button (stacked on mobile, inline on desktop) */}
        <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full max-w-xs sm:max-w-none">
          <Link href="/login" className="w-full sm:w-auto">
            <Button
              className="w-full sm:w-auto h-10 px-6 text-xs sm:text-sm font-medium rounded-full bg-[#0080ff] hover:bg-[#0070e0] sm:bg-[#ff6600] sm:hover:bg-[#ff771a] text-white border-none cursor-pointer shadow-md shadow-[#0080ff]/25 sm:shadow-[#ff6600]/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Button>
          </Link>
          <a href="#demo" className="w-full sm:w-auto">
            <Button
              variant="outline"
              className="w-full sm:w-auto h-10 px-6 text-xs sm:text-sm font-medium rounded-full border-neutral-300 dark:border-white/15 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer transition-all flex items-center justify-center"
            >
              <span>Explore Live Demo</span>
            </Button>
          </a>
        </div>
      </div>

      {/* Dual Frames Area: Docked directly to the bottom edge with expanded width */}
      <div
        ref={framesContainerRef}
        className="relative z-10 w-full max-w-[1140px] mx-auto px-3 sm:px-6 mt-6 sm:mt-8 flex flex-col justify-end will-change-transform"
      >
        {/* DESKTOP VIEW (sm & above): Both Frames with broadened widths and zero bottom gap */}
        <div className="hidden sm:flex items-end justify-center gap-4 lg:gap-5 h-[440px] select-none">
          
          {/* Desktop Browser Frame Container (with dedicated individual bottom shadows) */}
          <div className="relative flex-1 min-w-0 max-w-[780px] lg:max-w-[820px] h-[440px]">
            {/* Dedicated individual bottom shadows for Desktop Frame */}
            <div className="absolute -bottom-5 inset-x-8 h-10 bg-neutral-900/35 dark:bg-black/95 blur-xl rounded-full pointer-events-none -z-10" />
            <div className="absolute -bottom-8 inset-x-14 h-14 bg-neutral-900/20 dark:bg-black/80 blur-2xl rounded-full pointer-events-none -z-10" />

            <div className="w-full h-full rounded-t-2xl bg-[#FFFDF9] dark:bg-[#121216] border-t border-x border-[#E7DFD5] dark:border-white/15 shadow-[0_25px_60px_-15px_rgba(43,37,32,0.25),0_12px_28px_-6px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.92),0_15px_35px_-5px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col relative transition-colors">
              {/* Realistic Browser Chrome Bar */}
              <div className="h-10 bg-[#F2ECE4] dark:bg-[#18181d] border-b border-[#E7DFD5] dark:border-white/10 px-4 flex items-center justify-between select-none shrink-0 z-20">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1 rounded-md bg-white dark:bg-[#0f0f13] border border-[#E7DFD5] dark:border-white/10 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 w-3/5 max-w-sm justify-center">
                  <span className="text-emerald-500 font-bold">https://</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">lshorter.com</span>
                  <span className="text-[#ff6600] font-semibold">/dashboard/overview</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden md:inline font-bold">Edge Cloudflare 11ms</span>
                </div>
              </div>

              {/* Encircled Full SaaS Dashboard Overview with 4 KPIs, 30d Bar Chart, Top Countries & Recent Links */}
              <HeroDashboardView isCompact={true} />
            </div>
          </div>

          {/* Smartphone Frame Container (Right - with dedicated individual bottom shadows) */}
          <div ref={mobilePhoneRef} className="relative w-[285px] lg:w-[310px] shrink-0 h-[440px] will-change-transform">
            {/* Dedicated individual bottom shadows for Smartphone Frame */}
            <div className="absolute -bottom-4 inset-x-2 h-8 bg-neutral-900/35 dark:bg-black/95 blur-xl rounded-full pointer-events-none -z-10" />
            <div className="absolute -bottom-7 inset-x-5 h-10 bg-neutral-900/20 dark:bg-black/80 blur-2xl rounded-full pointer-events-none -z-10" />

            <div className="w-full h-full rounded-t-[34px] bg-[#E6DFD5] dark:bg-[#0c0c10] border-t-2 border-x-2 border-[#DDD1C4] dark:border-neutral-700 shadow-[0_25px_60px_-12px_rgba(43,37,32,0.28),0_12px_28px_-6px_rgba(0,0,0,0.18)] dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.92),0_15px_35px_-5px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col p-2.5 transition-colors relative">
              {/* Dynamic Island */}
              <div className="w-full flex justify-center py-1.5">
                <div className="w-20 h-4 rounded-full bg-[#2B2520] dark:bg-black border border-[#3E352F] dark:border-neutral-800 flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#1A1613] dark:bg-neutral-900 mr-2.5" />
                  <span className="w-2 h-2 rounded-full bg-[#0080ff]/50" />
                </div>
              </div>

              {/* Mobile Screen Inside Phone */}
              <div className="flex-1 rounded-t-[24px] bg-[#FFFDF9] dark:bg-[#16161c] p-2.5 text-[11px] flex flex-col justify-between overflow-hidden select-none border-t border-[#E7DFD5] dark:border-white/10 transition-colors relative space-y-1.5">
                
                {/* Mobile App Header */}
                <div className="flex items-center justify-between pt-0.5 border-b border-[#E7DFD5]/70 dark:border-white/10 pb-1.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-[#0080ff] flex items-center justify-center font-bold text-white text-[8px]">LS</span>
                    <span className="font-bebas text-sm font-bold text-[#0080ff] tracking-wide">LShorter App</span>
                  </div>
                  <span className="text-[8.5px] text-emerald-500 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">● Edge ON</span>
                </div>

                {/* 2x2 Metric Grid */}
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-[#1e1e26] border border-[#E7DFD5] dark:border-white/10 shadow-xs">
                    <span className="text-[8px] text-neutral-500 block">Total Clicks</span>
                    <span className="font-bebas text-base font-bold text-neutral-900 dark:text-white">128,420</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-[#1e1e26] border border-[#E7DFD5] dark:border-white/10 shadow-xs">
                    <span className="text-[8px] text-neutral-500 block">Edge SLA</span>
                    <span className="font-bebas text-base font-bold text-emerald-500">99.98%</span>
                  </div>
                </div>

                {/* 2 Detailed Mobile Link Cards */}
                <div className="space-y-1.5 flex-1">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-[#1e1e26] border border-[#E7DFD5] dark:border-white/10 shadow-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold text-neutral-900 dark:text-white truncate">SaaS Launch Campaign</span>
                      <span className="text-[7.5px] font-mono text-[#0080ff] bg-[#0080ff]/10 px-1 py-0.2 rounded font-semibold">A/B 50/50</span>
                    </div>
                    <span className="text-[9px] font-mono text-[#0080ff] block truncate font-medium">lshorter.com/r/launch-pro</span>
                    <div className="flex items-center justify-between text-[7.5px] text-neutral-500 pt-0.5">
                      <span className="text-emerald-500 font-mono font-medium">1,420 clicks today</span>
                      <span className="font-mono">PIN 8492</span>
                    </div>
                  </div>

                  <div className="p-1.5 rounded-lg bg-white dark:bg-[#1e1e26] border border-[#E7DFD5] dark:border-white/10 shadow-xs space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9.5px] font-bold text-neutral-900 dark:text-white truncate">App Store Router</span>
                      <span className="text-[7.5px] font-mono text-cyan-500 bg-cyan-500/10 px-1 py-0.2 rounded font-semibold">Device</span>
                    </div>
                    <span className="text-[9px] font-mono text-cyan-500 block truncate font-medium">lshorter.com/r/mobile-app</span>
                    <div className="flex items-center justify-between text-[7.5px] text-neutral-500 pt-0.5">
                      <span className="font-mono">iOS: 60% • Android: 40%</span>
                      <span className="text-emerald-500 font-mono">11ms</span>
                    </div>
                  </div>
                </div>

                {/* Mobile Bottom Tab Bar */}
                <div className="pt-1.5 border-t border-[#E7DFD5]/70 dark:border-white/10 flex items-center justify-around text-neutral-400">
                  <div className="flex flex-col items-center gap-0.5 text-[#0080ff]">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span className="text-[7.5px] font-semibold">Dashboard</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 hover:text-neutral-900 dark:hover:text-white">
                    <Link2 className="w-3.5 h-3.5" />
                    <span className="text-[7.5px]">Links</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 hover:text-neutral-900 dark:hover:text-white">
                    <QrCode className="w-3.5 h-3.5" />
                    <span className="text-[7.5px]">QR</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5 hover:text-neutral-900 dark:hover:text-white">
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span className="text-[7.5px]">Stats</span>
                  </div>
                </div>

                <div className="w-16 h-1 rounded-full bg-[#C8BFB3] dark:bg-neutral-600 mx-auto mt-0.5" />
              </div>
            </div>
          </div>
        </div>

        {/* MOBILE VIEW (< sm): Centered Smartphone Mockup with dedicated bottom shadow */}
        <div className="flex sm:hidden justify-center max-h-[380px] overflow-hidden w-full px-2">
          <div className="relative w-full max-w-[310px] h-[400px]">
            {/* Dedicated individual bottom shadow for mobile phone */}
            <div className="absolute -bottom-4 inset-x-2 h-8 bg-neutral-900/35 dark:bg-black/95 blur-xl rounded-full pointer-events-none -z-10" />

            <div className="w-full h-full rounded-t-[36px] bg-[#E6DFD5] dark:bg-[#0d0d12] border-t-2 border-x-2 border-[#DDD1C4] dark:border-neutral-700 shadow-[0_25px_60px_-12px_rgba(43,37,32,0.28)] dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.92)] p-2 flex flex-col relative transition-colors">
              {/* Dynamic Island */}
              <div className="w-full flex justify-center py-1.5 mb-1">
                <div className="w-20 h-4 rounded-full bg-[#2B2520] dark:bg-black border border-[#3E352F] dark:border-neutral-800 flex items-center justify-between px-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[7.5px] font-mono font-medium text-white/70">LShorter Edge</span>
                  <span className="w-2 h-1 rounded-full bg-white/20" />
                </div>
              </div>

              {/* Mobile Screen Inside Phone */}
              <div className="flex-1 rounded-t-[26px] bg-[#FFFDF9] dark:bg-[#121218] p-3 flex flex-col justify-between overflow-hidden border-t border-[#E7DFD5] dark:border-white/10 text-xs select-none transition-colors relative space-y-1.5">
                <div className="flex items-center justify-between pb-1 border-b border-[#E7DFD5] dark:border-white/10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-4 h-4 rounded bg-[#0080ff] flex items-center justify-center font-bold text-white text-[8px]">LS</span>
                    <span className="font-bebas text-sm font-bold text-neutral-900 dark:text-white">LShorter App</span>
                  </div>
                  <span className="text-[8px] font-mono text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.2 rounded font-semibold">
                    11 ms Edge
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div className="p-1.5 rounded-lg bg-white dark:bg-[#181822] border border-[#E7DFD5] dark:border-white/5">
                    <span className="text-[8px] text-neutral-500 dark:text-neutral-400 block">Total Clicks</span>
                    <span className="font-bebas text-sm font-semibold text-neutral-900 dark:text-white">128,420</span>
                  </div>
                  <div className="p-1.5 rounded-lg bg-white dark:bg-[#181822] border border-[#E7DFD5] dark:border-white/5">
                    <span className="text-[8px] text-neutral-500 dark:text-neutral-400 block">Success Rate</span>
                    <span className="font-bebas text-sm font-semibold text-emerald-500">99.98%</span>
                  </div>
                </div>

                <div className="p-2 rounded-lg bg-white dark:bg-[#181822] border border-[#E7DFD5] dark:border-white/5 space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[9.5px] font-medium text-neutral-800 dark:text-neutral-200">SaaS Launch Campaign</span>
                    <span className="text-[7.5px] font-mono text-[#0080ff] bg-[#0080ff]/10 px-1 py-0.2 rounded">A/B 50/50</span>
                  </div>
                  <span className="text-[9px] font-mono text-[#0080ff] block truncate font-medium">lshorter.com/r/launch-pro</span>
                </div>

                {/* Mobile Bottom Tab Bar */}
                <div className="pt-1 border-t border-[#E7DFD5]/70 dark:border-white/10 flex items-center justify-around text-neutral-400">
                  <div className="flex flex-col items-center gap-0.5 text-[#0080ff]">
                    <LayoutDashboard className="w-3.5 h-3.5" />
                    <span className="text-[7px] font-semibold">Dashboard</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <Link2 className="w-3.5 h-3.5" />
                    <span className="text-[7px]">Links</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <QrCode className="w-3.5 h-3.5" />
                    <span className="text-[7px]">QR</span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span className="text-[7px]">Stats</span>
                  </div>
                </div>

                <div className="w-16 h-1 rounded-full bg-[#C8BFB3] dark:bg-neutral-600 mx-auto" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
