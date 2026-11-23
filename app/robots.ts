import { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getSiteUrl();

  return {
    rules: [
      {
        userAgent: [
          "Twitterbot",
          "Xbot",
          "facebookexternalhit",
          "Facebot",
          "Meta-ExternalAgent",
          "Meta-ExternalFetcher",
          "LinkedInBot",
          "WhatsApp",
          "TelegramBot",
          "Discordbot",
          "Slackbot",
          "Slack-ImgProxy",
          "Slack-ImgBatcher",
          "Applebot",
          "Pinterest",
          "Pinterestbot",
          "Redditbot",
          "Bytespider",
          "Snapchat",
          "Viber",
          "Line-Poker",
          "kakaotalk-scrap",
          "MicrosoftPreview",
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
        disallow: ["/dashboard/", "/onboarding/"],
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
          "/video-preview",
          "/*?*debug=*",
          "/*?*preview=*",
        ],
      },
    ],
    sitemap: [
      `${baseUrl}/sitemap.xml`,
      `${baseUrl}/sitemap_index.xml`,
    ],
    host: baseUrl.replace(/^https?:\/\//, "").replace(/\/.*$/, ""),
  };
}
