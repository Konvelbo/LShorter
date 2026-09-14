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
  Home,
  BarChart3,
  Menu,
  Bell,
  Sun,
  Moon,
  FileText,
  HelpCircle,
  PanelLeftClose,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShinyText } from "@/components/ui/shiny-text";
import { TextType } from "@/components/ui/text-type";
import PlasmaWave from "./plasma-wave";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import confetti from "canvas-confetti";

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
  const heroGridOpacity = useTransform(smoothProgress, [0, 0.20], [1, 0]);

  // 1. Hero Text & CTAs (Phase 1: Fades out and glides up on initial scroll)
  const heroOpacity = useTransform(smoothProgress, [0, 0.20], [1, 0]);
  const heroY = useTransform(smoothProgress, [0, 0.20], [0, -80]);

  // 2. Mobile Phone Frame (Phase 1: Shares exact same 520px height, top alignment, 3D tilt as Desktop, collapses on scroll)
  const mobileOpacity = useTransform(smoothProgress, [0, 0.18], [1, 0]);
  const mobileX = useTransform(smoothProgress, [0, 0.18], [0, 50]);
  const mobileWidth = useTransform(smoothProgress, [0, 0.22], ["275px", "0px"]);
  const mobileMarginLeft = useTransform(smoothProgress, [0, 0.22], ["16px", "0px"]);

  // 3. Desktop Frame Transform:
  // Starts with 3D perspective tilt (rotateX: 14deg), scale 0.80, height 520px matching Mobile Frame exactly
  // Zooms smoothly with dramatic scale (0.80 -> 1.0), stands upright (14deg -> 0deg),
  // expands to full width (1152px / max-w-6xl) and 82vh height (max 860px, min 600px) in a 110vh stage
  const desktopScale = useTransform(smoothProgress, [0, 0.45], [0.80, 1.0]);
  const desktopRotateX = useTransform(smoothProgress, [0, 0.40], [14, 0]);
  const desktopWidth = useTransform(smoothProgress, [0.05, 0.45], ["820px", "1152px"]);
  const desktopHeight = useTransform(smoothProgress, [0.05, 0.45], ["520px", "82vh"]);
  const desktopMinHeight = useTransform(smoothProgress, [0.05, 0.45], ["520px", "600px"]);
  const desktopY = useTransform(smoothProgress, [0.05, 0.45], [0, -80]);

  // 4. Section 2 Header: Fades in between 0.35 and 0.50 once the frame arrives in Section 2
  const section2HeaderOpacity = useTransform(smoothProgress, [0.35, 0.50], [0, 1]);
  const section2HeaderY = useTransform(smoothProgress, [0.35, 0.50], [15, 0]);

  // Pointer events helper
  const [isHeroActive, setIsHeroActive] = useState(true);
  useEffect(() => {
    return smoothProgress.on("change", (v) => {
      setIsHeroActive(v < 0.25);
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
    activeTab,
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
      className="relative w-full h-[340vh] sm:h-[360vh] bg-[#FAF7F2] dark:bg-[#09090b] transition-colors duration-300 z-[1000]"
    >
      {/* Sticky Viewport Stage (Extended 110vh stage for Hero and Section 2, scrolls naturally into Section 3) */}
      <div className="sticky top-0 min-h-[110vh] h-[110vh] w-full overflow-hidden flex flex-col justify-between pt-6 sm:pt-8 pb-8 sm:pb-12 select-none z-[1000]">
        
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
          className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 text-center flex flex-col items-center pt-2 sm:pt-3 will-change-transform"
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
                className="w-full sm:w-auto h-9 sm:h-10 px-6 text-xs sm:text-sm font-medium rounded-full bg-[#0080ff] hover:bg-[#0070e0] sm:bg-[#ff6600] sm:hover:bg-[#ff771a] text-white border-none cursor-pointer shadow-md shadow-[#0080ff]/25 sm:shadow-[#ff6600]/25 transition-all hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-1.5"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </Button>
            </Link>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== "undefined") {
                  window.scrollTo({ top: window.innerHeight * 0.95, behavior: "smooth" });
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

        {/* ─── LAYER 2: SECTION 2 HEADER (Sleek, close gap to frame, perfectly balanced) ─── */}
        <motion.div
          style={{
            opacity: section2HeaderOpacity,
            y: section2HeaderY,
            pointerEvents: !isHeroActive ? "auto" : "none",
          }}
          className="absolute top-14 sm:top-18 md:top-22 inset-x-0 mx-auto max-w-3xl px-4 text-center z-20 will-change-transform"
        >
          <h2 className="text-xl sm:text-2xl md:text-[28px] font-bold tracking-tight text-[#2B2520] dark:text-white leading-snug">
            Experience the Power of LShorter in Action
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 font-normal max-w-xl mx-auto">
            An intuitive dashboard engineered to manage your Edge redirects, routing rules, and real-time metrics.
          </p>
        </motion.div>

        {/* ─── LAYER 3: CENTRAL DUAL-STAGE FRAME AREA (Docked in Hero, expands in Section 2 with bottom clearance) ─── */}
        <div className="relative z-10 w-full max-w-6xl mx-auto px-3 sm:px-6 flex flex-col justify-end mt-auto mb-6 sm:mb-10">
          
          <div className="w-full flex items-start justify-center">
            
            {/* 1. THE SINGLE DESKTOP FRAME (Starts at 820px/520px tilted in Hero, smoothly zooms and expands to full width & 82vh) */}
            <motion.div
              style={{
                width: desktopWidth,
                maxWidth: "100%",
                height: desktopHeight,
                minHeight: desktopMinHeight,
                maxHeight: "860px",
                scale: desktopScale,
                rotateX: desktopRotateX,
                transformPerspective: 1200,
                transformOrigin: "center top",
                y: desktopY,
              }}
              className="relative z-[1000] rounded-2xl bg-[#FFFDF9] dark:bg-[#121216] border border-[#E7DFD5] dark:border-white/15 shadow-[0_25px_60px_-15px_rgba(43,37,32,0.25),0_12px_28px_-6px_rgba(0,0,0,0.15)] dark:shadow-[0_30px_70px_-10px_rgba(0,0,0,0.92),0_15px_35px_-5px_rgba(0,0,0,0.85)] overflow-hidden flex flex-col transition-colors will-change-transform shrink-0"
            >
              {/* Dedicated individual bottom shadows */}
              <div className="absolute -bottom-5 inset-x-8 h-10 bg-neutral-900/35 dark:bg-black/95 blur-xl rounded-full pointer-events-none -z-10" />

              {/* Realistic Browser Chrome Bar */}
              <div className="h-10 bg-[#F2ECE4] dark:bg-[#18181d] border-b border-[#E7DFD5] dark:border-white/10 px-4 flex items-center justify-between select-none shrink-0 z-20">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex items-center gap-2 px-3.5 py-1 rounded-md bg-white dark:bg-[#0f0f13] border border-[#E7DFD5] dark:border-white/10 text-[11px] font-mono text-neutral-600 dark:text-neutral-300 w-3/5 max-w-sm justify-center">
                  <span className="text-emerald-500 font-bold">https://</span>
                  <span className="font-semibold text-neutral-900 dark:text-neutral-100">lshorter.com</span>
                  <span className="text-[#ff6600] font-semibold">/dashboard/{activeTab === "qr" ? "qr-code" : activeTab}</span>
                </div>
                <div className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="hidden md:inline font-bold">Edge Cloudflare 11ms</span>
                </div>
              </div>

              {/* 1. Full-width Topbar across the entire top (No bottom border, exact replica of dashboard topbar) */}
              <div className="h-11 sm:h-12 bg-[#FAF7F2] dark:bg-[#09090b] px-3.5 sm:px-5 flex items-center justify-between shrink-0 select-none z-10 border-b-0">
                {/* Left: Brand + DASHBOARD badge */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-6.5 h-6.5 rounded-[7px] bg-[#ff6600] flex items-center justify-center font-bebas text-sm font-black text-white shadow-md shadow-[#ff6600]/30 shrink-0">
                    LS
                  </div>
                  <span className="font-bebas text-base sm:text-lg tracking-wider text-neutral-900 dark:text-white leading-none">
                    L <span className="text-[#ff6600]">SHORTER</span>
                  </span>
                  <span className="ml-2 pl-2.5 border-l border-neutral-300 dark:border-neutral-800 text-[9.5px] font-bold tracking-widest text-[#ff6600] uppercase font-mono hidden sm:inline">
                    DASHBOARD
                  </span>
                </div>

                {/* Right: Theme Toggle + Bell + User Profile Pill (LUCKY-MAN) */}
                <div className="flex items-center gap-2 sm:gap-2.5">
                  <div className="w-6.5 h-6.5 rounded-[7px] bg-black/5 dark:bg-white/5 text-amber-500 flex items-center justify-center cursor-pointer">
                    <Sun className="w-3 h-3" />
                  </div>
                  <div className="w-6.5 h-6.5 rounded-[7px] bg-black/5 dark:bg-white/5 text-neutral-400 flex items-center justify-center cursor-pointer relative">
                    <Bell className="w-3 h-3" />
                    <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#ff6600] rounded-full" />
                  </div>
                  <div className="flex items-center gap-2 pl-2 pr-3 py-1 rounded-[10px] bg-black/5 dark:bg-[#141416] border border-black/5 dark:border-[#27272a] shadow-xs">
                    <div className="w-6 h-6 rounded-[7px] bg-[#ff6600]/20 border border-[#ff6600]/40 text-[#ff6600] font-bold text-[10px] flex items-center justify-center shrink-0">
                      LM
                    </div>
                    <div className="flex flex-col text-left justify-center">
                      <span className="text-[11px] font-bold text-neutral-900 dark:text-white tracking-tight leading-tight">
                        LUCKY-MAN
                      </span>
                      <span className="text-[8px] font-extrabold text-[#ff6600] font-mono tracking-wider leading-none mt-0.5">
                        PRO PLAN
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Content Row: Sidebar on Left (No border) + Canvas with md:rounded-tl-[26px] on Right */}
              <div className="flex-1 flex flex-row overflow-hidden min-h-0 bg-[#FAF7F2] dark:bg-[#09090b]">
                
                {/* Authentic Sidebar (No right border) */}
                <div className="w-44 lg:w-48 p-2.5 bg-[#FAF7F2] dark:bg-[#09090b] flex flex-col justify-between shrink-0 select-none overflow-y-auto">
                  <div className="flex flex-col gap-1 w-full">
                    {/* Main Menu Label + Collapse */}
                    <div className="flex items-center justify-between px-1 mb-0.5">
                      <span className="text-[8.5px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 font-mono">
                        MAIN MENU
                      </span>
                      <PanelLeftClose className="w-3 h-3 text-neutral-400 dark:text-neutral-500" />
                    </div>

                    {/* Create Link Button */}
                    <button
                      type="button"
                      onClick={() => setActiveTab("links")}
                      className="w-full h-8 rounded-[10px] bg-[#ff6600] hover:bg-[#ff771a] text-white font-bold flex items-center justify-center text-xs gap-1.5 shadow-md shadow-[#ff6600]/30 transition-all cursor-pointer mb-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[3]" />
                      <span className="font-bebas text-xs tracking-wide">CREATE A LINK</span>
                    </button>

                    <span className="px-2 text-[8px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mb-0.5">
                      MENU
                    </span>

                    {/* Navigation Items */}
                    <button
                      type="button"
                      onClick={() => setActiveTab("overview")}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === "overview"
                          ? "bg-[#ff6600] text-white shadow-xs font-semibold"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                      <span>Overview</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("links")}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === "links"
                          ? "bg-[#ff6600] text-white shadow-xs font-semibold"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <Link2 className="w-3.5 h-3.5 shrink-0" />
                      <span>My Links</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("qr")}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === "qr"
                          ? "bg-[#ff6600] text-white shadow-xs font-semibold"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <QrCode className="w-3.5 h-3.5 shrink-0" />
                      <span>QR Codes</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveTab("analytics")}
                      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                        activeTab === "analytics"
                          ? "bg-[#ff6600] text-white shadow-xs font-semibold"
                          : "text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5"
                      }`}
                    >
                      <BarChart2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Analytics</span>
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Globe2 className="w-3.5 h-3.5 shrink-0" />
                      <span>Domains</span>
                    </button>

                    <span className="px-2 text-[8px] font-bold uppercase tracking-widest text-neutral-400 dark:text-neutral-500 mt-1.5 mb-0.5">
                      ACCOUNT
                    </span>

                    <button
                      type="button"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <KeyRound className="w-3.5 h-3.5 shrink-0" />
                      <span>API &amp; SDK</span>
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <Settings className="w-3.5 h-3.5 shrink-0" />
                      <span>Settings</span>
                    </button>

                    <button
                      type="button"
                      className="flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span>Documentation</span>
                    </button>
                  </div>

                  {/* Sidebar Bottom Quota Box + Feedback */}
                  <div className="flex flex-col gap-1.5 pt-2 border-t border-[#E7DFD5] dark:border-[#222225]/80 mt-1">
                    <div className="p-2 rounded-[9px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#27272a] text-xs shadow-xs">
                      <div className="flex items-center justify-between text-[9px] text-neutral-500 mb-1">
                        <span className="font-bold text-[#ff6600]">PRO PLAN</span>
                        <span className="font-mono text-neutral-900 dark:text-white">128.4K / 1M</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                        <div className="w-[32%] h-full bg-[#ff6600] rounded-full" />
                      </div>
                      <div className="flex items-center justify-between text-[7.5px] text-neutral-400 mt-1">
                        <span>Clicks this month</span>
                        <span className="text-emerald-400 font-bold">Edge Live</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 px-1 text-[9.5px] text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer">
                      <HelpCircle className="w-3 h-3" />
                      <span>Help &amp; Feedback</span>
                    </div>
                  </div>
                </div>

                {/* 3. Central Framed Canvas with Rounded Top-Left (Exact signature app layout!) */}
                <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#FAF7F2] dark:bg-[#09090b]">
                  <main className="h-full w-full bg-[#FFFDF9] dark:bg-[#121215] md:rounded-tl-[24px] overflow-y-auto shadow-2xl p-3.5 sm:p-5 lg:p-6 flex flex-col gap-3.5">
                  
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
                            <RefreshCw className={`w-3 h-3 ${isRefreshingOverview ? "animate-spin text-[#ff6600]" : ""}`} />
                            <span>Refresh</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setActiveTab("links")}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-[8px] bg-[#ff6600] hover:bg-[#ff771a] text-white text-[11px] font-bold shadow-xs transition-colors cursor-pointer"
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
                            <span className="font-bebas text-2xl sm:text-3xl font-bold text-[#ff6600]">
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
                            <span className="text-[10px] font-mono font-bold text-[#ff6600] bg-[#ff6600]/10 px-2 py-0.5 rounded">
                              128.4K clicks
                            </span>
                          </div>

                          {/* Bar Histogram */}
                          <div className="h-32 sm:h-36 flex items-end justify-between gap-1 pt-3 pb-1">
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
                                  <div
                                    style={{ height: `${heightPct}%` }}
                                    className={`w-full rounded-t-sm transition-all duration-200 ${
                                      isHovered
                                        ? "bg-emerald-500 shadow-md shadow-emerald-500/30"
                                        : "bg-[#ff6600] hover:bg-[#ff771a]"
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
                                className="text-[10px] text-[#ff6600] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
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
                              ].map((c) => (
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
                                    <div style={{ width: `${c.pct}%` }} className="h-full bg-[#ff6600] rounded-full" />
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
                            className="text-[10px] text-[#ff6600] font-bold hover:underline cursor-pointer flex items-center gap-0.5"
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
                                  <td className="py-1.5 font-mono text-[#ff6600] font-semibold truncate max-w-[130px]">
                                    {link.shortUrl}
                                  </td>
                                  <td className="py-1.5 text-center">
                                    <div className="flex items-center justify-center gap-1 text-neutral-400">
                                      {link.features.ab && <span title="A/B Routing"><Split className="w-2.5 h-2.5 text-[#ff6600]" /></span>}
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
                                      className="px-2 py-0.5 rounded bg-neutral-100 dark:bg-white/10 hover:bg-[#ff6600] hover:text-white text-[8.5px] font-bold transition-colors cursor-pointer"
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

                  {/* TAB 2: MY LINKS */}
                  {activeTab === "links" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            My Links &amp; Routing
                          </h3>
                          <p className="text-[11px] text-neutral-500">
                            Manage your shortened links, geo-routing rules, and PIN code security.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#ff6600] hover:bg-[#ff771a] text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>New Link</span>
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
                            placeholder="Search by slug, target URL, tag..."
                            className="w-full pl-7 pr-2 py-1 text-xs rounded-lg bg-white dark:bg-[#0c0c10] border border-[#E7DFD5] dark:border-white/10 outline-none text-neutral-900 dark:text-white"
                          />
                        </div>
                        <select
                          value={statusFilter}
                          onChange={(e) => setStatusFilter(e.target.value)}
                          className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-[#0c0c10] border border-[#E7DFD5] dark:border-white/10 outline-none text-neutral-700 dark:text-neutral-300"
                        >
                          <option value="all">All Statuses</option>
                          <option value="protected">PIN Protected</option>
                        </select>
                      </div>

                      {/* Links List Cards */}
                      <div className="space-y-2">
                        {filteredLinks.map((link) => (
                          <div
                            key={link.id}
                            className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:border-[#ff6600]/50 transition-all"
                          >
                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-neutral-900 dark:text-white">
                                  /{link.slug}
                                </span>
                                <span className="text-[9px] font-mono text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                  ● Active
                                </span>
                                {link.features.lock && (
                                  <span className="text-[8.5px] font-mono text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded border border-amber-500/20">
                                    🔒 PIN Locked
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] font-mono text-[#ff6600] font-semibold block truncate">
                                {link.shortUrl}
                              </span>
                              <span className="text-[9.5px] text-neutral-400 truncate block">
                                Target: {link.targetUrl}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="text-right font-mono pr-2">
                                <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                                  {link.clicks.toLocaleString()}
                                </span>
                                <span className="text-[9px] text-neutral-400">clicks</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopy(link.shortUrl, link.slug)}
                                className="px-2.5 py-1 rounded-lg bg-[#ff6600] hover:bg-[#ff771a] text-white text-xs font-bold cursor-pointer transition-all"
                              >
                                {copiedSlug === link.slug ? "Copied!" : "Copy"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Links Fleet Summary footer */}
                      <div className="grid grid-cols-3 gap-2.5 pt-2">
                        <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 text-center">
                          <span className="text-[9px] text-neutral-400 block font-mono uppercase">Total Links</span>
                          <span className="text-base font-bold text-neutral-900 dark:text-white font-mono">1,420</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 text-center">
                          <span className="text-[9px] text-neutral-400 block font-mono uppercase">Avg. Uptime</span>
                          <span className="text-base font-bold text-emerald-500 font-mono">99.99%</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 text-center">
                          <span className="text-[9px] text-neutral-400 block font-mono uppercase">Edge Cache</span>
                          <span className="text-base font-bold text-[#ff6600] font-mono">100% Active</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: QR CODE STUDIO */}
                  {activeTab === "qr" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            QR Code Studio HD
                          </h3>
                          <p className="text-[11px] text-neutral-500">
                            Generate high-definition vector QR codes tailored to your brand identity.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleDownloadQR}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] bg-[#ff6600] hover:bg-[#ff771a] text-white text-xs font-bold shadow-md cursor-pointer transition-all"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PNG</span>
                          </button>
                        </div>
                      </div>

                      {/* Preset selector */}
                      <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 flex flex-wrap items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 font-mono mr-1">
                          Link Preset:
                        </span>
                        {mockLinks.map((link) => (
                          <button
                            key={link.id}
                            type="button"
                            onClick={() => {
                              setSelectedPresetSlug(link.slug);
                              setQrWebsiteUrl(link.shortUrl);
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer border ${
                              selectedPresetSlug === link.slug
                                ? "bg-[#ff6600] text-white border-[#ff6600] shadow-xs"
                                : "bg-white dark:bg-[#141416] border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-[#ff6600]/40"
                            }`}
                          >
                            /{link.slug}
                          </button>
                        ))}
                      </div>

                      {/* Studio Main Grid: Controls + Live Canvas */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        {/* Customization controls (7 cols) */}
                        <div className="md:col-span-7 p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 space-y-3.5">
                          {/* Pixel Style */}
                          <div>
                            <label className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 block mb-1.5 font-mono">
                              Pixel Pattern
                            </label>
                            <div className="grid grid-cols-4 gap-1.5">
                              {(["rounded", "dots", "diamond", "square"] as const).map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => setQrPixelStyle(st)}
                                  className={`py-1.5 text-[11px] font-medium rounded-lg capitalize cursor-pointer border transition-all ${
                                    qrPixelStyle === st
                                      ? "bg-[#ff6600] text-white border-[#ff6600] shadow-xs"
                                      : "bg-white dark:bg-[#141416] border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-[#ff6600]/30"
                                  }`}
                                >
                                  {st}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Brand Color */}
                          <div>
                            <label className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 block mb-1.5 font-mono">
                              Brand Color
                            </label>
                            <div className="flex items-center gap-2.5">
                              {[
                                { color: "#ff6600", label: "Orange" },
                                { color: "#0066FF", label: "Blue" },
                                { color: "#10b981", label: "Emerald" },
                                { color: "#8b5cf6", label: "Purple" },
                                { color: "#000000", label: "Black" },
                              ].map((c) => (
                                <button
                                  key={c.color}
                                  type="button"
                                  title={c.label}
                                  onClick={() => {
                                    setQrPixelColor(c.color);
                                    setQrFrameColor(c.color);
                                  }}
                                  style={{ backgroundColor: c.color }}
                                  className={`w-7 h-7 rounded-full cursor-pointer transition-transform border-2 border-white dark:border-[#202025] ${
                                    qrPixelColor === c.color ? "scale-115 ring-2 ring-offset-2 ring-[#ff6600]" : "hover:scale-105"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>

                          {/* Frame & CTA */}
                          <div>
                            <label className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 block mb-1.5 font-mono">
                              Frame &amp; CTA Badge
                            </label>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                              {[
                                { id: "bottom_pill", label: "Bottom Pill" },
                                { id: "top_header", label: "Top Header" },
                                { id: "simple", label: "Simple Border" },
                                { id: "none", label: "None" },
                              ].map((fr) => (
                                <button
                                  key={fr.id}
                                  type="button"
                                  onClick={() => setQrFrame(fr.id as any)}
                                  className={`py-1.5 text-[10.5px] font-medium rounded-lg cursor-pointer border transition-all ${
                                    qrFrame === fr.id
                                      ? "bg-[#ff6600] text-white border-[#ff6600] shadow-xs"
                                      : "bg-white dark:bg-[#141416] border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300 hover:border-[#ff6600]/30"
                                  }`}
                                >
                                  {fr.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Center Brand Logo */}
                          <div>
                            <label className="text-[10px] font-bold uppercase text-neutral-500 dark:text-neutral-400 block mb-1.5 font-mono">
                              Center Logo
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setQrLogo("ql")}
                                className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border flex items-center justify-center gap-1.5 ${
                                  qrLogo === "ql"
                                    ? "bg-[#ff6600] text-white border-[#ff6600]"
                                    : "bg-white dark:bg-[#141416] border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300"
                                }`}
                              >
                                <span className="w-4 h-4 rounded bg-[#ff6600] text-white font-bebas text-[10px] flex items-center justify-center">LS</span>
                                <span>LS Badge</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => setQrLogo("none")}
                                className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                                  qrLogo === "none"
                                    ? "bg-[#ff6600] text-white border-[#ff6600]"
                                    : "bg-white dark:bg-[#141416] border-neutral-300 dark:border-white/10 text-neutral-700 dark:text-neutral-300"
                                }`}
                              >
                                None
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Canvas Live Preview (5 cols) */}
                        <div className="md:col-span-5 p-4 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 flex flex-col items-center justify-center text-center">
                          <div className="p-3 bg-white rounded-2xl shadow-xl border border-neutral-200/80 flex items-center justify-center">
                            <canvas ref={qrCanvasRef} className="max-w-[190px] h-auto block rounded-lg" />
                          </div>
                          <div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-emerald-500">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span>⚡ 300 DPI Vector HD Ready</span>
                          </div>
                          <span className="text-[10px] font-mono text-neutral-400 mt-0.5">
                            Target: {qrWebsiteUrl}
                          </span>
                        </div>
                      </div>

                      {/* QR Analytics & Live Scans Feed to fill canvas */}
                      <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10 space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-neutral-900 dark:text-white">
                            QR Performance &amp; Live Scans Feed
                          </h4>
                          <span className="text-[9.5px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded">
                            ● 42,850 Total Scans
                          </span>
                        </div>

                        {/* 4 Mini Stat Pills */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <div className="p-2 rounded-lg bg-white dark:bg-[#121215] border border-neutral-200 dark:border-white/5">
                            <span className="text-[9px] text-neutral-400 block font-mono">Scan Rate</span>
                            <span className="text-sm font-bold text-neutral-900 dark:text-white font-mono">+22.4%</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-[#121215] border border-neutral-200 dark:border-white/5">
                            <span className="text-[9px] text-neutral-400 block font-mono">Mobile Ratio</span>
                            <span className="text-sm font-bold text-neutral-900 dark:text-white font-mono">89.2%</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-[#121215] border border-neutral-200 dark:border-white/5">
                            <span className="text-[9px] text-neutral-400 block font-mono">Top Region</span>
                            <span className="text-sm font-bold text-[#ff6600] font-mono">🇫🇷 France</span>
                          </div>
                          <div className="p-2 rounded-lg bg-white dark:bg-[#121215] border border-neutral-200 dark:border-white/5">
                            <span className="text-[9px] text-neutral-400 block font-mono">ECC Level</span>
                            <span className="text-sm font-bold text-emerald-500 font-mono">Level H (30%)</span>
                          </div>
                        </div>

                        {/* Recent Scans Table */}
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[10px] border-collapse font-mono">
                            <thead>
                              <tr className="border-b border-[#E7DFD5] dark:border-white/10 text-neutral-400 uppercase text-[8.5px]">
                                <th className="pb-1.5">Time</th>
                                <th className="pb-1.5">Preset Link</th>
                                <th className="pb-1.5">Scanner Location</th>
                                <th className="pb-1.5">Device</th>
                                <th className="pb-1.5 text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E7DFD5]/60 dark:divide-white/5">
                              {[
                                { time: "4s ago", slug: "launch-pro-2026", loc: "🇫🇷 Paris", dev: "iPhone 15 Pro", st: "Redirected 8ms" },
                                { time: "28s ago", slug: "ebook-conversion", loc: "🇺🇸 New York", dev: "Galaxy S24", st: "Redirected 12ms" },
                                { time: "1m ago", slug: "direction-finance", loc: "🇩🇪 Frankfurt", dev: "iPad Air", st: "PIN Verified" },
                              ].map((sc, i) => (
                                <tr key={i} className="hover:bg-neutral-100/50 dark:hover:bg-white/5">
                                  <td className="py-1.5 text-neutral-400">{sc.time}</td>
                                  <td className="py-1.5 text-[#ff6600] font-bold">/{sc.slug}</td>
                                  <td className="py-1.5 text-neutral-800 dark:text-neutral-200">{sc.loc}</td>
                                  <td className="py-1.5 text-neutral-500">{sc.dev}</td>
                                  <td className="py-1.5 text-right font-semibold text-emerald-500">{sc.st}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 4: ANALYTICS */}
                  {activeTab === "analytics" && (
                    <div className="space-y-4 animate-in fade-in duration-200">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <h3 className="text-lg font-bold text-neutral-900 dark:text-white">
                            Advanced Edge Analytics
                          </h3>
                          <p className="text-[11px] text-neutral-500">
                            Real-time traffic distributed across 300+ global Cloudflare Edge datacenters.
                          </p>
                        </div>
                        <span className="text-[10px] font-mono font-bold text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                          ⚡ Edge Latency: 11ms
                        </span>
                      </div>

                      {/* 4 KPI Cards */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10">
                          <span className="text-[9.5px] text-neutral-400 block font-mono">Total Edge Traffic</span>
                          <span className="text-xl font-bold text-neutral-900 dark:text-white font-mono">128.4K</span>
                          <span className="text-[9px] text-emerald-500 font-mono block mt-0.5">+14.2% this week</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10">
                          <span className="text-[9.5px] text-neutral-400 block font-mono">Avg. Global Latency</span>
                          <span className="text-xl font-bold text-emerald-500 font-mono">11ms</span>
                          <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">300+ PoPs</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10">
                          <span className="text-[9.5px] text-neutral-400 block font-mono">Mobile Share</span>
                          <span className="text-xl font-bold text-[#ff6600] font-mono">68.4%</span>
                          <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">iOS &amp; Android</span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10">
                          <span className="text-[9.5px] text-neutral-400 block font-mono">Bot Filtering</span>
                          <span className="text-xl font-bold text-purple-500 font-mono">100%</span>
                          <span className="text-[9px] text-neutral-400 font-mono block mt-0.5">Human traffic verified</span>
                        </div>
                      </div>

                      {/* Live Event Feed */}
                      <div className="p-3.5 rounded-xl bg-[#FAF7F2] dark:bg-[#18181d] border border-[#E7DFD5] dark:border-white/10">
                        <h4 className="text-xs font-bold text-neutral-900 dark:text-white mb-2">
                          Live Global Event Stream
                        </h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-[10px] border-collapse font-mono">
                            <thead>
                              <tr className="border-b border-[#E7DFD5] dark:border-white/10 text-neutral-400 uppercase text-[8.5px]">
                                <th className="pb-1.5">Timestamp</th>
                                <th className="pb-1.5">Link Slug</th>
                                <th className="pb-1.5">Location</th>
                                <th className="pb-1.5">Device &amp; Browser</th>
                                <th className="pb-1.5 text-right">Event &amp; Speed</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E7DFD5]/60 dark:divide-white/5">
                              {[
                                { time: "3s ago", slug: "launch-pro-2026", loc: "🇫🇷 Paris", dev: "Desktop Chrome", ev: "Edge Click 11ms" },
                                { time: "14s ago", slug: "launch-pro-2026", loc: "🇺🇸 New York", dev: "Mobile Safari", ev: "Conversion $49.00" },
                                { time: "32s ago", slug: "ebook-conversion", loc: "🇧🇫 Ouagadougou", dev: "Mobile Chrome", ev: "QR Code Click" },
                                { time: "1m ago", slug: "direction-finance", loc: "🇩🇪 Frankfurt", dev: "Desktop Edge", ev: "PIN Code Verified" },
                                { time: "2m ago", slug: "launch-pro-2026", loc: "🇯🇵 Tokyo", dev: "Mobile Chrome", ev: "Edge Click 14ms" },
                              ].map((ev, i) => (
                                <tr key={i} className="hover:bg-neutral-100/50 dark:hover:bg-white/5">
                                  <td className="py-1.5 text-neutral-400">{ev.time}</td>
                                  <td className="py-1.5 text-[#ff6600] font-bold">/{ev.slug}</td>
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
                          <span className="text-[9px] font-mono font-bold tracking-tighter">5G</span>
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
                        <span className="text-[9.5px] text-neutral-400 font-mono pl-1 truncate">https://my-domain.com/...</span>
                        <span className="px-2.5 py-1 rounded-lg bg-[#0066FF] hover:bg-[#0055d4] text-white text-[9px] font-bold shrink-0 shadow-sm shadow-[#0066FF]/35">
                          Shorten
                        </span>
                      </div>

                      {/* 2 KPI Metrics */}
                      <div className="grid grid-cols-2 gap-1.5 shrink-0">
                        <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0d121f] border border-[#E7DFD5] dark:border-[#1e2942] shadow-xs">
                          <span className="text-[8.5px] text-neutral-500 dark:text-neutral-400 block font-medium">Total Clicks</span>
                          <div className="flex items-baseline justify-between mt-0.5">
                            <span className="font-bebas text-lg font-bold text-[#0066FF] dark:text-[#38bdf8]">128,420</span>
                            <span className="text-[8px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded">+14.2%</span>
                          </div>
                        </div>
                        <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0d121f] border border-[#E7DFD5] dark:border-[#1e2942] shadow-xs">
                          <span className="text-[8.5px] text-neutral-500 dark:text-neutral-400 block font-medium">Revenue</span>
                          <div className="flex items-baseline justify-between mt-0.5">
                            <span className="font-bebas text-lg font-bold text-neutral-900 dark:text-white">$2,450</span>
                            <span className="text-[8px] font-mono text-emerald-400 font-bold bg-emerald-500/10 px-1 py-0.2 rounded">3.4%</span>
                          </div>
                        </div>
                      </div>

                      {/* 3 Live Redirect Link Cards */}
                      <div className="space-y-1.5 shrink-0">
                        {/* Link 1 */}
                        <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0d121f] border border-[#E7DFD5] dark:border-[#1e2942] shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-neutral-900 dark:text-white truncate">/launch-pro-2026</span>
                            <span className="text-[7.5px] font-mono text-[#38bdf8] bg-[#0066FF]/15 border border-[#0066FF]/30 px-1.5 py-0.2 rounded font-bold">A/B 50/50</span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] font-mono text-neutral-500 dark:text-neutral-400">
                            <span className="text-emerald-400 font-bold">84.2K clicks</span>
                            <span>Active Edge</span>
                          </div>
                        </div>

                        {/* Link 2 */}
                        <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0d121f] border border-[#E7DFD5] dark:border-[#1e2942] shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-neutral-900 dark:text-white truncate">/ebook-conversion</span>
                            <span className="text-[7.5px] font-mono text-cyan-400 bg-cyan-500/15 border border-cyan-500/30 px-1.5 py-0.2 rounded font-bold">GEO ROUTE</span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] font-mono text-neutral-500 dark:text-neutral-400">
                            <span className="text-emerald-400 font-bold">31.2K clicks</span>
                            <span>FR • US • BF</span>
                          </div>
                        </div>

                        {/* Link 3 */}
                        <div className="p-2 rounded-xl bg-[#FAF7F2] dark:bg-[#0d121f] border border-[#E7DFD5] dark:border-[#1e2942] shadow-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-[9.5px] font-bold text-neutral-900 dark:text-white truncate">/direction-finance</span>
                            <span className="text-[7.5px] font-mono text-amber-400 bg-amber-500/15 border border-amber-500/30 px-1.5 py-0.2 rounded font-bold">PIN 8492</span>
                          </div>
                          <div className="flex items-center justify-between text-[8px] font-mono text-neutral-500 dark:text-neutral-400">
                            <span className="text-emerald-400 font-bold">13.0K clicks</span>
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
