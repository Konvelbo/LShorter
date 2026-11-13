import crypto from "node:crypto";
import { WORKER_URL, FRONTEND_SECRET } from "@/lib/backend-config";
import { isSafeHttpUrl } from "@/lib/security-utils";

interface StoredWebhookRecord {
  url?: string;
  events?: unknown[];
  secretKey?: string;
  secret_key?: string;
  isActive?: boolean;
}

export async function dispatchUserWebhooks(
  userId: string,
  eventName: string,
  data: Record<string, unknown>
): Promise<number> {
  if (!userId) return 0;

  try {
    const url = new URL(`${WORKER_URL}/api/v1/webhooks`);
    url.searchParams.set("userId", userId);

    const res = await fetch(url.toString(), {
      headers: {
        "X-Frontend-Secret": FRONTEND_SECRET,
        Authorization: `Bearer ${FRONTEND_SECRET}`,
        "X-User-Id": userId,
      },
      cache: "no-store",
      signal: AbortSignal.timeout(2500),
    });

    if (!res.ok) return 0;
    const json = (await res.json().catch(() => null)) as Record<string, unknown> | null;
    const jsonData = json?.data as Record<string, unknown> | StoredWebhookRecord[] | undefined;
    const list: StoredWebhookRecord[] = Array.isArray(jsonData)
      ? jsonData
      : jsonData && typeof jsonData === "object" && Array.isArray(jsonData.webhooks)
        ? (jsonData.webhooks as StoredWebhookRecord[])
        : Array.isArray(json?.webhooks)
          ? (json.webhooks as StoredWebhookRecord[])
          : [];

    const matching = list.filter((wh) => {
      if (!wh || wh.isActive === false || !isSafeHttpUrl(wh.url)) return false;
      const events =
        Array.isArray(wh.events) && wh.events.length > 0
          ? wh.events.map(String)
          : ["click.created"];
      return (
        events.includes("*") ||
        events.includes(eventName) ||
        (eventName === "click.created" && events.includes("click"))
      );
    });

    if (matching.length === 0) return 0;

    const payload = {
      event: eventName,
      timestamp: new Date().toISOString(),
      platform: "LShorter Edge Platform",
      data,
    };
    const rawBody = JSON.stringify(payload);

    const results = await Promise.allSettled(
      matching.map(async (wh) => {
        const signingSecret = String(
          wh.secretKey || wh.secret_key || "whsec_lshorter_default"
        );
        const signature = `sha256=${crypto
          .createHmac("sha256", signingSecret)
          .update(rawBody)
          .digest("hex")}`;

        await fetch(String(wh.url), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-LShorter-Signature": signature,
            "X-LShorter-Event": eventName,
            "User-Agent": "LShorter-Webhook-Delivery/1.0",
          },
          body: rawBody,
          signal: AbortSignal.timeout(3500),
        });
      })
    );

    return results.filter((r) => r.status === "fulfilled").length;
  } catch (err) {
    console.warn("[Webhook Dispatch Warning]:", err);
    return 0;
  }
}
