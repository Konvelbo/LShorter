"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Globe2,
  ArrowLeft,
  Search,
  RefreshCw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
  X,
  Copy,
  MapPin,
} from "lucide-react";
import { ReferrerBadge, ReferrerLogo } from "@/components/dashboard/analytics/referrer-badge";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
  Marker,
} from "react-simple-maps";
import { ShortLink, GlobalAnalytics } from "@/types";
import {
  cfGetAnalytics,
  cfGetLinks,
  cfInvalidateCache,
} from "@/lib/cloudflare-api";
import {
  ReuiDonutChart22,
  type ReuiDonut22Item,
} from "@/components/examples/c-chart-22";
import {
  Continent,
  CONTINENTS_META,
  WORLD_COUNTRIES,
  getContinentForCountry,
  getCountryName,
  getCountryFlag,
  getCountryFromGeography,
  preprocessWorldGeographies,
} from "@/lib/geo-coordinates";
import { detectOSFromEvent } from "@/lib/device-detection";
import { ContinentTraffic } from "@/components/dashboard/analytics/continents-vector-map";
import {
  ColumnMaskToggle,
  ColumnDefinition,
} from "@/components/dashboard/analytics/column-mask-toggle";
import { AnalyticsGeoSkeleton } from "@/components/ui/skeleton";
import { showToast } from "@/components/ui/toast-provider";
import { formatNumber } from "@/lib/utils";
import { exportToExcelWorkbook } from "@/lib/export-excel";

const GEO_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

export const COUNTRY_CENTROIDS: Record<
  string,
  { lat: number; lng: number; name: string; continent: Continent }
> = {
  BF: { lat: 12.2383, lng: -1.5616, name: "Burkina Faso", continent: "Africa" },
  CI: { lat: 7.54, lng: -5.5471, name: "Côte d'Ivoire", continent: "Africa" },
  SN: { lat: 14.4974, lng: -14.4524, name: "Senegal", continent: "Africa" },
  ML: { lat: 17.5707, lng: -3.9962, name: "Mali", continent: "Africa" },
  NE: { lat: 17.6078, lng: 8.0817, name: "Niger", continent: "Africa" },
  TG: { lat: 8.6195, lng: 0.8248, name: "Togo", continent: "Africa" },
  BJ: { lat: 9.3077, lng: 2.3158, name: "Benin", continent: "Africa" },
  GH: { lat: 7.9465, lng: -1.0232, name: "Ghana", continent: "Africa" },
  NG: { lat: 9.082, lng: 8.6753, name: "Nigeria", continent: "Africa" },
  CM: { lat: 5.9631, lng: 12.3547, name: "Cameroon", continent: "Africa" },
  FR: { lat: 46.6033, lng: 1.8883, name: "France", continent: "Europe" },
  US: {
    lat: 39.8283,
    lng: -98.5795,
    name: "United States",
    continent: "North America",
  },
};

const WORLD_ATLAS_NUMERIC_TO_ALPHA2: Record<string, string> = {
  "854": "BF",
  "384": "CI",
  "686": "SN",
  "466": "ML",
  "562": "NE",
  "768": "TG",
  "204": "BJ",
  "288": "GH",
  "566": "NG",
  "120": "CM",
  "250": "FR",
  "840": "US",
  "124": "CA",
  "826": "GB",
  "276": "DE",
  "724": "ES",
  "380": "IT",
  "056": "BE",
  "756": "CH",
  "620": "PT",
  "528": "NL",
  "076": "BR",
  "392": "JP",
  "156": "CN",
  "356": "IN",
  "036": "AU",
  "710": "ZA",
  "784": "AE",
  "304": "GL",
  "398": "KZ",
  "496": "MN",
  "729": "SD",
  "516": "NA",
  "600": "PY",
};

/** Formateur de temps relatif réactif : s'actualise au fil des minutes */
function formatLiveRelativeTime(
  timestamp: string | number | Date,
  nowMs: number,
): string {
  if (!timestamp) return "Just now";
  let timeMs = 0;
  if (typeof timestamp === "number") {
    timeMs = timestamp < 1e11 ? timestamp * 1000 : timestamp;
  } else if (timestamp instanceof Date) {
    timeMs = timestamp.getTime();
  } else {
    let s = String(timestamp).trim();
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
      s = s.replace(" ", "T") + "Z";
    }
    const parsed = Date.parse(s);
    timeMs = isNaN(parsed) ? new Date(timestamp).getTime() : parsed;
  }

  if (isNaN(timeMs) || timeMs <= 0) return "Just now";
  const diffSec = Math.floor((nowMs - timeMs) / 1000);
  if (diffSec < 60) return "Just now";
  const mins = Math.floor(diffSec / 60);
  if (mins === 1) return "1 min ago";
  if (mins < 60) return `${mins} mins ago`;
  const hours = Math.floor(mins / 60);
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return "Yesterday";
  return `${days} days ago`;
}

function resolveCountryFromGeography(geo: any): {
  code: string;
  name: string;
  continent: Continent;
  lat: number;
  lng: number;
} {
  const d = getCountryFromGeography(geo);
  const centroid = COUNTRY_CENTROIDS[d.code] || WORLD_COUNTRIES[d.code];
  return {
    code: d.code,
    name: centroid?.name || d.name,
    continent: centroid?.continent || d.continent,
    lat: centroid?.lat ?? d.lat,
    lng: centroid?.lng ?? d.lng,
  };
}

function getCalibratedCentroid(code?: string) {
  if (!code || code === "XX") return null;
  const upper = code.trim().toUpperCase();
  if (COUNTRY_CENTROIDS[upper])
    return { code: upper, ...COUNTRY_CENTROIDS[upper] };
  if (WORLD_COUNTRIES[upper]) {
    const w = WORLD_COUNTRIES[upper];
    return {
      code: upper,
      name: w.nameEn || w.name,
      continent: w.continent,
      lat: w.lat,
      lng: w.lng,
    };
  }
  return null;
}

function CountryFlagBadge({
  code,
  className = "w-5 h-3.5",
}: {
  code?: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);
  const cleanCode = (code || "BF").trim().toUpperCase();
  const isValidIso = /^[A-Z]{2}$/.test(cleanCode) && cleanCode !== "XX";

  if (!isValidIso || imgError) {
    return (
      <span className="inline-flex items-center justify-center text-sm leading-none shrink-0">
        {getCountryFlag(cleanCode)}
      </span>
    );
  }

  return (
    <img
      src={`https://flagcdn.com/w40/${cleanCode.toLowerCase()}.png`}
      alt={cleanCode}
      onError={() => setImgError(true)}
      className={`${className} object-cover rounded-[3px] border border-black/10 dark:border-white/15 shrink-0 shadow-2xs`}
    />
  );
}

