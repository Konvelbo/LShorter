"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { EmptyState } from "@/components/dashboard/empty-state";
import { PopulatedState } from "@/components/dashboard/populated-state";
import { ShortLink, GlobalAnalytics } from "@/types";
import { isLinkActive } from "@/lib/utils";
import { cfGetLinks, cfGetAnalytics, cfInvalidateCache, parseTags, EMPTY_ANALYTICS } from "@/lib/cloudflare-api";
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

  const rawUserId = session?.user?.id;
  const userEmail = session?.user?.email || "";
  const userId = rawUserId && rawUserId !== "usr_anonymous" ? rawUserId : userEmail;
  const [syncedLiveClicks, setSyncedLiveClicks] = useState<number>(() => {
    if (typeof window !== "undefined") {
      try {
        const uId = session?.user?.id;
        if (uId) {
          const s = localStorage.getItem(`lshorter_live_clicks_${uId}`);
          if (s !== null && !isNaN(Number(s))) return Number(s);
        }
      } catch {}
    }
    return 0;
  });

  useEffect(() => {
    if (typeof window !== "undefined" && userId) {
      try {
        const s = localStorage.getItem(`lshorter_live_clicks_${userId}`);
        if (s !== null && !isNaN(Number(s))) {
          setSyncedLiveClicks(Number(s));
        }
      } catch {}
    }
  }, [userId]);

  const loadData = async (isBackground = false, force = false) => {
    if (!isBackground) setIsLoading(true);

    try {
      const needForce = isBackground || force;
      // Fetch links from Cloudflare D1 API (proxy resolves userId from query or active session)
      const linksRes = await cfGetLinks(userId || "", needForce);
      const listData = Array.isArray(linksRes?.data) ? linksRes.data : Array.isArray((linksRes?.data as any)?.data) ? (linksRes?.data as any).data : [];
      const rawLinks: ShortLink[] = listData.map((l: any) => {
        const active = isLinkActive(l);
        const expTimeStr = l.expires_at || l.expiresAt || null;
        const isExp = Boolean(
          l.isExpired ||
          l.is_expired === 1 ||
          (expTimeStr && new Date(expTimeStr).getTime() <= Date.now())
        );
        return {
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
          routingRules: (() => {
            const raw = l.routing_rules || l.routingRules;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            if (typeof raw === "string") {
              try { return JSON.parse(raw); } catch { return []; }
            }
            return [];
          })(),
          geoTargeting: (() => {
            const raw = l.geo_targeting || l.geoTargeting;
            if (!raw) return {};
            if (typeof raw === "object") return raw;
            if (typeof raw === "string") {
              try { return JSON.parse(raw); } catch { return {}; }
            }
            return {};
          })(),
          deviceTargeting: (() => {
            const raw = l.device_targeting || l.deviceTargeting;
            if (!raw) return {};
            if (typeof raw === "object") return raw;
            if (typeof raw === "string") {
              try { return JSON.parse(raw); } catch { return {}; }
            }
            return {};
          })(),
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
            l.banner_style === "large_banner" || l.bannerStyle === "large_banner" || l.twitter_card === "summary_large_image" || l.twitterCard === "summary_large_image"
              ? "large_banner"
              : l.banner_style === "default_banner" || l.bannerStyle === "default_banner" || l.twitter_card === "summary" || l.twitterCard === "summary"
                ? "default_banner"
                : "large_banner",
          banner_style:
            l.banner_style === "large_banner" || l.bannerStyle === "large_banner" || l.twitter_card === "summary_large_image" || l.twitterCard === "summary_large_image"
              ? "large_banner"
              : l.banner_style === "default_banner" || l.bannerStyle === "default_banner" || l.twitter_card === "summary" || l.twitterCard === "summary"
                ? "default_banner"
                : "large_banner",
          twitterCard:
            l.twitter_card === "summary_large_image" || l.twitterCard === "summary_large_image" || l.banner_style === "large_banner" || l.bannerStyle === "large_banner"
              ? "summary_large_image"
              : l.twitter_card === "summary" || l.twitterCard === "summary" || l.banner_style === "default_banner" || l.bannerStyle === "default_banner"
                ? "summary"
                : "summary_large_image",
          twitter_card:
            l.twitter_card === "summary_large_image" || l.twitterCard === "summary_large_image" || l.banner_style === "large_banner" || l.bannerStyle === "large_banner"
              ? "summary_large_image"
              : l.twitter_card === "summary" || l.twitterCard === "summary" || l.banner_style === "default_banner" || l.bannerStyle === "default_banner"
                ? "summary"
                : "summary_large_image",
          hideReferrer: Boolean(l.hide_referrer || l.hideReferrer),
          tags: parseTags(l.tags),
          expiresAt: expTimeStr || undefined,
          expires_at: expTimeStr,
          isExpired: isExp,
          is_expired: isExp ? 1 : 0,
          isActive: active,
          is_active: active ? 1 : 0,
          status: isExp ? "Expired" : (active ? "Active" : "Paused"),
          statusLabel: isExp ? "Expired" : (active ? "Active" : "Paused"),
          abVariations: (() => {
            const raw = l.ab_variations || l.abVariations;
            if (!raw) return [];
            if (Array.isArray(raw)) return raw;
            if (typeof raw === "string") {
              try { return JSON.parse(raw); } catch { return []; }
            }
            return [];
          })(),
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
        };
      });
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
        const analyticsRes = await cfGetAnalytics(userId, "30d", undefined, needForce);
        if (analyticsRes?.data) {
          const d = analyticsRes.data;
          const workerTotal = Number(d.total_clicks ?? d.totalClicks ?? 0);
          const total = workerTotal > 0 ? workerTotal : sumLinksClicks;
          const unique = Number(d.unique_clicks ?? d.uniqueClicks ?? 0) || (total > 0 ? Math.min(total, sumUniqueClicks || total) : 0);

          if (typeof window !== "undefined" && userId) {
            try {
              localStorage.setItem(`lshorter_live_clicks_${userId}`, String(total));
            } catch {}
            setSyncedLiveClicks(total);
            window.dispatchEvent(
              new CustomEvent("lshorter_live_clicks_synced", {
                detail: { clicks: total, userId, fromOverview: true },
              }),
            );
          }

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
      loadData(false, false);
    }
  }, [status, userId]);

  // Safety timeout: guarantee skeleton disappears after maximum 3.5s
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  // Listen for global link creation/update events (from sidebar, modals, etc.)
  useEffect(() => {
    if (!userId) return;

    const handleUpdate = () => {
      cfInvalidateCache();
      loadData(true, true);
    };

    const handleLiveSync = (e: Event) => {
      const detail = (e as CustomEvent)?.detail;
      if (typeof detail?.clicks === "number") {
        setSyncedLiveClicks((prev) => Math.max(prev, detail.clicks));
        if (!detail?.fromOverview) {
          cfInvalidateCache();
          loadData(true, true);
        }
      }
    };

    const handleFocus = () => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      handleUpdate();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "lshorter_last_click" || e.key === "lshorter_data_change") {
        handleUpdate();
      } else if (e.key === `lshorter_live_clicks_${userId}` && e.newValue) {
        const val = Number(e.newValue);
        if (!isNaN(val)) setSyncedLiveClicks((prev) => Math.max(prev, val));
      }
    };

    window.addEventListener("lshorter_links_updated", handleUpdate);
    window.addEventListener("lshorter_data_change", handleUpdate);
    window.addEventListener("lshorter_link_clicked", handleUpdate);
    window.addEventListener("lshorter_live_clicks_synced", handleLiveSync);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleFocus);
    window.addEventListener("storage", handleStorage);

    // Cross-tab broadcast receiver
    let channel: BroadcastChannel | null = null;
    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("lshorter_realtime");
        channel.onmessage = (event) => {
          if (event.data?.type === "click" || event.data?.type === "refresh") {
            handleUpdate();
          } else if (event.data?.type === "live_clicks_synced" && typeof event.data?.clicks === "number") {
            setSyncedLiveClicks((prev) => Math.max(prev, event.data.clicks));
            handleUpdate();
          }
        };
      }
    } catch {}

    const pollTimer = setInterval(() => {
      if (typeof document !== "undefined" && document.visibilityState === "hidden") return;
      loadData(true, true);
    }, 15000);

    return () => {
      window.removeEventListener("lshorter_links_updated", handleUpdate);
      window.removeEventListener("lshorter_data_change", handleUpdate);
      window.removeEventListener("lshorter_link_clicked", handleUpdate);
      window.removeEventListener("lshorter_live_clicks_synced", handleLiveSync);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleFocus);
      window.removeEventListener("storage", handleStorage);
      if (channel) channel.close();
      clearInterval(pollTimer);
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
