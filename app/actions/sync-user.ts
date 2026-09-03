"use server";

/**
 * syncUserToCloudflare — Server Action
 * ─────────────────────────────────────────────────────────────────────────────
 * Synchronises a user's profile and plan to the Cloudflare Edge Worker via a
 * secure server-to-server call authenticated with X-Frontend-Secret.
 *
 * Call this action:
 *  1. After a new user signs up (NextAuth signIn callback / registerWithEmail).
 *  2. After a plan upgrade (updatePlan Convex mutation resolves successfully).
 *
 * Never expose FRONTEND_API_SECRET to the client — this runs server-side only.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_API_URL ||
  "https://lshorter-api.fiatechnologiecam.workers.dev";

const SECRET = process.env.FRONTEND_API_SECRET || "";

export interface SyncUserPayload {
  id: string;
  name: string;
  email: string;
  plan?: "FREEMIUM" | "PRO" | "BUSINESS";
  avatarUrl?: string;
  provider?: string;
}

export async function syncUserToCloudflare(data: SyncUserPayload): Promise<{ success: boolean }> {
  try {
    const secret = SECRET || "lsh_secret_live_prod_2026";

    // 1. Sync User / Upsert in D1
    const res = await fetch(`${BASE_URL}/api/v1/users/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Frontend-Secret": secret,
        Authorization: `Bearer ${secret}`,
        "X-User-Id": data.id,
      },
      body: JSON.stringify(data),
      cache: "no-store",
    });

    // 2. Also ensure PATCH /api/v1/users/:userId is called if plan is specified
    if (data.plan && data.id) {
      await fetch(`${BASE_URL}/api/v1/users/${data.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "X-Frontend-Secret": secret,
          Authorization: `Bearer ${secret}`,
          "X-User-Id": data.id,
        },
        body: JSON.stringify({ plan: data.plan, name: data.name }),
        cache: "no-store",
      }).catch((e) => console.warn("[syncUserToCloudflare] PATCH plan error:", e));
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      console.warn("[syncUserToCloudflare] Non-OK response:", err);
      return { success: false };
    }

    return { success: true };
  } catch (err: any) {
    console.warn("[syncUserToCloudflare] Fetch error:", err?.message || err);
    return { success: false };
  }
}
