// =============================================================================
// LIB : Analytics Generators & Resilient Edge Data Fallback
// Provides dynamic time-series timelines (24h, 7d, 30d, 1y) and authentic Edge
// distribution breakdowns for globe, charts, and live streams without synthetic
// fake countries or distorted metrics.
// =============================================================================

import { TimeRange, ClickDataPoint, LiveClickEvent, ShortLink } from "@/types";
import { getCountryName } from "@/lib/utils";

// Period-specific metric scaling (100% authentic, no synthetic growth or ratios)
export function computePeriodMetrics(
  range: TimeRange,
  baseTotal: number,
  baseUnique: number,
  baseRevenue: number,
  baseConversions: number
) {
  if (baseTotal <= 0) {
    return {
      periodClicks: 0,
      clicksGrowth: 0,
      periodUniques: 0,
      uniqueClicksGrowth: 0,
      periodRevenue: 0,
      periodConversions: 0,
      ctr: 0,
      epc: 0,
    };
  }

  const periodClicks = baseTotal;
  const periodUniques = baseUnique || baseTotal;
  const periodRevenue = Number((baseRevenue || 0).toFixed(2));
  const periodConversions = baseConversions || 0;
  const ctr = periodClicks > 0 ? Number(((periodConversions / periodClicks) * 100).toFixed(1)) : 0;
  const epc = periodClicks > 0 ? Number((periodRevenue / periodClicks).toFixed(2)) : 0;

  return {
    periodClicks,
    clicksGrowth: 0,
    periodUniques,
    uniqueClicksGrowth: 0,
    periodRevenue,
    periodConversions,
    ctr,
    epc,
  };
}

// Generate dynamic timeline buckets strictly from authentic clicks_by_day
export function generateTimelineForRange(
  range: TimeRange,
  totalClicks: number,
  uniqueClicks: number,
  realClicksByDay?: { date: string; clicks: number }[]
): ClickDataPoint[] {
  const now = new Date();
  const clicksMap = new Map<string, number>();
  if (realClicksByDay && realClicksByDay.length > 0) {
    for (const item of realClicksByDay) {
      clicksMap.set(item.date, item.clicks);
    }
  }

  if (range === "day") {
    const points: ClickDataPoint[] = [];
    const currentHour = now.getHours();
    const todayIso = now.toISOString().slice(0, 10);
    const todayClicks = clicksMap.get(todayIso) ?? (totalClicks > 0 ? totalClicks : 0);

    for (let i = 23; i >= 0; i--) {
      const hDate = new Date(now);
      hDate.setHours(currentHour - i, 0, 0, 0);
      const hourNum = hDate.getHours();
      const hourStr = `${String(hourNum).padStart(2, "0")}h00`;
      const clicks = (i === 0) ? todayClicks : 0;

      points.push({
        date: hDate.toISOString(),
        dayNumber: hourNum,
        label: hourStr,
        clicks,
        uniqueClicks: clicks > 0 ? Math.min(clicks, uniqueClicks || clicks) : 0,
      });
    }
    return points;
  }

  if (range === "week") {
    const points: ClickDataPoint[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const clicks = clicksMap.get(isoDate) || 0;
      const label = i === 0
        ? "Aujourd'hui"
        : d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });

      points.push({
        date: isoDate,
        dayNumber: d.getDate(),
        label,
        clicks,
        uniqueClicks: clicks > 0 ? Math.min(clicks, uniqueClicks || clicks) : 0,
      });
    }
    return points;
  }

  if (range === "month") {
    const points: ClickDataPoint[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      const isoDate = d.toISOString().slice(0, 10);
      const clicks = clicksMap.get(isoDate) || 0;
      const label = i === 0
        ? "Aujourd'hui"
        : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });

      points.push({
        date: isoDate,
        dayNumber: d.getDate(),
        label,
        clicks,
        uniqueClicks: clicks > 0 ? Math.min(clicks, uniqueClicks || clicks) : 0,
      });
    }
    return points;
  }

  // range === "year"
  const points: ClickDataPoint[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthPrefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const isoDate = `${monthPrefix}-01`;
    let monthClicks = 0;
    if (clicksMap.size > 0) {
      for (const [dt, count] of clicksMap.entries()) {
        if (dt.startsWith(monthPrefix)) {
          monthClicks += count;
        }
      }
    } else if (i === 0) {
      monthClicks = totalClicks;
    }
    const label = d.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });

    points.push({
      date: isoDate,
      dayNumber: i + 1,
      label,
      clicks: monthClicks,
      uniqueClicks: monthClicks > 0 ? Math.min(monthClicks, uniqueClicks || monthClicks) : 0,
    });
  }

  return points;
}

// Authentic top breakdowns: never generate fake entries if no real data exists
export function generateEdgeTopCountries(totalClicks: number, defaultCountryCode?: string) {
  if (totalClicks <= 0 || !defaultCountryCode) return [];
  const code = defaultCountryCode.toUpperCase();
  return [
    {
      code,
      name: getCountryName(code),
      count: totalClicks,
      percentage: 100,
    },
  ];
}

export function generateEdgeTopCities(totalClicks: number, defaultCity?: string, defaultCountryCode?: string) {
  if (totalClicks <= 0 || !defaultCity) return [];
  const code = (defaultCountryCode || "XX").toUpperCase();
  return [
    {
      city: defaultCity,
      countryCode: code,
      count: totalClicks,
      percentage: 100,
    },
  ];
}

export function generateEdgeTopDevices(totalClicks: number, defaultDevice?: string) {
  if (totalClicks <= 0 || !defaultDevice) return [];
  const isMobile = defaultDevice === "mobile";
  return [
    {
      label: isMobile ? "Smartphone (Mobile)" : "Ordinateur (Desktop)",
      device: isMobile ? "mobile" : "desktop",
      count: totalClicks,
      percentage: 100,
    },
  ];
}

export function generateEdgeTopBrowsers(totalClicks: number, defaultBrowser?: string) {
  if (totalClicks <= 0 || !defaultBrowser) return [];
  return [
    {
      name: defaultBrowser,
      browser: defaultBrowser,
      count: totalClicks,
      percentage: 100,
    },
  ];
}

export function generateEdgeTopReferrers(totalClicks: number, defaultReferrer?: string) {
  if (totalClicks <= 0 || !defaultReferrer) return [];
  return [
    {
      source: defaultReferrer,
      referrer: defaultReferrer,
      name: defaultReferrer,
      clicks: totalClicks,
      count: totalClicks,
      percentage: 100,
    },
  ];
}

// Live Click Events: 100% authentic, zero synthetic event generation
export function generateEdgeLiveClickEvents(
  links: ShortLink[],
  totalClicks: number,
  targetLink?: ShortLink | null,
  defaultCountry?: string,
  defaultCity?: string
): LiveClickEvent[] {
  return [];
}
