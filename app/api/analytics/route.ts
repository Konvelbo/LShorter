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
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

interface CachedAnalytics {
  data: any;
  expires: number;
}
const serverAnalyticsCache = new Map<string, CachedAnalytics>();
const CACHE_TTL_MS = 20_000; // 20s server cache to protect Cloudflare D1 from spam
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");
  const linkId = searchParams.get("linkId");
  const period = searchParams.get("period") || "30d";

  if (!userId) {
    return NextResponse.json(
      { success: false, error: "User ID required" },
      { status: 400 },
    );
  }

  // 0. Cache hit au niveau serveur Next.js pour éviter les requêtes Cloudflare concurrentes
  const cacheKey = `${userId}:${linkId || "all"}:${period}`;
  const cached = serverAnalyticsCache.get(cacheKey);
  if (cached && cached.expires > Date.now()) {
    return NextResponse.json(
      { success: true, data: cached.data },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
          "X-Server-Cache": "HIT",
        },
      },
    );
  }

  // Définition de la période et du timestamp limite
  const timeRange =
    period === "1d" || period === "day" || period === "24h"
      ? "day"
      : period === "7d" || period === "week"
        ? "week"
        : period === "365d" || period === "year" || period === "12m"
          ? "year"
          : "month";

  try {
    // 1. Récupération des analytiques depuis le Cloudflare Edge Worker
    const workerAnalyticsRes = await fetch(
      `${WORKER_URL}/api/v1/analytics?userId=${userId}&period=${period}${
        linkId && linkId !== "all" ? `&linkId=${linkId}` : ""
      }`,
      {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET || "",
          Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
        },
        cache: "no-store",
      },
    )
      .then((r) => (r.ok ? r.json() : null))
      .catch(() => null);

    const workerStats = workerAnalyticsRes?.data;
    const workerTotalClicks = Number(
      workerStats?.total_clicks || workerStats?.totalClicks || 0,
    );
    const workerEvents =
      workerStats?.liveClickEvents || workerStats?.live_click_events || [];
    const rawLiveEvents = workerEvents;

    // Si aucune donnée n'est présente dans le Worker, retourner un tableau structuré avec les 24h/7j/30j/12m réels
    if (workerTotalClicks === 0 && rawLiveEvents.length === 0) {
      const zeroTimeline = generateTimelineForRange(timeRange, 0, 0, [], []);
      const zeroData = {
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
        clicksByDay: zeroTimeline,
        topCountries: [],
        topCities: [],
        topDevices: [],
        topBrowsers: [],
        topReferrers: [],
        liveClickEvents: [],
        recentConversions: [],
      };
      serverAnalyticsCache.set(cacheKey, { data: zeroData, expires: Date.now() + CACHE_TTL_MS });
      return NextResponse.json(
        {
          success: true,
          data: zeroData,
        },
        {
          headers: { "Cache-Control": "private, max-age=15, stale-while-revalidate=30" },
        },
      );
    }

    const cutoffMs =
      timeRange === "day"
        ? Date.now() - 24 * 3600 * 1000
        : timeRange === "week"
          ? Date.now() - 7 * 86400 * 1000
          : timeRange === "year"
            ? Date.now() - 365 * 86400 * 1000
            : Date.now() - 30 * 86400 * 1000;

    const rawClicksByDay =
      workerStats?.clicks_by_day || workerStats?.clicksByDay || [];

    // Filtrage des événements en direct selon la fenêtre temporelle avec normalisation UTC
    const periodLiveEvents = rawLiveEvents.filter((ev: any) => {
      const rawTs = ev?.timestamp || ev?.created_at;
      if (!rawTs) return false;
      let tsStr = String(rawTs).trim();
      if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(tsStr)) {
        tsStr = tsStr.replace(" ", "T") + "Z";
      }
      const ts = new Date(tsStr).getTime();
      return !isNaN(ts) && ts >= cutoffMs;
    });

    // Calcul des clics effectifs via les données Worker
    let effectiveTotalClicks = 0;
    if (timeRange === "day") {
      effectiveTotalClicks =
        periodLiveEvents.length > 0
          ? periodLiveEvents.length
          : workerTotalClicks;
    } else {
      effectiveTotalClicks = Math.max(
        periodLiveEvents.length,
        workerTotalClicks,
      );
    }

    const effectiveUniqueClicks =
      effectiveTotalClicks > 0
        ? Math.min(
            effectiveTotalClicks,
            workerStats?.unique_clicks ??
              workerStats?.uniqueClicks ??
              Math.max(1, Math.round(effectiveTotalClicks * 0.9)),
          )
        : 0;

    // Génération de la chronologie (timeline)
    const initialClicksByDay = generateTimelineForRange(
      timeRange,
      effectiveTotalClicks,
      effectiveUniqueClicks,
      rawClicksByDay,
      periodLiveEvents.length > 0 ? periodLiveEvents : rawLiveEvents,
    );

    const clicksByDay = initialClicksByDay.map((pt) => ({
      ...pt,
      uniqueClicks:
        pt.clicks > 0
          ? Math.min(pt.clicks, effectiveUniqueClicks || pt.clicks)
          : 0,
    }));

    // Événements actifs pour le reporting
    const activeReportingEvents =
      timeRange === "day"
        ? periodLiveEvents
        : periodLiveEvents.length > 0
          ? periodLiveEvents
          : effectiveTotalClicks > 0
            ? rawLiveEvents
            : [];

    // Formatage des événements pour l'interface
    const liveClickEvents = activeReportingEvents.map((ev: any) => {
      const cCode = (ev.country_code || ev.countryCode || "XX").toUpperCase();
      return {
        id: ev.id || `${Date.now()}-${Math.random()}`,
        linkId: ev.linkId || ev.link_id || ev.slug || "",
        timestamp: ev.timestamp || new Date().toISOString(),
        slug: ev.slug || "link",
        countryCode: cCode,
        countryName: ev.countryName || ev.country_name || getCountryName(cCode) || cCode,
        city: ev.city && ev.city !== "Inconnue" ? ev.city : "Edge Node",
        device: ev.device || "desktop",
        os: ev.os || "Windows",
        browser: ev.browser || "Chrome",
        referrer: ev.referrer || "Direct",
        ipMasked: ev.ipMasked || ev.ip_masked || "•••.•••.•••",
        conversionAmount: ev.conversionAmount || ev.conversion_amount || 0,
        customerEmail:
          ev.customerEmail || ev.email || ev.customer_email || undefined,
        customerName:
          ev.customerName ||
          ev.customerFullName ||
          ev.fullName ||
          ev.name ||
          ev.customer_name ||
          undefined,
      };
    });

    const useFilteredBreakdowns = activeReportingEvents.length > 0;

    const topCountries =
      effectiveTotalClicks === 0
        ? []
        : useFilteredBreakdowns
          ? (
              Object.entries(
                liveClickEvents.reduce(
                  (acc: Record<string, number>, ev: any) => {
                    const c = (ev.countryCode || "XX").toUpperCase();
                    acc[c] = (acc[c] || 0) + 1;
                    return acc;
                  },
                  {},
                ),
              ) as [string, number][]
            )
              .map(([code, count]) => ({
                code,
                name: getCountryName(code) || code,
                count,
                percentage: Math.round((count / effectiveTotalClicks) * 100),
              }))
              .sort((a, b) => b.count - a.count)
          : (workerStats?.top_countries || workerStats?.topCountries || []).map(
              (c: any) => {
                const code = (
                  c.code ||
                  c.country_code ||
                  c.country ||
                  "XX"
                ).toUpperCase();
                return {
                  code,
                  name: c.name || c.country_name || getCountryName(code) || code,
                  count: c.count || c.clicks || 0,
                  percentage:
                    effectiveTotalClicks > 0
                      ? Math.round(
                          ((c.count || c.clicks || 0) / effectiveTotalClicks) *
                            100,
                        )
                      : 0,
                };
              },
            );

    const topCities =
      effectiveTotalClicks === 0
        ? []
        : useFilteredBreakdowns
          ? (
              Object.entries(
                liveClickEvents.reduce(
                  (acc: Record<string, number>, ev: any) => {
                    const city = ev.city && ev.city !== "Inconnue" ? ev.city : "Edge Node";
                    acc[city] = (acc[city] || 0) + 1;
                    return acc;
                  },
                  {},
                ),
              ) as [string, number][]
            )
              .map(([city, count]) => {
                const matchedEvent = liveClickEvents.find(
                  (e: any) => (e.city || "Edge Node") === city,
                );
                return {
                  city,
                  countryCode: (matchedEvent?.countryCode || "XX").toUpperCase(),
                  count,
                  percentage: Math.round((count / effectiveTotalClicks) * 100),
                };
              })
              .sort((a, b) => b.count - a.count)
          : (workerStats?.top_cities || workerStats?.topCities || []).map(
              (c: any) => ({
                city: c.city || c.name || "Edge Node",
                countryCode: (
                  c.countryCode ||
                  c.country_code ||
                  "XX"
                ).toUpperCase(),
                count: c.count || c.clicks || 0,
                percentage:
                  effectiveTotalClicks > 0
                    ? Math.round(
                        ((c.count || c.clicks || 0) / effectiveTotalClicks) *
                          100,
                      )
                    : 0,
              }),
            );

    const topDevices =
      effectiveTotalClicks === 0
        ? []
        : useFilteredBreakdowns
          ? (
              Object.entries(
                liveClickEvents.reduce(
                  (acc: Record<string, number>, ev: any) => {
                    const d = String(ev.device || "desktop").toLowerCase();
                    acc[d] = (acc[d] || 0) + 1;
                    return acc;
                  },
                  {},
                ),
              ) as [string, number][]
            )
              .map(([device, count]) => ({
                label: device.charAt(0).toUpperCase() + device.slice(1),
                device,
                count,
                percentage: Math.round((count / effectiveTotalClicks) * 100),
              }))
              .sort((a, b) => b.count - a.count)
          : (workerStats?.top_devices || workerStats?.topDevices || []).map(
              (d: any) => ({
                label: d.label || d.name || d.device || "Desktop",
                device: d.device || "desktop",
                count: d.count || d.clicks || 0,
                percentage:
                  effectiveTotalClicks > 0
                    ? Math.round(
                        ((d.count || d.clicks || 0) / effectiveTotalClicks) *
                          100,
                      )
                    : 0,
              }),
            );

    const topBrowsers =
      effectiveTotalClicks === 0
        ? []
        : useFilteredBreakdowns
          ? (
              Object.entries(
                liveClickEvents.reduce(
                  (acc: Record<string, number>, ev: any) => {
                    const b = String(ev.browser || "Chrome");
                    acc[b] = (acc[b] || 0) + 1;
                    return acc;
                  },
                  {},
                ),
              ) as [string, number][]
            )
              .map(([browser, count]) => ({
                name: browser,
                browser,
                count,
                percentage: Math.round((count / effectiveTotalClicks) * 100),
              }))
              .sort((a, b) => b.count - a.count)
          : (workerStats?.top_browsers || workerStats?.topBrowsers || []).map(
              (b: any) => ({
                name: b.name || b.browser || "Chrome",
                browser: b.browser || "Chrome",
                count: b.count || b.clicks || 0,
                percentage:
                  effectiveTotalClicks > 0
                    ? Math.round(
                        ((b.count || b.clicks || 0) / effectiveTotalClicks) *
                          100,
                      )
                    : 0,
              }),
            );

    const topReferrers =
      effectiveTotalClicks === 0
        ? []
        : useFilteredBreakdowns
          ? (
              Object.entries(
                liveClickEvents.reduce(
                  (acc: Record<string, number>, ev: any) => {
                    const r = String(ev.referrer || "Direct");
                    acc[r] = (acc[r] || 0) + 1;
                    return acc;
                  },
                  {},
                ),
              ) as [string, number][]
            )
              .map(([referrer, count]) => ({
                source: referrer,
                referrer,
                name: referrer,
                clicks: count,
                count,
                percentage: Math.round((count / effectiveTotalClicks) * 100),
              }))
              .sort((a, b) => b.count - a.count)
          : (workerStats?.top_referrers || workerStats?.topReferrers || []).map(
              (r: any) => ({
                source: r.source || r.referrer || "Direct",
                referrer: r.referrer || "Direct",
                name: r.name || r.referrer || "Direct",
                clicks: r.clicks || r.count || 0,
                count: r.count || r.clicks || 0,
                percentage:
                  effectiveTotalClicks > 0
                    ? Math.round(
                        ((r.count || r.clicks || 0) / effectiveTotalClicks) *
                          100,
                      )
                    : 0,
              }),
            );

    const trackedRev =
      effectiveTotalClicks === 0
        ? 0
        : useFilteredBreakdowns
          ? liveClickEvents.reduce(
              (acc: number, ev: any) => acc + Number(ev.conversionAmount || 0),
              0,
            )
          : Number(
              workerStats?.total_revenue || workerStats?.trackedRevenue || 0,
            );

    const epcVal =
      effectiveTotalClicks > 0
        ? Number((trackedRev / effectiveTotalClicks).toFixed(2))
        : 0;

    const rawConversions =
      effectiveTotalClicks === 0
        ? []
        : workerStats?.recentConversions ||
          workerStats?.recent_conversions ||
          [];

    const analyticsResult = {
      totalClicks: effectiveTotalClicks,
      clicksGrowth: 0,
      uniqueClicks: effectiveUniqueClicks,
      uniqueClicksGrowth: 0,
      trackedRevenue: trackedRev,
      revenueGrowth: 0,
      avgCtr:
        effectiveTotalClicks > 0
          ? Number(
              (
                (effectiveUniqueClicks / effectiveTotalClicks) *
                100
              ).toFixed(1),
            )
          : 0,
      ctrGrowth: 0,
      bounceRate: 0,
      epc: epcVal,
      avgEngagementTime: "0s",
      clicksByDay,
      topCountries,
      topCities,
      topDevices,
      topBrowsers,
      topReferrers,
      liveClickEvents,
      recentConversions: rawConversions,
    };

    serverAnalyticsCache.set(cacheKey, { data: analyticsResult, expires: Date.now() + CACHE_TTL_MS });

    return NextResponse.json(
      {
        success: true,
        data: analyticsResult,
      },
      {
        headers: {
          "Cache-Control": "private, max-age=15, stale-while-revalidate=30",
        },
      },
    );
  } catch (error) {
    console.error("[Analytics API Error]:", error);
    const zeroTimeline = generateTimelineForRange(timeRange, 0, 0, [], []);
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
          clicksByDay: zeroTimeline,
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
      },
    );
  }
}
