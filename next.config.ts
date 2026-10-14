import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  devIndicators: false,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      allowedOrigins: [
        "lsho.cc",
        "*.lsho.cc",
        "*.vercel.app",
        "**.vercel.app",
        "localhost:3000",
        "127.0.0.1:3000",
      ],
    },
    optimizePackageImports: [
      "lucide-react",
      "gsap",
      "canvas-confetti",
      "date-fns",
      "react-simple-maps",
    ],
  },
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "api.dicebear.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
      },
      {
        protocol: "https",
        hostname: "*.b-cdn.net",
      },
      {
        protocol: "https",
        hostname: "b-cdn.net",
      },
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      {
        protocol: "https",
        hostname: "cdn.simpleicons.org",
      },
    ],
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.paddle.com https://challenges.cloudflare.com https://www.googletagmanager.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https: https://www.googletagmanager.com https://*.google-analytics.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.convex.cloud https://*.paddle.com https://challenges.cloudflare.com https://*.cloudflare.com https://api.dicebear.com wss://*.convex.cloud https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com",
              "frame-src 'self' https://buy.paddle.com https://sandbox-buy.paddle.com https://challenges.cloudflare.com",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  async rewrites() {
    return [
      {
        source:
          "/:slug((?!api|_next|favicon\\.ico|lshorter_favicon\\.svg|icon-512\\.png|login|register|dashboard|onboarding|r|terms|privacy|pricing|blog|reset-password).*)",
        destination: "/r/:slug",
      },
    ];
  },
};

export default nextConfig;
