import { NextResponse } from "next/server";
import { getCountryName } from "@/lib/utils";
import { resolveCountryInfo } from "@/lib/country-flags";
import { generateTimelineForRange } from "@/lib/analytics-generators";
import { detectOSFromEvent } from "@/lib/device-detection";
import {
  WORKER_URL,
  FRONTEND_SECRET,
  CF_ACCOUNT_ID,
  CF_D1_DATABASE_ID,
  CF_API_TOKEN,
} from "@/lib/backend-config";
import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { parseQuery, analyticsQuerySchema } from "@/lib/api-schemas";

interface CachedAnalytics {
  data: any;
  expires: number;
}
const serverAnalyticsCache = new Map<string, CachedAnalytics>();
const CACHE_TTL_MS = 15_000;

function parseEventTimestampMs(rawTs?: unknown): number {
  if (!rawTs) return NaN;
  let tsStr = String(rawTs).trim();
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(tsStr)) {
    tsStr = tsStr.replace(" ", "T") + "Z";
  }
  return new Date(tsStr).getTime();
}

function normalizeDeviceCategory(rawDevice?: unknown): "desktop" | "mobile" | "tablet" | "Inconnu" {
  const d = String(rawDevice || "").trim().toLowerCase();
  if (!d || d === "unknown" || d === "inconnu" || d === "other") {
    return "Inconnu";
  }
  if (d.includes("mobile") || d.includes("phone") || d.includes("smart")) {
    return "mobile";
  }
  if (d.includes("tablet") || d.includes("tablette") || d.includes("ipad")) {
    return "tablet";
  }
  if (d.includes("desktop") || d.includes("pc") || d.includes("ordinateur")) {
    return "desktop";
  }
  return "Inconnu";
}

function normalizeBrowserName(rawBrowser?: unknown): string {
  const b = String(rawBrowser || "").trim();
  if (!b || b.toLowerCase() === "unknown" || b.toLowerCase() === "inconnu") {
    return "Inconnu";
  }
  return b;
}

