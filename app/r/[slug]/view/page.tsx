import React from "react";
import { notFound } from "next/navigation";
import { CloakedViewer, CloakedViewerLink } from "@/components/cloaked-viewer";

import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

async function getLink(slug: string): Promise<CloakedViewerLink | null> {
  try {
    // 1. Recherche directe par slug/id auprès du Worker Cloudflare
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
        return {
          slug: found.slug || slug,
          targetUrl: found.target_url || found.targetUrl,
          metaTitle: found.meta_title || found.og_title || found.slug || slug,
          isCloaked: true,
          pathLockMode: found.path_lock_mode || found.pathLockMode || "off",
          pathLockPrefix: found.path_lock_prefix || found.pathLockPrefix || "",
          pathLockMessage:
            found.path_lock_message || found.pathLockMessage || "",
          pathLockPassword:
            found.path_lock_password || found.pathLockPassword || "",
        };
      }
    }

    // 2. Re-tentative sur l'endpoint de liste du Worker
    const res = await fetch(`${WORKER_URL}/api/v1/links?limit=100`, {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
      },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : [];
    const found = list.find(
      (l: any) => l.slug?.toLowerCase() === slug.toLowerCase(),
    );
    if (found) {
      return {
        slug: found.slug,
        targetUrl: found.target_url || found.targetUrl,
        metaTitle: found.meta_title || found.og_title || found.slug,
        isCloaked: true,
        pathLockMode: found.path_lock_mode || found.pathLockMode || "off",
        pathLockPrefix: found.path_lock_prefix || found.pathLockPrefix || "",
        pathLockMessage: found.path_lock_message || found.pathLockMessage || "",
        pathLockPassword:
          found.path_lock_password || found.pathLockPassword || "",
      };
    }
  } catch {}
  return null;
}

export default async function CloakedViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const link = await getLink(slug);

  if (!link || !link.targetUrl) {
    notFound();
  }

  return <CloakedViewer link={link} />;
}
