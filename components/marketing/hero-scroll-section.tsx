"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import QRCode from "qrcode";
import {
  ArrowRight,
  Sparkles,
  ExternalLink,
  QrCode,
  Shield,
  Sliders,
  Globe,
  Globe2,
  Copy,
  Check,
  Smartphone,
  TrendingUp,
  Lock,
  LayoutDashboard,
  Link2,
  BarChart2,
  Plus,
  ArrowUpRight,
  Share2,
  Monitor,
  Download,
  Filter,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Split,
  EyeOff,
  Zap,
  MoreVertical,
  Calendar,
  Layers,
  Activity,
  DollarSign,
  Crown,
  Save,
  Tag,
  KeyRound,
  Settings,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShinyText } from "@/components/ui/shiny-text";
import { TextType } from "@/components/ui/text-type";
import PlasmaWave from "./plasma-wave";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { AnimatedBar } from "@/components/ui/animated-bar";
import confetti from "canvas-confetti";

export function HeroScrollSection() {
  const containerRef = useRef<HTMLDivElement>(null);

  // ─── FRAMER MOTION SCROLL PHYSICS (Aceternity Style) ───
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 24,
    restDelta: 0.001,
  });

  // 1. Hero Text & CTAs (Phase 1: Top of scroll -> Fades & floats up)
  const heroOpacity = useTransform(smoothProgress, [0, 0.22], [1, 0]);
  const heroY = useTransform(smoothProgress, [0, 0.22], [0, -80]);
  const heroScale = useTransform(smoothProgress, [0, 0.22], [1, 0.96]);

  // 2. Mobile Phone Frame (Phase 1: Fades out quickly to the right)
  const mobileOpacity = useTransform(smoothProgress, [0, 0.18], [1, 0]);
  const mobileScale = useTransform(smoothProgress, [0, 0.18], [1, 0.84]);
  const mobileX = useTransform(smoothProgress, [0, 0.18], [0, 70]);

  // 3. Desktop Frame Transform (The ONE single frame that starts at exact Hero 440px / 820px and expands to full 70vh / max-w-6xl)
  const frameHeight = useTransform(smoothProgress, [0, 0.65], ["440px", "70vh"]);
  const frameMinHeight = useTransform(smoothProgress, [0, 0.65], ["440px", "580px"]);
  const frameMaxWidth = useTransform(smoothProgress, [0, 0.65], ["820px", "1152px"]);
  const frameScale = useTransform(smoothProgress, [0, 0.65], [0.98, 1]);
  const frameRotateX = useTransform(smoothProgress, [0, 0.55], [6, 0]);
  const frameY = useTransform(smoothProgress, [0, 0.65], [0, 0]);

  // 4. Section 2 Header (Phase 3: Fades in AFTER the frame starts expanding)
  const section2Opacity = useTransform(smoothProgress, [0.42, 0.72], [0, 1]);
  const section2Y = useTransform(smoothProgress, [0.42, 0.72], [30, 0]);

  // Pointer events helpers based on scroll state
  const [isHeroActive, setIsHeroActive] = useState(true);
  useEffect(() => {
    return smoothProgress.on("change", (v) => {
      setIsHeroActive(v < 0.22);
    });
  }, [smoothProgress]);

  // ─── DASHBOARD INTERACTIVE STATES ───
  const [activeTab, setActiveTab] = useState<"overview" | "links" | "qr" | "analytics">("overview");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Overview states
  const [isRefreshingOverview, setIsRefreshingOverview] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Links Tab states
  const [filterQuery, setFilterQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  // QR Studio Customization States
  const [qrContentType, setQrContentType] = useState<"link" | "text" | "wifi" | "email" | "call" | "sms">("link");
  const [selectedPresetSlug, setSelectedPresetSlug] = useState("launch-pro-2026");
  const [qrWebsiteUrl, setQrWebsiteUrl] = useState("https://lsho.cc/r/launch-pro-2026");
  const [qrPixelStyle, setQrPixelStyle] = useState<"square" | "rounded" | "dots" | "diamond" | "classy">("rounded");
  const [qrEyeStyle, setQrEyeStyle] = useState<"square" | "rounded" | "circle" | "cyber" | "star">("rounded");
  const [qrColorMode, setQrColorMode] = useState<"monochrome" | "gradient">("monochrome");
  const [qrPixelColor, setQrPixelColor] = useState("#ff6600");
  const [qrPixelColor2, setQrPixelColor2] = useState("#ff3300");
  const [qrFrame, setQrFrame] = useState<"none" | "simple" | "bottom_pill" | "top_header" | "modern_badge" | "neon">("bottom_pill");
  const [qrFrameText, setQrFrameText] = useState("SCAN ME");
  const [qrFrameColor, setQrFrameColor] = useState("#ff6600");
  const [qrLogo, setQrLogo] = useState<"ql" | "text" | "none">("ql");
  const [qrSize, setQrSize] = useState(240);
  const [isQrSaved, setIsQrSaved] = useState(false);
  const qrCanvasRef = useRef<HTMLCanvasElement>(null);

  // Analytics Tab states
  const [analyticsRange, setAnalyticsRange] = useState<"day" | "week" | "month" | "year">("month");

  // Mock Links Dataset
  const mockLinks = [
    {
      id: "1",
      slug: "launch-pro-2026",
      shortUrl: "https://lsho.cc/launch-pro-2026",
      targetUrl: "https://mon-entreprise.com/offre-speciale-q3",
      clicks: 84200,
      uniqueClicks: 71400,
      revenue: 1680.0,
      conversionRate: 3.8,
      status: "active",
      tags: ["marketing", "campagne-q3", "ab-testing"],
      features: { ab: true, geo: true, mobile: true, lock: false, cloak: false },
    },
    {
      id: "2",
      slug: "ebook-conversion",
      shortUrl: "https://lsho.cc/ebook-conversion",
      targetUrl: "https://ressources.io/growth-mastery-v2.pdf",
      clicks: 31200,
      uniqueClicks: 28900,
      revenue: 520.0,
      conversionRate: 2.9,
      status: "active",
      tags: ["leadgen", "qr-studio"],
      features: { ab: false, geo: true, mobile: false, lock: false, cloak: true },
    },
    {
      id: "3",
      slug: "direction-finance",
      shortUrl: "https://lsho.cc/direction-finance",
      targetUrl: "https://drive.corporate.com/bilan-confidentiel-q3",
      clicks: 13020,
      uniqueClicks: 12100,
      revenue: 250.0,
      conversionRate: 4.1,
      status: "active",
      tags: ["vip", "code-pin"],
      features: { ab: false, geo: false, mobile: false, lock: true, cloak: false },
    },
  ];

  // 30-Day Click Histogram Data
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

  const handlePresetChange = (slug: string) => {
    setSelectedPresetSlug(slug);
    const link = mockLinks.find((l) => l.slug === slug);
    if (link) {
      setQrWebsiteUrl(link.shortUrl);
    }
  };

  // QR Canvas Rendering
  useEffect(() => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    try {
      const rawData = qrWebsiteUrl || "https://lsho.cc/r/launch-pro-2026";
      const qr = QRCode.create(rawData, {
        errorCorrectionLevel: "H",
      });

      const moduleCount = qr.modules.size;
      const padding = 18;
      const frameTopPadding = qrFrame === "top_header" ? 44 : padding;
      const frameBottomPadding =
        qrFrame === "bottom_pill" || qrFrame === "modern_badge" ? 48 : padding;

      const baseDimension = qrSize;
      const totalWidth = baseDimension + padding * 2;
      const totalHeight = baseDimension + frameTopPadding + frameBottomPadding;

      canvas.width = totalWidth;
      canvas.height = totalHeight;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, totalWidth, totalHeight);

      if (qrFrame === "simple") {
        ctx.strokeStyle = qrFrameColor;
        ctx.lineWidth = 4;
        ctx.strokeRect(6, 6, totalWidth - 12, totalHeight - 12);
      } else if (qrFrame === "bottom_pill") {
        ctx.fillStyle = qrFrameColor;
        ctx.beginPath();
        const pillH = 34;
        const pillY = totalHeight - pillH - 8;
        ctx.roundRect(14, pillY, totalWidth - 28, pillH, 8);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(qrFrameText || "SCAN ME", totalWidth / 2, pillY + pillH / 2);
      } else if (qrFrame === "top_header") {
        ctx.fillStyle = qrFrameColor;
        ctx.beginPath();
        ctx.roundRect(10, 8, totalWidth - 20, 32, 6);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 12px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(qrFrameText || "SCAN TO VISIT", totalWidth / 2, 24);
      }

      const cellSize = baseDimension / moduleCount;
      const offsetX = padding;
      const offsetY = frameTopPadding;

      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (qr.modules.get(r, c)) {
            const x = offsetX + c * cellSize;
            const y = offsetY + r * cellSize;

            if (qrColorMode === "gradient") {
              const grad = ctx.createLinearGradient(
                offsetX,
                offsetY,
                offsetX + baseDimension,
                offsetY + baseDimension
              );
              grad.addColorStop(0, qrPixelColor);
              grad.addColorStop(1, qrPixelColor2);
              ctx.fillStyle = grad;
            } else {
              ctx.fillStyle = qrPixelColor;
            }

            if (qrPixelStyle === "rounded") {
              ctx.beginPath();
              ctx.roundRect(x, y, cellSize, cellSize, cellSize * 0.4);
              ctx.fill();
            } else if (qrPixelStyle === "dots") {
              ctx.beginPath();
              ctx.arc(
                x + cellSize / 2,
                y + cellSize / 2,
                cellSize / 2.3,
                0,
                Math.PI * 2
              );
              ctx.fill();
            } else if (qrPixelStyle === "diamond") {
              ctx.beginPath();
              ctx.moveTo(x + cellSize / 2, y);
              ctx.lineTo(x + cellSize, y + cellSize / 2);
              ctx.lineTo(x + cellSize / 2, y + cellSize);
              ctx.lineTo(x, y + cellSize / 2);
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.fillRect(x, y, cellSize, cellSize);
            }
          }
        }
      }

      if (qrLogo === "ql") {
        const logoDim = baseDimension * 0.22;
        const logoX = offsetX + (baseDimension - logoDim) / 2;
        const logoY = offsetY + (baseDimension - logoDim) / 2;

        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.roundRect(logoX - 3, logoY - 3, logoDim + 6, logoDim + 6, 8);
        ctx.fill();

        ctx.fillStyle = "#ff6600";
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, logoDim, logoDim, 6);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = `900 ${Math.round(logoDim * 0.52)}px 'Bebas Neue', Inter, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("LS", logoX + logoDim / 2, logoY + logoDim / 2 + 1);
      }
    } catch {}
  }, [
    qrWebsiteUrl,
    qrPixelStyle,
    qrEyeStyle,
    qrColorMode,
    qrPixelColor,
    qrPixelColor2,
    qrFrame,
    qrFrameText,
    qrFrameColor,
    qrLogo,
    qrSize,
  ]);

  const handleDownloadQR = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const link = document.createElement("a");
    link.download = `lshorter-qr-${selectedPresetSlug}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    try {
      confetti({ particleCount: 45, spread: 70, origin: { y: 0.6 } });
    } catch {}
  };

  const handleSaveQR = () => {
    setIsQrSaved(true);
    try {
      confetti({ particleCount: 35, spread: 60, origin: { y: 0.7 } });
    } catch {}
    setTimeout(() => setIsQrSaved(false), 2500);
  };

  const handleCopy = (url: string, slug: string) => {
    if (typeof navigator !== "undefined") {
      navigator.clipboard.writeText(url);
      setCopiedSlug(slug);
      try {
        confetti({ particleCount: 25, spread: 45, origin: { y: 0.75 } });
      } catch {}
      setTimeout(() => setCopiedSlug(null), 2000);
    }
  };

  const handleRefreshOverview = () => {
    setIsRefreshingOverview(true);
    setTimeout(() => setIsRefreshingOverview(false), 600);
  };

  const filteredLinks = mockLinks.filter((l) => {
    const matchQuery =
      l.slug.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.targetUrl.toLowerCase().includes(filterQuery.toLowerCase()) ||
      l.tags.some((t) => t.toLowerCase().includes(filterQuery.toLowerCase()));
    const matchTag = tagFilter === "all" || l.tags.includes(tagFilter);
    const matchStatus = statusFilter === "all" || (statusFilter === "protected" && l.features.lock);
    return matchQuery && matchTag && matchStatus;
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-[230vh] sm:h-[250vh] bg-[#FAF7F2] dark:bg-[#09090b] transition-colors duration-300"
    >
      {/* Sticky Viewport Stage */}
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-between pt-14 pb-3 sm:pt-16 sm:pb-5 px-3 sm:px-6 select-none">
        
        {/* Background Interactive PlasmaWave */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
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

        {/* ─── LAYER 1: HERO TOP TEXTS & CTAS (Fades out when scrolling down) ─── */}
        <motion.div
          style={{
            opacity: heroOpacity,
            y: heroY,
            scale: heroScale,
            pointerEvents: isHeroActive ? "auto" : "none",
          }}
          className="absolute top-16 sm:top-20 inset-x-0 mx-auto max-w-4xl px-4 text-center z-20 flex flex-col items-center will-change-transform"
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

          {/* Hero CTAs */}
          <div className="mt-4 sm:mt-5 flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 w-full max-w-xs sm:max-w-none">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                className="w-full sm:w-auto h-9 sm:h-10 px-6 text-xs sm:text-sm font-medium rounded-full bg-brand hover:bg-brand-hover text-white border-none cursor-pointer shadow-md shadow-brand transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: window.innerHeight * 0.9, behavior: "smooth" });
                }
              }}
              className="w-full sm:w-auto"
            >
              <Button
                variant="outline"
                className="w-full sm:w-auto h-9 sm:h-10 px-6 text-xs sm:text-sm font-medium rounded-full border-neutral-300 dark:border-white/15 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-white/5 cursor-pointer transition-all flex items-center justify-center"
              >
                <span>Explore Live Demo</span>
              </Button>
            </button>
          </div>
        </motion.div>

        {/* ─── LAYER 2: SECTION 2 HEADER (Fades in as frame centers and expands) ─── */}
        <motion.div
          style={{
            opacity: section2Opacity,
            y: section2Y,
            pointerEvents: !isHeroActive ? "auto" : "none",
          }}
          className="absolute top-12 sm:top-14 inset-x-0 mx-auto max-w-2xl px-4 text-center z-20 will-change-transform"
        >
          <h2 className="text-xl sm:text-3xl lg:text-[34px] font-bold tracking-tight text-[#2B2520] dark:text-white leading-tight">
            Experience the Power of LShorter in Action
          </h2>
          <p className="mt-1.5 text-[11px] sm:text-sm text-neutral-600 dark:text-neutral-400 font-normal leading-relaxed">
            An intuitive dashboard engineered to manage your Edge redirects, routing rules, and real-time metrics.
          </p>
        </motion.div>

        {/* ─── LAYER 3: CENTRAL ANIMATED STAGE (Desktop Frame & Disappearing Mobile Frame) ─── */}
        <div className="relative z-10 w-full max-w-6xl mx-auto flex items-end justify-center h-full pt-20 pb-0 sm:pt-24 sm:pb-2">
          
          {/* Dual Frame Row */}
          <div className="w-full flex items-end justify-center gap-4 lg:gap-5">
            
            {/* 1. DESKTOP BROWSER FRAME (The Hero piece that tracks scroll, centers, scales, and expands to 70vh) */}
            <motion.div
              style={{
                scale: frameScale,
                rotateX: frameRotateX,
                y: frameY,
                maxWidth: frameMaxWidth,
                height: frameHeight,
                minHeight: frameMinHeight,
                transformPerspective: 1200,
              }}
              className="relative flex-1 min-w-0 rounded-2xl bg-[#FFFDF9] dark:bg-[#121216] border border-[#E7DFD5] dark:border-white/15 shadow-[0_25px_70px_rgba(43,37,32,0.22)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.92)] overflow-hidden flex flex-col transition-colors will-change-transform"
            >
              {/* Browser Chrome Top Bar */}
              <div className="h-10 sm:h-11 bg-[#F2ECE4] dark:bg-[#18181d] border-b border-[#E7DFD5] dark:border-white/10 px-4 flex items-center justify-between select-none shrink-0 z-20">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white dark:bg-[#0f0f13] border border-[#E7DFD5] dark:border-white/10 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 w-3/5 max-w-sm justify-center">
                  <span className="text-emerald-500 font-bold">https://</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">lshorter.com</span>
                  <span className="text-brand font-semibold">/dashboard/{activeTab === "qr" ? "qr-code" : activeTab}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden md:inline font-bold">Edge Cloudflare 11ms</span>
                </div>
              </div>

              {/* Inner Dashboard Layout (Sidebar + Tabs) */}
              <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
                
                {/* Authentic Sidebar */}
                <div className="w-full md:w-52 lg:w-56 p-3 sm:p-4 bg-[#FAF7F2] dark:bg-[#09090b] border-b md:border-b-0 md:border-r border-[#E7DFD5] dark:border-[#222225] flex md:flex-col justify-between shrink-0 select-none overflow-y-auto">
                  <div className="flex md:flex-col gap-1 w-full">
                    {/* Brand Header */}
                    <div className="hidden md:flex items-center gap-2.5 px-1 py-1 mb-2">
                      <div className="w-7 h-7 rounded-[8px] bg-brand flex items-center justify-center font-bebas text-base font-black text-white shadow-md shadow-brand shrink-0">
                        LS
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bebas text-lg tracking-wider text-neutral-900 dark:text-white leading-none">
                          L <span className="text-brand">SHORTER</span>
                        </span>
                        <span className="text-[8.5px] uppercase font-bold tracking-widest text-neutral-500 mt-0.5">
                          Edge Platform
                        </span>
                      </div>
                    </div>

                    {/* Create Link Button */}
                    <div className="hidden md:block mb-3">
                      <button
                        type="button"
                        onClick={() => setActiveTab("links")}
                        className="w-full h-8.5 rounded-[10px] bg-brand hover:bg-brand-hover text-white font-bold flex items-center justify-center text-xs gap-1.5 shadow-md shadow-brand transition-all cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span className="font-bebas text-sm tracking-wide">CREATE A LINK</span>
                      </button>
                    </div>

                    <span className="hidden md:block px-2 text-[9px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-1">
                      Menu
                    </span>

                    {/* Navigation Items */}
                    <button
                      type="button"
                      onClick={() => setActiveTab("overview")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === "overview"
                          ? "bg-brand text-white shadow-md font-semibold"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                      <span>Overview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("links")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === "links"
                          ? "bg-brand text-white shadow-md font-semibold"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Mes Liens</span>
                      <span className="ml-auto text-[10px] px-1.5 py-0.2 rounded-full bg-black/10 dark:bg-white/10 font-mono">
                        3
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("qr")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === "qr"
                          ? "bg-brand text-white shadow-md font-semibold"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5 shrink-0" />
                      <span>QR Code Studio</span>
                      <span className="ml-auto text-[8.5px] px-1 rounded bg-amber-500/15 text-amber-500 font-bold">
                        HD
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("analytics")}
                      className={`flex items-center gap-2 px-3 py-2 rounded-[10px] text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === "analytics"
                          ? "bg-brand text-white shadow-md font-semibold"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Analytics</span>
                    </button>
                  </div>

                  {/* Sidebar Bottom Quota Box */}
                  <div className="hidden md:block p-2.5 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#27272a] text-xs mt-3">
                    <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                      <span className="font-bold text-brand">PRO PLAN</span>
                      <span className="font-mono text-neutral-900 dark:text-white">128.4K / 1M</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                      <div className="w-[32%] h-full bg-brand rounded-full" />
                    </div>
                    <span className="text-[8.5px] text-neutral-400 block mt-1 font-mono">Cloudflare Edge 11ms</span>
                  </div>
                </div>

                {/* Main Content Pane */}
                <div className="flex-1 p-3 sm:p-5 lg:p-6 overflow-y-auto max-h-[720px] select-none bg-[#FFFDF9] dark:bg-[#0f0f13]">
                  
                  {/* TAB 1: OVERVIEW */}
                  {activeTab === "overview" && (
                    <div className="space-y-4 sm:space-y-5 animate-in fade-in duration-200">
                      {/* Top Bar Action */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-neutral-900 dark:text-white tracking-wide">
                            Overview
                          </h3>
                          <p className="text-[11px] text-neutral-500">
                            Global performance of your redirects, conversions, and live clicks.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleRefreshOverview}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-[8px] bg-neutral-100 dark:bg-white/10 hover:bg-neutral-200 dark:hover:bg-white/15 text-[11px] font-medium transition-colors cursor-pointer"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRefreshingOverview ? "animate-spin text-brand" : ""}`} />
                            <span>Refresh</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("links")}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3 stroke-[3]" />
                            <span>+ CREATE A LINK</span>
                          </button>
                        </div>
                      </div>

                      {/* 4 Metric KPI Cards */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3">
                        <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-neutral-500 font-medium">Total Clicks</span>
                            <span className="text-[9.5px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                              +14.2%
                            </span>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="font-bebas text-2xl sm:text-3xl font-bold text-brand">
                              128,420
                            </span>
                          </div>
                          <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">
                            71,400 unique • Real-time Edge
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-neutral-500 font-medium">Created Links</span>
                            <span className="text-[9.5px] font-mono font-bold text-neutral-700 dark:text-neutral-300 bg-black/5 dark:bg-white/10 px-1.5 py-0.2 rounded">
                              42
                            </span>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="font-bebas text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                              42
                            </span>
                          </div>
                          <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">
                            42 active • Active routing
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-neutral-500 font-medium">Tracked Revenue</span>
                            <span className="text-[9.5px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                              $2,450
                            </span>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="font-bebas text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white">
                              $2,450.00
                            </span>
                          </div>
                          <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">
                            EPC $0.19 • Conversions
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 shadow-xs">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] text-neutral-500 font-medium">Conversion Rate</span>
                            <span className="text-[9.5px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                              3.4%
                            </span>
                          </div>
                          <div className="mt-1 flex items-baseline gap-1">
                            <span className="font-bebas text-2xl sm:text-3xl font-bold text-emerald-500">
                              3.4%
                            </span>
                          </div>
                          <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">
                            4,360 conversions • Optimum &gt; 2%
                          </span>
                        </div>
                      </div>

                      {/* Middle Row: 30-Day Click Histogram & Top Countries */}
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                        {/* 30-Day Click Chart */}
                        <div className="lg:col-span-2 p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 shadow-xs">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                                Click Analytics (30 Days)
                              </h4>
                              <p className="text-[10px] text-neutral-500">All links combined</p>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-brand bg-brand-subtle px-2 py-0.5 rounded">
                              128.4K clicks
                            </span>
                          </div>

                          {/* Bar Histogram */}
                          <div className="h-28 flex items-end justify-between gap-1 pt-3 pb-1">
                            {dailyClicksData.map((d, i) => {
                              const heightPct = (d.clicks / maxClicksValue) * 100;
                              const isHovered = hoveredBarIndex === i;
                              return (
                                <div
                                  key={i}
                                  onMouseEnter={() => setHoveredBarIndex(i)}
                                  onMouseLeave={() => setHoveredBarIndex(null)}
                                  className="flex-1 flex flex-col items-center h-full justify-end group relative cursor-pointer"
                                >
                                  {isHovered && (
                                    <div className="absolute -top-7 bg-neutral-900 text-white text-[9px] font-mono py-0.5 px-1.5 rounded shadow whitespace-nowrap z-30">
                                      {d.clicks.toLocaleString()} ({d.date})
                                    </div>
                                  )}
                                  <AnimatedBar
                                    direction="vertical"
                                    value={heightPct}
                                    delay={i * 0.02}
                                    className={`w-full rounded-t-sm transition-colors duration-200 ${
                                      isHovered
                                        ? "bg-emerald-500 shadow-md shadow-emerald-500/30"
                                        : "bg-brand hover:bg-brand-hover"
                                    }`}
                                  />
                                  <span className="text-[8px] font-mono text-neutral-400 mt-1 truncate max-w-[20px]">
                                    {d.date.split(" ")[0]}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Top Countries */}
                        <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 shadow-xs flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                                Top Countries
                              </h4>
                              <button
                                type="button"
                                onClick={() => setActiveTab("analytics")}
                                className="text-[10px] text-brand font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                              >
                                Details <ArrowUpRight className="w-2.5 h-2.5" />
                              </button>
                            </div>

                            <div className="space-y-1.5">
                              {[
                                { code: "FR", name: "France", clicks: 52400, pct: 40.8 },
                                { code: "US", name: "United States", clicks: 34100, pct: 26.5 },
                                { code: "BF", name: "Burkina Faso", clicks: 18900, pct: 14.7 },
                                { code: "DE", name: "Germany", clicks: 12100, pct: 9.4 },
                                { code: "CA", name: "Canada", clicks: 10920, pct: 8.6 },
                              ].map((c, i) => (
                                <div key={c.code} className="space-y-0.5">
                                  <div className="flex items-center justify-between text-[10px] font-mono">
                                    <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                                      {c.code} <span className="text-neutral-500">{c.name}</span>
                                    </span>
                                    <span className="text-neutral-600 dark:text-neutral-400 font-bold">
                                      {c.clicks.toLocaleString()} ({c.pct}%)
                                    </span>
                                  </div>
                                  <div className="w-full h-1 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                                    <AnimatedBar
                                      value={c.pct}
                                      delay={i * 0.08}
                                      className="h-full bg-brand rounded-full"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <span className="text-[9px] text-neutral-400 font-mono block mt-2">
                            84 recorded countries • Cloudflare Edge
                          </span>
                        </div>
                      </div>

                      {/* Bottom Row: Recent Links Table */}
                      <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                              Recent Links
                            </h4>
                            <p className="text-[10px] text-neutral-500">Your latest created redirects</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveTab("links")}
                            className="text-[10px] text-brand font-bold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            View all links <ArrowUpRight className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[10px] border-collapse">
                            <thead>
                              <tr className="border-b border-[#E7DFD5] dark:border-white/10 text-neutral-400 font-mono uppercase text-[9px]">
                                <th className="pb-1.5 pl-1">Link & Target</th>
                                <th className="pb-1.5">Short URL</th>
                                <th className="pb-1.5 text-center">Options</th>
                                <th className="pb-1.5 text-right pr-2">Clicks</th>
                                <th className="pb-1.5">Status</th>
                                <th className="pb-1.5 text-right pr-1">Action</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E7DFD5]/60 dark:divide-white/5">
                              {mockLinks.map((link) => (
                                <tr key={link.id} className="hover:bg-neutral-100/50 dark:hover:bg-white/5 transition-colors">
                                  <td className="py-1.5 pl-1 max-w-[140px] truncate">
                                    <span className="font-bold text-neutral-900 dark:text-white block truncate">
                                      /{link.slug}
                                    </span>
                                    <span className="text-[8px] font-mono text-neutral-400 truncate block">
                                      {link.targetUrl.replace("https://", "")}
                                    </span>
                                  </td>
                                  <td className="py-1.5 font-mono text-brand font-semibold truncate max-w-[130px]">
                                    {link.shortUrl}
                                  </td>
                                  <td className="py-1.5 text-center">
                                    <div className="flex items-center justify-center gap-1 text-neutral-400">
                                      {link.features.ab && <span title="A/B Routing"><Split className="w-2.5 h-2.5 text-brand" /></span>}
                                      {link.features.geo && <span title="Geo Routing"><Globe className="w-2.5 h-2.5 text-emerald-500" /></span>}
                                      {link.features.cloak && <span title="Cloaking"><EyeOff className="w-2.5 h-2.5 text-purple-400" /></span>}
                                      {link.features.lock && <span title="PIN Protected"><Lock className="w-2.5 h-2.5 text-amber-500" /></span>}
                                    </div>
                                  </td>
                                  <td className="py-1.5 text-right pr-2 font-mono font-bold text-neutral-900 dark:text-white">
                                    {link.clicks.toLocaleString()}
                                  </td>
                                  <td className="py-1.5">
                                    <span className="px-1.5 py-0.2 rounded text-[8px] font-mono font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                                      Active
                                    </span>
                                  </td>
                                  <td className="py-1.5 text-right pr-1">
                                    <button
                                      type="button"
                                      onClick={() => handleCopy(link.shortUrl, `link-${link.id}`)}
                                      className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/10 hover:bg-brand hover:text-white text-[8.5px] font-bold transition-colors cursor-pointer"
                                    >
                                      {copiedSlug === `link-${link.id}` ? "Copied" : "Copy"}
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: MES LIENS */}
                  {activeTab === "links" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            Mes Liens &amp; Routages
                          </h3>
                          <p className="text-[11px] text-neutral-500">
                            Gérez vos liens raccourcis, règles A/B testing et protection PIN.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Nouveau Lien</span>
                        </button>
                      </div>

                      {/* Filters */}
                      <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 flex flex-wrap items-center gap-2">
                        <div className="relative flex-1 min-w-[160px]">
                          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                          <input
                            type="text"
                            value={filterQuery}
                            onChange={(e) => setFilterQuery(e.target.value)}
                            placeholder="Rechercher par slug, URL, tag..."
                            className="w-full pl-7 pr-2 py-1 text-xs rounded-lg bg-white dark:bg-[#0c0c10] border border-[#E7DFD5] dark:border-white/10 outline-none text-neutral-900 dark:text-white"
                          />
                        </div>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="text-xs px-2 py-1 rounded-lg bg-white dark:bg-[#0c0c10] border border-[#E7DFD5] dark:border-white/10 outline-none text-neutral-700 dark:text-neutral-300"
                        >
                          <option value="all">Tous statuts</option>
                          <option value="protected">Protégés PIN</option>
                        </select>
                      </div>

                      {/* Links List Cards */}
                      <div className="space-y-2">
                        {filteredLinks.map((link) => (
                          <div
                            key={link.id}
                            className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-brand transition-all"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-neutral-900 dark:text-white">
                                  /{link.slug}
                                </span>
                                <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                  ● Active
                                </span>
                              </div>
                              <span className="text-[11px] font-mono text-brand font-semibold block truncate">
                                {link.shortUrl}
                              </span>
                              <span className="text-[9.5px] text-neutral-400 truncate block">
                                Cible: {link.targetUrl}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right font-mono pr-2">
                                <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                                  {link.clicks.toLocaleString()}
                                </span>
                                <span className="text-[9px] text-neutral-400">clics</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(link.shortUrl, link.slug)}
                                className="px-2.5 py-1 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-bold cursor-pointer transition-all"
                              >
                                {copiedSlug === link.slug ? "Copié !" : "Copier"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* TAB 3: QR CODE STUDIO */}
                  {activeTab === "qr" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            QR Code Studio Haute Définition
                          </h3>
                          <p className="text-[11px] text-neutral-500">
                            Générez des QR codes vectoriels personnalisés aux couleurs de votre marque.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleDownloadQR}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-brand hover:bg-brand-hover text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Télécharger PNG</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Customization controls */}
                        <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 space-y-3">
                          <div>
                            <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                              Style des Pixels
                            </label>
                            <div className="grid grid-cols-3 gap-1.5">
                              {(["rounded", "dots", "diamond", "square"] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setQrPixelStyle(st)}
                                  className={`py-1 text-[11px] font-medium rounded-md capitalize cursor-pointer border ${
                                    qrPixelStyle === st
                                      ? "bg-brand text-white border-brand"
                                      : "bg-white dark:bg-[#141416] border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300"
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                              Couleur Principale
                            </label>
                            <div className="flex items-center gap-2">
                              {["#ff6600", "#0080ff", "#10b981", "#8b5cf6", "#000000"].map((c) => (
                                <button
                                  key={c}
                                  type="button"
                                  onClick={() => setQrPixelColor(c)}
                                  style={{ backgroundColor: c }}
                                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                                    qrPixelColor === c ? "scale-110 ring-2 ring-offset-2 ring-brand" : ""
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          <div>
                            <label className="text-[10px] font-bold uppercase text-neutral-500 block mb-1">
                              Cadre &amp; CTA
                            </label>
                            <div className="grid grid-cols-2 gap-1.5">
                              {(["bottom_pill", "top_header", "simple", "none"] as const).map((fr) => (
                                <button
                                  key={fr}
                                  type="button"
                                  onClick={() => setQrFrame(fr)}
                                  className={`py-1 text-[11px] font-medium rounded-md capitalize cursor-pointer border ${
                                    qrFrame === fr
                                      ? "bg-brand text-white border-brand"
                                      : "bg-white dark:bg-[#141416] border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300"
                                  }`}
                                >
                                  {fr.replace("_", " ")}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* Canvas Preview */}
                        <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 flex flex-col items-center justify-center">
                          <div className="p-3 bg-white rounded-xl shadow-md border border-neutral-200">
                            <canvas ref={qrCanvasRef} className="max-w-[200px] h-auto" />
                          </div>
                          <span className="text-[10px] font-mono text-neutral-400 mt-2">
                            Aperçu HD instantané • 300 DPI
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: ANALYTICS */}
                  {activeTab === "analytics" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            Analytics Avancés
                          </h3>
                          <p className="text-[11px] text-neutral-500">
                            Statistiques en temps réel distribuées sur les 300+ datacenters Edge.
                          </p>
                        </div>
                      </div>

                      {/* Live Event Feed */}
                      <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-2">
                          Flux d&apos;Événements en Direct
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[10px] border-collapse font-mono">
                            <thead>
                              <tr className="border-b border-[#E7DFD5] dark:border-white/10 text-neutral-400 uppercase text-[8.5px]">
                                <th className="pb-1.5">Temps</th>
                                <th className="pb-1.5">Lien</th>
                                <th className="pb-1.5">Localisation</th>
                                <th className="pb-1.5">Navigateur</th>
                                <th className="pb-1.5 text-right">Événement</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E7DFD5]/60 dark:divide-white/5">
                              {[
                                { time: "3s ago", slug: "launch-pro-2026", loc: "🇫🇷 Paris", dev: "Desktop Chrome", ev: "Edge Click 11ms" },
                                { time: "14s ago", slug: "launch-pro-2026", loc: "🇺🇸 New York", dev: "Mobile Safari", ev: "Conversion $49.00" },
                                { time: "32s ago", slug: "ebook-conversion", loc: "🇧🇫 Ouagadougou", dev: "Mobile Chrome", ev: "QR Code Click" },
                                { time: "1m ago", slug: "direction-finance", loc: "🇩🇪 Frankfurt", dev: "Desktop Edge", ev: "PIN Code Verified" },
                              ].map((ev, i) => (
                                <tr key={i} className="hover:bg-neutral-100/50 dark:hover:bg-white/5">
                                  <td className="py-1.5 text-neutral-400">{ev.time}</td>
                                  <td className="py-1.5 text-brand font-bold">/{ev.slug}</td>
                                  <td className="py-1.5 text-neutral-800 dark:text-neutral-200">{ev.loc}</td>
                                  <td className="py-1.5 text-neutral-500">{ev.dev}</td>
                                  <td className="py-1.5 text-right font-semibold text-emerald-500">{ev.ev}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </motion.div>

            {/* 2. SMARTPHONE FRAME (Disappears quickly to the right on scroll down) */}
            <motion.div
              style={{
                opacity: mobileOpacity,
                scale: mobileScale,
                x: mobileX,
                pointerEvents: isHeroActive ? "auto" : "none",
              }}
              className="hidden sm:flex relative w-[270px] lg:w-[290px] shrink-0 h-[440px] will-change-transform"
            >
              {/* Phone Container */}
              <div className="w-full h-full rounded-t-[34px] bg-[#E6DFD5] dark:bg-[#0c0c10] border-t-2 border-x-2 border-[#DDD1C4] dark:border-neutral-700 shadow-[0_25px_60px_-12px_rgba(43,37,32,0.28)] dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.92)] overflow-hidden flex flex-col p-2.5 transition-colors relative">
                {/* Dynamic Island */}
                <div className="w-full flex justify-center py-1.5">
                  <div className="w-20 h-4 rounded-full bg-[#2B2520] dark:bg-black border border-[#3E352F] dark:border-neutral-800 flex items-center justify-center">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#1A1613] dark:neutral-900 mr-2.5" />
                    <span className="w-2 h-2 rounded-full bg-[#0066FF]/50" />
                  </div>
                </div>

                {/* Mobile Screen */}
                <div className="flex-1 rounded-t-[24px] bg-[#FFFDF9] dark:bg-[#16161c] p-2.5 text-[11px] flex flex-col justify-between overflow-hidden select-none border-t border-[#E7DFD5] dark:border-white/10 transition-colors relative space-y-1.5">
                  <div className="flex items-center justify-between pt-0.5 border-b border-[#E7DFD5]/70 dark:border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-4 h-4 rounded bg-[#0066FF] flex items-center justify-center font-bold text-white text-[8px]">LS</span>
                      <span className="font-bebas text-sm font-bold text-[#0066FF] dark:text-[#38bdf8] tracking-wide">LShorter App</span>
                    </div>
                    <span className="text-[8.5px] text-emerald-500 font-mono font-bold bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">● Edge ON</span>
                  </div>

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

                  <div className="space-y-1.5 flex-1">
                    <div className="p-1.5 rounded-lg bg-white dark:bg-[#1e1e26] border border-[#E7DFD5] dark:border-white/10 shadow-xs space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[9.5px] font-bold text-neutral-900 dark:text-white truncate">SaaS Launch Campaign</span>
                        <span className="text-[7.5px] font-mono text-[#0066FF] dark:text-[#38bdf8] bg-blue-500/10 px-1 py-0.2 rounded font-semibold">A/B 50/50</span>
                      </div>
                      <span className="text-[9px] font-mono text-[#0066FF] dark:text-[#38bdf8] block truncate font-medium">lshorter.com/r/launch-pro</span>
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

                  <div className="h-8 border-t border-[#E7DFD5]/80 dark:border-white/10 flex items-center justify-around px-2 pt-1">
                    <span className="text-[8px] font-bold text-[#0066FF] dark:text-[#38bdf8] flex flex-col items-center">
                      <LayoutDashboard className="w-3 h-3" />
                      Dash
                    </span>
                    <span className="text-[8px] text-neutral-400 flex flex-col items-center">
                      <Link2 className="w-3 h-3" />
                      Links
                    </span>
                    <span className="text-[8px] text-neutral-400 flex flex-col items-center">
                      <QrCode className="w-3 h-3" />
                      QR
                    </span>
                    <span className="text-[8px] text-neutral-400 flex flex-col items-center">
                      <BarChart2 className="w-3 h-3" />
                      Stats
                    </span>
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