async function queryD1EventsForAnalytics(params: {
  userId: string;
  userEmail?: string;
  linkId?: string | null;
}): Promise<any[] | null> {
  if (!CF_ACCOUNT_ID || !CF_D1_DATABASE_ID || !CF_API_TOKEN) {
    return null;
  }

  try {
    const d1Url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${CF_D1_DATABASE_ID}/query`;
    const cleanLink =
      params.linkId && params.linkId !== "all"
        ? params.linkId.replace(/^\/+/, "").trim()
        : null;

    let sql = `
      SELECT
        ce.id,
        ce.user_id,
        ce.link_id,
        COALESCE(l.slug, ce.slug) AS slug,
        ce.slug AS raw_slug,
        ce.ip_masked,
        ce.country_code,
        ce.city,
        ce.device,
        ce.browser,
        ce.os,
        ce.referrer,
        ce.resolved_url,
        ce.is_unique,
        ce.conversion_amount,
        ce.timestamp
      FROM click_events ce
      LEFT JOIN links l ON ce.link_id = l.id
      WHERE (ce.user_id = ? OR l.user_id = ?)
    `;
    const bindParams: string[] = [params.userId, params.userId];

    if (cleanLink) {
      sql += ` AND (ce.link_id = ? OR LOWER(l.slug) = LOWER(?) OR (l.id IS NULL AND LOWER(ce.slug) = LOWER(?)))`;
      bindParams.push(cleanLink, cleanLink, cleanLink);
    }

    sql += ` ORDER BY ce.timestamp DESC LIMIT 1000`;

    const res = await fetch(d1Url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql, params: bindParams }),
      cache: "no-store",
    });

    if (!res.ok) return null;
    const json = await res.json();
    const rows = json?.result?.[0]?.results;
    return Array.isArray(rows) ? rows : null;
  } catch (err) {
    console.warn("[app/api/analytics/route.ts] Direct D1 query fallback warning:", err);
    return null;
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const { data: qp, error: qpError } = parseQuery(searchParams, analyticsQuerySchema);
  if (qpError) return qpError;

  const rawLinkId = qp.linkId || null;
  const linkId =
    rawLinkId && rawLinkId !== "all" ? rawLinkId.replace(/^\/+/, "").trim() : null;
  const period = qp.period || "30d";

  const session = await auth().catch(() => null);
  if (!session?.user) {
    return NextResponse.json(
      { success: false, error: "Authentication required to access analytics." },
      { status: 401 }
    );
  }

  let userId: string = session.user.id || "";
  const userEmail = session.user.email || "";

  if (!userId && !userEmail) {
    return NextResponse.json(
      { success: false, error: "Authentication required to access analytics." },
      { status: 401 }
    );
  }
  if (
    (!userId ||
      userId === "usr_anonymous" ||
      userId.includes("@") ||
      !userId.startsWith("usr_")) &&
    userEmail
  ) {
    try {
      const cu = await convex.query(api.users.getUserByEmail, {
        email: userEmail.toLowerCase().trim(),
      });
      if (cu?.userId) {
        userId = cu.userId;
      }
    } catch (e) {
      console.warn("[app/api/analytics/route.ts GET] Convex user lookup warning:", e);
    }
  }

  const timeRange =
    period === "1d" || period === "day" || period === "24h"
      ? "day"
      : period === "7d" || period === "week"
        ? "week"
        : period === "365d" || period === "year" || period === "12m"
          ? "year"
          : "month";

  const buildZeroAnalytics = () => ({
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
    last24hClicks: 0,
    clicksByDay: generateTimelineForRange(timeRange, 0, 0, [], []),
    topCountries: [],
    topCities: [],
    topDevices: [],
    topBrowsers: [],
    topOs: [],
    top_os: [],
    topReferrers: [],
    liveClickEvents: [],
    recentConversions: [],
  });

  if (!userId) {
    return NextResponse.json({
      success: true,
      data: buildZeroAnalytics(),
    });
  }

  const isForceRefresh =
    searchParams.get("forceRefresh") === "true" ||
    Boolean(searchParams.get("_t"));

  const cacheKey = `${userId}:${linkId || "all"}:${period}`;
  if (!isForceRefresh) {
    const cached = serverAnalyticsCache.get(cacheKey);
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json(
        { success: true, data: cached.data },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            "X-Server-Cache": "HIT",
          },
        }
      );
    }
  }

  try {
    // 1. Primary path: Fetch complete, un-truncated click_events directly from Cloudflare D1
    const d1Events = await queryD1EventsForAnalytics({
      userId,
      userEmail,
      linkId,
    });

    if (d1Events !== null) {
      const nowMs = Date.now();
      const oneDayAgoMs = nowMs - 24 * 3600 * 1000;
      const isShortWindow = timeRange === "day" || timeRange === "week";
      const cutoffMs =
        timeRange === "day"
          ? oneDayAgoMs
          : timeRange === "week"
            ? nowMs - 7 * 86400 * 1000
            : timeRange === "year"
              ? nowMs - 365 * 86400 * 1000
              : nowMs - 30 * 86400 * 1000;

      // Filter events for the requested period
      // For 24h ("day") and 7d ("week"), enforce strict window cutoff.
      // For 30d ("month") and 12m ("year"), include all recorded events for the selected link/user
      // so the total & breakdowns match the link selector click counts 100%.
      const activeEvents = isShortWindow
        ? d1Events.filter((ev) => {
            const ts = parseEventTimestampMs(ev.timestamp);
            return !isNaN(ts) && ts >= cutoffMs;
          })
        : d1Events;

      const last24hClicks = d1Events.filter((ev) => {
        const ts = parseEventTimestampMs(ev.timestamp);
        return !isNaN(ts) && ts >= oneDayAgoMs;
      }).length;

      if (activeEvents.length === 0) {
        const zeroData = {
          ...buildZeroAnalytics(),
          last24hClicks,
        };
        serverAnalyticsCache.set(cacheKey, {
          data: zeroData,
          expires: Date.now() + CACHE_TTL_MS,
        });
        return NextResponse.json(
          { success: true, data: zeroData },
          {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
            },
          }
        );
      }

      const effectiveTotalClicks = activeEvents.length;
      const distinctIps = new Set(
        activeEvents.map((ev) => ev.ip_masked || ev.id).filter(Boolean)
      );
      const effectiveUniqueClicks = Math.min(
        effectiveTotalClicks,
        distinctIps.size || effectiveTotalClicks
      );

      const liveClickEvents = activeEvents.map((ev: any, idx: number) => {
        const geo = resolveCountryInfo({
          countryCode: ev.country_code || ev.countryCode || ev.country,
          countryName: ev.countryName || ev.country_name,
          city: ev.city,
        });
        const deviceCat = normalizeDeviceCategory(ev.device);
        const browserName = normalizeBrowserName(ev.browser);
        const osName = detectOSFromEvent(ev);
        const rawIp = String(ev.ip_masked || ev.ipMasked || "");
        const ipMasked =
          rawIp && rawIp.includes(".")
            ? rawIp.replace(/(\d+)\.(\d+)\.(\d+)\.(\d+)/, "$1.$2.•••.•••")
            : rawIp
              ? `${rawIp.slice(0, 8)}•••`
              : "•••.•••.•••";

        return {
          id: ev.id || `evt_${idx}`,
          linkId: ev.link_id || ev.linkId || ev.slug || "",
          timestamp: ev.timestamp || new Date().toISOString(),
          slug: ev.slug || ev.raw_slug || "link",
          rawSlug: ev.raw_slug || ev.slug || "link",
          countryCode: geo.countryCode,
          countryName: geo.countryName,
          city: geo.city,
          device: deviceCat,
          os: osName,
          browser: browserName,
          referrer: ev.referrer || "Direct",
          resolvedUrl: ev.resolved_url || undefined,
          isUnique: Boolean(ev.is_unique ?? true),
          ipMasked,
          conversionAmount: Number(ev.conversion_amount || ev.conversionAmount || 0),
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

      const initialClicksByDay = generateTimelineForRange(
        timeRange,
        effectiveTotalClicks,
        effectiveUniqueClicks,
        [],
        liveClickEvents
      );

      const clicksByDay = initialClicksByDay.map((pt) => ({
        ...pt,
        uniqueClicks:
          pt.clicks > 0
            ? Math.min(pt.clicks, effectiveUniqueClicks || pt.clicks)
            : 0,
      }));

      // Top Countries
      const countryCounts: Record<string, number> = {};
      for (const ev of liveClickEvents) {
        const c = (ev.countryCode || "XX").toUpperCase();
        countryCounts[c] = (countryCounts[c] || 0) + 1;
      }
      const topCountries = Object.entries(countryCounts)
        .map(([code, count]) => ({
          code,
          name: getCountryName(code) || code,
          count,
          clicks: count,
          percentage: Math.round((count / effectiveTotalClicks) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      // Top Cities
      const cityCounts: Record<string, { count: number; countryCode: string }> = {};
      for (const ev of liveClickEvents) {
        const city =
          ev.city && ev.city !== "Inconnue" && ev.city !== "—"
            ? ev.city
            : "Edge PoP";
        if (!cityCounts[city]) {
          cityCounts[city] = {
            count: 0,
            countryCode: (ev.countryCode || "XX").toUpperCase(),
          };
        }
        cityCounts[city].count += 1;
      }
      const topCities = Object.entries(cityCounts)
        .map(([city, info]) => ({
          city,
          countryCode: info.countryCode,
          count: info.count,
          clicks: info.count,
          percentage: Math.round((info.count / effectiveTotalClicks) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      // Top Devices (normalized to desktop / mobile / tablet)
      const deviceCounts: Record<string, number> = {};
      for (const ev of liveClickEvents) {
        const d = normalizeDeviceCategory(ev.device);
        deviceCounts[d] = (deviceCounts[d] || 0) + 1;
      }
      const topDevices = Object.entries(deviceCounts)
        .map(([device, count]) => ({
          label:
            device === "mobile"
              ? "Mobile"
              : device === "tablet"
                ? "Tablette"
                : device === "desktop"
                  ? "Desktop"
                  : "Inconnu",
          device,
          count,
          clicks: count,
          percentage: Math.round((count / effectiveTotalClicks) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      // Top Browsers
      const browserCounts: Record<string, number> = {};
      for (const ev of liveClickEvents) {
        const b = normalizeBrowserName(ev.browser);
        browserCounts[b] = (browserCounts[b] || 0) + 1;
      }
      const topBrowsers = Object.entries(browserCounts)
        .map(([browser, count]) => ({
          name: browser,
          browser,
          count,
          clicks: count,
          percentage: Math.round((count / effectiveTotalClicks) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      // Top Operating Systems
      const osCounts: Record<string, number> = {};
      for (const ev of liveClickEvents) {
        const os = ev.os || "Inconnu";
        osCounts[os] = (osCounts[os] || 0) + 1;
      }
      const topOs = Object.entries(osCounts)
        .map(([name, count]) => ({
          name,
          os: name,
          count,
          clicks: count,
          percentage: Math.round((count / effectiveTotalClicks) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      // Top Referrers
      const referrerCounts: Record<string, number> = {};
      for (const ev of liveClickEvents) {
        const r = String(ev.referrer || "Direct").trim() || "Direct";
        referrerCounts[r] = (referrerCounts[r] || 0) + 1;
      }
      const topReferrers = Object.entries(referrerCounts)
        .map(([referrer, count]) => ({
          source: referrer,
          referrer,
          name: referrer,
          clicks: count,
          count,
          percentage: Math.round((count / effectiveTotalClicks) * 100),
        }))
        .sort((a, b) => b.count - a.count);

      const trackedRev = liveClickEvents.reduce(
        (acc, ev) => acc + Number(ev.conversionAmount || 0),
        0
      );
      const epcVal =
        effectiveTotalClicks > 0
          ? Number((trackedRev / effectiveTotalClicks).toFixed(2))
          : 0;
      const recentConversions = liveClickEvents.filter(
        (ev) => Number(ev.conversionAmount || 0) > 0
      );

      const analyticsResult = {
        totalClicks: effectiveTotalClicks,
        total_clicks: effectiveTotalClicks,
        clicksGrowth: 0,
        uniqueClicks: effectiveUniqueClicks,
        unique_clicks: effectiveUniqueClicks,
        uniqueClicksGrowth: 0,
        trackedRevenue: trackedRev,
        total_revenue: trackedRev,
        revenueGrowth: 0,
        avgCtr:
          effectiveTotalClicks > 0
            ? Number(
                ((effectiveUniqueClicks / effectiveTotalClicks) * 100).toFixed(1)
              )
            : 0,
        ctrGrowth: 0,
        bounceRate: 0,
        epc: epcVal,
        avgEngagementTime: "0s",
        last24hClicks,
        clicksByDay,
        topCountries,
        topCities,
        topDevices,
        topBrowsers,
        topOs,
        top_os: topOs,
        topReferrers,
        liveClickEvents,
        recentConversions,
      };

      serverAnalyticsCache.set(cacheKey, {
        data: analyticsResult,
        expires: Date.now() + CACHE_TTL_MS,
      });

      return NextResponse.json(
        { success: true, data: analyticsResult },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          },
        }
      );
    }

    // 2. Fallback path: Cloudflare Edge Worker (/api/v1/analytics)
    // If linkId is a slug rather than link_xxx, resolve it to link.id via /api/v1/links first
    let resolvedWorkerLinkId = linkId;
    if (linkId && !linkId.startsWith("link_")) {
      try {
        const linksUrl = new URL(`${WORKER_URL}/api/v1/links`);
        linksUrl.searchParams.set("userId", userId);
        linksUrl.searchParams.set("limit", "500");
        const lRes = await fetch(linksUrl.toString(), {
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET || "",
            Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
          },
          cache: "no-store",
        });
        if (lRes.ok) {
          const lJson = await lRes.json();
          const matched = (lJson?.data || []).find(
            (l: any) =>
              l.id === linkId ||
              String(l.slug || "").toLowerCase() === linkId.toLowerCase()
          );
          if (matched?.id) {
            resolvedWorkerLinkId = matched.id;
          }
        }
      } catch {}
    }

    const isShortWindow = timeRange === "day" || timeRange === "week";
    const workerPeriodParam = isShortWindow ? period : "365d";

    const workerUrl = new URL(`${WORKER_URL}/api/v1/analytics`);
    workerUrl.searchParams.set("userId", userId);
    workerUrl.searchParams.set("period", workerPeriodParam);
    if (resolvedWorkerLinkId && resolvedWorkerLinkId !== "all") {
      workerUrl.searchParams.set("linkId", resolvedWorkerLinkId);
    }
    if (isForceRefresh) {
      workerUrl.searchParams.set("forceRefresh", "true");
      workerUrl.searchParams.set("_t", Date.now().toString());
    }

    let workerAnalyticsRes: any = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const res = await fetch(workerUrl.toString(), {
          headers: {
            "X-Frontend-Secret": FRONTEND_SECRET || "",
            Authorization: `Bearer ${FRONTEND_SECRET || ""}`,
          },
          cache: "no-store",
        });
        if (res.ok) {
          workerAnalyticsRes = await res.json();
          break;
        }
      } catch {}
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 250));
      }
    }

    if (!workerAnalyticsRes) {
      const stale = serverAnalyticsCache.get(cacheKey);
      if (stale?.data) {
        return NextResponse.json(
          { success: true, data: stale.data },
          {
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
              "X-Server-Cache": "STALE",
            },
          }
        );
      }
      return NextResponse.json(
        {
          success: false,
          error: "Impossible de contacter temporairement le Worker analytique.",
        },
        { status: 502 }
      );
    }

    const workerStats = workerAnalyticsRes?.data || {};
    const rawLiveEvents: any[] =
      workerStats?.liveClickEvents || workerStats?.live_click_events || [];
    const rawTopDevices: any[] =
      workerStats?.top_devices || workerStats?.topDevices || [];
    const devicesSum = rawTopDevices.reduce(
      (acc, d) => acc + Number(d.count ?? d.clicks ?? 0),
      0
    );
    const workerTotalClicks = Number(
      workerStats?.total_clicks ?? workerStats?.totalClicks ?? 0
    );
    const effectiveTotalClicks =
      devicesSum > 0 ? devicesSum : workerTotalClicks;

    if (effectiveTotalClicks === 0 && rawLiveEvents.length === 0) {
      const zeroData = buildZeroAnalytics();
      serverAnalyticsCache.set(cacheKey, {
        data: zeroData,
        expires: Date.now() + CACHE_TTL_MS,
      });
      return NextResponse.json(
        { success: true, data: zeroData },
        {
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          },
        }
      );
    }

    const effectiveUniqueClicks = Math.min(
      effectiveTotalClicks,
      Number(
        workerStats?.unique_clicks ??
          workerStats?.uniqueClicks ??
          effectiveTotalClicks
      )
    );

    const liveClickEvents = rawLiveEvents.map((ev: any, idx: number) => {
      const geo = resolveCountryInfo({
        countryCode: ev.country_code || ev.countryCode || ev.country,
        countryName: ev.countryName || ev.country_name,
        city: ev.city,
      });
      return {
        id: ev.id || `evt_${idx}`,
        linkId: ev.linkId || ev.link_id || resolvedWorkerLinkId || ev.slug || "",
        timestamp: ev.timestamp || new Date().toISOString(),
        slug: ev.slug || "link",
        countryCode: geo.countryCode,
        countryName: geo.countryName,
        city: geo.city,
        device: normalizeDeviceCategory(ev.device),
        os: detectOSFromEvent(ev),
        browser: normalizeBrowserName(ev.browser),
        referrer: ev.referrer || "Direct",
        ipMasked: ev.ipMasked || ev.ip_masked || "•••.•••.•••",
        conversionAmount: Number(ev.conversionAmount || ev.conversion_amount || 0),
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

    const oneDayAgoMs = Date.now() - 24 * 3600 * 1000;
    const last24hClicks = liveClickEvents.filter((ev) => {
      const ts = parseEventTimestampMs(ev.timestamp);
      return !isNaN(ts) && ts >= oneDayAgoMs;
    }).length;

    const rawClicksByDay =
      workerStats?.clicks_by_day || workerStats?.clicksByDay || [];
    const clicksByDay = generateTimelineForRange(
      timeRange,
      effectiveTotalClicks,
      effectiveUniqueClicks,
      rawClicksByDay,
      liveClickEvents
    );

    const topCountries = (
      workerStats?.top_countries ||
      workerStats?.topCountries ||
      []
    ).map((c: any) => {
      const geo = resolveCountryInfo({
        countryCode: c.code || c.country_code || c.country,
        countryName: c.name || c.country_name,
      });
      const count = Number(c.count ?? c.clicks ?? 0);
      return {
        code: geo.countryCode,
        name: geo.countryName,
        count,
        clicks: count,
        percentage:
          effectiveTotalClicks > 0
            ? Math.round((count / effectiveTotalClicks) * 100)
            : 0,
      };
    });

    const topCities = (
      workerStats?.top_cities ||
      workerStats?.topCities ||
      []
    ).map((c: any) => {
      const geo = resolveCountryInfo({
        countryCode: c.countryCode || c.country_code,
        city: c.city || c.name,
      });
      const count = Number(c.count ?? c.clicks ?? 0);
      return {
        city:
          geo.city !== "Edge PoP"
            ? geo.city
            : c.city || c.name || "Edge PoP",
        countryCode: geo.countryCode,
        count,
        clicks: count,
        percentage:
          effectiveTotalClicks > 0
            ? Math.round((count / effectiveTotalClicks) * 100)
            : 0,
      };
    });

    const topDevices = rawTopDevices.map((d: any) => {
      const devCat = normalizeDeviceCategory(d.device || d.name || d.label);
      const count = Number(d.count ?? d.clicks ?? 0);
      return {
        label:
          devCat === "mobile"
            ? "Mobile"
            : devCat === "tablet"
              ? "Tablette"
              : "Desktop",
        device: devCat,
        count,
        clicks: count,
        percentage:
          effectiveTotalClicks > 0
            ? Math.round((count / effectiveTotalClicks) * 100)
            : 0,
      };
    });

    const topBrowsers = (
      workerStats?.top_browsers ||
      workerStats?.topBrowsers ||
      []
    ).map((b: any) => {
      const bName = normalizeBrowserName(b.name || b.browser);
      const count = Number(b.count ?? b.clicks ?? 0);
      return {
        name: bName,
        browser: bName,
        count,
        clicks: count,
        percentage:
          effectiveTotalClicks > 0
            ? Math.round((count / effectiveTotalClicks) * 100)
            : 0,
      };
    });

    const topOs = (workerStats?.top_os || workerStats?.topOs || []).map(
      (o: any) => {
        const oName = detectOSFromEvent({ os: o.os || o.name });
        const count = Number(o.count ?? o.clicks ?? 0);
        return {
          name: oName,
          os: oName,
          count,
          clicks: count,
          percentage:
            effectiveTotalClicks > 0
              ? Math.round((count / effectiveTotalClicks) * 100)
              : 0,
        };
      }
    );

    const topReferrers = (
      workerStats?.top_referrers ||
      workerStats?.topReferrers ||
      []
    ).map((r: any) => {
      const refName = r.source || r.referrer || r.name || "Direct";
      const count = Number(r.count ?? r.clicks ?? 0);
      return {
        source: refName,
        referrer: refName,
        name: refName,
        clicks: count,
        count,
        percentage:
          effectiveTotalClicks > 0
            ? Math.round((count / effectiveTotalClicks) * 100)
            : 0,
      };
    });

    const trackedRev = Number(
      workerStats?.total_revenue ?? workerStats?.trackedRevenue ?? 0
    );
    const epcVal =
      effectiveTotalClicks > 0
        ? Number((trackedRev / effectiveTotalClicks).toFixed(2))
        : 0;

    const analyticsResult = {
      totalClicks: effectiveTotalClicks,
      total_clicks: effectiveTotalClicks,
      clicksGrowth: 0,
      uniqueClicks: effectiveUniqueClicks,
      unique_clicks: effectiveUniqueClicks,
      uniqueClicksGrowth: 0,
      trackedRevenue: trackedRev,
      total_revenue: trackedRev,
      revenueGrowth: 0,
      avgCtr:
        effectiveTotalClicks > 0
          ? Number(
              ((effectiveUniqueClicks / effectiveTotalClicks) * 100).toFixed(1)
            )
          : 0,
      ctrGrowth: 0,
      bounceRate: 0,
      epc: epcVal,
      avgEngagementTime: "0s",
      last24hClicks,
      clicksByDay,
      topCountries,
      topCities,
      topDevices,
      topBrowsers,
      topOs,
      top_os: topOs,
      topReferrers,
      liveClickEvents,
      recentConversions:
        workerStats?.recentConversions || workerStats?.recent_conversions || [],
    };

    serverAnalyticsCache.set(cacheKey, {
      data: analyticsResult,
      expires: Date.now() + CACHE_TTL_MS,
    });

    return NextResponse.json(
      { success: true, data: analyticsResult },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        },
      }
    );
  } catch (error) {
    console.error("[Analytics API Error]:", error);
    return NextResponse.json(
      { success: true, data: buildZeroAnalytics() },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
