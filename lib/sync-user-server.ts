import { WORKER_URL as BASE_URL, FRONTEND_SECRET as SECRET } from "@/lib/backend-config";

export interface SyncUserPayload {
  id: string;
  name: string;
  email: string;
  plan?: "FREE" | "FREEMIUM" | "PRO" | "BUSINESS" | "ENTERPRISE";
  avatarUrl?: string;
  provider?: string;
}

/**
 * Trusted server-to-server user & plan sync to Cloudflare D1.
 * NOTE: Not a "use server" Server Action, so it can never be invoked directly by browser clients.
 */
export async function syncUserToCloudflare(data: SyncUserPayload): Promise<{ success: boolean }> {
  try {
    const secret = SECRET;
    if (!secret) return { success: false };

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

    if (data.plan && data.id) {
      await fetch(`${BASE_URL}/api/v1/users/${encodeURIComponent(data.id)}`, {
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
      return { success: false };
    }

    return { success: true };
  } catch (err: any) {
    console.warn("[syncUserToCloudflare] Fetch error:", err?.message || err);
    return { success: false };
  }
}
