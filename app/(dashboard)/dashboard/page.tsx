"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PopulatedState } from "@/components/dashboard/populated-state";
import { ShortLink, GlobalAnalytics } from "@/types";
import { cfGetLinks, cfGetAnalytics, EMPTY_ANALYTICS } from "@/lib/cloudflare-api";
import { EMPTY_ANALYTICS as _EA } from "@/lib/api-client";

// Re-export from cloudflare-api for convenience
const ANALYTICS_ZERO: GlobalAnalytics = {
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
};

import { DashboardOverviewSkeleton } from "@/components/ui/skeleton";

export default function DashboardOverviewPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [links, setLinks] = useState<ShortLink[]>([]);
  const [analytics, setAnalytics] = useState<GlobalAnalytics>(ANALYTICS_ZERO);
  const [isLoading, setIsLoading] = useState(true);

  const userId = session?.user?.id;

  const loadData = async (isBackground = false) => {
    if (!userId) return;
    if (!isBackground) setIsLoading(true);

    try {
      // Fetch links from Cloudflare D1 API
      const linksRes = await cfGetLinks(userId);
      const listData = Array.isArray(linksRes?.data) ? linksRes.data : Array.isArray((linksRes?.data as any)?.data) ? (linksRes?.data as any).data : [];
      const rawLinks: ShortLink[] = listData.map((l: any) => ({
        id: l.id,
        userId: l.user_id || userId,
        slug: l.slug,
        domainName: l.domain_name || "lsho.cc",
        shortUrl: typeof window !== "undefined" ? `${window.location.origin}/r/${l.slug}` : `http://localhost:3000/r/${l.slug}`,
        targetUrl: l.target_url || l.targetUrl,
        clicksCount: l.clicks_count || l.clicksCount || l.clicks || 0,
        uniqueClicks: l.unique_clicks || l.uniqueClicks || 0,
        conversionsCount: l.conversions_count || l.conversionsCount || 0,
        revenue: l.revenue || 0,
        routingRules: l.routing_rules ? (typeof l.routing_rules === "string" ? JSON.parse(l.routing_rules) : l.routing_rules) : (l.routingRules || []),
        geoTargeting: l.geo_targeting ? (typeof l.geo_targeting === "string" ? JSON.parse(l.geo_targeting) : l.geo_targeting) : (l.geoTargeting || {}),
        deviceTargeting: l.device_targeting ? (typeof l.device_targeting === "string" ? JSON.parse(l.device_targeting) : l.device_targeting) : (l.deviceTargeting || {}),
        isPasswordProtected: Boolean(l.is_password_protected || l.isPasswordProtected || l.has_password || l.hasPassword || l.password),
        isCloaked: Boolean(l.is_cloaked || l.isCloaked),
        metaTitle: l.meta_title || l.metaTitle || l.og_title || l.ogTitle,
        ogTitle: l.og_title || l.ogTitle || l.meta_title || l.metaTitle,
        ogDescription: l.og_description || l.ogDescription,
        ogImage: l.og_image || l.ogImage,
        hideReferrer: Boolean(l.hide_referrer || l.hideReferrer),
        tags: l.tags ? (typeof l.tags === "string" ? JSON.parse(l.tags) : l.tags) : [],
        expiresAt: l.expires_at || l.expiresAt,
        isActive: !(
          l.is_active === 0 ||
          l.is_active === false ||
          l.is_active === "0" ||
          l.isActive === 0 ||
          l.isActive === false ||
          l.isActive === "0"
        ),
        created_at: l.created_at || l.createdAt || new Date().toISOString(),
      }));
      setLinks(rawLinks);

      // Compute aggregated totals from links
      const sumLinksClicks = rawLinks.reduce((acc, l) => acc + (l.clicksCount || 0), 0);
      const sumUniqueClicks = rawLinks.reduce((acc, l) => acc + (l.uniqueClicks || 0), 0);

      // Fetch analytics from Cloudflare D1 API
      try {
        const analyticsRes = await cfGetAnalytics(userId);
        if (analyticsRes?.data) {
          const d = analyticsRes.data;
          const total = (d.total_clicks || d.totalClicks || 0) || sumLinksClicks;
          const unique = (d.unique_clicks || d.uniqueClicks || 0) || sumUniqueClicks || total;

          setAnalytics({
            totalClicks: total,
            clicksGrowth: d.clicks_growth || d.clicksGrowth || 0,
            uniqueClicks: unique,
            uniqueClicksGrowth: 0,
            trackedRevenue: d.total_revenue || d.totalRevenue || 0,
            revenueGrowth: 0,
            avgCtr: d.avg_ctr || d.avgCtr || 0,
            ctrGrowth: 0,
            bounceRate: d.bounce_rate || d.bounceRate || 0,
            epc: d.epc || 0,
            avgEngagementTime: "0s",
            clicksByDay: (d.clicks_by_day || d.clicksByDay || []).length > 0 ? (d.clicks_by_day || d.clicksByDay) : (total > 0 ? [{ date: new Date().toISOString().slice(0, 10), clicks: total }] : []),
            topCountries: (d.top_countries || d.topCountries || []).map((c: any) => ({
              code: c.code || c.country_code || c.country || "FR",
              name: c.name || c.country_name || c.country || "France",
              count: c.count || c.clicks || 0,
              percentage: total > 0 ? Math.round(((c.count || c.clicks || 0) / total) * 100) : 0,
            })),
            topCities: (d.top_cities || d.topCities || []).map((ci: any) => ({
              city: ci.city || ci.name || "Inconnue",
              countryCode: ci.countryCode || ci.country_code || "FR",
              count: ci.count || ci.clicks || 0,
              percentage: total > 0 ? Math.round(((ci.count || ci.clicks || 0) / total) * 100) : 0,
            })),
            topDevices: (d.top_devices || d.topDevices || []).map((dv: any) => ({
              label: dv.label || dv.device || dv.name || "Desktop",
              device: dv.device || dv.label || dv.name || "Desktop",
              count: dv.count || dv.clicks || 0,
              percentage: total > 0 ? Math.round(((dv.count || dv.clicks || 0) / total) * 100) : 0,
            })),
            topBrowsers: (d.top_browsers || d.topBrowsers || []).map((br: any) => ({
              name: br.name || br.browser || "Chrome",
              browser: br.browser || br.name || "Chrome",
              count: br.count || br.clicks || 0,
              percentage: total > 0 ? Math.round(((br.count || br.clicks || 0) / total) * 100) : 0,
            })),
            topReferrers: (d.top_referrers || d.topReferrers || []).map((rf: any) => ({
              source: rf.source || rf.referrer || rf.name || "Direct",
              referrer: rf.referrer || rf.source || rf.name || "Direct",
              count: rf.count || rf.clicks || 0,
              percentage: total > 0 ? Math.round(((rf.count || rf.clicks || 0) / total) * 100) : 0,
            })),
            liveClickEvents: (d.live_click_events || d.liveClickEvents || []).map((ev: any) => ({
              id: ev.id,
              timestamp: ev.timestamp || new Date().toISOString(),
              slug: ev.slug || "link",
              countryCode: ev.country_code || ev.countryCode || "FR",
              countryName: ev.country_name || ev.countryName || "France",
              city: ev.city || "—",
              device: ev.device || "desktop",
              browser: ev.browser || "Chrome",
              referrer: ev.referrer || "Direct",
            })),
            recentConversions: [],
          });
        } else {
          setAnalytics((prev) => ({
            ...prev,
            totalClicks: sumLinksClicks,
            uniqueClicks: sumUniqueClicks || sumLinksClicks,
            clicksByDay: sumLinksClicks > 0 ? [{ date: new Date().toISOString().slice(0, 10), clicks: sumLinksClicks, uniqueClicks: sumUniqueClicks || sumLinksClicks, dayNumber: 1 }] : [],
          }));
        }
      } catch {
        setAnalytics((prev) => ({
          ...prev,
          totalClicks: sumLinksClicks,
          uniqueClicks: sumUniqueClicks || sumLinksClicks,
          clicksByDay: sumLinksClicks > 0 ? [{ date: new Date().toISOString().slice(0, 10), clicks: sumLinksClicks, uniqueClicks: sumUniqueClicks || sumLinksClicks, dayNumber: 1 }] : [],
        }));
      }
    } catch (err) {
      console.error("Cloudflare API error:", err);
      if (!isBackground) {
        setLinks([]);
        setAnalytics(ANALYTICS_ZERO);
      }
    } finally {
      if (!isBackground) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
      return;
    }
    if (status === "authenticated" && userId) {
      loadData();
    }
  }, [status, userId]);

  if (status === "loading" || isLoading) {
    return <DashboardOverviewSkeleton />;
  }


  if (status === "unauthenticated") {
    return null;
  }

  return (
    <div>
      {links.length === 0 ? (
        <EmptyState onLinkCreated={loadData} analytics={analytics} />
      ) : (
        <PopulatedState links={links} analytics={analytics} onRefresh={loadData} />
      )}
    </div>
  );
}
