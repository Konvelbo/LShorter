"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  Sliders,
  Cpu,
  Terminal,
  Radar,
  Cloud,
  Gamepad2,
  Gem,
  Sunset,
  Music,
  Coffee,
  Heart,
  Waves,
  CloudRain,
  Snowflake,
  Zap,
  Leaf,
  Dna,
  Trophy,
  Flag,
  Flame,
  Rocket,
  Atom,
  Brain,
  Crosshair,
  Blocks,
  Activity,
  Gift,
  Ghost,
  Sun,
  Binary,
  Swords,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerClose,
} from "@/components/ui/drawer";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  QRContentType,
  ShortLink,
} from "@/types";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { LinkShareModal } from "@/components/dashboard/link-share-modal";
import { triggerPlanUpgrade } from "@/lib/plan-guard";
import { showToast } from "@/components/ui/toast-provider";
import { cfUploadImage, cfGetLinks, cfUpdateLink, cfInvalidateCache } from "@/lib/cloudflare-api";
import { exportFramesToGif } from "@/lib/qr/gif-export";
import {
  ANIMATED_THEMES,
  ANIMATED_THEME_CATEGORIES,
  getAnimatedTheme,
  type AnimatedThemeCategory,
  type ThemeMotif,
} from "./qr-animated-themes";
import {
  ANIMATED_LOOP_DURATION_SEC,
  getAnimatedFramePaddings,
} from "./qr-animated-frames";
import { hexToRgbTuple } from "./qr-webgl-shaders";
import { LiveColorControl } from "./live-color-control";
import { LiveFontSizeControl } from "./live-font-size-control";
import { prewarmLogoImages } from "./qr-logo-canvas";
import {
  BrandLogosPicker,
  FramesPicker,
  FontsPicker,
  PixelStylesPicker,
  EyeStylesPicker,
} from "./qr-studio-pickers";
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
import { useI18n } from "@/components/providers/i18n-provider";

export const FONT_FAMILIES: {
  id: FontFamilyType;
  label: string;
  name: string;
  preview: string;
  category: "Sans-Serif" | "Serif" | "Display" | "Monospace" | "Cursive" | "Futuristic";
  fontCss: string;
}[] = [
  // Sans-Serif Modern & Tech (20)
  { id: "inter", label: "Inter", name: "Inter (Modern)", preview: "Modern & Clean", category: "Sans-Serif", fontCss: "'Inter', sans-serif" },
  { id: "roboto", label: "Roboto", name: "Roboto (Tech)", preview: "Clear & Standard", category: "Sans-Serif", fontCss: "'Roboto', sans-serif" },
  { id: "montserrat", label: "Montserrat", name: "Montserrat (Impact)", preview: "Geometric Impact", category: "Sans-Serif", fontCss: "'Montserrat', sans-serif" },
  { id: "poppins", label: "Poppins", name: "Poppins (Rounded)", preview: "Rounded & Warm", category: "Sans-Serif", fontCss: "'Poppins', sans-serif" },
  { id: "plus_jakarta", label: "Plus Jakarta", name: "Plus Jakarta Sans", preview: "Ultra-Modern UI", category: "Sans-Serif", fontCss: "'Plus Jakarta Sans', sans-serif" },
  { id: "outfit", label: "Outfit", name: "Outfit (Minimal)", preview: "Minimal & Pro", category: "Sans-Serif", fontCss: "'Outfit', sans-serif" },
  { id: "raleway", label: "Raleway", name: "Raleway (Elegant)", preview: "Slim & Elegant", category: "Sans-Serif", fontCss: "'Raleway', sans-serif" },
  { id: "lato", label: "Lato", name: "Lato (Balanced)", preview: "Corporate & Clean", category: "Sans-Serif", fontCss: "'Lato', sans-serif" },
  { id: "open_sans", label: "Open Sans", name: "Open Sans", preview: "Perfect Readability", category: "Sans-Serif", fontCss: "'Open Sans', sans-serif" },
  { id: "dm_sans", label: "DM Sans", name: "DM Sans (Geometric)", preview: "Clean & Geometric", category: "Sans-Serif", fontCss: "'DM Sans', sans-serif" },
  { id: "manrope", label: "Manrope", name: "Manrope (Tech UI)", preview: "Crisp Semi-Geometric", category: "Sans-Serif", fontCss: "'Manrope', sans-serif" },
  { id: "work_sans", label: "Work Sans", name: "Work Sans (Grotesque)", preview: "Editorial & Print", category: "Sans-Serif", fontCss: "'Work Sans', sans-serif" },
  { id: "sora", label: "Sora", name: "Sora (Neo-Grotesk)", preview: "Digital & Decisive", category: "Sans-Serif", fontCss: "'Sora', sans-serif" },
  { id: "space_grotesk", label: "Space Grotesk", name: "Space Grotesk (Tech)", preview: "Cyber Semi-Mono", category: "Sans-Serif", fontCss: "'Space Grotesk', sans-serif" },
  { id: "lexend", label: "Lexend", name: "Lexend (Readability)", preview: "Instant Legibility", category: "Sans-Serif", fontCss: "'Lexend', sans-serif" },
  { id: "rubik", label: "Rubik", name: "Rubik (Smooth)", preview: "Soft Rounded Corners", category: "Sans-Serif", fontCss: "'Rubik', sans-serif" },
  { id: "nunito", label: "Nunito", name: "Nunito (Friendly)", preview: "Friendly & Playful", category: "Sans-Serif", fontCss: "'Nunito', sans-serif" },
  { id: "urbanist", label: "Urbanist", name: "Urbanist (Fashion)", preview: "Trendy Minimalist", category: "Sans-Serif", fontCss: "'Urbanist', sans-serif" },
  { id: "jost", label: "Jost", name: "Jost (Futura-like)", preview: "Bauhaus Classic", category: "Sans-Serif", fontCss: "'Jost', sans-serif" },
  { id: "albert_sans", label: "Albert Sans", name: "Albert Sans (Modern)", preview: "Nordic Functional", category: "Sans-Serif", fontCss: "'Albert Sans', sans-serif" },

  // Serif & Prestige (14)
  { id: "playfair", label: "Playfair", name: "Playfair Display", preview: "Luxury & Editorial", category: "Serif", fontCss: "'Playfair Display', serif" },
  { id: "cinzel", label: "Cinzel", name: "Cinzel (Classic)", preview: "Royal & Antique", category: "Serif", fontCss: "'Cinzel', serif" },
  { id: "lora", label: "Lora", name: "Lora (Literary)", preview: "Poetic & Editorial", category: "Serif", fontCss: "'Lora', serif" },
  { id: "merriweather", label: "Merriweather", name: "Merriweather", preview: "Press & Magazine", category: "Serif", fontCss: "'Merriweather', serif" },
  { id: "cormorant", label: "Cormorant", name: "Cormorant Garamond", preview: "Haute Couture", category: "Serif", fontCss: "'Cormorant Garamond', serif" },
  { id: "bodoni_moda", label: "Bodoni Moda", name: "Bodoni Moda (Vogue)", preview: "High Fashion & Glamour", category: "Serif", fontCss: "'Bodoni Moda', serif" },
  { id: "dm_serif", label: "DM Serif", name: "DM Serif Display", preview: "Warm Dramatic Serif", category: "Serif", fontCss: "'DM Serif Display', serif" },
  { id: "prata", label: "Prata", name: "Prata (Didone)", preview: "Refined & Teardrop", category: "Serif", fontCss: "'Prata', serif" },
  { id: "eb_garamond", label: "EB Garamond", name: "EB Garamond (Heritage)", preview: "Renaissance Prestige", category: "Serif", fontCss: "'EB Garamond', serif" },
  { id: "libre_baskerville", label: "Baskerville", name: "Libre Baskerville", preview: "English Traditional", category: "Serif", fontCss: "'Libre Baskerville', serif" },
  { id: "abril_fatface", label: "Abril Fatface", name: "Abril Fatface (Bold)", preview: "Bold Titling Drama", category: "Serif", fontCss: "'Abril Fatface', serif" },
  { id: "crimson_pro", label: "Crimson Pro", name: "Crimson Pro (Book)", preview: "Scholarly & Elegant", category: "Serif", fontCss: "'Crimson Pro', serif" },
  { id: "bitter", label: "Bitter", name: "Bitter (Contemporary)", preview: "Sturdy Slab Serif", category: "Serif", fontCss: "'Bitter', serif" },
  { id: "castoro", label: "Castoro", name: "Castoro (Scholarly)", preview: "Academic & Poetic", category: "Serif", fontCss: "'Castoro', serif" },

  // Display, Headlines & Posters (16)
  { id: "bebas", label: "Bebas Neue", name: "Bebas Neue (Poster)", preview: "HEADLINE & POSTER", category: "Display", fontCss: "'Bebas Neue', sans-serif" },
  { id: "anton", label: "Anton", name: "Anton (Impact)", preview: "MEGA HEADLINE IMPACT", category: "Display", fontCss: "'Anton', sans-serif" },
  { id: "righteous", label: "Righteous", name: "Righteous (Retro)", preview: "Synthwave & 80s Pop", category: "Display", fontCss: "'Righteous', sans-serif" },
  { id: "syne", label: "Syne", name: "Syne (Avant-Garde)", preview: "Creative & Avant-Garde", category: "Display", fontCss: "'Syne', sans-serif" },
  { id: "oswald", label: "Oswald", name: "Oswald (Condensed)", preview: "BOLD CONDENSED", category: "Display", fontCss: "'Oswald', sans-serif" },
  { id: "russo_one", label: "Russo One", name: "Russo One (Block)", preview: "POWER & BLOCK", category: "Display", fontCss: "'Russo One', sans-serif" },
  { id: "archivo_black", label: "Archivo Black", name: "Archivo Black (Heavy)", preview: "ULTRA HEAVY WEIGHT", category: "Display", fontCss: "'Archivo Black', sans-serif" },
  { id: "bangers", label: "Bangers", name: "Bangers (Comic)", preview: "POW! COMIC ACTION", category: "Display", fontCss: "'Bangers', cursive, sans-serif" },
  { id: "monoton", label: "Monoton", name: "Monoton (Disco)", preview: "DISCO MULTI-LINE", category: "Display", fontCss: "'Monoton', cursive, sans-serif" },
  { id: "permanent_marker", label: "Perm Marker", name: "Permanent Marker", preview: "STREET GRAFFITI", category: "Display", fontCss: "'Permanent Marker', cursive, sans-serif" },
  { id: "fredoka", label: "Fredoka", name: "Fredoka (Chunky)", preview: "Super Chunky Bold", category: "Display", fontCss: "'Fredoka', sans-serif" },
  { id: "press_start", label: "Press Start", name: "Press Start 2P (Arcade)", preview: "RETRO 8-BIT ARCADE", category: "Display", fontCss: "'Press Start 2P', monospace, sans-serif" },
  { id: "shrikhand", label: "Shrikhand", name: "Shrikhand (Curved)", preview: "Hand-Painted Poster", category: "Display", fontCss: "'Shrikhand', cursive, serif" },
  { id: "luckiest_guy", label: "Luckiest Guy", name: "Luckiest Guy (Cartoon)", preview: "CARTOON BILLBOARD", category: "Display", fontCss: "'Luckiest Guy', cursive, sans-serif" },
  { id: "black_ops_one", label: "Black Ops", name: "Black Ops One (Military)", preview: "MILITARY STENCIL", category: "Display", fontCss: "'Black Ops One', cursive, sans-serif" },
  { id: "bungee", label: "Bungee", name: "Bungee (Urban)", preview: "URBAN SIGNPOST", category: "Display", fontCss: "'Bungee', cursive, sans-serif" },

  // Monospace & Developer (9)
  { id: "jetbrains", label: "JetBrains", name: "JetBrains Mono", preview: "const code = true;", category: "Monospace", fontCss: "'JetBrains Mono', monospace" },
  { id: "fira_code", label: "Fira Code", name: "Fira Code (Dev)", preview: "fn qr() -> &str", category: "Monospace", fontCss: "'Fira Code', monospace" },
  { id: "space_mono", label: "Space Mono", name: "Space Mono", preview: "01010011 // SCAN", category: "Monospace", fontCss: "'Space Mono', monospace" },
  { id: "source_code_pro", label: "Source Code", name: "Source Code Pro", preview: "git commit -m \"ok\"", category: "Monospace", fontCss: "'Source Code Pro', monospace" },
  { id: "ibm_plex_mono", label: "IBM Plex", name: "IBM Plex Mono", preview: "sys.platform == 'io'", category: "Monospace", fontCss: "'IBM Plex Mono', monospace" },
  { id: "roboto_mono", label: "Roboto Mono", name: "Roboto Mono", preview: "let hash = 0xfa;", category: "Monospace", fontCss: "'Roboto Mono', monospace" },
  { id: "dm_mono", label: "DM Mono", name: "DM Mono (Code)", preview: "std::cout << val;", category: "Monospace", fontCss: "'DM Mono', monospace" },
  { id: "inconsolata", label: "Inconsolata", name: "Inconsolata (Clean)", preview: "curl -sL https://", category: "Monospace", fontCss: "'Inconsolata', monospace" },
  { id: "courier_prime", label: "Courier Prime", name: "Courier Prime (Screenplay)", preview: "EXT. DAY - SCENE 1", category: "Monospace", fontCss: "'Courier Prime', monospace" },

  // Cursive & Handwritten (11)
  { id: "caveat", label: "Caveat", name: "Caveat (Marker)", preview: "Handwritten Script", category: "Cursive", fontCss: "'Caveat', cursive" },
  { id: "pacifico", label: "Pacifico", name: "Pacifico (Casual)", preview: "California & Fun", category: "Cursive", fontCss: "'Pacifico', cursive" },
  { id: "dancing_script", label: "Dancing Script", name: "Dancing Script", preview: "Free Calligraphy", category: "Cursive", fontCss: "'Dancing Script', cursive" },
  { id: "great_vibes", label: "Great Vibes", name: "Great Vibes (Signature)", preview: "Signature & Prestige", category: "Cursive", fontCss: "'Great Vibes', cursive" },
  { id: "satisfy", label: "Satisfy", name: "Satisfy (Vintage)", preview: "Warm Brush Script", category: "Cursive", fontCss: "'Satisfy', cursive" },
  { id: "alex_brush", label: "Alex Brush", name: "Alex Brush (Flourish)", preview: "Fluid Royal Script", category: "Cursive", fontCss: "'Alex Brush', cursive" },
  { id: "sacramento", label: "Sacramento", name: "Sacramento (Monoline)", preview: "Delicate Monoline", category: "Cursive", fontCss: "'Sacramento', cursive" },
  { id: "kaushan_script", label: "Kaushan", name: "Kaushan Script (Brush)", preview: "Rough Natural Brush", category: "Cursive", fontCss: "'Kaushan Script', cursive" },
  { id: "parisienne", label: "Parisienne", name: "Parisienne (Chic)", preview: "Romantic French Chic", category: "Cursive", fontCss: "'Parisienne', cursive" },
  { id: "yellowtail", label: "Yellowtail", name: "Yellowtail (Retro Script)", preview: "Mid-Century Signage", category: "Cursive", fontCss: "'Yellowtail', cursive" },
  { id: "shadows_into_light", label: "Shadows Light", name: "Shadows Into Light", preview: "Neat Casual Pencil", category: "Cursive", fontCss: "'Shadows Into Light', cursive" },

  // Futuristic & Cyber (10)
  { id: "orbitron", label: "Orbitron", name: "Orbitron (Cyber)", preview: "CYBERPUNK // HUD", category: "Futuristic", fontCss: "'Orbitron', sans-serif" },
  { id: "audiowide", label: "Audiowide", name: "Audiowide (Techno)", preview: "TECHNO MATRIX", category: "Futuristic", fontCss: "'Audiowide', sans-serif" },
  { id: "chakra_petch", label: "Chakra Petch", name: "Chakra Petch (Mecha)", preview: "MECHA PROTOCOL", category: "Futuristic", fontCss: "'Chakra Petch', sans-serif" },
  { id: "rajdhani", label: "Rajdhani", name: "Rajdhani (Sci-Fi)", preview: "AEROSPACE TECH", category: "Futuristic", fontCss: "'Rajdhani', sans-serif" },
  { id: "michroma", label: "Michroma", name: "Michroma (Hi-Tech)", preview: "WIDE SCREEN MATRIX", category: "Futuristic", fontCss: "'Michroma', sans-serif" },
  { id: "bruno_ace", label: "Bruno Ace", name: "Bruno Ace (Speed)", preview: "SPEED RACER PROTOCOL", category: "Futuristic", fontCss: "'Bruno Ace', cursive, sans-serif" },
  { id: "electrolize", label: "Electrolize", name: "Electrolize (Grid)", preview: "CIRCUIT ELECTRONICS", category: "Futuristic", fontCss: "'Electrolize', sans-serif" },
  { id: "nova_square", label: "Nova Square", name: "Nova Square (Digital)", preview: "DIGITAL TERMINAL", category: "Futuristic", fontCss: "'Nova Square', cursive, sans-serif" },
  { id: "syne_mono", label: "Syne Mono", name: "Syne Mono (Glitch)", preview: "GLITCH RUNNER V2", category: "Futuristic", fontCss: "'Syne Mono', monospace, sans-serif" },
  { id: "teko", label: "Teko", name: "Teko (Tall Cyber)", preview: "TALL KINETIC METRO", category: "Futuristic", fontCss: "'Teko', sans-serif" },
];

