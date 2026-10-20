import { MetadataRoute } from "next";
import { getAllDocFeatures } from "@/lib/docs-data";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lsho.cc";
  const now = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/docs`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date("2026-10-08"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date("2026-10-08"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/refund`,
      lastModified: new Date("2026-10-08"),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  const docFeatures = getAllDocFeatures();
  const docPages: MetadataRoute.Sitemap = docFeatures.map((doc) => ({
    url: `${baseUrl}/docs/${doc.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  return [...staticPages, ...docPages];
}
