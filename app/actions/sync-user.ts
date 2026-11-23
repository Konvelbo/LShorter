"use server";

import { auth } from "@/auth";
import { convexHttp as convex } from "@/lib/convex-server";
import { api } from "@/convex/_generated/api";
import { syncUserToCloudflare as syncUserServer, type SyncUserPayload } from "@/lib/sync-user-server";

export type { SyncUserPayload };

/**
 * Authenticated Server Action for syncing profile metadata (name, avatarUrl).
 * Security: Strictly uses the authenticated session's userId, email, and authoritative
 * Convex plan — never trusts client-supplied `id`, `email`, or `plan`.
 */
export async function syncUserToCloudflare(data: SyncUserPayload): Promise<{ success: boolean }> {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false };
    }

    const authoritativeId = session.user.id;
    const authoritativeEmail = (session.user.email || "").toLowerCase().trim();
    if (!authoritativeEmail) {
      return { success: false };
    }

    let authoritativePlan: SyncUserPayload["plan"] = "FREEMIUM";
    try {
      const cu = await convex.query(api.users.getCurrentUser, {
        userId: authoritativeId,
        email: authoritativeEmail,
      });
      if (cu?.plan && ["FREE", "FREEMIUM", "PRO", "BUSINESS", "ENTERPRISE"].includes(String(cu.plan).toUpperCase())) {
        authoritativePlan = String(cu.plan).toUpperCase() as SyncUserPayload["plan"];
      }
    } catch {}

    return await syncUserServer({
      id: authoritativeId,
      email: authoritativeEmail,
      name: (data.name || session.user.name || "User").trim().slice(0, 100),
      avatarUrl: data.avatarUrl || session.user.image || undefined,
      provider: data.provider,
      plan: authoritativePlan === "FREE" ? "FREEMIUM" : authoritativePlan,
    });
  } catch {
    return { success: false };
  }
}
