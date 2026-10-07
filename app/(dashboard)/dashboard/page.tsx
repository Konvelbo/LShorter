"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PopulatedState } from "@/components/dashboard/populated-state";
import { ShortLink, GlobalAnalytics } from "@/types";
import { cfGetLinks, cfGetAnalytics, cfInvalidateCache, EMPTY_ANALYTICS } from "@/lib/cloudflare-api";
import { EMPTY_ANALYTICS as _EA } from "@/lib/api-client";
import { generateTimelineForRange, generateEdgeTopCountries } from "@/lib/analytics-generators";

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
        routingRules: l.routing_rules
          ? (typeof l.routing_rules === "string" ? JSON.parse(l.routing_rules) : l.routing_rules)
          : (typeof l.routingRules === "string" ? JSON.parse(l.routingRules) : l.routingRules || []),
        geoTargeting: l.geo_targeting
          ? (typeof l.geo_targeting === "string" ? JSON.parse(l.geo_targeting) : l.geo_targeting)
          : (typeof l.geoTargeting === "string" ? JSON.parse(l.geoTargeting) : l.geoTargeting || {}),
        deviceTargeting: l.device_targeting
          ? (typeof l.device_targeting === "string" ? JSON.parse(l.device_targeting) : l.device_targeting)
          : (typeof l.deviceTargeting === "string" ? JSON.parse(l.deviceTargeting) : l.deviceTargeting || {}),
        isPasswordProtected: Boolean(l.is_password_protected || l.isPasswordProtected || l.has_password || l.hasPassword || l.password || l.password_plain),
        password: l.password || l.password_plain || "",
        maxClicks: l.max_clicks !== undefined && l.max_clicks !== null ? Number(l.max_clicks) : l.maxClicks !== undefined && l.maxClicks !== null ? Number(l.maxClicks) : undefined,
        fallbackUrl: l.fallback_url || l.fallbackUrl || "",
        isCloaked: Boolean(l.is_cloaked || l.isCloaked),
        metaTitle: l.meta_title || l.metaTitle || l.og_title || l.ogTitle,
        ogTitle: l.og_title || l.ogTitle || l.meta_title || l.metaTitle,
        ogDescription: l.og_description || l.ogDescription,
        ogImage: l.og_image || l.ogImage,
        bannerStyle:
          (l.banner_style || l.bannerStyle || l.twitter_card || l.twitterCard) === "default_banner" ||
          (l.banner_style || l.bannerStyle || l.twitter_card || l.twitterCard) === "summary"
            ? "default_banner"
            : "large_banner",
        banner_style:
          (l.banner_style || l.bannerStyle || l.twitter_card || l.twitterCard) === "default_banner" ||
          (l.banner_style || l.bannerStyle || l.twitter_card || l.twitterCard) === "summary"
            ? "default_banner"
            : "large_banner",
        twitterCard:
          (l.banner_style || l.bannerStyle || l.twitter_card || l.twitterCard) === "default_banner" ||
          (l.banner_style || l.bannerStyle || l.twitter_card || l.twitterCard) === "summary"
            ? "summary"
            : "summary_large_image",
        twitter_card:
          (l.banner_style || l.bannerStyle || l.twitter_card || l.twitterCard) === "default_banner" ||
          (l.banner_style || l.bannerStyle || l.twitter_card || l.twitterCard) === "summary"
            ? "summary"
            : "summary_large_image",
        hideReferrer: Boolean(l.hide_referrer || l.hideReferrer),
        tags: l.tags ? (typeof l.tags === "string" ? JSON.parse(l.tags) : l.tags) : [],
        expiresAt: l.expires_at || l.expiresAt,
        abVariations: l.ab_variations
          ? (typeof l.ab_variations === "string" ? JSON.parse(l.ab_variations) : l.ab_variations)
          : (typeof l.abVariations === "string" ? JSON.parse(l.abVariations) : l.abVariations || []),
        mainWeight: l.main_weight !== undefined ? Number(l.main_weight) : l.mainWeight !== undefined ? Number(l.mainWeight) : undefined,
        redirectType: l.redirect_type || l.redirectType,
        passParams: l.pass_params !== undefined ? Boolean(l.pass_params) : l.passParams !== undefined ? Boolean(l.passParams) : undefined,
        pathLockMode: (l.path_lock_mode || l.pathLockMode || "off") as "off" | "strict" | "funnel",
        path_lock_mode: (l.path_lock_mode || l.pathLockMode || "off") as "off" | "strict" | "funnel",
        pathLockPrefix: l.path_lock_prefix || l.pathLockPrefix || "",
        path_lock_prefix: l.path_lock_prefix || l.pathLockPrefix || "",
        pathLockMessage: l.path_lock_message || l.pathLockMessage || "",
        path_lock_message: l.path_lock_message || l.pathLockMessage || "",
        pathLockPassword: l.path_lock_password || l.pathLockPassword || "",
        path_lock_password: l.path_lock_password || l.pathLockPassword || "",
        isActive: !(
          l.is_active === 0 ||
          l.is_active === false ||
          l.is_active === "0" ||
          l.isActive === 0 ||
          l.isActive === false ||
          l.isActive === "0"
        ),
        pixels: Array.isArray(l.pixels)
          ? l.pixels
          : typeof l.pixels === "string"
            ? (() => {
                try {
                  return JSON.parse(l.pixels);
                } catch {
                  return [l.pixels];
                }
              })()
            : [],
        created_at: l.created_at || l.createdAt || new Date().toISOString(),
      }));
      setLinks(rawLinks);

      // If user has 0 links, reset analytics to zero immediately (ensures instant update on deletion)
      if (rawLinks.length === 0) {
        setAnalytics(ANALYTICS_ZERO);
        return;
      }

      // Compute aggregated totals from links
      const sumLinksClicks = rawLinks.reduce((acc, l) => acc + (l.clicksCount || 0), 0);
      const sumUniqueClicks = rawLinks.reduce((acc, l) => acc + (l.uniqueClicks || 0), 0);

      // Fetch analytics from Cloudflare D1 API
      try {
        const analyticsRes = await cfGetAnalytics(userId);
        if (analyticsRes?.data) {
          const d = analyticsRes.data;
          // Take the largest of Worker total_clicks vs link-level clicks_count sum
          // (the Worker analytics table may lag behind the links table)
          const workerTotal = d.total_clicks || d.totalClicks || 0;
          const total = Math.max(workerTotal, sumLinksClicks);
          const unique = total > 0
            ? Math.max(
                (d.unique_clicks ?? d.uniqueClicks ?? 0),
                sumUniqueClicks ?? 0
              ) || total
            : 0;

          const rawClicksByDay: any[] = d.clicks_by_day || d.clicksByDay || [];
          const rawLiveEvents: any[] = d.live_click_events || d.liveClickEvents || [];

          // If the Worker has no per-day rows but we know there are clicks,
          // generate a timeline so charts always reflect the real counter.
          const clicksByDayFinal =
            rawClicksByDay.length > 0
              ? rawClicksByDay
              : generateTimelineForRange("month", total, unique, rawClicksByDay, rawLiveEvents);

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
            clicksByDay: clicksByDayFinal,
            topCountries: (d.top_countries || d.topCountries || []).map((c: any) => ({
              code: (c.code || c.country_code || c.country || "XX").toUpperCase(),
              name: c.name || c.country_name || c.country || "Inconnu",
              count: c.count || c.clicks || 0,
              percentage: total > 0 ? Math.round(((c.count || c.clicks || 0) / total) * 100) : 0,
            })),
            topCities: (d.top_cities || d.topCities || []).map((ci: any) => ({
              city: ci.city || ci.name || "Inconnue",
              countryCode: (ci.countryCode || ci.country_code || "XX").toUpperCase(),
              count: ci.count || ci.clicks || 0,
              percentage: total > 0 ? Math.round(((ci.count || ci.clicks || 0) / total) * 100) : 0,
            })),
            topDevices: (d.top_devices || d.topDevices || []).map((dv: any) => ({
              label: dv.label || dv.device || dv.name || "Inconnu",
              device: dv.device || dv.label || dv.name || "desktop",
              count: dv.count || dv.clicks || 0,
              percentage: total > 0 ? Math.round(((dv.count || dv.clicks || 0) / total) * 100) : 0,
            })),
            topBrowsers: (d.top_browsers || d.topBrowsers || []).map((br: any) => ({
              name: br.name || br.browser || "Inconnu",
              browser: br.browser || br.name || "Inconnu",
              count: br.count || br.clicks || 0,
              percentage: total > 0 ? Math.round(((br.count || br.clicks || 0) / total) * 100) : 0,
            })),
            topReferrers: (d.top_referrers || d.topReferrers || []).map((rf: any) => ({
              source: rf.source || rf.referrer || rf.name || "Direct",
              referrer: rf.referrer || rf.source || rf.name || "Direct",
              count: rf.count || rf.clicks || 0,
              percentage: total > 0 ? Math.round(((rf.count || rf.clicks || 0) / total) * 100) : 0,
            })),
            liveClickEvents: rawLiveEvents.map((ev: any) => ({
              id: ev.id || `ev-${Date.now()}-${Math.random()}`,
              linkId: ev.linkId || ev.link_id || ev.slug || "",
              timestamp: ev.timestamp || new Date().toISOString(),
              slug: ev.slug || "link",
              ipMasked: ev.ipMasked || ev.ip_masked || "•••.•••.•••",
              countryCode: (ev.country_code || ev.countryCode || "XX").toUpperCase(),
              countryName: ev.country_name || ev.countryName || "Inconnu",
              city: ev.city || "—",
              device: ev.device || "desktop",
              os: ev.os || undefined,
              browser: ev.browser || "Inconnu",
              referrer: ev.referrer || "Direct",
              // DEMO-START: Forward buyer and conversion details
              conversionAmount: ev.conversionAmount ?? ev.conversion_amount ?? 0,
              customerName: ev.customerName || ev.customer_name,
              customerEmail: ev.customerEmail || ev.customer_email,
              customerAvatar: ev.customerAvatar || ev.customer_avatar || ev.avatarUrl || ev.avatar,
              clicks: ev.clicks,
              // DEMO-END
            })),
            recentConversions: d.recent_conversions || d.recentConversions || [],
            // DEMO-START: Forward pre-calculated monthly distribution
            clicksByMonth: d.clicks_by_month || d.clicksByMonth,
            incomeByMonth: d.income_by_month || d.incomeByMonth,
            // DEMO-END
          });
        } else {
          // Analytics API returned no data — fall back to link-level aggregates.
          // Still generate a real timeline so the charts always show the correct bars.
          setAnalytics((prev) => ({
            ...prev,
            totalClicks: sumLinksClicks,
            uniqueClicks: sumUniqueClicks || sumLinksClicks,
            clicksByDay: generateTimelineForRange("month", sumLinksClicks, sumUniqueClicks || sumLinksClicks, []),
          }));
        }
      } catch {
        // Network / parsing error — same fallback.
        setAnalytics((prev) => ({
          ...prev,
          totalClicks: sumLinksClicks,
          uniqueClicks: sumUniqueClicks || sumLinksClicks,
          clicksByDay: generateTimelineForRange("month", sumLinksClicks, sumUniqueClicks || sumLinksClicks, []),
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
      setIsLoading(false);
      return;
    }
    if (status === "authenticated" && userId) {
      loadData();
    }
  }, [status, userId]);

  // Listen for global link creation/update events (from sidebar, modals, etc.)
  useEffect(() => {
    const handleUpdate = () => {
      cfInvalidateCache();
      loadData(true);
    };

    window.addEventListener("lshorter_links_updated", handleUpdate);
    window.addEventListener("lshorter_data_change", handleUpdate);

    return () => {
      window.removeEventListener("lshorter_links_updated", handleUpdate);
      window.removeEventListener("lshorter_data_change", handleUpdate);
    };
  }, [userId]);

  if (status === "loading" || isLoading) {
    return <DashboardOverviewSkeleton />;
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