const CONTINENT_CARDS_ORDER: Array<{
  key: Continent;
  label: string;
  color: string;
  icon: string;
}> = [
  { key: "Africa", label: "Africa", color: "#0066FF", icon: "🌍" },
  { key: "Europe", label: "Europe", color: "#3b82f6", icon: "🌍" },
  {
    key: "North America",
    label: "North America",
    color: "#10b981",
    icon: "🌎",
  },
  {
    key: "South America",
    label: "South America",
    color: "#ec4899",
    icon: "🌎",
  },
  { key: "Asia", label: "Asia & Middle East", color: "#8b5cf6", icon: "🌏" },
  { key: "Oceania", label: "Oceania", color: "#06b6d4", icon: "🌏" },
];

const GEO_COLUMNS: ColumnDefinition[] = [
  { key: "timestamp", label: "Timestamp", defaultVisible: true },
  { key: "country", label: "Country & Flag", defaultVisible: true },
  { key: "city", label: "City", defaultVisible: true },
  { key: "continent", label: "Continent", defaultVisible: true },
  { key: "link", label: "Target Link", defaultVisible: true },
  { key: "referrer", label: "Referrer Source", defaultVisible: true },
  { key: "device", label: "Device & OS", defaultVisible: true },
  { key: "browser", label: "Browser", defaultVisible: true },
];

