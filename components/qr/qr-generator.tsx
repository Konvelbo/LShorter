"use client";

import React, { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import {
  Link2,
  FileText,
  Wifi,
  Mail,
  Phone,
  MessageSquare,
  Lock,
  Download,
  Share2,
  Upload,
  Crown,
  Check,
  Sparkles,
  Palette,
  Layers,
  Type,
  Plus,
  ChevronDown,
  X,
  Save,
  AlertCircle,
  ExternalLink,
  Globe2,
  Smartphone,
  Shield,
  Star,
  Tag,
  CreditCard,
  MessageCircle,
  RotateCcw,
  Play,
  Pause,
  Film,
  Search,
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  QRContentType,
  ShortLink,
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { showToast } from "@/components/ui/toast-provider";
import confetti from "canvas-confetti";
import { cfUploadImage, cfGetLinks, cfUpdateLink, cfInvalidateCache } from "@/lib/cloudflare-api";
import { GIFEncoder, quantize, applyPalette } from "gifenc";
import {
  PixelStyleType,
  EyeStyleType,
  FrameType,
  LogoType,
  FontFamilyType,
  FontWeightType,
  TextTransformType,
  getFontFamilyCss,
  drawPixelModule,
  drawFinderEye,
  drawCenterLogo,
  drawQRFrame,
  isAnimatedFrame,
} from "./qr-render-engine";
import { BrandIcons } from "./qr-icons";

export const FONT_FAMILIES: {
  id: FontFamilyType;
  label: string;
  name: string;
  preview: string;
  category: "Sans-Serif" | "Serif" | "Display" | "Monospace" | "Cursive" | "Futuristic";
  fontCss: string;
}[] = [
  // Sans-Serif Modern & Tech
  { id: "inter", label: "Inter", name: "Inter (Modern)", preview: "Modern & Clean", category: "Sans-Serif", fontCss: "'Inter', sans-serif" },
  { id: "roboto", label: "Roboto", name: "Roboto (Tech)", preview: "Clear & Standard", category: "Sans-Serif", fontCss: "'Roboto', sans-serif" },
  { id: "montserrat", label: "Montserrat", name: "Montserrat (Impact)", preview: "Geometric Impact", category: "Sans-Serif", fontCss: "'Montserrat', sans-serif" },
  { id: "poppins", label: "Poppins", name: "Poppins (Rounded)", preview: "Rounded & Warm", category: "Sans-Serif", fontCss: "'Poppins', sans-serif" },
  { id: "plus_jakarta", label: "Plus Jakarta", name: "Plus Jakarta Sans", preview: "Ultra-Modern UI", category: "Sans-Serif", fontCss: "'Plus Jakarta Sans', sans-serif" },
  { id: "outfit", label: "Outfit", name: "Outfit (Minimal)", preview: "Minimal & Pro", category: "Sans-Serif", fontCss: "'Outfit', sans-serif" },
  { id: "raleway", label: "Raleway", name: "Raleway (Elegant)", preview: "Slim & Elegant", category: "Sans-Serif", fontCss: "'Raleway', sans-serif" },
  { id: "lato", label: "Lato", name: "Lato (Balanced)", preview: "Corporate & Clean", category: "Sans-Serif", fontCss: "'Lato', sans-serif" },
  { id: "open_sans", label: "Open Sans", name: "Open Sans", preview: "Perfect Readability", category: "Sans-Serif", fontCss: "'Open Sans', sans-serif" },

  // Serif & Prestige
  { id: "playfair", label: "Playfair", name: "Playfair Display", preview: "Luxury & Editorial", category: "Serif", fontCss: "'Playfair Display', serif" },
  { id: "cinzel", label: "Cinzel", name: "Cinzel (Classic)", preview: "Royal & Antique", category: "Serif", fontCss: "'Cinzel', serif" },
  { id: "lora", label: "Lora", name: "Lora (Literary)", preview: "Poetic & Editorial", category: "Serif", fontCss: "'Lora', serif" },
  { id: "merriweather", label: "Merriweather", name: "Merriweather", preview: "Press & Magazine", category: "Serif", fontCss: "'Merriweather', serif" },
  { id: "cormorant", label: "Cormorant", name: "Cormorant Garamond", preview: "Haute Couture", category: "Serif", fontCss: "'Cormorant Garamond', serif" },

  // Display, Headlines & Posters
  { id: "bebas", label: "Bebas Neue", name: "Bebas Neue (Poster)", preview: "HEADLINE & POSTER", category: "Display", fontCss: "'Bebas Neue', sans-serif" },
  { id: "anton", label: "Anton", name: "Anton (Impact)", preview: "MEGA HEADLINE IMPACT", category: "Display", fontCss: "'Anton', sans-serif" },
  { id: "righteous", label: "Righteous", name: "Righteous (Retro)", preview: "Synthwave & 80s Pop", category: "Display", fontCss: "'Righteous', sans-serif" },
  { id: "syne", label: "Syne", name: "Syne (Avant-Garde)", preview: "Creative & Avant-Garde", category: "Display", fontCss: "'Syne', sans-serif" },
  { id: "oswald", label: "Oswald", name: "Oswald (Condensed)", preview: "BOLD CONDENSED", category: "Display", fontCss: "'Oswald', sans-serif" },
  { id: "russo_one", label: "Russo One", name: "Russo One (Block)", preview: "POWER & BLOCK", category: "Display", fontCss: "'Russo One', sans-serif" },

  // Monospace & Developer
  { id: "jetbrains", label: "JetBrains", name: "JetBrains Mono", preview: "const code = true;", category: "Monospace", fontCss: "'JetBrains Mono', monospace" },
  { id: "fira_code", label: "Fira Code", name: "Fira Code (Dev)", preview: "fn qr() -> &str", category: "Monospace", fontCss: "'Fira Code', monospace" },
  { id: "space_mono", label: "Space Mono", name: "Space Mono", preview: "01010011 // SCAN", category: "Monospace", fontCss: "'Space Mono', monospace" },

  // Cursive & Handwritten
  { id: "caveat", label: "Caveat", name: "Caveat (Marker)", preview: "Handwritten Script", category: "Cursive", fontCss: "'Caveat', cursive" },
  { id: "pacifico", label: "Pacifico", name: "Pacifico (Casual)", preview: "California & Fun", category: "Cursive", fontCss: "'Pacifico', cursive" },
  { id: "dancing_script", label: "Dancing Script", name: "Dancing Script", preview: "Free Calligraphy", category: "Cursive", fontCss: "'Dancing Script', cursive" },
  { id: "great_vibes", label: "Great Vibes", name: "Great Vibes (Signature)", preview: "Signature & Prestige", category: "Cursive", fontCss: "'Great Vibes', cursive" },

  // Futuristic & Cyber
  { id: "orbitron", label: "Orbitron", name: "Orbitron (Cyber)", preview: "CYBERPUNK // HUD", category: "Futuristic", fontCss: "'Orbitron', sans-serif" },
  { id: "audiowide", label: "Audiowide", name: "Audiowide (Techno)", preview: "TECHNO MATRIX", category: "Futuristic", fontCss: "'Audiowide', sans-serif" },
  { id: "chakra_petch", label: "Chakra Petch", name: "Chakra Petch (Mecha)", preview: "MECHA PROTOCOL", category: "Futuristic", fontCss: "'Chakra Petch', sans-serif" },
];

export function QRGenerator() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const paramUrl = searchParams.get("url") || "";
  const paramSlug = searchParams.get("slug") || "";
  const paramId = searchParams.get("id") || "";

  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");
  const plan = convexUser?.plan || (session?.user as any)?.plan || "FREEMIUM";
  const isProPlan = plan === "PRO" || plan === "BUSINESS";
  const [contentType, setContentType] = useState<QRContentType>("link");

  const [userLinks, setUserLinks] = useState<ShortLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const [matchedLink, setMatchedLink] = useState<ShortLink | null>(null);

  // Animation & GIF States
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(true);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [frameFilter, setFrameFilter] = useState<"all" | "static" | "animated">("all");

  // Content Inputs
  const [websiteUrl, setWebsiteUrl] = useState("https://lsho.cc/mon-lien");
  const [textContent, setTextContent] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [wifiEncryption, setWifiEncryption] = useState<"WPA" | "WEP" | "nopass">("WPA");
  const [emailAddress, setEmailAddress] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [smsNumber, setSmsNumber] = useState("");
  const [smsMessage, setSmsMessage] = useState("");

  // Style Inputs
  const [pixelStyle, setPixelStyle] = useState<PixelStyleType>("square");
  const [eyeStyle, setEyeStyle] = useState<EyeStyleType>("square");

  // Color Inputs
  const [colorMode, setColorMode] = useState<"monochrome" | "gradient">("monochrome");
  const [pixelColor, setPixelColor] = useState("#ff6600");
  const [pixelColor2, setPixelColor2] = useState("#ff3300"); // for gradient
  const [bgMode, setBgMode] = useState<"monochrome" | "transparent" | "gradient">("monochrome");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [bgColor2, setBgColor2] = useState("#f4f4f5");
  const [useSeparateEyeColor, setUseSeparateEyeColor] = useState(false);
  const [eyeColor, setEyeColor] = useState("#000000");

  // Center Logo / Text Inputs
  const [selectedLogo, setSelectedLogo] = useState<LogoType | string>("ql");
  const [centerText, setCenterText] = useState("SCAN");
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);

  // Frame Inputs
  const [selectedFrame, setSelectedFrame] = useState<FrameType>("bottom_pill");
  const [frameText, setFrameText] = useState("SCAN ME");
  const [frameColor, setFrameColor] = useState("#ff6600");

  // Typography Inputs
  const [fontFamily, setFontFamily] = useState<FontFamilyType>("inter");
  const [fontSize, setFontSize] = useState<number>(12);
  const [fontWeight, setFontWeight] = useState<FontWeightType>("bold");
  const [textTransform, setTextTransform] = useState<TextTransformType>("uppercase");
  const [fontCategoryFilter, setFontCategoryFilter] = useState<string>("all");
  const [fontSearchQuery, setFontSearchQuery] = useState<string>("");
  const [showAllFonts, setShowAllFonts] = useState<boolean>(false);

  // Advanced Options
  const [size, setSize] = useState(256);
  const [includeQuietZone, setIncludeQuietZone] = useState(true);

  // UI Expansion Toggles
  const [showMorePixels, setShowMorePixels] = useState(false);
  const [showMoreEyes, setShowMoreEyes] = useState(false);
  const [showMoreLogos, setShowMoreLogos] = useState(false);
  const [showMoreFrames, setShowMoreFrames] = useState(false);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);


  // 1. Initialize websiteUrl from searchParams
  useEffect(() => {
    if (paramUrl) {
      setContentType("link");
      setWebsiteUrl(paramUrl);
    } else if (paramSlug) {
      setContentType("link");
      setWebsiteUrl(
        typeof window !== "undefined"
          ? `${window.location.origin}/r/${paramSlug}`
          : `https://lsho.cc/r/${paramSlug}`
      );
    }
  }, [paramUrl, paramSlug]);

  // 2. Fetch user's links from Cloudflare D1
  useEffect(() => {
    if (!userId) return;
    const fetchLinks = async () => {
      setIsLoadingLinks(true);
      try {
        const res = await cfGetLinks(userId);
        const listData = Array.isArray(res?.data)
          ? res.data
          : Array.isArray((res?.data as any)?.data)
            ? (res?.data as any).data
            : [];
        setUserLinks(listData);
      } catch (e) {
        console.error("Failed to load user links in QR Studio:", e);
      } finally {
        setIsLoadingLinks(false);
      }
    };
    fetchLinks();
  }, [userId]);

  // 3. Find matching short link from database
  const findMatchingLink = (urlToTest: string): ShortLink | null => {
    if (!urlToTest || !userLinks.length) return null;
    const cleanInput = urlToTest.trim().toLowerCase();

    if (paramId) {
      const byId = userLinks.find((l) => l.id === paramId);
      if (byId) return byId;
    }

    let match = userLinks.find((l) => {
      const short = (l.shortUrl || "").trim().toLowerCase();
      return (
        short === cleanInput ||
        short.replace(/^https?:\/\//, "") === cleanInput.replace(/^https?:\/\//, "")
      );
    });
    if (match) return match;

    match = userLinks.find((l) => (l.slug || "").trim().toLowerCase() === cleanInput);
    if (match) return match;

    const slugFromInput = cleanInput
      .replace(/^https?:\/\/[^\/]+\/(r\/)?/, "")
      .replace(/^\//, "")
      .split("?")[0]
      .split("#")[0]
      .trim();

    if (slugFromInput) {
      match = userLinks.find(
        (l) => (l.slug || "").trim().toLowerCase() === slugFromInput
      );
      if (match) return match;
    }

    match = userLinks.find((l) => {
      const target = (l.targetUrl || "").trim().toLowerCase();
      return (
        target === cleanInput ||
        target.replace(/^https?:\/\//, "") === cleanInput.replace(/^https?:\/\//, "")
      );
    });
    if (match) return match;

    return null;
  };

  // 4. Update matched link whenever websiteUrl, userLinks or contentType changes
  useEffect(() => {
    if (contentType === "link" && websiteUrl) {
      const m = findMatchingLink(websiteUrl);
      setMatchedLink(m);
    } else {
      setMatchedLink(null);
    }
  }, [websiteUrl, contentType, userLinks, paramId]);

  // Build the raw QR content string
  const getRawQRValue = (): string => {
    switch (contentType) {
      case "link":
        return websiteUrl || "https://lsho.cc";
      case "text":
        return textContent || "LShorter Edge QR Code";
      case "wifi":
        return `WIFI:T:${wifiEncryption};S:${wifiSsid};P:${wifiPassword};;`;
      case "email":
        return `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}`;
      case "call":
        return `tel:${phoneNumber}`;
      case "sms":
        return `SMSTO:${smsNumber}:${smsMessage}`;
      default:
        return websiteUrl;
    }
  };

  // Generate V3 Valid JSON Configuration for Cloudflare D1 backend
  const getV3QRCodeConfigJSON = () => {
    return JSON.stringify({
      contentType,
      color: pixelColor,
      gradientColor: colorMode === "gradient" ? pixelColor2 : undefined,
      colorMode,
      bgColor,
      bgMode,
      pixelStyle,
      eyeStyle,
      useSeparateEyeColor,
      eyeColor: useSeparateEyeColor ? eyeColor : undefined,
      logoType: selectedLogo,
      logoUrl: uploadedLogo || undefined,
      centerText: selectedLogo === "text" ? centerText : undefined,
      frame: selectedFrame,
      frameText: selectedFrame !== "none" ? frameText : undefined,
      frameColor: selectedFrame !== "none" ? frameColor : undefined,
      fontFamily,
      fontSize,
      fontWeight,
      textTransform,
      size,
    });
  };

  // Calculate Frame Paddings
  const getFramePaddings = (frame: FrameType, quietZone: boolean) => {
    const basePad = quietZone ? 28 : 16;
    if (frame.startsWith("anim_")) {
      return { top: basePad + 8, bottom: 68, side: basePad + 8 };
    }
    switch (frame) {
      case "none":
        return { top: basePad, bottom: basePad, side: basePad };
      case "simple":
        return { top: basePad + 8, bottom: basePad + 8, side: basePad + 8 };
      case "bottom_pill":
        return { top: basePad + 6, bottom: 68, side: basePad + 6 };
      case "top_header":
        return { top: 64, bottom: basePad + 6, side: basePad + 6 };
      case "hand_arrow":
        return { top: basePad + 6, bottom: 62, side: basePad + 6 };
      case "modern_badge":
        return { top: basePad + 6, bottom: 68, side: basePad + 6 };
      case "neon":
        return { top: basePad + 12, bottom: 68, side: basePad + 12 };
      case "phone":
        return { top: 58, bottom: 58, side: basePad + 12 };
      case "tag_ticket":
        return { top: 54, bottom: 64, side: basePad + 8 };
      case "polaroid":
        return { top: 28, bottom: 78, side: basePad + 8 };
      case "luxury_gold":
        return { top: 44, bottom: 64, side: basePad + 10 };
      case "circular_badge":
        return { top: 40, bottom: 68, side: basePad + 10 };
      case "chat_bubble":
        return { top: basePad + 6, bottom: 72, side: basePad + 6 };
      case "gradient_border":
        return { top: basePad + 10, bottom: 66, side: basePad + 10 };
      default:
        return { top: basePad, bottom: basePad, side: basePad };
    }
  };

  // Reusable Multi-Frame Canvas Render Engine
  const renderFrameAtTime = (
    ctx: CanvasRenderingContext2D,
    totalWidth: number,
    totalHeight: number,
    qrDrawSize: number,
    paddings: { top: number; bottom: number; side: number },
    qr: any,
    timeSec: number
  ) => {
    // 1. Draw Background
    if (bgMode === "transparent") {
      ctx.clearRect(0, 0, totalWidth, totalHeight);
    } else if (bgMode === "gradient") {
      const grad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      grad.addColorStop(0, bgColor);
      grad.addColorStop(1, bgColor2);
      ctx.fillStyle = grad;
      ctx.roundRect(0, 0, totalWidth, totalHeight, 16);
      ctx.fill();
    } else {
      ctx.fillStyle = bgColor;
      ctx.roundRect(0, 0, totalWidth, totalHeight, 16);
      ctx.fill();
    }

    // 2. Draw Frame Decor (passing timeSec and dynamic typography)
    drawQRFrame(
      ctx,
      selectedFrame,
      totalWidth,
      totalHeight,
      frameColor,
      frameText,
      isProPlan,
      timeSec,
      fontFamily,
      fontSize,
      fontWeight,
      textTransform
    );

    // 3. Draw QR Modules
    const moduleCount = qr.modules.size;
    const cellSize = qrDrawSize / moduleCount;
    const startX = paddings.side;
    const startY = paddings.top;

    const isFinderEye = (r: number, c: number) => {
      if (r < 7 && c < 7) return true;
      if (r < 7 && c >= moduleCount - 7) return true;
      if (r >= moduleCount - 7 && c < 7) return true;
      return false;
    };

    const centerCutoutRadius = selectedLogo !== "none" ? Math.floor(moduleCount * 0.16) : 0;
    const centerMid = Math.floor(moduleCount / 2);
    const isCenterLogoArea = (r: number, c: number) => {
      if (selectedLogo === "none") return false;
      return (
        Math.abs(r - centerMid) <= centerCutoutRadius &&
        Math.abs(c - centerMid) <= centerCutoutRadius
      );
    };

    let fillStyle: string | CanvasGradient = pixelColor;
    if (colorMode === "gradient") {
      const grad = ctx.createLinearGradient(startX, startY, startX + qrDrawSize, startY + qrDrawSize);
      grad.addColorStop(0, pixelColor);
      grad.addColorStop(1, pixelColor2);
      fillStyle = grad;
    }

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (isFinderEye(r, c) || isCenterLogoArea(r, c)) continue;

        if (qr.modules.get(r, c)) {
          const x = startX + c * cellSize;
          const y = startY + r * cellSize;
          drawPixelModule(ctx, x, y, cellSize, pixelStyle, fillStyle);
        }
      }
    }

    // 4. Draw Distinct Finder Eyes (3 Corners)
    const eyeFill = useSeparateEyeColor ? eyeColor : pixelColor;
    drawFinderEye(ctx, 0, 0, cellSize, startX, startY, eyeStyle, eyeFill);
    drawFinderEye(ctx, 0, moduleCount - 7, cellSize, startX, startY, eyeStyle, eyeFill);
    drawFinderEye(ctx, moduleCount - 7, 0, cellSize, startX, startY, eyeStyle, eyeFill);

    // 5. Draw Authentic Center Logo
    if (selectedLogo !== "none") {
      const centerBoxSize = (centerCutoutRadius * 2 + 1.5) * cellSize;
      const centerBoxX = startX + (moduleCount * cellSize - centerBoxSize) / 2;
      const centerBoxY = startY + (moduleCount * cellSize - centerBoxSize) / 2;
      drawCenterLogo(
        ctx,
        centerBoxX,
        centerBoxY,
        centerBoxSize,
        selectedLogo,
        uploadedLogo,
        centerText,
        pixelColor,
        bgColor,
        fontFamily,
        fontSize,
        fontWeight,
        textTransform
      );
    }
  };

  // Render Full QR Code Canvas with 60 FPS requestAnimationFrame
  useEffect(() => {
    const rawData = getRawQRValue();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const qr = QRCode.create(rawData, {
      errorCorrectionLevel: "H",
    });

    const paddings = getFramePaddings(selectedFrame, includeQuietZone);
    const qrDrawSize = size;
    const totalWidth = qrDrawSize + paddings.side * 2;
    const totalHeight = qrDrawSize + paddings.top + paddings.bottom;

    canvas.width = totalWidth * 2;
    canvas.height = totalHeight * 2;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${totalHeight}px`;

    const isAnim = isAnimatedFrame(selectedFrame);
    let animationId: number;
    const startTime = performance.now();

    const loop = (now: number) => {
      try {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        const timeSec = (now - startTime) / 1000;
        renderFrameAtTime(
          ctx,
          totalWidth,
          totalHeight,
          qrDrawSize,
          paddings,
          qr,
          isAnim && isPlayingAnimation ? timeSec : 0
        );
      } catch (err) {
        console.error("QR canvas render loop error:", err);
      } finally {
        ctx.restore();
      }

      if (isAnim && isPlayingAnimation) {
        animationId = requestAnimationFrame(loop);
      }
    };

    loop(performance.now());

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
  }, [
    contentType,
    websiteUrl,
    textContent,
    wifiSsid,
    wifiPassword,
    wifiEncryption,
    emailAddress,
    emailSubject,
    phoneNumber,
    smsNumber,
    smsMessage,
    pixelStyle,
    eyeStyle,
    colorMode,
    pixelColor,
    pixelColor2,
    bgMode,
    bgColor,
    bgColor2,
    useSeparateEyeColor,
    eyeColor,
    selectedLogo,
    centerText,
    uploadedLogo,
    selectedFrame,
    frameText,
    frameColor,
    fontFamily,
    fontSize,
    fontWeight,
    textTransform,
    size,
    includeQuietZone,
    isProPlan,
    isPlayingAnimation,
  ]);

  const handlePresetSelect = (hex: string) => {
    setPixelColor(hex);
  };

  const handleResetColors = () => {
    setPixelColor("#ff6600");
    setPixelColor2("#ff3300");
    setColorMode("monochrome");
    setBgColor("#ffffff");
    setBgColor2("#f4f4f5");
    setBgMode("monochrome");
    setUseSeparateEyeColor(false);
    setEyeColor("#000000");
    setFrameColor("#ff6600");
    showToast.success("Color palette reset to defaults");
  };

  const handleResetTypography = () => {
    setFontFamily("inter");
    setFontSize(12);
    setFontWeight("bold");
    setTextTransform("uppercase");
    showToast.success("Typography reset to defaults");
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        reason: "Uploading a custom logo is reserved for the Pro plan.",
        featureName: "Custom QR Logo",
      });
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedLogo(event.target?.result as string);
      setSelectedLogo("custom");
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    };
    reader.readAsDataURL(file);

    try {
      const uploadRes = await cfUploadImage(file, "qr_logos");
      if (uploadRes.success && uploadRes.url) {
        setUploadedLogo(uploadRes.url);
        showToast.success("Custom logo successfully uploaded to Cloud!");
      } else {
        showToast.success("Custom logo loaded locally!");
      }
    } catch {
      showToast.success("Custom logo loaded successfully!");
    }
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `lshorter-qr-${contentType}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    confetti({ particleCount: 30, spread: 50 });
    showToast.success("PNG QR Code downloaded successfully!");
  };

  const downloadSVG = async () => {
    const rawData = getRawQRValue();
    try {
      const svgString = await QRCode.toString(rawData, {
        type: "svg",
        width: size,
        margin: includeQuietZone ? 2 : 0,
        color: {
          dark: pixelColor,
          light: bgColor === "transparent" ? "#00000000" : bgColor,
        },
      });

      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `lshorter-qr-${contentType}.svg`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      confetti({ particleCount: 30, spread: 50 });
      showToast.success("Vector SVG QR Code downloaded!");
    } catch (e) {
      console.error("SVG generation error:", e);
      showToast.error("Error generating SVG");
    }
  };

  const downloadGIF = async () => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        reason: "Exporting animated QR codes in GIF format is reserved for the Pro plan.",
        featureName: "Animated GIF Export",
      });
      return;
    }

    setIsGeneratingGif(true);
    setGifProgress(0);

    // Yield to render progress state in UI
    await new Promise((r) => setTimeout(r, 60));

    try {
      const rawData = getRawQRValue();
      const qr = QRCode.create(rawData, {
        errorCorrectionLevel: "H",
      });

      const paddings = getFramePaddings(selectedFrame, includeQuietZone);
      const qrDrawSize = size;
      const totalWidth = qrDrawSize + paddings.side * 2;
      const totalHeight = qrDrawSize + paddings.top + paddings.bottom;

      const offscreen = document.createElement("canvas");
      offscreen.width = totalWidth;
      offscreen.height = totalHeight;
      const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!offCtx) throw new Error("Unable to initialize offscreen canvas context");

      const gif = GIFEncoder();
      const fps = 20;
      const durationSec = 2.4; // smooth loop
      const totalFrames = Math.round(fps * durationSec);
      const delayMs = 1000 / fps;

      for (let f = 0; f < totalFrames; f++) {
        const timeSec = (f / totalFrames) * durationSec;
        offCtx.clearRect(0, 0, totalWidth, totalHeight);
        renderFrameAtTime(offCtx, totalWidth, totalHeight, qrDrawSize, paddings, qr, timeSec);

        const imgData = offCtx.getImageData(0, 0, totalWidth, totalHeight);
        const palette = quantize(imgData.data, 256);
        const index = applyPalette(imgData.data, palette);
        gif.writeFrame(index, totalWidth, totalHeight, { palette, delay: delayMs });

        setGifProgress(Math.round(((f + 1) / totalFrames) * 100));
        if (f % 4 === 0) {
          await new Promise((r) => setTimeout(r, 10));
        }
      }

      gif.finish();
      const bytes = gif.bytes();
      const blob = new Blob([bytes as any], { type: "image/gif" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `lshorter-qr-${selectedFrame}-${contentType}.gif`;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);

      confetti({ particleCount: 40, spread: 60 });
      showToast.success("Animated GIF QR Code exported successfully!");
    } catch (err) {
      console.error("GIF export error:", err);
      showToast.error("Error creating animated GIF.");
    } finally {
      setIsGeneratingGif(false);
      setGifProgress(0);
    }
  };

  const handleSaveCustomization = async () => {
    if (contentType !== "link") {
      showToast.error("Customization saving is only available for short link URLs.");
      return;
    }

    if (!websiteUrl || !websiteUrl.trim()) {
      showToast.error("Please enter a short link URL.");
      return;
    }

    setIsSavingCustomization(true);

    try {
      let currentLinks = userLinks;
      if (!currentLinks.length && userId) {
        const res = await cfGetLinks(userId);
        currentLinks = Array.isArray(res?.data)
          ? res.data
          : Array.isArray((res?.data as any)?.data)
            ? (res?.data as any).data
            : [];
        setUserLinks(currentLinks);
      }

      const target = findMatchingLink(websiteUrl);

      if (!target) {
        showToast.error("This URL does not exist in your short link database.");
        setIsSavingCustomization(false);
        return;
      }

      const configJson = getV3QRCodeConfigJSON();
      const canvas = canvasRef.current;
      const qrDataUrl = canvas ? canvas.toDataURL("image/png") : undefined;

      await cfUpdateLink(target.id, {
        qrCodeConfig: configJson,
        qrCode: qrDataUrl,
      });

      cfInvalidateCache();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("lshorter_links_updated"));
        window.dispatchEvent(new CustomEvent("lshorter_data_change"));
      }

      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
      showToast.success(`QR Code design successfully saved for link /${target.slug}!`);
    } catch (err: any) {
      console.error("Save QR error:", err);
      showToast.error("Error saving customization.");
    } finally {
      setIsSavingCustomization(false);
    }
  };

  const copyConfigJSON = () => {
    const json = getV3QRCodeConfigJSON();
    navigator.clipboard.writeText(json);
    showToast.success("V3 JSON configuration copied to clipboard!");
    confetti({ particleCount: 25, spread: 45 });
  };

  // Pixel Motifs Definitions
  const PIXEL_STYLES = [
    { id: "square" as const, label: "Squares", icon: "■", isPro: false },
    { id: "rounded" as const, label: "Rounded", icon: "●", isPro: false },
    { id: "dots" as const, label: "Dots", icon: "•", isPro: true },
    { id: "diamond" as const, label: "Diamonds", icon: "◆", isPro: true },
    { id: "classy" as const, label: "Classy", icon: "◈", isPro: true },
    { id: "stars" as const, label: "Stars", icon: "★", isPro: true },
    { id: "lines" as const, label: "Lines", icon: "▬", isPro: true },
    { id: "vertical_bars" as const, label: "Bars", icon: "▮", isPro: true },
    { id: "cross" as const, label: "Cross +", icon: "✚", isPro: true },
    { id: "hexagon_dots" as const, label: "Hexagons", icon: "⬡", isPro: true },
    { id: "heart" as const, label: "Hearts", icon: "♥", isPro: true },
    { id: "cyber_tiles" as const, label: "Cyber", icon: "⯃", isPro: true },
    { id: "sparkle" as const, label: "Sparkles", icon: "✦", isPro: true },
    { id: "pill" as const, label: "Pills", icon: "⬭", isPro: true },
    { id: "fluid" as const, label: "Fluid", icon: "◎", isPro: true },
  ];

  // Finder Eyes Definitions
  const EYE_STYLES = [
    {
      id: "square" as const,
      label: "Square",
      isPro: false,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="18" height="18" />
          <rect x="8" y="8" width="8" height="8" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "rounded" as const,
      label: "Rounded",
      isPro: false,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <rect x="8" y="8" width="8" height="8" rx="2" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "circle" as const,
      label: "Circle",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "leaf" as const,
      label: "Leaf",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M3 12 C3 5 5 3 12 3 L21 3 L21 12 C21 19 19 21 12 21 L3 21 Z" />
          <path d="M8 12 C8 8 9 8 12 8 L16 8 L16 12 C16 16 15 16 12 16 L8 16 Z" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "hexagon" as const,
      label: "Hexagon",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="12 2, 21 7, 21 17, 12 22, 3 17, 3 7" />
          <polygon points="12 6, 17 9, 17 15, 12 18, 7 15, 7 9" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "star" as const,
      label: "Star",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
          <path d="M12 7 L13.5 10.5 L17 12 L13.5 13.5 L12 17 L10.5 13.5 L7 12 L10.5 10.5 Z" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "cyber" as const,
      label: "Cyber",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="12 2, 22 12, 12 22, 2 12" />
          <polygon points="12 7, 17 12, 12 17, 7 12" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "diamond_eye" as const,
      label: "Diamond",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polygon points="12 2, 22 12, 12 22, 2 12" />
          <polygon points="12 6, 18 12, 12 18, 6 12" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "shield" as const,
      label: "Shield",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 2 L20 6 V13 C20 18 12 22 12 22 C12 22 4 18 4 13 V6 Z" />
          <path d="M12 7 L16 9 V13 C16 16 12 18 12 18 C12 18 8 16 8 13 V9 Z" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "target" as const,
      label: "Target",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="12" cy="12" r="2" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "petal" as const,
      label: "Petal",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <rect x="3" y="3" width="18" height="18" rx="8" />
          <rect x="8" y="8" width="8" height="8" rx="4" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "double_circle" as const,
      label: "Double Ring",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="9.5" />
          <circle cx="12" cy="12" r="6.5" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "bracket" as const,
      label: "Brackets [ ]",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M7 3 H3 V7 M17 3 H21 V7 M3 17 V21 H7 M21 17 V21 H17" />
          <rect x="8.5" y="8.5" width="7" height="7" fill="currentColor" />
        </svg>
      ),
    },
    {
      id: "heart_eye" as const,
      label: "Heart",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
    },
    {
      id: "gear" as const,
      label: "Gear",
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="7" strokeDasharray="3 2" strokeWidth="3" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      ),
    },
  ];

  // Real Logos List
  const LOGO_LIST: Array<{ id: LogoType | string; label: string; isPro: boolean; iconNode: React.ReactNode }> = [
    { id: "none", label: "None", isPro: false, iconNode: <X className="w-5 h-5 text-neutral-400" /> },
    { id: "custom", label: "Upload Image", isPro: true, iconNode: <Upload className="w-4 h-4 text-[#ff6600]" /> },
    { id: "text", label: "Custom Text", isPro: true, iconNode: <Type className="w-4 h-4 text-neutral-200" /> },
    { id: "ql", label: "LShorter", isPro: false, iconNode: BrandIcons.ql },
    { id: "facebook", label: "Facebook", isPro: false, iconNode: BrandIcons.facebook },
    { id: "instagram", label: "Instagram", isPro: false, iconNode: BrandIcons.instagram },
    { id: "twitter", label: "X / Twitter", isPro: true, iconNode: BrandIcons.twitter },
    { id: "whatsapp", label: "WhatsApp", isPro: false, iconNode: BrandIcons.whatsapp },
    { id: "tiktok", label: "TikTok", isPro: true, iconNode: BrandIcons.tiktok },
    { id: "youtube", label: "YouTube", isPro: true, iconNode: BrandIcons.youtube },
    { id: "linkedin", label: "LinkedIn", isPro: true, iconNode: BrandIcons.linkedin },
    { id: "spotify", label: "Spotify", isPro: true, iconNode: BrandIcons.spotify },
    { id: "telegram", label: "Telegram", isPro: true, iconNode: BrandIcons.telegram },
    { id: "discord", label: "Discord", isPro: true, iconNode: BrandIcons.discord },
    { id: "snapchat", label: "Snapchat", isPro: true, iconNode: BrandIcons.snapchat },
    { id: "github", label: "GitHub", isPro: true, iconNode: BrandIcons.github },
    { id: "paypal", label: "PayPal", isPro: true, iconNode: BrandIcons.paypal },
    { id: "apple", label: "Apple", isPro: true, iconNode: BrandIcons.apple },
    { id: "google", label: "Google", isPro: true, iconNode: BrandIcons.google },
    { id: "stripe", label: "Stripe", isPro: true, iconNode: BrandIcons.stripe },
    { id: "shopify", label: "Shopify", isPro: true, iconNode: BrandIcons.shopify },
    { id: "amazon", label: "Amazon", isPro: true, iconNode: BrandIcons.amazon },
    { id: "visa", label: "Visa", isPro: true, iconNode: BrandIcons.visa },
    { id: "mastercard", label: "Mastercard", isPro: true, iconNode: BrandIcons.mastercard },
    { id: "twitch", label: "Twitch", isPro: true, iconNode: BrandIcons.twitch },
    { id: "reddit", label: "Reddit", isPro: true, iconNode: BrandIcons.reddit },
    { id: "threads", label: "Threads", isPro: true, iconNode: BrandIcons.threads },
    { id: "slack", label: "Slack", isPro: true, iconNode: BrandIcons.slack },
    { id: "notion", label: "Notion", isPro: true, iconNode: BrandIcons.notion },
    { id: "airbnb", label: "Airbnb", isPro: true, iconNode: BrandIcons.airbnb },
    { id: "uber", label: "Uber", isPro: true, iconNode: BrandIcons.uber },
    // Sport Brands
    { id: "nike", label: "Nike", isPro: true, iconNode: BrandIcons.nike },
    { id: "adidas", label: "Adidas", isPro: true, iconNode: BrandIcons.adidas },
    { id: "puma", label: "Puma", isPro: true, iconNode: BrandIcons.puma },
    { id: "jordan", label: "Air Jordan", isPro: true, iconNode: BrandIcons.jordan },
    { id: "nba", label: "NBA", isPro: true, iconNode: BrandIcons.nba },
    { id: "formula1", label: "Formula 1", isPro: true, iconNode: BrandIcons.formula1 },
    { id: "football_ball", label: "Football ⚽", isPro: true, iconNode: BrandIcons.football_ball },
    { id: "gym_fitness", label: "Fitness Gym", isPro: true, iconNode: BrandIcons.gym_fitness },
    { id: "tennis_ball", label: "Tennis 🎾", isPro: true, iconNode: BrandIcons.tennis_ball },
    { id: "redbull", label: "Red Bull", isPro: true, iconNode: BrandIcons.redbull },
    // Tech Dev, Frameworks & Cloud
    { id: "nextjs", label: "Next.js", isPro: true, iconNode: BrandIcons.nextjs },
    { id: "react", label: "React", isPro: true, iconNode: BrandIcons.react },
    { id: "vue", label: "Vue.js", isPro: true, iconNode: BrandIcons.vue },
    { id: "angular", label: "Angular", isPro: true, iconNode: BrandIcons.angular },
    { id: "svelte", label: "Svelte", isPro: true, iconNode: BrandIcons.svelte },
    { id: "tanstack", label: "TanStack", isPro: true, iconNode: BrandIcons.tanstack },
    { id: "prisma", label: "Prisma", isPro: true, iconNode: BrandIcons.prisma },
    { id: "mongodb", label: "MongoDB", isPro: true, iconNode: BrandIcons.mongodb },
    { id: "postgres", label: "PostgreSQL", isPro: true, iconNode: BrandIcons.postgres },
    { id: "supabase", label: "Supabase", isPro: true, iconNode: BrandIcons.supabase },
    { id: "tailwind", label: "Tailwind CSS", isPro: true, iconNode: BrandIcons.tailwind },
    { id: "nodejs", label: "Node.js", isPro: true, iconNode: BrandIcons.nodejs },
    { id: "typescript", label: "TypeScript", isPro: true, iconNode: BrandIcons.typescript },
    { id: "python", label: "Python", isPro: true, iconNode: BrandIcons.python },
    { id: "rust", label: "Rust 🦀", isPro: true, iconNode: BrandIcons.rust },
    { id: "golang", label: "Go", isPro: true, iconNode: BrandIcons.golang },
    { id: "cplusplus", label: "C++", isPro: true, iconNode: BrandIcons.cplusplus },
    { id: "java", label: "Java", isPro: true, iconNode: BrandIcons.java },
    { id: "git", label: "Git", isPro: true, iconNode: BrandIcons.git },
    { id: "gitlab", label: "GitLab", isPro: true, iconNode: BrandIcons.gitlab },
    { id: "docker", label: "Docker", isPro: true, iconNode: BrandIcons.docker },
    { id: "kubernetes", label: "Kubernetes", isPro: true, iconNode: BrandIcons.kubernetes },
    { id: "linux", label: "Linux 🐧", isPro: true, iconNode: BrandIcons.linux },
    { id: "redis", label: "Redis", isPro: true, iconNode: BrandIcons.redis },
    { id: "graphql", label: "GraphQL", isPro: true, iconNode: BrandIcons.graphql },
    { id: "figma", label: "Figma", isPro: true, iconNode: BrandIcons.figma },
    { id: "linear", label: "Linear", isPro: true, iconNode: BrandIcons.linear },
    { id: "aws", label: "AWS", isPro: true, iconNode: BrandIcons.aws },
    { id: "cloudflare", label: "Cloudflare", isPro: true, iconNode: BrandIcons.cloudflare },
    { id: "vercel", label: "Vercel", isPro: true, iconNode: BrandIcons.vercel },
    { id: "vite", label: "Vite", isPro: true, iconNode: BrandIcons.vite },
    { id: "bun", label: "Bun 🥟", isPro: true, iconNode: BrandIcons.bun },
    { id: "astro", label: "Astro", isPro: true, iconNode: BrandIcons.astro },
    { id: "nestjs", label: "NestJS", isPro: true, iconNode: BrandIcons.nestjs },
    { id: "fastapi", label: "FastAPI", isPro: true, iconNode: BrandIcons.fastapi },
    { id: "django", label: "Django", isPro: true, iconNode: BrandIcons.django },
    { id: "laravel", label: "Laravel", isPro: true, iconNode: BrandIcons.laravel },
    { id: "flutter", label: "Flutter", isPro: true, iconNode: BrandIcons.flutter },
    { id: "postman", label: "Postman", isPro: true, iconNode: BrandIcons.postman },
    { id: "clerk", label: "Clerk", isPro: true, iconNode: BrandIcons.clerk },
    { id: "neon_db", label: "Neon DB", isPro: true, iconNode: BrandIcons.neon_db },
    { id: "resend", label: "Resend", isPro: true, iconNode: BrandIcons.resend },
    // Marketing, Ads & Growth
    { id: "hubspot", label: "HubSpot", isPro: true, iconNode: BrandIcons.hubspot },
    { id: "mailchimp", label: "Mailchimp", isPro: true, iconNode: BrandIcons.mailchimp },
    { id: "meta_ads", label: "Meta Ads", isPro: true, iconNode: BrandIcons.meta_ads },
    { id: "google_ads", label: "Google Ads", isPro: true, iconNode: BrandIcons.google_ads },
    { id: "salesforce", label: "Salesforce", isPro: true, iconNode: BrandIcons.salesforce },
    { id: "semrush", label: "Semrush", isPro: true, iconNode: BrandIcons.semrush },
    { id: "ahrefs", label: "Ahrefs", isPro: true, iconNode: BrandIcons.ahrefs },
    { id: "klaviyo", label: "Klaviyo", isPro: true, iconNode: BrandIcons.klaviyo },
    { id: "zapier", label: "Zapier", isPro: true, iconNode: BrandIcons.zapier },
    { id: "make", label: "Make", isPro: true, iconNode: BrandIcons.make },
    { id: "webflow", label: "Webflow", isPro: true, iconNode: BrandIcons.webflow },
    { id: "wordpress", label: "WordPress", isPro: true, iconNode: BrandIcons.wordpress },
    { id: "google_analytics", label: "Google Analytics", isPro: true, iconNode: BrandIcons.google_analytics },
    // AI
    { id: "openai", label: "ChatGPT / OpenAI", isPro: true, iconNode: BrandIcons.openai },
    { id: "anthropic", label: "Anthropic / Claude", isPro: true, iconNode: BrandIcons.anthropic },
    { id: "gemini", label: "Google Gemini", isPro: true, iconNode: BrandIcons.gemini },
    { id: "midjourney", label: "Midjourney", isPro: true, iconNode: BrandIcons.midjourney },
    { id: "huggingface", label: "Hugging Face", isPro: true, iconNode: BrandIcons.huggingface },
    { id: "mistral", label: "Mistral AI", isPro: true, iconNode: BrandIcons.mistral },
    { id: "deepseek", label: "DeepSeek", isPro: true, iconNode: BrandIcons.deepseek },
    // Google & Mail
    { id: "gmail", label: "Gmail (Google)", isPro: true, iconNode: BrandIcons.gmail },
    // WiFi & Connexions
    { id: "wifi_classic", label: "WiFi Signal", isPro: false, iconNode: BrandIcons.wifi_classic },
    { id: "wifi_free", label: "Free WiFi Zone", isPro: false, iconNode: BrandIcons.wifi_free },
    { id: "wifi_secure", label: "Secure WiFi 🔒", isPro: true, iconNode: BrandIcons.wifi_secure },
    { id: "wifi_5g", label: "WiFi 5G Max ⚡", isPro: true, iconNode: BrandIcons.wifi_5g },
    // Appels & Téléphonie
    { id: "phone_call", label: "Direct Call 📞", isPro: false, iconNode: BrandIcons.phone_call },
    { id: "phone_support", label: "Customer Support 🎧", isPro: true, iconNode: BrandIcons.phone_support },
    { id: "phone_sos", label: "SOS Emergency 🚨", isPro: true, iconNode: BrandIcons.phone_sos },
    { id: "whatsapp_call", label: "WhatsApp Call 🟢", isPro: true, iconNode: BrandIcons.whatsapp_call },
    // Badges & Crypto
    { id: "cart", label: "E-Commerce", isPro: true, iconNode: BrandIcons.cart },
    { id: "crypto_btc", label: "Bitcoin ₿", isPro: true, iconNode: BrandIcons.crypto_btc },
    { id: "wifi_icon", label: "WiFi Hotspot", isPro: true, iconNode: BrandIcons.wifi_icon },
    { id: "shield_icon", label: "Security", isPro: true, iconNode: BrandIcons.shield_icon },
    { id: "star_icon", label: "VIP Prestige", isPro: true, iconNode: BrandIcons.star_icon },
  ];

  // Premium Frames List (14 Statics + 40 Animated Ultra-Pro)
  const FRAME_LIST: Array<{
    id: FrameType;
    label: string;
    isPro: boolean;
    isAnimated?: boolean;
    previewIcon: React.ReactNode;
  }> = [
    // --- Cadres Statiques ---
    { id: "none", label: "None", isPro: false, previewIcon: <X className="w-5 h-5 text-neutral-400" /> },
    { id: "simple", label: "Thin Frame", isPro: false, previewIcon: <div className="w-6 h-6 border-2 border-current rounded-[8px]" /> },
    { id: "bottom_pill", label: "Bottom Pill", isPro: false, previewIcon: <div className="flex flex-col items-center gap-0.5"><div className="w-5 h-4 border-2 border-current rounded-[6px]" /><span className="bg-[#ff6600] text-white px-1 text-[6px] font-bold rounded">SCAN</span></div> },
    { id: "top_header", label: "Top Header", isPro: true, previewIcon: <div className="flex flex-col items-center gap-0.5"><span className="bg-[#ff6600] text-white px-1 text-[6px] font-bold rounded">SCAN</span><div className="w-5 h-4 border-2 border-current rounded-[6px]" /></div> },
    { id: "hand_arrow", label: "Handwritten Arrow", isPro: true, previewIcon: <span className="italic text-[10px] font-serif">Scan me ⤹</span> },
    { id: "modern_badge", label: "Star Badge", isPro: true, previewIcon: <div className="flex flex-col items-center gap-0.5"><div className="w-5 h-4 border border-current rounded-[6px]" /><span className="text-[#ff6600] text-[8px] font-bold">★ SCAN ★</span></div> },
    { id: "neon", label: "Neon Glow", isPro: true, previewIcon: <div className="w-6 h-6 border-2 border-[#ff6600] rounded-[8px] shadow-[0_0_8px_#ff6600]" /> },
    { id: "phone", label: "Smartphone Mockup", isPro: true, previewIcon: <Smartphone className="w-5 h-5 text-[#ff6600]" /> },
    { id: "tag_ticket", label: "Promo Ticket", isPro: true, previewIcon: <Tag className="w-5 h-5 text-emerald-400" /> },
    { id: "polaroid", label: "Vintage Polaroid", isPro: true, previewIcon: <div className="w-6 h-7 border-2 border-current rounded-sm flex flex-col justify-end p-0.5"><div className="w-full h-1.5 bg-neutral-500 rounded-xs" /></div> },
    { id: "luxury_gold", label: "Prestige Gold", isPro: true, previewIcon: <div className="w-6 h-6 border-2 border-amber-400 p-0.5 rounded-[4px]"><div className="w-full h-full border border-amber-300" /></div> },
    { id: "circular_badge", label: "Verified Badge", isPro: true, previewIcon: <Shield className="w-5 h-5 text-sky-400" /> },
    { id: "chat_bubble", label: "Chat Bubble", isPro: true, previewIcon: <MessageCircle className="w-5 h-5 text-pink-400" /> },
    { id: "gradient_border", label: "Sunset Gradient", isPro: true, previewIcon: <div className="w-6 h-6 rounded-[8px] bg-gradient-to-tr from-[#ff007a] via-[#ff6600] to-[#7928ca] p-0.5"><div className="w-full h-full bg-[#141416] rounded-[6px]" /></div> },

    // --- Cadres Animés Ultra-Premium ---
    {
      id: "anim_christmas",
      label: "🎄 Christmas & Holidays",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-red-500">🎄<span className="text-[9px] absolute -top-1 -right-1">✨</span></div>,
    },
    {
      id: "anim_halloween",
      label: "🎃 Halloween",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-amber-500">🎃<span className="text-[9px] absolute -top-1 -right-1">👻</span></div>,
    },
    {
      id: "anim_sport",
      label: "⚡ Sport & Energy",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-lime-400">⚡<span className="text-[9px] absolute -top-1 -right-1">🔥</span></div>,
    },
    {
      id: "anim_manga",
      label: "🎌 Manga / Anime",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-pink-500">🎌<span className="text-[9px] absolute -top-1 -right-1">💥</span></div>,
    },
    {
      id: "anim_rain",
      label: "🌧️ Rain & Water",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-cyan-400">🌧️<span className="text-[9px] absolute -top-1 -right-1">💧</span></div>,
    },
    {
      id: "anim_snow",
      label: "❄️ Snowflakes",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-sky-200">❄️<span className="text-[9px] absolute -top-1 -right-1">✨</span></div>,
    },
    {
      id: "anim_cloud",
      label: "☁️ Floating Clouds",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-indigo-300">☁️<span className="text-[9px] absolute -top-1 -right-1">🌤️</span></div>,
    },
    {
      id: "anim_storm",
      label: "⛈️ Electric Storm",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-yellow-400">⛈️<span className="text-[9px] absolute -top-1 -right-1">⚡</span></div>,
    },
    {
      id: "anim_cyberpunk",
      label: "🔮 Cyberpunk Neon",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-fuchsia-400">🔮<span className="text-[9px] absolute -top-1 -right-1">✨</span></div>,
    },
    {
      id: "anim_galaxy",
      label: "🌌 Starry Galaxy",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-violet-400">🌌<span className="text-[9px] absolute -top-1 -right-1">⭐</span></div>,
    },
    {
      id: "anim_fire",
      label: "🔥 Blazing Flames",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-orange-500">🔥<span className="text-[9px] absolute -top-1 -right-1">✨</span></div>,
    },
    {
      id: "anim_luxury_gold",
      label: "👑 Sparkling Gold",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-amber-400">👑<span className="text-[9px] absolute -top-1 -right-1">💎</span></div>,
    },
    {
      id: "anim_hearts",
      label: "💖 Floating Hearts",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-rose-500">💖<span className="text-[9px] absolute -top-1 -right-1">✨</span></div>,
    },
    {
      id: "anim_waves",
      label: "🌊 Ocean Waves",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-teal-400">🌊<span className="text-[9px] absolute -top-1 -right-1">🫧</span></div>,
    },
    {
      id: "anim_diamond",
      label: "💎 Diamond Prism",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-cyan-300">💎<span className="text-[9px] absolute -top-1 -right-1">✨</span></div>,
    },
    {
      id: "anim_music",
      label: "🎵 Soundwaves",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-violet-400">🎵<span className="text-[9px] absolute -top-1 -right-1">🎶</span></div>,
    },
    {
      id: "anim_arcade",
      label: "🕹️ Pixel Arcade",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-yellow-400">🕹️<span className="text-[9px] absolute -top-1 -right-1">👾</span></div>,
    },
    {
      id: "anim_nature",
      label: "🌿 Botanical Forest",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-emerald-400">🌿<span className="text-[9px] absolute -top-1 -right-1">🍃</span></div>,
    },
    {
      id: "anim_coffee",
      label: "☕ Coffee Steam",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-amber-600">☕<span className="text-[9px] absolute -top-1 -right-1">♨️</span></div>,
    },
    {
      id: "anim_fireworks",
      label: "🎆 Fireworks",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-pink-400">🎆<span className="text-[9px] absolute -top-1 -right-1">🎇</span></div>,
    },
    {
      id: "anim_f1_racing",
      label: "🏎️ F1 Grand Prix",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-red-500">🏎️<span className="text-[9px] absolute -top-1 -right-1 font-mono text-[9px]">🏁</span></div>,
    },
    {
      id: "anim_basketball",
      label: "🏀 NBA All-Star",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-orange-500">🏀<span className="text-[9px] absolute -top-1 -right-1">🔥</span></div>,
    },
    {
      id: "anim_football",
      label: "⚽ Football Stadium",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-emerald-400">⚽<span className="text-[9px] absolute -top-1 -right-1">🏆</span></div>,
    },
    {
      id: "anim_tennis",
      label: "🎾 Tennis Court",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-lime-400">🎾<span className="text-[9px] absolute -top-1 -right-1">🏆</span></div>,
    },
    {
      id: "anim_boxing",
      label: "🥊 Fight Ring",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-red-600">🥊<span className="text-[9px] absolute -top-1 -right-1">💥</span></div>,
    },
    {
      id: "anim_terminal_code",
      label: "💻 CLI Terminal",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="text-[9px] font-mono font-bold text-emerald-400 border border-emerald-500/40 px-1 py-0.5 rounded shadow-[0_0_6px_#22c55e]">&gt;_DEV</div>,
    },
    {
      id: "anim_rocket_launch",
      label: "🚀 Space Mission",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-sky-400">🚀<span className="text-[9px] absolute -top-1 -right-1">🌌</span></div>,
    },
    {
      id: "anim_aurora",
      label: "🌌 Northern Lights",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-teal-300">🌌<span className="text-[9px] absolute -top-1 -right-1">✨</span></div>,
    },
    {
      id: "anim_dna_biotech",
      label: "🧬 DNA Biotech",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-cyan-400">🧬<span className="text-[9px] absolute -top-1 -right-1">🔬</span></div>,
    },
    {
      id: "anim_glitch",
      label: "⚡ Cyber Glitch",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-fuchsia-400">⚡<span className="text-[9px] absolute -top-1 -right-1 font-mono">01</span></div>,
    },
    {
      id: "anim_sunset_vibes",
      label: "🌅 80s Sunset",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-amber-500">🌅<span className="text-[9px] absolute -top-1 -right-1">🌴</span></div>,
    },
    {
      id: "anim_matrix_rain",
      label: "👾 Matrix Rain",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-emerald-400 font-mono text-[10px]">0101</div>,
    },
    {
      id: "anim_circuit_board",
      label: "⚡ Circuit Board",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-emerald-400">⚡<span className="text-[9px] absolute -top-1 -right-1 font-mono text-amber-400">PCB</span></div>,
    },
    {
      id: "anim_quantum_grid",
      label: "⚛️ Quantum Grid",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-indigo-400">⚛️<span className="text-[9px] absolute -top-1 -right-1 text-purple-400">✦</span></div>,
    },
    {
      id: "anim_ai_neural",
      label: "🧠 AI Neural Network",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-blue-400">🧠<span className="text-[9px] absolute -top-1 -right-1 text-pink-400">⚡</span></div>,
    },
    {
      id: "anim_hologram_hud",
      label: "🎯 HUD Hologram Reticle",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-cyan-400">🎯<span className="text-[9px] absolute -top-1 -right-1 font-mono text-[8px]">HUD</span></div>,
    },
    {
      id: "anim_fiber_optic",
      label: "⚡ Laser Fiber Optic",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-sky-400">⚡<span className="text-[9px] absolute -top-1 -right-1 text-amber-300">💡</span></div>,
    },
    {
      id: "anim_blockchain",
      label: "⛓️ Blockchain Ledger",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-amber-400">⛓️<span className="text-[9px] absolute -top-1 -right-1 text-yellow-300">🔒</span></div>,
    },
    {
      id: "anim_radar_scan",
      label: "📡 Cyber Military Radar",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-emerald-400">📡<span className="text-[9px] absolute -top-1 -right-1 text-green-300">🎯</span></div>,
    },
    {
      id: "anim_cloud_cluster",
      label: "☁️ Server Cloud Cluster",
      isPro: true,
      isAnimated: true,
      previewIcon: <div className="relative flex items-center justify-center text-sm text-blue-400">☁️<span className="text-[9px] absolute -top-1 -right-1 text-sky-300">🚀</span></div>,
    },
  ];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">QR Code Customization Studio</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Customize pixel patterns, eye corner shapes, gradient colors, official brand logos, and CTA frames.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveCustomization}
            disabled={isSavingCustomization}
            variant="glow"
            size="sm"
            className="text-xs font-bold gap-1.5 shadow-lg shadow-[#ff6600]/20 cursor-pointer"
          >
            {isSavingCustomization ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save</span>
              </>
            )}
          </Button>

          <button
            onClick={copyConfigJSON}
            className="btn-hover-scale px-3.5 py-2 rounded-[10px] bg-white/5 hover:bg-white/10 border border-[#27272a] text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-2 cursor-pointer w-fit"
            title="Copy JSON for Backend API"
          >
            <Save className="w-3.5 h-3.5 text-[#ff6600]" />
            <span>Export V3 JSON</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customization Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Content Type Tabs */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-neutral-300">Content Type</span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { type: "link" as const, label: "URL Link" },
                { type: "text" as const, label: "Text" },
                { type: "wifi" as const, label: "WiFi" },
                { type: "email" as const, label: "Email" },
                { type: "call" as const, label: "Call" },
                { type: "sms" as const, label: "SMS" },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setContentType(item.type)}
                  className={`btn-hover-scale px-4 py-2 rounded-[10px] text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                    contentType === item.type
                      ? "bg-[#ff6600] text-white border-[#ff6600] shadow-md shadow-[#ff6600]/25 font-bold"
                      : "bg-[#141416] border-[#27272a] text-neutral-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Content Inputs */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col gap-4">
            {contentType === "link" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-300">
                    Website URL or Short Link
                  </label>
                  {userLinks.length > 0 && (
                    <span className="text-[11px] text-neutral-400">
                      {userLinks.length} link{userLinks.length > 1 ? "s" : ""} in your account
                    </span>
                  )}
                </div>

                {/* Quick Link Selector Dropdown */}
                {userLinks.length > 0 && (
                  <div className="flex flex-col gap-1">
                    <select
                      onChange={(e) => {
                        if (e.target.value) {
                          setWebsiteUrl(e.target.value);
                        }
                      }}
                      value={matchedLink ? (matchedLink.shortUrl || `https://lsho.cc/r/${matchedLink.slug}`) : ""}
                      className="w-full h-10 rounded-[10px] bg-[#1a1a1e] text-neutral-200 border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                    >
                      <option value="" className="bg-[#141416] text-neutral-400">
                        -- Choose from your existing short links --
                      </option>
                      {userLinks.map((l) => (
                        <option
                          key={l.id}
                          value={l.shortUrl || `https://lsho.cc/r/${l.slug}`}
                          className="bg-[#141416] text-white"
                        >
                          /{l.slug} ➔ {l.targetUrl}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <Input
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://lsho.cc/r/my-link"
                  />
                </div>

                {/* Link Verification Status Badge */}
                {matchedLink ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-[10px] px-3 py-2 animate-in fade-in">
                    <Check className="w-4 h-4 shrink-0 text-emerald-400" />
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span>
                        Linked in your account: <strong>/{matchedLink.slug}</strong>
                      </span>
                      <span className="text-[10px] text-neutral-400 font-mono truncate max-w-[200px]">
                        ↳ {matchedLink.targetUrl}
                      </span>
                    </div>
                  </div>
                ) : websiteUrl.trim() ? (
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 bg-white/5 border border-white/10 rounded-[10px] px-3 py-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>
                      Custom URL (not linked to a short link in your account). Saving requires an existing short link.
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {contentType === "text" && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Plain Text
                </label>
                <textarea
                  rows={3}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Enter your message or note..."
                  className="w-full rounded-[10px] bg-[#1a1a1e] border border-[#27272a] p-3 text-sm text-neutral-200 focus:outline-none focus:border-[#ff6600]"
                />
              </div>
            )}

            {contentType === "wifi" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Network Name (SSID)
                  </label>
                  <Input
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="MyWiFi_Guest"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Password
                    </label>
                    <Input
                      type="password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="WiFi password"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Encryption
                    </label>
                    <select
                      value={wifiEncryption}
                      onChange={(e) => setWifiEncryption(e.target.value as "WPA" | "WEP" | "nopass")}
                      className="w-full h-11 rounded-[10px] bg-[#141416] text-white border border-[#27272a] px-3 text-sm focus:outline-none focus:border-[#ff6600] cursor-pointer"
                    >
                      <option value="WPA" className="bg-[#141416] text-white">WPA / WPA2 (Recommended)</option>
                      <option value="WEP" className="bg-[#141416] text-white">WEP</option>
                      <option value="nopass" className="bg-[#141416] text-white">No password</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {contentType === "email" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Email address
                  </label>
                  <Input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Message subject
                  </label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Information request"
                  />
                </div>
              </div>
            )}

            {contentType === "call" && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Phone number
                </label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            )}

            {contentType === "sms" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Recipient phone number
                  </label>
                  <Input
                    type="tel"
                    value={smsNumber}
                    onChange={(e) => setSmsNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Pre-filled message
                  </label>
                  <Input
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="I am interested in your offer."
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 1: SELECT A STYLE */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col gap-5">
            <h3 className="text-sm font-bold text-white tracking-wide">Select a Style</h3>

            {/* Pixels Style */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">
                  Pixel Patterns ({PIXEL_STYLES.length} unique styles)
                </span>
                <button
                  type="button"
                  onClick={() => setShowMorePixels(!showMorePixels)}
                  className="btn-hover-scale text-xs font-semibold text-[#ff6600] hover:underline cursor-pointer"
                >
                  {showMorePixels ? "Show less ↑" : "View all patterns (" + PIXEL_STYLES.length + ") ↓"}
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2.5">
                {(showMorePixels ? PIXEL_STYLES : PIXEL_STYLES.slice(0, 7)).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!item.isPro || isProPlan) {
                        setPixelStyle(item.id);
                      } else {
                        triggerPlanUpgrade({
                          reason: `The pixel pattern "${item.label}" is reserved for Pro & Business plans.`,
                          featureName: "Pro QR Patterns",
                        });
                      }
                    }}
                    className={`btn-hover-scale relative flex flex-col items-center justify-center h-14 rounded-[10px] border transition-all duration-200 cursor-pointer ${
                      pixelStyle === item.id
                        ? "bg-[#ff6600]/15 border-[#ff6600] text-white shadow-md shadow-[#ff6600]/20"
                        : "bg-[#1a1a1e] border-[#27272a] text-neutral-300 hover:border-neutral-500 hover:bg-white/5"
                    }`}
                  >
                    {item.isPro && !isProPlan && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
                    )}
                    <span className="text-lg font-bold leading-none mb-0.5">{item.icon}</span>
                    <span className="text-[9px] text-neutral-400 truncate max-w-[48px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Angles / Eyes Style */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-[#222225]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">
                  QR Code Corner Eyes ({EYE_STYLES.length} shapes)
                </span>
                <button
                  type="button"
                  onClick={() => setShowMoreEyes(!showMoreEyes)}
                  className="btn-hover-scale text-xs font-semibold text-[#ff6600] hover:underline cursor-pointer"
                >
                  {showMoreEyes ? "Show less ↑" : "View all shapes (" + EYE_STYLES.length + ") ↓"}
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-7 gap-2.5">
                {(showMoreEyes ? EYE_STYLES : EYE_STYLES.slice(0, 7)).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!item.isPro || isProPlan) {
                        setEyeStyle(item.id);
                      } else {
                        triggerPlanUpgrade({
                          reason: `The eye style "${item.label}" is reserved for Pro & Business plans.`,
                          featureName: "Pro Eye Shapes",
                        });
                      }
                    }}
                    className={`btn-hover-scale relative flex flex-col items-center justify-center h-14 rounded-[10px] border transition-all duration-200 cursor-pointer ${
                      eyeStyle === item.id
                        ? "bg-[#ff6600]/15 border-[#ff6600] text-white shadow-md shadow-[#ff6600]/20"
                        : "bg-[#1a1a1e] border-[#27272a] text-neutral-300 hover:border-neutral-500 hover:bg-white/5"
                    }`}
                  >
                    {item.isPro && !isProPlan && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
                    )}
                    <div className="mb-0.5">{item.svg}</div>
                    <span className="text-[9px] text-neutral-400 truncate max-w-[48px]">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 2: CHOOSE YOUR COLORS */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Palette & Colors</h3>
                <span className="text-[11px] text-neutral-400">
                  Customize pixels, background, eye corners, and frame
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetColors}
                className="btn-hover-scale px-2.5 py-1.5 rounded-[8px] bg-white/5 hover:bg-white/10 border border-[#27272a] text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-1.5 cursor-pointer transition-all duration-200"
                title="Reset all colors to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5 text-[#ff6600]" />
                <span>Reset</span>
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">Presets</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { hex: "#000000", name: "Black" },
                  { hex: "#ff6600", name: "Orange LShorter" },
                  { hex: "#ef4444", name: "Red" },
                  { hex: "#ffffff", name: "White" },
                  { hex: "#10b981", name: "Green" },
                  { hex: "#0ea5e9", name: "Cyan" },
                  { hex: "#3b82f6", name: "Blue" },
                  { hex: "#8b5cf6", name: "Purple" },
                  { hex: "#ec4899", name: "Pink" },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handlePresetSelect(c.hex)}
                    title={c.name}
                    className={`btn-hover-scale relative w-7 h-7 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                      pixelColor === c.hex
                        ? "border-white scale-115 shadow-lg"
                        : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Pixels color row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-2 border-t border-[#222225]">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Pixels</label>
                <select
                  value={colorMode}
                  onChange={(e) => setColorMode(e.target.value as "monochrome" | "gradient")}
                  className="w-full h-10 rounded-[10px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                >
                  <option value="monochrome" className="bg-[#141416] text-white">Monochrome</option>
                  <option value="gradient" className="bg-[#141416] text-white">Gradient</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">
                  Hex Value
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={pixelColor}
                    onChange={(e) => setPixelColor(e.target.value)}
                    className="w-8 h-8 rounded-[10px] bg-transparent border-0 cursor-pointer hover:scale-105"
                  />
                  <Input
                    value={pixelColor}
                    onChange={(e) => setPixelColor(e.target.value)}
                    className="font-mono uppercase text-xs h-10"
                  />
                  {colorMode === "gradient" && (
                    <input
                      type="color"
                      value={pixelColor2}
                      onChange={(e) => setPixelColor2(e.target.value)}
                      className="w-8 h-8 rounded-[10px] bg-transparent border-0 cursor-pointer hover:scale-105"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Arrière-plan color row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Background</label>
                <select
                  value={bgMode}
                  onChange={(e) => setBgMode(e.target.value as "monochrome" | "transparent" | "gradient")}
                  className="w-full h-10 rounded-[10px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                >
                  <option value="monochrome" className="bg-[#141416] text-white">Monochrome</option>
                  <option value="transparent" className="bg-[#141416] text-white">Transparent</option>
                  <option value="gradient" className="bg-[#141416] text-white">Gradient</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Hex Value</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-[10px] bg-transparent border-0 cursor-pointer hover:scale-105"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="font-mono uppercase text-xs h-10"
                  />
                  {bgMode === "gradient" && (
                    <input
                      type="color"
                      value={bgColor2}
                      onChange={(e) => setBgColor2(e.target.value)}
                      className="w-8 h-8 rounded-[10px] bg-transparent border-0 cursor-pointer hover:scale-105"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Angles Toggle */}
            <label className="flex items-center justify-between p-3 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] cursor-pointer text-xs">
              <span className="font-semibold text-neutral-300">
                Custom color for eye corners
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useSeparateEyeColor}
                  onChange={(e) => setUseSeparateEyeColor(e.target.checked)}
                  className="w-4 h-4 accent-[#ff6600] cursor-pointer"
                />
                {useSeparateEyeColor && (
                  <input
                    type="color"
                    value={eyeColor}
                    onChange={(e) => setEyeColor(e.target.value)}
                    className="w-6 h-6 rounded-[10px] bg-transparent border-0 cursor-pointer hover:scale-105"
                  />
                )}
              </div>
            </label>
          </div>

          {/* SECTION 3: AJOUTER UN VRAI LOGO AU CENTRE */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">Official Brand Logos</h3>
                <span className="text-[11px] text-neutral-400">
                  {LOGO_LIST.length} HD vector logos ready to use
                </span>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreLogos(!showMoreLogos)}
                className="btn-hover-scale text-xs font-semibold text-[#ff6600] hover:underline cursor-pointer"
              >
                {showMoreLogos ? "Show less ↑" : "View all logos (" + LOGO_LIST.length + ") ↓"}
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />

            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2.5">
              {(showMoreLogos ? LOGO_LIST : LOGO_LIST.slice(0, 8)).map((logoItem) => {
                const isSelected = selectedLogo === logoItem.id;
                return (
                  <button
                    key={logoItem.id}
                    type="button"
                    onClick={() => {
                      if (logoItem.id === "custom") {
                        if (!isProPlan) {
                          triggerPlanUpgrade({
                            reason: "Uploading your own brand logo is reserved for the Pro plan.",
                            featureName: "Custom Logo Upload",
                          });
                          return;
                        }
                        fileInputRef.current?.click();
                        return;
                      }

                      if (logoItem.id === "text") {
                        if (!isProPlan) {
                          triggerPlanUpgrade({
                            reason: "Inserting custom center text requires the Pro plan.",
                            featureName: "Custom Center Text",
                          });
                          return;
                        }
                        setSelectedLogo("text");
                        return;
                      }

                      if (!logoItem.isPro || isProPlan) {
                        setSelectedLogo(logoItem.id);
                      } else {
                        triggerPlanUpgrade({
                          reason: `The official logo "${logoItem.label}" is reserved for Pro & Business plans.`,
                          featureName: `Logo ${logoItem.label}`,
                        });
                      }
                    }}
                    title={logoItem.label}
                    className={`btn-hover-scale relative flex flex-col items-center justify-center h-14 rounded-[10px] border transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? "bg-[#ff6600]/15 border-[#ff6600] text-white shadow-md shadow-[#ff6600]/20"
                        : "bg-[#1a1a1e] border-[#27272a] text-neutral-300 hover:border-neutral-500 hover:bg-white/5"
                    }`}
                  >
                    {logoItem.isPro && !isProPlan && (
                      <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
                    )}
                    <div className="mb-0.5 flex items-center justify-center">{logoItem.iconNode}</div>
                    <span className="text-[9px] text-neutral-400 truncate max-w-[48px]">{logoItem.label}</span>
                  </button>
                );
              })}
            </div>

            {selectedLogo === "text" && isProPlan && (
              <div className="pt-2 flex flex-col gap-2 animate-in fade-in">
                <label className="block text-xs font-semibold text-neutral-300">
                  Center text (max 6 chars)
                </label>
                <Input
                  maxLength={6}
                  value={centerText}
                  onChange={(e) => setCenterText(e.target.value)}
                  placeholder="SCAN"
                />
                <span className="text-[10px] text-neutral-400">
                  💡 The font family, size, weight, and casing selected in typography options also apply to center text.
                </span>
              </div>
            )}

            <p className="text-[11px] text-neutral-500">
              Each logo is rendered with official vector curves and high-reliability error correction (Level H 30%).
            </p>
          </div>

          {/* SECTION 4: SELECT A FRAME */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white tracking-wide">
                  Frames & CTA Banners
                </h3>
                <span className="text-[11px] text-neutral-400">
                  {FRAME_LIST.length} conversion frames (Static & Ultra-Pro Animated)
                </span>
              </div>

              {/* Frame Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-[#1a1a1e] p-1 rounded-[8px] border border-[#27272a] w-fit">
                {[
                  { id: "all" as const, label: `All (${FRAME_LIST.length})` },
                  { id: "static" as const, label: `Static (${FRAME_LIST.filter((f) => !f.isAnimated).length})` },
                  { id: "animated" as const, label: `Animated (${FRAME_LIST.filter((f) => f.isAnimated).length})` },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setFrameFilter(tab.id);
                      setShowMoreFrames(true);
                    }}
                    className={`btn-hover-scale px-2.5 py-1 rounded-[6px] text-[11px] font-semibold transition-all cursor-pointer ${
                      frameFilter === tab.id
                        ? "bg-[#ff6600] text-white shadow-sm font-bold"
                        : "text-neutral-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frames Grid */}
            {(() => {
              const filteredList = FRAME_LIST.filter((f) => {
                if (frameFilter === "static") return !f.isAnimated;
                if (frameFilter === "animated") return !!f.isAnimated;
                return true;
              });

              const displayedList = showMoreFrames ? filteredList : filteredList.slice(0, 7);

              return (
                <div className="flex flex-col gap-3">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
                    {displayedList.map((frameItem) => {
                      const isSelected = selectedFrame === frameItem.id;
                      return (
                        <button
                          key={frameItem.id}
                          type="button"
                          onClick={() => {
                            if (!frameItem.isPro || isProPlan) {
                              setSelectedFrame(frameItem.id);
                            } else {
                              triggerPlanUpgrade({
                                reason: `The ${frameItem.isAnimated ? "animated" : ""} frame "${frameItem.label}" is reserved for Pro & Business plans.`,
                                featureName: `Frame ${frameItem.label}`,
                              });
                            }
                          }}
                          className={`btn-hover-scale relative flex flex-col items-center justify-center h-16 rounded-[10px] border transition-all duration-200 cursor-pointer ${
                            isSelected
                              ? "bg-[#ff6600]/15 border-[#ff6600] text-white shadow-md shadow-[#ff6600]/20"
                              : "bg-[#1a1a1e] border-[#27272a] text-neutral-300 hover:border-neutral-500 hover:bg-white/5"
                          }`}
                        >
                          {frameItem.isPro && !isProPlan && (
                            <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />
                          )}
                          {frameItem.isAnimated && (
                            <span className="absolute top-1 left-1 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                          )}
                          <div className="mb-1 flex items-center justify-center">{frameItem.previewIcon}</div>
                          <span className="text-[9px] text-neutral-400 truncate max-w-[54px] text-center font-semibold">
                            {frameItem.label}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {filteredList.length > 7 && (
                    <button
                      type="button"
                      onClick={() => setShowMoreFrames(!showMoreFrames)}
                      className="btn-hover-scale text-xs font-semibold text-[#ff6600] hover:underline cursor-pointer self-end"
                    >
                      {showMoreFrames ? "Show less ↑" : `View all (${filteredList.length}) ↓`}
                    </button>
                  )}
                </div>
              );
            })()}

            {selectedFrame !== "none" && (
              <div className="flex flex-col gap-4 pt-3 border-t border-[#222225] animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Frame text (Call To Action)
                    </label>
                    <Input
                      value={frameText}
                      onChange={(e) => setFrameText(e.target.value)}
                      placeholder="SCAN ME"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Frame color
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={frameColor}
                        onChange={(e) => setFrameColor(e.target.value)}
                        className="w-8 h-8 rounded-[10px] bg-transparent border-0 cursor-pointer hover:scale-105"
                      />
                      <Input
                        value={frameColor}
                        onChange={(e) => setFrameColor(e.target.value)}
                        className="font-mono uppercase text-xs h-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Options Typographiques & Taille de Police (Google Fonts Studio) */}
                <div className="flex flex-col gap-4 p-4 rounded-[12px] bg-[#1a1a1e] border border-[#27272a] shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#27272a] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[8px] bg-gradient-to-tr from-[#ff6600] to-[#ff3300] flex items-center justify-center text-white shadow-md shadow-[#ff6600]/20">
                        <Type className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white tracking-wide">
                            Google Fonts Typography Studio
                          </span>
                          <span className="text-[10px] font-bold bg-[#ff6600]/20 text-[#ff6600] px-1.5 py-0.5 rounded border border-[#ff6600]/30">
                            {FONT_FAMILIES.length} Fonts
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-400">
                          Select your font with live preview and pixel-perfect size adjustment
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetTypography}
                      className="btn-hover-scale text-[11px] font-semibold text-neutral-400 hover:text-white flex items-center gap-1.5 cursor-pointer self-start sm:self-auto bg-white/5 hover:bg-white/10 px-2.5 py-1.5 rounded-[6px] border border-[#27272a]"
                      title="Reset typography to default"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#ff6600]" />
                      <span>Reset</span>
                    </button>
                  </div>

                  {/* Search Bar & Category Filter Tabs */}
                  <div className="flex flex-col gap-2.5">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <Input
                        value={fontSearchQuery}
                        onChange={(e) => setFontSearchQuery(e.target.value)}
                        placeholder="Search a font (e.g. Inter, Playfair, Mono, Orbitron, Bebas)..."
                        className="pl-8.5 text-xs h-9 bg-[#141416] border-[#27272a]"
                      />
                      {fontSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setFontSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white text-xs cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                      {[
                        { id: "all", label: `All (${FONT_FAMILIES.length})` },
                        { id: "Sans-Serif", label: `Sans-Serif (${FONT_FAMILIES.filter((f) => f.category === "Sans-Serif").length})` },
                        { id: "Serif", label: `Serif (${FONT_FAMILIES.filter((f) => f.category === "Serif").length})` },
                        { id: "Display", label: `Display (${FONT_FAMILIES.filter((f) => f.category === "Display").length})` },
                        { id: "Monospace", label: `Code (${FONT_FAMILIES.filter((f) => f.category === "Monospace").length})` },
                        { id: "Cursive", label: `Handwritten (${FONT_FAMILIES.filter((f) => f.category === "Cursive").length})` },
                        { id: "Futuristic", label: `Futuristic (${FONT_FAMILIES.filter((f) => f.category === "Futuristic").length})` },
                      ].map((cat) => (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setFontCategoryFilter(cat.id)}
                          className={`btn-hover-scale px-2.5 py-1 rounded-[6px] text-[10px] font-semibold shrink-0 transition-all cursor-pointer border ${
                            fontCategoryFilter === cat.id
                              ? "bg-[#ff6600] text-white border-[#ff6600] shadow-sm font-bold"
                              : "bg-[#141416] border-[#27272a] text-neutral-400 hover:text-white"
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Visual Font Card Browser (Google Fonts Interface) */}
                  {(() => {
                    const filteredFonts = FONT_FAMILIES.filter((f) => {
                      const matchesCat = fontCategoryFilter === "all" || f.category === fontCategoryFilter;
                      const matchesSearch =
                        !fontSearchQuery ||
                        f.name.toLowerCase().includes(fontSearchQuery.toLowerCase()) ||
                        f.category.toLowerCase().includes(fontSearchQuery.toLowerCase());
                      return matchesCat && matchesSearch;
                    });

                    const displayedFonts = showAllFonts ? filteredFonts : filteredFonts.slice(0, 8);

                    return (
                      <div className="flex flex-col gap-2">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {displayedFonts.map((f) => {
                            const isSelected = fontFamily === f.id;
                            return (
                              <button
                                key={f.id}
                                type="button"
                                onClick={() => setFontFamily(f.id)}
                                className={`btn-hover-scale relative flex flex-col p-2.5 rounded-[10px] border text-left transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-[#ff6600]/15 border-[#ff6600] text-white shadow-md shadow-[#ff6600]/20 ring-1 ring-[#ff6600]"
                                    : "bg-[#141416] border-[#27272a] text-neutral-300 hover:border-neutral-500 hover:bg-white/5"
                                }`}
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[11px] font-bold text-white truncate max-w-[90px]">
                                    {f.label}
                                  </span>
                                  <span className="text-[8px] font-semibold px-1 py-0.5 rounded bg-white/5 text-neutral-400 border border-white/5">
                                    {f.category}
                                  </span>
                                </div>
                                <div
                                  className="text-xs truncate text-neutral-200 mt-0.5"
                                  style={{ fontFamily: f.fontCss }}
                                >
                                  {frameText || f.preview}
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {filteredFonts.length > 8 && (
                          <button
                            type="button"
                            onClick={() => setShowAllFonts(!showAllFonts)}
                            className="btn-hover-scale text-xs font-semibold text-[#ff6600] hover:underline cursor-pointer self-end mt-1"
                          >
                            {showAllFonts
                              ? "Show less ↑"
                              : `View all fonts (${filteredFonts.length}) ↓`}
                          </button>
                        )}

                        {filteredFonts.length === 0 && (
                          <div className="text-center py-4 text-xs text-neutral-400">
                            No fonts match &quot;{fontSearchQuery}&quot;.
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* 2. Font Size Controls (Slider & Presets) */}
                  <div className="pt-3 border-t border-[#27272a] flex flex-col gap-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-white">Font Size</span>
                        <span className="text-[10px] text-neutral-400">(8px to 24px)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#ff6600] bg-[#ff6600]/10 px-2 py-0.5 rounded border border-[#ff6600]/25">
                          {fontSize} px
                        </span>
                      </div>
                    </div>

                    <input
                      type="range"
                      min={8}
                      max={24}
                      step={1}
                      value={fontSize}
                      onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full h-2 bg-[#141416] rounded-lg appearance-none cursor-pointer accent-[#ff6600] border border-[#27272a]"
                    />

                    {/* Quick Presets for Font Size */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-neutral-400 mr-1">Presets:</span>
                      {[
                        { sz: 8, label: "Mini 8px" },
                        { sz: 10, label: "Compact 10px" },
                        { sz: 12, label: "Standard 12px" },
                        { sz: 15, label: "Large 15px" },
                        { sz: 18, label: "XL 18px" },
                        { sz: 22, label: "XXL 22px" },
                      ].map((preset) => (
                        <button
                          key={preset.sz}
                          type="button"
                          onClick={() => setFontSize(preset.sz)}
                          className={`btn-hover-scale px-2.5 py-1 rounded-[6px] text-[10px] font-semibold transition-all cursor-pointer border ${
                            fontSize === preset.sz
                              ? "bg-[#ff6600] text-white border-[#ff6600] font-bold shadow-sm"
                              : "bg-[#141416] border-[#27272a] text-neutral-300 hover:text-white"
                          }`}
                        >
                          {preset.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 3. Weight / Style & 4. Casing (Uppercase / Raw / Lowercase) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-[#27272a]">
                    {/* Weight / Style */}
                    <div>
                      <span className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                        Style & Weight
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: "normal" as const, label: "Normal 500" },
                          { id: "bold" as const, label: "Bold" },
                          { id: "900" as const, label: "Extra Bold 900" },
                          { id: "italic" as const, label: "Italic" },
                        ].map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => setFontWeight(w.id)}
                            className={`btn-hover-scale py-1.5 px-2 rounded-[6px] text-[10px] font-semibold text-center border transition-all cursor-pointer ${
                              fontWeight === w.id
                                ? "bg-[#ff6600]/20 border-[#ff6600] text-white font-bold"
                                : "bg-[#141416] border-[#27272a] text-neutral-400 hover:text-white"
                            }`}
                          >
                            {w.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Transform */}
                    <div>
                      <span className="block text-[11px] font-semibold text-neutral-300 mb-1.5">
                        Text Case
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: "uppercase" as const, label: "UPPERCASE" },
                          { id: "none" as const, label: "Standard" },
                          { id: "lowercase" as const, label: "lowercase" },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => setTextTransform(c.id)}
                            className={`btn-hover-scale py-1.5 px-2 rounded-[6px] text-[10px] font-semibold text-center border transition-all cursor-pointer ${
                              textTransform === c.id
                                ? "bg-[#ff6600]/20 border-[#ff6600] text-white font-bold"
                                : "bg-[#141416] border-[#27272a] text-neutral-400 hover:text-white"
                            }`}
                          >
                            {c.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-24">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-300">Live Preview</span>
            {isAnimatedFrame(selectedFrame) && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Animated 60 FPS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
                  className="btn-hover-scale px-2 py-1 rounded-[6px] bg-white/5 hover:bg-white/10 border border-[#27272a] text-neutral-300 hover:text-white flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                  title={isPlayingAnimation ? "Pause animation" : "Play animation"}
                >
                  {isPlayingAnimation ? <Pause className="w-3 h-3 text-amber-400" /> : <Play className="w-3 h-3 text-emerald-400" />}
                  <span>{isPlayingAnimation ? "Pause" : "Play"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Big White Card for QR Code Container */}
          <div className="rounded-[10px] bg-[#141416] border border-[#222225] p-6 flex flex-col items-center justify-center shadow-2xl overflow-hidden">
            <div className="p-4 rounded-[10px] bg-white flex items-center justify-center shadow-xl">
              <canvas ref={canvasRef} className="max-w-full h-auto object-contain" />
            </div>
          </div>

          {/* Size / Resolution Slider */}
          <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-neutral-300">
              <span>Resolution</span>
              <span className="font-mono text-[#ff6600]">{size}px</span>
            </div>
            <input
              type="range"
              min="128"
              max="512"
              step="32"
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              className="w-full accent-[#ff6600] cursor-pointer"
            />
          </div>

          {/* Save Customization CTA Button */}
          <Button
            onClick={handleSaveCustomization}
            disabled={isSavingCustomization}
            variant="glow"
            className="w-full py-3 h-11 text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-[#ff6600]/25 cursor-pointer"
          >
            {isSavingCustomization ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Saving in progress...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Save customization</span>
                {matchedLink && (
                  <span className="text-[10px] opacity-90 font-mono bg-black/25 px-1.5 py-0.5 rounded">
                    /{matchedLink.slug}
                  </span>
                )}
              </>
            )}
          </Button>

          {/* Action Buttons: PNG, SVG, GIF, Partager */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={downloadPNG}
              className="btn-hover-scale flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-[#ff6600] hover:bg-[#ff771a] text-white text-xs font-bold shadow-lg shadow-[#ff6600]/25 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>

            <button
              onClick={downloadSVG}
              className="btn-hover-scale flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-white/5 hover:bg-white/10 border border-[#27272a] hover:border-[#ff6600] text-neutral-200 hover:text-white text-xs font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-[#ff6600]" />
              <span>SVG</span>
            </button>

            <button
              onClick={downloadGIF}
              disabled={isGeneratingGif}
              className={`btn-hover-scale relative flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] border transition-all duration-200 text-xs font-bold cursor-pointer ${
                isGeneratingGif
                  ? "bg-amber-500/20 border-amber-500 text-amber-300"
                  : "bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-purple-500/15 hover:from-amber-500/25 hover:to-purple-500/25 border-amber-500/40 hover:border-amber-400 text-amber-300 shadow-md shadow-amber-500/10"
              }`}
              title={isProPlan ? "Download QR Code in high-resolution animated GIF format" : "GIF export reserved for Pro plan"}
            >
              {isGeneratingGif ? (
                <>
                  <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>{gifProgress}%</span>
                </>
              ) : (
                <>
                  <Film className="w-3.5 h-3.5 text-amber-400" />
                  <span>GIF</span>
                  {!isProPlan && <Crown className="w-2.5 h-2.5 text-amber-400" />}
                </>
              )}
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(getRawQRValue());
                confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
                showToast.success("Raw content copied!");
              }}
              className="btn-hover-scale flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-white/5 hover:bg-white/10 border border-[#27272a] hover:border-[#ff6600] text-neutral-200 hover:text-white text-xs font-semibold cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>

          <p className="text-center text-[11px] text-neutral-500">
            Export as PNG for web, vector SVG for HD printing, or GIF for animated frames.
          </p>
        </div>
      </div>
    </div>
  );
}
