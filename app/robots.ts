import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lsho.cc";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/pricing",
          "/docs",
          "/docs/",
          "/terms",
          "/privacy",
          "/refund",
          "/api/og",
        ],
        disallow: [
          "/dashboard",
          "/dashboard/",
          "/api/",
          "/auth/",
          "/login",
          "/register",
          "/onboarding",
          "/checkout",
          "/checkout/",
          "/r/",
          "/video-preview",
          "/*?*debug=*",
          "/*?*preview=*",
        ],
      },
      {
        userAgent: [
          "Twitterbot",
          "facebookexternalhit",
          "LinkedInBot",
          "WhatsApp",
          "TelegramBot",
          "Discordbot",
          "Slackbot",
        ],
        allow: [
          "/",
          "/pricing",
          "/docs",
          "/docs/",
          "/terms",
          "/privacy",
          "/refund",
          "/api/og",
          "/r/",
        ],
        disallow: ["/dashboard/", "/api/v1/", "/checkout/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
