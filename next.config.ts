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
