import { LinkMetadata } from "./types";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

export async function fetchWorkerLink(slug: string): Promise<LinkMetadata | null> {
  try {
    const singleRes = await fetch(
      `${WORKER_URL}/api/v1/links/${encodeURIComponent(slug)}`,
      {
        headers: {
          "X-Frontend-Secret": FRONTEND_SECRET,
          Authorization: `Bearer ${FRONTEND_SECRET}`,
        },
        cache: "no-store",
      },
    ).catch(() => null);

    if (singleRes && singleRes.ok) {
      const singleJson = await singleRes.json().catch(() => null);
      const found = singleJson?.data || singleJson;
      if (found && (found.target_url || found.targetUrl)) {
        return found;
      }
    }

    const listRes = await fetch(`${WORKER_URL}/api/v1/links?limit=100`, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
      },
      cache: "no-store",
    }).catch(() => null);

    if (listRes && listRes.ok) {
      const data = await listRes.json().catch(() => null);
      const list = Array.isArray(data?.data) ? data.data : [];
      return (
        list.find(
          (l: any) =>
            l.slug?.toLowerCase() === slug.toLowerCase() || l.id === slug,
        ) || null
      );
    }
  } catch (err) {
    console.warn("[Worker Link Lookup error]:", err);
  }
  return null;
}

export async function markLinkExpiredAsync(linkIdOrSlug: string, linkMeta?: any): Promise<void> {
  try {
    fetch(`${WORKER_URL}/api/v1/links/${encodeURIComponent(linkIdOrSlug)}`, {
      method: "PATCH",
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ is_active: 0, isActive: false }),
    }).catch(() => {});

    // Check Cloudflare D1 target alerts configured for expiration on this link
    try {
      const { executeD1Query } = await import("@/lib/d1-client");
      const alerts = await executeD1Query<any>(
        `SELECT id, user_id, title, channel, notify_email, notify_bell
         FROM target_alerts
         WHERE (link_id = ? OR link_id IN (SELECT id FROM links WHERE slug = ?))
           AND (notify_expired = 1 OR notify_expiration = 1)
           AND (last_notified_at IS NULL OR last_notified_at = '')
         LIMIT 5`,
        [linkIdOrSlug, linkIdOrSlug]
      );

      if (alerts && alerts.length > 0) {
        for (const alert of alerts) {
          await executeD1Query(
            `UPDATE target_alerts SET status = 'expired', last_notified_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
            [alert.id]
          ).catch(() => {});

          if (alert.user_id) {
            try {
              const { fetchMutation } = await import("convex/nextjs");
              const { api } = await import("@/convex/_generated/api");
              const linkTitle = linkMeta?.meta_title || linkMeta?.og_title || linkMeta?.title || linkIdOrSlug;
              await fetchMutation(api.notifications.createNotification, {
                orgId: alert.user_id,
                title: `Lien expiré : ${linkTitle}`,
                message: `Votre lien court "${linkTitle}" est arrivé à expiration à cet instant précis. Le trafic est désormais redirigé vers la page d'expiration.`,
                type: "WARNING",
                linkUrl: "/dashboard/links",
              }).catch(() => {});
            } catch {}
          }
        }
      }
    } catch {}
  } catch {}
}
