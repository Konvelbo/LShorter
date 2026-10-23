import { NextResponse } from "next/server";
import { getAllDocFeatures } from "@/lib/docs-data";

export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://lsho.cc";
  const now = new Date().toISOString();

  const staticPages = [
    { url: `${baseUrl}`, lastmod: now, changefreq: "daily", priority: "1.0" },
    { url: `${baseUrl}/pricing`, lastmod: now, changefreq: "weekly", priority: "0.9" },
    { url: `${baseUrl}/docs`, lastmod: now, changefreq: "weekly", priority: "0.9" },
    { url: `${baseUrl}/terms`, lastmod: "2026-10-08T00:00:00.000Z", changefreq: "monthly", priority: "0.4" },
    { url: `${baseUrl}/privacy`, lastmod: "2026-10-08T00:00:00.000Z", changefreq: "monthly", priority: "0.4" },
    { url: `${baseUrl}/refund`, lastmod: "2026-10-08T00:00:00.000Z", changefreq: "monthly", priority: "0.4" },
  ];

  const docFeatures = getAllDocFeatures();
  const docPages = docFeatures.map((doc) => ({
    url: `${baseUrl}/docs/${doc.slug}`,
    lastmod: now,
    changefreq: "weekly",
    priority: "0.8",
  }));

  const allPages = [...staticPages, ...docPages];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?xml-stylesheet type="text/xsl" href="/sitemap.xsl"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages
  .map(
    (page) => `  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=43200",
    },
  });
}