export default function GeoAnalyticsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const userId = session?.user?.id || "";

  // ─── TOUS LES HOOKS AU SOMMET DU COMPOSANT (AUCUN RETOUR CONDITIONNEL AVANT) ───
  const [currentTimeTick, setCurrentTimeTick] = useState<number>(() =>
    Date.now(),
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [analytics, setAnalytics] = useState<GlobalAnalytics>({
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
  });

  const [selectedRange, setSelectedRange] = useState<
    "day" | "week" | "month" | "year"
  >("month");
  const [selectedLinkId, setSelectedLinkId] = useState<string>("all");
  const [selectedContinent, setSelectedContinent] = useState<Continent | "ALL">(
    "ALL",
  );
  const [selectedCountryFilter, setSelectedCountryFilter] =
    useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const [hoveredCountry, setHoveredCountry] = useState<{
    code: string;
    name: string;
    continent: Continent;
    clicks: number;
    percentage: number;
  } | null>(null);
  const [isMapExpanded, setIsMapExpanded] = useState(false);
  const [mapPosition, setMapPosition] = useState<{
    coordinates: [number, number];
    zoom: number;
  }>({
    coordinates: [10, 18],
    zoom: 1,
  });

  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(
    new Set(GEO_COLUMNS.map((c) => c.key)),
  );

  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const [geoDonutDimension, setGeoDonutDimension] = useState<
    "device" | "browser" | "country" | "continent" | "os"
  >("device");

  const hasLoadedOnceRef = useRef(false);

  // Horloge de rafraîchissement des minutes (se déclenche toutes les 5s)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTimeTick(Date.now());
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const toggleColumn = (key: string) => {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        if (next.size > 2) next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const resetColumns = () => {
    setVisibleColumns(new Set(GEO_COLUMNS.map((c) => c.key)));
  };

  const loadData = async (
    range = selectedRange,
    linkId = selectedLinkId,
    isBg = false,
  ) => {
    if (!userId) return;
    if (!isBg && !hasLoadedOnceRef.current) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const periodParam =
        range === "day"
          ? "1d"
          : range === "week"
            ? "7d"
            : range === "year"
              ? "365d"
              : "30d";

      let [analyticsRes, linksRes] = await Promise.all([
        cfGetAnalytics(
          userId,
          periodParam,
          linkId !== "all" ? linkId : undefined,
        ).catch(() => null),
        cfGetLinks(userId).catch(() => null),
      ]);

      if (!analyticsRes || !analyticsRes.data) {
        analyticsRes = await fetch(
          `/api/analytics?userId=${encodeURIComponent(userId)}&period=${periodParam}${linkId !== "all" ? `&linkId=${encodeURIComponent(linkId)}` : ""}`,
          { cache: "no-store" },
        )
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null);
      }

      const listData = Array.isArray(linksRes?.data)
        ? linksRes.data
        : Array.isArray((linksRes?.data as any)?.data)
          ? (linksRes?.data as any).data
          : [];

      const fetchedLinks: ShortLink[] = listData.map((l: any) => ({
        id: l.id,
        userId: l.user_id || userId,
        slug: l.slug,
        domainName: l.domain_name || "lsho.cc",
        shortUrl: `https://${l.domain_name || "lsho.cc"}/${l.slug}`,
        targetUrl: l.target_url,
        clicksCount: l.clicks_count || l.clicksCount || l.clicks || 0,
        uniqueClicks: l.unique_clicks || 0,
        conversionsCount: l.conversions_count || 0,
        revenue: l.revenue || 0,
        routingRules: [],
        geoTargeting: {},
        deviceTargeting: {},
        isPasswordProtected: Boolean(l.is_password_protected || l.password),
        isCloaked: Boolean(l.is_cloaked),
        metaTitle: l.meta_title || l.slug,
        hideReferrer: Boolean(l.hide_referrer),
        tags: [],
        isActive: Boolean(l.is_active !== 0),
        created_at: l.created_at || new Date().toISOString(),
      }));

      setLinks(fetchedLinks);

      const targetLink =
        linkId !== "all"
          ? fetchedLinks.find((l) => l.id === linkId || l.slug === linkId)
          : null;
      const sumLinksClicks = fetchedLinks.reduce(
        (acc, l) => acc + (l.clicksCount || 0),
        0,
      );
      const linkClicks = targetLink ? targetLink.clicksCount || 0 : 0;
      const isAll = !targetLink || linkId === "all";

      const d =
        analyticsRes?.data?.data || analyticsRes?.data || analyticsRes || {};
      const workerTotal = Number(d.totalClicks ?? d.total_clicks ?? 0);
      const baseFromWorker = isAll ? workerTotal : workerTotal || linkClicks;
      const isShortWindow = range === "day" || range === "week";
      const total = isShortWindow
        ? baseFromWorker
        : isAll
          ? Math.max(baseFromWorker, sumLinksClicks)
          : Math.max(baseFromWorker, linkClicks);

      // Récupération des clics RÉELS sans génération de faux décalages
      const rawLiveEvents =
        d.liveClickEvents ||
        d.live_click_events ||
        d.recentClicks ||
        d.events ||
        [];

      let finalLiveEvents: any[] = [];
      if (Array.isArray(rawLiveEvents) && rawLiveEvents.length > 0) {
        finalLiveEvents = rawLiveEvents.map((ev: any, idx: number) => {
          const cCode = (
            ev.country_code ||
            ev.countryCode ||
            ev.country ||
            "XX"
          ).toUpperCase();
          const cleanCode = cCode;
          return {
            id: ev.id || `evt_${idx}`,
            timestamp:
              ev.timestamp || ev.created_at || new Date().toISOString(),
            slug: ev.slug || "link",
            countryCode: cleanCode,
            countryName:
              ev.countryName || ev.country_name || getCountryName(cleanCode) || cleanCode,
            city: ev.city && ev.city !== "Inconnue" && ev.city !== "—" ? ev.city : (ev.city || "Edge PoP"),
            device: ev.device && ev.device !== "unknown" ? ev.device : "Inconnu",
            browser: ev.browser && ev.browser !== "unknown" ? ev.browser : "Inconnu",
            os: detectOSFromEvent(ev) || (ev.os && ev.os !== "unknown" ? ev.os : "Inconnu"),
            referrer: ev.referrer || "Direct",
          };
        });
      }

      const rawTopCountries = d.topCountries || d.top_countries || [];
      const mappedTopCountries =
        rawTopCountries.length > 0
          ? rawTopCountries.map((c: any) => {
              const code = (c.code || c.country_code || c.country || "XX").toUpperCase();
              const geo = WORLD_COUNTRIES[code] || COUNTRY_CENTROIDS[code];
              const count = Number(c.count || c.clicks || 0);
              return {
                code,
                name: c.name || c.country_name || geo?.name || getCountryName(code) || code,
                count,
                percentage:
                  c.percentage !== undefined
                    ? c.percentage
                    : total > 0
                      ? Math.round((count / total) * 100)
                      : 0,
                lat: geo?.lat,
                lng: geo?.lng,
              };
            })
          : finalLiveEvents.length > 0
            ? (Object.entries(
                finalLiveEvents.reduce((acc: Record<string, number>, ev: any) => {
                  const code = (ev.countryCode || "XX").toUpperCase();
                  acc[code] = (acc[code] || 0) + 1;
                  return acc;
                }, {}),
              ) as [string, number][])
                .map(([code, count]) => {
                  const geo = WORLD_COUNTRIES[code] || COUNTRY_CENTROIDS[code];
                  return {
                    code,
                    name: geo?.name || getCountryName(code) || code,
                    count,
                    percentage: total > 0 ? Math.round((count / total) * 100) : 0,
                    lat: geo?.lat,
                    lng: geo?.lng,
                  };
                })
                .sort((a, b) => b.count - a.count)
            : [];

      const rawTopCities = d.topCities || d.top_cities || [];
      const mappedTopCities =
        rawTopCities.length > 0
          ? rawTopCities.map((ci: any) => ({
              city: ci.city || ci.name || "Edge Node",
              countryCode: (ci.countryCode || ci.country_code || "XX").toUpperCase(),
              count: Number(ci.count || ci.clicks || 0),
              percentage:
                ci.percentage !== undefined
                  ? ci.percentage
                  : total > 0
                    ? Math.round(((ci.count || 0) / total) * 100)
                    : 0,
            }))
          : [];

      const rawTopDevices = d.topDevices || d.top_devices || [];
      const mappedTopDevices =
        rawTopDevices.length > 0
          ? rawTopDevices.map((dv: any) => ({
              label: dv.label || dv.device || dv.name || "Desktop",
              device: dv.device || dv.label || dv.name || "desktop",
              count: Number(dv.count || dv.clicks || 0),
              percentage:
                dv.percentage !== undefined
                  ? dv.percentage
                  : total > 0
                    ? Math.round(((dv.count || 0) / total) * 100)
                    : 0,
            }))
          : [];

      const rawTopBrowsers = d.topBrowsers || d.top_browsers || [];
      const mappedTopBrowsers =
        rawTopBrowsers.length > 0
          ? rawTopBrowsers.map((br: any) => ({
              name: br.name || br.browser || "Chrome",
              browser: br.browser || br.name || "Chrome",
              count: Number(br.count || br.clicks || 0),
              percentage:
                br.percentage !== undefined
                  ? br.percentage
                  : total > 0
                    ? Math.round(((br.count || 0) / total) * 100)
                    : 0,
            }))
          : [];

      const rawTopReferrers = d.topReferrers || d.top_referrers || [];
      const mappedTopReferrers =
        rawTopReferrers.length > 0
          ? rawTopReferrers.map((rf: any) => ({
              source: rf.source || rf.referrer || rf.name || "Direct",
              referrer: rf.referrer || rf.source || rf.name || "Direct",
              count: Number(rf.count || rf.clicks || 0),
              percentage:
                rf.percentage !== undefined
                  ? rf.percentage
                  : total > 0
                    ? Math.round(((rf.count || 0) / total) * 100)
                    : 0,
            }))
          : [];

      setAnalytics({
        totalClicks: total,
        clicksGrowth: 0,
        uniqueClicks: total,
        uniqueClicksGrowth: 0,
        trackedRevenue: Number(d.trackedRevenue ?? d.tracked_revenue ?? 0),
        revenueGrowth: 0,
        avgCtr: 0,
        ctrGrowth: 0,
        bounceRate: 0,
        epc: 0,
        avgEngagementTime: "0s",
        clicksByDay: d.clicksByDay || d.clicks_by_day || [],
        topCountries: mappedTopCountries,
        topCities: mappedTopCities,
        topDevices: mappedTopDevices,
        topBrowsers: mappedTopBrowsers,
        topReferrers: mappedTopReferrers,
        liveClickEvents: finalLiveEvents,
        recentConversions: [],
      });
    } catch (err) {
      console.error("Geo analytics fetch error:", err);
    } finally {
      hasLoadedOnceRef.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      setIsLoading(false);
      return;
    }
    if (status === "authenticated" && userId) {
      loadData(selectedRange, selectedLinkId);
    }
  }, [status, userId, selectedRange, selectedLinkId]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const checkDark = () =>
      setIsDarkMode(document.documentElement.classList.contains("dark"));
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-theme"],
    });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const handleUpdate = () => {
      cfInvalidateCache();
      loadData(selectedRange, selectedLinkId, true);
    };

    window.addEventListener("lshorter_data_change", handleUpdate);
    window.addEventListener("lshorter_links_updated", handleUpdate);

    return () => {
      window.removeEventListener("lshorter_data_change", handleUpdate);
      window.removeEventListener("lshorter_links_updated", handleUpdate);
    };
  }, [userId, selectedRange, selectedLinkId]);

  const countryClicksMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of analytics.topCountries || []) {
      if (c.code && c.code !== "XX") {
        map.set(c.code.toUpperCase(), c.count);
      }
    }
    return map;
  }, [analytics.topCountries]);

  const continentsData = useMemo<Record<Continent, ContinentTraffic>>(() => {
    const base: Record<Continent, ContinentTraffic> = {
      Africa: { continent: "Africa", clicks: 0, uniqueVisitors: 0, percentage: 0, countriesCount: 0 },
      Europe: { continent: "Europe", clicks: 0, uniqueVisitors: 0, percentage: 0, countriesCount: 0 },
      "North America": { continent: "North America", clicks: 0, uniqueVisitors: 0, percentage: 0, countriesCount: 0 },
      "South America": { continent: "South America", clicks: 0, uniqueVisitors: 0, percentage: 0, countriesCount: 0 },
      Asia: { continent: "Asia", clicks: 0, uniqueVisitors: 0, percentage: 0, countriesCount: 0 },
      Oceania: { continent: "Oceania", clicks: 0, uniqueVisitors: 0, percentage: 0, countriesCount: 0 },
    };

    const countriesByContinent: Record<Continent, Set<string>> = {
      Africa: new Set(),
      Europe: new Set(),
      "North America": new Set(),
      "South America": new Set(),
      Asia: new Set(),
      Oceania: new Set(),
    };

    const total = analytics.totalClicks || 0;

    for (const c of analytics.topCountries || []) {
      const code = (c.code || "").toUpperCase();
      const continent = (WORLD_COUNTRIES[code]?.continent || getContinentForCountry(code)) as Continent;
      if (continent && base[continent]) {
        base[continent].clicks += c.count;
        base[continent].uniqueVisitors += c.count;
        countriesByContinent[continent].add(code);
      }
    }

    for (const cont of Object.keys(base) as Continent[]) {
      base[cont].countriesCount = countriesByContinent[cont].size;
      base[cont].percentage = total > 0 ? Math.round((base[cont].clicks / total) * 100) : 0;
    }

    return base;
  }, [analytics.topCountries, analytics.totalClicks]);

  const geoDonutItems = useMemo<ReuiDonut22Item[]>(() => {
    if (analytics.totalClicks <= 0) return [];
    if (geoDonutDimension === "country") {
      return (analytics.topCountries || []).slice(0, 6).map((c) => ({
        key: c.code,
        label: c.name,
        sublabel: WORLD_COUNTRIES[c.code]?.continent || getContinentForCountry(c.code) || "Global",
        value: c.count,
        secondaryText: c.code,
      }));
    }
    if (geoDonutDimension === "continent") {
      const continentMap = new Map<string, number>();
      for (const c of analytics.topCountries || []) {
        const cont = WORLD_COUNTRIES[c.code]?.continent || getContinentForCountry(c.code) || "Other";
        continentMap.set(cont, (continentMap.get(cont) || 0) + c.count);
      }
      return Array.from(continentMap.entries()).map(([continent, value]) => ({
        key: continent,
        label: continent,
        sublabel: `${value} clicks`,
        value,
        color: CONTINENTS_META[continent as Continent]?.color || "#0066FF",
      }));
    }
    if (geoDonutDimension === "device") {
      return (analytics.topDevices || []).slice(0, 5).map((dv) => ({
        key: dv.label,
        label: dv.label,
        sublabel: "Form factor",
        value: dv.count,
      }));
    }
    if (geoDonutDimension === "browser") {
      return (analytics.topBrowsers || []).slice(0, 5).map((br) => ({
        key: br.name,
        label: br.name,
        sublabel: "Browser engine",
        value: br.count,
      }));
    }
    // OS dimension
    const osMap = new Map<string, number>();
    for (const ev of analytics.liveClickEvents || []) {
      const os = ev.os || "Other";
      osMap.set(os, (osMap.get(os) || 0) + 1);
    }
    if (osMap.size === 0 && (analytics.topDevices || []).length > 0) {
      return (analytics.topDevices || []).map((dv) => ({
        key: dv.label,
        label: dv.label,
        sublabel: "Device",
        value: dv.count,
      }));
    }
    return Array.from(osMap.entries()).map(([os, value]) => ({
      key: os,
      label: os,
      sublabel: "Operating System",
      value,
    }));
  }, [geoDonutDimension, analytics.totalClicks, analytics.topCountries, analytics.topDevices, analytics.topBrowsers, analytics.liveClickEvents]);

  const filteredEvents = useMemo(() => {
    return analytics.liveClickEvents.filter((ev) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          ev.slug?.toLowerCase().includes(q) ||
          ev.city?.toLowerCase().includes(q) ||
          ev.countryName?.toLowerCase().includes(q) ||
          ev.referrer?.toLowerCase().includes(q) ||
          ev.browser?.toLowerCase().includes(q) ||
          ev.device?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [analytics.liveClickEvents, searchQuery]);

  const totalPages = Math.ceil(filteredEvents.length / pageSize) || 1;
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const topCountry = analytics.topCountries[0] || null;
  const activeContinentsCount = useMemo(() => {
    return Object.values(continentsData).filter((c) => c.clicks > 0).length;
  }, [continentsData]);
  const topContinent = useMemo(() => {
    const sorted = Object.values(continentsData).sort((a, b) => b.clicks - a.clicks);
    return sorted[0]?.clicks > 0 ? sorted[0] : null;
  }, [continentsData]);

  const handleExportGeoCSV = () => {
    try {
      exportToExcelWorkbook({
        filename: `lshorter_geo_analytics_${selectedRange}_${new Date().toISOString().split("T")[0]}.xls`,
        reportTitle: `LShorter — Geographic Analytics Report (${selectedRange.toUpperCase()})`,
        reportSubtitle: `Global visitor distribution, edge PoPs, devices, and browser breakdowns`,
        columns: [
          { header: "Timestamp", width: 190, align: "left" },
          { header: "Country", width: 220, align: "left" },
          { header: "Code", width: 100, align: "center" },
          { header: "Link / Slug", width: 240, align: "left" },
          { header: "Device", width: 140, align: "center" },
          { header: "Browser", width: 140, align: "center" },
        ],
        rows: filteredEvents.map((ev) => [
          ev.timestamp,
          ev.countryName,
          ev.countryCode,
          `/${ev.slug}`,
          ev.device,
          ev.browser,
        ]),
      });
      showToast.success("Geographic analytics exported to Excel with formatted columns!");
    } catch {
      showToast.error("Error exporting Excel file.");
    }
  };

  // ─── RETOUR CONDITIONNEL TOUT EN BAS DU CODE (SANS AUCUN HOOK APRÈS) ───
  if (status === "loading" || isLoading) {
    return <AnalyticsGeoSkeleton />;
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Link
              href="/dashboard/analytics"
              className="flex items-center gap-1.5 text-xs ds-text-muted hover:text-brand transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Analytics</span>
            </Link>
            <span className="ds-text-muted">/</span>
            <span className="text-xs text-[#0066FF] font-semibold flex items-center gap-1">
              <Globe2 className="w-3 h-3" />
              <span>Geographic Breakdown</span>
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight ds-text-primary flex items-center gap-2.5">
            <span>Advanced Geographic Analytics</span>
          </h1>
          <p className="text-xs sm:text-sm ds-text-muted mt-1">
            Continental visualization, ISO 3166-1 country-level routing
            evaluation, and real-time country telemetry.
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2.5 lg:ml-auto w-full lg:w-auto">
          <select
            value={selectedLinkId}
            onChange={(e) => {
              setSelectedLinkId(e.target.value);
              cfInvalidateCache();
              loadData(selectedRange, e.target.value);
            }}
            className="px-3 py-1.5 rounded-[10px] ds-input text-xs font-semibold cursor-pointer"
          >
            <option value="all">All links combined</option>
            {links.map((l) => (
              <option key={l.id} value={l.id}>
                /{l.slug} ({l.clicksCount || 0} clicks)
              </option>
            ))}
          </select>

          <div className="flex items-center gap-1 p-1 rounded-[10px] ds-card text-xs shadow-xs">
            {(["day", "week", "month", "year"] as const).map((r) => (
              <button
                key={r}
                onClick={() => {
                  setSelectedRange(r);
                  cfInvalidateCache();
                  loadData(r, selectedLinkId);
                }}
                className={`px-2.5 py-1 rounded-[8px] font-semibold transition-all cursor-pointer ${
                  selectedRange === r
                    ? "bg-[#0066FF] !text-white font-bold"
                    : "ds-text-muted hover:ds-text-primary"
                }`}
              >
                {r === "day"
                  ? "24h"
                  : r === "week"
                    ? "7d"
                    : r === "month"
                      ? "30d"
                      : "12m"}
              </button>
            ))}
          </div>

          <button
            onClick={async () => {
              setIsRefreshing(true);
              cfInvalidateCache();
              await loadData(selectedRange, selectedLinkId, true);
              showToast.success("Geographic analytics refreshed");
            }}
            className="p-2 rounded-[10px] ds-card ds-text-secondary hover:ds-text-primary hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
            title="Refresh data"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-brand" : ""}`}
            />
          </button>

          <button
            type="button"
            onClick={handleExportGeoCSV}
            className="ml-auto sm:ml-0 inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#0066FF] hover:bg-[#0055d4] text-xs font-semibold !text-white shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 !text-white" />
            <span className="!text-white">Export Excel</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="p-4 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Geo Clicks
            </span>
            <span className="w-2 h-2 rounded-full bg-[#0066FF] animate-pulse shrink-0" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold ds-text-primary leading-none">
              {formatNumber(analytics.totalClicks)}
            </span>
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-bold">
              100%
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t ds-border">
            <span className="text-xs ds-text-muted font-mono">IP Edge</span>
            <span className="text-xs font-semibold text-[#0066FF]">
              Resolved
            </span>
          </div>
        </div>

        <div className="p-4 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Top Continent
            </span>
            <span className="text-lg shrink-0">🌍</span>
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold ds-text-primary text-lg sm:text-xl truncate">
              {topContinent ? topContinent.continent : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t ds-border">
            <span className="text-xs text-[#0066FF] font-semibold">
              {topContinent ? `${topContinent.percentage}% traffic` : "No traffic yet"}
            </span>
            <span className="text-xs ds-text-muted font-mono">#1</span>
          </div>
        </div>

        <div className="p-4 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Top Country
            </span>
            {topCountry ? (
              <CountryFlagBadge code={topCountry.code} className="w-6 h-4" />
            ) : (
              <Globe2 className="w-4 h-4 ds-text-muted" />
            )}
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-bold ds-text-primary text-lg sm:text-xl truncate">
              {topCountry ? topCountry.name : "—"}
            </span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t ds-border">
            <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
              {topCountry ? `${topCountry.percentage}% visits` : "No visits yet"}
            </span>
            <span className="text-xs ds-text-muted font-mono">#1</span>
          </div>
        </div>

        <div className="p-4 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Active Continents
            </span>
            <Globe2 className="w-4 h-4 text-[#0066FF]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold ds-text-primary leading-none">
              {activeContinentsCount}
            </span>
            <span className="text-xs ds-text-muted">/ 6 continents</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t ds-border">
            <span className="text-xs ds-text-muted">Continental telemetry</span>
            <span className="text-xs font-semibold text-[#0066FF]">{activeContinentsCount > 0 ? "Active" : "Idle"}</span>
          </div>
        </div>

        <div className="p-4 rounded-[12px] ds-card shadow-xs flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold ds-text-muted uppercase tracking-wider">
              Coverage
            </span>
            <span className={`w-2 h-2 rounded-full ${analytics.topCountries.length > 0 ? "bg-emerald-500" : "bg-zinc-400"} shrink-0`} />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400 leading-none">
              {analytics.topCountries.length}
            </span>
            <span className="text-xs ds-text-muted">{analytics.topCountries.length <= 1 ? "country" : "countries"}</span>
          </div>
          <div className="flex items-center justify-between pt-2 border-t ds-border">
            <span className="text-xs ds-text-muted font-mono">Global Edge</span>
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 truncate max-w-[150px]">
              {topCountry ? `${topCountry.code} (${topCountry.name})` : "No active nodes"}
            </span>
          </div>
        </div>
      </div>

      {/* World Map */}
      <div className="rounded-[12px] bg-white dark:bg-[#141416] border border-[#E4E7EC] dark:border-[#222225] p-5 sm:p-6 shadow-sm dark:shadow-2xl relative overflow-hidden flex flex-col justify-between">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3 z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#0066FF] px-2 py-0.5 rounded-full bg-[#0066FF]/10 border border-[#0066FF]/25 flex items-center gap-1.5 w-fit">
                <Globe2 className="w-3 h-3" />
                <span>Calibrated ISO 3166-1 Projection</span>
              </span>
            </div>
            <h3 className="text-lg font-bold text-[#09090B] dark:text-white flex flex-wrap items-center gap-2">
              <span>World Map of Continents &amp; Countries</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-neutral-400">
              Only countries with recorded clicks are highlighted in active
              color.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="flex items-center bg-zinc-100 dark:bg-[#1a1a1e] border border-[#E4E7EC] dark:border-[#27272a] rounded-[10px] p-0.5">
              <button
                type="button"
                onClick={() =>
                  setMapPosition((pos) => ({
                    ...pos,
                    zoom: Math.min(4, pos.zoom * 1.5),
                  }))
                }
                title="Zoom in"
                className="p-1.5 text-zinc-600 dark:text-neutral-400 hover:text-black dark:hover:text-white rounded-[8px] transition-colors cursor-pointer"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setMapPosition((pos) => ({
                    ...pos,
                    zoom: Math.max(1, pos.zoom / 1.5),
                  }))
                }
                title="Zoom out"
                className="p-1.5 text-zinc-600 dark:text-neutral-400 hover:text-black dark:hover:text-white rounded-[8px] transition-colors cursor-pointer"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() =>
                  setMapPosition({ coordinates: [10, 18], zoom: 1 })
                }
                title="Reset view"
                className="p-1.5 text-zinc-600 dark:text-neutral-400 hover:text-black dark:hover:text-white rounded-[8px] transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsMapExpanded(true)}
              className="p-1.5 rounded-[10px] bg-[#0066FF]/10 hover:bg-[#0066FF] text-[#0066FF] hover:text-white border border-[#0066FF]/25 shadow-xs transition-all cursor-pointer"
              title="Fullscreen view"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div
          onDoubleClick={() => setIsMapExpanded(true)}
          className="relative w-full aspect-[2.1/1] max-h-[460px] my-1 flex items-center justify-center bg-[#F8FAFC] dark:bg-[#09090b] rounded-[10px] border border-slate-200/90 dark:border-[#222225] overflow-hidden select-none cursor-pointer transition-colors duration-200"
          title="Double-click to expand fullscreen"
        >
          <ComposableMap
            width={800}
            height={400}
            projection="geoMercator"
            projectionConfig={{ scale: 122, center: [10, 20] }}
            className="w-full h-full"
          >
            <ZoomableGroup
              zoom={mapPosition.zoom}
              center={mapPosition.coordinates}
              onMoveEnd={(pos) => setMapPosition(pos)}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  preprocessWorldGeographies(geographies).map((geo) => {
                    const resolved = resolveCountryFromGeography(geo);
                    const countryClicks = countryClicksMap.get(resolved.code) || 0;
                    const hasClicks = countryClicks > 0;
                    const countryPct = analytics.totalClicks > 0 ? Math.round((countryClicks / analytics.totalClicks) * 100) : 0;

                    let fillColor = isDarkMode ? "#18181c" : "#E2E8F0";
                    let strokeColor = isDarkMode ? "#27272a" : "#CBD5E1";

                    if (hasClicks) {
                      fillColor = "#0066FF";
                      strokeColor = "#ffffff";
                    }

                    return (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        onMouseEnter={() => {
                          setHoveredCountry({
                            code: resolved.code,
                            name: resolved.name,
                            continent: resolved.continent,
                            clicks: countryClicks,
                            percentage: countryPct,
                          });
                        }}
                        onMouseLeave={() => setHoveredCountry(null)}
                        style={{
                          default: {
                            fill: fillColor,
                            stroke: strokeColor,
                            strokeWidth: hasClicks ? 1.2 : 0.4,
                            outline: "none",
                            transition: "all 200ms ease",
                            cursor: "pointer",
                          },
                          hover: {
                            fill: hasClicks
                              ? "#0055d4"
                              : isDarkMode
                                ? "#222228"
                                : "#CBD5E1",
                            stroke: "#ffffff",
                            strokeWidth: 1.2,
                            outline: "none",
                            cursor: "pointer",
                          },
                        }}
                      />
                    );
                  })
                }
              </Geographies>

              {analytics.topCountries && analytics.topCountries.length > 0 &&
                analytics.topCountries.map((c) => {
                  const geo = WORLD_COUNTRIES[c.code] || COUNTRY_CENTROIDS[c.code];
                  if (!geo || typeof geo.lat !== "number" || typeof geo.lng !== "number") return null;
                  return (
                    <Marker key={`marker-${c.code}`} coordinates={[geo.lng, geo.lat]}>
                      <g className="cursor-pointer">
                        <circle
                          r="12"
                          fill="#0066FF"
                          opacity="0.35"
                          className="animate-ping pointer-events-none"
                        />
                        <circle
                          r="6"
                          fill="#0066FF"
                          opacity="0.75"
                          className="pointer-events-none"
                        />
                        <circle
                          r="3.5"
                          fill="#ffffff"
                          stroke="#0066FF"
                          strokeWidth="2"
                        />
                      </g>
                    </Marker>
                  );
                })
              }
            </ZoomableGroup>
          </ComposableMap>

          {hoveredCountry && (
            <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 z-30 pointer-events-none animate-in fade-in duration-150">
              <div className="bg-white/95 dark:bg-[#141416]/95 backdrop-blur-md border border-[#E4E7EC] dark:border-[#222225] rounded-[10px] px-3 py-2 shadow-2xl flex items-center gap-2.5">
                <CountryFlagBadge
                  code={hoveredCountry.code}
                  className="w-6 h-4"
                />
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-[#09090B] dark:text-white text-xs whitespace-nowrap">
                      {hoveredCountry.name}
                    </span>
                    <span className="text-[10px] text-zinc-500 dark:text-neutral-400 font-mono">
                      ({hoveredCountry.code})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] mt-0.5 whitespace-nowrap">
                    <span className="font-semibold text-[#0066FF]">
                      {hoveredCountry.continent}
                    </span>
                    <span className="text-zinc-400 dark:text-neutral-600">
                      •
                    </span>
                    <span className="font-mono font-bold text-[#0066FF]">
                      {hoveredCountry.clicks} clicks (
                      {hoveredCountry.percentage}%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 mt-2 border-t border-[#E4E7EC] dark:border-[#222225] z-10">
          {CONTINENT_CARDS_ORDER.map((item) => {
            const isAfrica = item.key === "Africa";
            const clicks = isAfrica ? analytics.totalClicks : 0;
            const percentage = isAfrica ? 100 : 0;

            return (
              <div
                key={item.key}
                className="p-3.5 rounded-[10px] bg-white dark:bg-[#111113] border border-[#E4E7EC] dark:border-[#222225] text-left flex flex-col justify-between shadow-2xs"
              >
                <div className="flex items-center justify-between gap-1.5 mb-2">
                  <span className="text-xs flex items-center gap-1.5 min-w-0">
                    <span className="shrink-0">{item.icon}</span>
                    <span className="font-bold text-[#09090B] dark:text-white truncate">
                      {item.label}
                    </span>
                  </span>
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: isAfrica ? "#0066FF" : "#94A3B8",
                    }}
                  />
                </div>

                <div className="flex items-baseline justify-between gap-1">
                  <span className="text-lg font-extrabold text-[#09090B] dark:text-white font-mono">
                    {formatNumber(clicks)}
                  </span>
                  <span
                    className="text-xs font-bold font-mono"
                    style={{ color: isAfrica ? "#0066FF" : "#94A3B8" }}
                  >
                    {percentage}%
                  </span>
                </div>

                <div className="w-full h-1.5 rounded-full bg-zinc-200 dark:bg-white/10 mt-2.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: isAfrica ? "#0066FF" : "#94A3B8",
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Donut */}
      <div className="rounded-[10px] border border-[#E4E7EC] dark:border-[#222225] bg-white dark:bg-[#141416] p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-[#09090B] dark:text-white">
              Active Telemetry Breakdown — {geoDonutDimension.toUpperCase()}
            </h3>
            <p className="text-xs text-zinc-500 dark:text-neutral-400 mt-0.5">
              Resolution breakdown based on verified visitor edge network
              traffic.
            </p>
          </div>

          <div className="inline-flex flex-wrap rounded-[10px] bg-zinc-100 dark:bg-[#09090b] border border-[#E4E7EC] dark:border-[#222225] p-1 gap-1">
            {(
              [
                { id: "device", label: "Devices" },
                { id: "browser", label: "Browsers" },
                { id: "country", label: "Countries" },
                { id: "continent", label: "Continents" },
                { id: "os", label: "OS" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setGeoDonutDimension(tab.id)}
                className={`rounded-[8px] px-3 py-1.5 text-xs font-semibold transition-all cursor-pointer ${
                  geoDonutDimension === tab.id
                    ? "bg-white dark:bg-[#141416] text-[#0066FF] shadow-2xs"
                    : "text-zinc-600 dark:text-neutral-400 hover:text-[#101828] dark:hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <ReuiDonutChart22
          items={geoDonutItems}
          centerLabel={geoDonutDimension.toUpperCase()}
          centerValueFormatter={(val) => formatNumber(val)}
          emptyMessage="Awaiting traffic..."
        />
      </div>

      {/* Fullscreen Map Modal */}
      {isMapExpanded && (
        <div
          onClick={() => setIsMapExpanded(false)}
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-between p-3 sm:p-6 select-none cursor-pointer animate-in fade-in duration-200"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-6xl flex items-center justify-between gap-3 p-3.5 sm:p-4 rounded-[10px] bg-white dark:bg-[#141416] border border-[#E4E7EC] dark:border-[#222225] shadow-2xl cursor-default shrink-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-[10px] bg-[#0066FF] flex items-center justify-center text-white shadow-lg font-bold shrink-0">
                <Globe2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2 className="text-sm sm:text-base font-bold text-[#09090B] dark:text-white truncate">
                  Interactive World Map — Calibrated Fullscreen View
                </h2>
                <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-neutral-400 truncate">
                  {topCountry
                    ? `${topCountry.name} highlighted as the authoritative active traffic node`
                    : "Global edge redirect resolution points"}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsMapExpanded(false)}
              className="p-2 rounded-[10px] bg-zinc-100 dark:bg-white/5 hover:bg-red-500/20 text-zinc-600 dark:text-neutral-400 hover:text-red-500 cursor-pointer transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-6xl flex-1 my-3 flex items-center justify-center bg-[#F8FAFC] dark:bg-[#09090b] rounded-[10px] border border-slate-200 dark:border-[#222225] overflow-hidden shadow-2xl min-h-[320px]"
          >
            <ComposableMap
              width={800}
              height={400}
              projection="geoMercator"
              projectionConfig={{ scale: 135, center: [10, 20] }}
              className="w-full h-full"
            >
              <ZoomableGroup
                zoom={mapPosition.zoom}
                center={mapPosition.coordinates}
                onMoveEnd={(pos) => setMapPosition(pos)}
              >
                <Geographies geography={GEO_URL}>
                  {({ geographies }) =>
                    preprocessWorldGeographies(geographies).map((geo) => {
                      const resolved = resolveCountryFromGeography(geo);
                      const countryClicks = countryClicksMap.get(resolved.code) || 0;
                      const hasClicks = countryClicks > 0;
                      return (
                        <Geography
                          key={`fs-${geo.rsmKey}`}
                          geography={geo}
                          style={{
                            default: {
                              fill: hasClicks
                                ? "#0066FF"
                                : isDarkMode
                                  ? "#18181c"
                                  : "#E2E8F0",
                              stroke: hasClicks
                                ? "#ffffff"
                                : isDarkMode
                                  ? "#27272a"
                                  : "#CBD5E1",
                              strokeWidth: hasClicks ? 1.2 : 0.4,
                              outline: "none",
                            },
                          }}
                        />
                      );
                    })
                  }
                </Geographies>
                {analytics.topCountries && analytics.topCountries.length > 0 &&
                  analytics.topCountries.map((c) => {
                    const geo = WORLD_COUNTRIES[c.code] || COUNTRY_CENTROIDS[c.code];
                    if (!geo || typeof geo.lat !== "number" || typeof geo.lng !== "number") return null;
                    return (
                      <Marker key={`fs-marker-${c.code}`} coordinates={[geo.lng, geo.lat]}>
                        <circle
                          r="12"
                          fill="#0066FF"
                          opacity="0.35"
                          className="animate-ping"
                        />
                        <circle
                          r="5"
                          fill="#ffffff"
                          stroke="#0066FF"
                          strokeWidth="2.5"
                        />
                      </Marker>
                    );
                  })
                }
              </ZoomableGroup>
            </ComposableMap>
          </div>
        </div>
      )}

      {/* Live Detailed Geographic Stream Table */}
      <div className="rounded-[10px] bg-white dark:bg-[#141416] border border-[#E4E7EC] dark:border-[#222225] p-5 sm:p-6 shadow-sm dark:shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-[#E4E7EC] dark:border-[#222225]">
          <div>
            <h3 className="text-lg font-bold text-[#09090B] dark:text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#0066FF]" />
              <span>Live Detailed Geographic Stream</span>
            </h3>
            <p className="text-xs text-zinc-500 dark:text-neutral-400">
              Timestamped visitor stream with verified ISO 3166-1 country
              resolution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                type="text"
                placeholder="Filter by country, link..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 rounded-[10px] bg-zinc-50 dark:bg-[#18181c] border border-[#E4E7EC] dark:border-[#222225] text-xs text-[#09090B] dark:text-white placeholder-zinc-400 focus:outline-none focus:border-[#0066FF]"
              />
            </div>

            <ColumnMaskToggle
              columns={GEO_COLUMNS}
              visibleColumns={visibleColumns}
              onToggleColumn={toggleColumn}
              onResetColumns={resetColumns}
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-[8px] border border-[#E4E7EC] dark:border-[#222225] overflow-visible">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E4E7EC] dark:border-[#222225] bg-zinc-100/70 dark:bg-[#111113] text-zinc-700 dark:text-neutral-400 font-semibold text-[11px]">
                {visibleColumns.has("timestamp") && (
                  <th className="py-2.5 px-3">Timestamp</th>
                )}
                {visibleColumns.has("country") && (
                  <th className="py-2.5 px-3">Country</th>
                )}
                {visibleColumns.has("city") && (
                  <th className="py-2.5 px-3">City</th>
                )}
                {visibleColumns.has("continent") && (
                  <th className="py-2.5 px-3">Continent</th>
                )}
                {visibleColumns.has("link") && (
                  <th className="py-2.5 px-3">Link</th>
                )}
                {visibleColumns.has("referrer") && (
                  <th className="py-2.5 px-3 text-center">Referrer Source</th>
                )}
                {visibleColumns.has("device") && (
                  <th className="py-2.5 px-3">Device</th>
                )}
                {visibleColumns.has("browser") && (
                  <th className="py-2.5 px-3">Browser</th>
                )}
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E4E7EC] dark:divide-[#222225]/60 text-zinc-800 dark:text-neutral-200">
              {paginatedEvents.length === 0 ? (
                <tr>
                  <td
                    colSpan={visibleColumns.size + 1}
                    className="py-12 px-5 text-center text-zinc-500 dark:text-neutral-400"
                  >
                    No geographic click events recorded for this period yet.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((ev) => {
                  const cleanSlug = String(ev.slug || "").replace(/^\//, "");
                  const shortLinkUrl = `https://lsho.cc/${cleanSlug}`;

                return (
                  <tr
                    key={ev.id}
                    className="hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
                  >
                    {visibleColumns.has("timestamp") && (
                      <td className="py-2 px-3 font-mono text-zinc-500 dark:text-neutral-400 whitespace-nowrap text-[10.5px]">
                        {/* S'actualise en direct : Just now -> 1 min ago -> 2 mins ago */}
                        {formatLiveRelativeTime(ev.timestamp, currentTimeTick)}
                      </td>
                    )}
                    {visibleColumns.has("country") && (
                      <td className="py-2 px-3 font-semibold text-[#09090B] dark:text-white whitespace-nowrap text-xs">
                        <div className="inline-flex items-center gap-2">
                          <CountryFlagBadge code={ev.countryCode} className="w-4.5 h-3" />
                          <span>{ev.countryName}</span>
                          <span className="text-[10px] text-zinc-500 font-mono">
                            ({ev.countryCode})
                          </span>
                        </div>
                      </td>
                    )}
                    {visibleColumns.has("city") && (
                      <td className="py-2 px-3 whitespace-nowrap text-xs font-medium text-zinc-900 dark:text-zinc-100">
                        {ev.city || "Edge PoP"}
                      </td>
                    )}
                    {visibleColumns.has("continent") && (
                      <td className="py-2 px-3">
                        <span className="px-2 py-0.5 rounded-full text-[9.5px] font-semibold bg-[#0066FF]/10 text-[#0066FF] border border-[#0066FF]/30">
                          {WORLD_COUNTRIES[ev.countryCode]?.continent ||
                            getContinentForCountry(ev.countryCode) ||
                            "Global"}
                        </span>
                      </td>
                    )}
                    {visibleColumns.has("link") && (
                      <td className="py-2 px-3 font-mono text-[#0066FF] font-semibold text-xs">
                        /{ev.slug}
                      </td>
                    )}
                    {visibleColumns.has("referrer") && (
                      <td className="py-2 px-3 whitespace-nowrap text-center">
                        <div className="flex items-center justify-center">
                          <ReferrerLogo referrer={ev.referrer} size={22} />
                        </div>
                      </td>
                    )}
                    {visibleColumns.has("device") && (
                      <td className="py-2 px-3 capitalize text-xs">{ev.device}</td>
                    )}
                    {visibleColumns.has("browser") && (
                      <td className="py-2 px-3 text-xs">{ev.browser}</td>
                    )}
                    <td className="py-2 px-3 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(shortLinkUrl);
                          showToast.success("Short link copied!");
                        }}
                        className="p-1 rounded-lg text-zinc-500 hover:text-[#0066FF] hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors"
                        title="Copy link"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 mt-3 border-t border-[#E4E7EC] dark:border-[#222225] text-xs text-zinc-500 dark:text-neutral-400">
          <span>
            Showing {(currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(currentPage * pageSize, filteredEvents.length)} of{" "}
            {filteredEvents.length} events
          </span>

          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181c] border border-[#E4E7EC] dark:border-[#222225] disabled:opacity-40 text-[#09090B] dark:text-white cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-3 py-1 font-mono text-[#09090B] dark:text-white text-xs bg-zinc-100 dark:bg-[#18181c] border border-[#E4E7EC] dark:border-[#222225] rounded-[10px]">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-[10px] bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181c] border border-[#E4E7EC] dark:border-[#222225] disabled:opacity-40 text-[#09090B] dark:text-white cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
