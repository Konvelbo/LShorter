"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";
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
  Save
} from "lucide-react";
import { useSession } from "next-auth/react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  QRContentType,
  ShortLink,
  CustomDomain
} from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { triggerPlanUpgrade, checkPlanFeatureAccess } from "@/lib/plan-guard";
import { showToast } from "@/components/ui/toast-provider";
import confetti from "canvas-confetti";

export function QRGenerator() {
  const { data: session } = useSession();
  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");
  const plan = convexUser?.plan || (session?.user as any)?.plan || "FREEMIUM";
  const isProPlan = plan === "PRO" || plan === "BUSINESS";
  const [contentType, setContentType] = useState<QRContentType>("link");

  // Content Inputs
  const [websiteUrl, setWebsiteUrl] = useState("https://qlsk.cc/mon-lien");
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
  const [pixelStyle, setPixelStyle] = useState<
    "square" | "rounded" | "dots" | "diamond" | "classy" | "stars" | "lines"
  >("square");
  const [eyeStyle, setEyeStyle] = useState<
    "square" | "rounded" | "circle" | "leaf" | "hexagon" | "star" | "cyber"
  >("square");

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
  const [selectedLogo, setSelectedLogo] = useState<string | null>("ql");
  const [centerText, setCenterText] = useState("SCAN");
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);

  // Frame Inputs
  const [selectedFrame, setSelectedFrame] = useState<
    "none" | "simple" | "bottom_pill" | "top_header" | "hand_arrow" | "modern_badge" | "phone" | "neon"
  >("bottom_pill");
  const [frameText, setFrameText] = useState("SCAN ME");
  const [frameColor, setFrameColor] = useState("#ff6600");

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

  // Freemium Allowed Preset Colors
  const isFreemiumAllowedColor = (hex: string) => {
    const allowed = ["#000000", "#ffffff", "#ef4444", "#ff6600"];
    return allowed.includes(hex.toLowerCase());
  };

  // Build the raw QR content string
  const getRawQRValue = (): string => {
    switch (contentType) {
      case "link":
        return websiteUrl || "https://lshorter.io";
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
      size,
    });
  };

  // Render Full QR Code with Frame, Distinct Corners, Gradients, and Center Logo/Text
  useEffect(() => {
    const rawData = getRawQRValue();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const qr = QRCode.create(rawData, {
      errorCorrectionLevel: "H",
    });

    const moduleCount = qr.modules.size;
    const padding = includeQuietZone ? 24 : 12;
    const frameTopPadding = selectedFrame === "top_header" ? 50 : selectedFrame === "phone" ? 40 : padding;
    const frameBottomPadding =
      selectedFrame === "bottom_pill" || selectedFrame === "hand_arrow" || selectedFrame === "modern_badge"
        ? 64
        : padding;

    const qrDrawSize = size;
    const totalWidth = qrDrawSize + padding * 2;
    const totalHeight = qrDrawSize + frameTopPadding + frameBottomPadding;

    canvas.width = totalWidth * 2;
    canvas.height = totalHeight * 2;
    canvas.style.width = `${totalWidth}px`;
    canvas.style.height = `${totalHeight}px`;
    ctx.scale(2, 2);

    // 1. Draw Background
    if (bgMode === "transparent") {
      ctx.clearRect(0, 0, totalWidth, totalHeight);
    } else if (bgMode === "gradient" && isProPlan) {
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

    // 2. Draw Frame Decor if active
    if (selectedFrame === "simple") {
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 4;
      ctx.roundRect(6, 6, totalWidth - 12, totalHeight - 12, 14);
      ctx.stroke();
    } else if (selectedFrame === "neon" && isProPlan) {
      ctx.shadowColor = frameColor;
      ctx.shadowBlur = 15;
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 4;
      ctx.roundRect(8, 8, totalWidth - 16, totalHeight - 16, 16);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else if (selectedFrame === "bottom_pill") {
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 4;
      ctx.roundRect(6, 6, totalWidth - 12, totalHeight - 12, 16);
      ctx.stroke();

      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.15, totalHeight - 44, totalWidth * 0.7, 34, 10);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(frameText.toUpperCase(), totalWidth / 2, totalHeight - 27);
    } else if (selectedFrame === "top_header") {
      ctx.strokeStyle = frameColor;
      ctx.lineWidth = 4;
      ctx.roundRect(6, 6, totalWidth - 12, totalHeight - 12, 16);
      ctx.stroke();

      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.15, 10, totalWidth * 0.7, 32, 8);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(frameText.toUpperCase(), totalWidth / 2, 26);
    } else if (selectedFrame === "hand_arrow") {
      ctx.strokeStyle = "#1a1a1e";
      ctx.lineWidth = 3;
      ctx.roundRect(6, 6, totalWidth - 12, totalHeight - 12, 16);
      ctx.stroke();

      ctx.fillStyle = frameColor;
      ctx.font = "italic bold 15px cursive, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`⤹ ${frameText} ⤸`, totalWidth / 2, totalHeight - 22);
    } else if (selectedFrame === "modern_badge") {
      ctx.strokeStyle = "#27272a";
      ctx.lineWidth = 2;
      ctx.roundRect(4, 4, totalWidth - 8, totalHeight - 8, 20);
      ctx.stroke();

      ctx.fillStyle = frameColor;
      ctx.beginPath();
      ctx.roundRect(totalWidth * 0.2, totalHeight - 42, totalWidth * 0.6, 30, 15);
      ctx.fill();

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(`★ ${frameText} ★`, totalWidth / 2, totalHeight - 27);
    }

    // 3. Draw QR Modules
    const cellSize = qrDrawSize / moduleCount;
    const startX = padding;
    const startY = frameTopPadding;

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
    if (colorMode === "gradient" && isProPlan) {
      const grad = ctx.createLinearGradient(startX, startY, startX + qrDrawSize, startY + qrDrawSize);
      grad.addColorStop(0, pixelColor);
      grad.addColorStop(1, pixelColor2);
      fillStyle = grad;
    }

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (isFinderEye(r, c) || isCenterLogoArea(r, c)) continue;

        if (qr.modules.get(r, c)) {
          ctx.fillStyle = fillStyle;
          const x = startX + c * cellSize;
          const y = startY + r * cellSize;

          if (pixelStyle === "square") {
            ctx.fillRect(x, y, cellSize, cellSize);
          } else if (pixelStyle === "rounded") {
            ctx.beginPath();
            ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, cellSize * 0.35);
            ctx.fill();
          } else if (pixelStyle === "dots") {
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.44, 0, Math.PI * 2);
            ctx.fill();
          } else if (pixelStyle === "diamond") {
            ctx.beginPath();
            ctx.moveTo(x + cellSize / 2, y);
            ctx.lineTo(x + cellSize, y + cellSize / 2);
            ctx.lineTo(x + cellSize / 2, y + cellSize);
            ctx.lineTo(x, y + cellSize / 2);
            ctx.closePath();
            ctx.fill();
          } else if (pixelStyle === "classy") {
            ctx.beginPath();
            ctx.roundRect(x + 0.5, y + 0.5, cellSize - 1, cellSize - 1, [cellSize * 0.5, 0, cellSize * 0.5, 0]);
            ctx.fill();
          } else if (pixelStyle === "stars") {
            ctx.beginPath();
            ctx.arc(x + cellSize / 2, y + cellSize / 2, cellSize * 0.35, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(x + cellSize * 0.35, y, cellSize * 0.3, cellSize);
            ctx.fillRect(x, y + cellSize * 0.35, cellSize, cellSize * 0.3);
          } else if (pixelStyle === "lines") {
            ctx.beginPath();
            ctx.roundRect(x + 0.5, y + cellSize * 0.15, cellSize - 1, cellSize * 0.7, cellSize * 0.35);
            ctx.fill();
          } else {
            ctx.fillRect(x, y, cellSize, cellSize);
          }
        }
      }
    }

    // 4. Draw Distinct Corner Finder Eyes
    const drawEye = (originR: number, originC: number) => {
      const eyeX = startX + originC * cellSize;
      const eyeY = startY + originR * cellSize;
      const eyeSize = 7 * cellSize;
      const centerEyeX = eyeX + eyeSize / 2;
      const centerEyeY = eyeY + eyeSize / 2;

      const eyeFill = useSeparateEyeColor && isProPlan ? eyeColor : pixelColor;
      ctx.fillStyle = eyeFill;
      ctx.strokeStyle = eyeFill;

      if (eyeStyle === "square") {
        ctx.lineWidth = cellSize;
        ctx.strokeRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize);
        ctx.fillRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize);
      } else if (eyeStyle === "rounded") {
        ctx.lineWidth = cellSize;
        ctx.beginPath();
        ctx.roundRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize, cellSize * 1.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize, cellSize * 0.9);
        ctx.fill();
      } else if (eyeStyle === "circle") {
        ctx.lineWidth = cellSize;
        ctx.beginPath();
        ctx.arc(centerEyeX, centerEyeY, (eyeSize - cellSize) / 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(centerEyeX, centerEyeY, 1.5 * cellSize, 0, Math.PI * 2);
        ctx.fill();
      } else if (eyeStyle === "leaf") {
        ctx.lineWidth = cellSize;
        ctx.beginPath();
        ctx.roundRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize, [
          cellSize * 2.8,
          0,
          cellSize * 2.8,
          0,
        ]);
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize, [
          cellSize * 1.6,
          0,
          cellSize * 1.6,
          0,
        ]);
        ctx.fill();
      } else if (eyeStyle === "hexagon") {
        const hexRadius = (eyeSize - cellSize) / 2;
        ctx.lineWidth = cellSize;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 - Math.PI / 6;
          const hx = centerEyeX + hexRadius * Math.cos(angle);
          const hy = centerEyeY + hexRadius * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.stroke();

        const innerHexRadius = 1.6 * cellSize;
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
          const angle = (i * Math.PI) / 3 - Math.PI / 6;
          const hx = centerEyeX + innerHexRadius * Math.cos(angle);
          const hy = centerEyeY + innerHexRadius * Math.sin(angle);
          if (i === 0) ctx.moveTo(hx, hy);
          else ctx.lineTo(hx, hy);
        }
        ctx.closePath();
        ctx.fill();
      } else if (eyeStyle === "star") {
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
        const starCoreOuter = 1.7 * cellSize;
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
      } else if (eyeStyle === "cyber") {
        ctx.lineWidth = cellSize;
        ctx.beginPath();
        ctx.roundRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize, [
          0,
          cellSize * 2.2,
          0,
          cellSize * 2.2,
        ]);
        ctx.stroke();
        ctx.beginPath();
        ctx.roundRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize, [
          0,
          cellSize * 1.2,
          0,
          cellSize * 1.2,
        ]);
        ctx.fill();
      } else {
        ctx.lineWidth = cellSize;
        ctx.strokeRect(eyeX + cellSize / 2, eyeY + cellSize / 2, eyeSize - cellSize, eyeSize - cellSize);
        ctx.fillRect(eyeX + 2 * cellSize, eyeY + 2 * cellSize, 3 * cellSize, 3 * cellSize);
      }
    };

    drawEye(0, 0);
    drawEye(0, moduleCount - 7);
    drawEye(moduleCount - 7, 0);

    // 5. Draw Center Logo / Text
    if (selectedLogo !== "none") {
      const centerBoxSize = (centerCutoutRadius * 2 + 1.5) * cellSize;
      const centerBoxX = startX + (moduleCount * cellSize - centerBoxSize) / 2;
      const centerBoxY = startY + (moduleCount * cellSize - centerBoxSize) / 2;

      ctx.fillStyle = bgColor === "transparent" ? "#ffffff" : bgColor;
      ctx.shadowColor = "rgba(0,0,0,0.15)";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(centerBoxX, centerBoxY, centerBoxSize, centerBoxSize, 8);
      ctx.fill();
      ctx.shadowBlur = 0;

      if (selectedLogo === "custom" && uploadedLogo) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.src = uploadedLogo;
        img.onload = () => {
          ctx.drawImage(
            img,
            centerBoxX + 4,
            centerBoxY + 4,
            centerBoxSize - 8,
            centerBoxSize - 8
          );
        };
      } else if (selectedLogo === "text") {
        ctx.fillStyle = pixelColor;
        ctx.font = "bold 13px Inter, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(centerText, centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
      } else if (selectedLogo === "ql") {
        ctx.fillStyle = "#ff6600";
        ctx.beginPath();
        ctx.roundRect(centerBoxX + 3, centerBoxY + 3, centerBoxSize - 6, centerBoxSize - 6, 6);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "900 16px 'Bebas Neue', sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("QL", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2 + 1);
      } else if (selectedLogo === "facebook") {
        ctx.fillStyle = "#1877F2";
        ctx.font = "bold 20px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("f", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
      } else if (selectedLogo === "instagram") {
        ctx.fillStyle = "#E4405F";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("📷", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
      } else if (selectedLogo === "twitter") {
        ctx.fillStyle = "#000000";
        ctx.font = "bold 16px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("𝕏", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
      } else if (selectedLogo === "whatsapp") {
        ctx.fillStyle = "#25D366";
        ctx.font = "bold 14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("💬", centerBoxX + centerBoxSize / 2, centerBoxY + centerBoxSize / 2);
      }
    }
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
    size,
    includeQuietZone,
    isProPlan,
  ]);

  const handlePresetSelect = (hex: string) => {
    if (!isProPlan && !isFreemiumAllowedColor(hex)) {
      triggerPlanUpgrade({
        reason: "Les palettes de couleurs personnalisées sont réservées au forfait Pro.",
        featureName: "Couleurs QR Avancées",
      });
      return;
    }
    setPixelColor(hex);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        reason: "Le téléversement de votre propre logo est réservé au forfait Pro.",
        featureName: "Logo QR Personnalisé",
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
      showToast.success("Logo personnalisé chargé avec succès !");
    };
    reader.readAsDataURL(file);
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `lshorter-qr-${contentType}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    confetti({ particleCount: 30, spread: 50 });
    showToast.success("QR Code PNG téléchargé avec succès !");
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
      showToast.success("QR Code vectoriel SVG téléchargé !");
    } catch (e) {
      console.error("SVG generation error:", e);
      showToast.error("Erreur lors de la génération SVG");
    }
  };

  const copyConfigJSON = () => {
    const json = getV3QRCodeConfigJSON();
    navigator.clipboard.writeText(json);
    showToast.success("Configuration JSON V3 copiée dans le presse-papier !");
    confetti({ particleCount: 25, spread: 45 });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-wide">Studio de Personnalisation QR Code</h1>
          <p className="text-xs text-neutral-400 mt-1">
            Personnalisez les motifs de pixels, coins d&apos;yeux, couleurs en dégradé, logos centraux et cadres CTA.
          </p>
        </div>

        <button
          onClick={copyConfigJSON}
          className="btn-hover-scale px-3.5 py-2 rounded-[8px] bg-white/5 hover:bg-white/10 border border-[#27272a] text-xs font-semibold text-neutral-300 hover:text-white flex items-center gap-2 cursor-pointer w-fit"
          title="Copier le JSON pour l'API Backend"
        >
          <Save className="w-3.5 h-3.5 text-[#ff6600]" />
          <span>Exporter JSON V3</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customization Controls (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Content Type Tabs */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-neutral-300">Type de contenu</span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { type: "link" as const, label: "Lien URL" },
                { type: "text" as const, label: "Texte" },
                { type: "wifi" as const, label: "WiFi" },
                { type: "email" as const, label: "E-mail" },
                { type: "call" as const, label: "Appel" },
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
          <div className="p-4 sm:p-5 rounded-[12px] bg-[#141416] border border-[#222225] flex flex-col gap-4">
            {contentType === "link" && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  URL du site web
                </label>
                <Input
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  placeholder="https://www.votresite.com"
                />
              </div>
            )}

            {contentType === "text" && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Texte brut
                </label>
                <textarea
                  rows={3}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Entrez votre message ou note..."
                  className="w-full rounded-[10px] bg-[#1a1a1e] border border-[#27272a] p-3 text-sm text-neutral-200 focus:outline-none focus:border-[#ff6600]"
                />
              </div>
            )}

            {contentType === "wifi" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Nom du réseau (SSID)
                  </label>
                  <Input
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder="MonWiFi_Invite"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Mot de passe
                    </label>
                    <Input
                      type="password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder="Mot de passe WiFi"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                      Chiffrement
                    </label>
                    <select
                      value={wifiEncryption}
                      onChange={(e) => setWifiEncryption(e.target.value as "WPA" | "WEP" | "nopass")}
                      className="w-full h-11 rounded-[10px] bg-[#141416] text-white border border-[#27272a] px-3 text-sm focus:outline-none focus:border-[#ff6600] cursor-pointer"
                    >
                      <option value="WPA" className="bg-[#141416] text-white">WPA / WPA2 (Recommandé)</option>
                      <option value="WEP" className="bg-[#141416] text-white">WEP</option>
                      <option value="nopass" className="bg-[#141416] text-white">Sans mot de passe</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {contentType === "email" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Adresse e-mail
                  </label>
                  <Input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="contact@exemple.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Sujet du message
                  </label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="Demande d'information"
                  />
                </div>
              </div>
            )}

            {contentType === "call" && (
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                  Numéro de téléphone
                </label>
                <Input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="+33 6 12 34 56 78"
                />
              </div>
            )}

            {contentType === "sms" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Numéro destinataire
                  </label>
                  <Input
                    type="tel"
                    value={smsNumber}
                    onChange={(e) => setSmsNumber(e.target.value)}
                    placeholder="+33 6 12 34 56 78"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
                    Message pré-rempli
                  </label>
                  <Input
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder="Je suis intéressé par votre offre."
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 1: SÉLECTIONNEZ UN STYLE */}
          <div className="p-4 sm:p-5 rounded-[12px] bg-[#141416] border border-[#222225] flex flex-col gap-5">
            <h3 className="text-sm font-bold text-white tracking-wide">Sélectionnez un style</h3>

            {/* Pixels Style */}
            <div className="flex flex-col gap-2.5">
              <span className="text-xs font-semibold text-neutral-400">Pixels</span>
              <div className="flex flex-wrap items-center gap-2.5">
                {[
                  { id: "square" as const, label: "Carrés", icon: "■", isPro: false },
                  { id: "rounded" as const, label: "Arrondis", icon: "●", isPro: false },
                  { id: "dots" as const, label: "Points", icon: "•", isPro: true },
                  { id: "diamond" as const, label: "Diamants", icon: "◆", isPro: true },
                  ...(showMorePixels
                    ? [
                        { id: "classy" as const, label: "Classy", icon: "◈", isPro: true },
                        { id: "stars" as const, label: "Étoiles", icon: "★", isPro: true },
                        { id: "lines" as const, label: "Lignes", icon: "▬", isPro: true },
                      ]
                    : []),
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!item.isPro || isProPlan) {
                        setPixelStyle(item.id);
                      } else {
                        triggerPlanUpgrade({
                          reason: `Le motif de pixels "${item.label}" est réservé aux forfaits Pro & Business.`,
                          featureName: "Motifs QR Pro",
                        });
                      }
                    }}
                    className={`btn-hover-scale relative flex flex-col items-center justify-center w-14 h-14 rounded-[10px] border transition-all duration-200 cursor-pointer ${
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

                <button
                  type="button"
                  onClick={() => setShowMorePixels(!showMorePixels)}
                  className="btn-hover-scale text-xs font-semibold text-[#ff6600] hover:underline px-2 py-1 cursor-pointer"
                >
                  {showMorePixels ? "- Moins" : "+ Plus"}
                </button>
              </div>
            </div>

            {/* Angles / Eyes Style */}
            <div className="flex flex-col gap-2.5 pt-2 border-t border-[#222225]">
              <span className="text-xs font-semibold text-neutral-400">Angles (Yeux du QR code)</span>
              <div className="flex flex-wrap items-center gap-2.5">
                {[
                  {
                    id: "square" as const,
                    label: "Carré",
                    svg: (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="3" width="18" height="18" />
                        <rect x="8" y="8" width="8" height="8" fill="currentColor" />
                      </svg>
                    ),
                    isPro: false,
                  },
                  {
                    id: "rounded" as const,
                    label: "Arrondi",
                    svg: (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <rect x="3" y="3" width="18" height="18" rx="5" />
                        <rect x="8" y="8" width="8" height="8" rx="2" fill="currentColor" />
                      </svg>
                    ),
                    isPro: false,
                  },
                  {
                    id: "circle" as const,
                    label: "Cercle",
                    svg: (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <circle cx="12" cy="12" r="9" />
                        <circle cx="12" cy="12" r="4" fill="currentColor" />
                      </svg>
                    ),
                    isPro: true,
                  },
                  {
                    id: "leaf" as const,
                    label: "Feuille",
                    svg: (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 12 C3 5 5 3 12 3 L21 3 L21 12 C21 19 19 21 12 21 L3 21 Z" />
                        <path d="M8 12 C8 8 9 8 12 8 L16 8 L16 12 C16 16 15 16 12 16 L8 16 Z" fill="currentColor" />
                      </svg>
                    ),
                    isPro: true,
                  },
                  {
                    id: "hexagon" as const,
                    label: "Hexagone",
                    svg: (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polygon points="12 2, 21 7, 21 17, 12 22, 3 17, 3 7" />
                        <polygon points="12 6, 17 9, 17 15, 12 18, 7 15, 7 9" fill="currentColor" />
                      </svg>
                    ),
                    isPro: true,
                  },
                  {
                    id: "star" as const,
                    label: "Étoile",
                    svg: (
                      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2 L14.5 9.5 L22 12 L14.5 14.5 L12 22 L9.5 14.5 L2 12 L9.5 9.5 Z" />
                        <path d="M12 7 L13.5 10.5 L17 12 L13.5 13.5 L12 17 L10.5 13.5 L7 12 L10.5 10.5 Z" fill="currentColor" />
                      </svg>
                    ),
                    isPro: true,
                  },
                  ...(showMoreEyes
                    ? [
                        {
                          id: "cyber" as const,
                          label: "Cyber",
                          svg: (
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polygon points="12 2, 22 12, 12 22, 2 12" />
                              <polygon points="12 7, 17 12, 12 17, 7 12" fill="currentColor" />
                            </svg>
                          ),
                          isPro: true,
                        },
                      ]
                    : []),
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      if (!item.isPro || isProPlan) {
                        setEyeStyle(item.id);
                      } else {
                        triggerPlanUpgrade({
                          reason: `La forme d'œil "${item.label}" est réservée aux forfaits Pro & Business.`,
                          featureName: "Formes d'yeux Pro",
                        });
                      }
                    }}
                    className={`btn-hover-scale relative flex flex-col items-center justify-center w-14 h-14 rounded-[10px] border transition-all duration-200 cursor-pointer ${
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

                <button
                  type="button"
                  onClick={() => setShowMoreEyes(!showMoreEyes)}
                  className="btn-hover-scale text-xs font-semibold text-[#ff6600] hover:underline px-2 py-1 cursor-pointer"
                >
                  {showMoreEyes ? "- Moins" : "+ Plus"}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: CHOISISSEZ VOS COULEURS */}
          <div className="p-4 sm:p-5 rounded-[12px] bg-[#141416] border border-[#222225] flex flex-col gap-5">
            <h3 className="text-sm font-bold text-white tracking-wide">Choisissez vos couleurs</h3>

            {/* Prédéfini */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-400">Prédéfini</span>
                {!isProPlan && (
                  <span className="text-[10px] text-amber-400 font-semibold">
                    Freemium : Noir, Orange, Rouge, Blanc
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { hex: "#000000", name: "Noir", isPro: false },
                  { hex: "#ff6600", name: "Orange LShorter", isPro: false },
                  { hex: "#ef4444", name: "Rouge", isPro: false },
                  { hex: "#ffffff", name: "Blanc", isPro: false },
                  { hex: "#10b981", name: "Vert", isPro: true },
                  { hex: "#0ea5e9", name: "Cyan", isPro: true },
                  { hex: "#3b82f6", name: "Bleu", isPro: true },
                  { hex: "#8b5cf6", name: "Violet", isPro: true },
                  { hex: "#ec4899", name: "Rose", isPro: true },
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
                  >
                    {c.isPro && !isProPlan && (
                      <Crown className="w-2.5 h-2.5 text-amber-400 absolute -top-1 -right-1" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Pixels color row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-2 border-t border-[#222225]">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Pixels</label>
                <select
                  value={colorMode}
                  onChange={(e) => {
                    const mode = e.target.value as any;
                    if (mode === "gradient" && !isProPlan) {
                      triggerPlanUpgrade({
                        reason: "Les dégradés de couleurs sont réservés au forfait Pro.",
                        featureName: "Dégradés QR",
                      });
                      return;
                    }
                    setColorMode(mode);
                  }}
                  className="w-full h-10 rounded-[8px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                >
                  <option value="monochrome" className="bg-[#141416] text-white">Monochrome</option>
                  <option value="gradient" className="bg-[#141416] text-white">Dégradé (Gradient) 👑</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1 flex items-center justify-between">
                  <span>Valeur hexadécimale</span>
                  {colorMode === "gradient" && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={pixelColor}
                    onChange={(e) => {
                      if (!isProPlan && !isFreemiumAllowedColor(e.target.value)) {
                        triggerPlanUpgrade({
                          reason: "Les codes hexadécimaux sur-mesure sont réservés au forfait Pro.",
                          featureName: "Palette Hex Libre",
                        });
                        return;
                      }
                      setPixelColor(e.target.value);
                    }}
                    className="w-8 h-8 rounded-[6px] bg-transparent border-0 cursor-pointer hover:scale-105"
                  />
                  <Input
                    value={pixelColor}
                    onChange={(e) => setPixelColor(e.target.value)}
                    className="font-mono uppercase text-xs h-10"
                  />
                  {colorMode === "gradient" && isProPlan && (
                    <input
                      type="color"
                      value={pixelColor2}
                      onChange={(e) => setPixelColor2(e.target.value)}
                      className="w-8 h-8 rounded-[6px] bg-transparent border-0 cursor-pointer hover:scale-105"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Arrière-plan color row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Arrière-plan</label>
                <select
                  value={bgMode}
                  onChange={(e) => {
                    const mode = e.target.value as any;
                    if ((mode === "transparent" || mode === "gradient") && !isProPlan) {
                      triggerPlanUpgrade({
                        reason: "L'arrière-plan transparent et en dégradé est réservé au forfait Pro.",
                        featureName: "Fond Transparent & Dégradé",
                      });
                      return;
                    }
                    setBgMode(mode);
                  }}
                  className="w-full h-10 rounded-[8px] bg-[#1a1a1e] text-white border border-[#27272a] px-3 text-xs focus:outline-none focus:border-[#ff6600] cursor-pointer"
                >
                  <option value="monochrome" className="bg-[#141416] text-white">Monochrome</option>
                  <option value="transparent" className="bg-[#141416] text-white">Transparent 👑</option>
                  <option value="gradient" className="bg-[#141416] text-white">Dégradé 👑</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-400 mb-1">Valeur hexadécimale</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="w-8 h-8 rounded-[6px] bg-transparent border-0 cursor-pointer hover:scale-105"
                  />
                  <Input
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="font-mono uppercase text-xs h-10"
                  />
                </div>
              </div>
            </div>

            {/* Angles Toggle */}
            <label className="flex items-center justify-between p-3 rounded-[8px] bg-[#1a1a1e] border border-[#27272a] cursor-pointer text-xs">
              <span className="font-semibold text-neutral-300">
                Couleur personnalisée pour les angles (Yeux)
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useSeparateEyeColor}
                  onChange={(e) => {
                    if (!isProPlan) {
                      triggerPlanUpgrade({
                        reason: "L'assignation d'une couleur indépendante pour les yeux requiert le forfait Pro.",
                        featureName: "Couleur Yeux Indépendante",
                      });
                      return;
                    }
                    setUseSeparateEyeColor(e.target.checked);
                  }}
                  className="w-4 h-4 accent-[#ff6600] cursor-pointer"
                />
                {useSeparateEyeColor && isProPlan && (
                  <input
                    type="color"
                    value={eyeColor}
                    onChange={(e) => setEyeColor(e.target.value)}
                    className="w-6 h-6 rounded bg-transparent border-0 cursor-pointer hover:scale-105"
                  />
                )}
              </div>
            </label>
          </div>

          {/* SECTION 3: AJOUTER UN LOGO OU DU TEXTE AU CENTRE */}
          <div className="p-4 sm:p-5 rounded-[12px] bg-[#141416] border border-[#222225] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white tracking-wide">Ajouter un logo ou du texte au centre</h3>
              {!isProPlan && (
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold">
                  👑 SURCLASSEZ VOTRE FORFAIT
                </span>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />

            <div className="flex flex-wrap items-center gap-2.5">
              {/* None */}
              <button
                type="button"
                onClick={() => setSelectedLogo("none")}
                className={`btn-hover-scale w-12 h-12 rounded-[10px] border flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer ${
                  selectedLogo === "none"
                    ? "bg-[#ff6600]/15 border-[#ff6600] text-white"
                    : "bg-[#1a1a1e] border-[#27272a] text-neutral-400 hover:text-white"
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Upload Image (Pro Only) */}
              <button
                type="button"
                onClick={() => {
                  if (!isProPlan) {
                    triggerPlanUpgrade({
                      reason: "Le téléversement de votre propre logo de marque est réservé au forfait Pro.",
                      featureName: "Logo Personnalisé Upload",
                    });
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className={`btn-hover-scale relative w-12 h-12 rounded-[10px] border flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer ${
                  selectedLogo === "custom"
                    ? "bg-[#ff6600]/15 border-[#ff6600] text-white"
                    : "bg-[#1a1a1e] border-[#27272a] text-neutral-400 hover:text-white"
                }`}
                title="Téléverser image"
              >
                {!isProPlan && <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />}
                <Upload className="w-4 h-4 text-[#ff6600]" />
              </button>

              {/* Custom Text (Pro Only) */}
              <button
                type="button"
                onClick={() => {
                  if (!isProPlan) {
                    triggerPlanUpgrade({
                      reason: "L'insertion de texte custom au centre requiert le forfait Pro.",
                      featureName: "Texte Personnalisé au Centre",
                    });
                    return;
                  }
                  setSelectedLogo("text");
                }}
                className={`btn-hover-scale relative px-3 h-12 rounded-[10px] border flex items-center justify-center text-[10px] font-bold uppercase transition-all duration-200 cursor-pointer ${
                  selectedLogo === "text"
                    ? "bg-[#ff6600]/15 border-[#ff6600] text-white"
                    : "bg-[#1a1a1e] border-[#27272a] text-neutral-400 hover:text-white"
                }`}
              >
                {!isProPlan && <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />}
                CUSTOM TEXT
              </button>

              {/* LShorter QL Logo (Free) */}
              <button
                type="button"
                onClick={() => setSelectedLogo("ql")}
                className={`btn-hover-scale w-12 h-12 rounded-[10px] border flex items-center justify-center text-xs font-black transition-all duration-200 cursor-pointer ${
                  selectedLogo === "ql"
                    ? "bg-[#ff6600] text-white border-[#ff6600] shadow-md shadow-[#ff6600]/30"
                    : "bg-[#1a1a1e] border-[#27272a] text-[#ff6600]"
                }`}
              >
                QL
              </button>

              {/* Facebook Logo (Free) */}
              <button
                type="button"
                onClick={() => setSelectedLogo("facebook")}
                className={`btn-hover-scale w-12 h-12 rounded-[10px] border flex items-center justify-center text-base font-bold transition-all duration-200 cursor-pointer ${
                  selectedLogo === "facebook"
                    ? "bg-[#1877F2]/20 border-[#1877F2] text-[#1877F2]"
                    : "bg-[#1a1a1e] border-[#27272a] text-neutral-400 hover:text-white"
                }`}
              >
                f
              </button>

              {/* Instagram Logo (Free) */}
              <button
                type="button"
                onClick={() => setSelectedLogo("instagram")}
                className={`btn-hover-scale w-12 h-12 rounded-[10px] border flex items-center justify-center text-base font-bold transition-all duration-200 cursor-pointer ${
                  selectedLogo === "instagram"
                    ? "bg-[#E4405F]/20 border-[#E4405F] text-[#E4405F]"
                    : "bg-[#1a1a1e] border-[#27272a] text-neutral-400 hover:text-white"
                }`}
              >
                📷
              </button>

              {/* Pro Brands */}
              {showMoreLogos && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isProPlan) {
                        triggerPlanUpgrade({
                          reason: "L'intégration du logo X (Twitter) requiert le forfait Pro.",
                          featureName: "Logo Twitter / X",
                        });
                        return;
                      }
                      setSelectedLogo("twitter");
                    }}
                    className="btn-hover-scale w-12 h-12 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] text-white font-bold flex items-center justify-center relative cursor-pointer"
                  >
                    {!isProPlan && <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />}
                    𝕏
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isProPlan) {
                        triggerPlanUpgrade({
                          reason: "L'intégration du logo WhatsApp requiert le forfait Pro.",
                          featureName: "Logo WhatsApp",
                        });
                        return;
                      }
                      setSelectedLogo("whatsapp");
                    }}
                    className="btn-hover-scale w-12 h-12 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] text-[#25D366] font-bold flex items-center justify-center relative cursor-pointer"
                  >
                    {!isProPlan && <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />}
                    💬
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setShowMoreLogos(!showMoreLogos)}
                className="btn-hover-scale text-xs font-semibold text-[#ff6600] hover:underline px-2 py-1 cursor-pointer"
              >
                {showMoreLogos ? "- Moins" : "+ Plus"}
              </button>
            </div>

            {selectedLogo === "text" && isProPlan && (
              <div className="pt-2">
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Texte au centre (max 6 lettres)
                </label>
                <Input
                  maxLength={6}
                  value={centerText}
                  onChange={(e) => setCenterText(e.target.value.toUpperCase())}
                  placeholder="SCAN"
                />
              </div>
            )}

            <p className="text-[11px] text-neutral-500">
              Type de fichier : PNG, SVG, JPG. Ratio 1:1. Taille maximale : 5MB.
            </p>
          </div>

          {/* SECTION 4: SÉLECTIONNEZ UN CADRE */}
          <div className="p-4 sm:p-5 rounded-[12px] bg-[#141416] border border-[#222225] flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white tracking-wide">Sélectionnez un cadre</h3>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* None */}
              <button
                type="button"
                onClick={() => setSelectedFrame("none")}
                className={`btn-hover-scale w-14 h-14 rounded-[10px] border flex items-center justify-center text-xs font-bold transition-all duration-200 cursor-pointer ${
                  selectedFrame === "none"
                    ? "bg-[#ff6600]/15 border-[#ff6600] text-white"
                    : "bg-[#1a1a1e] border-[#27272a] text-neutral-400 hover:text-white"
                }`}
              >
                <X className="w-5 h-5" />
              </button>

              {/* Simple Border */}
              <button
                type="button"
                onClick={() => setSelectedFrame("simple")}
                className={`btn-hover-scale w-14 h-14 rounded-[10px] border flex flex-col items-center justify-center p-1 text-[9px] font-semibold transition-all duration-200 cursor-pointer ${
                  selectedFrame === "simple"
                    ? "bg-[#ff6600]/15 border-[#ff6600] text-white"
                    : "bg-[#1a1a1e] border-[#27272a] text-neutral-400 hover:text-white"
                }`}
              >
                <div className="w-7 h-7 border-2 border-current rounded-sm" />
                <span>Cadre</span>
              </button>

              {/* Bottom Pill CTA */}
              <button
                type="button"
                onClick={() => setSelectedFrame("bottom_pill")}
                className={`btn-hover-scale w-14 h-14 rounded-[10px] border flex flex-col items-center justify-center p-1 text-[9px] font-semibold transition-all duration-200 cursor-pointer ${
                  selectedFrame === "bottom_pill"
                    ? "bg-[#ff6600]/15 border-[#ff6600] text-white"
                    : "bg-[#1a1a1e] border-[#27272a] text-neutral-400 hover:text-white"
                }`}
              >
                <div className="w-6 h-6 border-2 border-current rounded-sm mb-0.5" />
                <span className="bg-[#ff6600] text-white px-1 rounded text-[7px] font-bold">SCAN ME</span>
              </button>

              {/* Top Header CTA */}
              <button
                type="button"
                onClick={() => {
                  if (!isProPlan) {
                    triggerPlanUpgrade({
                      reason: "Le cadre avec en-tête supérieur est réservé au forfait Pro.",
                      featureName: "Cadre En-tête Pro",
                    });
                    return;
                  }
                  setSelectedFrame("top_header");
                }}
                className={`btn-hover-scale relative w-14 h-14 rounded-[10px] border flex flex-col items-center justify-center p-1 text-[9px] font-semibold transition-all duration-200 cursor-pointer ${
                  selectedFrame === "top_header"
                    ? "bg-[#ff6600]/15 border-[#ff6600] text-white"
                    : "bg-[#1a1a1e] border-[#27272a] text-neutral-400 hover:text-white"
                }`}
              >
                {!isProPlan && <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />}
                <span className="bg-[#ff6600] text-white px-1 rounded text-[7px] font-bold mb-0.5">SCAN</span>
                <div className="w-6 h-6 border-2 border-current rounded-sm" />
              </button>

              {/* Hand Arrow */}
              <button
                type="button"
                onClick={() => {
                  if (!isProPlan) {
                    triggerPlanUpgrade({
                      reason: "La flèche manuscrite 'Scan me' est réservée au forfait Pro.",
                      featureName: "Flèche Manuscrite Pro",
                    });
                    return;
                  }
                  setSelectedFrame("hand_arrow");
                }}
                className={`btn-hover-scale relative w-14 h-14 rounded-[10px] border flex flex-col items-center justify-center p-1 text-[9px] font-semibold transition-all duration-200 cursor-pointer ${
                  selectedFrame === "hand_arrow"
                    ? "bg-[#ff6600]/15 border-[#ff6600] text-white"
                    : "bg-[#1a1a1e] border-[#27272a] text-neutral-400 hover:text-white"
                }`}
              >
                {!isProPlan && <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />}
                <span className="italic text-[10px] font-serif">Scan me ⤹</span>
              </button>

              {/* Pro Frames */}
              {showMoreFrames && (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isProPlan) {
                        triggerPlanUpgrade({
                          reason: "Le cadre Badge Moderne est réservé au forfait Pro.",
                          featureName: "Badge Moderne Pro",
                        });
                        return;
                      }
                      setSelectedFrame("modern_badge");
                    }}
                    className="btn-hover-scale relative w-14 h-14 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] text-white flex flex-col items-center justify-center text-[9px] font-bold cursor-pointer"
                  >
                    {!isProPlan && <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />}
                    <span>Badge ★</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!isProPlan) {
                        triggerPlanUpgrade({
                          reason: "La lueur néon est réservée au forfait Pro.",
                          featureName: "Cadre Néon Glow Pro",
                        });
                        return;
                      }
                      setSelectedFrame("neon");
                    }}
                    className="btn-hover-scale relative w-14 h-14 rounded-[10px] bg-[#1a1a1e] border border-[#27272a] text-[#ff6600] flex flex-col items-center justify-center text-[9px] font-bold cursor-pointer shadow-lg shadow-[#ff6600]/20"
                  >
                    {!isProPlan && <Crown className="w-3.5 h-3.5 text-amber-400 absolute -top-1 -right-1" />}
                    <span>Néon Glow</span>
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setShowMoreFrames(!showMoreFrames)}
                className="btn-hover-scale text-xs font-semibold text-[#ff6600] hover:underline px-2 py-1 cursor-pointer"
              >
                {showMoreFrames ? "- Moins" : "+ Plus"}
              </button>
            </div>

            {selectedFrame !== "none" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#222225]">
                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Texte du cadre
                  </label>
                  <Input
                    value={frameText}
                    onChange={(e) => setFrameText(e.target.value)}
                    placeholder="SCAN ME"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-300 mb-1">
                    Couleur du cadre
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={frameColor}
                      onChange={(e) => setFrameColor(e.target.value)}
                      className="w-8 h-8 rounded bg-transparent border-0 cursor-pointer hover:scale-105"
                    />
                    <Input
                      value={frameColor}
                      onChange={(e) => setFrameColor(e.target.value)}
                      className="font-mono uppercase text-xs h-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Live Interactive Preview (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4 sticky top-24">
          <span className="text-xs font-semibold text-neutral-300">Aperçu en direct</span>

          {/* Big White Card for QR Code Container */}
          <div className="rounded-[16px] bg-[#141416] border border-[#222225] p-6 flex flex-col items-center justify-center shadow-2xl overflow-hidden">
            <div className="p-4 rounded-[14px] bg-white flex items-center justify-center shadow-xl">
              <canvas ref={canvasRef} className="max-w-full h-auto object-contain" />
            </div>
          </div>

          {/* Size / Resolution Slider */}
          <div className="p-4 rounded-[10px] bg-[#141416] border border-[#222225] flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-neutral-300">
              <span>Résolution</span>
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

          {/* Action Buttons */}
          <div className="grid grid-cols-3 gap-2.5">
            <button
              onClick={downloadPNG}
              className="btn-hover-scale flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-[#ff6600] hover:bg-[#ff771a] text-white text-xs font-bold shadow-lg shadow-[#ff6600]/25 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>PNG</span>
            </button>

            <button
              onClick={downloadSVG}
              className="btn-hover-scale flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-white/5 hover:bg-white/10 border border-[#27272a] hover:border-[#ff6600] text-neutral-200 hover:text-white text-xs font-semibold cursor-pointer"
            >
              <Download className="w-4 h-4 text-[#ff6600]" />
              <span>SVG</span>
            </button>

            <button
              onClick={() => {
                navigator.clipboard.writeText(getRawQRValue());
                confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
                showToast.success("Contenu brut copié !");
              }}
              className="btn-hover-scale flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-white/5 hover:bg-white/10 border border-[#27272a] hover:border-[#ff6600] text-neutral-200 hover:text-white text-xs font-semibold cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Partager</span>
            </button>
          </div>

          <p className="text-center text-[11px] text-neutral-500">
            Le format SVG vectoriel conserve une netteté parfaite à n&apos;importe quelle taille d&apos;impression.
          </p>
        </div>
      </div>
    </div>
  );
}
