import { NextResponse } from "next/server";
import { getCountryName } from "@/lib/utils";
import {
  generateTimelineForRange,
  generateEdgeTopCountries,
  generateEdgeTopCities,
  generateEdgeTopDevices,
  generateEdgeTopBrowsers,
  generateEdgeTopReferrers,
  generateEdgeLiveClickEvents,
} from "@/lib/analytics-generators";
import { parseVisitorDetails } from "@/lib/device-detection";

const WORKER_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";
const FRONTEND_SECRET =
  process.env.FRONTEND_API_SECRET || "lsh_secret_live_prod_2026";

import { getAllProtectedLinks } from "@/lib/protected-links-store";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const linkId = searchParams.get("linkId");
  const period = searchParams.get("period") || "30d";

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "User ID required" },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch links from Worker (primary) and Convex (fallback)
    const [workerLinksRes, workerAnalyticsRes] = await Promise.all([
      fetch(`${WORKER_URL}/api/v1/links?userId=${userId}`, {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
        },
        cache: "no-store",
      })
        .then((r) => (r.ok ? r.json() : { success: true, data: [] }))
        .catch(() => ({ success: true, data: [] })),
      fetch(
        `${WORKER_URL}/api/v1/analytics?userId=${userId}&period=${period}${
          linkId && linkId !== "all" ? `&linkId=${linkId}` : ""
        }`,
        {
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET,
            Authorization: `Bearer ${FRONTEND_SECRET}`,
          },
          cache: "no-store",
        }
      )
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null),
    ]);

    const workerLinks = Array.isArray(workerLinksRes?.data) ? workerLinksRes.data : [];
    const localLinks = getAllProtectedLinks().filter((l) => !userId || userId === "all" || !l.userId || l.userId === userId);
    
    // Combine worker and local links
    const seenSlugs = new Set<string>();
    const allLinks: any[] = [];
    for (const l of workerLinks) {
      seenSlugs.add((l.slug || "").toLowerCase());
      allLinks.push(l);
    }
    for (const l of localLinks) {
      if (l.slug && !seenSlugs.has(l.slug.toLowerCase())) {
        seenSlugs.add(l.slug.toLowerCase());
        allLinks.push({
          id: `link_${l.slug}`,
          slug: l.slug,
          clicks_count: l.clicksCount || 0,
          clicksCount: l.clicksCount || 0,
        });
      }
    }

    const workerStats = workerAnalyticsRes?.data;
    const workerTotalClicks = workerStats?.total_clicks || workerStats?.totalClicks || 0;
    const workerEvents = workerStats?.liveClickEvents || workerStats?.live_click_events || [];

    // If user has no links and no analytics events at all, return clean zeroed analytics
    if (allLinks.length === 0 && workerTotalClicks === 0 && workerEvents.length === 0) {
      return NextResponse.json(
        {
          success: true,
          data: {
            totalClicks: 0,
            clicksGrowth: 0,
            uniqueClicks: 0,
            uniqueClicksGrowth: 0,
            trackedRevenue: 0,
            revenueGrowth: 0,
            avgCtr: 0,
            ctrGrowth: 0,
            bounceRate: 0,
            epc: 0,
            avgEngagementTime: "0s",
            clicksByDay: [],
            topCountries: [],
            topCities: [],
            topDevices: [],
            topBrowsers: [],
            topReferrers: [],
            liveClickEvents: [],
            recentConversions: [],
          },
        },
        {
          headers: { "Cache-Control": "no-store" },
        }
      );
    }

    let targetLink: any = null;
    if (linkId && linkId !== "all") {
      targetLink = allLinks.find((l: any) => l._id === linkId || l.id === linkId || l.slug === linkId);
    }

    const sumTotalClicks = allLinks.reduce(
      (acc: number, l: any) => acc + (l.clicksCount || l.clicks_count || l.clicks || 0),
      0
    );
    const targetLinkClicks = targetLink
      ? targetLink.clicksCount || targetLink.clicks_count || targetLink.clicks || 0
      : sumTotalClicks;

    const effectiveTotalClicks = Math.max(workerTotalClicks, targetLink ? targetLinkClicks : sumTotalClicks);
    const effectiveUniqueClicks = effectiveTotalClicks > 0
      ? (workerStats?.unique_clicks ?? workerStats?.uniqueClicks ?? Math.max(1, Math.round(effectiveTotalClicks * 0.9)))
      : 0;

    // 3. Country & Geo breakdown strictly from real data
    const topCountries = (workerStats?.top_countries || workerStats?.topCountries || []).map((c: any) => {
      const code = (c.code || c.country_code || c.country || "XX").toUpperCase();
      return {
        code,
        name: c.name || c.country_name || getCountryName(code),
        count: c.count || c.clicks || 0,
        percentage: effectiveTotalClicks > 0 ? Math.round(((c.count || c.clicks || 0) / effectiveTotalClicks) * 100) : 0,
      };
    });

    // 4. Cities breakdown strictly from real data
    const topCities = (workerStats?.top_cities || workerStats?.topCities || []).map((c: any) => ({
      city: c.city || c.name || "Inconnue",
      countryCode: (c.countryCode || c.country_code || "XX").toUpperCase(),
      count: c.count || c.clicks || 0,
      percentage: effectiveTotalClicks > 0 ? Math.round(((c.count || c.clicks || 0) / effectiveTotalClicks) * 100) : 0,
    }));

    // 5. Devices breakdown strictly from real data
    const topDevices = (workerStats?.top_devices || workerStats?.topDevices || []).map((d: any) => ({
      label: d.label || d.name || d.device || "Inconnu",
      device: d.device || "desktop",
      count: d.count || d.clicks || 0,
      percentage: effectiveTotalClicks > 0 ? Math.round(((d.count || d.clicks || 0) / effectiveTotalClicks) * 100) : 0,
    }));

    // 6. Browsers breakdown strictly from real data
    const topBrowsers = (workerStats?.top_browsers || workerStats?.topBrowsers || []).map((b: any) => ({
      name: b.name || b.browser || "Inconnu",
      browser: b.browser || "Inconnu",
      count: b.count || b.clicks || 0,
      percentage: effectiveTotalClicks > 0 ? Math.round(((b.count || b.clicks || 0) / effectiveTotalClicks) * 100) : 0,
    }));

    // 7. Referrers breakdown strictly from real data
    const topReferrers = (workerStats?.top_referrers || workerStats?.topReferrers || []).map((r: any) => ({
      source: r.source || r.referrer || "Accès Direct",
      referrer: r.referrer || "Direct",
      name: r.name || r.referrer || "Direct",
      clicks: r.clicks || r.count || 0,
      count: r.count || r.clicks || 0,
      percentage: effectiveTotalClicks > 0 ? Math.round(((r.count || r.clicks || 0) / effectiveTotalClicks) * 100) : 0,
    }));

    // 8. Timeline time-series mapped from real clicks_by_day
    const timeRange = period === "1d" || period === "day" ? "day" : period === "7d" || period === "week" ? "week" : period === "365d" || period === "year" ? "year" : "month";
    const rawClicksByDay = workerStats?.clicks_by_day || workerStats?.clicksByDay || [];
    const clicksByDay = generateTimelineForRange(timeRange, effectiveTotalClicks, effectiveUniqueClicks, rawClicksByDay);

    // 9. Live Click Events strictly from real data
    const rawLiveEvents = workerStats?.live_click_events || workerStats?.liveClickEvents || [];
    const liveClickEvents = rawLiveEvents.map((ev: any) => {
      const cCode = (ev.country_code || ev.countryCode || "XX").toUpperCase();
      return {
        id: ev.id || `${Date.now()}-${Math.random()}`,
        linkId: ev.linkId || ev.link_id || ev.slug || "",
        timestamp: ev.timestamp || new Date().toISOString(),
        slug: ev.slug || "link",
        countryCode: cCode,
        countryName: getCountryName(cCode),
        city: ev.city || "—",
        device: ev.device || "desktop",
        os: ev.os || "Windows",
        browser: ev.browser || "Chrome",
        referrer: ev.referrer || "Direct",
        ipMasked: ev.ipMasked || ev.ip_masked || "•••.•••.•••",
        conversionAmount: ev.conversionAmount || ev.conversion_amount,
        customerEmail: ev.customerEmail || ev.email || ev.customer_email || undefined,
        customerName: ev.customerName || ev.customerFullName || ev.fullName || ev.name || ev.customer_name || undefined,
      };
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          totalClicks: effectiveTotalClicks,
          clicksGrowth: 0,
          uniqueClicks: effectiveUniqueClicks,
          uniqueClicksGrowth: 0,
          trackedRevenue: workerStats?.total_revenue || workerStats?.trackedRevenue || 0,
          revenueGrowth: 0,
          avgCtr: effectiveTotalClicks > 0 ? Number(((effectiveUniqueClicks / effectiveTotalClicks) * 100).toFixed(1)) : 0,
          ctrGrowth: 0,
          bounceRate: 0,
          epc: 0,
          avgEngagementTime: "0s",
          clicksByDay,
          topCountries,
          topCities,
          topDevices,
          topBrowsers,
          topReferrers,
          liveClickEvents,
          recentConversions: [],
        },
      },
      {
        headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=15" },
      }
    );
  } catch (error) {
    console.error("[Analytics API Error]:", error);
    return NextResponse.json(
      {
        success: true,
        data: {
          totalClicks: 0,
          clicksGrowth: 0,
          uniqueClicks: 0,
          uniqueClicksGrowth: 0,
          trackedRevenue: 0,
          revenueGrowth: 0,
          avgCtr: 0,
          ctrGrowth: 0,
          bounceRate: 0,
          epc: 0,
          avgEngagementTime: "0s",
          clicksByDay: [],
          topCountries: [],
          topCities: [],
          topDevices: [],
          topBrowsers: [],
          topReferrers: [],
          liveClickEvents: [],
          recentConversions: [],
        },
      },
      {
        headers: { "Cache-Control": "private, max-age=5, stale-while-revalidate=15" },
      }
    );
  }
}

