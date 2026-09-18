"use client";

import React, { useState, useRef, useEffect } from "react";
import QRCode from "qrcode";
import {
  LayoutDashboard,
  Link2,
  QrCode,
  BarChart2,
  Copy,
  Check,
  Plus,
  ArrowUpRight,
  ExternalLink,
  Shield,
  Sliders,
  Globe,
  Globe2,
  Share2,
  Smartphone,
  Monitor,
  Sparkles,
  TrendingUp,
  Download,
  Filter,
  Search,
  RefreshCw,
  Edit3,
  Trash2,
  Split,
  Lock,
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
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { AnimatedBar } from "@/components/ui/animated-bar";
import confetti from "canvas-confetti";

export function InteractiveDemoSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // Framer Motion Parallax & Scale Animation on Scroll
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "center center"],
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 80,
    damping: 22,
    restDelta: 0.001,
  });

  const scale = useTransform(smoothProgress, [0, 0.75], [0.82, 1]);
  const rotateX = useTransform(smoothProgress, [0, 0.7], [12, 0]);
  const y = useTransform(smoothProgress, [0, 0.75], [90, 0]);
  const opacity = useTransform(smoothProgress, [0, 0.35, 0.75], [0.35, 0.85, 1]);
  const headerY = useTransform(smoothProgress, [0.55, 0.92], [35, 0]);
  const headerOpacity = useTransform(smoothProgress, [0.55, 0.92], [0, 1]);

  // Active Navigation Tab inside the Demo Frame
  const [activeTab, setActiveTab] = useState<"overview" | "links" | "qr" | "analytics">("overview");

  // Global Copied state
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // Overview states
  const [isRefreshingOverview, setIsRefreshingOverview] = useState(false);
  const [hoveredBarIndex, setHoveredBarIndex] = useState<number | null>(null);

  // Links Tab states
  const [filterQuery, setFilterQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");

  // QR Studio Customization States (Identical to components/qr/qr-generator.tsx)
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

  // Mock Links Dataset matching the live SaaS Cloudflare D1 storage
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

  // 30-Day Click Histogram Data for Overview & Analytics
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

  // Update QR link from preset
  const handlePresetChange = (slug: string) => {
    setSelectedPresetSlug(slug);
    const link = mockLinks.find((l) => l.slug === slug);
    if (link) {
      setQrWebsiteUrl(link.shortUrl);
    }
  };

  // ─── AUTHENTIC QR CODE CANVAS RENDERING (100% Identical to QRGenerator) ───
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

      const qrDrawSize = qrSize;
      const totalWidth = qrDrawSize + padding * 2;
      const totalHeight = qrDrawSize + frameTopPadding + frameBottomPadding;

      canvas.width = totalWidth * 2;
      canvas.height = totalHeight * 2;
      canvas.style.width = `${totalWidth}px`;
      canvas.style.height = `${totalHeight}px`;
      ctx.scale(2, 2);

      // 1. Draw Canvas Background
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.roundRect(0, 0, totalWidth, totalHeight, 16);
      ctx.fill();

      // 2. Draw Frame Decoration
      if (qrFrame === "simple") {
        ctx.strokeStyle = qrFrameColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(4, 4, totalWidth - 8, totalHeight - 8, 14);
        ctx.stroke();
      } else if (qrFrame === "neon") {
        ctx.shadowColor = qrFrameColor;
        ctx.shadowBlur = 12;
        ctx.strokeStyle = qrFrameColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.roundRect(6, 6, totalWidth - 12, totalHeight - 12, 14);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else if (qrFrame === "bottom_pill") {
        ctx.strokeStyle = qrFrameColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(4, 4, totalWidth - 8, totalHeight - 8, 16);
        ctx.stroke();

        ctx.fillStyle = qrFrameColor;
        ctx.beginPath();
        ctx.roundRect(totalWidth * 0.16, totalHeight - 38, totalWidth * 0.68, 28, 9);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(qrFrameText.toUpperCase(), totalWidth / 2, totalHeight - 24);
      } else if (qrFrame === "top_header") {
        ctx.strokeStyle = qrFrameColor;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.roundRect(4, 4, totalWidth - 8, totalHeight - 8, 16);
        ctx.stroke();

        ctx.fillStyle = qrFrameColor;
        ctx.beginPath();
        ctx.roundRect(totalWidth * 0.16, 8, totalWidth * 0.68, 28, 8);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 11px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(qrFrameText.toUpperCase(), totalWidth / 2, 22);
      } else if (qrFrame === "modern_badge") {
        ctx.strokeStyle = "#27272a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(4, 4, totalWidth - 8, totalHeight - 8, 16);
        ctx.stroke();

        ctx.fillStyle = qrFrameColor;
        ctx.beginPath();
        ctx.roundRect(totalWidth * 0.2, totalHeight - 38, totalWidth * 0.6, 26, 13);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 10px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(`★ ${qrFrameText} ★`, totalWidth / 2, totalHeight - 25);
      }

      // 3. Draw QR Matrix Modules
      const cellSize = qrDrawSize / moduleCount;
      const startX = padding;
      const startY = frameTopPadding;

      const isFinderEye = (r: number, c: number) => {
        if (r < 7 && c < 7) return true;
        if (r < 7 && c >= moduleCount - 7) return true;
        if (r >= moduleCount - 7 && c < 7) return true;
        return false;
      };

      const centerCutoutRadius = qrLogo !== "none" ? Math.floor(moduleCount * 0.16) : 0;
      const centerMid = Math.floor(moduleCount / 2);
      const isCenterLogoArea = (r: number, c: number) => {
        if (qrLogo === "none") return false;
        return (
          Math.abs(r - centerMid) <= centerCutoutRadius &&
          Math.abs(c - centerMid) <= centerCutoutRadius
        );
      };

      let fillStyle: string | CanvasGradient = qrPixelColor;
      if (qrColorMode === "gradient") {
        const grad = ctx.createLinearGradient(startX, startY, startX + qrDrawSize, startY + qrDrawSize);
        grad.addColorStop(0, qrPixelColor);
        grad.addColorStop(1, qrPixelColor2);
        fillStyle = grad;
      }

      for (let r = 0; r < moduleCount; r++) {
        for (let c = 0; c < moduleCount; c++) {
          if (isFinderEye(r, c) || isCenterLogoArea(r, c)) continue;

          if (qr.modules.get(r, c)) {
            ctx.fillStyle = fillStyle;
            const x = startX + c * cellSize;
            const y = startY + r * cellSize;

            if (qrPixelStyle === "square") {
              ctx.fillRect(x, y, cellSize, cellSize);
            } else if (qrPixelStyle === "rounded") {
              ctx.beginPath();
              ctx.roundRect(x + 0.4, y + 0.4, cellSize - 0.8, cellSize - 0.8, cellSize * 0.35);
              ctx.fill();
            } else if (qrPixelStyle === "dots") {
              ctx.beginPath();
              ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.42, 0, Math.PI * 2);
              ctx.fill();
            } else if (qrPixelStyle === "diamond") {
              ctx.beginPath();
              ctx.moveTo(x + cellSize / 2, y);
              ctx.lineTo(x + cellSize, y + cellSize / 2);
              ctx.lineTo(x + cellSize / 2, y + cellSize);
              ctx.lineTo(x, y + cellSize / 2);
              ctx.closePath();
              ctx.fill();
            } else if (qrPixelStyle === "classy") {
              ctx.beginPath();
              ctx.roundRect(x + 0.4, y + 0.4, cellSize - 0.8, cellSize - 0.8, [cellSize * 0.5, 0, cellSize * 0.5, 0]);
              ctx.fill();
            }
          }
        }
      }

      // 4. Draw Corner Finder Eyes
      const drawEye = (rStart: number, cStart: number) => {
        const eyeX = startX + cStart * cellSize;
        const eyeY = startY + rStart * cellSize;
        const eyeSize = 7 * cellSize;
        const centerEyeX = eyeX + eyeSize / 2;
        const centerEyeY = eyeY + eyeSize / 2;

        ctx.fillStyle = fillStyle;
        ctx.strokeStyle = fillStyle;

        if (qrEyeStyle === "rounded") {
          ctx.lineWidth = cellSize;
          ctx.beginPath();
          ctx.roundRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize, cellSize * 1.6);
          ctx.stroke();
          ctx.beginPath();
          ctx.roundRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize, cellSize * 1.1);
          ctx.fill();
        } else if (qrEyeStyle === "circle") {
          ctx.lineWidth = cellSize;
          ctx.beginPath();
          ctx.arc(centerEyeX, centerEyeY, (eyeSize - cellSize) / 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(centerEyeX, centerEyeY, 1.5 * cellSize, 0, Math.PI * 2);
          ctx.fill();
        } else if (qrEyeStyle === "cyber") {
          ctx.lineWidth = cellSize;
          ctx.beginPath();
          ctx.roundRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize, [0, cellSize * 2, 0, cellSize * 2]);
          ctx.stroke();
          ctx.beginPath();
          ctx.roundRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize, [0, cellSize, 0, cellSize]);
          ctx.fill();
        } else if (qrEyeStyle === "star") {
          ctx.lineWidth = cellSize * 0.9;
          ctx.beginPath();
          const outerR = (eyeSize - cellSize) / 2;
          const innerR = outerR * 0.65;
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const r = i % 2 === 0 ? outerR : innerR;
            const sx = centerEyeX + r * Math.cos(angle);
            const sy = centerEyeY + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.stroke();

          ctx.beginPath();
          const starCoreOuter = 1.6 * cellSize;
          const starCoreInner = 0.7 * cellSize;
          for (let i = 0; i < 8; i++) {
            const angle = (i * Math.PI) / 4;
            const r = i % 2 === 0 ? starCoreOuter : starCoreInner;
            const sx = centerEyeX + r * Math.cos(angle);
            const sy = centerEyeY + r * Math.sin(angle);
            if (i === 0) ctx.moveTo(sx, sy);
            else ctx.lineTo(sx, sy);
          }
          ctx.closePath();
          ctx.fill();
        } else {
          // Square
          ctx.lineWidth = cellSize;
          ctx.strokeRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize);
          ctx.fillRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize);
        }
      };

      drawEye(0, 0);
      drawEye(0, moduleCount - 7);
      drawEye(moduleCount - 7, 0);

      // 5. Draw Center Cutout & Logo Badge
      if (qrLogo !== "none") {
        const centerBoxSize = (centerCutoutRadius * 2 + 1.4) * cellSize;
        const centerBoxX = startX + (moduleCount * cellSize - centerBoxSize) / 2;
        const centerBoxY = startY + (moduleCount * cellSize - centerBoxSize) / 2;

        ctx.fillStyle = "#ffffff";
        ctx.shadowColor = "rgba(0,0,0,0.15)";
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.roundRect(centerBoxX, centerBoxY, centerBoxSize, centerBoxSize, 8);
        ctx.fill();
        ctx.shadowBlur = 0;

        if (qrLogo === "ql") {
          ctx.fillStyle = qrPixelColor;
          ctx.beginPath();
          ctx.roundRect(centerBoxX + 2.5, centerBoxY + 2.5, centerBoxSize - 5, centerBoxSize - 5, 6);
          ctx.fill();

          ctx.fillStyle = "#ffffff";
          ctx.font = "900 14px 'Bebas Neue', sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("LS", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2 + 1);
        } else if (qrLogo === "text") {
          ctx.fillStyle = qrPixelColor;
          ctx.font = "bold 11px Inter, sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText("SCAN", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
        }
      }
    } catch (e) {
      console.error("Demo QR render error:", e);
    }
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

  // Handle Download PNG action
  const handleDownloadPNG = () => {
    const canvas = qrCanvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `lshorter-${selectedPresetSlug}-qr.png`;
    link.href = dataUrl;
    link.click();
    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
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

  // Filtered links logic for Tab 2 (Mes Liens)
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
    <section
      ref={sectionRef}
      id="demo"
      className="relative py-16 sm:py-24 px-3 sm:px-6 overflow-hidden bg-[#FAF7F2] dark:bg-[#09090b] transition-colors duration-300"
    >
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <motion.div
          ref={headerRef}
          style={{ y: headerY, opacity: headerOpacity }}
          className="text-center max-w-2xl mx-auto mb-10 sm:mb-12"
        >
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-[#2B2520] dark:text-white leading-tight">
            Experience the Power of LShorter in Action
          </h2>
          <p className="mt-3 text-xs sm:text-base text-neutral-600 dark:text-neutral-400 font-normal leading-relaxed">
            An intuitive dashboard engineered to manage your Edge redirects, routing rules, and real-time metrics.
          </p>
        </motion.div>

        {/* Dashboard Frame (Grand Height & Authentic SaaS Chrome - 70% visual space) */}
        <motion.div
          ref={frameRef}
          style={{
            scale,
            rotateX,
            y,
            opacity,
            transformPerspective: 1200,
          }}
          className="w-full rounded-2xl bg-[#FFFDF9] dark:bg-[#141416] border border-[#E7DFD5] dark:border-white/10 shadow-[0_25px_70px_rgba(43,37,32,0.18)] dark:shadow-[0_30px_90px_rgba(0,0,0,0.9)] overflow-hidden transition-all duration-300 will-change-transform h-[70vh] min-h-[580px] max-h-[850px] flex flex-col"
        >
          {/* ─── Window Chrome Top Bar ─── */}
          <div className="h-11 sm:h-12 bg-[#F2ECE4] dark:bg-[#18181d] border-b border-[#E7DFD5] dark:border-white/10 px-4 sm:px-6 flex items-center justify-between select-none shrink-0">
            {/* Traffic Lights & Route URL */}
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e]" />
                <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f]" />
              </div>
              <div className="flex items-center gap-2 px-3 py-1 rounded-md bg-white dark:bg-[#0f0f13] border border-[#E7DFD5] dark:border-white/10 text-[11px] font-mono text-neutral-600 dark:text-neutral-300">
                <span className="text-emerald-500 font-bold">https://</span>
                <span className="font-semibold text-neutral-900 dark:text-neutral-100">lshorter.com</span>
                <span className="text-brand font-semibold">/dashboard/{activeTab === "qr" ? "qr-code" : activeTab}</span>
              </div>
            </div>

            {/* Right Status Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono font-semibold text-emerald-500">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Edge Cloudflare 11ms
              </span>
            </div>
          </div>

          {/* ─── Frame Inner Layout: Sidebar + Dynamic Main Content ─── */}
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
            {/* 1. Authentic Sidebar (Desktop Orange & Clean Categories) */}
            <div className="w-full md:w-56 p-3 sm:p-4 bg-[#FAF7F2] dark:bg-[#09090b] border-b md:border-b-0 md:border-r border-[#E7DFD5] dark:border-[#222225] flex md:flex-col justify-between shrink-0 select-none overflow-y-auto">
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

                {/* Tabs */}
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
                  <span>My Links</span>
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
                  <span>QR Codes</span>
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
              <div className="hidden md:block p-3 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#27272a] text-xs mt-4">
                <div className="flex items-center justify-between text-[10px] text-neutral-500 mb-1">
                  <span className="font-bold text-brand">PRO PLAN</span>
                  <span className="font-mono text-neutral-900 dark:text-white">128.4K / 1M</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                  <div className="w-[32%] h-full bg-brand rounded-full" />
                </div>
                <span className="text-[9px] text-neutral-400 block mt-1.5 font-mono">Cloudflare Edge 11ms</span>
              </div>
            </div>

            {/* 2. Main Content Pane */}
            <div className="flex-1 p-4 sm:p-6 lg:p-7 overflow-y-auto max-h-[720px] select-none bg-[#FFFDF9] dark:bg-[#0f0f13]">
              
              {/* ────────────────────────────────────────────────────────────────
                  TAB 1: OVERVIEW
                 ──────────────────────────────────────────────────────────────── */}
              {activeTab === "overview" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Top Bar Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-wide">
                        Overview
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Global performance of your redirects, conversions, and live clicks.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={handleRefreshOverview}
                        className="h-8 px-3 text-xs gap-1.5 border-[#E7DFD5] dark:border-[#27272a] bg-white dark:bg-[#141416] text-neutral-700 dark:text-neutral-300"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingOverview ? "animate-spin text-brand" : "text-neutral-400"}`} />
                        <span>Refresh</span>
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => setActiveTab("links")}
                        className="h-8 px-3 text-xs bg-brand hover:bg-brand-hover text-white font-bebas text-sm tracking-wide gap-1 shadow-md shadow-brand"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>CREATE A LINK</span>
                      </Button>
                    </div>
                  </div>

                  {/* 4 Staggered KPI Metric Cards */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="p-4 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] flex flex-col justify-between h-32 shadow-xs hover:border-brand transition-colors">
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span className="font-semibold">Total Clicks</span>
                        <span className="text-emerald-500 font-bold text-[11px]">+14.2%</span>
                      </div>
                      <div className="font-bebas text-4xl sm:text-5xl font-bold text-brand tracking-wide leading-none">
                        128,420
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span>71,400 unique</span>
                        <span>Real-time Edge</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] flex flex-col justify-between h-32 shadow-xs hover:border-brand transition-colors">
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span className="font-semibold">Created Links</span>
                        <span className="text-emerald-500 font-bold text-[11px]">42</span>
                      </div>
                      <div className="font-bebas text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white tracking-wide leading-none">
                        42
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span>42 active</span>
                        <span>Active routing</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] flex flex-col justify-between h-32 shadow-xs hover:border-brand transition-colors">
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span className="font-semibold">Tracked Revenue</span>
                        <span className="text-emerald-500 font-bold text-[11px]">$2,450</span>
                      </div>
                      <div className="font-bebas text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white tracking-wide leading-none">
                        $2,450.00
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span>EPC: $0.19</span>
                        <span>Conversions</span>
                      </div>
                    </div>

                    <div className="p-4 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] flex flex-col justify-between h-32 shadow-xs hover:border-brand transition-colors">
                      <div className="flex items-center justify-between text-xs text-neutral-500">
                        <span className="font-semibold">Conversion Rate</span>
                        <span className="text-emerald-500 font-bold text-[11px]">3.4%</span>
                      </div>
                      <div className="font-bebas text-4xl sm:text-5xl font-bold text-emerald-500 tracking-wide leading-none">
                        3.4%
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-neutral-400 font-mono">
                        <span>4,360 conversions</span>
                        <span>Optimum &gt; 2%</span>
                      </div>
                    </div>
                  </div>

                  {/* Middle Row: 30-Day Click Histogram + Top Countries */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    {/* Left: Interactive 30-day SVG Histogram */}
                    <div className="lg:col-span-8 p-4 sm:p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] flex flex-col justify-between shadow-xs">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                            Click Analytics (30 Days)
                          </h4>
                          <span className="text-[11px] text-neutral-400">All links combined</span>
                        </div>
                        <span className="text-xs font-mono font-bold text-brand bg-brand-subtle px-2 py-0.5 rounded-md">
                          128.4K clicks
                        </span>
                      </div>

                      {/* Dynamic SVG Bars with Hover Info */}
                      <div className="h-44 w-full flex items-end justify-between gap-1 sm:gap-2 pt-4 pb-1 relative">
                        {dailyClicksData.map((d, idx) => {
                          const heightPct = Math.round((d.clicks / maxClicksValue) * 100);
                          const isHovered = hoveredBarIndex === idx;
                          return (
                            <div
                              key={d.date}
                              onMouseEnter={() => setHoveredBarIndex(idx)}
                              onMouseLeave={() => setHoveredBarIndex(null)}
                              className="flex-1 flex flex-col items-center justify-end h-full group cursor-pointer relative"
                            >
                              {/* Tooltip on hover */}
                              {isHovered && (
                                <div className="absolute -top-8 px-2 py-1 bg-neutral-900 text-white rounded text-[10px] font-mono whitespace-nowrap shadow-lg z-20 pointer-events-none">
                                  {d.date}: {d.clicks.toLocaleString()} clicks
                                </div>
                              )}
                              <AnimatedBar
                                direction="vertical"
                                value={heightPct}
                                delay={idx * 0.02}
                                className={`w-full rounded-t-sm transition-colors duration-200 ${
                                  isHovered
                                    ? "bg-brand shadow-md shadow-brand"
                                    : "bg-brand/80 group-hover:bg-brand"
                                }`}
                              />
                              <span className="text-[8.5px] font-mono text-neutral-400 mt-1 truncate">
                                {d.date.split(" ")[0]}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="pt-2 border-t border-[#E7DFD5] dark:border-[#222225] flex items-center justify-between text-[10px] text-neutral-400">
                        <span>Timeframe: Last 30 days</span>
                        <span>Average: 4,280 clicks/day</span>
                      </div>
                    </div>

                    {/* Right: Top Pays Progress */}
                    <div className="lg:col-span-4 p-4 sm:p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Top Countries</h4>
                          <button
                            type="button"
                            onClick={() => setActiveTab("analytics")}
                            className="text-xs text-brand hover:underline flex items-center gap-1 font-medium cursor-pointer"
                          >
                            <span>Details</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="space-y-3">
                          {[
                            { code: "FR", name: "France", pct: 40.8, count: "52,400" },
                            { code: "US", name: "United States", pct: 26.5, count: "34,100" },
                            { code: "BF", name: "Burkina Faso", pct: 14.7, count: "18,900" },
                            { code: "DE", name: "Germany", pct: 9.4, count: "12,100" },
                            { code: "CA", name: "Canada", pct: 8.6, count: "10,920" },
                          ].map((item, i) => (
                            <div key={item.code} className="space-y-1 text-xs">
                              <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] font-bold text-brand w-6">
                                    {item.code}
                                  </span>
                                  <span>{item.name}</span>
                                </div>
                                <span className="font-mono text-[11px] text-neutral-400">
                                  {item.count} ({item.pct}%)
                                </span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                                <AnimatedBar
                                  value={item.pct}
                                  delay={i * 0.08}
                                  className="h-full bg-brand rounded-full"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E7DFD5] dark:border-[#222225] flex items-center justify-between text-[10px] text-neutral-400">
                        <span>84 recorded countries</span>
                        <span>Cloudflare Edge</span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom: Liens Récents Table */}
                  <div className="p-4 sm:p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">Recent Links</h4>
                        <p className="text-xs text-neutral-500 dark:text-neutral-400">Your latest created redirects</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveTab("links")}
                        className="text-xs text-brand hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <span>View all links</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                        <thead>
                          <tr className="border-b border-[#E7DFD5] dark:border-[#222225] text-[10px] uppercase font-mono text-neutral-500">
                            <th className="pb-2.5 pl-2">Link &amp; Target</th>
                            <th className="pb-2.5">Short URL</th>
                            <th className="pb-2.5 text-center">Options</th>
                            <th className="pb-2.5 text-right pr-3">Clicks</th>
                            <th className="pb-2.5">Status</th>
                            <th className="pb-2.5 text-right pr-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7DFD5]/60 dark:divide-[#202024]">
                          {mockLinks.map((link) => (
                            <tr key={link.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                              <td className="py-3 pl-2 max-w-[200px]">
                                <span className="font-bold text-neutral-900 dark:text-white block truncate">
                                  /{link.slug}
                                </span>
                                <span className="text-[10px] text-neutral-400 truncate block">
                                  ↳ {link.targetUrl}
                                </span>
                              </td>
                              <td className="py-3 font-mono text-xs text-brand">
                                {link.shortUrl}
                              </td>
                              <td className="py-3 text-center">
                                <div className="flex items-center justify-center gap-1.5 text-neutral-400">
                                  {link.features.ab && <span title="A/B Testing"><Split className="w-3.5 h-3.5 text-indigo-400" /></span>}
                                  {link.features.geo && <span title="Geo-targeting"><Globe2 className="w-3.5 h-3.5 text-sky-400" /></span>}
                                  {link.features.mobile && <span title="Mobile routing"><Smartphone className="w-3.5 h-3.5 text-emerald-400" /></span>}
                                  {link.features.lock && <span title="PIN Code"><Lock className="w-3.5 h-3.5 text-amber-400" /></span>}
                                  {link.features.cloak && <span title="URL Masking"><EyeOff className="w-3.5 h-3.5 text-purple-400" /></span>}
                                </div>
                              </td>
                              <td className="py-3 text-right pr-3 font-mono font-bold text-neutral-900 dark:text-white">
                                {link.clicks.toLocaleString()}
                              </td>
                              <td className="py-3">
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono text-[10px] font-bold">
                                  Active
                                </span>
                              </td>
                              <td className="py-3 text-right pr-2">
                                <button
                                  type="button"
                                  onClick={() => handleCopy(link.shortUrl, link.slug)}
                                  className="px-2 py-1 rounded-[6px] bg-brand-subtle text-brand hover:bg-brand hover:text-white text-[11px] font-mono transition-colors cursor-pointer inline-flex items-center gap-1"
                                >
                                  {copiedSlug === link.slug ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
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

              {/* ────────────────────────────────────────────────────────────────
                  TAB 2: MY LINKS
                 ──────────────────────────────────────────────────────────────── */}
              {activeTab === "links" && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-wide">
                        My Short Links
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Manage, edit, and analyze your 42 active redirects with dynamic QR Codes and UTM parameters.
                      </p>
                    </div>

                    <Button
                      size="sm"
                      className="h-8.5 px-3.5 text-xs bg-brand hover:bg-brand-hover text-white font-bebas text-sm tracking-wide gap-1 shadow-md shadow-brand"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>CREATE A LINK</span>
                    </Button>
                  </div>

                  {/* Filter Toolbar */}
                  <div className="p-3 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] flex flex-col sm:flex-row items-center justify-between gap-3">
                    {/* Search */}
                    <div className="relative flex-1 w-full sm:max-w-xs">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                      <input
                        type="text"
                        placeholder="Search by slug, target URL or #tag..."
                        value={filterQuery}
                        onChange={(e) => setFilterQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-[8px] bg-[#FAF7F2] dark:bg-[#1a1a1e] border border-[#E7DFD5] dark:border-[#27272a] text-xs text-neutral-900 dark:text-white outline-none focus:border-brand"
                      />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs">
                      <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="h-8 px-2.5 rounded-[8px] bg-[#FAF7F2] dark:bg-[#1a1a1e] border border-[#E7DFD5] dark:border-[#27272a] text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none"
                      >
                        <option value="all">All statuses (42)</option>
                        <option value="active">Active only</option>
                        <option value="protected">PIN-Protected</option>
                      </select>

                      <select
                        value={tagFilter}
                        onChange={(e) => setTagFilter(e.target.value)}
                        className="h-8 px-2.5 rounded-[8px] bg-[#FAF7F2] dark:bg-[#1a1a1e] border border-[#E7DFD5] dark:border-[#27272a] text-xs text-neutral-700 dark:text-neutral-300 focus:outline-none"
                      >
                        <option value="all">All tags</option>
                        <option value="marketing">#marketing</option>
                        <option value="campagne-q3">#campagne-q3</option>
                        <option value="leadgen">#leadgen</option>
                        <option value="vip">#vip</option>
                      </select>
                    </div>
                  </div>

                  {/* Desktop Links Table */}
                  <div className="rounded-[10px] border border-[#E7DFD5] dark:border-[#222225] overflow-hidden bg-white dark:bg-[#141416]">
                    <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                      <thead className="bg-[#FAF7F2] dark:bg-[#111116] border-b border-[#E7DFD5] dark:border-[#222225] text-[10px] uppercase font-mono text-neutral-500">
                        <tr>
                          <th className="p-3 pl-4">Link &amp; Target</th>
                          <th className="p-3">Short URL</th>
                          <th className="p-3 text-center">Options</th>
                          <th className="p-3 text-right">Clicks</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right pr-4">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#E7DFD5]/60 dark:divide-[#202024]">
                        {filteredLinks.map((link) => (
                          <tr key={link.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                            <td className="p-3 pl-4 max-w-[220px]">
                              <div className="flex flex-col">
                                <span className="font-bold text-neutral-900 dark:text-white text-xs truncate">
                                  /{link.slug}
                                </span>
                                <span className="text-[11px] text-neutral-400 truncate">
                                  ↳ {link.targetUrl}
                                </span>
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  {link.tags.map((t) => (
                                    <span
                                      key={t}
                                      className="text-[9.5px] font-mono px-1.5 py-0.2 rounded bg-[#FAF7F2] dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-[#E7DFD5] dark:border-white/5"
                                    >
                                      #{t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </td>

                            <td className="p-3 font-mono text-xs text-brand font-medium whitespace-nowrap">
                              {link.shortUrl}
                            </td>

                            <td className="p-3 text-center">
                              <div className="flex items-center justify-center gap-1 text-neutral-400">
                                {link.features.ab && <span title="A/B 50/50"><Split className="w-3.5 h-3.5 text-indigo-400" /></span>}
                                {link.features.geo && <span title="84 countries"><Globe2 className="w-3.5 h-3.5 text-sky-400" /></span>}
                                {link.features.mobile && <span title="Mobile routing"><Smartphone className="w-3.5 h-3.5 text-emerald-400" /></span>}
                                {link.features.lock && <span title="PIN Code"><Lock className="w-3.5 h-3.5 text-amber-400" /></span>}
                                {link.features.cloak && <span title="URL Masking"><EyeOff className="w-3.5 h-3.5 text-purple-400" /></span>}
                              </div>
                            </td>

                            <td className="p-3 text-right font-mono font-bold text-neutral-900 dark:text-white">
                              {link.clicks.toLocaleString()}
                              <span className="text-[10px] text-neutral-400 block font-normal">
                                {link.uniqueClicks.toLocaleString()} unique
                              </span>
                            </td>

                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-mono text-[10px] font-bold">
                                Active
                              </span>
                            </td>

                            <td className="p-3 text-right pr-4">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleCopy(link.shortUrl, link.slug)}
                                  className="px-2.5 py-1.5 rounded-[8px] bg-brand-subtle text-brand hover:bg-brand hover:text-white text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
                                >
                                  {copiedSlug === link.slug ? (
                                    <>
                                      <Check className="w-3 h-3 text-emerald-500" />
                                      <span>Copied</span>
                                    </>
                                  ) : (
                                    <>
                                      <Copy className="w-3 h-3" />
                                      <span>Copy</span>
                                    </>
                                  )}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    handlePresetChange(link.slug);
                                    setActiveTab("qr");
                                  }}
                                  className="p-1.5 rounded-[8px] bg-neutral-100 dark:bg-white/5 text-neutral-500 hover:text-brand transition-colors cursor-pointer"
                                  title="Open in QR Studio"
                                >
                                  <QrCode className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────────
                  TAB 3: QR CODE CUSTOMIZATION STUDIO
                 ──────────────────────────────────────────────────────────────── */}
              {activeTab === "qr" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Studio Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-wide">
                        QR Code Customization Studio
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Customize pixel patterns, finder eyes, gradient colors, central logos, and CTA frames.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        onClick={handleSaveQR}
                        className="h-8.5 px-3.5 text-xs bg-brand hover:bg-brand-hover text-white font-bold gap-1.5 shadow-lg shadow-brand cursor-pointer"
                      >
                        {isQrSaved ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-white" />
                            <span>Saved!</span>
                          </>
                        ) : (
                          <>
                            <Save className="w-3.5 h-3.5" />
                            <span>Save</span>
                          </>
                        )}
                      </Button>
                      <button
                        type="button"
                        onClick={() => {
                          handleSaveQR();
                        }}
                        className="px-3 py-1.5 rounded-[8px] bg-neutral-100 dark:bg-white/5 hover:bg-neutral-200 dark:hover:bg-white/10 text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-1.5 cursor-pointer border border-[#E7DFD5] dark:border-[#27272a]"
                      >
                        <Download className="w-3.5 h-3.5 text-brand" />
                        <span>Export JSON V3</span>
                      </button>
                    </div>
                  </div>

                  {/* 2-Column Studio Grid: Controls on Left (7 cols), Live Preview on Right (5 cols) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    
                    {/* Left Column: Customization Controls (7 cols) */}
                    <div className="lg:col-span-7 space-y-4">
                      {/* 1. Content Type Tabs */}
                      <div className="space-y-1.5">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Content Type</span>
                        <div className="flex flex-wrap items-center gap-2">
                          {[
                            { type: "link" as const, label: "URL Link" },
                            { type: "text" as const, label: "Plain Text" },
                            { type: "wifi" as const, label: "Wi-Fi" },
                            { type: "email" as const, label: "Email" },
                            { type: "call" as const, label: "Phone" },
                            { type: "sms" as const, label: "SMS" },
                          ].map((item) => (
                            <button
                              key={item.type}
                              type="button"
                              onClick={() => setQrContentType(item.type)}
                              className={`px-3 py-1.5 rounded-[8px] text-xs font-semibold border transition-all cursor-pointer ${
                                qrContentType === item.type
                                  ? "bg-brand text-white border-brand shadow-sm shadow-brand font-bold"
                                  : "bg-white dark:bg-[#141416] border-[#E7DFD5] dark:border-[#27272a] text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. Content Input & Link Selector */}
                      <div className="p-4 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] space-y-3">
                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                            Attached Short Link
                          </label>
                          <select
                            value={selectedPresetSlug}
                            onChange={(e) => handlePresetChange(e.target.value)}
                            className="w-full h-9 rounded-[8px] bg-[#FAF7F2] dark:bg-[#1a1a1e] border border-[#E7DFD5] dark:border-[#27272a] px-3 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-brand cursor-pointer"
                          >
                            {mockLinks.map((l) => (
                              <option key={l.id} value={l.slug}>
                                /{l.slug} ➔ {l.targetUrl}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <input
                            type="text"
                            value={qrWebsiteUrl}
                            onChange={(e) => setQrWebsiteUrl(e.target.value)}
                            className="w-full h-9 rounded-[8px] bg-[#FAF7F2] dark:bg-[#1a1a1e] border border-[#E7DFD5] dark:border-[#27272a] px-3 text-xs font-mono text-neutral-900 dark:text-neutral-100 focus:outline-none focus:border-brand"
                          />
                        </div>

                        {/* Verified Badge */}
                        <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-[8px] px-3 py-1.5">
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          <div className="flex items-center justify-between gap-2 w-full truncate">
                            <span>Attached link in database: <strong>/{selectedPresetSlug}</strong></span>
                            <span className="text-[10px] font-mono text-neutral-500">Cloudflare Edge</span>
                          </div>
                        </div>
                      </div>

                      {/* 3. Motifs des pixels */}
                      <div className="p-4 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] space-y-2">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Pixel Pattern</span>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { id: "square", label: "Square" },
                            { id: "rounded", label: "Rounded" },
                            { id: "dots", label: "Dots" },
                            { id: "diamond", label: "Diamond" },
                            { id: "classy", label: "Classy" },
                          ].map((style) => (
                            <button
                              key={style.id}
                              type="button"
                              onClick={() => setQrPixelStyle(style.id as any)}
                              className={`py-2 px-1 rounded-[8px] border text-center text-xs font-medium transition-all cursor-pointer ${
                                qrPixelStyle === style.id
                                  ? "bg-brand-subtle border-brand text-brand font-bold shadow-xs"
                                  : "bg-[#FAF7F2] dark:bg-[#1a1a1e] border-[#E7DFD5] dark:border-[#27272a] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                              }`}
                            >
                              {style.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 4. Coins d'yeux */}
                      <div className="p-4 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] space-y-2">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Finder Eye Pattern</span>
                        <div className="grid grid-cols-5 gap-2">
                          {[
                            { id: "square", label: "Square" },
                            { id: "rounded", label: "Rounded" },
                            { id: "circle", label: "Circle" },
                            { id: "cyber", label: "Cyber" },
                            { id: "star", label: "Star" },
                          ].map((eye) => (
                            <button
                              key={eye.id}
                              type="button"
                              onClick={() => setQrEyeStyle(eye.id as any)}
                              className={`py-2 px-1 rounded-[8px] border text-center text-xs font-medium transition-all cursor-pointer ${
                                qrEyeStyle === eye.id
                                  ? "bg-brand-subtle border-brand text-brand font-bold shadow-xs"
                                  : "bg-[#FAF7F2] dark:bg-[#1a1a1e] border-[#E7DFD5] dark:border-[#27272a] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                              }`}
                            >
                              {eye.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 5. Palette de couleur & Logo central */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Colors */}
                        <div className="p-4 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] space-y-2.5">
                          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Pixel Color</span>
                          <div className="flex items-center gap-2">
                            {[
                              { hex: "#ff6600", name: "Orange SaaS" },
                              { hex: "#0080ff", name: "Cyber Blue" },
                              { hex: "#09090b", name: "Obsidian Black" },
                              { hex: "#10b981", name: "Emerald" },
                              { hex: "#8b5cf6", name: "Purple Pro" },
                            ].map((c) => (
                              <button
                                key={c.hex}
                                type="button"
                                onClick={() => setQrPixelColor(c.hex)}
                                style={{ backgroundColor: c.hex }}
                                className={`w-7 h-7 rounded-full border-2 transition-transform cursor-pointer ${
                                  qrPixelColor === c.hex ? "border-neutral-900 dark:border-white scale-110 shadow-md" : "border-transparent"
                                }`}
                                title={c.name}
                              />
                            ))}
                          </div>
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] font-mono text-neutral-500">Hex:</span>
                            <input
                              type="text"
                              value={qrPixelColor}
                              onChange={(e) => setQrPixelColor(e.target.value)}
                              className="w-24 h-7 px-2 rounded-[6px] bg-[#FAF7F2] dark:bg-[#1a1a1e] border border-[#E7DFD5] dark:border-[#27272a] font-mono text-xs uppercase"
                            />
                          </div>
                        </div>

                        {/* CTA Frame Selector */}
                        <div className="p-4 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] space-y-2.5">
                          <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">CTA Frame</span>
                          <div className="flex flex-wrap gap-1.5">
                            {[
                              { id: "none", label: "None" },
                              { id: "simple", label: "Simple" },
                              { id: "bottom_pill", label: "Bottom Pill" },
                              { id: "modern_badge", label: "Badge ★" },
                              { id: "neon", label: "Neon Glow" },
                            ].map((f) => (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setQrFrame(f.id as any)}
                                className={`px-2.5 py-1 rounded-[6px] text-xs font-medium border cursor-pointer ${
                                  qrFrame === f.id
                                    ? "bg-brand-subtle border-brand text-brand font-bold"
                                    : "bg-[#FAF7F2] dark:bg-[#1a1a1e] border-[#E7DFD5] dark:border-[#27272a] text-neutral-600 dark:text-neutral-400"
                                }`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                          {qrFrame !== "none" && (
                            <input
                              type="text"
                              value={qrFrameText}
                              onChange={(e) => setQrFrameText(e.target.value)}
                              placeholder="SCAN ME"
                              className="w-full h-7 px-2 rounded-[6px] bg-[#FAF7F2] dark:bg-[#1a1a1e] border border-[#E7DFD5] dark:border-[#27272a] text-xs font-semibold uppercase"
                            />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Column: Live Interactive Canvas Preview (5 cols) */}
                    <div className="lg:col-span-5 space-y-4 lg:sticky lg:top-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">Live Preview</span>
                        <span className="text-[10px] font-mono text-emerald-500 font-bold">● High-Resolution Render</span>
                      </div>

                      {/* Main Canvas Card */}
                      <div className="rounded-[12px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] p-6 flex flex-col items-center justify-center shadow-xl">
                        <div className="p-3 rounded-[10px] bg-white shadow-md border border-neutral-100 flex items-center justify-center">
                          <canvas ref={qrCanvasRef} className="max-w-full h-auto object-contain" />
                        </div>
                      </div>

                      {/* Resolution Slider */}
                      <div className="p-3 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] space-y-1 text-xs">
                        <div className="flex items-center justify-between font-semibold text-neutral-700 dark:text-neutral-300">
                          <span>Resolution</span>
                          <span className="font-mono text-brand">{qrSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="180"
                          max="280"
                          step="10"
                          value={qrSize}
                          onChange={(e) => setQrSize(Number(e.target.value))}
                          className="w-full accent-[var(--brand-primary)] cursor-pointer"
                        />
                      </div>

                      {/* Action Export Buttons */}
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          size="sm"
                          onClick={handleDownloadPNG}
                          className="h-9 text-xs bg-brand hover:bg-brand-hover text-white font-bold gap-1.5 shadow-md shadow-brand cursor-pointer"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>Download PNG</span>
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={handleSaveQR}
                          className="h-9 text-xs border-[#E7DFD5] dark:border-[#27272a] bg-white dark:bg-[#141416] text-neutral-700 dark:text-neutral-300 gap-1.5 cursor-pointer"
                        >
                          <Share2 className="w-3.5 h-3.5 text-brand" />
                          <span>Export SVG</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ────────────────────────────────────────────────────────────────
                  TAB 4: ANALYTICS & ADVANCED METRICS
                 ──────────────────────────────────────────────────────────────── */}
              {activeTab === "analytics" && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Top Bar Action */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className="text-xl font-bold text-neutral-900 dark:text-white tracking-wide">
                        Analytics &amp; Advanced Metrics
                      </h3>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        Analyze redirect performance in real time with Edge latency and geolocation.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Range tabs */}
                      <div className="flex items-center p-0.5 rounded-[8px] bg-[#FAF7F2] dark:bg-[#1a1a1e] border border-[#E7DFD5] dark:border-[#27272a] text-xs">
                        {(["day", "week", "month", "year"] as const).map((r) => (
                          <button
                            key={r}
                            type="button"
                            onClick={() => setAnalyticsRange(r)}
                            className={`px-2.5 py-1 rounded-[6px] font-semibold transition-all cursor-pointer ${
                              analyticsRange === r
                                ? "bg-brand text-white shadow-xs font-bold"
                                : "text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
                            }`}
                          >
                            {r === "day" ? "24h" : r === "week" ? "7d" : r === "month" ? "30d" : "1y"}
                          </button>
                        ))}
                      </div>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-xs border-[#E7DFD5] dark:border-[#27272a] bg-white dark:bg-[#141416] text-neutral-700 dark:text-neutral-300 gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-brand" />
                        <span>Export CSV</span>
                      </Button>
                    </div>
                  </div>

                  {/* 6 Precision KPI Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {[
                      { label: "Total Clicks", val: "128,420", sub: "+14.2% this month", color: "text-brand" },
                      { label: "Unique Clicks", val: "71,400", sub: "100% verified", color: "text-neutral-900 dark:text-white" },
                      { label: "Tracked Revenue", val: "$2,450", sub: "+18.5% MRR", color: "text-neutral-900 dark:text-white" },
                      { label: "Conversion Rate", val: "3.4%", sub: "Optimum > 2%", color: "text-emerald-500" },
                      { label: "EPC (Earn/Click)", val: "$0.19", sub: "Max profitability", color: "text-emerald-500" },
                      { label: "Bounce Rate", val: "21.4%", sub: "Strong retention", color: "text-neutral-900 dark:text-white" },
                    ].map((kpi, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] flex flex-col justify-between shadow-xs"
                      >
                        <span className="text-[10px] font-semibold text-neutral-500">{kpi.label}</span>
                        <div className={`font-bebas text-2xl sm:text-3xl font-bold my-1 ${kpi.color}`}>
                          {kpi.val}
                        </div>
                        <span className="text-[9.5px] font-mono text-emerald-500">{kpi.sub}</span>
                      </div>
                    ))}
                  </div>

                  {/* World Radar Geolocation Showcase + Devices */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                    {/* World Radar Geolocation */}
                    <div className="lg:col-span-6 p-4 sm:p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] flex flex-col justify-between shadow-xs">
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-brand flex items-center gap-1.5">
                            <Globe2 className="w-4 h-4" />
                            <span>Live Global Traffic</span>
                          </span>
                          <span className="text-[10px] font-mono text-emerald-500 font-bold">Edge &lt; 0.8ms</span>
                        </div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                          Real-Time Geographic Distribution
                        </h4>
                      </div>

                      {/* Stylized Geo Radar Screen */}
                      <div className="my-4 h-40 rounded-[10px] bg-[#FAF7F2] dark:bg-[#0d0d12] border border-[#E7DFD5] dark:border-white/5 relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,var(--brand-primary-subtle)_0%,transparent_70%)]" />
                        
                        {/* Radar concentric rings */}
                        <div className="w-32 h-32 rounded-full border border-brand-subtle absolute animate-ping" />
                        <div className="w-24 h-24 rounded-full border border-brand-subtle absolute" />
                        <div className="w-12 h-12 rounded-full border border-brand absolute" />

                        {/* City PoP Markers */}
                        <div className="absolute top-8 left-16 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[9px] font-mono text-neutral-500">Paris (52.4K)</span>
                        </div>
                        <div className="absolute top-12 right-20 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
                          <span className="text-[9px] font-mono text-neutral-500">New York (34.1K)</span>
                        </div>
                        <div className="absolute bottom-10 left-24 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-cyan-500 animate-pulse" />
                          <span className="text-[9px] font-mono text-neutral-500">Ouagadougou (18.9K)</span>
                        </div>
                        <div className="absolute bottom-12 right-16 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                          <span className="text-[9px] font-mono text-neutral-500">Tokyo (8.4K)</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E7DFD5] dark:border-[#222225] flex items-center justify-between text-[10px] text-neutral-500">
                        <span>Top Region: France (40.8%)</span>
                        <span>300+ Cloudflare Datacenters</span>
                      </div>
                    </div>

                    {/* Devices & Traffic Channels */}
                    <div className="lg:col-span-6 p-4 sm:p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] flex flex-col justify-between shadow-xs">
                      <div>
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">
                          Devices &amp; Platforms
                        </h4>
                        
                        <div className="grid grid-cols-3 gap-2 text-center mb-4">
                          <div className="p-3 rounded-[8px] bg-[#FAF7F2] dark:bg-[#1a1a1e] border border-[#E7DFD5] dark:border-[#27272a]">
                            <span className="text-[10px] text-neutral-500 block">Desktop</span>
                            <span className="text-xl font-bold font-mono text-brand">58%</span>
                            <span className="text-[9px] text-neutral-400 block mt-0.5">74,480 clicks</span>
                          </div>
                          <div className="p-3 rounded-[8px] bg-[#FAF7F2] dark:bg-[#1a1a1e] border border-[#E7DFD5] dark:border-[#27272a]">
                            <span className="text-[10px] text-neutral-500 block">Mobile</span>
                            <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white">36%</span>
                            <span className="text-[9px] text-neutral-400 block mt-0.5">46,230 clicks</span>
                          </div>
                          <div className="p-3 rounded-[8px] bg-[#FAF7F2] dark:bg-[#1a1a1e] border border-[#E7DFD5] dark:border-[#27272a]">
                            <span className="text-[10px] text-neutral-500 block">Tablet</span>
                            <span className="text-xl font-bold font-mono text-neutral-900 dark:text-white">6%</span>
                            <span className="text-[9px] text-neutral-400 block mt-0.5">7,710 clicks</span>
                          </div>
                        </div>

                        {/* Channels */}
                        <div className="space-y-2 text-xs">
                          <span className="text-[11px] font-semibold text-neutral-500 block">Sources &amp; Referrers</span>
                          {[
                            { name: "Direct Traffic", pct: 42, count: "53,920" },
                            { name: "LinkedIn & B2B", pct: 28, count: "35,950" },
                            { name: "Twitter / X", pct: 18, count: "23,110" },
                            { name: "Google Search", pct: 12, count: "15,440" },
                          ].map((ch) => (
                            <div key={ch.name} className="space-y-1">
                              <div className="flex justify-between text-neutral-700 dark:text-neutral-300">
                                <span>{ch.name}</span>
                                <span className="font-mono">{ch.count} ({ch.pct}%)</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-neutral-200 dark:bg-white/10 overflow-hidden">
                                <div className="h-full bg-brand rounded-full" style={{ width: `${ch.pct}%` }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-[#E7DFD5] dark:border-[#222225] flex items-center justify-between text-[10px] text-neutral-500">
                        <span>Cookieless Analytics</span>
                        <span>100% GDPR Compliant</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Stream Table */}
                  <div className="p-4 sm:p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E7DFD5] dark:border-[#222225] space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <h4 className="text-sm font-bold text-neutral-900 dark:text-white">
                          Live Event Stream
                        </h4>
                      </div>
                      <span className="text-[10px] font-mono text-neutral-400">Real-time Cloudflare Worker</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs text-neutral-600 dark:text-neutral-300">
                        <thead className="bg-[#FAF7F2] dark:bg-[#111116] border-b border-[#E7DFD5] dark:border-[#222225] text-[10px] uppercase font-mono text-neutral-500">
                          <tr>
                            <th className="pb-2 pl-3">Timestamp</th>
                            <th className="pb-2">Link</th>
                            <th className="pb-2">Location</th>
                            <th className="pb-2">Device</th>
                            <th className="pb-2">Source</th>
                            <th className="pb-2 text-right pr-3">Event</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#E7DFD5]/60 dark:divide-[#202024] font-mono text-[11px]">
                          {[
                            { time: "3s ago", slug: "launch-pro-2026", loc: "🇫🇷 Paris", dev: "Desktop Chrome", src: "LinkedIn", ev: "Edge Click 11ms" },
                            { time: "14s ago", slug: "launch-pro-2026", loc: "🇺🇸 New York", dev: "Mobile Safari", src: "Direct", ev: "Conversion $49.00" },
                            { time: "32s ago", slug: "ebook-conversion", loc: "🇧🇫 Ouagadougou", dev: "Mobile Chrome", src: "Twitter/X", ev: "QR Code Click" },
                            { time: "1m ago", slug: "direction-finance", loc: "🇩🇪 Frankfurt", dev: "Desktop Edge", src: "VIP Email", ev: "PIN Code Verified" },
                          ].map((ev, i) => (
                            <tr key={i} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                              <td className="py-2.5 pl-3 text-neutral-400">{ev.time}</td>
                              <td className="py-2.5 text-brand font-bold">/{ev.slug}</td>
                              <td className="py-2.5 text-neutral-800 dark:text-neutral-200">{ev.loc}</td>
                              <td className="py-2.5 text-neutral-500">{ev.dev}</td>
                              <td className="py-2.5 text-neutral-500">{ev.src}</td>
                              <td className="py-2.5 text-right pr-3 font-semibold text-emerald-500">{ev.ev}</td>
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
      </div>
    </section>
  );
}
