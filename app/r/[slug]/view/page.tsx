import React from "react";
import { notFound, redirect } from "next/navigation";
import { CloakedViewer, CloakedViewerLink } from "@/components/cloaked-viewer";

import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";

interface ResolvedLinkResult {
  link: CloakedViewerLink | null;
  requiresGate: boolean;
}

async function getLink(slug: string): Promise<ResolvedLinkResult> {
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
        const hasPassword = Boolean(
          found.password ||
          found.path_lock_password ||
          found.pathLockPassword ||
          found.is_password_protected ||
          found.isPasswordProtected
        );
        if (hasPassword) {
          return { link: null, requiresGate: true };
        }
        return {
          link: {
            slug: found.slug || slug,
            targetUrl: found.target_url || found.targetUrl,
            metaTitle: found.meta_title || found.og_title || found.slug || slug,
            isCloaked: true,
            pathLockMode: found.path_lock_mode || found.pathLockMode || "off",
            pathLockPrefix: found.path_lock_prefix || found.pathLockPrefix || "",
            pathLockMessage:
              found.path_lock_message || found.pathLockMessage || "",
          },
          requiresGate: false,
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
    if (!res.ok) return { link: null, requiresGate: false };
    const data = await res.json();
    const list = Array.isArray(data?.data) ? data.data : [];
    const found = list.find(
      (l: any) => l.slug?.toLowerCase() === slug.toLowerCase(),
    );
    if (found) {
      const hasPassword = Boolean(
        found.password ||
        found.path_lock_password ||
        found.pathLockPassword ||
        found.is_password_protected ||
        found.isPasswordProtected
      );
      if (hasPassword) {
        return { link: null, requiresGate: true };
      }
      return {
        link: {
          slug: found.slug,
          targetUrl: found.target_url || found.targetUrl,
          metaTitle: found.meta_title || found.og_title || found.slug,
          isCloaked: true,
          pathLockMode: found.path_lock_mode || found.pathLockMode || "off",
          pathLockPrefix: found.path_lock_prefix || found.pathLockPrefix || "",
          pathLockMessage: found.path_lock_message || found.pathLockMessage || "",
        },
        requiresGate: false,
      };
    }
  } catch {}
  return { link: null, requiresGate: false };
}

export default async function CloakedViewPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getLink(slug);

  if (result.requiresGate) {
    redirect(`/r/${slug}/gate`);
  }

  if (!result.link || !result.link.targetUrl) {
    notFound();
  }

  return <CloakedViewer link={result.link} />;
}
