import { LinkMetadata, ProtectionDecision } from "./types";

export function evaluateProtectionState(
  link: LinkMetadata,
  currentClicks: number,
  baseUrl: string,
): ProtectionDecision {
  const slug = link.slug;

  // 1. Link is Paused / Deactivated
  if (
    link.is_active === 0 ||
    link.is_active === false ||
    link.isActive === false
  ) {
    return {
      type: "redirect",
      url: new URL(`/r/${encodeURIComponent(slug)}/paused`, baseUrl).toString(),
      status: 307,
    };
  }

  // 2. Link is Expired by date/time
  const expTime = link.expires_at || link.expiresAt;
  if (expTime && new Date(expTime).getTime() <= Date.now()) {
    return {
      type: "redirect",
      url: new URL(`/r/${encodeURIComponent(slug)}/expired`, baseUrl).toString(),
      status: 307,
    };
  }

  // 3. Click limit quota reached
  const maxClicks =
    link.max_clicks !== undefined && link.max_clicks !== null
      ? Number(link.max_clicks)
      : link.maxClicks !== undefined && link.maxClicks !== null
        ? Number(link.maxClicks)
        : undefined;

  const fallback = link.fallback_url || link.fallbackUrl;
  if (maxClicks && maxClicks > 0 && currentClicks >= maxClicks) {
    if (fallback) {
      return {
        type: "redirect",
        url: fallback,
        status: 307,
      };
    }
    return {
      type: "redirect",
      url: new URL(`/r/${encodeURIComponent(slug)}/expired`, baseUrl).toString(),
      status: 307,
    };
  }

  // 4. Password Protection
  if (
    link.password ||
    link.is_password_protected ||
    link.has_password
  ) {
    return {
      type: "redirect",
      url: new URL(`/r/${encodeURIComponent(slug)}/gate`, baseUrl).toString(),
      status: 307,
    };
  }

  // 5. Cloaking & PathLock Restricted Browsing
  const isPathLocked = Boolean(
    (link.path_lock_mode && link.path_lock_mode !== "off") ||
    (link.pathLockMode && link.pathLockMode !== "off")
  );

  const isCloaked = Boolean(link.is_cloaked || link.isCloaked);

  if (isCloaked || isPathLocked) {
    return {
      type: "redirect",
      url: new URL(`/r/${encodeURIComponent(slug)}/view`, baseUrl).toString(),
      status: 307,
    };
  }

  // Passed all protection gates
  return { type: "allowed" };
}
