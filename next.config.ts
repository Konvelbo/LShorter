import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {
      allowedOrigins: ["lsho.cc", "www.lsho.cc", "localhost:3000"],
    },
    optimizePackageImports: [
      "lucide-react",
      "gsap",
      "framer-motion",
      "canvas-confetti",
      "date-fns",
      "react-simple-maps",
    ],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
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
    ],
  },
};

export default nextConfig;

