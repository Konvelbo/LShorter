"use client";

import React from "react";

export interface ReferrerInfo {
  platform: string;
  domain: string;
  category: "social" | "search" | "direct" | "chat" | "email" | "dev" | "web";
  color: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
}

export function parseReferrer(rawReferrer?: string | null): {
  info: ReferrerInfo;
  raw: string;
  icon: (className?: string) => React.ReactNode;
} {
  const ref = String(rawReferrer || "").trim();
  const lower = ref.toLowerCase();

  // 1. Direct / Empty / None
  if (
    !ref ||
    lower === "direct" ||
    lower === "none" ||
    ref === "—" ||
    ref === "-" ||
    lower === "direct / none"
  ) {
    return {
      raw: ref || "Direct",
      info: {
        platform: "Direct",
        domain: "direct",
        category: "direct",
        color: "#10B981",
        badgeBg: "bg-emerald-500/10 dark:bg-emerald-500/15",
        badgeBorder: "border-emerald-500/30",
        badgeText: "text-emerald-700 dark:text-emerald-300",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <circle cx="12" cy="12" r="12" fill="#10B981" />
          <circle cx="12" cy="12" r="9" stroke="#A7F3D0" strokeWidth="1" fill="none" opacity="0.4" />
          <polygon points="12,6.5 14.5,12 12,12" fill="#FFFFFF" />
          <polygon points="12,12 9.5,12 12,17.5" fill="#D1FAE5" />
          <polygon points="12,6.5 9.5,12 12,12" fill="#E6FFFA" />
          <polygon points="12,12 14.5,12 12,17.5" fill="#A7F3D0" />
          <circle cx="12" cy="12" r="1.5" fill="#047857" />
        </svg>
      ),
    };
  }

  // QR Code
  if (lower === "qr" || lower === "qr code" || lower === "qrcode" || lower.includes("qr_code")) {
    return {
      raw: ref,
      info: {
        platform: "QR Code",
        domain: "qr",
        category: "direct",
        color: "#0EA5E9",
        badgeBg: "bg-sky-500/10",
        badgeBorder: "border-sky-500/30",
        badgeText: "text-sky-700 dark:text-sky-300",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <rect width="24" height="24" rx="5" fill="#0EA5E9" />
          <path
            d="M5.5 5.5h4.5v4.5H5.5V5.5zm1 1v2.5h2.5V6.5H6.5zm-1 7.5h4.5v4.5H5.5V14zm1 1v2.5h2.5V15H6.5zm8.5-9.5h4.5v4.5H15V5.5zm1 1v2.5h2.5V6.5H16zm-1 8.5h2v2h-2v-2zm2 2h2v2h-2v-2zm-2 2h2v-2h2v3h-4v-1zm3-2h2v-2h-2v2z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // Normalize lower case string for pattern matching
  let cleanDomain = lower;
  try {
    if (ref.startsWith("http://") || ref.startsWith("https://")) {
      cleanDomain = new URL(ref).hostname.toLowerCase();
    }
  } catch {}

  // 2. Twitter / X
  if (
    cleanDomain.includes("twitter.com") ||
    cleanDomain.includes("x.com") ||
    cleanDomain.includes("t.co") ||
    lower === "twitter" ||
    lower === "x"
  ) {
    return {
      raw: ref,
      info: {
        platform: "X (Twitter)",
        domain: "x.com",
        category: "social",
        color: "#000000",
        badgeBg: "bg-black/5 dark:bg-white/10",
        badgeBorder: "border-black/20 dark:border-white/20",
        badgeText: "text-zinc-900 dark:text-white",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <rect width="24" height="24" rx="5" fill="#000000" />
          <path
            d="M17.472 4.5h2.476l-5.41 6.183 6.364 8.417h-4.982l-3.902-5.102-4.466 5.102H4.476l5.787-6.614L4.12 4.5h5.108l3.527 4.664L17.472 4.5zm-.87 13.118h1.372L8.442 5.918H6.97l9.632 11.7z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 3. Facebook
  if (
    cleanDomain.includes("facebook.com") ||
    cleanDomain.includes("fb.com") ||
    cleanDomain.includes("fb.me") ||
    lower === "facebook"
  ) {
    return {
      raw: ref,
      info: {
        platform: "Facebook",
        domain: "facebook.com",
        category: "social",
        color: "#1877F2",
        badgeBg: "bg-[#1877F2]/10",
        badgeBorder: "border-[#1877F2]/30",
        badgeText: "text-[#1877F2] dark:text-[#4B9CFF]",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <circle cx="12" cy="12" r="12" fill="#1877F2" />
          <path
            d="M15.117 12.72l.44-2.87h-2.753V8.012c0-.786.386-1.552 1.62-1.552h1.253V4.015S14.54 3.822 13.43 3.822c-2.316 0-3.83 1.405-3.83 3.946v2.082H7.078v2.87h2.522V19.78a12.04 12.04 0 003.754 0V12.72h1.763z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 4. Instagram
  if (cleanDomain.includes("instagram.com") || lower === "instagram" || lower === "ig") {
    return {
      raw: ref,
      info: {
        platform: "Instagram",
        domain: "instagram.com",
        category: "social",
        color: "#E1306C",
        badgeBg: "bg-gradient-to-r from-[#FF0069]/10 to-[#7638FA]/10",
        badgeBorder: "border-[#E1306C]/30",
        badgeText: "text-[#E1306C] dark:text-[#FF6599]",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <defs>
            <linearGradient id="lshorter_ig_grad" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f09433" />
              <stop offset="25%" stopColor="#e6683c" />
              <stop offset="50%" stopColor="#dc2743" />
              <stop offset="75%" stopColor="#cc2366" />
              <stop offset="100%" stopColor="#bc1888" />
            </linearGradient>
          </defs>
          <rect width="24" height="24" rx="5.5" fill="url(#lshorter_ig_grad)" />
          <path
            d="M12 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88zM17.8 2H6.2A4.2 4.2 0 002 6.2v11.6A4.2 4.2 0 006.2 22h11.6a4.2 4.2 0 004.2-4.2V6.2A4.2 4.2 0 0017.8 2zm2.037 15.8a2.237 2.237 0 01-2.237 2.237H6.4a2.237 2.237 0 01-2.237-2.237V6.4A2.237 2.237 0 016.4 4.163h11.2a2.237 2.237 0 012.237 2.237v11.4z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 5. LinkedIn
  if (
    cleanDomain.includes("linkedin.com") ||
    cleanDomain.includes("lnkd.in") ||
    lower === "linkedin"
  ) {
    return {
      raw: ref,
      info: {
        platform: "LinkedIn",
        domain: "linkedin.com",
        category: "social",
        color: "#0A66C2",
        badgeBg: "bg-[#0A66C2]/10",
        badgeBorder: "border-[#0A66C2]/30",
        badgeText: "text-[#0A66C2] dark:text-[#3B92E4]",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <rect width="24" height="24" rx="4.5" fill="#0A66C2" />
          <path
            d="M7.12 9.04H4.37v9.59h2.75V9.04zm-1.38-4.4a1.6 1.6 0 100 3.2 1.6 1.6 0 000-3.2zm13.89 8.21c0-2.82-1.51-4.13-3.52-4.13-1.62 0-2.35.89-2.75 1.51V9.04h-2.75c.04.77 0 9.59 0 9.59h2.75v-5.36c0-.29.02-.57.11-.78.23-.57.77-1.17 1.67-1.17 1.18 0 1.65.9 1.65 2.21v5.1h2.75l.09-5.39z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 6. WhatsApp
  if (
    cleanDomain.includes("whatsapp.com") ||
    cleanDomain.includes("wa.me") ||
    lower === "whatsapp"
  ) {
    return {
      raw: ref,
      info: {
        platform: "WhatsApp",
        domain: "whatsapp.com",
        category: "chat",
        color: "#25D366",
        badgeBg: "bg-[#25D366]/10",
        badgeBorder: "border-[#25D366]/30",
        badgeText: "text-[#1DA851] dark:text-[#25D366]",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <circle cx="12" cy="12" r="12" fill="#25D366" />
          <path
            d="M17.472 14.382c-.301-.15-1.78-.878-2.056-.979-.276-.1-.476-.15-.677.15-.2.301-.777.979-.953 1.18-.175.2-.351.225-.652.075-.301-.15-1.27-.468-2.42-1.493-.895-.798-1.5-1.784-1.676-2.085-.175-.301-.019-.464.132-.614.136-.135.301-.351.451-.527.151-.175.201-.301.301-.501.101-.2.05-.376-.025-.527-.075-.15-.677-1.633-.928-2.235-.244-.587-.492-.507-.677-.517-.175-.009-.376-.01-.577-.01-.2 0-.527.075-.802.376s-1.054 1.03-1.054 2.511c0 1.48 1.079 2.91 1.229 3.11.15.2 2.124 3.243 5.147 4.549.719.31 1.28.496 1.718.635.722.23 1.379.197 1.898.12.578-.087 1.78-.728 2.031-1.431.251-.703.251-1.305.176-1.431-.076-.126-.276-.201-.577-.351zm-5.467 7.618c-2.02 0-4-.543-5.733-1.572l-.411-.244-4.261 1.117 1.137-4.153-.267-.425c-1.13-1.8-1.727-3.896-1.727-6.043 0-6.25 5.086-11.336 11.337-11.336 3.029 0 5.877 1.18 8.019 3.323 2.143 2.143 3.323 4.991 3.323 8.02 0 6.251-5.086 11.338-11.337 11.338z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 7. YouTube
  if (
    cleanDomain.includes("youtube.com") ||
    cleanDomain.includes("youtu.be") ||
    lower === "youtube"
  ) {
    return {
      raw: ref,
      info: {
        platform: "YouTube",
        domain: "youtube.com",
        category: "social",
        color: "#FF0000",
        badgeBg: "bg-[#FF0000]/10",
        badgeBorder: "border-[#FF0000]/30",
        badgeText: "text-[#FF0000] dark:text-[#FF4D4D]",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <path
            d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
            fill="#FF0000"
          />
          <polygon points="9.545,15.568 9.545,8.432 15.818,12" fill="#FFFFFF" />
        </svg>
      ),
    };
  }

  // 8. TikTok
  if (cleanDomain.includes("tiktok.com") || lower === "tiktok") {
    return {
      raw: ref,
      info: {
        platform: "TikTok",
        domain: "tiktok.com",
        category: "social",
        color: "#000000",
        badgeBg: "bg-black/5 dark:bg-white/10",
        badgeBorder: "border-black/20 dark:border-white/20",
        badgeText: "text-zinc-900 dark:text-white",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <rect width="24" height="24" rx="5" fill="#000000" />
          <path
            d="M16.6 8.2c-.75-.5-1.25-1.3-1.35-2.2H12.8v10.5c0 1.65-1.35 3-3 3s-3-1.35-3-3 1.35-3 3-3c.3 0 .6.05.85.15V10.7c-.3-.05-.55-.05-.85-.05-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6V9.9c1.1.8 2.4 1.3 3.8 1.3v-2.5c-.85 0-1.65-.2-2.2-.5z"
            fill="#25F4EE"
            transform="translate(-0.5, -0.5)"
          />
          <path
            d="M16.6 8.2c-.75-.5-1.25-1.3-1.35-2.2H12.8v10.5c0 1.65-1.35 3-3 3s-3-1.35-3-3 1.35-3 3-3c.3 0 .6.05.85.15V10.7c-.3-.05-.55-.05-.85-.05-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6V9.9c1.1.8 2.4 1.3 3.8 1.3v-2.5c-.85 0-1.65-.2-2.2-.5z"
            fill="#FE2C55"
            transform="translate(0.5, 0.5)"
          />
          <path
            d="M16.6 8.2c-.75-.5-1.25-1.3-1.35-2.2H12.8v10.5c0 1.65-1.35 3-3 3s-3-1.35-3-3 1.35-3 3-3c.3 0 .6.05.85.15V10.7c-.3-.05-.55-.05-.85-.05-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6V9.9c1.1.8 2.4 1.3 3.8 1.3v-2.5c-.85 0-1.65-.2-2.2-.5z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 9. Telegram
  if (
    cleanDomain.includes("telegram.org") ||
    cleanDomain.includes("t.me") ||
    lower === "telegram"
  ) {
    return {
      raw: ref,
      info: {
        platform: "Telegram",
        domain: "t.me",
        category: "chat",
        color: "#24A1DE",
        badgeBg: "bg-[#24A1DE]/10",
        badgeBorder: "border-[#24A1DE]/30",
        badgeText: "text-[#1F8ECA] dark:text-[#52B7E8]",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <circle cx="12" cy="12" r="12" fill="#24A1DE" />
          <path
            d="M17.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.16.16-.295.295-.605.295l.213-3.053 5.56-5.023c.242-.213-.054-.333-.373-.121l-6.871 4.326-2.962-.924c-.643-.204-.657-.643.136-.953l11.57-4.458c.538-.196 1.006.128.832.939z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 10. Reddit
  if (
    cleanDomain.includes("reddit.com") ||
    cleanDomain.includes("redd.it") ||
    lower === "reddit"
  ) {
    return {
      raw: ref,
      info: {
        platform: "Reddit",
        domain: "reddit.com",
        category: "social",
        color: "#FF4500",
        badgeBg: "bg-[#FF4500]/10",
        badgeBorder: "border-[#FF4500]/30",
        badgeText: "text-[#FF4500] dark:text-[#FF6A33]",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <circle cx="12" cy="12" r="12" fill="#FF4500" />
          <path
            d="M19.5 12c0-.83-.67-1.5-1.5-1.5-.4 0-.76.16-1.03.41-1.22-.84-2.88-1.39-4.73-1.45l.96-4.52 3.14.67c.05.65.59 1.16 1.25 1.16.69 0 1.25-.56 1.25-1.25s-.56-1.25-1.25-1.25c-.47 0-.87.26-1.08.64l-3.52-.75a.3.3 0 00-.35.23l-1.12 5.27c-1.91.04-3.62.6-4.87 1.46-.27-.26-.64-.43-1.05-.43-.83 0-1.5.67-1.5 1.5 0 .58.33 1.08.82 1.33-.04.22-.06.44-.06.67 0 3.03 3.58 5.5 8 5.5s8-2.47 8-5.5c0-.22-.02-.44-.06-.66.51-.25.86-.76.86-1.35zm-10.25.75c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm5.5 3.75c-.86.86-2.51.86-3.37 0-.15-.15-.15-.38 0-.53.15-.15.38-.15.53 0 .57.57 1.74.57 2.31 0 .15-.15.39-.15.53 0 .15.15.15.39 0 .53zm-.25-2.75c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 11. Google
  if (
    cleanDomain.includes("google.") ||
    cleanDomain.includes("android-app://com.google") ||
    lower === "google"
  ) {
    return {
      raw: ref,
      info: {
        platform: "Google",
        domain: "google.com",
        category: "search",
        color: "#4285F4",
        badgeBg: "bg-blue-500/10",
        badgeBorder: "border-blue-500/30",
        badgeText: "text-blue-700 dark:text-blue-300",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <path
            d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
            fill="#4285F4"
          />
          <path
            d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.35 24 12 24z"
            fill="#34A853"
          />
          <path
            d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"
            fill="#FBBC05"
          />
          <path
            d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            fill="#EA4335"
          />
        </svg>
      ),
    };
  }

  // 12. Discord
  if (
    cleanDomain.includes("discord.com") ||
    cleanDomain.includes("discord.gg") ||
    lower === "discord"
  ) {
    return {
      raw: ref,
      info: {
        platform: "Discord",
        domain: "discord.com",
        category: "chat",
        color: "#5865F2",
        badgeBg: "bg-[#5865F2]/10",
        badgeBorder: "border-[#5865F2]/30",
        badgeText: "text-[#5865F2] dark:text-[#7983F5]",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <rect width="24" height="24" rx="4.5" fill="#5865F2" />
          <path
            d="M17.3 6.3a14.2 14.2 0 00-3.5-1.1.1.1 0 00-.1.1c-.2.3-.3.6-.5.9-1.2-.2-2.4-.2-3.6 0-.2-.3-.3-.6-.5-.9a.1.1 0 00-.1-.1 14.2 14.2 0 00-3.5 1.1.1.1 0 000 0C3.3 9.7 2.7 13 3 16.3a.1.1 0 000 .1 14.3 14.3 0 004.3 2.2.1.1 0 00.1 0c.3-.5.7-.9 1-1.4a.1.1 0 000-.1 9.4 9.4 0 01-1.5-.7.1.1 0 010-.1c.1-.1.2-.2.3-.2 2.8 1.3 5.9 1.3 8.7 0 .1.1.2.1.3.2a.1.1 0 010 .1c-.5.3-1 .5-1.5.7a.1.1 0 000 .1c.3.5.7 1 1 1.4a.1.1 0 00.1 0 14.3 14.3 0 004.3-2.2.1.1 0 000-.1c.4-3.7-.6-7-2.6-10.4 0 0 0 0 0 0zM8.8 14.4c-.8 0-1.5-.7-1.5-1.6s.7-1.6 1.5-1.6c.9 0 1.6.7 1.5 1.6 0 .9-.7 1.6-1.5 1.6zm6.4 0c-.8 0-1.5-.7-1.5-1.6s.7-1.6 1.5-1.6c.9 0 1.6.7 1.5 1.6 0 .9-.7 1.6-1.5 1.6z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 13. Threads
  if (cleanDomain.includes("threads.net") || lower === "threads") {
    return {
      raw: ref,
      info: {
        platform: "Threads",
        domain: "threads.net",
        category: "social",
        color: "#000000",
        badgeBg: "bg-black/5 dark:bg-white/10",
        badgeBorder: "border-black/20 dark:border-white/20",
        badgeText: "text-zinc-900 dark:text-white",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <rect width="24" height="24" rx="5" fill="#000000" />
          <path
            d="M12.186 19.5c-4.04 0-7.3-3.26-7.3-7.29 0-4.04 3.28-7.31 7.32-7.31 4.02 0 7.15 3.17 7.15 7.25 0 .7-.09 1.4-.28 2.08a.74.74 0 01-.93.52.74.74 0 01-.52-.93c.17-.59.25-1.18.25-1.67 0-3.26-2.46-5.77-5.67-5.77-3.27 0-5.92 2.66-5.92 5.93 0 3.29 2.64 5.95 5.91 5.96 1.66 0 3.24-.66 4.33-1.84a.74.74 0 011.08 1.01c-1.37 1.48-3.35 2.31-5.42 2.31zm1.72-9.02c-.22-.13-.49-.2-.79-.2-1.15 0-2.02.9-2.02 2.1 0 1.18.85 2.1 2.02 2.1.59 0 1.09-.27 1.39-.75v.58c0 1.05-.65 1.66-1.64 1.66-.63 0-1.1-.28-1.3-.77a.74.74 0 01.38-.97.74.74 0 01.97.38c.05.11.18.24.41.24.43 0 .75-.3.75-.91v-2.74a.74.74 0 011.48 0v.46c.39.43.95.69 1.56.69 1.3 0 2.26-1.02 2.26-2.41 0-1.41-1-2.47-2.39-2.47-1.22 0-2.18.78-2.44 1.82-.05.23-.11.45-.14.68zm-1.1 2.76c-.48 0-.82-.37-.82-.89s.34-.89.82-.89c.48 0 .82.37.82.89s-.34.89-.82.89z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 14. Pinterest
  if (
    cleanDomain.includes("pinterest.com") ||
    cleanDomain.includes("pin.it") ||
    lower === "pinterest"
  ) {
    return {
      raw: ref,
      info: {
        platform: "Pinterest",
        domain: "pinterest.com",
        category: "social",
        color: "#E60023",
        badgeBg: "bg-[#E60023]/10",
        badgeBorder: "border-[#E60023]/30",
        badgeText: "text-[#E60023] dark:text-[#FF4D6A]",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <circle cx="12" cy="12" r="12" fill="#E60023" />
          <path
            d="M12 4.5c-4.14 0-7.5 3.36-7.5 7.5 0 3.18 1.98 5.89 4.77 6.98-.07-.59-.13-1.5.03-2.15.14-.59.9-3.82.9-3.82s-.23-.46-.23-1.14c0-1.07.62-1.87 1.39-1.87.66 0 .97.49.97 1.08 0 .66-.42 1.65-.64 2.56-.18.77.38 1.39 1.14 1.39 1.37 0 2.42-1.44 2.42-3.52 0-1.84-1.32-3.13-3.21-3.13-2.19 0-3.47 1.64-3.47 3.34 0 .66.25 1.37.57 1.76a.23.23 0 01.05.22c-.06.25-.2.8-.23.91-.04.14-.13.17-.29.1-1.08-.5-1.75-2.07-1.75-3.33 0-2.71 1.97-5.2 5.68-5.2 2.98 0 5.3 2.12 5.3 4.96 0 2.96-1.87 5.34-4.46 5.34-.87 0-1.69-.45-1.97-.99l-.54 2.05c-.19.75-.72 1.68-1.07 2.25A7.47 7.47 0 0012 19.5c4.14 0 7.5-3.36 7.5-7.5s-3.36-7.5-7.5-7.5z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 15. Snapchat
  if (cleanDomain.includes("snapchat.com") || lower === "snapchat") {
    return {
      raw: ref,
      info: {
        platform: "Snapchat",
        domain: "snapchat.com",
        category: "social",
        color: "#FFFC00",
        badgeBg: "bg-amber-500/10",
        badgeBorder: "border-amber-500/30",
        badgeText: "text-amber-700 dark:text-amber-300",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <rect width="24" height="24" rx="5" fill="#FFFC00" />
          <path
            d="M12.1 4.5c-2.8 0-4.6 2-4.6 4.3 0 .9.3 1.8.6 2.3.1.2.1.3 0 .4-.1.2-.3.4-.8.6-.3.1-.6.3-.7.4-.2.2-.2.4 0 .6.3.4.9.6 2 .7.1 0 .2.1.2.2-.1.4-.3 1-1.2 1.3-.3.1-.4.2-.3.4.1.3.5.4 1.1.4.5 0 1-.1 1.5-.2.1 0 .2 0 .3.1.2.6.9 1 1.9 1 1 0 1.6-.4 1.9-1 .1-.1.2-.1.3-.1.5.1 1 .2 1.5.2.6 0 1-.1 1.1-.4.1-.2 0-.3-.3-.4-.9-.3-1.1-.9-1.2-1.3 0-.1.1-.2.2-.2 1.1-.1 1.7-.3 2-.7.2-.2.2-.4 0-.6-.1-.1-.4-.3-.7-.4-.5-.2-.7-.4-.8-.6-.1-.1-.1-.2 0-.4.3-.5.6-1.4.6-2.3 0-2.3-1.8-4.3-4.6-4.3z"
            fill="#FFFFFF"
            stroke="#000000"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />
        </svg>
      ),
    };
  }

  // 16. GitHub
  if (cleanDomain.includes("github.com") || lower === "github") {
    return {
      raw: ref,
      info: {
        platform: "GitHub",
        domain: "github.com",
        category: "dev",
        color: "#24292F",
        badgeBg: "bg-neutral-500/10",
        badgeBorder: "border-neutral-500/30",
        badgeText: "text-zinc-800 dark:text-zinc-200",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <rect width="24" height="24" rx="5" fill="#24292F" />
          <path
            d="M12 4a8 8 0 00-2.53 15.59c.4.07.55-.17.55-.38v-1.35c-2.22.48-2.69-1.07-2.69-1.07-.36-.92-.89-1.17-.89-1.17-.73-.5.05-.49.05-.49.8.06 1.23.83 1.23.83.71 1.22 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 014 0c1.53-1.03 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48v2.19c0 .21.15.46.55.38A8 8 0 0012 4z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 17. Messenger
  if (
    cleanDomain.includes("messenger.com") ||
    cleanDomain.includes("m.me") ||
    lower === "messenger"
  ) {
    return {
      raw: ref,
      info: {
        platform: "Messenger",
        domain: "messenger.com",
        category: "chat",
        color: "#00B2FE",
        badgeBg: "bg-blue-500/10",
        badgeBorder: "border-blue-500/30",
        badgeText: "text-blue-600 dark:text-blue-400",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <defs>
            <linearGradient id="lshorter_msg_grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00B2FE" />
              <stop offset="50%" stopColor="#006AFF" />
              <stop offset="100%" stopColor="#A033FF" />
            </linearGradient>
          </defs>
          <circle cx="12" cy="12" r="12" fill="url(#lshorter_msg_grad)" />
          <path
            d="M6 12c0-3.314 2.686-6 6-6s6 2.686 6 6c0 3.314-2.686 6-6 6-.61 0-1.19-.09-1.74-.26l-2.48.78.69-2.2A5.96 5.96 0 016 12zm3.82.74l1.83 1.95a.75.75 0 001.12-.04l2.45-2.65a.4.4 0 00-.54-.58l-1.83 1.95a.75.75 0 00-1.12.04l-2.45-2.65a.4.4 0 00-.54.58l.08.06z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 18. Twitch
  if (cleanDomain.includes("twitch.tv") || lower === "twitch") {
    return {
      raw: ref,
      info: {
        platform: "Twitch",
        domain: "twitch.tv",
        category: "social",
        color: "#9146FF",
        badgeBg: "bg-[#9146FF]/10",
        badgeBorder: "border-[#9146FF]/30",
        badgeText: "text-[#9146FF]",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <rect width="24" height="24" rx="4.5" fill="#9146FF" />
          <path
            d="M5 4h14v10.5l-3.5 3.5H12l-2 2H8v-2H5V4zm8.5 7.5V7.5H12v4h1.5zm3.5 0V7.5H15.5v4H17z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 19. Slack
  if (cleanDomain.includes("slack.com") || lower === "slack") {
    return {
      raw: ref,
      info: {
        platform: "Slack",
        domain: "slack.com",
        category: "chat",
        color: "#ECB22E",
        badgeBg: "bg-amber-500/10",
        badgeBorder: "border-amber-500/30",
        badgeText: "text-amber-700 dark:text-amber-300",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A" />
          <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0" />
          <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D" />
          <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E" />
        </svg>
      ),
    };
  }

  // 20. Email / Mail
  if (lower.includes("mail") || lower.includes("gmail") || lower.includes("outlook") || lower.includes("yahoo")) {
    return {
      raw: ref,
      info: {
        platform: "Email",
        domain: "email",
        category: "email",
        color: "#6366F1",
        badgeBg: "bg-indigo-500/10",
        badgeBorder: "border-indigo-500/30",
        badgeText: "text-indigo-700 dark:text-indigo-300",
      },
      icon: (cls = "w-5 h-5") => (
        <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
          <rect width="24" height="24" rx="4.5" fill="#6366F1" />
          <path
            d="M4.5 7.5A1.5 1.5 0 016 6h12a1.5 1.5 0 011.5 1.5v9a1.5 1.5 0 01-1.5 1.5H6a1.5 1.5 0 01-1.5-1.5v-9zm2.25.75l5.25 3.5 5.25-3.5H6.75zm11.25 1.63l-5.6 3.73a.75.75 0 01-.8 0l-5.6-3.73V16.5h12V9.88z"
            fill="#FFFFFF"
          />
        </svg>
      ),
    };
  }

  // 21. Generic Web Domain / Website
  const cleanLabel = cleanDomain.replace(/^www\./, "");
  return {
    raw: ref,
    info: {
      platform: cleanLabel || "Web Link",
      domain: cleanLabel,
      category: "web",
      color: "#475467",
      badgeBg: "bg-zinc-100 dark:bg-white/5",
      badgeBorder: "border-zinc-200 dark:border-[#27272a]",
      badgeText: "text-zinc-700 dark:text-zinc-300",
    },
    icon: (cls = "w-5 h-5") => (
      <svg viewBox="0 0 24 24" className={`shrink-0 ${cls}`} width="100%" height="100%">
        <circle cx="12" cy="12" r="12" fill="#475467" />
        <path
          d="M12 4.5a7.5 7.5 0 100 15 7.5 7.5 0 000-15zm-1.8 1.4c.5-1 1.2-1.4 1.8-1.4s1.3.4 1.8 1.4c.6 1.1.9 2.5 1 4.1h-5.6c.1-1.6.4-3 1-4.1zm-4.3 4.1c.2-1.3.7-2.5 1.5-3.4 1-.2 2-.3 3-.3v3.7H5.9zm0 1.5h4.2v3.7c-1 0-2-.1-3-.3-.8-.9-1.3-2.1-1.5-3.4zm4.3 5.6c-.6-1.1-.9-2.5-1-4.1h5.6c-.1 1.6-.4 3-1 4.1-.5 1-1.2 1.4-1.8 1.4s-1.3-.4-1.8-1.4zm3.9-.5c.8-.9 1.3-2.1 1.5-3.4h-4.2v3.7c1-.2 2-.3 2.7-.3zm1.5-4.9c-.2-1.3-.7-2.5-1.5-3.4-.7 0-1.7-.1-2.7-.3V8.8h4.2z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  };
}

export interface ReferrerLogoProps {
  referrer?: string | null;
  size?: number;
  className?: string;
  title?: string;
}

/**
 * Pure official brand SVG logo without badge container or borders.
 * Displays with an automatic title tooltip on hover and smooth micro-interaction.
 */
export function ReferrerLogo({
  referrer,
  size = 22,
  className = "",
  title,
}: ReferrerLogoProps) {
  const { info, icon, raw } = parseReferrer(referrer);
  const displayTitle = title || `${info.platform} (${raw || "Direct"})`;

  // Pour "Direct" et "QR code", afficher uniquement le texte propre, sans icône/badge
  if (info.category === "direct") {
    return (
      <span
        title={displayTitle}
        className={`inline-block font-medium text-[12.5px] text-[#475467] dark:text-[#98A2B3] tracking-tight ${className}`}
      >
        {info.platform}
      </span>
    );
  }

  // Pour les marques/brands, afficher le vrai logo officiel en SVG
  return (
    <div
      title={displayTitle}
      aria-label={displayTitle}
      className={`inline-flex items-center justify-center shrink-0 transition-transform duration-150 hover:scale-110 select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {icon("w-full h-full")}
    </div>
  );
}

export interface ReferrerBadgeProps {
  referrer?: string | null;
  showLabel?: boolean;
  className?: string;
  iconOnly?: boolean;
  size?: number;
}

/**
 * Renders the clean official SVG logo by default (no badge background or border).
 * If showLabel is explicitly requested, renders with platform name text.
 */
export function ReferrerBadge({
  referrer,
  showLabel = false,
  className = "",
  iconOnly = true,
  size = 22,
}: ReferrerBadgeProps) {
  if (!showLabel) {
    return <ReferrerLogo referrer={referrer} size={size} className={className} />;
  }

  const { info, icon, raw } = parseReferrer(referrer);
  return (
    <span
      title={raw}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] ${info.badgeBg} border ${info.badgeBorder} ${info.badgeText} text-xs font-medium font-mono whitespace-nowrap transition-colors ${className}`}
    >
      <span className="w-4 h-4 shrink-0 inline-flex items-center justify-center">
        {icon("w-4 h-4")}
      </span>
      <span className="truncate max-w-[130px]">{info.platform}</span>
    </span>
  );
}