export function QRGenerator() {
  const { tr } = useI18n();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const paramUrl = searchParams.get("url") || "";
  const paramSlug = searchParams.get("slug") || "";
  const paramId = searchParams.get("id") || "";

  const userId = session?.user?.id || "";
  const convexUser = useQuery(api.users.getCurrentUser, userId ? { userId } : "skip");
  const plan =
    convexUser?.plan ||
    (session?.user as { plan?: string } | undefined)?.plan ||
    "FREEMIUM";
  const isProPlan = plan === "PRO" || plan === "BUSINESS" || plan === "ENTERPRISE";
  const [contentType, setContentType] = useState<QRContentType>("link");

  const [userLinks, setUserLinks] = useState<ShortLink[]>([]);
  const [isLoadingLinks, setIsLoadingLinks] = useState(false);
  const [isSavingCustomization, setIsSavingCustomization] = useState(false);
  const [matchedLink, setMatchedLink] = useState<ShortLink | null>(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Animation & GIF States
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(true);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [frameFilter, setFrameFilter] = useState<"all" | "static" | "animated">("all");
  const [animatedCategoryFilter, setAnimatedCategoryFilter] =
    useState<AnimatedThemeCategory>("all");

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
  const [selectedLogo, setSelectedLogo] = useState<LogoType | string>("none");
  const [centerText, setCenterText] = useState("SCAN");
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);

  // Frame Inputs
  const [selectedFrame, setSelectedFrame] = useState<FrameType>("bottom_pill");
  const [frameText, setFrameText] = useState("SCAN ME");
  const [frameColor, setFrameColor] = useState("#ff6600");
  const [tintWithFrameColor, setTintWithFrameColor] = useState(false);

  // Typography Inputs
  const [fontFamily, setFontFamily] = useState<FontFamilyType>("inter");
  const [fontSize, setFontSize] = useState<number>(12);
  const [fontWeight, setFontWeight] = useState<FontWeightType>("bold");
  const [textTransform, setTextTransform] = useState<TextTransformType>("uppercase");
  const [fontCategoryFilter, setFontCategoryFilter] = useState<string>("all");
  const [fontSearchQuery, setFontSearchQuery] = useState<string>("");
  const [showAllFonts, setShowAllFonts] = useState<boolean>(false);

  // Advanced Options: Standard resolution locked at 320px (responsive canvas adapts on mobile)
  const size = 320;
  const [includeQuietZone, setIncludeQuietZone] = useState(true);

  // Mobile Drawer State
  const [isMobile, setIsMobile] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // UI Expansion Toggles
  const [showMorePixels, setShowMorePixels] = useState(false);
  const [showMoreEyes, setShowMoreEyes] = useState(false);
  const [showMoreLogos, setShowMoreLogos] = useState(false);
  const [showMoreFrames, setShowMoreFrames] = useState(false);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lazy-load QR Studio specialty Google Fonts (80 curated unique fonts in 3 batches)
  useEffect(() => {
    const batches = [
      {
        id: "lshorter-qr-studio-fonts-1",
        href: "https://fonts.googleapis.com/css2?family=Anton&family=Audiowide&family=Bebas+Neue&family=Caveat:wght@600;700&family=Chakra+Petch:wght@600;700&family=Cinzel:wght@600;700;900&family=Cormorant+Garamond:wght@600;700&family=Dancing+Script:wght@600;700&family=Fira+Code:wght@500;700&family=Great+Vibes&family=Inter:wght@400;600;700;900&family=JetBrains+Mono:wght@500;700&family=Lato:wght@400;700;900&family=Lora:ital,wght@0,600;0,700;1,600&family=Merriweather:wght@400;700;900&family=Montserrat:wght@500;700;900&family=Open+Sans:wght@400;600;700;800&family=Orbitron:wght@600;800;900&family=Oswald:wght@500;700&family=Outfit:wght@500;700;900&family=Pacifico&family=Playfair+Display:ital,wght@0,600;0,800;1,600&family=Plus+Jakarta+Sans:wght@500;700;800&family=Poppins:wght@500;700;800&family=Raleway:wght@600;700;900&family=Righteous&family=Roboto:wght@500;700;900&family=Russo+One&family=Space+Mono:wght@400;700&family=Syne:wght@600;700;800&display=swap",
      },
      {
        id: "lshorter-qr-studio-fonts-2",
        href: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&family=Manrope:wght@500;700;800&family=Work+Sans:wght@400;600;700&family=Sora:wght@500;700;800&family=Space+Grotesk:wght@500;700&family=Lexend:wght@400;600;700&family=Rubik:wght@500;700;800&family=Nunito:wght@600;700;800&family=Urbanist:wght@500;700;800&family=Jost:wght@500;700;800&family=Albert+Sans:wght@500;700;800&family=Bodoni+Moda:ital,wght@0,600;0,800;1,600&family=DM+Serif+Display:ital@0;1&family=Prata&family=EB+Garamond:wght@500;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Abril+Fatface&family=Crimson+Pro:wght@500;700&family=Bitter:wght@500;700&family=Castoro:ital@0;1&family=Archivo+Black&family=Bangers&family=Monoton&family=Permanent+Marker&family=Fredoka:wght@600;700&display=swap",
      },
      {
        id: "lshorter-qr-studio-fonts-3",
        href: "https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Shrikhand&family=Luckiest+Guy&family=Black+Ops+One&family=Bungee&family=Source+Code+Pro:wght@500;700&family=IBM+Plex+Mono:wght@500;700&family=Roboto+Mono:wght@500;700&family=DM+Mono:wght@400;500&family=Inconsolata:wght@500;700;800&family=Courier+Prime:wght@400;700&family=Satisfy&family=Alex+Brush&family=Sacramento&family=Kaushan+Script&family=Parisienne&family=Yellowtail&family=Shadows+Into+Light&family=Rajdhani:wght@600;700&family=Michroma&family=Bruno+Ace&family=Electrolize&family=Nova+Square&family=Syne+Mono&family=Teko:wght@600;700&display=swap",
      },
    ];

    batches.forEach((b) => {
      if (!document.getElementById(b.id)) {
        const link = document.createElement("link");
        link.id = b.id;
        link.rel = "stylesheet";
        link.href = b.href;
        document.head.appendChild(link);
      }
    });

    // Pre-cache all brand logo SVG vector images for instantaneous 0ms display without jitter
    prewarmLogoImages();
  }, []);


  // 1. Initialize websiteUrl from searchParams
  useEffect(() => {
    queueMicrotask(() => {
      if (paramUrl) {
        setContentType("link");
        setWebsiteUrl(paramUrl.replace(/\/r\/([^/?#]+)$/, "/$1"));
      } else if (paramSlug) {
        setContentType("link");
        setWebsiteUrl(
          typeof window !== "undefined"
            ? `${window.location.origin}/${paramSlug}`
            : `https://lsho.cc/${paramSlug}`
        );
      }
    });
  }, [paramUrl, paramSlug]);

  // 2. Fetch user's links from Cloudflare D1
  useEffect(() => {
    if (!userId) return;
    const fetchLinks = async () => {
      setIsLoadingLinks(true);
      try {
        const res = await cfGetLinks(userId);
        const rawNested = (res?.data as { data?: unknown } | undefined)?.data;
        const listData = Array.isArray(res?.data)
          ? (res.data as ShortLink[])
          : Array.isArray(rawNested)
            ? (rawNested as ShortLink[])
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
    queueMicrotask(() => {
      if (contentType === "link" && websiteUrl) {
        const m = findMatchingLink(websiteUrl);
        setMatchedLink(m);
      } else {
        setMatchedLink(null);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [websiteUrl, contentType, userLinks, paramId]);

  // Memoized raw QR value & GF(256) matrix (never recomputed when only colors/frames change)
  const rawQrValue = useMemo((): string => {
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
  ]);

  const getRawQRValue = (): string => rawQrValue;

  const qrMatrix = useMemo(() => {
    return QRCode.create(rawQrValue, {
      errorCorrectionLevel: "H",
    });
  }, [rawQrValue]);

  // Memoized live styling bundle synced into renderConfigRef via effect (satisfies React 19 hooks/refs rule)
  const liveRenderConfig = useMemo(
    () => ({
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
      tintWithFrameColor,
      fontFamily,
      fontSize,
      fontWeight,
      textTransform,
      isProPlan,
    }),
    [
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
      tintWithFrameColor,
      fontFamily,
      fontSize,
      fontWeight,
      textTransform,
      isProPlan,
    ]
  );

  // Ref holding live styling state so color picker drags update Canvas2D/WebGL directly without React re-renders
  const renderConfigRef = useRef(liveRenderConfig);

  useEffect(() => {
    renderConfigRef.current = liveRenderConfig;
  }, [liveRenderConfig]);

  const lastAnimTimeSecRef = useRef(0);
  const redrawCanvasRef = useRef<() => void>(() => {});
  const pendingInstantRafRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (pendingInstantRafRef.current !== null) {
        cancelAnimationFrame(pendingInstantRafRef.current);
      }
    };
  }, []);

  const applyInstantColor = useCallback(
    (patch: Partial<typeof renderConfigRef.current>) => {
      renderConfigRef.current = { ...renderConfigRef.current, ...patch };
      if (pendingInstantRafRef.current === null) {
        pendingInstantRafRef.current = requestAnimationFrame(() => {
          pendingInstantRafRef.current = null;
          redrawCanvasRef.current();
        });
      }
    },
    []
  );

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
      tintWithFrameColor:
        selectedFrame !== "none" && isAnimatedFrame(selectedFrame)
          ? tintWithFrameColor
          : undefined,
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
      return getAnimatedFramePaddings(quietZone);
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
      case "corner_brackets":
        return { top: basePad + 8, bottom: 62, side: basePad + 8 };
      case "minimal_box":
        return { top: basePad + 8, bottom: basePad + 18, side: basePad + 8 };
      case "floating_card":
        return { top: basePad + 6, bottom: 56, side: basePad + 6 };
      case "double_border":
        return { top: basePad + 8, bottom: 62, side: basePad + 8 };
      case "clean_badge":
        return { top: 52, bottom: 58, side: basePad + 6 };
      case "notched_corners":
        return { top: basePad + 8, bottom: 62, side: basePad + 8 };
      case "stamp_border":
        return { top: basePad + 8, bottom: 62, side: basePad + 8 };
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
    qr: ReturnType<typeof QRCode.create>,
    timeSec: number,
    cfg = renderConfigRef.current
  ) => {
    const isAnim = isAnimatedFrame(cfg.selectedFrame);

    // 1. Draw Background (animated themes handle their own rounded shader shell + QR card)
    if (isAnim || cfg.bgMode === "transparent") {
      ctx.clearRect(0, 0, totalWidth, totalHeight);
    } else if (cfg.bgMode === "gradient") {
      const grad = ctx.createLinearGradient(0, 0, totalWidth, totalHeight);
      grad.addColorStop(0, cfg.bgColor);
      grad.addColorStop(1, cfg.bgColor2);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(0, 0, totalWidth, totalHeight, 16);
      ctx.fill();
    } else {
      ctx.fillStyle = cfg.bgColor;
      ctx.beginPath();
      ctx.roundRect(0, 0, totalWidth, totalHeight, 16);
      ctx.fill();
    }

    // 2. Draw Frame Decor (passing timeSec, dynamic typography, and adaptive card options)
    drawQRFrame(
      ctx,
      cfg.selectedFrame,
      totalWidth,
      totalHeight,
      cfg.frameColor,
      cfg.frameText,
      cfg.isProPlan,
      timeSec,
      cfg.fontFamily,
      cfg.fontSize,
      cfg.fontWeight,
      cfg.textTransform,
      isAnim
        ? {
            paddings,
            qrDrawSize,
            bgMode: cfg.bgMode,
            bgColor: cfg.bgColor,
            bgColor2: cfg.bgColor2,
            pixelColor: cfg.pixelColor,
            tintWithFrameColor: cfg.tintWithFrameColor,
          }
        : undefined
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

    const centerCutoutRadius = cfg.selectedLogo !== "none" ? Math.floor(moduleCount * 0.16) : 0;
    const centerMid = Math.floor(moduleCount / 2);
    const isCenterLogoArea = (r: number, c: number) => {
      if (cfg.selectedLogo === "none") return false;
      return (
        Math.abs(r - centerMid) <= centerCutoutRadius &&
        Math.abs(c - centerMid) <= centerCutoutRadius
      );
    };

    let fillStyle: string | CanvasGradient = cfg.pixelColor;
    if (cfg.colorMode === "gradient") {
      const grad = ctx.createLinearGradient(startX, startY, startX + qrDrawSize, startY + qrDrawSize);
      grad.addColorStop(0, cfg.pixelColor);
      grad.addColorStop(1, cfg.pixelColor2);
      fillStyle = grad;
    }

    for (let r = 0; r < moduleCount; r++) {
      for (let c = 0; c < moduleCount; c++) {
        if (isFinderEye(r, c) || isCenterLogoArea(r, c)) continue;

        if (qr.modules.get(r, c)) {
          const x = startX + c * cellSize;
          const y = startY + r * cellSize;
          drawPixelModule(ctx, x, y, cellSize, cfg.pixelStyle, fillStyle);
        }
      }
    }

    // 4. Draw Distinct Finder Eyes (3 Corners)
    const eyeFill = cfg.useSeparateEyeColor ? cfg.eyeColor : cfg.pixelColor;
    drawFinderEye(ctx, 0, 0, cellSize, startX, startY, cfg.eyeStyle, eyeFill);
    drawFinderEye(ctx, 0, moduleCount - 7, cellSize, startX, startY, cfg.eyeStyle, eyeFill);
    drawFinderEye(ctx, moduleCount - 7, 0, cellSize, startX, startY, cfg.eyeStyle, eyeFill);

    // 5. Draw Authentic Center Logo
    if (cfg.selectedLogo !== "none") {
      const centerBoxSize = (centerCutoutRadius * 2 + 1.5) * cellSize;
      const centerBoxX = startX + (moduleCount * cellSize - centerBoxSize) / 2;
      const centerBoxY = startY + (moduleCount * cellSize - centerBoxSize) / 2;
      drawCenterLogo(
        ctx,
        centerBoxX,
        centerBoxY,
        centerBoxSize,
        cfg.selectedLogo,
        cfg.uploadedLogo,
        cfg.centerText,
        cfg.pixelColor,
        cfg.bgMode === "transparent" ? "transparent" : cfg.bgColor,
        cfg.fontFamily,
        cfg.fontSize,
        cfg.fontWeight,
        cfg.textTransform,
        redrawCanvasRef.current
      );
    }
  };

  // Structural & ~30 FPS WebGL animation loop (decoupled from color/style state changes to prevent canvas reallocations)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const paddings = getFramePaddings(selectedFrame, includeQuietZone);
    const qrDrawSize = size;
    const totalWidth = qrDrawSize + paddings.side * 2;
    const totalHeight = qrDrawSize + paddings.top + paddings.bottom;

    const targetW = totalWidth * 2;
    const targetH = totalHeight * 2;
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
      canvas.style.width = `${totalWidth}px`;
      canvas.style.height = `${totalHeight}px`;
    }

    const isAnim = isAnimatedFrame(selectedFrame);
    let animationId: number | undefined;
    const startTime = performance.now();
    let lastDrawMs = 0;

    const drawAtTime = (timeSec: number) => {
      lastAnimTimeSecRef.current = timeSec;
      try {
        ctx.save();
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.scale(2, 2);
        renderFrameAtTime(ctx, totalWidth, totalHeight, qrDrawSize, paddings, qrMatrix, timeSec);
      } catch (err) {
        console.error("QR canvas render loop error:", err);
      } finally {
        ctx.restore();
      }
    };

    redrawCanvasRef.current = () => {
      drawAtTime(isAnim && isPlayingAnimation ? lastAnimTimeSecRef.current : 0);
    };

    drawAtTime(isAnim && isPlayingAnimation ? lastAnimTimeSecRef.current : 0);

    if (isAnim && isPlayingAnimation && !isGeneratingGif) {
      const loop = (now: number) => {
        if (now - lastDrawMs >= 32) {
          lastDrawMs = now;
          const timeSec = (now - startTime) / 1000;
          drawAtTime(timeSec);
        }
        animationId = requestAnimationFrame(loop);
      };
      animationId = requestAnimationFrame(loop);
    }

    return () => {
      if (animationId !== undefined) cancelAnimationFrame(animationId);
    };
  }, [qrMatrix, selectedFrame, size, includeQuietZone, isPlayingAnimation, isGeneratingGif]);

  // Lightweight repaint on color/style/font edits without restarting rAF or reallocating canvas textures
  useEffect(() => {
    redrawCanvasRef.current();
  }, [liveRenderConfig]);

  const handlePresetSelect = (hex: string) => {
    applyInstantColor({ pixelColor: hex });
    setPixelColor(hex);
  };

  const handleResetColors = () => {
    applyInstantColor({
      pixelColor: "#ff6600",
      pixelColor2: "#ff3300",
      colorMode: "monochrome",
      bgColor: "#ffffff",
      bgColor2: "#f4f4f5",
      bgMode: "monochrome",
      useSeparateEyeColor: false,
      eyeColor: "#000000",
    });
    setPixelColor("#ff6600");
    setPixelColor2("#ff3300");
    setColorMode("monochrome");
    setBgColor("#ffffff");
    setBgColor2("#f4f4f5");
    setBgMode("monochrome");
    setUseSeparateEyeColor(false);
    setEyeColor("#000000");
    setFrameColor("#ff6600");
    showToast.success(
      tr("Color palette reset to defaults", "Palette de couleurs réinitialisée")
    );
  };

  const handleResetTypography = () => {
    setFontFamily("inter");
    setFontSize(12);
    setFontWeight("bold");
    setTextTransform("uppercase");
    showToast.success(
      tr("Typography reset to defaults", "Typographie réinitialisée")
    );
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        reason: tr(
          "Uploading a custom logo is reserved for the Pro plan.",
          "L'import d'un logo personnalisé est réservé au forfait Pro."
        ),
        featureName: tr("Custom QR Logo", "Logo QR personnalisé"),
      });
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedLogo(event.target?.result as string);
      setSelectedLogo("custom");
    };
    reader.readAsDataURL(file);

    try {
      const uploadRes = await cfUploadImage(file, "qr_logos");
      if (uploadRes.success && uploadRes.url) {
        setUploadedLogo(uploadRes.url);
        showToast.success(
          tr(
            "Custom logo successfully uploaded to Cloud!",
            "Logo personnalisé envoyé dans le Cloud avec succès !"
          )
        );
      } else {
        showToast.success(
          tr("Custom logo loaded locally!", "Logo personnalisé chargé localement !")
        );
      }
    } catch {
      showToast.success(
        tr("Custom logo loaded successfully!", "Logo personnalisé chargé avec succès !")
      );
    }
  };

  const downloadPNG = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const link = document.createElement("a");
    link.download = `lshorter-qr-${contentType}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    showToast.success(
      tr("PNG QR Code downloaded successfully!", "QR Code PNG téléchargé avec succès !")
    );
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
      showToast.success(
        tr("Vector SVG QR Code downloaded!", "QR Code SVG vectoriel téléchargé !")
      );
    } catch (e) {
      console.error("SVG generation error:", e);
      showToast.error(
        tr("Error generating SVG", "Erreur lors de la génération du SVG")
      );
    }
  };

  const downloadGIF = async () => {
    if (!isProPlan) {
      triggerPlanUpgrade({
        reason: tr(
          "Exporting animated QR codes in GIF format is reserved for the Pro plan.",
          "L'exportation des QR codes animés au format GIF est réservée au forfait Pro."
        ),
        featureName: tr("Animated GIF Export", "Export GIF animé"),
      });
      return;
    }

    setIsGeneratingGif(true);
    setGifProgress(0);

    // Yield to render progress state in UI
    await new Promise((r) => setTimeout(r, 40));

    try {
      const qr = qrMatrix;

      const paddings = getFramePaddings(selectedFrame, includeQuietZone);
      const qrDrawSize = size;
      const totalWidth = qrDrawSize + paddings.side * 2;
      const totalHeight = qrDrawSize + paddings.top + paddings.bottom;

      const isAnim = isAnimatedFrame(selectedFrame);
      const durationSec = ANIMATED_LOOP_DURATION_SEC;
      // 30 frames * 80ms = exact 2400ms (8 centiseconds per frame) for crisp, fast looping
      const totalFrames = isAnim ? 30 : 1;
      const delayMs = 80;

      const theme = isAnim ? getAnimatedTheme(selectedFrame) : null;
      const tintRgb = theme
        ? hexToRgbTuple(theme.baseBg)
        : bgMode === "transparent"
          ? ([255, 255, 255] as [number, number, number])
          : hexToRgbTuple(bgColor);

      const blob = await exportFramesToGif({
        width: totalWidth,
        height: totalHeight,
        scale: 1.25,
        totalFrames,
        delayMs,
        durationSec,
        maxColors: 128,
        orderedDither: isAnim,
        tintRgb,
        cleanCornerAlpha: isAnim,
        renderFrame: (offCtx, timeSec) => {
          renderFrameAtTime(offCtx, totalWidth, totalHeight, qrDrawSize, paddings, qr, timeSec);
        },
        onProgress: setGifProgress,
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.download = `lshorter-qr-${selectedFrame}-${contentType}.gif`;
      link.href = url;
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      showToast.success(
        tr(
          "Animated GIF QR Code exported successfully!",
          "QR Code GIF animé exporté avec succès !"
        )
      );
    } catch (err) {
      console.error("GIF export error:", err);
      showToast.error(
        tr("Error creating animated GIF.", "Erreur lors de la création du GIF animé.")
      );
    } finally {
      setIsGeneratingGif(false);
      setGifProgress(0);
    }
  };

  const handleSaveCustomization = async () => {
    if (contentType !== "link") {
      showToast.error(
        tr(
          "Customization saving is only available for short link URLs.",
          "La sauvegarde de la personnalisation est disponible uniquement pour les liens courts."
        )
      );
      return;
    }

    if (!websiteUrl || !websiteUrl.trim()) {
      showToast.error(
        tr("Please enter a short link URL.", "Veuillez saisir l'URL d'un lien court.")
      );
      return;
    }

    setIsSavingCustomization(true);

    try {
      let currentLinks = userLinks;
      if (!currentLinks.length && userId) {
        const res = await cfGetLinks(userId);
        const rawNested = (res?.data as { data?: unknown } | undefined)?.data;
        currentLinks = Array.isArray(res?.data)
          ? (res.data as ShortLink[])
          : Array.isArray(rawNested)
            ? (rawNested as ShortLink[])
            : [];
        setUserLinks(currentLinks);
      }

      const target = findMatchingLink(websiteUrl);

      if (!target) {
        showToast.error(
          tr(
            "This URL does not exist in your short link database.",
            "Cette URL n'existe pas dans votre base de liens courts."
          )
        );
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

      showToast.success(
        tr(
          `QR Code design successfully saved for link /${target.slug}!`,
          `Design du QR Code enregistré pour le lien /${target.slug} !`
        )
      );
    } catch (err: unknown) {
      console.error("Save QR error:", err);
      showToast.error(
        tr(
          "Error saving customization.",
          "Erreur lors de l'enregistrement de la personnalisation."
        )
      );
    } finally {
      setIsSavingCustomization(false);
    }
  };

  const copyConfigJSON = () => {
    const json = getV3QRCodeConfigJSON();
    navigator.clipboard.writeText(json);
    showToast.success(
      tr(
        "V3 JSON configuration copied to clipboard!",
        "Configuration JSON V3 copiée dans le presse-papiers !"
      )
    );
  };

  // Pixel Motifs Definitions
  const PIXEL_STYLES = useMemo(
    () => [
      { id: "square" as const, label: tr("Squares", "Carrés"), icon: "■", isPro: false },
      { id: "rounded" as const, label: tr("Rounded", "Arrondis"), icon: "●", isPro: false },
      { id: "dots" as const, label: tr("Dots", "Points"), icon: "•", isPro: true },
      { id: "diamond" as const, label: tr("Diamonds", "Losanges"), icon: "◆", isPro: true },
      { id: "classy" as const, label: tr("Classy", "Élégant"), icon: "◈", isPro: true },
      { id: "stars" as const, label: tr("Stars", "Étoiles"), icon: "★", isPro: true },
      { id: "lines" as const, label: tr("Lines", "Lignes"), icon: "▬", isPro: true },
      { id: "vertical_bars" as const, label: tr("Bars", "Barres"), icon: "▮", isPro: true },
      { id: "cross" as const, label: tr("Cross +", "Croix +"), icon: "✚", isPro: true },
      { id: "hexagon_dots" as const, label: tr("Hexagons", "Hexagones"), icon: "⬡", isPro: true },
      { id: "heart" as const, label: tr("Hearts", "Cœurs"), icon: "♥", isPro: true },
      { id: "cyber_tiles" as const, label: "Cyber", icon: "⯃", isPro: true },
      { id: "sparkle" as const, label: tr("Sparkles", "Éclats"), icon: "✦", isPro: true },
      { id: "pill" as const, label: tr("Pills", "Pilules"), icon: "⬭", isPro: true },
      { id: "fluid" as const, label: tr("Fluid", "Fluide"), icon: "◎", isPro: true },
    ],
    [tr]
  );

  // Finder Eyes Definitions
  const EYE_STYLES = useMemo(
    () => [
    {
      id: "square" as const,
      label: tr("Square", "Carré"),
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
      label: tr("Rounded", "Arrondi"),
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
      label: tr("Circle", "Cercle"),
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
      label: tr("Leaf", "Feuille"),
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
      label: tr("Hexagon", "Hexagone"),
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
      label: tr("Star", "Étoile"),
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
      label: tr("Diamond", "Diamant"),
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
      label: tr("Shield", "Bouclier"),
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
      label: tr("Target", "Cible"),
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
      label: tr("Petal", "Pétale"),
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
      label: tr("Double Ring", "Double anneau"),
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
      label: tr("Brackets [ ]", "Crochets [ ]"),
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
      label: tr("Heart", "Cœur"),
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      ),
    },
    {
      id: "gear" as const,
      label: tr("Gear", "Engrenage"),
      isPro: true,
      svg: (
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="7" strokeDasharray="3 2" strokeWidth="3" />
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      ),
    },
    ],
    [tr]
  );

  // Real Logos List
  const LOGO_LIST: Array<{ id: LogoType | string; label: string; isPro: boolean; iconNode: React.ReactNode }> = useMemo(
    () => [
    { id: "none", label: tr("None", "Aucun"), isPro: false, iconNode: <X className="w-5 h-5 text-neutral-400" /> },
    { id: "custom", label: tr("Upload Image", "Importer une image"), isPro: true, iconNode: <Upload className="w-4 h-4 text-brand" /> },
    { id: "text", label: tr("Custom Text", "Texte personnalisé"), isPro: true, iconNode: <Type className="w-4 h-4 text-neutral-700 dark:text-neutral-200" /> },
    // 1. Social & Communication
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
    { id: "reddit", label: "Reddit", isPro: true, iconNode: BrandIcons.reddit },
    { id: "threads", label: "Threads", isPro: true, iconNode: BrandIcons.threads },
    { id: "twitch", label: "Twitch", isPro: true, iconNode: BrandIcons.twitch },
    { id: "gmail", label: "Gmail", isPro: true, iconNode: BrandIcons.gmail },
    // 2. Commerce, Payments & Travel
    { id: "paypal", label: "PayPal", isPro: true, iconNode: BrandIcons.paypal },
    { id: "apple", label: "Apple", isPro: true, iconNode: BrandIcons.apple },
    { id: "google", label: "Google", isPro: true, iconNode: BrandIcons.google },
    { id: "stripe", label: "Stripe", isPro: true, iconNode: BrandIcons.stripe },
    { id: "shopify", label: "Shopify", isPro: true, iconNode: BrandIcons.shopify },
    { id: "amazon", label: "Amazon", isPro: true, iconNode: BrandIcons.amazon },
    { id: "visa", label: "Visa", isPro: true, iconNode: BrandIcons.visa },
    { id: "mastercard", label: "Mastercard", isPro: true, iconNode: BrandIcons.mastercard },
    { id: "airbnb", label: "Airbnb", isPro: true, iconNode: BrandIcons.airbnb },
    { id: "uber", label: "Uber", isPro: true, iconNode: BrandIcons.uber },
    // 3. Productivity, Marketing & Business
    { id: "slack", label: "Slack", isPro: true, iconNode: BrandIcons.slack },
    { id: "notion", label: "Notion", isPro: true, iconNode: BrandIcons.notion },
    { id: "hubspot", label: "HubSpot", isPro: true, iconNode: BrandIcons.hubspot },
    { id: "mailchimp", label: "Mailchimp", isPro: true, iconNode: BrandIcons.mailchimp },
    { id: "meta_ads", label: "Meta Ads", isPro: true, iconNode: BrandIcons.meta_ads },
    { id: "google_ads", label: "Google Ads", isPro: true, iconNode: BrandIcons.google_ads },
    { id: "salesforce", label: "Salesforce", isPro: true, iconNode: BrandIcons.salesforce },
    { id: "semrush", label: "Semrush", isPro: true, iconNode: BrandIcons.semrush },
    { id: "zapier", label: "Zapier", isPro: true, iconNode: BrandIcons.zapier },
    { id: "make", label: "Make", isPro: true, iconNode: BrandIcons.make },
    { id: "webflow", label: "Webflow", isPro: true, iconNode: BrandIcons.webflow },
    { id: "wordpress", label: "WordPress", isPro: true, iconNode: BrandIcons.wordpress },
    { id: "google_analytics", label: "Google Analytics", isPro: true, iconNode: BrandIcons.google_analytics },
    // 4. AI & Machine Learning
    { id: "openai", label: "ChatGPT / OpenAI", isPro: true, iconNode: BrandIcons.openai },
    { id: "anthropic", label: "Anthropic / Claude", isPro: true, iconNode: BrandIcons.anthropic },
    { id: "gemini", label: "Google Gemini", isPro: true, iconNode: BrandIcons.gemini },
    { id: "midjourney", label: "Midjourney", isPro: true, iconNode: BrandIcons.midjourney },
    { id: "huggingface", label: "Hugging Face", isPro: true, iconNode: BrandIcons.huggingface },
    { id: "mistral", label: "Mistral AI", isPro: true, iconNode: BrandIcons.mistral },
    { id: "deepseek", label: "DeepSeek", isPro: true, iconNode: BrandIcons.deepseek },
    // 5. Sports & Culture Brands
    { id: "nike", label: "Nike", isPro: true, iconNode: BrandIcons.nike },
    { id: "adidas", label: "Adidas", isPro: true, iconNode: BrandIcons.adidas },
    { id: "puma", label: "Puma", isPro: true, iconNode: BrandIcons.puma },
    { id: "jordan", label: "Air Jordan", isPro: true, iconNode: BrandIcons.jordan },
    { id: "nba", label: "NBA", isPro: true, iconNode: BrandIcons.nba },
    { id: "formula1", label: "Formula 1", isPro: true, iconNode: BrandIcons.formula1 },
    { id: "redbull", label: "Red Bull", isPro: true, iconNode: BrandIcons.redbull },
    // 6. Tech, Frameworks, Cloud & Languages
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
    { id: "docker", label: "Docker", isPro: true, iconNode: BrandIcons.docker },
    { id: "cloudflare", label: "Cloudflare", isPro: true, iconNode: BrandIcons.cloudflare },
    { id: "vercel", label: "Vercel", isPro: true, iconNode: BrandIcons.vercel },
    { id: "rust", label: "Rust", isPro: true, iconNode: BrandIcons.rust },
    { id: "golang", label: "Go", isPro: true, iconNode: BrandIcons.golang },
    { id: "cplusplus", label: "C++", isPro: true, iconNode: BrandIcons.cplusplus },
    { id: "java", label: "Java", isPro: true, iconNode: BrandIcons.java },
    { id: "git", label: "Git", isPro: true, iconNode: BrandIcons.git },
    { id: "gitlab", label: "GitLab", isPro: true, iconNode: BrandIcons.gitlab },
    { id: "kubernetes", label: "Kubernetes", isPro: true, iconNode: BrandIcons.kubernetes },
    { id: "linux", label: "Linux", isPro: true, iconNode: BrandIcons.linux },
    { id: "redis", label: "Redis", isPro: true, iconNode: BrandIcons.redis },
    { id: "graphql", label: "GraphQL", isPro: true, iconNode: BrandIcons.graphql },
    { id: "figma", label: "Figma", isPro: true, iconNode: BrandIcons.figma },
    { id: "linear", label: "Linear", isPro: true, iconNode: BrandIcons.linear },
    { id: "aws", label: "AWS", isPro: true, iconNode: BrandIcons.aws },
    { id: "vite", label: "Vite", isPro: true, iconNode: BrandIcons.vite },
    { id: "bun", label: "Bun", isPro: true, iconNode: BrandIcons.bun },
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
    { id: "crypto_btc", label: "Bitcoin", isPro: true, iconNode: BrandIcons.crypto_btc },
    ],
    [tr]
  );

  const getAnimatedMotifIcon = useCallback((motif: ThemeMotif, className?: string) => {
    const cls = className ?? "w-3.5 h-3.5 text-neutral-700 dark:text-neutral-300";
    const iconMap: Record<ThemeMotif, React.ReactNode> = {
      christmas: <Gift className={cls} />,
      halloween: <Ghost className={cls} />,
      sport: <Activity className={cls} />,
      manga: <Zap className={cls} />,
      rain: <CloudRain className={cls} />,
      snow: <Snowflake className={cls} />,
      cloud: <Cloud className={cls} />,
      storm: <Zap className={cls} />,
      cyberpunk: <Cpu className={cls} />,
      galaxy: <Sparkles className={cls} />,
      fire: <Flame className={cls} />,
      luxury_gold: <Crown className={cls} />,
      hearts: <Heart className={cls} />,
      waves: <Waves className={cls} />,
      diamond: <Gem className={cls} />,
      music: <Music className={cls} />,
      arcade: <Gamepad2 className={cls} />,
      nature: <Leaf className={cls} />,
      coffee: <Coffee className={cls} />,
      fireworks: <Sparkles className={cls} />,
      f1_racing: <Flag className={cls} />,
      basketball: <Trophy className={cls} />,
      football: <Trophy className={cls} />,
      tennis: <Sun className={cls} />,
      boxing: <Swords className={cls} />,
      terminal_code: <Terminal className={cls} />,
      rocket_launch: <Rocket className={cls} />,
      aurora: <Sparkles className={cls} />,
      dna_biotech: <Dna className={cls} />,
      glitch: <Zap className={cls} />,
      sunset_vibes: <Sunset className={cls} />,
      matrix_rain: <Binary className={cls} />,
      circuit_board: <Cpu className={cls} />,
      quantum_grid: <Atom className={cls} />,
      ai_neural: <Brain className={cls} />,
      hologram_hud: <Crosshair className={cls} />,
      fiber_optic: <Zap className={cls} />,
      blockchain: <Blocks className={cls} />,
      radar_scan: <Radar className={cls} />,
      cloud_cluster: <Cloud className={cls} />,
    };
    return iconMap[motif];
  }, []);

  // Premium Frames List (14 Statics + 40 Shader-Driven Animated Themes)
  const FRAME_LIST: Array<{
    id: FrameType;
    label: string;
    isPro: boolean;
    isAnimated?: boolean;
    category?: Exclude<AnimatedThemeCategory, "all">;
    previewIcon: React.ReactNode;
  }> = useMemo(
    () => [
    // --- Cadres Statiques ---
    { id: "none", label: tr("None", "Aucun"), isPro: false, previewIcon: <X className="w-5 h-5 text-neutral-400" /> },
    { id: "simple", label: "Simple", isPro: false, previewIcon: <div className="w-6 h-6 border-2 border-current rounded-[8px]" /> },
    {
      id: "corner_brackets",
      label: tr("Brackets", "Crochets"),
      isPro: false,
      previewIcon: (
        <div className="w-6 h-6 relative">
          <span className="absolute top-0.5 left-0.5 w-1.5 h-1.5 border-t-2 border-l-2 border-current" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 border-t-2 border-r-2 border-current" />
          <span className="absolute bottom-0.5 left-0.5 w-1.5 h-1.5 border-b-2 border-l-2 border-current" />
          <span className="absolute bottom-0.5 right-0.5 w-1.5 h-1.5 border-b-2 border-r-2 border-current" />
          <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-2.5 h-0.5 bg-brand rounded-full" />
        </div>
      ),
    },
    {
      id: "floating_card",
      label: tr("Bar", "Barre"),
      isPro: false,
      previewIcon: (
        <div className="w-6 h-6 border-2 border-current rounded-[6px] flex flex-col justify-between p-0.5">
          <div className="w-full h-3 border border-dashed border-current/40 rounded-xs" />
          <div className="w-full h-0.5 bg-brand" />
        </div>
      ),
    },
    {
      id: "minimal_box",
      label: tr("Cutout", "Découpe"),
      isPro: false,
      previewIcon: (
        <div className="w-6 h-6 border-2 border-current rounded-[6px] relative flex flex-col justify-end items-center">
          <span className="w-3 h-0.5 bg-brand -mb-0.5" />
        </div>
      ),
    },
    {
      id: "double_border",
      label: "Double",
      isPro: false,
      previewIcon: (
        <div className="w-6 h-6 border-2 border-current rounded-[8px] p-0.5">
          <div className="w-full h-full border border-current/60 rounded-[4px]" />
        </div>
      ),
    },
    { id: "bottom_pill", label: tr("Pill", "Pilule"), isPro: false, previewIcon: <div className="flex flex-col items-center gap-0.5"><div className="w-5 h-4 border-2 border-current rounded-[6px]" /><span className="bg-brand text-white px-1 text-[6px] font-bold rounded">SCAN</span></div> },
    { id: "top_header", label: tr("Header", "En-tête"), isPro: true, previewIcon: <div className="flex flex-col items-center gap-0.5"><span className="bg-brand text-white px-1 text-[6px] font-bold rounded">SCAN</span><div className="w-5 h-4 border-2 border-current rounded-[6px]" /></div> },
    {
      id: "clean_badge",
      label: "Badge",
      isPro: true,
      previewIcon: (
        <div className="flex flex-col items-center gap-0.5">
          <span className="w-3 h-0.5 bg-brand rounded-full" />
          <div className="w-5 h-3.5 border-2 border-current rounded-[4px]" />
          <span className="w-4 h-0.5 bg-brand rounded-full" />
        </div>
      ),
    },
    {
      id: "notched_corners",
      label: tr("Notched", "Biseauté"),
      isPro: true,
      previewIcon: (
        <div className="w-6 h-6 border-2 border-current [clip-path:polygon(25%_0%,75%_0%,100%_25%,100%_75%,75%_100%,25%_100%,0%_75%,0%_25%)] flex items-center justify-center">
          <div className="w-2 h-2 bg-brand/40" />
        </div>
      ),
    },
    {
      id: "stamp_border",
      label: tr("Dotted", "Pointillé"),
      isPro: true,
      previewIcon: (
        <div className="w-6 h-6 border-2 border-dashed border-current rounded-[6px] flex flex-col justify-end items-center p-0.5">
          <span className="w-3.5 h-1 bg-brand rounded-xs" />
        </div>
      ),
    },
    { id: "hand_arrow", label: tr("Cursive", "Cursive"), isPro: true, previewIcon: <span className="italic text-[10px] font-serif">Scan me ⤹</span> },
    { id: "modern_badge", label: tr("Star", "Étoile"), isPro: true, previewIcon: <div className="flex flex-col items-center gap-0.5"><div className="w-5 h-4 border border-current rounded-[6px]" /><span className="text-brand text-[8px] font-bold">★ SCAN ★</span></div> },
    { id: "neon", label: tr("Neon", "Néon"), isPro: true, previewIcon: <div className="w-6 h-6 border-2 border-brand rounded-[8px] shadow-brand" /> },
    { id: "phone", label: tr("Phone", "Mobile"), isPro: true, previewIcon: <Smartphone className="w-5 h-5 text-brand" /> },
    { id: "tag_ticket", label: "Ticket", isPro: true, previewIcon: <Tag className="w-5 h-5 text-emerald-400" /> },
    { id: "polaroid", label: "Polaroid", isPro: true, previewIcon: <div className="w-6 h-7 border-2 border-current rounded-sm flex flex-col justify-end p-0.5"><div className="w-full h-1.5 bg-neutral-500 rounded-xs" /></div> },
    { id: "luxury_gold", label: "Prestige", isPro: true, previewIcon: <div className="w-6 h-6 border-2 border-amber-400 p-0.5 rounded-[4px]"><div className="w-full h-full border border-amber-300" /></div> },
    { id: "circular_badge", label: tr("Shield", "Bouclier"), isPro: true, previewIcon: <Shield className="w-5 h-5 text-sky-400" /> },
    { id: "gradient_border", label: tr("Gradient", "Dégradé"), isPro: true, previewIcon: <div className="w-6 h-6 rounded-[8px] bg-gradient-to-tr from-[#ff007a] via-[#ff6600] to-[#7928ca] p-0.5"><div className="w-full h-full bg-white dark:bg-[#141416] rounded-[6px]" /></div> },

    // --- 40 GPU Shader-Driven Animated Studio Themes (Simple, Sobre & Minimal) ---
    ...Object.values(ANIMATED_THEMES).map((theme) => ({
      id: theme.id as FrameType,
      label: theme.shortLabel,
      isPro: true,
      isAnimated: true,
      category: theme.category,
      previewIcon: (
        <div className="w-6 h-6 rounded-[6px] border border-neutral-300 dark:border-[#2a2a2e] bg-neutral-100 dark:bg-[#141416] flex items-center justify-center text-neutral-700 dark:text-neutral-300 group-hover:border-brand/40 transition-colors">
          {getAnimatedMotifIcon(theme.motif, "w-3.5 h-3.5 text-current")}
        </div>
      ),
    })),
    ],
    [getAnimatedMotifIcon, tr]
  );

  const controlsContent = (
    <div className="flex flex-col gap-6">
{/* Content Type Tabs */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {tr("Content Type", "Type de contenu")}
            </span>
            <div className="flex flex-wrap items-center gap-2">
              {[
                { type: "link" as const, label: tr("URL Link", "Lien URL") },
                { type: "text" as const, label: tr("Text", "Texte") },
                { type: "wifi" as const, label: "WiFi" },
                { type: "email" as const, label: tr("Email", "E-mail") },
                { type: "call" as const, label: tr("Call", "Appel") },
                { type: "sms" as const, label: "SMS" },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setContentType(item.type)}
                  className={`btn-hover-scale px-4 py-2 rounded-[10px] text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                    contentType === item.type
                      ? "bg-brand text-white border-brand font-bold"
                      : "bg-white dark:bg-[#141416] border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/5"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Content Inputs */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#222225] flex flex-col gap-4">
            {contentType === "link" && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    {tr("Website URL or Short Link", "URL du site web ou lien court")}
                  </label>
                  {userLinks.length > 0 && (
                    <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                      {tr(
                        `${userLinks.length} link${userLinks.length > 1 ? "s" : ""} in your account`,
                        `${userLinks.length} lien${userLinks.length > 1 ? "s" : ""} dans votre compte`
                      )}
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
                      value={matchedLink ? (matchedLink.shortUrl || `https://lsho.cc/${matchedLink.slug}`).replace(/\/r\/([^/?#]+)$/, "/$1") : ""}
                      className="w-full h-10 rounded-[10px] bg-white dark:bg-[#1a1a1e] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-[#27272a] px-3 text-xs focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="" className="bg-white dark:bg-[#141416] text-neutral-500 dark:text-neutral-400">
                        {tr(
                          "-- Choose from your existing short links --",
                          "-- Choisir parmi vos liens courts existants --"
                        )}
                      </option>
                      {userLinks.map((l) => (
                        <option
                          key={l.id}
                          value={(l.shortUrl || `https://lsho.cc/${l.slug}`).replace(/\/r\/([^/?#]+)$/, "/$1")}
                          className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white"
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
                    placeholder={tr("https://lsho.cc/my-link", "https://lsho.cc/mon-lien")}
                  />
                </div>

                {/* Link Verification Status Badge */}
                {matchedLink ? (
                  <div className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 rounded-[10px] px-3 py-2 animate-in fade-in">
                    <Check className="w-4 h-4 shrink-0 text-emerald-500 dark:text-emerald-400" />
                    <div className="flex items-center justify-between gap-2 w-full">
                      <span className="text-neutral-800 dark:text-neutral-200">
                        {tr("Linked in your account:", "Lié à votre compte :")} <strong>/{matchedLink.slug}</strong>
                      </span>
                      <span className="text-[10px] text-neutral-500 dark:text-neutral-400 font-mono truncate max-w-[200px]">
                        ↳ {matchedLink.targetUrl}
                      </span>
                    </div>
                  </div>
                ) : websiteUrl.trim() ? (
                  <div className="flex items-center gap-2 text-[11px] text-neutral-600 dark:text-neutral-400 bg-neutral-100 dark:bg-white/5 border border-neutral-200 dark:border-white/10 rounded-[10px] px-3 py-1.5 animate-in fade-in">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-500 dark:text-amber-400" />
                    <span>
                      {tr(
                        "Custom URL (not linked to a short link in your account). Saving requires an existing short link.",
                        "URL personnalisée (non associée à un lien court de votre compte). La sauvegarde nécessite un lien court existant."
                      )}
                    </span>
                  </div>
                ) : null}
              </div>
            )}

            {contentType === "text" && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {tr("Plain Text", "Texte brut")}
                </label>
                <textarea
                  rows={3}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder={tr("Enter your message or note...", "Saisissez votre message ou note...")}
                  className="w-full rounded-[10px] bg-white dark:bg-[#1a1a1e] border border-neutral-200 dark:border-[#27272a] p-3 text-sm text-neutral-900 dark:text-neutral-200 focus:outline-none focus:border-brand"
                />
              </div>
            )}

            {contentType === "wifi" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    {tr("Network Name (SSID)", "Nom du réseau (SSID)")}
                  </label>
                  <Input
                    value={wifiSsid}
                    onChange={(e) => setWifiSsid(e.target.value)}
                    placeholder={tr("MyWiFi_Guest", "MonWiFi_Invites")}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      {tr("Password", "Mot de passe")}
                    </label>
                    <Input
                      type="password"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      placeholder={tr("WiFi password", "Mot de passe WiFi")}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                      {tr("Encryption", "Chiffrement")}
                    </label>
                    <select
                      value={wifiEncryption}
                      onChange={(e) => setWifiEncryption(e.target.value as "WPA" | "WEP" | "nopass")}
                      className="w-full h-11 rounded-[10px] bg-white dark:bg-[#141416] text-neutral-900 dark:text-white border border-neutral-200 dark:border-[#27272a] px-3 text-sm focus:outline-none focus:border-brand cursor-pointer"
                    >
                      <option value="WPA" className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white">
                        {tr("WPA / WPA2 (Recommended)", "WPA / WPA2 (Recommandé)")}
                      </option>
                      <option value="WEP" className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white">WEP</option>
                      <option value="nopass" className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white">
                        {tr("No password", "Sans mot de passe")}
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {contentType === "email" && (
              <div className="flex flex-col gap-3">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    {tr("Email address", "Adresse e-mail")}
                  </label>
                  <Input
                    type="email"
                    value={emailAddress}
                    onChange={(e) => setEmailAddress(e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    {tr("Message subject", "Objet du message")}
                  </label>
                  <Input
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder={tr("Information request", "Demande d'information")}
                  />
                </div>
              </div>
            )}

            {contentType === "call" && (
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {tr("Phone number", "Numéro de téléphone")}
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
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    {tr("Recipient phone number", "Numéro du destinataire")}
                  </label>
                  <Input
                    type="tel"
                    value={smsNumber}
                    onChange={(e) => setSmsNumber(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                    {tr("Pre-filled message", "Message pré-rempli")}
                  </label>
                  <Input
                    value={smsMessage}
                    onChange={(e) => setSmsMessage(e.target.value)}
                    placeholder={tr("I am interested in your offer.", "Je suis intéressé par votre offre.")}
                  />
                </div>
              </div>
            )}
          </div>

          {/* SECTION 1: SELECT A STYLE */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#222225] flex flex-col gap-5">
            <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide">
              {tr("Select a Style", "Choisir un style")}
            </h3>

            {/* Pixels Style */}
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {tr(
                    `Pixel Patterns (${PIXEL_STYLES.length} unique styles)`,
                    `Motifs de pixels (${PIXEL_STYLES.length} styles uniques)`
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => setShowMorePixels(!showMorePixels)}
                  className="btn-hover-scale text-xs font-semibold text-brand hover:underline cursor-pointer"
                >
                  {showMorePixels
                    ? tr("Show less ↑", "Voir moins ↑")
                    : tr(
                        `View all patterns (${PIXEL_STYLES.length}) ↓`,
                        `Voir tous les motifs (${PIXEL_STYLES.length}) ↓`
                      )}
                </button>
              </div>

              <PixelStylesPicker
                styles={PIXEL_STYLES}
                selectedPixel={pixelStyle}
                isProPlan={isProPlan}
                showMore={showMorePixels}
                onToggleShowMore={() => setShowMorePixels(!showMorePixels)}
                onSelectPixel={(id, isPro) => {
                  if (!isPro || isProPlan) {
                    applyInstantColor({ pixelStyle: id });
                    setPixelStyle(id);
                  } else {
                    triggerPlanUpgrade({
                      reason: tr(
                        "This pixel style is reserved for Pro & Business plans.",
                        "Ce motif de pixel est réservé aux forfaits Pro et Business."
                      ),
                      featureName: tr("Pro Pixel Patterns", "Motifs de pixels Pro"),
                    });
                  }
                }}
              />
            </div>

            {/* Angles / Eyes Style */}
            <div className="flex flex-col gap-2.5 pt-3 border-t border-neutral-200 dark:border-[#222225]">
              <EyeStylesPicker
                styles={EYE_STYLES}
                selectedEye={eyeStyle}
                isProPlan={isProPlan}
                showMore={showMoreEyes}
                onToggleShowMore={() => setShowMoreEyes(!showMoreEyes)}
                onSelectEye={(id, isPro) => {
                  if (!isPro || isProPlan) {
                    applyInstantColor({ eyeStyle: id });
                    setEyeStyle(id);
                  } else {
                    triggerPlanUpgrade({
                      reason: tr(
                        "The eye style is reserved for Pro & Business plans.",
                        "Ce style d'angle est réservé aux forfaits Pro et Business."
                      ),
                      featureName: tr("Pro Eye Shapes", "Formes d'angles Pro"),
                    });
                  }
                }}
              />
            </div>
          </div>

          {/* SECTION 2: CHOOSE YOUR COLORS */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#222225] flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide">
                  {tr("Palette & Colors", "Palette & Couleurs")}
                </h3>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {tr(
                    "Customize pixels, background, eye corners, and frame",
                    "Personnalisez les pixels, le fond, les angles et le cadre"
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetColors}
                className="btn-hover-scale px-2.5 py-1.5 rounded-[8px] bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#27272a] text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer transition-all duration-200"
                title={tr("Reset all colors to defaults", "Réinitialiser toutes les couleurs")}
              >
                <RotateCcw className="w-3.5 h-3.5 text-brand" />
                <span>{tr("Reset", "Réinitialiser")}</span>
              </button>
            </div>

            {/* Presets */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                  {tr("Presets", "Préréglages")}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { hex: "#000000", name: tr("Black", "Noir") },
                  { hex: "#ff6600", name: "Orange LShorter" },
                  { hex: "#ef4444", name: tr("Red", "Rouge") },
                  { hex: "#ffffff", name: tr("White", "Blanc") },
                  { hex: "#10b981", name: tr("Green", "Vert") },
                  { hex: "#0ea5e9", name: "Cyan" },
                  { hex: "#3b82f6", name: tr("Blue", "Bleu") },
                  { hex: "#8b5cf6", name: tr("Purple", "Violet") },
                  { hex: "#ec4899", name: tr("Pink", "Rose") },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => handlePresetSelect(c.hex)}
                    title={c.name}
                    className={`btn-hover-scale relative w-7 h-7 rounded-full border-2 transition-all duration-200 cursor-pointer ${
                      pixelColor === c.hex
                        ? "border-brand dark:border-white scale-115 shadow-md"
                        : "border-neutral-300 dark:border-neutral-700 opacity-80 hover:opacity-100"
                    }`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>

            {/* Pixels color row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center pt-2 border-t border-neutral-200 dark:border-[#222225]">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-400 mb-1">
                  Pixels
                </label>
                <select
                  value={colorMode}
                  onChange={(e) => setColorMode(e.target.value as "monochrome" | "gradient")}
                  className="w-full h-10 rounded-[10px] bg-white dark:bg-[#1a1a1e] text-neutral-900 dark:text-white border border-neutral-200 dark:border-[#27272a] px-3 text-xs focus:outline-none focus:border-brand cursor-pointer"
                >
                  <option value="monochrome" className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white">
                    Monochrome
                  </option>
                  <option value="gradient" className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white">
                    {tr("Gradient", "Dégradé")}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-400 mb-1">
                  {tr("Hex Value", "Code hexadécimal")}
                </label>
                <div className="flex items-center gap-2">
                  <LiveColorControl
                    ariaLabel={tr("QR module color", "Couleur des pixels du QR code")}
                    value={pixelColor}
                    onInstantPreview={(hex) => applyInstantColor({ pixelColor: hex })}
                    onCommit={setPixelColor}
                  />
                  {colorMode === "gradient" && (
                    <LiveColorControl
                      ariaLabel={tr("QR module gradient secondary color", "Couleur secondaire du dégradé des pixels")}
                      value={pixelColor2}
                      showHexInput={false}
                      onInstantPreview={(hex) => applyInstantColor({ pixelColor2: hex })}
                      onCommit={setPixelColor2}
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Background color row */}
            <div className="flex flex-col gap-2 pt-2 border-t border-neutral-200 dark:border-[#222225]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-400 mb-1">
                    {tr("QR background style", "Style de fond du QR code")}
                  </label>
                  <select
                    value={bgMode}
                    onChange={(e) => setBgMode(e.target.value as "monochrome" | "transparent" | "gradient")}
                    className="w-full h-10 rounded-[10px] bg-white dark:bg-[#1a1a1e] text-neutral-900 dark:text-white border border-neutral-200 dark:border-[#27272a] px-3 text-xs focus:outline-none focus:border-brand cursor-pointer"
                  >
                    <option value="monochrome" className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white">
                      {tr("Solid Color", "Couleur Unie (Solide)")}
                    </option>
                    <option value="transparent" className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white">
                      {tr("Transparent (Frosted Glass)", "Transparent (Verre dépoli)")}
                    </option>
                    <option value="gradient" className="bg-white dark:bg-[#141416] text-neutral-900 dark:text-white">
                      {tr("Custom Gradient", "Dégradé personnalisé")}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-400 mb-1">
                    {bgMode === "transparent"
                      ? tr("Transparency", "Transparence")
                      : tr("Background color", "Couleur du fond")}
                  </label>
                  {bgMode === "transparent" ? (
                    <div className="flex items-center gap-2 h-10 px-3 rounded-[10px] bg-neutral-50 dark:bg-[#1a1a1e] border border-neutral-200 dark:border-[#27272a] text-xs text-neutral-600 dark:text-neutral-400">
                      <span className="w-4 h-4 rounded-full bg-[radial-gradient(#94a3b8_1px,transparent_1px)] [background-size:4px_4px] border border-neutral-300 dark:border-neutral-600 shrink-0" />
                      <span className="font-medium truncate">
                        {tr("Transparent background (reveals shader)", "Fond transparent (laisse passer le shader)")}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <LiveColorControl
                        ariaLabel={tr("QR background color", "Couleur de fond du QR code")}
                        value={bgColor}
                        onInstantPreview={(hex) => applyInstantColor({ bgColor: hex })}
                        onCommit={setBgColor}
                      />
                      {bgMode === "gradient" && (
                        <LiveColorControl
                          ariaLabel={tr("QR background gradient secondary color", "Couleur secondaire du dégradé de fond")}
                          value={bgColor2}
                          showHexInput={false}
                          onInstantPreview={(hex) => applyInstantColor({ bgColor2: hex })}
                          onCommit={setBgColor2}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>

              {bgMode === "monochrome" && (
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[10px] font-semibold text-neutral-500 dark:text-neutral-400 mr-1">
                    {tr("Background presets:", "Presets fond :")}
                  </span>
                  {[
                    { hex: "#ffffff", label: tr("Pure White", "Blanc pur") },
                    { hex: "#0f172a", label: tr("Obsidian", "Obsidienne") },
                    { hex: "#18181b", label: tr("Charcoal", "Anthracite") },
                    { hex: "#f4f4f5", label: tr("Soft Gray", "Gris doux") },
                    { hex: "#fef3c7", label: tr("Cream", "Crème") },
                  ].map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => {
                        setBgColor(preset.hex);
                        applyInstantColor({ bgColor: preset.hex });
                      }}
                      className={`btn-hover-scale px-2 py-0.5 rounded-[6px] text-[10px] font-semibold border transition-all cursor-pointer flex items-center gap-1 ${
                        bgColor.toLowerCase() === preset.hex.toLowerCase()
                          ? "bg-brand/10 border-brand text-brand dark:text-white"
                          : "bg-neutral-50 dark:bg-[#1a1a1e] border-neutral-200 dark:border-[#27272a] text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: preset.hex }}
                      />
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Angles Toggle */}
            <label className="flex items-center justify-between p-3 rounded-[10px] bg-neutral-50 dark:bg-[#1a1a1e] border border-neutral-200 dark:border-[#27272a] cursor-pointer text-xs">
              <span className="font-semibold text-neutral-800 dark:text-neutral-300">
                {tr("Custom color for eye corners", "Couleur personnalisée pour les angles")}
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={useSeparateEyeColor}
                  onChange={(e) => setUseSeparateEyeColor(e.target.checked)}
                  className="w-4 h-4 accent-[var(--brand-primary)] cursor-pointer"
                />
                {useSeparateEyeColor && (
                  <LiveColorControl
                    ariaLabel={tr("QR eye corner color", "Couleur des angles du QR code")}
                    value={eyeColor}
                    showHexInput={false}
                    swatchClassName="w-6 h-6 rounded-[10px] bg-transparent border-0 cursor-pointer hover:scale-105 shrink-0"
                    onInstantPreview={(hex) => applyInstantColor({ eyeColor: hex })}
                    onCommit={setEyeColor}
                  />
                )}
              </div>
            </label>
          </div>

          {/* SECTION 3: AJOUTER UN VRAI LOGO AU CENTRE */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#222225] flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide">
                  {tr("Official Brand Logos", "Logos officiels de marques")}
                </h3>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {tr(
                    `${LOGO_LIST.length} HD vector logos ready to use`,
                    `${LOGO_LIST.length} logos vectoriels HD prêts à l'emploi`
                  )}
                </span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleLogoUpload}
            />

            <BrandLogosPicker
              logos={LOGO_LIST}
              selectedLogo={selectedLogo}
              isProPlan={isProPlan}
              showMoreLogos={showMoreLogos}
              onToggleShowMore={() => setShowMoreLogos(!showMoreLogos)}
              onSelectLogo={(id, label, isPro) => {
                if (id === "custom") {
                  if (!isProPlan) {
                    triggerPlanUpgrade({
                      reason: tr(
                        "Uploading your own brand logo is reserved for the Pro plan.",
                        "L'import de votre propre logo est réservé au forfait Pro."
                      ),
                      featureName: tr("Custom Logo Upload", "Import de logo personnalisé"),
                    });
                    return;
                  }
                  fileInputRef.current?.click();
                  return;
                }

                if (id === "text") {
                  if (!isProPlan) {
                    triggerPlanUpgrade({
                      reason: tr(
                        "Inserting custom center text requires the Pro plan.",
                        "L'insertion d'un texte central personnalisé nécessite le forfait Pro."
                      ),
                      featureName: tr("Custom Center Text", "Texte central personnalisé"),
                    });
                    return;
                  }
                  applyInstantColor({ selectedLogo: "text" });
                  setSelectedLogo("text");
                  return;
                }

                if (!isPro || isProPlan) {
                  applyInstantColor({ selectedLogo: id });
                  setSelectedLogo(id);
                } else {
                  triggerPlanUpgrade({
                    reason: tr(
                      `The official logo "${label}" is reserved for Pro & Business plans.`,
                      `Le logo officiel « ${label} » est réservé aux forfaits Pro et Business.`
                    ),
                    featureName: `Logo ${label}`,
                  });
                }
              }}
            />

            {selectedLogo === "text" && isProPlan && (
              <div className="pt-2 flex flex-col gap-2 animate-in fade-in">
                <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  {tr("Center text (max 6 chars)", "Texte central (max 6 caractères)")}
                </label>
                <Input
                  maxLength={6}
                  value={centerText}
                  onChange={(e) => {
                    applyInstantColor({ centerText: e.target.value });
                    setCenterText(e.target.value);
                  }}
                  placeholder="SCAN"
                />
                <span className="text-[10px] text-neutral-500 dark:text-neutral-400">
                  {tr(
                    "The font family, size, weight, and casing selected in typography options also apply to center text.",
                    "La police, la taille, la graisse et la casse choisies dans les options typographiques s'appliquent aussi au texte central."
                  )}
                </span>
              </div>
            )}

            <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
              {tr(
                "Each logo is rendered with official vector curves and high-reliability error correction (Level H 30%).",
                "Chaque logo est rendu en courbes vectorielles officielles avec une correction d'erreur haute fiabilité (Niveau H 30 %)."
              )}
            </p>
          </div>

          {/* SECTION 4: SELECT A FRAME */}
          <div className="p-4 sm:p-5 rounded-[10px] bg-white dark:bg-[#141416] border border-neutral-200 dark:border-[#222225] flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide">
                  {tr("Frames & CTA Banners", "Cadres & Bannières CTA")}
                </h3>
                <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {tr(
                    `${FRAME_LIST.length} conversion frames (Static & Ultra-Pro Animated)`,
                    `${FRAME_LIST.length} cadres de conversion (Statiques & Animés Ultra-Pro)`
                  )}
                </span>
              </div>

            </div>

            <FramesPicker
              frames={FRAME_LIST}
              selectedFrame={selectedFrame}
              frameFilter={frameFilter}
              animatedCategoryFilter={animatedCategoryFilter}
              showMoreFrames={showMoreFrames}
              isProPlan={isProPlan}
              onSelectFrame={(id, isPro) => {
                if (!isPro || isProPlan) {
                  applyInstantColor({ selectedFrame: id });
                  setSelectedFrame(id);
                } else {
                  triggerPlanUpgrade({
                    reason: tr(
                      "This frame is reserved for Pro & Business plans.",
                      "Ce cadre est réservé aux forfaits Pro et Business."
                    ),
                    featureName: tr("Pro Frame", "Cadre Pro"),
                  });
                }
              }}
              onSetFrameFilter={(tab) => {
                setFrameFilter(tab);
                if (tab !== "animated") setAnimatedCategoryFilter("all");
                setShowMoreFrames(true);
              }}
              onSetAnimatedCategoryFilter={setAnimatedCategoryFilter}
              onToggleShowMore={() => setShowMoreFrames(!showMoreFrames)}
            />

            {selectedFrame !== "none" && (
              <div className="flex flex-col gap-4 pt-3 border-t border-neutral-200 dark:border-[#222225] animate-in fade-in">
                {isAnimatedFrame(selectedFrame) && (() => {
                  const activeTheme = getAnimatedTheme(selectedFrame);
                  return (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-[10px] bg-neutral-50 dark:bg-[#1a1a1e] border border-neutral-200 dark:border-[#27272a]">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-[8px] flex items-center justify-center border border-neutral-300 dark:border-[#2a2a2e] bg-white dark:bg-[#141416] text-neutral-800 dark:text-neutral-200 shrink-0">
                          {getAnimatedMotifIcon(activeTheme.motif, "w-4 h-4 text-current")}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs font-bold text-zinc-900 dark:text-white truncate">
                              {activeTheme.label}
                            </span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              WebGL Studio
                            </span>
                          </div>
                          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 truncate">
                            {activeTheme.tagline}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1 bg-white dark:bg-[#141416] p-1 rounded-[10px] border border-neutral-200 dark:border-[#27272a]">
                          <button
                            type="button"
                            onClick={() => setBgMode("monochrome")}
                            className={`px-2 py-1 rounded-[10px] text-[10px] font-semibold transition-all cursor-pointer ${
                              bgMode === "monochrome"
                                ? "bg-brand text-white"
                                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            }`}
                          >
                            {tr("Solid Card", "Carte unie")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setBgMode("transparent")}
                            className={`px-2 py-1 rounded-[10px] text-[10px] font-semibold transition-all cursor-pointer ${
                              bgMode === "transparent"
                                ? "bg-brand text-white"
                                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            }`}
                          >
                            {tr("Transparent Card", "Carte transparente")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setBgMode("gradient")}
                            className={`px-2 py-1 rounded-[10px] text-[10px] font-semibold transition-all cursor-pointer ${
                              bgMode === "gradient"
                                ? "bg-brand text-white"
                                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            }`}
                          >
                            {tr("Gradient Card", "Carte dégradée")}
                          </button>
                        </div>

                        <div className="flex items-center gap-1 bg-white dark:bg-[#141416] p-1 rounded-[10px] border border-neutral-200 dark:border-[#27272a]">
                          <button
                            type="button"
                            onClick={() => setTintWithFrameColor(false)}
                            className={`px-2 py-1 rounded-[10px] text-[10px] font-semibold transition-all cursor-pointer ${
                              !tintWithFrameColor
                                ? "bg-brand text-white"
                                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            }`}
                          >
                            {tr("Theme Palette", "Palette du thème")}
                          </button>
                          <button
                            type="button"
                            onClick={() => setTintWithFrameColor(true)}
                            className={`px-2 py-1 rounded-[10px] text-[10px] font-semibold transition-all cursor-pointer ${
                              tintWithFrameColor
                                ? "bg-brand text-white"
                                : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                            }`}
                          >
                            {tr("Custom Tint", "Teinte libre")}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      {tr("Frame text (Call To Action)", "Texte du cadre (Appel à l'action)")}
                    </label>
                    <Input
                      value={frameText}
                      onChange={(e) => {
                        applyInstantColor({ frameText: e.target.value });
                        setFrameText(e.target.value);
                      }}
                      placeholder="SCAN ME"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 dark:text-neutral-300 mb-1">
                      {isAnimatedFrame(selectedFrame)
                        ? tr("Custom tint color", "Couleur de teinte personnalisée")
                        : tr("Frame color", "Couleur du cadre")}
                    </label>
                    <div className="flex items-center gap-2">
                      <LiveColorControl
                        ariaLabel={tr("Frame or shader tint color", "Couleur du cadre ou teinte du shader")}
                        value={frameColor}
                        onInstantPreview={(hex) =>
                          applyInstantColor({
                            frameColor: hex,
                            tintWithFrameColor: isAnimatedFrame(
                              renderConfigRef.current.selectedFrame
                            )
                              ? true
                              : renderConfigRef.current.tintWithFrameColor,
                          })
                        }
                        onCommit={(hex) => {
                          setFrameColor(hex);
                          if (isAnimatedFrame(selectedFrame)) {
                            setTintWithFrameColor(true);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Options Typographiques & Taille de Police (Google Fonts Studio) */}
                <div className="flex flex-col gap-4 p-4 rounded-[12px] bg-neutral-50 dark:bg-[#1a1a1e] border border-neutral-200 dark:border-[#27272a] shadow-xs dark:shadow-lg">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-[#27272a] pb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-[8px] bg-brand flex items-center justify-center text-white">
                        <Type className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-zinc-900 dark:text-white tracking-wide">
                            {tr("Google Fonts Typography Studio", "Studio Typographique Google Fonts")}
                          </span>
                          <span className="text-[10px] font-bold bg-brand-subtle text-brand px-1.5 py-0.5 rounded border border-brand-subtle">
                            {FONT_FAMILIES.length} {tr("Fonts", "Polices")}
                          </span>
                        </div>
                        <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                          {tr(
                            "Select your font with live preview and pixel-perfect size adjustment",
                            "Sélectionnez votre police avec aperçu en direct et taille au pixel près"
                          )}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetTypography}
                      className="btn-hover-scale text-[11px] font-semibold text-neutral-700 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5 cursor-pointer self-start sm:self-auto bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 px-2.5 py-1.5 rounded-[6px] border border-neutral-200 dark:border-[#27272a]"
                      title={tr("Reset typography to default", "Réinitialiser la typographie")}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-brand" />
                      <span>{tr("Reset", "Réinitialiser")}</span>
                    </button>
                  </div>

                  {/* 1. Visual Font Card Browser (Memoized 80 Curated Google Fonts) */}
                  <FontsPicker
                    fonts={FONT_FAMILIES}
                    fontFamily={fontFamily}
                    frameText={frameText}
                    fontCategoryFilter={fontCategoryFilter}
                    fontSearchQuery={fontSearchQuery}
                    showAllFonts={showAllFonts}
                    onSelectFont={(id) => {
                      applyInstantColor({ fontFamily: id });
                      setFontFamily(id);
                    }}
                    onSetCategoryFilter={setFontCategoryFilter}
                    onSetSearchQuery={setFontSearchQuery}
                    onToggleShowAll={() => setShowAllFonts(!showAllFonts)}
                  />

                  {/* 2. Font Size Controls (Ultra-Smooth 120 FPS Direct Canvas Preview) */}
                  <div className="pt-3 border-t border-neutral-200 dark:border-[#27272a]">
                    <LiveFontSizeControl
                      value={fontSize}
                      min={8}
                      max={22}
                      onInstantPreview={(newSize) => applyInstantColor({ fontSize: newSize })}
                      onCommit={setFontSize}
                    />
                  </div>

                  {/* 3. Weight / Style & 4. Casing (Uppercase / Raw / Lowercase) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-neutral-200 dark:border-[#27272a]">
                    {/* Weight / Style */}
                    <div>
                      <span className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        {tr("Style & Weight", "Style & Graisse")}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5">
                        {[
                          { id: "normal" as const, label: "Normal 500" },
                          { id: "bold" as const, label: tr("Bold", "Gras") },
                          { id: "900" as const, label: tr("Extra Bold 900", "Extra Gras 900") },
                          { id: "italic" as const, label: tr("Italic", "Italique") },
                        ].map((w) => (
                          <button
                            key={w.id}
                            type="button"
                            onClick={() => {
                              applyInstantColor({ fontWeight: w.id });
                              setFontWeight(w.id);
                            }}
                            className={`btn-hover-scale py-1.5 px-2 rounded-[6px] text-[10px] font-semibold text-center border transition-all cursor-pointer ${
                              fontWeight === w.id
                                ? "bg-brand/10 dark:bg-brand-light border-brand text-brand dark:text-white font-bold shadow-xs"
                                : "bg-white dark:bg-[#141416] border-neutral-200 dark:border-[#27272a] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/5"
                            }`}
                          >
                            {w.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Text Transform */}
                    <div>
                      <span className="block text-[11px] font-semibold text-neutral-700 dark:text-neutral-300 mb-1.5">
                        {tr("Text Case", "Casse du texte")}
                      </span>
                      <div className="grid grid-cols-3 gap-1.5">
                        {[
                          { id: "uppercase" as const, label: tr("UPPERCASE", "MAJUSCULES") },
                          { id: "none" as const, label: "Standard" },
                          { id: "lowercase" as const, label: tr("lowercase", "minuscules") },
                        ].map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => {
                              applyInstantColor({ textTransform: c.id });
                              setTextTransform(c.id);
                            }}
                            className={`btn-hover-scale py-1.5 px-2 rounded-[6px] text-[10px] font-semibold text-center border transition-all cursor-pointer ${
                              textTransform === c.id
                                ? "bg-brand/10 dark:bg-brand-light border-brand text-brand dark:text-white font-bold shadow-xs"
                                : "bg-white dark:bg-[#141416] border-neutral-200 dark:border-[#27272a] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-50 dark:hover:bg-white/5"
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
  );

  return (
    <div className="flex flex-col gap-6 animate-in fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-wide">
            {tr("QR Code Customization Studio", "Studio de personnalisation QR Code")}
          </h1>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            {tr(
              "Customize pixel patterns, eye corner shapes, gradient colors, official brand logos, and CTA frames.",
              "Personnalisez les motifs de pixels, les angles, les dégradés, les logos officiels et les cadres CTA."
            )}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={handleSaveCustomization}
            disabled={isSavingCustomization}
            variant="primary"
            size="sm"
            className="text-xs font-bold gap-1.5 cursor-pointer"
          >
            {isSavingCustomization ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{tr("Saving...", "Enregistrement...")}</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{tr("Save", "Enregistrer")}</span>
              </>
            )}
          </Button>

          <button
            onClick={copyConfigJSON}
            className="btn-hover-scale px-3.5 py-2 rounded-[10px] bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#27272a] text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-2 cursor-pointer w-fit"
            title={tr("Copy JSON for Backend API", "Copier le JSON pour l'API backend")}
          >
            <Save className="w-3.5 h-3.5 text-brand" />
            <span>{tr("Export V3 JSON", "Exporter JSON V3")}</span>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Trigger Bar - visible only on mobile (< lg) */}
      <div className="lg:hidden flex flex-col gap-3">
        <Button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="w-full h-12 rounded-[10px] bg-brand hover:bg-brand-hover text-white text-xs font-bold flex items-center justify-center gap-2.5 shadow-md cursor-pointer transition-all"
        >
          <Sliders className="w-4 h-4" />
          <span>{tr("Configure QR Code settings", "Configurer les paramètres du QR Code")}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Customization Controls (7 cols) - desktop only */}
        {!isMobile && (
          <div className="hidden lg:flex lg:col-span-7 flex-col gap-6">
            {controlsContent}
          </div>
        )}
        {/* Right Column: Live Interactive Preview (5 cols on desktop, full width on mobile) */}
        <div className={cn("flex flex-col gap-4", isMobile ? "w-full" : "lg:col-span-5 sticky top-24")}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
              {tr("Live Preview", "Aperçu en direct")}
            </span>
            {isAnimatedFrame(selectedFrame) && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse" />
                  <span>Live WebGL</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPlayingAnimation(!isPlayingAnimation)}
                  className="btn-hover-scale px-2 py-1 rounded-[6px] bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#27272a] text-neutral-700 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 text-[10px] font-semibold cursor-pointer"
                  title={
                    isPlayingAnimation
                      ? tr("Pause animation", "Mettre l'animation en pause")
                      : tr("Play animation", "Lire l'animation")
                  }
                >
                  {isPlayingAnimation ? <Pause className="w-3 h-3 text-amber-500 dark:text-amber-400" /> : <Play className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />}
                  <span>{isPlayingAnimation ? tr("Pause", "Pause") : tr("Play", "Lire")}</span>
                </button>
              </div>
            )}
          </div>

          {/* QR Live Preview Stage (no chunky white wrapper box on animated shaders or transparent static QRs) */}
          <div className="rounded-[10px] bg-neutral-100 dark:bg-[#141416] border border-neutral-200 dark:border-[#222225] p-6 flex flex-col items-center justify-center shadow-xs dark:shadow-2xl overflow-hidden">
            {isAnimatedFrame(selectedFrame) ? (
              <div className="flex items-center justify-center">
                <canvas ref={canvasRef} className="max-w-full h-auto object-contain rounded-[16px] shadow-2xl" />
              </div>
            ) : bgMode === "transparent" ? (
              <div className="p-4 rounded-[10px] bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:12px_12px] border border-neutral-200/70 dark:border-[#27272a] flex items-center justify-center">
                <canvas ref={canvasRef} className="max-w-full h-auto object-contain" />
              </div>
            ) : (
              <div className="p-4 rounded-[10px] bg-white flex items-center justify-center shadow-xl">
                <canvas ref={canvasRef} className="max-w-full h-auto object-contain" />
              </div>
            )}
          </div>

          {/* Save Customization CTA Button */}
          <Button
            onClick={handleSaveCustomization}
            disabled={isSavingCustomization}
            variant="primary"
            className="w-full py-3 h-11 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer shadow-xs"
          >
            {isSavingCustomization ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>{tr("Saving in progress...", "Enregistrement en cours...")}</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{tr("Save customization", "Enregistrer la personnalisation")}</span>
                {matchedLink && (
                  <span className="text-[10px] opacity-90 font-mono bg-black/25 px-1.5 py-0.5 rounded">
                    /{matchedLink.slug}
                  </span>
                )}
              </>
            )}
          </Button>

          {/* Action Buttons: PNG, SVG, GIF, Share */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              onClick={downloadPNG}
              className="btn-hover-scale flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-brand hover:bg-brand-hover text-white text-xs font-bold cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PNG</span>
            </button>

            <button
              onClick={downloadSVG}
              className="btn-hover-scale flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#27272a] hover:border-brand dark:hover:border-brand text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white text-xs font-semibold cursor-pointer shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-brand" />
              <span>SVG</span>
            </button>

            <button
              onClick={downloadGIF}
              disabled={isGeneratingGif}
              className={`btn-hover-scale relative flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] border transition-all duration-200 text-xs font-bold cursor-pointer shadow-xs ${
                isGeneratingGif
                  ? "bg-amber-500/20 border-amber-500 text-amber-700 dark:text-amber-300"
                  : "bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-purple-500/10 hover:from-amber-500/25 hover:to-purple-500/20 dark:from-amber-500/15 dark:via-orange-500/15 dark:to-purple-500/15 dark:hover:from-amber-500/25 dark:hover:to-purple-500/25 border-amber-500/40 hover:border-amber-500 text-amber-800 dark:text-amber-300 shadow-amber-500/10"
              }`}
              title={
                isProPlan
                  ? tr(
                      "Download QR Code in high-resolution animated GIF format",
                      "Télécharger le QR Code au format GIF animé haute résolution"
                    )
                  : tr("GIF export reserved for Pro plan", "Export GIF réservé au forfait Pro")
              }
            >
              {isGeneratingGif ? (
                <>
                  <div className="w-3 h-3 border-2 border-amber-600 dark:border-amber-400 border-t-transparent rounded-full animate-spin" />
                  <span>{gifProgress}%</span>
                </>
              ) : (
                <>
                  <Film className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>GIF</span>
                  {!isProPlan && <Crown className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />}
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="btn-hover-scale flex items-center justify-center gap-1.5 py-2.5 rounded-[10px] bg-white dark:bg-white/5 hover:bg-neutral-100 dark:hover:bg-white/10 border border-neutral-200 dark:border-[#27272a] hover:border-brand dark:hover:border-brand text-neutral-800 dark:text-neutral-200 hover:text-black dark:hover:text-white text-xs font-semibold cursor-pointer shadow-xs"
              title={tr("Share Link & QR Code", "Partager le lien et le QR Code")}
            >
              <Share2 className="w-3.5 h-3.5 text-brand" />
              <span>{tr("Share", "Partager")}</span>
            </button>
          </div>

          <p className="text-center text-[11px] text-neutral-500 dark:text-neutral-400">
            {tr(
              "Export as PNG for web, vector SVG for HD printing, or GIF for animated frames.",
              "Exportez en PNG pour le web, en SVG vectoriel pour l'impression HD ou en GIF pour les cadres animés."
            )}
          </p>
        </div>
      </div>

      {/* Floating Bottom Bar for Mobile (< lg) */}
      <div className="lg:hidden fixed bottom-4 inset-x-4 z-40">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="w-full h-12 rounded-[10px] bg-brand hover:bg-brand-hover text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xl border border-white/20 backdrop-blur-md cursor-pointer transition-transform active:scale-[0.98]"
        >
          <Sliders className="w-4 h-4" />
          <span>{tr("Open QR Code Settings", "Ouvrir les paramètres du QR Code")}</span>
        </button>
      </div>

      {/* Mobile Bottom Drawer */}
      {isMobile && (
        <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen} direction="bottom">
          <DrawerContent direction="bottom" className="max-h-[85vh] rounded-t-[10px]">
            <DrawerHeader className="flex flex-row items-center justify-between border-b border-neutral-200 dark:border-[#222225] px-4 py-3 bg-white dark:bg-[#141416]">
              <div>
                <DrawerTitle className="text-sm font-bold text-neutral-900 dark:text-white">
                  {tr("QR Code Settings", "Paramètres du QR Code")}
                </DrawerTitle>
                <DrawerDescription className="text-xs text-neutral-500 dark:text-neutral-400">
                  {tr(
                    "Styles, colors, logo, frame, and typography",
                    "Styles, couleurs, logo, cadre et typographie"
                  )}
                </DrawerDescription>
              </div>
              <DrawerClose />
            </DrawerHeader>
            <div className="overflow-y-auto px-4 py-4 space-y-6 pb-24">
              {controlsContent}
            </div>
            <div className="sticky bottom-0 p-3 bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md border-t border-neutral-200 dark:border-[#222225]">
              <Button
                onClick={() => setIsDrawerOpen(false)}
                variant="primary"
                className="w-full h-11 text-xs font-bold rounded-[10px] shadow-sm cursor-pointer"
              >
                {tr("Apply and preview", "Appliquer et voir le résultat")}
              </Button>
            </div>
          </DrawerContent>
        </Drawer>
      )}

      {/* Link Share Modal */}
      <LinkShareModal
        link={
          matchedLink || {
            id: "qr-custom",
            userId: userId || "",
            slug: "",
            domainName: "",
            shortUrl: getRawQRValue(),
            targetUrl: getRawQRValue(),
            clicksCount: 0,
            isActive: true,
            created_at: new Date().toISOString(),
          }
        }
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </div>
  );
}
