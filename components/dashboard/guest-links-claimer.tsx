"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { showToast } from "@/components/ui/toast-provider";

/**
 * Automatically claims any short links created in the Hero before signup/login,
 * makes them permanent (removes 3-day guest expiry), and refreshes the dashboard list.
 */
export function GuestLinksClaimer() {
  const { status } = useSession();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (status !== "authenticated" || attemptedRef.current) return;
    attemptedRef.current = true;

    let cancelled = false;

    (async () => {
      try {
        const res = await fetch("/api/public/claim", {
          method: "POST",
          credentials: "same-origin",
          cache: "no-store",
        });
        if (!res.ok || cancelled) return;

        const data = await res.json().catch(() => null);
        const count = Number(data?.claimedCount || 0);
        if (count > 0 && !cancelled) {
          showToast.success(
            count === 1
              ? "Your link has been added permanently to your account!"
              : `${count} links have been added permanently to your account!`
          );
          if (typeof window !== "undefined") {
            window.dispatchEvent(new CustomEvent("lshorter_links_updated"));
            window.dispatchEvent(new Event("lshorter_data_change"));
          }
        }
      } catch {
        // Non-blocking background sync
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [status]);

  return null;
}

export default GuestLinksClaimer;
