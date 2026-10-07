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

export async function markLinkExpiredAsync(linkIdOrSlug: string): Promise<void> {
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
  } catch {}
}
