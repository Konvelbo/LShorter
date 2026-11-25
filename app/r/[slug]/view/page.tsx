import React from "react";
import { notFound, redirect } from "next/navigation";
import { CloakedViewer, CloakedViewerLink } from "@/components/cloaked-viewer";
import { fetchWorkerLink } from "@/lib/redirect-engine";

interface ResolvedLinkResult {
  link: CloakedViewerLink | null;
  requiresGate: boolean;
}

async function getLink(slug: string): Promise<ResolvedLinkResult> {
  try {
    const found = await fetchWorkerLink(slug);
    if (found && (found.target_url || found.targetUrl)) {
      // 1. Link is Paused / Deactivated
      if (
        found.is_active === 0 ||
        found.is_active === false ||
        (found as any).isActive === false
      ) {
        redirect(`/r/${encodeURIComponent(slug)}/paused`);
      }

      // 2. Link is Expired by date/time
      const expTime = found.expires_at || (found as any).expiresAt;
      if (expTime && new Date(expTime).getTime() <= Date.now()) {
        redirect(`/r/${encodeURIComponent(slug)}/expired`);
      }

      // 3. Password Protection Gate
      const hasPassword = Boolean(
        found.password ||
        found.is_password_protected ||
        (found as any).isPasswordProtected ||
        (found as any).has_password ||
        (found as any).hasPassword
      );
      if (hasPassword) {
        return { link: null, requiresGate: true };
      }

      const rawTarget = String(found.target_url || found.targetUrl || "").trim();
      const targetUrl =
        rawTarget.startsWith("http://") || rawTarget.startsWith("https://")
          ? rawTarget
          : `https://${rawTarget}`;

      return {
        link: {
          slug: found.slug || slug,
          targetUrl,
          metaTitle: found.meta_title || found.og_title || found.slug || slug,
          isCloaked: true,
          pathLockMode: found.path_lock_mode || found.pathLockMode || "off",
          pathLockPrefix: found.path_lock_prefix || found.pathLockPrefix || "",
          pathLockMessage:
            found.path_lock_message || found.pathLockMessage || "",
          pathLockAction:
            found.path_lock_action || (found as any).pathLockAction || "block",
          pathLockFallbackPath:
            found.path_lock_fallback_path ||
            (found as any).pathLockFallbackPath ||
            "",
          hasUnlockPassword: Boolean(
            found.path_lock_password || (found as any).pathLockPassword
          ),
        },
        requiresGate: false,
      };
    }
  } catch (e: any) {
    if (e?.digest?.startsWith("NEXT_REDIRECT")) throw e;
  }
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
