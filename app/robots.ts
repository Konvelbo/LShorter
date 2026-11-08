import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lsho.cc";

  return {
    rules: [
      {
        userAgent: [
          "Twitterbot",
          "Xbot",
          "facebookexternalhit",
          "Facebot",
          "LinkedInBot",
          "WhatsApp",
          "TelegramBot",
          "Discordbot",
          "Slackbot",
          "Slack-ImgProxy",
          "Applebot",
          "Pinterest",
          "Pinterestbot",
          "Redditbot",
          "Bluesky",
          "Mastodon",
          "Embedly",
          "Iframely",
        ],
        allow: [
          "/",
          "/banners/",
          "/api/og",
          "/api/og.png",
          "/api/images/",
          "/api/v1/images/",
          "/r/",
        ],
        disallow: ["/dashboard/", "/checkout/", "/onboarding/"],
      },
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
          "/banners/",
          "/api/og",
          "/api/og.png",
          "/api/images/",
          "/api/v1/images/",
          "/r/",
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
          "/video-preview",
          "/*?*debug=*",
          "/*?*preview=*",
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
